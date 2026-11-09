<script setup>
import { computed, onMounted, ref } from 'vue'
import {
  AuthError, adminConfig, createFolder, getUser, isAdminConfigured, loadTree, replaceImage,
  restoreToken, signIn, signOut, trashFile, updateFile, uploadImage,
} from '../../services/driveAdmin'
import { clearPublicCache, composeDescription, stripExt } from '../../services/drive'
import { formatPrice, loadCatalog } from '../../composables/useFlowers'
import FlowerEditor from './FlowerEditor.vue'

const configured = isAdminConfigured()
const stage = ref('signin') // signin | loading | ready | denied
const user = ref(null)
const tree = ref({ rootId: '', folders: [], items: [] })
const current = ref('') // id thư mục đang xem; '' = tất cả
const q = ref('')
const editor = ref(null) // { item } — item null = thêm mới
const busy = ref(false)
const error = ref('')
const editorError = ref('')
const toast = ref('')
const progress = ref('')

/* ---------- Đăng nhập ---------- */
async function start() {
  stage.value = 'loading'
  error.value = ''
  try {
    user.value = await getUser()
    const email = (user.value?.emailAddress || '').toLowerCase()
    if (adminConfig.admins.length && !adminConfig.admins.includes(email)) {
      stage.value = 'denied'
      return
    }
    await refresh()
    stage.value = 'ready'
  } catch (e) {
    fail(e)
  }
}
async function login() {
  error.value = ''
  try {
    await signIn()
    await start()
  } catch (e) {
    fail(e)
  }
}
function logout() {
  signOut()
  user.value = null
  stage.value = 'signin'
}
function fail(e) {
  if (e instanceof AuthError) stage.value = 'signin'
  else if (stage.value === 'loading') stage.value = 'signin'
  error.value = e.message || String(e)
}

onMounted(() => {
  if (configured && restoreToken()) start()
})

/* ---------- Dữ liệu ---------- */
async function refresh() {
  tree.value = await loadTree()
  if (current.value && !tree.value.folders.some((f) => f.id === current.value)) current.value = ''
}
async function afterChange(msg) {
  clearPublicCache()
  await refresh()
  loadCatalog(true)
  showToast(msg)
}
let toastTimer
function showToast(msg) {
  toast.value = msg
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toast.value = ''), 3200)
}

const folderById = computed(() => Object.fromEntries(tree.value.folders.map((f) => [f.id, f])))
const level1 = computed(() => tree.value.folders.filter((f) => f.depth === 1))
const subsOf = (id) => tree.value.folders.filter((f) => f.parentId === id)
const pathOf = (folderId) => {
  const f = folderById.value[folderId]
  if (!f) return 'Khác (thư mục gốc)'
  if (f.depth === 1) return f.label
  return `${folderById.value[f.parentId]?.label || ''} › ${f.label}`
}
const currentFolder = computed(() => folderById.value[current.value] || null)

const count = computed(() => {
  const m = {}
  for (const it of tree.value.items) {
    m[it.folderId] = (m[it.folderId] || 0) + 1
    const parent = folderById.value[it.folderId]?.parentId
    if (parent && parent !== tree.value.rootId) m[parent] = (m[parent] || 0) + 1
  }
  return m
})

const normalize = (s = '') => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd')
const list = computed(() => {
  const nq = normalize(q.value.trim())
  return tree.value.items.filter((it) => {
    if (current.value) {
      const f = folderById.value[it.folderId]
      if (it.folderId !== current.value && f?.parentId !== current.value) return false
    }
    return !nq || normalize(`${it.name} ${it.description}`).includes(nq)
  })
})

const priceText = (it) =>
  it.prices.length ? it.prices.map((p) => (p.label ? `${p.label}: ${formatPrice(p.price)}` : formatPrice(p.price))) : ['Liên hệ']

/* ---------- Thêm / sửa / xóa ---------- */
const openNew = () => {
  editorError.value = ''
  editor.value = { item: null }
}
const openEdit = (item) => {
  editorError.value = ''
  editor.value = { item }
}

async function onSave(p) {
  busy.value = true
  editorError.value = ''
  try {
    const description = composeDescription(p.prices, p.description)
    const item = editor.value.item
    if (!item) {
      await uploadImage(p.file, { name: p.name, description, folderId: p.folderId })
    } else {
      await updateFile(item.id, {
        name: `${p.name}${item.ext}`,
        description,
        fromFolderId: item.folderId,
        toFolderId: p.folderId,
      })
      if (p.file) await replaceImage(item.id, p.file)
    }
    editor.value = null
    await afterChange(`Đã lưu “${p.name}”`)
  } catch (e) {
    if (e instanceof AuthError) {
      editor.value = null
      fail(e)
    } else editorError.value = e.message
  } finally {
    busy.value = false
  }
}

async function remove(item) {
  const ok = window.confirm(
    `Xóa mẫu “${item.name}”?\n\nẢnh sẽ được chuyển vào Thùng rác của Google Drive (khôi phục được trong 30 ngày).`,
  )
  if (!ok) return
  busy.value = true
  try {
    await trashFile(item.id)
    await afterChange(`Đã xóa “${item.name}”`)
  } catch (e) {
    fail(e)
  } finally {
    busy.value = false
  }
}

async function bulkUpload(e) {
  const files = [...(e.target.files || [])].filter((f) => f.type.startsWith('image/'))
  e.target.value = ''
  if (!files.length || !current.value) return
  busy.value = true
  try {
    for (const [i, f] of files.entries()) {
      progress.value = `Đang tải ảnh ${i + 1}/${files.length}: ${f.name}`
      await uploadImage(f, { name: stripExt(f.name), description: '', folderId: current.value })
    }
    await afterChange(`Đã tải lên ${files.length} ảnh — bấm “Sửa” để nhập giá`)
  } catch (err) {
    fail(err)
  } finally {
    progress.value = ''
    busy.value = false
  }
}

async function addFolder(parent) {
  const where = parent ? `trong “${parent.label}”` : ''
  const name = window.prompt(`Tên danh mục mới ${where}:`)?.trim()
  if (!name) return
  busy.value = true
  try {
    await createFolder(name, parent ? parent.id : tree.value.rootId)
    await afterChange(`Đã tạo danh mục “${name}”`)
  } catch (e) {
    fail(e)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="admin">
    <header class="abar">
      <a href="#/" class="brand"><span class="mark">✿</span><b>Zacflower</b><small>Quản lý mẫu hoa</small></a>
      <div class="right">
        <a href="#/" class="link">← Xem trang web</a>
        <template v-if="user">
          <span class="who">
            <img v-if="user.photoLink" :src="user.photoLink" alt="" referrerpolicy="no-referrer" />
            {{ user.emailAddress }}
          </span>
          <button class="link" @click="logout">Đăng xuất</button>
        </template>
      </div>
    </header>

    <!-- Chưa cấu hình -->
    <section v-if="!configured" class="card center">
      <h1>Cần cấu hình trang quản lý</h1>
      <p>Để thêm / sửa mẫu hoa trực tiếp lên Google Drive, điền vào file <code>.env</code>:</p>
      <pre>VITE_GOOGLE_CLIENT_ID=xxxxxxxx.apps.googleusercontent.com
VITE_ADMIN_EMAILS=email-cua-ban@gmail.com</pre>
      <p>Xem hướng dẫn chi tiết trong <code>README.md</code> (mục “Trang quản lý”).</p>
    </section>

    <!-- Đăng nhập -->
    <section v-else-if="stage === 'signin'" class="card center">
      <div class="big">🌷</div>
      <h1>Đăng nhập để quản lý mẫu hoa</h1>
      <p>Dùng tài khoản Google có quyền chỉnh sửa thư mục ZacFlower trên Drive.</p>
      <button class="btn gbtn" @click="login">
        <svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3a12 12 0 0 1-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.3-.4-3.5z"/></svg>
        Đăng nhập bằng Google
      </button>
      <p v-if="error" class="err">{{ error }}</p>
    </section>

    <section v-else-if="stage === 'loading'" class="card center">
      <div class="spinner" aria-hidden="true" />
      <p>Đang tải dữ liệu từ Google Drive…</p>
    </section>

    <section v-else-if="stage === 'denied'" class="card center">
      <div class="big">🔒</div>
      <h1>Tài khoản không có quyền quản lý</h1>
      <p><b>{{ user?.emailAddress }}</b> không nằm trong danh sách quản trị.</p>
      <button class="btn ghost" @click="logout">Đăng nhập tài khoản khác</button>
    </section>

    <!-- Bàn làm việc -->
    <div v-else class="workspace">
      <aside class="side">
        <h4>Danh mục</h4>
        <ul>
          <li>
            <button :class="{ on: !current }" @click="current = ''">Tất cả <span>{{ tree.items.length }}</span></button>
          </li>
          <li v-for="f in level1" :key="f.id">
            <button :class="{ on: current === f.id }" @click="current = f.id">{{ f.label }} <span>{{ count[f.id] || 0 }}</span></button>
            <ul v-if="subsOf(f.id).length" class="subs">
              <li v-for="s in subsOf(f.id)" :key="s.id">
                <button :class="{ on: current === s.id }" @click="current = s.id">{{ s.label }} <span>{{ count[s.id] || 0 }}</span></button>
              </li>
            </ul>
          </li>
        </ul>
        <div class="side-actions">
          <button class="mini" :disabled="busy" @click="addFolder(null)">+ Danh mục</button>
          <button v-if="currentFolder?.depth === 1" class="mini" :disabled="busy" @click="addFolder(currentFolder)">+ Danh mục con trong “{{ currentFolder.label }}”</button>
        </div>
      </aside>

      <section class="main">
        <div class="head">
          <div>
            <h1>{{ currentFolder ? pathOf(currentFolder.id) : 'Tất cả mẫu hoa' }}</h1>
            <p>{{ list.length }} mẫu</p>
          </div>
          <div class="actions">
            <input v-model="q" type="search" placeholder="Tìm mẫu…" aria-label="Tìm mẫu" />
            <label class="btn ghost" :class="{ disabled: !current || busy }" :title="current ? '' : 'Chọn một danh mục trước'">
              Tải nhiều ảnh
              <input type="file" accept="image/*" multiple :disabled="!current || busy" @change="bulkUpload" />
            </label>
            <button class="btn" :disabled="busy || !tree.folders.length" @click="openNew">+ Thêm mẫu hoa</button>
          </div>
        </div>

        <p v-if="progress" class="progress">{{ progress }}</p>
        <p v-if="error" class="err banner">{{ error }} <button class="link" @click="error = ''">Đóng</button></p>

        <div v-if="!list.length" class="empty">
          <p>{{ q ? 'Không tìm thấy mẫu phù hợp.' : 'Chưa có mẫu hoa nào trong danh mục này.' }}</p>
          <button v-if="!q" class="btn" @click="openNew">+ Thêm mẫu hoa đầu tiên</button>
        </div>

        <ul v-else class="rows">
          <li v-for="it in list" :key="it.id">
            <img :src="it.thumb" :alt="it.name" loading="lazy" referrerpolicy="no-referrer" />
            <div class="info">
              <b>{{ it.name }}</b>
              <small>{{ pathOf(it.folderId) }}</small>
              <div class="prices">
                <span v-for="t in priceText(it)" :key="t" :class="{ contact: !it.prices.length }">{{ t }}</span>
              </div>
              <p v-if="it.description">{{ it.description }}</p>
            </div>
            <div class="row-actions">
              <button class="btn soft" :disabled="busy" @click="openEdit(it)">Sửa</button>
              <button class="del" :disabled="busy" @click="remove(it)">Xóa</button>
            </div>
          </li>
        </ul>
      </section>
    </div>

    <FlowerEditor
      v-if="editor"
      :item="editor.item"
      :folders="tree.folders"
      :default-folder-id="current"
      :busy="busy"
      :error="editorError"
      @close="editor = null"
      @save="onSave"
    />

    <Transition name="toast"><div v-if="toast" class="toast" role="status">✓ {{ toast }}</div></Transition>
  </div>
</template>

<style scoped>
.admin { min-height: 100vh; background: #faf6f5; }
.abar {
  position: sticky; top: 0; z-index: 20; display: flex; justify-content: space-between; align-items: center; gap: 16px;
  padding: 12px 24px; background: #fff; box-shadow: 0 1px 0 var(--line);
}
.brand { display: flex; align-items: center; gap: 10px; text-decoration: none; color: var(--text); }
.mark { width: 36px; height: 36px; border-radius: 50%; display: grid; place-items: center; background: var(--grad); color: #fff; }
.brand b { font-family: var(--serif); font-weight: 500; font-size: 22px; }
.brand small { padding: 3px 10px; border-radius: 999px; background: var(--primary-soft); color: var(--primary-deep); font-size: 12px; }
.right { display: flex; align-items: center; gap: 18px; font-size: 14px; flex-wrap: wrap; justify-content: flex-end; }
.link { border: 0; background: none; padding: 0; color: var(--primary-deep); text-decoration: none; font-size: 14px; }
.link:hover { text-decoration: underline; }
.who { display: flex; align-items: center; gap: 8px; color: var(--muted); }
.who img { width: 28px; height: 28px; border-radius: 50%; }

.card { width: calc(100% - 32px); max-width: 520px; margin: 64px auto; padding: 40px 32px; background: #fff; border-radius: 24px; box-shadow: var(--shadow); }
.center { text-align: center; }
.card h1 { font-family: var(--serif); font-weight: 400; font-size: 28px; margin: 8px 0 10px; }
.card p { color: #6d5f62; }
.card pre { text-align: left; background: #fdf6f5; padding: 14px; border-radius: 12px; font-size: 13px; overflow-x: auto; }
.card code { background: var(--primary-soft); padding: 1px 6px; border-radius: 6px; }
.big { font-size: 48px; }
.gbtn { background: #fff; color: var(--text); box-shadow: inset 0 0 0 1px #e3d3d6, var(--shadow-sm); margin-top: 8px; }
.gbtn:hover { box-shadow: inset 0 0 0 1px var(--primary), var(--shadow-sm); }
.err { color: #c0392b; font-size: 14px; }
.spinner { width: 40px; height: 40px; margin: 0 auto 12px; border-radius: 50%; border: 3px solid var(--primary-soft); border-top-color: var(--primary); animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.workspace { display: grid; grid-template-columns: 260px 1fr; gap: 24px; padding: 24px; max-width: 1400px; margin: 0 auto; align-items: start; }
.side { position: sticky; top: 84px; padding: 16px; background: #fff; border-radius: 20px; box-shadow: inset 0 0 0 1px var(--line); }
.side h4 { margin: 0 0 10px; font-size: 13px; text-transform: uppercase; letter-spacing: .06em; color: var(--muted); }
.side ul { list-style: none; margin: 0; padding: 0; }
.side button:not(.mini) {
  width: 100%; display: flex; justify-content: space-between; gap: 8px; padding: 8px 10px; border: 0; border-radius: 10px;
  background: none; text-align: left; font-size: 14.5px; color: var(--text);
}
.side button span { color: var(--muted); font-size: 12.5px; }
.side button:not(.mini):hover { background: #fdf6f5; }
.side button.on { background: var(--primary-soft); color: var(--primary-deep); font-weight: 500; }
.subs { margin-left: 10px !important; padding-left: 8px !important; border-left: 2px solid var(--primary-soft); }
.subs button { font-size: 14px !important; }
.side-actions { display: grid; gap: 6px; margin-top: 14px; padding-top: 12px; border-top: 1px solid var(--line); }
.mini { border: 0; background: none; color: var(--primary-deep); text-align: left; padding: 4px 2px; font-size: 13.5px; font-weight: 500; }
.mini:disabled { opacity: .5; }

.head { display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; margin-bottom: 16px; }
.head h1 { margin: 0; font-family: var(--serif); font-weight: 400; font-size: 28px; }
.head p { margin: 2px 0 0; color: var(--muted); font-size: 14px; }
.actions { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
.actions input[type='search'] {
  height: 42px; padding: 0 14px; border: 0; border-radius: 999px; background: #fff; box-shadow: inset 0 0 0 1px var(--line);
  font: inherit; font-size: 14px; outline: none; width: 200px;
}
.actions .btn { padding: 10px 18px; font-size: 14px; }
.actions label.btn { position: relative; cursor: pointer; }
.actions label.btn input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
.actions .disabled { opacity: .5; cursor: default; }
.actions .disabled input { cursor: default; }
.btn:disabled { opacity: .55; cursor: default; transform: none; }

.progress { padding: 10px 14px; border-radius: 12px; background: var(--sage-soft); color: #5d7564; font-size: 14px; }
.banner { padding: 10px 14px; border-radius: 12px; background: #fdecea; }
.empty { text-align: center; padding: 56px 16px; background: #fff; border-radius: 20px; color: var(--muted); box-shadow: inset 0 0 0 1px var(--line); }

.rows { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
.rows li {
  display: grid; grid-template-columns: 88px 1fr auto; gap: 16px; align-items: center;
  padding: 10px 14px 10px 10px; background: #fff; border-radius: 18px; box-shadow: inset 0 0 0 1px var(--line);
}
.rows img { width: 88px; height: 88px; object-fit: cover; border-radius: 14px; background: var(--primary-soft); }
.info { min-width: 0; }
.info b { display: block; font-size: 16px; font-weight: 500; }
.info small { color: var(--muted); font-size: 12.5px; }
.prices { display: flex; flex-wrap: wrap; gap: 6px; margin: 6px 0 2px; }
.prices span { padding: 3px 10px; border-radius: 999px; background: var(--primary-soft); color: var(--primary-deep); font-size: 13px; font-weight: 500; }
.prices span.contact { background: var(--sage-soft); color: #5d7564; }
.info p { margin: 4px 0 0; color: var(--muted); font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.row-actions { display: flex; gap: 8px; }
.row-actions .btn { padding: 8px 18px; font-size: 14px; }
.del { border: 0; padding: 8px 14px; border-radius: 999px; background: none; color: #c0392b; font-size: 14px; }
.del:hover:not(:disabled) { background: #fdecea; }

.toast {
  position: fixed; left: 50%; bottom: 24px; transform: translateX(-50%); z-index: 80;
  padding: 12px 20px; border-radius: 999px; background: #3d3335; color: #fff; font-size: 14px; box-shadow: var(--shadow-lg);
}
.toast-enter-active, .toast-leave-active { transition: all .3s var(--ease); }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translate(-50%, 10px); }

@media (max-width: 860px) {
  .abar { padding: 10px 14px; }
  .brand small { display: none; }
  .who { display: none; }
  .workspace { grid-template-columns: 1fr; padding: 14px; }
  .side { position: static; }
  .side > ul { display: flex; flex-wrap: wrap; gap: 4px; }
  .side > ul > li { flex: 1 1 auto; }
  .actions { width: 100%; }
  .actions input[type='search'] { flex: 1; width: auto; }
  .rows li { grid-template-columns: 72px 1fr; }
  .rows img { width: 72px; height: 72px; }
  .row-actions { grid-column: 1 / -1; justify-content: flex-end; }
}
</style>
