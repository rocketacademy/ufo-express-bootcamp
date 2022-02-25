# Rocket Academy Coding Bootcamp: UFO Express
# Objective
Create an app which performs basic CRUD with endpoints and forms- it must be able to 
- Read all UFO Sightings
- Read a single UFO sighting given its index
- Create a new UFO sighting
- Update an existing UFO sighting given its index
- Delete an existing UFO sighting given its index
<br />

# How to run
0. Clone repo and install dependences, run `npm i` assuming you have node and npm installed
1. Run app.js and navigate to `localhost:3004/`
```
node app.js
```
<br />

# Folder Structure
Notes: 
main file => `app.js`
main json file => `data.json`
/routes directory => contains endpoints handlers
/utils directory => contains common functions such as dates, logger and file error handling 
/views directiory => contains views used in ejs
/public/css => css styling
```
├── README.md
├── app.js
├── cookies.json
├── data.json
├── node_modules
├── package-lock.json
├── package.json
├── public
│   └── css
│       └── styles.css
├── routes
│   ├── cookies.js
│   ├── shapesAPI.js
│   └── sightingsAPI.js
├── utils
│   ├── date.js
│   ├── error.js
│   ├── jsonFileStorage.js
│   └── logger.js
└── views
    ├── footer.ejs
    ├── header.ejs
    ├── navbar.ejs
    ├── shapeSightings.ejs
    ├── shapes.ejs
    ├── sightingForm.ejs
    ├── sightings.ejs
    └── singleSighting.ejs
```

# Tasks Breakdown (Deliverables)
## Base 
### Part 1 -Set up routes without forms
- [x] Get all sightings (/)
- [x] Get sighting by index (/sighting/:index)
- [x] Get all shapes (/shapes)
- [x] Get sighting by shape (/shapes/:shape)
- [x] Views for these routes
 <br />

### Part 2 - Set up routes requiring forms
- [x] GET /sighting form
- [x] POST /sighting form
- [x] GET /sighting/:index/edit
- [x] PUT /sighting/:index/edit
- [x] POST /sighting/:index/delete
- [x] Views for these routes
 <br />
Notes:
- Achieve forms and visuals with minimal css and html (to be beautified in part 3)
Possible Fonts to use:  
- Orbitron
- Jura Light
<br />

### Part 3
1. Beautify forms and layout with Bootstrap
- [ ] Responsive design (work on mobile view first)?
<br />

## Comfortable
- [x] Add created_at field to data.json when an new sighting is created, render this in sighting
- [x] Add nav bar
- [ ] Data validation for fields

<br />

## More comfortable
Unfortunately did not have time to try this section out :( 

# Packages used
- express
- lodash
- bootstrap
- method-override