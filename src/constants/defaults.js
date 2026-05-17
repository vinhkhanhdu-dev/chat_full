export const emptyPageBot = {
  pageId: "",
  pageName: "",
  companyId: "",
  accessToken: "",
  enabled: true,
  persona: {
    tone: "",
    pronouns: "",
    businessInfo: "",
    greeting: ""
  },
  vectorStoreId: "",
  pricingPolicy: "",
  shippingPolicy: "",
  promotionPolicy: "",
  humanHandoffEnabled: false,
  humanHandoffResumeAfterMinutes: 30
};

export const emptyRule = {
  name: "",
  category: "instruction",
  content: "",
  enabled: true,
  priority: 100
};

export const emptyFaq = {
  pageBotId: "",
  question: "",
  answer: "",
  tags: "",
  enabled: true,
  priority: 100
};

export const emptyCompany = {
  companyId: "",
  name: "",
  title: "",
  hotline: "",
  address: ""
};

export const emptyPromotion = {
  companyId: "",
  name: "",
  description: "",
  enabled: true,
  pageBotIds: [],
  versions: [{ name: "Phiên bản 1", content: "", active: true }]
};

export const emptyConsultationScript = {
  companyId: "",
  name: "",
  content: "",
  examples: [
    'Khách: "Shop có loại nào tốt không?"',
    'Bot: "Dạ có ạ. Anh/chị đang cần dùng cho mục đích nào để em gợi ý đúng loại hơn?"',
    "",
    'Khách: "Mẫu này bao nhiêu tiền?"',
    'Bot: "Dạ mẫu này giá ... ạ."',
    "",
    'Khách: "Lấy cho chị 2 cái nhé."',
    'Bot: "Dạ được ạ. Chị cho em xin tên, số điện thoại và địa chỉ nhận hàng để em lên đơn nhé."',
    "",
    'Khách: "Có màu đen không?"',
    'Bot: "Dạ có màu đen ạ."'
  ].join("\n"),
  enabled: true,
  priority: 100
};

export const defaultRuntimeSettings = {
  openaiModel: "gpt-4.1-mini",
  maxOutputTokens: 900,
  maxFaqResults: 40,
  maxPromotionResults: 20,
  fileSearchMaxResults: 5,
  enableMessengerTemplates: true,
  splitMessengerTextOnNewline: false,
  splitMessengerTextDelayMs: 1000,
  aggregateConsecutiveCustomerMessages: false,
  aggregateCustomerMessageDelayMs: 1500
};

export const emptySimulatorDraft = {
  pageBotId: "",
  customerPsid: "sim_customer_001",
  customerName: "Khách Giả Lập",
  profilePic: "",
  type: "customer_message",
  text: "Shop tư vấn giúp mình sản phẩm phù hợp nhé",
  quickReplyPayload: "SIM_QUICK_REPLY",
  adId: "SIM_AD_001",
  adTitle: "Quảng cáo test",
  skipBotReply: false
};
