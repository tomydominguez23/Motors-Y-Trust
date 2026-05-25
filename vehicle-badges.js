/* Trust Motors — insignias sobre fotos de vehículos (público) */
(function (root) {
  function vehicleStatus(vehicle) {
    return String(vehicle?.status || '').trim().toLowerCase();
  }

  function isReserved(vehicle) {
    return vehicleStatus(vehicle) === 'reservado';
  }

  function vehicleImageBadgesHtml(vehicle) {
    if (isReserved(vehicle)) {
      return (
        '<span class="vehicle-badge reserved reserved--center reserved--btn" role="status">' +
        'Reservado</span>'
      );
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
  };
})(typeof window !== 'undefined' ? window : globalThis);
