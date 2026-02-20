import { auth, db } from './firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updatePassword,
  type User as FirebaseUser,
  type Unsubscribe
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
  type DocumentData,
  type QuerySnapshot
} from 'firebase/firestore';

// ==================== AUTH FUNCTIONS ====================

export const signUp = async (
  email: string,
  password: string,
  username: string,
  displayName: string,
  birthDate: string
) => {
  // 1. Create Firebase Auth account
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const uid = credential.user.uid;

  // 2. Create user profile document in Firestore
  await setDoc(doc(db, 'users', uid), {
    uid,
    username,
    displayName,
    email,
    birthDate,
    points: 50,
    admirersCount: 0,
    mutualsCount: 0,
    admiringCount: 0,
    strikes: 0,
    isOnline: true,
    activity: 'Idle',
    isPremium: false,
    premiumSince: null,
    createdAt: serverTimestamp()
  });

  // 3. Create username lookup document for uniqueness checking
  await setDoc(doc(db, 'usernames', username.toLowerCase()), { uid });

  return { uid, username, displayName, email, birthDate };
};

export const logIn = async (emailOrUsername: string, password: string) => {
  let email = emailOrUsername;

  // If not an email, look up username to get email
  if (!emailOrUsername.includes('@')) {
    const usernameDoc = await getDoc(doc(db, 'usernames', emailOrUsername.toLowerCase()));
    if (!usernameDoc.exists()) {
      throw new Error('Invalid username or password.');
    }
    const uid = usernameDoc.data().uid;
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (!userDoc.exists()) {
      throw new Error('User profile not found.');
    }
    email = userDoc.data().email;
  }

  const credential = await signInWithEmailAndPassword(auth, email, password);
  const uid = credential.user.uid;

  // Fetch user profile from Firestore
  const userDoc = await getDoc(doc(db, 'users', uid));
  if (!userDoc.exists()) {
    throw new Error('User profile not found');
  }

  return { uid, ...userDoc.data() };
};

export const logOut = async () => {
  await signOut(auth);
};

export const onAuthChange = (callback: (user: FirebaseUser | null) => void): Unsubscribe => {
  return onAuthStateChanged(auth, callback);
};

export const getCurrentFirebaseUser = (): FirebaseUser | null => {
  return auth.currentUser;
};

export const checkUsernameAvailable = async (username: string): Promise<boolean> => {
  const usernameDoc = await getDoc(doc(db, 'usernames', username.toLowerCase()));
  return !usernameDoc.exists();
};

export const getUserProfile = async (uid: string) => {
  const userDoc = await getDoc(doc(db, 'users', uid));
  if (!userDoc.exists()) return null;
  return { uid, ...userDoc.data() };
};

export const updateUserProfile = async (uid: string, data: Partial<DocumentData>) => {
  await updateDoc(doc(db, 'users', uid), data);
};

export const changePassword = async (newPassword: string) => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  await updatePassword(user, newPassword);
};

// ==================== USER QUERY FUNCTIONS ====================

export const getAllUsers = async () => {
  const snapshot = await getDocs(collection(db, 'users'));
  return snapshot.docs.map(d => ({ uid: d.id, ...d.data() }));
};

export const getUserByUsername = async (username: string) => {
  const usernameDoc = await getDoc(doc(db, 'usernames', username.toLowerCase()));
  if (!usernameDoc.exists()) return null;
  const uid = usernameDoc.data().uid;
  return getUserProfile(uid);
};

// ==================== BOOK FUNCTIONS ====================

export const createBook = async (bookData: any) => {
  const bookRef = doc(collection(db, 'books'));
  const bookWithId = {
    ...bookData,
    id: bookRef.id,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  await setDoc(bookRef, bookWithId);
  return bookWithId;
};

export const updateBook = async (bookId: string, data: any) => {
  // Find the Firestore document with matching id field
  const q = query(collection(db, 'books'), where('id', '==', bookId));
  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    console.error('Book not found in Firestore:', bookId);
    return;
  }
  const docRef = snapshot.docs[0].ref;
  await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
};

export const deleteBook = async (bookId: string) => {
  const q = query(collection(db, 'books'), where('id', '==', bookId));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return;
  await deleteDoc(snapshot.docs[0].ref);
};

export const getBook = async (bookId: string) => {
  const q = query(collection(db, 'books'), where('id', '==', bookId));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return snapshot.docs[0].data();
};

export const getAllBooks = async () => {
  const snapshot = await getDocs(collection(db, 'books'));
  return snapshot.docs.map(d => d.data());
};

// Real-time listener for all books
export const subscribeToBooksChanges = (
  callback: (books: any[]) => void
): Unsubscribe => {
  return onSnapshot(collection(db, 'books'), (snapshot: QuerySnapshot) => {
    const books = snapshot.docs.map(d => d.data());
    callback(books);
  });
};
