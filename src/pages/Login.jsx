import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import '../styles/Login.css';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const { setUser, setProfile } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userEmail = userCredential.user.email;
      console.log('✅ Logged in:', userEmail);

      // 🔍 Fetch profile data from backend
      const res = await fetch(`http://localhost:5000/api/get-profile/${encodeURIComponent(userEmail)}`);
      const profileData = await res.json();

      if (res.ok) {
        setUser({ email: userEmail });  // Set user email
        setProfile(profileData);        // Set full profile separately

        // Save user and profile to localStorage
        localStorage.setItem("user", JSON.stringify({ email: userEmail }));
        localStorage.setItem("profile", JSON.stringify(profileData));

        navigate('/profile');
      } else {
        throw new Error(profileData.error || 'Failed to load profile.');
      }
    } catch (err) {
      console.error('❌ Login error:', err.message);
      setError(err.message);
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <h2>Welcome Back</h2>
        <p>Log in to crush your fitness goals 💪</p>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Login</button>
        {error && <span className="error-text">{error}</span>}
      </form>
    </div>
  );
};

export default Login;
