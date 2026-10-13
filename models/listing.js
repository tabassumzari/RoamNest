const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./review.js");
const { CATEGORY_KEYS } = require("../utils/categories");

const ListingSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: { type: String },
    image: {
      url: String,
      filename: String,
    },
    price: { type: Number, min: 0 },
    location: { type: String },
    country: { type: String },
    category: {
      type: String,
      enum: CATEGORY_KEYS,
      index: true,
    },
    reviews: [
      {
        type: Schema.Types.ObjectId,
        ref: "Review",
      },
    ],
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    geometry: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
  },
  { timestamps: true }
);

// When a listing is deleted, delete its reviews too.
ListingSchema.post("findOneAndDelete", async (listing) => {
  if (listing) {
    await Review.deleteMany({ _id: { $in: listing.reviews } });
  }
});

module.exports = mongoose.model("Listing", ListingSchema);
