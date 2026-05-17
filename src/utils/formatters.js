export function pageTitle(tab) {
  return {
    bots: "Quản lý page bot",
    companies: "Quản lý công ty",
    "consultation-scripts": "Kịch bản tư vấn",
    promotions: "Chương trình khuyến mãi",
    messages: "Lịch sử tin nhắn",
    orders: "Đơn hàng",
    contexts: "Ngữ cảnh hội thoại",
    simulator: "Giả lập chatbot",
    "test-bot": "Test BOT",
    faqs: "FAQ theo page",
    rules: "Quy tắc và instruction",
    settings: "Cấu hình hệ thống"
  }[tab];
}

export function formatSimulatorDebugLog(debugLog = []) {
  if (!debugLog.length) return "Chưa có log xử lý.";

  return debugLog
    .map((entry) =>
      [
        `[${formatDateTime(entry.at)}] ${entry.step}`,
        entry.reason ? `reason=${entry.reason}` : "",
        typeof entry.canReply === "boolean" ? `canReply=${entry.canReply}` : "",
        entry.replyText ? `reply=${entry.replyText}` : ""
      ]
        .filter(Boolean)
        .join(" | ")
    )
    .join("\n");
}

export function formatDateTime(value) {
  return new Date(value).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" });
}

export function formatTime(value) {
  return new Date(value).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

export function formatDayKey(value) {
  return new Date(value).toISOString().slice(0, 10);
}

export function formatDayLabel(value) {
  return new Date(value).toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

export function formatRelativeDate(value) {
  return new Date(value).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

export function isBotReplyPaused(thread, now = Date.now(), pageBot) {
  return Boolean(pageBot?.humanHandoffEnabled && thread?.botReplyPausedUntil && new Date(thread.botReplyPausedUntil).getTime() > now);
}

export function getConversationStatusLabel(thread, now, pageBot) {
  return isBotReplyPaused(thread, now, pageBot) ? "BOT đang tạm dừng" : "BOT đang trả lời";
}

export function getConversationStatusDetail(thread, pageBot, now) {
  if (isBotReplyPaused(thread, now, pageBot)) {
    const resumeAt = new Date(thread.botReplyPausedUntil);
    const remainingMinutes = Math.max(1, Math.ceil((resumeAt.getTime() - now) / 60000));
    return [
      thread.lastHumanMessageAt ? `Người thật trả lời lúc ${formatDateTime(thread.lastHumanMessageAt)}.` : "",
      `BOT sẽ tự trả lời lại lúc ${formatDateTime(resumeAt)} (còn ${remainingMinutes} phút).`,
      pageBot?.humanHandoffResumeAfterMinutes
        ? `Mỗi tin mới từ người thật sẽ đặt lại thời gian chờ ${pageBot.humanHandoffResumeAfterMinutes} phút.`
        : ""
    ]
      .filter(Boolean)
      .join(" ");
  }
  if (thread?.lastHumanMessageAt) return `Người thật trả lời gần nhất lúc ${formatDateTime(thread.lastHumanMessageAt)}. BOT đã sẵn sàng trả lời lại.`;
  return "Chưa có can thiệp từ người thật";
}

export function customerDisplayName(customer) {
  const fullName = [customer.profile?.firstName, customer.profile?.lastName].filter(Boolean).join(" ");
  return fullName || customer.customerPsid;
}

export function companyNameById(companies, companyId) {
  if (!companyId) return "Chưa gán công ty";
  return companies.find((company) => company.companyId === companyId)?.name || companyId;
}
