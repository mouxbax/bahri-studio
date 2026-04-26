/* ═════════════════════════════════════════════════
   Moustafa Bahri — interactions
   ═════════════════════════════════════════════════ */

(() => {
  const supportsHover = window.matchMedia('(hover: hover)').matches;

  /* ─────────  LOW-POWER DETECTION  ───────── */
  // Auto-disable heavy effects on slow CPUs / low memory / reduced-motion users
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lowEnd = (navigator.hardwareConcurrency || 8) < 4 || (navigator.deviceMemory || 8) < 4;
  const lowPower = reducedMotion || lowEnd;
  if (lowPower) document.documentElement.classList.add('low-power');

  /* ─────────  CURSOR — single dot, instant, no rAF  ───────── */
  const dot = document.querySelector('.cursor-dot');
  if (dot && supportsHover && !lowPower) {
    window.addEventListener('pointermove', (e) => {
      dot.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%,-50%)`;
    }, { passive: true });
    document.querySelectorAll('a, button, .reveal-block, .service, .case-block').forEach(el => {
      el.addEventListener('pointerenter', () => dot.classList.add('is-hover'));
      el.addEventListener('pointerleave', () => dot.classList.remove('is-hover'));
    });
  } else if (dot) {
    dot.remove(); // no need to keep an invisible element on low-power
  }

  /* ─────────  REVEAL BLOCK SPOTLIGHT (rAF-throttled)  ───────── */
  document.querySelectorAll('.reveal-block').forEach(block => {
    let rafId = 0, mx = 0, my = 0;
    const apply = () => { rafId = 0; block.style.setProperty('--mx', mx+'px'); block.style.setProperty('--my', my+'px'); };
    block.addEventListener('pointerenter', () => block.style.setProperty('--reveal-size', '420px'));
    block.addEventListener('pointerleave', () => block.style.setProperty('--reveal-size', '0px'));
    block.addEventListener('pointermove', (e) => {
      const r = block.getBoundingClientRect();
      mx = e.clientX - r.left;
      my = e.clientY - r.top;
      if (!rafId) rafId = requestAnimationFrame(apply);
    }, { passive: true });
  });

  // Magnetic title transforms removed — they ran on every pointermove and weren't worth the cost.
  // Grain canvas removed entirely — body has a subtle CSS noise via background-image.

  /* ─────────  COUNT-UP STATS (on scroll into view)  ───────── */
  const animateCount = (el) => {
    const target = parseInt(el.dataset.count, 10);
    if (isNaN(target)) return;
    const start = performance.now();
    const dur = 1100;
    const from = 0;
    const step = (t) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(from + (target - from) * eased).toString();
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      if (e.target.dataset.count !== undefined) animateCount(e.target);
      e.target.classList.add('in');
      io.unobserve(e.target);
    });
  }, { threshold: 0.4 });

  document.querySelectorAll('[data-count]').forEach(el => io.observe(el));

  /* ─────────  GSAP SCROLL REVEALS  ───────── */
  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);

    gsap.from('.hero-title .word', {
      y: 90,
      opacity: 0,
      duration: 1.1,
      ease: 'power3.out',
      stagger: 0.08,
      delay: 0.1,
    });

    gsap.from('.hero-sub, .hero-stats, .hero-cta', {
      y: 30,
      opacity: 0,
      duration: 0.9,
      ease: 'power2.out',
      stagger: 0.12,
      delay: 0.5,
    });

    gsap.utils.toArray('.case').forEach((c) => {
      gsap.from(c.querySelector('.case-body'), {
        y: 40,
        opacity: 0,
        duration: 0.9,
        ease: 'power2.out',
        scrollTrigger: { trigger: c, start: 'top 75%', once: true },
      });
      gsap.from(c.querySelector('.case-num'), {
        scale: 0.4,
        opacity: 0,
        duration: 1.1,
        ease: 'power3.out',
        scrollTrigger: { trigger: c, start: 'top 80%', once: true },
      });
    });

    gsap.utils.toArray('.section-head, .service, .about-lead, .contact-headline').forEach((el) => {
      gsap.from(el, {
        y: 30,
        opacity: 0,
        duration: 0.9,
        ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 85%', once: true },
      });
    });
  }

  /* ─────────  i18n  ───────── */
  const I18N = {
    en: {
      'nav.work': 'Work', 'nav.about': 'About', 'nav.services': 'Services', 'nav.cta': 'Book audit →',
      'hero.meta': 'Available · April 2026 · 1 retainer slot',
      'hero.role': 'Google & Meta Ads Strategist · Paid Media & Growth Marketing · Paris',
      'hero.sub': '<span class="hl">Google Ads · Meta Ads · UX/UI</span> for international startups entering France. 9&nbsp;years. €10–100K monthly budgets. <span class="hl">47× peak ROAS</span>, GA4 + GTM tracked, Looker&nbsp;Studio reported.',
      'stat.years': 'years', 'stat.spend': 'monthly ad spend handled',
      'stat.cases': 'case studies below', 'stat.langs': 'languages · AR · EN · FR',
      'hero.cta1': 'Book a 15-min audit', 'hero.cta2': 'See the work', 'hero.scroll': 'scroll',
      'trust.label': 'trusted by',
      'cases.tag': '01 — selected work',
      'cases.title': 'Four cases. Two disciplines. One brain.',
      'cases.sub': 'Hover the cards. The numbers are hiding in the dark.',
      'about.tag': '02 — about',
      'about.title': 'One brain. Both sides of the funnel.',
      'about.lead': 'Paid Media and the landing page are one product. Same brain on both sides &mdash; <span class="hl">CPA drops, ROAS compounds.</span>',
      'about.p1': '<strong>9+&nbsp;years</strong> · <strong>Google &amp; Meta Ads Strategist</strong> · <strong>10–100K€ monthly budgets</strong>. Tracking on <span class="kw">GTM</span> + <span class="kw">Conversions API</span>. Reporting on <span class="kw">Looker Studio</span>. Every euro measured.',
      'about.p2': 'Last 12 months in numbers: <strong>47×</strong> peak ROAS, <strong>+63%</strong> YoY revenue on a flagship account, <strong>€0.18</strong> blended CPC at scale, <strong>71%</strong> of paid traffic = mine.',
      'about.p3': 'Google Data Analyst certified. Master · International Business · USGCI Paris. Trilingual: AR · EN · FR. Limited slots per quarter.',
      'about.meta': 'Paris 75011 · Arabic / English / French · Available immediately · Île-de-France &amp; Europe.',
      'about.trackCta': 'View full track record',
      'track.tag': '/ track record',
      'track.back': 'Back to bahri.studio',
      'track.sub': 'From an in-house EMEA lead in Beirut to running multi-million-euro paid funnels in Paris. Every role taught me a piece of the same skill — turning ad spend into revenue.',
      'track.cta': 'Book a 15-min audit',
      'track.home': 'Back to portfolio',
      'services.tag': '03 — services', 'services.title': 'Three ways to work together.',
      'services.sub': 'Paid Media · Tracking · CRO · UX/UI. Three depths · one stack.',
      'svc1.title': 'Audit & Strategy',
      'svc1.body': 'Full account &amp; landing-page audit. Written report · prioritized fix list · 30-min Loom.',
      'svc1.l1': 'Account, tracking &amp; <span class="kw">GA4 / GTM</span> review',
      'svc1.l2': 'Page-by-page conversion &amp; <span class="kw">CRO</span> review',
      'svc1.l3': '90-day action plan with <span class="kw">ROAS</span> targets',
      'svc1.cta': 'Book audit →',
      'svc2.title': 'Full Campaign Build', 'svc2.flag': 'most picked',
      'svc2.body': 'Zero → launch. Keyword research · account structure · ad copy · full <span class="kw">tracking stack</span> (<span class="kw">GTM</span>, <span class="kw">Conversions API</span>, <span class="kw">attribution</span>) · landing-page UX/UI. Live, instrumented account.',
      'svc2.l1': 'Account &amp; <span class="kw">conversion tracking</span> setup',
      'svc2.l2': 'Ad copy + creative direction',
      'svc2.l3': 'Landing-page UX/UI review',
      'svc2.l4': '2 weeks of post-launch tuning',
      'svc2.cta': 'Start build →',
      'svc3.title': 'Monthly Retainer',
      'svc3.body': 'Ongoing <span class="kw">Paid Media</span> + product. Ads run, funnel watched in <span class="kw">Looker Studio</span>, UX fixes shipped on data signal.',
      'svc3.l1': 'Weekly <span class="kw">ROAS / CPA</span> optimization',
      'svc3.l2': 'Monthly performance review',
      'svc3.l3': '<span class="kw">CRO</span> &amp; <span class="kw">A/B testing</span> included',
      'svc3.l4': '3-month minimum',
      'svc3.cta': 'Talk retainer →',
      'contact.tag': '04 — let\'s talk',
      'contact.h1': 'Let\'s read', 'contact.h2': 'what your data says.',
      'contact.sub': '15 minutes. Screen-share on your account. You leave with 3 numbers and 3 next moves.',
      'contact.cta1': 'Book on Calendly', 'contact.cta2': 'moustafabahri@gmail.com',
      'contact.meta': 'Replying within 24h · Mon–Fri · Paris (CET)',
    },
    fr: {
      'nav.work': 'Projets', 'nav.about': 'À propos', 'nav.services': 'Prestations', 'nav.cta': 'Réserver un audit →',
      'hero.meta': 'Disponible · Avril 2026 · 1 slot retainer',
      'hero.role': 'Consultant Google & Meta Ads · Paid Media & Growth Marketing · Paris',
      'hero.sub': '<span class="hl">Google Ads · Meta Ads · UX/UI</span> pour startups internationales sur le marché français. 9&nbsp;ans. budgets 10–100K€/mois. <span class="hl">ROAS jusqu\'à 47×</span>, tracking GA4 + GTM, reporting Looker&nbsp;Studio.',
      'stat.years': 'ans', 'stat.spend': 'budget pub mensuel piloté',
      'stat.cases': 'cas clients ci-dessous', 'stat.langs': 'langues · AR · EN · FR',
      'hero.cta1': 'Réserver un audit de 15 min', 'hero.cta2': 'Voir le travail', 'hero.scroll': 'scroll',
      'trust.label': 'ils m\'ont fait confiance',
      'cases.tag': '01 — sélection de projets',
      'cases.title': 'Quatre cas. Deux disciplines. Un cerveau.',
      'cases.sub': 'Survolez les cartes. Les chiffres sont cachés dans l\'ombre.',
      'about.tag': '02 — à propos',
      'about.title': 'Un cerveau. Les deux côtés du funnel.',
      'about.lead': 'Le Paid Media et la landing page sont un seul produit. Même cerveau des deux côtés &mdash; <span class="hl">le CPA baisse, le ROAS compose.</span>',
      'about.p1': '<strong>9+&nbsp;ans</strong> · <strong>Consultant Google &amp; Meta Ads</strong> · <strong>budgets 10–100K€/mois</strong>. Tracking <span class="kw">GTM</span> + <span class="kw">Conversions API</span>. Reporting <span class="kw">Looker Studio</span>. Chaque euro mesuré.',
      'about.p2': 'Les 12 derniers mois en chiffres : <strong>47×</strong> ROAS pic, <strong>+63%</strong> de revenus YoY sur un compte phare, <strong>€0,18</strong> CPC moyen à l\'échelle, <strong>71%</strong> du trafic payant = moi.',
      'about.p3': 'Certifié Google Data Analyst. Master · International Business · USGCI Paris. Trilingue : AR · EN · FR. Slots limités par trimestre.',
      'about.meta': 'Paris 75011 · Arabe / Anglais / Français · Disponible immédiatement · Île-de-France &amp; Europe.',
      'about.trackCta': 'Voir tout le parcours',
      'track.tag': '/ parcours',
      'track.back': 'Retour à bahri.studio',
      'track.sub': 'D\'EMEA Lead in-house à Beyrouth à piloter des funnels paid à plusieurs millions d\'euros à Paris. Chaque rôle m\'a appris une partie du même métier — transformer du budget pub en revenus.',
      'track.cta': 'Réserver un audit de 15 min',
      'track.home': 'Retour au portfolio',
      'services.tag': '03 — prestations', 'services.title': 'Trois façons de travailler ensemble.',
      'services.sub': 'Paid Media · Tracking · CRO · UX/UI. Trois profondeurs · une stack.',
      'svc1.title': 'Audit & Stratégie',
      'svc1.body': 'Audit complet du compte &amp; des landing pages. Rapport écrit · liste de fixes priorisée · Loom de 30 min.',
      'svc1.l1': 'Audit compte, tracking &amp; <span class="kw">GA4 / GTM</span>',
      'svc1.l2': 'Revue de conversion &amp; <span class="kw">CRO</span> page par page',
      'svc1.l3': 'Plan d\'action 90 jours avec objectifs <span class="kw">ROAS</span>',
      'svc1.cta': 'Réserver l\'audit →',
      'svc2.title': 'Build complet de campagne', 'svc2.flag': 'le plus choisi',
      'svc2.body': 'Zéro → lancement. Recherche de mots-clés · structure du compte · copy · <span class="kw">stack tracking</span> complet (<span class="kw">GTM</span>, <span class="kw">Conversions API</span>, <span class="kw">attribution</span>) · UX/UI de la landing. Compte live, instrumenté.',
      'svc2.l1': 'Setup compte &amp; <span class="kw">tracking de conversion</span>',
      'svc2.l2': 'Ad copy + direction créative',
      'svc2.l3': 'Revue UX/UI de la landing page',
      'svc2.l4': '2 semaines de tuning post-lancement',
      'svc2.cta': 'Lancer le build →',
      'svc3.title': 'Retainer mensuel',
      'svc3.body': '<span class="kw">Paid Media</span> + produit en continu. Ads pilotées, funnel surveillé sur <span class="kw">Looker Studio</span>, fixes UX shippés au signal data.',
      'svc3.l1': 'Optimisation hebdo <span class="kw">ROAS / CPA</span>',
      'svc3.l2': 'Revue de performance mensuelle',
      'svc3.l3': '<span class="kw">CRO</span> &amp; <span class="kw">A/B tests</span> inclus',
      'svc3.l4': 'Engagement minimum 3 mois',
      'svc3.cta': 'Discuter retainer →',
      'contact.tag': '04 — on en parle',
      'contact.h1': 'Lisons', 'contact.h2': 'ce que vos données disent.',
      'contact.sub': '15 minutes. Screen-share sur votre compte. Vous repartez avec 3 chiffres et 3 prochaines actions.',
      'contact.cta1': 'Réserver sur Calendly', 'contact.cta2': 'moustafabahri@gmail.com',
      'contact.meta': 'Réponse sous 24h · Lun–Ven · Paris (CET)',
    },
  };
  I18N.ar = I18N.en; // AR copy not yet translated — graceful fallback

  const applyLang = (lang) => {
    const dict = I18N[lang] || I18N.en;
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const k = el.dataset.i18n;
      if (dict[k] !== undefined) el.innerHTML = dict[k];
    });
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
  };

  document.querySelectorAll('.lang-toggle button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.lang-toggle button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      applyLang(btn.dataset.lang);
    });
  });

})();
