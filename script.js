/* Oliver Michael Spielmann personal CV
 * Vanilla JS for scroll-driven espresso brew, bilingual toggle, counters,
 * reveal-on-scroll, sticky header and mobile nav. Single file, no deps. */

(function () {
  "use strict";

  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const ease = (t) => 1 - Math.pow(1 - clamp(t), 3);
  const sub = (progress, start, end) => ease(clamp((progress - start) / (end - start)));

  /* -- Brew progress windows -------------------------------------------------
   * The career has 7 chapters, mapped to chapter index / 6 for progress 0..1:
   *   ch 0 = 0.00  Tasse - Pub Operator-DNA            -> empty cup
   *   ch 1 = 0.17  Espresso-Shot - SBB Speisewagen     -> espresso fills
   *   ch 2 = 0.33  Crema - Strategischer Einkauf       -> crema cap
   *   ch 3 = 0.50  Milchschaum - Segafredo CEO         -> milk foam
   *   ch 4 = 0.67  Latte-Art SC - Spielmann Consulting -> SC monogram
   *   ch 5 = 0.83  Coffee Bag - Black Coffee Group     -> BCG bag appears
   *   ch 6 = 1.00  Servito - Today / Angel Investor    -> gold stamp
   * Each stage's window peaks around its chapter's progress value, and starts
   * shortly before so it begins to animate as the chapter card enters view. */
  const stageRanges = {
    shot:   [0.06, 0.22],
    crema:  [0.22, 0.38],
    milk:   [0.38, 0.55],
    art:    [0.55, 0.72],
    bag:    [0.72, 0.88],
    stamp:  [0.88, 1.00],
  };

  const build = document.querySelector("[data-build]");
  const buildChapters = Array.from(document.querySelectorAll("[data-build-step]"));

  let activeChapter = -1;
  let rafId = null;

  function setActiveChapter(index) {
    if (index === activeChapter) return;
    activeChapter = index;
    if (build) build.dataset.activeChapter = String(index);
    buildChapters.forEach((c, i) => c.classList.toggle("is-active", i === index));
  }

  /* Chapter-anchored progress: returns a continuous 0..1 value where each
   * chapter's CENTER passing the viewport's vertical midpoint maps to
   * chapterIndex / (totalChapters - 1). Between chapters the value is
   * linearly interpolated so the brew animates smoothly between cards. */
  function chapterProgress() {
    if (!buildChapters.length) return 0;
    const n = buildChapters.length;
    if (n === 1) return 1;
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const target = vh * 0.5;
    const centers = buildChapters.map((c) => {
      const r = c.getBoundingClientRect();
      return r.top + r.height / 2;
    });

    if (target <= centers[0]) return 0;
    if (target >= centers[n - 1]) return 1;

    for (let i = 0; i < n - 1; i++) {
      if (target >= centers[i] && target <= centers[i + 1]) {
        const span = centers[i + 1] - centers[i];
        const frac = span > 0 ? (target - centers[i]) / span : 0;
        return (i + frac) / (n - 1);
      }
    }
    return 0;
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

  /* ?brew=0..1 lets you force the brew progress for design review and
   * screenshots. ?brew=preview also forces a chapter index. */
  let forcedBrew = null;
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.has("brew")) {
      const v = parseFloat(params.get("brew"));
      if (!Number.isNaN(v)) forcedBrew = clamp(v, 0, 1);
    }
  } catch (err) { /* ignore */ }

  function updateBuild() {
    if (!build) return;
    const reduced = motionQuery.matches;
    const idx = activeChapterIndex();
    let progress = reduced ? 1 : chapterProgress();
    if (forcedBrew !== null) progress = forcedBrew;

    build.style.setProperty("--build-progress", progress.toFixed(3));

    Object.entries(stageRanges).forEach(([key, [s, e]]) => {
      const p = reduced ? 1 : sub(progress, s, e);
      build.style.setProperty(`--p-${key}`, p.toFixed(3));
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
