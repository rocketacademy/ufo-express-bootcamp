import express from 'express';
import methodOverride from 'method-override';
import moment from 'moment';
import fetch from 'node-fetch';
import cookieParser from 'cookie-parser';
import { read, add, write } from './jsonFileStorage.js';
import { countVisits, countDailyUniqueVisits } from './counter.js';
import { compare } from './compare.js';

const app = express();

app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }));
app.use(methodOverride('_method'));
app.use(cookieParser());
app.use(countVisits);
app.use(countDailyUniqueVisits);

app.set('view engine', 'ejs');

moment().format();
moment.suppressDeprecationWarnings = true;

const SUMMARY_LENGTH = 100;
const DICTIONARY_API_URL = 'https://api.dictionaryapi.dev/api/v2/entries/en/';

/**
 * Add/remove sighting to/from favorites.
 * @param {Object} req Request object.
 * @param {Object} res Response object.
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
 * @param {Object} req Request object.
 * @param {Object} res Response object.
 * @param {Number} index Index of sighting to remove.
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
 * @param {Object} req Request object.
 * @param {Object} res Response object.
 */
const getSightingShapes = (req, res) => {
  read('data.json', async (err, data) => {
    if (err) {
      res.status(500).send('DB read error.');
      return;
    }

    // eslint-disable-next-line max-len
    const uniqueShapes = [...new Set(data.sightings.filter((sighting) => sighting.shape !== undefined).map((sighting) => sighting.shape))];

    // get dictionary definition of shapes
    const dictionaryPromises = uniqueShapes.map((word) => fetch(`${DICTIONARY_API_URL}${word}`).then((result) => result.json()));
    const definition = await Promise.all(dictionaryPromises);

    // put shape and its stats to a list
    const shapes = [];
    for (let i = 0; i < uniqueShapes.length; i += 1) {
      const shape = uniqueShapes[i];
      shapes.push({
        shape,
        definition: {
          phonetic: definition[i][0].phonetic,
          partOfSpeech: definition[i][0].meanings[0].partOfSpeech,
          definition: definition[i][0].meanings[0].definitions[0].definition,
        },
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

    // sort list by count descending
    shapes.sort((first, second) => compare(first, second, 'count', 'desc'));

    if (shapes.length > 0) {
      res.render('shapes', { shapes });
    } else {
      res.status(404).send('Sorry, we cannot find that!');
    }
  });
};

/**
 * Get new sighting form.
 * @param {Object} req Request object.
 * @param {Object} res Response object.
 */
const getNewSighting = (req, res) => {
  res.render('edit', { source: 'new' });
};

/**
 * Create summary from full description.
 * @param {string} text Description.
 * @returns Summarized description.
 */
const createSummary = (text) => {
  const description = text.substring(0, SUMMARY_LENGTH);
  return description;
};

/**
 * Check if sighting data is valid.
 * @param {object} data Sighting data.
 * @returns True if valid, False otherwise.
 */
// eslint-disable-next-line max-len
const isSightingDataValid = (data) => moment(data.date_time).isValid() && moment(data.date_time).isSameOrBefore(moment());

/**
 * Add new sighting.
 * @param {Object} req Request object.
 * @param {Object} res Response object.
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
 * @param {Object} req Request object.
 * @param {Object} res Response object.
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
 * @param {Object} req Request object.
 * @param {Object} res Response object.
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
 * @param {Object} req Request object.
 * @param {Object} res Response object.
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
 * @param {Object} req Request object.
 * @param {Object} res Response object.
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
 * @param {Object} req Request object.
 * @param {Object} res Response object.
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
 * @param {Object} req Request object.
 * @param {Object} res Response object.
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
 * @param {Object} req Request object.
 * @param {Object} res Response object.
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

/**
 * Get statistics.
 * @param {Object} req Request object.
 * @param {Object} res Response object.
 */
const getStatistics = (req, res) => {
  read('data.json', (err, data) => {
    if (err) {
      res.status(500).send('DB read error.');
      return;
    }

    // get total visits
    let visits = 0;
    if (req.cookies.visits) {
      visits = Number(req.cookies.visits);
    }

    // get daily unique visits
    let dailyUniqueVisits = 0;
    if (req.cookies['daily-unique-visits']) {
      dailyUniqueVisits = Number(req.cookies['daily-unique-visits']);
    }

    // get total sightings
    const totalSightings = data.sightings.length;

    // sort by sighting date
    data.sightings.sort((first, second) => compare(first, second, 'date_time', 'asc'));

    // get oldest and latest sightings date
    const oldestSighting = moment(data.sightings[0].date_time).format('dddd, MMMM Do, YYYY');
    const latestSighting = moment(data.sightings[data.sightings.length - 1].date_time).format('dddd, MMMM Do, YYYY');

    // sort by sighting create time
    data.sightings.sort((first, second) => compare(first, second, 'created_time', 'asc'));

    // get oldest and latest sightings date
    const firstSightingCreated = moment(data.sightings[0].created_time).format('dddd, MMMM Do, YYYY');
    const lastSightingCreated = moment(data.sightings[data.sightings.length - 1].created_time).format('dddd, MMMM Do, YYYY');

    // tally sighting cities and states
    const sightingCities = [];
    const sightingStates = [];
    data.sightings.forEach((sighting) => {
      if (sightingCities[sighting.city]) {
        sightingCities[sighting.city] += 1;
      } else {
        sightingCities[sighting.city] = 1;
      }
      if (sightingStates[sighting.state]) {
        sightingStates[sighting.state] += 1;
      } else {
        sightingStates[sighting.state] = 1;
      }
    });

    // eslint-disable-next-line max-len
    const cityWithMostSightings = Object.keys(sightingCities).reduce((a, b) => (sightingCities[a] > sightingCities[b] ? a : b));

    // eslint-disable-next-line max-len
    const stateWithMostSightings = Object.keys(sightingStates).reduce((a, b) => (sightingStates[a] > sightingStates[b] ? a : b));

    const statistics = {
      visits,
      dailyUniqueVisits,
      totalSightings,
      oldestSighting,
      latestSighting,
      firstSightingCreated,
      lastSightingCreated,
      cityWithMostSightings,
      mostSightingsInCity: sightingCities[cityWithMostSightings],
      stateWithMostSightings,
      mostSightingsInState: sightingStates[stateWithMostSightings],
    };

    res.render('statistics', { statistics });
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
app.get('/statistics', getStatistics);

app.listen(3004);
