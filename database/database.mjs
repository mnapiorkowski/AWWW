import { Sequelize } from 'sequelize';
import { trip, reservation } from './tables.mjs';

export const getDb = async (sequelize) => {
  try {
    await sequelize.authenticate();
    console.log('Connection to the database has been established successfully.');
    const db = {};
    sequelize.drop();
    db.sequelize = sequelize;
    db.Trip = trip(sequelize);
    db.Reservation = reservation(sequelize);

    db.Trip.hasMany(db.Reservation, {
      foreignKey: 'trip_id',
      as: 'reservations',
    });
    db.Reservation.belongsTo(db.Trip, {
      as: 'trip',
    });
    return db;
  } catch (error) {
    console.log('Could not establish connection');
    console.error(error.message);
    throw error;
  }
};

export const getDbPostgres = async () => {
  const sequelize = new Sequelize('database', 'username', 'password', {
    host: 'localhost',
    port: 5432,
    dialect: 'postgres',
    logging: false,
  });
  const db = await getDb(sequelize);
  return db;
};
