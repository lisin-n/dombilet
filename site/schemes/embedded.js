(() => {
  const host=document.getElementById('dombilet-scheme-host');
  if(!host)return;
  const venue=host.dataset.venue;
  const base=new URL('.',document.currentScript.src);
  const shadow=host.attachShadow({mode:'open'});
  const version='26';
  function script(file){return new Promise((resolve,reject)=>{const tag=document.createElement('script');tag.src=new URL(file+'?v='+version,base).href;tag.onload=resolve;tag.onerror=reject;document.body.append(tag);});}

  function mountMobileScheme() {
    const card = shadow.getElementById('map-card');
    const mobile = matchMedia('(max-width: 760px)');
    const preview = document.createElement('div');
    preview.className = 'mobile-scheme-preview';
    preview.innerHTML = '<button class="button button-primary mobile-scheme-open" type="button" aria-haspopup="dialog">Выбрать билеты</button>';
    const opener = preview.querySelector('button');
    card.before(preview);
    preview.prepend(card);

    const dialog = document.createElement('dialog');
    dialog.className = 'mobile-scheme-dialog';
    dialog.setAttribute('aria-labelledby', 'mobile-scheme-title');
    dialog.innerHTML = `
      <header class="mobile-scheme-header">
        <h2 id="mobile-scheme-title">Выбор билетов</h2>
        <button class="close-button" type="button" aria-label="Закрыть схему" autofocus>×</button>
      </header>
      <div class="mobile-scheme-content"></div>
      <slot name="mobile-scheme-cart"></slot>`;
    shadow.append(dialog);
    const content = dialog.querySelector('.mobile-scheme-content');
    const close = dialog.querySelector('button');
    const cart = document.querySelector('.page__bottom-cart');
    const cartHome = document.createComment('Ticket cart');
    cart?.before(cartHome);

    function updateLayout() {
      if (!mobile.matches && dialog.open) dialog.close();
      card.inert = mobile.matches && !dialog.open;
    }

    opener.addEventListener('click', () => {
      if (!mobile.matches || dialog.open) return;
      preview.style.minHeight = preview.offsetHeight + 'px';
      card.inert = false;
      content.append(card);
      if (cart) {
        cart.slot = 'mobile-scheme-cart';
        host.append(cart);
      }
      dialog.showModal();
      content.scrollTop = 0;
    });
    close.addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => {
      preview.prepend(card);
      preview.style.minHeight = '';
      if (cart) {
        cart.removeAttribute('slot');
        cartHome.after(cart);
      }
      updateLayout();
      if (mobile.matches) opener.focus({preventScroll:true});
    });
    mobile.addEventListener('change', updateLayout);
    updateLayout();
    return {mobile, preview};
  }

  async function start(){
    const response=await fetch(new URL('widget-'+venue+'.html?v='+version,base),{cache:'no-store'});
    if(!response.ok)throw Error('Widget unavailable');
    const markup=await response.text();
    const style=document.createElement('link');style.rel='stylesheet';style.href=new URL('styles.css?v='+version,base).href;
    const loaded=new Promise((resolve,reject)=>{style.onload=resolve;style.onerror=reject;});
    shadow.append(style);
    const cartStyle=document.createElement('link');cartStyle.rel='stylesheet';cartStyle.href=new URL('native-cart.css?v='+version,base).href;document.head.append(cartStyle);
    const container=document.createElement('div');container.innerHTML=markup;shadow.append(container);
    const scoped=document.createElement('style');
    scoped.textContent=`:host{--ink:#252a2b;--muted:#777d83;--orange:#f58b24;--orange-dark:#da6a0c;--line:#e8e9e8;--bg:#eeeff2;--surface:#fff;--font:Manrope,Arial,sans-serif;display:block;color:var(--ink);font:500 15px/1.5 var(--font);padding:0 0 24px;scroll-margin-top:100px}.widget-root{width:100%;min-width:0}.widget-heading{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:0 0 7px;padding:0 3px}.widget-heading>strong{font-size:15px;font-weight:800}.widget-heading nav{display:flex;gap:5px}.widget-heading a{font-size:10px;padding:7px 10px;border:1px solid #dfe2de;border-radius:7px;background:#ffffff70;color:#8a9287}.widget-heading a[aria-current]{color:#d57c23;border-color:#efcc9e;background:#fff8ef}.widget-demo{font-size:10px;color:#939b8d;margin:0 3px 13px}.map-card{scroll-margin-top:100px}.selection-tray{z-index:4000}.map-svg .sector-name{pointer-events:auto;cursor:pointer}.catalog-marker:focus-visible rect{stroke:#f58b24;stroke-width:4}.nearby-options button{gap:15px}.nearby-options button b{white-space:nowrap}.krasnodar-svg #west_tribune .cls-1{fill:#5386a0!important}.krasnodar-svg #south_tribune .cls-3{fill:#c5ab53!important}.krasnodar-svg #north_tribune .cls-4{fill:#73955a!important}.krasnodar-svg #east_tribune .cls-5{fill:#bd7a73!important}@media(max-width:760px){:host{padding-bottom:12px}.widget-heading{flex-wrap:wrap;gap:8px}.widget-heading>strong{font-size:13px}.widget-heading a{padding:6px 8px;font-size:9px}.widget-demo{font-size:9px}.selection-tray{bottom:10px}.map-caption{font-size:8px}}`;
    shadow.append(scoped);
    await loaded;
    const {mobile, preview} = mountMobileScheme();
    window.DOMBILET_WIDGET_ROOT=shadow;
    window.DOMBILET_WIDGET_VENUE=venue;
    await script('data.js');
    await script('seats.js');
    await script('app.js');
    let overflow=null;
    const observer=new MutationObserver(()=>{
      const opened=!!shadow.querySelector('dialog[open]');
      if(opened&&overflow===null){overflow=document.body.style.overflow;document.body.style.overflow='hidden';}
      if(!opened&&overflow!==null){document.body.style.overflow=overflow;overflow=null;}
    });
    shadow.querySelectorAll('dialog').forEach(dialog=>observer.observe(dialog,{attributes:true,attributeFilter:['open']}));
    document.addEventListener('click', event => {
      if (!event.target.closest('.obzor-box__btn[data-scroll-to]')) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      const target = mobile.matches ? preview : shadow.getElementById('map-stage');
      target.scrollIntoView({behavior:'smooth', block:'center'});
      if (mobile.matches) preview.querySelector('button.mobile-scheme-open').focus({preventScroll:true});
    }, true);
  }
  start().catch(()=>{shadow.innerHTML='<p style="padding:24px;font:15px Manrope,Arial,sans-serif">Не удалось открыть схему. Обновите страницу.</p>';});
})();
