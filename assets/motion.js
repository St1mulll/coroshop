(() => {
  const root = document.documentElement;
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const running = new Set();
  const seen = new WeakSet();
  const buttonAnimations = new WeakMap();
  const bar = document.querySelector('.sticky-bottom-bar');
  const progress = document.querySelector('.reading-progress span');
  const form = document.getElementById('order-form');
  const firstOffer = document.querySelector('.offer-section-first');
  let observer, frame = 0, spotlightFrame = 0;
  let active = !document.hidden, spotlightTarget = null, pointer = null;
  const reduced = () => preference.matches;
  const animate = (target, options) => {
    if (reduced() || !window.anime || !active) return null;
    const animation = window.anime.animate(target, {
      ...options,
      onComplete: self => { running.delete(self); self.revert(); }
    });
    running.add(animation);
    return animation;
  };
  const stop = () => { running.forEach(animation => animation.revert()); running.clear(); };
  function observe() {
    observer?.disconnect();
    if (reduced() || !window.anime || !('IntersectionObserver' in window)) return;
    observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting || !active) return;
      observer.unobserve(entry.target);
      if (seen.has(entry.target)) return;
      seen.add(entry.target);
      const photo = entry.target.querySelector('[data-photo]');
      if (photo) animate(photo, {scale:[1.035,1],duration:650,ease:'outCubic'});
      const delay = Math.min(2,Number(entry.target.dataset.revealOrder)||0) * 70;
      animate(entry.target, {y:[14,0],opacity:[.8,1],duration:420,delay,ease:'outCubic'});
    }), {threshold:.1});
    document.querySelectorAll('[data-reveal]').forEach(el => {
      if (!seen.has(el) && el.getBoundingClientRect().top >= window.innerHeight) observer.observe(el);
      else seen.add(el);
    });
  }
  function update() {
    frame = 0;
    if (!active) return;
    const scroll = Math.max(0, window.scrollY);
    const height = Math.max(1, root.scrollHeight - window.innerHeight);
    if (progress) progress.style.transform = 'scaleX(' + Math.min(1,scroll / height) + ')';
    if (bar) {
      const formTop = form?.getBoundingClientRect().top ?? Infinity;
      const firstBottom = firstOffer?.getBoundingClientRect().bottom ?? 0;
      const visible = firstBottom < 100 && formTop > window.innerHeight && !form?.contains(document.activeElement);
      bar.classList.toggle('visible',visible);
      bar.setAttribute('aria-hidden',String(!visible));
      const link = bar.querySelector('a');
      if (link) link.tabIndex = visible ? 0 : -1;
    }
  }
  const schedule = () => { if (active && !frame) frame = requestAnimationFrame(update); };
  function clearSpotlight() {
    if (spotlightTarget) {
      delete spotlightTarget.dataset.spotlightActive;
      spotlightTarget.style.removeProperty('--spot-x');
      spotlightTarget.style.removeProperty('--spot-y');
    }
    spotlightTarget = null;
    pointer = null;
    if (spotlightFrame) cancelAnimationFrame(spotlightFrame);
    spotlightFrame = 0;
  }
  document.querySelectorAll('[data-spotlight]').forEach(card => {
    card.addEventListener('pointermove',event => {
      if (!active || reduced() || !finePointer.matches) return;
      if (spotlightTarget !== card) clearSpotlight();
      spotlightTarget = card;
      pointer = {x:event.clientX,y:event.clientY};
      if (spotlightFrame) return;
      spotlightFrame = requestAnimationFrame(() => {
        spotlightFrame = 0;
        if (!spotlightTarget || !pointer) return;
        const bounds = spotlightTarget.getBoundingClientRect();
        spotlightTarget.style.setProperty('--spot-x',(pointer.x-bounds.left)+'px');
        spotlightTarget.style.setProperty('--spot-y',(pointer.y-bounds.top)+'px');
        spotlightTarget.dataset.spotlightActive = 'true';
      });
    });
    card.addEventListener('pointerleave',clearSpotlight);
    card.addEventListener('pointercancel',clearSpotlight);
  });
  function setPreference() {
    root.dataset.motion = reduced() || !active ? 'off' : 'on';
    stop(); clearSpotlight(); observe(); schedule();
  }
  document.querySelectorAll('.button, .btn-order').forEach(button => {
    button.addEventListener('pointerenter',() => {
      if (!finePointer.matches || button.disabled || reduced()) return;
      const old = buttonAnimations.get(button);
      if (old) { old.revert(); running.delete(old); }
      const shine = button.querySelector('.button-shine');
      const arrow = button.querySelector('.button-arrow');
      if (shine) buttonAnimations.set(button,animate(shine,{x:['0%','550%'],duration:650,ease:'outQuad'}));
      if (arrow) animate(arrow,{x:[0,4,0],duration:450,ease:'outCubic'});
    });
    button.addEventListener('pointerdown',() => {
      if (!button.disabled) animate(button,{scale:[1,.98,1],duration:220,ease:'outQuad'});
    });
  });
  const quantity = form?.querySelector('[name=quantity]');
  const packButtons = document.querySelectorAll('[data-pack]');
  const feedback = document.querySelector('.pack-feedback');
  function choosePack(value, announce = false) {
    if (!quantity) return;
    quantity.value = String(value);
    packButtons.forEach(button => button.setAttribute('aria-pressed',String(button.dataset.pack === String(value))));
    if (announce && feedback) feedback.textContent = 'Обрано: ' + quantity.selectedOptions[0].textContent;
  }
  packButtons.forEach(button => button.addEventListener('click',() => {choosePack(button.dataset.pack,true);quantity?.dispatchEvent?.(new Event('change',{bubbles:true}));}));
  quantity?.addEventListener('change',() => choosePack(quantity.value));
  document.querySelectorAll('a[href="#order6"]').forEach(link => link.addEventListener('click',() => {
    const target = document.getElementById('order6');
    if (target) target.focus({preventScroll:true});
  }));
  function suspend() {
    active=false; root.dataset.motion='off'; observer?.disconnect();
    stop(); clearSpotlight(); if(frame)cancelAnimationFrame(frame);frame=0;
  }
  window.addEventListener('scroll',schedule,{passive:true});
  window.addEventListener('resize',schedule,{passive:true});
  document.addEventListener('focusin',schedule);
  document.addEventListener('focusout',schedule);
  preference.addEventListener('change',setPreference);
  document.addEventListener('visibilitychange',() => {
    if (document.hidden) suspend(); else {active=true;setPreference();}
  });
  window.addEventListener('pagehide',suspend);
  window.addEventListener('pageshow',event => {if(event.persisted){active=true;setPreference();}});
  setPreference();
})();