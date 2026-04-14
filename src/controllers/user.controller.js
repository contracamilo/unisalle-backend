const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const { User, Role } = require('../models');
const { formatUser } = require('./auth.controller');

// GET /api/users/me  — usuario autenticado
const getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, { include: Role });
    return res.status(200).json({
      ok: true,
      user: formatUser(user, req),
    });
  } catch (error) {
    console.error('Error en getMe:', error);
    return res.status(500).json({ ok: false, message: 'Error interno del servidor.' });
  }
};

// PUT /api/users/:id  — actualizar datos básicos
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Solo el propio usuario o un admin puede modificar
    const isAdmin = req.user.Roles.some((r) => r.name === 'admin');
    if (req.user.id !== parseInt(id) && !isAdmin) {
      return res.status(403).json({ ok: false, message: 'No tienes permiso para modificar este usuario.' });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ ok: false, message: 'Usuario no encontrado.' });
    }

    const { name, email, password, roles } = req.body;

    if (name)  user.name = name;
    if (email) {
      const conflict = await User.findOne({ where: { email } });
      if (conflict && conflict.id !== user.id) {
        return res.status(400).json({ ok: false, message: 'El correo ya está en uso.' });
      }
      user.email = email;
    }
    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();

    // Solo admin puede cambiar roles
    if (roles && isAdmin) {
      const roleRecords = await Role.findAll({ where: { name: roles } });
      await user.setRoles(roleRecords);
    }

    const updated = await User.findByPk(user.id, { include: Role });
    return res.status(200).json({
      ok: true,
      message: 'Usuario actualizado.',
      user: formatUser(updated, req),
    });
  } catch (error) {
    console.error('Error en updateUser:', error);
    return res.status(500).json({ ok: false, message: 'Error interno del servidor.' });
  }
};

// PUT /api/users/:id/image  — actualizar imagen
const updateImage = async (req, res) => {
  try {
    const { id } = req.params;

    const isAdmin = req.user.Roles.some((r) => r.name === 'admin');
    if (req.user.id !== parseInt(id) && !isAdmin) {
      return res.status(403).json({ ok: false, message: 'No tienes permiso para modificar este usuario.' });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ ok: false, message: 'Usuario no encontrado.' });
    }

    if (!req.file) {
      return res.status(400).json({ ok: false, message: 'No se proporcionó ninguna imagen.' });
    }

    // Eliminar imagen anterior si existe
    if (user.image) {
      const oldPath = path.join(__dirname, '../../uploads', user.image);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    user.image = req.file.filename;
    await user.save();

    const updated = await User.findByPk(user.id, { include: Role });
    const baseUrl = `${req.protocol}://${req.get('host')}`;

    return res.status(200).json({
      ok: true,
      message: 'Imagen actualizada.',
      imageUrl: `${baseUrl}/uploads/${user.image}`,
      user: formatUser(updated, req),
    });
  } catch (error) {
    console.error('Error en updateImage:', error);
    return res.status(500).json({ ok: false, message: 'Error interno del servidor.' });
  }
};

// GET /api/users  — listar usuarios (solo admin)
const getUsers = async (req, res) => {
  try {
    const users = await User.findAll({ include: Role });
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    return res.status(200).json({
      ok: true,
      users: users.map((u) => formatUser(u, req)),
    });
  } catch (error) {
    console.error('Error en getUsers:', error);
    return res.status(500).json({ ok: false, message: 'Error interno del servidor.' });
  }
};

module.exports = { getMe, updateUser, updateImage, getUsers };
