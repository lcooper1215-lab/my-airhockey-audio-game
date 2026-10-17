export const LIBRARY={
 goalWarningTone:[['rise','Short rising goal-border chirp'],['bell','Short goal-border bell']],
 airTone:[['fan','Table blower: airflow and low motor hum'],['soft','Softer filtered airflow']],
 puckTone:[['click','Dry rhythmic clicks'],['tock','Hollow ticking'],['shaker','Soft shaker ticks'],['sine','Smooth round tone'],['triangle','Soft reed tone'],['warble','Gentle wavering tone']],
 paddleTone:[['glide','Soft surface glide'],['guide','Clear moving paddle hum: position and motion'],['sine','Low steady hum'],['triangle','Low reed'],['soft','Higher round hum'],['hollow','Hollow organ hum']],
 wallTone:[['rail','Recorded table strike with metallic rail clink'],['metal','Metallic clank'],['glass','Glass ping'],['wood','Wooden knock'],['rubber','Rubber thud'],['rattle','Short metal rattle'],['bell','Small bell']],
 hitTone:[['solid','Crisp paddle clack'],['recorded','Recorded air hockey table strike'],['wood','Wood block'],['pop','Soft pop'],['pluck','Plucked string'],['chime','Two-note chime'],['metal','Light metal tap']],
 aiTone:[['return','Lower opponent clack and short knock'],['knockpair','Two low knocks: computer hit'],['recordedlow','Recorded table strike, lower pitch'],['drum','Low drum'],['rubber','Rubber bounce'],['brush','Brushed swish'],['wood','Hollow knock']],
 edgeTone:[['chirp','High birdlike chirp'],['whisper','Airy hiss'],['bell','Tiny bell pulse'],['reed','High reed pulse']],
 serveTone:[['beeps','Three rounded beeps'],['pluck','Three plucked notes'],['bell','Three bells']],
 goalTone:[['harp','Harp melody'],['bells','Bell melody'],['arcade','Soft arcade melody'],['flute','Flute melody']]
};
const choice=(k,label,items)=>`<label for="sound-${k}">${label}</label><select id="sound-${k}" data-sound="${k}">${items.map(([v,l])=>`<option value="${v}">${l}</option>`).join('')}</select>`;
const slider=(k,label,value)=>`<label for="sound-${k}">${label}</label><input id="sound-${k}" data-sound="${k}" type="range" min="0" max="100" step="5" value="${value}" aria-label="${label}">`;
const group=(key,title,tone,volume,description)=>`<details class="sound-group"><summary>${title}</summary><div class="sound-group-body"><p>${description}</p>${choice(tone,title+' sound',LIBRARY[tone])}<button data-preview="${key}">Test ${title.toLowerCase()} sound</button>${slider(key,title+' volume',volume)}</div></details>`;
export const soundPanel=`<section id="sound-screen" class="panel app-screen" hidden aria-labelledby="sound-title"><h2 id="sound-title" tabindex="-1">Sound settings</h2><button data-view="home">Back to main menu</button><p>Open a group. Choose a sound, test it, then adjust volume. Swipe up or down on a choice to change it; double tap also selects the next sound. Changes save automatically.</p>
<details class="sound-group"><summary>Overall volume</summary><div class="sound-group-body">${slider('master','Overall volume',65)}</div></details>
${group('puck','Puck','puckTone',85,'Left and right follow the puck’s actual position and wall bounces. Volume rises smoothly on your half and falls toward the opponent. The default clicks keep the same pitch and rhythm.')}
${group('paddle','Your paddle movement','paddleTone',35,'A quiet surface glide follows your moving paddle. This is softened plastic Foley; impacts use a real table recording.')}
${group('hits','Your hit','hitTone',65,'A crisp clack confirms actual contact. The background briefly softens so the hit stands out.')}
${group('ai','Opponent hit','aiTone',50,'A lower clack with a short knock identifies the opponent’s return at the far end.')}
${group('walls','Wall hits','wallTone',65,'One metallic clink on the side the puck hits.')}
<details class="sound-group"><summary>Table airflow</summary><div class="sound-group-body"><button data-preview="air">Test table airflow</button>${slider('air','Table airflow volume',12)}</div></details>
<button id="stop-preview">Stop sound test</button><button id="sound-reset">Reset sounds</button><p id="sound-status" role="status">Ready.</p></section>`;
