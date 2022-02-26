import express from "express";
import {check, validationResult} from 'express-validator';
import {read, write} from "../jsonFileStorage.js";
import methodOverride from "method-override";
import dayjs from "dayjs";
import relativeTime from 'dayjs/plugin/relativeTime.js';
import LocalizedFormat from 'dayjs/plugin/localizedFormat.js';

export const router = express.Router();

// Configure Express to parse request body data into request.body
router.use(express.urlencoded({ extended: false }));
// Override POST requests with query param ?_method=PUT/DELETE to be PUT/DELETE requests
router.use(methodOverride("_method"));

const validationMessages = [
    check('city')
        .not().isEmpty()
        .withMessage('This field is required'),
    check('state')
        .not().isEmpty()
        .withMessage('This field is required'),
    check('date')
        .not().isEmpty()
        .withMessage('This field is required')
        .matches(/^(0[1-9]|1[0-2])\/(0[1-9]|1\d|2\d|3[01])\/(19|20)\d{2}$/)
        .withMessage('Please type in MM/DD/YYYY format')
        .isBefore(new Date().toDateString())
        .withMessage('Date cannot be in the future'),
    check('time')
        .not().isEmpty()
        .withMessage('This field is required')
        .matches( /((1[0-2]|0?[1-9]):([0-5][0-9]) ?([AaPp][Mm]))/)
        .withMessage('Please type in HH:MM (AM/PM) format'),
    check('shape')
        .not().isEmpty()
        .withMessage('This field is required'),
    check('text')
        .not().isEmpty()
        .withMessage('This field is required'),
    check('summary')
        .not().isEmpty()
        .withMessage('This field is required'),
]

router.get("/", (req, res) => {
  let visits = 0;
  // check if it's not the first time a request has been made
  if (req.cookies.visits) {
    visits = Number(req.cookies.visits); // get the value from the request
  }
  // set a new value of the cookie
  visits += 1;
  res.cookie('visits', visits);
  //console.log(req.cookies.visits);
  //res.clearCookie('visits');
  
  read("data.json", (err, data) => {  
  //add visit counter
  data["visit_counter"] = visits;
  for (let j = 0; j < data.sightings.length; j++) { 
    data.sightings[j]['index'] = j;
  }

  let sightings = JSON.parse(JSON.stringify(data.sightings));
  
  for (let i = 0; i < sightings.length; i++) {
    //dayjs to format date
    dayjs.extend(LocalizedFormat)
    let formattedDate = dayjs(sightings[i]["date"]).format('dddd, LL');
    sightings[i]["date"] = formattedDate;

  }
  
  //sorting logic
  let sortBy = 'Default';
  // only run the below logic if is a query param
    if (Object.keys(req.query).length > 0) {
      // reassign the sortBy value using the query param
      sortBy = req.query.sortBy;
      //console.log(sortBy)
      // sort them in a descending order
      sightings = sightings.sort((a, b) => b[sortBy].toLowerCase() > a[sortBy].toLowerCase() ? 1 : -1);
      //console.log(sightings);
    }
  
  let ejsData = {sightings};
  ejsData["visit_counter"] = visits;
  //console.log(ejsData);
  write('data.json', data, (err) => {
      res.render("viewList",ejsData);
    });
  });
  
});


router.get("/sighting/:index/edit", (req,res) => { 
  read('data.json', (err, jsonData) => {
    const { index } = req.params;
    const sight = jsonData.sightings[index];
    // Pass the sight index to the edit form for the PUT request URL.
    sight.index = index;
    sight.errormsg = [{
      value: '',
      msg: '',
      param: '',
      location: ''
    }]
    const ejsData = { sight };
    //console.log(ejsData);
    //console.log(sight);
    
    res.render('editSighting', ejsData);
  });
})

router.put("/sighting/:index/edit", validationMessages, (req,res) => {
  const errors = validationResult(req);
   read('data.json', (err, data) => {
    const { index } = req.params;
    let sight = data.sightings[index];
      if (!errors.isEmpty()) {
      sight = req.body
      // Pass the sight index to the edit form for the PUT request URL.
      sight.index = index;
      sight.errormsg = errors.errors;
      let ejsData = { sight };
      //console.log(sight);
      res.render("editSighting", ejsData);
    } else {
     // Replace the data in the object at the given index
     data['sightings'][index] = req.body;
     write('data.json', data, (err) => {
       res.redirect(`/sighting/${index}`)
     });}
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
  let newData = {};
  newData['city'] = null;
  newData['state'] = null;
  newData['shape'] = null;
  newData['date'] = null;
  newData['time'] = null;
  newData['text'] = null;
  newData['summary'] = null;
  newData['errormsg'] = [{
      value: '',
      msg: '',
      param: '',
      location: ''
    }];
  //console.log(newData);
  res.render("postSighting",newData);
});



router.post("/sighting", validationMessages ,(req, res) => {
  const errors = validationResult(req)
  read('data.json', (err, data) => {
    let index = data.sightings.length;
    let newData = req.body;
    newData['created_on'] = Date();
    newData['errormsg'] = errors.errors; 
    //console.log(newData);
    if (!errors.isEmpty()) {
      console.log(newData);
      res.render("postSighting", newData);
    } else {
      // Post the data in the object at the new index
      data['sightings'].push(newData);
      write('data.json', data, (err) => {
       res.redirect(`/sighting/${index}`)
     });}
   });
})

router.get("/sighting/:index", (req, res) => {
  
  read("data.json", (err, data) => {
    const { index } = req.params;
    //console.log(req.cookies[index]); // yes or no or undefined

    let isFav = req.cookies[index];
    if (isFav == undefined) {
      isFav = "no";
    }
    const sight = data.sightings[index];

    if (!sight) {
      res.status(404).send("Sorry, we cannot find that!");
      return;
    }
    //dayjs to format created date
    dayjs.extend(LocalizedFormat)
    let createdDateTime = dayjs(sight['created_on']).format('L LT')
    //dayjs to get created history
    dayjs.extend(relativeTime);
    let createdAgo = dayjs(sight['created_on']).from(Date()); //a year ago

    sight.index = index;
    sight["created_ago"] = createdAgo;
    sight["created_datetime"] = createdDateTime;
    sight["isFav"] = isFav;
    //console.log(sight)
   res.render("viewSighting", sight)
  });
})


router.get("/favourites/:index", (req,res) => {
  //get the index where cookie is going to be set
  let favIndex = req.params.index; //eg. 3

  // check the current req.cookies.favIndex is empty or no, then set cookie as yes
  if (!req.cookies[favIndex] || req.cookies[favIndex] == "no") {
      res.cookie(favIndex, 'yes'); //eg {'3':yes}
  }

  //vice versa
  if (req.cookies[favIndex] == "yes" ) {
      res.cookie(favIndex, 'no'); //eg {'3':no}
  }
  //send response so cookie will be set
  res.redirect(`/sighting/${favIndex}`);
  //console.log (req.cookies);
});

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
