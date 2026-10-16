  // A virtual cursor for the game's own menus. This does not control iOS.
  let awaitingFirstGesture=false,suppressClickUntil=0,talkItem=null,talkList=[],touchOrigin=null,lastTap=0,multiTouch=false,previousControlMode='accessible',activating=false;
  function talkSpeak(text){return gameSpeak(text,true,true);}
  function inGame(){return document.body.classList.contains('active');}
  function playingTouch(){return inGame()&&!paused&&state!=='over'&&state!=='idle';}
  function talkItems(){
    const root=inGame()?document.getElementById('gamebar'):document.getElementById('pad');
    return [...root.querySelectorAll('button,select,input[type="range"],summary,h1,h2,h3,p,li')].filter(e=>!e.disabled&&e.getClientRects().length>0&&!e.closest('[hidden]')&&!e.matches('[role="status"],#voice-status,#sound-status')&&e.id!=='voiceover-note');
  }
  function describeTalkItem(e){
    if(!e)return 'No items on this screen.';const label=e.labels?.[0]?.textContent?.trim()||e.getAttribute('aria-label')||e.textContent?.trim()||'Item';
    if(e.tagName==='SELECT')return label+'. '+(e.selectedOptions[0]?.textContent||'')+'. Swipe up or down to change.';
    if(e.type==='range')return label.replace(/:\s*\d+%$/,'')+'. '+e.value+' percent. Swipe up or down to adjust.';
    if(e.tagName==='SUMMARY')return label+'. '+(e.parentElement.open?'Expanded':'Collapsed')+'. Double tap to '+(e.parentElement.open?'close.':'open.');
    if(e.tagName==='BUTTON')return label+'. Button. Double tap to activate.';
    return label;
  }
  function selectTalkItem(e,announce=true){
    talkItem?.classList.remove('talk-selected');talkItem=e;if(!e){if(announce)talkSpeak('No items on this screen.');return;}
    e.classList.add('talk-selected');e.scrollIntoView({block:'nearest'});if(announce)talkSpeak(describeTalkItem(e));
  }
  function refreshTalk(preferred,announce=true){const status=document.getElementById('talking-status');if(status)status.hidden=!talking;talkList=talkItems();selectTalkItem(preferred&&talkList.includes(preferred)?preferred:talkList[0],announce);}
  function moveTalk(direction){
    talkList=talkItems();let i=talkList.indexOf(talkItem);if(i<0){selectTalkItem(talkList[0]);return;}const next=i+direction;
    if(next<0||next>=talkList.length){talkSpeak((next<0?'First item. ':'Last item. ')+describeTalkItem(talkItem));return;}selectTalkItem(talkList[next]);
  }
  function adjustTalk(direction){
    if(!talkItem){refreshTalk();return;}
    if(talkItem.type==='range'){
      const el=talkItem,step=Number(el.step)||1;el.value=clamp(Number(el.value)+direction*step,Number(el.min),Number(el.max));el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));talkSpeak(describeTalkItem(el));return;
    }
    if(talkItem.tagName==='SELECT'){
      const el=talkItem;el.selectedIndex=clamp(el.selectedIndex+direction,0,el.options.length-1);el.dispatchEvent(new Event('change',{bubbles:true}));talkSpeak(describeTalkItem(el));return;
    }
    talkSpeak('Swipe left or right to select an item. Double tap activates a button. Swipe up or down changes a selected choice or slider.');
  }
  function activateTalk(){
    if(!talkItem){refreshTalk();return;}const selected=talkItem;
    if(selected.tagName==='SUMMARY'){selected.parentElement.open=!selected.parentElement.open;talkList=talkItems();talkSpeak(describeTalkItem(selected));return;}
    if(selected.tagName!=='BUTTON'){talkSpeak(describeTalkItem(selected));return;}
    const preview=selected.hasAttribute('data-preview')||selected.hasAttribute('data-voice-test');
    const before=state;activating=true;try{selected.click();}finally{activating=false;}
    if(!talking)return;
    if(playingTouch()){if(before===state&&selected.id==='pause')talkSpeak('Resumed. Slide one finger left or right to play. Two finger tap pauses.');return;}
    if(preview||selected.hasAttribute('data-voice-stop'))return; // Let the chosen sound play without another spoken overlay.
    if(selected.hasAttribute('data-view')){const screen=selected.dataset.view;refreshTalk(screen==='home'?document.getElementById('main-title'):document.querySelector('#'+screen+'-screen h2'));return;}if(selected.id==='menu'){refreshTalk(document.getElementById('start'));return;}if(!selected.isConnected||!selected.getClientRects().length){refreshTalk();return;}
    if(selected.id==='stop-preview'||selected.hasAttribute('data-stop-preview'))talkSpeak('Sound test stopped.');else if(selected.id==='sound-reset')talkSpeak('Distinct default sounds restored.');else talkSpeak(describeTalkItem(selected));
  }
  function beginTalking(announce=true){
    if(!('speechSynthesis' in window)){voiceStatus('This browser cannot speak. Keep VoiceOver on.');return;}
    if(!talking)previousControlMode=voicePrefs.controls;talking=true;voiceEnabled=true;voicePrefs.controls='direct';syncVoiceControls();document.body.classList.add('talking');
    document.getElementById('talking-status').hidden=false;const resume=document.getElementById('resume-talking');if(resume)resume.hidden=true;refreshTalk(document.getElementById('start'),false);
    if(announce)talkSpeak('Talking interface ready. You can now turn off iPhone VoiceOver. In menus, swipe right for next, left for previous. Double tap anywhere to activate the selected item. Swipe up or down to change a selected sound, voice, or volume. A single tap repeats the current item. Two finger tap goes back. During play, slide left and right to move your paddle. Two finger tap pauses or resumes. Start game is selected.');
  }
  function endTalking(){
    awaitingFirstGesture=false;
    talking=false;const resume=document.getElementById('resume-talking');if(resume)resume.hidden=false;document.body.classList.remove('talking');talkItem?.classList.remove('talk-selected');voicePrefs.controls=previousControlMode;syncVoiceControls();document.getElementById('talking-status').hidden=true;
    gameSpeak('Talking interface stopped. Turn iPhone VoiceOver back on if you need it.',true,true);
  }
  function twoFingerAction(){
    lastTap=0;if(inGame()&&state!=='over'){pauseGame();if(paused){refreshTalk(document.getElementById('pause'),false);talkSpeak('Paused. Resume selected. Swipe to End game, or double tap to resume. Two finger tap also resumes.');}else talkSpeak('Resumed. Slide one finger left or right.');return;}
    const back=[...document.querySelectorAll('[data-view="home"]')].find(e=>e.getClientRects().length>0);if(back){activating=true;try{back.click();}finally{activating=false;}refreshTalk(document.getElementById('main-title'));}else if(inGame()&&state==='over'){refreshTalk(document.getElementById('restart'));}else talkSpeak(describeTalkItem(talkItem));
  }
  document.addEventListener('click',e=>{if(e.target.closest('#start-talking,#resume-talking'))beginTalking();if(e.target.closest('#stop-talking'))endTalking();if(e.target.closest('#restart'))start();});
  document.addEventListener('click',e=>{if(talking&&!activating&&e.isTrusted&&performance.now()<suppressClickUntil){e.preventDefault();e.stopImmediatePropagation();}},true);
  document.addEventListener('touchstart',e=>{
    if(!talking)return;
    if(e.touches.length>=2){suppressClickUntil=performance.now()+900;multiTouch=true;touchOrigin=null;e.preventDefault();e.stopImmediatePropagation();return;}
    if(playingTouch())return;
    suppressClickUntil=performance.now()+900;const t=e.touches[0];touchOrigin={x:t.clientX,y:t.clientY,time:performance.now()};e.preventDefault();e.stopImmediatePropagation();
  },{capture:true,passive:false});
  document.addEventListener('touchmove',e=>{if(talking&&(multiTouch||!playingTouch())){e.preventDefault();e.stopImmediatePropagation();}},{capture:true,passive:false});
  document.addEventListener('touchend',e=>{
    if(!talking)return;
    if(multiTouch){e.preventDefault();e.stopImmediatePropagation();if(e.touches.length===0){multiTouch=false;twoFingerAction();}return;}
    if(playingTouch())return;
    e.preventDefault();e.stopImmediatePropagation();const start=touchOrigin;touchOrigin=null;if(!start)return;
    suppressClickUntil=performance.now()+900;const t=e.changedTouches[0],dx=t.clientX-start.x,dy=t.clientY-start.y,now=performance.now();
    if(awaitingFirstGesture){awaitingFirstGesture=false;lastTap=Math.max(Math.abs(dx),Math.abs(dy))<30?now:0;talkSpeak('Air Hockey Audio. '+describeTalkItem(talkItem));return;}
    if(Math.max(Math.abs(dx),Math.abs(dy))>=30){lastTap=0;if(Math.abs(dx)>Math.abs(dy))moveTalk(dx<0?-1:1);else adjustTalk(dy<0?1:-1);return;}
    if(now-start.time>700){lastTap=0;talkSpeak(describeTalkItem(talkItem));return;}
    if(lastTap&&now-lastTap<420){lastTap=0;activateTalk();}else{lastTap=now;talkSpeak(describeTalkItem(talkItem));}
  },{capture:true,passive:false});
  document.addEventListener('touchcancel',()=>{touchOrigin=null;multiTouch=false;lastTap=0;},true);
  document.addEventListener('keydown',e=>{if(!talking||playingTouch())return;const actions={ArrowRight:()=>moveTalk(1),ArrowLeft:()=>moveTalk(-1),ArrowUp:()=>adjustTalk(1),ArrowDown:()=>adjustTalk(-1),Enter:activateTalk,Escape:twoFingerAction};if(actions[e.key]){e.preventDefault();e.stopImmediatePropagation();actions[e.key]();}},true);

  // Routing starts on every page opening. The first actual gesture unlocks
  // browser speech naturally; there is no separate activation requirement.
  beginTalking(false);
  awaitingFirstGesture=true;
