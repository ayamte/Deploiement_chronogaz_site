const mongoose = require('mongoose');    
    
const PhysicalUserSchema = new mongoose.Schema({        
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },        
  first_name: { type: String, required: true },        
  last_name: { type: String, required: true },        
  civilite: { type: String, enum: ['M', 'Mme', 'Mlle'], required: true }, 
  telephone_principal: String,     
  moral_user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'MoralUser' },  
}, { timestamps: true });
       
PhysicalUserSchema.index({ last_name: 1, first_name: 1 });    
    
module.exports = mongoose.model('PhysicalUser', PhysicalUserSchema);