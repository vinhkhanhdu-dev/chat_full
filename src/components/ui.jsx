import { Database, Save } from "lucide-react";

export function Avatar({ profile, fallback }) {
  if (profile?.profilePic) return <img className="avatar" src={profile.profilePic} alt="" />;
  return <span className="avatar fallback">{fallback.slice(-2).toUpperCase()}</span>;
}

export function PageAvatar({ page }) {
  if (page?.profilePic) return <img className="avatar" src={page.profilePic} alt="" />;
  return <span className="avatar fallback">{(page?.pageName || "P").slice(0, 1).toUpperCase()}</span>;
}

export function Panel({ title, action, children, className = "" }) {
  return (
    <section className={`panel ${className}`}>
      <div className="panel-header">
        <h2>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Editor({ title, children, onSave, action, footer }) {
  return (
    <section className="editor">
      <div className="panel-header">
        <h2>{title}</h2>
        {action}
      </div>
      {children}
      {footer || (
        <button className="primary" onClick={onSave}>
          <Save size={16} />
          Lưu thay đổi
        </button>
      )}
    </section>
  );
}

export function ToggleSwitch({ checked, onChange, label }) {
  return (
    <button type="button" className={`toggle-switch ${checked ? "on" : "off"}`} onClick={() => onChange(!checked)} aria-pressed={checked}>
      <span className="toggle-track"><span className="toggle-thumb" /></span>
      <strong>{label}</strong>
    </button>
  );
}

export function EmptyState({ title, body }) {
  return (
    <div className="empty-state">
      <Database size={20} />
      <strong>{title}</strong>
      <span>{body}</span>
    </div>
  );
}

export function StatusBadge({ status }) {
  return <span className={`badge ${status}`}>{status}</span>;
}

export function Input({ label, value, onChange, type = "text" }) {
  return (
    <label>
      <span>{label}</span>
      <input type={type} value={value || ""} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

export function Textarea({ label, value, onChange }) {
  return (
    <label className="textarea-field">
      <span>{label}</span>
      <textarea value={value || ""} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}
