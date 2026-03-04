import React, { useState, useEffect, useRef, useMemo } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Link } from 'react-router-dom';
import { Search, ArrowRight, ChevronLeft, ChevronRight, X } from 'lucide-react';
import Navbar from '../components/Navbar/Navbar';
import Footer from '../container/Footer/Footer';
import { readItems } from '@directus/sdk';
import { directus, DIRECTUS_URL } from '../directus';

gsap.registerPlugin(ScrollTrigger);

// ─── ARTICLE DATA ─────────────────────────────────────────────────────────────

const FALLBACK_ARTICLES = [
    {
        id: 1,
        title: "BAFTA-Winning Director Lakshmipriya Devi On 'Boong': 'Everyone Told Me Not To Make It'",
        publication: 'Forbes',
        category: 'Interview',
        date: '2026-02-28',
        excerpt: "An intimate conversation with the boundary-breaking director whose debut feature 'Boong' became the surprise of the awards season, navigating personal grief and cultural displacement with extraordinary precision.",
        url: 'https://www.forbes.com/sites/hannahabraham/2026/02/28/bafta-winning-director-lakshmipriya-devi-on-boong-everyone-told-me-not-to-make-it/',
        img: 'https://picsum.photos/seed/lakshmipriya-boong-bafta/800/500',
    },
    {
        id: 2,
        title: "The Very Beginning Of Outstation: Inside India's Most Ambitious Boyband",
        publication: 'Forbes',
        category: 'Long Read',
        date: '2026-02-27',
        excerpt: "Before the sold-out arenas and the streaming records, there were six young men rehearsing in a Mumbai studio with no guarantee of anything. This is the story of Outstation from the very start.",
        url: 'https://www.forbes.com/sites/hannahabraham/2026/02/27/the-very-beginning-of-outstation/',
        img: 'https://picsum.photos/seed/outstation-india-boyband/800/500',
    },
    {
        id: 3,
        title: "CJ ENM CEO On $800M Content Strategy, IP Transformation And Hollywood Ambitions",
        publication: 'Forbes',
        category: 'Interview',
        date: '2026-02-16',
        excerpt: "The Korean entertainment giant's top executive outlines how the company plans to reshape global content distribution and why an Oscar disappointment only sharpened their resolve.",
        url: 'https://www.forbes.com/sites/hannahabraham/2026/02/16/cj-enm-ceo-on-800m-content-strategy-ip-transformation-and-no-other-choice-oscar-disappointment/',
        img: 'https://picsum.photos/seed/cjenm-ceo-interview/800/500',
    },
    {
        id: 4,
        title: "2026 Actor Awards Shake Up The Oscar Race: A Category-By-Category Breakdown",
        publication: 'Forbes',
        category: 'Analysis',
        date: '2026-03-01',
        excerpt: "With nominations announced and campaigning in full swing, the actor awards circuit has delivered a genuinely competitive race for the first time in years. Here is what every guild result tells us.",
        url: 'https://www.forbes.com/sites/hannahabraham/2026/03/01/what-the-actor-awards-2026-tell-us-about-the-oscar-race-a-category-by-category-breakdown/',
        img: 'https://picsum.photos/seed/oscar-race-actor-awards/800/500',
    },
    {
        id: 5,
        title: "'Mufasa' Songwriter Lin-Manuel Miranda On Working With Barry Jenkins & Why The 'Hamilton' Parallel Is A Myth",
        publication: 'Deadline',
        category: 'Interview',
        date: '2024-12-10',
        excerpt: "In his first in-depth interview since the film's release, Miranda opens up about the specific musical grammar Barry Jenkins demanded, and why every Broadway comparison misses the point.",
        url: 'https://deadline.com/feature/mufasa-the-lion-king-lin-manuel-miranda-interview-1236242723/',
        img: 'https://picsum.photos/seed/lin-manuel-miranda-mufasa/800/500',
    },
    {
        id: 6,
        title: "'Munjya' Star Sharvari On Finding Success In Bollywood & Her Desire To Work With Greta Gerwig",
        publication: 'Deadline',
        category: 'Profile',
        date: '2024-07-22',
        excerpt: "Sharvari has become one of Indian cinema's most watchable presences in under three years. She sits down to discuss the franchises, the festivals, and the Hollywood directors she is actively chasing.",
        url: 'https://deadline.com/2024/07/munjya-sharvari-bollywood-greta-gerwig-yrf-alia-bhatt-1235999575/',
        img: 'https://picsum.photos/seed/sharvari-bollywood-munjya/800/500',
    },
    {
        id: 7,
        title: "Somali Director Mo Harawe On History-Making Cannes Title 'The Village Next To Paradise'",
        publication: 'Deadline',
        category: 'Interview',
        date: '2024-05-19',
        excerpt: "For 70% of the crew, it was their first time on a film set. Harawe speaks about the logistics of shooting in Mogadishu and why he refuses to frame Somali life through the lens of crisis.",
        url: '#',
        img: 'https://picsum.photos/seed/mo-harawe-cannes-somalia/800/500',
    },
    {
        id: 8,
        title: "'Kalki 2898 AD': Inside The Prabhas-Starring Sci-Fi Epic That Is One Of India's Most Expensive Movies",
        publication: 'Variety',
        category: 'Feature',
        date: '2024-06-30',
        excerpt: "An access-all-areas look at the production of the most ambitious Indian studio film ever attempted — its mythology, its visual effects pipeline, and the commercial pressure riding on every frame.",
        url: '#',
        img: 'https://picsum.photos/seed/kalki-2898-ad-scifi/800/500',
    },
    {
        id: 9,
        title: "Former NewJeans EP Min Hee Jin Wins $18 Million Court Battle Against HYBE",
        publication: 'Variety',
        category: 'Editorial',
        date: '2024-08-14',
        excerpt: "The verdict sends shockwaves through K-pop's power hierarchy, raises uncomfortable questions about creative ownership, and reframes every major label dispute that preceded it.",
        url: '#',
        img: 'https://picsum.photos/seed/min-hee-jin-hybe-kpop/800/500',
    },
    {
        id: 10,
        title: "Harrison Ford Fights Back Tears Accepting The SAG Life Achievement Award",
        publication: 'Deadline',
        category: 'News',
        date: '2024-02-24',
        excerpt: "In a room full of people who have watched him for decades, Ford's speech was a reminder that the best performances happen when nobody is trying at all.",
        url: '#',
        img: 'https://picsum.photos/seed/harrison-ford-sag-award/800/500',
    },
    {
        id: 11,
        title: "Bad Bunny's Super Bowl Halftime Show: Every Cultural Reference, Broken Down",
        publication: 'Forbes',
        category: 'Analysis',
        date: '2026-02-10',
        excerpt: "From the Mayagüez earthquake tribute to the cameo that left the internet in pieces — a meticulous annotated guide to the most politically charged half-time performance in recent memory.",
        url: '#',
        img: 'https://picsum.photos/seed/bad-bunny-super-bowl/800/500',
    },
    {
        id: 12,
        title: "Vicky McClure Steps Out Of Her Comfort Zone In Paramount+ Thriller 'Insomnia'",
        publication: 'Variety',
        category: 'Profile',
        date: '2023-10-05',
        excerpt: "After six seasons of Line Of Duty, McClure chose a role that offered no safety net — a woman who cannot tell her memory from her imagination. She talks candidly about the physical toll and the creative liberation.",
        url: '#',
        img: 'https://picsum.photos/seed/vicky-mcclure-insomnia/800/500',
    },
    {
        id: 13,
        title: "The Death Of The Movie Star: Or Just A Rebranding?",
        publication: 'Forbes',
        category: 'Editorial',
        date: '2023-07-18',
        excerpt: "IP franchises have replaced personalities as the primary box-office driver. But the comeback of Keanu Reeves, the rise of Pedro Pascal, and a few unexpected summer hits suggest the star is simply changing shape.",
        url: '#',
        img: 'https://picsum.photos/seed/movie-star-death-ip/800/500',
    },
    {
        id: 14,
        title: "'The Goat Life': How A Malayalam Epic Is Proof Indian Cinema Is So Much More Than Bollywood",
        publication: 'Deadline',
        category: 'Review',
        date: '2024-03-28',
        excerpt: "Prithviraj Sukumaran gives the performance of his career in this brutal, beautiful survival story — and the film's international distribution deal may quietly rewrite the rules of South Asian cinema.",
        url: '#',
        img: 'https://picsum.photos/seed/goat-life-malayalam/800/500',
    },
    {
        id: 15,
        title: "'Echoes In The Dark' Is A Masterclass In Subtle Tension",
        publication: 'Forbes',
        category: 'Review',
        date: '2023-09-11',
        excerpt: "A psychological thriller that relies on what you don't see — no jump scares, no score swell, just an accumulation of dread so precise it feels less like a film and more like a slow gas leak.",
        url: '#',
        img: 'https://picsum.photos/seed/echoes-dark-thriller/800/500',
    },
];

const PUBLICATIONS = ['All Publications', 'Forbes', 'Deadline', 'Variety'];
const YEARS = ['All Years', '2026', '2025', '2024', '2023'];
const ITEMS_PER_PAGE = 9;

function formatDate(dateStr) {
    if (!dateStr) return '';
    try {
        return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
            month: 'short',
            year: 'numeric',
        });
    } catch {
        return dateStr;
    }
}

function getYear(dateStr) {
    if (!dateStr) return '';
    return dateStr.substring(0, 4);
}

// ─── ARTICLE CARD ─────────────────────────────────────────────────────────────

function ArticleCard({ article, index }) {
    const cardRef = useRef(null);

    useEffect(() => {
        const card = cardRef.current;
        if (!card) return;
        const ctx = gsap.context(() => {
            gsap.fromTo(
                card,
                { opacity: 0, y: 36 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 0.7,
                    ease: 'power3.out',
                    delay: (index % ITEMS_PER_PAGE) * 0.06,
                    scrollTrigger: {
                        trigger: card,
                        start: 'top 90%',
                        once: true,
                    },
                }
            );
        }, card);
        return () => ctx.revert();
    }, [index]);

    return (
        <article
            ref={cardRef}
            className="group flex flex-col h-full"
            style={{ opacity: 0 }}
        >
            {/* Image */}
            <div className="relative overflow-hidden aspect-[16/10] mb-5 rounded-sm">
                <img
                    src={article.img}
                    alt={article.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                />
                {/* Category badge */}
                <div className="absolute top-3 left-3">
                    <span
                        className="font-jakarta text-[9px] font-bold uppercase tracking-[0.22em] px-2.5 py-1 rounded-sm backdrop-blur-sm"
                        style={{
                            backgroundColor: 'rgba(195,192,216,0.92)',
                            color: 'var(--color-violet)',
                        }}
                    >
                        {article.category}
                    </span>
                </div>
            </div>

            {/* Meta */}
            <div className="flex items-center gap-2 mb-3">
                <span
                    className="font-jakarta text-[10px] uppercase tracking-widest font-semibold"
                    style={{ color: 'var(--color-violet)' }}
                >
                    {article.publication}
                </span>
                <span style={{ color: 'var(--color-gray-light)' }}>·</span>
                <span
                    className="font-jakarta text-[10px] uppercase tracking-widest"
                    style={{ color: 'var(--color-gray-mid)' }}
                >
                    {formatDate(article.date)}
                </span>
            </div>

            {/* Title */}
            <h2
                className="font-cormorant font-semibold leading-snug mb-3 flex-1 transition-colors duration-200"
                style={{
                    fontSize: 'clamp(1.1rem, 2vw, 1.35rem)',
                    color: 'var(--color-charcoal)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-violet)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-charcoal)')}
            >
                {article.title}
            </h2>

            {/* Excerpt */}
            <p
                className="font-jakarta text-sm leading-relaxed mb-4 line-clamp-2"
                style={{ color: 'var(--color-gray-mid)' }}
            >
                {article.excerpt}
            </p>

            {/* Divider */}
            <div
                className="h-px w-full mb-4"
                style={{ backgroundColor: 'var(--color-gray-light)' }}
                aria-hidden="true"
            />

            {/* Read link */}
            <a
                href={article.url}
                target={article.url !== '#' ? '_blank' : undefined}
                rel={article.url !== '#' ? 'noopener noreferrer' : undefined}
                className="group/link inline-flex items-center gap-1.5 font-jakarta text-xs font-semibold uppercase tracking-widest transition-all duration-200 self-start"
                style={{ color: 'var(--color-violet)' }}
                aria-label={`Read article: ${article.title}`}
            >
                Read Article
                <ArrowRight
                    size={11}
                    className="transition-transform duration-200 group-hover/link:translate-x-1"
                />
            </a>
        </article>
    );
}

// ─── FILTER CHIP ─────────────────────────────────────────────────────────────

function FilterSelect({ label, value, options, onChange }) {
    return (
        <div className="relative">
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="appearance-none font-jakarta text-sm font-medium pl-4 pr-9 py-2.5 rounded-sm border cursor-pointer transition-all duration-200 bg-white focus:outline-none focus:ring-2"
                style={{
                    borderColor: value !== options[0] ? 'var(--color-violet)' : 'var(--color-gray-light)',
                    color: value !== options[0] ? 'var(--color-violet)' : 'var(--color-charcoal)',
                    focusRingColor: 'var(--color-periwinkle)',
                }}
                aria-label={label}
            >
                {options.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                ))}
            </select>
            {/* Chevron */}
            <svg
                className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                width="10"
                height="6"
                viewBox="0 0 10 6"
                fill="none"
                aria-hidden="true"
            >
                <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                    style={{ color: value !== options[0] ? 'var(--color-violet)' : 'var(--color-gray-mid)' }}
                />
            </svg>
        </div>
    );
}

// ─── PAGINATION ───────────────────────────────────────────────────────────────

function Pagination({ current, total, onChange }) {
    const pages = Array.from({ length: total }, (_, i) => i + 1);
    const MAX_VISIBLE = 5;

    let visiblePages = pages;
    if (total > MAX_VISIBLE) {
        const start = Math.max(1, current - 2);
        const end = Math.min(total, start + MAX_VISIBLE - 1);
        visiblePages = pages.slice(start - 1, end);
    }

    return (
        <nav className="flex items-center gap-2 justify-center mt-16" aria-label="Pagination">
            <button
                onClick={() => onChange(current - 1)}
                disabled={current === 1}
                className="w-9 h-9 flex items-center justify-center rounded-sm border transition-all duration-200 disabled:opacity-30"
                style={{ borderColor: 'var(--color-gray-light)', color: 'var(--color-charcoal)' }}
                aria-label="Previous page"
            >
                <ChevronLeft size={14} />
            </button>

            {visiblePages[0] > 1 && (
                <>
                    <button
                        onClick={() => onChange(1)}
                        className="w-9 h-9 font-jakarta text-sm font-medium rounded-sm border transition-all duration-200"
                        style={{ borderColor: 'var(--color-gray-light)', color: 'var(--color-charcoal)' }}
                    >
                        1
                    </button>
                    {visiblePages[0] > 2 && (
                        <span className="font-jakarta text-sm px-1" style={{ color: 'var(--color-gray-mid)' }}>…</span>
                    )}
                </>
            )}

            {visiblePages.map((p) => (
                <button
                    key={p}
                    onClick={() => onChange(p)}
                    className="w-9 h-9 font-jakarta text-sm font-medium rounded-sm border transition-all duration-200"
                    style={{
                        backgroundColor: p === current ? 'var(--color-violet)' : 'transparent',
                        borderColor: p === current ? 'var(--color-violet)' : 'var(--color-gray-light)',
                        color: p === current ? '#fff' : 'var(--color-charcoal)',
                    }}
                    aria-current={p === current ? 'page' : undefined}
                    aria-label={`Page ${p}`}
                >
                    {p}
                </button>
            ))}

            {visiblePages[visiblePages.length - 1] < total && (
                <>
                    {visiblePages[visiblePages.length - 1] < total - 1 && (
                        <span className="font-jakarta text-sm px-1" style={{ color: 'var(--color-gray-mid)' }}>…</span>
                    )}
                    <button
                        onClick={() => onChange(total)}
                        className="w-9 h-9 font-jakarta text-sm font-medium rounded-sm border transition-all duration-200"
                        style={{ borderColor: 'var(--color-gray-light)', color: 'var(--color-charcoal)' }}
                    >
                        {total}
                    </button>
                </>
            )}

            <button
                onClick={() => onChange(current + 1)}
                disabled={current === total}
                className="w-9 h-9 flex items-center justify-center rounded-sm border transition-all duration-200 disabled:opacity-30"
                style={{ borderColor: 'var(--color-gray-light)', color: 'var(--color-charcoal)' }}
                aria-label="Next page"
            >
                <ChevronRight size={14} />
            </button>
        </nav>
    );
}

// ─── MAIN ARCHIVE PAGE ────────────────────────────────────────────────────────

export default function ArchivePage() {
    const headerRef = useRef(null);
    const [publication, setPublication] = useState('All Publications');
    const [year, setYear] = useState('All Years');
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [articles, setArticles] = useState(FALLBACK_ARTICLES);

    // Attempt Directus fetch — fall back to static data on error
    useEffect(() => {
        let cancelled = false;
        async function fetchArchive() {
            try {
                const data = await directus.request(
                    readItems('articles', {
                        sort: ['-date'],
                        fields: ['id', 'title', 'publication', 'category', 'date', 'url', 'excerpt', 'image'],
                        limit: -1,
                    })
                );
                if (!cancelled && data && data.length > 0) {
                    setArticles(
                        data.map((a) => ({
                            ...a,
                            img: a.image
                                ? `${import.meta.env.VITE_DIRECTUS_URL}/assets/${a.image}`
                                : `https://picsum.photos/seed/${a.id}-archive/800/500`,
                        }))
                    );
                }
            } catch {
                // Silently fall back to placeholder data
            }
        }
        fetchArchive();
        return () => { cancelled = true; };
    }, []);

    // GSAP header reveal on mount
    useEffect(() => {
        const header = headerRef.current;
        if (!header) return;
        const ctx = gsap.context(() => {
            gsap.fromTo(
                header.querySelectorAll('.archive-reveal'),
                { opacity: 0, y: 44 },
                { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.12, delay: 0.1 }
            );
        }, header);
        return () => ctx.revert();
    }, []);

    // Filtering logic
    const filtered = useMemo(() => {
        return articles.filter((a) => {
            const pubMatch = publication === 'All Publications' || a.publication === publication;
            const yearMatch = year === 'All Years' || getYear(a.date) === year;
            const searchMatch =
                !search ||
                a.title.toLowerCase().includes(search.toLowerCase()) ||
                (a.excerpt && a.excerpt.toLowerCase().includes(search.toLowerCase())) ||
                (a.publication && a.publication.toLowerCase().includes(search.toLowerCase()));
            return pubMatch && yearMatch && searchMatch;
        });
    }, [articles, publication, year, search]);

    // Reset to page 1 on filter change
    useEffect(() => {
        setCurrentPage(1);
    }, [publication, year, search]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
    const paginated = filtered.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const hasActiveFilters =
        publication !== 'All Publications' || year !== 'All Years' || search !== '';

    function clearFilters() {
        setPublication('All Publications');
        setYear('All Years');
        setSearch('');
    }

    return (
        <div className="min-h-[100dvh] flex flex-col" style={{ backgroundColor: 'var(--color-white)' }}>
            <Navbar />

            <main className="flex-1 pt-24 pb-24">
                {/* Page header */}
                <header
                    ref={headerRef}
                    className="max-w-[1400px] mx-auto px-6 md:px-10 mb-14 relative"
                >
                    {/* Decorative periwinkle stripe */}
                    <div
                        className="absolute -left-2 top-2 w-40 h-20 pointer-events-none -z-10 rounded-sm"
                        style={{ backgroundColor: 'var(--color-periwinkle)', opacity: 0.18 }}
                        aria-hidden="true"
                    />

                    <p
                        className="archive-reveal font-jakarta text-[10px] uppercase tracking-[0.28em] font-semibold mb-4 pl-px"
                        style={{ color: 'var(--color-gray-mid)', opacity: 0 }}
                    >
                        Selected Work
                    </p>

                    <h1
                        className="archive-reveal font-cormorant font-medium leading-tight mb-5"
                        style={{
                            fontSize: 'clamp(3.5rem, 9vw, 7.5rem)',
                            color: 'var(--color-violet)',
                            opacity: 0,
                        }}
                    >
                        The Full{' '}
                        <span className="italic font-light">Archive</span>
                    </h1>

                    <p
                        className="archive-reveal font-jakarta text-base leading-relaxed max-w-xl"
                        style={{ color: 'var(--color-gray-mid)', opacity: 0 }}
                    >
                        A comprehensive collection of interviews, reviews, and cultural commentary spanning years of entertainment journalism.
                    </p>
                </header>

                {/* Filter bar */}
                <section
                    className="max-w-[1400px] mx-auto px-6 md:px-10 mb-12"
                    aria-label="Filter articles"
                >
                    <div
                        className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between p-4 rounded-sm"
                        style={{
                            backgroundColor: '#FAFAFE',
                            border: '1px solid var(--color-gray-light)',
                        }}
                    >
                        {/* Left: dropdowns */}
                        <div className="flex flex-wrap gap-3 items-center">
                            <FilterSelect
                                label="Filter by publication"
                                value={publication}
                                options={PUBLICATIONS}
                                onChange={setPublication}
                            />
                            <FilterSelect
                                label="Filter by year"
                                value={year}
                                options={YEARS}
                                onChange={setYear}
                            />
                            {hasActiveFilters && (
                                <button
                                    onClick={clearFilters}
                                    className="flex items-center gap-1 font-jakarta text-xs font-medium px-3 py-2 rounded-sm transition-all duration-200 hover:opacity-80"
                                    style={{ color: 'var(--color-violet)' }}
                                    aria-label="Clear all filters"
                                >
                                    <X size={10} />
                                    Clear
                                </button>
                            )}
                        </div>

                        {/* Right: search */}
                        <div className="relative w-full md:w-64">
                            <Search
                                size={13}
                                className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                                style={{ color: 'var(--color-gray-mid)' }}
                                aria-hidden="true"
                            />
                            <input
                                type="search"
                                placeholder="Search articles…"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full font-jakarta text-sm pl-9 pr-4 py-2.5 rounded-sm border bg-white transition-all duration-200 focus:outline-none focus:ring-2"
                                style={{
                                    borderColor: search ? 'var(--color-violet)' : 'var(--color-gray-light)',
                                    color: 'var(--color-charcoal)',
                                }}
                                aria-label="Search articles"
                            />
                        </div>
                    </div>

                    {/* Results count */}
                    <p
                        className="font-jakarta text-xs mt-3 pl-0.5"
                        style={{ color: 'var(--color-gray-mid)' }}
                    >
                        {filtered.length} {filtered.length === 1 ? 'article' : 'articles'}
                        {hasActiveFilters ? ' matching your filters' : ' total'}
                    </p>
                </section>

                {/* Article grid */}
                <section className="max-w-[1400px] mx-auto px-6 md:px-10" aria-label="Article list">
                    {paginated.length > 0 ? (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
                                {paginated.map((article, i) => (
                                    <ArticleCard
                                        key={`${article.id}-${currentPage}`}
                                        article={article}
                                        index={i}
                                    />
                                ))}
                            </div>

                            {totalPages > 1 && (
                                <Pagination
                                    current={currentPage}
                                    total={totalPages}
                                    onChange={(p) => {
                                        setCurrentPage(p);
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                />
                            )}
                        </>
                    ) : (
                        /* Empty state */
                        <div className="flex flex-col items-center justify-center py-32 text-center">
                            <div
                                className="w-16 h-px mb-8 mx-auto"
                                style={{ backgroundColor: 'var(--color-periwinkle)' }}
                                aria-hidden="true"
                            />
                            <p
                                className="font-cormorant font-light italic mb-3"
                                style={{ fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', color: 'var(--color-violet)' }}
                            >
                                No articles found.
                            </p>
                            <p
                                className="font-jakarta text-sm mb-8 max-w-sm leading-relaxed"
                                style={{ color: 'var(--color-gray-mid)' }}
                            >
                                Try adjusting your filters or clearing your search to see more.
                            </p>
                            <button
                                onClick={clearFilters}
                                className="font-jakarta text-xs font-semibold uppercase tracking-widest px-5 py-2.5 rounded-sm border transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                                style={{ borderColor: 'var(--color-violet)', color: 'var(--color-violet)' }}
                            >
                                Clear all filters
                            </button>
                        </div>
                    )}
                </section>
            </main>

            <Footer />
        </div>
    );
}
