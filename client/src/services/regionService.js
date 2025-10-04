import api from './api';  
  
const regionService = {  
  getAllRegions: async (params = {}) => {  
    try {  
      const response = await api.get('/regions', { params });  
      return response.data;  
    } catch (error) {  
      console.error('Erreur lors de la récupération des régions:', error);  
      throw error;  
    }  
  },  
  
  getRegionsByCity: async (cityId) => {  
    try {  
      const response = await api.get(`/regions?city_id=${cityId}`);  
      return response.data;  
    } catch (error) {  
      console.error('Erreur lors de la récupération des régions par ville:', error);  
      throw error;  
    }  
  }  
};  
  
export default regionService;