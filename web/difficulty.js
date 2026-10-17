  const DIFFICULTIES={
    easy:{label:'Too easy',speed:.20,reaction:.22,half:.09,prediction:0},
    medium:{label:'Not so bad',speed:.22,reaction:.20,half:.09,prediction:0},
    hard:{label:"I'm not ready",speed:.30,reaction:.12,half:.10,prediction:.50}
  };
  let difficulty='easy',rallySeconds=0;
  try{const saved=localStorage.getItem('air-hockey-difficulty-v1');if(Object.hasOwn(DIFFICULTIES,saved))difficulty=saved;}catch{}
  const level=()=>DIFFICULTIES[difficulty];
  function syncDifficulty(){const e=document.getElementById('difficulty');if(e)e.value=difficulty;}
  document.addEventListener('change',e=>{if(e.target.id!=='difficulty'||!Object.hasOwn(DIFFICULTIES,e.target.value))return;if(state!=='idle'&&state!=='over'){syncDifficulty();return;}difficulty=e.target.value;try{localStorage.setItem('air-hockey-difficulty-v1',difficulty);}catch{}syncDifficulty();});
  function computerTarget(){
    if(puck.vy<=0)return .5;
    const projected=puck.x+puck.vx*Math.max(0,.95-puck.y)/puck.vy;
    // Fold projected side-wall reflections back into the table.
    const wrapped=((projected%2)+2)%2,landing=wrapped<=1?wrapped:2-wrapped;
    return clamp(puck.x+(landing-puck.x)*level().prediction,0,1);
  }
  function timedPuckSpeed(){return Math.min(MAX_SPEED,START_SPEED+.006*rallySeconds);}
  function setPuckSpeed(target){const speed=Math.hypot(puck.vx,puck.vy);if(speed>0){puck.vx*=target/speed;puck.vy*=target/speed;}}
  function advanceRallySpeed(dt){rallySeconds+=dt;if(difficulty==='hard')setPuckSpeed(timedPuckSpeed());}
  syncDifficulty();
