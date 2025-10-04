import api from './api';  
  
const cityService = {  
  getAllCities: async (params = {}) => {  
    try {  
      const response = await api.get('/cities', { params });  
      return response.data;  
    } catch (error) {  
      console.error('Erreur lors de la récupération des villes:', error);  
      throw error;  
    }  
  },  
  
  getCityById: async (id) => {  
    try {  
      const response = await api.get(`/cities/${id}`);  
      return response.data;  
    } catch (error) {  
      console.error('Erreur lors de la récupération de la ville:', error);  
      throw error;  
    }  
  }  
};  
  
export default cityService;