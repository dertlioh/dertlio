
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../../lib/firebase';
import { 
  Entry, 
  Reply,
  addEntry, 
  getEntries, 
  voteEntry, 
  registerUser,
  loginUser,
  logoutUser,
  subscribeToEntries,
  getUserVote,
  getReplies,
  addReply,
  subscribeToReplies
} from '../../../lib/firebaseService';

const companyInfo: { [key: string]: { name: string; description: string } } = {
  'turkcell': {
    name: 'Turkcell',
    description: 'Türkiye\'nin en büyük GSM operatörü'
  },
  'vodafone': {
    name: 'Vodafone',
    description: 'Küresel telekomünikasyon şirketi'
  },
  'zara': {
    name: 'Zara',
    description: 'İspanyol kökenli moda markası'
  },
  'migros': {
    name: 'Migros',
    description: 'Türkiye\'nin önde gelen market zinciri'
  },
  'lc-waikiki': {
    name: 'LC Waikiki',
    description: 'Uygun fiyatlı giyim ve ev tekstili markası'
  },
  'lcw': {
    name: 'LC Waikiki',
    description: 'Uygun fiyatlı giyim ve ev tekstili markası'
  }
};

const formatCompanyName = (urlName: string): string => {
  if (!urlName) return 'Firma';

  let decoded = urlName;
  try {
    decoded = decodeURIComponent(urlName);
  } catch (e) {
    // Decode hatası varsa orijinal kullan
  }

  const companyMappings: { [key: string]: string } = {
    'lc%20waikiki': 'LC Waikiki',
    'lc-waikiki': 'LC Waikiki', 
    'lc waikiki': 'LC Waikiki',
    'lcw': 'LC Waikiki',
    'turk-telekom': 'Türk Telekom',
    'türk-telekom': 'Türk Telekom',
    'turk%20telekom': 'Türk Telekom',
    'türk%20telekom': 'Türk Telekom',
    'aycra%20ajans': 'Aycra Ajans',
    'aycra-ajans': 'Aycra Ajans',
    'aycra ajans': 'Aycra Ajans',
    'aycra': 'Aycra',
    'migros': 'Migros',
    'bim': 'BİM',
    'a101': 'A101',
    'şok': 'ŞOK',
    'carrefour': 'CarrefourSA',
    'teknosa': 'Teknosa',
    'vatan': 'Vatan Bilgisayar',
    'media-markt': 'Media Markt',
    'n11': 'N11',
    'hepsiburada': 'Hepsiburada',
    'trendyol': 'Trendyol',
    'gittigidiyor': 'GittiGidiyor',
    'vodafone': 'Vodafone',
    'turkcell': 'Turkcell'
  };

  const lowerUrl = urlName.toLowerCase();
  const lowerDecoded = decoded.toLowerCase();

  if (companyMappings[lowerUrl]) {
    return companyMappings[lowerUrl];
  }

  if (companyMappings[lowerDecoded]) {
    return companyMappings[lowerDecoded];
  }

  let formatted = decoded
    .replace(/-/g, ' ')
    .replace(/\+/g, ' ')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  formatted = formatted
    .split(' ')
    .map(word => {
      if (word.length === 0) return word;

      if (word.length <= 3 && word.toUpperCase() === word) {
        return word.toUpperCase();
      }

      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');

  if (!formatted || formatted.length < 2) {
    return 'Firma';
  }

  return formatted;
};

export default function CompanyPage({ companyName }: { companyName: string }) {
  const [user, loading] = useAuthState(auth);
  const [entries, setEntries] = useState<Entry[]>([]);
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
  const [entriesWithReplies, setEntriesWithReplies] = useState<{ [key: string]: Reply[] }>( {});

  const [newEntry, setNewEntry] = useState({ title: '', content: '' });
  const [newReply, setNewReply] = useState('');
  const [authForm, setAuthForm] = useState({
    username: '',
    email: '',
    password: ''
  });

  const formattedCompanyName = formatCompanyName(companyName);

  const company = companyInfo[companyName.toLowerCase()] || {
    name: formattedCompanyName,
    description: `${formattedCompanyName} hakkında şikayetler`
  };

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
        const repliesResult = await getReplies(entry.id);
        if (repliesResult.success) {
          repliesData[entry.id] = repliesResult.replies;
        }

        subscribeToReplies(entry.id, (newReplies) => {
          setEntriesWithReplies(prev => ({ ...prev, [entry.id!]: newReplies }));
        });
      }
    }

    setEntriesWithReplies(repliesData);
  };

  useEffect(() => {
    const loadEntries = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const result = await getEntries(company.name);
        if (result.success) {
          setEntries(result.entries);
          setFilteredEntries(result.entries);

          await Promise.all([
            loadUserVotes(result.entries),
            loadReplies(result.entries)
          ]);
        } else {
          setError('Veriler yüklenirken hata oluştu');
        }
      } catch (err) {
        setError('Bağlantı hatası oluştu');
        console.error('Entry loading error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadEntries();

    let unsubscribe: (() => void) | null = null;

    setTimeout(() => {
      unsubscribe = subscribeToEntries(async (newEntries) => {
        setEntries(newEntries);
        handleSearch(searchQuery, newEntries);

        await Promise.all([
          loadUserVotes(newEntries),
          loadReplies(newEntries)
        ]);
      }, company.name);
    }, 1000);

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [companyName, company.name, user, searchQuery]);

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
    if (!newEntry.title || !newEntry.content) return;

    const result = await addEntry({
      company: company.name,
      title: newEntry.title,
      content: newEntry.content,
      author: authForm.username || user.email?.split('@')[0] || 'Anonim',
      authorId: user.uid,
      date: new Date().toISOString().split('T')[0]
    });

    if (result.success) {
      setNewEntry({ title: '', content: '' });
      setShowWriteModal(false);
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

    const result = await addReply(replyingToEntry, {
      content: newReply,
      author: authForm.username || user.email?.split('@')[0] || 'Anonim',
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <Link href="/" className="text-2xl font-bold text-red-600" style={{ fontFamily: 'Pacifico, serif' }}>
              <img 
                src="https://static.readdy.ai/image/7787a2ce36fec40941bbbef8cf7f1725/91fea210aebe086edefc8a9b37eab84b.png" 
                alt="Dertlio Logo" 
                className="h-8 w-auto"
              />
            </Link>

            <div className="flex-1 max-w-md mx-2 sm:mx-8">
              <div className="relative">
                <input
                  type="text"
                  placeholder={`${company.name} içinde ara...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 flex items-center justify-center">
                  <i className="ri-search-line text-gray-400"></i>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {user ? (
                <>
                  <span className="hidden sm:block text-sm text-gray-600">
                    Merhaba, <span className="font-medium">{user.email?.split('@')[0]}</span>
                  </span>
                  <button 
                    onClick={handleWriteClick}
                    className="bg-red-600 text-white px-3 sm:px-6 py-2 rounded-full hover:bg-red-700 transition-colors whitespace-nowrap cursor-pointer text-sm"
                  >
                    <span className="hidden sm:inline">Bu Firma Hakkında Yaz</span>
                    <span className="sm:hidden">Yaz</span>
                  </button>
                  <button 
                    onClick={handleLogout}
                    className="text-gray-600 hover:text-gray-800 cursor-pointer p-2"
                  >
                    <i className="ri-logout-box-line"></i>
                  </button>
                </>
              ) : (
                <button 
                  onClick={handleWriteClick}
                  className="bg-red-600 text-white px-3 sm:px-6 py-2 rounded-full hover:bg-red-700 transition-colors whitespace-nowrap cursor-pointer text-sm"
                >
                  <span className="hidden sm:inline">Bu Firma Hakkında Yaz</span>
                  <span className="sm:hidden">Yaz</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Company Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">{company.name}</h1>
              <p className="text-gray-600 text-sm sm:text-base">{company.description}</p>
            </div>
            <div className="text-center sm:text-right">
              <div className="text-2xl font-bold text-red-600">{entries.length}</div>
              <div className="text-sm text-gray-500">Toplam Şikayet</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors cursor-pointer">
              <i className="ri-arrow-left-line"></i>
              <span>Ana Sayfa</span>
            </Link>
            <div className="flex items-center gap-2 text-gray-500">
              <i className="ri-building-line"></i>
              <span>{entries.length} Entry</span>
            </div>
          </div>
        </div>

        {/* Search Results */}
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

        {/* Entries */}
        <div className="space-y-4">
          {filteredEntries.length === 0 && !searchQuery ? (
            <div className="bg-white rounded-lg border border-gray-200 p-8 sm:p-12 text-center">
              <i className="ri-chat-3-line text-4xl text-gray-300 mb-4"></i>
              <h3 className="text-lg font-medium text-gray-600 mb-2">
                {company.name} hakkında henüz hiç entry yok
              </h3>
              <p className="text-gray-500 mb-4">İlk yazan sen ol!</p>
              <button 
                onClick={handleWriteClick}
                className="bg-red-600 text-white px-6 py-2 rounded-full hover:bg-red-700 transition-colors cursor-pointer whitespace-nowrap"
              >
                İlk Entry'ı Yaz
              </button>
            </div>
          ) : filteredEntries.length === 0 && searchQuery ? (
            <div className="bg-white rounded-lg border border-gray-200 p-8 sm:p-12 text-center">
              <i className="ri-search-line text-4xl text-gray-300 mb-4"></i>
              <h3 className="text-lg font-medium text-gray-600 mb-2">
                Aradığınız içerik bulunamadı
              </h3>
              <p className="text-gray-500">Farklı kelimeler deneyebilirsiniz</p>
            </div>
          ) : (
            filteredEntries.map((entry) => (
              <div key={entry.id} className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 hover:shadow-sm transition-shadow">
                <div className="flex flex-wrap items-start justify-between mb-3 gap-2">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <span className="text-gray-500 text-sm">{entry.author}</span>
                    <span className="text-gray-500 text-sm hidden sm:inline">•</span>
                    <span className="text-gray-500 text-sm">{entry.date}</span>
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
                    >
                      <i className="ri-thumb-up-line"></i>
                      <span className="text-sm font-medium">{entry.likes || 0}</span>
                    </button>

                    <button 
                      onClick={() => handleVote(entry.id!, 'dislike')}
                      className={`flex items-center gap-1 px-3 py-1 rounded-full transition-colors cursor-pointer ${ 
                        userVotes[entry.id!] === 'dislike' 
                          ? 'bg-red-100 text-red-700' 
                          : 'hover:bg-red-100 text-red-600'
                      }`}
                    >
                      <i className="ri-thumb-down-line"></i>
                      <span className="text-sm font-medium">{entry.dislikes || 0}</span>
                    </button>
                  </div>

                  <button 
                    onClick={() => handleReply(entry.id!)}
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
                  >
                    <i className="ri-chat-3-line"></i>
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
                            <span className="text-xs text-gray-500">•</span>
                            <span className="text-xs text-gray-500">{reply.date}</span>
                          </div>
                          <p className="text-sm text-gray-700">{reply.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

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
                  : 'Zaten hesabın var mı? Giriş yap'
                }
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
              <h2 className="text-xl font-semibold">{company.name} Hakkında</h2>
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
                Entry Paylaş
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
  );
}
