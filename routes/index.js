import e from "express";
import { addSighting } from "../dataOperations/index.js";
import { read, readFile, writeFile } from "fs";

const dataPath = "data.json";

const readPath = dataPath;
const writePath = dataPath;

/**
 *
 * @param {e.Express} app
 */
const attachRoutes = (app) => {
  const newSightingConsumerRoute = "/sighting";
  const routePathViewSightingOne = `${newSightingConsumerRoute}/:index`;

  const renderViewSightingOne = (req, res) => {
    const { params } = req;
    const { index, isNew } = params;
    readFile(readPath, (err, content) => {
      if (err) {
        throw err;
      }
      const json = JSON.parse(content);
      res.render("sighting", { isNew, index, sighting: json.sightings[index] });
      return;
    });
  };
  // input form
  app.get("/sighting-form", (req, res) => {
    console.log("Route GET /sighting");
    return res.render("sighting-form", { postRoute: newSightingConsumerRoute });
  });

  app.post(
    newSightingConsumerRoute,
    (req, res, next) => {
      console.log(`Route POST ${newSightingConsumerRoute}`);

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

  app.get(
    routePathViewSightingOne,
    (req, res) => {
      console.log(`GET ${newSightingConsumerRoute}/:index`);
    },
    renderViewSightingOne
  );

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
