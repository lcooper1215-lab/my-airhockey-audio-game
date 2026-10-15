// The whole game runs inside this page using the Web Audio API,
// which gives true stereo panning. The app shell (App.js) adds
// speech and haptics through messages sent with postMessage.

export const gameHtml = `<!doctype html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>
  html,body{margin:0;height:100%;background:#000;color:#fff;
    font-family:-apple-system,system-ui,sans-serif;overflow:hidden;
    touch-action:none;-webkit-user-select:none;user-select:none}
  #pad{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;
    text-align:center;font-size:20px;padding:24px;box-sizing:border-box}
</style>
</head>
<body>
<div id="pad">Tap anywhere to start</div>
<script>
(function(){
  const send = (type, data) => {
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(Object.assign({type}, data||{})));
  };
  const say = (text, interrupt) => send('speak', {text, interrupt: !!interrupt});
  const buzz = (style) => send('haptic', {style});

  // ---------- Game settings ----------
  const WIN_SCORE = 7;
  const PADDLE_HALF = 0.11;   // paddle half-width (table is 0..1 wide)
  const START_SPEED = 0.38;   // table lengths per second
  const MAX_SPEED = 1.05;
  const AI_SPEED = 0.55;      // how fast the computer paddle can move

  // Table: x 0 = left, 1 = right. y 0 = your goal (bottom), 1 = computer goal (top).
  let puck = {x:0.5, y:0.5, vx:0, vy:0};
  let me = 0.5, ai = 0.5;
  let score = {me:0, ai:0};
  let state = 'idle';   // idle | serving | playing | over
  let serveTimer = 0;

  // ---------- Audio ----------
  let ctx, master, puckOsc, puckGain, puckPan, padOsc, padGain, padPan;

  function initAudio(){
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);

    // Puck: a continuous tone. Pan = left/right. Pitch and loudness rise as it comes toward you.
    puckOsc = ctx.createOscillator(); puckOsc.type = 'triangle';
    puckGain = ctx.createGain(); puckGain.gain.value = 0;
    puckPan = ctx.createStereoPanner();
    puckOsc.connect(puckGain).connect(puckPan).connect(master); puckOsc.start();

    // Your paddle: a quiet low hum so you always know where you are.
    padOsc = ctx.createOscillator(); padOsc.type = 'sine'; padOsc.frequency.value = 110;
    padGain = ctx.createGain(); padGain.gain.value = 0.05;
    padPan = ctx.createStereoPanner();
    padOsc.connect(padGain).connect(padPan).connect(master); padOsc.start();
  }

  // Short sound effect, panned to a spot on the table.
  function blip(freq, dur, x, type, vol){
    const o = ctx.createOscillator(), g = ctx.createGain(), p = ctx.createStereoPanner();
    o.type = type || 'square'; o.frequency.value = freq;
    p.pan.value = clamp(x*2-1, -1, 1);
    const t = ctx.currentTime;
    g.gain.setValueAtTime(vol || 0.4, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(p).connect(master);
    o.start(t); o.stop(t + dur + 0.02);
  }
  function hitSound(x){ blip(880, 0.08, x, 'square', 0.5); blip(1320, 0.05, x, 'sine', 0.3); }
  function wallSound(x){ blip(220, 0.06, x, 'triangle', 0.5); }
  function aiHitSound(x){ blip(440, 0.08, x, 'square', 0.35); }
  function goalSound(mine){
    const notes = mine ? [523,659,784,1047] : [392,330,262,196];
    notes.forEach((f,i)=> setTimeout(()=>blip(f,0.18,0.5,'triangle',0.5), i*120));
  }

  function updateAudio(){
    const t = ctx.currentTime;
    puckPan.pan.setTargetAtTime(clamp(puck.x*2-1,-1,1), t, 0.02);
    const near = 1 - puck.y;                       // 1 = right in front of you
    puckOsc.frequency.setTargetAtTime(200 + near*700, t, 0.03);
    const vol = state === 'playing' ? 0.08 + near*0.32 : 0;
    puckGain.gain.setTargetAtTime(vol, t, 0.03);
    padPan.pan.setTargetAtTime(clamp(me*2-1,-1,1), t, 0.02);
  }

  // ---------- Game logic ----------
  function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }

  function serve(towardMe){
    puck.x = 0.5; puck.y = 0.5;
    const angle = (Math.random()*0.8 - 0.4);
    const s = START_SPEED;
    puck.vx = Math.sin(angle) * s;
    puck.vy = (towardMe ? -1 : 1) * Math.cos(angle) * s;
    state = 'serving'; serveTimer = 1.5;
    blip(660,0.1,0.5,'sine',0.4); setTimeout(()=>blip(660,0.1,0.5,'sine',0.4),500);
    setTimeout(()=>blip(990,0.2,0.5,'sine',0.5),1000);
  }

  function speedUp(){
    const s = Math.hypot(puck.vx, puck.vy);
    const ns = Math.min(MAX_SPEED, s*1.06);
    puck.vx *= ns/s; puck.vy *= ns/s;
  }

  function goal(mine){
    if (mine) score.me++; else score.ai++;
    goalSound(mine); buzz(mine ? 'success' : 'error');
    state = 'serving';
    puck.vx = puck.vy = 0;
    if (score.me >= WIN_SCORE || score.ai >= WIN_SCORE){
      state = 'over';
      const won = score.me > score.ai;
      say((won ? 'You win! ' : 'Computer wins. ') + score.me + ' to ' + score.ai + '. Tap to play again.', true);
      document.getElementById('pad').textContent = (won?'You win! ':'Computer wins. ') + 'Tap to play again';
      return;
    }
    say((mine ? 'Goal! ' : 'Computer scores. ') + 'You ' + score.me + ', computer ' + score.ai, true);
    state = 'wait';
    setTimeout(()=> serve(!mine), 2600);
  }

  function step(dt){
    // Computer paddle follows the puck with a speed limit.
    const target = puck.vy > 0 ? puck.x : 0.5;
    const d = target - ai;
    ai += clamp(d, -AI_SPEED*dt, AI_SPEED*dt);

    if (state === 'serving'){ serveTimer -= dt; if (serveTimer <= 0) state = 'playing'; return; }
    if (state !== 'playing') return;

    puck.x += puck.vx*dt; puck.y += puck.vy*dt;

    // Side walls
    if (puck.x < 0){ puck.x = -puck.x; puck.vx = Math.abs(puck.vx); wallSound(0); buzz('light'); }
    if (puck.x > 1){ puck.x = 2-puck.x; puck.vx = -Math.abs(puck.vx); wallSound(1); buzz('light'); }

    // Your end
    if (puck.y <= 0.05 && puck.vy < 0){
      const off = puck.x - me;
      if (Math.abs(off) <= PADDLE_HALF){
        puck.y = 0.05; puck.vy = Math.abs(puck.vy);
        puck.vx += off * 2.2;            // hitting with the edge sends it at an angle
        speedUp(); hitSound(puck.x); buzz('heavy');
      } else if (puck.y < 0){ goal(false); }
    }
    // Computer end
    if (puck.y >= 0.95 && puck.vy > 0){
      const off = puck.x - ai;
      if (Math.abs(off) <= PADDLE_HALF){
        puck.y = 0.95; puck.vy = -Math.abs(puck.vy);
        puck.vx += off * 2.0;
        speedUp(); aiHitSound(puck.x);
      } else if (puck.y > 1){ goal(true); }
    }
  }

  let last = 0;
  function loop(t){
    const dt = Math.min(0.05, (t - last)/1000 || 0); last = t;
    step(dt); if (ctx) updateAudio();
    requestAnimationFrame(loop);
  }

  // ---------- Touch: slide one finger left/right anywhere on screen ----------
  function onTouch(e){
    e.preventDefault();
    const touch = e.touches[0] || e.changedTouches[0];
    if (touch) me = clamp(touch.clientX / window.innerWidth, 0, 1);
  }
  function start(){
    if (!ctx) initAudio();
    if (ctx.state === 'suspended') ctx.resume();
    if (state === 'idle' || state === 'over'){
      score = {me:0, ai:0};
      document.getElementById('pad').textContent = 'Playing. Slide left and right.';
      say('Air hockey. Slide your finger left and right to move your paddle. The puck gets higher and louder as it comes toward you. First to ' + WIN_SCORE + ' wins.', true);
      state = 'wait';
      setTimeout(()=>serve(true), 7000);
    }
  }
  document.addEventListener('touchstart', e => { start(); onTouch(e); }, {passive:false});
  document.addEventListener('touchmove', onTouch, {passive:false});
  document.addEventListener('mousedown', start);
  document.addEventListener('mousemove', e => { me = clamp(e.clientX/window.innerWidth,0,1); });

  requestAnimationFrame(loop);
})();
</script>
</body>
</html>`;
