/**
 * Router nhỏ dựa trên hash (không cần cấu hình server khi deploy):
 *   #/                         → trang chủ
 *   #/san-pham?q=hong          → tất cả mẫu hoa (+ tìm kiếm)
 *   #/danh-muc/hoa-bo          → danh mục
 *   #/danh-muc/hoa-chu-de/hoa-sinh-nhat → danh mục con
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
  return { name: 'home', cat: '', sub: '', q: '' }
})

export const go = (path) => {
  window.location.hash = path
}

export const scrollToId = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
