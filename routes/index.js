import e from "express";

/**
 *
 * @param {e.Express} app
 */
const attachRoutes = (app) => {
  app.get("/sighting", (req, res) => {
    console.log("Route GET /sighting");
    res.sendStatus(501);
  });

  app.post("/sighting", (req, res) => {
    console.log("Route POST /sighting");
    res.sendStatus(501);
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
