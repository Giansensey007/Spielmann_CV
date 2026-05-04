/* Oliver Michael Spielmann personal CV
 * Vanilla JS for scroll-driven train, bilingual toggle, counters, reveal,
 * sticky header and mobile nav. Single file, no dependencies. */

(function () {
  "use strict";

  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const ease = (t) => 1 - Math.pow(1 - clamp(t), 3);
  const sub = (progress, start, end) => ease(clamp((progress - start) / (end - start)));

  /* -- Build progress windows ------------------------------------------------
   * The train has 7 wagons. Each wagon "fades + settles in" within its own
   * progress window. The overall train also translates horizontally from left
   * (rear in view) to right (locomotive arriving) as the user scrolls. */
  const wagonRanges = {
    caboose:     [0.00, 0.16],
    speisewagen: [0.10, 0.28],
    cargo:       [0.22, 0.40],
    executive:   [0.36, 0.54],
    boutique:    [0.50, 0.66],
    bcg:         [0.62, 0.78],
    locomotive:  [0.74, 0.92],
    stamp:       [0.90, 1.00],
  };

  const couplerRanges = [
    [0.10, 0.20],
    [0.22, 0.30],
    [0.36, 0.44],
    [0.50, 0.58],
    [0.62, 0.70],
    [0.74, 0.82],
  ];

  const build = document.querySelector("[data-build]");
  const buildChapters = Array.from(document.querySelectorAll("[data-build-step]"));
  const trainEl = build ? build.querySelector(".train-track") : null;
  const stageEl = build ? build.querySelector(".train-build__stage") : null;

  let activeChapter = -1;
  let rafId = null;

  function setActiveChapter(index) {
    if (index === activeChapter) return;
    activeChapter = index;
    if (build) build.dataset.activeChapter = String(index);
    buildChapters.forEach((c, i) => c.classList.toggle("is-active", i === index));
  }

  function buildProgress() {
    if (!build) return 0;
    const rect = build.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const total = Math.max(1, rect.height - vh * 0.7);
    return clamp((vh * 0.5 - rect.top) / total);
  }

  function activeChapterIndex() {
    if (!buildChapters.length) return 0;
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const target = vh * 0.5;
    let bestIdx = 0;
    let bestDist = Infinity;
    buildChapters.forEach((c, i) => {
      const r = c.getBoundingClientRect();
      const center = r.top + r.height / 2;
      const d = Math.abs(center - target);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    });
    return bestIdx;
  }

  function trainTranslate(progress) {
    if (!stageEl || !trainEl) return 0;
    const stageRect = stageEl.getBoundingClientRect();
    const trainRect = trainEl.getBoundingClientRect();
    const stageWidth = stageRect.width;
    const trainWidth = trainRect.width;
    const startX = -Math.max(trainWidth - 40, stageWidth * 0.55);
    const endX = Math.max(20, stageWidth - trainWidth - 24);
    return startX + (endX - startX) * ease(progress);
  }

  function updateBuild() {
    if (!build) return;
    const reduced = motionQuery.matches;
    const idx = activeChapterIndex();
    const raw = buildProgress();
    const chapterProgress = buildChapters.length <= 1
      ? 1
      : idx / (buildChapters.length - 1);
    const progress = reduced ? 1 : Math.max(raw, chapterProgress * 0.95);

    build.style.setProperty("--build-progress", progress.toFixed(3));
    build.style.setProperty("--train-x", reduced ? 0 : trainTranslate(progress).toFixed(2));

    Object.entries(wagonRanges).forEach(([key, [s, e]]) => {
      const p = reduced ? 1 : sub(progress, s, e);
      build.style.setProperty(`--p-${key}`, p.toFixed(3));
    });

    couplerRanges.forEach(([s, e], i) => {
      const p = reduced ? 1 : sub(progress, s, e);
      const c = build.querySelector(`[data-coupler="${i + 1}"]`);
      if (c) c.style.setProperty("--p", p.toFixed(3));
    });

    setActiveChapter(idx);
  }

  /* -- Sticky header state --------------------------------------------------- */
  const header = document.getElementById("siteHeader");
  function updateHeader() {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 12);
  }

  function tick() {
    rafId = null;
    updateHeader();
    updateBuild();
  }

  function requestTick() {
    if (rafId !== null) return;
    rafId = window.requestAnimationFrame(tick);
  }

  window.addEventListener("scroll", requestTick, { passive: true });
  window.addEventListener("resize", requestTick);
  if (typeof motionQuery.addEventListener === "function") {
    motionQuery.addEventListener("change", requestTick);
  } else if (typeof motionQuery.addListener === "function") {
    motionQuery.addListener(requestTick);
  }

  /* -- Reveal on scroll ------------------------------------------------------ */
  const revealEls = Array.from(document.querySelectorAll("[data-reveal]"));
  revealEls.forEach((el) => {
    const parent = el.closest("[data-reveal-group]");
    if (!parent) return;
    const siblings = Array.from(
      parent.querySelectorAll(":scope > [data-reveal], :scope > * [data-reveal]")
    );
    const i = siblings.indexOf(el);
    if (i >= 0) el.style.setProperty("--reveal-index", String(i));
  });

  if (motionQuery.matches) {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  } else if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.16, rootMargin: "0px 0px -8% 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  /* -- Counters -------------------------------------------------------------- */
  const counters = Array.from(document.querySelectorAll("[data-counter]"));
  function formatCounter(value, decimals) {
    if (decimals > 0) return value.toFixed(decimals);
    return Math.round(value).toString();
  }

  function animateCounter(el) {
    const target = parseFloat(el.dataset.counterTarget || "0");
    const decimals = parseInt(el.dataset.counterDecimals || "0", 10);
    const suffix = el.dataset.counterSuffix || "";
    const fallback = el.dataset.counterFallback || `${formatCounter(target, decimals)}${suffix}`;
    const duration = 1400;
    if (motionQuery.matches || Number.isNaN(target)) {
      el.textContent = fallback;
      return;
    }
    const start = performance.now();
    const step = (now) => {
      const t = clamp((now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = `${formatCounter(target * eased, decimals)}${suffix}`;
      if (t < 1) {
        window.requestAnimationFrame(step);
      } else {
        el.textContent = fallback;
      }
    };
    window.requestAnimationFrame(step);
  }

  if (counters.length) {
    if (motionQuery.matches || !("IntersectionObserver" in window)) {
      counters.forEach(animateCounter);
    } else {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            animateCounter(entry.target);
            io.unobserve(entry.target);
          });
        },
        { threshold: 0.4 }
      );
      counters.forEach((c) => io.observe(c));
    }
  }

  /* -- Bilingual toggle ------------------------------------------------------ */
  const langButtons = Array.from(document.querySelectorAll(".lang-toggle [data-lang]"));
  const STORAGE_KEY = "oms-lang";
  function applyLang(lang) {
    if (lang !== "de" && lang !== "en") lang = "de";
    document.documentElement.lang = lang === "en" ? "en" : "de";
    document.querySelectorAll("[data-de], [data-en]").forEach((el) => {
      const next = lang === "en" ? el.dataset.en : el.dataset.de;
      if (typeof next === "string" && next.length > 0) {
        el.textContent = next;
      }
    });
    langButtons.forEach((btn) => {
      const active = btn.dataset.lang === lang;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    });
    try {
      window.localStorage.setItem(STORAGE_KEY, lang);
    } catch (err) { /* ignore storage errors */ }
  }

  langButtons.forEach((btn) => {
    btn.addEventListener("click", () => applyLang(btn.dataset.lang));
  });

  let initialLang = "de";
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "de" || saved === "en") initialLang = saved;
  } catch (err) { /* ignore storage errors */ }
  applyLang(initialLang);

  /* -- Mobile nav ------------------------------------------------------------ */
  const navToggle = document.getElementById("navToggle");
  const navLinks = document.getElementById("navLinks");
  if (navToggle && navLinks) {
    navToggle.addEventListener("click", () => {
      const open = navLinks.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    navLinks.addEventListener("click", (event) => {
      const target = event.target;
      if (target && target.tagName === "A") {
        navLinks.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* -- Initial paint --------------------------------------------------------- */
  tick();
})();
