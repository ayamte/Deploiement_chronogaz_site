const express = require('express');  
const router = express.Router();  
const fournisseurController = require('../controllers/fournisseurController');  
  
// Routes CRUD pour les fournisseurs  
router.post('/', fournisseurController.createFournisseur);  
router.get('/', fournisseurController.getAllFournisseurs);  
router.get('/:id', fournisseurController.getFournisseurById);  
router.put('/:id', fournisseurController.updateFournisseur);  
router.delete('/:id', fournisseurController.deleteFournisseur);  
  
// Routes pour la gestion des adresses fournisseur  
router.post('/:fournisseur_id/adresses', fournisseurController.addAdresseFournisseur);  
router.get('/:fournisseur_id/adresses', fournisseurController.getAdressesFournisseur);  

router.put('/:fournisseur_id/adresses/:adresse_id', fournisseurController.updateAdresseFournisseur);  
router.delete('/:fournisseur_id/adresses/:adresse_id', fournisseurController.deleteAdresseFournisseur);
  
module.exports = router;