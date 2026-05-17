import React, { useEffect, useMemo, useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";
import {
  Bot,
  Save,
  Trash2,
  Plus,
  Sparkles,
  CircleCheckBig,
  FileText,
  MessageSquare,
  RefreshCw,
  Moon,
  Sun,
  Paperclip,
  SendHorizontal,
  ShoppingBag,
  X
} from "lucide-react";
import { api, getAuthToken, onUnauthorized, setAuthToken } from "./api.js";
import {
  defaultRuntimeSettings,
  emptyCompany,
  emptyConsultationScript,
  emptyFaq,
  emptyPageBot,
  emptyPromotion,
  emptyRole,
  emptyRule,
  emptySimulatorDraft,
  emptyUser
} from "./constants/defaults.js";
import { DesktopSidebar, MobileNavigation, validTabs } from "./components/navigation.jsx";
import { Avatar, Editor, EmptyState, Input, PageAvatar, Panel, Textarea, ToggleSwitch } from "./components/ui.jsx";
import { FaqsScreen, RolesScreen, RulesScreen, SettingsScreen, UsersScreen } from "./components/screens/ConfigurationScreens.jsx";
import {
  companyNameById,
  customerDisplayName,
  formatDateTime,
  formatDayKey,
  formatDayLabel,
  formatRelativeDate,
  formatSimulatorDebugLog,
  formatTime,
  getConversationStatusDetail,
  getConversationStatusLabel,
  isBotReplyPaused,
  pageTitle
} from "./utils/formatters.js";

function getRouteTab() {
  const route = window.location.hash.replace(/^#\/?/, "").replace(/^admin\/?/, "");
  return validTabs.has(route) ? route : "bots";
}

const tabPermissions = {
  bots: "pages.manage",
  companies: "companies.manage",
  "consultation-scripts": "scripts.manage",
  promotions: "promotions.manage",
  rules: "rules.manage",
  settings: "settings.manage",
  users: "users.manage",
  roles: "roles.manage",
  reports: "reports.view"
};

export function App() {
  const [tab, setTab] = useState(getRouteTab);
  const [authUser, setAuthUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [loginDraft, setLoginDraft] = useState({ username: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [pageBots, setPageBots] = useState([]);
  const [messages, setMessages] = useState([]);
  const [orders, setOrders] = useState([]);
  const [rules, setRules] = useState([]);
  const [contexts, setContexts] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [consultationScripts, setConsultationScripts] = useState([]);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [reportRange, setReportRange] = useState(() => {
    const today = getBangkokDayKey(new Date());
    return { fromDate: today, toDate: today };
  });
  const [operationsReport, setOperationsReport] = useState(null);
  const [runtimeSettings, setRuntimeSettings] = useState(defaultRuntimeSettings);
  const [simulatorCases, setSimulatorCases] = useState([]);
  const [simulatorDraft, setSimulatorDraft] = useState(emptySimulatorDraft);
  const [simulatorResult, setSimulatorResult] = useState(null);
  const [simulatorRunning, setSimulatorRunning] = useState(false);
  const [editingBot, setEditingBot] = useState(emptyPageBot);
  const [editingRule, setEditingRule] = useState(emptyRule);
  const [editingFaq, setEditingFaq] = useState(emptyFaq);
  const [editingCompany, setEditingCompany] = useState(emptyCompany);
  const [editingPromotion, setEditingPromotion] = useState(emptyPromotion);
  const [editingConsultationScript, setEditingConsultationScript] = useState(emptyConsultationScript);
  const [editingUser, setEditingUser] = useState(emptyUser);
  const [editingRole, setEditingRole] = useState(emptyRole);
  const [selectedMessagePageId, setSelectedMessagePageId] = useState("");
  const [selectedCustomerPsid, setSelectedCustomerPsid] = useState("");
  const [manualReplyDraft, setManualReplyDraft] = useState("");
  const [manualReplyAttachment, setManualReplyAttachment] = useState(null);
  const [manualReplySending, setManualReplySending] = useState(false);
  const [manualReplyStatus, setManualReplyStatus] = useState(null);
  const [orderPageFilter, setOrderPageFilter] = useState("");
  const [orderCustomerFilter, setOrderCustomerFilter] = useState("");
  const [orderPageCompanyFilter, setOrderPageCompanyFilter] = useState("");
  const [orderPageSearch, setOrderPageSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDraft, setOrderDraft] = useState(null);
  const [selectedContextId, setSelectedContextId] = useState("");
  const [contextDraft, setContextDraft] = useState("");
  const [pageCompanyFilter, setPageCompanyFilter] = useState("");
  const [pageSearch, setPageSearch] = useState("");
  const [messagePageCompanyFilter, setMessagePageCompanyFilter] = useState("");
  const [messagePageSearch, setMessagePageSearch] = useState("");
  const [faqPageFilter, setFaqPageFilter] = useState("");
  const [faqSearch, setFaqSearch] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const [messagesRefreshing, setMessagesRefreshing] = useState(false);
  const [contentRefreshing, setContentRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [messagesLastRefreshedAt, setMessagesLastRefreshedAt] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem("system-theme") || "light");
  const [showMobileHeader, setShowMobileHeader] = useState(
    () => localStorage.getItem("show-mobile-header") !== "false"
  );
  const [mobileNavVariant, setMobileNavVariant] = useState(
    () => localStorage.getItem("mobile-nav-variant") || "v1"
  );
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [openGroups, setOpenGroups] = useState({
    operations: true,
    configuration: true,
    testing: true,
    system: true
  });
  const latestMessageRef = useRef(null);
  const messageScrollRef = useRef(null);
  const bottomRefreshArmedRef = useRef(true);
  const contentTouchStartYRef = useRef(null);
  const can = (permission) => userCan(authUser, permission);

  function notify(type, message) {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((current) => [...current, { id, type, message }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 3200);
  }

  async function runAction(action, { success, fallbackError = "Thao tác thất bại." } = {}) {
    try {
      const result = await action();
      if (success) notify("success", success);
      return result;
    } catch (error) {
      notify("error", getErrorMessage(error, fallbackError));
      throw error;
    }
  }

  useEffect(() => {
    onUnauthorized(() => {
      setAuthToken("");
      setAuthUser(null);
    });
  }, []);

  useEffect(() => {
    if (!getAuthToken()) {
      setAuthReady(true);
      return;
    }

    api
      .getCurrentUser()
      .then(({ user }) => setAuthUser(user))
      .catch(() => {
        setAuthToken("");
        setAuthUser(null);
      })
      .finally(() => setAuthReady(true));
  }, []);

  useEffect(() => {
    if (!authUser) {
      return;
    }

    Promise.all([
      can("pages.view") ? api.getPageBots() : Promise.resolve([]),
      can("messages.view") ? api.getMessages() : Promise.resolve([]),
      can("orders.view") ? api.getOrders() : Promise.resolve([]),
      can("rules.manage") ? api.getRules() : Promise.resolve([]),
      can("contexts.view") ? api.getContexts() : Promise.resolve([]),
      can("faqs.view") ? api.getFaqs() : Promise.resolve([]),
      can("companies.manage") ? api.getCompanies() : Promise.resolve([]),
      can("promotions.manage") ? api.getPromotions() : Promise.resolve([]),
      can("scripts.manage") ? api.getConsultationScripts() : Promise.resolve([]),
      can("settings.manage") ? api.getSystemSettings() : Promise.resolve(defaultRuntimeSettings),
      can("users.manage") ? api.getUsers() : Promise.resolve([]),
      can("roles.manage") ? api.getRoles() : Promise.resolve([]),
      can("roles.manage") ? api.getPermissions() : Promise.resolve([]),
      can("simulator.use") ? api.getSimulatorCases() : Promise.resolve([])
    ]).then(([bots, logs, orderList, ruleList, contextList, faqList, companyList, promotionList, consultationScriptList, settings, userList, roleList, permissionList, cases]) => {
        setPageBots(bots);
        setMessages(logs);
        setMessagesLastRefreshedAt(new Date());
        setOrders(orderList);
        setRules(ruleList);
        setContexts(contextList);
        setFaqs(faqList);
        setCompanies(companyList);
        setPromotions(promotionList);
        setConsultationScripts(consultationScriptList);
        setUsers(userList);
        setRoles(roleList);
        setPermissions(permissionList);
        setSimulatorCases(cases);
        setRuntimeSettings({
          openaiModel: settings.openaiModel || defaultRuntimeSettings.openaiModel,
          maxOutputTokens: settings.maxOutputTokens || defaultRuntimeSettings.maxOutputTokens,
          maxFaqResults: settings.maxFaqResults ?? defaultRuntimeSettings.maxFaqResults,
          maxPromotionResults: settings.maxPromotionResults ?? defaultRuntimeSettings.maxPromotionResults,
          fileSearchMaxResults: settings.fileSearchMaxResults ?? defaultRuntimeSettings.fileSearchMaxResults,
          enableMessengerTemplates:
            settings.enableMessengerTemplates ?? defaultRuntimeSettings.enableMessengerTemplates,
          splitMessengerTextOnNewline:
            settings.splitMessengerTextOnNewline ?? defaultRuntimeSettings.splitMessengerTextOnNewline,
          splitMessengerTextDelayMs:
            settings.splitMessengerTextDelayMs ?? defaultRuntimeSettings.splitMessengerTextDelayMs,
          aggregateConsecutiveCustomerMessages:
            settings.aggregateConsecutiveCustomerMessages ??
            defaultRuntimeSettings.aggregateConsecutiveCustomerMessages,
          aggregateCustomerMessageDelayMs:
            settings.aggregateCustomerMessageDelayMs ?? defaultRuntimeSettings.aggregateCustomerMessageDelayMs
        });
        if (bots[0]) {
          setSelectedMessagePageId(bots[0]._id);
          setSimulatorDraft((current) => ({ ...current, pageBotId: current.pageBotId || bots[0]._id }));
        }
        if (contextList[0]) {
          setSelectedContextId(contextList[0]._id);
          setContextDraft(contextList[0].memorySummary || "");
        }
      });
  }, [authUser]);

  useEffect(() => {
    const syncRoute = () => setTab(getRouteTab());
    window.addEventListener("hashchange", syncRoute);
    if (!window.location.hash) {
      window.history.replaceState(null, "", "#/admin/bots");
    }
    syncRoute();
    return () => window.removeEventListener("hashchange", syncRoute);
  }, []);

  useEffect(() => {
    if (!authUser) {
      return;
    }
    if (tabPermissions[tab] && !can(tabPermissions[tab])) {
      window.location.hash = "#/admin/messages";
      return;
    }
    refreshActiveTabData(tab);
  }, [authUser, tab]);

  useEffect(() => {
    const themeColor = theme === "dark" ? "#0b1220" : "#dceff1";

    document.documentElement.dataset.theme = theme;
    localStorage.setItem("system-theme", theme);

    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", themeColor);

    if (Capacitor.isNativePlatform()) {
      Promise.all([
        StatusBar.setStyle({ style: theme === "dark" ? Style.Dark : Style.Light }),
        StatusBar.setBackgroundColor({ color: themeColor })
      ]).catch(() => {
        // Some Android versions ignore status bar background updates by design.
      });
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("show-mobile-header", showMobileHeader ? "true" : "false");
  }, [showMobileHeader]);

  useEffect(() => {
    localStorage.setItem("mobile-nav-variant", mobileNavVariant);
  }, [mobileNavVariant]);

  useEffect(() => {
    const intervalId = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(intervalId);
  }, []);

  const groupedMessages = useMemo(() => {
    return messages.reduce((acc, message) => {
      const key = `${message.pageBotId}:${message.customerPsid}`;
      acc[key] ||= [];
      acc[key].push(message);
      return acc;
    }, {});
  }, [messages]);

  const messagesByPage = useMemo(() => {
    return messages.reduce((acc, message) => {
      acc[message.pageBotId] ||= [];
      acc[message.pageBotId].push(message);
      return acc;
    }, {});
  }, [messages]);

  const customerCountByPage = useMemo(() => {
    return messages.reduce((acc, message) => {
      acc[message.pageBotId] ||= new Set();
      acc[message.pageBotId].add(message.customerPsid);
      return acc;
    }, {});
  }, [messages]);

  const customersForSelectedPage = useMemo(() => {
    const pageMessages = messagesByPage[selectedMessagePageId] || [];
    const customerMap = pageMessages.reduce((acc, message) => {
      acc[message.customerPsid] ||= [];
      acc[message.customerPsid].push(message);
      return acc;
    }, {});

    return Object.entries(customerMap)
      .map(([customerPsid, thread]) => ({
        customerPsid,
        profile: thread.find((message) => message.customerProfile)?.customerProfile || null,
        messages: [...thread].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
        lastMessageAt: thread.reduce(
          (latest, message) => (new Date(message.createdAt) > latest ? new Date(message.createdAt) : latest),
          new Date(0)
        )
      }))
      .sort((a, b) => b.lastMessageAt - a.lastMessageAt);
  }, [messagesByPage, selectedMessagePageId]);

  const selectedConversation = useMemo(() => {
    return customersForSelectedPage.find((customer) => customer.customerPsid === selectedCustomerPsid);
  }, [customersForSelectedPage, selectedCustomerPsid]);

  const selectedConversationThread = useMemo(
    () =>
      contexts.find(
        (context) =>
          String(context.pageBotId) === String(selectedMessagePageId) &&
          context.customerPsid === selectedCustomerPsid
      ),
    [contexts, selectedMessagePageId, selectedCustomerPsid]
  );

  const selectedPageBot = useMemo(
    () => pageBots.find((bot) => String(bot._id) === String(selectedMessagePageId)),
    [pageBots, selectedMessagePageId]
  );

  useEffect(() => {
    latestMessageRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [selectedCustomerPsid, selectedConversation?.messages.length]);

  useEffect(() => {
    setManualReplyDraft("");
    setManualReplyAttachment(null);
  }, [selectedCustomerPsid]);

  const selectedConversationGroups = useMemo(() => {
    if (!selectedConversation) {
      return [];
    }

    return selectedConversation.messages.reduce((groups, message) => {
      const dayKey = formatDayKey(message.createdAt);
      const latestGroup = groups.at(-1);
      if (!latestGroup || latestGroup.dayKey !== dayKey) {
        groups.push({
          dayKey,
          label: formatDayLabel(message.createdAt),
          messages: [message]
        });
      } else {
        latestGroup.messages.push(message);
      }
      return groups;
    }, []);
  }, [selectedConversation]);

  useEffect(() => {
    if (!customersForSelectedPage.length) {
      setSelectedCustomerPsid("");
      return;
    }

    const selectedStillExists = customersForSelectedPage.some(
      (customer) => customer.customerPsid === selectedCustomerPsid
    );

    if (!selectedStillExists) {
      setSelectedCustomerPsid(customersForSelectedPage[0].customerPsid);
    }
  }, [customersForSelectedPage, selectedCustomerPsid]);

  const stats = [
    { label: "Bot đang quản lý", value: pageBots.length, icon: Bot },
    { label: "Hội thoại", value: Object.keys(groupedMessages).length, icon: MessageSquare },
    { label: "Đơn đã ghi nhận", value: orders.length, icon: ShoppingBag },
    { label: "Quy tắc chung", value: rules.length, icon: FileText }
  ];

  const orderSummaryByPage = useMemo(() => {
    return orders.reduce((acc, order) => {
      const key = String(order.pageId);
      acc[key] ||= { pageId: key, count: 0, total: 0 };
      acc[key].count += 1;
      acc[key].total += order.total || 0;
      return acc;
    }, {});
  }, [orders]);

  const orderSummaryByCustomer = useMemo(() => {
    return orders.reduce((acc, order) => {
      const key = `${order.pageId}:${order.customerId}`;
      acc[key] ||= {
        key,
        pageId: String(order.pageId),
        customerId: order.customerId,
        customerName: customerDisplayName({
          customerPsid: order.customerId,
          profile: order.customerProfile
        }),
        profile: order.customerProfile,
        count: 0,
        total: 0
      };
      acc[key].count += 1;
      acc[key].total += order.total || 0;
      return acc;
    }, {});
  }, [orders]);

  const filteredOrders = useMemo(
    () =>
      orders.filter((order) => {
        const matchesPage = !orderPageFilter || String(order.pageId) === orderPageFilter;
        const matchesCustomer =
          !orderCustomerFilter || `${order.pageId}:${order.customerId}` === orderCustomerFilter;
        return matchesPage && matchesCustomer;
      }),
    [orders, orderPageFilter, orderCustomerFilter]
  );

  const selectedOrderPageId = orderPageFilter || pageBots[0]?.pageId || "";
  const filteredOrderPageBots = useMemo(() => {
    const keyword = orderPageSearch.trim().toLowerCase();
    return pageBots.filter((bot) => {
      const matchesCompany = !orderPageCompanyFilter || bot.companyId === orderPageCompanyFilter;
      const matchesKeyword =
        !keyword ||
        bot.pageName.toLowerCase().includes(keyword) ||
        String(bot.pageId).includes(keyword) ||
        companyNameById(companies, bot.companyId).toLowerCase().includes(keyword);
      return matchesCompany && matchesKeyword;
    });
  }, [companies, orderPageCompanyFilter, orderPageSearch, pageBots]);
  const selectedPageOrderSummary = orderSummaryByPage[selectedOrderPageId];
  const selectedPageCustomers = Object.values(orderSummaryByCustomer).filter(
    (summary) => summary.pageId === String(selectedOrderPageId)
  );

  const selectedContext = useMemo(
    () => contexts.find((context) => context._id === selectedContextId),
    [contexts, selectedContextId]
  );

  const filteredPageBots = useMemo(() => {
    const keyword = pageSearch.trim().toLowerCase();
    return pageBots.filter((bot) => {
      const matchesCompany = !pageCompanyFilter || bot.companyId === pageCompanyFilter;
      const matchesKeyword =
        !keyword ||
        bot.pageName.toLowerCase().includes(keyword) ||
        bot.pageId.toLowerCase().includes(keyword) ||
        companyNameById(companies, bot.companyId).toLowerCase().includes(keyword);

      return matchesCompany && matchesKeyword;
    });
  }, [pageBots, pageCompanyFilter, pageSearch, companies]);

  const filteredMessagePageBots = useMemo(() => {
    const keyword = messagePageSearch.trim().toLowerCase();
    return pageBots.filter((bot) => {
      const matchesCompany = !messagePageCompanyFilter || bot.companyId === messagePageCompanyFilter;
      const matchesKeyword =
        !keyword ||
        bot.pageName.toLowerCase().includes(keyword) ||
        bot.pageId.toLowerCase().includes(keyword) ||
        companyNameById(companies, bot.companyId).toLowerCase().includes(keyword);

      return matchesCompany && matchesKeyword;
    });
  }, [pageBots, messagePageCompanyFilter, messagePageSearch, companies]);

  const filteredFaqs = useMemo(() => {
    const keyword = faqSearch.trim().toLowerCase();
    return faqs.filter((faq) => {
      const matchesPage = !faqPageFilter || faq.pageBotId === faqPageFilter;
      const matchesKeyword =
        !keyword ||
        faq.question.toLowerCase().includes(keyword) ||
        faq.answer.toLowerCase().includes(keyword) ||
        (faq.tags || []).join(" ").toLowerCase().includes(keyword);

      return matchesPage && matchesKeyword;
    });
  }, [faqs, faqPageFilter, faqSearch]);

  const simulatorMessages = useMemo(() => {
    return [...(simulatorResult?.messages || [])].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }, [simulatorResult]);

  useEffect(() => {
    if (tab !== "messages") return;
    if (!filteredMessagePageBots.length) {
      setSelectedMessagePageId("");
      return;
    }

    const selectedStillVisible = filteredMessagePageBots.some((bot) => bot._id === selectedMessagePageId);
    if (!selectedStillVisible) {
      setSelectedMessagePageId(filteredMessagePageBots[0]._id);
    }
  }, [filteredMessagePageBots, selectedMessagePageId, tab]);

  async function saveBot() {
    const saved = await runAction(() => api.savePageBot(editingBot), { success: "Đã lưu page bot." });
    setPageBots((current) => {
      const exists = current.some((bot) => bot._id === saved._id);
      return exists ? current.map((bot) => (bot._id === saved._id ? saved : bot)) : [saved, ...current];
    });
    setEditingBot(emptyPageBot);
  }

  async function removeBot(id) {
    await runAction(() => api.deletePageBot(id), { success: "Đã xóa page bot." });
    setPageBots((current) => current.filter((bot) => bot._id !== id));
    setEditingBot(emptyPageBot);
  }

  async function syncPageBotProfile() {
    if (!editingBot._id) return;
    const synced = await runAction(() => api.syncPageBotProfile(editingBot._id), { success: "Đã đồng bộ thông tin page." });
    setEditingBot(synced);
    setPageBots((current) => current.map((bot) => (bot._id === synced._id ? synced : bot)));
  }

  async function saveRule() {
    const saved = await runAction(() => api.saveRule(editingRule), { success: "Đã lưu quy tắc." });
    setRules((current) => {
      const exists = current.some((rule) => rule._id === saved._id);
      return exists ? current.map((rule) => (rule._id === saved._id ? saved : rule)) : [saved, ...current];
    });
    setEditingRule(emptyRule);
  }

  async function removeRule(id) {
    await runAction(() => api.deleteRule(id), { success: "Đã xóa quy tắc." });
    setRules((current) => current.filter((rule) => rule._id !== id));
    setEditingRule(emptyRule);
  }

  async function saveContext() {
    if (!selectedContext) return;
    const saved = await runAction(() => api.saveContext(selectedContext._id, { memorySummary: contextDraft }), { success: "Đã lưu memory." });
    setContexts((current) =>
      current.map((context) =>
        context._id === saved._id ? { ...context, memorySummary: saved.memorySummary } : context
      )
    );
  }

  async function resetContext() {
    if (!selectedContext) return;
    const saved = await runAction(() => api.resetContext(selectedContext._id), { success: "Đã xóa memory tạm." });
    setContexts((current) =>
      current.map((context) =>
        context._id === saved._id ? { ...context, memorySummary: "", lastResponseId: "" } : context
      )
    );
    setContextDraft("");
  }

  async function resetAllContexts() {
    const confirmed = window.confirm(
      "Xóa toàn bộ memory tạm và last response của tất cả hội thoại? Lịch sử tin nhắn vẫn được giữ lại."
    );
    if (!confirmed) return;

    await runAction(() => api.resetAllContexts(), { success: "Đã xóa toàn bộ memory tạm." });
    setContexts((current) =>
      current.map((context) => ({
        ...context,
        memorySummary: "",
        lastResponseId: ""
      }))
    );
    setContextDraft("");
  }

  async function saveFaq() {
    const payload = {
      ...editingFaq,
      tags: Array.isArray(editingFaq.tags)
        ? editingFaq.tags
        : String(editingFaq.tags || "")
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean)
    };
    const saved = await runAction(() => api.saveFaq(payload), { success: "Đã lưu FAQ." });
    setFaqs((current) => {
      const exists = current.some((faq) => faq._id === saved._id);
      return exists ? current.map((faq) => (faq._id === saved._id ? saved : faq)) : [saved, ...current];
    });
    setEditingFaq({ ...emptyFaq, pageBotId: payload.pageBotId });
  }

  async function removeFaq(id) {
    await runAction(() => api.deleteFaq(id), { success: "Đã xóa FAQ." });
    setFaqs((current) => current.filter((faq) => faq._id !== id));
    setEditingFaq(emptyFaq);
  }

  async function saveCompany() {
    const saved = await runAction(() => api.saveCompany(editingCompany), { success: "Đã lưu công ty." });
    setCompanies((current) => {
      const exists = current.some((company) => company._id === saved._id);
      return exists
        ? current.map((company) => (company._id === saved._id ? saved : company))
        : [saved, ...current];
    });
    setEditingCompany(emptyCompany);
  }

  async function removeCompany(id) {
    await runAction(() => api.deleteCompany(id), { success: "Đã xóa công ty." });
    setCompanies((current) => current.filter((company) => company._id !== id));
    setEditingCompany(emptyCompany);
  }

  async function saveConsultationScript() {
    const saved = await runAction(() => api.saveConsultationScript(editingConsultationScript), { success: "Đã lưu kịch bản tư vấn." });
    setConsultationScripts((current) => {
      const exists = current.some((script) => script._id === saved._id);
      return exists
        ? current.map((script) => (script._id === saved._id ? saved : script))
        : [saved, ...current];
    });
    setEditingConsultationScript({
      ...emptyConsultationScript,
      companyId: editingConsultationScript.companyId
    });
  }

  async function saveUser() {
    const saved = await runAction(() => api.saveUser(editingUser), { success: "Đã lưu tài khoản." });
    setUsers((current) => {
      const exists = current.some((user) => user._id === saved._id);
      return exists ? current.map((user) => (user._id === saved._id ? saved : user)) : [saved, ...current];
    });
    setEditingUser(emptyUser);
  }

  async function saveRole() {
    const saved = await runAction(() => api.saveRole(editingRole), { success: "Đã lưu vai trò." });
    setRoles((current) => {
      const exists = current.some((role) => role._id === saved._id);
      return exists ? current.map((role) => (role._id === saved._id ? saved : role)) : [saved, ...current];
    });
    setEditingRole(emptyRole);
  }

  async function removeConsultationScript(id) {
    await runAction(() => api.deleteConsultationScript(id), { success: "Đã xóa kịch bản tư vấn." });
    setConsultationScripts((current) => current.filter((script) => script._id !== id));
    setEditingConsultationScript(emptyConsultationScript);
  }

  async function sendManualReply() {
    const text = manualReplyDraft.trim();
    if (manualReplySending || !selectedMessagePageId || !selectedCustomerPsid || (!text && !manualReplyAttachment)) {
      return;
    }

    try {
      setManualReplySending(true);
      setManualReplyStatus({ type: "sending", text: "Đang gửi tin nhắn..." });
      const saved = await api.sendManualReply({
        pageBotId: selectedMessagePageId,
        customerPsid: selectedCustomerPsid,
        text,
        attachment: manualReplyAttachment
      });
      setMessages((current) => [saved.message, ...current]);
      upsertContext(saved.thread);
      setManualReplyDraft("");
      setManualReplyAttachment(null);
      setManualReplyStatus(null);
      notify("success", "Đã gửi tin nhắn.");
    } catch (error) {
      const message = getErrorMessage(error, "Gửi tin nhắn thất bại. Vui lòng thử lại.");
      setManualReplyStatus({
        type: "error",
        text: message
      });
      notify("error", message);
    } finally {
      setManualReplySending(false);
    }
  }

  async function refreshMessageData() {
    try {
      setMessagesRefreshing(true);
      const [latestPageBots, latestMessages, latestContexts, latestCompanies] = await Promise.all([
        api.getPageBots(),
        api.getMessages(),
        api.getContexts(),
        api.getCompanies()
      ]);
      setPageBots(latestPageBots);
      setMessages(latestMessages);
      setContexts(latestContexts);
      setCompanies(latestCompanies);
      setMessagesLastRefreshedAt(new Date());
    } finally {
      setMessagesRefreshing(false);
    }
  }

  async function refreshActiveTabData(tabId) {
    if (tabPermissions[tabId] && !can(tabPermissions[tabId])) {
      return;
    }
    if (tabId === "messages") {
      await refreshMessageData();
      return;
    }

    if (tabId === "bots") {
      const [latestPageBots, latestCompanies] = await Promise.all([api.getPageBots(), api.getCompanies()]);
      setPageBots(latestPageBots);
      setCompanies(latestCompanies);
      return;
    }

    if (tabId === "orders") {
      const [latestOrders, latestPageBots, latestCompanies] = await Promise.all([
        api.getOrders(),
        api.getPageBots(),
        api.getCompanies()
      ]);
      setOrders(latestOrders);
      setPageBots(latestPageBots);
      setCompanies(latestCompanies);
      return;
    }

    if (tabId === "contexts") {
      const [latestContexts, latestPageBots] = await Promise.all([api.getContexts(), api.getPageBots()]);
      setContexts(latestContexts);
      setPageBots(latestPageBots);
      return;
    }

    if (tabId === "simulator" || tabId === "test-bot") {
      const [latestPageBots, cases] = await Promise.all([api.getPageBots(), api.getSimulatorCases()]);
      setPageBots(latestPageBots);
      setSimulatorCases(cases);
      if (!simulatorDraft.pageBotId && latestPageBots[0]) {
        setSimulatorDraft((current) => ({ ...current, pageBotId: latestPageBots[0]._id }));
      }
      return;
    }

    if (tabId === "companies") {
      setCompanies(await api.getCompanies());
      return;
    }

    if (tabId === "promotions") {
      const [latestPromotions, latestCompanies, latestPageBots] = await Promise.all([
        api.getPromotions(),
        api.getCompanies(),
        api.getPageBots()
      ]);
      setPromotions(latestPromotions);
      setCompanies(latestCompanies);
      setPageBots(latestPageBots);
      return;
    }

    if (tabId === "consultation-scripts") {
      const [latestConsultationScripts, latestCompanies] = await Promise.all([
        api.getConsultationScripts(),
        api.getCompanies()
      ]);
      setConsultationScripts(latestConsultationScripts);
      setCompanies(latestCompanies);
      return;
    }

    if (tabId === "faqs") {
      const [latestFaqs, latestPageBots] = await Promise.all([api.getFaqs(), api.getPageBots()]);
      setFaqs(latestFaqs);
      setPageBots(latestPageBots);
      return;
    }

    if (tabId === "rules") {
      setRules(await api.getRules());
      return;
    }

    if (tabId === "settings") {
      const settings = await api.getSystemSettings();
      setRuntimeSettings({
        openaiModel: settings.openaiModel || defaultRuntimeSettings.openaiModel,
        maxOutputTokens: settings.maxOutputTokens || defaultRuntimeSettings.maxOutputTokens,
        maxFaqResults: settings.maxFaqResults ?? defaultRuntimeSettings.maxFaqResults,
        maxPromotionResults: settings.maxPromotionResults ?? defaultRuntimeSettings.maxPromotionResults,
        fileSearchMaxResults: settings.fileSearchMaxResults ?? defaultRuntimeSettings.fileSearchMaxResults,
        enableMessengerTemplates:
          settings.enableMessengerTemplates ?? defaultRuntimeSettings.enableMessengerTemplates,
        splitMessengerTextOnNewline:
          settings.splitMessengerTextOnNewline ?? defaultRuntimeSettings.splitMessengerTextOnNewline,
        splitMessengerTextDelayMs:
          settings.splitMessengerTextDelayMs ?? defaultRuntimeSettings.splitMessengerTextDelayMs,
        aggregateConsecutiveCustomerMessages:
          settings.aggregateConsecutiveCustomerMessages ??
          defaultRuntimeSettings.aggregateConsecutiveCustomerMessages,
        aggregateCustomerMessageDelayMs:
          settings.aggregateCustomerMessageDelayMs ?? defaultRuntimeSettings.aggregateCustomerMessageDelayMs
      });
      return;
    }

    if (tabId === "users") {
      setUsers(await api.getUsers());
      return;
    }

    if (tabId === "roles") {
      const [roleList, permissionList] = await Promise.all([api.getRoles(), api.getPermissions()]);
      setRoles(roleList);
      setPermissions(permissionList);
      return;
    }

    if (tabId === "reports") {
      setOperationsReport(await api.getOperationsReport(reportRange));
    }
  }

  function navigateToTab(tabId) {
    const nextHash = `#/admin/${tabId}`;
    if (window.location.hash === nextHash) {
      refreshActiveTabData(tabId);
    } else {
      window.location.hash = nextHash;
    }
    setMobileNavOpen(false);
  }

  async function login(event) {
    event.preventDefault();
    setLoginError("");
    try {
      const { token, user } = await api.login(loginDraft);
      setAuthToken(token);
      setAuthUser(user);
    } catch (error) {
      setLoginError("Tài khoản hoặc mật khẩu không đúng.");
    }
  }

  function logout() {
    setAuthToken("");
    setAuthUser(null);
  }

  function handleMessageThreadScroll(event) {
    const element = event.currentTarget;
    const distanceFromBottom = element.scrollHeight - element.scrollTop - element.clientHeight;
    if (distanceFromBottom > 80) {
      bottomRefreshArmedRef.current = true;
    }

    if (distanceFromBottom <= 24 && bottomRefreshArmedRef.current && !messagesRefreshing) {
      bottomRefreshArmedRef.current = false;
      refreshMessageData();
    }
  }

  function handleContentTouchStart(event) {
    if (window.innerWidth > 900 || event.currentTarget.scrollTop > 0) return;
    contentTouchStartYRef.current = event.touches[0]?.clientY ?? null;
  }

  function handleContentTouchMove(event) {
    if (window.innerWidth > 900 || contentTouchStartYRef.current == null || event.currentTarget.scrollTop > 0) return;
    const currentY = event.touches[0]?.clientY ?? contentTouchStartYRef.current;
    const distance = Math.max(0, currentY - contentTouchStartYRef.current);
    if (distance > 0) {
      setPullDistance(Math.min(distance, 96));
    }
  }

  async function handleContentTouchEnd() {
    if (window.innerWidth > 900) return;
    const shouldRefresh = pullDistance >= 72 && !contentRefreshing;
    contentTouchStartYRef.current = null;
    setPullDistance(0);
    if (!shouldRefresh) return;

    try {
      setContentRefreshing(true);
      await refreshActiveTabData(tab);
      notify("success", "Đã làm mới dữ liệu.");
    } catch (error) {
      notify("error", getErrorMessage(error, "Không thể làm mới dữ liệu."));
    } finally {
      setContentRefreshing(false);
    }
  }

  async function resumeBotReply() {
    if (!selectedMessagePageId || !selectedCustomerPsid) {
      return;
    }

    const saved = await runAction(() => api.resumeBotReply({
      pageBotId: selectedMessagePageId,
      customerPsid: selectedCustomerPsid
    }), { success: "Đã cho BOT tiếp tục trả lời." });
    upsertContext(saved);
  }

  async function runSimulatorEvent() {
    if (!simulatorDraft.pageBotId || !simulatorDraft.customerPsid || !simulatorDraft.text.trim()) {
      return;
    }

    try {
      setSimulatorRunning(true);
      const result = await runAction(() => api.runSimulatorEvent(simulatorDraft), { success: "Đã chạy giả lập." });
      setSimulatorResult(result);
      if (simulatorDraft.type !== "human_echo") {
        setSimulatorDraft((current) => ({ ...current, text: "" }));
      }
      const [latestMessages, latestContexts, latestOrders] = await Promise.all([
        api.getMessages(),
        api.getContexts(),
        api.getOrders()
      ]);
      setMessages(latestMessages);
      setContexts(latestContexts);
      setOrders(latestOrders);
    } finally {
      setSimulatorRunning(false);
    }
  }

  function resetBotTestSession() {
    setSimulatorDraft(emptySimulatorDraft);
    setSimulatorResult(null);
  }

  function handleBotTestComposerKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      runSimulatorEvent();
    }
  }

  function upsertContext(saved) {
    setContexts((current) => {
      const exists = current.some((context) => context._id === saved._id);
      return exists
        ? current.map((context) => (context._id === saved._id ? { ...context, ...saved } : context))
        : [saved, ...current];
    });
  }

  async function loadOperationsReport() {
    const report = await runAction(() => api.getOperationsReport(reportRange), { success: "Đã tải báo cáo." });
    setOperationsReport(report);
  }

  function exportReport(type, format) {
    if (!operationsReport) return;
    const isMessages = type === "messages";
    const rows = isMessages
      ? operationsReport.messages.map((message) => ({
          ThoiGian: formatDateTime(message.createdAt),
          Page: message.pageName,
          KhachHang: customerDisplayName({ customerPsid: message.customerPsid, profile: message.customerProfile }),
          Huong: message.direction,
          NguoiGui: message.senderType,
          NoiDung: message.text
        }))
      : operationsReport.orders.map((order) => ({
          ThoiGian: formatDateTime(order.createdAt),
          Page: order.pageName,
          KhachHang: order.customerId,
          SoDienThoai: order.phoneNumber,
          DiaChi: order.address,
          TongTien: order.total,
          GhiChu: order.note
        }));
    const baseName = `${isMessages ? "lich-su-tin-nhan" : "don-hang"}-${reportRange.fromDate}-${reportRange.toDate}`;
    if (format === "json") downloadJson(rows, `${baseName}.json`);
    else if (format === "txt") downloadText(rows, `${baseName}.txt`);
    else downloadCsv(rows, `${baseName}.csv`);
    notify("success", `Đã xuất ${isMessages ? "lịch sử tin nhắn" : "đơn hàng"} dạng ${format.toUpperCase()}.`);
  }

  async function savePromotion() {
    const saved = await runAction(() => api.savePromotion(editingPromotion), { success: "Đã lưu khuyến mãi." });
    setPromotions((current) => {
      const exists = current.some((promotion) => promotion._id === saved._id);
      return exists
        ? current.map((promotion) => (promotion._id === saved._id ? saved : promotion))
        : [saved, ...current];
    });
    setEditingPromotion({ ...emptyPromotion, companyId: editingPromotion.companyId });
  }

  async function removePromotion(id) {
    await runAction(() => api.deletePromotion(id), { success: "Đã xóa khuyến mãi." });
    setPromotions((current) => current.filter((promotion) => promotion._id !== id));
    setEditingPromotion(emptyPromotion);
  }

  async function saveRuntimeSettings() {
    const saved = await runAction(() => api.saveSystemSettings(runtimeSettings), { success: "Đã lưu cấu hình hệ thống." });
    setRuntimeSettings({
      openaiModel: saved.openaiModel,
      maxOutputTokens: saved.maxOutputTokens,
      maxFaqResults: saved.maxFaqResults,
      maxPromotionResults: saved.maxPromotionResults,
      fileSearchMaxResults: saved.fileSearchMaxResults,
      enableMessengerTemplates: saved.enableMessengerTemplates,
      splitMessengerTextOnNewline: saved.splitMessengerTextOnNewline,
      splitMessengerTextDelayMs: saved.splitMessengerTextDelayMs,
      aggregateConsecutiveCustomerMessages: saved.aggregateConsecutiveCustomerMessages,
      aggregateCustomerMessageDelayMs: saved.aggregateCustomerMessageDelayMs
    });
  }

  function openOrderDialog(order) {
    setSelectedOrder(order);
    setOrderDraft({
      ...order,
      items: order.items?.length ? order.items.map((item) => ({ ...item })) : [{ name: "", quantity: 1, unitPrice: 0 }]
    });
  }

  function closeOrderDialog() {
    setSelectedOrder(null);
    setOrderDraft(null);
  }

  function updateOrderDraft(patch) {
    setOrderDraft((current) => ({ ...current, ...patch }));
  }

  function updateOrderItem(index, patch) {
    setOrderDraft((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item))
    }));
  }

  function addOrderItem() {
    setOrderDraft((current) => ({
      ...current,
      items: [...(current.items || []), { name: "", quantity: 1, unitPrice: 0 }]
    }));
  }

  function removeOrderItem(index) {
    setOrderDraft((current) => ({
      ...current,
      items: current.items.filter((_, itemIndex) => itemIndex !== index)
    }));
  }

  const canEditSelectedOrder = selectedOrder ? isSameLocalDay(selectedOrder.createdAt) : false;

  async function saveSelectedOrder() {
    if (!orderDraft?._id || !canEditSelectedOrder) {
      return;
    }

    const payload = {
      ...orderDraft,
      total: Number(orderDraft.total) || 0,
      items: (orderDraft.items || [])
        .filter((item) => item.name.trim())
        .map((item) => ({
          name: item.name.trim(),
          quantity: Number(item.quantity) || 1,
          unitPrice: Number(item.unitPrice) || 0
        }))
    };
    try {
      const saved = await runAction(() => api.saveOrder(payload), { success: "Đã cập nhật đơn hàng." });
      const merged = { ...saved, customerProfile: selectedOrder.customerProfile };
      setOrders((current) => current.map((order) => (order._id === saved._id ? merged : order)));
      setSelectedOrder(merged);
      setOrderDraft({
        ...merged,
        items: merged.items?.length ? merged.items.map((item) => ({ ...item })) : [{ name: "", quantity: 1, unitPrice: 0 }]
      });
    } catch (error) {
      notify("error", getErrorMessage(error, "Không thể cập nhật đơn hàng."));
    }
  }

  function updatePromotionVersion(index, patch) {
    setEditingPromotion((current) => ({
      ...current,
      versions: current.versions.map((version, versionIndex) =>
        versionIndex === index ? { ...version, ...patch } : version
      )
    }));
  }

  function setActivePromotionVersion(index) {
    setEditingPromotion((current) => ({
      ...current,
      versions: current.versions.map((version, versionIndex) => ({
        ...version,
        active: versionIndex === index
      }))
    }));
  }

  if (!authReady) {
    return <div className="auth-loading">Đang kiểm tra phiên đăng nhập...</div>;
  }

  if (!authUser) {
    return (
      <main className="auth-shell">
        <form className="auth-card" onSubmit={login}>
          <div className="brand-mark">
            <Sparkles size={18} />
          </div>
          <div>
            <p className="eyebrow">Bot Manager</p>
            <h1>Đăng nhập quản trị</h1>
          </div>
          <Input
            label="Tài khoản"
            value={loginDraft.username}
            onChange={(value) => setLoginDraft({ ...loginDraft, username: value })}
          />
          <Input
            label="Mật khẩu"
            type="password"
            value={loginDraft.password}
            onChange={(value) => setLoginDraft({ ...loginDraft, password: value })}
          />
          {loginError && <p className="auth-error">{loginError}</p>}
          <button className="primary" type="submit">
            Đăng nhập
          </button>
        </form>
      </main>
    );
  }

  return (
    <div className={`app-shell ${sidebarCollapsed ? "sidebar-collapsed" : ""} ${showMobileHeader ? "" : "mobile-header-hidden"}`}>
      <MobileNavigation
        authUser={authUser}
        tab={tab}
        open={mobileNavOpen}
        showHeader={showMobileHeader}
        variant={mobileNavVariant}
        onOpenChange={setMobileNavOpen}
        onNavigate={navigateToTab}
        onLogout={logout}
      />
      <DesktopSidebar
        authUser={authUser}
        collapsed={sidebarCollapsed}
        openGroups={openGroups}
        tab={tab}
        onCollapseToggle={() => setSidebarCollapsed((current) => !current)}
        onGroupToggle={(groupId) => setOpenGroups((current) => ({ ...current, [groupId]: !current[groupId] }))}
        onNavigate={navigateToTab}
        onLogout={logout}
      />

      <div className="toast-stack" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast ${toast.type}`}>
            {toast.message}
          </div>
        ))}
      </div>

      <main
        className={`content ${tab === "messages" || tab === "test-bot" ? "messages-mode" : tab === "orders" ? "orders-mode" : ""}`}
        onTouchStart={handleContentTouchStart}
        onTouchMove={handleContentTouchMove}
        onTouchEnd={handleContentTouchEnd}
      >
        <div className={`pull-refresh-indicator ${pullDistance > 0 || contentRefreshing ? "visible" : ""}`}>
          <RefreshCw size={16} className={contentRefreshing ? "spinning" : ""} />
          <span>{contentRefreshing ? "Đang làm mới..." : pullDistance >= 72 ? "Thả để làm mới" : "Kéo để làm mới"}</span>
        </div>
        <header className="page-header">
          <div>
            <p className="eyebrow">Bảng điều khiển</p>
            <h1>{pageTitle(tab)}</h1>
          </div>
          {tab === "messages" ? (
            <div className="header-actions">
              <span className="muted-inline">
                {messagesLastRefreshedAt
                  ? `Cập nhật lúc ${formatTime(messagesLastRefreshedAt)}`
                  : "Cuộn xuống cuối để tải mới"}
              </span>
              <button className="ghost-button compact" onClick={refreshMessageData} disabled={messagesRefreshing}>
                <RefreshCw size={16} className={messagesRefreshing ? "spinning" : ""} />
                Làm mới page và tin nhắn
              </button>
            </div>
          ) : (
            <div className="status-pill">
              <CircleCheckBig size={16} />
              Hệ thống sẵn sàng
            </div>
          )}
        </header>

        <section className="stats-grid">
          {stats.map(({ label, value, icon: Icon }) => (
            <article key={label} className="stat-card">
              <div className="stat-icon">
                <Icon size={18} />
              </div>
              <div>
                <strong>{value}</strong>
                <span>{label}</span>
              </div>
            </article>
          ))}
        </section>

        {tab === "bots" && (
          <section className="workspace-grid">
            <Panel
              title="Danh sách page"
              action={
                <button className="ghost-button" onClick={() => setEditingBot(emptyPageBot)}>
                  <Plus size={16} />
                  Tạo mới
                </button>
              }
            >
              <div className="filter-bar">
                <Input label="Tìm page" value={pageSearch} onChange={setPageSearch} />
                <label>
                  <span>Lọc theo công ty</span>
                  <select value={pageCompanyFilter} onChange={(event) => setPageCompanyFilter(event.target.value)}>
                    <option value="">Tất cả công ty</option>
                    {companies.map((company) => (
                      <option key={company._id} value={company.companyId}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="list">
                {pageBots.length === 0 && <EmptyState title="Chưa có page bot" body="Tạo bot đầu tiên để bắt đầu tự động trả lời." />}
                {pageBots.length > 0 && filteredPageBots.length === 0 && (
                  <EmptyState title="Không có page phù hợp" body="Thử đổi từ khóa tìm kiếm hoặc bộ lọc công ty." />
                )}
                {filteredPageBots.map((bot) => (
                  <button
                    key={bot._id}
                    className={`row ${editingBot._id === bot._id ? "selected" : ""}`}
                    onClick={() => setEditingBot(bot)}
                  >
                    <div className="customer-heading">
                      <PageAvatar page={bot} />
                      <strong>{bot.pageName}</strong>
                    </div>
                    <span>{bot.pageId}</span>
                    <small>
                      {companyNameById(companies, bot.companyId)} · {bot.enabled ? "Active" : "Inactive"}
                    </small>
                  </button>
                ))}
              </div>
            </Panel>

            <Editor
              title={editingBot._id ? "Cập nhật bot" : "Tạo bot"}
              action={
                <ToggleSwitch
                  checked={Boolean(editingBot.enabled)}
                  onChange={(checked) => setEditingBot({ ...editingBot, enabled: checked })}
                  label={editingBot.enabled ? "Đang bật" : "Đang tắt"}
                />
              }
              footer={
                <div className="bot-form-actions">
                  {editingBot._id ? (
                    <button className="danger compact" onClick={() => removeBot(editingBot._id)}>
                      <Trash2 size={16} />
                      Xóa bot
                    </button>
                  ) : (
                    <span />
                  )}
                  <button className="primary compact save-bot-button" onClick={saveBot}>
                    <Save size={16} />
                    Lưu thay đổi
                  </button>
                </div>
              }
              onSave={saveBot}
            >
              <div className="form-grid">
                <Input label="Tên page" value={editingBot.pageName} onChange={(value) => setEditingBot({ ...editingBot, pageName: value })} />
                <Input label="Page ID" value={editingBot.pageId} onChange={(value) => setEditingBot({ ...editingBot, pageId: value })} />
              </div>
              <label>
                <span>Công ty quản lý</span>
                <select
                  value={editingBot.companyId || ""}
                  onChange={(event) => setEditingBot({ ...editingBot, companyId: event.target.value })}
                >
                  <option value="">Chưa gán công ty</option>
                  {companies.map((company) => (
                    <option key={company._id} value={company.companyId}>
                      {company.name} ({company.companyId})
                    </option>
                  ))}
                </select>
              </label>
              <Input label="Page access token" value={editingBot.accessToken} onChange={(value) => setEditingBot({ ...editingBot, accessToken: value })} />
              {editingBot._id && (
                <button className="ghost-button" onClick={syncPageBotProfile}>
                  <Save size={16} />
                  Đồng bộ avatar từ Meta
                </button>
              )}
              <Input label="Vector store ID" value={editingBot.vectorStoreId} onChange={(value) => setEditingBot({ ...editingBot, vectorStoreId: value })} />
              <div className="form-grid">
                <Input label="Phong cách trò chuyện" value={editingBot.persona.tone} onChange={(value) => setEditingBot({ ...editingBot, persona: { ...editingBot.persona, tone: value } })} />
                <Input label="Cách xưng hô" value={editingBot.persona.pronouns} onChange={(value) => setEditingBot({ ...editingBot, persona: { ...editingBot.persona, pronouns: value } })} />
              </div>
              <Textarea label="Thông tin doanh nghiệp" value={editingBot.persona.businessInfo} onChange={(value) => setEditingBot({ ...editingBot, persona: { ...editingBot.persona, businessInfo: value } })} />
              <div className="form-grid">
                <Textarea label="Chính sách báo giá" value={editingBot.pricingPolicy} onChange={(value) => setEditingBot({ ...editingBot, pricingPolicy: value })} />
                <Textarea label="Chính sách phí ship" value={editingBot.shippingPolicy || ""} onChange={(value) => setEditingBot({ ...editingBot, shippingPolicy: value })} />
                <Textarea label="Khuyến mãi" value={editingBot.promotionPolicy} onChange={(value) => setEditingBot({ ...editingBot, promotionPolicy: value })} />
              </div>
              <div className="handoff-card">
                <div>
                  <strong>Ngừng BOT khi người thật can thiệp</strong>
                  <span>BOT sẽ tự trả lời lại khi hết thời gian chờ.</span>
                </div>
                <ToggleSwitch
                  checked={Boolean(editingBot.humanHandoffEnabled)}
                  onChange={(checked) => setEditingBot({ ...editingBot, humanHandoffEnabled: checked })}
                  label={editingBot.humanHandoffEnabled ? "Đang dùng" : "Tắt"}
                />
                <label className="time-pill">
                  <span>Trả lời lại sau</span>
                  <input
                    type="number"
                    min="1"
                    value={editingBot.humanHandoffResumeAfterMinutes ?? 30}
                    onChange={(event) =>
                      setEditingBot({
                        ...editingBot,
                        humanHandoffResumeAfterMinutes: Math.max(1, Number(event.target.value) || 1)
                      })
                    }
                  />
                  <small>phút</small>
                </label>
              </div>
            </Editor>
          </section>
        )}

        {tab === "companies" && (
          <section className="workspace-grid">
            <Panel
              title="Danh sách công ty"
              action={
                <button className="ghost-button" onClick={() => setEditingCompany(emptyCompany)}>
                  <Plus size={16} />
                  Tạo mới
                </button>
              }
            >
              <div className="list">
                {companies.length === 0 && (
                  <EmptyState title="Chưa có công ty" body="Thêm thông tin công ty để quản lý cấu hình kinh doanh tập trung." />
                )}
                {companies.map((company) => (
                  <button
                    key={company._id}
                    className={`row ${editingCompany._id === company._id ? "selected" : ""}`}
                    onClick={() => setEditingCompany(company)}
                  >
                    <strong>{company.name}</strong>
                    <span>{company.companyId}</span>
                    <small>{company.hotline || "Chưa có hotline"}</small>
                  </button>
                ))}
              </div>
            </Panel>

            <Editor title={editingCompany._id ? "Cập nhật công ty" : "Tạo công ty"} onSave={saveCompany}>
              <div className="form-grid">
                <Input label="Company ID" value={editingCompany.companyId} onChange={(value) => setEditingCompany({ ...editingCompany, companyId: value })} />
                <Input label="Tên công ty" value={editingCompany.name} onChange={(value) => setEditingCompany({ ...editingCompany, name: value })} />
              </div>
              <Input label="Tiêu đề / thương hiệu hiển thị" value={editingCompany.title} onChange={(value) => setEditingCompany({ ...editingCompany, title: value })} />
              <Input label="Hotline" value={editingCompany.hotline} onChange={(value) => setEditingCompany({ ...editingCompany, hotline: value })} />
              <Textarea label="Địa chỉ" value={editingCompany.address} onChange={(value) => setEditingCompany({ ...editingCompany, address: value })} />
              {editingCompany._id && (
                <button className="danger" onClick={() => removeCompany(editingCompany._id)}>
                  <Trash2 size={16} />
                  Xóa công ty
                </button>
              )}
            </Editor>
          </section>
        )}

        {tab === "consultation-scripts" && (
          <section className="workspace-grid">
            <Panel
              title="Kịch bản tư vấn theo công ty"
              action={
                <button
                  className="ghost-button"
                  onClick={() =>
                    setEditingConsultationScript({
                      ...emptyConsultationScript,
                      companyId: companies[0]?.companyId || ""
                    })
                  }
                >
                  <Plus size={16} />
                  Tạo mới
                </button>
              }
            >
              <div className="list">
                {consultationScripts.length === 0 && (
                  <EmptyState title="Chưa có kịch bản" body="Tạo kịch bản để bot dùng chung theo từng công ty." />
                )}
                {consultationScripts.map((script) => (
                  <button
                    key={script._id}
                    className={`row ${editingConsultationScript._id === script._id ? "selected" : ""}`}
                    onClick={() => setEditingConsultationScript(script)}
                  >
                    <strong>{script.name}</strong>
                    <span>{companyNameById(companies, script.companyId)}</span>
                    <small>
                      {script.enabled ? "Đang bật" : "Đã tắt"} · Ưu tiên {script.priority}
                    </small>
                  </button>
                ))}
              </div>
            </Panel>

            <Editor
              title={editingConsultationScript._id ? "Cập nhật kịch bản" : "Tạo kịch bản"}
              onSave={saveConsultationScript}
            >
              <div className="form-grid">
                <Input
                  label="Tên kịch bản"
                  value={editingConsultationScript.name}
                  onChange={(value) =>
                    setEditingConsultationScript({
                      ...editingConsultationScript,
                      name: value
                    })
                  }
                />
                <label>
                  <span>Công ty</span>
                  <select
                    value={editingConsultationScript.companyId || ""}
                    onChange={(event) =>
                      setEditingConsultationScript({
                        ...editingConsultationScript,
                        companyId: event.target.value
                      })
                    }
                  >
                    <option value="">Chọn công ty</option>
                    {companies.map((company) => (
                      <option key={company._id} value={company.companyId}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <Input
                label="Độ ưu tiên"
                type="number"
                value={editingConsultationScript.priority}
                onChange={(value) =>
                  setEditingConsultationScript({
                    ...editingConsultationScript,
                    priority: Number(value)
                  })
                }
              />
              <Textarea
                label="Nội dung kịch bản"
                value={editingConsultationScript.content}
                onChange={(value) =>
                  setEditingConsultationScript({
                    ...editingConsultationScript,
                    content: value
                  })
                }
              />
              <Textarea
                label="Ví dụ hội thoại"
                value={editingConsultationScript.examples || ""}
                onChange={(value) =>
                  setEditingConsultationScript({
                    ...editingConsultationScript,
                    examples: value
                  })
                }
              />
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={Boolean(editingConsultationScript.enabled)}
                  onChange={(event) =>
                    setEditingConsultationScript({
                      ...editingConsultationScript,
                      enabled: event.target.checked
                    })
                  }
                />
                <span>Bật kịch bản này</span>
              </label>
              {editingConsultationScript._id && (
                <button className="danger" onClick={() => removeConsultationScript(editingConsultationScript._id)}>
                  <Trash2 size={16} />
                  Xóa kịch bản
                </button>
              )}
            </Editor>
          </section>
        )}

        {tab === "promotions" && (
          <section className="workspace-grid">
            <Panel
              title="Chương trình khuyến mãi"
              action={
                <button
                  className="ghost-button"
                  onClick={() => setEditingPromotion({ ...emptyPromotion, companyId: companies[0]?.companyId || "" })}
                >
                  <Plus size={16} />
                  Tạo mới
                </button>
              }
            >
              <div className="list">
                {promotions.length === 0 && (
                  <EmptyState title="Chưa có khuyến mãi" body="Tạo campaign, thêm phiên bản và chọn page áp dụng." />
                )}
                {promotions.map((promotion) => {
                  const activeVersion = promotion.versions?.find((version) => version.active);
                  return (
                    <button
                      key={promotion._id}
                      className={`row ${editingPromotion._id === promotion._id ? "selected" : ""}`}
                      onClick={() => setEditingPromotion(promotion)}
                    >
                      <strong>{promotion.name}</strong>
                      <span>{companyNameById(companies, promotion.companyId)}</span>
                      <small>
                        {promotion.enabled ? "Đang bật" : "Đã tắt"} · {promotion.pageBotIds?.length || 0} page ·{" "}
                        {activeVersion?.name || "Chưa có version active"}
                      </small>
                    </button>
                  );
                })}
              </div>
            </Panel>

            <Editor title={editingPromotion._id ? "Cập nhật khuyến mãi" : "Tạo khuyến mãi"} onSave={savePromotion}>
              <div className="form-grid">
                <Input label="Tên chương trình" value={editingPromotion.name} onChange={(value) => setEditingPromotion({ ...editingPromotion, name: value })} />
                <label>
                  <span>Công ty</span>
                  <select
                    value={editingPromotion.companyId || ""}
                    onChange={(event) => setEditingPromotion({ ...editingPromotion, companyId: event.target.value, pageBotIds: [] })}
                  >
                    <option value="">Chọn công ty</option>
                    {companies.map((company) => (
                      <option key={company._id} value={company.companyId}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <Textarea label="Mô tả nội bộ" value={editingPromotion.description} onChange={(value) => setEditingPromotion({ ...editingPromotion, description: value })} />
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={Boolean(editingPromotion.enabled)}
                  onChange={(event) => setEditingPromotion({ ...editingPromotion, enabled: event.target.checked })}
                />
                <span>Bật chương trình này</span>
              </label>

              <div className="page-check-grid">
                {pageBots
                  .filter((bot) => !editingPromotion.companyId || bot.companyId === editingPromotion.companyId)
                  .map((bot) => (
                    <label key={bot._id} className="checkbox-row">
                      <input
                        type="checkbox"
                        checked={(editingPromotion.pageBotIds || []).some((id) => String(id) === String(bot._id))}
                        onChange={(event) => {
                          const current = editingPromotion.pageBotIds || [];
                          setEditingPromotion({
                            ...editingPromotion,
                            pageBotIds: event.target.checked
                              ? [...current, bot._id]
                              : current.filter((id) => String(id) !== String(bot._id))
                          });
                        }}
                      />
                      <span>{bot.pageName}</span>
                    </label>
                  ))}
              </div>

              <div className="version-list">
                {(editingPromotion.versions || []).map((version, index) => (
                  <div key={version._id || index} className="version-card">
                    <div className="form-grid">
                      <Input label="Tên phiên bản" value={version.name} onChange={(value) => updatePromotionVersion(index, { name: value })} />
                      <label className="checkbox-row">
                        <input type="radio" checked={Boolean(version.active)} onChange={() => setActivePromotionVersion(index)} />
                        <span>Active</span>
                      </label>
                    </div>
                    <Textarea label="Nội dung khuyến mãi áp dụng" value={version.content} onChange={(value) => updatePromotionVersion(index, { content: value })} />
                    {editingPromotion.versions.length > 1 && (
                      <button
                        className="danger"
                        onClick={() =>
                          setEditingPromotion({
                            ...editingPromotion,
                            versions: editingPromotion.versions.filter((_, versionIndex) => versionIndex !== index)
                          })
                        }
                      >
                        <Trash2 size={16} />
                        Xóa phiên bản
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                className="ghost-button"
                onClick={() =>
                  setEditingPromotion({
                    ...editingPromotion,
                    versions: [
                      ...(editingPromotion.versions || []),
                      { name: `Phiên bản ${(editingPromotion.versions || []).length + 1}`, content: "", active: false }
                    ]
                  })
                }
              >
                <Plus size={16} />
                Thêm phiên bản
              </button>

              {editingPromotion._id && (
                <button className="danger" onClick={() => removePromotion(editingPromotion._id)}>
                  <Trash2 size={16} />
                  Xóa chương trình
                </button>
              )}
            </Editor>
          </section>
        )}

        {tab === "messages" && (
          <section className="messenger-shell">
            <aside className="messenger-sidebar">
              <div className="messenger-section">
                <h2>Page</h2>
                <div className="messenger-filters">
                  <input
                    placeholder="Tìm page..."
                    value={messagePageSearch}
                    onChange={(event) => setMessagePageSearch(event.target.value)}
                  />
                  <select
                    value={messagePageCompanyFilter}
                    onChange={(event) => setMessagePageCompanyFilter(event.target.value)}
                  >
                    <option value="">Tất cả công ty</option>
                    {companies.map((company) => (
                      <option key={company._id} value={company.companyId}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="messenger-list">
                  {pageBots.length === 0 && <EmptyState title="Chưa có page" body="Tạo page bot trước để bắt đầu nhận tin nhắn." />}
                  {pageBots.length > 0 && filteredMessagePageBots.length === 0 && (
                    <EmptyState title="Không có page phù hợp" body="Thử đổi từ khóa hoặc công ty đang lọc." />
                  )}
                  {filteredMessagePageBots.map((bot) => (
                    <button
                      key={bot._id}
                      className={`messenger-item ${selectedMessagePageId === bot._id ? "selected" : ""}`}
                      onClick={() => setSelectedMessagePageId(bot._id)}
                    >
                      <div className="customer-heading">
                        <PageAvatar page={bot} />
                        <strong>{bot.pageName}</strong>
                      </div>
                      <span>{customerCountByPage[bot._id]?.size || 0} khách đã nhắn</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="messenger-section customers">
                <h2>Khách hàng</h2>
                <div className="messenger-list">
                  {customersForSelectedPage.length === 0 && (
                    <EmptyState title="Chưa có khách nhắn tin" body="Khi page nhận tin, khách sẽ xuất hiện ở danh sách này." />
                  )}
                  {customersForSelectedPage.map((customer) => (
                    <button
                      key={customer.customerPsid}
                      className={`messenger-item customer ${selectedCustomerPsid === customer.customerPsid ? "selected" : ""}`}
                      onClick={() => setSelectedCustomerPsid(customer.customerPsid)}
                    >
                      <Avatar profile={customer.profile} fallback={customer.customerPsid} />
                      <div>
                        <strong>{customerDisplayName(customer)}</strong>
                        <span>{customer.messages.at(-1)?.text || "-"}</span>
                      </div>
                      <div className="customer-side-meta">
                        <small>{formatRelativeDate(customer.lastMessageAt)}</small>
                        <em>
                          {isBotReplyPaused(
                            contexts.find(
                              (context) =>
                                String(context.pageBotId) === String(selectedMessagePageId) &&
                                context.customerPsid === customer.customerPsid
                            ),
                            now,
                            selectedPageBot
                          )
                            ? "Người thật giữ"
                            : "BOT"}
                        </em>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </aside>

            <section className="messenger-chat">
              {!selectedConversation ? (
                <EmptyState title="Chưa chọn hội thoại" body="Chọn một khách hàng để xem toàn bộ lịch sử trao đổi." />
              ) : (
                <>
                  <header>
                    <div>
                      <div className="customer-heading">
                        <Avatar profile={selectedConversation.profile} fallback={selectedConversation.customerPsid} />
                        <div className="customer-copy">
                          <strong>{customerDisplayName(selectedConversation)}</strong>
                          <span>{selectedConversation.customerPsid}</span>
                        </div>
                      </div>
                    </div>
                    <div className="conversation-meta">
                      <strong>{selectedPageBot?.pageName}</strong>
                      <span>{selectedConversation.messages.length} tin nhắn</span>
                    </div>
                  </header>
                  <div className="conversation-status">
                    <div>
                      <strong>{getConversationStatusLabel(selectedConversationThread, now, selectedPageBot)}</strong>
                      <span>{getConversationStatusDetail(selectedConversationThread, selectedPageBot, now)}</span>
                    </div>
                    {isBotReplyPaused(selectedConversationThread, now, selectedPageBot) && (
                      <button className="resume-bot-button compact" onClick={resumeBotReply}>
                        Nhường cho BOT trả lời
                      </button>
                    )}
                  </div>
                  <div
                    ref={messageScrollRef}
                    className="message-thread messenger-scroll"
                    onScroll={handleMessageThreadScroll}
                  >
                    {selectedConversationGroups.map((group) => (
                      <section key={group.dayKey} className="message-day">
                        <div className="day-divider">
                          <span>{group.label}</span>
                        </div>
                        {group.messages.map((message) => (
                          <div key={message._id} className={`message-row ${message.direction}`}>
                            {message.direction === "inbound" && (
                              <Avatar
                                profile={selectedConversation.profile}
                                fallback={selectedConversation.customerPsid}
                              />
                            )}
                            <div className={`message-bubble ${message.direction}`}>
                              <MessageContent message={message} />
                              <time>{formatTime(message.createdAt)}</time>
                            </div>
                            {message.direction === "outbound" && (
                              <span className={`bot-avatar ${message.senderType === "human" ? "human" : ""}`}>
                                {message.senderType === "human" ? "H" : "B"}
                              </span>
                            )}
                          </div>
                        ))}
                      </section>
                    ))}
                    <div ref={latestMessageRef} />
                  </div>
                  <div className="reply-composer">
                    {manualReplyStatus && (
                      <div className={`composer-banner ${manualReplyStatus.type}`}>
                        {manualReplyStatus.type === "sending" ? (
                          <RefreshCw size={15} className="spinning" />
                        ) : (
                          <X size={15} />
                        )}
                        <span>{manualReplyStatus.text}</span>
                      </div>
                    )}
                    {manualReplyAttachment && (
                      <div className="attachment-chip">
                        <span>{manualReplyAttachment.name}</span>
                        <button onClick={() => setManualReplyAttachment(null)} title="Bỏ đính kèm">
                          <X size={14} />
                        </button>
                      </div>
                    )}
                    <div className="composer-row">
                      <label className="attachment-button" title="Đính kèm ảnh hoặc video">
                        <Paperclip size={18} />
                        <input
                          type="file"
                          accept="image/*,video/*"
                          onChange={(event) => setManualReplyAttachment(event.target.files?.[0] || null)}
                        />
                      </label>
                      <textarea
                        placeholder="Trả lời khách..."
                        value={manualReplyDraft}
                        onChange={(event) => setManualReplyDraft(event.target.value)}
                      />
                      <button
                        className={`send-button ${manualReplySending ? "sending" : ""}`}
                        onClick={sendManualReply}
                        disabled={manualReplySending || (!manualReplyDraft.trim() && !manualReplyAttachment)}
                        title={manualReplySending ? "Đang gửi" : "Gửi"}
                      >
                        {manualReplySending ? <RefreshCw size={18} className="spinning" /> : <SendHorizontal size={18} />}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </section>
          </section>
        )}

        {tab === "orders" && (
          <section className="orders-layout">
            <Panel title="Danh sách page" className="orders-sidebar-panel">
              <div className="filter-bar">
                <Input label="Tìm page" value={orderPageSearch} onChange={setOrderPageSearch} />
                <label>
                  <span>Lọc theo công ty</span>
                  <select
                    value={orderPageCompanyFilter}
                    onChange={(event) => {
                      setOrderPageCompanyFilter(event.target.value);
                      setOrderPageFilter("");
                      setOrderCustomerFilter("");
                    }}
                  >
                    <option value="">Tất cả công ty</option>
                    {companies.map((company) => (
                      <option key={company._id} value={company.companyId}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="list">
                {filteredOrderPageBots.map((bot) => {
                  const summary = orderSummaryByPage[bot.pageId];
                  return (
                    <button
                      key={bot._id}
                      className={`row ${String(selectedOrderPageId) === String(bot.pageId) ? "selected" : ""}`}
                      onClick={() => {
                        setOrderPageFilter(bot.pageId);
                        setOrderCustomerFilter("");
                      }}
                    >
                      <strong>{bot.pageName}</strong>
                      <span>{summary?.count || 0} đơn hàng</span>
                      <small>{(summary?.total || 0).toLocaleString("vi-VN")} đ</small>
                    </button>
                  );
                })}
              </div>

              <div className="sidebar-subsection">
                <h2>Khách hàng có đơn</h2>
                <div className="order-summary-grid customers sidebar-summary">
                  {selectedPageCustomers.map((summary) => (
                    <button
                      key={summary.key}
                      className={`order-summary-card ${orderCustomerFilter === summary.key ? "selected" : ""}`}
                      onClick={() =>
                        setOrderCustomerFilter((current) => (current === summary.key ? "" : summary.key))
                      }
                    >
                      <div className="customer-heading">
                        <Avatar profile={summary.profile} fallback={summary.customerId} />
                        <strong>{summary.customerName}</strong>
                      </div>
                      <span>{summary.count} đơn</span>
                      <small>{summary.total.toLocaleString("vi-VN")} đ</small>
                    </button>
                  ))}
                </div>
              </div>
            </Panel>

            <section className="orders-main">
              <Panel title={pageBots.find((bot) => bot.pageId === selectedOrderPageId)?.pageName || "Đơn hàng"}>
                <div className="orders-overview">
                  <article>
                    <span>Tổng đơn</span>
                    <strong>{selectedPageOrderSummary?.count || 0}</strong>
                  </article>
                  <article>
                    <span>Doanh thu</span>
                    <strong>{(selectedPageOrderSummary?.total || 0).toLocaleString("vi-VN")} đ</strong>
                  </article>
                  <article>
                    <span>Khách có đơn</span>
                    <strong>{selectedPageCustomers.length}</strong>
                  </article>
                </div>
              </Panel>

              <Panel
                title="Đơn hàng"
                action={
                  orderCustomerFilter && (
                    <button className="ghost-button compact" onClick={() => setOrderCustomerFilter("")}>
                      Xóa lọc khách
                    </button>
                  )
                }
              >
                {orders.length === 0 ? (
                  <EmptyState title="Chưa có đơn hàng" body="Khi bot ghi nhận đơn, dữ liệu sẽ xuất hiện tại đây." />
                ) : (
                  <div className="table">
                    <div className="table-head">
                      <span>Khách</span>
                      <span>SĐT</span>
                      <span>Địa chỉ</span>
                      <span>Tổng tiền</span>
                    </div>
                    {filteredOrders.map((order) => (
                      <button className="table-row order-row" key={order._id} onClick={() => openOrderDialog(order)}>
                        <span>
                          {customerDisplayName({
                            customerPsid: order.customerId,
                            profile: order.customerProfile
                          })}
                        </span>
                        <span>{order.phoneNumber || "-"}</span>
                        <span>{order.address || "-"}</span>
                        <span>{order.total.toLocaleString("vi-VN")} đ</span>
                      </button>
                    ))}
                  </div>
                )}
              </Panel>
            </section>
          </section>
        )}

        {selectedOrder && orderDraft && (
          <div className="modal-backdrop" onClick={closeOrderDialog}>
            <section className="order-dialog" onClick={(event) => event.stopPropagation()}>
              <div className="panel-header">
                <div>
                  <h2>Cập nhật đơn hàng</h2>
                  <span className="muted-inline">{formatDateTime(selectedOrder.createdAt)}</span>
                </div>
                <div className="report-export-actions">
                  <button className="ghost-button compact" onClick={closeOrderDialog}>
                    Đóng
                  </button>
                </div>
              </div>

              <div className="order-dialog-meta">
                <article className="order-customer-card">
                  <span>Khách hàng</span>
                  <div className="customer-heading">
                    <Avatar profile={selectedOrder.customerProfile} fallback={selectedOrder.customerId} />
                    <strong>
                      {customerDisplayName({
                        customerPsid: selectedOrder.customerId,
                        profile: selectedOrder.customerProfile
                      })}
                    </strong>
                  </div>
                </article>
                <label>
                  <span>SĐT</span>
                  <input value={orderDraft.phoneNumber || ""} onChange={(event) => updateOrderDraft({ phoneNumber: event.target.value })} />
                </label>
                <label>
                  <span>Địa chỉ</span>
                  <input value={orderDraft.address || ""} onChange={(event) => updateOrderDraft({ address: event.target.value })} />
                </label>
                <label>
                  <span>Tổng tiền</span>
                  <input
                    type="number"
                    value={orderDraft.total || 0}
                    onChange={(event) => updateOrderDraft({ total: event.target.value })}
                  />
                </label>
              </div>

              <div className="order-edit-section">
                <div className="panel-header compact-header">
                  <h2>Sản phẩm</h2>
                  <button className="ghost-button compact" onClick={addOrderItem}>
                    <Plus size={16} />
                    Thêm dòng
                  </button>
                </div>
                {(orderDraft.items || []).map((item, index) => (
                  <div className="order-item-editor" key={`${orderDraft._id}-${index}`}>
                    <Input
                      label="Tên sản phẩm"
                      value={item.name}
                      onChange={(value) => updateOrderItem(index, { name: value })}
                    />
                    <Input
                      label="Số lượng"
                      type="number"
                      value={item.quantity}
                      onChange={(value) => updateOrderItem(index, { quantity: value })}
                    />
                    <Input
                      label="Đơn giá"
                      type="number"
                      value={item.unitPrice}
                      onChange={(value) => updateOrderItem(index, { unitPrice: value })}
                    />
                    <button className="danger compact icon-only-button" onClick={() => removeOrderItem(index)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="order-dialog-meta order-dialog-source-meta">
                <label>
                  <span>Page</span>
                  <input value={orderDraft.pageName || ""} onChange={(event) => updateOrderDraft({ pageName: event.target.value })} />
                </label>
                <label>
                  <span>Quảng cáo</span>
                  <input value={orderDraft.adName || ""} onChange={(event) => updateOrderDraft({ adName: event.target.value })} />
                </label>
              </div>

              <Textarea
                label="Ghi chú khách hàng / yêu cầu chỉnh sửa"
                value={orderDraft.note || ""}
                onChange={(value) => updateOrderDraft({ note: value })}
              />

              <div className="context-actions">
                <button className="primary" onClick={saveSelectedOrder} disabled={!canEditSelectedOrder}>
                  <Save size={16} />
                  Lưu cập nhật
                </button>
                <button className="ghost-button" onClick={closeOrderDialog}>
                  Hủy
                </button>
              </div>
              {!canEditSelectedOrder && (
                <span className="muted-inline">Đơn chỉ được cập nhật trong ngày tạo đơn.</span>
              )}
            </section>
          </div>
        )}

        {tab === "simulator" && (
          <section className="simulator-workspace">
            <Panel
              title="Kịch bản giả lập"
              action={
                <button className="ghost-button compact" onClick={resetBotTestSession}>
                  Reset
                </button>
              }
            >
              <div className="settings-form">
                <label>
                  <span>Page nhận sự kiện</span>
                  <select
                    value={simulatorDraft.pageBotId}
                    onChange={(event) =>
                      setSimulatorDraft((current) => ({ ...current, pageBotId: event.target.value }))
                    }
                  >
                    <option value="">Chọn page bot</option>
                    {pageBots.map((bot) => (
                      <option key={bot._id} value={bot._id}>
                        {bot.pageName || bot.pageId}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Case chatbot</span>
                  <select
                    value={simulatorDraft.type}
                    onChange={(event) =>
                      setSimulatorDraft((current) => ({ ...current, type: event.target.value }))
                    }
                  >
                    {simulatorCases.map((item) => (
                      <option key={item.type} value={item.type}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>

                <Input
                  label="PSID khách giả lập"
                  value={simulatorDraft.customerPsid}
                  onChange={(value) => setSimulatorDraft((current) => ({ ...current, customerPsid: value }))}
                />
                <Input
                  label="Tên khách"
                  value={simulatorDraft.customerName}
                  onChange={(value) => setSimulatorDraft((current) => ({ ...current, customerName: value }))}
                />
                <Input
                  label="Avatar URL"
                  value={simulatorDraft.profilePic}
                  onChange={(value) => setSimulatorDraft((current) => ({ ...current, profilePic: value }))}
                />

                {simulatorDraft.type === "quick_reply" && (
                  <Input
                    label="Quick reply payload"
                    value={simulatorDraft.quickReplyPayload}
                    onChange={(value) =>
                      setSimulatorDraft((current) => ({ ...current, quickReplyPayload: value }))
                    }
                  />
                )}

                {simulatorDraft.type === "ad_click" && (
                  <div className="form-grid">
                    <Input
                      label="Ad ID"
                      value={simulatorDraft.adId}
                      onChange={(value) => setSimulatorDraft((current) => ({ ...current, adId: value }))}
                    />
                    <Input
                      label="Tên chiến dịch/ref"
                      value={simulatorDraft.adTitle}
                      onChange={(value) => setSimulatorDraft((current) => ({ ...current, adTitle: value }))}
                    />
                  </div>
                )}

                <Textarea
                  label={simulatorDraft.type === "human_echo" ? "Nội dung người thật trả lời" : "Nội dung khách gửi"}
                  value={simulatorDraft.text}
                  onChange={(value) => setSimulatorDraft((current) => ({ ...current, text: value }))}
                />

                <label className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={simulatorDraft.skipBotReply}
                    onChange={(event) =>
                      setSimulatorDraft((current) => ({ ...current, skipBotReply: event.target.checked }))
                    }
                  />
                  <span>Chỉ ghi nhận event, không sinh câu trả lời BOT</span>
                </label>

                <button className="primary" onClick={runSimulatorEvent} disabled={simulatorRunning}>
                  <Sparkles size={16} />
                  {simulatorRunning ? "Đang giả lập..." : "Chạy giả lập"}
                </button>
              </div>
            </Panel>

            <Panel title="Kết quả gần nhất">
              {!simulatorResult ? (
                <EmptyState
                  title="Chưa chạy giả lập"
                  body="Chọn page, case và nội dung để kiểm tra luồng xử lý chatbot."
                />
              ) : (
                <div className="simulator-result">
                  <div className="context-meta-grid">
                    <article>
                      <span>Case</span>
                      <strong>{simulatorResult.label}</strong>
                    </article>
                    <article>
                      <span>PSID</span>
                      <strong>{simulatorDraft.customerPsid}</strong>
                    </article>
                    <article>
                      <span>BOT tạm dừng đến</span>
                      <strong>
                        {simulatorResult.thread?.botReplyPausedUntil
                          ? formatDateTime(simulatorResult.thread.botReplyPausedUntil)
                          : "-"}
                      </strong>
                    </article>
                  </div>

                  <div className="recent-message-list">
                    {(simulatorResult.messages || []).map((message) => (
                      <article key={message._id} className={`recent-message ${message.direction}`}>
                        <strong>
                          {message.senderType} · {message.direction}
                        </strong>
                        <span>{formatDateTime(message.createdAt)}</span>
                        <MessageContent message={message} compact />
                      </article>
                    ))}
                  </div>

                  <label>
                    <span>Raw event đã dựng</span>
                    <textarea readOnly value={JSON.stringify(simulatorResult.event, null, 2)} />
                  </label>
                  <label>
                    <span>Log xử lý BOT</span>
                    <textarea readOnly value={formatSimulatorDebugLog(simulatorResult.debugLog)} />
                  </label>
                </div>
              )}
            </Panel>
          </section>
        )}

        {tab === "test-bot" && (
          <section className="bot-test-shell">
            <Panel
              title="Thiết lập phiên test"
              action={
                <button className="ghost-button compact" onClick={() => setSimulatorDraft(emptySimulatorDraft)}>
                  Reset
                </button>
              }
            >
              <div className="settings-form">
                <label>
                  <span>Page nhận sự kiện</span>
                  <select
                    value={simulatorDraft.pageBotId}
                    onChange={(event) =>
                      setSimulatorDraft((current) => ({ ...current, pageBotId: event.target.value }))
                    }
                  >
                    <option value="">Chọn page bot</option>
                    {pageBots.map((bot) => (
                      <option key={bot._id} value={bot._id}>
                        {bot.pageName || bot.pageId}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Case chatbot</span>
                  <select
                    value={simulatorDraft.type}
                    onChange={(event) =>
                      setSimulatorDraft((current) => ({ ...current, type: event.target.value }))
                    }
                  >
                    {simulatorCases.map((item) => (
                      <option key={item.type} value={item.type}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>
                <Input
                  label="PSID khách giả lập"
                  value={simulatorDraft.customerPsid}
                  onChange={(value) => setSimulatorDraft((current) => ({ ...current, customerPsid: value }))}
                />
                <Input
                  label="Tên khách"
                  value={simulatorDraft.customerName}
                  onChange={(value) => setSimulatorDraft((current) => ({ ...current, customerName: value }))}
                />
                <Input
                  label="Avatar URL"
                  value={simulatorDraft.profilePic}
                  onChange={(value) => setSimulatorDraft((current) => ({ ...current, profilePic: value }))}
                />
                {simulatorDraft.type === "quick_reply" && (
                  <Input
                    label="Quick reply payload"
                    value={simulatorDraft.quickReplyPayload}
                    onChange={(value) =>
                      setSimulatorDraft((current) => ({ ...current, quickReplyPayload: value }))
                    }
                  />
                )}
                {simulatorDraft.type === "ad_click" && (
                  <div className="form-grid">
                    <Input
                      label="Ad ID"
                      value={simulatorDraft.adId}
                      onChange={(value) => setSimulatorDraft((current) => ({ ...current, adId: value }))}
                    />
                    <Input
                      label="Tên chiến dịch/ref"
                      value={simulatorDraft.adTitle}
                      onChange={(value) => setSimulatorDraft((current) => ({ ...current, adTitle: value }))}
                    />
                  </div>
                )}
                <label className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={simulatorDraft.skipBotReply}
                    onChange={(event) =>
                      setSimulatorDraft((current) => ({ ...current, skipBotReply: event.target.checked }))
                    }
                  />
                  <span>Chỉ ghi nhận event, không sinh câu trả lời BOT</span>
                </label>
              </div>
            </Panel>

            <section className="messenger-chat bot-test-chat">
              <header>
                <div className="customer-heading">
                  <Avatar
                    profile={{ firstName: simulatorDraft.customerName, profilePic: simulatorDraft.profilePic }}
                    fallback={simulatorDraft.customerPsid}
                  />
                  <div className="customer-copy">
                    <strong>{simulatorDraft.customerName || "Khách giả lập"}</strong>
                    <span>{simulatorDraft.customerPsid || "Chưa có PSID"}</span>
                  </div>
                </div>
                <div className="conversation-meta">
                  <strong>{pageBots.find((bot) => bot._id === simulatorDraft.pageBotId)?.pageName || "Chưa chọn page"}</strong>
                  <span>{simulatorResult?.label || "Sẵn sàng test"}</span>
                </div>
              </header>
              <div className="conversation-status">
                <div>
                  <strong>Test BOT</strong>
                  <span>
                    {simulatorResult?.thread?.botReplyPausedUntil
                      ? `BOT tạm dừng đến ${formatDateTime(simulatorResult.thread.botReplyPausedUntil)}`
                      : "Kiểm tra phản hồi và các chức năng đã phát triển"}
                  </span>
                </div>
              </div>
              <div className="message-thread messenger-scroll">
                {!simulatorMessages.length && (
                  <EmptyState title="Chưa có hội thoại test" body="Gửi một tin nhắn để bắt đầu kiểm tra BOT." />
                )}
                {simulatorMessages.map((message) => (
                  <div key={message._id} className={`message-row ${message.direction}`}>
                    {message.direction === "inbound" && (
                      <Avatar
                        profile={{ firstName: simulatorDraft.customerName, profilePic: simulatorDraft.profilePic }}
                        fallback={simulatorDraft.customerPsid}
                      />
                    )}
                    <div className={`message-bubble ${message.direction}`}>
                      <MessageContent message={message} />
                      <time>{formatTime(message.createdAt)}</time>
                    </div>
                    {message.direction === "outbound" && (
                      <span className={`bot-avatar ${message.senderType === "human" ? "human" : ""}`}>
                        {message.senderType === "human" ? "H" : "B"}
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <div className="reply-composer">
                <div className="composer-row bot-test-composer-row">
                  <textarea
                    placeholder={
                      simulatorDraft.type === "human_echo"
                        ? "Nhập nội dung người thật trả lời..."
                        : "Nhập tin nhắn khách gửi..."
                    }
                    value={simulatorDraft.text}
                    onChange={(event) => setSimulatorDraft((current) => ({ ...current, text: event.target.value }))}
                    onKeyDown={handleBotTestComposerKeyDown}
                  />
                  <button className={`send-button ${simulatorRunning ? "sending" : ""}`} onClick={runSimulatorEvent} disabled={simulatorRunning}>
                    {simulatorRunning ? <RefreshCw size={18} className="spinning" /> : <SendHorizontal size={18} />}
                  </button>
                </div>
                <span className="bot-test-send-status">
                  {simulatorRunning ? "Đang gửi..." : "Enter để gửi, Shift + Enter để xuống dòng"}
                </span>
              </div>
              {simulatorResult && (
                <div className="bot-test-debug">
                  <label>
                    <span>Log xử lý BOT</span>
                    <textarea readOnly value={formatSimulatorDebugLog(simulatorResult.debugLog)} />
                  </label>
                  <label>
                    <span>Raw event</span>
                    <textarea readOnly value={JSON.stringify(simulatorResult.event, null, 2)} />
                  </label>
                </div>
              )}
            </section>
          </section>
        )}

        {tab === "contexts" && (
          <section className="context-workspace">
            <Panel
              title="Hội thoại đang có ngữ cảnh"
              action={
                <button className="danger compact panel-action-button" onClick={resetAllContexts}>
                  <Trash2 size={16} />
                  Clear tất cả
                </button>
              }
            >
              <div className="list">
                {contexts.length === 0 && (
                  <EmptyState title="Chưa có ngữ cảnh" body="Ngữ cảnh sẽ xuất hiện sau khi bot bắt đầu trò chuyện với khách." />
                )}
                {contexts.map((context) => {
                  const profile = context.customerProfile;
                  const displayName =
                    [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") ||
                    context.customerPsid;
                  const pageName = pageBots.find((bot) => bot._id === context.pageBotId)?.pageName || "-";

                  return (
                    <button
                      key={context._id}
                      className={`row ${selectedContextId === context._id ? "selected" : ""}`}
                      onClick={() => {
                        setSelectedContextId(context._id);
                        setContextDraft(context.memorySummary || "");
                      }}
                    >
                      <strong>{displayName}</strong>
                      <span>{pageName}</span>
                      <small>{formatDateTime(context.lastMessageAt)}</small>
                    </button>
                  );
                })}
              </div>
            </Panel>

            <section className="editor context-editor">
              {!selectedContext ? (
                <EmptyState title="Chưa chọn hội thoại" body="Chọn một khách để xem memory bot đang sử dụng." />
              ) : (
                <>
                  <div className="panel-header">
                    <div>
                      <h2>Bộ nhớ hội thoại</h2>
                      <span className="muted">
                        {pageBots.find((bot) => bot._id === selectedContext.pageBotId)?.pageName} ·{" "}
                        {selectedContext.customerPsid}
                      </span>
                    </div>
                  </div>
                  <div className="context-meta-grid">
                    <article>
                      <span>Lượt gần nhất</span>
                      <strong>{formatDateTime(selectedContext.lastMessageAt)}</strong>
                    </article>
                    <article>
                      <span>Response gần nhất</span>
                      <strong>{selectedContext.lastResponseId || "-"}</strong>
                    </article>
                  </div>
                  <Textarea label="Memory summary bot đang dùng" value={contextDraft} onChange={setContextDraft} />
                  <div className="context-actions">
                    <button className="primary" onClick={saveContext}>
                      <Save size={16} />
                      Lưu memory
                    </button>
                    <button className="danger" onClick={resetContext}>
                      <Trash2 size={16} />
                      Xóa memory tạm
                    </button>
                  </div>
                  <Panel title="Tin nhắn gần đây">
                    <div className="recent-message-list">
                      {(selectedContext.recentMessages || []).map((message) => (
                        <div key={message._id} className={`recent-message ${message.direction}`}>
                          <strong>{message.direction === "inbound" ? "Khách" : "Bot"}</strong>
                          <span>{message.text}</span>
                        </div>
                      ))}
                    </div>
                  </Panel>
                </>
              )}
            </section>
          </section>
        )}

        {tab === "rules" && <RulesScreen rules={rules} editingRule={editingRule} setEditingRule={setEditingRule} saveRule={saveRule} removeRule={removeRule} />}

        {tab === "faqs" && (
          <FaqsScreen
            pageBots={pageBots}
            faqPageFilter={faqPageFilter}
            setFaqPageFilter={setFaqPageFilter}
            faqSearch={faqSearch}
            setFaqSearch={setFaqSearch}
            filteredFaqs={filteredFaqs}
            editingFaq={editingFaq}
            setEditingFaq={setEditingFaq}
            emptyFaq={emptyFaq}
            saveFaq={saveFaq}
            removeFaq={removeFaq}
          />
        )}

        {tab === "settings" && (
          <SettingsScreen
            theme={theme}
            setTheme={setTheme}
            showMobileHeader={showMobileHeader}
            setShowMobileHeader={setShowMobileHeader}
            mobileNavVariant={mobileNavVariant}
            setMobileNavVariant={setMobileNavVariant}
            runtimeSettings={runtimeSettings}
            setRuntimeSettings={setRuntimeSettings}
            saveRuntimeSettings={saveRuntimeSettings}
          />
        )}

        {tab === "users" && can("users.manage") && (
          <UsersScreen
            users={users}
            roles={roles}
            editingUser={editingUser}
            setEditingUser={setEditingUser}
            pageBots={pageBots}
            saveUser={saveUser}
          />
        )}

        {tab === "roles" && can("roles.manage") && (
          <RolesScreen
            roles={roles}
            permissions={permissions}
            editingRole={editingRole}
            setEditingRole={setEditingRole}
            saveRole={saveRole}
          />
        )}

        {tab === "reports" && can("reports.view") && (
          <section className="report-layout">
            <Panel title="Bộ lọc báo cáo">
              <div className="report-filters">
                <Input label="Từ ngày" type="date" value={reportRange.fromDate} onChange={(value) => setReportRange((current) => ({ ...current, fromDate: value }))} />
                <Input label="Đến ngày" type="date" value={reportRange.toDate} onChange={(value) => setReportRange((current) => ({ ...current, toDate: value }))} />
                <button className="primary" onClick={loadOperationsReport}>Xem báo cáo</button>
              </div>
            </Panel>
            <div className="report-summary">
              <article><span>Tổng tin nhắn</span><strong>{operationsReport?.summary.totalMessages || 0}</strong></article>
              <article><span>Tin khách</span><strong>{operationsReport?.summary.inboundMessages || 0}</strong></article>
              <article><span>Tin gửi ra</span><strong>{operationsReport?.summary.outboundMessages || 0}</strong></article>
              <article><span>Tổng đơn</span><strong>{operationsReport?.summary.totalOrders || 0}</strong></article>
              <article><span>Doanh thu</span><strong>{(operationsReport?.summary.totalRevenue || 0).toLocaleString("vi-VN")} đ</strong></article>
            </div>
            <Panel
              title="Xuất dữ liệu"
              action={
                <div className="context-actions">
                  <button className="ghost-button compact" onClick={() => exportReport("messages", "csv")}>Tin nhắn CSV</button>
                  <button className="ghost-button compact" onClick={() => exportReport("messages", "json")}>Tin nhắn JSON</button>
                  <button className="ghost-button compact" onClick={() => exportReport("messages", "txt")}>Tin nhắn TXT</button>
                  <button className="ghost-button compact" onClick={() => exportReport("orders", "csv")}>Đơn hàng CSV</button>
                  <button className="ghost-button compact" onClick={() => exportReport("orders", "json")}>Đơn hàng JSON</button>
                  <button className="ghost-button compact" onClick={() => exportReport("orders", "txt")}>Đơn hàng TXT</button>
                </div>
              }
            >
              <span className="muted-inline">
                Phạm vi: {reportRange.fromDate} đến {reportRange.toDate}
              </span>
            </Panel>
          </section>
        )}
      </main>
    </div>
  );
}

function isSameLocalDay(date, now = new Date()) {
  return getBangkokDayKey(date) === getBangkokDayKey(now);
}

function userCan(user, permission) {
  return Boolean(user?.superAdmin || user?.permissions?.includes(permission));
}

function getErrorMessage(error, fallback) {
  const message = String(error?.message || "").trim();
  if (!message) return fallback;
  try {
    const parsed = JSON.parse(message);
    return parsed.message || fallback;
  } catch {
    return message;
  }
}

function downloadCsv(rows, filename) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((header) => `"${String(row[header] ?? "").replaceAll('"', '""')}"`)
        .join(",")
    )
  ].join("\n");
  const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function downloadJson(rows, filename) {
  downloadBlob(JSON.stringify(rows, null, 2), filename, "application/json;charset=utf-8");
}

function downloadText(rows, filename) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const text = rows
    .map((row, index) =>
      [
        `# ${index + 1}`,
        ...headers.map((header) => `${header}: ${String(row[header] ?? "")}`)
      ].join("\n")
    )
    .join("\n\n");
  downloadBlob(text, filename, "text/plain;charset=utf-8");
}

function downloadBlob(content, filename, type) {
  const blob = new Blob(["\uFEFF", content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function getBangkokDayKey(date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date(date));
}

function MessageContent({ message, compact = false }) {
  return (
    <>
      {message.text && <p>{message.text}</p>}
      {Boolean(message.attachments?.length) && (
        <div className={`message-attachments ${compact ? "compact" : ""}`}>
          {message.attachments.map((attachment, index) => {
            if (attachment.type === "image" && attachment.url) {
              return <img key={`${attachment.type}-${index}`} src={attachment.url} alt="" />;
            }
            if (attachment.type === "audio" && attachment.url) {
              return <audio key={`${attachment.type}-${index}`} controls src={attachment.url} />;
            }
            if (attachment.type === "video" && attachment.url) {
              return <video key={`${attachment.type}-${index}`} controls src={attachment.url} />;
            }
            return (
              <span key={`${attachment.type}-${index}`} className="attachment-chip">
                {attachment.type === "sticker" ? "Sticker" : attachment.type}
              </span>
            );
          })}
        </div>
      )}
    </>
  );
}
