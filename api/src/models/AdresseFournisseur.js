const mongoose = require('mongoose');  
  
const AdresseFournisseurSchema = new mongoose.Schema({  
  fournisseur_id: {   
    type: mongoose.Schema.Types.ObjectId,   
    ref: 'Fournisseur',   
    required: true   
  },  
  adresse: { type: String, required: true },  
  ville_id: {   
    type: mongoose.Schema.Types.ObjectId,   
    ref: 'City',   
    required: true   
  },  
  code_postal: { type: String },  
  type_adresse: {  
    type: String,  
    enum: ['SIÈGE SOCIAL', 'ENTREPÔT', 'BUREAU', 'AUTRE'],  
    default: 'SIÈGE SOCIAL'  
  },  
  is_principal: { type: Boolean, default: false },  
  actif: { type: Boolean, default: true }  
}, { timestamps: true });  
  
AdresseFournisseurSchema.index({ fournisseur_id: 1 });  
AdresseFournisseurSchema.index({ ville_id: 1 });  
  
module.exports = mongoose.model('AdresseFournisseur', AdresseFournisseurSchema);