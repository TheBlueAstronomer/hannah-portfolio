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
      {/* Film grain overlay */}
      <div
        className="philosophy-grain absolute inset-[-20%] pointer-events-none"
        aria-hidden="true"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
          opacity: 0.05,
          mixBlendMode: 'screen',
        }}
      />

      {/* Dotted grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(223,189,56,0.12) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* Gold left accent bar */}
      <div
        className="absolute top-0 left-0 w-[3px] h-full pointer-events-none"
        style={{ backgroundColor: 'var(--color-gold)', opacity: 0.6 }}
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 md:px-10">
        {/* Section label */}
        <div className="flex items-center gap-4 mb-14">
          <span
            className="inline-block w-10 h-px"
            style={{ backgroundColor: 'var(--color-gold)', opacity: 0.6 }}
            aria-hidden="true"
          />
          <span
            className="font-ui uppercase"
            style={{ fontSize: '0.6rem', letterSpacing: '0.3em', fontWeight: 600, color: 'var(--color-gold)', opacity: 0.7 }}
          >
            The Manifesto
          </span>
        </div>

        {/* Typography Contrast */}
        <div className="flex flex-col gap-8 md:gap-12 max-w-[900px]">
          {/* Line 1 — muted, crossed-out feel */}
          <div ref={line1Ref} className="overflow-hidden" style={{ perspective: '600px' }}>
            <p
              className="font-sans font-light leading-tight"
              style={{
                fontSize: 'clamp(1.5rem, 4vw, 3rem)',
                color: 'rgba(248,245,240,0.28)',
                textDecoration: 'line-through',
                textDecorationColor: 'rgba(223,189,56,0.3)',
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
            style={{ backgroundColor: 'var(--color-gold)', opacity: 0.25 }}
            aria-hidden="true"
          />

          {/* Line 2 — bold Playfair, gold glow */}
          <div ref={line2Ref}>
            <p
              className="font-serif font-bold italic leading-tight"
              style={{
                fontSize: 'clamp(2.2rem, 6vw, 5rem)',
                color: 'var(--color-gold)',
                textShadow: '0 0 80px rgba(223,189,56,0.2)',
                letterSpacing: '-0.02em',
              }}
            >
              {line2}
            </p>
          </div>
        </div>

        {/* Attribution / Meta */}
        <div ref={metaRef} className="mt-20 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <p
            className="font-sans text-sm leading-relaxed max-w-[52ch]"
            style={{ color: 'rgba(248,245,240,0.42)', fontWeight: 300 }}
          >
            {bio}
          </p>
          <div className="flex flex-col gap-1.5 text-right">
            <span
              className="font-serif text-2xl font-bold italic"
              style={{ color: 'var(--color-gold)', opacity: 0.85 }}
            >
              Hannah Abraham
            </span>
            <span
              className="font-ui uppercase"
              style={{ fontSize: '0.6rem', letterSpacing: '0.2em', fontWeight: 600, color: 'rgba(248,245,240,0.3)' }}
            >
              Entertainment Journalist
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}