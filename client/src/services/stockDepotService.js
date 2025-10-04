import api from './api';  
  
const stockDepotService = {  
  getAllStockDepots: async (params = {}) => {  
    try {  
      const response = await api.get('/stock-depots', { params });  
      return response.data;  
    } catch (error) {  
      console.error('Erreur lors de la récupération des inventaires:', error);  
      throw error;  
    }  
  },  
  
  getStockDepotById: async (id) => {  
    try {  
      const response = await api.get(`/stock-depots/${id}`);  
      return response.data;  
    } catch (error) {  
      console.error('Erreur lors de la récupération de l\'inventaire:', error);  
      throw error;  
    }  
  },  
  
  createStockDepot: async (stockDepotData) => {  
    try {  
      const response = await api.post('/stock-depots', stockDepotData);  
      return response.data;  
    } catch (error) {  
      console.error('Erreur lors de la création de l\'inventaire:', error);  
      throw error;  
    }  
  },  
  
  updateStockDepot: async (id, stockDepotData) => {  
    try {  
      const response = await api.put(`/stock-depots/${id}`, stockDepotData);  
      return response.data;  
    } catch (error) {  
      console.error('Erreur lors de la mise à jour de l\'inventaire:', error);  
      throw error;  
    }  
  },  
  
  archiveStockDepot: async (id) => {  
    try {  
      const response = await api.patch(`/stock-depots/${id}/archive`);  
      return response.data;  
    } catch (error) {  
      console.error('Erreur lors de l\'archivage de l\'inventaire:', error);  
      throw error;  
    }  
  }  
};  
  
export default stockDepotService;