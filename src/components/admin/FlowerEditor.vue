<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { parseMoney } from '../../services/drive'
import { formatPrice } from '../../composables/useFlowers'

const props = defineProps({
  item: { type: Object, default: null }, // null = thêm mới
  folders: { type: Array, required: true },
  defaultFolderId: { type: String, default: '' },
  busy: { type: Boolean, default: false },
  error: { type: String, default: '' },
})
const emit = defineEmits(['save', 'close'])

const isNew = !props.item
const name = ref(props.item?.name || '')
const folderId = ref(props.item?.folderId || props.defaultFolderId || props.folders[0]?.id || '')
const description = ref(props.item?.description || '')
const rows = ref(
  props.item?.prices?.length
    ? props.item.prices.map((p) => ({ label: p.label, raw: String(p.price) }))
    : [{ label: '', raw: '' }],
)
const file = ref(null)
const preview = ref(props.item?.thumb || '')
const dragging = ref(false)
const localError = ref('')

const folderLabel = (f) => {
  if (f.depth === 1) return f.label
  const parent = props.folders.find((p) => p.id === f.parentId)
  return `${parent?.label || ''} › ${f.label}`
}

function pick(f) {
  if (!f) return
  if (!f.type.startsWith('image/')) {
    localError.value = 'Vui lòng chọn file ảnh (jpg, png, webp…).'
    return
  }
  localError.value = ''
  file.value = f
  if (preview.value.startsWith('blob:')) URL.revokeObjectURL(preview.value)
  preview.value = URL.createObjectURL(f)
  if (!name.value.trim()) name.value = f.name.replace(/\.[^.]+$/, '')
}
const onInput = (e) => pick(e.target.files?.[0])
const onDrop = (e) => {
  dragging.value = false
  pick(e.dataTransfer?.files?.[0])
}

const parsed = (raw) => (raw.trim() ? parseMoney(raw) : null)
const addRow = () => rows.value.push({ label: '', raw: '' })
const removeRow = (i) => {
  rows.value.splice(i, 1)
  if (!rows.value.length) addRow()
}

const previewPrice = computed(() => {
  const prices = rows.value.map((r) => parsed(r.raw)).filter((p) => p != null)
  if (!prices.length) return 'Liên hệ'
  return (prices.length > 1 ? 'Từ ' : '') + formatPrice(Math.min(...prices))
})

function submit() {
  localError.value = ''
  if (isNew && !file.value) return (localError.value = 'Vui lòng chọn ảnh mẫu hoa.')
  if (!name.value.trim()) return (localError.value = 'Vui lòng nhập tên mẫu hoa.')
  if (!folderId.value) return (localError.value = 'Vui lòng chọn danh mục.')
  const prices = []
  for (const r of rows.value) {
    if (!r.raw.trim()) {
      if (r.label.trim()) return (localError.value = `Chưa nhập giá cho loại “${r.label.trim()}”.`)
      continue
    }
    const p = parseMoney(r.raw)
    if (p == null) return (localError.value = `Giá “${r.raw}” không hợp lệ. Ví dụ: 450000, 450k, 1tr2.`)
    prices.push({ label: r.label.trim(), price: p })
  }
  emit('save', {
    file: file.value,
    name: name.value.trim(),
    folderId: folderId.value,
    prices,
    description: description.value,
  })
}

const onKey = (e) => e.key === 'Escape' && !props.busy && emit('close')
onMounted(() => {
  document.addEventListener('keydown', onKey)
  document.body.style.overflow = 'hidden'
})
onUnmounted(() => {
  document.removeEventListener('keydown', onKey)
  document.body.style.overflow = ''
  if (preview.value.startsWith('blob:')) URL.revokeObjectURL(preview.value)
})
</script>

<template>
  <div class="overlay" @click.self="!busy && emit('close')">
    <form class="editor" @submit.prevent="submit">
      <header>
        <h2>{{ isNew ? 'Thêm mẫu hoa' : 'Sửa mẫu hoa' }}</h2>
        <button type="button" class="x" aria-label="Đóng" :disabled="busy" @click="emit('close')">✕</button>
      </header>

      <div class="body">
        <label
          class="drop"
          :class="{ dragging, has: preview }"
          @dragover.prevent="dragging = true"
          @dragleave="dragging = false"
          @drop.prevent="onDrop"
        >
          <img v-if="preview" :src="preview" alt="" referrerpolicy="no-referrer" />
          <span v-else class="drop-hint">
            <b>Chọn ảnh</b> hoặc kéo thả vào đây
            <small>JPG, PNG, WEBP</small>
          </span>
          <span v-if="preview" class="change">{{ isNew ? 'Đổi ảnh' : 'Thay ảnh mới' }}</span>
          <input type="file" accept="image/*" @change="onInput" />
        </label>

        <div class="fields">
          <label class="field">
            <span>Tên mẫu hoa *</span>
            <input v-model="name" type="text" placeholder="VD: Bó hồng đỏ Classic" maxlength="120" />
          </label>

          <label class="field">
            <span>Danh mục *</span>
            <select v-model="folderId">
              <option v-for="f in folders" :key="f.id" :value="f.id">{{ folderLabel(f) }}</option>
            </select>
          </label>

          <div class="field">
            <span>Giá <small>(để trống = “Liên hệ”; nhiều loại thì thêm dòng)</small></span>
            <div v-for="(r, i) in rows" :key="i" class="price-row">
              <input v-model="r.label" type="text" placeholder="Loại (VD: 20 bông, Size M)" aria-label="Tên loại giá" />
              <input v-model="r.raw" type="text" inputmode="numeric" placeholder="Giá (VD: 450k)" aria-label="Giá" />
              <em :class="{ bad: r.raw.trim() && parsed(r.raw) == null }">
                {{ r.raw.trim() ? (parsed(r.raw) == null ? 'Không hợp lệ' : formatPrice(parsed(r.raw))) : '' }}
              </em>
              <button type="button" class="del" aria-label="Xóa dòng giá" @click="removeRow(i)">✕</button>
            </div>
            <button type="button" class="add" @click="addRow">+ Thêm loại giá</button>
          </div>

          <label class="field">
            <span>Mô tả</span>
            <textarea v-model="description" rows="3" placeholder="VD: Hồng Ecuador, giấy gói Hàn Quốc tông đen…" />
          </label>

          <p class="show">Hiển thị trên web: <b>{{ previewPrice }}</b></p>
        </div>
      </div>

      <footer>
        <p v-if="localError || error" class="err">{{ localError || error }}</p>
        <button type="button" class="btn ghost" :disabled="busy" @click="emit('close')">Hủy</button>
        <button type="submit" class="btn" :disabled="busy">{{ busy ? 'Đang lưu…' : 'Lưu lên Drive' }}</button>
      </footer>
    </form>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed; inset: 0; z-index: 70; display: grid; place-items: center; padding: 20px;
  background: rgba(60, 40, 45, .35); backdrop-filter: blur(6px);
}
.editor {
  width: min(880px, 100%); max-height: calc(100vh - 40px); display: flex; flex-direction: column;
  background: #fff; border-radius: 24px; box-shadow: var(--shadow-lg); overflow: hidden;
}
header { display: flex; justify-content: space-between; align-items: center; padding: 18px 22px; border-bottom: 1px solid var(--line); }
h2 { margin: 0; font-family: var(--serif); font-weight: 400; font-size: 24px; }
.x { width: 36px; height: 36px; border: 0; border-radius: 50%; background: var(--primary-soft); color: var(--primary-deep); }
.body { display: grid; grid-template-columns: 300px 1fr; gap: 24px; padding: 22px; overflow-y: auto; }

.drop {
  position: relative; aspect-ratio: 1; border-radius: 18px; overflow: hidden; cursor: pointer;
  display: grid; place-items: center; text-align: center; color: var(--muted);
  background: #fdf6f5; border: 2px dashed #ecd2d6; transition: all .2s;
}
.drop.dragging { border-color: var(--primary); background: var(--primary-soft); }
.drop.has { border-style: solid; border-color: transparent; }
.drop img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.drop input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
.drop-hint b { display: block; color: var(--primary-deep); font-size: 16px; }
.drop-hint small { display: block; margin-top: 4px; }
.change {
  position: absolute; left: 10px; right: 10px; bottom: 10px; padding: 8px; border-radius: 12px;
  background: rgba(255,255,255,.92); color: var(--primary-deep); font-weight: 500; font-size: 13.5px;
}

.fields { display: grid; gap: 16px; align-content: start; }
.field { display: grid; gap: 6px; }
.field > span { font-size: 13.5px; font-weight: 500; }
.field small { color: var(--muted); font-weight: 400; }
input[type='text'], select, textarea {
  width: 100%; padding: 10px 12px; border: 0; border-radius: 12px; font: inherit; font-size: 14.5px; color: var(--text);
  background: #fff; box-shadow: inset 0 0 0 1px #ead8db; outline: none; transition: box-shadow .2s;
}
input[type='text']:focus, select:focus, textarea:focus { box-shadow: inset 0 0 0 1.5px var(--primary), 0 0 0 3px var(--primary-soft); }
textarea { resize: vertical; }
.price-row { display: grid; grid-template-columns: 1fr 130px 110px 32px; gap: 8px; align-items: center; }
.price-row em { font-style: normal; font-size: 12.5px; color: var(--primary-deep); white-space: nowrap; }
.price-row em.bad { color: #c0392b; }
.del { width: 32px; height: 32px; border: 0; border-radius: 50%; background: #f7eeee; color: var(--muted); }
.del:hover { background: #fde2e2; color: #c0392b; }
.add { justify-self: start; border: 0; background: none; color: var(--primary-deep); font-weight: 500; padding: 4px 0; }
.show { margin: 0; padding: 10px 14px; border-radius: 12px; background: var(--sage-soft); color: #5d7564; font-size: 13.5px; }

footer { display: flex; align-items: center; justify-content: flex-end; gap: 10px; padding: 14px 22px; border-top: 1px solid var(--line); flex-wrap: wrap; }
.err { margin: 0 auto 0 0; color: #c0392b; font-size: 13.5px; flex: 1 1 260px; }
footer .btn { padding: 10px 22px; }
footer .btn:disabled { opacity: .6; cursor: default; transform: none; }

@media (max-width: 720px) {
  .overlay { padding: 0; align-items: end; }
  .editor { max-height: 96vh; border-radius: 24px 24px 0 0; }
  .body { grid-template-columns: 1fr; padding: 16px; }
  .drop { max-width: 260px; width: 100%; margin: 0 auto; }
  .price-row { grid-template-columns: 1fr 100px 32px; }
  .price-row em { order: 1; grid-column: 1 / -1; margin-top: -4px; }
}
</style>
