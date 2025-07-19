
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
    { name: 'türk-telekom' }
  ];
}

export default function CompanyPageRoute({ params }: { params: { name: string } }) {
  return <CompanyPage companyName={params.name} />;
}
