import api from './api';  
  
const listePrixService = {  
  // Récupérer toutes les listes de prix  
  getAllListePrix: async (params = {}) => {  
    try {  
      const response = await api.get('/listeprix', { params });  
      return response.data;  
    } catch (error) {  
      console.error('Erreur lors de la récupération des listes de prix:', error);  
      throw error;  
    }  
  },  
  
  // Récupérer une liste de prix par ID  
  getListePrixById: async (id) => {  
    try {  
      const response = await api.get(`/listeprix/${id}`);  
      return response.data;  
    } catch (error) {  
      console.error('Erreur lors de la récupération de la liste de prix:', error);  
      throw error;  
    }  
  },  
  
  // Créer une nouvelle liste de prix  
  createListePrix: async (listePrixData) => {  
    try {  
      const response = await api.post('/listeprix', listePrixData);  
      return response.data;  
    } catch (error) {  
      console.error('Erreur lors de la création de la liste de prix:', error);  
      throw error;  
    }  
  },  
  
  // Mettre à jour une liste de prix  
  updateListePrix: async (id, listePrixData) => {  
    try {  
      const response = await api.put(`/listeprix/${id}`, listePrixData);  
      return response.data;  
    } catch (error) {  
      console.error('Erreur lors de la mise à jour de la liste de prix:', error);  
      throw error;  
    }  
  },  
  
  // Supprimer une liste de prix  
  deleteListePrix: async (id) => {  
    try {  
      const response = await api.delete(`/listeprix/${id}`);  
      return response.data;  
    } catch (error) {  
      console.error('Erreur lors de la suppression de la liste de prix:', error);  
      throw error;  
    }  
  },  
  
  // Récupérer les listes de prix actives  
  getActiveListePrix: async () => {  
    try {  
      const response = await api.get('/listeprix', {   
        params: { isactif: true }   
      });  
      return response.data;  
    } catch (error) {  
      console.error('Erreur lors de la récupération des listes de prix actives:', error);  
      throw error;  
    }  
  },  
  
  // Récupérer les listes de prix par période  
  getListePrixByPeriod: async (dateDebut, dateFin) => {  
    try {  
      const response = await api.get('/listeprix', {  
        params: {  
          dateDebut,  
          dateFin  
        }  
      });  
      return response.data;  
    } catch (error) {  
      console.error('Erreur lors de la récupération des listes de prix par période:', error);  
      throw error;  
    }  
  },  
  
  // Activer/Désactiver une liste de prix  
  toggleListePrixStatus: async (id, isactif) => {  
    try {  
      const response = await api.patch(`/listeprix/${id}/status`, { isactif });  
      return response.data;  
    } catch (error) {  
      console.error('Erreur lors du changement de statut de la liste de prix:', error);  
      throw error;  
    }  
  },  
  
  // Rechercher des listes de prix  
  searchListePrix: async (searchTerm) => {  
    try {  
      const response = await api.get('/listeprix/search', {  
        params: { q: searchTerm }  
      });  
      return response.data;  
    } catch (error) {  
      console.error('Erreur lors de la recherche de listes de prix:', error);  
      throw error;  
    }  
  },  
  
  // Obtenir les statistiques des listes de prix  
  getListePrixStats: async () => {  
    try {  
      const response = await api.get('/listeprix/stats');  
      return response.data;  
    } catch (error) {  
      console.error('Erreur lors de la récupération des statistiques:', error);  
      throw error;  
    }  
  },  
  
  // NOUVELLES MÉTHODES POUR LA GESTION CENTRALISÉE DES PRIX  
  
  // Ajouter un prix à une liste  
  addPrixToListe: async (listeId, prixData) => {  
    try {  
      const response = await api.post(`/listeprix/${listeId}/prix`, prixData);  
      return response.data;  
    } catch (error) {  
      console.error('Erreur lors de l\'ajout du prix à la liste:', error);  
      throw error;  
    }  
  },  
  
  // Mettre à jour un prix dans une liste  
  updatePrixInListe: async (listeId, prixId, prixData) => {  
    try {  
      const response = await api.put(`/listeprix/${listeId}/prix/${prixId}`, prixData);  
      return response.data;  
    } catch (error) {  
      console.error('Erreur lors de la mise à jour du prix:', error);  
      throw error;  
    }  
  },  
  
  // Supprimer un prix d'une liste  
  removePrixFromListe: async (listeId, prixId) => {  
    try {  
      const response = await api.delete(`/listeprix/${listeId}/prix/${prixId}`);  
      return response.data;  
    } catch (error) {  
      console.error('Erreur lors de la suppression du prix:', error);  
      throw error;  
    }  
  },  
  
  // Récupérer tous les prix d'une liste  
  getPrixByListe: async (listeId) => {  
    try {  
      const response = await api.get(`/listeprix/${listeId}/prix`);  
      return response.data;  
    } catch (error) {  
      console.error('Erreur lors de la récupération des prix de la liste:', error);  
      throw error;  
    }  
  },  
  
  // Récupérer les prix d'un produit spécifique dans toutes les listes actives  
  getPrixByProduct: async (productId) => {  
    try {  
      const response = await api.get(`/listeprix/prix/product/${productId}`);  
      return response.data;  
    } catch (error) {  
      console.error('Erreur lors de la récupération des prix du produit:', error);  
      throw error;  
    }  
  },  
  
  // Dupliquer les prix d'une liste vers une autre  
  duplicatePrixToListe: async (sourceListeId, targetListeId) => {  
    try {  
      const response = await api.post(`/listeprix/${targetListeId}/prix/duplicate`, {  
        sourceListeId  
      });  
      return response.data;  
    } catch (error) {  
      console.error('Erreur lors de la duplication des prix:', error);  
      throw error;  
    }  
  },  
  
  // Mettre à jour en masse les prix d'une liste (augmentation/diminution en pourcentage)  
  bulkUpdatePrix: async (listeId, updateData) => {  
    try {  
      const response = await api.patch(`/listeprix/${listeId}/prix/bulk-update`, updateData);  
      return response.data;  
    } catch (error) {  
      console.error('Erreur lors de la mise à jour en masse des prix:', error);  
      throw error;  
    }  
  },
    
  // Récupérer les prix actifs depuis les listes de prix actives  
  getActivePrices: async () => {  
    try {  
      const response = await api.get('/listeprix/active-prices');  
      return response.data;  
    } catch (error) {  
      console.error('Erreur lors de la récupération des prix actifs:', error);  
      throw error;  
    }  
  }
};  
  
export default listePrixService;