/**
 * PageMaker Component — Refactored
 *
 * CHANGES:
 * - Replaced useModal() Context with Redux hooks (useUI, useAuth)
 * - openModal/modalContent now come from Redux store via useUI
 * - clientDetails come from useAuth hook
 * - Extracted filter rendering and action rendering into sub-components
 * - Breadcrumb rendering extracted to a reusable function
 * - Wrapped in React.memo for performance
 *
 * Same visual behavior and layout as before.
 */
import React, { memo, useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { PlusIcon } from "../assets/data/icons";
import useAuth from "../hooks/useAuth";
import useUI from "../hooks/useUI";
import { CustomDatePicker } from "./common";
import SelectFilter from "./common/SelectFilter/SelectFilter";
import { Menu, X, ArrowLeft } from "lucide-react";

import { parsePermissions, hasResourcePermission, hasSubMenuAccess } from "../utils/permissionParser";
import { NAV_PERMISSION_REQUIREMENTS } from "../utils/permissionRegistry";
import Forbidden from "../pages/Forbidden";
import { useApiQuery } from "../hooks/useApiQuery";
import { endpoints } from "../services/endpoints";

const PageMaker = ({ basePath, menu }) => {
  const location = useLocation();
  const navigate = useNavigate();
  // Redux hooks replace useModal() Context API
  const { openModal, modalContent } = useUI();
  const { clientDetails, userData, permissions, isSuperUser } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const today = React.useMemo(() => new Date().toISOString().split("T")[0], []);
  const [filters, setFilters] = useState({ date: today });

  const isDetailPage = location.pathname !== basePath && location.pathname !== `${basePath}/` && location.pathname.startsWith(basePath);
  const detailUser = location.state?.user;
  const pathUserId = location.pathname.split("/").filter(Boolean).pop();
  const isPermissionDashboard = location.pathname.includes("/access-list") || location.pathname.includes("/manage-roles") || location.pathname.includes("/PermissionDashboard");

  // Fetch users list when on permission dashboard to show actual name+code (fallback when state not passed)
  const { data: usersData } = useApiQuery(
    ["page-users-lookup", isPermissionDashboard ? "active" : "skip"],
    isPermissionDashboard ? `${endpoints.users}?limit=10&page=1&noPagination=false&role=true&isActive=true` : null,
    { enabled: !!isPermissionDashboard }
  );
  const isManageRolesPage = location.pathname.includes("/manage-roles");
  const { data: roleData } = useApiQuery(
    ["page-role-lookup", isManageRolesPage ? "active" : "skip"],
    isManageRolesPage ? `${endpoints.roleList({ noPagination: true })}` : null,
    { enabled: !!isManageRolesPage }
  );
  const fetchedUsers = usersData?.data?.results || usersData?.results || usersData?.data || [];
  const matchedUser = React.useMemo(() => {
    if (!isPermissionDashboard || !pathUserId) return null;
    const list = Array.isArray(fetchedUsers) ? fetchedUsers : [];
    return list.find((u) => String(u.id) === String(pathUserId) || String(u._id) === String(pathUserId)) || null;
  }, [isPermissionDashboard, pathUserId, fetchedUsers]);
  const displayUser = detailUser || matchedUser;
  const roleResults = roleData?.data?.results || roleData?.results || roleData?.data || [];
  const matchedRole = Array.isArray(roleResults)
    ? roleResults.find((role) => String(role.id || role._id) === String(pathUserId))
    : null;
  const displayName = isManageRolesPage
    ? matchedRole?.displayName || matchedRole?.name || matchedRole?.subCategory || null
    : displayUser?.name || matchedUser?.name || null;
  const displayCode = displayUser?.employeeCode ?? matchedUser?.employeeCode ?? null;

  // Filter secondary menu items based on permissions — memoized to prevent churn
  const effectiveSuper = isSuperUser || (Array.isArray(permissions) && permissions.includes("*"));
  const permissionMap = React.useMemo(() => parsePermissions(permissions), [permissions]);

  const filteredMenu = React.useMemo(() => {
    if (!menu) return [];
    return menu.map((section) => {
      const allowedMenuItems = (section.menu || [])
        .map((item) => {
          // If item has subMenu array
          if (item.subMenu && Array.isArray(item.subMenu)) {
            const allowedSubMenu = item.subMenu.filter((sub) => {
              // direct menu/subMenu check first (handles backend names like "Profit and Loss" vs "accountincome")
              if (hasSubMenuAccess(permissionMap, section.header || basePath, sub.name, "get", effectiveSuper)) return true;
              const fullPath = `${basePath}${sub.path}`;
              const req = NAV_PERMISSION_REQUIREMENTS[fullPath];
              if (!req) return false;
              if (hasResourcePermission(permissionMap, req.resource, req.action, effectiveSuper)) return true;
              if (hasResourcePermission(permissionMap, req.resource, null, effectiveSuper)) return true;
              return false;
            });
            if (allowedSubMenu.length === 0) return null;
            return { ...item, subMenu: allowedSubMenu };
          }

          // Single menu item without subMenu
          const fullPath = `${basePath}${item.path}`;
          if (hasSubMenuAccess(permissionMap, section.header || basePath, item.name, "get", effectiveSuper)) return item;
          const req = NAV_PERMISSION_REQUIREMENTS[fullPath];
          if (!req) return null;
          if (hasResourcePermission(permissionMap, req.resource, req.action, effectiveSuper)) return item;
          if (hasResourcePermission(permissionMap, req.resource, null, effectiveSuper)) return item;
          return null;
        })
        .filter(Boolean);

      return { ...section, menu: allowedMenuItems };
    }).filter((section) => section.menu && section.menu.length > 0);
  }, [menu, basePath, permissionMap, effectiveSuper]);

  // Logic to find active menu item even if it's inside a subMenu
  const activeMenu = filteredMenu?.find((section) =>
    section.menu.some((item) => {
      const itemPath = `${basePath}${item.path}`;
      const isExactMatch = itemPath === location.pathname;
      const isNestedMatch = location.pathname.startsWith(`${itemPath}/`);
      const hasNestedSubMenuMatch = item.subMenu?.some(
        (sub) => `${basePath}${sub.path}` === location.pathname
      );
      return isExactMatch || isNestedMatch || hasNestedSubMenuMatch;
    })
  );

  const activeMenuItem = activeMenu?.menu.find((item) => {
    const itemPath = `${basePath}${item.path}`;
    const isExactMatch = itemPath === location.pathname;
    const isNestedMatch = location.pathname.startsWith(`${itemPath}/`);
    const hasNestedSubMenuMatch = item.subMenu?.some(
      (sub) => `${basePath}${sub.path}` === location.pathname
    );
    return isExactMatch || isNestedMatch || hasNestedSubMenuMatch;
  });

  // Specifically find the sub-item if we are on a sub-route
  const activeSubItem = activeMenuItem?.subMenu?.find(
    (sub) => `${basePath}${sub.path}` === location.pathname
  );

  const isActivePath = (itemPath) =>
    location.pathname === itemPath || location.pathname.startsWith(`${itemPath}/`);

  // Only apply defaultFilters when active menu item identity changes (path), not on every object churn
  const activePathKey = activeMenuItem?.path || "";
  useEffect(() => {
    if (activeMenuItem?.defaultFilters) {
      setFilters((prev) => ({
        ...prev,
        ...activeMenuItem.defaultFilters,
      }));
    }
  }, [activePathKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Redirect from basePath to first tab — only once per basePath/ menu shape
  const firstTabPath = menu?.[0]?.menu?.[0]?.path || "";
  useEffect(() => {
    if (location.pathname === basePath && firstTabPath) {
      navigate(`${basePath}${firstTabPath}`, { replace: true });
    }
  }, [location.pathname, basePath, firstTabPath, navigate]);

  // Forbidden handling after hooks: show 403 instead of white blank page when no menu is visible
  if (filteredMenu.length === 0) {
    return <Forbidden code={403} resource={basePath} message={`You don't have permission to view ${basePath}. Contact admin.`} />;
  }

  const handleNavClick = (path) => {
    navigate(`${basePath}${path}`);
  };

  const handleFilterChange = (filterKey, value) => {
    setFilters((prev) => ({ ...prev, [filterKey]: value }));
  };

  const renderAction = (ActionComponent, replace, pathname) => {
    if (pathname) {
      navigate(`${location.pathname}${pathname}`);
    } else {
      openModal(ActionComponent);
    }
  };
  const renderBreadcrumb = () => {
    const segments = location.pathname.split("/").filter(Boolean);

    return segments.map((segment, index) => {
      const isLast = index === segments.length - 1;
      const isClientIdSegment =
        index === segments.length - 1 && location.state?.name;
      const displaySegment = isClientIdSegment
        ? clientDetails.name
        : segment
          .replace("-", " ")
          .replace(/\b\w/g, (char) => char.toUpperCase());

      const path = `/${segments.slice(0, index + 1).join("/")}`;

      return (
        <span key={index}>
          {index > 0 && " / "}
          <span
            className={`cursor-pointer hover:underline ${isLast ? "font-bold" : ""
              }`}
            onClick={() => navigate(path, { state: location.state })}
          >
            {displaySegment}
          </span>
        </span>
      );
    });
  };

  // Get active filters for the current menu item
  const getActiveFilters = () => {
    if (!activeMenuItem?.filters) return {};

    const activeFilters = activeMenuItem.filters.reduce((acc, filter) => {
      acc[filter.key] = filters?.[filter.key] || "";
      return acc;
    }, {});
    activeFilters.date = filters.date;

    return activeFilters;
  };

  const activeFilters = getActiveFilters();

  return (
    <div className="w-full h-full relative">
      <div className="sticky top-16 left-0 right-0 z-[100] bg-primary">
        {/* Mobile/Tablet Layout - Date and Label only */}
        <div className="lg:hidden py-3 px-3">
          <div className="flex justify-between items-center text-white mb-3">
            <CustomDatePicker
              onChange={(value) => {
                handleFilterChange("date", value);
              }}
              value={filters.date || ""}
              compact
            />
            <span className="text-sm font-sans font-bold">
              {activeMenu ? (
                <>
                  {activeMenu.header}:{" "}
                  <span className="font-normal">
                    {activeMenuItem?.name || "N/A"}
                  </span>
                </>
              ) : (
                renderBreadcrumb()
              )}
            </span>
          </div>
          {/* Filters for Mobile */}
          {activeMenuItem?.filters && activeMenuItem.filters.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {activeMenuItem.filters.map((filter, index) => (
                <div
                  key={`filter-${index}`}
                  className="relative flex-1 min-w-[120px]"
                >
                  {filter.component ? (
                    typeof filter.component === "function" ? (
                      <filter.component
                        value={activeFilters[filter.key] || []}
                        onChange={(value) =>
                          handleFilterChange(filter.key, value)
                        }
                      />
                    ) : (
                      React.cloneElement(filter.component, {
                        value: activeFilters[filter.key] || [],
                        onChange: (value) =>
                          handleFilterChange(filter.key, value),
                      })
                    )
                  ) : (
                    <SelectFilter
                      options={filter.options}
                      value={activeFilters[filter.key]}
                      onChange={(value) => handleFilterChange(filter.key, value)}
                      placeholder={filter.label}
                      className="min-w-32"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
          {/* Actions for Mobile */}
          {activeMenuItem?.actions && activeMenuItem.actions.length > 0 && (
            <div className="flex gap-2 mt-3">
              {activeMenuItem.actions.map((action, index) => (
                <button
                  key={`action-${index}`}
                  className="text-white font-medium py-2 px-3 flex items-center gap-1 rounded border border-white/30 hover:bg-white/10 transition-colors text-xs"
                  onClick={() =>
                    renderAction(
                      action.component,
                      action.replace,
                      action.pathname
                    )
                  }
                >
                  {action.label && <PlusIcon />}
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Desktop Layout - Full layout with sub-navigation */}
        <div className="hidden lg:flex justify-between text-white py-1.5 px-2">
          {/* Left Section - DatePicker and Filters */}
          <div className="flex flex-col items-start gap-6">
            <CustomDatePicker
              onChange={(value) => handleFilterChange("date", value)}
              value={filters.date || ""}
              compact
            />
            <div className="flex gap-4">
              {activeMenuItem?.filters?.map((filter, index) => (
                <div key={`filter-${index}`} className="relative">
                  {filter.component ? (
                    typeof filter.component === "function" ? (
                      <filter.component
                        value={filters[filter.key] || []}
                        onChange={(value) =>
                          handleFilterChange(filter.key, value)
                        }
                      />
                    ) : (
                      React.cloneElement(filter.component, {
                        value: filters[filter.key] || [],
                        onChange: (value) =>
                          handleFilterChange(filter.key, value),
                      })
                    )
                  ) : (
                    <SelectFilter
                      options={filter.options}
                      value={filters[filter.key] || ""}
                      onChange={(value) => handleFilterChange(filter.key, value)}
                      placeholder={filter.label}
                      className="min-w-32"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Center Section */}
          <div className="flex flex-col items-center gap-1 flex-1 min-w-0 px-2">
            <span className="text-lg font-sans font-bold text-start w-full whitespace-nowrap flex items-center gap-2">
              {/* {isDetailPage && (
                <button
                  type="button"
                  onClick={() => navigate("/dashboard/user-management/users")}
                  aria-label="Go back"
                  className="p-1.5 rounded hover:bg-white/20 transition-colors shrink-0"
                >
                  <ArrowLeft size={16} />
                </button>
              )} */}
              {activeMenu ? (
                <>
                  {activeMenu.header}:{" "}
                  <span className="text-white font-normal">
                    {activeSubItem?.name || activeMenuItem?.name || "N/A"}
                  </span>
                  {isDetailPage && displayName && (
                    <span className="ml-2 text-xs opacity-80" style={{ fontFamily: "'Poppins', sans-serif" }}>
                      — <span className="font-bold">{displayName}</span>
                      {displayCode && <span className="font-normal"> ({displayCode})</span>}
                    </span>
                  )}
                </>
              ) : isPermissionDashboard ? (
                <span className="text-white font-normal flex items-center gap-1" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  {displayName ? (
                    <>
                      <span className="font-bold">{displayName}</span>
                      {displayCode && <span className="font-normal opacity-80">({displayCode})</span>}
                    </>
                  ) : (
                    pathUserId || "User"
                  )}
                </span>
              ) : (
                "Navigation"
              )}
            </span>

            {/* Check if menu has many items (>10) - use hamburger for large menus like Utilities */}
            {filteredMenu?.[0]?.menu?.length > 10 ? (
              <>
                {/* Desktop nav for large menus - visible on 2xl screens */}
                <div className="hidden 2xl:flex gap-1 mt-1 items-center flex-wrap justify-center">
                  {filteredMenu[0]?.menu.map((item, index) => (
                    <div
                      key={index}
                      className="group relative flex items-center h-full"
                    >
                      {item.subMenu ? (
                        <div className="relative group flex items-center">
                          <span
                            className={`text-[10px] cursor-pointer px-1 flex items-center gap-1 whitespace-nowrap ${index !== 0 ? "border-l border-gray-400" : ""
                              } ${isActivePath(`${basePath}${item.path}`)
                                ? "font-bold"
                                : ""
                              }`}
                          >
                            {item.name} ▾
                          </span>

                          <div className="absolute top-full left-0 w-full h-3 bg-transparent hidden group-hover:block" />

                          <div className="absolute left-0 top-[calc(100%+8px)] hidden group-hover:block z-[60]">
                            <div className="bg-white text-black shadow-xl rounded-md py-3 min-w-[220px] border border-gray-200">
                              {item.subMenu.map((sub) => (
                                <div
                                  key={sub.path}
                                  className="px-5 py-3 hover:bg-gray-100 text-sm cursor-pointer transition-colors whitespace-nowrap border-b border-gray-50 last:border-none"
                                  onClick={() => handleNavClick(sub.path)}
                                >
                                  {sub.name}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span
                          className={`text-[10px] cursor-pointer hover:underline flex items-center whitespace-nowrap ${index !== 0 ? "border-l border-gray-400 px-1" : ""
                            } ${isActivePath(`${basePath}${item.path}`)
                              ? "font-bold"
                              : ""
                            }`}
                          onClick={() => handleNavClick(item.path)}
                        >
                          {item.name}
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Hamburger menu for large menus - visible below 2xl screens */}
                <div className="2xl:hidden relative">
                  <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded border border-white/30 hover:bg-white/10 transition-colors"
                  >
                    {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
                    <span className="text-xs">Menu</span>
                  </button>

                  {/* Grid menu */}
                  {isMobileMenuOpen && (
                    <>
                      {/* Backdrop */}
                      <div
                        className="fixed inset-0 z-[55]"
                        onClick={() => setIsMobileMenuOpen(false)}
                      />
                      {/* Menu - Grid Layout */}
                      <div className="absolute left-1/2 -translate-x-1/2 top-[calc(100%+8px)] z-[60] bg-white text-black shadow-xl rounded-xl p-4 border border-gray-200 w-[90vw] max-w-[700px]">
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {filteredMenu[0]?.menu.map((item, index) => (
                            <React.Fragment key={index}>
                              {item.subMenu ? (
                                <>
                                  <div className="col-span-3 sm:col-span-4 mt-2 first:mt-0">
                                    <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide px-1 mb-1">
                                      {item.name}
                                    </div>
                                  </div>
                                  {item.subMenu.map((sub) => (
                                    <div
                                      key={sub.path}
                                      className={`px-3 py-2.5 rounded-lg text-xs text-center cursor-pointer transition-all border hover:shadow-sm ${
                                        isActivePath(`${basePath}${sub.path}`)
                                          ? "bg-primary/10 border-primary/30 font-semibold text-primary"
                                          : "bg-gray-50 border-gray-100 text-gray-700 hover:bg-gray-100 hover:border-gray-200"
                                        }`}
                                      onClick={() => {
                                        handleNavClick(sub.path);
                                        setIsMobileMenuOpen(false);
                                      }}
                                    >
                                      {sub.name}
                                    </div>
                                  ))}
                                </>
                              ) : (
                                <div
                                  className={`px-3 py-2.5 rounded-lg text-xs text-center cursor-pointer transition-all border hover:shadow-sm ${
                                    isActivePath(`${basePath}${item.path}`)
                                      ? "bg-primary/10 border-primary/30 font-semibold text-primary"
                                      : "bg-gray-50 border-gray-100 text-gray-700 hover:bg-gray-100 hover:border-gray-200"
                                    }`}
                                  onClick={() => {
                                    handleNavClick(item.path);
                                    setIsMobileMenuOpen(false);
                                  }}
                                >
                                  {item.name}
                                </div>
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              /* Normal horizontal nav for smaller menus */
              <div className="flex gap-2 mt-1 items-center">
                {filteredMenu[0]?.menu.map((item, index) => (
                  <div
                    key={index}
                    className="group relative flex items-center h-full"
                  >
                    {item.subMenu ? (
                      <div className="relative group flex items-center">
                        <span
                          className={`text-xs cursor-pointer px-2 flex items-center gap-1 ${index !== 0 ? "border-l border-gray-400" : ""
                            } ${isActivePath(`${basePath}${item.path}`)
                              ? "font-bold"
                              : ""
                            }`}
                        >
                          {item.name} ▾
                        </span>

                        <div className="absolute top-full left-0 w-full h-3 bg-transparent hidden group-hover:block" />

                        <div className="absolute left-0 top-[calc(100%+8px)] hidden group-hover:block z-[60]">
                          <div className="bg-white text-black shadow-xl rounded-md py-3 min-w-[220px] border border-gray-200">
                            {item.subMenu.map((sub) => (
                              <div
                                key={sub.path}
                                className="px-5 py-3 hover:bg-gray-100 text-sm cursor-pointer transition-colors whitespace-nowrap border-b border-gray-50 last:border-none"
                                onClick={() => handleNavClick(sub.path)}
                              >
                                {sub.name}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <span
                        className={`text-xs cursor-pointer hover:underline flex items-center ${index !== 0 ? "border-l border-gray-400 px-2" : ""
                          } ${isActivePath(`${basePath}${item.path}`)
                            ? "font-bold"
                            : ""
                          }`}
                        onClick={() => handleNavClick(item.path)}
                      >
                        {item.name}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Section */}
          <div className="flex flex-col items-end gap-1 mr-4">
            <div className="flex gap-2 mb-1 text-xs">
              {activeMenuItem?.actions?.map((action, index) => (
                <button
                  key={`action-${index}`}
                  className="text-white font-medium py-2 px-2 flex items-center gap-1 rounded hover:bg-primary-600 transition-colors"
                  onClick={() =>
                    renderAction(
                      action.component,
                      action.replace,
                      action.pathname
                    )
                  }
                >
                  {action.label && <PlusIcon />}
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="w-full flex flex-col items-center justify-center pt-1">
        <Outlet context={{ filters, setFilters, handleFilterChange }} />
        {modalContent}
      </div>
    </div>
  );
};

export default memo(PageMaker);
