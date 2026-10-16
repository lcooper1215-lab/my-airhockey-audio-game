  // Distinct pitch bands: paddle 130–190 Hz, puck 480–880 Hz,
  // edge warnings 1250–1550 Hz, impacts short and above the puck.
  const SOUND_DEFAULTS={master:65,puck:70,paddle:35,walls:30,hits:45,goals:45,speech:90,puckTone:'sine',paddleTone:'triangle',hitTone:'wood',wallTone:'sine',distance:'both',paddleMode:'steady',edgeRange:18};
  let sound={...SOUND_DEFAULTS};
  try {const saved=JSON.parse(localStorage.getItem('air-hockey-sound-v1')||'{}');for(const key of Object.keys(SOUND_DEFAULTS)){const v=saved[key];if(typeof SOUND_DEFAULTS[key]==='number'&&Number.isFinite(v))sound[key]=Math.max(0,Math.min(100,v));else if(typeof v==='string')sound[key]=v;}}catch{}
  for(const [k,choices] of Object.entries({puckTone:['sine','triangle','soft'],paddleTone:['sine','triangle','soft'],hitTone:['wood','chime','soft'],wallTone:['sine','triangle','soft'],distance:['both','pitch','volume'],paddleMode:['steady','pulse']}))if(!choices.includes(sound[k]))sound[k]=SOUND_DEFAULTS[k];
  let ctx,master,compressor,puckOsc,puckGain,puckPan,padOsc,padGain,padPan,edgeNext=0,duckUntil=0;
  const volume=k=>sound[k]/100;
  function initAudio(){
    ctx=new (window.AudioContext||window.webkitAudioContext)();
    master=ctx.createGain();master.gain.value=volume('master')*.65;
    compressor=ctx.createDynamicsCompressor();compressor.threshold.value=-12;compressor.knee.value=12;compressor.ratio.value=4;compressor.attack.value=.005;compressor.release.value=.18;
    master.connect(compressor).connect(ctx.destination);
    puckOsc=ctx.createOscillator();puckGain=ctx.createGain();puckGain.gain.value=0;puckPan=ctx.createStereoPanner();puckOsc.connect(puckGain).connect(puckPan).connect(master);puckOsc.start();
    padOsc=ctx.createOscillator();padGain=ctx.createGain();padGain.gain.value=0;padPan=ctx.createStereoPanner();padOsc.connect(padGain).connect(padPan).connect(master);padOsc.start();
  }
  const wave=t=>t==='soft'?'sine':t;
  function blip(freq,dur,x,type,vol,channel='hits'){
    if(!ctx)return;
    const o=ctx.createOscillator(),g=ctx.createGain(),p=ctx.createStereoPanner(),t=ctx.currentTime;
    o.type=wave(type==='square'?'triangle':type||'sine');o.frequency.value=freq;
    p.pan.value=clamp(x*2-1,-1,1);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime((vol??.22)*volume(channel),t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+Math.max(.03,dur));
    o.connect(g).connect(p).connect(master);o.start(t);o.stop(t+dur+.03);o.onended=()=>{o.disconnect();g.disconnect();p.disconnect();};
  }
  function hitSound(x){const f=sound.hitTone==='chime'?1175:sound.hitTone==='wood'?1050:980;blip(f,.11,x,'sine',.28);if(sound.hitTone==='chime')blip(1760,.09,x,'sine',.10);}
  function wallSound(x){blip(1450,.07,x,sound.wallTone,.19,'walls');}
  function aiHitSound(x){blip(sound.hitTone==='chime'?1320:1150,.07,x,'sine',.15);}
  function goalSound(mine){const notes=mine?[1047,1319,1568]:[784,659,523];notes.forEach((f,i)=>later(()=>blip(f,.16,.5,'sine',.22,'goals'),i*150));}
  function updateAudio(){
    if(!ctx)return;const t=ctx.currentTime;const active=state==='playing';const tracking=active||state==='serving'||state==='wait';
    const duck=t<duckUntil||('speechSynthesis' in window&&speechSynthesis.speaking)?.35:1;
    master.gain.setTargetAtTime(volume('master')*.65*duck,t,.04);
    puckOsc.type=wave(sound.puckTone);padOsc.type=wave(sound.paddleTone);
    const near=clamp(1-puck.y,0,1),pitch=sound.distance!=='volume',loudness=sound.distance!=='pitch';
    puckOsc.frequency.setTargetAtTime(pitch?480+near*400:660,t,.025);
    puckPan.pan.setTargetAtTime(clamp(puck.x*2-1,-1,1),t,.012);
    puckGain.gain.setTargetAtTime(active?volume('puck')*(loudness?.10+near*.12:.17):0,t,.025);
    padOsc.frequency.setTargetAtTime(sound.paddleTone==='soft'?190:145,t,.025);
    padPan.pan.setTargetAtTime(clamp(me*2-1,-1,1),t,.012);
    const pulse=sound.paddleMode==='pulse'?.55+.45*Math.sin(t*Math.PI*4):1;
    padGain.gain.setTargetAtTime(tracking?volume('paddle')*.16*pulse:0,t,.025);
    // Paddle warning pulses only near an edge, avoiding a constant extra layer.
    const range=Math.max(.05,sound.edgeRange/100),edge=Math.min(me,1-me);
    if(active&&sound.walls>0&&edge<range&&t>=edgeNext){const closeness=1-edge/range;blip(me<.5?1250:1550,.055,me<.5?0:1,sound.wallTone,.07+.10*closeness,'walls');edgeNext=t+.7-.48*closeness;}
  }
  function saveSound(){try{localStorage.setItem('air-hockey-sound-v1',JSON.stringify(sound));document.getElementById('sound-status').textContent='Sound settings saved on this device.';}catch{document.getElementById('sound-status').textContent='Settings applied for this session. Device storage is unavailable.';}}
  function syncSoundControls(){document.querySelectorAll('[data-sound]').forEach(e=>{const v=sound[e.dataset.sound];e.value=v;const out=document.getElementById(e.id+'-value');if(out)out.textContent=v+'%';});}
  document.addEventListener('input',e=>{const key=e.target.dataset?.sound;if(!Object.hasOwn(SOUND_DEFAULTS,key))return;sound[key]=typeof SOUND_DEFAULTS[key]==='number'?Number(e.target.value):e.target.value;syncSoundControls();saveSound();});
  document.addEventListener('change',e=>{const key=e.target.dataset?.sound;if(!Object.hasOwn(SOUND_DEFAULTS,key))return;sound[key]=typeof SOUND_DEFAULTS[key]==='number'?Number(e.target.value):e.target.value;syncSoundControls();saveSound();});
  document.addEventListener('click',e=>{
    const btn=e.target.closest('[data-preview],#sound-reset');if(!btn)return;
    if(btn.id==='sound-reset'){sound={...SOUND_DEFAULTS};syncSoundControls();saveSound();return;}
    if(!ctx)initAudio();ctx.resume();master.gain.setTargetAtTime(volume('master')*.65,ctx.currentTime,.02);
    const x=Number(document.getElementById('preview-position').value),kind=btn.dataset.preview;
    if(kind==='puck')blip(sound.distance==='volume'?660:480+Number(document.getElementById('preview-distance').value)*400,.8,x,sound.puckTone,(sound.distance==='pitch'?.17:.10+Number(document.getElementById('preview-distance').value)*.12),'puck');
    if(kind==='paddle')blip(sound.paddleTone==='soft'?190:145,.8,x,sound.paddleTone,.16,'paddle');
    if(kind==='walls')blip(x<.5?1250:1550,.12,x,sound.wallTone,.17,'walls');
    if(kind==='hits')hitSound(x);
    if(kind==='goals')blip(1047,.3,.5,'sine',.22,'goals');
    if(kind==='speech')say('You two, computer one. Your spoken score sounds like this.',true);
  });
  syncSoundControls();
