const mongoose = require('mongoose');    
    
const CustomerSchema = new mongoose.Schema({    
  customer_code: { type: String, required: true, unique: true },    
  type_client: { type: String, enum: ['PHYSIQUE', 'MORAL'], required: true },    
  physical_user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'PhysicalUser' },    
  moral_user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'MoralUser' },    
  date_inscription: { type: Date, default: Date.now },    
  statut: { type: String, enum: ['ACTIF', 'INACTIF', 'SUSPENDU', 'EN_ATTENTE'], default: 'ACTIF' },  
  credit_limite: { type: Number, default: 0 },    
  credit_utilise: { type: Number, default: 0 }  
}, { timestamps: true });    
    
CustomerSchema.index({ type_client: 1, statut: 1 });    
CustomerSchema.index({ physical_user_id: 1 });    
CustomerSchema.index({ moral_user_id: 1 });    
    
module.exports = mongoose.model('Customer', CustomerSchema);