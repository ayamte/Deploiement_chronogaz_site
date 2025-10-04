const mongoose = require('mongoose');  
  
const EvaluationSchema = new mongoose.Schema({  
  // Référence à la livraison  
  livraison_id: {  
    type: mongoose.Schema.Types.ObjectId,  
    ref: 'Livraison',  
    required: true,  
    unique: true 
  },  
    
  // Référence au client  
  client_id: {  
    type: mongoose.Schema.Types.ObjectId,  
    ref: 'User',  
    required: true  
  },  
    
  // Critères d'évaluation (1-5 étoiles)  
  rapidite: {  
    type: Number,  
    required: true,  
    min: 1,  
    max: 5  
  },  
  professionalisme: {  
    type: Number,  
    required: true,  
    min: 1,  
    max: 5  
  },  
  securite: {  
    type: Number,  
    required: true,  
    min: 1,  
    max: 5  
  },  
  facilite: {  
    type: Number,  
    required: true,  
    min: 1,  
    max: 5  
  },  
    
  // Note moyenne calculée  
  note_moyenne: {  
    type: Number,  
    min: 1,  
    max: 5  
  },  
    
  // Commentaire optionnel  
  commentaire: {  
    type: String,  
    maxlength: 500  
  },  
    
  // Statut de l'évaluation  
  statut: {  
    type: String,  
    enum: ['EN_ATTENTE', 'SOUMISE'],  
    default: 'EN_ATTENTE'  
  }  
}, { timestamps: true });  
  
// Middleware pour calculer la note moyenne avant sauvegarde  
EvaluationSchema.pre('save', function(next) {  
  this.note_moyenne = ((this.rapidite + this.professionalisme + this.securite + this.facilite) / 4);  
  next();  
});  
  
module.exports = mongoose.model('Evaluation', EvaluationSchema);