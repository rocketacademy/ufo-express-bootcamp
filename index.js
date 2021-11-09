import express from 'express';
import methodOverride from 'method-override';
import {
  handleNewDataFormDisplayReq, handleAddNewSightingReq, handleSingleSightingDisplayReg,
  handleAllSightingsDisplayReq, handleEditDataFormDisplayReq, handleEditDataPutReq,
  handleSightingDeleteReq, handleDisplayListOfShapes, handleDisplaySightingsByShape,
} from './requestResponseHandler.js';

const PORT = 3004;

const app = express();
// Set the view engine to generate HTML responses through ejs files in view directory
app.set('view engine', 'ejs');
// To receive POST request data as an object
// This middleware function parses incoming requests with urlenconded payloads
app.use(express.urlencoded({ extended: false }));
// override with POST having ?_method=PUT
app.use(methodOverride('_method'));
// To serve the static files like css files, image files.
// This will load the files that are in the public directory
app.use(express.static('public'));

// Render a form that will create a new sighting
app.get('/sighting', handleNewDataFormDisplayReq);
// Accept a post request to create a new sighting
app.post('/sighting', handleAddNewSightingReq);
// Render a single sighting.
app.get('/sighting/:index', handleSingleSightingDisplayReg);
// Render a list of Sightings
app.get('/', handleAllSightingsDisplayReq);
// Render a form to edit a sighting.
app.get('/sighting/:index/edit', handleEditDataFormDisplayReq);
// Accept a request to edit a single sighting
app.put('/sighting/:index/edit', handleEditDataPutReq);
// Accept a request to delete a sighting.
app.delete('/sighting/:index/delete', handleSightingDeleteReq);
// Render a list of sightings that has one shape
app.get('/shapes/:shape', handleDisplaySightingsByShape);
// Render a list of sighting shapes
app.get('/shapes', handleDisplayListOfShapes);

// listening in the port
app.listen(PORT);
