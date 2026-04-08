import '../index.css'
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import MainContent from '../components/MainContent';
import Footer from '../components/Footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <Hero />
      <MainContent />
      <Footer />
    </div>
  );
}

 