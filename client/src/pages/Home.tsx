import '../index.css';
import Footer from '../components/Footer';
import Hero from '../components/Hero';
import MainContent from '../components/MainContent';
import ScrollToTop from '../components/ScrollToTop';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Hero />
      <MainContent />
      <Footer />
      <ScrollToTop />
    </div>
  );
}
