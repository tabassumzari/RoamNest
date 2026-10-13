<div align="center">

# RoamNest

**A premium stays marketplace: discover, filter, save and price luxury stays.**

Node.js · Express · MongoDB · EJS · Passport · Cloudinary · Mapbox

</div>

---

RoamNest is a full-stack, server-rendered Airbnb-style web app built with a classic **MVC** architecture. It lets guests browse curated stays, filter them by category, save favourites to a wishlist and see a live price breakdown, while hosts can list and manage their own properties.

> This is a portfolio project. Reservations are a demo: the Reserve button calculates the total but takes no payment and stores no booking.

## Features

- **Category filter bar:** icon-based categories (Beachfront, Cabins, Mansions, Amazing Pools, Mountains, Ski Chalets, Castles, Treehouses, Iconic Cities). Filters are sent as query parameters, so every view is shareable, e.g. `/listings?category=cabins&sort=price_asc&maxPrice=5000`
- **Search, price range and sorting:** keyword search across title, location, country and description (input is regex-escaped), min/max price, and four sort orders
- **Dynamic pricing breakdown:** pick check-in and check-out dates and see `nightly price × nights + service fee = total` update instantly
- **Wishlist:** heart icon on every card and listing page, saved per user in MongoDB, toggled without a page reload (with a no-JavaScript fallback) and a dedicated `/wishlist` page
- **Host tools:** create, edit and delete listings with image upload (Cloudinary) and automatic geocoding (Mapbox)
- **Reviews and ratings:** star ratings, average score on cards, author-only deletion
- **Authentication:** sign up, log in, log out with Passport; sessions stored in MongoDB
- **Maps:** interactive Mapbox map on every listing, with a clear message if it cannot load
- **Luxury UI:** custom design system in Dark Charcoal, Warm Ivory, Emerald and Gold; responsive down to mobile
- **Safe by default:** Joi validation, escaped template output, ownership checks on every write route, ObjectId errors handled as 404

## Tech stack

| Layer | Tools |
| --- | --- |
| Server | Node.js, Express 4 |
| Database | MongoDB, Mongoose |
| Views | EJS with ejs-mate layouts, Bootstrap 5 (forms and utilities), custom CSS |
| Auth | Passport, passport-local, passport-local-mongoose, express-session, connect-mongo |
| Uploads and maps | Multer, Cloudinary, Mapbox GL JS and Mapbox geocoding |
| Validation | Joi |

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org) 18 or newer
- A MongoDB database: a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster, or MongoDB running locally
- Optional: a free [Mapbox](https://account.mapbox.com) token (maps) and a free [Cloudinary](https://cloudinary.com) account (photo uploads)

### Install and run

```bash
# 1. Clone and enter the project
git clone https://github.com/<your-username>/RoamNest.git
cd RoamNest

# 2. Install dependencies
npm install

# 3. Create your environment file, then edit it (see the table below)
cp .env.example .env          # Windows (cmd): copy .env.example .env

# 4. Load 29 demo stays into the database
npm run seed

# 5. Start the development server
npm run dev
```

Open **http://localhost:8080**.

### Environment variables

Create a `.env` file in the project root:

| Variable | Required | Purpose |
| --- | --- | --- |
| `ATLASDB_URL` | Yes | MongoDB connection string (Atlas or `mongodb://127.0.0.1:27017/roamnest`) |
| `SECRET` | Yes | Long random string used to sign and encrypt sessions |
| `MAP_TOKEN` | For maps | Mapbox **public** token (starts with `pk.`). Also used to geocode new listings |
| `CLOUD_NAME`, `CLOUD_API_KEY`, `CLOUD_API_SECRET` | For uploads | Cloudinary credentials, needed to upload listing photos |
| `PORT` | No | Defaults to `8080` |

After editing `.env`, stop the server (`Ctrl + C`) and start it again. The dev server does not watch that file.

### Demo account

`npm run seed` creates a host account you can log in with:

| Username | Password |
| --- | --- |
| `roamnest_host` | `RoamNest@123` |

The seed only replaces listings owned by this demo host, so listings you create yourself are never touched.

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start with nodemon (auto-restarts on code changes) |
| `npm start` | Start with plain Node (use in production) |
| `npm run seed` | Load demo listings, reviews and the demo host |

## Project structure

```
RoamNest/
├── app.js                 # Entry point: middleware, sessions, passport, routes, error handler
├── cloudConfig.js         # Cloudinary + multer storage
├── middleware.js          # isLoggedIn, isOwner, isReviewAuthor, Joi validators
├── schema.js              # Joi schemas
├── controllers/           # listings, reviews, users, wishlist
├── models/                # Listing (with category), Review, User (with wishlist)
├── routes/                # listing, review, user
├── views/
│   ├── layouts/           # boilerplate.ejs
│   ├── includes/          # navbar, footer, flash, listing-card
│   ├── listings/          # index, show, new, edit
│   ├── users/             # login, signup, wishlist
│   └── pages/             # privacy / terms
├── public/
│   ├── css/style.css      # Design system
│   ├── js/                # script.js, pricing.js, map.js
│   └── img/
├── utils/                 # categories, helpers, ExpressError, wrapAsync
└── init/                  # Seed script and sample data
```

## Routes

| Method | Path | Description | Auth |
| --- | --- | --- | --- |
| GET | `/listings` | Browse; query: `category`, `q`, `sort`, `minPrice`, `maxPrice` | |
| GET | `/listings/new` | New listing form | Yes |
| POST | `/listings` | Create a listing | Yes |
| GET | `/listings/:id` | Listing details, map, pricing, reviews | |
| GET | `/listings/:id/edit` | Edit form | Owner |
| PUT | `/listings/:id` | Update a listing | Owner |
| DELETE | `/listings/:id` | Delete a listing | Owner |
| POST | `/listings/:id/wishlist` | Toggle saved state (returns JSON for fetch calls) | Yes |
| POST | `/listings/:id/reviews` | Post a review | Yes |
| DELETE | `/listings/:id/reviews/:reviewId` | Delete a review | Author |
| GET | `/wishlist` | Your saved listings | Yes |
| GET/POST | `/signup`, `/login` | Create account / log in | |
| GET | `/logout` | Log out | |

## Troubleshooting

- **Only the homepage shows, links do nothing:** the app must be started with `npm run dev`. Opening the files directly in a browser, or with Live Server, will not work because the pages are rendered by the Node server.
- **"No stays match your search":** the database is empty or your filters are too narrow. Run `npm run seed` and click **All stays**.
- **Map says unavailable:** the message explains why. Usually `MAP_TOKEN` is missing or wrong in `.env`, or `api.mapbox.com` is blocked by an ad blocker, VPN or network.
- **`ERESOLVE` error on install:** the included `.npmrc` already handles this; if it still appears, run `npm install --legacy-peer-deps`.
- **Cannot connect to the database:** check `ATLASDB_URL`, and in Atlas allow your IP address under **Network Access**.

## Deployment

Set the same environment variables on your host (Render, Railway, etc.), set `NODE_ENV=production`, use `npm start` as the start command, and allow the host's IP in MongoDB Atlas.

## Roadmap ideas

- Real booking flow with availability and payments
- Photo galleries with multiple images per listing
- Host dashboard and booking management
- Automated tests

## License

ISC
