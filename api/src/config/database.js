/*connection à la base de données*/
const mongoose = require('mongoose');  
  
const mongoURI = process.env.MONGODB_URI;  
  
const connectDB = async () => {  
  try {  
    await mongoose.connect(mongoURI, {   
      useNewUrlParser: true,   
      useUnifiedTopology: true   
    });  
    console.log('MongoDB connected to ChronoGaz database');  
  } catch (err) {  
    console.error('MongoDB connection error:', err);  
    process.exit(1);  
  }  
};  
  
module.exports = connectDB;