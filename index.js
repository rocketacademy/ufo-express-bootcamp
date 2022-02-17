import express from 'express';
import methodOverride from 'method-override';
import cookieParser from 'cookie-parser';
import {
  addData, editData, read, write, deleteEntry,
} from './jsonFileStorage.js';

const app = express();
app.use(express.urlencoded({ extended: false }));
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(methodOverride('_method'));
app.use(cookieParser());

const dataValidation = (objectInput) => {
  // eslint-disable-next-line no-restricted-syntax
  if (objectInput.text === '' || objectInput.city === '' || objectInput.shape === '') {
    console.log('false');
    return false;
  }
};
// show form to record sighting
app.get('/sighting', (req, res) => {
  read('data.json', (data) => {
    res.render('sighting', data);
  });
});

// show that sighting submission has been received
app.post('/sighting', (req, res) => {
  if (dataValidation(req.body) === false) {
    console.log('false');
    res.status(422).send('error');
  } else {
    addData('data.json', 'sightings', req.body, (dataObject) => {
      const index = dataObject.sightings.length - 1;
      console.log(index);
      res.redirect(`/sighting/${index}`);
    });
  }
});

// show sighting based on index
app.get('/sighting/:index', (req, res) => {
  const { index } = req.params;
  const displayContent = {};
  displayContent.fav = false;
  if (req.cookies.fav) {
    if (JSON.parse(req.cookies.fav).faves.includes(index)) {
      displayContent.fav = true;
    }
  }

  read('data.json', (data) => {
    if (index >= data.sightings.length) {
      res.send('no such entry, please try another entry');
    } else {
      displayContent.sightings = data.sightings[index];
      displayContent.index = index;
      console.log(displayContent, '-display');
      // res.send(displayContent);
      console.log('display content', displayContent);
      res.render('sighting-index', displayContent);
    }
  });
});

// show all sightings
app.get('/', (req, res) => {
  const sortBy = req.query.sort;
  console.log(sortBy);
  let visits = 0;
  if (req.cookies.visits) {
    visits = Number(req.cookies.visits);
  }
  visits += 1;
  res.cookie('visits', visits);

  read('data.json', (data) => {
    switch (sortBy) {
      case ('dateasc'):
        data.sightings.sort((a, b) => new Date(a.date_time) - new Date(b.date_time));
        console.log(data.sightings, 'sorted');
        break;
      case ('datedesc'):
        data.sightings.sort((a, b) => new Date(b.date_time) - new Date(a.date_time));
        console.log(data.sightings, 'sorted');
        break;
      case ('cityasc'):
        data.sightings.sort((a, b) => a.city.localeCompare(b.city));
        console.log(data.sightings, 'sorted by city');
        break;
      case ('citydesc'):
        data.sightings.sort((a, b) => b.city.localeCompare(a.city));
        console.log(data.sightings, 'sorted by city');
        break;
      case ('shapeasc'):
        data.sightings.sort((a, b) => a.shape.localeCompare(b.shape));
        break;
      case ('shapedesc'):
        data.sightings.sort((a, b) => b.shape.localeCompare(a.shape));

        break;
      default:
        data.sightings.sort((a, b) => a.date_UTC - b.date_UTC);
    }
    if (req.cookies.fav) {
      data.fav = JSON.parse(req.cookies.fav);
      console.log(data.fav, 'data');
    }
    data.visit = visits;
    console.log(data);
    res.render('index', data);
  });
});

app.get('/favorites', (req, res) => {
  const favList = { faves: [] };
  const index = req.query.fav;

  if (req.cookies.fav) {
    console.log('currentList running');
    const currentList = JSON.parse(req.cookies.fav);
    if (currentList.faves.includes(index)) {
      currentList.faves.splice(currentList.faves.indexOf((index), 1));
    } else {
      currentList.faves.push(index);
    }
    res.cookie('fav', JSON.stringify(currentList));
  } else {
    console.log('this running');
    favList.faves.push(index);
    res.cookie('fav', JSON.stringify(favList));
  }
  res.redirect(req.get('referer'));
});

// Render a form to edit a sighting.

app.get('/sighting/:index/edit', (req, res) => {
  const { index } = req.params;
  const displayContent = {};
  read('data.json', (data) => {
    if (index >= data.sightings.length) {
      res.send('no such entry, please try another entry');
    } else {
      displayContent.sightings = data.sightings[index];

      displayContent.index = index;
      displayContent.cities = data.cities;
      displayContent.shapes = data.shapes;
      console.log(displayContent);
      // res.send(displayContent);
      res.render('edit', displayContent);
    }
  });
});

// Accept a request to edit a single sighting

app.put('/sighting/:index/edit', (req, res) => {
  const { index } = req.params;
  editData('data.json', 'sightings', req.body, index, (err) =>
  { if (err) { console.log('err', err); }
    res.redirect(`/sighting/${index}`);
    console.log(req.body);
  });
});

// Accept a request to delete a sighting.

// const updateIndex = (dataObj) => {
//   dataObj.forEach((x) => { x.index = dataObj.indexOf(x); });
// };

app.delete('/sighting/:index', (req, res) => {
  const { index } = req.params;

  deleteEntry('data.json', 'sightings', index);
  if (req.cookies.fav) {
    const currentList = JSON.parse(req.cookies.fav);
    if (currentList.faves.includes(index)) {
      currentList.faves.splice(currentList.faves.indexOf(index), 1);
      res.cookie('fav', JSON.stringify(currentList));
    }
  }
  res.render('deleted');
  // read('data.json', (data) => {
  //   // data.sightings[index].index = index;
  //   data.sightings.splice(index, 1);
  //   updateIndex(data.sightings);
  //   write('data.json', data);
  //   res.render('deleted');
  // });
});

// Render a list of sighting shapes.

app.get('/shapes', (req, res) => {
  const sortBy = req.query.sort;
  read('data.json', (data) => {
    switch (sortBy) {
      case ('shapeasc'):
        data.shapes.sort();
        console.log(data.shapes, 'sorted by shape');
        break;
      case ('shapedesc'):
        data.cities.sort();
        data.cities.reverse();
        console.log(data.shapes, 'sorted desc shape');
        break;
      default:
        data.sightings.sort((a, b) => new Date(a.recorded) - new Date(b.recorded));
    }
    res.render('shapes', data);
  });
});

// Render a list of sightings with a specific shape
app.get('/shapes/:shape', (req, res) => {
  console.log(req.params.shape);
  const { shape } = req.params;
  const displayContent = { sightings: [] };
  read('data.json', (data) => {
    data.sightings.forEach((sighting) => {
      if (sighting.shape.toLowerCase() === shape.toLowerCase()) {
        displayContent.sightings.push(sighting);
      }
    });
    console.log(displayContent);
    res.render('shape-index', displayContent);
  });
});

// Render a list of sighting cities.

app.get('/cities', (req, res) => {
  const sortBy = req.query.sort;
  read('data.json', (data) => {
    switch (sortBy) {
      case ('cityasc'):
        data.cities.sort();
        console.log(data.cities, 'sorted by city');
        break;
      case ('citydesc'):
        data.cities.sort();
        data.cities.reverse();
        console.log(data.cities, 'sorted desc city');
        break;
      default:
        data.sightings.sort((a, b) => new Date(a.recorded) - new Date(b.recorded));
    }
    res.render('cities', data);
  });
});
// Render a list of sightings with a specific shape
app.get('/cities/:city', (req, res) => {
  console.log(req.params.city);
  const { city } = req.params;
  const displayContent = { sightings: [] };
  read('data.json', (data) => {
    data.sightings.forEach((sighting) => {
      if (sighting.city.toLowerCase() === city.toLowerCase()) {
        displayContent.sightings.push(sighting);
      }
    });
    console.log(displayContent);
    res.render('cities-index', displayContent);
  });
});
// save a sighting to favourites

app.put('/sighting/:index', (req, res) => {
  const { index } = req.params;
  console.log(req.body);

  editData('data.json', 'sightings', req.body, index, (err) =>
  { if (err) { console.log('err', err); }
    console.log(req.body);
    res.redirect(`/sighting/${index}`);
  });
});

// eslint-disable-next-line quote-props

app.listen(3004);
