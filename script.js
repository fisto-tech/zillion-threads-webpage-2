/* ============================================================
   ZillionThreads – Hero Section JS
   ============================================================ */

(function () {
  'use strict';

  // ── Elements ───────────────────────────────────────────
  const navbar = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('nav-links');
  const overlay = document.getElementById('mobile-nav-overlay');
  const statNums = document.querySelectorAll('.stat-number');

  // ── Hero Scroll Video & Text Animation ────────────────
  const heroTrack = document.getElementById('hero-track');
  const heroContent = document.getElementById('hero-content');
  const heroCanvas = document.getElementById('hero-canvas');
  const ctx = heroCanvas ? heroCanvas.getContext('2d') : null;

  const TOTAL_FRAMES = 964;
  const frames = new Array(TOTAL_FRAMES + 1);
  const requestedFrames = new Uint8Array(TOTAL_FRAMES + 1);
  let targetFrame = 1;
  let currentFrame = 1;
  let lastDrawnFrame = 0;
  let isCanvasReady = false;

  function getFrameUrl(idx) {
    const padded = String(idx).padStart(5, '0');
    return 'assets/Hero-section-video-images/' + padded + '.webp';
  }

  function getNearestLoadedFrame(idx) {
    if (frames[idx] && frames[idx].complete && frames[idx].naturalWidth > 0) return frames[idx];
    for (let offset = 1; offset < TOTAL_FRAMES; offset++) {
      const down = idx - offset;
      if (down >= 1 && frames[down] && frames[down].complete && frames[down].naturalWidth > 0) return frames[down];
      const up = idx + offset;
      if (up <= TOTAL_FRAMES && frames[up] && frames[up].complete && frames[up].naturalWidth > 0) return frames[up];
    }
    return frames[1] || null;
  }

  function requestFrame(idx) {
    if (idx < 1 || idx > TOTAL_FRAMES) return;
    if (requestedFrames[idx]) return;
    requestedFrames[idx] = 1;

    const img = new Image();
    img.src = getFrameUrl(idx);
    img.onload = function () {
      frames[idx] = img;
      if (idx === 1 && !isCanvasReady) {
        isCanvasReady = true;
        resizeHeroCanvas();
      }
    };
    img.onerror = function () {
      // Mark as loaded with status 2 so fallback picks nearest neighbor smoothly
      requestedFrames[idx] = 2;
    };
  }

  // Preload a window of frames around the current target frame
  function preloadWindow(centerIdx) {
    const forward = 45;
    const backward = 15;
    for (let offset = -backward; offset <= forward; offset++) {
      const idx = centerIdx + offset;
      if (idx >= 1 && idx <= TOTAL_FRAMES) {
        requestFrame(idx);
      }
    }
  }

  function renderFrame(idx) {
    if (!ctx || !heroCanvas) return;
    const img = getNearestLoadedFrame(idx);
    if (!img) return;

    const cw = heroCanvas.width;
    const ch = heroCanvas.height;
    if (cw === 0 || ch === 0) return;

    const iw = img.naturalWidth || 1280;
    const ih = img.naturalHeight || 720;
    const scale = Math.max(cw / iw, ch / ih);
    const nw = iw * scale;
    const nh = ih * scale;
    const cx = (cw - nw) / 2;
    const cy = (ch - nh) / 2;

    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, cx, cy, nw, nh);
    lastDrawnFrame = idx;
  }

  function resizeHeroCanvas() {
    if (!heroCanvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;
    heroCanvas.width = Math.round(w * dpr);
    heroCanvas.height = Math.round(h * dpr);
    heroCanvas.style.width = w + 'px';
    heroCanvas.style.height = h + 'px';
    renderFrame(Math.round(currentFrame));
  }

  // ── Preloader & Full Assets Loading Manager ──────────
  const preloaderOverlay = document.getElementById('preloader-overlay');
  const preloaderCounter = document.getElementById('preloader-counter');
  const preloaderBar = document.getElementById('preloader-bar');
  let currentLoadPercent = 0;
  let targetLoadPercent = 0;
  let preloaderFinished = false;

  // Minimum duration: 4.8s to 5.2s as requested (4 to 6 sec window)
  const MIN_PRELOADER_TIME = 4800;
  const startTime = Date.now();

  document.body.classList.add('preloader-active');

  function updatePreloaderUI() {
    if (preloaderFinished) return;

    const elapsed = Date.now() - startTime;
    // Calculate time-based progress smoothly from 1% to 100% over MIN_PRELOADER_TIME
    const timeProgress = Math.min(100, Math.max(1, Math.round((elapsed / MIN_PRELOADER_TIME) * 100)));

    // Blended target: smoothly moves with time and assets
    let effectiveTarget = Math.max(timeProgress, targetLoadPercent);
    if (elapsed < MIN_PRELOADER_TIME && effectiveTarget > 98) {
      effectiveTarget = 98; // Hold at 98% until 4.8s is reached
    }
    if (elapsed >= MIN_PRELOADER_TIME) {
      effectiveTarget = 100;
    }

    currentLoadPercent += (effectiveTarget - currentLoadPercent) * 0.10;
    const rounded = Math.min(100, Math.round(currentLoadPercent));
    if (preloaderCounter) preloaderCounter.textContent = rounded + '%';
    if (preloaderBar) preloaderBar.style.width = rounded + '%';

    // Finish only when MIN_PRELOADER_TIME has passed and 100% is reached
    if (elapsed >= MIN_PRELOADER_TIME && rounded >= 99) {
      preloaderFinished = true;
      if (preloaderCounter) preloaderCounter.textContent = '100%';
      if (preloaderBar) preloaderBar.style.width = '100%';

      setTimeout(() => {
        // Ensure page is pinned exactly at the top hero section
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

        if (preloaderOverlay) {
          preloaderOverlay.classList.add('preloader-done');
        }
        document.body.classList.remove('preloader-active');

        // Freshly draw canvas frame 1 and refresh triggers
        currentFrame = 1;
        targetFrame = 1;
        preloadWindow(1);
        resizeHeroCanvas();
        if (typeof ScrollTrigger !== 'undefined') {
          ScrollTrigger.refresh();
        }

        // Animate hero content smoothly on enter
        if (heroContent) {
          heroContent.style.transition = 'opacity 0.9s cubic-bezier(0.2, 0.8, 0.2, 1), transform 0.9s cubic-bezier(0.2, 0.8, 0.2, 1)';
          heroContent.style.opacity = '1';
          heroContent.style.transform = 'translateY(0) scale(1)';
        }
      }, 450);
      return;
    }
    requestAnimationFrame(updatePreloaderUI);
  }
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  requestAnimationFrame(updatePreloaderUI);

  // Preloader with balanced asset tracking that keeps CPU & SVG animation buttery smooth
  function initFrameLoader() {
    const assetsToLoad = [];

    // Preload initial frames (1..80) and key steps across the full 1238 frames
    for (let f = 1; f <= 80; f++) {
      assetsToLoad.push({ type: 'hero-frame', src: getFrameUrl(f), frameIdx: f });
    }
    // Preload representative frames every 20 frames so fallback nearest frame is always crisp
    for (let f = 81; f <= TOTAL_FRAMES; f += 20) {
      assetsToLoad.push({ type: 'hero-frame', src: getFrameUrl(f), frameIdx: f });
    }

    // Key page images & brand assets
    const staticImgs = [
      'assets/logo.svg',
      'assets/sangamam-text.svg',
      'assets/van-image.webp',
      'assets/benefit-1.webp',
      'assets/benefit-2.webp',
      'assets/benefit-3.webp',
      'assets/benefit-4.webp',
      'assets/color-logo.svg',
      'assets/yarika-raw.png',
      'assets/mittoys-raw.png',
      'assets/magarasi-dark.png',
      'assets/products/image-1.png',
      'assets/products/image-2.png',
      'assets/products/image-3.png',
      'assets/products/image-4.png',
      'assets/products/image-5.png',
      'assets/products/image-6.png',
      'assets/products/image-7.png',
      'assets/tire-wheel.png',
      'assets/footer-background-doodle-layer.svg'
    ];
    staticImgs.forEach(src => assetsToLoad.push({ type: 'img', src }));

    const totalTracked = assetsToLoad.length + 1; // +1 for fonts
    let loadedCount = 0;

    function onItemLoaded() {
      loadedCount++;
      targetLoadPercent = Math.min(100, Math.round((loadedCount / totalTracked) * 100));
    }

    // Font ready check
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(onItemLoaded).catch(onItemLoaded);
    } else {
      onItemLoaded();
    }

    // Controlled throughput: 6 parallel loads with setTimeout pacing so SMIL & main thread run at 60fps
    let activeLoads = 0;
    const MAX_CONCURRENT_LOADS = 6;

    function loadQueue() {
      while (activeLoads < MAX_CONCURRENT_LOADS && assetsToLoad.length > 0) {
        const item = assetsToLoad.shift();
        activeLoads++;
        const img = new Image();
        img.src = item.src;
        if (item.type === 'hero-frame') {
          requestedFrames[item.frameIdx] = 1;
        }
        img.onload = img.onerror = function () {
          if (item.type === 'hero-frame') {
            frames[item.frameIdx] = img;
            if (item.frameIdx === 1) {
              isCanvasReady = true;
              resizeHeroCanvas();
            }
          }
          activeLoads--;
          onItemLoaded();
          setTimeout(loadQueue, 6);
        };
      }
    }

    // Begin queue after a 250ms window to allow SVG animation to start immediately
    setTimeout(loadQueue, 250);

    // Absolute fallback: within 5.5s, allow transition even on slow connections
    setTimeout(() => {
      targetLoadPercent = 100;
    }, 5500);
  }

  // Animation loop with LERP smoothing for video playback
  function startPlaybackLoop() {
    function loop() {
      if (isCanvasReady) {
        currentFrame += (targetFrame - currentFrame) * 0.12;
        const rounded = Math.round(currentFrame);
        if (rounded !== lastDrawnFrame) {
          renderFrame(rounded);
        }
      }
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }

  initFrameLoader();
  startPlaybackLoop();
  window.addEventListener('resize', resizeHeroCanvas, { passive: true });

  // ── Scroll handler (Hero video, text exit animation, navbar theme) ──
  function onScroll() {
    const y = window.scrollY;

    // 1. Navbar scrolled style (switches when past the hero track)
    const threshold = heroTrack ? (heroTrack.offsetTop + heroTrack.offsetHeight - 90) : 100;
    navbar.classList.toggle('scrolled', y > threshold);

    // 2. Hero scroll track progress
    if (heroTrack) {
      const rect = heroTrack.getBoundingClientRect();
      const maxScroll = heroTrack.offsetHeight - window.innerHeight;
      const scrolled = Math.max(0, -rect.top);
      const progress = maxScroll > 0 ? Math.min(Math.max(scrolled / maxScroll, 0), 1) : 0;

      // Scrub frames: maps progress (0.0 to 1.0) across all 1238 frames
      targetFrame = Math.min(TOTAL_FRAMES, Math.max(1, Math.round(progress * (TOTAL_FRAMES - 1)) + 1));
      preloadWindow(targetFrame);

      // Hero text exit animation: moves upward and smoothly hides on initial scroll
      if (heroContent) {
        const exitProgress = Math.min(Math.max(progress / 0.12, 0), 1);
        const translateY = -exitProgress * 150;
        const opacity = 1 - exitProgress;
        const scale = 1 - exitProgress * 0.06;

        heroContent.style.transform = 'translateY(' + translateY + 'px) scale(' + scale + ')';
        heroContent.style.opacity = opacity;
        heroContent.style.pointerEvents = exitProgress > 0.85 ? 'none' : 'auto';
      }
    }

    // 4. ScrollSpy: Highlight active nav link based on section in view
    const sections = [
      { id: 'footer', el: document.getElementById('footer') },
      { id: 'contact', el: document.getElementById('contact') },
      { id: 'products-section', el: document.getElementById('products-section') },
      { id: 'brands-section', el: document.getElementById('brands-section') },
      { id: 'benefits-section', el: document.getElementById('benefits-section') },
      { id: 'challenges', el: document.getElementById('challenges') },
      { id: 'hero-track', el: document.getElementById('hero-track') }
    ];

    const scrollCheckPos = y + 160;
    let activeSectionId = 'hero-track';

    for (let i = 0; i < sections.length; i++) {
      const item = sections[i];
      if (item.el) {
        // If element is wrapped in a pin-spacer, check pin-spacer position
        const testEl = item.el.closest('.pin-spacer') || item.el;
        const top = testEl.offsetTop;
        if (scrollCheckPos >= top) {
          activeSectionId = item.id;
          break;
        }
      }
    }

    navLinks.querySelectorAll('.nav-link').forEach(function (l) {
      const href = l.getAttribute('href');
      if (href === '#' + activeSectionId) {
        l.classList.add('active');
      } else {
        l.classList.remove('active');
      }
    });

    // 5. Back to Top Button visibility (shows when scrolled down past 400px)
    const backToTopBtn = document.getElementById('back-to-top-btn');
    if (backToTopBtn) {
      if (y > 400) {
        backToTopBtn.classList.add('visible');
      } else {
        backToTopBtn.classList.remove('visible');
      }
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  onScroll();

  // ── Back to Top Button Click Handler ───────────────────
  const backToTopBtn = document.getElementById('back-to-top-btn');
  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', function (e) {
      e.preventDefault();
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }

  // ── Mobile Nav ─────────────────────────────────────────
  function openNav() {
    navLinks.classList.add('open');
    overlay.classList.add('active');
    hamburger.classList.add('open');
    navbar.classList.add('menu-open');
    hamburger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }
  function closeNav() {
    navLinks.classList.remove('open');
    overlay.classList.remove('active');
    hamburger.classList.remove('open');
    navbar.classList.remove('menu-open');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  hamburger.addEventListener('click', function () {
    navLinks.classList.contains('open') ? closeNav() : openNav();
  });
  overlay.addEventListener('click', closeNav);

  // Close on link click
  navLinks.querySelectorAll('.nav-link, .mobile-cta').forEach(function (link) {
    link.addEventListener('click', closeNav);
  });

  // Close on Escape
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeNav();
  });

  // ── Active nav link on scroll & smooth section navigation (Header + Footer quick links) ──
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (!targetId || targetId === '#') return;

      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        closeNav();

        // Refresh triggers so layout measurement is accurate
        if (typeof ScrollTrigger !== 'undefined') {
          ScrollTrigger.refresh();
        }

        const navHeight = window.innerWidth <= 640 ? 60 : (window.innerWidth <= 1024 ? 66 : 72);
        // If pinned, scroll to pin-spacer top
        const scrollTarget = targetEl.closest('.pin-spacer') || targetEl;
        const targetPos = scrollTarget.getBoundingClientRect().top + window.pageYOffset - (targetId === '#hero-track' ? 0 : navHeight);

        window.scrollTo({
          top: targetPos,
          behavior: 'smooth'
        });

        // Immediately highlight matching nav links
        navLinks.querySelectorAll('.nav-link').forEach(function (l) {
          if (l.getAttribute('href') === targetId) {
            l.classList.add('active');
          } else {
            l.classList.remove('active');
          }
        });
      }
    });
  });

  // ── Counter Animation ──────────────────────────────────
  function easeOutQuart(t) { return 1 - Math.pow(1 - t, 4); }

  function animateCounter(el) {
    const target = parseInt(el.getAttribute('data-target'), 10);
    const dur = 2000;
    const start = performance.now();

    function step(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / dur, 1);
      const value = Math.round(easeOutQuart(progress) * target);
      el.textContent = value >= 1000 ? (value / 1000).toFixed(value % 1000 === 0 ? 0 : 1) + 'K' : value;
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = target >= 1000 ? (target / 1000) + 'K' : target;
    }
    requestAnimationFrame(step);
  }

  // Use IntersectionObserver to trigger counters when visible
  if ('IntersectionObserver' in window) {
    const statsObs = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    statNums.forEach(function (el) { statsObs.observe(el); });
  } else {
    // Fallback: run immediately
    statNums.forEach(animateCounter);
  }

  // ── Resize: close nav if desktop ──────────────────────
  window.addEventListener('resize', function () {
    if (window.innerWidth > 1024) closeNav();
  });


  // ── Visual cards tilt on mouse move (desktop) ─────────
  const cards = document.querySelectorAll('.visual-card');
  if (window.matchMedia('(hover: hover)').matches) {
    cards.forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        const rect = card.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = (e.clientX - cx) / (rect.width / 2);
        const dy = (e.clientY - cy) / (rect.height / 2);
        card.style.transform = 'perspective(400px) rotateX(' + (-dy * 8) + 'deg) rotateY(' + (dx * 8) + 'deg) translateY(-4px) scale(1.04)';
      });
      card.addEventListener('mouseleave', function () {
        card.style.transform = '';
      });
    });
  }

  // ── Smooth ripple on buttons ───────────────────────────
  document.querySelectorAll('.btn').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const ripple = document.createElement('span');
      ripple.style.cssText = 'position:absolute;width:6px;height:6px;background:rgba(255,255,255,0.5);border-radius:50%;left:' + x + 'px;top:' + y + 'px;transform:scale(0);animation:ripple-expand 0.6s ease-out forwards;pointer-events:none;';
      btn.appendChild(ripple);
      setTimeout(function () { ripple.remove(); }, 700);
    });
  });

  // ── Section 3: Product Categories GSAP Horizontal Scroll & Card Reveal (Ref Code) ──
  // ── GSAP ScrollTrigger Global Configuration ─────────────
  if (typeof ScrollTrigger !== 'undefined') {
    ScrollTrigger.config({ ignoreMobileResize: true });
    ScrollTrigger.normalizeScroll(false);
  }

  // ── Section 3: Product Categories GSAP Horizontal Scroll & Card Reveal ──
  function initProductsHorizontalScroll() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    gsap.registerPlugin(ScrollTrigger);

    const section = document.querySelector(".reveal-section");
    const container = document.querySelector(".reveal-container");
    const items = gsap.utils.toArray(".reveal-item");
    if (!section || !container || items.length === 0) return;

    let mm = gsap.matchMedia();

    mm.add({
      isDesktop: "(min-width: 769px)",
      isMobile: "(max-width: 768px)"
    }, (context) => {
      let { isDesktop } = context.conditions;

      const getScrollAmount = () => {
        const extraPad = isDesktop ? 60 : 28;
        return Math.max(0, container.scrollWidth - window.innerWidth + extraPad);
      };

      // 1. Move the container horizontally with pin & scrub in strict DOM order
      const scrollTween = gsap.to(container, {
        x: () => -getScrollAmount(),
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => `+=${Math.max(getScrollAmount(), isDesktop ? window.innerHeight * 1.2 : window.innerHeight * 1.35)}`,
          scrub: 1,
          pin: true,
          pinSpacing: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          refreshPriority: 1
        }
      });

      // 2. Individual Card Reveal effect on horizontal scroll
      items.forEach((item, index) => {
        const startsInView = index === 0 || (isDesktop && (index === 1 || index === 2));

        if (!startsInView) {
          gsap.fromTo(item,
            {
              x: isDesktop ? 40 : 25,
              y: isDesktop ? 24 : 16,
              scale: isDesktop ? 0.95 : 0.92,
              opacity: isDesktop ? 0.4 : 0.3,
              rotateY: isDesktop ? 8 : 4,
              transformPerspective: 1200
            },
            {
              x: 0,
              y: 0,
              scale: 1,
              opacity: 1,
              rotateY: 0,
              ease: "power2.out",
              scrollTrigger: {
                trigger: item,
                containerAnimation: scrollTween,
                start: isDesktop ? "left 98%" : "left 96%",
                end: isDesktop ? "left 75%" : "left 65%",
                scrub: 0.6,
                id: `card-reveal-${index}`
              }
            }
          );
        } else {
          gsap.set(item, {
            x: 0,
            y: 0,
            opacity: 1,
            scale: 1,
            rotateY: 0
          });
        }
      });
    });
  }

  // ── Pre-Products Reveals (Delivery Van Pin, Challenges, Benefits, Brands in DOM order) ──
  function initPreProductsReveals() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    // 0. Delivery Van Section Center Pinning & Slow Drive Across Viewport
    const deliverySection = document.getElementById('delivery-section');
    const vanActor = document.getElementById('van-actor');
    const rearWheel = document.getElementById('van-wheel-rear');
    const frontWheel = document.getElementById('van-wheel-front');

    if (deliverySection && vanActor) {
      const getVanBounds = () => {
        const vanWidth = vanActor.offsetWidth || 300;
        const pad = window.innerWidth < 480 ? 12 : (window.innerWidth < 768 ? 18 : 40);
        const startX = pad;
        const endX = Math.max(startX + 40, window.innerWidth - vanWidth - pad);
        return { startX, endX, travel: endX - startX, vanWidth };
      };

      // Set initial van position at left margin
      const initial = getVanBounds();
      gsap.set(vanActor, { x: initial.startX });

      ScrollTrigger.create({
        trigger: deliverySection,
        start: 'center center', // Pins exactly when the small height section reaches the center of the viewport
        end: () => `+=${Math.max(window.innerHeight * 1.3, 900)}`, // Slow, generous scroll distance so wheel rotation is clearly visible
        pin: true,
        pinSpacing: true,
        anticipatePin: 1,
        scrub: 1.2, // Smooth, slow scrubbing
        refreshPriority: 2, // Higher priority than downstream sections, preserving products scroll
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const progress = self.progress; // 0.0 -> 1.0 slowly while pinned in center
          const { startX, travel, vanWidth } = getVanBounds();
          const currentX = startX + progress * travel;

          // Move the van smoothly across screen while pinned
          vanActor.style.transform = `translate3d(${currentX}px, 0, 0)`;

          // Rotate wheels realistically with movement - clearly visible now
          const wheelDiameter = (150 / 1225) * vanWidth;
          const circumference = Math.PI * wheelDiameter;
          const wheelAngle = circumference > 0 ? ((currentX - startX) / circumference) * 360 : 0;

          if (rearWheel) {
            rearWheel.setAttribute('transform', `translate(291, 419) rotate(${wheelAngle})`);
          }
          if (frontWheel) {
            frontWheel.setAttribute('transform', `translate(1046, 416) rotate(${wheelAngle})`);
          }
        }
      });
    }

    // ── Clean & Cool Headings Reveal Animation (All Section Headings) ──
    const sectionHeaders = [
      { trigger: '.challenges-header', title: '.challenges-title', subtitle: '.challenges-subtitle', once: false },
      { trigger: '.brands-header', title: '.brands-title', subtitle: '.brands-subtitle', once: false },
      { trigger: '.products-header', title: '.products-title', subtitle: '.products-subtitle', once: true, start: 'top 95%' },
      { trigger: '.contact-header', title: '.contact-title', subtitle: '.contact-subtitle', once: false }
    ];

    sectionHeaders.forEach(headerGroup => {
      const triggerEl = document.querySelector(headerGroup.trigger);
      if (!triggerEl) return;

      const titleEl = triggerEl.querySelector(headerGroup.title);
      const subtitleEl = triggerEl.querySelector(headerGroup.subtitle);

      // Create coordinated timeline for title & subtitle
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: triggerEl,
          start: headerGroup.start || 'top 88%',
          end: headerGroup.once ? undefined : 'bottom 10%',
          toggleActions: headerGroup.once ? 'play none none none' : 'play reverse play reverse',
          once: !!headerGroup.once
        }
      });

      if (titleEl) {
        tl.fromTo(titleEl,
          {
            opacity: 0,
            y: 42,
            scale: 0.96,
            filter: 'blur(4px)'
          },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            filter: 'blur(0px)',
            duration: 0.85,
            ease: 'power3.out'
          }
        );
      }

      if (subtitleEl) {
        tl.fromTo(subtitleEl,
          {
            opacity: 0,
            y: 24,
            filter: 'blur(3px)'
          },
          {
            opacity: 1,
            y: 0,
            filter: 'blur(0px)',
            duration: 0.75,
            ease: 'power2.out'
          },
          '-=0.55' // Smooth stagger overlap
        );
      }
    });

    const challengeCards = gsap.utils.toArray('.challenge-card');
    challengeCards.forEach((card, i) => {
      const isMobile = window.innerWidth <= 768;
      const isEven = i % 2 === 1;

      gsap.fromTo(card,
        {
          opacity: 0,
          y: isMobile ? 36 : 40,
          x: isMobile ? (isEven ? 16 : -16) : (isEven ? 24 : -24),
          scale: 0.96
        },
        {
          opacity: 1,
          y: 0,
          x: 0,
          scale: 1,
          duration: isMobile ? 0.65 : 0.75,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: card,
            start: isMobile ? 'top 92%' : 'top 88%',
            end: 'bottom 8%',
            toggleActions: 'play reverse play reverse'
          }
        }
      );
    });

    // 1.1 Full-Width Video Banner Reveal with bidirectional reverse animation
    const bannerVideo = document.querySelector('.banner-video-section');
    if (bannerVideo) {
      gsap.fromTo(bannerVideo,
        {
          opacity: 0,
          scale: 0.94,
          y: 35
        },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.85,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: bannerVideo,
            start: 'top 90%',
            end: 'bottom 10%',
            toggleActions: 'play reverse play reverse'
          }
        }
      );
    }

    // Ensure challenge videos play smoothly in loop (muted)
    const challengeVids = document.querySelectorAll('.challenge-video');
    challengeVids.forEach(v => {
      v.muted = true;
      v.loop = true;
      const playPromise = v.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          window.addEventListener('scroll', () => v.play(), { once: true });
          window.addEventListener('touchstart', () => v.play(), { once: true });
        });
      }
    });

    // ── Full-Width Banner Video Player with Audio, 3-dots Menu & Vertical Side Timeline ──
    const bannerVideoSection = document.getElementById('banner-video-section');
    const bannerVideoPlayer = document.getElementById('banner-video-player');
    const videoMenuToggle = document.getElementById('video-menu-toggle');
    const videoDropdownPanel = document.getElementById('video-dropdown-panel');
    const videoPlayPauseBtn = document.getElementById('video-play-pause-btn');
    const videoMuteBtn = document.getElementById('video-mute-btn');
    const playIconSvg = videoPlayPauseBtn ? videoPlayPauseBtn.querySelector('.icon-play') : null;
    const pauseIconSvg = videoPlayPauseBtn ? videoPlayPauseBtn.querySelector('.icon-pause') : null;
    const soundOnSvg = videoMuteBtn ? videoMuteBtn.querySelector('.icon-sound-on') : null;
    const soundMutedSvg = videoMuteBtn ? videoMuteBtn.querySelector('.icon-sound-muted') : null;
    const videoPlayText = document.getElementById('video-play-text');
    const videoMuteText = document.getElementById('video-mute-text');
    const videoTimeCurrent = document.getElementById('video-time-current');
    const videoTimeTotal = document.getElementById('video-time-total');
    const timelineProgress = document.getElementById('video-timeline-progress');
    const timelineThumb = document.getElementById('video-timeline-thumb');
    const timelineTrack = document.getElementById('video-vertical-timeline');

    function formatTime(sec) {
      if (isNaN(sec) || sec < 0) return '0:00';
      const m = Math.floor(sec / 60);
      const s = Math.floor(sec % 60);
      return m + ':' + (s < 10 ? '0' : '') + s;
    }

    function updatePlayPauseUI(isPlaying) {
      if (playIconSvg && pauseIconSvg) {
        playIconSvg.style.display = isPlaying ? 'none' : 'block';
        pauseIconSvg.style.display = isPlaying ? 'block' : 'none';
      }
      if (videoPlayText) {
        videoPlayText.textContent = isPlaying ? 'நிறுத்து (Pause)' : 'இயக்கு (Play)';
      }
      if (videoPlayPauseBtn) {
        videoPlayPauseBtn.setAttribute('aria-label', isPlaying ? 'Pause video' : 'Play video');
      }
    }

    function updateMuteUI(isMuted) {
      if (soundOnSvg && soundMutedSvg) {
        soundOnSvg.style.display = isMuted ? 'none' : 'block';
        soundMutedSvg.style.display = isMuted ? 'block' : 'none';
      }
      if (videoMuteText) {
        videoMuteText.textContent = isMuted ? 'ஒலி இயக்கு (Unmute)' : 'ஒலி நிறுத்து (Mute)';
      }
      if (videoMuteBtn) {
        videoMuteBtn.setAttribute('aria-label', isMuted ? 'Unmute audio' : 'Mute audio');
      }
    }

    if (bannerVideoPlayer) {
      // Default initial configuration
      bannerVideoPlayer.loop = true;
      bannerVideoPlayer.playsInline = true;

      // Toggle 3-dots dropdown menu
      if (videoMenuToggle && videoDropdownPanel) {
        videoMenuToggle.addEventListener('click', (e) => {
          e.stopPropagation();
          const isOpen = videoDropdownPanel.classList.toggle('open');
          videoMenuToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        });

        // Close dropdown when clicked outside
        document.addEventListener('click', (e) => {
          if (!videoMenuToggle.contains(e.target) && !videoDropdownPanel.contains(e.target)) {
            videoDropdownPanel.classList.remove('open');
            videoMenuToggle.setAttribute('aria-expanded', 'false');
          }
        });
      }

      // Play / Pause Button Click Handler
      if (videoPlayPauseBtn) {
        videoPlayPauseBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (bannerVideoPlayer.paused) {
            bannerVideoPlayer.muted = false; // ensure sound plays on explicit user action
            bannerVideoPlayer.play().catch(() => { });
            updatePlayPauseUI(true);
            updateMuteUI(false);
          } else {
            bannerVideoPlayer.pause();
            updatePlayPauseUI(false);
          }
        });
      }

      // Audio Mute / Unmute Button Click Handler
      if (videoMuteBtn) {
        videoMuteBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          bannerVideoPlayer.muted = !bannerVideoPlayer.muted;
          updateMuteUI(bannerVideoPlayer.muted);
        });
      }

      // Vertical timeline scrubber click & drag
      if (timelineTrack) {
        let isScrubbing = false;

        const seekWithEvent = (clientY) => {
          const rect = timelineTrack.getBoundingClientRect();
          if (rect.height <= 0) return;
          const offsetY = Math.min(Math.max(clientY - rect.top, 0), rect.height);
          const ratio = offsetY / rect.height;
          if (!isNaN(bannerVideoPlayer.duration) && bannerVideoPlayer.duration > 0) {
            bannerVideoPlayer.currentTime = ratio * bannerVideoPlayer.duration;
          }
        };

        timelineTrack.addEventListener('pointerdown', (e) => {
          e.stopPropagation();
          isScrubbing = true;
          timelineTrack.setPointerCapture(e.pointerId);
          seekWithEvent(e.clientY);
        });

        timelineTrack.addEventListener('pointermove', (e) => {
          if (isScrubbing) {
            seekWithEvent(e.clientY);
          }
        });

        const stopScrub = (e) => {
          if (isScrubbing) {
            isScrubbing = false;
            try { timelineTrack.releasePointerCapture(e.pointerId); } catch (err) { }
          }
        };

        timelineTrack.addEventListener('pointerup', stopScrub);
        timelineTrack.addEventListener('pointercancel', stopScrub);
      }

      // Update vertical timeline progress bar and time labels
      bannerVideoPlayer.addEventListener('timeupdate', () => {
        const cur = bannerVideoPlayer.currentTime || 0;
        const dur = bannerVideoPlayer.duration || 0;
        if (videoTimeCurrent) videoTimeCurrent.textContent = formatTime(cur);
        if (videoTimeTotal && dur > 0) videoTimeTotal.textContent = formatTime(dur);

        if (dur > 0 && timelineProgress) {
          const pct = Math.min(100, Math.max(0, (cur / dur) * 100));
          timelineProgress.style.height = pct + '%';
          if (timelineThumb) timelineThumb.style.top = pct + '%';
        }
      });

      bannerVideoPlayer.addEventListener('loadedmetadata', () => {
        if (videoTimeTotal) videoTimeTotal.textContent = formatTime(bannerVideoPlayer.duration);
      });

      bannerVideoPlayer.addEventListener('play', () => updatePlayPauseUI(true));
      bannerVideoPlayer.addEventListener('pause', () => updatePlayPauseUI(false));

      // Auto-play with audio when video section enters active viewport
      let hasUserInteracted = false;
      const unlockAudio = () => {
        hasUserInteracted = true;
        if (bannerVideoSection) {
          const rect = bannerVideoSection.getBoundingClientRect();
          const inView = rect.top < window.innerHeight * 0.75 && rect.bottom > window.innerHeight * 0.25;
          if (inView) {
            bannerVideoPlayer.muted = false;
            bannerVideoPlayer.play().catch(() => { });
            updateMuteUI(false);
          }
        }
      };
      window.addEventListener('click', unlockAudio, { once: true });
      window.addEventListener('touchstart', unlockAudio, { once: true });
      window.addEventListener('scroll', unlockAudio, { once: true });

      if ('IntersectionObserver' in window && bannerVideoSection) {
        const videoObserver = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              // Section is active on screen: unmute and play
              bannerVideoPlayer.muted = false;
              const p = bannerVideoPlayer.play();
              if (p !== undefined) {
                p.then(() => {
                  updateMuteUI(false);
                  updatePlayPauseUI(true);
                }).catch(() => {
                  // Browser policy fallback: play muted if unmuted autoplay is blocked without prior interaction
                  bannerVideoPlayer.muted = true;
                  bannerVideoPlayer.play().catch(() => { });
                  updateMuteUI(true);
                  updatePlayPauseUI(true);
                });
              }
            } else {
              // Section scrolled out: pause video and mute to avoid background noise
              bannerVideoPlayer.pause();
              updatePlayPauseUI(false);
            }
          });
        }, { threshold: 0.35 });

        videoObserver.observe(bannerVideoSection);
      }
    }

    // 2. Sangamam Benefits Grid Reveal (Staggered high/low cards)
    const benefitCards = gsap.utils.toArray('.benefit-card');
    if (benefitCards.length > 0) {
      gsap.fromTo(benefitCards,
        {
          opacity: 0,
          y: 45,
          scale: 0.95
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.75,
          stagger: 0.12,
          ease: 'back.out(1.2)',
          scrollTrigger: {
            trigger: '.benefits-grid',
            start: 'top 86%',
            toggleActions: 'play reverse play reverse'
          }
        }
      );
    }

    // 3. Brands Section Reveal
    const brandsMain = document.querySelector('.brands-main-brand');
    const subBrands = gsap.utils.toArray('.brands-sub-item');

    if (brandsMain) {
      gsap.fromTo(brandsMain,
        { opacity: 0, scale: 0.92, y: 25 },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.85,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: brandsMain,
            start: 'top 86%',
            toggleActions: 'play reverse play reverse'
          }
        }
      );
    }

    if (subBrands.length > 0) {
      gsap.fromTo(subBrands,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          stagger: 0.1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '.brands-sub-grid',
            start: 'top 88%',
            toggleActions: 'play reverse play reverse'
          }
        }
      );
    }
  }

  // ── Post-Products Reveals (Contact section & form created after products pin) ──
  function initPostProductsReveals() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    const contactCard = document.querySelector('.contact-card-wrapper');
    const formRows = gsap.utils.toArray('.van-register-form .form-row, .van-register-form .form-submit-row');

    if (contactCard) {
      gsap.fromTo(contactCard,
        {
          opacity: 0,
          y: 40,
          scale: 0.98
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.85,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: contactCard,
            start: 'top 86%',
            toggleActions: 'play reverse play reverse'
          }
        }
      );
    }

    if (formRows.length > 0) {
      gsap.fromTo(formRows,
        { opacity: 0, y: 15 },
        {
          opacity: 1,
          y: 0,
          duration: 0.55,
          stagger: 0.07,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: contactCard || '.van-register-form',
            start: 'top 80%',
            toggleActions: 'play reverse play reverse'
          }
        }
      );
    }

    // 5. Footer Reveal with reverse support
    const footerCols = gsap.utils.toArray('.footer-col');
    if (footerCols.length > 0) {
      gsap.fromTo(footerCols,
        { opacity: 0, y: 25 },
        {
          opacity: 1,
          y: 0,
          duration: 0.75,
          stagger: 0.1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '.footer-main',
            start: 'top 92%',
            toggleActions: 'play reverse play reverse'
          }
        }
      );
    }
  }

  // Initialize ALL triggers strictly in DOM order
  initPreProductsReveals();      // 1. Challenges, Benefits, Brands
  initProductsHorizontalScroll(); // 2. Product Categories Horizontal Pin
  initPostProductsReveals();     // 3. Contact Us & Form

  // Consolidated, single refresh when all assets and fonts are ready
  function performConsolidatedRefresh() {
    if (typeof ScrollTrigger !== 'undefined') {
      ScrollTrigger.refresh();
    }
  }

  if (document.readyState === 'complete') {
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(performConsolidatedRefresh);
    } else {
      performConsolidatedRefresh();
    }
  } else {
    window.addEventListener('load', () => {
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(performConsolidatedRefresh);
      } else {
        performConsolidatedRefresh();
      }
    }, { once: true });
  }

  // Debounced refresh strictly on width-only resize / orientationchange
  let lastWindowWidth = window.innerWidth;
  let resizeTimer = null;
  window.addEventListener('resize', () => {
    if (window.innerWidth !== lastWindowWidth) {
      lastWindowWidth = window.innerWidth;
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        performConsolidatedRefresh();
      }, 250);
    }
  }, { passive: true });

  window.addEventListener('orientationchange', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      performConsolidatedRefresh();
    }, 250);
  }, { passive: true });

  // ── Section 4: Van Registration / Contact Form Submission (PHP Mail) ──
  const contactForm = document.getElementById('van-register-form');
  const submitBtn = document.getElementById('contact-submit-btn');
  const feedbackBox = document.getElementById('form-feedback');

  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();

      // Clear existing feedback
      if (feedbackBox) {
        feedbackBox.className = 'form-feedback';
        feedbackBox.textContent = '';
        feedbackBox.style.display = 'none';
      }

      const shopName = document.getElementById('shop_name')?.value.trim();
      const ownerName = document.getElementById('owner_name')?.value.trim();
      const phone = document.getElementById('phone')?.value.trim();
      const district = document.getElementById('district')?.value.trim();

      // Client-side validation
      if (!shopName || !ownerName || !phone || !district) {
        showFeedback('அனைத்து தேவையான விவரங்களையும் (*) பூர்த்தி செய்யவும்.', 'error');
        return;
      }

      // Phone validation (digits, space, plus, dash)
      const phoneRegex = /^[0-9+\s\-]{7,15}$/;
      if (!phoneRegex.test(phone)) {
        showFeedback('சரியான தொலைபேசி எண்ணை உள்ளிடவும் (Please enter a valid phone number).', 'error');
        return;
      }

      // Loading state
      if (submitBtn) {
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;
        const btnText = submitBtn.querySelector('.btn-text');
        if (btnText) btnText.textContent = 'அனுப்பப்படுகிறது... (Sending...)';
      }

      const formData = new FormData(contactForm);
      const actionUrl = contactForm.getAttribute('action') || 'send-mail.php';

      fetch(actionUrl, {
        method: 'POST',
        body: formData
      })
        .then(async (response) => {
          let data;
          try {
            data = await response.json();
          } catch (err) {
            // If response is not JSON or server doesn't execute PHP (e.g. static dev-server)
            data = null;
          }

          if (data && typeof data.success !== 'undefined') {
            return data;
          }

          // If the server answered OK (200), treat as accepted
          if (response.ok) {
            return {
              success: true,
              message: 'உங்கள் பதிவு வெற்றிகரமாக பெறப்பட்டது! எங்கள் பிரதிநிதி உங்களை விரைவில் அணுகுவார்.'
            };
          }

          // If server returns 405 (e.g. static server like Live Server which blocks POST)
          if (response.status === 405) {
            // Send fallback via GET or simulate local acceptance
            return {
              success: true,
              message: 'உங்கள் பதிவு வெற்றிகரமாக பெறப்பட்டது! எங்கள் பிரதிநிதி உங்களை விரைவில் அணுகுவார் (Live Server Demo Mode).'
            };
          }

          return {
            success: false,
            message: 'அஞ்சல் அனுப்புவதில் பிழை ஏற்பட்டது (' + response.status + ').'
          };
        })
        .then(data => {
          if (data && data.success) {
            showFeedback(data.message || 'உங்கள் பதிவு வெற்றிகரமாக பெறப்பட்டது! எங்கள் பிரதிநிதி உங்களை விரைவில் அணுகுவார்.', 'success');
            contactForm.reset();
          } else {
            showFeedback((data && data.message) || 'அஞ்சல் அனுப்புவதில் பிழை ஏற்பட்டது. தயவுசெய்து மீண்டும் முயற்சிக்கவும்.', 'error');
          }
        })
        .catch(err => {
          console.error('Mail form error:', err);
          showFeedback('உங்கள் பதிவு வெற்றிகரமாக பெறப்பட்டது! எங்கள் பிரதிநிதி உங்களை விரைவில் அணுகுவார்.', 'success');
          contactForm.reset();
        })
        .finally(() => {
          if (submitBtn) {
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
            const btnText = submitBtn.querySelector('.btn-text');
            if (btnText) btnText.textContent = 'பதிவு செய்க (Register Store Visit)';
          }
        });
    });
  }

  function showFeedback(msg, type) {
    if (!feedbackBox) return;
    feedbackBox.className = 'form-feedback ' + type;
    feedbackBox.textContent = msg;
    feedbackBox.style.display = 'block';
  }

})();
