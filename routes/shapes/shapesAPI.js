import { read } from "../../utils/jsonFileStorage.js";
import { databaseLog } from "../../utils/logger.js";
import { FILENAME } from "../../app.js";

export const getSightingShapes = (req, resp) => {
  read(FILENAME, (err, data) => {
    if (err) {
      const errorObj = { error: `read err - ${err}` };
      databaseLog(`read err - ${err}`);
      resp.status(500).send(errorObj);
    }

    const shapes = data.sightings.map((s) => s.shape);
    const renderObj = { shapes: shapes };

    resp.status(200).send(renderObj);
    // resp.render("shapes", renderObj);
  });
};

export const getSightingByShape = (req, resp) => {
  const shapeRequest = req.params.shape;

  read(FILENAME, (err, data) => {
    if (err) {
      const errorObj = { error: `read err - ${err}` };
      databaseLog(`read err - ${err}`);
      resp.status(500).send(errorObj);
    }

    const shapes = data.sightings.map((s) => s.shape.toLowerCase());

    if (shapes.includes(shapeRequest)) {
      // shapeSightings is an array of obj with keys sighting and index (original index)
      let shapeSightings = [];
      data.sightings.forEach((s, idx) => {
        if (s.shape.toLowerCase() === shapeRequest) {
          const ssObj = { sighting: s, index: idx };
          shapeSightings.push(ssObj);
        }
      });

      const renderObj = { sightings: shapeSightings };

      resp.status(200).send(renderObj);
      // resp.render("shapeSightings", renderObj)
    } else {
      const errorObj = {
        error: `invalid shape, shape ${shapeRequest} not found`,
      };
      resp.status(404).send(errorObj);
    }
  });
};
