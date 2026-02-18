import './index.css'
import Header from './components/Header';
import MainContent from './components/MainContent';
import Footer from './components/Footer';
function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <MainContent/>
      <Footer/>
      {/* здесь будет остальной контент */}
    </div>
  );
}

export default App;