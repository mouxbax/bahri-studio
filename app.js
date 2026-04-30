/* ═════════════════════════════════════════════════
   Moustafa Bahri · interactions
   ═════════════════════════════════════════════════ */

(() => {
  const supportsHover = window.matchMedia('(hover: hover)').matches;

  /* ─────────  LOW-POWER DETECTION  ───────── */
  // Auto-disable heavy effects on slow CPUs / low memory / reduced-motion users
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lowEnd = (navigator.hardwareConcurrency || 8) < 4 || (navigator.deviceMemory || 8) < 4;
  const lowPower = reducedMotion || lowEnd;
  if (lowPower) document.documentElement.classList.add('low-power');

  /* ─────────  CURSOR · instant dot + lerping halo, rAF only while moving  ───────── */
  const dot  = document.querySelector('.cursor-dot');
  const spot = document.querySelector('.cursor-spot');
  if (supportsHover && !lowPower && dot && spot) {
    let tx = window.innerWidth / 2, ty = window.innerHeight / 2;
    let sx = tx, sy = ty;
    let rafActive = false, lastMove = 0;

    const tick = () => {
      sx += (tx - sx) * 0.20;
      sy += (ty - sy) * 0.20;
      spot.style.transform = `translate3d(${sx}px, ${sy}px, 0) translate(-50%,-50%)`;
      const settled = Math.abs(tx - sx) < 0.4 && Math.abs(ty - sy) < 0.4;
      if (settled && performance.now() - lastMove > 220) { rafActive = false; return; }
      requestAnimationFrame(tick);
    };

    window.addEventListener('pointermove', (e) => {
      tx = e.clientX; ty = e.clientY;
      lastMove = performance.now();
      // Dot is INSTANT · written directly on every move, no rAF wait
      dot.style.transform = `translate3d(${tx}px, ${ty}px, 0) translate(-50%,-50%)`;
      if (!rafActive) { rafActive = true; requestAnimationFrame(tick); }
    }, { passive: true });

    document.querySelectorAll('a, button, .reveal-block, .service, .case-block, [data-magnetic]').forEach(el => {
      el.addEventListener('pointerenter', () => dot.classList.add('is-hover'));
      el.addEventListener('pointerleave', () => dot.classList.remove('is-hover'));
    });
  } else {
    dot && dot.remove();
    spot && spot.remove();
  }

  /* ─────────  MAGNETIC HERO TITLE · rAF-throttled, radius-bounded  ───────── */
  if (supportsHover && !lowPower) {
    document.querySelectorAll('[data-magnetic]').forEach(el => {
      const strength = 6;
      const radius = 280;
      let raf = 0, dx = 0, dy = 0, w = 1, h = 1;
      const apply = () => { raf = 0; el.style.transform = `translate3d(${dx}px, ${dy}px, 0)`; };
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        w = r.width; h = r.height;
        const cx = r.left + w / 2, cy = r.top + h / 2;
        const ddx = e.clientX - cx, ddy = e.clientY - cy;
        const dist = Math.hypot(ddx, ddy);
        if (dist > radius) { dx = 0; dy = 0; }
        else {
          const f = 1 - dist / radius;
          dx = (ddx / w) * strength * f;
          dy = (ddy / h) * strength * f;
        }
        if (!raf) raf = requestAnimationFrame(apply);
      }, { passive: true });
      el.addEventListener('pointerleave', () => {
        el.style.transition = 'transform .5s cubic-bezier(.2,.8,.3,1)';
        el.style.transform = '';
        setTimeout(() => { el.style.transition = ''; }, 500);
      });
    });
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

  // Magnetic title transforms removed · they ran on every pointermove and weren't worth the cost.
  // Grain canvas removed entirely · body has a subtle CSS noise via background-image.

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

  /* ─────────  ENTRY ANIMATIONS · IntersectionObserver + CSS, no GSAP  ───────── */
  // Tag everything that should fade-up on scroll
  const fadeTargets = document.querySelectorAll(
    '.section-head, .case-body, .service, .about-lead, .contact-headline, .case-num, .track-li, .track-card, [data-count]'
  );
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      if (e.target.dataset.count !== undefined) animateCount(e.target);
      e.target.classList.add('in');
      io.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });
  fadeTargets.forEach(el => { el.classList.add('reveal'); io.observe(el); });

  /* ─────────  PAUSE keyword marquee when off-screen  ───────── */
  const marquee = document.querySelector('.kw-marquee .kw-track');
  if (marquee) {
    const mq = new IntersectionObserver(([entry]) => {
      marquee.style.animationPlayState = entry.isIntersecting ? 'running' : 'paused';
    });
    mq.observe(document.querySelector('.kw-marquee'));
  }

  /* ─────────  i18n  ───────── */
  const I18N = {
    en: {
      'nav.work': 'Work', 'nav.about': 'About', 'nav.services': 'Services', 'nav.insights': 'Insights', 'nav.faq': 'FAQ', 'nav.cta': 'Book audit →',
      'hero.meta': 'Available · April 2026 · accepting new partnerships',
      'hero.role': 'Google & Meta Ads Strategist · Paid Media · Digital Transformation · Paris',
      'hero.sub': '<span class="hl">Google Ads · Meta Ads · UX/UI · Digital Transformation</span> for international startups entering France. 9&nbsp;years. €10–100K monthly budgets. <span class="hl">47× peak ROAS</span>, GA4 + GTM tracked, Looker&nbsp;Studio reported.',
      'stat.years': 'years', 'stat.spend': 'monthly ad spend handled',
      'stat.cases': 'case studies below', 'stat.langs': 'languages · EN · FR',
      'hero.cta1': 'Book a 30-min audit', 'hero.cta2': 'See the work', 'hero.scroll': 'scroll',
      'trust.label': 'trusted by',
      'cases.tag': '01 · selected work',
      'cases.title': 'Four cases. Two disciplines. One brain.',
      'cases.sub': 'Hover the cards. The numbers are hiding in the dark.',
      'about.tag': '02 · about',
      'about.title': 'One brain. Both sides of the funnel.',
      'about.lead': 'Paid Media and the landing page are one product. Same brain on both sides &mdash; <span class="hl">CPA drops, ROAS compounds.</span>',
      'about.p1': '<strong>9+&nbsp;years</strong> · <strong>Google &amp; Meta Ads Strategist</strong> · <strong>10–100K€ monthly budgets</strong>. Tracking on <span class="kw">GTM</span> + <span class="kw">Conversions API</span>. Reporting on <span class="kw">Looker Studio</span>. Every euro measured.',
      'about.p2': 'Last 12 months in numbers: <strong>47×</strong> peak ROAS, <strong>+63%</strong> YoY revenue on a flagship account, <strong>€0.18</strong> blended CPC at scale, <strong>71%</strong> of paid traffic = mine.',
      'about.p3': 'Google Data Analyst certified. Master · International Business · USGCI Paris. Trilingual: AR · EN · FR. Limited slots per quarter.',
      'about.meta': 'Paris 75011 · Arabic / English / French · Available immediately · Île-de-France &amp; Europe.',
      'about.trackCta': 'View full track record',
      'track.tag': '/ track record',
      'track.back': 'Back to bahri.studio',
      'track.sub': 'From an in-house EMEA lead in Beirut to running multi-million-euro paid funnels in Paris. Every role taught me a piece of the same skill · turning ad spend into revenue.',
      'track.cta': 'Book a 30-min audit',
      'track.home': 'Back to portfolio',
      'services.tag': '03 · services', 'services.title': 'Three depths. One operator.',
      'services.sub': 'Paid Media · Tracking · UX/UI · SEO + AIO · Product. Pick the depth your funnel deserves.',
      'svc.from': 'from',
      'svc.perMo': '/ mo',
      'svc.cta':  'Get scope →',
      'svc1.title': 'Audit & Strategy',
      'svc1.body': 'Diagnostic across <span class="kw">Paid Media</span>, the tracking stack, landing pages, and the <span class="kw">SEO + AIO</span> surface. You get the truth, prioritized.',
      'svc1.l1': 'Account · <span class="kw">GA4</span> · <span class="kw">GTM</span> · <span class="kw">Conversions API</span> audit',
      'svc1.l2': 'Page-by-page UX + <span class="kw">CRO</span> review',
      'svc1.l3': '90-day action plan with <span class="kw">ROAS</span> targets',
      'svc2.title': 'Full-Stack Build',
      'svc2.body': 'Zero → launch. Account structure · ad copy · full <span class="kw">tracking stack</span> · landing-page UX/UI · <span class="kw">SEO + AIO</span> copy. Live, instrumented system you own.',
      'svc2.l1': 'Account &amp; <span class="kw">conversion tracking</span> setup',
      'svc2.l2': 'Ad copy + creative direction',
      'svc2.l3': 'Landing-page UX/UI + hand-coded build',
      'svc2.l4': '<span class="kw">SEO + AIO</span> copy + structured data',
      'svc2.l5': '2 weeks of post-launch tuning',
      'svc3.title': 'Digital Transformation',
      'svc3.flag':  'flagship',
      'svc3.body':  'Acting as your <strong>fractional Head of Digital + Product</strong>. Same scope I run on the flagship FR account: Paid Media, the measurement layer, UX/UI of site &amp; app, the <span class="kw">SEO + AIO</span> copy, and the roadmap that connects them.',
      'svc3.l1': 'Paid Media · Google · Meta · LinkedIn',
      'svc3.l2': 'Tracking infra · <span class="kw">GA4</span> · <span class="kw">GTM</span> · <span class="kw">Conversions API</span> · server-side',
      'svc3.l3': 'UX/UI of website + mobile app',
      'svc3.l4': '<span class="kw">SEO + AIO</span> copy + full-site audit',
      'svc3.l5': 'Product roadmap + dev partnership',
      'svc3.l6': 'Quarterly OKRs · weekly delivery · monthly board reporting',
      'svc3.l7': '3-month minimum',
      'svc3.usedBy': 'Used on the flagship FR account ↗',
      'svc.usedFor': 'Used on the flagship FR account ↗',
      'contact.tag': '04 · let\'s talk',
      'contact.h1': 'Let\'s read', 'contact.h2': 'what your data says.',
      'contact.sub': '15 minutes. Screen-share on your account. You leave with 3 numbers and 3 next moves.',
      'contact.cta1': 'Book on Calendly', 'contact.cta2': 'contact@bahri.studio',
      'contact.meta': 'Replying within 24h · Mon–Fri · Paris (CET)',

      // shared UI
      'ui.inProgress': 'in progress',
      'ui.reveal':     'cursor ↻ reveals',
      'badge.own':     'own',
      'badge.live':    'live',

      // case-study block labels
      'block.brief':    'Brief',
      'block.starting': 'Starting state',
      'block.approach': 'Approach',
      'block.results':  'Results',
      'block.outcome':  'Outcome',
      'block.stack':    'Stack',
      'block.stage':    'Stage',
      'block.what':     'What it is',
      'block.why':      'Why it matters here',

      // case 1 · I Dom You
      'c1.tag':  'live engagement',
      'c1.d1':   'Google Ads',
      'c1.d2':   'Meta · LinkedIn',
      'c1.d3':   'Product · UX/UI',
      'c1.role': '<strong>Head of Digital Marketing &amp; Product.</strong> Both sides at once · 3 ad platforms (Google · Meta · LinkedIn) AND <strong>full product development &amp; management</strong> of the website &amp; mobile app, redesigned and re-engineered end-to-end.',
      'c1.hm1':  'ROAS · Search High Intent',
      'c1.hm2':  'YoY revenue · April vs prior year',
      'c1.hm3':  'of all customer traffic = mine',
      'c1.startingP': '12 active campaigns · 3 platforms. 4 campaigns at sub-2× ROAS. <span class="kw">Conversions API</span> ↔ Stripe handoff incomplete · merci-page event missing.',
      'c1.approachP': 'Took <strong>end-to-end ownership</strong> of the Paid Media architecture <em>and</em> the product surface it feeds. Re-segmented a fragmented 12-campaign account into a 3-tier funnel-aligned system (High-Intent · Brand · Geo). Reallocated <strong>€1,500+</strong> into top-quartile auctions and instated a negative-keyword governance loop. Rebuilt the full <span class="kw">measurement layer</span> · <span class="kw">GA4</span>, <span class="kw">GTM</span>, <span class="kw">Conversions API</span>, server-side handoff into Stripe · so revenue attribution is closed-loop, not modeled. <strong>On the product side:</strong> drove the full website redesign and the mobile-app overhaul as Product lead · wireframes, IA, copy, dev partnership, ship.',
      'c1.ctaOld':   'Their new site is coming soon',
      'c1.ctaBuild': 'new website under construction',
      'c1.m1': 'ROAS · Search High Intent FR',
      'c1.m2': 'incremental revenue · 24 days',
      'c1.m3': 'CPC · 18,387 clicks',
      'c1.m4': 'paying customers YoY',
      'c1.stackP': 'Google Ads · Meta Ads · LinkedIn Ads · GA4 · GTM · <span class="kw">Conversions API</span> · Stripe attribution · Looker Studio · Figma (UX/UI) · hand-written HTML/CSS for landing pages · <span class="kw">SEO + AIO</span> copywriting and full-site audit · Claude / AI-assisted ops',
      'c1.ctaLive': 'live · 859K impressions delivered',

      // case 2 · Parlons Cash
      'c2.tag':  'podcast · finance FR',
      'c2.d1':   'UX/UI design + audit',
      'c2.d2':   'SEO + AIO writing',
      'c2.d3':   'Front-end',
      'c2.d4':   'Studio outreach',
      'c2.role': '<strong>Solo build, end-to-end.</strong> A French personal-finance podcast had reach in audio but no digital home. I designed it, wrote it, coded it, audited it, and started landing studios.',
      'c2.briefP':    'Turn a podcast brand into a discoverable, monetizable web property. No agency. No team. <strong>One operator, full stack.</strong>',
      'c2.approachP': 'Designed the full UX/UI in <span class="kw">Figma</span> from blank canvas · IA, hierarchy, conversion path. Hand-wrote the front-end HTML/CSS. Wrote every line of on-page copy with a dual <span class="kw">SEO + AIO</span> lens · structured for Google rankings <em>and</em> for AI Overviews / Perplexity / ChatGPT answer panels. Ran a full pre- and post-launch audit (Core Web Vitals, structured data, internal linking). <strong>Reached out directly to podcast studios</strong> to source guest crossovers and sponsorship leads.',
      'c2.m1': 'solo · design → code → copy → outreach',
      'c2.m2': 'structured for AI answer panels',
      'c2.m3': 'studio partnerships in pipeline',
      'c2.stackP': 'Figma (UX/UI design + audit) · hand-written HTML/CSS · <span class="kw">SEO + AIO</span> copywriting · structured data (JSON-LD) · Core Web Vitals audit · Plausible · podcast-studio outreach',

      // case 3 · ProToreMane
      'c3.tag':  'FR → JP · sport-tech',
      'c3.d1':   'Globalization lead',
      'c3.d2':   'Market research',
      'c3.d3':   'SEO architecture',
      'c3.d4':   'Digital go-to-market',
      'c3.role': '<strong>Globalization lead.</strong> Took a French sport-tech product into the Japanese market. Market research, SEO foundation, and the full digital go-to-market plan · built before a single yen is spent.',
      'c3.briefP':    'Open the Japanese market for a French sport-tech app · not as a translation, as a culturally native product. Required deep <strong>market research</strong> on the JP sport-tech category, competitor mapping, JP search behavior, and a launch sequence the founders could execute.',
      'c3.approachP': 'Led full <span class="kw">market research</span> on the Japanese sport-tech space: category sizing, competitor benchmark, audience segmentation, JP-language search-intent mapping. Designed the <span class="kw">SEO architecture</span> · keyword strategy, structured data, on-site information architecture for both languages. Authored the <strong>complete digital go-to-market plan</strong>: Paid Media phasing, organic growth roadmap, partnership pipeline, KPI tree. Aligned product, engineering, and creative around launch milestones.',
      'c3.m1': 'research &amp; positioning locked',
      'c3.m2': 'bilingual architecture · structured data',
      'c3.m3': 'paid · organic · partnerships sequenced',
      'c3.m4': 'awaiting app release',
      'c3.stackP': 'Market research · competitor benchmark · JP-language keyword research · SEO architecture · structured data · digital go-to-market plan · localization strategy · Figma · Claude / AI-assisted research ops',
      'c3.ctaPending': 'app pre-launch',

      // case 4 · AIAH
      'c4.tag':  'my product',
      'c4.d1':   'Founder',
      'c4.d2':   'Built live',
      'c4.role': 'The marketer-turned-founder arc. I own this one · building it in public.',
      'c4.whatP': 'AIAH · an <strong>AI life companion</strong> that coaches your schedule, meals, budget, and social confidence through daily check-ins and smart nudges, turning your goals into a system you actually follow.',
      'c4.whyP':  '9 years optimizing other people\'s funnels taught me what the page must do. AIAH is where I apply that to my own.',
      'c4.m1Num': 'live build',
      'c4.m1':    'in progress',
      'c4.visit': 'visit aiah →',
      'c4.stackP':'Next.js · Stripe · i18n · the rest TBA',
      'c4.cta':   'Visit aiah.app',

      // footer
      'footer.mid':      '— Built live, by hand —',
      'footer.location': 'Paris · Last updated',
    },
    fr: {
      'nav.work': 'Projets', 'nav.about': 'À propos', 'nav.services': 'Prestations', 'nav.insights': 'Insights', 'nav.faq': 'FAQ', 'nav.cta': 'Réserver un audit →',
      'hero.meta': 'Disponible · Avril 2026 · partenariats ouverts',
      'hero.role': 'Consultant Google & Meta Ads · Paid Media · Transformation Digitale · Paris',
      'hero.sub': '<span class="hl">Google Ads · Meta Ads · UX/UI · Transformation Digitale</span> pour startups internationales sur le marché français. 9&nbsp;ans. budgets 10–100K€/mois. <span class="hl">ROAS jusqu\'à 47×</span>, tracking GA4 + GTM, reporting Looker&nbsp;Studio.',
      'stat.years': 'ans', 'stat.spend': 'budget pub mensuel piloté',
      'stat.cases': 'cas clients ci-dessous', 'stat.langs': 'langues · EN · FR',
      'hero.cta1': 'Réserver un audit de 30 min', 'hero.cta2': 'Voir le travail', 'hero.scroll': 'scroll',
      'trust.label': 'ils m\'ont fait confiance',
      'cases.tag': '01 · sélection de projets',
      'cases.title': 'Quatre cas. Deux disciplines. Un cerveau.',
      'cases.sub': 'Survolez les cartes. Les chiffres sont cachés dans l\'ombre.',
      'about.tag': '02 · à propos',
      'about.title': 'Un cerveau. Les deux côtés du funnel.',
      'about.lead': 'Le Paid Media et la landing page sont un seul produit. Même cerveau des deux côtés &mdash; <span class="hl">le CPA baisse, le ROAS compose.</span>',
      'about.p1': '<strong>9+&nbsp;ans</strong> · <strong>Consultant Google &amp; Meta Ads</strong> · <strong>budgets 10–100K€/mois</strong>. Tracking <span class="kw">GTM</span> + <span class="kw">Conversions API</span>. Reporting <span class="kw">Looker Studio</span>. Chaque euro mesuré.',
      'about.p2': 'Les 12 derniers mois en chiffres : <strong>47×</strong> ROAS pic, <strong>+63%</strong> de revenus YoY sur un compte phare, <strong>€0,18</strong> CPC moyen à l\'échelle, <strong>71%</strong> du trafic payant = moi.',
      'about.p3': 'Certifié Google Data Analyst. Master · International Business · USGCI Paris. Trilingue : AR · EN · FR. Slots limités par trimestre.',
      'about.meta': 'Paris 75011 · Arabe / Anglais / Français · Disponible immédiatement · Île-de-France &amp; Europe.',
      'about.trackCta': 'Voir tout le parcours',
      'track.tag': '/ parcours',
      'track.back': 'Retour à bahri.studio',
      'track.sub': 'D\'EMEA Lead in-house à Beyrouth à piloter des funnels paid à plusieurs millions d\'euros à Paris. Chaque rôle m\'a appris une partie du même métier · transformer du budget pub en revenus.',
      'track.cta': 'Réserver un audit de 30 min',
      'track.home': 'Retour au portfolio',
      'services.tag': '03 · prestations', 'services.title': 'Trois profondeurs. Un opérateur.',
      'services.sub': 'Paid Media · Tracking · UX/UI · SEO + AIO · Produit. Choisissez la profondeur que votre funnel mérite.',
      'svc.from': 'à partir de',
      'svc.perMo': '/ mois',
      'svc.cta':  'Demander le scope →',
      'svc1.title': 'Audit & Stratégie',
      'svc1.body': 'Diagnostic complet : <span class="kw">Paid Media</span>, stack tracking, landing pages et surface <span class="kw">SEO + AIO</span>. Vous repartez avec la vérité, priorisée.',
      'svc1.l1': 'Audit compte · <span class="kw">GA4</span> · <span class="kw">GTM</span> · <span class="kw">Conversions API</span>',
      'svc1.l2': 'Revue UX + <span class="kw">CRO</span> page par page',
      'svc1.l3': 'Plan d\'action 90 jours avec objectifs <span class="kw">ROAS</span>',
      'svc2.title': 'Build full-stack',
      'svc2.body': 'Zéro → lancement. Structure du compte · ad copy · <span class="kw">stack tracking</span> complète · UX/UI landing-page · copy <span class="kw">SEO + AIO</span>. Système live, instrumenté, qui vous appartient.',
      'svc2.l1': 'Setup compte &amp; <span class="kw">tracking de conversion</span>',
      'svc2.l2': 'Ad copy + direction créative',
      'svc2.l3': 'UX/UI landing-page + intégration HTML/CSS à la main',
      'svc2.l4': 'Copy <span class="kw">SEO + AIO</span> + données structurées',
      'svc2.l5': '2 semaines de tuning post-lancement',
      'svc3.title': 'Transformation Digitale',
      'svc3.flag':  'flagship',
      'svc3.body':  'En tant que <strong>Head of Digital + Produit fractionné</strong>. Même périmètre que sur le compte phare FR : Paid Media, couche de mesure, UX/UI site &amp; app, copy <span class="kw">SEO + AIO</span>, et la roadmap qui relie tout ça.',
      'svc3.l1': 'Paid Media · Google · Meta · LinkedIn',
      'svc3.l2': 'Infra tracking · <span class="kw">GA4</span> · <span class="kw">GTM</span> · <span class="kw">Conversions API</span> · server-side',
      'svc3.l3': 'UX/UI du site + app mobile',
      'svc3.l4': 'Copy <span class="kw">SEO + AIO</span> + audit full-site',
      'svc3.l5': 'Roadmap produit + partenariat dev',
      'svc3.l6': 'OKRs trimestriels · livraison hebdo · reporting mensuel niveau board',
      'svc3.l7': 'Engagement minimum 3 mois',
      'svc3.usedBy': 'Utilisé sur le compte phare FR ↗',
      'svc.usedFor': 'Utilisé sur le compte phare FR ↗',
      // legacy keys kept just in case any other DOM uses them — harmless duplicates
      'svc3.l1_legacy': 'Optimisation hebdo <span class="kw">ROAS / CPA</span>',
      'svc3.l2': 'Revue de performance mensuelle',
      'svc3.l3': '<span class="kw">CRO</span> &amp; <span class="kw">A/B tests</span> inclus',
      'svc3.l4': 'Engagement minimum 3 mois',
      'svc3.cta': 'Discuter retainer →',
      'contact.tag': '04 · on en parle',
      'contact.h1': 'Lisons', 'contact.h2': 'ce que vos données disent.',
      'contact.sub': '15 minutes. Screen-share sur votre compte. Vous repartez avec 3 chiffres et 3 prochaines actions.',
      'contact.cta1': 'Réserver sur Calendly', 'contact.cta2': 'contact@bahri.studio',
      'contact.meta': 'Réponse sous 24h · Lun–Ven · Paris (CET)',

      // shared UI
      'ui.inProgress': 'en cours',
      'ui.reveal':     'le curseur ↻ révèle',
      'badge.own':     'mon produit',
      'badge.live':    'en cours',

      // case-study block labels
      'block.brief':    'Brief',
      'block.starting': 'État initial',
      'block.approach': 'Approche',
      'block.results':  'Résultats',
      'block.outcome':  'Résultat',
      'block.stack':    'Stack',
      'block.stage':    'Stade',
      'block.what':     'Ce que c\'est',
      'block.why':      'Pourquoi c\'est ici',

      // case 1 · I Dom You
      'c1.tag':  'mission en cours',
      'c1.d1':   'Google Ads',
      'c1.d2':   'Meta · LinkedIn',
      'c1.d3':   'Produit · UX/UI',
      'c1.role': '<strong>Responsable Marketing Digital &amp; Produit.</strong> Les deux côtés en même temps · 3 plateformes pub (Google · Meta · LinkedIn) ET <strong>développement &amp; management produit complet</strong> du site et de l\'app mobile, refondus de A à Z.',
      'c1.hm1':  'ROAS · Search High Intent',
      'c1.hm2':  'revenu YoY · avril vs année précédente',
      'c1.hm3':  'du trafic clients = moi',
      'c1.startingP': '12 campagnes actives · 3 plateformes. 4 campagnes à ROAS sub-2×. <span class="kw">Conversions API</span> ↔ Stripe non finalisée · événement merci-page manquant.',
      'c1.approachP': 'Pris la <strong>responsabilité de bout en bout</strong> de l\'architecture Paid Media <em>et</em> de la surface produit qu\'elle alimente. Re-segmenté un compte fragmenté de 12 campagnes en un système à 3 niveaux aligné sur le funnel (High-Intent · Brand · Geo). Réalloué <strong>€1 500+</strong> vers les enchères du top-quartile et mis en place une gouvernance de mots-clés négatifs. Reconstruit toute la <span class="kw">couche de mesure</span> · <span class="kw">GA4</span>, <span class="kw">GTM</span>, <span class="kw">Conversions API</span>, handoff server-side vers Stripe · pour que l\'attribution revenue soit en boucle fermée, pas modélisée. <strong>Côté produit :</strong> piloté la refonte complète du site web et l\'overhaul de l\'app mobile en tant que Product lead · wireframes, IA, copy, partenariat dev, ship.',
      'c1.ctaOld':   'Leur nouveau site arrive bientôt',
      'c1.ctaBuild': 'nouveau site en construction',
      'c1.m1': 'ROAS · Search High Intent FR',
      'c1.m2': 'revenu incrémental · 24 jours',
      'c1.m3': 'CPC · 18 387 clics',
      'c1.m4': 'clients payants YoY',
      'c1.stackP': 'Google Ads · Meta Ads · LinkedIn Ads · GA4 · GTM · <span class="kw">Conversions API</span> · attribution Stripe · Looker Studio · Figma (UX/UI) · HTML/CSS écrits à la main pour les landing pages · copywriting <span class="kw">SEO + AIO</span> et audit complet · Claude / ops assistées par l\'IA',
      'c1.ctaLive': 'en live · 859K impressions livrées',

      // case 2 · Parlons Cash
      'c2.tag':  'podcast · finance FR',
      'c2.d1':   'Design UX/UI + audit',
      'c2.d2':   'Rédaction SEO + AIO',
      'c2.d3':   'Front-end',
      'c2.d4':   'Outreach studios',
      'c2.role': '<strong>Build solo, de bout en bout.</strong> Un podcast français sur les finances perso avait de l\'écoute mais pas de présence digitale. Je l\'ai dessiné, écrit, codé, audité, et j\'ai démarré les studios.',
      'c2.briefP':    'Transformer une marque podcast en propriété web découvrable et monétisable. Pas d\'agence. Pas d\'équipe. <strong>Un opérateur, full-stack.</strong>',
      'c2.approachP': 'UX/UI complet dessiné dans <span class="kw">Figma</span> depuis une page blanche · IA, hiérarchie, parcours de conversion. Front-end HTML/CSS écrit à la main. Chaque ligne de copy on-page rédigée avec une double lentille <span class="kw">SEO + AIO</span> · structurée pour le ranking Google <em>et</em> pour les panneaux AI Overviews / Perplexity / ChatGPT. Audit complet pré- et post-lancement (Core Web Vitals, données structurées, maillage interne). <strong>Approche directe des studios podcast</strong> pour sourcer guest crossovers et leads sponsoring.',
      'c2.m1': 'solo · design → code → copy → outreach',
      'c2.m2': 'structuré pour les panneaux IA',
      'c2.m3': 'partenariats studios en pipeline',
      'c2.stackP': 'Figma (design UX/UI + audit) · HTML/CSS écrits à la main · copywriting <span class="kw">SEO + AIO</span> · données structurées (JSON-LD) · audit Core Web Vitals · Plausible · outreach studios podcast',

      // case 3 · ProToreMane
      'c3.tag':  'FR → JP · sport-tech',
      'c3.d1':   'Lead globalisation',
      'c3.d2':   'Étude de marché',
      'c3.d3':   'Architecture SEO',
      'c3.d4':   'Digital go-to-market',
      'c3.role': '<strong>Lead globalisation.</strong> J\'ai porté un produit sport-tech français sur le marché japonais. Étude de marché, fondations SEO, plan digital go-to-market complet · le tout avant qu\'un seul yen ne soit dépensé.',
      'c3.briefP':    'Ouvrir le marché japonais pour une app sport-tech française · pas comme une traduction, mais comme un produit culturellement natif. Nécessitait une <strong>étude de marché</strong> approfondie sur la catégorie sport-tech JP, un mapping concurrentiel, une analyse du search-intent en japonais, et un séquencement de lancement exécutable par les fondateurs.',
      'c3.approachP': 'Étude de marché complète menée sur l\'espace sport-tech japonais : sizing de catégorie, benchmark concurrentiel, segmentation audience, mapping search-intent en japonais. <span class="kw">Architecture SEO</span> dessinée · stratégie mots-clés, données structurées, IA on-site bilingue. Plan <strong>digital go-to-market complet</strong> rédigé : phasage Paid Media, roadmap croissance organique, pipeline partenariats, arbre de KPI. Alignement produit · ingénierie · créa autour des jalons de lancement.',
      'c3.m1': 'étude &amp; positionnement validés',
      'c3.m2': 'architecture bilingue · données structurées',
      'c3.m3': 'paid · organique · partenariats séquencés',
      'c3.m4': 'attente du lancement de l\'app',
      'c3.stackP': 'Étude de marché · benchmark concurrentiel · recherche mots-clés en japonais · architecture SEO · données structurées · plan digital GTM · stratégie de localisation · Figma · Claude / ops de recherche assistées par l\'IA',
      'c3.ctaPending': 'app en pré-lancement',

      // case 4 · AIAH
      'c4.tag':  'mon produit',
      'c4.d1':   'Fondateur',
      'c4.d2':   'Construit en live',
      'c4.role': 'Le passage de marketeur à fondateur. Celui-ci, je le possède · je le construis en public.',
      'c4.whatP': 'AIAH · un <strong>compagnon de vie IA</strong> qui coache votre agenda, vos repas, votre budget et votre confiance sociale via des check-ins quotidiens et des nudges intelligents, transformant vos objectifs en un système que vous suivez vraiment.',
      'c4.whyP':  '9 ans à optimiser les funnels des autres m\'ont appris ce que la page doit faire. AIAH, c\'est là que je l\'applique à la mienne.',
      'c4.m1Num': 'build live',
      'c4.m1':    'en cours',
      'c4.visit': 'visiter aiah →',
      'c4.stackP':'Next.js · Stripe · i18n · le reste à venir',
      'c4.cta':   'Visiter aiah.app',

      // footer
      'footer.mid':      '— Construit en live, à la main —',
      'footer.location': 'Paris · Dernière mise à jour',
    },

  };

  const applyLang = (lang) => {
    const dict = I18N[lang] || I18N.en;
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const k = el.dataset.i18n;
      if (dict[k] !== undefined) el.innerHTML = dict[k];
    });
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', 'ltr');
  };

  document.querySelectorAll('.lang-toggle button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.lang-toggle button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      applyLang(btn.dataset.lang);
    });
  });

  /* Auto-init from <html lang>: /fr/ renders in French; brief flash is acceptable */
  const initLang = (document.documentElement.lang || 'en').slice(0, 2);
  if (initLang !== 'en' && I18N[initLang]) {
    applyLang(initLang);
  }

})();
