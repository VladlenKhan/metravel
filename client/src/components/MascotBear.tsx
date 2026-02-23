import { useState, useEffect, useRef } from 'react';
import { FiX } from 'react-icons/fi';

export default function MascotBear() {
  const [position, setPosition] = useState({ x: Math.min(window.innerWidth - 120, window.innerWidth - 60), y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isWalking, setIsWalking] = useState(false);
  const [walkStep, setWalkStep] = useState(0);
  const [isWaving, setIsWaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [hasMoved, setHasMoved] = useState(false);
  const bearRef = useRef<HTMLDivElement>(null);

  // Функция для проверки пересечения с текстовыми элементами
  const checkTextCollision = (x: number, y: number, radius: number = 80): boolean => {
    const textElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, a, button, input, textarea, label');
    
    for (const element of Array.from(textElements)) {
      const rect = element.getBoundingClientRect();
      const elementCenterX = rect.left + rect.width / 2;
      const elementCenterY = rect.top + rect.height / 2;
      const distance = Math.sqrt(
        Math.pow(x - elementCenterX, 2) + Math.pow(y - elementCenterY, 2)
      );
      
      // Учитываем размер элемента
      const elementRadius = Math.max(rect.width, rect.height) / 2;
      
      if (distance < radius + elementRadius) {
        return true;
      }
    }
    
    return false;
  };

  // Функция для поиска свободного места
  const findFreePosition = (currentX: number, currentY: number): { x: number; y: number } => {
    const maxX = window.innerWidth - 100;
    const maxY = window.innerHeight - 120;
    const minX = 100;
    const minY = 100;
    
    // Пробуем несколько случайных позиций
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 100 + Math.random() * 150;
      const newX = currentX + Math.cos(angle) * distance;
      const newY = currentY + Math.sin(angle) * distance;
      
      const clampedX = Math.max(minX, Math.min(maxX, newX));
      const clampedY = Math.max(minY, Math.min(maxY, newY));
      
      if (!checkTextCollision(clampedX, clampedY, 90)) {
        return { x: clampedX, y: clampedY };
      }
    }
    
    // Если не нашли свободное место, возвращаем позицию в углу
    return {
      x: Math.random() > 0.5 ? minX + 50 : maxX - 50,
      y: Math.random() > 0.5 ? minY + 50 : maxY - 50,
    };
  };

  // Анимация махания рукой
  useEffect(() => {
    const waveInterval = setInterval(() => {
      if (!isDragging && !isWalking) {
        setIsWaving(true);
        setTimeout(() => setIsWaving(false), 1500);
      }
    }, 8000);

    return () => clearInterval(waveInterval);
  }, [isDragging, isWalking]);

  // Анимация ходьбы с плавными переходами
  useEffect(() => {
    if (!isWalking) {
      setWalkStep(0);
      return;
    }
    
    const walkInterval = setInterval(() => {
      setWalkStep((prev) => (prev + 1) % 4);
    }, 300);

    return () => clearInterval(walkInterval);
  }, [isWalking]);

  // Автоматическое движение медведя с избеганием текста
  useEffect(() => {
    if (isDragging) {
      setIsWalking(false);
      return;
    }
    
    const moveInterval = setInterval(() => {
      setPosition((prev) => {
        const freePos = findFreePosition(prev.x, prev.y);
        setIsWalking(true);
        setTimeout(() => setIsWalking(false), 1500);
        return freePos;
      });
    }, 7000);

    return () => clearInterval(moveInterval);
  }, [isDragging]);

  // Обновление позиции при изменении размера окна
  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => {
        const newPos = {
          x: Math.min(prev.x, window.innerWidth - 100),
          y: Math.min(prev.y, window.innerHeight - 120),
        };
        // Проверяем, не попал ли медведь на текст после ресайза
        if (checkTextCollision(newPos.x, newPos.y, 90)) {
          return findFreePosition(newPos.x, newPos.y);
        }
        return newPos;
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setHasMoved(false);
    if (bearRef.current) {
      const rect = bearRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left - rect.width / 2,
        y: e.clientY - rect.top - rect.height / 2,
      });
      setIsDragging(true);
      setIsWalking(false);
      setIsWaving(false);
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setHasMoved(true);
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    // После отпускания проверяем, не попал ли медведь на текст
    setPosition((prev) => {
      if (checkTextCollision(prev.x, prev.y, 90)) {
        return findFreePosition(prev.x, prev.y);
      }
      return prev;
    });
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  const handleClick = () => {
    if (!hasMoved && !isDragging) {
      setShowModal(true);
    }
    setHasMoved(false);
  };

  // Плавные углы для анимации ходьбы
  const getArmAngle = (side: 'left' | 'right', step: number) => {
    if (isWaving && side === 'right') {
      return -45 + Math.sin(Date.now() / 100) * 20;
    }
    if (!isWalking) return side === 'left' ? -10 : 10;
    const baseAngle = side === 'left' ? -15 : 15;
    const swing = step < 2 ? (step === 0 ? -10 : -5) : (step === 2 ? 5 : 10);
    return baseAngle + swing;
  };

  const getLegAngle = (side: 'left' | 'right', step: number) => {
    if (!isWalking) return 0;
    const baseAngle = side === 'left' ? 8 : -8;
    const swing = step < 2 ? (step === 0 ? 12 : 6) : (step === 2 ? -6 : -12);
    return baseAngle + swing;
  };

  const leftArmAngle = getArmAngle('left', walkStep);
  const rightArmAngle = getArmAngle('right', walkStep);
  const leftLegAngle = getLegAngle('left', walkStep);
  const rightLegAngle = getLegAngle('right', walkStep);

  return (
    <>
      <div
        ref={bearRef}
        className={`fixed z-40 cursor-grab active:cursor-grabbing ${isWalking ? 'transition-all duration-500 ease-in-out' : ''}`}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          transform: 'translate(-50%, -50%)',
        }}
        onMouseDown={handleMouseDown}
        onClick={handleClick}
      >
        {/* Улучшенная моделька медведя */}
        <div className="relative w-32 h-40">
          {/* Голова */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-20 bg-gradient-to-br from-amber-300 via-amber-400 to-amber-500 rounded-full shadow-2xl border-2 border-amber-600/40">
            {/* Уши */}
            <div className="absolute -top-2.5 -left-1.5 w-8 h-8 bg-amber-600 rounded-full shadow-lg"></div>
            <div className="absolute -top-2.5 -right-1.5 w-8 h-8 bg-amber-600 rounded-full shadow-lg"></div>
            {/* Внутренняя часть ушей */}
            <div className="absolute top-0.5 -left-0.5 w-6 h-6 bg-amber-200 rounded-full"></div>
            <div className="absolute top-0.5 -right-0.5 w-6 h-6 bg-amber-200 rounded-full"></div>
            {/* Глаза */}
            <div className="absolute top-6 left-4 w-3 h-3 bg-black rounded-full"></div>
            <div className="absolute top-6 right-4 w-3 h-3 bg-black rounded-full"></div>
            {/* Блики в глазах */}
            <div className="absolute top-6.5 left-4.5 w-1.5 h-1.5 bg-white rounded-full"></div>
            <div className="absolute top-6.5 right-4.5 w-1.5 h-1.5 bg-white rounded-full"></div>
            {/* Нос */}
            <div className="absolute top-8 left-1/2 -translate-x-1/2 w-3.5 h-3 bg-black rounded-full"></div>
            {/* Рот */}
            <div className="absolute top-11 left-1/2 -translate-x-1/2 w-7 h-2 border-b-2 border-black rounded-full"></div>
            {/* Щеки */}
            <div className="absolute top-9 left-2 w-3 h-3 bg-amber-200/50 rounded-full"></div>
            <div className="absolute top-9 right-2 w-3 h-3 bg-amber-200/50 rounded-full"></div>
          </div>

          {/* Тело */}
          <div className="absolute top-16 left-1/2 -translate-x-1/2 w-18 h-20 bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 rounded-full shadow-xl border border-amber-700/30">
            {/* Животик */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-14 bg-amber-300/30 rounded-full"></div>
          </div>

          {/* Левая рука */}
          <div 
            className="absolute top-18 left-0 w-6 h-14 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full origin-[50%_15%] shadow-lg transition-transform duration-300 ease-in-out"
            style={{ transform: `rotate(${leftArmAngle}deg)` }}
          >
            {/* Лапа */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-7 h-6 bg-amber-500 rounded-full shadow-md"></div>
            {/* Пальцы */}
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-2 bg-amber-400 rounded-full"></div>
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 translate-x-1.5 w-1 h-2 bg-amber-400 rounded-full"></div>
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 -translate-x-1.5 w-1 h-2 bg-amber-400 rounded-full"></div>
          </div>

          {/* Правая рука (машет) */}
          <div 
            className="absolute top-18 right-0 w-6 h-14 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full origin-[50%_15%] shadow-lg transition-transform duration-300 ease-in-out"
            style={{ transform: `rotate(${rightArmAngle}deg)` }}
          >
            {/* Лапа */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-7 h-6 bg-amber-500 rounded-full shadow-md"></div>
            {/* Пальцы */}
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-2 bg-amber-400 rounded-full"></div>
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 translate-x-1.5 w-1 h-2 bg-amber-400 rounded-full"></div>
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 -translate-x-1.5 w-1 h-2 bg-amber-400 rounded-full"></div>
          </div>

          {/* Левая нога */}
          <div 
            className="absolute bottom-0 left-5 w-7 h-16 bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 rounded-full origin-top shadow-xl transition-transform duration-300 ease-in-out"
            style={{ transform: `rotate(${leftLegAngle}deg)` }}
          >
            {/* Стопа */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-5 bg-amber-600 rounded-full shadow-lg"></div>
          </div>

          {/* Правая нога */}
          <div 
            className="absolute bottom-0 right-5 w-7 h-16 bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 rounded-full origin-top shadow-xl transition-transform duration-300 ease-in-out"
            style={{ transform: `rotate(${rightLegAngle}deg)` }}
          >
            {/* Стопа */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-5 bg-amber-600 rounded-full shadow-lg"></div>
          </div>
        </div>

        {/* Индикатор клика */}
        <div className="absolute -bottom-14 left-1/2 -translate-x-1/2 text-xs text-stone-600 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full whitespace-nowrap shadow-lg border border-stone-200">
          Нажми меня!
        </div>
      </div>

      {/* Модальное окно с информацией */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 transition-colors"
            >
              <FiX size={24} />
            </button>
            
            <div className="text-center mb-6">
              <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-amber-300 to-amber-500 rounded-full flex items-center justify-center">
                <span className="text-4xl">🐻</span>
              </div>
              <h3 className="text-2xl font-medium text-stone-900 mb-2">Привет! Я Миша</h3>
              <p className="text-stone-600">Ваш помощник по путешествиям</p>
            </div>

            <div className="space-y-4 text-stone-700">
              <div className="bg-amber-50 p-4 rounded-xl">
                <h4 className="font-medium text-stone-900 mb-2">✈️ О нас</h4>
                <p className="text-sm">MeTravel — это более 8 лет опыта в организации незабываемых путешествий. Мы помогли более 24 000 туристам открыть мир!</p>
              </div>
              
              <div className="bg-stone-50 p-4 rounded-xl">
                <h4 className="font-medium text-stone-900 mb-2">🎯 Наши услуги</h4>
                <ul className="text-sm space-y-1">
                  <li>• Горящие туры со скидками до 40%</li>
                  <li>• Индивидуальные маршруты</li>
                  <li>• Круглосуточная поддержка</li>
                  <li>• Гарантия лучших цен</li>
                </ul>
              </div>

              <div className="bg-emerald-50 p-4 rounded-xl">
                <h4 className="font-medium text-stone-900 mb-2">📞 Свяжитесь с нами</h4>
                <p className="text-sm">Звоните: +7 (495) 123-45-67<br />Email: info@metravel.ru</p>
              </div>
            </div>

            <button
              onClick={() => setShowModal(false)}
              className="w-full mt-6 py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-medium rounded-xl transition-colors"
            >
              Понятно, спасибо!
            </button>
          </div>
        </div>
      )}
    </>
  );
}
