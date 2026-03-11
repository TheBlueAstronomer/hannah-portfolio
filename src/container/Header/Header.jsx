import React, { useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { gsap } from 'gsap';
import { ArrowDownRight, Pen } from 'lucide-react';
import profileImg from '../../assets/profileCard.png';
import { useSiteSettings } from '../../hooks/useDirectus';

// ─── Fallback content (used when Directus is offline) ─────────────────────────

const FALLBACK = {
  descriptor: "Freelance writer and film critic with a history of working in the publishing industry. I don't just report what happened — I uncover why it matters.",
  stats: [
    { value: '7+', label: 'Years Writing' },
    { value: '200+', label: 'Articles Published' },
    { value: '14', label: 'Publications' },
  ],
};

export default function Hero() {
  const sectionRef = useRef(null);
  const portraitRef = useRef(null);
  const textRefs = useRef([]);
  const collectedRefs = useRef([]);

  const location = useLocation();
  const isHome = location.pathname === '/';
  const anchor = (hash) => isHome ? hash : `/${hash}`;

  const { settings } = useSiteSettings();

  const descriptor = settings?.hero_descriptor || FALLBACK.descriptor;
  const stats = [
    { value: settings?.hero_stat_years || FALLBACK.stats[0].value, label: 'Years Writing' },
    { value: settings?.hero_stat_articles || FALLBACK.stats[1].value, label: 'Articles Published' },
    { value: settings?.hero_stat_publications || FALLBACK.stats[2].value, label: 'Publications' },
  ];

  const addToTextRefs = (el) => {
    if (el && !collectedRefs.current.includes(el)) {
      collectedRefs.current.push(el);
      textRefs.current = collectedRefs.current;
    }
  };

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Staggered fade-up for text elements
      gsap.fromTo(
        textRefs.current,
        { opacity: 0, y: 48 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: 'power3.out',
          stagger: 0.14,
          delay: 0.3,
        }
      );

      // Portrait fade-in
      gsap.fromTo(
        portraitRef.current,
        { opacity: 0, scale: 1.04 },
        { opacity: 1, scale: 1, duration: 1.2, ease: 'power3.out', delay: 0.6 }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    const portrait = portraitRef.current;
    if (!section || !portrait) return;

    const quickX = gsap.quickSetter(portrait, 'x', 'px');
    const quickY = gsap.quickSetter(portrait, 'y', 'px');

    const onMouseMove = (e) => {
      const { left, top, width, height } = section.getBoundingClientRect();
      const xRel = (e.clientX - left - width / 2) / (width / 2);
      const yRel = (e.clientY - top - height / 2) / (height / 2);
      quickX(xRel * 14);
      quickY(yRel * 10);
    };

    const onMouseLeave = () => {
      gsap.to(portrait, { x: 0, y: 0, duration: 0.8, ease: 'power3.out' });
    };

    section.addEventListener('mousemove', onMouseMove);
    section.addEventListener('mouseleave', onMouseLeave);
    return () => {
      section.removeEventListener('mousemove', onMouseMove);
      section.removeEventListener('mouseleave', onMouseLeave);
    };
  }, []);

  return (
    <section
      id="home"
      ref={sectionRef}
      className="relative h-[100dvh] w-full overflow-hidden"
      aria-label="Hero — Hannah Abraham"
      style={{ backgroundColor: 'var(--color-bg-primary)' }}
    >
      {/* Right warm-white panel */}
      <div
        className="hero-panel absolute top-0 right-0 h-full pointer-events-none"
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          borderLeft: '1px solid rgba(26,26,26,0.1)',
          zIndex: 0,
        }}
        aria-hidden="true"
      />

      {/* Dotted grid overlay on right panel */}
      <div
        className="hero-panel absolute top-0 right-0 h-full pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(26,26,26,0.12) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
          zIndex: 1,
        }}
        aria-hidden="true"
      />

      {/* Gold accent bar — editorial device top-left */}
      <div
        className="absolute top-0 left-0 w-[3px] h-full pointer-events-none"
        style={{ backgroundColor: 'var(--color-gold)', zIndex: 20 }}
        aria-hidden="true"
      />

      {/* Portrait */}
      <div
        ref={portraitRef}
        className="hero-portrait absolute bottom-0 select-none pointer-events-none"
        style={{ willChange: 'transform' }}
        aria-hidden="true"
      >
        <img
          src={profileImg}
          alt="Hannah Abraham — Entertainment Journalist"
          className="hero-portrait-img w-auto block"
          style={{ maxWidth: 'none' }}
          draggable="false"
        />
      </div>

      {/* Text content */}
      <div className="relative z-10 h-full w-full max-w-[1400px] mx-auto px-8 md:px-12 flex items-center">
        <div className="flex flex-col justify-center gap-5 md:gap-7 pt-20 pb-10 w-[58%] md:w-[52%]">

          {/* Category stamp */}
          <div ref={addToTextRefs} className="flex items-center gap-3">
            <span
              className="tag-gold"
              style={{ transform: 'translateY(-1px)' }}
            >
              Entertainment Journalist
            </span>
          </div>

          {/* Primary name */}
          <div ref={addToTextRefs}>
            <h1
              className="font-serif font-bold leading-[0.88] tracking-tight"
              style={{
                fontSize: 'clamp(3.4rem, 10vw, 9.5rem)',
                color: 'var(--color-charcoal)',
                letterSpacing: '-0.03em',
              }}
            >
              Hannah
            </h1>
            <span
              className="font-ui font-semibold tracking-[0.28em] md:tracking-[0.36em] uppercase"
              style={{
                fontSize: 'clamp(0.6rem, 1.5vw, 0.85rem)',
                color: 'var(--color-text-secondary)',
                display: 'block',
                marginTop: '0.4rem',
              }}
            >
              Abraham
            </span>
          </div>

          {/* Thin black rule */}
          <div
            ref={addToTextRefs}
            className="w-12 h-px"
            style={{ backgroundColor: 'var(--color-charcoal)', opacity: 0.2 }}
            aria-hidden="true"
          />

          {/* Descriptor */}
          <p
            ref={addToTextRefs}
            className="font-sans text-sm md:text-base leading-relaxed max-w-[32ch] md:max-w-[42ch]"
            style={{ color: 'var(--color-text-secondary)', fontWeight: 300 }}
          >
            {descriptor}
          </p>

          {/* Stats row */}
          <div ref={addToTextRefs} className="flex items-start flex-nowrap gap-x-6 md:gap-x-10 mt-1 pr-2">
            {stats.map(({ value, label }) => (
              <div key={label} className="flex flex-col gap-1 shrink-0">
                <span
                  className="font-serif font-bold leading-none"
                  style={{
                    fontSize: 'clamp(1.4rem, 5vw, 2rem)',
                    color: 'var(--color-charcoal)',
                  }}
                >
                  {value}
                </span>
                <span
                  className="font-ui uppercase"
                  style={{
                    fontSize: '0.55rem',
                    letterSpacing: '0.12em',
                    fontWeight: 600,
                    color: 'var(--color-text-secondary)',
                    opacity: 0.7,
                  }}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* CTA buttons */}
          <div ref={addToTextRefs} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-1">
            <a
              href={anchor('#work')}
              className="group relative flex items-center justify-center gap-2 font-ui text-[10px] md:text-xs font-semibold uppercase tracking-[0.1em] px-6 md:px-8 py-3 md:py-3.5 overflow-hidden transition-all duration-250 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                backgroundColor: 'var(--color-charcoal)',
                color: '#fff',
                borderRadius: '2px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-gold)';
                e.currentTarget.style.color = 'var(--color-charcoal)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-charcoal)';
                e.currentTarget.style.color = '#fff';
              }}
            >
              <Pen size={11} />
              Read my work
            </a>
            <a
              href={anchor('#contact')}
              className="group relative flex items-center justify-center gap-2 font-ui text-[10px] md:text-xs font-semibold uppercase tracking-[0.1em] px-6 md:px-8 py-3 md:py-3.5 border transition-all duration-250 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                borderColor: 'rgba(26,26,26,0.35)',
                color: 'var(--color-charcoal)',
                borderRadius: '2px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-gold)';
                e.currentTarget.style.backgroundColor = 'var(--color-gold)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(26,26,26,0.35)';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              Get in touch
              <ArrowDownRight size={11} />
            </a>
          </div>
        </div>
      </div>

      {/* Far-right vertical tracking text (desktop only) */}
      <div
        className="hidden lg:flex fixed right-0 top-1/2 z-20 items-center pr-4"
        style={{ writingMode: 'vertical-rl', transform: 'translateY(-50%) rotate(180deg)' }}
        aria-hidden="true"
      >
        <span
          className="font-ui uppercase select-none"
          style={{
            fontSize: '0.55rem',
            letterSpacing: '0.35em',
            fontWeight: 600,
            color: 'var(--color-charcoal)',
            opacity: 0.3,
          }}
        >
          Film · Culture · Journalism · 2025
        </span>
      </div>

      {/* Scroll indicator */}
      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-10"
        aria-hidden="true"
      >
        <span
          className="font-ui uppercase"
          style={{
            fontSize: '0.55rem',
            letterSpacing: '0.28em',
            fontWeight: 600,
            color: 'var(--color-charcoal)',
            opacity: 0.4,
          }}
        >
          Scroll
        </span>
        <div
          className="w-px h-10 origin-top animate-[grow_1.8s_ease-in-out_infinite]"
          style={{ backgroundColor: 'var(--color-gold)' }}
        />
      </div>
    </section>
  );
}