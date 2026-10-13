// Listing location map. Data comes from window.RN (set in views/listings/show.ejs).
// If the map cannot load, the note under the map says exactly why.
(function () {
  "use strict";

  // The Mapbox library script is loaded at the bottom of the page, after this file runs,
  // so wait for the "load" event before touching mapboxgl.
  window.addEventListener("load", initMap);

  function initMap() {
    var mapEl = document.getElementById("map");
    var note = document.getElementById("mapNote");
    if (!mapEl) return;

    function unavailable(reason) {
      mapEl.hidden = true;
      if (note) {
        note.textContent = "Map unavailable: " + reason;
        note.hidden = false;
      }
      console.warn("[RoamNest map] " + reason);
    }

    var data = window.RN || {};
    var listing = data.listing;
    var coords = listing && listing.geometry && listing.geometry.coordinates;

    if (!data.mapToken) {
      unavailable(
        "the server sent no MAP_TOKEN. Check that .env contains MAP_TOKEN=pk... (no quotes or spaces), " +
          "then stop the server (Ctrl+C) and run npm run dev again."
      );
      return;
    }
    if (typeof mapboxgl === "undefined") {
      unavailable(
        "Mapbox's script did not load. An ad blocker, VPN or network block may be stopping api.mapbox.com."
      );
      return;
    }
    if (!coords || coords.length !== 2) {
      unavailable("this listing has no valid coordinates. Re-run npm run seed or re-save the listing location.");
      return;
    }

    try {
      if (mapboxgl.supported && !mapboxgl.supported()) {
        unavailable("this browser could not start WebGL. Turn on hardware acceleration in your browser settings.");
        return;
      }

      mapboxgl.accessToken = data.mapToken;
      var map = new mapboxgl.Map({
        container: "map",
        style: "mapbox://styles/mapbox/light-v11",
        center: coords, // [lng, lat]
        zoom: 9,
      });

      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

      // Mapbox reports a bad token / blocked request through this event, not by throwing.
      map.on("error", function (e) {
        var msg = (e && e.error && e.error.message) || "unknown error";
        var status = e && e.error && e.error.status;
        if (status === 401 || status === 403 || /unauthorized|forbidden|access token/i.test(msg)) {
          unavailable("Mapbox rejected the token. Use your Default public token (it starts with pk.), not a secret sk. token.");
        } else if (!map.loaded()) {
          unavailable(msg);
        }
      });

      var popup = new mapboxgl.Popup({ offset: 25 }).setText(
        listing.location + " – exact location is shared after booking."
      );

      new mapboxgl.Marker({ color: "#0f7b5f" }).setLngLat(coords).setPopup(popup).addTo(map);
    } catch (err) {
      unavailable(err && err.message ? err.message : "unexpected error (see the browser console).");
    }
  }
})();