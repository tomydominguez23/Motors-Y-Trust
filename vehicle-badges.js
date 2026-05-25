/* Trust Motors — insignias sobre fotos de vehículos (público) */
(function (root) {
  function vehicleStatus(vehicle) {
    return String(vehicle?.status || '').trim().toLowerCase();
  }

  function isReserved(vehicle) {
    return vehicleStatus(vehicle) === 'reservado';
  }

  function reservedOverlayHtml() {
    return (
      '<div class="vehicle-reserved-overlay" role="status">' +
      '<span class="vehicle-reserved-label">Reservado</span>' +
      '</div>'
    );
  }

  function vehicleImageBadgesHtml(vehicle) {
    if (isReserved(vehicle)) {
      return reservedOverlayHtml();
    }
    if (vehicle.is_featured) {
      return '<span class="vehicle-badge featured">Destacado</span>';
    }
    return '';
  }

  root.TrustVehicleBadges = {
    vehicleStatus,
    isReserved,
    vehicleImageBadgesHtml,
    reservedOverlayHtml,
  };
})(typeof window !== 'undefined' ? window : globalThis);
