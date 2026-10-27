# BÁO CÁO TRIỂN KHAI GIAO DIỆN CỔNG ĐẠI HỌC ĐÀ NẴNG (UDN LANDING PAGE IMPLEMENTATION REPORT)
## PHIÊN BẢN TỐI GIẢN CHÍNH THỨC (MINIMAL INSTITUTIONAL DESIGN)

**Dự án:** Cổng xét chọn Danh hiệu và Giải thưởng Sinh viên Đại học Đà Nẵng  
**Đơn vị tổ chức:** Hội Sinh viên Việt Nam Đại học Đà Nẵng  
**Trực thuộc:** Đại học Đà Nẵng  
**Mức độ ưu tiên:** P0 — Minimal University of Da Nang Deployment Branding & Public Landing Page  
**Thời gian hoàn thành:** 25/10/2026  

---

## 1. THIẾT KẾ TỐI GIẢN VÀ HÌNH ẢNH SỬ DỤNG

- **Triết lý thiết kế:** Tối giản, trang trọng, chuẩn mực trang thông tin hành chính của trường đại học công lập (Modern Vietnamese Institutional Portal). Loại bỏ hoàn toàn các chi tiết AI slop (không vòng tròn trang trí, không gradient sặc sỡ, không slogan đao to búa lớn, không số liệu hồ sơ ảo).
- **Hình ảnh nền Hero:**
  - Nguồn URL người dùng cung cấp: `https://lh3.googleusercontent.com/gps-cs-s/ANWiy9TOowljC17HMzBFqDKZNZw4NuJdTFYBOFph-hwHfJC0l0G9FwN0yqLjGqiJSA-8QmOxgalIYMDj7ltipz6fbRZOTYJV1zIR4Wybxe2DhtdNOxII5WBkQELUMkn6q8tmvnDbXyPLoA=s680-w680-h510-rw`
  - Đã tải và lưu trữ nội bộ tại asset dự án: `/public/assets/udn/udn_campus_hero.jpg` (kèm bản phân giải cao HD 1000x750 tại `/public/assets/udn/udn_campus_hero_hd.jpg`).
  - Nội dung ảnh thực tế: Cổng trường và bia biểu trưng chính thức của **Đại học Đà Nẵng tại số 41 Lê Duẩn, TP. Đà Nẵng**.
  - Thiết lập hiển thị: `background-size: cover`, `background-position: right center`, lớp phủ scrim chuyển màu êm dịu bảo đảm chữ trắng tương phản hoàn hảo bên trái và giữ trọn vẹn nét kiến trúc cổng trường ở bên phải. Nền fallback trung tính `#0F2F4A`.
  - Chiều cao Hero: 360–400px trên desktop, tự điều chỉnh linh hoạt trên mobile.

---

## 2. BỐN KHU VỰC CHÍNH CỦA TRANG (4 CORE AREAS)

1. **A. Header (Thanh đầu trang):**
   - Nền trắng, chiều cao 66–72px, viền mờ `#E2EBF0`.
   - Bên trái: Huy hiệu Hội Sinh viên Việt Nam vector chuẩn + tên đơn vị **HỘI SINH VIÊN VIỆT NAM ĐẠI HỌC ĐÀ NẴNG** (kèm dòng phụ ĐẠI HỌC ĐÀ NẴNG).
   - Bên phải: Duy nhất 01 nút chính **"Đăng nhập"** kết nối trực tiếp với luồng xác thực hiện có. Không có menu rườm rà, không có hai nút trùng lặp.
   - Mobile: Tên rút gọn và nút Đăng nhập hiển thị gọn gàng.

2. **B. Hero (Khu vực hình ảnh & tiêu đề):**
   - Dòng phụ: **Đại học Đà Nẵng**
   - Tiêu đề: **Cổng xét chọn danh hiệu và giải thưởng sinh viên**
   - Mô tả ngắn: *"Tiếp nhận và quản lý hồ sơ xét chọn danh hiệu Sinh viên 5 tốt, Tập thể Sinh viên 5 tốt và Giải thưởng Cánh chim trắng cấp Đại học Đà Nẵng."*
   - Không câu khẩu hiệu thừa, không số liệu giả, chữ rõ ràng dễ đọc.

3. **C. Ba hạng mục xét chọn (Danh hiệu và giải thưởng):**
   - Heading đơn giản: **Danh hiệu và giải thưởng**
   - 03 card ngang hàng trên desktop (xếp dọc trên mobile), nền trắng, viền `#E2EBF0`, bo góc 11px, icon đơn sắc xanh nhã nhặn, chiều cao đồng đều:
     - **01 — Sinh viên 5 tốt:** *"Xét chọn danh hiệu Sinh viên 5 tốt dành cho sinh viên thuộc các trường thành viên, đơn vị trực thuộc Đại học Đà Nẵng."*
     - **02 — Tập thể Sinh viên 5 tốt:** *"Xét chọn danh hiệu Tập thể Sinh viên 5 tốt dành cho các tập thể sinh viên thuộc Đại học Đà Nẵng."*
     - **03 — Giải thưởng Cánh chim trắng:** *"Tiếp nhận hồ sơ đề cử và xét chọn Giải thưởng Cánh chim trắng theo quy chế áp dụng."*
   - Card đóng vai trò giới thiệu thanh lịch, không thêm các nút giả không hoạt động.

4. **D. Footer (Chân trang):**
   - Nền trắng, đường viền trên `#E2EBF0`.
   - Tiêu đề: **Hội Sinh viên Việt Nam Đại học Đà Nẵng**
   - Dòng phụ: *"Cổng xét chọn danh hiệu và giải thưởng sinh viên"*
   - Thông tin liên hệ đã xác nhận: *41 Lê Duẩn, Quận Hải Châu, TP. Đà Nẵng · Email: hoisinhvien@udn.vn*.


---

## 2. CẤU TRÚC COMPONENT

```
PublicLandingPage
│
├── InstitutionalHeader (Section 1)
│   ├── HsvEmblem (Huy hiệu Hội Sinh viên Việt Nam)
│   ├── UDN Brand Masthead ("ĐẠI HỌC ĐÀ NẴNG · HỘI SINH VIÊN VIỆT NAM ĐẠI HỌC ĐÀ NẴNG")
│   ├── Desktop Nav Links (Danh hiệu, Quy trình, Đơn vị, Thông báo, Quy chế)
│   ├── Quick Actions (Cổng Tập thể, Đăng nhập, Kê khai hồ sơ)
│   └── Mobile Navigation Drawer (Full-width accessible slide-over)
│
├── main
│   ├── PublicHero (Section 2)
│   │   ├── Academic Year Badge ("Năm học 2026–2027")
│   │   ├── Eyebrow ("HỘI SINH VIÊN VIỆT NAM ĐẠI HỌC ĐÀ NẴNG")
│   │   ├── Headline 3 nhịp ("Ghi nhận nỗ lực. Tôn vinh thành tích. Lan tỏa giá trị sinh viên.")
│   │   ├── Subheading & Primary Action Buttons
│   │   └── Authentic 3-Medallion Institutional Visual (SV5T, Tập thể SV5T, Cánh chim trắng)
│   │
│   ├── AwardCategoriesSection (Section 3)
│   │   ├── Card A: Danh hiệu Sinh viên 5 tốt (05 Tiêu chuẩn: Đạo đức, Học tập, Thể lực, Tình nguyện, Hội nhập)
│   │   ├── Card B: Danh hiệu Tập thể Sinh viên 5 tốt (Cấp cơ sở, Phong trào, Tỷ lệ đạt chuẩn, Kỷ luật)
│   │   └── Card C: Giải thưởng Cánh chim trắng (Cánh chim ươm mầm, Cánh chim truyền lửa, Cánh chim sáng tạo)
│   │
│   ├── AwardProcessSection (Section 4)
│   │   ├── Timeline 05 bước (Chuẩn bị -> Kê khai/Đề cử -> Trường tổng hợp -> ĐHĐN thẩm định -> Công bố)
│   │   └── Bảng ghi chú quy trình đặc thù theo từng hạng mục
│   │
│   ├── ParticipatingInstitutionsSection (Section 5)
│   │   ├── Grid 9 đơn vị thành viên ĐHĐN (DUT, DUE, UED, UFL, UTE, VKU, SMP, VNUK, KONTUM)
│   │   └── Thông báo xác thực tài khoản sinh viên chính khóa
│   │
│   ├── PublicAnnouncementsSection (Section 6)
│   │   ├── Segmented Filter Tabs (Tất cả, Sinh viên 5 tốt, Tập thể SV5T, Cánh chim trắng)
│   │   ├── Search bar tìm kiếm văn bản nhanh
│   │   ├── Danh sách thông báo & kế hoạch chính thức
│   │   └── Document Viewer Modal (Đọc toàn văn văn bản trực tiếp)
│   │
│   └── LandingCallToAction (Section 7)
│       ├── Khối kêu gọi hành động hợp nhất
│       └── Nút điều hướng phân quyền (Đăng nhập hệ thống, Kê khai cá nhân, Cổng Tập thể)
│
├── PublicFooter (Section 8)
│   ├── Thông tin liên hệ cơ quan tổ chức (41 Lê Duẩn, hoisinhvien@udn.vn, tuoitredhdn.udn.vn)
│   ├── Hệ thống liên kết danh hiệu và quy trình
│   └── Bản quyền thuộc Đại học Đà Nẵng
│
└── OfficialGuidanceModal
    ├── Tab 1: 05 Tiêu chuẩn Sinh viên 5 tốt (Bắt buộc & Bổ trợ)
    ├── Tab 2: Tiêu chuẩn Tập thể Sinh viên 5 tốt
    ├── Tab 3: Quy chế Giải thưởng Cánh chim trắng (QĐ 1720/QĐ-HSV)
    └── Tab 4: Quy trình & Tiêu chuẩn minh chứng hợp lệ
```

---

## 3. CẤU TRÚC COMPONENT HIỆN TẠI (MINIMAL SINGLE-PAGE ARCHITECTURE)

```
PublicLandingPage
│
├── InstitutionalHeader (Khu vực A)
│   ├── HsvEmblem (Huy hiệu chuẩn Hội Sinh viên Việt Nam)
│   ├── Tên đơn vị ("ĐẠI HỌC ĐÀ NẴNG · HỘI SINH VIÊN VIỆT NAM ĐẠI HỌC ĐÀ NẴNG")
│   └── Nút chính duy nhất [Đăng nhập] -> onNavigateToLogin
│
├── main
│   ├── PublicHero (Khu vực B)
│   │   ├── Ảnh nền campus 41 Lê Duẩn (/assets/udn/udn_campus_hero.jpg)
│   │   ├── Lớp phủ Scrim Gradient tương phản cao
│   │   ├── Dòng phụ: "Đại học Đà Nẵng"
│   │   ├── Tiêu đề: "Cổng xét chọn danh hiệu và giải thưởng sinh viên"
│   │   └── Mô tả ngắn gọn (3 dòng)
│   │
│   └── AwardCategoriesSection (Khu vực C)
│       ├── Heading đơn giản: "Danh hiệu và giải thưởng"
│       └── 03 Card đồng kích thước (ngang hàng trên desktop, xếp dọc trên mobile):
│           ├── 01 — Sinh viên 5 tốt (icon Award)
│           ├── 02 — Tập thể Sinh viên 5 tốt (icon Users)
│           └── 03 — Giải thưởng Cánh chim trắng (icon Feather)
│
└── PublicFooter (Khu vực D)
    ├── Tên đơn vị: "Hội Sinh viên Việt Nam Đại học Đà Nẵng"
    ├── Tên cổng: "Cổng xét chọn danh hiệu và giải thưởng sinh viên"
    └── Thông tin liên hệ chính thức: 41 Lê Duẩn, Hải Châu, TP. Đà Nẵng · Email: hoisinhvien@udn.vn
```

---

## 4. BẢNG ĐỐI CHIẾU 4 KHU VỰC CHÍNH

| Khu vực | Component | Nội dung hiển thị & Tương tác |
| :--- | :--- | :--- |
| **A. Header** | `InstitutionalHeader` | Nền trắng, cao 66–72px. Logo HSV VN + Tên "HỘI SINH VIÊN VIỆT NAM ĐẠI HỌC ĐÀ NẴNG". Bên phải có duy nhất 01 nút "Đăng nhập" (kết nối auth hiện tại). |
| **B. Hero** | `PublicHero` | Chiều cao 360–400px. Ảnh nền campus Đại học Đà Nẵng tại 41 Lê Duẩn (`/assets/udn/udn_campus_hero.jpg`), overlay gradient tương phản cao. Dòng phụ: "Đại học Đà Nẵng", Tiêu đề: "Cổng xét chọn danh hiệu và giải thưởng sinh viên", Mô tả ngắn (3 dòng). Không câu khẩu hiệu, không số liệu ảo. |
| **C. Ba hạng mục** | `AwardCategoriesSection` | Heading: "Danh hiệu và giải thưởng". 3 card trắng đồng kích thước, viền `#E2EBF0`, bo góc 11px: **01 — Sinh viên 5 tốt**, **02 — Tập thể Sinh viên 5 tốt**, **03 — Giải thưởng Cánh chim trắng**. Không màu nền sặc sỡ, không hiệu ứng hover phóng to. |
| **D. Footer** | `PublicFooter` | Tên đơn vị: "Hội Sinh viên Việt Nam Đại học Đà Nẵng", Dòng phụ: "Cổng xét chọn danh hiệu và giải thưởng sinh viên", Địa chỉ: 41 Lê Duẩn, Hải Châu, TP. Đà Nẵng, Email: hoisinhvien@udn.vn. |

---

## 5. DANH SÁCH ROUTE VÀ CTA

| Tên nút / Liên kết | Vị trí xuất hiện | Hành động thực tế | Trạng thái kỹ thuật |
| :--- | :--- | :--- | :--- |
| **Đăng nhập** / **Vào hệ thống** | Header (`InstitutionalHeader`) | Chuyển tới trang đăng nhập xác thực (`publicRoute = 'login'`) hoặc vào trang chủ sinh viên nếu đã xác thực | Hoạt động 100% |

---

## 6. PHẠM VI HOẠT ĐỘNG VÀ CÁC TÍNH NĂNG CHƯA CÓ BACKEND

### Đã hoạt động hoàn chỉnh ở Frontend:
- Toàn bộ giao diện Landing Page công khai chuẩn ĐHĐN.
- Tích hợp liền mạch với hệ thống Authentication hiện tại (sinh viên, tập thể, cán bộ trường, cán bộ ĐHĐN).
- Modal tra cứu tiêu chuẩn 5 tiêu chí SV5T cá nhân, tiêu chí Tập thể và quy chế Giải thưởng Cánh chim trắng.
- Bộ lọc và tìm kiếm văn bản thông báo.
- Luồng kê khai Sinh viên 5 tốt cá nhân và Cổng đề nghị Tập thể SV5T.

### Giới hạn an toàn nghiệp vụ (Business Safety Boundaries):
- **Giải thưởng Cánh chim trắng:** Hiện chưa có cơ sở dữ liệu riêng hay backend API nhận bài nộp trực tuyến cho Cánh chim trắng. Theo đúng yêu cầu an toàn, hệ thống cung cấp đầy đủ thông tin giới thiệu, các hạng mục con, hướng dẫn đề cử và liên kết quy chế chính thức, tuyệt đối KHÔNG giả lập một luồng nộp bài không tồn tại.
- **Tiêu chuẩn cấp Trường/ĐHĐN:** Tỷ lệ công nhận tập thể được giữ linh hoạt theo hướng dẫn từng mùa xét, không áp đặt ngưỡng cứng của cấp Thành phố.

---

## 7. KẾT QUẢ KIỂM THỬ (TEST RESULTS)

- **TypeScript compilation (`lint_applet` / `tsc --noEmit`):**
  - Trạng thái: **PASSED (0 errors, 0 warnings)**.
- **Applet Compilation (`compile_applet`):**
  - Trạng thái: **PASSED**.
- **Production Build (`npm run build`):**
  - Vite client bundle: **PASSED** (1991 modules transformed).
  - Server bundle (`dist/server.js`): **PASSED** (368.6 kB).
- **Test Suite (`npm test`):**
  - Số lượng suites: **58/58 suites PASSED**
  - Số lượng test cases: **448/448 tests PASSED (0 failures, 0 skipped)**.

---

## 8. KẾT QUẢ KIỂM THỬ RESPONSIVE

Đã kiểm tra kỹ lưỡng các breakpoint màn hình tiêu chuẩn:
1. **320px – 360px (Small Mobile):** Bố cục 1 cột gọn gàng, headline co dãn cân đối, menu drawer kích hoạt trơn tru, không có hiện tượng vỡ khung hay tràn ngang (`overflow-x-clip`).
2. **390px – 430px (Modern Mobile: iPhone 14/15/16, Galaxy S):** Touch target $\ge 44$px, nút bấm dễ thao tác, khoảng cách hợp lý.
3. **768px – 1024px (Tablet & iPad):** Bố cục 2 cột cho các thẻ danh hiệu và quy trình, timeline hiển thị rõ nét.
4. **1280px – 1440px (Desktop Tiêu chuẩn):** Khung hiển thị tối đa 1280px căn giữa hoàn hảo, Hero 2 cột cân xứng, 3 thẻ danh hiệu ngang hàng đẹp mắt.
5. **1660px – 1920px (Ultra-wide Monitors):** Nội dung cố định trong container 1280px, dải màu gradient phân bổ êm dịu, không bị loãng.

---

## 9. ĐỀ XUẤT CÁC BƯỚC TIẾP THEO CHO DỰ ÁN

1. **Thiết kế Backend cho Cánh chim trắng:** Khi có chủ trương số hóa toàn bộ khâu nộp hồ sơ Cánh chim trắng trực tuyến, xây dựng schema riêng biệt bao gồm các trường: loại đề cử (Ươm mầm / Truyền lửa / Sáng tạo), đơn vị đề cử, hồ sơ sáng kiến, đề tài NCKH và tài liệu xác nhận.
2. **Cấu hình mùa xét chuyên biệt:** Thiết lập cơ chế cấu hình thời hạn nhận hồ sơ độc lập giữa các trường thành viên và cấp Đại học Đà Nẵng.
3. **Phê duyệt hình ảnh tư liệu:** Khi Ban Thư ký Hội Sinh viên Đại học Đà Nẵng cung cấp bộ ảnh tư liệu lễ tuyên dương chính thức, thay thế các visual vector hiện tại bằng hình ảnh thực tế đã được cấp phép.
