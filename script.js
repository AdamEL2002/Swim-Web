const ham = document.getElementById('hamburger');
const mob = document.getElementById('mobileMenu');
ham.addEventListener('click', () => {
  const open = mob.classList.toggle('open');
  ham.classList.toggle('open', open);
  ham.setAttribute('aria-expanded', open);
  mob.setAttribute('aria-hidden', !open);
  document.body.style.overflow = open ? 'hidden' : '';
});
mob.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    mob.classList.remove('open');
    ham.classList.remove('open');
    ham.setAttribute('aria-expanded', 'false');
    mob.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  });
});

document.querySelectorAll('.faq-q').forEach(btn => {
  btn.addEventListener('click', () => {
    const expanded = btn.getAttribute('aria-expanded') === 'true';
    document.querySelectorAll('.faq-q').forEach(b => {
      b.setAttribute('aria-expanded', 'false');
      b.closest('.faq-item').querySelector('.faq-a').style.maxHeight = null;
    });
    if (!expanded) {
      btn.setAttribute('aria-expanded', 'true');
      const answer = btn.closest('.faq-item').querySelector('.faq-a');
      answer.style.maxHeight = answer.scrollHeight + 'px';
    }
  });
});

window.addEventListener('scroll', () => {
  document.querySelector('nav').style.boxShadow =
    window.scrollY > 20 ? '0 2px 24px rgba(0,0,0,0.3)' : 'none';
});

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      entry.target.style.transitionDelay = (i * 0.04) + 's';
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.rv').forEach(el => observer.observe(el));
