const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
let db=JSON.parse(localStorage.getItem('garageDB')||'{"cars":[],"orders":[]}');
const saveDB=()=>localStorage.setItem('garageDB',JSON.stringify(db));
const money=n=>(Number(n)||0).toLocaleString('uk-UA',{maximumFractionDigits:2})+' ₴';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function toast(s){$('#toast').textContent=s;$('#toast').style.display='block';setTimeout(()=>$('#toast').style.display='none',2200)}
function tab(id){$$('.tab').forEach(x=>x.classList.toggle('active',x.id===id));$$('nav button').forEach(x=>x.classList.toggle('active',x.dataset.tab===id));render()}
$$('[data-tab]').forEach(b=>b.onclick=()=>tab(b.dataset.tab));
function total(o){return (o.lines||[]).reduce((s,l)=>s+(+l.price||0),0)}
function carName(id){let c=db.cars.find(x=>x.id===id);return c?`${c.make} ${c.model} · ${c.plate||'без номера'}`:'Авто видалено'}
function render(){
 let open=db.orders.filter(o=>total(o)>(+o.paid||0));
 $('#stats').innerHTML=[['Автомобілі',db.cars.length],['Замовлення',db.orders.length],['Отримано',money(db.orders.reduce((s,o)=>s+(+o.paid||0),0))],['Борг',money(open.reduce((s,o)=>s+total(o)-(+o.paid||0),0))]].map(x=>`<div class="stat"><span class="muted">${x[0]}</span><b>${x[1]}</b></div>`).join('');
 $('#recent').innerHTML=db.orders.slice().reverse().slice(0,4).map(orderHTML).join('')||'<div class="empty">Поки немає замовлень</div>';
 $('#carList').innerHTML=db.cars.map(c=>`<article class="item"><h3>${esc(c.make)} ${esc(c.model)}</h3><p>${esc(c.plate)} ${c.vin?'· VIN '+esc(c.vin):''}</p><p class="muted">${esc(c.owner)} ${esc(c.phone)}</p><button onclick="newOrder('${c.id}')">Нове замовлення</button><button class="secondary" onclick="editCar('${c.id}')">Змінити</button></article>`).join('')||'<div class="empty">Додайте перший автомобіль</div>';
 let f=$('#orderFilter').value;
 let arr=db.orders.filter(o=>f==='all'||(f==='debt'?total(o)>(+o.paid||0):total(o)<=(+o.paid||0)));
 $('#orderList').innerHTML=arr.slice().reverse().map(orderHTML).join('')||'<div class="empty">Замовлень не знайдено</div>';
}
function orderHTML(o){let t=total(o),d=t-(+o.paid||0);return `<article class="item"><div class="line"><h3>${esc(carName(o.carId))}</h3><b>${money(t)}</b></div><p class="muted">${esc(o.date)} ${o.mileage?'· '+esc(o.mileage)+' км':''}</p><p>${esc(o.note)}</p><p>Оплачено: ${money(o.paid)} · <b>Залишок: ${money(d)}</b></p><button onclick="editOrder('${o.id}')">Відкрити / змінити</button></article>`}
function modal(title,html,onSave){$('#modalTitle').textContent=title;$('#modalBody').innerHTML=html;$('#modal').showModal();$('#editor').onsubmit=e=>{if(e.submitter?.id==='save'){e.preventDefault();if(onSave()!==false){$('#modal').close();saveDB();render()}}}}
const val=id=>$('#'+id).value.trim();
function editCar(id){let c=db.cars.find(x=>x.id===id)||{};modal('Автомобіль',`<label>Марка<input id="make" required value="${esc(c.make||'')}"></label><label>Модель<input id="model" value="${esc(c.model||'')}"></label><label>Державний номер<input id="plate" value="${esc(c.plate||'')}"></label><label>VIN<input id="vin" value="${esc(c.vin||'')}"></label><label>Власник<input id="owner" value="${esc(c.owner||'')}"></label><label>Телефон<input id="phone" value="${esc(c.phone||'')}"></label>`,()=>{let x={id:c.id||crypto.randomUUID(),make:val('make'),model:val('model'),plate:val('plate'),vin:val('vin'),owner:val('owner'),phone:val('phone')};if(c.id)Object.assign(c,x);else db.cars.push(x)})}
function newOrder(carId){if(!db.cars.length){toast('Спочатку додайте автомобіль');return}editOrder(null,carId)}
function editOrder(id,carId){let o=db.orders.find(x=>x.id===id)||{carId:carId||db.cars[0].id,date:new Date().toISOString().slice(0,10),lines:[],paid:0};let lines=JSON.stringify(o.lines||[]);modal('Замовлення',`<label>Автомобіль<select id="car">${db.cars.map(c=>`<option value="${c.id}" ${c.id===o.carId?'selected':''}>${esc(c.make+' '+c.model+' '+c.plate)}</option>`).join('')}</select></label><label>Дата<input id="date" type="date" value="${o.date}"></label><label>Пробіг, км<input id="mileage" type="number" value="${o.mileage||''}"></label><label>Роботи та запчастини — кожен рядок: назва, ціна<textarea id="lines" rows="6" placeholder="Заміна масла, 800&#10;Фільтр, 450">${(o.lines||[]).map(l=>`${l.name}, ${l.price}`).join('\n')}</textarea></label><label>Оплачено, ₴<input id="paid" type="number" step="0.01" value="${o.paid||0}"></label><label>Примітка<textarea id="note" rows="2">${esc(o.note||'')}</textarea></label>`,()=>{let ls=val('lines').split('\n').filter(Boolean).map(s=>{let i=s.lastIndexOf(',');return {name:(i<0?s:s.slice(0,i)).trim(),price:i<0?0:Number(s.slice(i+1).trim())||0}});let x={id:o.id||crypto.randomUUID(),carId:val('car'),date:val('date'),mileage:val('mileage'),lines:ls,paid:+val('paid')||0,note:val('note')};if(o.id)Object.assign(o,x);else db.orders.push(x)})}
$('#addCar').onclick=()=>editCar();$('#addOrder').onclick=()=>newOrder();$('#orderFilter').onchange=render;
$('#export').onclick=()=>{let a=document.createElement('a'),u=URL.createObjectURL(new Blob([JSON.stringify(db,null,2)],{type:'application/json'}));a.href=u;a.download='miy-avtoservis-backup.json';a.click();URL.revokeObjectURL(u)};
$('#import').onchange=async e=>{try{let x=JSON.parse(await e.target.files[0].text());if(!Array.isArray(x.cars)||!Array.isArray(x.orders))throw Error();db=x;saveDB();render();toast('Копію відновлено')}catch{alert('Не вдалося прочитати резервну копію')}};
if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
render();