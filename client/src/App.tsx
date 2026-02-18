import './index.css'
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import MainContent from './components/MainContent';
import Footer from './components/Footer';
function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Hero />
      <MainContent/>
      <Footer/>
      {/* здесь будет остальной контент */}
    </div>
  );
}

export default App;