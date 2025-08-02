
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../lib/firebase';
import { 
  Entry, 
  Reply,
  getEntries,
  getAllReplies,
  updateEntry,
  deleteEntry,
  updateReply,
  deleteReply,
  getUserDisplayName,
  logoutUser
} from '../../lib/firebaseService';

export default function ProfilePage() {
  const [user, loading] = useAuthState(auth);
  const [userEntries, setUserEntries] = useState<Entry[]>([]);
  const [userReplies, setUserReplies] = useState<Reply[]>([]);
  const [activeTab, setActiveTab] = useState<'entries' | 'replies'>('entries');
  const [isLoading, setIsLoading] = useState(true);
  const [editingEntry, setEditingEntry] = useState<string | null>(null);
  const [editingReply, setEditingReply] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: '', content: '' });
  const [editReplyContent, setEditReplyContent] = useState('');
  const [userDisplayName, setUserDisplayName] = useState<string>('');
  const [showDeleteModal, setShowDeleteModal] = useState<{show: boolean, type: 'entry' | 'reply', id: string}>({show: false, type: 'entry', id: ''});

  // Admin kontrolü - sadece yetkili hesaplar için
  const isAdmin = user?.email === 'grafikerius@dertlio.com' || user?.email === 'admin@dertlio.com';

  useEffect(() => {
    if (!user) return;

    const loadUserData = async () => {
      try {
        setIsLoading(true);

        // Kullanıcı adını al
        const displayName = await getUserDisplayName(user.uid);
        setUserDisplayName(displayName);

        // Tüm entryleri al ve kullanıcıya ait olanları filtrele
        const entriesResult = await getEntries();
        if (entriesResult.success) {
          const myEntries = entriesResult.entries.filter(entry => entry.authorId === user.uid);
          setUserEntries(myEntries);
        }

        // Tüm yanıtları al ve kullanıcıya ait olanları filtrele
        const repliesResult = await getAllReplies();
        if (repliesResult.success) {
          const myReplies = repliesResult.replies.filter(reply => reply.authorId === user.uid);
          setUserReplies(myReplies);
        }

      } catch (error) {
        console.error('Profil verileri yüklenirken hata:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, [user]);

  const handleEditEntry = (entry: Entry) => {
    setEditingEntry(entry.id!);
    setEditForm({ title: entry.title, content: entry.content });
  };

  const handleEditReply = (reply: Reply) => {
    setEditingReply(reply.id!);
    setEditReplyContent(reply.content);
  };

  const handleUpdateEntry = async (entryId: string) => {
    if (!editForm.title.trim() || !editForm.content.trim()) return;

    const result = await updateEntry(entryId, {
      title: editForm.title,
      content: editForm.content
    });

    if (result.success) {
      setUserEntries(prev => prev.map(entry => 
        entry.id === entryId 
          ? { ...entry, title: editForm.title, content: editForm.content }
          : entry
      ));
      setEditingEntry(null);
      setEditForm({ title: '', content: '' });
    }
  };

  const handleUpdateReply = async (replyId: string) => {
    if (!editReplyContent.trim()) return;

    const result = await updateReply(replyId, {
      content: editReplyContent
    });

    if (result.success) {
      setUserReplies(prev => prev.map(reply => 
        reply.id === replyId 
          ? { ...reply, content: editReplyContent }
          : reply
      ));
      setEditingReply(null);
      setEditReplyContent('');
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    const result = await deleteEntry(entryId);
    if (result.success) {
      setUserEntries(prev => prev.filter(entry => entry.id !== entryId));
      setShowDeleteModal({show: false, type: 'entry', id: ''});
    }
  };

  const handleDeleteReply = async (replyId: string) => {
    const result = await deleteReply(replyId);
    if (result.success) {
      setUserReplies(prev => prev.filter(reply => reply.id !== replyId));
      setShowDeleteModal({show: false, type: 'reply', id: ''});
    }
  };

  const handleLogout = async () => {
    await logoutUser();
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <i className="ri-loader-4-line text-4xl text-red-600 animate-spin mb-4"></i>
          <p className="text-gray-600">Profil yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <i className="ri-user-line text-4xl text-gray-400 mb-4"></i>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Profil Sayfası</h2>
          <p className="text-gray-600 mb-4">Bu sayfayı görüntülemek için giriş yapmalısınız.</p>
          <Link 
            href="/"
            className="bg-red-600 text-white px-6 py-2 rounded-full hover:bg-red-700 transition-colors cursor-pointer whitespace-nowrap"
          >
            Ana Sayfaya Dön
          </Link>
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
            <Link href="/" className="flex items-center gap-2">
              <img 
                src="https://static.readdy.ai/image/7787a2ce36fec40941bbbef8cf7f1725/91fea210aebe086edefc8a9b37eab84b.png" 
                alt="Dertlio Logo" 
                className="h-8 w-auto"
              />
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              <Link href="/" className="text-gray-600 hover:text-gray-900 transition-colors cursor-pointer">
                Ana Sayfa
              </Link>
              {isAdmin && (
                <Link href="/admin" className="text-gray-600 hover:text-gray-900 transition-colors cursor-pointer">
                  Admin Panel
                </Link>
              )}
            </nav>

            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">
                Merhaba, <span className="font-medium">{userDisplayName}</span>
              </span>
              <button 
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-800 cursor-pointer p-2"
                title="Çıkış Yap"
              >
                <i className="ri-logout-box-line"></i>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Profile Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <i className="ri-user-line text-2xl text-red-600"></i>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{userDisplayName}</h1>
                <p className="text-gray-600">{user.email}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500 mb-1">Toplam Aktivite</div>
              <div className="flex gap-4">
                <div className="text-center">
                  <div className="text-xl font-bold text-red-600">{userEntries.length}</div>
                  <div className="text-xs text-gray-500">Entry</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-blue-600">{userReplies.length}</div>
                  <div className="text-xs text-gray-500">Yanıt</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('entries')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors cursor-pointer ${
                activeTab === 'entries'
                  ? 'bg-red-50 text-red-600 border-b-2 border-red-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <i className="ri-article-line mr-2"></i>
              Entry'lerim ({userEntries.length})
            </button>
            <button
              onClick={() => setActiveTab('replies')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors cursor-pointer ${
                activeTab === 'replies'
                  ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <i className="ri-chat-3-line mr-2"></i>
              Yanıtlarım ({userReplies.length})
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'entries' && (
              <div className="space-y-4">
                {userEntries.length === 0 ? (
                  <div className="text-center py-12">
                    <i className="ri-article-line text-4xl text-gray-300 mb-4"></i>
                    <h3 className="text-lg font-medium text-gray-600 mb-2">Henüz hiç entry yazmamışsınız</h3>
                    <p className="text-gray-500 mb-4">İlk entry'nizi yazarak başlayın!</p>
                    <Link 
                      href="/"
                      className="bg-red-600 text-white px-6 py-2 rounded-full hover:bg-red-700 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Entry Yaz
                    </Link>
                  </div>
                ) : (
                  userEntries.map((entry) => (
                    <div key={entry.id} className="border border-gray-200 rounded-lg p-4">
                      {editingEntry === entry.id ? (
                        <div className="space-y-4">
                          <input
                            type="text"
                            value={editForm.title}
                            onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                            placeholder="Başlık"
                          />
                          <textarea
                            value={editForm.content}
                            onChange={(e) => setEditForm({...editForm, content: e.target.value})}
                            rows={4}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm resize-none"
                            placeholder="İçerik"
                            maxLength={500}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleUpdateEntry(entry.id!)}
                              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors cursor-pointer whitespace-nowrap text-sm"
                            >
                              <i className="ri-check-line mr-1"></i>
                              Kaydet
                            </button>
                            <button
                              onClick={() => {
                                setEditingEntry(null);
                                setEditForm({ title: '', content: '' });
                              }}
                              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors cursor-pointer whitespace-nowrap text-sm"
                            >
                              <i className="ri-close-line mr-1"></i>
                              İptal
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <Link 
                                href={`/firma/${entry.company.toLowerCase().replace(/\\s+/g, '-')}`}
                                className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium hover:bg-red-200 transition-colors cursor-pointer"
                              >
                                {entry.company}
                              </Link>
                              <span className="text-gray-500 text-sm ml-3">{entry.date}</span>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEditEntry(entry)}
                                className="text-blue-600 hover:text-blue-800 cursor-pointer p-1"
                                title="Düzenle"
                              >
                                <i className="ri-edit-line"></i>
                              </button>
                              <button
                                onClick={() => setShowDeleteModal({show: true, type: 'entry', id: entry.id!})}
                                className="text-red-600 hover:text-red-800 cursor-pointer p-1"
                                title="Sil"
                              >
                                <i className="ri-delete-bin-line"></i>
                              </button>
                            </div>
                          </div>
                          <h3 className="text-lg font-semibold text-gray-800 mb-2">{entry.title}</h3>
                          <p className="text-gray-700 leading-relaxed mb-3">{entry.content}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <i className="ri-thumb-up-line"></i>
                              {entry.likes || 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <i className="ri-thumb-down-line"></i>
                              {entry.dislikes || 0}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'replies' && (
              <div className="space-y-4">
                {userReplies.length === 0 ? (
                  <div className="text-center py-12">
                    <i className="ri-chat-3-line text-4xl text-gray-300 mb-4"></i>
                    <h3 className="text-lg font-medium text-gray-600 mb-2">Henüz hiç yanıt yazmamışsınız</h3>
                    <p className="text-gray-500 mb-4">Entry'lere yanıt vererek başlayın!</p>
                    <Link 
                      href="/"
                      className="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Ana Sayfaya Git
                    </Link>
                  </div>
                ) : (
                  userReplies.map((reply) => (
                    <div key={reply.id} className="border border-gray-200 rounded-lg p-4">
                      {editingReply === reply.id ? (
                        <div className="space-y-4">
                          <textarea
                            value={editReplyContent}
                            onChange={(e) => setEditReplyContent(e.target.value)}
                            rows={3}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                            placeholder="Yanıt içeriği"
                            maxLength={300}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleUpdateReply(reply.id!)}
                              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors cursor-pointer whitespace-nowrap text-sm"
                            >
                              <i className="ri-check-line mr-1"></i>
                              Kaydet
                            </button>
                            <button
                              onClick={() => {
                                setEditingReply(null);
                                setEditReplyContent('');
                              }}
                              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors cursor-pointer whitespace-nowrap text-sm"
                            >
                              <i className="ri-close-line mr-1"></i>
                              İptal
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start justify-between mb-3">
                            <div className="text-sm text-gray-500">
                              Entry ID: {reply.entryId} • {reply.date}
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEditReply(reply)}
                                className="text-blue-600 hover:text-blue-800 cursor-pointer p-1"
                                title="Düzenle"
                              >
                                <i className="ri-edit-line"></i>
                              </button>
                              <button
                                onClick={() => setShowDeleteModal({show: true, type: 'reply', id: reply.id!})}
                                className="text-red-600 hover:text-red-800 cursor-pointer p-1"
                                title="Sil"
                              >
                                <i className="ri-delete-bin-line"></i>
                              </button>
                            </div>
                          </div>
                          <p className="text-gray-700 leading-relaxed">{reply.content}</p>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <i className="ri-delete-bin-line text-2xl text-red-600"></i>
              <h2 className="text-xl font-semibold">Silme Onayı</h2>
            </div>

            <p className="text-gray-600 mb-6">
              Bu {showDeleteModal.type === 'entry' ? 'entry\'yi' : 'yanıtı'} silmek istediğinizden emin misiniz? 
              Bu işlem geri alınamaz.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  if (showDeleteModal.type === 'entry') {
                    handleDeleteEntry(showDeleteModal.id);
                  } else {
                    handleDeleteReply(showDeleteModal.id);
                  }
                }}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors cursor-pointer whitespace-nowrap"
              >
                Evet, Sil
              </button>
              <button
                onClick={() => setShowDeleteModal({show: false, type: 'entry', id: ''})}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors cursor-pointer whitespace-nowrap"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
