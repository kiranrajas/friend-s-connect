import React, { useEffect, useState, useRef } from "react";
import { createContext } from "react";
import { db, auth } from "../firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { useParams, useNavigate } from "react-router-dom";
import "./ChatBox.css";

export const AppContext = createContext();

const ChatBox = () => {
  const [showDeleteFor, setShowDeleteFor] = useState(null);
  const { userId } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [receiverName, setReceiverName] = useState("User");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const currentUser = auth.currentUser;
  const [showStickers, setShowStickers] = useState(false);

  const stickers = [
    "/stickers/stk1.webp",
    "/stickers/stk2.webp",
    "/stickers/stk3.webp",
    "/stickers/stk4.webp",
    "/stickers/stk5.webp",
    "/stickers/stk6.webp",
    "/stickers/stk7.webp",
    "/stickers/stk8.webp",
  ];

  // Send sticker
 const sendSticker = async (stickerUrl) => {
  if (!auth.currentUser || !userId) return;
  try {
    const chatId = [auth.currentUser.uid, userId].sort().join("_");
    await addDoc(collection(db, `chats/${chatId}/messages`), {
      text: "", // No text for sticker
      stickerUrl,
      timestamp: serverTimestamp(),
      sender: auth.currentUser.uid,
      receiver: userId,
      seen: false,
      isAlert: false,
    });
  } catch (error) {
    alert("Failed to send sticker: " + error.message);
  }
};

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-focus input when chat opens or user changes
  useEffect(() => {
    inputRef.current?.focus();
  }, [userId]);

  // Fetch receiver name
  useEffect(() => {
    const fetchReceiverName = async () => {
      if (userId) {
        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists()) {
          setReceiverName(userDoc.data().name || "Unknown");
        }
      }
    };
    fetchReceiverName();
  }, [userId]);

  // Real-time message listener
  useEffect(() => {
    if (!currentUser || !userId) return;
    const chatId = [currentUser.uid, userId].sort().join("_");
    const q = query(
      collection(db, `chats/${chatId}/messages`),
      orderBy("timestamp", "asc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((docSnap) => {
        const msg = { id: docSnap.id, ...docSnap.data() };
        // Mark message as seen
        if (msg.receiver === currentUser.uid && !msg.seen) {
          updateDoc(doc(db, `chats/${chatId}/messages/${docSnap.id}`), {
            seen: true,
          });
        }
        return msg;
      });
      setMessages(msgs);
    });
    return () => unsubscribe();
  }, [userId, currentUser]);

  // Send message (normal)
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser || !userId) return;
    const chatId = [currentUser.uid, userId].sort().join("_");
    await addDoc(collection(db, `chats/${chatId}/messages`), {
      text: newMessage.trim(),
      timestamp: serverTimestamp(),
      sender: currentUser.uid,
      receiver: userId,
      seen: false,
      isAlert: false,
    });
    setNewMessage("");
  };

  // Handle Enter/Shift+Enter in input
  const handleInputKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e);
    }
  };
  let lastDate = null;

  return (
    <div className="chatbox-overlay" >
      <div className="chatbox-main">
        {/* Header */}
        <div className="chatbox-header" style={{ position: "sticky", top: 0, bottom: 0, left: 0, right: 0 }}>
  
  <h2 className="chatbox-title" >
    Chat with <span>{receiverName}</span>
  </h2>
  <button 
    onClick={() => navigate("/chat")}
    className="chatbox-close"
    title="Close chat"
    aria-label="Close chat"
  >
    X
  </button>
</div>

        {/* Messages */}
        <div className="chatbox-messages" tabIndex={0} >
          {messages.length === 0 && (
            <div className="chatbox-empty">No messages yet. Say hi! 👋</div>
          )}
          {messages.map((msg, idx) => {
            const isCurrentUser = msg.sender === currentUser.uid;
            const isAlert = msg.isAlert;
            const msgDate = msg.timestamp?.toDate();
            const dateStr = msgDate
              ? msgDate.toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })
              : "";

            const showDate =
              !lastDate ||
              (msgDate &&
                (lastDate.getFullYear() !== msgDate.getFullYear() ||
                  lastDate.getMonth() !== msgDate.getMonth() ||
                  lastDate.getDate() !== msgDate.getDate()));

            if (msgDate) lastDate = msgDate;

            return (
              <React.Fragment key={msg.id}>
                {showDate && (
                  <div className="chatbox-date-separator">
                    <span>{dateStr}</span>
                  </div>
                )}
                <div
                  className={`chatbox-bubble-row ${
                    isCurrentUser ? "right" : "left"
                  }`}
                >
                  <div
                    className={`chatbox-bubble ${
                      isAlert
                        ? "alert"
                        : isCurrentUser
                        ? "me"
                        : "other"
                    }`}
                    onClick={() => {
                      if (isCurrentUser) setShowDeleteFor(msg.id);
                    }}
                    style={{
                      cursor: isCurrentUser ? "pointer" : "default",
                    }}
                  >
                    <span className="chatbox-bubble-sender">
                      {isAlert
                        ? "🚨 ALERT"
                        : isCurrentUser
                        ? "You"
                        : receiverName}
                    </span>
                    {msg.stickerUrl
                      ? <img src={msg.stickerUrl} alt="sticker" className="chatbox-sticker" />
                      : msg.text
                      ? <span>{msg.text}</span>
                      : null}
                    {showDeleteFor === msg.id && (
                      <div className="chatbox-delete-popup">
                        <span>Delete this message?</span>
                        <button
                          className="yes"
                          onClick={async (e) => {
                            e.stopPropagation();
                            const chatId = [currentUser.uid, userId]
                              .sort()
                              .join("_");
                            await deleteDoc(
                              doc(
                                db,
                                `chats/${chatId}/messages/${msg.id}`
                              )
                            );
                            setShowDeleteFor(null);
                          }}
                        >
                          Yes
                        </button>
                        <button
                          className="cancel"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowDeleteFor(null);
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                  {/* Timestamp + Seen ticks */}
                  {!isAlert && (
                    <span className="chatbox-bubble-meta">
                      {msg.timestamp?.toDate().toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {isCurrentUser && (
                        <span className="chatbox-bubble-ticks">
                          {msg.seen ? (
                            <span title="Seen">✔️✔️</span>
                          ) : (
                            <span title="Delivered">✔️</span>
                          )}
                        </span>
                      )}
                    </span>
                  )}
                </div>
              </React.Fragment>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Sticker Picker */}
        <button
          type="button"
          className="chatbox-sticker-btn"
          onClick={() => setShowStickers((prev) => !prev)}
        >
          {showStickers ? "Hide Stickers" : "Stickers"}
        </button>
        {showStickers && (
          <div className="chatbox-sticker-picker">
            {stickers.map((url) => (
              <img
                key={url}
                src={url}
                alt="sticker"
                className="chatbox-sticker-option"
                onClick={() => {
                  sendSticker(url);
                  setShowStickers(false);
                }}
                title="Send sticker"
              />
            ))}
          </div>
        )}

        {/* Input */}
        <form onSubmit={sendMessage} className="chatbox-input-row" autoComplete="off">
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a message…"
            className="chatbox-input"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleInputKeyDown}
            maxLength={500}
            aria-label="Type a message"
          />
          <button
            type="submit"
            className="chatbox-send-btn"
            disabled={!newMessage.trim()}
            aria-label="Send message"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};
export default ChatBox;