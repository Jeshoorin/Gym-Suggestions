import React, { createContext, useState, useEffect, useContext } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';

export const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  // Sync user and profile data with localStorage
  useEffect(() => {
    const savedProfile = localStorage.getItem('profile');
    if (savedProfile) {
      setProfile(JSON.parse(savedProfile));  // Load profile from localStorage if available
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        console.log("👤 User detected:", firebaseUser.email);
        setUser({ email: firebaseUser.email });

        // Fetch profile from server or localStorage based on authentication state
        const storedProfile = localStorage.getItem('profile');
        if (storedProfile) {
          setProfile(JSON.parse(storedProfile));  // Load profile from localStorage
        } else {
          // Optionally, make an API call here to fetch the profile if it doesn't exist in localStorage
          // You could replace this with an actual fetch from your backend
          console.log("Fetch profile data from the server or handle profile setup.");
        }
      } else {
        console.log("🔒 No user");
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Optional: Save profile to localStorage whenever it changes
  useEffect(() => {
    if (profile) {
      localStorage.setItem('profile', JSON.stringify(profile));  // Save to localStorage whenever profile is updated
    }
  }, [profile]);

  return (
    <AuthContext.Provider value={{ user, setUser, profile, setProfile }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export { AuthProvider };
export const useAuth = () => useContext(AuthContext);
