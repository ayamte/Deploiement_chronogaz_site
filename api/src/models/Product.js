const mongoose = require('mongoose');    
    
const ProductSchema = new mongoose.Schema({    
  ref: { type: String, required: true, unique: true },  
  long_name: { type: String, required: true },  
  short_name: { type: String, required: true },  
  gamme: { type: String },  
  brand: { type: String },  
  description: { type: String },  
  image: { type: Buffer },  
  actif: { type: Boolean, default: true },  
    
  // Relations intégrées  
  unites_mesure: [{  
    UM_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Um', required: true },  
    is_principal: { type: Boolean, default: false }  
  }]
}, {    
  timestamps: true    
});    
    
module.exports = mongoose.model('Product', ProductSchema);