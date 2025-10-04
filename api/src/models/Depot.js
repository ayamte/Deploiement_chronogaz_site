const mongoose = require('mongoose');    
  
const DepotSchema = new mongoose.Schema({    
  reference: { type: String, required: true, unique: true },    
  short_name: { type: String, required: true },    
  long_name: { type: String, required: true },    
  description: String,    
  surface_area: Number,    
  address: { type: String },   
  actif: { type: Boolean, default: true },    
}, { timestamps: true });    
   
  
module.exports = mongoose.model('Depot', DepotSchema);