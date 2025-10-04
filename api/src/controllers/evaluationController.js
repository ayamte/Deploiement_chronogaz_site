const Evaluation = require('../models/Evaluation');  
const Livraison = require('../models/Livraison');  
  
const evaluationController = {  
  // Créer une nouvelle évaluation  
  async createEvaluation(req, res) {  
    try {  
      const { livraison_id, rapidite, professionalisme, securite, facilite, commentaire } = req.body;  
      const client_id = req.user.id;  
  
      // Vérifier que la livraison existe et est livrée  
      const livraison = await Livraison.findById(livraison_id);  
      if (!livraison || livraison.etat !== 'LIVRE') {  
        return res.status(400).json({  
          success: false,  
          message: 'Livraison non trouvée ou non livrée'  
        });  
      }  
  
      // Vérifier qu'une évaluation n'existe pas déjà  
      const existingEvaluation = await Evaluation.findOne({ livraison_id });  
      if (existingEvaluation) {  
        return res.status(400).json({  
          success: false,  
          message: 'Une évaluation existe déjà pour cette livraison'  
        });  
      }  
  
      const evaluation = new Evaluation({  
        livraison_id,  
        client_id,  
        rapidite,  
        professionalisme,  
        securite,  
        facilite,  
        commentaire,  
        statut: 'SOUMISE'  
      });  
  
      await evaluation.save();  
  
      res.status(201).json({  
        success: true,  
        message: 'Évaluation créée avec succès',  
        data: evaluation  
      });  
    } catch (error) {  
      res.status(500).json({  
        success: false,  
        message: 'Erreur lors de la création de l\'évaluation',  
        error: error.message  
      });  
    }  
  },  
  
  // Récupérer une évaluation par ID de livraison  
  async getEvaluationByLivraison(req, res) {  
    try {  
      const { livraisonId } = req.params;  
        
      const evaluation = await Evaluation.findOne({ livraison_id: livraisonId })  
        .populate('livraison_id')  
        .populate('client_id', 'nom prenom email');  
  
      if (!evaluation) {  
        return res.status(404).json({  
          success: false,  
          message: 'Évaluation non trouvée'  
        });  
      }  
  
      res.json({  
        success: true,  
        data: evaluation  
      });  
    } catch (error) {  
      res.status(500).json({  
        success: false,  
        message: 'Erreur lors de la récupération de l\'évaluation',  
        error: error.message  
      });  
    }  
  },  
  
  // Récupérer toutes les évaluations d'un client  
  async getClientEvaluations(req, res) {  
    try {  
      const client_id = req.user.id;  
        
      const evaluations = await Evaluation.find({ client_id })  
        .populate('livraison_id')  
        .sort({ createdAt: -1 });  
  
      res.json({  
        success: true,  
        data: evaluations  
      });  
    } catch (error) {  
      res.status(500).json({  
        success: false,  
        message: 'Erreur lors de la récupération des évaluations',  
        error: error.message  
      });  
    }  
  }  
};  
  
module.exports = evaluationController;