const mongoose = require('mongoose');  
  
const LivraisonLineSchema = new mongoose.Schema({  
  // Référence à la livraison  
  livraison_id: {   
    type: mongoose.Schema.Types.ObjectId,   
    ref: 'Livraison',   
    required: true   
  },  
    
  // Quantité réellement livrée  
  quantity: {  
    type: Number,  
    required: true,  
    min: 0  
  },  
    
  // Prix unitaire au moment de la livraison  
  price: {  
    type: Number,  
    required: true,  
    min: 0  
  },  
    
  // Référence au produit  
  product_id: {   
    type: mongoose.Schema.Types.ObjectId,   
    ref: 'Product',   
    required: true   
  },  
    
  // Unité de mesure  
  UM_id: {   
    type: mongoose.Schema.Types.ObjectId,   
    ref: 'Um',   
    required: true   
  },  
    
  // Montant total de la ligne  
  total_ligne: {  
    type: Number,  
    min: 0  
  },  
    
  // Informations supplémentaires  
  notes: String,  
    
  // État de cette ligne spécifique  
  etat_ligne: {  
    type: String,  
    enum: ['LIVRE', 'NON_LIVRE', 'PARTIELLE'],  
    default: 'LIVRE'  
  }  
    
}, { timestamps: true });  
  
// Calculer automatiquement le total de ligne  
LivraisonLineSchema.pre('save', function(next) {  
  this.total_ligne = this.quantity * this.price;  
  next();  
});  
  
// Index pour optimiser les requêtes  
LivraisonLineSchema.index({ livraison_id: 1 });  
LivraisonLineSchema.index({ product_id: 1 });  
  
module.exports = mongoose.model('LivraisonLine', LivraisonLineSchema);