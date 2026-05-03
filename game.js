// ══════════════════════════════════════════════════════════════
//  JENSIX – GAME LOGIC v3
//  Navigation + Crossword + Caesar + Labyrinth + Gutschein
// ══════════════════════════════════════════════════════════════

// ── NAVIGATION ─────────────────────────────────────────────────
function showScreen(id) {
  const cur = document.querySelector('.screen.active');
  const nxt = document.getElementById(id);
  if (!nxt) return;
  if (cur && cur !== nxt) {
    cur.classList.remove('visible');
    setTimeout(() => { cur.classList.remove('active'); activate(nxt); }, 500);
  } else activate(nxt);
}
function activate(el) {
  el.classList.add('active');
  window.scrollTo(0,0);
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('visible')));
}
function setProgress(p, label) {
  const wrap = document.getElementById('progress-wrap');
  if (p > 0) wrap.classList.add('show'); else wrap.classList.remove('show');
  document.getElementById('progress-fill').style.width = p + '%';
  document.getElementById('progress-step').textContent = label || '';
}
function startAdventure() {
  showScreen('screen-crossword');
  setProgress(25, 'Aufgabe 1 von 3 – Die Prüfung des Druiden');
  initCrossword();
}
function gotoAufgabe2() {
  showScreen('screen-caesar');
  setProgress(50, 'Aufgabe 2 von 3 – Der Geheimcode');
  initCaesar();
}
function gotoAufgabe3() {
  showScreen('screen-labyrinth');
  setProgress(75, 'Aufgabe 3 von 3 – Das Datenlager');
  setTimeout(initLabyrinth, 400);
}
function gotoGutschein() {
  labRunning = false;
  if (labRAF) cancelAnimationFrame(labRAF);
  showScreen('screen-gutschein');
  setProgress(100, '🏆 Geschafft – der goldene RAM!');
  initGutschein();
}

// ══════════════════════════════════════════════════════════════
//  CROSSWORD
// ══════════════════════════════════════════════════════════════
const CW_WORDS = [
  { answer:'BAMBERG',  clue:'Das unbeugsame fränkische Städtchen' },
  { answer:'RIVELLA',  clue:'Jensix\' Zaubertrank – gezähmt durch Milchsäure, sprudelnd aus der Schweiz' },
  { answer:'GOOGLUS',  clue:'Der allwissende Hyperscalier – er kennt jede Antwort, nur nicht, wann genug genug ist' },
  { answer:'RICKIX',   clue:'Jensix\' kleiner, schwarzer Begleiter' },
  { answer:'FOHLEN',   clue:'Die Strasse, auf der Jensix wohnt, ist nach ihnen benannt – aber geritten wird hier nicht' },
  { answer:'FLOETE',   clue:'Troubadix wird grün vor Neid, wenn er Ilkara auf diesem Instrument spielen hört' },
  { answer:'LUZERN',   clue:'Von hier kommt der geheimnisvolle Helfer, der Jensix dieses Abenteuer geschickt hat' },
  { answer:'BLITZ',    clue:'Zuckt an manchen heissen Sommerabenden über den Himmel und hält Maxestix tagsüber auf Trab.' },
  { answer:'MAUS',     clue:'Ist kein Tier und isst kein Käse – und trotzdem unverzichtbar auf Jensix\' Schreibtisch' },
  { answer:'DDR',      clue:'Nein, nicht die Abkürzung aus dem Geschichtsunterricht – sondern das, was Jensix\' RAM noch schneller macht' },
  { answer:'RAM',      clue:'Die Hyperscalier haben ihn alle – Jensix noch keinen' },
];

function buildGrid(words) {
  const cells = {};
  const placed = [];
  const get = (r,c) => cells[r+','+c] || null;
  const set = (r,c,v) => cells[r+','+c] = v;

  function canPlace(answer, r0, c0, dir) {
    const dr = dir==='down'?1:0, dc = dir==='across'?1:0;
    if (get(r0-dr, c0-dc)) return -1;
    if (get(r0+answer.length*dr, c0+answer.length*dc)) return -1;
    let hits = placed.length===0 ? 1 : 0;
    for (let i=0; i<answer.length; i++) {
      const r=r0+i*dr, c=c0+i*dc, ch=answer[i];
      const ex = get(r,c);
      if (ex) {
        if (ex.letter!==ch || ex.dir===dir) return -1;
        hits++;
      } else {
        if (dir==='across') {
          const a=get(r-1,c), b=get(r+1,c);
          if ((a&&a.dir==='across')||(b&&b.dir==='across')) return -1;
        } else {
          const a=get(r,c-1), b=get(r,c+1);
          if ((a&&a.dir==='down')||(b&&b.dir==='down')) return -1;
        }
      }
    }
    return placed.length===0 ? 1 : hits;
  }

  function placeWord(wordObj, r0, c0, dir) {
    const {answer} = wordObj;
    const dr=dir==='down'?1:0, dc=dir==='across'?1:0;
    const idx = placed.length;
    for (let i=0; i<answer.length; i++) {
      const r=r0+i*dr, c=c0+i*dc;
      if (!get(r,c)) set(r,c,{letter:answer[i], dir, wordIdx:idx});
    }
    placed.push({...wordObj, r0, c0, dir, clueNum:0});
  }

  const sorted = [...words].sort((a,b)=>b.answer.length-a.answer.length);
  placeWord(sorted[0], 0, 0, 'across');
  const queue = sorted.slice(1);
  for (let pass=0; pass<5 && queue.length; pass++) {
    const unplaced = [];
    for (const word of queue) {
      let best=-1, bestPos=null;
      for (const p of placed) {
        const odir = p.dir==='across'?'down':'across';
        const pdr=p.dir==='down'?1:0, pdc=p.dir==='across'?1:0;
        const ndr=odir==='down'?1:0, ndc=odir==='across'?1:0;
        for (let pi=0; pi<p.answer.length; pi++) {
          const pR=p.r0+pi*pdr, pC=p.c0+pi*pdc;
          for (let ai=0; ai<word.answer.length; ai++) {
            if (word.answer[ai]!==p.answer[pi]) continue;
            const r0=pR-ai*ndr, c0=pC-ai*ndc;
            const score=canPlace(word.answer,r0,c0,odir);
            if (score>best) { best=score; bestPos={r0,c0,dir:odir}; }
          }
        }
      }
      if (bestPos && best>0) placeWord(word, bestPos.r0, bestPos.c0, bestPos.dir);
      else unplaced.push(word);
    }
    queue.length=0; queue.push(...unplaced);
  }

  let minR=Infinity, minC=Infinity;
  for (const k of Object.keys(cells)) {
    const [r,c]=k.split(',').map(Number);
    minR=Math.min(minR,r); minC=Math.min(minC,c);
  }
  if (minR!==0||minC!==0) {
    const entries=Object.entries(cells);
    for (const k of Object.keys(cells)) delete cells[k];
    for (const [k,v] of entries) {
      const [r,c]=k.split(',').map(Number);
      cells[(r-minR)+','+(c-minC)]=v;
    }
    for (const p of placed) { p.r0-=minR; p.c0-=minC; }
  }

  let maxR=0, maxC=0;
  for (const k of Object.keys(cells)) {
    const [r,c]=k.split(',').map(Number);
    maxR=Math.max(maxR,r); maxC=Math.max(maxC,c);
  }
  return {cells, placed, rows:maxR+1, cols:maxC+1};
}

let CW=null, cwUser={}, cwSel=null, cwReady=false;

// ── HINT BUTTON ───────────────────────────────────────────────
let hintCount = 0;
let hintLockedUntil = 0;
let hintCountdownInterval = null;

function giveHint() {
  const now = Date.now();
  // Check if lock has expired → reset
  if (hintCount >= 3 && now >= hintLockedUntil) {
    hintCount = 0;
    clearInterval(hintCountdownInterval);
    hintCountdownInterval = null;
  }
  // Still locked?
  if (hintCount >= 3 && now < hintLockedUntil) return;
  if (!CW) return;

  // Find all cells that are incorrect or empty
  const candidates = [];
  for (let r = 0; r < CW.rows; r++) {
    for (let c = 0; c < CW.cols; c++) {
      const data = CW.cells[r+','+c];
      if (!data) continue;
      if ((cwUser[r+','+c]||'') !== data.letter) {
        candidates.push({r, c, letter: data.letter});
      }
    }
  }
  if (candidates.length === 0) return;

  // Pick a random candidate and reveal it
  const pick = candidates[Math.floor(Math.random() * candidates.length)];
  cwUser[pick.r+','+pick.c] = pick.letter;
  updateLetter(pick.r, pick.c);
  // Mark cell as correct
  const cell = document.querySelector(`.cw-cell[data-r="${pick.r}"][data-c="${pick.c}"]`);
  if (cell) cell.classList.add('correct');

  hintCount++;
  updateHintButton();

  if (hintCount >= 3) {
    hintLockedUntil = Date.now() + 5 * 60 * 1000;
    startHintCountdown();
  }
}

function updateHintButton() {
  const btn = document.getElementById('hint-btn');
  if (!btn) return;
  if (hintCount >= 3 && Date.now() < hintLockedUntil) {
    btn.disabled = true;
  } else {
    btn.disabled = false;
    const remaining = 3 - Math.min(hintCount, 3);
    btn.textContent = `💡 Hinweis (${remaining} verbleibend)`;
  }
}

function startHintCountdown() {
  clearInterval(hintCountdownInterval);
  hintCountdownInterval = setInterval(() => {
    const remaining = hintLockedUntil - Date.now();
    if (remaining <= 0) {
      clearInterval(hintCountdownInterval);
      hintCountdownInterval = null;
      hintCount = 0;
      updateHintButton();
      return;
    }
    const min = Math.floor(remaining / 60000);
    const sec = Math.floor((remaining % 60000) / 1000);
    const btn = document.getElementById('hint-btn');
    if (btn) btn.textContent = `💡 Gesperrt – noch ${min}:${String(sec).padStart(2,'0')}`;
  }, 1000);
}

function initCrossword() {
  if (cwReady) return;
  cwReady=true;
  CW=buildGrid(CW_WORDS);
  numberCells();
  renderGrid();
  renderClues();
  document.addEventListener('keydown', handleCwKey);
  document.getElementById('cw-input').addEventListener('input', handleCwInput);
}

function numberCells() {
  let n=1;
  for (let r=0; r<CW.rows; r++) {
    for (let c=0; c<CW.cols; c++) {
      const cell=CW.cells[r+','+c];
      if (!cell) continue;
      const sa=CW.placed.find(p=>p.dir==='across'&&p.r0===r&&p.c0===c);
      const sd=CW.placed.find(p=>p.dir==='down'&&p.r0===r&&p.c0===c);
      if (sa||sd) {
        cell.num=n;
        if (sa) sa.clueNum=n;
        if (sd) sd.clueNum=n;
        n++;
      }
    }
  }
}

function renderGrid() {
  const grid=document.getElementById('cwGrid');
  grid.innerHTML='';
  grid.style.gridTemplateColumns=`repeat(${CW.cols},38px)`;
  grid.style.gridTemplateRows=`repeat(${CW.rows},38px)`;
  for (let r=0; r<CW.rows; r++) {
    for (let c=0; c<CW.cols; c++) {
      const cell=document.createElement('div');
      const data=CW.cells[r+','+c];
      cell.className='cw-cell'+(data?'':' black');
      cell.dataset.r=r; cell.dataset.c=c;
      if (data) {
        if (data.num) {
          const num=document.createElement('div');
          num.className='cw-num'; num.textContent=data.num;
          cell.appendChild(num);
        }
        const ltr=document.createElement('div');
        ltr.className='cw-letter'; ltr.id='L'+r+'_'+c;
        cell.appendChild(ltr);
        cell.addEventListener('click',()=>selectCell(r,c));
      }
      grid.appendChild(cell);
    }
  }
}

function renderClues() {
  const across=CW.placed.filter(p=>p.dir==='across').sort((a,b)=>a.clueNum-b.clueNum);
  const down  =CW.placed.filter(p=>p.dir==='down')  .sort((a,b)=>a.clueNum-b.clueNum);
  let html='<div class="cw-clues-section"><h3>Waagerecht</h3>';
  for (const w of across)
    html+=`<div class="cw-clue" id="cl-a-${w.clueNum}" onclick="jumpTo('across',${w.clueNum})">
      <span class="cw-clue-num">${w.clueNum}.</span><span>${w.clue}</span></div>`;
  html+='</div><div class="cw-clues-section"><h3>Senkrecht</h3>';
  for (const w of down)
    html+=`<div class="cw-clue" id="cl-d-${w.clueNum}" onclick="jumpTo('down',${w.clueNum})">
      <span class="cw-clue-num">${w.clueNum}.</span><span>${w.clue}</span></div>`;
  html+='</div>';
  document.getElementById('cwClues').innerHTML=html;
}

function cellInWord(p,r,c) {
  const dr=p.dir==='down'?1:0, dc=p.dir==='across'?1:0;
  for(let i=0;i<p.answer.length;i++){
    if(p.r0+i*dr===r && p.c0+i*dc===c) return true;
  }
  return false;
}

function findWordsAt(r,c) {
  return CW.placed.filter(p=>cellInWord(p,r,c));
}

function selectCell(r,c) {
  const data=CW.cells[r+','+c];
  if (!data) return;
  const words=findWordsAt(r,c);
  if (!words.length) return;
  let dir;
  if (cwSel && cwSel.r===r && cwSel.c===c && words.length>1) {
    dir = cwSel.dir==='across' ? 'down' : 'across';
  } else if (cwSel) {
    dir = words.find(w=>w.dir===cwSel.dir) ? cwSel.dir : words[0].dir;
  } else {
    dir = words[0].dir;
  }
  const word = words.find(w=>w.dir===dir) || words[0];
  cwSel = {r, c, dir:word.dir, word};
  highlightSelection();
  document.getElementById('cw-input').focus();
}

function highlightSelection() {
  document.querySelectorAll('.cw-cell').forEach(el=>{
    el.classList.remove('sel-cell','sel-word');
  });
  document.querySelectorAll('.cw-clue').forEach(el=>el.classList.remove('active'));
  if (!cwSel) return;
  const w=cwSel.word;
  const dr=w.dir==='down'?1:0, dc=w.dir==='across'?1:0;
  for(let i=0;i<w.answer.length;i++){
    const r=w.r0+i*dr, c=w.c0+i*dc;
    const el=document.querySelector(`.cw-cell[data-r="${r}"][data-c="${c}"]`);
    if (el) el.classList.add('sel-word');
  }
  const sel=document.querySelector(`.cw-cell[data-r="${cwSel.r}"][data-c="${cwSel.c}"]`);
  if (sel) sel.classList.add('sel-cell');
  const cluePref = w.dir==='across'?'cl-a-':'cl-d-';
  const clue = document.getElementById(cluePref+w.clueNum);
  if (clue) clue.classList.add('active');
}

function jumpTo(dir,num) {
  const word=CW.placed.find(p=>p.dir===dir && p.clueNum===num);
  if (!word) return;
  cwSel={r:word.r0, c:word.c0, dir, word};
  highlightSelection();
  document.getElementById('cw-input').focus();
}

function moveSelection(dr,dc) {
  if (!cwSel) return;
  let r=cwSel.r+dr, c=cwSel.c+dc;
  while(r>=0 && r<CW.rows && c>=0 && c<CW.cols) {
    if (CW.cells[r+','+c]) {
      cwSel.r=r; cwSel.c=c;
      highlightSelection();
      return;
    }
    r+=dr; c+=dc;
  }
}

function advanceInWord() {
  if (!cwSel) return;
  const dr=cwSel.dir==='down'?1:0, dc=cwSel.dir==='across'?1:0;
  const nr=cwSel.r+dr, nc=cwSel.c+dc;
  if (CW.cells[nr+','+nc] && cellInWord(cwSel.word,nr,nc)) {
    cwSel.r=nr; cwSel.c=nc;
    highlightSelection();
  }
}
function retreatInWord() {
  if (!cwSel) return;
  const dr=cwSel.dir==='down'?1:0, dc=cwSel.dir==='across'?1:0;
  const nr=cwSel.r-dr, nc=cwSel.c-dc;
  if (CW.cells[nr+','+nc] && cellInWord(cwSel.word,nr,nc)) {
    cwSel.r=nr; cwSel.c=nc;
    highlightSelection();
  }
}

function handleCwKey(e) {
  if (!document.getElementById('screen-crossword').classList.contains('active')) return;
  if (!cwSel) return;
  if (e.key==='ArrowUp')    { e.preventDefault(); moveSelection(-1,0); }
  if (e.key==='ArrowDown')  { e.preventDefault(); moveSelection(1,0); }
  if (e.key==='ArrowLeft')  { e.preventDefault(); moveSelection(0,-1); }
  if (e.key==='ArrowRight') { e.preventDefault(); moveSelection(0,1); }
  if (e.key==='Backspace')  {
    e.preventDefault();
    const k=cwSel.r+','+cwSel.c;
    if (cwUser[k]) { cwUser[k]=''; updateLetter(cwSel.r,cwSel.c); }
    else retreatInWord();
  }
}

function handleCwInput(e) {
  const val=e.target.value.toUpperCase();
  e.target.value='';
  if (!cwSel || !val) return;
  const ch = val.replace(/[^A-ZÄÖÜ]/g,'').slice(0,1);
  if (!ch) return;
  cwUser[cwSel.r+','+cwSel.c]=ch;
  updateLetter(cwSel.r,cwSel.c);
  advanceInWord();
}

function updateLetter(r,c) {
  const el=document.getElementById('L'+r+'_'+c);
  if (el) el.textContent = cwUser[r+','+c]||'';
}

function clearCrossword() {
  cwUser={};
  document.querySelectorAll('.cw-letter').forEach(el=>el.textContent='');
  document.querySelectorAll('.cw-cell').forEach(el=>{
    el.classList.remove('correct','wrong');
  });
  document.getElementById('cwStatus').textContent='';
}

function checkCrossword() {
  let allRight=true, anyFilled=false;
  for (let r=0; r<CW.rows; r++) {
    for (let c=0; c<CW.cols; c++) {
      const data=CW.cells[r+','+c];
      if (!data) continue;
      const cell=document.querySelector(`.cw-cell[data-r="${r}"][data-c="${c}"]`);
      const u=cwUser[r+','+c]||'';
      if (u) anyFilled=true;
      cell.classList.remove('correct','wrong');
      if (u===data.letter) cell.classList.add('correct');
      else { cell.classList.add('wrong'); allRight=false; }
    }
  }
  const status=document.getElementById('cwStatus');
  if (allRight && anyFilled) {
    status.textContent='Alle Wörter richtig!';
    status.style.color='var(--green)';
    document.getElementById('cwSuccess').classList.add('show');
    document.getElementById('cwSuccess').scrollIntoView({behavior:'smooth',block:'nearest'});
  } else {
    status.textContent='Noch nicht alles richtig – die roten Felder stimmen nicht.';
    status.style.color='var(--red)';
    document.getElementById('rickixBubble').classList.add('show');
  }
}

// ══════════════════════════════════════════════════════════════
//  CAESAR
//  Formel: (Rätsel1 × Rätsel2) + Rätsel3 = (1 × 5) + 2 = 7
// ══════════════════════════════════════════════════════════════
const CAESAR_SHIFT = 7;
const CAESAR_PLAIN = 'DER GOLDENE RAM LIEGT IM TRESOR DES GALLISCHEN DATENLAGERS HINTER DEM DRITTEN WACHSTEIN';
const RIDDLE1_ANSWER = 1;   // BAMBERG→BAMTAL: A doppelt → 1
const RIDDLE2_ANSWER = 5;   // Samsungus (Südkorea) Mittag → 5 Uhr Bamberg
const RIDDLE3_ANSWER = 2;   // Alphabetisch: Hynixius, Micronikus, Samsungus → Pos. 2

let caesarReady=false;
let riddle1Solved=false, riddle2Solved=false, riddle3Solved=false;
let riddle1Attempts=0, riddle2Attempts=0, riddle3Attempts=0;
let caesarAttempts=0;
let num1Found=null, num2Found=null, num3Found=null;

function initCaesar() {
  if (caesarReady) return;
  caesarReady=true;
  document.getElementById('encryptedText').textContent =
    caesarEncrypt(CAESAR_PLAIN, CAESAR_SHIFT);
}
function caesarEncrypt(text, shift) {
  return text.split('').map(ch=>{
    if (ch>='A' && ch<='Z')
      return String.fromCharCode(((ch.charCodeAt(0)-65+shift)%26)+65);
    return ch;
  }).join('');
}
function caesarDecrypt(text, shift) { return caesarEncrypt(text, 26-(shift%26)); }

function checkRiddle1() {
  const val=parseInt(document.getElementById('riddle1-input').value);
  const status=document.getElementById('riddle1-status');
  if (val===RIDDLE1_ANSWER) {
    status.textContent='✓ Richtig!';
    status.style.color='var(--green)';
    document.getElementById('riddle1-box').classList.add('solved');
    document.getElementById('riddle1-input').disabled=true;
    riddle1Solved=true; num1Found=val;
    updateFoundNumbers();
    setTimeout(()=>{
      document.getElementById('riddle2-box').style.display='block';
      document.getElementById('riddle2-box').scrollIntoView({behavior:'smooth',block:'nearest'});
    }, 500);
  } else {
    riddle1Attempts++;
    status.textContent='✗ Nicht ganz – überlege nochmal.';
    status.style.color='var(--red)';
    if (riddle1Attempts >= 2) {
      document.getElementById('ilkara-hint-1').style.display='block';
    }
  }
}

function checkRiddle2() {
  const val=parseInt(document.getElementById('riddle2-input').value);
  const status=document.getElementById('riddle2-status');
  if (val===RIDDLE2_ANSWER) {
    status.textContent='✓ Richtig!';
    status.style.color='var(--green)';
    document.getElementById('riddle2-box').classList.add('solved');
    document.getElementById('riddle2-input').disabled=true;
    riddle2Solved=true; num2Found=val;
    updateFoundNumbers();
    setTimeout(()=>{
      document.getElementById('riddle3-box').style.display='block';
      document.getElementById('riddle3-box').scrollIntoView({behavior:'smooth',block:'nearest'});
    }, 500);
  } else {
    riddle2Attempts++;
    status.textContent='✗ Nicht ganz – überlege nochmal.';
    status.style.color='var(--red)';
    if (riddle2Attempts >= 2) {
      document.getElementById('ilkara-hint-2').style.display='block';
    }
  }
}

function checkRiddle3() {
  const val=parseInt(document.getElementById('riddle3-input').value);
  const status=document.getElementById('riddle3-status');
  if (val===RIDDLE3_ANSWER) {
    status.textContent='✓ Richtig!';
    status.style.color='var(--green)';
    document.getElementById('riddle3-box').classList.add('solved');
    document.getElementById('riddle3-input').disabled=true;
    riddle3Solved=true; num3Found=val;
    updateFoundNumbers();
    setTimeout(showSlider, 600);
  } else {
    riddle3Attempts++;
    status.textContent='✗ Nicht ganz – überlege nochmal.';
    status.style.color='var(--red)';
    if (riddle3Attempts >= 2) {
      document.getElementById('ilkara-hint-3').style.display='block';
    }
  }
}

function updateFoundNumbers() {
  // Formel-Box bleibt ausgeblendet
  if (num1Found!==null) document.getElementById('found-num1').textContent=num1Found;
  if (num2Found!==null) document.getElementById('found-num2').textContent=num2Found;
  if (num3Found!==null) {
    document.getElementById('found-num3').textContent=num3Found;
    const result = (num1Found * num2Found) + num3Found;
    document.getElementById('found-result').textContent=result;
  }
}

function showSlider() {
  document.getElementById('phase-slider').style.display='block';
  document.getElementById('caesarSlider').value=13;
  document.getElementById('caesarValue').textContent=13;
  document.getElementById('caesar-result').style.display='none';
  document.getElementById('phase-slider').scrollIntoView({behavior:'smooth',block:'start'});
}
function onSliderChange() {
  const shift=parseInt(document.getElementById('caesarSlider').value);
  document.getElementById('caesarValue').textContent=shift;
  document.getElementById('caesar-result').style.display='none';
  document.getElementById('caesar-wrong-status').style.display='none';
  document.getElementById('caesar-success').style.display='none';
}
function tryCaesar() {
  const shift=parseInt(document.getElementById('caesarSlider').value);
  const decrypted=caesarDecrypt(document.getElementById('encryptedText').textContent, shift);
  const resultBox=document.getElementById('caesar-result');
  const statusEl=document.getElementById('caesar-wrong-status');
  resultBox.style.display='block';
  document.getElementById('decryptedText').textContent=decrypted;
  if (shift===CAESAR_SHIFT) {
    statusEl.style.display='none';
    document.getElementById('rickixCaesar').style.display='none';
    document.getElementById('caesar-success').style.display='block';
    document.getElementById('caesar-success').scrollIntoView({behavior:'smooth',block:'nearest'});
  } else {
    caesarAttempts++;
    statusEl.style.display='block';
    statusEl.textContent='Das ergibt noch keinen Sinn. Versuch '+caesarAttempts+' – probiere eine andere Zahl.';
    if (caesarAttempts>=2) {
      document.getElementById('ilkara-hint').style.display='block';
      document.getElementById('ilkara-hint').scrollIntoView({behavior:'smooth',block:'nearest'});
    }
  }
}

// ══════════════════════════════════════════════════════════════
//  LABYRINTH
// ══════════════════════════════════════════════════════════════
const LAB_MAP = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,2,0,1,0,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,0],
  [0,1,0,1,0,1,0,1,0,1,0,1,0,0,0,0,0,0,0,0,0,1,0,1,0,0,0,1,0],
  [0,1,0,1,1,1,0,1,1,1,0,1,1,1,0,1,0,1,1,1,1,1,0,1,0,1,1,1,0],
  [0,1,0,1,0,0,0,0,0,0,0,0,0,1,0,1,0,1,0,0,0,0,0,1,0,0,0,1,0],
  [0,1,0,1,1,1,1,1,0,1,1,1,0,1,0,1,1,1,0,1,0,1,1,1,1,1,0,1,0],
  [0,1,0,0,0,0,0,1,0,1,0,0,0,1,0,1,0,0,0,1,0,1,0,0,0,1,0,1,0],
  [0,1,0,1,1,1,0,1,0,1,0,1,1,1,0,1,0,1,1,1,1,1,1,1,0,1,0,1,0],
  [0,1,0,1,0,1,0,1,0,1,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,1,0],
  [0,1,0,1,0,1,1,1,1,1,0,1,0,1,1,1,0,1,1,1,1,1,0,1,1,1,0,1,0],
  [0,1,0,1,0,0,0,0,0,0,0,1,0,1,0,0,0,1,0,0,0,1,0,1,0,0,0,1,0],
  [0,1,0,1,0,1,1,1,1,1,1,1,0,1,1,1,0,1,1,1,0,1,1,1,0,1,1,1,0],
  [0,1,0,1,0,1,0,0,0,0,0,0,0,0,0,1,0,1,0,1,0,0,0,0,0,1,0,0,0],
  [0,1,0,1,0,1,1,1,1,1,0,1,1,1,1,1,0,1,0,1,1,1,1,1,0,1,1,1,0],
  [0,1,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0],
  [0,1,1,1,1,1,0,1,1,1,0,1,0,1,1,1,1,1,1,1,1,1,0,1,0,1,0,1,0],
  [0,0,0,0,0,1,0,1,0,0,0,1,0,0,0,0,0,1,0,0,0,1,0,1,0,1,0,1,0],
  [0,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,0,1,1,3,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];
const POTION_POS = {row:7, col:9};
const GUARD_DEFS = [
  { path:[{r:17,c:3},{r:17,c:4},{r:17,c:5},{r:17,c:6},{r:17,c:7}], speed:3.5 },
  { path:[{r:1,c:9},{r:1,c:10},{r:1,c:11},{r:1,c:12},{r:1,c:13},{r:1,c:14},{r:1,c:15},{r:1,c:16},{r:1,c:17},{r:1,c:18}], speed:2.8 },
  { path:[{r:4,c:15},{r:5,c:15},{r:6,c:15},{r:7,c:15}], speed:3.0 },
  { path:[{r:17,c:9},{r:17,c:10},{r:17,c:11},{r:17,c:12},{r:17,c:13},{r:17,c:14},{r:17,c:15},{r:17,c:16},{r:17,c:17}], speed:3.0 },
  { path:[{r:9,c:17},{r:10,c:17},{r:11,c:17},{r:12,c:17},{r:13,c:17}], speed:5.0 },
  { path:[{r:5,c:21},{r:5,c:22},{r:5,c:23},{r:4,c:23},{r:3,c:23},{r:2,c:23},{r:1,c:23}], speed:4.5 },
  { path:[{r:17,c:26},{r:17,c:27},{r:16,c:27},{r:15,c:27},{r:14,c:27},{r:13,c:27}], speed:6.0 },
];
const CELL=30, COLS=LAB_MAP[0].length, ROWS=LAB_MAP.length;
let labCanvas, labCtx;
let player, guards, potionActive, potionOnMap, potionTimer;
let labRunning=false, lastTime=0, labRAF=null, keys={};
let goalReached=false, moveTimer=0, labInited=false;
let walkPhase=0;

function initLabyrinth() {
  if (labInited) { resetLabyrinth(); return; }
  labInited=true;
  labCanvas=document.getElementById('labCanvas');
  labCanvas.width=COLS*CELL;
  labCanvas.height=ROWS*CELL;
  labCtx=labCanvas.getContext('2d');
  LAB_MAP[POTION_POS.row][POTION_POS.col]=4;
  window.addEventListener('keydown', e=>{
    keys[e.key]=true;
    if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault();
  });
  window.addEventListener('keyup', e=>{ keys[e.key]=false; });
  resetLabyrinth();
}
function resetLabyrinth() {
  player={row:1, col:1};
  guards=GUARD_DEFS.map(g=>({path:g.path, speed:g.speed, idx:0, dir:1, progress:0, row:g.path[0].r, col:g.path[0].c}));
  potionActive=false; potionOnMap=true; potionTimer=0;
  goalReached=false; moveTimer=0;
  LAB_MAP[POTION_POS.row][POTION_POS.col]=4;
  document.getElementById('lab-success').style.display='none';
  document.getElementById('lab-status').textContent='Viel Erfolg, Jensix!';
  document.getElementById('lab-potion-timer').style.display='none';
  if (!labRunning) { labRunning=true; lastTime=performance.now(); labRAF=requestAnimationFrame(labLoop); }
}
function labLoop(ts) {
  if (!labRunning) return;
  const dt=Math.min((ts-lastTime)/1000, 0.1);
  lastTime=ts;
  walkPhase+=dt*8;
  if (!goalReached) { updatePlayer(dt); updateGuards(dt); checkCollisions(); }
  drawLab();
  labRAF=requestAnimationFrame(labLoop);
}
function updatePlayer(dt) {
  const speed=0.12;
  moveTimer-=dt;
  if (moveTimer>0) return;
  let dr=0, dc=0;
  if      (keys['ArrowUp']   ||keys['w']||keys['W']) dr=-1;
  else if (keys['ArrowDown'] ||keys['s']||keys['S']) dr= 1;
  else if (keys['ArrowLeft'] ||keys['a']||keys['A']) dc=-1;
  else if (keys['ArrowRight']||keys['d']||keys['D']) dc= 1;
  else return;
  const nr=player.row+dr, nc=player.col+dc;
  if (nr>=0&&nr<ROWS&&nc>=0&&nc<COLS&&LAB_MAP[nr][nc]!==0) {
    player.row=nr; player.col=nc; moveTimer=speed;
    if (LAB_MAP[nr][nc]===4) {
      LAB_MAP[nr][nc]=1; potionOnMap=false;
      potionActive=true; potionTimer=20;
      document.getElementById('lab-potion-timer').style.display='inline';
    }
    if (LAB_MAP[nr][nc]===3) onGoalReached();
  }
}
function updateGuards(dt) {
  if (potionActive) {
    potionTimer-=dt;
    document.getElementById('lab-timer-val').textContent=Math.max(0,Math.ceil(potionTimer));
    if (potionTimer<=0) { potionActive=false; document.getElementById('lab-potion-timer').style.display='none'; }
  }
  for (const g of guards) {
    const guardSpeed=potionActive ? g.speed*0.5 : g.speed;
    g.progress+=guardSpeed*dt;
    while (g.progress>=1) {
      g.progress-=1;
      g.idx+=g.dir;
      if (g.idx>=g.path.length-1) g.dir=-1;
      if (g.idx<=0) g.dir=1;
    }
    const cur=g.path[g.idx], nxt=g.path[g.idx+g.dir]||cur;
    g.row=cur.r+(nxt.r-cur.r)*g.progress;
    g.col=cur.c+(nxt.c-cur.c)*g.progress;
  }
}
function checkCollisions() {
  for (const g of guards) {
    if (Math.abs(g.row-player.row)<0.75 && Math.abs(g.col-player.col)<0.75) {
      player.row=1; player.col=1;
      potionActive=false; potionOnMap=true; potionTimer=0;
      LAB_MAP[POTION_POS.row][POTION_POS.col]=4;
      document.getElementById('lab-potion-timer').style.display='none';
      document.getElementById('lab-status').textContent='Erwischt! Zurück zum Start...';
      setTimeout(()=>{
        if(!goalReached) document.getElementById('lab-status').textContent='Viel Erfolg, Jensix!';
      },1200);
    }
  }
}
function onGoalReached() {
  goalReached=true; labRunning=false;
  document.getElementById('lab-status').textContent='⭐ Ziel erreicht!';
  setTimeout(()=>{
    document.getElementById('lab-success').style.display='block';
  }, 800);
}

function drawHero(ctx, x, y, size, walkPhase) {
  const bob = Math.sin(walkPhase)*1.5;
  ctx.save();
  ctx.translate(x, y+bob);
  ctx.fillStyle='rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.ellipse(0, size*0.45, size*0.3, size*0.08, 0, 0, Math.PI*2); ctx.fill();
  const legSwing = Math.sin(walkPhase)*2;
  ctx.fillStyle='#1f4a73'; ctx.strokeStyle='#1d1208'; ctx.lineWidth=1.2;
  ctx.fillRect(-4, size*0.15+legSwing, 3, size*0.25);
  ctx.strokeRect(-4, size*0.15+legSwing, 3, size*0.25);
  ctx.fillRect(1, size*0.15-legSwing, 3, size*0.25);
  ctx.strokeRect(1, size*0.15-legSwing, 3, size*0.25);
  ctx.fillStyle='#b8332a';
  ctx.beginPath();
  ctx.moveTo(-size*0.25, -size*0.05);
  ctx.lineTo(-size*0.28, size*0.2);
  ctx.lineTo(size*0.28, size*0.2);
  ctx.lineTo(size*0.25, -size*0.05);
  ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.fillStyle='#3a2818';
  ctx.fillRect(-size*0.28, size*0.12, size*0.56, 3);
  ctx.fillStyle='#f4d4a8';
  ctx.beginPath(); ctx.ellipse(0, -size*0.18, size*0.18, size*0.2, 0, 0, Math.PI*2); ctx.fill(); ctx.stroke();
  ctx.fillStyle=potionActive?'#f0cf5c':'#d4a82b';
  ctx.beginPath();
  ctx.moveTo(-size*0.18, -size*0.22);
  ctx.quadraticCurveTo(-size*0.2, -size*0.4, 0, -size*0.4);
  ctx.quadraticCurveTo(size*0.2, -size*0.4, size*0.18, -size*0.22);
  ctx.quadraticCurveTo(size*0.1, -size*0.28, 0, -size*0.25);
  ctx.quadraticCurveTo(-size*0.1, -size*0.28, -size*0.18, -size*0.22);
  ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.fillStyle='#1d1208';
  ctx.beginPath(); ctx.arc(-size*0.06, -size*0.18, 1, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(size*0.06, -size*0.18, 1, 0, Math.PI*2); ctx.fill();
  if (potionActive) {
    ctx.strokeStyle='rgba(240,207,92,0.7)'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.arc(0, 0, size*0.35, 0, Math.PI*2); ctx.stroke();
  }
  ctx.restore();
}

function drawGuard(ctx, x, y, size, phase) {
  const bob = Math.sin(phase*1.5)*1;
  ctx.save();
  ctx.translate(x, y+bob);
  ctx.fillStyle='rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.ellipse(0, size*0.45, size*0.3, size*0.08, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle='#3a2818'; ctx.strokeStyle='#1d1208'; ctx.lineWidth=1.2;
  ctx.fillRect(-4, size*0.15, 3, size*0.25);
  ctx.strokeRect(-4, size*0.15, 3, size*0.25);
  ctx.fillRect(1, size*0.15, 3, size*0.25);
  ctx.strokeRect(1, size*0.15, 3, size*0.25);
  ctx.fillStyle='#6b513b';
  ctx.fillRect(-size*0.28, -size*0.05, size*0.56, size*0.25);
  ctx.strokeRect(-size*0.28, -size*0.05, size*0.56, size*0.25);
  ctx.fillStyle='#9b8b6b';
  ctx.fillRect(-size*0.2, 0, size*0.4, size*0.15);
  ctx.strokeRect(-size*0.2, 0, size*0.4, size*0.15);
  ctx.fillStyle='#3a2818';
  ctx.beginPath(); ctx.ellipse(0, -size*0.2, size*0.22, size*0.2, 0, 0, Math.PI*2); ctx.fill(); ctx.stroke();
  ctx.fillStyle='#b8332a';
  ctx.fillRect(-size*0.22, -size*0.32, size*0.44, size*0.05);
  ctx.strokeRect(-size*0.22, -size*0.32, size*0.44, size*0.05);
  ctx.fillStyle='#b8332a';
  ctx.fillRect(-size*0.18, -size*0.18, size*0.36, size*0.05);
  ctx.strokeRect(-size*0.18, -size*0.18, size*0.36, size*0.05);
  ctx.fillStyle='#fff';
  ctx.beginPath(); ctx.arc(-size*0.08, -size*0.155, 1, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(size*0.08, -size*0.155, 1, 0, Math.PI*2); ctx.fill();
  ctx.restore();
}

function drawLab() {
  const ctx=labCtx;
  const g=ctx.createLinearGradient(0,0,0,labCanvas.height);
  g.addColorStop(0,'#2a2a3e'); g.addColorStop(1,'#15152a');
  ctx.fillStyle=g; ctx.fillRect(0,0,labCanvas.width,labCanvas.height);

  for (let r=0; r<ROWS; r++) for (let c=0; c<COLS; c++) {
    const t=LAB_MAP[r][c];
    const x=c*CELL, y=r*CELL;
    if (t===0) {
      ctx.fillStyle='#3a3850';
      ctx.fillRect(x, y, CELL, CELL);
      ctx.strokeStyle='#1a1a2a'; ctx.lineWidth=1;
      ctx.strokeRect(x+0.5, y+0.5, CELL-1, CELL-1);
      ctx.fillStyle='rgba(255,255,255,0.04)';
      ctx.fillRect(x, y, CELL, 2);
      ctx.fillRect(x, y, 2, CELL);
    } else if (t===2) {
      ctx.fillStyle='#4a7a3a';
      ctx.fillRect(x, y, CELL, CELL);
      ctx.fillStyle='#8ab074';
      ctx.fillRect(x+2, y+2, CELL-4, CELL-4);
      ctx.fillStyle='#1d1208';
      ctx.font='bold 10px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('START', x+CELL/2, y+CELL/2);
    } else if (t===3) {
      ctx.fillStyle='#d4a82b';
      ctx.fillRect(x, y, CELL, CELL);
      ctx.fillStyle='#f0cf5c';
      ctx.fillRect(x+2, y+2, CELL-4, CELL-4);
    } else {
      ctx.fillStyle='#c9b582';
      ctx.fillRect(x, y, CELL, CELL);
      ctx.fillStyle='#b39962';
      const seed=(r*31+c*17)%4;
      for (let i=0; i<2; i++) {
        const dx=((seed*7+i*11)%(CELL-6))+3;
        const dy=((seed*5+i*13)%(CELL-6))+3;
        ctx.fillRect(x+dx, y+dy, 2, 2);
      }
    }
  }

  ctx.textAlign='center'; ctx.textBaseline='middle';

  const gx=27*CELL+CELL/2, gy=17*CELL+CELL/2;
  ctx.save();
  ctx.translate(gx, gy);
  ctx.rotate(Math.sin(walkPhase*0.3)*0.1);
  ctx.fillStyle='#f0cf5c'; ctx.strokeStyle='#1d1208'; ctx.lineWidth=1.5;
  ctx.beginPath();
  for (let i=0; i<10; i++) {
    const a=i*Math.PI/5 - Math.PI/2;
    const r=(i%2===0) ? CELL*0.35 : CELL*0.16;
    const px=Math.cos(a)*r, py=Math.sin(a)*r;
    if (i===0) ctx.moveTo(px,py); else ctx.lineTo(px,py);
  }
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.shadowColor='#f0cf5c'; ctx.shadowBlur=15;
  ctx.fill();
  ctx.restore();

  if (potionOnMap) {
    const px=POTION_POS.col*CELL+CELL/2, py=POTION_POS.row*CELL+CELL/2;
    ctx.save();
    ctx.translate(px, py+Math.sin(walkPhase*0.5)*1.5);
    ctx.fillStyle='#6b513b'; ctx.strokeStyle='#1d1208'; ctx.lineWidth=1;
    ctx.fillRect(-3, -CELL*0.35, 6, 4);
    ctx.strokeRect(-3, -CELL*0.35, 6, 4);
    ctx.fillStyle='#a8d4e8';
    ctx.fillRect(-2, -CELL*0.3, 4, 5);
    ctx.strokeRect(-2, -CELL*0.3, 4, 5);
    ctx.fillStyle='#7ba8cf';
    ctx.beginPath();
    ctx.ellipse(0, 2, CELL*0.22, CELL*0.27, 0, 0, Math.PI*2);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle='rgba(255,255,255,0.5)';
    ctx.beginPath(); ctx.ellipse(-3, 0, 1.5, 4, 0, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  }

  for (const g of guards) {
    const x=g.col*CELL+CELL/2, y=g.row*CELL+CELL/2;
    drawGuard(ctx, x, y, CELL*1.2, walkPhase);
  }

  const px=player.col*CELL+CELL/2, py=player.row*CELL+CELL/2;
  drawHero(ctx, px, py, CELL*1.3, walkPhase);
}

// ══════════════════════════════════════════════════════════════
//  GUTSCHEIN
//  EmailJS-Konfiguration:
//  1. Konto erstellen auf https://www.emailjs.com/
//  2. E-Mail-Dienst und Vorlage anlegen
//  3. Die drei Konstanten unten ersetzen
// ══════════════════════════════════════════════════════════════
const EMAILJS_SERVICE_ID  = 'YOUR_SERVICE_ID';
const EMAILJS_TEMPLATE_ID = 'YOUR_TEMPLATE_ID';
const EMAILJS_PUBLIC_KEY  = 'YOUR_PUBLIC_KEY';

function initGutschein() {
  const eingeloest = localStorage.getItem('jensix-ram-eingeloest');
  if (eingeloest) {
    document.getElementById('gutschein-normal').style.display = 'none';
    document.getElementById('gutschein-eingeloest').style.display = 'block';
  }
}

function einloesenRam() {
  // E-Mail senden via EmailJS (nur wenn konfiguriert)
  if (typeof emailjs !== 'undefined' && EMAILJS_SERVICE_ID !== 'YOUR_SERVICE_ID') {
    emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
      to_email: 'birk@mail.ch',
      subject:  'Jensix hat den goldenen RAM eingelöst!',
      message:  'Jensix hat den goldenen RAM eingelöst. Bitte den Gutscheinbetrag von 100 Gold-Sesterzen via PayPal an Jensix weiterleiten.',
    }, EMAILJS_PUBLIC_KEY).catch(err => console.warn('EmailJS Fehler:', err));
  }

  // Status in localStorage speichern (geräte-persistent)
  localStorage.setItem('jensix-ram-eingeloest', 'true');

  // UI aktualisieren
  document.getElementById('gutschein-normal').style.display = 'none';
  document.getElementById('gutschein-eingeloest').style.display = 'block';
  document.getElementById('gutschein-eingeloest').scrollIntoView({behavior:'smooth', block:'start'});
}

// ══════════════════════════════════════════════════════════════
//  INTRO ANIMATION
// ══════════════════════════════════════════════════════════════
function runIntro() {
  ['ip1','ip2','ip3','ip4','ip5','hero-cards-title','hero-cards','intro-btn'].forEach((id,i) => {
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) el.classList.add('revealed');
    }, 400 + i * 700);
  });
}

window.addEventListener('load', ()=>{
  // Mobile-Warnung prüfen
  const isMobile = window.innerWidth < 900 ||
    /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  if (isMobile) {
    document.getElementById('mobile-warning').style.display = 'flex';
  }

  document.getElementById('screen-intro').classList.add('active','visible');
  runIntro();
});
