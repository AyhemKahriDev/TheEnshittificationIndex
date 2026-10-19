/* ============================================================
   WorseWatch — app core: scoring engine + router + pages
   ============================================================ */
(function () {
  "use strict";

  var SERVICES = window.WW_SERVICES;
  var META = window.WW_META;
  var C = window.WW_CHARTS;

  var state = { q: "", cat: "All", feedType: "all" };

  /* ---------------- utils ---------------- */

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function parseD(s) {
    var p = String(s).split("-");
    return new Date(+p[0], +p[1] - 1, 15);
  }
  function addMonths(d, n) {
    return new Date(d.getFullYear(), d.getMonth() + n, 15);
  }
  function monthsBetween(earlier, later) {
    return (later.getFullYear() - earlier.getFullYear()) * 12 + (later.getMonth() - earlier.getMonth());
  }
  function fmtMY(s) {
    var d = parseD(s);
    return d.toLocaleDateString("en", { month: "short" }) + " " + d.getFullYear();
  }
  function money(v) {
    return "$" + (Number.isInteger(v) ? String(v) : v.toFixed(2));
  }
  function pct(x) {
    return (x > 0 ? "+" : "") + x.toFixed(0) + "%";
  }
  function avg(a) {
    return a.reduce(function (s, x) { return s + x; }, 0) / a.length;
  }
  function sortedIds() {
    return Object.keys(SERVICES);
  }
  function allEvents() {
    var out = [];
    sortedIds().forEach(function (id) {
      (SERVICES[id].events || []).forEach(function (ev) {
        out.push(Object.assign({}, ev, { svc: id, svcName: SERVICES[id].name }));
      });
    });
    out.sort(function (a, b) { return a.d < b.d ? 1 : a.d > b.d ? -1 : 0; });
    return out;
  }

  /* ---------------- verdicts ---------------- */

  function verdictFor(n) {
    if (n < 10)  return { label: "Fine (for now)",        cls: "g" };
    if (n < 20)  return { label: "Drifting",              cls: "t" };
    if (n < 40)  return { label: "Getting worse",         cls: "a" };
    if (n < 60)  return { label: "Aggressively worse",    cls: "r" };
    return       { label: "Peak enshittification",        cls: "x" };
  }

  /* ============================================================
     THE SCORE — additive, explainable. Clamped to 0..100.
       price component  0..30   flagship-plan % change over 36 months × 0.8
       events component 0..50   worse/better events. points by impact
                                (1–5 → 2/6/10/16/22) × retention:
                                full for 24 months, linear fade to zero
                                at 72 months. better events subtract.
       sentiment        0..25   app-rating drift, last 15 vs prior 15 months
     Theoretical max is 105; the index clamps at 100. Negative
     event mass (improvements) can push the total below the floor
     of what any single component shows — clamped at 0 overall.
  ============================================================ */
  var EVENT_POINTS = { 1: 2, 2: 6, 3: 10, 4: 16, 5: 22 };

  function retention(ageMonths) {
    if (ageMonths <= 24) return 1;
    return Math.max(0, (72 - ageMonths) / 48);
  }

  function scoreFor(id, asOf) {
    var svc = SERVICES[id];

    /* -- price -- */
    var price = { part: 0, pct: null, base: null, now: null, plan: null };
    var plans = svc.plans || [];
    var flag = plans.filter(function (p) { return p.flagship; })[0] || plans[0];
    if (flag && flag.history) {
      var pts = flag.history.slice()
        .map(function (h) { return { d: h[0], v: h[1] }; })
        .filter(function (p) { return parseD(p.d) <= asOf; })
        .sort(function (a, b) { return a.d < b.d ? -1 : 1; });
      if (pts.length >= 2) {
        var cut = addMonths(asOf, -36);
        var basePt = null;
        pts.forEach(function (p) { if (parseD(p.d) <= cut) basePt = p; });
        if (!basePt) basePt = pts[0];
        var nowPt = pts[pts.length - 1];
        var pctDelta = (nowPt.v - basePt.v) / basePt.v * 100;
        price = {
          part: Math.min(30, Math.max(0, pctDelta * 0.8)),
          pct: pctDelta, base: basePt, now: nowPt, plan: flag.name
        };
      }
    }

    /* -- events (worse/better only; "price" type is measured directly) -- */
    var raw = 0, nWorse = 0, nBetter = 0, recent = 0;
    (svc.events || []).forEach(function (ev) {
      var d = parseD(ev.d);
      if (d > asOf) return;
      if (ev.t === "price") return;
      var age = monthsBetween(d, asOf);
      if (age > 72) return;
      if (age <= 12) recent++;
      var w = EVENT_POINTS[ev.impact] || 6;
      raw += (ev.t === "worse" ? 1 : -1) * w * retention(age);
      if (ev.t === "worse") nWorse++; else nBetter++;
    });
    var eventsPart = Math.min(50, raw);

    /* -- sentiment -- */
    var sentPart = 0, sentDelta = null;
    if (svc.ratings && svc.ratings.series) {
      var rp = svc.ratings.series.map(function (h) { return { d: h[0], v: h[1] }; });
      var cur = [], prev = [];
      rp.forEach(function (p) {
        var age = monthsBetween(parseD(p.d), asOf);
        if (age < 0 || age > 30) return;
        if (age <= 15) cur.push(p.v); else prev.push(p.v);
      });
      if (cur.length && prev.length) {
        sentDelta = avg(cur) - avg(prev);
        sentPart = Math.min(25, Math.max(0, -sentDelta * 18));
      }
    }

    var parts = {
      price: Math.round(price.part),
      events: Math.round(Math.max(0, eventsPart)),
      sentiment: Math.round(sentPart)
    };
    var total = Math.min(100, Math.max(0, parts.price + parts.events + parts.sentiment));
    return {
      total: total,
      parts: parts,
      price: price, sentDelta: sentDelta,
      nWorse: nWorse, nBetter: nBetter, recent: recent,
      verdict: verdictFor(total)
    };
  }

  function scoreHistory(id, months) {
    var now = new Date();
    var out = [];
    for (var i = months; i >= 0; i--) {
      var asOf = addMonths(now, -i);
      out.push({ x: asOf, y: scoreFor(id, asOf).total });
    }
    return out;
  }

  function delta12(id) {
    var now = new Date();
    return scoreFor(id, now).total - scoreFor(id, addMonths(now, -12)).total;
  }

  /* ---------------- shared bits ---------------- */

  function deltaChip(id) {
    var d = delta12(id);
    if (Math.abs(d) < 2) return '<span class="delta flat">— steady, 12mo</span>';
    if (d > 0) return '<span class="delta up">▲ ' + Math.round(d) + " in 12mo</span>";
    if (betterRecent(id)) return '<span class="delta down">▼ ' + Math.round(-d) + " recovered</span>";
    return '<span class="delta cool">◷ old damage fading</span>';
  }

  function betterRecent(id) {
    var now = new Date();
    var n = 0;
    (SERVICES[id].events || []).forEach(function (ev) {
      if (ev.t !== "better") return;
      var age = monthsBetween(parseD(ev.d), now);
      if (age >= 0 && age <= 12) n++;
    });
    return n > 0;
  }

  function impactDots(impact) {
    var s = "";
    for (var i = 1; i <= 5; i++) {
      s += '<span class="' + (i <= impact ? "on" : "") + '">' + (i <= impact ? "●" : "○") + "</span>";
    }
    return '<span class="impact">' + s + "</span>";
  }

  function eventItem(ev, svc) {
    var conf = ev.conf === "news"
      ? '<span class="chip b">reported</span>'
      : '<span class="chip a">unverified</span>';
    var receipts = '<a href="https://duckduckgo.com/?q=' +
      encodeURIComponent('"'.concat(ev.title, '" ', svc.name)) +
      '" target="_blank" rel="noopener">receipts ↗</a>';
    return '' +
      '<div class="tl-item">' +
      '<span class="tl-dot ' + ev.t + '"></span>' +
      '<div class="tl-date">' + fmtMY(ev.d) + "</div>" +
      '<div class="tl-title">' + esc(ev.title) + "</div>" +
      '<div class="tl-detail">' + esc(ev.detail) + "</div>" +
      '<div class="tl-meta">' + impactDots(ev.impact) + conf +
      '<span class="faint small">src: ' + esc(ev.src) + "</span>" + receipts + "</div>" +
      "</div>";
  }

  /* ---------------- router ---------------- */

  function route() {
    var h = location.hash.slice(1) || "/";
    var parts = h.split("/").filter(Boolean);
    var app = document.getElementById("app");
    window.scrollTo(0, 0);
    if (parts[0] === "s" && SERVICES[parts[1]]) { renderService(app, parts[1]); return; }
    if (parts[0] === "feed")   { markNav("feed");   document.title = "Feed — WorseWatch"; app.innerHTML = renderFeed(); bindFeed(); return; }
    if (parts[0] === "method") { markNav("method"); document.title = "Method — WorseWatch"; app.innerHTML = renderMethod(); return; }
    if (parts[0] === "submit") { markNav("submit"); document.title = "Submit evidence — WorseWatch"; app.innerHTML = renderSubmit(); bindSubmit(); return; }
    markNav("home"); document.title = "WorseWatch — the Enshittification Index";
    renderHome(app);
  }

  function markNav(id) {
    document.querySelectorAll(".nav-links a[data-nav]").forEach(function (a) {
      a.classList.toggle("active", a.getAttribute("data-nav") === id);
    });
  }

  /* ---------------- HOME ---------------- */

  function renderHome(app) {
    var ids = sortedIds();
    var nEvents = allEvents().length;
    var scores = ids.map(function (id) { return scoreFor(id, new Date()); });
    var avgScore = Math.round(avg(scores.map(function (s) { return s.total; })));
    var nWorseish = scores.filter(function (s) { return s.total >= 25; }).length;

    var cats = ["All"];
    ids.forEach(function (id) {
      var c = SERVICES[id].category;
      if (cats.indexOf(c) < 0) cats.push(c);
    });

    var latest = allEvents().slice(0, 7).map(function (ev) {
      return eventItem(ev, SERVICES[ev.svc]);
    }).join("");

    app.innerHTML = '' +
      '<header class="hero">' +
      "<h1>Are they making it worse?</h1>" +
      '<p class="lede">Evidence that your favorite product is getting worse — <b>with receipts</b>. ' +
      "Price creep, paywalls, feature cuts, and app-review drift, scored on one honest number: " +
      'the <b>Enshittification Index</b>. <a href="#/method">How it works.</a></p>' +
      '<div class="searchrow"><input id="q" type="search" placeholder="Search tracked services…" value="' + esc(state.q) + '"></div>' +
      '<div class="statrow">' +
      '<div class="stat"><div class="n">' + ids.length + '</div><div class="l">services tracked</div></div>' +
      '<div class="stat"><div class="n">' + nEvents + '</div><div class="l">logged events</div></div>' +
      '<div class="stat"><div class="n">' + avgScore + '</div><div class="l">mean index</div></div>' +
      '<div class="stat"><div class="n">' + nWorseish + '</div><div class="l">getting worse</div></div>' +
      "</div></header>" +

      '<div class="section-h"><h2>Recent on the wire</h2><a href="#/feed" class="small">full feed →</a></div>' +
      '<div class="timeline">' + latest + "</div>" +

      '<div class="section-h"><h2>The Index</h2></div>' +
      '<div class="catrow" id="catrow">' + cats.map(function (c) {
        return '<span class="chip click' + (state.cat === c ? " on" : "") + '" data-cat="' + esc(c) + '">' + esc(c) + "</span>";
      }).join("") + "</div>" +
      '<div class="cards" id="cards" style="margin-top:10px"></div>' +

      '<div class="section-h"><h2>Fine &amp; improving (rare)</h2></div>' +
      '<p class="small">Scored under 10 — held the line or genuinely got better. Mostly unpopulated. Sobering.</p>' +
      '<div class="cards" id="green-cards"></div>' +

      '<div class="section-h"><h2>Next to track</h2></div>' +
      '<ul class="wishlist">' + META.nextToTrack.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>" +
      '<p class="small dim" style="margin-top:16px">Missing something that got worse on you? <a href="#/submit">Submit evidence →</a></p>';

    paintCards();
    paintGreen();

    document.getElementById("q").addEventListener("input", function (e) {
      state.q = e.target.value.toLowerCase();
      paintCards();
    });
    document.getElementById("catrow").addEventListener("click", function (e) {
      var c = e.target.getAttribute("data-cat");
      if (!c) return;
      state.cat = c;
      document.querySelectorAll("#catrow .chip").forEach(function (el) {
        el.classList.toggle("on", el.getAttribute("data-cat") === c);
      });
      paintCards();
    });

    document.getElementById("footmeta").textContent =
      META.version + " · dataset updated " + META.updated;
  }

  function paintCards() {
    var host = document.getElementById("cards");
    if (!host) return;
    var now = new Date();
    var rows = sortedIds().map(function (id) {
      var s = SERVICES[id];
      return { id: id, svc: s, sc: scoreFor(id, now), hist: scoreHistory(id, 30) };
    }).filter(function (r) {
      if (state.cat !== "All" && r.svc.category !== state.cat) return false;
      if (state.q) {
        var hay = (r.svc.name + " " + r.svc.category + " " + (r.svc.short || "")).toLowerCase();
        if (hay.indexOf(state.q) < 0) return false;
      }
      return true;
    }).sort(function (a, b) { return b.sc.total - a.sc.total; });

    host.innerHTML = rows.map(function (r) {
      return '<a class="card" href="#/s/' + r.id + '">' +
        '<div class="card-top"><div>' +
        '<div class="card-name">' + esc(r.svc.name) + "</div>" +
        '<div class="card-cat">' + esc(r.svc.category) + "</div></div>" +
        '<div style="text-align:right"><span class="score-big ' + r.sc.verdict.cls + '">' + r.sc.total +
        "</span><br>" + deltaChip(r.id) + "</div></div>" +
        '<div class="verdict-sub ' + r.sc.verdict.cls + '" style="margin-top:6px">' + r.sc.verdict.label + "</div>" +
        '<div class="card-spark">' +
        window.WW_CHARTS.spark(r.hist, { w: 260, h: 44, color: colorFor(r.sc.total) }) +
        "</div>" +
        '<div class="card-meta"><span>' + esc(planNote(r.svc)) + "</span>" +
        "<span>creep " + r.sc.parts.price + " · cuts " + r.sc.parts.events + " · reviews " + r.sc.parts.sentiment + "</span></div>" +
        "</a>";
    }).join("") || '<div class="emptyblock">Nothing matches. Try clearing the search.</div>';
  }

  function paintGreen() {
    var host = document.getElementById("green-cards");
    if (!host) return;
    var now = new Date();
    var rows = sortedIds().map(function (id) {
      return { id: id, svc: SERVICES[id], sc: scoreFor(id, now) };
    }).filter(function (r) { return r.sc.total < 10; })
      .sort(function (a, b) { return a.sc.total - b.sc.total; });

    host.innerHTML = rows.map(function (r) {
      return '<a class="card" href="#/s/' + r.id + '">' +
        '<div class="card-top"><div>' +
        '<div class="card-name tag-kagi">' + esc(r.svc.name) + "</div>" +
        '<div class="card-cat">' + esc(r.svc.category) + " · " + esc(r.svc.short || "") + "</div></div>" +
        '<div style="text-align:right"><span class="score-big g">' + r.sc.total + "</span><br>" + deltaChip(r.id) + "</div></div>" +
        "</a>";
    }).join("") || '<div class="emptyblock">None currently scoring &lt; 10. Sobering indeed.</div>';
  }

  function colorFor(n) {
    var v = verdictFor(n);
    return { g: "#4cc38a", t: "#3ddbd9", a: "#f5a524", r: "#ff5d5d", x: "#e5484d" }[v.cls];
  }

  function planNote(svc) {
    var plans = svc.plans || [];
    var flag = plans.filter(function (p) { return p.flagship; })[0] || plans[0];
    if (!flag || !flag.history || !flag.history.length) return "";
    var last = flag.history[flag.history.length - 1];
    return flag.name + " now " + money(last[1]);
  }

  /* ---------------- SERVICE ---------------- */

  function renderService(app, id) {
    var svc = SERVICES[id];
    var now = new Date();
    var sc = scoreFor(id, now);
    markNav("");

    /* price chart */
    var series = (svc.plans || []).map(function (p) {
      return {
        name: p.name,
        pts: p.history.map(function (h) { return { x: parseD(h[0]), y: h[1] }; })
          .filter(function (pt) { return pt.x <= now; })
      };
    }).filter(function (s) { return s.pts.length >= 2; });
    var chart = C.lineChart(series, { w: 720, h: 240, yFmt: function (v) { return "$" + v; } });

    var legend = series.map(function (s) {
      var last = s.pts[s.pts.length - 1], first = s.pts[0];
      var d = ((last.y - first.y) / first.y * 100);
      var dirs = d > 0.4 ? "plandelta-up" : d < -0.4 ? "plandelta-down" : "";
      return '<span><span class="sw" style="background:' + s.color + '"></span>' +
        esc(s.name) + " · " + money(last.y) +
        ' <span class="' + dirs + ' mono small">' + (d > 0.4 ? "+" : d < -0.4 ? "" : "±") + Math.abs(d).toFixed(0) + "% lifetime</span></span>";
    }).join("");

    var planRows = (svc.plans || []).map(function (p) {
      var pts = p.history.slice().sort(function (a, b) { return a[0] < b[0] ? -1 : 1; });
      var dEl = "—";
      if (pts.length >= 2) {
        var pctD = (pts[pts.length - 1][1] - pts[0][1]) / pts[0][1] * 100;
        var cls = pctD > 0.4 ? "plandelta-up" : pctD < -0.4 ? "plandelta-down" : "";
        dEl = '<span class="' + cls + '">' + pct(pctD) + "</span>";
      }
      return "<tr><td>" + esc(p.name) + "</td><td>" +
        (pts.length ? money(pts[pts.length - 1][1]) : "—") + "</td><td>" + dEl + "</td></tr>";
    }).join("");

    /* ratings panel */
    var ratingsHTML = "";
    if (svc.ratings && svc.ratings.series) {
      var rp = svc.ratings.series.map(function (h) { return { x: parseD(h[0]), y: h[1] }; });
      var mid = Math.floor(rp.length / 2);
      var A = avg(rp.slice(0, mid).map(function (p) { return p.y; }));
      var B = avg(rp.slice(mid).map(function (p) { return p.y; }));
      var d = B - A;
      ratingsHTML = '<div class="panel"><h3 style="margin-top:0">App-store reviews</h3>' +
        '<div class="chartbox">' + C.lineChart([{ name: "Rating", pts: rp }], { w: 320, h: 140, yFmt: function (v) { return v.toFixed(1) + "★"; } }) + "</div>" +
        '<p class="small dim" style="margin:6px 0 0">' + esc(svc.ratings.note) + " · drift " +
        '<b class="' + (d < -0.01 ? "plandelta-up" : "plandelta-down") + '">' + (d > 0 ? "+" : "") + d.toFixed(2) + "★</b></p></div>";
    }

    var timeline = (svc.events || []).slice().sort(function (a, b) { return a.d < b.d ? 1 : -1; })
      .map(function (ev) { return eventItem(ev, svc); }).join("") ||
      '<div class="emptyblock">No events logged yet. <a href="#/submit">Add the first one →</a></div>';

    document.title = svc.name + " · Enshittification Index " + sc.total;

    app.innerHTML = '' +
      '<div class="breadcrumb"><a href="#/">← The Index</a></div>' +
      '<div class="sh">' +
      '<div class="sh-left">' +
      '<span class="chip">' + esc(svc.category) + "</span> " + deltaChip(id) +
      "<h1>" + esc(svc.name) + "</h1>" +
      '<p class="lede">' + esc(svc.short || "") + "</p>" +
      '<div class="panel" style="margin-top:16px"><h3 style="margin-top:0">Price history</h3>' +
      '<div class="chartbox">' + chart + "</div>" +
      '<div class="legend">' + legend + "</div>" +
      '<table class="plan-rows" style="margin-top:12px">' +
      '<tr><td>Plan</td><td style="text-align:right">now</td><td style="text-align:right">lifetime</td></tr>' +
      planRows + "</table>" +
      '<p class="small faint" style="margin:8px 0 0">US list prices, taxes excluded. Editorial seed — verify.</p></div>' +
      (ratingsHTML ? '<div style="margin-top:14px">' + ratingsHTML + "</div>" : "") +
      "</div>" +

      '<div class="sh-right">' +
      '<div class="panel"><div class="score-line">' +
      '<span class="score-num ' + sc.verdict.cls + '">' + sc.total + '</span>' +
      '<span class="score-outof">/ 100</span></div>' +
      '<div class="verdict-sub ' + sc.verdict.cls + '" style="margin-top:4px">' + sc.verdict.label + "</div>" +
      '<p class="small dim sentence">' + esc(svc.name) +
      (sc.total >= 25
        ? " sits at " + sc.total + " on the Enshittification Index. The trend lately: " +
          (delta12(id) > 0.5 ? "still getting worse."
            : delta12(id) < -0.5
              ? (betterRecent(id) ? "genuinely recovering." : "coasting — no new sins, but old damage is fading out of the scoring window.")
              : "stabilized, for now.")
        : " is holding the line at " + sc.total + " — for now.") + "</p>" +
      '<div class="parts">' +
      partBar("Price creep", sc.parts.price, 30, "#ff5d5d") +
      partBar("Paywalls & cuts", sc.parts.events, 50, "#f5a524") +
      partBar("Reviews drifting", sc.parts.sentiment, 25, "#7aa2ff") +
      "</div>" +
      '<p class="small dim" style="margin:10px 0 0">' + sc.recent + " heat events in the last 12 months · " +
      sc.nWorse + " worse / " + sc.nBetter + " better on record.</p>" +
      '<div style="margin-top:12px"><a class="btn" href="#/method" style="margin-right:8px">How is this computed?</a></div>' +
      "</div></div></div>" +

      '<div class="section-h"><h2>Receipts — the record</h2><a class="btn" href="#/submit">＋ Add evidence</a></div>' +
      '<div class="timeline">' + timeline + "</div>";
  }

  function partBar(label, val, max, color) {
    var w = Math.max(2, val / max * 100);
    return '<div class="part">' +
      '<div class="part-top"><span>' + esc(label) + "</span></div>" +
      '<div class="part-top"><span class="mono"><b>' + val + "</b> / " + max + "</span></div>" +
      '<div class="part-track"><div class="part-fill" style="width:' + w + '%;background:' + color + '"></div></div>' +
      "</div>";
  }

  /* ---------------- FEED ---------------- */

  function renderFeed() {
    var chips = [["all", "All"], ["worse", "Worse"], ["better", "Better"], ["price", "Price"]];
    return '<h1>The wire</h1>' +
      '<p class="lede">Everything logged, newest first. This is the raw record the scores come from.</p>' +
      '<div class="filterrow">' + chips.map(function (c) {
        return '<span class="chip click' + (state.feedType === c[0] ? " on" : "") + '" data-ft="' + c[0] + '">' + c[1] + "</span>";
      }).join("") + "</div>" +
      '<div id="feedlist"></div>';
  }

  function bindFeed() {
    paintFeed();
    document.querySelector(".filterrow").addEventListener("click", function (e) {
      var t = e.target.getAttribute("data-ft");
      if (!t) return;
      state.feedType = t;
      document.querySelectorAll(".filterrow .chip").forEach(function (el) {
        el.classList.toggle("on", el.getAttribute("data-ft") === t);
      });
      paintFeed();
    });
  }

  function paintFeed() {
    var host = document.getElementById("feedlist");
    if (!host) return;
    var evs = allEvents().filter(function (e) {
      return state.feedType === "all" || e.t === state.feedType;
    });
    var html = "", lastMonth = "";
    evs.forEach(function (ev) {
      var d = parseD(ev.d);
      var month = d.toLocaleDateString("en", { month: "long" }) + " " + d.getFullYear();
      if (month !== lastMonth) {
        html += '<div class="feed-month">' + month + "</div>";
        lastMonth = month;
      }
      var svc = SERVICES[ev.svc];
      html += eventItem(ev, svc).replace('<div class="tl-title">', '<div class="tl-title"><a href="#/s/' + ev.svc + '">' + esc(svc.name) + "</a> — ");
      /* close the injected span: title text follows anchor; fix by closing tag after svc name */
    });
    host.innerHTML = html || '<div class="emptyblock">Nothing of this type logged.</div>';
  }

  /* ---------------- METHOD ---------------- */

  function renderMethod() {
    var ex = scoreFor("netflix", new Date());
    var now = new Date();
    var ids = sortedIds().map(function (id) {
      var s = scoreFor(id, now);
      return "<tr><td><a href='#/s/" + id + "'>" + esc(SERVICES[id].name) + "</a></td><td class='mono'>" +
        s.parts.price + "</td><td class='mono'>" + s.parts.events + "</td><td class='mono'>" +
        s.parts.sentiment + "</td><td class='mono'><b>" + s.total + "</b></td><td>" +
        "<span class='chip " + s.verdict.cls + "'>" + s.verdict.label + "</span></td></tr>";
    }).join("");

    return '<h1>Method</h1>' +
      '<p class="lede">The Enshittification Index is deliberately boring: three additive components, each capped, each explainable in one sentence. No black box.</p>' +
      '<div class="formula"><pre>' +
      "<b>INDEX = price_part + events_part + sentiment_part</b>   (clamped 0–100)\n\n" +
      "price_part    0–30   flagship plan's % change over the last 36 months × 0.8\n" +
      "events_part   0–50   Σ worse/better events: 2/6/10/16/22 points by impact (1–5)\n" +
      "                     × retention — full weight to 24 months old,\n" +
      "                     linear fade to zero at 72 months. Better events subtract.\n" +
      "sentiment     0–25   app-rating drift: last 15 months vs prior 15 months, × 18\n" +
      "</pre></div>" +

      "<h2>Verdict bands</h2>" +
      "<table class='method-t'><tr><th>Index</th><th>Verdict</th><th>Translation</th></tr>" +
      "<tr><td class='mono'>0–9</td><td><span class='chip g'>Fine (for now)</span></td><td>No measurable decay. Watch it anyway.</td></tr>" +
      "<tr><td class='mono'>10–19</td><td><span class='chip t'>Drifting</span></td><td>Small creep — prices or a stray clawback.</td></tr>" +
      "<tr><td class='mono'>20–39</td><td><span class='chip a'>Getting worse</span></td><td>A clear pattern you'd complain about at dinner.</td></tr>" +
      "<tr><td class='mono'>40–59</td><td><span class='chip r'>Aggressively worse</span></td><td>Documented extraction-brain. You're the revenue line now.</td></tr>" +
      "<tr><td class='mono'>60+</td><td><span class='chip x'>Peak enshittification</span></td><td>The product is the cover story for the pricing.</td></tr></table>" +

      "<h2>Rules of the record</h2>" +
      "<ul class='wishlist'>" +
      "<li><b>Price events don't double-count.</b> Price hikes live in the price component; they appear in timelines as context only.</li>" +
      "<li><b>Retention, not amnesia.</b> An event holds full weight for 24 months, then fades linearly to zero by year six. Getting worse <i>and staying bad</i> keeps scoring; truly old sins lose their grip. A delta without recent good events reads as <span class='faint'>◷ old damage fading</span> — not recovery.</li>" +
      "<li><b>Better events subtract.</b> Improvements lower the score. A genuinely improved product can trend toward zero.</li>" +
      "<li><b>Prices are US list, taxes excluded.</b> Regional prices vary — the citizen price wedge is a future feature.</li>" +
      "<li><b>Sentiment is optional.</b> No rating data ⇒ that component is 0, not invented.</li>" +
      "<li><b>Everything is cited.</b> Each event carries a source and a confidence chip: <span class='chip b'>reported</span> (dated, widely reported) vs <span class='chip a'>unverified</span> (editorial synthesis).</li>" +
      "</ul>" +

      "<h2>Worked example — right now</h2>" +
      "<table class='method-t'><tr><th>Service</th><th>Price</th><th>Cuts</th><th>Reviews</th><th>Index</th><th>Verdict</th></tr>" + ids + "</table>" +
      "<p class='small dim' style='margin-top:8px'>Netflix breakdown as computed for this page load: price " +
      ex.parts.price + " + cuts " + ex.parts.events + " + reviews " + ex.parts.sentiment + " = <b>" + ex.total + "</b>.</p>" +

      "<h2>Where real data will come from</h2>" +
      "<ul class='wishlist'>" +
      "<li><b>Reviews:</b> Apple's public customer-reviews RSS endpoint gives monthly dumps per app — no API key. A cron job per tracked app replaces the editorial series.</li>" +
      "<li><b>Prices:</b> a watchdog diffing pricing pages weekly (and the Wayback Machine for history).</li>" +
      "<li><b>Cuts & paywalls:</b> community submissions (below) + a review queue. Git-backed, so every change is auditable.</li>" +
      "</ul>" +
      '<p><a class="btn primary" href="#/submit">＋ Submit evidence</a></p>';
  }
  /* ---------------- SUBMIT ---------------- */

  function renderSubmit() {
    var ids = sortedIds().map(function (id) {
      return '<option value="' + id + '">' + esc(SERVICES[id].name) + "</option>";
    }).join("");
    return '<h1>Submit evidence</h1>' +
      '<p class="lede">Spotted a hike, a cut, a paywall, or (rarely) an improvement? Log it. Markdown is generated for you to paste into the repo or send.</p>' +
      '<form id="evform" class="form" style="margin-top:18px">' +
      '<div><label>Service</label><select id="f-svc">' + ids +
      '<option value="__new">— other / new —</option></select></div>' +
      '<div><label>New service name (if other)</label><input id="f-new" placeholder="e.g. Notion"></div>' +
      '<div><label>Type</label><select id="f-type"><option value="worse">Worse</option><option value="better">Better</option><option value="price">Price change (context only)</option></select></div>' +
      '<div><label>Impact (1–5)</label><input id="f-impact" type="range" min="1" max="5" value="3" oninput="document.getElementById(\'f-impact-v\').textContent=this.value"><span class="small dim mono" id="f-impact-v">3</span></div>' +
      '<div><label>Date</label><input id="f-date" type="month" value="' + new Date().toISOString().slice(0, 7) + '"></div>' +
      '<div><label>Confidence</label><select id="f-conf"><option value="editorial">editorial (verify later)</option><option value="news">reported & dated</option></select></div>' +
      '<div class="full"><label>Title</label><input id="f-title" required placeholder="e.g. Free plan capped at 3 documents"></div>' +
      '<div class="full"><label>What happened</label><textarea id="f-detail" placeholder="Facts, dates, numbers. Cold, not angry."></textarea></div>' +
      '<div class="full"><label>Source (where did you see it?)</label><input id="f-src" placeholder="e.g. theverge.com, Jan 2026"></div>' +
      '<div class="full" style="display:flex;gap:10px;margin-top:4px">' +
      '<button type="submit" class="btn primary">Generate entry</button>' +
      '<button type="button" class="btn" id="f-copy">Copy markdown</button>' +
      '<button type="button" class="btn" id="f-dl">Download .md</button>' +
      "</div></form>" +
      '<h2 style="margin-top:26px">Your entry</h2>' +
      '<div class="outbox" id="out">Fill the form — generated markdown appears here.</div>';
  }

  function bindSubmit() {
    var form = document.getElementById("evform");
    var out = document.getElementById("out");
    var draftKey = "ww-draft";

    /* restore draft */
    try {
      var d = JSON.parse(localStorage.getItem(draftKey) || "{}");
      ["f-new", "f-title", "f-detail", "f-src"].forEach(function (k) {
        if (d[k]) document.getElementById(k).value = d[k];
      });
      ["f-svc", "f-type", "f-conf", "f-date", "f-impact"].forEach(function (k) {
        if (d[k]) document.getElementById(k).value = d[k];
      });
    } catch (e) { /* private mode etc. */ }

    function current() {
      return {
        fSvc: document.getElementById("f-svc").value,
        fNew: document.getElementById("f-new").value.trim(),
        fType: document.getElementById("f-type").value,
        fImpact: +document.getElementById("f-impact").value,
        fDate: document.getElementById("f-date").value,
        fConf: document.getElementById("f-conf").value,
        fTitle: document.getElementById("f-title").value.trim(),
        fDetail: document.getElementById("f-detail").value.trim(),
        fSrc: document.getElementById("f-src").value.trim()
      };
    }

    form.addEventListener("input", function () {
      try { localStorage.setItem(draftKey, JSON.stringify(current())); } catch (e) {}
    });

    function markdown() {
      var v = current();
      var svc = v.fSvc === "__new" ? (v.fNew || "NEW-SERVICE") : v.fSvc;
      var title = v.fTitle || "(no title)";
      var date = v.fDate || "YYYY-MM";
      return "" +
        "```yaml\n" +
        "- service: " + svc + "\n" +
        "  date: " + date + "\n" +
        "  type: " + v.fType + "\n" +
        "  impact: " + v.fImpact + "\n" +
        "  conf: " + v.fConf + "\n" +
        "  title: >-\n    " + title + "\n" +
        "  detail: >-\n    " + (v.fDetail || "(no detail)") + "\n" +
        "  src: " + (v.fSrc || "(no source)") + "\n" +
        "```\n\n" +
        "- **Service:** " + svc + "\n" +
        "- **What:** " + title + "\n" +
        "- **When:** " + date + "\n" +
        "- **Impact:** " + v.fImpact + "/5\n" +
        "- **Source:** " + (v.fSrc || "—") + "\n\n" +
        (v.fDetail || "") + "\n";
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      out.textContent = markdown();
    });

    document.getElementById("f-copy").addEventListener("click", function () {
      var md = markdown();
      out.textContent = md;
      function fallback() {
        var ta = document.createElement("textarea");
        ta.value = md; document.body.appendChild(ta); ta.select();
        try { document.execCommand("copy"); } catch (e) {}
        document.body.removeChild(ta);
      }
      if (navigator.clipboard) navigator.clipboard.writeText(md).catch(fallback);
      else fallback();
    });

    document.getElementById("f-dl").addEventListener("click", function () {
      var md = markdown();
      out.textContent = md;
      var blob = new Blob([md], { type: "text/markdown" });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "evidence-" + (current().fSvc === "__new" ? "new" : current().fSvc) + "-" + (current().fDate || "date") + ".md";
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
    });
  }

  /* ---------------- boot ---------------- */
  window.addEventListener("hashchange", route);
  document.addEventListener("DOMContentLoaded", route);
})();
