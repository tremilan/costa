(function () {
  const STATUS = {
    available: "K dispozici",
    reserved: "Rezervováno",
    sold: "Prodáno",
  };

  const ZOOM_MIN = 1;
  const ZOOM_MAX = 3;
  const ZOOM_STEP = 0.25;

  function formatPrice(value) {
    return value.toLocaleString("cs-CZ") + " Kč";
  }

  function parsePoints(pointsString) {
    return pointsString
      .trim()
      .split(/\s+/)
      .map((pair) => {
        const [x, y] = pair.split(",").map(Number);
        return { x, y };
      });
  }

  function pointInPolygon(x, y, points) {
    let inside = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const xi = points[i].x;
      const yi = points[i].y;
      const xj = points[j].x;
      const yj = points[j].y;
      const intersects = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
      if (intersects) inside = !inside;
    }
    return inside;
  }

  function expandPoints(points, factor) {
    const cx = points.reduce((sum, point) => sum + point.x, 0) / points.length;
    const cy = points.reduce((sum, point) => sum + point.y, 0) / points.length;
    return points.map((point) => ({
      x: cx + (point.x - cx) * factor,
      y: cy + (point.y - cy) * factor,
    }));
  }

  function findParcelAtPoint(x, y, shapeData) {
    const entries = Object.entries(shapeData.parcels);
    for (const [id, pointsString] of entries) {
      if (pointInPolygon(x, y, parsePoints(pointsString))) return id;
    }
    for (const [id, pointsString] of entries) {
      if (pointInPolygon(x, y, expandPoints(parsePoints(pointsString), 1.4))) return id;
    }
    return null;
  }

  function renderPopoverContent(parcel) {
    const priceRow =
      parcel.status === "available"
        ? `<div class="parcel-popover__row">
          <dt>Cena</dt>
          <dd>${parcel.price ? `od ${formatPrice(parcel.price)}` : "–"}</dd>
        </div>`
        : "";

    return `
      <p class="parcel-popover__title"><span class="parcel-popover__id">${parcel.id}</span> ${parcel.name}</p>
      <dl class="parcel-popover__meta">
        <div class="parcel-popover__row">
          <dt>Dostupnost</dt>
          <dd><span class="parcel-popover__status is-${parcel.status}">${STATUS[parcel.status]}</span></dd>
        </div>
        <div class="parcel-popover__row">
          <dt>Plocha</dt>
          <dd>${parcel.area}</dd>
        </div>
        ${priceRow}
      </dl>
      ${
        parcel.status === "available"
          ? `<a href="/kontakt#kontakt-form" class="btn btn--primary btn--sm parcel-popover__cta">Mám zájem</a>`
          : ""
      }
    `;
  }

  function renderSvgOverlay(parcels, shapeData) {
    if (!shapeData) return "";

    const [vbW, vbH] = shapeData.viewBox;
    const byId = new Map(parcels.map((parcel) => [parcel.id, parcel]));

    const polygons = Object.entries(shapeData.parcels)
      .map(([id, points]) => {
        const parcel = byId.get(id);
        if (!parcel) return "";
        return `<polygon
          class="plan-map__parcel is-${parcel.status}"
          data-parcel-id="${id}"
          points="${points}"
          tabindex="-1"
          aria-hidden="true"
        ></polygon>`;
      })
      .join("");

    return `<svg class="plan-map__svg" viewBox="0 0 ${vbW} ${vbH}" preserveAspectRatio="none" aria-hidden="true">${polygons}</svg>`;
  }

  function repositionPopover(block) {
    const popover = block.querySelector("[data-parcel-popover]");
    const parcelId = block.dataset.selectedParcel;
    const map = block.querySelector(".plan-map");
    const viewport = block.querySelector("[data-plan-viewport]");
    if (!popover || !parcelId || popover.hidden || !map || !viewport) return;

    const polygon = block.querySelector(`.plan-map__parcel[data-parcel-id="${parcelId}"]`);
    if (!polygon) return;

    const mapRect = map.getBoundingClientRect();
    const viewportRect = viewport.getBoundingClientRect();
    const polyRect = polygon.getBoundingClientRect();
    const popoverWidth = popover.offsetWidth || 220;
    const popoverHeight = popover.offsetHeight || 140;
    const gap = 12;

    let left = polyRect.right - mapRect.left + gap;
    if (left + popoverWidth > mapRect.width - 8) {
      left = polyRect.left - mapRect.left - popoverWidth - gap;
    }
    left = Math.max(8, Math.min(left, mapRect.width - popoverWidth - 8));

    let top = polyRect.top - mapRect.top + polyRect.height / 2 - popoverHeight / 2;
    const viewportTop = viewportRect.top - mapRect.top;
    const viewportBottom = viewportTop + viewportRect.height;
    top = Math.max(viewportTop + 8, Math.min(top, viewportBottom - popoverHeight - 8));

    popover.style.left = `${Math.round(left)}px`;
    popover.style.top = `${Math.round(top)}px`;
  }

  function clearParcelHoverLift(block) {
    block.querySelectorAll(".plan-map__parcel.is-hover-lift").forEach((polygon) => {
      polygon.classList.remove("is-hover-lift");
    });
  }

  function hidePopover(block) {
    const popover = block.querySelector("[data-parcel-popover]");
    if (!popover) return;
    popover.hidden = true;
    delete block.dataset.selectedParcel;
    block.querySelectorAll(".plan-map__parcel.is-selected").forEach((polygon) => {
      polygon.classList.remove("is-selected");
    });
    clearParcelHoverLift(block);
  }

  function selectParcel(block, parcelId, parcelsById) {
    const parcel = parcelsById.get(parcelId);
    const popover = block.querySelector("[data-parcel-popover]");
    if (!parcel || !popover) return;

    if (block.dataset.selectedParcel === parcelId && !popover.hidden) {
      hidePopover(block);
      return;
    }

    block.dataset.selectedParcel = parcelId;
    popover.innerHTML = renderPopoverContent(parcel);
    popover.hidden = false;

    block.querySelectorAll(".plan-map__parcel").forEach((polygon) => {
      polygon.classList.toggle("is-selected", polygon.getAttribute("data-parcel-id") === parcelId);
    });

    clearParcelHoverLift(block);

    requestAnimationFrame(() => {
      repositionPopover(block);
      requestAnimationFrame(() => repositionPopover(block));
    });
  }

  function bindParcelHoverLift(block, svg) {
    const parcels = svg.querySelectorAll(".plan-map__parcel");
    if (!parcels.length) return;

    const liftOffAll = () => clearParcelHoverLift(block);

    parcels.forEach((polygon) => {
      polygon.addEventListener("pointerenter", () => {
        liftOffAll();
        polygon.classList.add("is-hover-lift");
        svg.appendChild(polygon);
      });
      polygon.addEventListener("pointerleave", () => {
        polygon.classList.remove("is-hover-lift");
      });
      polygon.addEventListener("pointercancel", () => {
        polygon.classList.remove("is-hover-lift");
      });
    });

    svg.addEventListener("pointerleave", liftOffAll);
  }

  function pickParcelAtEvent(event, svg, shapeData) {
    const polygon = event.target.closest?.(".plan-map__parcel");
    if (polygon) return polygon.getAttribute("data-parcel-id");

    if (!svg) return null;

    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;

    const svgPoint = point.matrixTransform(ctm.inverse());
    return findParcelAtPoint(svgPoint.x, svgPoint.y, shapeData);
  }

  function bindParcelInteractions(block, parcels, shapeData) {
    const parcelsById = new Map(parcels.map((parcel) => [String(parcel.id), parcel]));
    const map = block.querySelector(".plan-map");
    const svg = block.querySelector(".plan-map__svg");
    const viewport = block.querySelector("[data-plan-viewport]");
    let pointerDown = null;

    if (!map || !shapeData) return;

    map.addEventListener(
      "click",
      (event) => {
        const cta = event.target.closest("a.parcel-popover__cta");
        if (!cta) return;
        event.preventDefault();
        event.stopPropagation();
        window.location.assign(cta.getAttribute("href") || "/kontakt#kontakt-form");
      },
      true
    );

    function handleParcelSelect(event, parcelId) {
      const normalizedId = String(parcelId);
      if (!parcelsById.has(normalizedId)) return;
      event.preventDefault();
      event.stopPropagation();
      selectParcel(block, normalizedId, parcelsById);
    }

    if (svg) {
      bindParcelHoverLift(block, svg);
      svg.querySelectorAll(".plan-map__parcel").forEach((polygon) => {
        polygon.addEventListener("click", (event) => {
          const parcelId = polygon.getAttribute("data-parcel-id");
          if (!parcelId) return;
          handleParcelSelect(event, parcelId);
        });
      });
    }

    map.addEventListener("click", (event) => {
      if (event.target.closest(".plan-map__zoom, .parcel-popover, .plan-map__legend")) return;

      const parcelId = pickParcelAtEvent(event, svg, shapeData);
      if (parcelId) {
        handleParcelSelect(event, parcelId);
        return;
      }

      if (event.target.closest("[data-plan-viewport], [data-plan-stage], .plan-map__svg")) {
        hidePopover(block);
      }
    });

    if (viewport) {
      viewport.addEventListener("pointerdown", (event) => {
        pointerDown = { x: event.clientX, y: event.clientY };
      });

      viewport.addEventListener("pointerup", (event) => {
        if (!pointerDown) return;
        const moved =
          Math.abs(event.clientX - pointerDown.x) > 6 || Math.abs(event.clientY - pointerDown.y) > 6;
        pointerDown = null;
        if (moved) return;
        if (event.target.closest(".plan-map__zoom, .parcel-popover, .plan-map__legend")) return;

        const parcelId = pickParcelAtEvent(event, svg, shapeData);
        if (!parcelId) return;
        handleParcelSelect(event, parcelId);
      });

      viewport.addEventListener(
        "scroll",
        () => {
          repositionPopover(block);
        },
        { passive: true }
      );
    }

    window.addEventListener("resize", () => repositionPopover(block));
  }

  function initPlanZoom(block, onZoomChange) {
    const viewport = block.querySelector("[data-plan-viewport]");
    const img = block.querySelector(".plan-map__img");
    const zoomLabel = block.querySelector("[data-zoom-label]");
    if (!viewport || !img) return;

    let scale = 1;
    let fitWidth = 0;
    let lastAppliedWidth = 0;
    let dragging = false;
    let startX = 0;
    let startY = 0;
    let scrollLeft = 0;
    let scrollTop = 0;

    function measureFitWidth() {
      fitWidth = viewport.clientWidth;
      return fitWidth > 0;
    }

    function applyZoom() {
      if (!measureFitWidth()) return;
      const displayWidth = Math.round(fitWidth * scale);
      if (displayWidth === lastAppliedWidth && img.style.width) return;

      const naturalW = img.naturalWidth || fitWidth;
      const naturalH = img.naturalHeight || Math.round(fitWidth * 0.704);
      const displayHeight = Math.round((displayWidth * naturalH) / naturalW);
      const stage = block.querySelector("[data-plan-stage]");
      img.style.width = `${displayWidth}px`;
      img.style.height = `${displayHeight}px`;
      img.style.maxWidth = "none";
      if (stage) {
        stage.style.width = `${displayWidth}px`;
        stage.style.height = `${displayHeight}px`;
      }
      viewport.classList.toggle("is-zoomed", scale > 1);
      lastAppliedWidth = displayWidth;
      if (zoomLabel) {
        zoomLabel.textContent = `${Math.round(scale * 100)} %`;
      }
      if (onZoomChange) onZoomChange();
    }

    function setZoom(next) {
      scale = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, next));
      lastAppliedWidth = 0;
      applyZoom();
    }

    function init() {
      if (!measureFitWidth()) return;
      applyZoom();
    }

    function scheduleInit() {
      requestAnimationFrame(() => {
        init();
        requestAnimationFrame(init);
      });
    }

    if (img.complete) {
      scheduleInit();
    } else {
      img.addEventListener("load", scheduleInit, { once: true });
    }
    scheduleInit();

    if (typeof ResizeObserver !== "undefined") {
      const resizeObserver = new ResizeObserver(() => {
        const nextWidth = viewport.clientWidth;
        if (nextWidth > 0 && nextWidth !== fitWidth) {
          lastAppliedWidth = 0;
          applyZoom();
        }
      });
      resizeObserver.observe(viewport);
    }

    window.addEventListener("resize", () => {
      lastAppliedWidth = 0;
      applyZoom();
    });

    block.querySelectorAll("[data-zoom]").forEach((button) => {
      button.addEventListener("click", () => {
        const action = button.getAttribute("data-zoom");
        if (action === "in") setZoom(scale + ZOOM_STEP);
        if (action === "out") setZoom(scale - ZOOM_STEP);
        if (action === "reset") setZoom(1);
      });
    });

    viewport.addEventListener("mousedown", (event) => {
      if (scale <= 1) return;
      if (event.button !== 0) return;
      if (event.target.closest(".plan-map__parcel")) return;
      dragging = true;
      viewport.classList.add("is-dragging");
      startX = event.pageX;
      startY = event.pageY;
      scrollLeft = viewport.scrollLeft;
      scrollTop = viewport.scrollTop;
    });

    window.addEventListener("mouseup", () => {
      dragging = false;
      viewport.classList.remove("is-dragging");
    });

    viewport.addEventListener("mousemove", (event) => {
      if (!dragging) return;
      event.preventDefault();
      viewport.scrollLeft = scrollLeft - (event.pageX - startX);
      viewport.scrollTop = scrollTop - (event.pageY - startY);
    });
  }

  function renderProjectMapIntro(project) {
    const lines = project.mapIntro
      ? Array.isArray(project.mapIntro)
        ? project.mapIntro
        : [project.mapIntro]
      : [];
    const items = lines
      .map((line) => `<p class="project-plan-block__map-intro-line">${line}</p>`)
      .join("");
    const priceMarkup = project.fromPrice
      ? `<p class="project-plan-block__map-intro-line project-plan-block__map-intro-line--price">Pozemky od ${formatPrice(project.fromPrice)}</p>`
      : "";

    if (!items && !priceMarkup) return "";

    return `<div class="project-plan-block__map-intro">${items}${priceMarkup}</div>`;
  }

  function renderProjectIntro(project) {
    if (project.introPoints?.length) {
      const items = project.introPoints
        .map(
          (point) =>
            `<article class="step-card"><h4 class="step-card__title">${point.title}</h4><p class="step-card__text">${point.text}</p></article>`
        )
        .join("");
      return `<div class="invest-model__steps project-plan-block__steps">${items}</div>`;
    }

    if (!project.intro) return "";

    const singleLineClass = project.intro.length < 120 ? " project-plan-block__intro--single" : "";
    return `<p class="project-plan-block__intro${singleLineClass}">${project.intro}</p>`;
  }

  function renderVideoPosterMarkup(project) {
    if (project.videoPoster) {
      return `<img class="intro-video__poster" src="${project.videoPoster}" alt="" width="1280" height="720" decoding="async" loading="lazy">`;
    }

    if (project.video && /^[A-Za-z0-9_-]{11}$/.test(project.video)) {
      const base = `https://i.ytimg.com/vi/${project.video}`;
      return `<img class="intro-video__poster"
        src="${base}/maxresdefault.jpg"
        srcset="${base}/maxresdefault.jpg 1280w, ${base}/sddefault.jpg 640w, ${base}/hqdefault.jpg 480w"
        sizes="(min-width: 1200px) 72rem, 100vw"
        alt=""
        width="1280"
        height="720"
        decoding="async"
        loading="lazy"
        data-yt-fallback="${base}/hqdefault.jpg"
        onerror="if(!this.dataset.fellback){this.dataset.fellback='1';this.src=this.dataset.ytFallback}">`;
    }

    return "";
  }

  function renderProjectVideo(project) {
    if (!project.video) return "";

    const posterMarkup = renderVideoPosterMarkup(project);
    const label = `Přehrát video – ${project.title}`;
    const playIcon =
      '<span class="media-star__play intro-video__play" aria-hidden="true"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></span>';

    if (/^[A-Za-z0-9_-]{11}$/.test(project.video)) {
      return `<div class="project-plan-block__video intro-video__frame">
          ${posterMarkup}
          <button type="button" class="intro-video__trigger" data-video-open data-video-youtube="${project.video}" aria-label="${label}">
            ${playIcon}
          </button>
        </div>`;
    }

    return `<div class="project-plan-block__video intro-video__frame">
        ${posterMarkup}
        <button type="button" class="intro-video__trigger" data-video-open data-video-src="${project.video}" aria-label="${label}">
          ${playIcon}
        </button>
      </div>`;
  }

  function buildProject(key, project) {
    const article = document.createElement("article");
    article.className = "project-plan-block";
    article.dataset.projectId = key;

    const imageSrc = project.imageFull || project.image;
    const shapeData = window.PROJECT_PARCEL_SHAPES?.[key];
    const ratio =
      project.imageWidth && project.imageHeight
        ? `${project.imageWidth} / ${project.imageHeight}`
        : shapeData
          ? `${shapeData.viewBox[0]} / ${shapeData.viewBox[1]}`
          : "1866 / 1314";

    const introMarkup = renderProjectIntro(project);
    const videoMarkup = renderProjectVideo(project);
    const mapIntroMarkup = renderProjectMapIntro(project);

    article.innerHTML = `
      <div class="project-plan-block__header">
        <h2 class="heading-section project-plan-block__title">${project.title}</h2>
        ${introMarkup}
      </div>
      ${videoMarkup}
      ${mapIntroMarkup}
      <div class="project-plan-block__body">
        <div class="plan-map">
          <div class="plan-map__toolbar">
            <div class="plan-map__zoom" aria-label="Přiblížení plánu">
              <button type="button" class="plan-map__zoom-btn" data-zoom="out" aria-label="Oddálit">−</button>
              <span class="plan-map__zoom-label" data-zoom-label>100 %</span>
              <button type="button" class="plan-map__zoom-btn" data-zoom="in" aria-label="Přiblížit">+</button>
              <button type="button" class="plan-map__zoom-btn plan-map__zoom-btn--text" data-zoom="reset">Reset</button>
            </div>
          </div>
          <div class="plan-map__viewport" data-plan-viewport style="aspect-ratio: ${ratio}">
            <div class="plan-map__stage" data-plan-stage>
              <img src="${imageSrc}" alt="${project.imageAlt}" class="plan-map__img" decoding="async">
              ${renderSvgOverlay(project.parcels, shapeData)}
            </div>
          </div>
          <div class="parcel-popover" data-parcel-popover hidden aria-live="polite"></div>
          <div class="plan-map__legend">
            <span><i class="is-available"></i> K dispozici</span>
            <span><i class="is-reserved"></i> Rezervováno</span>
            <span><i class="is-sold"></i> Prodáno</span>
          </div>
        </div>
      </div>
    `;

    return article;
  }

  function initProjectParcels() {
    const root = document.querySelector("[data-project-parcels]");
    const data = window.PROJECT_PARCELS;
    if (!root || !data) return;

    if (!window.PROJECT_PARCEL_SHAPES) {
      root.innerHTML =
        '<p class="lead">Plány parcel se nepodařilo načíst. Otevřete stránku přes lokální server (<code>python3 serve.py</code>) na adrese <code>http://127.0.0.1:8000/projekty-pozemky</code> a obnovte prohlížeč.</p>';
      return;
    }

    Object.entries(data).forEach(([key, project]) => {
      const article = buildProject(key, project);
      root.appendChild(article);
      const shapeData = window.PROJECT_PARCEL_SHAPES?.[key];
      initPlanZoom(article, () => repositionPopover(article));
      bindParcelInteractions(article, project.parcels, shapeData);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initProjectParcels);
  } else {
    initProjectParcels();
  }
})();
