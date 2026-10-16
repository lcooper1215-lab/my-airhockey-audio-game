  function landscapePhone(){return window.innerWidth>window.innerHeight;}
  function paddleFromTouch(clientX){const table=document.getElementById('table-view');const r=table?.getBoundingClientRect?.();return clamp(r&&r.width?((clientX-r.left)/r.width):clientX/window.innerWidth,0,1);}
  function renderPortraitTable(){
    const table=document.getElementById('table-view');if(!table)return;const active=document.body.classList.contains('active');document.body.classList.toggle?.('readyserve',active&&state==='ready');table.hidden=!active;if(!active)return;
    for(const [id,x,y]of [['player-mallet',me,null],['computer-mallet',ai,null],['table-puck',puck.x,1-puck.y]]){const e=document.getElementById(id);if(e?.style){e.style.left=clamp(x,0,1)*100+'%';if(y!==null)e.style.top=clamp(y,0,1)*100+'%';}}
  }
  function checkPortrait(){
    if(!document.body.classList.contains('active')){const e=document.getElementById('portrait-notice');if(e)e.hidden=true;return;}
    const sideways=landscapePhone();document.getElementById('portrait-notice').hidden=!sideways;
    if(sideways&&!paused&&state!=='over'&&state!=='idle'){pauseGame();if(talking)refreshTalk(document.getElementById('pause'),false);gameSpeak('Game paused. Hold the phone upright with the charging port at the bottom. Computer goal is at the top. Then two finger tap to resume.',true,true);}
  }
  async function requestPortrait(){try{if(typeof screen!=='undefined'&&screen.orientation?.lock)await screen.orientation.lock('portrait-primary');}catch{}later(checkPortrait,0);}
  window.addEventListener?.('resize',checkPortrait);if(typeof screen!=='undefined')screen.orientation?.addEventListener?.('change',checkPortrait);
