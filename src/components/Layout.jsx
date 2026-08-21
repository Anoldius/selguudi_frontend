import React, { useContext, useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  CreditCard,
  BarChart3, 
  LogOut, 
  Store, 
  User,
  Heart,
  Menu,
  X
} from 'lucide-react';

export default function Layout({ children }) {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const currentYear = new Date().getFullYear();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Mauzo (POS)', path: '/pos', icon: ShoppingCart },
    { name: 'Stoko & Bidhaa', path: '/inventory', icon: Package },
    { name: 'Daftari la Madeni', path: '/debts', icon: CreditCard },
    { name: 'Ripoti & Takwimu', path: '/reports', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans">
      
      {/* DESKTOP SIDEBAR */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800/80 flex flex-col justify-between hidden md:flex shrink-0">
        <div>
          {/* Brand Header */}
          <div className="p-6 border-b border-slate-800/60 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-extrabold text-lg tracking-wide text-white">Selguudi <span className="text-emerald-400">POS</span></h1>
              <p className="text-xs text-slate-400 font-medium truncate max-w-[130px]">{user?.business_name || 'Selguudi Mart'}</p>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="p-4 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                    isActive
                      ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20 font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}

            {/* USER PROFILE & LOGOUT BADGE (IMEVUTWA JUU HAPA BAADA YA RIPOTI!) */}
            <div className="pt-3 mt-3 border-t border-slate-800/60">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-9 h-9 shrink-0 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 font-bold">
                    <User className="w-5 h-5" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm font-semibold text-white truncate">{user?.username}</p>
                    <p className="text-xs text-slate-400 capitalize truncate">{user?.role || 'Owner'}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
                  title="Toka (Logout)"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </nav>
        </div>

        {/* Sidebar Bottom Copyright */}
        <div className="p-4 border-t border-slate-800/40 text-[11px] text-slate-600 font-medium">
          &copy; {currentYear} Selguudi POS
        </div>
      </aside>

      {/* MOBILE SIDEBAR DRAWER */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm md:hidden flex">
          <div className="w-72 bg-slate-900 h-full border-r border-slate-800 p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-5 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Store className="w-6 h-6 text-emerald-400" />
                  <span className="font-extrabold text-white text-lg">Selguudi POS</span>
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

                {/* USER PROFILE & LOGOUT BADGE FOR MOBILE DRAWER */}
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