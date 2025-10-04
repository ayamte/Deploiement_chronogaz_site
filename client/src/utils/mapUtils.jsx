// chronogaz_front/src/utils/mapUtils.js

// Créer des icônes personnalisées pour les marqueurs
export const createCustomIcon = (type, color = '#4DAEBD') => {
  if (!window.L) return null;

  const iconHTML = type === 'driver' ? 
    `<div style="
      background-color: ${color}; 
      width: 25px; 
      height: 25px; 
      border-radius: 50%; 
      border: 3px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 12px;
    ">🚚</div>` :
    `<div style="
      background-color: ${color}; 
      width: 25px; 
      height: 25px; 
      border-radius: 50%; 
      border: 3px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 12px;
    ">📍</div>`;

  return window.L.divIcon({
    html: iconHTML,
    className: 'custom-marker-icon',
    iconSize: [31, 31],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15]
  });
};

// Styles CSS pour la carte
export const getMapStyles = () => `
  .custom-marker-icon {
    background: transparent !important;
    border: none !important;
  }
  
  .marker-popup {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    text-align: center;
    min-width: 150px;
  }
  
  .marker-popup h4 {
    margin: 0 0 8px 0;
    color: #1f2937;
    font-size: 14px;
    font-weight: 600;
  }
  
  .marker-popup p {
    margin: 4px 0;
    color: #6b7280;
    font-size: 12px;
  }
  
  .marker-popup small {
    color: #9ca3af;
    font-size: 10px;
  }
  
  .leaflet-popup-content-wrapper {
    border-radius: 8px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }
  
  .leaflet-popup-tip {
    background: white;
  }
`;

// Ajuster la vue de la carte pour inclure tous les marqueurs
export const fitMapBounds = (map, positions) => {
  if (!map || !positions || positions.length === 0) return;

  const validPositions = positions.filter(pos => pos && pos.lat && pos.lng);
  
  if (validPositions.length === 0) return;

  if (validPositions.length === 1) {
    map.setView([validPositions[0].lat, validPositions[0].lng], 15);
    return;
  }

  const bounds = window.L.latLngBounds(
    validPositions.map(pos => [pos.lat, pos.lng])
  );
  
  map.fitBounds(bounds, { 
    padding: [20, 20],
    maxZoom: 16
  });
};

// Calculer la distance entre deux points (en km)
export const calculateDistance = (pos1, pos2) => {
  if (!pos1 || !pos2) return 0;
  
  const R = 6371; // Rayon de la Terre en km
  const dLat = (pos2.lat - pos1.lat) * Math.PI / 180;
  const dLng = (pos2.lng - pos1.lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(pos1.lat * Math.PI / 180) * Math.cos(pos2.lat * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Formater la distance
export const formatDistance = (km) => {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(1)} km`;
};

// Formater la durée
export const formatDuration = (minutes) => {
  if (minutes < 60) {
    return `${Math.round(minutes)} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return `${hours}h ${mins}min`;
};