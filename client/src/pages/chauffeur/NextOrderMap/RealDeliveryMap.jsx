// RealDeliveryMap.jsx - Composant de carte réelle pour le chauffeur
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  MdLocationOn as MapPin,
  MdNavigation as Navigation,
  MdMyLocation as MyLocation,
  MdZoomIn as Plus,
  MdZoomOut as Minus,
  MdRefresh as Refresh,
  MdDirections as Route
} from 'react-icons/md';

const RealDeliveryMap = ({ 
  orders = [], 
  currentLocation = null, 
  onOrderSelect = null,
  className = "",
  showRoute = true 
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const currentLocationMarkerRef = useRef(null);
  const routePolylineRef = useRef(null);

  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(currentLocation);

  // ✅ NOUVEAU: Fonction d'initialisation de carte réutilisable
  const initializeMapWithLocation = useCallback((location) => {
    if (mapInstanceRef.current || !mapRef.current || !leafletLoaded) return;

    try {
      console.log('🗺️ [RealDeliveryMap] Initialisation forcée avec position:', location);

      mapInstanceRef.current = window.L.map(mapRef.current, {
        center: [location.lat, location.lng],
        zoom: 12,
        zoomControl: false
      });

      // Tuiles OpenStreetMap
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(mapInstanceRef.current);

      setMapReady(true);
      console.log('✅ Carte chauffeur initialisée avec succès (forcée)');
    } catch (err) {
      console.error('❌ Erreur initialisation carte chauffeur (forcée):', err);
    }
  }, [leafletLoaded]);

  // Chargement de Leaflet
  useEffect(() => {
    const loadLeaflet = async () => {
      if (window.L) {
        setLeafletLoaded(true);
        return;
      }

      try {
        console.log('🗺️ Chargement de Leaflet...');
        
        // CSS Leaflet
        if (!document.querySelector('link[href*="leaflet"]')) {
          const leafletCSS = document.createElement('link');
          leafletCSS.rel = 'stylesheet';
          leafletCSS.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/leaflet.min.css';
          document.head.appendChild(leafletCSS);
        }

        // Script Leaflet
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/leaflet.min.js';
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });

        console.log('✅ Leaflet chargé avec succès');
        setLeafletLoaded(true);
      } catch (err) {
        console.error('❌ Erreur chargement Leaflet:', err);
        setError('Erreur lors du chargement de la carte');
      }
    };
    
    loadLeaflet();

    // Nettoyage
    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        } catch (e) {
          console.error('Erreur suppression carte:', e);
        }
      }
    };
  }, []);

  // Obtenir la position actuelle - Utiliser useCallback pour la mémoriser
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      console.warn('Géolocalisation non supportée');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setUserLocation(location);
        console.log('📍 Position obtenue:', location);
      },
      (error) => {
        console.error('❌ Erreur géolocalisation:', error);
        // Position par défaut (Casablanca)
        setUserLocation({ lat: 33.5731, lng: -7.5898 });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  }, []);

  // Initialiser la carte
  useEffect(() => {
    if (!leafletLoaded || mapReady || !mapRef.current) return;

    // ✅ CORRECTION: Gestion plus flexible des coordonnées
    console.log('🔍 [RealDeliveryMap] Vérification coordonnées:', {
      currentLocation,
      userLocation,
      currentLocationFormat: currentLocation ? {
        lat: currentLocation.lat || currentLocation.latitude,
        lng: currentLocation.lng || currentLocation.longitude
      } : null
    });

    // Normaliser le format des coordonnées
    const normalizeLocation = (loc) => {
      if (!loc) return null;
      return {
        lat: loc.lat || loc.latitude,
        lng: loc.lng || loc.longitude
      };
    };

    const normalizedCurrent = normalizeLocation(currentLocation);
    const normalizedUser = normalizeLocation(userLocation);
    const locationToUse = normalizedCurrent || normalizedUser;

    if (!locationToUse || typeof locationToUse.lat !== 'number' || typeof locationToUse.lng !== 'number') {
      console.log('⏳ Attente des coordonnées valides pour initialiser la carte...');
      console.log('   - currentLocation:', currentLocation);
      console.log('   - userLocation:', userLocation);
      console.log('   - locationToUse:', locationToUse);

      // ✅ NOUVEAU: Initialiser avec coordonnées par défaut après 3 secondes
      if (!mapInstanceRef.current) {
        setTimeout(() => {
          console.log('🔄 Initialisation forcée avec coordonnées par défaut...');
          const defaultLocation = { lat: 33.5731, lng: -7.5898 }; // Casablanca
          initializeMapWithLocation(defaultLocation);
        }, 3000);
      }
      return;
    }

    // ✅ UTILISER la fonction d'initialisation réutilisable
    initializeMapWithLocation(locationToUse);
  }, [leafletLoaded, userLocation, currentLocation]);

  // ✅ Ancienne logique de useEffect retirée
  // La logique de récupération de la position est maintenant liée au bouton

  // Créer des icônes personnalisées
  const createCustomIcon = useCallback((type, color = '#007bff', size = 25) => {
    if (!window.L) return null;

    const iconHtml = type === 'current' 
      ? `<div style="background-color: ${color}; width: ${size}px; height: ${size}px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>`
      : `<div style="background-color: ${color}; width: ${size}px; height: ${size}px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3); position: relative;">
           <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(45deg); color: white; font-weight: bold; font-size: 12px;">${type}</div>
         </div>`;

    return window.L.divIcon({
      html: iconHtml,
      className: 'custom-marker',
      iconSize: [size, size],
      iconAnchor: [size/2, type === 'current' ? size/2 : size],
      popupAnchor: [0, type === 'current' ? -size/2 : -size]
    });
  }, []);

  // ✅ CORRECTION: Mettre à jour la position actuelle avec currentLocation
  useEffect(() => {
    const locationToShow = currentLocation || userLocation;
    console.log('🔍 [RealDeliveryMap] Mise à jour marqueur chauffeur:', {
      mapReady,
      currentLocation,
      userLocation,
      locationToShow
    });

    if (!mapReady || !locationToShow) return;

    try {
      // Normaliser la position
      const normalizedLocation = {
        lat: locationToShow.lat || locationToShow.latitude,
        lng: locationToShow.lng || locationToShow.longitude
      };

      if (!normalizedLocation.lat || !normalizedLocation.lng) {
        console.log('❌ Coordonnées invalides pour marqueur chauffeur:', normalizedLocation);
        return;
      }

      if (currentLocationMarkerRef.current) {
        mapInstanceRef.current.removeLayer(currentLocationMarkerRef.current);
      }

      const currentIcon = createCustomIcon('current', '#28a745', 20);
      currentLocationMarkerRef.current = window.L.marker([normalizedLocation.lat, normalizedLocation.lng], {
        icon: currentIcon
      })
        .addTo(mapInstanceRef.current)
        .bindPopup('<strong>🚗 Ma position</strong><br/>Position du chauffeur');

      console.log('✅ Marqueur de position chauffeur ajouté:', normalizedLocation);
    } catch (err) {
      console.error('❌ Erreur ajout marqueur position chauffeur:', err);
    }
  }, [mapReady, userLocation, currentLocation, createCustomIcon]);

  // Obtenir la couleur selon la priorité
  const getPriorityColor = useCallback((priority) => {
    switch (priority) {
      case 'urgent': return '#dc3545';
      case 'high': return '#fd7e14';
      case 'medium': return '#ffc107';
      case 'low': return '#28a745';
      default: return '#6c757d';
    }
  }, []);

  // Mettre à jour les marqueurs des commandes
  useEffect(() => {
    if (!mapReady || !orders) return;

    try {
      // Supprimer les anciens marqueurs
      markersRef.current.forEach(marker => {
        mapInstanceRef.current.removeLayer(marker);
      });
      markersRef.current = [];

      // Ajouter les nouveaux marqueurs
      orders.forEach((order, index) => {
        if (!order.deliveryAddress?.latitude || !order.deliveryAddress?.longitude) {
          console.warn('Coordonnées manquantes pour la commande:', order.orderNumber);
          return;
        }

        const color = getPriorityColor(order.priority);
        const icon = createCustomIcon(index + 1, color, 30);
        
        const marker = window.L.marker([
          order.deliveryAddress.latitude, 
          order.deliveryAddress.longitude
        ], { icon })
          .addTo(mapInstanceRef.current)
          .bindPopup(`
            <div style="min-width: 200px;">
              <h4 style="margin: 0 0 8px 0; color: ${color};">${order.customer.name}</h4>
              <p style="margin: 4px 0;"><strong>Commande:</strong> ${order.orderNumber}</p>
              <p style="margin: 4px 0;"><strong>Priorité:</strong> ${order.priority}</p>
              <p style="margin: 4px 0;"><strong>Adresse:</strong><br/>${order.deliveryAddress.street}<br/>${order.deliveryAddress.city}</p>
              <p style="margin: 4px 0;"><strong>Heure:</strong> ${order.estimatedDeliveryTime}</p>
              ${order.customer.phone ? `<p style="margin: 4px 0;"><strong>Tél:</strong> ${order.customer.phone}</p>` : ''}
            </div>
          `)
          .on('click', () => {
            if (onOrderSelect) {
              onOrderSelect(order);
            }
          });

        markersRef.current.push(marker);
      });

      // Ajuster la vue pour inclure tous les marqueurs
      if (orders.length > 0 && userLocation) {
        const group = new window.L.featureGroup([
          ...markersRef.current, 
          currentLocationMarkerRef.current
        ].filter(Boolean));
        
        if (group.getBounds().isValid()) {
          mapInstanceRef.current.fitBounds(group.getBounds(), { padding: [20, 20] });
        }
      }

      console.log(`📍 ${orders.length} marqueurs ajoutés`);
    } catch (err) {
      console.error('❌ Erreur ajout marqueurs:', err);
    }
  }, [mapReady, orders, getPriorityColor, createCustomIcon, onOrderSelect, userLocation]);

  // Fonctions de contrôle
  const zoomIn = useCallback(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomIn();
    }
  }, []);

  const zoomOut = useCallback(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomOut();
    }
  }, []);

  const centerOnUser = useCallback(() => {
    if (mapInstanceRef.current && userLocation) {
      mapInstanceRef.current.setView([userLocation.lat, userLocation.lng], 15, { animate: true });
    }
  }, [userLocation]);

  const refreshLocation = useCallback(() => {
    getCurrentLocation();
  }, [getCurrentLocation]);

  const fitAllMarkers = useCallback(() => {
    if (mapInstanceRef.current && markersRef.current.length > 0) {
      const group = new window.L.featureGroup([
        ...markersRef.current,
        currentLocationMarkerRef.current
      ].filter(Boolean));
      
      if (group.getBounds().isValid()) {
        mapInstanceRef.current.fitBounds(group.getBounds(), { padding: [20, 20] });
      }
    }
  }, []);

  if (error) {
    return (
      <div className={`nom-map-container ${className}`}>
        <div className="nom-map-error">
          <div className="nom-error-content">
            <MapPin className="nom-error-icon" />
            <h3>Erreur de chargement</h3>
            <p>{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="nom-btn nom-btn-primary"
            >
              <Refresh className="nom-btn-icon" />
              Recharger
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`nom-map-container ${className}`}>
      <div 
        ref={mapRef}
        className="nom-real-map"
        style={{ width: '100%', height: '100%', minHeight: '400px' }}
      />
      
      {!mapReady && (
        <div className="nom-map-loading">
          <div className="nom-loading-content">
            <div className="nom-loading-spinner"></div>
            <p className="nom-loading-text">Chargement de la carte...</p>
          </div>
        </div>
      )}

      {/* Contrôles de carte */}
      <div className="nom-map-controls">
        <button 
          className="nom-map-control" 
          onClick={zoomIn}
          title="Zoom avant"
        >
          <Plus className="nom-control-icon" />
        </button>
        <button 
          className="nom-map-control" 
          onClick={zoomOut}
          title="Zoom arrière"
        >
          <Minus className="nom-control-icon" />
        </button>
        <button 
          className="nom-map-control" 
          onClick={centerOnUser}
          title="Ma position"
        >
          <MyLocation className="nom-control-icon" />
        </button>
        <button 
          className="nom-map-control" 
          onClick={refreshLocation}
          title="Actualiser position"
        >
          <Refresh className="nom-control-icon" />
        </button>
        <button 
          className="nom-map-control" 
          onClick={fitAllMarkers}
          title="Vue d'ensemble"
        >
          <Route className="nom-control-icon" />
        </button>
      </div>

      {/* Légende */}
      <div className="nom-map-legend">
        <h4 className="nom-legend-title">Légende</h4>
        <div className="nom-legend-items">
          <div className="nom-legend-item">
            <div className="nom-legend-color" style={{ backgroundColor: '#dc3545' }}></div>
            <span className="nom-legend-label">Urgente</span>
          </div>
          <div className="nom-legend-item">
            <div className="nom-legend-color" style={{ backgroundColor: '#fd7e14' }}></div>
            <span className="nom-legend-label">Haute</span>
          </div>
          <div className="nom-legend-item">
            <div className="nom-legend-color" style={{ backgroundColor: '#ffc107' }}></div>
            <span className="nom-legend-label">Moyenne</span>
          </div>
          <div className="nom-legend-item">
            <div className="nom-legend-color" style={{ backgroundColor: '#28a745' }}></div>
            <span className="nom-legend-label">Basse</span>
          </div>
          <div className="nom-legend-item">
            <div className="nom-legend-color" style={{ backgroundColor: '#28a745', borderRadius: '50%' }}></div>
            <span className="nom-legend-label">Ma position</span>
          </div>
        </div>
      </div>

      {/* Informations */}
      {orders.length > 0 && (
        <div className="nom-map-info">
          <p>{orders.length} commande{orders.length > 1 ? 's' : ''} à livrer</p>
        </div>
      )}
    </div>
  );
};

export default RealDeliveryMap;