import api from './api';

const stockService = {
  // Récupérer tous les stocks
  getAllStocks: async (params = {}) => {
    try {
      const response = await api.get('/stock', { params });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des stocks:', error);
      throw error;
    }
  },

  // Récupérer le stock par dépôt
  getStockByDepot: async (depot) => {
    try {
      const response = await api.get(`/stock/depot/${depot}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération du stock du dépôt:', error);
      throw error;
    }
  },

  // Récupérer un stock par ID
  getStockById: async (id) => {
    try {
      const response = await api.get(`/stock/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération du stock:', error);
      throw error;
    }
  },

  // Créer un nouveau stock
  createStock: async (stockData) => {
    try {
      const response = await api.post('/stock', stockData);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création du stock:', error);
      throw error;
    }
  },

  // Mettre à jour un stock
  updateStock: async (id, stockData) => {
    try {
      const response = await api.put(`/stock/${id}`, stockData);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du stock:', error);
      throw error;
    }
  },

  // Mettre à jour la quantité de stock
  updateStockQuantity: async (id, quantity, operation) => {
    try {
      const response = await api.patch(`/stock/${id}/quantity`, { quantity, operation });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la quantité:', error);
      throw error;
    }
  },

  // Transférer du stock entre dépôts
  transferStock: async (transferData) => {
    try {
      const response = await api.post('/stock/transfer', transferData);
      return response.data;
    } catch (error) {
      console.error('Erreur lors du transfert de stock:', error);
      throw error;
    }
  },

  // Obtenir les alertes de stock bas
  getLowStockAlerts: async () => {
    try {
      const response = await api.get('/stock/alerts/low-stock');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des alertes:', error);
      throw error;
    }
  },

  // Supprimer un stock
  deleteStock: async (id) => {
    try {
      const response = await api.delete(`/stock/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la suppression du stock:', error);
      throw error;
    }
  }
};

export default stockService;
