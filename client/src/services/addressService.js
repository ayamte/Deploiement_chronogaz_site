import api from './api';    
    
class AddressService {    
  constructor(useMultipleAddresses = true) {    
    this.useMultipleAddresses = useMultipleAddresses;    
  }    
    
  /**    
   * Récupère les adresses d'un client selon le mode configuré    
   * @param {string} customerId - ID du client    
   * @returns {Promise<Object>} - Informations client et adresses    
   */    
  async getCustomerAddresses(customerId) {    
    if (this.useMultipleAddresses) {    
      return this.getMultipleAddresses(customerId);    
    } else {    
      return this.getSingleAddress(customerId);    
    }    
  }    
    
  /**    
   * Récupère l'adresse principale via API (mode simple)    
   * @param {string} customerId - ID du client    
   * @returns {Promise<Object>} - Adresse principale    
   */    
  async getSingleAddress(customerId) {    
    try {    
      // ✅ Utiliser le nouveau endpoint du router modulaire  
      const response = await api.get(`/customer/${customerId}/addresses`);    
          
      if (!response.data.success) {    
        throw new Error(response.data.message || 'Erreur lors de la récupération des adresses');    
      }    
    
      const data = response.data;    
          
      // Adapter la réponse pour le mode single    
      const mainAddress = data.addresses.find(addr => addr.is_principal) || data.addresses[0];    
          
      return {    
        success: true,    
        customer_code: data.customer_code,    
        user: {    
          type: data.user.type,    
          nom_complet: data.user.nom_complet || data.user.raison_sociale,    
          telephone: data.user.telephone    
          // ✅ SUPPRIMER city et region car plus dans les modèles utilisateur    
        },    
        addresses: mainAddress ? [mainAddress] : [],    
        mode: 'single'    
      };    
    
    } catch (error) {    
      console.error('Erreur getSingleAddress:', error);    
      return {    
        success: false,    
        message: error.message,    
        addresses: []    
      };    
    }    
  }    
    
  /**    
   * Récupère toutes les adresses d'un client (mode multiple)    
   * @param {string} customerId - ID du client    
   * @returns {Promise<Object>} - Toutes les adresses du client    
   */    
  async getMultipleAddresses(customerId) {    
    try {    
      // ✅ Utiliser le nouveau endpoint du router modulaire  
      const response = await api.get(`/customer/${customerId}/addresses`);    
          
      if (!response.data.success) {    
        throw new Error(response.data.message || 'Erreur lors de la récupération des adresses');    
      }    
    
      const data = response.data;    
          
      // Adapter les adresses pour supprimer les références aux régions    
      const adaptedAddresses = data.addresses.map(addr => ({    
        _id: addr._id,    
        type_adresse: addr.type_adresse,    
        address: addr.address || `${addr.numappt || ''} ${addr.numimmeuble || ''} ${addr.street || ''}`.trim(),    
        city: addr.city?.name || 'Casablanca', // ✅ Casablanca par défaut    
        postal_code: addr.postal_code || '',    
        // ✅ SUPPRIMER region: addr.region?.nom    
        telephone: addr.telephone || data.user.telephone,    
        latitude: addr.latitude,    
        longitude: addr.longitude,    
        is_principal: addr.is_principal    
      }));    
    
      return {    
        success: true,    
        customer_code: data.customer_code,    
        user: {    
          type: data.user.type,    
          nom_complet: data.user.nom_complet || data.user.raison_sociale,    
          telephone: data.user.telephone    
          // ✅ SUPPRIMER city et region    
        },    
        addresses: adaptedAddresses,    
        mode: 'multiple'    
      };    
    
    } catch (error) {    
      console.error('Erreur getMultipleAddresses:', error);    
      return {    
        success: false,    
        message: error.message,    
        addresses: []    
      };    
    }    
  }    
  
  /**  
   * Créer une nouvelle adresse pour un client  
   * @param {string} customerId - ID du client  
   * @param {Object} addressData - Données de l'adresse  
   * @returns {Promise<Object>} - Résultat de la création  
   */  
  async createAddressForCustomer(customerId, addressData) {  
    try {  
      const response = await api.post(`/addresses/customer/${customerId}`, addressData);  
        
      if (!response.data.success) {  
        throw new Error(response.data.message || 'Erreur lors de la création de l\'adresse');  
      }  
  
      return response.data;  
    } catch (error) {  
      console.error('Erreur createAddressForCustomer:', error);  
      return {  
        success: false,  
        message: error.message  
      };  
    }  
  }  
  
  /**  
   * Mettre à jour une adresse existante  
   * @param {string} addressId - ID de l'adresse  
   * @param {Object} addressData - Nouvelles données de l'adresse  
   * @returns {Promise<Object>} - Résultat de la mise à jour  
   */  
  async updateAddress(addressId, addressData) {  
    try {  
      const response = await api.put(`/addresses/${addressId}`, addressData);  
        
      if (!response.data.success) {  
        throw new Error(response.data.message || 'Erreur lors de la mise à jour de l\'adresse');  
      }  
  
      return response.data;  
    } catch (error) {  
      console.error('Erreur updateAddress:', error);  
      return {  
        success: false,  
        message: error.message  
      };  
    }  
  }  
  
  /**  
   * Supprimer une adresse  
   * @param {string} addressId - ID de l'adresse  
   * @returns {Promise<Object>} - Résultat de la suppression  
   */  
  async deleteAddress(addressId) {  
    try {  
      const response = await api.delete(`/addresses/${addressId}`);  
        
      if (!response.data.success) {  
        throw new Error(response.data.message || 'Erreur lors de la suppression de l\'adresse');  
      }  
  
      return response.data;  
    } catch (error) {  
      console.error('Erreur deleteAddress:', error);  
      return {  
        success: false,  
        message: error.message  
      };  
    }  
  }  
    
  /**    
   * Formate une adresse pour la commande    
   * @param {Object} addressData - Données d'adresse    
   * @returns {Object} - Adresse formatée pour la commande    
   */    
  formatAddressForOrder(addressData) {    
    return {    
      address: addressData.address || addressData.fullAddress || '',    
      city: addressData.city || 'Casablanca', // ✅ Casablanca par défaut    
      latitude: addressData.latitude || null,    
      longitude: addressData.longitude || null,    
      saved_address_id: addressData._id || null    
    };    
  }    
    
  /**    
   * Active ou désactive le mode adresses multiples    
   * @param {boolean} enabled - Activer le mode multiple    
   */    
  setMultipleAddressesMode(enabled) {    
    this.useMultipleAddresses = enabled;    
  }    
}    
    
// Export d'une instance singleton avec mode multiple activé par défaut    
const addressService = new AddressService(true);    
    
export { AddressService, addressService };    
export default addressService;