import express, { query } from 'express';
import { read, add, edit, write } from './jsonFileStorage.js';
import methodOverride from 'method-override'
import cookieParser from 'cookie-parser';
 
const app = express();
app.set('view engine', 'ejs');

// Configure Express to parse request body data into request.body
app.use(express.urlencoded({ extended: false }));
app.use(methodOverride('_method'));
app.use(express.static('public'))
app.use(cookieParser());

const PORT = 3004;

app.get('/sighting', (req, res) => {
  res.render('sightingForm');
})

app.post('/sighting', (req, res) => {
  const form = req.body;
  form.duration += ' minutes';
  const datetimeArray = form.date_time.split('T');
  const dateArray = datetimeArray[0].split('-');
  const datetime = `${dateArray[2]}/${Number(dateArray[1])}/${dateArray[0].substr(2,2)} ${datetimeArray[1]}`;
  form.date_time = datetime;

  add('data.json', 'sightings', form, (err) => {
    if (err) {
      res.status(500).send('DB write error.');
      return;
    }
    // Acknowledge recipe saved.
    res.send('Saved sighting!');
  });
})

// app.get('/favourite', (req, res) => {
//   console.log(req.params);
//   console.log(req.query);

//   const {sighting} = req.query;
//   res.cookie('favourite', sighting);
//   const example = JSON.parse(res.cookie.favourite);
//   res.send("Cookie saved!")
// })

app.get('/sighting/:index', (req, res) => {
  // res.cookie('name', 'john');
  const index = Number(req.params.index);
  read('data.json', (err, jsonContentObj) => {
    if (err) {
      res.status(500).send('DB write error.');
    }

    const {sightings} = jsonContentObj;
    const singleSighting = sightings[index];
    singleSighting.index = index;
    const ejsObject = {singleSighting};
    console.log(ejsObject);
    res.render('viewSighting', ejsObject);
  })
})

app.get('/', (req,res) => {
  read('data.json', (err, jsonContentObj) => {
    if (err) {
      res.status(500).send('DB read error.');
    }

    const {sightings} = jsonContentObj;
    const ejsObject = {sightings};

    res.render('viewSighting', ejsObject);
  });
})

app.get('/sighting/:index/edit', (req, res) => {
  const index = Number(req.params.index);

  read('data.json', (err, jsonContentObj) => {
    if (err) {
      res.status(500).send('DB read error.');
    }

    const {sightings} = jsonContentObj;
    const singleSighting = sightings[index];
    singleSighting.index = index
    const ejsObject = {singleSighting};

    res.render('sightingForm', ejsObject);
  });
})

app.put('/sighting/:index/edit', (req, res) => {
  const index = Number(req.body.index);
  delete req.body.index;
  const form = req.body;
  form.duration += ' minutes';
  const datetimeArray = form.date_time.split('T');
  const dateArray = datetimeArray[0].split('-');
  const datetime = `${dateArray[2]}/${Number(dateArray[1])}/${dateArray[0].substr(2,2)} ${datetimeArray[1]}`;
  form.date_time = datetime;

  let ejsObject;

  edit('data.json', (readErr, jsonContentObj) => {
    if (readErr) {
      res.status(500).send('DB read error.');
    }

    const original = jsonContentObj.sightings;
    original[index] = form;
    jsonContentObj.sightings = original;

    const {sightings} = jsonContentObj;
    ejsObject = {sightings};

  }, (writeErr) => {
    if (writeErr) {
      res.status(500).send('DB write error.');
    }
    
    res.render('viewSighting', ejsObject);
  });
})

// app.delete('/sighting/:index/delete', (req, res) => {
//   const index = Number(req.params.index);

//   let ejsObject;

//   read('data.json', (err, jsonContentObj) => {
//     const original = jsonContentObj.sightings;
//     original.splice(index, 1);
//     jsonContentObj.sightings = original;
//     // console.log(jsonContentObj.sightings)

//     const {sightings} = jsonContentObj;
//     ejsObject = {sightings};
//     write('data.json', jsonContentObj, (writeErr) => {
//       if (writeErr) {
//       res.status(500).send('DB write error.');
//       }
//       console.log(ejsObject);
//       console.log("Delete process done")
//       // res.send("AAAAA")
//       res.render('viewSighting', ejsObject);
//     });
//   });
// });

app.delete('/sighting/:index/delete', (req, res) => {
  const index = Number(req.params.index);

  let ejsObject;

  edit('data.json', (readErr, jsonContentObj) => {
    if (readErr) {
      res.status(500).send('DB read error.');
    }

    const original = jsonContentObj.sightings
    original.splice(index, 1)
    jsonContentObj.sightings = original
    // console.log(jsonContentObj.sightings)

    const {sightings} = jsonContentObj;
    ejsObject = {sightings};
    

  }, (writeErr) => {
    if (writeErr) {
      res.status(500).send('DB write error.');
    }
    console.log(ejsObject);
    console.log("Delete process done")
    // res.send("AAAAA")
    res.render('viewSighting', ejsObject);
  });
});

app.get('/shapes', (req,res) => {
  read('data.json', (err, jsonContentObj) => {
    if (err) {
      res.status(500).send('DB read error.');
    }

    const {sightings} = jsonContentObj;
    const shapes = [];
    sightings.forEach(element => {
      if (!shapes.includes(element.shape)) {
        shapes.push(element.shape);
      }
    });
    const ejsObject = {shapes};

    res.render('shapes', ejsObject);
  });
});

app.get('/shapes/:shape', (req,res) => {
  read('data.json', (err, jsonContentObj) => {
    if (err) {
      res.status(500).send('DB read error.');
    }

    const {sightings} = jsonContentObj;
    const {shape} = req.params 
    const filteredSightings = [];
    sightings.forEach((element, index) => {
      if (element.shape === shape) {
        element.index = index;
        filteredSightings.push(element);
      }
    });
    console.log(filteredSightings)
    const ejsObject = {filteredSightings};

    res.render('shapes', ejsObject);
  });
})

app.listen(PORT);