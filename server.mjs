import http from 'node:http';
import {DatabaseSync} from 'node:sqlite';
import {randomBytes,scryptSync,timingSafeEqual,createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const db = new DatabaseSync(process.env.FLOTA_DB || fileURLToPath(new URL('subastas.sqlite',import.meta.url)));
db.exec(`PRAGMA journal_mode=WAL;
CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY,email TEXT UNIQUE,salt TEXT,hash TEXT);
CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,uid INTEGER,expires INTEGER);
CREATE TABLE IF NOT EXISTS lots(id INTEGER PRIMARY KEY,price INTEGER,step INTEGER,starts INTEGER,ends INTEGER);
CREATE TABLE IF NOT EXISTS bids(id INTEGER PRIMARY KEY,lot INTEGER,uid INTEGER,amount INTEGER,time INTEGER);`);
const now=Date.now(),day=86400000;
for(const [i,p] of [82000000,21000000,38000000,61000000,48500000,34500000].entries()){
 const start=now+(i>0&&i<4?i*day:-1000);
 db.prepare('INSERT OR IGNORE INTO lots VALUES(?,?,?,?,?)').run(i,p,i?250000:500000,start,start+(i>0&&i<4?day:(2+i)*3600000));
}
const fail=(msg,status=400)=>{throw Object.assign(new Error(msg),{status})};
const sha=s=>createHash('sha256').update(s).digest('hex');
const attempts=new Map();
http.createServer(async(req,res)=>{
 function json(data,status=200){res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data))}
 try{
 const path=new URL(req.url,'http://localhost').pathname;
 if(!path.startsWith('/api/')){
 if(!/^\/(?:index\.html|app\.js|estilos\.css|assets\/[a-z0-9-]+\.webp)?$/.test(path))return fail('Recurso inexistente',404);
 const name=path==='/'?'index.html':path.slice(1);
 const bytes=await readFile(new URL(name,import.meta.url));
 res.writeHead(200,{'Content-Type':({'html':'text/html; charset=utf-8','css':'text/css','js':'text/javascript','webp':'image/webp'})[name.split('.').pop()]});return res.end(bytes)}
 const token=(req.headers.cookie||'').match(/(?:^|; )flota=([a-f0-9]{64})(?:;|$)/)?.[1]||'';
 const user=db.prepare('SELECT u.id,u.email FROM sessions s JOIN users u ON u.id=s.uid WHERE token=? AND expires>?').get(sha(token),Date.now());
 if(req.method==='GET'&&path==='/api/state')return json({time:Date.now(),user:user||null,lots:db.prepare('SELECT * FROM lots ORDER BY id').all(),bids:db.prepare('SELECT lot,uid,amount,time FROM bids ORDER BY id DESC LIMIT 400').all()});
 if(req.method!=='POST'||!req.headers['content-type']?.startsWith('application/json'))return fail('Solicitud inválida',405);
 if(req.headers.origin&&new URL(req.headers.origin).host!==req.headers.host)return fail('Origen inválido',403);
 let body='';for await(const chunk of req){body+=chunk;if(body.length>8192)fail('Solicitud demasiado grande',413)}let d;try{d=JSON.parse(body)}catch{fail('Datos inválidos')}
 if(path==='/api/register'||path==='/api/login'){
 const ip=req.socket.remoteAddress, old=attempts.get(ip);const lim=old&&old.until>Date.now()?old:{n:0,until:Date.now()+600000};attempts.set(ip,lim);if(++lim.n>40)fail('Esperá unos minutos antes de volver a intentar.',429);
 const email=String(d.email||'').trim().toLowerCase(),pass=String(d.password||'');
 if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)||email.length>254||pass.length<8||pass.length>128)fail('Ingresá un correo válido y una clave de 8 a 128 caracteres.');
 if(path.endsWith('register')){if(db.prepare('SELECT id FROM users WHERE email=?').get(email))fail('Este correo ya tiene cuenta.',409);
 const salt=randomBytes(16).toString('hex');db.prepare('INSERT INTO users(email,salt,hash) VALUES(?,?,?)').run(email,salt,scryptSync(pass,salt,64).toString('hex'))}
 const u=db.prepare('SELECT * FROM users WHERE email=?').get(email);
 if(!u||!timingSafeEqual(scryptSync(pass,u.salt,64),Buffer.from(u.hash,'hex')))fail('Correo o clave incorrectos.',401);
 const raw=randomBytes(32).toString('hex');db.prepare('INSERT INTO sessions VALUES(?,?,?)').run(sha(raw),u.id,Date.now()+day);
 res.setHeader('Set-Cookie','flota='+raw+'; HttpOnly; SameSite=Strict; Path=/; Max-Age=86400'+(process.env.HTTPS_ONLY==='1'?'; Secure':''));return json({ok:true})}
 if(path==='/api/logout'){db.prepare('DELETE FROM sessions WHERE token=?').run(sha(token));res.setHeader('Set-Cookie','flota=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');return json({ok:true})}
 if(path==='/api/manage'){if(!process.env.MARTILLERO_CLAVE||sha(String(d.key))!==sha(process.env.MARTILLERO_CLAVE))fail('Clave de operador incorrecta.',403);
 if(!Number.isInteger(d.lot)||!['abrir','cerrar'].includes(d.action))fail('Operación inválida');
 const t=Date.now();if(d.action==='abrir')db.prepare('UPDATE lots SET starts=?,ends=? WHERE id=?').run(t,t+7200000,d.lot);else db.prepare('UPDATE lots SET starts=MIN(starts,?),ends=? WHERE id=?').run(t,t,d.lot);return json({ok:true})}
 if(path==='/api/bid'){if(!user)fail('Ingresá para ofertar.',401);
 db.exec('BEGIN IMMEDIATE');try{const l=db.prepare('SELECT * FROM lots WHERE id=?').get(d.lot),t=Date.now();
 if(!l||t<l.starts||t>=l.ends)fail('El lote está fuera de horario.',409);
 if(d.amount!==l.price+l.step)fail('Cambió la oferta. Revisá el nuevo importe.',409);
 db.prepare('INSERT INTO bids(lot,uid,amount,time) VALUES(?,?,?,?)').run(l.id,user.id,d.amount,t);db.prepare('UPDATE lots SET price=? WHERE id=?').run(d.amount,l.id);db.exec('COMMIT')}catch(e){db.exec('ROLLBACK');throw e}return json({ok:true})}
 fail('Página inexistente',404)
 }catch(e){json({error:e.status?e.message:'No se pudo completar la operación.'},e.status||500)}
}).listen(Number(process.env.PORT||3000),()=>console.log('+Flota disponible en http://localhost:'+(process.env.PORT||3000)));

