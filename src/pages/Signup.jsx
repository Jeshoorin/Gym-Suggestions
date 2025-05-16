import { useState } from "react";
import { auth, createUserWithEmailAndPassword, signInWithGoogle } from "../firebase";
import { useNavigate } from "react-router-dom";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      alert("Account created successfully!");
      navigate("/diet");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      await signInWithGoogle();
      navigate("/diet");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Sign Up</h1>
      {error && <p className="text-red-500">{error}</p>}
      <form onSubmit={handleSignup} className="flex flex-col">
        <input
          type="email"
          placeholder="Email"
          className="border p-2 my-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          className="border p-2 my-2"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit" className="bg-blue-500 text-white p-2 rounded">
          Sign Up
        </button>
      </form>
      <hr className="my-4" />
      <button onClick={handleGoogleSignup} className="bg-red-500 text-white p-2 rounded">
        Sign Up with Google
      </button>
    </div>
  );
}
