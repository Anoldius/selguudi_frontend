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
  UserCheck,
  Check,
  X,
  RefreshCw
} from 'lucide-react';

export default function Settings() {
  const [isAuthenticatedSession, setIsAuthenticatedSession] = useState(false);
  const [hasSettingsPassword, setHasSettingsPassword] = useState(true);
  
  // Verification State
  const [verifyPasswordInput, setVerifyPasswordInput] = useState('');
  const [showVerifyPassword, setShowVerifyPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState('');

  // Mode ya View: 'verify' | 'set_initial' | 'forgot'
  const [authMode, setAuthMode] = useState('verify'); 

  // Form States za Kuweka/Kubadilisha/Reset Password
  const [newSettingsPassword, setNewSettingsPassword] = useState('');
  const [confirmSettingsPassword, setConfirmSettingsPassword] = useState('');
  const [accountLoginPassword, setAccountLoginPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  // State ya Permissions za Cashier
  const [permissions, setPermissions] = useState({
    show_profit_to_cashier: false,
    allow_cashier_debts: true,
    allow_cashier_custom_price: true,
    show_buying_price_to_cashier: false
  });

  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [isSavingPermissions, setIsSavingPermissions] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const triggerNotification = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Helper ya kuangalia Strong Password Validation (Real-Time)
  const getPasswordValidation = (pwd) => ({
    length: pwd.length >= 8,
    hasUpper: /[A-Z]/.test(pwd),
    hasLower: /[a-z]/.test(pwd),
    hasNumber: /[0-9]/.test(pwd),
    hasSpecial: /[@$!%*?&_#^()-+={}]/.test(pwd)
  });

  const pwdValidation = getPasswordValidation(newSettingsPassword);
  const isPasswordStrong = Object.values(pwdValidation).every(Boolean);

  const fetchPermissions = async () => {
    setLoadingPermissions(true);
    try {
      const res = await apiClient.get('auth/business-permissions/');
      setPermissions(res.data);
      setHasSettingsPassword(res.data.has_settings_password);

      if (!res.data.has_settings_password) {
        setAuthMode('set_initial');
      }
    } catch (err) {
      console.error("Failed to load permissions:", err);
    } finally {
      setLoadingPermissions(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  // 1. Mchakataji wa kuhakiki Nenosiri la Settings kabla ya kufungua Settings Panel
  const handleVerifyPasswordSubmit = async (e) => {
    e.preventDefault();
    setVerifyError('');
    setIsVerifying(true);

    try {
      await apiClient.post('auth/verify-password/', { settings_password: verifyPasswordInput });
      setIsVerifying(false);
      setIsAuthenticatedSession(true);
    } catch (err) {
      setIsVerifying(false);
      setVerifyError(err.response?.data?.settings_password?.[0] || err.response?.data?.non_field_errors?.[0] || "Nenosiri la Mipangilio si sahihi.");
    }
  };

  // 2. Mchakataji wa Kuweka Nenosiri la Mipangilio kwa Mara ya Kwanza
  const handleSetInitialPasswordSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!isPasswordStrong) {
      setFormError("Tafadhali hakikisha nenosiri linakidhi vigezo vyote vya usalama.");
      return;
    }

    setIsSubmittingPassword(true);
    try {
      await apiClient.post('auth/set-settings-password/', {
        new_settings_password: newSettingsPassword,
        confirm_settings_password: confirmSettingsPassword
      });
      setIsSubmittingPassword(false);
      setIsAuthenticatedSession(true);
      setHasSettingsPassword(true);
      triggerNotification("Nenosiri la Mipangilio limewekwa kikamilifu!");
    } catch (err) {
      setIsSubmittingPassword(false);
      setFormError(err.response?.data?.confirm_settings_password?.[0] || err.response?.data?.new_settings_password?.[0] || "Imeshindikana kuweka nenosiri.");
    }
  };

  // 3. Mchakataji wa Reset (Umesahau Nenosiri la Settings) kwa kutumia Login Password
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!isPasswordStrong) {
      setFormError("Tafadhali hakikisha nenosiri jipya linakidhi vigezo vyote vya usalama.");
      return;
    }

    setIsSubmittingPassword(true);
    try {
      await apiClient.post('auth/reset-settings-password/', {
        account_login_password: accountLoginPassword,
        new_settings_password: newSettingsPassword,
        confirm_settings_password: confirmSettingsPassword
      });
      setIsSubmittingPassword(false);
      setIsAuthenticatedSession(true);
      setAuthMode('verify');
      triggerNotification("Nenosiri la Mipangilio limebadilishwa kikamilifu!");
    } catch (err) {
      setIsSubmittingPassword(false);
      setFormError(err.response?.data?.account_login_password?.[0] || err.response?.data?.confirm_settings_password?.[0] || "Imeshindikana kurejesha nenosiri.");
    }
  };

  // 4. Mchakataji wa Hifadhi Mipangilio (Save Toggles)
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

      {/* SECURITY MODAL PANEL (UNAUTHENTICATED SESSION) */}
      {!isAuthenticatedSession ? (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
          
          {/* VIEW 1: INGIZA NENOSIRI LA SETTINGS */}
          {authMode === 'verify' && (
            <div className="max-w-md mx-auto text-center space-y-6">
              <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto">
                <Lock className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">Ingiza Nenosiri la Mipangilio</h3>
                <p className="text-sm text-slate-400">
                  Ingiza Nenosiri Maalum la Mipangilio (Settings Passcode) kufungua sehemu hii.
                </p>
              </div>

              <form onSubmit={handleVerifyPasswordSubmit} className="space-y-4">
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
                    placeholder="Weka Nenosiri la Mipangilio..."
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

              <button
                type="button"
                onClick={() => setAuthMode('forgot')}
                className="text-xs text-emerald-400 hover:underline font-semibold"
              >
                Umesahau Nenosiri la Mipangilio?
              </button>
            </div>
          )}

          {/* VIEW 2: TENGENEZA NENOSIRI LA SETTINGS MARA YA KWANZA */}
          {authMode === 'set_initial' && (
            <div className="max-w-md mx-auto space-y-6">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-white">Tengeneza Nenosiri la Mipangilio</h3>
                <p className="text-xs text-slate-400">
                  Duka lako halijatengeneza Nenosiri la Mipangilio. Tengeneza nenosiri imara la siri la kulinda sehemu hii.
                </p>
              </div>

              <form onSubmit={handleSetInitialPasswordSubmit} className="space-y-4">
                {formError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl font-medium">
                    {formError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Nenosiri Jipya la Mipangilio</label>
                  <input
                    type={showNewPassword ? "text" : "password"}
                    required
                    value={newSettingsPassword}
                    onChange={(e) => setNewSettingsPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-white focus:outline-none focus:border-emerald-500 font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Thibitisha Nenosiri Jipya</label>
                  <input
                    type={showNewPassword ? "text" : "password"}
                    required
                    value={confirmSettingsPassword}
                    onChange={(e) => setConfirmSettingsPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-white focus:outline-none focus:border-emerald-500 font-mono text-sm"
                  />
                </div>

                {/* Real-time Password Complexity Checker */}
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 text-xs">
                  <p className="font-bold text-slate-300 mb-1">Vigezo vya Nenosiri Imara:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <span className={`flex items-center gap-1.5 ${pwdValidation.length ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {pwdValidation.length ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />} Angalau herufi 8+
                    </span>
                    <span className={`flex items-center gap-1.5 ${pwdValidation.hasUpper ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {pwdValidation.hasUpper ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />} Herufi Kubwa (A-Z)
                    </span>
                    <span className={`flex items-center gap-1.5 ${pwdValidation.hasLower ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {pwdValidation.hasLower ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />} Herufi Ndogo (a-z)
                    </span>
                    <span className={`flex items-center gap-1.5 ${pwdValidation.hasNumber ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {pwdValidation.hasNumber ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />} Namba (0-9)
                    </span>
                    <span className={`flex items-center gap-1.5 ${pwdValidation.hasSpecial ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {pwdValidation.hasSpecial ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />} Alama (@, #, $, %)
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingPassword || !isPasswordStrong}
                  className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-2xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
                >
                  {isSubmittingPassword ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  <span>Tengeneza Nenosiri</span>
                </button>
              </form>
            </div>
          )}

          {/* VIEW 3: UMESAHAU NENOSIRI LA SETTINGS (RESET VIA ACCOUNT LOGIN PASSWORD) */}
          {authMode === 'forgot' && (
            <div className="max-w-md mx-auto space-y-6">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <RefreshCw className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-white">Kurejesha Nenosiri la Mipangilio</h3>
                <p className="text-xs text-slate-400">
                  Weka Nenosiri yako ya **Account Login** kuthibitisha kuwa wewe ndiye Bosi, kisha uweke Nenosiri Jipya la Mipangilio.
                </p>
              </div>

              <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                {formError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl font-medium">
                    {formError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-amber-400 mb-1">Nenosiri Lako la Account Login</label>
                  <input
                    type="password"
                    required
                    value={accountLoginPassword}
                    onChange={(e) => setAccountLoginPassword(e.target.value)}
                    placeholder="Password ya kuingilia Mfumoni..."
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-white focus:outline-none focus:border-amber-500 font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Nenosiri Jipya la Mipangilio</label>
                  <input
                    type="password"
                    required
                    value={newSettingsPassword}
                    onChange={(e) => setNewSettingsPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-white focus:outline-none focus:border-emerald-500 font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Thibitisha Nenosiri Jipya</label>
                  <input
                    type="password"
                    required
                    value={confirmSettingsPassword}
                    onChange={(e) => setConfirmSettingsPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-white focus:outline-none focus:border-emerald-500 font-mono text-sm"
                  />
                </div>

                {/* Real-time Password Complexity Checker */}
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 text-xs">
                  <p className="font-bold text-slate-300 mb-1">Vigezo vya Nenosiri Imara:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <span className={`flex items-center gap-1.5 ${pwdValidation.length ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {pwdValidation.length ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />} Angalau herufi 8+
                    </span>
                    <span className={`flex items-center gap-1.5 ${pwdValidation.hasUpper ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {pwdValidation.hasUpper ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />} Herufi Kubwa (A-Z)
                    </span>
                    <span className={`flex items-center gap-1.5 ${pwdValidation.hasLower ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {pwdValidation.hasLower ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />} Herufi Ndogo (a-z)
                    </span>
                    <span className={`flex items-center gap-1.5 ${pwdValidation.hasNumber ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {pwdValidation.hasNumber ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />} Namba (0-9)
                    </span>
                    <span className={`flex items-center gap-1.5 ${pwdValidation.hasSpecial ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {pwdValidation.hasSpecial ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />} Alama (@, #, $, %)
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setAuthMode('verify')}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    Rudi Nyuma
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingPassword || !isPasswordStrong}
                    className="py-3 px-6 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-2xl shadow-lg flex items-center justify-center gap-2 transition disabled:opacity-50 text-xs"
                  >
                    {isSubmittingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>Badilisha Nenosiri</span>
                  </button>
                </div>
              </form>
            </div>
          )}

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