import React, { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Star, Quote } from 'lucide-react';
import { useDirectus } from '../../hooks/useDirectus';

gsap.registerPlugin(ScrollTrigger);

// ─── Fallback content (used when Directus is offline) ─────────────────────────

const FALLBACK_REVIEWS = [
  {
    id: 1,
    quote:
      "Hannah does not merely review films — she translates them. Her analysis of the year's best cinema gave readers a framework for understanding cinema they didn't know they needed.",
    author: 'Marcus Delray',
    job_title: 'Editor-in-Chief',
    publication: 'Criterion Quarterly',
    rating: 5,
    bg_color: 'var(--color-bg-secondary)',
    accent_color: 'var(--color-gold)',
    category: 'Press Review',
    is_dark: false,
  },
  {
    id: 2,
    quote:
      'When we publish Hannah, our traffic spikes and our inbox fills. She has an extraordinary gift for identifying the cultural current before it crests. Our readers trust her completely.',
    author: 'Sophia Chen-Nakamura',
    job_title: 'Digital Director',
    publication: 'ELLE Magazine',
    rating: 5,
    bg_color: 'var(--color-charcoal)',
    accent_color: 'var(--color-gold)',
    category: 'Client Testimonial',
    is_dark: true,
  },
  {
    id: 3,
    quote:
      'In seven years of commissioning entertainment journalism, Hannah stands apart. Her interviews are unflinching, warm, and always reveal something the subject did not know they were willing to share.',
    author: 'Priya Radhakrishnan',
    job_title: 'Features Editor',
    publication: 'The Cultural Review',
    rating: 5,
    bg_color: 'var(--color-bg-primary)',
    accent_color: 'var(--color-coral)',
    category: 'Editorial Endorsement',
    is_dark: false,
  },
];

StarRating.propTypes = {
  count: PropTypes.number.isRequired,
  color: PropTypes.string.isRequired,
};

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

  const { data, loading } = useDirectus('testimonials', {
    sort: ['sort'],
    fields: ['id', 'quote', 'author', 'job_title', 'publication', 'rating', 'category', 'bg_color', 'accent_color', 'is_dark'],
  });

  // Use Directus data if available; fall back to hardcoded REVIEWS
  const reviews = (data && data.length > 0) ? data : FALLBACK_REVIEWS;

  useEffect(() => {
    if (loading) return; // wait for data before wiring GSAP

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
  }, [loading, reviews]);

  return (
    <section
      id="reviews"
      ref={wrapperRef}
      className="relative"
      aria-label="Reviews and Process"
    >
      {/* Section heading */}
      <div
        className="py-20 px-6 md:px-10 max-w-[1400px] mx-auto"
        style={{ backgroundColor: 'var(--color-bg-primary)' }}
      >
        <div className="flex items-center gap-3 mb-5">
          <span
            className="inline-block w-8 h-px"
            style={{ backgroundColor: 'var(--color-gold)' }}
            aria-hidden="true"
          />
          <span
            className="font-ui uppercase"
            style={{ fontSize: '0.6rem', letterSpacing: '0.28em', fontWeight: 600, color: 'var(--color-gold)' }}
          >
            What They Say
          </span>
        </div>
        <h2
          className="font-serif font-bold leading-tight"
          style={{
            fontSize: 'clamp(2.5rem, 6vw, 5rem)',
            color: 'var(--color-charcoal)',
            letterSpacing: '-0.02em',
          }}
        >
          Press &amp; <span className="italic font-normal">Recognition</span>
        </h2>
      </div>

      {/* Sticky stack cards */}
      {reviews.map((review, i) => (
        <div
          key={review.id}
          ref={(el) => (cardRefs.current[i] = el)}
          className="min-h-[100dvh] flex items-center justify-center px-6 md:px-10 will-change-transform"
          style={{
            backgroundColor: review.bg_color,
            position: 'relative',
            zIndex: i + 1,
          }}
          aria-label={`Review ${i + 1} of ${reviews.length}`}
        >
          <div className="w-full max-w-[900px] mx-auto py-20">
            {/* Top bar */}
            <div className="flex items-center justify-between mb-12">
              <span
                className="font-ui uppercase"
                style={{ fontSize: '0.6rem', letterSpacing: '0.28em', fontWeight: 600, color: review.is_dark ? 'rgba(248,245,240,0.5)' : 'var(--color-text-secondary)', opacity: 0.7 }}
              >
                {review.category}
              </span>
              <span
                className="font-ui uppercase"
                style={{ fontSize: '0.6rem', letterSpacing: '0.1em', fontWeight: 600, color: review.is_dark ? 'rgba(248,245,240,0.35)' : 'var(--color-text-secondary)', opacity: 0.6 }}
              >
                {String(i + 1).padStart(2, '0')} / {String(reviews.length).padStart(2, '0')}
              </span>
            </div>

            {/* Quote icon */}
            <Quote
              size={36}
              style={{ color: review.accent_color, opacity: 0.3, marginBottom: '1.5rem' }}
              aria-hidden="true"
            />

            {/* Quote text */}
            <blockquote
              className="font-serif font-medium leading-relaxed mb-10"
              style={{
                fontSize: 'clamp(1.5rem, 3.5vw, 2.5rem)',
                color: review.is_dark ? 'rgba(248,245,240,0.9)' : 'var(--color-charcoal)',
                letterSpacing: '-0.01em',
              }}
            >
              &ldquo;{review.quote}&rdquo;
            </blockquote>

            {/* Divider */}
            <div
              className="h-px w-16 mb-8"
              style={{ backgroundColor: review.accent_color, opacity: 0.4 }}
              aria-hidden="true"
            />

            {/* Attribution */}
            <footer className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex flex-col gap-1">
                <cite
                  className="font-ui not-italic"
                  style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.04em', color: review.is_dark ? '#F8F5F0' : 'var(--color-charcoal)' }}
                >
                  {review.author}
                </cite>
                <span
                  className="font-sans"
                  style={{ fontSize: '0.7rem', fontWeight: 300, color: review.is_dark ? 'rgba(248,245,240,0.45)' : 'var(--color-text-secondary)' }}
                >
                  {review.job_title} — {review.publication}
                </span>
              </div>
              <StarRating count={review.rating} color={review.accent_color} />
            </footer>
          </div>
        </div>
      ))}
    </section>
  );
}