const init = async (db) => {
  const loremIpsum = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, '
  + 'sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad '
  + 'minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea '
  + 'commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit '
  + 'esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat '
  + 'non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.';

  try {
    await db.sequelize.sync({ force: true });

    const tripOne = await db.Trip.create({
      name: 'Odległa galaktyka',
      short_descr: loremIpsum,
      image: '/images/starwars.png',
      price: 2137,
      start_date: 'May 5, 2023',
      end_date: 'May 12, 2023',
      slots_available: 300,
    });

    await db.Trip.create({
      name: 'Śródziemie',
      short_descr: loremIpsum,
      image: '/images/lotr.jpg',
      price: 420,
      start_date: 'Apr 20, 2023',
      end_date: 'May 1, 2023',
      slots_available: 100,
    });

    await db.Trip.create({
      name: 'Hogwart',
      short_descr: loremIpsum,
      image: '/images/potter.jpg',
      price: 69,
      start_date: 'Apr 21, 2023',
      end_date: 'May 18, 2022',
      slots_available: 200,
    });

    await db.Trip.create({
      name: 'Już była',
      short_descr: loremIpsum,
      price: 1,
      start_date: 'Apr 21, 2022',
      end_date: 'May 18, 2022',
      slots_available: 200,
    });

    const reservationOne = await db.Reservation.create({
      name: 'Michał',
      surname: 'Napiórkowski',
      email: 'michal@gmail.com',
      slots_taken: 4,
    });

    const reservationTwo = await db.Reservation.create({
      name: 'Paweł',
      surname: 'Strzelecki',
      email: 'dziekan@mimuw.edu.pl',
      slots_taken: 12,
    });

    await tripOne.addReservations([reservationOne, reservationTwo]);
  } catch (error) {
    console.log('An error occurred during data loading: ', error);
  }
};

export default init;
