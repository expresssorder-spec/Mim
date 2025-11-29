import React, { useState } from 'react';
import { User } from '../types';
import { MessageSquare, Lock, Mail, ArrowRight, ShoppingBag } from 'lucide-react';

interface AuthScreenProps {
  onLogin: (email: string, pass: string) => void;
  onRegister: (email: string, pass: string) => void;
  error?: string;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin, onRegister, error }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      onLogin(email, password);
    } else {
      onRegister(email, password);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <div className="mb-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="bg-indigo-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200">
          <MessageSquare size={32} className="text-white" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">AutoResponda</h1>
        <p className="text-slate-500 mt-2">WhatsApp Automation for E-commerce</p>
      </div>

      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-500">
        <div className="p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6">
            {isLogin ? 'Welcome back' : 'Create your store account'}
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  placeholder="store@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 mt-2"
            >
              {isLogin ? 'Sign In' : 'Create Account'}
              <ArrowRight size={18} />
            </button>
          </form>
        </div>

        <div className="bg-gray-50 p-4 text-center border-t border-gray-100">
          <p className="text-sm text-gray-600">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => { setIsLogin(!isLogin); setError(undefined); }}
              className="text-indigo-600 font-semibold hover:underline"
            >
              {isLogin ? 'Sign Up' : 'Login'}
            </button>
          </p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-center max-w-2xl w-full">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2 text-green-600">
             <MessageSquare size={16} />
          </div>
          <h3 className="text-xs font-bold text-gray-800">Smart Auto-Reply</h3>
          <p className="text-[10px] text-gray-500">Keyword based rules</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2 text-blue-600">
             <ShoppingBag size={16} />
          </div>
          <h3 className="text-xs font-bold text-gray-800">E-commerce Focus</h3>
          <p className="text-[10px] text-gray-500">Built for selling</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
           <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2 text-purple-600">
             <Lock size={16} />
          </div>
          <h3 className="text-xs font-bold text-gray-800">Private Data</h3>
          <p className="text-[10px] text-gray-500">Your rules are yours</p>
        </div>
      </div>
    </div>
  );
};

// Helper for App.tsx
function setError(arg0: undefined) {
    throw new Error('Function not implemented.');
}
