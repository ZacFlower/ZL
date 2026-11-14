/**
 * Google Drive làm "database" cho mẫu hoa.
 *
 * Cấu trúc thư mục trên Drive:
 *   📁 Thư mục gốc (VITE_GDRIVE_FOLDER_ID, chia sẻ công khai "xem")
 *     📁 Hoa cưới            ← mỗi thư mục con = 1 danh mục
 *       🖼 Bó cẩm tú cầu.jpg  ← mỗi ảnh = 1 mẫu hoa (tên file = tên mẫu)
 *     📁 Hoa sinh nhật
 *       🖼 ...
 *   Thư mục cấp 1 có thể chứa thư mục con (danh mục con), vd: Hoa chủ đề › Hoa sinh nhật.
 *   Ảnh đặt trực tiếp ở thư mục gốc sẽ vào danh mục "Khác".
 *
 * Phần "Mô tả" (Description) của file ảnh trên Drive có thể chứa:
 *   Giá: 450000
 *   Bó hồng đỏ 20 bông, giấy gói Hàn Quốc...
 * Dòng "Giá:" (hoặc "Price:") được tách ra thành giá, phần còn lại là mô tả.
 */

const API = 'https://www.googleapis.com/drive/v3/files'
export const FOLDER_MIME = 'application/vnd.google-apps.folder'
const CACHE_KEY = 'flower-gallery-cache-v4'
const CACHE_TTL = 5 * 60 * 1000 // 5 phút

export const driveConfig = {
  apiKey: import.meta.env.VITE_GDRIVE_API_KEY || '',
  folderId: import.meta.env.VITE_GDRIVE_FOLDER_ID || '',
}

export const isDriveConfigured = () => Boolean(driveConfig.apiKey && driveConfig.folderId)

/** Liệt kê toàn bộ file con (tự phân trang). */
async function listChildren(folderId) {
  const files = []
  let pageToken = ''
  do {
    const params = new URLSearchParams({
      q: `'${folderId}' in parents and trashed = false`,
      key: driveConfig.apiKey,
      fields: 'nextPageToken, files(id, name, mimeType, description, createdTime, imageMediaMetadata(width, height))',
      pageSize: '1000',
      orderBy: 'createdTime desc',
      supportsAllDrives: 'true',
      includeItemsFromAllDrives: 'true',
    })
    if (pageToken) params.set('pageToken', pageToken)

    const res = await fetch(`${API}?${params}`)
    if (!res.ok) {
      let msg = `Google Drive API lỗi ${res.status}`
      try {
        const body = await res.json()
        if (body?.error?.message) msg += `: ${body.error.message}`
      } catch { /* ignore */ }
      if (res.status === 403 && /referer/i.test(msg)) {
        msg =
          `API key chưa cho phép địa chỉ ${window.location.origin}. ` +
          `Vào Google Cloud Console → Credentials → API key → Website restrictions và thêm "${window.location.origin}/*" ` +
          `(chờ khoảng 5 phút để có hiệu lực).`
      }
      throw new Error(msg)
    }
    const data = await res.json()
    files.push(...(data.files || []))
    pageToken = data.nextPageToken || ''
  } while (pageToken)
  return files
}

/**
 * Drive trả về danh sách rỗng (không báo lỗi) khi thư mục chưa chia sẻ công khai,
 * nên kiểm tra riêng để báo lỗi dễ hiểu.
 */
async function assertFolderIsPublic(folderId) {
  const params = new URLSearchParams({ key: driveConfig.apiKey, fields: 'id', supportsAllDrives: 'true' })
  const res = await fetch(`${API}/${folderId}?${params}`)
  if (res.status === 404) {
    throw new Error(
      'Không truy cập được thư mục Google Drive. Hãy kiểm tra VITE_GDRIVE_FOLDER_ID và chia sẻ thư mục ở chế độ "Bất kỳ ai có đường liên kết – Người xem".',
    )
  }
}

/** Link ảnh công khai (file phải được chia sẻ "Bất kỳ ai có liên kết"). */
export const imageUrl = (id, size = 800) => `https://drive.google.com/thumbnail?id=${id}&sz=w${size}`

export const stripExt = (name) => name.replace(/\.[^.]+$/, '')

/**
 * Đọc số tiền: "450000", "450.000đ", "450k", "1tr2", "1,5tr", "1.200.000 VNĐ"
 */
export function parseMoney(raw = '') {
  const s = raw.toLowerCase().replace(/\s+/g, '')
  const tr = s.match(/^(\d+(?:[.,]\d+)?)(?:tr|triệu|trieu)(\d*)/)
  if (tr) {
    const base = parseFloat(tr[1].replace(',', '.')) * 1_000_000
    const tail = tr[2] ? Number(`0.${tr[2]}`) * 1_000_000 : 0
    return Math.round(base + tail)
  }
  const k = s.match(/^(\d+(?:[.,]\d+)?)k/)
  if (k) return Math.round(parseFloat(k[1].replace(',', '.')) * 1000)
  const digits = s.replace(/[^\d]/g, '')
  return digits ? Number(digits) : null
}

/**
 * Mô tả trên Drive:
 *   Giá: 450000                 → 1 giá
 *   Giá size S: 350k            → nhiều loại giá
 *   Giá size M: 500k
 *   Giá 30 bông: 1tr2
 *   Bó hồng đỏ, giấy gói Hàn…   → các dòng còn lại là mô tả
 */
export function parseDescription(text = '') {
  const prices = []
  const lines = []
  let nameEn = ''
  const descEn = []
  for (const line of text.split(/\r?\n/)) {
    // Tiếng Anh (không bắt buộc): "Tên EN: Red rose bouquet" / "Mô tả EN: 20 Ecuador roses…"
    const en = line.match(/^\s*(tên|ten|mô tả|mo ta)\s*(?:en|tiếng anh|tieng anh)\s*[:=]\s*(.*)$/i)
    if (en) {
      if (/^t/i.test(en[1])) nameEn = en[2].trim()
      else if (en[2].trim()) descEn.push(en[2].trim())
      continue
    }
    const m = line.match(/^\s*(?:giá|gia|price)\s*([^:=]*?)\s*[:=]\s*(.+)$/i)
    const value = m ? parseMoney(m[2]) : null
    if (value != null) prices.push({ label: m[1].replace(/^[-–(]\s*|\s*[)]$/g, '').trim(), price: value })
    else lines.push(line)
  }
  return { prices, description: lines.join('\n').trim(), nameEn, descriptionEn: descEn.join('\n') }
}

/**
 * Thứ tự hiển thị mặc định của danh mục (tên không có trong danh sách xếp sau, theo A–Z).
 * Có thể ghi đè bằng cách đánh số ở đầu tên thư mục: "01. Hoa chủ đề", "2 - Hoa bó"...
 */
const PREFERRED_ORDER = [
  'Hoa chủ đề', 'Hoa sinh nhật', 'Hoa đám cưới', 'Hoa tiệc',
  'Hoa lễ 14/2', 'Hoa lễ 8/3', 'Hoa lễ 20/10', 'Hoa lễ 20/11',
  'Hoa hot trend', 'Hoa bó', 'Hoa lẵng', 'Hoa bình', 'Hoa lan hồ điệp',
  'Kệ hoa khai trương', 'Kệ hoa chia buồn',
].map((s) => s.toLowerCase())

const NUM_PREFIX = /^\s*(\d+)\s*[.\-_)]\s*/
export const cleanFolderName = (name) => name.replace(NUM_PREFIX, '').trim() || name
export function byFolderName(a, b) {
  const na = a.name.match(NUM_PREFIX)
  const nb = b.name.match(NUM_PREFIX)
  if (na || nb) return (na ? +na[1] : 1e9) - (nb ? +nb[1] : 1e9) || a.name.localeCompare(b.name, 'vi')
  const ia = PREFERRED_ORDER.indexOf(cleanFolderName(a.name).toLowerCase())
  const ib = PREFERRED_ORDER.indexOf(cleanFolderName(b.name).toLowerCase())
  return (ia < 0 ? 1e9 : ia) - (ib < 0 ? 1e9 : ib) || a.name.localeCompare(b.name, 'vi', { numeric: true })
}

function toFlower(file, category, subcategory = null) {
  const { prices, description, nameEn, descriptionEn } = parseDescription(file.description)
  return {
    id: file.id,
    name: stripExt(file.name),
    nameEn,
    descriptionEn,
    category,
    subcategory,
    prices,
    price: prices.length ? Math.min(...prices.map((p) => p.price)) : null,
    description,
    createdTime: file.createdTime,
    thumb: imageUrl(file.id, 600),
    image: imageUrl(file.id, 1600),
  }
}

export const isImage = (f) => f.mimeType?.startsWith('image/')

/** Đọc toàn bộ mẫu hoa từ Drive. Trả về { categories, flowers }. */
export async function fetchFlowersFromDrive({ force = false } = {}) {
  if (!force) {
    try {
      const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY) || 'null')
      if (cached && Date.now() - cached.at < CACHE_TTL) return cached.data
    } catch { /* storage có thể bị chặn */ }
  }

  const rootItems = await listChildren(driveConfig.folderId)
  if (!rootItems.length) await assertFolderIsPublic(driveConfig.folderId)
  const folders = rootItems.filter((f) => f.mimeType === FOLDER_MIME).sort(byFolderName)
  const rootImages = rootItems.filter(isImage)

  // Cấp 1: danh mục (Hoa bó, Hoa lẵng...). Cấp 2: danh mục con (Hoa chủ đề › Hoa sinh nhật...)
  const tree = await Promise.all(
    folders.map(async (folder) => {
      const category = cleanFolderName(folder.name)
      const items = await listChildren(folder.id)
      const subFolders = items.filter((f) => f.mimeType === FOLDER_MIME).sort(byFolderName)
      const subResults = await Promise.all(
        subFolders.map(async (sub) => {
          const subName = cleanFolderName(sub.name)
          const subItems = await listChildren(sub.id)
          return { name: subName, flowers: subItems.filter(isImage).map((f) => toFlower(f, category, subName)) }
        }),
      )
      return {
        category: { name: category, children: subResults.map((s) => s.name) },
        flowers: [
          ...items.filter(isImage).map((f) => toFlower(f, category)),
          ...subResults.flatMap((s) => s.flowers),
        ],
      }
    }),
  )

  const flowers = [...tree.flatMap((t) => t.flowers), ...rootImages.map((f) => toFlower(f, 'Khác'))]
  const categories = tree.map((t) => t.category)
  if (rootImages.length) categories.push({ name: 'Khác', children: [] })
  const data = { categories, flowers }

  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), data }))
  } catch { /* ignore */ }
  return data
}

/** Xóa cache để trang công khai tải lại dữ liệu mới ngay (dùng sau khi trang quản lý lưu thay đổi). */
export function clearPublicCache() {
  try {
    sessionStorage.removeItem(CACHE_KEY)
  } catch { /* ignore */ }
}

/** Ghép giá + mô tả thành nội dung ô "Mô tả" trên Drive (ngược với parseDescription). */
export function composeDescription(prices = [], description = '', { nameEn = '', descriptionEn = '' } = {}) {
  const lines = prices
    .filter((p) => p.price != null)
    .map((p) => (p.label?.trim() ? `Giá ${p.label.trim()}: ${p.price}` : `Giá: ${p.price}`))
  const en = []
  if (nameEn.trim()) en.push(`Tên EN: ${nameEn.trim().replace(/\s*\n\s*/g, ' ')}`)
  for (const l of descriptionEn.split(/\r?\n/)) if (l.trim()) en.push(`Mô tả EN: ${l.trim()}`)
  return [...lines, ...en, description.trim()].filter(Boolean).join('\n')
}
