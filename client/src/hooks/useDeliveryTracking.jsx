import { useState, useEffect, useCallback, useRef, useMemo } from 'react';  
import { deliveryService } from '../services/api';  
import { useWebSocket } from './useWebSocket';  
  
const GRAPHHOPPER_API_KEY = process.env.REACT_APP_GRAPHHOPPER_KEY;  
console.log('GraphHopper Key:', GRAPHHOPPER_API_KEY);

export const useDeliveryTracking = (deliveryId, options = {}) => {
  const {
    enabled = true,
    interval = 10000,
    onPositionUpdate,
    onStatusChange,
    realTimeUpdates = true,
    initialData = null  // ✅ NOUVEAU: Données initiales
  } = options;
  
  const [deliveryData, setDeliveryData] = useState(null);  
  const [driverPosition, setDriverPosition] = useState(null);  
  const [destinationPosition, setDestinationPosition] = useState(null);  
  const [routeInfo, setRouteInfo] = useState(null);  
  const [loading, setLoading] = useState(true);  
  const [error, setError] = useState(null);  
  
  const intervalRef = useRef(null);  
  const lastDriverPositionRef = useRef(null);  
  const lastRouteCalculationRef = useRef(null);  
  const routeCalculationTimeoutRef = useRef(null);  
    
  const { subscribe, identify, isConnected } = useWebSocket(realTimeUpdates);  
  
  // Mémorisation des callbacks pour éviter les re-renders inutiles  
  const memoizedOnPositionUpdate = useCallback(onPositionUpdate || (() => {}), [onPositionUpdate]);  
  const memoizedOnStatusChange = useCallback(onStatusChange || (() => {}), [onStatusChange]);  
  
  // Vérifie si le livreur a bougé suffisamment pour recalculer la route  
  const hasMovedSignificantly = useCallback((pos1, pos2) => {  
    if (!pos1 || !pos2) return true;  
    const deltaLat = Math.abs(pos1.lat - pos2.lat);  
    const deltaLng = Math.abs(pos1.lng - pos2.lng);  
    return deltaLat > 0.001 || deltaLng > 0.001; // Seuil réduit pour plus de réactivité  
  }, []);  
  
  // Vérifie si les positions ont réellement changé  
  const positionsHaveChanged = useCallback((oldDriver, oldDest, newDriver, newDest) => {  
    if (!oldDriver || !oldDest || !newDriver || !newDest) return true;  
      
    return (  
      Math.abs(oldDriver.lat - newDriver.lat) > 0.0001 ||  
      Math.abs(oldDriver.lng - newDriver.lng) > 0.0001 ||  
      Math.abs(oldDest.lat - newDest.lat) > 0.0001 ||  
      Math.abs(oldDest.lng - newDest.lng) > 0.0001  
    );  
  }, []);  
  
  const calculateRouteInfo = useCallback(async (start, end) => {  
    // Vérifications de sécurité  
    if (!start || !end || typeof start.lat === 'undefined' || typeof end.lat === 'undefined') {  
      console.warn('Données de position manquantes pour le calcul de l\'itinéraire.');  
      return;  
    }  
  
    // Annuler toute requête en attente  
    if (routeCalculationTimeoutRef.current) {  
      clearTimeout(routeCalculationTimeoutRef.current);  
    }  
  
    // Debounce réduit à 500ms pour plus de réactivité
    routeCalculationTimeoutRef.current = setTimeout(async () => {  
      try {  
        console.log('🔄 Calcul de la route...', { start, end });  
        const url = `https://graphhopper.com/api/1/route?point=${start.lat},${start.lng}&point=${end.lat},${end.lng}&vehicle=car&locale=fr&calc_points=true&key=${GRAPHHOPPER_API_KEY}`;  
          
        const response = await fetch(url);  
          
        if (!response.ok) {  
          if (response.status === 429) {  
            console.warn('⚠️ Limite GraphHopper atteinte, on garde l\'ancienne route');  
            return;  
          }  
          throw new Error(`HTTP ${response.status}`);  
        }  
  
        const data = await response.json();  
  
        if (data.paths && data.paths.length > 0) {  
          const route = data.paths[0];  
          const newRouteInfo = {  
            distance: (route.distance / 1000).toFixed(1),  
            duration: Math.round(route.time / 60000),  
            geometry: route.points  
          };
          
          setRouteInfo(newRouteInfo);  
  
          // ✅ CORRECTION : Simplifier la sauvegarde - juste pour éviter les requêtes simultanées
          lastRouteCalculationRef.current = {  
            timestamp: Date.now()
          };  
  
          console.log('✅ Route calculée avec succès', newRouteInfo);  
        }  
      } catch (err) {  
        console.error('❌ Erreur calcul route:', err);  
      }  
    }, 500); // Réduit à 500ms
  }, []);  
  
  const fetchDeliveryData = useCallback(async () => {  
    if (!deliveryId || !enabled) return;  
  
    try {  
      setError(null);  
      const response = await deliveryService.getDeliveryTracking(deliveryId);  
  
      if (response.data.success) {  
        const data = response.data.data;  
          
        // ✅ CORRECTION: Extraire les positions depuis les bonnes propriétés
        console.log('🔍 [useDeliveryTracking] Recherche position dans data:', {
          derniere_position: data.derniere_position,
          data_latitude: data.latitude,
          data_longitude: data.longitude,
          livraison_latitude: data.livraison?.latitude,
          livraison_longitude: data.livraison?.longitude
        });

        const newDriverPos = data.derniere_position ? {
          lat: parseFloat(data.derniere_position.latitude),
          lng: parseFloat(data.derniere_position.longitude),
          timestamp: data.derniere_position.timestamp
        } : (data.latitude && data.longitude) ? {
          lat: parseFloat(data.latitude),
          lng: parseFloat(data.longitude),
          timestamp: new Date().toISOString()
        } : (data.livraison?.latitude && data.livraison?.longitude) ? {
          lat: parseFloat(data.livraison.latitude),
          lng: parseFloat(data.livraison.longitude),
          timestamp: new Date().toISOString()
        } : null;

        console.log('📍 [useDeliveryTracking] Position extraite:', newDriverPos);

        // ✅ NOUVEAU: Si pas de position extraite, utiliser position initiale de livraison
        if (!newDriverPos && data.livraison) {
          console.log('🔄 [useDeliveryTracking] Utilisation position initiale livraison...');
          const initialPos = {
            lat: parseFloat(data.livraison.latitude),
            lng: parseFloat(data.livraison.longitude),
            timestamp: data.livraison.updatedAt || new Date().toISOString()
          };

          if (initialPos.lat && initialPos.lng) {
            console.log('✅ [useDeliveryTracking] Position initiale trouvée:', initialPos);
            setDriverPosition(initialPos);
            lastDriverPositionRef.current = initialPos;
            memoizedOnPositionUpdate(initialPos);
          }
        }

        // ✅ CORRECTION: Extraire la destination depuis les bonnes propriétés
        console.log('🎯 [useDeliveryTracking] Recherche destination dans data:', {
          destination: data.destination,
          command_address: data.command?.address_id,
          planification_address: data.planification?.commande_id?.address_id
        });

        const newDestPos = data.destination ? {
          lat: parseFloat(data.destination.latitude),
          lng: parseFloat(data.destination.longitude)
        } : data.command?.address_id ? {
          lat: parseFloat(data.command.address_id.latitude),
          lng: parseFloat(data.command.address_id.longitude)
        } : data.planification?.commande_id?.address_id ? {
          lat: parseFloat(data.planification.commande_id.address_id.latitude),
          lng: parseFloat(data.planification.commande_id.address_id.longitude)
        } : null;

        console.log('🎯 [useDeliveryTracking] Destination extraite:', newDestPos);
  
        // Ne mettre à jour que si les données ont changé  
        setDeliveryData(prevData => {  
          if (JSON.stringify(prevData) === JSON.stringify(data)) {  
            return prevData; // Pas de changement  
          }  
          return data;  
        });  
  
        // ✅ CORRECTION : Toujours mettre à jour la position si elle a changé
        if (newDriverPos && 
            (!lastDriverPositionRef.current || 
             hasMovedSignificantly(lastDriverPositionRef.current, newDriverPos))) {  
          console.log('📍 Nouvelle position du livreur:', newDriverPos);
          setDriverPosition(newDriverPos);  
          lastDriverPositionRef.current = newDriverPos;  
          memoizedOnPositionUpdate(newDriverPos);  
        }  
  
        if (newDestPos) {  
          setDestinationPosition(prevDest => {  
            if (prevDest &&   
                Math.abs(prevDest.lat - newDestPos.lat) < 0.00001 &&  
                Math.abs(prevDest.lng - newDestPos.lng) < 0.00001) {  
              return prevDest; // Pas de changement  
            }  
            return newDestPos;  
          });  
        }  
  
        // Statut changé ?  
        if (data.statut_livraison) {  
          memoizedOnStatusChange(data.statut_livraison);  
        }  
      }  
    } catch (err) {  
      console.error('Erreur tracking:', err);  
      setError('Erreur lors de la récupération des données de tracking');  
    } finally {  
      setLoading(false);  
    }  
  }, [deliveryId, enabled, memoizedOnPositionUpdate, memoizedOnStatusChange, hasMovedSignificantly]);  
  
  // Chargement initial  
  useEffect(() => {  
    if (deliveryId && enabled) {  
      fetchDeliveryData();  
    }  
  }, [deliveryId, enabled, fetchDeliveryData]);  
  
  // ✅ CORRECTION : Calcul de route simplifié - TOUJOURS recalculer quand les positions changent
  useEffect(() => {  
    if (!driverPosition || !destinationPosition) {  
      return;  
    }  
  
    console.log('📍 Positions mises à jour, calcul de la route:', { 
      driver: driverPosition, 
      dest: destinationPosition 
    });
    
    calculateRouteInfo(driverPosition, destinationPosition);  
  }, [driverPosition, destinationPosition, calculateRouteInfo]);  
  
  // Polling (seulement si WebSocket inactif)  
  useEffect(() => {  
    if (!enabled || !deliveryId || interval <= 0 || realTimeUpdates) return;  
  
    intervalRef.current = setInterval(fetchDeliveryData, interval);  
  
    return () => {  
      if (intervalRef.current) {  
        clearInterval(intervalRef.current);  
      }  
    };  
  }, [fetchDeliveryData, enabled, deliveryId, interval, realTimeUpdates]);  
  
  // WebSocket listeners
  useEffect(() => {
    if (!realTimeUpdates || !deliveryId || !isConnected) return;

    identify(null, deliveryId, 'customer');

    const unsubscribePosition = subscribe('position_updated', (data) => {
      console.log('📡 [useDeliveryTracking] Position WebSocket reçue:', data);
      console.log('   - deliveryId recherché:', deliveryId);
      console.log('   - data.deliveryId:', data.deliveryId);
      console.log('   - data.planificationId:', data.planificationId);

      // ✅ CORRECTION: Vérifier à la fois deliveryId et planificationId pour compatibilité
      if (data.deliveryId === deliveryId || data.planificationId === deliveryId) {
        const newPosition = {
          lat: parseFloat(data.position.latitude),
          lng: parseFloat(data.position.longitude),
          timestamp: data.timestamp
        };

        console.log('✅ Position WebSocket acceptée:', newPosition);

        if (hasMovedSignificantly(lastDriverPositionRef.current, newPosition)) {
          console.log('📍 Mise à jour position chauffeur via WebSocket:', newPosition);
          lastDriverPositionRef.current = newPosition;
          setDriverPosition(newPosition);
          memoizedOnPositionUpdate(newPosition);
        } else {
          console.log('📍 Position WebSocket ignorée (mouvement insignifiant)');
        }
      } else {
        console.log('📡 Position WebSocket ignorée (ID différent)');
      }
    });

    const unsubscribeStatus = subscribe('status_updated', (data) => {
      if (data.deliveryId === deliveryId || data.planificationId === deliveryId) {
        setDeliveryData(prev => ({
          ...prev,
          statut_livraison: data.status
        }));
        memoizedOnStatusChange(data.status);
      }
    });

    // ✅ NOUVEAU: Écouter les démarrages de livraison pour se réabonner avec le bon ID
    const unsubscribeDeliveryStarted = subscribe('delivery_started', (data) => {
      console.log('🚚 [useDeliveryTracking] Livraison démarrée:', data);
      // Si c'est pour notre planification, on se réabonne avec l'ID de livraison
      if (data.planificationId === deliveryId) {
        console.log('✅ [useDeliveryTracking] Réabonnement avec ID livraison:', data.deliveryId);
        identify(null, data.deliveryId, 'customer');
        // Recharger les données pour avoir les nouvelles informations
        fetchDeliveryData();
      }
    });

    return () => {
      unsubscribePosition();
      unsubscribeStatus();
      unsubscribeDeliveryStarted();
    };
  }, [
    realTimeUpdates,
    deliveryId,
    isConnected,
    subscribe,
    identify,
    memoizedOnPositionUpdate,
    memoizedOnStatusChange,
    hasMovedSignificantly,
    fetchDeliveryData
  ]);
  
  // Nettoyage  
  useEffect(() => {  
    return () => {  
      if (routeCalculationTimeoutRef.current) {  
        clearTimeout(routeCalculationTimeoutRef.current);  
      }  
    };  
  }, []);  
  
  const refetch = useCallback(() => {  
    setLoading(true);  
    fetchDeliveryData();  
  }, [fetchDeliveryData]);  
  
  // Mémoriser les valeurs de retour pour éviter les re-renders  
  const returnValue = useMemo(() => ({  
    deliveryData,  
    driverPosition,  
    destinationPosition,  
    routeInfo,  
    loading,  
    error,  
    refetch,  
    isConnected  
  }), [deliveryData, driverPosition, destinationPosition, routeInfo, loading, error, refetch, isConnected]);  
  
  return returnValue;  
};