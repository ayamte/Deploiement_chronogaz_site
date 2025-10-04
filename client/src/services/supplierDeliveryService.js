import fournisseurService from './fournisseurService';  
import blFrsService from './blFrsService';  
import depotEntryLineService from './depotEntryLineService';  
  
class SupplierDeliveryService {  
  // Créer un bon de livraison complet avec ses lignes  
  async createCompleteDelivery(deliveryData) {  
    try {  
      const { fournisseur_id, depot_id, bl_date, bl_reference, entry_date,   
              livreur_employee_id, magasin_employee_id, commentaires,   
              lignes, attachmentFile } = deliveryData;  
  
      // Créer le bon de livraison avec les lignes  
      const blFrsData = {  
        fournisseur_id,  
        depot_id,  
        bl_date,  
        bl_reference,  
        entry_date,  
        livreur_employee_id,  
        magasin_employee_id,  
        commentaires,  
        lignes  
      };  
  
      const result = await blFrsService.createBLFRS(blFrsData, attachmentFile);  
      return result;  
    } catch (error) {  
      throw error;  
    }  
  }  
  
  // Récupérer les données nécessaires pour le formulaire  
  async getFormData() {  
    try {  
      const [fournisseurs] = await Promise.all([  
        fournisseurService.getAllFournisseurs()  
      ]);  
  
      return {  
        fournisseurs: fournisseurs.success ? fournisseurs.data : [],  
      };  
    } catch (error) {  
      throw error;  
    }  
  }  
  
  // Récupérer un bon de livraison complet pour l'admin  
  async getCompleteDelivery(id) {  
    try {  
      const result = await blFrsService.getBLFRSById(id);  
      return result;  
    } catch (error) {  
      throw error;  
    }  
  }  
}  
  
export default new SupplierDeliveryService();