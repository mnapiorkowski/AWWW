// first run ssh -L 54321:lkdb:5432 mn429573@students.mimuw.edu.pl
import { DataTypes } from 'sequelize';

export const trip = (sequelize) => {
  const Trip = sequelize.define(
    'trip',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      descr: {
        type: DataTypes.TEXT,
      },
      short_descr: {
        type: DataTypes.TEXT,
      },
      image: {
        type: DataTypes.STRING,
      },
      price: {
        type: DataTypes.FLOAT,
        allowNull: false,
        validate: {
          min: 0.0,
        },
      },
      start_date: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: {
          isDate: true,
        },
      },
      end_date: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: {
          isDate: true,
        },
      },
      slots_available: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 0,
        },
      },
    },
    {
      validate: {
        isEndGreaterThanStart() {
          if (parseInt(this.end_date, 10) < parseInt(this.start_date, 10)) {
            throw new Error('Data rozpoczęcia wycieczki musi być przed datą jej zakończenia.');
          }
        },
      },
    },
  );
  return Trip;
};

export const reservation = (sequelize) => {
  const Reservation = sequelize.define('reservation', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    surname: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    slots_taken: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0,
      },
      defaultValue: 0,
    },
  });
  return Reservation;
};
