// assets/js/carousel.js
(function () {
  const DEFAULTS = {
    intervalMs: 2800,
    transitionMs: 520,
    pauseOnHover: true,
  };

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function el(tag, cls) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    return n;
  }

  function showFallback(carouselRoot) {
    // Busca el fallback hermano dentro del mismo appCard__media
    const media = carouselRoot.closest(".appCard__media");
    if (!media) return;
    media.classList.add("appCard__media--fallback");
    const fb = $(".appCard__mediaFallback", media);
    if (fb) fb.style.display = "block";
  }

  function buildCarousel(root, images, opts) {
    if (!images || images.length === 0) {
      showFallback(root);
      return;
    }

    const viewport = el("div", "carousel__viewport");
    const track = el("div", "carousel__track");
    viewport.appendChild(track);
    root.appendChild(viewport);

    // Loop infinito clásico: [last, ...images, first]
    const looped = [images[images.length - 1], ...images, images[0]];

    looped.forEach((src) => {
      const slide = el("div", "carousel__slide");
      const img = document.createElement("img");
      img.loading = "lazy";
      img.alt = "App screenshot";
      img.src = src;

      // Si alguna imagen falla, la removemos y si queda sin nada, fallback.
      img.addEventListener("error", () => {
        slide.remove();
        // Si ya no hay suficientes slides reales, mostramos fallback.
        const remaining = track.querySelectorAll(".carousel__slide").length;
        if (remaining <= 2) showFallback(root); // quedan solo clones o nada útil
      });

      slide.appendChild(img);
      track.appendChild(slide);
    });

    let index = 1; // arrancamos en la primera real
    let timer = null;
    let isAnimating = false;

    function applyTransition(enabled) {
      track.style.transition = enabled
        ? `transform ${opts.transitionMs}ms ease`
        : "none";
    }

    function goTo(i, animate) {
      if (isAnimating && animate) return;
      isAnimating = !!animate;

      applyTransition(animate);
      track.style.transform = `translateX(-${i * 100}%)`;

      if (animate) {
        window.setTimeout(() => {
          isAnimating = false;

          // Si caímos en el clon final, saltamos sin animación al primero real
          if (i === images.length + 1) {
            index = 1;
            goTo(index, false);
          }

          // Si caímos en el clon inicial, saltamos al último real
          if (i === 0) {
            index = images.length;
            goTo(index, false);
          }
        }, opts.transitionMs + 30);
      }
    }

    function next() {
      index += 1;
      goTo(index, true);
    }

    function start() {
      stop();
      timer = window.setInterval(next, opts.intervalMs);
    }

    function stop() {
      if (timer) window.clearInterval(timer);
      timer = null;
    }

    // Init posición
    goTo(index, false);
    start();

    if (opts.pauseOnHover) {
      root.addEventListener("mouseenter", stop);
      root.addEventListener("mouseleave", start);
      root.addEventListener("focusin", stop);
      root.addEventListener("focusout", start);
    }

    // Si la pestaña no está visible, frenamos para no consumir recursos.
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stop();
      else start();
    });
  }

  function initAll() {
    const galleries = window.GLOMBA_GALLERIES || {};
    const nodes = document.querySelectorAll(".carousel[data-gallery]");
    nodes.forEach((root) => {
      const key = root.getAttribute("data-gallery");
      const images = galleries[key];

      // Evita doble init si recargás scripts
      if (root.__glombaCarouselInited) return;
      root.__glombaCarouselInited = true;

      buildCarousel(root, images, DEFAULTS);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll);
  } else {
    initAll();
  }
})();
