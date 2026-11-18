(() => {
  'use strict';
  const root = window.DOMBILET_WIDGET_ROOT || document;
  const config = window.DOMBILET_SCHEMES[window.DOMBILET_WIDGET_VENUE || document.body.dataset.venue];
  const isYas = config.key === 'yas';
  const $ = id => root.getElementById(id);
  const html = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money = value => new Intl.NumberFormat('ru-RU').format(value) + ' ₽';
  const photoPath = photo => '../schemes/' + photo.src;
  const storageKey = 'dombilet-scheme-v1-' + config.key;
  const defaults = { packageId: 'four', current: null, qty: 2, selection: null, seats: {}, filter: 'all', view: 'map' };
  let saved = {};
  try { saved = JSON.parse(sessionStorage.getItem(storageKey) || '{}'); } catch {}
  const state = { ...defaults, ...saved, filter: 'all', view: 'map' };
  if (!config.sectors[state.current]) state.current = null;
  if (state.selection && !config.sectors[state.selection.key]) state.selection = null;
  if (!state.seats || typeof state.seats !== 'object') state.seats = {};
  if (isYas) state.packageId = 'four';
  let modalMode = 'info', pendingPackage = null, packageExpanded = false, toastTimer;
  const stage = $('map-stage');
  const sectorDialog = $('sector-dialog');
  const views = new Map([...stage.querySelectorAll('svg.map-svg')].map(svg => {
    const initial = svg.getAttribute('viewBox').trim().split(/[ ,]+/).map(Number);
    return [svg.dataset.orient, { svg, initial, landscape: [...initial], current: [...initial] }];
  }));
  const pointers = new Map();
  let gesture = null, pinch = null, animation = 0, lastFocus = null;
  const names = new Map(Object.values(config.sectors).map(s => [s.name.replace(/\s+/g,' ').trim().toUpperCase(),s.id]));
  stage.querySelectorAll('.map-svg text').forEach(label => {
    if(label.closest('[data-sector]')) return;
    const key = names.get(label.textContent.replace(/\s+/g,' ').trim().toUpperCase());
    if(!key) return;
    label.dataset.sector = key;
    label.setAttribute('role','button');
    label.setAttribute('tabindex','0');
    label.classList.add('sector-name');
  });

  function save() {
    try { sessionStorage.setItem(storageKey, JSON.stringify({ packageId: state.packageId, current: state.current, qty: state.qty, selection: state.selection, seats: state.seats })); } catch {}
  }
  const packageNow = () => config.packages.find(p => p.id === state.packageId);
  const priceFor = (key, packageId = state.packageId) => isYas ? config.packages.find(p => p.id === packageId).prices[key] : config.sectors[key].price;
  const available = (key, packageId = state.packageId) => config.sectors[key].left > 0 && (!isYas || !config.packages.find(p => p.id === packageId).unavailable.includes(key));
  function matchesFilter(sector) {
    return state.filter === 'all' || (state.filter === 'premium' ? ['vip', 'business', 'premium'].includes(sector.category) : sector.category === state.filter);
  }
  function notify(message) {
    $('toast').textContent = message;
    $('toast').hidden = false;
    $('live-status').textContent = message;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { $('toast').hidden = true; }, 4500);
  }
  function daysLine() {
    if (!isYas) return 'За один билет';
    const p = packageNow();
    return `${p.dates} · ${p.days} ${p.days === 1 ? 'день' : p.days === 4 ? 'дня' : 'дня'}`;
  }
  function stockText(key) { return available(key) ? `${config.sectors[key].left} билетов в наличии` : 'Нет в продаже'; }
  function weekHtml(p) {
    return '<span class="week-dots" aria-hidden="true">' + ['Ч','П','С','В'].map((d,i) => `<i class="${p.week[i] ? 'on' : ''}">${d}</i>`).join('') + '</span>';
  }
  function renderFilters() {
    $('filter-tabs').innerHTML = config.filters.map(f => `<button type="button" data-filter="${f.id}" class="${state.filter === f.id ? 'active' : ''}" aria-pressed="${state.filter === f.id}">${html(f.name)}</button>`).join('');
  }
  function renderLegend() {
    let chips;
    if (isYas) {
      const matching = Object.values(config.sectors).filter(s => available(s.id) && matchesFilter(s));
      chips = matching.filter(s => s.category !== 'premium').sort((a,b) => priceFor(a.id)-priceFor(b.id)).map(s => ({color:s.color,price:priceFor(s.id),name:s.name.replace(' Grandstand','').replace('General Admission · ','')}));
      const premium = matching.filter(s => s.category === 'premium');
      if(premium.length) chips.push({color:'#7954B4',price:Math.min(...premium.map(s=>priceFor(s.id))),name:'Премиум · от'});
    } else {
      const bands = new Map();
      Object.values(config.sectors).filter(s => available(s.id) && matchesFilter(s)).forEach(s => bands.set(s.price,{color:s.color,price:s.price}));
      chips = [...bands.values()].sort((a,b) => a.price-b.price);
    }
    $('price-legend').innerHTML = chips.map(c => `<span class="price-chip" style="--chip:${c.color}"><i></i>${c.name ? `<small>${html(c.name)}</small>` : ''}${money(c.price)}</span>`).join('');
  }
  function textColor(color) {
    const hex = color.replace('#','');
    const [r,g,b] = [0,2,4].map(i => parseInt(hex.slice(i,i+2),16));
    return (r*299+g*587+b*114)/1000 > 155 ? '#323d36' : '#ffffff';
  }
  function renderMap() {
    stage.querySelectorAll('.sector[data-sector]').forEach(group => {
      const key = group.dataset.sector, sector = config.sectors[key];
      if (!sector) return;
      const canBuy = available(key), filtered = !matchesFilter(sector);
      group.classList.toggle('is-unavailable', !canBuy);
      group.classList.toggle('is-filtered', filtered);
      group.classList.toggle('is-selected', key === state.current);
      group.setAttribute('aria-label', `${sector.name}. ${canBuy ? money(priceFor(key)) + '. ' + stockText(key) : (isYas ? 'Нет в продаже в этом пакете' : 'Нет в продаже')}`);
      group.setAttribute('tabindex', filtered ? '-1' : '0');
      group.setAttribute('aria-pressed', String(key === state.current));
      const color = canBuy ? sector.color : '#c8cec9';
      if (isYas && !stage.querySelector('.yas-reference-map')) {
        group.querySelectorAll('.sec-shape,.zone-shape').forEach(shape => { shape.style.setProperty('fill', color, 'important'); });
      } else if(!isYas) {
        [...group.children].filter(node => ['path','rect','polygon'].includes(node.tagName.toLowerCase())).forEach(shape => {
          shape.style.setProperty('fill', color, 'important');
          shape.style.setProperty('stroke', key === state.current ? '#24353b' : '#ffffff', 'important');
          shape.style.setProperty('stroke-width', key === state.current ? '4' : '2', 'important');
        });
        group.querySelectorAll('text').forEach(text => text.style.setProperty('fill', canBuy ? textColor(color) : '#8b968d', 'important'));
      }
    });
  }
  function renderList() {
    const entries = Object.values(config.sectors).filter(matchesFilter).sort((a,b) => Number(available(b.id))-Number(available(a.id)) || priceFor(a.id)-priceFor(b.id) || a.name.localeCompare(b.name,'ru',{numeric:true}));
    $('sector-list').innerHTML = `<p class="list-summary">${entries.length} ${isYas ? 'зон' : 'секторов'} · ${isYas ? daysLine() + ' · ' : ''}сначала доступные по цене</p>` + (entries.map(s => `<button type="button" class="sector-row ${available(s.id) ? '' : 'is-unavailable'}" data-open-sector="${s.id}" style="--sector:${s.color}"><i class="row-dot"></i><span class="row-info"><strong>${html(s.name)}</strong><small>${html(s.type === 'ga' ? 'Свободное размещение · без кресел' : s.location)}${s.photo.src ? ' · есть вид' : ''}</small></span><span class="row-price"><strong>${available(s.id) ? money(priceFor(s.id)) : 'Нет в продаже'}</strong><small>${available(s.id) ? s.left + ' билетов' : 'Посмотреть варианты'}</small></span><span class="row-arrow" aria-hidden="true">›</span></button>`).join('') || '<p class="empty-state">В этой категории нет предложений.</p>');
  }
  function render() {
    renderFilters(); renderLegend(); renderMap(); renderList(); renderTray();
    const min = Math.min(...Object.keys(config.sectors).filter(k => available(k)).map(k => priceFor(k)));
    if($('event-from')) $('event-from').textContent = 'от ' + money(min);
    $('live-status').textContent = isYas ? `Выбран пакет ${daysLine()}. Цены и доступность обновлены.` : 'Схема загружена.';
  }
  function setView(view) {
    state.view = view;
    $('map-wrap').hidden = view !== 'map';
    $('sector-list').hidden = view !== 'list';
    root.querySelectorAll('[data-view]').forEach(b => { b.classList.toggle('active', b.dataset.view === view); b.setAttribute('aria-pressed', String(b.dataset.view === view)); });
    $('show-list').textContent = view === 'map' ? 'Сравнить сектора списком ↗' : 'Вернуться к схеме ↗';
    hideTooltip();
  }
  function requestPackage(id) {
    if (id === state.packageId) { packageExpanded = false; if (sectorDialog.open) renderModal(); return; }
    if (state.selection) {
      pendingPackage = id;
      $('change-dialog').showModal();
      return;
    }
    applyPackage(id);
  }
  function applyPackage(id) {
    const oldKey = state.current;
    state.packageId = id;
    state.selection = null;
    packageExpanded = false;
    render(); save();
    if (sectorDialog.open) renderModal();
    if (oldKey && !available(oldKey)) notify('В этом пакете сектор недоступен. Выберите другие дни или другую зону.');
    else notify(`Пакет ${daysLine()}. Цены и наличие обновлены.`);
  }
  function openSector(key) {
    if (!config.sectors[key]) return;
    lastFocus = document.activeElement;
    if (state.current !== key) state.qty = state.selection?.key === key ? state.selection.qty : 2;
    state.current = key;
    state.qty = Math.max(1, Math.min(state.qty, config.sectors[key].left || 1));
    modalMode = 'info'; packageExpanded = false;
    renderModal(); renderMap(); hideTooltip(); save();
    if (!sectorDialog.open) sectorDialog.showModal();
  }
  function closeSector() {
    sectorDialog.close();
    lastFocus?.focus?.({ preventScroll: true });
  }
  function placementHtml(sector) {
    if (sector.type === 'ga') return 'Без закреплённых кресел. Место для просмотра в зоне выбираете самостоятельно.';
    if (sector.type === 'seats') return 'Выберите ряд и кресла на схеме. При покупке двух и более билетов <strong>все места будут рядом</strong>.';
    return 'Конкретные кресла назначаются позднее. При покупке двух и более билетов <strong>все места будут рядом</strong>.' + (isYas ? ' Номера кресел по дням могут различаться.' : '');
  }
  function packageInlineHtml() { return ''; }
  function renderModal() {
    const sector = config.sectors[state.current];
    if (!sector) return;
    sectorDialog.classList.toggle('seat-mode',modalMode==='seats');
    $('modal-subtitle').textContent = config.venue + ' · ' + (modalMode === 'seats' ? 'Выбор конкретных мест' : sector.location.split(' · ')[0]);
    $('modal-title').textContent = sector.name;
    sectorDialog.classList.toggle('no-photo', !sector.photo.src || !available(sector.id) || modalMode === 'seats');
    if (!available(sector.id)) { renderUnavailable(sector); return; }
    if (modalMode === 'seats') { renderSeats(); return; }
    const photo = sector.photo;
    const badge = sector.type === 'ga' ? 'Без закреплённых мест' : sector.type === 'seats' ? 'Выбор мест на схеме' : 'Места назначаются позднее';
    $('modal-scroll').innerHTML = `<div class="sector-body">${photo.src ? `<figure class="sector-media"><div class="sector-photo"><img src="${html(photoPath(photo))}" alt="${html(photo.caption)}" width="${photo.width}" height="${photo.height}"><button type="button" class="photo-enlarge" data-enlarge-photo>Увеличить ↗</button></div><figcaption><b>${html(photo.caption)}</b>${photo.kind === 'render' ? ' · 3D-визуализация' : ''}${photo.credit ? ' · ' + html(photo.credit) : ''}</figcaption><p class="photo-disclaimer">${html(photo.note || 'Обзор зависит от ряда и места.')}</p></figure>` : ''}<div class="sector-copy"><span class="placement-badge ${sector.type === 'ga' ? 'ga' : ''}">${html(badge)}</span><p class="sector-description">${html(sector.about)}</p><ul class="sector-features">${sector.feats.map(f => `<li>${html(f)}</li>`).join('')}</ul>${sector.limit ? `<p class="sector-limitation">${html(sector.limit)}</p>` : ''}<details class="sector-details"><summary>Подробнее о размещении</summary><p>${html(sector.details)}</p></details>${packageInlineHtml()}<div class="price-stock"><div><p class="modal-price-label">${isYas ? 'За 1 человека · весь пакет' : 'За один билет'}</p><p class="modal-price">${money(priceFor(sector.id))}</p></div><span class="stock">${sector.left} в наличии</span></div>${sector.type !== 'seats' ? `<div class="qty-section"><label id="qty-label">Количество билетов</label><div class="quantity" aria-labelledby="qty-label"><button type="button" data-qty="-1" aria-label="Уменьшить количество" ${state.qty <= 1 ? 'disabled' : ''}>−</button><output id="quantity">${state.qty}</output><button type="button" data-qty="1" aria-label="Увеличить количество" ${state.qty >= Math.min(sector.left,10) ? 'disabled' : ''}>+</button></div></div>` : ''}<p class="placement-note">${placementHtml(sector)}</p></div></div>`;
    renderModalFooter();
  }
  function renderUnavailable(sector) {
    const alternatives = isYas ? config.packages.filter(p => available(sector.id,p.id)) : [];
    $('modal-scroll').innerHTML = `<div class="unavailable-body"><div class="unavailable-mark" aria-hidden="true">−</div><h3>${alternatives.length ? 'Нет в выбранном пакете' : 'Сейчас нет билетов'}</h3><p>${alternatives.length ? `Выбраны ${html(daysLine())}. Эта зона доступна на другие даты:` : 'В этом секторе нет доступных билетов. Можно посмотреть другие зоны на схеме или сравнить предложения в списке.'}</p><div class="alternative-packages">${alternatives.map(p => `<button type="button" class="alternative-package" data-package="${p.id}"><span><strong>${html(p.short + ' · ' + p.dates)}</strong><small>Переключить пакет</small></span><b>${money(priceFor(sector.id,p.id))}</b></button>`).join('')}</div><button type="button" class="button button-outline unavailable-return" data-return-map>Выбрать другой сектор</button></div>`;
    $('modal-footer').innerHTML = '<p class="footer-caption">Выбор карты и масштаб сохранены.</p><button type="button" class="button button-outline" data-return-map>Вернуться к схеме</button>';
  }
  function seatSelection() { return state.seats[state.current] || []; }
  function contiguous(seats = seatSelection()) {
    return window.DomBiletSeats.adjacent(seats);
  }
  async function renderSeats() {
    const key=state.current,sector=config.sectors[key];
    sectorDialog.classList.add('seat-mode');
    $('modal-scroll').innerHTML=`<div class="seat-body"><button class="seat-back" type="button" data-back-info>← Назад к описанию сектора</button><div class="seat-intro"><span>Ряды и места сектора ${key}</span><div class="seat-legend"><span><i></i>${money(priceFor(key))}</span><span><i class="taken"></i>недоступно</span><span><i class="chosen"></i>выбрано</span></div></div><div class="seat-map-stage" id="seat-map-stage" tabindex="0" aria-label="Схема мест сектора"><p class="seat-loading" role="status">Загружаем схему сектора…</p><div class="seat-map-controls"><button type="button" data-seat-zoom="in" aria-label="Увеличить места">+</button><button type="button" data-seat-zoom="out" aria-label="Уменьшить места">−</button><button type="button" data-seat-zoom="fit" aria-label="Все места сектора">↺</button></div><div class="seat-hover" hidden></div></div><p class="seats-help">Увеличивайте и перемещайте схему. Для двух и более билетов выберите соседние кресла в одном ряду, без прохода.</p><p class="seat-status" role="status">${html(seatStatus(seatSelection()))}</p></div>`;
    renderModalFooter();
    try {
      await window.DomBiletSeats.mount($('seat-map-stage'),{key,count:sector.left,price:money(priceFor(key)),selected:seatSelection(),onLimit:()=>notify('В одном заказе можно выбрать до 10 билетов.'),onChange:(selected,initial)=>{
        if(state.current!==key)return;
        state.seats[key]=selected;
        if(!initial)state.selection=selected.length&&contiguous(selected)?{key,qty:selected.length,type:'seats',packageId:state.packageId}:null;
        const status=sectorDialog.querySelector('.seat-status');
        if(status){status.textContent=seatStatus(selected);status.classList.toggle('is-error',!contiguous(selected));}
        renderModalFooter();renderTray();save();
      }});
    }catch(error){
      const status=$('seat-map-stage')?.querySelector('.seat-loading');
      if(status)status.innerHTML='Не удалось загрузить места. <button type="button" data-retry-seats>Попробовать ещё раз</button>';
    }
  }
  function seatStatus(chosen) {
    if (!chosen.length) return 'Выберите ряд и места на схеме сектора.';
    if (!contiguous(chosen)) return 'Выберите соседние кресла в одном ряду, без прохода между ними.';
    return `Ряд ${chosen[0].row} · ${chosen.length === 1 ? 'место' : 'места'} ${chosen.map(s=>s.seat).sort((a,b)=>a-b).join(', ')}${chosen.length > 1 ? ' · рядом' : ''}`;
  }
  function renderModalFooter() {
    const sector = config.sectors[state.current], chosen = seatSelection();
    const seatsMode = sector.type === 'seats';
    const qty = seatsMode ? chosen.length : state.qty;
    const total = priceFor(sector.id)*qty;
    let caption = isYas ? `Итого за ${qty} ${qty === 1 ? 'билет' : 'билета'} · весь пакет` : seatsMode && qty ? seatStatus(chosen) : 'За один билет';
    if (seatsMode && modalMode === 'info') caption = chosen.length ? seatStatus(chosen) : 'За один билет · точная сумма после выбора мест';
    const buttonLabel = seatsMode && modalMode === 'info' ? (chosen.length ? 'Посмотреть места →' : 'Выбрать места →') : 'Продолжить покупку →';
    $('modal-footer').innerHTML = `<div><strong class="footer-total">${qty ? money(total) : 'от ' + money(priceFor(sector.id))}</strong><span class="footer-caption">${html(caption)}</span></div><button type="button" class="button button-primary" data-modal-continue ${seatsMode && modalMode === 'seats' && (!chosen.length || !contiguous(chosen)) ? 'disabled' : ''}>${buttonLabel}</button>`;
  }
  function setQuantity(delta) {
    const sector = config.sectors[state.current];
    state.qty = Math.max(1, Math.min(10, sector.left, state.qty+delta));
    state.selection = { key: state.current, qty: state.qty, packageId: state.packageId, type: sector.type };
    const output = $('quantity');
    if (output) output.textContent = state.qty;
    sectorDialog.querySelector('[data-qty="-1"]').disabled = state.qty <= 1;
    sectorDialog.querySelector('[data-qty="1"]').disabled = state.qty >= Math.min(sector.left,10);
    renderModalFooter(); renderTray(); save();
    $('live-status').textContent = `${state.qty} билета, ${money(priceFor(sector.id)*state.qty)}`;
  }
  function continueSelection() {
    const sector = config.sectors[state.current];
    if (sector.type === 'seats' && modalMode === 'info') { modalMode = 'seats'; renderModal(); $('modal-scroll').scrollTop = 0; return; }
    if (sector.type === 'seats' && (!seatSelection().length || !contiguous())) return;
    const qty = sector.type === 'seats' ? seatSelection().length : state.qty;
    state.selection = {key:sector.id,qty,type:sector.type,packageId:state.packageId};
    save(); renderTray();
    closeSector();
  }
  function checkoutSelection() {
    const selection=state.selection;
    if(!selection)return;
    const sector=config.sectors[selection.key],qty=selection.qty;
    const chosen=state.seats[selection.key]||[];
    const payload={venue:config.key,sectorId:sector.id,qty,price:priceFor(sector.id),total:qty*priceFor(sector.id),package:isYas?{...packageNow()}:null,seats:sector.type==='seats'?[...chosen]:[]};
    if(typeof window.DomBiletScheme?.onContinue==='function'){window.DomBiletScheme.onContinue(payload);return;}
    $('review-content').innerHTML=`<div class="review-details"><strong>${html(config.title)}</strong><p>${html(sector.name)}</p><p>${sector.type==='seats'?html(seatStatus(chosen)):qty+' билета · '+(sector.type==='ga'?'без закреплённых кресел':'места назначаются позднее')}</p><p class="review-total">${money(payload.total)}</p><p>${qty} × ${money(payload.price)}</p></div>`;
    if(sectorDialog.open)sectorDialog.close();
    $('review-dialog').showModal();
  }
  const nativeCart=document.querySelector('.page__bottom-cart');
  if(nativeCart)nativeCart.dataset.schemeCart='';
  const setText=(element,value)=>{if(element&&element.textContent!==String(value))element.textContent=String(value);};
  const setDisplay=(element,value)=>{if(element&&element.style.display!==value)element.style.display=value;};
  function renderTray() {
    const selection=state.selection;
    $('selection-tray').hidden=true;
    if(nativeCart){
      setDisplay(nativeCart,selection?'block':'none');
      nativeCart.setAttribute('aria-label','Выбранные билеты');
      document.querySelectorAll('.cart-count-products').forEach(e=>setText(e,selection?selection.qty:0));
      if(!selection)return;
      setText(document.getElementById('all_tickets'),'Выбрано билетов: '+selection.qty);
      setText(document.getElementById('all_tickets_sum'),new Intl.NumberFormat('ru-RU').format(priceFor(selection.key)*selection.qty));
      setDisplay(nativeCart.querySelector('.tickets_sum'),'flex');
      setText(nativeCart.querySelector('#total_sum span'),new Intl.NumberFormat('ru-RU').format(priceFor(selection.key)*selection.qty));
    }else if(selection){
      $('selection-tray').hidden=false;
      $('tray-label').textContent='Выбрано билетов: '+selection.qty;
      $('tray-total').textContent=money(priceFor(selection.key)*selection.qty);
    }
  }
  if(nativeCart){
    const cartObserver=new MutationObserver(renderTray);
    [nativeCart,...document.querySelectorAll('.cart-count-products')].forEach(element=>cartObserver.observe(element,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['style']}));
  }
  if(nativeCart)document.addEventListener('click',event=>{
    if(!event.target.closest('.page__bottom-cart'))return;
    if(event.target.closest('.cart-bottom__btn-clear')){
      event.preventDefault();event.stopImmediatePropagation();$('clear-selection').click();
    }else if(event.target.closest('.actions-cart-bottom')){
      event.preventDefault();event.stopImmediatePropagation();checkoutSelection();
    }
  },true);
  function currentView() { return [...views.values()].find(v=>getComputedStyle(v.svg).display!=='none') || [...views.values()][0]; }
  function constrain(view, box) {
    const base = view.initial;
    const factor = Math.max(.22,Math.min(1,box[2]/base[2]));
    box[2] = base[2]*factor; box[3] = base[3]*factor;
    box[0] = Math.max(base[0],Math.min(base[0]+base[2]-box[2],box[0]));
    box[1] = Math.max(base[1],Math.min(base[1]+base[3]-box[3],box[1]));
    return box;
  }
  function applyView(view, box) {
    view.current = constrain(view,box);
    view.svg.setAttribute('viewBox',view.current.map(n=>n.toFixed(2)).join(' '));
    if (view === currentView()) $('map-scale').textContent = Math.round(view.initial[2]/view.current[2]*100)+'%';
  }
  function animateView(view, target) {
    cancelAnimationFrame(animation);
    target=constrain(view,target); const start=[...view.current],t0=performance.now();
    const duration=matchMedia('(prefers-reduced-motion: reduce)').matches?0:240;
    function tick(now) {
      const t=duration?Math.min(1,(now-t0)/duration):1, ease=1-Math.pow(1-t,3);
      applyView(view,start.map((n,i)=>n+(target[i]-n)*ease));
      if(t<1)animation=requestAnimationFrame(tick);
    }
    animation=requestAnimationFrame(tick);
  }
  function pointInSvg(view,x,y) {
    const matrix=view.svg.getScreenCTM();
    return matrix ? new DOMPoint(x,y).matrixTransform(matrix.inverse()) : new DOMPoint();
  }
  function zoom(factor,x,y,animated=true) {
    const view=currentView(),box=[...view.current],rect=view.svg.getBoundingClientRect();
    const center=pointInSvg(view,x??rect.x+rect.width/2,y??rect.y+rect.height/2);
    const w=Math.min(view.initial[2],Math.max(view.initial[2]*.22,box[2]*factor)),ratio=w/box[2];
    const next=[center.x-(center.x-box[0])*ratio,center.y-(center.y-box[1])*ratio,w,box[3]*ratio];
    if(animated) animateView(view,next); else applyView(view,next);
  }
  function hideTooltip() {
    $('map-tooltip').hidden=true;
    stage.querySelectorAll('.is-hovered').forEach(n=>n.classList.remove('is-hovered'));
  }
  function showTooltip(group,event) {
    const key=group.dataset.sector,sector=config.sectors[key];
    if(!sector||!matchesFilter(sector)||event.pointerType==='touch')return;
    stage.querySelectorAll('.is-hovered').forEach(n=>n.classList.remove('is-hovered'));
    group.classList.add('is-hovered');
    const tip=$('map-tooltip');
    tip.innerHTML=`<strong>${html(sector.name)}</strong><span class="tooltip-price">${available(key)?money(priceFor(key)): 'Нет в продаже'}</span><p class="tooltip-stock">${html(stockText(key))}</p>`;
    tip.hidden=false;
    const rect=stage.getBoundingClientRect();
    const gx=event.clientX-rect.x,gy=event.clientY-rect.y;
    tip.style.left=Math.max(8,Math.min(rect.width-tip.offsetWidth-8,gx+16))+'px';
    tip.style.top=Math.max(8,Math.min(rect.height-tip.offsetHeight-8,gy-70))+'px';
  }
  function nearby(x,y) {
    $('nearby-title').textContent='Какой сектор открыть?';
    $('nearby-dialog').querySelector('.eyebrow').textContent='Рядом несколько секторов';
    const svg=currentView().svg;
    const candidates=[...svg.querySelectorAll('.sector[data-sector]')].filter(g=>matchesFilter(config.sectors[g.dataset.sector])).map(g=>{
      const r=g.getBoundingClientRect();
      const dx=Math.max(r.left-x,0,x-r.right),dy=Math.max(r.top-y,0,y-r.bottom);
      return {key:g.dataset.sector,distance:Math.hypot(dx,dy)};
    }).filter(c=>c.distance<24).sort((a,b)=>a.distance-b.distance).slice(0,3);
    if(!candidates.length)return;
    if(candidates.length===1){openSector(candidates[0].key);return;}
    $('nearby-options').innerHTML=candidates.map(({key})=>`<button type="button" data-open-sector="${key}"><span>${html(config.sectors[key].name)}</span><b>${available(key)?money(priceFor(key)):'Нет билетов'}</b></button>`).join('');
    $('nearby-dialog').showModal();
  }
  function openOfferGroup(key) {
    const group=config.catalogGroups?.[key];
    if(!group)return;
    $('nearby-title').textContent=group.name;
    $('nearby-dialog').querySelector('.eyebrow').textContent='Зоны из последней схемы';
    $('nearby-options').innerHTML=group.keys.map(id=>`<button type="button" data-open-sector="${id}"><span>${html(config.sectors[id].name)}</span><b>${available(id)?money(priceFor(id)):'Нет билетов'}</b></button>`).join('');
    $('nearby-dialog').showModal();
  }
  stage.addEventListener('pointerdown',event=>{
    if(event.target.closest('button')||event.button>0)return;
    cancelAnimationFrame(animation);hideTooltip();
    const view=currentView();
    pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
    if(pointers.size===1)gesture={view,startX:event.clientX,startY:event.clientY,start:[...view.current],target:event.target.closest('[data-sector]'),offer:event.target.closest('[data-offer-group]')?.dataset.offerGroup,moved:false,pinched:false};
    if(pointers.size===2){const [a,b]=[...pointers.values()];pinch={distance:Math.hypot(a.x-b.x,a.y-b.y),width:view.current[2]};gesture.pinched=true;}
    stage.setPointerCapture(event.pointerId);
  });
  stage.addEventListener('pointermove',event=>{
    if(!pointers.has(event.pointerId)){
      const group=event.target.closest('[data-sector]');
      if(group)showTooltip(group,event);else hideTooltip();
      return;
    }
    pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
    if(pointers.size===2 && pinch){
      const [a,b]=[...pointers.values()],distance=Math.hypot(a.x-b.x,a.y-b.y);
      const factor=(pinch.width*pinch.distance/distance)/currentView().current[2];
      zoom(factor,(a.x+b.x)/2,(a.y+b.y)/2,false);return;
    }
    if(!gesture||gesture.pinched)return;
    const dx=event.clientX-gesture.startX,dy=event.clientY-gesture.startY;
    if(Math.hypot(dx,dy)<6&&!gesture.moved)return;
    gesture.moved=true;
    const scale=gesture.view.svg.getScreenCTM()?.a;
    const matrix=gesture.view.svg.getScreenCTM();
    const unit=matrix?Math.hypot(matrix.a,matrix.b):Math.abs(scale||1);
    applyView(gesture.view,[gesture.start[0]-dx/unit,gesture.start[1]-dy/unit,gesture.start[2],gesture.start[3]]);
  });
  function pointerEnd(event,cancelled=false){
    const wasPointer=pointers.delete(event.pointerId);
    if(!wasPointer)return;
    if(!pointers.size){
      if(gesture&&!gesture.moved&&!gesture.pinched&&!cancelled){
        const key=gesture.target?.dataset.sector;
        if(gesture.offer)openOfferGroup(gesture.offer);
        else if(key && matchesFilter(config.sectors[key]))openSector(key);
        else if(event.pointerType==='touch')nearby(event.clientX,event.clientY);
      }
      gesture=null;pinch=null;
    }
  }
  stage.addEventListener('pointerup',e=>pointerEnd(e));
  stage.addEventListener('pointercancel',e=>pointerEnd(e,true));
  stage.addEventListener('pointerleave',()=>{if(!pointers.size)hideTooltip();});
  stage.addEventListener('wheel',event=>{
    if(!event.ctrlKey&&!event.metaKey)return;
    event.preventDefault();zoom(event.deltaY>0?1.12:.89,event.clientX,event.clientY,false);
  },{passive:false});
  stage.addEventListener('keydown',event=>{
    const offer=event.target.closest('[data-offer-group]');
    if(offer&&['Enter',' '].includes(event.key)){event.preventDefault();openOfferGroup(offer.dataset.offerGroup);return;}
    const group=event.target.closest('[data-sector]');
    if(group&&['Enter',' '].includes(event.key)){event.preventDefault();openSector(group.dataset.sector);}
    else if(['+','='].includes(event.key)){event.preventDefault();zoom(.8);}
    else if(event.key==='-'){event.preventDefault();zoom(1.25);}
  });
  $('zoom-in').addEventListener('click',()=>zoom(.8));
  $('zoom-out').addEventListener('click',()=>zoom(1.25));
  $('show-list').addEventListener('click',()=>setView(state.view==='map'?'list':'map'));
  root.querySelectorAll('[data-view]').forEach(button=>button.addEventListener('click',()=>setView(button.dataset.view)));
  root.addEventListener('click',event=>{
    const target=event.target.closest('button');
    if(!target)return;
    if(target.dataset.package){requestPackage(target.dataset.package);return;}
    if(target.dataset.filter){state.filter=target.dataset.filter;renderFilters();renderLegend();renderMap();renderList();return;}
    if(target.dataset.openSector){if($('nearby-dialog').open)$('nearby-dialog').close();openSector(target.dataset.openSector);return;}
    if(target.dataset.close){$(target.dataset.close).close();return;}
    if(target.hasAttribute('data-qty')){setQuantity(Number(target.dataset.qty));return;}
    if(target.hasAttribute('data-return-map')){closeSector();setView('map');return;}
    if(target.hasAttribute('data-back-info')){modalMode='info';renderModal();return;}
    if(target.hasAttribute('data-modal-continue')){continueSelection();return;}
    if(target.hasAttribute('data-retry-seats')){renderSeats();return;}
    if(target.hasAttribute('data-change-package')){packageExpanded=!packageExpanded;renderModal();return;}
    if(target.hasAttribute('data-enlarge-photo')){
      const photo=config.sectors[state.current].photo;
      $('full-photo').src=photoPath(photo);$('full-photo').alt=photo.caption;
      $('full-photo-caption').textContent=photo.caption+' · '+(photo.note||'');
      $('photo-dialog').showModal();
    }
  });
  $('confirm-package').addEventListener('click',()=>{$('change-dialog').close();if(pendingPackage)applyPackage(pendingPackage);pendingPackage=null;});
  $('close-sector').addEventListener('click',closeSector);
  $('how-to')?.addEventListener('click',()=>{$('help-dialog').showModal();});
  $('resume-selection').addEventListener('click',checkoutSelection);
  $('clear-selection').addEventListener('click',()=>{state.selection=null;state.seats={};state.current=null;renderTray();renderMap();save();notify('Выбор сброшен.');});
  root.querySelectorAll('dialog').forEach(dialog=>{
    dialog.addEventListener('click',event=>{
      if(event.target!==dialog)return;
      const rect=dialog.getBoundingClientRect();
      if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.close();
    });
    dialog.addEventListener('close',()=>{if(dialog===sectorDialog)hideTooltip();});
  });
  let touchStartY=0;
  $('sector-dialog').querySelector('.modal-header').addEventListener('touchstart',event=>{touchStartY=event.touches[0].clientY;},{passive:true});
  $('sector-dialog').querySelector('.modal-header').addEventListener('touchend',event=>{if(event.changedTouches[0].clientY-touchStartY>100)closeSector();},{passive:true});
  const hero=config.sectors[config.hero].photo;
  if(hero.src && $('event-visual'))$('event-visual').style.backgroundImage=`url("${photoPath(hero)}")`;
  window.DomBiletScheme={...(window.DomBiletScheme||{}),open:openSector,clear:()=>{$('clear-selection').click();}};
  const phoneLayout=matchMedia('(max-width:760px)');
  function fitLayout(){
    views.forEach(view=>{view.initial=phoneLayout.matches&&!isYas?[-15,-60,1000,850]:[...view.landscape];applyView(view,[...view.initial]);});
  }
  phoneLayout.addEventListener('change',fitLayout);
  fitLayout();
  render(); setView('map');
})();
