/**
 * ⚠️ SECRETS HARDCODÉS - TESTS SAST UNIQUEMENT
 * NE JAMAIS UTILISER EN PRODUCTION
 */

// 1. API Keys hardcodées - CRITIQUE
const HARDCODED_API_KEY = 'sk-1234567890abcdef';
const AWS_ACCESS_KEY = 'AKIAIOSFODNN7EXAMPLE';

// 2. Credentials hardcodés - CRITIQUE
const ADMIN_PASSWORD = 'admin123';
const JWT_SECRET_FALLBACK = 'super_secret_key_123';

// 3. Fonction avec mot de passe faible
const generateTempPassword = () => {
  return '12345678'; // VULNÉRABLE
};

// 4. Utilisation non sécurisée d'eval
const dangerousEval = (code) => {
  return eval(code); // VULNÉRABLE
};

module.exports = {
  HARDCODED_API_KEY,
  AWS_ACCESS_KEY,
  ADMIN_PASSWORD,
  generateTempPassword,
  dangerousEval
};