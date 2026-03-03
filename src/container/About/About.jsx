import React, { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useSiteSettings } from '../../hooks/useDirectus';

gsap.registerPlugin(ScrollTrigger);

// ─── Fallback content (used when Directus is offline) ─────────────────────────

const FALLBACK_LINE1 = 'Standard journalism reports what happened.';
const FALLBACK_LINE2 = 'I uncover why it matters.';
const FALLBACK_BIO =
  'After seven years covering entertainment, film festivals, and cultural shifts — I have sharpened one belief: audiences deserve more than summaries. They deserve context, nuance, and the story beneath the story.';

export default function Philosophy() {
  const sectionRef = useRef(null);
  const line1Ref = useRef(null);
  const line2Ref = useRef(null);
  const dividerRef = useRef(null);
  const metaRef = useRef(null);

  const { settings } = useSiteSettings();

  const line1 = settings?.about_line1 || FALLBACK_LINE1;
  const line2 = settings?.about_line2 || FALLBACK_LINE2;
  const bio = settings?.about_bio || FALLBACK_BIO;

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Parallax on the grain texture (subtle vertical movement)
      gsap.to('.philosophy-grain', {
        yPercent: -12,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      });

      // Word-stagger reveal for line 1
      const words1 = line1Ref.current?.querySelectorAll('.word-reveal');
      if (words1?.length) {
        gsap.fromTo(
          words1,
          { opacity: 0, y: 36, rotateX: -20 },
          {
            opacity: 1,
            y: 0,
            rotateX: 0,
            duration: 0.7,
            stagger: 0.06,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: line1Ref.current,
              start: 'top 80%',
            },
          }
        );
      }

      // Bold line 2 — sweeping reveal
      gsap.fromTo(
        line2Ref.current,
        { opacity: 0, x: -40 },
        {
          opacity: 1,
          x: 0,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: line2Ref.current,
            start: 'top 80%',
          },
        }
      );

      // Divider expansion
      gsap.fromTo(
        dividerRef.current,
        { scaleX: 0 },
        {
          scaleX: 1,
          duration: 1,
          ease: 'power3.out',
          transformOrigin: 'left center',
          scrollTrigger: {
            trigger: dividerRef.current,
            start: 'top 85%',
          },
        }
      );

      // Meta fade-up
      gsap.fromTo(
        metaRef.current,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: metaRef.current,
            start: 'top 88%',
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  // Split text into word spans for stagger
  const splitWords = (text) =>
    text.split(' ').map((word, i) => (
      <span
        key={i}
        className="word-reveal inline-block mr-[0.25em]"
        style={{ display: 'inline-block' }}
      >
        {word}
      </span>
    ));

  return (
    <section
      id="about"
      ref={sectionRef}
      className="relative overflow-hidden py-28 md:py-40 film-grain"
      style={{ backgroundColor: 'var(--color-charcoal)' }}
      aria-label="Philosophy — The Journalist's Manifesto"
    >
      {/* Film grain overlay — fixed, non-scrolling GPU layer */}
      <div
        className="philosophy-grain absolute inset-[-20%] pointer-events-none"
        aria-hidden="true"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
          opacity: 0.06,
          mixBlendMode: 'screen',
        }}
      />

      {/* Hex pattern overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='92'%3E%3Cpath d='M40 4L8 22v38l32 18 32-18V22L40 4zm0 4l28 16v34L40 74 12 58V24L40 8z' fill='none' stroke='%23C3C0D8' stroke-width='0.5'/%3E%3C/svg%3E")`,
          backgroundSize: '80px 92px',
          opacity: 0.04,
        }}
      />

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 md:px-10">
        {/* Section label */}
        <div className="flex items-center gap-4 mb-14">
          <span
            className="inline-block w-10 h-px"
            style={{ backgroundColor: 'var(--color-periwinkle)' }}
            aria-hidden="true"
          />
          <span
            className="font-jakarta text-xs uppercase tracking-[0.3em] font-semibold"
            style={{ color: 'var(--color-periwinkle)' }}
          >
            The Manifesto
          </span>
        </div>

        {/* Typography Contrast */}
        <div className="flex flex-col gap-8 md:gap-12 max-w-[900px]">
          {/* Line 1 — muted, crossed-out feel — from Directus */}
          <div ref={line1Ref} className="overflow-hidden" style={{ perspective: '600px' }}>
            <p
              className="font-jakarta font-light leading-tight"
              style={{
                fontSize: 'clamp(1.5rem, 4vw, 3rem)',
                color: 'rgba(255,255,255,0.38)',
                textDecoration: 'line-through',
                textDecorationColor: 'rgba(195,192,216,0.4)',
                textDecorationThickness: '1px',
              }}
            >
              {splitWords(line1)}
            </p>
          </div>

          {/* Divider dash */}
          <div
            ref={dividerRef}
            className="h-px w-3/4"
            style={{ backgroundColor: 'var(--color-periwinkle)', opacity: 0.35 }}
            aria-hidden="true"
          />

          {/* Line 2 — bold, Cormorant, glowing periwinkle — from Directus */}
          <div ref={line2Ref}>
            <p
              className="font-cormorant font-bold italic leading-tight"
              style={{
                fontSize: 'clamp(2.2rem, 6vw, 5rem)',
                color: 'var(--color-periwinkle)',
                textShadow: '0 0 60px rgba(195,192,216,0.25)',
              }}
            >
              {line2}
            </p>
          </div>
        </div>

        {/* Attribution / Meta — from Directus */}
        <div ref={metaRef} className="mt-20 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <p
            className="font-jakarta text-sm leading-relaxed max-w-[52ch]"
            style={{ color: 'rgba(255,255,255,0.5)' }}
          >
            {bio}
          </p>
          <div className="flex flex-col gap-1 text-right">
            <span
              className="font-cormorant text-2xl font-bold italic"
              style={{ color: 'var(--color-periwinkle)' }}
            >
              Hannah Abraham
            </span>
            <span
              className="font-jakarta text-[11px] uppercase tracking-widest"
              style={{ color: 'rgba(255,255,255,0.3)' }}
            >
              Entertainment Journalist
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}