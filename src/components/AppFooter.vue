<script setup>
import { categories, categoryLink } from '../composables/useFlowers'
import { shop } from '../shop'

const host = (url) => url.replace(/^https?:\/\//, '').replace(/\/$/, '')
</script>

<template>
  <footer id="contact">
    <div class="cta-band">
      <div class="container cta-inner">
        <div>
          <h3>Cần một bó hoa <em>riêng cho bạn?</em></h3>
          <p>Kể cho Zacflower nghe dịp đặc biệt của bạn — chúng mình thiết kế và giao tận nơi tại Đà Nẵng. <span>We speak English too!</span></p>
        </div>
        <div class="cta-actions">
          <a v-if="shop.phone" :href="`tel:${shop.tel}`" class="btn">Gọi {{ shop.phone }}</a>
          <a v-if="shop.zalo" :href="`https://zalo.me/${shop.zalo}`" target="_blank" rel="noopener" class="btn ghost">Zalo</a>
          <a v-if="shop.whatsapp" :href="`https://wa.me/${shop.whatsapp}`" target="_blank" rel="noopener" class="btn ghost">WhatsApp</a>
        </div>
      </div>
    </div>

    <div class="container cols">
      <div class="col brand">
        <a href="#/" class="logo"><span class="mark">✿</span><b>{{ shop.name }}</b></a>
        <p>Shop hoa tươi tại Đà Nẵng — hoa bó, hoa chủ đề, kệ hoa chúc mừng, hoa chia buồn. Hoa tuyển chọn 100%, thiết kế độc quyền, giao hỏa tốc tận nơi.</p>
        <p class="rating">⭐ 84% khách đề xuất · 1,2K người theo dõi trên Facebook</p>
      </div>

      <div class="col">
        <h4>Danh mục hoa</h4>
        <ul>
          <li v-for="c in categories" :key="c.name"><a :href="categoryLink(c.name)">{{ c.name }}</a></li>
        </ul>
      </div>

      <div class="col">
        <h4>Liên hệ</h4>
        <ul class="info">
          <li v-if="shop.address">📍 <a v-if="shop.map" :href="shop.map" target="_blank" rel="noopener">{{ shop.address }}</a><template v-else>{{ shop.address }}</template></li>
          <li v-if="shop.phone">☎ <a :href="`tel:${shop.tel}`">{{ shop.phone }}</a></li>
          <li v-if="shop.zalo">💬 Zalo / WhatsApp: {{ shop.phone }}</li>
          <li v-if="shop.website">🌐 <a :href="shop.website" target="_blank" rel="noopener">{{ host(shop.website) }}</a></li>
          <li>⏰ Luôn mở cửa</li>
        </ul>
      </div>

      <div class="col">
        <h4>Đặt hoa thế nào?</h4>
        <ol class="steps">
          <li>Chọn mẫu hoa &amp; loại giá trên web</li>
          <li>Gửi mã mẫu qua Zalo / hotline</li>
          <li>Zacflower xác nhận &amp; giao tận nơi</li>
        </ol>
        <a v-if="shop.map" :href="shop.map" target="_blank" rel="noopener" class="btn soft map">Xem bản đồ</a>
      </div>
    </div>

    <div class="bottom">
      <div class="container">© {{ new Date().getFullYear() }} {{ shop.name }} · Shop hoa tươi Đà Nẵng · <a href="#/admin" class="admin-link">Quản lý</a></div>
    </div>
  </footer>
</template>

<style scoped>
footer { margin-top: 72px; background: #fbf4f2; scroll-margin-top: 120px; }
.cta-band { background: linear-gradient(120deg, #f6d3d8 0%, #fbe6dc 60%, #e4eee5 100%); }
.cta-inner { display: flex; align-items: center; justify-content: space-between; gap: 24px; flex-wrap: wrap; padding: 34px 0; }
.cta-inner h3 { font-family: var(--serif); font-weight: 400; font-size: clamp(24px, 3vw, 32px); margin: 0 0 6px; }
.cta-inner h3 em { color: var(--primary-deep); }
.cta-inner p { margin: 0; color: #6d5f62; max-width: 560px; font-weight: 300; }
.cta-inner p span { color: var(--primary-deep); font-weight: 400; }
.cta-actions { display: flex; gap: 10px; flex-wrap: wrap; }

.cols { display: grid; grid-template-columns: 1.4fr 1fr 1.2fr 1fr; gap: 36px; padding: 48px 0 36px; }
.logo { display: flex; align-items: center; gap: 10px; text-decoration: none; color: var(--text); margin-bottom: 12px; }
.mark { width: 38px; height: 38px; border-radius: 50%; display: grid; place-items: center; background: var(--grad); color: #fff; }
.logo b { font-family: var(--serif); font-weight: 500; font-size: 24px; }
.brand p { color: #7d6d71; font-size: 14px; margin: 0 0 10px; }
.rating { color: var(--primary-deep) !important; }
h4 { margin: 4px 0 14px; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: .06em; }
ul, ol { margin: 0; padding: 0; list-style: none; display: grid; gap: 8px; font-size: 14px; color: #6d5f62; }
.col a { color: #6d5f62; text-decoration: none; }
.col a:hover { color: var(--primary-deep); text-decoration: underline; text-underline-offset: 3px; }
.steps { counter-reset: s; }
.steps li { counter-increment: s; display: flex; gap: 10px; align-items: baseline; }
.steps li::before {
  content: counter(s); flex: none; width: 22px; height: 22px; border-radius: 50%; display: grid; place-items: center;
  background: var(--primary-soft); color: var(--primary-deep); font-size: 12px; font-weight: 600;
}
.map { margin-top: 16px; padding: 9px 18px; font-size: 14px; }
.admin-link { color: var(--muted); }
.bottom { border-top: 1px solid var(--line); padding: 16px 0 90px; font-size: 13px; color: var(--muted); text-align: center; }

@media (max-width: 900px) {
  .cols { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 560px) {
  .cols { grid-template-columns: 1fr; gap: 26px; padding-top: 36px; }
  .cta-inner { text-align: center; justify-content: center; }
  .cta-actions { justify-content: center; }
}
</style>
