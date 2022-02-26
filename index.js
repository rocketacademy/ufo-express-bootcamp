import { render } from 'ejs';
import express from 'express';
import methodOverride from 'method-override';
import cookieParser from 'cookie-parser';
import { v4 as uuidv4 } from 'uuid';
import {
  add, edit, read, write,
} from './jsonFileStorage.js';

const app = express();
app.set('view engine', 'ejs');
app.use(cookieParser());

// Override POST requests with query param ?_method=PUT to be PUT requests
// This registers ?_method=PUT to be PUT requests
app.use(methodOverride('_method'));

// Configure Express to parse request body data into request.body
// This just ensures that the data still makes sense with spaces in between
app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));

/**
  * Render the form to input new ufo sightings
 */
app.get('/sighting', (request, response) => {
  read('data.json', (err, data) => {
    if (err) {
      response.status(500).send('DB read error.');
      return;
    }
    response.render('sightings-form', data);
  });
});

/**
  * A function to save new ufo data sent via POST request from our form
 */
app.post('/sighting', (request, response) => {
  // Add new recipe data in request.body to recipes array in data.json.
  add('data.json', 'sightings', request.body, (err) => {
    if (err) {
      response.status(500).send('DB write error.');
      return;
    }
    // export function edit(filename, readCallback, writeCallback)
    edit('data.json', (err, jsonContentObj) => {
      // find the last item in jsonContentObj
      const lastIndex = jsonContentObj.sightings.length - 1;
      if (!err) {
        jsonContentObj.sightings[lastIndex].submit_time = Date();
        for (let i = 0; i < jsonContentObj.sightings.length; i++) {
          // index created for deletion and edit
          jsonContentObj.sightings[i].index = i;
          // id created for favourties?
          jsonContentObj.sightings[i].id = `sighting${i}`;
        }
      }
      // Acknowledge sightings saved.
      response.render('sightings-list', jsonContentObj);
    });
  });
});

/**
  * A function to render a single sighting
 */
app.get('/sighting/:index', (request, response) => {
  read('data.json', (err, data) => {
    if (err) {
      response.status(500).send('DB read error.');
      return;
    }
    // stores the specific object in the array into dataIndex object with key dataIndex
    const dataIndex = { sightings: [data.sightings[request.params.index]] };
    dataIndex.visits = [data.visits[0]];
    response.render('sightings-index', dataIndex);
  });
});

/**
  * A function to store favorites
 */

// // push favorite into an array
//   read('data.json', (err, data) => {
//     if (err) {
//       response.status(500).send('DB read error.');
//       return;
//     }
//     arrayOfFavorites.push(data.sightings[favourite])
//   }

app.get('/fav', (request, response) => {
  // favouriteIndex now takes the index value of the favorited item
  const favouriteIndex = request.query.index;
  const arrayOfFavorites = [];
  // if 'favorite' cookie exists, then try and add current favorite index into arrayOfFavorites
  if (request.cookies.favorite) {
    console.log('this run2');
    // take original VALUES from favorite KEY in the cookies and parse it so we can work on it
    let originalArray = JSON.parse(request.cookies.favorite);
    console.log(originalArray);
    // next, take new value of favorited item i.e., favouriteIndex and try and add into array
    // will need it to NOT add if it already exist
    const mySet = new Set(originalArray);
    mySet.add(favouriteIndex);
    originalArray = Array.from(mySet);
    // Original Array will be the full set of indexes of our favorite items
    console.log(originalArray);
    const newArrayOfFavoritesString = JSON.stringify(originalArray);
    console.log(newArrayOfFavoritesString);
    response.cookie('favorite', newArrayOfFavoritesString);
    // I will now need to find a way to pick out those data
    read('data.json', (err, data) => {
      const storedFavItem = [];
      if (err) {
        response.status(500).send('DB read error.');
      }
      for (let v = 0; v < originalArray.length; v++) {
        for (let i = 0; i < data.sightings.length; i++) {
          if (Number(originalArray[v]) === data.sightings[i].index) {
          // store data
            storedFavItem.push(data.sightings[i]);
          }
        }
        console.log(storedFavItem);
      }
      const test = { sightings: storedFavItem };
      console.log(test);
      response.render('fav', test);
    });
  } else {
    // if 'favorite' does not exist then create it
    // first add into arrayofFavorites
    arrayOfFavorites.push(favouriteIndex);
    console.log(arrayOfFavorites);
    const arrayOfFavoritesString = JSON.stringify(arrayOfFavorites);
    console.log(arrayOfFavoritesString);
    response.cookie('favorite', arrayOfFavoritesString);
    // I will now need to find a way to pick out those data
    read('data.json', (err, data) => {
      const storedFavItem = [];
      if (err) {
        response.status(500).send('DB read error.');
      }
      for (let v = 0; v < arrayOfFavorites.length; v++) {
        for (let i = 0; i < data.sightings.length; i++) {
          if (Number(arrayOfFavorites[v]) === data.sightings[i].index) {
          // store data
            console.log('this run1?');
            storedFavItem.push(data.sightings[i]);
          }
        }
      }
      const test = { sightings: storedFavItem };
      response.render('fav', test);
    });
  }
});

/**
  * A function to render a list of sightings, also the HOME page
 */
app.get('/', (request, response) => {
  let visitCount = 0;
  let visits = 0;
  let uniqueVisitorTest = 0;
  // check if it's not the first time a request has been made
  // if there is already a request, then not unique.
  // Note that visits in request.cookies.visits refers to the KEY of the response.cookie(KEY, VALUE)
  if (request.cookies.visits) {
    visits = Number(request.cookies.visits); // get the value from the request
  }
  // if it's the first time
  if (request.cookies.visits === undefined) {
    uniqueVisitorTest += 1;
    // Will need to write the current Visit Count to 0
    read('data.json', (err, data) => {
      if (err) {
        response.status(500).send('DB read error.');
        return;
      }
      data.visits[0].CURRENTVISITCOUNT = 0;
      write('data.json', data, (err) => {
        console.log('This should only write if I had cleared cookie before hand; must also write first, when this writes, currentVisitCount should go back to 1');
      });
    });
  }
  // set a new value of the cookie
  visitCount += 1;
  visits += 1;
  response.cookie('visits', visits); // set a new value to send back

  read('data.json', (err, data) => {
    console.log(data.visits[0].CURRENTVISITCOUNT);
    if (err) {
      response.status(500).send('DB read error.');
      return;
    }
    // update the values in data.visits
    // adds to the unique Visitor count
    const storeNumber1 = data.visits[0].uniqueVisitors + uniqueVisitorTest;
    data.visits[0].uniqueVisitors = storeNumber1;
    // adds to the current Visit count
    console.log(data.visits[0].CURRENTVISITCOUNT);
    const storeNumber2 = data.visits[0].CURRENTVISITCOUNT + visitCount;
    data.visits[0].CURRENTVISITCOUNT = storeNumber2;
    // adds to the total Visit count
    const storeNumber3 = data.visits[0].totalVisitCount + visitCount;
    data.visits[0].totalVisitCount = storeNumber3;
    write('data.json', data, (err) => {
      console.log('Am I writing? 2');
    });
    response.render('sightings-list', data);
  });
});

/**
  * A function to render a list of sightings - showing latest date
 */
app.get('/latest-date', (request, response) => {
  read('data.json', (err, data) => {
    let dataChanged;
    if (err) {
      response.status(500).send('DB read error.');
      return;
    }
    for (let i = 0; i < data.sightings.length; i++) {
      const dateInteger = Date.parse(data.sightings[i].date_time);
      // create a new key
      data.sightings[i].dateInteger = dateInteger;
    }
    // array of objects is sorted
    data.sightings.sort((a, b) => b.dateInteger - a.dateInteger);
    for (let i = 0; i < data.sightings.length; i++) {
      // does this give them an index?
      data.sightings[i].index = i;
    }
    write('data.json', data, (err) => {
      response.render('sorted-latest-date', data);
    });
  });
});

/**
  * A function to render a list of sightings - showing earliest date
 */
app.get('/earliest-date', (request, response) => {
  read('data.json', (err, data) => {
    let dataChanged;
    if (err) {
      response.status(500).send('DB read error.');
      return;
    }
    for (let i = 0; i < data.sightings.length; i++) {
      const dateInteger = Date.parse(data.sightings[i].date_time);
      // create a new key
      data.sightings[i].dateInteger = dateInteger;
    }
    // array of objects is sorted
    data.sightings.sort((a, b) => a.dateInteger - b.dateInteger);
    for (let i = 0; i < data.sightings.length; i++) {
      // does this give them an index?
      data.sightings[i].index = i;
    }
    write('data.json', data, (err) => {
      response.render('sorted-earliest-date', data);
    });
  });
});

/**
  * A function to render a list of sightings - showing shapes
 */
app.get('/shape', (request, response) => {
  const sortOrder = request.query.sort;
  read('data.json', (err, data) => {
    if (err) {
      response.status(500).send('DB read error.');
      return;
    }
    if (sortOrder === 'asc') {
      data.sightings.sort((a, b) => {
        const fa = a.shape.toLowerCase();
        const fb = b.shape.toLowerCase();

        if (fa < fb) {
          return -1;
        }
        if (fa > fb) {
          return 1;
        }
        return 0;
      });
      for (let i = 0; i < data.sightings.length; i++) {
        data.sightings[i].index = i;
      }
      write('data.json', data, (err) => {
        response.render('sightings-shape', data);
      });
    }
    if (sortOrder === 'dsc') {
      data.sightings.sort((a, b) => {
        const fa = a.shape.toLowerCase();
        const fb = b.shape.toLowerCase();

        if (fa > fb) {
          return -1;
        }
        if (fa < fb) {
          return 1;
        }
        return 0;
      });
      for (let i = 0; i < data.sightings.length; i++) {
        data.sightings[i].index = i;
      }

      write('data.json', data, (err) => {
        response.render('sightings-shape', data);
      });
    }
    response.render('sightings-shape', data);
  });
});

/**
  * A function to render a list of sightings - showing cities
 */
app.get('/city', (request, response) => {
  const sortOrder = request.query.sort;
  read('data.json', (err, data) => {
    if (err) {
      response.status(500).send('DB read error.');
      return;
    }
    if (sortOrder === 'asc') {
      data.sightings.sort((a, b) => {
        const fa = a.shape.toLowerCase();
        const fb = b.shape.toLowerCase();

        if (fa < fb) {
          return -1;
        }
        if (fa > fb) {
          return 1;
        }
        return 0;
      });
      for (let i = 0; i < data.sightings.length; i++) {
        data.sightings[i].index = i;
      }
      write('data.json', data, (err) => {
        response.render('sightings-city', data);
      });
    }
    if (sortOrder === 'dsc') {
      data.sightings.sort((a, b) => {
        const fa = a.shape.toLowerCase();
        const fb = b.shape.toLowerCase();

        if (fa > fb) {
          return -1;
        }
        if (fa < fb) {
          return 1;
        }
        return 0;
      });
      for (let i = 0; i < data.sightings.length; i++) {
        data.sightings[i].index = i;
      }
      write('data.json', data, (err) => {
        response.render('sightings-city', data);
      });
    }
    response.render('sightings-city', data);
  });
});

/**
  * A function to edit sightings
 */
app.put('/sighting/:index', (request, response) => {
  read('data.json', (err, data) => {
    const { index } = request.params;
    const indexInt = parseInt(index);
    console.log(indexInt);
    // find the index key in data.sightings[X].index which matches the value of :index
    for (let i = 0; i < data.sightings.length; i++) {
      // Replace the data in the object at the given index
      // reorder id for favourites
      data.sightings.id = `sighting${i}`;
      if (data.sightings[i].index === indexInt) {
        data.sightings[i] = request.body;
        // Replace the index
        data.sightings[i].index = indexInt;
      }
    }
    write('data.json', data, (err) => {
      response.send('Done!');
    });
  });
});

/**
  * A function to render a form to edit a sighting.
 */
app.get('/sighting/:index/edit', (request, response) => {
  // Retrieve current recipe data and render it
  read('data.json', (err, data) => {
    const sighting = data.sightings[request.params.index];
    // Pass the sightings index to the edit form for the PUT request URL.
    // Assigns an index key to the specific object that's going to be edited
    sighting.index = request.params.index;
    const ejsData = { sighting };
    response.render('edit', ejsData);
  });
});

app.delete('/:index', (request, response) => {
  // Remove element from DB at given index
  const { index } = request.params;
  read('data.json', (err, data) => {
    data.sightings.splice(index, 1);
    write('data.json', data, (err) => {
      response.render('sightings-list', data);
    });
  });
});

app.get('/shapes/:shape', (request, response) => {
  // Retrieve current recipe ufo and render it
  read('data.json', (err, data) => {
    // store Array of items of "sightings" key in itemsArray
    // const specificYearArray = data.sightings.filter((a) => a.YEAR === request.params.index);
    const itemsArray = data.sightings;
    const resultArray = itemsArray.filter((writeAny) => writeAny.shape.toLowerCase() === request.params.shape.toLowerCase());
    // give it a sightings key again
    response.render('shapes-filter', { sightings: resultArray });
  });
});

app.listen(3004);
