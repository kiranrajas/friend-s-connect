import React, { useEffect, useState, useContext } from "react";
import {
  collection,
  query,
  onSnapshot,
  doc,
  updateDoc,
  orderBy,
  limit,
} from "firebase/firestore";
import { db, auth, storage } from "../firebase";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { AppContext } from "./ChatBox";
import "./ChatList.css";

const ChatList = () => {
  const data = useContext(AppContext);

  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [profilePic, setProfilePic] = useState(
    auth.currentUser?.photoURL || "/tempProfilePic.webp"
  );
  const [uploading, setUploading] = useState(false);
  const [latestMessages, setLatestMessages] = useState({});
  const navigate = useNavigate();
  const [currentUserName, setCurrentUserName] = useState("");

  // Fetch users and set profile pic
  useEffect(() => {
    const q = query(collection(db, "users"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUsers(usersList);
      setLoading(false);

      // Set initial profile pic and name from Firestore if available
      const currentUser = auth.currentUser;
      if (currentUser) {
        const userDoc = snapshot.docs.find((doc) => doc.id === currentUser.uid);
        if (userDoc && userDoc.data().avatarUrl) {
          setProfilePic(userDoc.data().avatarUrl);
        }
        if (userDoc && userDoc.data().name) {
          setCurrentUserName(userDoc.data().name);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Fetch latest messages for each user using chatId
  useEffect(() => {
    if (!auth.currentUser) return;
    if (users.length === 0) {
      setLatestMessages({});
      return;
    }

    const unsubscribes = [];

    users.forEach((user) => {
      if (user.id === auth.currentUser.uid) return;
      const chatId = [auth.currentUser.uid, user.id].sort().join("_");
      const messagesRef = collection(db, "chats", chatId, "messages");
      const q = query(messagesRef, orderBy("timestamp", "desc"), limit(1));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setLatestMessages((prev) => ({
          ...prev,
          [user.id]: snapshot.empty
            ? null
            : snapshot.docs[0].data().stickerUrl
            ? "🖼️ Sticker"
            : snapshot.docs[0].data().text,
        }));
      });
      unsubscribes.push(unsubscribe);
    });

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [users]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      alert("Logout failed: " + error.message);
    }
  };

  const handleProfilePicChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);

    try {
      const storageRef = ref(
        storage,
        `profilePics/${auth.currentUser.uid}/${file.name}`
      );
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        avatarUrl: url,
      });

      setProfilePic(url);
      alert("Profile picture updated!");
    } catch (error) {
      alert("Failed to upload profile picture: " + error.message);
    }
    setUploading(false);
  };

  const filteredUsers = users
    .filter((user) => user.id !== auth.currentUser?.uid)
    .filter((user) =>
      user.name?.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <div className="chatlist-container">
      <div className="chatlist-header">
        <div className="profile-section">
          <label htmlFor="profile-pic-upload" className="profile-pic-label" title="Change profile picture">
            <img
              src={profilePic}
              alt="Profile"
              className="profile-pic"
              draggable={false}
            />
            <input
              id="profile-pic-upload"
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleProfilePicChange}
              disabled={uploading}
            />
          </label>
          <h2 className="chatlist-title">{currentUserName ? `${currentUserName}'s Chats` : "Chats"}</h2>
        </div>
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </div>
      <input
        type="text"
        placeholder="Search users…"
        className="chatlist-search"
        onChange={(e) => setSearch(e.target.value)}
        value={search}
        aria-label="Search users"
      />

      {loading ? (
        <div className="chatlist-loading">Loading users…</div>
      ) : filteredUsers.length === 0 ? (
        <div className="chatlist-empty">
          {search ? "No users found." : "No other users available."}
        </div>
      ) : (
        <div className="chatlist-users">
          {filteredUsers.map((user) => {
            const lastMessage = latestMessages[user.id] ?? "No messages yet";
            return (
              <div
                key={user.id}
                className="chatlist-user"
                onClick={() => navigate(`/chat/${user.id}`)}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter") navigate(`/chat/${user.id}`);
                }}
                role="button"
                aria-label={`Chat with ${user.name}`}
              >
                <img
                  src={
                    user.avatarUrl && user.avatarUrl.startsWith("http")
                      ? user.avatarUrl
                      : "/tempProfilePic.webp"
                  }
                  alt={user.name}
                  className="user-avatar"
                  draggable={false}
                />
                <div className="user-info">
                  <h3>{user.name}</h3>
                  {lastMessage === "🖼️ Sticker" ? (
                    <p className="last-message sticker-msg">[Sticker]</p>
                  ) : lastMessage && lastMessage !== "No messages yet" ? (
                    <p className="last-message">{lastMessage}</p>
                  ) : (
                    <p className="no-message">No messages yet</p>
                  )}
                  <p className="tap-to-chat">Tap to chat</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ChatList;