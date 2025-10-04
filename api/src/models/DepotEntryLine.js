const mongoose = require('mongoose');  
  
const DepotEntryLineSchema = new mongoose.Schema({  
  quantity: { type: Number, required: true, min: 0 },  
  product_id: {   
    type: mongoose.Schema.Types.ObjectId,   
    ref: 'Product',   
    required: true   
  },  
  um_id: {   
    type: mongoose.Schema.Types.ObjectId,   
    ref: 'Um',   
    required: true   
  },  
  bl_frs_id: {   
    type: mongoose.Schema.Types.ObjectId,   
    ref: 'BLFRS',   
    required: true   
  },  
  prix_unitaire: Number,  
  total_ligne: Number,  
  lot_number: String,  
  date_expiration: Date,  
}, { timestamps: true });  
  
DepotEntryLineSchema.index({ bl_frs_id: 1 });  
DepotEntryLineSchema.index({ product_id: 1 });  
  
module.exports = mongoose.model('DepotEntryLine', DepotEntryLineSchema);