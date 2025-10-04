import api from './api';  
  
const depotService = {  
  // Récupérer tous les dépôts  
  getAllDepots: async () => {  
    try {  
      const response = await api.get('/depots');  
      return response.data;  
    } catch (error) {  
      console.error('Erreur lors de la récupération des dépôts:', error);  
      throw error;  
    }  
  },  
  
  // Récupérer un dépôt par ID - CORRECTION ICI  
  getDepotById: async (id) => {  
    try {  
      const response = await api.get(`/depots/${id}`); // ✅ Corrigé  
      return response.data;  
    } catch (error) {  
      console.error('Erreur lors de la récupération du dépôt:', error);  
      throw error;  
    }  
  },  
  
  // Créer un nouveau dépôt - CORRECTION ICI  
  createDepot: async (depotData) => {  
    try {  
      const response = await api.post('/depots', depotData); // ✅ Corrigé  
      return response.data;  
    } catch (error) {  
      console.error('Erreur lors de la création du dépôt:', error);  
      throw error;  
    }  
  },  
  
  // Mettre à jour un dépôt - CORRECTION ICI  
  updateDepot: async (id, depotData) => {  
    try {  
      const response = await api.put(`/depots/${id}`, depotData); // ✅ Corrigé  
      return response.data;  
    } catch (error) {  
      console.error('Erreur lors de la mise à jour du dépôt:', error);  
      throw error;  
    }  
  },  
  
  // Supprimer un dépôt - CORRECTION ICI  
  deleteDepot: async (id) => {  
    try {  
      const response = await api.delete(`/depots/${id}`); // ✅ Corrigé  
      return response.data;  
    } catch (error) {  
      console.error('Erreur lors de la suppression du dépôt:', error);  
      throw error;  
    }  
  },  
  
  // Récupérer les statistiques d'un dépôt - CORRECTION ICI  
  getDepotStats: async (id) => {  
    try {  
      const response = await api.get(`/depots/${id}/stats`); // ✅ Corrigé  
      return response.data;  
    } catch (error) {  
      console.error('Erreur lors de la récupération des statistiques:', error);  
      throw error;  
    }  
  },  
  
  // Récupérer les dépôts par région - CORRECTION ICI  
  getDepotsByRegion: async (regionId) => {  
    try {  
      const response = await api.get(`/depots/region/${regionId}`); // ✅ Corrigé  
      return response.data;  
    } catch (error) {  
      console.error('Erreur lors de la récupération des dépôts par région:', error);  
      throw error;  
    }  
  }  
};  
  
export default depotService;