const express = require('express');  
const multer = require('multer');  
const router = express.Router();  
const blFrsController = require('../controllers/blFrsController');  
  
// Configuration multer pour les fichiers uploadés  
const storage = multer.memoryStorage();  
const upload = multer({   
  storage: storage,  
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max  
  fileFilter: (req, file, cb) => {  
    if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/')) {  
      cb(null, true);  
    } else {  
      cb(new Error('Seuls les fichiers PDF et images sont autorisés'), false);  
    }  
  }  
});  
  
// Routes CRUD pour les bons de livraison  
router.post('/', upload.single('attachment'), (req, res, next) => {  
  console.log('Route BLFRS POST hit:', req.url);  
  next();  
}, blFrsController.createBLFRS);
router.get('/', blFrsController.getAllBLFRS);  
router.get('/:id', blFrsController.getBLFRSById);  
router.put('/:id/validate', blFrsController.validateBLFRS);  
router.delete('/:id', blFrsController.deleteBLFRS);  
  
module.exports = router;