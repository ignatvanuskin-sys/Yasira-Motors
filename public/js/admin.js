/* YASIRA MOTORS — панель администратора.
   Меняет статус записи без перезагрузки страницы. */

(function () {
  'use strict';

  function post(url, payload) {
    return fetch(url, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(function (response) {
      return response.json().catch(function () {
        return { ok: false, error: 'Не удалось прочитать ответ сервера.' };
      });
    });
  }

  function handleClick(button) {
    var id = button.getAttribute('data-id');
    var status = button.getAttribute('data-status');
    if (!id || !status) return;

    var card = button.closest('[data-booking-id]');
    var buttons = card ? card.querySelectorAll('button') : [button];

    Array.prototype.forEach.call(buttons, function (b) {
      b.disabled = true;
    });
    var originalText = button.textContent;
    button.textContent = '…';

    post('/api/admin/bookings/' + encodeURIComponent(id) + '/status', { status: status })
      .then(function (data) {
        if (data && data.ok) {
          window.location.reload();
          return;
        }
        window.alert(
          (data && data.error) ||
            'Не удалось изменить статус записи. Обновите страницу и попробуйте снова.'
        );
        Array.prototype.forEach.call(buttons, function (b) {
          b.disabled = false;
        });
        button.textContent = originalText;
      })
      .catch(function () {
        window.alert('Не удалось изменить статус: проверьте соединение и попробуйте снова.');
        Array.prototype.forEach.call(buttons, function (b) {
          b.disabled = false;
        });
        button.textContent = originalText;
      });
  }

  document.addEventListener('click', function (event) {
    var button = event.target.closest ? event.target.closest('[data-status]') : null;
    if (button) {
      event.preventDefault();
      handleClick(button);
    }
  });
})();
