/* Trust Motors — insignias sobre fotos de vehículos (público) */
(function (root) {
  function isReserved(vehicle) {
    return !!(vehicle && vehicle.status === 'reservado');
  }

  function vehicleImageBadgesHtml(vehicle) {
    if (isReserved(vehicle)) {
      return '<span class="vehicle-badge reserved reserved--center">Reservado</span>';
    }
    if (vehicle.is_featured) {
      return '<span class="vehicle-badge featured">Destacado</span>';
    }
    return '';
  }

  root.TrustVehicleBadges = {
    isReserved,
    vehicleImageBadgesHtml,
  };
})(typeof window !== 'undefined' ? window : globalThis);
