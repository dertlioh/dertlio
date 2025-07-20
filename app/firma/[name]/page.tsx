
import CompanyPage from './CompanyPage';

export async function generateStaticParams() {
  return [
    { name: 'turkcell' },
    { name: 'vodafone' },
    { name: 'zara' },
    { name: 'migros' },
    { name: 'getir' },
    { name: 'teknosa' },
    { name: 'h&m' },
    { name: 'carrefoursa' },
    { name: 'yemeksepeti' },
    { name: 'türk-telekom' },
    { name: 'mango' },
    { name: 'lcw' },
    { name: 'defacto' },
    { name: 'koton' },
    { name: 'trendyol' },
    { name: 'hepsiburada' },
    { name: 'n11' },
    { name: 'gittigidiyor' },
    { name: 'amazon' },
    { name: 'netflix' },
    { name: 'spotify' },
    { name: 'uber' },
    { name: 'yandex' },
    { name: 'taksim' },
    { name: 'bim' },
    { name: 'a101' },
    { name: 'şok' },
    { name: 'carrefour' },
    { name: 'real' },
    { name: 'macro' },
    { name: 'bauhaus' },
    { name: 'koçtaş' },
    { name: 'ikea' },
    { name: 'mediamarkt' },
    { name: 'vatan' },
    { name: 'gold' },
    { name: 'boyner' },
    { name: 'vakko' },
    { name: 'beymen' },
    { name: 'nike' },
    { name: 'adidas' },
    { name: 'puma' },
    { name: 'mcdonalds' },
    { name: 'burger-king' },
    { name: 'kfc' },
    { name: 'dominos' },
    { name: 'pizza-hut' },
    { name: 'starbucks' },
    { name: 'gloria-jeans' },
    { name: 'tchibo' }
  ];
}

// 🔧 FIX: Dinamik sayfa oluşturma - herhangi bir firma için çalışacak
export const dynamicParams = true; // Bu satır çok önemli!

export default function CompanyPageRoute({ params }: { params: { name: string } }) {
  return <CompanyPage companyName={params.name} />;
}
