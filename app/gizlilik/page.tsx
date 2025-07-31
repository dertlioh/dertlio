
import Head from 'next/head';
import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <>
      <Head>
        <title>Gizlilik ve Güvenlik Politikası - Dertlio</title>
        <meta name="description" content="Dertlio gizlilik ve güvenlik politikası. Kullanıcı anonimliği, veri korunması ve güvenlik önlemleri hakkında detaylı bilgiler." />
        <meta name="keywords" content="gizlilik politikası, güvenlik, anonimlik, veri korunması, kullanıcı hakları" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <link rel="canonical" href="https://dertlio.com/gizlilik" />
        <meta property="og:title" content="Gizlilik ve Güvenlik Politikası - Dertlio" />
        <meta property="og:description" content="Dertlio gizlilik ve güvenlik politikası. Kullanıcı anonimliği, veri korunması ve güvenlik önlemleri." />
        <meta property="og:url" content="https://dertlio.com/gizlilik" />
        <meta property="og:type" content="article" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="px-4 py-4">
            <div className="flex items-center justify-between max-w-7xl mx-auto">
              <Link href="/" className="flex items-center gap-2">
                <img 
                  src="https://static.readdy.ai/image/7787a2ce36fec40941bbbef8cf7f1725/91fea210aebe086edefc8a9b37eab84b.png" 
                  alt="Dertlio - Şikayet Platformu Logosu" 
                  className="h-8 w-auto"
                />
              </Link>

              <nav className="flex items-center gap-6">
                <Link href="/" className="text-gray-600 hover:text-gray-900 transition-colors cursor-pointer">
                  Ana Sayfa
                </Link>
                <span className="text-gray-900 font-medium">
                  Gizlilik Politikası
                </span>
              </nav>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-gray-600 mb-8">
            <Link href="/" className="hover:text-gray-900 cursor-pointer">Ana Sayfa</Link>
            <i className="ri-arrow-right-s-line" aria-hidden="true"></i>
            <span className="text-gray-900">Gizlilik ve Güvenlik Politikası</span>
          </nav>

          <article className="bg-white rounded-lg border border-gray-200 p-8">
            <header className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Gizlilik ve Güvenlik Politikası</h1>
              <p className="text-lg text-gray-700 leading-relaxed">
                Dertlio, kullanıcılarının gizliliğini ve güvenliğini en üst seviyede korumayı taahhüt eder.
                Platformumuzda paylaştığınız tüm içerikler tamamen anonim olarak yayınlanır.
              </p>
            </header>

            <div className="prose max-w-none">
              {/* Section 1 */}
              <section className="mb-8">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-sm font-bold">1</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-3">Tam Anonimlik Garantisi</h2>
                    <div className="space-y-3 text-gray-700">
                      <p>
                        Dertlio, kullanıcılarının kimliklerini hiçbir şekilde talep etmez ve kayıt sırasında 
                        kişisel bilgi (ad, soyad, T.C. kimlik numarası, adres vb.) istemez.
                      </p>
                      <p>
                        Şikayet paylaşımı ve içerik oluşturma işlemleri tamamen anonim olarak gerçekleşir.
                      </p>
                      <p>
                        Kullanıcı adı veya rumuz gibi bilgiler, sadece sistem içi kullanım içindir ve 
                        hiçbir şekilde üçüncü kişilerle paylaşılmaz.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Section 2 */}
              <section className="mb-8">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-sm font-bold">2</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-3">Kişisel Veri Toplanmaz</h2>
                    <div className="space-y-3 text-gray-700">
                      <p>
                        Dertlio, anonimliği desteklemek amacıyla yalnızca teknik düzeyde minimum sistem 
                        verisi toplar (örneğin oturum güvenliği için teknik çerezler).
                      </p>
                      <p>
                        Kimlik tespiti yapılabilecek hiçbir bilgi sistemimizde tutulmaz.
                      </p>
                      <p>
                        Kullanıcılarımızın IP adresleri, cihaz bilgileri gibi veriler hiçbir şekilde 
                        saklanmaz veya işlenmez.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Section 3 */}
              <section className="mb-8">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-sm font-bold">3</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-3">İçerik Güvenliği ve Sorumluluk</h2>
                    <div className="space-y-3 text-gray-700">
                      <p>
                        Yayınlanan tüm şikayet içerikleri, Dertlio moderasyon ekibi tarafından incelenir.
                      </p>
                      <p>
                        Kişisel haklara saldırı, iftira veya yasa dışı içerikler yayınlanmaz.
                      </p>
                      <p>
                        Dertlio, içeriklerde kimlik bilgisi paylaşımını otomatik olarak engelleyen 
                        sistemlere sahiptir.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Section 4 */}
              <section className="mb-8">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-sm font-bold">4</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-3">Hukuki Koruma</h2>
                    <div className="space-y-3 text-gray-700">
                      <p>
                        Dertlio, anonimlik ilkesine yasal sınırlar içinde bağlı kalır.
                      </p>
                      <p>
                        Kanunen zorunlu olmadıkça hiçbir veri paylaşımı yapılmaz; çünkü kullanıcıya 
                        dair tanımlayıcı veri sistemde bulunmaz.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Section 5 */}
              <section className="mb-8">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-sm font-bold">5</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-3">Güvenlik Önlemleri</h2>
                    <div className="space-y-3 text-gray-700">
                      <p>
                        Sistem altyapımız, yüksek güvenlik protokolleriyle korunur.
                      </p>
                      <p>
                        Şifreleme, güvenli sunucu bağlantıları (SSL) ve veri erişim kontrolü ile 
                        kullanıcı anonimliği ve sistem güvenliği garanti altındadır.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Contact Section */}
              <section className="mt-12 p-6 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <i className="ri-information-line text-sm" aria-hidden="true"></i>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Sorularınız mı var?</h3>
                    <p className="text-gray-700 text-sm">
                      Gizlilik ve güvenlik politikamız hakkında herhangi bir sorunuz varsa, 
                      platformumuz üzerinden bizimle iletişime geçebilirsiniz.
                    </p>
                  </div>
                </div>
              </section>
            </div>

            {/* Back to Home */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <Link 
                href="/"
                className="inline-flex items-center gap-2 text-red-600 hover:text-red-700 font-medium cursor-pointer"
              >
                <i className="ri-arrow-left-line" aria-hidden="true"></i>
                Ana Sayfaya Dön
              </Link>
            </div>
          </article>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 mt-16">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <img 
                  src="https://static.readdy.ai/image/7787a2ce36fec40941bbbef8cf7f1725/91fea210aebe086edefc8a9b37eab84b.png" 
                  alt="Dertlio Logo" 
                  className="h-6 w-auto"
                />
                <span className="text-gray-600 text-sm">© 2024 Dertlio. Tüm hakları saklıdır.</span>
              </div>
              <div className="flex items-center gap-6">
                <Link href="/" className="text-gray-600 hover:text-gray-900 text-sm cursor-pointer">
                  Ana Sayfa
                </Link>
                <Link href="/gizlilik" className="text-gray-600 hover:text-gray-900 text-sm cursor-pointer">
                  Gizlilik Politikası
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
