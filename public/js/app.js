/* YASIRA MOTORS — клиентский скрипт.
   Задач всего три: открыть меню на телефоне, плавно показать блоки
   и не мешать, если JavaScript отключён. Форм и запросов к серверу нет,
   поэтому нет и обработки отправки. */

(function () {
  'use strict';

  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $$(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function on(el, event, handler) {
    if (el) el.addEventListener(event, handler);
  }

  var reduceMotion =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Меню на телефоне ─────────────────────────────────────────────────── */

  function initNav() {
    var toggle = $('[data-nav-toggle]');
    var nav = $('[data-mobile-nav]');
    if (!toggle || !nav) return;

    function setOpen(open) {
      nav.hidden = !open;
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    }

    on(toggle, 'click', function () {
      setOpen(nav.hidden);
    });

    // Переход по ссылке закрывает меню
    $$('a', nav).forEach(function (link) {
      on(link, 'click', function () {
        setOpen(false);
      });
    });

    on(window, 'keydown', function (event) {
      if (event.key === 'Escape' && !nav.hidden) {
        setOpen(false);
        toggle.focus();
      }
    });

    // При переходе на широкий экран меню должно вернуться в исходное состояние
    if (window.matchMedia) {
      var wide = window.matchMedia('(min-width: 1000px)');
      var onChange = function (event) {
        if (event.matches) setOpen(false);
      };
      if (wide.addEventListener) wide.addEventListener('change', onChange);
      else if (wide.addListener) wide.addListener(onChange);
    }
  }

  /* ── Появление блоков ─────────────────────────────────────────────────── */

  /**
   * Анимация только для ощущения живости: сдвиг на 12 пикселей и прозрачность.
   * Если наблюдатель не сработал, контент всё равно обязан стать видимым —
   * скрытый текст хуже отсутствия анимации.
   */
  function initReveal() {
    if (reduceMotion || !('IntersectionObserver' in window)) return;

    var targets = $$('.category-card, .trust-card, .step, .review-card, .gallery-item, .rating-card');
    if (!targets.length) return;

    targets.forEach(function (el) {
      el.style.opacity = '0';
      el.style.transform = 'translateY(12px)';
      el.style.transition = 'opacity .5s ease, transform .5s ease';
    });

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'none';
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.05 }
    );

    targets.forEach(function (el) {
      observer.observe(el);
    });

    window.setTimeout(function () {
      targets.forEach(function (el) {
        if (el.style.opacity === '0') {
          el.style.opacity = '1';
          el.style.transform = 'none';
          observer.unobserve(el);
        }
      });
    }, 2500);
  }

  function init() {
    initNav();
    initReveal();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
