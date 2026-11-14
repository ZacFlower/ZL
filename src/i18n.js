/**
 * Song ngữ Việt / English (không cần thư viện).
 *  - t('key', { n: 3 })     → chuỗi giao diện theo ngôn ngữ đang chọn
 *  - trCat('Hoa bó')         → tên danh mục (dịch sẵn các danh mục của shop)
 *  - trName(flower)          → tên mẫu (ưu tiên "Tên EN:" trong mô tả Drive, nếu không thì dịch tiền tố)
 *  - trDesc(flower)          → mô tả (ưu tiên "Mô tả EN:")
 * Ngôn ngữ được nhớ trong trình duyệt; lần đầu tự chọn theo ngôn ngữ máy khách.
 */
import { ref, watch } from 'vue'

const KEY = 'zac-lang'
function initialLang() {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved === 'vi' || saved === 'en') return saved
  } catch { /* ignore */ }
  const nav = (navigator.languages?.[0] || navigator.language || 'vi').toLowerCase()
  return nav.startsWith('vi') ? 'vi' : 'en'
}

export const lang = ref(initialLang())
export const isEn = () => lang.value === 'en'

export function setLang(l) {
  lang.value = l
  try {
    localStorage.setItem(KEY, l)
  } catch { /* ignore */ }
}

const TITLES = {
  vi: 'Zacflower – Shop Hoa Tươi Đà Nẵng',
  en: 'Zacflower – Fresh Flower Shop in Da Nang',
}
watch(
  lang,
  (l) => {
    document.documentElement.lang = l
    document.title = TITLES[l]
  },
  { immediate: true },
)

/* ---------------- Chuỗi giao diện ---------------- */
const M = {
  // Header
  topbar: ['🚀 Giao hỏa tốc tận nơi tại Đà Nẵng · Luôn mở cửa', '🚀 Express delivery across Da Nang · Open 24/7'],
  tagline: ['Flower shop · Đà Nẵng', 'Flower shop · Da Nang'],
  searchPh: ['Tìm theo chủ đề, tên hoa…', 'Search by occasion or flower…'],
  searchPhShort: ['Tìm mẫu hoa…', 'Search flowers…'],
  search: ['Tìm', 'Search'],
  hotline: ['Hotline đặt hoa', 'Order hotline'],
  contact: ['Liên hệ', 'Contact'],
  home: ['Trang chủ', 'Home'],
  allFlowers: ['Tất cả mẫu hoa', 'All flowers'],
  openMenu: ['Mở menu', 'Open menu'],
  closeMenu: ['Đóng menu', 'Close menu'],
  menu: ['Menu', 'Menu'],
  callN: ['Gọi {phone}', 'Call {phone}'],
  langSwitch: ['Chuyển ngôn ngữ', 'Switch language'],

  // Trang chủ
  heroKicker: ["Make someone's day special in Da Nang", "Make someone's day special in Da Nang"],
  heroTitle1: ['Gửi gắm yêu thương', 'Send your love'],
  heroTitle2: ['qua từng đóa hoa tươi', 'through fresh flowers'],
  heroSub: [
    'Hoa bó, hoa chủ đề, kệ hoa chúc mừng… được Zacflower thiết kế tinh tế và giao tận tay người nhận trong ngày.',
    'Bouquets, occasion flowers and congratulatory stands — beautifully designed by Zacflower and delivered the same day.',
  ],
  zaloWa: ['(Zalo / WhatsApp)', '(Zalo / WhatsApp)'],
  browse: ['Xem mẫu hoa', 'Browse flowers'],
  callOrder: ['Gọi đặt hoa', 'Call to order'],
  followers: ['khách hàng theo dõi', 'followers'],
  followersN: ['1,2K+', '1.2K+'],
  sv1t: ['Giao hỏa tốc', 'Express delivery'],
  sv1d: ['Tận nơi tại Đà Nẵng: nhà riêng, khách sạn, resort, sân bay', 'Anywhere in Da Nang: homes, hotels, resorts, airport'],
  sv2t: ['Đặt hàng nhanh', 'Quick ordering'],
  sv2d: ['Hotline / Zalo {phone}', 'Hotline / Zalo / WhatsApp {phone}'],
  sv3t: ['Hoa tươi 100%', '100% fresh flowers'],
  sv3d: ['Tuyển chọn mỗi ngày, thiết kế độc quyền', 'Hand-picked daily, exclusive designs'],
  sv4t: ['Tư vấn đa ngôn ngữ', 'We speak English'],
  sv4d: ['Tiếng Việt · English — nhiệt tình 24/7', 'Vietnamese · English — friendly help 24/7'],
  catTitle: ['Shop hoa Zacflower – Cửa hàng hoa tươi tại Đà Nẵng', 'Zacflower – Fresh flower shop in Da Nang'],
  catSub: ['Chọn danh mục để xem mẫu hoa và bảng giá', 'Pick a category to see designs and prices'],
  nDesigns: ['{n} mẫu', '{n} designs', '{n} design'],
  comingSoon: ['Đang cập nhật', 'Coming soon'],
  viewAll: ['Xem tất cả →', 'View all →'],
  homeEmpty: ['🌷 Các mẫu hoa đang được cập nhật. Gọi', '🌷 New designs are on the way. Call'],
  homeEmpty2: ['để được tư vấn ngay nhé!', 'for help right away!'],
  retry: ['Thử lại', 'Try again'],
  errNotConfigured: [
    'Web chưa kết nối được kho mẫu hoa (thiếu cấu hình Google Drive). Vui lòng gọi hotline để xem mẫu và đặt hoa.',
    'The flower catalogue isn’t connected yet (Google Drive settings missing). Please call our hotline to see designs and order.',
  ],
  demoNote: [
    'Đang hiển thị dữ liệu mẫu — cấu hình Google Drive trong .env để hiện mẫu hoa thật.',
    'Showing sample data — configure Google Drive in .env to show real flowers.',
  ],

  // Trang danh mục
  resultsFor: ['Kết quả cho “{q}”', 'Results for “{q}”'],
  searchCrumb: ['Tìm kiếm', 'Search'],
  breadcrumb: ['Đường dẫn', 'Breadcrumb'],
  categories: ['Danh mục', 'Categories'],
  priceRange: ['Khoảng giá', 'Price range'],
  allPrices: ['Tất cả mức giá', 'All prices'],
  anyPrice: ['Mọi mức giá', 'Any price'],
  helpTitle: ['Cần tư vấn mẫu hoa?', 'Need help choosing?'],
  helpText: ['Zacflower luôn mở cửa, hỗ trợ tiếng Việt & English.', 'Zacflower is open 24/7 and speaks Vietnamese & English.'],
  all: ['Tất cả', 'All'],
  designsUnit: ['mẫu hoa', 'designs'],
  viewMode: ['Kiểu hiển thị', 'View'],
  grid: ['Lưới', 'Grid'],
  priceList: ['Bảng giá', 'Price list'],
  sortBy: ['Sắp xếp:', 'Sort:'],
  newest: ['Mới nhất', 'Newest'],
  priceAsc: ['Giá tăng dần', 'Price: low to high'],
  priceDesc: ['Giá giảm dần', 'Price: high to low'],
  nameAZ: ['Tên A–Z', 'Name A–Z'],
  catNotFound: ['Không tìm thấy danh mục này.', 'Category not found.'],
  noMatch: ['Không có mẫu hoa phù hợp với bộ lọc.', 'No designs match your filters.'],
  catUpdating: ['Danh mục này đang cập nhật mẫu mới.', 'New designs for this category are coming soon.'],
  callUs: ['Gọi', 'Call'],
  callUs2: ['để Zacflower tư vấn mẫu phù hợp nhé!', 'and Zacflower will help you choose!'],
  clearPrice: ['Bỏ lọc giá', 'Clear price filter'],
  under: ['Dưới {a}', 'Under {a}'],
  over: ['Trên {a}', 'Over {a}'],

  // Thẻ hoa, bảng giá
  quickView: ['Xem nhanh', 'Quick view'],
  nOptions: ['{n} loại', '{n} options', '{n} option'],
  onRequest: ['Liên hệ', 'Price on request'],
  from: ['Từ ', 'From '],
  standard: ['Tiêu chuẩn', 'Standard'],

  // Popup chi tiết
  close: ['Đóng', 'Close'],
  prevDesign: ['Mẫu trước', 'Previous design'],
  nextDesign: ['Mẫu sau', 'Next design'],
  priceTable: ['Bảng giá', 'Prices'],
  perk1: ['Hoa tươi tuyển chọn 100%, thiết kế độc quyền', '100% fresh, hand-picked flowers in exclusive designs'],
  perk2: ['Giao hỏa tốc tận nơi tại Đà Nẵng', 'Express delivery anywhere in Da Nang'],
  perk3: ['Tư vấn đa ngôn ngữ, nhiệt tình', 'Friendly help in Vietnamese & English'],
  orderNow: ['🌸 Đặt hoa ngay', '🌸 Order now'],
  call: ['Gọi', 'Call'],
  codeHint1: ['Mã mẫu', 'Design code'],
  codeHint2: ['gửi kèm khi đặt hoa nhé', 'include it when you order'],

  // Form đặt hoa
  orderTitle: ['Đặt hoa', 'Order'],
  orderDone: ['Đơn hàng', 'Your order'],
  chooseOption: ['Chọn loại', 'Choose an option'],
  yourName: ['Họ tên của bạn *', 'Your name *'],
  yourPhone: ['Số điện thoại / Zalo *', 'Phone / WhatsApp *'],
  namePh: ['Nguyễn Văn A', 'Jane Smith'],
  delivery: ['Giao tận nơi', 'Delivery'],
  pickup: ['Nhận tại shop', 'Pick up in store'],
  deliveryAria: ['Hình thức nhận hoa', 'Delivery method'],
  date: ['Ngày nhận hoa', 'Date'],
  timeSlot: ['Khung giờ', 'Time'],
  asap: ['Càng sớm càng tốt', 'As soon as possible'],
  address: ['Địa chỉ giao hoa *', 'Delivery address *'],
  addressPh: ['Số nhà, đường, phường… (khách sạn / resort ghi kèm số phòng)', 'Street address (hotel / resort: add room number)'],
  recipient: ['Tên người nhận', 'Recipient name'],
  recipientPh: ['Nếu tặng người khác', 'If it’s a gift'],
  recipientPhone: ['SĐT người nhận', 'Recipient phone'],
  recipientPhonePh: ['Để shipper liên hệ', 'For the courier'],
  pickupAt: ['📍 Nhận tại: {addr}', '📍 Pick up at: {addr}'],
  cardMsg: ['Lời nhắn trên thiệp', 'Card message'],
  cardMsgPh: ['VD: Chúc mừng sinh nhật em yêu ❤️', 'e.g. Happy birthday, my love ❤️'],
  note: ['Ghi chú thêm', 'Notes'],
  notePh: ['Màu giấy gói, thay đổi hoa, xuất hóa đơn…', 'Wrapping colour, flower changes, invoice…'],
  errName: ['Vui lòng nhập họ tên của bạn.', 'Please enter your name.'],
  errPhone: ['Số điện thoại chưa đúng.', 'Please enter a valid phone number.'],
  errAddress: ['Vui lòng nhập địa chỉ giao hoa.', 'Please enter the delivery address.'],
  sending: ['Đang gửi đơn…', 'Sending…'],
  sendOrder: ['Gửi đơn đặt hoa', 'Send order'],
  continueChat: ['Tiếp tục đặt qua Zalo / WhatsApp', 'Continue on WhatsApp / Zalo'],
  confirmNote: [
    'Zacflower sẽ gọi / nhắn Zalo xác nhận đơn và phí giao trước khi cắm hoa.',
    'Zacflower will contact you to confirm the order and delivery fee before arranging.',
  ],
  sentTitle: ['Đã gửi đơn {code}', 'Order {code} sent'],
  sentText1: ['Cảm ơn bạn! Zacflower sẽ liên hệ', 'Thank you! Zacflower will contact'],
  sentText2: [
    'để xác nhận trong ít phút. Muốn được phản hồi nhanh hơn, gửi luôn đơn qua Zalo hoặc WhatsApp nhé.',
    'shortly to confirm. For a faster reply, also send the order via WhatsApp or Zalo.',
  ],
  failTitle: ['Chưa gửi được đơn tự động', 'We couldn’t send your order automatically'],
  failText: ['Bạn gửi đơn qua Zalo hoặc WhatsApp bên dưới để shop nhận ngay nhé.', 'Please send it via WhatsApp or Zalo below so the shop gets it right away.'],
  manualTitle: ['Gửi đơn cho Zacflower', 'Send your order to Zacflower'],
  manualText: ['Chọn Zalo hoặc WhatsApp để gửi đơn. Nội dung đơn đã được soạn sẵn bên dưới.', 'Choose WhatsApp or Zalo to send your order — the message is ready below.'],
  openZalo: ['Mở Zalo & dán đơn', 'Open Zalo & paste'],
  sendWa: ['Gửi qua WhatsApp', 'Send via WhatsApp'],
  zaloHint: [
    'Zalo không cho điền sẵn tin nhắn: đơn được tự sao chép, bạn chỉ cần dán (giữ ô chat → Dán) rồi gửi.',
    'Zalo can’t pre-fill messages: your order is copied automatically — just paste it into the chat and send.',
  ],
  copy: ['Sao chép', 'Copy'],
  copied: ['✓ Đã sao chép', '✓ Copied'],
  done: ['Xong', 'Done'],
  netError: ['Không gửi được đơn do lỗi mạng.', 'Network error — the order wasn’t sent.'],

  // Chân trang
  ctaTitle1: ['Cần một bó hoa', 'Need flowers'],
  ctaTitle2: ['riêng cho bạn?', 'made just for you?'],
  ctaText: [
    'Kể cho Zacflower nghe dịp đặc biệt của bạn — chúng mình thiết kế và giao tận nơi tại Đà Nẵng.',
    'Tell Zacflower about your special occasion — we’ll design it and deliver anywhere in Da Nang.',
  ],
  ctaEn: ['We speak English too!', 'Chúng mình nói tiếng Việt & English!'],
  about: [
    'Shop hoa tươi tại Đà Nẵng — hoa bó, hoa chủ đề, kệ hoa chúc mừng, hoa chia buồn. Hoa tuyển chọn 100%, thiết kế độc quyền, giao hỏa tốc tận nơi.',
    'Fresh flower shop in Da Nang — bouquets, occasion flowers, congratulatory and sympathy stands. 100% hand-picked flowers, exclusive designs, express delivery.',
  ],
  rating: ['⭐ 84% khách đề xuất · 1,2K người theo dõi trên Facebook', '⭐ 84% recommend us · 1.2K followers on Facebook'],
  flowerCats: ['Danh mục hoa', 'Flower categories'],
  zaloWaLine: ['💬 Zalo / WhatsApp: {phone}', '💬 WhatsApp / Zalo: {phone}'],
  openAlways: ['⏰ Luôn mở cửa', '⏰ Open 24/7'],
  howTo: ['Đặt hoa thế nào?', 'How to order'],
  step1: ['Chọn mẫu hoa & loại giá trên web', 'Pick a design and option on the website'],
  step2: ['Gửi mã mẫu qua Zalo / hotline', 'Send the design code via WhatsApp / Zalo / hotline'],
  step3: ['Zacflower xác nhận & giao tận nơi', 'Zacflower confirms and delivers'],
  viewMap: ['Xem bản đồ', 'View map'],
  copyright: ['Shop hoa tươi Đà Nẵng', 'Fresh flowers in Da Nang'],
  manage: ['Quản lý', 'Admin'],

  // Nút nổi
  quickContact: ['Liên hệ nhanh', 'Quick contact'],
  chatZalo: ['Chat Zalo', 'Chat on Zalo'],
  callNow: ['Gọi ngay', 'Call now'],
  toTop: ['Lên đầu trang', 'Back to top'],
}

export function t(key, params) {
  const pair = M[key]
  // Phần tử thứ 3 (nếu có) là dạng số ít tiếng Anh, dùng khi n = 1
  const en = lang.value === 'en'
  let s = pair ? (en && pair[2] && Number(params?.n) === 1 ? pair[2] : pair[en ? 1 : 0]) : key
  if (params) for (const [k, v] of Object.entries(params)) s = s.replaceAll(`{${k}}`, v)
  return s
}

/* ---------------- Danh mục & tên mẫu ---------------- */
const CATS = {
  'hoa chủ đề': 'Occasions',
  'hoa sinh nhật': 'Birthday',
  'hoa đám cưới': 'Wedding',
  'hoa cưới': 'Wedding',
  'hoa tiệc': 'Parties & events',
  'hoa lễ 14/2': 'Valentine’s Day (14/2)',
  'hoa lễ 8/3': 'Women’s Day (8/3)',
  'hoa lễ 20/10': 'Vietnamese Women’s Day (20/10)',
  'hoa lễ 20/11': 'Teachers’ Day (20/11)',
  'hoa hot trend': 'Trending',
  'hoa bó': 'Bouquets',
  'hoa lẵng': 'Flower baskets',
  'hoa bình': 'Vase arrangements',
  'hoa lan hồ điệp': 'Phalaenopsis orchids',
  'kệ hoa khai trương': 'Grand opening stands',
  'kệ hoa chia buồn': 'Sympathy stands',
  'khác': 'Other',
}
export const trCat = (name = '') => (lang.value === 'en' && CATS[name.toLowerCase()]) || name

// Tiền tố tên mẫu (dài trước, ngắn sau)
const NAME_PREFIX = [
  ['Kệ hoa tiệc', 'Party stand'],
  ['Kệ khai trương', 'Grand opening stand'],
  ['Kệ chia buồn', 'Sympathy stand'],
  ['Lan hồ điệp', 'Phalaenopsis orchid'],
  ['Lẵng hoa', 'Flower basket'],
  ['Bình hoa', 'Vase arrangement'],
  ['Hoa cưới', 'Bridal bouquet'],
  ['Bó hoa', 'Bouquet'],
]
export function trName(f) {
  if (lang.value !== 'en') return f.name
  if (f.nameEn) return f.nameEn
  for (const [vi, en] of NAME_PREFIX) if (f.name.startsWith(vi)) return en + f.name.slice(vi.length)
  return f.name
}
export const trDesc = (f) => (lang.value === 'en' && f.descriptionEn) || f.description || ''

/** Tên loại giá: "20 bông" → "20 stems", "2 tầng" → "2-tier", "Size M" giữ nguyên */
export function trVariant(label = '') {
  if (lang.value !== 'en' || !label) return label
  return label
    .replace(/(\d+)\s*(bông|cành)/gi, '$1 stems')
    .replace(/(\d+)\s*tầng/gi, '$1-tier')
}
