const mongoose = require('mongoose');    
    
const ListePrixSchema = new mongoose.Schema({      
  listeprix_id: { type: String, required: true, unique: true },  
  dtdebut: { type: Date, required: true },  
  dtfin: Date,  
  isactif: { type: Boolean, default: true },  
  nom: { type: String },  
  description: String,  
    
  prix: [{  
    product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },  
    UM_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Um', required: true },  
    prix: { type: Number, required: true }  
  }]  
}, { timestamps: true });  
    
ListePrixSchema.index({ dtdebut: 1, dtfin: 1 });    
ListePrixSchema.index({ isactif: 1 });  
    
module.exports = mongoose.model('ListePrix', ListePrixSchema);