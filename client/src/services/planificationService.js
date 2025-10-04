import api from './api';    
import { authService } from './authService';
    
const planificationService = {    
  // Obtenir toutes les planifications avec filtres    
  async getPlanifications(params = {}) {    
    try {    
      const {    
        page = 1,    
        limit = 20,    
        etat,    
        livreur_employee_id,    
        trucks_id,    
        dateFrom,    
        dateTo,    
        priority    
      } = params;    
    
      console.log('🔍 [DEBUG] Paramètres de recherche:', params);
      
      const response = await api.get('/planifications', {    
        params: {    
          page,    
          limit,    
          etat,    
          livreur_employee_id,    
          trucks_id,    
          dateFrom,    
          dateTo,    
          priority    
        }    
      });    

      console.log('📡 [DEBUG] Réponse API brute:', response.data);
      console.log('📊 [DEBUG] Structure de la réponse:', {
        success: response.data.success,
        count: response.data.count,
        dataLength: response.data.data?.length,
        pagination: response.data.pagination
      });
    
      return {    
        data: response.data.data || [],    
        total: response.data.count || 0,    
        pagination: response.data.pagination || {}    
      };    
    } catch (error) {    
      console.error('❌ Erreur récupération planifications:', error);    
      throw error;    
    }    
  },    
    
  // Méthodes utilitaires pour extraire les noms clients (reste identique)
  getClientName(customer) {    
    if (!customer) return 'Client inconnu';    
        
    if (customer.physical_user_id) {    
      return `${customer.physical_user_id.first_name} ${customer.physical_user_id.last_name}`;    
    }    
        
    if (customer.moral_user_id) {    
      return customer.moral_user_id.raison_sociale;    
    }    
        
    return customer.customer_code || 'Client inconnu';    
  },    
    
  getClientPhone(customer) {    
    if (!customer) return '';    
        
    return customer.physical_user_id?.telephone_principal ||    
           customer.moral_user_id?.telephone_principal || '';    
  },    
    
  // Obtenir une planification par ID (reste identique)
  async getPlanificationById(planificationId) {    
    try {    
      const response = await api.get(`/planifications/${planificationId}`);    
      const planification = response.data.data;    
    
      return {    
        id: planification._id,    
        planificationId: planification._id,    
        date: planification.delivery_date,    
        etat: planification.etat,    
        priority: planification.priority,    
        orderdelivery: planification.orderdelivery,    
        commande: planification.commande_id,    
        camion: planification.trucks_id,    
        livreur: planification.livreur_employee_id,    
        accompagnateur: planification.accompagnateur_id,    
        commentaires: planification.commentaires,    
        lignes: planification.lignes || [],    
        createdAt: planification.createdAt,    
        updatedAt: planification.updatedAt    
      };    
    } catch (error) {    
      console.error('Erreur récupération planification:', error);    
      throw error;    
    }    
  },    
    
  // Obtenir les planifications par employé (reste identique)
  async getPlanificationsByEmployee(employeeId) {    
    try {    
      console.log('🔍 [DEBUG] Récupération planifications pour employé:', employeeId);
      
      let planifications = await this.getPlanifications({     
        livreur_employee_id: employeeId,    
        etat: 'PLANIFIE'    
      });
      
      console.log('👤 [DEBUG] Planifications avec chauffeur assigné:', planifications.data.length);
      
      if (planifications.data.length === 0) {
        try {
          console.log('🚛 [DEBUG] Aucune planification directe, tentative par camion...');
          const userResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/users/profile`, {
            headers: {
              'Authorization': `Bearer ${authService.getToken()}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (userResponse.ok) {
            const userData = await userResponse.json();
            console.log('👤 [DEBUG] Données utilisateur:', userData.data?.employee_info);
            
            if (userData.success && userData.data.employee_info?.truck_id) {
              const truckId = userData.data.employee_info.truck_id;
              console.log('🚛 [DEBUG] Employé assigné au camion:', truckId);
              
              const truckPlanifications = await this.getPlanifications({     
                trucks_id: truckId,    
                etat: 'PLANIFIE'    
              });
              
              console.log('🚛 [DEBUG] Planifications trouvées pour le camion:', truckPlanifications.data.length);
              planifications = truckPlanifications;
            } else {
              console.log('⚠️ [DEBUG] Aucun camion assigné à cet employé');
            }
          }
        } catch (error) {
          console.warn('⚠️ [WARN] Impossible de récupérer les planifications par camion:', error);
        }
      }
      
      if (planifications.data.length === 0) {
        console.log('🔍 [DEBUG] Aucune planification trouvée, tentative de récupération générale...');
        try {
          const allPlanifications = await this.getPlanifications({ etat: 'PLANIFIE' });
          console.log('🌍 [DEBUG] Toutes les planifications PLANIFIE:', allPlanifications.data.length);
          
          if (allPlanifications.data.length > 0) {
            console.log('🔍 [DEBUG] Première planification (exemple):', {
              id: allPlanifications.data[0]._id,
              commande: allPlanifications.data[0].commande_id?.numero_commande,
              camion: allPlanifications.data[0].trucks_id?.matricule,
              chauffeur: allPlanifications.data[0].livreur_employee_id
            });
            
            console.log('✅ [DEBUG] Retour des planifications générales trouvées');
            planifications = allPlanifications;
          }
        } catch (error) {
          console.warn('⚠️ [WARN] Impossible de récupérer toutes les planifications:', error);
        }
      }
      
      return planifications;
    } catch (error) {    
      console.error('❌ Erreur récupération planifications par employé:', error);    
      throw error;    
    }    
  },    
    
  // Obtenir les planifications d'aujourd'hui (reste identique)
  async getTodayPlanifications() {    
    try {    
      const today = new Date();    
      const dateFrom = today.toISOString().split('T')[0];    
      const dateTo = dateFrom;    
    
      return await this.getPlanifications({ dateFrom, dateTo });    
    } catch (error) {    
      console.error('Erreur récupération planifications du jour:', error);    
      throw error;    
    }    
  },    
    
  // Obtenir les planifications par camion (reste identique)
  async getPlanificationsByTruck(truckId) {    
    try {    
      return await this.getPlanifications({     
        trucks_id: truckId,    
        etat: 'PLANIFIE'    
      });    
    } catch (error) {    
      console.error('Erreur récupération planifications par camion:', error);    
      throw error;    
    }    
  },    
    
  // ✅ NOUVEAU: Créer une planification
  async createPlanification(planificationData) {
    try {
      const response = await api.post('/planifications', planificationData);
      return response.data.data;
    } catch (error) {
      console.error('Erreur création planification:', error);
      throw error;
    }
  },
    
  // Mettre à jour une planification (reste identique)
  async updatePlanification(planificationId, updateData) {    
    try {    
      const response = await api.put(`/planifications/${planificationId}`, updateData);    
      return response.data.data;    
    } catch (error) {    
      console.error('Erreur mise à jour planification:', error);    
      throw error;    
    }    
  },    
    
  // ✅ CORRIGÉ: Annuler une planification (utilise l'endpoint correct)
  async cancelPlanification(commandeId, raison_annulation = '') {    
    try {    
      const response = await api.put(`/planifications/commande/${commandeId}/cancel`, {
        raison_annulation
      });    
      return response.data;    
    } catch (error) {    
      console.error('Erreur annulation planification:', error);    
      throw error;    
    }    
  },    
    
  // Démarrer une livraison depuis une planification (reste identique)
  async startLivraisonFromPlanification(planificationId, deliveryData = {}) {    
    try {    
      const { latitude, longitude, details } = deliveryData;    
          
      const response = await api.post(`/livraisons/start/${planificationId}`, {    
        latitude,    
        longitude,    
        details    
      });    
          
      return response.data;    
    } catch (error) {    
      console.error('Erreur démarrage livraison depuis planification:', error);    
      throw error;    
    }    
  },    
    
  // Obtenir les statistiques des planifications (reste identique)
  async getPlanificationStats(params = {}) {    
    try {    
      const response = await api.get('/planifications/stats', { params });    
      return response.data;    
    } catch (error) {    
      console.error('Erreur récupération statistiques planifications:', error);    
      throw error;    
    }    
  },    
    
  // ✅ CORRIGÉ: Mapper les états de planification simplifiés
  mapEtatToDisplay(etat) {    
    const mapping = {    
      'PLANIFIE': 'Planifiée',    
      'ANNULE': 'Annulée'
    };    
    return mapping[etat] || etat;    
  },    
    
  // ✅ CORRIGÉ: Couleurs pour les états simplifiés
  getEtatColor(etat) {    
    const colors = {    
      'PLANIFIE': 'blue',    
      'ANNULE': 'red'
    };    
    return colors[etat] || 'gray';    
  },    
    
  // ✅ CORRIGÉ: Icônes pour les états simplifiés
  getEtatIcon(etat) {    
    const icons = {    
      'PLANIFIE': 'calendar',    
      'ANNULE': 'x-circle'
    };    
    return icons[etat] || 'circle';    
  },    
    
  // ✅ CORRIGÉ: Validation avec états simplifiés
  validatePlanificationData(data) {    
    const errors = [];    
    
    if (!data.commande_id) {    
      errors.push('ID de commande requis');    
    }    
    
    if (!data.trucks_id) {    
      errors.push('ID de camion requis');    
    }    
    
    if (!data.delivery_date) {    
      errors.push('Date de livraison requise');    
    }    
    
    // Validation de la date    
    if (data.delivery_date) {    
      const deliveryDate = new Date(data.delivery_date);    
      const today = new Date();    
      today.setHours(0, 0, 0, 0);    
          
      if (deliveryDate < today) {    
        errors.push('La date de livraison ne peut pas être dans le passé');    
      }    
    }    
    
    // Validation de la priorité    
    if (data.priority && !['low', 'medium', 'high', 'urgent'].includes(data.priority)) {    
      errors.push('Priorité invalide');    
    }

    // ✅ NOUVEAU: Validation de l'état
    if (data.etat && !['PLANIFIE', 'ANNULE'].includes(data.etat)) {
      errors.push('État invalide. États autorisés: PLANIFIE, ANNULE');
    }
    
    return {    
      isValid: errors.length === 0,    
      errors    
    };    
  },    
    
  // ✅ CORRIGÉ: Filtrage avec états simplifiés
  filterPlanifications(planifications, filters = {}) {    
    let filtered = [...planifications];    
    
    if (filters.etat) {    
      // ✅ NOUVEAU: Validation de l'état de filtre
      const etatsAutorises = ['PLANIFIE', 'ANNULE'];
      if (etatsAutorises.includes(filters.etat)) {
        filtered = filtered.filter(p => p.etat === filters.etat);    
      }
    }    
    
    if (filters.priority) {    
      filtered = filtered.filter(p => p.priority === filters.priority);    
    }    
    
    if (filters.dateFrom) {    
      const dateFrom = new Date(filters.dateFrom);    
      filtered = filtered.filter(p => new Date(p.date) >= dateFrom);    
    }    
    
    if (filters.dateTo) {    
      const dateTo = new Date(filters.dateTo);    
      filtered = filtered.filter(p => new Date(p.date) <= dateTo);    
    }    
    
    if (filters.search) {    
      const searchTerm = filters.search.toLowerCase();    
      filtered = filtered.filter(p =>     
        p.commande?.numero?.toLowerCase().includes(searchTerm) ||    
        p.commande?.client_name?.toLowerCase().includes(searchTerm) ||      
        p.livreur?.nom?.toLowerCase().includes(searchTerm)      
      );      
    }      
      
    return filtered;      
  },      
      
  // ✅ CORRIGÉ: Tri avec validation des états simplifiés  
  sortPlanifications(planifications, sortBy = 'date', sortOrder = 'asc') {      
    return [...planifications].sort((a, b) => {      
      let aValue, bValue;      
      
      switch (sortBy) {      
        case 'date':      
          aValue = new Date(a.date);      
          bValue = new Date(b.date);      
          break;      
        case 'priority':      
          const priorityOrder = { low: 1, medium: 2, high: 3, urgent: 4 };      
          aValue = priorityOrder[a.priority] || 0;      
          bValue = priorityOrder[b.priority] || 0;      
          break;      
        case 'client':      
          aValue = a.commande?.client_name || '';      
          bValue = b.commande?.client_name || '';      
          break;      
        case 'etat':      
          aValue = a.etat || '';      
          bValue = b.etat || '';      
          break;      
        default:      
          aValue = a[sortBy] || '';      
          bValue = b[sortBy] || '';      
      }      
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;      
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;      
      return 0;      
    });      
  }      
};      
      
export default planificationService;