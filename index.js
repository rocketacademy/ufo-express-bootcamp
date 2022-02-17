import express from 'express';
import methodOverride from 'method-override';
import { read, add, write } from './jsonFileStorage.js';

const app = express();

app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }));

// Override POST requests with query param ?_method=PUT to be PUT requests
app.use(methodOverride('_method'));

app.set('view engine', 'ejs');

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

const createSighting = (req, res) => {
  req.body.summary = createSummary(req.body.text);

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

    data.sightings.forEach((sighting, index) => {
      sighting.index = index;
    });
    const { sightings } = data;

    if (sightings.length > 0) {
      res.render('sightings', { sightings, source: 'root' });
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

  read('data.json', (err, data) => {
    if (err) {
      res.status(500).send('DB read error.');
      return;
    }

    req.body.summary = createSummary(req.body.text);
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

    if (sighting) {
      res.render('sighting', { sighting });
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

    data.sightings.forEach((sighting, index) => {
      sighting.index = index;
    });

    // eslint-disable-next-line max-len
    const filteredSightings = data.sightings.filter((sighting) => (sighting.shape.toUpperCase() === shape.toUpperCase()));

    if (filteredSightings) {
      const sightings = filteredSightings;
      res.render('sightings', { sightings, source: 'shapes' });
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

app.listen(3004);
