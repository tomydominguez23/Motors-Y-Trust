/* Trust Motors — Catálogo de vehículos (autos.html) */

const SUPABASE_URL = 'https://rjsfkrgsyduiwyamhdkg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqc2ZrcmdzeWR1aXd5YW1oZGtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2Mjg5OTksImV4cCI6MjA5NTIwNDk5OX0.zgmu6vtJGmIILJzEl75vfCn9oiM6j1KqqgkIzw5pg2o';
const WHATSAPP_NUMBER = '56948406684';
const DEALER_REGION = 'Metropolitana';

let supabaseClient = null;
if (window.supabase) {
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

let allVehicles = [];
let filters = {
  type: '',
  brand: '',
  model: '',
  minYear: '',
  maxPrice: '',
  fuel: '',
  transmission: '',
  financeOnly: false,
};
let sortBy = 'featured';
let visibleCount = 12;

function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatPrice(price) {
  return '$' + Number(price).toLocaleString('es-CL');
}

function formatKm(km) {
  const n = Number(km);
  if (n <= 5) return n + ' km';
  return n.toLocaleString('es-CL') + ' km';
}

function transmissionShort(t) {
  if (!t) return '—';
  if (/autom/i.test(t)) return 'AT';
  if (/manual/i.test(t)) return 'MT';
  if (/cvt/i.test(t)) return 'CVT';
  return t.slice(0, 6);
}

function isFinanciable(vehicle) {
  if (vehicle.finance_enabled === false) return false;
  return Boolean(window.TrustFinance?.getVehicleMonthlyPayment(vehicle));
}

function vehicleDetailUrl(id) {
  return `vehiculo.html?id=${encodeURIComponent(id)}`;
}

function whatsappVehicleUrl(vehicle) {
  const text = encodeURIComponent(
    `Hola Trust Motors, me interesa el ${vehicle.brand} ${vehicle.model} ${vehicle.year} (${formatPrice(vehicle.price)}). ¿Está disponible?`
  );
  return `https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${text}`;
}

async function fetchVehicles() {
  if (!supabaseClient) return [];
  const { data, error } = await supabaseClient
    .from('vehicles')
    .select('*')
    .eq('status', 'disponible')
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('Catálogo:', error.message);
    return [];
  }
  return Array.isArray(data) ? data : [];
}

function populateFilterOptions() {
  const brandSel = document.getElementById('catBrand');
  const modelSel = document.getElementById('catModel');
  if (!brandSel) return;

  const brands = [...new Set(allVehicles.map((v) => v.brand).filter(Boolean))].sort();
  brandSel.innerHTML = '<option value="">Todas</option>';
  brands.forEach((b) => {
    const opt = document.createElement('option');
    opt.value = b;
    opt.textContent = b;
    brandSel.appendChild(opt);
  });

  updateModelOptions();
}

function updateModelOptions() {
  const modelSel = document.getElementById('catModel');
  const brand = filters.brand;
  if (!modelSel) return;

  let list = allVehicles;
  if (brand) list = list.filter((v) => v.brand === brand);

  const models = [...new Set(list.map((v) => v.model).filter(Boolean))].sort();
  modelSel.innerHTML = '<option value="">Todos</option>';
  models.forEach((m) => {
    const opt = document.createElement('option');
    opt.value = m;
    opt.textContent = m;
    modelSel.appendChild(opt);
  });
}

function readFiltersFromUi() {
  filters.type = document.querySelector('.type-chip.active')?.dataset.type || '';
  filters.brand = document.getElementById('catBrand')?.value || '';
  filters.model = document.getElementById('catModel')?.value || '';
  filters.minYear = document.getElementById('catYear')?.value || '';
  filters.maxPrice = document.getElementById('catPriceMax')?.value || '';
  filters.fuel = document.getElementById('catFuel')?.value || '';
  filters.transmission = document.getElementById('catTransmission')?.value || '';
  filters.financeOnly = document.getElementById('catFinanceOnly')?.checked || false;
  sortBy = document.getElementById('catSort')?.value || 'featured';
}

function getFilteredSorted() {
  let list = allVehicles.filter((v) => {
    if (filters.type && v.type !== filters.type) return false;
    if (filters.brand && v.brand !== filters.brand) return false;
    if (filters.model && v.model !== filters.model) return false;
    if (filters.minYear && v.year < parseInt(filters.minYear, 10)) return false;
    if (filters.maxPrice && v.price > parseInt(filters.maxPrice, 10)) return false;
    if (filters.fuel && v.fuel !== filters.fuel) return false;
    if (filters.transmission && v.transmission !== filters.transmission) return false;
    if (filters.financeOnly && !isFinanciable(v)) return false;
    return true;
  });

  switch (sortBy) {
    case 'price-asc':
      list.sort((a, b) => a.price - b.price);
      break;
    case 'price-desc':
      list.sort((a, b) => b.price - a.price);
      break;
    case 'year-desc':
      list.sort((a, b) => b.year - a.year);
      break;
    case 'km-asc':
      list.sort((a, b) => a.km - b.km);
      break;
    default:
      list.sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0));
  }
  return list;
}

function createCatalogCard(vehicle) {
  const card = document.createElement('article');
  card.className = 'catalog-card';

  const photos = vehicle.images && vehicle.images.length ? vehicle.images : [];
  const cover = photos[0];
  const photoCount = photos.length;
  const financiable = isFinanciable(vehicle);
  const monthly = financiable ? window.TrustFinance.getVehicleMonthlyPayment(vehicle) : null;

  const mediaHtml = cover
    ? `<img src="${escapeHtml(cover)}" alt="${escapeHtml(vehicle.brand)} ${escapeHtml(vehicle.model)}" loading="lazy">`
    : '<div class="catalog-card-placeholder">Sin foto</div>';

  const financeBadge = financiable
    ? '<span class="catalog-finance-badge">Financiable</span>'
    : '';

  const photoBadge = photoCount > 0
    ? `<span class="catalog-photo-badge">${photoCount} foto${photoCount !== 1 ? 's' : ''}</span>`
    : '';

  card.innerHTML = `
    <a href="${vehicleDetailUrl(vehicle.id)}" class="catalog-card-media">
      ${mediaHtml}
      ${photoBadge}
      ${financeBadge}
    </a>
    <div class="catalog-card-body">
      <a href="${vehicleDetailUrl(vehicle.id)}">
        <h3 class="catalog-card-title">${escapeHtml(vehicle.brand)} ${escapeHtml(vehicle.model)}</h3>
        <p class="catalog-card-sub">${escapeHtml(vehicle.type || '')} · ${escapeHtml(vehicle.transmission || '')}</p>
      </a>
      <div class="catalog-card-prices">
        <div>
          <span class="label">Año</span>
          <div class="year">${vehicle.year}</div>
        </div>
        <div>
          <span class="label">Precio</span>
          <div class="price">${formatPrice(vehicle.price)}</div>
        </div>
      </div>
      ${monthly ? `<p class="catalog-card-finance">Desde ${formatPrice(monthly)}/mes*</p>` : ''}
      <div class="catalog-card-specs">
        <div class="catalog-spec">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
          <strong>${formatKm(vehicle.km)}</strong>
        </div>
        <div class="catalog-spec">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/></svg>
          <strong>${escapeHtml(transmissionShort(vehicle.transmission))}</strong>
        </div>
        <div class="catalog-spec">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h4l3 8 4-16 3 8h4"/></svg>
          <strong>${escapeHtml(vehicle.fuel || '—')}</strong>
        </div>
        <div class="catalog-spec">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21s7-4.35 7-11a7 7 0 10-14 0c0 6.65 7 11 7 11z"/><circle cx="12" cy="10" r="2"/></svg>
          <strong>${escapeHtml(DEALER_REGION)}</strong>
        </div>
      </div>
      <div class="catalog-card-actions">
        <a href="${vehicleDetailUrl(vehicle.id)}" class="btn btn-outline">Ver detalle</a>
        <a href="${whatsappVehicleUrl(vehicle)}" class="btn btn-contact" target="_blank" rel="noopener">Contactar</a>
      </div>
    </div>
  `;

  return card;
}

function renderCatalog() {
  const grid = document.getElementById('catalogGrid');
  const empty = document.getElementById('catalogEmpty');
  const loading = document.getElementById('catalogLoading');
  const countEl = document.getElementById('catalogCount');
  const moreWrap = document.getElementById('catalogMoreWrap');

  if (loading) loading.hidden = true;

  const filtered = getFilteredSorted();
  const toShow = filtered.slice(0, visibleCount);

  if (countEl) {
    countEl.textContent = filtered.length === 1
      ? '1 vehículo encontrado'
      : `${filtered.length} vehículos encontrados`;
  }

  if (!grid) return;
  grid.innerHTML = '';

  if (filtered.length === 0) {
    if (empty) empty.hidden = false;
    if (moreWrap) moreWrap.hidden = true;
    return;
  }

  if (empty) empty.hidden = true;
  toShow.forEach((v) => grid.appendChild(createCatalogCard(v)));

  if (moreWrap) {
    moreWrap.hidden = filtered.length <= visibleCount;
  }
}

function applyFiltersAndRender() {
  readFiltersFromUi();
  visibleCount = 12;
  renderCatalog();
  closeFiltersPanel();
}

function clearFilters() {
  filters = {
    type: '',
    brand: '',
    model: '',
    minYear: '',
    maxPrice: '',
    fuel: '',
    transmission: '',
    financeOnly: false,
  };
  document.querySelectorAll('.type-chip').forEach((c) => {
    c.classList.toggle('active', c.dataset.type === '');
  });
  ['catBrand', 'catModel', 'catYear', 'catPriceMax', 'catFuel', 'catTransmission'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const fin = document.getElementById('catFinanceOnly');
  if (fin) fin.checked = false;
  const sort = document.getElementById('catSort');
  if (sort) sort.value = 'featured';
  sortBy = 'featured';
  updateModelOptions();
  visibleCount = 12;
  renderCatalog();
}

function openFiltersPanel() {
  document.getElementById('catalogFilters')?.classList.add('open');
  document.getElementById('filtersBackdrop')?.classList.add('visible');
  document.getElementById('filtersBackdrop')?.removeAttribute('hidden');
  document.getElementById('btnToggleFilters')?.setAttribute('aria-expanded', 'true');
  document.body.style.overflow = 'hidden';
}

function closeFiltersPanel() {
  document.getElementById('catalogFilters')?.classList.remove('open');
  const bd = document.getElementById('filtersBackdrop');
  bd?.classList.remove('visible');
  bd?.setAttribute('hidden', '');
  document.getElementById('btnToggleFilters')?.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}

function bindCatalogUi() {
  document.getElementById('btnToggleFilters')?.addEventListener('click', openFiltersPanel);
  document.getElementById('btnCloseFilters')?.addEventListener('click', closeFiltersPanel);
  document.getElementById('filtersBackdrop')?.addEventListener('click', closeFiltersPanel);

  document.querySelectorAll('.type-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.type-chip').forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      filters.type = chip.dataset.type || '';
      applyFiltersAndRender();
    });
  });

  document.getElementById('catBrand')?.addEventListener('change', () => {
    filters.brand = document.getElementById('catBrand').value;
    updateModelOptions();
  });

  document.getElementById('btnApplyFilters')?.addEventListener('click', applyFiltersAndRender);
  document.getElementById('btnClearCatalogFilters')?.addEventListener('click', clearFilters);
  document.getElementById('btnEmptyClear')?.addEventListener('click', clearFilters);

  document.getElementById('catSort')?.addEventListener('change', () => {
    sortBy = document.getElementById('catSort').value;
    renderCatalog();
  });

  document.getElementById('btnCatalogMore')?.addEventListener('click', () => {
    visibleCount += 12;
    renderCatalog();
  });

  document.getElementById('hamburger')?.addEventListener('click', () => {
    document.getElementById('hamburger')?.classList.toggle('active');
    document.getElementById('nav')?.classList.toggle('open');
  });

  document.querySelectorAll('.nav-link').forEach((link) => {
    link.addEventListener('click', () => {
      document.getElementById('hamburger')?.classList.remove('active');
      document.getElementById('nav')?.classList.remove('open');
    });
  });

  const params = new URLSearchParams(window.location.search);
  const typeParam = params.get('tipo');
  if (typeParam) {
    const chip = document.querySelector(`.type-chip[data-type="${typeParam}"]`);
    if (chip) {
      document.querySelectorAll('.type-chip').forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      filters.type = typeParam;
    }
  }
}

async function initCatalog() {
  bindCatalogUi();
  allVehicles = await fetchVehicles();
  populateFilterOptions();
  renderCatalog();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCatalog);
} else {
  initCatalog();
}
