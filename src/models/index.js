const sequelize = require('../config/database');
const User = require('./User');
const Role = require('./Role');

// Many-to-many: User <-> Role
User.belongsToMany(Role, {
  through: 'user_roles',
  foreignKey: 'userId',
  otherKey: 'roleId',
});

Role.belongsToMany(User, {
  through: 'user_roles',
  foreignKey: 'roleId',
  otherKey: 'userId',
});

const syncDatabase = async () => {
  await sequelize.sync({ alter: true });
  console.log('Base de datos sincronizada.');

  // Seed de roles por defecto
  const roles = ['admin', 'user', 'moderator'];
  for (const name of roles) {
    await Role.findOrCreate({
      where: { name },
      defaults: { description: `Rol ${name}` },
    });
  }
  console.log('Roles por defecto creados.');
};

module.exports = { sequelize, User, Role, syncDatabase };
