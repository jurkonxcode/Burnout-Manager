/* ═══════════════════════════════════════════
   BURNOUT MANAGER — app.js
   ═══════════════════════════════════════════ */

function go(id){
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(id);
  if(!target) return;
  target.classList.add('active');
  target.scrollTop = 0;

  const nav = document.getElementById('nav');
  const showNav = id !== 's-welcome' && id !== 's-auth' && id !== 's-name';
  nav.classList.toggle('on', showNav);
  nav.querySelectorAll('button').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === id);
  });

  if(id === 's-tracker') renderCharts();
}

function saveName(){
  const input = document.getElementById('inputName');
  if(!input) return;
  const v = input.value.trim();
  if(!v){ alert('Isi nama dulu ya.'); return; }
  localStorage.setItem('bm_name', v);
  renderName();
  go('s-dash');
}

function renderName(){
  const n = localStorage.getItem('bm_name') || 'teman';
  const el = document.getElementById('userName');
  const av = document.getElementById('userAvatar');
  if(el) el.textContent = n;
  if(av) av.textContent = n.charAt(0).toUpperCase();
}

let severe = false;

function toggleSevere(){
  severe = !severe;
  const card = document.getElementById('statusCard');
  const label = document.getElementById('statusLabel');
  const note = document.getElementById('statusNote');
  const expert = document.getElementById('expertCard');
  if(!card) return;

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

function initCheckin(){
  document.querySelectorAll('.emoji-row, .chips').forEach(group => {
    group.querySelectorAll('.emoji, .chip').forEach(el => {
      el.onclick = () => {
        group.querySelectorAll('.emoji, .chip').forEach(x => x.classList.remove('sel'));
        el.classList.add('sel');
      };
    });
  });
}

function saveCheckin(){
  const data = {};
  let ok = true;

  document.querySelectorAll('[data-field]').forEach(g => {
    const sel = g.querySelector('.sel');
    if(!sel){ ok = false; return; }
    data[g.dataset.field] = +sel.dataset.v;
  });

  if(!ok){ alert('Isi semua dulu ya.'); return; }

  const all = JSON.parse(localStorage.getItem('bm_logs') || '[]');
  const today = new Date().toISOString().slice(0,10);

  const idx = all.findIndex(x => x.d === today);
  if(idx >= 0){
    all[idx] = { d: today, ...data };
  } else {
    all.push({ d: today, ...data });
  }

  localStorage.setItem('bm_logs', JSON.stringify(all));
  alert('Tersimpan. Terima kasih sudah jujur pada diri sendiri.');
  go('s-dash');
}

function renderCharts(){
  const all = JSON.parse(localStorage.getItem('bm_logs') || '[]');
  const days = ['Sen','Sel','Rab','Kam','Jum','Sab','Min'];
  const energy = [];
  const stress = [];

  for(let i = 6; i >= 0; i--){
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0,10);
    const hit = all.find(x => x.d === key);
    energy.push(hit ? hit.energy : 0);
    stress.push(hit ? hit.stress : 0);
  }

  const draw = (id, arr, color, hi) => {
    const el = document.getElementById(id);
    if(!el) return;
    el.innerHTML = '';
    const max = 4;
    arr.forEach((v, i) => {
      const bar = document.createElement('div');
      bar.className = 'bar' + (v >= hi ? ' hi' : '');
      bar.style.height = (v / max * 100 || 4) + '%';
      if(v >= hi) bar.style.background = color;
      const s = document.createElement('span');
      s.textContent = days[(new Date().getDay() - 6 + i + 7) % 7];
      bar.appendChild(s);
      el.appendChild(bar);
    });
  };

  draw('chartEnergy', energy, '#5B8DB8', 3);
  draw('chartStress', stress, '#C97A6D', 3);

  const filled = energy.filter(v => v > 0).length;
  const ins = document.getElementById('insight');
  if(!ins) return;

  if(filled < 3){
    ins.textContent = `Baru ${filled} hari data. Isi log harian beberapa hari lagi untuk insight.`;
  } else {
    const avgE = energy.filter(v => v).reduce((a,b) => a+b, 0) / filled;
    ins.textContent = avgE < 2.5
      ? 'Energi kamu rendah minggu ini. Coba kurangi satu komitmen malam dan tidur lebih awal.'
      : 'Energi kamu cukup stabil. Pertahankan faktor pelindung seperti istirahat dan olahraga.';
  }
}

let breathTimer = null;
let breathStep = 0;

function setBreath(text, cls){
  const circle = document.getElementById('breathCircle');
  if(!circle) return;
  circle.textContent = text;
  circle.classList.remove('inhale', 'exhale');
  if(cls) circle.classList.add(cls);
}

function startBreath(){
  const bBtn = document.getElementById('breathBtn');
  if(!bBtn) return;

  if(breathTimer){ stopBreath(); return; }

  bBtn.textContent = 'Berhenti';
  breathStep = 0;

  const cycle = () => {
    const phase = breathStep % 3;
    if(phase === 0) setBreath('Tarik napas...', 'inhale');
    else if(phase === 1) setBreath('Tahan...', '');
    else setBreath('Buang napas...', 'exhale');
    breathStep++;
  };

  cycle();
  breathTimer = setInterval(cycle, 4000);
}

function stopBreath(){
  clearInterval(breathTimer);
  breathTimer = null;
  const bBtn = document.getElementById('breathBtn');
  if(bBtn) bBtn.textContent = 'Mulai';
  setBreath('Siap?', '');
}

function exportData(){
  const all = localStorage.getItem('bm_logs') || '[]';
  const name = localStorage.getItem('bm_name') || 'user';
  const payload = {
    name: name,
    exportedAt: new Date().toISOString(),
    logs: JSON.parse(all)
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'burnout-manager-' + name + '.json';
  a.click();
}

window.addEventListener('DOMContentLoaded', () => {
  const hari = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
  const bulan = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  const now = new Date();
  const t = document.getElementById('today');
  if(t) t.textContent = `${hari[now.getDay()]}, ${now.getDate()} ${bulan[now.getMonth()]}`;

  renderName();
  initCheckin();
});
