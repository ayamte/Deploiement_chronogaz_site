const mongoose = require('mongoose');  
  
const StockLineSchema = new mongoose.Schema({  
  quantity: { type: Number, required: true, min: 0 },  
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },  
  um_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Um', required: true },  
  stock_depot_id: { type: mongoose.Schema.Types.ObjectId, ref: 'StockDepot', required: true }  
}, { timestamps: true });  
  
StockLineSchema.index({ stock_depot_id: 1, product_id: 1, um_id: 1 }, { unique: true });  
StockLineSchema.index({ product_id: 1 });  
  
module.exports = mongoose.model('StockLine', StockLineSchema);