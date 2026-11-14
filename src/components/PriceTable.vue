<script setup>
import { computed } from 'vue'
import { formatPrice } from '../composables/useFlowers'
import { t, trCat, trDesc, trName, trVariant } from '../i18n'

const props = defineProps({ flowers: { type: Array, required: true } })
defineEmits(['open'])

/** Gom nhóm theo "Danh mục › Danh mục con", giữ thứ tự xuất hiện */
const groups = computed(() => {
  const map = new Map()
  for (const f of props.flowers) {
    const key = f.subcategory ? `${trCat(f.category)} › ${trCat(f.subcategory)}` : trCat(f.category)
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(f)
  }
  return [...map].map(([title, items]) => ({ title, items }))
})
</script>

<template>
  <div class="price-table">
    <section v-for="g in groups" :key="g.title" class="group">
      <h3>{{ g.title }} <span>{{ t('nDesigns', { n: g.items.length }) }}</span></h3>
      <ul>
        <li v-for="f in g.items" :key="f.id" tabindex="0" @click="$emit('open', f)" @keydown.enter="$emit('open', f)">
          <img :src="f.thumb" :alt="trName(f)" loading="lazy" referrerpolicy="no-referrer" />
          <div class="name">
            <b>{{ trName(f) }}</b>
            <small v-if="trDesc(f)">{{ trDesc(f).split('\n')[0] }}</small>
          </div>
          <div class="prices">
            <template v-if="f.prices?.length">
              <span v-for="v in f.prices" :key="v.label + v.price" class="p">
                <em v-if="v.label">{{ trVariant(v.label) }}</em>{{ formatPrice(v.price) }}
              </span>
            </template>
            <span v-else class="p contact">{{ t('onRequest') }}</span>
          </div>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.price-table { display: grid; gap: 28px; }
.group {
  padding: 8px; border-radius: var(--radius-lg);
  background: var(--surface); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
  box-shadow: inset 0 0 0 1px rgba(255,255,255,.9), var(--shadow-sm);
}
h3 {
  margin: 0; padding: 14px 16px 10px; font-family: var(--serif); font-weight: 400; font-size: 21px;
  display: flex; align-items: baseline; gap: 10px;
}
h3 span { font-family: var(--font); font-size: 13px; color: var(--muted); }
ul { list-style: none; margin: 0; padding: 0; }
li {
  display: grid; grid-template-columns: 64px 1fr auto; gap: 16px; align-items: center;
  padding: 10px 14px 10px 10px; border-radius: 20px; cursor: pointer; outline: none;
  transition: background .3s var(--ease);
}
li + li { border-top: 1px solid var(--line); }
li:hover, li:focus-visible { background: rgba(255,255,255,.9); border-top-color: transparent; }
li:focus-visible { box-shadow: 0 0 0 2px var(--primary); }
img { width: 64px; height: 64px; object-fit: cover; border-radius: 16px; background: var(--primary-soft); }
.name { min-width: 0; }
.name b { display: block; font-weight: 500; font-size: 15.5px; }
.name small {
  display: block; color: var(--muted); font-size: 13px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.prices { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 6px; max-width: 420px; }
.p {
  display: inline-flex; align-items: baseline; gap: 6px; white-space: nowrap;
  padding: 6px 12px; border-radius: 999px; background: var(--primary-soft);
  color: var(--primary-deep); font-weight: 500; font-size: 14px;
}
.p em { font-style: normal; font-weight: 400; color: var(--muted); font-size: 12.5px; }
.p.contact { background: var(--sage-soft); color: #5d7564; }

@media (max-width: 640px) {
  li { grid-template-columns: 56px 1fr; gap: 12px; }
  img { width: 56px; height: 56px; }
  .prices { grid-column: 2; justify-content: flex-start; }
  .p { font-size: 13px; padding: 5px 10px; }
}
</style>
