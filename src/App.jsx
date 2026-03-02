import Hero from './container/Header/Header';
import LatestWork from './container/Portfolio/Portfolio';
import Philosophy from './container/About/About';
import Reviews from './container/Testimonial/Testimonial';
import Footer from './container/Footer/Footer';
import Navbar from './components/Navbar/Navbar';

import './index.css';

function App() {
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

export default App;
