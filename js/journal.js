/* ═══════════════════════════════════════════
   JURNAL — Burnout Manager (mandiri)
   File ini otomatis menambahkan:
   - CSS jurnal
   - 2 layar (daftar + editor)
   - Kartu di dashboard
   - Semua logika
   Cukup dipanggil dari index.html.
   ═══════════════════════════════════════════ */

(function(){
  'use strict';
  if(window._journalLoaded) return;
  window._journalLoaded = true;

  /* ── 1. Suntik CSS ── */
  const css = `
    .journal-textarea{width:100%;min-height:280px;padding:16px;border-radius:16px;border:1px solid var(--line);
      font:inherit;font-size:15px;line-height:1.7;background:var(--surface-2);color:var(--ink);
      outline:none;resize:vertical;font-family:inherit;
      backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}
    .journal-textarea::placeholder{color:var(--muted)}
    .journal-preview{font-size:13.5px;line-height:1.6;color:var(--ink);
      white-space:pre-wrap;word-break:break-word;
      display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
    .journal-date{font-size:12px;font-weight:600;color:var(--muted)}
    .journal-empty{text-align:center;padding:40px 20px}
    .journal-empty svg{width:48px;height:48px;stroke:var(--muted);stroke-width:1.4;fill:none;
      opacity:.5;margin-bottom:14px}
  `;
  const styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  /* ── 2. Suntik layar ── */
  const screensHTML = `
    <div class="screen" id="s-journal" data-depth="30">
      <div class="top">
        <div class="back" onclick="go('s-dash',true)">‹</div>
        <h1>Jurnal</h1>
      </div>
      <button class="btn btn-primary" onclick="newJournal()" style="margin-bottom:20px">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
        Tulis hari ini
      </button>
      <div id="journalList"></div>
    </div>

    <div class="screen" id="s-journal-edit" data-depth="31">
      <div class="top">
        <div class="back" onclick="go('s-journal',true)">‹</div>
        <h1 id="journalEditTitle">Tulis</h1>
        <div class="back" id="journalDeleteBtn" style="display:none" onclick="deleteJournal()" title="Hapus">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" style="width:18px;height:18px">
            <path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M10 11v6M14 11v6"/>
          </svg>
        </div>
      </div>
      <div class="journal-date" id="journalDate" style="margin-bottom:12px">—</div>
      <textarea id="journalText" class="journal-textarea" placeholder="Hari ini aku merasa..."></textarea>
      <button class="btn btn-primary" style="margin-top:16px" onclick="saveJournal()">Simpan</button>
      <p class="muted" style="text-align:center;margin-top:14px;font-size:12px">
        Jurnal hanya tersimpan di HP kamu.
      </p>
    </div>
  `;

  function injectScreens(){
    const phone = document.querySelector('.phone');
    if(phone && !document.getElementById('s-journal')){
      phone.insertAdjacentHTML('beforeend', screensHTML);
    }
  }

  /* ── 3. Fungsi ── */
  let editingJournalId = null;

  window.getJournals = function(){
    return JSON.parse(localStorage.getItem('bm_journals') || '[]');
  };
  window.saveJournals = function(arr){
    localStorage.setItem('bm_journals', JSON.stringify(arr));
  };
  window.formatJournalDate = function(iso){
    const d = new Date(iso);
    const hari = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
    const bulan = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
    return hari[d.getDay()] + ', ' + d.getDate() + ' ' + bulan[d.getMonth()] + ' ' + d.getFullYear();
  };

  window.newJournal = function(){
    editingJournalId = null;
    const t = document.getElementById('journalEditTitle');
    const dt = document.getElementById('journalDate');
    const ta = document.getElementById('journalText');
    const db = document.getElementById('journalDeleteBtn');
    if(t) t.textContent = 'Tulis';
    if(dt) dt.textContent = window.formatJournalDate(new Date().toISOString());
    if(ta) ta.value = '';
    if(db) db.style.display = 'none';
    if(typeof window.go === 'function') window.go('s-journal-edit');
  };

  window.openJournal = function(id){
    const all = window.getJournals();
    const j = all.find(x => x.id === id);
    if(!j) return;
    editingJournalId = id;
    const t = document.getElementById('journalEditTitle');
    const dt = document.getElementById('journalDate');
    const ta = document.getElementById('journalText');
    const db = document.getElementById('journalDeleteBtn');
    if(t) t.textContent = 'Edit';
    if(dt) dt.textContent = window.formatJournalDate(j.date);
    if(ta) ta.value = j.text;
    if(db) db.style.display = 'grid';
    if(typeof window.go === 'function') window.go('s-journal-edit');
  };

  window.saveJournal = function(){
    const ta = document.getElementById('journalText');
    if(!ta) return;
    const text = ta.value.trim();
    if(!text){ alert('Tulis sesuatu dulu ya.'); return; }
    const all = window.getJournals();
    if(editingJournalId){
      const idx = all.findIndex(x => x.id === editingJournalId);
      if(idx >= 0){
        all[idx].text = text;
        all[idx].updatedAt = new Date().toISOString();
      }
    } else {
      all.push({
        id: 'j' + Date.now(),
        text: text,
        date: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    window.saveJournals(all);
    alert('Tersimpan.');
    if(typeof window.go === 'function') window.go('s-journal', true);
  };

  window.deleteJournal = function(){
    if(!editingJournalId) return;
    if(!confirm('Hapus catatan ini? Tidak bisa dibatalkan.')) return;
    const all = window.getJournals().filter(x => x.id !== editingJournalId);
    window.saveJournals(all);
    editingJournalId = null;
    if(typeof window.go === 'function') window.go('s-journal', true);
  };

  window.renderJournalList = function(){
    const all = window.getJournals().sort((a,b) => new Date(b.date) - new Date(a.date));
    const box = document.getElementById('journalList');
    if(!box) return;
    if(all.length === 0){
      box.innerHTML =
        '<div class="journal-empty">' +
        '<svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M8 7h8M8 11h8M8 15h5"/></svg>' +
        '<div style="font-size:15px;font-weight:700;margin-bottom:6px">Belum ada catatan</div>' +
        '<p style="font-size:13px;margin:0">Mulai tulis hal kecil hari ini. Tidak perlu panjang.</p>' +
        '</div>';
      return;
    }
    box.innerHTML = '';
    all.forEach(j => {
      const card = document.createElement('div');
      card.className = 'card tap';
      card.onclick = () => window.openJournal(j.id);
      card.innerHTML =
        '<div class="journal-date" style="margin-bottom:8px">' + window.formatJournalDate(j.date) + '</div>' +
        '<div class="journal-preview">' + j.text.replace(/</g,'&lt;') + '</div>';
      box.appendChild(card);
    });
  };

  /* ── 4. Suntik kartu dashboard + hook go() ── */
  function injectDashboardCard(){
    const dash = document.getElementById('s-dash');
    if(!dash) return;
    if(document.getElementById('journalCardHook')) return;

    let target = dash.querySelector('.card[onclick*="s-checkin"]');
    if(!target){
      const cards = dash.querySelectorAll('.card');
      for(const c of cards){
        if(c.textContent.includes('Log Harian')){ target = c; break; }
      }
    }
    if(!target) return;

    const cardHTML = `
      <div class="card tap" id="journalCardHook" onclick="go('s-journal')">
        <div class="card-head">
          <div style="display:flex;gap:14px;align-items:center">
            <div class="icon-round" style="background:var(--accent-soft);color:var(--accent)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round"><path d="M4 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M8 7h8M8 11h8M8 15h5"/></svg>
            </div>
            <div>
              <h3>Jurnal</h3>
              <div class="muted" style="margin-top:3px">Tulis bebas, tanpa penilaian</div>
            </div>
          </div>
          <div style="font-size:22px;color:var(--muted)">›</div>
        </div>
      </div>
    `;
    target.insertAdjacentHTML('afterend', cardHTML);
  }

  function hookGo(){
    if(typeof window.go !== 'function') return;
    if(window._journalGoHooked) return;
    window._journalGoHooked = true;
    const originalGo = window.go;
    window.go = function(id, back){
      const result = originalGo.apply(this, arguments);
      if(id === 's-journal' || id === 's-journal-edit'){
        const nav = document.getElementById('nav');
        if(nav) nav.classList.remove('on');
        if(id === 's-journal') setTimeout(function(){ window.renderJournalList(); }, 30);
      }
      return result;
    };
  }

  function boot(){
    injectScreens();
    injectDashboardCard();
    hookGo();
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', function(){ setTimeout(boot, 40); });
  } else {
    setTimeout(boot, 40);
  }
})();
