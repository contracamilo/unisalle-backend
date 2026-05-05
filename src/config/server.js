const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const authRoutes = require('../routes/auth.routes');
const userRoutes = require('../routes/user.routes');

const app = express();

// Cabeceras de seguridad. crossOriginResourcePolicy se relaja a "cross-origin"
// para que los <img> de la app Flutter (otro origen) puedan cargar /uploads.
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS — abierto para clientes móviles en dev. En prod debe restringirse
// a dominios conocidos (ver README §CORS en producción).
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Parseo de JSON y formularios
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logger HTTP
app.use(morgan('dev'));

// Servir imágenes estáticas con URL completa
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    status: 'running',
    timestamp: new Date().toISOString(),
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({ ok: false, message: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
});

// Error handler global
app.use((err, req, res, next) => {
  console.error(err);
  if (err.name === 'MulterError') {
    return res.status(400).json({ ok: false, message: err.message });
  }
  res.status(500).json({ ok: false, message: err.message || 'Error interno del servidor.' });
});

module.exports = app;
