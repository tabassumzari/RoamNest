// True when the client expects JSON (fetch / XHR calls) rather than an HTML page.
module.exports.wantsJson = (req) =>
  req.xhr || (req.get("accept") || "").includes("application/json");

// Escape user input before putting it inside a RegExp.
module.exports.escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Query-string values can be arrays/objects (e.g. ?q[$ne]=x). Only accept plain strings.
module.exports.str = (value) => (typeof value === "string" ? value.trim() : "");

// Attach average rating + review count to a lean listing whose reviews are populated.
module.exports.withRating = (listing) => {
  const reviews = (listing.reviews || []).filter((r) => r && typeof r.rating === "number");
  const reviewCount = reviews.length;
  const avgRating = reviewCount
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
    : 0;
  return { ...listing, reviewCount, avgRating };
};
