const mongoose = require('mongoose');  
  
const BLFRSSchema = new mongoose.Schema({  
  fournisseur_id: {   
    type: mongoose.Schema.Types.ObjectId,   
    ref: 'Fournisseur',   
    required: true   
  },  
  bl_date: { type: Date, required: true },  
  bl_reference: { type: String, required: true, unique: true },  
  attachment: Buffer, // Pour stocker les fichiers PDF/images  
  depot_id: {   
    type: mongoose.Schema.Types.ObjectId,   
    ref: 'Depot',   
    required: true   
  },  
  entry_date: { type: Date, required: true },  
  livreur_employee_id: {   
    type: mongoose.Schema.Types.ObjectId,   
    ref: 'Employe',   
    required: false    
  },  
  magasin_employee_id: {   
    type: mongoose.Schema.Types.ObjectId,   
    ref: 'Employe',   
    required: false    
  },  
  statut: {   
    type: String,   
    enum: ['EN_ATTENTE', 'VALIDE', 'ARCHIVE'],   
    default: 'EN_ATTENTE'   
  },  
  commentaires: String,  
}, { timestamps: true });  
  
BLFRSSchema.index({ fournisseur_id: 1 });  
BLFRSSchema.index({ depot_id: 1 });  
BLFRSSchema.index({ bl_date: -1 });  
  
module.exports = mongoose.model('BLFRS', BLFRSSchema);