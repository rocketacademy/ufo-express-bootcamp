import express from "express";
import methodOverride from "method-override";
import cookieParser from "cookie-parser";
import {
  getAllSightings,
  getSightingByIndex,
  getSightingForm,
  getNewSightingForm,
  postNewSightingForm,
  editSightingForm,
  deleteSighting,
} from "./routes/sightingsAPI.js";

import { getSightingShapes, getSightingByShape } from "./routes/shapesAPI.js";

import { loggerMiddleWare } from "./utils/logger.js";

import { getFavorite } from "./routes/cookies.js";

export const FILENAME = "./data.json";
export const COOKIES = "./cookies.json";

const app = express();
const router = express.Router();

// routers
router.get("/", getAllSightings);
router.get("/sighting/:index", getSightingByIndex);
router.get("/shapes", getSightingShapes);
router.get("/shapes/:shape", getSightingByShape);

router.get("/sighting", getNewSightingForm);
router.post("/sighting", postNewSightingForm);
router.get("/sighting/:index/edit", getSightingForm);
router.put("/sighting/:index/edit", editSightingForm);

router.delete("/sighting/:index/delete", deleteSighting);

router.get("/favorite", getFavorite);

// app middlewares
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(loggerMiddleWare);
app.use(express.urlencoded({ extended: false })); // get form data
app.use(methodOverride("_method"));
app.use(cookieParser());
app.use("/", router);

app.listen(3004);
