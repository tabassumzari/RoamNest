const mongoose = require("mongoose");
const Listing = require("../models/listing");
const User = require("../models/user");
const ExpressError = require("../utils/ExpressError");
const { wantsJson, withRating } = require("../utils/helpers");

// POST /listings/:id/wishlist  -> adds the listing if missing, removes it if already saved.
module.exports.toggle = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id) || !(await Listing.exists({ _id: id }))) {
    throw new ExpressError(404, "Listing not found");
  }

  const user = await User.findById(req.user._id).select("wishlist");
  const wasSaved = user.wishlist.some((savedId) => savedId.equals(id));

  await User.updateOne(
    { _id: user._id },
    wasSaved ? { $pull: { wishlist: id } } : { $addToSet: { wishlist: id } }
  );

  const saved = !wasSaved;
  const count = user.wishlist.length + (saved ? 1 : -1);

  if (wantsJson(req)) {
    return res.json({ saved, count });
  }

  req.flash("success", saved ? "Saved to your wishlist." : "Removed from your wishlist.");
  const referer = req.get("Referer");
  const sameSite = referer && referer.startsWith(`${req.protocol}://${req.get("host")}`);
  res.redirect(sameSite ? referer : "/listings");
};

// GET /wishlist
module.exports.show = async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate({ path: "wishlist", populate: { path: "reviews", select: "rating" } })
    .lean();
  const listings = (user.wishlist || []).filter(Boolean).map(withRating);
  res.render("users/wishlist.ejs", { listings, pageTitle: "Your wishlist" });
};
