const mongoose = require('mongoose');          
require('../models/Commande');        
require('../models/Truck');        
require('../models/Employe');        
          
const PlanificationSchema = new mongoose.Schema({     
  commande_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Commande', required: true },        
  delivery_date: { type: Date, required: true },        
  livreur_employee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Employe', required: false },     
  trucks_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Truck', required: true },        
      
     
  etat: {         
    type: String,         
    enum: ['PLANIFIE', 'ANNULE'],         
    default: 'PLANIFIE'         
  },       
      
  orderdelivery: { type: Number, default: 1 },     
  priority: {        
    type: String,        
    enum: ['low', 'medium', 'high', 'urgent'],        
    default: 'medium'        
  },      
  accompagnateur_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Employe' },        
  commentaires: String,    
       
  raison_annulation: String    
        
}, { timestamps: true });          
  
// Middleware pour synchroniser avec la commande avec gestion d'erreurs  
PlanificationSchema.post('save', async function() {  
  try {  
    const Commande = require('./Commande');  
    const commande = await Commande.findById(this.commande_id);  
      
    if (!commande) {  
      console.error('❌ Commande non trouvée pour la planification:', this._id);  
      return;  
    }  
      
    const oldStatut = commande.statut;  
    commande.updateFromPlanification(this.etat);  
      
    // Sauvegarder seulement si le statut a changé  
    if (oldStatut !== commande.statut) {  
      await commande.save();  
      console.log(`✅ Commande ${commande.numero_commande} synchronisée: ${this.etat} → ${commande.statut}`);  
    }  
  } catch (error) {  
    console.error('❌ Erreur synchronisation planification → commande:', error);  
   
  }  
});  
  
//  Middleware pour les mises à jour  
PlanificationSchema.post('findOneAndUpdate', async function(doc) {  
  if (doc) {  
    try {  
      const Commande = require('./Commande');  
      const commande = await Commande.findById(doc.commande_id);  
        
      if (commande) {  
        const oldStatut = commande.statut;  
        commande.updateFromPlanification(doc.etat);  
          
        if (oldStatut !== commande.statut) {  
          await commande.save();  
          console.log(`✅ Commande ${commande.numero_commande} synchronisée (update): ${doc.etat} → ${commande.statut}`);  
        }  
      }  
    } catch (error) {  
      console.error('❌ Erreur synchronisation planification update → commande:', error);  
    }  
  }  
});  
    
PlanificationSchema.index({ commande_id: 1 });          
PlanificationSchema.index({ trucks_id: 1 });          
PlanificationSchema.index({ delivery_date: 1 });        
PlanificationSchema.index({ livreur_employee_id: 1 });        
PlanificationSchema.index({ etat: 1 });        
PlanificationSchema.index({ priority: 1 });     
          
module.exports = mongoose.model('Planification', PlanificationSchema);