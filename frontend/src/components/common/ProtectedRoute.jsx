import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { usePermission } from "../../hooks/usePermission";

export default function ProtectedRoute({ menu, subMenu, action, children, redirectTo = "/403" }) {
  const location = useLocation();
  const { userData } = useSelector((state) => state.auth);
  const hasAccess = usePermission(menu, subMenu, action);
  if (!userData?.id) return <Navigate to="/auth" state={{ from: location }} replace />;
  if (!hasAccess) return <Navigate to={redirectTo} replace />;
  return children;
}
