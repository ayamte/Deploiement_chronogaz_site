import { io } from 'socket.io-client';  
  
class WebSocketService {  
  constructor() {  
    this.socket = null;  
    this.isConnected = false;  
    this.listeners = new Map();  
    this.reconnectAttempts = 0;  
    this.maxReconnectAttempts = 5;  
  
    this.alreadyIdentified = false;  
    this.lastIdentifyPayload = null;  
  }  
  
  connect(serverUrl = 'http://localhost:5000') {  
    try {  
      this.socket = io(serverUrl, {  
        autoConnect: true,  
        reconnection: true,  
        reconnectionDelay: 1000,  
        reconnectionAttempts: this.maxReconnectAttempts  
      });  
  
      this.socket.on('connect', () => {  
        console.log('✅ WebSocket connecté');  
        this.isConnected = true;  
        this.reconnectAttempts = 0;  
        this.alreadyIdentified = false;  
  
        if (this.lastIdentifyPayload) {  
          const { userId, deliveryId, type } = this.lastIdentifyPayload;  
          this.identify(userId, deliveryId, type);  
        }  
      });  
  
      this.socket.on('disconnect', () => {  
        console.log('❌ WebSocket déconnecté');  
        this.isConnected = false;  
      });  
  
      this.socket.on('connect_error', (error) => {  
        console.error('❌ Erreur connexion WebSocket:', error);  
        this.reconnectAttempts++;  
      });  
  
      // Événements pour le tracking de livraison  
      this.socket.on('position_updated', (data) => {  
        this.notifyListeners('position_updated', data);  
      });  
  
      this.socket.on('status_updated', (data) => {  
        this.notifyListeners('status_updated', data);  
      });  
  
      // NOUVEAUX ÉVÉNEMENTS AJOUTÉS  
      // Événement pour les nouvelles commandes  
      this.socket.on('new_order', (data) => {  
        this.notifyListeners('new_order', data);  
      });  
  
      // Événement pour les mises à jour de statut de commandes  
      this.socket.on('order_status_updated', (data) => {  
        this.notifyListeners('order_status_updated', data);  
      });  
  
      // Événement pour les nouvelles assignations/planifications  
      this.socket.on('new_assignment', (data) => {  
        this.notifyListeners('new_assignment', data);  
      });  
  
    } catch (error) {  
      console.error('Erreur initialisation WebSocket:', error);  
    }  
  }  
  
  // Reste du code identique...  
  identify(userId, deliveryId, type = 'customer') {  
  if (this.socket && this.isConnected && !this.alreadyIdentified) {  
    const payload = { userId, deliveryId, type };  
    this.socket.emit('identify', payload);  
    this.alreadyIdentified = true;  
    this.lastIdentifyPayload = payload;  
    console.log(`✅ Identify émis pour ${type} - livraison ${deliveryId}`);  
  } else if (this.alreadyIdentified) {  
    console.log('INFO: Identify déjà effectué, on n\'émet rien');  
  }  
} 
  
  updatePosition(deliveryId, latitude, longitude) {  
    if (this.socket && this.isConnected) {  
      this.socket.emit('position_update', {  
        deliveryId,  
        latitude,  
        longitude,  
        timestamp: new Date().toISOString()  
      });  
    }  
  }  
  
  updateStatus(deliveryId, status, message) {  
    if (this.socket && this.isConnected) {  
      this.socket.emit('status_update', {  
        deliveryId,  
        status,  
        message  
      });  
    }  
  }  
  
  subscribe(event, callback) {  
    if (!this.listeners.has(event)) {  
      this.listeners.set(event, []);  
    }  
    this.listeners.get(event).push(callback);  
  
    return () => {  
      const callbacks = this.listeners.get(event);  
      if (callbacks) {  
        const index = callbacks.indexOf(callback);  
        if (index > -1) {  
          callbacks.splice(index, 1);  
        }  
      }  
    };  
  }  
  
  notifyListeners(event, data) {  
    const callbacks = this.listeners.get(event);  
    if (callbacks) {  
      callbacks.forEach(callback => {  
        try {  
          callback(data);  
        } catch (error) {  
          console.error('Erreur callback WebSocket:', error);  
        }  
      });  
    }  
  }  
  
  disconnect() {  
    if (this.socket) {  
      this.socket.disconnect();  
      this.socket = null;  
      this.isConnected = false;  
      this.alreadyIdentified = false;  
      this.lastIdentifyPayload = null;  
    }  
  }  
  
  getConnectionStatus() {  
    return this.isConnected;  
  }  
}  
  
const websocketService = new WebSocketService();  
export default websocketService;