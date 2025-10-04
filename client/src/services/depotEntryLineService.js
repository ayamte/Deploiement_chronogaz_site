import axios from 'axios';  
  
const API_BASE_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api`; 
  
class DepotEntryLineService {  
  // Ajouter une ligne à un bon de livraison  
  async addDepotEntryLine(lineData) {  
    try {  
      const response = await axios.post(`${API_BASE_URL}/depot-entry-lines`, lineData);  
      return response.data;  
    } catch (error) {  
      throw this.handleError(error);  
    }  
  }  
  
  // Récupérer les lignes d'un bon de livraison  
  async getDepotEntryLinesByBL(blFrsId) {  
    try {  
      const response = await axios.get(`${API_BASE_URL}/depot-entry-lines/bl/${blFrsId}`);  
      return response.data;  
    } catch (error) {  
      throw this.handleError(error);  
    }  
  }  
  
  // Modifier une ligne  
  async updateDepotEntryLine(id, lineData) {  
    try {  
      const response = await axios.put(`${API_BASE_URL}/depot-entry-lines/${id}`, lineData);  
      return response.data;  
    } catch (error) {  
      throw this.handleError(error);  
    }  
  }  
  
  // Supprimer une ligne  
  async deleteDepotEntryLine(id) {  
    try {  
      const response = await axios.delete(`${API_BASE_URL}/depot-entry-lines/${id}`);  
      return response.data;  
    } catch (error) {  
      throw this.handleError(error);  
    }  
  }  
  
  // Gestion des erreurs  
  handleError(error) {  
    if (error.response) {  
      return {  
        success: false,  
        error: error.response.data.error || 'Erreur serveur',  
        status: error.response.status  
      };  
    } else if (error.request) {  
      return {  
        success: false,  
        error: 'Erreur de connexion au serveur',  
        status: 0  
      };  
    } else {  
      return {  
        success: false,  
        error: error.message,  
        status: 0  
      };  
    }  
  }  
}  
  
export default new DepotEntryLineService();