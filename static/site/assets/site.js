/* Cleargrin Dental Clinic — page behaviour.
   Header state, mobile menu, service search, booking form, testimonials and
   the expandable 3D stage. No build step, no dependencies. */

(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);

  // ── Header shadow ──────────────────────────────────────────
  const header = $('site-header');
  const syncHeader = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
  syncHeader();
  window.addEventListener('scroll', syncHeader, { passive: true });

  // ── Mobile navigation ──────────────────────────────────────
  const nav = $('primary-nav');
  const navToggle = $('nav-toggle');

  const setNav = (open) => {
    nav.classList.toggle('is-open', open);
    header.classList.toggle('is-nav-open', open);
    navToggle.setAttribute('aria-expanded', String(open));
  };

  navToggle.addEventListener('click', () => setNav(!nav.classList.contains('is-open')));
  nav.addEventListener('click', (event) => {
    if (event.target.closest('a')) setNav(false);
  });

  // ── Service search ─────────────────────────────────────────
  const searchToggle = $('search-toggle');
  const searchBar = $('service-search');
  const searchInput = $('service-search-input');
  const searchClear = $('service-search-clear');
  const servicesSection = $('services');
  const servicesEmpty = $('services-empty');
  const cards = Array.from(document.querySelectorAll('#service-cards .card'));
  let hasScrolledToServices = false;

  const applyFilter = () => {
    const query = searchInput.value.trim();
    let shown = 0;

    cards.forEach((card) => {
      const match = !query || card.dataset.service.includes(query);
      card.hidden = !match;
      if (match) shown += 1;
    });

    servicesEmpty.hidden = shown !== 0;

    if (query && !hasScrolledToServices) {
      hasScrolledToServices = true;
      servicesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const setSearchOpen = (open) => {
    searchBar.hidden = !open;
    searchToggle.setAttribute('aria-expanded', String(open));
    if (open) {
      searchInput.focus();
    } else {
      searchInput.value = '';
      hasScrolledToServices = false;
      applyFilter();
    }
  };

  searchToggle.addEventListener('click', () => setSearchOpen(searchBar.hidden));
  searchInput.addEventListener('input', applyFilter);
  searchClear.addEventListener('click', () => {
    searchInput.value = '';
    hasScrolledToServices = false;
    applyFilter();
    searchInput.focus();
  });
  $('services-reset').addEventListener('click', () => {
    searchInput.value = '';
    hasScrolledToServices = false;
    applyFilter();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !searchBar.hidden) setSearchOpen(false);
  });

  // ── Booking form ───────────────────────────────────────────
  const bookingForm = $('booking-form');
  const bookingNote = $('booking-note');

  bookingForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const name = $('booking-name').value.trim();
    // A Persian keyboard types Persian digits (۰-۹), so fold those to 0-9 first.
    const phone = $('booking-phone').value
      .replace(/[\u06F0-\u06F9]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0))
      .replace(/[\u0660-\u0669]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
      .replace(/\D/g, '');
    const date = $('booking-date').value;
    const service = $('booking-service').value;

    if (!name || phone.length < 6) {
      bookingNote.classList.add('is-error');
      bookingNote.textContent = 'لطفاً نام و یک شمارهٔ تماس معتبر وارد کنید.';
      return;
    }

    bookingNote.classList.remove('is-error');
    bookingNote.textContent =
      'ممنون، ' + name + '! درخواست «' + service + '» شما' +
      (date ? ' برای ' + date : '') + ' ثبت شد — پذیرش برای تأیید نوبت با شما تماس می‌گیرد.';
    bookingForm.reset();
  });

  // ── Testimonials ───────────────────────────────────────────
  const testimonial = $('testimonial');
  const quoteText = $('testimonial-quote');
  const quoteAuthor = $('testimonial-author');
  const quotes = [
    { text: 'تیم کلینیک مراجعهٔ من را خیلی ساده و راحت کرد. حتماً پیشنهاد می‌کنم!', author: 'سارا رضایی' },
    { text: 'هر مرحله پیش از انجام کامل توضیح داده شد و خودِ درمان هم بدون هیچ دردی بود.', author: 'دانیال مرادی' },
    { text: 'بچه‌هایم مضطرب بودند و تیم با حوصلهٔ تمام با آن‌ها رفتار کرد. کلینیک فوق‌العاده‌ای است.', author: 'مینا احمدی' },
  ];
  let quoteIndex = 0;

  const showQuote = (next) => {
    quoteIndex = (next + quotes.length) % quotes.length;
    testimonial.classList.add('is-swapping');
    window.setTimeout(() => {
      quoteText.textContent = quotes[quoteIndex].text;
      quoteAuthor.textContent = quotes[quoteIndex].author;
      testimonial.classList.remove('is-swapping');
    }, 180);
  };

  $('testimonial-prev').addEventListener('click', () => showQuote(quoteIndex - 1));
  $('testimonial-next').addEventListener('click', () => showQuote(quoteIndex + 1));

  // ── Expandable 3D stage ────────────────────────────────────
  const stage = $('stage');
  const stageExpand = $('stage-expand');
  const stageClose = $('stage-close');

  const setExpanded = (expanded) => {
    stage.classList.toggle('is-expanded', expanded);
    document.body.classList.toggle('is-locked', expanded);
    (expanded ? stageClose : stageExpand).focus();
  };

  stageExpand.addEventListener('click', () => setExpanded(true));
  stageClose.addEventListener('click', () => setExpanded(false));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && stage.classList.contains('is-expanded')) setExpanded(false);
  });

  // ── If the WebGL scene never starts (no WebGL, blocked CDN), show the
  //    flat illustration instead of an empty panel.
  window.setTimeout(() => {
    if (!stage.classList.contains('is-ready')) stage.classList.add('is-fallback');
  }, 6000);

  // ── Footer year ────────────────────────────────────────────
  $('footer-year').textContent = '۱۴۰۴';
})();
