import express from "express";
import { router } from "./routes/index.js";
import methodOverride from "method-override";

let app = express();

// Set the view engine to ejs
app.set("view engine", "ejs");

app.use("/", router);

// Configure Express to parse request body data into request.body
app.use(express.urlencoded({ extended: false }));
// Override POST requests with query param ?_method=PUT/DELETE to be PUT/DELETE requests
app.use(methodOverride("_method"));
// serve static files
app.use(express.static("public"));

app.listen(3004);
