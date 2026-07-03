(function () {
  const INVEST_MIN = 500000;
  const VILLA_GALLERIES = {
    osa: [
      "/costa/assets/villas/villa-osa.jpg",
      "/costa/assets/villas/villa-osa-2.jpg",
      "/costa/assets/villas/villa-osa-3.jpg",
      "/costa/assets/villas/villa-osa-4.jpg",
    ],
    jungle: [
      "/costa/assets/villas/villa-jungle.jpg",
      "/costa/assets/villas/villa-jungle-2.jpg",
      "/costa/assets/villas/villa-jungle-3.jpg",
    ],
    ocean: [
      "/costa/assets/villas/villa-ocean.jpg",
      "/costa/assets/villas/villa-ocean-2.jpg",
      "/costa/assets/villas/villa-ocean-3.jpg",
      "/costa/assets/villas/villa-ocean-4.jpg",
      "/costa/assets/villas/villa-ocean-5.jpg",
    ],
  };

  function getNavHeight() {
    const header = document.querySelector(".site-header");
    if (header) return header.offsetHeight;

    const root = getComputedStyle(document.documentElement);
    const navVar = root.getPropertyValue("--nav-height").trim();
    const rootFontSize = parseFloat(root.fontSize) || 16;
    if (navVar.endsWith("rem")) return parseFloat(navVar) * rootFontSize;
    if (navVar.endsWith("px")) return parseFloat(navVar);
    return 72;
  }

  function getDocumentTop(element) {
    return element.getBoundingClientRect().top + window.scrollY;
  }

  function scrollToKontaktForm(target) {
    const navHeight = getNavHeight();
    const padding = 24;
    const heading = target.querySelector(".contact-cta__heading");
    const anchor = heading || target;
    const scrollTop = getDocumentTop(anchor) - navHeight - padding;
    window.scrollTo({ top: Math.max(0, scrollTop), behavior: "auto" });
  }

  function scrollToHashTarget(target) {
    const navHeight = getNavHeight();

    if (target.id === "kontakt-form") {
      scrollToKontaktForm(target);
      return;
    }

    const scrollTop = getDocumentTop(target) - navHeight - 16;
    window.scrollTo({ top: Math.max(0, scrollTop), behavior: "auto" });
  }

  function scheduleKontaktFormScroll(target) {
    const run = () => scrollToKontaktForm(target);
    run();
    requestAnimationFrame(() => requestAnimationFrame(run));
    window.setTimeout(run, 120);
    window.setTimeout(run, 400);
  }

  function isSamePageKontaktLink(link) {
    const url = new URL(link.href, window.location.href);
    if (!url.hash || decodeURIComponent(url.hash.slice(1)) !== "kontakt-form") return false;

    const currentPath = window.location.pathname.replace(/\/$/, "") || "/";
    const linkPath = url.pathname.replace(/\/$/, "") || "/";
    return linkPath === currentPath;
  }

  function initKontaktFormLinks() {
    document.addEventListener("click", (event) => {
      const link = event.target.closest('a[href*="#kontakt-form"]');
      if (!link || !isSamePageKontaktLink(link)) return;

      const target = document.getElementById("kontakt-form");
      if (!target) return;

      event.preventDefault();
      if (window.location.hash !== "#kontakt-form") {
        history.pushState(null, "", "#kontakt-form");
      }
      scheduleKontaktFormScroll(target);
    });
  }

  function initHashScroll() {
    const scrollToHash = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (!id) return;
      const target = document.getElementById(id);
      if (!target) return;
      if (target.id === "kontakt-form") {
        scheduleKontaktFormScroll(target);
        return;
      }
      scrollToHashTarget(target);
    };

    if (!window.location.hash) return;

    scrollToHash();
    window.addEventListener("load", scrollToHash, { once: true });
    window.addEventListener("hashchange", scrollToHash);
  }

  function initNav() {
    const toggle = document.querySelector("[data-nav-toggle]");
    const nav = document.querySelector("[data-site-nav]");
    if (!toggle || !nav) return;

    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  function initMutedVideo(selector) {
    const playVideo = (video) => {
      video.muted = true;
      video.playsInline = true;
      video.play().catch(() => {});
    };

    document.querySelectorAll(selector).forEach((video) => {
      if (video.readyState >= 2) playVideo(video);
      else video.addEventListener("loadeddata", () => playVideo(video), { once: true });

      if ("IntersectionObserver" in window) {
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) playVideo(entry.target);
            });
          },
          { threshold: 0.2 }
        );
        observer.observe(video);
      }
    });
  }

  function initHeroVideo() {
    initMutedVideo("[data-hero-video]");
    initMutedVideo("[data-star-loop]");
  }

  function initVideoLightbox() {
    const lightbox = document.querySelector("[data-video-lightbox]");
    if (!lightbox) return;

    const videoEl = lightbox.querySelector("[data-video-player]");
    const iframeEl = lightbox.querySelector("[data-video-iframe]");
    const closeBtn = lightbox.querySelector("[data-video-close]");
    const backdrop = lightbox.querySelector("[data-video-backdrop]");

    const close = () => {
      lightbox.classList.remove("is-open");
      lightbox.setAttribute("aria-hidden", "true");
      document.body.classList.remove("is-lightbox-open");
      if (videoEl) {
        videoEl.pause();
        videoEl.removeAttribute("src");
        videoEl.load();
        videoEl.hidden = true;
      }
      if (iframeEl) {
        iframeEl.src = "";
        iframeEl.hidden = true;
      }
    };

    const open = (button) => {
      const youtubeId = button.dataset.videoYoutube;
      const src = button.dataset.videoSrc;
      const label = button.getAttribute("aria-label") || "Video";

      lightbox.setAttribute("aria-label", label);

      if (youtubeId && iframeEl) {
        if (videoEl) {
          videoEl.pause();
          videoEl.hidden = true;
        }
        iframeEl.hidden = false;
        iframeEl.title = label;
        iframeEl.src = `https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`;
      } else if (src && videoEl) {
        if (iframeEl) {
          iframeEl.src = "";
          iframeEl.hidden = true;
        }
        videoEl.hidden = false;
        videoEl.src = src;
        videoEl.muted = false;
        videoEl.currentTime = 0;
        videoEl.load();
        videoEl.play().catch(() => {});
      } else {
        return;
      }

      lightbox.classList.add("is-open");
      lightbox.setAttribute("aria-hidden", "false");
      document.body.classList.add("is-lightbox-open");
    };

    document.addEventListener("click", (event) => {
      const button = event.target.closest("[data-video-open]");
      if (!button || !lightbox.isConnected) return;
      open(button);
    });
    closeBtn?.addEventListener("click", close);
    backdrop?.addEventListener("click", close);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && lightbox.classList.contains("is-open")) close();
    });
  }

  function initMasterplan() {
    document.querySelectorAll("[data-masterplan-grid]").forEach((grid) => {
      const detail =
        grid.closest(".masterplan__layout")?.querySelector("[data-masterplan-detail]") ||
        document.querySelector("[data-masterplan-detail]");
      if (!detail) return;

    const parcels = [
      { id: "A1", status: "sold", area: "820 m²", price: null },
      { id: "A2", status: "sold", area: "750 m²", price: null },
      { id: "A3", status: "reserved", area: "900 m²", price: "1.285.000 Kč" },
      { id: "A4", status: "available", area: "1 050 m²", price: "1.442.000 Kč" },
      { id: "A5", status: "available", area: "980 m²", price: "1.385.000 Kč" },
      { id: "A6", status: "sold", area: "700 m²", price: null },
      { id: "B1", status: "sold", area: "860 m²", price: null },
      { id: "B2", status: "available", area: "1 120 m²", price: "1.555.950 Kč" },
      { id: "B3", status: "available", area: "940 m²", price: "1.320.000 Kč" },
      { id: "B4", status: "reserved", area: "880 m²", price: "1.260.000 Kč" },
      { id: "B5", status: "sold", area: "720 m²", price: null },
      { id: "B6", status: "available", area: "1 000 m²", price: "1.410.000 Kč" },
      { id: "C1", status: "sold", area: "800 m²", price: null },
      { id: "C2", status: "available", area: "1 180 m²", price: "1.620.000 Kč" },
      { id: "C3", status: "sold", area: "690 m²", price: null },
      { id: "C4", status: "available", area: "920 m²", price: "1.295.000 Kč" },
      { id: "C5", status: "reserved", area: "850 m²", price: "1.240.000 Kč" },
      { id: "C6", status: "sold", area: "760 m²", price: null },
    ];

    const statusLabel = {
      available: "Volný",
      reserved: "Rezervováno",
      sold: "Prodáno",
    };

    function renderDetail(parcel) {
      detail.innerHTML = `
        <p class="eyebrow">Parcela ${parcel.id}</p>
        <h3 class="masterplan__detail-title">${statusLabel[parcel.status]}</h3>
        <p class="masterplan__detail-meta">Plocha: ${parcel.area}<br>Puerto Jiménez · hlídaný areál</p>
        ${
          parcel.price
            ? `<p class="masterplan__detail-price">od ${parcel.price}</p>
               <a href="#kontakt" class="btn btn--primary btn--sm" style="margin-top:1rem">Mám zájem</a>`
            : `<p class="masterplan__detail-meta" style="margin-top:1rem">Tato parcela je již prodána. Vyberte volný pozemek v mapě.</p>`
        }
      `;
    }

    parcels.forEach((parcel) => {
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = `masterplan__parcel is-${parcel.status}`;
      cell.title = `Parcela ${parcel.id} – ${statusLabel[parcel.status]}`;
      cell.setAttribute("aria-label", `Parcela ${parcel.id}, ${statusLabel[parcel.status]}`);
      cell.addEventListener("click", () => renderDetail(parcel));
      grid.appendChild(cell);
    });

    const firstAvailable = parcels.find((p) => p.status === "available");
    renderDetail(firstAvailable || parcels[0]);
    });
  }

  function initLeadForm() {
    const form = document.querySelector("[data-lead-form]");
    const success = document.querySelector("[data-form-success]");
    if (!form || !success) return;

    const interestGroup = form.querySelector("[data-interest-group]");
    const interestInputs = form.querySelectorAll('input[name="interest"]');

    interestInputs.forEach((input) => {
      input.addEventListener("change", () => {
        interestGroup?.classList.remove("is-invalid");
      });
    });

    form.addEventListener("submit", (event) => {
      const hasInterest = form.querySelector('input[name="interest"]:checked');
      if (!hasInterest) {
        event.preventDefault();
        interestGroup?.classList.add("is-invalid");
        interestGroup?.scrollIntoView({ block: "nearest", behavior: "smooth" });
        return;
      }

      if (!form.checkValidity()) {
        event.preventDefault();
        form.reportValidity();
        return;
      }
      event.preventDefault();
      form.hidden = true;
      success.classList.add("is-visible");
    });
  }

  function initCalculator() {
    const investSlider = document.querySelector("[data-invest-slider]");
    const roiSlider = document.querySelector("[data-roi-slider]");
    const investDisplay = document.querySelector("[data-invest-display]");
    const roiDisplay = document.querySelector("[data-roi-display]");
    const roiRateDisplay = document.querySelector("[data-roi-rate]");
    if (!investSlider || !roiSlider || !investDisplay || !roiDisplay) return;

    const update = () => {
      const millions = Number(investSlider.value);
      const roiPercent = Number(roiSlider.value);
      const roiRate = roiPercent / 100;
      const amount = millions * 1_000_000;

      investDisplay.textContent =
        millions < 1
          ? amount.toLocaleString("cs-CZ") + " Kč"
          : millions.toFixed(1).replace(".", ",") + " mil. Kč";
      roiDisplay.textContent =
        Math.round(amount * roiRate).toLocaleString("cs-CZ") + " Kč";

      if (roiRateDisplay) roiRateDisplay.textContent = String(roiPercent);
      roiSlider.setAttribute("aria-valuenow", String(roiPercent));
    };

    investSlider.addEventListener("input", update);
    roiSlider.addEventListener("input", update);
    update();
  }

  function formatInvestMin() {
    document.querySelectorAll("[data-invest-min]").forEach((el) => {
      el.textContent = INVEST_MIN.toLocaleString("cs-CZ") + " Kč";
    });
  }

  function initVillaCarousels() {
    const pauseMs = 3000;
    const scrollMs = 2000;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    document.querySelectorAll("[data-villa-carousel]").forEach((media) => {
      const galleryId = media.getAttribute("data-villa-carousel");
      const images = VILLA_GALLERIES[galleryId];
      if (!images?.length) return;

      const existingImg = media.querySelector(".villa-card__img");
      const altLabel = existingImg?.alt || `Vila ${galleryId}`;

      if (prefersReducedMotion || images.length <= 1) {
        if (!existingImg) {
          const img = document.createElement("img");
          img.src = images[0];
          img.alt = altLabel;
          img.className = "villa-card__img";
          img.width = 800;
          img.height = 600;
          img.loading = "lazy";
          img.setAttribute("data-villa-gallery", galleryId);
          img.setAttribute("data-villa-index", "0");
          media.appendChild(img);
        }
        return;
      }

      const track = document.createElement("div");
      track.className = "villa-card__track";
      const slideSources = [...images, images[0]];

      slideSources.forEach((src, slideIndex) => {
        const img = document.createElement("img");
        img.src = src;
        img.alt = altLabel;
        img.className = "villa-card__img";
        img.width = 800;
        img.height = 600;
        img.loading = slideIndex === 0 ? "eager" : "lazy";
        img.decoding = "async";
        img.draggable = false;
        img.setAttribute("data-villa-gallery", galleryId);
        img.setAttribute(
          "data-villa-index",
          String(slideIndex < images.length ? slideIndex : 0)
        );
        track.appendChild(img);
      });

      media.innerHTML = "";
      media.appendChild(track);
      media.style.setProperty("--villa-carousel-scroll-ms", `${scrollMs}ms`);

      let index = 0;
      let paused = false;
      let timeoutId = null;
      const lastSlideIndex = images.length;

      const setPosition = (nextIndex, animate) => {
        track.style.transition = animate
          ? `transform var(--villa-carousel-scroll-ms, 2s) ease-in-out`
          : "none";
        track.style.transform = `translate3d(-${nextIndex * 100}%, 0, 0)`;
        index = nextIndex;
      };

      const clearTimer = () => {
        if (timeoutId) {
          window.clearTimeout(timeoutId);
          timeoutId = null;
        }
      };

      const holdThenScroll = () => {
        if (paused) return;
        clearTimer();
        timeoutId = window.setTimeout(() => {
          const next = index + 1;
          setPosition(next, true);

          const onScrollEnd = (event) => {
            if (event.propertyName !== "transform") return;
            track.removeEventListener("transitionend", onScrollEnd);

            if (index === lastSlideIndex) {
              setPosition(0, false);
            }

            holdThenScroll();
          };

          track.addEventListener("transitionend", onScrollEnd);
        }, pauseMs);
      };

      const pause = () => {
        paused = true;
        clearTimer();
      };

      const resume = () => {
        if (!paused) return;
        paused = false;
        holdThenScroll();
      };

      setPosition(0, false);
      holdThenScroll();

      media.addEventListener("mouseenter", pause);
      media.addEventListener("mouseleave", resume);
      media.addEventListener("focusin", pause);
      media.addEventListener("focusout", (event) => {
        if (!media.contains(event.relatedTarget)) resume();
      });
    });
  }

  function initImageLightbox() {
    const lightbox = document.querySelector("[data-image-lightbox]");
    if (!lightbox) return;

    const img = lightbox.querySelector("[data-image-img]");
    const closeBtn = lightbox.querySelector("[data-image-close]");
    const backdrop = lightbox.querySelector("[data-image-backdrop]");
    const prevBtn = lightbox.querySelector("[data-image-prev]");
    const nextBtn = lightbox.querySelector("[data-image-next]");

    let currentSlides = [];
    let currentIndex = 0;

    const showSlide = (index) => {
      currentIndex = index;
      const slide = currentSlides[currentIndex];
      img.src = slide.src;
      img.alt = slide.alt;
    };

    const openSlides = (slides, index) => {
      if (!slides.length) return;
      currentSlides = slides;
      showSlide(Math.max(0, Math.min(index, slides.length - 1)));
      lightbox.classList.add("is-open");
      lightbox.setAttribute("aria-hidden", "false");
      document.body.classList.add("is-lightbox-open");
    };

    const close = () => {
      lightbox.classList.remove("is-open");
      lightbox.setAttribute("aria-hidden", "true");
      document.body.classList.remove("is-lightbox-open");
    };

    const step = (dir) => {
      if (!currentSlides.length) return;
      showSlide((currentIndex + dir + currentSlides.length) % currentSlides.length);
    };

    closeBtn?.addEventListener("click", close);
    backdrop?.addEventListener("click", close);
    prevBtn?.addEventListener("click", () => step(-1));
    nextBtn?.addEventListener("click", () => step(1));

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && lightbox.classList.contains("is-open")) close();
      if (!lightbox.classList.contains("is-open")) return;
      if (event.key === "ArrowLeft") step(-1);
      if (event.key === "ArrowRight") step(1);
    });

    document.querySelectorAll("[data-villa-gallery]").forEach((thumb) => {
      thumb.style.cursor = "zoom-in";
      thumb.addEventListener("click", (event) => {
        event.preventDefault();
        const galleryId = thumb.getAttribute("data-villa-gallery");
        const list = VILLA_GALLERIES[galleryId];
        if (!list?.length) return;
        const slides = list.map((src) => ({
          src,
          alt: `Fotka vily ${galleryId}`,
        }));
        openSlides(slides, Number(thumb.getAttribute("data-villa-index") || "0"));
      });
    });

    document.querySelectorAll(".team-carousel--events").forEach((carousel) => {
      const count = Number(carousel.dataset.eventCount || 0);
      if (!count) return;

      const track = carousel.querySelector("[data-team-carousel-track]");
      if (!track) return;

      const slides = [...track.querySelectorAll(".event-photo")]
        .slice(0, count)
        .map((figure) => {
          const photo = figure.querySelector("img");
          return {
            src: photo.getAttribute("src"),
            alt: photo.alt || "Fotka ze setkání investorů",
          };
        });

      carousel.addEventListener("click", (event) => {
        const figure = event.target.closest(".event-photo");
        if (!figure) return;

        const figures = [...track.querySelectorAll(".event-photo")];
        const index = figures.indexOf(figure);
        if (index < 0) return;

        event.preventDefault();
        openSlides(slides, index % slides.length);
      });
    });
  }

  function initTeamCardsOverlay() {
    const closeOverlay = (overlay, openBtn) => {
      overlay.classList.remove("is-open");
      overlay.setAttribute("aria-hidden", "true");
      if (!document.querySelector(".team-cards-overlay.is-open")) {
        document.body.classList.remove("is-team-cards-overlay-open");
      }
      openBtn?.focus();
    };

    document.querySelectorAll("[data-team-cards-open]").forEach((openBtn) => {
      const overlayId = openBtn.getAttribute("data-team-cards-open");
      const overlay = overlayId ? document.getElementById(overlayId) : null;
      if (!overlay) return;

      const closeBtn = overlay.querySelector("[data-team-cards-close]");
      const backdrop = overlay.querySelector("[data-team-cards-backdrop]");

      const open = () => {
        document.querySelectorAll(".team-cards-overlay.is-open").forEach((openOverlay) => {
          if (openOverlay !== overlay) {
            openOverlay.classList.remove("is-open");
            openOverlay.setAttribute("aria-hidden", "true");
          }
        });
        overlay.classList.add("is-open");
        overlay.setAttribute("aria-hidden", "false");
        document.body.classList.add("is-team-cards-overlay-open");
        closeBtn?.focus();
      };

      const close = () => closeOverlay(overlay, openBtn);

      openBtn.addEventListener("click", open);
      closeBtn?.addEventListener("click", close);
      backdrop?.addEventListener("click", close);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      const openOverlay = document.querySelector(".team-cards-overlay.is-open");
      if (!openOverlay) return;
      const openBtn = document.querySelector(`[data-team-cards-open="${openOverlay.id}"]`);
      closeOverlay(openOverlay, openBtn);
    });
  }

  function initTeamCarousel() {
    const carousels = document.querySelectorAll("[data-team-carousel]");
    if (!carousels.length) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const secondsPerCard = 9;

    carousels.forEach((carousel) => {
      const track = carousel.querySelector("[data-team-carousel-track]");
      if (!track) return;

      const cards = [...track.children].filter((node) =>
        node.matches(".founder-card, .event-photo")
      );
      if (cards.length <= 1) return;

      if (carousel.classList.contains("team-carousel--events")) {
        carousel.dataset.eventCount = String(cards.length);
      }

      if (prefersReducedMotion) {
        carousel.classList.add("team-carousel--static");
        return;
      }

      cards.forEach((card) => track.appendChild(card.cloneNode(true)));

      track.style.setProperty(
        "--team-carousel-duration",
        `${cards.length * secondsPerCard}s`
      );
    });
  }

  function initReferencesCarousel() {
    const carousel = document.querySelector("[data-references-carousel]");
    if (!carousel) return;

    const slides = [...carousel.querySelectorAll("[data-reference-slide]")];
    const dots = [...carousel.querySelectorAll("[data-reference-dot]")];
    const prevBtn = carousel.querySelector("[data-reference-prev]");
    const nextBtn = carousel.querySelector("[data-reference-next]");
    if (slides.length <= 1) return;

    const INTERVAL_MS = 10000;
    let index = 0;
    let timer = null;

    const goTo = (nextIndex) => {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach((slide, i) => {
        const active = i === index;
        slide.classList.toggle("is-active", active);
        slide.setAttribute("aria-hidden", active ? "false" : "true");
      });
      dots.forEach((dot, i) => {
        const active = i === index;
        dot.classList.toggle("is-active", active);
        dot.setAttribute("aria-selected", active ? "true" : "false");
      });
    };

    const step = (dir) => {
      goTo(index + dir);
      startTimer();
    };

    const startTimer = () => {
      if (timer) window.clearInterval(timer);
      timer = window.setInterval(() => goTo(index + 1), INTERVAL_MS);
    };

    const stopTimer = () => {
      if (timer) window.clearInterval(timer);
      timer = null;
    };

    prevBtn?.addEventListener("click", () => step(-1));
    nextBtn?.addEventListener("click", () => step(1));

    dots.forEach((dot, i) => {
      dot.addEventListener("click", () => {
        goTo(i);
        startTimer();
      });
    });

    carousel.addEventListener("mouseenter", stopTimer);
    carousel.addEventListener("mouseleave", startTimer);
    carousel.addEventListener("focusin", stopTimer);
    carousel.addEventListener("focusout", (event) => {
      if (!carousel.contains(event.relatedTarget)) startTimer();
    });

    carousel.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        step(-1);
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        step(1);
      }
    });

    goTo(0);
    startTimer();
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function initBlogOverlay() {
    const openBtns = document.querySelectorAll("[data-blog-open]");
    const posts = window.BLOG_POSTS;
    const contentBySlug = window.BLOG_CONTENT || {};
    if (!openBtns.length || !Array.isArray(posts) || !posts.length) return;

    const overlay = document.createElement("div");
    overlay.className = "blog-overlay";
    overlay.setAttribute("data-blog-overlay", "");
    overlay.setAttribute("aria-hidden", "true");
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "Blog");

    const cards = posts
      .map((post) => {
        const image = post.image
          ? `<img src="${escapeHtml(post.image)}" alt="" class="blog-overlay__card-img" loading="lazy" decoding="async">`
          : "";
        return `
          <article class="blog-overlay__card">
            <button type="button" class="blog-overlay__card-link" data-blog-slug="${escapeHtml(post.slug)}">
              ${image}
              <div class="blog-overlay__card-body">
                <time class="blog-overlay__card-date" datetime="${escapeHtml(post.date)}">${escapeHtml(post.date)}</time>
                <h3 class="blog-overlay__card-title">${escapeHtml(post.title)}</h3>
              </div>
            </button>
          </article>
        `;
      })
      .join("");

    overlay.innerHTML = `
      <div class="blog-overlay__backdrop" data-blog-backdrop></div>
      <div class="blog-overlay__panel">
        <div class="blog-overlay__header">
          <div class="blog-overlay__header-start">
            <button type="button" class="blog-overlay__back" data-blog-back aria-label="Zpět na seznam článků">← Zpět</button>
            <h2 class="blog-overlay__title" data-blog-heading>Blog</h2>
          </div>
          <button type="button" class="blog-overlay__close" data-blog-close aria-label="Zavřít blog">×</button>
        </div>
        <div class="blog-overlay__scroll" data-blog-scroll>
          <div class="blog-overlay__list" data-blog-list>${cards}</div>
          <article class="blog-overlay__article" data-blog-article>
            <time class="blog-overlay__article-date" data-blog-article-date></time>
            <h3 class="blog-overlay__article-title" data-blog-article-title></h3>
            <div class="blog-overlay__article-body" data-blog-article-body></div>
          </article>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const closeBtn = overlay.querySelector("[data-blog-close]");
    const backBtn = overlay.querySelector("[data-blog-back]");
    const backdrop = overlay.querySelector("[data-blog-backdrop]");
    const listEl = overlay.querySelector("[data-blog-list]");
    const articleDateEl = overlay.querySelector("[data-blog-article-date]");
    const articleTitleEl = overlay.querySelector("[data-blog-article-title]");
    const articleBodyEl = overlay.querySelector("[data-blog-article-body]");
    const scrollEl = overlay.querySelector("[data-blog-scroll]");

    function showList() {
      overlay.classList.remove("blog-overlay--article");
      articleBodyEl.innerHTML = "";
      scrollEl.scrollTop = 0;
    }

    function normalizeArticleLinks(root) {
      const routeMap = {
        "/prehled-nemovitosti": "/projekty-pozemky",
        "/kontakty": "/kontakt",
        "/investice": "/investicni-program",
        "/o-nas": "/kontakt",
        "/zivot-na-kostarice": "/blog/zivot-na-kostarice-rezidentura-od-a-do-z",
        "/jungle-park-monterrey": "/projekty-pozemky",
      };

      const legacyPostMap = {
        "/post/osa-experience-cesta-za-jedinečnými-zážitky-na-poloostrově-osa":
          "/blog/osa-experience-cesta-za-jedinecnymi-zazitky-na-poloostrove-osa",
        "/post/správa-blogu-přímo-z-vašich-stránek": "/kontakt",
      };

      root.querySelectorAll("a[href]").forEach((link) => {
        let href = link.getAttribute("href");
        if (!href || /^https?:/i.test(href)) return;

        let path = href.split(/[#?]/)[0];
        const suffix = href.slice(path.length);

        try {
          const decoded = decodeURIComponent(path);
          if (decoded !== path) path = decoded;
        } catch {
          /* ponechat původní path */
        }

        if (legacyPostMap[path]) path = legacyPostMap[path];
        else if (path.startsWith("/post/")) {
          const blogSlug = `/blog/${path.slice("/post/".length)}`;
          if (contentBySlug[blogSlug]) path = blogSlug;
        }

        if (routeMap[path]) path = routeMap[path];

        const nextHref = path + suffix;
        link.setAttribute("href", nextHref);
        link.removeAttribute("target");

        const finalPath = nextHref.split(/[#?]/)[0];
        if (finalPath.startsWith("/blog/") && contentBySlug[finalPath]) {
          link.addEventListener("click", (event) => {
            event.preventDefault();
            const post = posts.find((item) => item.slug === finalPath);
            if (post) showArticle(post);
          });
          return;
        }

        link.addEventListener("click", () => close());
      });
    }

    function showArticle(post) {
      const html = contentBySlug[post.slug];
      if (!html) {
        articleDateEl.textContent = post.date;
        articleDateEl.dateTime = post.date;
        articleTitleEl.textContent = post.title;
        articleBodyEl.innerHTML = "<p>Obsah článku se nepodařilo načíst.</p>";
        overlay.classList.add("blog-overlay--article");
        scrollEl.scrollTop = 0;
        backBtn.focus();
        return;
      }

      articleDateEl.textContent = post.date;
      articleDateEl.dateTime = post.date;
      articleTitleEl.textContent = post.title;
      articleBodyEl.innerHTML = html;
      normalizeArticleLinks(articleBodyEl);

      overlay.classList.add("blog-overlay--article");
      scrollEl.scrollTop = 0;
      backBtn.focus();
    }

    function open() {
      showList();
      overlay.classList.add("is-open");
      overlay.setAttribute("aria-hidden", "false");
      document.body.classList.add("is-blog-overlay-open");
      closeBtn.focus();
    }

    function close() {
      showList();
      overlay.classList.remove("is-open");
      overlay.setAttribute("aria-hidden", "true");
      document.body.classList.remove("is-blog-overlay-open");
    }

    openBtns.forEach((btn) => {
      btn.addEventListener("click", (event) => {
        event.preventDefault();
        open();
      });
    });

    listEl.addEventListener("click", (event) => {
      const card = event.target.closest("[data-blog-slug]");
      if (!card) return;
      event.preventDefault();
      const slug = card.getAttribute("data-blog-slug");
      const post = posts.find((item) => item.slug === slug);
      if (post) showArticle(post);
    });

    backBtn.addEventListener("click", showList);
    closeBtn.addEventListener("click", close);
    backdrop.addEventListener("click", close);

    document.addEventListener("keydown", (event) => {
      if (!overlay.classList.contains("is-open")) return;
      if (event.key === "Escape") {
        if (overlay.classList.contains("blog-overlay--article")) {
          showList();
          return;
        }
        close();
      }
    });
  }

  const COSTA_MAP_VIEWBOX = { width: 1024, height: 887 };

  function getMarkerPoint(markerEl) {
    const hit = markerEl.querySelector(".hp-map__hit");
    if (!hit) return { x: 512, y: 444 };

    return {
      x: parseFloat(hit.getAttribute("cx")),
      y: parseFloat(hit.getAttribute("cy")),
    };
  }

  function renderCostaMapTooltip(tooltip, data) {
    tooltip.replaceChildren();

    if (data.title) {
      const title = document.createElement("strong");
      title.className = "rocket__map-tooltip-title";
      title.textContent = data.title;
      tooltip.appendChild(title);
    }

    const lines = Array.isArray(data.lines)
      ? data.lines
      : String(data.text || "").split("\n").filter(Boolean);

    const text = document.createElement("div");
    text.className = "rocket__map-tooltip-text";
    lines.forEach((line) => {
      const row = document.createElement("span");
      row.className = "rocket__map-tooltip-line";
      row.textContent = line;
      text.appendChild(row);
    });
    tooltip.appendChild(text);
  }

  async function initCostaMapCanvas(canvas, copy) {
    const objectEl = canvas.querySelector("object.rocket__map-overlay[data]");
    if (!objectEl) return;

    let svg;
    try {
      const response = await fetch(objectEl.getAttribute("data"));
      if (!response.ok) return;
      const doc = new DOMParser().parseFromString(await response.text(), "image/svg+xml");
      svg = doc.documentElement;
    } catch {
      return;
    }

    svg.classList.add("rocket__map-overlay");
    svg.setAttribute("aria-label", "Interaktivní body rozvoje na mapě Kostariky");
    svg.removeAttribute("aria-hidden");
    objectEl.replaceWith(svg);

    let tooltip = canvas.querySelector(".rocket__map-tooltip");
    if (!tooltip) {
      tooltip = document.createElement("div");
      tooltip.className = "rocket__map-tooltip";
      tooltip.setAttribute("role", "tooltip");
      canvas.appendChild(tooltip);
    }

    let activeMarker = null;

    const hideTooltip = () => {
      tooltip.classList.remove("is-visible", "rocket__map-tooltip--below");
      tooltip.hidden = true;
      activeMarker?.classList.remove("is-hovered");
      activeMarker = null;
    };

    const showTooltip = (markerEl, id) => {
      const data = copy[id];
      if (!data) return;

      if (activeMarker !== markerEl) {
        activeMarker?.classList.remove("is-hovered");
        activeMarker = markerEl;
        markerEl.classList.add("is-hovered");
      }

      const point = getMarkerPoint(markerEl);
      renderCostaMapTooltip(tooltip, data);
      tooltip.style.left = `${(point.x / COSTA_MAP_VIEWBOX.width) * 100}%`;
      tooltip.style.top = `${(point.y / COSTA_MAP_VIEWBOX.height) * 100}%`;
      tooltip.hidden = false;
      tooltip.classList.toggle("rocket__map-tooltip--below", point.y < 120);
      requestAnimationFrame(() => tooltip.classList.add("is-visible"));
    };

    svg.querySelectorAll("[data-marker]").forEach((markerEl) => {
      const id = markerEl.getAttribute("data-marker");
      if (!copy[id]) return;

      markerEl.addEventListener("mouseenter", () => showTooltip(markerEl, id));
      markerEl.addEventListener("mouseleave", hideTooltip);
      markerEl.addEventListener("focus", () => showTooltip(markerEl, id));
      markerEl.addEventListener("blur", hideTooltip);
      markerEl.addEventListener("click", (event) => {
        event.preventDefault();
        if (activeMarker === markerEl && tooltip.classList.contains("is-visible")) {
          hideTooltip();
          return;
        }
        showTooltip(markerEl, id);
      });
    });

    canvas.addEventListener("mouseleave", hideTooltip);
    document.addEventListener("click", (event) => {
      if (!canvas.contains(event.target)) hideTooltip();
    });
  }

  function initCostaMap() {
    const copy = window.COSTA_MAP_MARKERS;
    if (!copy) return;

    document.querySelectorAll(".rocket__map-canvas").forEach((canvas) => {
      initCostaMapCanvas(canvas, copy);
    });
  }

  initNav();
  initKontaktFormLinks();
  initHashScroll();
  initHeroVideo();
  initVideoLightbox();
  initMasterplan();
  initLeadForm();
  initCalculator();
  initVillaCarousels();
  initTeamCarousel();
  initTeamCardsOverlay();
  initImageLightbox();
  initReferencesCarousel();
  initBlogOverlay();
  initCostaMap();
  formatInvestMin();
})();
