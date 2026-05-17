import {
  Bot,
  Bell,
  Brain,
  ChevronDown,
  ClipboardList,
  FileText,
  LogOut,
  Megaphone,
  MessageSquare,
  ChartColumn,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  ShoppingBag,
  Sparkles,
  Users,
  X
} from "lucide-react";

export const navGroups = [
  { id: "operations", label: "Vận hành", items: [
    { id: "messages", label: "Tin nhắn", icon: MessageSquare, permission: "messages.view" },
    { id: "orders", label: "Đơn hàng", icon: ShoppingBag, permission: "orders.view" },
    { id: "reports", label: "Báo cáo", icon: ChartColumn, permission: "reports.view" },
    { id: "contexts", label: "Ngữ cảnh", icon: Brain, permission: "contexts.view" }
  ]},
  { id: "configuration", label: "Cấu hình bot", items: [
    { id: "bots", label: "Page bot", icon: Bot, permission: "pages.manage" },
    { id: "companies", label: "Công ty", icon: Settings, permission: "companies.manage" },
    { id: "consultation-scripts", label: "Kịch bản tư vấn", icon: ClipboardList, permission: "scripts.manage" },
    { id: "promotions", label: "Khuyến mãi", icon: Megaphone, permission: "promotions.manage" },
    { id: "faqs", label: "FAQ theo page", icon: FileText, permission: "faqs.view" },
    { id: "rules", label: "Quy tắc", icon: FileText, permission: "rules.manage" }
  ]},
  { id: "testing", label: "Kiểm thử", items: [
    { id: "simulator", label: "Giả lập BOT", icon: Sparkles, permission: "simulator.use" },
    { id: "test-bot", label: "Test BOT", icon: Bot, permission: "simulator.use" }
  ]},
  { id: "system", label: "Hệ thống", items: [
    { id: "users", label: "Tài khoản", icon: Users, permission: "users.manage" },
    { id: "roles", label: "Vai trò", icon: Settings, permission: "roles.manage" },
    { id: "settings", label: "Cấu hình hệ thống", icon: Settings, permission: "settings.manage" }
  ]}
];

export const validTabs = new Set(navGroups.flatMap((group) => group.items.map((item) => item.id)));

export function MobileNavigation({ authUser, tab, open, showHeader = true, variant = "v1", onOpenChange, onNavigate, onLogout }) {
  const visibleGroups = getVisibleNavGroups(authUser);
  return (
    <>
      {showHeader && (
        <header className="mobile-header">
          <Brand />
          <div className="mobile-header-actions">
            <button className="mobile-header-icon-button" aria-label="Thông báo">
              <Bell size={18} />
              <span />
            </button>
            <span className="sidebar-user-avatar">{authUser?.username?.slice(0, 1).toUpperCase() || "A"}</span>
          </div>
        </header>
      )}
      {open && <button className="mobile-drawer-backdrop" onClick={() => onOpenChange(false)} />}
      <nav className={`mobile-drawer ${open ? "open" : ""}`}>
        <div className="mobile-drawer-header">
          <Brand />
          <button onClick={() => onOpenChange(false)} aria-label="Đóng menu"><X size={18} /></button>
        </div>
        <div className="mobile-drawer-sections">
          {visibleGroups.map((group) => (
            <section key={group.id}>
              <span>{group.label}</span>
              <div>{group.items.map(({ id, label, icon: Icon }) => (
                <button key={id} className={tab === id ? "active" : ""} onClick={() => onNavigate(id)}><Icon size={17} />{label}</button>
              ))}</div>
            </section>
          ))}
        </div>
        <div className="mobile-drawer-user">
          <span className="sidebar-user-avatar">{authUser?.username?.slice(0, 1).toUpperCase() || "A"}</span>
          <div>
            <strong>{authUser?.fullName || authUser?.username || "Tài khoản"}</strong>
            <small>{authUser?.roleName || "Người dùng hệ thống"}</small>
          </div>
          <button className="mobile-logout" onClick={onLogout} aria-label="Đăng xuất">
            <LogOut size={17} />
          </button>
        </div>
      </nav>
      {variant === "v2" ? (
        <nav className="mobile-bottom-nav-v2">
          <V2NavButton active={tab === "messages"} onClick={() => onNavigate("messages")} icon={MessageSquare} label="Tin nhắn" />
          <V2NavButton active={tab === "orders"} onClick={() => onNavigate("orders")} icon={ShoppingBag} label="Đơn hàng" />
          <button className="mobile-nav-v2-center" onClick={() => onOpenChange(!open)} aria-label={open ? "Đóng menu" : "Mở menu"}>
            {open ? <X size={28} /> : <PlusIcon />}
          </button>
          <V2NavButton active={tab === "reports"} onClick={() => onNavigate("reports")} icon={ChartColumn} label="Báo cáo" />
          <V2NavButton active={tab === "settings"} onClick={() => onNavigate("settings")} icon={Settings} label="Cài đặt" />
        </nav>
      ) : (
        <nav className="mobile-bottom-nav">
          <BottomNavButton active={tab === "messages"} onClick={() => onNavigate("messages")} icon={MessageSquare} label="Tin nhắn" />
          <BottomNavButton active={tab === "orders"} onClick={() => onNavigate("orders")} icon={ShoppingBag} label="Đơn hàng" />
          <BottomNavButton active={tab === "settings"} onClick={() => onNavigate("settings")} icon={Settings} label="Cài đặt" />
          <BottomNavButton onClick={() => onOpenChange(true)} icon={PanelLeftOpen} label="Menu" />
        </nav>
      )}
    </>
  );
}

export function DesktopSidebar({ authUser, collapsed, openGroups, tab, onCollapseToggle, onGroupToggle, onNavigate, onLogout }) {
  const visibleGroups = getVisibleNavGroups(authUser);
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="brand-block">
          <div className="brand-mark"><Sparkles size={18} /></div>
          {!collapsed && <div><div className="brand">Bot Manager</div><div className="brand-subtitle">Messenger operations</div></div>}
        </div>
        <button className="sidebar-toggle" onClick={onCollapseToggle} aria-label={collapsed ? "Mở rộng menu" : "Thu gọn menu"}>
          {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>
      <nav className="grouped-nav">
        {visibleGroups.map((group) => (
          <section key={group.id} className="nav-group">
            {!collapsed && <button className="nav-group-toggle" onClick={() => onGroupToggle(group.id)}><span>{group.label}</span><ChevronDown className={openGroups[group.id] ? "open" : ""} size={16} /></button>}
            {(collapsed || openGroups[group.id]) && <div className="nav-group-items">{group.items.map(({ id, label, icon: Icon }) => (
              <button key={id} className={tab === id ? "active" : ""} onClick={() => onNavigate(id)} title={collapsed ? label : undefined}><Icon size={18} />{!collapsed && label}</button>
            ))}</div>}
          </section>
        ))}
      </nav>
      <div className="sidebar-user">
        <span className="sidebar-user-avatar">{authUser?.username?.slice(0, 1).toUpperCase() || "A"}</span>
        {!collapsed && <div className="sidebar-user-info"><strong>{authUser?.fullName || authUser?.username || "Admin"}</strong><small>{authUser?.roleName || "Tài khoản"}</small></div>}
        <button onClick={onLogout} title="Đăng xuất"><LogOut size={16} /></button>
      </div>
    </aside>
  );
}

function getVisibleNavGroups(authUser) {
  return navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.permission || authUser?.superAdmin || authUser?.permissions?.includes(item.permission))
    }))
    .filter((group) => group.items.length > 0);
}

function Brand() {
  return <div className="brand-block"><div className="brand-mark"><Sparkles size={18} /></div><div><div className="brand">Bot Manager</div><div className="brand-subtitle">Messenger operations</div></div></div>;
}

function BottomNavButton({ active = false, onClick, icon: Icon, label }) {
  return <button className={active ? "active" : ""} onClick={onClick}><Icon size={18} /><span>{label}</span></button>;
}

function V2NavButton({ active = false, onClick, icon: Icon, label }) {
  return <button className={active ? "active" : ""} onClick={onClick} aria-label={label}><Icon size={24} /></button>;
}

function PlusIcon() {
  return <span className="mobile-nav-v2-plus">+</span>;
}
