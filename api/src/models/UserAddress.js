const mongoose = require('mongoose');  
  
const UserAddressSchema = new mongoose.Schema({    
  physical_user_id: {     
    type: mongoose.Schema.Types.ObjectId,     
    ref: 'PhysicalUser',     
    required: false  
  },    
  moral_user_id: {     
    type: mongoose.Schema.Types.ObjectId,     
    ref: 'MoralUser',     
    required: false  
  },    
  address_id: {     
    type: mongoose.Schema.Types.ObjectId,     
    ref: 'Address',     
    required: true     
  },    
  is_principal: {     
    type: Boolean,     
    default: false     
  }    
}, {     
  timestamps: true     
});  
  
// Index pour améliorer les performances  
UserAddressSchema.index({ physical_user_id: 1 });  
UserAddressSchema.index({ moral_user_id: 1 }); 
UserAddressSchema.index({ address_id: 1 });  
UserAddressSchema.index({ physical_user_id: 1, is_principal: 1 });  
UserAddressSchema.index({ moral_user_id: 1, is_principal: 1 });   
  
// S'assurer qu'un utilisateur n'a qu'une seule adresse principale  
UserAddressSchema.pre('save', async function(next) {    
  if (this.is_principal) {    
    const query = this.physical_user_id     
      ? { physical_user_id: this.physical_user_id }    
      : { moral_user_id: this.moral_user_id };    
        
    await this.constructor.updateMany(    
      {     
        ...query,    
        _id: { $ne: this._id }     
      },    
      { $set: { is_principal: false } }    
    );    
  }    
  next();    
});  
  
// Validation : un UserAddress doit avoir soit physical_user_id soit moral_user_id    
UserAddressSchema.pre('save', function(next) {    
  if (!this.physical_user_id && !this.moral_user_id) {    
    return next(new Error('UserAddress doit avoir soit physical_user_id soit moral_user_id'));    
  }    
  if (this.physical_user_id && this.moral_user_id) {    
    return next(new Error('UserAddress ne peut pas avoir les deux types d\'utilisateur'));    
  }    
  next();    
});  
  
module.exports = mongoose.model('UserAddress', UserAddressSchema);