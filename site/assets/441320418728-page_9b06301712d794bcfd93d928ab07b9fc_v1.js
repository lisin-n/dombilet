
; /* Start:"a:4:{s:4:"full";s:96:"/local/templates/dombilet2.0/components/bitrix/catalog.element/.default/script.js?17884439627844";s:6:"source";s:81:"/local/templates/dombilet2.0/components/bitrix/catalog.element/.default/script.js";s:3:"min";s:0:"";s:3:"map";s:0:"";}"*/
var isMobile = {
	Android: function () {
		return navigator.userAgent.match(/Android/i);
	},
	BlackBerry: function () {
		return navigator.userAgent.match(/BlackBerry/i);
	},
	iOS: function () {
		return navigator.userAgent.match(/iPhone|iPad|iPod/i);
	},
	Opera: function () {
		return navigator.userAgent.match(/Opera Mini/i);
	},
	Windows: function () {
		return navigator.userAgent.match(/IEMobile/i);
	},
	any: function () {
		return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows());
	}
};

var isVip = false;

document.addEventListener('DOMContentLoaded', function () {

	isVip = document.body.classList.contains('dark-vip');
	// Яндекс.Метрика Ecommerce: Просмотр товара
	if (typeof ymEcommerceDetail !== 'undefined' && window.ymProductData)
		ymEcommerceDetail([window.ymProductData]);

	// Копирования в буфер обмена ссылки и вывод сообщения
	initCopyLinkButtons();

	// Корректная высота свёрнутого описания мероприятия
	initAboutEventDescriptionShowMore();
});

// BEGIN -> Расчёт высоты блока «О мероприятии» до первой полной строки описания
function initAboutEventDescriptionShowMore() {
	const aboutEventTitle = document.getElementById('aboutEventText');

	if (!aboutEventTitle)
		return;

	const showMoreBlock = aboutEventTitle.closest('[data-showmore]');
	const showMoreContent = showMoreBlock ? showMoreBlock.querySelector('[data-showmore-content]') : null;
	const showMoreButton = showMoreBlock ? showMoreBlock.querySelector('[data-showmore-button]') : null;
	const description = showMoreContent ? showMoreContent.querySelector('.descp-events__text') : null;
	const firstParagraph = description ? description.querySelector('p') : null;

	if (!showMoreBlock || !showMoreContent || !showMoreButton || !firstParagraph)
		return;

	let resizeFrameId = null;

	function updateCollapsedHeight() {
		const paragraphStyles = window.getComputedStyle(firstParagraph);
		let firstLineHeight = parseFloat(paragraphStyles.lineHeight);

		if (!Number.isFinite(firstLineHeight)) {
			const fontSize = parseFloat(paragraphStyles.fontSize);
			firstLineHeight = Number.isFinite(fontSize) ? fontSize * 1.2 : 0;
		}

		if (!firstLineHeight)
			return;

		const contentRect = showMoreContent.getBoundingClientRect();
		const paragraphRect = firstParagraph.getBoundingClientRect();
		const collapsedHeight = Math.ceil(paragraphRect.top - contentRect.top + firstLineHeight);
		const fullHeight = showMoreContent.scrollHeight;

		showMoreContent.dataset.showmoreContent = collapsedHeight;
		showMoreButton.hidden = collapsedHeight >= fullHeight;

		if (!showMoreBlock.classList.contains('_showmore-active') &&
			!showMoreContent.classList.contains('_slide')) {
			showMoreContent.style.height = `${collapsedHeight}px`;
		}
	}

	function scheduleCollapsedHeightUpdate() {
		if (resizeFrameId !== null)
			window.cancelAnimationFrame(resizeFrameId);

		resizeFrameId = window.requestAnimationFrame(function () {
			resizeFrameId = null;
			updateCollapsedHeight();
		});
	}

	updateCollapsedHeight();
	window.addEventListener('resize', scheduleCollapsedHeightUpdate);

	if (window.ResizeObserver) {
		let observedWidth = showMoreBlock.getBoundingClientRect().width;
		const resizeObserver = new ResizeObserver(function (entries) {
			const currentWidth = entries[0].contentRect.width;

			if (currentWidth === observedWidth)
				return;

			observedWidth = currentWidth;
			scheduleCollapsedHeightUpdate();
		});

		resizeObserver.observe(showMoreBlock);
	}

	if (document.fonts && document.fonts.ready)
		document.fonts.ready.then(scheduleCollapsedHeightUpdate);
}
// END -> Расчёт высоты блока «О мероприятии» до первой полной строки описания

// BEGIN -> Логика работы копирования в буфер обмена ссылки на страницу и отображение сообщения пользователю об этом
function initCopyLinkButtons() {
	const copyLinkButtons = document.querySelectorAll('[data-copy-link="true"]');

	copyLinkButtons.forEach(button => {
		button.addEventListener('click', handleCopyLink);
		button.style.cursor = 'pointer';
	});
}

function handleCopyLink(event) {
	event.preventDefault();

	const currentUrl = window.location.href;
	const button = this;

	// Копирование в буфер обмена с использованием современного Clipboard API
	if (navigator.clipboard && navigator.clipboard.writeText) {
		navigator.clipboard.writeText(currentUrl)
			.then(() => {
				showNotification(button, 'Ссылка скопирована', 'success');
			})
			.catch(() => {
				// Резервный способ
				copyLinkFallback(currentUrl, button);
			});
	} else {
		// Резервный способ для старых браузеров
		copyLinkFallback(currentUrl, button);
	}
}

function copyLinkFallback(text, button) {
	const textArea = document.createElement('textarea');
	textArea.value = text;
	textArea.style.position = 'fixed';
	textArea.style.left = '-999999px';
	textArea.style.top = '-999999px';

	document.body.appendChild(textArea);
	textArea.focus();
	textArea.select();

	try {
		document.execCommand('copy');
		showNotification(button, 'Ссылка скопирована', 'success');
	} catch (error) {
		showNotification(button, 'Ошибка при копировании', 'error');
	}

	document.body.removeChild(textArea);
}

function showNotification(button, message, type = 'success') {
	// Очистить существующие таймауты для этой кнопки
	if (button._notificationTimeout)
		clearTimeout(button._notificationTimeout);

	if (button._notificationHideTimeout)
		clearTimeout(button._notificationHideTimeout);


	// Удалить существующее уведомление, если оно есть
	const existingNotification = button.querySelector('.copy-link-notification');
	if (existingNotification)
		existingNotification.remove();

	// Создать элемент уведомления
	const notification = document.createElement('div');
	notification.className = `copy-link-notification copy-link-notification--${type}`;
	notification.textContent = message;

	// Сделать кнопку контекстом позиционирования
	const originalPosition = button.style.position;
	button.style.position = 'relative';
	button.appendChild(notification);

	// Запустить анимацию
	requestAnimationFrame(() => {
		notification.classList.add('copy-link-notification--show');
	});

	// Установить таймаут для скрытия уведомления
	button._notificationTimeout = setTimeout(() => {
		notification.style.opacity = '0';
		notification.style.pointerEvents = 'none';

		button._notificationHideTimeout = setTimeout(() => {
			if (notification.parentElement)
				notification.remove();
			// Восстановить исходное положение, если оно не было задано.
			if (!originalPosition)
				button.style.position = '';
			// Очистить ссылки на тайм-ауты
			button._notificationTimeout = null;
			button._notificationHideTimeout = null;
		}, 300);
	}, 2000);
}

// Переинициализировать при загрузке AJAX контента
if (window.jQuery) jQuery(document).on('ajaxComplete', function () { initCopyLinkButtons() });

// END -> Логика работы копирования в буфер обмена ссылки на страницу и отображение сообщения пользователю об этом
/* End */
;
; /* Start:"a:4:{s:4:"full";s:74:"/local/components/tickets/vote/templates/.default/script.js?17526554202629";s:6:"source";s:59:"/local/components/tickets/vote/templates/.default/script.js";s:3:"min";s:0:"";s:3:"map";s:0:"";}"*/
document.addEventListener('DOMContentLoaded', () => {
    const voteButtons = document.querySelectorAll('.will-win .vote');
    const container = document.querySelector('.will-win__inner');

    voteButtons.forEach(button => {
        button.addEventListener('click', () => {
            const type = button.getAttribute('data-type');
            const eventId = button.getAttribute('data-event');

            if (!type || !eventId) return;

            const data = {
                EVENT_ID: eventId,
                CHOICE: type
            };

            fetch('/ajax/vote.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams(data).toString()
            })
                .then(response => {
                    if (!response.ok) throw new Error('Ошибка сети');
                    return response.json();
                })
                .then(data => {
                    // Если ответ не содержит A/B/C — не трогаем прогресс-бары
                    if (typeof data !== 'object' || data === null || (!data.A && !data.B && !data.C)) {
                        console.warn('Ответ без данных голосования, прогресс-бары не обновлены');
                        return;
                    }

                    // Добавляем класс _active, если его нет
                    if (container && !container.classList.contains('_active')) {
                        container.classList.add('_active');
                    }

                    // Обновляем только если есть значение
                    if (data.A !== undefined) updateProgress('A', data.A);
                    if (data.B !== undefined) updateProgress('B', data.B);
                    if (data.C !== undefined) updateProgress('C', data.C);
                })
                .catch(error => {
                    console.error('❌ Ошибка при голосовании:', error);
                });
        });
    });

    function updateProgress(type, percent) {
        const button = document.querySelector(`.vote[data-type="${type}"]`);
        if (!button) return;

        const bar = button.querySelector('.progress__bar');
        if (!bar) return;

        // Обновляем только если пришло значение, иначе ничего не трогаем
        bar.style.width = Math.floor(percent) + '%';
    }
});
/* End */
;
; /* Start:"a:4:{s:4:"full";s:104:"/local/templates/dombilet2.0/components/bitrix/catalog.element/.default/js/bootstrap.js?1773758466145543";s:6:"source";s:87:"/local/templates/dombilet2.0/components/bitrix/catalog.element/.default/js/bootstrap.js";s:3:"min";s:0:"";s:3:"map";s:0:"";}"*/
/*!
  * Bootstrap v5.2.3 (https://getbootstrap.com/)
  * Copyright 2011-2022 The Bootstrap Authors (https://github.com/twbs/bootstrap/graphs/contributors)
  * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
  */
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('@popperjs/core')) :
  typeof define === 'function' && define.amd ? define(['@popperjs/core'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.bootstrap = factory(global.Popper));
})(this, (function (Popper) { 'use strict';

  function _interopNamespace(e) {
    if (e && e.__esModule) return e;
    const n = Object.create(null, { [Symbol.toStringTag]: { value: 'Module' } });
    if (e) {
      for (const k in e) {
        if (k !== 'default') {
          const d = Object.getOwnPropertyDescriptor(e, k);
          Object.defineProperty(n, k, d.get ? d : {
            enumerable: true,
            get: () => e[k]
          });
        }
      }
    }
    n.default = e;
    return Object.freeze(n);
  }

  const Popper__namespace = /*#__PURE__*/_interopNamespace(Popper);

  /**
   * --------------------------------------------------------------------------
   * Bootstrap (v5.2.3): util/index.js
   * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
   * --------------------------------------------------------------------------
   */
  const MAX_UID = 1000000;
  const MILLISECONDS_MULTIPLIER = 1000;
  const TRANSITION_END = 'transitionend'; // Shout-out Angus Croll (https://goo.gl/pxwQGp)

  const toType = object => {
    if (object === null || object === undefined) {
      return `${object}`;
    }

    return Object.prototype.toString.call(object).match(/\s([a-z]+)/i)[1].toLowerCase();
  };
  /**
   * Public Util API
   */


  const getUID = prefix => {
    do {
      prefix += Math.floor(Math.random() * MAX_UID);
    } while (document.getElementById(prefix));

    return prefix;
  };

  const getSelector = element => {
    let selector = element.getAttribute('data-bs-target');

    if (!selector || selector === '#') {
      let hrefAttribute = element.getAttribute('href'); // The only valid content that could double as a selector are IDs or classes,
      // so everything starting with `#` or `.`. If a "real" URL is used as the selector,
      // `document.querySelector` will rightfully complain it is invalid.
      // See https://github.com/twbs/bootstrap/issues/32273

      if (!hrefAttribute || !hrefAttribute.includes('#') && !hrefAttribute.startsWith('.')) {
        return null;
      } // Just in case some CMS puts out a full URL with the anchor appended


      if (hrefAttribute.includes('#') && !hrefAttribute.startsWith('#')) {
        hrefAttribute = `#${hrefAttribute.split('#')[1]}`;
      }

      selector = hrefAttribute && hrefAttribute !== '#' ? hrefAttribute.trim() : null;
    }

    return selector;
  };

  const getSelectorFromElement = element => {
    const selector = getSelector(element);

    if (selector) {
      return document.querySelector(selector) ? selector : null;
    }

    return null;
  };

  const getElementFromSelector = element => {
    const selector = getSelector(element);
    return selector ? document.querySelector(selector) : null;
  };

  const getTransitionDurationFromElement = element => {
    if (!element) {
      return 0;
    } // Get transition-duration of the element


    let {
      transitionDuration,
      transitionDelay
    } = window.getComputedStyle(element);
    const floatTransitionDuration = Number.parseFloat(transitionDuration);
    const floatTransitionDelay = Number.parseFloat(transitionDelay); // Return 0 if element or transition duration is not found

    if (!floatTransitionDuration && !floatTransitionDelay) {
      return 0;
    } // If multiple durations are defined, take the first


    transitionDuration = transitionDuration.split(',')[0];
    transitionDelay = transitionDelay.split(',')[0];
    return (Number.parseFloat(transitionDuration) + Number.parseFloat(transitionDelay)) * MILLISECONDS_MULTIPLIER;
  };

  const triggerTransitionEnd = element => {
    element.dispatchEvent(new Event(TRANSITION_END));
  };

  const isElement = object => {
    if (!object || typeof object !== 'object') {
      return false;
    }

    if (typeof object.jquery !== 'undefined') {
      object = object[0];
    }

    return typeof object.nodeType !== 'undefined';
  };

  const getElement = object => {
    // it's a jQuery object or a node element
    if (isElement(object)) {
      return object.jquery ? object[0] : object;
    }

    if (typeof object === 'string' && object.length > 0) {
      return document.querySelector(object);
    }

    return null;
  };

  const isVisible = element => {
    if (!isElement(element) || element.getClientRects().length === 0) {
      return false;
    }

    const elementIsVisible = getComputedStyle(element).getPropertyValue('visibility') === 'visible'; // Handle `details` element as its content may falsie appear visible when it is closed

    const closedDetails = element.closest('details:not([open])');

    if (!closedDetails) {
      return elementIsVisible;
    }

    if (closedDetails !== element) {
      const summary = element.closest('summary');

      if (summary && summary.parentNode !== closedDetails) {
        return false;
      }

      if (summary === null) {
        return false;
      }
    }

    return elementIsVisible;
  };

  const isDisabled = element => {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) {
      return true;
    }

    if (element.classList.contains('disabled')) {
      return true;
    }

    if (typeof element.disabled !== 'undefined') {
      return element.disabled;
    }

    return element.hasAttribute('disabled') && element.getAttribute('disabled') !== 'false';
  };

  const findShadowRoot = element => {
    if (!document.documentElement.attachShadow) {
      return null;
    } // Can find the shadow root otherwise it'll return the document


    if (typeof element.getRootNode === 'function') {
      const root = element.getRootNode();
      return root instanceof ShadowRoot ? root : null;
    }

    if (element instanceof ShadowRoot) {
      return element;
    } // when we don't find a shadow root


    if (!element.parentNode) {
      return null;
    }

    return findShadowRoot(element.parentNode);
  };

  const noop = () => {};
  /**
   * Trick to restart an element's animation
   *
   * @param {HTMLElement} element
   * @return void
   *
   * @see https://www.charistheo.io/blog/2021/02/restart-a-css-animation-with-javascript/#restarting-a-css-animation
   */


  const reflow = element => {
    element.offsetHeight; // eslint-disable-line no-unused-expressions
  };

  const getjQuery = () => {
    if (window.jQuery && !document.body.hasAttribute('data-bs-no-jquery')) {
      return window.jQuery;
    }

    return null;
  };

  const DOMContentLoadedCallbacks = [];

  const onDOMContentLoaded = callback => {
    if (document.readyState === 'loading') {
      // add listener on the first call when the document is in loading state
      if (!DOMContentLoadedCallbacks.length) {
        document.addEventListener('DOMContentLoaded', () => {
          for (const callback of DOMContentLoadedCallbacks) {
            callback();
          }
        });
      }

      DOMContentLoadedCallbacks.push(callback);
    } else {
      callback();
    }
  };

  const isRTL = () => document.documentElement.dir === 'rtl';

  const defineJQueryPlugin = plugin => {
    onDOMContentLoaded(() => {
      const $ = getjQuery();
      /* istanbul ignore if */

      if ($) {
        const name = plugin.NAME;
        const JQUERY_NO_CONFLICT = $.fn[name];
        $.fn[name] = plugin.jQueryInterface;
        $.fn[name].Constructor = plugin;

        $.fn[name].noConflict = () => {
          $.fn[name] = JQUERY_NO_CONFLICT;
          return plugin.jQueryInterface;
        };
      }
    });
  };

  const execute = callback => {
    if (typeof callback === 'function') {
      callback();
    }
  };

  const executeAfterTransition = (callback, transitionElement, waitForTransition = true) => {
    if (!waitForTransition) {
      execute(callback);
      return;
    }

    const durationPadding = 5;
    const emulatedDuration = getTransitionDurationFromElement(transitionElement) + durationPadding;
    let called = false;

    const handler = ({
      target
    }) => {
      if (target !== transitionElement) {
        return;
      }

      called = true;
      transitionElement.removeEventListener(TRANSITION_END, handler);
      execute(callback);
    };

    transitionElement.addEventListener(TRANSITION_END, handler);
    setTimeout(() => {
      if (!called) {
        triggerTransitionEnd(transitionElement);
      }
    }, emulatedDuration);
  };
  /**
   * Return the previous/next element of a list.
   *
   * @param {array} list    The list of elements
   * @param activeElement   The active element
   * @param shouldGetNext   Choose to get next or previous element
   * @param isCycleAllowed
   * @return {Element|elem} The proper element
   */


  const getNextActiveElement = (list, activeElement, shouldGetNext, isCycleAllowed) => {
    const listLength = list.length;
    let index = list.indexOf(activeElement); // if the element does not exist in the list return an element
    // depending on the direction and if cycle is allowed

    if (index === -1) {
      return !shouldGetNext && isCycleAllowed ? list[listLength - 1] : list[0];
    }

    index += shouldGetNext ? 1 : -1;

    if (isCycleAllowed) {
      index = (index + listLength) % listLength;
    }

    return list[Math.max(0, Math.min(index, listLength - 1))];
  };

  /**
   * --------------------------------------------------------------------------
   * Bootstrap (v5.2.3): dom/event-handler.js
   * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
   * --------------------------------------------------------------------------
   */
  /**
   * Constants
   */

  const namespaceRegex = /[^.]*(?=\..*)\.|.*/;
  const stripNameRegex = /\..*/;
  const stripUidRegex = /::\d+$/;
  const eventRegistry = {}; // Events storage

  let uidEvent = 1;
  const customEvents = {
    mouseenter: 'mouseover',
    mouseleave: 'mouseout'
  };
  const nativeEvents = new Set(['click', 'dblclick', 'mouseup', 'mousedown', 'contextmenu', 'mousewheel', 'DOMMouseScroll', 'mouseover', 'mouseout', 'mousemove', 'selectstart', 'selectend', 'keydown', 'keypress', 'keyup', 'orientationchange', 'touchstart', 'touchmove', 'touchend', 'touchcancel', 'pointerdown', 'pointermove', 'pointerup', 'pointerleave', 'pointercancel', 'gesturestart', 'gesturechange', 'gestureend', 'focus', 'blur', 'change', 'reset', 'select', 'submit', 'focusin', 'focusout', 'load', 'unload', 'beforeunload', 'resize', 'move', 'DOMContentLoaded', 'readystatechange', 'error', 'abort', 'scroll']);
  /**
   * Private methods
   */

  function makeEventUid(element, uid) {
    return uid && `${uid}::${uidEvent++}` || element.uidEvent || uidEvent++;
  }

  function getElementEvents(element) {
    const uid = makeEventUid(element);
    element.uidEvent = uid;
    eventRegistry[uid] = eventRegistry[uid] || {};
    return eventRegistry[uid];
  }

  function bootstrapHandler(element, fn) {
    return function handler(event) {
      hydrateObj(event, {
        delegateTarget: element
      });

      if (handler.oneOff) {
        EventHandler.off(element, event.type, fn);
      }

      return fn.apply(element, [event]);
    };
  }

  function bootstrapDelegationHandler(element, selector, fn) {
    return function handler(event) {
      const domElements = element.querySelectorAll(selector);

      for (let {
        target
      } = event; target && target !== this; target = target.parentNode) {
        for (const domElement of domElements) {
          if (domElement !== target) {
            continue;
          }

          hydrateObj(event, {
            delegateTarget: target
          });

          if (handler.oneOff) {
            EventHandler.off(element, event.type, selector, fn);
          }

          return fn.apply(target, [event]);
        }
      }
    };
  }

  function findHandler(events, callable, delegationSelector = null) {
    return Object.values(events).find(event => event.callable === callable && event.delegationSelector === delegationSelector);
  }

  function normalizeParameters(originalTypeEvent, handler, delegationFunction) {
    const isDelegated = typeof handler === 'string'; // todo: tooltip passes `false` instead of selector, so we need to check

    const callable = isDelegated ? delegationFunction : handler || delegationFunction;
    let typeEvent = getTypeEvent(originalTypeEvent);

    if (!nativeEvents.has(typeEvent)) {
      typeEvent = originalTypeEvent;
    }

    return [isDelegated, callable, typeEvent];
  }

  function addHandler(element, originalTypeEvent, handler, delegationFunction, oneOff) {
    if (typeof originalTypeEvent !== 'string' || !element) {
      return;
    }

    let [isDelegated, callable, typeEvent] = normalizeParameters(originalTypeEvent, handler, delegationFunction); // in case of mouseenter or mouseleave wrap the handler within a function that checks for its DOM position
    // this prevents the handler from being dispatched the same way as mouseover or mouseout does

    if (originalTypeEvent in customEvents) {
      const wrapFunction = fn => {
        return function (event) {
          if (!event.relatedTarget || event.relatedTarget !== event.delegateTarget && !event.delegateTarget.contains(event.relatedTarget)) {
            return fn.call(this, event);
          }
        };
      };

      callable = wrapFunction(callable);
    }

    const events = getElementEvents(element);
    const handlers = events[typeEvent] || (events[typeEvent] = {});
    const previousFunction = findHandler(handlers, callable, isDelegated ? handler : null);

    if (previousFunction) {
      previousFunction.oneOff = previousFunction.oneOff && oneOff;
      return;
    }

    const uid = makeEventUid(callable, originalTypeEvent.replace(namespaceRegex, ''));
    const fn = isDelegated ? bootstrapDelegationHandler(element, handler, callable) : bootstrapHandler(element, callable);
    fn.delegationSelector = isDelegated ? handler : null;
    fn.callable = callable;
    fn.oneOff = oneOff;
    fn.uidEvent = uid;
    handlers[uid] = fn;
    element.addEventListener(typeEvent, fn, isDelegated);
  }

  function removeHandler(element, events, typeEvent, handler, delegationSelector) {
    const fn = findHandler(events[typeEvent], handler, delegationSelector);

    if (!fn) {
      return;
    }

    element.removeEventListener(typeEvent, fn, Boolean(delegationSelector));
    delete events[typeEvent][fn.uidEvent];
  }

  function removeNamespacedHandlers(element, events, typeEvent, namespace) {
    const storeElementEvent = events[typeEvent] || {};

    for (const handlerKey of Object.keys(storeElementEvent)) {
      if (handlerKey.includes(namespace)) {
        const event = storeElementEvent[handlerKey];
        removeHandler(element, events, typeEvent, event.callable, event.delegationSelector);
      }
    }
  }

  function getTypeEvent(event) {
    // allow to get the native events from namespaced events ('click.bs.button' --> 'click')
    event = event.replace(stripNameRegex, '');
    return customEvents[event] || event;
  }

  const EventHandler = {
    on(element, event, handler, delegationFunction) {
      addHandler(element, event, handler, delegationFunction, false);
    },

    one(element, event, handler, delegationFunction) {
      addHandler(element, event, handler, delegationFunction, true);
    },

    off(element, originalTypeEvent, handler, delegationFunction) {
      if (typeof originalTypeEvent !== 'string' || !element) {
        return;
      }

      const [isDelegated, callable, typeEvent] = normalizeParameters(originalTypeEvent, handler, delegationFunction);
      const inNamespace = typeEvent !== originalTypeEvent;
      const events = getElementEvents(element);
      const storeElementEvent = events[typeEvent] || {};
      const isNamespace = originalTypeEvent.startsWith('.');

      if (typeof callable !== 'undefined') {
        // Simplest case: handler is passed, remove that listener ONLY.
        if (!Object.keys(storeElementEvent).length) {
          return;
        }

        removeHandler(element, events, typeEvent, callable, isDelegated ? handler : null);
        return;
      }

      if (isNamespace) {
        for (const elementEvent of Object.keys(events)) {
          removeNamespacedHandlers(element, events, elementEvent, originalTypeEvent.slice(1));
        }
      }

      for (const keyHandlers of Object.keys(storeElementEvent)) {
        const handlerKey = keyHandlers.replace(stripUidRegex, '');

        if (!inNamespace || originalTypeEvent.includes(handlerKey)) {
          const event = storeElementEvent[keyHandlers];
          removeHandler(element, events, typeEvent, event.callable, event.delegationSelector);
        }
      }
    },

    trigger(element, event, args) {
      if (typeof event !== 'string' || !element) {
        return null;
      }

      const $ = getjQuery();
      const typeEvent = getTypeEvent(event);
      const inNamespace = event !== typeEvent;
      let jQueryEvent = null;
      let bubbles = true;
      let nativeDispatch = true;
      let defaultPrevented = false;

      if (inNamespace && $) {
        jQueryEvent = $.Event(event, args);
        $(element).trigger(jQueryEvent);
        bubbles = !jQueryEvent.isPropagationStopped();
        nativeDispatch = !jQueryEvent.isImmediatePropagationStopped();
        defaultPrevented = jQueryEvent.isDefaultPrevented();
      }

      let evt = new Event(event, {
        bubbles,
        cancelable: true
      });
      evt = hydrateObj(evt, args);

      if (defaultPrevented) {
        evt.preventDefault();
      }

      if (nativeDispatch) {
        element.dispatchEvent(evt);
      }

      if (evt.defaultPrevented && jQueryEvent) {
        jQueryEvent.preventDefault();
      }

      return evt;
    }

  };

  function hydrateObj(obj, meta) {
    for (const [key, value] of Object.entries(meta || {})) {
      try {
        obj[key] = value;
      } catch (_unused) {
        Object.defineProperty(obj, key, {
          configurable: true,

          get() {
            return value;
          }

        });
      }
    }

    return obj;
  }

  /**
   * --------------------------------------------------------------------------
   * Bootstrap (v5.2.3): dom/data.js
   * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
   * --------------------------------------------------------------------------
   */

  /**
   * Constants
   */
  const elementMap = new Map();
  const Data = {
    set(element, key, instance) {
      if (!elementMap.has(element)) {
        elementMap.set(element, new Map());
      }

      const instanceMap = elementMap.get(element); // make it clear we only want one instance per element
      // can be removed later when multiple key/instances are fine to be used

      if (!instanceMap.has(key) && instanceMap.size !== 0) {
        // eslint-disable-next-line no-console
        console.error(`Bootstrap doesn't allow more than one instance per element. Bound instance: ${Array.from(instanceMap.keys())[0]}.`);
        return;
      }

      instanceMap.set(key, instance);
    },

    get(element, key) {
      if (elementMap.has(element)) {
        return elementMap.get(element).get(key) || null;
      }

      return null;
    },

    remove(element, key) {
      if (!elementMap.has(element)) {
        return;
      }

      const instanceMap = elementMap.get(element);
      instanceMap.delete(key); // free up element references if there are no instances left for an element

      if (instanceMap.size === 0) {
        elementMap.delete(element);
      }
    }

  };

  /**
   * --------------------------------------------------------------------------
   * Bootstrap (v5.2.3): dom/manipulator.js
   * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
   * --------------------------------------------------------------------------
   */
  function normalizeData(value) {
    if (value === 'true') {
      return true;
    }

    if (value === 'false') {
      return false;
    }

    if (value === Number(value).toString()) {
      return Number(value);
    }

    if (value === '' || value === 'null') {
      return null;
    }

    if (typeof value !== 'string') {
      return value;
    }

    try {
      return JSON.parse(decodeURIComponent(value));
    } catch (_unused) {
      return value;
    }
  }

  function normalizeDataKey(key) {
    return key.replace(/[A-Z]/g, chr => `-${chr.toLowerCase()}`);
  }

  const Manipulator = {
    setDataAttribute(element, key, value) {
      element.setAttribute(`data-bs-${normalizeDataKey(key)}`, value);
    },

    removeDataAttribute(element, key) {
      element.removeAttribute(`data-bs-${normalizeDataKey(key)}`);
    },

    getDataAttributes(element) {
      if (!element) {
        return {};
      }

      const attributes = {};
      const bsKeys = Object.keys(element.dataset).filter(key => key.startsWith('bs') && !key.startsWith('bsConfig'));

      for (const key of bsKeys) {
        let pureKey = key.replace(/^bs/, '');
        pureKey = pureKey.charAt(0).toLowerCase() + pureKey.slice(1, pureKey.length);
        attributes[pureKey] = normalizeData(element.dataset[key]);
      }

      return attributes;
    },

    getDataAttribute(element, key) {
      return normalizeData(element.getAttribute(`data-bs-${normalizeDataKey(key)}`));
    }

  };

  /**
   * --------------------------------------------------------------------------
   * Bootstrap (v5.2.3): util/config.js
   * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
   * --------------------------------------------------------------------------
   */
  /**
   * Class definition
   */

  class Config {
    // Getters
    static get Default() {
      return {};
    }

    static get DefaultType() {
      return {};
    }

    static get NAME() {
      throw new Error('You have to implement the static method "NAME", for each component!');
    }

    _getConfig(config) {
      config = this._mergeConfigObj(config);
      config = this._configAfterMerge(config);

      this._typeCheckConfig(config);

      return config;
    }

    _configAfterMerge(config) {
      return config;
    }

    _mergeConfigObj(config, element) {
      const jsonConfig = isElement(element) ? Manipulator.getDataAttribute(element, 'config') : {}; // try to parse

      return { ...this.constructor.Default,
        ...(typeof jsonConfig === 'object' ? jsonConfig : {}),
        ...(isElement(element) ? Manipulator.getDataAttributes(element) : {}),
        ...(typeof config === 'object' ? config : {})
      };
    }

    _typeCheckConfig(config, configTypes = this.constructor.DefaultType) {
      for (const property of Object.keys(configTypes)) {
        const expectedTypes = configTypes[property];
        const value = config[property];
        const valueType = isElement(value) ? 'element' : toType(value);

        if (!new RegExp(expectedTypes).test(valueType)) {
          throw new TypeError(`${this.constructor.NAME.toUpperCase()}: Option "${property}" provided type "${valueType}" but expected type "${expectedTypes}".`);
        }
      }
    }

  }

  /**
   * --------------------------------------------------------------------------
   * Bootstrap (v5.2.3): base-component.js
   * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
   * --------------------------------------------------------------------------
   */
  /**
   * Constants
   */

  const VERSION = '5.2.3';
  /**
   * Class definition
   */

  class BaseComponent extends Config {
    constructor(element, config) {
      super();
      element = getElement(element);

      if (!element) {
        return;
      }

      this._element = element;
      this._config = this._getConfig(config);
      Data.set(this._element, this.constructor.DATA_KEY, this);
    } // Public


    dispose() {
      Data.remove(this._element, this.constructor.DATA_KEY);
      EventHandler.off(this._element, this.constructor.EVENT_KEY);

      for (const propertyName of Object.getOwnPropertyNames(this)) {
        this[propertyName] = null;
      }
    }

    _queueCallback(callback, element, isAnimated = true) {
      executeAfterTransition(callback, element, isAnimated);
    }

    _getConfig(config) {
      config = this._mergeConfigObj(config, this._element);
      config = this._configAfterMerge(config);

      this._typeCheckConfig(config);

      return config;
    } // Static


    static getInstance(element) {
      return Data.get(getElement(element), this.DATA_KEY);
    }

    static getOrCreateInstance(element, config = {}) {
      return this.getInstance(element) || new this(element, typeof config === 'object' ? config : null);
    }

    static get VERSION() {
      return VERSION;
    }

    static get DATA_KEY() {
      return `bs.${this.NAME}`;
    }

    static get EVENT_KEY() {
      return `.${this.DATA_KEY}`;
    }

    static eventName(name) {
      return `${name}${this.EVENT_KEY}`;
    }

  }

  /**
   * --------------------------------------------------------------------------
   * Bootstrap (v5.2.3): util/component-functions.js
   * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
   * --------------------------------------------------------------------------
   */

  const enableDismissTrigger = (component, method = 'hide') => {
    const clickEvent = `click.dismiss${component.EVENT_KEY}`;
    const name = component.NAME;
    EventHandler.on(document, clickEvent, `[data-bs-dismiss="${name}"]`, function (event) {
      if (['A', 'AREA'].includes(this.tagName)) {
        event.preventDefault();
      }

      if (isDisabled(this)) {
        return;
      }

      const target = getElementFromSelector(this) || this.closest(`.${name}`);
      const instance = component.getOrCreateInstance(target); // Method argument is left, for Alert and only, as it doesn't implement the 'hide' method

      instance[method]();
    });
  };

  /**
   * --------------------------------------------------------------------------
   * Bootstrap (v5.2.3): alert.js
   * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
   * --------------------------------------------------------------------------
   */
  /**
   * Constants
   */

  const NAME$f = 'alert';
  const DATA_KEY$a = 'bs.alert';
  const EVENT_KEY$b = `.${DATA_KEY$a}`;
  const EVENT_CLOSE = `close${EVENT_KEY$b}`;
  const EVENT_CLOSED = `closed${EVENT_KEY$b}`;
  const CLASS_NAME_FADE$5 = 'fade';
  const CLASS_NAME_SHOW$8 = 'show';
  /**
   * Class definition
   */

  class Alert extends BaseComponent {
    // Getters
    static get NAME() {
      return NAME$f;
    } // Public


    close() {
      const closeEvent = EventHandler.trigger(this._element, EVENT_CLOSE);

      if (closeEvent.defaultPrevented) {
        return;
      }

      this._element.classList.remove(CLASS_NAME_SHOW$8);

      const isAnimated = this._element.classList.contains(CLASS_NAME_FADE$5);

      this._queueCallback(() => this._destroyElement(), this._element, isAnimated);
    } // Private


    _destroyElement() {
      this._element.remove();

      EventHandler.trigger(this._element, EVENT_CLOSED);
      this.dispose();
    } // Static


    static jQueryInterface(config) {
      return this.each(function () {
        const data = Alert.getOrCreateInstance(this);

        if (typeof config !== 'string') {
          return;
        }

        if (data[config] === undefined || config.startsWith('_') || config === 'constructor') {
          throw new TypeError(`No method named "${config}"`);
        }

        data[config](this);
      });
    }

  }
  /**
   * Data API implementation
   */


  enableDismissTrigger(Alert, 'close');
  /**
   * jQuery
   */

  defineJQueryPlugin(Alert);

  /**
   * --------------------------------------------------------------------------
   * Bootstrap (v5.2.3): button.js
   * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
   * --------------------------------------------------------------------------
   */
  /**
   * Constants
   */

  const NAME$e = 'button';
  const DATA_KEY$9 = 'bs.button';
  const EVENT_KEY$a = `.${DATA_KEY$9}`;
  const DATA_API_KEY$6 = '.data-api';
  const CLASS_NAME_ACTIVE$3 = 'active';
  const SELECTOR_DATA_TOGGLE$5 = '[data-bs-toggle="button"]';
  const EVENT_CLICK_DATA_API$6 = `click${EVENT_KEY$a}${DATA_API_KEY$6}`;
  /**
   * Class definition
   */

  class Button extends BaseComponent {
    // Getters
    static get NAME() {
      return NAME$e;
    } // Public


    toggle() {
      // Toggle class and sync the `aria-pressed` attribute with the return value of the `.toggle()` method
      this._element.setAttribute('aria-pressed', this._element.classList.toggle(CLASS_NAME_ACTIVE$3));
    } // Static


    static jQueryInterface(config) {
      return this.each(function () {
        const data = Button.getOrCreateInstance(this);

        if (config === 'toggle') {
          data[config]();
        }
      });
    }

  }
  /**
   * Data API implementation
   */


  EventHandler.on(document, EVENT_CLICK_DATA_API$6, SELECTOR_DATA_TOGGLE$5, event => {
    event.preventDefault();
    const button = event.target.closest(SELECTOR_DATA_TOGGLE$5);
    const data = Button.getOrCreateInstance(button);
    data.toggle();
  });
  /**
   * jQuery
   */

  defineJQueryPlugin(Button);

  /**
   * --------------------------------------------------------------------------
   * Bootstrap (v5.2.3): dom/selector-engine.js
   * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
   * --------------------------------------------------------------------------
   */
  /**
   * Constants
   */

  const SelectorEngine = {
    find(selector, element = document.documentElement) {
      return [].concat(...Element.prototype.querySelectorAll.call(element, selector));
    },

    findOne(selector, element = document.documentElement) {
      return Element.prototype.querySelector.call(element, selector);
    },

    children(element, selector) {
      return [].concat(...element.children).filter(child => child.matches(selector));
    },

    parents(element, selector) {
      const parents = [];
      let ancestor = element.parentNode.closest(selector);

      while (ancestor) {
        parents.push(ancestor);
        ancestor = ancestor.parentNode.closest(selector);
      }

      return parents;
    },

    prev(element, selector) {
      let previous = element.previousElementSibling;

      while (previous) {
        if (previous.matches(selector)) {
          return [previous];
        }

        previous = previous.previousElementSibling;
      }

      return [];
    },

    // TODO: this is now unused; remove later along with prev()
    next(element, selector) {
      let next = element.nextElementSibling;

      while (next) {
        if (next.matches(selector)) {
          return [next];
        }

        next = next.nextElementSibling;
      }

      return [];
    },

    focusableChildren(element) {
      const focusables = ['a', 'button', 'input', 'textarea', 'select', 'details', '[tabindex]', '[contenteditable="true"]'].map(selector => `${selector}:not([tabindex^="-"])`).join(',');
      return this.find(focusables, element).filter(el => !isDisabled(el) && isVisible(el));
    }

  };

  /**
   * --------------------------------------------------------------------------
   * Bootstrap (v5.2.3): util/swipe.js
   * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
   * --------------------------------------------------------------------------
   */
  /**
   * Constants
   */

  const NAME$d = 'swipe';
  const EVENT_KEY$9 = '.bs.swipe';
  const EVENT_TOUCHSTART = `touchstart${EVENT_KEY$9}`;
  const EVENT_TOUCHMOVE = `touchmove${EVENT_KEY$9}`;
  const EVENT_TOUCHEND = `touchend${EVENT_KEY$9}`;
  const EVENT_POINTERDOWN = `pointerdown${EVENT_KEY$9}`;
  const EVENT_POINTERUP = `pointerup${EVENT_KEY$9}`;
  const POINTER_TYPE_TOUCH = 'touch';
  const POINTER_TYPE_PEN = 'pen';
  const CLASS_NAME_POINTER_EVENT = 'pointer-event';
  const SWIPE_THRESHOLD = 40;
  const Default$c = {
    endCallback: null,
    leftCallback: null,
    rightCallback: null
  };
  const DefaultType$c = {
    endCallback: '(function|null)',
    leftCallback: '(function|null)',
    rightCallback: '(function|null)'
  };
  /**
   * Class definition
   */

  class Swipe extends Config {
    constructor(element, config) {
      super();
      this._element = element;

      if (!element || !Swipe.isSupported()) {
        return;
      }

      this._config = this._getConfig(config);
      this._deltaX = 0;
      this._supportPointerEvents = Boolean(window.PointerEvent);

      this._initEvents();
    } // Getters


    static get Default() {
      return Default$c;
    }

    static get DefaultType() {
      return DefaultType$c;
    }

    static get NAME() {
      return NAME$d;
    } // Public


    dispose() {
      EventHandler.off(this._element, EVENT_KEY$9);
    } // Private


    _start(event) {
      if (!this._supportPointerEvents) {
        this._deltaX = event.touches[0].clientX;
        return;
      }

      if (this._eventIsPointerPenTouch(event)) {
        this._deltaX = event.clientX;
      }
    }

    _end(event) {
      if (this._eventIsPointerPenTouch(event)) {
        this._deltaX = event.clientX - this._deltaX;
      }

      this._handleSwipe();

      execute(this._config.endCallback);
    }

    _move(event) {
      this._deltaX = event.touches && event.touches.length > 1 ? 0 : event.touches[0].clientX - this._deltaX;
    }

    _handleSwipe() {
      const absDeltaX = Math.abs(this._deltaX);

      if (absDeltaX <= SWIPE_THRESHOLD) {
        return;
      }

      const direction = absDeltaX / this._deltaX;
      this._deltaX = 0;

      if (!direction) {
        return;
      }

      execute(direction > 0 ? this._config.rightCallback : this._config.leftCallback);
    }

    _initEvents() {
      if (this._supportPointerEvents) {
        EventHandler.on(this._element, EVENT_POINTERDOWN, event => this._start(event));
        EventHandler.on(this._element, EVENT_POINTERUP, event => this._end(event));

        this._element.classList.add(CLASS_NAME_POINTER_EVENT);
      } else {
        EventHandler.on(this._element, EVENT_TOUCHSTART, event => this._start(event));
        EventHandler.on(this._element, EVENT_TOUCHMOVE, event => this._move(event));
        EventHandler.on(this._element, EVENT_TOUCHEND, event => this._end(event));
      }
    }

    _eventIsPointerPenTouch(event) {
      return this._supportPointerEvents && (event.pointerType === POINTER_TYPE_PEN || event.pointerType === POINTER_TYPE_TOUCH);
    } // Static


    static isSupported() {
      return 'ontouchstart' in document.documentElement || navigator.maxTouchPoints > 0;
    }

  }

  /**
   * --------------------------------------------------------------------------
   * Bootstrap (v5.2.3): carousel.js
   * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
   * --------------------------------------------------------------------------
   */
  /**
   * Constants
   */

  const NAME$c = 'carousel';
  const DATA_KEY$8 = 'bs.carousel';
  const EVENT_KEY$8 = `.${DATA_KEY$8}`;
  const DATA_API_KEY$5 = '.data-api';
  const ARROW_LEFT_KEY$1 = 'ArrowLeft';
  const ARROW_RIGHT_KEY$1 = 'ArrowRight';
  const TOUCHEVENT_COMPAT_WAIT = 500; // Time for mouse compat events to fire after touch

  const ORDER_NEXT = 'next';
  const ORDER_PREV = 'prev';
  const DIRECTION_LEFT = 'left';
  const DIRECTION_RIGHT = 'right';
  const EVENT_SLIDE = `slide${EVENT_KEY$8}`;
  const EVENT_SLID = `slid${EVENT_KEY$8}`;
  const EVENT_KEYDOWN$1 = `keydown${EVENT_KEY$8}`;
  const EVENT_MOUSEENTER$1 = `mouseenter${EVENT_KEY$8}`;
  const EVENT_MOUSELEAVE$1 = `mouseleave${EVENT_KEY$8}`;
  const EVENT_DRAG_START = `dragstart${EVENT_KEY$8}`;
  const EVENT_LOAD_DATA_API$3 = `load${EVENT_KEY$8}${DATA_API_KEY$5}`;
  const EVENT_CLICK_DATA_API$5 = `click${EVENT_KEY$8}${DATA_API_KEY$5}`;
  const CLASS_NAME_CAROUSEL = 'carousel';
  const CLASS_NAME_ACTIVE$2 = 'active';
  const CLASS_NAME_SLIDE = 'slide';
  const CLASS_NAME_END = 'carousel-item-end';
  const CLASS_NAME_START = 'carousel-item-start';
  const CLASS_NAME_NEXT = 'carousel-item-next';
  const CLASS_NAME_PREV = 'carousel-item-prev';
  const SELECTOR_ACTIVE = '.active';
  const SELECTOR_ITEM = '.carousel-item';
  const SELECTOR_ACTIVE_ITEM = SELECTOR_ACTIVE + SELECTOR_ITEM;
  const SELECTOR_ITEM_IMG = '.carousel-item img';
  const SELECTOR_INDICATORS = '.carousel-indicators';
  const SELECTOR_DATA_SLIDE = '[data-bs-slide], [data-bs-slide-to]';
  const SELECTOR_DATA_RIDE = '[data-bs-ride="carousel"]';
  const KEY_TO_DIRECTION = {
    [ARROW_LEFT_KEY$1]: DIRECTION_RIGHT,
    [ARROW_RIGHT_KEY$1]: DIRECTION_LEFT
  };
  const Default$b = {
    interval: 5000,
    keyboard: true,
    pause: 'hover',
    ride: false,
    touch: true,
    wrap: true
  };
  const DefaultType$b = {
    interval: '(number|boolean)',
    // TODO:v6 remove boolean support
    keyboard: 'boolean',
    pause: '(string|boolean)',
    ride: '(boolean|string)',
    touch: 'boolean',
    wrap: 'boolean'
  };
  /**
   * Class definition
   */

  class Carousel extends BaseComponent {
    constructor(element, config) {
      super(element, config);
      this._interval = null;
      this._activeElement = null;
      this._isSliding = false;
      this.touchTimeout = null;
      this._swipeHelper = null;
      this._indicatorsElement = SelectorEngine.findOne(SELECTOR_INDICATORS, this._element);

      this._addEventListeners();

      if (this._config.ride === CLASS_NAME_CAROUSEL) {
        this.cycle();
      }
    } // Getters


    static get Default() {
      return Default$b;
    }

    static get DefaultType() {
      return DefaultType$b;
    }

    static get NAME() {
      return NAME$c;
    } // Public


    next() {
      this._slide(ORDER_NEXT);
    }

    nextWhenVisible() {
      // FIXME TODO use `document.visibilityState`
      // Don't call next when the page isn't visible
      // or the carousel or its parent isn't visible
      if (!document.hidden && isVisible(this._element)) {
        this.next();
      }
    }

    prev() {
      this._slide(ORDER_PREV);
    }

    pause() {
      if (this._isSliding) {
        triggerTransitionEnd(this._element);
      }

      this._clearInterval();
    }

    cycle() {
      this._clearInterval();

      this._updateInterval();

      this._interval = setInterval(() => this.nextWhenVisible(), this._config.interval);
    }

    _maybeEnableCycle() {
      if (!this._config.ride) {
        return;
      }

      if (this._isSliding) {
        EventHandler.one(this._element, EVENT_SLID, () => this.cycle());
        return;
      }

      this.cycle();
    }

    to(index) {
      const items = this._getItems();

      if (index > items.length - 1 || index < 0) {
        return;
      }

      if (this._isSliding) {
        EventHandler.one(this._element, EVENT_SLID, () => this.to(index));
        return;
      }

      const activeIndex = this._getItemIndex(this._getActive());

      if (activeIndex === index) {
        return;
      }

      const order = index > activeIndex ? ORDER_NEXT : ORDER_PREV;

      this._slide(order, items[index]);
    }

    dispose() {
      if (this._swipeHelper) {
        this._swipeHelper.dispose();
      }

      super.dispose();
    } // Private


    _configAfterMerge(config) {
      config.defaultInterval = config.interval;
      return config;
    }

    _addEventListeners() {
      if (this._config.keyboard) {
        EventHandler.on(this._element, EVENT_KEYDOWN$1, event => this._keydown(event));
      }

      if (this._config.pause === 'hover') {
        EventHandler.on(this._element, EVENT_MOUSEENTER$1, () => this.pause());
        EventHandler.on(this._element, EVENT_MOUSELEAVE$1, () => this._maybeEnableCycle());
      }

      if (this._config.touch && Swipe.isSupported()) {
        this._addTouchEventListeners();
      }
    }

    _addTouchEventListeners() {
      for (const img of SelectorEngine.find(SELECTOR_ITEM_IMG, this._element)) {
        EventHandler.on(img, EVENT_DRAG_START, event => event.preventDefault());
      }

      const endCallBack = () => {
        if (this._config.pause !== 'hover') {
          return;
        } // If it's a touch-enabled device, mouseenter/leave are fired as
        // part of the mouse compatibility events on first tap - the carousel
        // would stop cycling until user tapped out of it;
        // here, we listen for touchend, explicitly pause the carousel
        // (as if it's the second time we tap on it, mouseenter compat event
        // is NOT fired) and after a timeout (to allow for mouse compatibility
        // events to fire) we explicitly restart cycling


        this.pause();

        if (this.touchTimeout) {
          clearTimeout(this.touchTimeout);
        }

        this.touchTimeout = setTimeout(() => this._maybeEnableCycle(), TOUCHEVENT_COMPAT_WAIT + this._config.interval);
      };

      const swipeConfig = {
        leftCallback: () => this._slide(this._directionToOrder(DIRECTION_LEFT)),
        rightCallback: () => this._slide(this._directionToOrder(DIRECTION_RIGHT)),
        endCallback: endCallBack
      };
      this._swipeHelper = new Swipe(this._element, swipeConfig);
    }

    _keydown(event) {
      if (/input|textarea/i.test(event.target.tagName)) {
        return;
      }

      const direction = KEY_TO_DIRECTION[event.key];

      if (direction) {
        event.preventDefault();

        this._slide(this._directionToOrder(direction));
      }
    }

    _getItemIndex(element) {
      return this._getItems().indexOf(element);
    }

    _setActiveIndicatorElement(index) {
      if (!this._indicatorsElement) {
        return;
      }

      const activeIndicator = SelectorEngine.findOne(SELECTOR_ACTIVE, this._indicatorsElement);
      activeIndicator.classList.remove(CLASS_NAME_ACTIVE$2);
      activeIndicator.removeAttribute('aria-current');
      const newActiveIndicator = SelectorEngine.findOne(`[data-bs-slide-to="${index}"]`, this._indicatorsElement);

      if (newActiveIndicator) {
        newActiveIndicator.classList.add(CLASS_NAME_ACTIVE$2);
        newActiveIndicator.setAttribute('aria-current', 'true');
      }
    }

    _updateInterval() {
      const element = this._activeElement || this._getActive();

      if (!element) {
        return;
      }

      const elementInterval = Number.parseInt(element.getAttribute('data-bs-interval'), 10);
      this._config.interval = elementInterval || this._config.defaultInterval;
    }

    _slide(order, element = null) {
      if (this._isSliding) {
        return;
      }

      const activeElement = this._getActive();

      const isNext = order === ORDER_NEXT;
      const nextElement = element || getNextActiveElement(this._getItems(), activeElement, isNext, this._config.wrap);

      if (nextElement === activeElement) {
        return;
      }

      const nextElementIndex = this._getItemIndex(nextElement);

      const triggerEvent = eventName => {
        return EventHandler.trigger(this._element, eventName, {
          relatedTarget: nextElement,
          direction: this._orderToDirection(order),
          from: this._getItemIndex(activeElement),
          to: nextElementIndex
        });
      };

      const slideEvent = triggerEvent(EVENT_SLIDE);

      if (slideEvent.defaultPrevented) {
        return;
      }

      if (!activeElement || !nextElement) {
        // Some weirdness is happening, so we bail
        // todo: change tests that use empty divs to avoid this check
        return;
      }

      const isCycling = Boolean(this._interval);
      this.pause();
      this._isSliding = true;

      this._setActiveIndicatorElement(nextElementIndex);

      this._activeElement = nextElement;
      const directionalClassName = isNext ? CLASS_NAME_START : CLASS_NAME_END;
      const orderClassName = isNext ? CLASS_NAME_NEXT : CLASS_NAME_PREV;
      nextElement.classList.add(orderClassName);
      reflow(nextElement);
      activeElement.classList.add(directionalClassName);
      nextElement.classList.add(directionalClassName);

      const completeCallBack = () => {
        nextElement.classList.remove(directionalClassName, orderClassName);
        nextElement.classList.add(CLASS_NAME_ACTIVE$2);
        activeElement.classList.remove(CLASS_NAME_ACTIVE$2, orderClassName, directionalClassName);
        this._isSliding = false;
        triggerEvent(EVENT_SLID);
      };

      this._queueCallback(completeCallBack, activeElement, this._isAnimated());

      if (isCycling) {
        this.cycle();
      }
    }

    _isAnimated() {
      return this._element.classList.contains(CLASS_NAME_SLIDE);
    }

    _getActive() {
      return SelectorEngine.findOne(SELECTOR_ACTIVE_ITEM, this._element);
    }

    _getItems() {
      return SelectorEngine.find(SELECTOR_ITEM, this._element);
    }

    _clearInterval() {
      if (this._interval) {
        clearInterval(this._interval);
        this._interval = null;
      }
    }

    _directionToOrder(direction) {
      if (isRTL()) {
        return direction === DIRECTION_LEFT ? ORDER_PREV : ORDER_NEXT;
      }

      return direction === DIRECTION_LEFT ? ORDER_NEXT : ORDER_PREV;
    }

    _orderToDirection(order) {
      if (isRTL()) {
        return order === ORDER_PREV ? DIRECTION_LEFT : DIRECTION_RIGHT;
      }

      return order === ORDER_PREV ? DIRECTION_RIGHT : DIRECTION_LEFT;
    } // Static


    static jQueryInterface(config) {
      return this.each(function () {
        const data = Carousel.getOrCreateInstance(this, config);

        if (typeof config === 'number') {
          data.to(config);
          return;
        }

        if (typeof config === 'string') {
          if (data[config] === undefined || config.startsWith('_') || config === 'constructor') {
            throw new TypeError(`No method named "${config}"`);
          }

          data[config]();
        }
      });
    }

  }
  /**
   * Data API implementation
   */


  EventHandler.on(document, EVENT_CLICK_DATA_API$5, SELECTOR_DATA_SLIDE, function (event) {
    const target = getElementFromSelector(this);

    if (!target || !target.classList.contains(CLASS_NAME_CAROUSEL)) {
      return;
    }

    event.preventDefault();
    const carousel = Carousel.getOrCreateInstance(target);
    const slideIndex = this.getAttribute('data-bs-slide-to');

    if (slideIndex) {
      carousel.to(slideIndex);

      carousel._maybeEnableCycle();

      return;
    }

    if (Manipulator.getDataAttribute(this, 'slide') === 'next') {
      carousel.next();

      carousel._maybeEnableCycle();

      return;
    }

    carousel.prev();

    carousel._maybeEnableCycle();
  });
  EventHandler.on(window, EVENT_LOAD_DATA_API$3, () => {
    const carousels = SelectorEngine.find(SELECTOR_DATA_RIDE);

    for (const carousel of carousels) {
      Carousel.getOrCreateInstance(carousel);
    }
  });
  /**
   * jQuery
   */

  defineJQueryPlugin(Carousel);

  /**
   * --------------------------------------------------------------------------
   * Bootstrap (v5.2.3): collapse.js
   * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
   * --------------------------------------------------------------------------
   */
  /**
   * Constants
   */

  const NAME$b = 'collapse';
  const DATA_KEY$7 = 'bs.collapse';
  const EVENT_KEY$7 = `.${DATA_KEY$7}`;
  const DATA_API_KEY$4 = '.data-api';
  const EVENT_SHOW$6 = `show${EVENT_KEY$7}`;
  const EVENT_SHOWN$6 = `shown${EVENT_KEY$7}`;
  const EVENT_HIDE$6 = `hide${EVENT_KEY$7}`;
  const EVENT_HIDDEN$6 = `hidden${EVENT_KEY$7}`;
  const EVENT_CLICK_DATA_API$4 = `click${EVENT_KEY$7}${DATA_API_KEY$4}`;
  const CLASS_NAME_SHOW$7 = 'show';
  const CLASS_NAME_COLLAPSE = 'collapse';
  const CLASS_NAME_COLLAPSING = 'collapsing';
  const CLASS_NAME_COLLAPSED = 'collapsed';
  const CLASS_NAME_DEEPER_CHILDREN = `:scope .${CLASS_NAME_COLLAPSE} .${CLASS_NAME_COLLAPSE}`;
  const CLASS_NAME_HORIZONTAL = 'collapse-horizontal';
  const WIDTH = 'width';
  const HEIGHT = 'height';
  const SELECTOR_ACTIVES = '.collapse.show, .collapse.collapsing';
  const SELECTOR_DATA_TOGGLE$4 = '[data-bs-toggle="collapse"]';
  const Default$a = {
    parent: null,
    toggle: true
  };
  const DefaultType$a = {
    parent: '(null|element)',
    toggle: 'boolean'
  };
  /**
   * Class definition
   */

  class Collapse extends BaseComponent {
    constructor(element, config) {
      super(element, config);
      this._isTransitioning = false;
      this._triggerArray = [];
      const toggleList = SelectorEngine.find(SELECTOR_DATA_TOGGLE$4);

      for (const elem of toggleList) {
        const selector = getSelectorFromElement(elem);
        const filterElement = SelectorEngine.find(selector).filter(foundElement => foundElement === this._element);

        if (selector !== null && filterElement.length) {
          this._triggerArray.push(elem);
        }
      }

      this._initializeChildren();

      if (!this._config.parent) {
        this._addAriaAndCollapsedClass(this._triggerArray, this._isShown());
      }

      if (this._config.toggle) {
        this.toggle();
      }
    } // Getters


    static get Default() {
      return Default$a;
    }

    static get DefaultType() {
      return DefaultType$a;
    }

    static get NAME() {
      return NAME$b;
    } // Public


    toggle() {
      if (this._isShown()) {
        this.hide();
      } else {
        this.show();
      }
    }

    show() {
      if (this._isTransitioning || this._isShown()) {
        return;
      }

      let activeChildren = []; // find active children

      if (this._config.parent) {
        activeChildren = this._getFirstLevelChildren(SELECTOR_ACTIVES).filter(element => element !== this._element).map(element => Collapse.getOrCreateInstance(element, {
          toggle: false
        }));
      }

      if (activeChildren.length && activeChildren[0]._isTransitioning) {
        return;
      }

      const startEvent = EventHandler.trigger(this._element, EVENT_SHOW$6);

      if (startEvent.defaultPrevented) {
        return;
      }

      for (const activeInstance of activeChildren) {
        activeInstance.hide();
      }

      const dimension = this._getDimension();

      this._element.classList.remove(CLASS_NAME_COLLAPSE);

      this._element.classList.add(CLASS_NAME_COLLAPSING);

      this._element.style[dimension] = 0;

      this._addAriaAndCollapsedClass(this._triggerArray, true);

      this._isTransitioning = true;

      const complete = () => {
        this._isTransitioning = false;

        this._element.classList.remove(CLASS_NAME_COLLAPSING);

        this._element.classList.add(CLASS_NAME_COLLAPSE, CLASS_NAME_SHOW$7);

        this._element.style[dimension] = '';
        EventHandler.trigger(this._element, EVENT_SHOWN$6);
      };

      const capitalizedDimension = dimension[0].toUpperCase() + dimension.slice(1);
      const scrollSize = `scroll${capitalizedDimension}`;

      this._queueCallback(complete, this._element, true);

      this._element.style[dimension] = `${this._element[scrollSize]}px`;
    }

    hide() {
      if (this._isTransitioning || !this._isShown()) {
        return;
      }

      const startEvent = EventHandler.trigger(this._element, EVENT_HIDE$6);

      if (startEvent.defaultPrevented) {
        return;
      }

      const dimension = this._getDimension();

      this._element.style[dimension] = `${this._element.getBoundingClientRect()[dimension]}px`;
      reflow(this._element);

      this._element.classList.add(CLASS_NAME_COLLAPSING);

      this._element.classList.remove(CLASS_NAME_COLLAPSE, CLASS_NAME_SHOW$7);

      for (const trigger of this._triggerArray) {
        const element = getElementFromSelector(trigger);

        if (element && !this._isShown(element)) {
          this._addAriaAndCollapsedClass([trigger], false);
        }
      }

      this._isTransitioning = true;

      const complete = () => {
        this._isTransitioning = false;

        this._element.classList.remove(CLASS_NAME_COLLAPSING);

        this._element.classList.add(CLASS_NAME_COLLAPSE);

        EventHandler.trigger(this._element, EVENT_HIDDEN$6);
      };

      this._element.style[dimension] = '';

      this._queueCallback(complete, this._element, true);
    }

    _isShown(element = this._element) {
      return element.classList.contains(CLASS_NAME_SHOW$7);
    } // Private


    _configAfterMerge(config) {
      config.toggle = Boolean(config.toggle); // Coerce string values

      config.parent = getElement(config.parent);
      return config;
    }

    _getDimension() {
      return this._element.classList.contains(CLASS_NAME_HORIZONTAL) ? WIDTH : HEIGHT;
    }

    _initializeChildren() {
      if (!this._config.parent) {
        return;
      }

      const children = this._getFirstLevelChildren(SELECTOR_DATA_TOGGLE$4);

      for (const element of children) {
        const selected = getElementFromSelector(element);

        if (selected) {
          this._addAriaAndCollapsedClass([element], this._isShown(selected));
        }
      }
    }

    _getFirstLevelChildren(selector) {
      const children = SelectorEngine.find(CLASS_NAME_DEEPER_CHILDREN, this._config.parent); // remove children if greater depth

      return SelectorEngine.find(selector, this._config.parent).filter(element => !children.includes(element));
    }

    _addAriaAndCollapsedClass(triggerArray, isOpen) {
      if (!triggerArray.length) {
        return;
      }

      for (const element of triggerArray) {
        element.classList.toggle(CLASS_NAME_COLLAPSED, !isOpen);
        element.setAttribute('aria-expanded', isOpen);
      }
    } // Static


    static jQueryInterface(config) {
      const _config = {};

      if (typeof config === 'string' && /show|hide/.test(config)) {
        _config.toggle = false;
      }

      return this.each(function () {
        const data = Collapse.getOrCreateInstance(this, _config);

        if (typeof config === 'string') {
          if (typeof data[config] === 'undefined') {
            throw new TypeError(`No method named "${config}"`);
          }

          data[config]();
        }
      });
    }

  }
  /**
   * Data API implementation
   */


  EventHandler.on(document, EVENT_CLICK_DATA_API$4, SELECTOR_DATA_TOGGLE$4, function (event) {
    // preventDefault only for <a> elements (which change the URL) not inside the collapsible element
    if (event.target.tagName === 'A' || event.delegateTarget && event.delegateTarget.tagName === 'A') {
      event.preventDefault();
    }

    const selector = getSelectorFromElement(this);
    const selectorElements = SelectorEngine.find(selector);

    for (const element of selectorElements) {
      Collapse.getOrCreateInstance(element, {
        toggle: false
      }).toggle();
    }
  });
  /**
   * jQuery
   */

  defineJQueryPlugin(Collapse);

  /**
   * --------------------------------------------------------------------------
   * Bootstrap (v5.2.3): dropdown.js
   * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
   * --------------------------------------------------------------------------
   */
  /**
   * Constants
   */

  const NAME$a = 'dropdown';
  const DATA_KEY$6 = 'bs.dropdown';
  const EVENT_KEY$6 = `.${DATA_KEY$6}`;
  const DATA_API_KEY$3 = '.data-api';
  const ESCAPE_KEY$2 = 'Escape';
  const TAB_KEY$1 = 'Tab';
  const ARROW_UP_KEY$1 = 'ArrowUp';
  const ARROW_DOWN_KEY$1 = 'ArrowDown';
  const RIGHT_MOUSE_BUTTON = 2; // MouseEvent.button value for the secondary button, usually the right button

  const EVENT_HIDE$5 = `hide${EVENT_KEY$6}`;
  const EVENT_HIDDEN$5 = `hidden${EVENT_KEY$6}`;
  const EVENT_SHOW$5 = `show${EVENT_KEY$6}`;
  const EVENT_SHOWN$5 = `shown${EVENT_KEY$6}`;
  const EVENT_CLICK_DATA_API$3 = `click${EVENT_KEY$6}${DATA_API_KEY$3}`;
  const EVENT_KEYDOWN_DATA_API = `keydown${EVENT_KEY$6}${DATA_API_KEY$3}`;
  const EVENT_KEYUP_DATA_API = `keyup${EVENT_KEY$6}${DATA_API_KEY$3}`;
  const CLASS_NAME_SHOW$6 = 'show';
  const CLASS_NAME_DROPUP = 'dropup';
  const CLASS_NAME_DROPEND = 'dropend';
  const CLASS_NAME_DROPSTART = 'dropstart';
  const CLASS_NAME_DROPUP_CENTER = 'dropup-center';
  const CLASS_NAME_DROPDOWN_CENTER = 'dropdown-center';
  const SELECTOR_DATA_TOGGLE$3 = '[data-bs-toggle="dropdown"]:not(.disabled):not(:disabled)';
  const SELECTOR_DATA_TOGGLE_SHOWN = `${SELECTOR_DATA_TOGGLE$3}.${CLASS_NAME_SHOW$6}`;
  const SELECTOR_MENU = '.dropdown-menu';
  const SELECTOR_NAVBAR = '.navbar';
  const SELECTOR_NAVBAR_NAV = '.navbar-nav';
  const SELECTOR_VISIBLE_ITEMS = '.dropdown-menu .dropdown-item:not(.disabled):not(:disabled)';
  const PLACEMENT_TOP = isRTL() ? 'top-end' : 'top-start';
  const PLACEMENT_TOPEND = isRTL() ? 'top-start' : 'top-end';
  const PLACEMENT_BOTTOM = isRTL() ? 'bottom-end' : 'bottom-start';
  const PLACEMENT_BOTTOMEND = isRTL() ? 'bottom-start' : 'bottom-end';
  const PLACEMENT_RIGHT = isRTL() ? 'left-start' : 'right-start';
  const PLACEMENT_LEFT = isRTL() ? 'right-start' : 'left-start';
  const PLACEMENT_TOPCENTER = 'top';
  const PLACEMENT_BOTTOMCENTER = 'bottom';
  const Default$9 = {
    autoClose: true,
    boundary: 'clippingParents',
    display: 'dynamic',
    offset: [0, 2],
    popperConfig: null,
    reference: 'toggle'
  };
  const DefaultType$9 = {
    autoClose: '(boolean|string)',
    boundary: '(string|element)',
    display: 'string',
    offset: '(array|string|function)',
    popperConfig: '(null|object|function)',
    reference: '(string|element|object)'
  };
  /**
   * Class definition
   */

  class Dropdown extends BaseComponent {
    constructor(element, config) {
      super(element, config);
      this._popper = null;
      this._parent = this._element.parentNode; // dropdown wrapper
      // todo: v6 revert #37011 & change markup https://getbootstrap.com/docs/5.2/forms/input-group/

      this._menu = SelectorEngine.next(this._element, SELECTOR_MENU)[0] || SelectorEngine.prev(this._element, SELECTOR_MENU)[0] || SelectorEngine.findOne(SELECTOR_MENU, this._parent);
      this._inNavbar = this._detectNavbar();
    } // Getters


    static get Default() {
      return Default$9;
    }

    static get DefaultType() {
      return DefaultType$9;
    }

    static get NAME() {
      return NAME$a;
    } // Public


    toggle() {
      return this._isShown() ? this.hide() : this.show();
    }

    show() {
      if (isDisabled(this._element) || this._isShown()) {
        return;
      }

      const relatedTarget = {
        relatedTarget: this._element
      };
      const showEvent = EventHandler.trigger(this._element, EVENT_SHOW$5, relatedTarget);

      if (showEvent.defaultPrevented) {
        return;
      }

      this._createPopper(); // If this is a touch-enabled device we add extra
      // empty mouseover listeners to the body's immediate children;
      // only needed because of broken event delegation on iOS
      // https://www.quirksmode.org/blog/archives/2014/02/mouse_event_bub.html


      if ('ontouchstart' in document.documentElement && !this._parent.closest(SELECTOR_NAVBAR_NAV)) {
        for (const element of [].concat(...document.body.children)) {
          EventHandler.on(element, 'mouseover', noop);
        }
      }

      this._element.focus();

      this._element.setAttribute('aria-expanded', true);

      this._menu.classList.add(CLASS_NAME_SHOW$6);

      this._element.classList.add(CLASS_NAME_SHOW$6);

      EventHandler.trigger(this._element, EVENT_SHOWN$5, relatedTarget);
    }

    hide() {
      if (isDisabled(this._element) || !this._isShown()) {
        return;
      }

      const relatedTarget = {
        relatedTarget: this._element
      };

      this._completeHide(relatedTarget);
    }

    dispose() {
      if (this._popper) {
        this._popper.destroy();
      }

      super.dispose();
    }

    update() {
      this._inNavbar = this._detectNavbar();

      if (this._popper) {
        this._popper.update();
      }
    } // Private


    _completeHide(relatedTarget) {
      const hideEvent = EventHandler.trigger(this._element, EVENT_HIDE$5, relatedTarget);

      if (hideEvent.defaultPrevented) {
        return;
      } // If this is a touch-enabled device we remove the extra
      // empty mouseover listeners we added for iOS support


      if ('ontouchstart' in document.documentElement) {
        for (const element of [].concat(...document.body.children)) {
          EventHandler.off(element, 'mouseover', noop);
        }
      }

      if (this._popper) {
        this._popper.destroy();
      }

      this._menu.classList.remove(CLASS_NAME_SHOW$6);

      this._element.classList.remove(CLASS_NAME_SHOW$6);

      this._element.setAttribute('aria-expanded', 'false');

      Manipulator.removeDataAttribute(this._menu, 'popper');
      EventHandler.trigger(this._element, EVENT_HIDDEN$5, relatedTarget);
    }

    _getConfig(config) {
      config = super._getConfig(config);

      if (typeof config.reference === 'object' && !isElement(config.reference) && typeof config.reference.getBoundingClientRect !== 'function') {
        // Popper virtual elements require a getBoundingClientRect method
        throw new TypeError(`${NAME$a.toUpperCase()}: Option "reference" provided type "object" without a required "getBoundingClientRect" method.`);
      }

      return config;
    }

    _createPopper() {
      if (typeof Popper__namespace === 'undefined') {
        throw new TypeError('Bootstrap\'s dropdowns require Popper (https://popper.js.org)');
      }

      let referenceElement = this._element;

      if (this._config.reference === 'parent') {
        referenceElement = this._parent;
      } else if (isElement(this._config.reference)) {
        referenceElement = getElement(this._config.reference);
      } else if (typeof this._config.reference === 'object') {
        referenceElement = this._config.reference;
      }

      const popperConfig = this._getPopperConfig();

      this._popper = Popper__namespace.createPopper(referenceElement, this._menu, popperConfig);
    }

    _isShown() {
      return this._menu.classList.contains(CLASS_NAME_SHOW$6);
    }

    _getPlacement() {
      const parentDropdown = this._parent;

      if (parentDropdown.classList.contains(CLASS_NAME_DROPEND)) {
        return PLACEMENT_RIGHT;
      }

      if (parentDropdown.classList.contains(CLASS_NAME_DROPSTART)) {
        return PLACEMENT_LEFT;
      }

      if (parentDropdown.classList.contains(CLASS_NAME_DROPUP_CENTER)) {
        return PLACEMENT_TOPCENTER;
      }

      if (parentDropdown.classList.contains(CLASS_NAME_DROPDOWN_CENTER)) {
        return PLACEMENT_BOTTOMCENTER;
      } // We need to trim the value because custom properties can also include spaces


      const isEnd = getComputedStyle(this._menu).getPropertyValue('--bs-position').trim() === 'end';

      if (parentDropdown.classList.contains(CLASS_NAME_DROPUP)) {
        return isEnd ? PLACEMENT_TOPEND : PLACEMENT_TOP;
      }

      return isEnd ? PLACEMENT_BOTTOMEND : PLACEMENT_BOTTOM;
    }

    _detectNavbar() {
      return this._element.closest(SELECTOR_NAVBAR) !== null;
    }

    _getOffset() {
      const {
        offset
      } = this._config;

      if (typeof offset === 'string') {
        return offset.split(',').map(value => Number.parseInt(value, 10));
      }

      if (typeof offset === 'function') {
        return popperData => offset(popperData, this._element);
      }

      return offset;
    }

    _getPopperConfig() {
      const defaultBsPopperConfig = {
        placement: this._getPlacement(),
        modifiers: [{
          name: 'preventOverflow',
          options: {
            boundary: this._config.boundary
          }
        }, {
          name: 'offset',
          options: {
            offset: this._getOffset()
          }
        }]
      }; // Disable Popper if we have a static display or Dropdown is in Navbar

      if (this._inNavbar || this._config.display === 'static') {
        Manipulator.setDataAttribute(this._menu, 'popper', 'static'); // todo:v6 remove

        defaultBsPopperConfig.modifiers = [{
          name: 'applyStyles',
          enabled: false
        }];
      }

      return { ...defaultBsPopperConfig,
        ...(typeof this._config.popperConfig === 'function' ? this._config.popperConfig(defaultBsPopperConfig) : this._config.popperConfig)
      };
    }

    _selectMenuItem({
      key,
      target
    }) {
      const items = SelectorEngine.find(SELECTOR_VISIBLE_ITEMS, this._menu).filter(element => isVisible(element));

      if (!items.length) {
        return;
      } // if target isn't included in items (e.g. when expanding the dropdown)
      // allow cycling to get the last item in case key equals ARROW_UP_KEY


      getNextActiveElement(items, target, key === ARROW_DOWN_KEY$1, !items.includes(target)).focus();
    } // Static


    static jQueryInterface(config) {
      return this.each(function () {
        const data = Dropdown.getOrCreateInstance(this, config);

        if (typeof config !== 'string') {
          return;
        }

        if (typeof data[config] === 'undefined') {
          throw new TypeError(`No method named "${config}"`);
        }

        data[config]();
      });
    }

    static clearMenus(event) {
      if (event.button === RIGHT_MOUSE_BUTTON || event.type === 'keyup' && event.key !== TAB_KEY$1) {
        return;
      }

      const openToggles = SelectorEngine.find(SELECTOR_DATA_TOGGLE_SHOWN);

      for (const toggle of openToggles) {
        const context = Dropdown.getInstance(toggle);

        if (!context || context._config.autoClose === false) {
          continue;
        }

        const composedPath = event.composedPath();
        const isMenuTarget = composedPath.includes(context._menu);

        if (composedPath.includes(context._element) || context._config.autoClose === 'inside' && !isMenuTarget || context._config.autoClose === 'outside' && isMenuTarget) {
          continue;
        } // Tab navigation through the dropdown menu or events from contained inputs shouldn't close the menu


        if (context._menu.contains(event.target) && (event.type === 'keyup' && event.key === TAB_KEY$1 || /input|select|option|textarea|form/i.test(event.target.tagName))) {
          continue;
        }

        const relatedTarget = {
          relatedTarget: context._element
        };

        if (event.type === 'click') {
          relatedTarget.clickEvent = event;
        }

        context._completeHide(relatedTarget);
      }
    }

    static dataApiKeydownHandler(event) {
      // If not an UP | DOWN | ESCAPE key => not a dropdown command
      // If input/textarea && if key is other than ESCAPE => not a dropdown command
      const isInput = /input|textarea/i.test(event.target.tagName);
      const isEscapeEvent = event.key === ESCAPE_KEY$2;
      const isUpOrDownEvent = [ARROW_UP_KEY$1, ARROW_DOWN_KEY$1].includes(event.key);

      if (!isUpOrDownEvent && !isEscapeEvent) {
        return;
      }

      if (isInput && !isEscapeEvent) {
        return;
      }

      event.preventDefault(); // todo: v6 revert #37011 & change markup https://getbootstrap.com/docs/5.2/forms/input-group/

      const getToggleButton = this.matches(SELECTOR_DATA_TOGGLE$3) ? this : SelectorEngine.prev(this, SELECTOR_DATA_TOGGLE$3)[0] || SelectorEngine.next(this, SELECTOR_DATA_TOGGLE$3)[0] || SelectorEngine.findOne(SELECTOR_DATA_TOGGLE$3, event.delegateTarget.parentNode);
      const instance = Dropdown.getOrCreateInstance(getToggleButton);

      if (isUpOrDownEvent) {
        event.stopPropagation();
        instance.show();

        instance._selectMenuItem(event);

        return;
      }

      if (instance._isShown()) {
        // else is escape and we check if it is shown
        event.stopPropagation();
        instance.hide();
        getToggleButton.focus();
      }
    }

  }
  /**
   * Data API implementation
   */


  EventHandler.on(document, EVENT_KEYDOWN_DATA_API, SELECTOR_DATA_TOGGLE$3, Dropdown.dataApiKeydownHandler);
  EventHandler.on(document, EVENT_KEYDOWN_DATA_API, SELECTOR_MENU, Dropdown.dataApiKeydownHandler);
  EventHandler.on(document, EVENT_CLICK_DATA_API$3, Dropdown.clearMenus);
  EventHandler.on(document, EVENT_KEYUP_DATA_API, Dropdown.clearMenus);
  EventHandler.on(document, EVENT_CLICK_DATA_API$3, SELECTOR_DATA_TOGGLE$3, function (event) {
    event.preventDefault();
    Dropdown.getOrCreateInstance(this).toggle();
  });
  /**
   * jQuery
   */

  defineJQueryPlugin(Dropdown);

  /**
   * --------------------------------------------------------------------------
   * Bootstrap (v5.2.3): util/scrollBar.js
   * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
   * --------------------------------------------------------------------------
   */
  /**
   * Constants
   */

  const SELECTOR_FIXED_CONTENT = '.fixed-top, .fixed-bottom, .is-fixed, .sticky-top';
  const SELECTOR_STICKY_CONTENT = '.sticky-top';
  const PROPERTY_PADDING = 'padding-right';
  const PROPERTY_MARGIN = 'margin-right';
  /**
   * Class definition
   */

  class ScrollBarHelper {
    constructor() {
      this._element = document.body;
    } // Public


    getWidth() {
      // https://developer.mozilla.org/en-US/docs/Web/API/Window/innerWidth#usage_notes
      const documentWidth = document.documentElement.clientWidth;
      return Math.abs(window.innerWidth - documentWidth);
    }

    hide() {
      const width = this.getWidth();

      this._disableOverFlow(); // give padding to element to balance the hidden scrollbar width


      this._setElementAttributes(this._element, PROPERTY_PADDING, calculatedValue => calculatedValue + width); // trick: We adjust positive paddingRight and negative marginRight to sticky-top elements to keep showing fullwidth


      this._setElementAttributes(SELECTOR_FIXED_CONTENT, PROPERTY_PADDING, calculatedValue => calculatedValue + width);

      this._setElementAttributes(SELECTOR_STICKY_CONTENT, PROPERTY_MARGIN, calculatedValue => calculatedValue - width);
    }

    reset() {
      this._resetElementAttributes(this._element, 'overflow');

      this._resetElementAttributes(this._element, PROPERTY_PADDING);

      this._resetElementAttributes(SELECTOR_FIXED_CONTENT, PROPERTY_PADDING);

      this._resetElementAttributes(SELECTOR_STICKY_CONTENT, PROPERTY_MARGIN);
    }

    isOverflowing() {
      return this.getWidth() > 0;
    } // Private


    _disableOverFlow() {
      this._saveInitialAttribute(this._element, 'overflow');

      this._element.style.overflow = 'hidden';
    }

    _setElementAttributes(selector, styleProperty, callback) {
      const scrollbarWidth = this.getWidth();

      const manipulationCallBack = element => {
        if (element !== this._element && window.innerWidth > element.clientWidth + scrollbarWidth) {
          return;
        }

        this._saveInitialAttribute(element, styleProperty);

        const calculatedValue = window.getComputedStyle(element).getPropertyValue(styleProperty);
        element.style.setProperty(styleProperty, `${callback(Number.parseFloat(calculatedValue))}px`);
      };

      this._applyManipulationCallback(selector, manipulationCallBack);
    }

    _saveInitialAttribute(element, styleProperty) {
      const actualValue = element.style.getPropertyValue(styleProperty);

      if (actualValue) {
        Manipulator.setDataAttribute(element, styleProperty, actualValue);
      }
    }

    _resetElementAttributes(selector, styleProperty) {
      const manipulationCallBack = element => {
        const value = Manipulator.getDataAttribute(element, styleProperty); // We only want to remove the property if the value is `null`; the value can also be zero

        if (value === null) {
          element.style.removeProperty(styleProperty);
          return;
        }

        Manipulator.removeDataAttribute(element, styleProperty);
        element.style.setProperty(styleProperty, value);
      };

      this._applyManipulationCallback(selector, manipulationCallBack);
    }

    _applyManipulationCallback(selector, callBack) {
      if (isElement(selector)) {
        callBack(selector);
        return;
      }

      for (const sel of SelectorEngine.find(selector, this._element)) {
        callBack(sel);
      }
    }

  }

  /**
   * --------------------------------------------------------------------------
   * Bootstrap (v5.2.3): util/backdrop.js
   * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
   * --------------------------------------------------------------------------
   */
  /**
   * Constants
   */

  const NAME$9 = 'backdrop';
  const CLASS_NAME_FADE$4 = 'fade';
  const CLASS_NAME_SHOW$5 = 'show';
  const EVENT_MOUSEDOWN = `mousedown.bs.${NAME$9}`;
  const Default$8 = {
    className: 'modal-backdrop',
    clickCallback: null,
    isAnimated: false,
    isVisible: true,
    // if false, we use the backdrop helper without adding any element to the dom
    rootElement: 'body' // give the choice to place backdrop under different elements

  };
  const DefaultType$8 = {
    className: 'string',
    clickCallback: '(function|null)',
    isAnimated: 'boolean',
    isVisible: 'boolean',
    rootElement: '(element|string)'
  };
  /**
   * Class definition
   */

  class Backdrop extends Config {
    constructor(config) {
      super();
      this._config = this._getConfig(config);
      this._isAppended = false;
      this._element = null;
    } // Getters


    static get Default() {
      return Default$8;
    }

    static get DefaultType() {
      return DefaultType$8;
    }

    static get NAME() {
      return NAME$9;
    } // Public


    show(callback) {
      if (!this._config.isVisible) {
        execute(callback);
        return;
      }

      this._append();

      const element = this._getElement();

      if (this._config.isAnimated) {
        reflow(element);
      }

      element.classList.add(CLASS_NAME_SHOW$5);

      this._emulateAnimation(() => {
        execute(callback);
      });
    }

    hide(callback) {
      if (!this._config.isVisible) {
        execute(callback);
        return;
      }

      this._getElement().classList.remove(CLASS_NAME_SHOW$5);

      this._emulateAnimation(() => {
        this.dispose();
        execute(callback);
      });
    }

    dispose() {
      if (!this._isAppended) {
        return;
      }

      EventHandler.off(this._element, EVENT_MOUSEDOWN);

      this._element.remove();

      this._isAppended = false;
    } // Private


    _getElement() {
      if (!this._element) {
        const backdrop = document.createElement('div');
        backdrop.className = this._config.className;

        if (this._config.isAnimated) {
          backdrop.classList.add(CLASS_NAME_FADE$4);
        }

        this._element = backdrop;
      }

      return this._element;
    }

    _configAfterMerge(config) {
      // use getElement() with the default "body" to get a fresh Element on each instantiation
      config.rootElement = getElement(config.rootElement);
      return config;
    }

    _append() {
      if (this._isAppended) {
        return;
      }

      const element = this._getElement();

      this._config.rootElement.append(element);

      EventHandler.on(element, EVENT_MOUSEDOWN, () => {
        execute(this._config.clickCallback);
      });
      this._isAppended = true;
    }

    _emulateAnimation(callback) {
      executeAfterTransition(callback, this._getElement(), this._config.isAnimated);
    }

  }

  /**
   * --------------------------------------------------------------------------
   * Bootstrap (v5.2.3): util/focustrap.js
   * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
   * --------------------------------------------------------------------------
   */
  /**
   * Constants
   */

  const NAME$8 = 'focustrap';
  const DATA_KEY$5 = 'bs.focustrap';
  const EVENT_KEY$5 = `.${DATA_KEY$5}`;
  const EVENT_FOCUSIN$2 = `focusin${EVENT_KEY$5}`;
  const EVENT_KEYDOWN_TAB = `keydown.tab${EVENT_KEY$5}`;
  const TAB_KEY = 'Tab';
  const TAB_NAV_FORWARD = 'forward';
  const TAB_NAV_BACKWARD = 'backward';
  const Default$7 = {
    autofocus: true,
    trapElement: null // The element to trap focus inside of

  };
  const DefaultType$7 = {
    autofocus: 'boolean',
    trapElement: 'element'
  };
  /**
   * Class definition
   */

  class FocusTrap extends Config {
    constructor(config) {
      super();
      this._config = this._getConfig(config);
      this._isActive = false;
      this._lastTabNavDirection = null;
    } // Getters


    static get Default() {
      return Default$7;
    }

    static get DefaultType() {
      return DefaultType$7;
    }

    static get NAME() {
      return NAME$8;
    } // Public


    activate() {
      if (this._isActive) {
        return;
      }

      if (this._config.autofocus) {
        this._config.trapElement.focus();
      }

      EventHandler.off(document, EVENT_KEY$5); // guard against infinite focus loop

      EventHandler.on(document, EVENT_FOCUSIN$2, event => this._handleFocusin(event));
      EventHandler.on(document, EVENT_KEYDOWN_TAB, event => this._handleKeydown(event));
      this._isActive = true;
    }

    deactivate() {
      if (!this._isActive) {
        return;
      }

      this._isActive = false;
      EventHandler.off(document, EVENT_KEY$5);
    } // Private


    _handleFocusin(event) {
      const {
        trapElement
      } = this._config;

      if (event.target === document || event.target === trapElement || trapElement.contains(event.target)) {
        return;
      }

      const elements = SelectorEngine.focusableChildren(trapElement);

      if (elements.length === 0) {
        trapElement.focus();
      } else if (this._lastTabNavDirection === TAB_NAV_BACKWARD) {
        elements[elements.length - 1].focus();
      } else {
        elements[0].focus();
      }
    }

    _handleKeydown(event) {
      if (event.key !== TAB_KEY) {
        return;
      }

      this._lastTabNavDirection = event.shiftKey ? TAB_NAV_BACKWARD : TAB_NAV_FORWARD;
    }

  }

  /**
   * --------------------------------------------------------------------------
   * Bootstrap (v5.2.3): modal.js
   * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
   * --------------------------------------------------------------------------
   */
  /**
   * Constants
   */

  const NAME$7 = 'modal';
  const DATA_KEY$4 = 'bs.modal';
  const EVENT_KEY$4 = `.${DATA_KEY$4}`;
  const DATA_API_KEY$2 = '.data-api';
  const ESCAPE_KEY$1 = 'Escape';
  const EVENT_HIDE$4 = `hide${EVENT_KEY$4}`;
  const EVENT_HIDE_PREVENTED$1 = `hidePrevented${EVENT_KEY$4}`;
  const EVENT_HIDDEN$4 = `hidden${EVENT_KEY$4}`;
  const EVENT_SHOW$4 = `show${EVENT_KEY$4}`;
  const EVENT_SHOWN$4 = `shown${EVENT_KEY$4}`;
  const EVENT_RESIZE$1 = `resize${EVENT_KEY$4}`;
  const EVENT_CLICK_DISMISS = `click.dismiss${EVENT_KEY$4}`;
  const EVENT_MOUSEDOWN_DISMISS = `mousedown.dismiss${EVENT_KEY$4}`;
  const EVENT_KEYDOWN_DISMISS$1 = `keydown.dismiss${EVENT_KEY$4}`;
  const EVENT_CLICK_DATA_API$2 = `click${EVENT_KEY$4}${DATA_API_KEY$2}`;
  const CLASS_NAME_OPEN = 'modal-open';
  const CLASS_NAME_FADE$3 = 'fade';
  const CLASS_NAME_SHOW$4 = 'show';
  const CLASS_NAME_STATIC = 'modal-static';
  const OPEN_SELECTOR$1 = '.modal.show';
  const SELECTOR_DIALOG = '.modal-dialog';
  const SELECTOR_MODAL_BODY = '.modal-body';
  const SELECTOR_DATA_TOGGLE$2 = '[data-bs-toggle="modal"]';
  const Default$6 = {
    backdrop: true,
    focus: true,
    keyboard: true
  };
  const DefaultType$6 = {
    backdrop: '(boolean|string)',
    focus: 'boolean',
    keyboard: 'boolean'
  };
  /**
   * Class definition
   */

  class Modal extends BaseComponent {
    constructor(element, config) {
      super(element, config);
      this._dialog = SelectorEngine.findOne(SELECTOR_DIALOG, this._element);
      this._backdrop = this._initializeBackDrop();
      this._focustrap = this._initializeFocusTrap();
      this._isShown = false;
      this._isTransitioning = false;
      this._scrollBar = new ScrollBarHelper();

      this._addEventListeners();
    } // Getters


    static get Default() {
      return Default$6;
    }

    static get DefaultType() {
      return DefaultType$6;
    }

    static get NAME() {
      return NAME$7;
    } // Public


    toggle(relatedTarget) {
      return this._isShown ? this.hide() : this.show(relatedTarget);
    }

    show(relatedTarget) {
      if (this._isShown || this._isTransitioning) {
        return;
      }

      const showEvent = EventHandler.trigger(this._element, EVENT_SHOW$4, {
        relatedTarget
      });

      if (showEvent.defaultPrevented) {
        return;
      }

      this._isShown = true;
      this._isTransitioning = true;

      this._scrollBar.hide();

      document.body.classList.add(CLASS_NAME_OPEN);

      this._adjustDialog();

      this._backdrop.show(() => this._showElement(relatedTarget));
    }

    hide() {
      if (!this._isShown || this._isTransitioning) {
        return;
      }

      const hideEvent = EventHandler.trigger(this._element, EVENT_HIDE$4);

      if (hideEvent.defaultPrevented) {
        return;
      }

      this._isShown = false;
      this._isTransitioning = true;

      this._focustrap.deactivate();

      this._element.classList.remove(CLASS_NAME_SHOW$4);

      this._queueCallback(() => this._hideModal(), this._element, this._isAnimated());
    }

    dispose() {
      for (const htmlElement of [window, this._dialog]) {
        EventHandler.off(htmlElement, EVENT_KEY$4);
      }

      this._backdrop.dispose();

      this._focustrap.deactivate();

      super.dispose();
    }

    handleUpdate() {
      this._adjustDialog();
    } // Private


    _initializeBackDrop() {
      return new Backdrop({
        isVisible: Boolean(this._config.backdrop),
        // 'static' option will be translated to true, and booleans will keep their value,
        isAnimated: this._isAnimated()
      });
    }

    _initializeFocusTrap() {
      return new FocusTrap({
        trapElement: this._element
      });
    }

    _showElement(relatedTarget) {
      // try to append dynamic modal
      if (!document.body.contains(this._element)) {
        document.body.append(this._element);
      }

      this._element.style.display = 'block';

      this._element.removeAttribute('aria-hidden');

      this._element.setAttribute('aria-modal', true);

      this._element.setAttribute('role', 'dialog');

      this._element.scrollTop = 0;
      const modalBody = SelectorEngine.findOne(SELECTOR_MODAL_BODY, this._dialog);

      if (modalBody) {
        modalBody.scrollTop = 0;
      }

      reflow(this._element);

      this._element.classList.add(CLASS_NAME_SHOW$4);

      const transitionComplete = () => {
        if (this._config.focus) {
          this._focustrap.activate();
        }

        this._isTransitioning = false;
        EventHandler.trigger(this._element, EVENT_SHOWN$4, {
          relatedTarget
        });
      };

      this._queueCallback(transitionComplete, this._dialog, this._isAnimated());
    }

    _addEventListeners() {
      EventHandler.on(this._element, EVENT_KEYDOWN_DISMISS$1, event => {
        if (event.key !== ESCAPE_KEY$1) {
          return;
        }

        if (this._config.keyboard) {
          event.preventDefault();
          this.hide();
          return;
        }

        this._triggerBackdropTransition();
      });
      EventHandler.on(window, EVENT_RESIZE$1, () => {
        if (this._isShown && !this._isTransitioning) {
          this._adjustDialog();
        }
      });
      EventHandler.on(this._element, EVENT_MOUSEDOWN_DISMISS, event => {
        // a bad trick to segregate clicks that may start inside dialog but end outside, and avoid listen to scrollbar clicks
        EventHandler.one(this._element, EVENT_CLICK_DISMISS, event2 => {
          if (this._element !== event.target || this._element !== event2.target) {
            return;
          }

          if (this._config.backdrop === 'static') {
            this._triggerBackdropTransition();

            return;
          }

          if (this._config.backdrop) {
            this.hide();
          }
        });
      });
    }

    _hideModal() {
      this._element.style.display = 'none';

      this._element.setAttribute('aria-hidden', true);

      this._element.removeAttribute('aria-modal');

      this._element.removeAttribute('role');

      this._isTransitioning = false;

      this._backdrop.hide(() => {
        document.body.classList.remove(CLASS_NAME_OPEN);

        this._resetAdjustments();

        this._scrollBar.reset();

        EventHandler.trigger(this._element, EVENT_HIDDEN$4);
      });
    }

    _isAnimated() {
      return this._element.classList.contains(CLASS_NAME_FADE$3);
    }

    _triggerBackdropTransition() {
      const hideEvent = EventHandler.trigger(this._element, EVENT_HIDE_PREVENTED$1);

      if (hideEvent.defaultPrevented) {
        return;
      }

      const isModalOverflowing = this._element.scrollHeight > document.documentElement.clientHeight;
      const initialOverflowY = this._element.style.overflowY; // return if the following background transition hasn't yet completed

      if (initialOverflowY === 'hidden' || this._element.classList.contains(CLASS_NAME_STATIC)) {
        return;
      }

      if (!isModalOverflowing) {
        this._element.style.overflowY = 'hidden';
      }

      this._element.classList.add(CLASS_NAME_STATIC);

      this._queueCallback(() => {
        this._element.classList.remove(CLASS_NAME_STATIC);

        this._queueCallback(() => {
          this._element.style.overflowY = initialOverflowY;
        }, this._dialog);
      }, this._dialog);

      this._element.focus();
    }
    /**
     * The following methods are used to handle overflowing modals
     */


    _adjustDialog() {
      const isModalOverflowing = this._element.scrollHeight > document.documentElement.clientHeight;

      const scrollbarWidth = this._scrollBar.getWidth();

      const isBodyOverflowing = scrollbarWidth > 0;

      if (isBodyOverflowing && !isModalOverflowing) {
        const property = isRTL() ? 'paddingLeft' : 'paddingRight';
        this._element.style[property] = `${scrollbarWidth}px`;
      }

      if (!isBodyOverflowing && isModalOverflowing) {
        const property = isRTL() ? 'paddingRight' : 'paddingLeft';
        this._element.style[property] = `${scrollbarWidth}px`;
      }
    }

    _resetAdjustments() {
      this._element.style.paddingLeft = '';
      this._element.style.paddingRight = '';
    } // Static


    static jQueryInterface(config, relatedTarget) {
      return this.each(function () {
        const data = Modal.getOrCreateInstance(this, config);

        if (typeof config !== 'string') {
          return;
        }

        if (typeof data[config] === 'undefined') {
          throw new TypeError(`No method named "${config}"`);
        }

        data[config](relatedTarget);
      });
    }

  }
  /**
   * Data API implementation
   */


  EventHandler.on(document, EVENT_CLICK_DATA_API$2, SELECTOR_DATA_TOGGLE$2, function (event) {
    const target = getElementFromSelector(this);

    if (['A', 'AREA'].includes(this.tagName)) {
      event.preventDefault();
    }

    EventHandler.one(target, EVENT_SHOW$4, showEvent => {
      if (showEvent.defaultPrevented) {
        // only register focus restorer if modal will actually get shown
        return;
      }

      EventHandler.one(target, EVENT_HIDDEN$4, () => {
        if (isVisible(this)) {
          this.focus();
        }
      });
    }); // avoid conflict when clicking modal toggler while another one is open

    const alreadyOpen = SelectorEngine.findOne(OPEN_SELECTOR$1);

    if (alreadyOpen) {
      Modal.getInstance(alreadyOpen).hide();
    }

    const data = Modal.getOrCreateInstance(target);
    data.toggle(this);
  });
  enableDismissTrigger(Modal);
  /**
   * jQuery
   */

  defineJQueryPlugin(Modal);

  /**
   * --------------------------------------------------------------------------
   * Bootstrap (v5.2.3): offcanvas.js
   * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
   * --------------------------------------------------------------------------
   */
  /**
   * Constants
   */

  const NAME$6 = 'offcanvas';
  const DATA_KEY$3 = 'bs.offcanvas';
  const EVENT_KEY$3 = `.${DATA_KEY$3}`;
  const DATA_API_KEY$1 = '.data-api';
  const EVENT_LOAD_DATA_API$2 = `load${EVENT_KEY$3}${DATA_API_KEY$1}`;
  const ESCAPE_KEY = 'Escape';
  const CLASS_NAME_SHOW$3 = 'show';
  const CLASS_NAME_SHOWING$1 = 'showing';
  const CLASS_NAME_HIDING = 'hiding';
  const CLASS_NAME_BACKDROP = 'offcanvas-backdrop';
  const OPEN_SELECTOR = '.offcanvas.show';
  const EVENT_SHOW$3 = `show${EVENT_KEY$3}`;
  const EVENT_SHOWN$3 = `shown${EVENT_KEY$3}`;
  const EVENT_HIDE$3 = `hide${EVENT_KEY$3}`;
  const EVENT_HIDE_PREVENTED = `hidePrevented${EVENT_KEY$3}`;
  const EVENT_HIDDEN$3 = `hidden${EVENT_KEY$3}`;
  const EVENT_RESIZE = `resize${EVENT_KEY$3}`;
  const EVENT_CLICK_DATA_API$1 = `click${EVENT_KEY$3}${DATA_API_KEY$1}`;
  const EVENT_KEYDOWN_DISMISS = `keydown.dismiss${EVENT_KEY$3}`;
  const SELECTOR_DATA_TOGGLE$1 = '[data-bs-toggle="offcanvas"]';
  const Default$5 = {
    backdrop: true,
    keyboard: true,
    scroll: false
  };
  const DefaultType$5 = {
    backdrop: '(boolean|string)',
    keyboard: 'boolean',
    scroll: 'boolean'
  };
  /**
   * Class definition
   */

  class Offcanvas extends BaseComponent {
    constructor(element, config) {
      super(element, config);
      this._isShown = false;
      this._backdrop = this._initializeBackDrop();
      this._focustrap = this._initializeFocusTrap();

      this._addEventListeners();
    } // Getters


    static get Default() {
      return Default$5;
    }

    static get DefaultType() {
      return DefaultType$5;
    }

    static get NAME() {
      return NAME$6;
    } // Public


    toggle(relatedTarget) {
      return this._isShown ? this.hide() : this.show(relatedTarget);
    }

    show(relatedTarget) {
      if (this._isShown) {
        return;
      }

      const showEvent = EventHandler.trigger(this._element, EVENT_SHOW$3, {
        relatedTarget
      });

      if (showEvent.defaultPrevented) {
        return;
      }

      this._isShown = true;

      this._backdrop.show();

      if (!this._config.scroll) {
        new ScrollBarHelper().hide();
      }

      this._element.setAttribute('aria-modal', true);

      this._element.setAttribute('role', 'dialog');

      this._element.classList.add(CLASS_NAME_SHOWING$1);

      const completeCallBack = () => {
        if (!this._config.scroll || this._config.backdrop) {
          this._focustrap.activate();
        }

        this._element.classList.add(CLASS_NAME_SHOW$3);

        this._element.classList.remove(CLASS_NAME_SHOWING$1);

        EventHandler.trigger(this._element, EVENT_SHOWN$3, {
          relatedTarget
        });
      };

      this._queueCallback(completeCallBack, this._element, true);
    }

    hide() {
      if (!this._isShown) {
        return;
      }

      const hideEvent = EventHandler.trigger(this._element, EVENT_HIDE$3);

      if (hideEvent.defaultPrevented) {
        return;
      }

      this._focustrap.deactivate();

      this._element.blur();

      this._isShown = false;

      this._element.classList.add(CLASS_NAME_HIDING);

      this._backdrop.hide();

      const completeCallback = () => {
        this._element.classList.remove(CLASS_NAME_SHOW$3, CLASS_NAME_HIDING);

        this._element.removeAttribute('aria-modal');

        this._element.removeAttribute('role');

        if (!this._config.scroll) {
          new ScrollBarHelper().reset();
        }

        EventHandler.trigger(this._element, EVENT_HIDDEN$3);
      };

      this._queueCallback(completeCallback, this._element, true);
    }

    dispose() {
      this._backdrop.dispose();

      this._focustrap.deactivate();

      super.dispose();
    } // Private


    _initializeBackDrop() {
      const clickCallback = () => {
        if (this._config.backdrop === 'static') {
          EventHandler.trigger(this._element, EVENT_HIDE_PREVENTED);
          return;
        }

        this.hide();
      }; // 'static' option will be translated to true, and booleans will keep their value


      const isVisible = Boolean(this._config.backdrop);
      return new Backdrop({
        className: CLASS_NAME_BACKDROP,
        isVisible,
        isAnimated: true,
        rootElement: this._element.parentNode,
        clickCallback: isVisible ? clickCallback : null
      });
    }

    _initializeFocusTrap() {
      return new FocusTrap({
        trapElement: this._element
      });
    }

    _addEventListeners() {
      EventHandler.on(this._element, EVENT_KEYDOWN_DISMISS, event => {
        if (event.key !== ESCAPE_KEY) {
          return;
        }

        if (!this._config.keyboard) {
          EventHandler.trigger(this._element, EVENT_HIDE_PREVENTED);
          return;
        }

        this.hide();
      });
    } // Static


    static jQueryInterface(config) {
      return this.each(function () {
        const data = Offcanvas.getOrCreateInstance(this, config);

        if (typeof config !== 'string') {
          return;
        }

        if (data[config] === undefined || config.startsWith('_') || config === 'constructor') {
          throw new TypeError(`No method named "${config}"`);
        }

        data[config](this);
      });
    }

  }
  /**
   * Data API implementation
   */


  EventHandler.on(document, EVENT_CLICK_DATA_API$1, SELECTOR_DATA_TOGGLE$1, function (event) {
    const target = getElementFromSelector(this);

    if (['A', 'AREA'].includes(this.tagName)) {
      event.preventDefault();
    }

    if (isDisabled(this)) {
      return;
    }

    EventHandler.one(target, EVENT_HIDDEN$3, () => {
      // focus on trigger when it is closed
      if (isVisible(this)) {
        this.focus();
      }
    }); // avoid conflict when clicking a toggler of an offcanvas, while another is open

    const alreadyOpen = SelectorEngine.findOne(OPEN_SELECTOR);

    if (alreadyOpen && alreadyOpen !== target) {
      Offcanvas.getInstance(alreadyOpen).hide();
    }

    const data = Offcanvas.getOrCreateInstance(target);
    data.toggle(this);
  });
  EventHandler.on(window, EVENT_LOAD_DATA_API$2, () => {
    for (const selector of SelectorEngine.find(OPEN_SELECTOR)) {
      Offcanvas.getOrCreateInstance(selector).show();
    }
  });
  EventHandler.on(window, EVENT_RESIZE, () => {
    for (const element of SelectorEngine.find('[aria-modal][class*=show][class*=offcanvas-]')) {
      if (getComputedStyle(element).position !== 'fixed') {
        Offcanvas.getOrCreateInstance(element).hide();
      }
    }
  });
  enableDismissTrigger(Offcanvas);
  /**
   * jQuery
   */

  defineJQueryPlugin(Offcanvas);

  /**
   * --------------------------------------------------------------------------
   * Bootstrap (v5.2.3): util/sanitizer.js
   * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
   * --------------------------------------------------------------------------
   */
  const uriAttributes = new Set(['background', 'cite', 'href', 'itemtype', 'longdesc', 'poster', 'src', 'xlink:href']);
  const ARIA_ATTRIBUTE_PATTERN = /^aria-[\w-]*$/i;
  /**
   * A pattern that recognizes a commonly useful subset of URLs that are safe.
   *
   * Shout-out to Angular https://github.com/angular/angular/blob/12.2.x/packages/core/src/sanitization/url_sanitizer.ts
   */

  const SAFE_URL_PATTERN = /^(?:(?:https?|mailto|ftp|tel|file|sms):|[^#&/:?]*(?:[#/?]|$))/i;
  /**
   * A pattern that matches safe data URLs. Only matches image, video and audio types.
   *
   * Shout-out to Angular https://github.com/angular/angular/blob/12.2.x/packages/core/src/sanitization/url_sanitizer.ts
   */

  const DATA_URL_PATTERN = /^data:(?:image\/(?:bmp|gif|jpeg|jpg|png|tiff|webp)|video\/(?:mpeg|mp4|ogg|webm)|audio\/(?:mp3|oga|ogg|opus));base64,[\d+/a-z]+=*$/i;

  const allowedAttribute = (attribute, allowedAttributeList) => {
    const attributeName = attribute.nodeName.toLowerCase();

    if (allowedAttributeList.includes(attributeName)) {
      if (uriAttributes.has(attributeName)) {
        return Boolean(SAFE_URL_PATTERN.test(attribute.nodeValue) || DATA_URL_PATTERN.test(attribute.nodeValue));
      }

      return true;
    } // Check if a regular expression validates the attribute.


    return allowedAttributeList.filter(attributeRegex => attributeRegex instanceof RegExp).some(regex => regex.test(attributeName));
  };

  const DefaultAllowlist = {
    // Global attributes allowed on any supplied element below.
    '*': ['class', 'dir', 'id', 'lang', 'role', ARIA_ATTRIBUTE_PATTERN],
    a: ['target', 'href', 'title', 'rel'],
    area: [],
    b: [],
    br: [],
    col: [],
    code: [],
    div: [],
    em: [],
    hr: [],
    h1: [],
    h2: [],
    h3: [],
    h4: [],
    h5: [],
    h6: [],
    i: [],
    img: ['src', 'srcset', 'alt', 'title', 'width', 'height'],
    li: [],
    ol: [],
    p: [],
    pre: [],
    s: [],
    small: [],
    span: [],
    sub: [],
    sup: [],
    strong: [],
    u: [],
    ul: []
  };
  function sanitizeHtml(unsafeHtml, allowList, sanitizeFunction) {
    if (!unsafeHtml.length) {
      return unsafeHtml;
    }

    if (sanitizeFunction && typeof sanitizeFunction === 'function') {
      return sanitizeFunction(unsafeHtml);
    }

    const domParser = new window.DOMParser();
    const createdDocument = domParser.parseFromString(unsafeHtml, 'text/html');
    const elements = [].concat(...createdDocument.body.querySelectorAll('*'));

    for (const element of elements) {
      const elementName = element.nodeName.toLowerCase();

      if (!Object.keys(allowList).includes(elementName)) {
        element.remove();
        continue;
      }

      const attributeList = [].concat(...element.attributes);
      const allowedAttributes = [].concat(allowList['*'] || [], allowList[elementName] || []);

      for (const attribute of attributeList) {
        if (!allowedAttribute(attribute, allowedAttributes)) {
          element.removeAttribute(attribute.nodeName);
        }
      }
    }

    return createdDocument.body.innerHTML;
  }

  /**
   * --------------------------------------------------------------------------
   * Bootstrap (v5.2.3): util/template-factory.js
   * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
   * --------------------------------------------------------------------------
   */
  /**
   * Constants
   */

  const NAME$5 = 'TemplateFactory';
  const Default$4 = {
    allowList: DefaultAllowlist,
    content: {},
    // { selector : text ,  selector2 : text2 , }
    extraClass: '',
    html: false,
    sanitize: true,
    sanitizeFn: null,
    template: '<div></div>'
  };
  const DefaultType$4 = {
    allowList: 'object',
    content: 'object',
    extraClass: '(string|function)',
    html: 'boolean',
    sanitize: 'boolean',
    sanitizeFn: '(null|function)',
    template: 'string'
  };
  const DefaultContentType = {
    entry: '(string|element|function|null)',
    selector: '(string|element)'
  };
  /**
   * Class definition
   */

  class TemplateFactory extends Config {
    constructor(config) {
      super();
      this._config = this._getConfig(config);
    } // Getters


    static get Default() {
      return Default$4;
    }

    static get DefaultType() {
      return DefaultType$4;
    }

    static get NAME() {
      return NAME$5;
    } // Public


    getContent() {
      return Object.values(this._config.content).map(config => this._resolvePossibleFunction(config)).filter(Boolean);
    }

    hasContent() {
      return this.getContent().length > 0;
    }

    changeContent(content) {
      this._checkContent(content);

      this._config.content = { ...this._config.content,
        ...content
      };
      return this;
    }

    toHtml() {
      const templateWrapper = document.createElement('div');
      templateWrapper.innerHTML = this._maybeSanitize(this._config.template);

      for (const [selector, text] of Object.entries(this._config.content)) {
        this._setContent(templateWrapper, text, selector);
      }

      const template = templateWrapper.children[0];

      const extraClass = this._resolvePossibleFunction(this._config.extraClass);

      if (extraClass) {
        template.classList.add(...extraClass.split(' '));
      }

      return template;
    } // Private


    _typeCheckConfig(config) {
      super._typeCheckConfig(config);

      this._checkContent(config.content);
    }

    _checkContent(arg) {
      for (const [selector, content] of Object.entries(arg)) {
        super._typeCheckConfig({
          selector,
          entry: content
        }, DefaultContentType);
      }
    }

    _setContent(template, content, selector) {
      const templateElement = SelectorEngine.findOne(selector, template);

      if (!templateElement) {
        return;
      }

      content = this._resolvePossibleFunction(content);

      if (!content) {
        templateElement.remove();
        return;
      }

      if (isElement(content)) {
        this._putElementInTemplate(getElement(content), templateElement);

        return;
      }

      if (this._config.html) {
        templateElement.innerHTML = this._maybeSanitize(content);
        return;
      }

      templateElement.textContent = content;
    }

    _maybeSanitize(arg) {
      return this._config.sanitize ? sanitizeHtml(arg, this._config.allowList, this._config.sanitizeFn) : arg;
    }

    _resolvePossibleFunction(arg) {
      return typeof arg === 'function' ? arg(this) : arg;
    }

    _putElementInTemplate(element, templateElement) {
      if (this._config.html) {
        templateElement.innerHTML = '';
        templateElement.append(element);
        return;
      }

      templateElement.textContent = element.textContent;
    }

  }

  /**
   * --------------------------------------------------------------------------
   * Bootstrap (v5.2.3): tooltip.js
   * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
   * --------------------------------------------------------------------------
   */
  /**
   * Constants
   */

  const NAME$4 = 'tooltip';
  const DISALLOWED_ATTRIBUTES = new Set(['sanitize', 'allowList', 'sanitizeFn']);
  const CLASS_NAME_FADE$2 = 'fade';
  const CLASS_NAME_MODAL = 'modal';
  const CLASS_NAME_SHOW$2 = 'show';
  const SELECTOR_TOOLTIP_INNER = '.tooltip-inner';
  const SELECTOR_MODAL = `.${CLASS_NAME_MODAL}`;
  const EVENT_MODAL_HIDE = 'hide.bs.modal';
  const TRIGGER_HOVER = 'hover';
  const TRIGGER_FOCUS = 'focus';
  const TRIGGER_CLICK = 'click';
  const TRIGGER_MANUAL = 'manual';
  const EVENT_HIDE$2 = 'hide';
  const EVENT_HIDDEN$2 = 'hidden';
  const EVENT_SHOW$2 = 'show';
  const EVENT_SHOWN$2 = 'shown';
  const EVENT_INSERTED = 'inserted';
  const EVENT_CLICK$1 = 'click';
  const EVENT_FOCUSIN$1 = 'focusin';
  const EVENT_FOCUSOUT$1 = 'focusout';
  const EVENT_MOUSEENTER = 'mouseenter';
  const EVENT_MOUSELEAVE = 'mouseleave';
  const AttachmentMap = {
    AUTO: 'auto',
    TOP: 'top',
    RIGHT: isRTL() ? 'left' : 'right',
    BOTTOM: 'bottom',
    LEFT: isRTL() ? 'right' : 'left'
  };
  const Default$3 = {
    allowList: DefaultAllowlist,
    animation: true,
    boundary: 'clippingParents',
    container: false,
    customClass: '',
    delay: 0,
    fallbackPlacements: ['top', 'right', 'bottom', 'left'],
    html: false,
    offset: [0, 0],
    placement: 'top',
    popperConfig: null,
    sanitize: true,
    sanitizeFn: null,
    selector: false,
    template: '<div class="tooltip" role="tooltip">' + '<div class="tooltip-arrow"></div>' + '<div class="tooltip-inner"></div>' + '</div>',
    title: '',
    trigger: 'hover focus'
  };
  const DefaultType$3 = {
    allowList: 'object',
    animation: 'boolean',
    boundary: '(string|element)',
    container: '(string|element|boolean)',
    customClass: '(string|function)',
    delay: '(number|object)',
    fallbackPlacements: 'array',
    html: 'boolean',
    offset: '(array|string|function)',
    placement: '(string|function)',
    popperConfig: '(null|object|function)',
    sanitize: 'boolean',
    sanitizeFn: '(null|function)',
    selector: '(string|boolean)',
    template: 'string',
    title: '(string|element|function)',
    trigger: 'string'
  };
  /**
   * Class definition
   */

  class Tooltip extends BaseComponent {
    constructor(element, config) {
      if (typeof Popper__namespace === 'undefined') {
        throw new TypeError('Bootstrap\'s tooltips require Popper (https://popper.js.org)');
      }

      super(element, config); // Private

      this._isEnabled = true;
      this._timeout = 0;
      this._isHovered = null;
      this._activeTrigger = {};
      this._popper = null;
      this._templateFactory = null;
      this._newContent = null; // Protected

      this.tip = null;

      this._setListeners();

      if (!this._config.selector) {
        this._fixTitle();
      }
    } // Getters


    static get Default() {
      return Default$3;
    }

    static get DefaultType() {
      return DefaultType$3;
    }

    static get NAME() {
      return NAME$4;
    } // Public


    enable() {
      this._isEnabled = true;
    }

    disable() {
      this._isEnabled = false;
    }

    toggleEnabled() {
      this._isEnabled = !this._isEnabled;
    }

    toggle() {
      if (!this._isEnabled) {
        return;
      }

      this._activeTrigger.click = !this._activeTrigger.click;

      if (this._isShown()) {
        this._leave();

        return;
      }

      this._enter();
    }

    dispose() {
      clearTimeout(this._timeout);
      EventHandler.off(this._element.closest(SELECTOR_MODAL), EVENT_MODAL_HIDE, this._hideModalHandler);

      if (this._element.getAttribute('data-bs-original-title')) {
        this._element.setAttribute('title', this._element.getAttribute('data-bs-original-title'));
      }

      this._disposePopper();

      super.dispose();
    }

    show() {
      if (this._element.style.display === 'none') {
        throw new Error('Please use show on visible elements');
      }

      if (!(this._isWithContent() && this._isEnabled)) {
        return;
      }

      const showEvent = EventHandler.trigger(this._element, this.constructor.eventName(EVENT_SHOW$2));
      const shadowRoot = findShadowRoot(this._element);

      const isInTheDom = (shadowRoot || this._element.ownerDocument.documentElement).contains(this._element);

      if (showEvent.defaultPrevented || !isInTheDom) {
        return;
      } // todo v6 remove this OR make it optional


      this._disposePopper();

      const tip = this._getTipElement();

      this._element.setAttribute('aria-describedby', tip.getAttribute('id'));

      const {
        container
      } = this._config;

      if (!this._element.ownerDocument.documentElement.contains(this.tip)) {
        container.append(tip);
        EventHandler.trigger(this._element, this.constructor.eventName(EVENT_INSERTED));
      }

      this._popper = this._createPopper(tip);
      tip.classList.add(CLASS_NAME_SHOW$2); // If this is a touch-enabled device we add extra
      // empty mouseover listeners to the body's immediate children;
      // only needed because of broken event delegation on iOS
      // https://www.quirksmode.org/blog/archives/2014/02/mouse_event_bub.html

      if ('ontouchstart' in document.documentElement) {
        for (const element of [].concat(...document.body.children)) {
          EventHandler.on(element, 'mouseover', noop);
        }
      }

      const complete = () => {
        EventHandler.trigger(this._element, this.constructor.eventName(EVENT_SHOWN$2));

        if (this._isHovered === false) {
          this._leave();
        }

        this._isHovered = false;
      };

      this._queueCallback(complete, this.tip, this._isAnimated());
    }

    hide() {
      if (!this._isShown()) {
        return;
      }

      const hideEvent = EventHandler.trigger(this._element, this.constructor.eventName(EVENT_HIDE$2));

      if (hideEvent.defaultPrevented) {
        return;
      }

      const tip = this._getTipElement();

      tip.classList.remove(CLASS_NAME_SHOW$2); // If this is a touch-enabled device we remove the extra
      // empty mouseover listeners we added for iOS support

      if ('ontouchstart' in document.documentElement) {
        for (const element of [].concat(...document.body.children)) {
          EventHandler.off(element, 'mouseover', noop);
        }
      }

      this._activeTrigger[TRIGGER_CLICK] = false;
      this._activeTrigger[TRIGGER_FOCUS] = false;
      this._activeTrigger[TRIGGER_HOVER] = false;
      this._isHovered = null; // it is a trick to support manual triggering

      const complete = () => {
        if (this._isWithActiveTrigger()) {
          return;
        }

        if (!this._isHovered) {
          this._disposePopper();
        }

        this._element.removeAttribute('aria-describedby');

        EventHandler.trigger(this._element, this.constructor.eventName(EVENT_HIDDEN$2));
      };

      this._queueCallback(complete, this.tip, this._isAnimated());
    }

    update() {
      if (this._popper) {
        this._popper.update();
      }
    } // Protected


    _isWithContent() {
      return Boolean(this._getTitle());
    }

    _getTipElement() {
      if (!this.tip) {
        this.tip = this._createTipElement(this._newContent || this._getContentForTemplate());
      }

      return this.tip;
    }

    _createTipElement(content) {
      const tip = this._getTemplateFactory(content).toHtml(); // todo: remove this check on v6


      if (!tip) {
        return null;
      }

      tip.classList.remove(CLASS_NAME_FADE$2, CLASS_NAME_SHOW$2); // todo: on v6 the following can be achieved with CSS only

      tip.classList.add(`bs-${this.constructor.NAME}-auto`);
      const tipId = getUID(this.constructor.NAME).toString();
      tip.setAttribute('id', tipId);

      if (this._isAnimated()) {
        tip.classList.add(CLASS_NAME_FADE$2);
      }

      return tip;
    }

    setContent(content) {
      this._newContent = content;

      if (this._isShown()) {
        this._disposePopper();

        this.show();
      }
    }

    _getTemplateFactory(content) {
      if (this._templateFactory) {
        this._templateFactory.changeContent(content);
      } else {
        this._templateFactory = new TemplateFactory({ ...this._config,
          // the `content` var has to be after `this._config`
          // to override config.content in case of popover
          content,
          extraClass: this._resolvePossibleFunction(this._config.customClass)
        });
      }

      return this._templateFactory;
    }

    _getContentForTemplate() {
      return {
        [SELECTOR_TOOLTIP_INNER]: this._getTitle()
      };
    }

    _getTitle() {
      return this._resolvePossibleFunction(this._config.title) || this._element.getAttribute('data-bs-original-title');
    } // Private


    _initializeOnDelegatedTarget(event) {
      return this.constructor.getOrCreateInstance(event.delegateTarget, this._getDelegateConfig());
    }

    _isAnimated() {
      return this._config.animation || this.tip && this.tip.classList.contains(CLASS_NAME_FADE$2);
    }

    _isShown() {
      return this.tip && this.tip.classList.contains(CLASS_NAME_SHOW$2);
    }

    _createPopper(tip) {
      const placement = typeof this._config.placement === 'function' ? this._config.placement.call(this, tip, this._element) : this._config.placement;
      const attachment = AttachmentMap[placement.toUpperCase()];
      return Popper__namespace.createPopper(this._element, tip, this._getPopperConfig(attachment));
    }

    _getOffset() {
      const {
        offset
      } = this._config;

      if (typeof offset === 'string') {
        return offset.split(',').map(value => Number.parseInt(value, 10));
      }

      if (typeof offset === 'function') {
        return popperData => offset(popperData, this._element);
      }

      return offset;
    }

    _resolvePossibleFunction(arg) {
      return typeof arg === 'function' ? arg.call(this._element) : arg;
    }

    _getPopperConfig(attachment) {
      const defaultBsPopperConfig = {
        placement: attachment,
        modifiers: [{
          name: 'flip',
          options: {
            fallbackPlacements: this._config.fallbackPlacements
          }
        }, {
          name: 'offset',
          options: {
            offset: this._getOffset()
          }
        }, {
          name: 'preventOverflow',
          options: {
            boundary: this._config.boundary
          }
        }, {
          name: 'arrow',
          options: {
            element: `.${this.constructor.NAME}-arrow`
          }
        }, {
          name: 'preSetPlacement',
          enabled: true,
          phase: 'beforeMain',
          fn: data => {
            // Pre-set Popper's placement attribute in order to read the arrow sizes properly.
            // Otherwise, Popper mixes up the width and height dimensions since the initial arrow style is for top placement
            this._getTipElement().setAttribute('data-popper-placement', data.state.placement);
          }
        }]
      };
      return { ...defaultBsPopperConfig,
        ...(typeof this._config.popperConfig === 'function' ? this._config.popperConfig(defaultBsPopperConfig) : this._config.popperConfig)
      };
    }

    _setListeners() {
      const triggers = this._config.trigger.split(' ');

      for (const trigger of triggers) {
        if (trigger === 'click') {
          EventHandler.on(this._element, this.constructor.eventName(EVENT_CLICK$1), this._config.selector, event => {
            const context = this._initializeOnDelegatedTarget(event);

            context.toggle();
          });
        } else if (trigger !== TRIGGER_MANUAL) {
          const eventIn = trigger === TRIGGER_HOVER ? this.constructor.eventName(EVENT_MOUSEENTER) : this.constructor.eventName(EVENT_FOCUSIN$1);
          const eventOut = trigger === TRIGGER_HOVER ? this.constructor.eventName(EVENT_MOUSELEAVE) : this.constructor.eventName(EVENT_FOCUSOUT$1);
          EventHandler.on(this._element, eventIn, this._config.selector, event => {
            const context = this._initializeOnDelegatedTarget(event);

            context._activeTrigger[event.type === 'focusin' ? TRIGGER_FOCUS : TRIGGER_HOVER] = true;

            context._enter();
          });
          EventHandler.on(this._element, eventOut, this._config.selector, event => {
            const context = this._initializeOnDelegatedTarget(event);

            context._activeTrigger[event.type === 'focusout' ? TRIGGER_FOCUS : TRIGGER_HOVER] = context._element.contains(event.relatedTarget);

            context._leave();
          });
        }
      }

      this._hideModalHandler = () => {
        if (this._element) {
          this.hide();
        }
      };

      EventHandler.on(this._element.closest(SELECTOR_MODAL), EVENT_MODAL_HIDE, this._hideModalHandler);
    }

    _fixTitle() {
      const title = this._element.getAttribute('title');

      if (!title) {
        return;
      }

      if (!this._element.getAttribute('aria-label') && !this._element.textContent.trim()) {
        this._element.setAttribute('aria-label', title);
      }

      this._element.setAttribute('data-bs-original-title', title); // DO NOT USE IT. Is only for backwards compatibility


      this._element.removeAttribute('title');
    }

    _enter() {
      if (this._isShown() || this._isHovered) {
        this._isHovered = true;
        return;
      }

      this._isHovered = true;

      this._setTimeout(() => {
        if (this._isHovered) {
          this.show();
        }
      }, this._config.delay.show);
    }

    _leave() {
      if (this._isWithActiveTrigger()) {
        return;
      }

      this._isHovered = false;

      this._setTimeout(() => {
        if (!this._isHovered) {
          this.hide();
        }
      }, this._config.delay.hide);
    }

    _setTimeout(handler, timeout) {
      clearTimeout(this._timeout);
      this._timeout = setTimeout(handler, timeout);
    }

    _isWithActiveTrigger() {
      return Object.values(this._activeTrigger).includes(true);
    }

    _getConfig(config) {
      const dataAttributes = Manipulator.getDataAttributes(this._element);

      for (const dataAttribute of Object.keys(dataAttributes)) {
        if (DISALLOWED_ATTRIBUTES.has(dataAttribute)) {
          delete dataAttributes[dataAttribute];
        }
      }

      config = { ...dataAttributes,
        ...(typeof config === 'object' && config ? config : {})
      };
      config = this._mergeConfigObj(config);
      config = this._configAfterMerge(config);

      this._typeCheckConfig(config);

      return config;
    }

    _configAfterMerge(config) {
      config.container = config.container === false ? document.body : getElement(config.container);

      if (typeof config.delay === 'number') {
        config.delay = {
          show: config.delay,
          hide: config.delay
        };
      }

      if (typeof config.title === 'number') {
        config.title = config.title.toString();
      }

      if (typeof config.content === 'number') {
        config.content = config.content.toString();
      }

      return config;
    }

    _getDelegateConfig() {
      const config = {};

      for (const key in this._config) {
        if (this.constructor.Default[key] !== this._config[key]) {
          config[key] = this._config[key];
        }
      }

      config.selector = false;
      config.trigger = 'manual'; // In the future can be replaced with:
      // const keysWithDifferentValues = Object.entries(this._config).filter(entry => this.constructor.Default[entry[0]] !== this._config[entry[0]])
      // `Object.fromEntries(keysWithDifferentValues)`

      return config;
    }

    _disposePopper() {
      if (this._popper) {
        this._popper.destroy();

        this._popper = null;
      }

      if (this.tip) {
        this.tip.remove();
        this.tip = null;
      }
    } // Static


    static jQueryInterface(config) {
      return this.each(function () {
        const data = Tooltip.getOrCreateInstance(this, config);

        if (typeof config !== 'string') {
          return;
        }

        if (typeof data[config] === 'undefined') {
          throw new TypeError(`No method named "${config}"`);
        }

        data[config]();
      });
    }

  }
  /**
   * jQuery
   */


  defineJQueryPlugin(Tooltip);

  /**
   * --------------------------------------------------------------------------
   * Bootstrap (v5.2.3): popover.js
   * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
   * --------------------------------------------------------------------------
   */
  /**
   * Constants
   */

  const NAME$3 = 'popover';
  const SELECTOR_TITLE = '.popover-header';
  const SELECTOR_CONTENT = '.popover-body';
  const Default$2 = { ...Tooltip.Default,
    content: '',
    offset: [0, 8],
    placement: 'right',
    template: '<div class="popover" role="tooltip">' + '<div class="popover-arrow"></div>' + '<h3 class="popover-header"></h3>' + '<div class="popover-body"></div>' + '</div>',
    trigger: 'click'
  };
  const DefaultType$2 = { ...Tooltip.DefaultType,
    content: '(null|string|element|function)'
  };
  /**
   * Class definition
   */

  class Popover extends Tooltip {
    // Getters
    static get Default() {
      return Default$2;
    }

    static get DefaultType() {
      return DefaultType$2;
    }

    static get NAME() {
      return NAME$3;
    } // Overrides


    _isWithContent() {
      return this._getTitle() || this._getContent();
    } // Private


    _getContentForTemplate() {
      return {
        [SELECTOR_TITLE]: this._getTitle(),
        [SELECTOR_CONTENT]: this._getContent()
      };
    }

    _getContent() {
      return this._resolvePossibleFunction(this._config.content);
    } // Static


    static jQueryInterface(config) {
      return this.each(function () {
        const data = Popover.getOrCreateInstance(this, config);

        if (typeof config !== 'string') {
          return;
        }

        if (typeof data[config] === 'undefined') {
          throw new TypeError(`No method named "${config}"`);
        }

        data[config]();
      });
    }

  }
  /**
   * jQuery
   */


  defineJQueryPlugin(Popover);

  /**
   * --------------------------------------------------------------------------
   * Bootstrap (v5.2.3): scrollspy.js
   * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
   * --------------------------------------------------------------------------
   */
  /**
   * Constants
   */

  const NAME$2 = 'scrollspy';
  const DATA_KEY$2 = 'bs.scrollspy';
  const EVENT_KEY$2 = `.${DATA_KEY$2}`;
  const DATA_API_KEY = '.data-api';
  const EVENT_ACTIVATE = `activate${EVENT_KEY$2}`;
  const EVENT_CLICK = `click${EVENT_KEY$2}`;
  const EVENT_LOAD_DATA_API$1 = `load${EVENT_KEY$2}${DATA_API_KEY}`;
  const CLASS_NAME_DROPDOWN_ITEM = 'dropdown-item';
  const CLASS_NAME_ACTIVE$1 = 'active';
  const SELECTOR_DATA_SPY = '[data-bs-spy="scroll"]';
  const SELECTOR_TARGET_LINKS = '[href]';
  const SELECTOR_NAV_LIST_GROUP = '.nav, .list-group';
  const SELECTOR_NAV_LINKS = '.nav-link';
  const SELECTOR_NAV_ITEMS = '.nav-item';
  const SELECTOR_LIST_ITEMS = '.list-group-item';
  const SELECTOR_LINK_ITEMS = `${SELECTOR_NAV_LINKS}, ${SELECTOR_NAV_ITEMS} > ${SELECTOR_NAV_LINKS}, ${SELECTOR_LIST_ITEMS}`;
  const SELECTOR_DROPDOWN = '.dropdown';
  const SELECTOR_DROPDOWN_TOGGLE$1 = '.dropdown-toggle';
  const Default$1 = {
    offset: null,
    // TODO: v6 @deprecated, keep it for backwards compatibility reasons
    rootMargin: '0px 0px -25%',
    smoothScroll: false,
    target: null,
    threshold: [0.1, 0.5, 1]
  };
  const DefaultType$1 = {
    offset: '(number|null)',
    // TODO v6 @deprecated, keep it for backwards compatibility reasons
    rootMargin: 'string',
    smoothScroll: 'boolean',
    target: 'element',
    threshold: 'array'
  };
  /**
   * Class definition
   */

  class ScrollSpy extends BaseComponent {
    constructor(element, config) {
      super(element, config); // this._element is the observablesContainer and config.target the menu links wrapper

      this._targetLinks = new Map();
      this._observableSections = new Map();
      this._rootElement = getComputedStyle(this._element).overflowY === 'visible' ? null : this._element;
      this._activeTarget = null;
      this._observer = null;
      this._previousScrollData = {
        visibleEntryTop: 0,
        parentScrollTop: 0
      };
      this.refresh(); // initialize
    } // Getters


    static get Default() {
      return Default$1;
    }

    static get DefaultType() {
      return DefaultType$1;
    }

    static get NAME() {
      return NAME$2;
    } // Public


    refresh() {
      this._initializeTargetsAndObservables();

      this._maybeEnableSmoothScroll();

      if (this._observer) {
        this._observer.disconnect();
      } else {
        this._observer = this._getNewObserver();
      }

      for (const section of this._observableSections.values()) {
        this._observer.observe(section);
      }
    }

    dispose() {
      this._observer.disconnect();

      super.dispose();
    } // Private


    _configAfterMerge(config) {
      // TODO: on v6 target should be given explicitly & remove the {target: 'ss-target'} case
      config.target = getElement(config.target) || document.body; // TODO: v6 Only for backwards compatibility reasons. Use rootMargin only

      config.rootMargin = config.offset ? `${config.offset}px 0px -30%` : config.rootMargin;

      if (typeof config.threshold === 'string') {
        config.threshold = config.threshold.split(',').map(value => Number.parseFloat(value));
      }

      return config;
    }

    _maybeEnableSmoothScroll() {
      if (!this._config.smoothScroll) {
        return;
      } // unregister any previous listeners


      EventHandler.off(this._config.target, EVENT_CLICK);
      EventHandler.on(this._config.target, EVENT_CLICK, SELECTOR_TARGET_LINKS, event => {
        const observableSection = this._observableSections.get(event.target.hash);

        if (observableSection) {
          event.preventDefault();
          const root = this._rootElement || window;
          const height = observableSection.offsetTop - this._element.offsetTop;

          if (root.scrollTo) {
            root.scrollTo({
              top: height,
              behavior: 'smooth'
            });
            return;
          } // Chrome 60 doesn't support `scrollTo`


          root.scrollTop = height;
        }
      });
    }

    _getNewObserver() {
      const options = {
        root: this._rootElement,
        threshold: this._config.threshold,
        rootMargin: this._config.rootMargin
      };
      return new IntersectionObserver(entries => this._observerCallback(entries), options);
    } // The logic of selection


    _observerCallback(entries) {
      const targetElement = entry => this._targetLinks.get(`#${entry.target.id}`);

      const activate = entry => {
        this._previousScrollData.visibleEntryTop = entry.target.offsetTop;

        this._process(targetElement(entry));
      };

      const parentScrollTop = (this._rootElement || document.documentElement).scrollTop;
      const userScrollsDown = parentScrollTop >= this._previousScrollData.parentScrollTop;
      this._previousScrollData.parentScrollTop = parentScrollTop;

      for (const entry of entries) {
        if (!entry.isIntersecting) {
          this._activeTarget = null;

          this._clearActiveClass(targetElement(entry));

          continue;
        }

        const entryIsLowerThanPrevious = entry.target.offsetTop >= this._previousScrollData.visibleEntryTop; // if we are scrolling down, pick the bigger offsetTop

        if (userScrollsDown && entryIsLowerThanPrevious) {
          activate(entry); // if parent isn't scrolled, let's keep the first visible item, breaking the iteration

          if (!parentScrollTop) {
            return;
          }

          continue;
        } // if we are scrolling up, pick the smallest offsetTop


        if (!userScrollsDown && !entryIsLowerThanPrevious) {
          activate(entry);
        }
      }
    }

    _initializeTargetsAndObservables() {
      this._targetLinks = new Map();
      this._observableSections = new Map();
      const targetLinks = SelectorEngine.find(SELECTOR_TARGET_LINKS, this._config.target);

      for (const anchor of targetLinks) {
        // ensure that the anchor has an id and is not disabled
        if (!anchor.hash || isDisabled(anchor)) {
          continue;
        }

        const observableSection = SelectorEngine.findOne(anchor.hash, this._element); // ensure that the observableSection exists & is visible

        if (isVisible(observableSection)) {
          this._targetLinks.set(anchor.hash, anchor);

          this._observableSections.set(anchor.hash, observableSection);
        }
      }
    }

    _process(target) {
      if (this._activeTarget === target) {
        return;
      }

      this._clearActiveClass(this._config.target);

      this._activeTarget = target;
      target.classList.add(CLASS_NAME_ACTIVE$1);

      this._activateParents(target);

      EventHandler.trigger(this._element, EVENT_ACTIVATE, {
        relatedTarget: target
      });
    }

    _activateParents(target) {
      // Activate dropdown parents
      if (target.classList.contains(CLASS_NAME_DROPDOWN_ITEM)) {
        SelectorEngine.findOne(SELECTOR_DROPDOWN_TOGGLE$1, target.closest(SELECTOR_DROPDOWN)).classList.add(CLASS_NAME_ACTIVE$1);
        return;
      }

      for (const listGroup of SelectorEngine.parents(target, SELECTOR_NAV_LIST_GROUP)) {
        // Set triggered links parents as active
        // With both <ul> and <nav> markup a parent is the previous sibling of any nav ancestor
        for (const item of SelectorEngine.prev(listGroup, SELECTOR_LINK_ITEMS)) {
          item.classList.add(CLASS_NAME_ACTIVE$1);
        }
      }
    }

    _clearActiveClass(parent) {
      parent.classList.remove(CLASS_NAME_ACTIVE$1);
      const activeNodes = SelectorEngine.find(`${SELECTOR_TARGET_LINKS}.${CLASS_NAME_ACTIVE$1}`, parent);

      for (const node of activeNodes) {
        node.classList.remove(CLASS_NAME_ACTIVE$1);
      }
    } // Static


    static jQueryInterface(config) {
      return this.each(function () {
        const data = ScrollSpy.getOrCreateInstance(this, config);

        if (typeof config !== 'string') {
          return;
        }

        if (data[config] === undefined || config.startsWith('_') || config === 'constructor') {
          throw new TypeError(`No method named "${config}"`);
        }

        data[config]();
      });
    }

  }
  /**
   * Data API implementation
   */


  EventHandler.on(window, EVENT_LOAD_DATA_API$1, () => {
    for (const spy of SelectorEngine.find(SELECTOR_DATA_SPY)) {
      ScrollSpy.getOrCreateInstance(spy);
    }
  });
  /**
   * jQuery
   */

  defineJQueryPlugin(ScrollSpy);

  /**
   * --------------------------------------------------------------------------
   * Bootstrap (v5.2.3): tab.js
   * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
   * --------------------------------------------------------------------------
   */
  /**
   * Constants
   */

  const NAME$1 = 'tab';
  const DATA_KEY$1 = 'bs.tab';
  const EVENT_KEY$1 = `.${DATA_KEY$1}`;
  const EVENT_HIDE$1 = `hide${EVENT_KEY$1}`;
  const EVENT_HIDDEN$1 = `hidden${EVENT_KEY$1}`;
  const EVENT_SHOW$1 = `show${EVENT_KEY$1}`;
  const EVENT_SHOWN$1 = `shown${EVENT_KEY$1}`;
  const EVENT_CLICK_DATA_API = `click${EVENT_KEY$1}`;
  const EVENT_KEYDOWN = `keydown${EVENT_KEY$1}`;
  const EVENT_LOAD_DATA_API = `load${EVENT_KEY$1}`;
  const ARROW_LEFT_KEY = 'ArrowLeft';
  const ARROW_RIGHT_KEY = 'ArrowRight';
  const ARROW_UP_KEY = 'ArrowUp';
  const ARROW_DOWN_KEY = 'ArrowDown';
  const CLASS_NAME_ACTIVE = 'active';
  const CLASS_NAME_FADE$1 = 'fade';
  const CLASS_NAME_SHOW$1 = 'show';
  const CLASS_DROPDOWN = 'dropdown';
  const SELECTOR_DROPDOWN_TOGGLE = '.dropdown-toggle';
  const SELECTOR_DROPDOWN_MENU = '.dropdown-menu';
  const NOT_SELECTOR_DROPDOWN_TOGGLE = ':not(.dropdown-toggle)';
  const SELECTOR_TAB_PANEL = '.list-group, .nav, [role="tablist"]';
  const SELECTOR_OUTER = '.nav-item, .list-group-item';
  const SELECTOR_INNER = `.nav-link${NOT_SELECTOR_DROPDOWN_TOGGLE}, .list-group-item${NOT_SELECTOR_DROPDOWN_TOGGLE}, [role="tab"]${NOT_SELECTOR_DROPDOWN_TOGGLE}`;
  const SELECTOR_DATA_TOGGLE = '[data-bs-toggle="tab"], [data-bs-toggle="pill"], [data-bs-toggle="list"]'; // todo:v6: could be only `tab`

  const SELECTOR_INNER_ELEM = `${SELECTOR_INNER}, ${SELECTOR_DATA_TOGGLE}`;
  const SELECTOR_DATA_TOGGLE_ACTIVE = `.${CLASS_NAME_ACTIVE}[data-bs-toggle="tab"], .${CLASS_NAME_ACTIVE}[data-bs-toggle="pill"], .${CLASS_NAME_ACTIVE}[data-bs-toggle="list"]`;
  /**
   * Class definition
   */

  class Tab extends BaseComponent {
    constructor(element) {
      super(element);
      this._parent = this._element.closest(SELECTOR_TAB_PANEL);

      if (!this._parent) {
        return; // todo: should Throw exception on v6
        // throw new TypeError(`${element.outerHTML} has not a valid parent ${SELECTOR_INNER_ELEM}`)
      } // Set up initial aria attributes


      this._setInitialAttributes(this._parent, this._getChildren());

      EventHandler.on(this._element, EVENT_KEYDOWN, event => this._keydown(event));
    } // Getters


    static get NAME() {
      return NAME$1;
    } // Public


    show() {
      // Shows this elem and deactivate the active sibling if exists
      const innerElem = this._element;

      if (this._elemIsActive(innerElem)) {
        return;
      } // Search for active tab on same parent to deactivate it


      const active = this._getActiveElem();

      const hideEvent = active ? EventHandler.trigger(active, EVENT_HIDE$1, {
        relatedTarget: innerElem
      }) : null;
      const showEvent = EventHandler.trigger(innerElem, EVENT_SHOW$1, {
        relatedTarget: active
      });

      if (showEvent.defaultPrevented || hideEvent && hideEvent.defaultPrevented) {
        return;
      }

      this._deactivate(active, innerElem);

      this._activate(innerElem, active);
    } // Private


    _activate(element, relatedElem) {
      if (!element) {
        return;
      }

      element.classList.add(CLASS_NAME_ACTIVE);

      this._activate(getElementFromSelector(element)); // Search and activate/show the proper section


      const complete = () => {
        if (element.getAttribute('role') !== 'tab') {
          element.classList.add(CLASS_NAME_SHOW$1);
          return;
        }

        element.removeAttribute('tabindex');
        element.setAttribute('aria-selected', true);

        this._toggleDropDown(element, true);

        EventHandler.trigger(element, EVENT_SHOWN$1, {
          relatedTarget: relatedElem
        });
      };

      this._queueCallback(complete, element, element.classList.contains(CLASS_NAME_FADE$1));
    }

    _deactivate(element, relatedElem) {
      if (!element) {
        return;
      }

      element.classList.remove(CLASS_NAME_ACTIVE);
      element.blur();

      this._deactivate(getElementFromSelector(element)); // Search and deactivate the shown section too


      const complete = () => {
        if (element.getAttribute('role') !== 'tab') {
          element.classList.remove(CLASS_NAME_SHOW$1);
          return;
        }

        element.setAttribute('aria-selected', false);
        element.setAttribute('tabindex', '-1');

        this._toggleDropDown(element, false);

        EventHandler.trigger(element, EVENT_HIDDEN$1, {
          relatedTarget: relatedElem
        });
      };

      this._queueCallback(complete, element, element.classList.contains(CLASS_NAME_FADE$1));
    }

    _keydown(event) {
      if (![ARROW_LEFT_KEY, ARROW_RIGHT_KEY, ARROW_UP_KEY, ARROW_DOWN_KEY].includes(event.key)) {
        return;
      }

      event.stopPropagation(); // stopPropagation/preventDefault both added to support up/down keys without scrolling the page

      event.preventDefault();
      const isNext = [ARROW_RIGHT_KEY, ARROW_DOWN_KEY].includes(event.key);
      const nextActiveElement = getNextActiveElement(this._getChildren().filter(element => !isDisabled(element)), event.target, isNext, true);

      if (nextActiveElement) {
        nextActiveElement.focus({
          preventScroll: true
        });
        Tab.getOrCreateInstance(nextActiveElement).show();
      }
    }

    _getChildren() {
      // collection of inner elements
      return SelectorEngine.find(SELECTOR_INNER_ELEM, this._parent);
    }

    _getActiveElem() {
      return this._getChildren().find(child => this._elemIsActive(child)) || null;
    }

    _setInitialAttributes(parent, children) {
      this._setAttributeIfNotExists(parent, 'role', 'tablist');

      for (const child of children) {
        this._setInitialAttributesOnChild(child);
      }
    }

    _setInitialAttributesOnChild(child) {
      child = this._getInnerElement(child);

      const isActive = this._elemIsActive(child);

      const outerElem = this._getOuterElement(child);

      child.setAttribute('aria-selected', isActive);

      if (outerElem !== child) {
        this._setAttributeIfNotExists(outerElem, 'role', 'presentation');
      }

      if (!isActive) {
        child.setAttribute('tabindex', '-1');
      }

      this._setAttributeIfNotExists(child, 'role', 'tab'); // set attributes to the related panel too


      this._setInitialAttributesOnTargetPanel(child);
    }

    _setInitialAttributesOnTargetPanel(child) {
      const target = getElementFromSelector(child);

      if (!target) {
        return;
      }

      this._setAttributeIfNotExists(target, 'role', 'tabpanel');

      if (child.id) {
        this._setAttributeIfNotExists(target, 'aria-labelledby', `#${child.id}`);
      }
    }

    _toggleDropDown(element, open) {
      const outerElem = this._getOuterElement(element);

      if (!outerElem.classList.contains(CLASS_DROPDOWN)) {
        return;
      }

      const toggle = (selector, className) => {
        const element = SelectorEngine.findOne(selector, outerElem);

        if (element) {
          element.classList.toggle(className, open);
        }
      };

      toggle(SELECTOR_DROPDOWN_TOGGLE, CLASS_NAME_ACTIVE);
      toggle(SELECTOR_DROPDOWN_MENU, CLASS_NAME_SHOW$1);
      outerElem.setAttribute('aria-expanded', open);
    }

    _setAttributeIfNotExists(element, attribute, value) {
      if (!element.hasAttribute(attribute)) {
        element.setAttribute(attribute, value);
      }
    }

    _elemIsActive(elem) {
      return elem.classList.contains(CLASS_NAME_ACTIVE);
    } // Try to get the inner element (usually the .nav-link)


    _getInnerElement(elem) {
      return elem.matches(SELECTOR_INNER_ELEM) ? elem : SelectorEngine.findOne(SELECTOR_INNER_ELEM, elem);
    } // Try to get the outer element (usually the .nav-item)


    _getOuterElement(elem) {
      return elem.closest(SELECTOR_OUTER) || elem;
    } // Static


    static jQueryInterface(config) {
      return this.each(function () {
        const data = Tab.getOrCreateInstance(this);

        if (typeof config !== 'string') {
          return;
        }

        if (data[config] === undefined || config.startsWith('_') || config === 'constructor') {
          throw new TypeError(`No method named "${config}"`);
        }

        data[config]();
      });
    }

  }
  /**
   * Data API implementation
   */


  EventHandler.on(document, EVENT_CLICK_DATA_API, SELECTOR_DATA_TOGGLE, function (event) {
    if (['A', 'AREA'].includes(this.tagName)) {
      event.preventDefault();
    }

    if (isDisabled(this)) {
      return;
    }

    Tab.getOrCreateInstance(this).show();
  });
  /**
   * Initialize on focus
   */

  EventHandler.on(window, EVENT_LOAD_DATA_API, () => {
    for (const element of SelectorEngine.find(SELECTOR_DATA_TOGGLE_ACTIVE)) {
      Tab.getOrCreateInstance(element);
    }
  });
  /**
   * jQuery
   */

  defineJQueryPlugin(Tab);

  /**
   * --------------------------------------------------------------------------
   * Bootstrap (v5.2.3): toast.js
   * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
   * --------------------------------------------------------------------------
   */
  /**
   * Constants
   */

  const NAME = 'toast';
  const DATA_KEY = 'bs.toast';
  const EVENT_KEY = `.${DATA_KEY}`;
  const EVENT_MOUSEOVER = `mouseover${EVENT_KEY}`;
  const EVENT_MOUSEOUT = `mouseout${EVENT_KEY}`;
  const EVENT_FOCUSIN = `focusin${EVENT_KEY}`;
  const EVENT_FOCUSOUT = `focusout${EVENT_KEY}`;
  const EVENT_HIDE = `hide${EVENT_KEY}`;
  const EVENT_HIDDEN = `hidden${EVENT_KEY}`;
  const EVENT_SHOW = `show${EVENT_KEY}`;
  const EVENT_SHOWN = `shown${EVENT_KEY}`;
  const CLASS_NAME_FADE = 'fade';
  const CLASS_NAME_HIDE = 'hide'; // @deprecated - kept here only for backwards compatibility

  const CLASS_NAME_SHOW = 'show';
  const CLASS_NAME_SHOWING = 'showing';
  const DefaultType = {
    animation: 'boolean',
    autohide: 'boolean',
    delay: 'number'
  };
  const Default = {
    animation: true,
    autohide: true,
    delay: 5000
  };
  /**
   * Class definition
   */

  class Toast extends BaseComponent {
    constructor(element, config) {
      super(element, config);
      this._timeout = null;
      this._hasMouseInteraction = false;
      this._hasKeyboardInteraction = false;

      this._setListeners();
    } // Getters


    static get Default() {
      return Default;
    }

    static get DefaultType() {
      return DefaultType;
    }

    static get NAME() {
      return NAME;
    } // Public


    show() {
      const showEvent = EventHandler.trigger(this._element, EVENT_SHOW);

      if (showEvent.defaultPrevented) {
        return;
      }

      this._clearTimeout();

      if (this._config.animation) {
        this._element.classList.add(CLASS_NAME_FADE);
      }

      const complete = () => {
        this._element.classList.remove(CLASS_NAME_SHOWING);

        EventHandler.trigger(this._element, EVENT_SHOWN);

        this._maybeScheduleHide();
      };

      this._element.classList.remove(CLASS_NAME_HIDE); // @deprecated


      reflow(this._element);

      this._element.classList.add(CLASS_NAME_SHOW, CLASS_NAME_SHOWING);

      this._queueCallback(complete, this._element, this._config.animation);
    }

    hide() {
      if (!this.isShown()) {
        return;
      }

      const hideEvent = EventHandler.trigger(this._element, EVENT_HIDE);

      if (hideEvent.defaultPrevented) {
        return;
      }

      const complete = () => {
        this._element.classList.add(CLASS_NAME_HIDE); // @deprecated


        this._element.classList.remove(CLASS_NAME_SHOWING, CLASS_NAME_SHOW);

        EventHandler.trigger(this._element, EVENT_HIDDEN);
      };

      this._element.classList.add(CLASS_NAME_SHOWING);

      this._queueCallback(complete, this._element, this._config.animation);
    }

    dispose() {
      this._clearTimeout();

      if (this.isShown()) {
        this._element.classList.remove(CLASS_NAME_SHOW);
      }

      super.dispose();
    }

    isShown() {
      return this._element.classList.contains(CLASS_NAME_SHOW);
    } // Private


    _maybeScheduleHide() {
      if (!this._config.autohide) {
        return;
      }

      if (this._hasMouseInteraction || this._hasKeyboardInteraction) {
        return;
      }

      this._timeout = setTimeout(() => {
        this.hide();
      }, this._config.delay);
    }

    _onInteraction(event, isInteracting) {
      switch (event.type) {
        case 'mouseover':
        case 'mouseout':
          {
            this._hasMouseInteraction = isInteracting;
            break;
          }

        case 'focusin':
        case 'focusout':
          {
            this._hasKeyboardInteraction = isInteracting;
            break;
          }
      }

      if (isInteracting) {
        this._clearTimeout();

        return;
      }

      const nextElement = event.relatedTarget;

      if (this._element === nextElement || this._element.contains(nextElement)) {
        return;
      }

      this._maybeScheduleHide();
    }

    _setListeners() {
      EventHandler.on(this._element, EVENT_MOUSEOVER, event => this._onInteraction(event, true));
      EventHandler.on(this._element, EVENT_MOUSEOUT, event => this._onInteraction(event, false));
      EventHandler.on(this._element, EVENT_FOCUSIN, event => this._onInteraction(event, true));
      EventHandler.on(this._element, EVENT_FOCUSOUT, event => this._onInteraction(event, false));
    }

    _clearTimeout() {
      clearTimeout(this._timeout);
      this._timeout = null;
    } // Static


    static jQueryInterface(config) {
      return this.each(function () {
        const data = Toast.getOrCreateInstance(this, config);

        if (typeof config === 'string') {
          if (typeof data[config] === 'undefined') {
            throw new TypeError(`No method named "${config}"`);
          }

          data[config](this);
        }
      });
    }

  }
  /**
   * Data API implementation
   */


  enableDismissTrigger(Toast);
  /**
   * jQuery
   */

  defineJQueryPlugin(Toast);

  /**
   * --------------------------------------------------------------------------
   * Bootstrap (v5.2.3): index.umd.js
   * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
   * --------------------------------------------------------------------------
   */
  const index_umd = {
    Alert,
    Button,
    Carousel,
    Collapse,
    Dropdown,
    Modal,
    Offcanvas,
    Popover,
    ScrollSpy,
    Tab,
    Toast,
    Tooltip
  };

  return index_umd;

}));
//# sourceMappingURL=bootstrap.js.map

/* End */
;
; /* Start:"a:4:{s:4:"full";s:106:"/local/templates/dombilet2.0/components/bitrix/catalog.element/.default/js/leaflet.min.js?1754922251425834";s:6:"source";s:89:"/local/templates/dombilet2.0/components/bitrix/catalog.element/.default/js/leaflet.min.js";s:3:"min";s:89:"/local/templates/dombilet2.0/components/bitrix/catalog.element/.default/js/leaflet.min.js";s:3:"map";s:93:"/local/templates/dombilet2.0/components/bitrix/catalog.element/.default/js/leaflet-src.js.map";}"*/
/* @preserve
 * Leaflet 1.6.0+Detached: bd88f73e8ddb90eb945a28bc1de9eb07f7386118.bd88f73, a JS library for interactive maps. http://leafletjs.com
 * (c) 2010-2019 Vladimir Agafonkin, (c) 2010-2011 CloudMade
 */

(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.L = {})));
}(this, (function (exports) { 'use strict';

	var version = "1.6.0";

	/*
	 * @namespace Util
	 *
	 * Various utility functions, used by Leaflet internally.
	 */

	// @function extend(dest: Object, src?: Object): Object
	// Merges the properties of the `src` object (or multiple objects) into `dest` object and returns the latter. Has an `L.extend` shortcut.
	function extend(dest) {
		var i, j, len, src;

		for (j = 1, len = arguments.length; j < len; j++) {
			src = arguments[j];
			for (i in src) {
				dest[i] = src[i];
			}
		}
		return dest;
	}

	// @function create(proto: Object, properties?: Object): Object
	// Compatibility polyfill for [Object.create](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object/create)
	var create = Object.create || (function () {
		function F() {}
		return function (proto) {
			F.prototype = proto;
			return new F();
		};
	})();

	// @function bind(fn: Function, …): Function
	// Returns a new function bound to the arguments passed, like [Function.prototype.bind](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Function/bind).
	// Has a `L.bind()` shortcut.
	function bind(fn, obj) {
		var slice = Array.prototype.slice;

		if (fn.bind) {
			return fn.bind.apply(fn, slice.call(arguments, 1));
		}

		var args = slice.call(arguments, 2);

		return function () {
			return fn.apply(obj, args.length ? args.concat(slice.call(arguments)) : arguments);
		};
	}

	// @property lastId: Number
	// Last unique ID used by [`stamp()`](#util-stamp)
	var lastId = 0;

	// @function stamp(obj: Object): Number
	// Returns the unique ID of an object, assigning it one if it doesn't have it.
	function stamp(obj) {
		/*eslint-disable */
		obj._leaflet_id = obj._leaflet_id || ++lastId;
		return obj._leaflet_id;
		/* eslint-enable */
	}

	// @function throttle(fn: Function, time: Number, context: Object): Function
	// Returns a function which executes function `fn` with the given scope `context`
	// (so that the `this` keyword refers to `context` inside `fn`'s code). The function
	// `fn` will be called no more than one time per given amount of `time`. The arguments
	// received by the bound function will be any arguments passed when binding the
	// function, followed by any arguments passed when invoking the bound function.
	// Has an `L.throttle` shortcut.
	function throttle(fn, time, context) {
		var lock, args, wrapperFn, later;

		later = function () {
			// reset lock and call if queued
			lock = false;
			if (args) {
				wrapperFn.apply(context, args);
				args = false;
			}
		};

		wrapperFn = function () {
			if (lock) {
				// called too soon, queue to call later
				args = arguments;

			} else {
				// call and lock until later
				fn.apply(context, arguments);
				setTimeout(later, time);
				lock = true;
			}
		};

		return wrapperFn;
	}

	// @function wrapNum(num: Number, range: Number[], includeMax?: Boolean): Number
	// Returns the number `num` modulo `range` in such a way so it lies within
	// `range[0]` and `range[1]`. The returned value will be always smaller than
	// `range[1]` unless `includeMax` is set to `true`.
	function wrapNum(x, range, includeMax) {
		var max = range[1],
				min = range[0],
				d = max - min;
		return x === max && includeMax ? x : ((x - min) % d + d) % d + min;
	}

	// @function falseFn(): Function
	// Returns a function which always returns `false`.
	function falseFn() { return false; }

	// @function formatNum(num: Number, digits?: Number): Number
	// Returns the number `num` rounded to `digits` decimals, or to 6 decimals by default.
	function formatNum(num, digits) {
		var pow = Math.pow(10, (digits === undefined ? 6 : digits));
		return Math.round(num * pow) / pow;
	}

	// @function trim(str: String): String
	// Compatibility polyfill for [String.prototype.trim](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String/Trim)
	function trim(str) {
		return str.trim ? str.trim() : str.replace(/^\s+|\s+$/g, '');
	}

	// @function splitWords(str: String): String[]
	// Trims and splits the string on whitespace and returns the array of parts.
	function splitWords(str) {
		return trim(str).split(/\s+/);
	}

	// @function setOptions(obj: Object, options: Object): Object
	// Merges the given properties to the `options` of the `obj` object, returning the resulting options. See `Class options`. Has an `L.setOptions` shortcut.
	function setOptions(obj, options) {
		if (!Object.prototype.hasOwnProperty.call(obj, 'options')) {
			obj.options = obj.options ? create(obj.options) : {};
		}
		for (var i in options) {
			obj.options[i] = options[i];
		}
		return obj.options;
	}

	// @function getParamString(obj: Object, existingUrl?: String, uppercase?: Boolean): String
	// Converts an object into a parameter URL string, e.g. `{a: "foo", b: "bar"}`
	// translates to `'?a=foo&b=bar'`. If `existingUrl` is set, the parameters will
	// be appended at the end. If `uppercase` is `true`, the parameter names will
	// be uppercased (e.g. `'?A=foo&B=bar'`)
	function getParamString(obj, existingUrl, uppercase) {
		var params = [];
		for (var i in obj) {
			params.push(encodeURIComponent(uppercase ? i.toUpperCase() : i) + '=' + encodeURIComponent(obj[i]));
		}
		return ((!existingUrl || existingUrl.indexOf('?') === -1) ? '?' : '&') + params.join('&');
	}

	var templateRe = /\{ *([\w_-]+) *\}/g;

	// @function template(str: String, data: Object): String
	// Simple templating facility, accepts a template string of the form `'Hello {a}, {b}'`
	// and a data object like `{a: 'foo', b: 'bar'}`, returns evaluated string
	// `('Hello foo, bar')`. You can also specify functions instead of strings for
	// data values — they will be evaluated passing `data` as an argument.
	function template(str, data) {
		return str.replace(templateRe, function (str, key) {
			var value = data[key];

			if (value === undefined) {
				throw new Error('No value provided for variable ' + str);

			} else if (typeof value === 'function') {
				value = value(data);
			}
			return value;
		});
	}

	// @function isArray(obj): Boolean
	// Compatibility polyfill for [Array.isArray](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array/isArray)
	var isArray = Array.isArray || function (obj) {
		return (Object.prototype.toString.call(obj) === '[object Array]');
	};

	// @function indexOf(array: Array, el: Object): Number
	// Compatibility polyfill for [Array.prototype.indexOf](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array/indexOf)
	function indexOf(array, el) {
		for (var i = 0; i < array.length; i++) {
			if (array[i] === el) { return i; }
		}
		return -1;
	}

	// @property emptyImageUrl: String
	// Data URI string containing a base64-encoded empty GIF image.
	// Used as a hack to free memory from unused images on WebKit-powered
	// mobile devices (by setting image `src` to this string).
	var emptyImageUrl = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';

	// inspired by http://paulirish.com/2011/requestanimationframe-for-smart-animating/

	function getPrefixed(name) {
		return window['webkit' + name] || window['moz' + name] || window['ms' + name];
	}

	var lastTime = 0;

	// fallback for IE 7-8
	function timeoutDefer(fn) {
		var time = +new Date(),
				timeToCall = Math.max(0, 16 - (time - lastTime));

		lastTime = time + timeToCall;
		return window.setTimeout(fn, timeToCall);
	}

	var requestFn = window.requestAnimationFrame || getPrefixed('RequestAnimationFrame') || timeoutDefer;
	var cancelFn = window.cancelAnimationFrame || getPrefixed('CancelAnimationFrame') ||
			getPrefixed('CancelRequestAnimationFrame') || function (id) { window.clearTimeout(id); };

	// @function requestAnimFrame(fn: Function, context?: Object, immediate?: Boolean): Number
	// Schedules `fn` to be executed when the browser repaints. `fn` is bound to
	// `context` if given. When `immediate` is set, `fn` is called immediately if
	// the browser doesn't have native support for
	// [`window.requestAnimationFrame`](https://developer.mozilla.org/docs/Web/API/window/requestAnimationFrame),
	// otherwise it's delayed. Returns a request ID that can be used to cancel the request.
	function requestAnimFrame(fn, context, immediate) {
		if (immediate && requestFn === timeoutDefer) {
			fn.call(context);
		} else {
			return requestFn.call(window, bind(fn, context));
		}
	}

	// @function cancelAnimFrame(id: Number): undefined
	// Cancels a previous `requestAnimFrame`. See also [window.cancelAnimationFrame](https://developer.mozilla.org/docs/Web/API/window/cancelAnimationFrame).
	function cancelAnimFrame(id) {
		if (id) {
			cancelFn.call(window, id);
		}
	}

	var Util = ({
		extend: extend,
		create: create,
		bind: bind,
		lastId: lastId,
		stamp: stamp,
		throttle: throttle,
		wrapNum: wrapNum,
		falseFn: falseFn,
		formatNum: formatNum,
		trim: trim,
		splitWords: splitWords,
		setOptions: setOptions,
		getParamString: getParamString,
		template: template,
		isArray: isArray,
		indexOf: indexOf,
		emptyImageUrl: emptyImageUrl,
		requestFn: requestFn,
		cancelFn: cancelFn,
		requestAnimFrame: requestAnimFrame,
		cancelAnimFrame: cancelAnimFrame
	});

	// @class Class
	// @aka L.Class

	// @section
	// @uninheritable

	// Thanks to John Resig and Dean Edwards for inspiration!

	function Class() {}

	Class.extend = function (props) {

		// @function extend(props: Object): Function
		// [Extends the current class](#class-inheritance) given the properties to be included.
		// Returns a Javascript function that is a class constructor (to be called with `new`).
		var NewClass = function () {

			// call the constructor
			if (this.initialize) {
				this.initialize.apply(this, arguments);
			}

			// call all constructor hooks
			this.callInitHooks();
		};

		var parentProto = NewClass.__super__ = this.prototype;

		var proto = create(parentProto);
		proto.constructor = NewClass;

		NewClass.prototype = proto;

		// inherit parent's statics
		for (var i in this) {
			if (Object.prototype.hasOwnProperty.call(this, i) && i !== 'prototype' && i !== '__super__') {
				NewClass[i] = this[i];
			}
		}

		// mix static properties into the class
		if (props.statics) {
			extend(NewClass, props.statics);
			delete props.statics;
		}

		// mix includes into the prototype
		if (props.includes) {
			checkDeprecatedMixinEvents(props.includes);
			extend.apply(null, [proto].concat(props.includes));
			delete props.includes;
		}

		// merge options
		if (proto.options) {
			props.options = extend(create(proto.options), props.options);
		}

		// mix given properties into the prototype
		extend(proto, props);

		proto._initHooks = [];

		// add method for calling all hooks
		proto.callInitHooks = function () {

			if (this._initHooksCalled) { return; }

			if (parentProto.callInitHooks) {
				parentProto.callInitHooks.call(this);
			}

			this._initHooksCalled = true;

			for (var i = 0, len = proto._initHooks.length; i < len; i++) {
				proto._initHooks[i].call(this);
			}
		};

		return NewClass;
	};


	// @function include(properties: Object): this
	// [Includes a mixin](#class-includes) into the current class.
	Class.include = function (props) {
		extend(this.prototype, props);
		return this;
	};

	// @function mergeOptions(options: Object): this
	// [Merges `options`](#class-options) into the defaults of the class.
	Class.mergeOptions = function (options) {
		extend(this.prototype.options, options);
		return this;
	};

	// @function addInitHook(fn: Function): this
	// Adds a [constructor hook](#class-constructor-hooks) to the class.
	Class.addInitHook = function (fn) { // (Function) || (String, args...)
		var args = Array.prototype.slice.call(arguments, 1);

		var init = typeof fn === 'function' ? fn : function () {
			this[fn].apply(this, args);
		};

		this.prototype._initHooks = this.prototype._initHooks || [];
		this.prototype._initHooks.push(init);
		return this;
	};

	function checkDeprecatedMixinEvents(includes) {
		if (typeof L === 'undefined' || !L || !L.Mixin) { return; }

		includes = isArray(includes) ? includes : [includes];

		for (var i = 0; i < includes.length; i++) {
			if (includes[i] === L.Mixin.Events) {
				console.warn('Deprecated include of L.Mixin.Events: ' +
					'this property will be removed in future releases, ' +
					'please inherit from L.Evented instead.', new Error().stack);
			}
		}
	}

	/*
	 * @class Evented
	 * @aka L.Evented
	 * @inherits Class
	 *
	 * A set of methods shared between event-powered classes (like `Map` and `Marker`). Generally, events allow you to execute some function when something happens with an object (e.g. the user clicks on the map, causing the map to fire `'click'` event).
	 *
	 * @example
	 *
	 * ```js
	 * map.on('click', function(e) {
	 * 	alert(e.latlng);
	 * } );
	 * ```
	 *
	 * Leaflet deals with event listeners by reference, so if you want to add a listener and then remove it, define it as a function:
	 *
	 * ```js
	 * function onClick(e) { ... }
	 *
	 * map.on('click', onClick);
	 * map.off('click', onClick);
	 * ```
	 */

	var Events = {
		/* @method on(type: String, fn: Function, context?: Object): this
		 * Adds a listener function (`fn`) to a particular event type of the object. You can optionally specify the context of the listener (object the this keyword will point to). You can also pass several space-separated types (e.g. `'click dblclick'`).
		 *
		 * @alternative
		 * @method on(eventMap: Object): this
		 * Adds a set of type/listener pairs, e.g. `{click: onClick, mousemove: onMouseMove}`
		 */
		on: function (types, fn, context) {

			// types can be a map of types/handlers
			if (typeof types === 'object') {
				for (var type in types) {
					// we don't process space-separated events here for performance;
					// it's a hot path since Layer uses the on(obj) syntax
					this._on(type, types[type], fn);
				}

			} else {
				// types can be a string of space-separated words
				types = splitWords(types);

				for (var i = 0, len = types.length; i < len; i++) {
					this._on(types[i], fn, context);
				}
			}

			return this;
		},

		/* @method off(type: String, fn?: Function, context?: Object): this
		 * Removes a previously added listener function. If no function is specified, it will remove all the listeners of that particular event from the object. Note that if you passed a custom context to `on`, you must pass the same context to `off` in order to remove the listener.
		 *
		 * @alternative
		 * @method off(eventMap: Object): this
		 * Removes a set of type/listener pairs.
		 *
		 * @alternative
		 * @method off: this
		 * Removes all listeners to all events on the object. This includes implicitly attached events.
		 */
		off: function (types, fn, context) {

			if (!types) {
				// clear all listeners if called without arguments
				delete this._events;

			} else if (typeof types === 'object') {
				for (var type in types) {
					this._off(type, types[type], fn);
				}

			} else {
				types = splitWords(types);

				for (var i = 0, len = types.length; i < len; i++) {
					this._off(types[i], fn, context);
				}
			}

			return this;
		},

		// attach listener (without syntactic sugar now)
		_on: function (type, fn, context) {
			this._events = this._events || {};

			/* get/init listeners for type */
			var typeListeners = this._events[type];
			if (!typeListeners) {
				typeListeners = [];
				this._events[type] = typeListeners;
			}

			if (context === this) {
				// Less memory footprint.
				context = undefined;
			}
			var newListener = {fn: fn, ctx: context},
					listeners = typeListeners;

			// check if fn already there
			for (var i = 0, len = listeners.length; i < len; i++) {
				if (listeners[i].fn === fn && listeners[i].ctx === context) {
					return;
				}
			}

			listeners.push(newListener);
		},

		_off: function (type, fn, context) {
			var listeners,
					i,
					len;

			if (!this._events) { return; }

			listeners = this._events[type];

			if (!listeners) {
				return;
			}

			if (!fn) {
				// Set all removed listeners to noop so they are not called if remove happens in fire
				for (i = 0, len = listeners.length; i < len; i++) {
					listeners[i].fn = falseFn;
				}
				// clear all listeners for a type if function isn't specified
				delete this._events[type];
				return;
			}

			if (context === this) {
				context = undefined;
			}

			if (listeners) {

				// find fn and remove it
				for (i = 0, len = listeners.length; i < len; i++) {
					var l = listeners[i];
					if (l.ctx !== context) { continue; }
					if (l.fn === fn) {

						// set the removed listener to noop so that's not called if remove happens in fire
						l.fn = falseFn;

						if (this._firingCount) {
							/* copy array in case events are being fired */
							this._events[type] = listeners = listeners.slice();
						}
						listeners.splice(i, 1);

						return;
					}
				}
			}
		},

		// @method fire(type: String, data?: Object, propagate?: Boolean): this
		// Fires an event of the specified type. You can optionally provide an data
		// object — the first argument of the listener function will contain its
		// properties. The event can optionally be propagated to event parents.
		fire: function (type, data, propagate) {
			if (!this.listens(type, propagate)) { return this; }

			var event = extend({}, data, {
				type: type,
				target: this,
				sourceTarget: data && data.sourceTarget || this
			});

			if (this._events) {
				var listeners = this._events[type];

				if (listeners) {
					this._firingCount = (this._firingCount + 1) || 1;
					for (var i = 0, len = listeners.length; i < len; i++) {
						var l = listeners[i];
						l.fn.call(l.ctx || this, event);
					}

					this._firingCount--;
				}
			}

			if (propagate) {
				// propagate the event to parents (set with addEventParent)
				this._propagateEvent(event);
			}

			return this;
		},

		// @method listens(type: String): Boolean
		// Returns `true` if a particular event type has any listeners attached to it.
		listens: function (type, propagate) {
			var listeners = this._events && this._events[type];
			if (listeners && listeners.length) { return true; }

			if (propagate) {
				// also check parents for listeners if event propagates
				for (var id in this._eventParents) {
					if (this._eventParents[id].listens(type, propagate)) { return true; }
				}
			}
			return false;
		},

		// @method once(…): this
		// Behaves as [`on(…)`](#evented-on), except the listener will only get fired once and then removed.
		once: function (types, fn, context) {

			if (typeof types === 'object') {
				for (var type in types) {
					this.once(type, types[type], fn);
				}
				return this;
			}

			var handler = bind(function () {
				this
						.off(types, fn, context)
						.off(types, handler, context);
			}, this);

			// add a listener that's executed once and removed after that
			return this
					.on(types, fn, context)
					.on(types, handler, context);
		},

		// @method addEventParent(obj: Evented): this
		// Adds an event parent - an `Evented` that will receive propagated events
		addEventParent: function (obj) {
			this._eventParents = this._eventParents || {};
			this._eventParents[stamp(obj)] = obj;
			return this;
		},

		// @method removeEventParent(obj: Evented): this
		// Removes an event parent, so it will stop receiving propagated events
		removeEventParent: function (obj) {
			if (this._eventParents) {
				delete this._eventParents[stamp(obj)];
			}
			return this;
		},

		_propagateEvent: function (e) {
			for (var id in this._eventParents) {
				this._eventParents[id].fire(e.type, extend({
					layer: e.target,
					propagatedFrom: e.target
				}, e), true);
			}
		}
	};

	// aliases; we should ditch those eventually

	// @method addEventListener(…): this
	// Alias to [`on(…)`](#evented-on)
	Events.addEventListener = Events.on;

	// @method removeEventListener(…): this
	// Alias to [`off(…)`](#evented-off)

	// @method clearAllEventListeners(…): this
	// Alias to [`off()`](#evented-off)
	Events.removeEventListener = Events.clearAllEventListeners = Events.off;

	// @method addOneTimeEventListener(…): this
	// Alias to [`once(…)`](#evented-once)
	Events.addOneTimeEventListener = Events.once;

	// @method fireEvent(…): this
	// Alias to [`fire(…)`](#evented-fire)
	Events.fireEvent = Events.fire;

	// @method hasEventListeners(…): Boolean
	// Alias to [`listens(…)`](#evented-listens)
	Events.hasEventListeners = Events.listens;

	var Evented = Class.extend(Events);

	/*
	 * @class Point
	 * @aka L.Point
	 *
	 * Represents a point with `x` and `y` coordinates in pixels.
	 *
	 * @example
	 *
	 * ```js
	 * var point = L.point(200, 300);
	 * ```
	 *
	 * All Leaflet methods and options that accept `Point` objects also accept them in a simple Array form (unless noted otherwise), so these lines are equivalent:
	 *
	 * ```js
	 * map.panBy([200, 300]);
	 * map.panBy(L.point(200, 300));
	 * ```
	 *
	 * Note that `Point` does not inherit from Leaflet's `Class` object,
	 * which means new classes can't inherit from it, and new methods
	 * can't be added to it with the `include` function.
	 */

	function Point(x, y, round) {
		// @property x: Number; The `x` coordinate of the point
		this.x = (round ? Math.round(x) : x);
		// @property y: Number; The `y` coordinate of the point
		this.y = (round ? Math.round(y) : y);
	}

	var trunc = Math.trunc || function (v) {
		return v > 0 ? Math.floor(v) : Math.ceil(v);
	};

	Point.prototype = {

		// @method clone(): Point
		// Returns a copy of the current point.
		clone: function () {
			return new Point(this.x, this.y);
		},

		// @method add(otherPoint: Point): Point
		// Returns the result of addition of the current and the given points.
		add: function (point) {
			// non-destructive, returns a new point
			return this.clone()._add(toPoint(point));
		},

		_add: function (point) {
			// destructive, used directly for performance in situations where it's safe to modify existing point
			this.x += point.x;
			this.y += point.y;
			return this;
		},

		// @method subtract(otherPoint: Point): Point
		// Returns the result of subtraction of the given point from the current.
		subtract: function (point) {
			return this.clone()._subtract(toPoint(point));
		},

		_subtract: function (point) {
			this.x -= point.x;
			this.y -= point.y;
			return this;
		},

		// @method divideBy(num: Number): Point
		// Returns the result of division of the current point by the given number.
		divideBy: function (num) {
			return this.clone()._divideBy(num);
		},

		_divideBy: function (num) {
			this.x /= num;
			this.y /= num;
			return this;
		},

		// @method multiplyBy(num: Number): Point
		// Returns the result of multiplication of the current point by the given number.
		multiplyBy: function (num) {
			return this.clone()._multiplyBy(num);
		},

		_multiplyBy: function (num) {
			this.x *= num;
			this.y *= num;
			return this;
		},

		// @method scaleBy(scale: Point): Point
		// Multiply each coordinate of the current point by each coordinate of
		// `scale`. In linear algebra terms, multiply the point by the
		// [scaling matrix](https://en.wikipedia.org/wiki/Scaling_%28geometry%29#Matrix_representation)
		// defined by `scale`.
		scaleBy: function (point) {
			return new Point(this.x * point.x, this.y * point.y);
		},

		// @method unscaleBy(scale: Point): Point
		// Inverse of `scaleBy`. Divide each coordinate of the current point by
		// each coordinate of `scale`.
		unscaleBy: function (point) {
			return new Point(this.x / point.x, this.y / point.y);
		},

		// @method round(): Point
		// Returns a copy of the current point with rounded coordinates.
		round: function () {
			return this.clone()._round();
		},

		_round: function () {
			this.x = Math.round(this.x);
			this.y = Math.round(this.y);
			return this;
		},

		// @method floor(): Point
		// Returns a copy of the current point with floored coordinates (rounded down).
		floor: function () {
			return this.clone()._floor();
		},

		_floor: function () {
			this.x = Math.floor(this.x);
			this.y = Math.floor(this.y);
			return this;
		},

		// @method ceil(): Point
		// Returns a copy of the current point with ceiled coordinates (rounded up).
		ceil: function () {
			return this.clone()._ceil();
		},

		_ceil: function () {
			this.x = Math.ceil(this.x);
			this.y = Math.ceil(this.y);
			return this;
		},

		// @method trunc(): Point
		// Returns a copy of the current point with truncated coordinates (rounded towards zero).
		trunc: function () {
			return this.clone()._trunc();
		},

		_trunc: function () {
			this.x = trunc(this.x);
			this.y = trunc(this.y);
			return this;
		},

		// @method distanceTo(otherPoint: Point): Number
		// Returns the cartesian distance between the current and the given points.
		distanceTo: function (point) {
			point = toPoint(point);

			var x = point.x - this.x,
					y = point.y - this.y;

			return Math.sqrt(x * x + y * y);
		},

		// @method equals(otherPoint: Point): Boolean
		// Returns `true` if the given point has the same coordinates.
		equals: function (point) {
			point = toPoint(point);

			return point.x === this.x &&
						 point.y === this.y;
		},

		// @method contains(otherPoint: Point): Boolean
		// Returns `true` if both coordinates of the given point are less than the corresponding current point coordinates (in absolute values).
		contains: function (point) {
			point = toPoint(point);

			return Math.abs(point.x) <= Math.abs(this.x) &&
						 Math.abs(point.y) <= Math.abs(this.y);
		},

		// @method toString(): String
		// Returns a string representation of the point for debugging purposes.
		toString: function () {
			return 'Point(' +
							formatNum(this.x) + ', ' +
							formatNum(this.y) + ')';
		}
	};

	// @factory L.point(x: Number, y: Number, round?: Boolean)
	// Creates a Point object with the given `x` and `y` coordinates. If optional `round` is set to true, rounds the `x` and `y` values.

	// @alternative
	// @factory L.point(coords: Number[])
	// Expects an array of the form `[x, y]` instead.

	// @alternative
	// @factory L.point(coords: Object)
	// Expects a plain object of the form `{x: Number, y: Number}` instead.
	function toPoint(x, y, round) {
		if (x instanceof Point) {
			return x;
		}
		if (isArray(x)) {
			return new Point(x[0], x[1]);
		}
		if (x === undefined || x === null) {
			return x;
		}
		if (typeof x === 'object' && 'x' in x && 'y' in x) {
			return new Point(x.x, x.y);
		}
		return new Point(x, y, round);
	}

	/*
	 * @class Bounds
	 * @aka L.Bounds
	 *
	 * Represents a rectangular area in pixel coordinates.
	 *
	 * @example
	 *
	 * ```js
	 * var p1 = L.point(10, 10),
	 * p2 = L.point(40, 60),
	 * bounds = L.bounds(p1, p2);
	 * ```
	 *
	 * All Leaflet methods that accept `Bounds` objects also accept them in a simple Array form (unless noted otherwise), so the bounds example above can be passed like this:
	 *
	 * ```js
	 * otherBounds.intersects([[10, 10], [40, 60]]);
	 * ```
	 *
	 * Note that `Bounds` does not inherit from Leaflet's `Class` object,
	 * which means new classes can't inherit from it, and new methods
	 * can't be added to it with the `include` function.
	 */

	function Bounds(a, b) {
		if (!a) { return; }

		var points = b ? [a, b] : a;

		for (var i = 0, len = points.length; i < len; i++) {
			this.extend(points[i]);
		}
	}

	Bounds.prototype = {
		// @method extend(point: Point): this
		// Extends the bounds to contain the given point.
		extend: function (point) { // (Point)
			point = toPoint(point);

			// @property min: Point
			// The top left corner of the rectangle.
			// @property max: Point
			// The bottom right corner of the rectangle.
			if (!this.min && !this.max) {
				this.min = point.clone();
				this.max = point.clone();
			} else {
				this.min.x = Math.min(point.x, this.min.x);
				this.max.x = Math.max(point.x, this.max.x);
				this.min.y = Math.min(point.y, this.min.y);
				this.max.y = Math.max(point.y, this.max.y);
			}
			return this;
		},

		// @method getCenter(round?: Boolean): Point
		// Returns the center point of the bounds.
		getCenter: function (round) {
			return new Point(
							(this.min.x + this.max.x) / 2,
							(this.min.y + this.max.y) / 2, round);
		},

		// @method getBottomLeft(): Point
		// Returns the bottom-left point of the bounds.
		getBottomLeft: function () {
			return new Point(this.min.x, this.max.y);
		},

		// @method getTopRight(): Point
		// Returns the top-right point of the bounds.
		getTopRight: function () { // -> Point
			return new Point(this.max.x, this.min.y);
		},

		// @method getTopLeft(): Point
		// Returns the top-left point of the bounds (i.e. [`this.min`](#bounds-min)).
		getTopLeft: function () {
			return this.min; // left, top
		},

		// @method getBottomRight(): Point
		// Returns the bottom-right point of the bounds (i.e. [`this.max`](#bounds-max)).
		getBottomRight: function () {
			return this.max; // right, bottom
		},

		// @method getSize(): Point
		// Returns the size of the given bounds
		getSize: function () {
			return this.max.subtract(this.min);
		},

		// @method contains(otherBounds: Bounds): Boolean
		// Returns `true` if the rectangle contains the given one.
		// @alternative
		// @method contains(point: Point): Boolean
		// Returns `true` if the rectangle contains the given point.
		contains: function (obj) {
			var min, max;

			if (typeof obj[0] === 'number' || obj instanceof Point) {
				obj = toPoint(obj);
			} else {
				obj = toBounds(obj);
			}

			if (obj instanceof Bounds) {
				min = obj.min;
				max = obj.max;
			} else {
				min = max = obj;
			}

			return (min.x >= this.min.x) &&
						 (max.x <= this.max.x) &&
						 (min.y >= this.min.y) &&
						 (max.y <= this.max.y);
		},

		// @method intersects(otherBounds: Bounds): Boolean
		// Returns `true` if the rectangle intersects the given bounds. Two bounds
		// intersect if they have at least one point in common.
		intersects: function (bounds) { // (Bounds) -> Boolean
			bounds = toBounds(bounds);

			var min = this.min,
					max = this.max,
					min2 = bounds.min,
					max2 = bounds.max,
					xIntersects = (max2.x >= min.x) && (min2.x <= max.x),
					yIntersects = (max2.y >= min.y) && (min2.y <= max.y);

			return xIntersects && yIntersects;
		},

		// @method overlaps(otherBounds: Bounds): Boolean
		// Returns `true` if the rectangle overlaps the given bounds. Two bounds
		// overlap if their intersection is an area.
		overlaps: function (bounds) { // (Bounds) -> Boolean
			bounds = toBounds(bounds);

			var min = this.min,
					max = this.max,
					min2 = bounds.min,
					max2 = bounds.max,
					xOverlaps = (max2.x > min.x) && (min2.x < max.x),
					yOverlaps = (max2.y > min.y) && (min2.y < max.y);

			return xOverlaps && yOverlaps;
		},

		isValid: function () {
			return !!(this.min && this.max);
		}
	};


	// @factory L.bounds(corner1: Point, corner2: Point)
	// Creates a Bounds object from two corners coordinate pairs.
	// @alternative
	// @factory L.bounds(points: Point[])
	// Creates a Bounds object from the given array of points.
	function toBounds(a, b) {
		if (!a || a instanceof Bounds) {
			return a;
		}
		return new Bounds(a, b);
	}

	/*
	 * @class LatLngBounds
	 * @aka L.LatLngBounds
	 *
	 * Represents a rectangular geographical area on a map.
	 *
	 * @example
	 *
	 * ```js
	 * var corner1 = L.latLng(40.712, -74.227),
	 * corner2 = L.latLng(40.774, -74.125),
	 * bounds = L.latLngBounds(corner1, corner2);
	 * ```
	 *
	 * All Leaflet methods that accept LatLngBounds objects also accept them in a simple Array form (unless noted otherwise), so the bounds example above can be passed like this:
	 *
	 * ```js
	 * map.fitBounds([
	 * 	[40.712, -74.227],
	 * 	[40.774, -74.125]
	 * ]);
	 * ```
	 *
	 * Caution: if the area crosses the antimeridian (often confused with the International Date Line), you must specify corners _outside_ the [-180, 180] degrees longitude range.
	 *
	 * Note that `LatLngBounds` does not inherit from Leaflet's `Class` object,
	 * which means new classes can't inherit from it, and new methods
	 * can't be added to it with the `include` function.
	 */

	function LatLngBounds(corner1, corner2) { // (LatLng, LatLng) or (LatLng[])
		if (!corner1) { return; }

		var latlngs = corner2 ? [corner1, corner2] : corner1;

		for (var i = 0, len = latlngs.length; i < len; i++) {
			this.extend(latlngs[i]);
		}
	}

	LatLngBounds.prototype = {

		// @method extend(latlng: LatLng): this
		// Extend the bounds to contain the given point

		// @alternative
		// @method extend(otherBounds: LatLngBounds): this
		// Extend the bounds to contain the given bounds
		extend: function (obj) {
			var sw = this._southWest,
					ne = this._northEast,
					sw2, ne2;

			if (obj instanceof LatLng) {
				sw2 = obj;
				ne2 = obj;

			} else if (obj instanceof LatLngBounds) {
				sw2 = obj._southWest;
				ne2 = obj._northEast;

				if (!sw2 || !ne2) { return this; }

			} else {
				return obj ? this.extend(toLatLng(obj) || toLatLngBounds(obj)) : this;
			}

			if (!sw && !ne) {
				this._southWest = new LatLng(sw2.lat, sw2.lng);
				this._northEast = new LatLng(ne2.lat, ne2.lng);
			} else {
				sw.lat = Math.min(sw2.lat, sw.lat);
				sw.lng = Math.min(sw2.lng, sw.lng);
				ne.lat = Math.max(ne2.lat, ne.lat);
				ne.lng = Math.max(ne2.lng, ne.lng);
			}

			return this;
		},

		// @method pad(bufferRatio: Number): LatLngBounds
		// Returns bounds created by extending or retracting the current bounds by a given ratio in each direction.
		// For example, a ratio of 0.5 extends the bounds by 50% in each direction.
		// Negative values will retract the bounds.
		pad: function (bufferRatio) {
			var sw = this._southWest,
					ne = this._northEast,
					heightBuffer = Math.abs(sw.lat - ne.lat) * bufferRatio,
					widthBuffer = Math.abs(sw.lng - ne.lng) * bufferRatio;

			return new LatLngBounds(
							new LatLng(sw.lat - heightBuffer, sw.lng - widthBuffer),
							new LatLng(ne.lat + heightBuffer, ne.lng + widthBuffer));
		},

		// @method getCenter(): LatLng
		// Returns the center point of the bounds.
		getCenter: function () {
			return new LatLng(
							(this._southWest.lat + this._northEast.lat) / 2,
							(this._southWest.lng + this._northEast.lng) / 2);
		},

		// @method getSouthWest(): LatLng
		// Returns the south-west point of the bounds.
		getSouthWest: function () {
			return this._southWest;
		},

		// @method getNorthEast(): LatLng
		// Returns the north-east point of the bounds.
		getNorthEast: function () {
			return this._northEast;
		},

		// @method getNorthWest(): LatLng
		// Returns the north-west point of the bounds.
		getNorthWest: function () {
			return new LatLng(this.getNorth(), this.getWest());
		},

		// @method getSouthEast(): LatLng
		// Returns the south-east point of the bounds.
		getSouthEast: function () {
			return new LatLng(this.getSouth(), this.getEast());
		},

		// @method getWest(): Number
		// Returns the west longitude of the bounds
		getWest: function () {
			return this._southWest.lng;
		},

		// @method getSouth(): Number
		// Returns the south latitude of the bounds
		getSouth: function () {
			return this._southWest.lat;
		},

		// @method getEast(): Number
		// Returns the east longitude of the bounds
		getEast: function () {
			return this._northEast.lng;
		},

		// @method getNorth(): Number
		// Returns the north latitude of the bounds
		getNorth: function () {
			return this._northEast.lat;
		},

		// @method contains(otherBounds: LatLngBounds): Boolean
		// Returns `true` if the rectangle contains the given one.

		// @alternative
		// @method contains (latlng: LatLng): Boolean
		// Returns `true` if the rectangle contains the given point.
		contains: function (obj) { // (LatLngBounds) or (LatLng) -> Boolean
			if (typeof obj[0] === 'number' || obj instanceof LatLng || 'lat' in obj) {
				obj = toLatLng(obj);
			} else {
				obj = toLatLngBounds(obj);
			}

			var sw = this._southWest,
					ne = this._northEast,
					sw2, ne2;

			if (obj instanceof LatLngBounds) {
				sw2 = obj.getSouthWest();
				ne2 = obj.getNorthEast();
			} else {
				sw2 = ne2 = obj;
			}

			return (sw2.lat >= sw.lat) && (ne2.lat <= ne.lat) &&
						 (sw2.lng >= sw.lng) && (ne2.lng <= ne.lng);
		},

		// @method intersects(otherBounds: LatLngBounds): Boolean
		// Returns `true` if the rectangle intersects the given bounds. Two bounds intersect if they have at least one point in common.
		intersects: function (bounds) {
			bounds = toLatLngBounds(bounds);

			var sw = this._southWest,
					ne = this._northEast,
					sw2 = bounds.getSouthWest(),
					ne2 = bounds.getNorthEast(),

					latIntersects = (ne2.lat >= sw.lat) && (sw2.lat <= ne.lat),
					lngIntersects = (ne2.lng >= sw.lng) && (sw2.lng <= ne.lng);

			return latIntersects && lngIntersects;
		},

		// @method overlaps(otherBounds: LatLngBounds): Boolean
		// Returns `true` if the rectangle overlaps the given bounds. Two bounds overlap if their intersection is an area.
		overlaps: function (bounds) {
			bounds = toLatLngBounds(bounds);

			var sw = this._southWest,
					ne = this._northEast,
					sw2 = bounds.getSouthWest(),
					ne2 = bounds.getNorthEast(),

					latOverlaps = (ne2.lat > sw.lat) && (sw2.lat < ne.lat),
					lngOverlaps = (ne2.lng > sw.lng) && (sw2.lng < ne.lng);

			return latOverlaps && lngOverlaps;
		},

		// @method toBBoxString(): String
		// Returns a string with bounding box coordinates in a 'southwest_lng,southwest_lat,northeast_lng,northeast_lat' format. Useful for sending requests to web services that return geo data.
		toBBoxString: function () {
			return [this.getWest(), this.getSouth(), this.getEast(), this.getNorth()].join(',');
		},

		// @method equals(otherBounds: LatLngBounds, maxMargin?: Number): Boolean
		// Returns `true` if the rectangle is equivalent (within a small margin of error) to the given bounds. The margin of error can be overridden by setting `maxMargin` to a small number.
		equals: function (bounds, maxMargin) {
			if (!bounds) { return false; }

			bounds = toLatLngBounds(bounds);

			return this._southWest.equals(bounds.getSouthWest(), maxMargin) &&
						 this._northEast.equals(bounds.getNorthEast(), maxMargin);
		},

		// @method isValid(): Boolean
		// Returns `true` if the bounds are properly initialized.
		isValid: function () {
			return !!(this._southWest && this._northEast);
		}
	};

	// TODO International date line?

	// @factory L.latLngBounds(corner1: LatLng, corner2: LatLng)
	// Creates a `LatLngBounds` object by defining two diagonally opposite corners of the rectangle.

	// @alternative
	// @factory L.latLngBounds(latlngs: LatLng[])
	// Creates a `LatLngBounds` object defined by the geographical points it contains. Very useful for zooming the map to fit a particular set of locations with [`fitBounds`](#map-fitbounds).
	function toLatLngBounds(a, b) {
		if (a instanceof LatLngBounds) {
			return a;
		}
		return new LatLngBounds(a, b);
	}

	/* @class LatLng
	 * @aka L.LatLng
	 *
	 * Represents a geographical point with a certain latitude and longitude.
	 *
	 * @example
	 *
	 * ```
	 * var latlng = L.latLng(50.5, 30.5);
	 * ```
	 *
	 * All Leaflet methods that accept LatLng objects also accept them in a simple Array form and simple object form (unless noted otherwise), so these lines are equivalent:
	 *
	 * ```
	 * map.panTo([50, 30]);
	 * map.panTo({lon: 30, lat: 50});
	 * map.panTo({lat: 50, lng: 30});
	 * map.panTo(L.latLng(50, 30));
	 * ```
	 *
	 * Note that `LatLng` does not inherit from Leaflet's `Class` object,
	 * which means new classes can't inherit from it, and new methods
	 * can't be added to it with the `include` function.
	 */

	function LatLng(lat, lng, alt) {
		if (isNaN(lat) || isNaN(lng)) {
			throw new Error('Invalid LatLng object: (' + lat + ', ' + lng + ')');
		}

		// @property lat: Number
		// Latitude in degrees
		this.lat = +lat;

		// @property lng: Number
		// Longitude in degrees
		this.lng = +lng;

		// @property alt: Number
		// Altitude in meters (optional)
		if (alt !== undefined) {
			this.alt = +alt;
		}
	}

	LatLng.prototype = {
		// @method equals(otherLatLng: LatLng, maxMargin?: Number): Boolean
		// Returns `true` if the given `LatLng` point is at the same position (within a small margin of error). The margin of error can be overridden by setting `maxMargin` to a small number.
		equals: function (obj, maxMargin) {
			if (!obj) { return false; }

			obj = toLatLng(obj);

			var margin = Math.max(
							Math.abs(this.lat - obj.lat),
							Math.abs(this.lng - obj.lng));

			return margin <= (maxMargin === undefined ? 1.0E-9 : maxMargin);
		},

		// @method toString(): String
		// Returns a string representation of the point (for debugging purposes).
		toString: function (precision) {
			return 'LatLng(' +
							formatNum(this.lat, precision) + ', ' +
							formatNum(this.lng, precision) + ')';
		},

		// @method distanceTo(otherLatLng: LatLng): Number
		// Returns the distance (in meters) to the given `LatLng` calculated using the [Spherical Law of Cosines](https://en.wikipedia.org/wiki/Spherical_law_of_cosines).
		distanceTo: function (other) {
			return Earth.distance(this, toLatLng(other));
		},

		// @method wrap(): LatLng
		// Returns a new `LatLng` object with the longitude wrapped so it's always between -180 and +180 degrees.
		wrap: function () {
			return Earth.wrapLatLng(this);
		},

		// @method toBounds(sizeInMeters: Number): LatLngBounds
		// Returns a new `LatLngBounds` object in which each boundary is `sizeInMeters/2` meters apart from the `LatLng`.
		toBounds: function (sizeInMeters) {
			var latAccuracy = 180 * sizeInMeters / 40075017,
					lngAccuracy = latAccuracy / Math.cos((Math.PI / 180) * this.lat);

			return toLatLngBounds(
							[this.lat - latAccuracy, this.lng - lngAccuracy],
							[this.lat + latAccuracy, this.lng + lngAccuracy]);
		},

		clone: function () {
			return new LatLng(this.lat, this.lng, this.alt);
		}
	};



	// @factory L.latLng(latitude: Number, longitude: Number, altitude?: Number): LatLng
	// Creates an object representing a geographical point with the given latitude and longitude (and optionally altitude).

	// @alternative
	// @factory L.latLng(coords: Array): LatLng
	// Expects an array of the form `[Number, Number]` or `[Number, Number, Number]` instead.

	// @alternative
	// @factory L.latLng(coords: Object): LatLng
	// Expects an plain object of the form `{lat: Number, lng: Number}` or `{lat: Number, lng: Number, alt: Number}` instead.

	function toLatLng(a, b, c) {
		if (a instanceof LatLng) {
			return a;
		}
		if (isArray(a) && typeof a[0] !== 'object') {
			if (a.length === 3) {
				return new LatLng(a[0], a[1], a[2]);
			}
			if (a.length === 2) {
				return new LatLng(a[0], a[1]);
			}
			return null;
		}
		if (a === undefined || a === null) {
			return a;
		}
		if (typeof a === 'object' && 'lat' in a) {
			return new LatLng(a.lat, 'lng' in a ? a.lng : a.lon, a.alt);
		}
		if (b === undefined) {
			return null;
		}
		return new LatLng(a, b, c);
	}

	/*
	 * @namespace CRS
	 * @crs L.CRS.Base
	 * Object that defines coordinate reference systems for projecting
	 * geographical points into pixel (screen) coordinates and back (and to
	 * coordinates in other units for [WMS](https://en.wikipedia.org/wiki/Web_Map_Service) services). See
	 * [spatial reference system](http://en.wikipedia.org/wiki/Coordinate_reference_system).
	 *
	 * Leaflet defines the most usual CRSs by default. If you want to use a
	 * CRS not defined by default, take a look at the
	 * [Proj4Leaflet](https://github.com/kartena/Proj4Leaflet) plugin.
	 *
	 * Note that the CRS instances do not inherit from Leaflet's `Class` object,
	 * and can't be instantiated. Also, new classes can't inherit from them,
	 * and methods can't be added to them with the `include` function.
	 */

	var CRS = {
		// @method latLngToPoint(latlng: LatLng, zoom: Number): Point
		// Projects geographical coordinates into pixel coordinates for a given zoom.
		latLngToPoint: function (latlng, zoom) {
			var projectedPoint = this.projection.project(latlng),
					scale = this.scale(zoom);

			return this.transformation._transform(projectedPoint, scale);
		},

		// @method pointToLatLng(point: Point, zoom: Number): LatLng
		// The inverse of `latLngToPoint`. Projects pixel coordinates on a given
		// zoom into geographical coordinates.
		pointToLatLng: function (point, zoom) {
			var scale = this.scale(zoom),
					untransformedPoint = this.transformation.untransform(point, scale);

			return this.projection.unproject(untransformedPoint);
		},

		// @method project(latlng: LatLng): Point
		// Projects geographical coordinates into coordinates in units accepted for
		// this CRS (e.g. meters for EPSG:3857, for passing it to WMS services).
		project: function (latlng) {
			return this.projection.project(latlng);
		},

		// @method unproject(point: Point): LatLng
		// Given a projected coordinate returns the corresponding LatLng.
		// The inverse of `project`.
		unproject: function (point) {
			return this.projection.unproject(point);
		},

		// @method scale(zoom: Number): Number
		// Returns the scale used when transforming projected coordinates into
		// pixel coordinates for a particular zoom. For example, it returns
		// `256 * 2^zoom` for Mercator-based CRS.
		scale: function (zoom) {
			return 256 * Math.pow(2, zoom);
		},

		// @method zoom(scale: Number): Number
		// Inverse of `scale()`, returns the zoom level corresponding to a scale
		// factor of `scale`.
		zoom: function (scale) {
			return Math.log(scale / 256) / Math.LN2;
		},

		// @method getProjectedBounds(zoom: Number): Bounds
		// Returns the projection's bounds scaled and transformed for the provided `zoom`.
		getProjectedBounds: function (zoom) {
			if (this.infinite) { return null; }

			var b = this.projection.bounds,
					s = this.scale(zoom),
					min = this.transformation.transform(b.min, s),
					max = this.transformation.transform(b.max, s);

			return new Bounds(min, max);
		},

		// @method distance(latlng1: LatLng, latlng2: LatLng): Number
		// Returns the distance between two geographical coordinates.

		// @property code: String
		// Standard code name of the CRS passed into WMS services (e.g. `'EPSG:3857'`)
		//
		// @property wrapLng: Number[]
		// An array of two numbers defining whether the longitude (horizontal) coordinate
		// axis wraps around a given range and how. Defaults to `[-180, 180]` in most
		// geographical CRSs. If `undefined`, the longitude axis does not wrap around.
		//
		// @property wrapLat: Number[]
		// Like `wrapLng`, but for the latitude (vertical) axis.

		// wrapLng: [min, max],
		// wrapLat: [min, max],

		// @property infinite: Boolean
		// If true, the coordinate space will be unbounded (infinite in both axes)
		infinite: false,

		// @method wrapLatLng(latlng: LatLng): LatLng
		// Returns a `LatLng` where lat and lng has been wrapped according to the
		// CRS's `wrapLat` and `wrapLng` properties, if they are outside the CRS's bounds.
		wrapLatLng: function (latlng) {
			var lng = this.wrapLng ? wrapNum(latlng.lng, this.wrapLng, true) : latlng.lng,
					lat = this.wrapLat ? wrapNum(latlng.lat, this.wrapLat, true) : latlng.lat,
					alt = latlng.alt;

			return new LatLng(lat, lng, alt);
		},

		// @method wrapLatLngBounds(bounds: LatLngBounds): LatLngBounds
		// Returns a `LatLngBounds` with the same size as the given one, ensuring
		// that its center is within the CRS's bounds.
		// Only accepts actual `L.LatLngBounds` instances, not arrays.
		wrapLatLngBounds: function (bounds) {
			var center = bounds.getCenter(),
					newCenter = this.wrapLatLng(center),
					latShift = center.lat - newCenter.lat,
					lngShift = center.lng - newCenter.lng;

			if (latShift === 0 && lngShift === 0) {
				return bounds;
			}

			var sw = bounds.getSouthWest(),
					ne = bounds.getNorthEast(),
					newSw = new LatLng(sw.lat - latShift, sw.lng - lngShift),
					newNe = new LatLng(ne.lat - latShift, ne.lng - lngShift);

			return new LatLngBounds(newSw, newNe);
		}
	};

	/*
	 * @namespace CRS
	 * @crs L.CRS.Earth
	 *
	 * Serves as the base for CRS that are global such that they cover the earth.
	 * Can only be used as the base for other CRS and cannot be used directly,
	 * since it does not have a `code`, `projection` or `transformation`. `distance()` returns
	 * meters.
	 */

	var Earth = extend({}, CRS, {
		wrapLng: [-180, 180],

		// Mean Earth Radius, as recommended for use by
		// the International Union of Geodesy and Geophysics,
		// see http://rosettacode.org/wiki/Haversine_formula
		R: 6371000,

		// distance between two geographical points using spherical law of cosines approximation
		distance: function (latlng1, latlng2) {
			var rad = Math.PI / 180,
					lat1 = latlng1.lat * rad,
					lat2 = latlng2.lat * rad,
					sinDLat = Math.sin((latlng2.lat - latlng1.lat) * rad / 2),
					sinDLon = Math.sin((latlng2.lng - latlng1.lng) * rad / 2),
					a = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon,
					c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
			return this.R * c;
		}
	});

	/*
	 * @namespace Projection
	 * @projection L.Projection.SphericalMercator
	 *
	 * Spherical Mercator projection — the most common projection for online maps,
	 * used by almost all free and commercial tile providers. Assumes that Earth is
	 * a sphere. Used by the `EPSG:3857` CRS.
	 */

	var earthRadius = 6378137;

	var SphericalMercator = {

		R: earthRadius,
		MAX_LATITUDE: 85.0511287798,

		project: function (latlng) {
			var d = Math.PI / 180,
					max = this.MAX_LATITUDE,
					lat = Math.max(Math.min(max, latlng.lat), -max),
					sin = Math.sin(lat * d);

			return new Point(
				this.R * latlng.lng * d,
				this.R * Math.log((1 + sin) / (1 - sin)) / 2);
		},

		unproject: function (point) {
			var d = 180 / Math.PI;

			return new LatLng(
				(2 * Math.atan(Math.exp(point.y / this.R)) - (Math.PI / 2)) * d,
				point.x * d / this.R);
		},

		bounds: (function () {
			var d = earthRadius * Math.PI;
			return new Bounds([-d, -d], [d, d]);
		})()
	};

	/*
	 * @class Transformation
	 * @aka L.Transformation
	 *
	 * Represents an affine transformation: a set of coefficients `a`, `b`, `c`, `d`
	 * for transforming a point of a form `(x, y)` into `(a*x + b, c*y + d)` and doing
	 * the reverse. Used by Leaflet in its projections code.
	 *
	 * @example
	 *
	 * ```js
	 * var transformation = L.transformation(2, 5, -1, 10),
	 * 	p = L.point(1, 2),
	 * 	p2 = transformation.transform(p), //  L.point(7, 8)
	 * 	p3 = transformation.untransform(p2); //  L.point(1, 2)
	 * ```
	 */


	// factory new L.Transformation(a: Number, b: Number, c: Number, d: Number)
	// Creates a `Transformation` object with the given coefficients.
	function Transformation(a, b, c, d) {
		if (isArray(a)) {
			// use array properties
			this._a = a[0];
			this._b = a[1];
			this._c = a[2];
			this._d = a[3];
			return;
		}
		this._a = a;
		this._b = b;
		this._c = c;
		this._d = d;
	}

	Transformation.prototype = {
		// @method transform(point: Point, scale?: Number): Point
		// Returns a transformed point, optionally multiplied by the given scale.
		// Only accepts actual `L.Point` instances, not arrays.
		transform: function (point, scale) { // (Point, Number) -> Point
			return this._transform(point.clone(), scale);
		},

		// destructive transform (faster)
		_transform: function (point, scale) {
			scale = scale || 1;
			point.x = scale * (this._a * point.x + this._b);
			point.y = scale * (this._c * point.y + this._d);
			return point;
		},

		// @method untransform(point: Point, scale?: Number): Point
		// Returns the reverse transformation of the given point, optionally divided
		// by the given scale. Only accepts actual `L.Point` instances, not arrays.
		untransform: function (point, scale) {
			scale = scale || 1;
			return new Point(
							(point.x / scale - this._b) / this._a,
							(point.y / scale - this._d) / this._c);
		}
	};

	// factory L.transformation(a: Number, b: Number, c: Number, d: Number)

	// @factory L.transformation(a: Number, b: Number, c: Number, d: Number)
	// Instantiates a Transformation object with the given coefficients.

	// @alternative
	// @factory L.transformation(coefficients: Array): Transformation
	// Expects an coefficients array of the form
	// `[a: Number, b: Number, c: Number, d: Number]`.

	function toTransformation(a, b, c, d) {
		return new Transformation(a, b, c, d);
	}

	/*
	 * @namespace CRS
	 * @crs L.CRS.EPSG3857
	 *
	 * The most common CRS for online maps, used by almost all free and commercial
	 * tile providers. Uses Spherical Mercator projection. Set in by default in
	 * Map's `crs` option.
	 */

	var EPSG3857 = extend({}, Earth, {
		code: 'EPSG:3857',
		projection: SphericalMercator,

		transformation: (function () {
			var scale = 0.5 / (Math.PI * SphericalMercator.R);
			return toTransformation(scale, 0.5, -scale, 0.5);
		}())
	});

	var EPSG900913 = extend({}, EPSG3857, {
		code: 'EPSG:900913'
	});

	// @namespace SVG; @section
	// There are several static functions which can be called without instantiating L.SVG:

	// @function create(name: String): SVGElement
	// Returns a instance of [SVGElement](https://developer.mozilla.org/docs/Web/API/SVGElement),
	// corresponding to the class name passed. For example, using 'line' will return
	// an instance of [SVGLineElement](https://developer.mozilla.org/docs/Web/API/SVGLineElement).
	function svgCreate(name) {
		return document.createElementNS('http://www.w3.org/2000/svg', name);
	}

	// @function pointsToPath(rings: Point[], closed: Boolean): String
	// Generates a SVG path string for multiple rings, with each ring turning
	// into "M..L..L.." instructions
	function pointsToPath(rings, closed) {
		var str = '',
		i, j, len, len2, points, p;

		for (i = 0, len = rings.length; i < len; i++) {
			points = rings[i];

			for (j = 0, len2 = points.length; j < len2; j++) {
				p = points[j];
				str += (j ? 'L' : 'M') + p.x + ' ' + p.y;
			}

			// closes the ring for polygons; "x" is VML syntax
			str += closed ? (svg ? 'z' : 'x') : '';
		}

		// SVG complains about empty path strings
		return str || 'M0 0';
	}

	/*
	 * @namespace Browser
	 * @aka L.Browser
	 *
	 * A namespace with static properties for browser/feature detection used by Leaflet internally.
	 *
	 * @example
	 *
	 * ```js
	 * if (L.Browser.ielt9) {
	 *   alert('Upgrade your browser, dude!');
	 * }
	 * ```
	 */

	var style$1 = document.documentElement.style;

	// @property ie: Boolean; `true` for all Internet Explorer versions (not Edge).
	var ie = 'ActiveXObject' in window;

	// @property ielt9: Boolean; `true` for Internet Explorer versions less than 9.
	var ielt9 = ie && !document.addEventListener;

	// @property edge: Boolean; `true` for the Edge web browser.
	var edge = 'msLaunchUri' in navigator && !('documentMode' in document);

	// @property webkit: Boolean;
	// `true` for webkit-based browsers like Chrome and Safari (including mobile versions).
	var webkit = userAgentContains('webkit');

	// @property android: Boolean
	// `true` for any browser running on an Android platform.
	var android = userAgentContains('android');

	// @property android23: Boolean; `true` for browsers running on Android 2 or Android 3.
	var android23 = userAgentContains('android 2') || userAgentContains('android 3');

	/* See https://stackoverflow.com/a/17961266 for details on detecting stock Android */
	var webkitVer = parseInt(/WebKit\/([0-9]+)|$/.exec(navigator.userAgent)[1], 10); // also matches AppleWebKit
	// @property androidStock: Boolean; `true` for the Android stock browser (i.e. not Chrome)
	var androidStock = android && userAgentContains('Google') && webkitVer < 537 && !('AudioNode' in window);

	// @property opera: Boolean; `true` for the Opera browser
	var opera = !!window.opera;

	// @property chrome: Boolean; `true` for the Chrome browser.
	var chrome = !edge && userAgentContains('chrome');

	// @property gecko: Boolean; `true` for gecko-based browsers like Firefox.
	var gecko = userAgentContains('gecko') && !webkit && !opera && !ie;

	// @property safari: Boolean; `true` for the Safari browser.
	var safari = !chrome && userAgentContains('safari');

	var phantom = userAgentContains('phantom');

	// @property opera12: Boolean
	// `true` for the Opera browser supporting CSS transforms (version 12 or later).
	var opera12 = 'OTransition' in style$1;

	// @property win: Boolean; `true` when the browser is running in a Windows platform
	var win = navigator.platform.indexOf('Win') === 0;

	// @property ie3d: Boolean; `true` for all Internet Explorer versions supporting CSS transforms.
	var ie3d = ie && ('transition' in style$1);

	// @property webkit3d: Boolean; `true` for webkit-based browsers supporting CSS transforms.
	var webkit3d = ('WebKitCSSMatrix' in window) && ('m11' in new window.WebKitCSSMatrix()) && !android23;

	// @property gecko3d: Boolean; `true` for gecko-based browsers supporting CSS transforms.
	var gecko3d = 'MozPerspective' in style$1;

	// @property any3d: Boolean
	// `true` for all browsers supporting CSS transforms.
	var any3d = !window.L_DISABLE_3D && (ie3d || webkit3d || gecko3d) && !opera12 && !phantom;

	// @property mobile: Boolean; `true` for all browsers running in a mobile device.
	var mobile = typeof orientation !== 'undefined' || userAgentContains('mobile');

	// @property mobileWebkit: Boolean; `true` for all webkit-based browsers in a mobile device.
	var mobileWebkit = mobile && webkit;

	// @property mobileWebkit3d: Boolean
	// `true` for all webkit-based browsers in a mobile device supporting CSS transforms.
	var mobileWebkit3d = mobile && webkit3d;

	// @property msPointer: Boolean
	// `true` for browsers implementing the Microsoft touch events model (notably IE10).
	var msPointer = !window.PointerEvent && window.MSPointerEvent;

	// @property pointer: Boolean
	// `true` for all browsers supporting [pointer events](https://msdn.microsoft.com/en-us/library/dn433244%28v=vs.85%29.aspx).
	var pointer = !!(window.PointerEvent || msPointer);

	// @property touch: Boolean
	// `true` for all browsers supporting [touch events](https://developer.mozilla.org/docs/Web/API/Touch_events).
	// This does not necessarily mean that the browser is running in a computer with
	// a touchscreen, it only means that the browser is capable of understanding
	// touch events.
	var touch = !window.L_NO_TOUCH && (pointer || 'ontouchstart' in window ||
			(window.DocumentTouch && document instanceof window.DocumentTouch));

	// @property mobileOpera: Boolean; `true` for the Opera browser in a mobile device.
	var mobileOpera = mobile && opera;

	// @property mobileGecko: Boolean
	// `true` for gecko-based browsers running in a mobile device.
	var mobileGecko = mobile && gecko;

	// @property retina: Boolean
	// `true` for browsers on a high-resolution "retina" screen or on any screen when browser's display zoom is more than 100%.
	var retina = (window.devicePixelRatio || (window.screen.deviceXDPI / window.screen.logicalXDPI)) > 1;

	// @property passiveEvents: Boolean
	// `true` for browsers that support passive events.
	var passiveEvents = (function () {
		var supportsPassiveOption = false;
		try {
			var opts = Object.defineProperty({}, 'passive', {
				get: function () { // eslint-disable-line getter-return
					supportsPassiveOption = true;
				}
			});
			window.addEventListener('testPassiveEventSupport', falseFn, opts);
			window.removeEventListener('testPassiveEventSupport', falseFn, opts);
		} catch (e) {
			// Errors can safely be ignored since this is only a browser support test.
		}
		return supportsPassiveOption;
	}());

	// @property canvas: Boolean
	// `true` when the browser supports [`<canvas>`](https://developer.mozilla.org/docs/Web/API/Canvas_API).
	var canvas = (function () {
		return !!document.createElement('canvas').getContext;
	}());

	// @property svg: Boolean
	// `true` when the browser supports [SVG](https://developer.mozilla.org/docs/Web/SVG).
	var svg = !!(document.createElementNS && svgCreate('svg').createSVGRect);

	// @property vml: Boolean
	// `true` if the browser supports [VML](https://en.wikipedia.org/wiki/Vector_Markup_Language).
	var vml = !svg && (function () {
		try {
			var div = document.createElement('div');
			div.innerHTML = '<v:shape adj="1"/>';

			var shape = div.firstChild;
			shape.style.behavior = 'url(#default#VML)';

			return shape && (typeof shape.adj === 'object');

		} catch (e) {
			return false;
		}
	}());


	function userAgentContains(str) {
		return navigator.userAgent.toLowerCase().indexOf(str) >= 0;
	}

	var Browser = ({
		ie: ie,
		ielt9: ielt9,
		edge: edge,
		webkit: webkit,
		android: android,
		android23: android23,
		androidStock: androidStock,
		opera: opera,
		chrome: chrome,
		gecko: gecko,
		safari: safari,
		phantom: phantom,
		opera12: opera12,
		win: win,
		ie3d: ie3d,
		webkit3d: webkit3d,
		gecko3d: gecko3d,
		any3d: any3d,
		mobile: mobile,
		mobileWebkit: mobileWebkit,
		mobileWebkit3d: mobileWebkit3d,
		msPointer: msPointer,
		pointer: pointer,
		touch: touch,
		mobileOpera: mobileOpera,
		mobileGecko: mobileGecko,
		retina: retina,
		passiveEvents: passiveEvents,
		canvas: canvas,
		svg: svg,
		vml: vml
	});

	/*
	 * Extends L.DomEvent to provide touch support for Internet Explorer and Windows-based devices.
	 */


	var POINTER_DOWN =   msPointer ? 'MSPointerDown'   : 'pointerdown';
	var POINTER_MOVE =   msPointer ? 'MSPointerMove'   : 'pointermove';
	var POINTER_UP =     msPointer ? 'MSPointerUp'     : 'pointerup';
	var POINTER_CANCEL = msPointer ? 'MSPointerCancel' : 'pointercancel';

	var _pointers = {};
	var _pointerDocListener = false;

	// Provides a touch events wrapper for (ms)pointer events.
	// ref http://www.w3.org/TR/pointerevents/ https://www.w3.org/Bugs/Public/show_bug.cgi?id=22890

	function addPointerListener(obj, type, handler, id) {
		if (type === 'touchstart') {
			_addPointerStart(obj, handler, id);

		} else if (type === 'touchmove') {
			_addPointerMove(obj, handler, id);

		} else if (type === 'touchend') {
			_addPointerEnd(obj, handler, id);
		}

		return this;
	}

	function removePointerListener(obj, type, id) {
		var handler = obj['_leaflet_' + type + id];

		if (type === 'touchstart') {
			obj.removeEventListener(POINTER_DOWN, handler, false);

		} else if (type === 'touchmove') {
			obj.removeEventListener(POINTER_MOVE, handler, false);

		} else if (type === 'touchend') {
			obj.removeEventListener(POINTER_UP, handler, false);
			obj.removeEventListener(POINTER_CANCEL, handler, false);
		}

		return this;
	}

	function _addPointerStart(obj, handler, id) {
		var onDown = bind(function (e) {
			// IE10 specific: MsTouch needs preventDefault. See #2000
			if (e.MSPOINTER_TYPE_TOUCH && e.pointerType === e.MSPOINTER_TYPE_TOUCH) {
				preventDefault(e);
			}

			_handlePointer(e, handler);
		});

		obj['_leaflet_touchstart' + id] = onDown;
		obj.addEventListener(POINTER_DOWN, onDown, false);

		// need to keep track of what pointers and how many are active to provide e.touches emulation
		if (!_pointerDocListener) {
			// we listen document as any drags that end by moving the touch off the screen get fired there
			document.addEventListener(POINTER_DOWN, _globalPointerDown, true);
			document.addEventListener(POINTER_MOVE, _globalPointerMove, true);
			document.addEventListener(POINTER_UP, _globalPointerUp, true);
			document.addEventListener(POINTER_CANCEL, _globalPointerUp, true);

			_pointerDocListener = true;
		}
	}

	function _globalPointerDown(e) {
		_pointers[e.pointerId] = e;
	}

	function _globalPointerMove(e) {
		if (_pointers[e.pointerId]) {
			_pointers[e.pointerId] = e;
		}
	}

	function _globalPointerUp(e) {
		delete _pointers[e.pointerId];
	}

	function _handlePointer(e, handler) {
		e.touches = [];
		for (var i in _pointers) {
			e.touches.push(_pointers[i]);
		}

		handler(e);
	}

	function _addPointerMove(obj, handler, id) {
		var onMove = function (e) {
			// don't fire touch moves when mouse isn't down
			if ((e.pointerType === (e.MSPOINTER_TYPE_MOUSE || 'mouse')) && e.buttons === 0) {
				return;
			}

			_handlePointer(e, handler);
		};

		obj['_leaflet_touchmove' + id] = onMove;
		obj.addEventListener(POINTER_MOVE, onMove, false);
	}

	function _addPointerEnd(obj, handler, id) {
		var onUp = function (e) {
			_handlePointer(e, handler);
		};

		obj['_leaflet_touchend' + id] = onUp;
		obj.addEventListener(POINTER_UP, onUp, false);
		obj.addEventListener(POINTER_CANCEL, onUp, false);
	}

	/*
	 * Extends the event handling code with double tap support for mobile browsers.
	 */

	var _touchstart = msPointer ? 'MSPointerDown' : pointer ? 'pointerdown' : 'touchstart';
	var _touchend = msPointer ? 'MSPointerUp' : pointer ? 'pointerup' : 'touchend';
	var _pre = '_leaflet_';

	// inspired by Zepto touch code by Thomas Fuchs
	function addDoubleTapListener(obj, handler, id) {
		var last, touch$$1,
				doubleTap = false,
				delay = 250;

		function onTouchStart(e) {

			if (pointer) {
				if (!e.isPrimary) { return; }
				if (e.pointerType === 'mouse') { return; } // mouse fires native dblclick
			} else if (e.touches.length > 1) {
				return;
			}

			var now = Date.now(),
					delta = now - (last || now);

			touch$$1 = e.touches ? e.touches[0] : e;
			doubleTap = (delta > 0 && delta <= delay);
			last = now;
		}

		function onTouchEnd(e) {
			if (doubleTap && !touch$$1.cancelBubble) {
				if (pointer) {
					if (e.pointerType === 'mouse') { return; }
					// work around .type being readonly with MSPointer* events
					var newTouch = {},
							prop, i;

					for (i in touch$$1) {
						prop = touch$$1[i];
						newTouch[i] = prop && prop.bind ? prop.bind(touch$$1) : prop;
					}
					touch$$1 = newTouch;
				}
				touch$$1.type = 'dblclick';
				touch$$1.button = 0;
				handler(touch$$1);
				last = null;
			}
		}

		obj[_pre + _touchstart + id] = onTouchStart;
		obj[_pre + _touchend + id] = onTouchEnd;
		obj[_pre + 'dblclick' + id] = handler;

		obj.addEventListener(_touchstart, onTouchStart, passiveEvents ? {passive: false} : false);
		obj.addEventListener(_touchend, onTouchEnd, passiveEvents ? {passive: false} : false);

		// On some platforms (notably, chrome<55 on win10 + touchscreen + mouse),
		// the browser doesn't fire touchend/pointerup events but does fire
		// native dblclicks. See #4127.
		// Edge 14 also fires native dblclicks, but only for pointerType mouse, see #5180.
		obj.addEventListener('dblclick', handler, false);

		return this;
	}

	function removeDoubleTapListener(obj, id) {
		var touchstart = obj[_pre + _touchstart + id],
				touchend = obj[_pre + _touchend + id],
				dblclick = obj[_pre + 'dblclick' + id];

		obj.removeEventListener(_touchstart, touchstart, passiveEvents ? {passive: false} : false);
		obj.removeEventListener(_touchend, touchend, passiveEvents ? {passive: false} : false);
		obj.removeEventListener('dblclick', dblclick, false);

		return this;
	}

	/*
	 * @namespace DomUtil
	 *
	 * Utility functions to work with the [DOM](https://developer.mozilla.org/docs/Web/API/Document_Object_Model)
	 * tree, used by Leaflet internally.
	 *
	 * Most functions expecting or returning a `HTMLElement` also work for
	 * SVG elements. The only difference is that classes refer to CSS classes
	 * in HTML and SVG classes in SVG.
	 */


	// @property TRANSFORM: String
	// Vendor-prefixed transform style name (e.g. `'webkitTransform'` for WebKit).
	var TRANSFORM = testProp(
		['transform', 'webkitTransform', 'OTransform', 'MozTransform', 'msTransform']);

	// webkitTransition comes first because some browser versions that drop vendor prefix don't do
	// the same for the transitionend event, in particular the Android 4.1 stock browser

	// @property TRANSITION: String
	// Vendor-prefixed transition style name.
	var TRANSITION = testProp(
		['webkitTransition', 'transition', 'OTransition', 'MozTransition', 'msTransition']);

	// @property TRANSITION_END: String
	// Vendor-prefixed transitionend event name.
	var TRANSITION_END =
		TRANSITION === 'webkitTransition' || TRANSITION === 'OTransition' ? TRANSITION + 'End' : 'transitionend';


	// @function get(id: String|HTMLElement): HTMLElement
	// Returns an element given its DOM id, or returns the element itself
	// if it was passed directly.
	function get(id) {
		return typeof id === 'string' ? document.getElementById(id) : id;
	}

	// @function getStyle(el: HTMLElement, styleAttrib: String): String
	// Returns the value for a certain style attribute on an element,
	// including computed values or values set through CSS.
	function getStyle(el, style) {
		var value = el.style[style] || (el.currentStyle && el.currentStyle[style]);

		if ((!value || value === 'auto') && document.defaultView) {
			var css = document.defaultView.getComputedStyle(el, null);
			value = css ? css[style] : null;
		}
		return value === 'auto' ? null : value;
	}

	// @function create(tagName: String, className?: String, container?: HTMLElement): HTMLElement
	// Creates an HTML element with `tagName`, sets its class to `className`, and optionally appends it to `container` element.
	function create$1(tagName, className, container) {
		var el = document.createElement(tagName);
		el.className = className || '';

		if (container) {
			container.appendChild(el);
		}
		return el;
	}

	// @function remove(el: HTMLElement)
	// Removes `el` from its parent element
	function remove(el) {
		var parent = el.parentNode;
		if (parent) {
			parent.removeChild(el);
		}
	}

	// @function empty(el: HTMLElement)
	// Removes all of `el`'s children elements from `el`
	function empty(el) {
		while (el.firstChild) {
			el.removeChild(el.firstChild);
		}
	}

	// @function toFront(el: HTMLElement)
	// Makes `el` the last child of its parent, so it renders in front of the other children.
	function toFront(el) {
		var parent = el.parentNode;
		if (parent && parent.lastChild !== el) {
			parent.appendChild(el);
		}
	}

	// @function toBack(el: HTMLElement)
	// Makes `el` the first child of its parent, so it renders behind the other children.
	function toBack(el) {
		var parent = el.parentNode;
		if (parent && parent.firstChild !== el) {
			parent.insertBefore(el, parent.firstChild);
		}
	}

	// @function hasClass(el: HTMLElement, name: String): Boolean
	// Returns `true` if the element's class attribute contains `name`.
	function hasClass(el, name) {
		if (el.classList !== undefined) {
			return el.classList.contains(name);
		}
		var className = getClass(el);
		return className.length > 0 && new RegExp('(^|\\s)' + name + '(\\s|$)').test(className);
	}

	// @function addClass(el: HTMLElement, name: String)
	// Adds `name` to the element's class attribute.
	function addClass(el, name) {
		if (el.classList !== undefined) {
			var classes = splitWords(name);
			for (var i = 0, len = classes.length; i < len; i++) {
				el.classList.add(classes[i]);
			}
		} else if (!hasClass(el, name)) {
			var className = getClass(el);
			setClass(el, (className ? className + ' ' : '') + name);
		}
	}

	// @function removeClass(el: HTMLElement, name: String)
	// Removes `name` from the element's class attribute.
	function removeClass(el, name) {
		if (el.classList !== undefined) {
			el.classList.remove(name);
		} else {
			setClass(el, trim((' ' + getClass(el) + ' ').replace(' ' + name + ' ', ' ')));
		}
	}

	// @function setClass(el: HTMLElement, name: String)
	// Sets the element's class.
	function setClass(el, name) {
		if (el.className.baseVal === undefined) {
			el.className = name;
		} else {
			// in case of SVG element
			el.className.baseVal = name;
		}
	}

	// @function getClass(el: HTMLElement): String
	// Returns the element's class.
	function getClass(el) {
		// Check if the element is an SVGElementInstance and use the correspondingElement instead
		// (Required for linked SVG elements in IE11.)
		if (el.correspondingElement) {
			el = el.correspondingElement;
		}
		return el.className.baseVal === undefined ? el.className : el.className.baseVal;
	}

	// @function setOpacity(el: HTMLElement, opacity: Number)
	// Set the opacity of an element (including old IE support).
	// `opacity` must be a number from `0` to `1`.
	function setOpacity(el, value) {
		if ('opacity' in el.style) {
			el.style.opacity = value;
		} else if ('filter' in el.style) {
			_setOpacityIE(el, value);
		}
	}

	function _setOpacityIE(el, value) {
		var filter = false,
				filterName = 'DXImageTransform.Microsoft.Alpha';

		// filters collection throws an error if we try to retrieve a filter that doesn't exist
		try {
			filter = el.filters.item(filterName);
		} catch (e) {
			// don't set opacity to 1 if we haven't already set an opacity,
			// it isn't needed and breaks transparent pngs.
			if (value === 1) { return; }
		}

		value = Math.round(value * 100);

		if (filter) {
			filter.Enabled = (value !== 100);
			filter.Opacity = value;
		} else {
			el.style.filter += ' progid:' + filterName + '(opacity=' + value + ')';
		}
	}

	// @function testProp(props: String[]): String|false
	// Goes through the array of style names and returns the first name
	// that is a valid style name for an element. If no such name is found,
	// it returns false. Useful for vendor-prefixed styles like `transform`.
	function testProp(props) {
		var style = document.documentElement.style;

		for (var i = 0; i < props.length; i++) {
			if (props[i] in style) {
				return props[i];
			}
		}
		return false;
	}

	// @function setTransform(el: HTMLElement, offset: Point, scale?: Number)
	// Resets the 3D CSS transform of `el` so it is translated by `offset` pixels
	// and optionally scaled by `scale`. Does not have an effect if the
	// browser doesn't support 3D CSS transforms.
	function setTransform(el, offset, scale) {
		var pos = offset || new Point(0, 0);

		el.style[TRANSFORM] =
			(ie3d ?
				'translate(' + pos.x + 'px,' + pos.y + 'px)' :
				'translate3d(' + pos.x + 'px,' + pos.y + 'px,0)') +
			(scale ? ' scale(' + scale + ')' : '');
	}

	// @function setPosition(el: HTMLElement, position: Point)
	// Sets the position of `el` to coordinates specified by `position`,
	// using CSS translate or top/left positioning depending on the browser
	// (used by Leaflet internally to position its layers).
	function setPosition(el, point) {

		/*eslint-disable */
		el._leaflet_pos = point;
		/* eslint-enable */

		if (any3d) {
			setTransform(el, point);
		} else {
			el.style.left = point.x + 'px';
			el.style.top = point.y + 'px';
		}
	}

	// @function getPosition(el: HTMLElement): Point
	// Returns the coordinates of an element previously positioned with setPosition.
	function getPosition(el) {
		// this method is only used for elements previously positioned using setPosition,
		// so it's safe to cache the position for performance

		return el._leaflet_pos || new Point(0, 0);
	}

	// @function disableTextSelection()
	// Prevents the user from generating `selectstart` DOM events, usually generated
	// when the user drags the mouse through a page with text. Used internally
	// by Leaflet to override the behaviour of any click-and-drag interaction on
	// the map. Affects drag interactions on the whole document.

	// @function enableTextSelection()
	// Cancels the effects of a previous [`L.DomUtil.disableTextSelection`](#domutil-disabletextselection).
	var disableTextSelection;
	var enableTextSelection;
	var _userSelect;
	if ('onselectstart' in document) {
		disableTextSelection = function () {
			on(window, 'selectstart', preventDefault);
		};
		enableTextSelection = function () {
			off(window, 'selectstart', preventDefault);
		};
	} else {
		var userSelectProperty = testProp(
			['userSelect', 'WebkitUserSelect', 'OUserSelect', 'MozUserSelect', 'msUserSelect']);

		disableTextSelection = function () {
			if (userSelectProperty) {
				var style = document.documentElement.style;
				_userSelect = style[userSelectProperty];
				style[userSelectProperty] = 'none';
			}
		};
		enableTextSelection = function () {
			if (userSelectProperty) {
				document.documentElement.style[userSelectProperty] = _userSelect;
				_userSelect = undefined;
			}
		};
	}

	// @function disableImageDrag()
	// As [`L.DomUtil.disableTextSelection`](#domutil-disabletextselection), but
	// for `dragstart` DOM events, usually generated when the user drags an image.
	function disableImageDrag() {
		on(window, 'dragstart', preventDefault);
	}

	// @function enableImageDrag()
	// Cancels the effects of a previous [`L.DomUtil.disableImageDrag`](#domutil-disabletextselection).
	function enableImageDrag() {
		off(window, 'dragstart', preventDefault);
	}

	var _outlineElement, _outlineStyle;
	// @function preventOutline(el: HTMLElement)
	// Makes the [outline](https://developer.mozilla.org/docs/Web/CSS/outline)
	// of the element `el` invisible. Used internally by Leaflet to prevent
	// focusable elements from displaying an outline when the user performs a
	// drag interaction on them.
	function preventOutline(element) {
		while (element.tabIndex === -1) {
			element = element.parentNode;
		}
		if (!element.style) { return; }
		restoreOutline();
		_outlineElement = element;
		_outlineStyle = element.style.outline;
		element.style.outline = 'none';
		on(window, 'keydown', restoreOutline);
	}

	// @function restoreOutline()
	// Cancels the effects of a previous [`L.DomUtil.preventOutline`]().
	function restoreOutline() {
		if (!_outlineElement) { return; }
		_outlineElement.style.outline = _outlineStyle;
		_outlineElement = undefined;
		_outlineStyle = undefined;
		off(window, 'keydown', restoreOutline);
	}

	// @function getSizedParentNode(el: HTMLElement): HTMLElement
	// Finds the closest parent node which size (width and height) is not null.
	function getSizedParentNode(element) {
		do {
			element = element.parentNode;
		} while ((!element.offsetWidth || !element.offsetHeight) && element !== document.body);
		return element;
	}

	// @function getScale(el: HTMLElement): Object
	// Computes the CSS scale currently applied on the element.
	// Returns an object with `x` and `y` members as horizontal and vertical scales respectively,
	// and `boundingClientRect` as the result of [`getBoundingClientRect()`](https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect).
	function getScale(element) {
		var rect = element.getBoundingClientRect(); // Read-only in old browsers.

		return {
			x: rect.width / element.offsetWidth || 1,
			y: rect.height / element.offsetHeight || 1,
			boundingClientRect: rect
		};
	}

	var DomUtil = ({
		TRANSFORM: TRANSFORM,
		TRANSITION: TRANSITION,
		TRANSITION_END: TRANSITION_END,
		get: get,
		getStyle: getStyle,
		create: create$1,
		remove: remove,
		empty: empty,
		toFront: toFront,
		toBack: toBack,
		hasClass: hasClass,
		addClass: addClass,
		removeClass: removeClass,
		setClass: setClass,
		getClass: getClass,
		setOpacity: setOpacity,
		testProp: testProp,
		setTransform: setTransform,
		setPosition: setPosition,
		getPosition: getPosition,
		disableTextSelection: disableTextSelection,
		enableTextSelection: enableTextSelection,
		disableImageDrag: disableImageDrag,
		enableImageDrag: enableImageDrag,
		preventOutline: preventOutline,
		restoreOutline: restoreOutline,
		getSizedParentNode: getSizedParentNode,
		getScale: getScale
	});

	/*
	 * @namespace DomEvent
	 * Utility functions to work with the [DOM events](https://developer.mozilla.org/docs/Web/API/Event), used by Leaflet internally.
	 */

	// Inspired by John Resig, Dean Edwards and YUI addEvent implementations.

	// @function on(el: HTMLElement, types: String, fn: Function, context?: Object): this
	// Adds a listener function (`fn`) to a particular DOM event type of the
	// element `el`. You can optionally specify the context of the listener
	// (object the `this` keyword will point to). You can also pass several
	// space-separated types (e.g. `'click dblclick'`).

	// @alternative
	// @function on(el: HTMLElement, eventMap: Object, context?: Object): this
	// Adds a set of type/listener pairs, e.g. `{click: onClick, mousemove: onMouseMove}`
	function on(obj, types, fn, context) {

		if (typeof types === 'object') {
			for (var type in types) {
				addOne(obj, type, types[type], fn);
			}
		} else {
			types = splitWords(types);

			for (var i = 0, len = types.length; i < len; i++) {
				addOne(obj, types[i], fn, context);
			}
		}

		return this;
	}

	var eventsKey = '_leaflet_events';

	// @function off(el: HTMLElement, types: String, fn: Function, context?: Object): this
	// Removes a previously added listener function.
	// Note that if you passed a custom context to on, you must pass the same
	// context to `off` in order to remove the listener.

	// @alternative
	// @function off(el: HTMLElement, eventMap: Object, context?: Object): this
	// Removes a set of type/listener pairs, e.g. `{click: onClick, mousemove: onMouseMove}`
	function off(obj, types, fn, context) {

		if (typeof types === 'object') {
			for (var type in types) {
				removeOne(obj, type, types[type], fn);
			}
		} else if (types) {
			types = splitWords(types);

			for (var i = 0, len = types.length; i < len; i++) {
				removeOne(obj, types[i], fn, context);
			}
		} else {
			for (var j in obj[eventsKey]) {
				removeOne(obj, j, obj[eventsKey][j]);
			}
			delete obj[eventsKey];
		}

		return this;
	}

	function browserFiresNativeDblClick() {
		// See https://github.com/w3c/pointerevents/issues/171
		if (pointer) {
			return !(edge || safari);
		}
	}

	var mouseSubst = {
		mouseenter: 'mouseover',
		mouseleave: 'mouseout',
		wheel: !('onwheel' in window) && 'mousewheel'
	};

	function addOne(obj, type, fn, context) {
		var id = type + stamp(fn) + (context ? '_' + stamp(context) : '');

		if (obj[eventsKey] && obj[eventsKey][id]) { return this; }

		var handler = function (e) {
			return (e.type.includes('mouse'))?false:fn.call(context || obj, e || window.event);
		};

		var originalHandler = handler;

		if (pointer && type.indexOf('touch') === 0) {
			// Needs DomEvent.Pointer.js
			addPointerListener(obj, type, handler, id);

		} else if (touch && (type === 'dblclick') && !browserFiresNativeDblClick()) {
			addDoubleTapListener(obj, handler, id);

		} else if ('addEventListener' in obj) {

			if (type === 'touchstart' || type === 'touchmove' || type === 'wheel' ||  type === 'mousewheel') {
				obj.addEventListener(mouseSubst[type] || type, handler, passiveEvents ? {passive: false} : false);

			} else if (type === 'mouseenter' || type === 'mouseleave') {
				handler = function (e) {
					e = e || window.event;
					if (isExternalTarget(obj, e)) {
						originalHandler(e);
					}
				};
				obj.addEventListener(mouseSubst[type], handler, false);

			} else {
				obj.addEventListener(type, originalHandler, false);
			}

		} else if ('attachEvent' in obj) {
			obj.attachEvent('on' + type, handler);
		}

		obj[eventsKey] = obj[eventsKey] || {};
		obj[eventsKey][id] = handler;
	}

	function removeOne(obj, type, fn, context) {

		var id = type + stamp(fn) + (context ? '_' + stamp(context) : ''),
				handler = obj[eventsKey] && obj[eventsKey][id];

		if (!handler) { return this; }

		if (pointer && type.indexOf('touch') === 0) {
			removePointerListener(obj, type, id);

		} else if (touch && (type === 'dblclick') && !browserFiresNativeDblClick()) {
			removeDoubleTapListener(obj, id);

		} else if ('removeEventListener' in obj) {

			obj.removeEventListener(mouseSubst[type] || type, handler, false);

		} else if ('detachEvent' in obj) {
			obj.detachEvent('on' + type, handler);
		}

		obj[eventsKey][id] = null;
	}

	// @function stopPropagation(ev: DOMEvent): this
	// Stop the given event from propagation to parent elements. Used inside the listener functions:
	// ```js
	// L.DomEvent.on(div, 'click', function (ev) {
	// 	L.DomEvent.stopPropagation(ev);
	// });
	// ```
	function stopPropagation(e) {

		if (e.stopPropagation) {
			e.stopPropagation();
		} else if (e.originalEvent) {  // In case of Leaflet event.
			e.originalEvent._stopped = true;
		} else {
			e.cancelBubble = true;
		}
		skipped(e);

		return this;
	}

	// @function disableScrollPropagation(el: HTMLElement): this
	// Adds `stopPropagation` to the element's `'wheel'` events (plus browser variants).
	function disableScrollPropagation(el) {
		addOne(el, 'wheel', stopPropagation);
		return this;
	}

	// @function disableClickPropagation(el: HTMLElement): this
	// Adds `stopPropagation` to the element's `'click'`, `'doubleclick'`,
	// `'mousedown'` and `'touchstart'` events (plus browser variants).
	function disableClickPropagation(el) {
		on(el, 'mousedown touchstart dblclick', stopPropagation);
		addOne(el, 'click', fakeStop);
		return this;
	}

	// @function preventDefault(ev: DOMEvent): this
	// Prevents the default action of the DOM Event `ev` from happening (such as
	// following a link in the href of the a element, or doing a POST request
	// with page reload when a `<form>` is submitted).
	// Use it inside listener functions.
	function preventDefault(e) {
		if (e.preventDefault) {
			e.preventDefault();
		} else {
			e.returnValue = false;
		}
		return this;
	}

	// @function stop(ev: DOMEvent): this
	// Does `stopPropagation` and `preventDefault` at the same time.
	function stop(e) {
		preventDefault(e);
		stopPropagation(e);
		return this;
	}

	// @function getMousePosition(ev: DOMEvent, container?: HTMLElement): Point
	// Gets normalized mouse position from a DOM event relative to the
	// `container` (border excluded) or to the whole page if not specified.
	function getMousePosition(e, container) {
		if (!container) {
			return new Point(e.clientX, e.clientY);
		}

		var scale = getScale(container),
				offset = scale.boundingClientRect; // left and top  values are in page scale (like the event clientX/Y)

		return new Point(
			// offset.left/top values are in page scale (like clientX/Y),
			// whereas clientLeft/Top (border width) values are the original values (before CSS scale applies).
			(e.clientX - offset.left) / scale.x - container.clientLeft,
			(e.clientY - offset.top) / scale.y - container.clientTop
		);
	}

	// Chrome on Win scrolls double the pixels as in other platforms (see #4538),
	// and Firefox scrolls device pixels, not CSS pixels
	var wheelPxFactor =
		(win && chrome) ? 2 * window.devicePixelRatio :
		gecko ? window.devicePixelRatio : 1;

	// @function getWheelDelta(ev: DOMEvent): Number
	// Gets normalized wheel delta from a wheel DOM event, in vertical
	// pixels scrolled (negative if scrolling down).
	// Events from pointing devices without precise scrolling are mapped to
	// a best guess of 60 pixels.
	function getWheelDelta(e) {
		return (edge) ? e.wheelDeltaY / 2 : // Don't trust window-geometry-based delta
					 (e.deltaY && e.deltaMode === 0) ? -e.deltaY / wheelPxFactor : // Pixels
					 (e.deltaY && e.deltaMode === 1) ? -e.deltaY * 20 : // Lines
					 (e.deltaY && e.deltaMode === 2) ? -e.deltaY * 60 : // Pages
					 (e.deltaX || e.deltaZ) ? 0 :	// Skip horizontal/depth wheel events
					 e.wheelDelta ? (e.wheelDeltaY || e.wheelDelta) / 2 : // Legacy IE pixels
					 (e.detail && Math.abs(e.detail) < 32765) ? -e.detail * 20 : // Legacy Moz lines
					 e.detail ? e.detail / -32765 * 60 : // Legacy Moz pages
					 0;
	}

	var skipEvents = {};

	function fakeStop(e) {
		// fakes stopPropagation by setting a special event flag, checked/reset with skipped(e)
		skipEvents[e.type] = true;
	}

	function skipped(e) {
		var events = skipEvents[e.type];
		// reset when checking, as it's only used in map container and propagates outside of the map
		skipEvents[e.type] = false;
		return events;
	}

	// check if element really left/entered the event target (for mouseenter/mouseleave)
	function isExternalTarget(el, e) {

		var related = e.relatedTarget;

		if (!related) { return true; }

		try {
			while (related && (related !== el)) {
				related = related.parentNode;
			}
		} catch (err) {
			return false;
		}
		return (related !== el);
	}

	var DomEvent = ({
		on: on,
		off: off,
		stopPropagation: stopPropagation,
		disableScrollPropagation: disableScrollPropagation,
		disableClickPropagation: disableClickPropagation,
		preventDefault: preventDefault,
		stop: stop,
		getMousePosition: getMousePosition,
		getWheelDelta: getWheelDelta,
		fakeStop: fakeStop,
		skipped: skipped,
		isExternalTarget: isExternalTarget,
		addListener: on,
		removeListener: off
	});

	/*
	 * @class PosAnimation
	 * @aka L.PosAnimation
	 * @inherits Evented
	 * Used internally for panning animations, utilizing CSS3 Transitions for modern browsers and a timer fallback for IE6-9.
	 *
	 * @example
	 * ```js
	 * var fx = new L.PosAnimation();
	 * fx.run(el, [300, 500], 0.5);
	 * ```
	 *
	 * @constructor L.PosAnimation()
	 * Creates a `PosAnimation` object.
	 *
	 */

	var PosAnimation = Evented.extend({

		// @method run(el: HTMLElement, newPos: Point, duration?: Number, easeLinearity?: Number)
		// Run an animation of a given element to a new position, optionally setting
		// duration in seconds (`0.25` by default) and easing linearity factor (3rd
		// argument of the [cubic bezier curve](http://cubic-bezier.com/#0,0,.5,1),
		// `0.5` by default).
		run: function (el, newPos, duration, easeLinearity) {
			this.stop();

			this._el = el;
			this._inProgress = true;
			this._duration = duration || 0.25;
			this._easeOutPower = 1 / Math.max(easeLinearity || 0.5, 0.2);

			this._startPos = getPosition(el);
			this._offset = newPos.subtract(this._startPos);
			this._startTime = +new Date();

			// @event start: Event
			// Fired when the animation starts
			this.fire('start');

			this._animate();
		},

		// @method stop()
		// Stops the animation (if currently running).
		stop: function () {
			if (!this._inProgress) { return; }

			this._step(true);
			this._complete();
		},

		_animate: function () {
			// animation loop
			this._animId = requestAnimFrame(this._animate, this);
			this._step();
		},

		_step: function (round) {
			var elapsed = (+new Date()) - this._startTime,
					duration = this._duration * 1000;

			if (elapsed < duration) {
				this._runFrame(this._easeOut(elapsed / duration), round);
			} else {
				this._runFrame(1);
				this._complete();
			}
		},

		_runFrame: function (progress, round) {
			var pos = this._startPos.add(this._offset.multiplyBy(progress));
			if (round) {
				pos._round();
			}
			setPosition(this._el, pos);

			// @event step: Event
			// Fired continuously during the animation.
			this.fire('step');
		},

		_complete: function () {
			cancelAnimFrame(this._animId);

			this._inProgress = false;
			// @event end: Event
			// Fired when the animation ends.
			this.fire('end');
		},

		_easeOut: function (t) {
			return 1 - Math.pow(1 - t, this._easeOutPower);
		}
	});

	/*
	 * @class Map
	 * @aka L.Map
	 * @inherits Evented
	 *
	 * The central class of the API — it is used to create a map on a page and manipulate it.
	 *
	 * @example
	 *
	 * ```js
	 * // initialize the map on the "map" div with a given center and zoom
	 * var map = L.map('map', {
	 * 	center: [51.505, -0.09],
	 * 	zoom: 13
	 * });
	 * ```
	 *
	 */

	var Map = Evented.extend({

		options: {
			// @section Map State Options
			// @option crs: CRS = L.CRS.EPSG3857
			// The [Coordinate Reference System](#crs) to use. Don't change this if you're not
			// sure what it means.
			crs: EPSG3857,

			// @option center: LatLng = undefined
			// Initial geographic center of the map
			center: undefined,

			// @option zoom: Number = undefined
			// Initial map zoom level
			zoom: undefined,

			// @option minZoom: Number = *
			// Minimum zoom level of the map.
			// If not specified and at least one `GridLayer` or `TileLayer` is in the map,
			// the lowest of their `minZoom` options will be used instead.
			minZoom: undefined,

			// @option maxZoom: Number = *
			// Maximum zoom level of the map.
			// If not specified and at least one `GridLayer` or `TileLayer` is in the map,
			// the highest of their `maxZoom` options will be used instead.
			maxZoom: undefined,

			// @option layers: Layer[] = []
			// Array of layers that will be added to the map initially
			layers: [],

			// @option maxBounds: LatLngBounds = null
			// When this option is set, the map restricts the view to the given
			// geographical bounds, bouncing the user back if the user tries to pan
			// outside the view. To set the restriction dynamically, use
			// [`setMaxBounds`](#map-setmaxbounds) method.
			maxBounds: undefined,

			// @option renderer: Renderer = *
			// The default method for drawing vector layers on the map. `L.SVG`
			// or `L.Canvas` by default depending on browser support.
			renderer: undefined,


			// @section Animation Options
			// @option zoomAnimation: Boolean = true
			// Whether the map zoom animation is enabled. By default it's enabled
			// in all browsers that support CSS3 Transitions except Android.
			zoomAnimation: true,

			// @option zoomAnimationThreshold: Number = 4
			// Won't animate zoom if the zoom difference exceeds this value.
			zoomAnimationThreshold: 4,

			// @option fadeAnimation: Boolean = true
			// Whether the tile fade animation is enabled. By default it's enabled
			// in all browsers that support CSS3 Transitions except Android.
			fadeAnimation: true,

			// @option markerZoomAnimation: Boolean = true
			// Whether markers animate their zoom with the zoom animation, if disabled
			// they will disappear for the length of the animation. By default it's
			// enabled in all browsers that support CSS3 Transitions except Android.
			markerZoomAnimation: true,

			// @option transform3DLimit: Number = 2^23
			// Defines the maximum size of a CSS translation transform. The default
			// value should not be changed unless a web browser positions layers in
			// the wrong place after doing a large `panBy`.
			transform3DLimit: 8388608, // Precision limit of a 32-bit float

			// @section Interaction Options
			// @option zoomSnap: Number = 1
			// Forces the map's zoom level to always be a multiple of this, particularly
			// right after a [`fitBounds()`](#map-fitbounds) or a pinch-zoom.
			// By default, the zoom level snaps to the nearest integer; lower values
			// (e.g. `0.5` or `0.1`) allow for greater granularity. A value of `0`
			// means the zoom level will not be snapped after `fitBounds` or a pinch-zoom.
			zoomSnap: 1,

			// @option zoomDelta: Number = 1
			// Controls how much the map's zoom level will change after a
			// [`zoomIn()`](#map-zoomin), [`zoomOut()`](#map-zoomout), pressing `+`
			// or `-` on the keyboard, or using the [zoom controls](#control-zoom).
			// Values smaller than `1` (e.g. `0.5`) allow for greater granularity.
			zoomDelta: 1,

			// @option trackResize: Boolean = true
			// Whether the map automatically handles browser window resize to update itself.
			trackResize: true
		},

		initialize: function (id, options) { // (HTMLElement or String, Object)
			options = setOptions(this, options);

			// Make sure to assign internal flags at the beginning,
			// to avoid inconsistent state in some edge cases.
			this._handlers = [];
			this._layers = {};
			this._zoomBoundLayers = {};
			this._sizeChanged = true;

			this._initContainer(id);
			this._initLayout();

			// hack for https://github.com/Leaflet/Leaflet/issues/1980
			this._onResize = bind(this._onResize, this);

			this._initEvents();

			if (options.maxBounds) {
				this.setMaxBounds(options.maxBounds);
			}

			if (options.zoom !== undefined) {
				this._zoom = this._limitZoom(options.zoom);
			}

			if (options.center && options.zoom !== undefined) {
				this.setView(toLatLng(options.center), options.zoom, {reset: true});
			}

			this.callInitHooks();

			// don't animate on browsers without hardware-accelerated transitions or old Android/Opera
			this._zoomAnimated = TRANSITION && any3d && !mobileOpera &&
					this.options.zoomAnimation;

			// zoom transitions run with the same duration for all layers, so if one of transitionend events
			// happens after starting zoom animation (propagating to the map pane), we know that it ended globally
			if (this._zoomAnimated) {
				this._createAnimProxy();
				on(this._proxy, TRANSITION_END, this._catchTransitionEnd, this);
			}

			this._addLayers(this.options.layers);
		},


		// @section Methods for modifying map state

		// @method setView(center: LatLng, zoom: Number, options?: Zoom/pan options): this
		// Sets the view of the map (geographical center and zoom) with the given
		// animation options.
		setView: function (center, zoom, options) {

			zoom = zoom === undefined ? this._zoom : this._limitZoom(zoom);
			center = this._limitCenter(toLatLng(center), zoom, this.options.maxBounds);
			options = options || {};

			this._stop();

			if (this._loaded && !options.reset && options !== true) {

				if (options.animate !== undefined) {
					options.zoom = extend({animate: options.animate}, options.zoom);
					options.pan = extend({animate: options.animate, duration: options.duration}, options.pan);
				}

				// try animating pan or zoom
				var moved = (this._zoom !== zoom) ?
					this._tryAnimatedZoom && this._tryAnimatedZoom(center, zoom, options.zoom) :
					this._tryAnimatedPan(center, options.pan);

				if (moved) {
					// prevent resize handler call, the view will refresh after animation anyway
					clearTimeout(this._sizeTimer);
					return this;
				}
			}

			// animation didn't start, just reset the map view
			this._resetView(center, zoom);

			return this;
		},

		// @method setZoom(zoom: Number, options?: Zoom/pan options): this
		// Sets the zoom of the map.
		setZoom: function (zoom, options) {
			if (!this._loaded) {
				this._zoom = zoom;
				return this;
			}
			return this.setView(this.getCenter(), zoom, {zoom: options});
		},

		// @method zoomIn(delta?: Number, options?: Zoom options): this
		// Increases the zoom of the map by `delta` ([`zoomDelta`](#map-zoomdelta) by default).
		zoomIn: function (delta, options) {
			delta = delta || (any3d ? this.options.zoomDelta : 1);
			return this.setZoom(this._zoom + delta, options);
		},

		// @method zoomOut(delta?: Number, options?: Zoom options): this
		// Decreases the zoom of the map by `delta` ([`zoomDelta`](#map-zoomdelta) by default).
		zoomOut: function (delta, options) {
			delta = delta || (any3d ? this.options.zoomDelta : 1);
			return this.setZoom(this._zoom - delta, options);
		},

		// @method setZoomAround(latlng: LatLng, zoom: Number, options: Zoom options): this
		// Zooms the map while keeping a specified geographical point on the map
		// stationary (e.g. used internally for scroll zoom and double-click zoom).
		// @alternative
		// @method setZoomAround(offset: Point, zoom: Number, options: Zoom options): this
		// Zooms the map while keeping a specified pixel on the map (relative to the top-left corner) stationary.
		setZoomAround: function (latlng, zoom, options) {
			var scale = this.getZoomScale(zoom),
					viewHalf = this.getSize().divideBy(2),
					containerPoint = latlng instanceof Point ? latlng : this.latLngToContainerPoint(latlng),

					centerOffset = containerPoint.subtract(viewHalf).multiplyBy(1 - 1 / scale),
					newCenter = this.containerPointToLatLng(viewHalf.add(centerOffset));

			return this.setView(newCenter, zoom, {zoom: options});
		},

		_getBoundsCenterZoom: function (bounds, options) {

			options = options || {};
			bounds = bounds.getBounds ? bounds.getBounds() : toLatLngBounds(bounds);

			var paddingTL = toPoint(options.paddingTopLeft || options.padding || [0, 0]),
					paddingBR = toPoint(options.paddingBottomRight || options.padding || [0, 0]),

					zoom = this.getBoundsZoom(bounds, false, paddingTL.add(paddingBR));

			zoom = (typeof options.maxZoom === 'number') ? Math.min(options.maxZoom, zoom) : zoom;

			if (zoom === Infinity) {
				return {
					center: bounds.getCenter(),
					zoom: zoom
				};
			}

			var paddingOffset = paddingBR.subtract(paddingTL).divideBy(2),

					swPoint = this.project(bounds.getSouthWest(), zoom),
					nePoint = this.project(bounds.getNorthEast(), zoom),
					center = this.unproject(swPoint.add(nePoint).divideBy(2).add(paddingOffset), zoom);

			return {
				center: center,
				zoom: zoom
			};
		},

		// @method fitBounds(bounds: LatLngBounds, options?: fitBounds options): this
		// Sets a map view that contains the given geographical bounds with the
		// maximum zoom level possible.
		fitBounds: function (bounds, options) {

			bounds = toLatLngBounds(bounds);

			if (!bounds.isValid()) {
				throw new Error('Bounds are not valid.');
			}

			var target = this._getBoundsCenterZoom(bounds, options);
			return this.setView(target.center, target.zoom, options);
		},

		// @method fitWorld(options?: fitBounds options): this
		// Sets a map view that mostly contains the whole world with the maximum
		// zoom level possible.
		fitWorld: function (options) {
			return this.fitBounds([[-90, -180], [90, 180]], options);
		},

		// @method panTo(latlng: LatLng, options?: Pan options): this
		// Pans the map to a given center.
		panTo: function (center, options) { // (LatLng)
			return this.setView(center, this._zoom, {pan: options});
		},

		// @method panBy(offset: Point, options?: Pan options): this
		// Pans the map by a given number of pixels (animated).
		panBy: function (offset, options) {
			offset = toPoint(offset).round();
			options = options || {};

			if (!offset.x && !offset.y) {
				return this.fire('moveend');
			}
			// If we pan too far, Chrome gets issues with tiles
			// and makes them disappear or appear in the wrong place (slightly offset) #2602
			if (options.animate !== true && !this.getSize().contains(offset)) {
				this._resetView(this.unproject(this.project(this.getCenter()).add(offset)), this.getZoom());
				return this;
			}

			if (!this._panAnim) {
				this._panAnim = new PosAnimation();

				this._panAnim.on({
					'step': this._onPanTransitionStep,
					'end': this._onPanTransitionEnd
				}, this);
			}

			// don't fire movestart if animating inertia
			if (!options.noMoveStart) {
				this.fire('movestart');
			}

			// animate pan unless animate: false specified
			if (options.animate !== false) {
				addClass(this._mapPane, 'leaflet-pan-anim');

				var newPos = this._getMapPanePos().subtract(offset).round();
				this._panAnim.run(this._mapPane, newPos, options.duration || 0.25, options.easeLinearity);
			} else {
				this._rawPanBy(offset);
				this.fire('move').fire('moveend');
			}

			return this;
		},

		// @method flyTo(latlng: LatLng, zoom?: Number, options?: Zoom/pan options): this
		// Sets the view of the map (geographical center and zoom) performing a smooth
		// pan-zoom animation.
		flyTo: function (targetCenter, targetZoom, options) {

			options = options || {};
			if (options.animate === false || !any3d) {
				return this.setView(targetCenter, targetZoom, options);
			}

			this._stop();

			var from = this.project(this.getCenter()),
					to = this.project(targetCenter),
					size = this.getSize(),
					startZoom = this._zoom;

			targetCenter = toLatLng(targetCenter);
			targetZoom = targetZoom === undefined ? startZoom : targetZoom;

			var w0 = Math.max(size.x, size.y),
					w1 = w0 * this.getZoomScale(startZoom, targetZoom),
					u1 = (to.distanceTo(from)) || 1,
					rho = 1.42,
					rho2 = rho * rho;

			function r(i) {
				var s1 = i ? -1 : 1,
						s2 = i ? w1 : w0,
						t1 = w1 * w1 - w0 * w0 + s1 * rho2 * rho2 * u1 * u1,
						b1 = 2 * s2 * rho2 * u1,
						b = t1 / b1,
						sq = Math.sqrt(b * b + 1) - b;

						// workaround for floating point precision bug when sq = 0, log = -Infinite,
						// thus triggering an infinite loop in flyTo
						var log = sq < 0.000000001 ? -18 : Math.log(sq);

				return log;
			}

			function sinh(n) { return (Math.exp(n) - Math.exp(-n)) / 2; }
			function cosh(n) { return (Math.exp(n) + Math.exp(-n)) / 2; }
			function tanh(n) { return sinh(n) / cosh(n); }

			var r0 = r(0);

			function w(s) { return w0 * (cosh(r0) / cosh(r0 + rho * s)); }
			function u(s) { return w0 * (cosh(r0) * tanh(r0 + rho * s) - sinh(r0)) / rho2; }

			function easeOut(t) { return 1 - Math.pow(1 - t, 1.5); }

			var start = Date.now(),
					S = (r(1) - r0) / rho,
					duration = options.duration ? 1000 * options.duration : 1000 * S * 0.8;

			function frame() {
				var t = (Date.now() - start) / duration,
						s = easeOut(t) * S;

				if (t <= 1) {
					this._flyToFrame = requestAnimFrame(frame, this);

					this._move(
						this.unproject(from.add(to.subtract(from).multiplyBy(u(s) / u1)), startZoom),
						this.getScaleZoom(w0 / w(s), startZoom),
						{flyTo: true});

				} else {
					this
						._move(targetCenter, targetZoom)
						._moveEnd(true);
				}
			}

			this._moveStart(true, options.noMoveStart);

			frame.call(this);
			return this;
		},

		// @method flyToBounds(bounds: LatLngBounds, options?: fitBounds options): this
		// Sets the view of the map with a smooth animation like [`flyTo`](#map-flyto),
		// but takes a bounds parameter like [`fitBounds`](#map-fitbounds).
		flyToBounds: function (bounds, options) {
			var target = this._getBoundsCenterZoom(bounds, options);
			return this.flyTo(target.center, target.zoom, options);
		},

		// @method setMaxBounds(bounds: LatLngBounds): this
		// Restricts the map view to the given bounds (see the [maxBounds](#map-maxbounds) option).
		setMaxBounds: function (bounds) {
			bounds = toLatLngBounds(bounds);

			if (!bounds.isValid()) {
				this.options.maxBounds = null;
				return this.off('moveend', this._panInsideMaxBounds);
			} else if (this.options.maxBounds) {
				this.off('moveend', this._panInsideMaxBounds);
			}

			this.options.maxBounds = bounds;

			if (this._loaded) {
				this._panInsideMaxBounds();
			}

			return this.on('moveend', this._panInsideMaxBounds);
		},

		// @method setMinZoom(zoom: Number): this
		// Sets the lower limit for the available zoom levels (see the [minZoom](#map-minzoom) option).
		setMinZoom: function (zoom) {
			var oldZoom = this.options.minZoom;
			this.options.minZoom = zoom;

			if (this._loaded && oldZoom !== zoom) {
				this.fire('zoomlevelschange');

				if (this.getZoom() < this.options.minZoom) {
					return this.setZoom(zoom);
				}
			}

			return this;
		},

		// @method setMaxZoom(zoom: Number): this
		// Sets the upper limit for the available zoom levels (see the [maxZoom](#map-maxzoom) option).
		setMaxZoom: function (zoom) {
			var oldZoom = this.options.maxZoom;
			this.options.maxZoom = zoom;

			if (this._loaded && oldZoom !== zoom) {
				this.fire('zoomlevelschange');

				if (this.getZoom() > this.options.maxZoom) {
					return this.setZoom(zoom);
				}
			}

			return this;
		},

		// @method panInsideBounds(bounds: LatLngBounds, options?: Pan options): this
		// Pans the map to the closest view that would lie inside the given bounds (if it's not already), controlling the animation using the options specific, if any.
		panInsideBounds: function (bounds, options) {
			this._enforcingBounds = true;
			var center = this.getCenter(),
					newCenter = this._limitCenter(center, this._zoom, toLatLngBounds(bounds));

			if (!center.equals(newCenter)) {
				this.panTo(newCenter, options);
			}

			this._enforcingBounds = false;
			return this;
		},

		// @method panInside(latlng: LatLng, options?: options): this
		// Pans the map the minimum amount to make the `latlng` visible. Use
		// `padding`, `paddingTopLeft` and `paddingTopRight` options to fit
		// the display to more restricted bounds, like [`fitBounds`](#map-fitbounds).
		// If `latlng` is already within the (optionally padded) display bounds,
		// the map will not be panned.
		panInside: function (latlng, options) {
			options = options || {};

			var paddingTL = toPoint(options.paddingTopLeft || options.padding || [0, 0]),
					paddingBR = toPoint(options.paddingBottomRight || options.padding || [0, 0]),
					center = this.getCenter(),
					pixelCenter = this.project(center),
					pixelPoint = this.project(latlng),
					pixelBounds = this.getPixelBounds(),
					halfPixelBounds = pixelBounds.getSize().divideBy(2),
					paddedBounds = toBounds([pixelBounds.min.add(paddingTL), pixelBounds.max.subtract(paddingBR)]);

			if (!paddedBounds.contains(pixelPoint)) {
				this._enforcingBounds = true;
				var diff = pixelCenter.subtract(pixelPoint),
						newCenter = toPoint(pixelPoint.x + diff.x, pixelPoint.y + diff.y);

				if (pixelPoint.x < paddedBounds.min.x || pixelPoint.x > paddedBounds.max.x) {
					newCenter.x = pixelCenter.x - diff.x;
					if (diff.x > 0) {
						newCenter.x += halfPixelBounds.x - paddingTL.x;
					} else {
						newCenter.x -= halfPixelBounds.x - paddingBR.x;
					}
				}
				if (pixelPoint.y < paddedBounds.min.y || pixelPoint.y > paddedBounds.max.y) {
					newCenter.y = pixelCenter.y - diff.y;
					if (diff.y > 0) {
						newCenter.y += halfPixelBounds.y - paddingTL.y;
					} else {
						newCenter.y -= halfPixelBounds.y - paddingBR.y;
					}
				}
				this.panTo(this.unproject(newCenter), options);
				this._enforcingBounds = false;
			}
			return this;
		},

		// @method invalidateSize(options: Zoom/pan options): this
		// Checks if the map container size changed and updates the map if so —
		// call it after you've changed the map size dynamically, also animating
		// pan by default. If `options.pan` is `false`, panning will not occur.
		// If `options.debounceMoveend` is `true`, it will delay `moveend` event so
		// that it doesn't happen often even if the method is called many
		// times in a row.

		// @alternative
		// @method invalidateSize(animate: Boolean): this
		// Checks if the map container size changed and updates the map if so —
		// call it after you've changed the map size dynamically, also animating
		// pan by default.
		invalidateSize: function (options) {
			if (!this._loaded) { return this; }

			options = extend({
				animate: false,
				pan: true
			}, options === true ? {animate: true} : options);

			var oldSize = this.getSize();
			this._sizeChanged = true;
			this._lastCenter = null;

			var newSize = this.getSize(),
					oldCenter = oldSize.divideBy(2).round(),
					newCenter = newSize.divideBy(2).round(),
					offset = oldCenter.subtract(newCenter);

			if (!offset.x && !offset.y) { return this; }

			if (options.animate && options.pan) {
				this.panBy(offset);

			} else {
				if (options.pan) {
					this._rawPanBy(offset);
				}

				this.fire('move');

				if (options.debounceMoveend) {
					clearTimeout(this._sizeTimer);
					this._sizeTimer = setTimeout(bind(this.fire, this, 'moveend'), 200);
				} else {
					this.fire('moveend');
				}
			}

			// @section Map state change events
			// @event resize: ResizeEvent
			// Fired when the map is resized.
			return this.fire('resize', {
				oldSize: oldSize,
				newSize: newSize
			});
		},

		// @section Methods for modifying map state
		// @method stop(): this
		// Stops the currently running `panTo` or `flyTo` animation, if any.
		stop: function () {
			this.setZoom(this._limitZoom(this._zoom));
			if (!this.options.zoomSnap) {
				this.fire('viewreset');
			}
			return this._stop();
		},

		// @section Geolocation methods
		// @method locate(options?: Locate options): this
		// Tries to locate the user using the Geolocation API, firing a [`locationfound`](#map-locationfound)
		// event with location data on success or a [`locationerror`](#map-locationerror) event on failure,
		// and optionally sets the map view to the user's location with respect to
		// detection accuracy (or to the world view if geolocation failed).
		// Note that, if your page doesn't use HTTPS, this method will fail in
		// modern browsers ([Chrome 50 and newer](https://sites.google.com/a/chromium.org/dev/Home/chromium-security/deprecating-powerful-features-on-insecure-origins))
		// See `Locate options` for more details.
		locate: function (options) {

			options = this._locateOptions = extend({
				timeout: 10000,
				watch: false
				// setView: false
				// maxZoom: <Number>
				// maximumAge: 0
				// enableHighAccuracy: false
			}, options);

			if (!('geolocation' in navigator)) {
				this._handleGeolocationError({
					code: 0,
					message: 'Geolocation not supported.'
				});
				return this;
			}

			var onResponse = bind(this._handleGeolocationResponse, this),
					onError = bind(this._handleGeolocationError, this);

			if (options.watch) {
				this._locationWatchId =
								navigator.geolocation.watchPosition(onResponse, onError, options);
			} else {
				navigator.geolocation.getCurrentPosition(onResponse, onError, options);
			}
			return this;
		},

		// @method stopLocate(): this
		// Stops watching location previously initiated by `map.locate({watch: true})`
		// and aborts resetting the map view if map.locate was called with
		// `{setView: true}`.
		stopLocate: function () {
			if (navigator.geolocation && navigator.geolocation.clearWatch) {
				navigator.geolocation.clearWatch(this._locationWatchId);
			}
			if (this._locateOptions) {
				this._locateOptions.setView = false;
			}
			return this;
		},

		_handleGeolocationError: function (error) {
			var c = error.code,
					message = error.message ||
									(c === 1 ? 'permission denied' :
									(c === 2 ? 'position unavailable' : 'timeout'));

			if (this._locateOptions.setView && !this._loaded) {
				this.fitWorld();
			}

			// @section Location events
			// @event locationerror: ErrorEvent
			// Fired when geolocation (using the [`locate`](#map-locate) method) failed.
			this.fire('locationerror', {
				code: c,
				message: 'Geolocation error: ' + message + '.'
			});
		},

		_handleGeolocationResponse: function (pos) {
			var lat = pos.coords.latitude,
					lng = pos.coords.longitude,
					latlng = new LatLng(lat, lng),
					bounds = latlng.toBounds(pos.coords.accuracy * 2),
					options = this._locateOptions;

			if (options.setView) {
				var zoom = this.getBoundsZoom(bounds);
				this.setView(latlng, options.maxZoom ? Math.min(zoom, options.maxZoom) : zoom);
			}

			var data = {
				latlng: latlng,
				bounds: bounds,
				timestamp: pos.timestamp
			};

			for (var i in pos.coords) {
				if (typeof pos.coords[i] === 'number') {
					data[i] = pos.coords[i];
				}
			}

			// @event locationfound: LocationEvent
			// Fired when geolocation (using the [`locate`](#map-locate) method)
			// went successfully.
			this.fire('locationfound', data);
		},

		// TODO Appropriate docs section?
		// @section Other Methods
		// @method addHandler(name: String, HandlerClass: Function): this
		// Adds a new `Handler` to the map, given its name and constructor function.
		addHandler: function (name, HandlerClass) {
			if (!HandlerClass) { return this; }

			var handler = this[name] = new HandlerClass(this);

			this._handlers.push(handler);

			if (this.options[name]) {
				handler.enable();
			}

			return this;
		},

		// @method remove(): this
		// Destroys the map and clears all related event listeners.
		remove: function () {

			this._initEvents(true);
			this.off('moveend', this._panInsideMaxBounds);

			if (this._containerId !== this._container._leaflet_id) {
				throw new Error('Map container is being reused by another instance');
			}

			try {
				// throws error in IE6-8
				delete this._container._leaflet_id;
				delete this._containerId;
			} catch (e) {
				/*eslint-disable */
				this._container._leaflet_id = undefined;
				/* eslint-enable */
				this._containerId = undefined;
			}

			if (this._locationWatchId !== undefined) {
				this.stopLocate();
			}

			this._stop();

			remove(this._mapPane);

			if (this._clearControlPos) {
				this._clearControlPos();
			}
			if (this._resizeRequest) {
				cancelAnimFrame(this._resizeRequest);
				this._resizeRequest = null;
			}

			this._clearHandlers();

			if (this._loaded) {
				// @section Map state change events
				// @event unload: Event
				// Fired when the map is destroyed with [remove](#map-remove) method.
				this.fire('unload');
			}

			var i;
			for (i in this._layers) {
				this._layers[i].remove();
			}
			for (i in this._panes) {
				remove(this._panes[i]);
			}

			this._layers = [];
			this._panes = [];
			delete this._mapPane;
			delete this._renderer;

			return this;
		},

		// @section Other Methods
		// @method createPane(name: String, container?: HTMLElement): HTMLElement
		// Creates a new [map pane](#map-pane) with the given name if it doesn't exist already,
		// then returns it. The pane is created as a child of `container`, or
		// as a child of the main map pane if not set.
		createPane: function (name, container) {
			var className = 'leaflet-pane' + (name ? ' leaflet-' + name.replace('Pane', '') + '-pane' : ''),
					pane = create$1('div', className, container || this._mapPane);

			if (name) {
				this._panes[name] = pane;
			}
			return pane;
		},

		// @section Methods for Getting Map State

		// @method getCenter(): LatLng
		// Returns the geographical center of the map view
		getCenter: function () {
			this._checkIfLoaded();

			if (this._lastCenter && !this._moved()) {
				return this._lastCenter;
			}
			return this.layerPointToLatLng(this._getCenterLayerPoint());
		},

		// @method getZoom(): Number
		// Returns the current zoom level of the map view
		getZoom: function () {
			return this._zoom;
		},

		// @method getBounds(): LatLngBounds
		// Returns the geographical bounds visible in the current map view
		getBounds: function () {
			var bounds = this.getPixelBounds(),
					sw = this.unproject(bounds.getBottomLeft()),
					ne = this.unproject(bounds.getTopRight());

			return new LatLngBounds(sw, ne);
		},

		// @method getMinZoom(): Number
		// Returns the minimum zoom level of the map (if set in the `minZoom` option of the map or of any layers), or `0` by default.
		getMinZoom: function () {
			return this.options.minZoom === undefined ? this._layersMinZoom || 0 : this.options.minZoom;
		},

		// @method getMaxZoom(): Number
		// Returns the maximum zoom level of the map (if set in the `maxZoom` option of the map or of any layers).
		getMaxZoom: function () {
			return this.options.maxZoom === undefined ?
				(this._layersMaxZoom === undefined ? Infinity : this._layersMaxZoom) :
				this.options.maxZoom;
		},

		// @method getBoundsZoom(bounds: LatLngBounds, inside?: Boolean, padding?: Point): Number
		// Returns the maximum zoom level on which the given bounds fit to the map
		// view in its entirety. If `inside` (optional) is set to `true`, the method
		// instead returns the minimum zoom level on which the map view fits into
		// the given bounds in its entirety.
		getBoundsZoom: function (bounds, inside, padding) { // (LatLngBounds[, Boolean, Point]) -> Number
			bounds = toLatLngBounds(bounds);
			padding = toPoint(padding || [0, 0]);

			var zoom = this.getZoom() || 0,
					min = this.getMinZoom(),
					max = this.getMaxZoom(),
					nw = bounds.getNorthWest(),
					se = bounds.getSouthEast(),
					size = this.getSize().subtract(padding),
					boundsSize = toBounds(this.project(se, zoom), this.project(nw, zoom)).getSize(),
					snap = any3d ? this.options.zoomSnap : 1,
					scalex = size.x / boundsSize.x,
					scaley = size.y / boundsSize.y,
					scale = inside ? Math.max(scalex, scaley) : Math.min(scalex, scaley);

			zoom = this.getScaleZoom(scale, zoom);

			if (snap) {
				zoom = Math.round(zoom / (snap / 100)) * (snap / 100); // don't jump if within 1% of a snap level
				zoom = inside ? Math.ceil(zoom / snap) * snap : Math.floor(zoom / snap) * snap;
			}

			return Math.max(min, Math.min(max, zoom));
		},

		// @method getSize(): Point
		// Returns the current size of the map container (in pixels).
		getSize: function () {
			if (!this._size || this._sizeChanged) {
				this._size = new Point(
					this._container.clientWidth || 0,
					this._container.clientHeight || 0);

				this._sizeChanged = false;
			}
			return this._size.clone();
		},

		// @method getPixelBounds(): Bounds
		// Returns the bounds of the current map view in projected pixel
		// coordinates (sometimes useful in layer and overlay implementations).
		getPixelBounds: function (center, zoom) {
			var topLeftPoint = this._getTopLeftPoint(center, zoom);
			return new Bounds(topLeftPoint, topLeftPoint.add(this.getSize()));
		},

		// TODO: Check semantics - isn't the pixel origin the 0,0 coord relative to
		// the map pane? "left point of the map layer" can be confusing, specially
		// since there can be negative offsets.
		// @method getPixelOrigin(): Point
		// Returns the projected pixel coordinates of the top left point of
		// the map layer (useful in custom layer and overlay implementations).
		getPixelOrigin: function () {
			this._checkIfLoaded();
			return this._pixelOrigin;
		},

		// @method getPixelWorldBounds(zoom?: Number): Bounds
		// Returns the world's bounds in pixel coordinates for zoom level `zoom`.
		// If `zoom` is omitted, the map's current zoom level is used.
		getPixelWorldBounds: function (zoom) {
			return this.options.crs.getProjectedBounds(zoom === undefined ? this.getZoom() : zoom);
		},

		// @section Other Methods

		// @method getPane(pane: String|HTMLElement): HTMLElement
		// Returns a [map pane](#map-pane), given its name or its HTML element (its identity).
		getPane: function (pane) {
			return typeof pane === 'string' ? this._panes[pane] : pane;
		},

		// @method getPanes(): Object
		// Returns a plain object containing the names of all [panes](#map-pane) as keys and
		// the panes as values.
		getPanes: function () {
			return this._panes;
		},

		// @method getContainer: HTMLElement
		// Returns the HTML element that contains the map.
		getContainer: function () {
			return this._container;
		},


		// @section Conversion Methods

		// @method getZoomScale(toZoom: Number, fromZoom: Number): Number
		// Returns the scale factor to be applied to a map transition from zoom level
		// `fromZoom` to `toZoom`. Used internally to help with zoom animations.
		getZoomScale: function (toZoom, fromZoom) {
			// TODO replace with universal implementation after refactoring projections
			var crs = this.options.crs;
			fromZoom = fromZoom === undefined ? this._zoom : fromZoom;
			return crs.scale(toZoom) / crs.scale(fromZoom);
		},

		// @method getScaleZoom(scale: Number, fromZoom: Number): Number
		// Returns the zoom level that the map would end up at, if it is at `fromZoom`
		// level and everything is scaled by a factor of `scale`. Inverse of
		// [`getZoomScale`](#map-getZoomScale).
		getScaleZoom: function (scale, fromZoom) {
			var crs = this.options.crs;
			fromZoom = fromZoom === undefined ? this._zoom : fromZoom;
			var zoom = crs.zoom(scale * crs.scale(fromZoom));
			return isNaN(zoom) ? Infinity : zoom;
		},

		// @method project(latlng: LatLng, zoom: Number): Point
		// Projects a geographical coordinate `LatLng` according to the projection
		// of the map's CRS, then scales it according to `zoom` and the CRS's
		// `Transformation`. The result is pixel coordinate relative to
		// the CRS origin.
		project: function (latlng, zoom) {
			zoom = zoom === undefined ? this._zoom : zoom;
			return this.options.crs.latLngToPoint(toLatLng(latlng), zoom);
		},

		// @method unproject(point: Point, zoom: Number): LatLng
		// Inverse of [`project`](#map-project).
		unproject: function (point, zoom) {
			zoom = zoom === undefined ? this._zoom : zoom;
			return this.options.crs.pointToLatLng(toPoint(point), zoom);
		},

		// @method layerPointToLatLng(point: Point): LatLng
		// Given a pixel coordinate relative to the [origin pixel](#map-getpixelorigin),
		// returns the corresponding geographical coordinate (for the current zoom level).
		layerPointToLatLng: function (point) {
			var projectedPoint = toPoint(point).add(this.getPixelOrigin());
			return this.unproject(projectedPoint);
		},

		// @method latLngToLayerPoint(latlng: LatLng): Point
		// Given a geographical coordinate, returns the corresponding pixel coordinate
		// relative to the [origin pixel](#map-getpixelorigin).
		latLngToLayerPoint: function (latlng) {
			var projectedPoint = this.project(toLatLng(latlng))._round();
			return projectedPoint._subtract(this.getPixelOrigin());
		},

		// @method wrapLatLng(latlng: LatLng): LatLng
		// Returns a `LatLng` where `lat` and `lng` has been wrapped according to the
		// map's CRS's `wrapLat` and `wrapLng` properties, if they are outside the
		// CRS's bounds.
		// By default this means longitude is wrapped around the dateline so its
		// value is between -180 and +180 degrees.
		wrapLatLng: function (latlng) {
			return this.options.crs.wrapLatLng(toLatLng(latlng));
		},

		// @method wrapLatLngBounds(bounds: LatLngBounds): LatLngBounds
		// Returns a `LatLngBounds` with the same size as the given one, ensuring that
		// its center is within the CRS's bounds.
		// By default this means the center longitude is wrapped around the dateline so its
		// value is between -180 and +180 degrees, and the majority of the bounds
		// overlaps the CRS's bounds.
		wrapLatLngBounds: function (latlng) {
			return this.options.crs.wrapLatLngBounds(toLatLngBounds(latlng));
		},

		// @method distance(latlng1: LatLng, latlng2: LatLng): Number
		// Returns the distance between two geographical coordinates according to
		// the map's CRS. By default this measures distance in meters.
		distance: function (latlng1, latlng2) {
			return this.options.crs.distance(toLatLng(latlng1), toLatLng(latlng2));
		},

		// @method containerPointToLayerPoint(point: Point): Point
		// Given a pixel coordinate relative to the map container, returns the corresponding
		// pixel coordinate relative to the [origin pixel](#map-getpixelorigin).
		containerPointToLayerPoint: function (point) { // (Point)
			return toPoint(point).subtract(this._getMapPanePos());
		},

		// @method layerPointToContainerPoint(point: Point): Point
		// Given a pixel coordinate relative to the [origin pixel](#map-getpixelorigin),
		// returns the corresponding pixel coordinate relative to the map container.
		layerPointToContainerPoint: function (point) { // (Point)
			return toPoint(point).add(this._getMapPanePos());
		},

		// @method containerPointToLatLng(point: Point): LatLng
		// Given a pixel coordinate relative to the map container, returns
		// the corresponding geographical coordinate (for the current zoom level).
		containerPointToLatLng: function (point) {
			var layerPoint = this.containerPointToLayerPoint(toPoint(point));
			return this.layerPointToLatLng(layerPoint);
		},

		// @method latLngToContainerPoint(latlng: LatLng): Point
		// Given a geographical coordinate, returns the corresponding pixel coordinate
		// relative to the map container.
		latLngToContainerPoint: function (latlng) {
			return this.layerPointToContainerPoint(this.latLngToLayerPoint(toLatLng(latlng)));
		},

		// @method mouseEventToContainerPoint(ev: MouseEvent): Point
		// Given a MouseEvent object, returns the pixel coordinate relative to the
		// map container where the event took place.
		mouseEventToContainerPoint: function (e) {
			return getMousePosition(e, this._container);
		},

		// @method mouseEventToLayerPoint(ev: MouseEvent): Point
		// Given a MouseEvent object, returns the pixel coordinate relative to
		// the [origin pixel](#map-getpixelorigin) where the event took place.
		mouseEventToLayerPoint: function (e) {
			return this.containerPointToLayerPoint(this.mouseEventToContainerPoint(e));
		},

		// @method mouseEventToLatLng(ev: MouseEvent): LatLng
		// Given a MouseEvent object, returns geographical coordinate where the
		// event took place.
		mouseEventToLatLng: function (e) { // (MouseEvent)
			return this.layerPointToLatLng(this.mouseEventToLayerPoint(e));
		},


		// map initialization methods

		_initContainer: function (id) {
			var container = this._container = get(id);

			if (!container) {
				throw new Error('Map container not found.');
			} else if (container._leaflet_id) {
				throw new Error('Map container is already initialized.');
			}

			on(container, 'scroll', this._onScroll, this);
			this._containerId = stamp(container);
		},

		_initLayout: function () {
			var container = this._container;

			this._fadeAnimated = this.options.fadeAnimation && any3d;

			addClass(container, 'leaflet-container' +
				(touch ? ' leaflet-touch' : '') +
				(retina ? ' leaflet-retina' : '') +
				(ielt9 ? ' leaflet-oldie' : '') +
				(safari ? ' leaflet-safari' : '') +
				(this._fadeAnimated ? ' leaflet-fade-anim' : ''));

			var position = getStyle(container, 'position');

			if (position !== 'absolute' && position !== 'relative' && position !== 'fixed') {
				container.style.position = 'relative';
			}

			this._initPanes();

			if (this._initControlPos) {
				this._initControlPos();
			}
		},

		_initPanes: function () {
			var panes = this._panes = {};
			this._paneRenderers = {};

			// @section
			//
			// Panes are DOM elements used to control the ordering of layers on the map. You
			// can access panes with [`map.getPane`](#map-getpane) or
			// [`map.getPanes`](#map-getpanes) methods. New panes can be created with the
			// [`map.createPane`](#map-createpane) method.
			//
			// Every map has the following default panes that differ only in zIndex.
			//
			// @pane mapPane: HTMLElement = 'auto'
			// Pane that contains all other map panes

			this._mapPane = this.createPane('mapPane', this._container);
			setPosition(this._mapPane, new Point(0, 0));

			// @pane tilePane: HTMLElement = 200
			// Pane for `GridLayer`s and `TileLayer`s
			this.createPane('tilePane');
			// @pane overlayPane: HTMLElement = 400
			// Pane for overlay shadows (e.g. `Marker` shadows)
			this.createPane('shadowPane');
			// @pane shadowPane: HTMLElement = 500
			// Pane for vectors (`Path`s, like `Polyline`s and `Polygon`s), `ImageOverlay`s and `VideoOverlay`s
			this.createPane('overlayPane');
			// @pane markerPane: HTMLElement = 600
			// Pane for `Icon`s of `Marker`s
			this.createPane('markerPane');
			// @pane tooltipPane: HTMLElement = 650
			// Pane for `Tooltip`s.
			this.createPane('tooltipPane');
			// @pane popupPane: HTMLElement = 700
			// Pane for `Popup`s.
			this.createPane('popupPane');

			if (!this.options.markerZoomAnimation) {
				addClass(panes.markerPane, 'leaflet-zoom-hide');
				addClass(panes.shadowPane, 'leaflet-zoom-hide');
			}
		},


		// private methods that modify map state

		// @section Map state change events
		_resetView: function (center, zoom) {
			setPosition(this._mapPane, new Point(0, 0));

			var loading = !this._loaded;
			this._loaded = true;
			zoom = this._limitZoom(zoom);

			this.fire('viewprereset');

			var zoomChanged = this._zoom !== zoom;
			this
				._moveStart(zoomChanged, false)
				._move(center, zoom)
				._moveEnd(zoomChanged);

			// @event viewreset: Event
			// Fired when the map needs to redraw its content (this usually happens
			// on map zoom or load). Very useful for creating custom overlays.
			this.fire('viewreset');

			// @event load: Event
			// Fired when the map is initialized (when its center and zoom are set
			// for the first time).
			if (loading) {
				this.fire('load');
			}
		},

		_moveStart: function (zoomChanged, noMoveStart) {
			// @event zoomstart: Event
			// Fired when the map zoom is about to change (e.g. before zoom animation).
			// @event movestart: Event
			// Fired when the view of the map starts changing (e.g. user starts dragging the map).
			if (zoomChanged) {
				this.fire('zoomstart');
			}
			if (!noMoveStart) {
				this.fire('movestart');
			}
			return this;
		},

		_move: function (center, zoom, data) {
			if (zoom === undefined) {
				zoom = this._zoom;
			}
			var zoomChanged = this._zoom !== zoom;

			this._zoom = zoom;
			this._lastCenter = center;
			this._pixelOrigin = this._getNewPixelOrigin(center);

			// @event zoom: Event
			// Fired repeatedly during any change in zoom level, including zoom
			// and fly animations.
			if (zoomChanged || (data && data.pinch)) {	// Always fire 'zoom' if pinching because #3530
				this.fire('zoom', data);
			}

			// @event move: Event
			// Fired repeatedly during any movement of the map, including pan and
			// fly animations.
			return this.fire('move', data);
		},

		_moveEnd: function (zoomChanged) {
			// @event zoomend: Event
			// Fired when the map has changed, after any animations.
			if (zoomChanged) {
				this.fire('zoomend');
			}

			// @event moveend: Event
			// Fired when the center of the map stops changing (e.g. user stopped
			// dragging the map).
			return this.fire('moveend');
		},

		_stop: function () {
			cancelAnimFrame(this._flyToFrame);
			if (this._panAnim) {
				this._panAnim.stop();
			}
			return this;
		},

		_rawPanBy: function (offset) {
			setPosition(this._mapPane, this._getMapPanePos().subtract(offset));
		},

		_getZoomSpan: function () {
			return this.getMaxZoom() - this.getMinZoom();
		},

		_panInsideMaxBounds: function () {
			if (!this._enforcingBounds) {
				this.panInsideBounds(this.options.maxBounds);
			}
		},

		_checkIfLoaded: function () {
			if (!this._loaded) {
				throw new Error('Set map center and zoom first.');
			}
		},

		// DOM event handling

		// @section Interaction events
		_initEvents: function (remove$$1) {
			this._targets = {};
			this._targets[stamp(this._container)] = this;

			var onOff = remove$$1 ? off : on;

			// @event click: MouseEvent
			// Fired when the user clicks (or taps) the map.
			// @event dblclick: MouseEvent
			// Fired when the user double-clicks (or double-taps) the map.
			// @event mousedown: MouseEvent
			// Fired when the user pushes the mouse button on the map.
			// @event mouseup: MouseEvent
			// Fired when the user releases the mouse button on the map.
			// @event mouseover: MouseEvent
			// Fired when the mouse enters the map.
			// @event mouseout: MouseEvent
			// Fired when the mouse leaves the map.
			// @event mousemove: MouseEvent
			// Fired while the mouse moves over the map.
			// @event contextmenu: MouseEvent
			// Fired when the user pushes the right mouse button on the map, prevents
			// default browser context menu from showing if there are listeners on
			// this event. Also fired on mobile when the user holds a single touch
			// for a second (also called long press).
			// @event keypress: KeyboardEvent
			// Fired when the user presses a key from the keyboard that produces a character value while the map is focused.
			// @event keydown: KeyboardEvent
			// Fired when the user presses a key from the keyboard while the map is focused. Unlike the `keypress` event,
			// the `keydown` event is fired for keys that produce a character value and for keys
			// that do not produce a character value.
			// @event keyup: KeyboardEvent
			// Fired when the user releases a key from the keyboard while the map is focused.
			onOff(this._container, 'click dblclick mousedown mouseup ' +
				'mouseover mouseout mousemove contextmenu keypress keydown keyup', this._handleDOMEvent, this);

			if (this.options.trackResize) {
				onOff(window, 'resize', this._onResize, this);
			}

			if (any3d && this.options.transform3DLimit) {
				(remove$$1 ? this.off : this.on).call(this, 'moveend', this._onMoveEnd);
			}
		},

		_onResize: function () {
			cancelAnimFrame(this._resizeRequest);
			this._resizeRequest = requestAnimFrame(
							function () { this.invalidateSize({debounceMoveend: true}); }, this);
		},

		_onScroll: function () {
			this._container.scrollTop  = 0;
			this._container.scrollLeft = 0;
		},

		_onMoveEnd: function () {
			var pos = this._getMapPanePos();
			if (Math.max(Math.abs(pos.x), Math.abs(pos.y)) >= this.options.transform3DLimit) {
				// https://bugzilla.mozilla.org/show_bug.cgi?id=1203873 but Webkit also have
				// a pixel offset on very high values, see: http://jsfiddle.net/dg6r5hhb/
				this._resetView(this.getCenter(), this.getZoom());
			}
		},

		_findEventTargets: function (e, type) {
			var targets = [],
					target,
					isHover = type === 'mouseout' || type === 'mouseover',
					src = e.target || e.srcElement,
					dragging = false;

			while (src) {
				target = this._targets[stamp(src)];
				if (target && (type === 'click' || type === 'preclick') && !e._simulated && this._draggableMoved(target)) {
					// Prevent firing click after you just dragged an object.
					dragging = true;
					break;
				}
				if (target && target.listens(type, true)) {
					if (isHover && !isExternalTarget(src, e)) { break; }
					targets.push(target);
					if (isHover) { break; }
				}
				if (src === this._container) { break; }
				src = src.parentNode;
			}
			if (!targets.length && !dragging && !isHover && isExternalTarget(src, e)) {
				targets = [this];
			}
			return targets;
		},

		_handleDOMEvent: function (e) {
			if (!this._loaded || skipped(e)) { return; }

			var type = e.type;

			if (type === 'mousedown' || type === 'keypress' || type === 'keyup' || type === 'keydown') {
				// prevents outline when clicking on keyboard-focusable element
				preventOutline(e.target || e.srcElement);
			}

			this._fireDOMEvent(e, type);
		},

		_mouseEvents: ['click', 'dblclick', 'mouseover', 'mouseout', 'contextmenu'],

		_fireDOMEvent: function (e, type, targets) {

			if (e.type === 'click') {
				// Fire a synthetic 'preclick' event which propagates up (mainly for closing popups).
				// @event preclick: MouseEvent
				// Fired before mouse click on the map (sometimes useful when you
				// want something to happen on click before any existing click
				// handlers start running).
				var synth = extend({}, e);
				synth.type = 'preclick';
				this._fireDOMEvent(synth, synth.type, targets);
			}

			if (e._stopped) { return; }

			// Find the layer the event is propagating from and its parents.
			targets = (targets || []).concat(this._findEventTargets(e, type));

			if (!targets.length) { return; }

			var target = targets[0];
			if (type === 'contextmenu' && target.listens(type, true)) {
				preventDefault(e);
			}

			var data = {
				originalEvent: e
			};

			if (e.type !== 'keypress' && e.type !== 'keydown' && e.type !== 'keyup') {
				var isMarker = target.getLatLng && (!target._radius || target._radius <= 10);
				data.containerPoint = isMarker ?
					this.latLngToContainerPoint(target.getLatLng()) : this.mouseEventToContainerPoint(e);
				data.layerPoint = this.containerPointToLayerPoint(data.containerPoint);
				data.latlng = isMarker ? target.getLatLng() : this.layerPointToLatLng(data.layerPoint);
			}

			for (var i = 0; i < targets.length; i++) {
				targets[i].fire(type, data, true);
				if (data.originalEvent._stopped ||
					(targets[i].options.bubblingMouseEvents === false && indexOf(this._mouseEvents, type) !== -1)) { return; }
			}
		},

		_draggableMoved: function (obj) {
			obj = obj.dragging && obj.dragging.enabled() ? obj : this;
			return (obj.dragging && obj.dragging.moved()) || (this.boxZoom && this.boxZoom.moved());
		},

		_clearHandlers: function () {
			for (var i = 0, len = this._handlers.length; i < len; i++) {
				this._handlers[i].disable();
			}
		},

		// @section Other Methods

		// @method whenReady(fn: Function, context?: Object): this
		// Runs the given function `fn` when the map gets initialized with
		// a view (center and zoom) and at least one layer, or immediately
		// if it's already initialized, optionally passing a function context.
		whenReady: function (callback, context) {
			if (this._loaded) {
				callback.call(context || this, {target: this});
			} else {
				this.on('load', callback, context);
			}
			return this;
		},


		// private methods for getting map state

		_getMapPanePos: function () {
			return getPosition(this._mapPane) || new Point(0, 0);
		},

		_moved: function () {
			var pos = this._getMapPanePos();
			return pos && !pos.equals([0, 0]);
		},

		_getTopLeftPoint: function (center, zoom) {
			var pixelOrigin = center && zoom !== undefined ?
				this._getNewPixelOrigin(center, zoom) :
				this.getPixelOrigin();
			return pixelOrigin.subtract(this._getMapPanePos());
		},

		_getNewPixelOrigin: function (center, zoom) {
			var viewHalf = this.getSize()._divideBy(2);
			return this.project(center, zoom)._subtract(viewHalf)._add(this._getMapPanePos())._round();
		},

		_latLngToNewLayerPoint: function (latlng, zoom, center) {
			var topLeft = this._getNewPixelOrigin(center, zoom);
			return this.project(latlng, zoom)._subtract(topLeft);
		},

		_latLngBoundsToNewLayerBounds: function (latLngBounds, zoom, center) {
			var topLeft = this._getNewPixelOrigin(center, zoom);
			return toBounds([
				this.project(latLngBounds.getSouthWest(), zoom)._subtract(topLeft),
				this.project(latLngBounds.getNorthWest(), zoom)._subtract(topLeft),
				this.project(latLngBounds.getSouthEast(), zoom)._subtract(topLeft),
				this.project(latLngBounds.getNorthEast(), zoom)._subtract(topLeft)
			]);
		},

		// layer point of the current center
		_getCenterLayerPoint: function () {
			return this.containerPointToLayerPoint(this.getSize()._divideBy(2));
		},

		// offset of the specified place to the current center in pixels
		_getCenterOffset: function (latlng) {
			return this.latLngToLayerPoint(latlng).subtract(this._getCenterLayerPoint());
		},

		// adjust center for view to get inside bounds
		_limitCenter: function (center, zoom, bounds) {

			if (!bounds) { return center; }

			var centerPoint = this.project(center, zoom),
					viewHalf = this.getSize().divideBy(2),
					viewBounds = new Bounds(centerPoint.subtract(viewHalf), centerPoint.add(viewHalf)),
					offset = this._getBoundsOffset(viewBounds, bounds, zoom);

			// If offset is less than a pixel, ignore.
			// This prevents unstable projections from getting into
			// an infinite loop of tiny offsets.
			if (offset.round().equals([0, 0])) {
				return center;
			}

			return this.unproject(centerPoint.add(offset), zoom);
		},

		// adjust offset for view to get inside bounds
		_limitOffset: function (offset, bounds) {
			if (!bounds) { return offset; }

			var viewBounds = this.getPixelBounds(),
					newBounds = new Bounds(viewBounds.min.add(offset), viewBounds.max.add(offset));

			return offset.add(this._getBoundsOffset(newBounds, bounds));
		},

		// returns offset needed for pxBounds to get inside maxBounds at a specified zoom
		_getBoundsOffset: function (pxBounds, maxBounds, zoom) {
			var projectedMaxBounds = toBounds(
							this.project(maxBounds.getNorthEast(), zoom),
							this.project(maxBounds.getSouthWest(), zoom)
					),
					minOffset = projectedMaxBounds.min.subtract(pxBounds.min),
					maxOffset = projectedMaxBounds.max.subtract(pxBounds.max),

					dx = this._rebound(minOffset.x, -maxOffset.x),
					dy = this._rebound(minOffset.y, -maxOffset.y);

			return new Point(dx, dy);
		},

		_rebound: function (left, right) {
			return left + right > 0 ?
				Math.round(left - right) / 2 :
				Math.max(0, Math.ceil(left)) - Math.max(0, Math.floor(right));
		},

		_limitZoom: function (zoom) {
			var min = this.getMinZoom(),
					max = this.getMaxZoom(),
					snap = any3d ? this.options.zoomSnap : 1;
			if (snap) {
				zoom = Math.round(zoom / snap) * snap;
			}
			return Math.max(min, Math.min(max, zoom));
		},

		_onPanTransitionStep: function () {
			this.fire('move');
		},

		_onPanTransitionEnd: function () {
			removeClass(this._mapPane, 'leaflet-pan-anim');
			this.fire('moveend');
		},

		_tryAnimatedPan: function (center, options) {
			// difference between the new and current centers in pixels
			var offset = this._getCenterOffset(center)._trunc();

			// don't animate too far unless animate: true specified in options
			if ((options && options.animate) !== true && !this.getSize().contains(offset)) { return false; }

			this.panBy(offset, options);

			return true;
		},

		_createAnimProxy: function () {

			var proxy = this._proxy = create$1('div', 'leaflet-proxy leaflet-zoom-animated');
			this._panes.mapPane.appendChild(proxy);

			this.on('zoomanim', function (e) {
				var prop = TRANSFORM,
						transform = this._proxy.style[prop];

				setTransform(this._proxy, this.project(e.center, e.zoom), this.getZoomScale(e.zoom, 1));

				// workaround for case when transform is the same and so transitionend event is not fired
				if (transform === this._proxy.style[prop] && this._animatingZoom) {
					this._onZoomTransitionEnd();
				}
			}, this);

			this.on('load moveend', this._animMoveEnd, this);

			this._on('unload', this._destroyAnimProxy, this);
		},

		_destroyAnimProxy: function () {
			remove(this._proxy);
			this.off('load moveend', this._animMoveEnd, this);
			delete this._proxy;
		},

		_animMoveEnd: function () {
			var c = this.getCenter(),
					z = this.getZoom();
			setTransform(this._proxy, this.project(c, z), this.getZoomScale(z, 1));
		},

		_catchTransitionEnd: function (e) {
			if (this._animatingZoom && e.propertyName.indexOf('transform') >= 0) {
				this._onZoomTransitionEnd();
			}
		},

		_nothingToAnimate: function () {
			return !this._container.getElementsByClassName('leaflet-zoom-animated').length;
		},

		_tryAnimatedZoom: function (center, zoom, options) {

			if (this._animatingZoom) { return true; }

			options = options || {};

			// don't animate if disabled, not supported or zoom difference is too large
			if (!this._zoomAnimated || options.animate === false || this._nothingToAnimate() ||
							Math.abs(zoom - this._zoom) > this.options.zoomAnimationThreshold) { return false; }

			// offset is the pixel coords of the zoom origin relative to the current center
			var scale = this.getZoomScale(zoom),
					offset = this._getCenterOffset(center)._divideBy(1 - 1 / scale);

			// don't animate if the zoom origin isn't within one screen from the current center, unless forced
			if (options.animate !== true && !this.getSize().contains(offset)) { return false; }

			requestAnimFrame(function () {
				this
						._moveStart(true, false)
						._animateZoom(center, zoom, true);
			}, this);

			return true;
		},

		_animateZoom: function (center, zoom, startAnim, noUpdate) {
			if (!this._mapPane) { return; }

			if (startAnim) {
				this._animatingZoom = true;

				// remember what center/zoom to set after animation
				this._animateToCenter = center;
				this._animateToZoom = zoom;

				addClass(this._mapPane, 'leaflet-zoom-anim');
			}

			// @section Other Events
			// @event zoomanim: ZoomAnimEvent
			// Fired at least once per zoom animation. For continuous zoom, like pinch zooming, fired once per frame during zoom.
			this.fire('zoomanim', {
				center: center,
				zoom: zoom,
				noUpdate: noUpdate
			});

			// Work around webkit not firing 'transitionend', see https://github.com/Leaflet/Leaflet/issues/3689, 2693
			setTimeout(bind(this._onZoomTransitionEnd, this), 250);
		},

		_onZoomTransitionEnd: function () {
			if (!this._animatingZoom) { return; }

			if (this._mapPane) {
				removeClass(this._mapPane, 'leaflet-zoom-anim');
			}

			this._animatingZoom = false;

			this._move(this._animateToCenter, this._animateToZoom);

			// This anim frame should prevent an obscure iOS webkit tile loading race condition.
			requestAnimFrame(function () {
				this._moveEnd(true);
			}, this);
		}
	});

	// @section

	// @factory L.map(id: String, options?: Map options)
	// Instantiates a map object given the DOM ID of a `<div>` element
	// and optionally an object literal with `Map options`.
	//
	// @alternative
	// @factory L.map(el: HTMLElement, options?: Map options)
	// Instantiates a map object given an instance of a `<div>` HTML element
	// and optionally an object literal with `Map options`.
	function createMap(id, options) {
		return new Map(id, options);
	}

	/*
	 * @class Control
	 * @aka L.Control
	 * @inherits Class
	 *
	 * L.Control is a base class for implementing map controls. Handles positioning.
	 * All other controls extend from this class.
	 */

	var Control = Class.extend({
		// @section
		// @aka Control options
		options: {
			// @option position: String = 'topright'
			// The position of the control (one of the map corners). Possible values are `'topleft'`,
			// `'topright'`, `'bottomleft'` or `'bottomright'`
			position: 'topright'
		},

		initialize: function (options) {
			setOptions(this, options);
		},

		/* @section
		 * Classes extending L.Control will inherit the following methods:
		 *
		 * @method getPosition: string
		 * Returns the position of the control.
		 */
		getPosition: function () {
			return this.options.position;
		},

		// @method setPosition(position: string): this
		// Sets the position of the control.
		setPosition: function (position) {
			var map = this._map;

			if (map) {
				map.removeControl(this);
			}

			this.options.position = position;

			if (map) {
				map.addControl(this);
			}

			return this;
		},

		// @method getContainer: HTMLElement
		// Returns the HTMLElement that contains the control.
		getContainer: function () {
			return this._container;
		},

		// @method addTo(map: Map): this
		// Adds the control to the given map.
		addTo: function (map) {
			this.remove();
			this._map = map;

			var container = this._container = this.onAdd(map),
					pos = this.getPosition(),
					corner = map._controlCorners[pos];

			addClass(container, 'leaflet-control');

			if (pos.indexOf('bottom') !== -1) {
				corner.insertBefore(container, corner.firstChild);
			} else {
				corner.appendChild(container);
			}

			this._map.on('unload', this.remove, this);

			return this;
		},

		// @method remove: this
		// Removes the control from the map it is currently active on.
		remove: function () {
			if (!this._map) {
				return this;
			}

			remove(this._container);

			if (this.onRemove) {
				this.onRemove(this._map);
			}

			this._map.off('unload', this.remove, this);
			this._map = null;

			return this;
		},

		_refocusOnMap: function (e) {
			// if map exists and event is not a keyboard event
			if (this._map && e && e.screenX > 0 && e.screenY > 0) {
				this._map.getContainer().focus();
			}
		}
	});

	var control = function (options) {
		return new Control(options);
	};

	/* @section Extension methods
	 * @uninheritable
	 *
	 * Every control should extend from `L.Control` and (re-)implement the following methods.
	 *
	 * @method onAdd(map: Map): HTMLElement
	 * Should return the container DOM element for the control and add listeners on relevant map events. Called on [`control.addTo(map)`](#control-addTo).
	 *
	 * @method onRemove(map: Map)
	 * Optional method. Should contain all clean up code that removes the listeners previously added in [`onAdd`](#control-onadd). Called on [`control.remove()`](#control-remove).
	 */

	/* @namespace Map
	 * @section Methods for Layers and Controls
	 */
	Map.include({
		// @method addControl(control: Control): this
		// Adds the given control to the map
		addControl: function (control) {
			control.addTo(this);
			return this;
		},

		// @method removeControl(control: Control): this
		// Removes the given control from the map
		removeControl: function (control) {
			control.remove();
			return this;
		},

		_initControlPos: function () {
			var corners = this._controlCorners = {},
					l = 'leaflet-',
					container = this._controlContainer =
									create$1('div', l + 'control-container', this._container);

			function createCorner(vSide, hSide) {
				var className = l + vSide + ' ' + l + hSide;

				corners[vSide + hSide] = create$1('div', className, container);
			}

			createCorner('top', 'left');
			createCorner('top', 'right');
			createCorner('bottom', 'left');
			createCorner('bottom', 'right');
		},

		_clearControlPos: function () {
			for (var i in this._controlCorners) {
				remove(this._controlCorners[i]);
			}
			remove(this._controlContainer);
			delete this._controlCorners;
			delete this._controlContainer;
		}
	});

	/*
	 * @class Control.Layers
	 * @aka L.Control.Layers
	 * @inherits Control
	 *
	 * The layers control gives users the ability to switch between different base layers and switch overlays on/off (check out the [detailed example](http://leafletjs.com/examples/layers-control/)). Extends `Control`.
	 *
	 * @example
	 *
	 * ```js
	 * var baseLayers = {
	 * 	"Mapbox": mapbox,
	 * 	"OpenStreetMap": osm
	 * };
	 *
	 * var overlays = {
	 * 	"Marker": marker,
	 * 	"Roads": roadsLayer
	 * };
	 *
	 * L.control.layers(baseLayers, overlays).addTo(map);
	 * ```
	 *
	 * The `baseLayers` and `overlays` parameters are object literals with layer names as keys and `Layer` objects as values:
	 *
	 * ```js
	 * {
	 *     "<someName1>": layer1,
	 *     "<someName2>": layer2
	 * }
	 * ```
	 *
	 * The layer names can contain HTML, which allows you to add additional styling to the items:
	 *
	 * ```js
	 * {"<img src='my-layer-icon' /> <span class='my-layer-item'>My Layer</span>": myLayer}
	 * ```
	 */

	var Layers = Control.extend({
		// @section
		// @aka Control.Layers options
		options: {
			// @option collapsed: Boolean = true
			// If `true`, the control will be collapsed into an icon and expanded on mouse hover or touch.
			collapsed: true,
			position: 'topright',

			// @option autoZIndex: Boolean = true
			// If `true`, the control will assign zIndexes in increasing order to all of its layers so that the order is preserved when switching them on/off.
			autoZIndex: true,

			// @option hideSingleBase: Boolean = false
			// If `true`, the base layers in the control will be hidden when there is only one.
			hideSingleBase: false,

			// @option sortLayers: Boolean = false
			// Whether to sort the layers. When `false`, layers will keep the order
			// in which they were added to the control.
			sortLayers: false,

			// @option sortFunction: Function = *
			// A [compare function](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array/sort)
			// that will be used for sorting the layers, when `sortLayers` is `true`.
			// The function receives both the `L.Layer` instances and their names, as in
			// `sortFunction(layerA, layerB, nameA, nameB)`.
			// By default, it sorts layers alphabetically by their name.
			sortFunction: function (layerA, layerB, nameA, nameB) {
				return nameA < nameB ? -1 : (nameB < nameA ? 1 : 0);
			}
		},

		initialize: function (baseLayers, overlays, options) {
			setOptions(this, options);

			this._layerControlInputs = [];
			this._layers = [];
			this._lastZIndex = 0;
			this._handlingClick = false;

			for (var i in baseLayers) {
				this._addLayer(baseLayers[i], i);
			}

			for (i in overlays) {
				this._addLayer(overlays[i], i, true);
			}
		},

		onAdd: function (map) {
			this._initLayout();
			this._update();

			this._map = map;
			map.on('zoomend', this._checkDisabledLayers, this);

			for (var i = 0; i < this._layers.length; i++) {
				this._layers[i].layer.on('add remove', this._onLayerChange, this);
			}

			return this._container;
		},

		addTo: function (map) {
			Control.prototype.addTo.call(this, map);
			// Trigger expand after Layers Control has been inserted into DOM so that is now has an actual height.
			return this._expandIfNotCollapsed();
		},

		onRemove: function () {
			this._map.off('zoomend', this._checkDisabledLayers, this);

			for (var i = 0; i < this._layers.length; i++) {
				this._layers[i].layer.off('add remove', this._onLayerChange, this);
			}
		},

		// @method addBaseLayer(layer: Layer, name: String): this
		// Adds a base layer (radio button entry) with the given name to the control.
		addBaseLayer: function (layer, name) {
			this._addLayer(layer, name);
			return (this._map) ? this._update() : this;
		},

		// @method addOverlay(layer: Layer, name: String): this
		// Adds an overlay (checkbox entry) with the given name to the control.
		addOverlay: function (layer, name) {
			this._addLayer(layer, name, true);
			return (this._map) ? this._update() : this;
		},

		// @method removeLayer(layer: Layer): this
		// Remove the given layer from the control.
		removeLayer: function (layer) {
			layer.off('add remove', this._onLayerChange, this);

			var obj = this._getLayer(stamp(layer));
			if (obj) {
				this._layers.splice(this._layers.indexOf(obj), 1);
			}
			return (this._map) ? this._update() : this;
		},

		// @method expand(): this
		// Expand the control container if collapsed.
		expand: function () {
			addClass(this._container, 'leaflet-control-layers-expanded');
			this._section.style.height = null;
			var acceptableHeight = this._map.getSize().y - (this._container.offsetTop + 50);
			if (acceptableHeight < this._section.clientHeight) {
				addClass(this._section, 'leaflet-control-layers-scrollbar');
				this._section.style.height = acceptableHeight + 'px';
			} else {
				removeClass(this._section, 'leaflet-control-layers-scrollbar');
			}
			this._checkDisabledLayers();
			return this;
		},

		// @method collapse(): this
		// Collapse the control container if expanded.
		collapse: function () {
			removeClass(this._container, 'leaflet-control-layers-expanded');
			return this;
		},

		_initLayout: function () {
			var className = 'leaflet-control-layers',
					container = this._container = create$1('div', className),
					collapsed = this.options.collapsed;

			// makes this work on IE touch devices by stopping it from firing a mouseout event when the touch is released
			container.setAttribute('aria-haspopup', true);

			disableClickPropagation(container);
			disableScrollPropagation(container);

			var section = this._section = create$1('section', className + '-list');

			if (collapsed) {
				this._map.on('click', this.collapse, this);

				if (!android) {
					on(container, {
						mouseenter: this.expand,
						mouseleave: this.collapse
					}, this);
				}
			}

			var link = this._layersLink = create$1('a', className + '-toggle', container);
			link.href = '#';
			link.title = 'Layers';

			if (touch) {
				on(link, 'click', stop);
				on(link, 'click', this.expand, this);
			} else {
				on(link, 'focus', this.expand, this);
			}

			if (!collapsed) {
				this.expand();
			}

			this._baseLayersList = create$1('div', className + '-base', section);
			this._separator = create$1('div', className + '-separator', section);
			this._overlaysList = create$1('div', className + '-overlays', section);

			container.appendChild(section);
		},

		_getLayer: function (id) {
			for (var i = 0; i < this._layers.length; i++) {

				if (this._layers[i] && stamp(this._layers[i].layer) === id) {
					return this._layers[i];
				}
			}
		},

		_addLayer: function (layer, name, overlay) {
			if (this._map) {
				layer.on('add remove', this._onLayerChange, this);
			}

			this._layers.push({
				layer: layer,
				name: name,
				overlay: overlay
			});

			if (this.options.sortLayers) {
				this._layers.sort(bind(function (a, b) {
					return this.options.sortFunction(a.layer, b.layer, a.name, b.name);
				}, this));
			}

			if (this.options.autoZIndex && layer.setZIndex) {
				this._lastZIndex++;
				layer.setZIndex(this._lastZIndex);
			}

			this._expandIfNotCollapsed();
		},

		_update: function () {
			if (!this._container) { return this; }

			empty(this._baseLayersList);
			empty(this._overlaysList);

			this._layerControlInputs = [];
			var baseLayersPresent, overlaysPresent, i, obj, baseLayersCount = 0;

			for (i = 0; i < this._layers.length; i++) {
				obj = this._layers[i];
				this._addItem(obj);
				overlaysPresent = overlaysPresent || obj.overlay;
				baseLayersPresent = baseLayersPresent || !obj.overlay;
				baseLayersCount += !obj.overlay ? 1 : 0;
			}

			// Hide base layers section if there's only one layer.
			if (this.options.hideSingleBase) {
				baseLayersPresent = baseLayersPresent && baseLayersCount > 1;
				this._baseLayersList.style.display = baseLayersPresent ? '' : 'none';
			}

			this._separator.style.display = overlaysPresent && baseLayersPresent ? '' : 'none';

			return this;
		},

		_onLayerChange: function (e) {
			if (!this._handlingClick) {
				this._update();
			}

			var obj = this._getLayer(stamp(e.target));

			// @namespace Map
			// @section Layer events
			// @event baselayerchange: LayersControlEvent
			// Fired when the base layer is changed through the [layers control](#control-layers).
			// @event overlayadd: LayersControlEvent
			// Fired when an overlay is selected through the [layers control](#control-layers).
			// @event overlayremove: LayersControlEvent
			// Fired when an overlay is deselected through the [layers control](#control-layers).
			// @namespace Control.Layers
			var type = obj.overlay ?
				(e.type === 'add' ? 'overlayadd' : 'overlayremove') :
				(e.type === 'add' ? 'baselayerchange' : null);

			if (type) {
				this._map.fire(type, obj);
			}
		},

		// IE7 bugs out if you create a radio dynamically, so you have to do it this hacky way (see http://bit.ly/PqYLBe)
		_createRadioElement: function (name, checked) {

			var radioHtml = '<input type="radio" class="leaflet-control-layers-selector" name="' +
					name + '"' + (checked ? ' checked="checked"' : '') + '/>';

			var radioFragment = document.createElement('div');
			radioFragment.innerHTML = radioHtml;

			return radioFragment.firstChild;
		},

		_addItem: function (obj) {
			var label = document.createElement('label'),
					checked = this._map.hasLayer(obj.layer),
					input;

			if (obj.overlay) {
				input = document.createElement('input');
				input.type = 'checkbox';
				input.className = 'leaflet-control-layers-selector';
				input.defaultChecked = checked;
			} else {
				input = this._createRadioElement('leaflet-base-layers_' + stamp(this), checked);
			}

			this._layerControlInputs.push(input);
			input.layerId = stamp(obj.layer);

			on(input, 'click', this._onInputClick, this);

			var name = document.createElement('span');
			name.innerHTML = ' ' + obj.name;

			// Helps from preventing layer control flicker when checkboxes are disabled
			// https://github.com/Leaflet/Leaflet/issues/2771
			var holder = document.createElement('div');

			label.appendChild(holder);
			holder.appendChild(input);
			holder.appendChild(name);

			var container = obj.overlay ? this._overlaysList : this._baseLayersList;
			container.appendChild(label);

			this._checkDisabledLayers();
			return label;
		},

		_onInputClick: function () {
			var inputs = this._layerControlInputs,
					input, layer;
			var addedLayers = [],
					removedLayers = [];

			this._handlingClick = true;

			for (var i = inputs.length - 1; i >= 0; i--) {
				input = inputs[i];
				layer = this._getLayer(input.layerId).layer;

				if (input.checked) {
					addedLayers.push(layer);
				} else if (!input.checked) {
					removedLayers.push(layer);
				}
			}

			// Bugfix issue 2318: Should remove all old layers before readding new ones
			for (i = 0; i < removedLayers.length; i++) {
				if (this._map.hasLayer(removedLayers[i])) {
					this._map.removeLayer(removedLayers[i]);
				}
			}
			for (i = 0; i < addedLayers.length; i++) {
				if (!this._map.hasLayer(addedLayers[i])) {
					this._map.addLayer(addedLayers[i]);
				}
			}

			this._handlingClick = false;

			this._refocusOnMap();
		},

		_checkDisabledLayers: function () {
			var inputs = this._layerControlInputs,
					input,
					layer,
					zoom = this._map.getZoom();

			for (var i = inputs.length - 1; i >= 0; i--) {
				input = inputs[i];
				layer = this._getLayer(input.layerId).layer;
				input.disabled = (layer.options.minZoom !== undefined && zoom < layer.options.minZoom) ||
												 (layer.options.maxZoom !== undefined && zoom > layer.options.maxZoom);

			}
		},

		_expandIfNotCollapsed: function () {
			if (this._map && !this.options.collapsed) {
				this.expand();
			}
			return this;
		},

		_expand: function () {
			// Backward compatibility, remove me in 1.1.
			return this.expand();
		},

		_collapse: function () {
			// Backward compatibility, remove me in 1.1.
			return this.collapse();
		}

	});


	// @factory L.control.layers(baselayers?: Object, overlays?: Object, options?: Control.Layers options)
	// Creates a layers control with the given layers. Base layers will be switched with radio buttons, while overlays will be switched with checkboxes. Note that all base layers should be passed in the base layers object, but only one should be added to the map during map instantiation.
	var layers = function (baseLayers, overlays, options) {
		return new Layers(baseLayers, overlays, options);
	};

	/*
	 * @class Control.Zoom
	 * @aka L.Control.Zoom
	 * @inherits Control
	 *
	 * A basic zoom control with two buttons (zoom in and zoom out). It is put on the map by default unless you set its [`zoomControl` option](#map-zoomcontrol) to `false`. Extends `Control`.
	 */

	var Zoom = Control.extend({
		// @section
		// @aka Control.Zoom options
		options: {
			position: 'topleft',

			// @option zoomInText: String = '+'
			// The text set on the 'zoom in' button.
			zoomInText: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9.375 9.375V2.5C9.375 2.3175 9.43354 2.16771 9.55062 2.05062C9.66771 1.93354 9.8175 1.875 10 1.875C10.1825 1.875 10.3323 1.93354 10.4494 2.05062C10.5665 2.16771 10.625 2.3175 10.625 2.5V9.375H17.5C17.6825 9.375 17.8323 9.43354 17.9494 9.55062C18.0665 9.66771 18.125 9.8175 18.125 10C18.125 10.1825 18.0665 10.3323 17.9494 10.4494C17.8323 10.5665 17.6825 10.625 17.5 10.625H10.625V17.5C10.625 17.6825 10.5665 17.8323 10.4494 17.9494C10.3323 18.0665 10.1825 18.125 10 18.125C9.8175 18.125 9.66771 18.0665 9.55062 17.9494C9.43354 17.8323 9.375 17.6825 9.375 17.5V10.625H2.5C2.3175 10.625 2.16771 10.5665 2.05062 10.4494C1.93354 10.3323 1.875 10.1825 1.875 10C1.875 9.8175 1.93354 9.66771 2.05062 9.55062C2.16771 9.43354 2.3175 9.375 2.5 9.375H9.375Z" fill="white"></path></svg>',

			// @option zoomInTitle: String = 'Zoom in'
			// The title set on the 'zoom in' button.
			zoomInTitle: 'Zoom in',

			// @option zoomOutText: String = '&#x2212;'
			// The text set on the 'zoom out' button.
			zoomOutText: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.5 10.625H17.5C17.6825 10.625 17.8323 10.5665 17.9494 10.4494C18.0665 10.3323 18.125 10.1825 18.125 10C18.125 9.8175 18.0665 9.66771 17.9494 9.55063C17.8323 9.43354 17.6825 9.375 17.5 9.375H2.5C2.3175 9.375 2.16771 9.43354 2.05062 9.55063C1.93354 9.66771 1.875 9.8175 1.875 10C1.875 10.1825 1.93354 10.3323 2.05062 10.4494C2.16771 10.5665 2.3175 10.625 2.5 10.625Z" fill="white"></path></svg>',

			// @option zoomOutTitle: String = 'Zoom out'
			// The title set on the 'zoom out' button.
			zoomOutTitle: 'Zoom out'
		},

		onAdd: function (map) {
			var zoomName = 'leaflet-control-zoom',
					container = create$1('div', zoomName + ' leaflet-bar'),
					options = this.options;

			this._zoomInButton  = this._createButton(options.zoomInText, options.zoomInTitle,
							zoomName + '-in',  container, this._zoomIn);
			this._zoomOutButton = this._createButton(options.zoomOutText, options.zoomOutTitle,
							zoomName + '-out', container, this._zoomOut);

			this._updateDisabled();
			map.on('zoomend zoomlevelschange', this._updateDisabled, this);

			return container;
		},

		onRemove: function (map) {
			map.off('zoomend zoomlevelschange', this._updateDisabled, this);
		},

		disable: function () {
			this._disabled = true;
			this._updateDisabled();
			return this;
		},

		enable: function () {
			this._disabled = false;
			this._updateDisabled();
			return this;
		},

		_zoomIn: function (e) {
			if (!this._disabled && this._map._zoom < this._map.getMaxZoom()) {
				this._map.zoomIn(this._map.options.zoomDelta * (e.shiftKey ? 3 : 1));
			}
		},

		_zoomOut: function (e) {
			if (!this._disabled && this._map._zoom > this._map.getMinZoom()) {
				this._map.zoomOut(this._map.options.zoomDelta * (e.shiftKey ? 3 : 1));
			}
		},

		_createButton: function (html, title, className, container, fn) {
			var link = create$1('a', className, container);
			link.innerHTML = html;
			link.href = '#';
			link.title = title;

			/*
			 * Will force screen readers like VoiceOver to read this as "Zoom in - button"
			 */
			link.setAttribute('role', 'button');
			link.setAttribute('aria-label', title);

			disableClickPropagation(link);
			on(link, 'click', stop);
			on(link, 'click', fn, this);
			on(link, 'click', this._refocusOnMap, this);

			return link;
		},

		_updateDisabled: function () {
			var map = this._map,
					className = 'leaflet-disabled';

			removeClass(this._zoomInButton, className);
			removeClass(this._zoomOutButton, className);

			if (this._disabled || map._zoom === map.getMinZoom()) {
				addClass(this._zoomOutButton, className);
			}
			if (this._disabled || map._zoom === map.getMaxZoom()) {
				addClass(this._zoomInButton, className);
			}
		}
	});

	// @namespace Map
	// @section Control options
	// @option zoomControl: Boolean = true
	// Whether a [zoom control](#control-zoom) is added to the map by default.
	Map.mergeOptions({
		zoomControl: true
	});

	Map.addInitHook(function () {
		if (this.options.zoomControl) {
			// @section Controls
			// @property zoomControl: Control.Zoom
			// The default zoom control (only available if the
			// [`zoomControl` option](#map-zoomcontrol) was `true` when creating the map).
			this.zoomControl = new Zoom();
			this.addControl(this.zoomControl);
		}
	});

	// @namespace Control.Zoom
	// @factory L.control.zoom(options: Control.Zoom options)
	// Creates a zoom control
	var zoom = function (options) {
		return new Zoom(options);
	};

	/*
	 * @class Control.Scale
	 * @aka L.Control.Scale
	 * @inherits Control
	 *
	 * A simple scale control that shows the scale of the current center of screen in metric (m/km) and imperial (mi/ft) systems. Extends `Control`.
	 *
	 * @example
	 *
	 * ```js
	 * L.control.scale().addTo(map);
	 * ```
	 */

	var Scale = Control.extend({
		// @section
		// @aka Control.Scale options
		options: {
			position: 'bottomleft',

			// @option maxWidth: Number = 100
			// Maximum width of the control in pixels. The width is set dynamically to show round values (e.g. 100, 200, 500).
			maxWidth: 100,

			// @option metric: Boolean = True
			// Whether to show the metric scale line (m/km).
			metric: true,

			// @option imperial: Boolean = True
			// Whether to show the imperial scale line (mi/ft).
			imperial: true

			// @option updateWhenIdle: Boolean = false
			// If `true`, the control is updated on [`moveend`](#map-moveend), otherwise it's always up-to-date (updated on [`move`](#map-move)).
		},

		onAdd: function (map) {
			var className = 'leaflet-control-scale',
					container = create$1('div', className),
					options = this.options;

			this._addScales(options, className + '-line', container);

			map.on(options.updateWhenIdle ? 'moveend' : 'move', this._update, this);
			map.whenReady(this._update, this);

			return container;
		},

		onRemove: function (map) {
			map.off(this.options.updateWhenIdle ? 'moveend' : 'move', this._update, this);
		},

		_addScales: function (options, className, container) {
			if (options.metric) {
				this._mScale = create$1('div', className, container);
			}
			if (options.imperial) {
				this._iScale = create$1('div', className, container);
			}
		},

		_update: function () {
			var map = this._map,
					y = map.getSize().y / 2;

			var maxMeters = map.distance(
				map.containerPointToLatLng([0, y]),
				map.containerPointToLatLng([this.options.maxWidth, y]));

			this._updateScales(maxMeters);
		},

		_updateScales: function (maxMeters) {
			if (this.options.metric && maxMeters) {
				this._updateMetric(maxMeters);
			}
			if (this.options.imperial && maxMeters) {
				this._updateImperial(maxMeters);
			}
		},

		_updateMetric: function (maxMeters) {
			var meters = this._getRoundNum(maxMeters),
					label = meters < 1000 ? meters + ' m' : (meters / 1000) + ' km';

			this._updateScale(this._mScale, label, meters / maxMeters);
		},

		_updateImperial: function (maxMeters) {
			var maxFeet = maxMeters * 3.2808399,
					maxMiles, miles, feet;

			if (maxFeet > 5280) {
				maxMiles = maxFeet / 5280;
				miles = this._getRoundNum(maxMiles);
				this._updateScale(this._iScale, miles + ' mi', miles / maxMiles);

			} else {
				feet = this._getRoundNum(maxFeet);
				this._updateScale(this._iScale, feet + ' ft', feet / maxFeet);
			}
		},

		_updateScale: function (scale, text, ratio) {
			scale.style.width = Math.round(this.options.maxWidth * ratio) + 'px';
			scale.innerHTML = text;
		},

		_getRoundNum: function (num) {
			var pow10 = Math.pow(10, (Math.floor(num) + '').length - 1),
					d = num / pow10;

			d = d >= 10 ? 10 :
					d >= 5 ? 5 :
					d >= 3 ? 3 :
					d >= 2 ? 2 : 1;

			return pow10 * d;
		}
	});


	// @factory L.control.scale(options?: Control.Scale options)
	// Creates an scale control with the given options.
	var scale = function (options) {
		return new Scale(options);
	};

	/*
	 * @class Control.Attribution
	 * @aka L.Control.Attribution
	 * @inherits Control
	 *
	 * The attribution control allows you to display attribution data in a small text box on a map. It is put on the map by default unless you set its [`attributionControl` option](#map-attributioncontrol) to `false`, and it fetches attribution texts from layers with the [`getAttribution` method](#layer-getattribution) automatically. Extends Control.
	 */

	var Attribution = Control.extend({
		// @section
		// @aka Control.Attribution options
		options: {
			position: 'bottomright',

			// @option prefix: String = 'Leaflet'
			// The HTML text shown before the attributions. Pass `false` to disable.
			prefix: '<a href="https://leafletjs.com" title="A JS library for interactive maps">Leaflet</a>'
		},

		initialize: function (options) {
			setOptions(this, options);

			this._attributions = {};
		},

		onAdd: function (map) {
			map.attributionControl = this;
			this._container = create$1('div', 'leaflet-control-attribution');
			disableClickPropagation(this._container);

			// TODO ugly, refactor
			for (var i in map._layers) {
				if (map._layers[i].getAttribution) {
					this.addAttribution(map._layers[i].getAttribution());
				}
			}

			this._update();

			return this._container;
		},

		// @method setPrefix(prefix: String): this
		// Sets the text before the attributions.
		setPrefix: function (prefix) {
			this.options.prefix = prefix;
			this._update();
			return this;
		},

		// @method addAttribution(text: String): this
		// Adds an attribution text (e.g. `'Vector data &copy; Mapbox'`).
		addAttribution: function (text) {
			if (!text) { return this; }

			if (!this._attributions[text]) {
				this._attributions[text] = 0;
			}
			this._attributions[text]++;

			this._update();

			return this;
		},

		// @method removeAttribution(text: String): this
		// Removes an attribution text.
		removeAttribution: function (text) {
			if (!text) { return this; }

			if (this._attributions[text]) {
				this._attributions[text]--;
				this._update();
			}

			return this;
		},

		_update: function () {
			if (!this._map) { return; }

			var attribs = [];

			for (var i in this._attributions) {
				if (this._attributions[i]) {
					attribs.push(i);
				}
			}

			var prefixAndAttribs = [];

			if (this.options.prefix) {
				prefixAndAttribs.push(this.options.prefix);
			}
			if (attribs.length) {
				prefixAndAttribs.push(attribs.join(', '));
			}

			this._container.innerHTML = prefixAndAttribs.join(' | ');
		}
	});

	// @namespace Map
	// @section Control options
	// @option attributionControl: Boolean = true
	// Whether a [attribution control](#control-attribution) is added to the map by default.
	Map.mergeOptions({
		attributionControl: true
	});

	Map.addInitHook(function () {
		if (this.options.attributionControl) {
			new Attribution().addTo(this);
		}
	});

	// @namespace Control.Attribution
	// @factory L.control.attribution(options: Control.Attribution options)
	// Creates an attribution control.
	var attribution = function (options) {
		return new Attribution(options);
	};

	Control.Layers = Layers;
	Control.Zoom = Zoom;
	Control.Scale = Scale;
	Control.Attribution = Attribution;

	control.layers = layers;
	control.zoom = zoom;
	control.scale = scale;
	control.attribution = attribution;

	/*
		L.Handler is a base class for handler classes that are used internally to inject
		interaction features like dragging to classes like Map and Marker.
	*/

	// @class Handler
	// @aka L.Handler
	// Abstract class for map interaction handlers

	var Handler = Class.extend({
		initialize: function (map) {
			this._map = map;
		},

		// @method enable(): this
		// Enables the handler
		enable: function () {
			if (this._enabled) { return this; }

			this._enabled = true;
			this.addHooks();
			return this;
		},

		// @method disable(): this
		// Disables the handler
		disable: function () {
			if (!this._enabled) { return this; }

			this._enabled = false;
			this.removeHooks();
			return this;
		},

		// @method enabled(): Boolean
		// Returns `true` if the handler is enabled
		enabled: function () {
			return !!this._enabled;
		}

		// @section Extension methods
		// Classes inheriting from `Handler` must implement the two following methods:
		// @method addHooks()
		// Called when the handler is enabled, should add event hooks.
		// @method removeHooks()
		// Called when the handler is disabled, should remove the event hooks added previously.
	});

	// @section There is static function which can be called without instantiating L.Handler:
	// @function addTo(map: Map, name: String): this
	// Adds a new Handler to the given map with the given name.
	Handler.addTo = function (map, name) {
		map.addHandler(name, this);
		return this;
	};

	var Mixin = {Events: Events};

	/*
	 * @class Draggable
	 * @aka L.Draggable
	 * @inherits Evented
	 *
	 * A class for making DOM elements draggable (including touch support).
	 * Used internally for map and marker dragging. Only works for elements
	 * that were positioned with [`L.DomUtil.setPosition`](#domutil-setposition).
	 *
	 * @example
	 * ```js
	 * var draggable = new L.Draggable(elementToDrag);
	 * draggable.enable();
	 * ```
	 */

	var START = touch ? 'touchstart mousedown' : 'mousedown';
	var END = {
		mousedown: 'mouseup',
		touchstart: 'touchend',
		pointerdown: 'touchend',
		MSPointerDown: 'touchend'
	};
	var MOVE = {
		mousedown: 'mousemove',
		touchstart: 'touchmove',
		pointerdown: 'touchmove',
		MSPointerDown: 'touchmove'
	};


	var Draggable = Evented.extend({

		options: {
			// @section
			// @aka Draggable options
			// @option clickTolerance: Number = 3
			// The max number of pixels a user can shift the mouse pointer during a click
			// for it to be considered a valid click (as opposed to a mouse drag).
			clickTolerance: 3
		},

		// @constructor L.Draggable(el: HTMLElement, dragHandle?: HTMLElement, preventOutline?: Boolean, options?: Draggable options)
		// Creates a `Draggable` object for moving `el` when you start dragging the `dragHandle` element (equals `el` itself by default).
		initialize: function (element, dragStartTarget, preventOutline$$1, options) {
			setOptions(this, options);

			this._element = element;
			this._dragStartTarget = dragStartTarget || element;
			this._preventOutline = preventOutline$$1;
		},

		// @method enable()
		// Enables the dragging ability
		enable: function () {
			if (this._enabled) { return; }

			on(this._dragStartTarget, START, this._onDown, this);

			this._enabled = true;
		},

		// @method disable()
		// Disables the dragging ability
		disable: function () {
			if (!this._enabled) { return; }

			// If we're currently dragging this draggable,
			// disabling it counts as first ending the drag.
			if (Draggable._dragging === this) {
				this.finishDrag();
			}

			off(this._dragStartTarget, START, this._onDown, this);

			this._enabled = false;
			this._moved = false;
		},

		_onDown: function (e) {
            console.log('Down strat')
			// Ignore simulated events, since we handle both touch and
			// mouse explicitly; otherwise we risk getting duplicates of
			// touch events, see #4315.
			// Also ignore the event if disabled; this happens in IE11
			// under some circumstances, see #3666.
			if (e._simulated || !this._enabled) { return; }

			this._moved = false;

			if (hasClass(this._element, 'leaflet-zoom-anim')) { return; }

			if (Draggable._dragging || e.shiftKey || (!e.touches && (e.which !== 1) && (e.button !== 1))) { return; }
			Draggable._dragging = this;  // Prevent dragging multiple objects at once.

			if (this._preventOutline) {
				preventOutline(this._element);
			}

			disableImageDrag();
			disableTextSelection();

			if (this._moving) { return; }

			// @event down: Event
			// Fired when a drag is about to start.
			this.fire('down');

			var first = e.touches ? e.touches[0] : e,
					sizedParent = getSizedParentNode(this._element);

			this._startPoint = new Point(first.clientX, first.clientY);

			// Cache the scale, so that we can continuously compensate for it during drag (_onMove).
			this._parentScale = getScale(sizedParent);

			on(document, MOVE[e.type], this._onMove, this);
            on(document, END[e.type], this._onUp, this);
            
            //console.log('Down end')
		},

		_onMove: function (e) {
			// Ignore simulated events, since we handle both touch and
			// mouse explicitly; otherwise we risk getting duplicates of
			// touch events, see #4315.
			// Also ignore the event if disabled; this happens in IE11
			// under some circumstances, see #3666.
			if (e._simulated || !this._enabled) { return; }

			if (e.touches && e.touches.length > 1) {
				this._moved = true;
				return;
			}

			var first = (e.touches && e.touches.length === 1 ? e.touches[0] : e),//считаем текущие координаты нажатия
					offset = new Point(first.clientX, first.clientY)._subtract(this._startPoint);//вычисляем сдвиг относительно начальных

			if (!offset.x && !offset.y) { return; }
			if (Math.abs(offset.x) + Math.abs(offset.y) < this.options.clickTolerance) { return; }

			// We assume that the parent container's position, border and scale do not change for the duration of the drag.
			// Therefore there is no need to account for the position and border (they are eliminated by the subtraction)
			// and we can use the cached value for the scale.
			offset.x /= this._parentScale.x;
			offset.y /= this._parentScale.y;

			preventDefault(e);

			if (!this._moved) {
				//console.log('First move')

				this._moved = true;

				//document.body.classList.add('leaflet-dragging');

				this._lastTarget = e.target || e.srcElement;
				// IE and Edge do not give the <use> element, so fetch it
				// if necessary
				if (window.SVGElementInstance && this._lastTarget instanceof window.SVGElementInstance) {
					this._lastTarget = this._lastTarget.correspondingUseElement;
				}
				addClass(this._lastTarget, 'leaflet-drag-target');

				// @event dragstart: Event
				// Fired when a drag starts
				this.fire('dragstart');

				this._startPos = getPosition(this._element).subtract(offset);
			}
            //console.log('Move')

			this._newPos = this._startPos.add(offset);
			this._moving = true;

			cancelAnimFrame(this._animRequest);
			this._lastEvent = e;
			this._animRequest = requestAnimFrame(this._updatePosition, this, true);
		},

		_updatePosition: function () {
			var e = {originalEvent: this._lastEvent};

			// @event predrag: Event
			// Fired continuously during dragging *before* each corresponding
			// update of the element's position.
			this.fire('predrag', e);
			setPosition(this._element, this._newPos);

			// @event drag: Event
			// Fired continuously during dragging.
			this.fire('drag', e);
		},

		_onUp: function (e) {
			// Ignore simulated events, since we handle both touch and
			// mouse explicitly; otherwise we risk getting duplicates of
			// touch events, see #4315.
			// Also ignore the event if disabled; this happens in IE11
			// under some circumstances, see #3666.
			if (e._simulated || !this._enabled) { return; }
			this.finishDrag();
		},

		finishDrag: function () {
			removeClass(document.body, 'leaflet-dragging');

			if (this._lastTarget) {
				removeClass(this._lastTarget, 'leaflet-drag-target');
				this._lastTarget = null;
			}

			for (var i in MOVE) {
				off(document, MOVE[i], this._onMove, this);
				off(document, END[i], this._onUp, this);
			}

			enableImageDrag();
			enableTextSelection();

			if (this._moved && this._moving) {
				// ensure drag is not fired after dragend
				cancelAnimFrame(this._animRequest);

				// @event dragend: DragEndEvent
				// Fired when the drag ends.
				this.fire('dragend', {
					distance: this._newPos.distanceTo(this._startPos)
				});
			}

			this._moving = false;
			Draggable._dragging = false;
		}

	});

	/*
	 * @namespace LineUtil
	 *
	 * Various utility functions for polyline points processing, used by Leaflet internally to make polylines lightning-fast.
	 */

	// Simplify polyline with vertex reduction and Douglas-Peucker simplification.
	// Improves rendering performance dramatically by lessening the number of points to draw.

	// @function simplify(points: Point[], tolerance: Number): Point[]
	// Dramatically reduces the number of points in a polyline while retaining
	// its shape and returns a new array of simplified points, using the
	// [Douglas-Peucker algorithm](http://en.wikipedia.org/wiki/Douglas-Peucker_algorithm).
	// Used for a huge performance boost when processing/displaying Leaflet polylines for
	// each zoom level and also reducing visual noise. tolerance affects the amount of
	// simplification (lesser value means higher quality but slower and with more points).
	// Also released as a separated micro-library [Simplify.js](http://mourner.github.com/simplify-js/).
	function simplify(points, tolerance) {
		if (!tolerance || !points.length) {
			return points.slice();
		}

		var sqTolerance = tolerance * tolerance;

				// stage 1: vertex reduction
				points = _reducePoints(points, sqTolerance);

				// stage 2: Douglas-Peucker simplification
				points = _simplifyDP(points, sqTolerance);

		return points;
	}

	// @function pointToSegmentDistance(p: Point, p1: Point, p2: Point): Number
	// Returns the distance between point `p` and segment `p1` to `p2`.
	function pointToSegmentDistance(p, p1, p2) {
		return Math.sqrt(_sqClosestPointOnSegment(p, p1, p2, true));
	}

	// @function closestPointOnSegment(p: Point, p1: Point, p2: Point): Number
	// Returns the closest point from a point `p` on a segment `p1` to `p2`.
	function closestPointOnSegment(p, p1, p2) {
		return _sqClosestPointOnSegment(p, p1, p2);
	}

	// Douglas-Peucker simplification, see http://en.wikipedia.org/wiki/Douglas-Peucker_algorithm
	function _simplifyDP(points, sqTolerance) {

		var len = points.length,
				ArrayConstructor = typeof Uint8Array !== undefined + '' ? Uint8Array : Array,
				markers = new ArrayConstructor(len);

				markers[0] = markers[len - 1] = 1;

		_simplifyDPStep(points, markers, sqTolerance, 0, len - 1);

		var i,
				newPoints = [];

		for (i = 0; i < len; i++) {
			if (markers[i]) {
				newPoints.push(points[i]);
			}
		}

		return newPoints;
	}

	function _simplifyDPStep(points, markers, sqTolerance, first, last) {

		var maxSqDist = 0,
		index, i, sqDist;

		for (i = first + 1; i <= last - 1; i++) {
			sqDist = _sqClosestPointOnSegment(points[i], points[first], points[last], true);

			if (sqDist > maxSqDist) {
				index = i;
				maxSqDist = sqDist;
			}
		}

		if (maxSqDist > sqTolerance) {
			markers[index] = 1;

			_simplifyDPStep(points, markers, sqTolerance, first, index);
			_simplifyDPStep(points, markers, sqTolerance, index, last);
		}
	}

	// reduce points that are too close to each other to a single point
	function _reducePoints(points, sqTolerance) {
		var reducedPoints = [points[0]];

		for (var i = 1, prev = 0, len = points.length; i < len; i++) {
			if (_sqDist(points[i], points[prev]) > sqTolerance) {
				reducedPoints.push(points[i]);
				prev = i;
			}
		}
		if (prev < len - 1) {
			reducedPoints.push(points[len - 1]);
		}
		return reducedPoints;
	}

	var _lastCode;

	// @function clipSegment(a: Point, b: Point, bounds: Bounds, useLastCode?: Boolean, round?: Boolean): Point[]|Boolean
	// Clips the segment a to b by rectangular bounds with the
	// [Cohen-Sutherland algorithm](https://en.wikipedia.org/wiki/Cohen%E2%80%93Sutherland_algorithm)
	// (modifying the segment points directly!). Used by Leaflet to only show polyline
	// points that are on the screen or near, increasing performance.
	function clipSegment(a, b, bounds, useLastCode, round) {
		var codeA = useLastCode ? _lastCode : _getBitCode(a, bounds),
				codeB = _getBitCode(b, bounds),

				codeOut, p, newCode;

				// save 2nd code to avoid calculating it on the next segment
				_lastCode = codeB;

		while (true) {
			// if a,b is inside the clip window (trivial accept)
			if (!(codeA | codeB)) {
				return [a, b];
			}

			// if a,b is outside the clip window (trivial reject)
			if (codeA & codeB) {
				return false;
			}

			// other cases
			codeOut = codeA || codeB;
			p = _getEdgeIntersection(a, b, codeOut, bounds, round);
			newCode = _getBitCode(p, bounds);

			if (codeOut === codeA) {
				a = p;
				codeA = newCode;
			} else {
				b = p;
				codeB = newCode;
			}
		}
	}

	function _getEdgeIntersection(a, b, code, bounds, round) {
		var dx = b.x - a.x,
				dy = b.y - a.y,
				min = bounds.min,
				max = bounds.max,
				x, y;

		if (code & 8) { // top
			x = a.x + dx * (max.y - a.y) / dy;
			y = max.y;

		} else if (code & 4) { // bottom
			x = a.x + dx * (min.y - a.y) / dy;
			y = min.y;

		} else if (code & 2) { // right
			x = max.x;
			y = a.y + dy * (max.x - a.x) / dx;

		} else if (code & 1) { // left
			x = min.x;
			y = a.y + dy * (min.x - a.x) / dx;
		}

		return new Point(x, y, round);
	}

	function _getBitCode(p, bounds) {
		var code = 0;

		if (p.x < bounds.min.x) { // left
			code |= 1;
		} else if (p.x > bounds.max.x) { // right
			code |= 2;
		}

		if (p.y < bounds.min.y) { // bottom
			code |= 4;
		} else if (p.y > bounds.max.y) { // top
			code |= 8;
		}

		return code;
	}

	// square distance (to avoid unnecessary Math.sqrt calls)
	function _sqDist(p1, p2) {
		var dx = p2.x - p1.x,
				dy = p2.y - p1.y;
		return dx * dx + dy * dy;
	}

	// return closest point on segment or distance to that point
	function _sqClosestPointOnSegment(p, p1, p2, sqDist) {
		var x = p1.x,
				y = p1.y,
				dx = p2.x - x,
				dy = p2.y - y,
				dot = dx * dx + dy * dy,
				t;

		if (dot > 0) {
			t = ((p.x - x) * dx + (p.y - y) * dy) / dot;

			if (t > 1) {
				x = p2.x;
				y = p2.y;
			} else if (t > 0) {
				x += dx * t;
				y += dy * t;
			}
		}

		dx = p.x - x;
		dy = p.y - y;

		return sqDist ? dx * dx + dy * dy : new Point(x, y);
	}


	// @function isFlat(latlngs: LatLng[]): Boolean
	// Returns true if `latlngs` is a flat array, false is nested.
	function isFlat(latlngs) {
		return !isArray(latlngs[0]) || (typeof latlngs[0][0] !== 'object' && typeof latlngs[0][0] !== 'undefined');
	}

	function _flat(latlngs) {
		console.warn('Deprecated use of _flat, please use L.LineUtil.isFlat instead.');
		return isFlat(latlngs);
	}

	var LineUtil = ({
		simplify: simplify,
		pointToSegmentDistance: pointToSegmentDistance,
		closestPointOnSegment: closestPointOnSegment,
		clipSegment: clipSegment,
		_getEdgeIntersection: _getEdgeIntersection,
		_getBitCode: _getBitCode,
		_sqClosestPointOnSegment: _sqClosestPointOnSegment,
		isFlat: isFlat,
		_flat: _flat
	});

	/*
	 * @namespace PolyUtil
	 * Various utility functions for polygon geometries.
	 */

	/* @function clipPolygon(points: Point[], bounds: Bounds, round?: Boolean): Point[]
	 * Clips the polygon geometry defined by the given `points` by the given bounds (using the [Sutherland-Hodgman algorithm](https://en.wikipedia.org/wiki/Sutherland%E2%80%93Hodgman_algorithm)).
	 * Used by Leaflet to only show polygon points that are on the screen or near, increasing
	 * performance. Note that polygon points needs different algorithm for clipping
	 * than polyline, so there's a separate method for it.
	 */
	function clipPolygon(points, bounds, round) {
		var clippedPoints,
				edges = [1, 4, 2, 8],
				i, j, k,
				a, b,
				len, edge, p;

		for (i = 0, len = points.length; i < len; i++) {
			points[i]._code = _getBitCode(points[i], bounds);
		}

		// for each edge (left, bottom, right, top)
		for (k = 0; k < 4; k++) {
			edge = edges[k];
			clippedPoints = [];

			for (i = 0, len = points.length, j = len - 1; i < len; j = i++) {
				a = points[i];
				b = points[j];

				// if a is inside the clip window
				if (!(a._code & edge)) {
					// if b is outside the clip window (a->b goes out of screen)
					if (b._code & edge) {
						p = _getEdgeIntersection(b, a, edge, bounds, round);
						p._code = _getBitCode(p, bounds);
						clippedPoints.push(p);
					}
					clippedPoints.push(a);

				// else if b is inside the clip window (a->b enters the screen)
				} else if (!(b._code & edge)) {
					p = _getEdgeIntersection(b, a, edge, bounds, round);
					p._code = _getBitCode(p, bounds);
					clippedPoints.push(p);
				}
			}
			points = clippedPoints;
		}

		return points;
	}

	var PolyUtil = ({
		clipPolygon: clipPolygon
	});

	/*
	 * @namespace Projection
	 * @section
	 * Leaflet comes with a set of already defined Projections out of the box:
	 *
	 * @projection L.Projection.LonLat
	 *
	 * Equirectangular, or Plate Carree projection — the most simple projection,
	 * mostly used by GIS enthusiasts. Directly maps `x` as longitude, and `y` as
	 * latitude. Also suitable for flat worlds, e.g. game maps. Used by the
	 * `EPSG:4326` and `Simple` CRS.
	 */

	var LonLat = {
		project: function (latlng) {
			return new Point(latlng.lng, latlng.lat);
		},

		unproject: function (point) {
			return new LatLng(point.y, point.x);
		},

		bounds: new Bounds([-180, -90], [180, 90])
	};

	/*
	 * @namespace Projection
	 * @projection L.Projection.Mercator
	 *
	 * Elliptical Mercator projection — more complex than Spherical Mercator. Assumes that Earth is an ellipsoid. Used by the EPSG:3395 CRS.
	 */

	var Mercator = {
		R: 6378137,
		R_MINOR: 6356752.314245179,

		bounds: new Bounds([-20037508.34279, -15496570.73972], [20037508.34279, 18764656.23138]),

		project: function (latlng) {
			var d = Math.PI / 180,
					r = this.R,
					y = latlng.lat * d,
					tmp = this.R_MINOR / r,
					e = Math.sqrt(1 - tmp * tmp),
					con = e * Math.sin(y);

			var ts = Math.tan(Math.PI / 4 - y / 2) / Math.pow((1 - con) / (1 + con), e / 2);
			y = -r * Math.log(Math.max(ts, 1E-10));

			return new Point(latlng.lng * d * r, y);
		},

		unproject: function (point) {
			var d = 180 / Math.PI,
					r = this.R,
					tmp = this.R_MINOR / r,
					e = Math.sqrt(1 - tmp * tmp),
					ts = Math.exp(-point.y / r),
					phi = Math.PI / 2 - 2 * Math.atan(ts);

			for (var i = 0, dphi = 0.1, con; i < 15 && Math.abs(dphi) > 1e-7; i++) {
				con = e * Math.sin(phi);
				con = Math.pow((1 - con) / (1 + con), e / 2);
				dphi = Math.PI / 2 - 2 * Math.atan(ts * con) - phi;
				phi += dphi;
			}

			return new LatLng(phi * d, point.x * d / r);
		}
	};

	/*
	 * @class Projection

	 * An object with methods for projecting geographical coordinates of the world onto
	 * a flat surface (and back). See [Map projection](http://en.wikipedia.org/wiki/Map_projection).

	 * @property bounds: Bounds
	 * The bounds (specified in CRS units) where the projection is valid

	 * @method project(latlng: LatLng): Point
	 * Projects geographical coordinates into a 2D point.
	 * Only accepts actual `L.LatLng` instances, not arrays.

	 * @method unproject(point: Point): LatLng
	 * The inverse of `project`. Projects a 2D point into a geographical location.
	 * Only accepts actual `L.Point` instances, not arrays.

	 * Note that the projection instances do not inherit from Leaflet's `Class` object,
	 * and can't be instantiated. Also, new classes can't inherit from them,
	 * and methods can't be added to them with the `include` function.

	 */

	var index = ({
		LonLat: LonLat,
		Mercator: Mercator,
		SphericalMercator: SphericalMercator
	});

	/*
	 * @namespace CRS
	 * @crs L.CRS.EPSG3395
	 *
	 * Rarely used by some commercial tile providers. Uses Elliptical Mercator projection.
	 */
	var EPSG3395 = extend({}, Earth, {
		code: 'EPSG:3395',
		projection: Mercator,

		transformation: (function () {
			var scale = 0.5 / (Math.PI * Mercator.R);
			return toTransformation(scale, 0.5, -scale, 0.5);
		}())
	});

	/*
	 * @namespace CRS
	 * @crs L.CRS.EPSG4326
	 *
	 * A common CRS among GIS enthusiasts. Uses simple Equirectangular projection.
	 *
	 * Leaflet 1.0.x complies with the [TMS coordinate scheme for EPSG:4326](https://wiki.osgeo.org/wiki/Tile_Map_Service_Specification#global-geodetic),
	 * which is a breaking change from 0.7.x behaviour.  If you are using a `TileLayer`
	 * with this CRS, ensure that there are two 256x256 pixel tiles covering the
	 * whole earth at zoom level zero, and that the tile coordinate origin is (-180,+90),
	 * or (-180,-90) for `TileLayer`s with [the `tms` option](#tilelayer-tms) set.
	 */

	var EPSG4326 = extend({}, Earth, {
		code: 'EPSG:4326',
		projection: LonLat,
		transformation: toTransformation(1 / 180, 1, -1 / 180, 0.5)
	});

	/*
	 * @namespace CRS
	 * @crs L.CRS.Simple
	 *
	 * A simple CRS that maps longitude and latitude into `x` and `y` directly.
	 * May be used for maps of flat surfaces (e.g. game maps). Note that the `y`
	 * axis should still be inverted (going from bottom to top). `distance()` returns
	 * simple euclidean distance.
	 */

	var Simple = extend({}, CRS, {
		projection: LonLat,
		transformation: toTransformation(1, 0, -1, 0),

		scale: function (zoom) {
			return Math.pow(2, zoom);
		},

		zoom: function (scale) {
			return Math.log(scale) / Math.LN2;
		},

		distance: function (latlng1, latlng2) {
			var dx = latlng2.lng - latlng1.lng,
					dy = latlng2.lat - latlng1.lat;

			return Math.sqrt(dx * dx + dy * dy);
		},

		infinite: true
	});

	CRS.Earth = Earth;
	CRS.EPSG3395 = EPSG3395;
	CRS.EPSG3857 = EPSG3857;
	CRS.EPSG900913 = EPSG900913;
	CRS.EPSG4326 = EPSG4326;
	CRS.Simple = Simple;

	/*
	 * @class Layer
	 * @inherits Evented
	 * @aka L.Layer
	 * @aka ILayer
	 *
	 * A set of methods from the Layer base class that all Leaflet layers use.
	 * Inherits all methods, options and events from `L.Evented`.
	 *
	 * @example
	 *
	 * ```js
	 * var layer = L.marker(latlng).addTo(map);
	 * layer.addTo(map);
	 * layer.remove();
	 * ```
	 *
	 * @event add: Event
	 * Fired after the layer is added to a map
	 *
	 * @event remove: Event
	 * Fired after the layer is removed from a map
	 */


	var Layer = Evented.extend({

		// Classes extending `L.Layer` will inherit the following options:
		options: {
			// @option pane: String = 'overlayPane'
			// By default the layer will be added to the map's [overlay pane](#map-overlaypane). Overriding this option will cause the layer to be placed on another pane by default.
			pane: 'overlayPane',

			// @option attribution: String = null
			// String to be shown in the attribution control, e.g. "© OpenStreetMap contributors". It describes the layer data and is often a legal obligation towards copyright holders and tile providers.
			attribution: null,

			bubblingMouseEvents: true
		},

		/* @section
		 * Classes extending `L.Layer` will inherit the following methods:
		 *
		 * @method addTo(map: Map|LayerGroup): this
		 * Adds the layer to the given map or layer group.
		 */
		addTo: function (map) {
			map.addLayer(this);
			return this;
		},

		// @method remove: this
		// Removes the layer from the map it is currently active on.
		remove: function () {
			return this.removeFrom(this._map || this._mapToAdd);
		},

		// @method removeFrom(map: Map): this
		// Removes the layer from the given map
		//
		// @alternative
		// @method removeFrom(group: LayerGroup): this
		// Removes the layer from the given `LayerGroup`
		removeFrom: function (obj) {
			if (obj) {
				obj.removeLayer(this);
			}
			return this;
		},

		// @method getPane(name? : String): HTMLElement
		// Returns the `HTMLElement` representing the named pane on the map. If `name` is omitted, returns the pane for this layer.
		getPane: function (name) {
			return this._map.getPane(name ? (this.options[name] || name) : this.options.pane);
		},

		addInteractiveTarget: function (targetEl) {
			this._map._targets[stamp(targetEl)] = this;
			return this;
		},

		removeInteractiveTarget: function (targetEl) {
			delete this._map._targets[stamp(targetEl)];
			return this;
		},

		// @method getAttribution: String
		// Used by the `attribution control`, returns the [attribution option](#gridlayer-attribution).
		getAttribution: function () {
			return this.options.attribution;
		},

		_layerAdd: function (e) {
			var map = e.target;

			// check in case layer gets added and then removed before the map is ready
			if (!map.hasLayer(this)) { return; }

			this._map = map;
			this._zoomAnimated = map._zoomAnimated;

			if (this.getEvents) {
				var events = this.getEvents();
				map.on(events, this);
				this.once('remove', function () {
					map.off(events, this);
				}, this);
			}

			this.onAdd(map);

			if (this.getAttribution && map.attributionControl) {
				map.attributionControl.addAttribution(this.getAttribution());
			}

			this.fire('add');
			map.fire('layeradd', {layer: this});
		}
	});

	/* @section Extension methods
	 * @uninheritable
	 *
	 * Every layer should extend from `L.Layer` and (re-)implement the following methods.
	 *
	 * @method onAdd(map: Map): this
	 * Should contain code that creates DOM elements for the layer, adds them to `map panes` where they should belong and puts listeners on relevant map events. Called on [`map.addLayer(layer)`](#map-addlayer).
	 *
	 * @method onRemove(map: Map): this
	 * Should contain all clean up code that removes the layer's elements from the DOM and removes listeners previously added in [`onAdd`](#layer-onadd). Called on [`map.removeLayer(layer)`](#map-removelayer).
	 *
	 * @method getEvents(): Object
	 * This optional method should return an object like `{ viewreset: this._reset }` for [`addEventListener`](#evented-addeventlistener). The event handlers in this object will be automatically added and removed from the map with your layer.
	 *
	 * @method getAttribution(): String
	 * This optional method should return a string containing HTML to be shown on the `Attribution control` whenever the layer is visible.
	 *
	 * @method beforeAdd(map: Map): this
	 * Optional method. Called on [`map.addLayer(layer)`](#map-addlayer), before the layer is added to the map, before events are initialized, without waiting until the map is in a usable state. Use for early initialization only.
	 */


	/* @namespace Map
	 * @section Layer events
	 *
	 * @event layeradd: LayerEvent
	 * Fired when a new layer is added to the map.
	 *
	 * @event layerremove: LayerEvent
	 * Fired when some layer is removed from the map
	 *
	 * @section Methods for Layers and Controls
	 */
	Map.include({
		// @method addLayer(layer: Layer): this
		// Adds the given layer to the map
		addLayer: function (layer) {
			if (!layer._layerAdd) {
				throw new Error('The provided object is not a Layer.');
			}

			var id = stamp(layer);
			if (this._layers[id]) { return this; }
			this._layers[id] = layer;

			layer._mapToAdd = this;

			if (layer.beforeAdd) {
				layer.beforeAdd(this);
			}

			this.whenReady(layer._layerAdd, layer);

			return this;
		},

		// @method removeLayer(layer: Layer): this
		// Removes the given layer from the map.
		removeLayer: function (layer) {
			var id = stamp(layer);

			if (!this._layers[id]) { return this; }

			if (this._loaded) {
				layer.onRemove(this);
			}

			if (layer.getAttribution && this.attributionControl) {
				this.attributionControl.removeAttribution(layer.getAttribution());
			}

			delete this._layers[id];

			if (this._loaded) {
				this.fire('layerremove', {layer: layer});
				layer.fire('remove');
			}

			layer._map = layer._mapToAdd = null;

			return this;
		},

		// @method hasLayer(layer: Layer): Boolean
		// Returns `true` if the given layer is currently added to the map
		hasLayer: function (layer) {
			return !!layer && (stamp(layer) in this._layers);
		},

		/* @method eachLayer(fn: Function, context?: Object): this
		 * Iterates over the layers of the map, optionally specifying context of the iterator function.
		 * ```
		 * map.eachLayer(function(layer){
		 *     layer.bindPopup('Hello');
		 * });
		 * ```
		 */
		eachLayer: function (method, context) {
			for (var i in this._layers) {
				method.call(context, this._layers[i]);
			}
			return this;
		},

		_addLayers: function (layers) {
			layers = layers ? (isArray(layers) ? layers : [layers]) : [];

			for (var i = 0, len = layers.length; i < len; i++) {
				this.addLayer(layers[i]);
			}
		},

		_addZoomLimit: function (layer) {
			if (isNaN(layer.options.maxZoom) || !isNaN(layer.options.minZoom)) {
				this._zoomBoundLayers[stamp(layer)] = layer;
				this._updateZoomLevels();
			}
		},

		_removeZoomLimit: function (layer) {
			var id = stamp(layer);

			if (this._zoomBoundLayers[id]) {
				delete this._zoomBoundLayers[id];
				this._updateZoomLevels();
			}
		},

		_updateZoomLevels: function () {
			var minZoom = Infinity,
					maxZoom = -Infinity,
					oldZoomSpan = this._getZoomSpan();

			for (var i in this._zoomBoundLayers) {
				var options = this._zoomBoundLayers[i].options;

				minZoom = options.minZoom === undefined ? minZoom : Math.min(minZoom, options.minZoom);
				maxZoom = options.maxZoom === undefined ? maxZoom : Math.max(maxZoom, options.maxZoom);
			}

			this._layersMaxZoom = maxZoom === -Infinity ? undefined : maxZoom;
			this._layersMinZoom = minZoom === Infinity ? undefined : minZoom;

			// @section Map state change events
			// @event zoomlevelschange: Event
			// Fired when the number of zoomlevels on the map is changed due
			// to adding or removing a layer.
			if (oldZoomSpan !== this._getZoomSpan()) {
				this.fire('zoomlevelschange');
			}

			if (this.options.maxZoom === undefined && this._layersMaxZoom && this.getZoom() > this._layersMaxZoom) {
				this.setZoom(this._layersMaxZoom);
			}
			if (this.options.minZoom === undefined && this._layersMinZoom && this.getZoom() < this._layersMinZoom) {
				this.setZoom(this._layersMinZoom);
			}
		}
	});

	/*
	 * @class LayerGroup
	 * @aka L.LayerGroup
	 * @inherits Layer
	 *
	 * Used to group several layers and handle them as one. If you add it to the map,
	 * any layers added or removed from the group will be added/removed on the map as
	 * well. Extends `Layer`.
	 *
	 * @example
	 *
	 * ```js
	 * L.layerGroup([marker1, marker2])
	 * 	.addLayer(polyline)
	 * 	.addTo(map);
	 * ```
	 */

	var LayerGroup = Layer.extend({

		initialize: function (layers, options) {
			setOptions(this, options);

			this._layers = {};

			var i, len;

			if (layers) {
				for (i = 0, len = layers.length; i < len; i++) {
					this.addLayer(layers[i]);
				}
			}
		},

		// @method addLayer(layer: Layer): this
		// Adds the given layer to the group.
		addLayer: function (layer) {
			var id = this.getLayerId(layer);

			this._layers[id] = layer;

			if (this._map) {
				this._map.addLayer(layer);
			}

			return this;
		},

		// @method removeLayer(layer: Layer): this
		// Removes the given layer from the group.
		// @alternative
		// @method removeLayer(id: Number): this
		// Removes the layer with the given internal ID from the group.
		removeLayer: function (layer) {
			var id = layer in this._layers ? layer : this.getLayerId(layer);

			if (this._map && this._layers[id]) {
				this._map.removeLayer(this._layers[id]);
			}

			delete this._layers[id];

			return this;
		},

		// @method hasLayer(layer: Layer): Boolean
		// Returns `true` if the given layer is currently added to the group.
		// @alternative
		// @method hasLayer(id: Number): Boolean
		// Returns `true` if the given internal ID is currently added to the group.
		hasLayer: function (layer) {
			if (!layer) { return false; }
			var layerId = typeof layer === 'number' ? layer : this.getLayerId(layer);
			return layerId in this._layers;
		},

		// @method clearLayers(): this
		// Removes all the layers from the group.
		clearLayers: function () {
			return this.eachLayer(this.removeLayer, this);
		},

		// @method invoke(methodName: String, …): this
		// Calls `methodName` on every layer contained in this group, passing any
		// additional parameters. Has no effect if the layers contained do not
		// implement `methodName`.
		invoke: function (methodName) {
			var args = Array.prototype.slice.call(arguments, 1),
					i, layer;

			for (i in this._layers) {
				layer = this._layers[i];

				if (layer[methodName]) {
					layer[methodName].apply(layer, args);
				}
			}

			return this;
		},

		onAdd: function (map) {
			this.eachLayer(map.addLayer, map);
		},

		onRemove: function (map) {
			this.eachLayer(map.removeLayer, map);
		},

		// @method eachLayer(fn: Function, context?: Object): this
		// Iterates over the layers of the group, optionally specifying context of the iterator function.
		// ```js
		// group.eachLayer(function (layer) {
		// 	layer.bindPopup('Hello');
		// });
		// ```
		eachLayer: function (method, context) {
			for (var i in this._layers) {
				method.call(context, this._layers[i]);
			}
			return this;
		},

		// @method getLayer(id: Number): Layer
		// Returns the layer with the given internal ID.
		getLayer: function (id) {
			return this._layers[id];
		},

		// @method getLayers(): Layer[]
		// Returns an array of all the layers added to the group.
		getLayers: function () {
			var layers = [];
			this.eachLayer(layers.push, layers);
			return layers;
		},

		// @method setZIndex(zIndex: Number): this
		// Calls `setZIndex` on every layer contained in this group, passing the z-index.
		setZIndex: function (zIndex) {
			return this.invoke('setZIndex', zIndex);
		},

		// @method getLayerId(layer: Layer): Number
		// Returns the internal ID for a layer
		getLayerId: function (layer) {
			return stamp(layer);
		}
	});


	// @factory L.layerGroup(layers?: Layer[], options?: Object)
	// Create a layer group, optionally given an initial set of layers and an `options` object.
	var layerGroup = function (layers, options) {
		return new LayerGroup(layers, options);
	};

	/*
	 * @class FeatureGroup
	 * @aka L.FeatureGroup
	 * @inherits LayerGroup
	 *
	 * Extended `LayerGroup` that makes it easier to do the same thing to all its member layers:
	 *  * [`bindPopup`](#layer-bindpopup) binds a popup to all of the layers at once (likewise with [`bindTooltip`](#layer-bindtooltip))
	 *  * Events are propagated to the `FeatureGroup`, so if the group has an event
	 * handler, it will handle events from any of the layers. This includes mouse events
	 * and custom events.
	 *  * Has `layeradd` and `layerremove` events
	 *
	 * @example
	 *
	 * ```js
	 * L.featureGroup([marker1, marker2, polyline])
	 * 	.bindPopup('Hello world!')
	 * 	.on('click', function() { alert('Clicked on a member of the group!'); })
	 * 	.addTo(map);
	 * ```
	 */

	var FeatureGroup = LayerGroup.extend({

		addLayer: function (layer) {
			if (this.hasLayer(layer)) {
				return this;
			}

			layer.addEventParent(this);

			LayerGroup.prototype.addLayer.call(this, layer);

			// @event layeradd: LayerEvent
			// Fired when a layer is added to this `FeatureGroup`
			return this.fire('layeradd', {layer: layer});
		},

		removeLayer: function (layer) {
			if (!this.hasLayer(layer)) {
				return this;
			}
			if (layer in this._layers) {
				layer = this._layers[layer];
			}

			layer.removeEventParent(this);

			LayerGroup.prototype.removeLayer.call(this, layer);

			// @event layerremove: LayerEvent
			// Fired when a layer is removed from this `FeatureGroup`
			return this.fire('layerremove', {layer: layer});
		},

		// @method setStyle(style: Path options): this
		// Sets the given path options to each layer of the group that has a `setStyle` method.
		setStyle: function (style) {
			return this.invoke('setStyle', style);
		},

		// @method bringToFront(): this
		// Brings the layer group to the top of all other layers
		bringToFront: function () {
			return this.invoke('bringToFront');
		},

		// @method bringToBack(): this
		// Brings the layer group to the back of all other layers
		bringToBack: function () {
			return this.invoke('bringToBack');
		},

		// @method getBounds(): LatLngBounds
		// Returns the LatLngBounds of the Feature Group (created from bounds and coordinates of its children).
		getBounds: function () {
			var bounds = new LatLngBounds();

			for (var id in this._layers) {
				var layer = this._layers[id];
				bounds.extend(layer.getBounds ? layer.getBounds() : layer.getLatLng());
			}
			return bounds;
		}
	});

	// @factory L.featureGroup(layers?: Layer[], options?: Object)
	// Create a feature group, optionally given an initial set of layers and an `options` object.
	var featureGroup = function (layers, options) {
		return new FeatureGroup(layers, options);
	};

	/*
	 * @class Icon
	 * @aka L.Icon
	 *
	 * Represents an icon to provide when creating a marker.
	 *
	 * @example
	 *
	 * ```js
	 * var myIcon = L.icon({
	 *     iconUrl: 'my-icon.png',
	 *     iconRetinaUrl: 'my-icon@2x.png',
	 *     iconSize: [38, 95],
	 *     iconAnchor: [22, 94],
	 *     popupAnchor: [-3, -76],
	 *     shadowUrl: 'my-icon-shadow.png',
	 *     shadowRetinaUrl: 'my-icon-shadow@2x.png',
	 *     shadowSize: [68, 95],
	 *     shadowAnchor: [22, 94]
	 * });
	 *
	 * L.marker([50.505, 30.57], {icon: myIcon}).addTo(map);
	 * ```
	 *
	 * `L.Icon.Default` extends `L.Icon` and is the blue icon Leaflet uses for markers by default.
	 *
	 */

	var Icon = Class.extend({

		/* @section
		 * @aka Icon options
		 *
		 * @option iconUrl: String = null
		 * **(required)** The URL to the icon image (absolute or relative to your script path).
		 *
		 * @option iconRetinaUrl: String = null
		 * The URL to a retina sized version of the icon image (absolute or relative to your
		 * script path). Used for Retina screen devices.
		 *
		 * @option iconSize: Point = null
		 * Size of the icon image in pixels.
		 *
		 * @option iconAnchor: Point = null
		 * The coordinates of the "tip" of the icon (relative to its top left corner). The icon
		 * will be aligned so that this point is at the marker's geographical location. Centered
		 * by default if size is specified, also can be set in CSS with negative margins.
		 *
		 * @option popupAnchor: Point = [0, 0]
		 * The coordinates of the point from which popups will "open", relative to the icon anchor.
		 *
		 * @option tooltipAnchor: Point = [0, 0]
		 * The coordinates of the point from which tooltips will "open", relative to the icon anchor.
		 *
		 * @option shadowUrl: String = null
		 * The URL to the icon shadow image. If not specified, no shadow image will be created.
		 *
		 * @option shadowRetinaUrl: String = null
		 *
		 * @option shadowSize: Point = null
		 * Size of the shadow image in pixels.
		 *
		 * @option shadowAnchor: Point = null
		 * The coordinates of the "tip" of the shadow (relative to its top left corner) (the same
		 * as iconAnchor if not specified).
		 *
		 * @option className: String = ''
		 * A custom class name to assign to both icon and shadow images. Empty by default.
		 */

		options: {
			popupAnchor: [0, 0],
			tooltipAnchor: [0, 0]
		},

		initialize: function (options) {
			setOptions(this, options);
		},

		// @method createIcon(oldIcon?: HTMLElement): HTMLElement
		// Called internally when the icon has to be shown, returns a `<img>` HTML element
		// styled according to the options.
		createIcon: function (oldIcon) {
			return this._createIcon('icon', oldIcon);
		},

		// @method createShadow(oldIcon?: HTMLElement): HTMLElement
		// As `createIcon`, but for the shadow beneath it.
		createShadow: function (oldIcon) {
			return this._createIcon('shadow', oldIcon);
		},

		_createIcon: function (name, oldIcon) {
			var src = this._getIconUrl(name);

			if (!src) {
				if (name === 'icon') {
					throw new Error('iconUrl not set in Icon options (see the docs).');
				}
				return null;
			}

			var img = this._createImg(src, oldIcon && oldIcon.tagName === 'IMG' ? oldIcon : null);
			this._setIconStyles(img, name);

			return img;
		},

		_setIconStyles: function (img, name) {
			var options = this.options;
			var sizeOption = options[name + 'Size'];

			if (typeof sizeOption === 'number') {
				sizeOption = [sizeOption, sizeOption];
			}

			var size = toPoint(sizeOption),
					anchor = toPoint(name === 'shadow' && options.shadowAnchor || options.iconAnchor ||
									size && size.divideBy(2, true));

			img.className = 'leaflet-marker-' + name + ' ' + (options.className || '');

			if (anchor) {
				img.style.marginLeft = (-anchor.x) + 'px';
				img.style.marginTop  = (-anchor.y) + 'px';
			}

			if (size) {
				img.style.width  = size.x + 'px';
				img.style.height = size.y + 'px';
			}
		},

		_createImg: function (src, el) {
			el = el || document.createElement('img');
			el.src = src;
			return el;
		},

		_getIconUrl: function (name) {
			return retina && this.options[name + 'RetinaUrl'] || this.options[name + 'Url'];
		}
	});


	// @factory L.icon(options: Icon options)
	// Creates an icon instance with the given options.
	function icon(options) {
		return new Icon(options);
	}

	/*
	 * @miniclass Icon.Default (Icon)
	 * @aka L.Icon.Default
	 * @section
	 *
	 * A trivial subclass of `Icon`, represents the icon to use in `Marker`s when
	 * no icon is specified. Points to the blue marker image distributed with Leaflet
	 * releases.
	 *
	 * In order to customize the default icon, just change the properties of `L.Icon.Default.prototype.options`
	 * (which is a set of `Icon options`).
	 *
	 * If you want to _completely_ replace the default icon, override the
	 * `L.Marker.prototype.options.icon` with your own icon instead.
	 */

	var IconDefault = Icon.extend({

		options: {
			iconUrl:       'marker-icon.png',
			iconRetinaUrl: 'marker-icon-2x.png',
			shadowUrl:     'marker-shadow.png',
			iconSize:    [25, 41],
			iconAnchor:  [12, 41],
			popupAnchor: [1, -34],
			tooltipAnchor: [16, -28],
			shadowSize:  [41, 41]
		},

		_getIconUrl: function (name) {
			if (!IconDefault.imagePath) {	// Deprecated, backwards-compatibility only
				IconDefault.imagePath = this._detectIconPath();
			}

			// @option imagePath: String
			// `Icon.Default` will try to auto-detect the location of the
			// blue icon images. If you are placing these images in a non-standard
			// way, set this option to point to the right path.
			return (this.options.imagePath || IconDefault.imagePath) + Icon.prototype._getIconUrl.call(this, name);
		},

		_detectIconPath: function () {
			var el = create$1('div',  'leaflet-default-icon-path', document.body);
			var path = getStyle(el, 'background-image') ||
								 getStyle(el, 'backgroundImage');	// IE8

			document.body.removeChild(el);

			if (path === null || path.indexOf('url') !== 0) {
				path = '';
			} else {
				path = path.replace(/^url\(["']?/, '').replace(/marker-icon\.png["']?\)$/, '');
			}

			return path;
		}
	});

	/*
	 * L.Handler.MarkerDrag is used internally by L.Marker to make the markers draggable.
	 */


	/* @namespace Marker
	 * @section Interaction handlers
	 *
	 * Interaction handlers are properties of a marker instance that allow you to control interaction behavior in runtime, enabling or disabling certain features such as dragging (see `Handler` methods). Example:
	 *
	 * ```js
	 * marker.dragging.disable();
	 * ```
	 *
	 * @property dragging: Handler
	 * Marker dragging handler (by both mouse and touch). Only valid when the marker is on the map (Otherwise set [`marker.options.draggable`](#marker-draggable)).
	 */

	var MarkerDrag = Handler.extend({
		initialize: function (marker) {
			this._marker = marker;
		},

		addHooks: function () {
			var icon = this._marker._icon;

			if (!this._draggable) {
				this._draggable = new Draggable(icon, icon, true);
			}

			this._draggable.on({
				dragstart: this._onDragStart,
				predrag: this._onPreDrag,
				drag: this._onDrag,
				dragend: this._onDragEnd
			}, this).enable();

			addClass(icon, 'leaflet-marker-draggable');
		},

		removeHooks: function () {
			this._draggable.off({
				dragstart: this._onDragStart,
				predrag: this._onPreDrag,
				drag: this._onDrag,
				dragend: this._onDragEnd
			}, this).disable();

			if (this._marker._icon) {
				removeClass(this._marker._icon, 'leaflet-marker-draggable');
			}
		},

		moved: function () {
			return this._draggable && this._draggable._moved;
		},

		_adjustPan: function (e) {
			var marker = this._marker,
					map = marker._map,
					speed = this._marker.options.autoPanSpeed,
					padding = this._marker.options.autoPanPadding,
					iconPos = getPosition(marker._icon),
					bounds = map.getPixelBounds(),
					origin = map.getPixelOrigin();

			var panBounds = toBounds(
				bounds.min._subtract(origin).add(padding),
				bounds.max._subtract(origin).subtract(padding)
			);

			if (!panBounds.contains(iconPos)) {
				// Compute incremental movement
				var movement = toPoint(
					(Math.max(panBounds.max.x, iconPos.x) - panBounds.max.x) / (bounds.max.x - panBounds.max.x) -
					(Math.min(panBounds.min.x, iconPos.x) - panBounds.min.x) / (bounds.min.x - panBounds.min.x),

					(Math.max(panBounds.max.y, iconPos.y) - panBounds.max.y) / (bounds.max.y - panBounds.max.y) -
					(Math.min(panBounds.min.y, iconPos.y) - panBounds.min.y) / (bounds.min.y - panBounds.min.y)
				).multiplyBy(speed);

				map.panBy(movement, {animate: false});

				this._draggable._newPos._add(movement);
				this._draggable._startPos._add(movement);

				setPosition(marker._icon, this._draggable._newPos);
				this._onDrag(e);

				this._panRequest = requestAnimFrame(this._adjustPan.bind(this, e));
			}
		},

		_onDragStart: function () {
			// @section Dragging events
			// @event dragstart: Event
			// Fired when the user starts dragging the marker.

			// @event movestart: Event
			// Fired when the marker starts moving (because of dragging).

			this._oldLatLng = this._marker.getLatLng();

			// When using ES6 imports it could not be set when `Popup` was not imported as well
			this._marker.closePopup && this._marker.closePopup();

			this._marker
				.fire('movestart')
				.fire('dragstart');
		},

		_onPreDrag: function (e) {
			if (this._marker.options.autoPan) {
				cancelAnimFrame(this._panRequest);
				this._panRequest = requestAnimFrame(this._adjustPan.bind(this, e));
			}
		},

		_onDrag: function (e) {
			var marker = this._marker,
					shadow = marker._shadow,
					iconPos = getPosition(marker._icon),
					latlng = marker._map.layerPointToLatLng(iconPos);

			// update shadow position
			if (shadow) {
				setPosition(shadow, iconPos);
			}

			marker._latlng = latlng;
			e.latlng = latlng;
			e.oldLatLng = this._oldLatLng;

			// @event drag: Event
			// Fired repeatedly while the user drags the marker.
			marker
					.fire('move', e)
					.fire('drag', e);
		},

		_onDragEnd: function (e) {
			// @event dragend: DragEndEvent
			// Fired when the user stops dragging the marker.

			 cancelAnimFrame(this._panRequest);

			// @event moveend: Event
			// Fired when the marker stops moving (because of dragging).
			delete this._oldLatLng;
			this._marker
					.fire('moveend')
					.fire('dragend', e);
		}
	});

	/*
	 * @class Marker
	 * @inherits Interactive layer
	 * @aka L.Marker
	 * L.Marker is used to display clickable/draggable icons on the map. Extends `Layer`.
	 *
	 * @example
	 *
	 * ```js
	 * L.marker([50.5, 30.5]).addTo(map);
	 * ```
	 */

	var Marker = Layer.extend({

		// @section
		// @aka Marker options
		options: {
			// @option icon: Icon = *
			// Icon instance to use for rendering the marker.
			// See [Icon documentation](#L.Icon) for details on how to customize the marker icon.
			// If not specified, a common instance of `L.Icon.Default` is used.
			icon: new IconDefault(),

			// Option inherited from "Interactive layer" abstract class
			interactive: true,

			// @option keyboard: Boolean = true
			// Whether the marker can be tabbed to with a keyboard and clicked by pressing enter.
			keyboard: true,

			// @option title: String = ''
			// Text for the browser tooltip that appear on marker hover (no tooltip by default).
			title: '',

			// @option alt: String = ''
			// Text for the `alt` attribute of the icon image (useful for accessibility).
			alt: '',

			// @option zIndexOffset: Number = 0
			// By default, marker images zIndex is set automatically based on its latitude. Use this option if you want to put the marker on top of all others (or below), specifying a high value like `1000` (or high negative value, respectively).
			zIndexOffset: 0,

			// @option opacity: Number = 1.0
			// The opacity of the marker.
			opacity: 1,

			// @option riseOnHover: Boolean = false
			// If `true`, the marker will get on top of others when you hover the mouse over it.
			riseOnHover: false,

			// @option riseOffset: Number = 250
			// The z-index offset used for the `riseOnHover` feature.
			riseOffset: 250,

			// @option pane: String = 'markerPane'
			// `Map pane` where the markers icon will be added.
			pane: 'markerPane',

			// @option shadowPane: String = 'shadowPane'
			// `Map pane` where the markers shadow will be added.
			shadowPane: 'shadowPane',

			// @option bubblingMouseEvents: Boolean = false
			// When `true`, a mouse event on this marker will trigger the same event on the map
			// (unless [`L.DomEvent.stopPropagation`](#domevent-stoppropagation) is used).
			bubblingMouseEvents: false,

			// @section Draggable marker options
			// @option draggable: Boolean = false
			// Whether the marker is draggable with mouse/touch or not.
			draggable: false,

			// @option autoPan: Boolean = false
			// Whether to pan the map when dragging this marker near its edge or not.
			autoPan: false,

			// @option autoPanPadding: Point = Point(50, 50)
			// Distance (in pixels to the left/right and to the top/bottom) of the
			// map edge to start panning the map.
			autoPanPadding: [50, 50],

			// @option autoPanSpeed: Number = 10
			// Number of pixels the map should pan by.
			autoPanSpeed: 10
		},

		/* @section
		 *
		 * In addition to [shared layer methods](#Layer) like `addTo()` and `remove()` and [popup methods](#Popup) like bindPopup() you can also use the following methods:
		 */

		initialize: function (latlng, options) {
			setOptions(this, options);
			this._latlng = toLatLng(latlng);
		},

		onAdd: function (map) {
			this._zoomAnimated = this._zoomAnimated && map.options.markerZoomAnimation;

			if (this._zoomAnimated) {
				map.on('zoomanim', this._animateZoom, this);
			}

			this._initIcon();
			this.update();
		},

		onRemove: function (map) {
			if (this.dragging && this.dragging.enabled()) {
				this.options.draggable = true;
				this.dragging.removeHooks();
			}
			delete this.dragging;

			if (this._zoomAnimated) {
				map.off('zoomanim', this._animateZoom, this);
			}

			this._removeIcon();
			this._removeShadow();
		},

		getEvents: function () {
			return {
				zoom: this.update,
				viewreset: this.update
			};
		},

		// @method getLatLng: LatLng
		// Returns the current geographical position of the marker.
		getLatLng: function () {
			return this._latlng;
		},

		// @method setLatLng(latlng: LatLng): this
		// Changes the marker position to the given point.
		setLatLng: function (latlng) {
			var oldLatLng = this._latlng;
			this._latlng = toLatLng(latlng);
			this.update();

			// @event move: Event
			// Fired when the marker is moved via [`setLatLng`](#marker-setlatlng) or by [dragging](#marker-dragging). Old and new coordinates are included in event arguments as `oldLatLng`, `latlng`.
			return this.fire('move', {oldLatLng: oldLatLng, latlng: this._latlng});
		},

		// @method setZIndexOffset(offset: Number): this
		// Changes the [zIndex offset](#marker-zindexoffset) of the marker.
		setZIndexOffset: function (offset) {
			this.options.zIndexOffset = offset;
			return this.update();
		},

		// @method getIcon: Icon
		// Returns the current icon used by the marker
		getIcon: function () {
			return this.options.icon;
		},

		// @method setIcon(icon: Icon): this
		// Changes the marker icon.
		setIcon: function (icon) {

			this.options.icon = icon;

			if (this._map) {
				this._initIcon();
				this.update();
			}

			if (this._popup) {
				this.bindPopup(this._popup, this._popup.options);
			}

			return this;
		},

		getElement: function () {
			return this._icon;
		},

		update: function () {

			if (this._icon && this._map) {
				var pos = this._map.latLngToLayerPoint(this._latlng).round();
				this._setPos(pos);
			}

			return this;
		},

		_initIcon: function () {
			var options = this.options,
					classToAdd = 'leaflet-zoom-' + (this._zoomAnimated ? 'animated' : 'hide');

			var icon = options.icon.createIcon(this._icon),
					addIcon = false;

			// if we're not reusing the icon, remove the old one and init new one
			if (icon !== this._icon) {
				if (this._icon) {
					this._removeIcon();
				}
				addIcon = true;

				if (options.title) {
					icon.title = options.title;
				}

				if (icon.tagName === 'IMG') {
					icon.alt = options.alt || '';
				}
			}

			addClass(icon, classToAdd);

			if (options.keyboard) {
				icon.tabIndex = '0';
			}

			this._icon = icon;

			if (options.riseOnHover) {
				this.on({
					mouseover: this._bringToFront,
					mouseout: this._resetZIndex
				});
			}

			var newShadow = options.icon.createShadow(this._shadow),
					addShadow = false;

			if (newShadow !== this._shadow) {
				this._removeShadow();
				addShadow = true;
			}

			if (newShadow) {
				addClass(newShadow, classToAdd);
				newShadow.alt = '';
			}
			this._shadow = newShadow;


			if (options.opacity < 1) {
				this._updateOpacity();
			}


			if (addIcon) {
				this.getPane().appendChild(this._icon);
			}
			this._initInteraction();
			if (newShadow && addShadow) {
				this.getPane(options.shadowPane).appendChild(this._shadow);
			}
		},

		_removeIcon: function () {
			if (this.options.riseOnHover) {
				this.off({
					mouseover: this._bringToFront,
					mouseout: this._resetZIndex
				});
			}

			remove(this._icon);
			this.removeInteractiveTarget(this._icon);

			this._icon = null;
		},

		_removeShadow: function () {
			if (this._shadow) {
				remove(this._shadow);
			}
			this._shadow = null;
		},

		_setPos: function (pos) {

			if (this._icon) {
				setPosition(this._icon, pos);
			}

			if (this._shadow) {
				setPosition(this._shadow, pos);
			}

			this._zIndex = pos.y + this.options.zIndexOffset;

			this._resetZIndex();
		},

		_updateZIndex: function (offset) {
			if (this._icon) {
				this._icon.style.zIndex = this._zIndex + offset;
			}
		},

		_animateZoom: function (opt) {
			var pos = this._map._latLngToNewLayerPoint(this._latlng, opt.zoom, opt.center).round();

			this._setPos(pos);
		},

		_initInteraction: function () {

			if (!this.options.interactive) { return; }

			addClass(this._icon, 'leaflet-interactive');

			this.addInteractiveTarget(this._icon);

			if (MarkerDrag) {
				var draggable = this.options.draggable;
				if (this.dragging) {
					draggable = this.dragging.enabled();
					this.dragging.disable();
				}

				this.dragging = new MarkerDrag(this);

				if (draggable) {
					this.dragging.enable();
				}
			}
		},

		// @method setOpacity(opacity: Number): this
		// Changes the opacity of the marker.
		setOpacity: function (opacity) {
			this.options.opacity = opacity;
			if (this._map) {
				this._updateOpacity();
			}

			return this;
		},

		_updateOpacity: function () {
			var opacity = this.options.opacity;

			if (this._icon) {
				setOpacity(this._icon, opacity);
			}

			if (this._shadow) {
				setOpacity(this._shadow, opacity);
			}
		},

		_bringToFront: function () {
			this._updateZIndex(this.options.riseOffset);
		},

		_resetZIndex: function () {
			this._updateZIndex(0);
		},

		_getPopupAnchor: function () {
			return this.options.icon.options.popupAnchor;
		},

		_getTooltipAnchor: function () {
			return this.options.icon.options.tooltipAnchor;
		}
	});


	// factory L.marker(latlng: LatLng, options? : Marker options)

	// @factory L.marker(latlng: LatLng, options? : Marker options)
	// Instantiates a Marker object given a geographical point and optionally an options object.
	function marker(latlng, options) {
		return new Marker(latlng, options);
	}

	/*
	 * @class Path
	 * @aka L.Path
	 * @inherits Interactive layer
	 *
	 * An abstract class that contains options and constants shared between vector
	 * overlays (Polygon, Polyline, Circle). Do not use it directly. Extends `Layer`.
	 */

	var Path = Layer.extend({

		// @section
		// @aka Path options
		options: {
			// @option stroke: Boolean = true
			// Whether to draw stroke along the path. Set it to `false` to disable borders on polygons or circles.
			stroke: true,

			// @option color: String = '#3388ff'
			// Stroke color
			color: '#3388ff',

			// @option weight: Number = 3
			// Stroke width in pixels
			weight: 3,

			// @option opacity: Number = 1.0
			// Stroke opacity
			opacity: 1,

			// @option lineCap: String= 'round'
			// A string that defines [shape to be used at the end](https://developer.mozilla.org/docs/Web/SVG/Attribute/stroke-linecap) of the stroke.
			lineCap: 'round',

			// @option lineJoin: String = 'round'
			// A string that defines [shape to be used at the corners](https://developer.mozilla.org/docs/Web/SVG/Attribute/stroke-linejoin) of the stroke.
			lineJoin: 'round',

			// @option dashArray: String = null
			// A string that defines the stroke [dash pattern](https://developer.mozilla.org/docs/Web/SVG/Attribute/stroke-dasharray). Doesn't work on `Canvas`-powered layers in [some old browsers](https://developer.mozilla.org/docs/Web/API/CanvasRenderingContext2D/setLineDash#Browser_compatibility).
			dashArray: null,

			// @option dashOffset: String = null
			// A string that defines the [distance into the dash pattern to start the dash](https://developer.mozilla.org/docs/Web/SVG/Attribute/stroke-dashoffset). Doesn't work on `Canvas`-powered layers in [some old browsers](https://developer.mozilla.org/docs/Web/API/CanvasRenderingContext2D/setLineDash#Browser_compatibility).
			dashOffset: null,

			// @option fill: Boolean = depends
			// Whether to fill the path with color. Set it to `false` to disable filling on polygons or circles.
			fill: false,

			// @option fillColor: String = *
			// Fill color. Defaults to the value of the [`color`](#path-color) option
			fillColor: null,

			// @option fillOpacity: Number = 0.2
			// Fill opacity.
			fillOpacity: 0.2,

			// @option fillRule: String = 'evenodd'
			// A string that defines [how the inside of a shape](https://developer.mozilla.org/docs/Web/SVG/Attribute/fill-rule) is determined.
			fillRule: 'evenodd',

			// className: '',

			// Option inherited from "Interactive layer" abstract class
			interactive: true,

			// @option bubblingMouseEvents: Boolean = true
			// When `true`, a mouse event on this path will trigger the same event on the map
			// (unless [`L.DomEvent.stopPropagation`](#domevent-stoppropagation) is used).
			bubblingMouseEvents: true
		},

		beforeAdd: function (map) {
			// Renderer is set here because we need to call renderer.getEvents
			// before this.getEvents.
			this._renderer = map.getRenderer(this);
		},

		onAdd: function () {
			this._renderer._initPath(this);
			this._reset();
			this._renderer._addPath(this);
		},

		onRemove: function () {
			this._renderer._removePath(this);
		},

		// @method redraw(): this
		// Redraws the layer. Sometimes useful after you changed the coordinates that the path uses.
		redraw: function () {
			if (this._map) {
				this._renderer._updatePath(this);
			}
			return this;
		},

		// @method setStyle(style: Path options): this
		// Changes the appearance of a Path based on the options in the `Path options` object.
		setStyle: function (style) {
			setOptions(this, style);
			if (this._renderer) {
				this._renderer._updateStyle(this);
				if (this.options.stroke && style && Object.prototype.hasOwnProperty.call(style, 'weight')) {
					this._updateBounds();
				}
			}
			return this;
		},

		// @method bringToFront(): this
		// Brings the layer to the top of all path layers.
		bringToFront: function () {
			if (this._renderer) {
				this._renderer._bringToFront(this);
			}
			return this;
		},

		// @method bringToBack(): this
		// Brings the layer to the bottom of all path layers.
		bringToBack: function () {
			if (this._renderer) {
				this._renderer._bringToBack(this);
			}
			return this;
		},

		getElement: function () {
			return this._path;
		},

		_reset: function () {
			// defined in child classes
			this._project();
			this._update();
		},

		_clickTolerance: function () {
			// used when doing hit detection for Canvas layers
			return (this.options.stroke ? this.options.weight / 2 : 0) + this._renderer.options.tolerance;
		}
	});

	/*
	 * @class CircleMarker
	 * @aka L.CircleMarker
	 * @inherits Path
	 *
	 * A circle of a fixed size with radius specified in pixels. Extends `Path`.
	 */

	var CircleMarker = Path.extend({

		// @section
		// @aka CircleMarker options
		options: {
			fill: true,

			// @option radius: Number = 10
			// Radius of the circle marker, in pixels
			radius: 10
		},

		initialize: function (latlng, options) {
			setOptions(this, options);
			this._latlng = toLatLng(latlng);
			this._radius = this.options.radius;
		},

		// @method setLatLng(latLng: LatLng): this
		// Sets the position of a circle marker to a new location.
		setLatLng: function (latlng) {
			var oldLatLng = this._latlng;
			this._latlng = toLatLng(latlng);
			this.redraw();

			// @event move: Event
			// Fired when the marker is moved via [`setLatLng`](#circlemarker-setlatlng). Old and new coordinates are included in event arguments as `oldLatLng`, `latlng`.
			return this.fire('move', {oldLatLng: oldLatLng, latlng: this._latlng});
		},

		// @method getLatLng(): LatLng
		// Returns the current geographical position of the circle marker
		getLatLng: function () {
			return this._latlng;
		},

		// @method setRadius(radius: Number): this
		// Sets the radius of a circle marker. Units are in pixels.
		setRadius: function (radius) {
			this.options.radius = this._radius = radius;
			return this.redraw();
		},

		// @method getRadius(): Number
		// Returns the current radius of the circle
		getRadius: function () {
			return this._radius;
		},

		setStyle : function (options) {
			var radius = options && options.radius || this._radius;
			Path.prototype.setStyle.call(this, options);
			this.setRadius(radius);
			return this;
		},

		_project: function () {
			this._point = this._map.latLngToLayerPoint(this._latlng);
			this._updateBounds();
		},

		_updateBounds: function () {
			var r = this._radius,
					r2 = this._radiusY || r,
					w = this._clickTolerance(),
					p = [r + w, r2 + w];
			this._pxBounds = new Bounds(this._point.subtract(p), this._point.add(p));
		},

		_update: function () {
			if (this._map) {
				this._updatePath();
			}
		},

		_updatePath: function () {
			this._renderer._updateCircle(this);
		},

		_empty: function () {
			return this._radius && !this._renderer._bounds.intersects(this._pxBounds);
		},

		// Needed by the `Canvas` renderer for interactivity
		_containsPoint: function (p) {
			return p.distanceTo(this._point) <= this._radius + this._clickTolerance();
		}
	});


	// @factory L.circleMarker(latlng: LatLng, options?: CircleMarker options)
	// Instantiates a circle marker object given a geographical point, and an optional options object.
	function circleMarker(latlng, options) {
		return new CircleMarker(latlng, options);
	}

	/*
	 * @class Circle
	 * @aka L.Circle
	 * @inherits CircleMarker
	 *
	 * A class for drawing circle overlays on a map. Extends `CircleMarker`.
	 *
	 * It's an approximation and starts to diverge from a real circle closer to poles (due to projection distortion).
	 *
	 * @example
	 *
	 * ```js
	 * L.circle([50.5, 30.5], {radius: 200}).addTo(map);
	 * ```
	 */

	var Circle = CircleMarker.extend({

		initialize: function (latlng, options, legacyOptions) {
			if (typeof options === 'number') {
				// Backwards compatibility with 0.7.x factory (latlng, radius, options?)
				options = extend({}, legacyOptions, {radius: options});
			}
			setOptions(this, options);
			this._latlng = toLatLng(latlng);

			if (isNaN(this.options.radius)) { throw new Error('Circle radius cannot be NaN'); }

			// @section
			// @aka Circle options
			// @option radius: Number; Radius of the circle, in meters.
			this._mRadius = this.options.radius;
		},

		// @method setRadius(radius: Number): this
		// Sets the radius of a circle. Units are in meters.
		setRadius: function (radius) {
			this._mRadius = radius;
			return this.redraw();
		},

		// @method getRadius(): Number
		// Returns the current radius of a circle. Units are in meters.
		getRadius: function () {
			return this._mRadius;
		},

		// @method getBounds(): LatLngBounds
		// Returns the `LatLngBounds` of the path.
		getBounds: function () {
			var half = [this._radius, this._radiusY || this._radius];

			return new LatLngBounds(
				this._map.layerPointToLatLng(this._point.subtract(half)),
				this._map.layerPointToLatLng(this._point.add(half)));
		},

		setStyle: Path.prototype.setStyle,

		_project: function () {

			var lng = this._latlng.lng,
					lat = this._latlng.lat,
					map = this._map,
					crs = map.options.crs;

			if (crs.distance === Earth.distance) {
				var d = Math.PI / 180,
						latR = (this._mRadius / Earth.R) / d,
						top = map.project([lat + latR, lng]),
						bottom = map.project([lat - latR, lng]),
						p = top.add(bottom).divideBy(2),
						lat2 = map.unproject(p).lat,
						lngR = Math.acos((Math.cos(latR * d) - Math.sin(lat * d) * Math.sin(lat2 * d)) /
										(Math.cos(lat * d) * Math.cos(lat2 * d))) / d;

				if (isNaN(lngR) || lngR === 0) {
					lngR = latR / Math.cos(Math.PI / 180 * lat); // Fallback for edge case, #2425
				}

				this._point = p.subtract(map.getPixelOrigin());
				this._radius = isNaN(lngR) ? 0 : p.x - map.project([lat2, lng - lngR]).x;
				this._radiusY = p.y - top.y;

			} else {
				var latlng2 = crs.unproject(crs.project(this._latlng).subtract([this._mRadius, 0]));

				this._point = map.latLngToLayerPoint(this._latlng);
				this._radius = this._point.x - map.latLngToLayerPoint(latlng2).x;
			}

			this._updateBounds();
		}
	});

	// @factory L.circle(latlng: LatLng, options?: Circle options)
	// Instantiates a circle object given a geographical point, and an options object
	// which contains the circle radius.
	// @alternative
	// @factory L.circle(latlng: LatLng, radius: Number, options?: Circle options)
	// Obsolete way of instantiating a circle, for compatibility with 0.7.x code.
	// Do not use in new applications or plugins.
	function circle(latlng, options, legacyOptions) {
		return new Circle(latlng, options, legacyOptions);
	}

	/*
	 * @class Polyline
	 * @aka L.Polyline
	 * @inherits Path
	 *
	 * A class for drawing polyline overlays on a map. Extends `Path`.
	 *
	 * @example
	 *
	 * ```js
	 * // create a red polyline from an array of LatLng points
	 * var latlngs = [
	 * 	[45.51, -122.68],
	 * 	[37.77, -122.43],
	 * 	[34.04, -118.2]
	 * ];
	 *
	 * var polyline = L.polyline(latlngs, {color: 'red'}).addTo(map);
	 *
	 * // zoom the map to the polyline
	 * map.fitBounds(polyline.getBounds());
	 * ```
	 *
	 * You can also pass a multi-dimensional array to represent a `MultiPolyline` shape:
	 *
	 * ```js
	 * // create a red polyline from an array of arrays of LatLng points
	 * var latlngs = [
	 * 	[[45.51, -122.68],
	 * 	 [37.77, -122.43],
	 * 	 [34.04, -118.2]],
	 * 	[[40.78, -73.91],
	 * 	 [41.83, -87.62],
	 * 	 [32.76, -96.72]]
	 * ];
	 * ```
	 */


	var Polyline = Path.extend({

		// @section
		// @aka Polyline options
		options: {
			// @option smoothFactor: Number = 1.0
			// How much to simplify the polyline on each zoom level. More means
			// better performance and smoother look, and less means more accurate representation.
			smoothFactor: 1.0,

			// @option noClip: Boolean = false
			// Disable polyline clipping.
			noClip: false
		},

		initialize: function (latlngs, options) {
			setOptions(this, options);
			this._setLatLngs(latlngs);
		},

		// @method getLatLngs(): LatLng[]
		// Returns an array of the points in the path, or nested arrays of points in case of multi-polyline.
		getLatLngs: function () {
			return this._latlngs;
		},

		// @method setLatLngs(latlngs: LatLng[]): this
		// Replaces all the points in the polyline with the given array of geographical points.
		setLatLngs: function (latlngs) {
			this._setLatLngs(latlngs);
			return this.redraw();
		},

		// @method isEmpty(): Boolean
		// Returns `true` if the Polyline has no LatLngs.
		isEmpty: function () {
			return !this._latlngs.length;
		},

		// @method closestLayerPoint(p: Point): Point
		// Returns the point closest to `p` on the Polyline.
		closestLayerPoint: function (p) {
			var minDistance = Infinity,
					minPoint = null,
					closest = _sqClosestPointOnSegment,
					p1, p2;

			for (var j = 0, jLen = this._parts.length; j < jLen; j++) {
				var points = this._parts[j];

				for (var i = 1, len = points.length; i < len; i++) {
					p1 = points[i - 1];
					p2 = points[i];

					var sqDist = closest(p, p1, p2, true);

					if (sqDist < minDistance) {
						minDistance = sqDist;
						minPoint = closest(p, p1, p2);
					}
				}
			}
			if (minPoint) {
				minPoint.distance = Math.sqrt(minDistance);
			}
			return minPoint;
		},

		// @method getCenter(): LatLng
		// Returns the center ([centroid](http://en.wikipedia.org/wiki/Centroid)) of the polyline.
		getCenter: function () {
			// throws error when not yet added to map as this center calculation requires projected coordinates
			if (!this._map) {
				throw new Error('Must add layer to map before using getCenter()');
			}

			var i, halfDist, segDist, dist, p1, p2, ratio,
					points = this._rings[0],
					len = points.length;

			if (!len) { return null; }

			// polyline centroid algorithm; only uses the first ring if there are multiple

			for (i = 0, halfDist = 0; i < len - 1; i++) {
				halfDist += points[i].distanceTo(points[i + 1]) / 2;
			}

			// The line is so small in the current view that all points are on the same pixel.
			if (halfDist === 0) {
				return this._map.layerPointToLatLng(points[0]);
			}

			for (i = 0, dist = 0; i < len - 1; i++) {
				p1 = points[i];
				p2 = points[i + 1];
				segDist = p1.distanceTo(p2);
				dist += segDist;

				if (dist > halfDist) {
					ratio = (dist - halfDist) / segDist;
					return this._map.layerPointToLatLng([
						p2.x - ratio * (p2.x - p1.x),
						p2.y - ratio * (p2.y - p1.y)
					]);
				}
			}
		},

		// @method getBounds(): LatLngBounds
		// Returns the `LatLngBounds` of the path.
		getBounds: function () {
			return this._bounds;
		},

		// @method addLatLng(latlng: LatLng, latlngs?: LatLng[]): this
		// Adds a given point to the polyline. By default, adds to the first ring of
		// the polyline in case of a multi-polyline, but can be overridden by passing
		// a specific ring as a LatLng array (that you can earlier access with [`getLatLngs`](#polyline-getlatlngs)).
		addLatLng: function (latlng, latlngs) {
			latlngs = latlngs || this._defaultShape();
			latlng = toLatLng(latlng);
			latlngs.push(latlng);
			this._bounds.extend(latlng);
			return this.redraw();
		},

		_setLatLngs: function (latlngs) {
			this._bounds = new LatLngBounds();
			this._latlngs = this._convertLatLngs(latlngs);
		},

		_defaultShape: function () {
			return isFlat(this._latlngs) ? this._latlngs : this._latlngs[0];
		},

		// recursively convert latlngs input into actual LatLng instances; calculate bounds along the way
		_convertLatLngs: function (latlngs) {
			var result = [],
					flat = isFlat(latlngs);

			for (var i = 0, len = latlngs.length; i < len; i++) {
				if (flat) {
					result[i] = toLatLng(latlngs[i]);
					this._bounds.extend(result[i]);
				} else {
					result[i] = this._convertLatLngs(latlngs[i]);
				}
			}

			return result;
		},

		_project: function () {
			var pxBounds = new Bounds();
			this._rings = [];
			this._projectLatlngs(this._latlngs, this._rings, pxBounds);

			if (this._bounds.isValid() && pxBounds.isValid()) {
				this._rawPxBounds = pxBounds;
				this._updateBounds();
			}
		},

		_updateBounds: function () {
			var w = this._clickTolerance(),
					p = new Point(w, w);
			this._pxBounds = new Bounds([
				this._rawPxBounds.min.subtract(p),
				this._rawPxBounds.max.add(p)
			]);
		},

		// recursively turns latlngs into a set of rings with projected coordinates
		_projectLatlngs: function (latlngs, result, projectedBounds) {
			var flat = latlngs[0] instanceof LatLng,
					len = latlngs.length,
					i, ring;

			if (flat) {
				ring = [];
				for (i = 0; i < len; i++) {
					ring[i] = this._map.latLngToLayerPoint(latlngs[i]);
					projectedBounds.extend(ring[i]);
				}
				result.push(ring);
			} else {
				for (i = 0; i < len; i++) {
					this._projectLatlngs(latlngs[i], result, projectedBounds);
				}
			}
		},

		// clip polyline by renderer bounds so that we have less to render for performance
		_clipPoints: function () {
			var bounds = this._renderer._bounds;

			this._parts = [];
			if (!this._pxBounds || !this._pxBounds.intersects(bounds)) {
				return;
			}

			if (this.options.noClip) {
				this._parts = this._rings;
				return;
			}

			var parts = this._parts,
					i, j, k, len, len2, segment, points;

			for (i = 0, k = 0, len = this._rings.length; i < len; i++) {
				points = this._rings[i];

				for (j = 0, len2 = points.length; j < len2 - 1; j++) {
					segment = clipSegment(points[j], points[j + 1], bounds, j, true);

					if (!segment) { continue; }

					parts[k] = parts[k] || [];
					parts[k].push(segment[0]);

					// if segment goes out of screen, or it's the last one, it's the end of the line part
					if ((segment[1] !== points[j + 1]) || (j === len2 - 2)) {
						parts[k].push(segment[1]);
						k++;
					}
				}
			}
		},

		// simplify each clipped part of the polyline for performance
		_simplifyPoints: function () {
			var parts = this._parts,
					tolerance = this.options.smoothFactor;

			for (var i = 0, len = parts.length; i < len; i++) {
				parts[i] = simplify(parts[i], tolerance);
			}
		},

		_update: function () {
			if (!this._map) { return; }

			this._clipPoints();
			this._simplifyPoints();
			this._updatePath();
		},

		_updatePath: function () {
			this._renderer._updatePoly(this);
		},

		// Needed by the `Canvas` renderer for interactivity
		_containsPoint: function (p, closed) {
			var i, j, k, len, len2, part,
					w = this._clickTolerance();

			if (!this._pxBounds || !this._pxBounds.contains(p)) { return false; }

			// hit detection for polylines
			for (i = 0, len = this._parts.length; i < len; i++) {
				part = this._parts[i];

				for (j = 0, len2 = part.length, k = len2 - 1; j < len2; k = j++) {
					if (!closed && (j === 0)) { continue; }

					if (pointToSegmentDistance(p, part[k], part[j]) <= w) {
						return true;
					}
				}
			}
			return false;
		}
	});

	// @factory L.polyline(latlngs: LatLng[], options?: Polyline options)
	// Instantiates a polyline object given an array of geographical points and
	// optionally an options object. You can create a `Polyline` object with
	// multiple separate lines (`MultiPolyline`) by passing an array of arrays
	// of geographic points.
	function polyline(latlngs, options) {
		return new Polyline(latlngs, options);
	}

	// Retrocompat. Allow plugins to support Leaflet versions before and after 1.1.
	Polyline._flat = _flat;

	/*
	 * @class Polygon
	 * @aka L.Polygon
	 * @inherits Polyline
	 *
	 * A class for drawing polygon overlays on a map. Extends `Polyline`.
	 *
	 * Note that points you pass when creating a polygon shouldn't have an additional last point equal to the first one — it's better to filter out such points.
	 *
	 *
	 * @example
	 *
	 * ```js
	 * // create a red polygon from an array of LatLng points
	 * var latlngs = [[37, -109.05],[41, -109.03],[41, -102.05],[37, -102.04]];
	 *
	 * var polygon = L.polygon(latlngs, {color: 'red'}).addTo(map);
	 *
	 * // zoom the map to the polygon
	 * map.fitBounds(polygon.getBounds());
	 * ```
	 *
	 * You can also pass an array of arrays of latlngs, with the first array representing the outer shape and the other arrays representing holes in the outer shape:
	 *
	 * ```js
	 * var latlngs = [
	 *   [[37, -109.05],[41, -109.03],[41, -102.05],[37, -102.04]], // outer ring
	 *   [[37.29, -108.58],[40.71, -108.58],[40.71, -102.50],[37.29, -102.50]] // hole
	 * ];
	 * ```
	 *
	 * Additionally, you can pass a multi-dimensional array to represent a MultiPolygon shape.
	 *
	 * ```js
	 * var latlngs = [
	 *   [ // first polygon
	 *     [[37, -109.05],[41, -109.03],[41, -102.05],[37, -102.04]], // outer ring
	 *     [[37.29, -108.58],[40.71, -108.58],[40.71, -102.50],[37.29, -102.50]] // hole
	 *   ],
	 *   [ // second polygon
	 *     [[41, -111.03],[45, -111.04],[45, -104.05],[41, -104.05]]
	 *   ]
	 * ];
	 * ```
	 */

	var Polygon = Polyline.extend({

		options: {
			fill: true
		},

		isEmpty: function () {
			return !this._latlngs.length || !this._latlngs[0].length;
		},

		getCenter: function () {
			// throws error when not yet added to map as this center calculation requires projected coordinates
			if (!this._map) {
				throw new Error('Must add layer to map before using getCenter()');
			}

			var i, j, p1, p2, f, area, x, y, center,
					points = this._rings[0],
					len = points.length;

			if (!len) { return null; }

			// polygon centroid algorithm; only uses the first ring if there are multiple

			area = x = y = 0;

			for (i = 0, j = len - 1; i < len; j = i++) {
				p1 = points[i];
				p2 = points[j];

				f = p1.y * p2.x - p2.y * p1.x;
				x += (p1.x + p2.x) * f;
				y += (p1.y + p2.y) * f;
				area += f * 3;
			}

			if (area === 0) {
				// Polygon is so small that all points are on same pixel.
				center = points[0];
			} else {
				center = [x / area, y / area];
			}
			return this._map.layerPointToLatLng(center);
		},

		_convertLatLngs: function (latlngs) {
			var result = Polyline.prototype._convertLatLngs.call(this, latlngs),
					len = result.length;

			// remove last point if it equals first one
			if (len >= 2 && result[0] instanceof LatLng && result[0].equals(result[len - 1])) {
				result.pop();
			}
			return result;
		},

		_setLatLngs: function (latlngs) {
			Polyline.prototype._setLatLngs.call(this, latlngs);
			if (isFlat(this._latlngs)) {
				this._latlngs = [this._latlngs];
			}
		},

		_defaultShape: function () {
			return isFlat(this._latlngs[0]) ? this._latlngs[0] : this._latlngs[0][0];
		},

		_clipPoints: function () {
			// polygons need a different clipping algorithm so we redefine that

			var bounds = this._renderer._bounds,
					w = this.options.weight,
					p = new Point(w, w);

			// increase clip padding by stroke width to avoid stroke on clip edges
			bounds = new Bounds(bounds.min.subtract(p), bounds.max.add(p));

			this._parts = [];
			if (!this._pxBounds || !this._pxBounds.intersects(bounds)) {
				return;
			}

			if (this.options.noClip) {
				this._parts = this._rings;
				return;
			}

			for (var i = 0, len = this._rings.length, clipped; i < len; i++) {
				clipped = clipPolygon(this._rings[i], bounds, true);
				if (clipped.length) {
					this._parts.push(clipped);
				}
			}
		},

		_updatePath: function () {
			this._renderer._updatePoly(this, true);
		},

		// Needed by the `Canvas` renderer for interactivity
		_containsPoint: function (p) {
			var inside = false,
					part, p1, p2, i, j, k, len, len2;

			if (!this._pxBounds || !this._pxBounds.contains(p)) { return false; }

			// ray casting algorithm for detecting if point is in polygon
			for (i = 0, len = this._parts.length; i < len; i++) {
				part = this._parts[i];

				for (j = 0, len2 = part.length, k = len2 - 1; j < len2; k = j++) {
					p1 = part[j];
					p2 = part[k];

					if (((p1.y > p.y) !== (p2.y > p.y)) && (p.x < (p2.x - p1.x) * (p.y - p1.y) / (p2.y - p1.y) + p1.x)) {
						inside = !inside;
					}
				}
			}

			// also check if it's on polygon stroke
			return inside || Polyline.prototype._containsPoint.call(this, p, true);
		}

	});


	// @factory L.polygon(latlngs: LatLng[], options?: Polyline options)
	function polygon(latlngs, options) {
		return new Polygon(latlngs, options);
	}

	/*
	 * @class GeoJSON
	 * @aka L.GeoJSON
	 * @inherits FeatureGroup
	 *
	 * Represents a GeoJSON object or an array of GeoJSON objects. Allows you to parse
	 * GeoJSON data and display it on the map. Extends `FeatureGroup`.
	 *
	 * @example
	 *
	 * ```js
	 * L.geoJSON(data, {
	 * 	style: function (feature) {
	 * 		return {color: feature.properties.color};
	 * 	}
	 * }).bindPopup(function (layer) {
	 * 	return layer.feature.properties.description;
	 * }).addTo(map);
	 * ```
	 */

	var GeoJSON = FeatureGroup.extend({

		/* @section
		 * @aka GeoJSON options
		 *
		 * @option pointToLayer: Function = *
		 * A `Function` defining how GeoJSON points spawn Leaflet layers. It is internally
		 * called when data is added, passing the GeoJSON point feature and its `LatLng`.
		 * The default is to spawn a default `Marker`:
		 * ```js
		 * function(geoJsonPoint, latlng) {
		 * 	return L.marker(latlng);
		 * }
		 * ```
		 *
		 * @option style: Function = *
		 * A `Function` defining the `Path options` for styling GeoJSON lines and polygons,
		 * called internally when data is added.
		 * The default value is to not override any defaults:
		 * ```js
		 * function (geoJsonFeature) {
		 * 	return {}
		 * }
		 * ```
		 *
		 * @option onEachFeature: Function = *
		 * A `Function` that will be called once for each created `Feature`, after it has
		 * been created and styled. Useful for attaching events and popups to features.
		 * The default is to do nothing with the newly created layers:
		 * ```js
		 * function (feature, layer) {}
		 * ```
		 *
		 * @option filter: Function = *
		 * A `Function` that will be used to decide whether to include a feature or not.
		 * The default is to include all features:
		 * ```js
		 * function (geoJsonFeature) {
		 * 	return true;
		 * }
		 * ```
		 * Note: dynamically changing the `filter` option will have effect only on newly
		 * added data. It will _not_ re-evaluate already included features.
		 *
		 * @option coordsToLatLng: Function = *
		 * A `Function` that will be used for converting GeoJSON coordinates to `LatLng`s.
		 * The default is the `coordsToLatLng` static method.
		 *
		 * @option markersInheritOptions: Boolean = false
		 * Whether default Markers for "Point" type Features inherit from group options.
		 */

		initialize: function (geojson, options) {
			setOptions(this, options);

			this._layers = {};

			if (geojson) {
				this.addData(geojson);
			}
		},

		// @method addData( <GeoJSON> data ): this
		// Adds a GeoJSON object to the layer.
		addData: function (geojson) {
			var features = isArray(geojson) ? geojson : geojson.features,
					i, len, feature;

			if (features) {
				for (i = 0, len = features.length; i < len; i++) {
					// only add this if geometry or geometries are set and not null
					feature = features[i];
					if (feature.geometries || feature.geometry || feature.features || feature.coordinates) {
						this.addData(feature);
					}
				}
				return this;
			}

			var options = this.options;

			if (options.filter && !options.filter(geojson)) { return this; }

			var layer = geometryToLayer(geojson, options);
			if (!layer) {
				return this;
			}
			layer.feature = asFeature(geojson);

			layer.defaultOptions = layer.options;
			this.resetStyle(layer);

			if (options.onEachFeature) {
				options.onEachFeature(geojson, layer);
			}

			return this.addLayer(layer);
		},

		// @method resetStyle( <Path> layer? ): this
		// Resets the given vector layer's style to the original GeoJSON style, useful for resetting style after hover events.
		// If `layer` is omitted, the style of all features in the current layer is reset.
		resetStyle: function (layer) {
			if (layer === undefined) {
				return this.eachLayer(this.resetStyle, this);
			}
			// reset any custom styles
			layer.options = extend({}, layer.defaultOptions);
			this._setLayerStyle(layer, this.options.style);
			return this;
		},

		// @method setStyle( <Function> style ): this
		// Changes styles of GeoJSON vector layers with the given style function.
		setStyle: function (style) {
			return this.eachLayer(function (layer) {
				this._setLayerStyle(layer, style);
			}, this);
		},

		_setLayerStyle: function (layer, style) {
			if (layer.setStyle) {
				if (typeof style === 'function') {
					style = style(layer.feature);
				}
				layer.setStyle(style);
			}
		}
	});

	// @section
	// There are several static functions which can be called without instantiating L.GeoJSON:

	// @function geometryToLayer(featureData: Object, options?: GeoJSON options): Layer
	// Creates a `Layer` from a given GeoJSON feature. Can use a custom
	// [`pointToLayer`](#geojson-pointtolayer) and/or [`coordsToLatLng`](#geojson-coordstolatlng)
	// functions if provided as options.
	function geometryToLayer(geojson, options) {

		var geometry = geojson.type === 'Feature' ? geojson.geometry : geojson,
				coords = geometry ? geometry.coordinates : null,
				layers = [],
				pointToLayer = options && options.pointToLayer,
				_coordsToLatLng = options && options.coordsToLatLng || coordsToLatLng,
				latlng, latlngs, i, len;

		if (!coords && !geometry) {
			return null;
		}

		switch (geometry.type) {
		case 'Point':
			latlng = _coordsToLatLng(coords);
			return _pointToLayer(pointToLayer, geojson, latlng, options);

		case 'MultiPoint':
			for (i = 0, len = coords.length; i < len; i++) {
				latlng = _coordsToLatLng(coords[i]);
				layers.push(_pointToLayer(pointToLayer, geojson, latlng, options));
			}
			return new FeatureGroup(layers);

		case 'LineString':
		case 'MultiLineString':
			latlngs = coordsToLatLngs(coords, geometry.type === 'LineString' ? 0 : 1, _coordsToLatLng);
			return new Polyline(latlngs, options);

		case 'Polygon':
		case 'MultiPolygon':
			latlngs = coordsToLatLngs(coords, geometry.type === 'Polygon' ? 1 : 2, _coordsToLatLng);
			return new Polygon(latlngs, options);

		case 'GeometryCollection':
			for (i = 0, len = geometry.geometries.length; i < len; i++) {
				var layer = geometryToLayer({
					geometry: geometry.geometries[i],
					type: 'Feature',
					properties: geojson.properties
				}, options);

				if (layer) {
					layers.push(layer);
				}
			}
			return new FeatureGroup(layers);

		default:
			throw new Error('Invalid GeoJSON object.');
		}
	}

	function _pointToLayer(pointToLayerFn, geojson, latlng, options) {
		return pointToLayerFn ?
			pointToLayerFn(geojson, latlng) :
			new Marker(latlng, options && options.markersInheritOptions && options);
	}

	// @function coordsToLatLng(coords: Array): LatLng
	// Creates a `LatLng` object from an array of 2 numbers (longitude, latitude)
	// or 3 numbers (longitude, latitude, altitude) used in GeoJSON for points.
	function coordsToLatLng(coords) {
		return new LatLng(coords[1], coords[0], coords[2]);
	}

	// @function coordsToLatLngs(coords: Array, levelsDeep?: Number, coordsToLatLng?: Function): Array
	// Creates a multidimensional array of `LatLng`s from a GeoJSON coordinates array.
	// `levelsDeep` specifies the nesting level (0 is for an array of points, 1 for an array of arrays of points, etc., 0 by default).
	// Can use a custom [`coordsToLatLng`](#geojson-coordstolatlng) function.
	function coordsToLatLngs(coords, levelsDeep, _coordsToLatLng) {
		var latlngs = [];

		for (var i = 0, len = coords.length, latlng; i < len; i++) {
			latlng = levelsDeep ?
				coordsToLatLngs(coords[i], levelsDeep - 1, _coordsToLatLng) :
				(_coordsToLatLng || coordsToLatLng)(coords[i]);

			latlngs.push(latlng);
		}

		return latlngs;
	}

	// @function latLngToCoords(latlng: LatLng, precision?: Number): Array
	// Reverse of [`coordsToLatLng`](#geojson-coordstolatlng)
	function latLngToCoords(latlng, precision) {
		precision = typeof precision === 'number' ? precision : 6;
		return latlng.alt !== undefined ?
			[formatNum(latlng.lng, precision), formatNum(latlng.lat, precision), formatNum(latlng.alt, precision)] :
			[formatNum(latlng.lng, precision), formatNum(latlng.lat, precision)];
	}

	// @function latLngsToCoords(latlngs: Array, levelsDeep?: Number, closed?: Boolean): Array
	// Reverse of [`coordsToLatLngs`](#geojson-coordstolatlngs)
	// `closed` determines whether the first point should be appended to the end of the array to close the feature, only used when `levelsDeep` is 0. False by default.
	function latLngsToCoords(latlngs, levelsDeep, closed, precision) {
		var coords = [];

		for (var i = 0, len = latlngs.length; i < len; i++) {
			coords.push(levelsDeep ?
				latLngsToCoords(latlngs[i], levelsDeep - 1, closed, precision) :
				latLngToCoords(latlngs[i], precision));
		}

		if (!levelsDeep && closed) {
			coords.push(coords[0]);
		}

		return coords;
	}

	function getFeature(layer, newGeometry) {
		return layer.feature ?
			extend({}, layer.feature, {geometry: newGeometry}) :
			asFeature(newGeometry);
	}

	// @function asFeature(geojson: Object): Object
	// Normalize GeoJSON geometries/features into GeoJSON features.
	function asFeature(geojson) {
		if (geojson.type === 'Feature' || geojson.type === 'FeatureCollection') {
			return geojson;
		}

		return {
			type: 'Feature',
			properties: {},
			geometry: geojson
		};
	}

	var PointToGeoJSON = {
		toGeoJSON: function (precision) {
			return getFeature(this, {
				type: 'Point',
				coordinates: latLngToCoords(this.getLatLng(), precision)
			});
		}
	};

	// @namespace Marker
	// @section Other methods
	// @method toGeoJSON(precision?: Number): Object
	// `precision` is the number of decimal places for coordinates.
	// The default value is 6 places.
	// Returns a [`GeoJSON`](http://en.wikipedia.org/wiki/GeoJSON) representation of the marker (as a GeoJSON `Point` Feature).
	Marker.include(PointToGeoJSON);

	// @namespace CircleMarker
	// @method toGeoJSON(precision?: Number): Object
	// `precision` is the number of decimal places for coordinates.
	// The default value is 6 places.
	// Returns a [`GeoJSON`](http://en.wikipedia.org/wiki/GeoJSON) representation of the circle marker (as a GeoJSON `Point` Feature).
	Circle.include(PointToGeoJSON);
	CircleMarker.include(PointToGeoJSON);


	// @namespace Polyline
	// @method toGeoJSON(precision?: Number): Object
	// `precision` is the number of decimal places for coordinates.
	// The default value is 6 places.
	// Returns a [`GeoJSON`](http://en.wikipedia.org/wiki/GeoJSON) representation of the polyline (as a GeoJSON `LineString` or `MultiLineString` Feature).
	Polyline.include({
		toGeoJSON: function (precision) {
			var multi = !isFlat(this._latlngs);

			var coords = latLngsToCoords(this._latlngs, multi ? 1 : 0, false, precision);

			return getFeature(this, {
				type: (multi ? 'Multi' : '') + 'LineString',
				coordinates: coords
			});
		}
	});

	// @namespace Polygon
	// @method toGeoJSON(precision?: Number): Object
	// `precision` is the number of decimal places for coordinates.
	// The default value is 6 places.
	// Returns a [`GeoJSON`](http://en.wikipedia.org/wiki/GeoJSON) representation of the polygon (as a GeoJSON `Polygon` or `MultiPolygon` Feature).
	Polygon.include({
		toGeoJSON: function (precision) {
			var holes = !isFlat(this._latlngs),
					multi = holes && !isFlat(this._latlngs[0]);

			var coords = latLngsToCoords(this._latlngs, multi ? 2 : holes ? 1 : 0, true, precision);

			if (!holes) {
				coords = [coords];
			}

			return getFeature(this, {
				type: (multi ? 'Multi' : '') + 'Polygon',
				coordinates: coords
			});
		}
	});


	// @namespace LayerGroup
	LayerGroup.include({
		toMultiPoint: function (precision) {
			var coords = [];

			this.eachLayer(function (layer) {
				coords.push(layer.toGeoJSON(precision).geometry.coordinates);
			});

			return getFeature(this, {
				type: 'MultiPoint',
				coordinates: coords
			});
		},

		// @method toGeoJSON(precision?: Number): Object
		// `precision` is the number of decimal places for coordinates.
		// The default value is 6 places.
		// Returns a [`GeoJSON`](http://en.wikipedia.org/wiki/GeoJSON) representation of the layer group (as a GeoJSON `FeatureCollection`, `GeometryCollection`, or `MultiPoint`).
		toGeoJSON: function (precision) {

			var type = this.feature && this.feature.geometry && this.feature.geometry.type;

			if (type === 'MultiPoint') {
				return this.toMultiPoint(precision);
			}

			var isGeometryCollection = type === 'GeometryCollection',
					jsons = [];

			this.eachLayer(function (layer) {
				if (layer.toGeoJSON) {
					var json = layer.toGeoJSON(precision);
					if (isGeometryCollection) {
						jsons.push(json.geometry);
					} else {
						var feature = asFeature(json);
						// Squash nested feature collections
						if (feature.type === 'FeatureCollection') {
							jsons.push.apply(jsons, feature.features);
						} else {
							jsons.push(feature);
						}
					}
				}
			});

			if (isGeometryCollection) {
				return getFeature(this, {
					geometries: jsons,
					type: 'GeometryCollection'
				});
			}

			return {
				type: 'FeatureCollection',
				features: jsons
			};
		}
	});

	// @namespace GeoJSON
	// @factory L.geoJSON(geojson?: Object, options?: GeoJSON options)
	// Creates a GeoJSON layer. Optionally accepts an object in
	// [GeoJSON format](https://tools.ietf.org/html/rfc7946) to display on the map
	// (you can alternatively add it later with `addData` method) and an `options` object.
	function geoJSON(geojson, options) {
		return new GeoJSON(geojson, options);
	}

	// Backward compatibility.
	var geoJson = geoJSON;

	/*
	 * @class ImageOverlay
	 * @aka L.ImageOverlay
	 * @inherits Interactive layer
	 *
	 * Used to load and display a single image over specific bounds of the map. Extends `Layer`.
	 *
	 * @example
	 *
	 * ```js
	 * var imageUrl = 'http://www.lib.utexas.edu/maps/historical/newark_nj_1922.jpg',
	 * 	imageBounds = [[40.712216, -74.22655], [40.773941, -74.12544]];
	 * L.imageOverlay(imageUrl, imageBounds).addTo(map);
	 * ```
	 */

	var ImageOverlay = Layer.extend({

		// @section
		// @aka ImageOverlay options
		options: {
			// @option opacity: Number = 1.0
			// The opacity of the image overlay.
			opacity: 1,

			// @option alt: String = ''
			// Text for the `alt` attribute of the image (useful for accessibility).
			alt: '',

			// @option interactive: Boolean = false
			// If `true`, the image overlay will emit [mouse events](#interactive-layer) when clicked or hovered.
			interactive: false,

			// @option crossOrigin: Boolean|String = false
			// Whether the crossOrigin attribute will be added to the image.
			// If a String is provided, the image will have its crossOrigin attribute set to the String provided. This is needed if you want to access image pixel data.
			// Refer to [CORS Settings](https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_settings_attributes) for valid String values.
			crossOrigin: false,

			// @option errorOverlayUrl: String = ''
			// URL to the overlay image to show in place of the overlay that failed to load.
			errorOverlayUrl: '',

			// @option zIndex: Number = 1
			// The explicit [zIndex](https://developer.mozilla.org/docs/Web/CSS/CSS_Positioning/Understanding_z_index) of the overlay layer.
			zIndex: 1,

			// @option className: String = ''
			// A custom class name to assign to the image. Empty by default.
			className: ''
		},

		initialize: function (url, bounds, options) { // (String, LatLngBounds, Object)
			this._url = url;
			this._bounds = toLatLngBounds(bounds);

			setOptions(this, options);
		},

		onAdd: function () {
			if (!this._image) {
				this._initImage();

				if (this.options.opacity < 1) {
					this._updateOpacity();
				}
			}

			if (this.options.interactive) {
				addClass(this._image, 'leaflet-interactive');
				this.addInteractiveTarget(this._image);
			}

			this.getPane().appendChild(this._image);
			this._reset();
		},

		onRemove: function () {
			remove(this._image);
			if (this.options.interactive) {
				this.removeInteractiveTarget(this._image);
			}
		},

		// @method setOpacity(opacity: Number): this
		// Sets the opacity of the overlay.
		setOpacity: function (opacity) {
			this.options.opacity = opacity;

			if (this._image) {
				this._updateOpacity();
			}
			return this;
		},

		setStyle: function (styleOpts) {
			if (styleOpts.opacity) {
				this.setOpacity(styleOpts.opacity);
			}
			return this;
		},

		// @method bringToFront(): this
		// Brings the layer to the top of all overlays.
		bringToFront: function () {
			if (this._map) {
				toFront(this._image);
			}
			return this;
		},

		// @method bringToBack(): this
		// Brings the layer to the bottom of all overlays.
		bringToBack: function () {
			if (this._map) {
				toBack(this._image);
			}
			return this;
		},

		// @method setUrl(url: String): this
		// Changes the URL of the image.
		setUrl: function (url) {
			this._url = url;

			if (this._image) {
				this._image.src = url;
			}
			return this;
		},

		// @method setBounds(bounds: LatLngBounds): this
		// Update the bounds that this ImageOverlay covers
		setBounds: function (bounds) {
			this._bounds = toLatLngBounds(bounds);

			if (this._map) {
				this._reset();
			}
			return this;
		},

		getEvents: function () {
			var events = {
				zoom: this._reset,
				viewreset: this._reset
			};

			if (this._zoomAnimated) {
				events.zoomanim = this._animateZoom;
			}

			return events;
		},

		// @method setZIndex(value: Number): this
		// Changes the [zIndex](#imageoverlay-zindex) of the image overlay.
		setZIndex: function (value) {
			this.options.zIndex = value;
			this._updateZIndex();
			return this;
		},

		// @method getBounds(): LatLngBounds
		// Get the bounds that this ImageOverlay covers
		getBounds: function () {
			return this._bounds;
		},

		// @method getElement(): HTMLElement
		// Returns the instance of [`HTMLImageElement`](https://developer.mozilla.org/docs/Web/API/HTMLImageElement)
		// used by this overlay.
		getElement: function () {
			return this._image;
		},

		_initImage: function () {
			var wasElementSupplied = this._url.tagName === 'IMG';
			var img = this._image = wasElementSupplied ? this._url : create$1('img');

			addClass(img, 'leaflet-image-layer');
			if (this._zoomAnimated) { addClass(img, 'leaflet-zoom-animated'); }
			if (this.options.className) { addClass(img, this.options.className); }

			img.onselectstart = falseFn;
			img.onmousemove = falseFn;

			// @event load: Event
			// Fired when the ImageOverlay layer has loaded its image
			img.onload = bind(this.fire, this, 'load');
			img.onerror = bind(this._overlayOnError, this, 'error');

			if (this.options.crossOrigin || this.options.crossOrigin === '') {
				img.crossOrigin = this.options.crossOrigin === true ? '' : this.options.crossOrigin;
			}

			if (this.options.zIndex) {
				this._updateZIndex();
			}

			if (wasElementSupplied) {
				this._url = img.src;
				return;
			}

			img.src = this._url;
			img.alt = this.options.alt;
		},

		_animateZoom: function (e) {
			var scale = this._map.getZoomScale(e.zoom),
					offset = this._map._latLngBoundsToNewLayerBounds(this._bounds, e.zoom, e.center).min;

			setTransform(this._image, offset, scale);
		},

		_reset: function () {
			var image = this._image,
					bounds = new Bounds(
							this._map.latLngToLayerPoint(this._bounds.getNorthWest()),
							this._map.latLngToLayerPoint(this._bounds.getSouthEast())),
					size = bounds.getSize();

			setPosition(image, bounds.min);

			image.style.width  = size.x + 'px';
			image.style.height = size.y + 'px';
		},

		_updateOpacity: function () {
			setOpacity(this._image, this.options.opacity);
		},

		_updateZIndex: function () {
			if (this._image && this.options.zIndex !== undefined && this.options.zIndex !== null) {
				this._image.style.zIndex = this.options.zIndex;
			}
		},

		_overlayOnError: function () {
			// @event error: Event
			// Fired when the ImageOverlay layer fails to load its image
			this.fire('error');

			var errorUrl = this.options.errorOverlayUrl;
			if (errorUrl && this._url !== errorUrl) {
				this._url = errorUrl;
				this._image.src = errorUrl;
			}
		}
	});

	// @factory L.imageOverlay(imageUrl: String, bounds: LatLngBounds, options?: ImageOverlay options)
	// Instantiates an image overlay object given the URL of the image and the
	// geographical bounds it is tied to.
	var imageOverlay = function (url, bounds, options) {
		return new ImageOverlay(url, bounds, options);
	};

	/*
	 * @class VideoOverlay
	 * @aka L.VideoOverlay
	 * @inherits ImageOverlay
	 *
	 * Used to load and display a video player over specific bounds of the map. Extends `ImageOverlay`.
	 *
	 * A video overlay uses the [`<video>`](https://developer.mozilla.org/docs/Web/HTML/Element/video)
	 * HTML5 element.
	 *
	 * @example
	 *
	 * ```js
	 * var videoUrl = 'https://www.mapbox.com/bites/00188/patricia_nasa.webm',
	 * 	videoBounds = [[ 32, -130], [ 13, -100]];
	 * L.videoOverlay(videoUrl, videoBounds ).addTo(map);
	 * ```
	 */

	var VideoOverlay = ImageOverlay.extend({

		// @section
		// @aka VideoOverlay options
		options: {
			// @option autoplay: Boolean = true
			// Whether the video starts playing automatically when loaded.
			autoplay: true,

			// @option loop: Boolean = true
			// Whether the video will loop back to the beginning when played.
			loop: true,

			// @option keepAspectRatio: Boolean = true
			// Whether the video will save aspect ratio after the projection.
			// Relevant for supported browsers. Browser compatibility- https://developer.mozilla.org/en-US/docs/Web/CSS/object-fit
			keepAspectRatio: true,

			// @option muted: Boolean = false
			// Whether the video starts on mute when loaded.
			muted: false
		},

		_initImage: function () {
			var wasElementSupplied = this._url.tagName === 'VIDEO';
			var vid = this._image = wasElementSupplied ? this._url : create$1('video');

			addClass(vid, 'leaflet-image-layer');
			if (this._zoomAnimated) { addClass(vid, 'leaflet-zoom-animated'); }
			if (this.options.className) { addClass(vid, this.options.className); }

			vid.onselectstart = falseFn;
			vid.onmousemove = falseFn;

			// @event load: Event
			// Fired when the video has finished loading the first frame
			vid.onloadeddata = bind(this.fire, this, 'load');

			if (wasElementSupplied) {
				var sourceElements = vid.getElementsByTagName('source');
				var sources = [];
				for (var j = 0; j < sourceElements.length; j++) {
					sources.push(sourceElements[j].src);
				}

				this._url = (sourceElements.length > 0) ? sources : [vid.src];
				return;
			}

			if (!isArray(this._url)) { this._url = [this._url]; }

			if (!this.options.keepAspectRatio && Object.prototype.hasOwnProperty.call(vid.style, 'objectFit')) {
				vid.style['objectFit'] = 'fill';
			}
			vid.autoplay = !!this.options.autoplay;
			vid.loop = !!this.options.loop;
			vid.muted = !!this.options.muted;
			for (var i = 0; i < this._url.length; i++) {
				var source = create$1('source');
				source.src = this._url[i];
				vid.appendChild(source);
			}
		}

		// @method getElement(): HTMLVideoElement
		// Returns the instance of [`HTMLVideoElement`](https://developer.mozilla.org/docs/Web/API/HTMLVideoElement)
		// used by this overlay.
	});


	// @factory L.videoOverlay(video: String|Array|HTMLVideoElement, bounds: LatLngBounds, options?: VideoOverlay options)
	// Instantiates an image overlay object given the URL of the video (or array of URLs, or even a video element) and the
	// geographical bounds it is tied to.

	function videoOverlay(video, bounds, options) {
		return new VideoOverlay(video, bounds, options);
	}

	/*
	 * @class SVGOverlay
	 * @aka L.SVGOverlay
	 * @inherits ImageOverlay
	 *
	 * Used to load, display and provide DOM access to an SVG file over specific bounds of the map. Extends `ImageOverlay`.
	 *
	 * An SVG overlay uses the [`<svg>`](https://developer.mozilla.org/docs/Web/SVG/Element/svg) element.
	 *
	 * @example
	 *
	 * ```js
	 * var svgElement = document.createElementNS("http://www.w3.org/2000/svg", "svg");
	 * svgElement.setAttribute('xmlns', "http://www.w3.org/2000/svg");
	 * svgElement.setAttribute('viewBox', "0 0 200 200");
	 * svgElement.innerHTML = '<rect width="200" height="200"/><rect x="75" y="23" width="50" height="50" style="fill:red"/><rect x="75" y="123" width="50" height="50" style="fill:#0013ff"/>';
	 * var svgElementBounds = [ [ 32, -130 ], [ 13, -100 ] ];
	 * L.svgOverlay(svgElement, svgElementBounds).addTo(map);
	 * ```
	 */

	var SVGOverlay = ImageOverlay.extend({
		_initImage: function () {
			var el = this._image = this._url;

			addClass(el, 'leaflet-image-layer');
			if (this._zoomAnimated) { addClass(el, 'leaflet-zoom-animated'); }
			if (this.options.className) { addClass(el, this.options.className); }

			el.onselectstart = falseFn;
			el.onmousemove = falseFn;
		}

		// @method getElement(): SVGElement
		// Returns the instance of [`SVGElement`](https://developer.mozilla.org/docs/Web/API/SVGElement)
		// used by this overlay.
	});


	// @factory L.svgOverlay(svg: String|SVGElement, bounds: LatLngBounds, options?: SVGOverlay options)
	// Instantiates an image overlay object given an SVG element and the geographical bounds it is tied to.
	// A viewBox attribute is required on the SVG element to zoom in and out properly.

	function svgOverlay(el, bounds, options) {
		return new SVGOverlay(el, bounds, options);
	}

	/*
	 * @class DivOverlay
	 * @inherits Layer
	 * @aka L.DivOverlay
	 * Base model for L.Popup and L.Tooltip. Inherit from it for custom popup like plugins.
	 */

	// @namespace DivOverlay
	var DivOverlay = Layer.extend({

		// @section
		// @aka DivOverlay options
		options: {
			// @option offset: Point = Point(0, 7)
			// The offset of the popup position. Useful to control the anchor
			// of the popup when opening it on some overlays.
			offset: [0, 7],

			// @option className: String = ''
			// A custom CSS class name to assign to the popup.
			className: '',

			// @option pane: String = 'popupPane'
			// `Map pane` where the popup will be added.
			pane: 'popupPane'
		},

		initialize: function (options, source) {
			setOptions(this, options);

			this._source = source;
		},

		onAdd: function (map) {
			this._zoomAnimated = map._zoomAnimated;

			if (!this._container) {
				this._initLayout();
			}

			if (map._fadeAnimated) {
				setOpacity(this._container, 0);
			}

			clearTimeout(this._removeTimeout);
			this.getPane().appendChild(this._container);
			this.update();

			if (map._fadeAnimated) {
				setOpacity(this._container, 1);
			}

			this.bringToFront();
		},

		onRemove: function (map) {
			if (map._fadeAnimated) {
				setOpacity(this._container, 0);
				this._removeTimeout = setTimeout(bind(remove, undefined, this._container), 200);
			} else {
				remove(this._container);
			}
		},

		// @namespace Popup
		// @method getLatLng: LatLng
		// Returns the geographical point of popup.
		getLatLng: function () {
			return this._latlng;
		},

		// @method setLatLng(latlng: LatLng): this
		// Sets the geographical point where the popup will open.
		setLatLng: function (latlng) {
			this._latlng = toLatLng(latlng);
			if (this._map) {
				this._updatePosition();
				this._adjustPan();
			}
			return this;
		},

		// @method getContent: String|HTMLElement
		// Returns the content of the popup.
		getContent: function () {
			return this._content;
		},

		// @method setContent(htmlContent: String|HTMLElement|Function): this
		// Sets the HTML content of the popup. If a function is passed the source layer will be passed to the function. The function should return a `String` or `HTMLElement` to be used in the popup.
		setContent: function (content) {
			this._content = content;
			this.update();
			return this;
		},

		// @method getElement: String|HTMLElement
		// Returns the HTML container of the popup.
		getElement: function () {
			return this._container;
		},

		// @method update: null
		// Updates the popup content, layout and position. Useful for updating the popup after something inside changed, e.g. image loaded.
		update: function () {
			if (!this._map) { return; }

			this._container.style.visibility = 'hidden';

			this._updateContent();
			this._updateLayout();
			this._updatePosition();

			this._container.style.visibility = '';

			this._adjustPan();
		},

		getEvents: function () {
			var events = {
				zoom: this._updatePosition,
				viewreset: this._updatePosition
			};

			if (this._zoomAnimated) {
				events.zoomanim = this._animateZoom;
			}
			return events;
		},

		// @method isOpen: Boolean
		// Returns `true` when the popup is visible on the map.
		isOpen: function () {
			return !!this._map && this._map.hasLayer(this);
		},

		// @method bringToFront: this
		// Brings this popup in front of other popups (in the same map pane).
		bringToFront: function () {
			if (this._map) {
				toFront(this._container);
			}
			return this;
		},

		// @method bringToBack: this
		// Brings this popup to the back of other popups (in the same map pane).
		bringToBack: function () {
			if (this._map) {
				toBack(this._container);
			}
			return this;
		},

		_prepareOpen: function (parent, layer, latlng) {
			if (!(layer instanceof Layer)) {
				latlng = layer;
				layer = parent;
			}

			if (layer instanceof FeatureGroup) {
				for (var id in parent._layers) {
					layer = parent._layers[id];
					break;
				}
			}

			if (!latlng) {
				if (layer.getCenter) {
					latlng = layer.getCenter();
				} else if (layer.getLatLng) {
					latlng = layer.getLatLng();
				} else {
					throw new Error('Unable to get source layer LatLng.');
				}
			}

			// set overlay source to this layer
			this._source = layer;

			// update the overlay (content, layout, ect...)
			this.update();

			return latlng;
		},

		_updateContent: function () {
			if (!this._content) { return; }

			var node = this._contentNode;
			var content = (typeof this._content === 'function') ? this._content(this._source || this) : this._content;

			if (typeof content === 'string') {
				node.innerHTML = content;
			} else {
				while (node.hasChildNodes()) {
					node.removeChild(node.firstChild);
				}
				node.appendChild(content);
			}
			this.fire('contentupdate');
		},

		_updatePosition: function () {
			if (!this._map) { return; }

			var pos = this._map.latLngToLayerPoint(this._latlng),
					offset = toPoint(this.options.offset),
					anchor = this._getAnchor();

			if (this._zoomAnimated) {
				setPosition(this._container, pos.add(anchor));
			} else {
				offset = offset.add(pos).add(anchor);
			}

			var bottom = this._containerBottom = -offset.y,
					left = this._containerLeft = -Math.round(this._containerWidth / 2) + offset.x;

			// bottom position the popup in case the height of the popup changes (images loading etc)
			this._container.style.bottom = bottom + 'px';
			this._container.style.left = left + 'px';
		},

		_getAnchor: function () {
			return [0, 0];
		}

	});

	/*
	 * @class Popup
	 * @inherits DivOverlay
	 * @aka L.Popup
	 * Used to open popups in certain places of the map. Use [Map.openPopup](#map-openpopup) to
	 * open popups while making sure that only one popup is open at one time
	 * (recommended for usability), or use [Map.addLayer](#map-addlayer) to open as many as you want.
	 *
	 * @example
	 *
	 * If you want to just bind a popup to marker click and then open it, it's really easy:
	 *
	 * ```js
	 * marker.bindPopup(popupContent).openPopup();
	 * ```
	 * Path overlays like polylines also have a `bindPopup` method.
	 * Here's a more complicated way to open a popup on a map:
	 *
	 * ```js
	 * var popup = L.popup()
	 * 	.setLatLng(latlng)
	 * 	.setContent('<p>Hello world!<br />This is a nice popup.</p>')
	 * 	.openOn(map);
	 * ```
	 */


	// @namespace Popup
	var Popup = DivOverlay.extend({

		// @section
		// @aka Popup options
		options: {
			// @option maxWidth: Number = 300
			// Max width of the popup, in pixels.
			maxWidth: 300,

			// @option minWidth: Number = 50
			// Min width of the popup, in pixels.
			minWidth: 50,

			// @option maxHeight: Number = null
			// If set, creates a scrollable container of the given height
			// inside a popup if its content exceeds it.
			maxHeight: null,

			// @option autoPan: Boolean = true
			// Set it to `false` if you don't want the map to do panning animation
			// to fit the opened popup.
			autoPan: true,

			// @option autoPanPaddingTopLeft: Point = null
			// The margin between the popup and the top left corner of the map
			// view after autopanning was performed.
			autoPanPaddingTopLeft: null,

			// @option autoPanPaddingBottomRight: Point = null
			// The margin between the popup and the bottom right corner of the map
			// view after autopanning was performed.
			autoPanPaddingBottomRight: null,

			// @option autoPanPadding: Point = Point(5, 5)
			// Equivalent of setting both top left and bottom right autopan padding to the same value.
			autoPanPadding: [5, 5],

			// @option keepInView: Boolean = false
			// Set it to `true` if you want to prevent users from panning the popup
			// off of the screen while it is open.
			keepInView: false,

			// @option closeButton: Boolean = true
			// Controls the presence of a close button in the popup.
			closeButton: true,

			// @option autoClose: Boolean = true
			// Set it to `false` if you want to override the default behavior of
			// the popup closing when another popup is opened.
			autoClose: true,

			// @option closeOnEscapeKey: Boolean = true
			// Set it to `false` if you want to override the default behavior of
			// the ESC key for closing of the popup.
			closeOnEscapeKey: true,

			// @option closeOnClick: Boolean = *
			// Set it if you want to override the default behavior of the popup closing when user clicks
			// on the map. Defaults to the map's [`closePopupOnClick`](#map-closepopuponclick) option.

			// @option className: String = ''
			// A custom CSS class name to assign to the popup.
			className: ''
		},

		// @namespace Popup
		// @method openOn(map: Map): this
		// Adds the popup to the map and closes the previous one. The same as `map.openPopup(popup)`.
		openOn: function (map) {
			map.openPopup(this);
			return this;
		},

		onAdd: function (map) {
			DivOverlay.prototype.onAdd.call(this, map);

			// @namespace Map
			// @section Popup events
			// @event popupopen: PopupEvent
			// Fired when a popup is opened in the map
			map.fire('popupopen', {popup: this});

			if (this._source) {
				// @namespace Layer
				// @section Popup events
				// @event popupopen: PopupEvent
				// Fired when a popup bound to this layer is opened
				this._source.fire('popupopen', {popup: this}, true);
				// For non-path layers, we toggle the popup when clicking
				// again the layer, so prevent the map to reopen it.
				if (!(this._source instanceof Path)) {
					this._source.on('preclick', stopPropagation);
				}
			}
		},

		onRemove: function (map) {
			DivOverlay.prototype.onRemove.call(this, map);

			// @namespace Map
			// @section Popup events
			// @event popupclose: PopupEvent
			// Fired when a popup in the map is closed
			map.fire('popupclose', {popup: this});

			if (this._source) {
				// @namespace Layer
				// @section Popup events
				// @event popupclose: PopupEvent
				// Fired when a popup bound to this layer is closed
				this._source.fire('popupclose', {popup: this}, true);
				if (!(this._source instanceof Path)) {
					this._source.off('preclick', stopPropagation);
				}
			}
		},

		getEvents: function () {
			var events = DivOverlay.prototype.getEvents.call(this);

			if (this.options.closeOnClick !== undefined ? this.options.closeOnClick : this._map.options.closePopupOnClick) {
				events.preclick = this._close;
			}

			if (this.options.keepInView) {
				events.moveend = this._adjustPan;
			}

			return events;
		},

		_close: function () {
			if (this._map) {
				this._map.closePopup(this);
			}
		},

		_initLayout: function () {
			var prefix = 'leaflet-popup',
					container = this._container = create$1('div',
				prefix + ' ' + (this.options.className || '') +
				' leaflet-zoom-animated');

			var wrapper = this._wrapper = create$1('div', prefix + '-content-wrapper', container);
			this._contentNode = create$1('div', prefix + '-content', wrapper);

			disableClickPropagation(container);
			disableScrollPropagation(this._contentNode);
			on(container, 'contextmenu', stopPropagation);

			this._tipContainer = create$1('div', prefix + '-tip-container', container);
			this._tip = create$1('div', prefix + '-tip', this._tipContainer);

			if (this.options.closeButton) {
				var closeButton = this._closeButton = create$1('a', prefix + '-close-button', container);
				closeButton.href = '#close';
				closeButton.innerHTML = '&#215;';

				on(closeButton, 'click', this._onCloseButtonClick, this);
			}
		},

		_updateLayout: function () {
			var container = this._contentNode,
					style = container.style;

			style.width = '';
			style.whiteSpace = 'nowrap';

			var width = container.offsetWidth;
			width = Math.min(width, this.options.maxWidth);
			width = Math.max(width, this.options.minWidth);

			style.width = (width + 1) + 'px';
			style.whiteSpace = '';

			style.height = '';

			var height = container.offsetHeight,
					maxHeight = this.options.maxHeight,
					scrolledClass = 'leaflet-popup-scrolled';

			if (maxHeight && height > maxHeight) {
				style.height = maxHeight + 'px';
				addClass(container, scrolledClass);
			} else {
				removeClass(container, scrolledClass);
			}

			this._containerWidth = this._container.offsetWidth;
		},

		_animateZoom: function (e) {
			var pos = this._map._latLngToNewLayerPoint(this._latlng, e.zoom, e.center),
					anchor = this._getAnchor();
			setPosition(this._container, pos.add(anchor));
		},

		_adjustPan: function () {
			if (!this.options.autoPan) { return; }
			if (this._map._panAnim) { this._map._panAnim.stop(); }

			var map = this._map,
					marginBottom = parseInt(getStyle(this._container, 'marginBottom'), 10) || 0,
					containerHeight = this._container.offsetHeight + marginBottom,
					containerWidth = this._containerWidth,
					layerPos = new Point(this._containerLeft, -containerHeight - this._containerBottom);

			layerPos._add(getPosition(this._container));

			var containerPos = map.layerPointToContainerPoint(layerPos),
					padding = toPoint(this.options.autoPanPadding),
					paddingTL = toPoint(this.options.autoPanPaddingTopLeft || padding),
					paddingBR = toPoint(this.options.autoPanPaddingBottomRight || padding),
					size = map.getSize(),
					dx = 0,
					dy = 0;

			if (containerPos.x + containerWidth + paddingBR.x > size.x) { // right
				dx = containerPos.x + containerWidth - size.x + paddingBR.x;
			}
			if (containerPos.x - dx - paddingTL.x < 0) { // left
				dx = containerPos.x - paddingTL.x;
			}
			if (containerPos.y + containerHeight + paddingBR.y > size.y) { // bottom
				dy = containerPos.y + containerHeight - size.y + paddingBR.y;
			}
			if (containerPos.y - dy - paddingTL.y < 0) { // top
				dy = containerPos.y - paddingTL.y;
			}

			// @namespace Map
			// @section Popup events
			// @event autopanstart: Event
			// Fired when the map starts autopanning when opening a popup.
			if (dx || dy) {
				map
						.fire('autopanstart')
						.panBy([dx, dy]);
			}
		},

		_onCloseButtonClick: function (e) {
			this._close();
			stop(e);
		},

		_getAnchor: function () {
			// Where should we anchor the popup on the source layer?
			return toPoint(this._source && this._source._getPopupAnchor ? this._source._getPopupAnchor() : [0, 0]);
		}

	});

	// @namespace Popup
	// @factory L.popup(options?: Popup options, source?: Layer)
	// Instantiates a `Popup` object given an optional `options` object that describes its appearance and location and an optional `source` object that is used to tag the popup with a reference to the Layer to which it refers.
	var popup = function (options, source) {
		return new Popup(options, source);
	};


	/* @namespace Map
	 * @section Interaction Options
	 * @option closePopupOnClick: Boolean = true
	 * Set it to `false` if you don't want popups to close when user clicks the map.
	 */
	Map.mergeOptions({
		closePopupOnClick: true
	});


	// @namespace Map
	// @section Methods for Layers and Controls
	Map.include({
		// @method openPopup(popup: Popup): this
		// Opens the specified popup while closing the previously opened (to make sure only one is opened at one time for usability).
		// @alternative
		// @method openPopup(content: String|HTMLElement, latlng: LatLng, options?: Popup options): this
		// Creates a popup with the specified content and options and opens it in the given point on a map.
		openPopup: function (popup, latlng, options) {
			if (!(popup instanceof Popup)) {
				popup = new Popup(options).setContent(popup);
			}

			if (latlng) {
				popup.setLatLng(latlng);
			}

			if (this.hasLayer(popup)) {
				return this;
			}

			if (this._popup && this._popup.options.autoClose) {
				this.closePopup();
			}

			this._popup = popup;
			return this.addLayer(popup);
		},

		// @method closePopup(popup?: Popup): this
		// Closes the popup previously opened with [openPopup](#map-openpopup) (or the given one).
		closePopup: function (popup) {
			if (!popup || popup === this._popup) {
				popup = this._popup;
				this._popup = null;
			}
			if (popup) {
				this.removeLayer(popup);
			}
			return this;
		}
	});

	/*
	 * @namespace Layer
	 * @section Popup methods example
	 *
	 * All layers share a set of methods convenient for binding popups to it.
	 *
	 * ```js
	 * var layer = L.Polygon(latlngs).bindPopup('Hi There!').addTo(map);
	 * layer.openPopup();
	 * layer.closePopup();
	 * ```
	 *
	 * Popups will also be automatically opened when the layer is clicked on and closed when the layer is removed from the map or another popup is opened.
	 */

	// @section Popup methods
	Layer.include({

		// @method bindPopup(content: String|HTMLElement|Function|Popup, options?: Popup options): this
		// Binds a popup to the layer with the passed `content` and sets up the
		// necessary event listeners. If a `Function` is passed it will receive
		// the layer as the first argument and should return a `String` or `HTMLElement`.
		bindPopup: function (content, options) {

			if (content instanceof Popup) {
				setOptions(content, options);
				this._popup = content;
				content._source = this;
			} else {
				if (!this._popup || options) {
					this._popup = new Popup(options, this);
				}
				this._popup.setContent(content);
			}

			if (!this._popupHandlersAdded) {
				this.on({
					click: this._openPopup,
					keypress: this._onKeyPress,
					remove: this.closePopup,
					move: this._movePopup
				});
				this._popupHandlersAdded = true;
			}

			return this;
		},

		// @method unbindPopup(): this
		// Removes the popup previously bound with `bindPopup`.
		unbindPopup: function () {
			if (this._popup) {
				this.off({
					click: this._openPopup,
					keypress: this._onKeyPress,
					remove: this.closePopup,
					move: this._movePopup
				});
				this._popupHandlersAdded = false;
				this._popup = null;
			}
			return this;
		},

		// @method openPopup(latlng?: LatLng): this
		// Opens the bound popup at the specified `latlng` or at the default popup anchor if no `latlng` is passed.
		openPopup: function (layer, latlng) {
			if (this._popup && this._map) {
				latlng = this._popup._prepareOpen(this, layer, latlng);

				// open the popup on the map
				this._map.openPopup(this._popup, latlng);
			}

			return this;
		},

		// @method closePopup(): this
		// Closes the popup bound to this layer if it is open.
		closePopup: function () {
			if (this._popup) {
				this._popup._close();
			}
			return this;
		},

		// @method togglePopup(): this
		// Opens or closes the popup bound to this layer depending on its current state.
		togglePopup: function (target) {
			if (this._popup) {
				if (this._popup._map) {
					this.closePopup();
				} else {
					this.openPopup(target);
				}
			}
			return this;
		},

		// @method isPopupOpen(): boolean
		// Returns `true` if the popup bound to this layer is currently open.
		isPopupOpen: function () {
			return (this._popup ? this._popup.isOpen() : false);
		},

		// @method setPopupContent(content: String|HTMLElement|Popup): this
		// Sets the content of the popup bound to this layer.
		setPopupContent: function (content) {
			if (this._popup) {
				this._popup.setContent(content);
			}
			return this;
		},

		// @method getPopup(): Popup
		// Returns the popup bound to this layer.
		getPopup: function () {
			return this._popup;
		},

		_openPopup: function (e) {
			var layer = e.layer || e.target;

			if (!this._popup) {
				return;
			}

			if (!this._map) {
				return;
			}

			// prevent map click
			stop(e);

			// if this inherits from Path its a vector and we can just
			// open the popup at the new location
			if (layer instanceof Path) {
				this.openPopup(e.layer || e.target, e.latlng);
				return;
			}

			// otherwise treat it like a marker and figure out
			// if we should toggle it open/closed
			if (this._map.hasLayer(this._popup) && this._popup._source === layer) {
				this.closePopup();
			} else {
				this.openPopup(layer, e.latlng);
			}
		},

		_movePopup: function (e) {
			this._popup.setLatLng(e.latlng);
		},

		_onKeyPress: function (e) {
			if (e.originalEvent.keyCode === 13) {
				this._openPopup(e);
			}
		}
	});

	/*
	 * @class Tooltip
	 * @inherits DivOverlay
	 * @aka L.Tooltip
	 * Used to display small texts on top of map layers.
	 *
	 * @example
	 *
	 * ```js
	 * marker.bindTooltip("my tooltip text").openTooltip();
	 * ```
	 * Note about tooltip offset. Leaflet takes two options in consideration
	 * for computing tooltip offsetting:
	 * - the `offset` Tooltip option: it defaults to [0, 0], and it's specific to one tooltip.
	 *   Add a positive x offset to move the tooltip to the right, and a positive y offset to
	 *   move it to the bottom. Negatives will move to the left and top.
	 * - the `tooltipAnchor` Icon option: this will only be considered for Marker. You
	 *   should adapt this value if you use a custom icon.
	 */


	// @namespace Tooltip
	var Tooltip = DivOverlay.extend({

		// @section
		// @aka Tooltip options
		options: {
			// @option pane: String = 'tooltipPane'
			// `Map pane` where the tooltip will be added.
			pane: 'tooltipPane',

			// @option offset: Point = Point(0, 0)
			// Optional offset of the tooltip position.
			offset: [0, 0],

			// @option direction: String = 'auto'
			// Direction where to open the tooltip. Possible values are: `right`, `left`,
			// `top`, `bottom`, `center`, `auto`.
			// `auto` will dynamically switch between `right` and `left` according to the tooltip
			// position on the map.
			direction: 'auto',

			// @option permanent: Boolean = false
			// Whether to open the tooltip permanently or only on mouseover.
			permanent: false,

			// @option sticky: Boolean = false
			// If true, the tooltip will follow the mouse instead of being fixed at the feature center.
			sticky: false,

			// @option interactive: Boolean = false
			// If true, the tooltip will listen to the feature events.
			interactive: false,

			// @option opacity: Number = 0.9
			// Tooltip container opacity.
			opacity: 0.9
		},

		onAdd: function (map) {
			DivOverlay.prototype.onAdd.call(this, map);
			this.setOpacity(this.options.opacity);

			// @namespace Map
			// @section Tooltip events
			// @event tooltipopen: TooltipEvent
			// Fired when a tooltip is opened in the map.
			map.fire('tooltipopen', {tooltip: this});

			if (this._source) {
				// @namespace Layer
				// @section Tooltip events
				// @event tooltipopen: TooltipEvent
				// Fired when a tooltip bound to this layer is opened.
				this._source.fire('tooltipopen', {tooltip: this}, true);
			}
		},

		onRemove: function (map) {
			DivOverlay.prototype.onRemove.call(this, map);

			// @namespace Map
			// @section Tooltip events
			// @event tooltipclose: TooltipEvent
			// Fired when a tooltip in the map is closed.
			map.fire('tooltipclose', {tooltip: this});

			if (this._source) {
				// @namespace Layer
				// @section Tooltip events
				// @event tooltipclose: TooltipEvent
				// Fired when a tooltip bound to this layer is closed.
				this._source.fire('tooltipclose', {tooltip: this}, true);
			}
		},

		getEvents: function () {
			var events = DivOverlay.prototype.getEvents.call(this);

			if (touch && !this.options.permanent) {
				events.preclick = this._close;
			}

			return events;
		},

		_close: function () {
			if (this._map) {
				this._map.closeTooltip(this);
			}
		},

		_initLayout: function () {
			var prefix = 'leaflet-tooltip',
					className = prefix + ' ' + (this.options.className || '') + ' leaflet-zoom-' + (this._zoomAnimated ? 'animated' : 'hide');

			this._contentNode = this._container = create$1('div', className);
		},

		_updateLayout: function () {},

		_adjustPan: function () {},

		_setPosition: function (pos) {
			var subX, subY,
					map = this._map,
					container = this._container,
					centerPoint = map.latLngToContainerPoint(map.getCenter()),
					tooltipPoint = map.layerPointToContainerPoint(pos),
					direction = this.options.direction,
					tooltipWidth = container.offsetWidth,
					tooltipHeight = container.offsetHeight,
					offset = toPoint(this.options.offset),
					anchor = this._getAnchor();

			if (direction === 'top') {
				subX = tooltipWidth / 2;
				subY = tooltipHeight;
			} else if (direction === 'bottom') {
				subX = tooltipWidth / 2;
				subY = 0;
			} else if (direction === 'center') {
				subX = tooltipWidth / 2;
				subY = tooltipHeight / 2;
			} else if (direction === 'right') {
				subX = 0;
				subY = tooltipHeight / 2;
			} else if (direction === 'left') {
				subX = tooltipWidth;
				subY = tooltipHeight / 2;
			} else if (tooltipPoint.x < centerPoint.x) {
				direction = 'right';
				subX = 0;
				subY = tooltipHeight / 2;
			} else {
				direction = 'left';
				subX = tooltipWidth + (offset.x + anchor.x) * 2;
				subY = tooltipHeight / 2;
			}

			pos = pos.subtract(toPoint(subX, subY, true)).add(offset).add(anchor);

			removeClass(container, 'leaflet-tooltip-right');
			removeClass(container, 'leaflet-tooltip-left');
			removeClass(container, 'leaflet-tooltip-top');
			removeClass(container, 'leaflet-tooltip-bottom');
			addClass(container, 'leaflet-tooltip-' + direction);
			setPosition(container, pos);
		},

		_updatePosition: function () {
			var pos = this._map.latLngToLayerPoint(this._latlng);
			this._setPosition(pos);
		},

		setOpacity: function (opacity) {
			this.options.opacity = opacity;

			if (this._container) {
				setOpacity(this._container, opacity);
			}
		},

		_animateZoom: function (e) {
			var pos = this._map._latLngToNewLayerPoint(this._latlng, e.zoom, e.center);
			this._setPosition(pos);
		},

		_getAnchor: function () {
			// Where should we anchor the tooltip on the source layer?
			return toPoint(this._source && this._source._getTooltipAnchor && !this.options.sticky ? this._source._getTooltipAnchor() : [0, 0]);
		}

	});

	// @namespace Tooltip
	// @factory L.tooltip(options?: Tooltip options, source?: Layer)
	// Instantiates a Tooltip object given an optional `options` object that describes its appearance and location and an optional `source` object that is used to tag the tooltip with a reference to the Layer to which it refers.
	var tooltip = function (options, source) {
		return new Tooltip(options, source);
	};

	// @namespace Map
	// @section Methods for Layers and Controls
	Map.include({

		// @method openTooltip(tooltip: Tooltip): this
		// Opens the specified tooltip.
		// @alternative
		// @method openTooltip(content: String|HTMLElement, latlng: LatLng, options?: Tooltip options): this
		// Creates a tooltip with the specified content and options and open it.
		openTooltip: function (tooltip, latlng, options) {
			if (!(tooltip instanceof Tooltip)) {
				tooltip = new Tooltip(options).setContent(tooltip);
			}

			if (latlng) {
				tooltip.setLatLng(latlng);
			}

			if (this.hasLayer(tooltip)) {
				return this;
			}

			return this.addLayer(tooltip);
		},

		// @method closeTooltip(tooltip?: Tooltip): this
		// Closes the tooltip given as parameter.
		closeTooltip: function (tooltip) {
			if (tooltip) {
				this.removeLayer(tooltip);
			}
			return this;
		}

	});

	/*
	 * @namespace Layer
	 * @section Tooltip methods example
	 *
	 * All layers share a set of methods convenient for binding tooltips to it.
	 *
	 * ```js
	 * var layer = L.Polygon(latlngs).bindTooltip('Hi There!').addTo(map);
	 * layer.openTooltip();
	 * layer.closeTooltip();
	 * ```
	 */

	// @section Tooltip methods
	Layer.include({

		// @method bindTooltip(content: String|HTMLElement|Function|Tooltip, options?: Tooltip options): this
		// Binds a tooltip to the layer with the passed `content` and sets up the
		// necessary event listeners. If a `Function` is passed it will receive
		// the layer as the first argument and should return a `String` or `HTMLElement`.
		bindTooltip: function (content, options) {

			if (content instanceof Tooltip) {
				setOptions(content, options);
				this._tooltip = content;
				content._source = this;
			} else {
				if (!this._tooltip || options) {
					this._tooltip = new Tooltip(options, this);
				}
				this._tooltip.setContent(content);

			}

			this._initTooltipInteractions();

			if (this._tooltip.options.permanent && this._map && this._map.hasLayer(this)) {
				this.openTooltip();
			}

			return this;
		},

		// @method unbindTooltip(): this
		// Removes the tooltip previously bound with `bindTooltip`.
		unbindTooltip: function () {
			if (this._tooltip) {
				this._initTooltipInteractions(true);
				this.closeTooltip();
				this._tooltip = null;
			}
			return this;
		},

		_initTooltipInteractions: function (remove$$1) {
			if (!remove$$1 && this._tooltipHandlersAdded) { return; }
			var onOff = remove$$1 ? 'off' : 'on',
					events = {
				remove: this.closeTooltip,
				move: this._moveTooltip
					};
			if (!this._tooltip.options.permanent) {
				events.mouseover = this._openTooltip;
				events.mouseout = this.closeTooltip;
				if (this._tooltip.options.sticky) {
					events.mousemove = this._moveTooltip;
				}
				if (touch) {
					events.click = this._openTooltip;
				}
			} else {
				events.add = this._openTooltip;
			}
			this[onOff](events);
			this._tooltipHandlersAdded = !remove$$1;
		},

		// @method openTooltip(latlng?: LatLng): this
		// Opens the bound tooltip at the specified `latlng` or at the default tooltip anchor if no `latlng` is passed.
		openTooltip: function (layer, latlng) {
			if (this._tooltip && this._map) {
				latlng = this._tooltip._prepareOpen(this, layer, latlng);

				// open the tooltip on the map
				this._map.openTooltip(this._tooltip, latlng);

				// Tooltip container may not be defined if not permanent and never
				// opened.
				if (this._tooltip.options.interactive && this._tooltip._container) {
					addClass(this._tooltip._container, 'leaflet-clickable');
					this.addInteractiveTarget(this._tooltip._container);
				}
			}

			return this;
		},

		// @method closeTooltip(): this
		// Closes the tooltip bound to this layer if it is open.
		closeTooltip: function () {
			if (this._tooltip) {
				this._tooltip._close();
				if (this._tooltip.options.interactive && this._tooltip._container) {
					removeClass(this._tooltip._container, 'leaflet-clickable');
					this.removeInteractiveTarget(this._tooltip._container);
				}
			}
			return this;
		},

		// @method toggleTooltip(): this
		// Opens or closes the tooltip bound to this layer depending on its current state.
		toggleTooltip: function (target) {
			if (this._tooltip) {
				if (this._tooltip._map) {
					this.closeTooltip();
				} else {
					this.openTooltip(target);
				}
			}
			return this;
		},

		// @method isTooltipOpen(): boolean
		// Returns `true` if the tooltip bound to this layer is currently open.
		isTooltipOpen: function () {
			return this._tooltip.isOpen();
		},

		// @method setTooltipContent(content: String|HTMLElement|Tooltip): this
		// Sets the content of the tooltip bound to this layer.
		setTooltipContent: function (content) {
			if (this._tooltip) {
				this._tooltip.setContent(content);
			}
			return this;
		},

		// @method getTooltip(): Tooltip
		// Returns the tooltip bound to this layer.
		getTooltip: function () {
			return this._tooltip;
		},

		_openTooltip: function (e) {
			var layer = e.layer || e.target;

			if (!this._tooltip || !this._map) {
				return;
			}
			this.openTooltip(layer, this._tooltip.options.sticky ? e.latlng : undefined);
		},

		_moveTooltip: function (e) {
			var latlng = e.latlng, containerPoint, layerPoint;
			if (this._tooltip.options.sticky && e.originalEvent) {
				containerPoint = this._map.mouseEventToContainerPoint(e.originalEvent);
				layerPoint = this._map.containerPointToLayerPoint(containerPoint);
				latlng = this._map.layerPointToLatLng(layerPoint);
			}
			this._tooltip.setLatLng(latlng);
		}
	});

	/*
	 * @class DivIcon
	 * @aka L.DivIcon
	 * @inherits Icon
	 *
	 * Represents a lightweight icon for markers that uses a simple `<div>`
	 * element instead of an image. Inherits from `Icon` but ignores the `iconUrl` and shadow options.
	 *
	 * @example
	 * ```js
	 * var myIcon = L.divIcon({className: 'my-div-icon'});
	 * // you can set .my-div-icon styles in CSS
	 *
	 * L.marker([50.505, 30.57], {icon: myIcon}).addTo(map);
	 * ```
	 *
	 * By default, it has a 'leaflet-div-icon' CSS class and is styled as a little white square with a shadow.
	 */

	var DivIcon = Icon.extend({
		options: {
			// @section
			// @aka DivIcon options
			iconSize: [12, 12], // also can be set through CSS

			// iconAnchor: (Point),
			// popupAnchor: (Point),

			// @option html: String|HTMLElement = ''
			// Custom HTML code to put inside the div element, empty by default. Alternatively,
			// an instance of `HTMLElement`.
			html: false,

			// @option bgPos: Point = [0, 0]
			// Optional relative position of the background, in pixels
			bgPos: null,

			className: 'leaflet-div-icon'
		},

		createIcon: function (oldIcon) {
			var div = (oldIcon && oldIcon.tagName === 'DIV') ? oldIcon : document.createElement('div'),
					options = this.options;

			if (options.html instanceof Element) {
				empty(div);
				div.appendChild(options.html);
			} else {
				div.innerHTML = options.html !== false ? options.html : '';
			}

			if (options.bgPos) {
				var bgPos = toPoint(options.bgPos);
				div.style.backgroundPosition = (-bgPos.x) + 'px ' + (-bgPos.y) + 'px';
			}
			this._setIconStyles(div, 'icon');

			return div;
		},

		createShadow: function () {
			return null;
		}
	});

	// @factory L.divIcon(options: DivIcon options)
	// Creates a `DivIcon` instance with the given options.
	function divIcon(options) {
		return new DivIcon(options);
	}

	Icon.Default = IconDefault;

	/*
	 * @class GridLayer
	 * @inherits Layer
	 * @aka L.GridLayer
	 *
	 * Generic class for handling a tiled grid of HTML elements. This is the base class for all tile layers and replaces `TileLayer.Canvas`.
	 * GridLayer can be extended to create a tiled grid of HTML elements like `<canvas>`, `<img>` or `<div>`. GridLayer will handle creating and animating these DOM elements for you.
	 *
	 *
	 * @section Synchronous usage
	 * @example
	 *
	 * To create a custom layer, extend GridLayer and implement the `createTile()` method, which will be passed a `Point` object with the `x`, `y`, and `z` (zoom level) coordinates to draw your tile.
	 *
	 * ```js
	 * var CanvasLayer = L.GridLayer.extend({
	 *     createTile: function(coords){
	 *         // create a <canvas> element for drawing
	 *         var tile = L.DomUtil.create('canvas', 'leaflet-tile');
	 *
	 *         // setup tile width and height according to the options
	 *         var size = this.getTileSize();
	 *         tile.width = size.x;
	 *         tile.height = size.y;
	 *
	 *         // get a canvas context and draw something on it using coords.x, coords.y and coords.z
	 *         var ctx = tile.getContext('2d');
	 *
	 *         // return the tile so it can be rendered on screen
	 *         return tile;
	 *     }
	 * });
	 * ```
	 *
	 * @section Asynchronous usage
	 * @example
	 *
	 * Tile creation can also be asynchronous, this is useful when using a third-party drawing library. Once the tile is finished drawing it can be passed to the `done()` callback.
	 *
	 * ```js
	 * var CanvasLayer = L.GridLayer.extend({
	 *     createTile: function(coords, done){
	 *         var error;
	 *
	 *         // create a <canvas> element for drawing
	 *         var tile = L.DomUtil.create('canvas', 'leaflet-tile');
	 *
	 *         // setup tile width and height according to the options
	 *         var size = this.getTileSize();
	 *         tile.width = size.x;
	 *         tile.height = size.y;
	 *
	 *         // draw something asynchronously and pass the tile to the done() callback
	 *         setTimeout(function() {
	 *             done(error, tile);
	 *         }, 1000);
	 *
	 *         return tile;
	 *     }
	 * });
	 * ```
	 *
	 * @section
	 */


	var GridLayer = Layer.extend({

		// @section
		// @aka GridLayer options
		options: {
			// @option tileSize: Number|Point = 256
			// Width and height of tiles in the grid. Use a number if width and height are equal, or `L.point(width, height)` otherwise.
			tileSize: 256,

			// @option opacity: Number = 1.0
			// Opacity of the tiles. Can be used in the `createTile()` function.
			opacity: 1,

			// @option updateWhenIdle: Boolean = (depends)
			// Load new tiles only when panning ends.
			// `true` by default on mobile browsers, in order to avoid too many requests and keep smooth navigation.
			// `false` otherwise in order to display new tiles _during_ panning, since it is easy to pan outside the
			// [`keepBuffer`](#gridlayer-keepbuffer) option in desktop browsers.
			updateWhenIdle: mobile,

			// @option updateWhenZooming: Boolean = true
			// By default, a smooth zoom animation (during a [touch zoom](#map-touchzoom) or a [`flyTo()`](#map-flyto)) will update grid layers every integer zoom level. Setting this option to `false` will update the grid layer only when the smooth animation ends.
			updateWhenZooming: true,

			// @option updateInterval: Number = 200
			// Tiles will not update more than once every `updateInterval` milliseconds when panning.
			updateInterval: 200,

			// @option zIndex: Number = 1
			// The explicit zIndex of the tile layer.
			zIndex: 1,

			// @option bounds: LatLngBounds = undefined
			// If set, tiles will only be loaded inside the set `LatLngBounds`.
			bounds: null,

			// @option minZoom: Number = 0
			// The minimum zoom level down to which this layer will be displayed (inclusive).
			minZoom: 0,

			// @option maxZoom: Number = undefined
			// The maximum zoom level up to which this layer will be displayed (inclusive).
			maxZoom: undefined,

			// @option maxNativeZoom: Number = undefined
			// Maximum zoom number the tile source has available. If it is specified,
			// the tiles on all zoom levels higher than `maxNativeZoom` will be loaded
			// from `maxNativeZoom` level and auto-scaled.
			maxNativeZoom: undefined,

			// @option minNativeZoom: Number = undefined
			// Minimum zoom number the tile source has available. If it is specified,
			// the tiles on all zoom levels lower than `minNativeZoom` will be loaded
			// from `minNativeZoom` level and auto-scaled.
			minNativeZoom: undefined,

			// @option noWrap: Boolean = false
			// Whether the layer is wrapped around the antimeridian. If `true`, the
			// GridLayer will only be displayed once at low zoom levels. Has no
			// effect when the [map CRS](#map-crs) doesn't wrap around. Can be used
			// in combination with [`bounds`](#gridlayer-bounds) to prevent requesting
			// tiles outside the CRS limits.
			noWrap: false,

			// @option pane: String = 'tilePane'
			// `Map pane` where the grid layer will be added.
			pane: 'tilePane',

			// @option className: String = ''
			// A custom class name to assign to the tile layer. Empty by default.
			className: '',

			// @option keepBuffer: Number = 2
			// When panning the map, keep this many rows and columns of tiles before unloading them.
			keepBuffer: 2
		},

		initialize: function (options) {
			setOptions(this, options);
		},

		onAdd: function () {
			this._initContainer();

			this._levels = {};
			this._tiles = {};

			this._resetView();
			this._update();
		},

		beforeAdd: function (map) {
			map._addZoomLimit(this);
		},

		onRemove: function (map) {
			this._removeAllTiles();
			remove(this._container);
			map._removeZoomLimit(this);
			this._container = null;
			this._tileZoom = undefined;
		},

		// @method bringToFront: this
		// Brings the tile layer to the top of all tile layers.
		bringToFront: function () {
			if (this._map) {
				toFront(this._container);
				this._setAutoZIndex(Math.max);
			}
			return this;
		},

		// @method bringToBack: this
		// Brings the tile layer to the bottom of all tile layers.
		bringToBack: function () {
			if (this._map) {
				toBack(this._container);
				this._setAutoZIndex(Math.min);
			}
			return this;
		},

		// @method getContainer: HTMLElement
		// Returns the HTML element that contains the tiles for this layer.
		getContainer: function () {
			return this._container;
		},

		// @method setOpacity(opacity: Number): this
		// Changes the [opacity](#gridlayer-opacity) of the grid layer.
		setOpacity: function (opacity) {
			this.options.opacity = opacity;
			this._updateOpacity();
			return this;
		},

		// @method setZIndex(zIndex: Number): this
		// Changes the [zIndex](#gridlayer-zindex) of the grid layer.
		setZIndex: function (zIndex) {
			this.options.zIndex = zIndex;
			this._updateZIndex();

			return this;
		},

		// @method isLoading: Boolean
		// Returns `true` if any tile in the grid layer has not finished loading.
		isLoading: function () {
			return this._loading;
		},

		// @method redraw: this
		// Causes the layer to clear all the tiles and request them again.
		redraw: function () {
			if (this._map) {
				this._removeAllTiles();
				this._update();
			}
			return this;
		},

		getEvents: function () {
			var events = {
				viewprereset: this._invalidateAll,
				viewreset: this._resetView,
				zoom: this._resetView,
				moveend: this._onMoveEnd
			};

			if (!this.options.updateWhenIdle) {
				// update tiles on move, but not more often than once per given interval
				if (!this._onMove) {
					this._onMove = throttle(this._onMoveEnd, this.options.updateInterval, this);
				}

				events.move = this._onMove;
			}

			if (this._zoomAnimated) {
				events.zoomanim = this._animateZoom;
			}

			return events;
		},

		// @section Extension methods
		// Layers extending `GridLayer` shall reimplement the following method.
		// @method createTile(coords: Object, done?: Function): HTMLElement
		// Called only internally, must be overridden by classes extending `GridLayer`.
		// Returns the `HTMLElement` corresponding to the given `coords`. If the `done` callback
		// is specified, it must be called when the tile has finished loading and drawing.
		createTile: function () {
			return document.createElement('div');
		},

		// @section
		// @method getTileSize: Point
		// Normalizes the [tileSize option](#gridlayer-tilesize) into a point. Used by the `createTile()` method.
		getTileSize: function () {
			var s = this.options.tileSize;
			return s instanceof Point ? s : new Point(s, s);
		},

		_updateZIndex: function () {
			if (this._container && this.options.zIndex !== undefined && this.options.zIndex !== null) {
				this._container.style.zIndex = this.options.zIndex;
			}
		},

		_setAutoZIndex: function (compare) {
			// go through all other layers of the same pane, set zIndex to max + 1 (front) or min - 1 (back)

			var layers = this.getPane().children,
					edgeZIndex = -compare(-Infinity, Infinity); // -Infinity for max, Infinity for min

			for (var i = 0, len = layers.length, zIndex; i < len; i++) {

				zIndex = layers[i].style.zIndex;

				if (layers[i] !== this._container && zIndex) {
					edgeZIndex = compare(edgeZIndex, +zIndex);
				}
			}

			if (isFinite(edgeZIndex)) {
				this.options.zIndex = edgeZIndex + compare(-1, 1);
				this._updateZIndex();
			}
		},

		_updateOpacity: function () {
			if (!this._map) { return; }

			// IE doesn't inherit filter opacity properly, so we're forced to set it on tiles
			if (ielt9) { return; }

			setOpacity(this._container, this.options.opacity);

			var now = +new Date(),
					nextFrame = false,
					willPrune = false;

			for (var key in this._tiles) {
				var tile = this._tiles[key];
				if (!tile.current || !tile.loaded) { continue; }

				var fade = Math.min(1, (now - tile.loaded) / 200);

				setOpacity(tile.el, fade);
				if (fade < 1) {
					nextFrame = true;
				} else {
					if (tile.active) {
						willPrune = true;
					} else {
						this._onOpaqueTile(tile);
					}
					tile.active = true;
				}
			}

			if (willPrune && !this._noPrune) { this._pruneTiles(); }

			if (nextFrame) {
				cancelAnimFrame(this._fadeFrame);
				this._fadeFrame = requestAnimFrame(this._updateOpacity, this);
			}
		},

		_onOpaqueTile: falseFn,

		_initContainer: function () {
			if (this._container) { return; }

			this._container = create$1('div', 'leaflet-layer ' + (this.options.className || ''));
			this._updateZIndex();

			if (this.options.opacity < 1) {
				this._updateOpacity();
			}

			this.getPane().appendChild(this._container);
		},

		_updateLevels: function () {

			var zoom = this._tileZoom,
					maxZoom = this.options.maxZoom;

			if (zoom === undefined) { return undefined; }

			for (var z in this._levels) {
				z = Number(z);
				if (this._levels[z].el.children.length || z === zoom) {
					this._levels[z].el.style.zIndex = maxZoom - Math.abs(zoom - z);
					this._onUpdateLevel(z);
				} else {
					remove(this._levels[z].el);
					this._removeTilesAtZoom(z);
					this._onRemoveLevel(z);
					delete this._levels[z];
				}
			}

			var level = this._levels[zoom],
					map = this._map;

			if (!level) {
				level = this._levels[zoom] = {};

				level.el = create$1('div', 'leaflet-tile-container leaflet-zoom-animated', this._container);
				level.el.style.zIndex = maxZoom;

				level.origin = map.project(map.unproject(map.getPixelOrigin()), zoom).round();
				level.zoom = zoom;

				this._setZoomTransform(level, map.getCenter(), map.getZoom());

				// force the browser to consider the newly added element for transition
				falseFn(level.el.offsetWidth);

				this._onCreateLevel(level);
			}

			this._level = level;

			return level;
		},

		_onUpdateLevel: falseFn,

		_onRemoveLevel: falseFn,

		_onCreateLevel: falseFn,

		_pruneTiles: function () {
			if (!this._map) {
				return;
			}

			var key, tile;

			var zoom = this._map.getZoom();
			if (zoom > this.options.maxZoom ||
				zoom < this.options.minZoom) {
				this._removeAllTiles();
				return;
			}

			for (key in this._tiles) {
				tile = this._tiles[key];
				tile.retain = tile.current;
			}

			for (key in this._tiles) {
				tile = this._tiles[key];
				if (tile.current && !tile.active) {
					var coords = tile.coords;
					if (!this._retainParent(coords.x, coords.y, coords.z, coords.z - 5)) {
						this._retainChildren(coords.x, coords.y, coords.z, coords.z + 2);
					}
				}
			}

			for (key in this._tiles) {
				if (!this._tiles[key].retain) {
					this._removeTile(key);
				}
			}
		},

		_removeTilesAtZoom: function (zoom) {
			for (var key in this._tiles) {
				if (this._tiles[key].coords.z !== zoom) {
					continue;
				}
				this._removeTile(key);
			}
		},

		_removeAllTiles: function () {
			for (var key in this._tiles) {
				this._removeTile(key);
			}
		},

		_invalidateAll: function () {
			for (var z in this._levels) {
				remove(this._levels[z].el);
				this._onRemoveLevel(Number(z));
				delete this._levels[z];
			}
			this._removeAllTiles();

			this._tileZoom = undefined;
		},

		_retainParent: function (x, y, z, minZoom) {
			var x2 = Math.floor(x / 2),
					y2 = Math.floor(y / 2),
					z2 = z - 1,
					coords2 = new Point(+x2, +y2);
			coords2.z = +z2;

			var key = this._tileCoordsToKey(coords2),
					tile = this._tiles[key];

			if (tile && tile.active) {
				tile.retain = true;
				return true;

			} else if (tile && tile.loaded) {
				tile.retain = true;
			}

			if (z2 > minZoom) {
				return this._retainParent(x2, y2, z2, minZoom);
			}

			return false;
		},

		_retainChildren: function (x, y, z, maxZoom) {

			for (var i = 2 * x; i < 2 * x + 2; i++) {
				for (var j = 2 * y; j < 2 * y + 2; j++) {

					var coords = new Point(i, j);
					coords.z = z + 1;

					var key = this._tileCoordsToKey(coords),
							tile = this._tiles[key];

					if (tile && tile.active) {
						tile.retain = true;
						continue;

					} else if (tile && tile.loaded) {
						tile.retain = true;
					}

					if (z + 1 < maxZoom) {
						this._retainChildren(i, j, z + 1, maxZoom);
					}
				}
			}
		},

		_resetView: function (e) {
			var animating = e && (e.pinch || e.flyTo);
			this._setView(this._map.getCenter(), this._map.getZoom(), animating, animating);
		},

		_animateZoom: function (e) {
			this._setView(e.center, e.zoom, true, e.noUpdate);
		},

		_clampZoom: function (zoom) {
			var options = this.options;

			if (undefined !== options.minNativeZoom && zoom < options.minNativeZoom) {
				return options.minNativeZoom;
			}

			if (undefined !== options.maxNativeZoom && options.maxNativeZoom < zoom) {
				return options.maxNativeZoom;
			}

			return zoom;
		},

		_setView: function (center, zoom, noPrune, noUpdate) {
			var tileZoom = Math.round(zoom);
			if ((this.options.maxZoom !== undefined && tileZoom > this.options.maxZoom) ||
					(this.options.minZoom !== undefined && tileZoom < this.options.minZoom)) {
				tileZoom = undefined;
			} else {
				tileZoom = this._clampZoom(tileZoom);
			}

			var tileZoomChanged = this.options.updateWhenZooming && (tileZoom !== this._tileZoom);

			if (!noUpdate || tileZoomChanged) {

				this._tileZoom = tileZoom;

				if (this._abortLoading) {
					this._abortLoading();
				}

				this._updateLevels();
				this._resetGrid();

				if (tileZoom !== undefined) {
					this._update(center);
				}

				if (!noPrune) {
					this._pruneTiles();
				}

				// Flag to prevent _updateOpacity from pruning tiles during
				// a zoom anim or a pinch gesture
				this._noPrune = !!noPrune;
			}

			this._setZoomTransforms(center, zoom);
		},

		_setZoomTransforms: function (center, zoom) {
			for (var i in this._levels) {
				this._setZoomTransform(this._levels[i], center, zoom);
			}
		},

		_setZoomTransform: function (level, center, zoom) {
			var scale = this._map.getZoomScale(zoom, level.zoom),
					translate = level.origin.multiplyBy(scale)
							.subtract(this._map._getNewPixelOrigin(center, zoom)).round();

			if (any3d) {
				setTransform(level.el, translate, scale);
			} else {
				setPosition(level.el, translate);
			}
		},

		_resetGrid: function () {
			var map = this._map,
					crs = map.options.crs,
					tileSize = this._tileSize = this.getTileSize(),
					tileZoom = this._tileZoom;

			var bounds = this._map.getPixelWorldBounds(this._tileZoom);
			if (bounds) {
				this._globalTileRange = this._pxBoundsToTileRange(bounds);
			}

			this._wrapX = crs.wrapLng && !this.options.noWrap && [
				Math.floor(map.project([0, crs.wrapLng[0]], tileZoom).x / tileSize.x),
				Math.ceil(map.project([0, crs.wrapLng[1]], tileZoom).x / tileSize.y)
			];
			this._wrapY = crs.wrapLat && !this.options.noWrap && [
				Math.floor(map.project([crs.wrapLat[0], 0], tileZoom).y / tileSize.x),
				Math.ceil(map.project([crs.wrapLat[1], 0], tileZoom).y / tileSize.y)
			];
		},

		_onMoveEnd: function () {
			if (!this._map || this._map._animatingZoom) { return; }

			this._update();
		},

		_getTiledPixelBounds: function (center) {
			var map = this._map,
					mapZoom = map._animatingZoom ? Math.max(map._animateToZoom, map.getZoom()) : map.getZoom(),
					scale = map.getZoomScale(mapZoom, this._tileZoom),
					pixelCenter = map.project(center, this._tileZoom).floor(),
					halfSize = map.getSize().divideBy(scale * 2);

			return new Bounds(pixelCenter.subtract(halfSize), pixelCenter.add(halfSize));
		},

		// Private method to load tiles in the grid's active zoom level according to map bounds
		_update: function (center) {
			var map = this._map;
			if (!map) { return; }
			var zoom = this._clampZoom(map.getZoom());

			if (center === undefined) { center = map.getCenter(); }
			if (this._tileZoom === undefined) { return; }	// if out of minzoom/maxzoom

			var pixelBounds = this._getTiledPixelBounds(center),
					tileRange = this._pxBoundsToTileRange(pixelBounds),
					tileCenter = tileRange.getCenter(),
					queue = [],
					margin = this.options.keepBuffer,
					noPruneRange = new Bounds(tileRange.getBottomLeft().subtract([margin, -margin]),
																		tileRange.getTopRight().add([margin, -margin]));

			// Sanity check: panic if the tile range contains Infinity somewhere.
			if (!(isFinite(tileRange.min.x) &&
						isFinite(tileRange.min.y) &&
						isFinite(tileRange.max.x) &&
						isFinite(tileRange.max.y))) { throw new Error('Attempted to load an infinite number of tiles'); }

			for (var key in this._tiles) {
				var c = this._tiles[key].coords;
				if (c.z !== this._tileZoom || !noPruneRange.contains(new Point(c.x, c.y))) {
					this._tiles[key].current = false;
				}
			}

			// _update just loads more tiles. If the tile zoom level differs too much
			// from the map's, let _setView reset levels and prune old tiles.
			if (Math.abs(zoom - this._tileZoom) > 1) { this._setView(center, zoom); return; }

			// create a queue of coordinates to load tiles from
			for (var j = tileRange.min.y; j <= tileRange.max.y; j++) {
				for (var i = tileRange.min.x; i <= tileRange.max.x; i++) {
					var coords = new Point(i, j);
					coords.z = this._tileZoom;

					if (!this._isValidTile(coords)) { continue; }

					var tile = this._tiles[this._tileCoordsToKey(coords)];
					if (tile) {
						tile.current = true;
					} else {
						queue.push(coords);
					}
				}
			}

			// sort tile queue to load tiles in order of their distance to center
			queue.sort(function (a, b) {
				return a.distanceTo(tileCenter) - b.distanceTo(tileCenter);
			});

			if (queue.length !== 0) {
				// if it's the first batch of tiles to load
				if (!this._loading) {
					this._loading = true;
					// @event loading: Event
					// Fired when the grid layer starts loading tiles.
					this.fire('loading');
				}

				// create DOM fragment to append tiles in one batch
				var fragment = document.createDocumentFragment();

				for (i = 0; i < queue.length; i++) {
					this._addTile(queue[i], fragment);
				}

				this._level.el.appendChild(fragment);
			}
		},

		_isValidTile: function (coords) {
			var crs = this._map.options.crs;

			if (!crs.infinite) {
				// don't load tile if it's out of bounds and not wrapped
				var bounds = this._globalTileRange;
				if ((!crs.wrapLng && (coords.x < bounds.min.x || coords.x > bounds.max.x)) ||
						(!crs.wrapLat && (coords.y < bounds.min.y || coords.y > bounds.max.y))) { return false; }
			}

			if (!this.options.bounds) { return true; }

			// don't load tile if it doesn't intersect the bounds in options
			var tileBounds = this._tileCoordsToBounds(coords);
			return toLatLngBounds(this.options.bounds).overlaps(tileBounds);
		},

		_keyToBounds: function (key) {
			return this._tileCoordsToBounds(this._keyToTileCoords(key));
		},

		_tileCoordsToNwSe: function (coords) {
			var map = this._map,
					tileSize = this.getTileSize(),
					nwPoint = coords.scaleBy(tileSize),
					sePoint = nwPoint.add(tileSize),
					nw = map.unproject(nwPoint, coords.z),
					se = map.unproject(sePoint, coords.z);
			return [nw, se];
		},

		// converts tile coordinates to its geographical bounds
		_tileCoordsToBounds: function (coords) {
			var bp = this._tileCoordsToNwSe(coords),
					bounds = new LatLngBounds(bp[0], bp[1]);

			if (!this.options.noWrap) {
				bounds = this._map.wrapLatLngBounds(bounds);
			}
			return bounds;
		},
		// converts tile coordinates to key for the tile cache
		_tileCoordsToKey: function (coords) {
			return coords.x + ':' + coords.y + ':' + coords.z;
		},

		// converts tile cache key to coordinates
		_keyToTileCoords: function (key) {
			var k = key.split(':'),
					coords = new Point(+k[0], +k[1]);
			coords.z = +k[2];
			return coords;
		},

		_removeTile: function (key) {
			var tile = this._tiles[key];
			if (!tile) { return; }

			remove(tile.el);

			delete this._tiles[key];

			// @event tileunload: TileEvent
			// Fired when a tile is removed (e.g. when a tile goes off the screen).
			this.fire('tileunload', {
				tile: tile.el,
				coords: this._keyToTileCoords(key)
			});
		},

		_initTile: function (tile) {
			addClass(tile, 'leaflet-tile');

			var tileSize = this.getTileSize();
			tile.style.width = tileSize.x + 'px';
			tile.style.height = tileSize.y + 'px';

			tile.onselectstart = falseFn;
			tile.onmousemove = falseFn;

			// update opacity on tiles in IE7-8 because of filter inheritance problems
			if (ielt9 && this.options.opacity < 1) {
				setOpacity(tile, this.options.opacity);
			}

			// without this hack, tiles disappear after zoom on Chrome for Android
			// https://github.com/Leaflet/Leaflet/issues/2078
			if (android && !android23) {
				tile.style.WebkitBackfaceVisibility = 'hidden';
			}
		},

		_addTile: function (coords, container) {
			var tilePos = this._getTilePos(coords),
					key = this._tileCoordsToKey(coords);

			var tile = this.createTile(this._wrapCoords(coords), bind(this._tileReady, this, coords));

			this._initTile(tile);

			// if createTile is defined with a second argument ("done" callback),
			// we know that tile is async and will be ready later; otherwise
			if (this.createTile.length < 2) {
				// mark tile as ready, but delay one frame for opacity animation to happen
				requestAnimFrame(bind(this._tileReady, this, coords, null, tile));
			}

			setPosition(tile, tilePos);

			// save tile in cache
			this._tiles[key] = {
				el: tile,
				coords: coords,
				current: true
			};

			container.appendChild(tile);
			// @event tileloadstart: TileEvent
			// Fired when a tile is requested and starts loading.
			this.fire('tileloadstart', {
				tile: tile,
				coords: coords
			});
		},

		_tileReady: function (coords, err, tile) {
			if (err) {
				// @event tileerror: TileErrorEvent
				// Fired when there is an error loading a tile.
				this.fire('tileerror', {
					error: err,
					tile: tile,
					coords: coords
				});
			}

			var key = this._tileCoordsToKey(coords);

			tile = this._tiles[key];
			if (!tile) { return; }

			tile.loaded = +new Date();
			if (this._map._fadeAnimated) {
				setOpacity(tile.el, 0);
				cancelAnimFrame(this._fadeFrame);
				this._fadeFrame = requestAnimFrame(this._updateOpacity, this);
			} else {
				tile.active = true;
				this._pruneTiles();
			}

			if (!err) {
				addClass(tile.el, 'leaflet-tile-loaded');

				// @event tileload: TileEvent
				// Fired when a tile loads.
				this.fire('tileload', {
					tile: tile.el,
					coords: coords
				});
			}

			if (this._noTilesToLoad()) {
				this._loading = false;
				// @event load: Event
				// Fired when the grid layer loaded all visible tiles.
				this.fire('load');

				if (ielt9 || !this._map._fadeAnimated) {
					requestAnimFrame(this._pruneTiles, this);
				} else {
					// Wait a bit more than 0.2 secs (the duration of the tile fade-in)
					// to trigger a pruning.
					setTimeout(bind(this._pruneTiles, this), 250);
				}
			}
		},

		_getTilePos: function (coords) {
			return coords.scaleBy(this.getTileSize()).subtract(this._level.origin);
		},

		_wrapCoords: function (coords) {
			var newCoords = new Point(
				this._wrapX ? wrapNum(coords.x, this._wrapX) : coords.x,
				this._wrapY ? wrapNum(coords.y, this._wrapY) : coords.y);
			newCoords.z = coords.z;
			return newCoords;
		},

		_pxBoundsToTileRange: function (bounds) {
			var tileSize = this.getTileSize();
			return new Bounds(
				bounds.min.unscaleBy(tileSize).floor(),
				bounds.max.unscaleBy(tileSize).ceil().subtract([1, 1]));
		},

		_noTilesToLoad: function () {
			for (var key in this._tiles) {
				if (!this._tiles[key].loaded) { return false; }
			}
			return true;
		}
	});

	// @factory L.gridLayer(options?: GridLayer options)
	// Creates a new instance of GridLayer with the supplied options.
	function gridLayer(options) {
		return new GridLayer(options);
	}

	/*
	 * @class TileLayer
	 * @inherits GridLayer
	 * @aka L.TileLayer
	 * Used to load and display tile layers on the map. Note that most tile servers require attribution, which you can set under `Layer`. Extends `GridLayer`.
	 *
	 * @example
	 *
	 * ```js
	 * L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png?{foo}', {foo: 'bar', attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>'}).addTo(map);
	 * ```
	 *
	 * @section URL template
	 * @example
	 *
	 * A string of the following form:
	 *
	 * ```
	 * 'http://{s}.somedomain.com/blabla/{z}/{x}/{y}{r}.png'
	 * ```
	 *
	 * `{s}` means one of the available subdomains (used sequentially to help with browser parallel requests per domain limitation; subdomain values are specified in options; `a`, `b` or `c` by default, can be omitted), `{z}` — zoom level, `{x}` and `{y}` — tile coordinates. `{r}` can be used to add "&commat;2x" to the URL to load retina tiles.
	 *
	 * You can use custom keys in the template, which will be [evaluated](#util-template) from TileLayer options, like this:
	 *
	 * ```
	 * L.tileLayer('http://{s}.somedomain.com/{foo}/{z}/{x}/{y}.png', {foo: 'bar'});
	 * ```
	 */


	var TileLayer = GridLayer.extend({

		// @section
		// @aka TileLayer options
		options: {
			// @option minZoom: Number = 0
			// The minimum zoom level down to which this layer will be displayed (inclusive).
			minZoom: 0,

			// @option maxZoom: Number = 18
			// The maximum zoom level up to which this layer will be displayed (inclusive).
			maxZoom: 18,

			// @option subdomains: String|String[] = 'abc'
			// Subdomains of the tile service. Can be passed in the form of one string (where each letter is a subdomain name) or an array of strings.
			subdomains: 'abc',

			// @option errorTileUrl: String = ''
			// URL to the tile image to show in place of the tile that failed to load.
			errorTileUrl: '',

			// @option zoomOffset: Number = 0
			// The zoom number used in tile URLs will be offset with this value.
			zoomOffset: 0,

			// @option tms: Boolean = false
			// If `true`, inverses Y axis numbering for tiles (turn this on for [TMS](https://en.wikipedia.org/wiki/Tile_Map_Service) services).
			tms: false,

			// @option zoomReverse: Boolean = false
			// If set to true, the zoom number used in tile URLs will be reversed (`maxZoom - zoom` instead of `zoom`)
			zoomReverse: false,

			// @option detectRetina: Boolean = false
			// If `true` and user is on a retina display, it will request four tiles of half the specified size and a bigger zoom level in place of one to utilize the high resolution.
			detectRetina: false,

			// @option crossOrigin: Boolean|String = false
			// Whether the crossOrigin attribute will be added to the tiles.
			// If a String is provided, all tiles will have their crossOrigin attribute set to the String provided. This is needed if you want to access tile pixel data.
			// Refer to [CORS Settings](https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_settings_attributes) for valid String values.
			crossOrigin: false
		},

		initialize: function (url, options) {

			this._url = url;

			options = setOptions(this, options);

			// detecting retina displays, adjusting tileSize and zoom levels
			if (options.detectRetina && retina && options.maxZoom > 0) {

				options.tileSize = Math.floor(options.tileSize / 2);

				if (!options.zoomReverse) {
					options.zoomOffset++;
					options.maxZoom--;
				} else {
					options.zoomOffset--;
					options.minZoom++;
				}

				options.minZoom = Math.max(0, options.minZoom);
			}

			if (typeof options.subdomains === 'string') {
				options.subdomains = options.subdomains.split('');
			}

			// for https://github.com/Leaflet/Leaflet/issues/137
			if (!android) {
				this.on('tileunload', this._onTileRemove);
			}
		},

		// @method setUrl(url: String, noRedraw?: Boolean): this
		// Updates the layer's URL template and redraws it (unless `noRedraw` is set to `true`).
		// If the URL does not change, the layer will not be redrawn unless
		// the noRedraw parameter is set to false.
		setUrl: function (url, noRedraw) {
			if (this._url === url && noRedraw === undefined) {
				noRedraw = true;
			}

			this._url = url;

			if (!noRedraw) {
				this.redraw();
			}
			return this;
		},

		// @method createTile(coords: Object, done?: Function): HTMLElement
		// Called only internally, overrides GridLayer's [`createTile()`](#gridlayer-createtile)
		// to return an `<img>` HTML element with the appropriate image URL given `coords`. The `done`
		// callback is called when the tile has been loaded.
		createTile: function (coords, done) {
			var tile = document.createElement('img');

			on(tile, 'load', bind(this._tileOnLoad, this, done, tile));
			on(tile, 'error', bind(this._tileOnError, this, done, tile));

			if (this.options.crossOrigin || this.options.crossOrigin === '') {
				tile.crossOrigin = this.options.crossOrigin === true ? '' : this.options.crossOrigin;
			}

			/*
			 Alt tag is set to empty string to keep screen readers from reading URL and for compliance reasons
			 http://www.w3.org/TR/WCAG20-TECHS/H67
			*/
			tile.alt = '';

			/*
			 Set role="presentation" to force screen readers to ignore this
			 https://www.w3.org/TR/wai-aria/roles#textalternativecomputation
			*/
			tile.setAttribute('role', 'presentation');

			tile.src = this.getTileUrl(coords);

			return tile;
		},

		// @section Extension methods
		// @uninheritable
		// Layers extending `TileLayer` might reimplement the following method.
		// @method getTileUrl(coords: Object): String
		// Called only internally, returns the URL for a tile given its coordinates.
		// Classes extending `TileLayer` can override this function to provide custom tile URL naming schemes.
		getTileUrl: function (coords) {
			var data = {
				r: retina ? '@2x' : '',
				s: this._getSubdomain(coords),
				x: coords.x,
				y: coords.y,
				z: this._getZoomForUrl()
			};
			if (this._map && !this._map.options.crs.infinite) {
				var invertedY = this._globalTileRange.max.y - coords.y;
				if (this.options.tms) {
					data['y'] = invertedY;
				}
				data['-y'] = invertedY;
			}

			return template(this._url, extend(data, this.options));
		},

		_tileOnLoad: function (done, tile) {
			// For https://github.com/Leaflet/Leaflet/issues/3332
			if (ielt9) {
				setTimeout(bind(done, this, null, tile), 0);
			} else {
				done(null, tile);
			}
		},

		_tileOnError: function (done, tile, e) {
			var errorUrl = this.options.errorTileUrl;
			if (errorUrl && tile.getAttribute('src') !== errorUrl) {
				tile.src = errorUrl;
			}
			done(e, tile);
		},

		_onTileRemove: function (e) {
			e.tile.onload = null;
		},

		_getZoomForUrl: function () {
			var zoom = this._tileZoom,
			maxZoom = this.options.maxZoom,
			zoomReverse = this.options.zoomReverse,
			zoomOffset = this.options.zoomOffset;

			if (zoomReverse) {
				zoom = maxZoom - zoom;
			}

			return zoom + zoomOffset;
		},

		_getSubdomain: function (tilePoint) {
			var index = Math.abs(tilePoint.x + tilePoint.y) % this.options.subdomains.length;
			return this.options.subdomains[index];
		},

		// stops loading all tiles in the background layer
		_abortLoading: function () {
			var i, tile;
			for (i in this._tiles) {
				if (this._tiles[i].coords.z !== this._tileZoom) {
					tile = this._tiles[i].el;

					tile.onload = falseFn;
					tile.onerror = falseFn;

					if (!tile.complete) {
						tile.src = emptyImageUrl;
						remove(tile);
						delete this._tiles[i];
					}
				}
			}
		},

		_removeTile: function (key) {
			var tile = this._tiles[key];
			if (!tile) { return; }

			// Cancels any pending http requests associated with the tile
			// unless we're on Android's stock browser,
			// see https://github.com/Leaflet/Leaflet/issues/137
			if (!androidStock) {
				tile.el.setAttribute('src', emptyImageUrl);
			}

			return GridLayer.prototype._removeTile.call(this, key);
		},

		_tileReady: function (coords, err, tile) {
			if (!this._map || (tile && tile.getAttribute('src') === emptyImageUrl)) {
				return;
			}

			return GridLayer.prototype._tileReady.call(this, coords, err, tile);
		}
	});


	// @factory L.tilelayer(urlTemplate: String, options?: TileLayer options)
	// Instantiates a tile layer object given a `URL template` and optionally an options object.

	function tileLayer(url, options) {
		return new TileLayer(url, options);
	}

	/*
	 * @class TileLayer.WMS
	 * @inherits TileLayer
	 * @aka L.TileLayer.WMS
	 * Used to display [WMS](https://en.wikipedia.org/wiki/Web_Map_Service) services as tile layers on the map. Extends `TileLayer`.
	 *
	 * @example
	 *
	 * ```js
	 * var nexrad = L.tileLayer.wms("http://mesonet.agron.iastate.edu/cgi-bin/wms/nexrad/n0r.cgi", {
	 * 	layers: 'nexrad-n0r-900913',
	 * 	format: 'image/png',
	 * 	transparent: true,
	 * 	attribution: "Weather data © 2012 IEM Nexrad"
	 * });
	 * ```
	 */

	var TileLayerWMS = TileLayer.extend({

		// @section
		// @aka TileLayer.WMS options
		// If any custom options not documented here are used, they will be sent to the
		// WMS server as extra parameters in each request URL. This can be useful for
		// [non-standard vendor WMS parameters](http://docs.geoserver.org/stable/en/user/services/wms/vendor.html).
		defaultWmsParams: {
			service: 'WMS',
			request: 'GetMap',

			// @option layers: String = ''
			// **(required)** Comma-separated list of WMS layers to show.
			layers: '',

			// @option styles: String = ''
			// Comma-separated list of WMS styles.
			styles: '',

			// @option format: String = 'image/jpeg'
			// WMS image format (use `'image/png'` for layers with transparency).
			format: 'image/jpeg',

			// @option transparent: Boolean = false
			// If `true`, the WMS service will return images with transparency.
			transparent: false,

			// @option version: String = '1.1.1'
			// Version of the WMS service to use
			version: '1.1.1'
		},

		options: {
			// @option crs: CRS = null
			// Coordinate Reference System to use for the WMS requests, defaults to
			// map CRS. Don't change this if you're not sure what it means.
			crs: null,

			// @option uppercase: Boolean = false
			// If `true`, WMS request parameter keys will be uppercase.
			uppercase: false
		},

		initialize: function (url, options) {

			this._url = url;

			var wmsParams = extend({}, this.defaultWmsParams);

			// all keys that are not TileLayer options go to WMS params
			for (var i in options) {
				if (!(i in this.options)) {
					wmsParams[i] = options[i];
				}
			}

			options = setOptions(this, options);

			var realRetina = options.detectRetina && retina ? 2 : 1;
			var tileSize = this.getTileSize();
			wmsParams.width = tileSize.x * realRetina;
			wmsParams.height = tileSize.y * realRetina;

			this.wmsParams = wmsParams;
		},

		onAdd: function (map) {

			this._crs = this.options.crs || map.options.crs;
			this._wmsVersion = parseFloat(this.wmsParams.version);

			var projectionKey = this._wmsVersion >= 1.3 ? 'crs' : 'srs';
			this.wmsParams[projectionKey] = this._crs.code;

			TileLayer.prototype.onAdd.call(this, map);
		},

		getTileUrl: function (coords) {

			var tileBounds = this._tileCoordsToNwSe(coords),
					crs = this._crs,
					bounds = toBounds(crs.project(tileBounds[0]), crs.project(tileBounds[1])),
					min = bounds.min,
					max = bounds.max,
					bbox = (this._wmsVersion >= 1.3 && this._crs === EPSG4326 ?
					[min.y, min.x, max.y, max.x] :
					[min.x, min.y, max.x, max.y]).join(','),
					url = TileLayer.prototype.getTileUrl.call(this, coords);
			return url +
				getParamString(this.wmsParams, url, this.options.uppercase) +
				(this.options.uppercase ? '&BBOX=' : '&bbox=') + bbox;
		},

		// @method setParams(params: Object, noRedraw?: Boolean): this
		// Merges an object with the new parameters and re-requests tiles on the current screen (unless `noRedraw` was set to true).
		setParams: function (params, noRedraw) {

			extend(this.wmsParams, params);

			if (!noRedraw) {
				this.redraw();
			}

			return this;
		}
	});


	// @factory L.tileLayer.wms(baseUrl: String, options: TileLayer.WMS options)
	// Instantiates a WMS tile layer object given a base URL of the WMS service and a WMS parameters/options object.
	function tileLayerWMS(url, options) {
		return new TileLayerWMS(url, options);
	}

	TileLayer.WMS = TileLayerWMS;
	tileLayer.wms = tileLayerWMS;

	/*
	 * @class Renderer
	 * @inherits Layer
	 * @aka L.Renderer
	 *
	 * Base class for vector renderer implementations (`SVG`, `Canvas`). Handles the
	 * DOM container of the renderer, its bounds, and its zoom animation.
	 *
	 * A `Renderer` works as an implicit layer group for all `Path`s - the renderer
	 * itself can be added or removed to the map. All paths use a renderer, which can
	 * be implicit (the map will decide the type of renderer and use it automatically)
	 * or explicit (using the [`renderer`](#path-renderer) option of the path).
	 *
	 * Do not use this class directly, use `SVG` and `Canvas` instead.
	 *
	 * @event update: Event
	 * Fired when the renderer updates its bounds, center and zoom, for example when
	 * its map has moved
	 */

	var Renderer = Layer.extend({

		// @section
		// @aka Renderer options
		options: {
			// @option padding: Number = 0.1
			// How much to extend the clip area around the map view (relative to its size)
			// e.g. 0.1 would be 10% of map view in each direction
			padding: 0.1,

			// @option tolerance: Number = 0
			// How much to extend click tolerance round a path/object on the map
			tolerance : 0
		},

		initialize: function (options) {
			setOptions(this, options);
			stamp(this);
			this._layers = this._layers || {};
		},

		onAdd: function () {
			if (!this._container) {
				this._initContainer(); // defined by renderer implementations

				if (this._zoomAnimated) {
					addClass(this._container, 'leaflet-zoom-animated');
				}
			}

			this.getPane().appendChild(this._container);
			this._update();
			this.on('update', this._updatePaths, this);
		},

		onRemove: function () {
			this.off('update', this._updatePaths, this);
			this._destroyContainer();
		},

		getEvents: function () {
			var events = {
				viewreset: this._reset,
				zoom: this._onZoom,
				moveend: this._update,
				zoomend: this._onZoomEnd
			};
			if (this._zoomAnimated) {
				events.zoomanim = this._onAnimZoom;
			}
			return events;
		},

		_onAnimZoom: function (ev) {
			this._updateTransform(ev.center, ev.zoom);
		},

		_onZoom: function () {
			this._updateTransform(this._map.getCenter(), this._map.getZoom());
		},

		_updateTransform: function (center, zoom) {
			var scale = this._map.getZoomScale(zoom, this._zoom),
					position = getPosition(this._container),
					viewHalf = this._map.getSize().multiplyBy(0.5 + this.options.padding),
					currentCenterPoint = this._map.project(this._center, zoom),
					destCenterPoint = this._map.project(center, zoom),
					centerOffset = destCenterPoint.subtract(currentCenterPoint),

					topLeftOffset = viewHalf.multiplyBy(-scale).add(position).add(viewHalf).subtract(centerOffset);

			if (any3d) {
				setTransform(this._container, topLeftOffset, scale);
			} else {
				setPosition(this._container, topLeftOffset);
			}
		},

		_reset: function () {
			this._update();
			this._updateTransform(this._center, this._zoom);

			for (var id in this._layers) {
				this._layers[id]._reset();
			}
		},

		_onZoomEnd: function () {
			for (var id in this._layers) {
				this._layers[id]._project();
			}
		},

		_updatePaths: function () {
			for (var id in this._layers) {
				this._layers[id]._update();
			}
		},

		_update: function () {
			// Update pixel bounds of renderer container (for positioning/sizing/clipping later)
			// Subclasses are responsible of firing the 'update' event.
			var p = this.options.padding,
					size = this._map.getSize(),
					min = this._map.containerPointToLayerPoint(size.multiplyBy(-p)).round();

			this._bounds = new Bounds(min, min.add(size.multiplyBy(1 + p * 2)).round());

			this._center = this._map.getCenter();
			this._zoom = this._map.getZoom();
		}
	});

	/*
	 * @class Canvas
	 * @inherits Renderer
	 * @aka L.Canvas
	 *
	 * Allows vector layers to be displayed with [`<canvas>`](https://developer.mozilla.org/docs/Web/API/Canvas_API).
	 * Inherits `Renderer`.
	 *
	 * Due to [technical limitations](http://caniuse.com/#search=canvas), Canvas is not
	 * available in all web browsers, notably IE8, and overlapping geometries might
	 * not display properly in some edge cases.
	 *
	 * @example
	 *
	 * Use Canvas by default for all paths in the map:
	 *
	 * ```js
	 * var map = L.map('map', {
	 * 	renderer: L.canvas()
	 * });
	 * ```
	 *
	 * Use a Canvas renderer with extra padding for specific vector geometries:
	 *
	 * ```js
	 * var map = L.map('map');
	 * var myRenderer = L.canvas({ padding: 0.5 });
	 * var line = L.polyline( coordinates, { renderer: myRenderer } );
	 * var circle = L.circle( center, { renderer: myRenderer } );
	 * ```
	 */

	var Canvas = Renderer.extend({
		getEvents: function () {
			var events = Renderer.prototype.getEvents.call(this);
			events.viewprereset = this._onViewPreReset;
			return events;
		},

		_onViewPreReset: function () {
			// Set a flag so that a viewprereset+moveend+viewreset only updates&redraws once
			this._postponeUpdatePaths = true;
		},

		onAdd: function () {
			Renderer.prototype.onAdd.call(this);

			// Redraw vectors since canvas is cleared upon removal,
			// in case of removing the renderer itself from the map.
			this._draw();
		},

		_initContainer: function () {
			var container = this._container = document.createElement('canvas');

			on(container, 'mousemove', this._onMouseMove, this);
			on(container, 'click dblclick mousedown mouseup contextmenu', this._onClick, this);
			on(container, 'mouseout', this._handleMouseOut, this);

			this._ctx = container.getContext('2d');
		},

		_destroyContainer: function () {
			cancelAnimFrame(this._redrawRequest);
			delete this._ctx;
			remove(this._container);
			off(this._container);
			delete this._container;
		},

		_updatePaths: function () {
			if (this._postponeUpdatePaths) { return; }

			var layer;
			this._redrawBounds = null;
			for (var id in this._layers) {
				layer = this._layers[id];
				layer._update();
			}
			this._redraw();
		},

		_update: function () {
			if (this._map._animatingZoom && this._bounds) { return; }

			Renderer.prototype._update.call(this);

			var b = this._bounds,
					container = this._container,
					size = b.getSize(),
					m = retina ? 2 : 1;

			setPosition(container, b.min);

			// set canvas size (also clearing it); use double size on retina
			container.width = m * size.x;
			container.height = m * size.y;
			container.style.width = size.x + 'px';
			container.style.height = size.y + 'px';

			if (retina) {
				this._ctx.scale(2, 2);
			}

			// translate so we use the same path coordinates after canvas element moves
			this._ctx.translate(-b.min.x, -b.min.y);

			// Tell paths to redraw themselves
			this.fire('update');
		},

		_reset: function () {
			Renderer.prototype._reset.call(this);

			if (this._postponeUpdatePaths) {
				this._postponeUpdatePaths = false;
				this._updatePaths();
			}
		},

		_initPath: function (layer) {
			this._updateDashArray(layer);
			this._layers[stamp(layer)] = layer;

			var order = layer._order = {
				layer: layer,
				prev: this._drawLast,
				next: null
			};
			if (this._drawLast) { this._drawLast.next = order; }
			this._drawLast = order;
			this._drawFirst = this._drawFirst || this._drawLast;
		},

		_addPath: function (layer) {
			this._requestRedraw(layer);
		},

		_removePath: function (layer) {
			var order = layer._order;
			var next = order.next;
			var prev = order.prev;

			if (next) {
				next.prev = prev;
			} else {
				this._drawLast = prev;
			}
			if (prev) {
				prev.next = next;
			} else {
				this._drawFirst = next;
			}

			delete layer._order;

			delete this._layers[stamp(layer)];

			this._requestRedraw(layer);
		},

		_updatePath: function (layer) {
			// Redraw the union of the layer's old pixel
			// bounds and the new pixel bounds.
			this._extendRedrawBounds(layer);
			layer._project();
			layer._update();
			// The redraw will extend the redraw bounds
			// with the new pixel bounds.
			this._requestRedraw(layer);
		},

		_updateStyle: function (layer) {
			this._updateDashArray(layer);
			this._requestRedraw(layer);
		},

		_updateDashArray: function (layer) {
			if (typeof layer.options.dashArray === 'string') {
				var parts = layer.options.dashArray.split(/[, ]+/),
						dashArray = [],
						dashValue,
						i;
				for (i = 0; i < parts.length; i++) {
					dashValue = Number(parts[i]);
					// Ignore dash array containing invalid lengths
					if (isNaN(dashValue)) { return; }
					dashArray.push(dashValue);
				}
				layer.options._dashArray = dashArray;
			} else {
				layer.options._dashArray = layer.options.dashArray;
			}
		},

		_requestRedraw: function (layer) {
			if (!this._map) { return; }

			this._extendRedrawBounds(layer);
			this._redrawRequest = this._redrawRequest || requestAnimFrame(this._redraw, this);
		},

		_extendRedrawBounds: function (layer) {
			if (layer._pxBounds) {
				var padding = (layer.options.weight || 0) + 1;
				this._redrawBounds = this._redrawBounds || new Bounds();
				this._redrawBounds.extend(layer._pxBounds.min.subtract([padding, padding]));
				this._redrawBounds.extend(layer._pxBounds.max.add([padding, padding]));
			}
		},

		_redraw: function () {
			this._redrawRequest = null;

			if (this._redrawBounds) {
				this._redrawBounds.min._floor();
				this._redrawBounds.max._ceil();
			}

			this._clear(); // clear layers in redraw bounds
			this._draw(); // draw layers

			this._redrawBounds = null;
		},

		_clear: function () {
			var bounds = this._redrawBounds;
			if (bounds) {
				var size = bounds.getSize();
				this._ctx.clearRect(bounds.min.x, bounds.min.y, size.x, size.y);
			} else {
				this._ctx.save();
				this._ctx.setTransform(1, 0, 0, 1, 0, 0);
				this._ctx.clearRect(0, 0, this._container.width, this._container.height);
				this._ctx.restore();
			}
		},

		_draw: function () {
			var layer, bounds = this._redrawBounds;
			this._ctx.save();
			if (bounds) {
				var size = bounds.getSize();
				this._ctx.beginPath();
				this._ctx.rect(bounds.min.x, bounds.min.y, size.x, size.y);
				this._ctx.clip();
			}

			this._drawing = true;

			for (var order = this._drawFirst; order; order = order.next) {
				layer = order.layer;
				if (!bounds || (layer._pxBounds && layer._pxBounds.intersects(bounds))) {
					layer._updatePath();
				}
			}

			this._drawing = false;

			this._ctx.restore();  // Restore state before clipping.
		},

		_updatePoly: function (layer, closed) {
			if (!this._drawing) { return; }

			var i, j, len2, p,
					parts = layer._parts,
					len = parts.length,
					ctx = this._ctx;

			if (!len) { return; }

			ctx.beginPath();

			for (i = 0; i < len; i++) {
				for (j = 0, len2 = parts[i].length; j < len2; j++) {
					p = parts[i][j];
					ctx[j ? 'lineTo' : 'moveTo'](p.x, p.y);
				}
				if (closed) {
					ctx.closePath();
				}
			}

			this._fillStroke(ctx, layer);

			// TODO optimization: 1 fill/stroke for all features with equal style instead of 1 for each feature
		},

		_updateCircle: function (layer) {

			if (!this._drawing || layer._empty()) { return; }

			var p = layer._point,
					ctx = this._ctx,
					r = Math.max(Math.round(layer._radius), 1),
					s = (Math.max(Math.round(layer._radiusY), 1) || r) / r;

			if (s !== 1) {
				ctx.save();
				ctx.scale(1, s);
			}

			ctx.beginPath();
			ctx.arc(p.x, p.y / s, r, 0, Math.PI * 2, false);

			if (s !== 1) {
				ctx.restore();
			}

			this._fillStroke(ctx, layer);
		},

		_fillStroke: function (ctx, layer) {
			var options = layer.options;

			if (options.fill) {
				ctx.globalAlpha = options.fillOpacity;
				ctx.fillStyle = options.fillColor || options.color;
				ctx.fill(options.fillRule || 'evenodd');
			}

			if (options.stroke && options.weight !== 0) {
				if (ctx.setLineDash) {
					ctx.setLineDash(layer.options && layer.options._dashArray || []);
				}
				ctx.globalAlpha = options.opacity;
				ctx.lineWidth = options.weight;
				ctx.strokeStyle = options.color;
				ctx.lineCap = options.lineCap;
				ctx.lineJoin = options.lineJoin;
				ctx.stroke();
			}
		},

		// Canvas obviously doesn't have mouse events for individual drawn objects,
		// so we emulate that by calculating what's under the mouse on mousemove/click manually

		_onClick: function (e) {
			var point = this._map.mouseEventToLayerPoint(e), layer, clickedLayer;

			for (var order = this._drawFirst; order; order = order.next) {
				layer = order.layer;
				if (layer.options.interactive && layer._containsPoint(point)) {
					if (!(e.type === 'click' || e.type !== 'preclick') || !this._map._draggableMoved(layer)) {
						clickedLayer = layer;
					}
				}
			}
			if (clickedLayer)  {
				fakeStop(e);
				this._fireEvent([clickedLayer], e);
			}
		},

		_onMouseMove: function (e) {
			if (!this._map || this._map.dragging.moving() || this._map._animatingZoom) { return; }

			var point = this._map.mouseEventToLayerPoint(e);
			this._handleMouseHover(e, point);
		},


		_handleMouseOut: function (e) {
			var layer = this._hoveredLayer;
			if (layer) {
				// if we're leaving the layer, fire mouseout
				removeClass(this._container, 'leaflet-interactive');
				this._fireEvent([layer], e, 'mouseout');
				this._hoveredLayer = null;
				this._mouseHoverThrottled = false;
			}
		},

		_handleMouseHover: function (e, point) {
			if (this._mouseHoverThrottled) {
				return;
			}

			var layer, candidateHoveredLayer;

			for (var order = this._drawFirst; order; order = order.next) {
				layer = order.layer;
				if (layer.options.interactive && layer._containsPoint(point)) {
					candidateHoveredLayer = layer;
				}
			}

			if (candidateHoveredLayer !== this._hoveredLayer) {
				this._handleMouseOut(e);

				if (candidateHoveredLayer) {
					addClass(this._container, 'leaflet-interactive'); // change cursor
					this._fireEvent([candidateHoveredLayer], e, 'mouseover');
					this._hoveredLayer = candidateHoveredLayer;
				}
			}

			if (this._hoveredLayer) {
				this._fireEvent([this._hoveredLayer], e);
			}

			this._mouseHoverThrottled = true;
			setTimeout(bind(function () {
				this._mouseHoverThrottled = false;
			}, this), 32);
		},

		_fireEvent: function (layers, e, type) {
			this._map._fireDOMEvent(e, type || e.type, layers);
		},

		_bringToFront: function (layer) {
			var order = layer._order;

			if (!order) { return; }

			var next = order.next;
			var prev = order.prev;

			if (next) {
				next.prev = prev;
			} else {
				// Already last
				return;
			}
			if (prev) {
				prev.next = next;
			} else if (next) {
				// Update first entry unless this is the
				// single entry
				this._drawFirst = next;
			}

			order.prev = this._drawLast;
			this._drawLast.next = order;

			order.next = null;
			this._drawLast = order;

			this._requestRedraw(layer);
		},

		_bringToBack: function (layer) {
			var order = layer._order;

			if (!order) { return; }

			var next = order.next;
			var prev = order.prev;

			if (prev) {
				prev.next = next;
			} else {
				// Already first
				return;
			}
			if (next) {
				next.prev = prev;
			} else if (prev) {
				// Update last entry unless this is the
				// single entry
				this._drawLast = prev;
			}

			order.prev = null;

			order.next = this._drawFirst;
			this._drawFirst.prev = order;
			this._drawFirst = order;

			this._requestRedraw(layer);
		}
	});

	// @factory L.canvas(options?: Renderer options)
	// Creates a Canvas renderer with the given options.
	function canvas$1(options) {
		return canvas ? new Canvas(options) : null;
	}

	/*
	 * Thanks to Dmitry Baranovsky and his Raphael library for inspiration!
	 */


	var vmlCreate = (function () {
		try {
			document.namespaces.add('lvml', 'urn:schemas-microsoft-com:vml');
			return function (name) {
				return document.createElement('<lvml:' + name + ' class="lvml">');
			};
		} catch (e) {
			return function (name) {
				return document.createElement('<' + name + ' xmlns="urn:schemas-microsoft.com:vml" class="lvml">');
			};
		}
	})();


	/*
	 * @class SVG
	 *
	 *
	 * VML was deprecated in 2012, which means VML functionality exists only for backwards compatibility
	 * with old versions of Internet Explorer.
	 */

	// mixin to redefine some SVG methods to handle VML syntax which is similar but with some differences
	var vmlMixin = {

		_initContainer: function () {
			this._container = create$1('div', 'leaflet-vml-container');
		},

		_update: function () {
			if (this._map._animatingZoom) { return; }
			Renderer.prototype._update.call(this);
			this.fire('update');
		},

		_initPath: function (layer) {
			var container = layer._container = vmlCreate('shape');

			addClass(container, 'leaflet-vml-shape ' + (this.options.className || ''));

			container.coordsize = '1 1';

			layer._path = vmlCreate('path');
			container.appendChild(layer._path);

			this._updateStyle(layer);
			this._layers[stamp(layer)] = layer;
		},

		_addPath: function (layer) {
			var container = layer._container;
			this._container.appendChild(container);

			if (layer.options.interactive) {
				layer.addInteractiveTarget(container);
			}
		},

		_removePath: function (layer) {
			var container = layer._container;
			remove(container);
			layer.removeInteractiveTarget(container);
			delete this._layers[stamp(layer)];
		},

		_updateStyle: function (layer) {
			var stroke = layer._stroke,
					fill = layer._fill,
					options = layer.options,
					container = layer._container;

			container.stroked = !!options.stroke;
			container.filled = !!options.fill;

			if (options.stroke) {
				if (!stroke) {
					stroke = layer._stroke = vmlCreate('stroke');
				}
				container.appendChild(stroke);
				stroke.weight = options.weight + 'px';
				stroke.color = options.color;
				stroke.opacity = options.opacity;

				if (options.dashArray) {
					stroke.dashStyle = isArray(options.dashArray) ?
							options.dashArray.join(' ') :
							options.dashArray.replace(/( *, *)/g, ' ');
				} else {
					stroke.dashStyle = '';
				}
				stroke.endcap = options.lineCap.replace('butt', 'flat');
				stroke.joinstyle = options.lineJoin;

			} else if (stroke) {
				container.removeChild(stroke);
				layer._stroke = null;
			}

			if (options.fill) {
				if (!fill) {
					fill = layer._fill = vmlCreate('fill');
				}
				container.appendChild(fill);
				fill.color = options.fillColor || options.color;
				fill.opacity = options.fillOpacity;

			} else if (fill) {
				container.removeChild(fill);
				layer._fill = null;
			}
		},

		_updateCircle: function (layer) {
			var p = layer._point.round(),
					r = Math.round(layer._radius),
					r2 = Math.round(layer._radiusY || r);

			this._setPath(layer, layer._empty() ? 'M0 0' :
				'AL ' + p.x + ',' + p.y + ' ' + r + ',' + r2 + ' 0,' + (65535 * 360));
		},

		_setPath: function (layer, path) {
			layer._path.v = path;
		},

		_bringToFront: function (layer) {
			toFront(layer._container);
		},

		_bringToBack: function (layer) {
			toBack(layer._container);
		}
	};

	var create$2 = vml ? vmlCreate : svgCreate;

	/*
	 * @class SVG
	 * @inherits Renderer
	 * @aka L.SVG
	 *
	 * Allows vector layers to be displayed with [SVG](https://developer.mozilla.org/docs/Web/SVG).
	 * Inherits `Renderer`.
	 *
	 * Due to [technical limitations](http://caniuse.com/#search=svg), SVG is not
	 * available in all web browsers, notably Android 2.x and 3.x.
	 *
	 * Although SVG is not available on IE7 and IE8, these browsers support
	 * [VML](https://en.wikipedia.org/wiki/Vector_Markup_Language)
	 * (a now deprecated technology), and the SVG renderer will fall back to VML in
	 * this case.
	 *
	 * @example
	 *
	 * Use SVG by default for all paths in the map:
	 *
	 * ```js
	 * var map = L.map('map', {
	 * 	renderer: L.svg()
	 * });
	 * ```
	 *
	 * Use a SVG renderer with extra padding for specific vector geometries:
	 *
	 * ```js
	 * var map = L.map('map');
	 * var myRenderer = L.svg({ padding: 0.5 });
	 * var line = L.polyline( coordinates, { renderer: myRenderer } );
	 * var circle = L.circle( center, { renderer: myRenderer } );
	 * ```
	 */

	var SVG = Renderer.extend({

		getEvents: function () {
			var events = Renderer.prototype.getEvents.call(this);
			events.zoomstart = this._onZoomStart;
			return events;
		},

		_initContainer: function () {
			this._container = create$2('svg');

			// makes it possible to click through svg root; we'll reset it back in individual paths
			this._container.setAttribute('pointer-events', 'none');

			this._rootGroup = create$2('g');
			this._container.appendChild(this._rootGroup);
		},

		_destroyContainer: function () {
			remove(this._container);
			off(this._container);
			delete this._container;
			delete this._rootGroup;
			delete this._svgSize;
		},

		_onZoomStart: function () {
			// Drag-then-pinch interactions might mess up the center and zoom.
			// In this case, the easiest way to prevent this is re-do the renderer
			//   bounds and padding when the zooming starts.
			this._update();
		},

		_update: function () {
			if (this._map._animatingZoom && this._bounds) { return; }

			Renderer.prototype._update.call(this);

			var b = this._bounds,
					size = b.getSize(),
					container = this._container;

			// set size of svg-container if changed
			if (!this._svgSize || !this._svgSize.equals(size)) {
				this._svgSize = size;
				container.setAttribute('width', size.x);
				container.setAttribute('height', size.y);
			}

			// movement: update container viewBox so that we don't have to change coordinates of individual layers
			setPosition(container, b.min);
			container.setAttribute('viewBox', [b.min.x, b.min.y, size.x, size.y].join(' '));

			this.fire('update');
		},

		// methods below are called by vector layers implementations

		_initPath: function (layer) {
			var path = layer._path = create$2('path');

			// @namespace Path
			// @option className: String = null
			// Custom class name set on an element. Only for SVG renderer.
			if (layer.options.className) {
				addClass(path, layer.options.className);
			}

			if (layer.options.interactive) {
				addClass(path, 'leaflet-interactive');
			}

			this._updateStyle(layer);
			this._layers[stamp(layer)] = layer;
		},

		_addPath: function (layer) {
			if (!this._rootGroup) { this._initContainer(); }
			this._rootGroup.appendChild(layer._path);
			layer.addInteractiveTarget(layer._path);
		},

		_removePath: function (layer) {
			remove(layer._path);
			layer.removeInteractiveTarget(layer._path);
			delete this._layers[stamp(layer)];
		},

		_updatePath: function (layer) {
			layer._project();
			layer._update();
		},

		_updateStyle: function (layer) {
			var path = layer._path,
					options = layer.options;

			if (!path) { return; }

			if (options.stroke) {
				path.setAttribute('stroke', options.color);
				path.setAttribute('stroke-opacity', options.opacity);
				path.setAttribute('stroke-width', options.weight);
				path.setAttribute('stroke-linecap', options.lineCap);
				path.setAttribute('stroke-linejoin', options.lineJoin);

				if (options.dashArray) {
					path.setAttribute('stroke-dasharray', options.dashArray);
				} else {
					path.removeAttribute('stroke-dasharray');
				}

				if (options.dashOffset) {
					path.setAttribute('stroke-dashoffset', options.dashOffset);
				} else {
					path.removeAttribute('stroke-dashoffset');
				}
			} else {
				path.setAttribute('stroke', 'none');
			}

			if (options.fill) {
				path.setAttribute('fill', options.fillColor || options.color);
				path.setAttribute('fill-opacity', options.fillOpacity);
				path.setAttribute('fill-rule', options.fillRule || 'evenodd');
			} else {
				path.setAttribute('fill', 'none');
			}
		},

		_updatePoly: function (layer, closed) {
			this._setPath(layer, pointsToPath(layer._parts, closed));
		},

		_updateCircle: function (layer) {
			var p = layer._point,
					r = Math.max(Math.round(layer._radius), 1),
					r2 = Math.max(Math.round(layer._radiusY), 1) || r,
					arc = 'a' + r + ',' + r2 + ' 0 1,0 ';

			// drawing a circle with two half-arcs
			var d = layer._empty() ? 'M0 0' :
				'M' + (p.x - r) + ',' + p.y +
				arc + (r * 2) + ',0 ' +
				arc + (-r * 2) + ',0 ';

			this._setPath(layer, d);
		},

		_setPath: function (layer, path) {
			layer._path.setAttribute('d', path);
		},

		// SVG does not have the concept of zIndex so we resort to changing the DOM order of elements
		_bringToFront: function (layer) {
			toFront(layer._path);
		},

		_bringToBack: function (layer) {
			toBack(layer._path);
		}
	});

	if (vml) {
		SVG.include(vmlMixin);
	}

	// @namespace SVG
	// @factory L.svg(options?: Renderer options)
	// Creates a SVG renderer with the given options.
	function svg$1(options) {
		return svg || vml ? new SVG(options) : null;
	}

	Map.include({
		// @namespace Map; @method getRenderer(layer: Path): Renderer
		// Returns the instance of `Renderer` that should be used to render the given
		// `Path`. It will ensure that the `renderer` options of the map and paths
		// are respected, and that the renderers do exist on the map.
		getRenderer: function (layer) {
			// @namespace Path; @option renderer: Renderer
			// Use this specific instance of `Renderer` for this path. Takes
			// precedence over the map's [default renderer](#map-renderer).
			var renderer = layer.options.renderer || this._getPaneRenderer(layer.options.pane) || this.options.renderer || this._renderer;

			if (!renderer) {
				renderer = this._renderer = this._createRenderer();
			}

			if (!this.hasLayer(renderer)) {
				this.addLayer(renderer);
			}
			return renderer;
		},

		_getPaneRenderer: function (name) {
			if (name === 'overlayPane' || name === undefined) {
				return false;
			}

			var renderer = this._paneRenderers[name];
			if (renderer === undefined) {
				renderer = this._createRenderer({pane: name});
				this._paneRenderers[name] = renderer;
			}
			return renderer;
		},

		_createRenderer: function (options) {
			// @namespace Map; @option preferCanvas: Boolean = false
			// Whether `Path`s should be rendered on a `Canvas` renderer.
			// By default, all `Path`s are rendered in a `SVG` renderer.
			return (this.options.preferCanvas && canvas$1(options)) || svg$1(options);
		}
	});

	/*
	 * L.Rectangle extends Polygon and creates a rectangle when passed a LatLngBounds object.
	 */

	/*
	 * @class Rectangle
	 * @aka L.Rectangle
	 * @inherits Polygon
	 *
	 * A class for drawing rectangle overlays on a map. Extends `Polygon`.
	 *
	 * @example
	 *
	 * ```js
	 * // define rectangle geographical bounds
	 * var bounds = [[54.559322, -5.767822], [56.1210604, -3.021240]];
	 *
	 * // create an orange rectangle
	 * L.rectangle(bounds, {color: "#ff7800", weight: 1}).addTo(map);
	 *
	 * // zoom the map to the rectangle bounds
	 * map.fitBounds(bounds);
	 * ```
	 *
	 */


	var Rectangle = Polygon.extend({
		initialize: function (latLngBounds, options) {
			Polygon.prototype.initialize.call(this, this._boundsToLatLngs(latLngBounds), options);
		},

		// @method setBounds(latLngBounds: LatLngBounds): this
		// Redraws the rectangle with the passed bounds.
		setBounds: function (latLngBounds) {
			return this.setLatLngs(this._boundsToLatLngs(latLngBounds));
		},

		_boundsToLatLngs: function (latLngBounds) {
			latLngBounds = toLatLngBounds(latLngBounds);
			return [
				latLngBounds.getSouthWest(),
				latLngBounds.getNorthWest(),
				latLngBounds.getNorthEast(),
				latLngBounds.getSouthEast()
			];
		}
	});


	// @factory L.rectangle(latLngBounds: LatLngBounds, options?: Polyline options)
	function rectangle(latLngBounds, options) {
		return new Rectangle(latLngBounds, options);
	}

	SVG.create = create$2;
	SVG.pointsToPath = pointsToPath;

	GeoJSON.geometryToLayer = geometryToLayer;
	GeoJSON.coordsToLatLng = coordsToLatLng;
	GeoJSON.coordsToLatLngs = coordsToLatLngs;
	GeoJSON.latLngToCoords = latLngToCoords;
	GeoJSON.latLngsToCoords = latLngsToCoords;
	GeoJSON.getFeature = getFeature;
	GeoJSON.asFeature = asFeature;

	/*
	 * L.Handler.BoxZoom is used to add shift-drag zoom interaction to the map
	 * (zoom to a selected bounding box), enabled by default.
	 */

	// @namespace Map
	// @section Interaction Options
	Map.mergeOptions({
		// @option boxZoom: Boolean = true
		// Whether the map can be zoomed to a rectangular area specified by
		// dragging the mouse while pressing the shift key.
		boxZoom: true
	});

	var BoxZoom = Handler.extend({
		initialize: function (map) {
			this._map = map;
			this._container = map._container;
			this._pane = map._panes.overlayPane;
			this._resetStateTimeout = 0;
			map.on('unload', this._destroy, this);
		},

		addHooks: function () {
			on(this._container, 'mousedown', this._onMouseDown, this);
		},

		removeHooks: function () {
			off(this._container, 'mousedown', this._onMouseDown, this);
		},

		moved: function () {
			return this._moved;
		},

		_destroy: function () {
			remove(this._pane);
			delete this._pane;
		},

		_resetState: function () {
			this._resetStateTimeout = 0;
			this._moved = false;
		},

		_clearDeferredResetState: function () {
			if (this._resetStateTimeout !== 0) {
				clearTimeout(this._resetStateTimeout);
				this._resetStateTimeout = 0;
			}
		},

		_onMouseDown: function (e) {
			if (!e.shiftKey || ((e.which !== 1) && (e.button !== 1))) { return false; }

			// Clear the deferred resetState if it hasn't executed yet, otherwise it
			// will interrupt the interaction and orphan a box element in the container.
			this._clearDeferredResetState();
			this._resetState();

			disableTextSelection();
			disableImageDrag();

			this._startPoint = this._map.mouseEventToContainerPoint(e);

			on(document, {
				contextmenu: stop,
				mousemove: this._onMouseMove,
				mouseup: this._onMouseUp,
				keydown: this._onKeyDown
			}, this);
		},

		_onMouseMove: function (e) {
			if (!this._moved) {
				this._moved = true;

				this._box = create$1('div', 'leaflet-zoom-box', this._container);
				addClass(this._container, 'leaflet-crosshair');

				this._map.fire('boxzoomstart');
			}

			this._point = this._map.mouseEventToContainerPoint(e);

			var bounds = new Bounds(this._point, this._startPoint),
					size = bounds.getSize();

			setPosition(this._box, bounds.min);

			this._box.style.width  = size.x + 'px';
			this._box.style.height = size.y + 'px';
		},

		_finish: function () {
			if (this._moved) {
				remove(this._box);
				removeClass(this._container, 'leaflet-crosshair');
			}

			enableTextSelection();
			enableImageDrag();

			off(document, {
				contextmenu: stop,
				mousemove: this._onMouseMove,
				mouseup: this._onMouseUp,
				keydown: this._onKeyDown
			}, this);
		},

		_onMouseUp: function (e) {
			if ((e.which !== 1) && (e.button !== 1)) { return; }

			this._finish();

			if (!this._moved) { return; }
			// Postpone to next JS tick so internal click event handling
			// still see it as "moved".
			this._clearDeferredResetState();
			this._resetStateTimeout = setTimeout(bind(this._resetState, this), 0);

			var bounds = new LatLngBounds(
							this._map.containerPointToLatLng(this._startPoint),
							this._map.containerPointToLatLng(this._point));

			this._map
				.fitBounds(bounds)
				.fire('boxzoomend', {boxZoomBounds: bounds});
		},

		_onKeyDown: function (e) {
			if (e.keyCode === 27) {
				this._finish();
			}
		}
	});

	// @section Handlers
	// @property boxZoom: Handler
	// Box (shift-drag with mouse) zoom handler.
	Map.addInitHook('addHandler', 'boxZoom', BoxZoom);

	/*
	 * L.Handler.DoubleClickZoom is used to handle double-click zoom on the map, enabled by default.
	 */

	// @namespace Map
	// @section Interaction Options

	Map.mergeOptions({
		// @option doubleClickZoom: Boolean|String = true
		// Whether the map can be zoomed in by double clicking on it and
		// zoomed out by double clicking while holding shift. If passed
		// `'center'`, double-click zoom will zoom to the center of the
		//  view regardless of where the mouse was.
		doubleClickZoom: true
	});

	var DoubleClickZoom = Handler.extend({
		addHooks: function () {
			this._map.on('dblclick', this._onDoubleClick, this);
		},

		removeHooks: function () {
			this._map.off('dblclick', this._onDoubleClick, this);
		},

		_onDoubleClick: function (e) {
			var map = this._map,
					oldZoom = map.getZoom(),
					delta = map.options.zoomDelta,
					zoom = e.originalEvent.shiftKey ? oldZoom - delta : oldZoom + delta;

			if (map.options.doubleClickZoom === 'center') {
				map.setZoom(zoom);
			} else {
				map.setZoomAround(e.containerPoint, zoom);
			}
		}
	});

	// @section Handlers
	//
	// Map properties include interaction handlers that allow you to control
	// interaction behavior in runtime, enabling or disabling certain features such
	// as dragging or touch zoom (see `Handler` methods). For example:
	//
	// ```js
	// map.doubleClickZoom.disable();
	// ```
	//
	// @property doubleClickZoom: Handler
	// Double click zoom handler.
	Map.addInitHook('addHandler', 'doubleClickZoom', DoubleClickZoom);

	/*
	 * L.Handler.MapDrag is used to make the map draggable (with panning inertia), enabled by default.
	 */

	// @namespace Map
	// @section Interaction Options
	Map.mergeOptions({
		// @option dragging: Boolean = true
		// Whether the map be draggable with mouse/touch or not.
		dragging: true,

		// @section Panning Inertia Options
		// @option inertia: Boolean = *
		// If enabled, panning of the map will have an inertia effect where
		// the map builds momentum while dragging and continues moving in
		// the same direction for some time. Feels especially nice on touch
		// devices. Enabled by default unless running on old Android devices.
		inertia: !android23,

		// @option inertiaDeceleration: Number = 3000
		// The rate with which the inertial movement slows down, in pixels/second².
		inertiaDeceleration: 3400, // px/s^2

		// @option inertiaMaxSpeed: Number = Infinity
		// Max speed of the inertial movement, in pixels/second.
		inertiaMaxSpeed: Infinity, // px/s

		// @option easeLinearity: Number = 0.2
		easeLinearity: 0.2,

		// TODO refactor, move to CRS
		// @option worldCopyJump: Boolean = false
		// With this option enabled, the map tracks when you pan to another "copy"
		// of the world and seamlessly jumps to the original one so that all overlays
		// like markers and vector layers are still visible.
		worldCopyJump: false,

		// @option maxBoundsViscosity: Number = 0.0
		// If `maxBounds` is set, this option will control how solid the bounds
		// are when dragging the map around. The default value of `0.0` allows the
		// user to drag outside the bounds at normal speed, higher values will
		// slow down map dragging outside bounds, and `1.0` makes the bounds fully
		// solid, preventing the user from dragging outside the bounds.
		maxBoundsViscosity: 0.0
	});

	var Drag = Handler.extend({
		addHooks: function () {
			if (!this._draggable) {
				var map = this._map;

				this._draggable = new Draggable(map._mapPane, map._container);

				this._draggable.on({
					dragstart: this._onDragStart,
					drag: this._onDrag,
					dragend: this._onDragEnd
				}, this);

				this._draggable.on('predrag', this._onPreDragLimit, this);
				if (map.options.worldCopyJump) {
					this._draggable.on('predrag', this._onPreDragWrap, this);
					map.on('zoomend', this._onZoomEnd, this);

					map.whenReady(this._onZoomEnd, this);
				}
			}
			addClass(this._map._container, 'leaflet-grab leaflet-touch-drag');
			this._draggable.enable();
			this._positions = [];
			this._times = [];
		},

		removeHooks: function () {
			removeClass(this._map._container, 'leaflet-grab');
			removeClass(this._map._container, 'leaflet-touch-drag');
			this._draggable.disable();
		},

		moved: function () {
			return this._draggable && this._draggable._moved;
		},

		moving: function () {
			return this._draggable && this._draggable._moving;
		},

		_onDragStart: function () {
			var map = this._map;

			map._stop();
			if (this._map.options.maxBounds && this._map.options.maxBoundsViscosity) {
				var bounds = toLatLngBounds(this._map.options.maxBounds);

				this._offsetLimit = toBounds(
					this._map.latLngToContainerPoint(bounds.getNorthWest()).multiplyBy(-1),
					this._map.latLngToContainerPoint(bounds.getSouthEast()).multiplyBy(-1)
						.add(this._map.getSize()));

				this._viscosity = Math.min(1.0, Math.max(0.0, this._map.options.maxBoundsViscosity));
			} else {
				this._offsetLimit = null;
			}

			map
					.fire('movestart')
					.fire('dragstart');

			if (map.options.inertia) {
				this._positions = [];
				this._times = [];
			}
		},

		_onDrag: function (e) {
			if (this._map.options.inertia) {
				var time = this._lastTime = +new Date(),
						pos = this._lastPos = this._draggable._absPos || this._draggable._newPos;

				this._positions.push(pos);
				this._times.push(time);

				this._prunePositions(time);
			}

			this._map
					.fire('move', e)
					.fire('drag', e);
		},

		_prunePositions: function (time) {
			while (this._positions.length > 1 && time - this._times[0] > 50) {
				this._positions.shift();
				this._times.shift();
			}
		},

		_onZoomEnd: function () {
			var pxCenter = this._map.getSize().divideBy(2),
					pxWorldCenter = this._map.latLngToLayerPoint([0, 0]);

			this._initialWorldOffset = pxWorldCenter.subtract(pxCenter).x;
			this._worldWidth = this._map.getPixelWorldBounds().getSize().x;
		},

		_viscousLimit: function (value, threshold) {
			return value - (value - threshold) * this._viscosity;
		},

		_onPreDragLimit: function () {
			if (!this._viscosity || !this._offsetLimit) { return; }

			var offset = this._draggable._newPos.subtract(this._draggable._startPos);

			var limit = this._offsetLimit;
			if (offset.x < limit.min.x) { offset.x = this._viscousLimit(offset.x, limit.min.x); }
			if (offset.y < limit.min.y) { offset.y = this._viscousLimit(offset.y, limit.min.y); }
			if (offset.x > limit.max.x) { offset.x = this._viscousLimit(offset.x, limit.max.x); }
			if (offset.y > limit.max.y) { offset.y = this._viscousLimit(offset.y, limit.max.y); }

			this._draggable._newPos = this._draggable._startPos.add(offset);
		},

		_onPreDragWrap: function () {
			// TODO refactor to be able to adjust map pane position after zoom
			var worldWidth = this._worldWidth,
					halfWidth = Math.round(worldWidth / 2),
					dx = this._initialWorldOffset,
					x = this._draggable._newPos.x,
					newX1 = (x - halfWidth + dx) % worldWidth + halfWidth - dx,
					newX2 = (x + halfWidth + dx) % worldWidth - halfWidth - dx,
					newX = Math.abs(newX1 + dx) < Math.abs(newX2 + dx) ? newX1 : newX2;

			this._draggable._absPos = this._draggable._newPos.clone();
			this._draggable._newPos.x = newX;
		},

		_onDragEnd: function (e) {
			var map = this._map,
					options = map.options,

					noInertia = !options.inertia || this._times.length < 2;

			map.fire('dragend', e);

			if (noInertia) {
				map.fire('moveend');

			} else {
				this._prunePositions(+new Date());

				var direction = this._lastPos.subtract(this._positions[0]),
						duration = (this._lastTime - this._times[0]) / 1000,
						ease = options.easeLinearity,

						speedVector = direction.multiplyBy(ease / duration),
						speed = speedVector.distanceTo([0, 0]),

						limitedSpeed = Math.min(options.inertiaMaxSpeed, speed),
						limitedSpeedVector = speedVector.multiplyBy(limitedSpeed / speed),

						decelerationDuration = limitedSpeed / (options.inertiaDeceleration * ease),
						offset = limitedSpeedVector.multiplyBy(-decelerationDuration / 2).round();

				if (!offset.x && !offset.y) {
					map.fire('moveend');

				} else {
					offset = map._limitOffset(offset, map.options.maxBounds);

					requestAnimFrame(function () {
						map.panBy(offset, {
							duration: decelerationDuration,
							easeLinearity: ease,
							noMoveStart: true,
							animate: true
						});
					});
				}
			}
		}
	});

	// @section Handlers
	// @property dragging: Handler
	// Map dragging handler (by both mouse and touch).
	Map.addInitHook('addHandler', 'dragging', Drag);

	/*
	 * L.Map.Keyboard is handling keyboard interaction with the map, enabled by default.
	 */

	// @namespace Map
	// @section Keyboard Navigation Options
	Map.mergeOptions({
		// @option keyboard: Boolean = true
		// Makes the map focusable and allows users to navigate the map with keyboard
		// arrows and `+`/`-` keys.
		keyboard: true,

		// @option keyboardPanDelta: Number = 80
		// Amount of pixels to pan when pressing an arrow key.
		keyboardPanDelta: 80
	});

	var Keyboard = Handler.extend({

		keyCodes: {
			left:    [37],
			right:   [39],
			down:    [40],
			up:      [38],
			zoomIn:  [187, 107, 61, 171],
			zoomOut: [189, 109, 54, 173]
		},

		initialize: function (map) {
			this._map = map;

			this._setPanDelta(map.options.keyboardPanDelta);
			this._setZoomDelta(map.options.zoomDelta);
		},

		addHooks: function () {
			var container = this._map._container;

			// make the container focusable by tabbing
			if (container.tabIndex <= 0) {
				container.tabIndex = '0';
			}

			on(container, {
				focus: this._onFocus,
				blur: this._onBlur,
				mousedown: this._onMouseDown
			}, this);

			this._map.on({
				focus: this._addHooks,
				blur: this._removeHooks
			}, this);
		},

		removeHooks: function () {
			this._removeHooks();

			off(this._map._container, {
				focus: this._onFocus,
				blur: this._onBlur,
				mousedown: this._onMouseDown
			}, this);

			this._map.off({
				focus: this._addHooks,
				blur: this._removeHooks
			}, this);
		},

		_onMouseDown: function () {
			if (this._focused) { return; }

			var body = document.body,
					docEl = document.documentElement,
					top = body.scrollTop || docEl.scrollTop,
					left = body.scrollLeft || docEl.scrollLeft;

			this._map._container.focus();

			window.scrollTo(left, top);
		},

		_onFocus: function () {
			this._focused = true;
			this._map.fire('focus');
		},

		_onBlur: function () {
			this._focused = false;
			this._map.fire('blur');
		},

		_setPanDelta: function (panDelta) {
			var keys = this._panKeys = {},
					codes = this.keyCodes,
					i, len;

			for (i = 0, len = codes.left.length; i < len; i++) {
				keys[codes.left[i]] = [-1 * panDelta, 0];
			}
			for (i = 0, len = codes.right.length; i < len; i++) {
				keys[codes.right[i]] = [panDelta, 0];
			}
			for (i = 0, len = codes.down.length; i < len; i++) {
				keys[codes.down[i]] = [0, panDelta];
			}
			for (i = 0, len = codes.up.length; i < len; i++) {
				keys[codes.up[i]] = [0, -1 * panDelta];
			}
		},

		_setZoomDelta: function (zoomDelta) {
			var keys = this._zoomKeys = {},
					codes = this.keyCodes,
					i, len;

			for (i = 0, len = codes.zoomIn.length; i < len; i++) {
				keys[codes.zoomIn[i]] = zoomDelta;
			}
			for (i = 0, len = codes.zoomOut.length; i < len; i++) {
				keys[codes.zoomOut[i]] = -zoomDelta;
			}
		},

		_addHooks: function () {
			on(document, 'keydown', this._onKeyDown, this);
		},

		_removeHooks: function () {
			off(document, 'keydown', this._onKeyDown, this);
		},

		_onKeyDown: function (e) {
			if (e.altKey || e.ctrlKey || e.metaKey) { return; }

			var key = e.keyCode,
					map = this._map,
					offset;

			if (key in this._panKeys) {
				if (!map._panAnim || !map._panAnim._inProgress) {
					offset = this._panKeys[key];
					if (e.shiftKey) {
						offset = toPoint(offset).multiplyBy(3);
					}

					map.panBy(offset);

					if (map.options.maxBounds) {
						map.panInsideBounds(map.options.maxBounds);
					}
				}
			} else if (key in this._zoomKeys) {
				map.setZoom(map.getZoom() + (e.shiftKey ? 3 : 1) * this._zoomKeys[key]);

			} else if (key === 27 && map._popup && map._popup.options.closeOnEscapeKey) {
				map.closePopup();

			} else {
				return;
			}

			stop(e);
		}
	});

	// @section Handlers
	// @section Handlers
	// @property keyboard: Handler
	// Keyboard navigation handler.
	Map.addInitHook('addHandler', 'keyboard', Keyboard);

	/*
	 * L.Handler.ScrollWheelZoom is used by L.Map to enable mouse scroll wheel zoom on the map.
	 */

	// @namespace Map
	// @section Interaction Options
	Map.mergeOptions({
		// @section Mouse wheel options
		// @option scrollWheelZoom: Boolean|String = true
		// Whether the map can be zoomed by using the mouse wheel. If passed `'center'`,
		// it will zoom to the center of the view regardless of where the mouse was.
		scrollWheelZoom: true,

		// @option wheelDebounceTime: Number = 40
		// Limits the rate at which a wheel can fire (in milliseconds). By default
		// user can't zoom via wheel more often than once per 40 ms.
		wheelDebounceTime: 40,

		// @option wheelPxPerZoomLevel: Number = 60
		// How many scroll pixels (as reported by [L.DomEvent.getWheelDelta](#domevent-getwheeldelta))
		// mean a change of one full zoom level. Smaller values will make wheel-zooming
		// faster (and vice versa).
		wheelPxPerZoomLevel: 60
	});

	var ScrollWheelZoom = Handler.extend({
		addHooks: function () {
			on(this._map._container, 'wheel', this._onWheelScroll, this);

			this._delta = 0;
		},

		removeHooks: function () {
			off(this._map._container, 'wheel', this._onWheelScroll, this);
		},

		_onWheelScroll: function (e) {
			var delta = getWheelDelta(e);

			var debounce = this._map.options.wheelDebounceTime;

			this._delta += delta;
			this._lastMousePos = this._map.mouseEventToContainerPoint(e);

			if (!this._startTime) {
				this._startTime = +new Date();
			}

			var left = Math.max(debounce - (+new Date() - this._startTime), 0);

			clearTimeout(this._timer);
			this._timer = setTimeout(bind(this._performZoom, this), left);

			stop(e);
		},

		_performZoom: function () {
			var map = this._map,
					zoom = map.getZoom(),
					snap = this._map.options.zoomSnap || 0;

			map._stop(); // stop panning and fly animations if any

			// map the delta with a sigmoid function to -4..4 range leaning on -1..1
			var d2 = this._delta / (this._map.options.wheelPxPerZoomLevel * 4),
					d3 = 4 * Math.log(2 / (1 + Math.exp(-Math.abs(d2)))) / Math.LN2,
					d4 = snap ? Math.ceil(d3 / snap) * snap : d3,
					delta = map._limitZoom(zoom + (this._delta > 0 ? d4 : -d4)) - zoom;

			this._delta = 0;
			this._startTime = null;

			if (!delta) { return; }

			if (map.options.scrollWheelZoom === 'center') {
				map.setZoom(zoom + delta);
			} else {
				map.setZoomAround(this._lastMousePos, zoom + delta);
			}
		}
	});

	// @section Handlers
	// @property scrollWheelZoom: Handler
	// Scroll wheel zoom handler.
	Map.addInitHook('addHandler', 'scrollWheelZoom', ScrollWheelZoom);

	/*
	 * L.Map.Tap is used to enable mobile hacks like quick taps and long hold.
	 */

	// @namespace Map
	// @section Interaction Options
	Map.mergeOptions({
		// @section Touch interaction options
		// @option tap: Boolean = true
		// Enables mobile hacks for supporting instant taps (fixing 200ms click
		// delay on iOS/Android) and touch holds (fired as `contextmenu` events).
		tap: true,

		// @option tapTolerance: Number = 15
		// The max number of pixels a user can shift his finger during touch
		// for it to be considered a valid tap.
		tapTolerance: 15
	});

	var Tap = Handler.extend({
		addHooks: function () {
			on(this._map._container, 'touchstart', this._onDown, this);
		},

		removeHooks: function () {
			off(this._map._container, 'touchstart', this._onDown, this);
		},

		_onDown: function (e) {
			if (!e.touches) { return; }

			preventDefault(e);

			this._fireClick = true;

			// don't simulate click or track longpress if more than 1 touch
			if (e.touches.length > 1) {
				this._fireClick = false;
				clearTimeout(this._holdTimeout);
				return;
			}

			var first = e.touches[0],
					el = first.target;

			this._startPos = this._newPos = new Point(first.clientX, first.clientY);

			// if touching a link, highlight it
			if (el.tagName && el.tagName.toLowerCase() === 'a') {
				addClass(el, 'leaflet-active');
			}

			// simulate long hold but setting a timeout
			this._holdTimeout = setTimeout(bind(function () {
				if (this._isTapValid()) {
					this._fireClick = false;
					this._onUp();
					this._simulateEvent('contextmenu', first);
				}
			}, this), 1000);

			this._simulateEvent('mousedown', first);

			on(document, {
				touchmove: this._onMove,
				touchend: this._onUp
			}, this);
		},

		_onUp: function (e) {
			clearTimeout(this._holdTimeout);

			off(document, {
				touchmove: this._onMove,
				touchend: this._onUp
			}, this);

			if (this._fireClick && e) {

				var first = e,
						el = first.target;

				if (el && el.tagName && el.tagName.toLowerCase() === 'a') {
					removeClass(el, 'leaflet-active');
				}

				this._simulateEvent('mouseup', first);

				// simulate click if the touch didn't move too much
				if (this._isTapValid()) {
					this._simulateEvent('click', first);
				}
			}
		},

		_isTapValid: function () {
			return this._newPos.distanceTo(this._startPos) <= this._map.options.tapTolerance;
		},

		_onMove: function (e) {
			var first = e.touches[0];
			this._newPos = new Point(first.clientX, first.clientY);
			this._simulateEvent('mousemove', first);
		},

		_simulateEvent: function (type, e) {
			var simulatedEvent = document.createEvent('MouseEvents');

			simulatedEvent._simulated = true;
			e.target._simulatedClick = true;

			simulatedEvent.initMouseEvent(
							type, true, true, window, 1,
							e.screenX, e.screenY,
							e.clientX, e.clientY,
							false, false, false, false, 0, null);

			e.target.dispatchEvent(simulatedEvent);
		}
	});

	// @section Handlers
	// @property tap: Handler
	// Mobile touch hacks (quick tap and touch hold) handler.
	if (touch && (!pointer || safari)) {
		Map.addInitHook('addHandler', 'tap', Tap);
	}

	/*
	 * L.Handler.TouchZoom is used by L.Map to add pinch zoom on supported mobile browsers.
	 */

	// @namespace Map
	// @section Interaction Options
	Map.mergeOptions({
		// @section Touch interaction options
		// @option touchZoom: Boolean|String = *
		// Whether the map can be zoomed by touch-dragging with two fingers. If
		// passed `'center'`, it will zoom to the center of the view regardless of
		// where the touch events (fingers) were. Enabled for touch-capable web
		// browsers except for old Androids.
		touchZoom: touch && !android23,

		// @option bounceAtZoomLimits: Boolean = true
		// Set it to false if you don't want the map to zoom beyond min/max zoom
		// and then bounce back when pinch-zooming.
		bounceAtZoomLimits: true
	});

	var TouchZoom = Handler.extend({
		addHooks: function () {
			addClass(this._map._container, 'leaflet-touch-zoom');
			on(this._map._container, 'touchstart', this._onTouchStart, this);
		},

		removeHooks: function () {
			removeClass(this._map._container, 'leaflet-touch-zoom');
			off(this._map._container, 'touchstart', this._onTouchStart, this);
		},

		_onTouchStart: function (e) {
			var map = this._map;
			if (!e.touches || e.touches.length !== 2 || map._animatingZoom || this._zooming) { return; }

			var p1 = map.mouseEventToContainerPoint(e.touches[0]),
					p2 = map.mouseEventToContainerPoint(e.touches[1]);

			this._centerPoint = map.getSize()._divideBy(2);
			this._startLatLng = map.containerPointToLatLng(this._centerPoint);
			if (map.options.touchZoom !== 'center') {
				this._pinchStartLatLng = map.containerPointToLatLng(p1.add(p2)._divideBy(2));
			}

			this._startDist = p1.distanceTo(p2);
			this._startZoom = map.getZoom();

			this._moved = false;
			this._zooming = true;

			map._stop();

			on(document, 'touchmove', this._onTouchMove, this);
			on(document, 'touchend', this._onTouchEnd, this);

			preventDefault(e);
		},

		_onTouchMove: function (e) {
			if (!e.touches || e.touches.length !== 2 || !this._zooming) { return; }

			var map = this._map,
					p1 = map.mouseEventToContainerPoint(e.touches[0]),
					p2 = map.mouseEventToContainerPoint(e.touches[1]),
					scale = p1.distanceTo(p2) / this._startDist;

			this._zoom = map.getScaleZoom(scale, this._startZoom);

			if (!map.options.bounceAtZoomLimits && (
				(this._zoom < map.getMinZoom() && scale < 1) ||
				(this._zoom > map.getMaxZoom() && scale > 1))) {
				this._zoom = map._limitZoom(this._zoom);
			}

			if (map.options.touchZoom === 'center') {
				this._center = this._startLatLng;
				if (scale === 1) { return; }
			} else {
				// Get delta from pinch to center, so centerLatLng is delta applied to initial pinchLatLng
				var delta = p1._add(p2)._divideBy(2)._subtract(this._centerPoint);
				if (scale === 1 && delta.x === 0 && delta.y === 0) { return; }
				this._center = map.unproject(map.project(this._pinchStartLatLng, this._zoom).subtract(delta), this._zoom);
			}

			if (!this._moved) {
				map._moveStart(true, false);
				this._moved = true;
			}

			cancelAnimFrame(this._animRequest);

			var moveFn = bind(map._move, map, this._center, this._zoom, {pinch: true, round: false});
			this._animRequest = requestAnimFrame(moveFn, this, true);

			preventDefault(e);
		},

		_onTouchEnd: function () {
			if (!this._moved || !this._zooming) {
				this._zooming = false;
				return;
			}

			this._zooming = false;
			cancelAnimFrame(this._animRequest);

			off(document, 'touchmove', this._onTouchMove, this);
			off(document, 'touchend', this._onTouchEnd, this);

			// Pinch updates GridLayers' levels only when zoomSnap is off, so zoomSnap becomes noUpdate.
			if (this._map.options.zoomAnimation) {
				this._map._animateZoom(this._center, this._map._limitZoom(this._zoom), true, this._map.options.zoomSnap);
			} else {
				this._map._resetView(this._center, this._map._limitZoom(this._zoom));
			}
		}
	});

	// @section Handlers
	// @property touchZoom: Handler
	// Touch zoom handler.
	Map.addInitHook('addHandler', 'touchZoom', TouchZoom);

	Map.BoxZoom = BoxZoom;
	Map.DoubleClickZoom = DoubleClickZoom;
	Map.Drag = Drag;
	Map.Keyboard = Keyboard;
	Map.ScrollWheelZoom = ScrollWheelZoom;
	Map.Tap = Tap;
	Map.TouchZoom = TouchZoom;

	exports.version = version;
	exports.Control = Control;
	exports.control = control;
	exports.Browser = Browser;
	exports.Evented = Evented;
	exports.Mixin = Mixin;
	exports.Util = Util;
	exports.Class = Class;
	exports.Handler = Handler;
	exports.extend = extend;
	exports.bind = bind;
	exports.stamp = stamp;
	exports.setOptions = setOptions;
	exports.DomEvent = DomEvent;
	exports.DomUtil = DomUtil;
	exports.PosAnimation = PosAnimation;
	exports.Draggable = Draggable;
	exports.LineUtil = LineUtil;
	exports.PolyUtil = PolyUtil;
	exports.Point = Point;
	exports.point = toPoint;
	exports.Bounds = Bounds;
	exports.bounds = toBounds;
	exports.Transformation = Transformation;
	exports.transformation = toTransformation;
	exports.Projection = index;
	exports.LatLng = LatLng;
	exports.latLng = toLatLng;
	exports.LatLngBounds = LatLngBounds;
	exports.latLngBounds = toLatLngBounds;
	exports.CRS = CRS;
	exports.GeoJSON = GeoJSON;
	exports.geoJSON = geoJSON;
	exports.geoJson = geoJson;
	exports.Layer = Layer;
	exports.LayerGroup = LayerGroup;
	exports.layerGroup = layerGroup;
	exports.FeatureGroup = FeatureGroup;
	exports.featureGroup = featureGroup;
	exports.ImageOverlay = ImageOverlay;
	exports.imageOverlay = imageOverlay;
	exports.VideoOverlay = VideoOverlay;
	exports.videoOverlay = videoOverlay;
	exports.SVGOverlay = SVGOverlay;
	exports.svgOverlay = svgOverlay;
	exports.DivOverlay = DivOverlay;
	exports.Popup = Popup;
	exports.popup = popup;
	exports.Tooltip = Tooltip;
	exports.tooltip = tooltip;
	exports.Icon = Icon;
	exports.icon = icon;
	exports.DivIcon = DivIcon;
	exports.divIcon = divIcon;
	exports.Marker = Marker;
	exports.marker = marker;
	exports.TileLayer = TileLayer;
	exports.tileLayer = tileLayer;
	exports.GridLayer = GridLayer;
	exports.gridLayer = gridLayer;
	exports.SVG = SVG;
	exports.svg = svg$1;
	exports.Renderer = Renderer;
	exports.Canvas = Canvas;
	exports.canvas = canvas$1;
	exports.Path = Path;
	exports.CircleMarker = CircleMarker;
	exports.circleMarker = circleMarker;
	exports.Circle = Circle;
	exports.circle = circle;
	exports.Polyline = Polyline;
	exports.polyline = polyline;
	exports.Polygon = Polygon;
	exports.polygon = polygon;
	exports.Rectangle = Rectangle;
	exports.rectangle = rectangle;
	exports.Map = Map;
	exports.map = createMap;

	var oldL = window.L;
	exports.noConflict = function() {
		window.L = oldL;
		return this;
	}

	// Always export us to window global (see #2364)
	window.L = exports;

})));
/* End */
;
; /* Start:"a:4:{s:4:"full";s:113:"/local/templates/dombilet2.0/components/bitrix/catalog.element/.default/js/jquery.fancybox.min.js?175068485568291";s:6:"source";s:97:"/local/templates/dombilet2.0/components/bitrix/catalog.element/.default/js/jquery.fancybox.min.js";s:3:"min";s:0:"";s:3:"map";s:0:"";}"*/
// ==================================================
// fancyBox v3.5.7
//
// Licensed GPLv3 for open source use
// or fancyBox Commercial License for commercial use
//
// http://fancyapps.com/fancybox/
// Copyright 2019 fancyApps
//
// ==================================================
console.log("fancybox");
!function(t,e,n,o){"use strict";function i(t,e){var o,i,a,s=[],r=0;t&&t.isDefaultPrevented()||(t.preventDefault(),e=e||{},t&&t.data&&(e=h(t.data.options,e)),o=e.$target||n(t.currentTarget).trigger("blur"),(a=n.fancybox.getInstance())&&a.$trigger&&a.$trigger.is(o)||(e.selector?s=n(e.selector):(i=o.attr("data-fancybox")||"",i?(s=t.data?t.data.items:[],s=s.length?s.filter('[data-fancybox="'+i+'"]'):n('[data-fancybox="'+i+'"]')):s=[o]),r=n(s).index(o),r<0&&(r=0),a=n.fancybox.open(s,e,r),a.$trigger=o))}if(t.console=t.console||{info:function(t){}},n){if(n.fn.fancybox)return void console.info("fancyBox already initialized");var a={closeExisting:!1,loop:!1,gutter:50,keyboard:!0,preventCaptionOverlap:!0,arrows:!0,infobar:!0,smallBtn:"auto",toolbar:"auto",buttons:["zoom","slideShow","thumbs","close"],idleTime:3,protect:!1,modal:!1,image:{preload:!1},ajax:{settings:{data:{fancybox:!0}}},iframe:{tpl:'<iframe id="fancybox-frame{rnd}" name="fancybox-frame{rnd}" class="fancybox-iframe" allowfullscreen="allowfullscreen" allow="autoplay; fullscreen" src=""></iframe>',preload:!0,css:{},attr:{scrolling:"auto"}},video:{tpl:'<video class="fancybox-video" controls controlsList="nodownload" poster="{{poster}}"><source src="{{src}}" type="{{format}}" />Sorry, your browser doesn\'t support embedded videos, <a href="{{src}}">download</a> and watch with your favorite video player!</video>',format:"",autoStart:!0},defaultType:"image",animationEffect:"zoom",animationDuration:366,zoomOpacity:"auto",transitionEffect:"fade",transitionDuration:366,slideClass:"",baseClass:"",baseTpl:'<div class="fancybox-container" role="dialog" tabindex="-1"><div class="fancybox-bg"></div><div class="fancybox-inner"><div class="fancybox-infobar"><span data-fancybox-index></span>&nbsp;/&nbsp;<span data-fancybox-count></span></div><div class="fancybox-toolbar">{{buttons}}</div><div class="fancybox-navigation">{{arrows}}</div><div class="fancybox-stage"></div><div class="fancybox-caption"><div class="fancybox-caption__body"></div></div></div></div>',spinnerTpl:'<div class="fancybox-loading"></div>',errorTpl:'<div class="fancybox-error"><p>{{ERROR}}</p></div>',btnTpl:{download:'<a download data-fancybox-download class="fancybox-button fancybox-button--download" title="{{DOWNLOAD}}" href="javascript:;"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M18.62 17.09V19H5.38v-1.91zm-2.97-6.96L17 11.45l-5 4.87-5-4.87 1.36-1.32 2.68 2.64V5h1.92v7.77z"/></svg></a>',zoom:'<button data-fancybox-zoom class="fancybox-button fancybox-button--zoom" title="{{ZOOM}}"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M18.7 17.3l-3-3a5.9 5.9 0 0 0-.6-7.6 5.9 5.9 0 0 0-8.4 0 5.9 5.9 0 0 0 0 8.4 5.9 5.9 0 0 0 7.7.7l3 3a1 1 0 0 0 1.3 0c.4-.5.4-1 0-1.5zM8.1 13.8a4 4 0 0 1 0-5.7 4 4 0 0 1 5.7 0 4 4 0 0 1 0 5.7 4 4 0 0 1-5.7 0z"/></svg></button>',close:'<button data-fancybox-close class="fancybox-button fancybox-button--close" title="{{CLOSE}}"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 10.6L6.6 5.2 5.2 6.6l5.4 5.4-5.4 5.4 1.4 1.4 5.4-5.4 5.4 5.4 1.4-1.4-5.4-5.4 5.4-5.4-1.4-1.4-5.4 5.4z"/></svg></button>',arrowLeft:'<button data-fancybox-prev class="fancybox-button fancybox-button--arrow_left" title="{{PREV}}"><div><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M11.28 15.7l-1.34 1.37L5 12l4.94-5.07 1.34 1.38-2.68 2.72H19v1.94H8.6z"/></svg></div></button>',arrowRight:'<button data-fancybox-next class="fancybox-button fancybox-button--arrow_right" title="{{NEXT}}"><div><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M15.4 12.97l-2.68 2.72 1.34 1.38L19 12l-4.94-5.07-1.34 1.38 2.68 2.72H5v1.94z"/></svg></div></button>',smallBtn:'<button type="button" data-fancybox-close class="fancybox-button fancybox-close-small" title="{{CLOSE}}"><svg xmlns="http://www.w3.org/2000/svg" version="1" viewBox="0 0 24 24"><path d="M13 12l5-5-1-1-5 5-5-5-1 1 5 5-5 5 1 1 5-5 5 5 1-1z"/></svg></button>'},parentEl:"body",hideScrollbar:!0,autoFocus:!0,backFocus:!0,trapFocus:!0,fullScreen:{autoStart:!1},touch:{vertical:!0,momentum:!0},hash:null,media:{},slideShow:{autoStart:!1,speed:3e3},thumbs:{autoStart:!1,hideOnClose:!0,parentEl:".fancybox-container",axis:"y"},wheel:"auto",onInit:n.noop,beforeLoad:n.noop,afterLoad:n.noop,beforeShow:n.noop,afterShow:n.noop,beforeClose:n.noop,afterClose:n.noop,onActivate:n.noop,onDeactivate:n.noop,clickContent:function(t,e){return"image"===t.type&&"zoom"},clickSlide:"close",clickOutside:"close",dblclickContent:!1,dblclickSlide:!1,dblclickOutside:!1,mobile:{preventCaptionOverlap:!1,idleTime:!1,clickContent:function(t,e){return"image"===t.type&&"toggleControls"},clickSlide:function(t,e){return"image"===t.type?"toggleControls":"close"},dblclickContent:function(t,e){return"image"===t.type&&"zoom"},dblclickSlide:function(t,e){return"image"===t.type&&"zoom"}},lang:"en",i18n:{en:{CLOSE:"Close",NEXT:"Next",PREV:"Previous",ERROR:"The requested content cannot be loaded. <br/> Please try again later.",PLAY_START:"Start slideshow",PLAY_STOP:"Pause slideshow",FULL_SCREEN:"Full screen",THUMBS:"Thumbnails",DOWNLOAD:"Download",SHARE:"Share",ZOOM:"Zoom"},de:{CLOSE:"Schlie&szlig;en",NEXT:"Weiter",PREV:"Zur&uuml;ck",ERROR:"Die angeforderten Daten konnten nicht geladen werden. <br/> Bitte versuchen Sie es sp&auml;ter nochmal.",PLAY_START:"Diaschau starten",PLAY_STOP:"Diaschau beenden",FULL_SCREEN:"Vollbild",THUMBS:"Vorschaubilder",DOWNLOAD:"Herunterladen",SHARE:"Teilen",ZOOM:"Vergr&ouml;&szlig;ern"}}},s=n(t),r=n(e),c=0,l=function(t){return t&&t.hasOwnProperty&&t instanceof n},d=function(){return t.requestAnimationFrame||t.webkitRequestAnimationFrame||t.mozRequestAnimationFrame||t.oRequestAnimationFrame||function(e){return t.setTimeout(e,1e3/60)}}(),u=function(){return t.cancelAnimationFrame||t.webkitCancelAnimationFrame||t.mozCancelAnimationFrame||t.oCancelAnimationFrame||function(e){t.clearTimeout(e)}}(),f=function(){var t,n=e.createElement("fakeelement"),o={transition:"transitionend",OTransition:"oTransitionEnd",MozTransition:"transitionend",WebkitTransition:"webkitTransitionEnd"};for(t in o)if(void 0!==n.style[t])return o[t];return"transitionend"}(),p=function(t){return t&&t.length&&t[0].offsetHeight},h=function(t,e){var o=n.extend(!0,{},t,e);return n.each(e,function(t,e){n.isArray(e)&&(o[t]=e)}),o},g=function(t){var o,i;return!(!t||t.ownerDocument!==e)&&(n(".fancybox-container").css("pointer-events","none"),o={x:t.getBoundingClientRect().left+t.offsetWidth/2,y:t.getBoundingClientRect().top+t.offsetHeight/2},i=e.elementFromPoint(o.x,o.y)===t,n(".fancybox-container").css("pointer-events",""),i)},b=function(t,e,o){var i=this;i.opts=h({index:o},n.fancybox.defaults),n.isPlainObject(e)&&(i.opts=h(i.opts,e)),n.fancybox.isMobile&&(i.opts=h(i.opts,i.opts.mobile)),i.id=i.opts.id||++c,i.currIndex=parseInt(i.opts.index,10)||0,i.prevIndex=null,i.prevPos=null,i.currPos=0,i.firstRun=!0,i.group=[],i.slides={},i.addContent(t),i.group.length&&i.init()};n.extend(b.prototype,{init:function(){var o,i,a=this,s=a.group[a.currIndex],r=s.opts;r.closeExisting&&n.fancybox.close(!0),n("body").addClass("fancybox-active"),!n.fancybox.getInstance()&&!1!==r.hideScrollbar&&!n.fancybox.isMobile&&e.body.scrollHeight>t.innerHeight&&(n("head").append('<style id="fancybox-style-noscroll" type="text/css">.compensate-for-scrollbar{margin-right:'+(t.innerWidth-e.documentElement.clientWidth)+"px;}</style>"),n("body").addClass("compensate-for-scrollbar")),i="",n.each(r.buttons,function(t,e){i+=r.btnTpl[e]||""}),o=n(a.translate(a,r.baseTpl.replace("{{buttons}}",i).replace("{{arrows}}",r.btnTpl.arrowLeft+r.btnTpl.arrowRight))).attr("id","fancybox-container-"+a.id).addClass(r.baseClass).data("FancyBox",a).appendTo(r.parentEl),a.$refs={container:o},["bg","inner","infobar","toolbar","stage","caption","navigation"].forEach(function(t){a.$refs[t]=o.find(".fancybox-"+t)}),a.trigger("onInit"),a.activate(),a.jumpTo(a.currIndex)},translate:function(t,e){var n=t.opts.i18n[t.opts.lang]||t.opts.i18n.en;return e.replace(/\{\{(\w+)\}\}/g,function(t,e){return void 0===n[e]?t:n[e]})},addContent:function(t){var e,o=this,i=n.makeArray(t);n.each(i,function(t,e){var i,a,s,r,c,l={},d={};n.isPlainObject(e)?(l=e,d=e.opts||e):"object"===n.type(e)&&n(e).length?(i=n(e),d=i.data()||{},d=n.extend(!0,{},d,d.options),d.$orig=i,l.src=o.opts.src||d.src||i.attr("href"),l.type||l.src||(l.type="inline",l.src=e)):l={type:"html",src:e+""},l.opts=n.extend(!0,{},o.opts,d),n.isArray(d.buttons)&&(l.opts.buttons=d.buttons),n.fancybox.isMobile&&l.opts.mobile&&(l.opts=h(l.opts,l.opts.mobile)),a=l.type||l.opts.type,r=l.src||"",!a&&r&&((s=r.match(/\.(mp4|mov|ogv|webm)((\?|#).*)?$/i))?(a="video",l.opts.video.format||(l.opts.video.format="video/"+("ogv"===s[1]?"ogg":s[1]))):r.match(/(^data:image\/[a-z0-9+\/=]*,)|(\.(jp(e|g|eg)|gif|png|bmp|webp|svg|ico)((\?|#).*)?$)/i)?a="image":r.match(/\.(pdf)((\?|#).*)?$/i)?(a="iframe",l=n.extend(!0,l,{contentType:"pdf",opts:{iframe:{preload:!1}}})):"#"===r.charAt(0)&&(a="inline")),a?l.type=a:o.trigger("objectNeedsType",l),l.contentType||(l.contentType=n.inArray(l.type,["html","inline","ajax"])>-1?"html":l.type),l.index=o.group.length,"auto"==l.opts.smallBtn&&(l.opts.smallBtn=n.inArray(l.type,["html","inline","ajax"])>-1),"auto"===l.opts.toolbar&&(l.opts.toolbar=!l.opts.smallBtn),l.$thumb=l.opts.$thumb||null,l.opts.$trigger&&l.index===o.opts.index&&(l.$thumb=l.opts.$trigger.find("img:first"),l.$thumb.length&&(l.opts.$orig=l.opts.$trigger)),l.$thumb&&l.$thumb.length||!l.opts.$orig||(l.$thumb=l.opts.$orig.find("img:first")),l.$thumb&&!l.$thumb.length&&(l.$thumb=null),l.thumb=l.opts.thumb||(l.$thumb?l.$thumb[0].src:null),"function"===n.type(l.opts.caption)&&(l.opts.caption=l.opts.caption.apply(e,[o,l])),"function"===n.type(o.opts.caption)&&(l.opts.caption=o.opts.caption.apply(e,[o,l])),l.opts.caption instanceof n||(l.opts.caption=void 0===l.opts.caption?"":l.opts.caption+""),"ajax"===l.type&&(c=r.split(/\s+/,2),c.length>1&&(l.src=c.shift(),l.opts.filter=c.shift())),l.opts.modal&&(l.opts=n.extend(!0,l.opts,{trapFocus:!0,infobar:0,toolbar:0,smallBtn:0,keyboard:0,slideShow:0,fullScreen:0,thumbs:0,touch:0,clickContent:!1,clickSlide:!1,clickOutside:!1,dblclickContent:!1,dblclickSlide:!1,dblclickOutside:!1})),o.group.push(l)}),Object.keys(o.slides).length&&(o.updateControls(),(e=o.Thumbs)&&e.isActive&&(e.create(),e.focus()))},addEvents:function(){var e=this;e.removeEvents(),e.$refs.container.on("click.fb-close","[data-fancybox-close]",function(t){t.stopPropagation(),t.preventDefault(),e.close(t)}).on("touchstart.fb-prev click.fb-prev","[data-fancybox-prev]",function(t){t.stopPropagation(),t.preventDefault(),e.previous()}).on("touchstart.fb-next click.fb-next","[data-fancybox-next]",function(t){t.stopPropagation(),t.preventDefault(),e.next()}).on("click.fb","[data-fancybox-zoom]",function(t){e[e.isScaledDown()?"scaleToActual":"scaleToFit"]()}),s.on("orientationchange.fb resize.fb",function(t){t&&t.originalEvent&&"resize"===t.originalEvent.type?(e.requestId&&u(e.requestId),e.requestId=d(function(){e.update(t)})):(e.current&&"iframe"===e.current.type&&e.$refs.stage.hide(),setTimeout(function(){e.$refs.stage.show(),e.update(t)},n.fancybox.isMobile?600:250))}),r.on("keydown.fb",function(t){var o=n.fancybox?n.fancybox.getInstance():null,i=o.current,a=t.keyCode||t.which;if(9==a)return void(i.opts.trapFocus&&e.focus(t));if(!(!i.opts.keyboard||t.ctrlKey||t.altKey||t.shiftKey||n(t.target).is("input,textarea,video,audio,select")))return 8===a||27===a?(t.preventDefault(),void e.close(t)):37===a||38===a?(t.preventDefault(),void e.previous()):39===a||40===a?(t.preventDefault(),void e.next()):void e.trigger("afterKeydown",t,a)}),e.group[e.currIndex].opts.idleTime&&(e.idleSecondsCounter=0,r.on("mousemove.fb-idle mouseleave.fb-idle mousedown.fb-idle touchstart.fb-idle touchmove.fb-idle scroll.fb-idle keydown.fb-idle",function(t){e.idleSecondsCounter=0,e.isIdle&&e.showControls(),e.isIdle=!1}),e.idleInterval=t.setInterval(function(){++e.idleSecondsCounter>=e.group[e.currIndex].opts.idleTime&&!e.isDragging&&(e.isIdle=!0,e.idleSecondsCounter=0,e.hideControls())},1e3))},removeEvents:function(){var e=this;s.off("orientationchange.fb resize.fb"),r.off("keydown.fb .fb-idle"),this.$refs.container.off(".fb-close .fb-prev .fb-next"),e.idleInterval&&(t.clearInterval(e.idleInterval),e.idleInterval=null)},previous:function(t){return this.jumpTo(this.currPos-1,t)},next:function(t){return this.jumpTo(this.currPos+1,t)},jumpTo:function(t,e){var o,i,a,s,r,c,l,d,u,f=this,h=f.group.length;if(!(f.isDragging||f.isClosing||f.isAnimating&&f.firstRun)){if(t=parseInt(t,10),!(a=f.current?f.current.opts.loop:f.opts.loop)&&(t<0||t>=h))return!1;if(o=f.firstRun=!Object.keys(f.slides).length,r=f.current,f.prevIndex=f.currIndex,f.prevPos=f.currPos,s=f.createSlide(t),h>1&&((a||s.index<h-1)&&f.createSlide(t+1),(a||s.index>0)&&f.createSlide(t-1)),f.current=s,f.currIndex=s.index,f.currPos=s.pos,f.trigger("beforeShow",o),f.updateControls(),s.forcedDuration=void 0,n.isNumeric(e)?s.forcedDuration=e:e=s.opts[o?"animationDuration":"transitionDuration"],e=parseInt(e,10),i=f.isMoved(s),s.$slide.addClass("fancybox-slide--current"),o)return s.opts.animationEffect&&e&&f.$refs.container.css("transition-duration",e+"ms"),f.$refs.container.addClass("fancybox-is-open").trigger("focus"),f.loadSlide(s),void f.preload("image");c=n.fancybox.getTranslate(r.$slide),l=n.fancybox.getTranslate(f.$refs.stage),n.each(f.slides,function(t,e){n.fancybox.stop(e.$slide,!0)}),r.pos!==s.pos&&(r.isComplete=!1),r.$slide.removeClass("fancybox-slide--complete fancybox-slide--current"),i?(u=c.left-(r.pos*c.width+r.pos*r.opts.gutter),n.each(f.slides,function(t,o){o.$slide.removeClass("fancybox-animated").removeClass(function(t,e){return(e.match(/(^|\s)fancybox-fx-\S+/g)||[]).join(" ")});var i=o.pos*c.width+o.pos*o.opts.gutter;n.fancybox.setTranslate(o.$slide,{top:0,left:i-l.left+u}),o.pos!==s.pos&&o.$slide.addClass("fancybox-slide--"+(o.pos>s.pos?"next":"previous")),p(o.$slide),n.fancybox.animate(o.$slide,{top:0,left:(o.pos-s.pos)*c.width+(o.pos-s.pos)*o.opts.gutter},e,function(){o.$slide.css({transform:"",opacity:""}).removeClass("fancybox-slide--next fancybox-slide--previous"),o.pos===f.currPos&&f.complete()})})):e&&s.opts.transitionEffect&&(d="fancybox-animated fancybox-fx-"+s.opts.transitionEffect,r.$slide.addClass("fancybox-slide--"+(r.pos>s.pos?"next":"previous")),n.fancybox.animate(r.$slide,d,e,function(){r.$slide.removeClass(d).removeClass("fancybox-slide--next fancybox-slide--previous")},!1)),s.isLoaded?f.revealContent(s):f.loadSlide(s),f.preload("image")}},createSlide:function(t){var e,o,i=this;return o=t%i.group.length,o=o<0?i.group.length+o:o,!i.slides[t]&&i.group[o]&&(e=n('<div class="fancybox-slide"></div>').appendTo(i.$refs.stage),i.slides[t]=n.extend(!0,{},i.group[o],{pos:t,$slide:e,isLoaded:!1}),i.updateSlide(i.slides[t])),i.slides[t]},scaleToActual:function(t,e,o){var i,a,s,r,c,l=this,d=l.current,u=d.$content,f=n.fancybox.getTranslate(d.$slide).width,p=n.fancybox.getTranslate(d.$slide).height,h=d.width,g=d.height;l.isAnimating||l.isMoved()||!u||"image"!=d.type||!d.isLoaded||d.hasError||(l.isAnimating=!0,n.fancybox.stop(u),t=void 0===t?.5*f:t,e=void 0===e?.5*p:e,i=n.fancybox.getTranslate(u),i.top-=n.fancybox.getTranslate(d.$slide).top,i.left-=n.fancybox.getTranslate(d.$slide).left,r=h/i.width,c=g/i.height,a=.5*f-.5*h,s=.5*p-.5*g,h>f&&(a=i.left*r-(t*r-t),a>0&&(a=0),a<f-h&&(a=f-h)),g>p&&(s=i.top*c-(e*c-e),s>0&&(s=0),s<p-g&&(s=p-g)),l.updateCursor(h,g),n.fancybox.animate(u,{top:s,left:a,scaleX:r,scaleY:c},o||366,function(){l.isAnimating=!1}),l.SlideShow&&l.SlideShow.isActive&&l.SlideShow.stop())},scaleToFit:function(t){var e,o=this,i=o.current,a=i.$content;o.isAnimating||o.isMoved()||!a||"image"!=i.type||!i.isLoaded||i.hasError||(o.isAnimating=!0,n.fancybox.stop(a),e=o.getFitPos(i),o.updateCursor(e.width,e.height),n.fancybox.animate(a,{top:e.top,left:e.left,scaleX:e.width/a.width(),scaleY:e.height/a.height()},t||366,function(){o.isAnimating=!1}))},getFitPos:function(t){var e,o,i,a,s=this,r=t.$content,c=t.$slide,l=t.width||t.opts.width,d=t.height||t.opts.height,u={};return!!(t.isLoaded&&r&&r.length)&&(e=n.fancybox.getTranslate(s.$refs.stage).width,o=n.fancybox.getTranslate(s.$refs.stage).height,e-=parseFloat(c.css("paddingLeft"))+parseFloat(c.css("paddingRight"))+parseFloat(r.css("marginLeft"))+parseFloat(r.css("marginRight")),o-=parseFloat(c.css("paddingTop"))+parseFloat(c.css("paddingBottom"))+parseFloat(r.css("marginTop"))+parseFloat(r.css("marginBottom")),l&&d||(l=e,d=o),i=Math.min(1,e/l,o/d),l*=i,d*=i,l>e-.5&&(l=e),d>o-.5&&(d=o),"image"===t.type?(u.top=Math.floor(.5*(o-d))+parseFloat(c.css("paddingTop")),u.left=Math.floor(.5*(e-l))+parseFloat(c.css("paddingLeft"))):"video"===t.contentType&&(a=t.opts.width&&t.opts.height?l/d:t.opts.ratio||16/9,d>l/a?d=l/a:l>d*a&&(l=d*a)),u.width=l,u.height=d,u)},update:function(t){var e=this;n.each(e.slides,function(n,o){e.updateSlide(o,t)})},updateSlide:function(t,e){var o=this,i=t&&t.$content,a=t.width||t.opts.width,s=t.height||t.opts.height,r=t.$slide;o.adjustCaption(t),i&&(a||s||"video"===t.contentType)&&!t.hasError&&(n.fancybox.stop(i),n.fancybox.setTranslate(i,o.getFitPos(t)),t.pos===o.currPos&&(o.isAnimating=!1,o.updateCursor())),o.adjustLayout(t),r.length&&(r.trigger("refresh"),t.pos===o.currPos&&o.$refs.toolbar.add(o.$refs.navigation.find(".fancybox-button--arrow_right")).toggleClass("compensate-for-scrollbar",r.get(0).scrollHeight>r.get(0).clientHeight)),o.trigger("onUpdate",t,e)},centerSlide:function(t){var e=this,o=e.current,i=o.$slide;!e.isClosing&&o&&(i.siblings().css({transform:"",opacity:""}),i.parent().children().removeClass("fancybox-slide--previous fancybox-slide--next"),n.fancybox.animate(i,{top:0,left:0,opacity:1},void 0===t?0:t,function(){i.css({transform:"",opacity:""}),o.isComplete||e.complete()},!1))},isMoved:function(t){var e,o,i=t||this.current;return!!i&&(o=n.fancybox.getTranslate(this.$refs.stage),e=n.fancybox.getTranslate(i.$slide),!i.$slide.hasClass("fancybox-animated")&&(Math.abs(e.top-o.top)>.5||Math.abs(e.left-o.left)>.5))},updateCursor:function(t,e){var o,i,a=this,s=a.current,r=a.$refs.container;s&&!a.isClosing&&a.Guestures&&(r.removeClass("fancybox-is-zoomable fancybox-can-zoomIn fancybox-can-zoomOut fancybox-can-swipe fancybox-can-pan"),o=a.canPan(t,e),i=!!o||a.isZoomable(),r.toggleClass("fancybox-is-zoomable",i),n("[data-fancybox-zoom]").prop("disabled",!i),o?r.addClass("fancybox-can-pan"):i&&("zoom"===s.opts.clickContent||n.isFunction(s.opts.clickContent)&&"zoom"==s.opts.clickContent(s))?r.addClass("fancybox-can-zoomIn"):s.opts.touch&&(s.opts.touch.vertical||a.group.length>1)&&"video"!==s.contentType&&r.addClass("fancybox-can-swipe"))},isZoomable:function(){var t,e=this,n=e.current;if(n&&!e.isClosing&&"image"===n.type&&!n.hasError){if(!n.isLoaded)return!0;if((t=e.getFitPos(n))&&(n.width>t.width||n.height>t.height))return!0}return!1},isScaledDown:function(t,e){var o=this,i=!1,a=o.current,s=a.$content;return void 0!==t&&void 0!==e?i=t<a.width&&e<a.height:s&&(i=n.fancybox.getTranslate(s),i=i.width<a.width&&i.height<a.height),i},canPan:function(t,e){var o=this,i=o.current,a=null,s=!1;return"image"===i.type&&(i.isComplete||t&&e)&&!i.hasError&&(s=o.getFitPos(i),void 0!==t&&void 0!==e?a={width:t,height:e}:i.isComplete&&(a=n.fancybox.getTranslate(i.$content)),a&&s&&(s=Math.abs(a.width-s.width)>1.5||Math.abs(a.height-s.height)>1.5)),s},loadSlide:function(t){var e,o,i,a=this;if(!t.isLoading&&!t.isLoaded){if(t.isLoading=!0,!1===a.trigger("beforeLoad",t))return t.isLoading=!1,!1;switch(e=t.type,o=t.$slide,o.off("refresh").trigger("onReset").addClass(t.opts.slideClass),e){case"image":a.setImage(t);break;case"iframe":a.setIframe(t);break;case"html":a.setContent(t,t.src||t.content);break;case"video":a.setContent(t,t.opts.video.tpl.replace(/\{\{src\}\}/gi,t.src).replace("{{format}}",t.opts.videoFormat||t.opts.video.format||"").replace("{{poster}}",t.thumb||""));break;case"inline":n(t.src).length?a.setContent(t,n(t.src)):a.setError(t);break;case"ajax":a.showLoading(t),i=n.ajax(n.extend({},t.opts.ajax.settings,{url:t.src,success:function(e,n){"success"===n&&a.setContent(t,e)},error:function(e,n){e&&"abort"!==n&&a.setError(t)}})),o.one("onReset",function(){i.abort()});break;default:a.setError(t)}return!0}},setImage:function(t){var o,i=this;setTimeout(function(){var e=t.$image;i.isClosing||!t.isLoading||e&&e.length&&e[0].complete||t.hasError||i.showLoading(t)},50),i.checkSrcset(t),t.$content=n('<div class="fancybox-content"></div>').addClass("fancybox-is-hidden").appendTo(t.$slide.addClass("fancybox-slide--image")),!1!==t.opts.preload&&t.opts.width&&t.opts.height&&t.thumb&&(t.width=t.opts.width,t.height=t.opts.height,o=e.createElement("img"),o.onerror=function(){n(this).remove(),t.$ghost=null},o.onload=function(){i.afterLoad(t)},t.$ghost=n(o).addClass("fancybox-image").appendTo(t.$content).attr("src",t.thumb)),i.setBigImage(t)},checkSrcset:function(e){var n,o,i,a,s=e.opts.srcset||e.opts.image.srcset;if(s){i=t.devicePixelRatio||1,a=t.innerWidth*i,o=s.split(",").map(function(t){var e={};return t.trim().split(/\s+/).forEach(function(t,n){var o=parseInt(t.substring(0,t.length-1),10);if(0===n)return e.url=t;o&&(e.value=o,e.postfix=t[t.length-1])}),e}),o.sort(function(t,e){return t.value-e.value});for(var r=0;r<o.length;r++){var c=o[r];if("w"===c.postfix&&c.value>=a||"x"===c.postfix&&c.value>=i){n=c;break}}!n&&o.length&&(n=o[o.length-1]),n&&(e.src=n.url,e.width&&e.height&&"w"==n.postfix&&(e.height=e.width/e.height*n.value,e.width=n.value),e.opts.srcset=s)}},setBigImage:function(t){var o=this,i=e.createElement("img"),a=n(i);t.$image=a.one("error",function(){o.setError(t)}).one("load",function(){var e;t.$ghost||(o.resolveImageSlideSize(t,this.naturalWidth,this.naturalHeight),o.afterLoad(t)),o.isClosing||(t.opts.srcset&&(e=t.opts.sizes,e&&"auto"!==e||(e=(t.width/t.height>1&&s.width()/s.height()>1?"100":Math.round(t.width/t.height*100))+"vw"),a.attr("sizes",e).attr("srcset",t.opts.srcset)),t.$ghost&&setTimeout(function(){t.$ghost&&!o.isClosing&&t.$ghost.hide()},Math.min(300,Math.max(1e3,t.height/1600))),o.hideLoading(t))}).addClass("fancybox-image").attr("src",t.src).appendTo(t.$content),(i.complete||"complete"==i.readyState)&&a.naturalWidth&&a.naturalHeight?a.trigger("load"):i.error&&a.trigger("error")},resolveImageSlideSize:function(t,e,n){var o=parseInt(t.opts.width,10),i=parseInt(t.opts.height,10);t.width=e,t.height=n,o>0&&(t.width=o,t.height=Math.floor(o*n/e)),i>0&&(t.width=Math.floor(i*e/n),t.height=i)},setIframe:function(t){var e,o=this,i=t.opts.iframe,a=t.$slide;t.$content=n('<div class="fancybox-content'+(i.preload?" fancybox-is-hidden":"")+'"></div>').css(i.css).appendTo(a),a.addClass("fancybox-slide--"+t.contentType),t.$iframe=e=n(i.tpl.replace(/\{rnd\}/g,(new Date).getTime())).attr(i.attr).appendTo(t.$content),i.preload?(o.showLoading(t),e.on("load.fb error.fb",function(e){this.isReady=1,t.$slide.trigger("refresh"),o.afterLoad(t)}),a.on("refresh.fb",function(){var n,o,s=t.$content,r=i.css.width,c=i.css.height;if(1===e[0].isReady){try{n=e.contents(),o=n.find("body")}catch(t){}o&&o.length&&o.children().length&&(a.css("overflow","visible"),s.css({width:"100%","max-width":"100%",height:"9999px"}),void 0===r&&(r=Math.ceil(Math.max(o[0].clientWidth,o.outerWidth(!0)))),s.css("width",r||"").css("max-width",""),void 0===c&&(c=Math.ceil(Math.max(o[0].clientHeight,o.outerHeight(!0)))),s.css("height",c||""),a.css("overflow","auto")),s.removeClass("fancybox-is-hidden")}})):o.afterLoad(t),e.attr("src",t.src),a.one("onReset",function(){try{n(this).find("iframe").hide().unbind().attr("src","//about:blank")}catch(t){}n(this).off("refresh.fb").empty(),t.isLoaded=!1,t.isRevealed=!1})},setContent:function(t,e){var o=this;o.isClosing||(o.hideLoading(t),t.$content&&n.fancybox.stop(t.$content),t.$slide.empty(),l(e)&&e.parent().length?((e.hasClass("fancybox-content")||e.parent().hasClass("fancybox-content"))&&e.parents(".fancybox-slide").trigger("onReset"),t.$placeholder=n("<div>").hide().insertAfter(e),e.css("display","inline-block")):t.hasError||("string"===n.type(e)&&(e=n("<div>").append(n.trim(e)).contents()),t.opts.filter&&(e=n("<div>").html(e).find(t.opts.filter))),t.$slide.one("onReset",function(){n(this).find("video,audio").trigger("pause"),t.$placeholder&&(t.$placeholder.after(e.removeClass("fancybox-content").hide()).remove(),t.$placeholder=null),t.$smallBtn&&(t.$smallBtn.remove(),t.$smallBtn=null),t.hasError||(n(this).empty(),t.isLoaded=!1,t.isRevealed=!1)}),n(e).appendTo(t.$slide),n(e).is("video,audio")&&(n(e).addClass("fancybox-video"),n(e).wrap("<div></div>"),t.contentType="video",t.opts.width=t.opts.width||n(e).attr("width"),t.opts.height=t.opts.height||n(e).attr("height")),t.$content=t.$slide.children().filter("div,form,main,video,audio,article,.fancybox-content").first(),t.$content.siblings().hide(),t.$content.length||(t.$content=t.$slide.wrapInner("<div></div>").children().first()),t.$content.addClass("fancybox-content"),t.$slide.addClass("fancybox-slide--"+t.contentType),o.afterLoad(t))},setError:function(t){t.hasError=!0,t.$slide.trigger("onReset").removeClass("fancybox-slide--"+t.contentType).addClass("fancybox-slide--error"),t.contentType="html",this.setContent(t,this.translate(t,t.opts.errorTpl)),t.pos===this.currPos&&(this.isAnimating=!1)},showLoading:function(t){var e=this;(t=t||e.current)&&!t.$spinner&&(t.$spinner=n(e.translate(e,e.opts.spinnerTpl)).appendTo(t.$slide).hide().fadeIn("fast"))},hideLoading:function(t){var e=this;(t=t||e.current)&&t.$spinner&&(t.$spinner.stop().remove(),delete t.$spinner)},afterLoad:function(t){var e=this;e.isClosing||(t.isLoading=!1,t.isLoaded=!0,e.trigger("afterLoad",t),e.hideLoading(t),!t.opts.smallBtn||t.$smallBtn&&t.$smallBtn.length||(t.$smallBtn=n(e.translate(t,t.opts.btnTpl.smallBtn)).appendTo(t.$content)),t.opts.protect&&t.$content&&!t.hasError&&(t.$content.on("contextmenu.fb",function(t){return 2==t.button&&t.preventDefault(),!0}),"image"===t.type&&n('<div class="fancybox-spaceball"></div>').appendTo(t.$content)),e.adjustCaption(t),e.adjustLayout(t),t.pos===e.currPos&&e.updateCursor(),e.revealContent(t))},adjustCaption:function(t){var e,n=this,o=t||n.current,i=o.opts.caption,a=o.opts.preventCaptionOverlap,s=n.$refs.caption,r=!1;s.toggleClass("fancybox-caption--separate",a),a&&i&&i.length&&(o.pos!==n.currPos?(e=s.clone().appendTo(s.parent()),e.children().eq(0).empty().html(i),r=e.outerHeight(!0),e.empty().remove()):n.$caption&&(r=n.$caption.outerHeight(!0)),o.$slide.css("padding-bottom",r||""))},adjustLayout:function(t){var e,n,o,i,a=this,s=t||a.current;s.isLoaded&&!0!==s.opts.disableLayoutFix&&(s.$content.css("margin-bottom",""),s.$content.outerHeight()>s.$slide.height()+.5&&(o=s.$slide[0].style["padding-bottom"],i=s.$slide.css("padding-bottom"),parseFloat(i)>0&&(e=s.$slide[0].scrollHeight,s.$slide.css("padding-bottom",0),Math.abs(e-s.$slide[0].scrollHeight)<1&&(n=i),s.$slide.css("padding-bottom",o))),s.$content.css("margin-bottom",n))},revealContent:function(t){var e,o,i,a,s=this,r=t.$slide,c=!1,l=!1,d=s.isMoved(t),u=t.isRevealed;return t.isRevealed=!0,e=t.opts[s.firstRun?"animationEffect":"transitionEffect"],i=t.opts[s.firstRun?"animationDuration":"transitionDuration"],i=parseInt(void 0===t.forcedDuration?i:t.forcedDuration,10),!d&&t.pos===s.currPos&&i||(e=!1),"zoom"===e&&(t.pos===s.currPos&&i&&"image"===t.type&&!t.hasError&&(l=s.getThumbPos(t))?c=s.getFitPos(t):e="fade"),"zoom"===e?(s.isAnimating=!0,c.scaleX=c.width/l.width,c.scaleY=c.height/l.height,a=t.opts.zoomOpacity,"auto"==a&&(a=Math.abs(t.width/t.height-l.width/l.height)>.1),a&&(l.opacity=.1,c.opacity=1),n.fancybox.setTranslate(t.$content.removeClass("fancybox-is-hidden"),l),p(t.$content),void n.fancybox.animate(t.$content,c,i,function(){s.isAnimating=!1,s.complete()})):(s.updateSlide(t),e?(n.fancybox.stop(r),o="fancybox-slide--"+(t.pos>=s.prevPos?"next":"previous")+" fancybox-animated fancybox-fx-"+e,r.addClass(o).removeClass("fancybox-slide--current"),t.$content.removeClass("fancybox-is-hidden"),p(r),"image"!==t.type&&t.$content.hide().show(0),void n.fancybox.animate(r,"fancybox-slide--current",i,function(){r.removeClass(o).css({transform:"",opacity:""}),t.pos===s.currPos&&s.complete()},!0)):(t.$content.removeClass("fancybox-is-hidden"),u||!d||"image"!==t.type||t.hasError||t.$content.hide().fadeIn("fast"),void(t.pos===s.currPos&&s.complete())))},getThumbPos:function(t){var e,o,i,a,s,r=!1,c=t.$thumb;return!(!c||!g(c[0]))&&(e=n.fancybox.getTranslate(c),o=parseFloat(c.css("border-top-width")||0),i=parseFloat(c.css("border-right-width")||0),a=parseFloat(c.css("border-bottom-width")||0),s=parseFloat(c.css("border-left-width")||0),r={top:e.top+o,left:e.left+s,width:e.width-i-s,height:e.height-o-a,scaleX:1,scaleY:1},e.width>0&&e.height>0&&r)},complete:function(){var t,e=this,o=e.current,i={};!e.isMoved()&&o.isLoaded&&(o.isComplete||(o.isComplete=!0,o.$slide.siblings().trigger("onReset"),e.preload("inline"),p(o.$slide),o.$slide.addClass("fancybox-slide--complete"),n.each(e.slides,function(t,o){o.pos>=e.currPos-1&&o.pos<=e.currPos+1?i[o.pos]=o:o&&(n.fancybox.stop(o.$slide),o.$slide.off().remove())}),e.slides=i),e.isAnimating=!1,e.updateCursor(),e.trigger("afterShow"),o.opts.video.autoStart&&o.$slide.find("video,audio").filter(":visible:first").trigger("play").one("ended",function(){Document.exitFullscreen?Document.exitFullscreen():this.webkitExitFullscreen&&this.webkitExitFullscreen(),e.next()}),o.opts.autoFocus&&"html"===o.contentType&&(t=o.$content.find("input[autofocus]:enabled:visible:first"),t.length?t.trigger("focus"):e.focus(null,!0)),o.$slide.scrollTop(0).scrollLeft(0))},preload:function(t){var e,n,o=this;o.group.length<2||(n=o.slides[o.currPos+1],e=o.slides[o.currPos-1],e&&e.type===t&&o.loadSlide(e),n&&n.type===t&&o.loadSlide(n))},focus:function(t,o){var i,a,s=this,r=["a[href]","area[href]",'input:not([disabled]):not([type="hidden"]):not([aria-hidden])',"select:not([disabled]):not([aria-hidden])","textarea:not([disabled]):not([aria-hidden])","button:not([disabled]):not([aria-hidden])","iframe","object","embed","video","audio","[contenteditable]",'[tabindex]:not([tabindex^="-"])'].join(",");s.isClosing||(i=!t&&s.current&&s.current.isComplete?s.current.$slide.find("*:visible"+(o?":not(.fancybox-close-small)":"")):s.$refs.container.find("*:visible"),i=i.filter(r).filter(function(){return"hidden"!==n(this).css("visibility")&&!n(this).hasClass("disabled")}),i.length?(a=i.index(e.activeElement),t&&t.shiftKey?(a<0||0==a)&&(t.preventDefault(),i.eq(i.length-1).trigger("focus")):(a<0||a==i.length-1)&&(t&&t.preventDefault(),i.eq(0).trigger("focus"))):s.$refs.container.trigger("focus"))},activate:function(){var t=this;n(".fancybox-container").each(function(){var e=n(this).data("FancyBox");e&&e.id!==t.id&&!e.isClosing&&(e.trigger("onDeactivate"),e.removeEvents(),e.isVisible=!1)}),t.isVisible=!0,(t.current||t.isIdle)&&(t.update(),t.updateControls()),t.trigger("onActivate"),t.addEvents()},close:function(t,e){var o,i,a,s,r,c,l,u=this,f=u.current,h=function(){u.cleanUp(t)};return!u.isClosing&&(u.isClosing=!0,!1===u.trigger("beforeClose",t)?(u.isClosing=!1,d(function(){u.update()}),!1):(u.removeEvents(),a=f.$content,o=f.opts.animationEffect,i=n.isNumeric(e)?e:o?f.opts.animationDuration:0,f.$slide.removeClass("fancybox-slide--complete fancybox-slide--next fancybox-slide--previous fancybox-animated"),!0!==t?n.fancybox.stop(f.$slide):o=!1,f.$slide.siblings().trigger("onReset").remove(),i&&u.$refs.container.removeClass("fancybox-is-open").addClass("fancybox-is-closing").css("transition-duration",i+"ms"),u.hideLoading(f),u.hideControls(!0),u.updateCursor(),"zoom"!==o||a&&i&&"image"===f.type&&!u.isMoved()&&!f.hasError&&(l=u.getThumbPos(f))||(o="fade"),"zoom"===o?(n.fancybox.stop(a),s=n.fancybox.getTranslate(a),c={top:s.top,left:s.left,scaleX:s.width/l.width,scaleY:s.height/l.height,width:l.width,height:l.height},r=f.opts.zoomOpacity,
"auto"==r&&(r=Math.abs(f.width/f.height-l.width/l.height)>.1),r&&(l.opacity=0),n.fancybox.setTranslate(a,c),p(a),n.fancybox.animate(a,l,i,h),!0):(o&&i?n.fancybox.animate(f.$slide.addClass("fancybox-slide--previous").removeClass("fancybox-slide--current"),"fancybox-animated fancybox-fx-"+o,i,h):!0===t?setTimeout(h,i):h(),!0)))},cleanUp:function(e){var o,i,a,s=this,r=s.current.opts.$orig;s.current.$slide.trigger("onReset"),s.$refs.container.empty().remove(),s.trigger("afterClose",e),s.current.opts.backFocus&&(r&&r.length&&r.is(":visible")||(r=s.$trigger),r&&r.length&&(i=t.scrollX,a=t.scrollY,r.trigger("focus"),n("html, body").scrollTop(a).scrollLeft(i))),s.current=null,o=n.fancybox.getInstance(),o?o.activate():(n("body").removeClass("fancybox-active compensate-for-scrollbar"),n("#fancybox-style-noscroll").remove())},trigger:function(t,e){var o,i=Array.prototype.slice.call(arguments,1),a=this,s=e&&e.opts?e:a.current;if(s?i.unshift(s):s=a,i.unshift(a),n.isFunction(s.opts[t])&&(o=s.opts[t].apply(s,i)),!1===o)return o;"afterClose"!==t&&a.$refs?a.$refs.container.trigger(t+".fb",i):r.trigger(t+".fb",i)},updateControls:function(){var t=this,o=t.current,i=o.index,a=t.$refs.container,s=t.$refs.caption,r=o.opts.caption;o.$slide.trigger("refresh"),r&&r.length?(t.$caption=s,s.children().eq(0).html(r)):t.$caption=null,t.hasHiddenControls||t.isIdle||t.showControls(),a.find("[data-fancybox-count]").html(t.group.length),a.find("[data-fancybox-index]").html(i+1),a.find("[data-fancybox-prev]").prop("disabled",!o.opts.loop&&i<=0),a.find("[data-fancybox-next]").prop("disabled",!o.opts.loop&&i>=t.group.length-1),"image"===o.type?a.find("[data-fancybox-zoom]").show().end().find("[data-fancybox-download]").attr("href",o.opts.image.src||o.src).show():o.opts.toolbar&&a.find("[data-fancybox-download],[data-fancybox-zoom]").hide(),n(e.activeElement).is(":hidden,[disabled]")&&t.$refs.container.trigger("focus")},hideControls:function(t){var e=this,n=["infobar","toolbar","nav"];!t&&e.current.opts.preventCaptionOverlap||n.push("caption"),this.$refs.container.removeClass(n.map(function(t){return"fancybox-show-"+t}).join(" ")),this.hasHiddenControls=!0},showControls:function(){var t=this,e=t.current?t.current.opts:t.opts,n=t.$refs.container;t.hasHiddenControls=!1,t.idleSecondsCounter=0,n.toggleClass("fancybox-show-toolbar",!(!e.toolbar||!e.buttons)).toggleClass("fancybox-show-infobar",!!(e.infobar&&t.group.length>1)).toggleClass("fancybox-show-caption",!!t.$caption).toggleClass("fancybox-show-nav",!!(e.arrows&&t.group.length>1)).toggleClass("fancybox-is-modal",!!e.modal)},toggleControls:function(){this.hasHiddenControls?this.showControls():this.hideControls()}}),n.fancybox={version:"3.5.7",defaults:a,getInstance:function(t){var e=n('.fancybox-container:not(".fancybox-is-closing"):last').data("FancyBox"),o=Array.prototype.slice.call(arguments,1);return e instanceof b&&("string"===n.type(t)?e[t].apply(e,o):"function"===n.type(t)&&t.apply(e,o),e)},open:function(t,e,n){return new b(t,e,n)},close:function(t){var e=this.getInstance();e&&(e.close(),!0===t&&this.close(t))},destroy:function(){this.close(!0),r.add("body").off("click.fb-start","**")},isMobile:/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),use3d:function(){var n=e.createElement("div");return t.getComputedStyle&&t.getComputedStyle(n)&&t.getComputedStyle(n).getPropertyValue("transform")&&!(e.documentMode&&e.documentMode<11)}(),getTranslate:function(t){var e;return!(!t||!t.length)&&(e=t[0].getBoundingClientRect(),{top:e.top||0,left:e.left||0,width:e.width,height:e.height,opacity:parseFloat(t.css("opacity"))})},setTranslate:function(t,e){var n="",o={};if(t&&e)return void 0===e.left&&void 0===e.top||(n=(void 0===e.left?t.position().left:e.left)+"px, "+(void 0===e.top?t.position().top:e.top)+"px",n=this.use3d?"translate3d("+n+", 0px)":"translate("+n+")"),void 0!==e.scaleX&&void 0!==e.scaleY?n+=" scale("+e.scaleX+", "+e.scaleY+")":void 0!==e.scaleX&&(n+=" scaleX("+e.scaleX+")"),n.length&&(o.transform=n),void 0!==e.opacity&&(o.opacity=e.opacity),void 0!==e.width&&(o.width=e.width),void 0!==e.height&&(o.height=e.height),t.css(o)},animate:function(t,e,o,i,a){var s,r=this;n.isFunction(o)&&(i=o,o=null),r.stop(t),s=r.getTranslate(t),t.on(f,function(c){(!c||!c.originalEvent||t.is(c.originalEvent.target)&&"z-index"!=c.originalEvent.propertyName)&&(r.stop(t),n.isNumeric(o)&&t.css("transition-duration",""),n.isPlainObject(e)?void 0!==e.scaleX&&void 0!==e.scaleY&&r.setTranslate(t,{top:e.top,left:e.left,width:s.width*e.scaleX,height:s.height*e.scaleY,scaleX:1,scaleY:1}):!0!==a&&t.removeClass(e),n.isFunction(i)&&i(c))}),n.isNumeric(o)&&t.css("transition-duration",o+"ms"),n.isPlainObject(e)?(void 0!==e.scaleX&&void 0!==e.scaleY&&(delete e.width,delete e.height,t.parent().hasClass("fancybox-slide--image")&&t.parent().addClass("fancybox-is-scaling")),n.fancybox.setTranslate(t,e)):t.addClass(e),t.data("timer",setTimeout(function(){t.trigger(f)},o+33))},stop:function(t,e){t&&t.length&&(clearTimeout(t.data("timer")),e&&t.trigger(f),t.off(f).css("transition-duration",""),t.parent().removeClass("fancybox-is-scaling"))}},n.fn.fancybox=function(t){var e;return t=t||{},e=t.selector||!1,e?n("body").off("click.fb-start",e).on("click.fb-start",e,{options:t},i):this.off("click.fb-start").on("click.fb-start",{items:this,options:t},i),this},r.on("click.fb-start","[data-fancybox]",i),r.on("click.fb-start","[data-fancybox-trigger]",function(t){n('[data-fancybox="'+n(this).attr("data-fancybox-trigger")+'"]').eq(n(this).attr("data-fancybox-index")||0).trigger("click.fb-start",{$trigger:n(this)})}),function(){var t=null;r.on("mousedown mouseup focus blur",".fancybox-button",function(e){switch(e.type){case"mousedown":t=n(this);break;case"mouseup":t=null;break;case"focusin":n(".fancybox-button").removeClass("fancybox-focus"),n(this).is(t)||n(this).is("[disabled]")||n(this).addClass("fancybox-focus");break;case"focusout":n(".fancybox-button").removeClass("fancybox-focus")}})}()}}(window,document,jQuery),function(t){"use strict";var e={youtube:{matcher:/(youtube\.com|youtu\.be|youtube\-nocookie\.com)\/(watch\?(.*&)?v=|v\/|u\/|embed\/?)?(videoseries\?list=(.*)|[\w-]{11}|\?listType=(.*)&list=(.*))(.*)/i,params:{autoplay:1,autohide:1,fs:1,rel:0,hd:1,wmode:"transparent",enablejsapi:1,html5:1},paramPlace:8,type:"iframe",url:"https://www.youtube-nocookie.com/embed/$4",thumb:"https://img.youtube.com/vi/$4/hqdefault.jpg"},vimeo:{matcher:/^.+vimeo.com\/(.*\/)?([\d]+)(.*)?/,params:{autoplay:1,hd:1,show_title:1,show_byline:1,show_portrait:0,fullscreen:1},paramPlace:3,type:"iframe",url:"//player.vimeo.com/video/$2"},instagram:{matcher:/(instagr\.am|instagram\.com)\/p\/([a-zA-Z0-9_\-]+)\/?/i,type:"image",url:"//$1/p/$2/media/?size=l"},gmap_place:{matcher:/(maps\.)?google\.([a-z]{2,3}(\.[a-z]{2})?)\/(((maps\/(place\/(.*)\/)?\@(.*),(\d+.?\d+?)z))|(\?ll=))(.*)?/i,type:"iframe",url:function(t){return"//maps.google."+t[2]+"/?ll="+(t[9]?t[9]+"&z="+Math.floor(t[10])+(t[12]?t[12].replace(/^\//,"&"):""):t[12]+"").replace(/\?/,"&")+"&output="+(t[12]&&t[12].indexOf("layer=c")>0?"svembed":"embed")}},gmap_search:{matcher:/(maps\.)?google\.([a-z]{2,3}(\.[a-z]{2})?)\/(maps\/search\/)(.*)/i,type:"iframe",url:function(t){return"//maps.google."+t[2]+"/maps?q="+t[5].replace("query=","q=").replace("api=1","")+"&output=embed"}}},n=function(e,n,o){if(e)return o=o||"","object"===t.type(o)&&(o=t.param(o,!0)),t.each(n,function(t,n){e=e.replace("$"+t,n||"")}),o.length&&(e+=(e.indexOf("?")>0?"&":"?")+o),e};t(document).on("objectNeedsType.fb",function(o,i,a){var s,r,c,l,d,u,f,p=a.src||"",h=!1;s=t.extend(!0,{},e,a.opts.media),t.each(s,function(e,o){if(c=p.match(o.matcher)){if(h=o.type,f=e,u={},o.paramPlace&&c[o.paramPlace]){d=c[o.paramPlace],"?"==d[0]&&(d=d.substring(1)),d=d.split("&");for(var i=0;i<d.length;++i){var s=d[i].split("=",2);2==s.length&&(u[s[0]]=decodeURIComponent(s[1].replace(/\+/g," ")))}}return l=t.extend(!0,{},o.params,a.opts[e],u),p="function"===t.type(o.url)?o.url.call(this,c,l,a):n(o.url,c,l),r="function"===t.type(o.thumb)?o.thumb.call(this,c,l,a):n(o.thumb,c),"youtube"===e?p=p.replace(/&t=((\d+)m)?(\d+)s/,function(t,e,n,o){return"&start="+((n?60*parseInt(n,10):0)+parseInt(o,10))}):"vimeo"===e&&(p=p.replace("&%23","#")),!1}}),h?(a.opts.thumb||a.opts.$thumb&&a.opts.$thumb.length||(a.opts.thumb=r),"iframe"===h&&(a.opts=t.extend(!0,a.opts,{iframe:{preload:!1,attr:{scrolling:"no"}}})),t.extend(a,{type:h,src:p,origSrc:a.src,contentSource:f,contentType:"image"===h?"image":"gmap_place"==f||"gmap_search"==f?"map":"video"})):p&&(a.type=a.opts.defaultType)});var o={youtube:{src:"https://www.youtube.com/iframe_api",class:"YT",loading:!1,loaded:!1},vimeo:{src:"https://player.vimeo.com/api/player.js",class:"Vimeo",loading:!1,loaded:!1},load:function(t){var e,n=this;if(this[t].loaded)return void setTimeout(function(){n.done(t)});this[t].loading||(this[t].loading=!0,e=document.createElement("script"),e.type="text/javascript",e.src=this[t].src,"youtube"===t?window.onYouTubeIframeAPIReady=function(){n[t].loaded=!0,n.done(t)}:e.onload=function(){n[t].loaded=!0,n.done(t)},document.body.appendChild(e))},done:function(e){var n,o,i;"youtube"===e&&delete window.onYouTubeIframeAPIReady,(n=t.fancybox.getInstance())&&(o=n.current.$content.find("iframe"),"youtube"===e&&void 0!==YT&&YT?i=new YT.Player(o.attr("id"),{events:{onStateChange:function(t){0==t.data&&n.next()}}}):"vimeo"===e&&void 0!==Vimeo&&Vimeo&&(i=new Vimeo.Player(o),i.on("ended",function(){n.next()})))}};t(document).on({"afterShow.fb":function(t,e,n){e.group.length>1&&("youtube"===n.contentSource||"vimeo"===n.contentSource)&&o.load(n.contentSource)}})}(jQuery),function(t,e,n){"use strict";var o=function(){return t.requestAnimationFrame||t.webkitRequestAnimationFrame||t.mozRequestAnimationFrame||t.oRequestAnimationFrame||function(e){return t.setTimeout(e,1e3/60)}}(),i=function(){return t.cancelAnimationFrame||t.webkitCancelAnimationFrame||t.mozCancelAnimationFrame||t.oCancelAnimationFrame||function(e){t.clearTimeout(e)}}(),a=function(e){var n=[];e=e.originalEvent||e||t.e,e=e.touches&&e.touches.length?e.touches:e.changedTouches&&e.changedTouches.length?e.changedTouches:[e];for(var o in e)e[o].pageX?n.push({x:e[o].pageX,y:e[o].pageY}):e[o].clientX&&n.push({x:e[o].clientX,y:e[o].clientY});return n},s=function(t,e,n){return e&&t?"x"===n?t.x-e.x:"y"===n?t.y-e.y:Math.sqrt(Math.pow(t.x-e.x,2)+Math.pow(t.y-e.y,2)):0},r=function(t){if(t.is('a,area,button,[role="button"],input,label,select,summary,textarea,video,audio,iframe')||n.isFunction(t.get(0).onclick)||t.data("selectable"))return!0;for(var e=0,o=t[0].attributes,i=o.length;e<i;e++)if("data-fancybox-"===o[e].nodeName.substr(0,14))return!0;return!1},c=function(e){var n=t.getComputedStyle(e)["overflow-y"],o=t.getComputedStyle(e)["overflow-x"],i=("scroll"===n||"auto"===n)&&e.scrollHeight>e.clientHeight,a=("scroll"===o||"auto"===o)&&e.scrollWidth>e.clientWidth;return i||a},l=function(t){for(var e=!1;;){if(e=c(t.get(0)))break;if(t=t.parent(),!t.length||t.hasClass("fancybox-stage")||t.is("body"))break}return e},d=function(t){var e=this;e.instance=t,e.$bg=t.$refs.bg,e.$stage=t.$refs.stage,e.$container=t.$refs.container,e.destroy(),e.$container.on("touchstart.fb.touch mousedown.fb.touch",n.proxy(e,"ontouchstart"))};d.prototype.destroy=function(){var t=this;t.$container.off(".fb.touch"),n(e).off(".fb.touch"),t.requestId&&(i(t.requestId),t.requestId=null),t.tapped&&(clearTimeout(t.tapped),t.tapped=null)},d.prototype.ontouchstart=function(o){var i=this,c=n(o.target),d=i.instance,u=d.current,f=u.$slide,p=u.$content,h="touchstart"==o.type;if(h&&i.$container.off("mousedown.fb.touch"),(!o.originalEvent||2!=o.originalEvent.button)&&f.length&&c.length&&!r(c)&&!r(c.parent())&&(c.is("img")||!(o.originalEvent.clientX>c[0].clientWidth+c.offset().left))){if(!u||d.isAnimating||u.$slide.hasClass("fancybox-animated"))return o.stopPropagation(),void o.preventDefault();i.realPoints=i.startPoints=a(o),i.startPoints.length&&(u.touch&&o.stopPropagation(),i.startEvent=o,i.canTap=!0,i.$target=c,i.$content=p,i.opts=u.opts.touch,i.isPanning=!1,i.isSwiping=!1,i.isZooming=!1,i.isScrolling=!1,i.canPan=d.canPan(),i.startTime=(new Date).getTime(),i.distanceX=i.distanceY=i.distance=0,i.canvasWidth=Math.round(f[0].clientWidth),i.canvasHeight=Math.round(f[0].clientHeight),i.contentLastPos=null,i.contentStartPos=n.fancybox.getTranslate(i.$content)||{top:0,left:0},i.sliderStartPos=n.fancybox.getTranslate(f),i.stagePos=n.fancybox.getTranslate(d.$refs.stage),i.sliderStartPos.top-=i.stagePos.top,i.sliderStartPos.left-=i.stagePos.left,i.contentStartPos.top-=i.stagePos.top,i.contentStartPos.left-=i.stagePos.left,n(e).off(".fb.touch").on(h?"touchend.fb.touch touchcancel.fb.touch":"mouseup.fb.touch mouseleave.fb.touch",n.proxy(i,"ontouchend")).on(h?"touchmove.fb.touch":"mousemove.fb.touch",n.proxy(i,"ontouchmove")),n.fancybox.isMobile&&e.addEventListener("scroll",i.onscroll,!0),((i.opts||i.canPan)&&(c.is(i.$stage)||i.$stage.find(c).length)||(c.is(".fancybox-image")&&o.preventDefault(),n.fancybox.isMobile&&c.parents(".fancybox-caption").length))&&(i.isScrollable=l(c)||l(c.parent()),n.fancybox.isMobile&&i.isScrollable||o.preventDefault(),(1===i.startPoints.length||u.hasError)&&(i.canPan?(n.fancybox.stop(i.$content),i.isPanning=!0):i.isSwiping=!0,i.$container.addClass("fancybox-is-grabbing")),2===i.startPoints.length&&"image"===u.type&&(u.isLoaded||u.$ghost)&&(i.canTap=!1,i.isSwiping=!1,i.isPanning=!1,i.isZooming=!0,n.fancybox.stop(i.$content),i.centerPointStartX=.5*(i.startPoints[0].x+i.startPoints[1].x)-n(t).scrollLeft(),i.centerPointStartY=.5*(i.startPoints[0].y+i.startPoints[1].y)-n(t).scrollTop(),i.percentageOfImageAtPinchPointX=(i.centerPointStartX-i.contentStartPos.left)/i.contentStartPos.width,i.percentageOfImageAtPinchPointY=(i.centerPointStartY-i.contentStartPos.top)/i.contentStartPos.height,i.startDistanceBetweenFingers=s(i.startPoints[0],i.startPoints[1]))))}},d.prototype.onscroll=function(t){var n=this;n.isScrolling=!0,e.removeEventListener("scroll",n.onscroll,!0)},d.prototype.ontouchmove=function(t){var e=this;return void 0!==t.originalEvent.buttons&&0===t.originalEvent.buttons?void e.ontouchend(t):e.isScrolling?void(e.canTap=!1):(e.newPoints=a(t),void((e.opts||e.canPan)&&e.newPoints.length&&e.newPoints.length&&(e.isSwiping&&!0===e.isSwiping||t.preventDefault(),e.distanceX=s(e.newPoints[0],e.startPoints[0],"x"),e.distanceY=s(e.newPoints[0],e.startPoints[0],"y"),e.distance=s(e.newPoints[0],e.startPoints[0]),e.distance>0&&(e.isSwiping?e.onSwipe(t):e.isPanning?e.onPan():e.isZooming&&e.onZoom()))))},d.prototype.onSwipe=function(e){var a,s=this,r=s.instance,c=s.isSwiping,l=s.sliderStartPos.left||0;if(!0!==c)"x"==c&&(s.distanceX>0&&(s.instance.group.length<2||0===s.instance.current.index&&!s.instance.current.opts.loop)?l+=Math.pow(s.distanceX,.8):s.distanceX<0&&(s.instance.group.length<2||s.instance.current.index===s.instance.group.length-1&&!s.instance.current.opts.loop)?l-=Math.pow(-s.distanceX,.8):l+=s.distanceX),s.sliderLastPos={top:"x"==c?0:s.sliderStartPos.top+s.distanceY,left:l},s.requestId&&(i(s.requestId),s.requestId=null),s.requestId=o(function(){s.sliderLastPos&&(n.each(s.instance.slides,function(t,e){var o=e.pos-s.instance.currPos;n.fancybox.setTranslate(e.$slide,{top:s.sliderLastPos.top,left:s.sliderLastPos.left+o*s.canvasWidth+o*e.opts.gutter})}),s.$container.addClass("fancybox-is-sliding"))});else if(Math.abs(s.distance)>10){if(s.canTap=!1,r.group.length<2&&s.opts.vertical?s.isSwiping="y":r.isDragging||!1===s.opts.vertical||"auto"===s.opts.vertical&&n(t).width()>800?s.isSwiping="x":(a=Math.abs(180*Math.atan2(s.distanceY,s.distanceX)/Math.PI),s.isSwiping=a>45&&a<135?"y":"x"),"y"===s.isSwiping&&n.fancybox.isMobile&&s.isScrollable)return void(s.isScrolling=!0);r.isDragging=s.isSwiping,s.startPoints=s.newPoints,n.each(r.slides,function(t,e){var o,i;n.fancybox.stop(e.$slide),o=n.fancybox.getTranslate(e.$slide),i=n.fancybox.getTranslate(r.$refs.stage),e.$slide.css({transform:"",opacity:"","transition-duration":""}).removeClass("fancybox-animated").removeClass(function(t,e){return(e.match(/(^|\s)fancybox-fx-\S+/g)||[]).join(" ")}),e.pos===r.current.pos&&(s.sliderStartPos.top=o.top-i.top,s.sliderStartPos.left=o.left-i.left),n.fancybox.setTranslate(e.$slide,{top:o.top-i.top,left:o.left-i.left})}),r.SlideShow&&r.SlideShow.isActive&&r.SlideShow.stop()}},d.prototype.onPan=function(){var t=this;if(s(t.newPoints[0],t.realPoints[0])<(n.fancybox.isMobile?10:5))return void(t.startPoints=t.newPoints);t.canTap=!1,t.contentLastPos=t.limitMovement(),t.requestId&&i(t.requestId),t.requestId=o(function(){n.fancybox.setTranslate(t.$content,t.contentLastPos)})},d.prototype.limitMovement=function(){var t,e,n,o,i,a,s=this,r=s.canvasWidth,c=s.canvasHeight,l=s.distanceX,d=s.distanceY,u=s.contentStartPos,f=u.left,p=u.top,h=u.width,g=u.height;return i=h>r?f+l:f,a=p+d,t=Math.max(0,.5*r-.5*h),e=Math.max(0,.5*c-.5*g),n=Math.min(r-h,.5*r-.5*h),o=Math.min(c-g,.5*c-.5*g),l>0&&i>t&&(i=t-1+Math.pow(-t+f+l,.8)||0),l<0&&i<n&&(i=n+1-Math.pow(n-f-l,.8)||0),d>0&&a>e&&(a=e-1+Math.pow(-e+p+d,.8)||0),d<0&&a<o&&(a=o+1-Math.pow(o-p-d,.8)||0),{top:a,left:i}},d.prototype.limitPosition=function(t,e,n,o){var i=this,a=i.canvasWidth,s=i.canvasHeight;return n>a?(t=t>0?0:t,t=t<a-n?a-n:t):t=Math.max(0,a/2-n/2),o>s?(e=e>0?0:e,e=e<s-o?s-o:e):e=Math.max(0,s/2-o/2),{top:e,left:t}},d.prototype.onZoom=function(){var e=this,a=e.contentStartPos,r=a.width,c=a.height,l=a.left,d=a.top,u=s(e.newPoints[0],e.newPoints[1]),f=u/e.startDistanceBetweenFingers,p=Math.floor(r*f),h=Math.floor(c*f),g=(r-p)*e.percentageOfImageAtPinchPointX,b=(c-h)*e.percentageOfImageAtPinchPointY,m=(e.newPoints[0].x+e.newPoints[1].x)/2-n(t).scrollLeft(),v=(e.newPoints[0].y+e.newPoints[1].y)/2-n(t).scrollTop(),y=m-e.centerPointStartX,x=v-e.centerPointStartY,w=l+(g+y),$=d+(b+x),S={top:$,left:w,scaleX:f,scaleY:f};e.canTap=!1,e.newWidth=p,e.newHeight=h,e.contentLastPos=S,e.requestId&&i(e.requestId),e.requestId=o(function(){n.fancybox.setTranslate(e.$content,e.contentLastPos)})},d.prototype.ontouchend=function(t){var o=this,s=o.isSwiping,r=o.isPanning,c=o.isZooming,l=o.isScrolling;if(o.endPoints=a(t),o.dMs=Math.max((new Date).getTime()-o.startTime,1),o.$container.removeClass("fancybox-is-grabbing"),n(e).off(".fb.touch"),e.removeEventListener("scroll",o.onscroll,!0),o.requestId&&(i(o.requestId),o.requestId=null),o.isSwiping=!1,o.isPanning=!1,o.isZooming=!1,o.isScrolling=!1,o.instance.isDragging=!1,o.canTap)return o.onTap(t);o.speed=100,o.velocityX=o.distanceX/o.dMs*.5,o.velocityY=o.distanceY/o.dMs*.5,r?o.endPanning():c?o.endZooming():o.endSwiping(s,l)},d.prototype.endSwiping=function(t,e){var o=this,i=!1,a=o.instance.group.length,s=Math.abs(o.distanceX),r="x"==t&&a>1&&(o.dMs>130&&s>10||s>50);o.sliderLastPos=null,"y"==t&&!e&&Math.abs(o.distanceY)>50?(n.fancybox.animate(o.instance.current.$slide,{top:o.sliderStartPos.top+o.distanceY+150*o.velocityY,opacity:0},200),i=o.instance.close(!0,250)):r&&o.distanceX>0?i=o.instance.previous(300):r&&o.distanceX<0&&(i=o.instance.next(300)),!1!==i||"x"!=t&&"y"!=t||o.instance.centerSlide(200),o.$container.removeClass("fancybox-is-sliding")},d.prototype.endPanning=function(){var t,e,o,i=this;i.contentLastPos&&(!1===i.opts.momentum||i.dMs>350?(t=i.contentLastPos.left,e=i.contentLastPos.top):(t=i.contentLastPos.left+500*i.velocityX,e=i.contentLastPos.top+500*i.velocityY),o=i.limitPosition(t,e,i.contentStartPos.width,i.contentStartPos.height),o.width=i.contentStartPos.width,o.height=i.contentStartPos.height,n.fancybox.animate(i.$content,o,366))},d.prototype.endZooming=function(){var t,e,o,i,a=this,s=a.instance.current,r=a.newWidth,c=a.newHeight;a.contentLastPos&&(t=a.contentLastPos.left,e=a.contentLastPos.top,i={top:e,left:t,width:r,height:c,scaleX:1,scaleY:1},n.fancybox.setTranslate(a.$content,i),r<a.canvasWidth&&c<a.canvasHeight?a.instance.scaleToFit(150):r>s.width||c>s.height?a.instance.scaleToActual(a.centerPointStartX,a.centerPointStartY,150):(o=a.limitPosition(t,e,r,c),n.fancybox.animate(a.$content,o,150)))},d.prototype.onTap=function(e){var o,i=this,s=n(e.target),r=i.instance,c=r.current,l=e&&a(e)||i.startPoints,d=l[0]?l[0].x-n(t).scrollLeft()-i.stagePos.left:0,u=l[0]?l[0].y-n(t).scrollTop()-i.stagePos.top:0,f=function(t){var o=c.opts[t];if(n.isFunction(o)&&(o=o.apply(r,[c,e])),o)switch(o){case"close":r.close(i.startEvent);break;case"toggleControls":r.toggleControls();break;case"next":r.next();break;case"nextOrClose":r.group.length>1?r.next():r.close(i.startEvent);break;case"zoom":"image"==c.type&&(c.isLoaded||c.$ghost)&&(r.canPan()?r.scaleToFit():r.isScaledDown()?r.scaleToActual(d,u):r.group.length<2&&r.close(i.startEvent))}};if((!e.originalEvent||2!=e.originalEvent.button)&&(s.is("img")||!(d>s[0].clientWidth+s.offset().left))){if(s.is(".fancybox-bg,.fancybox-inner,.fancybox-outer,.fancybox-container"))o="Outside";else if(s.is(".fancybox-slide"))o="Slide";else{if(!r.current.$content||!r.current.$content.find(s).addBack().filter(s).length)return;o="Content"}if(i.tapped){if(clearTimeout(i.tapped),i.tapped=null,Math.abs(d-i.tapX)>50||Math.abs(u-i.tapY)>50)return this;f("dblclick"+o)}else i.tapX=d,i.tapY=u,c.opts["dblclick"+o]&&c.opts["dblclick"+o]!==c.opts["click"+o]?i.tapped=setTimeout(function(){i.tapped=null,r.isAnimating||f("click"+o)},500):f("click"+o);return this}},n(e).on("onActivate.fb",function(t,e){e&&!e.Guestures&&(e.Guestures=new d(e))}).on("beforeClose.fb",function(t,e){e&&e.Guestures&&e.Guestures.destroy()})}(window,document,jQuery),function(t,e){"use strict";e.extend(!0,e.fancybox.defaults,{btnTpl:{slideShow:'<button data-fancybox-play class="fancybox-button fancybox-button--play" title="{{PLAY_START}}"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M6.5 5.4v13.2l11-6.6z"/></svg><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M8.33 5.75h2.2v12.5h-2.2V5.75zm5.15 0h2.2v12.5h-2.2V5.75z"/></svg></button>'},slideShow:{autoStart:!1,speed:3e3,progress:!0}});var n=function(t){this.instance=t,this.init()};e.extend(n.prototype,{timer:null,isActive:!1,$button:null,init:function(){var t=this,n=t.instance,o=n.group[n.currIndex].opts.slideShow;t.$button=n.$refs.toolbar.find("[data-fancybox-play]").on("click",function(){t.toggle()}),n.group.length<2||!o?t.$button.hide():o.progress&&(t.$progress=e('<div class="fancybox-progress"></div>').appendTo(n.$refs.inner))},set:function(t){var n=this,o=n.instance,i=o.current;i&&(!0===t||i.opts.loop||o.currIndex<o.group.length-1)?n.isActive&&"video"!==i.contentType&&(n.$progress&&e.fancybox.animate(n.$progress.show(),{scaleX:1},i.opts.slideShow.speed),n.timer=setTimeout(function(){o.current.opts.loop||o.current.index!=o.group.length-1?o.next():o.jumpTo(0)},i.opts.slideShow.speed)):(n.stop(),o.idleSecondsCounter=0,o.showControls())},clear:function(){var t=this;clearTimeout(t.timer),t.timer=null,t.$progress&&t.$progress.removeAttr("style").hide()},start:function(){var t=this,e=t.instance.current;e&&(t.$button.attr("title",(e.opts.i18n[e.opts.lang]||e.opts.i18n.en).PLAY_STOP).removeClass("fancybox-button--play").addClass("fancybox-button--pause"),t.isActive=!0,e.isComplete&&t.set(!0),t.instance.trigger("onSlideShowChange",!0))},stop:function(){var t=this,e=t.instance.current;t.clear(),t.$button.attr("title",(e.opts.i18n[e.opts.lang]||e.opts.i18n.en).PLAY_START).removeClass("fancybox-button--pause").addClass("fancybox-button--play"),t.isActive=!1,t.instance.trigger("onSlideShowChange",!1),t.$progress&&t.$progress.removeAttr("style").hide()},toggle:function(){var t=this;t.isActive?t.stop():t.start()}}),e(t).on({"onInit.fb":function(t,e){e&&!e.SlideShow&&(e.SlideShow=new n(e))},"beforeShow.fb":function(t,e,n,o){var i=e&&e.SlideShow;o?i&&n.opts.slideShow.autoStart&&i.start():i&&i.isActive&&i.clear()},"afterShow.fb":function(t,e,n){var o=e&&e.SlideShow;o&&o.isActive&&o.set()},"afterKeydown.fb":function(n,o,i,a,s){var r=o&&o.SlideShow;!r||!i.opts.slideShow||80!==s&&32!==s||e(t.activeElement).is("button,a,input")||(a.preventDefault(),r.toggle())},"beforeClose.fb onDeactivate.fb":function(t,e){var n=e&&e.SlideShow;n&&n.stop()}}),e(t).on("visibilitychange",function(){var n=e.fancybox.getInstance(),o=n&&n.SlideShow;o&&o.isActive&&(t.hidden?o.clear():o.set())})}(document,jQuery),function(t,e){"use strict";var n=function(){for(var e=[["requestFullscreen","exitFullscreen","fullscreenElement","fullscreenEnabled","fullscreenchange","fullscreenerror"],["webkitRequestFullscreen","webkitExitFullscreen","webkitFullscreenElement","webkitFullscreenEnabled","webkitfullscreenchange","webkitfullscreenerror"],["webkitRequestFullScreen","webkitCancelFullScreen","webkitCurrentFullScreenElement","webkitCancelFullScreen","webkitfullscreenchange","webkitfullscreenerror"],["mozRequestFullScreen","mozCancelFullScreen","mozFullScreenElement","mozFullScreenEnabled","mozfullscreenchange","mozfullscreenerror"],["msRequestFullscreen","msExitFullscreen","msFullscreenElement","msFullscreenEnabled","MSFullscreenChange","MSFullscreenError"]],n={},o=0;o<e.length;o++){var i=e[o];if(i&&i[1]in t){for(var a=0;a<i.length;a++)n[e[0][a]]=i[a];return n}}return!1}();if(n){var o={request:function(e){e=e||t.documentElement,e[n.requestFullscreen](e.ALLOW_KEYBOARD_INPUT)},exit:function(){t[n.exitFullscreen]()},toggle:function(e){e=e||t.documentElement,this.isFullscreen()?this.exit():this.request(e)},isFullscreen:function(){return Boolean(t[n.fullscreenElement])},enabled:function(){return Boolean(t[n.fullscreenEnabled])}};e.extend(!0,e.fancybox.defaults,{btnTpl:{fullScreen:'<button data-fancybox-fullscreen class="fancybox-button fancybox-button--fsenter" title="{{FULL_SCREEN}}"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M5 16h3v3h2v-5H5zm3-8H5v2h5V5H8zm6 11h2v-3h3v-2h-5zm2-11V5h-2v5h5V8z"/></svg></button>'},fullScreen:{autoStart:!1}}),e(t).on(n.fullscreenchange,function(){var t=o.isFullscreen(),n=e.fancybox.getInstance();n&&(n.current&&"image"===n.current.type&&n.isAnimating&&(n.isAnimating=!1,n.update(!0,!0,0),n.isComplete||n.complete()),n.trigger("onFullscreenChange",t),n.$refs.container.toggleClass("fancybox-is-fullscreen",t),n.$refs.toolbar.find("[data-fancybox-fullscreen]").toggleClass("fancybox-button--fsenter",!t).toggleClass("fancybox-button--fsexit",t))})}e(t).on({"onInit.fb":function(t,e){var i;if(!n)return void e.$refs.toolbar.find("[data-fancybox-fullscreen]").remove();e&&e.group[e.currIndex].opts.fullScreen?(i=e.$refs.container,i.on("click.fb-fullscreen","[data-fancybox-fullscreen]",function(t){t.stopPropagation(),t.preventDefault(),o.toggle()}),e.opts.fullScreen&&!0===e.opts.fullScreen.autoStart&&o.request(),e.FullScreen=o):e&&e.$refs.toolbar.find("[data-fancybox-fullscreen]").hide()},"afterKeydown.fb":function(t,e,n,o,i){e&&e.FullScreen&&70===i&&(o.preventDefault(),e.FullScreen.toggle())},"beforeClose.fb":function(t,e){e&&e.FullScreen&&e.$refs.container.hasClass("fancybox-is-fullscreen")&&o.exit()}})}(document,jQuery),function(t,e){"use strict";var n="fancybox-thumbs";e.fancybox.defaults=e.extend(!0,{btnTpl:{thumbs:'<button data-fancybox-thumbs class="fancybox-button fancybox-button--thumbs" title="{{THUMBS}}"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M14.59 14.59h3.76v3.76h-3.76v-3.76zm-4.47 0h3.76v3.76h-3.76v-3.76zm-4.47 0h3.76v3.76H5.65v-3.76zm8.94-4.47h3.76v3.76h-3.76v-3.76zm-4.47 0h3.76v3.76h-3.76v-3.76zm-4.47 0h3.76v3.76H5.65v-3.76zm8.94-4.47h3.76v3.76h-3.76V5.65zm-4.47 0h3.76v3.76h-3.76V5.65zm-4.47 0h3.76v3.76H5.65V5.65z"/></svg></button>'},thumbs:{autoStart:!1,hideOnClose:!0,parentEl:".fancybox-container",axis:"y"}},e.fancybox.defaults);var o=function(t){this.init(t)};e.extend(o.prototype,{$button:null,$grid:null,$list:null,isVisible:!1,isActive:!1,init:function(t){var e=this,n=t.group,o=0;e.instance=t,e.opts=n[t.currIndex].opts.thumbs,t.Thumbs=e,e.$button=t.$refs.toolbar.find("[data-fancybox-thumbs]");for(var i=0,a=n.length;i<a&&(n[i].thumb&&o++,!(o>1));i++);o>1&&e.opts?(e.$button.removeAttr("style").on("click",function(){e.toggle()}),e.isActive=!0):e.$button.hide()},create:function(){var t,o=this,i=o.instance,a=o.opts.parentEl,s=[];o.$grid||(o.$grid=e('<div class="'+n+" "+n+"-"+o.opts.axis+'"></div>').appendTo(i.$refs.container.find(a).addBack().filter(a)),o.$grid.on("click","a",function(){i.jumpTo(e(this).attr("data-index"))})),o.$list||(o.$list=e('<div class="'+n+'__list">').appendTo(o.$grid)),e.each(i.group,function(e,n){t=n.thumb,t||"image"!==n.type||(t=n.src),s.push('<a href="javascript:;" tabindex="0" data-index="'+e+'"'+(t&&t.length?' style="background-image:url('+t+')"':'class="fancybox-thumbs-missing"')+"></a>")}),o.$list[0].innerHTML=s.join(""),"x"===o.opts.axis&&o.$list.width(parseInt(o.$grid.css("padding-right"),10)+i.group.length*o.$list.children().eq(0).outerWidth(!0))},focus:function(t){var e,n,o=this,i=o.$list,a=o.$grid;o.instance.current&&(e=i.children().removeClass("fancybox-thumbs-active").filter('[data-index="'+o.instance.current.index+'"]').addClass("fancybox-thumbs-active"),n=e.position(),"y"===o.opts.axis&&(n.top<0||n.top>i.height()-e.outerHeight())?i.stop().animate({scrollTop:i.scrollTop()+n.top},t):"x"===o.opts.axis&&(n.left<a.scrollLeft()||n.left>a.scrollLeft()+(a.width()-e.outerWidth()))&&i.parent().stop().animate({scrollLeft:n.left},t))},update:function(){var t=this;t.instance.$refs.container.toggleClass("fancybox-show-thumbs",this.isVisible),t.isVisible?(t.$grid||t.create(),t.instance.trigger("onThumbsShow"),t.focus(0)):t.$grid&&t.instance.trigger("onThumbsHide"),t.instance.update()},hide:function(){this.isVisible=!1,this.update()},show:function(){this.isVisible=!0,this.update()},toggle:function(){this.isVisible=!this.isVisible,this.update()}}),e(t).on({"onInit.fb":function(t,e){var n;e&&!e.Thumbs&&(n=new o(e),n.isActive&&!0===n.opts.autoStart&&n.show())},"beforeShow.fb":function(t,e,n,o){var i=e&&e.Thumbs;i&&i.isVisible&&i.focus(o?0:250)},"afterKeydown.fb":function(t,e,n,o,i){var a=e&&e.Thumbs;a&&a.isActive&&71===i&&(o.preventDefault(),a.toggle())},"beforeClose.fb":function(t,e){var n=e&&e.Thumbs;n&&n.isVisible&&!1!==n.opts.hideOnClose&&n.$grid.hide()}})}(document,jQuery),function(t,e){"use strict";function n(t){var e={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;","/":"&#x2F;","`":"&#x60;","=":"&#x3D;"};return String(t).replace(/[&<>"'`=\/]/g,function(t){return e[t]})}e.extend(!0,e.fancybox.defaults,{btnTpl:{share:'<button data-fancybox-share class="fancybox-button fancybox-button--share" title="{{SHARE}}"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M2.55 19c1.4-8.4 9.1-9.8 11.9-9.8V5l7 7-7 6.3v-3.5c-2.8 0-10.5 2.1-11.9 4.2z"/></svg></button>'},share:{url:function(t,e){return!t.currentHash&&"inline"!==e.type&&"html"!==e.type&&(e.origSrc||e.src)||window.location},
tpl:'<div class="fancybox-share"><h1>{{SHARE}}</h1><p><a class="fancybox-share__button fancybox-share__button--fb" href="https://www.facebook.com/sharer/sharer.php?u={{url}}"><svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path d="m287 456v-299c0-21 6-35 35-35h38v-63c-7-1-29-3-55-3-54 0-91 33-91 94v306m143-254h-205v72h196" /></svg><span>Facebook</span></a><a class="fancybox-share__button fancybox-share__button--tw" href="https://twitter.com/intent/tweet?url={{url}}&text={{descr}}"><svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path d="m456 133c-14 7-31 11-47 13 17-10 30-27 37-46-15 10-34 16-52 20-61-62-157-7-141 75-68-3-129-35-169-85-22 37-11 86 26 109-13 0-26-4-37-9 0 39 28 72 65 80-12 3-25 4-37 2 10 33 41 57 77 57-42 30-77 38-122 34 170 111 378-32 359-208 16-11 30-25 41-42z" /></svg><span>Twitter</span></a><a class="fancybox-share__button fancybox-share__button--pt" href="https://www.pinterest.com/pin/create/button/?url={{url}}&description={{descr}}&media={{media}}"><svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path d="m265 56c-109 0-164 78-164 144 0 39 15 74 47 87 5 2 10 0 12-5l4-19c2-6 1-8-3-13-9-11-15-25-15-45 0-58 43-110 113-110 62 0 96 38 96 88 0 67-30 122-73 122-24 0-42-19-36-44 6-29 20-60 20-81 0-19-10-35-31-35-25 0-44 26-44 60 0 21 7 36 7 36l-30 125c-8 37-1 83 0 87 0 3 4 4 5 2 2-3 32-39 42-75l16-64c8 16 31 29 56 29 74 0 124-67 124-157 0-69-58-132-146-132z" fill="#fff"/></svg><span>Pinterest</span></a></p><p><input class="fancybox-share__input" type="text" value="{{url_raw}}" onclick="select()" /></p></div>'}}),e(t).on("click","[data-fancybox-share]",function(){var t,o,i=e.fancybox.getInstance(),a=i.current||null;a&&("function"===e.type(a.opts.share.url)&&(t=a.opts.share.url.apply(a,[i,a])),o=a.opts.share.tpl.replace(/\{\{media\}\}/g,"image"===a.type?encodeURIComponent(a.src):"").replace(/\{\{url\}\}/g,encodeURIComponent(t)).replace(/\{\{url_raw\}\}/g,n(t)).replace(/\{\{descr\}\}/g,i.$caption?encodeURIComponent(i.$caption.text()):""),e.fancybox.open({src:i.translate(i,o),type:"html",opts:{touch:!1,animationEffect:!1,afterLoad:function(t,e){i.$refs.container.one("beforeClose.fb",function(){t.close(null,0)}),e.$content.find(".fancybox-share__button").click(function(){return window.open(this.href,"Share","width=550, height=450"),!1})},mobile:{autoFocus:!1}}}))})}(document,jQuery),function(t,e,n){"use strict";function o(){var e=t.location.hash.substr(1),n=e.split("-"),o=n.length>1&&/^\+?\d+$/.test(n[n.length-1])?parseInt(n.pop(-1),10)||1:1,i=n.join("-");return{hash:e,index:o<1?1:o,gallery:i}}function i(t){""!==t.gallery&&n("[data-fancybox='"+n.escapeSelector(t.gallery)+"']").eq(t.index-1).focus().trigger("click.fb-start")}function a(t){var e,n;return!!t&&(e=t.current?t.current.opts:t.opts,""!==(n=e.hash||(e.$orig?e.$orig.data("fancybox")||e.$orig.data("fancybox-trigger"):""))&&n)}n.escapeSelector||(n.escapeSelector=function(t){return(t+"").replace(/([\0-\x1f\x7f]|^-?\d)|^-$|[^\x80-\uFFFF\w-]/g,function(t,e){return e?"\0"===t?"�":t.slice(0,-1)+"\\"+t.charCodeAt(t.length-1).toString(16)+" ":"\\"+t})}),n(function(){!1!==n.fancybox.defaults.hash&&(n(e).on({"onInit.fb":function(t,e){var n,i;!1!==e.group[e.currIndex].opts.hash&&(n=o(),(i=a(e))&&n.gallery&&i==n.gallery&&(e.currIndex=n.index-1))},"beforeShow.fb":function(n,o,i,s){var r;i&&!1!==i.opts.hash&&(r=a(o))&&(o.currentHash=r+(o.group.length>1?"-"+(i.index+1):""),t.location.hash!=="#"+o.currentHash&&(s&&!o.origHash&&(o.origHash=t.location.hash),o.hashTimer&&clearTimeout(o.hashTimer),o.hashTimer=setTimeout(function(){"replaceState"in t.history?(t.history[s?"pushState":"replaceState"]({},e.title,t.location.pathname+t.location.search+"#"+o.currentHash),s&&(o.hasCreatedHistory=!0)):t.location.hash=o.currentHash,o.hashTimer=null},300)))},"beforeClose.fb":function(n,o,i){i&&!1!==i.opts.hash&&(clearTimeout(o.hashTimer),o.currentHash&&o.hasCreatedHistory?t.history.back():o.currentHash&&("replaceState"in t.history?t.history.replaceState({},e.title,t.location.pathname+t.location.search+(o.origHash||"")):t.location.hash=o.origHash),o.currentHash=null)}}),n(t).on("hashchange.fb",function(){var t=o(),e=null;n.each(n(".fancybox-container").get().reverse(),function(t,o){var i=n(o).data("FancyBox");if(i&&i.currentHash)return e=i,!1}),e?e.currentHash===t.gallery+"-"+t.index||1===t.index&&e.currentHash==t.gallery||(e.currentHash=null,e.close()):""!==t.gallery&&i(t)}),setTimeout(function(){n.fancybox.getInstance()||i(o())},50))})}(window,document,jQuery),function(t,e){"use strict";var n=(new Date).getTime();e(t).on({"onInit.fb":function(t,e,o){e.$refs.stage.on("mousewheel DOMMouseScroll wheel MozMousePixelScroll",function(t){var o=e.current,i=(new Date).getTime();e.group.length<2||!1===o.opts.wheel||"auto"===o.opts.wheel&&"image"!==o.type||(t.preventDefault(),t.stopPropagation(),o.$slide.hasClass("fancybox-animated")||(t=t.originalEvent||t,i-n<250||(n=i,e[(-t.deltaY||-t.deltaX||t.wheelDelta||-t.detail)<0?"next":"previous"]())))})}})}(document,jQuery);
/* End */
;
; /* Start:"a:4:{s:4:"full";s:102:"/local/templates/dombilet2.0/components/bitrix/catalog.element/.default/js/LSVGLayer.js?17737584662470";s:6:"source";s:87:"/local/templates/dombilet2.0/components/bitrix/catalog.element/.default/js/LSVGLayer.js";s:3:"min";s:0:"";s:3:"map";s:0:"";}"*/
L.SVGOverlay = L.ImageOverlay.extend({
  initialize: function (source, bounds, options) {
    // (String, LatLngBounds, Object)
    this._url = source;
    this._bounds = toLatLngBounds(bounds);

    L.setOptions(this, options);
  },

  _initImage: function () {
    // var img = (this._image = L.DomUtil.create(
    //     'img',
    //     'leaflet-image-layer ' +
    //     (this._zoomAnimated ? "leaflet-zoom-animated" : '') +
    //     (this.options.className || '')
    // ));

    var img = (this._image = jQuery(this._url).attr('class', 'leaflet-image-layer ' +
         (this._zoomAnimated ? "leaflet-zoom-animated" : '') +
         (this.options.className || '')
        ).get(0));

    img.onselectstart = falseFn;
    img.onmousemove = falseFn;

    // @event load: Event
    // Fired when the ImageOverlay layer has loaded its image
    img.onload = bind(this.fire, this, "load");
    img.onerror = bind(this._overlayOnError, this, "error");

    if (this.options.crossOrigin) {
      img.crossOrigin = '';
    }

    if (this.options.zIndex) {
      this._updateZIndex();
    }

    img.src = this._url;
    img.alt = this.options.alt;
  },

});

L.svgOverlay = function (url, bound, options) {
  return new L.SVGOverlay(url, bound, options);
};

// @function falseFn(): Function
// Returns a function which always returns `false`.
function falseFn() { return false; }

// @function bind(fn: Function, …): Function
// Returns a new function bound to the arguments passed, like [Function.prototype.bind](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Function/bind).
// Has a `L.bind()` shortcut.
function bind(fn, obj) {
  var slice = Array.prototype.slice;

  if (fn.bind) {
    return fn.bind.apply(fn, slice.call(arguments, 1));
  }

  var args = slice.call(arguments, 2);

  return function () {
    return fn.apply(obj, args.length ? args.concat(slice.call(arguments)) : arguments);
  };
}

// @factory L.latLngBounds(corner1: LatLng, corner2: LatLng)
// Creates a `LatLngBounds` object by defining two diagonally opposite corners of the rectangle.

// @alternative
// @factory L.latLngBounds(latlngs: LatLng[])
// Creates a `LatLngBounds` object defined by the geographical points it contains. Very useful for zooming the map to fit a particular set of locations with [`fitBounds`](#map-fitbounds).
function toLatLngBounds(a, b) {
	if (a instanceof L.LatLngBounds) {
		return a;
	}
	return new L.LatLngBounds(a, b);
}

/* End */
;
; /* Start:"a:4:{s:4:"full";s:109:"/local/templates/dombilet2.0/components/bitrix/catalog.element/.default/js/multiple-select.js?177375846634181";s:6:"source";s:93:"/local/templates/dombilet2.0/components/bitrix/catalog.element/.default/js/multiple-select.js";s:3:"min";s:0:"";s:3:"map";s:0:"";}"*/
/**
 * @author zhixin wen <wenzhixin2010@gmail.com>
 * @version 1.2.1
 *
 * http://wenzhixin.net.cn/p/multiple-select/
 */

(function ($) {

    'use strict';

    // it only does '%s', and return '' when arguments are undefined
    var sprintf = function (str) {
        var args = arguments,
            flag = true,
            i = 1;

        str = str.replace(/%s/g, function () {
            var arg = args[i++];

            if (typeof arg === 'undefined') {
                flag = false;
                return '';
            }
            return arg;
        });
        return flag ? str : '';
    };

    var removeDiacritics = function (str) {
        var defaultDiacriticsRemovalMap = [
            {'base':'A', 'letters':/[\u0041\u24B6\uFF21\u00C0\u00C1\u00C2\u1EA6\u1EA4\u1EAA\u1EA8\u00C3\u0100\u0102\u1EB0\u1EAE\u1EB4\u1EB2\u0226\u01E0\u00C4\u01DE\u1EA2\u00C5\u01FA\u01CD\u0200\u0202\u1EA0\u1EAC\u1EB6\u1E00\u0104\u023A\u2C6F]/g},
            {'base':'AA','letters':/[\uA732]/g},
            {'base':'AE','letters':/[\u00C6\u01FC\u01E2]/g},
            {'base':'AO','letters':/[\uA734]/g},
            {'base':'AU','letters':/[\uA736]/g},
            {'base':'AV','letters':/[\uA738\uA73A]/g},
            {'base':'AY','letters':/[\uA73C]/g},
            {'base':'B', 'letters':/[\u0042\u24B7\uFF22\u1E02\u1E04\u1E06\u0243\u0182\u0181]/g},
            {'base':'C', 'letters':/[\u0043\u24B8\uFF23\u0106\u0108\u010A\u010C\u00C7\u1E08\u0187\u023B\uA73E]/g},
            {'base':'D', 'letters':/[\u0044\u24B9\uFF24\u1E0A\u010E\u1E0C\u1E10\u1E12\u1E0E\u0110\u018B\u018A\u0189\uA779]/g},
            {'base':'DZ','letters':/[\u01F1\u01C4]/g},
            {'base':'Dz','letters':/[\u01F2\u01C5]/g},
            {'base':'E', 'letters':/[\u0045\u24BA\uFF25\u00C8\u00C9\u00CA\u1EC0\u1EBE\u1EC4\u1EC2\u1EBC\u0112\u1E14\u1E16\u0114\u0116\u00CB\u1EBA\u011A\u0204\u0206\u1EB8\u1EC6\u0228\u1E1C\u0118\u1E18\u1E1A\u0190\u018E]/g},
            {'base':'F', 'letters':/[\u0046\u24BB\uFF26\u1E1E\u0191\uA77B]/g},
            {'base':'G', 'letters':/[\u0047\u24BC\uFF27\u01F4\u011C\u1E20\u011E\u0120\u01E6\u0122\u01E4\u0193\uA7A0\uA77D\uA77E]/g},
            {'base':'H', 'letters':/[\u0048\u24BD\uFF28\u0124\u1E22\u1E26\u021E\u1E24\u1E28\u1E2A\u0126\u2C67\u2C75\uA78D]/g},
            {'base':'I', 'letters':/[\u0049\u24BE\uFF29\u00CC\u00CD\u00CE\u0128\u012A\u012C\u0130\u00CF\u1E2E\u1EC8\u01CF\u0208\u020A\u1ECA\u012E\u1E2C\u0197]/g},
            {'base':'J', 'letters':/[\u004A\u24BF\uFF2A\u0134\u0248]/g},
            {'base':'K', 'letters':/[\u004B\u24C0\uFF2B\u1E30\u01E8\u1E32\u0136\u1E34\u0198\u2C69\uA740\uA742\uA744\uA7A2]/g},
            {'base':'L', 'letters':/[\u004C\u24C1\uFF2C\u013F\u0139\u013D\u1E36\u1E38\u013B\u1E3C\u1E3A\u0141\u023D\u2C62\u2C60\uA748\uA746\uA780]/g},
            {'base':'LJ','letters':/[\u01C7]/g},
            {'base':'Lj','letters':/[\u01C8]/g},
            {'base':'M', 'letters':/[\u004D\u24C2\uFF2D\u1E3E\u1E40\u1E42\u2C6E\u019C]/g},
            {'base':'N', 'letters':/[\u004E\u24C3\uFF2E\u01F8\u0143\u00D1\u1E44\u0147\u1E46\u0145\u1E4A\u1E48\u0220\u019D\uA790\uA7A4]/g},
            {'base':'NJ','letters':/[\u01CA]/g},
            {'base':'Nj','letters':/[\u01CB]/g},
            {'base':'O', 'letters':/[\u004F\u24C4\uFF2F\u00D2\u00D3\u00D4\u1ED2\u1ED0\u1ED6\u1ED4\u00D5\u1E4C\u022C\u1E4E\u014C\u1E50\u1E52\u014E\u022E\u0230\u00D6\u022A\u1ECE\u0150\u01D1\u020C\u020E\u01A0\u1EDC\u1EDA\u1EE0\u1EDE\u1EE2\u1ECC\u1ED8\u01EA\u01EC\u00D8\u01FE\u0186\u019F\uA74A\uA74C]/g},
            {'base':'OI','letters':/[\u01A2]/g},
            {'base':'OO','letters':/[\uA74E]/g},
            {'base':'OU','letters':/[\u0222]/g},
            {'base':'P', 'letters':/[\u0050\u24C5\uFF30\u1E54\u1E56\u01A4\u2C63\uA750\uA752\uA754]/g},
            {'base':'Q', 'letters':/[\u0051\u24C6\uFF31\uA756\uA758\u024A]/g},
            {'base':'R', 'letters':/[\u0052\u24C7\uFF32\u0154\u1E58\u0158\u0210\u0212\u1E5A\u1E5C\u0156\u1E5E\u024C\u2C64\uA75A\uA7A6\uA782]/g},
            {'base':'S', 'letters':/[\u0053\u24C8\uFF33\u1E9E\u015A\u1E64\u015C\u1E60\u0160\u1E66\u1E62\u1E68\u0218\u015E\u2C7E\uA7A8\uA784]/g},
            {'base':'T', 'letters':/[\u0054\u24C9\uFF34\u1E6A\u0164\u1E6C\u021A\u0162\u1E70\u1E6E\u0166\u01AC\u01AE\u023E\uA786]/g},
            {'base':'TZ','letters':/[\uA728]/g},
            {'base':'U', 'letters':/[\u0055\u24CA\uFF35\u00D9\u00DA\u00DB\u0168\u1E78\u016A\u1E7A\u016C\u00DC\u01DB\u01D7\u01D5\u01D9\u1EE6\u016E\u0170\u01D3\u0214\u0216\u01AF\u1EEA\u1EE8\u1EEE\u1EEC\u1EF0\u1EE4\u1E72\u0172\u1E76\u1E74\u0244]/g},
            {'base':'V', 'letters':/[\u0056\u24CB\uFF36\u1E7C\u1E7E\u01B2\uA75E\u0245]/g},
            {'base':'VY','letters':/[\uA760]/g},
            {'base':'W', 'letters':/[\u0057\u24CC\uFF37\u1E80\u1E82\u0174\u1E86\u1E84\u1E88\u2C72]/g},
            {'base':'X', 'letters':/[\u0058\u24CD\uFF38\u1E8A\u1E8C]/g},
            {'base':'Y', 'letters':/[\u0059\u24CE\uFF39\u1EF2\u00DD\u0176\u1EF8\u0232\u1E8E\u0178\u1EF6\u1EF4\u01B3\u024E\u1EFE]/g},
            {'base':'Z', 'letters':/[\u005A\u24CF\uFF3A\u0179\u1E90\u017B\u017D\u1E92\u1E94\u01B5\u0224\u2C7F\u2C6B\uA762]/g},
            {'base':'a', 'letters':/[\u0061\u24D0\uFF41\u1E9A\u00E0\u00E1\u00E2\u1EA7\u1EA5\u1EAB\u1EA9\u00E3\u0101\u0103\u1EB1\u1EAF\u1EB5\u1EB3\u0227\u01E1\u00E4\u01DF\u1EA3\u00E5\u01FB\u01CE\u0201\u0203\u1EA1\u1EAD\u1EB7\u1E01\u0105\u2C65\u0250]/g},
            {'base':'aa','letters':/[\uA733]/g},
            {'base':'ae','letters':/[\u00E6\u01FD\u01E3]/g},
            {'base':'ao','letters':/[\uA735]/g},
            {'base':'au','letters':/[\uA737]/g},
            {'base':'av','letters':/[\uA739\uA73B]/g},
            {'base':'ay','letters':/[\uA73D]/g},
            {'base':'b', 'letters':/[\u0062\u24D1\uFF42\u1E03\u1E05\u1E07\u0180\u0183\u0253]/g},
            {'base':'c', 'letters':/[\u0063\u24D2\uFF43\u0107\u0109\u010B\u010D\u00E7\u1E09\u0188\u023C\uA73F\u2184]/g},
            {'base':'d', 'letters':/[\u0064\u24D3\uFF44\u1E0B\u010F\u1E0D\u1E11\u1E13\u1E0F\u0111\u018C\u0256\u0257\uA77A]/g},
            {'base':'dz','letters':/[\u01F3\u01C6]/g},
            {'base':'e', 'letters':/[\u0065\u24D4\uFF45\u00E8\u00E9\u00EA\u1EC1\u1EBF\u1EC5\u1EC3\u1EBD\u0113\u1E15\u1E17\u0115\u0117\u00EB\u1EBB\u011B\u0205\u0207\u1EB9\u1EC7\u0229\u1E1D\u0119\u1E19\u1E1B\u0247\u025B\u01DD]/g},
            {'base':'f', 'letters':/[\u0066\u24D5\uFF46\u1E1F\u0192\uA77C]/g},
            {'base':'g', 'letters':/[\u0067\u24D6\uFF47\u01F5\u011D\u1E21\u011F\u0121\u01E7\u0123\u01E5\u0260\uA7A1\u1D79\uA77F]/g},
            {'base':'h', 'letters':/[\u0068\u24D7\uFF48\u0125\u1E23\u1E27\u021F\u1E25\u1E29\u1E2B\u1E96\u0127\u2C68\u2C76\u0265]/g},
            {'base':'hv','letters':/[\u0195]/g},
            {'base':'i', 'letters':/[\u0069\u24D8\uFF49\u00EC\u00ED\u00EE\u0129\u012B\u012D\u00EF\u1E2F\u1EC9\u01D0\u0209\u020B\u1ECB\u012F\u1E2D\u0268\u0131]/g},
            {'base':'j', 'letters':/[\u006A\u24D9\uFF4A\u0135\u01F0\u0249]/g},
            {'base':'k', 'letters':/[\u006B\u24DA\uFF4B\u1E31\u01E9\u1E33\u0137\u1E35\u0199\u2C6A\uA741\uA743\uA745\uA7A3]/g},
            {'base':'l', 'letters':/[\u006C\u24DB\uFF4C\u0140\u013A\u013E\u1E37\u1E39\u013C\u1E3D\u1E3B\u017F\u0142\u019A\u026B\u2C61\uA749\uA781\uA747]/g},
            {'base':'lj','letters':/[\u01C9]/g},
            {'base':'m', 'letters':/[\u006D\u24DC\uFF4D\u1E3F\u1E41\u1E43\u0271\u026F]/g},
            {'base':'n', 'letters':/[\u006E\u24DD\uFF4E\u01F9\u0144\u00F1\u1E45\u0148\u1E47\u0146\u1E4B\u1E49\u019E\u0272\u0149\uA791\uA7A5]/g},
            {'base':'nj','letters':/[\u01CC]/g},
            {'base':'o', 'letters':/[\u006F\u24DE\uFF4F\u00F2\u00F3\u00F4\u1ED3\u1ED1\u1ED7\u1ED5\u00F5\u1E4D\u022D\u1E4F\u014D\u1E51\u1E53\u014F\u022F\u0231\u00F6\u022B\u1ECF\u0151\u01D2\u020D\u020F\u01A1\u1EDD\u1EDB\u1EE1\u1EDF\u1EE3\u1ECD\u1ED9\u01EB\u01ED\u00F8\u01FF\u0254\uA74B\uA74D\u0275]/g},
            {'base':'oi','letters':/[\u01A3]/g},
            {'base':'ou','letters':/[\u0223]/g},
            {'base':'oo','letters':/[\uA74F]/g},
            {'base':'p','letters':/[\u0070\u24DF\uFF50\u1E55\u1E57\u01A5\u1D7D\uA751\uA753\uA755]/g},
            {'base':'q','letters':/[\u0071\u24E0\uFF51\u024B\uA757\uA759]/g},
            {'base':'r','letters':/[\u0072\u24E1\uFF52\u0155\u1E59\u0159\u0211\u0213\u1E5B\u1E5D\u0157\u1E5F\u024D\u027D\uA75B\uA7A7\uA783]/g},
            {'base':'s','letters':/[\u0073\u24E2\uFF53\u00DF\u015B\u1E65\u015D\u1E61\u0161\u1E67\u1E63\u1E69\u0219\u015F\u023F\uA7A9\uA785\u1E9B]/g},
            {'base':'t','letters':/[\u0074\u24E3\uFF54\u1E6B\u1E97\u0165\u1E6D\u021B\u0163\u1E71\u1E6F\u0167\u01AD\u0288\u2C66\uA787]/g},
            {'base':'tz','letters':/[\uA729]/g},
            {'base':'u','letters':/[\u0075\u24E4\uFF55\u00F9\u00FA\u00FB\u0169\u1E79\u016B\u1E7B\u016D\u00FC\u01DC\u01D8\u01D6\u01DA\u1EE7\u016F\u0171\u01D4\u0215\u0217\u01B0\u1EEB\u1EE9\u1EEF\u1EED\u1EF1\u1EE5\u1E73\u0173\u1E77\u1E75\u0289]/g},
            {'base':'v','letters':/[\u0076\u24E5\uFF56\u1E7D\u1E7F\u028B\uA75F\u028C]/g},
            {'base':'vy','letters':/[\uA761]/g},
            {'base':'w','letters':/[\u0077\u24E6\uFF57\u1E81\u1E83\u0175\u1E87\u1E85\u1E98\u1E89\u2C73]/g},
            {'base':'x','letters':/[\u0078\u24E7\uFF58\u1E8B\u1E8D]/g},
            {'base':'y','letters':/[\u0079\u24E8\uFF59\u1EF3\u00FD\u0177\u1EF9\u0233\u1E8F\u00FF\u1EF7\u1E99\u1EF5\u01B4\u024F\u1EFF]/g},
            {'base':'z','letters':/[\u007A\u24E9\uFF5A\u017A\u1E91\u017C\u017E\u1E93\u1E95\u01B6\u0225\u0240\u2C6C\uA763]/g}
        ];

        for (var i = 0; i < defaultDiacriticsRemovalMap.length; i++) {
            str = str.replace(defaultDiacriticsRemovalMap[i].letters, defaultDiacriticsRemovalMap[i].base);
        }

        return str;

   };

    function MultipleSelect($el, options) {
        var that = this,
            name = $el.attr('name') || options.name || '';

        this.options = options;

        // hide select element
        this.$el = $el.hide();

        // label element
        this.$label = this.$el.closest('label');
        if (this.$label.length === 0 && this.$el.attr('id')) {
            this.$label = $(sprintf('label[for="%s"]', this.$el.attr('id').replace(/:/g, '\\:')));
        }

        // restore class and title from select element
        this.$parent = $(sprintf(
            '<div class="ms-parent %s" %s/>',
            $el.attr('class') || '',
            sprintf('title="%s"', $el.attr('title'))));

        // add placeholder to choice button
        this.$choice = $(sprintf([
                '<button type="button" class="ms-choice">',
                '<span class="placeholder">%s</span>',
                '<div></div>',
                '</button>'
            ].join(''),
            this.options.placeholder));

        // default position is bottom
        this.$drop = $(sprintf('<div class="ms-drop %s"%s></div>',
            this.options.position,
            sprintf(' style="width: %s"', this.options.dropWidth)));

        this.$el.after(this.$parent);
        this.$parent.append(this.$choice);
        this.$parent.append(this.$drop);

        if (this.$el.prop('disabled')) {
            this.$choice.addClass('disabled');
        }
        this.$parent.css('width',
            this.options.width ||
            this.$el.css('width') ||
            this.$el.outerWidth() + 20);

        this.selectAllName = 'data-name="selectAll' + name + '"';
        this.selectGroupName = 'data-name="selectGroup' + name + '"';
        this.selectItemName = 'data-name="selectItem' + name + '"';

        if (!this.options.keepOpen) {
            $(document).click(function (e) {
                if ($(e.target)[0] === that.$choice[0] ||
                    $(e.target).parents('.ms-choice')[0] === that.$choice[0]) {
                    return;
                }
                if (($(e.target)[0] === that.$drop[0] ||
                    $(e.target).parents('.ms-drop')[0] !== that.$drop[0] && e.target !== $el[0]) &&
                    that.options.isOpen) {
                    that.close();
                }
            });
        }
    }

    MultipleSelect.prototype = {
        constructor: MultipleSelect,

        init: function () {
            var that = this,
                $ul = $('<ul></ul>');

            this.$drop.html('');

            if (this.options.filter) {
                this.$drop.append([
                    '<div class="ms-search">',
                    '<input type="text" autocomplete="off" autocorrect="off" autocapitilize="off" spellcheck="false">',
                    '</div>'].join('')
                );
            }

            if (this.options.selectAll && !this.options.single) {
                $ul.append([
                    '<li class="ms-select-all">',
                    '<label>',
                    sprintf('<input type="checkbox" %s /> <span>', this.selectAllName),
                    this.options.selectAllText,
                    '</span><span class="stage__wrp"><span class="stage__check"></span></span></label>',
                    '</li>'
                ].join(''));
            }

            $.each(this.$el.children(), function (i, elm) {
                $ul.append(that.optionToHtml(i, elm));
            });
            $ul.append(sprintf('<li class="ms-no-results">%s</li>', this.options.noMatchesFound));
            this.$drop.append($ul);

            this.$drop.find('ul').css('max-height', this.options.maxHeight + 'px');
            this.$drop.find('.multiple').css('width', this.options.multipleWidth + 'px');

            this.$searchInput = this.$drop.find('.ms-search input');
            this.$selectAll = this.$drop.find('input[' + this.selectAllName + ']');
            this.$selectGroups = this.$drop.find('input[' + this.selectGroupName + ']');
            this.$selectItems = this.$drop.find('input[' + this.selectItemName + ']:enabled');
            this.$disableItems = this.$drop.find('input[' + this.selectItemName + ']:disabled');
            this.$noResults = this.$drop.find('.ms-no-results');

            this.events();
            this.updateSelectAll(true);
            this.update(true);

            if (this.options.isOpen) {
                this.open();
            }
        },

        optionToHtml: function (i, elm, group, groupDisabled) {
            var that = this,
                $elm = $(elm),
                classes = $elm.attr('class') || '',
                title = sprintf('title="%s"', $elm.attr('title')),
                multiple = this.options.multiple ? 'multiple' : '',
                disabled,
                type = this.options.single ? 'radio' : 'checkbox';

            if ($elm.is('option')) {
                var value = $elm.val(),
                    text = that.options.textTemplate($elm),
                    selected = $elm.prop('selected'),
                    style = sprintf('style="%s"', this.options.styler(value)),
                    $el;

                disabled = groupDisabled || $elm.prop('disabled');

                $el = $([
                    sprintf('<li class="%s %s" %s %s>', multiple, classes, title, style),
                    sprintf('<label class="%s">', disabled ? 'disabled' : ''),
                    sprintf('<input type="%s" %s%s%s%s>',
                        type, this.selectItemName,
                        selected ? ' checked="checked"' : '',
                        disabled ? ' disabled="disabled"' : '',
                        sprintf(' data-group="%s"', group)),
                    sprintf('<span>%s</span><span class="stage__wrp"><span class="stage__check"></span></span>', text),
                    '</label>',
                    '</li>'
                ].join(''));
                $el.find('input').val(value);
                return $el;
            }
            if ($elm.is('optgroup')) {
                var label = that.options.labelTemplate($elm),
                    $group = $('<div/>');

                group = 'group_' + i;
                disabled = $elm.prop('disabled');

                $group.append([
                    '<li class="group">',
                    sprintf('<label class="optgroup %s" data-group="%s">', disabled ? 'disabled' : '', group),
                    this.options.hideOptgroupCheckboxes || this.options.single ? '' :
                        sprintf('<input type="checkbox" %s %s>',
                        this.selectGroupName, disabled ? 'disabled="disabled"' : ''),
                    label,
                    '</label>',
                    '</li>'
                ].join(''));

                $.each($elm.children(), function (i, elm) {
                    $group.append(that.optionToHtml(i, elm, group, disabled));
                });
                return $group.html();
            }
        },

        events: function () {
            var that = this,
                toggleOpen = function (e) {
                    e.preventDefault();
                    that[that.options.isOpen ? 'close' : 'open']();
                };

            if (this.$label) {
                this.$label.off('click').on('click', function (e) {
                    if (e.target.nodeName.toLowerCase() !== 'label' || e.target !== this) {
                        return;
                    }
                    toggleOpen(e);
                    if (!that.options.filter || !that.options.isOpen) {
                        that.focus();
                    }
                    e.stopPropagation(); // Causes lost focus otherwise
                });
            }

            this.$choice.off('click').on('click', toggleOpen)
                .off('focus').on('focus', this.options.onFocus)
                .off('blur').on('blur', this.options.onBlur);

            this.$parent.off('keydown').on('keydown', function (e) {
                switch (e.which) {
                    case 27: // esc key
                        that.close();
                        that.$choice.focus();
                        break;
                }
            });

            this.$searchInput.off('keydown').on('keydown',function (e) {
                // Ensure shift-tab causes lost focus from filter as with clicking away
                if (e.keyCode === 9 && e.shiftKey) {
                    that.close();
                }
            }).off('keyup').on('keyup', function (e) {
                // enter or space
                // Avoid selecting/deselecting if no choices made
                if (that.options.filterAcceptOnEnter && (e.which === 13 || e.which == 32) && that.$searchInput.val()) {
                    that.$selectAll.click();
                    that.close();
                    that.focus();
                    return;
                }
                that.filter();
            });

            this.$selectAll.off('click').on('click', function () {
                var checked = $(this).prop('checked'),
                    $items = that.$selectItems.filter(':visible');

                if ($items.length === that.$selectItems.length) {
                    that[checked ? 'checkAll' : 'uncheckAll']();
                } else { // when the filter option is true
                    that.$selectGroups.prop('checked', checked);
                    $items.prop('checked', checked);
                    that.options[checked ? 'onCheckAll' : 'onUncheckAll']();
                    that.update();
                }
            });
            this.$selectGroups.off('click').on('click', function () {
                var group = $(this).parent().attr('data-group'),
                    $items = that.$selectItems.filter(':visible'),
                    $children = $items.filter(sprintf('[data-group="%s"]', group)),
                    checked = $children.length !== $children.filter(':checked').length;

                $children.prop('checked', checked);
                that.updateSelectAll();
                that.update();
                that.options.onOptgroupClick({
                    label: $(this).parent().text(),
                    checked: checked,
                    children: $children.get(),
                    instance: that
                });
            });
            this.$selectItems.off('click').on('click', function () {
                that.updateSelectAll();
                that.update();
                that.updateOptGroupSelect();
                that.options.onClick({
                    label: $(this).parent().text(),
                    value: $(this).val(),
                    checked: $(this).prop('checked'),
                    instance: that
                });

                if (that.options.single && that.options.isOpen && !that.options.keepOpen) {
                    that.close();
                }

                if (that.options.single) {
                    var clickedVal = $(this).val();
                    that.$selectItems.filter(function() {
                        return $(this).val() !== clickedVal;
                    }).each(function() {
                        $(this).prop('checked', false);
                    });
                    that.update();
                }
            });
        },

        open: function () {
            if (this.$choice.hasClass('disabled')) {
                return;
            }
            this.options.isOpen = true;
            this.$choice.find('>div').addClass('open');
            this.$drop[this.animateMethod('show')]();

            // fix filter bug: no results show
            this.$selectAll.parent().show();
            this.$noResults.hide();

            // Fix #77: 'All selected' when no options
            if (!this.$el.children().length) {
                this.$selectAll.parent().hide();
                this.$noResults.show();
            }

            if (this.options.container) {
                var offset = this.$drop.offset();
                this.$drop.appendTo($(this.options.container));
                this.$drop.offset({
                    top: offset.top,
                    left: offset.left
                });
            }

            if (this.options.filter) {
                this.$searchInput.val('');
                this.$searchInput.focus();
                this.filter();
            }
            this.options.onOpen();
        },

        close: function () {
            this.options.isOpen = false;
            this.$choice.find('>div').removeClass('open');
            this.$drop[this.animateMethod('hide')]();
            if (this.options.container) {
                this.$parent.append(this.$drop);
                this.$drop.css({
                    'top': 'auto',
                    'left': 'auto'
                });
            }
            this.options.onClose();
        },

        animateMethod: function (method) {
            var methods = {
                show: {
                    fade: 'fadeIn',
                    slide: 'slideDown'
                },
                hide: {
                    fade: 'fadeOut',
                    slide: 'slideUp'
                }
            };

            return methods[method][this.options.animate] || method;
        },

        update: function (isInit) {
            var selects = this.options.displayValues ? this.getSelects() : this.getSelects('text'),
                $span = this.$choice.find('>span'),
                sl = selects.length;

            if (sl === 0) {
                $span.addClass('placeholder').html(this.options.placeholder);
            } else if (this.options.allSelected && sl === this.$selectItems.length + this.$disableItems.length) {
                $span.removeClass('placeholder').html(this.options.allSelected);
            } else if (this.options.ellipsis && sl > this.options.minimumCountSelected) {
                $span.removeClass('placeholder').text(selects.slice(0, this.options.minimumCountSelected)
                    .join(this.options.delimiter) + '...');
            } else if (this.options.countSelected && sl > this.options.minimumCountSelected) {
                $span.removeClass('placeholder').html(this.options.countSelected
                    .replace('#', selects.length)
                    .replace('%', this.$selectItems.length + this.$disableItems.length));
            } else {
                $span.removeClass('placeholder').text(selects.join(this.options.delimiter));
            }

            if (this.options.addTitle) {
                $span.prop('title', this.getSelects('text'));
            }

            // set selects to select
            this.$el.val(this.getSelects()).trigger('change');

            // add selected class to selected li
            this.$drop.find('li').removeClass('selected');
            this.$drop.find('input:checked').each(function () {
                $(this).parents('li').first().addClass('selected');
            });

            // trigger <select> change event
            if (!isInit) {
                this.$el.trigger('change');
            }
        },

        updateSelectAll: function (isInit) {
            var $items = this.$selectItems;

            if (!isInit) {
                $items = $items.filter(':visible');
            }
            this.$selectAll.prop('checked', $items.length &&
                $items.length === $items.filter(':checked').length);
            if (!isInit && this.$selectAll.prop('checked')) {
                this.options.onCheckAll();
            }
        },

        updateOptGroupSelect: function () {
            var $items = this.$selectItems.filter(':visible');
            $.each(this.$selectGroups, function (i, val) {
                var group = $(val).parent().attr('data-group'),
                    $children = $items.filter(sprintf('[data-group="%s"]', group));
                $(val).prop('checked', $children.length &&
                    $children.length === $children.filter(':checked').length);
            });
        },

        //value or text, default: 'value'
        getSelects: function (type) {
            var that = this,
                texts = [],
                values = [];
            this.$drop.find(sprintf('input[%s]:checked', this.selectItemName)).each(function () {
                texts.push($(this).parents('li').first().text());
                values.push($(this).val());
            });

            if (type === 'text' && this.$selectGroups.length) {
                texts = [];
                this.$selectGroups.each(function () {
                    var html = [],
                        text = $.trim($(this).parent().text()),
                        group = $(this).parent().data('group'),
                        $children = that.$drop.find(sprintf('[%s][data-group="%s"]', that.selectItemName, group)),
                        $selected = $children.filter(':checked');

                    if (!$selected.length) {
                        return;
                    }

                    html.push('[');
                    html.push(text);
                    if ($children.length > $selected.length) {
                        var list = [];
                        $selected.each(function () {
                            list.push($(this).parent().text());
                        });
                        html.push(': ' + list.join(', '));
                    }
                    html.push(']');
                    texts.push(html.join(''));
                });
            }
            return type === 'text' ? texts : values;
        },

        setSelects: function (values) {
            var that = this;
            this.$selectItems.prop('checked', false);
            this.$disableItems.prop('checked', false);
            $.each(values, function (i, value) {
                that.$selectItems.filter(sprintf('[value="%s"]', value)).prop('checked', true);
                that.$disableItems.filter(sprintf('[value="%s"]', value)).prop('checked', true);
            });
            this.$selectAll.prop('checked', this.$selectItems.length ===
                this.$selectItems.filter(':checked').length + this.$disableItems.filter(':checked').length);

            $.each(that.$selectGroups, function (i, val) {
                var group = $(val).parent().attr('data-group'),
                    $children = that.$selectItems.filter('[data-group="' + group + '"]');
                $(val).prop('checked', $children.length &&
                    $children.length === $children.filter(':checked').length);
            });

            this.update();
        },

        enable: function () {
            this.$choice.removeClass('disabled');
        },

        disable: function () {
            this.$choice.addClass('disabled');
        },

        checkAll: function () {
            this.$selectItems.prop('checked', true);
            this.$selectGroups.prop('checked', true);
            this.$selectAll.prop('checked', true);
            this.update();
            this.options.onCheckAll();
        },

        uncheckAll: function () {
            this.$selectItems.prop('checked', false);
            this.$selectGroups.prop('checked', false);
            this.$selectAll.prop('checked', false);
            this.update();
            this.options.onUncheckAll();
        },

        focus: function () {
            this.$choice.focus();
            this.options.onFocus();
        },

        blur: function () {
            this.$choice.blur();
            this.options.onBlur();
        },

        refresh: function () {
            this.init();
        },

        filter: function () {
            var that = this,
                text = $.trim(this.$searchInput.val()).toLowerCase();

            if (text.length === 0) {
                this.$selectAll.parent().show();
                this.$selectItems.parent().show();
                this.$disableItems.parent().show();
                this.$selectGroups.parent().show();
                this.$noResults.hide();
            } else {
                this.$selectItems.each(function () {
                    var $parent = $(this).parent();
                    $parent[removeDiacritics($parent.text().toLowerCase()).indexOf(removeDiacritics(text)) < 0 ? 'hide' : 'show']();
                });
                this.$disableItems.parent().hide();
                this.$selectGroups.each(function () {
                    var $parent = $(this).parent();
                    var group = $parent.attr('data-group'),
                        $items = that.$selectItems.filter(':visible');
                    $parent[$items.filter(sprintf('[data-group="%s"]', group)).length ? 'show' : 'hide']();
                });

                //Check if no matches found
                if (this.$selectItems.parent().filter(':visible').length) {
                    this.$selectAll.parent().show();
                    this.$noResults.hide();
                } else {
                    this.$selectAll.parent().hide();
                    this.$noResults.show();
                }
            }
            this.updateOptGroupSelect();
            this.updateSelectAll();
            this.options.onFilter(text);
        }
    };

    $.fn.multipleSelect = function () {
        var option = arguments[0],
            args = arguments,

            value,
            allowedMethods = [
                'getSelects', 'setSelects',
                'enable', 'disable',
                'open', 'close',
                'checkAll', 'uncheckAll',
                'focus', 'blur',
                'refresh', 'close'
            ];

        this.each(function () {
            var $this = $(this),
                data = $this.data('multipleSelect'),
                options = $.extend({}, $.fn.multipleSelect.defaults,
                    $this.data(), typeof option === 'object' && option);

            if (!data) {
                data = new MultipleSelect($this, options);
                $this.data('multipleSelect', data);
            }

            if (typeof option === 'string') {
                if ($.inArray(option, allowedMethods) < 0) {
                    throw 'Unknown method: ' + option;
                }
                value = data[option](args[1]);
            } else {
                data.init();
                if (args[1]) {
                    value = data[args[1]].apply(data, [].slice.call(args, 2));
                }
            }
        });

        return typeof value !== 'undefined' ? value : this;
    };

    $.fn.multipleSelect.defaults = {
        name: '',
        isOpen: false,
        placeholder: '',
        selectAll: true,
        selectAllDelimiter: ['[', ']'],
        minimumCountSelected: 3,
        ellipsis: false,
        multiple: false,
        multipleWidth: 80,
        single: false,
        filter: false,
        width: undefined,
        dropWidth: undefined,
        maxHeight: 250,
        container: null,
        position: 'bottom',
        keepOpen: false,
        animate: 'none', // 'none', 'fade', 'slide'
        displayValues: false,
        delimiter: ', ',
        addTitle: false,
        filterAcceptOnEnter: false,
        hideOptgroupCheckboxes: false,

        selectAllText: 'Select all',
        allSelected: 'All selected',
        countSelected: '# of % selected',
        noMatchesFound: 'No matches found',

        styler: function () {
            return false;
        },
        textTemplate: function ($elm) {
            return $elm.html();
        },
        labelTemplate: function ($elm) {
            return $elm.attr('label');
        },

        onOpen: function () {
            return false;
        },
        onClose: function () {
            return false;
        },
        onCheckAll: function () {
            return false;
        },
        onUncheckAll: function () {
            return false;
        },
        onFocus: function () {
            return false;
        },
        onBlur: function () {
            return false;
        },
        onOptgroupClick: function () {
            return false;
        },
        onClick: function () {
            return false;
        },
        onFilter: function () {
            return false;
        }
    };
})(jQuery);
/* End */
;
; /* Start:"a:4:{s:4:"full";s:97:"/local/templates/dombilet2.0/components/bitrix/catalog.element/.default/js/csrf.js?17737584662050";s:6:"source";s:82:"/local/templates/dombilet2.0/components/bitrix/catalog.element/.default/js/csrf.js";s:3:"min";s:0:"";s:3:"map";s:0:"";}"*/
jQuery(document).ready(function($){
    function getCookie(name) {
        var cookieValue = null;
        if (document.cookie && document.cookie != '') {
            var cookies = document.cookie.split(';');
            for (var i = 0; i < cookies.length; i++) {
                var cookie = jQuery.trim(cookies[i]);
                // Does this cookie string begin with the name we want?
                if (cookie.substring(0, name.length + 1) == (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
    //var csrftoken = getCookie('csrftoken');
    
    function csrfSafeMethod(method) {
        // these HTTP methods do not require CSRF protection
        return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
    }
    function sameOrigin(url) {
        // test that a given url is a same-origin URL
        // url could be relative or scheme relative or absolute
        var host = document.location.host; // host + port
        var protocol = document.location.protocol;
        var sr_origin = '//' + host;
        var origin = protocol + sr_origin;
        // Allow absolute or scheme relative URLs to same origin
        return (url == origin || url.slice(0, origin.length + 1) == origin + '/') ||
            (url == sr_origin || url.slice(0, sr_origin.length + 1) == sr_origin + '/') ||
            // or any other URL that isn't scheme relative or absolute i.e relative.
            !(/^(\/\/|http:|https:).*/.test(url));
    }
    /*$.ajaxSetup({
        beforeSend: function(xhr, settings) {
            if (!csrfSafeMethod(settings.type) && sameOrigin(settings.url)) {
                // Send the token to same-origin, relative URLs only.
                // Send the token only if the method warrants CSRF protection
                // Using the CSRFToken value acquired earlier
                xhr.setRequestHeader("X-CSRFToken", csrftoken);
            }
        }
    });*/
});
/* End */
;
; /* Start:"a:4:{s:4:"full";s:108:"/local/templates/dombilet2.0/components/bitrix/catalog.element/.default/js/SmoothWheelZoom.js?17737584663498";s:6:"source";s:93:"/local/templates/dombilet2.0/components/bitrix/catalog.element/.default/js/SmoothWheelZoom.js";s:3:"min";s:0:"";s:3:"map";s:0:"";}"*/

L.Map.mergeOptions({
    // @section Mousewheel options
    // @option smoothWheelZoom: Boolean|String = true
    // Whether the map can be zoomed by using the mouse wheel. If passed `'center'`,
    // it will zoom to the center of the view regardless of where the mouse was.
    smoothWheelZoom: true,

    // @option smoothWheelZoom: number = 1
    // setting zoom speed
    smoothSensitivity:1

});


L.Map.SmoothWheelZoom = L.Handler.extend({

    addHooks: function () {
        L.DomEvent.on(this._map._container, 'wheel', this._onWheelScroll, this);
    },

    removeHooks: function () {
        L.DomEvent.off(this._map._container, 'wheel', this._onWheelScroll, this);
    },

    _onWheelScroll: function (e) {
        if (!this._isWheeling) {
            this._onWheelStart(e);
        }
        this._onWheeling(e);
    },

    _onWheelStart: function (e) {
        var map = this._map;
        this._isWheeling = true;
        this._wheelMousePosition = map.mouseEventToContainerPoint(e);
        this._centerPoint = map.getSize()._divideBy(2);
        this._startLatLng = map.containerPointToLatLng(this._centerPoint);
        this._wheelStartLatLng = map.containerPointToLatLng(this._wheelMousePosition);
        this._startZoom = map.getZoom();
        this._moved = false;
        this._zooming = true;

        map._stop();
        if (map._panAnim) map._panAnim.stop();

        this._goalZoom = map.getZoom();
        this._prevCenter = map.getCenter();
        this._prevZoom = map.getZoom();

        this._zoomAnimationId = requestAnimationFrame(this._updateWheelZoom.bind(this));
    },

    _onWheeling: function (e) {
        var map = this._map;

        this._goalZoom = this._goalZoom + L.DomEvent.getWheelDelta(e) * 0.003 * map.options.smoothSensitivity;
        if (this._goalZoom < map.getMinZoom() || this._goalZoom > map.getMaxZoom()) {
            this._goalZoom = map._limitZoom(this._goalZoom);
        }
        this._wheelMousePosition = this._map.mouseEventToContainerPoint(e);

        clearTimeout(this._timeoutId);
        this._timeoutId = setTimeout(this._onWheelEnd.bind(this), 200);

        L.DomEvent.preventDefault(e);
        L.DomEvent.stopPropagation(e);
    },

    _onWheelEnd: function (e) {
        this._isWheeling = false;
        cancelAnimationFrame(this._zoomAnimationId);
        this._map._moveEnd(true);
    },

    _updateWheelZoom: function () {
        var map = this._map;

        if ((!map.getCenter().equals(this._prevCenter)) || map.getZoom() != this._prevZoom)
            return;

        this._zoom = map.getZoom() + (this._goalZoom - map.getZoom()) * 0.3;
        this._zoom = Math.floor(this._zoom * 100) / 100;

        var delta = this._wheelMousePosition.subtract(this._centerPoint);
        if (delta.x === 0 && delta.y === 0)
            return;

        if (map.options.smoothWheelZoom === 'center') {
            this._center = this._startLatLng;
        } else {
            this._center = map.unproject(map.project(this._wheelStartLatLng, this._zoom).subtract(delta), this._zoom);
        }

        if (!this._moved) {
            map._moveStart(true, false);
            this._moved = true;
        }

        map._move(this._center, this._zoom);
        this._prevCenter = map.getCenter();
        this._prevZoom = map.getZoom();

        this._zoomAnimationId = requestAnimationFrame(this._updateWheelZoom.bind(this));
    }

});

L.Map.addInitHook('addHandler', 'smoothWheelZoom', L.Map.SmoothWheelZoom );
/* End */
;
; /* Start:"a:4:{s:4:"full";s:110:"/local/templates/dombilet2.0/components/bitrix/catalog.element/.default/js/jquery.sticky-kit.js?17737584662797";s:6:"source";s:95:"/local/templates/dombilet2.0/components/bitrix/catalog.element/.default/js/jquery.sticky-kit.js";s:3:"min";s:0:"";s:3:"map";s:0:"";}"*/
/*
 Sticky-kit v1.1.2 | WTFPL | Leaf Corcoran 2015 | http://leafo.net
*/
(function(){var b,f;b=this.jQuery||window.jQuery;f=b(window);b.fn.stick_in_parent=function(d){var A,w,J,n,B,K,p,q,k,E,t;null==d&&(d={});t=d.sticky_class;B=d.inner_scrolling;E=d.recalc_every;k=d.parent;q=d.offset_top;p=d.spacer;w=d.bottoming;null==q&&(q=0);null==k&&(k=void 0);null==B&&(B=!0);null==t&&(t="is_stuck");A=b(document);null==w&&(w=!0);J=function(a,d,n,C,F,u,r,G){var v,H,m,D,I,c,g,x,y,z,h,l;if(!a.data("sticky_kit")){a.data("sticky_kit",!0);I=A.height();g=a.parent();null!=k&&(g=g.closest(k));
if(!g.length)throw"failed to find stick parent";v=m=!1;(h=null!=p?p&&a.closest(p):b("<div />"))&&h.css("position",a.css("position"));x=function(){var c,f,e;if(!G&&(I=A.height(),c=parseInt(g.css("border-top-width"),10),f=parseInt(g.css("padding-top"),10),d=parseInt(g.css("padding-bottom"),10),n=g.offset().top+c+f,C=g.height(),m&&(v=m=!1,null==p&&(a.insertAfter(h),h.detach()),a.css({position:"",top:"",width:"",bottom:""}).removeClass(t),e=!0),F=a.offset().top-(parseInt(a.css("margin-top"),10)||0)-q,
u=a.outerHeight(!0),r=a.css("float"),h&&h.css({width:a.outerWidth(!0),height:u,display:a.css("display"),"vertical-align":a.css("vertical-align"),"float":r}),e))return l()};x();if(u!==C)return D=void 0,c=q,z=E,l=function(){var b,l,e,k;if(!G&&(e=!1,null!=z&&(--z,0>=z&&(z=E,x(),e=!0)),e||A.height()===I||x(),e=f.scrollTop(),null!=D&&(l=e-D),D=e,m?(w&&(k=e+u+c>C+n,v&&!k&&(v=!1,a.css({position:"fixed",bottom:"",top:c}).trigger("sticky_kit:unbottom"))),e<F&&(m=!1,c=q,null==p&&("left"!==r&&"right"!==r||a.insertAfter(h),
h.detach()),b={position:"",width:"",top:""},a.css(b).removeClass(t).trigger("sticky_kit:unstick")),B&&(b=f.height(),u+q>b&&!v&&(c-=l,c=Math.max(b-u,c),c=Math.min(q,c),m&&a.css({top:c+"px"})))):e>F&&(m=!0,b={position:"fixed",top:c},b.width="border-box"===a.css("box-sizing")?a.outerWidth()+"px":a.width()+"px",a.css(b).addClass(t),null==p&&(a.after(h),"left"!==r&&"right"!==r||h.append(a)),a.trigger("sticky_kit:stick")),m&&w&&(null==k&&(k=e+u+c>C+n),!v&&k)))return v=!0,"static"===g.css("position")&&g.css({position:"relative"}),
a.css({position:"absolute",bottom:d,top:"auto"}).trigger("sticky_kit:bottom")},y=function(){x();return l()},H=function(){G=!0;f.off("touchmove",l);f.off("scroll",l);f.off("resize",y);b(document.body).off("sticky_kit:recalc",y);a.off("sticky_kit:detach",H);a.removeData("sticky_kit");a.css({position:"",bottom:"",top:"",width:""});g.position("position","");if(m)return null==p&&("left"!==r&&"right"!==r||a.insertAfter(h),h.remove()),a.removeClass(t)},f.on("touchmove",l),f.on("scroll",l),f.on("resize",
y),b(document.body).on("sticky_kit:recalc",y),a.on("sticky_kit:detach",H),setTimeout(l,0)}};n=0;for(K=this.length;n<K;n++)d=this[n],J(b(d));return this}}).call(this);
/* End */
;
; /* Start:"a:4:{s:4:"full";s:108:"/local/templates/dombilet2.0/components/bitrix/catalog.element/.default/js/init_interface.js?178844396235997";s:6:"source";s:92:"/local/templates/dombilet2.0/components/bitrix/catalog.element/.default/js/init_interface.js";s:3:"min";s:0:"";s:3:"map";s:0:"";}"*/
console.log("init_interface");
var isVip = false;

function declOfNum(number, titles) {
    var cases = [2, 0, 1, 1, 1, 2];

    return titles[(number % 100 > 4 && number % 100 < 20) ? 2 : cases[(number % 10 < 5) ? number % 10 : 5]];
}
function formatName(name){
    name = name.toString();
    if (name.indexOf("Ложа ") > -1 ||
        name.indexOf("Партер") > -1 ||
        name.indexOf("Трибуна ") > -1 ||
        name.indexOf("Танцпол") > -1 ||
        name.indexOf("Фанзона") > -1 ||
        name.indexOf("сектор") > 0
    ){
        return name
    }
    if (name.indexOf("Сектор ") > -1){
        name = name.replace(/Сектор /g, '')
    }
    if (("" + name).includes(","))
        return "Сектора " + name
    return "Сектор " + name
}
function formatNameSector(name){
    name = name.toString();
    return name.replace(/Сектор /g, '')
}

// Сокращает наименование секторов в корзине до того, как Битрикс сократит его в БД..
function formatGroupProductName(eventName, sectorText, dateSuffix, maxLength = 255) {
    const fullName = eventName + " " + sectorText + dateSuffix;
    if (fullName.length <= maxLength) {
        return fullName;
    }

    const separatorPosition = sectorText.indexOf(": ");
    if (separatorPosition === -1) {
        return fullName.slice(0, maxLength);
    }

    const sectorLabel = sectorText.slice(0, separatorPosition + 2);
    const sectors = sectorText
        .slice(separatorPosition + 2)
        .split(",")
        .map(sector => sector.trim())
        .filter(Boolean);

    if (sectors.length < 2) {
        return fullName.slice(0, maxLength);
    }

    const lastSector = sectors[sectors.length - 1];
    const prefix = eventName + " " + sectorLabel;
    const suffix = "..., " + lastSector + dateSuffix;
    const availableLength = maxLength - prefix.length - suffix.length - 2;
    const visibleSectors = [];

    for (let index = 0; index < sectors.length - 1; index++) {
        const candidate = visibleSectors.concat(sectors[index]).join(", ");
        if (candidate.length > availableLength) {
            break;
        }
        visibleSectors.push(sectors[index]);
    }

    return prefix + (visibleSectors.length ? visibleSectors.join(", ") + ", " : "") + suffix;
}
function load_sector_orange(close = false){
    if (close){
        $(".stadium-svg").removeClass("modal--mobile_hide")
        $(".map-header").removeClass("modal--mobile_hide")
        $(".text-under-map").removeClass("modal--mobile_hide")
        $(".modal__event-info").removeClass("modal--mobile_hide")
        $(".sector_popup__close").appendTo(".sector_popup__name--wrap");
    }else {
        $(".stadium-svg").addClass("modal--mobile_hide")
        $(".map-header").addClass("modal--mobile_hide")
        $(".text-under-map").addClass("modal--mobile_hide")
        $(".modal__event-info").addClass("modal--mobile_hide")
        $(".sector_popup__close").prependTo(".modal-mobile__modal-header");
    }
}

function init_scheme() {
    var siteTheme = $(".map").attr("data-theme");

    if ($('#map > svg').length) {
        let isOpenScheme = parseInt($(".map").attr("data-open-scheme"));
        let mapParams = {
            crs: L.CRS.Simple,
            zoom: 1,
            minZoom: 0,
            maxZoom: 4,
            dragging: false,
            scrollWheelZoom: false,
            smoothWheelZoom: false
        }
        if (isOpenScheme){
            mapParams['smoothWheelZoom'] = true;
            mapParams['smoothSensitivity'] = 1;
        }
        window.map = L.map('map', mapParams);

        window.map.on('zoomend', function() {
            if (window.map.getZoom() > 0){
                window.map.dragging.enable();
            }
            if (window.map.getZoom() === 0){
                window.map.dragging.disable();
            }

        });
        let widthBlock = $('#map').width();
        let heightBlock = $('#map').height();

        var width = (widthBlock * 1),
            height = Math.min($(window).height() - 300, heightBlock);

        var dafaultMapHeight = siteTheme === 'orange' ? 300 : 350;
        var dafaultMapWrapperHeight = 100;
        if ($(window).width()<= 860){
            height  = Math.min(height, dafaultMapHeight) + 50;
            dafaultMapWrapperHeight = siteTheme === 'orange' ? 50 : dafaultMapWrapperHeight;
        }

        $('#map').css('height', height + dafaultMapWrapperHeight + 'px');

        L.svgOverlay(
            '#map > svg',
            [[0, 0], [(height), (width)]]
        ).addTo(map);

        map.fitBounds([[0, 0], [(height + 50), (width)]]);
        map.setMaxBounds([[0, 0], [(height + 50), (width)]]);

        var $svg = $('.leaflet-overlay-pane').find('svg'),
            $mapPane = $('.leaflet-map-pane');

        $mapPane.css('will-change', 'transform');
        $svg.css('will-change', 'transform')
    }
}

$(document).ready(function () {
    if ($('#map').length)
        init_scheme();

    let $motivationShow = $('.map__condition-scheme'),
        counterMotivationShow = 0;

    if ($motivationShow.length > 0)
        $(window).scroll(function () {

            var scroll = $(window).scrollTop() + $(window).height();
            //Если скролл до конца елемента
            var offset = $('.right-motivation:not(.mobile)').offset()?.top - 100;
            //Если скролл до начала елемента

            if(offset <= 0){
                offset = $('.right-motivation.mobile').offset().top - 150;
            }

            if (scroll > offset && counterMotivationShow == 0) {


                counterMotivationShow = 1;

                setTimeout(() => {
                    $('.motivation-show.mt-auto').addClass('show');
                    $('.motivation-show.mt-auto').show();
                    setTimeout(() => {
                        $('.motivation-show.mt-auto').hide();
                    }, 15000);
                }, 10000);

                setTimeout(() => {
                    if(!$('.right-motivation:not(.mobile)').hasClass('closeOne')){
                        $('.right-motivation:not(.mobile) .close').addClass('hidden');
                        $('.right-motivation:not(.mobile)').addClass('closeOne');
                        $('.right-motivation:not(.mobile) .event-info-block').addClass('hidden-text');
                    }
                }, 25000);

                setTimeout(() => {
                    if(!$('.right-motivation.mobile').hasClass('closeOne')){
                        $('.right-motivation.mobile').addClass('closeOne');
                        $('[data-target]').removeClass('hidden');
                        $('[data-magnet]').addClass('hidden');
                    }
                    elWidthPixcel();
                }, 25000);
            }
        });

    var eventInfo = $('.js-event-info-block');
    if (eventInfo.length > 0 && $(window).width() <= 768) {
        var scrollStart = $(window).scrollTop() + $(window).height();
        var offsetStart = $('.right-motivation').offset().top + 100;

        if (scrollStart > offsetStart) {
            eventInfo.delay(4700).animate({
                'opacity': '0',
            }, 500, function () {
                eventInfo.css('display', 'none');
            });
        }

        $(window).scroll(function () {
            var scroll = $(window).scrollTop() + $(window).height();
            //Если скролл до конца елемента
            var offset = $('.right-motivation').offset().top + 100;
            //Если скролл до начала елемента
            if (scroll > offset) {

                eventInfo.delay(4700).animate({
                    'opacity': '0',
                }, 500, function () {
                    eventInfo.css('display', 'none');
                });
            }
        });
    }

    $('.right-motivation').on('click','.close', function(){
        if($(this).hasClass('mobile')){
            let motivation = $('.right-motivation.mobile');
            let top_icons = $('.right-motivation.mobile .top-icons');
            let middle_icons = $('.right-motivation.mobile .middle-icons');

            top_icons.find('.event-info-block').removeClass('hidden');
            middle_icons.find('.event-info-block').addClass('hidden');
        }else{
            let motivation = $('.right-motivation:not(.mobile)');
            $(this).addClass('hidden');
            $('.right-motivation:not(.mobile) .event-info-block').addClass('hidden-text');
            if(!$('.right-motivation:not(.mobile)').hasClass('closeOne')){
                $('.right-motivation:not(.mobile)').addClass('closeOne');
            }
            motivation.find('.event-info-block').addClass('hidden-text');
        }
    });

    $('.right-motivation').on('click','.hidden-text', function(){
        $('.close').removeClass('hidden');
        $(this).removeClass('hidden-text');
    });

    $('[data-target]').on('click', function(){
        $(this).addClass('hidden');
        $('[data-magnet="'+$(this).attr('data-target')+'"]').removeClass('hidden');
        elWidthPixcel();
    });

    $('[data-magnet]').on('click', function(){
        $('[data-target="'+$(this).attr('data-magnet')+'"]').removeClass('hidden');
        $('[data-magnet="'+$(this).attr('data-magnet')+'"]').addClass('hidden');
        if(!$('.right-motivation.mobile').hasClass('closeOne')){
            $('.right-motivation.mobile').addClass('closeOne');
        }
        elWidthPixcel();
    });

    $('.bottuns-above-scheme__to-drop-list').click(function () {
        $(this).parent().find('.bottuns-above-scheme__drop-list').toggle();
    });

    $(document).mouseup(function (e) {
        var dateList = $(".bottuns-above-scheme__drop-list");
        var dateListTo = $(".bottuns-above-scheme__to-drop-list");
        if (!dateListTo.is(e.target) && dateListTo.has(e.target).length === 0){
            if (!dateList.is(e.target) && dateList.has(e.target).length === 0) {
                dateList.hide().removeClass('show');
            }
        }
    });

    function elWidthPixcel() {
        var elWidth = 62;
        $('.right-motivation.mobile .top-icons')
            .attr('style','max-width: '+($('.mobile .top-icons .event-info-block:not(.hidden)').length*elWidth)+'px');
    }

    // BEGIN ->ЛОГИКА РАБОТЫ КНОПКИ ДОБАВЛЕНИЯ ДОПОЛНИТЕЛЬНОЙ УСЛУГИ В ЗАКАЗ
    $('.bottuns-above-scheme__buy-count-control--plus, .bottuns-above-scheme__item-title').click(function () {
        let controller = $(this).parent().addClass('active');
        var match_id = $('.match').attr('data-id');
        let count = Number(controller.data('count')) + 1;
        let max = controller.data('max-count') !== 0 ? controller.data('max-count') : 100;

        if (count <= max) {

            var data = {
                "PRODUCT_ID": match_id,
                "NAME": controller.data('name'),
                "PRICE": controller.data('price'),
                "QUANTITY":1,
                "PROPS":[
                    {
                        "NAME":"Тип",
                        "CODE":"TYPE",
                        "VALUE":"service"
                    },
                    {
                        "NAME":"ID Услуги",
                        "CODE":"SERVICE_ID",
                        "VALUE": controller.data('id')
                    }
                ]
            };

            var dopCount = 0, dopSum = 0, count_ = 0;
            $.ajax({
                url: "/api/controllers/basket/addProduct/",
                method: "POST",
                data: {
                    data: JSON.stringify(data)
                },
                success: function (data) {
                    if(data.status == 'error'){
                        // вывожу массив данных с ошибками
                        data.errors.forEach(item => {
                            console.log(item.message)
                        });
                    }

                    if(data.status == 'success'){
                        // тут преобразую входящий массив в данные
                        if( data.data != false ) {
                            data.data.PRODUCTS.forEach(item => {
                                if (item.PROPS.TYPE.VALUE == 'service') {
                                    dopCount = Number(dopCount) + Number(item.QUANTITY)
                                    dopSum = Number(dopSum) + (Number(item.PRICE) * Number(item.QUANTITY))
                                } else {
                                    count_ = Number(count_) + Number(item.QUANTITY)
                                }
                            });
                        }

                        updateCountProducts({'sum': data.data.FULL_PRICE, 'count': count_, 'dopCount': dopCount, 'dopSum': dopSum});

                        // Яндекс.Метрика Ecommerce: Добавление дополнительной услуги
                        if (typeof ymEcommerceAdd !== 'undefined') {
                            ymEcommerceAdd([{
                                name: controller.data('name'),
                                price: controller.data('price'),
                                brand: 'DomBilet',
                                category: 'Дополнительные услуги',
                                quantity: 1
                            }]);
                        }
                    }
                },
            });

            controller.data('count', count);
            controller.find('.bottuns-above-scheme__buy-count').text(count);
        }
    });
    // END ->ЛОГИКА РАБОТЫ КНОПКИ ДОБАВЛЕНИЯ ДОПОЛНИТЕЛЬНОЙ УСЛУГИ В ЗАКАЗ

    // BEGIN ->ЛОГИКА РАБОТЫ КНОПКИ УДАЛЕНИЯ ДОПОЛНИТЕЛЬНОЙ УСЛУГИ В ЗАКАЗЕ
    $('.bottuns-above-scheme__buy-count-control--minus').click(function () {

        let controller = $(this).parent();
        let count = controller.data('count') - 1;
        var match_id = $('.match').attr('data-id');
        let max = controller.data('max-count') !== 0 ? controller.data('max-count') : 100;

        if (count >= 0) {

            var data = {
                "PRODUCT_ID": match_id,
                "NAME": controller.data('name'),
                "PRICE": controller.data('price'),
                "QUANTITY":-1,
                "PROPS":[
                    {
                        "NAME":"Тип",
                        "CODE":"TYPE",
                        "VALUE":"service"
                    },
                    {
                        "NAME":"ID Услуги",
                        "CODE":"SERVICE_ID",
                        "VALUE": controller.data('id')
                    }
                ]
            };

            var dopCount = 0, dopSum = 0, count_ = 0;
            $.ajax({
                url: "/api/controllers/basket/addProduct/",
                method: "POST",
                data: {
                    data: JSON.stringify(data)
                },
                success: function (data) {
                    if(data.status == 'error'){
                        // вывожу массив данных с ошибками
                        data.errors.forEach(item => {
                            console.log(item.message)
                        });
                    }

                    if(data.status == 'success'){
                        // тут преобразую входящий массив в данные
                        if( data.data != false ) {
                            data.data.PRODUCTS.forEach(item => {
                                if (item.PROPS.TYPE.VALUE == 'service') {
                                    dopCount = Number(dopCount) + Number(item.QUANTITY)
                                    dopSum = Number(dopSum) + (Number(item.PRICE) * Number(item.QUANTITY))
                                } else {
                                    count_ = Number(count_) + Number(item.QUANTITY)
                                }
                            });
                        }

                        updateCountProducts({'sum': data.data.FULL_PRICE, 'count': count_, 'dopCount': dopCount, 'dopSum': dopSum});

                        // Яндекс.Метрика Ecommerce: Удаление дополнительной услуги
                        if (typeof ymEcommerceRemove !== 'undefined') {
                            ymEcommerceRemove([{
                                name: controller.data('name'),
                                price: controller.data('price'),
                                brand: 'DomBilet',
                                category: 'Дополнительные услуги',
                                quantity: 1
                            }]);
                        }
                    }
                },
            });

            controller.data('count', count);
            controller.find('.bottuns-above-scheme__buy-count').text(count);
        }
        if (count === 0){
            controller.removeClass('active');
        }
    });
    // END ->ЛОГИКА РАБОТЫ КНОПКИ УДАЛЕНИЯ ДОПОЛНИТЕЛЬНОЙ УСЛУГИ В ЗАКАЗЕ

    // BEGIN ->ЛОГИКА РАБОТЫ КНОПКИ ПЛЮС В МОДАЛЬНОМ ОКНЕ ВЫБОРА БИЛЕТОВ ПО ЦЕНОВОЙ КАТЕГОРИИ
    $('.popup-group__seats-control--plus').click(function () {
        var popup_block = $('#buy-ticket-popup-group');
        var count = parseInt($('.popup-group__seats-cvalue').text());
        var popup_plus_button = $('.popup-group__seats-control--plus');
        var popup_minus_button = $('.popup-group__seats-control--minus');
        var count_free = parseInt($('.popup-group__count-free span').text());
        var max_count = parseInt(popup_block.attr('data-max-count'));

        if (count < max_count) {
            count = count + 1;
            popup_minus_button.removeClass('disabled');
            $('.popup-group__seats-cvalue').text(count);
            var match_id = $('.match').attr('data-id'),
            curentDate = document.querySelector('.multi-date__click.active');
            const eventDate = curentDate ? (curentDate.getAttribute('data-date') || false) : false;
            const dateSuffix = eventDate ? ' дата: ' + eventDate : '';
            const productName = formatGroupProductName(
                $('.obzor-box__title').text(),
                popup_block.find('.popup-group__name-sectors').text(),
                dateSuffix
            );
            
            const parts = popup_block.find('.popup-group__name-sectors').text().split(": ");
            const result_sec = parts.length > 1 ? parts[1] : str;

            var data = {
                "PRODUCT_ID": match_id,
                "NAME": productName,
                "PRICE": popup_block.attr('data-price'),
                "QUANTITY":1,
                "PROPS":[
                    {
                        "NAME":"Тип",
                        "CODE":"TYPE",
                        "VALUE":"group"
                    },
                    {
                        "NAME":"Сектор",
                        "CODE":"SECTOR",
                        "VALUE": result_sec,
                    },
                    {
                        "NAME":"Дата/Время мероприятия",
                        "CODE":"DATETIME",
                        "VALUE": curentDate ? (curentDate.getAttribute('data-date') || false) : false
                    }
                ]
            };

            var dopCount = 0, dopSum = 0, count = 0;

            count_free = count_free - 1;
            $('.popup-group__count-free span').text(count_free);

            if(count_free == 0){
                popup_plus_button.addClass('disabled');
            }

            $.ajax({
                url: "/api/controllers/basket/addProduct/",
                method: "POST",
                data: {
                    data: JSON.stringify(data),
                },
                success: function (responseData) {
                    if(responseData.status == 'error'){
                        // вывожу массив данных с ошибками
                        responseData.errors.forEach(item => {
                            console.log(item.message)
                        });
                    }

                    if(responseData.status == 'success'){
                        if( responseData.data != false ) {
                            responseData.data.PRODUCTS.forEach(item => {
                                if (item.PROPS.TYPE.VALUE == 'service') {
                                    dopCount = Number(dopCount) + Number(item.QUANTITY)
                                    dopSum = Number(dopSum) + Number(item.PRICE)
                                } else {
                                    count = Number(count) + Number(item.QUANTITY)
                                }
                            });
                            updateCountProducts({'sum': responseData.data.FULL_PRICE, 'count': count, 'dopCount': dopCount, 'dopSum': dopSum});
                        }

                        var eventType = $('.map').attr('data-event_type');
                        // Яндекс.Метрика Ecommerce: Добавление билета
                        if (typeof ymEcommerceAdd !== 'undefined') {
                            ymEcommerceAdd([{
                                name: data.NAME,
                                price: data.PRICE,
                                brand: 'DomBilet',
                                category: eventType,
                                quantity: 1
                            }]);
                        }
                    }
                },
            });

        }

        if(count == max_count){
            $(this).addClass('disabled');
        }
    });
    // END ->ЛОГИКА РАБОТЫ КНОПКИ ПЛЮС В МОДАЛЬНОМ ОКНЕ ВЫБОРА БИЛЕТОВ ПО ЦЕНОВОЙ КАТЕГОРИИ

    // BEGIN ->ЛОГИКА РАБОТЫ КНОПКИ МИНУС В МОДАЛЬНОМ ОКНЕ ВЫБОРА БИЛЕТОВ ПО ЦЕНОВОЙ КАТЕГОРИИ
    $('.popup-group__seats-control--minus').click(function () {
        var count = parseInt($('.popup-group__seats-cvalue').text());
        var count_free = parseInt($('.popup-group__count-free span').text());
        var popup_minus_button = $('.popup-group__seats-control--minus');
        var popup_plus_button = $('.popup-group__seats-control--plus');

        if (count > 0) {
            var popup_block = $('#buy-ticket-popup-group');

            count = count - 1;
            $('.popup-group__seats-cvalue').text(count);
            var match_id = $('.match').attr('data-id');

            if(count < 1){
                popup_minus_button.addClass('disabled');
            }

            const parts = popup_block.find('.popup-group__name-sectors').text().split(": ");
            const result_sec = parts.length > 1 ? parts[1] : str;
            const curentDate = document.querySelector('.multi-date__click.active');
            const eventDate = curentDate ? (curentDate.getAttribute('data-date') || false) : false;
            const dateSuffix = eventDate ? ' дата: ' + eventDate : '';
            const productName = formatGroupProductName(
                $('.obzor-box__title').text(),
                popup_block.find('.popup-group__name-sectors').text(),
                dateSuffix
            );

            var data = {
                "PRODUCT_ID": match_id,
                "NAME": productName,
                "PRICE": popup_block.attr('data-price'),
                "QUANTITY":-1,
                "PROPS":[
                    {
                        "NAME":"Тип",
                        "CODE":"TYPE",
                        "VALUE":"group"
                    },
                    {
                        "NAME":"Сектор",
                        "CODE":"SECTOR",
                        "VALUE": result_sec,
                    }
                ]
            };

            var dopCount, dopSum, count = 0;

            $.ajax({
                url: "/api/controllers/basket/addProduct/",
                method: "POST",
                data: {
                    data: JSON.stringify(data),
                },
                success: function (responseData) {
                    if(responseData.status == 'error'){
                        // вывожу массив данных с ошибками
                        responseData.errors.forEach(item => {
                            console.log(item.message)
                        });
                    }

                    if(responseData.status == 'success'){
                        if( responseData.data != false ){
                            responseData.data.PRODUCTS.forEach(item => {
                                if(item.PROPS.TYPE.VALUE == 'service'){
                                    dopCount = Number(dopCount) + Number(item.QUANTITY)
                                    dopSum = Number(dopSum) + Number(item.PRICE)
                                }else{
                                    count = Number(count) + Number(item.QUANTITY)
                                }
                            });
                            updateCountProducts({'sum': responseData.data.FULL_PRICE, 'count': count, 'dopCount': dopCount, 'dopSum': dopSum});
                        }

                        var eventType = $('.map').attr('data-event_type');
                        // Яндекс.Метрика Ecommerce: Удаление билета
                        if (typeof ymEcommerceRemove !== 'undefined') {
                            ymEcommerceRemove([{
                                name: data.NAME,
                                price: data.PRICE,
                                brand: 'DomBilet',
                                category: eventType,
                                quantity: 1
                            }]);
                        }
                    }
                },
            });

            count_free = (count_free == 0) ? 1 : count_free*1 + 1;
            $('.popup-group__count-free span').text(count_free);

            if(count_free > 0){
                popup_plus_button.removeClass('disabled');
            }
        }
    });
    // END ->ЛОГИКА РАБОТЫ КНОПКИ МИНУС В МОДАЛЬНОМ ОКНЕ ВЫБОРА БИЛЕТОВ ПО ЦЕНОВОЙ КАТЕГОРИИ

    // BEGIN ->ПОДГРУЖАЮ СПИСОК ВСЕХ БИЛЕТОВ ТАБЛИЦЕЙ
    $('.js-change-scheme-view').click(function () {
        let mapCenterDefault = window.map.getCenter();
        let mapZoomDefault = window.map.getZoom();
        const nameSchemeView = $(this).data('name-schema')
        const nameTicketsView = $(this).data('name-tickets')

        $('.map__condition-tickets').toggleClass("active")
        $('.map__condition-scheme').toggleClass("active")

        if ($('.map__condition-tickets').hasClass('active')) {
            $(this).text(nameTicketsView)
        } else {
            setTimeout(function () {
                window.map.invalidateSize(true)
                window.map.setView([mapCenterDefault.lat,mapCenterDefault.lng], mapZoomDefault);
                //  window.map.panTo(new L.LatLng(mapCenterDefault.lat,mapCenterDefault.lng));

            }, 100)
            $(this).text(nameSchemeView)
        }

        // Шапка фиксирована только выше 1025px, ниже поправка не нужна
        let headerWrapper = $(".js-top-header .top-header__wrapper");
        let menuHeight = headerWrapper.css("position") === "fixed" ? headerWrapper.outerHeight() : 0;
        $('html, body').animate({
            scrollTop: $(".map").offset().top - menuHeight - 25
        }, 500);


        if ($(".map__condition-tickets").hasClass("map__condition-tickets--loading")) {
            $.ajax({
                url: "/ajax/ticket-list.php",
                method: "POST",
                data: {
                    type: $(".map").attr("data-sale-type"),
                    match_id: $(".match").attr("data-id"),
                    stadium: $('input[name="stadium_id"]').val(),
                    datetime: $("#map").data("date"),
                    isVip: isVip,
                },
                success: function (data, textStatus) {
                    $(".map__condition-tickets").html(data).removeClass("map__condition-tickets--loading");

                }
            });
        }

    })
    // END ->ПОДГРУЖАЮ СПИСОК ВСЕХ БИЛЕТОВ ТАБЛИЦЕЙ

    // BEGIN ->ОБРАБОТКА КЛИКА НА КНОПКУ ВЫБОРА СЕКТОРА ИЗ СПИСКА СЕКТОРОВ
    $(document).on('click','.card-list-map__btn',function (){
        const btn = $(this);
        const btnIcon = $(this).find('.icon');
        const nameOpen = btn.data('name-open')
        const nameClose = btn.data('name-close')

        let sector = $('.sectors').children('[data-sector-id="'+$(this).data("id")+'"]');

        if (!btn.hasClass('_active')) {
            btn.addClass("_active");
            btn.find('span').text(nameClose);
            // btnIcon.removeClass("icon-arrow-down").addClass("icon-arrow-up")

            let dataToSend = {
                sector: $(this).data("id"),
                match_id: $(".match").attr("data-id"),
                datetime: $("#map").data("date"),
                isVip: isVip,
            };

            $.ajax({
                url: "/ajax/ticket-list-sector.php",
                method: "POST",
                data: dataToSend,
                success: function (data, textStatus) {
                    $(sector).append(data)
                }
            })
        } else {
            btn.removeClass("_active");
            btn.find('span').text(nameOpen);
            $(sector).find(".tickets").remove();
            // btnIcon.addClass("icon-arrow-down").removeClass("icon-arrow-up")
        }
    })
    // END ->ОБРАБОТКА КЛИКА НА КНОПКУ ВЫБОРА СЕКТОРА ИЗ СПИСКА СЕКТОРОВ

    // BEGIN ->ОБРАБОТКА КЛИКА НА ЦВЕТОВУЮ ЛЕГЕНДУ
    $('[data-colorhover]').on('click',function () {

        let color = $(this).data('colorhover');

        if($(this).hasClass('selected')){
            $(this).removeClass('selected');
            $(this).children('.item-price__wrapper').attr('style','background-color: unset; border: 2px solid '+color);
            $(this).find('.item-price').attr('style','background-color: unset; color: '+color);
            if($('.price-range .selected').length == 0){
                $('#map svg .active').removeClass('unhover').removeClass('hover');
            }else{
                $('#map svg .active:not(.hover)').addClass('unhover');
                $('[style^="stroke: '+color).closest('.active').addClass('unhover');
            }
        }else{
            $(this).addClass('selected');
            $('#map svg .active:not(.hover)').addClass('unhover');
            $('[style^="stroke: '+color).closest('.active').addClass('hover').removeClass('unhover');
            $(this).children('.item-price__wrapper').attr('style','background-color: '+color+'; border: 2px solid '+color);
            $(this).find('.item-price').attr('style','color: unset; background-color: '+color);
        }
    });
    // END ->ОБРАБОТКА КЛИКА НА ЦВЕТОВУЮ ЛЕГЕНДУ

    // BEGIN ->ЛОГИКА ГОЛОСОВАНИЯ ЗА РЕЗУЛЬТАТ МАТЧА НА СТРАНИЦЕ МЕРОПРИЯТИЯ
    function Vote(data){

        let block_votes = $('.block-votes');

        block_votes.addClass('disabled');

        $.ajax({
            url: "/ajax/vote.php",
            method: "POST",
            data: data,
            dataType: 'json',
            success: function (data) {
                if(data.count && data.count.all){
                    block_votes.addClass('show-result');
                    $('[data-type="A"] .result span:first-child').attr('style','width: '+data.count.a_procent+'%');
                    $('[data-type="B"] .result span:first-child').attr('style','width: '+data.count.b_procent+'%');
                    $('[data-type="C"] .result span:first-child').attr('style','width: '+data.count.c_procent+'%');
                    $('[data-type="A"] .result span:last-child').text(data.count.a_procent+'%');
                    $('[data-type="B"] .result span:last-child').text(data.count.b_procent+'%');
                    $('[data-type="C"] .result span:last-child').text(data.count.c_procent+'%');
                }
                block_votes.removeClass('disabled');
            }
        });
    }

    const container_vote = $('.continer-voiting-win');

    if(container_vote){

        const event = $('.block-votes').data('event');

        $('.block-votes').on('click','.vote',function (){
            if(!$('.block-votes').hasClass('disabled')){
                let vote = $(this);
                let vote_type = vote.data('type');

                let data = {
                    vote: vote_type,
                    event: event
                }

                Vote(data);
            }
        });

        let data = {
            event: event,
            show_result: true
        }

        Vote(data);
    }
    // END ->ЛОГИКА ГОЛОСОВАНИЯ ЗА РЕЗУЛЬТАТ МАТЧА НА СТРАНИЦЕ МЕРОПРИЯТИЯ


    if(document.getElementById('schemeModal')){

        var schemeModal = document.getElementById('schemeModal');

        schemeModal.addEventListener('shown.bs.modal', function () {
            $(".map-group").appendTo(".modal-body");

            let mapCenterDefault = window.map.getCenter();
            let mapZoomDefault = window.map.getZoom();

            setTimeout(function () {
                window.map.invalidateSize(true)
                window.map.setView([mapCenterDefault.lat, mapCenterDefault.lng], mapZoomDefault);
                //  window.map.panTo(new L.LatLng(mapCenterDefault.lat,mapCenterDefault.lng));

            }, 100)
        })
        schemeModal.addEventListener('hidden.bs.modal', function () {
            let mapCenterDefault = window.map.getCenter();
            let mapZoomDefault = window.map.getZoom();

            setTimeout(function () {
                window.map.invalidateSize(true)
                window.map.setView([mapCenterDefault.lat, mapCenterDefault.lng], mapZoomDefault);
                //  window.map.panTo(new L.LatLng(mapCenterDefault.lat,mapCenterDefault.lng));

            }, 100)
            $(".map-group").appendTo(".map-group-return");
            $(".sector_popup").removeClass("active");
            load_sector_orange(true)
        })
    }

    $("body").on("click",".modal-mobile__btn-close", function () {
        $(".mobile_sector").removeClass("active");
    });

});

document.onreadystatechange = function () {
    if (document.readyState === 'complete') {
        const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
        const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))
    }

    isVip = document.body.classList.contains('dark-vip');
}

/* End */
;
; /* Start:"a:4:{s:4:"full";s:105:"/local/templates/dombilet2.0/components/bitrix/catalog.element/.default/js/script_buy.js?1793107043103065";s:6:"source";s:88:"/local/templates/dombilet2.0/components/bitrix/catalog.element/.default/js/script_buy.js";s:3:"min";s:0:"";s:3:"map";s:0:"";}"*/
// console.log("script buy");
function getTicketSourceClass(source) {
    source = String(source || '').trim();

    if (!source) {
        return '';
    }
    if (source.indexOf('@') !== -1) {
        return ' source-broker';
    }

    return ' source-ours';
}

// Дата, на которой лежит набор по ценовой категории: у мультидаты это выбранный слайд,
// data-date-msk — дата площадки, в ней же хранится набор. data-date у схемы оставлен запасным
function getActiveSchemeDate() {
    var activeSlide = document.querySelector('.multi-date__click.active');

    if (activeSlide)
        return activeSlide.getAttribute('data-date-msk') || activeSlide.getAttribute('data-date') || '';

    return $('#map').data('date') || '';
}

function getLinkedTicketElements($ticket) {
    var groupId = $ticket.attr("data-linked-tickets-id") || "";
    return groupId ? $('[data-linked-tickets-id="' + groupId + '"]') : $ticket;
}

function getLinkedTicketHoverData($ticket) {
    var groupId = $ticket.attr("data-linked-tickets-id") || "";

    if (!groupId) {
        return {
            $tickets: $ticket,
            seats: $ticket.data('seat'),
            price: $ticket.data('price'),
            isLinked: false
        };
    }

    var $mapTickets = $ticket.closest('svg').find('g.active');
    if (!$mapTickets.length) {
        $mapTickets = $('g.active');
    }

    var $tickets = $mapTickets.filter(function () {
        return ($(this).attr("data-linked-tickets-id") || "") === groupId;
    });

    if (!$tickets.length) {
        $tickets = $ticket;
    }

    var tickets = $tickets.get().sort(function (first, second) {
        return Number($(first).data('seat')) - Number($(second).data('seat'));
    });
    var price = 0;
    var seats = [];

    $.each(tickets, function (_, ticket) {
        var $currentTicket = $(ticket);

        seats.push($currentTicket.data('seat'));
        price += Number($currentTicket.data('price')) || 0;
    });

    return {
        $tickets: $(tickets),
        seats: seats.join(', '),
        price: price,
        isLinked: Boolean(groupId && tickets.length > 1)
    };
}

function applyLinkedTicketHover(linkedHoverData, $sourceTicket) {
    if (!linkedHoverData.isLinked) {
        return;
    }

    var sourceStyles = {};
    $sourceTicket.find('rect, path, circle, text').each(function () {
        var tagName = this.tagName.toLowerCase();
        var computedStyle = window.getComputedStyle(this);

        sourceStyles[tagName] = sourceStyles[tagName] || [];
        sourceStyles[tagName].push({
            fill: computedStyle.fill,
            stroke: computedStyle.stroke,
            strokeWidth: computedStyle.strokeWidth
        });
    });

    linkedHoverData.$tickets.each(function () {
        var indexes = {};

        $(this).find('rect, path, circle, text').each(function () {
            var tagName = this.tagName.toLowerCase();
            var index = indexes[tagName] || 0;
            var styles = sourceStyles[tagName] || [];
            var hoverStyle = styles[index] || styles[0];

            indexes[tagName] = index + 1;
            if (!hoverStyle) {
                return;
            }

            if (!$.data(this, 'linkedHoverStyleSaved')) {
                $.data(this, 'linkedHoverStyleSaved', true);
                $.data(this, 'linkedHoverOriginalStyle', this.getAttribute('style'));
            }

            this.style.setProperty('fill', hoverStyle.fill, 'important');
            this.style.setProperty('stroke', hoverStyle.stroke, 'important');
            this.style.setProperty('stroke-width', hoverStyle.strokeWidth, 'important');
        });
    });
}

function clearLinkedTicketHover($tickets) {
    $tickets.find('rect, path, circle, text').each(function () {
        if (!$.data(this, 'linkedHoverStyleSaved')) {
            return;
        }

        var originalStyle = $.data(this, 'linkedHoverOriginalStyle');
        if (originalStyle === null) {
            this.removeAttribute('style');
        } else {
            this.setAttribute('style', originalStyle);
        }

        $.removeData(this, 'linkedHoverStyleSaved');
        $.removeData(this, 'linkedHoverOriginalStyle');
    });
}

function setLinkedTicketSelection($ticket, isSelected) {
    getLinkedTicketElements($ticket)
        .toggleClass("selected", isSelected)
        .toggleClass("only-selected", isSelected);
}

function showLinkedTicketsPopup(message) {
    $("#linked-tickets-popup-text").text(message || "Эти билеты можно приобрести только вместе.");
    document.getElementById("linked-tickets-popup-trigger")?.click();
}

// Снимает only-selected, только если курсор действительно вне билета (для Chrome)
function clearOnlySelectedOnLeave(event) {
    var rect = this.getBoundingClientRect();

    if (
        event.clientX >= rect.left && event.clientX < rect.right &&
        event.clientY >= rect.top && event.clientY < rect.bottom
    ) {
        return;
    }

    this.classList.remove("only-selected");
}

var isVip = false;

// BEGIN ->ПОДКИДЫВАЮ ДАННЫЕ О СОСТОЯНИИ КОРЗИНЫ
var dopCount = 0, dopSum = 0, count = 0;
var services = [];

$.ajax({
    url: "/api/controllers/basket/get/",
    method: "POST",
    data: {
        data: true
    },
    success: function (data) {
        if(data.status == 'error'){
            // вывожу массив данных с ошибками
            data.errors.forEach(item => {
                console.log(item.message)
            });
        }

        if(data.status == 'success'){
            // тут преобразую входящий массив в данные
            if( data.data != false ){
                data.data.PRODUCTS.forEach(item => {
                    if(item?.PROPS?.TYPE?.VALUE == 'service'){

                        services.push({ ID: item.ID, SERVICE_ID: item.PROPS.SERVICE_ID.VALUE, QUANTITY: item.QUANTITY });

                        document.querySelector('.bottuns-above-scheme__item[data-id="'+item.PROPS.SERVICE_ID.VALUE+'"]')?.classList.add('active');

                        // document.querySelector('[data-id="'+item.PROPS.SERVICE_ID.VALUE+'"] .bottuns-above-scheme__buy-count')?.textContent = Math.trunc(item.QUANTITY);
                        const buy_count_1 = document.querySelector('[data-id="'+item.PROPS.SERVICE_ID.VALUE+'"] .bottuns-above-scheme__buy-count');
                        if (buy_count_1)
                            buy_count_1.textContent = Math.trunc(item.QUANTITY)

                        // document.querySelector('[data-id="'+item.PROPS.SERVICE_ID.VALUE+'"]').setAttribute('data-count', item.QUANTITY);
                        const buy_count_2 = document.querySelector('[data-id="' + item.PROPS.SERVICE_ID.VALUE + '"]');
                        if (buy_count_2)
                            buy_count_2.setAttribute('data-count', item.QUANTITY);

                        dopCount = Number(dopCount) + Number(item.QUANTITY)
                        dopSum = Number(dopSum) + Number(item.PRICE) * Number(item.QUANTITY)
                    }else{
                        count = Number(count) + Number(item.QUANTITY)
                    }
                });
                if (typeof updateCountProducts === 'function')
                    updateCountProducts({'sum': data.data.FULL_PRICE, 'count': count, 'dopCount': dopCount, 'dopSum': dopSum});
            }
        }
    },
});
// END ->ПОДКИДЫВАЮ ДАННЫЕ О СОСТОЯНИИ КОРЗИНЫ

$(function() {
    var scheme_type = $('#scheme').attr('data-type');
    var sectorSources = {};
    // Описание VIP-предложения сектора (свойство VIP_TEXT), ключ — код сектора на схеме
    var sectorVipTexts = {};
    // То же описание с ключом по ID элемента сектора: в модалку сектор приходит по нему
    var sectorVipTextsById = {};
    // console.log("scheme type => "+ scheme_type);
    switch (scheme_type) {
        // мероприятие с открытой схемой
        case 'open':
            // Манипулейшн афтер лоад пэйдж
            var added_ticks = []
            for (i = 0; i < added_ticks.length; i++) {
                $('.map_table__check[data-hash=' + added_ticks[i] + ']').addClass('active');
                $('.map_table__check[data-hash=' + added_ticks[i] + ']').parents('tr').addClass('active');
            }

            mathInfoSRFToken();

            $('#map svg').css('display', 'block');

            $(document).ready(function () {
                $('body').on('mouseout', '#mesta .active', clearOnlySelectedOnLeave);
                var siteTheme = $(".map").attr("data-theme");
                // Покупка одиночных билетов кериола
                $('body').on('click', '#mesta .active:not(.active-group), .ticket-row_list-item', function () {
                    /**Костыль под айфоны */
                    if ($(this).data('timeout') == 'on'){
                        return;
                    } else {
                        $(this).data('timeout', 'on');
                        setTimeout(() => { $(this).data('timeout', 'off'); }, 150);
                    }

                    // Проверка схема или список
                    if ($(this).hasClass('active-group'))
                        return;

                    ticket_inf = $(this).attr('json').replace(/'/g, '"').replace(/\\n/g, '^');
                    var quantity_local = 0
                    var shouldSelect = !$(this).hasClass("selected");
                    if (shouldSelect) {
                        quantity_local = 1
                        var type = "put_carryall_ticket";
                    } else {
                        quantity_local = 0
                        var type = "remove_carryall_ticket";
                    }
                    setLinkedTicketSelection($(this), shouldSelect);

                    var eventType = $('.map').attr('data-event_type');
                    var dataLocal = JSON.parse(ticket_inf);

                    const parts = dataLocal.location.split(": ");
                    const result_sec = parts.length > 1 ? parts[1] : dataLocal.location;

                    var match_id = $(".match").attr("data-id");
                    var data = {
                        "PRODUCT_ID": match_id,
                        "NAME": $('.obzor-box__title').text() + " сектор: " + dataLocal.sn + " ряд: " + dataLocal.r + " место: " + dataLocal.s,
                        "PRICE": dataLocal.p,
                        "QUANTITY":quantity_local,
                        "PROPS":[
                            {
                                "NAME":"Тип",
                                "CODE":"TYPE",
                                "VALUE":"local"
                            },
                            {
                                "NAME":"Сектор",
                                "CODE":"SECTOR",
                                // "VALUE": result_sec,
                                "VALUE": dataLocal.sn
                            },
                            {
                                "NAME":"Ряд",
                                "CODE":"ROW",
                                "VALUE": dataLocal.r
                            },
                            {
                                "NAME":"Место",
                                "CODE":"PLACE",
                                "VALUE": dataLocal.s
                            },
                            {
                                "NAME":"ID билета на сайте",
                                "CODE":"ID_TICKET",
                                "VALUE": dataLocal.eid
                            }
                        ]
                    };

                    var dopCount = 0, dopSum = 0, count = 0;
                    var requestData = data;

                    $.ajax({
                        url: "/api/controllers/basket/addProduct/",
                        method: "POST",
                        data: {
                            data: JSON.stringify(data)
                        },
                        success: function (data) {
                            if(data.status == 'error'){
                                setLinkedTicketSelection($(this), !shouldSelect);
                                // вывожу массив данных с ошибками
                                data.errors.forEach(item => {
                                    console.log(item.message)
                                });
                                showLinkedTicketsPopup(data.errors?.[0]?.message || "Не удалось изменить связанную группу билетов.");
                                return;
                            }

                            if(data.status == 'success'){
                                // тут преобразую входящий массив в данные
                                if( data.data != false ) {
                                    data.data.PRODUCTS.forEach(item => {
                                        if (item.PROPS.TYPE.VALUE == 'service') {
                                            dopCount = Number(dopCount) + Number(item.QUANTITY)
                                            dopSum = Number(dopSum) + Number(item.PRICE)
                                        } else {
                                            count = Number(count) + Number(item.QUANTITY)
                                        }
                                    });
                                }
                                updateCountProducts({'sum': data.data.FULL_PRICE, 'count': count, 'dopCount': dopCount, 'dopSum': dopSum});
                                if (dataLocal.linked_tickets_id && shouldSelect) {
                                    showLinkedTicketsPopup();
                                }

                                // Яндекс.Метрика Ecommerce: Добавление/Удаление билета
                                var productData = {
                                    id: requestData.PRODUCT_ID + requestData.PROPS[4].VALUE,
                                    name: requestData.NAME,
                                    price: requestData.PRICE,
                                    brand: 'DomBilet',
                                    category: eventType,
                                    quantity: 1
                                };
                                
                                if (type === "put_carryall_ticket" && typeof ymEcommerceAdd !== 'undefined')
                                    ymEcommerceAdd([productData]);
                                else if (type === "remove_carryall_ticket" && typeof ymEcommerceRemove !== 'undefined')
                                    ymEcommerceRemove([productData]);

                            }
                        }.bind(this),
                        error: function () {
                            setLinkedTicketSelection($(this), !shouldSelect);
                            showLinkedTicketsPopup("Не удалось изменить связанную группу билетов. Попробуйте ещё раз.");
                        }.bind(this),
                    });
                });

                $('.append_svg').html($('.svg_block').text())
                get_data_flag = function () {
                    return optimize_prices = $('.match_top').attr('data-flag');
                };

                var scheme_sectors_count = [];

                function init_all() {
                    let color_groups = $('#map').data('price-ranges');

                    if (typeof scheme_sectors_count !== 'undefined') {
                        for (i = 0; i < scheme_sectors_count.length; i++) {
                            let quer = '#map g[id="' + scheme_sectors_count[i][0] + '"]';

                            var prices = scheme_sectors_count[i][1];
                            if(scheme_sectors_count[i][1] < scheme_sectors_count[i][8]){
                                prices += ' - '+scheme_sectors_count[i][8];
                            }

                            $(quer).attr('class', 'active active-group')
                                .attr('data-price', prices)
                                .attr('data-count', scheme_sectors_count[i][2])
                                .attr('data-pk', scheme_sectors_count[i][4])
                                .attr('data-name', scheme_sectors_count[i][5])
                                .attr('data-source', sectorSources[scheme_sectors_count[i][0]] || '')
                                .attr('data-ml', scheme_sectors_count[i][6])
                                .attr('data-price-all', scheme_sectors_count[i][7])
                                .attr('data-is_ours', scheme_sectors_count[i][3])
                                .attr('data-id', scheme_sectors_count[i][0]);

                            for (let color in color_groups) {
                                let range = color_groups[color];

                                if (parseInt(range[0]) <= parseInt(scheme_sectors_count[i][1]) && parseInt(scheme_sectors_count[i][1]) <= parseInt(range[1])) {
                                    $(quer + ' rect,' + quer + ' path,' + quer + ' polygon').attr('style', `stroke: ${color} !important; fill: ${color}80${siteTheme === 'orange' ? '' : ''}`);
                                    $(quer + ' text').attr('style', `fill: ${color}`);
                                    $(quer).attr("data-color", `${color}`);

                                    break;
                                }
                            }
                        }
                    }

                    if (isMobile.any()) {
                        // Корзина на странице покупки
                        $('.mini_cart_parrent').addClass('active');

                        if ($('.map__badge').text() != '0') {
                            $('.mobile_cart, .mini_cart').addClass('active');
                        }
                    }
                }

                function start_load() {
                    $('#map').addClass('loading');

                    $.ajax({
                        url: "/ajax/open_scheme.php",
                        method: "POST",
                        data: { optimize_prices: get_data_flag(), match_id: $('.match').attr('data-id'), stadium: $('input[name="stadium_id"]').val(), csrfmiddlewaretoken: getCookie('csrftoken'), datetime: $('#map').data('date'), isVip: isVip },
                        success: function (data, textStatus) {
                            var seatSectorCodes = [];

                            if (JSON.parse(data) !== null) {
                                let color_groups = $('#map').data('price-ranges');

                                let setColor = (query, price) => {
                                    for (let color in color_groups) {
                                        let range = color_groups[color];
                                        if (parseInt(range[0]) <= parseInt(price) && parseInt(price) <= parseInt(range[1])) {
                                            $(query + ' rect,' + query + ' path,' + query + ' circle').attr('style', `stroke: ${color}; fill: ${color}`);
                                            $(query).attr('data-color',color);
                                            break;
                                        }
                                    }
                                }

                                var items = JSON.parse(data)[1]['tickets'],
                                    f_items = items,
                                    colors_range = JSON.parse(data)[2];

                                var min_price = NaN;

                                for (i = 0; i < f_items.length; i++) {
                                    let id = f_items[i]['eid'],
                                        row = f_items[i]['r'],
                                        seat = f_items[i]['s'],
                                        sector = f_items[i]['sn'],
                                        sector_code = f_items[i]['ss'],
                                        price = parseInt(f_items[i]['p']);

                                    if (row == "") {
                                        console.log("Point contain errors - " + id);
                                        continue;
                                    }

                                    let quer_text = "#mesta #sektor_" + sector_code + " g[data-row=" + row + "] g[data-poin=" + seat + ']';

                                    let quer = $(quer_text);

                                    if (quer.length == 0) {
                                        quer_text = "#mesta #sektor_" + sector_code + " g[data-row=" + row + "] g[data-point=" + seat + ']';
                                        quer = $(quer_text);
                                    }
                                    if (quer.length == 0) {
                                        quer_text = "#mesta #" + sector_code + " g[data-row=" + row + "] g[data-point=" + seat + ']';
                                        quer = $(quer_text);
                                    }

                                    var classSelected = (f_items[i]['selected'] == true) ? ' selected': '',
                                        classSource = getTicketSourceClass(f_items[i]['source']);

                                    if (quer.length && seatSectorCodes.indexOf(sector_code) === -1)
                                        seatSectorCodes.push(sector_code);

                                    if (quer.hasClass("active")) {
                                        //console.log("double active", quer);
                                    } else
                                        quer.attr('class', 'active'+classSelected+classSource).attr({ 'json': JSON.stringify(f_items[i]).replace(/"/g, "'"), 'hash': id, 'data-price': price, 'data-seat': seat, 'data-row': row, 'data-sector': sector, 'data-source': f_items[i]['source'] || '', 'data-linked-tickets-id': f_items[i]['linked_tickets_id'] || '', });

                                    if (isNaN(min_price) || min_price > price)
                                        min_price = price;

                                    setColor(quer_text, price);
                                }
                            }

                            if ($('.map').data('sale-type') === 'COMBINED'){
                                // у мультидаты набор тоже есть, просто лежит на дате: раньше его здесь не запрашивали
                                $.ajax({
                                        url:  "/ajax/sectors.php",
                                        method: "POST",
                                        data: {
                                            type: 'group',
                                            optimize_prices: get_data_flag(),
                                            match_id: $('.match').attr('data-id'),
                                            stadium: $('input[name="stadium_id"]').val(),
                                            activeDate: getActiveSchemeDate(),
                                            isVip: isVip,
                                        },
                                        success: function (data, textStatus) {
                                            data = JSON.parse(data)
                                            rememberSectorVipTexts(data);
                                            for (i = 0; i < data.length; i++) {
                                                // сектор со свободными местами остаётся на местах
                                                if (data[i]['prices'].length && seatSectorCodes.indexOf(data[i]['slug']) === -1) {
                                                    sectorSources[data[i]['slug']] = data[i]['source'] || '';
                                                    scheme_sectors_count.push(
                                                        [
                                                            data[i]['slug'],
                                                            data[i]['price_all'],
                                                            String(data[i]['prices'][0]['total_count']),
                                                            data[i]['has_favorable'] ? 1 : 0,
                                                            data[i]['id'],
                                                            data[i]['name'],
                                                            data[i]['only_multiple'],
                                                            data[i]['price_all']
                                                        ]
                                                    );

                                                    if (isNaN(min_price) || min_price > Number(data[i]['price_all']))
                                                        min_price = Number(data[i]['price_all']);
                                                }
                                            }

                                            init_all()
                                        },
                                        error: function () {
                                            // набор не пришёл — схему всё равно показываем по местам
                                            init_all()
                                        }
                                    })
                            }
                        },
                        error: function (error) {
                            $('#map').removeClass('loading');
                        }
                    }).done(function() {
                        $('#map').removeClass('loading');
                    })
                }
                start_load()
            });

            break;

        // мероприятие с выбором мест по ценовой категорией
        case 'group':
            var csrftoken = getCookie('csrftoken');

            $.ajaxSetup({
                beforeSend: function (xhr, settings) {
                    if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
                        xhr.setRequestHeader("X-CSRFToken", csrftoken);
                    }
                }
            });

            $(document).ready(function () {
                var siteTheme = $(".map").attr("data-theme");
                start_load();

                function start_load() {
                    $('#map').addClass('loading');

                    $.ajax({
                        url:  "/ajax/sectors.php",
                        method: "POST",
                        data: { 
                            type: 'group', 
                            match_id: $('.match').attr('data-id'), 
                            stadium: $('input[name="stadium_id"]').val(),
                            // у мультидаты набор лежит на дате: без неё сервер вернёт пустой список
                            activeDate: getActiveSchemeDate(),
                            isVip: isVip,
                        },
                        success: function (data, textStatus) {
                            scheme_sectors = [];
                            data = JSON.parse(data);
                            rememberSectorVipTexts(data);
                            min_price = NaN;
                            for (i = 0; i < data.length; i++) {
                                if (data[i].prices.length) {
                                    sectorSources[data[i].slug] = data[i].source || '';
                                    scheme_sectors.push(
                                        [data[i].slug,
                                            data[i].price_all,
                                            String(data[i].prices[0].total_count),
                                            data[i].has_favorable ? 1 : 0, data[i].id, data[i].name,
                                            data[i].only_multiple,
                                            data[i].price_all]
                                    );
                                    if (isNaN(min_price) || min_price > Number(data[i].prices[0].min_price))
                                        min_price = data[i].prices[0].min_price;
                                }
                            }
                            $('#map').removeClass('loading');
                            init_all();
                        }
                    });
                }

                function init_all() {

                    var stadium_id = $('#map').data('arena'),
                        color_groups = $('#map').data('price-ranges'),
                        price_groups = new Map();

                    for (let i = 0; i < scheme_sectors.length; i++) {
                        price_groups.set(scheme_sectors[i][5], parseInt(scheme_sectors[i][1]));
                    }

                    for (let i = 0; i < scheme_sectors.length; i++) {

                        let quer = '#map svg g[id="' + scheme_sectors[i][0] + '"]';

                        $(quer).attr('class', 'active')
                            .attr('data-price', scheme_sectors[i][1])
                            .attr('data-count', scheme_sectors[i][2])
                            .attr('data-pk', scheme_sectors[i][4])
                            .attr('data-name', scheme_sectors[i][5])
                            .attr('data-source', sectorSources[scheme_sectors[i][0]] || '')
                            .attr('data-ml', scheme_sectors[i][6])
                            .attr('data-price-all', scheme_sectors[i][7])
                            .attr('data-is_ours', scheme_sectors[i][3]);

                        for (let color in color_groups) {
                            let range = color_groups[color];

                            if (parseInt(range[0]) <= parseInt(scheme_sectors[i][1]) && parseInt(scheme_sectors[i][1]) <= parseInt(range[1])) {
                                $(quer + ' rect,' + quer + ' path,' + quer + ' polygon').attr('style', `stroke: ${color} !important; fill: ${color}80${siteTheme === 'orange' ? '' : ''}`);
                                $(quer + ' text').attr('style', `fill: ${color}`);
                                $(quer).attr("data-color", `${color}`);

                                break;
                            }
                        }
                    }

                    // Подгрузить сектор
                    $(document).on('click','.map__condition-scheme #map svg g.active, .js-btn-active-group', function () {
                        let sector_id = $(this).data('id'),
                            sector_name = formatNameSector($(this).data('name')),
                            sector_count = $(this).data('count'),
                            sector_price_all = $(this).data('price-all'),
                            sector_vip_text = sectorVipTexts[this.id] || '',
                            match_id = $('.match').attr('data-id');

                        $('#map').addClass('loading');

                        // проверяем есть ли в корзине билеты из этого сектора
                        // и заполняем данные в модальном окне основываясь на этой информации
                        checkCart( sector_price_all, match_id )
                            .then((value) => {
                                if( value != false ){
                                    $(".popup-group__count-free").html("Свободных мест – <span>" + ( sector_count - value ) + "</span>");
                                    $(".popup-group__seats-cvalue").text(value);
                                }else{
                                    $(".popup-group__count-free").html("Свободных мест – <span>" + sector_count + "</span>");
                                    $(".popup-group__seats-cvalue").text(0);
                                }
                        
                                if (("" + sector_name).includes(",")){
                                    $(".popup-group__name-sectors").text("Сектора: " + sector_name);
                                }else{
                                    $(".popup-group__name-sectors").text("Сектор: " + sector_name);
                                }
                        
                                $(".popup-group__price").html(formaterPrice(sector_price_all) + " ₽");
                                renderSectorVipText(".popup-group__vip-text", sector_vip_text);
                                $("#buy-ticket-popup-group").attr("data-max-count", sector_count);
                                $("#buy-ticket-popup-group").attr("data-price", $(this).attr("data-price-all"));
                                $("#buy-ticket-popup-group").attr("data-id", sector_id);
                        
                        
                            });
                        $('#map').removeClass('loading');
                        fancybox_open();
                    });


                    // Открыть сектор моб.
                    $("body").on("click",".mobile_sector__button", function () {
                        load_sector($(this).attr("data-id"), $(this).attr("data-id"), $(this).attr("data-name"), $(this).attr("data-pk"));
                        $(".mobile_sector").removeClass("active");
                    });

                    if (isMobile.any()) {
                        // Корзина на странице покупки
                        $('.mini_cart_parrent').addClass('active');

                        if ($('.map__badge').text() != '0') {
                            $('.mobile_cart, .mini_cart').addClass('active');
                        }
                    }

                    // Заполнение статичных билетов из корзины на списке
                    if ($(".caryall_mini_row-static").length) {
                        $(".caryall_mini_row-static").each(function () {
                            let id = $(this).data("pr_id"),
                                count = $(this).data("count");

                            $(".static_ticket_buy [data-id='" + id + "']").attr("value", count);
                        });
                    }
                }

                $('body').on("mouseenter", "#menu_main_tribune", function () {
                    $(this).addClass('open-tribune');
                });

                $('body').on("mouseleave", "#menu_main_tribune", function () {
                    $(this).removeClass('open-tribune');
                });

            });
            break;

        // мероприятия с комбинированной схемой
        case 'combined':
            //вопрос для арсенала
            $(".question-btn").on("click", function () {
                $.fancybox.open({ src: "#arsenal-question", type: "inline" }); //,clickOutside: false,clickSlide: false,touch:false});
            });

            mathInfoSRFToken();

            $(document).ready(function () {
                var scheme_sectors_count,
                    siteTheme = $(".map").attr("data-theme");

                $("body").on("mouseout", ".mapa .active, .ticket-row_list-item", clearOnlySelectedOnLeave);

                $(".append_svg").html($(".svg_block").text());

                function init_all() {
                    var color_groups = $("#map").data("price-ranges"),
                        price_groups = new Map();

                    for (let i = 0; i < scheme_sectors_count.length; i++) {
                        price_groups.set(
                            scheme_sectors_count[i][5],
                            parseInt(scheme_sectors_count[i][1])
                        );
                    }

                    for (i = 0; i < scheme_sectors_count.length; i++) {
                        let quer = "#map svg g#" + scheme_sectors_count[i][0];

                        let sector_price_sub = '';
                        if (scheme_sectors_count[i][1] == scheme_sectors_count[i][8]){
                            sector_price_sub = formaterPrice(scheme_sectors_count[i][1])
                        } else{
                            sector_price_sub = formaterPrice(scheme_sectors_count[i][1]) + " - " + formaterPrice(scheme_sectors_count[i][8])
                        }

                        $(quer)
                            .attr("class", "active")
                            .attr("data-min-price", formaterPrice(scheme_sectors_count[i][1]))
                            .attr("data-max-price", formaterPrice(scheme_sectors_count[i][8]))
                            .attr("data-count", scheme_sectors_count[i][2])
                            .attr("data-pk", scheme_sectors_count[i][4])
                            .attr("data-name", scheme_sectors_count[i][5])
                            .attr("data-ml", scheme_sectors_count[i][6])
                            .attr("data-is_ours", scheme_sectors_count[i][3])
                            //.attr("data-id", scheme_sectors_count[i][7]) блочит выбор в комбинированном варианте
                            .attr("data-id2", scheme_sectors_count[i][7]);

                        $(quer).attr("data-price", sector_price_sub);

                        for (let color in color_groups) {
                            let range = color_groups[color];

                            if (
                                parseInt(range[0]) <= parseInt(scheme_sectors_count[i][1]) &&
                                parseInt(scheme_sectors_count[i][1]) <= parseInt(range[1])
                            ) {
                                $(quer + " rect," + quer + " path," + quer + ' polygon').attr(
                                    "style",
                                    `stroke: ${color} !important; fill: ${color}80${siteTheme === 'orange' ? '' : ''}`
                                );
                                $(quer + " text").attr("style", `fill: ${color}`);
                                $(quer).attr("data-color", `${color}`);
                                break;
                            }
                        }
                    }
                    // Подгрузить сектор
                    $("#map svg g.active").on("click", function () {
                        if ($(this).hasClass("active-group")){
                            $(".mobile_sector").removeClass("active");
                            return
                        }

                        var sector_id = $(this).data("id"),
                            sector_id2 = $(this).data("id2"),
                            sector_name = formatName($(this).data("name")),
                            sector_pk = $(this).data("pk"),
                            sector_count = $(this).data("count"),
                            price_min,
                            price_max,
                            sector_price;

                        scheme_sectors_count.forEach(function (em) {
                            if (em[0] == sector_id) {
                                price_min = em[1];
                                price_max = em[8];
                            }
                        });
                        if (price_min == price_max){
                            sector_price = formaterPrice(price_min)
                        } else{
                            sector_price = formaterPrice(price_min) + " - " + formaterPrice(price_max)
                        }

                        if (isMobile.any()) {
                            $(".mobile_sector__title-ac").removeClass("active");
                            $(".mobile_sector__title-title").html(sector_name);
                            $(".mobile_sector__price span").html(sector_price);
                            $(".mobile_sector__info--count").html(sector_count);
                            $(".mobile_sector__info--price").html(formaterPrice(sector_price));
                            $(".mobile_sector").addClass("active");
                            $(".mobile_sector__button")
                                .attr("data-id", sector_id)
                                .attr("data-id2", sector_id2)
                                .attr("data-name", sector_name)
                                .attr("data-pk", sector_pk)
                                .attr("data-price", sector_price)
                                .attr("data-count", sector_count);
                        } else {
                            load_sector(sector_id, sector_id2, sector_name, sector_pk, sector_price, sector_count);
                        }
                    });

                    // Открыть сектор моб.
                    $("body").on("click",".mobile_sector__button", function () {
                        load_sector(
                            $(this).attr("data-id"),
                            $(this).attr("data-id2"),
                            $(this).attr("data-name"),
                            $(this).attr("data-pk"),
                            $(this).attr("data-price"),
                            $(this).attr("data-count")
                        );
                        $(".mobile_sector").removeClass("active");
                    });

                    if (isMobile.any()) {
                        // Корзина на странице покупки
                        $(".mini_cart_parrent").addClass("active");
                        if ($(".map__badge").text() != "0") {
                            $(".mobile_cart, .mini_cart").addClass("active");
                        }
                        $(".mobile_sector").removeClass("active");
                    }
                }

                $("#map").addClass("loading");

                // секторные билеты рисуем только там, где свободных мест не осталось
                function markGroupSectors(data, seatSectorSlugs) {
                    let color_groups = $("#map").data("price-ranges");

                    for (i = 0; i < data.length; i++) {
                        if (!data[i].prices.length || seatSectorSlugs.indexOf(data[i].slug) !== -1) {
                            continue;
                        }

                        let quer = '#map svg g[id="' + data[i].slug + '"]:not(.btn,div)';

                        var prices = data[i]['prices'][0]['min_price'];
                        if(data[i]['prices'][0]['min_price'] < data[i]['prices'][0]['max_price']){
                            prices += ' - '+data[i]['prices'][0]['max_price'];
                        }

                        $(quer).attr("class", "active active-group")
                            .attr("data-price", prices)
                            .attr("data-count", String(data[i].prices[0].total_count))
                            .attr("data-name", data[i].name)
                            .attr("data-source", data[i].source || '')
                            .attr("data-price-all", data[i].price_all);

                        for (let color in color_groups) {
                            let range = color_groups[color];
                            let querColor = '#map svg g[id="' + data[i].slug + '"]';

                            if (
                                parseInt(range[0]) <= parseInt(data[i].price_all) &&
                                parseInt(data[i].price_all) <= parseInt(range[1])
                            ) {
                                $(querColor + " rect," + querColor + " path," + querColor + ' polygon').attr(
                                    "style",
                                    `stroke: ${color} !important; fill: ${color}80${siteTheme === 'orange' ? '' : ''}`
                                );
                                $(querColor + " text").attr("style", `fill: ${color}`);
                                $(querColor).attr('data-color',color);
                                break;
                            }
                        }
                    }
                }

                async function loadSimpleSectors(groupSectors) {
                    curentDate = document.querySelector('.multi-date__click.active');

                    let dataToSend = {
                        type: "one",
                        match_id: $(".match").attr("data-id"),
                        stadium: $('input[name="stadium_id"]').val(),
                        activeDate: curentDate ? (curentDate.getAttribute('data-date-msk') || 0) : 0,
                        isVip: isVip,
                    };

                    if ($("#map").data("date") !== undefined)
                        dataToSend.datetime = $("#map").data("date");

                    $.ajax({
                        url:  "/ajax/sectors.php",
                        method: "POST",
                        data: dataToSend,
                        success: function (data, textStatus) {
                            scheme_sectors_count = [];
                            data = JSON.parse(data);
                            rememberSectorVipTexts(data);
                            let seatSectorSlugs = [];

                            for (i = 0; i < data.length; i++) {
                                if (data[i].prices.length) {
                                    if (data[i].prices[0].min_price)
                                        price = String(data[i].prices[0].min_price);

                                    seatSectorSlugs.push(data[i].slug);

                                    scheme_sectors_count.push([
                                        data[i].slug,
                                        price,
                                        String(data[i].prices[0].total_count),
                                        data[i].has_favorable ? 1 : 0,
                                        data[i].id,
                                        data[i].name,
                                        data[i].only_multiple,
                                        data[i].id,
                                        String(data[i].prices[0].max_price),
                                    ]);
                                }
                            }

                            markGroupSectors(groupSectors, seatSectorSlugs);

                            $("#map").removeClass("loading");
                            init_all();
                        },
                    });
                }

                // сначала забираем секторные билеты, разметку по ним делаем после ответа по местам
                async function loadGroupSectors() {
                    var curentDate = document.querySelector('.multi-date__click.active');

                    $.ajax({
                        url:  "/ajax/sectors.php",
                        method: "POST",
                        data: {
                            type: "group_combined",
                            match_id: $(".match").attr("data-id"),
                            stadium: $('input[name="stadium_id"]').val(),
                            activeDate: curentDate ? (curentDate.getAttribute('data-date-msk') || 0) : 0,
                            isVip: isVip,
                        },
                        success: function (data, textStatus) {
                            let arGroupSectors = JSON.parse(data);

                            rememberSectorVipTexts(arGroupSectors);
                            loadSimpleSectors(arGroupSectors);
                        },
                        error: function () {
                            loadSimpleSectors([]);
                        }
                    });
                }

                (function start_load() {
                    loadGroupSectors()
                })();

            });

            break;

        // мероприятие с закрытой схемой
        case 'one':
            //вопрос для арсенала
            $(".question-btn").on("click", function () {
                $.fancybox.open({ src: "#arsenal-question", type: "inline" }); //,clickOutside: false,clickSlide: false,touch:false});
            });

            mathInfoSRFToken();

            $(document).ready(function () {
                var scheme_sectors_count,
                siteTheme = $(".map").attr("data-theme");

                $("body").on("mouseout", ".mapa .active, .ticket-row_list-item", clearOnlySelectedOnLeave);

                $(".append_svg").html($(".svg_block").text());

                function init_all() {
                    var color_groups = $("#map").data("price-ranges"),
                        price_groups = new Map();

                    for (let i = 0; i < scheme_sectors_count.length; i++) {
                        price_groups.set(
                            scheme_sectors_count[i][5],
                            parseInt(scheme_sectors_count[i][1])
                        );
                    }

                    for (i = 0; i < scheme_sectors_count.length; i++) {
                        let quer = '#map svg g[id="' + scheme_sectors_count[i][0] + '"]:not(.btn,div)';

                        var prices = scheme_sectors_count[i][1];
                        if(scheme_sectors_count[i][1] < scheme_sectors_count[i][8]){
                            prices += ' - '+scheme_sectors_count[i][8];
                        }

                        $(quer)
                            .attr("class", "active")
                            .attr("data-price", prices)
                            .attr("data-min-price", formaterPrice(scheme_sectors_count[i][1]))
                            .attr("data-max-price", formaterPrice(scheme_sectors_count[i][8]))
                            .attr("data-count", scheme_sectors_count[i][2])
                            .attr("data-pk", scheme_sectors_count[i][4])
                            .attr("data-name", scheme_sectors_count[i][5])
                            .attr("data-ml", scheme_sectors_count[i][6])
                            .attr("data-is_ours", scheme_sectors_count[i][3])
                            .attr("data-id2", scheme_sectors_count[i][7]);

                        for (let color in color_groups) {
                            let range = color_groups[color];

                            if (
                                parseInt(range[0]) <= parseInt(scheme_sectors_count[i][1]) &&
                                parseInt(scheme_sectors_count[i][1]) <= parseInt(range[1])
                            ) {
                                $(quer + " rect," + quer + " path").attr(
                                    "style",
                                    `stroke: ${color} !important; fill: ${color}80${siteTheme === 'orange' ? '' : ''}`
                                );
                                $(quer + " text").attr("style", `fill: ${color}`);
                                $(quer).attr("data-color", `${color}`);

                                break;
                            }
                        }
                    }

                    // Подгрузить сектор
                    $("#map svg g.active").on("click", function () {
                        if ($(this).hasClass("active-group")) return;

                        var sector_id = $(this).data("id"),
                            sector_id2 = $(this).data("id2"),
                            sector_name = formatName($(this).data("name")),
                            sector_pk = $(this).data("pk"),
                            sector_count = $(this).data("count"),
                            price_min,
                            price_max,
                            sector_price;

                        scheme_sectors_count.forEach(function (em) {
                            if (em[0] == sector_id) {
                                price_min = em[1];
                                price_max = em[8];
                            }
                        });
                        if (price_min == price_max){
                            sector_price = formaterPrice(price_min)
                        } else{
                            sector_price = formaterPrice(price_min) + " - " + formaterPrice(price_max)
                        }

                        if (isMobile.any()) {
                            $(".mobile_sector__title-ac").removeClass("active");
                            $(".mobile_sector__title-title").html(sector_name);
                            $(".mobile_sector__price span").html(sector_price);
                            $(".mobile_sector__info--count").html(sector_count);
                            $(".mobile_sector__info--price").html(formaterPrice(sector_price));
                            $(".mobile_sector").addClass("active");
                            $(".mobile_sector__button")
                                .attr("data-id", sector_id)
                                .attr("data-id2", sector_id2)
                                .attr("data-name", sector_name)
                                .attr("data-pk", sector_pk)
                                .attr("data-price", sector_price)
                                .attr("data-count", sector_count);
                        } else {
                            load_sector(sector_id, sector_id2, sector_name, sector_pk, sector_price, sector_count);
                        }
                    });

                    // Открыть сектор моб.
                    $("body").on("click",".mobile_sector__button", function () {
                        load_sector(
                            $(this).attr("data-id"),
                            $(this).attr("data-id2"),
                            $(this).attr("data-name"),
                            $(this).attr("data-pk"),
                            $(this).attr("data-price"),
                            $(this).attr("data-count")
                        );
                        $(".mobile_sector").removeClass("active");
                    });

                    if (isMobile.any()) {
                        // Корзина на странице покупки
                        $(".mini_cart_parrent").addClass("active");
                        if ($(".map__badge").text() != "0") {
                            $(".mobile_cart, .mini_cart").addClass("active");
                        }
                    }
                }

                async function loadSimpleSectors() {
                    curentDate = document.querySelector('.multi-date__click.active');

                    let dataToSend = {
                        type: "one",
                        match_id: $(".match").attr("data-id"),
                        stadium: $('input[name="stadium_id"]').val(),
                        activeDate: curentDate ? (curentDate.getAttribute('data-date-msk') || 0) : 0,
                        isVip: isVip,
                    };

                    if ($("#map").data("date") !== undefined)
                        dataToSend.datetime = $("#map").data("date");

                    $.ajax({
                        url:  "/ajax/sectors.php",
                        method: "POST",
                        data: dataToSend,
                        success: function (data, textStatus) {
                            scheme_sectors_count = [];
                            data = JSON.parse(data);
                            rememberSectorVipTexts(data);
                            min_price = NaN;
                            for (i = 0; i < data.length; i++) {
                                if (data[i].prices.length) {
                                    if (data[i].prices[0].min_price)
                                        price = String(data[i].prices[0].min_price);

                                    scheme_sectors_count.push([
                                        data[i].slug,
                                        price,
                                        String(data[i].prices[0].total_count),
                                        data[i].has_favorable ? 1 : 0,
                                        data[i].id,
                                        data[i].name,
                                        data[i].only_multiple,
                                        data[i].id,
                                        String(data[i].prices[0].max_price),
                                    ]);

                                    if (
                                        isNaN(min_price) ||
                                        min_price > Number(data[i].prices[0].min_price)
                                    )
                                        min_price = data[i].prices[0].min_price;
                                }
                            }

                            $("#map").removeClass("loading");
                            init_all();
                        },
                    });
                }

                (function start_load() {
                    loadSimpleSectors();
                })();
            });

            break;
        default:
            console.log(`Нет подходящего типа продаж`);
    }

// Общие функции и скрипты

// функция проверки данных о билетах в корзине
    async function checkCart( price, match_id ){
        const response = await $.ajax({
            type: 'POST',
            url: '/ajax/checkCart.php', // URL, на который отправляется запрос
            data: {price: price, match_id: match_id},
            dataType: 'json',
            error: function(xhr, status, error) {
                console.error('Ошибка:', error);
            }
        });

        if (response.success === 'true') {
            return response.quantity;
        }else{
            return false;
        }
    }


    function declOfNum(number, titles) {
        var cases = [2, 0, 1, 1, 1, 2];

        return titles[
            number % 100 > 4 && number % 100 < 20
                ? 2
                : cases[number % 10 < 5 ? number % 10 : 5]
            ];
    }

    function getCookie(name) {
        var cookieValue = null;
        if (document.cookie && document.cookie != '') {
            var cookies = document.cookie.split(';');
            for (var i = 0; i < cookies.length; i++) {
                var cookie = jQuery.trim(cookies[i]);
                // Does this cookie string begin with the name we want?
                if (cookie.substring(0, name.length + 1) == (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    function formaterPrice(num) {

        const str = String(num);
    
        if (str.includes(' - ')) {
            return str.split(' - ').map(p => {
                const clean = p.replace(/\s/g, '');
                return Number.parseInt(clean, 10).toLocaleString('ru');
            }).join(' - ');
        }
    
        const clean = str.replace(/\s/g, '');
        return Number.parseInt(clean, 10).toLocaleString('ru');
    }

    function csrfSafeMethod(method) {
        // these HTTP methods do not require CSRF protection
        return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
    }

    function init_scheme_2() {
        let $scheme = document.querySelector('#mapa > svg');
        if($scheme && $scheme.getAttribute('viewBox')){
            let viewBox = $scheme.getAttribute('viewBox').split(' ');
        }
        let siteTheme = $(".map").attr("data-theme");

        if (window.map_2) window.map_2.remove();

        window.map_2 = L.map('mapa', {
            crs: L.CRS.Simple,
            zoom: 1,
            minZoom: 0,
            maxZoom: 4,
            scrollWheelZoom: false,
            smoothWheelZoom: false
        });

        // Проверяем существование viewBox
        if (typeof viewBox !== 'undefined' && viewBox) {
            // Проверяем, что viewBox является массивом с минимум 4 элементами
            if (Array.isArray(viewBox) && viewBox.length >= 4) {

                let scale = null;

                try {
                    // Преобразуем значения в числа с проверкой
                    const instant_width = parseInt(viewBox[2], 10);
                    const instant_height = parseInt(viewBox[3], 10);
                    
                    // Проверяем корректность полученных значений
                    if (isNaN(instant_width) || isNaN(instant_height)) {
                        throw new Error('Некорректные значения ширины или высоты');
                    }

                    // Рассчитываем масштаб
                    scale = window.innerWidth * 0.9 / instant_width;

                    // Корректируем масштаб, если высота больше ширины
                    if (instant_height > instant_width) {
                        scale = window.innerWidth * 0.9 / instant_height;
                    }

                } catch (error) {
                    // console.error('Ошибка при расчете масштаба:', error);
                }
            } else {
                // console.warn('Некорректный viewBox или его отсутствие');
            }
        }

        window.map_2.on('zoomend', function() {
            if (window.map_2.getZoom() > 0){
                window.map_2.dragging.enable();
            }
            if (window.map_2.getZoom() === 0){
                window.map_2.dragging.disable();
            }
        });

        let widthBlock = $("#mapa").width();

        let width = widthBlock * 0.8,
            height = window.innerHeight - 300;

        var dafaultMapWrapperHeight = 100;
        var dafaultMapWrapperImportant = '';
        if ($(window).width()<= 860){
            dafaultMapWrapperHeight = siteTheme === 'orange' ? 50 : dafaultMapWrapperHeight;
            dafaultMapWrapperImportant = siteTheme === 'orange' ? ' !important' : dafaultMapWrapperImportant;

        }
        $('#mapa').attr('style', 'position:relative; height:' + (height + dafaultMapWrapperHeight) + "px" + dafaultMapWrapperImportant);

        L.svgOverlay("#mapa > svg", [
            [0, 0],
            [height, width],
        ]).addTo(map_2);

        $("#mapa .leaflet-control-zoom").stick_in_parent({
            parent: $("#mapa"),
            offset_top: 120,
        });

        map_2.fitBounds([
            [0, 0],
            [height + 50, width],
        ]);
        map_2.setMaxBounds([
            [0, 0],
            [height + 50, width],
        ]);

        var $svg = $(".leaflet-overlay-pane").find("svg"),
            $mapPane = $(".leaflet-map-pane");

        $('#mapa').on('mousedown', function (e) {
            $svg.css('will-change', 'transform');
            $mapPane.css('will-change', 'transform');
        }).on('mouseup', function (e) {
            $svg.css('will-change', 'unset');
            $mapPane.css('will-change', 'unset');
        });
    }

    function fancybox_open(){
        $.fancybox.open({
            src: "#buy-ticket-popup-group",
            type: "inline",
            clickOutside: false,
            clickSlide: false,
            touch: false,
            opts: {
                touch: false,
                afterClose: function (e) {
                    $('.fancybox-is-open').remove();

                    let old_select = '.total-select';

                    let siteTheme = '';

                    if($(".map").attr("data-theme")){
                        siteTheme = $(".map").attr("data-theme");
                    }

                    if($(old_select) && $(old_select).attr('data-color')){
                        let color = $(old_select).attr('data-color');
                        $(old_select + " rect," + old_select + " path").attr(
                            "style",
                            `stroke: ${color} !important; fill: ${color}80${siteTheme === 'orange' ? '' : ''}`
                        );
                        $(old_select + " text").attr("style", `fill: ${color}`);
                        $(old_select).removeClass('total-select');
                    }
                },
            }
        });
    }

    function mathInfoSRFToken() {
        window.callback_match_info = {
            name: "",
            datetime: "",
        };

        var csrftoken = getCookie("csrftoken");

        $.ajaxSetup({
            beforeSend: function (xhr, settings) {
                if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
                    xhr.setRequestHeader("X-CSRFToken", csrftoken);
                }
            },
        });
    }

    function CheckInTheme(quer){

        let old_select = '.total-select';

        let siteTheme = '';

        if($(".map").attr("data-theme")){
            siteTheme = $(".map").attr("data-theme");
        }

        if($(old_select) && $(old_select).attr('data-color')){
            let color = $(old_select).attr('data-color');
            $(old_select + " rect," + old_select + " path").attr(
                "style",
                `stroke: ${color} !important; fill: ${color}80${siteTheme === 'orange' ? '' : ''}`
            );
            $(old_select + " text").attr("style", `fill: ${color}`);
            $(old_select).removeClass('total-select');
        }

        if($(quer).attr('data-color')){
            let color = $(quer).attr('data-color');
            $(quer).addClass('total-select');
            $(quer + " rect," + quer + " path").attr(
                "style",
                `stroke: ${color} !important; fill: white; stroke-width: 2px;`
            );
            $(quer + " text").attr("style", `fill: ${color}80 !important`);
        }
    }

// Запоминает описание VIP-предложения секторов из ответа /ajax/sectors.php
    function rememberSectorVipTexts(arSectors) {
        if (!Array.isArray(arSectors)) {
            return;
        }

        for (let i = 0; i < arSectors.length; i++) {
            let sText = arSectors[i]['vip_text'] || '';

            sectorVipTexts[arSectors[i]['slug']] = sText;
            sectorVipTextsById[arSectors[i]['id']] = sText;
        }
    }

// Готовит описание для тултипа: разметка и длинный текст в него не помещаются
    function plainSectorVipText(sText, iLimit) {
        let sPlain = String(sText || '')
            .replace(/<[^>]*>/g, ' ')
            .replace(/&nbsp;/gi, ' ')
            .replace(/&amp;/gi, '&')
            .replace(/&quot;/gi, '"')
            .replace(/&lt;/gi, '<')
            .replace(/&gt;/gi, '>')
            .replace(/\s+/g, ' ')
            .trim();

        return sPlain.length > iLimit ? sPlain.slice(0, iLimit).trim() + '…' : sPlain;
    }

// Выводит описание VIP-предложения в блок; bPlain — без разметки и с обрезкой, для тултипа
    function renderSectorVipText(sSelector, sText, bPlain) {
        let $block = $(sSelector);

        if (!$block.length) {
            return false;
        }

        let sValue = (sText || '').trim();

        if (bPlain) {
            sValue = plainSectorVipText(sValue, 120);
            $block.text(sValue);
        } else {
            $block.html(sValue);
        }

        $block.toggleClass('active', sValue !== '');

        return sValue !== '';
    }

// Показать сектор
    function load_sector(sector_id, sector_id2, sector_name, sector_pk, sector_price, sector_count) {
        var elem = "path";
        $("#map").addClass("loading");
        curentDate = document.querySelector('.multi-date__click.active');

        let dataToSend = {
            type: "get_sector_info",
            sector: sector_id2,
            pk: sector_pk,
            match_id: $('.match').attr('data-id'),
            activeDate: curentDate ? (curentDate.getAttribute('data-date-msk') || 0) : 0,
            isVip: isVip,
            csrfmiddlewaretoken: getCookie("csrftoken"),
        };

        $.ajax({
            url: "/ajax/sector.php",
            method: "POST",
            data: dataToSend,
            success: function (data) {
                $(".sector_popup").css("display", "flex");

                var items = JSON.parse(data)[1]["tickets"],
                    f_items = items,
                    shm = JSON.parse(data)[0];

                $(".sector_popup").addClass("active");
                $(".sector_popup__name").html(sector_name);
                if(sector_count){
                    $(".sector_popup__count").html(sector_count);
                }
                if(sector_price){
                    $(".sector_popup__price").html(formaterPrice(sector_price));
                }
                renderSectorVipText(".sector_popup__vip-text", sectorVipTextsById[sector_id2]);
                $(".sector_popup .mapa").html(shm);

                if ($(".sector_popup svg#crocus").length) {
                    elem = "circle";
                    type_sector_popup = "crocus";
                } else if ($(".sector_popup svg#spartak").length) {
                    elem = "g";
                    type_sector_popup = "spartak";
                } else {
                    elem = "g";
                    type_sector_popup = $(".sector_popup svg").attr("id");
                }

                for (i = 0; i < f_items.length; i++) {
                    var row = f_items[i]["r"],
                        seat = parseInt(f_items[i]["s"]);

                    var classSelected = (f_items[i]['selected'] == true) ? ' selected': '',
                        classSource = getTicketSourceClass(f_items[i]['source']);

                    if (row && seat && $(".sector_popup svg#" + type_sector_popup).length) {
                        let row_row =
                                parseInt(row) && $("g[data-row-id]").length == 0
                                    ? "g:nth-child(" + row + ")"
                                    : 'g[data-row-id="' + row + '"]',
                            seat_seat =
                                parseInt(seat) && $("g[data-point-id]").length == 0
                                    ? elem + ":nth-child(" + seat + ")"
                                    : elem + '[data-point-id="' + seat + '"]';

                        // ряд ищем прямым потомком сектора, иначе группы-обёртки внутри рядов дают лишние совпадения
                        let place = $(".sector_popup g#" + sector_id + " > " + row_row + " " + seat_seat);

                        if (!place.length)
                            place = $(".sector_popup g#" + sector_id + " " + row_row + " " + seat_seat);

                        let ot = f_items[i]["ot"] ? "true" : "",
                            st = f_items[i]["special_seat"] ? "true" : "";

                        $(place)
                            .attr("class", "active"+classSelected+classSource)
                            .attr({
                                json: JSON.stringify(f_items[i]).replace(/"/g, "'"),
                                hash: f_items[i]["id"],
                                "data-price": f_items[i]["p"],
                                "data-seat": f_items[i]["s"],
                                "data-row": f_items[i]["r"],
                                "data-ot": ot,
                                "data-st": st,
                                "data-sector": formatName(f_items[i]["sn"]),
                                "data-source": f_items[i]["source"] || "",
                                "data-date": f_items[i]["date"],
                                "data-linked-tickets-id": f_items[i]["linked_tickets_id"] || "",
                            });

                    } else {
                        if (
                            (f_items[i]["r"][0] == "0" || f_items[i]["r"][0] == "-") &&
                            parseInt(f_items[i]["s"]) &&
                            $(".sector_popup svg#" + type_sector_popup).length
                        ) {
                            $(".sector_popup g#" +
                                sector_id + ' g[data-row-id="' +
                                f_items[i]["r"] + '"] ' +
                                elem + ":nth-child(" + seat + ")"
                            )
                                .attr("class", "active"+classSelected+classSource)
                                .attr({
                                    json: JSON.stringify(f_items[i]).replace(/"/g, "'"),
                                    hash: f_items[i]["id"],
                                    "data-price": f_items[i]["p"],
                                    "data-seat": f_items[i]["s"],
                                    "data-row": f_items[i]["r"],
                                    "data-ot": ot,
                                    "data-sector": formatName(f_items[i]["sn"]),
                                    "data-source": f_items[i]["source"] || "",
                                    "data-date": f_items[i]["date"],
                                    "data-linked-tickets-id": f_items[i]["linked_tickets_id"] || "",
                                });
                        }
                    }
                }
            },
            error: function (error) {
                $("#map").removeClass("loading");
            },
        }).done(function () {
            init_scheme_2();
            $("#map").removeClass("loading");
            let siteTheme = $(".map").attr("data-theme");
            if (siteTheme === "orange" && isMobile.any()){
                load_sector_orange()
            }else {
                setTimeout(() => {
                    $("html, body").animate(
                        {
                            scrollTop: $(".sector_popup.active").offset().top,
                            easing: "linear",
                        },
                        500
                    );
                }, 500);
            }
        });
    }

    $(document).ready(function(){

        isVip = document.body.classList.contains('dark-vip');
        // Тултип
        if ($('.window-map-m').length) {
            var $tooltip = $(".window-map-m"),
                activeSectorNames = [],
                lastPointerPosition = null,
                tooltipGap = 20,
                mapEdgeGap = 8;

            if (isMobile.any()) {
                addEventListener('click', tellPos, false);
            } else {
                addEventListener('mousemove', tellPos, false);
            }

            // Границы схемы в координатах окна браузера.
            function getMapBounds() {
                var map = document.querySelector('#scheme #map');

                return map ? map.getBoundingClientRect() : {
                    top: 0,
                    right: window.innerWidth,
                    bottom: window.innerHeight,
                    left: 0
                };
            }

            // Сокращает список по фактической высоте тултипа, сохраняя последний сектор.
            function fitSectorNames(maxHeight) {
                if (!activeSectorNames.length) return;

                var $sectorNames = $('.window-map__big .window-map__sec span'),
                    lastSector = activeSectorNames[activeSectorNames.length - 1];

                $sectorNames.text(activeSectorNames.join(', '));

                if ($tooltip.outerHeight() <= maxHeight || activeSectorNames.length < 3) return;

                var min = 1,
                    max = activeSectorNames.length - 2,
                    visibleCount = 1;

                while (min <= max) {
                    var middle = Math.floor((min + max) / 2),
                        shortenedNames = activeSectorNames.slice(0, middle)
                            .concat(['...', lastSector]);

                    $sectorNames.text(shortenedNames.join(', '));

                    if ($tooltip.outerHeight() <= maxHeight) {
                        visibleCount = middle;
                        min = middle + 1;
                    } else {
                        max = middle - 1;
                    }
                }

                $sectorNames.text(
                    activeSectorNames.slice(0, visibleCount)
                        .concat(['...', lastSector])
                        .join(', ')
                );
            }

            // Позиция тултипа
            function tellPos(p) {
                lastPointerPosition = p;

                // Мобильное позиционирование остаётся без изменений.
                if (isMobile.any()) {
                    var mobileHeight = parseInt($tooltip.css('height')),
                        mobileWidth = parseInt($tooltip.css('width'));

                    $tooltip.css({
                        left: p.clientX - mobileWidth / 2,
                        top: p.clientY - mobileHeight - tooltipGap
                    });
                    return;
                }

                var mapBounds = getMapBounds(),
                    availableHeight = Math.max(0, p.clientY - mapBounds.top - tooltipGap);

                fitSectorNames(availableHeight);

                var height = $tooltip.outerHeight(),
                    width = $tooltip.outerWidth(),
                    minLeft = mapBounds.left + mapEdgeGap,
                    maxLeft = mapBounds.right - width - mapEdgeGap,
                    left = p.clientX - width / 2;

                left = Math.max(minLeft, Math.min(left, maxLeft));

                $tooltip.css({
                    left: left,
                    top: p.clientY - height - tooltipGap
                });
            }
            // Появление
            $('body').on("mouseenter", "g.active", function () {

                var linkedHoverData = getLinkedTicketHoverData($(this));
                applyLinkedTicketHover(linkedHoverData, $(this));
                $tooltip.toggleClass('linked-tickets', linkedHoverData.isLinked);
                $tooltip.addClass('active');
                $tooltip.removeClass('has-vip-text');
                let source = $(this).attr('data-source') || '';

                if ($(this).data('name')) {
                    let name = $(this).data('name'),
                        count = $(this).data('count'),
                        price = linkedHoverData.price;

                    activeSectorNames = formatName(name).split(',')
                        .map(function (sectorName) {
                            return sectorName.trim();
                        })
                        .filter(Boolean);

                        let quershow = '#scheme #map [data-name="' + $(this).data('name') + '"]:not(.btn,div)';

                        let color = $(quershow).attr('data-color');

                        if (color) {
                            $(quershow).addClass('show-select');
                            if (name.length > 0 && name.indexOf(",") != -1) {
                                $(quershow).addClass('active-group');
                            }
                            $(quershow + " rect," + quershow + " path").attr(
                                "style",
                                `stroke: ${color} !important; fill: ${color}80; stroke-width: 2px;`
                            );
                            $(quershow + " text").attr("style", `fill: #fff !important`);
                            $(quershow).attr('data-color', color);
                        }

                    $('.window-map__sector').removeClass('active');
                    $('.window-map__big').addClass('active');
                    $('.window-map__big .window-map__sec span').html(formatName(name));
                    $('.window-map__big .window-map__count').html('<span>' + count + '</span> ');
                    $('.window-map__big .window-map__price-span').html(formaterPrice(price));
                    $('.window-map__big .window-map__source')
                        .toggleClass('active', Boolean(source))
                        .find('.window-map__source-span').text(source);

                    $tooltip.toggleClass(
                        'has-vip-text',
                        renderSectorVipText('.window-map__big .window-map__vip-text', sectorVipTexts[this.id], true)
                    );

                    if (!isMobile.any() && lastPointerPosition) {
                        tellPos(lastPointerPosition);
                    }

                } else {

                    activeSectorNames = [];

                    $('.window-map__big').removeClass('active');
                    $('.window-map__sector').addClass('active');
                    $('.window-map__sector .window-map__price-span').html(formaterPrice(linkedHoverData.price));
                    $('.window-map__sector .window-map__source')
                        .toggleClass('active', Boolean(source))
                        .find('.window-map__source-span').text(source);

                    if ($(this).data('sector') == 'Столы') {
                        row = $(this).data('row')
                        stol = ((row - 1) % 9) + 1;
                        my_row = (row - (((row - 1) % 9) + 1)) / 9 + 1;
                        $('.window-map__sector .window-map__sec').html('VIP-стол ' + stol);
                        $('.window-map__sector .window-map__table').html(stol);
                        $('.window-map__sector .window-map__row').html(my_row);
                    } else {
                        $('.window-map__sector .window-map__sec').html($(this).data('sector'));
                        $('.window-map__sector .window-map__row').html($(this).data('row'));
                    }
                    $('.window-map__sector .window-map__seat-label').html(linkedHoverData.isLinked ? 'Места' : 'Место');
                    $('.window-map__sector .window-map__seat').html(linkedHoverData.seats);
                }
            }).on( "mouseleave", "#scheme #map g.active", function(){

                let quershow = '#scheme #map [data-name="'+$(this).data('name')+'"]:not(.btn,div)';
                let quershowprice = '#scheme #map [data-price="'+$(this).data('price')+'"]:not(.btn,div)';

                let color = $(quershow).attr('data-color');
                let siteTheme = $(".map").attr("data-theme");

                if(color){
                    $(quershow).removeClass('show-select');
                    $(quershow + " rect," + quershow + " path").attr(
                        "style",
                        `stroke: ${color} !important; fill: ${color}80; ${siteTheme === 'orange' ? '' : ''}`
                    );
                    $(quershow + " text").attr("style", `fill:  ${color}80 ${siteTheme === 'orange' ? '' : ''}`);
                    $(quershow).attr('data-color',color);
                    $(quershow).removeClass('total-select');

                    $(quershowprice).removeClass('show-select');
                    $(quershowprice + " rect," + quershowprice + " path").attr(
                        "style",
                        `stroke: ${color} !important; fill: ${color}80 ${siteTheme === 'orange' ? '' : ''}`
                    );
                    $(quershowprice + " text").attr("style", `fill:  ${color}80 ${siteTheme === 'orange' ? '' : ''}`);
                    $(quershowprice).attr('data-color',color);
                    $(quershowprice).removeClass('total-select');
                }

            });

            // Скрытие
            $('body').on("mouseleave", "g.active", function () {
                clearLinkedTicketHover(getLinkedTicketHoverData($(this)).$tickets);
                $tooltip.removeClass('active');
                $(this).removeClass('select');

                let old_select = '.show-select';
                let siteTheme = $(".map").attr("data-theme");

                if($(this).hasClass('active-group')){
                    let color = $(this).attr('data-color');
                    let selector = "[data-name='"+$(this).attr('data-name')+"']:not(.btn,div)";
                    $(selector + " rect," + selector + " path").attr(
                        "style",
                        `stroke: ${color} !important; fill: ${color}80 ${siteTheme === 'orange' ? '' : ''}`
                    );
                    $(selector + " text").attr("style", `fill: ${color}80`);
                    $(selector).removeClass('show-select');
                }else{
                    if(!$(this).hasClass('total-select') && !$(this).hasClass('btn') && $(this).attr('data-color')){
                        let color = $(this).attr('data-color');
                        let selector = "[data-id='"+$(this).attr('data-id')+"']:not(.btn,div)";
                        $(selector + " rect," + selector + " path").attr(
                            "style",
                            `stroke: ${color} !important; fill: ${color}80 ${siteTheme === 'orange' ? '' : ''}`
                        );
                        $(selector + " text").attr("style", `fill: ${color}80`);
                        $(selector).removeClass('show-select');
                    }
                }
            });
        }

        // Закрыть схему сектора
        $("body").on("click", ".sector_popup__close", function () {
            var siteTheme = $(".map").attr("data-theme");
            $(".sector_popup").removeClass("active");
            $(".sector_popup .mapa").html("").attr("style", "");

            if (siteTheme === "orange" && isMobile.any()){
                load_sector_orange(true)
            }else {
                $("html, body").animate(
                    {
                        scrollTop: $("#map").offset().top - 100,
                    },
                    {
                        duration: 370, // по умолчанию «400»
                        easing: "linear", // по умолчанию «swing»
                    }
                );
            }

            setTimeout(() => $(".sector_popup").css("display", ""), 500);
        });

        // Закрыть схему сектора
        $('.header__menu').on('click', function () {
            $(this).toggleClass('active');
            $('.header__nav').toggleClass('active');
        });
        
        // BEGIN ->ЛОГИКА ОТРАБОТКИ НАЖАТИЯ НА ЕДИНИЧНОЕ МЕСТО В СЕКТОРЕ
        // Покупка одиночных билетов кериола
        $("body").on("click", ".mapa .active, .ticket-row_list-item", function () {
            /**Костыль под айфоны */
            if ($(this).data("timeout") == "on") return;
            else {
                $(this).data("timeout", "on");
                setTimeout(() => {
                    $(this).data("timeout", "off");
                }, 150);
            }

            // Проверка схема или список
            if ($(this).hasClass("active-group")) return;

            var eventType = $('.map').attr('data-event_type');

            var ticket_inf = $(this).attr("json").replace(/'/g, '"').replace(/\\n/g, "^");
            var quantity_local = 0
            var shouldSelect = !$(this).hasClass("selected");
            if (shouldSelect) {
                quantity_local = 1
                var type = "put_carryall_ticket";
            } else {
                quantity_local = 0
                var type = "remove_carryall_ticket";
            }
            setLinkedTicketSelection($(this), shouldSelect);

            var dataLocal = JSON.parse(ticket_inf),

            productName = $('.obzor-box__title').text() + 
            " сектор: " + dataLocal.sn + 
            " ряд: " + dataLocal.r + 
            " место: " + dataLocal.s + 
            ( $(this).attr("data-date") != 'false' ? ' дата: ' + $(this).attr("data-date") : '' );

            const parts = dataLocal.location.split(": ");
            const result_sec = parts.length > 1 ? parts[1] : dataLocal.location;

            var match_id = $(".match").attr("data-id");
            var data = {
                "PRODUCT_ID": match_id,
                "NAME": productName,
                "PRICE": dataLocal.p,
                "QUANTITY":quantity_local,
                "PROPS":[
                    {
                        "NAME":"Тип",
                        "CODE":"TYPE",
                        "VALUE":"local"
                    },
                    {
                        "NAME":"Сектор",
                        "CODE":"SECTOR",
                        // "VALUE": result_sec,
                        "VALUE": dataLocal.sn
                    },
                    {
                        "NAME":"Ряд",
                        "CODE":"ROW",
                        "VALUE": dataLocal.r
                    },
                    {
                        "NAME":"Место",
                        "CODE":"PLACE",
                        "VALUE": dataLocal.s
                    },
                    {
                        "NAME":"ID билета на сайте",
                        "CODE":"ID_TICKET",
                        "VALUE": dataLocal.eid
                    },
                    {
                        "NAME":"Дата/Время мероприятия",
                        "CODE":"DATETIME",
                        "VALUE": $(this).attr("data-date")
                    }
                ]
            };


            var dopCount = 0, dopSum = 0, count = 0;
            var requestData = data;

            $.ajax({
                url: "/api/controllers/basket/addProduct/",
                method: "POST",
                data: {
                    data: JSON.stringify(data)
                },
                success: function (data) {
                    if(data.status == 'error'){
                        setLinkedTicketSelection($(this), !shouldSelect);
                        // вывожу массив данных с ошибками
                        data.errors.forEach(item => {
                            console.log(item.message)
                        });
                        showLinkedTicketsPopup(data.errors?.[0]?.message || "Не удалось изменить связанную группу билетов.");
                        return;
                    }

                    if(data.status == 'success'){
                        // тут преобразую входящий массив в данные
                        if( data.data != false ) {
                            data.data.PRODUCTS.forEach(item => {
                                if (item.PROPS.TYPE.VALUE == 'service') {
                                    dopCount = Number(dopCount) + Number(item.QUANTITY)
                                    dopSum = Number(dopSum) + Number(item.PRICE)
                                } else {
                                    count = Number(count) + Number(item.QUANTITY)
                                }
                            });
                        }
                        if (typeof updateCountProducts === 'function') {
                            updateCountProducts({'sum': data.data.FULL_PRICE, 'count': count, 'dopCount': dopCount, 'dopSum': dopSum});
                        }
                        if (dataLocal.linked_tickets_id && shouldSelect) {
                            showLinkedTicketsPopup();
                        }

                        // Яндекс.Метрика Ecommerce: Добавление/Удаление билета
                        var productData = {
                            id: requestData.PRODUCT_ID + requestData.PROPS[4].VALUE,
                            name: requestData.NAME,
                            price: requestData.PRICE,
                            brand: 'DomBilet',
                            category: eventType,
                            quantity: 1
                        };

                        if (type === "put_carryall_ticket" && typeof ymEcommerceAdd !== 'undefined')
                            ymEcommerceAdd([productData]);
                        else if (type === "remove_carryall_ticket" && typeof ymEcommerceRemove !== 'undefined')
                            ymEcommerceRemove([productData]);
                    }
                }.bind(this),
                error: function () {
                    setLinkedTicketSelection($(this), !shouldSelect);
                    showLinkedTicketsPopup("Не удалось изменить связанную группу билетов. Попробуйте ещё раз.");
                }.bind(this),
            });
        });
        // END ->ЛОГИКА ОТРАБОТКИ НАЖАТИЯ НА ЕДИНИЧНОЕ МЕСТО В СЕКТОРЕ

        $('.price-range [data-colorhover]').on( "mouseenter", function(){
            let colorSelected = $(this).attr('data-colorhover');

            $('[data-color="'+colorSelected+'"]').addClass('total-select');

            let color = $(this).attr('data-colorhover');
            $('[data-color="'+colorSelected+'"]:not(.btn,div) rect,[data-color="'+colorSelected+'"]:not(.btn,div) path').attr(
                "style",
                `stroke: ${colorSelected} !important; fill: ${colorSelected}80; stroke-width: 2px;`
            );
            $('[data-color="'+colorSelected+'"]:not(.btn,div) text').attr("style", `fill: white !important`);

        } ).on( "mouseleave", function(){

            let siteTheme = $(".map").attr("data-theme");

            let colorSelected = $(this).attr('data-colorhover');
            $('[data-color="'+colorSelected+'"]:not(.btn,div)').removeClass('total-select');

            let color = $('.total-select').attr('data-color');
            $('[data-color="'+colorSelected+'"]:not(.btn,div) rect,[data-color="'+colorSelected+'"]:not(.btn,div) path').attr(
                "style",
                `stroke: ${colorSelected} !important; fill: ${colorSelected}80${siteTheme === 'orange' ? '' : ''}`
            );
            $('[data-color="'+colorSelected+'"]:not(.btn,div) text').attr("style", `fill: ${colorSelected}`);
        } );

        $('body').on('click','.sector_popup__close',function(){

            let old_select = '.total-select';

            let siteTheme = '';

            if($(".map").attr("data-theme")){
                siteTheme = $(".map").attr("data-theme");
            }

            if($(old_select) && $(old_select).attr('data-color')){
                let color = $(old_select).attr('data-color');
                $(old_select + " rect," + old_select + " path").attr(
                    "style",
                    `stroke: ${color} !important; fill: ${color}80${siteTheme === 'orange' ? '' : ''}`
                );
                $(old_select + " text").attr("style", `fill: ${color}80`);
                $(old_select).removeClass('total-select');
            }
        });

        $(document).on("click","#lozhi > g.active-group, #map svg g.active-group, .js-btn-active-group", function () {
            var sector_id = $(this).data("id"),
                sector_name = formatNameSector($(this).data("name")),
                sector_count = $(this).data("count")*1,
                sector_price_all = $(this).data("price-all"),
                match_id = $('.match').attr('data-id');

            var dataForCheck = {
                "PRODUCT_ID": match_id,
                "NAME": $('.obzor-box__title').text() + ' ' + sector_name,
                "PRICE": sector_price_all,
            };

            $('#map').addClass('loading');

            // проверка, есть ли билеты с той же ценовой категории, что и тот
            // групповой билет, для добавления которого открылось модально окно
            $.ajax({
                url: "/api/controllers/basket/groupTypeCheck/",
                method: "POST",
                data: {
                    data: dataForCheck,
                },
                success: function (data) {
                    if(data.status == 'error'){
                        // вывожу массив данных с ошибками
                        data.errors.forEach(item => {
                            console.log(item.message)
                        });
                    }

                    if(data.status){
                        // тут преобразую входящий массив в данные
                        if(data.status !== false && data.data.quantity > 0){
                            let new_free = sector_count - data.data.quantity;
                            $(".popup-group__count-free").html("Свободных мест – <span>" + ( new_free ) + "</span>");
                            $(".popup-group__seats-cvalue").text(data.data.quantity);
                            $('.popup-group__seats-control--minus').removeClass('disabled');
                            if(new_free == 0){
                                $('.popup-group__seats-control--plus').addClass('disabled');
                            }
                        }else{
                            $(".popup-group__count-free").html("Свободных мест – <span>" + sector_count + "</span>");
                            $(".popup-group__seats-cvalue").text(0);
                            $('.popup-group__seats-control--minus').addClass('disabled');
                            $('.popup-group__seats-control--plus').removeClass('disabled');
                        }

                        if (("" + sector_name).includes(",")){
                            $(".popup-group__name-sectors").text("Сектора: " + sector_name);
                        }else{
                            $(".popup-group__name-sectors").text("Сектор: " + sector_name);
                        }

                        $(".popup-group__price").html(formaterPrice(sector_price_all) + " ₽");
                        $("#buy-ticket-popup-group").attr("data-max-count", sector_count);
                        $("#buy-ticket-popup-group").attr("data-price", sector_price_all);
                        $("#buy-ticket-popup-group").attr("data-id", sector_id);
                    }
                },
            });
            $('#map').removeClass('loading');
            fancybox_open();
        });

        $(document).on('click','#sector_scheme g[class^=active]', function(){
            var quer = '#scheme [data-id="'+$(this).attr('data-id')+'"]';
            CheckInTheme(quer);
        });

        // ЭТОТ КОД НУЖЕН ЧТО БЫ НА МОБИЛЬНЫХ ТЕЛЕФОНАХ КОРРЕКТНО ПОКАЗЫВАЛАСЬ ПОДСКАЗКА
        $(window).on('scroll', function() {
            $('.time-timezone_wrapper').blur();
            $('.time-title').blur();
        });
        $('.time-timezone_wrapper').click(()=>{
            $('.time-timezone_wrapper').focus();
            $('.time-title').focus();
        });
        // ЭТОТ КОД НУЖЕН ЧТО БЫ НА МОБИЛЬНЫХ ТЕЛЕФОНАХ КОРРЕКТНО ПОКАЗЫВАЛАСЬ ПОДСКАЗКА

    });
    // Скролл до блока со схемой или fallback
    document.querySelectorAll('[data-scroll-to]').forEach(btn => {
        btn.addEventListener('click', () => {
            // Берем селектор из data-scroll-to
            let targetEl = document.querySelector('.events__stickers');

            // Если элемента нет — fallback на .events__body-wrapper
            if (!targetEl) {
                targetEl = document.querySelector('.obzor-box__location');
            }

            // Если нашли хоть что-то — скроллим
            if (targetEl) {
                targetEl.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // Скролл до блока с ID полученного из атрибута data-scroll
    document.addEventListener('click', function(event) {
        const target = event.target.closest('[data-scroll]');
        if (target) {
            const scrollId = target.getAttribute('data-scroll');
            const elementToScroll = document.getElementById(scrollId);
            if (elementToScroll)
                elementToScroll.scrollIntoView({ behavior: 'smooth', block: 'start' });
            else
                console.log(`Элемент с ID "${scrollId}" не найден`);
        }
    });

});

/* End */
;
; /* Start:"a:4:{s:4:"full";s:69:"/local/templates/dombilet2.0/assets/js/country-data.js?17895623323030";s:6:"source";s:54:"/local/templates/dombilet2.0/assets/js/country-data.js";s:3:"min";s:0:"";s:3:"map";s:0:"";}"*/
const countryData = {
	RU: {
		name: 'Россия',
		phoneCode: '+7',
		flag: 'assets/b3399f3978e3-ru.svg',
		mask: '(___) ___ __ __',
	},
	BY: {
		name: 'Беларусь',
		phoneCode: '+375',
		flag: 'assets/b4579c215940-by.svg',
		mask: '__ ___ __ __',
	},
	KZ: {
		name: 'Казахстан',
		phoneCode: '+7',
		flag: 'assets/6de08d49a3e6-kz.svg',
		mask: '___ ___ ____',
	},
	AZ: {
		name: 'Азербайджан',
		phoneCode: '+994',
		flag: 'assets/2348d6bbfe1d-az.svg',
		mask: '__ ___ __ __',
	},
	AM: {
		name: 'Армения',
		phoneCode: '+374',
		flag: 'assets/a04867465545-am.svg',
		mask: '__ ___ ___',
	},
	DE: {
		name: 'Германия',
		phoneCode: '+49',
		flag: 'assets/59fdf81e37fd-de.svg',
		mask: '__ ____ ____',
	},
	GE: {
		name: 'Грузия',
		phoneCode: '+995',
		flag: 'assets/f9abd35091de-ge.svg',
		mask: '___ __ __ __',
	},
	CY: {
		name: 'Кипр',
		phoneCode: '+357',
		flag: 'assets/cf01dbefcbc1-cy.svg',
		mask: '__ ___ ___',
	},
	CN: {
		name: 'Китай',
		phoneCode: '+86',
		flag: 'assets/18a7478f922d-cn.svg',
		mask: '___ ____ ____',
	},
	KG: {
		name: 'Кыргызстан',
		phoneCode: '+996',
		flag: 'assets/662cc5431818-kg.svg',
		mask: '___ ______',
	},
	MN: {
		name: 'Монголия',
		phoneCode: '+976',
		flag: 'assets/665ff1b0e4a0-mn.svg',
		mask: '___ ______',
	},
	NL: {
		name: 'Нидерланды',
		phoneCode: '+31',
		flag: 'assets/ee095c45bad5-nl.svg',
		mask: '__ ________',
	},
	AE: {
		name: 'ОАЭ',
		phoneCode: '+971',
		flag: 'assets/2f88562e8454-ae.svg',
		mask: '__ ___ ____',
	},
	PL: {
		name: 'Польша',
		phoneCode: '+48',
		flag: 'assets/4c46fa7c820d-pl.svg',
		mask: '___ ___ ___',
	},
	RS: {
		name: 'Сербия',
		phoneCode: '+381',
		flag: 'assets/d36f0e4d819f-rs.svg',
		mask: '__ ___ ____',
	},
	US: {
		name: 'США',
		phoneCode: '+1',
		flag: 'assets/c7839b188649-us.svg',
		mask: '___ ___ ____',
	},
	TJ: {
		name: 'Таджикистан',
		phoneCode: '+992',
		flag: 'assets/377e08712d76-tj.svg',
		mask: '___ ______',
	},
	TM: {
		name: 'Туркменстан',
		phoneCode: '+993',
		flag: 'assets/87031fe30d57-tm.svg',
		mask: '___ ______',
	},
	TR: {
		name: 'Турция',
		phoneCode: '+90',
		flag: 'assets/47e94f60f827-tr.svg',
		mask: '___ ___ ____',
	},
	UZ: {
		name: 'Узбекистан',
		phoneCode: '+998',
		flag: 'assets/5c75f29a405d-uz.svg',
		mask: '___ ______',
	},
	OZ: {
		name: 'Другая страна',
		phoneCode: '+',
		flag: 'assets/af59eaf2633c-un.svg',
		mask: '___ ___ ___ ____',
	}
};

/* End */
;
; /* Start:"a:4:{s:4:"full";s:75:"/local/templates/dombilet2.0/assets/js/simple-phone-mask.js?178956234110514";s:6:"source";s:59:"/local/templates/dombilet2.0/assets/js/simple-phone-mask.js";s:3:"min";s:0:"";s:3:"map";s:0:"";}"*/
/**
 * Class representing a phone number mask
 */
class SimplePhoneMask {
	/**
	 * Create a phone mask
	 * @param {string} selector - CSS selector for input elements
	 * @param {Object} options - Configuration options
	 * @param {string} [options.countryCode="RU"] - Country code (e.g., 'UA', 'US', 'GB') or phone code (e.g., '+380', '+1', '+44')
	 * @param {string} [options.maskPattern=null] - Custom mask pattern (overrides default country mask)
	 * @param {boolean} [options.showFlag=true] - Show country flag
	 * @param {boolean} [options.allowCountrySelect=true] - Allow country selection from dropdown
	 * @param {boolean} [options.detectIP=false] - Detect country by IP
	 */
	constructor(selector, options = {}) {
		this.selector = selector;

		// Normalize options with defaults
		const defaultOptions = {
			countryCode: 'RU',
			maskPattern: null,
			showFlag: true,
			allowCountrySelect: true,
			detectIP: false,
		};

		this.options = { ...defaultOptions, ...options };

		// Get country data
		let country;
		if (this.options.countryCode.startsWith('+')) {
			// Find country by phone code
			const phoneCode = this.options.countryCode;
			country = Object.values(countryData).find((c) => c.phoneCode === phoneCode);
		} else {
			// Find country by country code
			country = countryData[this.options.countryCode.toUpperCase()];
		}

		if (!country) {
			// console.error(`Invalid country code: ${this.options.countryCode}`);
			country = countryData.RU; // Default to Ukraine
		}

		this.countryCode = country.phoneCode.replace('+', '');
		this.maskPattern = this.options.maskPattern || country.mask;
		this.prefixLength = this.countryCode.length + 1; // +1 for + symbol
		this.currentCountry = country;

		// Bind methods to preserve context
		this.createMask = this.createMask.bind(this);
		this.handleClick = this.handleClick.bind(this);
		this.handleKeyDown = this.handleKeyDown.bind(this);
		this.handleSelect = this.handleSelect.bind(this);
		this.handleCountrySelect = this.handleCountrySelect.bind(this);
		this.createDropdown = this.createDropdown.bind(this);

		this.initialize();
	}

	/**
	 * Set cursor position in input element
	 * @param {number} pos - Cursor position
	 * @param {HTMLElement} elem - Input element
	 * @param {boolean} [setFocus=false] - Whether to set focus on element
	 */
	setCursorPosition(pos, elem, setFocus = false) {
		if (setFocus) {
			elem.focus();
		}

		if (elem.setSelectionRange) {
			elem.setSelectionRange(pos, pos);
		} else if (elem.createTextRange) {
			let range = elem.createTextRange();
			range.collapse(true);
			range.moveEnd('character', pos);
			range.moveStart('character', pos);
			range.select();
		}
	}

	/**
	 * Handle cursor position on click
	 * @param {Event} e - Click event
	 */
	handleClick(e) {
		const input = e.target;
		if (input.selectionStart < this.prefixLength + 1) {
			// Set focus to true only for click events
			this.setCursorPosition(this.prefixLength + 1, input, true);
		}
	}

	/**
	 * Handle keyboard navigation
	 * @param {KeyboardEvent} event - Keyboard event
	 */
	handleKeyDown(event) {
		const input = event.target;
		const cursorPosition = input.selectionStart;

		// console.log( cursorPosition )

		if (
			(event.key === 'Backspace' || event.key === 'ArrowLeft' || event.key === 'ArrowUp') &&
			cursorPosition <= this.prefixLength
		) {
			event.preventDefault();
			// Set focus to true for keyboard navigation
			this.setCursorPosition(this.prefixLength + 1, input, true);
		}

		// Prevent cursor from moving up when more than one digit is entered
		const digitsEntered = input.value.replace(/\D/g, '').length - this.countryCode.length;
		if (event.key === 'ArrowUp' && digitsEntered > 1) {
			event.preventDefault();
		}

		// Ensure the mask is applied correctly and the cursor stays within the allowed range
		// This is crucial for maintaining the correct mask format and preventing the cursor from moving outside the allowed range
	}

	/**
	 * Handle text selection
	 * @param {Event} e - Select event
	 */
	handleSelect(e) {
		const input = e.target;
		if (input.selectionStart < this.prefixLength + 1) {
			// Set focus to true only for select events
			this.setCursorPosition(this.prefixLength + 1, input, true);
		}
	}

	/**
	 * Create mask for input value
	 * @param {Event} event - Input event
	 */
	createMask(event) {
		const input = event.target;
		const matrix = '+' + this.countryCode + ' ' + this.maskPattern;
		let i = 0;
		const def = matrix.replace(/\D/g, '');
		let val = input.value.replace(/\D/g, '');

		// Remove temporary protection of country code for debugging
		// if (!input.value.startsWith("+" + this.countryCode)) {
		//   val = def;
		// }

		// если второй введённый символ 8 или 9, а первый 8, то удалить первый символ
		if( this.countryCode == 7 && val.length == 3 && val.charAt(1) == 8 && (val.charAt(2) == 8 || val.charAt(2) == 9) )
			val = val.slice(0, 1) + val.slice(2);

		input.value = matrix.replace(/./g, function (a) {
			if (/[_\d]/.test(a) && i < val.length) {
				return val.charAt(i++);
			} else if (i >= val.length) {
				return '';
			} else {
				return a;
			}
		});

		if (event.type === 'blur') {
			if (input.value.length <= this.prefixLength + 1) {
				input.value = '+' + this.countryCode;
			}
		} else {
			this.setCursorPosition(input.value.length, input);
		}
	}

	/**
	 * Create country selector dropdown
	 * @param {HTMLElement} input - Input element
	 */
	createDropdown(input) {
		if (!this.options.showFlag) return;

		const wrapper = document.createElement('div');
		wrapper.className = 'spm-wrapper';
		input.parentNode.insertBefore(wrapper, input);
		wrapper.appendChild(input);
		input.className += ' spm-input';

		const flagButton = document.createElement('div');
		flagButton.className = `spm-flag-button ${
			this.options.allowCountrySelect ? 'spm-flag-button--selectable' : 'spm-flag-button--non-selectable'
		}`;

		flagButton.innerHTML = `<img class="spm-flag-image" src="${this.currentCountry.flag}" alt="${this.currentCountry.name}"><svg class="spm-arrow-icon" width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="2"/></svg>`;
		wrapper.appendChild(flagButton);

		if (this.options.allowCountrySelect) {
			const dropdown = document.createElement('div');
			dropdown.className = 'spm-dropdown';

			Object.entries(countryData).forEach(([code, country]) => {
				const option = document.createElement('div');
				option.className = 'spm-dropdown-option';

				option.innerHTML = `
          <img class="spm-flag-image" src="${country.flag}" alt="${country.name}">
          <span class="spm-country-name">${country.name}</span>
          <span class="spm-country-code">${country.phoneCode}</span>
        `;

				option.addEventListener('click', () => this.handleCountrySelect(country, code, input));
				dropdown.style.display = 'none';
				dropdown.appendChild(option);
			});

			wrapper.appendChild(dropdown);

			flagButton.addEventListener('click', () => {
				dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
			});

			document.addEventListener('click', (e) => {
				if (!wrapper.contains(e.target)) {
					dropdown.style.display = 'none';
				}
			});
		}
	}

	/**
	 * Handle country selection from dropdown
	 * @param {Object} country - Country data object
	 * @param {string} code - Country code
	 * @param {HTMLElement} input - Input element
	 */
	handleCountrySelect(country, code, input) {
		this.countryCode = country.phoneCode.replace('+', '');
		this.maskPattern = this.options.maskPattern || country.mask;
		this.prefixLength = this.countryCode.length + 1;
		this.currentCountry = country;

		const flagButton = input.parentNode.querySelector('.spm-flag-button');
		flagButton.innerHTML = `<img class="spm-flag-image" src="${country.flag}" alt="${country.name}"><svg class="spm-arrow-icon" width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="2"/></svg>`;

		const dropdown = input.parentNode.querySelector('.spm-dropdown');
		dropdown.style.display = 'none';

		input.value = '+' + this.countryCode;

		this.createMask({
			type: 'input',
			target: input,
		});
	}

	/**
	 * Initialize mask for all matching inputs
	 */
	async initialize() {
		if (this.options.detectIP) {
			try {
				const countryCode = await this.detectCountryByIP();
				this.options.countryCode = countryCode;

				// Update country data after IP detection
				const country = countryData[countryCode];
				if (country) {
					this.countryCode = country.phoneCode.replace('+', '');
					this.maskPattern = this.options.maskPattern || country.mask;
					this.prefixLength = this.countryCode.length + 1;
					this.currentCountry = country;
				}
			} catch (error) {
				console.error('Failed to detect country by IP:', error);
			}
		}

		// Initialize inputs
		let inputs = document.querySelectorAll(this.selector);

		inputs.forEach((input) => {
			if (this.options.showFlag) {
				this.createDropdown(input);
			}

			input.addEventListener('input', this.createMask);
			input.addEventListener('focus', this.createMask);
			input.addEventListener('blur', this.createMask);
			input.addEventListener('click', this.handleClick);
			input.addEventListener('keydown', this.handleKeyDown);
			input.addEventListener('select', this.handleSelect);

			input.value = '+' + this.countryCode;
			// Remove focus trigger
			this.createMask({ type: 'input', target: input });
		});
	}

	/**
	 * Detect country by IP
	 * @returns {Promise<string>} - Country code
	 */
	async detectCountryByIP() {
		try {
			const response = await fetch('https://ipapi.co/json/', {
				cache: 'no-store', // Disable caching
			});
			const data = await response.json();
			return data.country_code;
		} catch (error) {
			console.error('Error detecting country by IP:', error);
			return this.options.countryCode;
		}
	}

	/**
	 * Destroy mask and remove all event listeners
	 */
	destroy() {
		let inputs = document.querySelectorAll(this.selector);

		inputs.forEach((input) => {
			input.removeEventListener('input', this.createMask);
			input.removeEventListener('focus', this.createMask);
			input.removeEventListener('blur', this.createMask);
			input.removeEventListener('click', this.handleClick);
			input.removeEventListener('keydown', this.handleKeyDown);
			input.removeEventListener('select', this.handleSelect);
		});
	}
}

/* End */
;; /* /local/templates/dombilet2.0/components/bitrix/catalog.element/.default/script.js?17884439627844*/
; /* /local/components/tickets/vote/templates/.default/script.js?17526554202629*/
; /* /local/templates/dombilet2.0/components/bitrix/catalog.element/.default/js/bootstrap.js?1773758466145543*/
; /* /local/templates/dombilet2.0/components/bitrix/catalog.element/.default/js/leaflet.min.js?1754922251425834*/
; /* /local/templates/dombilet2.0/components/bitrix/catalog.element/.default/js/jquery.fancybox.min.js?175068485568291*/
; /* /local/templates/dombilet2.0/components/bitrix/catalog.element/.default/js/LSVGLayer.js?17737584662470*/
; /* /local/templates/dombilet2.0/components/bitrix/catalog.element/.default/js/multiple-select.js?177375846634181*/
; /* /local/templates/dombilet2.0/components/bitrix/catalog.element/.default/js/csrf.js?17737584662050*/
; /* /local/templates/dombilet2.0/components/bitrix/catalog.element/.default/js/SmoothWheelZoom.js?17737584663498*/
; /* /local/templates/dombilet2.0/components/bitrix/catalog.element/.default/js/jquery.sticky-kit.js?17737584662797*/
; /* /local/templates/dombilet2.0/components/bitrix/catalog.element/.default/js/init_interface.js?178844396235997*/
; /* /local/templates/dombilet2.0/components/bitrix/catalog.element/.default/js/script_buy.js?1793107043103065*/
; /* /local/templates/dombilet2.0/assets/js/country-data.js?17895623323030*/
; /* /local/templates/dombilet2.0/assets/js/simple-phone-mask.js?178956234110514*/

//# sourceMappingURL=page_9b06301712d794bcfd93d928ab07b9fc.map.js