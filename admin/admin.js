/* ========================================
   Trust Motors - Admin Panel Logic
   ========================================
   CONFIGURACIÓN: Reemplaza SUPABASE_URL y SUPABASE_ANON_KEY
   con los valores de tu proyecto en Supabase.
   ======================================== */

/** Cambiar a true cuando quieras volver a exigir login */
const REQUIRE_AUTH = false;

const SUPABASE_URL = window.TRUST_MOTORS_SUPABASE?.url || 'https://rjsfkrgsyduiwyamhdkg.supabase.co';
const SUPABASE_ANON_KEY = window.TRUST_MOTORS_SUPABASE?.key || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqc2ZrcmdzeWR1aXd5YW1oZGtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2Mjg5OTksImV4cCI6MjA5NTIwNDk5OX0.zgmu6vtJGmIILJzEl75vfCn9oiM6j1KqqgkIzw5pg2o';

if (!window.supabase) {
  document.body.innerHTML = '<p style="padding:2rem;font-family:sans-serif;">No se pudo cargar Supabase. Revisa tu conexión e intenta de nuevo.</p>';
  throw new Error('Supabase JS no cargado');
}

/** Cliente Supabase (sb evita choques con el global window.supabase del CDN) */
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    detectSessionInUrl: true,
    autoRefreshToken: true,
  },
});

/* ── Helpers ─────────────────────────── */

function formatAuthError(error) {
  if (!error) return 'No se pudo iniciar sesión. Intenta nuevamente.';
  const msg = error.message || '';
  const code = error.code || '';

  if (code === 'email_not_confirmed' || msg.includes('Email not confirmed')) {
    return 'Tu email aún no está confirmado. En Supabase: Authentication → Users → clic en tu usuario → «Confirm user». O usa «Enviar enlace al correo» abajo.';
  }
  if (msg.includes('Invalid login credentials')) {
    return 'Contraseña incorrecta, email sin confirmar, o usuario creado por invitación sin contraseña. Prueba «Restablecer contraseña» o «Enviar enlace al correo».';
  }
  if (msg.includes('User not found')) {
    return 'No hay ningún usuario con ese email en Authentication.';
  }

  return msg;
}

function getLoginEmail() {
  const input = document.getElementById('loginEmail');
  return input ? input.value.trim().toLowerCase() : '';
}

function setLoginMessage(text, isSuccess = false) {
  const errEl = document.getElementById('loginError');
  if (!errEl) return;
  errEl.textContent = text;
  errEl.style.color = isSuccess ? 'var(--success)' : 'var(--danger)';
}

function formatPrice(n) {
  return '$' + Number(n).toLocaleString('es-CL');
}

function formatKm(n) {
  return Number(n).toLocaleString('es-CL') + ' km';
}

function formatDate(d) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('es-CL');
}

function showToast(msg, type = '') {
  const container = document.getElementById('toastContainer');
  if (!container) {
    console.warn('[Admin]', msg);
    return;
  }
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function openModal(title, bodyHTML, options = {}) {
  const modal = document.getElementById('adminModal');
  const titleEl = document.getElementById('adminModalTitle');
  const bodyEl = document.getElementById('adminModalBody');
  if (!modal || !titleEl || !bodyEl) {
    console.error('Modal del admin no encontrado en el HTML');
    showToast('Error de interfaz: recarga la página (Ctrl+Shift+R)', 'error');
    return;
  }
  titleEl.textContent = title;
  bodyEl.innerHTML = bodyHTML;
  const modalBox = modal.querySelector('.admin-modal');
  modalBox?.classList.toggle('modal-wide', !!options.wide);
  modal.classList.add('active');
  document.body.classList.add('admin-modal-open');
  modal.scrollTop = 0;
}

function closeModal() {
  document.getElementById('adminModal')?.classList.remove('active');
  document.querySelector('#adminModal .admin-modal')?.classList.remove('modal-wide');
  document.body.classList.remove('admin-modal-open');
  revokeVehiclePreviewUrls();
}


/* ── Auth ────────────────────────────── */

function initAdminPanel() {
  showAdmin();
  const hash = (location.hash || '').replace('#', '');
  if (hash && pageMap[hash]) {
    loadPageData(hash);
  } else {
    loadDashboard();
  }
  updateSupabaseStatus();
}

async function updateSupabaseStatus() {
  const el = document.getElementById('supabaseStatus');
  if (!el) return;

  el.textContent = 'Comprobando conexión con Supabase…';
  el.className = 'supabase-status pending';

  const { error: tableError } = await sb.from('vehicles').select('id').limit(1);
  if (tableError) {
    el.textContent = `Error Supabase: ${tableError.message}. Ejecuta sql/open_admin_no_auth.sql en el SQL Editor.`;
    el.className = 'supabase-status error';
    showToast('Sin permisos en Supabase. Ejecuta open_admin_no_auth.sql', 'error');
    return;
  }

  const { error: viewError } = await sb.from('dashboard_summary').select('*').single();
  if (viewError) {
    el.textContent = `Conectado, pero falta la vista dashboard: ${viewError.message}`;
    el.className = 'supabase-status warn';
    return;
  }

  storageBucketReady = await isStorageReady();
  if (!storageBucketReady) {
    el.innerHTML = 'Base de datos OK. <strong>Falta bucket «vehicles»</strong> en Supabase → Storage (público). Puedes guardar autos sin fotos o pegar URLs de imagen.';
    el.className = 'supabase-status warn';
    return;
  }

  el.textContent = 'Supabase conectado (datos + fotos)';
  el.className = 'supabase-status ok';
}

async function isStorageReady() {
  if (storageBucketReady !== null) return storageBucketReady;
  const { error } = await sb.storage.from(STORAGE_BUCKET).list('', { limit: 1 });
  storageBucketReady = !error;
  return storageBucketReady;
}

function setAuthMode(requiresAuth) {
  document.body.classList.toggle('admin-no-auth', !requiresAuth);
  document.body.classList.toggle('admin-requires-auth', requiresAuth);
  const loginEl = document.getElementById('loginScreen');
  if (loginEl) loginEl.hidden = !requiresAuth;
}

async function checkSession() {
  if (!REQUIRE_AUTH) {
    setAuthMode(false);
    initAdminPanel();
    return;
  }

  setAuthMode(true);
  const { data: { session } } = await sb.auth.getSession();
  if (session) {
    initAdminPanel();
  }
}

function setupAuth() {
  if (!REQUIRE_AUTH) return;

  const loginForm = document.getElementById('loginForm');
  if (!loginForm) return;

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = getLoginEmail();
  const password = document.getElementById('loginPassword').value;
  setLoginMessage('');

  if (!email) {
    setLoginMessage('Ingresa tu email.');
    return;
  }

  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.textContent = 'Ingresando...';

  const { data, error } = await sb.auth.signInWithPassword({ email, password });

  btn.disabled = false;
  btn.textContent = 'Iniciar Sesión';

  if (error) {
    setLoginMessage(formatAuthError(error));
    console.error('Login error:', error.code, error.message);
    return;
  }

  if (!data.session) {
    setLoginMessage('No se pudo crear la sesión. Confirma tu email en Supabase o usa el enlace mágico.');
    return;
  }

  initAdminPanel();
});

document.getElementById('btnResetPassword')?.addEventListener('click', async () => {
  const email = getLoginEmail();
  if (!email) {
    setLoginMessage('Escribe tu email arriba y luego pulsa Restablecer contraseña.');
    return;
  }

  const { error } = await sb.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.href.split('#')[0],
  });

  if (error) {
    setLoginMessage(formatAuthError(error));
  } else {
    setLoginMessage(`Te enviamos un correo a ${email} para crear o cambiar tu contraseña.`, true);
  }
});

document.getElementById('btnMagicLink')?.addEventListener('click', async () => {
  const email = getLoginEmail();
  if (!email) {
    setLoginMessage('Escribe tu email arriba y luego pulsa Enviar enlace al correo.');
    return;
  }

  const btn = document.getElementById('btnMagicLink');
  btn.disabled = true;

  const { error } = await sb.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: window.location.href.split('#')[0],
    },
  });

  btn.disabled = false;

  if (error) {
    setLoginMessage(formatAuthError(error));
  } else {
    setLoginMessage(`Revisa ${email}: te enviamos un enlace para entrar sin contraseña.`, true);
  }
});

document.getElementById('btnLogout')?.addEventListener('click', async () => {
  await sb.auth.signOut();
  setAuthMode(true);
  const loginEl = document.getElementById('loginScreen');
  if (loginEl) loginEl.hidden = false;
  document.getElementById('adminLayout').style.display = 'none';
});

} // setupAuth

function showAdmin() {
  const layout = document.getElementById('adminLayout');
  if (layout) layout.style.display = 'flex';
  const banner = document.getElementById('authWarningBanner');
  if (banner) banner.style.display = 'block';
}

/* ── Navigation ──────────────────────── */

const pageMap = {
  dashboard: { el: 'pageDashboard', title: 'Dashboard', load: loadDashboard },
  vehicles: { el: 'pageVehicles', title: 'Vehículos', load: loadVehicles },
  siteMedia: { el: 'pageSiteMedia', title: 'Imágenes del sitio', load: loadSiteMedia },
  sales: { el: 'pageSales', title: 'Ventas', load: loadSales },
  customers: { el: 'pageCustomers', title: 'Clientes', load: loadCustomers },
  inquiries: { el: 'pageInquiries', title: 'Consultas', load: loadInquiries },
  expenses: { el: 'pageExpenses', title: 'Gastos', load: loadExpenses },
};

function navigateTo(page) {
  if (!pageMap[page]) return;

  document.querySelectorAll('.sidebar-link[data-page]').forEach(b => b.classList.remove('active'));
  document.querySelector(`.sidebar-link[data-page="${page}"]`)?.classList.add('active');

  document.querySelectorAll('.pages-viewport .page, .main-content > .page').forEach(p => {
    p.classList.remove('active');
  });

  const pageEl = document.getElementById(pageMap[page].el);
  if (pageEl) pageEl.classList.add('active');

  const titleEl = document.getElementById('pageTitle');
  if (titleEl) titleEl.textContent = pageMap[page].title;
  document.getElementById('sidebar')?.classList.remove('open');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (location.hash !== '#' + page) location.hash = page;

  loadPageData(page);
}

async function loadPageData(page) {
  const info = pageMap[page];
  if (!info?.load) return;
  try {
    await info.load();
  } catch (err) {
    console.error(err);
    showToast('Error en ' + info.title + ': ' + err.message, 'error');
  }
}

window.navigateTo = navigateTo;
window.loadPageData = loadPageData;

/* ── Dashboard ───────────────────────── */

async function loadDashboard() {
  const { data: summary } = await sb.from('dashboard_summary').select('*').single();

  if (summary) {
    document.getElementById('statAvailable').textContent = summary.vehicles_available;
    document.getElementById('statReserved').textContent = summary.vehicles_reserved;
    document.getElementById('statSold').textContent = summary.vehicles_sold;
    document.getElementById('statMonthRevenue').textContent = formatPrice(summary.month_revenue);

    const countEl = document.getElementById('inquiryCount');
    if (summary.unread_inquiries > 0) {
      countEl.textContent = summary.unread_inquiries;
      countEl.style.display = 'inline';
    } else {
      countEl.style.display = 'none';
    }
  }

  const { data: monthly } = await sb.from('monthly_sales').select('*');
  renderChart(monthly || []);

  const { data: recentSalesData } = await sb
    .from('sales_detail')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  const recentContainer = document.getElementById('recentSales');
  if (recentSalesData && recentSalesData.length > 0) {
    recentContainer.innerHTML = recentSalesData.map(s => `
      <div class="recent-item">
        <div class="recent-item-icon" style="background:${s.status === 'completada' ? '#dcfce7' : '#fef3c7'};color:${s.status === 'completada' ? '#16a34a' : '#d97706'};">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V7m0 10v1"/></svg>
        </div>
        <div class="recent-item-info">
          <strong>${s.vehicle_name || 'Vehículo'}</strong>
          <span>${s.customer_name || 'Sin cliente'} · ${formatDate(s.sale_date)}</span>
        </div>
        <span class="recent-item-value">${formatPrice(s.sale_price)}</span>
      </div>
    `).join('');
  } else {
    recentContainer.innerHTML = '<p class="text-muted">No hay ventas registradas aún</p>';
  }

  const { data: recentInq } = await sb
    .from('inquiries')
    .select('*, vehicles(brand, model, year)')
    .order('created_at', { ascending: false })
    .limit(5);

  const inqContainer = document.getElementById('recentInquiries');
  if (recentInq && recentInq.length > 0) {
    inqContainer.innerHTML = recentInq.map(i => `
      <div class="recent-item">
        <div class="recent-item-icon" style="background:${i.is_read ? '#f3f4f6' : '#dbeafe'};color:${i.is_read ? '#9ca3af' : '#2563eb'};">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
        </div>
        <div class="recent-item-info">
          <strong>${i.name}</strong>
          <span>${i.vehicles ? i.vehicles.brand + ' ' + i.vehicles.model + ' ' + i.vehicles.year : 'General'} · ${i.phone}</span>
        </div>
        <span class="recent-item-value" style="font-weight:400;font-size:.82rem;color:var(--text-light);">${formatDate(i.created_at)}</span>
      </div>
    `).join('');
  } else {
    inqContainer.innerHTML = '<p class="text-muted">No hay consultas aún</p>';
  }
}

function renderChart(data) {
  const container = document.getElementById('chartContainer');
  if (!container) return;
  if (!data.length) {
    container.innerHTML = '<p class="text-muted" style="text-align:center;padding:3rem;">No hay datos de ventas mensuales</p>';
    return;
  }
  const maxRevenue = Math.max(...data.map(d => d.revenue), 1);
  container.innerHTML = `<div class="css-chart">${data.map(d => {
    const pct = Math.max((d.revenue / maxRevenue) * 100, 3);
    return `<div class="css-chart-bar" style="height:${pct}%;" title="${d.month_label}: ${formatPrice(d.revenue)}">
      <span class="bar-value">${d.count}</span>
      <span class="bar-label">${d.month_label.split(' ')[0]}</span>
    </div>`;
  }).join('')}</div>`;
}

/* ── Vehicle images ──────────────────── */

const STORAGE_BUCKET = 'vehicles';
const MAX_IMAGE_WIDTH = 1920;
const IMAGE_JPEG_QUALITY = 0.82;
let vehicleImageQueue = [];
let storageBucketReady = null;
let imageDragIndex = null;

function resetVehicleImages(urls = []) {
  vehicleImageQueue = (urls || []).map(url => ({ type: 'url', url }));
}

function revokeVehiclePreviewUrls() {
  vehicleImageQueue.forEach(item => {
    if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
  });
}

function initVehicleImageManager(urls = []) {
  resetVehicleImages(urls);
  renderVehicleImageList();
  updateVehicleLivePreview();
  bindVehicleImageControls();
}

function addVehicleImageUrl(urlInput) {
  const url = urlInput.value.trim();
  if (!url) return;
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error();
  } catch {
    showToast('URL de imagen no válida', 'error');
    return;
  }
  vehicleImageQueue.push({ type: 'url', url });
  urlInput.value = '';
  renderVehicleImageList();
  updateVehicleLivePreview();
}

function addVehicleImageFiles(fileList) {
  Array.from(fileList || []).forEach(file => {
    if (!file.type.startsWith('image/')) return;
    const previewUrl = URL.createObjectURL(file);
    vehicleImageQueue.push({ type: 'file', file, previewUrl });
  });
  renderVehicleImageList();
  updateVehicleLivePreview();
}

function bindVehicleImageControls() {
  const input = document.getElementById('vf_images_input');
  const addBtn = document.getElementById('btnAddImages');
  const urlInput = document.getElementById('vf_image_url');
  const addUrlBtn = document.getElementById('btnAddImageUrl');
  const list = document.getElementById('vehicleImageList');
  const dropZone = document.getElementById('vehicleImageDropZone');

  if (addBtn && input) {
    addBtn.onclick = () => input.click();
    input.onchange = () => {
      addVehicleImageFiles(input.files);
      input.value = '';
    };
  }

  if (addUrlBtn && urlInput) {
    addUrlBtn.onclick = () => addVehicleImageUrl(urlInput);
    urlInput.onkeydown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addVehicleImageUrl(urlInput);
      }
    };
  }

  if (dropZone) {
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('drag-over');
    });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('drag-over');
      addVehicleImageFiles(e.dataTransfer?.files);
    });
  }

  if (list) {
    list.onclick = (e) => {
      const btn = e.target.closest('button[data-img-action]');
      if (!btn) return;
      const index = parseInt(btn.dataset.index, 10);
      const action = btn.dataset.imgAction;
      if (action === 'up') moveVehicleImage(index, -1);
      if (action === 'down') moveVehicleImage(index, 1);
      if (action === 'remove') removeVehicleImage(index);
    };
  }
}

function bindVehicleImageDragReorder(list) {
  list.querySelectorAll('.image-manager-item').forEach((el) => {
    el.setAttribute('draggable', 'true');
    el.addEventListener('dragstart', (e) => {
      imageDragIndex = parseInt(el.dataset.index, 10);
      el.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });
    el.addEventListener('dragend', () => {
      el.classList.remove('dragging');
      imageDragIndex = null;
      list.querySelectorAll('.image-manager-item').forEach(item => item.classList.remove('drag-over'));
    });
    el.addEventListener('dragover', (e) => {
      e.preventDefault();
      el.classList.add('drag-over');
    });
    el.addEventListener('dragleave', () => el.classList.remove('drag-over'));
    el.addEventListener('drop', (e) => {
      e.preventDefault();
      el.classList.remove('drag-over');
      const toIndex = parseInt(el.dataset.index, 10);
      if (imageDragIndex == null || imageDragIndex === toIndex) return;
      const copy = [...vehicleImageQueue];
      const [moved] = copy.splice(imageDragIndex, 1);
      copy.splice(toIndex, 0, moved);
      vehicleImageQueue = copy;
      renderVehicleImageList();
      updateVehicleLivePreview();
    });
  });
}

function renderVehicleImageList() {
  const list = document.getElementById('vehicleImageList');
  if (!list) return;

  if (vehicleImageQueue.length === 0) {
    list.innerHTML = '<p class="text-muted" style="font-size:.85rem;">Sin imágenes. Agrega fotos para mostrar el auto en la web.</p>';
    return;
  }

  list.innerHTML = vehicleImageQueue.map((item, index) => {
    const src = escapeHtml(item.previewUrl || item.url || '');
    const isCover = index === 0;
    return `
      <div class="image-manager-item ${isCover ? 'is-cover' : ''}" data-index="${index}" title="Arrastra para reordenar">
        ${isCover ? '<span class="image-cover-badge">Portada</span>' : ''}
        <img src="${src}" alt="Imagen ${index + 1}">
        <div class="image-manager-actions">
          <button type="button" data-img-action="up" data-index="${index}" ${index === 0 ? 'disabled' : ''}>↑</button>
          <button type="button" data-img-action="down" data-index="${index}" ${index === vehicleImageQueue.length - 1 ? 'disabled' : ''}>↓</button>
          <button type="button" data-img-action="remove" data-index="${index}" style="color:var(--danger);">✕</button>
        </div>
      </div>
    `;
  }).join('');
  bindVehicleImageDragReorder(list);
}

function moveVehicleImage(index, direction) {
  const next = index + direction;
  if (next < 0 || next >= vehicleImageQueue.length) return;
  const copy = [...vehicleImageQueue];
  [copy[index], copy[next]] = [copy[next], copy[index]];
  vehicleImageQueue = copy;
  renderVehicleImageList();
  updateVehicleLivePreview();
};

function removeVehicleImage(index) {
  const item = vehicleImageQueue[index];
  if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
  vehicleImageQueue.splice(index, 1);
  renderVehicleImageList();
  updateVehicleLivePreview();
};

function updateVehicleLivePreview() {
  const box = document.getElementById('vehicleLivePreview');
  if (!box) return;

  const brand = document.getElementById('vf_brand')?.value || 'Marca';
  const model = document.getElementById('vf_model')?.value || 'Modelo';
  const year = document.getElementById('vf_year')?.value || new Date().getFullYear();
  const price = document.getElementById('vf_price')?.value;
  const cover = vehicleImageQueue[0];
  const coverSrc = cover ? (cover.previewUrl || cover.url) : null;

  const safeCover = coverSrc ? escapeHtml(coverSrc) : '';
  box.innerHTML = `
    <h4>Vista previa (así se verá en la web)</h4>
    <div class="preview-card">
      ${safeCover
        ? `<img src="${safeCover}" alt="Vista previa">`
        : '<div style="height:160px;background:#f3f4f6;display:flex;align-items:center;justify-content:center;color:#9ca3af;font-size:.85rem;">Sin foto</div>'}
      <div class="preview-card-body">
        <h5>${escapeHtml(brand)} ${escapeHtml(model)}</h5>
        <p class="text-muted" style="font-size:.82rem;">${escapeHtml(year)}</p>
        ${price ? `<p style="font-weight:700;margin-top:.35rem;">${formatPrice(price)}</p>` : ''}
      </div>
    </div>
  `;
}

async function compressImageFile(file) {
  if (!file?.type?.startsWith('image/') || file.size < 180000) return file;
  return new Promise((resolve) => {
    const img = new Image();
    const blobUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(blobUrl);
      let { width, height } = img;
      if (width <= MAX_IMAGE_WIDTH) {
        resolve(file);
        return;
      }
      const scale = MAX_IMAGE_WIDTH / width;
      width = MAX_IMAGE_WIDTH;
      height = Math.round(height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          const name = file.name.replace(/\.[^.]+$/, '') + '.jpg';
          resolve(new File([blob], name, { type: 'image/jpeg' }));
        },
        'image/jpeg',
        IMAGE_JPEG_QUALITY
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(blobUrl);
      resolve(file);
    };
    img.src = blobUrl;
  });
}

function storagePathFromPublicUrl(url) {
  if (!url || !url.includes('/storage/v1/object/public/')) return null;
  const marker = `/storage/v1/object/public/${STORAGE_BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(url.slice(idx + marker.length));
}

async function deleteVehicleStorageFiles(vehicleId, imageUrls = []) {
  if (!(await isStorageReady())) return;
  const paths = new Set();
  (imageUrls || []).forEach((url) => {
    const p = storagePathFromPublicUrl(url);
    if (p) paths.add(p);
  });
  const { data: listed } = await sb.storage.from(STORAGE_BUCKET).list(vehicleId, { limit: 200 });
  (listed || []).forEach((f) => {
    if (f?.name) paths.add(`${vehicleId}/${f.name}`);
  });
  if (paths.size === 0) return;
  const { error } = await sb.storage.from(STORAGE_BUCKET).remove([...paths]);
  if (error) console.warn('Storage cleanup:', error.message);
}

async function uploadVehicleImages(vehicleId) {
  const urls = [];
  let pendingFiles = 0;
  const canUpload = await isStorageReady();

  for (const item of vehicleImageQueue) {
    if (item.type === 'url' && item.url) {
      urls.push(item.url);
      continue;
    }
    if (item.type === 'file' && item.file) {
      if (!canUpload) {
        pendingFiles += 1;
        continue;
      }
      const fileToUpload = await compressImageFile(item.file);
      const safeName = fileToUpload.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `${vehicleId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;
      const { error } = await sb.storage.from(STORAGE_BUCKET).upload(path, fileToUpload, {
        cacheControl: '3600',
        upsert: false,
        contentType: fileToUpload.type || 'image/jpeg',
      });
      if (error) throw new Error('Error subiendo imagen: ' + error.message);
      const { data } = sb.storage.from(STORAGE_BUCKET).getPublicUrl(path);
      urls.push(data.publicUrl);
    }
  }

  if (pendingFiles > 0) {
    throw new Error(
      `${pendingFiles} foto(s) sin subir. En Supabase ejecuta sql/setup_completo.sql (crea el bucket «vehicles»). También puedes pegar URLs de imagen.`
    );
  }

  return urls;
}

/* ── Vehicles CRUD ───────────────────── */

async function loadVehicles() {
  let query = sb.from('vehicles').select('*').order('created_at', { ascending: false });

  const statusFilter = document.getElementById('vehicleStatusFilter')?.value;
  if (statusFilter) query = query.eq('status', statusFilter);

  const search = document.getElementById('vehicleSearch')?.value.trim().toLowerCase() || '';

  const { data, error } = await query;
  if (error) {
    showToast('Error cargando vehículos: ' + error.message, 'error');
    return;
  }

  let filtered = data || [];
  if (search) {
    filtered = filtered.filter(v =>
      `${v.brand} ${v.model} ${v.year} ${v.color}`.toLowerCase().includes(search)
    );
  }

  const tbody = document.getElementById('vehiclesBody');
  if (!tbody) {
    console.error('No se encontró #vehiclesBody');
    return;
  }

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="text-muted" style="text-align:center;padding:2rem;">No hay vehículos con ese filtro</td></tr>';
    return;
  }

  try {
  tbody.innerHTML = filtered.map(v => {
    const thumb = v.images && v.images[0]
      ? `<img src="${escapeHtml(v.images[0])}" alt="" class="vehicle-thumb">`
      : '';
    const imgCount = (v.images || []).length;
    const imgLabel = imgCount ? ` · ${imgCount} foto${imgCount > 1 ? 's' : ''}` : '';
    return `
    <tr>
      <td>${thumb}<strong>${escapeHtml(v.brand)} ${escapeHtml(v.model)}</strong><br><span style="font-size:.78rem;color:var(--text-light);">${escapeHtml(v.color || '')} · ${escapeHtml(v.fuel)} · ${escapeHtml(v.transmission)}${imgLabel}</span></td>
      <td>${v.year}</td>
      <td>${v.type}</td>
      <td>${formatKm(v.km)}</td>
      <td><strong>${formatPrice(v.price)}</strong></td>
      <td><span class="status-badge ${v.status}">${v.status}</span></td>
      <td>
        <label class="toggle">
          <input type="checkbox" ${v.is_featured ? 'checked' : ''} onchange="toggleFeatured('${v.id}', this.checked)">
          <span class="toggle-slider"></span>
        </label>
      </td>
      <td>
        <div class="table-actions">
          <button class="btn btn-ghost btn-sm" onclick="editVehicle('${v.id}')" title="Editar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="btn btn-ghost btn-sm" onclick="deleteVehicle('${v.id}')" title="Eliminar" style="color:var(--danger);">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
          </button>
        </div>
      </td>
    </tr>`;
  }).join('');
  } catch (err) {
    console.error(err);
    tbody.innerHTML = `<tr><td colspan="8" class="text-muted" style="text-align:center;padding:2rem;color:var(--danger);">Error mostrando lista: ${escapeHtml(err.message)}</td></tr>`;
  }
}

function vehicleFormHTML(v = {}) {
  const e = escapeHtml;
  const sel = (a, b) => (a === b ? 'selected' : '');
  return `
    <form class="modal-form" id="vehicleForm">
      <input type="hidden" id="vf_id" value="${e(v.id || '')}">
      <div class="form-row">
        <div class="form-group">
          <label>Marca *</label>
          <input type="text" id="vf_brand" list="brandSuggestions" value="${e(v.brand || '')}" required placeholder="Ej: Toyota" autocomplete="off">
        </div>
        <div class="form-group">
          <label>Modelo *</label>
          <input type="text" id="vf_model" value="${e(v.model || '')}" required placeholder="Ej: Corolla">
        </div>
      </div>
      <datalist id="brandSuggestions"></datalist>
      <div class="form-row-3">
        <div class="form-group">
          <label>Año *</label>
          <input type="number" id="vf_year" value="${e(v.year || new Date().getFullYear())}" required min="1990">
        </div>
        <div class="form-group">
          <label>Tipo *</label>
          <select id="vf_type" required>
            <option value="Sedán" ${sel(v.type, 'Sedán')}>Sedán</option>
            <option value="SUV" ${sel(v.type, 'SUV')}>SUV</option>
            <option value="Hatchback" ${sel(v.type, 'Hatchback')}>Hatchback</option>
            <option value="Pickup" ${sel(v.type, 'Pickup')}>Pickup</option>
            <option value="Coupé" ${sel(v.type, 'Coupé')}>Coupé</option>
            <option value="Van" ${sel(v.type, 'Van')}>Van</option>
            <option value="Convertible" ${sel(v.type, 'Convertible')}>Convertible</option>
          </select>
        </div>
        <div class="form-group">
          <label>Kilometraje</label>
          <input type="number" id="vf_km" value="${e(v.km ?? 0)}" min="0">
        </div>
      </div>
      <div class="form-row-3">
        <div class="form-group">
          <label>Combustible</label>
          <select id="vf_fuel">
            <option value="Bencina" ${sel(v.fuel, 'Bencina')}>Bencina</option>
            <option value="Diésel" ${sel(v.fuel, 'Diésel')}>Diésel</option>
            <option value="Híbrido" ${sel(v.fuel, 'Híbrido')}>Híbrido</option>
            <option value="Eléctrico" ${sel(v.fuel, 'Eléctrico')}>Eléctrico</option>
            <option value="GLP" ${sel(v.fuel, 'GLP')}>GLP</option>
          </select>
        </div>
        <div class="form-group">
          <label>Transmisión</label>
          <select id="vf_transmission">
            <option value="Manual" ${sel(v.transmission, 'Manual')}>Manual</option>
            <option value="Automática" ${sel(v.transmission, 'Automática')}>Automática</option>
            <option value="CVT" ${sel(v.transmission, 'CVT')}>CVT</option>
          </select>
        </div>
        <div class="form-group">
          <label>Color</label>
          <input type="text" id="vf_color" value="${e(v.color || '')}" placeholder="Ej: Rojo">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Precio de Venta *</label>
          <input type="number" id="vf_price" value="${e(v.price ?? '')}" required min="1" placeholder="Ej: 15990000">
        </div>
        <div class="form-group">
          <label>Precio de Compra</label>
          <input type="number" id="vf_purchase_price" value="${e(v.purchase_price ?? '')}" min="0" placeholder="Opcional">
        </div>
      </div>
      <div class="form-row-3">
        <div class="form-group">
          <label>Patente</label>
          <input type="text" id="vf_plate" value="${e(v.plate || '')}" placeholder="Ej: ABCD-12">
        </div>
        <div class="form-group">
          <label>Motor</label>
          <input type="text" id="vf_engine" value="${e(v.engine || '')}" placeholder="Ej: 2.0L Turbo">
        </div>
        <div class="form-group">
          <label>Estado</label>
          <select id="vf_status">
            <option value="disponible" ${sel(v.status, 'disponible')}>Disponible</option>
            <option value="reservado" ${sel(v.status, 'reservado')}>Reservado</option>
            <option value="vendido" ${sel(v.status, 'vendido')}>Vendido</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label>Descripción</label>
        <textarea id="vf_description" rows="4" placeholder="Descripción del vehículo para la web...">${e(v.description || '')}</textarea>
      </div>
      <div class="form-group image-manager-section">
        <label>Imágenes del vehículo</label>
        <p class="text-muted" style="font-size:.8rem;margin-bottom:.5rem;">La primera imagen es la portada. Arrastra las miniaturas para cambiar el orden. Sube JPG/PNG/WebP o pega URLs.</p>
        <div id="vehicleImageDropZone" class="image-drop-zone">
        <div id="vehicleImageList" class="image-manager-list"></div>
        <p class="image-drop-hint">Arrastra fotos aquí o usa los botones de abajo</p>
        </div>
        <input type="file" id="vf_images_input" accept="image/jpeg,image/png,image/webp" multiple hidden>
        <div style="display:flex;flex-wrap:wrap;gap:.5rem;margin:.5rem 0;">
          <button type="button" class="btn btn-outline btn-sm" id="btnAddImages">+ Subir fotos</button>
          <input type="url" id="vf_image_url" placeholder="https://ejemplo.com/foto.jpg" style="flex:1;min-width:180px;padding:.45rem .6rem;border:1px solid var(--border);border-radius:8px;">
          <button type="button" class="btn btn-outline btn-sm" id="btnAddImageUrl">Pegar URL</button>
        </div>
        <div id="vehicleLivePreview" class="vehicle-live-preview"></div>
      </div>
      <div class="form-row-3">
        <div class="form-group">
          <label>Color carrocería (SVG)</label>
          <div class="color-preview">
            <div class="color-swatch"><input type="color" id="vf_color1" value="${e(v.color1 || '#1a1a2e')}"></div>
            <span style="font-size:.78rem;color:var(--text-light);">Principal</span>
          </div>
        </div>
        <div class="form-group">
          <label>Color secundario (SVG)</label>
          <div class="color-preview">
            <div class="color-swatch"><input type="color" id="vf_color2" value="${e(v.color2 || '#16213e')}"></div>
            <span style="font-size:.78rem;color:var(--text-light);">Sombra</span>
          </div>
        </div>
        <div class="form-group">
          <label>Color ventanas (SVG)</label>
          <div class="color-preview">
            <div class="color-swatch"><input type="color" id="vf_window_color" value="${e(v.window_color || '#a8d8ea')}"></div>
            <span style="font-size:.78rem;color:var(--text-light);">Cristal</span>
          </div>
        </div>
      </div>
      <div class="form-actions">
        <button type="button" class="btn btn-outline" onclick="closeModal()">Cancelar</button>
        <button type="submit" class="btn btn-primary">${v.id ? 'Guardar Cambios' : 'Publicar Vehículo'}</button>
      </div>
    </form>
  `;
}

async function loadBrandSuggestions() {
  const { data } = await sb.from('vehicles').select('brand');
  const brands = [...new Set((data || []).map((r) => r.brand).filter(Boolean))].sort();
  const list = document.getElementById('brandSuggestions');
  if (list) {
    list.innerHTML = brands.map((b) => `<option value="${escapeHtml(b)}">`).join('');
  }
}

function openVehicleModal(vehicle = {}) {
  openModal(vehicle.id ? 'Editar Vehículo' : 'Nuevo Vehículo', vehicleFormHTML(vehicle), { wide: true });
  initVehicleImageManager(vehicle.images || []);
  loadBrandSuggestions();
  ['vf_brand', 'vf_model', 'vf_year', 'vf_price', 'vf_description'].forEach((fid) => {
    document.getElementById(fid)?.addEventListener('input', updateVehicleLivePreview);
  });
  const form = document.getElementById('vehicleForm');
  form?.addEventListener('submit', saveVehicle);
}

window.openVehicleModal = openVehicleModal;

async function saveVehicle(e) {
  e.preventDefault();
  const submitBtn = e.target.querySelector('button[type="submit"]');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Guardando...';
  }

  const existingId = document.getElementById('vf_id').value;
  const brand = document.getElementById('vf_brand').value.trim();
  const model = document.getElementById('vf_model').value.trim();
  const price = parseInt(document.getElementById('vf_price').value, 10);

  if (!brand || !model) {
    showToast('Marca y modelo son obligatorios', 'error');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = existingId ? 'Guardar Cambios' : 'Publicar Vehículo';
    }
    return;
  }
  if (!price || price < 1) {
    showToast('Ingresa un precio de venta válido', 'error');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = existingId ? 'Guardar Cambios' : 'Publicar Vehículo';
    }
    return;
  }

  const hasPendingFiles = vehicleImageQueue.some((i) => i.type === 'file');
  if (hasPendingFiles && !(await isStorageReady())) {
    showToast('Para subir fotos ejecuta sql/setup_completo.sql en Supabase (bucket vehicles)', 'error');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = existingId ? 'Guardar Cambios' : 'Publicar Vehículo';
    }
    return;
  }

  const payload = {
    brand,
    model,
    year: parseInt(document.getElementById('vf_year').value),
    type: document.getElementById('vf_type').value,
    km: parseInt(document.getElementById('vf_km').value) || 0,
    fuel: document.getElementById('vf_fuel').value,
    transmission: document.getElementById('vf_transmission').value,
    color: document.getElementById('vf_color').value.trim(),
    price,
    purchase_price: parseInt(document.getElementById('vf_purchase_price').value) || null,
    plate: document.getElementById('vf_plate').value,
    engine: document.getElementById('vf_engine').value,
    status: document.getElementById('vf_status').value,
    description: document.getElementById('vf_description').value.trim(),
    color1: document.getElementById('vf_color1').value,
    color2: document.getElementById('vf_color2').value,
    window_color: document.getElementById('vf_window_color').value,
  };

  try {
    let vehicleId = existingId;

    if (!vehicleId) {
      const { data: created, error: createError } = await sb
        .from('vehicles')
        .insert({ ...payload, images: [] })
        .select('id')
        .single();
      if (createError) throw createError;
      vehicleId = created.id;
    }

    const images = await uploadVehicleImages(vehicleId);
    const { error: updateError } = await sb
      .from('vehicles')
      .update({ ...payload, images })
      .eq('id', vehicleId);

    if (updateError) throw updateError;

    showToast(existingId ? 'Vehículo actualizado' : 'Vehículo publicado', 'success');
    revokeVehiclePreviewUrls();
    closeModal();
    loadVehicles();
  } catch (err) {
    console.error(err);
    showToast(err.message || 'Error guardando vehículo', 'error');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = existingId ? 'Guardar Cambios' : 'Publicar Vehículo';
    }
  }
}

window.editVehicle = async function(id) {
  const { data } = await sb.from('vehicles').select('*').eq('id', id).single();
  if (!data) return;
  openVehicleModal(data);
};

window.toggleFeatured = async function(id, checked) {
  const { error } = await sb.from('vehicles').update({ is_featured: checked }).eq('id', id);
  if (error) showToast('Error actualizando', 'error');
};

window.deleteVehicle = async function(id) {
  if (!confirm('¿Estás seguro de eliminar este vehículo? Esta acción no se puede deshacer.')) return;
  const { data: row } = await sb.from('vehicles').select('images').eq('id', id).single();
  await deleteVehicleStorageFiles(id, row?.images || []);
  const { error } = await sb.from('vehicles').delete().eq('id', id);
  if (error) {
    showToast('Error: ' + error.message, 'error');
  } else {
    showToast('Vehículo eliminado', 'success');
    loadVehicles();
    loadDashboard();
  }
};

/* ── Site media (logo, banners) ──────── */

const SITE_BUCKET = 'site';
let siteBucketReady = null;

const SITE_ASSET_DEFS = [
  { key: 'logo_header', label: 'Logo (cabecera)', hint: 'PNG o SVG, fondo transparente. Altura ~40px.' },
  { key: 'logo_footer', label: 'Logo (pie de página)', hint: 'Versión para el footer.' },
  { key: 'hero_banner', label: 'Banner principal (hero)', hint: 'Imagen grande del inicio (JPG/WebP).' },
  { key: 'hero_background', label: 'Fondo del hero', hint: 'Imagen de fondo opcional detrás del texto.' },
  { key: 'about_image', label: 'Imagen «Nosotros»', hint: 'Foto o banner de la sección Sobre Nosotros.' },
];

async function isSiteBucketReady() {
  if (siteBucketReady !== null) return siteBucketReady;
  const { error } = await sb.storage.from(SITE_BUCKET).list('', { limit: 1 });
  siteBucketReady = !error;
  return siteBucketReady;
}

async function loadSiteMedia() {
  const grid = document.getElementById('siteMediaGrid');
  if (!grid) return;

  grid.innerHTML = '<p class="text-muted">Cargando imágenes del sitio…</p>';

  const { data, error } = await sb.from('site_settings').select('key, value');
  if (error) {
    grid.innerHTML = `<div class="site-media-error">No se pudo leer site_settings: ${escapeHtml(error.message)}. Ejecuta <code>sql/setup_completo.sql</code> en Supabase.</div>`;
    return;
  }

  const map = {};
  (data || []).forEach((row) => { map[row.key] = row.value || ''; });

  const bucketOk = await isSiteBucketReady();

  grid.innerHTML = SITE_ASSET_DEFS.map((def) => {
    const url = map[def.key] || '';
    const preview = url
      ? `<img src="${escapeHtml(url)}" alt="${escapeHtml(def.label)}">`
      : '<div class="site-media-placeholder">Sin imagen</div>';
    return `
      <article class="site-media-card" data-asset-key="${escapeHtml(def.key)}">
        <div class="site-media-preview">${preview}</div>
        <div class="site-media-body">
          <h3>${escapeHtml(def.label)}</h3>
          <p class="text-muted">${escapeHtml(def.hint)}</p>
          <input type="hidden" class="site-asset-url" value="${escapeHtml(url)}">
          <div class="site-media-actions">
            <input type="file" class="site-asset-file" accept="image/*" hidden>
            <button type="button" class="btn btn-outline btn-sm btn-site-upload" ${bucketOk ? '' : 'disabled title="Ejecuta setup_completo.sql"'}>Subir</button>
            <input type="url" class="site-asset-url-input" placeholder="https://…" value="${escapeHtml(url)}">
            <button type="button" class="btn btn-primary btn-sm btn-site-save">Guardar</button>
          </div>
        </div>
      </article>
    `;
  }).join('');

  grid.querySelectorAll('.site-media-card').forEach((card) => bindSiteMediaCard(card));
}

function bindSiteMediaCard(card) {
  const key = card.dataset.assetKey;
  const fileInput = card.querySelector('.site-asset-file');
  const uploadBtn = card.querySelector('.btn-site-upload');
  const urlInput = card.querySelector('.site-asset-url-input');
  const saveBtn = card.querySelector('.btn-site-save');
  const hiddenUrl = card.querySelector('.site-asset-url');

  uploadBtn?.addEventListener('click', () => fileInput?.click());

  fileInput?.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    if (!(await isSiteBucketReady())) {
      showToast('Falta bucket «site» — ejecuta sql/setup_completo.sql', 'error');
      return;
    }
    uploadBtn.disabled = true;
    uploadBtn.textContent = 'Subiendo…';
    try {
      const compressed = await compressImageFile(file);
      const safeName = compressed.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `${key}/${Date.now()}-${safeName}`;
      const { error } = await sb.storage.from(SITE_BUCKET).upload(path, compressed, {
        cacheControl: '3600',
        upsert: true,
        contentType: compressed.type || 'image/jpeg',
      });
      if (error) throw error;
      const { data } = sb.storage.from(SITE_BUCKET).getPublicUrl(path);
      hiddenUrl.value = data.publicUrl;
      urlInput.value = data.publicUrl;
      updateSiteMediaPreview(card, data.publicUrl);
      showToast('Imagen subida. Pulsa Guardar para publicar en la web.', 'success');
    } catch (err) {
      showToast(err.message || 'Error al subir', 'error');
    } finally {
      uploadBtn.disabled = false;
      uploadBtn.textContent = 'Subir';
      fileInput.value = '';
    }
  });

  saveBtn?.addEventListener('click', async () => {
    const value = urlInput.value.trim();
    saveBtn.disabled = true;
    saveBtn.textContent = 'Guardando…';
    const { error } = await sb.from('site_settings').upsert(
      { key, value, updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    );
    saveBtn.disabled = false;
    saveBtn.textContent = 'Guardar';
    if (error) {
      showToast('Error: ' + error.message, 'error');
      return;
    }
    hiddenUrl.value = value;
    updateSiteMediaPreview(card, value);
    showToast('Imagen del sitio actualizada', 'success');
  });
}

function updateSiteMediaPreview(card, url) {
  const box = card.querySelector('.site-media-preview');
  if (!box) return;
  box.innerHTML = url
    ? `<img src="${escapeHtml(url)}" alt="">`
    : '<div class="site-media-placeholder">Sin imagen</div>';
}

/* ── Sales CRUD ──────────────────────── */

async function loadSales() {
  let query = sb.from('sales_detail').select('*');

  const statusFilter = document.getElementById('saleStatusFilter').value;
  if (statusFilter) query = query.eq('status', statusFilter);

  const { data, error } = await query;
  if (error) { showToast('Error cargando ventas', 'error'); return; }

  const search = document.getElementById('saleSearch').value.trim().toLowerCase();
  let filtered = data || [];
  if (search) {
    filtered = filtered.filter(s =>
      `${s.vehicle_name} ${s.customer_name}`.toLowerCase().includes(search)
    );
  }

  const tbody = document.getElementById('salesBody');
  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-muted" style="text-align:center;padding:2rem;">No hay ventas</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map(s => `
    <tr>
      <td>${formatDate(s.sale_date)}</td>
      <td><strong>${s.vehicle_name || '-'}</strong></td>
      <td>${s.customer_name || '-'}<br><span style="font-size:.78rem;color:var(--text-light);">${s.customer_phone || ''}</span></td>
      <td><strong>${formatPrice(s.sale_price)}</strong></td>
      <td style="text-transform:capitalize;">${s.payment_method}</td>
      <td><span class="status-badge ${s.status}">${s.status}</span></td>
      <td>
        <div class="table-actions">
          <button class="btn btn-ghost btn-sm" onclick="editSale('${s.id}')" title="Editar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="btn btn-ghost btn-sm" onclick="deleteSale('${s.id}')" title="Eliminar" style="color:var(--danger);">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

async function saleFormHTML(s = {}) {
  const { data: availableVehicles } = await sb
    .from('vehicles').select('id, brand, model, year, price')
    .in('status', ['disponible', 'reservado'])
    .order('brand');

  const { data: customers } = await sb
    .from('customers').select('id, name, rut')
    .order('name');

  const vehicleOptions = (availableVehicles || []).map(v =>
    `<option value="${v.id}" ${s.vehicle_id === v.id ? 'selected' : ''}>${v.brand} ${v.model} ${v.year} - ${formatPrice(v.price)}</option>`
  ).join('');

  const customerOptions = (customers || []).map(c =>
    `<option value="${c.id}" ${s.customer_id === c.id ? 'selected' : ''}>${c.name}${c.rut ? ' ('+c.rut+')' : ''}</option>`
  ).join('');

  return `
    <form class="modal-form" id="saleForm">
      <input type="hidden" id="sf_id" value="${s.id || ''}">
      <div class="form-group">
        <label>Vehículo *</label>
        <select id="sf_vehicle" required>
          <option value="">Seleccionar vehículo</option>
          ${vehicleOptions}
        </select>
      </div>
      <div class="form-group">
        <label>Cliente</label>
        <select id="sf_customer">
          <option value="">Sin cliente asignado</option>
          ${customerOptions}
        </select>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Precio de Venta *</label>
          <input type="number" id="sf_price" value="${s.sale_price || ''}" required min="1">
        </div>
        <div class="form-group">
          <label>Fecha de Venta</label>
          <input type="date" id="sf_date" value="${s.sale_date || new Date().toISOString().split('T')[0]}">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Método de Pago</label>
          <select id="sf_payment">
            <option value="contado" ${s.payment_method==='contado'?'selected':''}>Contado</option>
            <option value="financiamiento" ${s.payment_method==='financiamiento'?'selected':''}>Financiamiento</option>
            <option value="mixto" ${s.payment_method==='mixto'?'selected':''}>Mixto</option>
          </select>
        </div>
        <div class="form-group">
          <label>Estado</label>
          <select id="sf_status">
            <option value="pendiente" ${s.status==='pendiente'?'selected':''}>Pendiente</option>
            <option value="completada" ${s.status==='completada'?'selected':''}>Completada</option>
            <option value="cancelada" ${s.status==='cancelada'?'selected':''}>Cancelada</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label>Notas</label>
        <textarea id="sf_notes" rows="2">${s.notes || ''}</textarea>
      </div>
      <div class="form-actions">
        <button type="button" class="btn btn-outline" onclick="closeModal()">Cancelar</button>
        <button type="submit" class="btn btn-primary">${s.id ? 'Guardar' : 'Registrar Venta'}</button>
      </div>
    </form>
  `;
}

window.editSale = async function(id) {
  const { data } = await sb.from('sales').select('*').eq('id', id).single();
  if (!data) return;
  openModal('Editar Venta', await saleFormHTML(data));
  document.getElementById('saleForm').addEventListener('submit', saveSale);
};

async function saveSale(e) {
  e.preventDefault();
  const id = document.getElementById('sf_id').value;
  const payload = {
    vehicle_id: document.getElementById('sf_vehicle').value,
    customer_id: document.getElementById('sf_customer').value || null,
    sale_price: parseInt(document.getElementById('sf_price').value),
    sale_date: document.getElementById('sf_date').value,
    payment_method: document.getElementById('sf_payment').value,
    status: document.getElementById('sf_status').value,
    notes: document.getElementById('sf_notes').value,
  };

  let error;
  if (id) {
    ({ error } = await sb.from('sales').update(payload).eq('id', id));
  } else {
    ({ error } = await sb.from('sales').insert(payload));
  }

  if (error) {
    showToast('Error: ' + error.message, 'error');
  } else {
    showToast(id ? 'Venta actualizada' : 'Venta registrada', 'success');
    closeModal();
    loadSales();
  }
}

window.deleteSale = async function(id) {
  if (!confirm('¿Eliminar esta venta?')) return;
  const { error } = await sb.from('sales').delete().eq('id', id);
  if (error) showToast('Error: ' + error.message, 'error');
  else { showToast('Venta eliminada', 'success'); loadSales(); }
};

/* ── Customers CRUD ──────────────────── */

async function loadCustomers() {
  const search = document.getElementById('customerSearch').value.trim().toLowerCase();
  const { data, error } = await sb.from('customers').select('*').order('name');
  if (error) { showToast('Error cargando clientes', 'error'); return; }

  let filtered = data || [];
  if (search) {
    filtered = filtered.filter(c =>
      `${c.name} ${c.rut} ${c.phone} ${c.email}`.toLowerCase().includes(search)
    );
  }

  const tbody = document.getElementById('customersBody');
  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-muted" style="text-align:center;padding:2rem;">No hay clientes</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map(c => `
    <tr>
      <td><strong>${c.name}</strong></td>
      <td>${c.rut || '-'}</td>
      <td>${c.phone}</td>
      <td>${c.email || '-'}</td>
      <td>
        <div class="table-actions">
          <button class="btn btn-ghost btn-sm" onclick="editCustomer('${c.id}')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="btn btn-ghost btn-sm" onclick="deleteCustomer('${c.id}')" style="color:var(--danger);">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function customerFormHTML(c = {}) {
  return `
    <form class="modal-form" id="customerForm">
      <input type="hidden" id="cf_id" value="${c.id || ''}">
      <div class="form-row">
        <div class="form-group">
          <label>Nombre *</label>
          <input type="text" id="cf_name" value="${c.name || ''}" required>
        </div>
        <div class="form-group">
          <label>RUT</label>
          <input type="text" id="cf_rut" value="${c.rut || ''}" placeholder="12.345.678-9">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Teléfono *</label>
          <input type="tel" id="cf_phone" value="${c.phone || ''}" required placeholder="+56 9 ...">
        </div>
        <div class="form-group">
          <label>Email</label>
          <input type="email" id="cf_email" value="${c.email || ''}">
        </div>
      </div>
      <div class="form-group">
        <label>Dirección</label>
        <input type="text" id="cf_address" value="${c.address || ''}">
      </div>
      <div class="form-group">
        <label>Notas</label>
        <textarea id="cf_notes" rows="2">${c.notes || ''}</textarea>
      </div>
      <div class="form-actions">
        <button type="button" class="btn btn-outline" onclick="closeModal()">Cancelar</button>
        <button type="submit" class="btn btn-primary">${c.id ? 'Guardar' : 'Crear Cliente'}</button>
      </div>
    </form>
  `;
}

window.editCustomer = async function(id) {
  const { data } = await sb.from('customers').select('*').eq('id', id).single();
  if (!data) return;
  openModal('Editar Cliente', customerFormHTML(data));
  document.getElementById('customerForm').addEventListener('submit', saveCustomer);
};

async function saveCustomer(e) {
  e.preventDefault();
  const id = document.getElementById('cf_id').value;
  const payload = {
    name: document.getElementById('cf_name').value,
    rut: document.getElementById('cf_rut').value,
    phone: document.getElementById('cf_phone').value,
    email: document.getElementById('cf_email').value,
    address: document.getElementById('cf_address').value,
    notes: document.getElementById('cf_notes').value,
  };

  let error;
  if (id) {
    ({ error } = await sb.from('customers').update(payload).eq('id', id));
  } else {
    ({ error } = await sb.from('customers').insert(payload));
  }

  if (error) showToast('Error: ' + error.message, 'error');
  else { showToast(id ? 'Cliente actualizado' : 'Cliente creado', 'success'); closeModal(); loadCustomers(); }
}

window.deleteCustomer = async function(id) {
  if (!confirm('¿Eliminar este cliente?')) return;
  const { error } = await sb.from('customers').delete().eq('id', id);
  if (error) showToast('Error: ' + error.message, 'error');
  else { showToast('Cliente eliminado', 'success'); loadCustomers(); }
};

/* ── Inquiries ───────────────────────── */

async function loadInquiries() {
  const { data, error } = await sb
    .from('inquiries')
    .select('*, vehicles(brand, model, year)')
    .order('created_at', { ascending: false });

  if (error) { showToast('Error cargando consultas', 'error'); return; }
  const list = data || [];

  const tbody = document.getElementById('inquiriesBody');
  if (list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-muted" style="text-align:center;padding:2rem;">No hay consultas</td></tr>';
    return;
  }

  tbody.innerHTML = list.map(i => `
    <tr style="${!i.is_read ? 'background:#f8faff;' : ''}">
      <td>${!i.is_read ? '<span class="unread-dot"></span>' : ''}</td>
      <td>${formatDate(i.created_at)}</td>
      <td><strong>${i.name}</strong></td>
      <td>${i.phone}</td>
      <td>${i.vehicles ? i.vehicles.brand + ' ' + i.vehicles.model + ' ' + i.vehicles.year : '-'}</td>
      <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${i.message || '-'}</td>
      <td>
        <div class="table-actions">
          ${!i.is_read ? `<button class="btn btn-ghost btn-sm" onclick="markRead('${i.id}')" title="Marcar como leída">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
          </button>` : ''}
          <a class="btn btn-ghost btn-sm" href="https://api.whatsapp.com/send?phone=${i.phone.replace(/[^0-9]/g,'')}" target="_blank" title="Responder por WhatsApp" style="color:var(--success);">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          </a>
          <button class="btn btn-ghost btn-sm" onclick="deleteInquiry('${i.id}')" style="color:var(--danger);">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

window.markRead = async function(id) {
  await sb.from('inquiries').update({ is_read: true }).eq('id', id);
  loadInquiries();
  loadDashboard();
};

window.deleteInquiry = async function(id) {
  if (!confirm('¿Eliminar esta consulta?')) return;
  await sb.from('inquiries').delete().eq('id', id);
  showToast('Consulta eliminada', 'success');
  loadInquiries();
};

/* ── Expenses CRUD ───────────────────── */

async function loadExpenses() {
  const { data: expenses, error } = await sb
    .from('expenses')
    .select('*, vehicles(brand, model, year)')
    .order('date', { ascending: false });

  if (error) { showToast('Error cargando gastos', 'error'); return; }
  const list = expenses || [];

  const total = list.reduce((sum, e) => sum + e.amount, 0);
  const monthTotal = list
    .filter(e => new Date(e.date).getMonth() === new Date().getMonth() && new Date(e.date).getFullYear() === new Date().getFullYear())
    .reduce((sum, e) => sum + e.amount, 0);

  document.getElementById('expensesSummary').innerHTML = `
    <span>Total: <strong>${formatPrice(total)}</strong></span>
    <span>Este mes: <strong>${formatPrice(monthTotal)}</strong></span>
  `;

  const tbody = document.getElementById('expensesBody');
  if (list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-muted" style="text-align:center;padding:2rem;">No hay gastos registrados</td></tr>';
    return;
  }

  tbody.innerHTML = list.map(e => `
    <tr>
      <td>${formatDate(e.date)}</td>
      <td><strong>${e.concept}</strong></td>
      <td>${e.vehicles ? e.vehicles.brand + ' ' + e.vehicles.model + ' ' + e.vehicles.year : '-'}</td>
      <td><strong>${formatPrice(e.amount)}</strong></td>
      <td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${e.notes || '-'}</td>
      <td>
        <div class="table-actions">
          <button class="btn btn-ghost btn-sm" onclick="editExpense('${e.id}')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="btn btn-ghost btn-sm" onclick="deleteExpense('${e.id}')" style="color:var(--danger);">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

async function expenseFormHTML(e = {}) {
  const { data: vehicles } = await sb
    .from('vehicles').select('id, brand, model, year').order('brand');

  const vehicleOptions = (vehicles || []).map(v =>
    `<option value="${v.id}" ${e.vehicle_id === v.id ? 'selected' : ''}>${v.brand} ${v.model} ${v.year}</option>`
  ).join('');

  return `
    <form class="modal-form" id="expenseForm">
      <input type="hidden" id="ef_id" value="${e.id || ''}">
      <div class="form-row">
        <div class="form-group">
          <label>Concepto *</label>
          <input type="text" id="ef_concept" value="${e.concept || ''}" required placeholder="Ej: Reparación frenos">
        </div>
        <div class="form-group">
          <label>Monto *</label>
          <input type="number" id="ef_amount" value="${e.amount || ''}" required min="1">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Vehículo (opcional)</label>
          <select id="ef_vehicle">
            <option value="">Sin vehículo asociado</option>
            ${vehicleOptions}
          </select>
        </div>
        <div class="form-group">
          <label>Fecha</label>
          <input type="date" id="ef_date" value="${e.date || new Date().toISOString().split('T')[0]}">
        </div>
      </div>
      <div class="form-group">
        <label>Notas</label>
        <textarea id="ef_notes" rows="2">${e.notes || ''}</textarea>
      </div>
      <div class="form-actions">
        <button type="button" class="btn btn-outline" onclick="closeModal()">Cancelar</button>
        <button type="submit" class="btn btn-primary">${e.id ? 'Guardar' : 'Registrar Gasto'}</button>
      </div>
    </form>
  `;
}

window.editExpense = async function(id) {
  const { data } = await sb.from('expenses').select('*').eq('id', id).single();
  if (!data) return;
  openModal('Editar Gasto', await expenseFormHTML(data));
  document.getElementById('expenseForm').addEventListener('submit', saveExpense);
};

async function saveExpense(e) {
  e.preventDefault();
  const id = document.getElementById('ef_id').value;
  const payload = {
    concept: document.getElementById('ef_concept').value,
    amount: parseInt(document.getElementById('ef_amount').value),
    vehicle_id: document.getElementById('ef_vehicle').value || null,
    date: document.getElementById('ef_date').value,
    notes: document.getElementById('ef_notes').value,
  };

  let error;
  if (id) {
    ({ error } = await sb.from('expenses').update(payload).eq('id', id));
  } else {
    ({ error } = await sb.from('expenses').insert(payload));
  }

  if (error) showToast('Error: ' + error.message, 'error');
  else { showToast(id ? 'Gasto actualizado' : 'Gasto registrado', 'success'); closeModal(); loadExpenses(); }
}

window.deleteExpense = async function(id) {
  if (!confirm('¿Eliminar este gasto?')) return;
  await sb.from('expenses').delete().eq('id', id);
  showToast('Gasto eliminado', 'success');
  loadExpenses();
};

/* ── Utils ───────────────────────────── */

function debounce(fn, ms) {
  let t;
  return function(...args) { clearTimeout(t); t = setTimeout(() => fn.apply(this, args), ms); };
}

/* ── Init ────────────────────────────── */

function bindOptional(id, event, handler) {
  const el = document.getElementById(id);
  if (el) el.addEventListener(event, handler);
}

function initBindings() {
  bindOptional('adminModalClose', 'click', closeModal);
  const adminModal = document.getElementById('adminModal');
  adminModal?.addEventListener('click', e => {
    if (e.target === adminModal) closeModal();
  });

  /* Navegación: manejada por index.html (adminSwitchPage) para evitar duplicados */

  bindOptional('sidebarToggle', 'click', () => {
    document.getElementById('sidebar')?.classList.toggle('open');
  });

  bindOptional('vehicleSearch', 'input', debounce(loadVehicles, 300));
  bindOptional('vehicleStatusFilter', 'change', loadVehicles);
  bindOptional('btnNewVehicle', 'click', () => openVehicleModal({}));

  bindOptional('saleSearch', 'input', debounce(loadSales, 300));
  bindOptional('saleStatusFilter', 'change', loadSales);
  bindOptional('btnNewSale', 'click', async () => {
    openModal('Nueva Venta', await saleFormHTML());
    document.getElementById('saleForm')?.addEventListener('submit', saveSale);
  });

  bindOptional('customerSearch', 'input', debounce(loadCustomers, 300));
  bindOptional('btnNewCustomer', 'click', () => {
    openModal('Nuevo Cliente', customerFormHTML());
    document.getElementById('customerForm')?.addEventListener('submit', saveCustomer);
  });

  bindOptional('btnMarkAllRead', 'click', async () => {
    await sb.from('inquiries').update({ is_read: true }).eq('is_read', false);
    showToast('Todas marcadas como leídas', 'success');
    loadInquiries();
    loadDashboard();
  });

  bindOptional('btnNewExpense', 'click', async () => {
    openModal('Nuevo Gasto', await expenseFormHTML());
    document.getElementById('expenseForm')?.addEventListener('submit', saveExpense);
  });
}

function bootAdmin() {
  try {
    initBindings();
    if (REQUIRE_AUTH) {
      sb.auth.onAuthStateChange((_event, session) => {
        if (session) initAdminPanel();
      });
      setupAuth();
      checkSession();
    } else {
      initAdminPanel();
    }
    window.__adminReady = true;
    window.dispatchEvent(new CustomEvent('admin-ready'));
  } catch (err) {
    console.error(err);
    document.getElementById('adminLayout').style.display = 'flex';
    showToast('Error al iniciar el panel: ' + err.message, 'error');
  }
}

window.closeAdminModal = closeModal;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootAdmin);
} else {
  bootAdmin();
}
