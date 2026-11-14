/**
 * Router nhỏ dựa trên hash (không cần cấu hình server khi deploy):
 *   #/                         → trang chủ
 *   #/san-pham?q=hong          → tất cả mẫu hoa (+ tìm kiếm)
 *   #/danh-muc/hoa-bo          → danh mục
 *   #/danh-muc/hoa-chu-de/hoa-sinh-nhat → danh mục con
 *   #/mau/<id>                 → mở thẳng 1 mẫu hoa (link gửi kèm đơn đặt hoa)
 *   #/admin                    → trang quản lý (thêm / sửa / xóa mẫu hoa)
 */
import { computed, ref } from 'vue'

const hash = ref(window.location.hash)
window.addEventListener('hashchange', () => {
  hash.value = window.location.hash
  window.scrollTo({ top: 0 })
})

export const route = computed(() => {
  const [path = '', query = ''] = hash.value.replace(/^#/, '').split('?')
  const parts = path.split('/').filter(Boolean)
  const q = new URLSearchParams(query).get('q') || ''
  if (parts[0] === 'danh-muc') return { name: 'category', cat: parts[1] || '', sub: parts[2] || '', q }
  if (parts[0] === 'san-pham') return { name: 'category', cat: '', sub: '', q }
  if (parts[0] === 'admin') return { name: 'admin', cat: '', sub: '', q: '' }
  if (parts[0] === 'mau' && parts[1]) return { name: 'design', id: decodeURIComponent(parts[1]), cat: '', sub: '', q: '' }
  return { name: 'home', cat: '', sub: '', q: '' }
})

/** Địa chỉ gốc của web (giữ cả đường dẫn con, vd https://zacflower.github.io/ZL/) */
export const siteUrl = () => window.location.origin + window.location.pathname

/** Link mở thẳng 1 mẫu hoa */
export const designLink = (id) => `${siteUrl()}#/mau/${encodeURIComponent(id)}`

export const go = (path) => {
  window.location.hash = path
}

export const scrollToId = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
