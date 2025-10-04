const express = require('express');      
const cors = require('cors');      
const http = require('http');
const socketIo = require('socket.io');
const connectDB = require('./config/database');      
const mongoose = require('mongoose');

    
// Import des routes d'authentification    
const authRoutes = require('./routes/authRouter');    
const { hashPassword } = require('./utils/password');
    
// Import des modèles      
const Role = require('./models/Role');      
const User = require('./models/User');      
const PhysicalUser = require('./models/PhysicalUser');      
const MoralUser = require('./models/MoralUser');      
const Customer = require('./models/Customer');      
const Employe = require('./models/Employe');      
const Product = require('./models/Product');      
const Truck = require('./models/Truck'); 

const Planification = require('./models/Planification');  
const Livraison = require('./models/Livraison');  
const LivraisonLine = require('./models/LivraisonLine');
const planificationRoutes = require('./routes/planification'); 
const evaluationRoutes = require('./routes/Evaluation');

const Address = require('./models/Address');
const City = require('./models/City');    
const Command = require('./models/Commande');
const UserAddress = require('./models/UserAddress');  

// Import des nouveaux routers améliorés
const usersRouter = require('./routes/usersRouter');   
const addressRoutes = require('./routes/address'); 
const customerRoutes = require('./routes/customer'); 
const locationRoutes = require('./routes/locations');  
const commandRoutes = require('./routes/order');
const livraisonRoutes = require('./routes/livraison');

// Routes métier existantes
const listePrixRoutes = require('./routes/listeprix');  
const depotsRoutes = require('./routes/depots');    
const stockRoutes = require('./routes/stock');     
const trucksRoutes = require('./routes/trucks');    
const adminRoutes = require('./routes/adminRouter'); 
const reportsRoutes = require('./routes/reports');
const stockDepotRoutes = require('./routes/stockDepots');  
const stockLineRoutes = require('./routes/stockLines'); 
const productRoutes = require('./routes/products');  
const umRoutes = require('./routes/ums');
const truckLoadingSessionRoutes = require('./routes/truckLoadingSessions'); 

const fournisseurRoutes = require('./routes/fournisseur');  
const blFrsRoutes = require('./routes/blFrs');  
const depotEntryLineRoutes = require('./routes/depotEntryLine');

// Import du middleware d'authentification    
const { authenticateToken } = require('./middleware/authMiddleware');    
const setupWebSocket = require('./middleware/websocket');
const { getClientsWithAddresses } = require('./controllers/adminController');  


const { sendTempPasswordEmail } = require('./services/emailService');
  
const passport = require('passport');    
require('./config/passport');   
require('dotenv').config();      
    
const app = express();      
const server = http.createServer(app);

// Configuration Socket.IO pour les commandes
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});
    
// Connexion à MongoDB      
connectDB();      
    
// Middleware      
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true
}));      
app.use(express.json());      
app.use(express.urlencoded({ extended: true }));     

// Middleware pour Socket.IO dans les routes
app.use((req, res, next) => {
  req.io = io;
  next();
});



// Setup WebSocket pour les commandes
setupWebSocket(io);

// Routes principales avec les nouveaux routers améliorés
app.use('/api/auth', authRoutes);      
app.use('/api/users', usersRouter);     
app.use('/api/addresses', addressRoutes);  
app.use('/api/customer', customerRoutes);  
app.use('/api/locations', locationRoutes);  
app.use("/api/commands", commandRoutes);  
app.use('/api/livraisons', livraisonRoutes);  
app.use('/api/planifications', planificationRoutes);  
app.use('/api/evaluations', evaluationRoutes);  
  
// Routes métier existantes  
app.use('/api/listeprix', listePrixRoutes);  
app.use('/api/depots', depotsRoutes);    
app.use('/api/stock', stockRoutes);    
app.use('/api/trucks', trucksRoutes);   
app.use('/api/reports', reportsRoutes);  
app.use('/api/stock-depots', stockDepotRoutes);    
app.use('/api/stock-lines', stockLineRoutes);  
app.use('/api/products', productRoutes);    
app.use('/api/ums', umRoutes);
app.use('/api/truck-loading-sessions', truckLoadingSessionRoutes);  
  
app.use('/api/fournisseurs', fournisseurRoutes);    
app.use('/api/bl-frs', blFrsRoutes);    
app.use('/api/depot-entry-lines', depotEntryLineRoutes);  
  
// IMPORTANT: Déplacer les routes admin APRÈS les routes inline  
app.use('/api/admin', adminRoutes);

// Initialisation Passport
app.use(passport.initialize());  

// Routes de test et santé      
app.get('/api/health', (req, res) => {      
  res.json({       
    message: 'ChronoGaz API is running with MongoDB!',      
    database: 'chronogaz_db',      
    timestamp: new Date().toISOString(),      
    collections: [      
      'users', 'roles', 'physicalusers', 'moralusers',      
      'customers', 'employes', 'products', 'trucks',      
      'cities', 'addresses', 'useraddresses', 'commandes',   
      'planifications', 'livraisons', 'livraisonlines',   
      'depots', 'stockdepots', 'stocklines', 'ums'     
    ]  
  });      
});      
    
// Route pour tester les rôles      
app.get('/api/roles', async (req, res) => {      
  try {      
    const roles = await Role.find({ actif: true });      
    res.json({      
      success: true,      
      count: roles.length,      
      data: roles      
    });      
  } catch (error) {      
    res.status(500).json({       
      success: false,      
      error: error.message       
    });      
  }      
});      

// ==================== ROUTES CLIENTS CRUD (CONSERVÉES) ====================  
// GET - Récupérer tous les clients  
app.get('/api/customers', authenticateToken, async (req, res) => {            
  try {            
    const customers = await Customer.find({})        
      .populate({    
        path: 'physical_user_id',    
        populate: [    
          {    
            path: 'user_id',    
            select: 'email statut'    
          },  
          {  
            path: 'moral_user_id',  
            select: '_id'  
          }  
        ]    
      })    
      .populate({    
        path: 'moral_user_id',    
        populate: [    
          {    
            path: 'user_id',    
            select: 'email statut'    
          }    
        ]    
      }); 

    // Récupérer les adresses pour chaque client
    const customersWithAddresses = await Promise.all(  
      customers.map(async (customer) => {  
        let addresses = [];  
        let clientData = {  
          id: customer._id,  
          customer_code: customer.customer_code,  
          type_client: customer.type_client,  
          statut: customer.statut,  
          credit_limite: customer.credit_limite,  
          credit_utilise: customer.credit_utilise,  
          date_inscription: customer.date_inscription  
        };  
          
        if (customer.physical_user_id) {  
          // Informations utilisateur physique  
          clientData.user_info = {  
            id: customer.physical_user_id.user_id._id,  
            email: customer.physical_user_id.user_id.email,  
            statut: customer.physical_user_id.user_id.statut,  
            type: 'PHYSIQUE',  
            first_name: customer.physical_user_id.first_name,  
            last_name: customer.physical_user_id.last_name,  
            civilite: customer.physical_user_id.civilite,  
            telephone_principal: customer.physical_user_id.telephone_principal,
            moral_user_id: customer.physical_user_id.moral_user_id?._id  
          };  

          // Récupérer les adresses via UserAddress
          const userAddresses = await UserAddress.find({   
            physical_user_id: customer.physical_user_id._id   
          })  
          .populate({  
            path: 'address_id',  
            populate: [  
              { path: 'city_id', select: 'name code nom' }  
            ]  
          });  
            
          addresses = userAddresses.map(ua => ({  
            _id: ua.address_id._id,  
            street: ua.address_id.street,  
            numappt: ua.address_id.numappt || '',  
            numimmeuble: ua.address_id.numimmeuble || '',  
            quartier: ua.address_id.quartier || '',  
            postal_code: ua.address_id.postal_code || '',  
            telephone: ua.address_id.telephone || '',  
            instructions_livraison: ua.address_id.instructions_livraison || '',  
            latitude: ua.address_id.latitude,  
            longitude: ua.address_id.longitude,  
            type_adresse: ua.address_id.type_adresse || 'DOMICILE',  
            city: ua.address_id.city_id,  
            is_principal: ua.is_principal  
          }));  
        } else if (customer.moral_user_id) {  
          // Informations utilisateur moral  
          clientData.user_info = {  
            id: customer.moral_user_id.user_id._id,  
            email: customer.moral_user_id.user_id.email,  
            statut: customer.moral_user_id.user_id.statut,  
            type: 'MORAL',  
            raison_sociale: customer.moral_user_id.raison_sociale,  
            ice: customer.moral_user_id.ice,  
            patente: customer.moral_user_id.patente,  
            rc: customer.moral_user_id.rc,  
            ville_rc: customer.moral_user_id.ville_rc,  
            forme_juridique: customer.moral_user_id.forme_juridique,  
            secteur_activite: customer.moral_user_id.secteur_activite,  
            telephone_principal: customer.moral_user_id.telephone_principal
          };  

          // Récupérer les adresses via UserAddress
          const userAddresses = await UserAddress.find({   
            moral_user_id: customer.moral_user_id._id   
          })  
          .populate({  
            path: 'address_id',  
            populate: [  
              { path: 'city_id', select: 'name code nom' }  
            ]  
          });  
            
          addresses = userAddresses.map(ua => ({  
            _id: ua.address_id._id,  
            street: ua.address_id.street,  
            numappt: ua.address_id.numappt || '',  
            numimmeuble: ua.address_id.numimmeuble || '',  
            quartier: ua.address_id.quartier || '',  
            postal_code: ua.address_id.postal_code || '',  
            telephone: ua.address_id.telephone || '',  
            instructions_livraison: ua.address_id.instructions_livraison || '',  
            latitude: ua.address_id.latitude,  
            longitude: ua.address_id.longitude,  
            type_adresse: ua.address_id.type_adresse || 'SIÈGE SOCIAL',  
            city: ua.address_id.city_id,  
            is_principal: ua.is_principal  
          }));  
        }  
          
        return {  
          ...clientData,  
          addresses: addresses  
        };  
      })  
    );  
          
    res.json({          
      success: true,          
      count: customersWithAddresses.length,          
      data: customersWithAddresses          
    });          
  } catch (error) {          
    console.error('Erreur détaillée:', error);  
    res.status(500).json({           
      success: false,          
      message: error.message       
    });          
  }          
});

// GET - Récupérer un client par ID  
app.get('/api/customers/:id', authenticateToken, async (req, res) => {    
  try {    
    const customer = await Customer.findById(req.params.id)    
      .populate({    
        path: 'physical_user_id',    
        populate: [
          {
            path: 'user_id',    
            select: 'email'    
          }
        ]
      })    
      .populate({    
        path: 'moral_user_id',    
        populate: [
          {
            path: 'user_id',    
            select: 'email'    
          }
        ]
      });    
    
    if (!customer) {  
      return res.status(404).json({  
        success: false,  
        message: 'Client non trouvé'  
      });  
    }  

    res.json({    
      success: true,    
      data: customer    
    });    
  } catch (error) {    
    res.status(500).json({    
      success: false,    
      error: error.message    
    });    
  }    
});  

// POST - Créer un nouveau client    
app.post('/api/customers', authenticateToken, async (req, res) => {        
  try {        
    const { type_client, profile } = req.body;        
        
    if (!type_client || !profile) {        
      return res.status(400).json({        
        success: false,        
        message: 'type_client et profile sont requis'        
      });        
    }        
        
    // Vérifier si l'email existe déjà        
    const existingUser = await User.findOne({ email: profile.email });        
    if (existingUser) {        
      return res.status(400).json({        
        success: false,        
        message: 'Un utilisateur avec cet email existe déjà'        
      });        
    }        
        
    // Récupérer le rôle CLIENT        
    const roleClient = await Role.findOne({ code: 'CLIENT' });        
    if (!roleClient) {        
      return res.status(400).json({ success: false, message: 'Rôle CLIENT non trouvé' });        
    }        
        
    // Créer l'utilisateur de base        
    const defaultPassword = 'ChronoGaz2024';    
    const hashedPassword = await hashPassword(defaultPassword);    
      
    // 🔍 AJOUTER CES LOGS ICI  
    console.log('Password to hash:', defaultPassword);    
    console.log('Hashed password:', hashedPassword);  
      
    // Tester la comparaison immédiatement  
    const { comparePassword } = require('./utils/password');    
    const isValid = await comparePassword('ChronoGaz2024', hashedPassword);    
    console.log('Password comparison result:', isValid);  
      
    const newUser = new User({    
      email: profile.email,    
      password_hash: hashedPassword,    
      role_id: roleClient._id,    
      statut: 'ACTIF',    
      password_temporary: true,    
      first_login: true,    
      created_by_admin: true    
    });    
    await newUser.save();        
        
    let customer;        
        
    if (type_client === 'PHYSIQUE') {          
      // Créer le PhysicalUser  
      const physicalUser = new PhysicalUser({      
        user_id: newUser._id,      
        first_name: profile.first_name,      
        last_name: profile.last_name,      
        civilite: profile.civilite || 'M',      
        telephone_principal: profile.telephone_principal,     
        city_id: profile.city_id || null  
      });            
      const savedPhysical = await physicalUser.save();          
        
      // Créer le Customer  
      const customer_code = `CLI-P${Date.now()}`;  
      customer = new Customer({          
        customer_code,          
        type_client: 'PHYSIQUE',          
        physical_user_id: savedPhysical._id,          
        statut: 'ACTIF'          
      });          
    } else if (type_client === 'MORAL') {          
      // Créer le MoralUser  
      const moralUser = new MoralUser({      
        user_id: newUser._id,      
        raison_sociale: profile.raison_sociale,      
        ice: profile.ice,      
        patente: profile.patente,      
        rc: profile.rc,      
        ville_rc: profile.ville_rc,      
        forme_juridique: profile.forme_juridique,  
        secteur_activite: profile.secteur_activite,  
        telephone_principal: profile.telephone_principal,      
        city_id: profile.city_id || null  
      });         
      const savedMoral = await moralUser.save();          
        
      // Créer le Customer  
      const customer_code = `CLI-M${Date.now()}`;  
      customer = new Customer({          
        customer_code,          
        type_client: 'MORAL',          
        moral_user_id: savedMoral._id,          
        statut: 'ACTIF'          
      });          
    }          
          
    const savedCustomer = await customer.save();          
    const populatedCustomer = await Customer.findById(savedCustomer._id)          
      .populate({          
        path: 'physical_user_id',          
        populate: {      
          path: 'user_id',   
          select: 'email'  
        }     
      })          
      .populate({          
        path: 'moral_user_id',          
        populate: {      
          path: 'user_id',   
          select: 'email'  
        }      
      });          
          
    res.json({ success: true, data: populatedCustomer });          
  } catch (error) {          
    console.error('Erreur création client:', error);          
    res.status(400).json({ success: false, message: error.message });          
  }          
});      
      
// PUT - Mettre à jour un client      
app.put('/api/customers/:id', authenticateToken, async (req, res) => {        
  try {        
    const { profile, statut } = req.body;        
    const customer = await Customer.findById(req.params.id)        
      .populate('physical_user_id')        
      .populate('moral_user_id');        
        
    if (!customer) {        
      return res.status(404).json({ success: false, message: 'Client non trouvé' });        
    }        
        
    // Mettre à jour le statut du Customer        
    if (statut && ['ACTIF', 'INACTIF', 'SUSPENDU', 'EN_ATTENTE'].includes(statut)) {        
      await Customer.findByIdAndUpdate(req.params.id, { statut });        
    }        
        
    // Mettre à jour l'email dans User si fourni        
    if (profile?.email) {        
      const userId = customer.physical_user_id?.user_id || customer.moral_user_id?.user_id;        
      if (userId) {        
        await User.findByIdAndUpdate(userId, { email: profile.email });        
      }        
    }        
        
    // Mettre à jour le profile selon le type        
    if (profile) {        
      const profileUpdate = { ...profile };        
      delete profileUpdate.email; // Retirer email du profile car déjà traité        
        
      if (customer.type_client === 'PHYSIQUE' && customer.physical_user_id) {        
        await PhysicalUser.findByIdAndUpdate(customer.physical_user_id._id, profileUpdate);        
      } else if (customer.type_client === 'MORAL' && customer.moral_user_id) {        
        await MoralUser.findByIdAndUpdate(customer.moral_user_id._id, profileUpdate);        
      }        
    }        
        
    const updatedCustomer = await Customer.findById(req.params.id)        
      .populate({        
        path: 'physical_user_id',        
        populate: {      
          path: 'user_id',   
          select: 'email'  
        }     
      })        
      .populate({        
        path: 'moral_user_id',         
        populate: {      
          path: 'user_id',   
          select: 'email'  
        }     
      });        
        
    res.json({ success: true, data: updatedCustomer });        
  } catch (error) {        
    res.status(400).json({ success: false, message: error.message });        
  }        
});      
      
// DELETE - Supprimer un client      
app.delete('/api/customers/:id', authenticateToken, async (req, res) => {      
  try {      
    const customer = await Customer.findById(req.params.id);      
    if (!customer) {      
      return res.status(404).json({ success: false, message: 'Client non trouvé' });      
    }      
      
    // Supprimer les données liées      
    if (customer.physical_user_id) {      
      const physicalUser = await PhysicalUser.findById(customer.physical_user_id);      
      if (physicalUser) {      
        await User.findByIdAndDelete(physicalUser.user_id);      
        await PhysicalUser.findByIdAndDelete(customer.physical_user_id);      
      }      
    }      
    if (customer.moral_user_id) {      
      const moralUser = await MoralUser.findById(customer.moral_user_id);      
      if (moralUser) {      
        await User.findByIdAndDelete(moralUser.user_id);      
        await MoralUser.findByIdAndDelete(customer.moral_user_id);      
      }      
    }      
      
    await Customer.findByIdAndDelete(req.params.id);      
    res.json({ success: true, message: 'Client supprimé avec succès' });        
  } catch (error) {        
    res.status(400).json({ success: false, message: error.message });        
  }        
});        



  
// ==================== ROUTES ENTREPRISES (CONSERVÉES) ==================== 


// Route spécifique pour les entreprises Google OAuth  
app.get('/api/customers/company/oauth/:userId', authenticateToken, async (req, res) => {  
  try {  
    const { userId } = req.params;  
      
    console.log('🔍 === DÉBUT DIAGNOSTIC OAUTH ENTREPRISE ===');  
    console.log('🔍 UserID reçu dans la route:', userId);  
    console.log('🔍 Type de userId:', typeof userId);  
    console.log('🔍 Longueur userId:', userId?.length);  
      
    // Vérifier d'abord si l'utilisateur existe  
    const user = await User.findById(userId);  
    console.log('👤 Utilisateur trouvé:', user ? 'OUI' : 'NON');  
    if (user) {  
      console.log('👤 Détails utilisateur:', {  
        id: user._id,  
        email: user.email,  
        role: user.role_id,  
        statut: user.statut,  
        google_id: user.google_id,  
        created_by_admin: user.created_by_admin  
      });  
    }  
      
    // Chercher le MoralUser correspondant à l'utilisateur Google OAuth  
    console.log('🏢 Recherche MoralUser avec user_id:', userId);  
    const moralUser = await MoralUser.findOne({ user_id: userId });  
    console.log('🏢 MoralUser trouvé:', moralUser ? 'OUI' : 'NON');  
      
    if (!moralUser) {  
      console.log('❌ Aucun MoralUser trouvé pour cet utilisateur');  
      console.log('❌ Vérification: L\'entreprise a-t-elle complété son profil après connexion Google?');  
        
      // Chercher tous les MoralUser pour debug  
      const allMoralUsers = await MoralUser.find({}).limit(5);  
      console.log('🔍 DEBUG: Premiers MoralUsers dans la DB:', allMoralUsers.map(mu => ({  
        id: mu._id,  
        user_id: mu.user_id,  
        raison_sociale: mu.raison_sociale  
      })));  
        
      return res.json({   
        success: true,   
        data: [],  
        debug: {  
          message: 'Aucun MoralUser trouvé - profil non complété',  
          userId: userId,  
          userExists: !!user  
        }  
      });  
    }  
      
    console.log('✅ MoralUser trouvé:', {  
      id: moralUser._id,  
      user_id: moralUser.user_id,  
      raison_sociale: moralUser.raison_sociale,  
      ice: moralUser.ice  
    });  
      
    // Chercher les PhysicalUser liés à cette entreprise  
    console.log('🔍 Recherche PhysicalUser avec moral_user_id:', moralUser._id);  
    const physicalUsers = await PhysicalUser.find({ moral_user_id: moralUser._id })  
      .populate({  
        path: 'user_id',  
        select: 'email statut'  
      });  
      
    console.log('👥 Nombre de PhysicalUser trouvés:', physicalUsers.length);  
      
    if (physicalUsers.length === 0) {  
      console.log('ℹ️ Aucun client particulier trouvé pour cette entreprise');  
      console.log('ℹ️ L\'entreprise n\'a pas encore créé de clients particuliers');  
      return res.json({   
        success: true,   
        data: [],  
        debug: {  
          message: 'Aucun client particulier créé par cette entreprise',  
          moralUserId: moralUser._id,  
          raison_sociale: moralUser.raison_sociale  
        }  
      });  
    }  
      
    // Récupérer les customers correspondants  
    const clientsData = [];  
      
    console.log('🔍 Traitement des PhysicalUser trouvés...');  
    for (const physicalUser of physicalUsers) {  
      console.log('👤 Traitement PhysicalUser:', {  
        id: physicalUser._id,  
        user_id: physicalUser.user_id._id,  
        nom: `${physicalUser.first_name} ${physicalUser.last_name}`,  
        email: physicalUser.user_id.email  
      });  
        
      const customer = await Customer.findOne({ physical_user_id: physicalUser._id });  
      console.log('🛒 Customer trouvé pour ce PhysicalUser:', customer ? 'OUI' : 'NON');  
        
      if (customer) {  
        console.log('🛒 Détails Customer:', {  
          id: customer._id,  
          customer_code: customer.customer_code,  
          statut: customer.statut  
        });  
          
        clientsData.push({  
          id: customer._id,  
          customer_code: customer.customer_code,  
          type_client: customer.type_client,  
          statut: customer.statut,  
          credit_limite: customer.credit_limite,  
          credit_utilise: customer.credit_utilise,  
          date_inscription: customer.date_inscription,  
          user_info: {  
            id: physicalUser.user_id._id,  
            email: physicalUser.user_id.email,  
            statut: physicalUser.user_id.statut,  
            type: 'PHYSIQUE',  
            first_name: physicalUser.first_name,  
            last_name: physicalUser.last_name,  
            civilite: physicalUser.civilite,  
            telephone_principal: physicalUser.telephone_principal  
          }  
        });  
      }  
    }  
      
    console.log(`✅ ${clientsData.length} clients particuliers trouvés au total`);  
    console.log('🔍 === FIN DIAGNOSTIC OAUTH ENTREPRISE ===');  
      
    res.json({  
      success: true,  
      data: clientsData,  
      debug: {  
        moralUserId: moralUser._id,  
        raison_sociale: moralUser.raison_sociale,  
        totalPhysicalUsers: physicalUsers.length,  
        totalCustomers: clientsData.length  
      }  
    });  
      
  } catch (error) {  
    console.error('❌ === ERREUR DANS ROUTE OAUTH ===');  
    console.error('❌ Erreur complète:', error);  
    console.error('❌ Stack trace:', error.stack);  
    console.error('❌ Paramètres reçus:', req.params);  
    console.error('❌ === FIN ERREUR ===');  
      
    res.status(500).json({  
      success: false,  
      message: 'Erreur serveur lors de la récupération des clients',  
      error: error.message,  
      debug: {  
        userId: req.params.userId,  
        errorType: error.constructor.name  
      }  
    });  
  }  
});


// GET - Récupérer les clients d'une entreprise spécifique          
app.get('/api/customers/company/:companyId', authenticateToken, async (req, res) => {  
  try {  
    const { companyId } = req.params;  
      
    // Validation de l'ObjectId  
    if (!companyId || companyId === 'undefined' || !mongoose.Types.ObjectId.isValid(companyId)) {  
      return res.status(400).json({  
        success: false,  
        message: 'ID d\'entreprise invalide'  
      });  
    }  
      
    // Trouver tous les PhysicalUser liés à cette entreprise  
    const physicalUsers = await PhysicalUser.find({ moral_user_id: companyId })  
      .populate('user_id', 'email statut');  
      
    // Trouver les customers correspondants  
    const customerIds = physicalUsers.map(pu => pu._id);  
    const customers = await Customer.find({   
      physical_user_id: { $in: customerIds },  
      type_client: 'PHYSIQUE'  
    });  
      
    // Combiner les données  
    const clientsData = physicalUsers.map(physicalUser => {  
      const customer = customers.find(c => c.physical_user_id.toString() === physicalUser._id.toString());  
      return {  
        id: customer?._id,  
        customer_code: customer?.customer_code,  
        user_info: {  
          id: physicalUser.user_id._id,  
          email: physicalUser.user_id.email,  
          statut: physicalUser.user_id.statut,  
          type: 'PHYSIQUE',  
          first_name: physicalUser.first_name,  
          last_name: physicalUser.last_name,  
          civilite: physicalUser.civilite,  
          telephone_principal: physicalUser.telephone_principal,  
          city_id: physicalUser.city_id  
        },  
        statut: customer?.statut || 'INACTIF',  
        date_inscription: customer?.date_inscription  
      };  
    });  
      
    res.json({   
      success: true,   
      count: clientsData.length,  
      data: clientsData   
    });  
  } catch (error) {  
    console.error('Erreur récupération clients entreprise:', error);  
    res.status(500).json({   
      success: false,   
      message: error.message   
    });  
  }  
});       
  
// POST - Créer un client particulier pour une entreprise spécifique          
app.post('/api/customers/company', authenticateToken, async (req, res) => {              
  try {            
      
    const generateTempPassword = () => {      
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';      
      let password = '';      
      for (let i = 0; i < 8; i++) {      
        password += chars.charAt(Math.floor(Math.random() * chars.length));      
      }      
      return password;      
    };    
      
    const user = req.user;              
                  
    // Vérifier que l'utilisateur est une entreprise              
    if (user.role_id.code !== 'CLIENT' || !user.moral_user_id) {              
      return res.status(403).json({               
        success: false,               
        message: 'Seules les entreprises peuvent créer des clients particuliers'               
      });              
    }              
            
    const { profile } = req.body;              
                  
    // Validation des champs requis pour un particulier              
    if (!profile?.first_name || !profile?.last_name || !profile?.civilite || !profile?.email) {              
      return res.status(400).json({              
        success: false,              
        message: 'Prénom, nom, civilité et email sont requis'              
      });              
    }              
            
    // Créer l'utilisateur de base avec mot de passe temporaire généré              
    const roleClient = await Role.findOne({ code: 'CLIENT' });              
    if (!roleClient) {              
      return res.status(400).json({ success: false, message: 'Rôle CLIENT non trouvé' });              
    }              
            
    const bcrypt = require('bcrypt');    
    const tempPassword = generateTempPassword();      
    const hashedPassword = await bcrypt.hash(tempPassword, 10);             
            
    const newUser = new User({  
      email: profile.email,  
      password_hash: hashedPassword,  
      role_id: roleClient._id,  
      statut: 'ACTIF',  
      password_temporary: true,  
      first_login: true,
      created_by_admin: true 
    });              
    await newUser.save();              
            
    // Créer le PhysicalUser lié à l'entreprise              
    const physicalUser = new PhysicalUser({          
      user_id: newUser._id,        
      first_name: profile.first_name,          
      last_name: profile.last_name,          
      civilite: profile.civilite,          
      telephone_principal: profile.telephone_principal,          
      city_id: profile.city_id || null,        
      adresse_principale: profile.adresse_principale,        
      moral_user_id: user.moral_user_id // LIER À L'ENTREPRISE CONNECTÉE            
    });               
    await physicalUser.save();              
            
    // Créer le Customer              
    const customer_code = `CLI-P${Date.now()}`;              
    const customer = new Customer({              
      customer_code,              
      type_client: 'PHYSIQUE',              
      physical_user_id: physicalUser._id,              
      statut: 'ACTIF'              
    });              
    await customer.save();              
    
    //  Copier les adresses de l'entreprise vers le client particulier    
    const companyAddresses = await UserAddress.find({     
      moral_user_id: user.moral_user_id     
    }).populate('address_id');    
    
    for (const companyUserAddress of companyAddresses) {    
      const companyAddress = companyUserAddress.address_id;    
          
      // Créer une nouvelle adresse identique pour le client particulier    
      const newAddress = new Address({    
        user_id: newUser._id,    
        street: companyAddress.street,    
        numappt: companyAddress.numappt,    
        numimmeuble: companyAddress.numimmeuble,    
        quartier: companyAddress.quartier,    
        postal_code: companyAddress.postal_code,    
        city_id: companyAddress.city_id,    
        latitude: companyAddress.latitude,    
        longitude: companyAddress.longitude,    
        telephone: companyAddress.telephone,    
        instructions_livraison: companyAddress.instructions_livraison,    
        type_adresse: companyUserAddress.is_principal ? 'DOMICILE' : 'AUTRE',    
        is_principal: companyUserAddress.is_principal    
      });    
          
      const savedAddress = await newAddress.save();    
          
      // Créer la liaison UserAddress pour le client particulier    
      const userAddress = new UserAddress({    
        physical_user_id: physicalUser._id,    
        address_id: savedAddress._id,    
        is_principal: companyUserAddress.is_principal    
      });    
          
      await userAddress.save();    
    }    
  
    //  Envoyer le mot de passe par email  
    try {    
      await sendTempPasswordEmail(profile.email, tempPassword, profile.first_name);    
    } catch (emailError) {    
      console.error('Erreur envoi email:', emailError);    
      // Ne pas faire échouer la création si l'email échoue    
    }  
            
    const populatedCustomer = await Customer.findById(customer._id)              
      .populate({              
        path: 'physical_user_id',              
        populate: [        
          {        
            path: 'user_id',              
            select: 'email'              
          }       
        ]        
      });              
            
    res.status(201).json({               
      success: true,               
      message: 'Client particulier créé avec succès avec les adresses de l\'entreprise',              
      data: populatedCustomer               
    });              
            
  } catch (error) {              
    console.error('Erreur création client entreprise:', error);              
    res.status(500).json({               
      success: false,               
      message: error.message               
    });              
  }              
});      
  

// Route pour créer un client particulier pour une entreprise Google OAuth  
app.post('/api/customers/company/oauth/:userId/create', authenticateToken, async (req, res) => {  
  try {  
    const { userId } = req.params;  
    const { profile } = req.body;  
      
    // Récupérer le MoralUser correspondant  
    const moralUser = await MoralUser.findOne({ user_id: userId });  
    if (!moralUser) {  
      return res.status(404).json({  
        success: false,  
        message: 'Entreprise non trouvée'  
      });  
    }  
      
    // Utiliser la même logique que la route normale mais avec le moralUser trouvé  
    const generateTempPassword = () => {  
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';  
      let password = '';  
      for (let i = 0; i < 8; i++) {  
        password += chars.charAt(Math.floor(Math.random() * chars.length));  
      }  
      return password;  
    };  
      
    // Validation des champs requis  
    if (!profile?.first_name || !profile?.last_name || !profile?.civilite || !profile?.email) {  
      return res.status(400).json({  
        success: false,  
        message: 'Prénom, nom, civilité et email sont requis'  
      });  
    }  
      
    // Créer l'utilisateur de base  
    const roleClient = await Role.findOne({ code: 'CLIENT' });  
    if (!roleClient) {  
      return res.status(400).json({ success: false, message: 'Rôle CLIENT non trouvé' });  
    }  
      
    const bcrypt = require('bcrypt');  
    const tempPassword = generateTempPassword();  
    const hashedPassword = await bcrypt.hash(tempPassword, 10);  
      
    const newUser = new User({  
      email: profile.email,  
      password_hash: hashedPassword,  
      role_id: roleClient._id,  
      statut: 'ACTIF',  
      password_temporary: true,  
      first_login: true,  
      created_by_admin: true  
    });  
    await newUser.save();  
      
    // Créer le PhysicalUser lié à l'entreprise OAuth  
    const physicalUser = new PhysicalUser({  
      user_id: newUser._id,  
      first_name: profile.first_name,  
      last_name: profile.last_name,  
      civilite: profile.civilite,  
      telephone_principal: profile.telephone_principal,  
      moral_user_id: moralUser._id // Lier à l'entreprise OAuth  
    });  
    await physicalUser.save();  
      
    // Créer le Customer  
    const customer_code = `CLI-P${Date.now()}`;  
    const customer = new Customer({  
      customer_code,  
      type_client: 'PHYSIQUE',  
      physical_user_id: physicalUser._id,  
      statut: 'ACTIF'  
    });  
    await customer.save();  
      
    try {      
      await sendTempPasswordEmail(profile.email, tempPassword, profile.first_name);      
    } catch (emailError) {      
      console.error('Erreur envoi email:', emailError);        
    }  
    res.json({   
      success: true,   
      data: customer,  
      message: 'Client particulier créé avec succès'  
    });  
      
  } catch (error) {  
    console.error('Erreur création client OAuth:', error);  
    res.status(500).json({   
      success: false,   
      message: error.message   
    });  
  }  
});



// ==================== ROUTES EMPLOYÉS CRUD (CONSERVÉES) ====================  
// GET - Récupérer tous les employés            
app.get('/api/employees', authenticateToken, async (req, res) => {            
  try {            
    const employees = await Employe.find({})              
      .populate({              
        path: 'physical_user_id',              
        populate: [    
          {    
            path: 'user_id',              
            select: 'email statut'              
          }  
        ]    
      })  
      .populate('depot_id', 'short_name reference');           
            
    const employeesData = employees.map(emp => ({              
      id: emp._id,              
      matricule: emp.matricule,              
      fonction: emp.fonction,          
      cin: emp.cin,             
      cnss: emp.cnss,        
      date_embauche: emp.date_embauche,              
      statut: emp.statut,  
      depot_id: emp.depot_id?._id,  
      depot_info: emp.depot_id ? {  
        short_name: emp.depot_id.short_name,  
        reference: emp.depot_id.reference  
      } : null,  
      user_info: {              
        id: emp.physical_user_id.user_id._id,              
        email: emp.physical_user_id.user_id.email,              
        statut: emp.physical_user_id.user_id.statut,              
        first_name: emp.physical_user_id.first_name,              
        last_name: emp.physical_user_id.last_name,              
        civilite: emp.physical_user_id.civilite,              
        telephone_principal: emp.physical_user_id.telephone_principal  
      }  
    }));           
            
    res.json({            
      success: true,            
      count: employeesData.length,            
      data: employeesData            
    });            
  } catch (error) {            
    res.status(500).json({             
      success: false,            
      error: error.message             
    });            
  }            
});            
            
// GET - Récupérer un employé par ID            
app.get('/api/employees/:id', authenticateToken, async (req, res) => {          
  try {          
    const employee = await Employe.findById(req.params.id)          
      .populate({          
        path: 'physical_user_id',          
        populate: {      
          path: 'user_id',   
          select: 'email'  
        }     
      });          
                
    if (!employee) {          
      return res.status(404).json({ success: false, message: 'Employé non trouvé' });          
    }          
              
    res.json({ success: true, data: employee });          
  } catch (error) {          
    res.status(500).json({ success: false, error: error.message });          
  }          
});          
          
// POST - Créer un nouvel employé          
app.post('/api/employees', authenticateToken, async (req, res) => {                
  try {                
    console.log('🔍 === DÉBUT CRÉATION EMPLOYÉ ===');  
    console.log('📥 Body reçu:', JSON.stringify(req.body, null, 2));  
      
    const { profile, fonction, statut } = req.body;                
      
    console.log('📋 Données extraites:');  
    console.log('  - profile:', profile);  
    console.log('  - fonction:', fonction);  
    console.log('  - statut:', statut);  
      
    // Validation CIN/CNSS avec logs détaillés  
    console.log('🔍 Validation CIN/CNSS:');  
    console.log('  - profile.cin:', profile?.cin);  
    console.log('  - profile.cnss:', profile?.cnss);  
    console.log('  - Type profile.cin:', typeof profile?.cin);  
    console.log('  - Type profile.cnss:', typeof profile?.cnss);  
      
    if (!profile?.cin || !profile?.cnss) {    
      console.log('❌ Validation échouée: CIN ou CNSS manquant');  
      return res.status(400).json({     
        success: false,     
        message: 'CIN et CNSS sont obligatoires pour un employé'     
      });    
    }  
      
    console.log('✅ Validation CIN/CNSS réussie');  
                    
    // Déterminer le rôle selon la fonction              
    let roleCode = 'EMPLOYE';                
    if (fonction === 'MAGASINIER') {                
      roleCode = 'EMPLOYE_MAGASIN';                
    }                
      
    console.log('🎭 Rôle déterminé:', roleCode);  
                    
    const roleEmploye = await Role.findOne({ code: roleCode });                
    if (!roleEmploye) {                
      console.log('❌ Rôle non trouvé:', roleCode);  
      return res.status(400).json({ success: false, message: `Rôle ${roleCode} non trouvé` });                
    }                
      
    console.log('✅ Rôle trouvé:', roleEmploye);  
                
    const bcrypt = require('bcrypt');                
    const defaultPassword = 'ChronoGaz2024';                
    const saltRounds = 10;                
    const hashedPassword = await bcrypt.hash(defaultPassword, saltRounds);                
      
    console.log('🔐 Mot de passe hashé généré');  
                    
    const newUser = new User({                    
      email: profile.email,                    
      password_hash: hashedPassword,                    
      role_id: roleEmploye._id,              
      password_temporary: true,              
      first_login: true,    
      statut: 'ACTIF',          
      email_verified: true,
      created_by_admin: true       
    });            
      
    console.log('👤 Objet User créé:', {  
      email: newUser.email,  
      role_id: newUser.role_id,  
      statut: newUser.statut  
    });  
      
    const savedUser = await newUser.save();              
    console.log('✅ User sauvegardé avec ID:', savedUser._id);  
              
    // Créer l'utilisateur physique              
    const physicalUserData = {        
      user_id: savedUser._id,        
      first_name: profile.first_name,        
      last_name: profile.last_name,        
      civilite: profile.civilite || 'M',        
      telephone_principal: profile.telephone_principal,        
      city_id: profile.city_id || null,      
      adresse_principale: profile.adresse_principale        
    };  
      
    console.log('👥 Données PhysicalUser:', physicalUserData);  
      
    const physicalUser = new PhysicalUser(physicalUserData);                 
    const savedPhysical = await physicalUser.save();              
    console.log('✅ PhysicalUser sauvegardé avec ID:', savedPhysical._id);  
              
    // Créer l'employé avec tous les champs              
    const employeeData = {                  
      physical_user_id: savedPhysical._id,                  
      matricule: `EMP${(Date.now()).toString().padStart(6, '0')}`,              
      cin: profile.cin,                
      cnss: profile.cnss,              
      fonction,                  
      date_embauche: new Date(),                  
      statut: statut || 'ACTIF',    
      depot_id: req.body.depot_id || null  
    };         
      
    console.log('👷 Données Employe à sauvegarder:', employeeData);  
    console.log('🔍 Validation des champs requis pour Employe:');  
    console.log('  - physical_user_id:', employeeData.physical_user_id);  
    console.log('  - matricule:', employeeData.matricule);  
    console.log('  - cin:', employeeData.cin);  
    console.log('  - cnss:', employeeData.cnss);  
    console.log('  - fonction:', employeeData.fonction);  
    console.log('  - date_embauche:', employeeData.date_embauche);  
      
    const employee = new Employe(employeeData);  
      
    console.log('📝 Tentative de sauvegarde Employe...');  
    const savedEmployee = await employee.save();              
    console.log('✅ Employe sauvegardé avec ID:', savedEmployee._id);  
      
    const populatedEmployee = await Employe.findById(savedEmployee._id)              
      .populate({      
        path: 'physical_user_id',                
        populate: {        
          path: 'user_id',     
          select: 'email'    
        }          
      });                
      
    console.log('✅ === CRÉATION EMPLOYÉ RÉUSSIE ===');  
    res.json({ success: true, data: populatedEmployee });                
  } catch (error) {                
    console.error('❌ === ERREUR CRÉATION EMPLOYÉ ===');  
    console.error('Type d\'erreur:', error.constructor.name);  
    console.error('Message:', error.message);  
    console.error('Code d\'erreur:', error.code);  
    console.error('Stack:', error.stack);  
      
    // Logs spécifiques pour les erreurs MongoDB  
    if (error.name === 'MongoServerError' && error.code === 121) {  
      console.error('🔍 Détails validation MongoDB:');  
      console.error('  - errInfo:', error.errInfo);  
      console.error('  - details:', error.errInfo?.details);  
    }  
      
    // Logs spécifiques pour les erreurs Mongoose  
    if (error.name === 'ValidationError') {  
      console.error('🔍 Erreurs de validation Mongoose:');  
      Object.keys(error.errors).forEach(field => {  
        console.error(`  - ${field}:`, error.errors[field].message);  
      });  
    }  
      
    res.status(400).json({ success: false, message: error.message });                
  }                
});

app.get('/api/debug/employes-validator', async (req, res) => {    
  try {    
    const db = mongoose.connection.db;    
    const collections = await db.listCollections({ name: 'employes' }).toArray();    
        
    if (collections.length > 0) {     
      res.json({    
        success: true,    
        validator: collections[0].options?.validator,  
        collectionInfo: collections[0]  
      });    
    } else {    
      res.json({    
        success: false,    
        message: 'Collection employes non trouvée'    
      });    
    }    
  } catch (error) {    
    res.status(500).json({    
      success: false,    
      error: error.message    
    });    
  }    
});
            
// PUT - Mettre à jour un employé            
app.put('/api/employees/:id', authenticateToken, async (req, res) => {                
  try {                
    const { profile, fonction, statut } = req.body;                
    const employee = await Employe.findById(req.params.id)                
      .populate('physical_user_id');                
                
    if (!employee) {                
      return res.status(404).json({ success: false, message: 'Employé non trouvé' });                
    }                
                
    // Mettre à jour les données de l'employé                
    if (fonction) employee.fonction = fonction;                
    if (statut !== undefined) employee.statut = statut;            
    if (profile.cin !== undefined) employee.cin = profile.cin;            
    if (profile.cnss !== undefined) employee.cnss = profile.cnss;         
    if (req.body.depot_id !== undefined) employee.depot_id = req.body.depot_id;    
    await employee.save();               
                
    // Mettre à jour l'email dans User si fourni            
    if (profile?.email && employee.physical_user_id) {            
      await User.findByIdAndUpdate(employee.physical_user_id.user_id, {             
        email: profile.email             
      });            
    }            
                
    // Mettre à jour les données physiques               
    if (profile && employee.physical_user_id) {                
      const updateFields = {            
        first_name: profile.first_name,                
        last_name: profile.last_name,                
        civilite: profile.civilite,            
        telephone_principal: profile.telephone_principal,                
        city_id: profile.city_id,    
        adresse_principale: profile.adresse_principale            
      };            
      await PhysicalUser.findByIdAndUpdate(employee.physical_user_id._id, updateFields);                
    }               
                
    const updatedEmployee = await Employe.findById(req.params.id)                
      .populate({                
        path: 'physical_user_id',                
        populate: {      
          path: 'user_id',   
          select: 'email'  
        }     
      });                
                
    res.json({ success: true, data: updatedEmployee });                
  } catch (error) {                
    res.status(400).json({ success: false, message: error.message });                
  }                
});          
            
// DELETE - Supprimer un employé            
app.delete('/api/employees/:id', authenticateToken, async (req, res) => {            
  try {            
    const employee = await Employe.findById(req.params.id);              
    if (!employee) {              
      return res.status(404).json({ success: false, message: 'Employé non trouvé' });              
    }              
              
    // Supprimer les données liées              
    if (employee.physical_user_id) {              
      const physicalUser = await PhysicalUser.findById(employee.physical_user_id);              
      if (physicalUser) {              
        await User.findByIdAndDelete(physicalUser.user_id);              
        await PhysicalUser.findByIdAndDelete(employee.physical_user_id);              
      }              
    }              
              
    await Employe.findByIdAndDelete(req.params.id);              
    res.json({ success: true, message: 'Employé supprimé avec succès' });              
  } catch (error) {              
    res.status(400).json({ success: false, message: error.message });              
  }              
});              
              
// Route protégée pour tester les camions                  
app.get('/api/trucks', authenticateToken, async (req, res) => {                    
  try {                    
    const trucks = await Truck.find({ status: { $ne: 'Hors service' } });                    
    res.json({                    
      success: true,                    
      count: trucks.length,                    
      data: trucks                    
    });                    
  } catch (error) {                    
    res.status(500).json({                     
      success: false,                    
      error: error.message                     
    });                    
  }                    
});              
      
// Route création adresse    
app.post('/api/address', authenticateToken, async (req, res) => {        
  try {        
    const newAddress = new Address(req.body);        
    const savedAddress = await newAddress.save();        
            
    const populatedAddress = await Address.findById(savedAddress._id)        
      .populate('city_id');        
            
    res.status(201).json({        
      success: true,        
      message: 'Adresse créée avec succès',        
      data: populatedAddress        
    });        
  } catch (error) {        
    console.error('Erreur création adresse:', error);        
    res.status(500).json({        
      success: false,        
      message: 'Erreur serveur lors de la création de l\'adresse',        
      error: error.message        
    });        
  }        
});        
         
// Route protégée pour les statistiques générales                  
app.get('/api/stats', authenticateToken, async (req, res) => {                    
  try {                    
    const stats = {                      
      users: await User.countDocuments(),                      
      customers: await Customer.countDocuments(),                      
      products: await Product.countDocuments({ actif: true }),                      
      trucks: await Truck.countDocuments({ status: { $ne: 'Hors service' } }),            
      roles: await Role.countDocuments({ actif: true }),    
      commands: await Command.countDocuments(),    
      planifications: await Planification.countDocuments(),
      livraisons: await Livraison.countDocuments(), 
      addresses: await Address.countDocuments({ actif: true }),    
      cities: await City.countDocuments({ actif: true })    
    };                    
                        
    res.json({                    
      success: true,                    
      data: stats,                    
      timestamp: new Date().toISOString()                    
    });                    
  } catch (error) {                    
    res.status(500).json({                     
      success: false,                    
      error: error.message                     
    });                    
  }                    
});                 
                
// Gestion des erreurs 404                  
app.use('*', (req, res) => {                  
  res.status(404).json({                  
    success: false,                  
    message: 'Route non trouvée',                  
    availableRoutes: [                  
      'POST /api/auth/register',                
      'POST /api/auth/login',                
      'GET /api/health',                  
      'GET /api/stats (protégée)',  
        
      // Routes utilisateurs (nouveaux routers)  
      'GET /api/users/profile (protégée)',  
      'PUT /api/users/profile (protégée)',  
      'PUT /api/users/change-password (protégée)',  
      'GET /api/users (admin)',  
      'GET /api/users/stats (admin)',  
      'GET /api/users/:id (admin)',  
      'PUT /api/users/:id/status (admin)',  
      'DELETE /api/users/:id (admin)',  
        
      // Routes clients (nouveaux routers)  
      'GET /api/customer/:id (protégée)',  
      'GET /api/customer/:id/addresses (protégée)',  
      'GET /api/customer (admin)',  
      'GET /api/customer/stats/overview (admin)',  
      'POST /api/customer/physical (admin)',  
      'POST /api/customer/moral (admin)',  
      'PUT /api/customer/:id (admin)',  
      'DELETE /api/customer/:id (admin)',  
        
      // Routes adresses (nouveaux routers)  
      'POST /api/addresses (protégée)',  
      'GET /api/addresses/:id (protégée)',  
      'PUT /api/addresses/:id (protégée)',  
      'DELETE /api/addresses/:id (protégée)',  
      'GET /api/addresses/user/:userId (protégée)',  
      'POST /api/addresses/customer/:customerId (protégée)',  
        
      // Routes localisation (nouveaux routers)  
      'GET /api/locations/cities',  
      'GET /api/locations/cities/search',  
      'GET /api/locations/cities/:id',  
      'POST /api/locations/cities (admin)',  
      'PUT /api/locations/cities/:id (admin)',  
      'DELETE /api/locations/cities/:id (admin)',  
      'GET /api/locations/cities/stats/overview (admin)',  
      'POST /api/locations/geocode (protégée)',  
        
      // Routes commandes (nouveaux routers)  
      'GET /api/commands (protégée)',  
      'GET /api/commands/stats (protégée)',  
      'GET /api/commands/customer/:customerId/stats (protégée)',  
      'GET /api/commands/customer/:customerId (protégée)',  
      'GET /api/commands/:id (protégée)',  
      'POST /api/commands (protégée)',  
      'PUT /api/commands/:id (protégée)',  
      'PUT /api/commands/:id/status (protégée)',  
      'PUT /api/commands/:id/cancel (protégée)',  
      'DELETE /api/commands/:id (admin)',  
        
      // Routes clients CRUD (conservées inline)  
      'GET /api/customers (protégée)',              
      'POST /api/customers (protégée)',              
      'PUT /api/customers/:id (protégée)',              
      'DELETE /api/customers/:id (protégée)',              
      'GET /api/customers/:id (protégée)',            
      'GET /api/customers/company/:companyId (protégée)',            
      'POST /api/customers/company (protégée)',            
        
      // Routes employés CRUD (conservées inline)  
      'GET /api/employees (protégée)',              
      'POST /api/employees (protégée)',              
      'PUT /api/employees/:id (protégée)',              
      'DELETE /api/employees/:id (protégée)',              
      'GET /api/employees/:id (protégée)',              
        
      // Routes livraisons  
      'GET/POST/PUT/DELETE /api/livraisons (protégée)', 
        
      // Routes métier existantes  
      'GET/POST/PUT/DELETE /api/depots (protégée)',          
      'GET/POST/PUT/DELETE /api/stock (protégée)',           
      'GET/POST/PUT/DELETE /api/products (protégée)',          
      'GET/POST/PUT/DELETE /api/trucks (protégée)',          
      'GET /api/admin/clients (admin)',          
      'GET /api/admin/employees (admin)',          
      'POST/PUT/DELETE /api/admin/users (admin)',        
      'GET/POST/PUT/DELETE /api/reports (protégée)',          
      'GET /api/reports/dashboard (protégée)',          
      'GET /api/reports/inventory (protégée)',          
      'GET /api/reports/export/products (protégée)',          
      'GET/POST/PUT/DELETE /api/stock-depots (protégée)',          
      'GET/POST/PUT/DELETE /api/stock-lines (protégée)',          
      'GET/POST/PUT/DELETE /api/ums (protégée)',  
      'GET/POST/PUT/DELETE /api/listeprix (protégée)',  
      'POST /api/address (protégée)'                
                ]                  
  });                  
});                  
                
// Gestion globale des erreurs                  
app.use((err, req, res, next) => {                  
  console.error('Erreur serveur:', err.stack);                  
  res.status(500).json({                  
    success: false,                  
    message: 'Erreur interne du serveur',                  
    error: process.env.NODE_ENV === 'development' ? err.message : 'Une erreur est survenue'                  
  });                  
});                  
            
const PORT = process.env.PORT || 5000;                  
                
server.listen(PORT, () => {                  
  console.log(`🚀 ChronoGaz server running on port ${PORT}`);                  
  console.log(`📊 MongoDB connected to chronogaz_db`);                  
  console.log(`🔗 API Health: http://localhost:${PORT}/api/health`);                  
  console.log(`🔐 Auth Register: http://localhost:${PORT}/api/auth/register`);                
  console.log(`🔐 Auth Login: http://localhost:${PORT}/api/auth/login`);                
  console.log(`📈 API Stats: http://localhost:${PORT}/api/stats`);        
  console.log(`👥 Users API: http://localhost:${PORT}/api/users`);  
  console.log(`🏠 Addresses API: http://localhost:${PORT}/api/addresses`);  
  console.log(`👤 Customers API: http://localhost:${PORT}/api/customer`);  
  console.log(`🌍 Locations API: http://localhost:${PORT}/api/locations`);  
  console.log(`📦 Commands API: http://localhost:${PORT}/api/commands`);        
  console.log(`🚚 Livraisons API: http://localhost:${PORT}/api/livraisons`);  
  console.log(`🏪 Depots API: http://localhost:${PORT}/api/depots`);  
  console.log(`📊 Stock API: http://localhost:${PORT}/api/stock`);  
  console.log(`📦 Products API: http://localhost:${PORT}/api/products`);  
  console.log(`🚛 Trucks API: http://localhost:${PORT}/api/trucks`);  
  console.log(`👨‍💼 Admin API: http://localhost:${PORT}/api/admin`);  
  console.log(`📋 Reports API: http://localhost:${PORT}/api/reports`);  
  console.log(`📦 Stock Depots API: http://localhost:${PORT}/api/stock-depots`);  
  console.log(`📝 Stock Lines API: http://localhost:${PORT}/api/stock-lines`);  
  console.log(`📏 Units API: http://localhost:${PORT}/api/ums`);  
  console.log(`💰 Price Lists API: http://localhost:${PORT}/api/listeprix`);  
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);                  
});