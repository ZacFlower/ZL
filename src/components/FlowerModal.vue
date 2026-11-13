<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { categoryLabel, formatPrice } from '../composables/useFlowers'
import OrderForm from './OrderForm.vue'

const props = defineProps({
  flower: { type: Object, required: true },
  list: { type: Array, default: () => [] },
  shop: { type: Object, required: true },
})
const emit = defineEmits(['close', 'navigate'])

const index = computed(() => props.list.findIndex((f) => f.id === props.flower.id))
function go(step) {
  if (!props.list.length) return
  const i = (index.value + step + props.list.length) % props.list.length
  emit('navigate', props.list[i])
}

const zaloLink = computed(() => (props.shop.zalo ? `https://zalo.me/${props.shop.zalo}` : ''))
const ordering = ref(false)

function onKey(e) {
  if (ordering.value) {
    if (e.key === 'Escape') ordering.value = false
    return
  }
  if (e.key === 'Escape') emit('close')
  else if (e.key === 'ArrowRight') go(1)
  else if (e.key === 'ArrowLeft') go(-1)
}
onMounted(() => {
  document.addEventListener('keydown', onKey)
  document.body.style.overflow = 'hidden'
})
onUnmounted(() => {
  document.removeEventListener('keydown', onKey)
  document.body.style.overflow = ''
})
</script>

<template>
  <div class="overlay" @click.self="emit('close')">
    <div class="modal" role="dialog" aria-modal="true" :aria-label="flower.name">
      <button class="close" aria-label="Đóng" @click="emit('close')">
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
      </button>

      <div class="media">
        <Transition name="swap" mode="out-in">
          <img :key="flower.id" :src="flower.image" :alt="flower.name" referrerpolicy="no-referrer" />
        </Transition>
        <div v-if="list.length > 1" class="pager">
          <button aria-label="Mẫu trước" @click="go(-1)">
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="m15 6-6 6 6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
          <span>{{ index + 1 }} / {{ list.length }}</span>
          <button aria-label="Mẫu sau" @click="go(1)">
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="m9 6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
        </div>
      </div>

      <div class="detail">
        <span class="cat">{{ categoryLabel(flower) }}</span>
        <h2>{{ flower.name }}</h2>
        <ul v-if="flower.prices?.length > 1" class="variants" aria-label="Bảng giá">
          <li v-for="v in flower.prices" :key="v.label + v.price">
            <span>{{ v.label || 'Tiêu chuẩn' }}</span>
            <i aria-hidden="true" />
            <b>{{ formatPrice(v.price) }}</b>
          </li>
        </ul>
        <p v-else class="price">{{ formatPrice(flower.price) }}</p>
        <p v-if="flower.description" class="desc">{{ flower.description }}</p>

        <ul class="perks">
          <li><span>💐</span>Hoa tươi tuyển chọn 100%, thiết kế độc quyền</li>
          <li><span>🚀</span>Giao hỏa tốc tận nơi tại Đà Nẵng</li>
          <li><span>💬</span>Tư vấn đa ngôn ngữ, nhiệt tình</li>
        </ul>

        <div class="actions">
          <button class="btn" @click="ordering = true">🌸 Đặt hoa ngay</button>
          <a v-if="shop.phone" :href="`tel:${shop.tel}`" class="btn ghost">Gọi</a>
          <a v-if="zaloLink" :href="zaloLink" target="_blank" rel="noopener" class="btn ghost">Zalo</a>
          <a v-if="shop.whatsapp" :href="`https://wa.me/${shop.whatsapp}`" target="_blank" rel="noopener" class="btn ghost">WhatsApp</a>
        </div>
        <p class="hint">Mã mẫu <code>{{ flower.id.slice(0, 10) }}</code> · gửi kèm khi đặt hoa nhé</p>
      </div>
    </div>

    <OrderForm v-if="ordering" :flower="flower" @close="ordering = false" />
  </div>
</template>

<style scoped>
.overlay {
  position: fixed; inset: 0; z-index: 50; padding: 24px;
  display: grid; place-items: center;
  background: rgba(90, 60, 68, .28); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
}
.modal {
  position: relative; width: min(1000px, 100%); max-height: calc(100vh - 48px);
  display: grid; grid-template-columns: 1.1fr 1fr; gap: 8px; padding: 12px;
  background: rgba(255,255,255,.94); border-radius: var(--radius-lg); box-shadow: var(--shadow-lg);
  animation: pop .5s var(--ease);
}
@keyframes pop { from { transform: translateY(20px) scale(.97); } }

.media { position: relative; border-radius: var(--radius); overflow: hidden; background: linear-gradient(160deg, #fbe7ea, #fdf1ea); min-height: 340px; }
.media img { width: 100%; height: 100%; object-fit: cover; max-height: calc(100vh - 72px); }
.swap-enter-active, .swap-leave-active { transition: opacity .3s var(--ease); }
.swap-enter-from, .swap-leave-to { opacity: 0; }

.pager {
  position: absolute; left: 50%; bottom: 16px; transform: translateX(-50%);
  display: flex; align-items: center; gap: 4px; padding: 4px;
  background: rgba(255,255,255,.85); backdrop-filter: blur(10px); border-radius: 999px; box-shadow: var(--shadow-sm);
}
.pager span { font-size: 13px; color: var(--muted); padding: 0 8px; min-width: 56px; text-align: center; }
.pager button, .close {
  width: 38px; height: 38px; border-radius: 50%; border: 0; display: grid; place-items: center;
  background: transparent; color: var(--text); transition: background .3s var(--ease);
}
.pager button:hover { background: var(--primary-soft); color: var(--primary-deep); }
.close { position: absolute; top: 20px; right: 20px; z-index: 2; background: var(--primary-soft); color: var(--primary-deep); }
.close:hover { background: #f6dade; }

.detail { padding: 36px 28px 24px; overflow-y: auto; }
.cat {
  display: inline-block; padding: 4px 12px; border-radius: 999px;
  background: var(--sage-soft); color: #5d7564; font-size: 12.5px; font-weight: 500;
}
h2 { font-family: var(--serif); font-weight: 400; font-size: 34px; line-height: 1.15; letter-spacing: -.01em; margin: 14px 0 10px; }
.price { font-size: 22px; font-weight: 500; color: var(--primary-deep); margin: 0 0 18px; }
.variants { list-style: none; margin: 0 0 20px; padding: 6px; display: grid; gap: 2px; border-radius: 18px; box-shadow: inset 0 0 0 1px var(--line); }
.variants li { display: flex; align-items: baseline; gap: 10px; padding: 9px 12px; border-radius: 12px; }
.variants li:nth-child(odd) { background: #fdf6f3; }
.variants span { font-size: 14.5px; }
.variants i { flex: 1; border-bottom: 1.5px dotted rgba(212, 132, 143, .35); transform: translateY(-4px); }
.variants b { font-weight: 500; color: var(--primary-deep); white-space: nowrap; }
.desc { white-space: pre-line; color: #6d5f62; font-weight: 300; margin: 0 0 22px; }

.perks { list-style: none; margin: 0 0 26px; padding: 16px 18px; border-radius: 20px; background: #fdf6f3; display: grid; gap: 10px; font-size: 14px; }
.perks li { display: flex; align-items: center; gap: 12px; }
.perks span { width: 30px; height: 30px; display: grid; place-items: center; border-radius: 10px; background: #fff; font-size: 15px; }

.actions { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 18px; }
.actions .btn { flex: 1; min-width: 110px; padding-inline: 16px; }
.actions .btn:first-child { flex-basis: 100%; }
.hint { font-size: 13px; color: var(--muted); margin: 0; }
.hint code { background: var(--primary-soft); color: var(--primary-deep); padding: 2px 8px; border-radius: 6px; }

@media (max-width: 760px) {
  .overlay { padding: 0; align-items: end; }
  .modal {
    grid-template-columns: 1fr; max-height: 94vh; overflow-y: auto;
    border-radius: 28px 28px 0 0; padding: 8px; animation-name: sheet;
  }
  @keyframes sheet { from { transform: translateY(40px); } }
  .media { min-height: 0; aspect-ratio: 1; border-radius: 22px; }
  .media img { max-height: none; }
  .close { top: 16px; right: 16px; background: rgba(255,255,255,.9); }
  .detail { padding: 18px 12px 24px; }
  h2 { font-size: 26px; }
}
</style>
