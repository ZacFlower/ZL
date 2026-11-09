<script setup>
import { defineAsyncComponent, onMounted, ref } from 'vue'
import { route } from './router'
import { shop } from './shop'
import { loadCatalog } from './composables/useFlowers'
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

onMounted(() => loadCatalog())
</script>

<template>
  <AdminPage v-if="route.name === 'admin'" />

  <template v-else>
    <AppHeader />

    <main>
      <HomePage v-if="route.name === 'home'" @open="openFlower" />
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
        @close="selected = null"
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
