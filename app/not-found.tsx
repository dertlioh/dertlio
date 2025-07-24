
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center px-4">
      <div className="mb-8">
        <img 
          src="https://static.readdy.ai/image/7787a2ce36fec40941bbbef8cf7f1725/91fea210aebe086edefc8a9b37eab84b.png" 
          alt="Dertlio Logo" 
          className="h-12 w-auto mx-auto mb-4"
        />
      </div>
      
      <h1 className="text-6xl md:text-8xl font-bold text-gray-200 mb-4">404</h1>
      <h2 className="text-2xl md:text-3xl font-semibold text-gray-800 mb-4">
        Sayfa Bulunamadı
      </h2>
      <p className="text-lg text-gray-600 mb-8 max-w-md">
        Aradığınız sayfa mevcut değil veya taşınmış olabilir.
      </p>
      
      <Link 
        href="/"
        className="bg-red-600 text-white px-6 py-3 rounded-full hover:bg-red-700 transition-colors font-medium cursor-pointer whitespace-nowrap"
      >
        Ana Sayfaya Dön
      </Link>
    </div>
  );
}
