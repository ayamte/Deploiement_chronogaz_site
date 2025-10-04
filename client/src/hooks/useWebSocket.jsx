import { useEffect, useState, useRef } from 'react';  
import websocketService from '../services/websocket';  
  
export const useWebSocket = (autoConnect = true) => {  
  const [isConnected, setIsConnected] = useState(false);  
  const [lastMessage, setLastMessage] = useState(null);  
  const subscriptionsRef = useRef(new Map());  
  
  useEffect(() => {  
    if (autoConnect) {  
      websocketService.connect();  
        
      // Vérifier le statut de connexion périodiquement  
      const interval = setInterval(() => {  
        setIsConnected(websocketService.getConnectionStatus());  
      }, 1000);  
  
      return () => {  
        clearInterval(interval);  
        // Ne pas déconnecter ici car d'autres composants peuvent utiliser WebSocket  
      };  
    }  
  }, [autoConnect]);  
  
  const subscribe = (event, callback) => {  
    const unsubscribe = websocketService.subscribe(event, (data) => {  
      setLastMessage({ event, data, timestamp: Date.now() });  
      callback(data);  
    });  
  
    // Stocker pour cleanup  
    if (!subscriptionsRef.current.has(event)) {  
      subscriptionsRef.current.set(event, []);  
    }  
    subscriptionsRef.current.get(event).push(unsubscribe);  
  
    return unsubscribe;  
  };  
  
  const identify = (userId, deliveryId, type) => {  
    websocketService.identify(userId, deliveryId, type);  
  };  
  
  const updatePosition = (deliveryId, latitude, longitude) => {  
    websocketService.updatePosition(deliveryId, latitude, longitude);  
  };  
  
  const updateStatus = (deliveryId, status, message) => {  
    websocketService.updateStatus(deliveryId, status, message);  
  };  
  
  // Cleanup au démontage  
  useEffect(() => {  
    return () => {  
      subscriptionsRef.current.forEach((callbacks) => {  
        callbacks.forEach(unsubscribe => unsubscribe());  
      });  
      subscriptionsRef.current.clear();  
    };  
  }, []);  
  
  return {  
    isConnected,  
    lastMessage,  
    subscribe,  
    identify,  
    updatePosition,  
    updateStatus  
  };  
};