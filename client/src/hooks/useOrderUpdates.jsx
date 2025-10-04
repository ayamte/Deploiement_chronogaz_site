import { useState, useEffect } from 'react';  
import { useWebSocket } from './useWebSocket';  
  
export const useOrderUpdates = () => {  
  const { subscribe, isConnected } = useWebSocket(true);  
  const [newOrdersCount, setNewOrdersCount] = useState(0);  
  const [statusUpdates, setStatusUpdates] = useState([]);  
    
  useEffect(() => {  
    console.log('🔌 [useOrderUpdates] État connexion WebSocket:', isConnected);  
      
    if (isConnected) {  
      console.log('✅ [useOrderUpdates] WebSocket connecté, abonnement aux événements...');  
        
      const unsubscribeNewOrder = subscribe('new_order', (data) => {  
        console.log('🆕 [useOrderUpdates] Nouvelle commande reçue:', data);  
        console.log('🆕 [useOrderUpdates] Type de données:', typeof data, data);  
        setNewOrdersCount(prev => prev + 1);  
        console.log('📢 [useOrderUpdates] Déclenchement événement refreshOrders');  
        window.dispatchEvent(new CustomEvent('refreshOrders'));  
      }); 
          
      const unsubscribeStatusChange = subscribe('order_status_updated', (data) => {  
        console.log('🔄 [useOrderUpdates] Statut mis à jour:', data);  
        setStatusUpdates(prev => [...prev, data]);  
        console.log('📢 [useOrderUpdates] Déclenchement événement refreshOrders');  
        window.dispatchEvent(new CustomEvent('refreshOrders'));  
      });  
          
      return () => {  
        console.log('🧹 [useOrderUpdates] Nettoyage des abonnements');  
        unsubscribeNewOrder();  
        unsubscribeStatusChange();  
      };  
    } else {  
      console.log('❌ [useOrderUpdates] WebSocket non connecté');  
    }  
  }, [isConnected, subscribe]);
  
  useEffect(() => {  
  if (isConnected) {  
    // Test de connexion  
    const testSubscribe = subscribe('test', (data) => {  
      console.log('🧪 [TEST] Événement test reçu:', data);  
    });  
      
    return () => testSubscribe();  
  }  
}, [isConnected, subscribe]);
  
  return {  
    newOrdersCount,  
    statusUpdates,  
    isConnected  
  };  
};