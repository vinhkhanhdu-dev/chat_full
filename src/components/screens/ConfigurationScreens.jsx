import { Moon, Plus, Save, Sun, Trash2 } from "lucide-react";
import { Editor, EmptyState, Input, Panel, Textarea, ToggleSwitch } from "../ui.jsx";
import { emptyRule } from "../../constants/defaults.js";

export function RulesScreen({ rules, editingRule, setEditingRule, saveRule, removeRule }) {
  return (
    <section className="workspace-grid">
      <Panel
        title="Quy tắc dùng chung"
        action={
          <button className="ghost-button" onClick={() => setEditingRule(emptyRule)}>
            <Plus size={16} />
            Tạo mới
          </button>
        }
      >
        <div className="list">
          {rules.length === 0 && <EmptyState title="Chưa có quy tắc" body="Thêm instruction để mọi bot tuân theo cùng một chuẩn." />}
          {rules.map((rule) => (
            <button key={rule._id} className={`row ${editingRule._id === rule._id ? "selected" : ""}`} onClick={() => setEditingRule(rule)}>
              <strong>{rule.name}</strong>
              <span>{rule.category}</span>
              <small>Ưu tiên {rule.priority}</small>
            </button>
          ))}
        </div>
      </Panel>
      <Editor title={editingRule._id ? "Cập nhật quy tắc" : "Tạo quy tắc"} onSave={saveRule}>
        <div className="form-grid">
          <Input label="Tên quy tắc" value={editingRule.name} onChange={(value) => setEditingRule({ ...editingRule, name: value })} />
          <Input label="Nhóm" value={editingRule.category} onChange={(value) => setEditingRule({ ...editingRule, category: value })} />
        </div>
        <Input label="Độ ưu tiên" type="number" value={editingRule.priority} onChange={(value) => setEditingRule({ ...editingRule, priority: Number(value) })} />
        <Textarea label="Nội dung" value={editingRule.content} onChange={(value) => setEditingRule({ ...editingRule, content: value })} />
        {editingRule._id && <button className="danger" onClick={() => removeRule(editingRule._id)}><Trash2 size={16} />Xóa quy tắc</button>}
      </Editor>
    </section>
  );
}

export function FaqsScreen({
  pageBots,
  faqPageFilter,
  setFaqPageFilter,
  faqSearch,
  setFaqSearch,
  filteredFaqs,
  editingFaq,
  setEditingFaq,
  emptyFaq,
  saveFaq,
  removeFaq
}) {
  return (
    <section className="workspace-grid">
      <Panel
        title="FAQ theo từng page"
        action={<button className="ghost-button" onClick={() => setEditingFaq({ ...emptyFaq, pageBotId: faqPageFilter || pageBots[0]?._id || "" })}><Plus size={16} />Tạo mới</button>}
      >
        <div className="filter-bar">
          <select value={faqPageFilter} onChange={(event) => setFaqPageFilter(event.target.value)}>
            <option value="">Tất cả page</option>
            {pageBots.map((bot) => <option key={bot._id} value={bot._id}>{bot.pageName}</option>)}
          </select>
          <input value={faqSearch} onChange={(event) => setFaqSearch(event.target.value)} placeholder="Tìm theo câu hỏi, câu trả lời hoặc tag" />
        </div>
        <div className="list">
          {filteredFaqs.length === 0 && <EmptyState title="Chưa có FAQ" body="Tạo câu hỏi thường gặp để bot ưu tiên trả lời theo từng page." />}
          {filteredFaqs.map((faq) => (
            <button key={faq._id} className={`row ${editingFaq._id === faq._id ? "selected" : ""}`} onClick={() => setEditingFaq({ ...faq, tags: Array.isArray(faq.tags) ? faq.tags.join(", ") : faq.tags || "" })}>
              <strong>{faq.question}</strong>
              <span>{pageBots.find((bot) => bot._id === faq.pageBotId)?.pageName || "-"}</span>
              <small>{faq.enabled ? "Đang bật" : "Đã tắt"} · Ưu tiên {faq.priority}</small>
            </button>
          ))}
        </div>
      </Panel>
      <Editor title={editingFaq._id ? "Cập nhật FAQ" : "Tạo FAQ"} onSave={saveFaq}>
        <label>
          <span>Page áp dụng</span>
          <select value={editingFaq.pageBotId || ""} onChange={(event) => setEditingFaq({ ...editingFaq, pageBotId: event.target.value })}>
            <option value="">Chọn page</option>
            {pageBots.map((bot) => <option key={bot._id} value={bot._id}>{bot.pageName}</option>)}
          </select>
        </label>
        <Input label="Câu hỏi" value={editingFaq.question} onChange={(value) => setEditingFaq({ ...editingFaq, question: value })} />
        <Textarea label="Câu trả lời" value={editingFaq.answer} onChange={(value) => setEditingFaq({ ...editingFaq, answer: value })} />
        <div className="form-grid">
          <Input label="Tags, phân cách bằng dấu phẩy" value={editingFaq.tags} onChange={(value) => setEditingFaq({ ...editingFaq, tags: value })} />
          <Input label="Độ ưu tiên" type="number" value={editingFaq.priority} onChange={(value) => setEditingFaq({ ...editingFaq, priority: Number(value) })} />
        </div>
        <label className="checkbox-row"><input type="checkbox" checked={Boolean(editingFaq.enabled)} onChange={(event) => setEditingFaq({ ...editingFaq, enabled: event.target.checked })} /><span>Bật FAQ này</span></label>
        {editingFaq._id && <button className="danger" onClick={() => removeFaq(editingFaq._id)}><Trash2 size={16} />Xóa FAQ</button>}
      </Editor>
    </section>
  );
}

export function SettingsScreen({
  theme,
  setTheme,
  showMobileHeader,
  setShowMobileHeader,
  runtimeSettings,
  setRuntimeSettings,
  saveRuntimeSettings
}) {
  return (
    <section className="settings-grid">
      <Panel title="Giao diện hệ thống">
        <div className="theme-setting">
          <div><strong>Chế độ hiển thị</strong><span>Chọn giao diện sáng hoặc tối cho khu vực quản trị.</span></div>
          <div className="segmented-control">
            <button className={theme === "light" ? "active" : ""} onClick={() => setTheme("light")}><Sun size={16} />Light</button>
            <button className={theme === "dark" ? "active" : ""} onClick={() => setTheme("dark")}><Moon size={16} />Dark</button>
          </div>
        </div>
        <div className="setting-card">
          <div>
            <strong>Header mobile</strong>
            <span>Hiển thị thanh Bot Manager trên mobile app và web responsive.</span>
          </div>
          <ToggleSwitch
            checked={showMobileHeader}
            onChange={setShowMobileHeader}
            label={showMobileHeader ? "Đang hiện" : "Đang ẩn"}
          />
        </div>
      </Panel>
      <Panel title="Cấu hình phản hồi BOT">
        <div className="settings-form">
          <Input label="OpenAI model" value={runtimeSettings.openaiModel} onChange={(value) => setRuntimeSettings({ ...runtimeSettings, openaiModel: value })} />
          <div className="form-grid">
            <Input label="Max output tokens" type="number" value={runtimeSettings.maxOutputTokens} onChange={(value) => setRuntimeSettings({ ...runtimeSettings, maxOutputTokens: Number(value) })} />
            <Input label="Số FAQ tối đa đưa vào prompt" type="number" value={runtimeSettings.maxFaqResults} onChange={(value) => setRuntimeSettings({ ...runtimeSettings, maxFaqResults: Number(value) })} />
          </div>
          <Input label="Số chương trình khuyến mãi tối đa đưa vào prompt" type="number" value={runtimeSettings.maxPromotionResults} onChange={(value) => setRuntimeSettings({ ...runtimeSettings, maxPromotionResults: Number(value) })} />
          <Input label="Số kết quả file search tối đa" type="number" value={runtimeSettings.fileSearchMaxResults} onChange={(value) => setRuntimeSettings({ ...runtimeSettings, fileSearchMaxResults: Number(value) })} />
          <label className="checkbox-row"><input type="checkbox" checked={Boolean(runtimeSettings.enableMessengerTemplates)} onChange={(event) => setRuntimeSettings({ ...runtimeSettings, enableMessengerTemplates: event.target.checked })} />Bat Messenger template cho bao gia va thong tin don hang</label>
          <label className="checkbox-row"><input type="checkbox" checked={Boolean(runtimeSettings.splitMessengerTextOnNewline)} onChange={(event) => setRuntimeSettings({ ...runtimeSettings, splitMessengerTextOnNewline: event.target.checked })} />Tach moi dong xuong hang thanh mot tin nhan Messenger</label>
          <Input label="Delay giua cac tin tach dong (ms)" type="number" value={runtimeSettings.splitMessengerTextDelayMs} onChange={(value) => setRuntimeSettings({ ...runtimeSettings, splitMessengerTextDelayMs: Number(value) })} />
          <label className="checkbox-row"><input type="checkbox" checked={Boolean(runtimeSettings.aggregateConsecutiveCustomerMessages)} onChange={(event) => setRuntimeSettings({ ...runtimeSettings, aggregateConsecutiveCustomerMessages: event.target.checked })} />Cho khach nhan xong roi gom cac tin lien tuc truoc khi BOT tra loi</label>
          <Input label="Thoi gian cho khach nhan xong (ms)" type="number" value={runtimeSettings.aggregateCustomerMessageDelayMs} onChange={(value) => setRuntimeSettings({ ...runtimeSettings, aggregateCustomerMessageDelayMs: Number(value) })} />
          <button className="primary" onClick={saveRuntimeSettings}><Save size={16} />Lưu cấu hình BOT</button>
        </div>
      </Panel>
    </section>
  );
}
