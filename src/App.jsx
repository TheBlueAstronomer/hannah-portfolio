import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Hero from './container/Header/Header';
import LatestWork from './container/Portfolio/Portfolio';
import Philosophy from './container/About/About';
import Reviews from './container/Testimonial/Testimonial';
import Footer from './container/Footer/Footer';
import Navbar from './components/Navbar/Navbar';
import ArchivePage from './pages/ArchivePage';

import './index.css';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function Home() {
  return (
    <div className="app relative">
      <Navbar />
      <main>
        <Hero />
        <LatestWork />
        <Philosophy />
        <Reviews />
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/archive" element={<ArchivePage />} />
      </Routes>
    </>
  );
}

export default App;
