import api from './api';

const truckLoadingService = {
  // Récupérer toutes les sessions de chargement
  getAllLoadingSessions: async (params = {}) => {
    try {
      const response = await api.get('/truck-loading-sessions', { params });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des sessions de chargement:', error);
      throw error;
    }
  },

  // Récupérer une session de chargement par ID
  getLoadingSessionById: async (id) => {
    try {
      const response = await api.get(`/truck-loading-sessions/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération de la session de chargement:', error);
      throw error;
    }
  },

  // Récupérer les sessions de chargement actives pour un camion
  getActiveLoadingSessionByTruck: async (truckId) => {
    try {
      const response = await api.get(`/truck-loading-sessions/truck/${truckId}/active`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération de la session active:', error);
      throw error;
    }
  },

  // Créer une nouvelle session de chargement
  createLoadingSession: async (sessionData) => {
    try {
      const response = await api.post('/truck-loading-sessions', sessionData);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création de la session de chargement:', error);
      throw error;
    }
  },

  // Mettre à jour une session de chargement
  updateLoadingSession: async (id, sessionData) => {
    try {
      const response = await api.put(`/truck-loading-sessions/${id}`, sessionData);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la session de chargement:', error);
      throw error;
    }
  },

  // Marquer une session comme terminée
  completeLoadingSession: async (id) => {
    try {
      const response = await api.patch(`/truck-loading-sessions/${id}/complete`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la finalisation de la session:', error);
      throw error;
    }
  },

  // Marquer une session comme déchargée
  completeUnloading: async (id) => {
    try {
      const response = await api.patch(`/truck-loading-sessions/${id}/unload`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la finalisation du déchargement:', error);
      throw error;
    }
  },

  // Supprimer une session de chargement
  deleteLoadingSession: async (id) => {
    try {
      const response = await api.delete(`/truck-loading-sessions/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la suppression de la session:', error);
      throw error;
    }
  }
};

export default truckLoadingService;
