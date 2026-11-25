'use strict';
const $=s=>document.querySelector(s), main=$('#main'), modal=$('#modal'), content=$('#content');
const units=[
 {name:'Scania R 450',image:'scania',type:'Camiones',desc:'2020 · Tractor 4×2',spec:{Modelo:'R 450',Año:'2020',Kilometraje:'612.000 km',Tracción:'4×2'},pics:[['scania','Exterior'],['giro-2','Lateral'],['giro-4','Trasera'],['cabina','Cabina']]},
 {name:'Acoplado cerealero',image:'cerealero',type:'Acoplados',desc:'Carga a granel · 3 ejes',spec:{Carrocería:'Cerealera',Ejes:'3'},pics:[['cerealero','Exterior']]},
 {name:'Semirremolque sider',image:'sider',type:'Semirremolques',desc:'Cortina lateral · 13,50 m',spec:{Carrocería:'Sider',Longitud:'13,50 m'},pics:[['sider','Exterior']]},
 {name:'Mercedes-Benz Axor 1933',image:'axor',type:'Camiones',desc:'2018 · Tractor 4×2',spec:{Modelo:'Axor 1933',Año:'2018',Tracción:'4×2'},pics:[['axor','Exterior']]}];
units.push(
 {name:'Semirremolque batea',image:'batea-0',type:'Semirremolques',desc:'Caja volcadora · Aluminio',spec:{Carrocería:'Batea',Material:'Aluminio'},pics:[]},
 {name:'Carretón portamaquinaria',image:'carreton-0',type:'Acoplados',desc:'Plataforma baja · Transporte de maquinaria',spec:{Carrocería:'Carretón',Plataforma:'Cama baja'},pics:[]});
const bases=[82000000,21000000,38000000,61000000,48500000,34500000];
for(const [i,prefix] of [[1,'grano'],[2,'cortina'],[4,'batea'],[5,'carreton']]){
 units[i].pics=['Vista lateral','Vista trasera','Detalle del enganche'].map((label,n)=>[prefix+'-'+n,label]);
 units[i].image=prefix+'-0';
}
units[3].pics.push(['axor-detalle','Detalle de la cabina']);
const wa='https://wa.me/5492494028887';
const mapa='https://www.google.com/maps/search/?api=1&query='+encodeURIComponent('Ruta Nacional 226 km 299, Olavarría, Buenos Aires, Argentina');
const money=n=>'$ '+n.toLocaleString('es-AR'), img=n=>'assets/'+n+'.webp', lotNo=i=>String(i+8).padStart(2,'0');
const fmt=t=>new Date(t).toLocaleString('es-AR',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});
const demo=location.protocol==='file:'||location.hostname.endsWith('.github.io')||new URLSearchParams(location.search).has('demo'), key='masflota-demo-2';
let state, offset=0, filter='Todas',photo=0,lastRoute='',busy=false,requestSeq=0;
const route=()=>location.hash.slice(1)||'inicio';
const id=()=>Number(route().split('/')[1]);
const time=()=>Date.now()+offset;
const status=l=>time()>=l.ends?'Cerrada':time()<l.starts?'Programada':'Abierta';
function clock(l){const seconds=Math.max(0,Math.ceil(((time()<l.starts?l.starts:l.ends)-time())/1000));return [Math.floor(seconds/3600),Math.floor(seconds/60)%60,seconds%60].map(n=>String(n).padStart(2,'0')).join(':')}
async function api(path,data){const r=await fetch('api/'+path,data?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}:{cache:'no-store'});if(!r.headers.get('content-type')?.includes('application/json'))throw Error('Abrí el servidor de +Flota o elegí la demostración.');const v=await r.json();if(!r.ok)throw Error(v.error);return v}
function localState(){
 const saved=JSON.parse(localStorage.getItem(key)||'null');
 const data=saved||{user:null,bids:[],lots:[]};
 if(data.lots.length<bases.length){
  const t=Date.now();
  for(let i=data.lots.length;i<bases.length;i++){
   const open=i===0||i>=4,start=open?t-1000:t+i*86400000;
   data.lots.push({id:i,price:bases[i],step:i?250000:500000,starts:start,ends:start+(open?(2+i)*3600000:86400000)});
  }
  localStorage.setItem(key,JSON.stringify(data));
 }
 data.admissions??=[];data.config??={amount:100000,methods:{mp:'Simulación · Mercado Pago',macro:'Simulación · Banco Macro'}};return data;
}
async function sync(){const seq=++requestSeq;const next=demo?localState():await api('state');if(seq!==requestSeq)return;const changed=JSON.stringify([state?.lots,state?.bids,state?.user,state?.admissions])!==JSON.stringify([next.lots,next.bids,next.user,next.admissions]);state=next;offset=demo?0:next.time-Date.now();if(lastRoute!==route()||!main.firstElementChild)render();else{if(changed)updateLive();tick()}}
function toast(msg){$('#notice').textContent=msg;clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('#notice').textContent='',4500)}
function show(html){content.innerHTML=html;if(!modal.open)modal.showModal()}
modal.querySelector('.x').onclick=()=>modal.close();
const label=l=>'<span class="status">'+status(l)+'</span>';
function timer(l){return '<span class="label">'+(status(l)==='Programada'?'Abre en':'Tiempo restante')+'</span><strong class="clock" data-time="'+l.id+'">'+clock(l)+'</strong>'}
function card(i){const u=units[i],l=state.lots[i];return '<a class="card reveal" href="#lote/'+i+'"><img loading="lazy" src="'+img(u.image)+'" alt="'+u.name+'"><div><small>Lote '+lotNo(i)+' · '+status(l)+'</small><h3>'+u.name+'</h3><span class="muted">'+u.desc+'</span><p class="space">'+(status(l)==='Programada'?'Apertura '+fmt(l.starts):'Ver subasta')+' ↗</p></div></a>'}
function originalHome(){const l=state.lots[0];return '<section class="hero"><div class="wrap"><h1>Tu próxima<br>unidad,<br><em>en subasta.</em></h1><p>Camiones, acoplados y semirremolques.</p><a class="btn" href="#cartelera">Explorar subastas <b>↓</b></a></div></section><div class="wrap"><section id="subastas" class="section reveal"><h2>Subasta destacada</h2><div class="feature"><img src="'+img('scania')+'" alt="Scania R 450 azul"><article>'+label(l)+'<h3>Scania R 450</h3><p class="muted">'+units[0].desc+'</p><div><span class="label">Importe vigente</span><strong class="amount">'+money(l.price)+'</strong></div><div>'+timer(l)+'</div><a class="btn" href="#lote/0">Ver lote y ofertar →</a></article></div></section><section id="unidades" class="section"><h2>Explorá las unidades</h2><div class="filters">'+['Todas','Camiones','Acoplados','Semirremolques'].map(f=>'<button data-filter="'+f+'" class="'+(filter===f?'active':'')+'">'+f+'</button>').join('')+'</div><div class="cards">'+[1,2,3,0].filter(i=>filter==='Todas'||units[i].type===filter).map(card).join('')+'</div></section><section id="participar" class="section reveal"><h2>Cómo participar</h2><div class="steps"><article><h3>Registrate</h3><p>Creá tu cuenta para identificar tus ofertas.</p></article><article><h3>Elegí un lote</h3><p>Recorré la galería y consultá la ficha técnica.</p></article><article><h3>Confirmá tu oferta</h3><p>Revisá el importe y seguí las pujas hasta el cierre.</p></article></div></section></div>'}
function originalDetail(i){const u=units[i],l=state.lots[i],p=u.pics[photo]||u.pics[0],history=state.bids.filter(b=>b.lot===i);return '<div class="wrap"><div class="crumb"><a href="#subastas">← Subastas</a>　/　Lote '+lotNo(i)+'</div><h1 class="title">'+u.name+'</h1><p class="muted">'+u.desc+'</p><section class="detail"><div><button class="viewer" data-zoom aria-label="Ampliar imagen"><img src="'+img(p[0])+'" alt="'+p[1]+' de '+u.name+'"><span>⛶ Ampliar</span></button>'+(i===0?'<button class="orbit" data-spin>⟳　Recorrer en 360°</button>':'')+'<div class="thumbs">'+u.pics.map(([n,title],j)=>'<button aria-label="'+title+'" aria-pressed="'+(j===photo)+'" data-photo="'+j+'"><img src="'+img(n)+'" alt="'+title+'"></button>').join('')+'</div></div><article class="panel">'+label(l)+'<div>'+timer(l)+'</div><div><span class="label">Importe vigente · ARS</span><strong class="amount">'+money(l.price)+'</strong></div><p>Incremento mínimo <b>'+money(l.step)+'</b></p><button class="btn" data-bid '+(status(l)!=='Abierta'?'disabled':'')+'>'+(status(l)==='Abierta'?'Revisar oferta de '+money(l.price+l.step):status(l))+' →</button></article></section><section class="twocol reveal"><article class="panel"><h2>Ficha técnica</h2><dl>'+Object.entries(u.spec).map(([k,v])=>'<div><dt>'+k+'</dt><dd>'+v+'</dd></div>').join('')+'</dl></article><article class="panel"><h2>Historial de ofertas</h2>'+(history.length?history.slice(0,15).map(b=>'<div class="row"><small>'+fmt(b.time)+' · Postor '+String(b.uid).padStart(3,'0')+' · '+(b.channel==='WhatsApp'?'WhatsApp':'Web')+'</small><b>'+money(b.amount)+'</b></div>').join(''):'<p class="muted">Todavía no hay ofertas registradas.</p>')+'</article></section><details class="reveal"><summary>Martillero y condiciones del remate</summary><p>Lote de presentación. La designación del martillero, su matrícula y las condiciones comerciales están pendientes de publicación.</p></details><details><summary>Visita y retiro de la unidad</summary><p>Coordiná la consulta con la agencia. <a href="#contacto"><u>Contactar a Prado Camiones →</u></a></p></details></div>'}
function tick(){document.querySelectorAll('[data-time]').forEach(e=>e.textContent=clock(state.lots[Number(e.dataset.time)]));const sig=state.lots.map(status).join();if(tick.sig&&tick.sig!==sig){tick.sig=sig;updateLive()}tick.sig=sig}
const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('run');observer.unobserve(e.target)}}),{threshold:.06});
function render(){const r=route(),moved=lastRoute!==r;if(moved)photo=0;lastRoute=r;$('#account').textContent=state.user?'Mi cuenta':'Ingresar';main.innerHTML=(r.startsWith('lote/')&&units[id()]?detail(id()):r==='guia'?guidePage():r==='admin'?deskPage():r==='cartelera'||r==='subastas'?portalBoard():r==='vender'?vendorPage():r==='agencia'?institutionPage():r==='martillero'?operator():r==='unidades'?catalog():r==='contacto'?contact():portalHome())+'<p class="demo">'+(demo?'Demostración local · Ofertas guardadas en este navegador':'Entorno de presentación · Lotes ilustrativos')+'</p>';stylePortalRoute(r);document.querySelectorAll('.reveal').forEach(e=>observer.observe(e));if(moved){const target=['subastas','participar'].includes(r)?document.getElementById(r):null;if(target)requestAnimationFrame(()=>target.scrollIntoView());else window.scrollTo({top:0,behavior:'instant'})}tick()}
function operator(){return '<section class="wrap section"><h1>Panel del martillero</h1><p class="space">Abrí un lote por dos horas o cerrá la recepción de ofertas.</p><div class="panel"><form id="manage"><label>Lote<select name="lot">'+units.map((u,i)=>'<option value="'+i+'">'+u.name+' · '+status(state.lots[i])+'</option>').join('')+'</select></label><label>Operación<select name="action"><option value="abrir">Abrir</option><option value="cerrar">Cerrar</option></select></label>'+(demo?'':'<label>Clave de operador<input required name="key" type="password"></label>')+'<button class="btn">Revisar cambio</button></form></div></section>'}
function auth(register=false,after=false){if(state.user){show('<h2>Mi cuenta</h2><p>Postor '+state.user.id+'</p><p class="space">Ofertas registradas: '+state.bids.filter(b=>b.uid===state.user.id).length+'</p><button class="secondary" id="logout">Cerrar sesión</button>');$('#logout').onclick=async()=>{try{if(demo){const s=localState();s.user=null;localStorage.setItem(key,JSON.stringify(s))}else await api('logout',{});modal.close();await sync()}catch(e){toast(e.message)}};return}
 show('<h2>'+(demo?'Participar en la demo':register?'Crear cuenta':'Ingresar')+'</h2><form id="auth">'+(demo?'<p>Usá un perfil de prueba para recorrer la subasta.</p>':'<label>Correo electrónico<input name="email" type="email" required autocomplete="email"></label><label>Contraseña<input name="password" type="password" minlength="8" maxlength="128" required autocomplete="'+(register?'new-password':'current-password')+'"></label>')+'<button class="btn">'+(demo?'Usar perfil de prueba':register?'Registrarme':'Ingresar')+'</button></form>'+(demo?'':'<button class="secondary space" id="switch">'+(register?'Ya tengo cuenta':'Crear cuenta')+'</button>')+'<p class="error" role="alert"></p>');if(!demo)$('#switch').onclick=()=>auth(!register,after);$('#auth').onsubmit=async e=>{e.preventDefault();try{if(demo){const s=localState();s.user={id:1};localStorage.setItem(key,JSON.stringify(s))}else await api(register?'register':'login',Object.fromEntries(new FormData(e.target)));await sync();modal.close();if(after)review()}catch(err){$('.error').textContent=err.message}}}
function review(){if(!canBid())return enrollView();if(!state.user)return auth(false,true);const i=id(),l=state.lots[i],amount=l.price+l.step;show('<h2>Confirmar oferta</h2><p>'+units[i].name+' · Lote '+lotNo(i)+'</p><div class="amount space">'+money(amount)+'</div><button class="btn" id="confirm">Confirmar importe →</button>');$('#confirm').onclick=async e=>{e.target.disabled=true;try{if(demo){const s=localState(),lot=s.lots[i];if(!s.admissions.some(a=>a.uid===s.user?.id&&a.lot===i&&a.profile==='aprobado'&&a.payment==='acreditado')||status(lot)!=='Abierta'||lot.price+lot.step!==amount)throw Error('El lote cambió. Revisá la oferta.');lot.price=amount;s.bids.unshift({lot:i,uid:1,amount,time:Date.now()});localStorage.setItem(key,JSON.stringify(s))}else await api('bid',{lot:i,amount});toast('Oferta registrada.')}catch(err){toast(err.message)}finally{modal.close();await sync()}}}
$('#account').onclick=()=>{if(state)auth()};
main.onclick=e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.filter){filter=b.dataset.filter;refreshCatalog()}if('photo' in b.dataset){photo=Number(b.dataset.photo);const pic=units[id()].pics[photo],image=$('.viewer img');image.src=img(pic[0]);image.alt=pic[1];document.querySelectorAll('[data-photo]').forEach(el=>el.setAttribute('aria-pressed',String(Number(el.dataset.photo)===photo)));fadePhoto(image)}if('zoom' in b.dataset){const p=units[id()].pics[photo];show('<h2>'+p[1]+'</h2><img class="large" src="'+img(p[0])+'" alt="'+p[1]+'">')}if('spin' in b.dataset)spin();if('bid' in b.dataset)review()};
main.onsubmit=e=>{if(e.target.id!=='manage')return;e.preventDefault();const d=Object.fromEntries(new FormData(e.target));d.lot=Number(d.lot);show('<h2>Confirmar cambio</h2><p>'+units[d.lot].name+' · '+d.action+' lote</p><button class="btn space" id="apply">Confirmar</button>');$('#apply').onclick=async()=>{try{if(demo){const s=localState(),l=s.lots[d.lot];l.starts=Date.now()-1;l.ends=Date.now()+(d.action==='abrir'?7200000:0);localStorage.setItem(key,JSON.stringify(s))}else await api('manage',d);await sync();toast('Lote actualizado.')}catch(e){toast(e.message)}modal.close()}};
window.addEventListener('hashchange',()=>{if(modal.open)modal.close();if(state)render()});

async function refresh(){if(busy)return;busy=true;try{await sync()}catch(e){if(!state)main.innerHTML='<section class="wrap section"><h1>Conexión con la sala</h1><p class="space">La sala requiere el servidor de +Flota.</p><a class="btn" href="?demo">Abrir demostración local →</a></section>';else toast('Reconectando con la sala…')}finally{busy=false}}
boot();setInterval(refresh,3000);setInterval(()=>{if(state)tick()},1000);


function spin(){
 let frame=0,startX=0,origin=0;
 show('<h2>Scania R 450 · Vista 360°</h2><img class="large spin" draggable="false" alt="Vista giratoria del Scania"><div class="turn"><button class="secondary" id="prev" aria-label="Girar a la izquierda">←</button><small>Arrastrá para girar</small><button class="secondary" id="next" aria-label="Girar a la derecha">→</button></div>');
 const image=$('.spin');
 function set(n){frame=((n%8)+8)%8;image.src=img('giro-'+frame)}
 set(0);$('#prev').onclick=()=>set(frame-1);$('#next').onclick=()=>set(frame+1);
 image.onpointerdown=e=>{startX=e.clientX;origin=frame;image.setPointerCapture(e.pointerId)};
 image.onpointermove=e=>{if(image.hasPointerCapture(e.pointerId))set(origin+Math.round((e.clientX-startX)/35))};
}
function fadePhoto(image){
 if(!matchMedia('(prefers-reduced-motion: reduce)').matches)image.animate([{opacity:.65},{opacity:1}],{duration:190});
}
function updateLive(){
 $('#account').textContent=state.user?'Mi cuenta':'Ingresar';
 const r=route();
 if(r.startsWith('lote/')&&units[id()]){
  const fresh=document.createElement('template');fresh.innerHTML=detail(id());
  for(const selector of ['.detail .panel','.twocol article:nth-child(2)']){
   const target=main.querySelector(selector),updated=fresh.content.querySelector(selector);
   if(target&&updated)target.innerHTML=updated.innerHTML;
  }
 }else if(r==='inicio'||r==='subastas'||r==='participar'){
  const l=state.lots[0],price=$('.feature .amount'),flag=$('.feature .status');
  if(price)price.textContent=money(l.price);if(flag)flag.textContent=status(l);
 }
 if(r==='cartelera'||r==='subastas'){const list=$('#board-list');if(list)list.innerHTML=boardResults()}if(r==='inicio'&&$('.cover-price'))$('.cover-price').textContent=money(sortedLots()[0].price);
 document.querySelectorAll('[data-status]').forEach(el=>el.textContent=status(state.lots[Number(el.dataset.status)]));
}
function home(){
 const t=document.createElement('template');t.innerHTML=originalHome();
 const section=t.content.querySelector('#unidades');
 section.removeAttribute('id');
 section.innerHTML='<div class="section-head"><div><small class="eyebrow">Agenda de remates</small><h2>Más subastas</h2></div><a class="textlink" href="#unidades">Todas las unidades ↗</a></div><div class="cards">'+[4,5,1].map(card).join('')+'</div>';
 const guide=t.content.querySelector('#participar');
 if(guide)guide.innerHTML='<div class="section-head"><div><small class="eyebrow">Guía del comprador</small><h2>Cómo participar</h2></div><a href="#guia" class="textlink">Ver guía completa ↗</a></div><div class="steps"><article><h3>Elegí el remate</h3><p>Revisá la unidad y solicitá tu inscripción.</p></article><article><h3>Acreditá el anticipo</h3><p>Informá la operación. Prado revisa tu registro y confirma el ingreso.</p></article><article><h3>Entrá a la sala</h3><p>Ofertá desde la web o enviá una puja asistida por WhatsApp.</p></article></div>';
 return t.innerHTML;
}
function inventoryCard(u,i){
 return '<article class="inventory-card" data-unit="'+i+'"><div class="item-photo"><img src="'+img(u.image)+'" alt="'+u.name+'"><span class="lot-tag">Lote '+lotNo(i)+'</span><div class="gallery-controls"><button data-move="-1" aria-label="Foto anterior">‹</button><span class="position">1 / '+u.pics.length+'</span><button data-move="1" aria-label="Foto siguiente">›</button></div></div><div class="inventory-body"><small class="eyebrow">'+u.type+'</small><h2>'+u.name+'</h2><p>'+u.desc+'</p><dl>'+Object.entries(u.spec).slice(0,2).map(([k,v])=>'<div><dt>'+k+'</dt><dd>'+v+'</dd></div>').join('')+'</dl><div class="unit-bottom"><div><small>Precio base · ARS</small><strong>'+money(bases[i])+'</strong></div><a class="round-link" aria-label="Ver lote '+lotNo(i)+'" href="#lote/'+i+'">↗</a></div></div></article>';
}
function catalog(){
 return '<div class="wrap inner-page"><div class="crumb"><a href="#inicio">Inicio</a>　/　Unidades</div><small class="eyebrow">Prado Camiones · +Flota</small><h1 class="title">Unidades en remate<span class="lime">.</span></h1><div class="catalog-toolbar"><div class="filters">'+['Todas','Camiones','Acoplados','Semirremolques'].map(f=>'<button data-filter="'+f+'" class="'+(filter===f?'active':'')+'">'+f+'</button>').join('')+'</div><small id="total">'+units.filter(u=>filter==='Todas'||filter===u.type).length+' unidades</small></div><div class="inventory" id="inventory">'+inventoryList()+'</div></div>';
}
function inventoryList(){return units.map((u,i)=>filter==='Todas'||u.type===filter?inventoryCard(u,i):'').join('')}
function refreshCatalog(){
 const grid=$('#inventory');if(!grid)return;
 grid.innerHTML=inventoryList();
 document.querySelectorAll('[data-filter]').forEach(el=>el.classList.toggle('active',el.dataset.filter===filter));
 $('#total').textContent=grid.children.length+' unidades';
}
function contact(){
 return '<div class="wrap inner-page"><div class="crumb"><a href="#inicio">Inicio</a>　/　Contacto</div><small class="eyebrow">Prado Camiones · +Flota</small><h1 class="title">Hablemos de tu<br>próxima unidad<span class="lime">.</span></h1><div class="contact-grid"><div class="channels"><a href="'+wa+'" target="_blank" rel="noopener"><small>WhatsApp</small><strong>+54 9 2494 02-8887 ↗</strong></a><a href="https://www.instagram.com/prado.camiones/" target="_blank" rel="noopener"><small>Instagram</small><strong>@prado.camiones ↗</strong></a><a href="'+mapa+'" target="_blank" rel="noopener"><small>Visitanos</small><strong>Ruta 226, km 299</strong><p>Olavarría 7400, Buenos Aires, Argentina</p><u>Cómo llegar ↗</u></a></div><div class="panel"><h2>Contanos qué necesitás</h2><form id="consulta"><label>Nombre y apellido<input autocomplete="name" name="nombre" required maxlength="100"></label><label>Teléfono / WhatsApp<input autocomplete="tel" type="tel" name="tel" required maxlength="40"></label><label>Email (opcional)<input autocomplete="email" type="email" name="email" maxlength="200"></label><label>Motivo<select name="motivo"><option>Consultar por una unidad</option><option>Participar de un remate</option><option>Vender en consignación</option></select></label><label>Tu consulta<textarea required name="mensaje" rows="4" maxlength="1200"></textarea></label><label class="consent"><input required type="checkbox"> Autorizo a +Flota a contactarme por esta consulta.</label><button class="btn">Continuar en WhatsApp ↗</button><small>Se abrirá un mensaje para que puedas revisarlo y enviarlo.</small></form></div></div></div>';
}
function boot(){
 $('#pie').innerHTML='<div class="wrap footer-grid"><div><a class="logo" href="#inicio">+Flota</a><p>Prado Camiones</p><small>Camiones, acoplados y semirremolques.</small></div><div><b>Plataforma</b><a href="#subastas">Subastas</a><a href="#unidades">Unidades</a><a href="#contacto">Contacto</a></div><div><b>Agencia</b><a href="'+mapa+'" target="_blank" rel="noopener">Ruta 226, km 299<br>Olavarría 7400, Buenos Aires</a><a href="https://masflota.com.ar/" target="_blank" rel="noopener">masflota.com.ar ↗</a></div><div><b>Hablemos</b><a href="'+wa+'" target="_blank" rel="noopener">+54 9 2494 02-8887</a><a href="https://www.instagram.com/prado.camiones/" target="_blank" rel="noopener">@prado.camiones ↗</a></div></div><div class="wrap credit">Diseñado por NG Software</div>';
 const link=document.createElement('a');link.className='whatsapp';link.href=wa;link.target='_blank';link.rel='noopener';link.setAttribute('aria-label','Escribir a Prado Camiones por WhatsApp');link.title='Hablar por WhatsApp';link.innerHTML='<svg viewBox="0 0 24 24" width="29" height="29" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M20.8 11.7a8.8 8.8 0 0 1-13.1 7.7L3 20.8l1.3-4.6a8.8 8.8 0 1 1 16.5-4.5Z"/><path fill="currentColor" stroke="none" d="M8.4 7.1c-.8 0-1.4.8-1.4 1.8 0 2.9 4.5 7.1 7.7 7.1 1 0 1.8-.6 1.9-1.5l.1-.7-2.5-1.2-.9 1.1c-1.5-.6-2.7-1.6-3.5-3l.8-1L9.5 7.2z"/></svg>';document.body.append(link);portalFooter();refresh();
}
main.addEventListener('click',e=>{
 const button=e.target.closest('[data-move]');if(!button)return;
 const card=button.closest('[data-unit]'),u=units[Number(card.dataset.unit)],idx=(Number(card.dataset.frame||0)+Number(button.dataset.move)+u.pics.length)%u.pics.length;
 card.dataset.frame=idx;const photo=card.querySelector('img');photo.src=img(u.pics[idx][0]);photo.alt=u.name+' · '+u.pics[idx][1];card.querySelector('.position').textContent=(idx+1)+' / '+u.pics.length;fadePhoto(photo);
});
main.addEventListener('submit',e=>{
 if(e.target.id!=='consulta')return;e.preventDefault();const d=new FormData(e.target);
 const msg=['Hola, Prado Camiones. '+d.get('motivo')+'.','Soy '+d.get('nombre')+'.','Teléfono: '+d.get('tel'),d.get('email')?'Email: '+d.get('email'):'',d.get('mensaje')].filter(Boolean).join('\n');
 window.open(wa+'?text='+encodeURIComponent(msg),'_blank','noopener');
});
