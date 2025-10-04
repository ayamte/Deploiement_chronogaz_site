const mongoose = require('mongoose');  
  
const AdminSchema = new mongoose.Schema({  
  physical_user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'PhysicalUser', required: true, unique: true },  
  niveau_acces: { type: Number, default: 5 },  
  permissions_speciales: [String],  
  actif: { type: Boolean, default: true },  
}, { timestamps: true });  
  
AdminSchema.index({ niveau_acces: 1 });  
  
module.exports = mongoose.model('Admin', AdminSchema);