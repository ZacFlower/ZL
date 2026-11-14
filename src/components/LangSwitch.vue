<script setup>
import { lang, setLang, t } from '../i18n'
</script>

<template>
  <div class="lang" role="group" :aria-label="t('langSwitch')">
    <button :class="{ on: lang === 'vi' }" :aria-pressed="lang === 'vi'" lang="vi" title="Tiếng Việt" @click="setLang('vi')">VI</button>
    <button :class="{ on: lang === 'en' }" :aria-pressed="lang === 'en'" lang="en" title="English" @click="setLang('en')">EN</button>
  </div>
</template>

<style scoped>
.lang {
  display: inline-flex; flex: none; padding: 3px; gap: 2px; border-radius: 999px;
  background: #faf3f2; box-shadow: inset 0 0 0 1px var(--line);
}
button {
  min-width: 36px; height: 32px; padding: 0 10px; border: 0; border-radius: 999px;
  background: transparent; color: var(--muted); font-size: 13px; font-weight: 600; letter-spacing: .04em;
  transition: all .25s var(--ease);
}
button:hover { color: var(--primary-deep); }
button.on { background: #fff; color: var(--primary-deep); box-shadow: var(--shadow-sm); }
</style>
