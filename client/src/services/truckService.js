import api from './api';  
  
const truckService = {  
  // Récupérer tous les camions avec filtres optionnels  
  getAllTrucks: async (params = {}) => {  
    try {  
      const response = await api.get('/trucks', { params });  
      return response.data;  
    } catch (error) {  
      console.error('Erreur lors de la récupération des camions:', error);  
      throw error;  
    }  
  },  
  
  // Récupérer un camion par ID avec population complète  
  getTruckById: async (id) => {  
    try {  
      const response = await api.get(`/trucks/${id}`);  
      return response.data;  
    } catch (error) {  
      console.error('Erreur lors de la récupération du camion:', error);  
      throw error;  
    }  
  },  
  
  // Créer un nouveau camion avec gestion FormData optimisée  
  createTruck: async (truckData) => {  
    try {  
      const formData = new FormData();  
        
      // Ajouter tous les champs sauf l'image  
      Object.keys(truckData).forEach(key => {  
        if (key !== 'image' && truckData[key] !== null && truckData[key] !== '' && truckData[key] !== undefined) {  
          formData.append(key, truckData[key]);  
        }  
      });  
        
      // Ajouter l'image si elle existe  
      if (truckData.image) {  
        formData.append('image', truckData.image);  
      }  
        
      const response = await api.post('/trucks', formData, {  
        headers: {  
          'Content-Type': 'multipart/form-data',  
        },  
      });  
      return response.data;  
    } catch (error) {  
      console.error('Erreur lors de la création du camion:', error);  
      throw error;  
    }  
  },  
  
  // Mettre à jour un camion avec gestion FormData  
  updateTruck: async (id, truckData) => {  
    try {  
      const formData = new FormData();  
        
      // Ajouter tous les champs sauf l'image  
      Object.keys(truckData).forEach(key => {  
        if (key !== 'image' && truckData[key] !== null && truckData[key] !== '' && truckData[key] !== undefined) {  
          formData.append(key, truckData[key]);  
        }  
      });  
        
      // Ajouter l'image si elle existe  
      if (truckData.image) {  
        formData.append('image', truckData.image);  
      }  
        
      const response = await api.put(`/trucks/${id}`, formData, {  
        headers: {  
          'Content-Type': 'multipart/form-data',  
        },  
      });  
      return response.data;  
    } catch (error) {  
      console.error('Erreur lors de la mise à jour du camion:', error);  
      throw error;  
    }  
  },  
  
  // Mettre à jour le statut d'un camion  
  updateTruckStatus: async (id, status) => {  
    try {  
      const response = await api.patch(`/trucks/${id}/status`, { status });  
      return response.data;  
    } catch (error) {  
      console.error('Erreur lors de la mise à jour du statut:', error);  
      throw error;  
    }  
  },  
  
  // Assigner un chauffeur à un camion  
  assignDriver: async (id, driverId) => {  
    try {  
      const response = await api.patch(`/trucks/${id}/driver`, { driverId });  
      return response.data;  
    } catch (error) {  
      console.error('Erreur lors de l\'assignation du chauffeur:', error);  
      throw error;  
    }  
  },  
  
  // Assigner un accompagnant à un camion  
  assignAccompagnant: async (id, accompagnantId) => {  
    try {  
      const response = await api.patch(`/trucks/${id}/accompagnant`, { accompagnantId });  
      return response.data;  
    } catch (error) {  
      console.error('Erreur lors de l\'assignation de l\'accompagnant:', error);  
      throw error;  
    }  
  },  
  
  // Supprimer un camion (soft delete)  
  deleteTruck: async (id) => {  
    try {  
      const response = await api.delete(`/trucks/${id}`);  
      return response.data;  
    } catch (error) {  
      console.error('Erreur lors de la suppression du camion:', error);  
      throw error;  
    }  
  },  
  
  // Récupérer les camions par région  
  getTrucksByRegion: async (region) => {  
    try {  
      const response = await api.get(`/trucks/region/${region}`);  
      return response.data;  
    } catch (error) {  
      console.error('Erreur lors de la récupération des camions par région:', error);  
      throw error;  
    }  
  },  
  
  // Récupérer les camions nécessitant une maintenance  
  getMaintenanceDueTrucks: async () => {  
    try {  
      const response = await api.get('/trucks/maintenance/due');  
      return response.data;  
    } catch (error) {  
      console.error('Erreur lors de la récupération des camions en maintenance:', error);  
      throw error;  
    }  
  },  
  
  // Mettre à jour le kilométrage  
  updateMileage: async (id, mileage) => {  
    try {  
      const response = await api.patch(`/trucks/${id}/mileage`, { mileage });  
      return response.data;  
    } catch (error) {  
      console.error('Erreur lors de la mise à jour du kilométrage:', error);  
      throw error;  
    }  
  },  
  
  // Utilitaires pour la gestion des images  
  convertImageBufferToBase64: (imageBuffer) => {  
    if (!imageBuffer || !imageBuffer.data) return null;  
    const base64String = btoa(  
      new Uint8Array(imageBuffer.data).reduce((data, byte) => data + String.fromCharCode(byte), '')  
    );  
    return `data:image/png;base64,${base64String}`;  
  },  
  
  // Validation des données avant envoi  
  validateTruckData: (truckData) => {  
    const errors = {};  
      
    if (!truckData.matricule) {  
      errors.matricule = 'Le matricule est requis';  
    }  
      
    if (!truckData.brand) {  
      errors.brand = 'La marque est requise';  
    }  
      
    if (truckData.anneecontruction && (truckData.anneecontruction < 1990 || truckData.anneecontruction > 2030)) {  
      errors.anneecontruction = 'L\'année doit être entre 1990 et 2030';  
    }  
      
    return {  
      isValid: Object.keys(errors).length === 0,  
      errors  
    };  
  }  
};  
  
export default truckService;