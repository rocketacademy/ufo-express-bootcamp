import express, { json, request } from 'express';
import methodOverride from 'method-override';
import { read, write, add, edit } from './jsonFileStorage.js';


const jsonFilepath = './data.json'

const app = express()
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: false }));
// Override POST requests with query param ?_method=PUT to be PUT requests
app.use(methodOverride('_method'));

app.get('/', (req, res) => {
  // res.send('Home Page')
  // this should be a list of sightings
  // aka read json
  read('./data.json', (err, data) => {
    if (err){
      console.log("Read Error:", err)
    }
    // const sightingQuery = req.query.sighting;
    // data.sightings.sort((a, b) => ((a.sightingQuery > b.sightingQuery) ? 1 : -1));
    res.render('index', data)
  })
})

app.get('/sighting', (req, res) => {
  res.render('sighting')
})

app.post('/sighting', (req, res) => {
  const newData = req.body
  add(jsonFilepath, 'sightings', newData, (err, data) => {
    if (err){
      console.log("Error:", err)
      res.status(500).render('500')
    }
    res.redirect('/');
  })
})

app.get('/sighting/:index', (req, res) => {
  read(jsonFilepath, (err, data) => {
    if (err){
      console.log("Error:", err)
    }

  // Respond with the information at the index specified in the URL  
  const singleSightingIndex  = req.params.index
  const singleSightingData = data.sightings[singleSightingIndex]
  const singleSightingObject = {singleSightingIndex, singleSightingData}
  // console.log("sent object:", singleSightingObject)
  res.render('single-sighting', singleSightingObject)
  })
})

// app.get('/sighting/:index/edit')
app.get('/sighting/:index/edit', (req, res) => {
  read(jsonFilepath, (err, data) => {
    if (err){
      console.log("Error:", err)
    }

  // Respond with the information at the index specified in the URL  
  const singleSightingIndex  = req.params.index
  const singleSightingData = data.sightings[singleSightingIndex]
  const singleSightingObject = {singleSightingIndex, singleSightingData}
  // console.log("sent object:", singleSightingObject)
  res.render('edit-sighting', singleSightingObject)
  })
})

app.put('/sighting/:index/edit', (req, res) => {
  edit(jsonFilepath, (err, data) => {
    data.sightings[req.params.index] = req.body
  }, () => {
    console.log('file edited!')
    res.redirect('/')})
})

app.delete('/sighting/:index/delete', (req, res) => {
  edit(jsonFilepath, (err, data) => {
    data.sightings.splice(req.params.index, 1)
  }, () => {
    console.log('Sighting Deleted.')
    res.redirect('/')})
})

app.get('/shapes', (req, res) => {
  read(jsonFilepath, (err, data) => {
    if (err){
      console.log("Error:", err)
    }
    res.render('shapes', data)
  })
})

app.get('/shapes/:shape', (req, res) => {
  const shapeRequested = req.params.shape
  read(jsonFilepath, (err, data) => {
    if (err){
      console.log("Error:", err)
    }

    const filteredSightingDataArr = data.sightings.filter(sightingObj => 
      sightingObj.shape == shapeRequested
    )
    // console.log(filteredSightingDataArr)
    res.render('shapes-selected', { filteredSightingDataArr })
  })
})

// app.get('/redirect', (req, res) => {
//   res.render('redirect')
//   setTimeout(() => {
//     res.redirect('/')
//   }, 2000);
// })

app.use((req, res) => {
	res.status(404).render('404', { title: '404'});
});

app.listen(3000, () => console.log('Server Started'))

