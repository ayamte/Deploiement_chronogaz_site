const mongoose = require('mongoose');   
require('./Product');  
require('./Um');  
    
const CommandeLineSchema = new mongoose.Schema({    
  commande_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Commande', required: true },    
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },    
  UM_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Um', required: true },  
  quantity: { type: Number, required: true },  
  price: { type: Number, required: true }, 
}, { timestamps: true });    
    
CommandeLineSchema.index({ commande_id: 1 });    
CommandeLineSchema.index({ product_id: 1 });    
    
module.exports = mongoose.model('CommandeLine', CommandeLineSchema);