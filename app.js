const KEY = "lastSignalStarter.v1";
const $ = (id) => document.getElementById(id);
const state = loadState();
let deferredInstallPrompt = null;
let chatMessages = [];

function loadState(){
  try { return JSON.parse(localStorage.getItem(KEY)) || {name:"", chapter:0, messages:[]}; }
  catch { return {name:"", chapter:0, messages:[]}; }
}
function saveState(){ localStorage.setItem(KEY, JSON.stringify(state)); }
function refresh(){
  $("welcomeName").textContent = state.name ? state.name.toUpperCase() : "IDENTITY NOT SET";
  $("identityHint").textContent = state.name ? `PLAYER IDENTITY ACTIVE · CHAPTER ${String(state.chapter || 0).padStart(2,"0")} CLEARED` : "Buat nama pemain untuk memulai pengalamanmu.";
  $("continueCopy").textContent = state.chapter ? `Lanjutkan dari Chapter ${state.chapter + 1}.` : "Belum ada progres tersimpan.";
  $("continueBtn").style.opacity = state.chapter ? "1" : ".65";
}
function showModal(title, body, actions = [], eyebrow = "LAST SIGNAL"){
  $("modalTitle").textContent = title;
  $("modalEyebrow").textContent = eyebrow;
  $("modalBody").innerHTML = body;
  const box = $("modalActions"); box.innerHTML = "";
  actions.forEach(a => {
    const b = document.createElement("button");
    b.type = "button"; b.className = `button ${a.primary ? "button-red" : ""}`;
    b.textContent = a.label; b.addEventListener("click", a.onClick);
    box.appendChild(b);
  });
  $("modalBackdrop").hidden = false;
}
function closeModal(){ $("modalBackdrop").hidden = true; }
$("modalClose").addEventListener("click", closeModal);
$("modalBackdrop").addEventListener("click", e => { if(e.target === $("modalBackdrop")) closeModal(); });
function askName(){
  showModal("CREATE YOUR IDENTITY", `<p>Nama ini akan digunakan dalam percakapan cerita. Untuk versi awal, nama disimpan di perangkat ini.</p><label class="eyebrow" for="playerNameInput">PLAYER NAME</label><input id="playerNameInput" maxlength="20" autocomplete="nickname" placeholder="Masukkan nama pemain" value="${escapeHtml(state.name)}">`,
  [{label:"SAVE IDENTITY",primary:true,onClick:()=>{
    const input=$("playerNameInput"); const name=input.value.trim();
    if(name.length<2){input.focus();input.setCustomValidity("Nama minimal 2 karakter.");input.reportValidity();return;}
    state.name=name;saveState();refresh();closeModal();
  }},{label:"CANCEL",onClick:closeModal}]);
  setTimeout(()=>$("playerNameInput")?.focus(),50);
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
$("editIdentityBtn").addEventListener("click",askName);
$("newGameBtn").addEventListener("click",()=>{
  if(!state.name){askName();return;}
  showModal("CHAPTER 01 — 02:13 AM",`<p>Pesan pertama muncul di layar ponselmu. Nomor itu tidak tersimpan di kontak.</p><div class="chat-log"><div class="bubble incoming"><b>UNKNOWN NUMBER</b><br>Halo, ${escapeHtml(state.name)}. Kamu masih bangun?</div></div><p class="muted">Prototype awal: identitas pengirim dan konsekuensi masih berupa skenario demo, belum terhubung AI.</p>`,
  [{label:"MULAI CHAT",primary:true,onClick:startDemoChat},{label:"KEMBALI",onClick:closeModal}],"STORY MODE");
});
function startDemoChat(){
  chatMessages=[{from:"UNKNOWN",text:`Halo, ${state.name}. Kamu masih bangun?`}];
  renderChat();
}
function renderChat(){
  const html=`<p class="muted">UNKNOWN NUMBER · 02:13 AM</p><div class="chat-log" id="chatLog">${chatMessages.map(m=>`<div class="bubble ${m.from==="YOU"?"outgoing":"incoming"}">${escapeHtml(m.text)}</div>`).join("")}</div><form class="chat-form" id="chatForm"><input id="chatInput" maxlength="240" placeholder="Tulis balasan..." autocomplete="off"><button class="button button-red" type="submit">KIRIM</button></form><p class="muted">Demo lokal. AI online dan sistem ancaman akan ditambahkan pada tahap backend.</p>`;
  showModal("INCOMING MESSAGE",html,[{label:"TUTUP CHAT",onClick:closeModal}],"02:13 AM");
  $("chatForm").addEventListener("submit",e=>{
    e.preventDefault();const input=$("chatInput");const text=input.value.trim();if(!text)return;
    chatMessages.push({from:"YOU",text});
    const replies=["Kenapa kamu bertanya begitu?","Aku kira kamu akan mengenal suaraku.","Jangan lihat ke jendela dulu.","Kamu sendirian di rumah, kan?"];
    chatMessages.push({from:"UNKNOWN",text:replies[Math.floor(Math.random()*replies.length)]});
    renderChat();
  });
}
$("continueBtn").addEventListener("click",()=>{
  if(!state.chapter){showModal("NO SAVED PROGRESS","<p>Belum ada chapter yang diselesaikan di perangkat ini.</p>",[{label:"OK",primary:true,onClick:closeModal}]);return;}
  showModal("CONTINUE","<p>Cloud Save belum tersedia pada build awal ini. Progres lokal ditemukan.</p>",[{label:"OK",primary:true,onClick:closeModal}]);
});
$("howToBtn").addEventListener("click",()=>showModal("SURVIVAL GUIDE","<ol><li>Periksa identitas dan isi pesan.</li><li>Jangan langsung mempercayai pengirim.</li><li>Gunakan komputer investigasi untuk memeriksa petunjuk.</li><li>Keputusan akan memengaruhi kondisi bertahan hidup.</li></ol><p>Aturan lengkap akan hadir bersama Story Engine.</p>",[{label:"MENGERTI",primary:true,onClick:closeModal}]));
$("installBtn").addEventListener("click",showInstallHelp);
function showInstallHelp(){
  const isIOS=/iphone|ipad|ipod/i.test(navigator.userAgent);
  const body=isIOS
    ? `<p><b>Pasang melalui Safari:</b></p><ol><li>Buka alamat game ini di Safari (bukan browser dalam Instagram).</li><li>Ketuk tombol Bagikan.</li><li>Pilih <b>Tambah ke Layar Utama</b>.</li><li>Ketuk <b>Tambah</b>, lalu buka ikon LAST SIGNAL dari layar utama.</li></ol>`
    : `<p>Jika browser mendukung pemasangan, gunakan tombol Install App. Jika tombol tidak muncul, buka menu browser lalu pilih <b>Install app</b> atau <b>Add to Home screen</b>.</p>`;
  const actions=[];
  if(deferredInstallPrompt) actions.push({label:"INSTALL SEKARANG",primary:true,onClick:async()=>{deferredInstallPrompt.prompt();await deferredInstallPrompt.userChoice;deferredInstallPrompt=null;closeModal();}});
  actions.push({label:"MENGERTI",onClick:closeModal});
  showModal("INSTALL LAST SIGNAL",body,actions,"APPLICATION MODE");
}
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredInstallPrompt=e;});
window.addEventListener("appinstalled",()=>{deferredInstallPrompt=null;});
function updateConnection(){
  const online=navigator.onLine;
  $("connectionLabel").textContent=online?"SYSTEM ONLINE":"OFFLINE MODE";
  $("connectionLabel").previousElementSibling.style.background=online?"#70b78b":"#c28b56";
}
window.addEventListener("online",updateConnection);window.addEventListener("offline",updateConnection);
if("serviceWorker" in navigator && location.protocol.startsWith("http")){
  window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(err=>console.warn("Service worker registration failed:",err)));
}
refresh();updateConnection();
