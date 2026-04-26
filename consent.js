/* consent.js
 * Google Consent Mode v2 default-denied + minimal banner.
 * MUST load before GTM so the default state is set first.
 * CNIL / GDPR-compliant baseline for FR/EU.
 */
(function () {
  'use strict';

  // 1. Initialize dataLayer + gtag fn
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;

  // 2. Default-denied for analytics + ads, allow security/functional
  gtag('consent', 'default', {
    'ad_storage': 'denied',
    'ad_user_data': 'denied',
    'ad_personalization': 'denied',
    'analytics_storage': 'denied',
    'functionality_storage': 'granted',
    'security_storage': 'granted',
    'wait_for_update': 500
  });

  // 3. Restore prior choice if user already decided
  var STORAGE_KEY = 'bahri-cookie-consent-v1';
  var saved = null;
  try { saved = localStorage.getItem(STORAGE_KEY); } catch (e) {}

  if (saved === 'granted') {
    gtag('consent', 'update', {
      'ad_storage': 'granted',
      'ad_user_data': 'granted',
      'ad_personalization': 'granted',
      'analytics_storage': 'granted'
    });
  }

  // 4. Inject banner UI only if no choice has been made
  function setConsent(granted) {
    try { localStorage.setItem(STORAGE_KEY, granted ? 'granted' : 'denied'); } catch (e) {}
    gtag('consent', 'update', {
      'ad_storage': granted ? 'granted' : 'denied',
      'ad_user_data': granted ? 'granted' : 'denied',
      'ad_personalization': granted ? 'granted' : 'denied',
      'analytics_storage': granted ? 'granted' : 'denied'
    });
    var banner = document.getElementById('cookie-banner');
    if (banner && banner.parentNode) banner.parentNode.removeChild(banner);
  }

  function injectBanner() {
    if (saved) return;

    var styles = [
      '.cookie-banner{',
      '  position:fixed;left:1rem;right:1rem;bottom:1rem;',
      '  max-width:520px;margin:0 auto;',
      '  background:rgba(7,7,10,0.96);color:#f5f5f5;',
      '  border:1px solid rgba(255,255,255,0.12);border-radius:14px;',
      '  padding:1rem 1.1rem;',
      '  font-family:"Inter",system-ui,-apple-system,sans-serif;',
      '  font-size:13px;line-height:1.5;',
      '  z-index:9999;',
      '  backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);',
      '  box-shadow:0 14px 40px rgba(0,0,0,0.45);',
      '}',
      '.cookie-banner-inner{display:flex;flex-direction:column;gap:0.75rem;}',
      '.cookie-banner p{margin:0;}',
      '.cookie-banner a{color:inherit;text-decoration:underline;}',
      '.cookie-banner-actions{display:flex;gap:0.5rem;}',
      '.cookie-banner button{',
      '  flex:1;padding:0.55rem 0.9rem;border-radius:9px;',
      '  border:1px solid rgba(255,255,255,0.18);background:transparent;',
      '  color:inherit;font:inherit;cursor:pointer;',
      '  font-size:12px;letter-spacing:0.02em;font-weight:500;',
      '  transition:background 0.15s,color 0.15s;',
      '}',
      '.cookie-banner button:hover{background:rgba(255,255,255,0.08);}',
      '.cookie-banner button[data-cookie-accept]{',
      '  background:#c8ff5e;color:#07070a;border-color:#c8ff5e;',
      '}',
      '.cookie-banner button[data-cookie-accept]:hover{background:#d4ff7a;}',
      '@media (min-width:560px){',
      '  .cookie-banner-inner{flex-direction:row;align-items:center;}',
      '  .cookie-banner-actions{flex-shrink:0;}',
      '}'
    ].join('');

    var styleEl = document.createElement('style');
    styleEl.textContent = styles;
    document.head.appendChild(styleEl);

    var banner = document.createElement('div');
    banner.id = 'cookie-banner';
    banner.className = 'cookie-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Cookie consent');
    banner.innerHTML = [
      '<div class="cookie-banner-inner">',
      '  <p>This site uses analytics cookies (Google Analytics via GTM) to understand how visitors use it. Decline keeps the site fully functional.</p>',
      '  <div class="cookie-banner-actions">',
      '    <button type="button" data-cookie-decline>Decline</button>',
      '    <button type="button" data-cookie-accept>Accept</button>',
      '  </div>',
      '</div>'
    ].join('');
    document.body.appendChild(banner);

    banner.querySelector('[data-cookie-accept]').addEventListener('click', function () { setConsent(true); });
    banner.querySelector('[data-cookie-decline]').addEventListener('click', function () { setConsent(false); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectBanner);
  } else {
    injectBanner();
  }
})();
