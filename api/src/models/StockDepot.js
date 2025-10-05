const mongoose = require('mongoose');  
  
const StockDepotSchema = new mongoose.Schema({  
  stock_date: { type: Date, default: Date.now },  
  description: { type: String, maxlength: 45 }, 
  depot_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Depot', required: true },  
  archive: { type: Boolean, default: false }  
}, { timestamps: true });  
  
   
StockDepotSchema.index({ stock_date: -1 });    
StockDepotSchema.index({ archive: 1 });    
StockDepotSchema.index(    
  { depot_id: 1 },     
  { unique: true, partialFilterExpression: { archive: false } }    
);
  
module.exports = mongoose.model('StockDepot', StockDepotSchema);