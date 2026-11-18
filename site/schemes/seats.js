/* Original seat geometry, loaded one sector at a time. Stock is a local fixture. */
window.DomBiletSeats = (() => {
  const sources = new Map(), views = new Map();
  const keyOf = seat => String(seat.row)+':'+seat.seat;
  function adjacent(selected) {
    if(!selected.length)return true;
    const nums=selected.map(s=>s.seat).sort((a,b)=>a-b);
    return new Set(selected.map(s=>String(s.row))).size===1 && new Set(selected.map(s=>String(s.block))).size===1 && nums.at(-1)-nums[0]+1===nums.length;
  }
  async function mount(stage,options) {
    const {key,count,price,onChange,onLimit}=options;
    if(!sources.has(key))sources.set(key,fetch(`../schemes/assets/seats/k${key}.svg`).then(r=>{if(!r.ok)throw Error('SVG unavailable');return r.text();}).catch(e=>{sources.delete(key);throw e;}));
    const source=await sources.get(key);
    if(!stage.isConnected)return;
    const parsed=new DOMParser().parseFromString(source,'image/svg+xml');
    if(parsed.querySelector('parsererror'))throw Error('Invalid SVG');
    const svg=document.importNode(parsed.documentElement,true);
    stage.querySelector('.seat-loading')?.remove();stage.prepend(svg);
    const base=svg.getAttribute('viewBox').split(/[ ,]+/).map(Number);
    const seats=[...svg.querySelectorAll('.seat-node')].map(node=>{
      const b=node.querySelector('rect').getBBox();
      return {node,row:node.dataset.row,seat:Number(node.dataset.seat),block:node.dataset.block,x:b.x+b.width/2,y:b.y+b.height/2};
    });
    let selected=(options.selected||[]).map(s=>seats.find(n=>keyOf(n)===keyOf(s))).filter(Boolean).map(({row,seat,block})=>({row,seat,block}));
    const cx=base[0]+base[2]/2,cy=base[1]+base[3]/2;
    const ranked=[...seats].sort((a,b)=>Math.hypot(a.x-cx,(a.y-cy)*2)-Math.hypot(b.x-cx,(b.y-cy)*2));
    const free=new Set(selected.map(keyOf));
    for(const n of ranked){if(free.size>=count)break;free.add(keyOf(n));}
    for(const s of seats){
      s.available=free.has(keyOf(s));
      s.node.dataset.available=String(s.available);
      s.node.setAttribute('aria-disabled',String(!s.available));
      s.node.setAttribute('tabindex',s.available?'0':'-1');
      s.node.setAttribute('aria-label',`Ряд ${s.row}, место ${s.seat}. ${s.available?price:'Недоступно'}`);
    }
    function paint(){
      for(const s of seats){
        const chosen=selected.some(n=>keyOf(n)===keyOf(s));
        s.node.setAttribute('aria-pressed',String(chosen));
        const rect=s.node.querySelector('rect');
        rect.style.setProperty('fill',chosen?'#f58b24':s.available?'#fff0dc':'#eff1ec','important');
        rect.style.setProperty('stroke',chosen?'#cc6f14':s.available?'#e6a04e':'#d9dfd3','important');
        for(const text of s.node.querySelectorAll('text'))text.style.setProperty('fill',chosen?'#ffffff':s.available?'#a16721':'#bac3b2','important');
      }
    }
    function pick(node){
      const seat=seats.find(s=>s.node===node);
      if(!seat?.available)return;
      const index=selected.findIndex(s=>keyOf(s)===keyOf(seat));
      if(index===-1&&selected.length>=Math.min(count,10)){onLimit?.();return;}
      if(index===-1)selected.push({row:seat.row,seat:seat.seat,block:seat.block});else selected.splice(index,1);
      paint();onChange(selected.map(s=>({...s})));
    }
    const bounds=stage.getBoundingClientRect();
    let view=views.get(key);
    if(!view){
      const center=selected.length?seats.filter(s=>selected.some(n=>keyOf(s)===keyOf(n))):ranked.slice(0,count);
      const x=center.reduce((sum,n)=>sum+n.x,0)/center.length,y=center.reduce((sum,n)=>sum+n.y,0)/center.length;
      const w=innerWidth<=760?Math.min(base[2],bounds.width/1.35):base[2];
      const h=innerWidth<=760?Math.min(base[3]+50,bounds.height/1.35):base[3];
      view={box:innerWidth<=760?[Math.max(base[0],x-w/2),Math.max(base[1]-20,y-h/2),w,h]:[...base]};
      views.set(key,view);
    }
    function apply(box){
      const w=box[2],h=box[3];
      box[0]=Math.max(base[0]-w*.15,Math.min(base[0]+base[2]-w*.85,box[0]));
      box[1]=Math.max(base[1]-h*.15,Math.min(base[1]+base[3]-h*.85,box[1]));
      view.box=box;svg.setAttribute('viewBox',box.map(n=>n.toFixed(2)).join(' '));
    }
    const point=(x,y)=>new DOMPoint(x,y).matrixTransform(svg.getScreenCTM().inverse());
    function zoom(factor,x,y){
      const r=stage.getBoundingClientRect(),p=point(x??r.x+r.width/2,y??r.y+r.height/2),b=view.box;
      const w=Math.min(base[2]*1.12,Math.max(90,b[2]*factor)),ratio=w/b[2];
      apply([p.x-(p.x-b[0])*ratio,p.y-(p.y-b[1])*ratio,w,b[3]*ratio]);
    }
    const active=new Map();let drag=null,pinch=null;
    stage.addEventListener('pointerdown',e=>{
      if(e.target.closest('button'))return;
      active.set(e.pointerId,{x:e.clientX,y:e.clientY});
      if(active.size===1)drag={x:e.clientX,y:e.clientY,box:[...view.box],target:e.target.closest('.seat-node'),moved:false,pinched:false};
      if(active.size===2){const[a,b]=[...active.values()];pinch={distance:Math.hypot(a.x-b.x,a.y-b.y),width:view.box[2]};drag.pinched=true;}
      stage.setPointerCapture(e.pointerId);
    });
    stage.addEventListener('pointermove',e=>{
      if(!active.has(e.pointerId)){
        const node=e.target.closest('.seat-node'),tip=stage.querySelector('.seat-hover');
        tip.hidden=!node;
        if(node)tip.textContent=`Ряд ${node.dataset.row} · место ${node.dataset.seat} · ${node.dataset.available==='true'?price:'недоступно'}`;
        return;
      }
      active.set(e.pointerId,{x:e.clientX,y:e.clientY});
      if(active.size===2&&pinch){const[a,b]=[...active.values()];zoom((pinch.width*pinch.distance/Math.hypot(a.x-b.x,a.y-b.y))/view.box[2],(a.x+b.x)/2,(a.y+b.y)/2);return;}
      if(!drag||drag.pinched)return;
      const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
      if(Math.hypot(dx,dy)<6&&!drag.moved)return;drag.moved=true;
      const matrix=svg.getScreenCTM(),unit=Math.hypot(matrix.a,matrix.b);
      apply([drag.box[0]-dx/unit,drag.box[1]-dy/unit,drag.box[2],drag.box[3]]);
    });
    function end(e,cancelled){
      if(!active.delete(e.pointerId))return;
      if(!active.size){
        if(drag&&!drag.moved&&!drag.pinched&&!cancelled){
          let node=drag.target;
          if(!node){const p=point(e.clientX,e.clientY),m=svg.getScreenCTM(),scale=Math.hypot(m.a,m.b),n=seats.filter(s=>s.available).map(s=>({...s,d:Math.hypot(p.x-s.x,p.y-s.y)*scale})).sort((a,b)=>a.d-b.d)[0];if(n?.d<15)node=n.node;}
          if(node)pick(node);
        }
        drag=null;pinch=null;
      }
    }
    stage.addEventListener('pointerup',e=>end(e,false));
    stage.addEventListener('pointercancel',e=>end(e,true));
    stage.addEventListener('pointerleave',()=>{stage.querySelector('.seat-hover').hidden=true;});
    stage.addEventListener('wheel',e=>{if(!e.ctrlKey&&!e.metaKey)return;e.preventDefault();zoom(e.deltaY>0?1.15:.87,e.clientX,e.clientY);},{passive:false});
    stage.querySelectorAll('[data-seat-zoom]').forEach(b=>b.addEventListener('click',()=>b.dataset.seatZoom==='fit'?apply([...base]):zoom(b.dataset.seatZoom==='in'?.75:1.33)));
    stage.addEventListener('keydown',e=>{
      const node=e.target.closest('.seat-node');
      if(node&&['Enter',' '].includes(e.key)){e.preventDefault();pick(node);}
      if(['+','='].includes(e.key)){e.preventDefault();zoom(.75);}
      if(e.key==='-'){e.preventDefault();zoom(1.33);}
    });
    apply(view.box);paint();
    onChange(selected.map(s=>({...s})),true);
    return { svg, adjacent:()=>adjacent(selected), selected:()=>selected.map(s=>({...s})) };
  }
  return {mount,adjacent};
})();
