
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

export default function AdminPanel() {
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

  // Check if user is admin
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

    // Subscribe to real-time updates
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
      {/* Header */}
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

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="bg-white rounded-lg border border-gray-200 mb-6">
          <div className="flex border-b border-gray-200 overflow-x-auto">
            <button
              onClick={() => setSelectedTab('entries')}
              className={`px-6 py-3 font-medium transition-colors cursor-pointer whitespace-nowrap ${
                selectedTab === 'entries'
                  ? 'text-red-600 border-b-2 border-red-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Entryler ({entries.length})
            </button>
            <button
              onClick={() => setSelectedTab('replies')}
              className={`px-6 py-3 font-medium transition-colors cursor-pointer whitespace-nowrap ${
                selectedTab === 'replies'
                  ? 'text-red-600 border-b-2 border-red-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Yanıtlar ({replies.length})
            </button>
            <button
              onClick={() => setSelectedTab('users')}
              className={`px-6 py-3 font-medium transition-colors cursor-pointer whitespace-nowrap ${
                selectedTab === 'users'
                  ? 'text-red-600 border-b-2 border-red-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Kullanıcılar ({users.length})
            </button>
            <button
              onClick={() => setSelectedTab('stats')}
              className={`px-6 py-3 font-medium transition-colors cursor-pointer whitespace-nowrap ${
                selectedTab === 'stats'
                  ? 'text-red-600 border-b-2 border-red-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              İstatistikler
            </button>
          </div>

          {/* Search Bar */}
          {selectedTab !== 'stats' && (
            <div className="p-6 border-b border-gray-200">
              <div className="relative max-w-md">
                <input
                  type="text"
                  placeholder={
                    selectedTab === 'entries' ? 'Entry ara...' :
                    selectedTab === 'replies' ? 'Yanıt ara...' :
                    'Kullanıcı ara...'
                  }
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 flex items-center justify-center">
                  <i className="ri-search-line text-gray-400"></i>
                </div>
              </div>
            </div>
          )}

          {/* Entries Tab */}
          {selectedTab === 'entries' && (
            <div className="p-6">
              <div className="space-y-4">
                {filteredEntries.map((entry) => (
                  <div key={entry.id} className="bg-gray-50 rounded-lg p-4 border">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium">
                          {entry.company}
                        </span>
                        <span className="text-gray-500 text-sm">{entry.author}</span>
                        <span className="text-gray-500 text-sm">•</span>
                        <span className="text-gray-500 text-sm">{entry.date}</span>
                        <span className="text-gray-500 text-sm">•</span>
                        <span className="text-gray-500 text-sm">{(entry.likes || 0) + (entry.dislikes || 0)} oy</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditEntry(entry)}
                          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-blue-100 transition-colors cursor-pointer"
                        >
                          <i className="ri-edit-line text-blue-600"></i>
                        </button>
                        <button
                          onClick={() => confirmDelete(entry.id!)}
                          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-100 transition-colors cursor-pointer"
                        >
                          <i className="ri-delete-bin-line text-red-600"></i>
                        </button>
                      </div>
                    </div>
                    <h3 className="font-semibold text-gray-800 mb-2">{entry.title}</h3>
                    <p className="text-gray-700 text-sm leading-relaxed">{entry.content}</p>
                  </div>
                ))}

                {filteredEntries.length === 0 && (
                  <div className="text-center py-12">
                    <i className="ri-inbox-line text-4xl text-gray-300 mb-4"></i>
                    <p className="text-gray-500">
                      {searchQuery ? 'Arama sonucu bulunamadı' : 'Henüz hiç entry yok'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Replies Tab */}
          {selectedTab === 'replies' && (
            <div className="p-6">
              <div className="space-y-4">
                {filteredReplies.map((reply) => (
                  <div key={reply.id} className="bg-gray-50 rounded-lg p-4 border">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                          {reply.author}
                        </span>
                        <span className="text-gray-500 text-sm">{reply.date}</span>
                        <span className="text-gray-500 text-sm">•</span>
                        <span className="text-gray-500 text-sm">{(reply.likes || 0) + (reply.dislikes || 0)} oy</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditReply(reply)}
                          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-blue-100 transition-colors cursor-pointer"
                        >
                          <i className="ri-edit-line text-blue-600"></i>
                        </button>
                        <button
                          onClick={() => confirmDeleteReply(reply.id!)}
                          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-100 transition-colors cursor-pointer"
                        >
                          <i className="ri-delete-bin-line text-red-600"></i>
                        </button>
                      </div>
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed mb-2">{reply.content}</p>
                    <div className="text-xs text-gray-500 bg-gray-100 rounded px-2 py-1 inline-block">
                      Entry: {getEntryTitle(reply.entryId)}
                    </div>
                  </div>
                ))}

                {filteredReplies.length === 0 && (
                  <div className="text-center py-12">
                    <i className="ri-chat-3-line text-4xl text-gray-300 mb-4"></i>
                    <p className="text-gray-500">
                      {searchQuery ? 'Arama sonucu bulunamadı' : 'Henüz hiç yanıt yok'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Users Tab */}
          {selectedTab === 'users' && (
            <div className="p-6">
              <div className="bg-white border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Kullanıcı
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          E-posta
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Kayıt Tarihi
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Son Giriş
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Entry Sayısı
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Yanıt Sayısı
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredUsers.map((userProfile) => {
                        const userEntries = entries.filter(e => e.authorId === userProfile.uid);
                        const userReplies = replies.filter(r => r.authorId === userProfile.uid);

                        return (
                          <tr key={userProfile.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                                  <span className="text-red-600 font-medium text-sm">
                                    {userProfile.displayName.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div className="ml-3">
                                  <div className="text-sm font-medium text-gray-900">
                                    {userProfile.displayName}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {userProfile.email}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(userProfile.createdAt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(userProfile.lastLogin)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {userEntries.length}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {userReplies.length}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {filteredUsers.length === 0 && (
                  <div className="text-center py-12">
                    <i className="ri-user-line text-4xl text-gray-300 mb-4"></i>
                    <p className="text-gray-500">
                      {searchQuery ? 'Arama sonucu bulunamadı' : 'Henüz hiç kullanıcı yok'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Stats Tab */}
          {selectedTab === 'stats' && (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-blue-50 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                      <i className="ri-file-text-line text-white"></i>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-600">{entries.length}</div>
                      <div className="text-sm text-blue-600">Toplam Entry</div>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                      <i className="ri-chat-3-line text-white"></i>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">{replies.length}</div>
                      <div className="text-sm text-green-600">Toplam Yanıt</div>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                      <i className="ri-user-line text-white"></i>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-600">{users.length}</div>
                      <div className="text-sm text-purple-600">Kayıtlı Kullanıcı</div>
                    </div>
                  </div>
                </div>

                <div className="bg-orange-50 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
                      <i className="ri-building-line text-white"></i>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-orange-600">{companyStats.length}</div>
                      <div className="text-sm text-orange-600">Şirket Sayısı</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">Şirket İstatistikleri</h3>
                <div className="bg-white border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Sıra
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Şirket
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Şikayet Sayısı
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {companyStats.map((company, index) => (
                          <tr key={company.name}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {index + 1}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {company.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {company.totalComplaints}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Entry Modal */}
      {showEditModal && editingEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Entry Düzenle</h2>
              <button 
                onClick={() => setShowEditModal(false)}
                className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full cursor-pointer"
              >
                <i className="ri-close-line text-gray-500"></i>
              </button>
            </div>

            <form onSubmit={handleUpdateEntry} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Şirket</label>
                <input
                  type="text"
                  value={editForm.company}
                  onChange={(e) => setEditForm({...editForm, company: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Başlık</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">İçerik</label>
                <textarea
                  value={editForm.content}
                  onChange={(e) => setEditForm({...editForm, content: e.target.value})}
                  rows={4}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm resize-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Yazar</label>
                <input
                  type="text"
                  value={editForm.author}
                  onChange={(e) => setEditForm({...editForm, author: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 transition-colors cursor-pointer whitespace-nowrap"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors cursor-pointer whitespace-nowrap"
                >
                  Güncelle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Reply Modal */}
      {showEditReplyModal && editingReply && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Yanıt Düzenle</h2>
              <button 
                onClick={() => setShowEditReplyModal(false)}
                className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full cursor-pointer"
              >
                <i className="ri-close-line text-gray-500"></i>
              </button>
            </div>

            <form onSubmit={handleUpdateReply} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">İçerik</label>
                <textarea
                  value={editReplyForm.content}
                  onChange={(e) => setEditReplyForm({...editReplyForm, content: e.target.value})}
                  rows={4}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm resize-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Yazar</label>
                <input
                  type="text"
                  value={editReplyForm.author}
                  onChange={(e) => setEditReplyForm({...editReplyForm, author: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditReplyModal(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 transition-colors cursor-pointer whitespace-nowrap"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors cursor-pointer whitespace-nowrap"
                >
                  Güncelle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Entry Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="text-center">
              <i className="ri-error-warning-line text-4xl text-red-600 mb-4"></i>
              <h2 className="text-xl font-semibold mb-2">Entry Silinsin mi?</h2>
              <p className="text-gray-600 mb-6">Bu işlem geri alınamaz!</p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 transition-colors cursor-pointer whitespace-nowrap"
                >
                  İptal
                </button>
                <button
                  onClick={handleDeleteEntry}
                  className="flex-1 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors cursor-pointer whitespace-nowrap"
                >
                  Sil
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Reply Confirmation Modal */}
      {showDeleteReplyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="text-center">
              <i className="ri-error-warning-line text-4xl text-red-600 mb-4"></i>
              <h2 className="text-xl font-semibold mb-2">Yanıt Silinsin mi?</h2>
              <p className="text-gray-600 mb-6">Bu işlem geri alınamaz!</p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteReplyModal(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 transition-colors cursor-pointer whitespace-nowrap"
                >
                  İptal
                </button>
                <button
                  onClick={handleDeleteReply}
                  className="flex-1 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors cursor-pointer whitespace-nowrap"
                >
                  Sil
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
