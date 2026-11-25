/* Nails & Lashes Boom — без сторонніх бібліотек. Весь текст з даних вставляється через textContent (без innerHTML). */
(function () {
  "use strict";
  var doc = document;
  var $ = function (s, r) { return (r || doc).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); };
  function el(tag, cls, text) {
    var e = doc.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = String(text);
    return e;
  }

  doc.documentElement.classList.add("js");
  var yearEl = $("#year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* --- меню і шапка --- */
  var header = $(".top"), menuBtn = $(".menu-btn"), nav = $("#nav");
  menuBtn.addEventListener("click", function () {
    var open = menuBtn.getAttribute("aria-expanded") !== "true";
    menuBtn.setAttribute("aria-expanded", String(open));
    nav.classList.toggle("open", open);
  });
  $$("a", nav).forEach(function (a) {
    a.addEventListener("click", function () {
      menuBtn.setAttribute("aria-expanded", "false");
      nav.classList.remove("open");
    });
  });
  var onScroll = function () { header.classList.toggle("scrolled", window.scrollY > 10); };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* --- плавна поява --- */
  function observeReveal(nodes) {
    if (!("IntersectionObserver" in window)) { nodes.forEach(function (n) { n.classList.add("in"); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    nodes.forEach(function (n) { io.observe(n); });
  }
  observeReveal($$(".reveal"));

  /* --- галерея: фільтр --- */
  var tabs = $$(".tab"), items = $$(".g");
  tabs.forEach(function (t) {
    t.addEventListener("click", function () {
      var f = t.getAttribute("data-filter");
      tabs.forEach(function (x) { var on = x === t; x.classList.toggle("is-active", on); x.setAttribute("aria-selected", String(on)); });
      items.forEach(function (it) { it.classList.toggle("is-hidden", f !== "all" && !it.classList.contains(f)); });
    });
  });

  /* --- відео: грають без звуку, коли видно; клік — пауза/старт --- */
  var videos = $$(".g video");
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if ("IntersectionObserver" in window && !reduce) {
    var vio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting) { v.preload = "auto"; var p = v.play(); if (p && p.catch) p.catch(function () {}); }
        else v.pause();
      });
    }, { threshold: 0.4 });
    videos.forEach(function (v) { vio.observe(v); });
  }
  videos.forEach(function (v) {
    v.addEventListener("click", function () { if (v.paused) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } else v.pause(); });
  });

  /* --- лайтбокс для фото --- */
  var lb = $("#lightbox"), lbImg = $("#lb-img"), links = $$(".g a"), idx = 0, lastFocus = null;
  function visibleLinks() { return links.filter(function (a) { return !a.parentNode.classList.contains("is-hidden"); }); }
  function show(i) {
    var list = visibleLinks(); if (!list.length) return;
    idx = (i + list.length) % list.length;
    var a = list[idx], img = $("img", a);
    lbImg.src = a.getAttribute("href");
    lbImg.alt = img ? img.alt : "";
  }
  function openLb(a) {
    lastFocus = doc.activeElement;
    show(visibleLinks().indexOf(a));
    lb.hidden = false; doc.body.style.overflow = "hidden";
    $(".lb-close", lb).focus();
  }
  function closeLb() { lb.hidden = true; doc.body.style.overflow = ""; lbImg.removeAttribute("src"); if (lastFocus) lastFocus.focus(); }
  links.forEach(function (a) { a.addEventListener("click", function (e) { e.preventDefault(); openLb(a); }); });
  $(".lb-close", lb).addEventListener("click", closeLb);
  $(".lb-prev", lb).addEventListener("click", function () { show(idx - 1); });
  $(".lb-next", lb).addEventListener("click", function () { show(idx + 1); });
  lb.addEventListener("click", function (e) { if (e.target === lb) closeLb(); });
  doc.addEventListener("keydown", function (e) {
    if (lb.hidden) return;
    if (e.key === "Escape") closeLb();
    else if (e.key === "ArrowLeft") show(idx - 1);
    else if (e.key === "ArrowRight") show(idx + 1);
  });
  var tx = null;
  lb.addEventListener("touchstart", function (e) { tx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener("touchend", function (e) {
    if (tx == null) return; var dx = e.changedTouches[0].clientX - tx; tx = null;
    if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1));
  });

  /* --- музика: SoundCloud завантажується лише після натискання (до того жодних запитів до SoundCloud) --- */
  var TRACK = "https://soundcloud.com/onlybangs/tebra-slow";
  var player = $("#player"), pBtn = $("#player-btn"), pBox = $("#player-box"), pFrame = $("#player-frame");
  pBtn.addEventListener("click", function () {
    var open = pBox.hidden;
    pBox.hidden = !open;
    pBtn.setAttribute("aria-expanded", String(open));
    if (open && !pFrame.firstChild) {
      var f = doc.createElement("iframe");
      f.src = "https://w.soundcloud.com/player/?url=" + encodeURIComponent(TRACK) +
        "&auto_play=true&color=%23d9527f&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=false";
      f.title = "Музика";
      f.allow = "autoplay; encrypted-media";
      f.referrerPolicy = "strict-origin-when-cross-origin";
      f.loading = "eager";
      pFrame.appendChild(f);
      player.classList.add("playing");
    }
  });

  /* --- дані: вільні віконця і відгуки (JSON-файли в папці data) --- */
  function getJSON(url) {
    return fetch(url + "?v=" + Date.now(), { cache: "no-store", credentials: "omit", referrerPolicy: "no-referrer" })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); });
  }
  function parseDate(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || ""));
    return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
  }
  var fmtDay = new Intl.DateTimeFormat("uk-UA", { weekday: "long", day: "numeric", month: "long" });
  var fmtShort = new Intl.DateTimeFormat("uk-UA", { day: "numeric", month: "long" });

  getJSON("rozklad.json").then(function (data) {
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var days = (Array.isArray(data.dni) ? data.dni : [])
      .map(function (d) { return { date: parseDate(d.data), svc: d.posluga, hours: Array.isArray(d.hodyny) ? d.hodyny : [] }; })
      .filter(function (d) { return d.date && d.date >= today && d.hours.length; })
      .sort(function (a, b) { return a.date - b.date; })
      .slice(0, 12);
    var box = $("#slots");
    days.forEach(function (d) {
      var card = el("article", "slot reveal");
      card.appendChild(el("h3", null, fmtDay.format(d.date)));
      if (d.svc) card.appendChild(el("p", "svc", d.svc));
      var ul = el("ul");
      d.hours.slice(0, 12).forEach(function (h) { ul.appendChild(el("li", null, h)); });
      card.appendChild(ul);
      box.appendChild(card);
    });
    observeReveal($$(".slot", box));
    var upd = parseDate(data.onovleno);
    if (upd) $("#free-updated").textContent = "Оновлено " + fmtShort.format(upd);
    if (!days.length) $("#slots-empty").hidden = false;
  }).catch(function () { $("#slots-empty").hidden = false; });

  /* --- відгуки: автоматично з опублікованої Google Таблиці (відповіді форми) + ручні з vidhuky.json --- */
  var REVIEWS_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRutViQqxZ3dhREfotMIU5FrwUl4xkqIHoC4j-TYxS6sxQDRp1qOjXs0Vj7AccESlLukXnFYKsiGs0U/pub?output=csv";
  function parseCSV(text) {
    var rows = [], row = [], f = "", q = false, i, c;
    for (i = 0; i < text.length; i++) {
      c = text.charAt(i);
      if (q) {
        if (c === '"') { if (text.charAt(i + 1) === '"') { f += '"'; i++; } else q = false; }
        else f += c;
      } else if (c === '"') q = true;
      else if (c === ",") { row.push(f); f = ""; }
      else if (c === "\n" || c === "\r") {
        if (c === "\r" && text.charAt(i + 1) === "\n") i++;
        row.push(f); rows.push(row); row = []; f = "";
      } else f += c;
    }
    if (f || row.length) { row.push(f); rows.push(row); }
    return rows;
  }
  function clean(t, max) {
    t = String(t || "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
    /* у кириличному тексті латинська i -> українська і */
    if (/[Ѐ-ӿ]/.test(t) && !/[a-hj-z]/i.test(t)) t = t.replace(/i/g, "і").replace(/I/g, "І");
    return t.length > max ? t.slice(0, max - 1) + "…" : t;
  }
  function looksSpam(t) { return /(https?:|www\.|\.(com|ru|net|org|io|xyz|ua)\b|t\.me|@\w)/i.test(t); }
  function fromSheet() {
    return fetch(REVIEWS_CSV, { cache: "no-store", credentials: "omit", referrerPolicy: "no-referrer" })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); })
      .then(function (txt) {
        return parseCSV(txt).slice(1).map(function (c) {
          return { posluga: clean(c[1], 40), imya: clean(c[2], 40), tekst: clean(c[3], 600) };
        }).filter(function (r) { return r.tekst.length >= 3 && !looksSpam(r.tekst + " " + r.imya); }).reverse();
      });
  }
  function fromFile() {
    return getJSON("vidhuky.json").then(function (l) { return Array.isArray(l) ? l : []; }).catch(function () { return []; });
  }
  Promise.all([fromSheet().catch(function () { return []; }), fromFile()]).then(function (res) {
    var seen = {}, list = [];
    res[0].concat(res[1]).forEach(function (r) {
      if (!r || !r.tekst) return;
      var k = clean(r.tekst, 600).toLowerCase();
      if (seen[k]) return;
      seen[k] = 1; list.push(r);
    });
    var box = $("#reviews-list");
    list.slice(0, 30).forEach(function (r) {
      var card = el("figure", "review reveal");
      var n = Math.max(0, Math.min(5, parseInt(r.zirky, 10) || 0));
      if (n) card.appendChild(el("div", "stars", "★★★★★".slice(0, n)));
      card.appendChild(el("p", null, clean(r.tekst, 600)));
      var f = el("footer", null, clean(r.imya, 40) || "Клієнтка");
      if (r.posluga) f.appendChild(el("small", null, clean(r.posluga, 40)));
      card.appendChild(f);
      box.appendChild(card);
    });
    observeReveal($$(".review", box));
    if (!list.length) $("#reviews-empty").hidden = false;
  });
})();
