require('dotenv').config();
const app = require('./src/config/server');
const { syncDatabase } = require('./src/models');

const PORT = process.env.PORT || 3000;

const start = async () => {
  try {
    await syncDatabase();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Servidor corriendo en http://0.0.0.0:${PORT}`);
      console.log(`Entorno: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

start();
