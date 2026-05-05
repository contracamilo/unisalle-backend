const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const { register, login } = require('../controllers/auth.controller');
const { registerRules, loginRules } = require('../validators/auth.validator');

const router = Router();

// Rate limit en /api/auth/* para mitigar fuerza bruta y abuso de registro.
// 10 intentos / 15 min por IP es generoso para dev y suficientemente estricto
// para detener scripts triviales. La respuesta 429 evita revelar si el email
// existe o no.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, message: 'Demasiados intentos. Intenta de nuevo en unos minutos.' },
});

// POST /api/auth/register
router.post('/register', authLimiter, registerRules, register);

// POST /api/auth/login
router.post('/login', authLimiter, loginRules, login);

module.exports = router;
