import { gameHtml } from './upstream/gameHtml.mjs';
import { mkdir, writeFile } from 'node:fs/promises';
await mkdir('dist', {recursive:true});
let html = gameHtml.replace('<html>', '<html lang="en">').replace('<head>', `<head>
<meta charset="utf-8"><title>Air Hockey Audio</title>
<meta name="theme-color" content="#07111f">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Air Hockey">
<link rel="manifest" href="./manifest.webmanifest">
<link rel="apple-touch-icon" href="./icon-192.png">
<meta name="description" content="Play air hockey by sound and touch. Headphones recommended.">`);
html = html.replace('initial-scale=1,maximum-scale=1,user-scalable=no','initial-scale=1,viewport-fit=cover');
html = html.replace('</style>', `
  body{background:#07111f} #pad{display:block;padding: max(28px,env(safe-area-inset-top)) 24px max(28px,env(safe-area-inset-bottom));overflow:auto;touch-action:pan-y}
  main{max-width:540px;margin:6vh auto;text-align:left}h1{font-size:38px;letter-spacing:-1px;margin:12px 0}p,li{line-height:1.65} .eyebrow{color:#6fe3cf;font-size:14px;letter-spacing:2px} .muted{color:#bdcbdc}button{font:inherit;border-radius:14px;border:1px solid #65788e;padding:16px 20px;min-height:52px;color:#fff;background:#16283d;margin:6px 8px 6px 0;cursor:pointer}button:focus-visible{outline:3px solid #fff;outline-offset:3px}#start{background:#6fe3cf;color:#07111f;font-weight:700;border:0;width:100%}#gamebar{position:fixed;top:env(safe-area-inset-top,0);left:0;right:0;z-index:3;background:#07111f;padding:8px;text-align:center}#gamebar[hidden]{display:none}#gamebar button{padding:10px 18px}#scoreboard{font-size:18px}body.active #pad{touch-action:none;display:flex;align-items:center;justify-content:center} .panel{border:1px solid #30445c;border-radius:18px;padding:16px;margin-top:24px}
</style>`);
html=html.replace('<div id="pad">Tap anywhere to start</div>', `<div id="pad"><main><div class="eyebrow">HEADPHONES ON · FIRST TO SEVEN</div><h1>Air Hockey Audio</h1><p class="muted">Follow the puck by sound. Defend your goal by touch.</p><button id="start">Start game</button><p id="status" role="status" class="muted">Ready to play.</p><section class="panel" aria-labelledby="how"><h2 id="how">How to play</h2><ol><li>Use headphones. The puck moves between your left and right ears.</li><li>Slide one finger left and right to move your paddle. A low hum marks its position.</li><li>The puck becomes higher and louder as it approaches your goal.</li><li>First to seven goals wins. Your score is spoken after each goal.</li></ol><p>With VoiceOver: activate Start game, then turn VoiceOver off for direct touch play. Turn it back on to use the menu. You can use the side-button Accessibility Shortcut if configured.</p><p>Keyboard: Left and Right arrows move your paddle. Space pauses or resumes.</p></section><section class="panel"><h2>Install on iPhone</h2><p>Open this page in Safari. Choose Share, then Add to Home Screen. Leave Open as Web App enabled if shown, then choose Add.</p><p class="muted">Browser test version · Audio and touch supported. Native vibration is unavailable on iPhone web apps.</p></section></main></div><div id="gamebar" hidden><span id="scoreboard" aria-live="polite">You 0 — Computer 0</span><br><button id="pause">Pause</button><button id="menu">End game</button></div>`);
html=html.replace("if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(Object.assign({type}, data||{})));", `if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(Object.assign({type}, data||{})));
    else if (type === 'speak' && 'speechSynthesis' in window) { if(data.interrupt) speechSynthesis.cancel(); const u=new SpeechSynthesisUtterance(data.text); u.rate=1.05; speechSynthesis.speak(u); }
    else if(type==='haptic' && navigator.vibrate) navigator.vibrate(data.style==='heavy'?50:15);`);
html=html.replace("let serveTimer = 0;", `let serveTimer = 0;
  let paused=false, session=0, timers=[], wakeLock;
  const menuHTML=document.getElementById('pad').innerHTML;
  const later=(fn,ms)=>{const current=session; const id=setTimeout(()=>{if(current!==session)return; const run=()=>{if(current!==session)return;if(paused){timers.push(setTimeout(run,100));return;}fn();};run();},ms);timers.push(id);return id;};
  function clearTimers(){session++;timers.forEach(clearTimeout);timers=[];}
  async function wake(){try{if(navigator.wakeLock&&!document.hidden)wakeLock=await navigator.wakeLock.request('screen');}catch{}}
  function pauseGame(){if(!ctx||state==='idle'||state==='over')return;paused=!paused;document.getElementById('pause').textContent=paused?'Resume':'Pause';if(paused){ctx.suspend();speechSynthesis?.cancel();wakeLock?.release();}else{ctx.resume();last=performance.now();wake();}document.getElementById('pad').textContent=paused?'Paused. Choose Resume to continue.':'Playing. Slide left and right.';}
  document.getElementById('pause').onclick=pauseGame;
  document.getElementById('menu').onclick=()=>{clearTimers();state='idle';paused=false;if(ctx)ctx.suspend();if('speechSynthesis' in window)speechSynthesis.cancel();wakeLock?.release();document.body.classList.remove('active');document.getElementById('gamebar').hidden=true;document.getElementById('pad').innerHTML=menuHTML;document.getElementById('start').onclick=start;document.getElementById('start').focus();};
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&!paused&&ctx&&state!=='idle'&&state!=='over')pauseGame();});
  document.addEventListener('keydown',e=>{if(state==='idle')return;if(e.code==='Space'){e.preventDefault();pauseGame();}if(e.code==='ArrowLeft'||e.code==='ArrowRight'){e.preventDefault();me=clamp(me+(e.code==='ArrowLeft'?-.05:.05),0,1);}});`);
// Keep deferred game sounds and serves in the same session; pause cancels time advancement.
html=html.replaceAll('setTimeout(()=>blip','later(()=>blip').replaceAll('setTimeout(()=> serve','later(()=> serve').replaceAll('setTimeout(()=>serve','later(()=>serve');
html=html.replace('if (mine) score.me++; else score.ai++;', `if (mine) score.me++; else score.ai++;
    document.getElementById('scoreboard').textContent='You '+score.me+' — Computer '+score.ai;`);
html=html.replace('step(dt); if (ctx) updateAudio();','if(!paused){step(dt); if (ctx) updateAudio();}');
html=html.replace('e.preventDefault();\n    const touch', "if(!document.body.classList.contains('active')||paused||e.target.closest('#gamebar'))return;\n    e.preventDefault();\n    const touch");
html=html.replace("if (!ctx) initAudio();", "clearTimers(); paused=false; document.getElementById('pause').textContent='Pause'; document.body.classList.add('active');document.getElementById('gamebar').hidden=false;document.getElementById('scoreboard').textContent='You 0 — Computer 0';wake();\n    if (!ctx) initAudio();");
html=html.replace("document.addEventListener('touchstart', e => { start(); onTouch(e); }, {passive:false});", "document.addEventListener('touchstart', e => { if(e.target.closest('#gamebar'))return; if(state==='over')start(); onTouch(e); }, {passive:false});");
html=html.replace("document.addEventListener('mousedown', start);", "document.getElementById('start').onclick=start;\n  document.addEventListener('mousedown',e=>{if(state==='over'&&!e.target.closest('#gamebar'))start();});");
html=html.replace("document.addEventListener('mousemove', e => { me", "document.addEventListener('mousemove', e => { if(state==='idle'||paused||e.target.closest('#gamebar'))return; me");
html=html.replace('</body>', `<script>if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));}</script></body>`);
await writeFile('dist/index.html',html);
await writeFile('dist/manifest.webmanifest',JSON.stringify({id:'/',name:'Air Hockey Audio',short_name:'Air Hockey',start_url:'/',scope:'/',display:'standalone',background_color:'#07111f',theme_color:'#07111f',icons:[{src:'./icon-192.png',sizes:'192x192',type:'image/png'},{src:'./icon-512.png',sizes:'512x512',type:'image/png',purpose:'any maskable'}]},null,2));
await writeFile('dist/sw.js',`const CACHE='air-hockey-v1'; const ASSETS=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png'];self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).origin!==location.origin)return;if(e.request.mode==='navigate'){e.respondWith(fetch(e.request).then(r=>{if(r.ok&&!r.redirected){const copy=r.clone();caches.open(CACHE).then(c=>c.put('./index.html',copy));}return r;}).catch(()=>caches.match('./index.html')));}else if(ASSETS.some(p=>new URL(p,location.href).href===e.request.url)){e.respondWith(caches.match(e.request).then(c=>c||fetch(e.request)));}});`);
console.log('Built iPhone web app.');
