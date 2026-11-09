# 🌸 Web giới thiệu mẫu hoa (Vue 3 + Google Drive)

Frontend **Vue 3 + Vite**, dữ liệu lấy trực tiếp từ **Google Drive** (không cần backend).
Chủ shop chỉ cần upload ảnh lên Drive là web tự cập nhật.

## Chạy thử

```bash
npm install
npm run dev
```

Chưa cấu hình Drive thì web hiển thị **dữ liệu mẫu**.

## Cách tổ chức dữ liệu trên Google Drive

```
📁 Zacflower – Mẫu hoa (thư mục gốc)   ← chia sẻ: "Bất kỳ ai có đường liên kết" – Người xem
 ├─ 📁 1. Hoa chủ đề                    ← thư mục cấp 1 = danh mục
 │   ├─ 📁 1. Hoa sinh nhật             ← thư mục cấp 2 = danh mục con
 │   │   └─ 🖼 Bó hồng đỏ Classic.jpg    ← mỗi ảnh = 1 mẫu (tên file = tên mẫu)
 │   ├─ 📁 2. Hoa đám cưới
 │   ├─ 📁 3. Hoa tiệc
 │   ├─ 📁 4. Hoa lễ 14/2
 │   ├─ 📁 5. Hoa lễ 8/3
 │   ├─ 📁 6. Hoa lễ 20/10
 │   └─ 📁 7. Hoa lễ 20/11
 ├─ 📁 2. Hoa bó                        ← danh mục không cần thư mục con: để ảnh trực tiếp
 ├─ 📁 3. Hoa lẵng
 ├─ 📁 4. Hoa bình
 ├─ 📁 5. Kệ hoa khai trương
 ├─ 📁 6. Kệ hoa chia buồn
 └─ 🖼 ảnh để ở gốc → danh mục "Khác"
```

- **Số thứ tự** ở đầu tên thư mục (`1. `, `02 - `…) dùng để sắp xếp và sẽ tự ẩn trên web.
- Chỉ đọc tối đa 2 cấp thư mục.

**Tên mẫu** = tên file ảnh (đổi tên ảnh trên Drive là đổi tên trên web, phần `.jpg` tự ẩn).

**Giá & mô tả**: chuột phải ảnh trên Drive → *Thông tin tệp* → *Chi tiết* → ô **Mô tả**.

Một giá:
```
Giá: 450000
Bó 20 bông hồng đỏ Ecuador, giấy gói Hàn Quốc.
```

Nhiều loại giá (mỗi loại một dòng, bắt đầu bằng `Giá`, tên loại trước dấu `:`):
```
Giá 10 bông: 350k
Giá 20 bông: 450k
Giá 50 bông: 1tr05
Bó hồng đỏ Ecuador, giấy gói Hàn Quốc.
```

- Viết giá kiểu nào cũng được: `450000`, `450.000đ`, `450k`, `1tr2`, `1,5 triệu`.
- Thẻ hoa hiện giá thấp nhất ("Từ 350.000 ₫ · 3 loại"), popup và chế độ **Bảng giá** hiện đủ từng loại.
- Không có dòng `Giá` → hiện "Liên hệ". Các dòng còn lại là mô tả.

## Kết nối Google Drive

1. Vào [Google Cloud Console](https://console.cloud.google.com/) → tạo project.
2. **APIs & Services → Library** → bật **Google Drive API**.
3. **APIs & Services → Credentials → Create credentials → API key**.
   - Nên bấm *Edit API key* → **Application restrictions: Websites** → thêm domain của bạn (vd `http://localhost:5173/*`, `https://tenmien.com/*`)
   - **API restrictions** → chỉ chọn *Google Drive API*.
4. Chia sẻ thư mục gốc: *Chia sẻ → Quyền truy cập chung → Bất kỳ ai có đường liên kết → Người xem*.
5. Lấy ID thư mục từ URL: `https://drive.google.com/drive/folders/`**`1AbCdEf...`**
6. Copy `.env.example` thành `.env` và điền:

```env
VITE_GDRIVE_API_KEY=AIza...
VITE_GDRIVE_FOLDER_ID=1AbCdEf...
VITE_SHOP_NAME=Tiệm Hoa Xinh
VITE_SHOP_PHONE=0900000000
VITE_SHOP_ZALO=0900000000
VITE_SHOP_ADDRESS=123 Đường Hoa, Quận 1, TP.HCM
```

7. Chạy lại `npm run dev`.

> ⚠️ API key nằm trong code frontend (ai cũng xem được) — vì vậy key chỉ nên có quyền **đọc** Drive API và giới hạn theo domain như bước 3. Dữ liệu trong thư mục là công khai.

Dữ liệu được cache 5 phút trong trình duyệt; bấm nút **↻** để tải lại ngay.

## Trang quản lý (`#/admin`)

Mở `http://localhost:5173/#/admin` (hoặc link **Quản lý** ở cuối trang) để **thêm / sửa / xóa mẫu hoa** ngay trên web:
ảnh, tên, danh mục, nhiều loại giá, mô tả, tạo danh mục mới, tải nhiều ảnh một lần. Mọi thay đổi được ghi thẳng lên Google Drive.

API key chỉ đọc được, nên trang này cần **đăng nhập Google** (OAuth):

1. Google Cloud Console → **APIs & Services → Credentials** → mở OAuth client loại **Web application**
   (chưa có thì *Create credentials → OAuth client ID → Web application*).
2. **Authorized JavaScript origins** → thêm `http://localhost:5173` (và domain thật khi deploy, vd `https://zacflower.com`). Lưu.
3. Copy **Client ID** (dạng `xxxx.apps.googleusercontent.com`).
4. **OAuth consent screen** → nếu đang ở chế độ *Testing*, thêm email của bạn vào **Test users**.
5. Điền vào `.env` rồi chạy lại `npm run dev`:
   ```env
   VITE_GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
   VITE_ADMIN_EMAILS=email-cua-ban@gmail.com
   ```

Lần đầu đăng nhập Google sẽ cảnh báo *“Google chưa xác minh ứng dụng này”* (vì là app riêng) → bấm **Nâng cao → Đi tới … (không an toàn)** → **Tiếp tục**.

- Chỉ tài khoản có **quyền chỉnh sửa** thư mục trên Drive mới lưu được; `VITE_ADMIN_EMAILS` giới hạn thêm ai được vào trang.
- **Xóa** = chuyển vào Thùng rác của Drive (khôi phục được trong 30 ngày).
- Thư mục gốc nên để chia sẻ **“Bất kỳ ai có liên kết – Người xem”** (không phải *Người chỉnh sửa*), web công khai vẫn hiển thị bình thường.

## Build & deploy

```bash
npm run build
```

Thư mục `dist/` là web tĩnh — deploy lên Netlify, Vercel, GitHub Pages, Firebase Hosting… (nhớ khai báo các biến `VITE_*` trong phần Environment variables của nơi deploy).

## Cấu trúc code

| File | Vai trò |
|---|---|
| `src/services/drive.js` | Đọc Drive bằng API key: thư mục/ảnh, tách giá từ mô tả, cache |
| `src/services/driveAdmin.js` | Đăng nhập Google + ghi lên Drive (tải ảnh, sửa, chuyển, xóa, tạo thư mục) |
| `src/composables/useFlowers.js` | Kho dữ liệu dùng chung: lọc, tìm kiếm (không dấu), khoảng giá, sắp xếp |
| `src/router.js` | Router theo hash: trang chủ, danh mục, tìm kiếm, `#/admin` |
| `src/shop.js` | Thông tin cửa hàng (đọc từ `.env`) |
| `src/data/demo.js` | Dữ liệu mẫu khi chưa cấu hình (`npm run dev:demo`) |
| `src/components/*` | Header, trang chủ, trang danh mục, thẻ hoa, bảng giá, popup, footer, nút liên hệ nổi |
| `src/components/admin/*` | Trang quản lý và form thêm / sửa mẫu hoa |
