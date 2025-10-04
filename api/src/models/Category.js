const mongoose = require('mongoose');  
  
const CategorySchema = new mongoose.Schema({  
  code: { type: String, required: true, unique: true },  
  nom: { type: String, required: true },  
  description: String,  
  parent_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },  
  ordre_affichage: { type: Number, default: 0 },  
  actif: { type: Boolean, default: true },  
}, { timestamps: true });  
  
CategorySchema.index({ parent_id: 1 });  
  
module.exports = mongoose.model('Category', CategorySchema);