import React, { useEffect, useRef, useState } from 'react';
import './App.css';

/* ═══════════════════════════════════════════
   CURSOR
═══════════════════════════════════════════ */
function Cursor() {
  const dot = useRef(null);
  const ring = useRef(null);
  const pos = useRef({ x: -100, y: -100 });
  const ringPos = useRef({ x: -100, y: -100 });
  const hovered = useRef(false);

  useEffect(() => {
    const onMove = (e) => {
      pos.current = { x: e.clientX, y: e.clientY };
      if (dot.current) {
        dot.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      }
    };
    const onEnter = () => { hovered.current = true; ring.current?.classList.add('cursor-ring--hovered'); };
    const onLeave = () => { hovered.current = false; ring.current?.classList.remove('cursor-ring--hovered'); };

    window.addEventListener('mousemove', onMove);
    document.querySelectorAll('a, button').forEach(el => { el.addEventListener('mouseenter', onEnter); el.addEventListener('mouseleave', onLeave); });

    let raf;
    const tick = () => {
      ringPos.current.x += (pos.current.x - ringPos.current.x) * 0.13;
      ringPos.current.y += (pos.current.y - ringPos.current.y) * 0.13;
      if (ring.current) {
        ring.current.style.transform = `translate(${ringPos.current.x}px, ${ringPos.current.y}px)`;
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => { window.removeEventListener('mousemove', onMove); cancelAnimationFrame(raf); };
  }, []);

  return (
    <>
      <div ref={dot} className="cursor-dot" />
      <div ref={ring} className="cursor-ring" />
    </>
  );
}

/* ═══════════════════════════════════════════
   BACKGROUND CANVAS
═══════════════════════════════════════════ */
function Background() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let W, H, frame = 0;
    const particles = Array.from({ length: 60 }, (_, i) => ({
      x: Math.random(), y: Math.random(),
      vx: (Math.random() - 0.5) * 0.0003,
      vy: (Math.random() - 0.5) * 0.0003,
      size: 0.8 + Math.random() * 1.5,
      hue: Math.random() > 0.5 ? 'accent' : 'purple',
    }));

    const resize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      frame++;

      // Perspective grid floor
      const gy = H * 0.6;
      ctx.strokeStyle = 'rgba(124,92,191,0.08)';
      ctx.lineWidth = 1;
      for (let y = gy; y < H; y += 40) {
        const p = (y - gy) / (H - gy);
        const spread = p * W * 0.8;
        ctx.beginPath();
        ctx.moveTo(W / 2 - spread, y);
        ctx.lineTo(W / 2 + spread, y);
        ctx.stroke();
      }
      for (let i = -10; i <= 10; i++) {
        ctx.beginPath();
        ctx.moveTo(W / 2, gy);
        ctx.lineTo(W / 2 + i * (W / 10), H);
        ctx.stroke();
      }

      // Floating particles
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = 1; if (p.x > 1) p.x = 0;
        if (p.y < 0) p.y = 1; if (p.y > 1) p.y = 0;

        const alpha = 0.25 + Math.sin(frame * 0.015 + p.x * 10) * 0.15;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.hue === 'accent' ? '#00f5c4' : '#7c5cbf';
        ctx.beginPath();
        ctx.arc(p.x * W, p.y * H, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      requestAnimationFrame(draw);
    };
    draw();
    return () => window.removeEventListener('resize', resize);
  }, []);

  return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', opacity: 0.9 }} />;
}

/* ═══════════════════════════════════════════
   NAVBAR
═══════════════════════════════════════════ */
const NAV_LINKS = ['home', 'about', 'skills', 'projects', 'experience', 'contact'];

function Navbar({ active }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const s = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', s);
    return () => window.removeEventListener('scroll', s);
  }, []);

  const go = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setOpen(false);
  };

  return (
    <nav className={`nav${scrolled ? ' nav--scrolled' : ''}`}>
      <div className="nav__logo">
        <span className="nav__logo-bracket">[</span> AO <span className="nav__logo-bracket">]</span>
      </div>
      <ul className={`nav__links${open ? ' open' : ''}`}>
        {NAV_LINKS.map(id => (
          <li key={id}>
            <button className={`nav__link${active === id ? ' active' : ''}`} onClick={() => go(id)}>
              {id.charAt(0).toUpperCase() + id.slice(1)}
            </button>
          </li>
        ))}
      </ul>
      <button className="nav__burger" onClick={() => setOpen(o => !o)} aria-label="Menu">
        <span style={{ transform: open ? 'rotate(45deg) translateY(7px)' : 'none' }} />
        <span style={{ opacity: open ? 0 : 1 }} />
        <span style={{ transform: open ? 'rotate(-45deg) translateY(-7px)' : 'none' }} />
      </button>
    </nav>
  );
}

/* ═══════════════════════════════════════════
   HERO
═══════════════════════════════════════════ */
function Hero() {
  const heroRef = useRef(null);
  const [typed, setTyped] = useState('');
  const tiRef = useRef({ idx: 0, ch: 0, del: false, t: null });

  // Parallax tilt
  useEffect(() => {
    const onMove = (e) => {
      if (!heroRef.current) return;
      const rx = ((e.clientY / window.innerHeight) - 0.5) * -4;
      const ry = ((e.clientX / window.innerWidth) - 0.5) * 6;
      heroRef.current.style.setProperty('--rx', rx + 'deg');
      heroRef.current.style.setProperty('--ry', ry + 'deg');
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  // Typewriter
  useEffect(() => {
    const TITLES = ['Software Engineer', 'IT Professional', 'API Developer', 'Systems Builder'];
    const timerRef = tiRef.current;

    const tick = () => {
      const word = TITLES[timerRef.idx];

      if (!timerRef.del) {
        const next = word.slice(0, timerRef.ch + 1);
        setTyped(next);
        timerRef.ch += 1;

        if (timerRef.ch === word.length) {
          timerRef.del = true;
          timerRef.t = setTimeout(tick, 2000);
          return;
        }
      } else {
        const next = word.slice(0, timerRef.ch - 1);
        setTyped(next);
        timerRef.ch -= 1;

        if (timerRef.ch === 0) {
          timerRef.del = false;
          timerRef.idx = (timerRef.idx + 1) % TITLES.length;
        }
      }

      timerRef.t = setTimeout(tick, timerRef.del ? 40 : 80);
    };

    timerRef.t = setTimeout(tick, 600);

    return () => {
      if (timerRef.t) clearTimeout(timerRef.t);
    };
  }, []);

  return (
    <section id="home" style={{ position: 'relative', zIndex: 1 }}>
      <main>
        <div className="hero" ref={heroRef}>
          <div className="hero__avatar">
            <img src="/allen.jpg" alt="Allen Ovoderoye" />
          </div>
          <div className="hero__tag">
            <span className="dot" />
            <span>Available for new projects</span>
          </div>

          <div className="hero__name-wrap">
            <h1 className="hero__name">
              <span className="hero__first">ALLEN</span>
              <span className="hero__last" data-text="OVODEROYE">OVODEROYE</span>
            </h1>
            <div className="hero__badge">
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--accent)' }}>
                &gt;_ {typed}<span className="blink-cursor">|</span>
              </span>
            </div>
          </div>

          <p className="hero__bio">
            Building secure, efficient systems and beautiful interfaces from{' '}
            <span style={{ color: 'var(--text)' }}>Yenagoa, Nigeria.</span>{' '}
            Specialising in backend APIs, biometric auth integrations, and WordPress platforms.
          </p>

          <div className="hero__cta">
            <button className="btn btn--primary btn--large"
              onClick={() => document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' })}>
              View Projects →
            </button>
            <button className="btn btn--ghost btn--large"
              onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}>
              Get in Touch
            </button>
          </div>

          <div className="hero__stats">
            {[{ n: '5+', l: 'Years Experience' }, { n: '10+', l: 'Projects Shipped' }, { n: '3', l: 'Languages Spoken' }].map(s => (
              <div key={s.l}>
                <span className="stat__num">{s.n}</span>
                <span className="stat__label">{s.l}</span>
              </div>
            ))}
          </div>

          <div className="hero__scroll">
            <span>Scroll</span>
            <div className="hero__scroll-line" />
          </div>
        </div>
      </main>
      <style>{`.blink-cursor{animation:blink 1s step-end infinite} @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}`}</style>
    </section>
  );
}

/* ═══════════════════════════════════════════
   REVEAL HOOK
═══════════════════════════════════════════ */
function useReveal(delay = 0) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transitionDelay = delay + 'ms';
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { el.classList.add('revealed'); obs.disconnect(); }
    }, { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [delay]);
  return ref;
}

/* ═══════════════════════════════════════════
   ABOUT
═══════════════════════════════════════════ */
function About() {
  const ref1 = useReveal(0);
  const ref2 = useReveal(100);

  return (
    <section id="about" style={{ position: 'relative', zIndex: 1 }}>
      <main>
        <div className="section" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5rem', alignItems: 'center' }}>

          {/* Orbital avatar */}
          <div ref={ref1} className="reveal" style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
            <div style={{ position: 'relative', width: 280, height: 280 }}>
              {/* Glow */}
              <div style={{ position: 'absolute', inset: -40, background: 'radial-gradient(circle, rgba(0,245,196,0.12) 0%, transparent 70%)', borderRadius: '50%' }} />
              {/* Orbits */}
              {[{ size: 280, dur: '10s', color: 'var(--accent)', delay: '0s' },
                { size: 210, dur: '7s', color: 'var(--accent2)', delay: '-3s' },
                { size: 140, dur: '4s', color: 'var(--accent3)', delay: '-1s' }].map((o, i) => (
                  <div key={i} style={{
                    position: 'absolute',
                    top: '50%', left: '50%',
                    width: o.size, height: o.size,
                    marginTop: -o.size / 2, marginLeft: -o.size / 2,
                    border: `1px solid ${o.color}`,
                    borderRadius: '50%',
                    opacity: 0.4 - i * 0.08,
                    animation: `spin ${o.dur} linear infinite`,
                    animationDelay: o.delay,
                  }} />
              ))}
              {/* Center */}
              <div style={{
                position: 'absolute', inset: 0,
                background: 'var(--surface)',
                border: '1px solid rgba(0,245,196,0.25)',
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexDirection: 'column', gap: 4,
              }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '2.8rem', letterSpacing: '0.05em', color: 'var(--text)' }}>AO</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--muted)', letterSpacing: '0.2em' }}>DEV</span>
              </div>
            </div>

            {/* Stat grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', width: '100%', maxWidth: 320 }}>
              {[{ n: 'B.Sc', l: 'Computer Science' }, { n: '2023', l: 'Graduated' }, { n: 'NG', l: 'Based in Nigeria' }, { n: 'EN/ES', l: 'Bilingual+' }].map(s => (
                <div key={s.l} style={{
                  padding: '1.2rem 1rem', background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 12, textAlign: 'center',
                }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--accent)', letterSpacing: '0.05em' }}>{s.n}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--muted)', letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: 4 }}>{s.l}</div>
                </div>
              ))}
            </div>
            <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
          </div>

          {/* Text */}
          <div ref={ref2} className="reveal">
            <div className="section__header">
              <span className="section__tag">01 — Who I Am</span>
              <h2 className="section__title">Building things that<br /><em style={{ fontFamily: 'var(--font-serif)', color: 'var(--accent)' }}>actually work.</em></h2>
            </div>

            <p style={{ color: 'var(--muted)', lineHeight: 1.9, marginBottom: '1.2rem', fontSize: '0.95rem' }}>
              I'm a dedicated and versatile <span style={{ color: 'var(--text)' }}>Software Engineer and IT Professional</span> with hands-on experience across software development, networking, WordPress/CMS management, and educational technology systems.
            </p>
            <p style={{ color: 'var(--muted)', lineHeight: 1.9, marginBottom: '1.2rem', fontSize: '0.95rem' }}>
              I supported ICT operations at <span style={{ color: 'var(--accent)' }}>Federal University Otuoke</span>, handling system installation, configuration, testing, and user training for hundreds of staff and students.
            </p>
            <p style={{ color: 'var(--muted)', lineHeight: 1.9, marginBottom: '2rem', fontSize: '0.95rem' }}>
              I'm especially drawn to <span style={{ color: 'var(--accent3)' }}>secure authentication workflows</span>, fingerprint hardware integration, and platforms that connect people reliably.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {['English (Fluent)', 'Urhobo (Fluent)', 'Spanish (Intermediate)', 'Football ⚽', 'Logic & Research'].map(t => (
                <span key={t} className="pill">{t}</span>
              ))}
            </div>
          </div>
        </div>
      </main>
    </section>
  );
}

/* ═══════════════════════════════════════════
   SKILLS
═══════════════════════════════════════════ */
const SKILL_DATA = [
  { cat: 'Frontend', items: ['HTML', 'CSS', 'JavaScript', 'React.js', 'Responsive Design'] },
  { cat: 'Backend & APIs', items: ['Python', 'PHP', 'REST APIs', 'Secure Auth', 'MySQL', 'Fingerprint SDK'] },
  { cat: 'CMS & WordPress', items: ['WordPress', 'Theme Dev', 'Plugin Config', 'Content Mgmt', 'Performance Tuning'] },
  { cat: 'Networking & IT', items: ['IP Protocols', 'DHCP', 'Hardware Setup', 'Troubleshooting', 'System Admin'] },
  { cat: 'Tools & DevOps', items: ['Git / GitHub', 'ngrok', 'Agile', 'Technical Docs', 'Testing & QA'] },
  { cat: 'Soft Skills', items: ['Problem Solving', 'User Training', 'Team Lead', 'Logical Reasoning', 'Documentation'] },
];

function Skills() {
  return (
    <section id="skills" style={{ position: 'relative', zIndex: 1, background: 'rgba(0,0,0,0.3)' }}>
      <main>
        <div className="section">
          <div className="section__header reveal" ref={useReveal()}>
            <span className="section__tag">02 — Capabilities</span>
            <h2 className="section__title">What I Bring<br /><em style={{ fontFamily: 'var(--font-serif)', color: 'var(--accent2)' }}>to the table.</em></h2>
          </div>
          <div className="skills__grid">
            {SKILL_DATA.map((s, i) => {
              const ref = useReveal(i * 80); // eslint-disable-line
              return (
                <div key={s.cat} ref={ref} className="skill-card reveal" style={{ '--delay': i * 80 + 'ms' }}>
                  <div className="skill-card__cat">{s.cat}</div>
                  <ul className="skill-card__items">
                    {s.items.map(item => <li key={item} className="pill">{item}</li>)}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </section>
  );
}

/* ═══════════════════════════════════════════
   PROJECTS
═══════════════════════════════════════════ */
const PROJECTS = [
  { tag: 'API · Security', title: 'Secure Microblogging API', desc: 'Developer-focused API with secure auth workflows, structured endpoints, and rate limiting. Clean architecture, production-grade.', accent: '#00f5c4' },
  { tag: 'Hardware · Python', title: 'Biometric Auth System', desc: 'Bridged fingerprint scanner hardware with a Python backend for secure user identification — hardware meets software.', accent: '#7c5cbf' },
  { tag: 'IoT · Safety', title: 'LPG Gas Monitor', desc: 'Real-time sensor monitoring for gas leak detection with safety alerts and a gas supply booking layer.', accent: '#ff6b35' },
  { tag: 'ML · Healthcare', title: 'Disease Diagnosis (RF)', desc: 'Random Forest classifier accepting symptom inputs to return data-driven diagnostic probabilities for common conditions.', accent: '#00f5c4' },
  { tag: 'Edtech · Accessibility', title: 'Speech-to-Text Classroom', desc: 'Live lecture audio to on-screen text for hearing-impaired students — making education accessible for everyone.', accent: '#7c5cbf' },
  { tag: 'NLP · Culture', title: 'Ijaw Language Translator', desc: 'English-to-Ijaw translation system tackling an underserved indigenous language using rule-based and data approaches.', accent: '#ff6b35' },
];

function Projects() {
  const [hov, setHov] = useState(null);

  return (
    <section id="projects" style={{ position: 'relative', zIndex: 1 }}>
      <main>
        <div className="section">
          <div className="section__header reveal" ref={useReveal()}>
            <span className="section__tag">03 — Featured Work</span>
            <h2 className="section__title">Things I've<br /><em style={{ fontFamily: 'var(--font-serif)', color: 'var(--accent3)' }}>built & shipped.</em></h2>
          </div>
          <div className="proj__grid">
            {PROJECTS.map((p, i) => {
              const ref = useReveal(i * 70); // eslint-disable-line
              return (
                <div key={p.title} ref={ref}
                  className={`proj-card reveal${hov === i ? ' proj-card--hovered' : ''}`}
                  style={{ '--delay': i * 70 + 'ms', '--accent-c': p.accent }}
                  onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)}>
                  <div className="proj-card__glow" />
                  <div>
                    <span className="proj-card__tag">{p.tag}</span>
                    <h3 className="proj-card__title">{p.title}</h3>
                    <p className="proj-card__desc">{p.desc}</p>
                  </div>
                  <div className="proj-card__footer">
                    <span className="proj-card__arrow">→</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </section>
  );
}

/* ═══════════════════════════════════════════
   EXPERIENCE
═══════════════════════════════════════════ */
const EXP = [
  {
    org: 'Federal University Otuoke',
    role: 'Network Technician',
    period: 'Jun 2022 – Oct 2024',
    desc: 'Supported university ICT operations. Installed and maintained systems for academic and administrative work. Trained staff and students, coordinated system testing, validation, and upgrades. Supervised junior IT personnel.',
  },
  {
    org: 'Federal University Otuoke',
    role: 'WordPress Developer & IT Support',
    period: '2022 – 2024',
    desc: 'Designed and maintained departmental websites using WordPress. Managed content systems and trained staff on digital platforms. Diagnosed hardware/software issues and ensured stable performance for academic operations.',
  },
  {
    org: 'Matriley.dev',
    role: 'Software Developer',
    period: 'Aug 2017',
    desc: 'Built websites using modern scripting tools and frameworks. Collaborated to resolve testing and user-feedback issues. Managed updates to keep deployed systems stable and performant.',
  },
];

function Experience() {
  const ref = useReveal();
  return (
    <section id="experience" style={{ position: 'relative', zIndex: 1, background: 'rgba(0,0,0,0.25)' }}>
      <main>
        <div className="section">
          <div className="section__header reveal" ref={useReveal()}>
            <span className="section__tag">04 — Career</span>
            <h2 className="section__title">Where I've<br /><em style={{ fontFamily: 'var(--font-serif)', color: 'var(--accent2)' }}>made impact.</em></h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5rem' }}>
            {/* Timeline */}
            <div>
              <div className="exp__timeline">
                {EXP.map((e, i) => {
                  const r = useReveal(i * 100); // eslint-disable-line
                  return (
                    <div key={i} ref={r} className="exp__item reveal" style={{ '--delay': i * 100 + 'ms' }}>
                      <div className="exp__line">
                        <div className="exp__dot" />
                      </div>
                      <div>
                        <div className="exp__meta">
                          <span className="exp__org">{e.org}</span>
                          <span className="exp__period">{e.period}</span>
                        </div>
                        <div className="exp__role">{e.role}</div>
                        <p className="exp__desc">{e.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Education */}
            <div ref={ref} className="reveal">
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', letterSpacing: '0.1em', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '1.5rem' }}>Education & Certs</h3>
              <div className="edu__block">
                <div className="edu__card">
                  <span className="edu__icon">🎓</span>
                  <div>
                    <h3>B.Sc Computer Science & Informatics</h3>
                    <p>Federal University Otuoke · 2019–2023</p>
                    <p style={{ color: 'var(--accent)', fontSize: 12, marginTop: 4 }}>Second Class Lower</p>
                  </div>
                </div>
                <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '20px 0' }} />
                <div className="edu__certs">
                  {['HTML Excellence (2021)', 'HR Management (2021)', 'PLP Academy', 'NACOSS', 'Android Dev Community', 'Full-Stack Devs United'].map(c => (
                    <span key={c} className="cert">{c}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </section>
  );
}

/* ═══════════════════════════════════════════
   CONTACT
═══════════════════════════════════════════ */
function Contact() {
  return (
    <section id="contact" style={{ position: 'relative', zIndex: 1 }}>
      <main>
        <div className="contact">
          <div className="contact__inner reveal" ref={useReveal()}>
            <span className="section__tag">05 — Let's Talk</span>
            <h2 className="contact__title">
              Got a project<br />
              <span className="italic">in mind?</span>
            </h2>
            <p className="contact__sub">
              I'm open to freelance work, full-time roles, and interesting collaborations.
              Whether you need a backend API, a WordPress site, or a full-stack solution — let's build something great.
            </p>

            <div className="contact__actions">
              <a href="mailto:allenovoderoye009@gmail.com" className="btn btn--primary btn--large">
                Send Email →
              </a>
              <a href="https://linkedin.com/in/ovoderoye-allen" target="_blank" rel="noreferrer" className="btn btn--ghost btn--large">
                LinkedIn
              </a>
              <a href="https://github.com/allenovozy" target="_blank" rel="noreferrer" className="btn btn--ghost btn--large">
                GitHub
              </a>
            </div>

            <p className="contact__location">
                  09068155804
              📍 Yenagoa, Bayelsa State, Nigeria
            </p>
          </div>
        </div>
      </main>
    </section>
  );
}

/* ═══════════════════════════════════════════
   FOOTER
═══════════════════════════════════════════ */
function Footer() {
  return (
    <footer className="footer" style={{ position: 'relative', zIndex: 1 }}>
      <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--accent)', letterSpacing: '0.1em' }}>[ AO ]</span>
      <span>© {new Date().getFullYear()} Allen Ovoderoye · Built with React</span>
      <span className="footer__lang">EN · UR · ES</span>
    </footer>
  );
}

/* ═══════════════════════════════════════════
   APP ROOT
═══════════════════════════════════════════ */
export default function App() {
  const [active, setActive] = useState('home');

  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id); }),
      { threshold: 0.35 }
    );
    document.querySelectorAll('section[id]').forEach(s => obs.observe(s));
    return () => obs.disconnect();
  }, []);

  return (
    <>
      <Cursor />
      <Background />
      <Navbar active={active} />
      <Hero />
      <About />
      <Skills />
      <Projects />
      <Experience />
      <Contact />
      <Footer />
    </>
  );
}
