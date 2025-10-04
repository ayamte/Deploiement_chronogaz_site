const mongoose = require('mongoose');  
  
const AddressSchema = new mongoose.Schema({        
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },        
  street: { type: String, required: true },  
  numappt: String,  
  numimmeuble: String,  
  quartier: String,  
  postal_code: String,  
  city_id: { type: mongoose.Schema.Types.ObjectId, ref: 'City', required: true },        
  latitude: Number,        
  longitude: Number,       
  telephone: String,  
  instructions_livraison: String,  
  type_adresse: {         
    type: String,         
    enum: ['DOMICILE', 'TRAVAIL', 'LIVRAISON', 'FACTURATION', 'SIÈGE SOCIAL'],         
    default: 'LIVRAISON'         
  },      
  is_principal: { type: Boolean, default: false },      
  actif: { type: Boolean, default: true }        
}, { timestamps: true });  
  
AddressSchema.index({ user_id: 1 });  
AddressSchema.index({ city_id: 1 });  
AddressSchema.index({ is_principal: 1 });  
  
module.exports = mongoose.model('Address', AddressSchema);
