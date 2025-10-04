const StockLine = require('../models/StockLine');  
const StockDepot = require('../models/StockDepot');  
const Product = require('../models/Product');  
const Um = require('../models/Um');  
  
// Récupérer les lignes d'un inventaire  
exports.getStockLinesByDepot = async (req, res) => {  
  try {  
    const { stockDepotId } = req.params;  
      
    const stockLines = await StockLine.find({ stock_depot_id: stockDepotId })  
      .populate('product_id', 'ref short_name long_name gamme brand description') 
      .populate('um_id', 'code nom symbole')  
      .sort({ 'product_id.nom_court': 1 });  
      
    res.status(200).json({  
      success: true,  
      count: stockLines.length,  
      data: stockLines  
    });  
  } catch (error) {  
    res.status(500).json({  
      success: false,  
      error: error.message  
    });  
  }  
};  
  
// Créer une ligne de stock  
exports.createStockLine = async (req, res) => {  
  try {  
    const { stock_depot_id, product_id, um_id, quantity } = req.body;  
      
    // Vérifications  
    const [stockDepot, product, um] = await Promise.all([  
      StockDepot.findById(stock_depot_id),  
      Product.findById(product_id),  
      Um.findById(um_id)  
    ]);  
      
    if (!stockDepot) {  
      return res.status(404).json({  
        success: false,  
        error: 'Inventaire non trouvé'  
      });  
    }  
      
    if (!product) {  
      return res.status(404).json({  
        success: false,  
        error: 'Produit non trouvé'  
      });  
    }  
      
    if (!um) {  
      return res.status(404).json({  
        success: false,  
        error: 'Unité de mesure non trouvée'  
      });  
    }  
      
    const stockLine = await StockLine.create({  
      stock_depot_id,  
      product_id,  
      um_id,  
      quantity  
    });  
      
    const populatedStockLine = await StockLine.findById(stockLine._id)  
      .populate('product_id', 'reference nom_court type_gaz capacite prix_unitaire')  
      .populate('um_id', 'code nom symbole');  
      
    res.status(201).json({  
      success: true,  
      data: populatedStockLine  
    });  
  } catch (error) {  
    if (error.code === 11000) {  
      return res.status(400).json({  
        success: false,  
        error: 'Cette combinaison produit/unité existe déjà dans cet inventaire'  
      });  
    }  
    res.status(400).json({  
      success: false,  
      error: error.message  
    });  
  }  
};  
  
// Mettre à jour une ligne de stock  
exports.updateStockLine = async (req, res) => {  
  try {  
    const stockLine = await StockLine.findByIdAndUpdate(  
      req.params.id,  
      req.body,  
      { new: true, runValidators: true }  
    ).populate('product_id', 'reference nom_court type_gaz capacite prix_unitaire')  
     .populate('um_id', 'code nom symbole');  
      
    if (!stockLine) {  
      return res.status(404).json({  
        success: false,  
        error: 'Ligne de stock non trouvée'  
      });  
    }  
      
    res.status(200).json({  
      success: true,  
      data: stockLine  
    });  
  } catch (error) {  
    res.status(400).json({  
      success: false,  
      error: error.message  
    });  
  }  
};  
  
// Supprimer une ligne de stock  
exports.deleteStockLine = async (req, res) => {  
  try {  
    const stockLine = await StockLine.findByIdAndDelete(req.params.id);  
      
    if (!stockLine) {  
      return res.status(404).json({  
        success: false,  
        error: 'Ligne de stock non trouvée'  
      });  
    }  
      
    res.status(200).json({  
      success: true,  
      message: 'Ligne de stock supprimée avec succès'  
    });  
  } catch (error) {  
    res.status(500).json({  
      success: false,  
      error: error.message  
    });  
  }  
};