import e from "express";
import { readFile, writeFile } from "fs";

const dataPath = "data.json";

const readPath = dataPath;
const writePath = dataPath;

/**
 *
 * @param {e.Express} app
 */
const attachRoutes = (app) => {
  const routeNewSightingForm = "/sighting-form";
  const routeSightingConsumerNew = "/sighting-add";

  const routeEditSightingSuffix = `/sighting-form-edit`;
  const routeEditSightingForm = `${routeEditSightingSuffix}/:index`;
  const routeSightingConsumerEdit = "/sighting-edit";

  const renderViewSightingOne = (req, res) => {
    const { params } = req;
    const { index, isNew } = params;
    readFile(readPath, (err, content) => {
      if (err) {
        throw err;
      }
      const json = JSON.parse(content);
      res.render("sighting", {
        isNew,
        index,
        sighting: json.sightings[index],
        editRoute: `${routeEditSightingSuffix}/${index}`,
      });
      return;
    });
  };

  const renderEditSightingOne = (req, res) => {
    const { params } = req;
    const { index } = params;

    readFile(readPath, (err, content) => {
      if (err) {
        throw err;
      }
      const json = JSON.parse(content);
      return res.render("sighting-edit", {
        index,
        sighting: json.sightings[index],
        postRoute: routeSightingConsumerEdit,
      });
    });
  };
  // input form - new
  app.get(routeNewSightingForm, (req, res) => {
    return res.render("sighting-form", { postRoute: routeSightingConsumerNew });
  });
  // input form - edit
  app.get(routeEditSightingForm, renderEditSightingOne);

  app.post(
    routeSightingConsumerNew,
    (req, res, next) => {
      console.log(`Route POST ${routeSightingConsumerNew}`);

      const { body } = req;
      const { text, date_time, city, state, duration, summary } = body;
      const sighting = { text, date_time, city, state, duration, summary };

      readFile(readPath, (err, content) => {
        if (err) {
          throw err;
        }
        const json = JSON.parse(content);
        const newJson = { ...json, sightings: [...json.sightings, sighting] };
        const newContent = JSON.stringify(newJson);
        writeFile(writePath, newContent, (err) => {
          if (err) {
            throw err;
          }
          req.params.index = newJson.sightings.length - 1;
          req.params.isNew = true;
          next();
        });
      });
    },
    renderViewSightingOne
  );

  app.post(routeSightingConsumerEdit, (req, res, next) => {
    console.log(`Route POST ${routeSightingConsumerEdit}`);

    const { body } = req;
    const {
      text: newText,
      date_time: newDate_time,
      city: newCity,
      state: newState,
      duration: newDuration,
      summary: newSummary,
      index: targetIndex,
    } = body;

    console.log("body");
    console.log(body);

    readFile(readPath, (err, content) => {
      if (err) {
        throw err;
      }
      const json = JSON.parse(content);
      const { sightings } = json;
      const targetSighting = sightings[targetIndex];
      const { text, date_time, city, state, duration, summary } =
        targetSighting;
      const editedSighting = {
        ...targetSighting,
        text: newText ? newText : text,
        date_time: newDate_time ? newDate_time : date_time,
        city: newCity ? newCity : city,
        state: newState ? newState : state,
        duration: newDuration ? newDuration : duration,
        summary: newSummary ? newSummary : summary,
      };
      const newSightings = [...sightings];
      newSightings[targetIndex] = editedSighting;
      const newJson = { ...json, sightings: newSightings };
      const newContent = JSON.stringify(newJson);
      writeFile(writePath, newContent, (err) => {
        if (err) {
          throw err;
        }
        req.params.index = targetIndex;
        return renderViewSightingOne(req, res);
      });
    });
  });

  app.get("/", (req, res) => {
    console.log("Route GET /");
    res.sendStatus(501);
  });

  app.get("/sighting/:index/edit", (req, res) => {
    console.log("Route GET /");
    res.sendStatus(501);
  });

  app.put("/sighting/:index/edit", (req, res) => {
    console.log("Route PUT /");
    res.sendStatus(501);
  });
  app.delete("/sighting/:index/edit", (req, res) => {
    console.log("Route DELETE /");
    res.sendStatus(501);
  });

  app.get("/shapes", (req, res) => {
    console.log("Route GET /");
    res.sendStatus(501);
  });

  app.get("/shapes/:shape", (req, res) => {
    console.log("Route GET /");
    res.sendStatus(501);
  });
};

export default attachRoutes;
