const mongoose = require('mongoose');    
    
const EmployeSchema = new mongoose.Schema({          
  physical_user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'PhysicalUser', required: true, unique: true },          
  matricule: { type: String, required: true, unique: true },          
  cin: { type: String, required: true, unique: true },    
  cnss: { type: String, required: true },         
  fonction: { type: String, enum: ['CHAUFFEUR', 'ACCOMPAGNANT', 'MAGASINIER'], required: true },          
  date_embauche: { type: Date, required: true },          
  date_sortie: Date,          
  salaire_base: Number,           
  statut: { type: String, enum: ['ACTIF', 'INACTIF', 'SUSPENDU', 'EN_CONGE'], default: 'ACTIF' },  
  depot_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Depot' }  
}, { timestamps: true });
        
EmployeSchema.index({ fonction: 1 });    
    
module.exports = mongoose.model('Employe', EmployeSchema);