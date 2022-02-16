import express from 'express';
import methodOverride from 'method-override';
import { read, add, write } from './jsonFileStorage.js';

const app = express();

// Override POST requests with query param ?_method=PUT to be PUT requests
app.use(methodOverride('_method'));

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }));

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

  // read('data.json', (err, data) => {
  //   if (err) {
  //     console.log('read error');
  //   }

  //   const index = data.sightings.length - 1;

  //   response.redirect(`/sighting/${index}`);
  // });
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

const handlePutIncomingForm = (request, response) => {
  console.log('request to came in');

  const sightingIndex = request.params.index;

  read('data.json', (err, data) => {
    if (err) {
      console.log('read error!');
    }
    data.sightings[sightingIndex] = request.body;
    console.log(request.body);

    write('data.json', data, (err) => {
      response.render('editSightings', { sightings: data.sightings[sightingIndex] });
    });
  });
};

app.get('/sighting', renderForm);
app.post('/sighting', renderAddNewSighting);
app.get('/sighting/:index', renderIndividualSighting);
app.get('/sighting/:index/edit', handlePutIncomingForm);

app.listen(3004);
