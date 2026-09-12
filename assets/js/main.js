/* ============================================================
   FlowPulse — interactions: i18n toggle, scroll reveal, nav,
   motion-console streaming, hero orb parallax
   ============================================================ */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- bilingual toggle ---------- */
  var KEY = "flowpulse-lang";
  function applyLang(lang) {
    document.documentElement.lang = lang;
    try { localStorage.setItem(KEY, lang); } catch (e) {}
    var btn = document.querySelector(".lang-toggle");
    if (btn) btn.textContent = lang === "zh" ? "EN" : "中文";
  }
  var saved = "zh";
  try { saved = localStorage.getItem(KEY) || "zh"; } catch (e) {}
  applyLang(saved);

  document.addEventListener("click", function (e) {
    if (e.target && e.target.classList.contains("lang-toggle")) {
      var cur = document.documentElement.lang === "zh" ? "en" : "zh";
      applyLang(cur);
    }
  });

  /* ---------- mobile nav ---------- */
  document.addEventListener("click", function (e) {
    if (e.target && e.target.classList.contains("nav-toggle")) {
      var links = document.querySelector(".nav-links");
      if (links) links.classList.toggle("open");
    }
  });

  /* ---------- scroll reveal ---------- */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) {
        en.target.classList.add("in");
        io.unobserve(en.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });

  /* ---------- motion console ---------- */
  function esc(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  /* colorize a log line: [tag] prefix + G-words + ;comments */
  function colorize(line) {
    var html = esc(line);
    html = html.replace(/^(\[[a-z ]+\])/m, '<span class="tag-ac">$1</span>');
    html = html.replace(/^(\$)/m, '<span class="prompt">$1</span>');
    html = html.replace(/\b(G\d+|M\d+|T\d)\b/g, '<span class="g">$1</span>');
    html = html.replace(/(;.*)$/m, '<span class="cm">$1</span>');
    return html;
  }
  var BOOT = [
    "$ flowpulse host --connect",
    "[link ] TCP :9527 · handshake ok · AES-256-GCM · key #7",
    "[core ] planner: look-ahead=12 · profile=S-Curve",
    "[core ] input-shaper: MZV · f=42.6 Hz · ζ=0.08",
    "[mcu  ] STM32F407 @168 MHz · bare-metal · 1 ms tick",
    "[mcu  ] steppers X Y Z E armed · step ~500 kHz",
    "[bed  ] mesh 5×5 loaded · bicubic",
    "[core ] stream start · print.gcode"
  ];
  var STREAM = [
    "G1 X124.612 Y88.204 E0.04213 F6000",
    "G1 X125.104 Y88.917 E0.04271 F6000",
    "G2 X128.411 Y91.236 I1.812 J0.418 F4800",
    "G1 X130.002 Y96.512 E0.04418 F7200 ; outer wall",
    "M106 S178 ; part fan",
    "G1 X96.204 Y132.811 E0.04502 F6000",
    "G1 X95.408 Y131.702 E0.04555 F6000",
    "G3 X92.833 Y129.914 I-1.602 J-0.901 F4800",
    "G92 E0",
    "G1 X92.100 Y129.400 E0.04610 F6000 ; infill"
  ];
  function initConsole() {
    var log = document.getElementById("cLog");
    if (!log) return;
    var MAXLINES = 16;
    var frag = [];
    function push(line, cls) {
      frag.push('<div class="ln' + (cls ? " " + cls : "") + '">' + colorize(line) + (cls === "tail" ? '<span class="caret"></span>' : "") + "</div>");
      if (frag.length > MAXLINES) frag.shift();
      log.innerHTML = frag.join("");
    }
    var si = 0;
    function streamOne() {
      push(STREAM[si % STREAM.length]);
      si++;
      push(">", "tail");
    }
    /* boot sequence, then streaming */
    BOOT.forEach(function (l, i) { push(l, i === BOOT.length - 1 ? "tail" : ""); });
    if (reduceMotion) return;
    var bootDelay = 900;
    setTimeout(function () {
      streamOne();
      var timer = setInterval(function () {
        if (document.hidden) return;
        streamOne();
      }, 750);
      /* pause when tab hidden for long: clear via visibility handled above */
      void timer;
    }, bootDelay);

    /* live values jitter */
    var $ = function (id) { return document.getElementById(id); };
    var X = 124.612, Y = 88.204, E = 42.318;
    setInterval(function () {
      if (document.hidden) return;
      X += (Math.random() - 0.45) * 1.7;
      Y += (Math.random() - 0.42) * 1.5;
      E += Math.random() * 0.35;
      var F = 4800 + Math.round(Math.random() * 3) * 600;
      var S = 480 + Math.round(Math.random() * 36);
      var ex = $("lvX"), ey = $("lvY"), ee = $("lvE"), ef = $("lvF"), es = $("lvS"), bar = $("lvBar");
      if (!ex) return;
      ex.textContent = X.toFixed(3);
      ey.textContent = Y.toFixed(3);
      ee.textContent = E.toFixed(3);
      ef.textContent = F + " mm/min";
      es.textContent = S + " kHz";
      bar.style.width = Math.round((S / 520) * 100) + "%";
    }, 640);
  }
  initConsole();

  /* ---------- fps counter (console footer) ---------- */
  (function () {
    var el = document.getElementById("fps");
    if (!el || reduceMotion) return;
    var frames = 0, last = performance.now();
    function tick(now) {
      frames++;
      if (now - last >= 1000) {
        el.textContent = frames;
        frames = 0; last = now;
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  })();

  /* ---------- hero orb parallax ---------- */
  (function () {
    if (reduceMotion || !window.matchMedia("(pointer: fine)").matches) return;
    var hero = document.querySelector(".hero");
    if (!hero) return;
    var orbs = hero.querySelectorAll(".orb");
    var raf = 0, tx = 0, ty = 0;
    hero.addEventListener("mousemove", function (e) {
      var r = hero.getBoundingClientRect();
      tx = (e.clientX - r.left) / r.width - 0.5;
      ty = (e.clientY - r.top) / r.height - 0.5;
      if (!raf) raf = requestAnimationFrame(function () {
        raf = 0;
        orbs.forEach(function (o) {
          var d = parseFloat(o.getAttribute("data-depth")) || 20;
          var base = o.classList.contains("orb-1") ? "translateX(-72%)" :
                     o.classList.contains("orb-2") ? "translateX(6%)" : "";
          o.style.transform = base + " translate3d(" + (-tx * d) + "px, " + (-ty * d) + "px, 0)";
        });
      });
    });
  })();
})();
