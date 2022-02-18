import express from 'express';
import methodOverride from 'method-override';
import {
  read, add, edit, write,
} from './jsonFileStorage.js';

const app = express();

// Override POST requests with query param ?_method=PUT to be PUT requests
app.use(methodOverride('_method'));

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }));

const renderIndex = (request, response) => {
  console.log('request to load list of sightings came in');
  read('data.json', (err, data) => {
    if (err) {
      console.log('Read error', err);
    }
    const { sightings } = data;
    response.render('index', { sightings });
  });
};

// render the form
const renderForm = (request, response) => {
  response.render('form');
};

// add new sighting
const renderAddNewSighting = (request, response) => {
  console.log('request to add new sighting came in');

  add('data.json', 'sightings', request.body, (err) => {
    if (err) {
      console.log('Add error');
    }
    response.status(200);
    console.log('new sighting added successfully');
  });

  read('data.json', (err, data) => {
    if (err) {
      console.log('read error');
    }

    const index = data.sightings.length;

    response.redirect(`/sighting/${index}`);
  });
};

const renderIndividualSighting = (request, response) => {
  console.log('request to render individual sighting  came in');

  const sightingIndex = request.params.index;

  read('data.json', (err, data) => {
    if (err) {
      console.log('read error!');
    }
    const sighting = data.sightings[sightingIndex];
    response.render('singleSight', { sightings: sighting, index: sightingIndex });
  });
};

// render form to edit a single sighting
const renderEditSighting = (request, response) => {
  const { index } = request.params;
  read('data.json', (err, data) => {
    if (err) {
      console.log('Read error: ', err);
    }
    // get the sighting data from content
    const sightings = data.sightings[index];
    // add index value to sighting
    sightings.index = index;
    // add index obj for ejs template to reference
    response.render('edit', { sightings, index });
  });
};

// add edited data to DB
const putEditSighting = (request, response) => {
  const { index } = request.params;

  edit(
    'data.json',
    (err, data) => {
      const { sightings } = data;
      if (err) {
        console.log('Edit error: ', err);
      }
      // replace content at index with new form data
      if (!err) {
        sightings[index] = request.body;
      }
    },
    // add callback function for write function
    (err) => {
      if (!err) { response.redirect(`/sighting/${index}`); }
    },
  );
};

const renderDeleteSighting = (request, response) => {
  const { index } = request.params;
  response.render('delete', { index });
};
const deleteSighting = (request, response) => {
  console.log('request to delete sighting came in');
  // Remove element from DB at given index
  const { index } = request.params;
  read('data.json', (err, data) => {
    data.sightings.splice(index, 1);
    write('data.json', data, (err) => {
      response.status(200).redirect('/');
    });
  });
};

const renderListOfShapes = (request, response) => {
  read('data.json', (err, data) => {
    if (err) {
      console.log('Read error:', err);
    }
    const shapesList = [];
    data.sightings.forEach((sighting) => {
      shapesList.push(sighting.shape);
    });
    const filteredShapeList = [...new Set(shapesList)];
    console.log(filteredShapeList);
    response.render('shapes', { filteredShapeList });
  });
};

app.get('/', renderIndex);
app.get('/sighting', renderForm);
app.post('/sighting', renderAddNewSighting);
app.get('/sighting/:index', renderIndividualSighting);
app.get('/sighting/:index/edit', renderEditSighting);
app.put('/sighting/:index/edit', putEditSighting);
app.get('/sighting/:index', renderDeleteSighting);
app.delete('/sighting/:index', deleteSighting);
app.get('/shapes', renderListOfShapes);
app.listen(3004);
