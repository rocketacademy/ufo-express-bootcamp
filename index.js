import express from 'express';
import methodOverride from 'method-override';
import cookieParser from 'cookie-parser';

import {
  read, add, edit, write,
} from './jsonFileStorage.js';

import { visitCounter, daysFromNow, uniqueVisitor } from './helper.js';

const app = express();
app.use(cookieParser());

// Override POST requests with query param ?_method=PUT to be PUT requests
app.use(methodOverride('_method'));

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }));

const renderIndex = (request, response) => {
  console.log('request to load list of sightings came in');

  const visits = visitCounter(request, response);
  const uniqueVisits = uniqueVisitor(request, response);

  read('data.json', (err, data) => {
    if (err) {
      console.log('Read error', err);
    }
    const { sightings } = data;

    response.render('index', {
      sightings, visits, uniqueVisits, daysFromNow,
    });
  });
};

// render the form
const renderForm = (request, response) => {
  const visits = visitCounter(request, response);
  const uniqueVisits = uniqueVisitor(request, response);

  read('data.json', (err, data) => {
    if (err) {
      console.log('Read error', err);
    }

    response.render('form', { visits, uniqueVisits });
  });
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

  const visits = visitCounter(request, response);
  const uniqueVisits = uniqueVisitor(request, response);

  const sightingIndex = request.params.index;

  read('data.json', (err, data) => {
    if (err) {
      console.log('read error!');
    }
    const sighting = data.sightings[sightingIndex];
    console.log(sighting);

    response.render('singleSight', {
      sightings: sighting, index: sightingIndex, visits, uniqueVisits,
    });
  });
};

// render form to edit a single sighting
const renderEditSighting = (request, response) => {
  const visits = visitCounter(request, response);
  const uniqueVisits = uniqueVisitor(request, response);

  const { index } = request.params;
  read('data.json', (err, data) => {
    if (err) {
      console.log('Read error: ', err);
    }
    const sightings = data.sightings[index];
    sightings.index = index;
    data.visits = visits;
    console.log(sightings);
    response.render('edit', {
      sightings, index, visits, uniqueVisits,
    });
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
  const visits = visitCounter(request, response);
  const uniqueVisits = uniqueVisitor(request, response);

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
    response.render('shapes', { filteredShapeList, visits, uniqueVisits });
  });
};

const renderSightingByShape = (request, response) => {
  console.log('request for selected shape came in ');
  const visits = visitCounter(request, response);
  const uniqueVisits = uniqueVisitor(request, response);

  const { shapes } = request.params;
  console.log(shapes);

  read('data.json', (err, data) => {
    if (err) {
      console.log('read error', err);
    }

    // eslint-disable-next-line max-len
    const selectedShapeSightings = data.sightings.filter((sighting) => (sighting.shape.toLowerCase()) === shapes);

    console.log(selectedShapeSightings);

    if (selectedShapeSightings.length > 0) {
      response.render('sightingsByShape', {
        selectedShapeSightings, shapes, visits, uniqueVisits, daysFromNow,
      });
    }
    else response.status(404).send('Sorry, we cannot find that!');
  });
};

const favourites = (req, res) => {
  const { favorite } = req.query;
  let arrayOfFavorites = [];

  /* if favorite cookie is present, assign the cookie to array */
  if (req.cookies.favorite) {
    arrayOfFavorites = req.cookies.favorite;
    /* add the new favorite sighting into the array */
    arrayOfFavorites.push(Number(favorite));

    arrayOfFavorites.forEach((el, ind, array) => {
      if (array.indexOf(el) !== array.lastIndexOf(el)) {
        array.splice(ind, 2);
      }
    });
  } else {
    /* if the cookie does not exist */
    arrayOfFavorites.push(Number(favorite));
  }
  /* send the cookie back to the browser */
  res.cookie('favorite', arrayOfFavorites);
  /* redirect to main page */
  res.redirect('/');
};

const renderFavourites = (req, res) => {
  const visits = visitCounter(req, res);
  const uniqueVisits = uniqueVisitor(req, res);

  let arrayOfFavorites;
  if (req.cookies.favorite) {
    arrayOfFavorites = req.cookies.favorite;
  }
  read('data.json', (err, data) => {
    if (err) {
      console.log('Read error', err);
    }
    const favsightings = [];
    for (let i = 0; i < arrayOfFavorites.length; i += 1) {
      favsightings.push(data.sightings[arrayOfFavorites[i]]);
    }
    console.log(favsightings);
    res.render('favourite', {
      favsightings, arrayOfFavorites, visits, uniqueVisits, daysFromNow,
    });
  });
};

app.get('/', renderIndex);
app.get('/sighting', renderForm);
app.post('/sighting', renderAddNewSighting);
app.get('/sighting/favourites', renderFavourites);
app.get('/sighting/:index', renderIndividualSighting);
app.get('/sighting/:index/edit', renderEditSighting);
app.put('/sighting/:index/edit', putEditSighting);
app.get('/sighting/:index', renderDeleteSighting);
app.delete('/sighting/:index', deleteSighting);
app.get('/shapes', renderListOfShapes);
app.get('/shapes/:shapes', renderSightingByShape);
app.get('/favourites', favourites);

app.listen(3004);
