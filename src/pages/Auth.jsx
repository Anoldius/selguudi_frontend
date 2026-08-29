import React, { useState, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import apiClient from '../api/axios';
import { 
  User, 
  Lock, 
  Phone, 
  Mail, 
  Building2, 
  ArrowRight, 
  ArrowLeft, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  Loader2 
} from 'lucide-react';

export default function Auth() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  // Default mode: kagua kama user alitoka kwingine na initial mode au message
  const [isRegisterMode, setIsRegisterMode] = useState(location.pathname === '/register');

  // ================= LOGIN STATES =================
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState(location.state?.message ? '' : '');
  const [loginSuccessMsg, setLoginSuccessMsg] = useState(location.state?.message || '');
  const [isLoginSubmitting, setIsLoginSubmitting] = useState(false);

  // ================= REGISTER STATES =================
  const [regData, setRegData] = useState({
    name: '',
    business_type: 'supermarket',
    phone: '',
    owner_email: '',
    owner_username: '',
    owner_password: '',
    owner_confirm_password: '',
    owner_full_name: '',
  });

  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [regError, setRegError] = useState('');
  const [isRegSubmitting, setIsRegSubmitting] = useState(false);

  // ================= HANDLERS =================
  const handleRegChange = (e) => {
    setRegData({ ...regData, [e.target.value]: e.target.value, [e.target.name]: e.target.value });
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginSuccessMsg('');
    setIsLoginSubmitting(true);

    const result = await login(loginUsername, loginPassword);
    setIsLoginSubmitting(false);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setLoginError(result.message);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegError('');

    // Verification ya Confirm Password
    if (regData.owner_password !== regData.owner_confirm_password) {
      setRegError("Nenosiri (Password) na Kithibitisho cha Nenosiri havifanani!");
      return;
    }

    setIsRegSubmitting(true);

    try {
      const { owner_confirm_password, ...payload } = regData;
      
      await apiClient.post('auth/register/', payload);
      setIsRegSubmitting(false);

      // Slide kurudi Login huku ukiwa na username iliyosajiliwa
      setLoginUsername(regData.owner_username);
      setLoginSuccessMsg('Usajili umekamilika kikamilifu! Ingia sasa.');
      setIsRegisterMode(false);
    } catch (err) {
      setIsRegSubmitting(false);
      console.log("Registration Error Payload:", err.response?.data);

      if (err.response?.data) {
        const data = err.response.data;

        if (data.errors && typeof data.errors === 'object' && Object.keys(data.errors).length > 0) {
          const firstKey = Object.keys(data.errors)[0];
          const firstErrVal = data.errors[firstKey];
          const errorText = Array.isArray(firstErrVal) ? firstErrVal[0] : firstErrVal;
          setRegError(`${firstKey.toUpperCase()}: ${errorText}`);
        } 
        else if (data.message && data.message !== "Imetokea kosa wakati wa kuchakata ombi lako.") {
          setRegError(data.message);
        } 
        else {
          setRegError('Tafadhali kagua taarifa ulizojaza.');
        }
      } else {
        setRegError('Imeshindikana kuunganisha na Server.');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(34,197,94,0.15),rgba(255,255,255,0))] p-4 my-4 overflow-hidden relative">
      
      <div className="w-full max-w-xl relative">
        
        {/* BRAND LOGO HEADER */}
        <div className="text-center mb-6 flex flex-col items-center">
          <div className="w-20 h-20 mb-3 flex items-center justify-center rounded-2xl bg-slate-950/40 p-2 border border-slate-800/80 shadow-2xl">
            <img 
              src="/selguudiLogo.png" 
              alt="Selguudi POS Logo" 
              className="w-full h-full object-contain rounded-xl"
            />
          </div>
          <p className="text-slate-400 text-sm font-medium">
            {isRegisterMode ? 'Sajili Duka Lako Jipya na Anza Mauzo' : 'Mfumo wa Kisasa wa Mauzo na Stoko'}
          </p>
        </div>

        {/* MAIN SLIDING CARD CONTAINER */}
        <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden relative min-h-[480px]">
          
          {/* ==================== 1. FORM YA LOGIN (SLIDE IN/OUT RIGHT) ==================== */}
          <div 
            className={`transition-all duration-700 ease-in-out transform ${
              isRegisterMode 
                ? 'opacity-0 pointer-events-none translate-x-full absolute inset-0 p-6 sm:p-8' 
                : 'opacity-100 translate-x-0 relative z-10'
            }`}
          >
            <h2 className="text-xl font-bold text-white mb-6">Ingia Kwenye Duka Lako</h2>

            {loginSuccessMsg && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-medium">
                {loginSuccessMsg}
              </div>
            )}

            {loginError && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
                {loginError}
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-5">
              {/* Username Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Username ya Duka</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    required
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-900/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all duration-200"
                    placeholder="Weka username ya duka unalotaka kuingia"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">Nenosiri (Password)</label>
                  <button 
                    type="button"
                    onClick={() => navigate('/forgot-password')}
                    className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition hover:underline"
                  >
                    Umesahau Password?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type={showLoginPassword ? "text" : "password"}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full pl-11 pr-12 py-3 bg-slate-900/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all duration-200"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    {showLoginPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoginSubmitting}
                className="w-full mt-2 py-3.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
              >
                {isLoginSubmitting ? 'Inahakiki...' : 'Ingia Mfumoni'}
                <ArrowRight className="w-5 h-5" />
              </button>

              {/* Link to Register */}
              <div className="mt-6 text-center text-sm text-slate-400 pt-3 border-t border-slate-700/50">
                Hujasajili Duka Bado?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setRegError('');
                    setIsRegisterMode(true);
                  }}
                  className="text-emerald-400 hover:underline font-semibold ml-1 inline-flex items-center gap-1"
                >
                  <span>Sajili Duka Lako Hapa</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>

          {/* ==================== 2. FORM YA REGISTER (SLIDE IN/OUT LEFT) ==================== */}
          <div 
            className={`transition-all duration-700 ease-in-out transform ${
              !isRegisterMode 
                ? 'opacity-0 pointer-events-none -translate-x-full absolute inset-0 p-6 sm:p-8' 
                : 'opacity-100 translate-x-0 relative z-10'
            }`}
          >
            <h2 className="text-xl font-bold text-white mb-6">Fomu ya Usajili wa Duka</h2>

            {regError && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
                {regError}
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              {/* Business Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Jina la Duka / Biashara</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    name="name"
                    required
                    value={regData.name}
                    onChange={handleRegChange}
                    className="w-full pl-11 pr-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                    placeholder="Mfano: Pasua Supermarket"
                  />
                </div>
              </div>

              {/* Business Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Aina ya Biashara</label>
                <select
                  name="business_type"
                  value={regData.business_type}
                  onChange={handleRegChange}
                  className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500 transition"
                >
                  <option value="supermarket">Supermarket / Duka la Rejareja</option>
                  <option value="pharmacy">Duka la Dawa (Pharmacy)</option>
                  <option value="hardware">Hardware / Vifaa vya Ujenzi</option>
                  <option value="clothing">Duka la Nguo / Viatu</option>
                  <option value="other">Biashara Nyengine</option>
                </select>
              </div>

              {/* Owner Full Name & Phone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Jina Kamili la Mmiliki</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="w-5 h-5" />
                    </div>
                    <input
                      type="text"
                      name="owner_full_name"
                      required
                      value={regData.owner_full_name}
                      onChange={handleRegChange}
                      className="w-full pl-11 pr-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                      placeholder="Mfano: Anoldius Ishemwa"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Namba ya Simu</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Phone className="w-5 h-5" />
                    </div>
                    <input
                      type="text"
                      name="phone"
                      required
                      value={regData.phone}
                      onChange={handleRegChange}
                      className="w-full pl-11 pr-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                      placeholder="0712345678"
                    />
                  </div>
                </div>
              </div>

              {/* Owner Email Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Barua Pepe (Email) ya Mmiliki</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    name="owner_email"
                    required
                    value={regData.owner_email}
                    onChange={handleRegChange}
                    className="w-full pl-11 pr-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                    placeholder="anoldpaul86@gmail.com"
                  />
                </div>
              </div>

              {/* Owner Username */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Username ya Mmiliki</label>
                <input
                  type="text"
                  name="owner_username"
                  required
                  value={regData.owner_username}
                  onChange={handleRegChange}
                  className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                  placeholder="anoldius_owner"
                />
              </div>

              {/* Owner Password & Confirm Password */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Nenosiri (Password)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-5 h-5" />
                    </div>
                    <input
                      type={showRegPassword ? "text" : "password"}
                      name="owner_password"
                      required
                      value={regData.owner_password}
                      onChange={handleRegChange}
                      className="w-full pl-11 pr-11 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition"
                    >
                      {showRegPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Thibitisha Nenosiri</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-5 h-5" />
                    </div>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="owner_confirm_password"
                      required
                      value={regData.owner_confirm_password}
                      onChange={handleRegChange}
                      className="w-full pl-11 pr-11 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isRegSubmitting}
                className="w-full mt-4 py-3.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition duration-200 disabled:opacity-50"
              >
                {isRegSubmitting ? 'Inasajili Duka...' : 'Kamilisha Usajili'}
                <ArrowRight className="w-5 h-5" />
              </button>

              {/* Link to Login */}
              <div className="mt-6 text-center text-sm text-slate-400 pt-3 border-t border-slate-700/50">
                Tayari una duka?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setLoginError('');
                    setIsRegisterMode(false);
                  }}
                  className="text-emerald-400 hover:underline font-semibold ml-1 inline-flex items-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Ingia Hapa</span>
                </button>
              </div>
            </form>
          </div>

        </div>

        {/* SECURITY BADGE */}
        <div className="mt-6 text-center flex items-center justify-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Multi-Tenant Enterprise Security Protected</span>
        </div>

      </div>
    </div>
  );
}