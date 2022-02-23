import express from 'express';
import methodOverride from 'method-override';
import moment from 'moment';
import crypto from 'crypto';
import cookieParser from 'cookie-parser';
import { read, add, write } from './jsonFileStorage.js';

const app = express();

app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }));
app.use(methodOverride('_method'));
app.use(cookieParser());

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

const compare = (first, second, sortBy, sortOrder) => {
  const firstItemAttr = first[sortBy] || '';
  const secondItemAttr = second[sortBy] || '';

  if (moment(firstItemAttr).isValid() && moment(secondItemAttr).isValid()) {
    return compareDates(firstItemAttr, secondItemAttr, sortOrder);
  }
  return compareStrings(firstItemAttr, secondItemAttr, sortOrder);
};

const addToFavorites = (req, res) => {
  const { index, remove, source } = req.query;

  // eslint-disable-next-line no-restricted-globals
  if (isNaN(index)) {
    res.status(404).send('Sorry, we cannot find that!');
    return;
  }

  let favorites = [];
  if (req.cookies.favorites) {
    favorites = req.cookies.favorites;
  }

  if (!favorites.includes(index) && (remove !== '1')) {
    favorites.push(index);
  } else if (favorites.includes(index) && (remove === '1')) {
    favorites = favorites.filter((favIndex) => (favIndex !== index));
  }

  res.cookie('favorites', favorites);

  if (source.includes('shapes') || source.includes('sighting')) {
    const sourcePath = source.split('-');
    res.redirect(`/${sourcePath[0]}/${sourcePath[1]}`);
  } else {
    res.redirect('/');
  }
};

const removeFromFavorites = (req, res, index) => {
  if (req.cookies.favorites) {
    let { favorites } = req.cookies;

    favorites = favorites.filter((favIndex) => (favIndex !== index));

    res.cookie('favorites', favorites);
  }
};

const getSightingShapes = (req, res) => {
  read('data.json', (err, data) => {
    if (err) {
      res.status(500).send('DB read error.');
      return;
    }

    // eslint-disable-next-line max-len
    const shapes = [...new Set(data.sightings.filter((sighting) => sighting.shape !== undefined).map((sighting) => sighting.shape))];

    if (shapes.length > 0) {
      res.render('shapes', { shapes });
    } else {
      res.status(404).send('Sorry, we cannot find that!');
    }
  });
};

const getNewSighting = (req, res) => {
  res.render('new');
};

const createSummary = (text) => {
  const description = text.substring(0, 100);
  return description;
};

// eslint-disable-next-line max-len
const isSightingDataValid = (data) => moment(data.date_time).isValid() && moment(data.date_time).isSameOrBefore(moment());

const createSighting = (req, res) => {
  if (!isSightingDataValid(req.body)) {
    res.status(404).send('Input is invalid!');
    return;
  }

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

const getSightings = (req, res) => {
  read('data.json', (err, data) => {
    if (err) {
      res.status(500).send('DB read error.');
      return;
    }

    const { sortBy, sortOrder } = req.query;
    if (sortBy) {
      data.sightings.sort((first, second) => compare(first, second, sortBy, sortOrder));
    }

    data.sightings.forEach((sighting, index) => {
      sighting.index = index;
      sighting.date_time = moment(sighting.date_time).format('dddd, MMMM Do, YYYY');
    });
    const { sightings } = data;

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
    res.render('edit', { sighting });
  });
};

const editSighting = (req, res) => {
  const { index } = req.params;

  // eslint-disable-next-line no-restricted-globals
  if (isNaN(index)) {
    res.status(404).send('Sorry, we cannot find that!');
    return;
  }

  if (!isSightingDataValid(req.body)) {
    res.status(404).send('Input is invalid!');
    return;
  }

  read('data.json', (err, data) => {
    if (err) {
      res.status(500).send('DB read error.');
      return;
    }

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

    const sighting = data.sightings[index];
    sighting.date_time = moment(sighting.date_time).format('dddd, MMMM Do, YYYY');
    sighting.created_time = moment(sighting.created_time).fromNow();
    sighting.index = index;

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

const getSightingsByShape = (req, res) => {
  const { shape } = req.params;

  read('data.json', (err, data) => {
    if (err) {
      res.status(500).send('DB read error.');
      return;
    }

    const { sortBy, sortOrder } = req.query;
    if (sortBy) {
      data.sightings.sort((first, second) => compare(first, second, sortBy, sortOrder));
    }

    data.sightings.forEach((sighting, index) => {
      sighting.index = index;
      sighting.date_time = moment(sighting.date_time).format('dddd, MMMM Do, YYYY');
    });

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

app.get('/sighting', getNewSighting);
app.post('/sighting', createSighting);
app.get('/sighting/:index', getSightingByIndex);
app.get('/', getSightings);
app.get('/sighting/:index/edit', getEditSighting);
app.put('/sighting/:index', editSighting);
app.delete('/sighting/:index', deleteSightingByIndex);
app.get('/shapes', getSightingShapes);
app.get('/shapes/:shape', getSightingsByShape);
app.post('/favorites', addToFavorites);

app.listen(3004);
