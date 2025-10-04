import api from './api';

const reportService = {
  // Récupérer les statistiques du tableau de bord
  getDashboardStats: async () => {
    try {
      const response = await api.get('/reports/dashboard');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      throw error;
    }
  },

  // Récupérer le rapport d'inventaire
  getInventoryReport: async (params = {}) => {
    try {
      const response = await api.get('/reports/inventory', { params });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération du rapport d\'inventaire:', error);
      throw error;
    }
  },

  // Récupérer les mouvements de stock
  getStockMovements: async (params = {}) => {
    try {
      const response = await api.get('/reports/stock-movements', { params });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des mouvements de stock:', error);
      throw error;
    }
  },

  // Récupérer le rapport d'utilisation des camions
  getTruckUtilizationReport: async (params = {}) => {
    try {
      const response = await api.get('/reports/truck-utilization', { params });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération du rapport d\'utilisation:', error);
      throw error;
    }
  },

  // Récupérer le rapport de maintenance
  getMaintenanceReport: async () => {
    try {
      const response = await api.get('/reports/maintenance');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération du rapport de maintenance:', error);
      throw error;
    }
  },

  // Exporter les produits en CSV
  exportProductsCSV: async () => {
    try {
      const response = await api.get('/reports/export/products', {
        responseType: 'blob'
      });
      
      // Créer un lien de téléchargement
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'products.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      return { success: true };
    } catch (error) {
      console.error('Erreur lors de l\'export des produits:', error);
      throw error;
    }
  },

  // Exporter un rapport personnalisé
  exportCustomReport: async (reportType, params = {}) => {
    try {
      const response = await api.get(`/reports/export/${reportType}`, {
        params,
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${reportType}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      return { success: true };
    } catch (error) {
      console.error(`Erreur lors de l'export du rapport ${reportType}:`, error);
      throw error;
    }
  }
};

export default reportService;
