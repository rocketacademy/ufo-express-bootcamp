import { add, read, write } from "../utils/jsonFileStorage.js";
import { FILENAME } from "../app.js";
import sortBy from "lodash/sortBy.js";
import { handleFileError } from "../utils/error.js";
import { generateRandomID, getDateTimeNow } from "../utils/common.js";

export const getAllSightings = (req, resp) => {
  // sort params
  const sorting = req.query.sort;

  read(FILENAME, (err, data) => {
    if (err) {
      handleFileError(err, "read");
    }

    let sightings = data.sightings;

    switch (sorting != undefined) {
      case sorting == "city" || sorting === "shape":
        sightings = sortBy(data.sightings, [sorting]);
        break;
      case sorting == "created_at" || sorting === "witnessed_at":
        sightings = sortBy(
          data.sightings,
          (dateObj) => new Date(dateObj["datetime"])
        );
        break;
      default:
        break;
    }

    const renderObj = { sightings: sightings };
    resp.render("sightings", renderObj);
  });
};

export const getSightingByIndex = (req, resp) => {
  const sid = req.params.index;
  read(FILENAME, (err, data) => {
    if (err) {
      handleFileError(err, "read");
    }

    if (sid && sid < data.sightings.length) {
      const renderObj = {
        sighting: data.sightings[sid],
        index: sid,
      };
      resp.render("singleSighting", renderObj);
    } else {
      const errorObj = {
        error: `invalid index, index ${sid} not found`,
      };
      resp.status(404).send(errorObj);
    }
  });
};

// ========================================================
// FORMS RELATED
// ========================================================

export const postNewSightingForm = (req, resp) => {
  const payload = req.body;
  // go through payload to validate (capitalization, type checks) and add other fields
  payload["id"] = generateRandomID();
  payload["duration"] = parseInt(payload["duration"]);
  payload["created_at"] = getDateTimeNow();
  payload["updated_at"] = getDateTimeNow();

  add(FILENAME, "sightings", payload, (err, data) => {
    if (err) {
      handleFileError(err, "read");
    }
  });

  // TODO redirect to newly created sighting/:id?
  resp.redirect("/");
};

export const getNewSightingForm = (req, resp) => {
  const renderObj = { action: "Add", sighting: null, sightingId: null };
  resp.render("sightingForm", renderObj);
};

export const getSightingForm = (req, resp) => {
  const sid = req.params.index;

  read(FILENAME, (err, data) => {
    if (err) {
      handleFileError(err, "read");
    }

    if (sid && sid < data.sightings.length) {
      const renderObj = {
        action: "Edit",
        sighting: data.sightings[sid],
        index: sid,
      };

      resp.render("sightingForm", renderObj);
    } else {
      const errorObj = {
        error: `invalid index, sighting index ${sid} not found`,
      };
      resp.status(404).send(errorObj);
    }
  });
};

export const editSightingForm = (req, resp) => {
  const sid = req.params.index;
  const payload = req.body;
  payload["duration"] = parseInt(payload["duration"]);
  payload["updated_at"] = getDateTimeNow();

  read(FILENAME, (err, data) => {
    if (err) {
      handleFileError(err, "read");
    }

    // overwrite sighting at existing index
    const ca = data.sightings[sid].created_at;
    payload["created_at"] = ca;
    data.sightings[sid] = payload;

    write(FILENAME, data, (err) => {
      if (err) {
        handleFileError(err, "write");
      }

      resp.redirect("/");
    });
  });
};

export const deleteSighting = (req, resp) => {
  const sid = req.params.index;

  read(FILENAME, (err, data) => {
    if (err) {
      handleFileError(err, "read");
    }

    // remove sighting at index
    data.sightings.splice(sid, 1);

    write(FILENAME, data, (err) => {
      if (err) {
        handleFileError(err, "write");
      }

      resp.redirect("/");
    });
  });
};
