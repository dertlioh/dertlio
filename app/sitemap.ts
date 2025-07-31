
import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const companies = [
    'turkcell', 'vodafone', 'zara', 'migros', 'getir', 'teknosa', 'hm', 'carrefoursa', 
    'yemeksepeti', 'turk-telekom', 'mango', 'lcw', 'lc-waikiki', 'defacto', 'koton', 
    'trendyol', 'hepsiburada', 'n11', 'gittigidiyor', 'amazon', 'netflix', 'spotify', 
    'uber', 'yandex', 'bim', 'a101', 'sok', 'carrefour', 'real', 'macro', 'bauhaus', 
    'koctas', 'ikea', 'mediamarkt', 'vatan', 'gold', 'boyner', 'vakko', 'beymen', 
    'nike', 'adidas', 'puma', 'mcdonalds', 'burger-king', 'kfc', 'dominos', 
    'pizza-hut', 'starbucks', 'gloria-jeans', 'tchibo'
  ];

  const companyPages = companies.map((company) => ({
    url: `https://dertlio.com/firma/${company}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));

  return [
    {
      url: 'https://dertlio.com',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: 'https://dertlio.com/admin',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.3,
    },
    {
      url: 'https://dertlio.com/gizlilik',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    ...companyPages,
  ];
}
