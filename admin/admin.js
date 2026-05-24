/* ========================================
   Trust Motors - Admin Panel Logic
   ========================================
   CONFIGURACIÓN: Reemplaza SUPABASE_URL y SUPABASE_ANON_KEY
   con los valores de tu proyecto en Supabase.
   ======================================== */

const SUPABASE_URL = 'https://rjsfkrgsyduiwyamhdkg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqc2ZrcmdzeWR1aXd5YW1oZGtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2Mjg5OTksImV4cCI6MjA5NTIwNDk5OX0.zgmu6vtJGmIILJzEl75vfCn9oiM6j1KqqgkIzw5pg2o';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ── Helpers ─────────────────────────── */

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
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

function openModal(title, bodyHTML) {
  document.getElementById('adminModalTitle').textContent = title;
  document.getElementById('adminModalBody').innerHTML = bodyHTML;
  document.getElementById('adminModal').classList.add('active');
}

function closeModal() {
  document.getElementById('adminModal').classList.remove('active');
}

document.getElementById('adminModalClose').addEventListener('click', closeModal);
document.getElementById('adminModal').addEventListener('click', e => {
  if (e.target === e.currentTarget) closeModal();
});

/* ── Auth ────────────────────────────── */

async function checkSession() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    showAdmin();
    loadDashboard();
  } else {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('adminLayout').style.display = 'none';
  }
}

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const errEl = document.getElementById('loginError');
  errEl.textContent = '';

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    errEl.textContent = 'Credenciales incorrectas. Intenta nuevamente.';
  } else {
    showAdmin();
    loadDashboard();
  }
});

document.getElementById('btnLogout').addEventListener('click', async () => {
  await supabase.auth.signOut();
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('adminLayout').style.display = 'none';
});

function showAdmin() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('adminLayout').style.display = 'flex';
}

/* ── Navigation ──────────────────────── */

const pageMap = {
  dashboard: { el: 'pageDashboard', title: 'Dashboard', load: loadDashboard },
  vehicles: { el: 'pageVehicles', title: 'Vehículos', load: loadVehicles },
  sales: { el: 'pageSales', title: 'Ventas', load: loadSales },
  customers: { el: 'pageCustomers', title: 'Clientes', load: loadCustomers },
  inquiries: { el: 'pageInquiries', title: 'Consultas', load: loadInquiries },
  expenses: { el: 'pageExpenses', title: 'Gastos', load: loadExpenses },
};

document.querySelectorAll('.sidebar-link[data-page]').forEach(btn => {
  btn.addEventListener('click', () => navigateTo(btn.dataset.page));
});

function navigateTo(page) {
  document.querySelectorAll('.sidebar-link[data-page]').forEach(b => b.classList.remove('active'));
  document.querySelector(`.sidebar-link[data-page="${page}"]`)?.classList.add('active');
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const info = pageMap[page];
  if (info) {
    document.getElementById(info.el).classList.add('active');
    document.getElementById('pageTitle').textContent = info.title;
    info.load();
  }
  document.getElementById('sidebar').classList.remove('open');
}

document.getElementById('sidebarToggle').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
});

/* ── Dashboard ───────────────────────── */

async function loadDashboard() {
  const { data: summary } = await supabase.from('dashboard_summary').select('*').single();

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

  const { data: monthly } = await supabase.from('monthly_sales').select('*');
  renderChart(monthly || []);

  const { data: recentSalesData } = await supabase
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

  const { data: recentInq } = await supabase
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

/* ── Vehicles CRUD ───────────────────── */

async function loadVehicles() {
  let query = supabase.from('vehicles').select('*').order('created_at', { ascending: false });

  const statusFilter = document.getElementById('vehicleStatusFilter').value;
  if (statusFilter) query = query.eq('status', statusFilter);

  const search = document.getElementById('vehicleSearch').value.trim().toLowerCase();

  const { data, error } = await query;
  if (error) { showToast('Error cargando vehículos', 'error'); return; }

  let filtered = data || [];
  if (search) {
    filtered = filtered.filter(v =>
      `${v.brand} ${v.model} ${v.year} ${v.color}`.toLowerCase().includes(search)
    );
  }

  const tbody = document.getElementById('vehiclesBody');
  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="text-muted" style="text-align:center;padding:2rem;">No hay vehículos</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map(v => `
    <tr>
      <td><strong>${v.brand} ${v.model}</strong><br><span style="font-size:.78rem;color:var(--text-light);">${v.color || ''} · ${v.fuel} · ${v.transmission}</span></td>
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
    </tr>
  `).join('');
}

document.getElementById('vehicleSearch').addEventListener('input', debounce(loadVehicles, 300));
document.getElementById('vehicleStatusFilter').addEventListener('change', loadVehicles);

function vehicleFormHTML(v = {}) {
  return `
    <form class="modal-form" id="vehicleForm">
      <input type="hidden" id="vf_id" value="${v.id || ''}">
      <div class="form-row">
        <div class="form-group">
          <label>Marca *</label>
          <input type="text" id="vf_brand" value="${v.brand || ''}" required placeholder="Ej: Toyota">
        </div>
        <div class="form-group">
          <label>Modelo *</label>
          <input type="text" id="vf_model" value="${v.model || ''}" required placeholder="Ej: Corolla">
        </div>
      </div>
      <div class="form-row-3">
        <div class="form-group">
          <label>Año *</label>
          <input type="number" id="vf_year" value="${v.year || new Date().getFullYear()}" required min="1990">
        </div>
        <div class="form-group">
          <label>Tipo *</label>
          <select id="vf_type" required>
            <option value="Sedán" ${v.type==='Sedán'?'selected':''}>Sedán</option>
            <option value="SUV" ${v.type==='SUV'?'selected':''}>SUV</option>
            <option value="Hatchback" ${v.type==='Hatchback'?'selected':''}>Hatchback</option>
            <option value="Pickup" ${v.type==='Pickup'?'selected':''}>Pickup</option>
            <option value="Coupé" ${v.type==='Coupé'?'selected':''}>Coupé</option>
            <option value="Van" ${v.type==='Van'?'selected':''}>Van</option>
            <option value="Convertible" ${v.type==='Convertible'?'selected':''}>Convertible</option>
          </select>
        </div>
        <div class="form-group">
          <label>Kilometraje</label>
          <input type="number" id="vf_km" value="${v.km || 0}" min="0">
        </div>
      </div>
      <div class="form-row-3">
        <div class="form-group">
          <label>Combustible</label>
          <select id="vf_fuel">
            <option value="Bencina" ${v.fuel==='Bencina'?'selected':''}>Bencina</option>
            <option value="Diésel" ${v.fuel==='Diésel'?'selected':''}>Diésel</option>
            <option value="Híbrido" ${v.fuel==='Híbrido'?'selected':''}>Híbrido</option>
            <option value="Eléctrico" ${v.fuel==='Eléctrico'?'selected':''}>Eléctrico</option>
            <option value="GLP" ${v.fuel==='GLP'?'selected':''}>GLP</option>
          </select>
        </div>
        <div class="form-group">
          <label>Transmisión</label>
          <select id="vf_transmission">
            <option value="Manual" ${v.transmission==='Manual'?'selected':''}>Manual</option>
            <option value="Automática" ${v.transmission==='Automática'?'selected':''}>Automática</option>
            <option value="CVT" ${v.transmission==='CVT'?'selected':''}>CVT</option>
          </select>
        </div>
        <div class="form-group">
          <label>Color</label>
          <input type="text" id="vf_color" value="${v.color || ''}" placeholder="Ej: Rojo">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Precio de Venta *</label>
          <input type="number" id="vf_price" value="${v.price || ''}" required min="1" placeholder="Ej: 15990000">
        </div>
        <div class="form-group">
          <label>Precio de Compra</label>
          <input type="number" id="vf_purchase_price" value="${v.purchase_price || ''}" min="0" placeholder="Opcional">
        </div>
      </div>
      <div class="form-row-3">
        <div class="form-group">
          <label>Patente</label>
          <input type="text" id="vf_plate" value="${v.plate || ''}" placeholder="Ej: ABCD-12">
        </div>
        <div class="form-group">
          <label>Motor</label>
          <input type="text" id="vf_engine" value="${v.engine || ''}" placeholder="Ej: 2.0L Turbo">
        </div>
        <div class="form-group">
          <label>Estado</label>
          <select id="vf_status">
            <option value="disponible" ${v.status==='disponible'?'selected':''}>Disponible</option>
            <option value="reservado" ${v.status==='reservado'?'selected':''}>Reservado</option>
            <option value="vendido" ${v.status==='vendido'?'selected':''}>Vendido</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label>Descripción</label>
        <textarea id="vf_description" rows="3" placeholder="Descripción del vehículo...">${v.description || ''}</textarea>
      </div>
      <div class="form-row-3">
        <div class="form-group">
          <label>Color carrocería (SVG)</label>
          <div class="color-preview">
            <div class="color-swatch"><input type="color" id="vf_color1" value="${v.color1 || '#1a1a2e'}"></div>
            <span style="font-size:.78rem;color:var(--text-light);">Principal</span>
          </div>
        </div>
        <div class="form-group">
          <label>Color secundario (SVG)</label>
          <div class="color-preview">
            <div class="color-swatch"><input type="color" id="vf_color2" value="${v.color2 || '#16213e'}"></div>
            <span style="font-size:.78rem;color:var(--text-light);">Sombra</span>
          </div>
        </div>
        <div class="form-group">
          <label>Color ventanas (SVG)</label>
          <div class="color-preview">
            <div class="color-swatch"><input type="color" id="vf_window_color" value="${v.window_color || '#a8d8ea'}"></div>
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

document.getElementById('btnNewVehicle').addEventListener('click', () => {
  openModal('Nuevo Vehículo', vehicleFormHTML());
  document.getElementById('vehicleForm').addEventListener('submit', saveVehicle);
});

window.editVehicle = async function(id) {
  const { data } = await supabase.from('vehicles').select('*').eq('id', id).single();
  if (!data) return;
  openModal('Editar Vehículo', vehicleFormHTML(data));
  document.getElementById('vehicleForm').addEventListener('submit', saveVehicle);
};

async function saveVehicle(e) {
  e.preventDefault();
  const id = document.getElementById('vf_id').value;
  const payload = {
    brand: document.getElementById('vf_brand').value,
    model: document.getElementById('vf_model').value,
    year: parseInt(document.getElementById('vf_year').value),
    type: document.getElementById('vf_type').value,
    km: parseInt(document.getElementById('vf_km').value) || 0,
    fuel: document.getElementById('vf_fuel').value,
    transmission: document.getElementById('vf_transmission').value,
    color: document.getElementById('vf_color').value,
    price: parseInt(document.getElementById('vf_price').value),
    purchase_price: parseInt(document.getElementById('vf_purchase_price').value) || null,
    plate: document.getElementById('vf_plate').value,
    engine: document.getElementById('vf_engine').value,
    status: document.getElementById('vf_status').value,
    description: document.getElementById('vf_description').value,
    color1: document.getElementById('vf_color1').value,
    color2: document.getElementById('vf_color2').value,
    window_color: document.getElementById('vf_window_color').value,
  };

  let error;
  if (id) {
    ({ error } = await supabase.from('vehicles').update(payload).eq('id', id));
  } else {
    ({ error } = await supabase.from('vehicles').insert(payload));
  }

  if (error) {
    showToast('Error guardando vehículo: ' + error.message, 'error');
  } else {
    showToast(id ? 'Vehículo actualizado' : 'Vehículo publicado', 'success');
    closeModal();
    loadVehicles();
  }
}

window.toggleFeatured = async function(id, checked) {
  const { error } = await supabase.from('vehicles').update({ is_featured: checked }).eq('id', id);
  if (error) showToast('Error actualizando', 'error');
};

window.deleteVehicle = async function(id) {
  if (!confirm('¿Estás seguro de eliminar este vehículo? Esta acción no se puede deshacer.')) return;
  const { error } = await supabase.from('vehicles').delete().eq('id', id);
  if (error) {
    showToast('Error: ' + error.message, 'error');
  } else {
    showToast('Vehículo eliminado', 'success');
    loadVehicles();
  }
};

/* ── Sales CRUD ──────────────────────── */

async function loadSales() {
  let query = supabase.from('sales_detail').select('*');

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

document.getElementById('saleSearch').addEventListener('input', debounce(loadSales, 300));
document.getElementById('saleStatusFilter').addEventListener('change', loadSales);

async function saleFormHTML(s = {}) {
  const { data: availableVehicles } = await supabase
    .from('vehicles').select('id, brand, model, year, price')
    .in('status', ['disponible', 'reservado'])
    .order('brand');

  const { data: customers } = await supabase
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

document.getElementById('btnNewSale').addEventListener('click', async () => {
  openModal('Nueva Venta', await saleFormHTML());
  document.getElementById('saleForm').addEventListener('submit', saveSale);
});

window.editSale = async function(id) {
  const { data } = await supabase.from('sales').select('*').eq('id', id).single();
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
    ({ error } = await supabase.from('sales').update(payload).eq('id', id));
  } else {
    ({ error } = await supabase.from('sales').insert(payload));
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
  const { error } = await supabase.from('sales').delete().eq('id', id);
  if (error) showToast('Error: ' + error.message, 'error');
  else { showToast('Venta eliminada', 'success'); loadSales(); }
};

/* ── Customers CRUD ──────────────────── */

async function loadCustomers() {
  const search = document.getElementById('customerSearch').value.trim().toLowerCase();
  const { data, error } = await supabase.from('customers').select('*').order('name');
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

document.getElementById('customerSearch').addEventListener('input', debounce(loadCustomers, 300));

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

document.getElementById('btnNewCustomer').addEventListener('click', () => {
  openModal('Nuevo Cliente', customerFormHTML());
  document.getElementById('customerForm').addEventListener('submit', saveCustomer);
});

window.editCustomer = async function(id) {
  const { data } = await supabase.from('customers').select('*').eq('id', id).single();
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
    ({ error } = await supabase.from('customers').update(payload).eq('id', id));
  } else {
    ({ error } = await supabase.from('customers').insert(payload));
  }

  if (error) showToast('Error: ' + error.message, 'error');
  else { showToast(id ? 'Cliente actualizado' : 'Cliente creado', 'success'); closeModal(); loadCustomers(); }
}

window.deleteCustomer = async function(id) {
  if (!confirm('¿Eliminar este cliente?')) return;
  const { error } = await supabase.from('customers').delete().eq('id', id);
  if (error) showToast('Error: ' + error.message, 'error');
  else { showToast('Cliente eliminado', 'success'); loadCustomers(); }
};

/* ── Inquiries ───────────────────────── */

async function loadInquiries() {
  const { data, error } = await supabase
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
  await supabase.from('inquiries').update({ is_read: true }).eq('id', id);
  loadInquiries();
  loadDashboard();
};

document.getElementById('btnMarkAllRead').addEventListener('click', async () => {
  await supabase.from('inquiries').update({ is_read: true }).eq('is_read', false);
  showToast('Todas marcadas como leídas', 'success');
  loadInquiries();
  loadDashboard();
});

window.deleteInquiry = async function(id) {
  if (!confirm('¿Eliminar esta consulta?')) return;
  await supabase.from('inquiries').delete().eq('id', id);
  showToast('Consulta eliminada', 'success');
  loadInquiries();
};

/* ── Expenses CRUD ───────────────────── */

async function loadExpenses() {
  const { data: expenses, error } = await supabase
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
  const { data: vehicles } = await supabase
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

document.getElementById('btnNewExpense').addEventListener('click', async () => {
  openModal('Nuevo Gasto', await expenseFormHTML());
  document.getElementById('expenseForm').addEventListener('submit', saveExpense);
});

window.editExpense = async function(id) {
  const { data } = await supabase.from('expenses').select('*').eq('id', id).single();
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
    ({ error } = await supabase.from('expenses').update(payload).eq('id', id));
  } else {
    ({ error } = await supabase.from('expenses').insert(payload));
  }

  if (error) showToast('Error: ' + error.message, 'error');
  else { showToast(id ? 'Gasto actualizado' : 'Gasto registrado', 'success'); closeModal(); loadExpenses(); }
}

window.deleteExpense = async function(id) {
  if (!confirm('¿Eliminar este gasto?')) return;
  await supabase.from('expenses').delete().eq('id', id);
  showToast('Gasto eliminado', 'success');
  loadExpenses();
};

/* ── Utils ───────────────────────────── */

function debounce(fn, ms) {
  let t;
  return function(...args) { clearTimeout(t); t = setTimeout(() => fn.apply(this, args), ms); };
}

/* ── Init ────────────────────────────── */

checkSession();
