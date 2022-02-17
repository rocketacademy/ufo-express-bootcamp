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

  const routeToViewOne = `/sighting-one`;
  const routeToViewAll = `/sighting-all`;

  const routeToAddFav = `/sighting-fav-add`;
  const routeToAllFavs = `/sighting-fav-all`;

  const routeToShapeListing = `/sighting-shape-listing`;

  const renderViewSightingOne = (req, res) => {
    const { params } = req;
    const { index, isNew } = params;
    readFile(readPath, (err, content) => {
      if (err) {
        res.sendStatus(500);
        throw err;
      }
      const json = JSON.parse(content);
      res.render("sighting", {
        isNew,
        index,
        sighting: json.sightings[index],
        editRoute: `${routeEditSightingSuffix}/${index}`,
        routeToAddFav,
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
  // Home
  app.get("/", (req, res) => {
    console.log("Route GET /");
    res.render("home", {
      routeToViewAll,
      routeNewSightingForm,
      routeToAllFavs,
      routeToShapeListing,
    });
  });

  app.get(routeToAllFavs, (req, res) => {
    res.sendStatus(501);
  });
  app.get(routeToShapeListing, (req, res) => {
    res.sendStatus(501);
  });

  // Sighting: One
  app.get(
    `${routeToViewOne}/:index`,
    (req, res, next) => {
      console.log("Route GET / routeToViewOne");
      next();
    },
    renderViewSightingOne
  );

  app.get(routeToViewAll, (req, res) => {
    console.log("Route GET /" + routeToViewAll);

    readFile(readPath, (err, content) => {
      if (err) {
        throw err;
      }
      const json = JSON.parse(content);
      return res.render("all", {
        sightings: json.sightings,
        routeToViewOne,
      });
    });
  });

  app.post(
    routeToAddFav,
    (req, res, next) => {
      const { params, query, body } = req;
      console.log("routeToAddFav");
      console.log(params);
      console.log(query);
      console.log(body);

      const { index } = body;
      console.log("req.cookies");
      console.log(req.cookies);
      const currentFavString = !!req.cookies.favourites || "";
      const currentFav =
        currentFavString == "" ? [] : JSON.parse(currentFavString);

      const newFav = [...currentFav, Number(index)];

      console.log("newFav");
      console.log(newFav);
      res.cookie("favorites", JSON.stringify(newFav));
      req.params.index = index;
      next();
    },
    renderViewSightingOne
  );

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
