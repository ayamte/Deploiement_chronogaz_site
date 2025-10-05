const mongoose = require('mongoose');    
    
const mongoURI = process.env.MONGODB_URI;    
    
const connectDB = async () => {    
  try {  
    // Éviter les connexions multiples  
    if (mongoose.connection.readyState === 0) {  
      await mongoose.connect(mongoURI);  
      console.log('MongoDB connected to ChronoGaz database');  
    }  
  } catch (err) {    
    console.error('MongoDB connection error:', err);    
    // Ne pas appeler process.exit en environnement de test  
    if (process.env.NODE_ENV !== 'test') {  
      process.exit(1);    
    } else {  
      throw err;  
    }  
  }    
};    
    
module.exports = connectDB;