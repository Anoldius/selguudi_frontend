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
  Zap,
  Loader2,
  ChevronLeft,
  Settings as SettingsIcon,
  Users as UsersIcon
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
  const [isInitiatingPayment, setIsInitiatingPayment] = useState(false);

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

  // Logic ya Kuanzisha Malipo PesaPal
  const handlePayWithPesaPal = async () => {
    setIsInitiatingPayment(true);

    try {
      const res = await apiClient.post('auth/billing/initiate/');

      if (res.data && res.data.redirect_url) {
        window.location.href = res.data.redirect_url;
      } else {
        alert("Imeshindikana kupata Link ya Malipo kutoka kwenye server. Jaribu tena.");
      }
    } catch (err) {
      console.error("Payment initiation detailed error:", err.response?.data || err.message);

      const status = err.response?.status;
      const errorData = err.response?.data;
      let errorMessage = "Imeshindikana kuunganisha na PesaPal Gateway.";

      if (errorData) {
        if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      }

      alert(`Hitilafu ya Malipo (${status ? `Code ${status}` : 'Network Error'}): ${errorMessage}`);
    } finally {
      setIsInitiatingPayment(false);
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

  // Chuja menyu kulingana na Role ya mtumiaji
  const isOwner = user?.role === 'owner';
  const navItems = allNavItems.filter(item => !item.ownerOnly || isOwner);

  // KUPATA SIKU ZILIZOBAKI KWA UHAKIKA (BILLING_INFO -> USER -> DEFAULT)
  const daysLeft = billingInfo?.days_left_in_trial ?? user?.days_left_in_trial ?? 22;
  const hasActiveAccess = billingInfo?.has_active_access ?? user?.has_active_access ?? true;
  const isSubscriptionActive = Boolean(billingInfo?.subscription_end_date);

  // BANNER IONEKANE KAMA HAJALAPIA SUBSCRIPTION BADO
  const showTrialBanner = !isSubscriptionActive;

  // KAMA ACCESS IMEISHA KABISA
  if (!loadingBilling && !hasActiveAccess) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 via-amber-500 to-emerald-500" />

          <div className="w-20 h-20 mx-auto rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shadow-xl">
            <Lock className="w-10 h-10" />
          </div>

          <div>
            <h2 className="text-2xl font-extrabold text-white">Trial ya Bure Imeisha!</h2>
            <p className="text-slate-400 text-sm mt-2">
              Siku za kujaribu mfumo wa <span className="text-emerald-400 font-bold uppercase">{billingInfo?.business_name || user?.business_name}</span> zimekamilika. Lipia ili kuendelea kutumia mfumo.
            </p>
          </div>

          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400">Gharama za Mwezi:</span>
              <span className="text-emerald-400 font-extrabold font-mono text-lg">20,000 TZS</span>
            </div>
            <div className="flex justify-between items-center text-xs text-slate-500 border-t border-slate-800/80 pt-2">
              <span>Njia za Malipo:</span>
              <span className="text-slate-300 font-medium">M-Pesa, TigoPesa, Airtel, Cards</span>
            </div>
          </div>

          <button
            onClick={handlePayWithPesaPal}
            disabled={isInitiatingPayment}
            className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold rounded-2xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition duration-200 disabled:opacity-50"
          >
            {isInitiatingPayment ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Inafungua PesaPal...</span>
              </>
            ) : (
              <>
                <Zap className="w-5 h-5 fill-slate-950" />
                <span>Lipa TZS 20,000 Sasa (PesaPal)</span>
              </>
            )}
          </button>

          <button
            onClick={handleLogout}
            className="text-xs text-slate-500 hover:text-slate-300 transition"
          >
            Toka (Logout)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans">

      {/* DESKTOP SIDEBAR WITH COLLAPSIBLE TOGGLE */}
      <aside 
        className={`bg-slate-900 border-r border-slate-800/80 hidden md:flex flex-col justify-between shrink-0 transition-all duration-300 ${
          isSidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      > 
        <div>
          {/* BRAND HEADER */}
          <div className={`p-4 border-b border-slate-800/60 flex items-center justify-between gap-2 ${isSidebarCollapsed ? 'flex-col gap-3 py-4' : ''}`}>
            <div className="flex items-center min-w-0 overflow-hidden">
              <img 
                src="/Selguudiadobe.png" 
                alt="Selguudi Logo" 
                className={`object-contain transition-all duration-300 drop-shadow-md ${
                  isSidebarCollapsed 
                    ? 'h-10 w-auto max-w-[52px]' 
                    : 'h-14 sm:h-16 w-auto max-w-[210px]'
                }`}
              />
            </div>

            {/* Desktop Collapse Toggle Button */}
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-emerald-400 transition shrink-0"
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
                  className={`flex items-center gap-3.5 px-3.5 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                    isActive
                      ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20 font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  } ${isSidebarCollapsed ? 'justify-center px-0' : ''}`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {!isSidebarCollapsed && <span>{item.name}</span>}
                </Link>
              );
            })}

            {/* USER PROFILE & LOGOUT BADGE */}
            <div className="pt-3 mt-3 border-t border-slate-800/60">
              <div className={`flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 ${
                isSidebarCollapsed ? 'justify-center' : ''
              }`}>
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="w-8 h-8 shrink-0 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 font-bold">
                    <User className="w-4 h-4" />
                  </div>
                  {!isSidebarCollapsed && (
                    <div className="overflow-hidden">
                      <p className="text-xs font-semibold text-white truncate">{user?.username}</p>
                      <p className="text-[10px] text-slate-400 capitalize truncate">{user?.role || 'Owner'}</p>
                    </div>
                  )}
                </div>

                {!isSidebarCollapsed && (
                  <button
                    onClick={handleLogout}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
                    title="Toka (Logout)"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </nav>
        </div>

        {/* Sidebar Bottom Copyright */}
        {!isSidebarCollapsed && (
          <div className="p-4 border-t border-slate-800/40 text-[11px] text-slate-600 font-medium">
            &copy; {currentYear} Selguudi POS
          </div>
        )}
      </aside>

      {/* MOBILE SIDEBAR DRAWER */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm md:hidden flex">
          <div className="w-72 bg-slate-900 h-full border-r border-slate-800 p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center min-w-0 overflow-hidden">
                  <img 
                    src="/Selguudiadobe.png" 
                    alt="Selguudi Logo" 
                    className="h-14 w-auto max-w-[210px] object-contain drop-shadow-md"
                  />
                </div>
                <button onClick={() => setMobileMenuOpen(false)} className="text-slate-400 hover:text-white">
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
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                        isActive
                          ? 'bg-emerald-500 text-slate-950 font-bold'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}

                <div className="pt-3 mt-3 border-t border-slate-800">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800 mb-3">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-9 h-9 shrink-0 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 font-bold">
                        <User className="w-5 h-5" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-sm font-semibold text-white truncate">{user?.username}</p>
                        <p className="text-xs text-slate-400 capitalize truncate">{user?.role || 'Owner'}</p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 font-semibold text-sm transition"
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
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">

        {/* TRIAL COUNTDOWN BANNER JUU YA MAIN CONTENT */}
        {showTrialBanner && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-2.5 flex items-center justify-between text-xs text-amber-300 font-medium">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>
                Trial ya Bure: Zimebaki <strong className="text-white underline font-bold">{daysLeft} siku</strong> za kutumia mfumo bure.
              </span>
            </div>
            <button
              onClick={handlePayWithPesaPal}
              disabled={isInitiatingPayment}
              className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold rounded-lg text-[11px] transition shadow-md shadow-emerald-500/20 disabled:opacity-50"
            >
              {isInitiatingPayment ? 'Inafungua...' : 'Lipa 20,000 Sasa'}
            </button>
          </div>
        )}

        {/* Top Header */}
        <header className="h-16 bg-slate-900/60 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-6 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800/50"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold text-white">
              {navItems.find(n => n.path === location.pathname)?.name || 'Dashboard'}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2 animate-pulse" />
              System Live
            </span>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {children || <Outlet />}
        </main>

        {/* FOOTER SECTION */}
        <footer className="py-4 px-6 border-t border-slate-800/80 bg-slate-950/60 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2 mt-auto">
          <div className="flex items-center gap-1">
            <span>&copy; {currentYear}</span>
            <span className="font-semibold text-slate-400">Selguudi POS</span>. 
            <span>Haki zote zimehifadhiwa.</span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-400">
            <span>Engineered with</span>
            <Heart className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500/20" />
            <span>for Supermarkets & Retail Stores</span>
          </div>
        </footer>

      </div>
    </div>
  );
}