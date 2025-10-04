import api from './api';      
      
const locationService = {      
  getCities: async () => {      
    try {      
      const response = await api.get('/locations/cities');      
      return response.data;      
    } catch (error) {      
      console.error('Erreur lors de la récupération des villes:', error);      
      throw error;      
    }      
  },      
      
  createCity: async (cityData) => {      
    try {      
      const response = await api.post('/locations/cities', cityData);      
      return response.data;      
    } catch (error) {      
      console.error('Erreur lors de la création de la ville:', error);      
      throw error;      
    }      
  },      
      
  updateCity: async (id, cityData) => {      
    try {      
      const response = await api.put(`/locations/cities/${id}`, cityData);      
      return response.data;      
    } catch (error) {      
      console.error('Erreur lors de la mise à jour de la ville:', error);      
      throw error;      
    }      
  },      
      
  deleteCity: async (id) => {      
    try {      
      const response = await api.delete(`/locations/cities/${id}`);      
      return response.data;      
    } catch (error) {      
      console.error('Erreur lors de la suppression de la ville:', error);      
      throw error;      
    }      
  },  
  
  // Nouvelles méthodes optionnelles pour étendre les fonctionnalités  
  getCityById: async (id) => {  
    try {  
      const response = await api.get(`/locations/cities/${id}`);  
      return response.data;  
    } catch (error) {  
      console.error('Erreur lors de la récupération de la ville:', error);  
      throw error;  
    }  
  },  
  
  searchCities: async (searchTerm) => {  
    try {  
      const response = await api.get(`/locations/cities/search?q=${encodeURIComponent(searchTerm)}`);  
      return response.data;  
    } catch (error) {  
      console.error('Erreur lors de la recherche de villes:', error);  
      throw error;  
    }  
  },  
  
  getCitiesStats: async () => {  
    try {  
      const response = await api.get('/locations/cities/stats/overview');  
      return response.data;  
    } catch (error) {  
      console.error('Erreur lors de la récupération des statistiques:', error);  
      throw error;  
    }  
  },  
  
  geocodeAddress: async (address) => {  
    try {  
      const response = await api.post('/locations/geocode', { address });  
      return response.data;  
    } catch (error) {  
      console.error('Erreur lors du géocodage:', error);  
      throw error;  
    }  
  }  
};      
      
export default locationService;