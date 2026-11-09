<script setup>
import { computed, ref } from 'vue'
import {
  ALL, PRICE_RANGES, categories, categoryLink, countBy, error, loadCatalog, loading, queryFlowers, slugify,
} from '../composables/useFlowers'
import { go, route } from '../router'
import { shop } from '../shop'
import FlowerCard from './FlowerCard.vue'
import PriceTable from './PriceTable.vue'

const emit = defineEmits(['open'])

const range = ref('')
const sort = ref('newest')
const view = ref('grid')

const current = computed(() => {
  const cat = categories.value.find((c) => slugify(c.name) === route.value.cat) || null
  const sub = cat?.children.find((s) => slugify(s) === route.value.sub) || null
  return { cat, sub }
})
const notFound = computed(() => !loading.value && route.value.cat && !current.value.cat)
const q = computed(() => route.value.q)

const list = computed(() =>
  queryFlowers({
    category: current.value.cat?.name,
    sub: current.value.sub,
    q: q.value,
    range: range.value,
    sort: sort.value,
  }),
)

const title = computed(() => {
  if (current.value.sub) return current.value.sub
  if (current.value.cat) return current.value.cat.name
  return q.value ? `Kết quả cho “${q.value}”` : 'Tất cả mẫu hoa'
})

const crumbs = computed(() => {
  const c = [{ label: 'Trang chủ', href: '#/' }]
  const { cat, sub } = current.value
  if (cat) c.push({ label: cat.name, href: categoryLink(cat.name) })
  if (sub) c.push({ label: sub, href: categoryLink(cat.name, sub) })
  if (!cat) c.push({ label: q.value ? 'Tìm kiếm' : 'Tất cả mẫu hoa', href: '#/san-pham' })
  return c
})

const subCount = (cat, s) => countBy.value[`${cat}/${s}`] || 0
const clearSearch = () => go(current.value.cat ? categoryLink(current.value.cat.name).slice(1) : '/san-pham')
const openFlower = (f) => emit('open', f, list.value)
</script>

<template>
  <div class="page container">
    <nav class="crumbs" aria-label="Đường dẫn">
      <template v-for="(c, i) in crumbs" :key="c.href">
        <a v-if="i < crumbs.length - 1" :href="c.href">{{ c.label }}</a>
        <span v-else aria-current="page">{{ c.label }}</span>
        <i v-if="i < crumbs.length - 1" aria-hidden="true">›</i>
      </template>
    </nav>
    <h1>{{ title }}</h1>

    <div class="layout">
      <!-- Cột trái -->
      <aside class="sidebar">
        <section class="box">
          <h4>Danh mục</h4>
          <ul class="tree">
            <li>
              <a href="#/san-pham" :class="{ active: !current.cat && !q }">Tất cả mẫu hoa <span>{{ countBy[ALL] || 0 }}</span></a>
            </li>
            <li v-for="c in categories" :key="c.name">
              <a :href="categoryLink(c.name)" :class="{ active: current.cat?.name === c.name && !current.sub }">
                {{ c.name }} <span>{{ countBy[c.name] || 0 }}</span>
              </a>
              <ul v-if="c.children.length" class="subtree">
                <li v-for="s in c.children" :key="s">
                  <a :href="categoryLink(c.name, s)" :class="{ active: current.cat?.name === c.name && current.sub === s }">
                    {{ s }} <span>{{ subCount(c.name, s) }}</span>
                  </a>
                </li>
              </ul>
            </li>
          </ul>
        </section>

        <section class="box">
          <h4>Khoảng giá</h4>
          <label class="radio">
            <input v-model="range" type="radio" value="" name="range" />
            <span>Tất cả mức giá</span>
          </label>
          <label v-for="r in PRICE_RANGES" :key="r.id" class="radio">
            <input v-model="range" type="radio" :value="r.id" name="range" />
            <span>{{ r.label }}</span>
          </label>
        </section>

        <section class="box help">
          <b>Cần tư vấn mẫu hoa?</b>
          <p>Zacflower luôn mở cửa, hỗ trợ tiếng Việt &amp; English.</p>
          <a v-if="shop.phone" :href="`tel:${shop.tel}`" class="btn">☎ {{ shop.phone }}</a>
        </section>
      </aside>

      <!-- Nội dung -->
      <div class="content">
        <!-- Bộ lọc trên điện thoại -->
        <div class="m-filters">
          <div class="m-chips">
            <a href="#/san-pham" :class="{ on: !current.cat }">Tất cả</a>
            <a v-for="c in categories" :key="c.name" :href="categoryLink(c.name)" :class="{ on: current.cat?.name === c.name }">{{ c.name }}</a>
          </div>
          <div v-if="current.cat?.children.length" class="m-chips sub">
            <a :href="categoryLink(current.cat.name)" :class="{ on: !current.sub }">Tất cả</a>
            <a v-for="s in current.cat.children" :key="s" :href="categoryLink(current.cat.name, s)" :class="{ on: current.sub === s }">{{ s }}</a>
          </div>
          <select v-model="range" aria-label="Khoảng giá">
            <option value="">Mọi mức giá</option>
            <option v-for="r in PRICE_RANGES" :key="r.id" :value="r.id">{{ r.label }}</option>
          </select>
        </div>

        <div class="bar">
          <p class="count">
            <b>{{ list.length }}</b> mẫu hoa
            <button v-if="q" class="clear" @click="clearSearch">“{{ q }}” ✕</button>
          </p>
          <div class="tools">
            <div class="views" role="radiogroup" aria-label="Kiểu hiển thị">
              <button role="radio" :aria-checked="view === 'grid'" :class="{ on: view === 'grid' }" @click="view = 'grid'">
                <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><rect x="4" y="4" width="7" height="7" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><rect x="13" y="4" width="7" height="7" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><rect x="4" y="13" width="7" height="7" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><rect x="13" y="13" width="7" height="7" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>
                <span>Lưới</span>
              </button>
              <button role="radio" :aria-checked="view === 'table'" :class="{ on: view === 'table' }" @click="view = 'table'">
                <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M5 6h14M5 12h14M5 18h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
                <span>Bảng giá</span>
              </button>
            </div>
            <label class="sort">
              <span>Sắp xếp:</span>
              <select v-model="sort">
                <option value="newest">Mới nhất</option>
                <option value="price-asc">Giá tăng dần</option>
                <option value="price-desc">Giá giảm dần</option>
                <option value="name">Tên A–Z</option>
              </select>
            </label>
          </div>
        </div>

        <div v-if="loading" class="grid">
          <div v-for="n in 8" :key="n" class="sk"><div /><span /><span /></div>
        </div>
        <div v-else-if="error" class="state">
          <p>⚠️ {{ error }}</p>
          <button class="btn" @click="loadCatalog(true)">Thử lại</button>
        </div>
        <div v-else-if="notFound" class="state">
          <p>Không tìm thấy danh mục này.</p>
          <a href="#/san-pham" class="btn soft">Xem tất cả mẫu hoa</a>
        </div>
        <div v-else-if="!list.length" class="state">
          <p v-if="q || range">Không có mẫu hoa phù hợp với bộ lọc.</p>
          <p v-else>Danh mục này đang cập nhật mẫu mới.<br />Gọi <a :href="`tel:${shop.tel}`">{{ shop.phone }}</a> để Zacflower tư vấn mẫu phù hợp nhé!</p>
          <button v-if="range" class="btn soft" @click="range = ''">Bỏ lọc giá</button>
        </div>
        <PriceTable v-else-if="view === 'table'" :flowers="list" @open="openFlower" />
        <div v-else class="grid">
          <FlowerCard v-for="f in list" :key="f.id" :flower="f" @open="openFlower(f)" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page { padding: 22px 0 64px; }
.crumbs { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; font-size: 13.5px; color: var(--muted); }
.crumbs a { color: var(--text); text-decoration: none; }
.crumbs a:hover { color: var(--primary-deep); }
.crumbs i { font-style: normal; opacity: .6; }
.crumbs span { color: var(--primary-deep); }
h1 { font-family: var(--serif); font-weight: 400; font-size: clamp(28px, 3.6vw, 40px); margin: 10px 0 26px; letter-spacing: -.01em; }

.layout { display: grid; grid-template-columns: 260px 1fr; gap: 32px; align-items: start; }

.sidebar { display: grid; gap: 18px; position: sticky; top: 150px; max-height: calc(100vh - 170px); overflow-y: auto; scrollbar-width: thin; }
.box { padding: 18px; border-radius: 20px; background: #fff; box-shadow: inset 0 0 0 1px var(--line); }
.box h4 {
  margin: 0 0 12px; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: .06em;
  padding-bottom: 10px; border-bottom: 2px solid var(--primary-soft);
}
.tree, .subtree { list-style: none; margin: 0; padding: 0; }
.tree a {
  display: flex; justify-content: space-between; gap: 8px; padding: 7px 10px; margin: 0 -10px; border-radius: 10px;
  text-decoration: none; color: var(--text); font-size: 14.5px; transition: all .2s;
}
.tree a span { color: var(--muted); font-size: 12.5px; }
.tree a:hover { color: var(--primary-deep); background: #fdf6f5; }
.tree a.active { color: var(--primary-deep); background: var(--primary-soft); font-weight: 500; }
.subtree { margin: 2px 0 6px 6px; padding-left: 10px; border-left: 2px solid var(--primary-soft); }
.subtree a { font-size: 14px; color: #6d5f62; padding: 5px 10px; }

.radio { display: flex; align-items: center; gap: 10px; padding: 6px 0; font-size: 14px; cursor: pointer; }
.radio input { appearance: none; width: 18px; height: 18px; border-radius: 50%; margin: 0; box-shadow: inset 0 0 0 1.5px #d9c6ca; transition: box-shadow .2s; cursor: pointer; }
.radio input:checked { box-shadow: inset 0 0 0 5px var(--primary); }
.radio input:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }

.help { background: linear-gradient(150deg, #fbe4e7, #fdf0e8); box-shadow: none; }
.help b { font-family: var(--serif); font-weight: 500; font-size: 18px; }
.help p { margin: 4px 0 14px; color: #7d6d71; font-size: 13.5px; }
.help .btn { width: 100%; padding: 10px; }

.m-filters { display: none; }

.bar {
  display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;
  padding: 10px 10px 10px 18px; margin-bottom: 22px; border-radius: 16px; background: #faf6f5;
}
.count { margin: 0; color: var(--muted); font-size: 14px; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.count b { color: var(--text); }
.clear { border: 0; padding: 4px 10px; border-radius: 999px; background: var(--primary-soft); color: var(--primary-deep); font-size: 13px; }
.tools { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.views { display: flex; padding: 3px; gap: 2px; border-radius: 999px; background: #fff; box-shadow: inset 0 0 0 1px var(--line); }
.views button {
  display: inline-flex; align-items: center; gap: 6px; height: 34px; padding: 0 13px;
  border: 0; border-radius: 999px; background: transparent; color: var(--muted); font-size: 13.5px; transition: all .25s;
}
.views button.on { background: var(--primary-soft); color: var(--primary-deep); font-weight: 500; }
.sort { display: flex; align-items: center; gap: 8px; font-size: 14px; color: var(--muted); }
.sort select, .m-filters select {
  height: 40px; padding: 0 12px; border: 0; border-radius: 12px; background: #fff;
  box-shadow: inset 0 0 0 1px var(--line); font: inherit; font-size: 14px; color: var(--text); cursor: pointer;
}

.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 24px; }
.sk div, .sk span {
  display: block; border-radius: 16px; background: linear-gradient(90deg, #f8eced 25%, #fdf6f6 50%, #f8eced 75%);
  background-size: 200% 100%; animation: shimmer 1.4s infinite;
}
.sk div { aspect-ratio: 1; }
.sk span { height: 14px; margin-top: 12px; width: 80%; border-radius: 8px; }
.sk span + span { width: 45%; }
@keyframes shimmer { to { background-position: -200% 0; } }

.state { text-align: center; padding: 56px 16px; color: var(--muted); background: #faf6f5; border-radius: 20px; }
.state a:not(.btn) { color: var(--primary-deep); font-weight: 500; }

@media (max-width: 900px) {
  .layout { grid-template-columns: 1fr; }
  .sidebar { display: none; }
  .m-filters { display: grid; gap: 10px; margin-bottom: 14px; }
  .m-chips { display: flex; gap: 6px; overflow-x: auto; scrollbar-width: none; margin: 0 -16px; padding: 0 16px; }
  .m-chips::-webkit-scrollbar { display: none; }
  .m-chips a {
    flex: none; padding: 8px 14px; border-radius: 999px; font-size: 13.5px; text-decoration: none; white-space: nowrap;
    color: var(--text); box-shadow: inset 0 0 0 1px var(--line); background: #fff;
  }
  .m-chips a.on { background: var(--primary-deep); color: #fff; box-shadow: none; }
  .m-chips.sub a { padding: 6px 12px; font-size: 13px; }
  .m-chips.sub a.on { background: var(--primary-soft); color: var(--primary-deep); }
  h1 { margin-bottom: 16px; }
}
@media (max-width: 600px) {
  .grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
  .bar { padding: 8px 8px 8px 14px; }
  .sort span, .views span { display: none; }
}
</style>
