const mongoose = require('mongoose');      
      
const MoralUserSchema = new mongoose.Schema({      
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },      
  raison_sociale: { type: String, required: true },      
  ice: { type: String, unique: true, sparse: true },      
  patente: String,      
  rc: String,      
  ville_rc: String,      
  telephone_principal: String,         
}, { timestamps: true });      
          
MoralUserSchema.index({ raison_sociale: 1 });      
      
module.exports = mongoose.model('MoralUser', MoralUserSchema);