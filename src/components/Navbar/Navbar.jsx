import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { X, BookOpen } from 'lucide-react';
import { SiLinkedin, SiInstagram } from 'react-icons/si';

const NAV_LINKS = [
  { label: 'Work', href: '#work', isAnchor: true },
  { label: 'About', href: '#about', isAnchor: true },
  { label: 'Archive', href: '/archive', isAnchor: false },
  { label: 'Contact', href: '#contact', isAnchor: true },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const isArchive = location.pathname === '/archive';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isActive = (link) => {
    if (!link.isAnchor) return location.pathname === link.href;
    return false;
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${
        scrolled || isArchive
          ? 'border-b'
          : 'border-b border-transparent'
      }`}
      style={
        scrolled || isArchive
          ? { backgroundColor: 'rgba(248,245,240,0.92)', backdropFilter: 'blur(12px)', borderColor: 'rgba(26,26,26,0.14)' }
          : {}
      }
      aria-label="Main navigation"
    >
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 h-16 flex items-center justify-between">
        {/* Logo / Wordmark */}
        <Link
          to="/"
          className="flex items-center gap-2.5 group"
          aria-label="Hannah Abraham — Home"
        >
          <span
            className="font-serif font-bold italic text-2xl leading-none tracking-tight transition-colors duration-300"
            style={{ color: 'var(--color-charcoal)' }}
          >
            Hannah
          </span>
          <span
            className="hidden sm:block font-ui text-[10px] uppercase tracking-[0.22em] font-semibold mt-px transition-colors duration-300"
            style={{ color: 'var(--color-charcoal)', opacity: 0.55 }}
          >
            Abraham
          </span>
          <span
            className="hidden lg:block font-ui text-[10px] uppercase tracking-[0.22em] font-medium mt-px transition-colors duration-300 ml-0.5"
            style={{ color: 'var(--color-charcoal)', opacity: 0.3 }}
          >
            / Entertainment Journalist
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <ul className="hidden md:flex items-center gap-1" role="list">
          {NAV_LINKS.map((item) => {
            const active = isActive(item);
            return (
              <li key={item.label}>
                {item.isAnchor ? (
                  <a
                    href={isArchive ? `/${item.href}` : item.href}
                    className="relative font-ui text-[11px] font-semibold uppercase tracking-[0.1em] px-4 py-2 transition-colors duration-200 group"
                    style={{ color: 'var(--color-charcoal)' }}
                  >
                    {item.label}
                    <span
                      className="absolute bottom-1 left-4 right-4 h-px scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"
                      style={{ backgroundColor: 'var(--color-gold)' }}
                    />
                  </a>
                ) : (
                  <Link
                    to={item.href}
                    className="relative font-ui text-[11px] font-semibold uppercase tracking-[0.1em] px-4 py-2 transition-colors duration-200 group"
                    style={{ color: active ? 'var(--color-gold)' : 'var(--color-charcoal)' }}
                  >
                    {item.label}
                    <span
                      className="absolute bottom-1 left-4 right-4 h-px transition-transform duration-300 origin-left"
                      style={{
                        backgroundColor: 'var(--color-gold)',
                        transform: active ? 'scaleX(1)' : 'scaleX(0)',
                      }}
                    />
                  </Link>
                )}
              </li>
            );
          })}
        </ul>

        {/* Right: Social + CTA */}
        <div className="hidden md:flex items-center gap-2.5">
          <a
            href="https://www.linkedin.com/in/hannahrachelabraham/"
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 flex items-center justify-center transition-colors duration-200 rounded-sm hover:bg-black/5"
            aria-label="LinkedIn"
          >
            <SiLinkedin size={14} style={{ color: 'var(--color-charcoal)', opacity: 0.6 }} />
          </a>
          <a
            href="https://twitter.com/HAN_NA_NA_NAH"
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 flex items-center justify-center transition-colors duration-200 rounded-sm hover:bg-black/5"
            aria-label="X (Twitter)"
          >
            <X size={14} style={{ color: 'var(--color-charcoal)', opacity: 0.6 }} />
          </a>
          <a
            href="https://www.instagram.com/han_na_na_nah/"
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 flex items-center justify-center transition-colors duration-200 rounded-sm hover:bg-black/5"
            aria-label="Instagram"
          >
            <SiInstagram size={14} style={{ color: 'var(--color-charcoal)', opacity: 0.6 }} />
          </a>
          <div className="w-px h-4 mx-1" style={{ backgroundColor: 'rgba(26,26,26,0.15)' }} aria-hidden="true" />
          <Link
            to="/book"
            className="flex items-center gap-1.5 font-ui text-[10px] font-semibold uppercase tracking-[0.1em] px-4 py-2 border transition-all duration-250 hover:scale-[1.02] active:scale-[0.98]"
            style={{
              borderColor: 'var(--color-charcoal)',
              color: 'var(--color-charcoal)',
              borderRadius: '2px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-gold)';
              e.currentTarget.style.borderColor = 'var(--color-gold)';
              e.currentTarget.style.color = 'var(--color-charcoal)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = 'var(--color-charcoal)';
              e.currentTarget.style.color = 'var(--color-charcoal)';
            }}
          >
            <BookOpen size={11} />
            Hire Me
          </Link>
        </div>

        {/* Mobile Hamburger */}
        <button
          className="md:hidden flex flex-col gap-[5px] p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
        >
          <span
            className={`block w-5 h-[1.5px] transition-all duration-300 ${mobileOpen ? 'translate-y-[6.5px] rotate-45' : ''}`}
            style={{ backgroundColor: 'var(--color-charcoal)' }}
          />
          <span
            className={`block w-5 h-[1.5px] transition-all duration-300 ${mobileOpen ? 'opacity-0' : ''}`}
            style={{ backgroundColor: 'var(--color-charcoal)' }}
          />
          <span
            className={`block w-5 h-[1.5px] transition-all duration-300 ${mobileOpen ? '-translate-y-[6.5px] -rotate-45' : ''}`}
            style={{ backgroundColor: 'var(--color-charcoal)' }}
          />
        </button>
      </div>

      {/* Mobile Drawer */}
      <div
        className={`md:hidden fixed inset-0 top-16 z-[99] transition-all duration-500 flex flex-col px-6 pt-8 pb-12 gap-6 ${
          mobileOpen ? 'opacity-100 pointer-events-auto translate-x-0' : 'opacity-0 pointer-events-none translate-x-full'
        }`}
        style={{ backgroundColor: 'var(--color-bg-primary)' }}
      >
        <ul className="flex flex-col gap-0" role="list">
          {NAV_LINKS.map((item) => (
            <li key={item.label}>
              {item.isAnchor ? (
                <a
                  href={isArchive ? `/${item.href}` : item.href}
                  onClick={() => setMobileOpen(false)}
                  className="block font-serif text-3xl font-bold py-4 border-b transition-colors duration-200"
                  style={{
                    color: 'var(--color-charcoal)',
                    borderColor: 'rgba(26,26,26,0.1)',
                  }}
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  to={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="block font-serif text-3xl font-bold py-4 border-b transition-colors duration-200"
                  style={{
                    color: isActive(item) ? 'var(--color-gold)' : 'var(--color-charcoal)',
                    borderColor: 'rgba(26,26,26,0.1)',
                  }}
                >
                  {item.label}
                </Link>
              )}
            </li>
          ))}
        </ul>
        <div className="flex gap-4 mt-4">
          <a href="https://www.linkedin.com/in/hannahrachelabraham/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
            <SiLinkedin size={20} style={{ color: 'var(--color-charcoal)', opacity: 0.65 }} />
          </a>
          <a href="https://twitter.com/HAN_NA_NA_NAH" target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)">
            <X size={20} style={{ color: 'var(--color-charcoal)', opacity: 0.65 }} />
          </a>
          <a href="https://www.instagram.com/han_na_na_nah/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
            <SiInstagram size={20} style={{ color: 'var(--color-charcoal)', opacity: 0.65 }} />
          </a>
        </div>
      </div>
    </nav>
  );
}
