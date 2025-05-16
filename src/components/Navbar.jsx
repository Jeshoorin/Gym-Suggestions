import React from 'react';
import { Link } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import '../styles/Navbar.css';

const Navbar = () => {
  const handleLogout = () => signOut(auth);

  return (
    <nav className="navbar">
      <div className="logo">🏋️ GymFlow</div>
      <ul className="nav-links">
        <li><Link to="/profile">Profile</Link></li>
        <li><Link to="/workout">Workout</Link></li>
        <li><Link to="/diet">Diet</Link></li>
        <li><Link to="/feedback">Feedback</Link></li>
      </ul>
      <button className="logout-btn" onClick={handleLogout}>Logout</button>
    </nav>
  );
};

export default Navbar;
