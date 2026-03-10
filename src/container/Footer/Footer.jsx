import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { ArrowRight, X, Mail } from 'lucide-react';
import { SiLinkedin, SiInstagram } from 'react-icons/si';
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


// Magnetic button — uses Framer Motion useMotionValue outside render cycle
MagneticButton.propTypes = {
  children: PropTypes.node.isRequired,
  href: PropTypes.string,
  to: PropTypes.string,
  outline: PropTypes.bool,
  className: PropTypes.string,
  style: PropTypes.object,
};

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
    className: `group relative inline-flex items-center gap-2 font-ui text-xs font-semibold uppercase tracking-[0.08em] px-8 py-4 overflow-hidden transition-all duration-300 ${className}`,
    whileTap: { scale: 0.97 },
  };

  const inner = (
    <>
      {/* Sliding background fill */}
      <span
        className="absolute inset-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-spring-bounce"
        style={{ backgroundColor: outline ? 'rgba(248,245,240,0.12)' : 'rgba(255,255,255,0.12)' }}
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
          className={`group relative inline-flex items-center gap-2 font-ui text-xs font-semibold uppercase tracking-[0.08em] px-8 py-4 overflow-hidden transition-all duration-300 ${className ?? ''}`}
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
      icon: SiLinkedin,
    },
    {
      key: 'twitter',
      label: 'Twitter / X',
      href: settings?.social_twitter || FALLBACK.twitter,
      icon: X,
    },
    {
      key: 'instagram',
      label: 'Instagram',
      href: settings?.social_instagram || FALLBACK.instagram,
      icon: SiInstagram,
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
      style={{ backgroundColor: '#111009' }}
      aria-label="Footer and Contact"
    >
      {/* Dotted grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(223,189,56,0.08) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* Gold left accent bar */}
      <div
        className="absolute top-0 left-0 w-[3px] h-full pointer-events-none"
        style={{ backgroundColor: 'var(--color-gold)', opacity: 0.5 }}
        aria-hidden="true"
      />

      {/* CTA Section */}
      <div
        className="relative pt-24 pb-16 px-6 md:px-10 max-w-[1400px] mx-auto"
        style={{ borderBottom: '1px solid rgba(223,189,56,0.12)' }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-end">
          <div>
            {/* Availability label */}
            <div className="flex items-center gap-3 mb-6">
              <span
                className="inline-block w-6 h-px"
                style={{ backgroundColor: 'var(--color-gold)', opacity: 0.5 }}
                aria-hidden="true"
              />
              <span
                className="font-ui uppercase"
                style={{ fontSize: '0.6rem', letterSpacing: '0.3em', fontWeight: 600, color: 'var(--color-gold)', opacity: 0.6 }}
              >
                {availabilityText}
              </span>
            </div>
            <h2
              className="font-serif font-bold leading-tight"
              style={{
                fontSize: 'clamp(2.5rem, 6vw, 5rem)',
                color: '#F8F5F0',
                letterSpacing: '-0.02em',
              }}
            >
              Let&rsquo;s build the
              <br />
              <span
                className="italic font-normal"
                style={{ color: 'var(--color-gold)' }}
              >
                story together.
              </span>
            </h2>
          </div>

          <div className="flex flex-col gap-5 items-start lg:items-end">
            <p
              className="font-sans text-sm leading-relaxed max-w-[40ch] lg:text-right"
              style={{ color: 'rgba(248,245,240,0.42)', fontWeight: 300 }}
            >
              {contactDesc}
            </p>
            <div className="flex flex-wrap gap-4">
              <MagneticButton
                to="/book"
                style={{ backgroundColor: 'var(--color-gold)', color: 'var(--color-charcoal)' }}
              >
                Start a project
                <ArrowRight size={13} />
              </MagneticButton>

              <MagneticButton
                href="#work"
                outline
                style={{
                  border: '1px solid rgba(248,245,240,0.2)',
                  color: 'rgba(248,245,240,0.7)',
                }}
              >
                View portfolio
              </MagneticButton>
            </div>
          </div>
        </div>
      </div>

      {/* Footer base */}
      <div className="relative px-6 md:px-10 max-w-[1400px] mx-auto pt-10 pb-12">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          {/* Logo */}
          <div className="flex flex-col gap-1.5">
            <span
              className="font-serif font-bold italic text-2xl leading-none"
              style={{ color: 'var(--color-gold)', opacity: 0.85 }}
            >
              Hannah Abraham
            </span>
            <span
              className="font-ui uppercase"
              style={{ fontSize: '0.6rem', letterSpacing: '0.25em', fontWeight: 600, color: 'rgba(248,245,240,0.3)' }}
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
                      className="font-ui uppercase transition-colors duration-200"
                      style={{ fontSize: '0.6rem', letterSpacing: '0.1em', fontWeight: 600, color: 'rgba(248,245,240,0.38)' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-gold)')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(248,245,240,0.38)')}
                    >
                      {item.label}
                    </a>
                  ) : (
                    <Link
                      to={item.href}
                      className="font-ui uppercase transition-colors duration-200"
                      style={{ fontSize: '0.6rem', letterSpacing: '0.1em', fontWeight: 600, color: 'rgba(248,245,240,0.38)' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-gold)')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(248,245,240,0.38)')}
                    >
                      {item.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          {/* Social icons */}
          <div className="flex items-center gap-2.5">
            {socialLinks.map(({ key, icon: Icon, href, label }) => (
              <a
                key={key}
                href={href}
                target={href.startsWith('http') ? '_blank' : undefined}
                rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                className="w-8 h-8 flex items-center justify-center border transition-all duration-200"
                style={{
                  borderColor: 'rgba(248,245,240,0.15)',
                  color: 'rgba(248,245,240,0.45)',
                  borderRadius: '2px',
                }}
                aria-label={label}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-gold)';
                  e.currentTarget.style.color = 'var(--color-gold)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(248,245,240,0.15)';
                  e.currentTarget.style.color = 'rgba(248,245,240,0.45)';
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
          style={{ borderTop: '1px solid rgba(223,189,56,0.1)' }}
        >
          <p
            className="font-sans"
            style={{ fontSize: '0.7rem', color: 'rgba(248,245,240,0.2)', fontWeight: 400 }}
          >
            &copy; {new Date().getFullYear()} Hannah Abraham. All rights reserved.
          </p>
          <p
            className="font-sans"
            style={{ fontSize: '0.7rem', color: 'rgba(248,245,240,0.15)', fontWeight: 400 }}
          >
            Entertainment Journalist · Film · Culture · Criticism
          </p>
        </div>
      </div>
    </footer>
  );
}