if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
  console.log("MY MAPBOX TOKEN IS:", process.env.MAP_TOKEN);
}

const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");

const ExpressError = require("./utils/ExpressError.js");
const { wantsJson } = require("./utils/helpers.js");
const { CATEGORIES } = require("./utils/categories.js");
const User = require("./models/user.js");
const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");

const app = express();
const dbUrl = process.env.ATLASDB_URL;
const PORT = process.env.PORT || 8080;
const isProd = process.env.NODE_ENV === "production";

if (!dbUrl || !process.env.SECRET) {
  console.error("Missing ATLASDB_URL or SECRET. Copy .env.example to .env and fill it in.");
  process.exit(1);
}

/* ---------------------------- Database ---------------------------- */
mongoose
  .connect(dbUrl)
  .then(() => console.log("Connected to DB"))
  .catch((err) => {
    console.error("DB connection failed:", err.message);
    process.exit(1);
  });

/* ------------------- View engine & static files ------------------- */
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

/* --------------------- Body parsing & overrides --------------------- */
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

/* ------------------------------ Session ------------------------------ */
// Needed when the app runs behind a proxy (Render, Railway, Heroku...) so secure cookies work.
if (isProd) app.set("trust proxy", 1);

const store = MongoStore.create({
  mongoUrl: dbUrl,
  crypto: { secret: process.env.SECRET },
  touchAfter: 24 * 3600,
});
store.on("error", (err) => console.log("ERROR in Mongo Session store", err));

app.use(
  session({
    store,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: "lax",
      secure: isProd,
    },
  })
);
app.use(flash());

/* ------------------------------ Passport ------------------------------ */
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

/* ------------------------ Security Headers ------------------------ */
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  res.setHeader("Access-Control-Allow-Origin", "*");
  next();
});

/* ------------------- Variables available in every view ------------------- */
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user;
  res.locals.categories = CATEGORIES;
  res.locals.mapToken = process.env.MAP_TOKEN;
  res.locals.wishlistIds = req.user && req.user.wishlist ? req.user.wishlist.map(String) : [];
  next();
});

/* ------------------------------- Routes ------------------------------- */
app.get("/", (req, res) => res.redirect("/listings"));

app.get("/privacy", (req, res) =>
  res.render("pages/info.ejs", {
    pageTitle: "Privacy",
    heading: "Privacy",
    text: "RoamNest is a portfolio project. It stores only the account details you enter (username, email and a salted password hash) and the listings and reviews you create. Nothing is sold or shared.",
  })
);
app.get("/terms", (req, res) =>
  res.render("pages/info.ejs", {
    pageTitle: "Terms",
    heading: "Terms",
    text: "RoamNest is a demonstration project, not a real booking service. Reservations are not processed and no payments are taken.",
  })
);

app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/", userRouter);

app.all("*", (req, res, next) => {
  next(new ExpressError(404, "Page not found!"));
});

/* --------------------------- Error handling --------------------------- */
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);

  let { statusCode = 500, message = "Something went wrong!" } = err;

  // Bad ObjectId in the URL, e.g. /listings/not-an-id
  if (err.name === "CastError") {
    statusCode = 404;
    message = "Page not found!";
  }
  if (statusCode >= 500) {
    console.error(err);
    if (isProd) message = "Something went wrong!";
  }

  if (wantsJson(req)) {
    return res.status(statusCode).json({ error: message });
  }
  res.status(statusCode).render("error.ejs", { message, statusCode, pageTitle: "Oops" });
});

app.listen(PORT, () => {
  console.log(`RoamNest running on http://localhost:${PORT}`);
});
