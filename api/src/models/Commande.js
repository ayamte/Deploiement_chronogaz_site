const mongoose = require('mongoose');        
require('./Customer');    
require('./Address');    
        
const CommandeSchema = new mongoose.Schema({        
  customer_id: {     
    type: mongoose.Schema.Types.ObjectId,     
    ref: 'Customer',     
    required: true     
  },    
  address_id: {     
    type: mongoose.Schema.Types.ObjectId,     
    ref: 'Address',     
    required: true     
  },    
  date_commande: {     
    type: Date,     
    default: Date.now     
  },    
    
  statut: {       
    type: String,       
    enum: ['CONFIRMEE', 'ASSIGNEE', 'EN_COURS', 'LIVREE', 'ANNULEE', 'ECHOUEE'],       
    default: 'CONFIRMEE'       
  },    
    
  montant_total: {    
    type: Number,    
    required: true,    
    min: 0    
  },    
  numero_commande: {     
    type: String,     
    unique: true     
  },    
  date_souhaite: Date,    
  mode_paiement: {       
    type: String,       
    enum: ['ESPECES'],       
    default: 'ESPECES'       
  },    
  urgent: {     
    type: Boolean,     
    default: false     
  },    
  details: String,  
     
  raison_annulation: String,  
  raison_echec: String  
      
}, { timestamps: true });        
  
// Middleware pour synchroniser les états  
CommandeSchema.methods.updateFromPlanification = function(planificationEtat) {  
  switch(planificationEtat) {  
    case 'PLANIFIE':  
      this.statut = 'ASSIGNEE';  
      break;  
    case 'ANNULE':  
      this.statut = 'ANNULEE';  
      break;  
  }  
};  
  
CommandeSchema.methods.updateFromLivraison = function(livraisonEtat) {  
  switch(livraisonEtat) {  
    case 'EN_COURS':  
      this.statut = 'EN_COURS';  
      break;  
    case 'LIVRE':  
      this.statut = 'LIVREE';  
      break;  
    case 'ECHEC':  
      this.statut = 'ECHOUEE';  
      break;  
    case 'ANNULE':  
      this.statut = 'ANNULEE';  
      break;  
  }  
};  
  
// Générer automatiquement un numéro de commande  
CommandeSchema.pre('save', async function(next) {      
  if (!this.numero_commande) {      
    const count = await mongoose.model('Commande').countDocuments();      
    this.numero_commande = `CMD${String(count + 1).padStart(6, '0')}`;      
  }      
  next();      
});      
  
CommandeSchema.index({ customer_id: 1 });        
CommandeSchema.index({ date_commande: -1 });      
CommandeSchema.index({ address_id: 1 });    
CommandeSchema.index({ statut: 1 });           
        
module.exports = mongoose.model('Commande', CommandeSchema);