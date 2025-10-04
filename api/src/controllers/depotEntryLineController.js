const DepotEntryLine = require('../models/DepotEntryLine');  
  
// Ajouter une ligne à un bon de livraison  
exports.addDepotEntryLine = async (req, res) => {  
  try {  
    const depotEntryLine = new DepotEntryLine(req.body);  
    await depotEntryLine.save();  
      
    const populatedLine = await DepotEntryLine.findById(depotEntryLine._id)  
      .populate('product_id')  
      .populate('um_id');  
      
    res.status(201).json({ success: true, data: populatedLine });  
  } catch (error) {  
    res.status(400).json({ success: false, error: error.message });  
  }  
};  
  
// Récupérer les lignes d'un bon de livraison  
exports.getDepotEntryLinesByBL = async (req, res) => {  
  try {  
    const lignes = await DepotEntryLine.find({ bl_frs_id: req.params.blFrsId })  
      .populate('product_id')  
      .populate('um_id');  
      
    res.json({ success: true, data: lignes });  
  } catch (error) {  
    res.status(500).json({ success: false, error: error.message });  
  }  
};  
  
// Modifier une ligne  
exports.updateDepotEntryLine = async (req, res) => {  
  try {  
    const ligne = await DepotEntryLine.findByIdAndUpdate(  
      req.params.id,  
      req.body,  
      { new: true, runValidators: true }  
    ).populate('product_id').populate('um_id');  
      
    if (!ligne) {  
      return res.status(404).json({ success: false, error: 'Ligne non trouvée' });  
    }  
      
    res.json({ success: true, data: ligne });  
  } catch (error) {  
    res.status(400).json({ success: false, error: error.message });  
  }  
};  
  
// Supprimer une ligne  
exports.deleteDepotEntryLine = async (req, res) => {  
  try {  
    const ligne = await DepotEntryLine.findByIdAndDelete(req.params.id);  
      
    if (!ligne) {  
      return res.status(404).json({ success: false, error: 'Ligne non trouvée' });  
    }  
      
    res.json({ success: true, message: 'Ligne supprimée avec succès' });  
  } catch (error) {  
    res.status(500).json({ success: false, error: error.message });  
  }  
};