import { Routes, Route } from 'react-router-dom';

import Home from './pages/Home';
import Tours from './pages/Tours';
import NotFound from './pages/NotFound';  

// Можно добавить общий Layout позже
function App() {
  return (
    <Routes>
      <Route path="/home" element={<Home />} />
      <Route path="/tours" element={<Tours />} />
      
      {/* Динамический маршрут пример */}
      {/* <Route path="/tours/:id" element={<TourDetail />} /> */}

      {/* 404 в конце */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;