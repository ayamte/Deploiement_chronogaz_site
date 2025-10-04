const Stock = require('../models/Stock');  
const Product = require('../models/Product');  
const Depot = require('../models/Depot');  
  
// Récupérer tous les stocks  
exports.getAllStocks = async (req, res) => {  
  try {  
    const { depot, lowStock } = req.query;  
      
    let filter = {};  
    if (depot) filter.depot = depot;  
      
    let stocks = await Stock.find(filter)  
      .populate('product', 'reference nom_court type_gaz capacite prix_unitaire')  
      .populate('depot', 'reference short_name long_name address')
      .sort({ 'depot.short_name': 1, 'product.nom_court': 1 }); 
      
    // Filtrer les stocks bas si demandé  
    if (lowStock === 'true') {  
      stocks = stocks.filter(stock => stock.isLowStock());  
    }  
      
    res.status(200).json({  
      success: true,  
      count: stocks.length,  
      data: stocks  
    });  
  } catch (error) {  
    res.status(500).json({  
      success: false,  
      error: error.message  
    });  
  }  
};  
  
// Récupérer le stock par dépôt  
exports.getStockByDepot = async (req, res) => {  
  try {  
    const { depot } = req.params;  
      
    const stocks = await Stock.find({ depot })  
      .populate('product', 'reference nom_court type_gaz capacite prix_unitaire')  
      .populate('depot', 'reference short_name long_name address') // ✅ Corrigé  
      .sort({ 'product.nom_court': 1 }); 
      
    if (stocks.length === 0) {  
      return res.status(404).json({  
        success: false,  
        error: 'Aucun stock trouvé pour ce dépôt'  
      });  
    }  
      
    // Calculer les statistiques du dépôt 
    const stats = {  
      totalProducts: stocks.length,  
      totalQuantity: stocks.reduce((sum, stock) => sum + stock.quantity, 0),  
      lowStockCount: stocks.filter(stock => stock.quantity < stock.minStock).length, 
      totalValue: stocks.reduce((sum, stock) =>   
        sum + (stock.quantity * (stock.product.prix_unitaire || 0)), 0  
      )  
    };  
      
    res.status(200).json({  
      success: true,  
      depot,  
      stats,  
      data: stocks  
    });  
  } catch (error) {  
    res.status(500).json({  
      success: false,  
      error: error.message  
    });  
  }  
};  
  
// Récupérer un stock spécifique  
exports.getStockById = async (req, res) => {  
  try {  
    const stock = await Stock.findById(req.params.id)  
        .populate('product', 'reference nom_court type_gaz capacite prix_unitaire')  
        .populate('depot', 'reference short_name long_name address');
      
    if (!stock) {  
      return res.status(404).json({  
        success: false,  
        error: 'Stock non trouvé'  
      });  
    }  
      
    res.status(200).json({  
      success: true,  
      data: stock  
    });  
  } catch (error) {  
    res.status(500).json({  
      success: false,  
      error: error.message  
    });  
  }  
};  
  
// Créer un nouveau stock  
exports.createStock = async (req, res) => {  
  try {  
    // Vérifier que le produit existe  
    const product = await Product.findById(req.body.product);  
    if (!product) {  
      return res.status(404).json({  
        success: false,  
        error: 'Produit non trouvé'  
      });  
    }  
      
    // Vérifier que le dépôt existe  
    const depot = await Depot.findById(req.body.depot);  
    if (!depot) {  
      return res.status(404).json({  
        success: false,  
        error: 'Dépôt non trouvé'  
      });  
    }  
      
    const stock = await Stock.create(req.body);  
    await stock.populate('product', 'reference nom_court type_gaz capacite');  
    await stock.populate('depot', 'reference short_name long_name address'); 
      
    res.status(201).json({  
      success: true,  
      data: stock  
    });  
  } catch (error) {  
    if (error.code === 11000) {  
      return res.status(400).json({  
        success: false,  
        error: 'Un stock existe déjà pour ce produit dans ce dépôt'  
      });  
    }  
    res.status(400).json({  
      success: false,  
      error: error.message  
    });  
  }  
};  
  
// Mettre à jour la quantité de stock  
exports.updateStockQuantity = async (req, res) => {  
  try {  
    const { quantity, operation } = req.body;  
      
    const stock = await Stock.findById(req.params.id);  
    if (!stock) {  
      return res.status(404).json({  
        success: false,  
        error: 'Stock non trouvé'  
      });  
    }  
      
    await stock.updateQuantity(quantity, operation);  
    await stock.populate('product', 'reference nom_court type_gaz capacite');  
    await stock.populate('depot', 'reference short_name long_name address'); 
      
    res.status(200).json({  
      success: true,  
      data: stock  
    });  
  } catch (error) {  
    res.status(400).json({  
      success: false,  
      error: error.message  
    });  
  }  
};  
  
// Mettre à jour un stock  
exports.updateStock = async (req, res) => {  
  try {  
    const stock = await Stock.findByIdAndUpdate(  
      req.params.id,  
      req.body,  
      {  
        new: true,  
        runValidators: true  
      }  
    ).populate('product', 'reference nom_court type_gaz capacite')  
     .populate('depot', 'reference short_name long_name address'); 
      
    if (!stock) {  
      return res.status(404).json({  
        success: false,  
        error: 'Stock non trouvé'  
      });  
    }  
      
    res.status(200).json({  
      success: true,  
      data: stock  
    });  
  } catch (error) {  
    res.status(400).json({  
      success: false,  
      error: error.message  
    });  
  }  
};  
  
// Supprimer un stock  
exports.deleteStock = async (req, res) => {  
  try {  
    const stock = await Stock.findByIdAndDelete(req.params.id);  
      
    if (!stock) {  
      return res.status(404).json({  
        success: false,  
        error: 'Stock non trouvé'  
      });  
    }  
      
    res.status(200).json({  
      success: true,  
      message: 'Stock supprimé avec succès'  
    });  
  } catch (error) {  
    res.status(500).json({  
      success: false,  
      error: error.message  
    });  
  }  
};  
  
// Transférer du stock entre dépôts  
exports.transferStock = async (req, res) => {  
  try {  
    const { fromDepot, toDepot, productId, quantity } = req.body;  
      
    // Vérifier le stock source  
    const sourceStock = await Stock.findOne({   
      depot: fromDepot,   
      product: productId   
    });  
      
    if (!sourceStock) {  
      return res.status(404).json({  
        success: false,  
        error: 'Stock source non trouvé'  
      });  
    }  
      
    if (sourceStock.quantity < quantity) {  
      return res.status(400).json({  
        success: false,  
        error: 'Stock insuffisant dans le dépôt source'  
      });  
    }  
      
    // Diminuer le stock source  
    await sourceStock.updateQuantity(quantity, 'subtract');  
      
    // Augmenter ou créer le stock destination  
    let destStock = await Stock.findOne({   
      depot: toDepot,   
      product: productId   
    });  
      
    if (destStock) {  
      await destStock.updateQuantity(quantity, 'add');  
    } else {  
      destStock = await Stock.create({  
        product: productId,  
        depot: toDepot,  
        quantity: quantity,  
        minStock: sourceStock.minStock,  
        maxStock: sourceStock.maxStock  
      });  
    }  
      
    res.status(200).json({  
      success: true,  
      message: 'Transfert effectué avec succès',  
      data: {  
        source: await sourceStock.populate('product', 'reference nom_court'),  
        destination: await destStock.populate('product', 'reference nom_court')  
      }  
    });  
  } catch (error) {  
    res.status(500).json({  
      success: false,  
      error: error.message  
    });  
  }  
};  
  
// Obtenir les alertes de stock bas  
exports.getLowStockAlerts = async (req, res) => {  
  try {  
    const stocks = await Stock.find()  
      .populate('product', 'reference nom_court type_gaz capacite')  
      .populate('depot', 'reference short_name long_name address') 
      .sort({ quantity: 1 });  
      
    const lowStocks = stocks.filter(stock => stock.isLowStock());  
      
    res.status(200).json({  
      success: true,  
      count: lowStocks.length,  
      data: lowStocks  
    });  
  } catch (error) {  
    res.status(500).json({  
      success: false,  
      error: error.message  
    });  
  }  
};