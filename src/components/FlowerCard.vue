<script setup>
import { ref } from 'vue'
import { cardPrice, categoryEmoji } from '../composables/useFlowers'
import { t, trName } from '../i18n'

defineProps({ flower: { type: Object, required: true } })
defineEmits(['open'])
const loaded = ref(false)
const failed = ref(false)
</script>

<template>
  <article class="product" tabindex="0" @click="$emit('open')" @keydown.enter="$emit('open')">
    <div class="img" :class="{ loaded }">
      <img
        v-if="!failed"
        :src="flower.thumb"
        :alt="trName(flower)"
        loading="lazy"
        referrerpolicy="no-referrer"
        @load="loaded = true"
        @error="failed = true"
      />
      <div v-else class="fallback">{{ categoryEmoji(flower.category) }}</div>
      <span v-if="flower.prices?.length > 1" class="badge">{{ t('nOptions', { n: flower.prices.length }) }}</span>
      <span class="quick">{{ t('quickView') }}</span>
    </div>
    <h3>{{ trName(flower) }}</h3>
    <p class="price" :class="{ contact: flower.price == null }">{{ cardPrice(flower) }}</p>
  </article>
</template>

<style scoped>
.product { cursor: pointer; outline: none; }
.img {
  position: relative; aspect-ratio: 1; border-radius: 18px; overflow: hidden;
  background: linear-gradient(160deg, #fbe7ea, #fdf1ea); box-shadow: inset 0 0 0 1px var(--line);
}
.img img { width: 100%; height: 100%; object-fit: cover; opacity: 0; transition: opacity .5s var(--ease), transform .9s var(--ease); }
.img.loaded img { opacity: 1; }
.product:hover .img img { transform: scale(1.06); }
.product:focus-visible .img { box-shadow: 0 0 0 3px var(--primary); }
.fallback { display: grid; place-items: center; height: 100%; font-size: 56px; }
.badge {
  position: absolute; top: 10px; left: 10px; padding: 3px 10px; border-radius: 999px;
  background: rgba(255,255,255,.92); color: var(--primary-deep); font-size: 12px; font-weight: 500;
}
.quick {
  position: absolute; left: 10px; right: 10px; bottom: 10px; padding: 9px; border-radius: 12px; text-align: center;
  background: rgba(255,255,255,.94); font-size: 13.5px; font-weight: 500; color: var(--primary-deep);
  opacity: 0; transform: translateY(8px); transition: all .35s var(--ease);
}
.product:hover .quick, .product:focus-visible .quick { opacity: 1; transform: none; }

h3 {
  margin: 12px 2px 4px; font-size: 15px; font-weight: 400; line-height: 1.45; color: var(--text);
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; min-height: 2.9em;
  transition: color .25s;
}
.product:hover h3 { color: var(--primary-deep); }
.price { margin: 0 2px; font-size: 17px; font-weight: 600; color: var(--primary-deep); }
.price.contact { color: var(--sage); font-size: 15px; }

@media (hover: none) { .quick { display: none; } }
@media (max-width: 600px) {
  .img { border-radius: 14px; }
  h3 { font-size: 14px; margin-top: 8px; }
  .price { font-size: 15px; }
}
</style>
