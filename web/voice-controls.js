  let talking=false;
  let voicePrefs={navVolume:85,uri:'',rate:1,controls:'accessible',menus:'off'};
  try{const v=JSON.parse(localStorage.getItem('air-hockey-voice-v1')||'{}');if(Number.isFinite(v.navVolume))voicePrefs.navVolume=Math.max(10,Math.min(100,v.navVolume));if(typeof v.uri==='string')voicePrefs.uri=v.uri;if([.85,1,1.15,1.3].includes(Number(v.rate)))voicePrefs.rate=Number(v.rate);if(['accessible','direct'].includes(v.controls))voicePrefs.controls=v.controls;if(['off','on'].includes(v.menus))voicePrefs.menus=v.menus;}catch{}
  let voiceEnabled=false;
  function saveVoice(){try{localStorage.setItem('air-hockey-voice-v1',JSON.stringify(voicePrefs));}catch{}}
  function voiceStatus(text){const e=document.getElementById('voice-status');if(e)e.textContent=text;}
  function gameSpeak(text,interrupt,interfaceVoice=false){
    if(!('speechSynthesis' in window)){voiceStatus('Game speech is unavailable in this browser. VoiceOver can still read the controls.');return;}
    if(interrupt)speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);
    const voices=speechSynthesis.getVoices();const selected=voices.find(v=>v.voiceURI===voicePrefs.uri)||voices.find(v=>v.lang==='en-US'&&v.localService)||voices.find(v=>v.lang.startsWith('en'));
    if(selected){u.voice=selected;u.lang=selected.lang;}
    u.rate=voicePrefs.rate;u.volume=interfaceVoice?voicePrefs.navVolume/100:volume('speech')*volume('master');u.onstart=()=>{voiceEnabled=true;voiceStatus('Game narrator ready.');};u.onerror=()=>voiceStatus('Speech could not start. Activate Enable game voice or try another listed voice.');speechSynthesis.speak(u);return u;
  }
  function syncVoiceControls(){
    const select=document.getElementById('game-voice');if(select){const voices='speechSynthesis' in window?speechSynthesis.getVoices():[];select.replaceChildren(new Option('Automatic English voice',''));for(const v of voices)select.add(new Option(v.name+' — '+v.lang,v.voiceURI));if(voicePrefs.uri&&!voices.some(v=>v.voiceURI===voicePrefs.uri))select.add(new Option('Saved voice unavailable — using automatic voice',voicePrefs.uri));select.value=voicePrefs.uri;}
    for(const [id,val] of [['voice-rate',voicePrefs.rate],['control-mode',voicePrefs.controls],['menu-narration',voicePrefs.menus]]){const e=document.getElementById(id);if(e)e.value=val;}
    const mode=document.getElementById('control-mode');if(mode)mode.disabled=talking;const navVolume=document.getElementById('talk-volume');if(navVolume)navVolume.value=voicePrefs.navVolume;const controls=document.getElementById('accessible-paddle');if(controls)controls.hidden=voicePrefs.controls!=='accessible';
  }
  function syncPaddle(){const slider=document.getElementById('paddle-position');if(!slider)return;const value=Math.round(me*100);slider.value=value;slider.setAttribute('aria-valuetext',value+' percent'+(value===50?', center':value===0?', left edge':value===100?', right edge':''));}
  document.addEventListener('input',e=>{if(e.target.id==='paddle-position'){me=clamp(Number(e.target.value)/100,0,1);syncPaddle();}});
  document.addEventListener('change',e=>{const map={'game-voice':'uri','voice-rate':'rate','control-mode':'controls','menu-narration':'menus','talk-volume':'navVolume'};if(!map[e.target.id])return;voicePrefs[map[e.target.id]]=['voice-rate','talk-volume'].includes(e.target.id)?Number(e.target.value):e.target.value;saveVoice();syncVoiceControls();voiceStatus('Voice and control settings saved.');});
  document.addEventListener('click',e=>{
    const enable=e.target.closest('#enable-game-voice,[data-voice-test]');if(enable){voiceEnabled=true;gameSpeak(enable.id==='enable-game-voice'?'Welcome to Air Hockey Audio. Your game voice is ready. Choose Start game to play with VoiceOver controls, or open Game voice and controls to choose your narrator.':'This is your selected game narrator. You two, computer one.',true);return;}
    if(e.target.closest('[data-voice-stop]')){if('speechSynthesis' in window)speechSynthesis.cancel();return;}
    const move=e.target.closest('[data-paddle]');if(move){me=move.dataset.paddle==='center'?.5:clamp(me+Number(move.dataset.paddle)/100,0,1);syncPaddle();return;}
    const nav=e.target.closest('[data-view]');if(nav){syncVoiceControls();if(voiceEnabled&&voicePrefs.menus==='on')gameSpeak({'home':'Main menu','stereo':'Headphone and direction check','voice':'Game voice and controls','sound':'Sound settings','how':'How to play','install':'Install on iPhone'}[nav.dataset.view]||'',true);}
  });
  if('speechSynthesis' in window)speechSynthesis.addEventListener('voiceschanged',syncVoiceControls);
  syncVoiceControls();
