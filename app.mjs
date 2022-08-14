import express from 'express';
import bodyParser from 'body-parser';
import { check, validationResult } from 'express-validator';
import { getDbPostgres } from './database/database.mjs';
import { getAllTrips, getTrip } from './database/queries.mjs';
import init from './database/init_db.mjs';

const app = express();
export default app;
const port = 3000;
const urlencodedParser = bodyParser.urlencoded({ extended: false });

const promos = [];
promos.push({ name: 'Promocja 1', price: 1000 });
promos.push({ name: 'Promocja 2', price: 2000 });
promos.push({ name: 'Promocja 3', price: 3000 });

app.set('view engine', 'pug');
app.set('views', 'views');
app.use(express.static('public'));

getDbPostgres().then(async (db) => {
  await init(db);

  app.get('/', async (req, res) => {
    const trips = await getAllTrips(db);
    res.render('main', { trips, promos });
  });

  const tripWithId = async (id, res) => {
    let trip = null;
    if (!id || isNaN(id)) {
      const trips = await getAllTrips(db);
      res.render('main', { messages: ['Niepoprawne id wycieczki.'], trips, promos });
    } else {
      trip = await getTrip(db, id);
      if (!trip) {
        const trips = await getAllTrips(db);
        res.render('main', { messages: [`Nie odnaleziono wycieczki o id: ${id}`], trips, promos });
      }
    }
    return trip;
  };

  app.get('/trip', async (req, res) => {
    const trip = await tripWithId(req.query.id, res);
    if (trip) {
      res.render('trip', { trip });
    }
  });

  app.get('/book', async (req, res) => {
    const trip = await tripWithId(req.query.id, res);
    if (trip) {
      res.render('booking');
    }
  });

  app.post(
    '/book',
    urlencodedParser,
    check('name')
      .notEmpty()
      .withMessage('Pole [Imię] nie może być puste.'),
    check('surname')
      .notEmpty()
      .withMessage('Pole [Nazwisko] nie może być puste.'),
    check('email')
      .notEmpty()
      .withMessage('Pole [E-mail] nie może być puste.')
      .isEmail()
      .withMessage('Pole [E-mail] musi zawierać poprawny adres e-mail.'),
    check('participants')
      .notEmpty()
      .withMessage('Pole [Liczba uczestników] nie może być puste.')
      .isInt({ min: 1 })
      .withMessage('Liczba uczestników musi być większa od zera.'),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const messages = [];
        errors.array().forEach((err) => {
          messages.push(err.msg);
        });
        res.render('booking', { messages });
      } else {
        try {
          await db.sequelize.transaction(async (t) => {
            const trip = await getTrip(db, req.query.id, t);

            await trip.decrement('slots_available', {
              by: req.body.participants,
              transaction: t,
            });
            if (trip.slots_available < 0) {
              throw new Error('Liczba uczestników przekracza liczbę dostępnych miejsc.');
            }

            const reservation = await db.Reservation.create({
              name: req.body.name,
              surname: req.body.surname,
              email: req.body.email,
              slots_taken: req.body.participants,
            }, { transaction: t });

            await trip.addReservations([reservation], { transaction: t });

            const messages = ['Sukces! Udało ci się zapisać na wycieczkę.'];
            res.render('trip', { messages, trip });
          });
        } catch (error) {
          const messages = [error.message];
          res.render('booking', { messages });
        }
      }
    },
  );

  app.get('*', async (req, res) => {
    const trips = await getAllTrips(db);
    res.status(404).render('main', { messages: ['Nie znaleziono podstrony o podanym adresie.'], trips, promos });
  });

  app.listen(port, () => {
    console.log(`App listening on port ${port}`);
  });
});
