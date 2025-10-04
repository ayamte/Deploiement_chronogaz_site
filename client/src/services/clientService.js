import { authService } from './authService';        
        
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';        
        
export const clientService = {        
  // Récupérer tous les clients (utilise l'endpoint inline conservé)  
  getAll: async () => {        
    try {        
      const token = authService.getToken();        
      const response = await fetch(`${API_BASE_URL}/api/customers`, {        
        headers: {        
          'Authorization': `Bearer ${token}`,        
          'Content-Type': 'application/json'        
        }        
      });        
              
      if (response.status === 401) {        
        authService.logout();        
        return { success: false, message: 'Session expirée' };        
      }        
              
      return response.json();        
    } catch (error) {        
      console.error('Erreur lors de la récupération des clients:', error);        
      return { success: false, message: 'Erreur de connexion' };        
    }        
  },        
      
  // Créer un nouveau client (utilise l'endpoint inline conservé)  
  create: async (clientData) => {          
    try {          
      const token = authService.getToken();          
      const response = await fetch(`${API_BASE_URL}/api/admin/users`, {          
        method: 'POST',          
        headers: {          
          'Authorization': `Bearer ${token}`,          
          'Content-Type': 'application/json'          
        },          
        body: JSON.stringify({  
          email: clientData.profile.email,  
          password: 'TempPassword123', // Mot de passe temporaire  
          role_code: 'CLIENT',  
          type_personne: clientData.type_client,  
          profile: clientData.profile,  
          customer_info: {  
            statut: clientData.statut  
          }  
        })          
      });          
                
      if (response.status === 401) {          
        authService.logout();          
        return { success: false, message: 'Session expirée' };          
      }          
                
      return response.json();          
    } catch (error) {          
      console.error('Erreur lors de la création du client:', error);          
      return { success: false, message: 'Erreur de connexion' };          
    }          
  },        
      
  // Mettre à jour un client (utilise l'endpoint inline conservé)  
  update: async (id, clientData) => {        
    try {        
      const token = authService.getToken();        
      const response = await fetch(`${API_BASE_URL}/api/customers/${id}`, {        
        method: 'PUT',        
        headers: {        
          'Authorization': `Bearer ${token}`,        
          'Content-Type': 'application/json'        
        },        
        body: JSON.stringify(clientData)        
      });        
              
      if (response.status === 401) {        
        authService.logout();        
        return { success: false, message: 'Session expirée' };        
      }        
              
      return response.json();        
    } catch (error) {        
      console.error('Erreur lors de la mise à jour du client:', error);        
      return { success: false, message: 'Erreur de connexion' };        
    }        
  },        
      
  // Supprimer un client (utilise l'endpoint inline conservé)  
  delete: async (id) => {        
    try {        
      const token = authService.getToken();        
      const response = await fetch(`${API_BASE_URL}/api/customers/${id}`, {        
        method: 'DELETE',        
        headers: {        
          'Authorization': `Bearer ${token}`,        
          'Content-Type': 'application/json'        
        }        
      });        
              
      if (response.status === 401) {        
        authService.logout();        
        return { success: false, message: 'Session expirée' };        
      }        
              
      return response.json();      
    } catch (error) {        
      console.error('Erreur lors de la suppression du client:', error);        
      return { success: false, message: 'Erreur de connexion' };        
    }        
  },        
      
  // Rechercher des clients par critères (utilise le nouveau router modulaire)  
  search: async (searchTerm) => {        
    try {        
      const token = authService.getToken();        
      const response = await fetch(`${API_BASE_URL}/api/customer?search=${encodeURIComponent(searchTerm)}`, {        
        headers: {        
          'Authorization': `Bearer ${token}`,        
          'Content-Type': 'application/json'        
        }        
      });        
              
      if (response.status === 401) {        
        authService.logout();        
        return { success: false, message: 'Session expirée' };        
      }        
              
      return response.json();        
    } catch (error) {        
      console.error('Erreur lors de la recherche de clients:', error);        
      return { success: false, message: 'Erreur de connexion' };        
    }        
  },        
      
  // Obtenir un client par ID (utilise l'endpoint inline conservé)  
  getById: async (id) => {        
    try {        
      const token = authService.getToken();        
      const response = await fetch(`${API_BASE_URL}/api/customers/${id}`, {        
        headers: {        
          'Authorization': `Bearer ${token}`,        
          'Content-Type': 'application/json'        
        }        
      });        
              
      if (response.status === 401) {        
        authService.logout();        
        return { success: false, message: 'Session expirée' };        
      }        
              
      return response.json();        
    } catch (error) {        
      console.error('Erreur lors de la récupération du client:', error);        
      return { success: false, message: 'Erreur de connexion' };        
    }        
  },        
      
  // Obtenir les statistiques des clients (utilise le nouveau router modulaire)  
  getStats: async () => {        
    try {        
      const token = authService.getToken();        
      const response = await fetch(`${API_BASE_URL}/api/customer/stats/overview`, {        
        headers: {        
          'Authorization': `Bearer ${token}`,        
          'Content-Type': 'application/json'        
        }        
      });        
              
      if (response.status === 401) {        
        authService.logout();        
        return { success: false, message: 'Session expirée' };        
      }        
              
      return response.json();        
    } catch (error) {        
      console.error('Erreur lors de la récupération des statistiques:', error);        
      return { success: false, message: 'Erreur de connexion' };        
    }        
  },        
      
  // Changer le statut d'un client (implémentation alternative via update)  
  updateStatus: async (id, status) => {        
    try {        
      const token = authService.getToken();        
      const response = await fetch(`${API_BASE_URL}/api/customers/${id}`, {        
        method: 'PUT',        
        headers: {        
          'Authorization': `Bearer ${token}`,        
          'Content-Type': 'application/json'        
        },        
        body: JSON.stringify({ statut: status })        
      });        
              
      if (response.status === 401) {        
        authService.logout();        
        return { success: false, message: 'Session expirée' };        
      }        
              
      return response.json();        
    } catch (error) {        
      console.error('Erreur lors de la mise à jour du statut:', error);        
      return { success: false, message: 'Erreur de connexion' };        
    }        
  },  
  
  // Créer un client physique (utilise le nouveau router modulaire)  
  createPhysical: async (clientData) => {  
    try {  
      const token = authService.getToken();  
      const response = await fetch(`${API_BASE_URL}/api/customer/physical`, {  
        method: 'POST',  
        headers: {  
          'Authorization': `Bearer ${token}`,  
          'Content-Type': 'application/json'  
        },  
        body: JSON.stringify(clientData)  
      });  
  
      if (response.status === 401) {  
        authService.logout();  
        return { success: false, message: 'Session expirée' };  
      }  
  
      return response.json();  
    } catch (error) {  
      console.error('Erreur lors de la création du client physique:', error);  
      return { success: false, message: 'Erreur de connexion' };  
    }  
  },  
  
  // Créer un client moral (utilise le nouveau router modulaire)  
  createMoral: async (clientData) => {  
    try {  
      const token = authService.getToken();  
      const response = await fetch(`${API_BASE_URL}/api/customer/moral`, {  
        method: 'POST',  
        headers: {  
          'Authorization': `Bearer ${token}`,  
          'Content-Type': 'application/json'  
        },  
        body: JSON.stringify(clientData)  
      });  
  
      if (response.status === 401) {  
        authService.logout();  
        return { success: false, message: 'Session expirée' };  
      }  
  
      return response.json();  
    } catch (error) {  
      console.error('Erreur lors de la création du client moral:', error);  
      return { success: false, message: 'Erreur de connexion' };  
    }  
  }  
};        
      
// ✅ Fonctions de compatibilité corrigées (suppression des références aux régions)    
export const getClientById = async (clientId) => {      
  try {      
    const result = await clientService.getById(clientId);      
          
    if (!result.success || !result.data) {      
      throw new Error('Client non trouvé');      
    }      
          
    const customer = result.data;      
          
    return {      
      _id: customer._id,      
      customer_code: customer.customer_code,      
      type_client: customer.type_client,      
      ...(customer.physical_user_id && {      
        nom_complet: `${customer.physical_user_id.civilite} ${customer.physical_user_id.first_name} ${customer.physical_user_id.last_name}`,      
        telephone: customer.physical_user_id.telephone_principal,      
        email: customer.physical_user_id.user_id?.email      
      }),      
      ...(customer.moral_user_id && {      
        raison_sociale: customer.moral_user_id.raison_sociale,      
        telephone: customer.moral_user_id.telephone_principal,      
        email: customer.moral_user_id.user_id?.email      
      })      
    };      
  } catch (error) {      
    console.error('Erreur récupération client:', error);      
    throw error;      
  }      
};      
      
export const getClientAddresses = async (clientId) => {      
  try {      
    // ✅ Utiliser l'API du nouveau router modulaire  
    const response = await fetch(`${API_BASE_URL}/api/customer/${clientId}/addresses`, {    
      headers: {    
        'Authorization': `Bearer ${authService.getToken()}`,    
        'Content-Type': 'application/json'    
      }    
    });    
    
    if (response.status === 401) {    
      authService.logout();    
      return [];    
    }    
    
    if (!response.ok) {    
      console.error('Erreur API addresses:', response.status);    
      return [];    
    }    
    
    const result = await response.json();    
        
    if (!result.success || !result.data) {    
      return [];    
    }    
    
    const data = result.data;    
        
    // ✅ Adapter les adresses selon la nouvelle architecture (sans régions)    
    const addresses = data.addresses.map(addr => ({    
      _id: addr._id,    
      type_adresse: addr.type_adresse,    
      num_appt: addr.numappt || '',    
      num_immeuble: addr.numimmeuble || '',    
      rue: addr.street || '',    
      quartier: addr.quartier || '',    
      ville: addr.city?.name || 'Casablanca', // ✅ Casablanca par défaut    
      code_postal: addr.postal_code || '',    
      // ✅ SUPPRIMER region_id: plus de référence aux régions    
      telephone: addr.telephone || data.user.telephone || '',    
      instructions_livraison: addr.instructions_livraison || '',    
      latitude: addr.latitude,    
      longitude: addr.longitude,    
      is_principal: addr.is_principal    
    }));    
    
    return addresses;    
  } catch (error) {      
    console.error('Erreur récupération adresses client:', error);      
    return [];      
  }      
};      
      
export default clientService;