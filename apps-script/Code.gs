/**
 * Zacflower — nhận đơn đặt hoa từ website.
 *
 * Cách cài (xem chi tiết trong README.md, mục "Nhận đơn đặt hoa"):
 *   1. Mở Google Sheet (vd "db_hoa") → Tiện ích mở rộng → Apps Script → dán toàn bộ file này → Lưu.
 *   2. Chạy hàm `caiDat` một lần (cấp quyền + tạo trang tính "Đơn hàng" và "Cài đặt").
 *   3. Triển khai → Tùy chọn triển khai mới → Ứng dụng web
 *        Thực thi với tư cách: Tôi   ·   Người có quyền truy cập: Bất kỳ ai
 *   4. Copy URL ứng dụng web → điền vào VITE_ORDER_ENDPOINT của website.
 *
 * Đổi email nhận đơn: sửa ô B2 trong trang tính "Cài đặt" (nhiều email cách nhau bằng dấu phẩy).
 * Không cần sửa code hay triển khai lại.
 */

const SHEET_ORDERS = 'Đơn hàng'
const SHEET_SETTINGS = 'Cài đặt'
const DEFAULT_EMAILS = 'vinhq1618@gmail.com'
const SHOP_NAME = 'Zacflower'

const COLUMNS = [
  ['Thời gian', 'time'],
  ['Mã đơn', 'code'],
  ['Trạng thái', 'status'],
  ['Mẫu hoa', 'flowerName'],
  ['Danh mục', 'category'],
  ['Loại', 'variant'],
  ['Giá', 'price'],
  ['Khách hàng', 'customerName'],
  ['SĐT khách', 'customerPhone'],
  ['Hình thức', 'delivery'],
  ['Ngày nhận', 'date'],
  ['Giờ nhận', 'time_slot'],
  ['Địa chỉ giao', 'address'],
  ['Người nhận', 'recipientName'],
  ['SĐT người nhận', 'recipientPhone'],
  ['Lời nhắn thiệp', 'cardMessage'],
  ['Ghi chú', 'note'],
  ['Mã mẫu', 'flowerId'],
  ['Ảnh mẫu', 'image'],
]

/* ============ Nhận đơn từ website ============ */

function doPost(e) {
  const lock = LockService.getScriptLock()
  try {
    lock.waitLock(20000)
    const data = JSON.parse((e && e.postData && e.postData.contents) || '{}')

    // Chống spam: ô ẩn "website" chỉ bot mới điền
    if (data.website) return json_({ ok: true })

    const err = validate_(data)
    if (err) return json_({ ok: false, error: err })

    const order = sanitize_(data)
    order.time = new Date()
    order.status = 'Mới'
    if (!order.code) order.code = makeCode_()

    const sheet = ordersSheet_()
    sheet.appendRow(COLUMNS.map(([, key]) => (key === 'price' && order.price ? Number(order.price) : order[key] || '')))
    const row = sheet.getLastRow()
    sheet.getRange(row, 7).setNumberFormat('#,##0 "₫"')
    sheet.getRange(row, 9).setNumberFormat('@')

    sendEmail_(order)
    return json_({ ok: true, code: order.code })
  } catch (error) {
    console.error(error)
    return json_({ ok: false, error: 'Lỗi máy chủ: ' + error.message })
  } finally {
    lock.releaseLock()
  }
}

/** Mở URL ứng dụng web trên trình duyệt để kiểm tra đã triển khai đúng chưa */
function doGet() {
  return json_({ ok: true, message: SHOP_NAME + ' – máy chủ nhận đơn đang hoạt động' })
}

/* ============ Cài đặt & kiểm tra (chạy tay trong trình soạn thảo) ============ */

/** Chạy 1 lần sau khi dán code: cấp quyền, tạo trang tính, gửi email thử */
function caiDat() {
  ordersSheet_()
  settingsSheet_()
  guiEmailThu()
}

function guiEmailThu() {
  sendEmail_({
    code: 'ZF-THU-0000',
    flowerName: 'Bó hồng đỏ Classic (đơn thử)',
    category: 'Hoa chủ đề · Hoa sinh nhật',
    variant: '20 bông',
    price: 450000,
    customerName: 'Khách thử',
    customerPhone: '0900000000',
    delivery: 'Giao tận nơi',
    date: Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'yyyy-MM-dd'),
    time_slot: '14:00 – 16:00',
    address: '65 Ngũ Hành Sơn, Đà Nẵng',
    cardMessage: 'Chúc mừng sinh nhật!',
    note: 'Đây là email thử từ hàm guiEmailThu.',
    time: new Date(),
  })
}

/* ============ Hàm nội bộ ============ */

function validate_(d) {
  if (!d.flowerName) return 'Thiếu mẫu hoa.'
  if (!d.customerName || String(d.customerName).trim().length < 2) return 'Vui lòng nhập họ tên.'
  const phone = String(d.customerPhone || '').replace(/[^\d+]/g, '')
  if (phone.length < 9 || phone.length > 15) return 'Số điện thoại không hợp lệ.'
  if (d.delivery === 'Giao tận nơi' && !String(d.address || '').trim()) return 'Vui lòng nhập địa chỉ giao hoa.'
  return ''
}

function sanitize_(d) {
  const out = {}
  COLUMNS.forEach(([, key]) => {
    if (d[key] == null) return
    out[key] = String(d[key]).slice(0, 1000).trim()
  })
  // Chặn công thức trong ô (vd "=HYPERLINK(...)")
  Object.keys(out).forEach((k) => {
    if (/^[=+\-@]/.test(out[k]) && k !== 'customerPhone' && k !== 'recipientPhone') out[k] = "'" + out[k]
  })
  out.code = String(d.code || '').replace(/[^A-Z0-9-]/gi, '').slice(0, 30)
  out.price = d.price ? String(d.price).replace(/[^\d]/g, '') : ''
  return out
}

function ordersSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet()
  let sh = ss.getSheetByName(SHEET_ORDERS)
  if (!sh) {
    sh = ss.insertSheet(SHEET_ORDERS, 0)
    sh.appendRow(COLUMNS.map(([label]) => label))
    sh.setFrozenRows(1)
    sh.getRange(1, 1, 1, COLUMNS.length).setFontWeight('bold').setBackground('#fbecee')
    sh.getRange('A:A').setNumberFormat('dd/MM/yyyy HH:mm')
    const rule = SpreadsheetApp.newDataValidation()
      .requireValueInList(['Mới', 'Đã xác nhận', 'Đang giao', 'Hoàn thành', 'Đã hủy'], true)
      .build()
    sh.getRange('C2:C').setDataValidation(rule)
  }
  return sh
}

function settingsSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet()
  let sh = ss.getSheetByName(SHEET_SETTINGS)
  if (!sh) {
    sh = ss.insertSheet(SHEET_SETTINGS)
    sh.getRange('A1:B1').setValues([['Cài đặt', 'Giá trị']]).setFontWeight('bold').setBackground('#fbecee')
    sh.getRange('A2:B2').setValues([['Email nhận đơn (cách nhau bằng dấu phẩy)', DEFAULT_EMAILS]])
    sh.getRange('A3:B3').setValues([['Tiêu đề email', '🌸 Đơn đặt hoa mới']])
    sh.setColumnWidth(1, 300)
    sh.setColumnWidth(2, 360)
  }
  return sh
}

function setting_(row, fallback) {
  const v = String(settingsSheet_().getRange(row, 2).getValue() || '').trim()
  return v || fallback
}

function sendEmail_(o) {
  const to = setting_(2, DEFAULT_EMAILS)
  const subjectPrefix = setting_(3, '🌸 Đơn đặt hoa mới')
  const money = (n) => (n ? Number(n).toLocaleString('vi-VN') + ' ₫' : 'Liên hệ')
  const esc = (s) => String(s || '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
  const phoneLink = (p) => (p ? '<a href="tel:' + esc(p) + '">' + esc(p) + '</a>' : '')
  const zalo = String(o.customerPhone || '').replace(/[^\d]/g, '')

  const rows = [
    ['Mã đơn', '<b>' + esc(o.code) + '</b>'],
    ['Mẫu hoa', esc(o.flowerName) + (o.variant ? ' — <b>' + esc(o.variant) + '</b>' : '')],
    ['Danh mục', esc(o.category)],
    ['Giá', '<b style="color:#b9677a">' + money(o.price) + '</b>'],
    ['Khách hàng', esc(o.customerName)],
    ['SĐT khách', phoneLink(o.customerPhone) + (zalo ? ' · <a href="https://zalo.me/' + zalo + '">Zalo</a>' : '')],
    ['Hình thức', esc(o.delivery)],
    ['Nhận hoa', esc([o.date, o.time_slot].filter(String).join(' · '))],
    ['Địa chỉ giao', esc(o.address)],
    ['Người nhận', esc([o.recipientName, o.recipientPhone].filter(String).join(' · '))],
    ['Lời nhắn thiệp', esc(o.cardMessage)],
    ['Ghi chú', esc(o.note)],
  ].filter(([, v]) => v)

  const html =
    '<div style="font-family:Arial,sans-serif;max-width:560px;color:#43373a">' +
    '<h2 style="color:#b9677a;margin:0 0 12px">🌸 Đơn đặt hoa mới – ' + esc(o.code) + '</h2>' +
    (o.image ? '<img src="' + esc(o.image) + '" alt="" style="width:220px;border-radius:12px;margin-bottom:12px">' : '') +
    '<table style="border-collapse:collapse;width:100%;font-size:14px">' +
    rows.map(([k, v]) => '<tr><td style="padding:6px 10px;background:#fdf6f5;width:130px;vertical-align:top">' + k + '</td><td style="padding:6px 10px">' + v + '</td></tr>').join('') +
    '</table>' +
    '<p style="font-size:12px;color:#9a8a8e;margin-top:16px">Đơn được lưu trong Google Sheet, trang tính “' + SHEET_ORDERS + '”.</p>' +
    '</div>'

  MailApp.sendEmail({
    to: to,
    subject: subjectPrefix + ' ' + o.code + ' – ' + (o.flowerName || '') + ' – ' + (o.customerName || ''),
    htmlBody: html,
    name: SHOP_NAME + ' Website',
  })
}

function makeCode_() {
  const d = Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'yyMMdd')
  return 'ZF-' + d + '-' + Math.random().toString(36).slice(2, 6).toUpperCase()
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON)
}
