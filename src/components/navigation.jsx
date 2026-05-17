import {
  Bot,
  Brain,
  ChevronDown,
  ClipboardList,
  FileText,
  LogOut,
  Megaphone,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  ShoppingBag,
  Sparkles,
  X
} from "lucide-react";

export const navGroups = [
  { id: "operations", label: "Vận hành", items: [
    { id: "messages", label: "Tin nhắn", icon: MessageSquare },
    { id: "orders", label: "Đơn hàng", icon: ShoppingBag },
    { id: "contexts", label: "Ngữ cảnh", icon: Brain }
  ]},
  { id: "configuration", label: "Cấu hình bot", items: [
    { id: "bots", label: "Page bot", icon: Bot },
    { id: "companies", label: "Công ty", icon: Settings },
    { id: "consultation-scripts", label: "Kịch bản tư vấn", icon: ClipboardList },
    { id: "promotions", label: "Khuyến mãi", icon: Megaphone },
    { id: "faqs", label: "FAQ theo page", icon: FileText },
    { id: "rules", label: "Quy tắc", icon: FileText }
  ]},
  { id: "testing", label: "Kiểm thử", items: [
    { id: "simulator", label: "Giả lập BOT", icon: Sparkles },
    { id: "test-bot", label: "Test BOT", icon: Bot }
  ]},
  { id: "system", label: "Hệ thống", items: [{ id: "settings", label: "Cấu hình hệ thống", icon: Settings }] }
];

export const validTabs = new Set(navGroups.flatMap((group) => group.items.map((item) => item.id)));

export function MobileNavigation({ authUser, tab, open, showHeader = true, onOpenChange, onNavigate, onLogout }) {
  return (
    <>
      {showHeader && (
        <header className="mobile-header">
          <Brand />
          <div className="mobile-header-actions">
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
        {navGroups.map((group) => (
          <section key={group.id}>
            <span>{group.label}</span>
            <div>{group.items.map(({ id, label, icon: Icon }) => (
              <button key={id} className={tab === id ? "active" : ""} onClick={() => onNavigate(id)}><Icon size={17} />{label}</button>
            ))}</div>
          </section>
        ))}
        <button className="mobile-logout" onClick={onLogout}><LogOut size={17} />Đăng xuất</button>
      </nav>
      <nav className="mobile-bottom-nav">
        <BottomNavButton active={tab === "messages"} onClick={() => onNavigate("messages")} icon={MessageSquare} label="Tin nhắn" />
        <BottomNavButton active={tab === "orders"} onClick={() => onNavigate("orders")} icon={ShoppingBag} label="Đơn hàng" />
        <BottomNavButton active={tab === "settings"} onClick={() => onNavigate("settings")} icon={Settings} label="Cài đặt" />
        <BottomNavButton onClick={() => onOpenChange(true)} icon={PanelLeftOpen} label="Menu" />
      </nav>
    </>
  );
}

export function DesktopSidebar({ authUser, collapsed, openGroups, tab, onCollapseToggle, onGroupToggle, onNavigate, onLogout }) {
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
        {navGroups.map((group) => (
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
        {!collapsed && <div className="sidebar-user-info"><strong>{authUser?.username || "Admin"}</strong><small>Admin</small></div>}
        <button onClick={onLogout} title="Đăng xuất"><LogOut size={16} /></button>
      </div>
    </aside>
  );
}

function Brand() {
  return <div className="brand-block"><div className="brand-mark"><Sparkles size={18} /></div><div><div className="brand">Bot Manager</div><div className="brand-subtitle">Messenger operations</div></div></div>;
}

function BottomNavButton({ active = false, onClick, icon: Icon, label }) {
  return <button className={active ? "active" : ""} onClick={onClick}><Icon size={18} /><span>{label}</span></button>;
}
