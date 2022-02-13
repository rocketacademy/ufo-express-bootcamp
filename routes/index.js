import e from "express";
import {addSighting} from "../dataOperations/index.js";
/**
 *
 * @param {e.Express} app
 */
const attachRoutes = (app) => {
  const newSightingConsumerRoute = "/sighting";
  // input form
  app.get("/sighting", (req, res) => {
    console.log("Route GET /sighting");
    return res.render("sighting-form", { postRoute: newSightingConsumerRoute });
  });

  app.post(newSightingConsumerRoute, (req, res) => {
    console.log("Route POST /sighting");

    const { body } = req;
    const {text,
date_time,
city,
state,
duration,
summary} = body;

const sighting = {text,
date_time,
city,
state,
duration,
summary}

    addSighting(sighting);

    res.json(body);
  });

  app.get("/sighting:index", (req, res) => {
    console.log("Route POST /sighting");
    res.sendStatus(501);
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
