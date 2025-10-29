/**
 * ⚠️ ROUTES VULNÉRABLES - TESTS ACADÉMIQUES UNIQUEMENT
 * NE JAMAIS UTILISER EN PRODUCTION
 */

const express = require('express');
const router = express.Router();
const cors = require('cors');

// 1. XSS (Cross-Site Scripting) - CRITIQUE
router.get('/search', (req, res) => {
  const { query } = req.query;
  // VULNÉRABLE : Pas d'échappement HTML
  res.send(`
    <html>
      <body><h1>Résultats pour: ${query}</h1></body>
    </html>
  `);
});

// 2. Authentification Faible - HAUT RISQUE
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const weakPasswords = ['admin', '123456', 'password'];

  if (weakPasswords.includes(password)) {
    return res.json({
      success: true,
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.fake-token',
      user: { email, role: 'admin' }
    });
  }
  res.status(401).json({ success: false });
});

// 3. NoSQL Injection - CRITIQUE
router.get('/user', async (req, res) => {
  const { email } = req.query;
  // VULNÉRABLE : Pas de validation, injection possible
  // Attaque possible : ?email[$ne]=null
  res.json({
    vulnerable: true,
    query: { email: email },
    example_attack: '?email[$ne]=null'
  });
});

// 4. Information Disclosure - MOYEN
router.get('/debug', (req, res) => {
  res.json({
    nodeEnv: process.env.NODE_ENV,
    platform: process.platform,
    memory: process.memoryUsage(),
    secrets: {
      dbConnected: !!process.env.MONGO_URI,
      jwtConfigured: !!process.env.JWT_SECRET
    }
  });
});

// 5. CORS Mal Configuré - MOYEN
router.get('/cors-test',
  cors({ origin: '*', credentials: true }),
  (req, res) => {
    res.json({
      vulnerable: true,
      message: 'CORS misconfigured endpoint'
    });
  }
);

module.exports = router;