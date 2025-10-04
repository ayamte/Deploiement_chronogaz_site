const mongoose = require('mongoose');  
  
const UserSchema = new mongoose.Schema({  
  email: { type: String, required: true, unique: true },  
  password_hash: { type: String, required: true },  
  role_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Role', required: true },  
  statut: { type: String, enum: ['ACTIF', 'INACTIF', 'SUSPENDU', 'EN_ATTENTE'], default: 'EN_ATTENTE' },  
  created_by_admin: { type: Boolean, default: false },   
  password_temporary: { type: Boolean, default: false },  
  first_login: { type: Boolean, default: false }, 
  last_login: Date,  
  email_verified: { type: Boolean, default: false },  
  reset_token: String,  
  reset_token_expires: Date,   
  verification_code: String,  
  verification_code_expires: Date  
}, { timestamps: true });
   
UserSchema.index({ role_id: 1 });  
UserSchema.index({ statut: 1 });  
  
module.exports = mongoose.model('User', UserSchema);