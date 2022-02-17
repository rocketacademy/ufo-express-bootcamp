import express from "express";

import attachRoute from "./routes/index.js";
import cookieParser from "cookie-parser";
const app = express();

app.use(express.urlencoded({ extended: false }));
app.use(express.static("public"));
app.use(cookieParser());

attachRoute(app);

app.set("view engine", "ejs");

app.listen(3004, () => {
  console.log("listening");
});
