import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/axios';
import { Store, Mail, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await apiClient.post('password_reset/', { email });
      setSubmitted(true);
    } catch (err) {
      console.error("Password reset request error:", err);
      setError(
        err.response?.data?.email?.[0] || 
        'Imeshindikana kutuma ombi. Hakikisha Email ni sahihi!'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl mb-3">
            <Store className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-white">Umesahau Password?</h1>
          <p className="text-xs text-slate-400 mt-1">
            Weka email yako hapa chini ili tukutumie code ya kubadilisha password.
          </p>
        </div>

        {submitted ? (
          <div className="text-center space-y-4">
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 flex flex-col items-center gap-2">
              <CheckCircle2 className="w-10 h-10" />
              <p className="text-sm font-semibold">Ombi Lilitumwa Vizuri!</p>
              <p className="text-xs text-slate-300">
                Kama email hiyo imesajiliwa, angalia terminal ya backend (au inbox yako) kupata Code/Token ya Reset.
              </p>
            </div>

            <Link 
              to="/reset-password" 
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-2xl flex items-center justify-center transition block text-sm"
            >
              Weka Code / Reset Password
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl font-medium">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Email Yako
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="mfano@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-white text-sm focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-2xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Tuma Code ya Reset</span>}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link to="/login" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition">
            <ArrowLeft className="w-4 h-4" />
            <span>Rudi Kwenye Login</span>
          </Link>
        </div>

      </div>
    </div>
  );
}