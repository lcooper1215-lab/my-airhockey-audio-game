  let viewPrefs={theme:'dark',puckSize:'32',trail:'on',text:'large'},visualEvent='',visualEventUntil=0,puckTrail=[],lastTrailAt=0;
  try{const v=JSON.parse(localStorage.getItem('air-hockey-visual-v1')||'{}');for(const [k,values]of Object.entries({theme:['dark','light'],puckSize:['32','42'],trail:['on','off'],text:['large','regular']}))if(values.includes(v[k]))viewPrefs[k]=v[k];}catch{}
  function applyVisualPrefs(){document.documentElement?.setAttribute?.('data-vision-theme',viewPrefs.theme);document.documentElement?.style?.setProperty('--puck-size',viewPrefs.puckSize+'px');document.body.classList.toggle?.('large-ui',viewPrefs.text==='large');document.querySelectorAll('[data-visual]').forEach(e=>e.value=viewPrefs[e.dataset.visual]);}
  function showPlayEvent(text){if(!document.body.classList.contains('active'))return;visualEvent=text;visualEventUntil=performance.now()+650;}
  function renderLowVision(){
    if(!document.body.classList.contains('active')){puckTrail=[];return;}
    const now=performance.now();if(state==='playing'&&!paused&&now-lastTrailAt>=45){puckTrail.unshift({x:puck.x,y:1-puck.y});puckTrail=puckTrail.slice(0,5);lastTrailAt=now;}else if(state!=='playing')puckTrail=[];
    for(let i=0;i<4;i++){const e=document.getElementById('trail-'+i);if(!e?.style)continue;const point=puckTrail[i+1];e.hidden=viewPrefs.trail!=='on'||!point;if(point){e.style.left=clamp(point.x,0,1)*100+'%';e.style.top=clamp(point.y,0,1)*100+'%';e.style.opacity=String(.45-i*.1);}}
    const callout=document.getElementById('visual-callout');if(callout)callout.textContent=paused?'PAUSED':state==='ready'?'PLACE PUCK · SWIPE TO SERVE':state==='over'?(score.me>score.ai?'YOU WIN':'COMPUTER WINS'):state==='countdown'?(document.getElementById('pad').textContent||'READY'):now<visualEventUntil?visualEvent:'';
    const scoreboard=document.getElementById('scoreboard'),key=score.me+':'+score.ai;if(scoreboard&&scoreboard.getAttribute?.('data-score')!==key){scoreboard.setAttribute('data-score',key);scoreboard.innerHTML='<span class="score-box human-score">YOU<strong>'+score.me+'</strong></span><span class="score-box ai-score">COMPUTER<strong>'+score.ai+'</strong></span>';}
  }
  document.addEventListener('change',e=>{const key=e.target.dataset?.visual;if(!Object.hasOwn(viewPrefs,key))return;viewPrefs[key]=e.target.value;applyVisualPrefs();try{localStorage.setItem('air-hockey-visual-v1',JSON.stringify(viewPrefs));}catch{}document.getElementById('view-status').textContent='Display updated.';});
  document.addEventListener('click',e=>{if(e.target.closest('#visual-touch-mode')){if(talking){previousControlMode='direct';endTalking();}voicePrefs.controls='direct';saveVoice();syncVoiceControls();}if(e.target.closest('[data-view="display"]'))applyVisualPrefs();});
  applyVisualPrefs();
