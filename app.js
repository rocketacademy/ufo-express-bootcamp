import express from "express";
import {
  getAllSightings,
  getSightingByIndex,
} from "./routes/sightings/sightingsAPI.js";

import {
  getSightingShapes,
  getSightingByShape,
} from "./routes/shapes/shapesAPI.js";

import { loggerMiddleWare } from "./utils/logger.js";

export const FILENAME = "./data.json";

const app = express();
const router = express.Router();

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: false }));
app.use(loggerMiddleWare);
app.use("/", router);

// routers
router.get("/", getAllSightings);
router.get("/sighting/:index", getSightingByIndex);
router.get("/shapes", getSightingShapes);
router.get("/shapes/:shape", getSightingByShape);

app.listen(3004);
