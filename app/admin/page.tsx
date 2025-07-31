
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../lib/firebase';
import { 
  Entry, 
  Reply,
  UserProfile,
  CompanyStats,
  getEntries, 
  getCompanyStats,
  getUsers,
  getAllReplies,
  deleteEntry,
  deleteReply,
  updateEntry,
  updateReply,
  subscribeToEntries,
  subscribeToUsers,
  subscribeToAllReplies,
  voteEntry
} from '../../lib/firebaseService';

export default function AdminPage() {
  const [user, loading] = useAuthState(auth);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [companyStats, setCompanyStats] = useState<CompanyStats[]>([]);
  const [selectedTab, setSelectedTab] = useState<'entries' | 'replies' | 'users' | 'stats'>('entries');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredEntries, setFilteredEntries] = useState<Entry[]>([]);
  const [filteredReplies, setFilteredReplies] = useState<Reply[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [editingReply, setEditingReply] = useState<Reply | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showEditReplyModal, setShowEditReplyModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeleteReplyModal, setShowDeleteReplyModal] = useState(false);
  const [deletingEntryId, setDeletingEntryId] = useState<string | null>(null);
  const [deletingReplyId, setDeletingReplyId] = useState<string | null>(null);

  const [editForm, setEditForm] = useState({
    company: '',
    title: '',
    content: '',
    author: ''
  });

  const [editReplyForm, setEditReplyForm] = useState({
    content: '',
    author: ''
  });

  const isAdmin = user?.email === 'grafikerius@dertlio.com' || user?.email === 'admin@dertlio.com';

  useEffect(() => {
    if (loading) return;

    if (!user || !isAdmin) {
      window.location.href = '/';
      return;
    }

    const loadData = async () => {
      setIsLoading(true);

      try {
        const [entriesResult, repliesResult, usersResult, statsResult] = await Promise.all([
          getEntries(),
          getAllReplies(),
          getUsers(),
          getCompanyStats()
        ]);

        if (entriesResult.success) {
          setEntries(entriesResult.entries);
          setFilteredEntries(entriesResult.entries);
        }

        if (repliesResult.success) {
          setReplies(repliesResult.replies);
          setFilteredReplies(repliesResult.replies);
        }

        if (usersResult.success) {
          setUsers(usersResult.users);
          setFilteredUsers(usersResult.users);
        }

        if (statsResult.success) {
          setCompanyStats(statsResult.stats);
        }
      } catch (error) {
        console.error('Data loading error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();

    const unsubscribeEntries = subscribeToEntries((newEntries) => {
      setEntries(newEntries);
      handleSearch(searchQuery, newEntries, 'entries');
    });

    const unsubscribeReplies = subscribeToAllReplies((newReplies) => {
      setReplies(newReplies);
      handleSearch(searchQuery, newReplies, 'replies');
    });

    const unsubscribeUsers = subscribeToUsers((newUsers) => {
      setUsers(newUsers);
      handleSearch(searchQuery, newUsers, 'users');
    });

    return () => {
      unsubscribeEntries();
      unsubscribeReplies();
      unsubscribeUsers();
    };
  }, [user, loading, isAdmin, searchQuery]);

  const handleSearch = (query: string, data?: any[], type?: string) => {
    setSearchQuery(query);

    if (selectedTab === 'entries' || type === 'entries') {
      const dataToFilter = data || entries;
      if (!query.trim()) {
        setFilteredEntries(dataToFilter);
        return;
      }
      const filtered = dataToFilter.filter((entry: Entry) => 
        entry.company.toLowerCase().includes(query.toLowerCase()) ||
        entry.title.toLowerCase().includes(query.toLowerCase()) ||
        entry.content.toLowerCase().includes(query.toLowerCase()) ||
        entry.author.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredEntries(filtered);
    }

    if (selectedTab === 'replies' || type === 'replies') {
      const dataToFilter = data || replies;
      if (!query.trim()) {
        setFilteredReplies(dataToFilter);
        return;
      }
      const filtered = dataToFilter.filter((reply: Reply) => 
        reply.content.toLowerCase().includes(query.toLowerCase()) ||
        reply.author.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredReplies(filtered);
    }

    if (selectedTab === 'users' || type === 'users') {
      const dataToFilter = data || users;
      if (!query.trim()) {
        setFilteredUsers(dataToFilter);
        return;
      }
      const filtered = dataToFilter.filter((user: UserProfile) => 
        user.displayName.toLowerCase().includes(query.toLowerCase()) ||
        user.email.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  };

  const handleEditEntry = (entry: Entry) => {
    setEditingEntry(entry);
    setEditForm({
      company: entry.company,
      title: entry.title,
      content: entry.content,
      author: entry.author
    });
    setShowEditModal(true);
  };

  const handleUpdateEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntry) return;

    const result = await updateEntry(editingEntry.id!, {
      company: editForm.company,
      title: editForm.title,
      content: editForm.content,
      author: editForm.author
    });

    if (result.success) {
      setShowEditModal(false);
      setEditingEntry(null);
      setEditForm({ company: '', title: '', content: '', author: '' });
    }
  };

  const handleEditReply = (reply: Reply) => {
    setEditingReply(reply);
    setEditReplyForm({
      content: reply.content,
      author: reply.author
    });
    setShowEditReplyModal(true);
  };

  const handleUpdateReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReply) return;

    const result = await updateReply(editingReply.id!, {
      content: editReplyForm.content,
      author: editReplyForm.author
    });

    if (result.success) {
      setShowEditReplyModal(false);
      setEditingReply(null);
      setEditReplyForm({ content: '', author: '' });
    }
  };

  const handleDeleteEntry = async () => {
    if (!deletingEntryId) return;

    const result = await deleteEntry(deletingEntryId);
    if (result.success) {
      setShowDeleteModal(false);
      setDeletingEntryId(null);

      const statsResult = await getCompanyStats();
      if (statsResult.success) {
        setCompanyStats(statsResult.stats);
      }
    }
  };

  const handleDeleteReply = async () => {
    if (!deletingReplyId) return;

    const result = await deleteReply(deletingReplyId);
    if (result.success) {
      setShowDeleteReplyModal(false);
      setDeletingReplyId(null);
    }
  };

  const confirmDelete = (entryId: string) => {
    setDeletingEntryId(entryId);
    setShowDeleteModal(true);
  };

  const confirmDeleteReply = (replyId: string) => {
    setDeletingReplyId(replyId);
    setShowDeleteReplyModal(true);
  };

  const getEntryTitle = (entryId: string) => {
    const entry = entries.find(e => e.id === entryId);
    return entry ? `${entry.company} - ${entry.title}` : 'Bilinmeyen Entry';
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Tarih yok';
    try {
      return timestamp.toDate().toLocaleDateString('tr-TR');
    } catch {
      return 'Tarih yok';
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <i className="ri-loader-4-line text-4xl text-red-600 animate-spin mb-4"></i>
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <i className="ri-lock-line text-4xl text-red-600 mb-4"></i>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Erişim Engellendi</h1>
          <p className="text-gray-600 mb-4">Bu sayfaya erişim izniniz yok.</p>
          <Link href="/" className="bg-red-600 text-white px-6 py-2 rounded-full hover:bg-red-700 transition-colors cursor-pointer whitespace-nowrap">
            Ana Sayfaya Dön
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2">
                <img 
                  src="https://static.readdy.ai/image/7787a2ce36fec40941bbbef8cf7f1725/91fea210aebe086edefc8a9b37eab84b.png" 
                  alt="Dertlio Logo" 
                  className="h-8 w-auto"
                />
              </Link>
              <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium">
                Admin Panel
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">
                Merhaba, <span className="font-medium">{user.email?.split('@')[0]}</span>
              </span>
              <Link href="/" className="text-gray-600 hover:text-gray-800 cursor-pointer">
                <i className="ri-home-line"></i>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Admin Panel</h2>
          </div>

          <div className="flex flex-wrap gap-2">
            {(['entries', 'replies', 'users', 'stats'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setSelectedTab(tab);
                  setSearchQuery('');
                }}
                className={`px-4 py-2 rounded-lg transition-colors cursor-pointer ${
                  selectedTab === tab
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {tab === 'entries' && `Şikayetler (${entries.length})`}
                {tab === 'replies' && `Yanıtlar (${replies.length})`}
                {tab === 'users' && `Kullanıcılar (${users.length})`}
                {tab === 'stats' && `İstatistikler`}
              </button>
            ))}
          </div>

          {selectedTab !== 'stats' && (
            <div className="relative max-w-md">
              <input
                type="text"
                placeholder={`${selectedTab === 'entries' ? 'Şikayet' : selectedTab === 'replies' ? 'Yanıt' : 'Kullanıcı'} ara...`}
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 flex items-center justify-center">
                <i className="ri-search-line text-gray-400"></i>
              </div>
            </div>
          )}

          {selectedTab === 'entries' && (
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-semibold">Şikayetler ({filteredEntries.length})</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {filteredEntries.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    {searchQuery ? 'Aradığınız kriterlerde şikayet bulunamadı' : 'Henüz şikayet yok'}
                  </div>
                ) : (
                  filteredEntries.map((entry) => (
                    <div key={entry.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="bg-red-100 text-red-700 px-2 py-1 text-xs rounded-full font-medium">
                              {entry.company}
                            </span>
                            <span className="text-xs text-gray-500">
                              {entry.author} • {entry.date}
                            </span>
                          </div>
                          <h4 className="font-semibold text-gray-900 mb-2">{entry.title}</h4>
                          <p className="text-sm text-gray-600 mb-2">{entry.content.length > 200 ? entry.content.substring(0, 200) + '...' : entry.content}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <i className="ri-thumb-up-line text-green-600"></i>
                              {entry.likes || 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <i className="ri-thumb-down-line text-red-600"></i>
                              {entry.dislikes || 0}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => handleEditEntry(entry)}
                            className="text-blue-600 hover:text-blue-800 text-sm cursor-pointer"
                          >
                            Düzenle
                          </button>
                          <button
                            onClick={() => confirmDelete(entry.id!)}
                            className="text-red-600 hover:text-red-800 text-sm cursor-pointer"
                          >
                            Sil
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {selectedTab === 'replies' && (
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-semibold">Yanıtlar ({filteredReplies.length})</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {filteredReplies.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    {searchQuery ? 'Aradığınız kriterlerde yanıt bulunamadı' : 'Henüz yanıt yok'}
                  </div>
                ) : (
                  filteredReplies.map((reply) => (
                    <div key={reply.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 text-xs text-gray-500">
                            <span>{reply.author}</span>
                            <span>•</span>
                            <span>{reply.date}</span>
                            <span>•</span>
                            <span className="text-blue-600">{getEntryTitle(reply.entryId)}</span>
                          </div>
                          <p className="text-sm text-gray-600">{reply.content}</p>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => handleEditReply(reply)}
                            className="text-blue-600 hover:text-blue-800 text-sm cursor-pointer"
                          >
                            Düzenle
                          </button>
                          <button
                            onClick={() => confirmDeleteReply(reply.id!)}
                            className="text-red-600 hover:text-red-800 text-sm cursor-pointer"
                          >
                            Sil
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {selectedTab === 'users' && (
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-semibold">Kullanıcılar ({filteredUsers.length})</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {filteredUsers.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    {searchQuery ? 'Aradığınız kriterlerde kullanıcı bulunamadı' : 'Henüz kullanıcı yok'}
                  </div>
                ) : (
                  filteredUsers.map((user) => (
                    <div key={user.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">{user.displayName}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                          <div className="text-xs text-gray-400">
                            Kayıt: {formatDate(user.createdAt)}
                            {user.lastLogin && ` • Son giriş: ${formatDate(user.lastLogin)}`}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {selectedTab === 'stats' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <i className="ri-file-text-line text-red-600"></i>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Toplam Şikayet</h3>
                    <p className="text-2xl font-bold text-red-600">{entries.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <i className="ri-chat-3-line text-blue-600"></i>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Toplam Yanıt</h3>
                    <p className="text-2xl font-bold text-blue-600">{replies.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <i className="ri-user-line text-green-600"></i>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Toplam Kullanıcı</h3>
                    <p className="text-2xl font-bold text-green-600">{users.length}</p>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 lg:col-span-3 bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">En Çok Şikayet Edilen Firmalar</h3>
                <div className="space-y-3">
                  {companyStats.slice(0, 10).map((company, index) => (
                    <div key={company.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 bg-red-100 text-red-700 rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </span>
                        <span className="font-medium">{company.name}</span>
                      </div>
                      <span className="text-sm text-gray-500">{company.totalComplaints} şikayet</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      {showEditModal && editingEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Şikayeti Düzenle</h2>
              <button 
                onClick={() => setShowEditModal(false)}
                className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full cursor-pointer"
              >
                <i className="ri-close-line text-gray-500"></i>
              </button>
            </div>

            <form onSubmit={handleUpdateEntry} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Firma</label>
                <input
                  type="text"
                  value={editForm.company}
                  onChange={(e) => setEditForm({...editForm, company: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Başlık</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">İçerik</label>
                <textarea
                  value={editForm.content}
                  onChange={(e) => setEditForm({...editForm, content: e.target.value})}
                  rows={6}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Yazar</label>
                <input
                  type="text"
                  value={editForm.author}
                  onChange={(e) => setEditForm({...editForm, author: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                  required
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors cursor-pointer"
                >
                  Güncelle
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors cursor-pointer"
                >
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Şikayeti Sil</h2>
            <p className="text-gray-600 mb-6">Bu şikayeti silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.</p>
            <div className="flex gap-4">
              <button
                onClick={handleDeleteEntry}
                className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors cursor-pointer"
              >
                Sil
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors cursor-pointer"
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
