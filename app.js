const STORE_KEY = "lastSignal.v3";
const $ = id => document.getElementById(id);
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const defaultState = { name:"", sceneId:"scene_01", flags:{}, trust:0, suspicion:0, sanity:100, history:[], completedChapters:[] };
let state = loadState(), chapter = null, busy = false, typingTimer = null, typingResolve = null, screenSession = 0;
function loadState(){
  try { const saved=JSON.parse(localStorage.getItem(STORE_KEY)) || JSON.parse(localStorage.getItem("lastSignal.v2")) || {}; return {...defaultState,...saved,flags:saved.flags||{},history:saved.history||[],completedChapters:saved.completedChapters||[]}; }
  catch { return {...defaultState,flags:{},history:[],completedChapters:[]}; }
}
function save(){localStorage.setItem(STORE_KEY,JSON.stringify(state));}
function cancelTyping(){if(typingTimer!==null){clearTimeout(typingTimer);typingTimer=null;}if(typingResolve){const r=typingResolve;typingResolve=null;r();}if($("typingRow"))$("typingRow").hidden=true;}
function setScreen(which){screenSession++;if(which!=="chat")cancelTyping();$("homeScreen").hidden=which!=="home";$("chatScreen").hidden=which!=="chat";window.scrollTo(0,0);}
function safe(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function clock(){return new Date().toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit"});}
function updateHome(){
  $("homePlayerName").textContent=state.name?state.name.toUpperCase():"IDENTITY NOT SET";
  const hasProgress=state.history.length>0;
  $("continueButton").disabled=!hasProgress;
  $("continueButton").setAttribute("aria-disabled",String(!hasProgress));
}
function openModal(title,html,actions=[]){
  $("modalTitle").textContent=title;$("modalContent").innerHTML=html;$("modalButtons").innerHTML="";
  actions.forEach(action=>{const b=document.createElement("button");b.textContent=action.label;b.onclick=action.run;$("modalButtons").appendChild(b);});
  $("modal").hidden=false;
}
function closeModal(){$("modal").hidden=true;}
function showNameModal(){
  openModal("CREATE YOUR IDENTITY",'<p>Nama ini akan disebut oleh karakter dalam percakapan. Kamu bisa mengubahnya kapan saja.</p><input id="playerNameField" maxlength="20" placeholder="Nama pemain" value="'+safe(state.name)+'">',[
    {label:"SAVE",run:()=>{const field=$("playerNameField"),val=field.value.trim();if(val.length<2){field.focus();return;}state.name=val.slice(0,20);save();updateHome();closeModal();}},
    {label:"CANCEL",run:closeModal}
  ]);
  setTimeout(()=>$ ("playerNameField")?.focus(),60);
}
$("nameButton").onclick=showNameModal;
$("modalClose").onclick=closeModal;
$("modal").addEventListener("click",e=>{if(e.target===$("modal"))closeModal();});
async function loadChapter(){const response=await fetch("./story/chapter-01.json");if(!response.ok)throw new Error("Story file unavailable");chapter=await response.json();}
function scene(){return chapter.scenes[state.sceneId]||chapter.scenes.scene_01;}
function renderSceneHeader(){const s=scene();$("chapterLabel").textContent=chapter.title.toUpperCase();$("sceneLabel").textContent=s.label.toUpperCase();$("contactName").textContent=s.contactName||chapter.contactName;$("contactStatus").textContent=s.status||"online";$("contactAvatar").textContent=(s.avatar||"?").slice(0,1).toUpperCase();$("storyNotice").textContent=s.notice||"Pesan baru diterima.";}
function appendMessage(from,text){const el=document.createElement("div");el.className=`message ${from==="player"?"outgoing":"incoming"}`;if(from==="contact")el.innerHTML=`<div class="sender">${safe(scene().contactName||chapter.contactName)}</div><div>${safe(text)}</div><div class="time">${clock()}</div>`;else el.innerHTML=`<div>${safe(text)}</div><div class="time">${clock()} <span class="ticks">✓✓</span></div>`;$("messageList").appendChild(el);$("chatWallpaper").scrollTop=$("chatWallpaper").scrollHeight;state.history.push({from,text,sceneId:state.sceneId,at:Date.now()});save();}
function contactTyping(ms,text="sedang mengetik..."){cancelTyping();$("typingText").textContent=text;$("typingRow").hidden=false;$("chatWallpaper").scrollTop=$("chatWallpaper").scrollHeight;return new Promise(resolve=>{typingResolve=resolve;typingTimer=setTimeout(()=>{typingTimer=null;typingResolve=null;$("typingRow").hidden=true;resolve();},Math.max(0,ms));});}
function drawSuggestions(){const box=$("suggestions");box.innerHTML="";scene().choices.forEach(choice=>{const b=document.createElement("button");b.className="suggestion";b.type="button";b.textContent=choice.text;b.onclick=()=>handleChoice(choice);box.appendChild(b);});}
async function enterScene({opening=true}={}){const session=screenSession;renderSceneHeader();drawSuggestions();if(opening&&scene().opening){await contactTyping(800);if(session!==screenSession||$("chatScreen").hidden)return;appendMessage("contact",scene().opening.replaceAll("{name}",state.name));}else cancelTyping();}
async function transition(nextScene,flags={}){cancelTyping();Object.assign(state.flags,flags);state.sceneId=nextScene;if(nextScene==="scene_06"&&!state.completedChapters.includes("chapter-01"))state.completedChapters.push("chapter-01");save();$("messageList").innerHTML="";await enterScene({opening:true});}
async function handleChoice(choice){if(busy)return;busy=true;disableChoices(true);cancelTyping();try{appendMessage("player",choice.text);await wait(350);const response=choice.response.replaceAll("{name}",state.name);await contactTyping(choice.typingMs||1700);appendMessage("contact",response);applyEffects(choice.effects||{});if(choice.next){await wait(850);await transition(choice.next,choice.flags||{});}else{if(state.sceneId==="scene_06"&&!state.completedChapters.includes("chapter-01")){state.completedChapters.push("chapter-01");save();}drawSuggestions();}}finally{cancelTyping();busy=false;disableChoices(false);}}
function disableChoices(disabled){document.querySelectorAll(".suggestion").forEach(b=>b.disabled=disabled);$("manualInput").disabled=disabled;$("manualForm").querySelector("button").disabled=disabled;}
function applyEffects(e){state.trust+=e.trust||0;state.suspicion+=e.suspicion||0;state.sanity=Math.max(0,Math.min(100,state.sanity+(e.sanity||0)));Object.assign(state.flags,e.flags||{});save();}
function classifyIntent(text){const t=text.toLowerCase();if(/siapa|identitas|kenal|nama kamu|siapa kamu/.test(t))return "identity";if(/dimana|di mana|lokasi|rumah|depan rumah|posisi/.test(t))return "location";if(/bukti|buktikan|sebutkan|ingat|kapan|dimana kita/.test(t))return "proof";if(/hantu|setan|bukan manusia|bohong|bohongi/.test(t))return "accuse";if(/percaya|baiklah|oke|iya|ya/.test(t))return "trust";if(/takut|tolong|bantu|polisi|ancam|pergi/.test(t))return "fear";return "offtopic";}
async function handleManual(text){if(busy||!text.trim())return;busy=true;disableChoices(true);cancelTyping();try{appendMessage("player",text.trim());$("manualInput").value="";$("messageCounter").textContent="0 / 180";const intent=classifyIntent(text),s=scene(),reply=(s.manualResponses&&s.manualResponses[intent])||chapter.globalFallback[intent]||chapter.globalFallback.offtopic;await contactTyping(reply.delay||2100);appendMessage("contact",reply.text.replaceAll("{name}",state.name));if(reply.next){await wait(700);await transition(reply.next);}else if(state.sceneId==="scene_06"){if(!state.completedChapters.includes("chapter-01"))state.completedChapters.push("chapter-01");save();drawSuggestions();}else drawSuggestions();}finally{cancelTyping();busy=false;disableChoices(false);}}
$("manualForm").addEventListener("submit",e=>{e.preventDefault();handleManual($("manualInput").value);});
$("manualInput").addEventListener("input",e=>$("messageCounter").textContent=`${e.target.value.length} / 180`);
$("backButton").onclick=()=>{if(busy)return;setScreen("home");updateHome();};
$("detailsButton").onclick=()=>alert("UNKNOWN NUMBER · CHAPTER 01\nStatus dan detail kontak merupakan bagian dari cerita.");
async function start(resume=false){if(busy)return;if(!state.name){showNameModal();return;}try{if(!chapter)await loadChapter();if(!resume){state.sceneId="scene_01";state.history=[];state.flags={};state.trust=0;state.suspicion=0;state.sanity=100;save();}cancelTyping();setScreen("chat");$("messageList").innerHTML="";if(state.history.length&&resume){state.history.forEach(m=>{const el=document.createElement("div");el.className=`message ${m.from==="player"?"outgoing":"incoming"}`;el.innerHTML=`${m.from==="contact"?`<div class="sender">${safe(chapter.contactName)}</div>`:""}<div>${safe(m.text)}</div><div class="time">${clock()} ${m.from==="player"?'<span class="ticks">✓✓</span>':""}</div>`;$("messageList").appendChild(el);});renderSceneHeader();drawSuggestions();$("chatWallpaper").scrollTop=$("chatWallpaper").scrollHeight;}else await enterScene({opening:true});}catch(err){console.error(err);cancelTyping();alert("Cerita belum dapat dimuat. Pastikan story/chapter-01.json sudah di-upload.");setScreen("home");}}
$("startButton").onclick=()=>start(false);$("continueButton").onclick=()=>start(true);
function showEpilogues(){const unlocked=state.completedChapters.includes("chapter-01");const body=unlocked?'<div class="epilogue-card"><strong>CHAPTER 01 — THE LAST TRANSMISSION</strong><p>Malam itu berakhir tanpa jawaban. Nomor tak dikenal berhenti mengirim pesan, tetapi satu hal tertinggal di layar ponselmu: sebuah pesan terjadwal untuk esok hari.</p><p><em>“Jangan percaya orang pertama yang mengetuk pintumu.”</em></p></div>':'<div class="epilogue-card locked"><strong>CHAPTER 01 — LOCKED</strong><p>Selesaikan Chapter 01 untuk membuka epilognya.</p></div>';
  openModal("CHAPTER EPILOGUES",'<p>Catatan akhir dari setiap transmisi yang berhasil kamu selesaikan.</p>'+body,[{label:"CLOSE",run:closeModal}]);}
function showDeveloper(){openModal("DEVELOPER INFORMATION",'<p><strong>LAST SIGNAL</strong> adalah game psychological horror berbasis narasi, pesan misterius, investigasi, dan pilihan pemain.</p><ul class="info-list"><li>Created & developed independently.</li><li>Story, world, and game direction: LAST SIGNAL.</li><li>Build: 0.3.0 — Early development.</li><li>Masukan pemain membantu pengembangan berikutnya.</li></ul><p>Terima kasih sudah memainkan dan mendukung proyek ini.</p>',[{label:"CLOSE",run:closeModal}]);}
function showSupport(){openModal("SUPPORT THE DEVELOPER",'<p>Jika kamu menikmati LAST SIGNAL, dukunganmu membantu pengembangan chapter, fitur, musik, dan pengalaman bermain berikutnya.</p><div class="epilogue-card"><strong>SUPPORT OPTIONS</strong><p>Fitur dukungan dan pembayaran resmi akan dibuka setelah sistem pembayaran disiapkan.</p></div><p>Saat ini kamu sudah membantu dengan memainkan game, memberikan masukan, dan membagikannya kepada teman.</p>',[{label:"CLOSE",run:closeModal}]);}
$("epilogueButton").onclick=showEpilogues;$("developerButton").onclick=showDeveloper;$("supportButton").onclick=showSupport;
updateHome();
if("serviceWorker" in navigator&&location.protocol.startsWith("http")){window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(console.warn));}
