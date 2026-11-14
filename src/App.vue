<script setup>
import { defineAsyncComponent, onMounted, ref, watch } from 'vue'
import { go, route } from './router'
import { shop } from './shop'
import { flowers, loadCatalog } from './composables/useFlowers'
import AppHeader from './components/AppHeader.vue'
import HomePage from './components/HomePage.vue'
import CategoryPage from './components/CategoryPage.vue'
import AppFooter from './components/AppFooter.vue'
import FloatingContact from './components/FloatingContact.vue'
import FlowerModal from './components/FlowerModal.vue'

// Trang quản lý chỉ tải khi mở #/admin
const AdminPage = defineAsyncComponent(() => import('./components/admin/AdminPage.vue'))

const selected = ref(null)
const modalList = ref([])
function openFlower(flower, list) {
  selected.value = flower
  modalList.value = list?.length ? list : [flower]
}

// Link #/mau/<id>: mở popup mẫu đó khi dữ liệu đã tải
watch(
  [() => route.value.name === 'design' && route.value.id, flowers],
  ([id]) => {
    if (!id) return
    const f = flowers.value.find((x) => x.id === id)
    if (f) openFlower(f, flowers.value.filter((x) => x.category === f.category))
  },
  { immediate: true },
)
function closeFlower() {
  selected.value = null
  if (route.value.name === 'design') go('/')
}

onMounted(() => loadCatalog())
</script>

<template>
  <AdminPage v-if="route.name === 'admin'" />

  <template v-else>
    <AppHeader />

    <main>
      <HomePage v-if="route.name === 'home' || route.name === 'design'" @open="openFlower" />
      <CategoryPage v-else :key="`${route.cat}/${route.sub}`" @open="openFlower" />
    </main>

    <AppFooter />
    <FloatingContact />

    <Transition name="modal">
      <FlowerModal
        v-if="selected"
        :flower="selected"
        :list="modalList"
        :shop="shop"
        @close="closeFlower"
        @navigate="selected = $event"
      />
    </Transition>
  </template>
</template>

<style>
main { min-height: 60vh; }
.modal-enter-active, .modal-leave-active { transition: opacity .35s var(--ease); }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>
