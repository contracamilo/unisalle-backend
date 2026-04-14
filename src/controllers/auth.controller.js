const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Role } = require('../models');

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

const formatUser = (user, req) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image ? `${baseUrl}/uploads/${user.image}` : null,
    active: user.active,
    roles: user.Roles ? user.Roles.map((r) => r.name) : [],
    createdAt: user.createdAt,
  };
};

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password, roles } = req.body;

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ ok: false, message: 'El correo ya está registrado.' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed });

    // Asignar roles (default: 'user')
    const roleNames = roles && roles.length > 0 ? roles : ['user'];
    const roleRecords = await Role.findAll({ where: { name: roleNames } });
    await user.setRoles(roleRecords);

    const fullUser = await User.findByPk(user.id, { include: Role });
    const token = generateToken(user.id);

    return res.status(201).json({
      ok: true,
      message: 'Usuario registrado exitosamente.',
      token,
      user: formatUser(fullUser, req),
    });
  } catch (error) {
    console.error('Error en register:', error);
    return res.status(500).json({ ok: false, message: 'Error interno del servidor.' });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email }, include: Role });
    if (!user) {
      return res.status(401).json({ ok: false, message: 'Credenciales incorrectas.' });
    }

    if (!user.active) {
      return res.status(403).json({ ok: false, message: 'Usuario inactivo. Contacte al administrador.' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ ok: false, message: 'Credenciales incorrectas.' });
    }

    const token = generateToken(user.id);

    return res.status(200).json({
      ok: true,
      message: 'Login exitoso.',
      token,
      user: formatUser(user, req),
    });
  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).json({ ok: false, message: 'Error interno del servidor.' });
  }
};

module.exports = { register, login, formatUser };
