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
      res.send('The data has been deleted successfully!');
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
    res.send('Your data has been saved successfully!');
    //let index = jsonContentObj.sightings.length;
    //res.redirect(`/sightings/${index-1}`)
  })
})

router.get("/sighting/:index", (req, res) => {
  read("data.json", (err, data) => {
    const { index } = req.params;
    const sight = data.sightings[index];
    sight.index = index;
    //console.log(sight)
    if (!sight) {
      res.status(404).send("Sorry, we cannot find that!");
      return;
    }

   res.render("viewSighting", sight)
  });
})
