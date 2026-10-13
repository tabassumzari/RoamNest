// Single source of truth for listing categories.
// Used by the Mongoose model, Joi validation, the filter bar and the listing forms.
const CATEGORIES = [
  { key: "trending", label: "Trending", icon: "fa-fire" },
  { key: "beachfront", label: "Beachfront", icon: "fa-umbrella-beach" },
  { key: "cabins", label: "Cabins", icon: "fa-house-chimney" },
  { key: "mansions", label: "Mansions", icon: "fa-landmark" },
  { key: "pools", label: "Amazing Pools", icon: "fa-person-swimming" },
  { key: "mountains", label: "Mountains", icon: "fa-mountain-sun" },
  { key: "ski", label: "Ski Chalets", icon: "fa-person-skiing" },
  { key: "castles", label: "Castles", icon: "fa-chess-rook" },
  { key: "treehouses", label: "Treehouses", icon: "fa-tree" },
  { key: "iconic-cities", label: "Iconic Cities", icon: "fa-city" },
];

const CATEGORY_KEYS = CATEGORIES.map((c) => c.key);

module.exports = { CATEGORIES, CATEGORY_KEYS };
