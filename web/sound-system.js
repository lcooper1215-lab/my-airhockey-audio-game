  const SOUND_DEFAULTS={goalWarning:55,goalWarningTone:'rise',stereo:'focused',direction:'pattern',air:12,airTone:'fan',master:65,puck:85,paddle:35,walls:65,hits:50,ai:45,edges:30,serve:45,goals:45,speech:90,puckTone:'click',paddleTone:'glide',wallTone:'rail',hitTone:'recorded',aiTone:'knockpair',edgeTone:'chirp',serveTone:'beeps',goalTone:'harp',distance:'both',paddleMode:'steady',edgeRange:18};
  const SOUND_CHOICES=__SOUND_CHOICES__;
  let sound={...SOUND_DEFAULTS};let realismUpgraded=false;
  try{const saved=JSON.parse(localStorage.getItem('air-hockey-sound-v2')||'{}');for(const key of Object.keys(SOUND_DEFAULTS)){const v=saved[key];if(typeof SOUND_DEFAULTS[key]==='number'&&Number.isFinite(v))sound[key]=Math.max(key==='edgeRange'?5:0,Math.min(key==='edgeRange'?30:100,v));else if(typeof v==='string')sound[key]=v;}}catch{}
  try{if(!localStorage.getItem('air-hockey-realism-v1')){if(sound.wallTone==='metal')sound.wallTone='rail';if(sound.hitTone==='wood')sound.hitTone='recorded';if(sound.aiTone==='drum')sound.aiTone='recordedlow';realismUpgraded=true;}}catch{}
  try{if(!localStorage.getItem('air-hockey-position-v1')){if(sound.aiTone==='recordedlow'||sound.aiTone==='drum')sound.aiTone='knockpair';if(sound.air===18)sound.air=8;if(sound.paddle===35)sound.paddle=22;if(sound.puck===70)sound.puck=85;if(sound.walls===40)sound.walls=55;localStorage.setItem('air-hockey-position-v1','1');localStorage.setItem('air-hockey-sound-v2',JSON.stringify(sound));}}catch{}
  try{if(!localStorage.getItem('air-hockey-paddle-v1')){sound.paddle=Math.max(55,sound.paddle);sound.walls=Math.max(65,sound.walls);if(sound.paddleTone==='sine')sound.paddleTone='guide';localStorage.setItem('air-hockey-paddle-v1','1');localStorage.setItem('air-hockey-sound-v2',JSON.stringify(sound));}}catch{}
  try{if(!localStorage.getItem('air-hockey-playability-v1')){if(sound.paddle===55)sound.paddle=35;localStorage.setItem('air-hockey-playability-v1','1');localStorage.setItem('air-hockey-sound-v2',JSON.stringify(sound));}}catch{}
  try{if(!localStorage.getItem('air-hockey-glide-v1')){if(sound.air===8)sound.air=12;if(sound.paddleTone==='guide')sound.paddleTone='glide';localStorage.setItem('air-hockey-glide-v1','1');localStorage.setItem('air-hockey-sound-v2',JSON.stringify(sound));}}catch{}
  for(const [k,choices] of Object.entries(SOUND_CHOICES))if(!choices.includes(sound[k]))sound[k]=SOUND_DEFAULTS[k];
  let ctx,master,compressor,puckOsc,puckGain,puckPan,padOsc,padGain,padPan,edgeNext=0,puckNext=0,previewing=false;
  let previewNodes=new Set();let paddleMotionUntil=0,lastPaddlePosition=.5;
  const volume=k=>k==='stereoCheck'?.7:sound[k]/100;
  function spatialPan(x){const raw=clamp(x*2-1,-1,1);return sound.stereo==='natural'?raw:clamp(Math.sign(raw)*Math.sqrt(Math.abs(raw))*1.15,-1,1);}
  if(realismUpgraded){try{localStorage.setItem('air-hockey-sound-v2',JSON.stringify(sound));localStorage.setItem('air-hockey-realism-v1','1');}catch{}}
  const wave=t=>['triangle','hollow','guide'].includes(t)?'triangle':'sine';
  const status=text=>{const e=document.getElementById('sound-status');if(e)e.textContent=text;};
  function initAudio(){
    ctx=new (window.AudioContext||window.webkitAudioContext)({latencyHint:'interactive'});try{if(ctx.destination.maxChannelCount>=2)ctx.destination.channelCount=2;}catch{}master=ctx.createGain();master.gain.value=volume('master')*.65;
    compressor=ctx.createDynamicsCompressor();compressor.threshold.value=-12;compressor.knee.value=12;compressor.ratio.value=4;compressor.attack.value=.005;compressor.release.value=.18;master.connect(compressor).connect(ctx.destination);
    puckOsc=ctx.createOscillator();puckGain=ctx.createGain();puckGain.gain.value=0;puckPan=ctx.createStereoPanner();puckOsc.connect(puckGain).connect(puckPan).connect(master);puckOsc.start();
    padOsc=ctx.createOscillator();padGain=ctx.createGain();padGain.gain.value=0;padPan=ctx.createStereoPanner();padOsc.connect(padGain).connect(padPan).connect(master);padOsc.start();initTableAudio();
  }
  // All transient voices have short fade-ins and smooth decays. Inharmonic
  // partials make metal recognizably different from the wooden and drum cues.
  function tone(freq,dur,x,type,amp,channel,delay=0,bend=1){
    if(!ctx||volume(channel)===0)return;const o=ctx.createOscillator(),g=ctx.createGain(),p=ctx.createStereoPanner(),t=ctx.currentTime+delay;
    o.type=wave(type);o.frequency.setValueAtTime(freq,t);if(type==='warble')for(let i=0;i<dur*20;i++)o.frequency.setValueAtTime(freq+Math.sin((t+i*.05)*9)*28,t+i*.05);if(bend!==1)o.frequency.exponentialRampToValueAtTime(Math.max(20,freq*bend),t+dur);
    p.pan.value=spatialPan(x);g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(amp*volume(channel),t+Math.min(.008,dur/4));g.gain.exponentialRampToValueAtTime(.0001,t+dur);
    o.connect(g).connect(p).connect(master);if(previewing)previewNodes.add(o);o.start(t);o.stop(t+dur+.02);o.onended=()=>{previewNodes.delete(o);o.disconnect();g.disconnect();p.disconnect();};
  }
  function blip(freq,dur,x,type,amp){tone(freq,dur,x,type,amp??.22,'serve');}
  function texture(style,x,channel,delay=0,amp=.28){
    const note=(f,d,a=1,type='sine',offset=0,bend=1)=>tone(f,d,x,type,amp*a,channel,delay+offset,bend);
    if(style==='knockpair'){note(230,.075,.8,'triangle',0,.6);note(170,.08,.7,'triangle',.10,.6);}
    else if(style==='recorded'||style==='recordedlow'){if(!recordedHit(style==='recorded'?0:2,x,channel,delay,style==='recordedlow'?.82:1,.5)){note(style==='recorded'?400:280,.08,.9,'triangle');note(1300,.03,.2);}}
    else if(style==='rail'){recordedHit(1,x,channel,delay,1.08,.42);[1370,2243,3187].forEach((f,i)=>note(f,.18-i*.035,.42/(i+1),'sine'));}
    else if(style==='metal'){[730,1217,1913,2861].forEach((f,i)=>note(f,.26-i*.035,1/(i+2)));}
    else if(style==='rattle'){for(let i=0;i<3;i++){note(1340+i*89,.075,.45,'triangle',i*.045);note(2137,.07,.16,'sine',i*.045);}}
    else if(style==='glass'){note(2200,.25,.55);note(3311,.17,.16);}
    else if(style==='bell'){note(1800,.16,.65);note(2870,.12,.2);}
    else if(style==='wood'){note(360,.065,.8,'triangle');note(810,.035,.15);}
    else if(style==='drum'||style==='rubber'){note(style==='drum'?210:310,.12,.9,'sine',0,.48);}
    else if(style==='pop'){note(620,.045,.85,'sine',0,.5);}
    else if(style==='pluck'){note(930,.18,.7,'triangle');note(1860,.09,.15);}
    else if(style==='chime'){note(1175,.16,.6);note(1760,.13,.3,'sine',.07);}
    else if(style==='chirp'){note(x<.5?2300:2700,.06,.55,'sine',0,1.15);}
    else if(style==='whisper'||style==='brush'){for(let i=0;i<5;i++)note(1700+i*283,.045,.07,'triangle',i*.006);}
    else if(style==='reed'){note(x<.5?2100:2500,.055,.45,'triangle');}
  }
  function puckTick(x,near,delay=0,toward=puck.vy<0){const pitch=sound.distance!=='volume'?850+near*400:1050;const amp=sound.distance!=='pitch'?.13+near*.13:.2;
    if(sound.puckTone==='click')tone(pitch*(sound.direction==='pattern'&&!toward?.8:1),.04,x,'triangle',amp*1.4,'puck',delay);
    if(sound.puckTone==='tock')tone(pitch*.55,.045,x,'triangle',amp,'puck',delay, .7);
    if(sound.puckTone==='shaker')for(let i=0;i<3;i++)tone(pitch*1.8+i*211,.018,x,'triangle',amp*.22,'puck',delay+i*.008);
    if(sound.direction==='pattern'&&toward)tone(pitch*.98,.018,x,'triangle',amp*.6,'puck',delay+.048);
  }
  function hitSound(x){if(typeof showPlayEvent==='function')showPlayEvent('YOUR HIT');texture(sound.hitTone,x,'hits');}
  function aiHitSound(x){if(typeof showPlayEvent==='function')showPlayEvent('COMPUTER HIT');texture(sound.aiTone,x,'ai',0,.24);}
  function wallSound(x){if(typeof showPlayEvent==='function')showPlayEvent(x<.5?'LEFT WALL':'RIGHT WALL');texture(sound.wallTone,x<.5?0:1,'walls',0,.36);}
  function edgeSound(x){texture(sound.edgeTone,x,'edges',0,.17);}
  function paddleFrequency(x){if(sound.paddleTone==='glide')return 210+clamp(x,0,1)*70;return sound.paddleTone==='guide'?190+clamp(x,0,1)*120:sound.paddleTone==='soft'?190:sound.paddleTone==='hollow'?110:145;}
  function previewPaddleSweep(){if(sound.paddleTone==='glide'){previewPaddleGlide(.5,true);return;}const o=ctx.createOscillator(),g=ctx.createGain(),p=ctx.createStereoPanner(),t=ctx.currentTime;o.type=wave(sound.paddleTone);o.frequency.setValueAtTime(paddleFrequency(0),t);o.frequency.linearRampToValueAtTime(paddleFrequency(1),t+1.5);p.pan.setValueAtTime(-1,t);p.pan.linearRampToValueAtTime(1,t+1.5);g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(Math.max(.0001,volume('paddle')*.20),t+.04);g.gain.setValueAtTime(Math.max(.0001,volume('paddle')*.20),t+1.45);g.gain.linearRampToValueAtTime(.0001,t+1.55);o.connect(g).connect(p).connect(master);previewNodes.add(o);o.start(t);o.stop(t+1.57);o.onended=()=>{previewNodes.delete(o);o.disconnect();g.disconnect();p.disconnect();};}
  function goalSound(mine){const notes=mine?[523,659,784,1047]:[784,659,523,392];const style=sound.goalTone;notes.forEach((f,i)=>{tone(style==='bells'?f*2:f,.21,.5,style==='arcade'?'triangle':'sine',.20,'goals',i*.14);if(style==='harp')tone(f*2,.12,.5,'triangle',.045,'goals',i*.14);});}
  function serveSound(index,delay=0,x=.5){const f=index===2?990:660;if(sound.serveTone==='beeps')tone(f,.14,x,'sine',.22,'serve',delay);else texture(sound.serveTone==='bell'?'bell':'pluck',x,'serve',delay,.21);}
  function updateAudio(){
    if(!ctx)return;const t=ctx.currentTime,active=state==='playing'||state==='ready',tracking=active||state==='serving'||state==='countdown'||state==='wait';const duck=('speechSynthesis' in window&&speechSynthesis.speaking)?.35:1;
    master.gain.setTargetAtTime(volume('master')*.65*duck,t,.035);
    updateGoalBorderPan();updateAir(tracking?1-.7*clamp(1-puck.y,0,1):0);
    const near=clamp(1-puck.y,0,1),continuous=['sine','triangle','warble'].includes(sound.puckTone);
    puckOsc.type=wave(sound.puckTone);puckOsc.frequency.setTargetAtTime((sound.distance==='volume'?660:480+near*400)+(sound.puckTone==='warble'?Math.sin(t*9)*28:0),t,.018);puckPan.pan.setTargetAtTime(spatialPan(puck.x),t,.01);
    puckGain.gain.setTargetAtTime(active&&continuous?volume('puck')*(sound.distance==='pitch'?.17:.10+near*.12):0,t,.015);
    if(active&&!continuous&&t>=puckNext){puckTick(puck.x,near);puckNext=t+(sound.direction==='pattern'?.21-near*.07:.18-near*.085);}
    padOsc.type=wave(sound.paddleTone);padOsc.frequency.setTargetAtTime(paddleFrequency(me),t,.02);padPan.pan.setTargetAtTime(spatialPan(me),t,.01);
    if(Math.abs(me-lastPaddlePosition)>.002)paddleMotionUntil=t+.25;lastPaddlePosition=me;
    const moving=t<paddleMotionUntil;updatePaddleGlide(tracking&&moving&&sound.paddleTone==='glide',me);const pulse=sound.paddleMode==='pulse'?.55+.45*Math.sin(t*Math.PI*4):1;padGain.gain.setTargetAtTime(tracking?volume('paddle')*(sound.paddleTone==='glide'?.035:moving?.20:.10)*pulse:0,t,.025);
    const range=sound.edgeRange/100,edge=Math.min(me,1-me);if(active&&sound.edges>0&&edge<range&&t>=edgeNext){edgeSound(me<.5?0:1);edgeNext=t+.7-.48*(1-edge/range);}
  }
  function stopPreview(){for(const o of previewNodes){try{o.stop();}catch{}}previewNodes.clear();if('speechSynthesis' in window&&state==='idle')speechSynthesis.cancel();}
  function saveSound(){try{localStorage.setItem('air-hockey-sound-v2',JSON.stringify(sound));return true;}catch{return false;}}
  function syncSoundControls(){document.querySelectorAll('[data-sound]').forEach(e=>{const v=sound[e.dataset.sound];e.value=v;if(e.type==='range')e.setAttribute('aria-valuetext',v+' percent');const out=document.getElementById(e.id+'-value');if(out)out.textContent=v+'%';});}
  function changeSound(e,announce){const key=e.target.dataset?.sound;if(!Object.hasOwn(SOUND_DEFAULTS,key))return;sound[key]=typeof SOUND_DEFAULTS[key]==='number'?Number(e.target.value):e.target.value;syncSoundControls();const saved=saveSound();if(announce)status(saved?'Settings saved.':'Applied for this session; device storage is unavailable.');}
  document.addEventListener('input',e=>changeSound(e,false));document.addEventListener('change',e=>changeSound(e,true));
  document.addEventListener('toggle',e=>{if(e.target.matches?.('.sound-group')&&e.target.open){document.querySelectorAll('.sound-group[open]').forEach(d=>{if(d!==e.target)d.open=false;});}},true);
  document.addEventListener('click',e=>{
    const nav=e.target.closest('[data-view]');if(nav){stopPreview();document.querySelectorAll('.app-screen').forEach(s=>s.hidden=s.id!==nav.dataset.view+'-screen');const heading=nav.dataset.view==='home'?document.getElementById('main-title'):document.querySelector('#'+nav.dataset.view+'-screen h2');heading?.focus();document.getElementById('pad').scrollTop=0;return;}
    const adjust=e.target.closest('[data-volume]');if(adjust){const input=document.getElementById('sound-'+adjust.dataset.volume),key=adjust.dataset.volume;sound[key]=clamp(sound[key]+Number(adjust.dataset.step),Number(input.min),Number(input.max));syncSoundControls();saveSound();status(key==='edgeRange'?'Edge warning range '+sound[key]+' percent.':input.labels[0].textContent);return;}
    const btn=e.target.closest('[data-preview],#sound-reset,#stop-preview,[data-stop-preview]');if(!btn)return;stopPreview();if(btn.id==='stop-preview'||btn.hasAttribute('data-stop-preview')){status('Sound test stopped.');return;}
    if(btn.id==='sound-reset'){sound={...SOUND_DEFAULTS};syncSoundControls();saveSound();status('Distinct default sounds restored.');return;}
    if(!ctx)initAudio();ctx.resume();master.gain.setTargetAtTime(volume('master')*.65,ctx.currentTime,.02);previewing=true;
    const kind=btn.dataset.preview,pos=document.getElementById('preview-'+kind),x=pos?Number(pos.value):.5,near=Number(document.getElementById('preview-distance').value);
    if(kind==='puck'){if(['click','tock','shaker'].includes(sound.puckTone)){for(let t=0;t<1;t+=(sound.direction==='pattern'?.21-near*.07:.18-near*.085))puckTick(x,near,t,document.getElementById('preview-travel')?.value!=='away');}else tone(sound.distance==='volume'?660:480+near*400,1,x,sound.puckTone,sound.distance==='pitch'?.17:.10+near*.12,'puck');}
    if(kind==='paddle'&&sound.paddleTone==='glide')previewPaddleGlide(x,false);if(kind==='paddle'&&sound.paddleTone!=='glide'){if(sound.paddleMode==='pulse'){for(let i=0;i<4;i++)tone(paddleFrequency(x),.18,x,sound.paddleTone,.20,'paddle',i*.25);}else tone(paddleFrequency(x),1,x,sound.paddleTone,.20,'paddle');}
    if(kind==='goalWarning')goalBorderSound(x,false);if(kind==='paddle-sweep')previewPaddleSweep();if(kind==='channel-left'||kind==='channel-right')tone(700,.6,kind==='channel-left'?0:1,'sine',.26,'stereoCheck');if(kind==='wall-left'||kind==='wall-right')wallSound(kind==='wall-left'?0:1);if(kind==='air')previewAir();if(kind==='walls')wallSound(x);if(kind==='hits')hitSound(x);if(kind==='ai')aiHitSound(x);if(kind==='edges')for(let i=0;i<3;i++)texture(sound.edgeTone,x,'edges',i*.3,.17);
    if(kind==='goals'||kind==='loss')goalSound(kind==='goals');if(kind==='serve')for(let i=0;i<3;i++)serveSound(i,i*.5,x);
    if(kind==='speech')say('You two, computer one. This is your spoken score.',true);previewing=false;status('Testing '+(kind==='loss'?'computer goal':kind)+'.');
  });
  syncSoundControls();
