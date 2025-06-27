import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import ChatList from "./components/ChatList";
import ChatBox from "./components/ChatBox";
import './index.css'; // or './App.css' wherever you added Tailwind directives
import './App.css'; 
//import AlertSystem from "./components/AlertSystem";
//import Map from "./components/Map";
import "./App.css"; // Import the CSS
//import MapComponent from "./MapComponent";
import { useEffect, useState } from "react";
import { db, auth } from "./firebase";
import { collection, onSnapshot } from "firebase/firestore";


function App() {
  const [friends, setFriends] = useState([]);

useEffect(() => {
  const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
    const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const currentUser = auth.currentUser;

    // Filter out self from the friends list
    const filteredUsers = users.filter(user => user.id !== currentUser?.uid);
    setFriends(filteredUsers);
  });

  return () => unsubscribe();
}, []);

  return (
    <BrowserRouter basename="/friend-s-connect">
      <div className="parent">
        {/* Title */}
        <div className="div1"><h4>Friend<i>'s</i> connect </h4></div>

        {/* Left Side - Google Maps */}
       

        {/* Top Right - Chat System */}
        <div className="div3">
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/chat" element={<ChatList />} />
            <Route path="/chat/:userId" element={<ChatBox />} />
          </Routes>
        </div>

        {/* Bottom Right - Alert System */}
        
      </div>
    </BrowserRouter>
  );
}

export default App;
