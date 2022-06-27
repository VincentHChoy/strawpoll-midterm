// load .env data into process.env
require("dotenv").config();

// Web server config
const PORT = process.env.PORT || 8080;
const sassMiddleware = require("./lib/sass-middleware");
const express = require("express");
const app = express();
const morgan = require("morgan");

// PG database client/connection setup
// const { Pool } = require("pg");
// const dbParams = require("./lib/db.js");
// const db = new Pool(dbParams);
// db.connect();
const database = require("./lib/db");
const { db } = database;
// Load the logger first so all (static) HTTP requests are logged to STDOUT
// 'dev' = Concise output colored by response status for development use.
//         The :status token will be colored red for server error codes, yellow for client error codes, cyan for redirection codes, and uncolored for all other codes.
app.use(morgan("dev"));

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

app.use(
  "/styles",
  sassMiddleware({
    source: __dirname + "/styles",
    destination: __dirname + "/public/styles",
    isSass: false, // false => scss, true => sass
  })
);

app.use(express.static("public"));

// Separated Routes for each Resource

// User routes - create and mount
const pollRouter = express.Router();
const pollRoutes = require("./routes/pollRoutes");
pollRoutes(pollRouter, db);
app.use("/", pollRouter);

// Widget routes - create and mount
// const widgetRouter = express.Router();
// const widgetsRoutes = require("./routes/widgets");
// widgetsRoutes(widgetRouter, db);
// app.use("/api/widgets", widgetRouter);

// Note: mount other resources here, using the same pattern above

// Home page
// Warning: avoid creating more routes in this file!
// Separate them into separate routes files (see above).

// app.get("/", (req, res) => {
//   res.render("results");
// });

// database.createPoll("email", "adminID", "shareID", "questionText", "2/2/22")
//   .then((poll) => {
//     console.log("In Create Poll!!!!!!");
//   })
//   .catch((e) => res.send(e));

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});
