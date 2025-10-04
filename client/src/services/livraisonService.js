import api from './api';      
      
const livraisonService = {      
  // Démarrer une livraison depuis une planification (reste identique)  
  async startLivraison(planificationId, deliveryData = {}) {      
    try {      
      const { latitude, longitude, details } = deliveryData;      
            
      const response = await api.post(`/livraisons/start/${planificationId}`, {      
        latitude,      
        longitude,      
        details      
      });      
            
      return response.data;      
    } catch (error) {      
      console.error('Erreur démarrage livraison:', error);      
      throw error;      
    }      
  },      
      
  // ✅ CORRIGÉ: Terminer une livraison avec états simplifiés  
  async completeLivraison(livraisonId, completionData) {      
    try {      
      const {      
        latitude,      
        longitude,      
        details,      
        signature_client,      
        photo_livraison,      
        commentaires_livreur,      
        commentaires_client,      
        evaluation_client,      
        etat = 'LIVRE' // ✅ CORRIGÉ: LIVRE, ECHEC, ANNULE seulement  
      } = completionData;      
  
      // ✅ NOUVEAU: Validation des états autorisés  
      const etatsAutorises = ['LIVRE', 'ECHEC', 'ANNULE'];  
      if (!etatsAutorises.includes(etat)) {  
        throw new Error(`État "${etat}" non autorisé. États valides: ${etatsAutorises.join(', ')}`);  
      }  
      
      const response = await api.put(`/livraisons/${livraisonId}/complete`, {      
        latitude,      
        longitude,      
        details,      
        signature_client,      
        photo_livraison,      
        commentaires_livreur,      
        commentaires_client,      
        evaluation_client,      
        etat      
      });      
      
      return response.data;      
    } catch (error) {      
      console.error('Erreur finalisation livraison:', error);      
      throw error;      
    }      
  },      
      
  // Obtenir toutes les livraisons avec filtres (reste identique)  
  async getLivraisons(params = {}) {      
    try {      
      const {      
        page = 1,      
        limit = 20,      
        etat,      
        planificationId,      
        dateFrom,      
        dateTo,      
        livreur_employee_id     
      } = params;    
      
      const response = await api.get('/livraisons', {      
        params: {      
          page,      
          limit,      
          etat,      
          planificationId,      
          dateFrom,      
          dateTo,      
          livreur_employee_id      
        }      
      });      
      
      const transformedData = response.data.data?.map(livraison => ({    
        id: livraison._id,    
        planificationId: livraison.planification_id?._id,    
        date: livraison.date,    
        etat: livraison.etat,    
        latitude: livraison.latitude,    
        longitude: livraison.longitude,    
        total: livraison.total,    
        total_ttc: livraison.total_ttc,    
        total_tva: livraison.total_tva,    
        details: livraison.details,    
        commentaires_livreur: livraison.commentaires_livreur,    
        commentaires_client: livraison.commentaires_client,    
        evaluation_client: livraison.evaluation_client,    
            
        commande_id: livraison.planification_id?.commande_id ? {    
          _id: livraison.planification_id.commande_id._id,    
          numero_commande: livraison.planification_id.commande_id.numero_commande,    
          montant_total: livraison.planification_id.commande_id.montant_total,    
          date_commande: livraison.planification_id.commande_id.date_commande,    
          details: livraison.planification_id.commande_id.details,    
          customer_id: livraison.planification_id.commande_id.customer_id,    
          address_id: livraison.planification_id.commande_id.address_id,    
          lignes: livraison.planification_id.commande_id.lignes || []    
        } : null,    
            
        delivery_date: livraison.planification_id?.delivery_date,    
        priority: livraison.planification_id?.priority,    
        livreur_employee_id: livraison.planification_id?.livreur_employee_id,    
        trucks_id: livraison.planification_id?.trucks_id,    
            
        createdAt: livraison.createdAt,    
        updatedAt: livraison.updatedAt    
      })) || [];    
      
      return {      
        data: transformedData,      
        total: response.data.count || 0,      
        pagination: response.data.pagination || {}      
      };      
    } catch (error) {      
      console.error('Erreur récupération livraisons:', error);      
      throw error;      
    }      
  },      
      
  // Obtenir une livraison par ID (reste identique)  
  async getLivraisonById(livraisonId) {      
    try {      
      const response = await api.get(`/livraisons/${livraisonId}`);      
      const livraison = response.data.data.livraison;      
      const lignes = response.data.data.lignes || [];      
      
      return {      
        id: livraison._id,      
        planificationId: livraison.planification_id?._id,      
        date: livraison.date,      
        etat: livraison.etat,      
        latitude: livraison.latitude,      
        longitude: livraison.longitude,      
        total: livraison.total,      
        total_ttc: livraison.total_ttc,      
        total_tva: livraison.total_tva,      
        details: livraison.details,      
        signature_client: livraison.signature_client,      
        photo_livraison: livraison.photo_livraison,      
        commentaires_livreur: livraison.commentaires_livreur,      
        commentaires_client: livraison.commentaires_client,      
        evaluation_client: livraison.evaluation_client,      
        commande: livraison.planification_id?.commande_id || null,      
        camion: livraison.planification_id?.trucks_id || null,      
        livreur: livraison.planification_id?.livreur_employee_id || null,      
        lignes: lignes.map(ligne => ({      
          id: ligne._id,      
          quantity: ligne.quantity,      
          price: ligne.price,      
          total_ligne: ligne.total_ligne,      
          etat_ligne: ligne.etat_ligne,      
          notes: ligne.notes,      
          product: ligne.product_id ? {      
            id: ligne.product_id._id,      
            ref: ligne.product_id.ref,      
            nom: ligne.product_id.long_name || ligne.product_id.short_name,      
            brand: ligne.product_id.brand      
          } : null,      
          unite: ligne.UM_id ? {      
            id: ligne.UM_id._id,      
            nom: ligne.UM_id.unitemesure      
          } : null      
        })),      
        createdAt: livraison.createdAt,      
        updatedAt: livraison.updatedAt      
      };      
    } catch (error) {      
      console.error('Erreur récupération livraison:', error);      
      throw error;      
    }      
  },      
      
  // ✅ CORRIGÉ: Mettre à jour les lignes avec validation des états  
  async updateLivraisonLines(livraisonId, lignes) {      
    try {      
      // ✅ NOUVEAU: Validation des états de ligne autorisés  
      const etatsLigneAutorises = ['LIVRE', 'ECHEC', 'ANNULE'];  
        
      const validatedLignes = lignes.map(ligne => {  
        const etatLigne = ligne.etat_ligne || 'LIVRE';  
          
        if (!etatsLigneAutorises.includes(etatLigne)) {  
          throw new Error(`État de ligne "${etatLigne}" non autorisé. États valides: ${etatsLigneAutorises.join(', ')}`);  
        }  
          
        return {  
          product_id: ligne.product_id,      
          UM_id: ligne.UM_id,      
          quantity: ligne.quantity,      
          price: ligne.price,      
          etat_ligne: etatLigne,      
          notes: ligne.notes || ''      
        };  
      });  
  
      const response = await api.put(`/livraisons/${livraisonId}/lines`, {      
        lignes: validatedLignes  
      });      
      
      return response.data;      
    } catch (error) {      
      console.error('Erreur mise à jour lignes livraison:', error);      
      throw error;      
    }      
  },      
      
  // Obtenir les livraisons d'aujourd'hui (reste identique)  
  async getTodayLivraisons() {      
    try {      
      const today = new Date();      
      const dateFrom = today.toISOString().split('T')[0];      
      const dateTo = dateFrom;      
      
      return await this.getLivraisons({ dateFrom, dateTo });      
    } catch (error) {      
      console.error('Erreur récupération livraisons du jour:', error);      
      throw error;      
    }      
  },      
      
  // Obtenir les livraisons en cours (reste identique)  
  async getActiveLivraisons() {      
    try {      
      return await this.getLivraisons({ etat: 'EN_COURS' });      
    } catch (error) {      
      console.error('Erreur récupération livraisons actives:', error);      
      throw error;      
    }      
  },      
      
  // Obtenir les livraisons par planification (reste identique)  
  async getLivraisonsByPlanification(planificationId) {      
    try {      
      return await this.getLivraisons({ planificationId });      
    } catch (error) {      
      console.error('Erreur récupération livraisons par planification:', error);      
      throw error;      
    }      
  },      
      
  // ✅ CORRIGÉ: Statistiques avec états simplifiés  
  async getLivraisonsStats() {      
    try {      
      const response = await api.get('/livraisons/stats');      
      return response.data.data;      
    } catch (error) {      
      console.error('Erreur récupération statistiques livraisons:', error);      
      // ✅ CORRIGÉ: Stats par défaut sans PARTIELLE  
      return {      
        total: 0,      
        en_cours: 0,      
        livrees: 0,      
        echecs: 0,  
        annulees: 0  
      };      
    }      
  },      
      
  // ✅ CORRIGÉ: Mapper les états simplifiés  
  mapEtatToDisplay(etat) {      
    const mapping = {      
      'EN_COURS': 'En cours',      
      'LIVRE': 'Livrée',      
      'ECHEC': 'Échec',      
      'ANNULE': 'Annulée'  
    };      
    return mapping[etat] || etat;      
  },      
      
  // ✅ CORRIGÉ: Couleurs pour les états simplifiés  
  getEtatColor(etat) {      
    const colors = {      
      'EN_COURS': 'blue',      
      'LIVRE': 'green',      
      'ECHEC': 'red',      
      'ANNULE': 'gray'  
    };      
    return colors[etat] || 'gray';      
  },      
      
  // Validation des données de livraison (reste identique)  
  validateLivraisonData(data) {      
    const errors = [];      
      
    if (!data.planificationId) {      
      errors.push('ID de planification requis');      
    }      
      
    if (data.latitude && (data.latitude < -90 || data.latitude > 90)) {      
      errors.push('Latitude invalide');      
    }      
      
    if (data.longitude && (data.longitude < -180 || data.longitude > 180)) {      
      errors.push('Longitude invalide');      
    }      
      
    if (data.evaluation_client && (data.evaluation_client < 1 || data.evaluation_client > 5)) {      
      errors.push('Évaluation client doit être entre 1 et 5');      
    }      
      
    return {      
      isValid: errors.length === 0,      
      errors      
    };      
  },      
      
  // ✅ NOUVEAU: Fonction pour annuler une livraison  
  async cancelLivraison(livraisonId, raison_annulation = '') {  
    try {  
      const response = await api.put(`/livraisons/${livraisonId}/cancel`, {  
        raison_annulation  
      });  
      return response.data.data;  
    } catch (error) {  
      console.error('Erreur annulation livraison:', error);  
      throw error;  
    }  
  },  
  
  // ✅ NOUVEAU: Fonction pour obtenir les statistiques des livraisons  
  async getDeliveryStats() {  
    try {  
      const response = await api.get('/livraisons/stats');  
      return response.data.data;  
    } catch (error) {  
      console.error('Erreur récupération statistiques livraisons:', error);  
      throw error;  
    }  
  },  
  
  // Calculer la distance entre deux points GPS (reste identique)  
  calculateDistance(lat1, lon1, lat2, lon2) {      
    const R = 6371; // Rayon de la Terre en km      
    const dLat = (lat2 - lat1) * Math.PI / 180;      
    const dLon = (lon2 - lon1) * Math.PI / 180;      
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +      
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *      
              Math.sin(dLon/2) * Math.sin(dLon/2);      
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));      
    return R * c; // Distance en km      
  }      
};      
      
export default livraisonService;