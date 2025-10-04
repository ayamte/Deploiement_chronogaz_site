import axios from 'axios';  
  
// Configuration de base pour l'API  
const API_BASE_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api`;  
  
// Instance axios configurée  
const api = axios.create({    
  baseURL: API_BASE_URL,    
  headers: {    
    'Content-Type': 'application/json',    
  },    
});    
  
// Intercepteur pour ajouter le token si disponible  
api.interceptors.request.use(  
  (config) => {  
    const token = localStorage.getItem('token');  
    if (token) {  
      config.headers.Authorization = `Bearer ${token}`;  
    }  
    return config;  
  },  
  (error) => {  
    return Promise.reject(error);  
  }  
);  
  
// Intercepteur pour gérer les erreurs  
api.interceptors.response.use(  
  (response) => response,  
  (error) => {  
    if (error.response?.status === 401) {  
      // Rediriger vers login si non authentifié  
      localStorage.removeItem('token');  
      window.location.href = '/login';  
    }  
    return Promise.reject(error);  
  }  
);  
  
// Services pour les livraisons (requis par useDeliveryTracking)  
export const deliveryService = {  
  // Obtenir toutes les livraisons  
  getAllDeliveries: () => api.get('/deliveries'),  
    
  // Obtenir les livraisons d'aujourd'hui  
  getTodayDeliveries: () => api.get('/deliveries/today'),  
    
  // Obtenir une livraison par ID  
  getDeliveryById: (id) => api.get(`/deliveries/${id}`),  
    
  // Obtenir les données de suivi GPS (utilisé par useDeliveryTracking)  
  getDeliveryTracking: (id) => api.get(`/livraisons/${id}/track`),  
    
  // Obtenir la position en temps réel  
  getRealTimePosition: (id) => api.get(`/deliveries/${id}/realtime-position`),  
    
  // Mettre à jour la position  
  updatePosition: (id, position) =>   
    api.put(`/deliveries/${id}/position`, position),  
    
  // Démarrer une livraison  
  startDelivery: (planificationId, data) =>   
    api.post(`/deliveries/${planificationId}/start`, data),  
    
  // Terminer une livraison  
  completeDelivery: (id, data) =>   
    api.put(`/deliveries/${id}/complete`, data),  
    
  // Statistiques  
  getDeliveriesStats: () => api.get('/deliveries/stats')  
};  
  
// Services pour les commandes    
export const commandService = {  
  getAllCommands: () => api.get('/commands'),  
  getCommandById: (id) => api.get(`/commands/${id}`),  
  getCommandsByCustomer: (customerId, params = {}) =>   
    api.get(`/commands/customer/${customerId}`, { params }),  
  createCommand: (data) => api.post('/commands', data),  
  updateCommand: (id, data) => api.put(`/commands/${id}`, data),  
  deleteCommand: (id) => api.delete(`/commands/${id}`),  
  updateCommandStatus: (id, data) => api.put(`/commands/${id}/status`, data)  
};  
  
export default api;