(() => {
 const configNode=document.getElementById('conversion-config');
 if(!configNode)return;
 let cfg;try{cfg=JSON.parse(configNode.textContent);}catch{return;}
 // This preview cannot enable live collection or fabricate a live order feed.
 
 const dialog=document.getElementById('conversion-dialog');
 const form=document.getElementById('order-form');
 const quantity=form?.querySelector('[name=quantity]');
 const toast=document.getElementById('purchase-notice');
 const status=document.getElementById('consultation-status');
 const key='tovarka-conversion-v1:'+location.pathname+':'+cfg.popup;
 const get=suffix=>{try{return sessionStorage.getItem(key+suffix);}catch{return null;}};
 const set=(suffix,value)=>{try{sessionStorage.setItem(key+suffix,value);}catch{}};
 let accepted=cfg.popup==='discount'&&get(':discount')==='1';
 let seen=get(':seen')==='1',notificationsClosed=get(':notices')==='1';
 let touched=false,elapsed=0,last=Date.now(),timer=0,noticeIndex=0,noticeUntil=0,previousFocus=null,oldOverflow='';
 const money=value=>Number(value).toLocaleString('uk-UA',{maximumFractionDigits:2})+' грн';
 const total=q=>Math.max(1,Number(cfg.packs[String(q)]??cfg.packs['1'])-(accepted?cfg.discount:0));
 function updatePrices(){
  document.querySelectorAll('[data-price-quantity]').forEach(node=>{node.textContent=money(total(node.dataset.priceQuantity));});
  document.querySelectorAll('[data-current-total]').forEach(node=>{node.textContent=money(total(quantity?.value||'1'));});
  document.querySelectorAll('[data-saving-quantity]').forEach(node=>{
   const q=Number(node.dataset.savingQuantity);const base=q===1?cfg.oldPrice:q*cfg.packs['1'];
   node.textContent='Економія '+money(Math.max(0,base-total(q)));
  });
  if(quantity?.tagName==='SELECT')Array.from(quantity.options).forEach(option=>{option.textContent=option.value+' шт — '+money(total(option.value));});
  document.querySelectorAll('[data-discount-status]').forEach(node=>{node.hidden=!accepted;node.textContent='Знижку '+money(cfg.discount)+' застосовано';});
  document.querySelectorAll('[data-popup-open]').forEach(node=>{if(accepted)node.textContent='Вашу знижку вже застосовано';});
 }
 const hideNotice=()=>{if(toast)toast.hidden=true;};
 function focusOrder(){
  const target=document.getElementById('order6');
  target?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
  document.getElementById('customer-name')?.focus({preventScroll:true});
 }
 function showPopup(manual=false){
  if(!dialog||dialog.open||document.hidden||typeof dialog.showModal!=='function')return false;
  if(!manual&&(seen||touched||form?.contains(document.activeElement)))return false;
  if(accepted){if(manual)focusOrder();return false;}
  hideNotice();previousFocus=document.activeElement;oldOverflow=document.body.style.overflow;
  dialog.showModal();document.body.style.overflow='hidden';seen=true;set(':seen','1');
  const first=dialog.querySelector(cfg.popup==='discount'?'[data-apply-discount]':'#consultation-name');first?.focus();
  return true;
 }
 function closePopup(){if(dialog?.open)dialog.close();}
 dialog?.addEventListener('close',()=>{document.body.style.overflow=oldOverflow;previousFocus?.focus?.({preventScroll:true});});
 dialog?.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closePopup();}});
 document.querySelectorAll('[data-popup-close]').forEach(button=>button.addEventListener('click',closePopup));
 document.querySelectorAll('[data-popup-open]').forEach(button=>button.addEventListener('click',()=>showPopup(true)));
 dialog?.querySelector('[data-apply-discount]')?.addEventListener('click',()=>{
  if(!accepted){accepted=true;set(':discount','1');}updatePrices();closePopup();focusOrder();
 });
 document.getElementById('consultation-form')?.addEventListener('submit',async event=>{
  event.preventDefault();if(!event.currentTarget.reportValidity())return;
  
  if(cfg.demo){if(status)status.textContent='Це приклад — контакти нікуди не надіслано';return;}
  const contactForm=event.currentTarget,button=contactForm.querySelector('button[type=submit]');
  if(button.disabled)return;button.disabled=true;status.textContent='Надсилаємо…';
  try{
   if(!contactForm.dataset.token){
    const tokenResponse=await fetch('consultation.php?action=token',{credentials:'same-origin',cache:'no-store'});
    const tokenData=await tokenResponse.json();if(!tokenResponse.ok||!tokenData.token)throw Error(tokenData.error||'Не вдалося підключити форму');
    contactForm.dataset.token=tokenData.token;
   }
   const body=new FormData(contactForm);body.set('token',contactForm.dataset.token);
   const response=await fetch('consultation.php',{method:'POST',body,credentials:'same-origin'});
   const data=await response.json();if(!response.ok||!data.ok)throw Error(data.error||'Не вдалося надіслати запит');
   status.textContent='Дякуємо! Запит на консультацію надіслано';contactForm.reset();
  }catch(error){status.textContent=error.message||'Помилка зв’язку. Спробуйте ще раз';button.disabled=false;}
 
 });
 document.getElementById('purchase-close')?.addEventListener('click',()=>{notificationsClosed=true;set(':notices','1');hideNotice();});
 
 let examples=cfg.demo?[{name:'Інна',city:'Житомир',quantity:1},{name:'Марія',city:'Львів',quantity:1}]:[];
 if(!cfg.demo)fetch('recent-orders.json',{cache:'no-store',credentials:'omit'}).then(r=>r.ok?r.json():[]).then(rows=>{
  if(!Array.isArray(rows))return;
  examples=rows.filter(x=>Number.isInteger(x.quantity)&&x.quantity>=1&&x.quantity<=3&&Number.isFinite(x.at)&&x.at*1000<=Date.now()&&Date.now()-x.at*1000<7*86400000).slice(-3).reverse();
 }).catch(()=>{});
 
 function showNotice(){
  if(!toast||notificationsClosed||touched||dialog?.open||document.hidden)return;
  const example=examples[noticeIndex];if(!example)return;
  document.getElementById('purchase-name').textContent=cfg.demo?example.name+' замовила '+example.quantity+' шт':'Покупець залишив заявку · '+example.quantity+' шт';
  document.getElementById('purchase-detail').textContent=cfg.demo?example.city+' · '+money(total(example.quantity)):'Заявка від '+new Date(example.at*1000).toLocaleDateString('uk-UA');
  toast.hidden=false;noticeUntil=elapsed+6000;noticeIndex++;
 }
 function tick(){
  const now=Date.now();if(!document.hidden)elapsed+=Math.min(2000,Math.max(0,now-last));last=now;
  if(document.hidden)return;
  if(toast&&!toast.hidden&&elapsed>=noticeUntil)hideNotice();
  if(!seen&&elapsed>=30000)showPopup();
  if(!dialog?.open&&!touched&&((noticeIndex===0&&elapsed>=12000)||(noticeIndex===1&&elapsed>=55000)||(noticeIndex===2&&elapsed>=80000)))showNotice();
  if((seen||!dialog||touched)&&(notificationsClosed||!toast||noticeIndex>=examples.length||touched)&&(!toast||toast.hidden)){clearInterval(timer);timer=0;}
 }
 function start(){last=Date.now();if(!timer)timer=setInterval(tick,1000);}
 document.addEventListener('focusin',event=>{if(form?.contains(event.target)){touched=true;hideNotice();}});
 quantity?.addEventListener('change',updatePrices);
 document.addEventListener('visibilitychange',()=>{last=Date.now();if(document.hidden){hideNotice();clearInterval(timer);timer=0;}else start();});
 window.addEventListener('pagehide',()=>{clearInterval(timer);timer=0;hideNotice();closePopup();});
 window.addEventListener('pageshow',event=>{if(event.persisted)start();});
 window.addEventListener('message',event=>{
  if(event.source!==window.parent||event.origin!==location.origin)return;
  if(event.data?.type==='tovarka-preview-open')showPopup(true);
 });
 updatePrices();start();
})();