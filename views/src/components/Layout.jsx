import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { LogOut, MonitorSmartphone, ShieldCheck } from "lucide-react";

const Layout = () => {
  const { user, logout, logoutAll } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleLogoutAll = async () => {
    await logoutAll();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-indigo-500/30">
      <nav className="fixed top-0 w-full z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-8 h-8 text-indigo-500" />
              <span className="text-xl font-bold bg-clip-text text-transparent bg-linear-to-r from-indigo-400 to-cyan-400">
                SecureApp
              </span>
            </div>
            
            {user && (
              <div className="flex items-center gap-4">
                <span className="text-sm text-slate-400 hidden sm:block">
                  Welcome, <span className="text-white font-medium">{user.name}</span>
                </span>
                
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-all duration-200"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
                
                <button
                  onClick={handleLogoutAll}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-400 hover:text-red-300 bg-red-400/10 hover:bg-red-400/20 border border-red-400/20 hover:border-red-400/30 rounded-lg transition-all duration-200"
                  title="Logout from all devices"
                >
                  <MonitorSmartphone className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout All</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>
      
      <main className="pt-16 min-h-screen flex flex-col">
        <div className="grow flex flex-col w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
