import React, { useState } from 'react';
import apiClient from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { 
  Settings as SettingsIcon, 
  User, 
  Store, 
  Lock, 
  KeyRound, 
  Loader2, 
  CheckCircle2, 
  ShieldCheck,
  Phone,
  Mail,
  ShieldAlert
} from 'lucide-react';

export default function Settings() {
  const { user } = useAuth();
  const isOwner = user?.role === 'owner';

  // State ya Change Login Password
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const triggerNotification = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleSubmitPassword = async (e) => {
    e.preventDefault();

    if (passwordData.new_password !== passwordData.confirm_password) {
      triggerNotification("Nenosiri jipya na kithibitisho havifanani!");
      return;
    }

    setIsSubmitting(true);
    try {
      // API call ya kubadili login password (au tumia endpoint yako ya password update)
      await apiClient.post('auth/set-settings-password/', {
        new_settings_password: passwordData.new_password,
        confirm_settings_password: passwordData.confirm_password
      });

      triggerNotification("Nenosiri limebadilishwa kikamilifu! 🔒");
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      const errRes = err.response?.data;
      let errMsg = "Imeshindikana kubadilisha nenosiri!";
      if (errRes) {
        if (typeof errRes === 'object') {
          const firstKey = Object.keys(errRes)[0];
          const val = errRes[firstKey];
          errMsg = Array.isArray(val) ? `${firstKey}: ${val[0]}` : val;
        } else if (errRes.error) {
          errMsg = errRes.error;
        }
      }
      triggerNotification(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // KAMA SIO BOSI, ZUIA UKURASA MZIMA
  if (!isOwner) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 max-w-md text-center space-y-4 shadow-2xl">
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white">Hukuruhusiwa Kuingia Hapa</h3>
          <p className="text-sm text-slate-400">
            Ukurasa wa Mipangilio unapatikana kwa akaunti ya Bosi (Owner) pekee.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto relative">

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-3 bg-emerald-500 text-slate-950 font-bold px-5 py-3.5 rounded-2xl shadow-2xl border border-emerald-400 animate-bounce">
          <CheckCircle2 className="w-5 h-5" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner Header */}
      <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <SettingsIcon className="w-7 h-7 text-emerald-400" />
            <span>Mipangilio ya Mfumo & Akaunti</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Simamia taarifa za biashara yako na usalama wa akaunti ya Bosi.
          </p>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl text-xs font-bold self-start sm:self-auto">
          <ShieldCheck className="w-4 h-4" />
          <span>Owner Access Level</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* SEHEMU YA 1: TAARIFA ZA DUKA NA BOSI */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-2xl">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Taarifa za Biashara</h3>
              <p className="text-xs text-slate-400">Profile ya Duka na Mmiliki</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl space-y-1">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 block">Jina la Duka / Supermarket</span>
              <span className="text-base font-extrabold text-emerald-400 uppercase font-mono">
                {user?.business_name || user?.business?.name || 'Selguudi Retail'}
              </span>
            </div>

            <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl space-y-1">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 block">Username ya Bosi</span>
              <div className="flex items-center gap-2 text-white font-semibold text-sm">
                <User className="w-4 h-4 text-slate-400" />
                <span>@{user?.username}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl space-y-1">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 block">Simu</span>
                <div className="flex items-center gap-1.5 text-xs font-mono text-slate-300">
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  <span>{user?.phone || 'N/A'}</span>
                </div>
              </div>

              <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl space-y-1">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 block">Email</span>
                <div className="flex items-center gap-1.5 text-xs font-mono text-slate-300 truncate">
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  <span className="truncate">{user?.email || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SEHEMU YA 2: KUBADILISHA NENOSIRI (PASSWORD UPDATE) */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <div className="p-3 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-2xl">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Badilisha Nenosiri</h3>
              <p className="text-xs text-slate-400">Imarisha usalama wa akaunti yako</p>
            </div>
          </div>

          <form onSubmit={handleSubmitPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Nenosiri Jipya *
              </label>
              <input
                type="password"
                name="new_password"
                required
                value={passwordData.new_password}
                onChange={handlePasswordChange}
                placeholder="Ingiza password mpya"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500 font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Thibitisha Nenosiri Jipya *
              </label>
              <input
                type="password"
                name="confirm_password"
                required
                value={passwordData.confirm_password}
                onChange={handlePasswordChange}
                placeholder="Rudia password mpya"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500 font-mono text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition mt-2"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />}
              <span>Hifadhi Nenosiri Jipya</span>
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}