
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
  Timestamp 
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
    return { success: false, error: error.message };
  }
};

export const loginUser = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error: any) {
    return { success: false, error: error.message };
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

export const getEntries = async (companyName?: string) => {
  try {
    let q;
    if (companyName) {
      q = query(
        collection(db, 'entries'),
        where('company', '==', companyName),
        orderBy('createdAt', 'desc')
      );
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
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const voteEntry = async (entryId: string, increment: boolean) => {
  try {
    const entryRef = doc(db, 'entries', entryId);
    await updateDoc(entryRef, {
      votes: increment ? increment(1) : increment(-1)
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Replies
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

// Real-time listeners
export const subscribeToEntries = (callback: (entries: Entry[]) => void, companyName?: string) => {
  let q;
  if (companyName) {
    q = query(
      collection(db, 'entries'),
      where('company', '==', companyName),
      orderBy('createdAt', 'desc')
    );
  } else {
    q = query(collection(db, 'entries'), orderBy('createdAt', 'desc'));
  }
  
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
};
