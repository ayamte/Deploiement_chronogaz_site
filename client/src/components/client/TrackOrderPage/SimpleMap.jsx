// ✅ Composant carte simplifié qui fonctionne à coup sûr
import React, { useEffect, useRef, useState } from 'react';

const SimpleMap = ({ deliveryId, driverPosition, destinationPosition }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const [error, setError] = useState(null);

  // Charger Leaflet
  useEffect(() => {
    if (window.L) {
      console.log('✅ Leaflet déjà chargé');
      return;
    }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => {
      console.log('✅ Leaflet chargé pour SimpleMap');
    };
    document.head.appendChild(script);
  }, []);

  // Initialiser la carte
  useEffect(() => {
    if (!window.L || mapReady) return;

    const timer = setTimeout(() => {
      if (!mapRef.current) {
        console.error('❌ SimpleMap: Conteneur introuvable');
        setError('Conteneur de carte introuvable');
        return;
      }

      try {
        const center = destinationPosition || driverPosition || { lat: 33.5731, lng: -7.5898 };
        
        console.log('🗺️ SimpleMap: Initialisation avec centre:', center);
        
        mapInstanceRef.current = window.L.map(mapRef.current, {
          center: [center.lat, center.lng],
          zoom: 13,
          zoomControl: true
        });

        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(mapInstanceRef.current);

        setMapReady(true);
        console.log('✅ SimpleMap initialisée avec succès');
      } catch (err) {
        console.error('❌ Erreur SimpleMap:', err);
        setError('Erreur: ' + err.message);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [destinationPosition, driverPosition]);

  // Ajouter marqueurs
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return;

    try {
      // Nettoyer les marqueurs existants
      mapInstanceRef.current.eachLayer((layer) => {
        if (layer instanceof window.L.Marker) {
          mapInstanceRef.current.removeLayer(layer);
        }
      });

      const markers = [];

      // Marqueur destination
      if (destinationPosition) {
        const destMarker = window.L.marker([destinationPosition.lat, destinationPosition.lng])
          .addTo(mapInstanceRef.current)
          .bindPopup('🏠 Destination');
        markers.push(destMarker);
        console.log('📍 Marqueur destination ajouté');
      }

      // Marqueur chauffeur
      if (driverPosition) {
        const driverMarker = window.L.marker([driverPosition.lat, driverPosition.lng])
          .addTo(mapInstanceRef.current)
          .bindPopup('🚗 Chauffeur');
        markers.push(driverMarker);
        console.log('📍 Marqueur chauffeur ajouté');
      }

      // Ajuster la vue
      if (markers.length > 0) {
        const group = new window.L.featureGroup(markers);
        mapInstanceRef.current.fitBounds(group.getBounds(), { padding: [20, 20] });
      }

    } catch (err) {
      console.error('❌ Erreur ajout marqueurs SimpleMap:', err);
    }
  }, [mapReady, driverPosition, destinationPosition]);

  if (error) {
    return (
      <div style={{ 
        padding: '20px', 
        backgroundColor: '#f8d7da', 
        border: '1px solid #f5c6cb',
        borderRadius: '8px',
        color: '#721c24'
      }}>
        <h4>❌ Erreur carte</h4>
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()}
          style={{
            padding: '8px 16px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          🔄 Recharger la page
        </button>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div 
        ref={mapRef}
        id={`simple-map-${deliveryId}`}
        style={{ 
          width: '100%', 
          height: '100%',
          minHeight: '350px',
          border: '1px solid #ccc'
        }}
      />
      
      {!mapReady && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'rgba(255,255,255,0.9)',
          padding: '20px',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div>🗺️ Chargement de la carte...</div>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
            ID: {deliveryId}
          </div>
        </div>
      )}
      
      {mapReady && (
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'rgba(255,255,255,0.9)',
          padding: '8px',
          borderRadius: '4px',
          fontSize: '12px',
          border: '1px solid #ccc'
        }}>
          <div>🚗 Chauffeur: {driverPosition ? '✅' : '❌'}</div>
          <div>🏠 Destination: {destinationPosition ? '✅' : '❌'}</div>
        </div>
      )}
    </div>
  );
};

export default SimpleMap;
