import axios from 'axios';  
  
const API_BASE_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api`;
  
class FournisseurService {  
  // Créer un nouveau fournisseur  
  async createFournisseur(fournisseurData) {  
    try {  
      const response = await axios.post(`${API_BASE_URL}/fournisseurs`, fournisseurData);  
      return response.data;  
    } catch (error) {  
      throw this.handleError(error);  
    }  
  }  
  
  // Récupérer tous les fournisseurs  
  async getAllFournisseurs() {  
    try {  
      const response = await axios.get(`${API_BASE_URL}/fournisseurs`);  
      return response.data;  
    } catch (error) {  
      throw this.handleError(error);  
    }  
  }  
  
  // Récupérer un fournisseur par ID  
  async getFournisseurById(id) {  
    try {  
      const response = await axios.get(`${API_BASE_URL}/fournisseurs/${id}`);  
      return response.data;  
    } catch (error) {  
      throw this.handleError(error);  
    }  
  }  
  
  // Modifier un fournisseur  
  async updateFournisseur(id, fournisseurData) {  
    try {  
      const response = await axios.put(`${API_BASE_URL}/fournisseurs/${id}`, fournisseurData);  
      return response.data;  
    } catch (error) {  
      throw this.handleError(error);  
    }  
  }  
  
  // Supprimer un fournisseur  
  async deleteFournisseur(id) {  
    try {  
      const response = await axios.delete(`${API_BASE_URL}/fournisseurs/${id}`);  
      return response.data;  
    } catch (error) {  
      throw this.handleError(error);  
    }  
  }  

  async addAdresseFournisseur(fournisseurId, adresseData) {  
    try {  
      const response = await axios.post(`${API_BASE_URL}/fournisseurs/${fournisseurId}/adresses`, adresseData);  
      return response.data;  
    } catch (error) {  
      throw this.handleError(error);  
    }  
  }  
    
  // Récupérer les adresses d'un fournisseur  
  async getAdressesFournisseur(fournisseurId) {  
    try {  
      const response = await axios.get(`${API_BASE_URL}/fournisseurs/${fournisseurId}/adresses`);  
      return response.data;  
    } catch (error) {  
      throw this.handleError(error);  
    }  
  }

  // Modifier une adresse d'un fournisseur  
async updateAdresseFournisseur(fournisseurId, adresseId, adresseData) {  
  try {  
    const response = await axios.put(`${API_BASE_URL}/fournisseurs/${fournisseurId}/adresses/${adresseId}`, adresseData);  
    return response.data;  
  } catch (error) {  
    throw this.handleError(error);  
  }  
}  
  
// Supprimer une adresse d'un fournisseur  
async deleteAdresseFournisseur(fournisseurId, adresseId) {  
  try {  
    const response = await axios.delete(`${API_BASE_URL}/fournisseurs/${fournisseurId}/adresses/${adresseId}`);  
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
  
export default new FournisseurService();