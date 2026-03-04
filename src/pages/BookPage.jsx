import React, { useRef, useEffect, useState } from 'react';
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
function SlotPill({ label, selected, onSelect }) {
    return (
        <button
            type="button"
            onClick={onSelect}
            className="flex items-center gap-1.5 font-jakarta text-xs font-medium px-3 py-1.5 rounded-sm border transition-all duration-200"
            style={{
                borderColor: selected ? 'var(--color-violet)' : 'var(--color-gray-light)',
                backgroundColor: selected ? 'var(--color-violet)' : 'transparent',
                color: selected ? '#fff' : 'var(--color-charcoal)',
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
        <div className="min-h-[100dvh] flex flex-col" style={{ backgroundColor: 'var(--color-white)' }}>
            <Navbar />

            <main className="flex-1 pt-28 pb-24" ref={pageRef}>
                <div className="max-w-[1160px] mx-auto px-6 md:px-10">

                    {/* ── Back link ───────────────────────────────────────────────── */}
                    <Link
                        to="/"
                        className="book-reveal inline-flex items-center gap-1.5 font-jakarta text-xs uppercase tracking-[0.2em] font-medium mb-10 transition-opacity duration-200 hover:opacity-60"
                        style={{ color: 'var(--color-violet)', opacity: 0 }}
                        aria-label="Back to home"
                    >
                        <ArrowLeft size={11} />
                        Back
                    </Link>

                    {/* ── Eyebrow ─────────────────────────────────────────────────── */}
                    <p
                        className="book-reveal font-jakarta text-[10px] uppercase tracking-[0.3em] font-semibold mb-3"
                        style={{ color: 'var(--color-violet)', opacity: 0 }}
                    >
                        Book a Call
                    </p>

                    {/* ── Heading ─────────────────────────────────────────────────── */}
                    <h1
                        ref={headingRef}
                        className="book-reveal font-cormorant font-bold leading-[1.02] mb-4"
                        style={{
                            fontSize: 'clamp(3rem, 7vw, 5.5rem)',
                            color: 'var(--color-charcoal)',
                            opacity: 0,
                        }}
                    >
                        Let&apos;s talk
                    </h1>

                    {/* ── Subheading ──────────────────────────────────────────────── */}
                    <p
                        className="book-reveal font-jakarta text-sm leading-relaxed max-w-[52ch] mb-14"
                        style={{ color: 'var(--color-gray-mid)', opacity: 0 }}
                    >
                        Select a time slot below and tell me a little about what you&apos;d like to discuss.
                    </p>

                    {/* ── Divider ─────────────────────────────────────────────────── */}
                    <div
                        className="book-reveal w-full h-px mb-12"
                        style={{ backgroundColor: 'var(--color-periwinkle)', opacity: 0 }}
                        aria-hidden="true"
                    />

                    {/* ── Two-column layout ───────────────────────────────────────── */}
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.6fr] gap-12 lg:gap-20">

                        {/* ── LEFT: Available Slots ────────────────────────────────── */}
                        <div className="book-reveal" style={{ opacity: 0 }}>
                            <h2
                                className="font-jakarta text-xs uppercase tracking-[0.22em] font-semibold mb-5"
                                style={{ color: 'var(--color-charcoal)' }}
                            >
                                Available Slots
                            </h2>

                            {SLOTS.length === 0 ? (
                                <p
                                    className="font-jakarta text-sm leading-relaxed"
                                    style={{ color: 'var(--color-gray-mid)' }}
                                >
                                    No slots available at the moment. Please check back later.<br />
                                    In the meantime, feel free to email me directly.
                                </p>
                            ) : (
                                <div className="flex flex-col gap-5">
                                    {SLOTS.map(({ day, times }) => (
                                        <div key={day}>
                                            <div className="flex items-center gap-2 mb-2">
                                                <Calendar size={11} style={{ color: 'var(--color-violet)' }} aria-hidden="true" />
                                                <span
                                                    className="font-jakarta text-[11px] font-semibold uppercase tracking-widest"
                                                    style={{ color: 'var(--color-violet)' }}
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

                            {/* Decorative periwinkle block */}
                            <div
                                className="hidden lg:block mt-16 w-20 h-1 rounded-sm"
                                style={{ backgroundColor: 'var(--color-periwinkle)' }}
                                aria-hidden="true"
                            />
                        </div>

                        {/* ── RIGHT: Booking Form ──────────────────────────────────── */}
                        <div className="book-reveal" style={{ opacity: 0 }}>
                            {submitted ? (
                                /* ── Success state ────────────────────────────────── */
                                <div className="flex flex-col items-start gap-5 py-6">
                                    <div
                                        className="w-12 h-12 rounded-sm flex items-center justify-center"
                                        style={{ backgroundColor: 'var(--color-periwinkle)', opacity: 0.8 }}
                                    >
                                        <CheckCircle size={22} style={{ color: 'var(--color-violet)' }} />
                                    </div>
                                    <h2
                                        className="font-cormorant font-bold leading-tight"
                                        style={{ fontSize: 'clamp(1.8rem, 4vw, 2.75rem)', color: 'var(--color-charcoal)' }}
                                    >
                                        Booking received.
                                    </h2>
                                    <p
                                        className="font-jakarta text-sm leading-relaxed max-w-[42ch]"
                                        style={{ color: 'var(--color-gray-mid)' }}
                                    >
                                        Thank you, {name.split(' ')[0]}. I&apos;ll be in touch shortly to confirm your slot.
                                        {selectedSlot && ` You've requested: ${selectedSlot}.`}
                                    </p>
                                    <Link
                                        to="/"
                                        className="inline-flex items-center gap-1.5 font-jakarta text-xs font-semibold uppercase tracking-widest px-5 py-2.5 rounded-sm border transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] mt-2"
                                        style={{ borderColor: 'var(--color-violet)', color: 'var(--color-violet)' }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = 'var(--color-violet)';
                                            e.currentTarget.style.color = '#fff';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = 'transparent';
                                            e.currentTarget.style.color = 'var(--color-violet)';
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
                                            className="font-jakarta text-xs font-medium"
                                            style={{ color: 'var(--color-charcoal)' }}
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
                                            className="w-full font-jakarta text-sm px-4 py-3 rounded-sm border bg-white transition-all duration-200 focus:outline-none focus:ring-2"
                                            style={{
                                                borderColor: 'var(--color-gray-light)',
                                                color: 'var(--color-charcoal)',
                                                focusRingColor: 'var(--color-periwinkle)',
                                            }}
                                        />
                                    </div>

                                    {/* Email */}
                                    <div className="flex flex-col gap-1.5">
                                        <label
                                            htmlFor="book-email"
                                            className="font-jakarta text-xs font-medium"
                                            style={{ color: 'var(--color-violet)' }}
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
                                            className="w-full font-jakarta text-sm px-4 py-3 rounded-sm border bg-white transition-all duration-200 focus:outline-none focus:ring-2"
                                            style={{
                                                borderColor: 'var(--color-gray-light)',
                                                color: 'var(--color-charcoal)',
                                            }}
                                        />
                                    </div>

                                    {/* Reason */}
                                    <div className="flex flex-col gap-1.5">
                                        <label
                                            htmlFor="book-reason"
                                            className="font-jakarta text-xs font-medium"
                                            style={{ color: 'var(--color-violet)' }}
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
                                            className="w-full font-jakarta text-sm px-4 py-3 rounded-sm border bg-white resize-y transition-all duration-200 focus:outline-none focus:ring-2"
                                            style={{
                                                borderColor: 'var(--color-gray-light)',
                                                color: 'var(--color-charcoal)',
                                                minHeight: '120px',
                                            }}
                                        />
                                    </div>

                                    {/* Selected slot indicator */}
                                    {selectedSlot && (
                                        <p
                                            className="font-jakarta text-xs"
                                            style={{ color: 'var(--color-violet)' }}
                                        >
                                            <span className="font-semibold">Selected slot:</span> {selectedSlot}
                                        </p>
                                    )}

                                    {/* Error */}
                                    {error && (
                                        <p
                                            className="font-jakarta text-xs"
                                            style={{ color: '#c0392b' }}
                                            role="alert"
                                        >
                                            {error}
                                        </p>
                                    )}

                                    {/* Submit */}
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="self-start inline-flex items-center gap-2 font-jakarta text-xs font-semibold uppercase tracking-widest px-7 py-3.5 rounded-sm transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                                        style={{
                                            backgroundColor: 'var(--color-charcoal)',
                                            color: '#fff',
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!submitting) e.currentTarget.style.backgroundColor = 'var(--color-violet)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = 'var(--color-charcoal)';
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
