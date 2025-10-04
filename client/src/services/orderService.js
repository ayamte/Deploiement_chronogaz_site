import api from './api';    
import { authService } from './authService';    
    
// Création de commande avec nouvelle architecture d'adresses - SANS GPS    
export const createOrderFromSteps = async (orderData) => {        
  try {        
    console.log('🛒 Création de commande avec:', orderData);        
        
    const user = authService.getUser();        
    console.log('👤 [DEBUG] Utilisateur récupéré:', user);
    
    // 🔧 CORRECTION: Vérifier plusieurs sources pour le customer_id
    let clientId = user?.customer_id || user?.customerId || orderData.clientId;
    
    // Si toujours pas de clientId, essayer de le récupérer depuis le token
    if (!clientId && user?.userId) {
      clientId = user.userId;
    }
    
    console.log('🆔 [DEBUG] Client ID utilisé:', clientId);
    
    if (!clientId) {
      throw new Error("Impossible de récupérer l'ID du client. Veuillez vous reconnecter.");
    }
        
    // Lignes de commande      
    const lignes = [];        
    orderData.products.forEach(product => {        
      const quantity = orderData.quantities[product._id];        
      const price = orderData.prices[product._id];        
      if (quantity > 0) {        
        lignes.push({        
          product_id: product._id,        
          UM_id: product.unites_mesure?.[0]?.UM_id || null,        
          quantity: quantity,        
          price: price        
        });        
      }        
    });        
        
    if (lignes.length === 0) {        
      throw new Error("Aucun produit sélectionné");        
    }        
        
    // 🔧 MODIFIÉ: Structure d'adresse SANS GPS - seulement 2 options
    let addressPayload = {};        
        
    if (orderData.selectedExistingAddress) {        
      // Option 1: Adresse existante sélectionnée
      addressPayload = {        
        use_existing_address: true,        
        address_id: orderData.selectedExistingAddress._id        
      };        
    } else if (orderData.address && orderData.address.new_address) {        
      // Option 2: Nouvelle adresse manuelle
      addressPayload = {        
        use_existing_address: false,        
        new_address: orderData.address.new_address    
      };        
    } else {        
      throw new Error("Aucune adresse de livraison fournie");        
    }        
        
    const response = await api.post('/commands', {      
      customer_id: clientId,      
      address: addressPayload,  
      details: orderData.additionalInfo || '',      
      urgent: false,      
      lignes: lignes      
    });    
        
    return response.data.data;        
  } catch (error) {        
    console.error("❌ Erreur création commande:", error);        
    throw error;        
  }        
};  
    
// ✅ Validation d'adresse corrigée - SANS GPS    
export const validateAddress = (address, selectedExistingAddress) => {    
  // Option 1: Adresse existante sélectionnée
  if (selectedExistingAddress) return true;    
      
  // Option 2: Nouvelle adresse manuelle
  if (address && address.new_address) {
    const requiredFields = ['street', 'city_id', 'telephone'];    
    const missingFields = requiredFields.filter(field => !address.new_address[field]);    
    if (missingFields.length > 0) {    
      console.warn('Champs manquants:', missingFields);    
      return false;    
    }    
    return true;
  }
  
  return false;    
};    
    
// Service principal avec toutes les fonctions    
export const orderService = {    
  createOrderFromSteps,    
  validateAddress,    
    
  async getOrders(params = {}) {    
    const {    
      page = 1,    
      limit = 20,    
      search,    
      status,    
      priority,    
      dateFrom,    
      dateTo,    
      customerId    
    } = params;    
          
    try {    
      const response = await api.get('/commands', {    
        params: {    
          page,    
          limit,    
          search,    
          status,
          priority,    
          dateFrom,    
          dateTo,    
          ...(customerId && { customerId })    
        }    
      });    
    
      const transformedData = response.data.data.map(command => ({    
        id: command._id,    
        orderNumber: command.numero_commande,    
        montant_total: command.montant_total,
        totalAmount: command.montant_total,
        customer: {    
          id: command.customer_id._id,    
          name: command.customer_id?.physical_user_id?.first_name ||    
                command.customer_id?.moral_user_id?.raison_sociale ||    
                command.customer_id.customer_code,    
          phone: command.customer_id.physical_user_id?.telephone_principal ||    
                 command.customer_id.moral_user_id?.telephone_principal || '',    
        },    
        deliveryAddress: command.address_id ? {    
          address: `${command.address_id.numimmeuble || ''} ${command.address_id.street || ''}`.trim(),    
          city: command.address_id.city_id?.name || 'Casablanca',  
          quartier: command.address_id.quartier || '',    
          latitude: command.address_id.latitude,    
          longitude: command.address_id.longitude    
        } : null,    
        orderDate: command.date_commande,    
        requestedDeliveryDate: command.date_souhaite || command.date_commande,    
        // ✅ CORRIGÉ: Utiliser le statut de commande directement
        status: this.mapCommandeToStatus(command.statut),    
        priority: command.planification?.priority || (command.urgent ? 'high' : 'medium'),    
        assignedTruckId: command.planification?.trucks_id?._id || null,    
        assignedTruck: command.planification?.trucks_id ? {    
          id: command.planification.trucks_id._id,    
          plateNumber: command.planification.trucks_id.matricule,    
          model: command.planification.trucks_id.marque,    
          capacity: command.planification.trucks_id.capacite,
          driverName: command.planification.livreur_employee_id?.physical_user_id 
            ? `${command.planification.livreur_employee_id.physical_user_id.first_name} ${command.planification.livreur_employee_id.physical_user_id.last_name}`
            : 'Non assigné'
        } : null,    
        products: command.lignes || [],    
        customerNotes: command.details || '',    
        orderSource: 'website',    
        createdAt: command.createdAt,    
        updatedAt: command.updatedAt,
        planification: command.planification,
        livraison: command.livraison
      }));    
    
      return {    
        data: transformedData,    
        total: response.data.count || transformedData.length,    
        totalPages: Math.ceil((response.data.count || transformedData.length) / limit)    
      };    
    } catch (error) {    
      console.error('Erreur getOrders:', error);    
      throw error;    
    }    
  },    
    
  async getOrder(orderId) {      
    try {      
      const response = await api.get(`/commands/${orderId}`);      
      const command = response.data.data.command;      
      const planification = response.data.data.planification;  
      const evaluation = response.data.data.evaluation; // ✅ AJOUT : Récupérer l'évaluation  
              
      return {      
        id: command._id,      
        orderNumber: command.numero_commande,      
        customer: {      
          id: command.customer_id._id,      
          name: command.customer_id.physical_user_id?.first_name + ' ' + command.customer_id.physical_user_id?.last_name ||      
                command.customer_id.moral_user_id?.raison_sociale ||      
                command.customer_id.customer_code,      
          phone: command.customer_id.physical_user_id?.telephone_principal ||      
                command.customer_id.moral_user_id?.telephone_principal || '',      
          email: command.customer_id.email || ''      
        },      
        deliveryAddress: command.address_id ? {      
          address: `${command.address_id.numimmeuble || ''} ${command.address_id.street || ''}`.trim(),      
          city: command.address_id.city_id?.name || 'Casablanca',    
          quartier: command.address_id.quartier || '',      
          latitude: command.address_id.latitude,      
          longitude: command.address_id.longitude      
        } : null,      
        orderDate: command.date_commande,      
        requestedDeliveryDate: command.date_souhaite || command.date_commande,      
        status: this.mapCommandeToStatus(command.statut),      
        priority: planification?.priority || (command.urgent ? 'high' : 'medium'),      
        products: response.data.data.lignes || [],      
        customerNotes: command.details || '',      
        assignedTruck: planification?.trucks_id || null,  
        evaluation: evaluation, // ✅ AJOUT : Inclure l'évaluation dans la réponse  
        history: this.generateHistory(command, planification)      
      };      
    } catch (error) {      
      console.error('Erreur getOrder:', error);      
      throw error;      
    }      
  },   
    
  async updateOrder(orderId, updateData) {    
    try {    
      const response = await api.put(`/commands/${orderId}`, updateData);    
      return response.data.data;    
    } catch (error) {    
      console.error('Erreur updateOrder:', error);    
      throw error;    
    }    
  },    
    
  async getOrderStats() {    
    try {    
      const response = await api.get('/commands/stats');    
      const stats = response.data.data;    
            
      return {    
        total: stats.totalCommandes,    
        pending: stats.pending || 0,    
        assigned: stats.assigned || 0,    
        inProgress: stats.inProgress || 0,    
        delivered: stats.delivered || 0,
        cancelled: stats.cancelled || 0
      };    
    } catch (error) {    
      console.error('Erreur getOrderStats:', error);    
      throw error;    
    }    
  },    
    
  // ✅ CORRIGÉ: Fonction pour mapper les statuts de commande vers les statuts frontend
  mapCommandeToStatus(statutCommande) {
    switch (statutCommande) {
      case 'CONFIRMEE': return 'pending';
      case 'ASSIGNEE': return 'assigned';
      case 'EN_COURS': return 'in_progress';
      case 'LIVREE': return 'delivered';
      case 'ANNULEE': return 'cancelled';
      case 'ECHOUEE': return 'cancelled';
      default: return 'pending';
    }
  },

  // ✅ SUPPRIMÉ: Ancienne fonction mapPlanificationToStatus remplacée par mapCommandeToStatus

  // Fonction pour assigner un camion
  async assignTruck(orderId, assignmentData) {
    try {
      console.log('🚛 [DEBUG] Assignation camion:', { orderId, assignmentData });
      
      const response = await api.post(`/planifications`, {
        commande_id: orderId,
        truck_id: assignmentData.truckId,
        priority: assignmentData.priority,
        delivery_date: assignmentData.scheduledDate
      });
      
      console.log('✅ [DEBUG] Réponse assignation:', response.data);
      return response.data.data;
    } catch (error) {
      console.error('❌ Erreur assignTruck:', error);
      throw error;
    }
  },

  // Fonction pour annuler une assignation
  async cancelAssignment(orderId) {
    try {
      console.log('🚫 [DEBUG] Annulation assignation pour commande:', orderId);
      
      const response = await api.delete(`/planifications/commande/${orderId}`);
      console.log('✅ [DEBUG] Réponse annulation:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur cancelAssignment:', error);
      throw error;
    }
  },
    
  // Utiliser l'endpoint existant pour les commandes client  
  async getClientOrders(customerId) {    
    try {    
      const response = await api.get(`/commands/customer/${customerId}`);  
      return response.data;    
    } catch (error) {    
      console.error('Erreur récupération commandes client:', error);    
      throw error;    
    }    
  },    
    
  // Alias pour compatibilité  
  async getOrderById(orderId) {    
    return this.getOrder(orderId);  
  },    
    
  async cancelOrder(orderId, raison_annulation = '') {    
    try {    
      const response = await api.put(`/commands/${orderId}/cancel`, {  
        raison_annulation  
      });    
      return response.data;    
    } catch (error) {    
      console.error('Erreur annulation commande:', error);    
      throw error;    
    }    
  },    
    
  // ✅ CORRIGÉ: Fonction pour générer l'historique basée sur les statuts de commande
  generateHistory(command, planification) {
    const history = [];
    
    if (command.createdAt) {
      history.push({
        id: 'created',
        action: 'Commande créée',
        date: command.createdAt,
        status: 'pending'
      });
    }
    
    if (planification?.createdAt) {
      history.push({
        id: 'assigned',
        action: 'Camion assigné',
        date: planification.createdAt,
        status: 'assigned'
      });
    }

    // ✅ NOUVEAU: Ajouter les étapes basées sur le statut de commande
    if (command.statut === 'EN_COURS' && command.updatedAt) {
      history.push({
        id: 'in_progress',  
        action: 'Livraison démarrée',  
        date: command.updatedAt,  
        status: 'in_progress'  
      });  
    }  
  
    if (command.statut === 'LIVREE' && command.updatedAt) {  
      history.push({  
        id: 'delivered',  
        action: 'Livraison terminée',  
        date: command.updatedAt,  
        status: 'delivered'  
      });  
    }  
  
    if (command.statut === 'ANNULEE' && command.updatedAt) {  
      history.push({  
        id: 'cancelled',  
        action: 'Commande annulée',  
        date: command.updatedAt,  
        status: 'cancelled'  
      });  
    }  
      
    return history.sort((a, b) => new Date(a.date) - new Date(b.date));  
  },  
        
  // Fonction pour créer une commande depuis les étapes du workflow client        
  async createOrder(orderData) {        
    try {        
      const response = await api.post('/commands', orderData);        
      return response.data;        
    } catch (error) {        
      console.error('Erreur création commande:', error);        
      throw error;        
    }        
  },        
        
  // Fonction pour obtenir les commandes par statut  
  async getOrdersByStatus(status) {        
    try {        
      const response = await api.get('/commands', {        
        params: { status }  
      });        
      return response.data.data;        
    } catch (error) {        
      console.error('Erreur récupération commandes par statut:', error);        
      throw error;        
    }        
  },        
        
  // Fonction pour obtenir les commandes urgentes        
  async getUrgentOrders() {        
    try {        
      const response = await api.get('/commands', {        
        params: { priority: 'urgent' }        
      });        
      return response.data.data;        
    } catch (error) {        
      console.error('Erreur récupération commandes urgentes:', error);          
      throw error;          
    }          
  },          
          
  // Fonction pour marquer une commande comme urgente (via update)        
  async markOrderAsUrgent(orderId) {          
    try {          
      const response = await api.put(`/commands/${orderId}`, {          
        urgent: true          
      });          
      return response.data.data;          
    } catch (error) {          
      console.error('Erreur marquage commande urgente:', error);          
      throw error;          
    }          
  },          
          
  // Fonction pour obtenir les commandes d'une période          
  async getOrdersByDateRange(startDate, endDate) {          
    try {          
      const response = await api.get('/commands', {          
        params: {          
          dateFrom: startDate,          
          dateTo: endDate          
        }          
      });          
      return response.data.data;          
    } catch (error) {          
      console.error('Erreur récupération commandes par période:', error);          
      throw error;          
    }          
  },      
      
  // ✅ NOUVEAU: Service pour les livraisons      
  async startDelivery(planificationId, deliveryData) {      
    try {      
      const response = await api.post(`/livraisons/start/${planificationId}`, deliveryData);      
      return response.data.data;      
    } catch (error) {      
      console.error('Erreur démarrage livraison:', error);      
      throw error;      
    }      
  },      
      
  async completeDelivery(livraisonId, completionData) {      
    try {      
      const response = await api.put(`/livraisons/${livraisonId}/complete`, completionData);      
      return response.data.data;      
    } catch (error) {      
      console.error('Erreur finalisation livraison:', error);      
      throw error;      
    }      
  },      
      
  async getDeliveries(params = {}) {      
    try {      
      const response = await api.get('/livraisons', { params });      
      return response.data;      
    } catch (error) {      
      console.error('Erreur récupération livraisons:', error);      
      throw error;      
    }      
  },      
      
  async getDeliveryById(livraisonId) {      
    try {      
      const response = await api.get(`/livraisons/${livraisonId}`);      
      return response.data.data;      
    } catch (error) {      
      console.error('Erreur récupération livraison:', error);      
      throw error;      
    }      
  },      
      
  async updateDeliveryLines(livraisonId, lignes) {      
    try {      
      const response = await api.put(`/livraisons/${livraisonId}/lines`, { lignes });      
      return response.data.data;      
    } catch (error) {      
      console.error('Erreur mise à jour lignes livraison:', error);      
      throw error;      
    }      
  },  
  
  // ✅ NOUVEAU: Fonction pour annuler une livraison  
  async cancelDelivery(livraisonId, raison_annulation = '') {  
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
  }  
};          
          
export default orderService;