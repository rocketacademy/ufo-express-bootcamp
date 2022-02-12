import express from 'express';
import { read } from './jsonFileStorage.js';

const app = express();

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: false }));

const handleIncomingRequest = (request, response) => {
  console.log('request came in');

  read('data.json', (err, data) => {
    const { sightings } = data;
    console.log(sightings);
    response.render('home', { sightings });
  });
};

app.get('/sighting', handleIncomingRequest);
app.listen(3004);
