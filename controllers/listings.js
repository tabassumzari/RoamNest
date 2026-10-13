const Listing = require("../models/listing");
const User = require("../models/user");
const ExpressError = require("../utils/ExpressError");
const { CATEGORY_KEYS } = require("../utils/categories");
const { escapeRegex, str, withRating } = require("../utils/helpers");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");

// Created lazily so the app still boots (and shows a clear message) without MAP_TOKEN.
let geocodingClient = null;
async function geocode(location) {
  if (!process.env.MAP_TOKEN) return { skipped: true };
  if (!geocodingClient) {
    geocodingClient = mbxGeocoding({ accessToken: process.env.MAP_TOKEN });
  }
  const response = await geocodingClient.forwardGeocode({ query: location, limit: 1 }).send();
  const feature = response.body.features[0];
  return feature ? { geometry: feature.geometry } : { geometry: null };
}

// Used only when MAP_TOKEN is not configured (local development without Mapbox).
const FALLBACK_GEOMETRY = { type: "Point", coordinates: [0, 0] };

const SORTS = {
  newest: { createdAt: -1 },
  price_asc: { price: 1 },
  price_desc: { price: -1 },
};

/* ------------------------------ INDEX ------------------------------ */
// GET /listings?category=beachfront&q=goa&sort=price_asc&minPrice=1000&maxPrice=5000
module.exports.index = async (req, res) => {
  const category = str(req.query.category);
  const query = str(req.query.q).slice(0, 60);
  const sort = SORTS[str(req.query.sort)] ? str(req.query.sort) : "recommended";
  const minPrice = str(req.query.minPrice);
  const maxPrice = str(req.query.maxPrice);

  const filter = {};

  if (CATEGORY_KEYS.includes(category)) {
    filter.category = category;
  }

  if (query) {
    const rx = new RegExp(escapeRegex(query), "i");
    filter.$or = [{ title: rx }, { location: rx }, { country: rx }, { description: rx }];
  }

  const priceFilter = {};
  if (minPrice !== "" && Number.isFinite(Number(minPrice))) priceFilter.$gte = Number(minPrice);
  if (maxPrice !== "" && Number.isFinite(Number(maxPrice))) priceFilter.$lte = Number(maxPrice);
  if (Object.keys(priceFilter).length) filter.price = priceFilter;

  const docs = await Listing.find(filter)
    .sort(SORTS[sort] || { createdAt: -1 })
    .populate("reviews", "rating")
    .lean();

  res.render("listings/index.ejs", {
    allListings: docs.map(withRating),
    activeCategory: CATEGORY_KEYS.includes(category) ? category : "",
    query,
    sort,
    minPrice,
    maxPrice,
    pageTitle: "Explore stays",
  });
};

/* ------------------------------ NEW ------------------------------ */
module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs", { pageTitle: "List your property" });
};

/* ------------------------------ SHOW ------------------------------ */
module.exports.showListing = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id)
    .populate({ path: "reviews", populate: { path: "author" } })
    .populate("owner");
  if (!listing) {
    req.flash("error", "Listing you requested does not exist");
    return res.redirect("/listings");
  }
  const ratings = listing.reviews.filter((r) => typeof r.rating === "number");
  const avgRating = ratings.length
    ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
    : 0;

  res.render("listings/show.ejs", {
    listing,
    avgRating,
    reviewCount: ratings.length,
    pageTitle: listing.title,
  });
};

/* ------------------------------ CREATE ------------------------------ */
module.exports.createListing = async (req, res) => {
  if (!req.file) {
    req.flash("error", "Please upload an image for your listing.");
    return res.redirect("/listings/new");
  }

  const result = await geocode(req.body.listing.location);
  if (!result.skipped && !result.geometry) {
    req.flash("error", "We couldn't find that location on the map. Try a more specific place name.");
    return res.redirect("/listings/new");
  }

  const newListing = new Listing(req.body.listing);
  newListing.owner = req.user._id;
  newListing.image = { url: req.file.path, filename: req.file.filename };
  newListing.geometry = result.skipped ? FALLBACK_GEOMETRY : result.geometry;
  await newListing.save();

  req.flash(
    "success",
    result.skipped
      ? "Listing created! (Set MAP_TOKEN in .env to place it correctly on the map.)"
      : "New listing created!"
  );
  res.redirect(`/listings/${newListing._id}`);
};

/* ------------------------------ EDIT ------------------------------ */
module.exports.renderEditForm = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing you requested does not exist");
    return res.redirect("/listings");
  }
  let originalImageUrl = (listing.image && listing.image.url) || "";
  originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_300");
  res.render("listings/edit.ejs", { listing, originalImageUrl, pageTitle: "Edit listing" });
};

/* ------------------------------ UPDATE ------------------------------ */
module.exports.updateListing = async (req, res) => {
  const { id } = req.params;
  const existing = await Listing.findById(id);
  if (!existing) throw new ExpressError(404, "Listing not found");

  const data = { ...req.body.listing };

  // Re-geocode only when the location text actually changed.
  if (data.location && data.location !== existing.location) {
    const result = await geocode(data.location);
    if (!result.skipped) {
      if (!result.geometry) {
        req.flash("error", "We couldn't find that location on the map. Try a more specific place name.");
        return res.redirect(`/listings/${id}/edit`);
      }
      data.geometry = result.geometry;
    }
  }

  const listing = await Listing.findByIdAndUpdate(id, data, { new: true, runValidators: true });

  if (typeof req.file !== "undefined") {
    listing.image = { url: req.file.path, filename: req.file.filename };
    await listing.save();
  }

  req.flash("success", "Listing updated!");
  res.redirect(`/listings/${id}`);
};

/* ------------------------------ DELETE ------------------------------ */
module.exports.destroyListing = async (req, res) => {
  const { id } = req.params;
  await Listing.findByIdAndDelete(id);
  // Remove the deleted listing from everybody's wishlist.
  await User.updateMany({ wishlist: id }, { $pull: { wishlist: id } });
  req.flash("success", "Listing deleted!");
  res.redirect("/listings");
};
