/* =========================================================
   Silent Library — Custom JavaScript
   Handles: navbar scroll state, active link, scroll reveal
   animation, back-to-top button, books filter, contact form
   validation and the click-to-load map facade.
   ========================================================= */

/* E4 — mark the document before first paint so the reveal animation only
   applies when scripting is available.  Without this class the CSS leaves
   every section visible, so the page degrades gracefully. */
/* The .js-reveal marker is set by a tiny inline script in <head> so that it
   applies before first paint; this deferred file runs too late for that. */

document.addEventListener("DOMContentLoaded", function () {

  /* E8b — the only Bootstrap JavaScript component this site used was the
     navbar collapse.  Re-implementing it here removes an 80 KiB bundle of
     which roughly 65 KiB was never executed. */
  const toggler = document.querySelector(".navbar-toggler");
  const collapseTarget = toggler && document.querySelector(toggler.getAttribute("data-bs-target"));
  if (toggler && collapseTarget) {
    let animating = false;
    const isOpen = () => collapseTarget.classList.contains("show");

    const open = () => {
      animating = true;
      collapseTarget.classList.remove("collapse");
      collapseTarget.classList.add("collapsing");
      collapseTarget.style.height = "0px";
      requestAnimationFrame(() => { collapseTarget.style.height = collapseTarget.scrollHeight + "px"; });
      window.setTimeout(() => {
        collapseTarget.classList.remove("collapsing");
        collapseTarget.classList.add("collapse", "show");
        collapseTarget.style.height = "";
        animating = false;
      }, 320);
    };

    const close = () => {
      animating = true;
      collapseTarget.style.height = collapseTarget.scrollHeight + "px";
      requestAnimationFrame(() => {
        collapseTarget.classList.remove("collapse", "show");
        collapseTarget.classList.add("collapsing");
        collapseTarget.style.height = "0px";
      });
      window.setTimeout(() => {
        collapseTarget.classList.remove("collapsing");
        collapseTarget.classList.add("collapse");
        collapseTarget.style.height = "";
        animating = false;
      }, 320);
    };

    toggler.addEventListener("click", function () {
      if (animating) return;
      const open_ = isOpen();
      toggler.setAttribute("aria-expanded", String(!open_));
      open_ ? close() : open();
    });
  }

  /* ---------- Navbar shrink on scroll ---------- */
  const navbar = document.getElementById("mainNav");
  const backToTop = document.getElementById("backToTop");

  function handleScroll() {
    if (window.scrollY > 60) {
      navbar && navbar.classList.add("scrolled");
      backToTop && (backToTop.style.display = "flex");
    } else {
      navbar && navbar.classList.remove("scrolled");
      backToTop && (backToTop.style.display = "none");
    }
  }
  window.addEventListener("scroll", handleScroll, { passive: true });
  handleScroll();

  if (backToTop) {
    backToTop.addEventListener("click", function () {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    });
  }

  /* ---------- Highlight active nav link ---------- */
  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".navbar-nav .nav-link").forEach(function (link) {
    const href = link.getAttribute("href");
    if (href === currentPage) {
      link.classList.add("active");
      link.setAttribute("aria-current", "page");
    }
  });

  /* ---------- Scroll reveal animation ---------- */
  const revealEls = document.querySelectorAll(".reveal");
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduced) {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  } else if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    revealEls.forEach(function (el) { observer.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------- Books list: search + genre filter ---------- */
  const searchInput = document.getElementById("bookSearch");
  const genreSelect = document.getElementById("genreFilter");
  const bookCards = document.querySelectorAll(".book-card-item");
  const emptyState = document.getElementById("noResults");
  const resultCount = document.getElementById("resultCount");

  function filterBooks() {
    if (!bookCards.length) return;
    const query = (searchInput && searchInput.value ? searchInput.value : "").toLowerCase().trim();
    const genre = genreSelect && genreSelect.value ? genreSelect.value : "all";

    let visibleCount = 0;
    bookCards.forEach(function (card) {
      const title = (card.getAttribute("data-title") || "").toLowerCase();
      const author = (card.getAttribute("data-author") || "").toLowerCase();
      const cardGenre = card.getAttribute("data-genre") || "";

      const matchesQuery = title.includes(query) || author.includes(query);
      const matchesGenre = genre === "all" || cardGenre === genre;

      if (matchesQuery && matchesGenre) {
        card.hidden = false;
        visibleCount++;
      } else {
        card.hidden = true;
      }
    });

    /* E2 — toggle the Bootstrap utility class rather than an inline style.
       .d-none declares display:none !important, which an inline style can
       never override, so the previous implementation could never reveal
       this element. */
    if (emptyState) {
      emptyState.classList.toggle("d-none", visibleCount !== 0);
    }
    if (resultCount) {
      resultCount.textContent = visibleCount === 0
        ? "No books match your search."
        : visibleCount + (visibleCount === 1 ? " book matches" : " books match") + " your search.";
    }
  }

  if (searchInput) searchInput.addEventListener("input", filterBooks);
  if (genreSelect) genreSelect.addEventListener("change", filterBooks);

  /* ---------- E1: click-to-load map facade ---------- */
  const mapBtn = document.getElementById("mapLoadBtn");
  const mapFacade = document.getElementById("mapFacade");
  if (mapBtn && mapFacade) {
    mapBtn.addEventListener("click", function () {
      const frame = document.createElement("iframe");
      frame.src = mapFacade.getAttribute("data-map-src");
      frame.title = "Map showing the location of Silent Library";
      frame.loading = "lazy";
      frame.referrerPolicy = "no-referrer-when-downgrade";
      frame.setAttribute("allowfullscreen", "");
      mapFacade.innerHTML = "";
      mapFacade.appendChild(frame);
    });
  }

  /* ---------- Contact form validation (Bootstrap pattern) ---------- */
  const contactForm = document.getElementById("contactForm");
  if (contactForm) {
    contactForm.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!contactForm.checkValidity()) {
        event.stopPropagation();
      } else {
        const successAlert = document.getElementById("formSuccess");
        if (successAlert) {
          successAlert.classList.remove("d-none");
          successAlert.setAttribute("tabindex", "-1");
          successAlert.scrollIntoView({ behavior: "smooth", block: "center" });
          successAlert.focus();
        }
        contactForm.reset();
        contactForm.classList.remove("was-validated");
        return;
      }
      contactForm.classList.add("was-validated");
    });
  }

  /* =====================================================================
     MILESTONE 2 — behaviour added in response to Assignment 3 feedback.
     ===================================================================== */

  /* M2-01b — reader-controlled text size.
     Tester R5 answered "Words" when asked what was difficult and "Size of
     words" when asked what to improve first; the A1 persona Mr. Tan (58)
     lists "tiny fonts" as a frustration.  The base size was raised in CSS
     for everyone; this lets a reader who needs more go further still.
     The step multiplies the root font size, so every rem-based dimension in
     the page scales with it and the layout keeps its proportions. */
  const SIZE_KEY = "sl-text-size";
  const SIZE_STEPS = { normal: 1, large: 1.125, xlarge: 1.25 };

  function applyTextSize(size, persist) {
    const scale = SIZE_STEPS[size] || 1;
    document.documentElement.style.setProperty("--sl-text-scale", String(scale));
    document.querySelectorAll("#textSizeControl button").forEach(function (b) {
      b.setAttribute("aria-pressed", b.getAttribute("data-size") === size ? "true" : "false");
    });
    if (persist) {
      /* Private-browsing modes can refuse storage; the control must still work. */
      try { window.localStorage.setItem(SIZE_KEY, size); } catch (e) { /* ignore */ }
    }
  }

  const sizeControl = document.getElementById("textSizeControl");
  if (sizeControl) {
    let saved = "normal";
    try { saved = window.localStorage.getItem(SIZE_KEY) || "normal"; } catch (e) { /* ignore */ }
    if (!SIZE_STEPS[saved]) { saved = "normal"; }
    applyTextSize(saved, false);
    sizeControl.addEventListener("click", function (event) {
      const btn = event.target.closest("button[data-size]");
      if (btn) { applyTextSize(btn.getAttribute("data-size"), true); }
    });
  }

  /* M2-04 — accordion on the Book Details page.
     Bootstrap's JavaScript was removed in Assignment 3, so this is our own
     implementation.  Panels are open in CSS by default and collapsed only
     when scripting is present, so the record stays readable either way. */
  document.querySelectorAll("[data-sl-accordion]").forEach(function (acc) {
    acc.addEventListener("click", function (event) {
      const btn = event.target.closest(".sl-acc-btn");
      if (!btn || !acc.contains(btn)) { return; }
      const panel = document.getElementById(btn.getAttribute("aria-controls"));
      if (!panel) { return; }
      const willOpen = !panel.classList.contains("is-open");

      /* One panel at a time, which is what makes the page shorter. */
      acc.querySelectorAll(".sl-acc-panel").forEach(function (p) {
        p.classList.remove("is-open");
      });
      acc.querySelectorAll(".sl-acc-btn").forEach(function (b) {
        b.classList.add("is-collapsed");
        b.setAttribute("aria-expanded", "false");
      });

      if (willOpen) {
        panel.classList.add("is-open");
        btn.classList.remove("is-collapsed");
        btn.setAttribute("aria-expanded", "true");
      }
    });
  });

});
