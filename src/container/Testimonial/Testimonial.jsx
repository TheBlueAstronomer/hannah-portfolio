import React, { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Star, Quote } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const REVIEWS = [
  {
    id: 1,
    quote:
      'Hannah does not merely review films — she translates them. Her analysis of the year\'s best cinema gave readers a framework for understanding cinema they didn\'t know they needed.',
    author: 'Marcus Delray',
    title: 'Editor-in-Chief',
    publication: 'Criterion Quarterly',
    rating: 5,
    bg: '#FAFAFE',
    accent: 'var(--color-violet)',
    category: 'Press Review',
  },
  {
    id: 2,
    quote:
      'When we publish Hannah, our traffic spikes and our inbox fills. She has an extraordinary gift for identifying the cultural current before it crests. Our readers trust her completely.',
    author: 'Sophia Chen-Nakamura',
    title: 'Digital Director',
    publication: 'ELLE Magazine',
    rating: 5,
    bg: 'var(--color-charcoal)',
    accent: 'var(--color-periwinkle)',
    category: 'Client Testimonial',
    dark: true,
  },
  {
    id: 3,
    quote:
      'In seven years of commissioning entertainment journalism, Hannah stands apart. Her interviews are unflinching, warm, and always reveal something the subject did not know they were willing to share.',
    author: 'Priya Radhakrishnan',
    title: 'Features Editor',
    publication: 'The Cultural Review',
    rating: 5,
    bg: '#F0EEF8',
    accent: 'var(--color-violet)',
    category: 'Editorial Endorsement',
  },
];

function StarRating({ count, color }) {
  return (
    <div className="flex gap-1" aria-label={`${count} out of 5 stars`}>
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} size={12} fill={color} style={{ color }} />
      ))}
    </div>
  );
}

export default function Reviews() {
  const wrapperRef = useRef(null);
  const cardRefs = useRef([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const cards = cardRefs.current.filter(Boolean);

      cards.forEach((card, i) => {
        if (i === cards.length - 1) return; // Last card doesn't shrink

        ScrollTrigger.create({
          trigger: card,
          start: 'top top',
          end: `+=${window.innerHeight}`,
          pin: true,
          pinSpacing: false,
          scrub: true,
        });

        // When the NEXT card comes in, shrink this one
        if (cards[i + 1]) {
          ScrollTrigger.create({
            trigger: cards[i + 1],
            start: 'top 90%',
            end: 'top top',
            scrub: true,
            onUpdate: (self) => {
              const progress = self.progress;
              gsap.set(card, {
                scale: 1 - progress * 0.1,
                filter: `blur(${progress * 20}px)`,
                opacity: 1 - progress * 0.5,
              });
            },
          });
        }
      });
    }, wrapperRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="reviews"
      ref={wrapperRef}
      className="relative"
      aria-label="Reviews and Process"
    >
      {/* Section heading - appears before the sticky cards */}
      <div
        className="py-20 px-6 md:px-10 max-w-[1400px] mx-auto"
        style={{ backgroundColor: 'var(--color-white)' }}
      >
        <span
          className="font-jakarta text-xs uppercase tracking-[0.3em] font-semibold block mb-4"
          style={{ color: 'var(--color-periwinkle)' }}
        >
          — What They Say
        </span>
        <h2
          className="font-cormorant font-bold leading-tight tracking-tight"
          style={{
            fontSize: 'clamp(2.5rem, 6vw, 5rem)',
            color: 'var(--color-violet)',
          }}
        >
          Press &amp; <span className="italic font-light">Recognition</span>
        </h2>
      </div>

      {/* Sticky stack cards */}
      {REVIEWS.map((review, i) => (
        <div
          key={review.id}
          ref={(el) => (cardRefs.current[i] = el)}
          className="min-h-[100dvh] flex items-center justify-center px-6 md:px-10 will-change-transform"
          style={{
            backgroundColor: review.bg,
            position: 'relative',
            zIndex: i + 1,
          }}
          aria-label={`Review ${i + 1} of ${REVIEWS.length}`}
        >
          <div className="w-full max-w-[900px] mx-auto py-20">
            {/* Top bar */}
            <div className="flex items-center justify-between mb-12">
              <span
                className="font-jakarta text-[10px] uppercase tracking-[0.3em] font-semibold"
                style={{ color: review.dark ? 'rgba(195,192,216,0.7)' : 'var(--color-gray-mid)' }}
              >
                {review.category}
              </span>
              <span
                className="font-jakarta text-[10px] uppercase tracking-widest"
                style={{ color: review.dark ? 'rgba(195,192,216,0.5)' : 'var(--color-gray-mid)' }}
              >
                {String(i + 1).padStart(2, '0')} / {String(REVIEWS.length).padStart(2, '0')}
              </span>
            </div>

            {/* Quote icon */}
            <Quote
              size={36}
              style={{ color: review.accent, opacity: 0.3, marginBottom: '1.5rem' }}
              aria-hidden="true"
            />

            {/* Quote text */}
            <blockquote
              className="font-cormorant font-medium leading-relaxed mb-10"
              style={{
                fontSize: 'clamp(1.5rem, 3.5vw, 2.5rem)',
                color: review.dark ? 'rgba(255,255,255,0.9)' : 'var(--color-charcoal)',
              }}
            >
              &ldquo;{review.quote}&rdquo;
            </blockquote>

            {/* Divider */}
            <div
              className="h-px w-16 mb-8"
              style={{ backgroundColor: review.accent, opacity: 0.4 }}
              aria-hidden="true"
            />

            {/* Attribution */}
            <footer className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex flex-col gap-1">
                <cite
                  className="font-jakarta font-semibold not-italic text-sm"
                  style={{ color: review.dark ? '#fff' : 'var(--color-charcoal)' }}
                >
                  {review.author}
                </cite>
                <span
                  className="font-jakarta text-xs"
                  style={{ color: review.dark ? 'rgba(255,255,255,0.5)' : 'var(--color-gray-mid)' }}
                >
                  {review.title} — {review.publication}
                </span>
              </div>
              <StarRating count={review.rating} color={review.accent} />
            </footer>
          </div>
        </div>
      ))}
    </section>
  );
}