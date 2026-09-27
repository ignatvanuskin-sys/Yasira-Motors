/* YASIRA MOTORS — клиентская логика сайта.
   Без зависимостей: прогрессивное улучшение поверх серверного HTML.
   Если JS отключён, страница читается, а записаться можно по телефону. */

(function () {
  'use strict';

  /* ── Утилиты ─────────────────────────────────────────────────────────── */

  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $$(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function on(el, event, handler) {
    if (el) el.addEventListener(event, handler);
  }

  function request(url, options) {
    return fetch(url, Object.assign({ credentials: 'same-origin' }, options)).then(
      function (response) {
        return response.json().catch(function () {
          return { ok: false, error: 'Не удалось прочитать ответ сервера.' };
        });
      }
    );
  }

  var MONTHS = [
    'январь', 'февраль', 'март', 'апрель', 'май', 'июнь',
    'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь',
  ];

  var WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  /** Локальная дата → 'YYYY-MM-DD' (без сдвига часового пояса). */
  function toDateKey(date) {
    var m = String(date.getMonth() + 1).padStart(2, '0');
    var d = String(date.getDate()).padStart(2, '0');
    return date.getFullYear() + '-' + m + '-' + d;
  }

  /** 'YYYY-MM-DD' → «28 сентября» */
  function humanDate(key) {
    var parts = key.split('-');
    var month = MONTHS[parseInt(parts[1], 10) - 1] || '';
    return String(parseInt(parts[2], 10)) + ' ' + month.replace(/ь$/, 'я').replace(/й$/, 'я');
  }

  function plural(n, forms) {
    var mod10 = n % 10;
    var mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return forms[0];
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1];
    return forms[2];
  }

  /* ── Шапка: мобильное меню ───────────────────────────────────────────── */

  function initNav() {
    var toggle = $('.nav-toggle');
    var nav = $('#mobile-nav');
    if (!toggle || !nav) return;

    function setOpen(open) {
      nav.hidden = !open;
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    }

    on(toggle, 'click', function () {
      setOpen(nav.hidden);
    });

    on(document, 'keydown', function (event) {
      if (event.key === 'Escape' && !nav.hidden) {
        setOpen(false);
        toggle.focus();
      }
    });

    $$('a', nav).forEach(function (link) {
      on(link, 'click', function () {
        setOpen(false);
      });
    });
  }

  /* ── Подбор услуги по симптому ───────────────────────────────────────── */

  function initSelector() {
    $$('[data-selector]').forEach(function (root) {
      var input = $('[data-selector-input]', root);
      var button = $('[data-selector-go]', root);
      var result = $('[data-selector-result]', root);
      if (!input || !button || !result) return;

      // Результат подбора появляется асинхронно — скринридер должен
      // узнать об этом без перемещения фокуса.
      result.setAttribute('role', 'status');
      result.setAttribute('aria-live', 'polite');

      function run() {
        var slug = input.value;
        if (!slug) {
          result.hidden = false;
          result.innerHTML =
            '<p class="selector-result-title">Выберите пункт из списка — подскажем, с чего начать.</p>';
          return;
        }
        result.hidden = false;
        result.innerHTML = '<p class="selector-result-title">Подбираем…</p>';

        request('/api/services/' + encodeURIComponent(slug))
          .then(function (data) {
            if (!data || !data.ok || !data.service) {
              result.innerHTML =
                '<p class="selector-result-title">Не удалось подобрать услугу. Позвоните нам — подскажем по телефону.</p>';
              return;
            }
            var items = [data.service].concat(data.related || []);
            var html = '<p class="selector-result-title">Возможно, вам подойдёт:</p><div class="selector-result-list">';
            items.forEach(function (service, index) {
              html +=
                '<a href="/services/' +
                service.slug +
                '"' +
                (index === 0 ? ' data-primary="true"' : '') +
                '>' +
                escapeHtml(service.title) +
                '</a>';
            });
            html += '</div>';
            if (data.service.priceLabel) {
              html +=
                '<p class="selector-hint" style="margin-top:12px">' +
                escapeHtml(data.service.priceLabel) +
                ' · ' +
                escapeHtml(data.service.durationText || '') +
                '</p>';
            }
            result.innerHTML = html;
          })
          .catch(function () {
            result.innerHTML =
              '<p class="selector-result-title">Сервис временно недоступен. Позвоните нам — подскажем, что делать.</p>';
          });
      }

      on(button, 'click', run);
      on(input, 'change', run);
    });
  }

  function escapeHtml(value) {
    return String(value === null || value === undefined ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /* ── Телефон: мягкое форматирование ─────────────────────────────────── */

  function initPhoneInputs() {
    $$('[data-phone-input]').forEach(function (input) {
      on(input, 'input', function () {
        var digits = input.value.replace(/\D/g, '');
        if (digits.length === 0) {
          input.value = '';
          return;
        }
        if (digits[0] === '8') digits = '7' + digits.slice(1);
        if (digits[0] !== '7') digits = '7' + digits;
        digits = digits.slice(0, 11);

        var out = '+7';
        if (digits.length > 1) out += ' ' + digits.slice(1, 4);
        if (digits.length >= 5) out += ' ' + digits.slice(4, 7);
        if (digits.length >= 8) out += ' ' + digits.slice(7, 9);
        if (digits.length >= 10) out += ' ' + digits.slice(9, 11);
        input.value = out;
      });
    });
  }

  /* ── Быстрая запись на главной ──────────────────────────────────────── */

  function initQuickBooking() {
    var form = $('[data-quick-booking]');
    if (!form) return;

    var serviceSelect = $('[data-service-select]', form);
    var dateInput = $('[data-date-input]', form);
    var timeSelect = $('[data-time-select]', form);
    var status = $('[data-form-status]', form);
    var submit = $('[data-submit]', form);
    var successBox = $('[data-booking-success]');
    var requestId = null;

    var today = new Date();
    dateInput.min = toDateKey(today);
    dateInput.max = toDateKey(new Date(today.getTime() + 30 * 86400000));

    function setError(field, message) {
      var box = $('[data-error-for="' + field + '"]', form);
      var input = form.elements[field];
      if (box) {
        box.textContent = message || '';
        box.hidden = !message;
      }
      if (input) input.setAttribute('aria-invalid', message ? 'true' : 'false');
    }

    function clearErrors() {
      ['serviceSlug', 'date', 'time', 'name', 'phone'].forEach(function (field) {
        setError(field, '');
      });
      status.className = 'form-status';
      status.textContent = '';
    }

    /** Переводит фокус на первое поле с ошибкой. */
    function focusFirstError() {
      var box = form.querySelector('.field-error:not([hidden])');
      if (!box) return;
      var field = box.getAttribute('data-error-for');
      var target = field ? form.elements[field] : null;
      if (target && target.focus) target.focus({ preventScroll: true });
      var host = target && target.closest ? target.closest('.field') || target : box;
      if (host.scrollIntoView) host.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }

    function loadSlots() {
      var date = dateInput.value;
      timeSelect.disabled = true;
      timeSelect.innerHTML = '<option value="">Загружаем…</option>';
      if (!date) {
        timeSelect.innerHTML = '<option value="">Сначала выберите дату</option>';
        return;
      }
      request('/api/slots?date=' + encodeURIComponent(date))
        .then(function (data) {
          timeSelect.innerHTML = '';
          if (!data || !data.ok || !data.slots || !data.slots.length) {
            timeSelect.innerHTML = '<option value="">Нет свободного времени</option>';
            timeSelect.disabled = true;
            setError(
              'time',
              (data && data.reason) ||
                'На выбранную дату свободного времени нет. Выберите другой день или позвоните нам.'
            );
            return;
          }
          timeSelect.disabled = false;
          timeSelect.appendChild(new Option('Выберите время', ''));
          data.slots.forEach(function (slot) {
            timeSelect.appendChild(new Option(slot.time, slot.time));
          });
        })
        .catch(function () {
          timeSelect.innerHTML = '<option value="">Не удалось загрузить время</option>';
          setError('time', 'Не удалось загрузить свободное время. Попробуйте ещё раз или позвоните нам.');
        });
    }

    on(dateInput, 'change', loadSlots);

    on(form, 'submit', function (event) {
      event.preventDefault();
      clearErrors();

      var payload = {
        serviceSlug: serviceSelect.value,
        date: dateInput.value,
        time: timeSelect.value,
        name: form.elements.name.value.trim(),
        phone: form.elements.phone.value.trim(),
        requestId: requestId,
        source: 'homepage',
      };

      var hasError = false;
      if (!payload.serviceSlug) {
        setError('serviceSlug', 'Выберите услугу.');
        hasError = true;
      }
      if (!payload.date) {
        setError('date', 'Выберите дату.');
        hasError = true;
      }
      if (!payload.time) {
        setError('time', 'Выберите время.');
        hasError = true;
      }
      if (payload.name.length < 2) {
        setError('name', 'Укажите имя.');
        hasError = true;
      }
      if (payload.phone.replace(/\D/g, '').length < 10) {
        setError('phone', 'Укажите телефон полностью.');
        hasError = true;
      }
      if (hasError) {
        focusFirstError();
        return;
      }

      submit.disabled = true;
      submit.textContent = 'Отправляем…';
      status.className = 'form-status is-info';
      status.textContent = 'Отправляем заявку…';

      request('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
        .then(function (data) {
          if (data && data.ok && data.booking) {
            window.location.href = '/booking/success?code=' + encodeURIComponent(data.booking.publicId);
            return;
          }
          if (data && data.errors) {
            Object.keys(data.errors).forEach(function (field) {
              setError(field, data.errors[field]);
            });
          }
          status.className = 'form-status is-error';
          status.textContent =
            (data && data.error) ||
            'Не удалось отправить заявку. Попробуйте ещё раз или свяжитесь с нами по телефону.';
          submit.disabled = false;
          submit.textContent = 'Отправить заявку';
        })
        .catch(function () {
          status.className = 'form-status is-error';
          status.textContent =
            'Не удалось отправить заявку. Проверьте соединение и попробуйте снова — или позвоните нам.';
          submit.disabled = false;
          submit.textContent = 'Отправить заявку';
        });
    });

    // Одноразовый ключ запроса: защищает от случайной повторной отправки.
    if (window.crypto && window.crypto.randomUUID) {
      requestId = window.crypto.randomUUID();
    } else {
      requestId = 'r-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10);
    }

    if (successBox) successBox.hidden = true;
  }

  /* ── Мастер записи на /booking ──────────────────────────────────────── */

  function initWizard() {
    var wizard = $('[data-wizard]');
    if (!wizard) return;

    var form = $('[data-booking-form]', wizard);
    if (!form) return;

    var steps = $$('.wizard-step', wizard);
    var panels = $$('.wizard-panel', wizard);
    var status = $('[data-form-status]', form);
    var submit = $('[data-submit]', form);
    var calendarBox = $('[data-calendar]', wizard);
    var slotsBox = $('[data-slots]', wizard);
    var slotsHint = $('[data-slots-hint]', wizard);
    var summaryBox = $('[data-summary]', wizard);

    var state = {
      step: 1,
      serviceSlug: wizard.getAttribute('data-preselect') || '',
      date: '',
      time: '',
      name: '',
      phone: '',
      brand: '',
      model: '',
      year: '',
      plate: '',
      notes: '',
      calendarLoaded: false,
      requestId: null,
      /* true после успешной отправки: снимает защиту от закрытия страницы */
      submitted: false,
    };

    if (window.crypto && window.crypto.randomUUID) {
      state.requestId = window.crypto.randomUUID();
    } else {
      state.requestId = 'r-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10);
    }

    var preselect = $('input[name="serviceSlug"][value="' + state.serviceSlug + '"]', wizard);
    if (preselect) preselect.checked = true;

    /* Ошибки */
    function setError(field, message) {
      var box = $('[data-error-for="' + field + '"]', wizard);
      if (box) {
        box.textContent = message || '';
        box.hidden = !message;
      }
    }

    function clearErrors() {
      ['serviceSlug', 'date', 'time', 'name', 'phone', 'brand', 'model', 'year', 'plate'].forEach(
        function (field) {
          setError(field, '');
        }
      );
      status.className = 'form-status';
      status.textContent = '';
    }

    /**
     * Держит состояние записи в адресе страницы.
     * Это даёт рабочую кнопку «назад», сохраняет шаг и дату при обновлении
     * и позволяет дать клиенту ссылку на конкретный шаг записи.
     */
    function syncUrl() {
      if (!window.history || !window.history.replaceState) return;
      var url = new URL(window.location.href);
      if (state.step > 1) url.searchParams.set('step', String(state.step));
      else url.searchParams.delete('step');
      if (state.date) url.searchParams.set('date', state.date);
      else url.searchParams.delete('date');
      window.history.replaceState(null, '', url.pathname + url.search);
    }

    /** Переводит фокус на первое поле с ошибкой — чтобы её не искали глазами. */
    function focusFirstError() {
      var box = wizard.querySelector('.field-error:not([hidden])');
      if (!box) return;
      var field = box.getAttribute('data-error-for');
      var target = null;
      if (field === 'serviceSlug') {
        target =
          wizard.querySelector('input[name="serviceSlug"]:checked') ||
          wizard.querySelector('input[name="serviceSlug"]');
      } else if (field) {
        target = wizard.querySelector('[name="' + field + '"]');
      }
      if (!target) return;
      if (target.focus) target.focus({ preventScroll: true });
      var host = target.closest ? target.closest('.field, .service-picker') || target : target;
      if (host.scrollIntoView) {
        host.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    }

    /* Переключение шагов */
    function goTo(step) {
      state.step = step;
      panels.forEach(function (panel) {
        panel.hidden = Number(panel.getAttribute('data-panel')) !== step;
      });
      steps.forEach(function (item) {
        var n = Number(item.getAttribute('data-step'));
        item.classList.toggle('is-active', n === step);
        item.classList.toggle('is-done', n < step);
        if (n === step) item.setAttribute('aria-current', 'step');
        else item.removeAttribute('aria-current');
      });

      if (step === 3 && !state.calendarLoaded) loadCalendar();
      if (step === 5) renderSummary();
      syncUrl();

      var panel = panels[step - 1];
      if (panel && window.innerWidth < 900) {
        var top = panel.getBoundingClientRect().top + window.pageYOffset - 90;
        window.scrollTo({ top: top, behavior: 'smooth' });
      }
    }

    /* Календарь */
    function loadCalendar() {
      state.calendarLoaded = true;
      calendarBox.innerHTML = '<p class="calendar-loading">Загружаем доступные даты…</p>';

      request('/api/calendar?days=28')
        .then(function (data) {
          if (!data || !data.ok || !data.days) {
            calendarBox.innerHTML =
              '<p class="calendar-empty">Не удалось загрузить календарь. Обновите страницу или позвоните нам.</p>';
            return;
          }
          renderCalendar(data.days);
        })
        .catch(function () {
          calendarBox.innerHTML =
            '<p class="calendar-empty">Не удалось загрузить календарь. Обновите страницу или позвоните нам.</p>';
        });
    }

    function renderCalendar(days) {
      var groups = [];
      days.forEach(function (day) {
        var parts = day.date.split('-');
        var key = parts[0] + '-' + parts[1];
        var group = groups[groups.length - 1];
        if (!group || group.key !== key) {
          group = { key: key, month: parseInt(parts[1], 10) - 1, year: parseInt(parts[0], 10), days: [] };
          groups.push(group);
        }
        group.days.push(day);
      });

      var html = '<div class="calendar-months">';
      groups.forEach(function (group) {
        html += '<div class="calendar-month">';
        html += '<h4 class="calendar-month-title">' + MONTHS[group.month] + ' ' + group.year + '</h4>';
        html += '<div class="calendar-weekdays">';
        WEEKDAYS.forEach(function (w) {
          html += '<span>' + w + '</span>';
        });
        html += '</div><div class="calendar-days">';

        // Пустые ячейки до первого дня месяца — отдельный класс,
        // чтобы они не попадали в выборки дней календаря.
        var firstDate = new Date(group.days[0].date + 'T00:00:00');
        var offset = (firstDate.getDay() + 6) % 7;
        for (var i = 0; i < offset; i += 1) {
          html += '<span class="calendar-pad" aria-hidden="true"></span>';
        }

        group.days.forEach(function (day) {
          var classes = ['calendar-day'];
          if (!day.available) classes.push('is-closed');
          if (day.isToday) classes.push('is-today');
          if (day.date === state.date) classes.push('is-selected');
          html +=
            '<button type="button" class="' +
            classes.join(' ') +
            '" data-date="' +
            day.date +
            '"' +
            (day.available ? '' : ' disabled') +
            '>' +
            '<span>' +
            day.day +
            '</span>' +
            (day.available ? '<small>' + day.freeCount + '</small>' : '') +
            '</button>';
        });

        html += '</div></div>';
      });
      html += '</div>';
      html +=
        '<div class="calendar-legend">' +
        '<span><i class="legend-dot is-free"></i> цифра — свободных слотов</span>' +
        '<span><i class="legend-dot is-selected"></i> выбрано</span>' +
        '<span><i class="legend-dot is-closed"></i> нет записи</span>' +
        '</div>';

      calendarBox.innerHTML = html;

      $$('[data-date]', calendarBox).forEach(function (button) {
        on(button, 'click', function () {
          state.date = button.getAttribute('data-date');
          state.time = '';
          $$('[data-date]', calendarBox).forEach(function (b) {
            b.classList.toggle('is-selected', b.getAttribute('data-date') === state.date);
          });
          setError('date', '');
          loadSlots();
        });
      });
    }

    /* Слоты */
    function loadSlots() {
      slotsBox.innerHTML = '<p class="slots-loading">Загружаем свободное время…</p>';
      slotsHint.textContent = 'Показываем только свободное время выбранной даты.';

      request('/api/slots?date=' + encodeURIComponent(state.date))
        .then(function (data) {
          if (!data || !data.ok || !data.slots || !data.slots.length) {
            slotsBox.innerHTML =
              '<p class="slot-empty">' +
              escapeHtml(
                (data && data.reason) ||
                  'На выбранную дату свободного времени нет. Выберите другой день или свяжитесь с нами.'
              ) +
              '</p>';
            return;
          }
          slotsBox.innerHTML = '';
          data.slots.forEach(function (slot) {
            var button = document.createElement('button');
            button.type = 'button';
            button.className = 'slot';
            button.innerHTML = '<span>' + slot.time + '</span><small>свободно</small>';
            button.setAttribute('data-time', slot.time);
            on(button, 'click', function () {
              state.time = slot.time;
              $$('.slot', slotsBox).forEach(function (b) {
                b.classList.toggle('is-selected', b.getAttribute('data-time') === state.time);
              });
              setError('time', '');
            });
            slotsBox.appendChild(button);
          });
          slotsHint.textContent =
            'Свободно ' +
            data.slots.length +
            ' ' +
            plural(data.slots.length, ['слот', 'слота', 'слотов']) +
            ' на выбранную дату.';
        })
        .catch(function () {
          slotsBox.innerHTML =
            '<p class="slot-empty">Не удалось загрузить время. Попробуйте ещё раз или позвоните нам.</p>';
        });
    }

    /* Сводка */
    function renderSummary() {
      var service = $('input[name="serviceSlug"]:checked', wizard);
      var serviceTitle = '';
      var unsure = false;
      if (service) {
        var label = service.closest('.service-option');
        var strong = label ? label.querySelector('strong') : null;
        serviceTitle = strong ? strong.textContent : service.value;
        unsure = service.getAttribute('data-unsure') === 'true';
      }
      /* Выбрано «не знаю, что сломалось»: клиент видит свою формулировку,
         а администратору уходит конкретная услуга — они должны совпадать
         в сводке, иначе возникнет недопонимание при звонке. */
      if (unsure) serviceTitle = 'Не знаю, что сломалось (компьютерная диагностика)';

      var vehicle = [state.brand, state.model, state.year].filter(Boolean).join(' ');

      var rows = [
        ['Услуга', serviceTitle],
        ['Автомобиль', vehicle || 'не указан'],
        ['Дата', state.date ? humanDate(state.date) : ''],
        ['Время', state.time],
        ['Имя', state.name],
        ['Телефон', state.phone],
      ];
      if (state.plate) rows.splice(3, 0, ['Госномер', state.plate]);
      if (state.notes) rows.splice(rows.length - 2, 0, ['Что беспокоит', state.notes]);

      var html = '';
      rows.forEach(function (row) {
        html +=
          '<div class="summary-row"><span>' +
          escapeHtml(row[0]) +
          '</span><strong>' +
          escapeHtml(row[1] || '—') +
          '</strong></div>';
      });
      html +=
        '<div class="summary-row"><span>Стоимость</span><strong>уточнит администратор</strong></div>';
      summaryBox.innerHTML = html;
    }

    /* Проверки перед переходом */
    function validateStep(step) {
      clearErrors();
      if (step === 1) {
        var service = $('input[name="serviceSlug"]:checked', wizard);
        if (!service) {
          setError('serviceSlug', 'Выберите услугу, чтобы продолжить.');
          return false;
        }
        state.serviceSlug = service.value;
      }
      /* Шаг 3 — дата И время: клиенту важен один ответ «когда», а не два экрана */
      if (step === 3) {
        if (!state.date) {
          setError('date', 'Выберите дату.');
          return false;
        }
        if (!state.time) {
          setError('time', 'Выберите время.');
          return false;
        }
      }
      if (step === 4) {
        state.name = form.elements.name.value.trim();
        state.phone = form.elements.phone.value.trim();
        if (state.name.length < 2) {
          setError('name', 'Укажите имя — как к вам обращаться.');
          return false;
        }
        if (state.phone.replace(/\D/g, '').length < 10) {
          setError('phone', 'Укажите телефон полностью.');
          return false;
        }
      }
      if (step === 2) {
        state.brand = form.elements.brand.value.trim();
        state.model = form.elements.model.value.trim();
        state.year = form.elements.year.value.trim();
        state.plate = form.elements.plate.value.trim();
        state.notes = form.elements.notes.value.trim();
      }
      return true;
    }

    $$('[data-next]', wizard).forEach(function (button) {
      on(button, 'click', function () {
        var step = state.step;
        if (!validateStep(step)) {
          focusFirstError();
          return;
        }
        goTo(Number(button.getAttribute('data-next')));
      });
    });

    $$('[data-back]', wizard).forEach(function (button) {
      on(button, 'click', function () {
        clearErrors();
        goTo(Number(button.getAttribute('data-back')));
      });
    });

    $$('input[name="serviceSlug"]', wizard).forEach(function (radio) {
      on(radio, 'change', function () {
        state.serviceSlug = radio.value;
        setError('serviceSlug', '');
      });
    });

    /* Отправка */
    on(form, 'submit', function (event) {
      event.preventDefault();
      if (!validateStep(1) || !validateStep(3) || !validateStep(4) || !validateStep(5)) {
        goTo(state.serviceSlug ? (state.date && state.time ? 4 : 3) : 1);
        focusFirstError();
        return;
      }
      state.brand = form.elements.brand.value.trim();
      state.model = form.elements.model.value.trim();
      state.year = form.elements.year.value.trim();
      state.plate = form.elements.plate.value.trim();
      state.notes = form.elements.notes.value.trim();

      submit.disabled = true;
      status.className = 'form-status is-info';
      status.textContent = 'Отправляем заявку…';

      request('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceSlug: state.serviceSlug,
          date: state.date,
          time: state.time,
          name: state.name,
          phone: state.phone,
          brand: state.brand,
          model: state.model,
          year: state.year,
          plate: state.plate,
          notes: state.notes,
          requestId: state.requestId,
          source: 'booking-page',
        }),
      })
        .then(function (data) {
          if (data && data.ok && data.booking) {
            // Запись отправлена — снимаем защиту от закрытия страницы,
            // иначе браузер спросит подтверждение при переходе на экран успеха.
            state.submitted = true;
            window.location.href =
              '/booking/success?code=' + encodeURIComponent(data.booking.publicId);
            return;
          }

          if (data && data.errors) {
            Object.keys(data.errors).forEach(function (field) {
              setError(field, data.errors[field]);
            });
            /* Возвращаем на шаг, где ошибка, а не просто в начало */
            if (data.errors.serviceSlug) goTo(1);
            else if (data.errors.date || data.errors.time) goTo(3);
            else if (data.errors.name || data.errors.phone) goTo(4);
            else goTo(4);
            focusFirstError();
          }

          // Слот могли занять, пока клиент заполнял форму: обновляем данные.
          if (data && data.code === 'SLOT_TAKEN') {
            state.time = '';
            state.calendarLoaded = false;
            if (state.step === 4) loadSlots();
          }

          status.className = 'form-status is-error';
          status.textContent =
            (data && data.error) ||
            'Не удалось отправить заявку. Попробуйте ещё раз или свяжитесь с нами по телефону.';
          submit.disabled = false;
        })
        .catch(function () {
          status.className = 'form-status is-error';
          status.textContent =
            'Не удалось отправить заявку. Проверьте соединение и попробуйте снова — или позвоните нам.';
          submit.disabled = false;
        });
    });

    /* Предупреждение о потере заполненной записи.
       Показываем только когда клиент уже начал заполнять форму и ещё
       не отправил её: иначе теряются автомобиль и контакты. */
    on(window, 'beforeunload', function (event) {
      if (state.submitted || state.step < 2) return undefined;
      event.preventDefault();
      event.returnValue = '';
      return '';
    });

    /* Восстановление состояния из адреса: шаг и дата переживают обновление
       страницы, а ссылкой на шаг можно поделиться. */
    var params = new URLSearchParams(window.location.search);
    var restoredDate = params.get('date') || '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(restoredDate)) state.date = restoredDate;

    var initialStep = parseInt(params.get('step') || '1', 10);
    if (!(initialStep >= 1 && initialStep <= 5)) initialStep = 1;
    if (initialStep > 1 && !state.serviceSlug) initialStep = 1;
    if (initialStep >= 4 && !state.date) initialStep = 3;
    /* Шестой шаг не восстанавливаем: имя и телефон по ссылке не передаются,
       и сводка была бы пустой. */
    /* Пятый шаг — проверка: имя и телефон по ссылке не передаются,
       восстанавливать его бессмысленно. */
    if (initialStep >= 5) initialStep = 4;

    if (initialStep >= 3) loadCalendar();
    if (state.date && initialStep >= 3) loadSlots();

    goTo(initialStep);
  }

  /* ── Появление секций ───────────────────────────────────────────────── */

  function initReveal() {
    if (!('IntersectionObserver' in window)) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var targets = $$('.service-card, .trust-item, .why-card, .step, .review-card, .gallery-item');
    if (!targets.length) return;

    targets.forEach(function (el) {
      el.style.opacity = '0';
      el.style.transform = 'translateY(10px)';
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

    // Страховка: если наблюдатель не сработал (быстрая прокрутка, переход
    // по якорю, особенность браузера), контент обязан стать видимым.
    // Скрытый текст хуже, чем отсутствие анимации.
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

  /* ── Запуск ─────────────────────────────────────────────────────────── */

  function boot() {
    initNav();
    initSelector();
    initPhoneInputs();
    initQuickBooking();
    initWizard();
    initReveal();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
