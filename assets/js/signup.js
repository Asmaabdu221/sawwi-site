// سوّي · نموذج «نبّهوني». يرسل للجدول عبر رابط Apps Script المكتوب في data-endpoint.
// بدون رابط، النموذج يبقى مخفي ويطلع مكانه سطر «قريبًا».
(function () {
  var form = document.getElementById('signup');
  if (!form) return;
  var endpoint = form.getAttribute('data-endpoint') || '';
  var soon = document.getElementById('signup-soon');
  if (!/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(endpoint)) return;

  form.hidden = false;
  if (soon) soon.hidden = true;

  var status = form.querySelector('.signup__status');
  var button = form.querySelector('button[type="submit"]');
  var started = Date.now();

  function setError(field, message) {
    var wrap = form.querySelector('[data-field="' + field + '"]');
    if (!wrap) return;
    var input = wrap.querySelector('input,textarea');
    var err = wrap.querySelector('.sw-field__error');
    wrap.classList.toggle('sw-field--error', !!message);
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
    err.textContent = message || '';
    err.hidden = !message;
  }

  function say(text, kind) {
    status.textContent = text;
    status.dataset.kind = kind || '';
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var data = new FormData(form);
    var name = String(data.get('name') || '').trim();
    var email = String(data.get('email') || '').trim();
    var ok = true;

    setError('name', name ? '' : 'اكتبوا الاسم عشان نعرف نخاطبكم.');
    if (!name) ok = false;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      setError('email', 'البريد ناقص. اكتبوه كامل، مثل name@company.sa');
      ok = false;
    } else {
      setError('email', '');
    }
    if (!ok) {
      form.querySelector('[aria-invalid="true"]').focus();
      return;
    }
    // تعبئة أسرع من ثانيتين غالبًا بوت.
    if (Date.now() - started < 2000) data.set('website', 'fast');

    button.disabled = true;
    say('نرسل…');
    fetch(endpoint, { method: 'POST', body: new URLSearchParams(data) })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (res && res.ok) {
          form.reset();
          say(res.duplicate
            ? 'بريدكم مسجّل عندنا من قبل. بنرسل لكم أول ما يفتح التسجيل.'
            : 'تم. بنرسل لكم على بريدكم أول ما نحدد موعد الورشة.', 'ok');
        } else if (res && res.error === 'email') {
          setError('email', 'البريد ناقص. اكتبوه كامل، مثل name@company.sa');
          say('');
        } else {
          say('ما وصل التسجيل. جرّبوا مرة ثانية بعد شوي.', 'error');
        }
      })
      .catch(function () {
        say('ما وصل التسجيل، يمكن الاتصال انقطع. جرّبوا مرة ثانية.', 'error');
      })
      .then(function () { button.disabled = false; });
  });
})();
