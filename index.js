import express from 'express';
import methodOverride from 'method-override';
import moment from 'moment';
import crypto from 'crypto';
import fetch from 'node-fetch';
import cookieParser from 'cookie-parser';
import { read, add, write } from './jsonFileStorage.js';

const app = express();

app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }));
app.use(methodOverride('_method'));
app.use(cookieParser());

const SUMMARY_LENGTH = 100;

/**
 * Count unique visits.
 * @param {*} req Request object.
 * @param {*} res Response object.
 * @param {*} next Next route.
 */
const countVisits = (req, res, next) => {
  let visits = 0;

  if (!req.cookies['user-id']
    || (moment().diff(req.cookies['last-visit'], 'days') > 1)) {
    res.cookie('user-id', crypto.randomUUID());
    res.cookie('last-visit', moment().format('YYYY-MM-DD HH:mm:ss'));

    if (req.cookies.visits) {
      visits = Number(req.cookies.visits);
    }
    visits += 1;

    res.cookie('visits', visits);
  }

  next();
};

app.use(countVisits);

app.set('view engine', 'ejs');

moment().format();

/**
 * Function to compare strings.
 * @param {*} firstItemAttr First item.
 * @param {*} secondItemAttr Second item.
 * @param {*} sortOrder Sort order.
 * @returns 0 if equal, 1 if first item < second item, -1 otherwise.
 */
const compareStrings = (firstItemAttr, secondItemAttr, sortOrder) => {
  // get attributes to compare
  let firstItem = firstItemAttr;
  if (!Number.isInteger(firstItem)) {
    firstItem = firstItem.toUpperCase();
  }
  let secondItem = secondItemAttr;
  if (!Number.isInteger(secondItem)) {
    secondItem = secondItem.toUpperCase();
  }

  // return comparison result
  if (firstItem < secondItem) {
    return (sortOrder === 'desc') ? 1 : -1;
  }
  if (firstItem > secondItem) {
    return (sortOrder === 'desc') ? -1 : 1;
  }
  return 0;
};

/**
 * Function to compare dates.
 * @param {*} firstItemAttr First item.
 * @param {*} secondItemAttr Second item.
 * @param {*} sortOrder Sort order.
 * @returns 0 if equal, 1 if first item < second item, -1 otherwise.
 */
const compareDates = (firstItemAttr, secondItemAttr, sortOrder) => {
  // get attributes to compare
  const firstItem = moment(firstItemAttr);
  const secondItem = moment(secondItemAttr);

  // return comparison result
  if (firstItem.isBefore(secondItem)) {
    return (sortOrder === 'desc') ? 1 : -1;
  }
  if (firstItem.isAfter(secondItem)) {
    return (sortOrder === 'desc') ? -1 : 1;
  }
  return 0;
};

/**
 * Function to compare strings.
 * @param {*} first First object.
 * @param {*} second Second object.
 * @param {*} sortBy Field to sort by.
 * @param {*} sortOrder Sort order.
 * @returns 0 if equal, 1 if first item < second item, -1 otherwise.
 */
const compare = (first, second, sortBy, sortOrder) => {
  const firstItemAttr = first[sortBy] || '';
  const secondItemAttr = second[sortBy] || '';

  if (moment(firstItemAttr).isValid() && moment(secondItemAttr).isValid()) {
    return compareDates(firstItemAttr, secondItemAttr, sortOrder);
  }
  return compareStrings(firstItemAttr, secondItemAttr, sortOrder);
};

/**
 * Get dictionary definition of a word.
 * @param {*} word Word.
 * @returns Definition of a word.
 */
const getDefinition = async (word) => fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`)
  .then((res) => res.json())
  .then((data) => ({
    word: data[0].word,
    phonetic: data[0].phonetic,
    partOfSpeech: data[0].meanings[0].partOfSpeech,
    definition: data[0].meanings[0].definitions[0].definition,
  })).catch((error) => console.error(error));

/**
 * Add/remove sighting to/from favorites.
 * @param {*} req Request object.
 * @param {*} res Response object.
 * @returns Redirection to previous page.
 */
const addToFavorites = (req, res) => {
  const { index, remove, source } = req.query;

  // eslint-disable-next-line no-restricted-globals
  if (isNaN(index)) {
    res.status(404).send('Sorry, we cannot find that!');
    return;
  }

  // get favorites from cookie
  let favorites = [];
  if (req.cookies.favorites) {
    favorites = req.cookies.favorites;
  }

  // add/remove from favorites
  if (!favorites.includes(index) && (remove !== '1')) {
    favorites.push(index);
  } else if (favorites.includes(index) && (remove === '1')) {
    favorites = favorites.filter((favIndex) => (favIndex !== index));
  }

  res.cookie('favorites', favorites);

  if (source.includes('shapes') || source.includes('sighting')) {
    const sourcePath = source.split('-');
    res.redirect(`/${sourcePath[0]}/${sourcePath[1]}`);
  } else if (source.includes('favorites')) {
    res.redirect(`/${source}`);
  } else {
    res.redirect('/');
  }
};

/**
 * Remove sighting from favorites.
 * @param {*} req Request object.
 * @param {*} res Response object.
 * @param {*} index Index of sighting to remove.
 */
const removeFromFavorites = (req, res, index) => {
  if (req.cookies.favorites) {
    let { favorites } = req.cookies;

    favorites = favorites.filter((favIndex) => (favIndex !== index));

    res.cookie('favorites', favorites);
  }
};

/**
 * Get different types of sighting shapes.
 * @param {*} req Request object.
 * @param {*} res Response object.
 */
const getSightingShapes = (req, res) => {
  read('data.json', (err, data) => {
    if (err) {
      res.status(500).send('DB read error.');
      return;
    }

    // eslint-disable-next-line max-len
    const uniqueShapes = [...new Set(data.sightings.filter((sighting) => sighting.shape !== undefined).map((sighting) => sighting.shape))];

    // put shape and its stats to a list
    const shapes = [];
    for (let i = 0; i < uniqueShapes.length; i += 1) {
      const shape = uniqueShapes[i];
      shapes.push({
        shape,
        count: 0,
        favorites: 0,
      });
    }

    // get favorites from cookie
    let favorites = [];
    if (req.cookies.favorites) {
      favorites = req.cookies.favorites;
    }

    // count number of sightings of a certain shape and how many are favorites
    data.sightings.forEach((sighting, index) => {
      // eslint-disable-next-line max-len
      const shape = shapes.find((item) => item.shape.toUpperCase() === sighting.shape.toUpperCase());

      shape.count += 1;
      if (favorites.includes(index.toString())) {
        shape.favorites += 1;
      }
    });

    if (shapes.length > 0) {
      res.render('shapes', { shapes });
    } else {
      res.status(404).send('Sorry, we cannot find that!');
    }
  });
};

/**
 * Get new sighting form.
 * @param {*} req Request object.
 * @param {*} res Response object.
 */
const getNewSighting = (req, res) => {
  res.render('edit', { source: 'new' });
};

/**
 * Create summary from full description.
 * @param {*} text Description.
 * @returns Summarized description.
 */
const createSummary = (text) => {
  const description = text.substring(0, SUMMARY_LENGTH);
  return description;
};

/**
 * Check if sighting data is valid.
 * @param {*} data Sighting data.
 * @returns True if valid, False otherwise.
 */
// eslint-disable-next-line max-len
const isSightingDataValid = (data) => moment(data.date_time).isValid() && moment(data.date_time).isSameOrBefore(moment());

/**
 * Add new sighting.
 * @param {*} req Request object.
 * @param {*} res Response object.
 * @returns Redirection to newly added sighting page.
 */
const createSighting = (req, res) => {
  if (!isSightingDataValid(req.body)) {
    res.status(404).send('Input is invalid!');
    return;
  }

  // add summary and format date
  req.body.summary = createSummary(req.body.text);
  req.body.created_time = moment().format('YYYY-MM-DD HH:mm:ss');

  add('data.json', 'sightings', req.body, (err, dataNew) => {
    if (err) {
      res.status(500).send('DB write error.');
      return;
    }

    const data = JSON.parse(dataNew);
    res.redirect(`/sighting/${data.sightings.length - 1}`);
  });
};

/**
 * Get list of sightings.
 * @param {*} req Request object.
 * @param {*} res Response object.
 */
const getSightings = (req, res) => {
  read('data.json', (err, data) => {
    if (err) {
      res.status(500).send('DB read error.');
      return;
    }

    // sort list
    const { sortBy, sortOrder } = req.query;
    if (sortBy) {
      data.sightings.sort((first, second) => compare(first, second, sortBy, sortOrder));
    }

    // add index and format date
    data.sightings.forEach((sighting, index) => {
      sighting.index = index;
      sighting.date_time = moment(sighting.date_time).format('dddd, MMMM Do, YYYY');
    });
    const { sightings } = data;

    // get favorites from cookie
    let favorites = [];
    if (req.cookies.favorites) {
      favorites = req.cookies.favorites;
    }

    if (sightings.length > 0) {
      res.render('sightings', {
        sightings, source: 'root', favorites, sortBy, sortOrder,
      });
    } else {
      res.status(404).send('Sorry, we cannot find that!');
    }
  });
};

/**
 * Get edit sighting form.
 * @param {*} req Request object.
 * @param {*} res Response object.
 * @returns Edit sighting page.
 */
const getEditSighting = (req, res) => {
  const { index } = req.params;

  // eslint-disable-next-line no-restricted-globals
  if (isNaN(index)) {
    res.status(404).send('Sorry, we cannot find that!');
    return;
  }

  read('data.json', (err, data) => {
    if (err) {
      res.status(500).send('DB read error.');
      return;
    }

    const sighting = data.sightings[index];
    sighting.index = index;
    res.render('edit', { sighting, source: 'edit' });
  });
};

/**
 * Edit a sighting.
 * @param {*} req Request object.
 * @param {*} res Response object.
 * @returns Redirection to edited sighting page.
 */
const editSighting = (req, res) => {
  const { index } = req.params;

  // eslint-disable-next-line no-restricted-globals
  if (isNaN(index)) {
    res.status(404).send('Sorry, we cannot find that!');
    return;
  }

  // validate sighting data
  if (!isSightingDataValid(req.body)) {
    res.status(404).send('Input is invalid!');
    return;
  }

  read('data.json', (err, data) => {
    if (err) {
      res.status(500).send('DB read error.');
      return;
    }

    // modify fields before saving
    req.body.summary = createSummary(req.body.text);
    req.body.created_time = data.sightings[index].created_time;
    req.body.updated_time = moment().format('YYYY-MM-DD HH:mm:ss');
    data.sightings[index] = req.body;

    write('data.json', data, (writeErr) => {
      if (writeErr) {
        res.status(500).send('DB write error.');
        return;
      }

      res.redirect(`/sighting/${index}`);
    });
  });
};

/**
 * Get sighting page.
 * @param {*} req Request object.
 * @param {*} res Response object.
 * @returns Sighting page.
 */
const getSightingByIndex = (req, res) => {
  const { index } = req.params;

  // eslint-disable-next-line no-restricted-globals
  if (isNaN(index)) {
    res.status(404).send('Sorry, we cannot find that!');
    return;
  }

  read('data.json', (err, data) => {
    if (err) {
      res.status(500).send('DB read error.');
      return;
    }

    // format data before showing
    const sighting = data.sightings[index];
    sighting.date_time = moment(sighting.date_time).format('dddd, MMMM Do, YYYY');
    sighting.created_time = moment(sighting.created_time).fromNow();
    sighting.index = index;

    // get favorites from cookie
    let favorites = [];
    if (req.cookies.favorites) {
      favorites = req.cookies.favorites;
    }

    if (sighting) {
      res.render('sighting', { sighting, source: `sighting-${index}`, favorites });
    } else {
      res.status(404).send('Sorry, we cannot find that!');
    }
  });
};

/**
 * Delete sighting.
 * @param {*} req Request object.
 * @param {*} res Response object.
 * @returns Redirection to home page.
 */
const deleteSightingByIndex = (req, res) => {
  const { index } = req.params;

  // eslint-disable-next-line no-restricted-globals
  if (isNaN(index)) {
    res.status(404).send('Sorry, we cannot find that!');
    return;
  }

  read('data.json', (err, data) => {
    if (err) {
      res.status(500).send('DB read error.');
      return;
    }

    data.sightings.splice(index, 1);

    write('data.json', data, (writeErr) => {
      if (writeErr) {
        res.status(500).send('DB read error.');
        return;
      }

      removeFromFavorites(req, res, index);

      res.redirect('/');
    });
  });
};

/**
 * Get list of sightings based on shape.
 * @param {*} req Request object.
 * @param {*} res Response object.
 */
const getSightingsByShape = (req, res) => {
  const { shape } = req.params;

  read('data.json', (err, data) => {
    if (err) {
      res.status(500).send('DB read error.');
      return;
    }

    // sort list
    const { sortBy, sortOrder } = req.query;
    if (sortBy) {
      data.sightings.sort((first, second) => compare(first, second, sortBy, sortOrder));
    }

    // add index and format date
    data.sightings.forEach((sighting, index) => {
      sighting.index = index;
      sighting.date_time = moment(sighting.date_time).format('dddd, MMMM Do, YYYY');
    });

    // get favorites from cookie
    let favorites = [];
    if (req.cookies.favorites) {
      favorites = req.cookies.favorites;
    }

    // eslint-disable-next-line max-len
    const filteredSightings = data.sightings.filter((sighting) => (sighting.shape.toUpperCase() === shape.toUpperCase()));

    if (filteredSightings) {
      const sightings = filteredSightings;
      res.render('sightings', {
        sightings, source: `shapes-${shape}`, favorites, sortBy, sortOrder,
      });
    } else {
      res.status(404).send('Sorry, we cannot find that!');
    }
  });
};

/**
 * Get sighting favorites.
 * @param {*} req Request object.
 * @param {*} res Response object.
 */
const getFavoriteSightings = (req, res) => {
  read('data.json', (err, data) => {
    if (err) {
      res.status(500).send('DB read error.');
      return;
    }

    // add index
    data.sightings.forEach((sighting, index) => {
      sighting.index = index;
    });

    // sort list
    const { sortBy, sortOrder } = req.query;
    if (sortBy) {
      data.sightings.sort((first, second) => compare(first, second, sortBy, sortOrder));
    }

    // get favorites from cookie
    let favorites = [];
    if (req.cookies.favorites) {
      favorites = req.cookies.favorites;
    }

    // format date
    data.sightings.forEach((sighting) => {
      sighting.date_time = moment(sighting.date_time).format('dddd, MMMM Do, YYYY');
    });

    // eslint-disable-next-line max-len
    const filteredSightings = data.sightings.filter((sighting) => (favorites.includes(sighting.index.toString())));

    if (filteredSightings) {
      const sightings = filteredSightings;
      res.render('sightings', {
        sightings, source: 'favorites', favorites, sortBy, sortOrder,
      });
    } else {
      res.status(404).send('Sorry, we cannot find that!');
    }
  });
};

app.get('/sighting', getNewSighting);
app.post('/sighting', createSighting);
app.get('/sighting/:index', getSightingByIndex);
app.get('/', getSightings);
app.get('/sighting/:index/edit', getEditSighting);
app.put('/sighting/:index', editSighting);
app.delete('/sighting/:index', deleteSightingByIndex);
app.get('/shapes', getSightingShapes);
app.get('/shapes/:shape', getSightingsByShape);
app.get('/favorites', getFavoriteSightings);
app.post('/favorites', addToFavorites);

app.listen(3004);
