import { memo } from "react";
import ProtectedSection from "./ProtectedSection";
import { usePermission } from "../../hooks/usePermission";

const MenuPermissionWrapper = memo(({ menu, subMenu, action, fallback = null, children }) => {
  const allowed = usePermission(menu, subMenu, action);
  return allowed ? children : fallback;
});

const PermissionWrapper = memo(({ menu, subMenu, action, resource, fallback = null, children }) => {
  if (resource) {
    return <ProtectedSection resource={resource} action={action || "get"} fallback={fallback}>{children}</ProtectedSection>;
  }
  return <MenuPermissionWrapper menu={menu} subMenu={subMenu} action={action} fallback={fallback}>{children}</MenuPermissionWrapper>;
});

PermissionWrapper.displayName = "PermissionWrapper";
export default PermissionWrapper;
