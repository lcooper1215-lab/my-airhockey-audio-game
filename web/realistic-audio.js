  const TABLE_IMPACTS=__TABLE_IMPACTS__;
  let recordedBuffers=[],airBuffer,airSource,airGain,airFilter,fanOsc,fanGain;
  function initTableAudio(){
    if(!ctx.createBuffer||!ctx.createBufferSource)return;
    recordedBuffers=TABLE_IMPACTS.samples.map(encoded=>{const raw=atob(encoded),pcm=new Int16Array(raw.length/2);for(let i=0;i<pcm.length;i++){const v=raw.charCodeAt(i*2)|(raw.charCodeAt(i*2+1)<<8);pcm[i]=v>32767?v-65536:v;}const buffer=ctx.createBuffer(1,pcm.length,TABLE_IMPACTS.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<pcm.length;i++)data[i]=pcm[i]/32768;return buffer;});
    initPaddleGlide();if(!ctx.createBiquadFilter)return;
    const sr=ctx.sampleRate||44100;airBuffer=ctx.createBuffer(2,sr*4,sr);let seed=417;for(let c=0;c<2;c++){const data=airBuffer.getChannelData(c);for(let i=0;i<data.length;i++){seed=(1664525*seed+1013904223)>>>0;data[i]=(seed/4294967296*2-1)*.45;}}
    airSource=ctx.createBufferSource();airSource.buffer=airBuffer;airSource.loop=true;const high=ctx.createBiquadFilter();high.type='highpass';high.frequency.value=220;airFilter=ctx.createBiquadFilter();airFilter.type='lowpass';airFilter.frequency.value=1500;airGain=ctx.createGain();airGain.gain.value=0;airSource.connect(high).connect(airFilter).connect(airGain).connect(master);airSource.start();
    fanOsc=ctx.createOscillator();fanOsc.type='sine';fanOsc.frequency.value=92;fanGain=ctx.createGain();fanGain.gain.value=0;fanOsc.connect(fanGain).connect(master);fanOsc.start();
  }
  function recordedHit(index,x,channel,delay=0,rate=1,amp=.48){
    if(!recordedBuffers.length||volume(channel)===0)return false;
    const source=ctx.createBufferSource(),g=ctx.createGain(),pan=ctx.createStereoPanner();source.buffer=recordedBuffers[index];source.playbackRate.value=rate;g.gain.value=amp*volume(channel);pan.pan.value=spatialPan(x);source.connect(g).connect(pan).connect(master);if(previewing)previewNodes.add(source);source.start(ctx.currentTime+delay);source.onended=()=>{previewNodes.delete(source);source.disconnect();g.disconnect();pan.disconnect();};return true;
  }
  function updateAir(activity){const active=activity===true?1:activity===false?0:activity;if(!airGain)return;const t=ctx.currentTime;airGain.gain.setTargetAtTime(active*volume('air')*.07,t,.2);fanGain.gain.setTargetAtTime(active*volume('air')*.02,t,.2);airFilter.frequency.setTargetAtTime(sound.airTone==='soft'?850:1500,t,.1);}
  function previewAir(){
    if(!airBuffer){tone(92,1.5,.5,'sine',.1,'air');return;}
    const s=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),high=ctx.createBiquadFilter(),g=ctx.createGain(),t=ctx.currentTime;s.buffer=airBuffer;filter.type='lowpass';filter.frequency.value=sound.airTone==='soft'?850:1500;high.type='highpass';high.frequency.value=220;g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(Math.max(.0001,volume('air')*.07),t+.12);g.gain.setValueAtTime(Math.max(.0001,volume('air')*.07),t+1.2);g.gain.linearRampToValueAtTime(.0001,t+1.5);s.connect(high).connect(filter).connect(g).connect(master);previewNodes.add(s);s.start(t);s.stop(t+1.5);s.onended=()=>{previewNodes.delete(s);s.disconnect();high.disconnect();filter.disconnect();g.disconnect();};tone(92,1.5,.5,'sine',.02,'air');
  }
  let glideSource,glideGain,glidePan;
  function initPaddleGlide(){if(!recordedBuffers[3])return;glideSource=ctx.createBufferSource();glideSource.buffer=recordedBuffers[3];glideSource.loop=true;glideGain=ctx.createGain();glideGain.gain.value=0;glidePan=ctx.createStereoPanner();glideSource.connect(glideGain).connect(glidePan).connect(master);glideSource.start();}
  function updatePaddleGlide(active,x){if(!glideGain)return;glidePan.pan.setTargetAtTime(spatialPan(x),ctx.currentTime,.01);glideGain.gain.setTargetAtTime(active?volume('paddle')*.30:0,ctx.currentTime,.045);}
  function previewPaddleGlide(x=.5,sweep=false){
    if(!recordedBuffers[3]){tone(240,1.5,x,'sine',.15,'paddle');return;}
    const s=ctx.createBufferSource(),g=ctx.createGain(),p=ctx.createStereoPanner(),t=ctx.currentTime;s.buffer=recordedBuffers[3];s.loop=true;p.pan.setValueAtTime(spatialPan(sweep?0:x),t);if(sweep)p.pan.linearRampToValueAtTime(1,t+1.5);g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(Math.max(.0001,volume('paddle')*.30),t+.06);g.gain.setValueAtTime(Math.max(.0001,volume('paddle')*.30),t+1.4);g.gain.linearRampToValueAtTime(.0001,t+1.55);s.connect(g).connect(p).connect(master);previewNodes.add(s);s.start(t);s.stop(t+1.57);s.onended=()=>{previewNodes.delete(s);s.disconnect();g.disconnect();p.disconnect();};
  }
