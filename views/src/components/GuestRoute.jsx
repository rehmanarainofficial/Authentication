import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/useAuth";

const GuestRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen w-full bg-slate-900 text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return user ? <Navigate to="/" replace /> : <Outlet />;
};

export default GuestRoute;
