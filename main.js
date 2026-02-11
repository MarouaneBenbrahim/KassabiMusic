import { animate } from "./assets/vendor/anime.esm.min.js";

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const coarsePointer = window.matchMedia("(pointer: coarse)").matches;

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function runLoader() {
  document.body.classList.remove("is-loading");
  return Promise.resolve();
}

function initMenu() {
  const menuButton = $("#menu-btn");
  const nav = $("#main-nav");
  if (!menuButton || !nav) return;

  const closeMenu = () => {
    document.body.classList.remove("nav-open");
    menuButton.setAttribute("aria-expanded", "false");
  };

  menuButton.addEventListener("click", () => {
    const open = document.body.classList.toggle("nav-open");
    menuButton.setAttribute("aria-expanded", String(open));
  });

  $$('a[href^="#"]', nav).forEach((anchor) => {
    anchor.addEventListener("click", closeMenu);
  });

  document.addEventListener("click", (event) => {
    if (!document.body.classList.contains("nav-open")) return;
    if (!(event.target instanceof Node)) return;
    if (menuButton.contains(event.target) || nav.contains(event.target)) return;
    closeMenu();
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 980) closeMenu();
  });
}

function initScrollProgress() {
  const bar = $("#scroll-progress-fill");
  if (!bar) return;

  let raf = 0;

  const update = () => {
    raf = 0;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    bar.style.transform = `scaleX(${ratio})`;
  };

  const schedule = () => {
    if (raf) return;
    raf = requestAnimationFrame(update);
  };

  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule);
  schedule();
}

function initNavSpy() {
  const links = $$(".main-nav a");
  if (!links.length) return;

  const sections = links
    .map((link) => {
      const id = link.getAttribute("href");
      if (!id?.startsWith("#")) return null;
      return $(id);
    })
    .filter(Boolean);

  if (!sections.length) return;

  const setActive = (id) => {
    links.forEach((link) => {
      const active = link.getAttribute("href") === `#${id}`;
      link.classList.toggle("is-current", active);
    });
  };

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
      if (!visible.length) return;
      setActive(visible[0].target.id);
    },
    {
      threshold: [0.2, 0.4, 0.6],
      rootMargin: "-18% 0px -38%",
    }
  );

  sections.forEach((section) => observer.observe(section));
}

function initReveals() {
  const revealNodes = $$(".reveal");
  if (!revealNodes.length) return;

  if (prefersReducedMotion) {
    revealNodes.forEach((node) => node.classList.add("is-visible"));
    return;
  }

  const shouldRevealNow = (node) => node.getBoundingClientRect().top < window.innerHeight * 0.94;

  document.body.classList.add("motion-ready");

  revealNodes.forEach((node) => {
    if (shouldRevealNow(node)) node.classList.add("is-visible");
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const node = entry.target;
        observer.unobserve(node);

        node.classList.add("is-visible");
        animate(node, {
          opacity: [0, 1],
          translateY: [22, 0],
          duration: 820,
          ease: "outExpo",
        });
      });
    },
    {
      threshold: 0.18,
      rootMargin: "0px 0px -8%",
    }
  );

  revealNodes.forEach((node) => {
    if (node.classList.contains("is-visible")) return;
    observer.observe(node);
  });
}

function initIntro() {
  // Keep intro stable on all devices; section-level reveals handle motion.
}

function initEqualizer() {
  const bars = $$("#hero-eq .eq-bar");
  if (!bars.length) return;

  bars.forEach((bar) => {
    const speed = 620 + Math.round(Math.random() * 820);
    const delay = Math.round(Math.random() * 420);
    bar.style.setProperty("--eq-speed", `${speed}ms`);
    bar.style.setProperty("--eq-delay", `${delay}ms`);
  });
}

function initMagnetic() {
  // Intentionally disabled for performance consistency on all devices.
}

function initHeroSlider() {
  const stage = $("#hero-stage");
  const slides = $$(".hero-slide", stage);
  const thumbs = $$(".thumb", $("#hero-thumbs"));
  const tag = $("#hero-tag");
  const title = $("#hero-slide-title");
  const progress = $("#hero-progress");
  const prev = $("#hero-prev");
  const next = $("#hero-next");
  const play = $("#hero-play");

  if (!stage || !slides.length || !tag || !title || !progress || !prev || !next || !play) return;

  let index = 0;
  let timer = 0;
  let progressAnim = null;
  let pauseAutoplay = false;

  const autoplayMs = 6400;

  const wrap = (value) => {
    if (value >= slides.length) return 0;
    if (value < 0) return slides.length - 1;
    return value;
  };

  const updateHud = (slide) => {
    tag.textContent = slide.dataset.tag || "Highlight";
    title.textContent = slide.dataset.title || "Live Moment";

    play.dataset.video = slide.dataset.video || "";
    play.dataset.poster = slide.dataset.poster || "";
    play.dataset.title = `KASSABI | ${slide.dataset.tag || "Highlight"}`;
  };

  const animateProgress = () => {
    if (!progress) return;

    progressAnim?.pause();
    progress.style.transform = "scaleX(0)";

    if (prefersReducedMotion || pauseAutoplay || document.hidden) return;

    progressAnim = animate(progress, {
      scaleX: [0, 1],
      duration: autoplayMs,
      ease: "linear",
    });
  };

  const queueNext = () => {
    window.clearTimeout(timer);
    if (prefersReducedMotion || pauseAutoplay || document.hidden) return;

    timer = window.setTimeout(() => {
      setSlide(index + 1, true);
    }, autoplayMs);
  };

  const setSlide = (targetIndex, fromAuto = false) => {
    const nextIndex = wrap(targetIndex);
    if (nextIndex === index && !fromAuto) {
      animateProgress();
      queueNext();
      return;
    }

    const current = slides[index];
    const incoming = slides[nextIndex];

    slides.forEach((slide, slideIndex) => {
      if (slideIndex !== nextIndex) {
        slide.classList.remove("is-active");
        slide.setAttribute("aria-hidden", "true");
      }

      // Avoid stale inline transforms/opacity causing visual overlap.
      slide.style.opacity = "";
      slide.style.transform = "";
    });

    current.classList.remove("is-active");
    current.setAttribute("aria-hidden", "true");
    incoming.classList.add("is-active");
    incoming.setAttribute("aria-hidden", "false");

    if (!prefersReducedMotion) {
      animate([tag, title], {
        opacity: [0.2, 1],
        translateY: [8, 0],
        duration: 420,
        ease: "outExpo",
      });
    }

    thumbs.forEach((thumb) => {
      const active = Number(thumb.dataset.slide) === nextIndex;
      thumb.classList.toggle("is-active", active);
    });

    index = nextIndex;
    updateHud(incoming);
    animateProgress();
    queueNext();
  };

  prev.addEventListener("click", () => setSlide(index - 1));
  next.addEventListener("click", () => setSlide(index + 1));

  thumbs.forEach((thumb) => {
    thumb.addEventListener("click", () => {
      const target = Number(thumb.dataset.slide || "0");
      setSlide(target);
    });
  });

  let swipeStart = 0;

  stage.addEventListener("pointerdown", (event) => {
    swipeStart = event.clientX;
  });

  stage.addEventListener("pointerup", (event) => {
    const diff = event.clientX - swipeStart;
    if (Math.abs(diff) < 38) return;
    if (diff < 0) setSlide(index + 1);
    if (diff > 0) setSlide(index - 1);
  });

  if (!coarsePointer && !prefersReducedMotion) {
    stage.addEventListener("pointermove", (event) => {
      const activeImage = $(".hero-slide.is-active img", stage);
      if (!activeImage) return;

      const box = stage.getBoundingClientRect();
      const dx = ((event.clientX - box.left) / box.width - 0.5) * 22;
      const dy = ((event.clientY - box.top) / box.height - 0.5) * 16;
      activeImage.style.transform = `scale(1.06) translate(${dx}px, ${dy}px)`;
    });

    stage.addEventListener("pointerleave", () => {
      const activeImage = $(".hero-slide.is-active img", stage);
      if (activeImage) activeImage.style.transform = "";
    });
  }

  [stage, prev, next, play].forEach((node) => {
    node.addEventListener("pointerenter", () => {
      pauseAutoplay = true;
      window.clearTimeout(timer);
      progressAnim?.pause();
    });

    node.addEventListener("pointerleave", () => {
      pauseAutoplay = false;
      animateProgress();
      queueNext();
    });
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      window.clearTimeout(timer);
      progressAnim?.pause();
      return;
    }

    animateProgress();
    queueNext();
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight") setSlide(index + 1);
    if (event.key === "ArrowLeft") setSlide(index - 1);
  });

  updateHud(slides[index]);
  slides.forEach((slide, slideIndex) => {
    slide.setAttribute("aria-hidden", slideIndex === index ? "false" : "true");
  });
  animateProgress();
  queueNext();
}

function initShowreelComposer() {
  const feature = $("#showreel-feature");
  const featureVideo = $("#showreel-feature-video");
  const featureTag = $("#showreel-feature-tag");
  const featureTitle = $("#showreel-feature-title");
  const featureSubtitle = $("#showreel-feature-subtitle");
  const featurePlay = $("#showreel-feature-play");
  const featureProgress = $("#showreel-feature-progress");
  const queueCards = $$(".queue-card[data-showreel-index]");
  const thumbs = $$(".showreel-thumb[data-showreel-index]");
  const queueWrap = $(".showreel-queue");
  const showreelSection = $("#showreel");

  if (
    !feature ||
    !featureVideo ||
    !featureTag ||
    !featureTitle ||
    !featureSubtitle ||
    !featurePlay ||
    !featureProgress ||
    !queueCards.length
  ) {
    return;
  }

  const cardByIndex = new Map();
  queueCards.forEach((card) => {
    const idx = Number(card.dataset.showreelIndex);
    if (Number.isFinite(idx)) cardByIndex.set(idx, card);
  });

  let index = Number(queueCards[0].dataset.showreelIndex || "0");
  let timer = 0;
  let progressAnim = null;
  let paused = false;
  let inView = true;

  const cycleMs = 5800;

  const playFeatured = () => {
    const playAttempt = featureVideo.play();
    if (playAttempt?.catch) playAttempt.catch(() => {});
  };

  const updateSource = (videoPath, posterPath) => {
    if (!videoPath) return;

    const source = $("source", featureVideo);
    const currentPath = source ? source.getAttribute("src") || "" : featureVideo.getAttribute("src") || "";

    if (posterPath) featureVideo.poster = posterPath;
    if (currentPath === videoPath) {
      playFeatured();
      return;
    }

    if (source) {
      source.setAttribute("src", videoPath);
      featureVideo.removeAttribute("src");
    } else {
      featureVideo.src = videoPath;
    }

    featureVideo.load();
    playFeatured();
  };

  const queueAuto = () => {
    window.clearTimeout(timer);
    progressAnim?.pause();
    featureProgress.style.transform = "scaleX(0)";

    if (prefersReducedMotion || paused || document.hidden || !inView) return;

    progressAnim = animate(featureProgress, {
      scaleX: [0, 1],
      duration: cycleMs,
      ease: "linear",
    });

    timer = window.setTimeout(() => {
      const next = (index + 1) % queueCards.length;
      setActive(next, { fromAuto: true });
    }, cycleMs);
  };

  const setActive = (nextIndex, options = {}) => {
    const { fromAuto = false } = options;
    const card = cardByIndex.get(nextIndex);
    if (!card) return;

    index = nextIndex;

    const videoPath = card.dataset.video || "";
    const posterPath = card.dataset.poster || "";
    const tagText = card.dataset.tag || `Clip ${String(nextIndex + 1).padStart(2, "0")}`;
    const titleText = card.dataset.title || "Showreel Highlight";
    const subtitleText = card.dataset.subtitle || "";

    featureTag.textContent = tagText;
    featureTitle.textContent = titleText;
    featureSubtitle.textContent = subtitleText;

    featurePlay.dataset.video = videoPath;
    featurePlay.dataset.poster = posterPath;
    featurePlay.dataset.title = `KASSABI | ${tagText}`;

    updateSource(videoPath, posterPath);

    queueCards.forEach((item) => {
      const active = Number(item.dataset.showreelIndex) === nextIndex;
      item.classList.toggle("is-active", active);
    });

    thumbs.forEach((thumb) => {
      const active = Number(thumb.dataset.showreelIndex) === nextIndex;
      thumb.classList.toggle("is-active", active);
    });

    if (!prefersReducedMotion && !fromAuto) {
      animate([featureTag, featureTitle, featureSubtitle], {
        opacity: [0.2, 1],
        translateY: [10, 0],
        duration: 420,
        ease: "outExpo",
      });
    }

    queueAuto();
  };

  queueCards.forEach((card) => {
    card.addEventListener("click", () => {
      const next = Number(card.dataset.showreelIndex || "0");
      setActive(next);
    });
  });

  thumbs.forEach((thumb) => {
    thumb.addEventListener("click", () => {
      const next = Number(thumb.dataset.showreelIndex || "0");
      setActive(next);
    });
  });

  [feature, queueWrap, $("#showreel-thumbline")].forEach((node) => {
    if (!node) return;

    node.addEventListener("pointerenter", () => {
      paused = true;
      window.clearTimeout(timer);
      progressAnim?.pause();
    });

    node.addEventListener("pointerleave", () => {
      paused = false;
      queueAuto();
    });
  });

  if (showreelSection) {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        inView = entry.isIntersecting && entry.intersectionRatio > 0.34;
        if (!inView) {
          window.clearTimeout(timer);
          progressAnim?.pause();
          return;
        }
        queueAuto();
      },
      {
        threshold: [0.2, 0.35, 0.6],
      }
    );

    observer.observe(showreelSection);
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      window.clearTimeout(timer);
      progressAnim?.pause();
      return;
    }
    queueAuto();
  });

  setActive(index, { fromAuto: true });
}

function initInlineVideos() {
  const videos = $$("[data-inline-video]");
  if (!videos.length) return;

  videos.forEach((video) => {
    video.muted = true;
    video.playsInline = true;
  });

  if (prefersReducedMotion) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const video = entry.target;
        if (!(video instanceof HTMLVideoElement)) return;

        if (entry.isIntersecting && entry.intersectionRatio > 0.45) {
          const playAttempt = video.play();
          if (playAttempt?.catch) playAttempt.catch(() => {});
        } else {
          video.pause();
        }
      });
    },
    {
      threshold: [0.3, 0.5, 0.7],
    }
  );

  videos.forEach((video) => observer.observe(video));
}

function initVideoModal() {
  const modal = $("#video-modal");
  const shell = $("#video-shell");
  const video = $("#modal-video");
  const closeButton = $("#video-close");
  const closeBackdrop = $("[data-close-video]", modal);
  const triggers = $$(".js-open-video");

  if (!modal || !shell || !video || !closeButton || !closeBackdrop || !triggers.length) return;

  let isOpen = false;
  let closeFallback = 0;

  const applyMode = () => {
    const portrait = video.videoHeight > video.videoWidth;
    shell.classList.toggle("is-portrait", portrait);
    shell.classList.toggle("is-landscape", !portrait);
  };

  const closeModal = () => {
    if (!isOpen) return;
    isOpen = false;

    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");

    window.clearTimeout(closeFallback);
    closeFallback = window.setTimeout(() => {
      video.pause();
      video.removeAttribute("src");
      video.load();
      shell.classList.remove("is-portrait", "is-landscape");
    }, 220);
  };

  const openModal = (trigger) => {
    const source = trigger.dataset.video;
    if (!source || isOpen) return;

    isOpen = true;

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");

    const poster = trigger.dataset.poster || "";
    video.pause();
    video.removeAttribute("src");
    if (poster) video.poster = poster;

    video.src = source;
    video.currentTime = 0;
    video.load();

    const playAttempt = video.play();
    if (playAttempt?.catch) playAttempt.catch(() => {});
  };

  triggers.forEach((trigger) => {
    trigger.addEventListener("click", () => openModal(trigger));
  });

  closeButton.addEventListener("click", closeModal);
  closeBackdrop.addEventListener("click", closeModal);

  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeModal();
  });

  shell.addEventListener("click", (event) => {
    event.stopPropagation();
  });

  video.addEventListener("loadedmetadata", applyMode);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeModal();
  });
}

function initImageModal() {
  const modal = $("#image-modal");
  const image = $("#lightbox-image");
  const closeButton = $("#image-close");
  const closeBackdrop = $("[data-close-image]", modal);
  const directSources = $$("[data-lightbox]");
  const galleryCards = $$(".gallery-card");

  if (!modal || !image || !closeButton || !closeBackdrop || (!directSources.length && !galleryCards.length)) return;

  let open = false;

  const close = () => {
    if (!open) return;
    open = false;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");

    window.setTimeout(() => {
      image.src = "";
      image.alt = "";
    }, 220);
  };

  const openImage = (source) => {
    const src = source.currentSrc || source.src;
    if (!src) return;

    open = true;
    image.src = src;
    image.alt = source.alt || "Gallery image";

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
  };

  directSources.forEach((source) => {
    source.addEventListener("click", () => openImage(source));
  });

  galleryCards.forEach((card) => {
    card.addEventListener("click", () => {
      const source = $("img", card);
      if (!source) return;
      openImage(source);
    });
  });

  closeButton.addEventListener("click", close);
  closeBackdrop.addEventListener("click", close);

  modal.addEventListener("click", (event) => {
    if (event.target === modal) close();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") close();
  });
}

function initCursor() {
  const cursor = $("#cursor");
  cursor?.remove();
}

function initParticleCanvas() {
  const canvas = $("#particle-canvas");
  // Keep static gradient FX only; remove canvas workload for smoothness.
  canvas?.remove();
}

function initVenueLoopHover() {
  // Loop movement is CSS-driven; keeping JS idle here avoids periodic jank.
}

async function bootstrap() {
  initMenu();
  initScrollProgress();
  initNavSpy();
  initParticleCanvas();
  initHeroSlider();
  initShowreelComposer();
  initEqualizer();
  initMagnetic();
  initInlineVideos();
  initVideoModal();
  initImageModal();
  initCursor();
  initVenueLoopHover();

  await runLoader();
  initReveals();
  initIntro();
}

bootstrap();
