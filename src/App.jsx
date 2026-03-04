import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Hero from './container/Header/Header';
import LatestWork from './container/Portfolio/Portfolio';
import Philosophy from './container/About/About';
import Services from './container/Services/Services';
import Footer from './container/Footer/Footer';
import Navbar from './components/Navbar/Navbar';
import ArchivePage from './pages/ArchivePage';
import BookPage from './pages/BookPage';

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
        <Services />
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
        <Route path="/book" element={<BookPage />} />
      </Routes>
    </>
  );
}

export default App;
