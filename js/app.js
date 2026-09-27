/* ── Navigasi ── */
const NAV_SCREENS = ['s-dash','s-tracker','s-breath','s-profile'];
function go(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  document.getElementById(id).scrollTop = 0;

  const nav = document.getElementById('nav');
  const showNav = id !== 's-welcome' && id !== 's-auth';
  nav.classList.toggle('on', showNav);
  nav.querySelectorAll('button').forEach(b=>b.classList.toggle('active', b.dataset.tab===id));

  if(id==='s-tracker') renderCharts();
}

/* ── Status severe toggle (demo) ── */
let severe = false;
function toggleSevere(){
  severe = !severe;
  const card = document.getElementById('statusCard');
  const label = document.getElementById('statusLabel');
  const note = document.getElementById('statusNote');
  const expert = document.getElementById('expertCard');

  if(severe){
    label.textContent = 'Berat';
    note.textContent = 'Kami sarankan bicara dengan ahli';
    card.style.background = 'linear-gradient(135deg,#C97A6D,#E2A89A)';
    card.style.boxShadow = '0 12px 30px rgba(201,122,109,.35)';
    expert.style.display = 'block';
  } else {
    label.textContent = 'Sedang';
    note.textContent = 'Energi turun 3 hari berturut-turut';
    card.style.background = 'linear-gradient(135deg,#5B8DB8,#8FB6D8)';
    card.style.boxShadow = '0 12px 30px rgba(91,141,184,.3)';
    expert.style.display = 'none';
  }
}

/* ── Check-in ── */
document.querySelectorAll('.emoji-row, .chips').forEach(group=>{
  group.querySelectorAll('.emoji,.chip').forEach(el=>{
    el.onclick = ()=>{
      group.querySelectorAll('.emoji,.chip').forEach(x=>x.classList.remove('sel'));
      el.classList.add('sel');
    };
  });
});

function saveCheckin(){
  const data = {};
  let ok = true;
  document.querySelectorAll('[data-field]').forEach(g=>{
    const sel = g.querySelector('.sel');
    if(!sel){ ok = false; return; }
    data[g.dataset.field] = +sel.dataset.v;
  });
  if(!ok){ alert('Isi semua dulu ya.'); return; }

  const all = JSON.parse(localStorage.getItem('bm') || '[]');
  all.push({ d: new Date().toISOString().slice(0,10), ...data });
  localStorage.setItem('bm', JSON.stringify(all));

  alert('Tersimpan. Terima kasih sudah jujur pada diri sendiri.');
  go('s-dash');
}

/* ── Charts ── */
function renderCharts(){
  const all = JSON.parse(localStorage.getItem('bm') || '[]');
  const days = ['Sen','Sel','Rab','Kam','Jum','Sab','Min'];
  const energy = [], stress = [];

  for(let i=6;i>=0;i--){
    const d = new Date(); d.setDate(d.getDate()-i);
    const key = d.toISOString().slice(0,10);
    const hit = all.find(x=>x.d===key);
    energy.push(hit ? hit.energy : 0);
    stress.push(hit ? hit.stress : 0);
  }

  const draw = (id, arr, color, hi)=>{
    const el = document.getElementById(id);
    el.innerHTML = '';
    const max = 4;
    arr.forEach((v,i)=>{
      const bar = document.createElement('div');
      bar.className = 'bar' + (v >= hi ? ' hi' : '');
      bar.style.height = (v/max*100 || 4) + '%';
      if(v >= hi) bar.style.background = color;
      const s = document.createElement('span');
      s.textContent = days[(new Date().getDay()-6+i+7)%7];
      bar.appendChild(s);
      el.appendChild(bar);
    });
  };

  draw('chartEnergy', energy, '#5B8DB8', 3);
  draw('chartStress', stress, '#C97A6D', 3);

  const filled = energy.filter(v=>v>0).length;
  const ins = document.getElementById('insight');
  if(filled < 3){
    ins.textContent = `Baru ${filled} hari data. Isi log harian beberapa hari lagi untuk insight.`;
  } else {
    const avgE = energy.filter(v=>v).reduce((a,b)=>a+b,0) / filled;
    ins.textContent = avgE < 2.5
      ? 'Energi kamu rendah minggu ini. Coba kurangi satu komitmen malam dan tidur lebih awal.'
      : 'Energi kamu cukup stabil. Pertahankan faktor pelindung seperti istirahat dan olahraga.';
  }
}

/* ── Breathing 4-7-8 ── */
let breathTimer = null, breathStep = 0;
const circle = document.getElementById('breathCircle');
const bBtn = document.getElementById('breathBtn');

function setBreath(text, cls){
  circle.textContent = text;
  circle.classList.remove('inhale','exhale');
  if(cls) circle.classList.add(cls);
}

function startBreath(){
  if(breathTimer){ stopBreath(); return; }
  bBtn.textContent = 'Berhenti';
  breathStep = 0;
  const cycle = ()=>{
    const phase = breathStep % 3;
    if(phase === 0){ setBreath('Tarik napas...','inhale'); }
    else if(phase === 1){ setBreath('Tahan...',''); }
    else { setBreath('Buang napas...','exhale'); }
    breathStep++;
  };
  cycle();
  breathTimer = setInterval(cycle, 4000);
}

function stopBreath(){
  clearInterval(breathTimer);
  breathTimer = null;
  bBtn.textContent = 'Mulai';
  setBreath('Siap?','');
}

/* ── Data ── */
function exportData(){
  const all = localStorage.getItem('bm') || '[]';
  const blob = new Blob([all], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'burnout-manager-data.json';
  a.click();
}

/* ── Init ── */
window.addEventListener('DOMContentLoaded', ()=>{
  const hari = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
  const bulan = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  const now = new Date();
  const t = document.getElementById('today');
  if(t) t.textContent = `${hari[now.getDay()]}, ${now.getDate()} ${bulan[now.getMonth()]}`;
});
