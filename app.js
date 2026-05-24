/* ========================================
   Trust Motors - Application Logic
   ========================================
   CONFIGURACIÓN: Reemplaza SUPABASE_URL y SUPABASE_ANON_KEY
   con los valores de tu proyecto en Supabase.
   Si se dejan vacíos, se usarán datos de ejemplo locales.
   ======================================== */

const SUPABASE_URL = 'https://rjsfkrgsyduiwyamhdkg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqc2ZrcmdzeWR1aXd5YW1oZGtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2Mjg5OTksImV4cCI6MjA5NTIwNDk5OX0.zgmu6vtJGmIILJzEl75vfCn9oiM6j1KqqgkIzw5pg2o';
const WHATSAPP_NUMBER = '56948406684';

let supabaseClient = null;
const USE_SUPABASE = SUPABASE_URL !== 'TU_SUPABASE_URL' && SUPABASE_ANON_KEY !== 'TU_SUPABASE_ANON_KEY';

if (USE_SUPABASE && window.supabase) {
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

/* ── SVG Generators ──────────────────── */

function generateCarSVG(color1, color2, windowColor) {
  const c1 = color1 || '#1a1a2e';
  const c2 = color2 || '#16213e';
  const wc = windowColor || '#a8d8ea';
  const uid = c1.replace('#','');
  return `<svg class="car-svg-thumb" viewBox="0 0 800 400" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="cb_${uid}" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color:${c1};stop-opacity:1"/>
        <stop offset="100%" style="stop-color:${c2};stop-opacity:1"/>
      </linearGradient>
    </defs>
    <path d="M160,260 Q160,220 200,200 L280,160 Q300,140 340,130 L500,120 Q540,120 560,140 L620,200 Q660,220 680,230 L700,240 Q720,250 720,270 L720,290 Q720,300 710,300 L130,300 Q120,300 120,290 L120,280 Q120,260 160,260 Z" fill="url(#cb_${uid})"/>
    <path d="M295,195 L330,150 Q340,138 360,135 L480,128 Q500,128 510,140 L540,195 Z" fill="${wc}" opacity="0.8"/>
    <line x1="420" y1="130" x2="415" y2="195" stroke="${c1}" stroke-width="3"/>
    <ellipse cx="690" cy="250" rx="18" ry="10" fill="#ffd700" opacity="0.9"/>
    <ellipse cx="690" cy="250" rx="10" ry="6" fill="#fff" opacity="0.7"/>
    <ellipse cx="150" cy="260" rx="16" ry="9" fill="#ff4444" opacity="0.8"/>
    <circle cx="230" cy="300" r="42" fill="#222"/><circle cx="230" cy="300" r="34" fill="#333"/>
    <circle cx="230" cy="300" r="18" fill="#555"/><circle cx="230" cy="300" r="8" fill="#888"/>
    <line x1="230" y1="266" x2="230" y2="282" stroke="#777" stroke-width="2"/>
    <line x1="230" y1="318" x2="230" y2="334" stroke="#777" stroke-width="2"/>
    <line x1="196" y1="300" x2="212" y2="300" stroke="#777" stroke-width="2"/>
    <line x1="248" y1="300" x2="264" y2="300" stroke="#777" stroke-width="2"/>
    <circle cx="610" cy="300" r="42" fill="#222"/><circle cx="610" cy="300" r="34" fill="#333"/>
    <circle cx="610" cy="300" r="18" fill="#555"/><circle cx="610" cy="300" r="8" fill="#888"/>
    <line x1="610" y1="266" x2="610" y2="282" stroke="#777" stroke-width="2"/>
    <line x1="610" y1="318" x2="610" y2="334" stroke="#777" stroke-width="2"/>
    <line x1="576" y1="300" x2="592" y2="300" stroke="#777" stroke-width="2"/>
    <line x1="628" y1="300" x2="644" y2="300" stroke="#777" stroke-width="2"/>
    <rect x="390" y="200" width="30" height="4" rx="2" fill="${c2}"/>
    <ellipse cx="280" cy="195" rx="12" ry="8" fill="${c1}" stroke="${c2}" stroke-width="1"/>
  </svg>`;
}

function generateSUVSVG(color1, color2, windowColor) {
  const c1 = color1 || '#2d3436';
  const c2 = color2 || '#1e272e';
  const wc = windowColor || '#a8d8ea';
  const uid = c1.replace('#','');
  return `<svg class="car-svg-thumb" viewBox="0 0 800 420" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="sb_${uid}" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color:${c1};stop-opacity:1"/>
        <stop offset="100%" style="stop-color:${c2};stop-opacity:1"/>
      </linearGradient>
    </defs>
    <path d="M140,270 Q140,240 170,220 L250,160 Q260,145 290,130 L500,115 Q540,115 570,135 L640,200 Q670,220 700,240 L720,255 Q740,265 740,285 L740,310 Q740,320 730,320 L110,320 Q100,320 100,310 L100,290 Q100,270 140,270 Z" fill="url(#sb_${uid})"/>
    <path d="M270,210 L300,148 Q310,132 340,128 L480,120 Q505,120 520,138 L560,210 Z" fill="${wc}" opacity="0.8"/>
    <line x1="415" y1="122" x2="410" y2="210" stroke="${c1}" stroke-width="3"/>
    <ellipse cx="710" cy="260" rx="20" ry="12" fill="#ffd700" opacity="0.9"/>
    <ellipse cx="130" cy="270" rx="18" ry="10" fill="#ff4444" opacity="0.8"/>
    <circle cx="220" cy="320" r="48" fill="#222"/><circle cx="220" cy="320" r="40" fill="#333"/>
    <circle cx="220" cy="320" r="22" fill="#555"/><circle cx="220" cy="320" r="10" fill="#888"/>
    <circle cx="620" cy="320" r="48" fill="#222"/><circle cx="620" cy="320" r="40" fill="#333"/>
    <circle cx="620" cy="320" r="22" fill="#555"/><circle cx="620" cy="320" r="10" fill="#888"/>
    <rect x="380" y="216" width="32" height="4" rx="2" fill="${c2}"/>
  </svg>`;
}

function generatePickupSVG(color1, color2, windowColor) {
  const c1 = color1 || '#4a4a4a';
  const c2 = color2 || '#333333';
  const wc = windowColor || '#a8d8ea';
  const uid = c1.replace('#','');
  return `<svg class="car-svg-thumb" viewBox="0 0 800 400" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="pb_${uid}" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color:${c1};stop-opacity:1"/>
        <stop offset="100%" style="stop-color:${c2};stop-opacity:1"/>
      </linearGradient>
    </defs>
    <rect x="420" y="200" width="280" height="90" rx="6" fill="${c2}" opacity="0.7"/>
    <path d="M150,260 Q150,230 190,210 L260,165 Q275,145 310,135 L420,130 L420,295 L120,295 Q110,295 110,285 L110,275 Q110,260 150,260 Z" fill="url(#pb_${uid})"/>
    <rect x="420" y="210" width="270" height="85" rx="4" fill="url(#pb_${uid})"/>
    <path d="M275,200 L300,150 Q310,138 330,135 L400,130 L400,200 Z" fill="${wc}" opacity="0.8"/>
    <ellipse cx="700" cy="255" rx="18" ry="10" fill="#ffd700" opacity="0.9"/>
    <ellipse cx="140" cy="265" rx="16" ry="9" fill="#ff4444" opacity="0.8"/>
    <circle cx="220" cy="300" r="46" fill="#222"/><circle cx="220" cy="300" r="38" fill="#333"/>
    <circle cx="220" cy="300" r="20" fill="#555"/><circle cx="220" cy="300" r="9" fill="#888"/>
    <circle cx="620" cy="300" r="46" fill="#222"/><circle cx="620" cy="300" r="38" fill="#333"/>
    <circle cx="620" cy="300" r="20" fill="#555"/><circle cx="620" cy="300" r="9" fill="#888"/>
  </svg>`;
}

function getCarSVG(vehicle) {
  const c1 = vehicle.color1 || vehicle.color_1;
  const c2 = vehicle.color2 || vehicle.color_2;
  const wc = vehicle.windowColor || vehicle.window_color;
  const type = vehicle.type;
  if (type === 'SUV') return generateSUVSVG(c1, c2, wc);
  if (type === 'Pickup') return generatePickupSVG(c1, c2, wc);
  return generateCarSVG(c1, c2, wc);
}

/* ── Fallback Data ───────────────────── */

const fallbackVehicles = [
  { id: '1', brand: 'Toyota', model: 'Corolla Cross', year: 2024, type: 'SUV', price: 18990000, km: 12000, fuel: 'Bencina', transmission: 'Automática', is_featured: true, color1: '#2d3436', color2: '#1e272e', window_color: '#a8d8ea', description: 'SUV híbrido con bajo kilometraje, mantenciones al día en servicio oficial. Único dueño.' },
  { id: '2', brand: 'Hyundai', model: 'Tucson', year: 2023, type: 'SUV', price: 16490000, km: 28000, fuel: 'Bencina', transmission: 'Automática', is_featured: false, color1: '#1a3c6e', color2: '#0d2b4e', window_color: '#b8d4e8', description: 'Versión Limited full equipo. Techo panorámico, asientos de cuero calefactados.' },
  { id: '3', brand: 'Kia', model: 'Sportage', year: 2023, type: 'SUV', price: 15990000, km: 35000, fuel: 'Bencina', transmission: 'Automática', is_featured: false, color1: '#6b1d1d', color2: '#4a1212', window_color: '#c8dde8', description: 'Motor 1.6 turbo, pantalla doble, asistente de conducción nivel 2.' },
  { id: '4', brand: 'Toyota', model: 'Yaris', year: 2022, type: 'Sedán', price: 9990000, km: 42000, fuel: 'Bencina', transmission: 'Manual', is_featured: false, color1: '#c0c0c0', color2: '#999999', window_color: '#d0e8f0', description: 'Económico y confiable. Ideal para ciudad.' },
  { id: '5', brand: 'Chevrolet', model: 'Onix', year: 2023, type: 'Sedán', price: 10490000, km: 18000, fuel: 'Bencina', transmission: 'Automática', is_featured: false, color1: '#1a1a1a', color2: '#0a0a0a', window_color: '#b0c8d8', description: 'Versión Premier turbo con Apple CarPlay y Android Auto.' },
  { id: '6', brand: 'Nissan', model: 'Kicks', year: 2024, type: 'SUV', price: 14990000, km: 8000, fuel: 'Bencina', transmission: 'CVT', is_featured: true, color1: '#e67e22', color2: '#c0651a', window_color: '#c8dde8', description: 'Prácticamente nuevo. Versión Exclusive con techo bitono.' },
  { id: '7', brand: 'Mazda', model: 'CX-5', year: 2022, type: 'SUV', price: 17490000, km: 48000, fuel: 'Bencina', transmission: 'Automática', is_featured: false, color1: '#8e1b1b', color2: '#6e1010', window_color: '#c0d6e4', description: 'Soul Red Crystal. Motor Skyactiv-G 2.0L. Impecable.' },
  { id: '8', brand: 'Suzuki', model: 'Swift', year: 2023, type: 'Hatchback', price: 8990000, km: 22000, fuel: 'Bencina', transmission: 'Manual', is_featured: false, color1: '#2980b9', color2: '#1a5276', window_color: '#d0e8f5', description: 'Compacto, eficiente y divertido de manejar.' },
  { id: '9', brand: 'Hyundai', model: 'Accent', year: 2022, type: 'Sedán', price: 9490000, km: 55000, fuel: 'Bencina', transmission: 'Automática', is_featured: false, color1: '#4a4a4a', color2: '#2d2d2d', window_color: '#b8d0e0', description: 'Sedán amplio y confortable. Buen estado general.' },
  { id: '10', brand: 'Toyota', model: 'Hilux', year: 2023, type: 'Pickup', price: 22990000, km: 30000, fuel: 'Diésel', transmission: 'Automática', is_featured: true, color1: '#f0f0f0', color2: '#cccccc', window_color: '#c0d8e8', description: 'SRV 4x4, motor 2.8 diésel. Ideal para trabajo y aventura.' },
  { id: '11', brand: 'Kia', model: 'Rio', year: 2021, type: 'Hatchback', price: 8490000, km: 60000, fuel: 'Bencina', transmission: 'Manual', is_featured: false, color1: '#27ae60', color2: '#1e8449', window_color: '#c8e0ea', description: 'Económico y práctico. Motor 1.4L. Documentación al día.' },
  { id: '12', brand: 'BMW', model: '320i', year: 2022, type: 'Sedán', price: 24990000, km: 38000, fuel: 'Bencina', transmission: 'Automática', is_featured: true, color1: '#0a0a0a', color2: '#1a1a1a', window_color: '#a0c0d8', description: 'Serie 3 Sport Line. Motor 2.0 turbo 184HP, Head-up Display.' },
];

/* ── Data Layer ──────────────────────── */

let allVehicles = [];

async function fetchVehicles() {
  if (USE_SUPABASE && supabaseClient) {
    const { data, error } = await supabaseClient
      .from('vehicles')
      .select('*')
      .eq('status', 'disponible')
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false });

    if (!error && data) {
      allVehicles = data;
      return;
    }
  }
  allVehicles = fallbackVehicles;
}

async function submitInquiry(vehicleId, name, phone, email, message) {
  if (USE_SUPABASE && supabaseClient) {
    const payload = { name, phone, email, message };
    if (vehicleId) payload.vehicle_id = vehicleId;
    const { error } = await supabaseClient.from('inquiries').insert(payload);
    return !error;
  }
  return true;
}

/* ── Formatting ──────────────────────── */

function formatPrice(price) {
  return '$' + Number(price).toLocaleString('es-CL');
}

function formatKm(km) {
  return Number(km).toLocaleString('es-CL') + ' km';
}

function vehicleDetailUrl(id) {
  return `vehiculo.html?id=${encodeURIComponent(id)}`;
}

/* ── Vehicle Card ────────────────────── */

function createVehicleCard(vehicle) {
  const card = document.createElement('div');
  card.className = 'vehicle-card';
  card.dataset.id = vehicle.id;
  card.dataset.type = vehicle.type;
  card.dataset.brand = vehicle.brand;
  card.dataset.price = vehicle.price;
  card.dataset.year = vehicle.year;

  let badgeHTML = '';
  if (vehicle.is_featured) {
    badgeHTML = '<span class="vehicle-badge featured">Destacado</span>';
  }

  const monthly = window.TrustFinance?.getVehicleMonthlyPayment(vehicle);
  const financeLine = monthly
    ? `<span class="vehicle-finance-line">Desde ${formatPrice(monthly)}/mes*</span>`
    : '';

  const coverImage = vehicle.images && vehicle.images.length > 0 ? vehicle.images[0] : null;
  const imageBlock = coverImage
    ? `<img src="${coverImage}" alt="${vehicle.brand} ${vehicle.model}" class="vehicle-photo" loading="lazy">`
    : `<div class="car-platform">
        ${getCarSVG(vehicle)}
        <div class="platform-base"></div>
        <div class="platform-shadow"></div>
      </div>`;

  card.innerHTML = `
    <div class="vehicle-card-image">
      ${badgeHTML}
      ${imageBlock}
    </div>
    <div class="vehicle-card-info">
      <h3>${vehicle.brand} ${vehicle.model}</h3>
      <p class="vehicle-subtitle">${vehicle.year} · ${vehicle.transmission}</p>
      <div class="vehicle-card-specs">
        <span class="vehicle-spec">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="10"/></svg>
          ${formatKm(vehicle.km)}
        </span>
        <span class="vehicle-spec">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h4l3 8 4-16 3 8h4"/></svg>
          ${vehicle.fuel}
        </span>
      </div>
      <div class="vehicle-card-footer">
        <div>
          <span class="vehicle-price">${formatPrice(vehicle.price)}</span>
          <span class="vehicle-price-sub">Precio contado</span>
          ${financeLine}
        </div>
        <a href="${vehicleDetailUrl(vehicle.id)}" class="btn btn-primary btn-view-detail">Ver publicación</a>
      </div>
    </div>
  `;

  card.addEventListener('click', (e) => {
    if (e.target.closest('a')) return;
    window.location.href = vehicleDetailUrl(vehicle.id);
  });
  card.style.cursor = 'pointer';
  return card;
}

/* ── Filtering & Rendering ───────────── */

let currentFilter = 'all';
let currentBrand = '';
let currentType = '';
let currentMaxPrice = '';
let currentMinYear = '';
let visibleCount = 8;

function getFilteredVehicles() {
  return allVehicles.filter(v => {
    if (currentFilter !== 'all' && v.type !== currentFilter) return false;
    if (currentBrand && v.brand !== currentBrand) return false;
    if (currentType && v.type !== currentType) return false;
    if (currentMaxPrice && v.price > parseInt(currentMaxPrice)) return false;
    if (currentMinYear && v.year < parseInt(currentMinYear)) return false;
    return true;
  });
}

function renderVehicles() {
  const grid = document.getElementById('vehiclesGrid');
  const emptyState = document.getElementById('vehiclesEmpty');
  const loadMoreBtn = document.getElementById('btnLoadMore');
  grid.innerHTML = '';

  const filtered = getFilteredVehicles();
  const toShow = filtered.slice(0, visibleCount);

  if (filtered.length === 0) {
    emptyState.style.display = 'block';
    loadMoreBtn.style.display = 'none';
  } else {
    emptyState.style.display = 'none';
    toShow.forEach(v => grid.appendChild(createVehicleCard(v)));
    loadMoreBtn.style.display = filtered.length > visibleCount ? 'inline-flex' : 'none';
  }
}

/* ── Sort Buttons ───────────────────── */

document.querySelectorAll('.sort-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.sort;
    visibleCount = 8;
    renderVehicles();
  });
});

/* ── Search Bar ─────────────────────── */

document.getElementById('btnSearch').addEventListener('click', () => {
  currentBrand = document.getElementById('filterBrand').value;
  currentType = document.getElementById('filterType').value;
  currentMaxPrice = document.getElementById('filterPrice').value;
  currentMinYear = document.getElementById('filterYear').value;

  if (currentType) {
    currentFilter = currentType;
    document.querySelectorAll('.sort-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.sort === currentType);
    });
  } else {
    currentFilter = 'all';
    document.querySelectorAll('.sort-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.sort === 'all');
    });
  }

  visibleCount = 8;
  renderVehicles();
  document.getElementById('vehiculos').scrollIntoView({ behavior: 'smooth' });
});

document.getElementById('btnClearFilters').addEventListener('click', () => {
  currentFilter = 'all';
  currentBrand = '';
  currentType = '';
  currentMaxPrice = '';
  currentMinYear = '';
  document.getElementById('filterBrand').value = '';
  document.getElementById('filterType').value = '';
  document.getElementById('filterPrice').value = '';
  document.getElementById('filterYear').value = '';
  document.querySelectorAll('.sort-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.sort === 'all');
  });
  visibleCount = 8;
  renderVehicles();
});

document.getElementById('btnLoadMore').addEventListener('click', () => {
  visibleCount += 4;
  renderVehicles();
});

/* ── Modal ──────────────────────────── */

function openModal(vehicle) {
  const overlay = document.getElementById('vehicleModal');
  const modalCarIcon = document.getElementById('modalCarIcon');
  const photos = vehicle.images && vehicle.images.length > 0 ? vehicle.images : null;

  if (photos) {
    modalCarIcon.innerHTML = `
      <div class="modal-gallery">
        <img src="${photos[0]}" alt="${vehicle.brand} ${vehicle.model}" class="modal-gallery-main">
        ${photos.length > 1 ? `<div class="modal-gallery-thumbs">${photos.map((url, i) =>
          `<img src="${url}" alt="Foto ${i + 1}" class="modal-gallery-thumb${i === 0 ? ' active' : ''}" data-url="${url}">`
        ).join('')}</div>` : ''}
      </div>`;
    modalCarIcon.querySelectorAll('.modal-gallery-thumb').forEach(thumb => {
      thumb.addEventListener('click', () => {
        modalCarIcon.querySelector('.modal-gallery-main').src = thumb.dataset.url;
        modalCarIcon.querySelectorAll('.modal-gallery-thumb').forEach(t => t.classList.remove('active'));
        thumb.classList.add('active');
      });
    });
  } else {
    modalCarIcon.innerHTML = getCarSVG(vehicle).replace('car-svg-thumb', 'modal-car-svg');
  }

  document.getElementById('modalTitle').textContent = `${vehicle.brand} ${vehicle.model} ${vehicle.year}`;
  document.getElementById('modalPrice').textContent = formatPrice(vehicle.price);
  document.getElementById('modalDesc').textContent = vehicle.description || '';

  const badge = document.getElementById('modalBadge');
  if (vehicle.is_featured) {
    badge.textContent = 'Destacado';
    badge.style.display = 'inline-block';
    badge.style.background = '#fef3c7';
    badge.style.color = '#b45309';
  } else {
    badge.style.display = 'none';
  }

  document.getElementById('modalSpecs').innerHTML = `
    <span class="modal-spec">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
      ${formatKm(vehicle.km)}
    </span>
    <span class="modal-spec">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h4l3 8 4-16 3 8h4"/></svg>
      ${vehicle.fuel}
    </span>
    <span class="modal-spec">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 3l-4 4-4-4"/></svg>
      ${vehicle.transmission}
    </span>
    <span class="modal-spec">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
      ${vehicle.year}
    </span>
    <span class="modal-spec">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
      ${vehicle.type}
    </span>
  `;

  const msg = encodeURIComponent(`Hola, me interesa el ${vehicle.brand} ${vehicle.model} ${vehicle.year} publicado en Trust Motors (${formatPrice(vehicle.price)}). ¿Está disponible?`);
  document.getElementById('modalWhatsApp').href = `https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${msg}`;

  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('vehicleModal').classList.remove('active');
  document.body.style.overflow = '';
}

document.getElementById('modalClose').addEventListener('click', closeModal);
document.getElementById('modalClose2').addEventListener('click', closeModal);
document.getElementById('vehicleModal').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) closeModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

/* ── Header Scroll ──────────────────── */

window.addEventListener('scroll', () => {
  document.getElementById('header').classList.toggle('scrolled', window.scrollY > 20);
});

/* ── Hamburger ──────────────────────── */

document.getElementById('hamburger').addEventListener('click', () => {
  document.getElementById('hamburger').classList.toggle('active');
  document.getElementById('nav').classList.toggle('open');
});

document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', () => {
    document.getElementById('hamburger').classList.remove('active');
    document.getElementById('nav').classList.remove('open');
  });
});

/* ── Active Nav Link on Scroll ──────── */

const sections = document.querySelectorAll('section[id]');
window.addEventListener('scroll', () => {
  const scrollY = window.scrollY + 100;
  sections.forEach(section => {
    const top = section.offsetTop;
    const height = section.offsetHeight;
    const id = section.getAttribute('id');
    const link = document.querySelector(`.nav-link[href="#${id}"]`);
    if (link) {
      link.classList.toggle('active', scrollY >= top && scrollY < top + height);
    }
  });
});

/* ── Contact Form ───────────────────── */

document.getElementById('contactForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('name').value;
  const phone = document.getElementById('phone').value;
  const email = document.getElementById('email').value;
  const message = document.getElementById('message').value;

  await submitInquiry(null, name, phone, email, message);

  const msg = encodeURIComponent(
    `Hola Trust Motors, soy ${name}.\n` +
    `${message ? 'Mensaje: ' + message + '\n' : ''}` +
    `${email ? 'Email: ' + email + '\n' : ''}` +
    `Teléfono: ${phone}`
  );

  window.open(`https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${msg}`, '_blank');
  e.target.reset();
});

/* ── Site images (logo, banners) ─────── */

async function applySiteSettings() {
  if (!supabaseClient) return;
  const { data, error } = await supabaseClient.from('site_settings').select('key, value');
  if (error || !data?.length) return;

  const settings = {};
  data.forEach((row) => { if (row.value) settings[row.key] = row.value; });

  if (settings.logo_header) {
    document.querySelectorAll('.header .logo, .footer-brand .logo').forEach((el) => {
      el.innerHTML = `<img src="${settings.logo_header}" alt="Trust Motors" class="site-logo-img">`;
    });
  }

  if (settings.hero_banner) {
    const showcase = document.querySelector('.hero-car-showcase');
    if (showcase) {
      showcase.innerHTML = `<img src="${settings.hero_banner}" alt="Vehículos Trust Motors" class="hero-banner-img">`;
    }
  }

  if (settings.hero_background) {
    const hero = document.querySelector('.hero');
    if (hero) {
      hero.style.backgroundImage = `url(${settings.hero_background})`;
      hero.style.backgroundSize = 'cover';
      hero.style.backgroundPosition = 'center';
    }
  }

  if (settings.about_image) {
    const aboutVisual = document.querySelector('.about-visual');
    if (aboutVisual) {
      aboutVisual.innerHTML = `<img src="${settings.about_image}" alt="Sobre Trust Motors" class="about-banner-img">`;
    }
  }
}

/* ── Init ────────────────────────────── */

async function init() {
  await Promise.all([fetchVehicles(), applySiteSettings()]);
  renderVehicles();
}

init();
