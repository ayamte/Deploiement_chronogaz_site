const http = require('http');  
const socketIo = require('socket.io');  
const app = require('./app');  
const connectDB = require('./config/database');  
const setupWebSocket = require('./middleware/websocket');  
  
require('dotenv').config();  
  
// Connexion à MongoDB        
connectDB();        
  
const server = http.createServer(app);  
  
// Configuration Socket.IO  
const io = socketIo(server, {  
  cors: {  
    origin: process.env.FRONTEND_URL || "http://localhost:3000",  
    methods: ["GET", "POST", "PUT", "DELETE"]  
  }  
});  
  
// Middleware pour Socket.IO dans les routes  
app.use((req, res, next) => {  
  req.io = io;  
  next();  
});  
  
// Setup WebSocket  
setupWebSocket(io);  
  
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
  
module.exports = server;