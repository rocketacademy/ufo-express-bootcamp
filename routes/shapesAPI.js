import { read } from "../utils/jsonFileStorage.js";
import { FILENAME } from "../app.js";
import { handleFileError } from "../utils/error.js";
import _ from "lodash";

export const getSightingShapes = (req, resp) => {
  read(FILENAME, (err, data) => {
    if (err) {
      handleFileError(resp, err, "read");
    }

    const shapes = data.sightings.map((s) => s.shape);
    const ushapes = _.uniq(shapes);
    let shapesObj = {};
    shapes.forEach((s) => {
      if (!(s in shapesObj)) {
        shapesObj[s] = 1;
      } else {
        shapesObj[s] += 1;
      }
    });

    const renderObj = { shapes: ushapes, shapeCount: shapesObj };

    resp.render("shapes", renderObj);
  });
};

export const getSightingByShape = (req, resp) => {
  const shapeRequest = req.params.shape;

  read(FILENAME, (err, data) => {
    if (err) {
      handleFileError(resp, err, "read");
    }

    const shapes = data.sightings.map((s) => s.shape.toLowerCase());

    if (shapes.includes(shapeRequest)) {
      // shapeSightings is an array of obj with keys sighting and index (original index)
      let shapeSightings = [];
      data.sightings.forEach((s, idx) => {
        if (s.shape.toLowerCase() === shapeRequest) {
          const ssObj = { sighting: s, originalIndex: idx };
          shapeSightings.push(ssObj);
        }
      });

      const renderObj = {
        shape: _.capitalize(shapeRequest),
        sightings: shapeSightings,
      };

      resp.render("shapeSightings", renderObj);
    } else {
      const errorObj = {
        error: `invalid shape, shape ${shapeRequest} not found`,
      };
      resp.status(404).send(errorObj);
    }
  });
};
