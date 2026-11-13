/**
 * Gửi đơn đặt hoa tới Google Apps Script (lưu Google Sheet + gửi email cho shop).
 * URL ứng dụng web đặt trong VITE_ORDER_ENDPOINT. Chưa có thì vẫn đặt được qua Zalo / WhatsApp.
 */
import { shop } from '../shop'
import { formatPrice } from '../composables/useFlowers'

export const orderEndpoint = import.meta.env.VITE_ORDER_ENDPOINT || ''

export function makeOrderCode() {
  const d = new Date()
  const ymd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
  return `ZF-${ymd}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
}

/** Gửi đơn. Trả về { ok, code } hoặc ném lỗi có thông báo tiếng Việt. */
export async function submitOrder(order) {
  if (!orderEndpoint) throw new Error('Chưa cấu hình máy chủ nhận đơn.')
  let res
  try {
    // text/plain để tránh preflight CORS (Apps Script không xử lý OPTIONS)
    res = await fetch(orderEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(order),
      redirect: 'follow',
    })
  } catch {
    throw new Error('Không gửi được đơn do lỗi mạng.')
  }
  let data = null
  try {
    data = await res.json()
  } catch { /* ignore */ }
  if (!res.ok || !data?.ok) throw new Error(data?.error || `Không gửi được đơn (mã ${res.status}).`)
  return data
}

/** Nội dung đơn dạng tin nhắn — dùng cho Zalo (sao chép) và WhatsApp (điền sẵn) */
export function orderText(o) {
  const lines = [
    `🌸 ĐẶT HOA – ${shop.name}`,
    `Mã đơn: ${o.code}`,
    `Mẫu: ${o.flowerName}${o.variant ? ` (${o.variant})` : ''}`,
    `Giá: ${o.price ? formatPrice(Number(o.price)) : 'Liên hệ'}`,
    `Khách: ${o.customerName} – ${o.customerPhone}`,
    `Hình thức: ${o.delivery}`,
    (o.date || o.time_slot) && `Nhận hoa: ${[o.date && formatDate(o.date), o.time_slot].filter(Boolean).join(' · ')}`,
    o.address && `Địa chỉ: ${o.address}`,
    (o.recipientName || o.recipientPhone) && `Người nhận: ${[o.recipientName, o.recipientPhone].filter(Boolean).join(' – ')}`,
    o.cardMessage && `Lời nhắn thiệp: ${o.cardMessage}`,
    o.note && `Ghi chú: ${o.note}`,
  ]
  return lines.filter(Boolean).join('\n')
}

export const formatDate = (iso) => {
  const [y, m, d] = String(iso).split('-')
  return d ? `${d}/${m}/${y}` : iso
}

export const zaloLink = () => (shop.zalo ? `https://zalo.me/${shop.zalo}` : '')
export const whatsappLink = (text = '') =>
  shop.whatsapp ? `https://wa.me/${shop.whatsapp}${text ? `?text=${encodeURIComponent(text)}` : ''}` : ''

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Trình duyệt cũ / không cho phép clipboard
    const ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', '')
    ta.style.cssText = 'position:fixed;opacity:0'
    document.body.appendChild(ta)
    ta.select()
    let ok = false
    try {
      ok = document.execCommand('copy')
    } catch { /* ignore */ }
    ta.remove()
    return ok
  }
}
