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
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4 font-sans text-slate-800">
      <div className="w-full max-w-md space-y-6">
        
        {/* BRAND HEADER */}
        <div className="text-center flex flex-col items-center">
          <div className="w-44 sm:w-52 h-auto flex items-center justify-center transition-transform hover:scale-105 duration-300 bg-white p-3 rounded-3xl border-2 border-emerald-500/30 shadow-md">
            <img 
              src="/uzakisasa.png" 
              alt="Selguudi POS Logo" 
              className="w-full h-full object-contain drop-shadow-sm"
            />
          </div>
          <p className="text-slate-500 text-xs font-bold mt-3">
            Mfumo wa Kisasa wa Mauzo na Stoko
          </p>
        </div>

        {/* Card Form */}
        <div className="bg-white border-2 border-emerald-500/40 rounded-3xl p-8 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-900 via-emerald-500 to-blue-900" />

          <h2 className="text-xl font-black text-blue-950 mb-6 flex items-center gap-2">
            <span>Ingia Kwenye Duka Lako</span>
          </h2>

          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-black">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username Input */}
            <div>
              <label className="block text-xs font-black text-blue-950 uppercase tracking-wider mb-2">USERNAME YA DUKA</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-5 h-5 text-emerald-600" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-slate-300 rounded-xl text-blue-950 font-bold placeholder-slate-400 focus:outline-none focus:border-emerald-600 transition-all duration-200"
                  placeholder="Weka username ya duka"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-black text-blue-950 uppercase tracking-wider">NENOSIRI (PASSWORD)</label>
                <Link 
                  to="/forgot-password" 
                  className="text-xs font-extrabold text-emerald-700 hover:text-emerald-800 transition hover:underline"
                >
                  Umesahau Password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5 text-emerald-600" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  className="w-full pl-11 pr-12 py-3 bg-slate-50 border-2 border-slate-300 rounded-xl text-blue-950 font-bold placeholder-slate-400 focus:outline-none focus:border-emerald-600 transition-all duration-200"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
            >
              {isSubmitting ? 'Inahakiki...' : 'Login'}
              <ArrowRight className="w-5 h-5" />
            </button>

            {/* Register Link */}
            <div className="mt-6 text-center text-sm font-semibold text-slate-600">
              Hujasajili Duka Bado?{' '}
              <Link to="/register" className="text-emerald-700 hover:underline font-black">
                Sajili Duka Lako Hapa
              </Link>
            </div>
            
          </form>
        </div>

        {/* Security Badge */}
        <div className="text-center flex items-center justify-center gap-2 text-xs font-bold text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Protected by Enterprise End-to-End Encryption</span>
        </div>
      </div>
    </div>
  );
}