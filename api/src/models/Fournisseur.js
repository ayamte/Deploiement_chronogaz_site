const mongoose = require('mongoose');  
  
const FournisseurSchema = new mongoose.Schema({  
  code: { type: String, required: true, unique: true },  
  nom: { type: String, required: true },  
  ice: { type: String, unique: true, sparse: true },  
  rc: String,  
  ville_rc: String,  
  email: String,   
  actif: { type: Boolean, default: true },  
}, { timestamps: true });  
   
  
module.exports = mongoose.model('Fournisseur', FournisseurSchema);