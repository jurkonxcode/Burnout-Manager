/* ═══════════════════════════════════════════
   PENGINGAT HARIAN — Burnout Manager (mandiri)
   Membuat kartu Notifikasi sendiri di Pengaturan.
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

  /* ── Suntik kartu Notifikasi ke Pengaturan ── */
  function injectNotifCard(){
    const settings = document.getElementById('s-settings');
    if(!settings) return;

    // Kalau sudah ada (dari HTML asli), pakai itu
    let notifCard = null;
    const cards = settings.querySelectorAll('.card');
    for(const c of cards){
      const h = c.querySelector('h2');
      if(h && h.textContent.trim() === 'Notifikasi'){ notifCard = c; break; }
    }

    if(notifCard){
      // Kartu sudah ada di HTML, tinggal isi
      fillCard(notifCard);
      return;
    }

    // Kartu belum ada — buat baru dan sisipkan
    // Cari kartu "Tampilan" atau "Data & privasi" sebagai patokan
    let anchor = null;
    for(const c of cards){
      const h = c.querySelector('h2');
      if(!h) continue;
      const t = h.textContent.trim();
      if(t === 'Tampilan'){ anchor = c; break; }
    }
    if(!anchor){
      for(const c of cards){
        const h = c.querySelector('h2');
        if(h && h.textContent.trim() === 'Data & privasi'){ anchor = c; break; }
      }
    }
    if(!anchor) anchor = cards[0];

    const card = document.createElement('div');
    card.className = 'card';
    card.id = 'notifCardInjected';
    card.innerHTML = '<h2>Notifikasi</h2><div id="notifCardBody"></div>';

    if(anchor && anchor.parentNode){
      anchor.parentNode.insertBefore(card, anchor.nextSibling);
    } else {
      settings.appendChild(card);
    }
    fillCard(card);
  }

  function fillCard(card){
    let body = card.querySelector('#notifCardBody');
    if(!body){
      // Kartu dari HTML asli — ganti seluruh isinya
      card.innerHTML = '<h2>Notifikasi</h2><div id="notifCardBody"></div>';
      body = card.querySelector('#notifCardBody');
    }
    body.innerHTML = `
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
        note.textContent = 'Catatan: notifikasi muncul saat aplikasi ini sedang terbuka di browser. Kalau tertutup total, tidak muncul. Untuk iPhone: tambahkan dulu ke Home Screen.';
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

  /* ── Hook go() untuk inject ulang saat masuk Pengaturan ── */
  function hookGo(){
    if(typeof window.go !== 'function') return;
    if(window._reminderGoHooked) return;
    window._reminderGoHooked = true;
    const originalGo = window.go;
    window.go = function(id, back){
      const result = originalGo.apply(this, arguments);
      if(id === 's-settings'){
        setTimeout(injectNotifCard, 30);
      }
      return result;
    };
  }

  /* ── Boot ── */
  function boot(){
    injectNotifCard();
    hookGo();
    if(getReminder().enabled && 'Notification' in window && Notification.permission === 'granted'){
      startChecker();
    }
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', function(){ setTimeout(boot, 120); });
  } else {
    setTimeout(boot, 120);
  }
})();
