  const HUMAN_GOAL_BORDER=.05; // Front edge of the human paddle/goal line.
  let goalBorderVoice=null,goalBorderLatched=false;
  function goalBorderSound(x,follow=false){
    if(!ctx||volume('goalWarning')===0)return;
    const o=ctx.createOscillator(),g=ctx.createGain(),p=ctx.createStereoPanner(),t=ctx.currentTime;
    o.type='sine';o.frequency.setValueAtTime(sound.goalWarningTone==='bell'?1950:1650,t);
    if(sound.goalWarningTone!=='bell')o.frequency.linearRampToValueAtTime(2150,t+.085);
    g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(volume('goalWarning')*.32,t+.006);g.gain.exponentialRampToValueAtTime(.0001,t+.11);
    p.pan.setValueAtTime(spatialPan(x),t);o.connect(g).connect(p).connect(master);
    if(follow)goalBorderVoice={pan:p,until:t+.11};if(previewing)previewNodes.add(o);
    o.start(t);o.stop(t+.13);o.onended=()=>{previewNodes.delete(o);if(goalBorderVoice?.pan===p)goalBorderVoice=null;o.disconnect();g.disconnect();p.disconnect();};
  }
  function goalBorderCue(dt){
    if(state!=='playing'||puck.vy>=0){goalBorderLatched=false;return;}if(paused)return;if(puck.y>HUMAN_GOAL_BORDER)goalBorderLatched=false;if(puck.y<HUMAN_GOAL_BORDER||goalBorderLatched)return;
    const next=puck.y+puck.vy*dt;if(next>HUMAN_GOAL_BORDER)return;
    const untilBorder=(puck.y-HUMAN_GOAL_BORDER)/-puck.vy;let x=puck.x+puck.vx*untilBorder;
    if(x<0)x=-x;if(x>1)x=2-x;
    goalBorderLatched=true;goalBorderSound(clamp(x,0,1),true);
  }
  function updateGoalBorderPan(){if(goalBorderVoice&&ctx.currentTime<goalBorderVoice.until)goalBorderVoice.pan.pan.setTargetAtTime(spatialPan(puck.x),ctx.currentTime,.008);else goalBorderVoice=null;}
