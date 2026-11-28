/* Player VSL + revelação do botão + links de recusa */
(function () {
  var C = window.CFG || {}, page = document.body.dataset;
  var KEY = page.key, REVEAL = +(C[page.reveal] || 0);
  var v = document.getElementById('vsl'), wrap = document.getElementById('player');
  var ov = document.getElementById('unmute'), bar = document.getElementById('pbar');
  var offer = document.getElementById('offer'), playI = document.getElementById('playicon');
  var started = false, revealed = false, manual = false;

  function store(k, val) { try { if (val === undefined) return JSON.parse(localStorage.getItem(k)); localStorage.setItem(k, JSON.stringify(val)); } catch (e) { return null; } }
  function cleanQS() { var q = location.search.replace(/[?&](reset|preview)=1/g, '').replace(/^&/, '?'); return q === '?' ? '' : q; }

  // links de recusa e compra
  document.querySelectorAll('[data-go]').forEach(function (a) {
    var dest = a.dataset.go === 'ACCESS' ? C.ACCESS_URL : a.dataset.go;
    a.href = dest + (dest.indexOf('http') === 0 ? '' : cleanQS());
    a.addEventListener('click', function () { var d = store(KEY) || {}; d.done = 1; store(KEY, d); });
  });
  document.querySelectorAll('[data-checkout]').forEach(function (a) {
    a.href = C[a.dataset.checkout] || '#';
    a.addEventListener('click', function () { var d = store(KEY) || {}; d.buy = 1; store(KEY, d); });
  });

  // clique no botão de 1 clique da Payt = aceitou: nunca mandar para o downsell
  var oc = document.getElementById('oneclick');
  if (oc) oc.addEventListener('click', function () { var d = store(KEY) || {}; d.buy = 1; store(KEY, d); }, true);

  function reveal(scroll) {
    if (revealed) return; revealed = true;
    var hn = document.querySelector('.hint'); if (hn) hn.style.display = 'none';
    offer.hidden = false; requestAnimationFrame(function () { offer.classList.add('on'); });
    var d = store(KEY) || {}; d.rv = 1; store(KEY, d);
    var st = document.getElementById('sticky');
    if (st) {
      st.hidden = false; requestAnimationFrame(function () { st.classList.add('on'); });
      if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { st.classList.toggle('on', !es[0].isIntersecting); }).observe(document.getElementById('cta-anchor'));
    }
  }
  // upsell: botão voltar do celular leva para o downsell em vez de sair do funil
  if (page.back && history.pushState) {
    try {
      history.pushState({ funil: 1 }, '', location.href);
      window.addEventListener('popstate', function () {
        var d = store(KEY) || {};
        if (d.buy) return;
        d.done = 1; store(KEY, d);
        location.replace(page.back + cleanQS());
      });
    } catch (e) {}
  }
  var saved = store(KEY);
  if ((saved && saved.rv) || page.always) reveal(false);

  // barra de progresso "rápida no começo" (retenção)
  function prog() { if (!v.duration) return; var x = v.currentTime / v.duration; bar.style.width = (100 * (1 - Math.pow(1 - x, 1.8))) + '%'; }

  v.addEventListener('timeupdate', function () {
    prog();
    if (started && !revealed && v.currentTime >= REVEAL) reveal(true);
    if (started) try { sessionStorage.setItem(KEY + '_t', v.currentTime); } catch (e) {}
  });
  v.addEventListener('error', function () { ov.classList.add('gone'); var pb=document.querySelector('.pb'); if(pb) pb.style.display='none'; reveal(false); });
  v.addEventListener('ended', function () { reveal(true); });

  // autoplay mudo + overlay "clique para ouvir"
  v.muted = true; var p = v.play(); if (p && p.catch) p.catch(function () {});
  var src = v.querySelector('source') || v; if (v.error) { ov.classList.add('gone'); reveal(false); }
  function start() {
    if (started) return; started = true; ov.classList.add('gone');
    var t = 0; try { t = +sessionStorage.getItem(KEY + '_t') || 0; } catch (e) {}
    v.currentTime = t > 3 ? t - 2 : 0; v.muted = false; v.play();
  }
  ov.addEventListener('click', start);
  wrap.addEventListener('click', function (e) {
    if (!started || e.target === ov || ov.contains(e.target)) return;
    if (v.paused) { manual = false; v.play(); playI.classList.remove('on'); } else { manual = true; v.pause(); playI.classList.add('on'); }
  });
  // pausa quando sai da aba e continua quando volta
  document.addEventListener('visibilitychange', function () { if (!started) return; if (document.hidden) v.pause(); else if (!manual) { v.play(); playI.classList.remove('on'); } });
})();
