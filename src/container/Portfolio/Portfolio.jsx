import React, { useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { gsap } from 'gsap';
import { ExternalLink, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { readItems } from '@directus/sdk';
import { directus, DIRECTUS_URL } from '../../directus';

// ─── DIRECTUS QUERIES ────────────────────────────────────────────────────────

const FEATURED_QUERY = {
  filter: { is_featured: { _eq: true } },
  sort: ['sort'],
  fields: ['id', 'title', 'publication', 'category', 'date', 'url', 'card_color', 'accent_color', 'image'],
};

const HEADLINES_QUERY = {
  filter: { is_headline: { _eq: true } },
  sort: ['sort'],
  fields: ['id', 'title', 'url'],
};

// Map Directus snake_case fields → component camelCase props
function mapFeatured(item) {
  return {
    ...item,
    cardColor: item.card_color,
    accentColor: item.accent_color,
    image: item.image,
  };
}

function mapHeadline(item) {
  return { id: item.id, title: item.title, url: item.url };
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const PLACEHOLDER_COVERS = [
  {
    id: 1,
    category: 'FEATURE — FORBES',
    headline: 'BAFTA-Winning Director Lakshmipriya Devi On \'Boong\': \'Everyone Told Me Not To Make It\'',
    publication: 'Forbes',
    date: 'Feb 28, 2026',
    color: '#F8F5F0',
    accent: '#1A1A1A',
    tagType: 'gold',
    img: 'https://picsum.photos/seed/boong-bafta-director/400/520',
    url: 'https://www.forbes.com/sites/hannahabraham/2026/02/28/bafta-winning-director-lakshmipriya-devi-on-boong-everyone-told-me-not-to-make-it/',
  },
  {
    id: 2,
    category: 'INTERVIEW — DEADLINE',
    headline: '\'Mufasa\' Songwriter Lin-Manuel Miranda On Working With Barry Jenkins & Why The \'Hamilton\' Parallel Is A Myth',
    publication: 'Deadline',
    date: 'Dec 2024',
    color: '#FFFFFF',
    accent: '#1A1A1A',
    tagType: 'coral',
    img: 'https://picsum.photos/seed/lin-manuel-miranda-mufasa/400/520',
    url: 'https://deadline.com/feature/mufasa-the-lion-king-lin-manuel-miranda-interview-1236242723/',
  },
  {
    id: 3,
    category: 'LONG READ — FORBES',
    headline: 'The Very Beginning Of Outstation: Inside India\'s Most Ambitious Boyband',
    publication: 'Forbes',
    date: 'Feb 27, 2026',
    color: '#F8F5F0',
    accent: '#1A1A1A',
    tagType: 'gold',
    img: 'https://picsum.photos/seed/outstation-boyband-india/400/520',
    url: 'https://www.forbes.com/sites/hannahabraham/2026/02/27/the-very-beginning-of-outstation/',
  },
  {
    id: 4,
    category: 'ANALYSIS — FORBES',
    headline: '2026 Actor Awards Shake Up The Oscar Race: A Category-By-Category Breakdown',
    publication: 'Forbes',
    date: 'Mar 1, 2026',
    color: '#FFFFFF',
    accent: '#1A1A1A',
    tagType: 'coral',
    img: 'https://picsum.photos/seed/actor-awards-oscars-2026/400/520',
    url: 'https://www.forbes.com/sites/hannahabraham/2026/03/01/what-the-actor-awards-2026-tell-us-about-the-oscar-race-a-category-by-category-breakdown/',
  },
  {
    id: 5,
    category: 'INTERVIEW — DEADLINE',
    headline: '\'Munjya\' Star Sharvari On Finding Success In Bollywood & Her Desire To Work With Greta Gerwig',
    publication: 'Deadline',
    date: 'Jul 2024',
    color: '#F8F5F0',
    accent: '#1A1A1A',
    tagType: 'gold',
    img: 'https://picsum.photos/seed/munjya-sharvari-bollywood/400/520',
    url: 'https://deadline.com/2024/07/munjya-sharvari-bollywood-greta-gerwig-yrf-alia-bhatt-1235999575/',
  },
  {
    id: 6,
    category: 'FEATURE — BUSINESS INSIDER',
    headline: 'CJ ENM CEO On $800M Content Strategy, IP Transformation And Hollywood Ambitions',
    publication: 'Forbes',
    date: 'Feb 16, 2026',
    color: '#FFFFFF',
    accent: '#1A1A1A',
    tagType: 'coral',
    img: 'https://picsum.photos/seed/cjenm-ceo-hollywood/400/520',
    url: 'https://www.forbes.com/sites/hannahabraham/2026/02/16/cj-enm-ceo-on-800m-content-strategy-ip-transformation-and-no-other-choice-oscar-disappointment/',
  },
];

// Fallback headlines if Sanity fetch fails or returns empty
const PLACEHOLDER_HEADLINES = [
  '\'Kalki 2898 AD\': Inside the Prabhas-Starring Sci-Fi Epic That Is One Of India\'s Most Expensive Movies Of All Time.',
  'Lin-Manuel Miranda on \'Mufasa\': why the Hamilton parallel is a myth, and what it really means to write for Barry Jenkins.',
  'Somali director Mo Harawe on history-making Cannes title \'The Village Next To Paradise\': "For 70% of the crew, it was their first time on a film set."',
  'Vicky McClure steps out of her comfort zone in Paramount+ thriller \'Insomnia\' — and talks candidly about life after Line Of Duty.',
  '\'The Goat Life\': how a Malayalam epic is proof that Indian cinema is so much more than Bollywood.',
  'Former NewJeans EP Min Hee Jin wins $18 million court battle against HYBE — reshaping K-pop\'s power dynamics.',
  'Harrison Ford fights back tears accepting the SAG Life Achievement Award: \'It\'s a little early.\'',
  'Bad Bunny\'s Super Bowl halftime show: every cultural reference, broken down — and what it means for Latin music in 2026.',
];

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const SCHEDULED_DAYS = [1, 2, 3, 5]; // Mon, Tue, Wed, Fri — pre-published

// ─── CARD 1: ARTICLE SHUFFLER ────────────────────────────────────────────────

function ArticleShufflerSkeleton() {
  return (
    <div className="relative h-[360px] animate-pulse">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="absolute inset-0"
          style={{
            transform: `translateY(${i * 18}px) scale(${1 - i * 0.06})`,
            opacity: 1 - i * 0.28,
            zIndex: 3 - i,
            transformOrigin: 'top center',
            backgroundColor: i === 0 ? '#F8F5F0' : i === 1 ? '#FFFFFF' : '#F0EDE8',
            border: '1px solid rgba(26,26,26,0.1)',
          }}
        >
          <div className="flex h-full">
            <div className="flex flex-col justify-between p-5 flex-1">
              <div>
                <div className="h-2 w-20 mb-3" style={{ backgroundColor: '#DFBD3840' }} />
                <div className="space-y-2">
                  <div className="h-4 w-full" style={{ backgroundColor: '#1A1A1A15' }} />
                  <div className="h-4 w-4/5" style={{ backgroundColor: '#1A1A1A15' }} />
                  <div className="h-4 w-3/5" style={{ backgroundColor: '#1A1A1A15' }} />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="h-2 w-16" style={{ backgroundColor: '#1A1A1A15' }} />
                <div className="h-2 w-12" style={{ backgroundColor: '#1A1A1A15' }} />
              </div>
            </div>
            <div className="w-[110px] flex-shrink-0" style={{ backgroundColor: '#1A1A1A08' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

ArticleShuffler.propTypes = {
  articles: PropTypes.array,
};

function ArticleShuffler({ articles }) {
  const resolvedSource = (articles && articles.length > 0) ? articles : PLACEHOLDER_COVERS;
  const [cards, setCards] = useState(resolvedSource);
  const sourceRef = useRef(resolvedSource);

  useEffect(() => {
    sourceRef.current = (articles && articles.length > 0) ? articles : PLACEHOLDER_COVERS;
  }, [articles]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCards((prev) => {
        if (prev.length !== sourceRef.current.length || prev[0] !== sourceRef.current[0]) {
          return sourceRef.current;
        }
        const next = [...prev];
        next.push(next.shift());
        return next;
      });
    }, 3200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative h-[360px]">
      {cards.map((card, i) => {
        const isTop = i === 0;
        const isSecond = i === 1;
        const scale = isTop ? 1 : isSecond ? 0.94 : 0.88;
        const translateY = isTop ? 0 : isSecond ? 18 : 34;
        const opacity = isTop ? 1 : isSecond ? 0.75 : 0.45;
        const zIndex = cards.length - i;

        const Wrapper = isTop && card.url ? 'a' : 'div';
        const wrapperProps = isTop && card.url
          ? { href: card.url, target: '_blank', rel: 'noopener noreferrer', style: { cursor: 'pointer' } }
          : {};

        const tagType = card.tagType || (i % 2 === 0 ? 'gold' : 'coral');

        return (
          <Wrapper
            key={card.id}
            {...wrapperProps}
            className="absolute inset-0 overflow-hidden group"
            style={{
              transform: `translateY(${translateY}px) scale(${scale})`,
              opacity,
              zIndex,
              transition: 'all 0.72s cubic-bezier(0.34, 1.56, 0.64, 1)',
              transformOrigin: 'top center',
              backgroundColor: card.cardColor || card.color,
              border: '1px solid rgba(26,26,26,0.12)',
              textDecoration: 'none',
              ...(wrapperProps.style || {}),
            }}
          >
            <div className="flex h-full">
              {/* Left text content */}
              <div className="flex flex-col justify-between p-5 flex-1">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className={tagType === 'coral' ? 'tag-coral' : 'tag-gold'}>
                      {card.category}
                    </span>
                    {isTop && card.url && (
                      <ExternalLink
                        size={10}
                        style={{ color: 'var(--color-charcoal)', opacity: 0.35 }}
                        className="transition-opacity duration-200 group-hover:opacity-70"
                      />
                    )}
                  </div>
                  <p
                    className="font-serif font-semibold leading-snug text-base mt-2"
                    style={{ color: 'var(--color-charcoal)' }}
                  >
                    {card.title || card.headline}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <span
                    className="font-ui uppercase"
                    style={{ fontSize: '0.6rem', letterSpacing: '0.08em', fontWeight: 600, color: 'var(--color-text-secondary)', opacity: 0.7 }}
                  >
                    {card.publication}
                  </span>
                  <span
                    className="font-sans"
                    style={{ fontSize: '0.65rem', color: 'var(--color-text-secondary)', opacity: 0.55 }}
                  >
                    {card.date
                      ? /^\d{4}-\d{2}/.test(card.date)
                        ? new Date(card.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                        : card.date
                      : ''}
                  </span>
                </div>
              </div>
              {/* Right image strip */}
              <div className="w-[110px] flex-shrink-0 overflow-hidden">
                <img
                  src={card.image ? `${DIRECTUS_URL}/assets/${card.image}` : card.img || `https://picsum.photos/seed/${card._id || card.id}/400/520`}
                  alt=""
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  draggable="false"
                />
              </div>
            </div>
          </Wrapper>
        );
      })}
    </div>
  );
}

// ─── CARD 2: TELEMETRY TYPEWRITER ────────────────────────────────────────────

TelemetryTypewriter.propTypes = {
  headlines: PropTypes.array,
};

function TelemetryTypewriter({ headlines }) {
  const items = headlines && headlines.length > 0 ? headlines : PLACEHOLDER_HEADLINES.map(t => ({ title: t, url: null }));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [charIndex, setCharIndex] = useState(0);

  useEffect(() => {
    if (!items.length) return;
    const full = items[currentIndex]?.title || '';
    let timeout;

    if (!isDeleting && charIndex < full.length) {
      timeout = setTimeout(() => {
        setDisplayText(full.slice(0, charIndex + 1));
        setCharIndex((c) => c + 1);
      }, 28);
    } else if (!isDeleting && charIndex === full.length) {
      timeout = setTimeout(() => setIsDeleting(true), 3000);
    } else if (isDeleting && charIndex > 0) {
      timeout = setTimeout(() => {
        setDisplayText(full.slice(0, charIndex - 1));
        setCharIndex((c) => c - 1);
      }, 14);
    } else if (isDeleting && charIndex === 0) {
      timeout = setTimeout(() => {
        setIsDeleting(false);
        setCurrentIndex((i) => (i + 1) % items.length);
      }, 0);
    }
    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, currentIndex, items]);

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Live badge */}
      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span
            className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
            style={{ backgroundColor: 'var(--color-gold)' }}
          />
          <span
            className="relative inline-flex rounded-full h-2 w-2"
            style={{ backgroundColor: 'var(--color-gold)' }}
          />
        </span>
        <span
          className="font-ui uppercase"
          style={{ fontSize: '0.6rem', letterSpacing: '0.28em', fontWeight: 600, color: 'var(--color-charcoal)', opacity: 0.55 }}
        >
          Live Entertainment Feed
        </span>
      </div>

      {/* Divider */}
      <div className="h-px w-full" style={{ backgroundColor: 'rgba(26,26,26,0.12)' }} />

      {/* Headline stream */}
      <div className="flex-1 flex flex-col justify-center">
        <p
          className="font-serif font-semibold leading-snug typewriter-text"
          style={{
            fontSize: 'clamp(1rem, 2.2vw, 1.35rem)',
            color: 'var(--color-charcoal)',
            minHeight: '5em',
          }}
        >
          {displayText}
          <span className="blink-cursor" aria-hidden="true" />
        </p>
      </div>

      {/* Footer */}
      <div
        className="pt-3 border-t flex items-center justify-between"
        style={{ borderColor: 'rgba(26,26,26,0.1)' }}
      >
        <span
          className="font-ui uppercase"
          style={{ fontSize: '0.6rem', letterSpacing: '0.1em', fontWeight: 600, color: 'var(--color-text-secondary)', opacity: 0.6 }}
        >
          {currentIndex + 1} / {items.length} — Breaking
        </span>
        <span
          className="font-ui uppercase"
          style={{ fontSize: '0.6rem', letterSpacing: '0.1em', fontWeight: 600, color: 'var(--color-gold)' }}
        >
          Entertainment
        </span>
      </div>
    </div>
  );
}

// ─── CARD 3: EDITORIAL SCHEDULER ─────────────────────────────────────────────

function EditorialScheduler() {
  const [activeDay, setActiveDay] = useState(null);
  const [buttonActive, setButtonActive] = useState(false);
  const cursorRef = useRef(null);
  const gridRef = useRef(null);
  const btnRef = useRef(null);
  const tlRef = useRef(null);

  const runAnimation = useCallback(() => {
    const cursor = cursorRef.current;
    const grid = gridRef.current;
    const btn = btnRef.current;
    if (!cursor || !grid || !btn) return;

    // Pick day index 4 (Thursday) to "click"
    const targetDayIndex = 4;
    const dayCells = grid.querySelectorAll('[data-day]');
    const targetCell = dayCells[targetDayIndex];

    if (!targetCell) return;

    const gridRect = grid.getBoundingClientRect();
    const cellRect = targetCell.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();

    const cellX = cellRect.left - gridRect.left + cellRect.width / 2;
    const cellY = cellRect.top - gridRect.top + cellRect.height / 2;
    const btnX = btnRect.left - gridRect.left + btnRect.width / 2;
    const btnY = btnRect.top - gridRect.top + btnRect.height / 2;

    if (tlRef.current) tlRef.current.kill();
    setActiveDay(null);
    setButtonActive(false);

    const tl = gsap.timeline({ repeat: -1, repeatDelay: 1.5 });

    // Cursor enters from outside
    tl.set(cursor, { x: -60, y: cellY - 10, opacity: 0 })
      .to(cursor, { x: cellX - 12, y: cellY - 10, opacity: 1, duration: 0.7, ease: 'power2.out' })
      // Cursor "clicks" the day
      .to(cursor, { scale: 0.8, duration: 0.1, ease: 'power2.in' })
      .call(() => setActiveDay(targetDayIndex))
      .to(cursor, { scale: 1, duration: 0.15, ease: 'power2.out' })
      // Move to Read Now button
      .to(cursor, { x: btnX - 12, y: btnY - 10, duration: 0.65, ease: 'power2.inOut', delay: 0.4 })
      .to(cursor, { scale: 0.8, duration: 0.1, ease: 'power2.in' })
      .call(() => setButtonActive(true))
      .to(cursor, { scale: 1, duration: 0.15, ease: 'power2.out' })
      // Fade out
      .to(cursor, { opacity: 0, duration: 0.4, delay: 0.8 })
      .call(() => {
        setActiveDay(null);
        setButtonActive(false);
      });

    tlRef.current = tl;
  }, []);

  useEffect(() => {
    const timer = setTimeout(runAnimation, 800);
    return () => {
      clearTimeout(timer);
      if (tlRef.current) tlRef.current.kill();
    };
  }, [runAnimation]);

  return (
    <div className="flex flex-col h-full gap-4" ref={gridRef}>
      <div className="flex items-center justify-between">
        <span
          className="font-ui uppercase"
          style={{ fontSize: '0.6rem', letterSpacing: '0.28em', fontWeight: 600, color: 'var(--color-charcoal)', opacity: 0.55 }}
        >
          Publishing Schedule — Forbes · Deadline · BI
        </span>
        <span
          className="font-sans"
          style={{ fontSize: '0.65rem', color: 'var(--color-text-secondary)', opacity: 0.6 }}
        >
          Mar 2026
        </span>
      </div>

      {/* Week Grid */}
      <div className="grid grid-cols-7 gap-1.5 relative">
        {DAYS.map((day, i) => {
          const isScheduled = SCHEDULED_DAYS.includes(i);
          const isActive = activeDay === i;

          return (
            <div
              key={`${day}-${i}`}
              data-day={i}
              className="flex flex-col items-center gap-1.5 p-2 cursor-default transition-all duration-300"
              style={{
                backgroundColor: isActive
                  ? 'var(--color-gold)'
                  : isScheduled
                    ? 'rgba(223,189,56,0.14)'
                    : 'rgba(26,26,26,0.04)',
                transform: isActive ? 'scale(1.06)' : 'scale(1)',
                boxShadow: isActive ? '0 4px 12px rgba(223,189,56,0.3)' : 'none',
                borderRadius: '2px',
              }}
            >
              <span
                className="font-ui uppercase"
                style={{ fontSize: '0.55rem', letterSpacing: '0.1em', fontWeight: 600, color: isActive ? 'var(--color-charcoal)' : 'var(--color-text-secondary)', opacity: isActive ? 1 : 0.7 }}
              >
                {day}
              </span>
              <div
                className="w-5 h-5 flex items-center justify-center transition-colors duration-300"
                style={{
                  backgroundColor: isActive
                    ? 'rgba(26,26,26,0.15)'
                    : isScheduled
                      ? 'rgba(223,189,56,0.35)'
                      : 'transparent',
                  borderRadius: '50%',
                }}
              >
                {isScheduled && !isActive && (
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: 'var(--color-gold)' }}
                  />
                )}
                {isActive && (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                    <path d="M2 5.5L4 7.5L8 3" stroke="#1A1A1A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Divider */}
      <div className="h-px w-full" style={{ backgroundColor: 'rgba(26,26,26,0.1)' }} />

      {/* Read Now Button */}
      <div ref={btnRef} className="flex items-center gap-3">
        <button
          className="flex items-center gap-2 font-ui uppercase tracking-[0.08em] px-5 py-2.5 border transition-all duration-300"
          style={{
            fontSize: '0.7rem',
            fontWeight: 600,
            borderColor: buttonActive ? 'var(--color-gold)' : 'var(--color-charcoal)',
            backgroundColor: buttonActive ? 'var(--color-gold)' : 'transparent',
            color: 'var(--color-charcoal)',
            transform: buttonActive ? 'scale(1.04)' : 'scale(1)',
            borderRadius: '2px',
          }}
          aria-label="Read latest column"
        >
          Read now
          <ArrowRight size={11} />
        </button>
        <span
          className="font-sans"
          style={{ fontSize: '0.65rem', color: 'var(--color-text-secondary)', opacity: 0.6 }}
        >
          200+ articles across Forbes, Deadline & more
        </span>
      </div>

      {/* SVG Cursor — absolutely positioned within the grid container */}
      <svg
        ref={cursorRef}
        className="absolute pointer-events-none"
        style={{ top: 0, left: 0, zIndex: 20, opacity: 0 }}
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M5 3L19 12L12 13.5L9 20L5 3Z"
          fill="#1A1A1A"
          stroke="#DFBD38"
          strokeWidth="1"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

// ─── MAIN PORTFOLIO SECTION ───────────────────────────────────────────────────

export default function LatestWork() {
  const sectionRef = useRef(null);
  const headingRef = useRef(null);
  const cardsRef = useRef([]);

  // ── Directus data state ────────────────────────────────────────────────────
  const [featuredArticles, setFeaturedArticles] = useState([]);
  const [headlineArticles, setHeadlineArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchArticles() {
      try {
        const [featured, headlines] = await Promise.all([
          directus.request(readItems('articles', FEATURED_QUERY)),
          directus.request(readItems('articles', HEADLINES_QUERY)),
        ]);
        if (!cancelled) {
          setFeaturedArticles((featured || []).map(mapFeatured));
          setHeadlineArticles((headlines || []).map(mapHeadline));
        }
      } catch (err) {
        console.error('[Portfolio] Directus fetch failed, using placeholders:', err);
        // Fallback: components will use their own placeholder data
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchArticles();
    return () => { cancelled = true; };
  }, []);

  // ── GSAP scroll animations ─────────────────────────────────────────────────
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        headingRef.current,
        { opacity: 0, y: 32 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: headingRef.current,
            start: 'top 85%',
          },
        }
      );

      cardsRef.current.forEach((card, i) => {
        if (!card) return;
        gsap.fromTo(
          card,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power3.out',
            delay: i * 0.12,
            scrollTrigger: {
              trigger: card,
              start: 'top 88%',
            },
          }
        );
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      id="work"
      ref={sectionRef}
      className="relative py-24 md:py-32"
      style={{ backgroundColor: 'var(--color-bg-primary)' }}
      aria-label="Latest Work"
    >
      <div className="max-w-[1400px] mx-auto px-6 md:px-10">
        {/* Section header */}
        <div ref={headingRef} className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-16">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span
                className="inline-block w-8 h-px"
                style={{ backgroundColor: 'var(--color-gold)' }}
                aria-hidden="true"
              />
              <span
                className="font-ui uppercase"
                style={{ fontSize: '0.6rem', letterSpacing: '0.28em', fontWeight: 600, color: 'var(--color-gold)' }}
              >
                Selected Work
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
              The latest
              <br />
              <span className="font-normal italic">from the desk</span>
            </h2>
          </div>
          <Link
            to="/archive"
            className="flex items-center gap-2 font-ui text-xs font-semibold uppercase tracking-[0.1em] self-start md:self-auto transition-all duration-200 hover:gap-3"
            style={{ color: 'var(--color-charcoal)' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-gold)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-charcoal)'; }}
          >
            View all articles
            <ArrowRight size={13} />
          </Link>
        </div>

        {/* Cards bento grid — intentionally asymmetric */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr_1fr] gap-5">
          {/* Card 1 — Article Shuffler */}
          <div
            ref={(el) => (cardsRef.current[0] = el)}
            className="p-6 flex flex-col gap-4"
            style={{
              border: '1px solid rgba(26,26,26,0.12)',
              backgroundColor: 'var(--color-bg-secondary)',
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="tag-gold">Featured Interviews</span>
            </div>
            {loading ? (
              <ArticleShufflerSkeleton />
            ) : (
              <ArticleShuffler articles={featuredArticles.length > 0 ? featuredArticles : undefined} />
            )}
          </div>

          {/* Card 2 — Telemetry Typewriter (center, larger) */}
          <div
            ref={(el) => (cardsRef.current[1] = el)}
            className="p-7 flex flex-col"
            style={{
              border: '1px solid var(--color-gold)',
              backgroundColor: 'var(--color-bg-primary)',
            }}
          >
            <TelemetryTypewriter headlines={headlineArticles.length > 0 ? headlineArticles : undefined} />
          </div>

          {/* Card 3 — Editorial Scheduler (relative for cursor positioning) */}
          <div
            ref={(el) => (cardsRef.current[2] = el)}
            className="p-6 flex flex-col relative overflow-hidden"
            style={{
              border: '1px solid rgba(26,26,26,0.12)',
              backgroundColor: 'var(--color-bg-secondary)',
            }}
          >
            <EditorialScheduler />
          </div>
        </div>
      </div>
    </section>
  );
}
