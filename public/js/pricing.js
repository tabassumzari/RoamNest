// Dynamic pricing breakdown for the listing page.
// Total = (nightly price x nights) + service fee.
(function () {
  "use strict";

  var root = document.getElementById("booking");
  if (!root) return;

  var nightly = Number(root.dataset.nightly) || 0;
  var feeRate = Number(root.dataset.feeRate);
  if (!isFinite(feeRate) || feeRate < 0) feeRate = 0.1;
  var loggedIn = root.dataset.loggedIn === "true";
  var MAX_NIGHTS = 90;

  var checkIn = document.getElementById("checkIn");
  var checkOut = document.getElementById("checkOut");
  var guests = document.getElementById("guests");
  var hint = document.getElementById("bookHint");
  var table = document.getElementById("breakdown");
  var reserveBtn = document.getElementById("reserveBtn");
  var msg = document.getElementById("reserveMsg");

  var el = {
    label: document.getElementById("bdLabel"),
    subtotal: document.getElementById("bdSubtotal"),
    feeLabel: document.getElementById("bdFeeLabel"),
    fee: document.getElementById("bdFee"),
    total: document.getElementById("bdTotal"),
  };

  var DAY = 24 * 60 * 60 * 1000;

  function money(n) {
    return "₹" + Math.round(n).toLocaleString("en-IN");
  }

  // "2026-10-20" -> UTC midnight in ms (UTC avoids daylight-saving off-by-one errors)
  function toUTC(value) {
    var parts = value.split("-").map(Number);
    return Date.UTC(parts[0], parts[1] - 1, parts[2]);
  }

  function toISO(ms) {
    return new Date(ms).toISOString().slice(0, 10);
  }

  function todayISO() {
    var now = new Date();
    var local = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    return toISO(local);
  }

  function showHint(text) {
    hint.textContent = text;
    hint.hidden = false;
  }

  function reset(text) {
    table.hidden = true;
    reserveBtn.disabled = true;
    msg.hidden = true;
    showHint(text);
  }

  function update() {
    msg.hidden = true;

    if (checkIn.value) {
      // Check-out must be at least one night after check-in.
      checkOut.min = toISO(toUTC(checkIn.value) + DAY);
      if (checkOut.value && toUTC(checkOut.value) <= toUTC(checkIn.value)) {
        checkOut.value = "";
      }
    }

    if (!checkIn.value || !checkOut.value) {
      reset("Choose your dates to see the full price.");
      return;
    }

    var nights = Math.round((toUTC(checkOut.value) - toUTC(checkIn.value)) / DAY);
    if (nights < 1) {
      reset("Check-out must be after check-in.");
      return;
    }
    if (nights > MAX_NIGHTS) {
      reset("Stays are limited to " + MAX_NIGHTS + " nights.");
      return;
    }

    var subtotal = nightly * nights;
    var fee = subtotal * feeRate;
    var total = subtotal + fee;

    el.label.textContent = money(nightly) + " × " + nights + (nights === 1 ? " night" : " nights");
    el.subtotal.textContent = money(subtotal);
    el.feeLabel.textContent = "Service fee (" + Math.round(feeRate * 100) + "%)";
    el.fee.textContent = money(fee);
    el.total.textContent = money(total);

    hint.hidden = true;
    table.hidden = false;
    reserveBtn.disabled = false;
    reserveBtn.dataset.total = String(total);
    reserveBtn.dataset.nights = String(nights);
  }

  // Can't book in the past.
  var today = todayISO();
  checkIn.min = today;
  checkOut.min = toISO(toUTC(today) + DAY);

  checkIn.addEventListener("change", update);
  checkOut.addEventListener("change", update);

  reserveBtn.addEventListener("click", function () {
    if (!loggedIn) {
      window.location.href = "/login";
      return;
    }
    var nights = reserveBtn.dataset.nights;
    var total = Number(reserveBtn.dataset.total);
    var g = guests.value;
    msg.textContent =
      "Request noted: " + nights + (nights === "1" ? " night" : " nights") + ", " + g +
      (g === "1" ? " guest" : " guests") + ", total " + money(total) +
      ". RoamNest is a portfolio demo, so no payment is taken and no booking is made.";
    msg.hidden = false;
  });

  update();
})();
