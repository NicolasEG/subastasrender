'use strict';
const brands={mp:'Mercado Pago',macro:'Banco Macro'};
const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
let operatorKey='',deskData=null;
function admission(i=id()){return state.user&&state.admissions?.find(a=>a.uid===state.user.id&&a.lot===i)}
function canBid(i=id()){const a=admission(i);return a?.profile==='aprobado'&&a.payment==='acreditado'}
function detail(i){
 const template=document.createElement('template');template.innerHTML=originalDetail(i);
 const box=template.content.querySelector('.detail .panel'),btn=box.querySelector('[data-bid]');
 if(!canBid(i)&&status(state.lots[i])!=='Cerrada'){btn.disabled=false;btn.textContent=admission(i)?'Ver mi inscripción →':'Inscribirme en esta subasta →'}
 if(canBid(i)&&status(state.lots[i])==='Abierta')box.insertAdjacentHTML('beforeend','<button class="secondary wide" data-intent>Pujar por WhatsApp ↗</button>');
 box.insertAdjacentHTML('beforeend','<small class="label">Anticipo de participación · '+(state.config?.amount?money(admission(i)?.amount||state.config.amount):'A confirmar')+'</small>');
 return template.innerHTML;
}
function schedulePage(){return '<div class="wrap inner-page"><div class="crumb"><a href="#inicio">Inicio</a> / Cartelera</div><small class="eyebrow">Prado Camiones · Subastas online</small><h1 class="title">Cartelera de remates.</h1>'+['Abierta','Programada','Cerrada'].map((s,k)=>{const lots=state.lots.filter(l=>status(l)===s);return lots.length?'<section class="section"><h2>'+['En sala','Próximas aperturas','Finalizadas'][k]+'</h2><div class="cards">'+lots.map(l=>card(l.id)).join('')+'</div></section>':''}).join('')+'</div>'}
function brandFooter(){
 const agency=document.querySelector('.footer-grid .logo');agency.insertAdjacentHTML('afterend','<span class="agency-mark">PRADO CAMIONES</span>');agency.parentElement.querySelector('p')?.remove();
 const col=document.querySelector('.footer-grid > div:nth-child(2)');col.insertAdjacentHTML('beforeend','<a href="#guia">Cómo participar</a>');
 const credit=document.querySelector('.credit');credit.insertAdjacentHTML('beforebegin','<div class="wrap payments"><div><small class="eyebrow">Medios previstos</small><p>Anticipos de participación</p></div>'+Object.entries(brands).map(([k,v])=>'<span class="paybrand"><img width="24" height="24" alt="" src="https://www.google.com/s2/favicons?domain='+(k==='mp'?'mercadopago.com.ar':'macro.com.ar')+'&sz=64">'+v+'</span>').join('')+'<a href="#admin">Administración ↗</a></div>');
}
function deskPage(){
 let body='<form id="desk-login"><label>Clave de administración<input name="key" type="password" required autocomplete="current-password"></label><button class="btn">Ingresar al panel →</button></form>';
 if(demo&&!deskData)body='<p>Probá la revisión de inscripciones y anticipos en este navegador.</p><button class="btn space" data-desk>Entrar al panel de prueba →</button>';
 if(deskData){
 const rows=deskData.rows;
 body='<div class="desk-actions"><button class="secondary" data-desk>Actualizar</button><a class="secondary" href="#martillero">Abrir o cerrar lotes</a><button class="secondary" data-lock>Salir del panel</button></div><div class="metrics">'+[['Inscripciones',rows.length],['Pagos a revisar',rows.filter(a=>a.payment==='informado').length],['Habilitados',rows.filter(a=>a.profile==='aprobado'&&a.payment==='acreditado').length]].map(([label,n])=>'<div><strong>'+n+'</strong><small>'+label+'</small></div>').join('')+'</div><h2>Solicitudes de clientes</h2>'+(rows.length?rows.map(a=>'<article class="record"><small>Lote '+lotNo(a.lot)+' · '+esc(units[a.lot].name)+'</small><h3>'+esc(a.name)+'</h3><p>'+esc(a.phone)+' · '+esc(a.email||'Perfil de prueba')+'</p><p>Inscripción <b>'+esc(a.profile)+'</b> · Anticipo <b>'+esc(a.payment)+'</b></p><p>'+money(a.amount)+' · '+esc(brands[a.method]||'Medio pendiente')+' · Ref. '+esc(a.ref||'—')+'</p><div class="desk-actions">'+[['aprobar','Aprobar cliente'],['observar','Observar inscripción'],...(a.payment==='informado'?[['acreditar','Acreditar anticipo'],['rechazar','Observar pago']]:[])].map(([code,label])=>'<button class="secondary" data-decision="'+code+'" data-lot="'+a.lot+'" data-uid="'+a.uid+'">'+label+'</button>').join('')+'</div></article>').join(''):'<p class="empty">Todavía no hay inscripciones.</p>')+'<h2>Pujas por WhatsApp</h2><form id="receive"><label>Código recibido del comprador<input required name="code" maxlength="32" autocomplete="off"></label><button class="btn">Registrar puja recibida →</button></form><h2>Actividad reciente</h2>'+deskData.log.map(e=>'<div class="row"><span>'+esc(e.action)+' · Lote '+lotNo(e.lot)+'</span><small>'+fmt(e.time)+'</small></div>').join('');
 }
 if(deskData){
 const c=state.config;
 body+='<details class="space"><summary>Configurar medios y anticipo</summary><form id="settings" class="space"><label>Anticipo para nuevas inscripciones (ARS)<input type="number" min="0" step="1" name="amount" required value="'+c.amount+'"></label>'+Object.keys(brands).map(k=>'<label>'+brands[k]+' · titular y destino de transferencia<input name="'+k+'" maxlength="350" value="'+esc(c.methods[k])+'" placeholder="Titular, CUIT y alias o CBU/CVU"></label>').join('')+'<small>Dejá el destino vacío para desactivar el medio. Las inscripciones que ya tienen un importe asignado lo conservan.</small><button class="btn">Guardar configuración</button></form></details>';
 }
 return '<div class="wrap inner-page"><div class="crumb"><a href="#inicio">Inicio</a> / Administración</div><small class="eyebrow">Prado Camiones · Operaciones</small><h1 class="title">Mesa de subastas.</h1><section class="panel desk space">'+body+'</section></div>';
}
async function perform(action,d={}){
 if(!demo)return api(action,d);
 const s=localState();s.journal??=[];s.intents??={};let result={ok:true};
 const a=s.admissions.find(a=>a.uid===(d.uid||1)&&a.lot===d.lot);
 if(action==='settings'){s.config={amount:Number(d.amount),methods:{mp:d.mp,macro:d.macro}};s.admissions.filter(a=>!a.amount&&a.payment==='pendiente').forEach(a=>a.amount=s.config.amount);localStorage.setItem(key,JSON.stringify(s));return result}
 if(action==='desk')return {rows:s.admissions,log:s.journal.slice(0,20)};
 if(action==='enroll'){if(a){if(a.profile!=='observado')throw Error('Ya existe una solicitud.');Object.assign(a,{name:d.name,phone:d.phone,profile:'pendiente'})}else s.admissions.push({uid:1,lot:d.lot,name:d.name,phone:d.phone,amount:s.config.amount,profile:'pendiente',payment:'pendiente'})}
 if(action==='payment'){if(!a||!['pendiente','observado'].includes(a.payment))throw Error('Estado inválido.');Object.assign(a,{method:d.method,ref:d.ref,payment:'informado'})}
 if(action==='decision'){if(!a)throw Error('Cliente inexistente.');if(['acreditar','rechazar'].includes(d.action)&&a.payment!=='informado')throw Error('Revisá el estado del pago.');if(d.action==='acreditar')a.payment='acreditado';if(d.action==='rechazar')a.payment='observado';if(d.action==='aprobar')a.profile='aprobado';if(d.action==='observar')a.profile='observado'}
 if(action==='intent'){if(!canBid())throw Error('Inscripción pendiente.');const code=crypto.randomUUID().slice(0,8).toUpperCase();s.intents[code]={uid:1,lot:d.lot,amount:d.amount,expires:Date.now()+300000};result={code,amount:d.amount}}
 if(action==='receive'){const code=d.code.trim().toUpperCase(),x=Object.hasOwn(s.intents,code)&&s.intents[code];if(!x||x.expires<=Date.now())throw Error('Código vencido o inexistente.');const l=s.lots[x.lot],reg=s.admissions.find(a=>a.lot===x.lot&&a.uid===x.uid);if(!reg||reg.profile!=='aprobado'||reg.payment!=='acreditado'||status(l)!=='Abierta'||l.price+l.step!==x.amount)throw Error('La oferta ya no es válida.');l.price=x.amount;s.bids.unshift({...x,time:Date.now(),channel:'WhatsApp'});delete s.intents[code];d.lot=x.lot;result.amount=x.amount}
 s.journal.unshift({lot:d.lot,time:Date.now(),action:d.action||action});localStorage.setItem(key,JSON.stringify(s));return result;
}
async function openDesk(){deskData=await perform('desk',{key:operatorKey});render()}
function enrollView(){
 if(!state.user)return auth(false,true);
 const i=id(),a=admission(),config=state.config;
 if(!a||a.profile==='observado'){
 show('<h2>Inscripción al lote '+lotNo(i)+'</h2><p>'+esc(units[i].name)+'</p><form id="enrollment" class="space"><label>Nombre y apellido o razón social<input required minlength="3" maxlength="100" name="name" autocomplete="name"></label><label>Celular con código de área<input required name="phone" type="tel" minlength="8" maxlength="25" autocomplete="tel"></label><label class="consent"><input type="checkbox" required> Solicito participar y autorizo el contacto de Prado para revisar mi inscripción y anticipo.</label><button class="btn">Enviar inscripción →</button></form>');return}
 const amount=a.amount;
 show('<h2>Mi inscripción</h2><p>'+units[i].name+' · Lote '+lotNo(i)+'</p><div class="record"><p>Cliente <b>'+esc(a.profile)+'</b></p><p>Anticipo <b>'+esc(a.payment)+'</b></p><strong>'+money(amount)+'</strong></div>'+
 (['pendiente','observado'].includes(a.payment)&&amount&&Object.values(config.methods).some(Boolean)?'<form id="payment"><label>Medio de pago<select name="method">'+Object.entries(config.methods).filter(([,v])=>v).map(([k])=>'<option value="'+k+'">'+brands[k]+'</option>').join('')+'</select></label><p id="destination"></p><label>Número de operación<input name="ref" required minlength="4" maxlength="80"></label><button class="btn">Informar transferencia →</button></form>':a.payment==='informado'?'<p>Prado revisará el ingreso en la cuenta receptora.</p>':a.payment==='acreditado'?'<p>Anticipo acreditado por administración.</p>':'<p>Los datos para el anticipo están pendientes de configuración.</p>'));
 const form=$('#payment');if(form){const draw=()=>$('#destination').textContent=demo?'Simulación. Usá una referencia de prueba.':config.methods[form.elements.method.value];draw();form.elements.method.onchange=draw}
}
document.addEventListener('submit',async e=>{
 const f=e.target;if(!['desk-login','enrollment','payment','receive','settings'].includes(f.id))return;e.preventDefault();const d=Object.fromEntries(new FormData(f)),button=f.querySelector('button');button.disabled=true;
 try{
 if(f.id==='settings'){await perform('settings',{...d,key:operatorKey});await sync();await openDesk();toast('Configuración guardada.')} 
 if(f.id==='desk-login'){operatorKey=d.key;await openDesk()}
 if(f.id==='enrollment'){await perform('enroll',{...d,lot:id(),accept:true});await sync();enrollView()}
 if(f.id==='payment'){await perform('payment',{...d,lot:id()});await sync();enrollView()}
 if(f.id==='receive'){const result=await perform('receive',{...d,key:operatorKey});await sync();await openDesk();toast('Puja registrada por '+money(result.amount))}
 }catch(err){toast(err.message);if(modal.open){let note=content.querySelector('.error');if(!note){note=document.createElement('p');note.className='error';content.append(note)}note.textContent=err.message}}finally{button.disabled=false}
});
document.addEventListener('click',async e=>{
 const b=e.target.closest('button');if(!b)return;
 try{
 if(b.hasAttribute('data-desk'))await openDesk();
 if(b.hasAttribute('data-lock')){operatorKey='';deskData=null;render()}
 if(b.dataset.decision){const d={lot:Number(b.dataset.lot),uid:Number(b.dataset.uid),action:b.dataset.decision,key:operatorKey};
 show('<h2>'+esc(b.textContent)+'</h2><p>Postor '+d.uid+' · Lote '+lotNo(d.lot)+'</p>'+(d.action==='acreditar'?'<p>Confirmá después de verificar el ingreso en la cuenta receptora.</p>':'')+'<button class="btn space" id="decision-ok">Confirmar</button>');
 $('#decision-ok').onclick=async ev=>{ev.target.disabled=true;try{await perform('decision',d);modal.close();await sync();await openDesk()}catch(err){modal.close();toast(err.message)}}}
 if(b.hasAttribute('data-intent')){const l=state.lots[id()],offer=await perform('intent',{lot:id(),amount:l.price+l.step});const text='Quiero ofertar '+money(offer.amount)+' por '+units[id()].name+', lote '+lotNo(id())+'. Código '+offer.code;
 show('<h2>Puja por WhatsApp</h2><p>'+money(offer.amount)+' · Lote '+lotNo(id())+'</p><p class="space">Enviá el código al operador. La puja ingresa cuando la mesa la registra, si el importe sigue vigente. El código dura hasta cinco minutos.</p><strong>'+esc(offer.code)+'</strong><p class="space"><a class="btn" target="_blank" rel="noopener" href="'+wa+'?text='+encodeURIComponent(text)+'">Enviar por WhatsApp ↗</a></p>')}
 }catch(err){toast(err.message)}
});

function guidePage(){return '<div class="wrap inner-page"><div class="crumb"><a href="#inicio">Inicio</a> / Cómo participar</div><small class="eyebrow">Guía del comprador</small><h1 class="title">Participá del remate.</h1><section class="guide-grid">'+[['Elegí el lote','Revisá la ficha, las imágenes, el importe vigente y el horario de cierre.'],['Inscribite','Ingresá a tu cuenta y completá nombre y celular en cada remate en el que quieras participar.'],['Informá tu anticipo','Consultá el monto y el destino habilitado. Indicá el medio y el número de operación para que Prado pueda cotejar el ingreso.'],['Esperá la habilitación','Desde Mi inscripción podés consultar tanto la revisión del cliente como la acreditación del anticipo.'],['Confirmá la puja','Podés ofertar en la sala o enviar un código por WhatsApp. Revisá siempre el historial para comprobar que se registró.'],['Consultá el resultado','Al cierre del lote contactá a Prado para coordinar los pasos de adjudicación y retiro.']].map(([a,b])=>'<article class="panel"><h3>'+a+'</h3><p>'+b+'</p></article>').join('')+'</section><a class="btn" href="#cartelera">Explorar la cartelera →</a></div>'}
