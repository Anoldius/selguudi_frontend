import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Lock, User, ArrowRight, ShieldCheck, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    // Ondoa nafasi tupu (spaces) zinazowekwa na keyboard za simu
    const cleanUsername = username.trim();
    const cleanPassword = password.trim();

    if (!cleanUsername || !cleanPassword) {
      setError('Tafadhali ingiza Username na Password sahihi.');
      setIsSubmitting(false);
      return;
    }

    try {
      const result = await login(cleanUsername, cleanPassword);

      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.message);
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error("Login component error:", err);
      setError("Imeshindikana kuunganisha na server. Angalia mtandao wako.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(34,197,94,0.15),rgba(255,255,255,0))] p-4">
      <div className="w-full max-w-md">
        
        {/* BRAND HEADER (Logo Imepunguzwa Ukubwa) */}
        <div className="text-center mb-5 flex flex-col items-center">
          <div className="w-36 sm:w-44 h-auto flex items-center justify-center transition-transform hover:scale-105 duration-300">
            <img 
              src="/favconSelguudi.png" 
              alt="Selguudi POS Logo" 
              className="w-full h-full object-contain drop-shadow-xl"
            />
          </div>
          <p className="text-slate-400 text-xs font-medium mt-1.5">
            Mfumo wa Kisasa wa Mauzo na Stoko
          </p>
        </div>

        {/* Card Form */}
        <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <span>Ingia Kwenye Duka Lako</span>
          </h2>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">USERNAME YA DUKA</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  className="w-full pl-11 pr-4 py-3 bg-slate-900/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all duration-200"
                  placeholder="Weka username ya duka"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">NENOSIRI (PASSWORD)</label>
                <Link 
                  to="/forgot-password" 
                  className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition hover:underline"
                >
                  Umesahau Password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  className="w-full pl-11 pr-12 py-3 bg-slate-900/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all duration-200"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
            >
              {isSubmitting ? 'Inahakiki...' : 'Login'}
              <ArrowRight className="w-5 h-5" />
            </button>

            {/* Register Link */}
            <div className="mt-6 text-center text-sm text-slate-400">
              Hujasajili Duka Bado?{' '}
              <Link to="/register" className="text-emerald-400 hover:underline font-semibold">
                Sajili Duka Lako Hapa
              </Link>
            </div>
            
          </form>
        </div>

        {/* Security Badge */}
        <div className="mt-8 text-center flex items-center justify-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Protected by Enterprise End-to-End Encryption</span>
        </div>
      </div>
    </div>
  );
}