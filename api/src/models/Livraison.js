const mongoose = require('mongoose');    
    
const LivraisonSchema = new mongoose.Schema({    
  // Référence à la planification    
  planification_id: {     
    type: mongoose.Schema.Types.ObjectId,     
    ref: 'Planification',     
    required: true     
  },    
      
  // Date réelle de livraison    
  date: {     
    type: Date,     
    required: true,    
    default: Date.now    
  },    
      
  // Références aux employés et camion    
  livreur_employee_id: {     
    type: mongoose.Schema.Types.ObjectId,     
    ref: 'Employe',     
    required: true     
  },    
  trucks_id: {     
    type: mongoose.Schema.Types.ObjectId,     
    ref: 'Truck',     
    required: true     
  },    
      
  etat: {    
    type: String,    
    enum: ['EN_COURS', 'LIVRE', 'ANNULE', 'ECHEC'],    
    default: 'EN_COURS'    
  },    
      
  // Adresse de livraison    
  adress: {    
    street: String,    
    city: String,    
    postal_code: String,    
    quartier: String,    
    instructions: String    
  },    
      
  // Coordonnées GPS    
  longitude: {    
    type: Number,    
    min: -180,    
    max: 180    
  },    
  latitude: {    
    type: Number,    
    min: -90,    
    max: 90    
  },    
      
  // Montants financiers    
  total: {    
    type: Number,    
    min: 0    
  },    
  total_ttc: {    
    type: Number,    
    min: 0    
  },    
  total_tva: {    
    type: Number,    
    min: 0,    
    default: 0    
  },    
      
  // Informations supplémentaires    
  details: String,    
      
  // Champs pour le suivi    
  signature_client: Buffer,    
  photo_livraison: String,    
  commentaires_livreur: String,    
  commentaires_client: String,    
  evaluation_client: {    
    type: Number,    
    min: 1,    
    max: 5    
  }    
      
}, { timestamps: true });    
  
//  Middleware pour synchroniser avec la commande lors des changements d'état  
LivraisonSchema.post('save', async function() {  
  try {  
    const Planification = require('./Planification');  
    const Commande = require('./Commande');  
      
    // Récupérer la planification associée  
    const planification = await Planification.findById(this.planification_id);  
    if (!planification) {  
      console.error('❌ Planification non trouvée pour la livraison:', this._id);  
      return;  
    }  
      
    // Récupérer et mettre à jour la commande  
    const commande = await Commande.findById(planification.commande_id);  
    if (commande) {  
      const oldStatut = commande.statut;  
      commande.updateFromLivraison(this.etat);  
        
      if (oldStatut !== commande.statut) {  
        await commande.save();  
        console.log(`✅ Commande ${commande.numero_commande} synchronisée: ${this.etat} → ${commande.statut}`);  
      }  
    }  
  } catch (error) {  
    console.error('❌ Erreur synchronisation livraison → commande:', error);  
  }  
});  
  
// Middleware pour synchroniser lors des mises à jour  
LivraisonSchema.post('findOneAndUpdate', async function(doc) {  
  if (doc) {  
    try {  
      const Planification = require('./Planification');  
      const Commande = require('./Commande');  
        
      const planification = await Planification.findById(doc.planification_id);  
      if (planification) {  
        const commande = await Commande.findById(planification.commande_id);  
        if (commande) {  
          const oldStatut = commande.statut;  
          commande.updateFromLivraison(doc.etat);  
            
          if (oldStatut !== commande.statut) {  
            await commande.save();  
            console.log(`✅ Commande ${commande.numero_commande} synchronisée (update): ${doc.etat} → ${commande.statut}`);  
          }  
        }  
      }  
    } catch (error) {  
      console.error('❌ Erreur synchronisation livraison update → commande:', error);  
    }  
  }  
});  
    
// Index pour optimiser les requêtes    
LivraisonSchema.index({ planification_id: 1 });    
LivraisonSchema.index({ date: -1 });    
LivraisonSchema.index({ etat: 1 });    
LivraisonSchema.index({ livreur_employee_id: 1 });    
    
module.exports = mongoose.model('Livraison', LivraisonSchema);