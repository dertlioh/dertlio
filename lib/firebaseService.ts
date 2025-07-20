
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
  votes: number;
  replies?: Reply[];
  createdAt: Timestamp;
}

export interface Reply {
  id?: string;
  content: string;
  author: string;
  authorId: string;
  date: string;
  votes: number;
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
      createdAt: Timestamp.now()
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
export const addEntry = async (entry: Omit<Entry, 'id' | 'votes' | 'createdAt'>) => {
  try {
    const docRef = await addDoc(collection(db, 'entries'), {
      ...entry,
      votes: 0,
      createdAt: Timestamp.now()
    });
    return { success: true, id: docRef.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// 🔧 FIX 1: Firma sayfasında entry'leri doğru şekilde getir
export const getEntries = async (companyName?: string) => {
  try {
    let q;
    if (companyName) {
      // Büyük-küçük harf duyarlılığını kaldır ve normalize et
      const normalizedCompanyName = companyName.toLowerCase().trim();
      
      // Tüm entry'leri getir ve client-side filter uygula
      q = query(collection(db, 'entries'), orderBy('createdAt', 'desc'));
      
      const querySnapshot = await getDocs(q);
      const entries: Entry[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const entryCompanyName = data.company.toLowerCase().trim();
        
        // Eşleştirme: tam eşleşme veya URL formatında eşleşme
        const urlFormat = entryCompanyName.replace(/\s+/g, '-');
        
        if (entryCompanyName === normalizedCompanyName || 
            urlFormat === normalizedCompanyName ||
            entryCompanyName.includes(normalizedCompanyName) ||
            normalizedCompanyName.includes(entryCompanyName)) {
          entries.push({
            id: doc.id,
            ...data,
            date: data.createdAt.toDate().toISOString().split('T')[0]
          } as Entry);
        }
      });
      
      return { success: true, entries };
    } else {
      q = query(collection(db, 'entries'), orderBy('createdAt', 'desc'));
    }
    
    const querySnapshot = await getDocs(q);
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
    
    // Also delete all replies to this entry
    const repliesQuery = query(
      collection(db, 'replies'),
      where('entryId', '==', entryId)
    );
    const repliesSnapshot = await getDocs(repliesQuery);
    
    const deletePromises = repliesSnapshot.docs.map(replyDoc => 
      deleteDoc(doc(db, 'replies', replyDoc.id))
    );
    
    await Promise.all(deletePromises);
    
    // Also delete all votes for this entry
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

// 🔧 FIX 2: Beğeni sistemi - Her kullanıcı sadece 1 kez oy verebilir
export const voteEntry = async (entryId: string, isIncrement: boolean, userId: string) => {
  try {
    const voteId = `${userId}_${entryId}`;
    const voteRef = doc(db, 'votes', voteId);
    const entryRef = doc(db, 'entries', entryId);
    
    // Mevcut oyu kontrol et
    const voteDoc = await getDoc(voteRef);
    
    if (voteDoc.exists()) {
      const existingVote = voteDoc.data();
      const newVoteType = isIncrement ? 'up' : 'down';
      
      if (existingVote.type === newVoteType) {
        // Aynı oy türü - oyu iptal et
        await deleteDoc(voteRef);
        await updateDoc(entryRef, {
          votes: increment(isIncrement ? -1 : 1)
        });
      } else {
        // Farklı oy türü - oyu değiştir
        await updateDoc(voteRef, {
          type: newVoteType,
          createdAt: Timestamp.now()
        });
        // Önceki oyu iptal et ve yeni oyu ekle (2 birim değişim)
        await updateDoc(entryRef, {
          votes: increment(isIncrement ? 2 : -2)
        });
      }
    } else {
      // Yeni oy
      await setDoc(voteRef, {
        userId,
        entryId,
        type: isIncrement ? 'up' : 'down',
        createdAt: Timestamp.now()
      });
      
      await updateDoc(entryRef, {
        votes: increment(isIncrement ? 1 : -1)
      });
    }
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Kullanıcının entry'ye verdiği oyu getir
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

// 🔧 FIX 3: Yanıt sistemi düzeltildi
export const addReply = async (entryId: string, reply: Omit<Reply, 'id' | 'votes' | 'createdAt'>) => {
  try {
    const docRef = await addDoc(collection(db, 'replies'), {
      ...reply,
      entryId,
      votes: 0,
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
    return { success: false, error: error.message, replies: [] };
  }
};

// Company Stats  
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

// Real-time listeners - FIX 1 için güncellendi
export const subscribeToEntries = (callback: (entries: Entry[]) => void, companyName?: string) => {
  if (companyName) {
    // Firma sayfası için tüm entry'leri dinle ve client-side filter uygula
    const q = query(collection(db, 'entries'), orderBy('createdAt', 'desc'));
    
    return onSnapshot(q, (querySnapshot) => {
      const normalizedCompanyName = companyName.toLowerCase().trim();
      const entries: Entry[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const entryCompanyName = data.company.toLowerCase().trim();
        const urlFormat = entryCompanyName.replace(/\s+/g, '-');
        
        if (entryCompanyName === normalizedCompanyName || 
            urlFormat === normalizedCompanyName ||
            entryCompanyName.includes(normalizedCompanyName) ||
            normalizedCompanyName.includes(entryCompanyName)) {
          entries.push({
            id: doc.id,
            ...data,
            date: data.createdAt ? data.createdAt.toDate().toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
          } as Entry);
        }
      });
      
      callback(entries);
    });
  } else {
    const q = query(collection(db, 'entries'), orderBy('createdAt', 'desc'));
    
    return onSnapshot(q, (querySnapshot) => {
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
    });
  }
};
