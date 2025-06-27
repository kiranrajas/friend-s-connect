import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// ✅ Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyBkFaq78TP6JtnvSMqLhDlBk8QcMoNy10g",
  authDomain: "community-connect-f3a2f.firebaseapp.com",
  projectId: "community-connect-f3a2f",
  storageBucket: "community-connect-f3a2f.appspot.com",
  messagingSenderId: "268543011875",
  appId: "1:268543011875:web:76c364b60ded6c5a19d596"
};

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);

// ✅ Export authentication, Firestore database, and Storage
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// ✅ Cleanup function for messages of deleted users
export const cleanupDeletedUsersMessages = async () => {
  try {
    const usersSnapshot = await getDocs(collection(db, "users"));
    const existingUserIds = new Set(usersSnapshot.docs.map(doc => doc.id));

    const messagesSnapshot = await getDocs(collection(db, "messages"));
    for (const messageDoc of messagesSnapshot.docs) {
      const message = messageDoc.data();
      if (!existingUserIds.has(message.sender) || !existingUserIds.has(message.receiver)) {
        await deleteDoc(doc(db, "messages", messageDoc.id));
        console.log(`🗑 Deleted message from ${message.sender} to ${message.receiver}`);
      }
    }

    console.log("✅ Cleanup complete: Deleted messages of non-existing users.");
  } catch (error) {
    console.error("❌ Error during message cleanup:", error);
  }
};