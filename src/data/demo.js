// Dữ liệu mẫu hiển thị khi chưa cấu hình Google Drive (.env).
const palettes = [
  ['#f8dfe3', '#e7a1aa'],
  ['#fbe7da', '#efb48f'],
  ['#e4eee5', '#9fbfa6'],
  ['#ece3f2', '#c3a6d6'],
  ['#fbf0d9', '#e9c98c'],
  ['#e3edf2', '#a5c4d4'],
]
const blooms = ['🌹', '🌷', '🌸', '🌻', '💐', '🌼', '🪷', '🌺']

function placeholder(i, w) {
  const [bg, fg] = palettes[i % palettes.length]
  const emoji = blooms[i % blooms.length]
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="${w}">
<defs><radialGradient id="g" cx="50%" cy="40%" r="75%"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="${bg}"/></radialGradient></defs>
<rect width="400" height="500" fill="url(#g)"/>
<circle cx="200" cy="230" r="120" fill="${fg}" opacity=".18"/>
<text x="200" y="285" font-size="150" text-anchor="middle">${emoji}</text></svg>`
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
}

const TD = 'Hoa chủ đề'

// Cây danh mục — giống cấu trúc thư mục trên Google Drive
const categories = [
  { name: TD, children: ['Hoa sinh nhật', 'Hoa đám cưới', 'Hoa tiệc', 'Hoa lễ 14/2', 'Hoa lễ 8/3', 'Hoa lễ 20/10', 'Hoa lễ 20/11'] },
  { name: 'Hoa hot trend', children: [] },
  { name: 'Hoa bó', children: [] },
  { name: 'Hoa lẵng', children: [] },
  { name: 'Hoa bình', children: [] },
  { name: 'Hoa lan hồ điệp', children: [] },
  { name: 'Kệ hoa khai trương', children: [] },
  { name: 'Kệ hoa chia buồn', children: [] },
]

// [tên, danh mục, danh mục con, giá, mô tả]
const raw = [
  ['Bó hồng đỏ Classic', TD, 'Hoa sinh nhật', [['10 bông', 350000], ['20 bông', 450000], ['50 bông', 1050000]], 'Bó 20 bông hồng đỏ Ecuador, giấy gói Hàn Quốc tông đen sang trọng.'],
  ['Hộp hoa Sweetie', TD, 'Hoa sinh nhật', 390000, 'Hộp tròn hồng phấn, cẩm chướng và baby.'],
  ['Cẩm tú cầu cô dâu', TD, 'Hoa đám cưới', 850000, 'Hoa cầm tay cô dâu: cẩm tú cầu trắng, hồng kem và thạch thảo.'],
  ['Hoa bàn tiệc Pastel', TD, 'Hoa tiệc', 650000, 'Cắm bàn tiệc tông pastel, hồng và cát tường.'],
  ['Valentine Đỏ Thắm', TD, 'Hoa lễ 14/2', 990000, '99 bông hồng đỏ hình trái tim cho ngày Valentine.'],
  ['Tulip Pastel 8/3', TD, 'Hoa lễ 8/3', 680000, 'Tulip Hà Lan nhiều màu pastel, phối lá bạc và baby trắng.'],
  ['Hồng kem 20/10', TD, 'Hoa lễ 20/10', 520000, 'Bó hồng kem dịu dàng tặng mẹ, tặng vợ.'],
  ['Tri ân thầy cô', TD, 'Hoa lễ 20/11', 420000, 'Bó hướng dương và cúc mẫu đơn tri ân thầy cô.'],
  ['Bó cúc họa mi', 'Hoa bó', null, 320000, 'Bó cúc họa mi mùa đông, gói giấy kraft mộc mạc.'],
  ['Bó mẫu đơn trắng', 'Hoa bó', null, [['Size S', 850000], ['Size M', 1200000], ['Size L', 1650000]], 'Bó mẫu đơn trắng nhập khẩu, ruy băng lụa.'],
  ['Lẵng hướng dương', 'Hoa lẵng', null, 550000, 'Lẵng mây 12 bông hướng dương mang ý nghĩa may mắn.'],
  ['Tulip Hàn Quốc', 'Hoa hot trend', null, 750000, 'Bó tulip gói giấy lụa trong suốt phong cách Hàn Quốc.'],
  ['Lan hồ điệp 5 cành', 'Hoa lan hồ điệp', null, [['3 cành', 1300000], ['5 cành', 2200000]], 'Chậu sứ trắng, lan tím cắm sẵn đi tặng.'],
  ['Bình hoa để bàn', 'Hoa bình', null, 480000, 'Bình gốm trắng cắm hồng, lys và lá bạc.'],
  ['Kệ Hưng Thịnh', 'Kệ hoa khai trương', null, [['1 tầng', 900000], ['2 tầng', 1500000]], 'Kệ 2 tầng hướng dương, đồng tiền và lan vũ nữ.'],
  ['Kệ chia buồn trắng', 'Kệ hoa chia buồn', null, 1100000, 'Kệ hoa trắng tinh khôi: cúc, lys và hồng trắng.'],
]

export const demoData = {
  categories,
  flowers: raw.map(([name, category, subcategory, p, description], i) => {
    const prices = Array.isArray(p) ? p.map(([label, price]) => ({ label, price })) : [{ label: '', price: p }]
    return {
    id: `demo-${i}`,
    name,
    category,
    subcategory,
    prices,
    price: Math.min(...prices.map((x) => x.price)),
    description,
    createdTime: new Date(Date.now() - i * 86400000).toISOString(),
    thumb: placeholder(i, 400),
    image: placeholder(i, 800),
  }}),
}
