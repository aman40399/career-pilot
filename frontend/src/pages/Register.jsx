import React, { useState } from 'react';
import { SignUp } from '@clerk/clerk-react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const HAS_CLERK = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);

export default function Register() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('dev@example.com');
  const [name, setName] = useState('Local Dev User');

  const handleLocalRegister = (e) => {
    e.preventDefault();
    signup(email, 'password', name);
    navigate('/dashboard');
  };

  return (
    <div className="flex w-full flex-col min-h-screen bg-black relative overflow-hidden items-center justify-center">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(0,0,0,0.92)_0%,_rgba(0,0,0,0.7)_50%,_transparent_100%)]" />
        <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-black to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-black to-transparent" />
      </div>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-12">
        {HAS_CLERK ? (
          <SignUp routing="path" path="/register" signInUrl="/login" />
        ) : (
          <div className="w-full max-w-md p-8 bg-zinc-900/90 border border-zinc-800 rounded-2xl shadow-2xl backdrop-blur-xl text-center">
            <h2 className="text-2xl font-bold text-white mb-2">Create Local Account</h2>
            <p className="text-zinc-400 text-sm mb-6">Clerk is not configured. Create a local developer user to explore all features.</p>
            <form onSubmit={handleLocalRegister} className="space-y-4">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name"
                className="w-full px-4 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="w-full px-4 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="submit"
                className="w-full py-3 px-4 bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition shadow-lg cursor-pointer"
              >
                Create Account & Continue
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
