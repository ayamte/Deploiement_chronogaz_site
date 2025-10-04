const Product = require('../models/Product');  
const multer = require('multer');  
const path = require('path'); 
const mongoose = require('mongoose'); 
  
// Configuration multer pour l'upload d'images  
const storage = multer.memoryStorage();  
const upload = multer({  
  storage: storage,  
  limits: {  
    fileSize: 5 * 1024 * 1024 // 5MB  
  },  
  fileFilter: (req, file, cb) => {  
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];  
    if (allowedTypes.includes(file.mimetype)) {  
      cb(null, true);  
    } else {  
      cb(new Error('Format d\'image non supporté'), false);  
    }  
  }  
});  
  
// Récupérer tous les produits  
exports.getAllProducts = async (req, res) => {  
  try {  
    const { actif, search } = req.query;  
      
    let filter = {};  
    if (actif !== undefined) filter.actif = actif === 'true';  
      
    if (search) {  
      filter.$or = [  
        { ref: { $regex: search, $options: 'i' } },  
        { short_name: { $regex: search, $options: 'i' } },  
        { long_name: { $regex: search, $options: 'i' } },  
        { brand: { $regex: search, $options: 'i' } },  
        { gamme: { $regex: search, $options: 'i' } }  
      ];  
    }  
      
    const products = await Product.find(filter).sort({ short_name: 1 });  
      
    res.status(200).json({  
      success: true,  
      count: products.length,  
      data: products  
    });  
  } catch (error) {  
    res.status(500).json({  
      success: false,  
      error: error.message  
    });  
  }  
};  
  
// Récupérer un produit par ID - CORRIGÉ  
exports.getProductById = async (req, res) => {  
  try {  
    const product = await Product.findById(req.params.id)
      .populate('unites_mesure.UM_id', 'unitemesure');

      
    if (!product) {  
      return res.status(404).json({  
        success: false,  
        error: 'Produit non trouvé'  
      });  
    }  
      
    res.status(200).json({  
      success: true,  
      data: product  
    });  
  } catch (error) {  
    res.status(500).json({  
      success: false,  
      error: error.message  
    });  
  }  
};  
  
// Créer un nouveau produit  
exports.createProduct = async (req, res) => {  
  try {  
    const parsedUnitesMesure = JSON.parse(req.body.unites_mesure);

    const validatedUnitesMesure = parsedUnitesMesure.map(unite => ({
      UM_id: new mongoose.Types.ObjectId(unite.UM_id),
      is_principal: unite.is_principal
  }));
    console.log('=== DEBUG BACKEND ===');
    console.log('req.body:', req.body);
    console.log('req.file:', req.file);
    console.log('===================');
    const productData = {  
      ref: req.body.ref,  
      short_name: req.body.short_name,  
      long_name: req.body.long_name,  
      gamme: req.body.gamme,  
      brand: req.body.brand,  
      description: req.body.description,
      unites_mesure: validatedUnitesMesure
 
    };  
  
    // Ajouter l'image si fournie  
    if (req.file) {  
      productData.image = req.file.buffer;  
    }  
    console.log('productData avant création:', productData);

  
    const product = await Product.create(productData);  
      
    res.status(201).json({  
      success: true,  
      data: product  
    });  
  } catch (error) { 
    console.error('=== ERREUR DÉTAILLÉE ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error details:', error);
    console.error('Validation errors:', error.errors);
    console.error('========================'); 
    if (error.code === 11000) {  
      return res.status(400).json({  
        success: false,  
        error: 'Cette référence existe déjà'  
      });  
    }  
    res.status(400).json({  
      success: false,  
      error: error.message  
    });  
  }  
};  
  
// Mettre à jour un produit  
exports.updateProduct = async (req, res) => {  
  try {  
    const updateData = {  
      ref: req.body.ref,  
      short_name: req.body.short_name,  
      long_name: req.body.long_name,  
      gamme: req.body.gamme,  
      brand: req.body.brand,  
      description: req.body.description  
    };  
  
    // Ajouter l'image si fournie  
    if (req.file) {  
      updateData.image = req.file.buffer;  
    }  
  
    const product = await Product.findByIdAndUpdate(  
      req.params.id,  
      updateData,  
      { new: true, runValidators: true }  
    );  
      
    if (!product) {  
      return res.status(404).json({  
        success: false,  
        error: 'Produit non trouvé'  
      });  
    }  
      
    res.status(200).json({  
      success: true,  
      data: product  
    });  
  } catch (error) {  
    res.status(400).json({  
      success: false,  
      error: error.message  
    });  
  }  
};  
  
// Supprimer un produit  
exports.deleteProduct = async (req, res) => {  
  try {  
    const product = await Product.findByIdAndDelete(req.params.id);  
      
    if (!product) {  
      return res.status(404).json({  
        success: false,  
        error: 'Produit non trouvé'  
      });  
    }  
      
    res.status(200).json({  
      success: true,  
      message: 'Produit supprimé avec succès'  
    });  
  } catch (error) {  
    res.status(500).json({  
      success: false,  
      error: error.message  
    });  
  }  
};  
  
// Récupérer l'image d'un produit  
exports.getProductImage = async (req, res) => {  
  try {  
    const product = await Product.findById(req.params.id);  
      
    if (!product || !product.image) {  
      return res.status(404).json({  
        success: false,  
        error: 'Image non trouvée'  
      });  
    }  
      
    res.set('Content-Type', 'image/jpeg');  
    res.send(product.image);  
  } catch (error) {  
    res.status(500).json({  
      success: false,  
      error: error.message  
    });  
  }  
};  

// Ajouter/modifier les unités de mesure d'un produit  
exports.updateProductUnits = async (req, res) => {  
  try {  
    const { id } = req.params;  
    const { unites_mesure } = req.body;  
  
    const product = await Product.findByIdAndUpdate(  
      id,  
      { unites_mesure },  
      { new: true, runValidators: true }  
    ).populate('unites_mesure.UM_id', 'unitemesure');  
  
    if (!product) {  
      return res.status(404).json({  
        success: false,  
        error: 'Produit non trouvé'  
      });  
    }  
  
    res.status(200).json({  
      success: true,  
      data: product  
    });  
  } catch (error) {  
    res.status(400).json({  
      success: false,  
      error: error.message  
    });  
  }  
};

exports.upload = upload;