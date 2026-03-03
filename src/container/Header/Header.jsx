import React, { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ArrowDownRight, Pen } from 'lucide-react';
import profileImg from '../../assets/headshots/by8a4305.png';
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
  textRefs.current = [];

  const { settings } = useSiteSettings();

  const descriptor = settings?.hero_descriptor || FALLBACK.descriptor;
  const stats = [
    { value: settings?.hero_stat_years || FALLBACK.stats[0].value, label: 'Years Writing' },
    { value: settings?.hero_stat_articles || FALLBACK.stats[1].value, label: 'Articles Published' },
    { value: settings?.hero_stat_publications || FALLBACK.stats[2].value, label: 'Publications' },
  ];

  const addToTextRefs = (el) => {
    if (el && !textRefs.current.includes(el)) {
      textRefs.current.push(el);
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
    >
      {/* Full-bleed right periwinkle panel */}
      <div
        className="absolute top-0 right-0 h-full pointer-events-none"
        style={{
          width: '48%',
          backgroundColor: 'var(--color-periwinkle)',
          opacity: 0.55,
          zIndex: 0,
        }}
        aria-hidden="true"
      />

      {/* Portrait — absolutely positioned so body straddles the column seam */}
      <div
        ref={portraitRef}
        className="absolute bottom-0 select-none pointer-events-none"
        style={{
          left: '45%',
          zIndex: 5,
          willChange: 'transform',
        }}
        aria-hidden="true"
      >
        <img
          src={profileImg}
          alt="Hannah Abraham — Entertainment Journalist"
          className="w-auto block"
          style={{
            height: '96dvh',
            maxWidth: 'none',
            objectFit: 'contain',
            objectPosition: 'bottom left',
          }}
          draggable="false"
        />
      </div>

      {/* Text content — single column, padded right to not overlap portrait body */}
      <div className="relative z-10 h-full w-full max-w-[1400px] mx-auto px-6 md:px-10 flex items-center">
        <div className="flex flex-col justify-center gap-6 pt-20 pb-10 w-full md:w-[52%]">

          {/* Category label */}
          <div ref={addToTextRefs} className="flex items-center gap-3">
            <span
              className="inline-block w-8 h-px"
              style={{ backgroundColor: 'var(--color-violet)' }}
              aria-hidden="true"
            />
            <span
              className="font-jakarta text-xs uppercase tracking-[0.28em] font-semibold"
              style={{ color: 'var(--color-violet)' }}
            >
              Entertainment Journalist
            </span>
          </div>

          {/* Primary name — Cormorant Garamond bold serif */}
          <div ref={addToTextRefs}>
            <h1
              className="font-cormorant font-bold leading-[0.88] tracking-tight"
              style={{
                fontSize: 'clamp(5rem, 11vw, 9.5rem)',
                color: 'var(--color-violet)',
              }}
            >
              Hannah
            </h1>
            <span
              className="font-jakarta font-light tracking-[0.32em] uppercase text-sm md:text-base"
              style={{ color: 'var(--color-charcoal)' }}
            >
              Abraham
            </span>
          </div>

          {/* Descriptor — from Directus */}
          <p
            ref={addToTextRefs}
            className="font-jakarta text-base md:text-lg leading-relaxed max-w-[44ch]"
            style={{ color: 'var(--color-gray-mid)' }}
          >
            {descriptor}
          </p>

          {/* Stats row — from Directus */}
          <div ref={addToTextRefs} className="flex items-center gap-8 mt-2">
            {stats.map(({ value, label }) => (
              <div key={label} className="flex flex-col gap-0.5">
                <span
                  className="font-cormorant font-bold text-3xl leading-none"
                  style={{ color: 'var(--color-violet)' }}
                >
                  {value}
                </span>
                <span
                  className="font-jakarta text-[10px] uppercase tracking-widest font-medium"
                  style={{ color: 'var(--color-gray-mid)' }}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* CTA buttons */}
          <div ref={addToTextRefs} className="flex flex-wrap items-center gap-4 mt-2">
            <a
              href="#work"
              className="group relative flex items-center gap-2 font-jakarta text-sm font-semibold uppercase tracking-widest px-7 py-3.5 overflow-hidden rounded-sm transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                backgroundColor: 'var(--color-violet)',
                color: '#fff',
              }}
            >
              <span className="relative z-10 flex items-center gap-2">
                <Pen size={13} />
                Read My Work
              </span>
            </a>
            <a
              href="#contact"
              className="group relative flex items-center gap-2 font-jakarta text-sm font-semibold uppercase tracking-widest px-7 py-3.5 overflow-hidden rounded-sm border transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                borderColor: 'var(--color-violet)',
                color: 'var(--color-violet)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-violet)';
                e.currentTarget.style.color = '#fff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--color-violet)';
              }}
            >
              Get In Touch
              <ArrowDownRight size={13} />
            </a>
          </div>
        </div>
      </div>

      {/* Far-right vertical tracking text (editorial device) */}
      <div
        className="hidden lg:flex fixed right-0 top-1/2 -translate-y-1/2 z-20 items-center pr-4"
        style={{ writingMode: 'vertical-rl', transform: 'translateY(-50%) rotate(180deg)' }}
        aria-hidden="true"
      >
        <span
          className="font-jakarta text-[10px] uppercase tracking-[0.35em] font-medium select-none"
          style={{ color: 'var(--color-periwinkle)' }}
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
          className="font-jakarta text-[10px] uppercase tracking-[0.28em]"
          style={{ color: 'var(--color-gray-mid)' }}
        >
          Scroll
        </span>
        <div
          className="w-px h-10 origin-top animate-[grow_1.8s_ease-in-out_infinite]"
          style={{ backgroundColor: 'var(--color-periwinkle)' }}
        />
      </div>
    </section>
  );
}