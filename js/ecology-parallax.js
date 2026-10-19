/* Native scroll only: no scroll hijacking, animation library or permanent RAF loop. */
(() => {
  'use strict';
  if (window.__ecologyParallax) return;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = window.matchMedia('(max-width: 767px)');
  let cleanup = () => {};

  function init() {
    cleanup();
    cleanup = () => {};
    const header = document.querySelector('#page-header.full_page');
    const scene = header && header.querySelector('.ecology-scene');
    if (!scene || reducedMotion.matches) return;

    let frame = 0;
    let height = header.offsetHeight || window.innerHeight;
    let top = header.getBoundingClientRect().top + window.scrollY;
    let visible = true;
    let disposed = false;
    header.classList.add('ecology-motion');

    function draw() {
      frame = 0;
      if (disposed || document.hidden) return;
      const distance = Math.max(0, Math.min(height, window.scrollY - top));
      const progress = distance / Math.max(height, 1);
      const strength = mobile.matches ? 0.4 : 1;
      // All travel is downward within the clipped header: never expose a blank top edge.
      const put = (key, value) => scene.style.setProperty(key, value.toFixed(2) + 'px');
      put('--ecology-image-y', distance * 0.30 * strength);
      put('--ecology-light-y', distance * 0.21 * strength);
      put('--ecology-water-y', distance * 0.12 * strength);
      put('--ecology-fronds-y', -distance * 0.065 * strength);
      put('--ecology-notes-y', distance * 0.08 * strength);
      scene.style.setProperty('--ecology-notes-opacity', Math.max(0, 1 - progress * 1.8).toFixed(3));
      header.style.setProperty('--ecology-title-y', (distance * 0.13 * strength).toFixed(2) + 'px');
    }
    function requestDraw() {
      if (!disposed && visible && !document.hidden && !frame) frame = window.requestAnimationFrame(draw);
    }
    function measure() {
      height = header.offsetHeight || window.innerHeight;
      top = header.getBoundingClientRect().top + window.scrollY;
      requestDraw();
    }
    const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      header.classList.toggle('ecology-motion', visible);
      if (visible) requestDraw();
      else if (frame) { window.cancelAnimationFrame(frame); frame = 0; }
    }) : null;
    observer?.observe(header);
    const resizeObserver = 'ResizeObserver' in window ? new ResizeObserver(measure) : null;
    resizeObserver?.observe(header);
    window.addEventListener('scroll', requestDraw, { passive: true });
    window.addEventListener('resize', measure, { passive: true });
    document.addEventListener('visibilitychange', requestDraw);
    draw();

    cleanup = () => {
      disposed = true;
      if (frame) window.cancelAnimationFrame(frame);
      observer?.disconnect();
      resizeObserver?.disconnect();
      window.removeEventListener('scroll', requestDraw);
      window.removeEventListener('resize', measure);
      document.removeEventListener('visibilitychange', requestDraw);
      header.classList.remove('ecology-motion');
      header.style.removeProperty('--ecology-title-y');
      ['image-y', 'light-y', 'water-y', 'fronds-y', 'notes-y', 'notes-opacity'].forEach(key => {
        scene.style.removeProperty('--ecology-' + key);
      });
    };
  }
  // PJAX replaces #body-wrap; never keep listeners attached to an old header.
  document.addEventListener('pjax:send', () => { cleanup(); cleanup = () => {}; });
  document.addEventListener('pjax:complete', init);
  window.addEventListener('pageshow', init);
  if (reducedMotion.addEventListener) reducedMotion.addEventListener('change', init);
  else reducedMotion.addListener(init);
  window.__ecologyParallax = { refresh: init };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
