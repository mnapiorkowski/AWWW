import { Op } from 'sequelize';
import moment from 'moment';

export const getAllTrips = async (db, t = null) => db.Trip.findAll({
  where: {
    start_date: {
      [Op.gt]: moment().toDate(),
    },
  },
  order: [
    ['start_date', 'ASC'],
  ],
  transaction: t,
  lock: true,
});

export const getTrip = async (db, id, t = null) => db.Trip.findByPk(id, {
  transaction: t,
  lock: true,
});

export const getTripReservations = async (db, id, t = null) => db.Reservation.findAll({
  where: {
    trip_id: id,
  },
  transaction: t,
  lock: true,
});
