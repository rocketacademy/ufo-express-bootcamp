import express from "express";
import {add, read, write} from "../jsonFileStorage.js";
import methodOverride from "method-override";

export const router = express.Router();

// Configure Express to parse request body data into request.body
router.use(express.urlencoded({ extended: false }));
// Override POST requests with query param ?_method=PUT/DELETE to be PUT/DELETE requests
router.use(methodOverride("_method"));

router.get("/", (req, res) => {
  read("data.json", (err, data) => {  
  res.render("viewList",data);
  });
});

router.get("/sighting/:index/edit", (req,res) => {
  read('data.json', (err, jsonData) => {
    const { index } = req.params;
    const sight = jsonData.sightings[index];
    // Pass the recipe index to the edit form for the PUT request URL.
    sight.index = index;
    const ejsData = { sight };
    //console.log(ejsData);
    res.render('editSighting', ejsData);
  });
})

router.put("/sighting/:index", (req,res) => {
   const { index } = req.params;
   read('data.json', (err, data) => {
     // Replace the data in the object at the given index
     data['sightings'][index] = req.body;
     write('data.json', data, (err) => {
       res.redirect(`/sighting/${index}`)
     });
   });
});

router.delete('/sighting/:index',(req,res) => {
  // Remove element from DB at given index
  const { index } = req.params;
  read('data.json', (err, data) => {
    data['sightings'].splice(index, 1);
    write('data.json', data, (err) => {
      res.render('viewList',data);
    });
  });
});

router.get("/sighting", (req, res) => {
  res.render("postSighting");
});

router.post("/sighting", (req, res) => {
  add('data.json', 'sightings', req.body, (err,jsonContentStr) => {
    if (err) {
      res.status(500).send('DB write error.');
      return;
    }
    console.log(req.body);
    const jsonContentObj = JSON.parse(jsonContentStr);
    
    // Acknowledge data saved.
    //res.send('Your data has been saved successfully!');
    let index = jsonContentObj.sightings.length;
    res.redirect(`/sighting/${index-1}`)
  })
})

router.get("/sighting/:index", (req, res) => {
  read("data.json", (err, data) => {
    const { index } = req.params;
    const sight = data.sightings[index];
    
    //console.log(sight)
    if (!sight) {
      res.status(404).send("Sorry, we cannot find that!");
      return;
    }
    sight.index = index;
   res.render("viewSighting", sight)
  });
})

router.get("/shapes", (req,res) => {
  read("data.json", (err, data) => { 
  
  let shapeArray = data.sightings.map(x => x.shape);
  //console.log(shapeArray);

  let uniqueShapeArray = [...new Set(shapeArray)];
  //console.log(uniqueShapeArray);
  
  let newData = {};
  newData["shapes"] = uniqueShapeArray;

  res.render("viewListOfShapes",newData);
  });
});

router.get("/shapes/:shape", (req,res) => {
  read("data.json", (err, data) => { 
    // Obtain data to inject into EJS template
    let sightingData = data.sightings;
 
   // assign an index to the sighting data that represents their ORIGINAL position
    sightingData = sightingData.map((sighting, index) => ({
      ...sighting,
      index,
    }));

  let sightingsFound = sightingData.filter((sight) => {
      return req.params.shape.toLowerCase() === sight.shape.toLowerCase();
    });
    if (sightingsFound.length === 0) {
      res.status(404).send("Sorry, we cannot find that!");
      // stop further execution in this callback
      return;
    }
  //console.log(sightingsFound);
  
  let newData = {};
  newData["sightings"] = sightingsFound;
  //console.log(newData);

  res.render("viewListByShapes",newData);
  });
});
