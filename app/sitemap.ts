
import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://dertlio.com'
  
  // Ana sayfalar
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/admin`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.3,
    },
  ]

  // Firma sayfaları
  const companyPages = [
    'turkcell',
    'vodafone',
    'zara',
    'migros',
    'getir',
    'teknosa',
    'hm',
    'carrefoursa',
    'yemeksepeti',
    'turk-telekom',
    'mango',
    'lcw',
    'lc-waikiki',
    'defacto',
    'koton',
    'trendyol',
    'hepsiburada',
    'n11',
    'gittigidiyor',
    'amazon',
    'netflix',
    'spotify',
    'uber',
    'yandex',
    'bim',
    'a101',
    'sok',
    'carrefour',
    'real',
    'macro',
    'bauhaus',
    'koctas',
    'ikea',
    'mediamarkt',
    'vatan',
    'gold',
    'boyner',
    'vakko',
    'beymen',
    'nike',
    'adidas',
    'puma',
    'mcdonalds',
    'burger-king',
    'kfc',
    'dominos',
    'pizza-hut',
    'starbucks',
    'gloria-jeans',
    'tchibo'
  ].map(company => ({
    url: `${baseUrl}/firma/${company}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }))

  return [...staticPages, ...companyPages]
}
