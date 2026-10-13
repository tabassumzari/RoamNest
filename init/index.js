// Seeds the database with demo stays.   Run with:  npm run seed
//
// - Creates (or reuses) a demo host account:  roamnest_host / RoamNest@123
// - Replaces ONLY the listings owned by that demo host, so your own listings are safe.
// - Coordinates are hard-coded, so seeding does not need a Mapbox token.
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");
const Review = require("../models/review.js");
const User = require("../models/user.js");

const DB_URL = process.env.ATLASDB_URL;

const HOST = { username: "roamnest_host", email: "host@roamnest.dev", password: "RoamNest@123" };

// One entry per item in data.js, in the same order: [category, longitude, latitude]
const META = [
  ["beachfront", -118.7798, 34.0259], // 0  Malibu
  ["iconic-cities", -74.006, 40.7128], // 1  New York
  ["mountains", -106.8175, 39.1911], // 2  Aspen
  ["mansions", 11.2558, 43.7696], // 3  Florence
  ["treehouses", -122.6765, 45.5231], // 4  Portland
  ["beachfront", -86.8515, 21.1619], // 5  Cancun
  ["cabins", -120.0324, 39.0968], // 6  Lake Tahoe
  ["mansions", -118.2437, 34.0522], // 7  Los Angeles
  ["ski", 7.2286, 46.0963], // 8  Verbier
  ["trending", 34.8333, -2.3333], // 9  Serengeti
  ["mansions", 4.9041, 52.3676], // 10 Amsterdam
  ["trending", 178.065, -17.7134], // 11 Fiji
  ["cabins", -1.7, 51.83], // 12 Cotswolds
  ["mansions", -71.0589, 42.3601], // 13 Boston
  ["beachfront", 115.1889, -8.4095], // 14 Bali
  ["cabins", -115.5708, 51.1784], // 15 Banff
  ["iconic-cities", -80.1918, 25.7617], // 16 Miami
  ["pools", 98.3923, 7.8804], // 17 Phuket
  ["castles", -4.5, 57.3], // 18 Scottish Highlands
  ["pools", 55.2708, 25.2048], // 19 Dubai
  ["cabins", -110.3626, 46.8797], // 20 Montana
  ["beachfront", 25.3289, 37.4467], // 21 Mykonos
  ["treehouses", -83.7534, 9.7489], // 22 Costa Rica
  ["iconic-cities", -79.9311, 32.7765], // 23 Charleston
  ["iconic-cities", 139.6917, 35.6895], // 24 Tokyo
  ["cabins", -71.5724, 43.1939], // 25 New Hampshire
  ["pools", 73.2207, 3.2028], // 26 Maldives
  ["ski", -106.8, 39.2], // 27 Aspen chalet
  ["beachfront", -85.1, 10.0], // 28 Costa Rica beach house
];

const SAMPLE_REVIEWS = [
  [5, "Absolutely stunning. The photos don't do it justice and the host thought of everything."],
  [5, "Waking up here was the highlight of our trip. We are already planning to return."],
  [4, "Beautiful, spotless and quiet. Check-in was effortless and the location is perfect."],
  [5, "Worth every rupee. Felt like a private retreat from the moment we arrived."],
  [4, "Lovely place with a great atmosphere. Would happily book again."],
];

async function seed() {
  if (!DB_URL) {
    console.error("ATLASDB_URL is missing. Create your .env file first (see .env.example).");
    process.exit(1);
  }
  if (initData.data.length !== META.length) {
    throw new Error(`data.js has ${initData.data.length} items but META has ${META.length}.`);
  }

  await mongoose.connect(DB_URL);
  console.log("Connected to DB");

  // 1. Demo host
  let host = await User.findOne({ username: HOST.username });
  if (!host) {
    host = await User.register(new User({ username: HOST.username, email: HOST.email }), HOST.password);
    console.log(`Created demo host account: ${HOST.username} / ${HOST.password}`);
  }

  // 2. Remove the demo host's previous listings (and their reviews)
  const old = await Listing.find({ owner: host._id }).select("reviews");
  await Review.deleteMany({ _id: { $in: old.flatMap((l) => l.reviews) } });
  await Listing.deleteMany({ owner: host._id });

  // 3. Insert fresh listings with category + geometry, plus a few reviews
  let created = 0;
  for (let i = 0; i < initData.data.length; i++) {
    const item = initData.data[i];
    const [category, lng, lat] = META[i];

    const reviewIds = [];
    if (i % 3 !== 2) {
      const count = 1 + (i % 3);
      for (let r = 0; r < count; r++) {
        const [rating, comment] = SAMPLE_REVIEWS[(i + r) % SAMPLE_REVIEWS.length];
        const review = await Review.create({ rating, comment, author: host._id });
        reviewIds.push(review._id);
      }
    }

    await Listing.create({
      ...item,
      category,
      owner: host._id,
      reviews: reviewIds,
      geometry: { type: "Point", coordinates: [lng, lat] },
    });
    created++;
  }

  console.log(`Seeded ${created} listings.`);
  await mongoose.disconnect();
}

seed().catch(async (err) => {
  console.error("Seeding failed:", err);
  await mongoose.disconnect();
  process.exit(1);
});
