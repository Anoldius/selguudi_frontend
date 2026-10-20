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
  const { user, updateUser } = useAuth();
  const isOwner = user?.role === 'owner';

  // State ya Jina la Duka
  const [businessName, setBusinessName] = useState(user?.business_name || user?.business?.name || '');
  const [isUpdatingBusiness, setIsUpdatingBusiness] = useState(false);

  // State ya Namba ya Simu
  const [phone, setPhone] = useState(user?.phone || user?.phone_number || '');
  const [isUpdatingPhone, setIsUpdatingPhone] = useState(false);

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
      const res = await apiClient.put('auth/update-business-name/', { name: businessName.trim() });
      const updatedName = res.data?.business_name || businessName.trim();

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

  // 2. KUBADILISHA NAMBA YA SIMU
  const handleUpdatePhone = async (e) => {
    e.preventDefault();
    if (!phone.trim()) {
      triggerNotification("Tafadhali ingiza namba ya simu!");
      return;
    }

    setIsUpdatingPhone(true);
    try {
      const res = await apiClient.put('auth/update-phone/', { phone: phone.trim() });
      const updatedPhone = res.data?.phone || phone.trim();

      if (updateUser) {
        updateUser({ 
          phone: updatedPhone,
          phone_number: updatedPhone
        });
      }

      triggerNotification(res.data?.message || "Namba ya simu imebadilishwa kikamilifu! 📱");
    } catch (err) {
      triggerNotification(err.response?.data?.error || err.response?.data?.detail || "Imeshindikana kubadilisha namba ya simu!");
    } finally {
      setIsUpdatingPhone(false);
    }
  };

  // 3. KUBADILISHA NENOSIRI
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
      <div className="min-h-[70vh] flex items-center justify-center p-4 font-sans text-slate-800">
        <div className="bg-white border-2 border-red-500/40 rounded-3xl p-8 max-w-md text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 bg-red-50 border border-red-200 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-black text-blue-950">Hukuruhusiwa Kuingia Hapa</h3>
          <p className="text-sm font-semibold text-slate-500">
            Ukurasa wa Mipangilio unapatikana kwa akaunti ya Bosi (Owner) pekee.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto relative font-sans text-slate-800 pb-12">

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 bg-emerald-600 text-white font-black px-5 py-3.5 rounded-2xl shadow-2xl border border-emerald-500 animate-bounce text-sm">
          <CheckCircle2 className="w-5 h-5 text-white" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-blue-800 p-6 rounded-3xl text-white shadow-xl border-2 border-emerald-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="z-10 relative">
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <SettingsIcon className="w-7 h-7 text-emerald-400" />
            <span>Mipangilio ya Mfumo & Akaunti</span>
          </h1>
          <p className="text-blue-200 text-sm mt-1">
            Simamia taarifa za biashara yako na usalama wa akaunti ya Bosi.
          </p>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 text-emerald-300 rounded-2xl text-xs font-black self-start sm:self-auto z-10 shadow-md">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Owner Access Level</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* SEHEMU YA 1: KUBADILISHA JINA LA DUKA */}
        <div className="bg-white border-2 border-emerald-500/40 rounded-3xl p-6 space-y-5 shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 rounded-2xl">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-blue-950">Taarifa za Biashara</h3>
              <p className="text-xs text-slate-500 font-semibold">Badilisha Jina la Duka / Supermarket</p>
            </div>
          </div>

          <form onSubmit={handleUpdateBusinessName} className="space-y-4">
            <div>
              <label className="block text-xs font-black text-blue-950 uppercase tracking-wider mb-1.5">
                Jina la Duka / Supermarket *
              </label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Mfano: Selguudi Supermarket"
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-300 rounded-xl text-blue-950 font-black focus:outline-none focus:border-emerald-600 uppercase text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={isUpdatingBusiness}
              className="w-full py-3 bg-blue-900 hover:bg-blue-950 disabled:opacity-50 text-white font-black rounded-xl shadow-md shadow-blue-900/20 flex items-center justify-center gap-2 transition text-sm"
            >
              {isUpdatingBusiness ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Hifadhi Jina Jipya la Duka</span>
            </button>
          </form>
        </div>

        {/* SEHEMU YA 2: KUBADILISHA NAMBA YA SIMU NA MAWASILIANO */}
        <div className="bg-white border-2 border-emerald-500/40 rounded-3xl p-6 space-y-5 shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl">
              <Phone className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-blue-950">Mawasiliano ya Bosi</h3>
              <p className="text-xs text-slate-500 font-semibold">Badilisha Namba ya Simu na Kagua Barua Pepe</p>
            </div>
          </div>

          <form onSubmit={handleUpdatePhone} className="space-y-4">
            <div>
              <label className="block text-xs font-black text-blue-950 uppercase tracking-wider mb-1.5">
                Namba ya Simu ya Bosi *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4 text-emerald-600" />
                </div>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0712345678"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-slate-300 rounded-xl text-blue-950 font-bold font-mono focus:outline-none focus:border-emerald-600 text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isUpdatingPhone}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition text-sm"
            >
              {isUpdatingPhone ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Hifadhi Namba ya Simu</span>
            </button>
          </form>

          {/* Barua Pepe Card */}
          <div className="pt-2 border-t border-slate-100">
            <div className="p-3 bg-slate-50 border-2 border-slate-200 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-black text-slate-400 block">Barua Pepe (Email)</span>
                <div className="flex items-center gap-1.5 text-xs font-mono font-extrabold text-blue-950">
                  <Mail className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{user?.email || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SEHEMU YA 3: KUBADILISHA NENOSIRI (PASSWORD UPDATE) */}
        <div className="md:col-span-2 bg-white border-2 border-emerald-500/40 rounded-3xl p-6 space-y-5 shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 rounded-2xl">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-blue-950">Badilisha Nenosiri (Password)</h3>
              <p className="text-xs text-slate-500 font-semibold">Imarisha usalama wa akaunti ya Bosi</p>
            </div>
          </div>

          <form onSubmit={handleSubmitPassword} className="space-y-4 max-w-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-blue-950 uppercase tracking-wider mb-1.5">
                  Nenosiri Jipya *
                </label>
                <input
                  type="password"
                  name="new_password"
                  required
                  value={passwordData.new_password}
                  onChange={handlePasswordChange}
                  placeholder="Ingiza password mpya"
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-300 rounded-xl text-blue-950 font-bold focus:outline-none focus:border-emerald-600 font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-blue-950 uppercase tracking-wider mb-1.5">
                  Thibitisha Nenosiri Jipya *
                </label>
                <input
                  type="password"
                  name="confirm_password"
                  required
                  value={passwordData.confirm_password}
                  onChange={handlePasswordChange}
                  placeholder="Rudia password mpya"
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-300 rounded-xl text-blue-950 font-bold focus:outline-none focus:border-emerald-600 font-mono text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmittingPassword}
              className="py-3.5 px-6 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition text-sm mt-2"
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