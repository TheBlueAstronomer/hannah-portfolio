import React, { useState, useEffect } from 'react';
import { Linkedin, Twitter, Instagram, BookOpen } from 'lucide-react';

const NAV_LINKS = ['Work', 'About', 'Contact'];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${scrolled
          ? 'bg-white/80 backdrop-blur-md border-b border-gray-200/60 shadow-[0_2px_20px_rgba(88,75,119,0.06)]'
          : 'bg-transparent border-b border-transparent'
        }`}
      aria-label="Main navigation"
    >
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 h-16 flex items-center justify-between">
        {/* Logo / Wordmark */}
        <a
          href="#home"
          className="flex items-center gap-2 group"
          aria-label="Hannah Abraham — Home"
        >
          <span
            className="font-cormorant font-bold italic text-2xl leading-none tracking-tight transition-colors duration-300"
            style={{ color: 'var(--color-violet)' }}
          >
            Hannah
          </span>
          <span
            className="hidden sm:block font-jakarta text-xs uppercase tracking-[0.22em] font-medium mt-px transition-colors duration-300"
            style={{ color: 'var(--color-charcoal)' }}
          >
            Abraham
          </span>
          <span
            className="hidden sm:block font-jakarta text-xs uppercase tracking-[0.22em] font-medium mt-px transition-colors duration-300 ml-1 opacity-40"
            style={{ color: 'var(--color-charcoal)' }}
          >
            / Entertainment Journalist
          </span>
        </a>

        {/* Desktop Nav Links */}
        <ul className="hidden md:flex items-center gap-1" role="list">
          {NAV_LINKS.map((item) => (
            <li key={item}>
              <a
                href={`#${item.toLowerCase()}`}
                className="relative font-jakarta text-sm font-medium px-4 py-2 rounded-sm transition-colors duration-300 group"
                style={{ color: scrolled ? 'var(--color-charcoal)' : 'var(--color-charcoal)' }}
              >
                {item}
                <span
                  className="absolute bottom-1 left-4 right-4 h-px scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"
                  style={{ backgroundColor: 'var(--color-periwinkle)' }}
                />
              </a>
            </li>
          ))}
        </ul>

        {/* Right: Social + CTA */}
        <div className="hidden md:flex items-center gap-3">
          <a
            href="https://www.linkedin.com/in/hannahrachelabraham/"
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 flex items-center justify-center rounded-sm transition-colors duration-200 hover:bg-periwinkle/20"
            aria-label="LinkedIn"
          >
            <Linkedin size={15} style={{ color: 'var(--color-violet)' }} />
          </a>
          <a
            href="https://twitter.com/HAN_NA_NA_NAH"
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 flex items-center justify-center rounded-sm transition-colors duration-200 hover:bg-periwinkle/20"
            aria-label="Twitter"
          >
            <Twitter size={15} style={{ color: 'var(--color-violet)' }} />
          </a>
          <a
            href="https://www.instagram.com/han_na_na_nah/"
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 flex items-center justify-center rounded-sm transition-colors duration-200 hover:bg-periwinkle/20"
            aria-label="Instagram"
          >
            <Instagram size={15} style={{ color: 'var(--color-violet)' }} />
          </a>
          <div className="w-px h-4 mx-1 bg-gray-300" aria-hidden="true" />
          <a
            href="#contact"
            className="flex items-center gap-1.5 font-jakarta text-xs font-semibold uppercase tracking-widest px-4 py-2 rounded-sm border transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            style={{
              borderColor: 'var(--color-violet)',
              color: 'var(--color-violet)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-violet)';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--color-violet)';
            }}
          >
            <BookOpen size={12} />
            Hire Me
          </a>
        </div>

        {/* Mobile Hamburger */}
        <button
          className="md:hidden flex flex-col gap-[5px] p-2 rounded-sm group"
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
        className={`md:hidden fixed inset-0 top-16 bg-white z-[99] transition-all duration-500 flex flex-col px-6 pt-8 pb-12 gap-6 ${mobileOpen ? 'opacity-100 pointer-events-auto translate-x-0' : 'opacity-0 pointer-events-none translate-x-full'
          }`}
      >
        <ul className="flex flex-col gap-2" role="list">
          {NAV_LINKS.map((item) => (
            <li key={item}>
              <a
                href={`#${item.toLowerCase()}`}
                onClick={() => setMobileOpen(false)}
                className="block font-jakarta text-2xl font-semibold py-3 border-b transition-colors duration-200"
                style={{
                  color: 'var(--color-charcoal)',
                  borderColor: 'var(--color-gray-light)',
                }}
              >
                {item}
              </a>
            </li>
          ))}
        </ul>
        <div className="flex gap-4 mt-4">
          <a href="https://www.linkedin.com/in/hannahrachelabraham/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
            <Linkedin size={20} style={{ color: 'var(--color-violet)' }} />
          </a>
          <a href="https://twitter.com/HAN_NA_NA_NAH" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
            <Twitter size={20} style={{ color: 'var(--color-violet)' }} />
          </a>
          <a href="https://www.instagram.com/han_na_na_nah/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
            <Instagram size={20} style={{ color: 'var(--color-violet)' }} />
          </a>
        </div>
      </div>
    </nav>
  );
}
