// Shared front-end behaviour for RoamNest.
(function () {
  "use strict";

  /* ---------- 1. Bootstrap form validation ---------- */
  Array.from(document.querySelectorAll(".needs-validation")).forEach(function (form) {
    form.addEventListener(
      "submit",
      function (event) {
        if (!form.checkValidity()) {
          event.preventDefault();
          event.stopPropagation();
        }
        form.classList.add("was-validated");
      },
      false
    );
  });

  /* ---------- 2. "Show total with GST" switch on the listings grid ---------- */
  var taxToggle = document.getElementById("taxToggle");
  var grid = document.getElementById("listingGrid");
  if (taxToggle && grid) {
    taxToggle.addEventListener("change", function () {
      grid.classList.toggle("show-tax", taxToggle.checked);
    });
  }

  /* ---------- 3. Image upload preview ---------- */
  Array.from(document.querySelectorAll("input[type=file][data-preview]")).forEach(function (input) {
    var preview = document.querySelector(input.dataset.preview);
    if (!preview) return;
    input.addEventListener("change", function () {
      var file = input.files && input.files[0];
      if (!file) {
        preview.hidden = true;
        return;
      }
      preview.src = URL.createObjectURL(file);
      preview.hidden = false;
    });
  });

  /* ---------- 4. Keep the active category visible in the scrolling filter bar ---------- */
  var activeCat = document.querySelector(".rn-cat.active");
  if (activeCat && activeCat.scrollIntoView) {
    var bar = activeCat.closest(".rn-cats");
    if (bar) bar.scrollLeft = Math.max(0, activeCat.offsetLeft - bar.clientWidth / 2 + activeCat.clientWidth / 2);
  }

  /* ---------- 5. Wishlist heart (works with and without JavaScript) ---------- */
  function toast(text) {
    var t = document.createElement("div");
    t.className = "rn-toast";
    t.setAttribute("role", "status");
    t.textContent = text;
    document.body.appendChild(t);
    requestAnimationFrame(function () {
      t.classList.add("show");
    });
    setTimeout(function () {
      t.classList.remove("show");
      setTimeout(function () {
        t.remove();
      }, 300);
    }, 2200);
  }

  function setSaved(form, saved) {
    var btn = form.querySelector("button");
    var icon = form.querySelector("i");
    var label = form.querySelector(".rn-save-label");
    btn.classList.toggle("is-saved", saved);
    btn.setAttribute("aria-pressed", String(saved));
    if (icon) {
      icon.classList.toggle("fa-solid", saved);
      icon.classList.toggle("fa-regular", !saved);
    }
    if (label) label.textContent = saved ? "Saved" : "Save";
    if (btn.classList.contains("rn-heart")) {
      btn.setAttribute("aria-label", saved ? "Remove from wishlist" : "Save to wishlist");
    }
  }

  function setCount(count) {
    var badge = document.getElementById("wishlistCount");
    if (!badge) return;
    badge.textContent = count;
    badge.hidden = count < 1;
  }

  document.addEventListener("submit", function (event) {
    var form = event.target;
    if (!form || !form.hasAttribute || !form.hasAttribute("data-wishlist-form")) return;
    event.preventDefault();

    var btn = form.querySelector("button");
    btn.disabled = true;

    fetch(form.action, {
      method: "POST",
      credentials: "same-origin",
      headers: { "X-Requested-With": "XMLHttpRequest", Accept: "application/json" },
    })
      .then(function (res) {
        if (res.status === 401) {
          window.location.href = "/login";
          return null;
        }
        if (!res.ok) throw new Error("Request failed");
        return res.json();
      })
      .then(function (data) {
        if (!data) return;
        setSaved(form, data.saved);
        setCount(data.count);
        toast(data.saved ? "Saved to your wishlist" : "Removed from your wishlist");

        // On the wishlist page, unsaving removes the card.
        var card = form.closest(".rn-card");
        var removable = form.closest("[data-removable]");
        if (!data.saved && card && removable) {
          card.classList.add("rn-card-out");
          setTimeout(function () {
            card.remove();
            if (!removable.querySelector(".rn-card")) window.location.reload();
          }, 300);
        }
      })
      .catch(function () {
        form.submit(); // fall back to a normal form post
      })
      .then(function () {
        btn.disabled = false;
      });
  });
})();
