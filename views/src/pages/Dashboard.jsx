import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { axiosClient } from "../api/axiosClient";
import { useAuth } from "../context/useAuth";
import {
  Activity,
  AlertCircle,
  Clock,
  Laptop,
  Lock,
  Mail,
  MapPin,
  Shield,
  ShieldCheck,
  LogOut,
} from "lucide-react";

const getDeviceName = (userAgent = "") => {
  if (!userAgent) return "Unknown device";
  if (/android/i.test(userAgent)) return "Android device";
  if (/iphone|ipad|ipod/i.test(userAgent)) return "iPhone / iPad";
  if (/windows/i.test(userAgent)) return "Windows device";
  if (/mac os/i.test(userAgent)) return "Mac device";
  if (/linux/i.test(userAgent)) return "Linux device";
  return "Browser session";
};

const formatDateTime = (value) => {
  if (!value) return "Not available";

  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const Dashboard = () => {
  const { user, logout, sessionEventsVersion } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState("");
  const [loggingOutSessionId, setLoggingOutSessionId] = useState(null);
  const userId = user?._id || user?.id || "Not available";
  const accountCreatedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Not available";

  useEffect(() => {
    if (!user) return;

    let isCurrent = true;

    const fetchSessions = async () => {
      try {
        setSessionsLoading(true);
        setSessionsError("");
        const response = await axiosClient.get("/user/sessions");
        if (!isCurrent) return;
        setSessions(response.data.data.sessions);
      } catch {
        if (!isCurrent) return;
        setSessionsError("Active sessions load nahi ho sakin.");
      } finally {
        if (isCurrent) {
          setSessionsLoading(false);
        }
      }
    };

    fetchSessions();

    return () => {
      isCurrent = false;
    };
  }, [user, sessionEventsVersion]);

  const handleLogoutSession = async (session) => {
    try {
      setLoggingOutSessionId(session.id);
      await axiosClient.delete(`/user/sessions/${session.id}`);

      if (session.isCurrent) {
        await logout();
        navigate("/login", { replace: true });
        return;
      }

      setSessions((currentSessions) =>
        currentSessions.filter((currentSession) => currentSession.id !== session.id),
      );
    } catch {
      setSessionsError("Session logout nahi ho saka. Dobara try karein.");
    } finally {
      setLoggingOutSessionId(null);
    }
  };

  if (!user) return null;

  return (
    <div className="grow flex flex-col gap-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Dashboard Overview</h1>
          <p className="text-slate-400 mt-1">Manage your account and view security status</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="col-span-1 md:col-span-2 bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-800 overflow-hidden relative shadow-lg">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
          
          <div className="p-8 relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-8">
            <div className="w-32 h-32 rounded-full bg-linear-to-br from-indigo-500 to-purple-600 p-1 shrink-0 shadow-xl shadow-indigo-500/20">
              <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center border-4 border-slate-900">
                <span className="text-5xl font-bold text-white uppercase">
                  {user.name.charAt(0)}
                </span>
              </div>
            </div>
            
            <div className="grow text-center sm:text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold mb-3 border border-emerald-500/20">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                Active Session
              </div>
              
              <h2 className="text-3xl font-bold text-white mb-1">{user.name}</h2>
              
              <div className="flex flex-col gap-3 mt-6">
                <div className="flex items-center justify-center sm:justify-start gap-3 text-slate-300 bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                  <Mail className="w-5 h-5 text-indigo-400" />
                  <span>{user.email}</span>
                </div>
                
                <div className="flex items-center justify-center sm:justify-start gap-3 text-slate-300 bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                  <Shield className="w-5 h-5 text-indigo-400" />
                  <span>User ID: <span className="text-slate-400 text-sm font-mono">{userId}</span></span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Security Status */}
        <div className="bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-800 p-8 shadow-lg flex flex-col relative overflow-hidden">
          <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl"></div>
          
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            Security Status
          </h3>
          
          <div className="flex flex-col gap-4 grow">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Authentication</p>
                <p className="text-xs text-slate-400 mt-0.5">JWT Tokens active</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Connection</p>
                <p className="text-xs text-slate-400 mt-0.5">Secure cookie storage</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 mt-auto pt-4 border-t border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 text-slate-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Account Created</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {accountCreatedDate}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-800 p-6 sm:p-8 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Laptop className="w-5 h-5 text-cyan-400" />
              Active Logins
            </h3>
            <p className="text-sm text-slate-400 mt-1">
              Yeh account abhi {sessions.length} {sessions.length === 1 ? "jaga" : "jagon"} par login hai
            </p>
          </div>
          <div className="px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-sm font-semibold w-fit">
            Total: {sessions.length}
          </div>
        </div>

        {sessionsLoading ? (
          <div className="flex items-center justify-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-cyan-500"></div>
          </div>
        ) : sessionsError ? (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm">{sessionsError}</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 text-sm text-slate-400">
            Koi active login session nahi mila.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="rounded-2xl border border-slate-700/50 bg-slate-950/40 p-5 flex flex-col gap-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-cyan-500/10 flex items-center justify-center shrink-0">
                      <Laptop className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {getDeviceName(session.userAgent)}
                      </p>
                      <p className="text-xs text-slate-500 truncate">{session.userAgent}</p>
                    </div>
                  </div>

                  {session.isCurrent && (
                    <span className="shrink-0 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300">
                      Current
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                  <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-3">
                    <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                      <MapPin className="w-4 h-4" />
                      IP Address
                    </div>
                    <p className="text-slate-200 break-all">{session.ip}</p>
                  </div>

                  <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-3">
                    <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                      <Clock className="w-4 h-4" />
                      Last Active
                    </div>
                    <p className="text-slate-200">{formatDateTime(session.updatedAt)}</p>
                  </div>

                  <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-3">
                    <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                      <ShieldCheck className="w-4 h-4" />
                      Expires
                    </div>
                    <p className="text-slate-200">{formatDateTime(session.expiresAt)}</p>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => handleLogoutSession(session)}
                    disabled={loggingOutSessionId === session.id}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <LogOut className="w-4 h-4" />
                    {loggingOutSessionId === session.id ? "Logging out..." : "Logout this session"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
