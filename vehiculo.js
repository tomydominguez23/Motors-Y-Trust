/* Trust Motors - Página de detalle de vehículo */

const SUPABASE_URL = 'https://rjsfkrgsyduiwyamhdkg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqc2ZrcmdzeWR1aXd5YW1oZGtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2Mjg5OTksImV4cCI6MjA5NTIwNDk5OX0.zgmu6vtJGmIILJzEl75vfCn9oiM6j1KqqgkIzw5pg2o';
const WHATSAPP_NUMBER = '56948406684';
const DEALER_LOCATION = 'Zoco La Dehesa, piso -3';

(function ensureTrustFinance() {
  if (typeof window !== 'undefined' && window.TrustFinance) return;
  function calcMonthlyPayment(price, downPayment = 0, months = 48, annualRatePercent = 24) {
    const principal = Math.max(0, Number(price) - Number(downPayment || 0));
    const n = Math.max(1, parseInt(months, 10) || 48);
    if (principal <= 0) return 0;
    const annual = Number(annualRatePercent);
    if (!annual || annual <= 0) return Math.round(principal / n);
    const r = annual / 100 / 12;
    const factor = Math.pow(1 + r, n);
    return Math.round((principal * r * factor) / (factor - 1));
  }
  function getVehicleMonthlyPayment(vehicle) {
    if (!vehicle || vehicle.finance_enabled === false) return null;
    if (vehicle.finance_monthly != null && vehicle.finance_monthly > 0) {
      return Number(vehicle.finance_monthly);
    }
    return calcMonthlyPayment(
      vehicle.price,
      vehicle.finance_down_payment ?? 0,
      vehicle.finance_months ?? 48,
      vehicle.finance_annual_rate ?? 24
    );
  }
  function formatFinanceNote(vehicle) {
    const months = vehicle.finance_months ?? 48;
    const down = Number(vehicle.finance_down_payment || 0);
    const rate = vehicle.finance_annual_rate ?? 24;
    let note = `*Cuota referencial a ${months} meses`;
    if (down > 0) note += `, pie ${down.toLocaleString('es-CL')}`;
    note += `, tasa anual referencial ${rate}%. Sujeto a evaluación crediticia.`;
    return note;
  }
  if (typeof window !== 'undefined') {
    window.TrustFinance = { calcMonthlyPayment, getVehicleMonthlyPayment, formatFinanceNote };
  }
})();

let supabaseClient = null;
if (window.supabase) {
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

let currentVehicle = null;
let galleryPhotos = [];
let galleryIndex = 0;

const fallbackVehicles = [
  { id: '1', brand: 'Toyota', model: 'Corolla Cross', year: 2024, type: 'SUV', price: 18990000, km: 12000, fuel: 'Bencina', transmission: 'Automática', is_featured: true, color1: '#2d3436', color2: '#1e272e', window_color: '#a8d8ea', description: 'SUV híbrido con bajo kilometraje, mantenciones al día en servicio oficial. Único dueño.', images: [], status: 'disponible' },
  { id: '2', brand: 'Hyundai', model: 'Tucson', year: 2023, type: 'SUV', price: 16490000, km: 28000, fuel: 'Bencina', transmission: 'Automática', is_featured: false, color1: '#1a3c6e', color2: '#0d2b4e', window_color: '#b8d4e8', description: 'Versión Limited full equipo.', images: [], status: 'disponible' },
];

function formatPrice(price) {
  return '$' + Number(price).toLocaleString('es-CL');
}

function formatKm(km) {
  const n = Number(km);
  if (n <= 5) return n + ' Kms';
  return n.toLocaleString('es-CL') + ' km';
}

function getVehicleIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id') || params.get('v');
}

function vehicleUrl(id) {
  return `vehiculo.html?id=${encodeURIComponent(id)}`;
}

function generateCarSVG(color1, color2, windowColor) {
  const c1 = color1 || '#1a1a2e';
  const c2 = color2 || '#16213e';
  const wc = windowColor || '#a8d8ea';
  const uid = c1.replace('#', '');
  return `<svg class="car-svg-thumb" viewBox="0 0 800 400" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="cb_${uid}" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:${c1}"/><stop offset="100%" style="stop-color:${c2}"/>
    </linearGradient></defs>
    <path d="M160,260 Q160,220 200,200 L280,160 Q300,140 340,130 L500,120 Q540,120 560,140 L620,200 Q660,220 680,230 L700,240 Q720,250 720,270 L720,290 Q720,300 710,300 L130,300 Q120,300 120,290 L120,280 Q120,260 160,260 Z" fill="url(#cb_${uid})"/>
    <path d="M295,195 L330,150 Q340,138 360,135 L480,128 Q500,128 510,140 L540,195 Z" fill="${wc}" opacity="0.8"/>
    <circle cx="230" cy="300" r="42" fill="#222"/><circle cx="230" cy="300" r="18" fill="#555"/>
    <circle cx="610" cy="300" r="42" fill="#222"/><circle cx="610" cy="300" r="18" fill="#555"/>
  </svg>`;
}

function generateSUVSVG(color1, color2, windowColor) {
  const c1 = color1 || '#2d3436';
  const c2 = color2 || '#1e272e';
  const wc = windowColor || '#a8d8ea';
  const uid = c1.replace('#', '');
  return `<svg class="car-svg-thumb" viewBox="0 0 800 420" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="sb_${uid}" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:${c1}"/><stop offset="100%" style="stop-color:${c2}"/>
    </linearGradient></defs>
    <path d="M140,270 Q140,240 170,220 L250,160 Q260,145 290,130 L500,115 Q540,115 570,135 L640,200 Q670,220 700,240 L720,255 Q740,265 740,285 L740,310 Q740,320 730,320 L110,320 Q100,320 100,310 L100,290 Q100,270 140,270 Z" fill="url(#sb_${uid})"/>
    <circle cx="220" cy="320" r="48" fill="#222"/><circle cx="620" cy="320" r="48" fill="#222"/>
  </svg>`;
}

function getCarSVG(vehicle) {
  const c1 = vehicle.color1 || vehicle.color_1;
  const c2 = vehicle.color2 || vehicle.color_2;
  const wc = vehicle.window_color || vehicle.windowColor;
  if (vehicle.type === 'SUV') return generateSUVSVG(c1, c2, wc);
  return generateCarSVG(c1, c2, wc);
}

async function fetchVehicleById(id) {
  if (supabaseClient) {
    const { data, error } = await supabaseClient
      .from('vehicles')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (!error && data) return data;
  }
  return fallbackVehicles.find((v) => v.id === id) || null;
}

async function fetchRelatedVehicles(current) {
  if (!supabaseClient) {
    return fallbackVehicles.filter((v) => v.id !== current.id).slice(0, 3);
  }
  const { data } = await supabaseClient
    .from('vehicles')
    .select('id, brand, model, year, type, price, km, images, status, color1, color2, window_color')
    .in('status', ['disponible', 'reservado', 'vendido'])
    .neq('id', current.id)
    .limit(12);
  const list = data || [];
  const sameType = list.filter((v) => v.type === current.type);
  const pool = sameType.length >= 3 ? sameType : list;
  return pool.slice(0, 3);
}

function specItem(iconSvg, label, value) {
  return `
    <div class="vd-spec-item">
      <div class="vd-spec-icon">${iconSvg}</div>
      <div>
        <strong>${label}</strong>
        <span>${value}</span>
      </div>
    </div>`;
}

const ICONS = {
  year: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
  km: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
  fuel: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 22V6a2 2 0 012-2h6a2 2 0 012 2v16"/><path d="M3 22h12"/><path d="M15 10V4a2 2 0 012-2h2a2 2 0 012 2v16"/></svg>',
  trans: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83"/></svg>',
  body: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 17h14M5 17a2 2 0 01-2-2V9a2 2 0 012-2h1l2-3h8l2 3h1a2 2 0 012 2v6a2 2 0 01-2 2"/></svg>',
  loc: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>',
};

function updateGalleryStatusBadge() {
  const wrap = document.querySelector('.vd-gallery-main-wrap');
  if (!wrap) return;
  wrap.querySelector('.vehicle-status-overlay')?.remove();
  if (currentVehicle && window.TrustVehicleBadges?.isUnavailable(currentVehicle)) {
    wrap.insertAdjacentHTML(
      'beforeend',
      window.TrustVehicleBadges.vehicleImageBadgesHtml(currentVehicle)
    );
  }
}

function renderGalleryMain() {
  const main = document.getElementById('vdGalleryMain');
  const counter = document.getElementById('vdCounter');
  const prev = document.getElementById('vdPrev');
  const next = document.getElementById('vdNext');

  if (!main) return;

  const total = galleryPhotos.length || 1;
  galleryIndex = Math.max(0, Math.min(galleryIndex, total - 1));

  if (galleryPhotos.length > 0) {
    main.innerHTML = `<img src="${galleryPhotos[galleryIndex]}" alt="Foto ${galleryIndex + 1}">`;
  } else if (currentVehicle) {
    main.innerHTML = `<div class="vd-svg-fallback">${getCarSVG(currentVehicle)}</div>`;
  }

  updateGalleryStatusBadge();

  counter.textContent = galleryPhotos.length > 0
    ? `${galleryIndex + 1} / ${galleryPhotos.length}`
    : '1 / 1';

  const multi = galleryPhotos.length > 1;
  prev.disabled = !multi;
  next.disabled = !multi;
}

function renderGalleryThumbs() {
  const thumbs = document.getElementById('vdThumbs');
  if (!thumbs) return;

  if (galleryPhotos.length <= 1) {
    thumbs.innerHTML = '';
    return;
  }

  thumbs.innerHTML = galleryPhotos.map((url, i) =>
    `<img src="${url}" alt="Miniatura ${i + 1}" class="${i === galleryIndex ? 'active' : ''}" data-index="${i}">`
  ).join('');

  thumbs.querySelectorAll('img').forEach((img) => {
    img.addEventListener('click', () => {
      galleryIndex = parseInt(img.dataset.index, 10);
      renderGalleryMain();
      renderGalleryThumbs();
    });
  });
}

function setupGallery() {
  document.getElementById('vdPrev')?.addEventListener('click', () => {
    if (galleryPhotos.length < 2) return;
    galleryIndex = (galleryIndex - 1 + galleryPhotos.length) % galleryPhotos.length;
    renderGalleryMain();
    renderGalleryThumbs();
  });
  document.getElementById('vdNext')?.addEventListener('click', () => {
    if (galleryPhotos.length < 2) return;
    galleryIndex = (galleryIndex + 1) % galleryPhotos.length;
    renderGalleryMain();
    renderGalleryThumbs();
  });
}

function getSavedIds() {
  try {
    return JSON.parse(localStorage.getItem('tm_saved_vehicles') || '[]');
  } catch {
    return [];
  }
}

function setSavedIds(ids) {
  localStorage.setItem('tm_saved_vehicles', JSON.stringify(ids));
}

function updateSaveButton() {
  const btn = document.getElementById('vdSave');
  const label = document.getElementById('vdSaveLabel');
  if (!btn || !currentVehicle) return;
  const saved = getSavedIds().includes(currentVehicle.id);
  btn.setAttribute('aria-pressed', saved ? 'true' : 'false');
  label.textContent = saved ? 'Guardado' : 'Guardar';
}

function setupSaveButton() {
  document.getElementById('vdSave')?.addEventListener('click', () => {
    if (!currentVehicle) return;
    let ids = getSavedIds();
    if (ids.includes(currentVehicle.id)) {
      ids = ids.filter((x) => x !== currentVehicle.id);
    } else {
      ids.push(currentVehicle.id);
    }
    setSavedIds(ids);
    updateSaveButton();
  });
}

function renderVehicle(vehicle) {
  currentVehicle = vehicle;
  galleryPhotos = (vehicle.images || []).filter(Boolean);
  galleryIndex = 0;

  document.title = `${vehicle.brand} ${vehicle.model} ${vehicle.year} | Trust Motors`;

  document.getElementById('vdTitle').textContent = `${vehicle.brand} ${vehicle.model}`;
  document.getElementById('vdSubtitle').textContent =
    `${vehicle.brand} ${vehicle.model}`.toUpperCase();
  const priceEl = document.getElementById('vdPrice');
  const badges = window.TrustVehicleBadges;
  const unavailable = badges?.isUnavailable(vehicle);
  const statusLabel = badges?.unavailableLabel(vehicle);
  if (priceEl) {
    priceEl.textContent = unavailable ? statusLabel : formatPrice(vehicle.price);
    priceEl.classList.remove('vd-price--reserved', 'vd-price--sold');
    if (unavailable) {
      priceEl.classList.add(badges?.isSold(vehicle) ? 'vd-price--sold' : 'vd-price--reserved');
    }
  }

  const financeBox = document.getElementById('vdFinanceBox');
  const monthly = !unavailable ? window.TrustFinance?.getVehicleMonthlyPayment(vehicle) : null;
  if (financeBox) {
    if (unavailable) {
      financeBox.hidden = true;
    } else if (monthly) {
      financeBox.hidden = false;
      document.getElementById('vdFinanceAmount').textContent = formatPrice(monthly);
      const noteEl = document.getElementById('vdFinanceNote');
      if (noteEl && window.TrustFinance?.formatFinanceNote) {
        noteEl.textContent = TrustFinance.formatFinanceNote(vehicle);
      }
    } else {
      financeBox.hidden = true;
    }
  }

  const desc = vehicle.description?.trim() ||
    `Vehículo ${vehicle.brand} ${vehicle.model} año ${vehicle.year} disponible en Trust Motors.`;
  document.getElementById('vdDescription').textContent = desc;

  document.getElementById('vdSpecs').innerHTML = [
    specItem(ICONS.year, 'Año', vehicle.year),
    specItem(ICONS.km, 'Kilometraje', formatKm(vehicle.km)),
    specItem(ICONS.fuel, 'Combustible', vehicle.fuel || '—'),
    specItem(ICONS.trans, 'Transmisión', vehicle.transmission || '—'),
    specItem(ICONS.body, 'Carrocería', vehicle.type || '—'),
    specItem(ICONS.loc, 'Ubicación', DEALER_LOCATION),
  ].join('');

  const financeTxt = monthly ? ` Cuota referencial: ${formatPrice(monthly)}/mes.` : '';
  const priceTxt = unavailable
    ? ` (${statusLabel?.toLowerCase() || 'no disponible'})`
    : ` (${formatPrice(vehicle.price)})`;
  const msg = encodeURIComponent(
    `Hola, me interesa el ${vehicle.brand} ${vehicle.model} ${vehicle.year}${priceTxt}.${financeTxt} Publicado en Trust Motors. ` +
    window.location.href
  );
  document.getElementById('vdWhatsApp').href =
    `https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${msg}`;

  renderGalleryMain();
  renderGalleryThumbs();
  updateSaveButton();
}

function renderRelated(vehicles) {
  const section = document.getElementById('vdRelated');
  const grid = document.getElementById('vdRelatedGrid');
  if (!section || !grid || !vehicles.length) return;

  section.hidden = false;
  grid.innerHTML = vehicles.map((v) => {
    const cover = v.images?.[0];
    const badge = window.TrustVehicleBadges?.vehicleImageBadgesHtml(v) || '';
    const visual = cover
      ? `<img src="${cover}" alt="${v.brand} ${v.model}" loading="lazy">`
      : `<div class="vd-related-svg">${getCarSVG(v)}</div>`;
    return `
      <a href="${vehicleUrl(v.id)}" class="vd-related-card">
        <div class="vd-related-media">${badge}${visual}</div>
        <div class="vd-related-body">
          <h3>${v.brand} ${v.model}</h3>
          <p>${v.year} · ${formatKm(v.km)}</p>
          <p class="vd-related-price">${formatPrice(v.price)}</p>
        </div>
      </a>`;
  }).join('');
}

function showState(state) {
  document.getElementById('vdLoading').hidden = state !== 'loading';
  document.getElementById('vdError').hidden = state !== 'error';
  document.getElementById('vdContent').hidden = state !== 'content';
}

async function init() {
  const id = getVehicleIdFromUrl();
  if (!id) {
    showState('error');
    return;
  }

  setupGallery();
  setupSaveButton();

  const vehicle = await fetchVehicleById(id);
  if (!vehicle) {
    showState('error');
    return;
  }

  renderVehicle(vehicle);
  showState('content');

  const related = await fetchRelatedVehicles(vehicle);
  renderRelated(related);
}

document.getElementById('hamburger')?.addEventListener('click', () => {
  document.getElementById('hamburger').classList.toggle('active');
  document.getElementById('nav').classList.toggle('open');
});

window.addEventListener('scroll', () => {
  document.getElementById('header')?.classList.toggle('scrolled', window.scrollY > 20);
});

document.addEventListener('keydown', (e) => {
  if (galleryPhotos.length < 2) return;
  if (e.key === 'ArrowLeft') {
    document.getElementById('vdPrev')?.click();
  }
  if (e.key === 'ArrowRight') {
    document.getElementById('vdNext')?.click();
  }
});

init();
