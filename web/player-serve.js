  let serveTouch=null;
  function serve(){
    puck={x:me,y:.10,vx:0,vy:0};state='countdown';serveTouch=null;
    document.getElementById('serve-controls').hidden=true;
    document.getElementById('pad').textContent='3… 2… 1…';
    say('Three.',true);serveSound(0);
    later(()=>{say('Two.',true);serveSound(1);},1000);
    later(()=>{say('One.',true);serveSound(2);},2000);
    later(()=>{
      if(ctx&&ctx.state!=='running')ctx.resume();puck.x=me;puck.y=.10;puck.vx=puck.vy=0;state='ready';
      document.getElementById('serve-controls').hidden=false;
      document.getElementById('pad').textContent='Place the puck, then flick upward to strike.';
      const dropped=say('Puck is dropped.',true);if(dropped)dropped.onend=()=>{if(state==='ready'&&!paused&&ctx)ctx.resume();};
    },3000);
  }
  function placePuck(x=me){if(state!=='ready'||paused)return;if(ctx&&ctx.state!=='running')ctx.resume();puck.x=clamp(x,0,1);puck.y=.10;me=puck.x;syncPaddle();}
  function strikePuck(horizontal=0){
    if(state!=='ready'||paused)return;
    if(Math.abs(me-puck.x)>PADDLE_HALF){say('Move your paddle under the puck.',true);return;}
    if(ctx&&ctx.state!=='running')ctx.resume();const vx=clamp(horizontal,-.65,.65)*START_SPEED;
    puck.vx=vx;puck.vy=Math.sqrt(START_SPEED*START_SPEED-vx*vx);state='playing';
    document.getElementById('serve-controls').hidden=true;document.getElementById('pad').textContent='Playing.';
    hitSound(puck.x);buzz('heavy');serveTouch=null;
  }
  function handleServingTouch(e){
    if(state!=='ready'||paused)return;e.preventDefault();const touch=e.touches?.[0]||e.changedTouches?.[0];if(!touch)return;
    if(e.type==='touchstart'){serveTouch={x:touch.clientX,y:touch.clientY};placePuck(paddleFromTouch(touch.clientX));}
    else if(serveTouch){me=paddleFromTouch(touch.clientX);syncPaddle();if(serveTouch.y-touch.clientY>=28)strikePuck((touch.clientX-serveTouch.x)/Math.max(1,window.innerWidth)*2);if(e.type==='touchend')serveTouch=null;}
  }
  document.addEventListener('touchend',e=>{if(state==='ready'&&!e.target.closest('#gamebar'))handleServingTouch(e);},{passive:false});
  document.addEventListener('click',e=>{if(e.target.closest('#place-puck'))placePuck();if(e.target.closest('#strike-puck'))strikePuck();});
