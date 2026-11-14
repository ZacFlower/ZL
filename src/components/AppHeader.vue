<script setup>
import { ref, watch } from 'vue'
import { categories, categoryLink, slugify } from '../composables/useFlowers'
import { go, route, scrollToId } from '../router'
import { shop } from '../shop'
import { t, trCat } from '../i18n'
import LangSwitch from './LangSwitch.vue'

const q = ref('')
const drawer = ref(false)
const openSub = ref('')

watch(() => route.value.q, (v) => (q.value = v), { immediate: true })
watch(() => `${route.value.name}/${route.value.cat}/${route.value.sub}`, () => (drawer.value = false))
watch(drawer, (v) => (document.body.style.overflow = v ? 'hidden' : ''))

function submit() {
  const s = q.value.trim()
  go(`/san-pham${s ? `?q=${encodeURIComponent(s)}` : ''}`)
  drawer.value = false
}
function toContact() {
  drawer.value = false
  scrollToId('contact')
}
const isActive = (c) => route.value.name === 'category' && route.value.cat === slugify(c.name)
</script>

<template>
  <div class="topbar">
    <div class="container topbar-inner">
      <span>{{ t('topbar') }}</span>
      <span class="right">
        <a v-if="shop.map" :href="shop.map" target="_blank" rel="noopener">📍 {{ shop.address }}</a>
        <a v-if="shop.phone" :href="`tel:${shop.tel}`">☎ {{ shop.phone }}</a>
      </span>
    </div>
  </div>

  <header class="header">
    <div class="container main-row">
      <button class="burger" :aria-label="t('openMenu')" @click="drawer = true">
        <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
      </button>

      <a href="#/" class="logo" :aria-label="`Zacflower – ${t('home')}`">
        <span class="mark">✿</span>
        <span class="word"><b>{{ shop.name }}</b><small>{{ t('tagline') }}</small></span>
      </a>

      <form class="search" role="search" @submit.prevent="submit">
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="m20 20-3.5-3.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
        <input v-model="q" type="search" :placeholder="t('searchPh')" :aria-label="t('searchPh')" />
        <button type="submit">{{ t('search') }}</button>
      </form>

      <LangSwitch class="lang-top" />

      <a v-if="shop.phone" :href="`tel:${shop.tel}`" class="hotline">
        <span class="ring">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>
        </span>
        <span class="txt"><small>{{ t('hotline') }}</small><b>{{ shop.phone }}</b></span>
      </a>
    </div>

    <nav class="nav" :aria-label="t('categories')">
      <ul class="container">
        <li v-for="c in categories" :key="c.name" :class="{ 'has-sub': c.children.length }">
          <a :href="categoryLink(c.name)" :class="{ active: isActive(c) }">
            {{ trCat(c.name) }}
            <svg v-if="c.children.length" viewBox="0 0 24 24" width="12" height="12" aria-hidden="true"><path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </a>
          <div v-if="c.children.length" class="dropdown">
            <a v-for="s in c.children" :key="s" :href="categoryLink(c.name, s)">{{ trCat(s) }}</a>
          </div>
        </li>
        <li><a href="#contact" @click.prevent="toContact">{{ t('contact') }}</a></li>
      </ul>
    </nav>
  </header>

  <!-- Menu trên điện thoại -->
  <Transition name="drawer">
    <div v-if="drawer" class="drawer-wrap" @click.self="drawer = false">
      <aside class="drawer" :aria-label="t('menu')">
        <div class="drawer-head">
          <span class="logo small"><span class="mark">✿</span><b>{{ shop.name }}</b></span>
          <button :aria-label="t('closeMenu')" @click="drawer = false">✕</button>
        </div>
        <form class="search in-drawer" role="search" @submit.prevent="submit">
          <input v-model="q" type="search" :placeholder="t('searchPhShort')" :aria-label="t('searchPhShort')" />
          <button type="submit">{{ t('search') }}</button>
        </form>
        <ul class="tree">
          <li><a href="#/">{{ t('home') }}</a></li>
          <li><a href="#/san-pham">{{ t('allFlowers') }}</a></li>
          <li v-for="c in categories" :key="c.name">
            <div class="row">
              <a :href="categoryLink(c.name)">{{ trCat(c.name) }}</a>
              <button
                v-if="c.children.length"
                :aria-expanded="openSub === c.name"
                :aria-label="trCat(c.name)"
                @click="openSub = openSub === c.name ? '' : c.name"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" :class="{ up: openSub === c.name }"><path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </button>
            </div>
            <ul v-if="c.children.length && openSub === c.name" class="subtree">
              <li v-for="s in c.children" :key="s"><a :href="categoryLink(c.name, s)">{{ trCat(s) }}</a></li>
            </ul>
          </li>
          <li><a href="#contact" @click.prevent="toContact">{{ t('contact') }}</a></li>
        </ul>
        <a v-if="shop.phone" :href="`tel:${shop.tel}`" class="btn drawer-call">{{ t('callN', { phone: shop.phone }) }}</a>
        <LangSwitch class="lang-drawer" />
      </aside>
    </div>
  </Transition>
</template>

<style scoped>
.topbar { background: var(--primary-deep); color: #fff; font-size: 13px; }
.topbar-inner { display: flex; justify-content: space-between; gap: 16px; height: 36px; align-items: center; }
.topbar a { color: #fff; text-decoration: none; opacity: .92; }
.topbar a:hover { opacity: 1; text-decoration: underline; }
.topbar .right { display: flex; gap: 22px; }

.header {
  position: sticky; top: 0; z-index: 30;
  background: rgba(255, 255, 255, .96); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
  box-shadow: 0 1px 0 var(--line), 0 6px 24px -18px rgba(140, 80, 95, .35);
}
.main-row { display: flex; align-items: center; gap: 28px; height: 76px; }

.burger { display: none; border: 0; background: none; padding: 6px; margin-left: -6px; color: var(--text); }

.logo { display: flex; align-items: center; gap: 10px; text-decoration: none; color: var(--text); flex: none; }
.mark {
  width: 42px; height: 42px; display: grid; place-items: center; border-radius: 50%;
  background: var(--grad); color: #fff; font-size: 20px; box-shadow: 0 6px 16px -6px rgba(212,132,143,.8);
}
.word { display: grid; line-height: 1.1; }
.word b { font-family: var(--serif); font-weight: 500; font-size: 25px; letter-spacing: -.01em; }
.word small { font-size: 11.5px; color: var(--muted); letter-spacing: .08em; text-transform: uppercase; margin-top: 3px; }

.search {
  flex: 1; max-width: 560px; margin: 0 auto; display: flex; align-items: center; gap: 8px;
  height: 46px; padding: 0 5px 0 18px; border-radius: 999px; background: #faf5f3;
  box-shadow: inset 0 0 0 1px var(--line); color: var(--muted); transition: box-shadow .3s var(--ease);
}
.search:focus-within { box-shadow: inset 0 0 0 1.5px var(--primary), 0 0 0 4px var(--primary-soft); background: #fff; }
.search input { flex: 1; min-width: 0; border: 0; outline: 0; background: none; font: inherit; font-size: 14.5px; color: var(--text); }
.search button {
  height: 36px; padding: 0 18px; border: 0; border-radius: 999px; background: var(--grad); color: #fff; font-weight: 500; font-size: 14px;
}

.hotline { display: flex; align-items: center; gap: 10px; text-decoration: none; color: var(--text); flex: none; }
.ring {
  width: 42px; height: 42px; border-radius: 50%; display: grid; place-items: center;
  background: var(--primary-soft); color: var(--primary-deep); animation: ring 2.4s ease-in-out infinite;
}
@keyframes ring { 0%, 100% { box-shadow: 0 0 0 0 rgba(212,132,143,.35); } 50% { box-shadow: 0 0 0 8px rgba(212,132,143,0); } }
.hotline .txt { display: grid; line-height: 1.2; }
.hotline small { color: var(--muted); font-size: 12px; }
.hotline b { color: var(--primary-deep); font-size: 17px; font-weight: 600; }

.nav { border-top: 1px solid var(--line); }
.nav ul { list-style: none; margin: 0 auto; padding: 0; display: flex; flex-wrap: wrap; justify-content: center; }
.nav li { position: relative; }
.nav li > a {
  display: flex; align-items: center; gap: 5px; height: 48px; padding: 0 15px;
  text-decoration: none; color: var(--text); font-size: 13.5px; font-weight: 500;
  text-transform: uppercase; letter-spacing: .04em; position: relative; transition: color .25s;
}
.nav li > a::after {
  content: ''; position: absolute; left: 15px; right: 15px; bottom: 10px; height: 2px; border-radius: 2px;
  background: var(--primary); transform: scaleX(0); transition: transform .35s var(--ease);
}
.nav li > a:hover, .nav li > a.active { color: var(--primary-deep); }
.nav li > a:hover::after, .nav li > a.active::after { transform: scaleX(1); }
.dropdown {
  position: absolute; top: 100%; left: 0; min-width: 220px; padding: 8px; z-index: 5;
  background: #fff; border-radius: 16px; box-shadow: var(--shadow-lg), inset 0 0 0 1px var(--line);
  opacity: 0; visibility: hidden; transform: translateY(8px); transition: all .3s var(--ease);
}
.has-sub:hover .dropdown, .has-sub:focus-within .dropdown { opacity: 1; visibility: visible; transform: none; }
.dropdown a { display: block; padding: 10px 14px; border-radius: 10px; text-decoration: none; color: var(--text); font-size: 14.5px; }
.dropdown a:hover { background: var(--primary-soft); color: var(--primary-deep); }

/* Drawer */
.drawer-wrap { position: fixed; inset: 0; z-index: 60; background: rgba(60, 40, 45, .35); }
.drawer {
  position: absolute; inset: 0 auto 0 0; width: min(330px, 88vw); background: #fff;
  display: flex; flex-direction: column; padding: 16px; overflow-y: auto;
}
.drawer-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
.drawer-head button { border: 0; background: var(--primary-soft); color: var(--primary-deep); width: 36px; height: 36px; border-radius: 50%; }
.logo.small { gap: 8px; }
.logo.small .mark { width: 34px; height: 34px; font-size: 16px; }
.logo.small b { font-family: var(--serif); font-weight: 500; font-size: 21px; }
.search.in-drawer { max-width: none; margin: 0 0 12px; height: 44px; }
.tree { list-style: none; margin: 0; padding: 0; }
.tree > li { border-bottom: 1px solid var(--line); }
.tree a { display: block; padding: 13px 4px; text-decoration: none; color: var(--text); font-weight: 500; font-size: 15px; }
.row { display: flex; align-items: center; justify-content: space-between; }
.row a { flex: 1; }
.row button { border: 0; background: none; width: 40px; height: 40px; color: var(--muted); }
.row svg { transition: transform .3s var(--ease); }
.row svg.up { transform: rotate(180deg); }
.subtree { list-style: none; margin: 0 0 8px; padding: 0 0 0 14px; border-left: 2px solid var(--primary-soft); }
.subtree a { padding: 9px 4px; font-weight: 400; font-size: 14.5px; color: #6d5f62; }
.drawer-call { margin-top: 18px; }
.lang-drawer { align-self: center; margin-top: 14px; }
.drawer-enter-active, .drawer-leave-active { transition: opacity .3s var(--ease); }
.drawer-enter-active .drawer, .drawer-leave-active .drawer { transition: transform .35s var(--ease); }
.drawer-enter-from, .drawer-leave-to { opacity: 0; }
.drawer-enter-from .drawer, .drawer-leave-to .drawer { transform: translateX(-100%); }

@media (max-width: 1020px) {
  .hotline .txt { display: none; }
  .main-row { gap: 18px; }
}
@media (max-width: 860px) {
  .topbar { display: none; }
  .nav { display: none; }
  .burger { display: block; }
  .main-row { flex-wrap: wrap; height: auto; padding: 10px 0; gap: 10px 12px; }
  .logo { margin-right: auto; }
  .mark { width: 36px; height: 36px; font-size: 17px; }
  .word b { font-size: 21px; }
  .word small { font-size: 10px; }
  .main-row .search { order: 3; flex-basis: 100%; max-width: none; height: 42px; }
  .ring { width: 38px; height: 38px; }
}
</style>
