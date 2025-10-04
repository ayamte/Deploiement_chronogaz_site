const BLFRS = require('../models/BL_FRS');    
const DepotEntryLine = require('../models/DepotEntryLine');    
const Um = require('../models/Um'); // AJOUT: Import manquant pour résoudre l'erreur UM  
  
// Créer un nouveau bon de livraison    
exports.createBLFRS = async (req, res) => {    
  try {    
    const {    
      fournisseur_id,    
      bl_date,    
      bl_reference,    
      depot_id,    
      entry_date,    
      livreur_employee_id,    
      magasin_employee_id,    
      commentaires,    
      lignes 
    } = req.body;    
  
    // Parser les lignes si elles sont en format JSON string    
    let parsedLignes = lignes;    
    if (typeof lignes === 'string') {    
      try {    
        parsedLignes = JSON.parse(lignes);    
      } catch (parseError) {    
        return res.status(400).json({     
          success: false,     
          error: 'Format des lignes invalide'     
        });    
      }    
    }    
  
    // Créer le bon de livraison    
    const blFrs = new BLFRS({    
      fournisseur_id,    
      bl_date,    
      bl_reference,    
      depot_id,    
      entry_date,    
      livreur_employee_id,    
      magasin_employee_id,    
      commentaires    
    });    
  
    // Gérer l'attachment si présent    
    if (req.file) {    
      blFrs.attachment = req.file.buffer;    
    }    
  
    await blFrs.save();    
  
    // Créer les lignes de produits avec les lignes parsées    
    if (parsedLignes && parsedLignes.length > 0) {    
      const depotEntryLines = parsedLignes.map(ligne => ({    
        ...ligne,    
        bl_frs_id: blFrs._id    
      }));    
            
      await DepotEntryLine.insertMany(depotEntryLines);    
    }    
  
    res.status(201).json({ success: true, data: blFrs });    
  } catch (error) {    
    res.status(400).json({ success: false, error: error.message });    
  }    
};  
  
// Récupérer tous les bons de livraison    
exports.getAllBLFRS = async (req, res) => {    
  try {    
    const { statut, fournisseur_id, depot_id } = req.query;    
        
    let filter = {};    
    if (statut) filter.statut = statut;    
    if (fournisseur_id) filter.fournisseur_id = fournisseur_id;    
    if (depot_id) filter.depot_id = depot_id;    
  
    const blFrsList = await BLFRS.find(filter)    
      .populate('fournisseur_id', 'nom code')    
      .populate('depot_id', 'short_name reference')   
      .populate({  
        path: 'livreur_employee_id',  
        populate: {  
          path: 'physical_user_id',  
          select: 'first_name last_name'  
        }  
      })  
      .populate({  
        path: 'magasin_employee_id',   
        populate: {  
          path: 'physical_user_id',  
          select: 'first_name last_name'  
        }  
      })  
      .sort({ bl_date: -1 });    
  
    res.json({ success: true, data: blFrsList });    
  } catch (error) {    
    res.status(500).json({ success: false, error: error.message });    
  }    
};    
  
// Récupérer un bon de livraison avec ses lignes    
exports.getBLFRSById = async (req, res) => {    
  try {    
    const blFrs = await BLFRS.findById(req.params.id)  
      .populate('fournisseur_id')  
      .populate('depot_id')  
      .populate({  
        path: 'livreur_employee_id',  
        populate: {  
          path: 'physical_user_id',  
          select: 'first_name last_name' // Ajouter cette sélection  
        }  
      })  
      .populate({  
        path: 'magasin_employee_id',  
        populate: {  
          path: 'physical_user_id',  
          select: 'first_name last_name' // Ajouter cette sélection  
        }  
      }); 
        
    if (!blFrs) {    
      return res.status(404).json({ success: false, error: 'Bon de livraison non trouvé' });    
    }    
  
    // Récupérer les lignes associées avec population correcte  
    const lignes = await DepotEntryLine.find({ bl_frs_id: req.params.id })    
      .populate('product_id')    
      .populate('um_id'); // Maintenant que Um est importé, cela devrait fonctionner  
  
    res.json({ success: true, data: { ...blFrs.toObject(), lignes } });    
  } catch (error) {    
    res.status(500).json({ success: false, error: error.message });    
  }    
};    
  
// Valider un bon de livraison    
exports.validateBLFRS = async (req, res) => {    
  try {    
    const blFrs = await BLFRS.findByIdAndUpdate(    
      req.params.id,    
      { statut: 'VALIDE' },    
      { new: true }    
    );    
        
    if (!blFrs) {    
      return res.status(404).json({ success: false, error: 'Bon de livraison non trouvé' });    
    }    
        
    res.json({ success: true, data: blFrs });    
  } catch (error) {    
    res.status(500).json({ success: false, error: error.message });    
  }    
};    
  
// Supprimer un bon de livraison    
exports.deleteBLFRS = async (req, res) => {    
  try {       
    await DepotEntryLine.deleteMany({ bl_frs_id: req.params.id });    
           
    const blFrs = await BLFRS.findByIdAndDelete(req.params.id);    
        
    if (!blFrs) {    
      return res.status(404).json({ success: false, error: 'Bon de livraison non trouvé' });    
    }    
        
    res.json({ success: true, message: 'Bon de livraison supprimé avec succès' });    
  } catch (error) {    
    res.status(500).json({ success: false, error: error.message });    
  }    
};