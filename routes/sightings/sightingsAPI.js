import { read } from "../../utils/jsonFileStorage.js";
import { databaseLog } from "../../utils/logger.js";
import { FILENAME } from "../../app.js";

export const getAllSightings = (req, resp) => {
  read(FILENAME, (err, data) => {
    if (err) {
      const errorObj = { error: `read err - ${err}` };
      databaseLog(`read err - ${err}`);
      resp.status(500).send(errorObj);
    }

    const renderObj = { sightings: data.sightings };
    resp.status(200).send(renderObj);
    // resp.render("allSightings", renderObj);
  });
};

export const getSightingByIndex = (req, resp) => {
  const sightingIndex = req.params.index;
  read(FILENAME, (err, data) => {
    if (err) {
      const errorObj = { error: `read err - ${err}` };
      databaseLog(`read err - ${err}`);
      resp.status(500).send(errorObj);
    }

    if (sightingIndex >= 0 && sightingIndex < data.sightings.length) {
      const renderObj = { sighting: data.sightings[sightingIndex] };
      resp.status(200).send(renderObj);
      // resp.render("singleSighting", renderObj);
    } else {
      const errorObj = {
        error: `invalid index, index ${sightingIndex} not found`,
      };
      resp.status(404).send(errorObj);
    }
  });
};
