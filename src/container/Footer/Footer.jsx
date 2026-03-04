import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { ArrowRight, Linkedin, Twitter, Instagram, Mail } from 'lucide-react';
import { useSiteSettings } from '../../hooks/useDirectus';

// ─── Fallback content ──────────────────────────────────────────────────────────

const FALLBACK = {
  email: 'mailto:hannah@example.com',
  contactDescription:
    'Available for features, interviews, film criticism, cultural commentary, and long-form investigative journalism.',
  linkedin: 'https://www.linkedin.com/in/hannahrachelabraham/',
  twitter: 'https://twitter.com/HAN_NA_NA_NAH',
  instagram: 'https://www.instagram.com/han_na_na_nah/',
  isAvailable: true,
};

// ─── Icon map — Lucide component per CMS social key ───────────────────────────

const SOCIAL_ICON_MAP = {
  linkedin: Linkedin,
  twitter: Twitter,
  instagram: Instagram,
};

// Magnetic button — uses Framer Motion useMotionValue outside render cycle
function MagneticButton({ children, href, to, outline, className, style }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 150, damping: 15 });
  const springY = useSpring(y, { stiffness: 150, damping: 15 });

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set((e.clientX - centerX) * 0.28);
    y.set((e.clientY - centerY) * 0.28);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const sharedProps = {
    onMouseMove: handleMouseMove,
    onMouseLeave: handleMouseLeave,
    style: { x: springX, y: springY, ...style },
    className: `group relative inline-flex items-center gap-2 font-jakarta text-sm font-semibold uppercase tracking-widest px-8 py-4 rounded-sm overflow-hidden transition-all duration-300 ${className}`,
    whileTap: { scale: 0.97 },
  };

  const inner = (
    <>
      {/* Sliding background fill */}
      <span
        className="absolute inset-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-spring-bounce"
        style={{ backgroundColor: outline ? 'var(--color-violet)' : 'rgba(255,255,255,0.12)' }}
        aria-hidden="true"
      />
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </>
  );

  if (to) {
    return (
      <motion.div style={{ x: springX, y: springY }} whileTap={{ scale: 0.97 }} className="inline-flex">
        <Link
          to={to}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className={`group relative inline-flex items-center gap-2 font-jakarta text-sm font-semibold uppercase tracking-widest px-8 py-4 rounded-sm overflow-hidden transition-all duration-300 ${className ?? ''}`}
          style={style}
        >
          {inner}
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.a
      href={href}
      {...sharedProps}
    >
      {inner}
    </motion.a>
  );
}

const NAV_FOOTER = [
  { label: 'Work', href: '#work', isAnchor: true },
  { label: 'Archive', href: '/archive', isAnchor: false },
  { label: 'About', href: '#about', isAnchor: true },
  { label: 'Contact', href: '#contact', isAnchor: true },
];

export default function Footer() {
  const { settings } = useSiteSettings();

  // Resolve values — CMS first, fallback second
  const email = settings?.contact_email ? `mailto:${settings.contact_email}` : FALLBACK.email;
  const contactDesc = settings?.contact_description || FALLBACK.contactDescription;
  const isAvailable = settings?.hero_availability ?? FALLBACK.isAvailable;
  const availabilityText = isAvailable ? 'Open For Commissions' : 'Currently Unavailable';

  // Build dynamic social link list from CMS fields
  const socialLinks = [
    {
      key: 'linkedin',
      label: 'LinkedIn',
      href: settings?.social_linkedin || FALLBACK.linkedin,
      icon: Linkedin,
    },
    {
      key: 'twitter',
      label: 'Twitter / X',
      href: settings?.social_twitter || FALLBACK.twitter,
      icon: Twitter,
    },
    {
      key: 'instagram',
      label: 'Instagram',
      href: settings?.social_instagram || FALLBACK.instagram,
      icon: Instagram,
    },
    {
      key: 'mail',
      label: 'Email',
      href: email,
      icon: Mail,
    },
  ];

  return (
    <footer
      id="contact"
      className="relative"
      style={{ backgroundColor: 'var(--color-charcoal)' }}
      aria-label="Footer and Contact"
    >
      {/* Rounded top — editorial device */}
      <div
        className="absolute -top-px left-0 right-0 h-16 pointer-events-none"
        style={{
          backgroundColor: 'var(--color-charcoal)',
          borderRadius: '4rem 4rem 0 0',
        }}
        aria-hidden="true"
      />

      {/* CTA Section */}
      <div
        className="relative pt-24 pb-16 px-6 md:px-10 max-w-[1400px] mx-auto"
        style={{ borderBottom: '1px solid rgba(195,192,216,0.15)' }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-end">
          <div>
            {/* Availability label — CMS-driven */}
            <span
              className="font-jakarta text-xs uppercase tracking-[0.3em] font-semibold block mb-5"
              style={{ color: 'rgba(195,192,216,0.6)' }}
            >
              — {availabilityText}
            </span>
            <h2
              className="font-cormorant font-bold leading-tight"
              style={{
                fontSize: 'clamp(2.5rem, 6vw, 5rem)',
                color: '#FFFFFF',
              }}
            >
              Let&rsquo;s build the
              <br />
              <span
                className="italic font-light"
                style={{ color: 'var(--color-periwinkle)' }}
              >
                story together.
              </span>
            </h2>
          </div>

          <div className="flex flex-col gap-5 items-start lg:items-end">
            {/* Contact description — from CMS */}
            <p
              className="font-jakarta text-sm leading-relaxed max-w-[40ch] lg:text-right"
              style={{ color: 'rgba(255,255,255,0.5)' }}
            >
              {contactDesc}
            </p>
            <div className="flex flex-wrap gap-4">
              {/* Primary CTA — solid white, email from CMS */}
              <MagneticButton
                to="/book"
                style={{ backgroundColor: '#fff', color: 'var(--color-charcoal)' }}
              >
                Start a Project
                <ArrowRight size={13} />
              </MagneticButton>

              {/* Secondary CTA — outline */}
              <MagneticButton
                href="#work"
                outline
                style={{
                  border: '1px solid rgba(195,192,216,0.5)',
                  color: 'var(--color-periwinkle)',
                }}
              >
                View Portfolio
              </MagneticButton>
            </div>
          </div>
        </div>
      </div>

      {/* Footer base */}
      <div className="px-6 md:px-10 max-w-[1400px] mx-auto pt-10 pb-12">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          {/* Logo */}
          <div className="flex flex-col gap-1">
            <span
              className="font-cormorant font-bold italic text-2xl leading-none"
              style={{ color: 'var(--color-periwinkle)' }}
            >
              Hannah Abraham
            </span>
            <span
              className="font-jakarta text-[10px] uppercase tracking-[0.25em]"
              style={{ color: 'rgba(255,255,255,0.3)' }}
            >
              Entertainment Journalist
            </span>
          </div>

          {/* Nav links */}
          <nav aria-label="Footer navigation">
            <ul className="flex items-center gap-6" role="list">
              {NAV_FOOTER.map((item) => (
                <li key={item.label}>
                  {item.isAnchor ? (
                    <a
                      href={item.href}
                      className="font-jakarta text-xs uppercase tracking-widest font-medium transition-colors duration-200"
                      style={{ color: 'rgba(255,255,255,0.45)' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-periwinkle)')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}
                    >
                      {item.label}
                    </a>
                  ) : (
                    <Link
                      to={item.href}
                      className="font-jakarta text-xs uppercase tracking-widest font-medium transition-colors duration-200"
                      style={{ color: 'rgba(255,255,255,0.45)' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-periwinkle)')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}
                    >
                      {item.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          {/* Social icons — from CMS */}
          <div className="flex items-center gap-3">
            {socialLinks.map(({ key, icon: Icon, href, label }) => (
              <a
                key={key}
                href={href}
                target={href.startsWith('http') ? '_blank' : undefined}
                rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                className="w-8 h-8 flex items-center justify-center rounded-sm border transition-all duration-200"
                style={{
                  borderColor: 'rgba(195,192,216,0.25)',
                  color: 'rgba(255,255,255,0.5)',
                }}
                aria-label={label}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-periwinkle)';
                  e.currentTarget.style.color = 'var(--color-periwinkle)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(195,192,216,0.25)';
                  e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
                }}
              >
                <Icon size={13} />
              </a>
            ))}
          </div>
        </div>

        {/* Copyright */}
        <div
          className="mt-10 pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
          style={{ borderTop: '1px solid rgba(195,192,216,0.1)' }}
        >
          <p
            className="font-jakarta text-[11px]"
            style={{ color: 'rgba(255,255,255,0.25)' }}
          >
            &copy; {new Date().getFullYear()} Hannah Abraham. All rights reserved.
          </p>
          <p
            className="font-jakarta text-[11px]"
            style={{ color: 'rgba(255,255,255,0.18)' }}
          >
            Entertainment Journalist · Film · Culture · Criticism
          </p>
        </div>
      </div>
    </footer>
  );
}