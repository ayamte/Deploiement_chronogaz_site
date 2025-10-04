const mongoose = require('mongoose');  
  
const TruckSchema = new mongoose.Schema({  
  // Champs de base selon vos spécifications  
  brand: {   
    type: String,   
    required: true,  
    maxlength: 255   
  },  
  description: {   
    type: String,  
    maxlength: 255   
  },  
  fuel: {  
    type: String,  
    enum: ['ESSENCE', 'DIESEL', 'ELECTRIQUE', 'HYBRIDE'],  
    required: true,  
    maxlength: 255  
  },  
  image: {   
    type: Buffer  // Pour LONGBLOB  
  },  
  matricule: {   
    type: String,   
    required: true,   
    unique: true,  
    maxlength: 255  
  },  
  modele: {   
    type: String,   
    maxlength: 45   
  },  
  anneecontruction: {   
    type: Number  // INT  
  },  
  puissancefiscale: {   
    type: Number  // INT  
  },  
  gps: {   
    type: String,  
    maxlength: 255  
  },  
  capacite: {   
    type: String,   
    maxlength: 45   
  },  
    
  // Relations avec les employés  
  driver: {   
    type: mongoose.Schema.Types.ObjectId,   
    ref: 'Employe',  
    validate: {  
      validator: async function(employeId) {  
        if (!employeId) return true; 
        const employe = await mongoose.model('Employe').findById(employeId);  
        return employe && employe.fonction === 'CHAUFFEUR';  
      },  
      message: 'Le driver doit être un employé avec la fonction CHAUFFEUR'  
    }  
  },  
  accompagnant: {   
    type: mongoose.Schema.Types.ObjectId,   
    ref: 'Employe',  
    validate: {  
      validator: async function(employeId) {  
        if (!employeId) return true;  
        const employe = await mongoose.model('Employe').findById(employeId);  
        return employe && employe.fonction === 'ACCOMPAGNANT';  
      },  
      message: 'L\'accompagnant doit être un employé avec la fonction ACCOMPAGNANT'  
    }  
  },  
    
  // Statut du camion  
  status: {  
    type: String,  
    enum: ['Disponible', 'En maintenance', 'En mission', 'Hors service'],  
    default: 'Disponible'  
  }  
}, {   
  timestamps: true   
});  
  
// Index pour optimiser les recherches  
TruckSchema.index({ matricule: 1 }, { unique: true });  
TruckSchema.index({ brand: 1 });  
TruckSchema.index({ status: 1 });  
TruckSchema.index({ driver: 1 });  
TruckSchema.index({ accompagnant: 1 });  
  
module.exports = mongoose.model('Truck', TruckSchema);