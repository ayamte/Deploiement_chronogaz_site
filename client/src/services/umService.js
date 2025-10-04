import api from './api';  
  
const umService = {  
  getAllUms: async () => {  
    try {  
      const response = await api.get('/ums');  
      return response.data;  
    } catch (error) {  
      console.error('Erreur lors de la récupération des unités de mesure:', error);  
      throw error;  
    }  
  },  
  
  getUmById: async (id) => {  
    try {  
      const response = await api.get(`/ums/${id}`);  
      return response.data;  
    } catch (error) {  
      console.error('Erreur lors de la récupération de l\'unité de mesure:', error);  
      throw error;  
    }  
  },  
  
  createUm: async (umData) => {  
    try {  
      const response = await api.post('/ums', umData);  
      return response.data;  
    } catch (error) {  
      console.error('Erreur lors de la création de l\'unité de mesure:', error);  
      throw error;  
    }  
  },  
  
 updateUm: async (id, umData) => {  
    try {  
      const response = await api.put(`/ums/${id}`, umData);  
      return response.data;  
    } catch (error) {  
      console.error('Erreur lors de la mise à jour de l\'unité de mesure:', error);  
      throw error;  
    }  
  },  
  
  deleteUm: async (id) => {  
    try {  
      const response = await api.delete(`/ums/${id}`);  
      return response.data;  
    } catch (error) {  
      console.error('Erreur lors de la suppression de l\'unité de mesure:', error);  
      throw error;  
    }  
  }  
};  
  
export default umService;