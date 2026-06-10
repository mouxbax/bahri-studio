/* ════════════════════════════════════════════════════════════════════
   CINEMATIC.JS · bahri.studio v2 motion + WebGL engine
   Lazy-loads Three.js after first paint.
   Detects low-power + reduced-motion and renders static fallback.
   No copy/content/schema changes.
   ════════════════════════════════════════════════════════════════════ */

(function(){
  'use strict';

  // Respect user preferences and weak hardware
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lowPower = document.documentElement.classList.contains('low-power') ||
                   (navigator.hardwareConcurrency || 8) < 4 ||
                   (navigator.deviceMemory || 8) < 4;

  if (reducedMotion || lowPower){
    // Static fallback already styled via cinematic.css. No WebGL.
    return;
  }

  // Wait for first paint + a small idle slot before pulling Three.js (~150KB)
  function ready(fn){
    if (document.readyState === 'complete') fn();
    else window.addEventListener('load', fn);
  }

  function whenIdle(fn){
    if ('requestIdleCallback' in window){
      requestIdleCallback(fn, { timeout: 600 });
    } else {
      setTimeout(fn, 200);
    }
  }

  ready(() => whenIdle(loadThreeAndBoot));

  function loadThreeAndBoot(){
    if (window.THREE){ boot(); return; }
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
    s.async = true;
    s.onload = boot;
    s.onerror = () => { /* swallow · cinematic.css fallback already styles the page */ };
    document.head.appendChild(s);
  }

  function boot(){
    const canvas = document.getElementById('cn-canvas');
    if (!canvas || typeof THREE === 'undefined') return;

    const W = window.innerWidth, H = window.innerHeight;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x040406, 0.022);

    const camera = new THREE.PerspectiveCamera(48, W / H, 0.1, 1000);
    camera.position.set(0, 0, 38);

    const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x000000, 0);

    // Atmospheric dust · tuned down for sustained-session perf
    const pCount = window.innerWidth < 720 ? 600 : 1100;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(pCount * 3);
    const pCol = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++){
      pPos[i*3]     = (Math.random() - 0.5) * 90;
      pPos[i*3 + 1] = (Math.random() - 0.5) * 55;
      pPos[i*3 + 2] = (Math.random() - 0.5) * 75 - 10;
      const lime = Math.random() < 0.12;
      if (lime){
        pCol[i*3] = 0.78; pCol[i*3+1] = 1.0; pCol[i*3+2] = 0.37;
      } else {
        const g = 0.45 + Math.random() * 0.4;
        pCol[i*3] = g; pCol[i*3+1] = g; pCol[i*3+2] = g;
      }
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    pGeo.setAttribute('color', new THREE.BufferAttribute(pCol, 3));
    const pMat = new THREE.PointsMaterial({
      size: 0.085, vertexColors: true, transparent: true,
      opacity: 0.65, sizeAttenuation: true
    });
    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);

    // Artificial sun core (dark sphere)
    const sun = new THREE.Mesh(
      new THREE.SphereGeometry(8.5, 48, 48),
      new THREE.MeshBasicMaterial({ color: 0x06060a, transparent: true, opacity: 1 })
    );
    sun.position.set(0, 0, -25);
    scene.add(sun);

    // Corona ring
    const corona = new THREE.Mesh(
      new THREE.RingGeometry(8.5, 8.78, 128),
      new THREE.MeshBasicMaterial({
        color: 0xc8ff5e, transparent: true, opacity: 0.55, side: THREE.DoubleSide
      })
    );
    corona.position.set(0, 0, -25);
    scene.add(corona);

    // Outer halo
    const halo = new THREE.Mesh(
      new THREE.RingGeometry(9, 14, 64),
      new THREE.MeshBasicMaterial({
        color: 0xc8ff5e, transparent: true, opacity: 0.05, side: THREE.DoubleSide
      })
    );
    halo.position.set(0, 0, -26);
    scene.add(halo);

    // Vertical light shafts
    for (let i = 0; i < 4; i++){
      const shaft = new THREE.Mesh(
        new THREE.PlaneGeometry(0.4 + Math.random() * 1.4, 60),
        new THREE.MeshBasicMaterial({
          color: 0xc8ff5e, transparent: true,
          opacity: 0.022 + Math.random() * 0.025,
          side: THREE.DoubleSide, depthWrite: false
        })
      );
      shaft.position.set((Math.random() - 0.5) * 42, 0, -22 + Math.random() * 6);
      shaft.rotation.z = (Math.random() - 0.5) * 0.2;
      scene.add(shaft);
    }

    // Mouse parallax + scroll-driven camera
    let tx = 0, ty = 0, mx = 0, my = 0;
    let scrollY = 0, scrollTarget = 0;

    window.addEventListener('mousemove', (e) => {
      tx = (e.clientX / window.innerWidth - 0.5);
      ty = (e.clientY / window.innerHeight - 0.5);
    }, { passive: true });

    window.addEventListener('scroll', () => {
      scrollTarget = window.scrollY;
    }, { passive: true });

    // Intro dolly
    const startZ = 56, endZ = 38;
    camera.position.z = startZ;
    const t0 = performance.now();
    const dollyDur = 3.2;

    // Perf control · pause render when canvas scrolled off-screen + cap FPS at 30
    // (was 60 implicit · halving frame work saves significant GPU over a long session)
    let canvasVisible = true;
    if ('IntersectionObserver' in window){
      const io = new IntersectionObserver((entries) => {
        canvasVisible = entries[0].isIntersecting;
      }, { threshold: 0 });
      io.observe(canvas);
    }

    const FRAME_MS = 1000 / 30;
    let lastFrameTime = 0;
    let frame = 0;
    let rafHandle = 0;

    function animate(now){
      rafHandle = requestAnimationFrame(animate);
      // Skip render if canvas is off-screen · saves GPU when reading lower sections
      if (!canvasVisible) return;
      // FPS cap
      if (now - lastFrameTime < FRAME_MS) return;
      lastFrameTime = now;

      const elapsed = (now - t0) / 1000;
      frame++;
      mx += (tx - mx) * 0.04;
      my += (ty - my) * 0.04;
      scrollY += (scrollTarget - scrollY) * 0.08;

      if (elapsed < dollyDur){
        const k = elapsed / dollyDur;
        const eased = 1 - Math.pow(1 - k, 3);
        camera.position.z = startZ + (endZ - startZ) * eased;
      } else {
        camera.position.z = endZ + Math.sin(elapsed * 0.18) * 0.4 + scrollY * 0.004;
      }

      particles.rotation.y = frame * 0.0008 + mx * 0.15;
      particles.rotation.x = my * 0.08;
      particles.position.y = scrollY * 0.004;

      corona.rotation.z = frame * 0.003;
      halo.rotation.z = -frame * 0.0016;
      halo.scale.setScalar(1 + Math.sin(elapsed * 0.4) * 0.04);

      camera.position.x = mx * 1.4;
      camera.position.y = -my * 0.7 - scrollY * 0.002;
      camera.lookAt(0, 0, -10);

      renderer.render(scene, camera);
    }
    rafHandle = requestAnimationFrame(animate);

    // Resize handling
    let resizeT;
    window.addEventListener('resize', () => {
      clearTimeout(resizeT);
      resizeT = setTimeout(() => {
        const W2 = window.innerWidth, H2 = window.innerHeight;
        camera.aspect = W2 / H2; camera.updateProjectionMatrix();
        renderer.setSize(W2, H2);
      }, 120);
    });

    // Auto-pause when tab hidden (saves battery)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden){
        cancelAnimationFrame(rafHandle);
        rafHandle = 0;
      } else if (!rafHandle){
        lastFrameTime = 0;
        rafHandle = requestAnimationFrame(animate);
      }
    });
  }

  /* ─────────  Chapter markers · inject between sections  ───────── */
  ready(() => {
    const main = document.querySelector('main');
    if (!main) return;

    const trust = document.querySelector('section.trust');
    const cases = document.querySelector('section#case-studies, section.cases');
    const services = document.querySelector('section#services, section.services');
    const about = document.querySelector('section#about');
    const contact = document.querySelector('section.contact, section#contact');

    const lang = (document.documentElement.lang || 'en').slice(0, 2);
    const labels = (lang === 'fr') ? {
      live:    '02 · l\'engagement vivant',
      methods: '03 · la méthode',
      origin:  '04 · l\'origine',
      contact: '05 · prenons rendez-vous'
    } : {
      live:    '02 · live engagement',
      methods: '03 · the method',
      origin:  '04 · the origin',
      contact: '05 · let\'s talk'
    };

    function chapter(label, opts){
      const el = document.createElement('div');
      el.className = 'cn-chapter';
      if (opts && opts.warm) el.setAttribute('data-warm', '');
      el.textContent = label;
      return el;
    }

    if (cases && cases.parentNode){
      cases.parentNode.insertBefore(chapter(labels.live), cases);
    }
    if (services && services.parentNode){
      services.parentNode.insertBefore(chapter(labels.methods), services);
    }
    if (about && about.parentNode){
      about.parentNode.insertBefore(chapter(labels.origin), about);
    }
    if (contact && contact.parentNode){
      contact.parentNode.insertBefore(chapter(labels.contact), contact);
    }
  });

  /* ─────────  Section-fade-in on scroll  ───────── */
  ready(() => {
    if (!('IntersectionObserver' in window)) return;

    const els = document.querySelectorAll('section.case, section.service, section.contact, section.trust');
    els.forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(20px)';
      el.style.transition = 'opacity .9s ease-out, transform .9s cubic-bezier(.22,.61,.36,1)';
    });

    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting){
          e.target.style.opacity = '1';
          e.target.style.transform = 'translateY(0)';
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -10% 0px' });

    els.forEach(el => io.observe(el));
  });

})();
