const mongoose = require('mongoose');  
  
const PhoneNumberSchema = new mongoose.Schema({  
  numero: { type: String, required: true },  
  type: { type: String, enum: ['MOBILE', 'FIXE', 'FAX'], required: true },  
  actif: { type: Boolean, default: true },  
}, { timestamps: true });  
  
PhoneNumberSchema.index({ numero: 1 });  
PhoneNumberSchema.index({ type: 1 });  
  
module.exports = mongoose.model('PhoneNumber', PhoneNumberSchema);