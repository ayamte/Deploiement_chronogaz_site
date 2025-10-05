const request = require('supertest');  
const mongoose = require('mongoose');  
const app = require('../app');  
const User = require('../models/User');  
const Role = require('../models/Role');      
      
describe('Authentication API', () => {      
  beforeAll(async () => {      
    // Connexion MongoDB uniquement si pas déjà connectée    
    if (mongoose.connection.readyState === 0) {    
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://root:chronogaz123@localhost:27017/chronogaz_db?authSource=admin');      
    }  
  }, 60000);      
      
  afterAll(async () => {      
    // Fermer uniquement si connecté  
    if (mongoose.connection.readyState !== 0) {  
      await mongoose.connection.close();      
    }  
  }, 60000);      
      
  test('GET /api/health devrait retourner 200', async () => {      
    const response = await request(app).get('/api/health');      
    expect(response.status).toBe(200);      
  });      
});