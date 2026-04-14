const { Router } = require('express');
const { getMe, updateUser, updateImage, getUsers } = require('../controllers/user.controller');
const { verifyToken, requireRole } = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');

const router = Router();

// GET /api/users/me — info del usuario autenticado
router.get('/me', verifyToken, getMe);

// GET /api/users — listar todos (solo admin)
router.get('/', verifyToken, requireRole('admin'), getUsers);

// PUT /api/users/:id — actualizar datos
router.put('/:id', verifyToken, updateUser);

// PUT /api/users/:id/image — actualizar imagen
router.put('/:id/image', verifyToken, upload.single('image'), updateImage);

module.exports = router;
