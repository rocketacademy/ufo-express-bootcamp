import express from 'express';
import { read, add } from './jsonFileStorage.js';

const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));
// app.use(express.urlencoded({ extended: false }));

const handleIncomingForm = (request, response) => {
  response.render('home');
};

const handleIndividualSighting = (request, response) => {
  console.log('request came in');

  const sightingIndex = request.params.index;

  read('data.json', (err, data) => {
    if (err) {
      console.log('read error!');
    }
    const sighting = data.sightings[sightingIndex];

    response.render('singleSight', { sightings: sighting, index: sightingIndex });
  });
};

const handlePostIncomingForm = (request, response) => {
  console.log('request came in');

  add('data.json', 'sightings', request.body, (err, data) => {
    if (err) {
      console.log('read error');
      return ('read error');
    }

    read('data.json', (err, data) => {
      if (err) {
        console.log('read error');
        return ('read error');
      }

      const index = data.sightings.length - 1;

      response.redirect(`/sighting/${index}`);
    });
  });
};

app.get('/sighting', handleIncomingForm);
app.get('/sighting/:index', handleIndividualSighting);
app.post('/sighting', handlePostIncomingForm);

app.listen(3004);
