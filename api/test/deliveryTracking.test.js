// Test file for delivery tracking functionality
const request = require('supertest');
const app = require('../src/server');
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
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chronogaz_test', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Create test user
    testUser = new User({
      email: 'test@example.com',
      password_hash: '$2b$10$examplehash',
      role_id: '64a1b2c3d4e5f67890123456', // Placeholder role ID
      statut: 'ACTIF'
    });
    await testUser.save();

    // Create test employee
    testEmploye = new Employe({
      physical_user_id: '64a1b2c3d4e5f67890123457', // Placeholder user ID
      matricule: 'EMP001',
      fonction: 'CHAUFFEUR',
      statut: 'ACTIF'
    });
    await testEmploye.save();

    // Create test commande
    testCommande = new Commande({
      customer_id: '64a1b2c3d4e5f67890123458', // Placeholder customer ID
      address_id: '64a1b2c3d4e5f67890123459', // Placeholder address ID
      details: 'Test command',
      montant_total: 100,
      date_commande: new Date()
    });
    await testCommande.save();

    // Create test planification
    testPlanification = new Planification({
      commande_id: testCommande._id,
      trucks_id: '64a1b2c3d4e5f67890123460', // Placeholder truck ID
      livreur_employee_id: testEmploye._id,
      delivery_date: new Date(),
      priority: 'medium',
      etat: 'PLANIFIE'
    });
    await testPlanification.save();

    // Create test livraison
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

    // Create a mock auth token
    authToken = 'mock-jwt-token';
  });

  afterAll(async () => {
    // Clean up test data
    await Livraison.deleteMany({});
    await Planification.deleteMany({});
    await Commande.deleteMany({});
    await Employe.deleteMany({});
    await User.deleteMany({});
    
    await mongoose.connection.close();
  });

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