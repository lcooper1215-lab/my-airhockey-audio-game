  // The computer reacts periodically and has a slower lateral speed than
  // the puck; it no longer has frame-perfect tracking on every shot.
  const AI_PADDLE_HALF=.09;
  let aiTarget=.5,aiThinkIn=0;
  function step(dt){
    if(state!=='playing')return;
    aiThinkIn-=dt;
    if(aiThinkIn<=0){aiTarget=puck.vy>0?puck.x:.5;aiThinkIn=.22;}
    ai+=clamp(aiTarget-ai,-AI_SPEED*dt,AI_SPEED*dt);
    puck.x+=puck.vx*dt;puck.y+=puck.vy*dt;
    if(puck.x<0){puck.x=-puck.x;puck.vx=Math.abs(puck.vx);wallSound(0);buzz('light');}
    if(puck.x>1){puck.x=2-puck.x;puck.vx=-Math.abs(puck.vx);wallSound(1);buzz('light');}
    if(puck.y<=.05&&puck.vy<0){
      const off=puck.x-me;
      if(Math.abs(off)<=PADDLE_HALF){puck.y=.05;puck.vy=Math.abs(puck.vy);puck.vx+=off*2.2;speedUp();hitSound(puck.x);buzz('heavy');}
      else if(puck.y<0)goal(false);
    }
    if(puck.y>=.95&&puck.vy>0){
      const off=puck.x-ai;
      if(Math.abs(off)<=AI_PADDLE_HALF){puck.y=.95;puck.vy=-Math.abs(puck.vy);puck.vx+=off*2;speedUp();aiHitSound(puck.x);}
      else if(puck.y>1)goal(true);
    }
  }
