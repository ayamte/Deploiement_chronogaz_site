import api from './api';  
  
const evaluationService = {  
  // Créer une nouvelle évaluation  
  async createEvaluation(evaluationData) {  
    try {  
      const response = await api.post('/evaluations', evaluationData);  
      return response.data;  
    } catch (error) {  
      throw new Error(error.response?.data?.message || 'Erreur lors de la création de l\'évaluation');  
    }  
  },  
  
  // Récupérer une évaluation par ID de livraison  
   async getEvaluationByLivraison(livraisonId) {    
    try {    
      const response = await api.get(`/evaluations/livraison/${livraisonId}`);    
      return response.data;    
    } catch (error) {    
      if (error.response?.status === 404) {    
        // ✅ CORRECTION: Supprimer le log d'erreur pour les cas normaux (pas d'évaluation)  
        return null; // Aucune évaluation trouvée - comportement normal  
      }    
      // Garder les autres erreurs  
      console.error('Erreur lors de la récupération de l\'évaluation:', error);  
      throw new Error(error.response?.data?.message || 'Erreur lors de la récupération de l\'évaluation');    
    }    
  },
  
  // Récupérer toutes les évaluations du client  
  async getClientEvaluations() {  
    try {  
      const response = await api.get('/evaluations/client');  
      return response.data;  
    } catch (error) {  
      throw new Error(error.response?.data?.message || 'Erreur lors de la récupération des évaluations');  
    }  
  },  
  
  // Vérifier si une livraison peut être évaluée  
  async canEvaluateLivraison(livraisonId) {  
    try {  
      const evaluation = await this.getEvaluationByLivraison(livraisonId);  
      return evaluation === null; // Peut être évaluée si aucune évaluation n'existe  
    } catch (error) {  
      return false;  
    }  
  }  
};  
  
export default evaluationService;