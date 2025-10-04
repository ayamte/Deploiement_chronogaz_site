const express = require('express');    
const router = express.Router();    
const productController = require('../controllers/productController');    
const { authenticateToken } = require('../middleware/authMiddleware');    
    
// Routes publiques    
router.get('/', productController.getAllProducts);    
router.get('/:id', productController.getProductById);    
router.get('/:id/image', productController.getProductImage);    
    
// Routes protégées (nécessitent authentification)    
router.post('/',     
  authenticateToken,     
  productController.upload.single('image'),     
  productController.createProduct    
);    
    
router.put('/:id',     
  authenticateToken,     
  productController.upload.single('image'),     
  productController.updateProduct    
);    
    
router.delete('/:id', authenticateToken, productController.deleteProduct);    
  
router.put('/:id/units', authenticateToken, productController.updateProductUnits);    
    
module.exports = router;