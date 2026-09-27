/* ═══════════════════════════════════════════
   PENGINGAT HARIAN — Burnout Manager (mandiri)
   Menambahkan toggle pengingat di Pengaturan.
   ═══════════════════════════════════════════ */

(function(){
  'use strict';
  if(window._reminderLoaded) return;
  window._reminderLoaded = true;

  const KEY = 'bm_reminder';

  function getReminder(){
    try {
      const r = JSON.parse(localStorage.getItem(KEY) || '{}');
      return {
        enabled: !!r.enabled,
        time: r.time || '20:00',
        lastFired: r.lastFired || null
      };
    } catch(e){
      return { enabled:false, time:'20:00', lastFired:null };
    }
  }
  function saveReminder(r){
    localStorage.setItem(KEY, JSON.stringify(r));
  }

  /* ── Suntik UI ke kartu "Notifikasi" di Pengaturan ── */
  function injectSettingsRow(){
    const cards = document.querySelectorAll('#s-settings .card');
    let notifCard = null;
    for(const c of cards){
      const h = c.querySelector('h2');
      if(h && h.textContent.trim() === 'Notifikasi'){ notifCard = c; break; }
    }
    if(!notifCard) return;

    notifCard.innerHTML = `
      <h2>Notifikasi</h2>
      <div class="setting" onclick="toggleReminder()" style="cursor:pointer">
        <div class="setting-left">
          <div class="setting-icon" style="background:var(--accent-soft);color:var(--accent)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          </div>
          <div>
            <div class="setting-label">Pengingat harian</div>
            <div class="setting-sub" id="reminderSub">Nonaktif</div>
          </div>
        </div>
        <div class="switch" id="reminderSwitch"></div>
      </div>
      <div class="setting" id="reminderTimeRow" onclick="pickReminderTime()" style="cursor:pointer;display:none">
        <div class="setting-left">
          <div class="setting-icon" style="background:var(--primary-soft);color:var(--primary)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
          </div>
          <div>
            <div class="setting-label">Jam pengingat</div>
            <div class="setting-sub">Kapan kamu mau diingatkan</div>
          </div>
        </div>
        <div class="setting-value" id="reminderTimeValue">20:00</div>
      </div>
      <input type="time" id="reminderTimeInput" style="position:absolute;opacity:0;pointer-events:none">
      <p class="muted" id="reminderNote" style="margin:12px 0 0;font-size:11.5px;line-height:1.55"></p>
    `;
    refreshUI();
  }

  /* ── Toggle on/off ── */
  window.toggleReminder = async function(){
    const r = getReminder();
    r.enabled = !r.enabled;

    if(r.enabled){
      if(!('Notification' in window)){
        alert('HP ini belum mendukung notifikasi browser.');
        r.enabled = false;
        saveReminder(r);
        refreshUI();
        return;
      }
      if(Notification.permission === 'default'){
        const perm = await Notification.requestPermission();
        if(perm !== 'granted'){
          alert('Izin notifikasi ditolak. Aktifkan dari pengaturan browser.');
          r.enabled = false;
          saveReminder(r);
          refreshUI();
          return;
        }
      } else if(Notification.permission !== 'granted'){
        alert('Izin notifikasi diblokir. Buka pengaturan browser untuk mengizinkan.');
        r.enabled = false;
        saveReminder(r);
        refreshUI();
        return;
      }
    }

    saveReminder(r);
    refreshUI();

    if(r.enabled){
      if(Notification.permission === 'granted'){
        try {
          new Notification('Pengingat aktif', {
            body: 'Kamu akan diingatkan setiap hari jam ' + r.time + '.',
            tag: 'bm-test'
          });
        } catch(e){}
      }
      startChecker();
    } else {
      stopChecker();
    }
  };

  /* ── Pilih jam ── */
  window.pickReminderTime = function(){
    const input = document.getElementById('reminderTimeInput');
    if(!input) return;
    input.value = getReminder().time;

    if(input.showPicker){
      try { input.showPicker(); return; } catch(e){}
    }
    const v = prompt('Jam pengingat (format 24 jam, contoh 20:00):', getReminder().time);
    if(v && /^\d{1,2}:\d{2}$/.test(v)){
      const r = getReminder();
      r.time = v;
      saveReminder(r);
      refreshUI();
    }
  };

  document.addEventListener('change', function(e){
    if(e.target && e.target.id === 'reminderTimeInput' && e.target.value){
      const r = getReminder();
      r.time = e.target.value;
      saveReminder(r);
      refreshUI();
    }
  });

  /* ── UI refresh ── */
  function refreshUI(){
    const r = getReminder();
    const sw = document.getElementById('reminderSwitch');
    const sub = document.getElementById('reminderSub');
    const tRow = document.getElementById('reminderTimeRow');
    const tVal = document.getElementById('reminderTimeValue');
    const note = document.getElementById('reminderNote');

    if(sw) sw.classList.toggle('on', r.enabled);
    if(sub) sub.textContent = r.enabled ? ('Aktif · ' + r.time) : 'Nonaktif';
    if(tRow) tRow.style.display = r.enabled ? 'flex' : 'none';
    if(tVal) tVal.textContent = r.time;

    if(note){
      if(r.enabled){
        note.textContent = 'Catatan: notifikasi muncul saat aplikasi ini sedang terbuka di browser. Kalau tertutup total, tidak muncul. Untuk Android: buka app di Chrome, biarkan tab tetap ada. Untuk iPhone: tambahkan dulu app ke Home Screen lewat menu Share.';
      } else {
        note.textContent = 'Isi log atau jurnal di jam yang sama tiap hari. Lama-lama jadi kebiasaan.';
      }
    }
  }

  /* ── Fire notifikasi ── */
  function fireNotification(){
    const r = getReminder();
    if(!r.enabled) return;
    if(!('Notification' in window) || Notification.permission !== 'granted') return;

    const now = new Date();
    const today = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0') + '-' + String(now.getDate()).padStart(2,'0');
    if(r.lastFired === today) return;

    const parts = r.time.split(':').map(Number);
    const target = new Date();
    target.setHours(parts[0], parts[1], 0, 0);
    if(now < target) return;

    try {
      new Notification('Burnout Manager', {
        body: 'Waktunya catat hari ini. 20 detik saja.',
        tag: 'bm-daily',
        renotify: true
      });
    } catch(e){}

    r.lastFired = today;
    saveReminder(r);
  }

  /* ── Checker ── */
  let timer = null;
  function startChecker(){
    if(timer) clearInterval(timer);
    fireNotification();
    timer = setInterval(fireNotification, 30000);
  }
  function stopChecker(){
    if(timer){ clearInterval(timer); timer = null; }
  }

  /* ── Boot ── */
  function boot(){
    injectSettingsRow();
    if(getReminder().enabled && 'Notification' in window && Notification.permission === 'granted'){
      startChecker();
    }
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', function(){ setTimeout(boot, 100); });
  } else {
    setTimeout(boot, 100);
  }
})();
