import React, { useState } from "react";
import { auth, db } from "../firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
//import ".App.css"; // ✅ Importing CSS for styling
import "./Login.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState(""); // ✅ Get user's name
  const [isSignUp, setIsSignUp] = useState(false); // ✅ Toggle between login/signup
  const navigate = useNavigate();

  const handleAuth = async (e) => {
    e.preventDefault();

    try {
      if (isSignUp) {
        // ✅ Creating a new user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // ✅ Saving user details to Firestore "users" collection
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          name: name, // ✅ Store name
          email: email,
        });

        console.log("User registered:", user.email);
      } else {
        // ✅ Logging in an existing user
        await signInWithEmailAndPassword(auth, email, password);
        console.log("User logged in:", email);
      }

      navigate("/chat"); // ✅ Redirect to chat
    } catch (error) {
      console.error("Authentication Error:", error.message);
      alert(error.message);
    }
  };

  return (
    <div className="login-container">
     <center> <h2 id="head">Welcome to friend's connect</h2>
      <h2 id="login">{isSignUp ? "Sign Up" : "Login"}</h2>
      <form onSubmit={handleAuth}>
        <p>{isSignUp ? "name:" : ""}</p>
        {isSignUp && (
          
          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          
          />
          
        )}
        <p>email id:</p>
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <p>password:</p>
        <input
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" id="login_button">{isSignUp ? "Sign Up" : "Login"}</button>
      </form>
      

     <button onClick={() => setIsSignUp(!isSignUp)}   className="toggle-auth">
        {isSignUp ? "Already have an account? Login" : "Don't have an account? Sign Up"}
      </button>
      </center>
    </div>
  );
};

export default Login;
