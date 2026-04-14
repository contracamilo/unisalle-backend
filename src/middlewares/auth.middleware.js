const jwt = require('jsonwebtoken');
const { User, Role } = require('../models');

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ ok: false, message: 'Token no proporcionado.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id, { include: Role });

    if (!user) {
      return res.status(401).json({ ok: false, message: 'Token inválido: usuario no encontrado.' });
    }

    if (!user.active) {
      return res.status(403).json({ ok: false, message: 'Usuario inactivo.' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ ok: false, message: 'Token expirado.' });
    }
    return res.status(401).json({ ok: false, message: 'Token inválido.' });
  }
};

// Middleware para verificar rol específico
const requireRole = (...roleNames) => {
  return (req, res, next) => {
    const userRoles = req.user.Roles.map((r) => r.name);
    const hasRole = roleNames.some((role) => userRoles.includes(role));
    if (!hasRole) {
      return res.status(403).json({
        ok: false,
        message: `Acceso denegado. Se requiere uno de los roles: ${roleNames.join(', ')}.`,
      });
    }
    next();
  };
};

module.exports = { verifyToken, requireRole };
