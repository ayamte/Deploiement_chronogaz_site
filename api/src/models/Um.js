const mongoose = require('mongoose');  
  
const UmSchema = new mongoose.Schema({  
  unitemesure: { type: String, required: true, maxlength: 45 }  
}, { timestamps: true });  
  
module.exports = mongoose.model('Um', UmSchema);