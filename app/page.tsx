
'use client';

import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../lib/firebase';
import { 
  Entry, 
  Reply, 
  CompanyStats,
  addEntry, 
  getEntries, 
  voteEntry, 
  addReply, 
  getReplies,
  getCompanyStats,
  registerUser,
  loginUser,
  logoutUser,
  subscribeToEntries,
  getUserVote,
  subscribeToReplies,
  getUserDisplayName
} from '../lib/firebaseService';

export default function Home() {
  const [user, loading] = useAuthState(auth);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [companyStats, setCompanyStats] = useState<CompanyStats[]>([]);
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyingToEntry, setReplyingToEntry] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredEntries, setFilteredEntries] = useState<Entry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [userVotes, setUserVotes] = useState<{ [key: string]: 'like' | 'dislike' | null }>({});
  const [entriesWithReplies, setEntriesWithReplies] = useState<{ [key: string]: Reply[] }>({});
  const [userDisplayName, setUserDisplayName] = useState<string>('');

  const [newEntry, setNewEntry] = useState({
    company: '',
    title: '',
    content: ''
  });

  const [newReply, setNewReply] = useState('');

  const [authForm, setAuthForm] = useState({
    username: '',
    email: '',
    password: ''
  });

  useEffect(() => {
    if (user) {
      getUserDisplayName(user.uid).then(displayName => {
        setUserDisplayName(displayName);
      });
    }
  }, [user]);

  const loadUserVotes = async (entriesData: Entry[]) => {
    if (!user) return;

    const votes: { [key: string]: 'like' | 'dislike' | null } = {};

    for (const entry of entriesData) {
      if (entry.id) {
        const voteResult = await getUserVote(entry.id, user.uid);
        if (voteResult.success) {
          votes[entry.id] = voteResult.vote;
        }
      }
    }

    setUserVotes(votes);
  };

  const loadReplies = async (entriesData: Entry[]) => {
    const repliesData: { [key: string]: Reply[] } = {};

    for (const entry of entriesData) {
      if (entry.id) {
        try {
          const repliesResult = await getReplies(entry.id);
          if (repliesResult.success) {
            repliesData[entry.id] = repliesResult.replies;

            subscribeToReplies(entry.id, (newReplies) => {
              setEntriesWithReplies(prev => ({ 
                ...prev,
                [entry.id!]: newReplies
              }));
            });
          }
        } catch (error) {
          console.warn(`Error loading replies for entry ${entry.id}:`, error);
          repliesData[entry.id] = [];
        }
      }
    }

    setEntriesWithReplies(repliesData);
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [entriesResult, statsResult] = await Promise.all([
          getEntries(),
          getCompanyStats()
        ]);

        if (entriesResult.success) {
          setEntries(entriesResult.entries);
          setFilteredEntries(entriesResult.entries);

          await Promise.all([
            loadUserVotes(entriesResult.entries),
            loadReplies(entriesResult.entries)
          ]);
        } else {
          setError('Veriler yüklenirken hata oluştu');
        }

        if (statsResult.success) {
          setCompanyStats(statsResult.stats);
        }

      } catch (err) {
        setError('Bağlantı hatası oluştu');
        console.error('Data loading error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();

    let unsubscribe: (() => void) | null = null;

    setTimeout(() => {
      unsubscribe = subscribeToEntries(async (newEntries) => {
        setEntries(newEntries);
        handleSearch(searchQuery, newEntries);

        await Promise.all([
          loadUserVotes(newEntries),
          loadReplies(newEntries)
        ]);
      });
    }, 1000);

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    }
  }, [user, searchQuery]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleSearch = (query: string, entriesData?: Entry[]) => {
    const dataToFilter = entriesData || entries;

    if (!query.trim()) {
      setFilteredEntries(dataToFilter);
      return;
    }

    const filtered = dataToFilter.filter(entry => 
      entry.company.toLowerCase().includes(query.toLowerCase()) ||
      entry.title.toLowerCase().includes(query.toLowerCase()) ||
      entry.content.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredEntries(filtered);
  };

  const handleVote = async (entryId: string, voteType: 'like' | 'dislike') => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    const result = await voteEntry(entryId, voteType, user.uid);
    if (result.success) {
      const currentVote = userVotes[entryId];

      if (currentVote === voteType) {
        setUserVotes(prev => ({ ...prev, [entryId]: null }));
      } else {
        setUserVotes(prev => ({ ...prev, [entryId]: voteType }));
      }
    }
  };

  const handleSubmitEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    if (!newEntry.company || !newEntry.title || !newEntry.content) return;

    const displayName = userDisplayName || user.email?.split('@')[0] || 'Anonim';

    const result = await addEntry({
      company: newEntry.company,
      title: newEntry.title,
      content: newEntry.content,
      author: displayName,
      authorId: user.uid,
      date: new Date().toISOString().split('T')[0]
    });

    if (result.success) {
      setNewEntry({ company: '', title: '', content: '' });
      setShowWriteModal(false);

      const statsResult = await getCompanyStats();
      if (statsResult.success) {
        setCompanyStats(statsResult.stats);
      }
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (authMode === 'register') {
      if (!authForm.username || !authForm.email || !authForm.password) return;

      const result = await registerUser(authForm.email, authForm.password, authForm.username);
      if (result.success) {
        setShowAuthModal(false);
        setShowWriteModal(true);
        setAuthForm({ username: '', email: '', password: '' });
        setUserDisplayName(authForm.username);
      } else {
        setAuthError(result.error || 'Kayıt sırasında hata oluştu');
      }
    } else {
      if (!authForm.email || !authForm.password) return;

      const result = await loginUser(authForm.email, authForm.password);
      if (result.success) {
        setShowAuthModal(false);
        setShowWriteModal(true);
        setAuthForm({ username: '', email: '', password: '' });
      } else {
        setAuthError(result.error || 'Giriş sırasında hata oluştu');
      }
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    setUserVotes({});
    setEntriesWithReplies({});
    setUserDisplayName('');
  };

  const handleWriteClick = () => {
    if (user) {
      setShowWriteModal(true);
    } else {
      setShowAuthModal(true);
    }
  };

  const handleReply = async (entryId: string) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setReplyingToEntry(entryId);
    setShowReplyModal(true);
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReply.trim() || !replyingToEntry || !user) return;

    const displayName = userDisplayName || user.email?.split('@')[0] || 'Anonim';

    const result = await addReply(replyingToEntry, {
      content: newReply,
      author: displayName,
      authorId: user.uid,
      date: new Date().toISOString().split('T')[0]
    });

    if (result.success) {
      setNewReply('');
      setReplyingToEntry(null);
      setShowReplyModal(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <i className="ri-loader-4-line text-4xl text-red-600 animate-spin mb-4"></i>
          <p className="text-gray-600">Bağlanıyor...</p>
        </div>
      </div>
    );
  }

  if (isLoading && entries.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <i className="ri-loader-4-line text-4xl text-red-600 animate-spin mb-4"></i>
          <p className="text-gray-600">Veriler yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <i className="ri-error-warning-line text-4xl text-red-600 mb-4"></i>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-red-600 text-white px-6 py-2 rounded-full hover:bg-red-700 transition-colors cursor-pointer"
          >
            Yeniden Dene
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Dertlio - Şirket Şikayetleri ve Deneyimler Platformu</title>
        <meta name="description" content="Şirketler hakkında deneyimlerinizi paylaşın, şikayetlerinizi dile getirin ve diğer kullanıcıların deneyimlerinden faydalanın. Türkiye'nin en güvenilir şikayet platformu." />
        <meta name="keywords" content="şikayet, şirket deneyimi, tüketici hakları, müşteri memnuniyeti, firma değerlendirme" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <link rel="canonical" href="https://dertlio.com" />
        <meta property="og:title" content="Dertlio - Şirket Şikayetleri ve Deneyimler Platformu" />
        <meta property="og:description" content="Şirketler hakkında deneyimlerinizi paylaşın, şikayetlerinizi dile getirin ve diğer kullanıcıların deneyimlerinden faydalanın." />
        <meta property="og:url" content="https://dertlio.com" />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="tr_TR" />
        <meta property="og:site_name" content="Dertlio" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "Dertlio",
            "url": "https://dertlio.com",
            "description": "Şirketler hakkında deneyimlerinizi paylaşın, şikayetlerinizi dile getirin ve diğer kullanıcıların deneyimlerinden faydalanın.",
            "potentialAction": {
              "@type": "SearchAction",
              "target": "https://dertlio.com/?q={search_term_string}",
              "query-input": "required name=search_term_string"
            }
          })}
        </script>
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="px-4 py-4">
            <div className="flex items-center justify-between max-w-7xl mx-auto">
              <Link href="/" className="flex items-center gap-2">
                <img 
                  src="https://static.readdy.ai/image/7787a2ce36fec40941bbbef8cf7f1725/91fea210aebe086edefc8a9b37eab84b.png" 
                  alt="Dertlio - Şikayet Platformu Logosu" 
                  className="h-8 w-auto"
                />
              </Link>

              <nav className="hidden md:flex items-center gap-6">
                <Link href="/" className="text-gray-900 font-medium">
                  Ana Sayfa
                </Link>
                <Link href="/gizlilik" className="text-gray-600 hover:text-gray-900 transition-colors cursor-pointer">
                  Gizlilik ve Güvenlik Politikası
                </Link>
              </nav>

              <div className="flex-1 max-w-md mx-2 sm:mx-8">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Firma, konu veya içerik ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                    aria-label="Arama"
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 flex items-center justify-center">
                    <i className="ri-search-line text-gray-400" aria-hidden="true"></i>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                {user ? (
                  <>
                    <span className="hidden sm:block text-sm text-gray-600">
                      Merhaba, <span className="font-medium">{userDisplayName}</span>
                    </span>
                    <button 
                      onClick={handleWriteClick}
                      className="bg-red-600 text-white px-4 sm:px-6 py-2 rounded-full hover:bg-red-700 transition-colors whitespace-nowrap cursor-pointer text-sm"
                      aria-label="Dert Yaz"
                    >
                      <span className="hidden sm:inline">Dert Yaz</span>
                      <span className="sm:hidden">Yaz</span>
                    </button>
                    <Link 
                      href="/admin"
                      className="text-gray-600 hover:text-gray-800 cursor-pointer p-2"
                      title="Admin Panel"
                      aria-label="Admin Panel"
                    >
                      <i className="ri-admin-line" aria-hidden="true"></i>
                    </Link>
                    <button 
                      onClick={handleLogout}
                      className="text-gray-600 hover:text-gray-800 cursor-pointer p-2"
                      title="Çıkış Yap"
                      aria-label="Çıkış Yap"
                    >
                      <i className="ri-logout-box-line" aria-hidden="true"></i>
                    </button>
                  </>

                ) : (
                  <button 
                    onClick={handleWriteClick}
                    className="bg-red-600 text-white px-4 sm:px-6 py-2 rounded-full hover:bg-red-700 transition-colors whitespace-nowrap cursor-pointer text-sm"
                    aria-label="Dert Yaz"
                  >
                    <span className="hidden sm:inline">Dert Yaz</span>
                    <span className="sm:hidden">Yaz</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            {/* Sidebar - Popular Companies */}
            <aside className="w-full lg:w-80 lg:flex-shrink-0 order-2 lg:order-1">
              <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
                <h2 className="text-lg font-semibold mb-4 text-gray-800">En Çok Şikayet Edilen Firmalar</h2>
                <div className="space-y-3">
                  {companyStats.slice(0, 8).map((company, index) => (
                    <Link 
                      key={company.name}
                      href={`/firma/${company.name.toLowerCase().replace(/\\s+/g, '-')}`}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 bg-red-100 text-red-700 rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </span>
                        <span className="font-medium text-gray-800 text-sm sm:text-base">{company.name}</span>
                      </div>
                      <span className="text-sm text-gray-500">{company.totalComplaints}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </aside>

            {/* Main Content - Entry Feed */}
            <div className="flex-1 order-1 lg:order-2">
              {searchQuery && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <span className="text-sm text-blue-700">
                    "<span className="font-medium">{searchQuery}</span>" için {filteredEntries.length} sonuç bulundu
                  </span>
                  {filteredEntries.length > 0 && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="ml-2 text-blue-600 hover:text-blue-800 text-sm cursor-pointer"
                    >
                      Temizle
                    </button>
                  )}
                </div>
              )}

              <div className="space-y-4">
                {filteredEntries.length === 0 ? (
                  <div className="bg-white rounded-lg border border-gray-200 p-8 sm:p-12 text-center">
                    <i className="ri-search-line text-4xl text-gray-300 mb-4" aria-hidden="true"></i>
                    <h3 className="text-lg font-medium text-gray-600 mb-2">
                      {searchQuery ? 'Aradığınız içerik bulunamadı' : 'Henüz hiç deneyim paylaşılmamış'}
                    </h3>
                    <p className="text-gray-500 mb-4">
                      {searchQuery ? 'Farklı kelimeler deneyebilirsiniz' : 'İlk deneyimi paylaşan sen ol!'}
                    </p>
                    {!searchQuery && (
                      <button 
                        onClick={handleWriteClick}
                        className="bg-red-600 text-white px-6 py-2 rounded-full hover:bg-red-700 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        İlk Deneyimi Paylaş
                      </button>
                    )}
                  </div>
                ) : (
                  filteredEntries.map((entry) => (
                    <article key={entry.id} className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 hover:shadow-sm transition-shadow">
                      <div className="flex flex-wrap items-start justify-between mb-3 gap-2">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                          <Link 
                            href={`/firma/${entry.company.toLowerCase().replace(/\\s+/g, '-')}`}
                            className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium hover:bg-red-200 transition-colors cursor-pointer"
                          >
                            {entry.company}
                          </Link>
                          <span className="text-gray-500 text-sm hidden sm:inline" aria-hidden="true">•</span>
                          <span className="text-gray-500 text-sm">{entry.author}</span>
                          <span className="text-gray-500 text-sm hidden sm:inline" aria-hidden="true">•</span>
                          <time className="text-gray-500 text-sm" dateTime={entry.date}>
                            {new Date(entry.date).toLocaleDateString('tr-TR')}
                          </time>
                        </div>
                      </div>

                      <h3 className="text-lg font-semibold text-gray-800 mb-3">{entry.title}</h3>
                      <p className="text-gray-700 leading-relaxed mb-4 break-words">{entry.content}</p>

                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => handleVote(entry.id!, 'like')}
                            className={`flex items-center gap-1 px-3 py-1 rounded-full transition-colors cursor-pointer ${ 
                              userVotes[entry.id!] === 'like' 
                                ? 'bg-green-100 text-green-700' 
                                : 'hover:bg-green-100 text-green-600'
                            }`}
                            aria-label={`Beğen (${entry.likes || 0})`}
                          >
                            <i className="ri-thumb-up-line" aria-hidden="true"></i>
                            <span className="text-sm font-medium">{entry.likes || 0}</span>
                          </button>
                          
                          <button 
                            onClick={() => handleVote(entry.id!, 'dislike')}
                            className={`flex items-center gap-1 px-3 py-1 rounded-full transition-colors cursor-pointer ${ 
                              userVotes[entry.id!] === 'dislike' 
                                ? 'bg-red-100 text-red-700' 
                                : 'hover:bg-red-100 text-red-600'
                            }`}
                            aria-label={`Beğenme (${entry.dislikes || 0})`}
                          >
                            <i className="ri-thumb-down-line" aria-hidden="true"></i>
                            <span className="text-sm font-medium">{entry.dislikes || 0}</span>
                          </button>
                        </div>

                        <button 
                          onClick={() => handleReply(entry.id!)}
                          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
                          aria-label="Yanıtla"
                        >
                          <i className="ri-chat-3-line" aria-hidden="true"></i>
                          <span className="text-sm hidden sm:inline">Yanıtla</span>
                          {entriesWithReplies[entry.id!] && entriesWithReplies[entry.id!].length > 0 && (
                            <span className="text-sm">({entriesWithReplies[entry.id!].length})</span>
                          )}
                        </button>
                      </div>

                      {entriesWithReplies[entry.id!] && entriesWithReplies[entry.id!].length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <div className="space-y-3">
                            {entriesWithReplies[entry.id!].map((reply) => (
                              <div key={reply.id} className="bg-gray-50 rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-sm font-medium text-gray-700">{reply.author}</span>
                                  <span className="text-xs text-gray-500" aria-hidden="true">•</span>
                                  <time className="text-xs text-gray-500" dateTime={reply.date}>
                                    {new Date(reply.date).toLocaleDateString('tr-TR')}
                                  </time>
                                </div>
                                <p className="text-sm text-gray-700">{reply.content}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </article>
                  ))
                )}
              </div>
            </div>
          </div>
        </main>

        {/* Auth Modal */}
        {showAuthModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">
                  {authMode === 'login' ? 'Giriş Yap' : 'Hesap Oluştur'}
                </h2>
                <button 
                  onClick={() => {
                    setShowAuthModal(false);
                    setAuthError(null);
                  }}
                  className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full cursor-pointer"
                >
                  <i className="ri-close-line text-gray-500"></i>
                </button>
              </div>

              {authError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{authError}</p>
                </div>
              )}

              <form onSubmit={handleAuth} className="space-y-4">
                {authMode === 'register' && (
                  <div>
                    <input
                      type="text"
                      placeholder="Kullanıcı adı (takma ad)"
                      value={authForm.username}
                      onChange={(e) => setAuthForm({...authForm, username: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                      required
                    />
                  </div>
                )}

                <div>
                  <input
                    type="email"
                    placeholder="E-posta adresi"
                    value={authForm.email}
                    onChange={(e) => setAuthForm({...authForm, email: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                    required
                  />
                </div>

                <div>
                  <input
                    type="password"
                    placeholder="Şifre"
                    value={authForm.password}
                    onChange={(e) => setAuthForm({...authForm, password: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors font-medium cursor-pointer whitespace-nowrap"
                >
                  {authMode === 'login' ? 'Giriş Yap' : 'Hesap Oluştur'}
                </button>
              </form>

              <div className="mt-4 text-center">
                <button
                  onClick={() => {
                    setAuthMode(authMode === 'login' ? 'register' : 'login');
                    setAuthError(null);
                  }}
                  className="text-red-600 hover:text-red-700 text-sm cursor-pointer"
                >
                  {authMode === 'login' 
                    ? 'Hesabın yok mu? Hesap oluştur' 
                    : 'Zaten hesabın var mı? Giriş yap'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Write Entry Modal */}
        {showWriteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Derdini Anlat</h2>
                <button 
                  onClick={() => setShowWriteModal(false)}
                  className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full cursor-pointer"
                >
                  <i className="ri-close-line text-gray-500"></i>
                </button>
              </div>

              <form onSubmit={handleSubmitEntry} className="space-y-4">
                <div>
                  <input
                    type="text"
                    placeholder="Firma adı..."
                    value={newEntry.company}
                    onChange={(e) => setNewEntry({...newEntry, company: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                    required
                  />
                </div>

                <div>
                  <input
                    type="text"
                    placeholder="Konu başlığı..."
                    value={newEntry.title}
                    onChange={(e) => setNewEntry({...newEntry, title: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                    required
                  />
                </div>

                <div>
                  <textarea
                    placeholder="Yaşadığın sorunu detaylı anlat..."
                    value={newEntry.content}
                    onChange={(e) => setNewEntry({...newEntry, content: e.target.value})}
                    rows={4}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm resize-none"
                    maxLength={500}
                    required
                  />
                  <div className="text-right text-xs text-gray-500 mt-1">
                    {newEntry.content.length}/500
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors font-medium cursor-pointer whitespace-nowrap"
                >
                  Derdi Paylaş
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Reply Modal */}
        {showReplyModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Yanıt Yaz</h2>
                <button 
                  onClick={() => setShowReplyModal(false)}
                  className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full cursor-pointer"
                >
                  <i className="ri-close-line text-gray-500"></i>
                </button>
              </div>

              <form onSubmit={handleSubmitReply} className="space-y-4">
                <div>
                  <textarea
                    placeholder="Yanıtını yaz..."
                    value={newReply}
                    onChange={(e) => setNewReply(e.target.value)}
                    rows={4}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm resize-none"
                    maxLength={300}
                    required
                  />
                  <div className="text-right text-xs text-gray-500 mt-1">
                    {newReply.length}/300
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors font-medium cursor-pointer whitespace-nowrap"
                >
                  Yanıtı Gönder
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
