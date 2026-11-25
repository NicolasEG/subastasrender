import {randomBytes, timingSafeEqual,createHash} from 'node:crypto';
const hash=s=>createHash('sha256').update(s).digest();
export function install(db,fail){
 db.exec(`CREATE TABLE IF NOT EXISTS admission(uid INTEGER,lot INTEGER,name TEXT NOT NULL,phone TEXT NOT NULL,profile TEXT DEFAULT 'pendiente',payment TEXT DEFAULT 'pendiente',method TEXT,ref TEXT,amount INTEGER,terms TEXT,PRIMARY KEY(uid,lot));
 CREATE UNIQUE INDEX IF NOT EXISTS operation_ref ON admission(method,ref) WHERE ref IS NOT NULL AND payment!='observado';
 CREATE TABLE IF NOT EXISTS instructions(code TEXT PRIMARY KEY,uid INTEGER,lot INTEGER,amount INTEGER,expires INTEGER,used INTEGER DEFAULT 0);
 CREATE TABLE IF NOT EXISTS journal(id INTEGER PRIMARY KEY,time INTEGER,action TEXT,uid INTEGER,lot INTEGER,detail TEXT); `);
 if(!db.prepare('PRAGMA table_info(bids)').all().some(c=>c.name==='channel'))db.exec("ALTER TABLE bids ADD COLUMN channel TEXT DEFAULT 'web'");
 const amount=Number(process.env.ANTICIPO_ARS||0);
 const methods={macro:process.env.MACRO_DESTINO||'',mp:process.env.MP_DESTINO||''};
 const config={amount:Number.isSafeInteger(amount)&&amount>0?amount:0,methods};
 db.exec('CREATE TABLE IF NOT EXISTS payment_settings(id INTEGER PRIMARY KEY,amount INTEGER,macro TEXT,mp TEXT)');
 const saved=db.prepare('SELECT * FROM payment_settings WHERE id=1').get();
 if(saved){config.amount=saved.amount;Object.assign(methods,{macro:saved.macro,mp:saved.mp})}
 function mine(uid){return db.prepare('SELECT * FROM admission WHERE uid=? ORDER BY lot').all(uid)}
 function row(uid,lot){return db.prepare('SELECT * FROM admission WHERE uid=? AND lot=?').get(uid,lot)}
 function eligible(uid,lot){const a=row(uid,lot);if(a?.profile!=='aprobado'||a.payment!=='acreditado')fail('Tu inscripción y anticipo deben estar aprobados.',403)}
 function audit(action,uid,lot,detail){db.prepare('INSERT INTO journal(time,action,uid,lot,detail) VALUES(?,?,?,?,?)').run(Date.now(),action,uid,lot,detail)}
 function bid(uid,lot,amount,channel){
  eligible(uid,lot);
  const l=db.prepare('SELECT * FROM lots WHERE id=?').get(lot),t=Date.now();
  if(!l||t<l.starts||t>=l.ends)fail('El lote está fuera de horario.',409);
  if(amount!==l.price+l.step)fail('El importe cambió. Solicitá una nueva confirmación.',409);
  db.prepare('INSERT INTO bids(lot,uid,amount,time,channel) VALUES(?,?,?,?,?)').run(lot,uid,amount,t,channel);
  db.prepare('UPDATE lots SET price=? WHERE id=?').run(amount,lot);
  audit('Oferta '+channel,uid,lot,String(amount));
 }
 function transaction(fn){db.exec('BEGIN IMMEDIATE');try{const r=fn();db.exec('COMMIT');return r}catch(e){db.exec('ROLLBACK');throw e}}
 function handle(path,d,user){
  if(!['enroll','payment','intent','desk','settings','decision','receive','bid'].includes(path))return null;
  if(['desk','settings','decision','receive'].includes(path)){
   if(!process.env.MARTILLERO_CLAVE||!timingSafeEqual(hash(String(d.key)),hash(process.env.MARTILLERO_CLAVE)))fail('Clave de operador incorrecta.',403);
  }else if(!user)fail('Primero ingresá a tu cuenta.',401);
  const uid=user?.id,lot=d.lot;
  if(path==='settings'){
   const amt=Number(d.amount),macro=String(d.macro||'').trim(),mp=String(d.mp||'').trim();
   if(!Number.isSafeInteger(amt)||amt<0||macro.length>350||mp.length>350)fail('Configuración inválida.');
   db.prepare('INSERT OR REPLACE INTO payment_settings VALUES(1,?,?,?)').run(amt,macro,mp);
   config.amount=amt;Object.assign(methods,{macro,mp});
   db.prepare("UPDATE admission SET amount=? WHERE amount=0 AND payment='pendiente'").run(amt);
   return {ok:true};
  }
  if(path==='desk')return {rows:db.prepare('SELECT a.*,u.email FROM admission a JOIN users u ON u.id=a.uid ORDER BY a.rowid DESC').all(),log:db.prepare('SELECT * FROM journal ORDER BY id DESC LIMIT 20').all()};
  if(path==='receive')return transaction(()=>{const x=db.prepare('SELECT * FROM instructions WHERE code=?').get(String(d.code).trim().toUpperCase());if(!x||x.used||x.expires<=Date.now())fail('Código vencido, utilizado o inexistente.',409);bid(x.uid,x.lot,x.amount,'WhatsApp');db.prepare('UPDATE instructions SET used=1 WHERE code=?').run(x.code);return {ok:true,amount:x.amount}});
  if(!Number.isInteger(lot)||!db.prepare('SELECT id FROM lots WHERE id=?').get(lot))fail('Lote inválido');
  if(path==='decision')return transaction(()=>{const a=row(d.uid,lot);if(!a)fail('Solicitud inexistente');
   const choices={aprobar:['profile','aprobado'],observar:['profile','observado'],acreditar:['payment','acreditado'],rechazar:['payment','observado']};if(!Object.hasOwn(choices,d.action))fail('Acción inválida');
   const [field,value]=choices[d.action];
   if(field==='payment'&&a.payment!=='informado')fail('No hay un pago pendiente de revisión.');
   db.prepare('UPDATE admission SET '+field+'=? WHERE uid=? AND lot=?').run(value,d.uid,lot);audit(value,d.uid,lot,a.ref||'');return {ok:true}});
  if(path==='bid')return transaction(()=>{bid(uid,lot,d.amount,'web');return {ok:true}});
  const l=db.prepare('SELECT * FROM lots WHERE id=?').get(lot);if(l.ends<=Date.now())fail('El lote ya cerró.',409);
  if(path==='enroll'){
   const name=String(d.name||'').trim(),phone=String(d.phone||'').trim();
   if(name.length<3||name.length>100||!/^\+?[0-9 ()-]{8,25}$/.test(phone)||!d.accept)fail('Revisá tus datos y aceptá las condiciones.');
   const a=row(uid,lot);if(a&&a.profile!=='observado')fail('Ya existe una inscripción.');
   db.prepare("INSERT INTO admission(uid,lot,name,phone,amount,terms) VALUES(?,?,?,?,?,?) ON CONFLICT(uid,lot) DO UPDATE SET name=excluded.name,phone=excluded.phone,profile='pendiente',terms=excluded.terms").run(uid,lot,name,phone,config.amount,'participacion-v1');audit('Inscripción',uid,lot,'participacion-v1');return {ok:true}}
  if(path==='payment'){
   const a=row(uid,lot),ref=String(d.ref||'').trim().toUpperCase();
   if(!a||!a.amount||!Object.hasOwn(methods,d.method)||!methods[d.method])fail('Falta configurar el anticipo o el medio.');
   if(!['pendiente','observado'].includes(a.payment)||ref.length<4||ref.length>80)fail('Revisá la referencia o el estado.');
   try{db.prepare("UPDATE admission SET ref=?,method=?,payment='informado' WHERE uid=? AND lot=?").run(ref,d.method,uid,lot)}catch{fail('La referencia ya fue presentada.',409)}
   audit('Pago informado',uid,lot,ref);return {ok:true}}
  eligible(uid,lot);if(Date.now()<l.starts||d.amount!==l.price+l.step)fail('El lote o el importe cambió.',409);
  const code=randomBytes(8).toString('hex').toUpperCase();db.prepare('INSERT INTO instructions(code,uid,lot,amount,expires) VALUES(?,?,?,?,?)').run(code,uid,lot,d.amount,Math.min(l.ends,Date.now()+300000));return {code,amount:d.amount};
 }
 return {config,mine,handle};
}
