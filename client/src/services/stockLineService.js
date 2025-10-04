import api from './api';  
  
const stockLineService = {  
  getStockLinesByDepot: async (stockDepotId) => {  
    try {  
      const response = await api.get(`/stock-lines/depot/${stockDepotId}`);  
      return response.data;  
    } catch (error) {  
      console.error('Erreur lors de la récupération des lignes de stock:', error);  
      throw error;  
    }  
  },  
  
  createStockLine: async (stockLineData) => {  
    try {  
      const response = await api.post('/stock-lines', stockLineData);  
      return response.data;  
    } catch (error) {  
      console.error('Erreur lors de la création de la ligne de stock:', error);  
      throw error;  
    }  
  },  
  
  updateStockLine: async (id, stockLineData) => {  
    try {  
      const response = await api.put(`/stock-lines/${id}`, stockLineData);  
      return response.data;  
    } catch (error) {  
      console.error('Erreur lors de la mise à jour de la ligne de stock:', error);  
      throw error;  
    }  
  },  
  
  deleteStockLine: async (id) => {  
    try {  
      const response = await api.delete(`/stock-lines/${id}`);  
      return response.data;  
    } catch (error) {  
      console.error('Erreur lors de la suppression de la ligne de stock:', error);  
      throw error;  
    }  
  }  
};  
  
export default stockLineService;