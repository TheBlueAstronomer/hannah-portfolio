import React, { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

// ─── Service data ──────────────────────────────────────────────────────────────
const SERVICES = [
    {
        id: '01',
        title: 'Cultural Consultant',
        description:
            'Strategic cultural advisory for brands, organisations, and creative projects. Helping you navigate the cultural landscape with authenticity and impact.',
    },
    {
        id: '02',
        title: 'Speaker',
        description:
            'Engaging keynotes and panel contributions on entertainment, media, diversity, and cultural strategy at industry events worldwide.',
    },
    {
        id: '03',
        title: 'Host',
        description:
            'Professional hosting and moderation for events, launches, and conversations — bringing editorial sensibility to live experiences.',
    },
    {
        id: '04',
        title: 'PR Consultant',
        description:
            'Media strategy and public relations consulting for entertainment professionals and cultural brands seeking meaningful coverage.',
    },
    {
        id: '05',
        title: 'Media Training',
        description:
            'One-on-one and group media training sessions for executives, artists, and public figures preparing for press, interviews, and public appearances.',
    },
];

// ─── Individual service row ────────────────────────────────────────────────────
function ServiceRow({ service, rowRef }) {
    return (
        <div
            ref={rowRef}
            className="service-row"
            aria-label={`Service: ${service.title}`}
        >
            {/* Top separator */}
            <div className="service-row__divider" aria-hidden="true" />

            {/* Row content */}
            <div className="service-row__inner">
                {/* Number */}
                <span className="service-row__number" aria-hidden="true">
                    {service.id}
                </span>

                {/* Title */}
                <h3 className="service-row__title">{service.title}</h3>

                {/* Description + CTA */}
                <div className="service-row__right">
                    <p className="service-row__desc">{service.description}</p>
                    <Link
                        to="/book"
                        className="service-row__cta"
                        aria-label={`Book ${service.title}`}
                    >
                        <span>Book</span>
                        <ArrowRight size={13} strokeWidth={1.5} aria-hidden="true" />
                    </Link>
                </div>
            </div>
        </div>
    );
}

// ─── Main Services section ─────────────────────────────────────────────────────
export default function Services() {
    const sectionRef = useRef(null);
    const stickyRef = useRef(null);
    const headerRef = useRef(null);
    const rowRefs = useRef([]);

    useEffect(() => {
        const ctx = gsap.context(() => {
            const rows = rowRefs.current.filter(Boolean);
            if (!rows.length) return;

            // Set all rows invisible + below viewport initially
            gsap.set(rows, { yPercent: 110, opacity: 0 });

            // Build a single scrubbed timeline: reveal each row in sequence
            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: sectionRef.current,
                    start: 'top top',
                    // Each service gets ~60vh of scroll budget so the animation is deliberate
                    end: `+=${rows.length * 60}vh`,
                    pin: stickyRef.current,
                    pinSpacing: true,
                    scrub: 1.2,
                    anticipatePin: 1,
                },
            });

            rows.forEach((row) => {
                tl.to(
                    row,
                    {
                        yPercent: 0,
                        opacity: 1,
                        duration: 1,
                        ease: 'power3.out',
                    },
                    // Stagger each row by a consistent offset so they don't all overlap
                    `>-0.1`
                );

                // Hold the position for a scroll "beat" before the next row arrives
                tl.to({}, { duration: 0.5 });
            });
        }, sectionRef);

        return () => ctx.revert();
    }, []);

    return (
        <section
            id="services"
            ref={sectionRef}
            className="services-section"
            aria-label="Services"
        >
            {/* Sticky container — this is what gets pinned by GSAP */}
            <div ref={stickyRef} className="services-sticky">
                <div className="services-inner">
                    {/* ── Section header ─────────────────────────────────── */}
                    <div ref={headerRef} className="services-header">
                        <span className="services-header__eyebrow">Services</span>
                        <h2 className="services-header__heading">
                            Consulting, speaking{' '}
                            <span className="services-header__amp">&amp;</span> beyond
                        </h2>
                        <p className="services-header__sub">
                            Bringing editorial insight and cultural fluency to every engagement.
                        </p>
                    </div>

                    {/* ── Service rows ────────────────────────────────────── */}
                    <div className="services-rows" aria-label="List of services">
                        {SERVICES.map((service, i) => (
                            <ServiceRow
                                key={service.id}
                                service={service}
                                rowRef={(el) => (rowRefs.current[i] = el)}
                            />
                        ))}
                        {/* Bottom divider after final row */}
                        <div className="service-row__divider" aria-hidden="true" />
                    </div>
                </div>
            </div>
        </section>
    );
}
