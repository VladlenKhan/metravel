// src/pages/NotFound.tsx
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center px-4">
      <div className="text-center space-y-6">
        <h1 className="text-8xl md:text-9xl font-bold text-indigo-500">404</h1>
        
        <h2 className="text-3xl md:text-4xl font-semibold">
          Страница не найдена
        </h2>
        
        <p className="text-lg text-gray-400 max-w-md mx-auto">
          Кажется, вы зашли не туда.<br />
          Если ищите приключения — они точно не на этой странице 😏
        </p>

        <div className="pt-6">
          <Link
            to="/home"
            className="inline-block px-8 py-4 bg-indigo-600 hover:bg-indigo-700 
                     text-white font-medium rounded-lg transition-colors duration-200"
          >
            Вернуться на главную
          </Link>
        </div>
      </div>
    </div>
  );
}