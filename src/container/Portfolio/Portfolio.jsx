import React, { useState, useEffect, useRef, useCallback } from 'react';
import { gsap } from 'gsap';
import { ExternalLink, ArrowRight } from 'lucide-react';
import { client } from '../../client';

// ─── GROQ QUERIES ────────────────────────────────────────────────────────────

const FEATURED_QUERY = `*[_type == "article" && isFeatured == true] | order(order asc) {
  _id,
  title,
  publication,
  category,
  date,
  url,
  cardColor,
  accentColor,
}`;

const HEADLINES_QUERY = `*[_type == "article" && isHeadline == true] | order(order asc) {
  _id,
  title,
  url,
}`;

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const PLACEHOLDER_COVERS = [
  {
    id: 1,
    category: 'FEATURE — FORBES',
    headline: 'BAFTA-Winning Director Lakshmipriya Devi On \'Boong\': \'Everyone Told Me Not To Make It\'',
    publication: 'Forbes',
    date: 'Feb 28, 2026',
    color: '#C3C0D8',
    accent: '#584B77',
    img: 'https://picsum.photos/seed/boong-bafta-director/400/520',
    url: 'https://www.forbes.com/sites/hannahabraham/2026/02/28/bafta-winning-director-lakshmipriya-devi-on-boong-everyone-told-me-not-to-make-it/',
  },
  {
    id: 2,
    category: 'INTERVIEW — DEADLINE',
    headline: '\'Mufasa\' Songwriter Lin-Manuel Miranda On Working With Barry Jenkins & Why The \'Hamilton\' Parallel Is A Myth',
    publication: 'Deadline',
    date: 'Dec 2024',
    color: '#E8E4F0',
    accent: '#3D3460',
    img: 'https://picsum.photos/seed/lin-manuel-miranda-mufasa/400/520',
    url: 'https://deadline.com/feature/mufasa-the-lion-king-lin-manuel-miranda-interview-1236242723/',
  },
  {
    id: 3,
    category: 'LONG READ — FORBES',
    headline: 'The Very Beginning Of Outstation: Inside India\'s Most Ambitious Boyband',
    publication: 'Forbes',
    date: 'Feb 27, 2026',
    color: '#F4F0FA',
    accent: '#584B77',
    img: 'https://picsum.photos/seed/outstation-boyband-india/400/520',
    url: 'https://www.forbes.com/sites/hannahabraham/2026/02/27/the-very-beginning-of-outstation/',
  },
  {
    id: 4,
    category: 'ANALYSIS — FORBES',
    headline: '2026 Actor Awards Shake Up The Oscar Race: A Category-By-Category Breakdown',
    publication: 'Forbes',
    date: 'Mar 1, 2026',
    color: '#DDD9EF',
    accent: '#3D3460',
    img: 'https://picsum.photos/seed/actor-awards-oscars-2026/400/520',
    url: 'https://www.forbes.com/sites/hannahabraham/2026/03/01/what-the-actor-awards-2026-tell-us-about-the-oscar-race-a-category-by-category-breakdown/',
  },
  {
    id: 5,
    category: 'INTERVIEW — DEADLINE',
    headline: '\'Munjya\' Star Sharvari On Finding Success In Bollywood & Her Desire To Work With Greta Gerwig',
    publication: 'Deadline',
    date: 'Jul 2024',
    color: '#EAE7F5',
    accent: '#584B77',
    img: 'https://picsum.photos/seed/munjya-sharvari-bollywood/400/520',
    url: 'https://deadline.com/2024/07/munjya-sharvari-bollywood-greta-gerwig-yrf-alia-bhatt-1235999575/',
  },
  {
    id: 6,
    category: 'FEATURE — BUSINESS INSIDER',
    headline: 'CJ ENM CEO On $800M Content Strategy, IP Transformation And Hollywood Ambitions',
    publication: 'Forbes',
    date: 'Feb 16, 2026',
    color: '#C8C5DE',
    accent: '#3D3460',
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
          className="absolute inset-0 rounded-sm"
          style={{
            transform: `translateY(${i * 18}px) scale(${1 - i * 0.06})`,
            opacity: 1 - i * 0.28,
            zIndex: 3 - i,
            transformOrigin: 'top center',
            backgroundColor: i === 0 ? '#C3C0D8' : i === 1 ? '#E8E4F0' : '#F4F0FA',
          }}
        >
          <div className="flex h-full">
            <div className="flex flex-col justify-between p-5 flex-1">
              <div>
                <div className="h-2 w-24 rounded mb-3" style={{ backgroundColor: '#584B7740' }} />
                <div className="space-y-2">
                  <div className="h-4 w-full rounded" style={{ backgroundColor: '#584B7730' }} />
                  <div className="h-4 w-4/5 rounded" style={{ backgroundColor: '#584B7730' }} />
                  <div className="h-4 w-3/5 rounded" style={{ backgroundColor: '#584B7730' }} />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="h-2 w-16 rounded" style={{ backgroundColor: '#584B7730' }} />
                <div className="h-2 w-12 rounded" style={{ backgroundColor: '#584B7730' }} />
              </div>
            </div>
            <div className="w-[110px] flex-shrink-0" style={{ backgroundColor: '#584B7720' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function ArticleShuffler({ articles }) {
  const [cards, setCards] = useState(articles || PLACEHOLDER_COVERS);

  useEffect(() => {
    if (articles && articles.length > 0) {
      setCards(articles);
    }
  }, [articles]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCards((prev) => {
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

        return (
          <Wrapper
            key={card.id}
            {...wrapperProps}
            className="absolute inset-0 rounded-sm overflow-hidden group"
            style={{
              transform: `translateY(${translateY}px) scale(${scale})`,
              opacity,
              zIndex,
              transition: 'all 0.72s cubic-bezier(0.34, 1.56, 0.64, 1)',
              transformOrigin: 'top center',
              backgroundColor: card.cardColor || card.color,
              textDecoration: 'none',
              ...(wrapperProps.style || {}),
            }}
          >
            <div className="flex h-full">
              {/* Left text content */}
              <div className="flex flex-col justify-between p-5 flex-1">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className="font-jakarta text-[9px] uppercase tracking-[0.3em] font-bold"
                      style={{ color: card.accentColor || card.accent, opacity: 0.7 }}
                    >
                      {card.category}
                    </span>
                    {isTop && card.url && (
                      <ExternalLink
                        size={10}
                        style={{ color: card.accentColor || card.accent, opacity: 0.4 }}
                        className="transition-opacity duration-200 group-hover:opacity-80"
                      />
                    )}
                  </div>
                  <p
                    className="font-cormorant font-semibold leading-snug text-lg"
                    style={{ color: card.accentColor || card.accent }}
                  >
                    {card.title || card.headline}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-jakarta text-[10px]" style={{ color: card.accentColor || card.accent, opacity: 0.6 }}>
                    {card.publication}
                  </span>
                  <span className="font-jakarta text-[10px]" style={{ color: card.accentColor || card.accent, opacity: 0.5 }}>
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
                  src={card.img || `https://picsum.photos/seed/${card._id || card.id}/400/520`}
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

function TelemetryTypewriter({ headlines }) {
  const items = headlines && headlines.length > 0 ? headlines : PLACEHOLDER_HEADLINES.map(t => ({ title: t, url: null }));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [charIndex, setCharIndex] = useState(0);

  // Reset when headlines change (after Sanity fetch)
  useEffect(() => {
    setCurrentIndex(0);
    setDisplayText('');
    setCharIndex(0);
    setIsDeleting(false);
  }, [headlines]);

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
      setIsDeleting(false);
      setCurrentIndex((i) => (i + 1) % items.length);
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
            style={{ backgroundColor: 'var(--color-violet)' }}
          />
          <span
            className="relative inline-flex rounded-full h-2 w-2"
            style={{ backgroundColor: 'var(--color-violet)' }}
          />
        </span>
        <span
          className="font-jakarta text-[10px] uppercase tracking-[0.28em] font-semibold"
          style={{ color: 'var(--color-violet)' }}
        >
          Live Entertainment Feed
        </span>
      </div>

      {/* Divider */}
      <div className="h-px w-full" style={{ backgroundColor: 'var(--color-gray-light)' }} />

      {/* Headline stream */}
      <div className="flex-1 flex flex-col justify-center">
        <p
          className="font-cormorant font-semibold leading-snug typewriter-text"
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
        style={{ borderColor: 'var(--color-gray-light)' }}
      >
        <span
          className="font-jakarta text-[10px] uppercase tracking-widest"
          style={{ color: 'var(--color-gray-mid)' }}
        >
          {currentIndex + 1} / {items.length} — Breaking
        </span>
        <span
          className="font-jakarta text-[10px] font-medium"
          style={{ color: 'var(--color-violet)' }}
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
          className="font-jakarta text-[10px] uppercase tracking-[0.28em] font-semibold"
          style={{ color: 'var(--color-violet)' }}
        >
          Publishing Schedule — Forbes · Deadline · BI
        </span>
        <span
          className="font-jakarta text-[10px]"
          style={{ color: 'var(--color-gray-mid)' }}
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
              className="flex flex-col items-center gap-1.5 p-2 rounded-sm cursor-default transition-all duration-300"
              style={{
                backgroundColor: isActive
                  ? 'var(--color-periwinkle)'
                  : isScheduled
                    ? 'rgba(195,192,216,0.22)'
                    : 'rgba(232,232,238,0.4)',
                transform: isActive ? 'scale(1.06)' : 'scale(1)',
                boxShadow: isActive ? '0 4px 12px rgba(88,75,119,0.2)' : 'none',
              }}
            >
              <span
                className="font-jakarta text-[9px] uppercase tracking-widest font-semibold"
                style={{ color: isActive ? 'var(--color-violet)' : 'var(--color-gray-mid)' }}
              >
                {day}
              </span>
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center transition-colors duration-300"
                style={{
                  backgroundColor: isActive
                    ? 'var(--color-violet)'
                    : isScheduled
                      ? 'var(--color-periwinkle)'
                      : 'transparent',
                }}
              >
                {isScheduled && !isActive && (
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: 'var(--color-violet)' }}
                  />
                )}
                {isActive && (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                    <path d="M2 5.5L4 7.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Divider */}
      <div className="h-px w-full" style={{ backgroundColor: 'var(--color-gray-light)' }} />

      {/* Read Now Button */}
      <div ref={btnRef} className="flex items-center gap-3">
        <button
          className="flex items-center gap-2 font-jakarta text-xs font-semibold uppercase tracking-widest px-5 py-2.5 rounded-sm border transition-all duration-300"
          style={{
            borderColor: buttonActive ? 'transparent' : 'var(--color-violet)',
            backgroundColor: buttonActive ? 'var(--color-violet)' : 'transparent',
            color: buttonActive ? '#fff' : 'var(--color-violet)',
            transform: buttonActive ? 'scale(1.04)' : 'scale(1)',
          }}
          aria-label="Read latest column"
        >
          Read Now
          <ArrowRight size={11} />
        </button>
        <span
          className="font-jakarta text-[10px]"
          style={{ color: 'var(--color-gray-mid)' }}
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
          fill="#584B77"
          stroke="#fff"
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

  // ── Sanity data state ──────────────────────────────────────────────────────
  const [featuredArticles, setFeaturedArticles] = useState([]);
  const [headlineArticles, setHeadlineArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchArticles() {
      try {
        const [featured, headlines] = await Promise.all([
          client.fetch(FEATURED_QUERY),
          client.fetch(HEADLINES_QUERY),
        ]);
        if (!cancelled) {
          setFeaturedArticles(featured || []);
          setHeadlineArticles(headlines || []);
        }
      } catch (err) {
        console.error('[Portfolio] Sanity fetch failed, using placeholders:', err);
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
      style={{ backgroundColor: 'var(--color-white)' }}
      aria-label="Latest Work"
    >
      <div className="max-w-[1400px] mx-auto px-6 md:px-10">
        {/* Section header */}
        <div ref={headingRef} className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-16">
          <div>
            <span
              className="font-jakarta text-xs uppercase tracking-[0.3em] font-semibold block mb-4"
              style={{ color: 'var(--color-periwinkle)' }}
            >
              — Selected Work
            </span>
            <h2
              className="font-cormorant font-bold leading-tight tracking-tight"
              style={{
                fontSize: 'clamp(2.5rem, 6vw, 5rem)',
                color: 'var(--color-violet)',
              }}
            >
              The Latest
              <br />
              <span className="font-light italic">from the desk</span>
            </h2>
          </div>
          <a
            href="https://www.forbes.com/sites/hannahabraham/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 font-jakarta text-sm font-medium self-start md:self-auto transition-all duration-200 hover:gap-3"
            style={{ color: 'var(--color-violet)' }}
          >
            View All Articles
            <ExternalLink size={14} />
          </a>
        </div>

        {/* Cards bento grid — intentionally asymmetric */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr_1fr] gap-6">
          {/* Card 1 — Article Shuffler */}
          <div
            ref={(el) => (cardsRef.current[0] = el)}
            className="rounded-sm p-6 flex flex-col gap-4 border"
            style={{
              borderColor: 'var(--color-gray-light)',
              backgroundColor: 'var(--color-white)',
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span
                className="font-jakarta text-[9px] uppercase tracking-[0.3em] font-bold block"
                style={{ color: 'var(--color-gray-mid)' }}
              >
                Featured Interviews
              </span>
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
            className="rounded-sm p-7 flex flex-col border"
            style={{
              borderColor: 'var(--color-periwinkle)',
              backgroundColor: '#FAFAFE',
            }}
          >
            <TelemetryTypewriter headlines={headlineArticles.length > 0 ? headlineArticles : undefined} />
          </div>

          {/* Card 3 — Editorial Scheduler (relative for cursor positioning) */}
          <div
            ref={(el) => (cardsRef.current[2] = el)}
            className="rounded-sm p-6 flex flex-col border relative overflow-hidden"
            style={{
              borderColor: 'var(--color-gray-light)',
              backgroundColor: 'var(--color-white)',
            }}
          >
            <EditorialScheduler />
          </div>
        </div>
      </div>
    </section>
  );
}
