import React, { useState } from 'react';
import apiClient from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { 
  Settings as SettingsIcon, 
  Store, 
  Lock, 
  KeyRound, 
  Loader2, 
  CheckCircle2, 
  ShieldCheck,
  Phone,
  Mail,
  ShieldAlert,
  Save
} from 'lucide-react';

export default function Settings() {
  const { user, updateUser } = useAuth(); // <--- ONGEZA updateUser HAPA
  const isOwner = user?.role === 'owner';

  // State ya Jina la Duka
  const [businessName, setBusinessName] = useState(user?.business_name || user?.business?.name || '');
  const [isUpdatingBusiness, setIsUpdatingBusiness] = useState(false);

  // State ya Change Login Password
  const [passwordData, setPasswordData] = useState({
    new_password: '',
    confirm_password: ''
  });
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  // Toast State
  const [toastMessage, setToastMessage] = useState(null);

  const triggerNotification = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. KUBADILISHA JINA LA DUKA
  const handleUpdateBusinessName = async (e) => {
    e.preventDefault();
    if (!businessName.trim()) {
      triggerNotification("Tafadhali ingiza jina la duka!");
      return;
    }

    setIsUpdatingBusiness(true);
    try {
      const res = await apiClient.put('auth/update-business-name/', { name: businessName });
      const updatedName = res.data?.business_name || businessName;

      // UPDATE CONTEXT NA LOCALSTORAGE KIOTOMATIKI!
      if (updateUser) {
        updateUser({ 
          business_name: updatedName,
          business: { ...(user?.business || {}), name: updatedName }
        });
      }

      triggerNotification(res.data?.message || "Jina la duka limebadilishwa kikamilifu! 🏪");
    } catch (err) {
      triggerNotification(err.response?.data?.error || "Imeshindikana kubadilisha jina la duka!");
    } finally {
      setIsUpdatingBusiness(false);
    }
  };

  // 2. KUBADILISHA NENOSIRI
  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleSubmitPassword = async (e) => {
    e.preventDefault();

    if (passwordData.new_password !== passwordData.confirm_password) {
      triggerNotification("Nenosiri jipya na kithibitisho havifanani!");
      return;
    }

    setIsSubmittingPassword(true);
    try {
      await apiClient.post('auth/set-settings-password/', {
        new_settings_password: passwordData.new_password,
        confirm_settings_password: passwordData.confirm_password
      });

      triggerNotification("Nenosiri limebadilishwa kikamilifu! 🔒");
      setPasswordData({ new_password: '', confirm_password: '' });
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
      setIsSubmittingPassword(false);
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
        
        {/* SEHEMU YA 1: KUBADILISHA JINA LA DUKA & MAWASILIANO */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-2xl">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Taarifa za Biashara</h3>
              <p className="text-xs text-slate-400">Badilisha Jina la Duka / Supermarket</p>
            </div>
          </div>

          <form onSubmit={handleUpdateBusinessName} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Jina la Duka / Supermarket *
              </label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Mfano: Selguudi Supermarket"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold focus:outline-none focus:border-blue-500 uppercase text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={isUpdatingBusiness}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 transition text-sm"
            >
              {isUpdatingBusiness ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Hifadhi Jina Jipya la Duka</span>
            </button>
          </form>

          {/* Mawasiliano ya Bosi */}
          <div className="pt-3 border-t border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mawasiliano ya Bosi</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1">
                <span className="text-[10px] uppercase font-semibold text-slate-500 block">Simu</span>
                <div className="flex items-center gap-1.5 text-xs font-mono text-slate-300">
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  <span>{user?.phone || 'N/A'}</span>
                </div>
              </div>

              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1">
                <span className="text-[10px] uppercase font-semibold text-slate-500 block">Email</span>
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
              disabled={isSubmittingPassword}
              className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition text-sm mt-2"
            >
              {isSubmittingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              <span>Hifadhi Nenosiri Jipya</span>
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}