import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../api/axios';
import { User, Lock, Phone, Mail, Building2, ArrowRight, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import appLogo from '../assets/adaptive_icon.png';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    business_type: 'supermarket',
    phone: '',
    owner_email: '',
    owner_username: '',
    owner_password: '',
    owner_confirm_password: '',
    owner_full_name: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Verification ya Confirm Password
    if (formData.owner_password !== formData.owner_confirm_password) {
      setError("Nenosiri (Password) na Kithibitisho cha Nenosiri havifanani!");
      return;
    }

    setIsSubmitting(true);

    try {
      // Tuma payload bila confirm_password field
      const { owner_confirm_password, ...payload } = formData;
      
      await apiClient.post('auth/register/', payload);
      setIsSubmitting(false);
      navigate('/login', { state: { message: 'Usajili umekamilika! Ingia sasa.' } });
    } catch (err) {
      setIsSubmitting(false);
      console.log("Registration Error Payload:", err.response?.data);

      if (err.response?.data) {
        const data = err.response.data;

        if (data.errors && typeof data.errors === 'object' && Object.keys(data.errors).length > 0) {
          const firstKey = Object.keys(data.errors)[0];
          const firstErrVal = data.errors[firstKey];
          const errorText = Array.isArray(firstErrVal) ? firstErrVal[0] : firstErrVal;
          setError(`${firstKey.toUpperCase()}: ${errorText}`);
        } 
        else if (data.message && data.message !== "Imetokea kosa wakati wa kuchakata ombi lako.") {
          setError(data.message);
        } 
        else {
          setError('Tafadhali kagua taarifa ulizojaza.');
        }
      } else {
        setError('Imeshindikana kuunganisha na Server.');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(34,197,94,0.15),rgba(255,255,255,0))] p-4 my-8">
      <div className="w-full max-w-lg">
        
        {/* Brand Header na Adaptive Icon */}
        <div className="text-center mb-6 flex flex-col items-center">
          <div className="w-24 h-24 mb-3 flex items-center justify-center rounded-2xl bg-slate-950/40 p-2 border border-slate-800/80 shadow-2xl">
            <img 
              src={appLogo} 
              alt="Selguudi POS Logo" 
              className="w-full h-full object-contain rounded-xl"
            />
          </div>
          <p className="text-slate-400 text-sm font-medium">Sajili Duka Lako Jipya na Anza Mauzo</p>
        </div>

        {/* Card Form */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl">
          <h2 className="text-xl font-bold text-white mb-6">Fomu ya Usajili wa Duka</h2>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
                  value={formData.name}
                  onChange={handleChange}
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
                value={formData.business_type}
                onChange={handleChange}
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
                    value={formData.owner_full_name}
                    onChange={handleChange}
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
                    value={formData.phone}
                    onChange={handleChange}
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
                  value={formData.owner_email}
                  onChange={handleChange}
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
                value={formData.owner_username}
                onChange={handleChange}
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
                    type={showPassword ? "text" : "password"}
                    name="owner_password"
                    required
                    value={formData.owner_password}
                    onChange={handleChange}
                    className="w-full pl-11 pr-11 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
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
                    value={formData.owner_confirm_password}
                    onChange={handleChange}
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
              disabled={isSubmitting}
              className="w-full mt-4 py-3.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition duration-200 disabled:opacity-50"
            >
              {isSubmitting ? 'Inasajili Duka...' : 'Kamilisha Usajili'}
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>

          {/* Link to Login */}
          <div className="mt-6 text-center text-sm text-slate-400">
            Tayari una duka?{' '}
            <Link to="/login" className="text-emerald-400 hover:underline font-semibold">
              Ingia Hapa
            </Link>
          </div>
        </div>

        {/* Security Badge */}
        <div className="mt-6 text-center flex items-center justify-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Multi-Tenant Enterprise Security Protected</span>
        </div>
      </div>
    </div>
  );
}