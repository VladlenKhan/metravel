import '../index.css'
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
const popularDestinations = [
    { id: 1, name: 'Бали, Индонезия', image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800', price: 'от 89 000 ₽', days: '10–14 дней' },
    { id: 2, name: 'Мальдивы', image: 'https://images.unsplash.com/photo-1514282401047-dab278ca7553?w=800', price: 'от 145 000 ₽', days: '7–12 дней' },
    { id: 3, name: 'Турция, Анталья', image: 'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=800', price: 'от 65 000 ₽', days: '7–10 дней' },
    { id: 4, name: 'ОАЭ, Дубай', image: 'https://images.unsplash.com/photo-1548685913-fe6678babe8d?w=800', price: 'от 78 000 ₽', days: '5–9 дней' },
    { id: 5, name: 'Турция, Анталья', image: 'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=800', price: 'от 65 000 ₽', days: '7–10 дней' },
    { id: 6, name: 'ОАЭ, Дубай', image: 'https://images.unsplash.com/photo-1548685913-fe6678babe8d?w=800', price: 'от 78 000 ₽', days: '5–9 дней' },
    { id: 7, name: 'Турция, Анталья', image: 'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=800', price: 'от 65 000 ₽', days: '7–10 дней' },
    { id: 8, name: 'ОАЭ, Дубай', image: 'https://images.unsplash.com/photo-1548685913-fe6678babe8d?w=800', price: 'от 78 000 ₽', days: '5–9 дней' },
    { id: 9, name: 'Турция, Анталья', image: 'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=800', price: 'от 65 000 ₽', days: '7–10 дней' },
    { id: 10, name: 'ОАЭ, Дубай', image: 'https://images.unsplash.com/photo-1548685913-fe6678babe8d?w=800', price: 'от 78 000 ₽', days: '5–9 дней' },
    { id: 11, name: 'Турция, Анталья', image: 'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=800', price: 'от 65 000 ₽', days: '7–10 дней' },
    { id: 12, name: 'ОАЭ, Дубай', image: 'https://images.unsplash.com/photo-1548685913-fe6678babe8d?w=800', price: 'от 78 000 ₽', days: '5–9 дней' },
 
];

export default function Tours() {
    return (
        <>
            <Navbar />
            <section id="tours" className="py-16 md:py-20 mt-6">
                <div className="mx-auto px-5 sm:px-8 lg:px-12 max-w-7xl">
                    <div className="text-center mb-12 md:mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
                            Все направления
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                        {popularDestinations.map((dest) => (
                            <a href="#"
                                key={dest.id}
                                className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 bg-white"
                            >
                                <div className="aspect-[4/5] relative">
                                    <img
                                        src={dest.image}
                                        alt={dest.name}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                                    <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                                        <h3 className="text-xl md:text-2xl font-bold mb-1">{dest.name}</h3>
                                        <p className="text-white/90 text-sm md:text-base">{dest.days}</p>
                                        <p className="text-amber-300 font-bold mt-2 text-lg md:text-xl">{dest.price}</p>
                                    </div>
                                </div>
                            </a>
                        ))}
                    </div>
                </div>
            </section>
            <Footer />
        </>
    );
}

