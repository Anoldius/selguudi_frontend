import React, { useState, useEffect } from 'react';
import apiClient from '../api/axios';
import { 
  ShieldCheck, 
  Lock, 
  Eye, 
  EyeOff, 
  KeyRound, 
  Sliders, 
  Save, 
  CheckCircle2, 
  AlertTriangle, 
  Loader2, 
  X,
  Building2,
  UserCheck
} from 'lucide-react';

export default function Settings() {
  const [isAuthenticatedSession, setIsAuthenticatedSession] = useState(false);
  const [verifyPasswordInput, setVerifyPasswordInput] = useState('');
  const [showVerifyPassword, setShowVerifyPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState('');

  // State ya Permissions za Cashier
  const [permissions, setPermissions] = useState({
    show_profit_to_cashier: false,
    allow_cashier_debts: true,
    allow_cashier_custom_price: true,
    show_buying_price_to_cashier: false
  });

  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [isSavingPermissions, setIsSavingPermissions] = useState(false);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState(null);

  const triggerNotification = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Fetch Permissions baada ya Re-Authentication kufanikiwa
  const fetchPermissions = async () => {
    setLoadingPermissions(true);
    try {
      const res = await apiClient.get('auth/business-permissions/');
      setPermissions(res.data);
    } catch (err) {
      console.error("Failed to load permissions:", err);
    } finally {
      setLoadingPermissions(false);
    }
  };

  // 1. Mchakataji wa kuhakiki Password kabla ya kufungua Settings
  const handleVerifyPasswordSubmit = async (e) => {
    e.preventDefault();
    setVerifyError('');
    setIsVerifying(true);

    try {
      await apiClient.post('auth/verify-password/', { password: verifyPasswordInput });
      setIsVerifying(false);
      setIsAuthenticatedSession(true);
      fetchPermissions();
    } catch (err) {
      setIsVerifying(false);
      setVerifyError(err.response?.data?.password?.[0] || err.response?.data?.non_field_errors?.[0] || "Nenosiri si sahihi.");
    }
  };

  // 2. Mchakataji wa Hifadhi Mipangilio (Save Toggles)
  const handleToggleChange = (field) => {
    setPermissions(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSavePermissions = async () => {
    setIsSavingPermissions(true);
    try {
      await apiClient.put('auth/business-permissions/', permissions);
      triggerNotification("Mipangilio ya duka imehifadhiwa kikamilifu!");
    } catch (err) {
      triggerNotification(err.response?.data?.error || "Imeshindikana kuhifadhi mipangilio.");
    } finally {
      setIsSavingPermissions(false);
    }
  };

  return (
    <div className="space-y-6 relative max-w-4xl mx-auto">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-3 bg-emerald-500 text-slate-950 font-bold px-5 py-3.5 rounded-2xl shadow-2xl border border-emerald-400 animate-bounce">
          <CheckCircle2 className="w-5 h-5" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-3xl flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Sliders className="w-7 h-7 text-emerald-400" />
            <span>Mipangilio ya Duka & Usalama</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">Dhibiti haki za muuzaji (Cashier), faragha ya faida na ulinzi wa akaunti yako.</p>
        </div>
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl">
          <ShieldCheck className="w-8 h-8" />
        </div>
      </div>

      {/* MODAL YA SECURITY: RE-AUTHENTICATION (KAMA BADO HAJAHAKIKI PASSWORD) */}
      {!isAuthenticatedSession ? (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8" />
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-xl font-bold text-white">Thibitisha Utambulisho Wako</h3>
            <p className="text-sm text-slate-400">
              Ili kulinda faragha ya biashara yako, tafadhali ingiza Nenosiri (Password) lako la sasa ili kufungua sehemu ya Mipangilio.
            </p>
          </div>

          <form onSubmit={handleVerifyPasswordSubmit} className="max-w-md mx-auto space-y-4">
            {verifyError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl font-medium">
                {verifyError}
              </div>
            )}

            <div className="relative">
              <input
                type={showVerifyPassword ? "text" : "password"}
                required
                value={verifyPasswordInput}
                onChange={(e) => setVerifyPasswordInput(e.target.value)}
                placeholder="Weka Nenosiri Lako..."
                className="w-full pl-4 pr-12 py-3.5 bg-slate-950 border border-slate-800 rounded-2xl text-white focus:outline-none focus:border-emerald-500 transition font-mono"
              />
              <button
                type="button"
                onClick={() => setShowVerifyPassword(!showVerifyPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-white"
              >
                {showVerifyPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <button
              type="submit"
              disabled={isVerifying}
              className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-2xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {isVerifying ? <Loader2 className="w-5 h-5 animate-spin" /> : <KeyRound className="w-5 h-5" />}
              <span>Fungua Mipangilio</span>
            </button>
          </form>
        </div>
      ) : (
        /* MAIN SETTINGS PANEL (ONCE VERIFIED) */
        <div className="space-y-6">
          
          {/* Card 1: Haki za Wafanyakazi (Cashier Permissions) */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-purple-400" />
                  <span>Usimamizi wa Haki za Muuzaji (Cashier Permissions)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Washa au zima vipengele ambavyo muuzaji anaruhusiwa kuona au kufanya.</p>
              </div>
            </div>

            {loadingPermissions ? (
              <div className="py-8 text-center text-slate-400 flex justify-center items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
                <span>Inapakia Mipangilio...</span>
              </div>
            ) : (
              <div className="space-y-4">
                
                {/* Toggle 1: Show Profit */}
                <div className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl border border-slate-800">
                  <div>
                    <h4 className="text-sm font-bold text-white">Ruhusu Cashier kuona Faida & Takwimu</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Kama imezimwa, Cashier hawezi kuona jumla ya faida kwenye mfumo.</p>
                  </div>
                  <button
                    onClick={() => handleToggleChange('show_profit_to_cashier')}
                    className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors duration-300 ${
                      permissions.show_profit_to_cashier ? 'bg-emerald-500 justify-end' : 'bg-slate-800 justify-start'
                    }`}
                  >
                    <div className="w-6 h-6 rounded-full bg-slate-950 shadow-md transform transition" />
                  </button>
                </div>

                {/* Toggle 2: Show Buying Price */}
                <div className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl border border-slate-800">
                  <div>
                    <h4 className="text-sm font-bold text-white">Ruhusu Cashier kuona Bei ya Kununulia (Buying Price)</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Kama imezimwa, Cashier ataona bei ya kuuzia tu lakini si ya mtaji.</p>
                  </div>
                  <button
                    onClick={() => handleToggleChange('show_buying_price_to_cashier')}
                    className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors duration-300 ${
                      permissions.show_buying_price_to_cashier ? 'bg-emerald-500 justify-end' : 'bg-slate-800 justify-start'
                    }`}
                  >
                    <div className="w-6 h-6 rounded-full bg-slate-950 shadow-md transform transition" />
                  </button>
                </div>

                {/* Toggle 3: Debts Access */}
                <div className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl border border-slate-800">
                  <div>
                    <h4 className="text-sm font-bold text-white">Ruhusu Cashier kuingia Kwenye Daftari la Madeni</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Inamruhusu Cashier kupokea marejesho ya madeni kutoka kwa wateja.</p>
                  </div>
                  <button
                    onClick={() => handleToggleChange('allow_cashier_debts')}
                    className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors duration-300 ${
                      permissions.allow_cashier_debts ? 'bg-emerald-500 justify-end' : 'bg-slate-800 justify-start'
                    }`}
                  >
                    <div className="w-6 h-6 rounded-full bg-slate-950 shadow-md transform transition" />
                  </button>
                </div>

                {/* Toggle 4: Custom Price on POS */}
                <div className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl border border-slate-800">
                  <div>
                    <h4 className="text-sm font-bold text-white">Ruhusu Cashier Kupunguza Bei Kwenye POS (Custom Price)</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Inamwezesha kubadilisha bei ya bidhaa kikapuni wakati wa mauzo.</p>
                  </div>
                  <button
                    onClick={() => handleToggleChange('allow_cashier_custom_price')}
                    className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors duration-300 ${
                      permissions.allow_cashier_custom_price ? 'bg-emerald-500 justify-end' : 'bg-slate-800 justify-start'
                    }`}
                  >
                    <div className="w-6 h-6 rounded-full bg-slate-950 shadow-md transform transition" />
                  </button>
                </div>

              </div>
            )}

            {/* Save Button */}
            <div className="pt-4 flex justify-end">
              <button
                onClick={handleSavePermissions}
                disabled={isSavingPermissions}
                className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold rounded-2xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition disabled:opacity-50"
              >
                {isSavingPermissions ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                <span>Hifadhi Mipangilio</span>
              </button>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}