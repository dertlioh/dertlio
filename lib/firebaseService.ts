
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  updateDoc, 
  deleteDoc,
  doc,
  increment,
  onSnapshot,
  Timestamp,
  setDoc,
  getDoc 
} from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  User 
} from 'firebase/auth';
import { db, auth } from './firebase';

export interface Entry {
  id?: string;
  company: string;
  title: string;
  content: string;
  author: string;
  authorId: string;
  date: string;
  likes: number;
  dislikes: number;
  replies?: Reply[];
  createdAt: Timestamp;
}

export interface Reply {
  id?: string;
  entryId: string;
  content: string;
  author: string;
  authorId: string;
  date: string;
  likes: number;
  dislikes: number;
  createdAt: Timestamp;
}

export interface CompanyStats {
  name: string;
  totalComplaints: number;
}

export interface Vote {
  userId: string;
  entryId: string;
  type: 'up' | 'down';
  createdAt: Timestamp;
}

export interface UserProfile {
  id?: string;
  uid: string;
  displayName: string;
  email: string;
  createdAt: Timestamp;
  lastLogin?: Timestamp;
  banned?: boolean;
  banReason?: string;
  bannedAt?: Timestamp;
  unbannedAt?: Timestamp;
}

// Word mappings for company name variations
const wordMappings: { [key: string]: string[] } = {
  'bank': ['banka', 'bankası'],
  'banka': ['bank', 'bankası'],
  'bankası': ['bank', 'banka'],
  'teknoloji': ['tech', 'technology'],
  'tech': ['teknoloji', 'technology'],
  'technology': ['teknoloji', 'tech'],
  'sigorta': ['insurance', 'assurance'],
  'insurance': ['sigorta', 'assurance'],
  'telecom': ['telekom', 'telecommunication'],
  'telekom': ['telecom', 'telecommunication'],
  'market': ['mağaza', 'store'],
  'mağaza': ['market', 'store'],
  'store': ['market', 'mağaza'],
  'online': ['çevrimiçi', 'internet'],
  'çevrimiçi': ['online', 'internet'],
  'internet': ['online', 'çevrimiçi'],
  'global': ['küresel', 'international'],
  'küresel': ['global', 'international'],
  'international': ['global', 'küresel'],
  'express': ['ekspres', 'hızlı'],
  'ekspres': ['express', 'hızlı'],
  'hızlı': ['express', 'ekspres'],
  'mobile': ['mobil', 'cep'],
  'mobil': ['mobile', 'cep'],
  'cep': ['mobile', 'mobil'],
  'digital': ['dijital', 'sayısal'],
  'dijital': ['digital', 'sayısal'],
  'sayısal': ['digital', 'dijital']
};

// Firma adı normalizasyon fonksiyonu - GELİŞMİŞ VERSİYON
const normalizeCompanyName = (name: string): string[] => {
  if (!name) return [];

  let processedName = name.toLowerCase().trim();

  // URL decode işlemi
  try {
    processedName = decodeURIComponent(processedName);
  } catch (e) {
    // Decode hatası varsa orijinal adı kullan
  }

  // Tüm varyasyonları topla
  const variations = new Set<string>();

  // Orijinal hali
  variations.add(processedName);

  // Boşluk/tire dönüşümleri
  variations.add(processedName.replace(/\s+/g, '-'));
  variations.add(processedName.replace(/-/g, ' '));
  variations.add(processedName.replace(/\+/g, ' '));
  variations.add(processedName.replace(/_/g, ' '));

  // URL encoded halleri
  variations.add(processedName.replace(/\s+/g, '%20'));

  // Özel karakterler temizlenmiş hali
  const cleanName = processedName.replace(/[^\\w\\s-]/g, '').replace(/\s+/g, ' ').trim();
  if (cleanName !== processedName) {
    variations.add(cleanName);
    variations.add(cleanName.replace(/\s+/g, '-'));
  }

  // Kelime bazında eşleştirmeler
  const words = processedName.split(/[\\s\\-_]+/);
  words.forEach(word => {
    if (wordMappings[word]) {
      wordMappings[word].forEach(mapping => {
        variations.add(processedName.replace(word, mapping));
      });
    }
  });

  // Yaygın firma formatları
  const commonFormats = [
    processedName + ' ltd',
    processedName + ' şti',
    processedName + ' a.ş',
    processedName + ' inc',
    processedName.replace(/\s+(ltd|şti|a\.ş|inc|corp|co)$/i, ''),
    processedName.replace(/^(the\s+)/i, '')
  ];

  commonFormats.forEach(format => {
    if (format !== processedName) {
      variations.add(format);
      variations.add(format.replace(/\s+/g, '-'));
    }
  });

  // Benzersiz varyasyonlar döndür
  return Array.from(variations).filter(v => v.length > 0);
};

// Authentication
export const registerUser = async (email: string, password: string, displayName: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Save user profile to Firestore
    await addDoc(collection(db, 'users'), {
      uid: user.uid,
      displayName,
      email,
      createdAt: Timestamp.now(),
      lastLogin: Timestamp.now()
    });

    return { success: true, user };
  } catch (error: any) {
    let errorMessage = 'Bir hata oluştu';

    if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'Bu e-posta adresi zaten kullanılıyor';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'Şifre en az 6 karakter olmalı';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Geçersiz e-posta adresi';
    }

    return { success: false, error: errorMessage };
  }
};

export const loginUser = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);

    // Update last login time
    const q = query(collection(db, 'users'), where('uid', '==', userCredential.user.uid));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      await updateDoc(doc(db, 'users', userDoc.id), {
        lastLogin: Timestamp.now()
      });
    }

    return { success: true, user: userCredential.user };
  } catch (error: any) {
    let errorMessage = 'Giriş başarısız';

    if (error.code === 'auth/user-not-found') {
      errorMessage = 'Bu e-posta ile bir hesap bulunamadı';
    } else if (error.code === 'auth/wrong-password') {
      errorMessage = 'Şifre yanlış';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Geçersiz e-posta adresi';
    }

    return { success: false, error: errorMessage };
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Entries
export const addEntry = async (entry: Omit<Entry, 'id' | 'likes' | 'dislikes' | 'createdAt'>) => {
  try {
    const docRef = await addDoc(collection(db, 'entries'), {
      ...entry,
      likes: 0,
      dislikes: 0,
      createdAt: Timestamp.now()
    });
    return { success: true, id: docRef.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const getEntries = async (companyName?: string) => {
  try {
    let q = query(collection(db, 'entries'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);

    if (companyName) {
      const companyVariations = normalizeCompanyName(companyName);
      const entries: Entry[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const entryCompanyVariations = normalizeCompanyName(data.company);

        // Herhangi bir varyasyon eşleşiyor mu kontrol et
        const isMatch = companyVariations.some(variation => 
          entryCompanyVariations.some(entryVariation => 
            entryVariation.includes(variation) || variation.includes(entryVariation)
          )
        );

        if (isMatch) {
          entries.push({
            id: doc.id,
            ...data,
            date: data.createdAt.toDate().toISOString().split('T')[0]
          } as Entry);
        }
      });

      return { success: true, entries };
    } else {
      const entries: Entry[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        entries.push({
          id: doc.id,
          ...data,
          date: data.createdAt.toDate().toISOString().split('T')[0]
        } as Entry);
      });

      return { success: true, entries };
    }
  } catch (error: any) {
    return { success: false, error: error.message, entries: [] };
  }
};

export const updateEntry = async (entryId: string, updates: Partial<Entry>) => {
  try {
    const entryRef = doc(db, 'entries', entryId);
    await updateDoc(entryRef, updates);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const deleteEntry = async (entryId: string) => {
  try {
    const entryRef = doc(db, 'entries', entryId);
    await deleteDoc(entryRef);

    const repliesQuery = query(
      collection(db, 'replies'),
      where('entryId', '==', entryId)
    );
    const repliesSnapshot = await getDocs(repliesQuery);

    const deletePromises = repliesSnapshot.docs.map(replyDoc => 
      deleteDoc(doc(db, 'replies', replyDoc.id))
    );

    await Promise.all(deletePromises);

    const votesQuery = query(
      collection(db, 'votes'),
      where('entryId', '==', entryId)
    );
    const votesSnapshot = await getDocs(votesQuery);

    const deleteVotesPromises = votesSnapshot.docs.map(voteDoc => 
      deleteDoc(doc(db, 'votes', voteDoc.id))
    );

    await Promise.all(deleteVotesPromises);

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const voteEntry = async (entryId: string, voteType: 'like' | 'dislike', userId: string) => {
  try {
    const voteId = `${userId}_${entryId}`;
    const voteRef = doc(db, 'votes', voteId);
    const entryRef = doc(db, 'entries', entryId);

    const voteDoc = await getDoc(voteRef);

    if (voteDoc.exists()) {
      const existingVote = voteDoc.data();

      if (existingVote.type === voteType) {
        // Aynı oy türü - oyu iptal et
        await deleteDoc(voteRef);
        if (voteType === 'like') {
          await updateDoc(entryRef, { likes: increment(-1) });
        } else {
          await updateDoc(entryRef, { dislikes: increment(-1) });
        }
      } else {
        // Farklı oy türü - eski oyu güncellenmiyor, sadece yeni oy ekleniyor
        await updateDoc(voteRef, {
          type: voteType,
          createdAt: Timestamp.now()
        });

        if (voteType === 'like') {
          await updateDoc(entryRef, { likes: increment(1) });
        } else {
          await updateDoc(entryRef, { dislikes: increment(1) });
        }
      }
    } else {
      // Yeni oy
      await setDoc(voteRef, {
        userId,
        entryId,
        type: voteType,
        createdAt: Timestamp.now()
      });

      if (voteType === 'like') {
        await updateDoc(entryRef, { likes: increment(1) });
      } else {
        await updateDoc(entryRef, { dislikes: increment(1) });
      }
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const getUserVote = async (entryId: string, userId: string) => {
  try {
    const voteId = `${userId}_${entryId}`;
    const voteRef = doc(db, 'votes', voteId);
    const voteDoc = await getDoc(voteRef);

    if (voteDoc.exists()) {
      return { success: true, vote: voteDoc.data().type };
    } else {
      return { success: true, vote: null };
    }
  } catch (error: any) {
    return { success: false, error: error.message, vote: null };
  }
};

export const addReply = async (entryId: string, reply: Omit<Reply, 'id' | 'likes' | 'dislikes' | 'createdAt' | 'entryId'>) => {
  try {
    const docRef = await addDoc(collection(db, 'replies'), {
      ...reply,
      entryId,
      likes: 0,
      dislikes: 0,
      createdAt: Timestamp.now()
    });
    return { success: true, id: docRef.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const getReplies = async (entryId: string) => {
  try {
    const q = query(
      collection(db, 'replies'),
      where('entryId', '==', entryId),
      orderBy('createdAt', 'asc')
    );

    const querySnapshot = await getDocs(q);
    const replies: Reply[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      replies.push({
        id: doc.id,
        ...data,
        date: data.createdAt.toDate().toISOString().split('T')[0]
      } as Reply);
    });

    return { success: true, replies };
  } catch (error: any) {
    console.warn('Index error for replies, falling back to simple query:', error);

    // Fallback: Get all replies for this entry without ordering
    try {
      const fallbackQuery = query(
        collection(db, 'replies'),
        where('entryId', '==', entryId)
      );

      const fallbackSnapshot = await getDocs(fallbackQuery);
      const replies: Reply[] = [];

      fallbackSnapshot.forEach((doc) => {
        const data = doc.data();
        replies.push({
          id: doc.id,
          ...data,
          date: data.createdAt ? data.createdAt.toDate().toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
        } as Reply);
      });

      // Sort manually by date
      replies.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      return { success: true, replies };
    } catch (fallbackError: any) {
      return { success: false, error: fallbackError.message, replies: [] };
    }
  }
};

export const getCompanyStats = async () => {
  try {
    const q = query(collection(db, 'entries'));
    const querySnapshot = await getDocs(q);

    const companyCount: { [key: string]: number } = {};

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const company = data.company;
      companyCount[company] = (companyCount[company] || 0) + 1;
    });

    const stats: CompanyStats[] = Object.entries(companyCount)
      .map(([name, totalComplaints]) => ({ name, totalComplaints }))
      .sort((a, b) => b.totalComplaints - a.totalComplaints)
      .slice(0, 10);

    return { success: true, stats };
  } catch (error: any) {
    return { success: false, error: error.message, stats: [] };
  }
};

export const subscribeToEntries = (callback: (entries: Entry[]) => void, companyName?: string) => {
  const q = query(collection(db, 'entries'), orderBy('createdAt', 'desc'));

  return onSnapshot(q, (querySnapshot) => {
    if (companyName) {
      const companyVariations = normalizeCompanyName(companyName);
      const entries: Entry[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const entryCompanyVariations = normalizeCompanyName(data.company);

        const isMatch = companyVariations.some(variation => 
          entryCompanyVariations.some(entryVariation => 
            entryVariation.includes(variation) || variation.includes(entryVariation)
          )
        );

        if (isMatch) {
          entries.push({
            id: doc.id,
            ...data,
            date: data.createdAt ? data.createdAt.toDate().toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
          } as Entry);
        }
      });

      callback(entries);
    } else {
      const entries: Entry[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        entries.push({
          id: doc.id,
          ...data,
          date: data.createdAt ? data.createdAt.toDate().toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
        } as Entry);
      });
      callback(entries);
    }
  });
};

export const subscribeToReplies = (entryId: string, callback: (replies: Reply[]) => void) => {
  try {
    // Try with orderBy first
    const q = query(
      collection(db, 'replies'),
      where('entryId', '==', entryId),
      orderBy('createdAt', 'asc')
    );

    return onSnapshot(q, (querySnapshot) => {
      const replies: Reply[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        replies.push({
          id: doc.id,
          ...data,
          date: data.createdAt ? data.createdAt.toDate().toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
        } as Reply);
      });
      callback(replies);
    }, (error) => {
      console.warn('Index error for replies subscription, using fallback:', error);

      // Fallback: Subscribe without ordering
      const fallbackQuery = query(
        collection(db, 'replies'),
        where('entryId', '==', entryId)
      );

      return onSnapshot(fallbackQuery, (querySnapshot) => {
        const replies: Reply[] = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          replies.push({
            id: doc.id,
            ...data,
            date: data.createdAt ? data.createdAt.toDate().toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
          } as Reply);
        });

        // Sort manually by date
        replies.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        callback(replies);
      });
    });
  } catch (error: any) {
    console.warn('Error setting up replies subscription:', error);
    // Return fallback subscription without ordering
    const fallbackQuery = query(
      collection(db, 'replies'),
      where('entryId', '==', entryId)
    );

    return onSnapshot(fallbackQuery, (querySnapshot) => {
      const replies: Reply[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        replies.push({
          id: doc.id,
          ...data,
          date: data.createdAt ? data.createdAt.toDate().toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
        } as Reply);
      });

      // Sort manually by date
      replies.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      callback(replies);
    });
  }
};

// Get all users (admin only)
export const getUsers = async () => {
  try {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);

    const users: UserProfile[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      users.push({
        id: doc.id,
        uid: data.uid,
        displayName: data.displayName,
        email: data.email,
        createdAt: data.createdAt,
        lastLogin: data.lastLogin
      });
    });

    return { success: true, users };
  } catch (error: any) {
    return { success: false, error: error.message, users: [] };
  }
};

// Update reply
export const updateReply = async (replyId: string, updates: Partial<Reply>) => {
  try {
    const replyRef = doc(db, 'replies', replyId);
    await updateDoc(replyRef, updates);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Delete reply
export const deleteReply = async (replyId: string) => {
  try {
    const replyRef = doc(db, 'replies', replyId);
    await deleteDoc(replyRef);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Get all replies (admin only)
export const getAllReplies = async () => {
  try {
    const q = query(collection(db, 'replies'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);

    const replies: Reply[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      replies.push({
        id: doc.id,
        ...data,
        date: data.createdAt ? data.createdAt.toDate().toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
      } as Reply);
    });

    return { success: true, replies };
  } catch (error: any) {
    return { success: false, error: error.message, replies: [] };
  }
};

// Subscribe to users (admin only)
export const subscribeToUsers = (callback: (users: UserProfile[]) => void) => {
  const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));

  return onSnapshot(q, (querySnapshot) => {
    const users: UserProfile[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      users.push({
        id: doc.id,
        uid: data.uid,
        displayName: data.displayName,
        email: data.email,
        createdAt: data.createdAt,
        lastLogin: data.lastLogin
      });
    });
    callback(users);
  });
};

// Subscribe to all replies (admin only)
export const subscribeToAllReplies = (callback: (replies: Reply[]) => void) => {
  const q = query(collection(db, 'replies'), orderBy('createdAt', 'desc'));

  return onSnapshot(q, (querySnapshot) => {
    const replies: Reply[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      replies.push({
        id: doc.id,
        ...data,
        date: data.createdAt ? data.createdAt.toDate().toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
      } as Reply);
    });
    callback(replies);
  });
};

// Username çözümü için fonksiyon - email yerine displayName alır
export const getUserDisplayName = async (uid: string): Promise<string> => {
  try {
    const q = query(collection(db, 'users'), where('uid', '==', uid));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const userData = querySnapshot.docs[0].data();
      return userData.displayName || 'Anonim';
    }

    return 'Anonim';
  } catch (error) {
    console.error('Error getting user display name:', error);
    return 'Anonim';
  }
};

// Ban/unban user
export const banUser = async (userId: string, reason?: string) => {
  try {
    const userQuery = query(collection(db, 'users'), where('uid', '==', userId));
    const userSnapshot = await getDocs(userQuery);

    if (!userSnapshot.empty) {
      const userDoc = userSnapshot.docs[0];
      await updateDoc(doc(db, 'users', userDoc.id), {
        banned: true,
        banReason: reason || 'Admin tarafından banlandı',
        bannedAt: Timestamp.now()
      });
      return { success: true };
    }

    return { success: false, error: 'Kullanıcı bulunamadı' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const unbanUser = async (userId: string) => {
  try {
    const userQuery = query(collection(db, 'users'), where('uid', '==', userId));
    const userSnapshot = await getDocs(userQuery);

    if (!userSnapshot.empty) {
      const userDoc = userSnapshot.docs[0];
      await updateDoc(doc(db, 'users', userDoc.id), {
        banned: false,
        banReason: null,
        bannedAt: null,
        unbannedAt: Timestamp.now()
      });
      return { success: true };
    }

    return { success: false, error: 'Kullanıcı bulunamadı' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Check if user is banned
export const isUserBanned = async (userId: string) => {
  try {
    const userQuery = query(collection(db, 'users'), where('uid', '==', userId));
    const userSnapshot = await getDocs(userQuery);

    if (!userSnapshot.empty) {
      const userData = userSnapshot.docs[0].data();
      return { success: true, banned: userData.banned || false, reason: userData.banReason };
    }

    return { success: true, banned: false };
  } catch (error: any) {
    return { success: false, error: error.message, banned: false };
  }
};

// Bulk operations
export const bulkDeleteEntries = async (entryIds: string[]) => {
  try {
    const deletePromises = entryIds.map(async (entryId) => {
      // Delete entry
      await deleteDoc(doc(db, 'entries', entryId));

      // Delete related replies
      const repliesQuery = query(collection(db, 'replies'), where('entryId', '==', entryId));
      const repliesSnapshot = await getDocs(repliesQuery);
      const replyDeletePromises = repliesSnapshot.docs.map(replyDoc => 
        deleteDoc(doc(db, 'replies', replyDoc.id))
      );
      await Promise.all(replyDeletePromises);

      // Delete related votes
      const votesQuery = query(collection(db, 'votes'), where('entryId', '==', entryId));
      const votesSnapshot = await getDocs(votesQuery);
      const voteDeletePromises = votesSnapshot.docs.map(voteDoc => 
        deleteDoc(doc(db, 'votes', voteDoc.id))
      );
      await Promise.all(voteDeletePromises);
    });

    await Promise.all(deletePromises);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const bulkDeleteReplies = async (replyIds: string[]) => {
  try {
    const deletePromises = replyIds.map(replyId => 
      deleteDoc(doc(db, 'replies', replyId))
    );
    await Promise.all(deletePromises);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Get system stats
export const getSystemStats = async () => {
  try {
    const [entriesSnapshot, repliesSnapshot, usersSnapshot] = await Promise.all([
      getDocs(collection(db, 'entries')),
      getDocs(collection(db, 'replies')),
      getDocs(collection(db, 'users'))
    ]);

    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    let todayEntries = 0;
    let yesterdayEntries = 0;
    let weekEntries = 0;
    let monthEntries = 0;
    let bannedUsers = 0;
    let activeUsers = 0;

    entriesSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const createdAt = data.createdAt?.toDate();
      if (createdAt) {
        if (createdAt >= yesterday && createdAt < today) {
          todayEntries++;
        }
        if (createdAt >= lastWeek) {
          weekEntries++;
        }
        if (createdAt >= lastMonth) {
          monthEntries++;
        }
      }
    });

    usersSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.banned) {
        bannedUsers++;
      } else {
        activeUsers++;
      }
    });

    return {
      success: true,
      stats: {
        totalEntries: entriesSnapshot.size,
        totalReplies: repliesSnapshot.size,
        totalUsers: usersSnapshot.size,
        todayEntries,
        weekEntries,
        monthEntries,
        bannedUsers,
        activeUsers
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Get detailed user info
export const getUserDetails = async (userId: string) => {
  try {
    const userQuery = query(collection(db, 'users'), where('uid', '==', userId));
    const userSnapshot = await getDocs(userQuery);

    if (userSnapshot.empty) {
      return { success: false, error: 'Kullanıcı bulunamadı' };
    }

    const userData = userSnapshot.docs[0].data();

    // Get user's entries
    const entriesQuery = query(collection(db, 'entries'), where('authorId', '==', userId));
    const entriesSnapshot = await getDocs(entriesQuery);

    // Get user's replies
    const repliesQuery = query(collection(db, 'replies'), where('authorId', '==', userId));
    const repliesSnapshot = await getDocs(repliesQuery);

    return {
      success: true,
      user: {
        ...userData,
        id: userSnapshot.docs[0].id,
        totalEntries: entriesSnapshot.size,
        totalReplies: repliesSnapshot.size
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};
