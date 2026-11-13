<script setup>
import { computed, reactive, ref } from 'vue'
import { categoryLabel, formatPrice } from '../composables/useFlowers'
import {
  copyText, makeOrderCode, orderEndpoint, orderText, submitOrder, whatsappLink, zaloLink,
} from '../services/order'
import { shop } from '../shop'

const props = defineProps({ flower: { type: Object, required: true } })
const emit = defineEmits(['close'])

const SAVED = 'zac-customer'
let saved = {}
try {
  saved = JSON.parse(localStorage.getItem(SAVED) || '{}')
} catch { /* ignore */ }

const today = new Date()
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

const prices = props.flower.prices || []
const form = reactive({
  variantIndex: prices.length > 1 ? 0 : -1,
  customerName: saved.customerName || '',
  customerPhone: saved.customerPhone || '',
  delivery: 'Giao tận nơi',
  date: iso(today),
  time_slot: 'Càng sớm càng tốt',
  address: '',
  recipientName: '',
  recipientPhone: '',
  cardMessage: '',
  note: '',
  website: '', // ô ẩn chống spam
})
const TIME_SLOTS = ['Càng sớm càng tốt', '08:00 – 10:00', '10:00 – 12:00', '12:00 – 14:00', '14:00 – 16:00', '16:00 – 18:00', '18:00 – 20:00', '20:00 – 22:00']

const step = ref('form') // form | done
const status = ref('') // sent | manual | failed
const sending = ref(false)
const error = ref('')
const errorField = ref('')
const order = ref(null)
const copied = ref(false)

const selectedPrice = computed(() => {
  if (form.variantIndex >= 0) return prices[form.variantIndex]
  return prices[0] || null
})

function validate() {
  error.value = ''
  errorField.value = ''
  const fail = (field, msg) => {
    errorField.value = field
    error.value = msg
    return false
  }
  if (form.customerName.trim().length < 2) return fail('customerName', 'Vui lòng nhập họ tên của bạn.')
  const phone = form.customerPhone.replace(/[^\d+]/g, '')
  if (phone.length < 9 || phone.length > 15) return fail('customerPhone', 'Số điện thoại chưa đúng.')
  if (form.delivery === 'Giao tận nơi' && !form.address.trim()) return fail('address', 'Vui lòng nhập địa chỉ giao hoa.')
  return true
}

function buildOrder() {
  const p = selectedPrice.value
  return {
    code: makeOrderCode(),
    flowerId: props.flower.id,
    flowerName: props.flower.name,
    category: categoryLabel(props.flower),
    variant: p?.label || '',
    price: p?.price ?? '',
    image: props.flower.thumb?.startsWith('http') ? props.flower.thumb : '',
    customerName: form.customerName.trim(),
    customerPhone: form.customerPhone.trim(),
    delivery: form.delivery,
    date: form.date,
    time_slot: form.time_slot,
    address: form.delivery === 'Giao tận nơi' ? form.address.trim() : '',
    recipientName: form.recipientName.trim(),
    recipientPhone: form.recipientPhone.trim(),
    cardMessage: form.cardMessage.trim(),
    note: form.note.trim(),
    website: form.website,
  }
}

async function submit() {
  if (!validate()) return
  try {
    localStorage.setItem(SAVED, JSON.stringify({ customerName: form.customerName, customerPhone: form.customerPhone }))
  } catch { /* ignore */ }

  order.value = buildOrder()
  if (!orderEndpoint) {
    status.value = 'manual'
    step.value = 'done'
    return
  }
  sending.value = true
  try {
    const res = await submitOrder(order.value)
    if (res.code) order.value.code = res.code
    status.value = 'sent'
  } catch (e) {
    error.value = e.message
    status.value = 'failed'
  } finally {
    sending.value = false
    step.value = 'done'
  }
}

const text = computed(() => (order.value ? orderText(order.value) : ''))

async function copy() {
  copied.value = await copyText(text.value)
  setTimeout(() => (copied.value = false), 2500)
}
async function openZalo() {
  await copy()
  window.open(zaloLink(), '_blank', 'noopener')
}
</script>

<template>
  <div class="overlay" @click.self="!sending && emit('close')">
    <section class="sheet" role="dialog" aria-modal="true" aria-label="Đặt hoa">
      <header>
        <img :src="flower.thumb" alt="" referrerpolicy="no-referrer" />
        <div>
          <small>{{ step === 'form' ? 'Đặt hoa' : 'Đơn hàng' }}</small>
          <b>{{ flower.name }}</b>
          <span>{{ selectedPrice ? formatPrice(selectedPrice.price) : 'Giá liên hệ' }}</span>
        </div>
        <button class="x" aria-label="Đóng" :disabled="sending" @click="emit('close')">✕</button>
      </header>

      <!-- Bước 1: điền thông tin -->
      <form v-if="step === 'form'" class="body" novalidate @submit.prevent="submit">
        <fieldset v-if="prices.length > 1" class="variants">
          <legend>Chọn loại</legend>
          <label v-for="(p, i) in prices" :key="i" :class="{ on: form.variantIndex === i }">
            <input v-model="form.variantIndex" type="radio" :value="i" name="variant" />
            <span>{{ p.label || 'Tiêu chuẩn' }}</span>
            <b>{{ formatPrice(p.price) }}</b>
          </label>
        </fieldset>

        <div class="grid2">
          <label class="field" :class="{ bad: errorField === 'customerName' }">
            <span>Họ tên của bạn *</span>
            <input v-model="form.customerName" type="text" autocomplete="name" placeholder="Nguyễn Văn A" />
          </label>
          <label class="field" :class="{ bad: errorField === 'customerPhone' }">
            <span>Số điện thoại / Zalo *</span>
            <input v-model="form.customerPhone" type="tel" autocomplete="tel" inputmode="tel" placeholder="09xx xxx xxx" />
          </label>
        </div>

        <div class="seg" role="radiogroup" aria-label="Hình thức nhận hoa">
          <label :class="{ on: form.delivery === 'Giao tận nơi' }"><input v-model="form.delivery" type="radio" value="Giao tận nơi" />🚀 Giao tận nơi</label>
          <label :class="{ on: form.delivery === 'Nhận tại shop' }"><input v-model="form.delivery" type="radio" value="Nhận tại shop" />🏠 Nhận tại shop</label>
        </div>

        <div class="grid2">
          <label class="field">
            <span>Ngày nhận hoa</span>
            <input v-model="form.date" type="date" :min="iso(today)" />
          </label>
          <label class="field">
            <span>Khung giờ</span>
            <select v-model="form.time_slot">
              <option v-for="t in TIME_SLOTS" :key="t" :value="t">{{ t }}</option>
            </select>
          </label>
        </div>

        <template v-if="form.delivery === 'Giao tận nơi'">
          <label class="field" :class="{ bad: errorField === 'address' }">
            <span>Địa chỉ giao hoa *</span>
            <input v-model="form.address" type="text" autocomplete="street-address" placeholder="Số nhà, đường, phường… (khách sạn / resort ghi kèm số phòng)" />
          </label>
          <div class="grid2">
            <label class="field">
              <span>Tên người nhận</span>
              <input v-model="form.recipientName" type="text" placeholder="Nếu tặng người khác" />
            </label>
            <label class="field">
              <span>SĐT người nhận</span>
              <input v-model="form.recipientPhone" type="tel" inputmode="tel" placeholder="Để shipper liên hệ" />
            </label>
          </div>
        </template>
        <p v-else class="pickup">📍 Nhận tại: {{ shop.address }}</p>

        <label class="field">
          <span>Lời nhắn trên thiệp</span>
          <textarea v-model="form.cardMessage" rows="2" maxlength="300" placeholder="VD: Chúc mừng sinh nhật em yêu ❤️" />
        </label>
        <label class="field">
          <span>Ghi chú thêm</span>
          <textarea v-model="form.note" rows="2" maxlength="500" placeholder="Màu giấy gói, thay đổi hoa, xuất hóa đơn…" />
        </label>

        <!-- ô ẩn chống spam -->
        <input v-model="form.website" class="hp" type="text" tabindex="-1" autocomplete="off" aria-hidden="true" />

        <p v-if="error" class="err" role="alert">{{ error }}</p>
        <button type="submit" class="btn submit" :disabled="sending">
          {{ sending ? 'Đang gửi đơn…' : orderEndpoint ? 'Gửi đơn đặt hoa' : 'Tiếp tục đặt qua Zalo / WhatsApp' }}
        </button>
        <p class="small">Zacflower sẽ gọi / nhắn Zalo xác nhận đơn và phí giao trước khi cắm hoa.</p>
      </form>

      <!-- Bước 2: kết quả -->
      <div v-else class="body done">
        <div v-if="status === 'sent'" class="result ok">
          <div class="icon">✓</div>
          <h3>Đã gửi đơn {{ order.code }}</h3>
          <p>Cảm ơn bạn! Zacflower sẽ liên hệ <b>{{ order.customerPhone }}</b> để xác nhận trong ít phút.
            Muốn được phản hồi nhanh hơn, gửi luôn đơn qua Zalo hoặc WhatsApp nhé.</p>
        </div>
        <div v-else-if="status === 'failed'" class="result warn">
          <div class="icon">!</div>
          <h3>Chưa gửi được đơn tự động</h3>
          <p>{{ error }} Bạn gửi đơn qua Zalo hoặc WhatsApp bên dưới để shop nhận ngay nhé.</p>
        </div>
        <div v-else class="result">
          <div class="icon">💬</div>
          <h3>Gửi đơn cho Zacflower</h3>
          <p>Chọn Zalo hoặc WhatsApp để gửi đơn. Nội dung đơn đã được soạn sẵn bên dưới.</p>
        </div>

        <div class="send">
          <button v-if="shop.zalo" class="btn zalo" @click="openZalo">
            <span class="z">Zalo</span> Mở Zalo &amp; dán đơn
          </button>
          <a v-if="shop.whatsapp" :href="whatsappLink(text)" target="_blank" rel="noopener" class="btn wa">
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm4.5 12.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.2-.2-.4-.3z"/></svg>
            Gửi qua WhatsApp
          </a>
        </div>
        <p v-if="shop.zalo" class="small">Zalo không cho điền sẵn tin nhắn: đơn được <b>tự sao chép</b>, bạn chỉ cần <b>dán</b> (giữ ô chat → Dán) rồi gửi.</p>

        <div class="summary">
          <pre>{{ text }}</pre>
          <button class="copy" @click="copy">{{ copied ? '✓ Đã sao chép' : 'Sao chép' }}</button>
        </div>

        <button class="btn ghost close-btn" @click="emit('close')">Xong</button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed; inset: 0; z-index: 60; display: grid; place-items: center; padding: 20px;
  background: rgba(60, 40, 45, .35); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
}
.sheet {
  width: min(560px, 100%); max-height: calc(100vh - 40px); display: flex; flex-direction: column;
  background: #fff; border-radius: 24px; box-shadow: var(--shadow-lg); overflow: hidden; animation: pop .4s var(--ease);
}
@keyframes pop { from { transform: translateY(16px) scale(.98); opacity: 0; } }
header { display: flex; align-items: center; gap: 14px; padding: 14px 16px; border-bottom: 1px solid var(--line); }
header img { width: 56px; height: 56px; border-radius: 14px; object-fit: cover; background: var(--primary-soft); flex: none; }
header div { flex: 1; min-width: 0; display: grid; }
header small { color: var(--muted); font-size: 12px; text-transform: uppercase; letter-spacing: .06em; }
header b { font-family: var(--serif); font-weight: 500; font-size: 19px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
header span { color: var(--primary-deep); font-weight: 600; font-size: 14.5px; }
.x { width: 36px; height: 36px; flex: none; border: 0; border-radius: 50%; background: var(--primary-soft); color: var(--primary-deep); }

.body { padding: 18px 18px 20px; overflow-y: auto; display: grid; gap: 14px; }
.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.field { display: grid; gap: 5px; }
.field > span { font-size: 13.5px; font-weight: 500; }
input[type='text'], input[type='tel'], input[type='date'], select, textarea {
  width: 100%; padding: 11px 12px; border: 0; border-radius: 12px; font: inherit; font-size: 15px; color: var(--text);
  background: #fff; box-shadow: inset 0 0 0 1px #ead8db; outline: none; transition: box-shadow .2s;
}
input:focus, select:focus, textarea:focus { box-shadow: inset 0 0 0 1.5px var(--primary), 0 0 0 3px var(--primary-soft); }
.field.bad input { box-shadow: inset 0 0 0 1.5px #d9534f, 0 0 0 3px #fdecea; }
textarea { resize: vertical; }

.variants { border: 0; margin: 0; padding: 0; display: grid; gap: 6px; }
.variants legend { font-size: 13.5px; font-weight: 500; margin-bottom: 6px; padding: 0; }
.variants label {
  display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-radius: 12px; cursor: pointer;
  box-shadow: inset 0 0 0 1px #ead8db; transition: all .2s;
}
.variants label.on { box-shadow: inset 0 0 0 1.5px var(--primary); background: var(--primary-soft); }
.variants input { accent-color: var(--primary-deep); }
.variants span { flex: 1; }
.variants b { color: var(--primary-deep); font-weight: 600; }

.seg { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; padding: 4px; border-radius: 14px; background: #faf3f2; }
.seg label { text-align: center; padding: 10px; border-radius: 10px; cursor: pointer; font-size: 14.5px; transition: all .2s; }
.seg label.on { background: #fff; color: var(--primary-deep); font-weight: 500; box-shadow: var(--shadow-sm); }
.seg input { position: absolute; opacity: 0; pointer-events: none; }
.pickup { margin: 0; padding: 10px 14px; border-radius: 12px; background: var(--sage-soft); color: #5d7564; font-size: 14px; }

.hp { position: absolute; left: -9999px; width: 1px; height: 1px; opacity: 0; }
.err { margin: 0; color: #c0392b; font-size: 14px; }
.submit { width: 100%; padding: 14px; font-size: 16px; }
.submit:disabled { opacity: .7; cursor: default; transform: none; }
.small { margin: 0; font-size: 12.5px; color: var(--muted); text-align: center; }

.result { text-align: center; }
.result .icon {
  width: 56px; height: 56px; margin: 4px auto 8px; border-radius: 50%; display: grid; place-items: center;
  font-size: 26px; font-weight: 700; background: var(--primary-soft); color: var(--primary-deep);
}
.result.ok .icon { background: #e6f4ea; color: #2e7d4f; }
.result.warn .icon { background: #fff4e0; color: #b7791f; }
.result h3 { margin: 0 0 6px; font-family: var(--serif); font-weight: 500; font-size: 22px; }
.result p { margin: 0; color: #6d5f62; font-size: 14.5px; }
.send { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.send .btn { padding: 12px; font-size: 14.5px; }
.zalo { background: #0068ff; box-shadow: 0 8px 20px -8px rgba(0, 104, 255, .6); }
.z { font-weight: 800; font-size: 12px; padding: 1px 6px; border-radius: 6px; background: #fff; color: #0068ff; }
.wa { background: #25d366; box-shadow: 0 8px 20px -8px rgba(37, 211, 102, .6); }
.summary { position: relative; border-radius: 14px; background: #fdf6f5; box-shadow: inset 0 0 0 1px var(--line); }
.summary pre { margin: 0; padding: 14px 16px; white-space: pre-wrap; font: inherit; font-size: 13.5px; line-height: 1.6; color: #5e5053; }
.copy {
  position: absolute; top: 8px; right: 8px; border: 0; padding: 5px 12px; border-radius: 999px;
  background: #fff; color: var(--primary-deep); font-size: 12.5px; font-weight: 500; box-shadow: var(--shadow-sm);
}
.close-btn { justify-self: center; padding: 10px 28px; }

@media (max-width: 560px) {
  .overlay { padding: 0; align-items: end; }
  .sheet { max-height: 96vh; border-radius: 24px 24px 0 0; }
  .grid2, .send { grid-template-columns: 1fr; }
}
</style>
