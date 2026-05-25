/* Trust Motors — insignias y estado en el sitio público */
(function (root) {
  const PUBLIC_WEB_STATUSES = ['disponible', 'reservado', 'vendido'];

  function vehicleStatus(vehicle) {
    return String(vehicle?.status || '').trim().toLowerCase();
  }

  function isReserved(vehicle) {
    return vehicleStatus(vehicle) === 'reservado';
  }

  function isSold(vehicle) {
    return vehicleStatus(vehicle) === 'vendido';
  }

  /** Reservado o vendido: no mostrar precio en tarjetas */
  function isUnavailable(vehicle) {
    return isReserved(vehicle) || isSold(vehicle);
  }

  function unavailableLabel(vehicle) {
    if (isSold(vehicle)) return 'Vendido';
    if (isReserved(vehicle)) return 'Reservado';
    return null;
  }

  function unavailablePriceClass(vehicle) {
    if (isSold(vehicle)) return 'price--sold';
    if (isReserved(vehicle)) return 'price--reserved';
    return '';
  }

  function statusOverlayHtml(vehicle) {
    const label = unavailableLabel(vehicle);
    if (!label) return '';
    const mod = isSold(vehicle) ? 'sold' : 'reserved';
    return (
      '<div class="vehicle-status-overlay vehicle-status-overlay--' + mod + '" role="status">' +
      '<span class="vehicle-status-label">' + label + '</span>' +
      '</div>'
    );
  }

  function vehicleImageBadgesHtml(vehicle) {
    const overlay = statusOverlayHtml(vehicle);
    if (overlay) return overlay;
    if (vehicle.is_featured) {
      return '<span class="vehicle-badge featured">Destacado</span>';
    }
    return '';
  }

  root.TrustVehicleBadges = {
    PUBLIC_WEB_STATUSES,
    vehicleStatus,
    isReserved,
    isSold,
    isUnavailable,
    unavailableLabel,
    unavailablePriceClass,
    vehicleImageBadgesHtml,
    statusOverlayHtml,
    /* compat */
    reservedOverlayHtml: statusOverlayHtml,
  };
})(typeof window !== 'undefined' ? window : globalThis);
