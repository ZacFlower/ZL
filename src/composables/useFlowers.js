/**
 * Kho dữ liệu dùng chung (singleton): danh mục + mẫu hoa từ Google Drive (hoặc dữ liệu mẫu).
 */
import { computed, ref } from 'vue'
import { fetchFlowersFromDrive, isDriveConfigured } from '../services/drive'
import { demoData } from '../data/demo'
import { lang, t, trCat, trName } from '../i18n'

export const ALL = 'Tất cả'

export const flowers = ref([])
/** [{ name: 'Hoa chủ đề', children: ['Hoa sinh nhật', ...] }, { name: 'Hoa bó', children: [] }] */
export const categories = ref([])
export const loading = ref(true)
export const error = ref('')
export const isDemo = !isDriveConfigured()

export async function loadCatalog(force = false) {
  loading.value = true
  error.value = ''
  try {
    const data = isDemo ? demoData : await fetchFlowersFromDrive({ force })
    flowers.value = data.flowers
    categories.value = data.categories
  } catch (e) {
    error.value = e.message || 'Không tải được dữ liệu'
  } finally {
    loading.value = false
  }
}

/** "Hoa lễ 14/2" → "hoa-le-14-2" */
export const slugify = (s = '') =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

const normalize = (s = '') =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd')

export const categoryLink = (cat, sub) => `#/danh-muc/${slugify(cat)}${sub ? `/${slugify(sub)}` : ''}`

export const PRICE_RANGES = [
  { id: 'duoi-350k', min: 0, max: 350000 },
  { id: '350k-500k', min: 350000, max: 500000 },
  { id: '500k-700k', min: 500000, max: 700000 },
  { id: '700k-1tr', min: 700000, max: 1000000 },
  { id: 'tren-1tr', min: 1000000, max: Infinity },
]
export const rangeLabel = (r) => {
  if (!r.min) return t('under', { a: formatPrice(r.max) })
  if (r.max === Infinity) return t('over', { a: formatPrice(r.min) })
  return `${formatPrice(r.min)} – ${formatPrice(r.max)}`
}

/** Lọc + sắp xếp mẫu hoa */
export function queryFlowers({ category, sub, q = '', range = '', sort = 'newest' } = {}) {
  const nq = normalize(q.trim())
  const r = PRICE_RANGES.find((x) => x.id === range)
  let list = flowers.value.filter(
    (f) =>
      (!category || f.category === category) &&
      (!sub || f.subcategory === sub) &&
      (!r || (f.price != null && f.price >= r.min && f.price < r.max)) &&
      (!nq ||
        normalize(
          `${f.name} ${f.nameEn || ''} ${trName(f)} ${f.category} ${trCat(f.category)} ` +
            `${f.subcategory || ''} ${f.subcategory ? trCat(f.subcategory) : ''} ${f.description} ${f.descriptionEn || ''}`,
        ).includes(nq)),
  )
  const byPrice = (dir) => (a, b) => {
    if (a.price == null) return 1
    if (b.price == null) return -1
    return dir * (a.price - b.price)
  }
  if (sort === 'price-asc') list = [...list].sort(byPrice(1))
  else if (sort === 'price-desc') list = [...list].sort(byPrice(-1))
  else if (sort === 'name') list = [...list].sort((a, b) => a.name.localeCompare(b.name, 'vi'))
  else list = [...list].sort((a, b) => (b.createdTime || '').localeCompare(a.createdTime || ''))
  return list
}

/** Đếm số mẫu: key "Tất cả", "Hoa chủ đề", "Hoa chủ đề/Hoa sinh nhật" */
export const countBy = computed(() => {
  const m = { [ALL]: flowers.value.length }
  for (const f of flowers.value) {
    m[f.category] = (m[f.category] || 0) + 1
    if (f.subcategory) {
      const k = `${f.category}/${f.subcategory}`
      m[k] = (m[k] || 0) + 1
    }
  }
  return m
})

export const formatPrice = (p) =>
  p == null ? t('onRequest') : p.toLocaleString(lang.value === 'en' ? 'en-US' : 'vi-VN') + ' ₫'

/** Giá hiển thị trên thẻ: 1 giá → "450.000 ₫", nhiều loại → "Từ 350.000 ₫" */
export const cardPrice = (f) => {
  const n = f.prices?.length || 0
  if (!n) return formatPrice(f.price)
  return (n > 1 ? t('from') : '') + formatPrice(f.price)
}

export const categoryLabel = (f) =>
  f.subcategory ? `${trCat(f.category)} · ${trCat(f.subcategory)}` : trCat(f.category)

/** Biểu tượng minh hoạ cho danh mục chưa có ảnh */
export function categoryEmoji(name = '') {
  const n = normalize(name)
  if (n.includes('chia buon')) return '🤍'
  if (n.includes('khai truong')) return '🎊'
  if (n.includes('lan')) return '🪻'
  if (n.includes('binh')) return '🏺'
  if (n.includes('lang')) return '🧺'
  if (n.includes('hot')) return '✨'
  if (n.includes('sinh nhat')) return '🎂'
  if (n.includes('cuoi')) return '💍'
  if (n.includes('tiec')) return '🥂'
  if (n.includes('14')) return '💘'
  if (n.includes('8') || n.includes('20')) return '🌷'
  if (n.includes('chu de')) return '🎀'
  return '💐'
}
