<script setup>
import { computed } from 'vue'
import {
  categories, categoryEmoji, categoryLink, countBy, error, flowers, isDemo, loadCatalog, loading,
} from '../composables/useFlowers'
import { scrollToId } from '../router'
import { shop } from '../shop'
import { t, trCat } from '../i18n'
import FlowerCard from './FlowerCard.vue'

const emit = defineEmits(['open'])

const bannerPics = computed(() => flowers.value.slice(0, 2))
const coverOf = (name) => flowers.value.find((f) => f.category === name)?.thumb
const sections = computed(() =>
  categories.value
    .map((c) => ({ ...c, items: flowers.value.filter((f) => f.category === c.name).slice(0, 8) }))
    .filter((s) => s.items.length),
)

const services = computed(() => [
  { icon: 'truck', title: t('sv1t'), text: t('sv1d') },
  { icon: 'phone', title: t('sv2t'), text: t('sv2d', { phone: shop.phone || '' }) },
  { icon: 'flower', title: t('sv3t'), text: t('sv3d') },
  { icon: 'chat', title: t('sv4t'), text: t('sv4d') },
])
</script>

<template>
  <!-- Banner -->
  <section class="banner">
    <div class="container banner-inner">
      <div class="copy">
        <p class="kicker">{{ t('heroKicker') }}</p>
        <h1>{{ t('heroTitle1') }}<br /><em>{{ t('heroTitle2') }}</em></h1>
        <p class="sub">{{ t('heroSub') }}</p>
        <ul class="facts">
          <li v-if="shop.address">📍 {{ shop.address }}</li>
          <li v-if="shop.phone">☎ {{ shop.phone }} {{ t('zaloWa') }}</li>
        </ul>
        <div class="cta">
          <a href="#categories" class="btn" @click.prevent="scrollToId('categories')">{{ t('browse') }}</a>
          <a v-if="shop.phone" :href="`tel:${shop.tel}`" class="btn ghost">{{ t('callOrder') }}</a>
        </div>
      </div>
      <div class="pics" aria-hidden="true">
        <div v-for="(f, i) in bannerPics" :key="f.id" class="pic" :class="`p${i}`">
          <img :src="f.thumb" alt="" referrerpolicy="no-referrer" />
        </div>
        <template v-if="!bannerPics.length">
          <div class="pic p0 empty">💐</div>
          <div class="pic p1 empty">🌷</div>
        </template>
        <div class="badge"><b>{{ t('followersN') }}</b><span>{{ t('followers') }}</span></div>
      </div>
    </div>
  </section>

  <!-- Dịch vụ -->
  <section class="services">
    <div class="container services-grid">
      <div v-for="s in services" :key="s.title" class="service">
        <span class="icon" aria-hidden="true">
          <svg v-if="s.icon === 'truck'" viewBox="0 0 24 24"><path d="M3 6h11v9H3zM14 9h4l3 3v3h-7M7 18.5a1.5 1.5 0 1 0 0-.01M17 18.5a1.5 1.5 0 1 0 0-.01" /></svg>
          <svg v-else-if="s.icon === 'phone'" viewBox="0 0 24 24"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" /></svg>
          <svg v-else-if="s.icon === 'flower'" viewBox="0 0 24 24"><path d="M12 13v8M12 21c-3 0-5-2-5-4 2 0 5 1 5 4zm0 0c3 0 5-2 5-4-2 0-5 1-5 4zM12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm0-6c0-2 1-4 3-4 0 2-1 4-3 4zm0 0c0-2-1-4-3-4 0 2 1 4 3 4z" /></svg>
          <svg v-else viewBox="0 0 24 24"><path d="M4 5h16v11H9l-5 4zM8 10h.01M12 10h.01M16 10h.01" /></svg>
        </span>
        <div><b>{{ s.title }}</b><p>{{ s.text }}</p></div>
      </div>
    </div>
  </section>

  <!-- Danh mục -->
  <section id="categories" class="container block">
    <div class="title">
      <h2>{{ t('catTitle') }}</h2>
      <p>{{ t('catSub') }}</p>
    </div>

    <div v-if="loading" class="tiles">
      <div v-for="n in 8" :key="n" class="tile skeleton" />
    </div>
    <div v-else-if="error" class="state">
      <p>⚠️ {{ error }}</p>
      <button class="btn" @click="loadCatalog(true)">{{ t('retry') }}</button>
    </div>
    <div v-else class="tiles">
      <a v-for="c in categories" :key="c.name" :href="categoryLink(c.name)" class="tile">
        <img v-if="coverOf(c.name)" :src="coverOf(c.name)" :alt="trCat(c.name)" loading="lazy" referrerpolicy="no-referrer" />
        <span v-else class="tile-empty" aria-hidden="true">{{ categoryEmoji(c.name) }}</span>
        <span class="tile-label">
          <b>{{ trCat(c.name) }}</b>
          <small>{{ countBy[c.name] ? t('nDesigns', { n: countBy[c.name] }) : t('comingSoon') }}</small>
        </span>
      </a>
    </div>
  </section>

  <!-- Mẫu hoa theo từng danh mục -->
  <section v-for="s in sections" :key="s.name" class="container block products">
    <div class="sec-head">
      <h2><a :href="categoryLink(s.name)">{{ trCat(s.name) }}</a></h2>
      <div v-if="s.children.length" class="sub-links">
        <a v-for="sub in s.children" :key="sub" :href="categoryLink(s.name, sub)">{{ trCat(sub) }}</a>
      </div>
      <a :href="categoryLink(s.name)" class="more">{{ t('viewAll') }}</a>
    </div>
    <div class="grid">
      <FlowerCard v-for="f in s.items" :key="f.id" :flower="f" @open="emit('open', f, s.items)" />
    </div>
  </section>

  <section v-if="!loading && !error && !sections.length" class="container block">
    <div class="state">
      <p>{{ t('homeEmpty') }} <a :href="`tel:${shop.tel}`">{{ shop.phone }}</a> {{ t('homeEmpty2') }}</p>
    </div>
  </section>

  <p v-if="isDemo" class="container demo-note">
    {{ t('demoNote') }}
  </p>
</template>

<style scoped>
/* Banner */
.banner {
  background:
    radial-gradient(60% 80% at 85% 30%, #fbe1e4 0%, transparent 70%),
    radial-gradient(50% 70% at 0% 100%, #eaf2ea 0%, transparent 70%),
    #fdf6f2;
  overflow: hidden;
}
.banner-inner { display: grid; grid-template-columns: 1.05fr 1fr; gap: 40px; align-items: center; min-height: 440px; padding: 40px 0; }
.kicker { margin: 0; color: var(--sage); font-size: 13px; font-weight: 500; letter-spacing: .14em; text-transform: uppercase; }
h1 { font-family: var(--serif); font-weight: 400; font-size: clamp(34px, 4.8vw, 58px); line-height: 1.1; letter-spacing: -.02em; margin: 14px 0 16px; }
h1 em { color: var(--primary-deep); }
.sub { color: #7d6d71; font-weight: 300; max-width: 470px; margin: 0 0 18px; }
.facts { list-style: none; margin: 0 0 26px; padding: 0; display: grid; gap: 6px; font-size: 14.5px; color: #5e5053; }
.cta { display: flex; gap: 12px; flex-wrap: wrap; }

.pics { position: relative; height: 380px; }
.pic {
  position: absolute; overflow: hidden; border: 6px solid #fff; box-shadow: var(--shadow-lg);
  background: linear-gradient(160deg, #fbe7ea, #fdf1ea);
}
.pic img { width: 100%; height: 100%; object-fit: cover; }
.pic.empty { display: grid; place-items: center; font-size: 84px; }
.p0 { left: 6%; top: 0; width: 50%; height: 100%; border-radius: 999px 999px 24px 24px; }
.p1 { right: 2%; bottom: 0; width: 42%; height: 72%; border-radius: 24px; }
.badge {
  position: absolute; right: 8%; top: 4%; display: flex; align-items: center; gap: 10px;
  padding: 10px 16px; border-radius: 16px; background: rgba(255,255,255,.92); box-shadow: var(--shadow);
}
.badge b { font-family: var(--serif); font-size: 26px; font-weight: 500; color: var(--primary-deep); }
.badge span { font-size: 12px; color: var(--muted); line-height: 1.3; max-width: 76px; }

/* Dịch vụ */
.services { background: #faf6f5; border-block: 1px solid var(--line); }
.services-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; padding: 26px 0; }
.service { display: flex; gap: 14px; align-items: flex-start; }
.icon {
  flex: none; width: 50px; height: 50px; border-radius: 16px; display: grid; place-items: center;
  background: #fff; color: var(--primary-deep); box-shadow: var(--shadow-sm);
}
.icon svg { width: 26px; height: 26px; fill: none; stroke: currentColor; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
.service b { display: block; font-size: 15px; font-weight: 600; text-transform: uppercase; letter-spacing: .02em; }
.service p { margin: 2px 0 0; font-size: 13.5px; color: var(--muted); line-height: 1.5; }

/* Khối chung */
.block { padding: 56px 0 8px; scroll-margin-top: 140px; }
.title { text-align: center; margin-bottom: 30px; }
.title h2 { font-family: var(--serif); font-weight: 400; font-size: clamp(24px, 3vw, 34px); margin: 0; text-transform: uppercase; letter-spacing: .01em; }
.title p { margin: 6px 0 0; color: var(--muted); }

/* Ô danh mục */
.tiles { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
.tile {
  position: relative; aspect-ratio: 4 / 5; border-radius: 20px; overflow: hidden; display: block;
  background: linear-gradient(160deg, #fbe7ea, #fdf1ea 55%, #eef4ee); box-shadow: var(--shadow-sm);
  text-decoration: none; isolation: isolate;
}
.tile img { width: 100%; height: 100%; object-fit: cover; transition: transform .8s var(--ease); }
.tile:hover img { transform: scale(1.06); }
.tile-empty { position: absolute; inset: 0 0 25%; display: grid; place-items: center; font-size: 72px; transition: transform .6s var(--ease); }
.tile:hover .tile-empty { transform: scale(1.1) rotate(-4deg); }
.tile-label {
  position: absolute; inset: auto 0 0; padding: 50px 16px 16px; text-align: center; color: #fff;
  background: linear-gradient(to top, rgba(70, 45, 52, .75), rgba(70, 45, 52, 0));
}
.tile-label b { display: block; font-family: var(--serif); font-weight: 500; font-size: 22px; line-height: 1.2; }
.tile-label small { font-size: 12.5px; opacity: .9; }
.tile.skeleton { animation: pulse 1.4s ease-in-out infinite; }
@keyframes pulse { 50% { opacity: .55; } }

/* Mục sản phẩm */
.sec-head { display: flex; align-items: center; gap: 16px 20px; flex-wrap: wrap; margin-bottom: 22px; padding-bottom: 12px; border-bottom: 1px solid var(--line); }
.sec-head h2 { margin: 0; font-family: var(--serif); font-weight: 400; font-size: 26px; text-transform: uppercase; position: relative; }
.sec-head h2::after { content: ''; position: absolute; left: 0; bottom: -13px; width: 64px; height: 2px; background: var(--primary); }
.sec-head h2 a { color: inherit; text-decoration: none; }
.sub-links { display: flex; gap: 6px; flex-wrap: wrap; flex: 1; }
.sub-links a {
  padding: 5px 12px; border-radius: 999px; font-size: 13px; text-decoration: none; color: #6d5f62;
  box-shadow: inset 0 0 0 1px var(--line); transition: all .25s;
}
.sub-links a:hover { color: var(--primary-deep); box-shadow: inset 0 0 0 1px var(--primary); }
.more { margin-left: auto; color: var(--primary-deep); text-decoration: none; font-weight: 500; font-size: 14.5px; white-space: nowrap; }
.more:hover { text-decoration: underline; text-underline-offset: 3px; }
.grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; }

.state { text-align: center; padding: 40px 16px; color: var(--muted); background: #faf6f5; border-radius: 20px; }
.state a { color: var(--primary-deep); font-weight: 500; }
.demo-note { text-align: center; color: var(--muted); font-size: 13px; padding: 24px 0 0; }
.demo-note code { background: var(--primary-soft); padding: 1px 6px; border-radius: 6px; }

@media (max-width: 980px) {
  .services-grid { grid-template-columns: repeat(2, 1fr); }
  .tiles, .grid { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 760px) {
  .banner-inner { grid-template-columns: 1fr; text-align: center; min-height: 0; padding: 28px 0 32px; gap: 24px; }
  .sub { margin-inline: auto; }
  .cta { justify-content: center; }
  .pics { height: 280px; max-width: 380px; width: 100%; margin: 0 auto; }
  .tiles, .grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
  .tile-label { padding: 40px 10px 12px; }
  .tile-label b { font-size: 17px; }
  .tile-empty { font-size: 54px; }
  .block { padding-top: 40px; }
  .sec-head h2 { font-size: 21px; }
  .sub-links { order: 3; flex-basis: 100%; flex-wrap: nowrap; overflow-x: auto; scrollbar-width: none; }
}
@media (max-width: 480px) {
  .services-grid { grid-template-columns: 1fr 1fr; gap: 14px; padding: 18px 0; }
  .service { flex-direction: column; gap: 8px; }
  .icon { width: 42px; height: 42px; }
  .service b { font-size: 13.5px; }
  .service p { font-size: 12.5px; }
}
</style>
