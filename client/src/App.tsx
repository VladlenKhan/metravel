import { Routes, Route } from 'react-router-dom';

import Home from './pages/Home';
import Tours from './pages/Tours';
import NotFound from './pages/NotFound';  
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp' 
import ScrollToHash from './components/ScrollToHash';
 
function App() {
  return (
    <>
    <ScrollToHash/>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/tours" element={<Tours />} />
      <Route path="/register" element={<SignUp/>}/>
      <Route path="/login" element={<SignIn/>}/>
      {/* Динамический маршрут пример */}
      {/* <Route path="/tours/:id" element={<TourDetail />} /> */}

      {/* 404 в конце */}
      <Route path="*" element={<NotFound />} />
    </Routes>
    </>
  );
}

export default App;