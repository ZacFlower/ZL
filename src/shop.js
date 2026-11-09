// Thông tin cửa hàng — sửa trong file .env
const env = import.meta.env
const phone = env.VITE_SHOP_PHONE || ''
const address = env.VITE_SHOP_ADDRESS || ''
const name = env.VITE_SHOP_NAME || 'Zacflower'

export const shop = {
  name,
  phone,
  tel: phone.replace(/[^\d+]/g, ''),
  zalo: env.VITE_SHOP_ZALO || '',
  whatsapp: env.VITE_SHOP_WHATSAPP || '',
  address,
  website: env.VITE_SHOP_WEBSITE || '',
  facebook: env.VITE_SHOP_FACEBOOK || '',
  map: address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} ${address}`)}` : '',
}
