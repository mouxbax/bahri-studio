/* auto-date.js
 * Keeps "Available · {Month} {Year}" and footer "Last updated" auto-fresh.
 * Hero month: rewrites whatever month/year string is in the hero meta to the
 *   current month, in EN, FR, or AR depending on <html lang>.
 * Footer date: pulls document.lastModified (Vercel's Last-Modified header
 *   reflects the deploy date), formats DD.MM.YYYY.
 *
 * Hooks:
 *   <time data-auto-updated>26.04.2026</time>
 *   any element matching .hero-meta span (auto-targeted via regex)
 */
(function () {
  'use strict';

  var MONTHS = {
    en: ['January','February','March','April','May','June','July','August','September','October','November','December'],
    fr: ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'],
    ar: ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر']
  };

  // Match any month name (EN/FR/AR) + 4-digit year, case-insensitive
  var MONTH_PATTERN = /(January|February|March|April|May|June|July|August|September|October|November|December|Janvier|Février|Mars|Avril|Mai|Juin|Juillet|Août|Septembre|Octobre|Novembre|Décembre|يناير|فبراير|مارس|أبريل|مايو|يونيو|يوليو|أغسطس|سبتمبر|أكتوبر|نوفمبر|ديسمبر)\s+\d{4}/i;

  function getLang() {
    var l = (document.documentElement.lang || 'en').toLowerCase();
    return l.slice(0, 2);
  }

  function currentMonthYear() {
    var d = new Date();
    var lang = getLang();
    var arr = MONTHS[lang] || MONTHS.en;
    return arr[d.getMonth()] + ' ' + d.getFullYear();
  }

  function lastModified() {
    var d = new Date(document.lastModified);
    if (isNaN(d.getTime())) d = new Date();
    var dd = String(d.getDate()).padStart(2, '0');
    var mm = String(d.getMonth() + 1).padStart(2, '0');
    var yyyy = d.getFullYear();
    return { display: dd + '.' + mm + '.' + yyyy, iso: yyyy + '-' + mm + '-' + dd };
  }

  function applyMonth() {
    var newMY = currentMonthYear();
    // Hero meta — match any "<Month> <Year>" pattern in any element under .hero-meta
    document.querySelectorAll('.hero-meta, .hero-meta span').forEach(function (el) {
      // Only walk leaf text nodes
      Array.prototype.forEach.call(el.childNodes, function (node) {
        if (node.nodeType !== 3) return; // text only
        var t = node.nodeValue;
        if (MONTH_PATTERN.test(t)) {
          node.nodeValue = t.replace(MONTH_PATTERN, newMY);
        }
      });
      // Also handle elements whose entire textContent is the month string
      if (!el.children.length && MONTH_PATTERN.test(el.textContent)) {
        el.textContent = el.textContent.replace(MONTH_PATTERN, newMY);
      }
    });
    // Explicit opt-in hooks
    document.querySelectorAll('[data-auto-month]').forEach(function (el) {
      el.textContent = newMY;
    });
  }

  function applyLastUpdated() {
    var f = lastModified();
    document.querySelectorAll('[data-auto-updated]').forEach(function (el) {
      el.textContent = f.display;
      if (el.tagName === 'TIME') el.setAttribute('datetime', f.iso);
    });
  }

  function tick() {
    applyMonth();
    applyLastUpdated();
  }

  // Initial pass
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tick);
  } else {
    tick();
  }

  // Re-run whenever <html lang> changes (i18n toggle on EN page)
  try {
    new MutationObserver(tick).observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['lang']
    });
  } catch (e) { /* no-op */ }
})();
