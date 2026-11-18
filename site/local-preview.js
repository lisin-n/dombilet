/* Local adapter for the original page: saved read responses, no production writes. */
(() => {
  const $ = window.jQuery;
  const snapshot = window.DOMBILET_SNAPSHOT;
  const source = 'https://dombilet.ru/sport/hockey/khl/salavat-yulaev-barys-12-nedelya-kkhl/';
  const nativeFetch = window.fetch.bind(window);
  window.fetch = function (input, options) {
    const path = new URL(typeof input === 'string' ? input : input.url, location.href).pathname;
    if (path === '/api/controllers/basket/getAllProductsForBasket/') {
      return Promise.resolve(new Response(JSON.stringify({ status: 'success', data: { FULL_PRICE: 0, PRODUCTS: {}, PROMO_CODES: [] } }), { headers: { 'Content-Type': 'application/json' } }));
    }
    if (path.startsWith('/api/') || path.startsWith('/ajax/')) {
      notice();
      return Promise.resolve(new Response(JSON.stringify({ status: 'error', errors: [{ message: 'Локальная копия' }] }), { headers: { 'Content-Type': 'application/json' } }));
    }
    return nativeFetch(input, options);
  };

  function notice() {
    let box = document.getElementById('local-preview-notice');
    if (!box) {
      box = document.createElement('div');
      box.id = 'local-preview-notice';
      box.setAttribute('role', 'status');
      box.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:100000;background:#fff;border:1px solid #ff7f00;border-radius:16px;padding:18px 24px;box-shadow:0 8px 32px #0002;max-width:calc(100vw - 32px);font:16px/1.5 sans-serif;color:#333';
      box.append('Это локальная копия. Оформление заказа доступно на ');
      const link = document.createElement('a');
      link.href = source;
      link.textContent = 'dombilet.ru';
      link.style.color = '#e87919';
      box.append(link, '.');
      document.body.append(box);
    }
    box.hidden = false;
    clearTimeout(notice.timer);
    notice.timer = setTimeout(() => { box.hidden = true; }, 6000);
  }

  $.ajax = function (url, options) {
    const opts = typeof url === 'string' ? { ...options, url } : { ...url };
    const path = new URL(opts.url || '', location.href).pathname;
    const data = typeof opts.data === 'string'
      ? Object.fromEntries(new URLSearchParams(opts.data)) : (opts.data || {});
    const deferred = $.Deferred();
    const xhr = deferred.promise({ abort() {} });
    let value;
    if (path === '/ajax/sectors.php') value = snapshot.sectors;
    else if (path === '/ajax/sector.php') value = snapshot.sector[String(data.sector)] || '["",{"tickets":[]}]';
    else if (path === '/ajax/ticket-list.php') value = snapshot['ticket-list'];
    else if (path === '/ajax/ticket-list-sector.php') value = snapshot['ticket-list-sector'][String(data.sector)] || '';
    else if (path === '/api/controllers/basket/get/') value = { status: 'success', data: false };
    else if (path === '/ajax/checkCart.php') value = [];
    else if (path === '/ajax/vote.php') {
      value = snapshot.vote || {};
      if (data.vote) notice();
    }
    setTimeout(() => {
      if (value !== undefined) {
        opts.success?.(value, 'success', xhr);
        deferred.resolve(value, 'success', xhr);
        opts.complete?.(xhr, 'success');
      } else {
        if (/addProduct|removeProduct|clear|vote|order/i.test(path)) notice();
        opts.error?.(xhr, 'error', 'Local preview');
        deferred.reject(xhr, 'error', 'Local preview');
        opts.complete?.(xhr, 'error');
      }
    }, 0);
    return xhr;
  };

  document.addEventListener('submit', event => {
    event.preventDefault();
    event.stopImmediatePropagation();
    notice();
  }, true);
  document.addEventListener('click', event => {
    if (window.DomBiletScheme && event.target.closest('.page__bottom-cart')) return;
    if (event.target.closest('#pay_order_button, a[href*="/cart/"], a[href*="/order/"]')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      notice();
    }
  }, true);
})();
