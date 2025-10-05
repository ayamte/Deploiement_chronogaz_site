const request = require('supertest');  
const app = require('../src/app');  
const mongoose = require('mongoose');  
const Livraison = require('../src/models/Livraison');  
const Planification = require('../src/models/Planification');  
const Commande = require('../src/models/Commande');  
const Employe = require('../src/models/Employe');  
const User = require('../src/models/User');  
  
describe('Delivery Tracking API', () => {  
  let testLivraison;  
  let testPlanification;  
  let testCommande;  
  let testEmploye;  
  let testUser;  
  let authToken;  
  
  beforeAll(async () => {  
    // Connexion MongoDB uniquement si pas déjà connectée  
    if (mongoose.connection.readyState === 0) {  
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://root:chronogaz123@localhost:27017/chronogaz_test');  
    }  
  
    // Create test data...  
    testUser = new User({  
      email: 'test@example.com',  
      password_hash: '$2b$10$examplehash',  
      role_id: '64a1b2c3d4e5f67890123456',  
      statut: 'ACTIF'  
    });  
    await testUser.save();  
  
    testEmploye = new Employe({  
      physical_user_id: '64a1b2c3d4e5f67890123457',  
      matricule: 'EMP001',  
      fonction: 'CHAUFFEUR',  
      statut: 'ACTIF'  
    });  
    await testEmploye.save();  
  
    testCommande = new Commande({  
      customer_id: '64a1b2c3d4e5f67890123458',  
      address_id: '64a1b2c3d4e5f67890123459',  
      details: 'Test command',  
      montant_total: 100,  
      date_commande: new Date()  
    });  
    await testCommande.save();  
  
    testPlanification = new Planification({  
      commande_id: testCommande._id,  
      trucks_id: '64a1b2c3d4e5f67890123460',  
      livreur_employee_id: testEmploye._id,  
      delivery_date: new Date(),  
      priority: 'medium',  
      etat: 'PLANIFIE'  
    });  
    await testPlanification.save();  
  
    testLivraison = new Livraison({  
      planification_id: testPlanification._id,  
      date: new Date(),  
      livreur_employee_id: testEmploye._id,  
      trucks_id: testPlanification.trucks_id,  
      etat: 'EN_COURS',  
      latitude: 33.5731,  
      longitude: -7.5898,  
      total: testCommande.montant_total,  
      total_ttc: testCommande.montant_total,  
      total_tva: 0  
    });  
    await testLivraison.save();  
  
    authToken = 'mock-jwt-token';  
  }, 60000);  
  
  afterAll(async () => {  
    // Clean up test data  
    await Livraison.deleteMany({});  
    await Planification.deleteMany({});  
    await Commande.deleteMany({});  
    await Employe.deleteMany({});  
    await User.deleteMany({});  
      
    // Fermer uniquement si connecté  
    if (mongoose.connection.readyState !== 0) {  
      await mongoose.connection.close();  
    }  
  }, 60000);  
  
  describe('GET /api/livraisons/:id/track', () => {  
    it('should return delivery tracking data', async () => {  
      const response = await request(app)  
        .get(`/api/livraisons/${testLivraison._id}/track`)  
        .set('Authorization', `Bearer ${authToken}`)  
        .expect(200);  
  
      expect(response.body.success).toBe(true);  
      expect(response.body.data).toHaveProperty('livraison_id');  
      expect(response.body.data).toHaveProperty('statut_livraison');  
      expect(response.body.data).toHaveProperty('date_livraison');  
    });  
  });  
});