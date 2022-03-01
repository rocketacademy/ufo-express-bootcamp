import methodOverride from 'method-override';
import express from 'express';
import cookieParser from 'cookie-parser';

import {
  read, add, deleteContent, edit,
} from './jsonFileStorage.js';

// Global set up of relevant apps
const app = express();
const PORT = 3000;
const FILENAME = 'data.json';

// Set view engine to EJS
app.set('view engine', 'ejs');
// Middleware to allow static images/css files to be served
app.use(express.static('public'));
// Provides encoding to url queries etc.
app.use(express.urlencoded({ extended: false }));
// Middleware that allows POST methods to be overriden to perform PUT and DELETE requests
app.use(methodOverride('_method'));
// Middleware that allows cookies to be captured;
app.use(cookieParser());

// Function that checks the inputs for validation
const performValidationOnRequestBody = (requestBodyObj, callback) => {
  const inputValidationFeedbackObj = {};
  let isFormValid = true;
  const {
    description, shape,
  } = requestBodyObj;

  if (description.length < 5) {
    inputValidationFeedbackObj.description = 'Description is too short!';
    isFormValid = false;
  } else {
    inputValidationFeedbackObj.description = 'ok';
  }

  if (shape.toLowerCase() !== 'sphere' && shape.toLowerCase() !== 'circle') {
    inputValidationFeedbackObj.shape = 'Shape is not valid.';
    isFormValid = false;
  } else {
    inputValidationFeedbackObj.shape = 'ok';
  }
  callback(inputValidationFeedbackObj, isFormValid);
};

// Function that sets a time for cookies
const setExpiryForCookies = () => {
  let date = new Date(Date.now() + 86400e3);
  date = date.toUTCString();
  return date;
};
// Function that populates the states of all favorites button in the root
// page from (request) cookies
const populateStateOfFavoritesBtns = (reqCookies, data) => {
  // To populate all the state of the favorites button in the root page from the cookies
  // if favoriteSightingId exists, it means that the cookie has at least initialized `favoriting`
  if (reqCookies.favoriteSightingId) {
    // First destructure request.cookies since it exists now
    const { favoriteSightingId: existingfavoriteSightingIdArray } = reqCookies;
    // Second, "reduce" the current iteration of data.sightings[index].hearts with data from cookies
    data.sightings.forEach((sighting) => {
      // default value is no
      sighting.favorite = 'no';
      // but if it matches an id in the cookie, then we change it to yes
      existingfavoriteSightingIdArray.forEach((favoriteSightingId) => {
        if (favoriteSightingId === sighting.id) {
          sighting.favorite = 'yes';
        }
      });
    });
  }
};

// Function that checks if a fav btn is clicked and handles
// the subsequent state/events of the favorite buttons
const trackStateOfFavoritesBtns = (reqQuery, reqCookies, response, data) => {
  // If request.query.heart is defined (i.e heart has been clicked)
  if (reqQuery.heart) {
    const { heart: heartId } = reqQuery;

    // if request cookie is undefined
    // it does not contain a field on favoriteSightingId -> means this is the first favorite
    if (!reqCookies.favoriteSightingId) {
      const newArrayOfFavoriteSightingId = [];
      newArrayOfFavoriteSightingId.push(Number(heartId));
      response.cookie('favoriteSightingId', newArrayOfFavoriteSightingId);

      data.sightings[heartId - 1].favorite = 'yes';
      // otherwise the favoriteSightingId field exists (at least 1 heart)
    } else {
      // First destructure request.cookies since it exists now
      const { favoriteSightingId: existingfavoriteSightingIdArray } = reqCookies;

      // Third if the current heart is already correspond
      // to something inside the favoriteSightingId field
      // if it doesnt, push it in
      if (existingfavoriteSightingIdArray.indexOf(Number(heartId)) === -1) {
        existingfavoriteSightingIdArray.push(Number(heartId));
        response.cookie('favoriteSightingId', existingfavoriteSightingIdArray);

        // edit current instance of data.sightings w/o writing to data.json
        data.sightings[heartId - 1].favorite = 'yes';
      } else {
        // if it sightingid already exists, then we remove it
        existingfavoriteSightingIdArray.splice(existingfavoriteSightingIdArray
          .indexOf(Number(heartId)), 1);
        response.cookie('favoriteSightingId', existingfavoriteSightingIdArray);

        // edit current instance of data.sightings w/o writing to data.json
        data.sightings[heartId - 1].favorite = 'no';
      }
    }
  }
};

// Function that sorts the table of sightings in the main page
const sortTableOfSightings = (reqQuery, data) => {
  const orderOfSort = reqQuery.sortOrder;
  // Sort by url query params
  data.sightings.sort((a, b) => {
    if (orderOfSort === 'ascending') {
      return a.id - b.id;
    } if (orderOfSort === 'descending') {
      return b.id - a.id;
    }
    return a.id - b.id;
  });
};

// Function that handles visitors count for the time website is live
const trackVisitorsCount = (reqCookies, response, data) => {
  let visits = Number(reqCookies.visits);
  // Exit the function if a user visited this site before
  // as indicated by an expires attribute in cookie
  if (reqCookies.expires) {
    data.visits = visits;
    return;
  }

  // If num of visits is NaN i.e this is the 1st visitor...
  if (Number.isNaN(visits)) {
    visits = 1;
    response.cookie('visits', 1);
    response.cookie('expires', setExpiryForCookies());
    // else if the resCookie sends back a legit visits number and has no expiry
    // it must be a new & unique visitor
  } else {
    visits += 1;
    response.cookie('visits', visits);
    response.cookie('expires', setExpiryForCookies());
  }
  data.visits = visits;
};

// Route: Homepage - Shows all sightings, sortable by ID
app.get('/', (request, response) => {
  read(FILENAME, (data, error) => {
    if (error) {
      response.sendStatus(500, error);
      return;
    }
    // To populate all the state of the favorites button in the root page from the cookies
    populateStateOfFavoritesBtns(request.cookies, data);

    // To track the subsequent state and events of favoritebtns being pressed/unpressed
    trackStateOfFavoritesBtns(request.query, request.cookies, response, data);

    // To track visitors count, everytime root page is refreshed
    trackVisitorsCount(request.cookies, response, data);

    // To sort the table (without manipulating database) of sightings in root page
    sortTableOfSightings(request.query, data);
    response.render('allSightings', data);
  });
});

// Route: Create form to input sighting
app.get('/newSighting', (request, response) => {
  read(FILENAME, (data, error) => {
    if (error) {
      response.sendStatus(500, error);
      return;
    }
    response.render('submitNewSightingForm', data);
  });
});

// Create a POST method / request to submit new sighting
app.post('/newSighting', (request, response) => {
  // locally scoped boolean to track if current form is valid
  let isThisFormValid = true;

  // Perform input validation first
  performValidationOnRequestBody(request.body, (feedbackMsg, areFieldsValid) => {
    if (areFieldsValid === false) {
      request.body.feedback = feedbackMsg;
      isThisFormValid = false;
      response.render('submitNewSightingForm', request.body);
    }
  });
  if (isThisFormValid === false) {
    return;
  }

  /**
   * @param {FILENAME} contains all the data of the sightings to be read
   * @param {key} the key to access in the file to be added
   * @param {input} takes in request.body
   * @param {callback} performs a callback after taking in the data and error vars from add fn
  */
  add(FILENAME, 'sightings', request.body, (data, error) => {
    // to be redirected to sighting/<index>
    response.redirect(`/sighting/${data.sightings.length}`);
  });
});

// Route: Render a particular sighting
app.get('/sighting/:id', (request, response) => {
  // id of sighting is not zero-indexed
  const { id } = request.params;
  read(FILENAME, (data) => {
    const sightingData = data.sightings[id - 1];
    response.render('sighting', sightingData);
  });
});

// Render a form to edit a sighting
app.get('/sighting/:id/edit', (request, response) => {
  // id of sighting is not zero-indexed
  const { id } = request.params;
  read(FILENAME, (data) => {
    const sightingData = data.sightings[id - 1];
    response.render('editExistingSightingForm', sightingData);
  });
});

// Edit the sighting through a PUT method
app.put('/sighting/:id/edit', (request, response) => {
  // id of sighting is not zero-indexed
  const { id } = request.params;

  // locally scoped boolean to track if current form is valid
  let isThisFormValid = true;

  // Perform input validation first
  performValidationOnRequestBody(request.body, (feedbackMsg, areFieldsValid) => {
    if (areFieldsValid === false) {
      // Assigning feedback & id from helper function into request.body
      request.body.feedback = feedbackMsg;
      // Note that request.body generated by all the forms does not include id automatically,
      // hence the inclusion
      request.body.id = id;
      isThisFormValid = false;
      response.render('sightingFormEdit', request.body);
    }
  });
  if (isThisFormValid === false) {
    return;
  }
  /**
 * @param {FILENAME} some file to be read
 * @param {id} the corresponding id of the sighting
 * @param {input} takes in request.body
 * @param {callback} performs a callback after taking in the data and error vars from add fn
*/
  edit(FILENAME, id, request.body, (data, error) => {
    if (error) {
      response.sendStatus(500, 'error');
      return;
    }
    response.redirect(`/sighting/${data.sightings.length}`);
  });
});

// Render a list of all sighting shapes
app.get('/shapes', (request, response) => {
  read(FILENAME, (data) => {
    response.render('allShapes', data);
  });
});

// Render sighting based on a shape
app.get('/shapes/:shape', (request, response) => {
  const { shape: selectedShape } = request.params;
  read(FILENAME, (data) => {
    // Declare an object that stores the desired shape, followed by corresponding sighting
    const selectedShapeSightings = { sightings: [], shape: '' };
    selectedShapeSightings.shape = selectedShape;
    // Filter by shape and stores all the associated sighting(s)
    // into an sightings key/variable within selectedShapeSightings obj
    selectedShapeSightings.sightings = data.sightings.filter((sighting) => sighting.shape === selectedShape);
    response.render('shape', selectedShapeSightings);
  });
});

// Render all favorited sightings
app.get('/favorites', (request, response) => {
  read(FILENAME, (data) => {
    // Retrieve array of favorite sightings from cookies
    const { favoriteSightingId: arrayOfIds } = request.cookies;
    console.log(arrayOfIds, 'test');
    const favoriteSightings = {};
    favoriteSightings.sightings = data.sightings.filter((sighting) => arrayOfIds.indexOf(sighting.id) !== -1);

    response.render('favoriteSightings', favoriteSightings);
  });
});

// Accept a request to delete a sighting
app.delete('/sighting/:id/', (request, response) => {
  const { id } = request.params;
  deleteContent(FILENAME, id, (data, error) => {
    if (error) {
      response.sendStatus(500, 'error');
      return;
    }
    response.redirect('/');
  });
});

app.listen(PORT);
