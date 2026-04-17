import React, { useRef, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { gsap } from 'gsap';
import { Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, Send, CheckCircle } from 'lucide-react';
import Navbar from '../components/Navbar/Navbar';
import Footer from '../container/Footer/Footer';

// ─── Availability Slots ────────────────────────────────────────────────────────
// You can swap these out for a real CMS / Calendly integration later.
const SLOTS = [
    // { day: 'Monday 10 Mar', times: ['10:00 AM', '2:00 PM', '4:30 PM'] },
    // { day: 'Tuesday 11 Mar', times: ['11:00 AM', '3:00 PM'] },
];

// ─── Form submit handler ───────────────────────────────────────────────────────
async function sendBooking({ name, email, reason, slot }) {
    // Replace with your own API / EmailJS / Formspree endpoint
    console.log('Booking submitted:', { name, email, reason, slot });
    return new Promise((resolve) => setTimeout(resolve, 800)); // mock delay
}

// ─── Single slot pill ─────────────────────────────────────────────────────────
SlotPill.propTypes = {
    label: PropTypes.string.isRequired,
    selected: PropTypes.bool.isRequired,
    onSelect: PropTypes.func.isRequired,
};

function SlotPill({ label, selected, onSelect }) {
    return (
        <button
            type="button"
            onClick={onSelect}
            className="flex items-center gap-1.5 font-ui uppercase transition-all duration-200"
            style={{
                fontSize: '0.65rem',
                letterSpacing: '0.08em',
                fontWeight: 600,
                padding: '0.35rem 0.75rem',
                borderRadius: '2px',
                border: '1px solid',
                borderColor: selected ? 'var(--color-gold)' : 'rgba(26,26,26,0.15)',
                backgroundColor: selected ? 'var(--color-gold)' : 'transparent',
                color: selected ? 'var(--color-charcoal)' : 'var(--color-charcoal)',
            }}
            aria-pressed={selected}
        >
            <Clock size={10} aria-hidden="true" />
            {label}
        </button>
    );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function BookPage() {
    const pageRef = useRef(null);
    const headingRef = useRef(null);

    const [selectedSlot, setSelectedSlot] = useState(null); // "Day · Time"
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [reason, setReason] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    // ── GSAP entrance ─────────────────────────────────────────────────────────
    useEffect(() => {
        const ctx = gsap.context(() => {
            const targets = pageRef.current?.querySelectorAll('.book-reveal');
            if (!targets?.length) return;
            gsap.fromTo(
                targets,
                { opacity: 0, y: 36 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 0.85,
                    ease: 'power3.out',
                    stagger: 0.1,
                    delay: 0.15,
                }
            );
        }, pageRef);
        return () => ctx.revert();
    }, []);

    // ── Submit ─────────────────────────────────────────────────────────────────
    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        if (!name.trim() || !email.trim() || !reason.trim()) {
            setError('Please fill in all fields.');
            return;
        }
        setSubmitting(true);
        try {
            await sendBooking({ name, email, reason, slot: selectedSlot });
            setSubmitted(true);
        } catch {
            setError('Something went wrong. Please try again or email directly.');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="min-h-[100dvh] flex flex-col" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
            <Navbar />

            <main className="flex-1 pt-28 pb-24" ref={pageRef}>
                <div className="max-w-[1160px] mx-auto px-6 md:px-10">

                    {/* ── Back link ───────────────────────────────────────────────── */}
                    <Link
                        to="/"
                        className="book-reveal inline-flex items-center gap-1.5 font-ui uppercase mb-10 transition-all duration-200 hover:opacity-60"
                        style={{ fontSize: '0.65rem', letterSpacing: '0.1em', fontWeight: 600, color: 'var(--color-charcoal)', opacity: 0 }}
                        aria-label="Back to home"
                    >
                        <ArrowLeft size={11} />
                        Back
                    </Link>

                    {/* ── Eyebrow ─────────────────────────────────────────────────── */}
                    <div className="flex items-center gap-3 mb-4">
                        <span className="inline-block w-6 h-px" style={{ backgroundColor: 'var(--color-gold)' }} aria-hidden="true" />
                        <p
                            className="book-reveal font-ui uppercase"
                            style={{ fontSize: '0.6rem', letterSpacing: '0.3em', fontWeight: 600, color: 'var(--color-gold)', opacity: 0 }}
                        >
                            Book a Call
                        </p>
                    </div>

                    {/* ── Heading ─────────────────────────────────────────────────── */}
                    <h1
                        ref={headingRef}
                        className="book-reveal font-serif font-bold leading-[1.02] mb-4"
                        style={{
                            fontSize: 'clamp(3rem, 7vw, 5.5rem)',
                            color: 'var(--color-charcoal)',
                            letterSpacing: '-0.03em',
                            opacity: 0,
                        }}
                    >
                        Let&apos;s talk
                    </h1>

                    {/* ── Subheading ──────────────────────────────────────────────── */}
                    <p
                        className="book-reveal font-sans text-sm leading-relaxed max-w-[52ch] mb-14"
                        style={{ color: 'var(--color-text-secondary)', fontWeight: 300, opacity: 0 }}
                    >
                        Select a time slot below and tell me a little about what you&apos;d like to discuss.
                    </p>

                    {/* ── Divider ─────────────────────────────────────────────────── */}
                    <div
                        className="book-reveal w-full h-px mb-12"
                        style={{ backgroundColor: 'rgba(26,26,26,0.1)', opacity: 0 }}
                        aria-hidden="true"
                    />

                    {/* ── Two-column layout ───────────────────────────────────────── */}
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.6fr] gap-12 lg:gap-20">

                        {/* ── LEFT: Available Slots ────────────────────────────────── */}
                        <div className="book-reveal" style={{ opacity: 0 }}>
                            <h2
                                className="font-ui uppercase mb-5"
                                style={{ fontSize: '0.65rem', letterSpacing: '0.15em', fontWeight: 600, color: 'var(--color-charcoal)', opacity: 0.7 }}
                            >
                                Available Slots
                            </h2>

                            {SLOTS.length === 0 ? (
                                <p
                                    className="font-sans text-sm leading-relaxed"
                                    style={{ color: 'var(--color-text-secondary)', fontWeight: 300 }}
                                >
                                    No slots available at the moment. Please check back later.<br />
                                    In the meantime, feel free to email me directly.
                                </p>
                            ) : (
                                <div className="flex flex-col gap-5">
                                    {SLOTS.map(({ day, times }) => (
                                        <div key={day}>
                                            <div className="flex items-center gap-2 mb-2">
                                                <Calendar size={11} style={{ color: 'var(--color-gold)' }} aria-hidden="true" />
                                                <span
                                                    className="font-ui uppercase"
                                                    style={{ fontSize: '0.6rem', letterSpacing: '0.1em', fontWeight: 600, color: 'var(--color-charcoal)' }}
                                                >
                                                    {day}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {times.map((t) => {
                                                    const key = `${day} · ${t}`;
                                                    return (
                                                        <SlotPill
                                                            key={key}
                                                            label={t}
                                                            selected={selectedSlot === key}
                                                            onSelect={() => setSelectedSlot(selectedSlot === key ? null : key)}
                                                        />
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Decorative gold rule */}
                            <div
                                className="hidden lg:block mt-16 w-20 h-[2px]"
                                style={{ backgroundColor: 'var(--color-gold)', opacity: 0.6 }}
                                aria-hidden="true"
                            />
                        </div>

                        {/* ── RIGHT: Booking Form ──────────────────────────────────── */}
                        <div className="book-reveal" style={{ opacity: 0 }}>
                            {submitted ? (
                                /* ── Success state ────────────────────────────────── */
                                <div className="flex flex-col items-start gap-5 py-6">
                                    <div
                                        className="w-12 h-12 flex items-center justify-center"
                                        style={{ backgroundColor: 'var(--color-gold)', borderRadius: '2px' }}
                                    >
                                        <CheckCircle size={22} style={{ color: 'var(--color-charcoal)' }} />
                                    </div>
                                    <h2
                                        className="font-serif font-bold leading-tight"
                                        style={{ fontSize: 'clamp(1.8rem, 4vw, 2.75rem)', color: 'var(--color-charcoal)', letterSpacing: '-0.02em' }}
                                    >
                                        Booking received.
                                    </h2>
                                    <p
                                        className="font-sans text-sm leading-relaxed max-w-[42ch]"
                                        style={{ color: 'var(--color-text-secondary)', fontWeight: 300 }}
                                    >
                                        Thank you, {name.split(' ')[0]}. I&apos;ll be in touch shortly to confirm your slot.
                                        {selectedSlot && ` You've requested: ${selectedSlot}.`}
                                    </p>
                                    <Link
                                        to="/"
                                        className="inline-flex items-center gap-1.5 font-ui uppercase px-5 py-2.5 border transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] mt-2"
                                        style={{ fontSize: '0.7rem', letterSpacing: '0.1em', fontWeight: 600, borderColor: 'var(--color-charcoal)', color: 'var(--color-charcoal)', borderRadius: '2px' }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = 'var(--color-gold)';
                                            e.currentTarget.style.borderColor = 'var(--color-gold)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = 'transparent';
                                            e.currentTarget.style.borderColor = 'var(--color-charcoal)';
                                        }}
                                    >
                                        Back to portfolio
                                    </Link>
                                </div>
                            ) : (
                                /* ── Form ────────────────────────────────────────── */
                                <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
                                    {/* Name */}
                                    <div className="flex flex-col gap-1.5">
                                        <label
                                            htmlFor="book-name"
                                            className="font-ui uppercase"
                                            style={{ fontSize: '0.6rem', letterSpacing: '0.1em', fontWeight: 600, color: 'var(--color-charcoal)', opacity: 0.7 }}
                                        >
                                            Name
                                        </label>
                                        <input
                                            id="book-name"
                                            type="text"
                                            placeholder="Your full name"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            required
                                            className="w-full font-sans text-sm px-4 py-3 transition-all duration-200 focus:outline-none"
                                            style={{
                                                border: '1px solid rgba(26,26,26,0.15)',
                                                borderRadius: '2px',
                                                backgroundColor: 'var(--color-bg-secondary)',
                                                color: 'var(--color-charcoal)',
                                            }}
                                        />
                                    </div>

                                    {/* Email */}
                                    <div className="flex flex-col gap-1.5">
                                        <label
                                            htmlFor="book-email"
                                            className="font-ui uppercase"
                                            style={{ fontSize: '0.6rem', letterSpacing: '0.1em', fontWeight: 600, color: 'var(--color-charcoal)', opacity: 0.7 }}
                                        >
                                            Email
                                        </label>
                                        <input
                                            id="book-email"
                                            type="email"
                                            placeholder="you@example.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            className="w-full font-sans text-sm px-4 py-3 transition-all duration-200 focus:outline-none"
                                            style={{
                                                border: '1px solid rgba(26,26,26,0.15)',
                                                borderRadius: '2px',
                                                backgroundColor: 'var(--color-bg-secondary)',
                                                color: 'var(--color-charcoal)',
                                            }}
                                        />
                                    </div>

                                    {/* Reason */}
                                    <div className="flex flex-col gap-1.5">
                                        <label
                                            htmlFor="book-reason"
                                            className="font-ui uppercase"
                                            style={{ fontSize: '0.6rem', letterSpacing: '0.1em', fontWeight: 600, color: 'var(--color-charcoal)', opacity: 0.7 }}
                                        >
                                            Reason for call
                                        </label>
                                        <textarea
                                            id="book-reason"
                                            rows={5}
                                            placeholder="Brief description of what you'd like to discuss…"
                                            value={reason}
                                            onChange={(e) => setReason(e.target.value)}
                                            required
                                            className="w-full font-sans text-sm px-4 py-3 resize-y transition-all duration-200 focus:outline-none"
                                            style={{
                                                border: '1px solid rgba(26,26,26,0.15)',
                                                borderRadius: '2px',
                                                backgroundColor: 'var(--color-bg-secondary)',
                                                color: 'var(--color-charcoal)',
                                                minHeight: '120px',
                                            }}
                                        />
                                    </div>

                                    {/* Selected slot indicator */}
                                    {selectedSlot && (
                                        <p
                                            className="font-ui"
                                            style={{ fontSize: '0.65rem', letterSpacing: '0.05em', color: 'var(--color-gold)' }}
                                        >
                                            <span className="font-semibold">Selected slot:</span> {selectedSlot}
                                        </p>
                                    )}

                                    {/* Error */}
                                    {error && (
                                        <p
                                            className="font-sans text-xs"
                                            style={{ color: 'var(--color-coral)' }}
                                            role="alert"
                                        >
                                            {error}
                                        </p>
                                    )}

                                    {/* Submit */}
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="self-start inline-flex items-center gap-2 font-ui uppercase px-7 py-3.5 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                                        style={{
                                            fontSize: '0.7rem',
                                            letterSpacing: '0.1em',
                                            fontWeight: 600,
                                            backgroundColor: 'var(--color-charcoal)',
                                            color: '#fff',
                                            borderRadius: '2px',
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!submitting) {
                                                e.currentTarget.style.backgroundColor = 'var(--color-gold)';
                                                e.currentTarget.style.color = 'var(--color-charcoal)';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = 'var(--color-charcoal)';
                                            e.currentTarget.style.color = '#fff';
                                        }}
                                    >
                                        {submitting ? (
                                            <>Sending…</>
                                        ) : (
                                            <>
                                                Submit Booking
                                                <Send size={11} aria-hidden="true" />
                                            </>
                                        )}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
