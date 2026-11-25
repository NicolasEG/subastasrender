'use strict';
let boardFilter='Todas',boardQuery='';
const dateParts=t=>{const d=new Date(t);return [d.toLocaleDateString('es-AR',{day:'2-digit',timeZone:'America/Argentina/Buenos_Aires'}),d.toLocaleDateString('es-AR',{month:'short',timeZone:'America/Argentina/Buenos_Aires'}).replace('.',''),d.toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'America/Argentina/Buenos_Aires'})]};
function lotDate(l){return status(l)==='Programada'?l.starts:l.ends}
function rowList(items){
 return items.map(l=>{const u=units[l.id],st=status(l),[day,month,hour]=dateParts(lotDate(l));
 return '<a class="auction-line" href="#lote/'+l.id+'"><div class="calendar-leaf"><small>'+month+'</small><b>'+day+'</b></div><div class="auction-photo"><img loading="lazy" src="'+img(u.image)+'" alt="'+esc(u.name)+'"></div><div class="line-copy"><small class="kicker">LOTE '+lotNo(l.id)+'　/　'+u.type+'</small><h3>'+u.name+'</h3><p>'+u.desc+'</p></div><div class="line-price"><small>Precio base · ARS</small><strong>'+money(bases[l.id])+'</strong></div><div class="line-state"><span class="pill '+(st==='Abierta'?'live':'')+'">'+st+'</span><small>'+(st==='Programada'?'Abre ':'Cierre ')+hour+' h</small></div><span class="line-arrow">↗</span></a>'}).join('')||'<p class="empty">No se encontraron lotes con estos filtros.</p>';
}
function sortedLots(){return [...state.lots].sort((a,b)=>{const rank=l=>({Abierta:0,Programada:1,Cerrada:2})[status(l)];return rank(a)-rank(b)||lotDate(a)-lotDate(b)})}
function boardResults(){return rowList(sortedLots().filter(l=>(boardFilter==='Todas'||status(l)===boardFilter)&&[units[l.id].name,units[l.id].type,units[l.id].desc,lotNo(l.id)].join(' ').toLowerCase().includes(boardQuery.toLowerCase().trim())))}
function portalBoard(){return '<div class="page-band"><div class="wrap"><a class="trail" href="#inicio">+Flota / Subastas</a><h1>Cartelera de remates<span>.</span></h1><p>Calendario de apertura y cierre de los lotes · Hora argentina</p></div></div><div class="wrap board"><div class="board-tools"><div class="tabs">'+[['Todas','Todas'],['Abierta','En sala'],['Programada','Próximas'],['Cerrada','Finalizadas']].map(([val,txt])=>'<button data-tab="'+val+'" aria-pressed="'+(boardFilter===val)+'">'+txt+'</button>').join('')+'</div><label class="searchbox">⌕ <input id="buscar-lote" type="search" placeholder="Buscar marca, unidad o lote" aria-label="Buscar unidad" value="'+esc(boardQuery)+'"></label></div><div id="board-list">'+boardResults()+'</div></div>'}
function portalHome(){
 const lots=sortedLots(),top=lots[0],u=units[top.id],open=lots.filter(l=>status(l)==='Abierta').length;
 return '<section class="highway-hero"><div class="wrap highway-inner"><div class="highway-copy"><small>PRADO CAMIONES · OLAVARRÍA</small><h1>Tu próxima unidad,<br><em>en subasta.</em></h1><p>Camiones, acoplados y semirremolques.</p><a class="cover-btn" href="#cartelera">Explorar remates　↗</a></div><a class="live-ticket" href="#lote/'+top.id+'"><img src="'+img(u.image)+'" alt=""><span><small>'+status(top)+' · Lote '+lotNo(top.id)+'</small><b>'+u.name+'</b><strong class="cover-price">'+money(top.price)+'</strong></span><i>↗</i></a></div></section><div class="wrap"><section class="agenda"><div class="agenda-head"><div><small class="kicker">CALENDARIO DE SUBASTAS</small><h2>Agenda de remates</h2></div><a class="outline-link" href="#cartelera">Ver cartelera completa ↗</a></div><p class="agenda-count">'+open+' en sala · '+lots.length+' lotes en cartelera</p>'+rowList(lots.slice(0,3))+'</section><section class="services"><a href="#guia"><small>COMPRADORES</small><h2>Cómo participar ↗</h2><p>Registro, anticipo y habilitación para ofertar.</p></a><a href="#vender"><small>PROPIETARIOS Y FLOTAS</small><h2>Vendé tu unidad ↗</h2><p>Presentá tu camión o acoplado a Prado Camiones.</p></a></section></div>';
}
function vendorPage(){return '<div class="page-band"><div class="wrap"><small class="masttag">PRADO CAMIONES</small><h1>Vendé tu unidad<span>.</span></h1><p>Consultá por la consignación de un camión, acoplado o semirremolque.</p></div></div><div class="wrap vendor-layout"><div><small class="kicker">CONSIGNACIÓN</small><h2>Datos de la unidad</h2><p>Un asesor de Prado recibe los datos por WhatsApp para coordinar la evaluación.</p></div><form id="vendor" class="panel">'+[['Nombre','nombre'],['Marca y modelo','modelo'],['Año','anio'],['Ubicación de la unidad','ubicacion']].map(([label,n])=>'<label>'+label+'<input required maxlength="130" name="'+n+'"></label>').join('')+'<label>Estado y detalles<textarea name="detalle" maxlength="1000" rows="4"></textarea></label><button class="btn">Consultar por WhatsApp ↗</button></form></div>'}
function institutionPage(){return '<div class="page-band"><div class="wrap"><small class="masttag">INFORMACIÓN INSTITUCIONAL</small><h1>La agencia<span>.</span></h1></div></div><div class="wrap vendor-layout"><section><h2>Prado Camiones</h2><p>Agencia de camiones y acoplados en Ruta 226, km 299, Olavarría, Buenos Aires.</p><a class="outline-link" href="#contacto">Contactar a la agencia ↗</a></section><section class="panel"><h3>Responsable del remate</h3><p>La designación del martillero y su matrícula están pendientes. Los lotes exhibidos son de presentación.</p><h3>Datos de participación</h3><p>La inscripción solicita nombre, teléfono y referencia del anticipo para revisar el acceso al lote. Para consultar sobre tus datos, contactá a Prado Camiones.</p><a href="#guia">Ver cómo participar →</a></section></div>'}
const paySources={mp:'https://www.adrianmercado.com.ar/images/medios-pago/logo-mercadopago.png',macro:'https://upload.wikimedia.org/wikipedia/commons/2/26/Banco_Macro_2025.png'};
function portalFooter(){
 const links=(title,items)=>'<div class="foot-links"><h3>'+title+'</h3>'+items.map(([t,l])=>'<a href="'+l+'">'+t+'</a>').join('')+'</div>';
 $('#pie').innerHTML='<section class="payment-strip"><div class="wrap pay-grid"><div><small class="kicker">ANTICIPOS DE PARTICIPACIÓN</small><h2>Medios de pago</h2><p>Medios previstos para los remates de +Flota.</p></div>'+Object.entries(brands).map(([k,v])=>'<button class="provider" data-provider="'+k+'"><span class="brand-fallback">'+v+'</span><img class="provider-mark" alt="'+v+'" src="'+paySources[k]+'"><small>Transferencia　·　Ver detalles ↗</small></button>').join('')+'</div></section><div class="wrap foot-main"><div><a class="foot-logo" href="#inicio">+Flota</a><strong class="agency-mark">PRADO CAMIONES</strong><p>Ruta 226, km 299<br>Olavarría, Buenos Aires</p></div>'+links('Subastas',[['Cartelera','#cartelera'],['Unidades','#unidades'],['Cómo participar','#guia'],['Vender en consignación','#vender']])+links('Institucional',[['La agencia','#agencia'],['Contacto','#contacto'],['Administración','#admin']])+links('Hablemos',[['+54 9 2494 02-8887',wa],['@prado.camiones','https://www.instagram.com/prado.camiones/'],['masflota.com.ar ↗','https://masflota.com.ar/']])+'</div><div class="wrap foot-end"><span>+Flota · Prado Camiones</span><span>Diseñado por NG Software</span></div>';
 const sources=[
  ['AAIP','Derechos sobre datos personales','https://www.argentina.gob.ar/aaip/datospersonales/derechos'],
  ['ARCA','Guía de Data Fiscal','https://www.arca.gob.ar/960/']
 ];
 if(location.protocol==='https:')sources.push(['Google','Consultar seguridad del sitio','https://transparencyreport.google.com/safe-browsing/search?url='+encodeURIComponent(location.origin+location.pathname)]);
 const strip=document.createElement('section');strip.className='institution-strip';strip.setAttribute('aria-label','Consultas oficiales');
 strip.innerHTML='<div class="wrap institution-links"><h2>Consultas oficiales</h2>'+sources.map(([name,label,url])=>'<a target="_blank" rel="noopener" href="'+esc(url)+'"><strong>'+name+'</strong><span>'+label+' ↗</span></a>').join('')+'</div>';
 document.querySelector('.foot-end').before(strip);
 installShowcase();
 document.querySelectorAll('.provider-mark').forEach(el=>{const ready=()=>el.parentElement.classList.add('loaded');el.onload=ready;if(el.complete&&el.naturalWidth)ready()});
}
document.addEventListener('input',e=>{if(e.target.id==='buscar-lote'){boardQuery=e.target.value;$('#board-list').innerHTML=boardResults()}});
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.tab){boardFilter=b.dataset.tab;document.querySelectorAll('[data-tab]').forEach(btn=>btn.setAttribute('aria-pressed',btn===b));$('#board-list').innerHTML=boardResults()}if(b.dataset.provider){const k=b.dataset.provider;show('<h2>'+brands[k]+'</h2><p>Anticipo por transferencia</p><p class="record">'+(demo?'Modo de presentación. Los pagos se simulan en este navegador.':esc(state?.config?.methods?.[k]||'Los datos de cobro están pendientes de configuración.'))+'</p><a class="btn" href="#guia">Cómo informar el pago →</a>')}});
document.addEventListener('submit',e=>{if(e.target.id!=='vendor')return;e.preventDefault();const d=new FormData(e.target);const msg='Hola, soy '+d.get('nombre')+'. Quiero consignar '+d.get('modelo')+', año '+d.get('anio')+', en '+d.get('ubicacion')+'. '+d.get('detalle');window.open(wa+'?text='+encodeURIComponent(msg),'_blank','noopener')});


function stylePortalRoute(r){
 const label={unidades:['Inventario','Unidades en remate'],contacto:['Atención al comprador','Contacto con Prado'],admin:['Prado Camiones · Operaciones','Mesa de subastas'],guia:['Guía del comprador','Cómo participar'],martillero:['Dirección del remate','Panel del martillero']}[r];
 main.dataset.page=r.split('/')[0];
 requestAnimationFrame(()=>observeSections(main));
 for(const a of document.querySelectorAll('header nav a')){
  if(a.hash==='#'+r||(r.startsWith('lote/')&&a.hash==='#cartelera'))a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');
 }
 if(label){
  const band=document.createElement('div');band.className='page-band';
  band.innerHTML='<div class="wrap"><small class="masttag">'+label[0]+'</small><h1>'+label[1]+'<span>.</span></h1></div>';
  const title=main.querySelector('h1');if(title){let previous=title.previousElementSibling;while(previous&&(previous.classList.contains('crumb')||previous.classList.contains('eyebrow'))){const remove=previous;previous=previous.previousElementSibling;remove.remove()}title.remove()}
  main.prepend(band);
 }
 if(r.startsWith('lote/')&&units[id()]){
  const head=main.querySelector('h1'),area=document.createElement('section');area.className='lot-mast';const box=document.createElement('div');box.className='wrap';area.append(box);
  const meta=head.nextElementSibling,crumb=head.previousElementSibling;box.append(crumb,head,meta);main.prepend(area);
 }
}
const motionPreference=matchMedia('(prefers-reduced-motion: reduce)');
const revealObserver=new IntersectionObserver(entries=>{
 for(const entry of entries)if(entry.isIntersecting){
  entry.target.classList.add('arrived');revealObserver.unobserve(entry.target);
 }
},{rootMargin:'0px 0px -12px',threshold:0});
function observeSections(root){
 for(const node of root.querySelectorAll('.agenda-head,.auction-line,.services a,.page-band .wrap,.lot-mast .wrap,.inventory-card,.panel,.channels a,.viewer,.thumbs,details,.guide-grid article,.vendor-layout>div,.vendor-layout>section,.board-tools,.record,.metrics,.highway-copy,.live-ticket,.foot-main>div,.pay-grid>div,.provider,.brand-heading,.road-content')){
  if(node.dataset.revealed)continue;
  node.dataset.revealed='1';node.classList.add('on-scroll');revealObserver.observe(node);
 }
}
function installShowcase(){
 const names=[['scania','Scania'],['mercedes-benz','Mercedes-Benz'],['iveco','Iveco'],['volvo','Volvo'],['volkswagen','Volkswagen'],['randon','Randon']];
 const brandSet=duplicate=>'<div class="logo-set" '+(duplicate?'aria-hidden="true"':'')+'>'+names.map(([file,name])=>'<div class="logo-cell"><img draggable="false" src="assets/marca-'+file+'.png" alt="'+(duplicate?'':name)+'"></div>').join('')+'</div>';
 const show=document.createElement('div');show.className='brand-road';show.innerHTML='<section class="brand-section"><div class="wrap brand-heading"><div><small class="kicker">PRADO CAMIONES</small><h2>Marcas que comercializamos</h2></div><div class="rail-buttons"><button type="button" data-step="-1" aria-label="Marcas anteriores">←</button><button type="button" data-pause aria-label="Pausar carrusel">Ⅱ</button><button type="button" data-step="1" aria-label="Marcas siguientes">→</button></div></div><div class="brand-window" tabindex="0" aria-label="Carrusel de marcas"><div class="logo-track">'+brandSet(false)+brandSet(true)+brandSet(true)+'</div></div></section><section class="road-panel"><div class="road-art" aria-hidden="true"></div><div class="wrap road-content"><small>+FLOTA　/　CONSIGNACIONES</small><h2>Vendé tu camión<br>con Prado.</h2><a href="#vender">Presentar mi unidad　↗</a></div></section>';
 document.querySelector('#pie').prepend(show);observeSections(show.parentElement);
 const rail=show.querySelector('.brand-window'),set=rail.firstElementChild.firstElementChild,btn=show.querySelector('[data-pause]'),art=show.querySelector('.road-art'),road=art.parentElement;
 let paused=motionPreference.matches,drag=null,hover=false,visible=false,request=0,previous=0,pos=0;
 function button(){btn.textContent=paused?'▶':'Ⅱ';btn.setAttribute('aria-label',paused?'Reproducir carrusel':'Pausar carrusel')}
 function stop(){cancelAnimationFrame(request);request=0;previous=0}
 function move(amount){const w=set.offsetWidth;if(!w)return;pos=((pos+amount)%w+w)%w;rail.scrollLeft=pos}
 function frame(ts){request=0;if(!visible||paused||hover||drag||document.hidden)return;if(previous)move(Math.min(ts-previous,50)*.042);previous=ts;request=requestAnimationFrame(frame)}
 function resume(){stop();if(visible&&!paused&&!hover&&!drag&&!document.hidden)request=requestAnimationFrame(frame)}
 new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;resume()}).observe(rail);
 rail.onpointerenter=e=>{if(e.pointerType==='mouse'){hover=true;resume()}};rail.onpointerleave=()=>{hover=false;resume()};
 rail.onpointerdown=e=>{if(e.button!==0)return;drag={x:e.clientX};rail.setPointerCapture(e.pointerId);resume()};
 rail.onpointermove=e=>{if(drag){move(drag.x-e.clientX);drag.x=e.clientX}};
 rail.onpointerup=rail.onpointercancel=()=>{drag=null;resume()};
 rail.onkeydown=e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();move(e.key==='ArrowRight'?160:-160)}};
 show.querySelectorAll('[data-step]').forEach(b=>b.onclick=()=>move(Number(b.dataset.step)*set.offsetWidth/names.length));
 btn.onclick=()=>{paused=!paused;button();resume()};button();document.addEventListener('visibilitychange',resume);
 let active=false,scheduled=false;
 function parallax(){scheduled=false;if(!active||motionPreference.matches)return;const rect=road.getBoundingClientRect();const shift=Math.max(-55,Math.min(55,(innerHeight/2-rect.top-rect.height/2)*.15));art.style.transform='translate3d(0,'+shift+'px,0)'}
 function queue(){if(active&&!scheduled){scheduled=true;requestAnimationFrame(parallax)}}
 new IntersectionObserver(entries=>{active=entries[0].isIntersecting;queue()},{rootMargin:'100px'}).observe(road);
 addEventListener('scroll',queue,{passive:true});addEventListener('resize',queue);motionPreference.addEventListener('change',()=>{paused=motionPreference.matches;button();resume();art.style.transform='';queue()});
}
