const STORE_KEY = "lastSignal.v2";
const $ = id => document.getElementById(id);
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const defaultState = { name:"", sceneId:"scene_01", flags:{}, trust:0, suspicion:0, sanity:100, history:[] };
let state = loadState();
let chapter = null;
let busy = false;

function loadState(){ try{return {...defaultState,...JSON.parse(localStorage.getItem(STORE_KEY))};}catch{return {...defaultState};} }
function save(){ localStorage.setItem(STORE_KEY,JSON.stringify(state)); }
function setScreen(which){$("homeScreen").hidden=which!=="home";$("chatScreen").hidden=which!=="chat";}
function safe(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function clock(){return new Date().toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit"});}
function updateHome(){
  $("homePlayerName").textContent=state.name?state.name.toUpperCase():"IDENTITY NOT SET";
  $("continueButton").style.opacity=state.history.length?".95":".55";
}
function showModal(title,html,onSave){
  $("modalTitle").textContent=title;$("modalContent").innerHTML=html;
  $("modalButtons").innerHTML="";
  const saveBtn=document.createElement("button");saveBtn.textContent="SAVE";saveBtn.onclick=()=>{
    const val=$("playerNameField").value.trim();
    if(val.length<2){$("playerNameField").focus();return;}
    state.name=val.slice(0,20);save();updateHome();$("modal").hidden=true;
  };
  const cancel=document.createElement("button");cancel.textContent="CANCEL";cancel.style.background="#25323a";cancel.style.borderColor="#52616b";cancel.onclick=()=>$("modal").hidden=true;
  $("modalButtons").append(saveBtn,cancel);$("modal").hidden=false;setTimeout(()=>$("playerNameField")?.focus(),60);
}
$("nameButton").onclick=()=>showModal("CREATE YOUR IDENTITY",'<p>Nama ini akan disebut oleh karakter dalam percakapan.</p><input id="playerNameField" maxlength="20" placeholder="Nama pemain" value="'+safe(state.name)+'">');
$("modalClose").onclick=()=>$("modal").hidden=true;

async function loadChapter(){
  const response=await fetch("./story/chapter-01.json");
  if(!response.ok)throw new Error("Story file unavailable");
  chapter=await response.json();
}
function scene(){return chapter.scenes[state.sceneId]||chapter.scenes.scene_01;}
function renderSceneHeader(){
  const s=scene();
  $("chapterLabel").textContent=chapter.title.toUpperCase();
  $("sceneLabel").textContent=`${s.label.toUpperCase()}`;
  $("contactName").textContent=s.contactName||chapter.contactName;
  $("contactStatus").textContent=s.status||"online";
  $("contactAvatar").textContent=(s.avatar||"?").slice(0,1).toUpperCase();
  $("storyNotice").textContent=s.notice||"Pesan baru diterima.";
}
function appendMessage(from,text){
  const el=document.createElement("div");
  el.className=`message ${from==="player"?"outgoing":"incoming"}`;
  if(from==="contact")el.innerHTML=`<div class="sender">${safe(scene().contactName||chapter.contactName)}</div><div>${safe(text)}</div><div class="time">${clock()}</div>`;
  else el.innerHTML=`<div>${safe(text)}</div><div class="time">${clock()} <span class="ticks">✓✓</span></div>`;
  $("messageList").appendChild(el);
  $("chatWallpaper").scrollTop=$("chatWallpaper").scrollHeight;
  state.history.push({from,text,sceneId:state.sceneId,at:Date.now()});save();
}
async function contactTyping(ms,text="sedang mengetik..."){
  $("typingText").textContent=text;$("typingRow").hidden=false;
  $("chatWallpaper").scrollTop=$("chatWallpaper").scrollHeight;
  await wait(ms);$("typingRow").hidden=true;
}
function drawSuggestions(){
  const s=scene();const box=$("suggestions");box.innerHTML="";
  s.choices.forEach(choice=>{
    const b=document.createElement("button");b.className="suggestion";b.type="button";b.textContent=choice.text;
    b.onclick=()=>handleChoice(choice);box.appendChild(b);
  });
}
async function enterScene({opening=true}={}){
  renderSceneHeader();drawSuggestions();
  if(opening&&scene().opening){
    await contactTyping(800,"sedang mengetik...");
    appendMessage("contact",scene().opening.replaceAll("{name}",state.name));
  }
}
function transition(nextScene,flags={}){
  Object.assign(state.flags,flags);
  state.sceneId=nextScene;save();
  $("messageList").innerHTML="";
  enterScene({opening:true});
}
async function handleChoice(choice){
  if(busy)return;busy=true;disableChoices(true);
  appendMessage("player",choice.text);
  await wait(350);
  const current=scene();
  const response=choice.response.replaceAll("{name}",state.name);
  await contactTyping(choice.typingMs||1700);
  appendMessage("contact",response);
  applyEffects(choice.effects||{});
  if(choice.next){
    await wait(850);
    transition(choice.next,choice.flags||{});
  }else{
    drawSuggestions();
  }
  busy=false;disableChoices(false);
}
function disableChoices(disabled){document.querySelectorAll(".suggestion").forEach(b=>b.disabled=disabled);}
function applyEffects(e){
  state.trust+=e.trust||0;state.suspicion+=e.suspicion||0;state.sanity=Math.max(0,Math.min(100,state.sanity+(e.sanity||0)));
  Object.assign(state.flags,e.flags||{});save();
}
function classifyIntent(text){
  const t=text.toLowerCase();
  if(/siapa|identitas|kenal|nama kamu|siapa kamu/.test(t))return "identity";
  if(/dimana|di mana|lokasi|rumah|depan rumah|posisi/.test(t))return "location";
  if(/bukti|buktikan|sebutkan|ingat|kapan|dimana kita/.test(t))return "proof";
  if(/hantu|setan|bukan manusia|bohong|bohongi/.test(t))return "accuse";
  if(/percaya|baiklah|oke|iya|ya/.test(t))return "trust";
  if(/takut|tolong|bantu|polisi|ancam|pergi/.test(t))return "fear";
  return "offtopic";
}
async function handleManual(text){
  if(busy||!text.trim())return;
  busy=true;disableChoices(true);appendMessage("player",text.trim());
  $("manualInput").value="";$("messageCounter").textContent="0 / 180";
  const intent=classifyIntent(text);
  const s=scene();
  const reply=(s.manualResponses&&s.manualResponses[intent])||chapter.globalFallback[intent]||chapter.globalFallback.offtopic;
  await contactTyping(reply.delay||2100);
  appendMessage("contact",reply.text.replaceAll("{name}",state.name));
  if(reply.next){await wait(700);transition(reply.next);}
  else drawSuggestions();
  busy=false;disableChoices(false);
}
$("manualForm").addEventListener("submit",e=>{e.preventDefault();handleManual($("manualInput").value);});
$("manualInput").addEventListener("input",e=>$("messageCounter").textContent=`${e.target.value.length} / 180`);
$("backButton").onclick=()=>{if(busy)return;setScreen("home");updateHome();};
$("detailsButton").onclick=()=>{alert("UNKNOWN NUMBER · CHAPTER 01\nStatus dan detail kontak merupakan bagian dari cerita.");};

async function start(resume=false){
  if(!state.name){$("nameButton").click();return;}
  try{
    if(!chapter)await loadChapter();
    if(!resume){state.sceneId="scene_01";state.history=[];state.flags={};state.trust=0;state.suspicion=0;state.sanity=100;save();}
    setScreen("chat");$("messageList").innerHTML="";
    const history=resume?state.history:[];
    if(history.length){
      history.forEach(m=>{
        const el=document.createElement("div");el.className=`message ${m.from==="player"?"outgoing":"incoming"}`;
        el.innerHTML=`${m.from==="contact"?`<div class="sender">${safe(chapter.contactName)}</div>`:""}<div>${safe(m.text)}</div><div class="time">${clock()} ${m.from==="player"?'<span class="ticks">✓✓</span>':""}</div>`;
        $("messageList").appendChild(el);
      });
      renderSceneHeader();drawSuggestions();$("chatWallpaper").scrollTop=$("chatWallpaper").scrollHeight;
    }else await enterScene({opening:true});
  }catch(err){console.error(err);alert("Cerita belum dapat dimuat. Pastikan story/chapter-01.json sudah di-upload.");setScreen("home");}
}
$("startButton").onclick=()=>start(false);
$("continueButton").onclick=()=>start(true);
updateHome();
if("serviceWorker" in navigator && location.protocol.startsWith("http")){
  window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(console.warn));
}
