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
  }, 60000);  // Timeout de 60 secondes  
    
  afterAll(async () => {    
    // Fermer uniquement si connecté  
    if (mongoose.connection.readyState !== 0) {  
      await mongoose.connection.close();  
    }  
  }, 60000);  
    
  test('POST /api/auth/login avec credentials invalides devrait retourner 401', async () => {    
    const response = await request(app)    
      .post('/api/auth/login')    
      .send({    
        email: 'invalid@example.com',    
        password: 'wrongpassword'    
      });    
        
    expect(response.status).toBe(401);    
  });    
});