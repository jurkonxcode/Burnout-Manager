/* ═══════════════════════════════════════════
   BURNOUT MANAGER — app.js v0.2
   ═══════════════════════════════════════════ */

const ONBOARDING_SCREENS = ['s-welcome','s-auth','s-name','s-tipi','s-chrono','s-work','s-result','s-assess','s-assess-result'];

/* ── NAVIGASI ── */
function depthOf(id){
  const el = document.getElementById(id);
  return el ? parseInt(el.dataset.depth || 0) : 0;
}

function go(id, back){
  const current = document.querySelector('.screen.active');
  const currentId = current ? current.id : null;
  if(currentId === id) return;
  const target = document.getElementById(id);
  if(!target) return;

  let dir = 'fade';
  if(!back && currentId){
    const d1 = depthOf(currentId);
    const d2 = depthOf(id);
    if(d2 > d1) dir = 'right';
    else if(d2 < d1) dir = 'left';
  } else if(back){
    dir = 'left';
  }

  if(current) current.classList.remove('active','slide-right','slide-left','fade-only');
  target.classList.add('active');
  if(dir === 'right') target.classList.add('slide-right');
  else if(dir === 'left') target.classList.add('slide-left');
  else target.classList.add('fade-only');
  target.scrollTop = 0;

  const nav = document.getElementById('nav');
  const showNav = !ONBOARDING_SCREENS.includes(id) && id !== 's-settings';
  nav.classList.toggle('on', showNav);
  nav.querySelectorAll('button').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === id);
  });

  if(id === 's-tracker') renderCharts();
  if(id === 's-profile') renderProfile();
  if(id === 's-settings') renderSettings();
  if(id === 's-dash') refreshDashboard();
}

/* ── TEMA ── */
function applyTheme(){
  const t = localStorage.getItem('bm_theme') || 'light';
  document.documentElement.setAttribute('data-theme', t);
  const sw = document.getElementById('themeSwitch');
  if(sw) sw.classList.toggle('on', t === 'dark');
  const meta = document.querySelector('meta[name="theme-color"]');
  if(meta) meta.setAttribute('content', t === 'dark' ? '#0A0E13' : '#EFEAE0');
}
function toggleTheme(){
  const t = localStorage.getItem('bm_theme') === 'dark' ? 'light' : 'dark';
  localStorage.setItem('bm_theme', t);
  applyTheme();
}

/* ── LOGIN MOCK ── */
function mockLogin(provider){
  localStorage.setItem('bm_auth', JSON.stringify({
    provider: provider,
    email: provider === 'google' ? 'kamu@gmail.com (demo)' : 'kamu@email.com (demo)',
    loginAt: new Date().toISOString()
  }));
  go('s-name');
}
function logout(){
  if(!confirm('Keluar dan hapus semua data di HP ini?')) return;
  localStorage.clear();
  location.reload();
}

/* ── NAMA ── */
function saveName(){
  const input = document.getElementById('inputName');
  if(!input) return;
  const v = input.value.trim();
  if(!v){ alert('Isi nama dulu ya.'); return; }
  localStorage.setItem('bm_name', v);
  renderName();
  go('s-dash'); // langsung ke dashboard, tidak paksa onboarding
}
function editName(){
  const cur = localStorage.getItem('bm_name') || '';
  const v = prompt('Nama panggilan:', cur);
  if(!v) return;
  localStorage.setItem('bm_name', v.trim());
  renderName();
  renderSettings();
  renderProfile();
  refreshDashboard();
}
function renderName(){
  const n = localStorage.getItem('bm_name') || 'teman';
  const photo = localStorage.getItem('bm_photo');
  const initial = n.charAt(0).toUpperCase();

  const un = document.getElementById('userName');
  if(un) un.textContent = n;

  const ua = document.getElementById('userAvatar');
  if(ua){
    ua.innerHTML = photo ? '<img src="'+photo+'" alt="">' : initial;
  }

  const pn = document.getElementById('profileName');
  if(pn) pn.textContent = n;

  const pi = document.getElementById('profileInitial');
  const pa = document.getElementById('profileAvatar');
  if(pi && pa){
    if(photo){
      pa.style.backgroundImage = 'url('+photo+')';
      pi.style.display = 'none';
    } else {
      pa.style.backgroundImage = '';
      pi.style.display = 'inline';
      pi.textContent = initial;
    }
  }

  const pe = document.getElementById('profileEmail');
  if(pe){
    const auth = JSON.parse(localStorage.getItem('bm_auth') || 'null');
    pe.textContent = auth ? auth.email : 'Mode demo · data lokal';
  }
}

/* ── FOTO PROFIL ── */
function pickPhoto(){
  const input = document.getElementById('photoInput');
  if(input) input.click();
}

function handlePhoto(ev){
  const file = ev.target.files && ev.target.files[0];
  if(!file) return;
  if(file.size > 8 * 1024 * 1024){ alert('Ukuran gambar terlalu besar. Maksimal 8 MB.'); return; }

  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      // Resize ke max 400x400 agar localStorage tidak penuh
      const max = 400;
      let w = img.width, h = img.height;
      if(w > h){ if(w > max){ h = Math.round(h * max / w); w = max; } }
      else { if(h > max){ w = Math.round(w * max / h); h = max; } }

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      try {
        localStorage.setItem('bm_photo', dataUrl);
        renderName();
      } catch(err){
        alert('Gagal menyimpan foto. Coba gambar yang lebih kecil.');
      }
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
  ev.target.value = '';
}

/* ── TIPI ── */
const tipiQuestions = [
  "Saya orang yang terbuka, antusias.",
  "Saya orang yang kritis, suka berdebat.",
  "Saya orang yang dapat diandalkan, disiplin diri.",
  "Saya orang yang cemas, mudah kesal.",
  "Saya orang yang terbuka pada pengalaman baru.",
  "Saya orang yang pendiam, tidak banyak bicara.",
  "Saya orang yang simpatik, hangat.",
  "Saya orang yang tidak terorganisir, ceroboh.",
  "Saya orang yang tenang, stabil secara emosi.",
  "Saya orang yang konvensional, kurang kreatif."
];
const tipiLabels = ["Sangat tidak setuju","Tidak setuju","Agak tidak setuju","Netral","Agak setuju","Setuju","Sangat setuju"];

let tipiIndex = 0;
let onboarding = { tipi: [], wake:null, focus:null, jobType:null, workHours:null, meetings:null, big5:null, skipCount:0 };

function startTipi(){
  tipiIndex = 0;
  onboarding.tipi = [];
  onboarding.skipCount = 0;
  renderTipi();
  go('s-tipi');
}
function renderTipi(){
  document.getElementById('tipiNum').textContent = tipiIndex + 1;
  document.getElementById('tipiText').textContent = tipiQuestions[tipiIndex];
  document.getElementById('tipiProgress').style.width = ((tipiIndex)/10*100) + '%';
  const opts = document.getElementById('tipiOptions');
  opts.innerHTML = '';
  tipiLabels.forEach((label, i) => {
    const el = document.createElement('div');
    el.className = 'tipi-opt';
    el.innerHTML = '<div class="num">' + (i+1) + '</div><div>' + label + '</div>';
    el.onclick = () => answerTipi(i + 1);
    opts.appendChild(el);
  });
}
function answerTipi(value){
  onboarding.tipi[tipiIndex] = value;
  tipiIndex++;
  if(tipiIndex >= tipiQuestions.length){
    computeBig5();
    go('s-chrono');
  } else renderTipi();
}
function skipTipi(){
  onboarding.tipi[tipiIndex] = 4;
  onboarding.skipCount = (onboarding.skipCount || 0) + 1;
  tipiIndex++;
  if(tipiIndex >= tipiQuestions.length){
    computeBig5();
    go('s-chrono');
  } else renderTipi();
}
function skipAllTipi(){
  if(!confirm('Lewati semua pertanyaan kepribadian? Bisa diisi nanti lewat Pengaturan.')) return;
  for(let i = 0; i < tipiQuestions.length; i++) onboarding.tipi[i] = 4;
  onboarding.skipCount = tipiQuestions.length;
  computeBig5();
  go('s-chrono');
}
function computeBig5(){
  const t = onboarding.tipi;
  const r = i => 8 - t[i];
  onboarding.big5 = {
    E: (t[0] + r(5)) / 2,
    A: (t[6] + r(1)) / 2,
    C: (t[2] + r(7)) / 2,
    N: (t[3] + r(8)) / 2,
    O: (t[4] + r(9)) / 2
  };
}

/* ── CHRONO & WORK ── */
function saveChrono(){
  const w = document.querySelector('[data-field="wake"] .sel');
  const f = document.querySelector('[data-field="focus"] .sel');
  if(!w || !f){ alert('Pilih dulu ya.'); return; }
  onboarding.wake = +w.dataset.v;
  onboarding.focus = +f.dataset.v;
  go('s-work');
}
function skipChrono(){
  const w = document.querySelector('[data-field="wake"] .sel');
  const f = document.querySelector('[data-field="focus"] .sel');
  onboarding.wake = w ? +w.dataset.v : null;
  onboarding.focus = f ? +f.dataset.v : null;
  go('s-work');
}
function saveWork(){
  const jt = document.querySelector('[data-field="jobType"] .sel');
  const wh = document.querySelector('[data-field="workHours"] .sel');
  const mt = document.querySelector('[data-field="meetings"] .sel');
  if(!jt || !wh || !mt){ alert('Isi semua dulu ya.'); return; }
  onboarding.jobType = +jt.dataset.v;
  onboarding.workHours = +wh.dataset.v;
  onboarding.meetings = +mt.dataset.v;
  renderResult();
  go('s-result');
}
function skipWork(){
  const jt = document.querySelector('[data-field="jobType"] .sel');
  const wh = document.querySelector('[data-field="workHours"] .sel');
  const mt = document.querySelector('[data-field="meetings"] .sel');
  onboarding.jobType = jt ? +jt.dataset.v : null;
  onboarding.workHours = wh ? +wh.dataset.v : null;
  onboarding.meetings = mt ? +mt.dataset.v : null;
  renderResult();
  go('s-result');
}

/* ── HASIL PROFIL ── */
function renderResult(){
  const b = onboarding.big5;
  const names = { O: 'Keterbukaan', C: 'Kedisiplinan', E: 'Ekstraversi', A: 'Keramahan', N: 'Sensitivitas stres' };
  const pCard = document.getElementById('resultPersonality');
  pCard.innerHTML = '<h2>Kepribadian</h2>';
  ['O','C','E','A','N'].forEach(k => {
    const pct = Math.round(b[k]/7*100);
    const row = document.createElement('div');
    row.className = 'pbar';
    row.innerHTML = '<div class="pbar-label">' + names[k] + '</div>' +
                    '<div class="pbar-track"><div class="pbar-fill" style="width:' + pct + '%"></div></div>' +
                    '<div class="pbar-val">' + b[k].toFixed(1) + '</div>';
    pCard.appendChild(row);
  });

  const chronoLabels = { 1:'Pagi banget', 2:'Pagi', 3:'Siang', 4:'Sore', 5:'Malam', 6:'Malam banget' };
  if(onboarding.focus === null || onboarding.focus === undefined){
    document.getElementById('resultChrono').innerHTML =
      '<h2>Jam biologis</h2><p style="margin:0;font-size:14px;color:var(--muted)">Belum diisi.</p>';
  } else {
    const chronoType = onboarding.focus <= 2 ? 'Tipe pagi' : onboarding.focus >= 5 ? 'Tipe malam' : 'Tipe menengah';
    document.getElementById('resultChrono').innerHTML =
      '<h2>Jam biologis</h2><p style="margin:0;font-size:14px;color:var(--ink)"><strong>' + chronoType +
      '</strong><br>Paling fokus: ' + chronoLabels[onboarding.focus] + '</p>';
  }

  const jobLabels = { 1:'Kantoran', 2:'Remote', 3:'Hybrid', 4:'Freelancer', 5:'Shift', 6:'Lainnya' };
  const hourLabels = { 1:'< 6 jam', 2:'6–8 jam', 3:'8–10 jam', 4:'> 10 jam' };
  const meetLabels = { 1:'0–1', 2:'2–3', 3:'4–5', 4:'6+' };
  if(onboarding.jobType === null || onboarding.jobType === undefined){
    document.getElementById('resultWork').innerHTML =
      '<h2>Konteks kerja</h2><p style="margin:0;font-size:14px;color:var(--muted)">Belum diisi.</p>';
  } else {
    document.getElementById('resultWork').innerHTML =
      '<h2>Konteks kerja</h2><p style="margin:0;font-size:14px;color:var(--ink)">' +
      jobLabels[onboarding.jobType] + ' · ' + hourLabels[onboarding.workHours] + ' per hari<br>' +
      'Rapat: ' + meetLabels[onboarding.meetings] + ' per hari</p>';
  }

  const insights = [];
  if(b.N >= 4.5) insights.push('Kamu cukup sensitif terhadap stres. Jaga waktu pemulihan harian.');
  if(b.C >= 5) insights.push('Kamu cenderung disiplin dan bisa overwork tanpa sadar. Pasang batas jam kerja.');
  if(b.E <= 3 && onboarding.jobType === 2) insights.push('Kerja remote dengan ekstraversi rendah bisa bikin terisolasi.');
  if(b.O >= 5) insights.push('Keterbukaanmu tinggi. Coba teknik istirahat yang bervariasi.');
  if(onboarding.workHours >= 3) insights.push('Jam kerjamu panjang. Prioritaskan tidur 7–8 jam.');
  if(onboarding.meetings >= 3) insights.push('Rapatmu padat. Sisipkan blok fokus tanpa gangguan.');
  if(insights.length === 0) insights.push('Profilmu cukup seimbang. Lanjutkan kebiasaan baik.');
  if(onboarding.skipCount >= 4) insights.push('Kamu melewati ' + onboarding.skipCount + ' pertanyaan kepribadian. Hasil mungkin kurang akurat.');

  document.getElementById('resultInsights').innerHTML =
    insights.map(t => '<p style="margin:0 0 10px;font-size:13px;color:var(--ink)">• ' + t + '</p>').join('');
}

function finishOnboarding(){
  localStorage.setItem('bm_profile', JSON.stringify(onboarding));
  go('s-dash');
}

/* ── ASESMEN ── */
const assessQuestions = [
  "Saya merasa lelah.",
  "Saya merasa secara fisik terkuras.",
  "Saya merasa secara emosional terkuras.",
  "Pekerjaan saya membuat saya frustrasi.",
  "Saya merasa lelah ketika memikirkan hari kerja lain.",
  "Saya merasa terkuras di akhir hari kerja.",
  "Saya kehilangan semangat dalam bekerja.",
  "Saya merasa tidak peduli lagi dengan pekerjaan.",
  "Saya merasa tidak mampu menyelesaikan pekerjaan.",
  "Saya merasa usaha saya sia-sia."
];
const assessLabels = ["Tidak pernah","Jarang","Kadang","Sering","Selalu"];

let assessIndex = 0;
let assessAnswers = [];

function startAssess(){
  assessIndex = 0;
  assessAnswers = [];
  renderAssess();
  go('s-assess');
}
function renderAssess(){
  document.getElementById('assessNum').textContent = assessIndex + 1;
  document.getElementById('assessText').textContent = assessQuestions[assessIndex];
  document.getElementById('assessProgress').style.width = (assessIndex/10*100) + '%';
  const opts = document.getElementById('assessOptions');
  opts.innerHTML = '';
  assessLabels.forEach((label, i) => {
    const el = document.createElement('div');
    el.className = 'tipi-opt';
    el.innerHTML = '<div class="num">' + i + '</div><div>' + label + '</div>';
    el.onclick = () => answerAssess(i);
    opts.appendChild(el);
  });
}
function answerAssess(value){
  assessAnswers[assessIndex] = value;
  assessIndex++;
  if(assessIndex >= assessQuestions.length){
    computeAssess();
    renderAssessResult();
    go('s-assess-result');
  } else renderAssess();
}
function skipAssess(){
  if(!confirm('Isi asesmen nanti? Kamu bisa isi lagi lewat Pengaturan.')) return;
  go('s-dash');
}
function computeAssess(){
  const total = assessAnswers.reduce((a,b) => a+b, 0);
  let level, desc;
  if(total <= 9){ level = 'Rendah'; desc = 'Indikasi burnout rendah. Pertahankan kebiasaan baikmu.'; }
  else if(total <= 19){ level = 'Sedang'; desc = 'Ada tanda-tanda awal. Jaga waktu pemulihan dan batas kerja.'; }
  else if(total <= 29){ level = 'Tinggi'; desc = 'Kamu cukup terbebani. Pertimbangkan bicara dengan ahli.'; }
  else { level = 'Berat'; desc = 'Kamu sangat terbebani. Kami sarankan segera bicara dengan ahli.'; }
  window._assess = { total, level, desc, answers: assessAnswers.slice(), date: new Date().toISOString().slice(0,10) };
}
function renderAssessResult(){
  const a = window._assess;
  const circle = document.getElementById('scoreCircle');
  circle.className = 'score-circle ' + (a.total<=9?'low':a.total<=19?'mid':a.total<=29?'high':'severe');
  document.getElementById('scoreNum').textContent = a.total;
  document.getElementById('scoreLevel').textContent = 'Risiko: ' + a.level;
  document.getElementById('scoreDesc').textContent = a.desc;

  const advice = [];
  if(a.total <= 9){
    advice.push('Lanjutkan tidur 7–8 jam dan olahraga ringan rutin.');
    advice.push('Isi log harian supaya kamu tahu saat energi mulai turun.');
  } else if(a.total <= 19){
    advice.push('Tetapkan jam berhenti kerja yang tegas.');
    advice.push('Sisipkan jeda 5 menit setiap 90 menit kerja.');
    advice.push('Kurangi satu komitmen opsional minggu ini.');
  } else if(a.total <= 29){
    advice.push('Bicara dengan atasan soal prioritas, bukan menambah beban.');
    advice.push('Blokir waktu tanpa notifikasi setiap hari.');
    advice.push('Pertimbangkan sesi dengan psikolog dalam 2 minggu.');
  } else {
    advice.push('Prioritaskan pemulihan, bukan produktivitas.');
    advice.push('Hubungi psikolog atau psikiater secepatnya.');
    advice.push('Beri tahu satu orang yang kamu percaya.');
    document.getElementById('crisisBanner').style.display = 'block';
  }
  document.getElementById('assessAdvice').innerHTML =
    advice.map(t => '<p style="margin:0 0 10px;font-size:13px;color:var(--ink)">• ' + t + '</p>').join('');
}
function finishAssess(){
  localStorage.setItem('bm_assessment', JSON.stringify(window._assess));
  go('s-dash');
}

/* ── DASHBOARD ── */
function refreshDashboard(){
  updateStatusFromScore();
  updateCTAs();
}
function updateCTAs(){
  const hasProfile = !!localStorage.getItem('bm_profile');
  const hasAssess = !!localStorage.getItem('bm_assessment');
  const p = document.getElementById('ctaProfile');
  const a = document.getElementById('ctaAssess');
  if(p) p.style.display = hasProfile ? 'none' : 'block';
  if(a) a.style.display = hasAssess ? 'none' : 'block';
}
function updateStatusFromScore(){
  const a = JSON.parse(localStorage.getItem('bm_assessment') || 'null');
  const card = document.getElementById('statusCard');
  const label = document.getElementById('statusLabel');
  const note = document.getElementById('statusNote');
  if(!card) return;
  if(!a){
    label.textContent = '—';
    note.textContent = 'Belum ada data. Cek tingkat burnout di bawah.';
    card.style.background = 'linear-gradient(135deg,#5B8DB8,#8FB6D8)';
    card.style.boxShadow = '0 16px 40px rgba(91,141,184,.35)';
    return;
  }
  label.textContent = a.level;
  note.textContent = 'Skor: ' + a.total + ' dari 40';
  let bg, sh;
  if(a.total <= 9){ bg = 'linear-gradient(135deg,#7FA588,#A9C4AD)'; sh = 'rgba(127,165,136,.35)'; }
  else if(a.total <= 19){ bg = 'linear-gradient(135deg,#5B8DB8,#8FB6D8)'; sh = 'rgba(91,141,184,.35)'; }
  else if(a.total <= 29){ bg = 'linear-gradient(135deg,#D9A56A,#EBC896)'; sh = 'rgba(217,165,106,.4)'; }
  else { bg = 'linear-gradient(135deg,#C97A6D,#E2A89A)'; sh = 'rgba(201,122,109,.4)'; }
  card.style.background = bg;
  card.style.boxShadow = '0 16px 40px ' + sh;
}
let severe = false;
function toggleSevere(){
  severe = !severe;
  const expert = document.getElementById('expertCard');
  if(severe){
    document.getElementById('statusLabel').textContent = 'Berat (demo)';
    document.getElementById('statusNote').textContent = 'Kami sarankan bicara dengan ahli';
    document.getElementById('statusCard').style.background = 'linear-gradient(135deg,#C97A6D,#E2A89A)';
    expert.style.display = 'block';
  } else {
    updateStatusFromScore();
    expert.style.display = 'none';
  }
}

/* ── CHECK-IN ── */
function initChips(){
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
  if(idx >= 0) all[idx] = { d: today, ...data };
  else all.push({ d: today, ...data });
  localStorage.setItem('bm_logs', JSON.stringify(all));
  alert('Tersimpan.');
  go('s-dash', true);
}

/* ── GRAFIK ── */
function renderCharts(){
  const all = JSON.parse(localStorage.getItem('bm_logs') || '[]');
  const days = ['Sen','Sel','Rab','Kam','Jum','Sab','Min'];
  const energy = [], stress = [];
  for(let i = 6; i >= 0; i--){
    const d = new Date(); d.setDate(d.getDate() - i);
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
      bar.style.height = (v/max*100 || 4) + '%';
      if(v >= hi) bar.style.background = color;
      const s = document.createElement('span');
      s.textContent = days[(new Date().getDay() - 6 + i + 7) % 7];
      bar.appendChild(s);
      el.appendChild(bar);
    });
  };
  draw('chartEnergy', energy, 'linear-gradient(180deg,#8FB6D8,#5B8DB8)', 3);
  draw('chartStress', stress, 'linear-gradient(180deg,#E2A89A,#C97A6D)', 3);

  const filled = energy.filter(v => v > 0).length;
  const ins = document.getElementById('insight');
  if(!ins) return;
  if(filled < 3){
    ins.textContent = 'Baru ' + filled + ' hari data. Isi log harian beberapa hari lagi.';
  } else {
    const avgE = energy.filter(v => v).reduce((a,b) => a+b, 0) / filled;
    ins.textContent = avgE < 2.5
      ? 'Energi kamu rendah minggu ini. Coba kurangi satu komitmen malam.'
      : 'Energi kamu cukup stabil. Pertahankan faktor pelindung.';
  }
}

/* ── NAPAS ── */
let breathTimer = null, breathStep = 0;
function setBreath(text, cls){
  const circle = document.getElementById('breathCircle');
  if(!circle) return;
  circle.textContent = text;
  circle.classList.remove('inhale','exhale');
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
    if(phase === 0) setBreath('Tarik napas...','inhale');
    else if(phase === 1) setBreath('Tahan...','');
    else setBreath('Buang napas...','exhale');
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
  setBreath('Siap?','');
}

/* ── PROFIL ── */
function renderProfile(){
  renderName();
  const card = document.getElementById('profileSummary');
  const p = JSON.parse(localStorage.getItem('bm_profile') || 'null');
  if(!p){
    card.innerHTML = '<h2>Profilmu</h2><p style="margin:0;font-size:13px;color:var(--muted)">Belum diisi. <a onclick="startTipi()" style="color:var(--primary);font-weight:700;cursor:pointer">Mulai sekarang</a></p>';
  } else {
    const b = p.big5;
    card.innerHTML =
      '<h2>Profilmu</h2>' +
      '<div class="pbar"><div class="pbar-label">Keterbukaan</div><div class="pbar-track"><div class="pbar-fill" style="width:' + Math.round(b.O/7*100) + '%"></div></div><div class="pbar-val">' + b.O.toFixed(1) + '</div></div>' +
      '<div class="pbar"><div class="pbar-label">Kedisiplinan</div><div class="pbar-track"><div class="pbar-fill" style="width:' + Math.round(b.C/7*100) + '%"></div></div><div class="pbar-val">' + b.C.toFixed(1) + '</div></div>' +
      '<div class="pbar"><div class="pbar-label">Ekstraversi</div><div class="pbar-track"><div class="pbar-fill" style="width:' + Math.round(b.E/7*100) + '%"></div></div><div class="pbar-val">' + b.E.toFixed(1) + '</div></div>' +
      '<div class="pbar"><div class="pbar-label">Keramahan</div><div class="pbar-track"><div class="pbar-fill" style="width:' + Math.round(b.A/7*100) + '%"></div></div><div class="pbar-val">' + b.A.toFixed(1) + '</div></div>' +
      '<div class="pbar"><div class="pbar-label">Sensitivitas stres</div><div class="pbar-track"><div class="pbar-fill" style="width:' + Math.round(b.N/7*100) + '%"></div></div><div class="pbar-val">' + b.N.toFixed(1) + '</div></div>';
  }
  const acard = document.getElementById('profileAssess');
  const a = JSON.parse(localStorage.getItem('bm_assessment') || 'null');
  if(!a){
    acard.innerHTML = '<h2>Asesmen burnout</h2><p style="margin:0;font-size:13px;color:var(--muted)">Belum diisi. <a onclick="startAssess()" style="color:var(--primary);font-weight:700;cursor:pointer">Mulai sekarang</a></p>';
  } else {
    acard.innerHTML =
      '<h2>Asesmen burnout</h2>' +
      '<p style="margin:0;font-size:14px;color:var(--ink)"><strong>' + a.level + '</strong> · ' + a.total + '/40</p>' +
      '<p class="muted" style="margin:6px 0 0;font-size:12px">Terakhir: ' + a.date + '</p>';
  }
}

/* ── SETTINGS ── */
function renderSettings(){
  const n = localStorage.getItem('bm_name') || '—';
  const el = document.getElementById('setName');
  if(el) el.textContent = n;
  applyTheme();
}

/* ── EKSPOR ── */
function exportData(){
  const payload = {
    name: localStorage.getItem('bm_name') || 'user',
    auth: JSON.parse(localStorage.getItem('bm_auth') || 'null'),
    profile: JSON.parse(localStorage.getItem('bm_profile') || 'null'),
    assessment: JSON.parse(localStorage.getItem('bm_assessment') || 'null'),
    logs: JSON.parse(localStorage.getItem('bm_logs') || '[]'),
    theme: localStorage.getItem('bm_theme') || 'light',
    hasPhoto: !!localStorage.getItem('bm_photo'),
    exportedAt: new Date().toISOString()
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'burnout-manager.json';
  a.click();
}

/* ── INIT ── */
window.addEventListener('DOMContentLoaded', () => {
  applyTheme();
  const hari = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
  const bulan = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  const now = new Date();
  const t = document.getElementById('today');
  if(t) t.textContent = hari[now.getDay()] + ', ' + now.getDate() + ' ' + bulan[now.getMonth()];

  renderName();
  initChips();

  // Auto-masuk kalau sudah punya nama
  if(localStorage.getItem('bm_name')){
    go('s-dash');
  }
});
