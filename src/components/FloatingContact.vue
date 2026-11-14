<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { shop } from '../shop'
import { t } from '../i18n'

const showTop = ref(false)
const onScroll = () => (showTop.value = window.scrollY > 600)
onMounted(() => window.addEventListener('scroll', onScroll, { passive: true }))
onUnmounted(() => window.removeEventListener('scroll', onScroll))
const toTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })
</script>

<template>
  <div class="float" :aria-label="t('quickContact')">
    <a v-if="shop.zalo" :href="`https://zalo.me/${shop.zalo}`" target="_blank" rel="noopener" class="fab zalo" :title="t('chatZalo')">
      <span>Zalo</span>
    </a>
    <a v-if="shop.whatsapp" :href="`https://wa.me/${shop.whatsapp}`" target="_blank" rel="noopener" class="fab wa" title="WhatsApp">
      <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.2-.2-.4-.3z"/></svg>
    </a>
    <a v-if="shop.facebook" :href="shop.facebook" target="_blank" rel="noopener" class="fab fb" title="Facebook">
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M14 8h3V4h-3a4 4 0 0 0-4 4v2H8v4h2v8h4v-8h3l1-4h-4V8z"/></svg>
    </a>
    <a v-if="shop.phone" :href="`tel:${shop.tel}`" class="fab call" :title="t('callNow')">
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M6.6 10.8a15 15 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1z"/></svg>
    </a>
    <Transition name="fade">
      <button v-if="showTop" class="fab top" :aria-label="t('toTop')" @click="toTop">
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="m6 15 6-6 6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
    </Transition>
  </div>
</template>

<style scoped>
.float { position: fixed; right: 18px; bottom: 22px; z-index: 40; display: grid; gap: 12px; }
.fab {
  width: 50px; height: 50px; border-radius: 50%; border: 0; display: grid; place-items: center;
  color: #fff; text-decoration: none; box-shadow: 0 8px 20px -6px rgba(0,0,0,.35);
  transition: transform .3s var(--ease);
}
.fab:hover { transform: scale(1.08); }
.zalo { background: #0068ff; }
.zalo span { font-weight: 700; font-size: 13px; letter-spacing: -.02em; }
.wa { background: #25d366; }
.fb { background: #1877f2; }
.call { background: var(--primary-deep); position: relative; }
.call::before, .call::after {
  content: ''; position: absolute; inset: 0; border-radius: 50%; border: 2px solid var(--primary);
  animation: pulse 2s ease-out infinite;
}
.call::after { animation-delay: 1s; }
@keyframes pulse { from { transform: scale(1); opacity: .7; } to { transform: scale(1.7); opacity: 0; } }
.top { background: #fff; color: var(--text); box-shadow: var(--shadow), inset 0 0 0 1px var(--line); }
.fade-enter-active, .fade-leave-active { transition: opacity .3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
@media (max-width: 600px) {
  .float { right: 12px; bottom: 14px; gap: 10px; }
  .fab { width: 46px; height: 46px; }
}
</style>
