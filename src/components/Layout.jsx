import React, { useContext, useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import apiClient from '../api/axios';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  CreditCard,
  BarChart3, 
  Wallet,
  LogOut, 
  User,
  Heart,
  Menu,
  X,
  Clock,
  Lock,
  Loader2,
  ChevronLeft,
  Settings as SettingsIcon,
  Users as UsersIcon,
  Smartphone,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';

export default function Layout({ children }) {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  // Mobile Menu State
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Desktop Sidebar Collapse / Expand State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // States za Billing & Subscription Status
  const [billingInfo, setBillingInfo] = useState(null);
  const [loadingBilling, setLoadingBilling] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);

  // State ya Modal ya Malipo (Payment Modal)
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const currentYear = new Date().getFullYear();

  useEffect(() => {
    fetchBillingStatus();
  }, []);

  const fetchBillingStatus = async () => {
    try {
      const res = await apiClient.get('auth/billing/status/');
      setBillingInfo(res.data);
    } catch (err) {
      console.error("Billing status fetch error:", err);
    } finally {
      setLoadingBilling(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Kagua Kama Malipo Yameshaingia
  const handleVerifyPaymentStatus = async () => {
    setIsVerifying(true);
    try {
      await fetchBillingStatus();
      const res = await apiClient.get('auth/billing/status/');
      if (res.data && res.data.has_active_access) {
        alert("🎉 Hongera! Duka lako limewashwa kikamilifu!");
        setShowPaymentModal(false);
      } else {
        alert("Malipo yako bado hayajasomwa na mfumo. Kama umeshatuma fedha, subiri sekunde chache kisha ubonyeze tena 'Hakiki Malipo'.");
      }
    } catch (err) {
      console.error(err);
      alert("Imeshindikana kuhakiki taarifa za malipo kwa sasa.");
    } finally {
      setIsVerifying(false);
    }
  };

  // Orodha Kamili ya Menyu
  const allNavItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, ownerOnly: false },
    { name: 'Mauzo (POS)', path: '/pos', icon: ShoppingCart, ownerOnly: false },
    { name: 'Matumizi', path: '/expenses', icon: Wallet, ownerOnly: false },
    { name: 'Stoko & Bidhaa', path: '/inventory', icon: Package, ownerOnly: false },
    { name: 'Daftari la Madeni', path: '/debts', icon: CreditCard, ownerOnly: false },
    { name: 'Ripoti & Takwimu', path: '/reports', icon: BarChart3, ownerOnly: true },
    { name: 'Wafanyakazi', path: '/users', icon: UsersIcon, ownerOnly: true },
    { name: 'Mipangilio', path: '/settings', icon: SettingsIcon, ownerOnly: true },
  ];

  const isOwner = user?.role === 'owner';
  const navItems = allNavItems.filter(item => !item.ownerOnly || isOwner);

  // KUPATA SIKU ZILIZOBAKI (Default ni Siku 7)
  const daysLeft = billingInfo?.days_left_in_trial ?? user?.days_left_in_trial ?? 7;
  const hasActiveAccess = billingInfo?.has_active_access ?? user?.has_active_access ?? true;

  // Namba iliyosajiliwa na Mteja
  const registeredPhone = billingInfo?.phone || user?.phone || user?.phone_number || user?.business?.phone || user?.username || "07XXXXXXXX";

  const showTrialBanner = Number(daysLeft) > 0;

  // COMPONENT YA MAELEKEZO YA MALIPO (Clean Light Style)
  const PaymentInstructionsCard = () => (
    <div className="space-y-4 text-left">
      {/* NAMBA YA USAJILI YA MTEJA */}
      <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-emerald-800 font-medium">
          <Smartphone className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Namba yako ya usajili:</span>
        </div>
        <span className="font-mono font-black text-blue-950 bg-white px-2.5 py-1 rounded-lg border border-slate-300 text-sm shadow-2xs">
          {registeredPhone}
        </span>
      </div>

      {/* MAELEKEZO YA MALIPO YA SIMU DIRECT */}
      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
        <div className="flex justify-between items-center pb-2 border-b border-slate-200">
          <span className="text-xs font-bold text-slate-500">Kifurushi cha Mwezi:</span>
          <span className="text-emerald-700 font-black font-mono text-base">20,000 TZS</span>
        </div>

        <div className="space-y-2 pt-1 text-xs">
          <div className="flex justify-between text-slate-700">
            <span className="font-semibold">AirtelMoney:</span>
            <span className="font-mono font-extrabold text-blue-900">0686915966</span>
          </div>
          <div className="flex justify-between text-slate-700">
            <span className="font-semibold">Halopesa:</span>
            <span className="font-mono font-extrabold text-blue-900">0613012686</span>
          </div>
          <div className="flex justify-between text-slate-500 text-[11px] pt-1.5 border-t border-slate-200">
            <span>Jina la Akaunti:</span>
            <span className="font-bold text-slate-800">ANOLDIUS PAUL</span>
          </div>
        </div>
      </div>

      <p className="text-[11px] text-amber-900 bg-amber-50 p-3 rounded-xl border border-amber-200 leading-relaxed font-medium">
        📌 <strong className="text-amber-800">Angalizo:</strong> Hakikisha unatuma fedha kutoka kwenye namba yako ya usajili (<strong className="text-blue-950 underline">{registeredPhone}</strong>). Mfumo utasoma SMS na kuwasha duka lako <strong>kiotomatiki</strong> mara tu baada ya kutuma!
      </p>

      <button
        onClick={handleVerifyPaymentStatus}
        disabled={isVerifying}
        className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition duration-200 disabled:opacity-50"
      >
        {isVerifying ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Inahakiki Malipo...</span>
          </>
        ) : (
          <>
            <RefreshCw className="w-5 h-5" />
            <span>Nishatuma / Hakiki Malipo</span>
          </>
        )}
      </button>
    </div>
  );

  // KAMA ACCESS IMEISHA KABISA (SKRINI YA LOCK YA AUTO-ACTIVATION)
  if (!loadingBilling && !hasActiveAccess) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans text-slate-800">
        <div className="max-w-md w-full bg-white border-2 border-emerald-500/40 rounded-3xl p-8 text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 via-amber-500 to-emerald-500" />

          <div className="w-20 h-20 mx-auto rounded-3xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shadow-sm">
            <Lock className="w-10 h-10" />
          </div>

          <div>
            <h2 className="text-2xl font-black text-blue-950">Muda wa Trial Umeisha!</h2>
            <p className="text-slate-500 text-sm mt-2 font-medium">
              Kifurushi cha <span className="text-emerald-700 font-extrabold uppercase">{billingInfo?.business_name || user?.business_name}</span> kimeisha. Lipia ili mfumo uwake kiotomatiki.
            </p>
          </div>

          <PaymentInstructionsCard />

          <button
            onClick={handleLogout}
            className="text-xs font-bold text-slate-400 hover:text-red-600 transition"
          >
            Toka (Logout)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex font-sans">

      {/* DESKTOP SIDEBAR WITH DEEP BLUE / CLEAN THEME */}
      <aside 
        className={`bg-blue-950 text-white border-r border-blue-900 hidden md:flex flex-col justify-between shrink-0 transition-all duration-300 shadow-xl ${
          isSidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      > 
        <div>
          {/* BRAND HEADER */}
          <div className={`p-4 border-b border-blue-900 flex items-center justify-between gap-2 ${isSidebarCollapsed ? 'flex-col gap-3 py-4' : ''}`}>
            <div className="flex items-center min-w-0 overflow-hidden bg-white/10 p-1.5 rounded-2xl border border-white/10">
              <img 
                src="/uzakisasa.png" 
                alt="Selguudi Logo" 
                className={`object-contain transition-all duration-300 drop-shadow-md ${
                  isSidebarCollapsed 
                    ? 'h-10 w-auto max-w-[52px]' 
                    : 'h-12 sm:h-14 w-auto max-w-[200px]'
                }`}
              />
            </div>

            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-2 rounded-xl bg-blue-900/80 hover:bg-emerald-500 hover:text-slate-950 text-blue-200 transition shrink-0"
              title={isSidebarCollapsed ? "Panua Sidebar" : "Kunja Sidebar"}
            >
              {isSidebarCollapsed ? <Menu className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>
          </div>

          {/* Navigation Menu */}
          <nav className="p-3 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  title={isSidebarCollapsed ? item.name : ''}
                  className={`flex items-center gap-3.5 px-3.5 py-3 rounded-2xl font-bold text-sm transition-all duration-200 ${
                    isActive
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25'
                      : 'text-blue-200 hover:text-white hover:bg-blue-900/60'
                  } ${isSidebarCollapsed ? 'justify-center px-0' : ''}`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {!isSidebarCollapsed && <span>{item.name}</span>}
                </Link>
              );
            })}

            {/* USER PROFILE & LOGOUT BADGE */}
            <div className="pt-3 mt-3 border-t border-blue-900">
              <div className={`flex items-center justify-between p-2.5 rounded-2xl bg-blue-900/50 border border-blue-800/80 ${
                isSidebarCollapsed ? 'justify-center' : ''
              }`}>
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="w-8 h-8 shrink-0 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-black">
                    <User className="w-4 h-4" />
                  </div>
                  {!isSidebarCollapsed && (
                    <div className="overflow-hidden">
                      <p className="text-xs font-black text-white truncate">{user?.username}</p>
                      <p className="text-[10px] text-emerald-300 font-extrabold uppercase truncate">{user?.role || 'Owner'}</p>
                    </div>
                  )}
                </div>

                {!isSidebarCollapsed && (
                  <button
                    onClick={handleLogout}
                    className="p-1.5 rounded-xl text-blue-300 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
                    title="Toka (Logout)"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </nav>
        </div>

        {!isSidebarCollapsed && (
          <div className="p-4 border-t border-blue-900 text-[11px] text-blue-300 font-bold">
            &copy; {currentYear} Selguudi POS
          </div>
        )}
      </aside>

      {/* MOBILE SIDEBAR DRAWER */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm md:hidden flex">
          <div className="w-72 bg-blue-950 text-white h-full border-r border-blue-900 p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-blue-900">
                <div className="flex items-center min-w-0 overflow-hidden bg-white/10 p-1.5 rounded-2xl">
                  <img 
                    src="/uzakisasa.png" 
                    alt="Selguudi Logo" 
                    className="h-12 w-auto max-w-[190px] object-contain drop-shadow-md"
                  />
                </div>
                <button onClick={() => setMobileMenuOpen(false)} className="text-blue-200 hover:text-white p-1">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <nav className="mt-6 space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-extrabold text-sm transition-all ${
                        isActive
                          ? 'bg-emerald-500 text-slate-950'
                          : 'text-blue-200 hover:text-white hover:bg-blue-900/60'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}

                <div className="pt-3 mt-3 border-t border-blue-900">
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-blue-900/50 border border-blue-800 mb-3">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-9 h-9 shrink-0 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-black">
                        <User className="w-5 h-5" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-sm font-black text-white truncate">{user?.username}</p>
                        <p className="text-xs text-emerald-300 font-bold uppercase truncate">{user?.role || 'Owner'}</p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-red-500/10 text-red-400 hover:bg-red-500/20 font-extrabold text-sm transition"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Toka (Logout)</span>
                  </button>
                </div>
              </nav>
            </div>
          </div>
          <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen bg-slate-100">

        {/* TRIAL COUNTDOWN BANNER (CLEAN AMBER ACCENT) */}
        {showTrialBanner && (
          <div className="bg-amber-500/10 border-b border-amber-300/60 px-6 py-2.5 flex items-center justify-between text-xs text-amber-900 font-extrabold">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-700" />
              <span>
                Trial ya Bure: Zimebaki <strong className="text-blue-950 underline font-black">{daysLeft} siku</strong> za kutumia mfumo bure.
              </span>
            </div>
            <button
              onClick={() => setShowPaymentModal(true)}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-[11px] transition shadow-md shadow-emerald-600/20"
            >
              Lipa TZS 20,000
            </button>
          </div>
        )}

        {/* TOP HEADER (CLEAN LIGHT BLUE BACKDROP) */}
        <header className="h-16 bg-white border-b border-slate-200/80 flex items-center justify-between px-6 sticky top-0 z-10 shadow-xs">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 text-slate-600 hover:text-blue-950 rounded-xl bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-black text-blue-950 tracking-tight">
              {navItems.find(n => n.path === location.pathname)?.name || 'Dashboard'}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <span className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse" />
              System Live
            </span>
          </div>
        </header>

        {/* DYNAMIC PAGE CONTENT */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          {children || <Outlet />}
        </main>

        {/* MODAL YA MAELEKEZO YA MALIPO */}
        {showPaymentModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white border-2 border-emerald-500/40 rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl relative animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-emerald-700 font-black text-base">
                  <CreditCard className="w-5 h-5" />
                  <span>Lipia Kifurushi cha Mwezi</span>
                </div>
                <button 
                  onClick={() => setShowPaymentModal(false)} 
                  className="text-slate-400 hover:text-slate-600 p-1 bg-slate-100 rounded-xl"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <PaymentInstructionsCard />
            </div>
          </div>
        )}

        {/* FOOTER SECTION */}
        <footer className="py-4 px-6 border-t border-slate-200 bg-white text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2 mt-auto">
          <div className="flex items-center gap-1 font-semibold">
            <span>&copy; {currentYear}</span>
            <span className="font-extrabold text-blue-950">Selguudi POS</span>. 
            <span>Haki zote zimehifadhiwa.</span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
            <span>Engineered with</span>
            <Heart className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600/30" />
            <span>for Supermarkets & Retail Stores</span>
          </div>
        </footer>

      </div>
    </div>
  );
}