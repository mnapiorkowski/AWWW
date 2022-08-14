import { equal, notEqual } from 'assert';
import { assert } from 'chai';
import {
  describe, before, it, after,
} from 'mocha';
import {
  Builder, Capabilities, By, until,
} from 'selenium-webdriver';
import moment from 'moment';
import { getDbPostgres } from '../database/database.mjs';
import init from '../database/init_db.mjs';
import { getTrip, getAllTrips, getTripReservations } from '../database/queries.mjs';
import app from '../app.mjs';

const baseURL = 'http://localhost:3000';

describe('Navigation tests', function test() {
  const TIMEOUT = 10000;
  this.timeout(TIMEOUT);
  const driver = new Builder().withCapabilities(Capabilities.firefox()).build();

  before(async () => {
    await driver
      .manage()
      .setTimeouts({ implicit: TIMEOUT, pageLoad: TIMEOUT, script: TIMEOUT });
  });

  it('should redirect to main page after clicking on logo', async () => {
    await driver.get(`${baseURL}/trip?id=2`);
    await driver.findElement(By.className('logo'))
      .then((logo) => logo.click());
    await driver.wait(until.urlIs(`${baseURL}/`), TIMEOUT);
  });

  it("should redirect to proper trip's page and then back to main page", async () => {
    await driver.get(`${baseURL}/`);
    const tripLink = await driver.findElement(By.className('trip_link'));
    const tripNameMain = await tripLink.getText();

    await tripLink.click();
    await driver.wait(until.urlContains(`${baseURL}/trip?id=`), TIMEOUT);

    const tripName = await driver.findElement(By.className('trip_name'))
      .then((elem) => elem.getText());
    equal(tripName, tripNameMain);

    await driver.findElement(By.id('back_button'))
      .then((backButton) => backButton.click());
    await driver.wait(until.urlIs(`${baseURL}/`), TIMEOUT);
  });

  it('should redirect to booking page from main page', async () => {
    await driver.get(`${baseURL}/`);
    await driver.findElement(By.className('book_link'))
      .then((link) => link.click());
    await driver.wait(until.urlContains(`${baseURL}/book?id=`), TIMEOUT);
  });

  it('should redirect to booking page from trip page', async () => {
    await driver.get(`${baseURL}/trip?id=1`);
    await driver.findElement(By.id('book_button'))
      .then((bookButton) => bookButton.click());
    await driver.wait(until.urlIs(`${baseURL}/book?id=1`), TIMEOUT);
  });

  after(() => {
    driver.quit();
  });
});

describe('Wrong URL tests', function test() {
  const TIMEOUT = 10000;
  this.timeout(TIMEOUT);
  const driver = new Builder().withCapabilities(Capabilities.firefox()).build();

  before(async () => {
    await driver
      .manage()
      .setTimeouts({ implicit: TIMEOUT, pageLoad: TIMEOUT, script: TIMEOUT });
  });

  it('should check if proper error message is displayed when URL is incorrect', async () => {
    await driver.get(`${baseURL}/bad-url`);
    const exp = 'Nie znaleziono podstrony o podanym adresie.';
    const act = await driver.findElement(By.id('message'))
      .then((message) => message.getText());
    equal(exp, act);
  });

  it("should check if proper error message is displayed when trip's id in URL is NaN", async () => {
    const invalidURLs = [
      `${baseURL}/trip`,
      `${baseURL}/trip?`,
      `${baseURL}/trip?id`,
      `${baseURL}/trip?id=text`,
      `${baseURL}/trip?id=?`,
      `${baseURL}/trip?id=null`,
      `${baseURL}/trip?id=NaN`,
    ];

    const exp = 'Niepoprawne id wycieczki.';
    invalidURLs.forEach(async (url) => {
      await driver.get(url);
      const act = await driver.findElement(By.id('message'))
        .then((mess) => mess.getText());
      equal(act, exp);
    });
  });

  it("should check if proper error message is displayed when trip's id in URL is an invalid number", async () => {
    const exp = 'Nie odnaleziono wycieczki o id: ';
    const invalidIDs = [-100, 2137, 0];
    invalidIDs.forEach(async (id) => {
      await driver.get(`${baseURL}/trip?id=${id}`);
      const act = await driver.findElement(By.id('message'))
        .then((mess) => mess.getText());
      equal(exp + id, act);
    });
  });

  after(() => {
    driver.quit();
  });
});

describe('Database tests', function test() {
  const TIMEOUT = 10000;
  this.timeout(TIMEOUT);
  let db;

  before(async () => {
    db = await getDbPostgres();
    await init(db);
  });

  it("should get 'Trip' with existing id from database", async () => {
    const id = 1;
    const trip = await getTrip(db, id);
    notEqual(trip, null);
    equal(trip.id, id);
  });

  it("should not get any 'Trip' with too big id from database", async () => {
    const id = 420;
    const trip = await getTrip(db, id);
    equal(trip, null);
  });

  it("should get 'Reservations' for 'Trip' with existing id from database", async () => {
    const id = 1;
    const reservations = await getTripReservations(db, id);
    notEqual(reservations, null);
    reservations.forEach((r) => {
      equal(r.trip_id, id);
    });
  });

  it("should get only 'Trips' with future start date", async () => {
    const trips = await getAllTrips(db);
    notEqual(trips, null);
    trips.forEach((trip) => {
      assert.isAtLeast(trip.start_date, moment().toDate());
    });
  });

  after(() => {
    db.sequelize.drop();
  });
});

describe('Form tests', function test() {
  const TIMEOUT = 10000;
  this.timeout(TIMEOUT);
  const driver = new Builder().withCapabilities(Capabilities.firefox()).build();
  let db;

  before(async () => {
    db = await getDbPostgres();
    await init(db);
    await driver
      .manage()
      .setTimeouts({ implicit: 200, pageLoad: TIMEOUT, script: TIMEOUT });
  });

  const correct = {
    name: 'Michał',
    surname: 'Napiórkowski',
    email: 'hehe@mimuw.edu.pl',
    participants: 1,
  };

  const success = 'Sukces! Udało ci się zapisać na wycieczkę.';
  async function assertNoSuccess(id, initialSlots) {
    let message;
    try {
      message = await driver.findElement(By.id('message'))
        .then((mess) => mess.getText());
    } catch (error) {
      message = null;
    }
    notEqual(message, success);

    const slots = await getTrip(db, id)
      .then((trip) => trip.slots_available);
    equal(initialSlots, slots);
  }

  async function formElements() {
    const name = await driver.findElement(By.id('name'));
    const surname = await driver.findElement(By.id('surname'));
    const email = await driver.findElement(By.id('email'));
    const participants = await driver.findElement(By.id('participants'));
    const submitButton = await driver.findElement(By.id('submit'));
    return {
      name, surname, email, participants, submitButton,
    };
  }

  async function clearForm(form) {
    await form.name.clear();
    await form.surname.clear();
    await form.email.clear();
    await form.participants.clear();
  }

  it('should not allow to send empty form', async () => {
    const id = 1;
    const initialSlots = await getTrip(db, id)
      .then((trip) => trip.slots_available);

    await driver.get(`${baseURL}/book?id=${id}`);
    await driver.findElement(By.id('submit'))
      .then((button) => button.click());
    await assertNoSuccess(id, initialSlots);
  });

  it('should not allow to send form with incorrect data', async () => {
    const id = 1;
    const initialSlots = await getTrip(db, id)
      .then((trip) => trip.slots_available);

    const invalidEmails = ['1234', '', '@', 'Mich@l', 'hehe.com'];
    const invalidNumbers = [-1, 0, 'hehe', ''];

    await driver.get(`${baseURL}/book?id=${id}`);

    invalidEmails.forEach(async (e) => {
      const form = await formElements();
      await clearForm(form);
      await form.name.sendKeys(correct.name);
      await form.surname.sendKeys(correct.surname);
      await form.email.sendKeys(e);
      await form.participants.sendKeys(correct.participants);
      await form.submitButton.click();
      await assertNoSuccess(id, initialSlots);
    });

    invalidNumbers.forEach(async (n) => {
      const form = await formElements();
      await clearForm(form);
      await form.name.sendKeys(correct.name);
      await form.surname.sendKeys(correct.surname);
      await form.email.sendKeys(correct.email);
      await form.participants.sendKeys(n);
      await form.submitButton.click();
      await assertNoSuccess(id, initialSlots);
    });
  });

  it('should not allow to book more slots than available', async () => {
    const id = 1;
    const initialSlots = await getTrip(db, id)
      .then((trip) => trip.slots_available);

    await driver.get(`${baseURL}/book?id=${id}`);

    const form = await formElements();
    await form.name.sendKeys(correct.name);
    await form.surname.sendKeys(correct.surname);
    await form.email.sendKeys(correct.email);
    await form.participants.sendKeys(initialSlots + 1);
    await form.submitButton.click();

    assertNoSuccess(id, initialSlots);

    const act = await driver.findElement(By.id('message'))
      .then((message) => message.getText());
    const exp = 'Liczba uczestników przekracza liczbę dostępnych miejsc.';
    equal(exp, act);
  });

  it('should allow to book as many slots as possible', async () => {
    const id = 1;
    const slots = await getTrip(db, id)
      .then((trip) => trip.slots_available);
    await driver.get(`${baseURL}/book?id=${id}`);

    const form = await formElements();
    await form.name.sendKeys(correct.name);
    await form.surname.sendKeys(correct.surname);
    await form.email.sendKeys(correct.email);
    await form.participants.sendKeys(slots);
    await form.submitButton.click();

    const message = await driver.findElement(By.id('message'))
      .then((mess) => mess.getText());
    equal(success, message);

    const newSlots = await getTrip(db, id)
      .then((trip) => trip.slots_available);
    equal(newSlots, 0);
  });

  after(() => {
    db.sequelize.drop();
    driver.quit();
  });
});

describe('Typical usage', function test() {
  const TIMEOUT = 10000;
  this.timeout(TIMEOUT);
  const driver = new Builder().withCapabilities(Capabilities.firefox()).build();
  let db;

  before(async () => {
    db = await getDbPostgres();
    await init(db);
    await driver
      .manage()
      .setTimeouts({ implicit: 200, pageLoad: TIMEOUT, script: TIMEOUT });
  });

  const correct = {
    name: 'Michał',
    surname: 'Napiórkowski',
    email: 'hehe@mimuw.edu.pl',
    participants: 1,
  };

  const success = 'Sukces! Udało ci się zapisać na wycieczkę.';

  async function formElements() {
    const name = await driver.findElement(By.id('name'));
    const surname = await driver.findElement(By.id('surname'));
    const email = await driver.findElement(By.id('email'));
    const participants = await driver.findElement(By.id('participants'));
    const submitButton = await driver.findElement(By.id('submit'));
    return {
      name, surname, email, participants, submitButton,
    };
  }

  it("should start from main page, read trip's description and book it", async () => {
    await driver.get(`${baseURL}/`);
    await driver.findElement(By.className('trip_link'))
      .then((link) => link.click());
    await driver.wait(until.urlContains(`${baseURL}/trip?id=`), TIMEOUT);

    const id = await driver.getCurrentUrl()
      .then((url) => url.split('=')[1]);

    await driver.findElement(By.id('book_button'))
      .then((bookButton) => bookButton.click());
    await driver.wait(until.urlContains(`${baseURL}/book?id=${id}`), TIMEOUT);

    const slots = await getTrip(db, id)
      .then((trip) => trip.slots_available);

    const form = await formElements();
    await form.name.sendKeys(correct.name);
    await form.surname.sendKeys(correct.surname);
    await form.email.sendKeys(correct.email);
    await form.participants.sendKeys(correct.participants);
    await form.submitButton.click();

    const message = await driver.findElement(By.id('message'))
      .then((mess) => mess.getText());
    equal(success, message);

    const newSlots = await getTrip(db, id)
      .then((trip) => trip.slots_available);
    equal(newSlots, slots - correct.participants);
  });

  after(() => {
    db.sequelize.drop();
    driver.quit();
  });
});
