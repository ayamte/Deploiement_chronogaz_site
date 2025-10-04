const { authenticateToken } = require('./authMiddleware');  
  
const requireAdmin = async (req, res, next) => {  
  // D'abord vérifier l'authentification  
  await authenticateToken(req, res, (err) => {  
    if (err) return;  
      
    // Vérifier si l'utilisateur est admin  
    if (req.user.role_id.code !== 'ADMIN') {  
      return res.status(403).json({  
        success: false,  
        message: 'Accès refusé. Seuls les administrateurs peuvent accéder à cette ressource.'  
      });  
    }  
      
    next();  
  });  
};  
  
module.exports = { requireAdmin };