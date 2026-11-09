/**
 * Ghi dữ liệu lên Google Drive cho trang quản lý (#/admin).
 *
 * API key chỉ đọc được, nên để thêm/sửa/xóa cần đăng nhập Google (OAuth, Google Identity Services).
 * Người đăng nhập phải có quyền chỉnh sửa thư mục gốc trên Drive.
 */
import {
  FOLDER_MIME, byFolderName, cleanFolderName, driveConfig, imageUrl, isImage, parseDescription, stripExt,
} from './drive'

const API = 'https://www.googleapis.com/drive/v3'
const UPLOAD = 'https://www.googleapis.com/upload/drive/v3/files'
const SCOPE = 'https://www.googleapis.com/auth/drive'
const TOKEN_KEY = 'zac-admin-token'

const env = import.meta.env
export const adminConfig = {
  clientId: env.VITE_GOOGLE_CLIENT_ID || '',
  admins: (env.VITE_ADMIN_EMAILS || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean),
}
export const isAdminConfigured = () => Boolean(adminConfig.clientId && driveConfig.folderId)

/* ---------------- Đăng nhập ---------------- */

let token = ''
let expiresAt = 0

function saveToken() {
  try {
    sessionStorage.setItem(TOKEN_KEY, JSON.stringify({ token, expiresAt }))
  } catch { /* ignore */ }
}

export function restoreToken() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(TOKEN_KEY) || 'null')
    if (saved && saved.expiresAt > Date.now()) {
      token = saved.token
      expiresAt = saved.expiresAt
      return true
    }
  } catch { /* ignore */ }
  return false
}

function loadGis() {
  if (window.google?.accounts?.oauth2) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://accounts.google.com/gsi/client'
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('Không tải được Google Sign-In. Kiểm tra kết nối mạng.'))
    document.head.appendChild(s)
  })
}

export async function signIn() {
  await loadGis()
  return new Promise((resolve, reject) => {
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: adminConfig.clientId,
      scope: SCOPE,
      callback: (r) => {
        if (r.error) return reject(new Error(r.error_description || r.error))
        token = r.access_token
        expiresAt = Date.now() + (Number(r.expires_in || 3600) - 60) * 1000
        saveToken()
        resolve()
      },
      error_callback: (e) => reject(new Error(e?.type === 'popup_closed' ? 'Bạn đã đóng cửa sổ đăng nhập.' : e?.message || 'Đăng nhập không thành công.')),
    })
    client.requestAccessToken()
  })
}

export function signOut() {
  if (token && window.google?.accounts?.oauth2) window.google.accounts.oauth2.revoke(token, () => {})
  token = ''
  expiresAt = 0
  try {
    sessionStorage.removeItem(TOKEN_KEY)
  } catch { /* ignore */ }
}

export class AuthError extends Error {}

async function api(url, opts = {}) {
  if (!token || Date.now() > expiresAt) throw new AuthError('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.')
  const res = await fetch(url, { ...opts, headers: { Authorization: `Bearer ${token}`, ...opts.headers } })
  if (res.status === 401) {
    signOut()
    throw new AuthError('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.')
  }
  if (!res.ok) {
    let msg = `Google Drive lỗi ${res.status}`
    try {
      const body = await res.json()
      if (body?.error?.message) msg += `: ${body.error.message}`
    } catch { /* ignore */ }
    if (res.status === 403 || res.status === 404) msg += ' — tài khoản này có thể chưa có quyền chỉnh sửa thư mục trên Drive.'
    throw new Error(msg)
  }
  return res.status === 204 ? null : res.json()
}

const withAllDrives = (params = {}) => new URLSearchParams({ supportsAllDrives: 'true', ...params })

export const getUser = () =>
  api(`${API}/about?fields=user(displayName,emailAddress,photoLink)`).then((r) => r.user)

/* ---------------- Đọc cây thư mục ---------------- */

async function listChildren(folderId) {
  const out = []
  let pageToken = ''
  do {
    const params = withAllDrives({
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'nextPageToken, files(id, name, mimeType, description, thumbnailLink, createdTime)',
      pageSize: '1000',
      orderBy: 'createdTime desc',
      includeItemsFromAllDrives: 'true',
    })
    if (pageToken) params.set('pageToken', pageToken)
    const data = await api(`${API}/files?${params}`)
    out.push(...(data.files || []))
    pageToken = data.nextPageToken || ''
  } while (pageToken)
  return out
}

const toItem = (f, folderId) => {
  const { prices, description } = parseDescription(f.description || '')
  const ext = (f.name.match(/\.[^.]+$/) || [''])[0]
  return {
    id: f.id,
    fileName: f.name,
    ext,
    name: stripExt(f.name),
    folderId,
    prices,
    description,
    createdTime: f.createdTime,
    thumb: f.thumbnailLink ? f.thumbnailLink.replace(/=s\d+$/, '=s400') : imageUrl(f.id, 400),
  }
}

/**
 * Trả về:
 *  folders: [{ id, name, label, parentId, depth }]  (depth 1 = danh mục, 2 = danh mục con)
 *  items:   [{ id, name, folderId, prices, description, thumb, ... }]
 */
export async function loadTree() {
  const rootId = driveConfig.folderId
  const rootItems = await listChildren(rootId)
  const level1 = rootItems.filter((f) => f.mimeType === FOLDER_MIME).sort(byFolderName)
  const folders = []
  const items = rootItems.filter(isImage).map((f) => toItem(f, rootId))

  await Promise.all(
    level1.map(async (folder) => {
      const children = await listChildren(folder.id)
      items.push(...children.filter(isImage).map((f) => toItem(f, folder.id)))
      const subs = children.filter((f) => f.mimeType === FOLDER_MIME).sort(byFolderName)
      folder._subs = subs
      await Promise.all(
        subs.map(async (sub) => {
          const subItems = await listChildren(sub.id)
          items.push(...subItems.filter(isImage).map((f) => toItem(f, sub.id)))
        }),
      )
    }),
  )

  for (const f of level1) {
    folders.push({ id: f.id, name: f.name, label: cleanFolderName(f.name), parentId: rootId, depth: 1 })
    for (const s of f._subs) {
      folders.push({ id: s.id, name: s.name, label: cleanFolderName(s.name), parentId: f.id, depth: 2 })
    }
  }
  return { rootId, folders, items }
}

/* ---------------- Ghi ---------------- */

export async function uploadImage(file, { name, description, folderId }) {
  const ext = (file.name.match(/\.[^.]+$/) || [''])[0]
  const meta = { name: `${name}${ext}`, description, parents: [folderId] }
  const boundary = `zac${Math.random().toString(36).slice(2)}`
  const body = new Blob([
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(meta)}\r\n`,
    `--${boundary}\r\nContent-Type: ${file.type || 'application/octet-stream'}\r\n\r\n`,
    file,
    `\r\n--${boundary}--`,
  ])
  return api(`${UPLOAD}?${withAllDrives({ uploadType: 'multipart', fields: 'id' })}`, {
    method: 'POST',
    headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
    body,
  })
}

/** Đổi tên / mô tả / chuyển thư mục */
export function updateFile(id, { name, description, fromFolderId, toFolderId }) {
  const params = withAllDrives({ fields: 'id' })
  if (toFolderId && fromFolderId && toFolderId !== fromFolderId) {
    params.set('addParents', toFolderId)
    params.set('removeParents', fromFolderId)
  }
  const meta = {}
  if (name != null) meta.name = name
  if (description != null) meta.description = description
  return api(`${API}/files/${id}?${params}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(meta),
  })
}

/** Thay ảnh (giữ nguyên file, tên, giá) */
export function replaceImage(id, file) {
  return api(`${UPLOAD}/${id}?${withAllDrives({ uploadType: 'media', fields: 'id' })}`, {
    method: 'PATCH',
    headers: { 'Content-Type': file.type || 'application/octet-stream' },
    body: file,
  })
}

/** Chuyển vào Thùng rác của Drive (khôi phục được trong 30 ngày) */
export function trashFile(id) {
  return api(`${API}/files/${id}?${withAllDrives({ fields: 'id' })}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ trashed: true }),
  })
}

export function createFolder(name, parentId) {
  return api(`${API}/files?${withAllDrives({ fields: 'id' })}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, mimeType: FOLDER_MIME, parents: [parentId] }),
  })
}
