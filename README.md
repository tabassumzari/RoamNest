# RoamNest

A premium stays marketplace (Airbnb-style) built with **Node.js, Express, MongoDB (Mongoose) and EJS**.

## Features

- Browse luxury stays with an **icon-based category filter bar** (Beachfront, Cabins, Mansions, Amazing Pools, ...), keyword search, price range and sorting. Filters are sent as query parameters, e.g. `/listings?category=cabins&sort=price_asc&maxPrice=5000`
- **Dynamic pricing breakdown** on each listing: nightly price x nights + service fee, recalculated as the guest picks dates
- **Wishlist**: heart icon on every card and on the listing page, saved per user, with a `/wishlist` page
- Listings with image upload (Cloudinary), geocoding and a map (Mapbox), reviews and ratings
- Authentication (Passport, sessions stored in MongoDB), flash messages, Joi validation
- Dark Charcoal / Warm Ivory / Emerald / Gold design system in `public/css/style.css`

## Quick start

```bash
npm install
cp .env.example .env        # Windows: copy .env.example .env   (then fill in the values)
npm run seed                # optional: loads 29 demo stays
npm run dev                 # http://localhost:8080
```

Demo host account created by the seed: `roamnest_host` / `RoamNest@123`

### Environment variables (`.env`)

| Variable | Purpose |
| --- | --- |
| `ATLASDB_URL` | MongoDB connection string (local or Atlas) |
| `SECRET` | Long random string for sessions |
| `MAP_TOKEN` | Mapbox public token (`pk...`). Without it the app still runs; maps are hidden and new listings get placeholder coordinates |
| `CLOUD_NAME`, `CLOUD_API_KEY`, `CLOUD_API_SECRET` | Cloudinary credentials, needed to upload listing photos |

## Project structure

```
app.js                 entry point (middleware, sessions, passport, routes, error handler)
controllers/           listings, reviews, users, wishlist
models/                Listing (with category), Review, User (with wishlist)
routes/                listing, review, user
views/                 layouts, includes (navbar, footer, listing-card), listings, users, pages
public/css/style.css   design system
public/js/             script.js (forms, wishlist, toggles), pricing.js, map.js
utils/categories.js    single list of categories used by the model, validation and UI
init/index.js          database seed
```

## Notes

- Reservations are a demo: the Reserve button shows the calculated total but does not take payment or store a booking.
- In production set `NODE_ENV=production` (enables secure cookies behind a proxy).
