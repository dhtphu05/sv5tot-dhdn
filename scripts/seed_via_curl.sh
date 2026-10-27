#!/usr/bin/env bash
# ==============================================================================
# 5TOT Đà Nẵng — Real Production-Like Seeding via Pure cURL HTTP Requests
# Cơ quan quản lý: Thành Đoàn Đà Nẵng
# Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Thành phố Đà Nẵng
#
# Executes real HTTP cURL requests against http://127.0.0.1:3001 to:
# 1. Wipe all demo/sample fixtures (/api/v2/portal/admin/reset-empty).
# 2. Authenticate 18 real students across all 14 universities & colleges.
# 3. Update 13-field student profiles via PUT /api/v2/auth/profile.
# 4. Create individual applications via POST /api/v2/portal/individual/applications.
# 5. Upload real PDF & JPG evidence files from public/minhchung_test/ via
#    POST /api/v2/portal/evidence/upload + R2 3-step pipeline (/api/v2/evidence/*).
# 6. Declare all 5 criteria (Đạo đức, Học tập, Thể lực, Tình nguyện, Hội nhập)
#    via PUT /api/v2/portal/individual/applications/:id/declarations.
# 7. Submit applications to School Review Units via POST .../submit.
# 8. Login as 7 School Officers, evaluate criteria, complete preliminary review,
#    and forward 8 applications to City level while keeping 10 at School level.
# 9. Login as City Manager (ha.nt@hsvdanang.vn) and assign 6 City applications
#    to City Officers (nam.th, chau.vtm, huy.dq, tung.pt).
# 10. Login as 3 Collective Preparers, create Collective applications, upload
#     real PDFs, declare TT01-TT04, submit to City, and assign to City Officer.
# ==============================================================================

set -euo pipefail

BASE_URL="${API_BASE_URL:-http://127.0.0.1:3001}"
EVIDENCE_DIR="$(cd "$(dirname "$0")/../public/minhchung_test" && pwd)"

echo "======================================================================"
echo "🚀 Bắt đầu quy trình Seed dữ liệu thật 100% qua cURL -> ${BASE_URL}"
echo "📂 Thư mục minh chứng thật: ${EVIDENCE_DIR}"
echo "======================================================================"

# Helper to extract JSON field via node
json_get() {
  local json="$1"
  local path="$2"
  node -e "
    try {
      const obj = JSON.parse(process.argv[1]);
      const val = '${path}'.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : ''), obj);
      process.stdout.write(String(val || ''));
    } catch {
      process.stdout.write('');
    }
  " "$json"
}

EXISTING_IND_COUNT=$(json_get "$(curl -sS "${BASE_URL}/api/v2/portal/individual/applications")" "count")

if [[ "${1:-}" == "--full" || "${EXISTING_IND_COUNT}" != "18" ]]; then
  # 1. Reset all demo/sample data
  echo "🧹 [Bước 1/7] Xóa sạch dữ liệu mẫu qua POST /api/v2/portal/admin/reset-empty..."
  RESET_RES=$(curl -sS -X POST "${BASE_URL}/api/v2/portal/admin/reset-empty" -H "Content-Type: application/json")
  echo "   -> ${RESET_RES}"
else
  echo "⚡ [Bước 1-2/7] Đã có sẵn 18 hồ sơ sinh viên thật từ cURL trước đó (dùng --full để tạo lại từ đầu)."
fi

# Helper to upload a real file from public/minhchung_test via cURL
upload_portal_evidence() {
  local token="$1"
  local track="$2"
  local app_id="$3"
  local crit_id="$4"
  local filename="$5"
  local filepath="${EVIDENCE_DIR}/${filename}"
  local filesize
  filesize=$(wc -c < "$filepath" | tr -d ' ')
  local ext="${filename##*.}"
  local b64
  b64=$(head -c 2048 "$filepath" | base64 | tr -d '\n')

  local payload
  payload=$(node -e "
    process.stdout.write(JSON.stringify({
      ownerTrack: process.argv[1],
      applicationId: process.argv[2],
      requirementOrCriterionId: process.argv[3],
      fileName: process.argv[4],
      fileType: process.argv[5],
      fileSizeBytes: Number(process.argv[6]),
      fileUrl: '/minhchung_test/' + encodeURIComponent(process.argv[4]),
      base64Content: process.argv[7]
    }));
  " "$track" "$app_id" "$crit_id" "$filename" "$ext" "$filesize" "$b64")

  local res
  res=$(curl -sS -X POST "${BASE_URL}/api/v2/portal/evidence/upload" \
    -H "Authorization: Bearer ${token}" \
    -H "Content-Type: application/json" \
    -d "$payload")

  json_get "$res" "data.id"
}

# Helper to declare a criterion requirement with real uploaded evidence via cURL
save_student_declaration() {
  local token="$1"
  local app_id="$2"
  local crit_id="$3"
  local req_id="$4"
  local title="$5"
  local desc="$6"
  local authority="$7"
  local ev_id="$8"
  local filename="$9"
  local filepath="${EVIDENCE_DIR}/${filename}"
  local filesize
  filesize=$(wc -c < "$filepath" | tr -d ' ')
  local size_kb=$(( (filesize + 1023) / 1024 ))
  local ext="${filename##*.}"

  local payload
  payload=$(node -e "
    const kb = Number(process.argv[10]);
    const sizeStr = kb >= 1024 ? (kb / 1024).toFixed(1) + ' MB' : kb + ' KB';
    process.stdout.write(JSON.stringify({
      criterionId: process.argv[1],
      requirementId: process.argv[2],
      declaration: {
        id: 'decl-' + process.argv[2] + '-' + process.argv[3],
        title: process.argv[4],
        description: process.argv[5],
        date: '10/10/2026',
        authority: process.argv[6],
        evidenceFiles: [
          {
            id: process.argv[7],
            name: process.argv[8],
            fileType: process.argv[9],
            size: sizeStr,
            uploadedAt: '11/10/2026',
            status: 'achieved',
            url: '/minhchung_test/' + encodeURIComponent(process.argv[8]),
            criterionId: process.argv[1],
            requirementId: process.argv[2]
          }
        ]
      }
    }));
  " "$crit_id" "$req_id" "$app_id" "$title" "$desc" "$authority" "$ev_id" "$filename" "$ext" "$size_kb")

  curl -sS -X PUT "${BASE_URL}/api/v2/portal/individual/applications/${app_id}/declarations" \
    -H "Authorization: Bearer ${token}" \
    -H "Content-Type: application/json" \
    -d "$payload" > /dev/null
}

# 2. Seed 18 real students across all 14 universities via cURL
if [[ "${1:-}" == "--full" || "${EXISTING_IND_COUNT}" != "18" ]]; then
echo "👨‍🎓 [Bước 2/7] Đăng nhập, cập nhật hồ sơ cá nhân, tải minh chứng PDF/JPG thật & nộp 18 hồ sơ sinh viên qua cURL..."

STUDENTS=(
  "minhquan.tran@dut.udn.vn|Trần Minh Quân|102220019|inst-dut|Trường Đại học Bách khoa – ĐHĐN|Khoa Công nghệ Thông tin|22TCLC_DT3|Nam|14/03/2004|Ủy viên BCH Chi đoàn|0905112233|518_quyet_dinh_giay_khen_bk_smartcampus.pdf|307_ke_hoach_bk_smartcampus.pdf|IMG_1711.jpg|IMG_9541.jpg|doan_hoang_thien_phu.pdf"
  "khanhlinh.le@dut.udn.vn|Lê Nguyễn Khánh Linh|102220084|inst-dut|Trường Đại học Bách khoa – ĐHĐN|Khoa Điện tử – Viễn thông|22DT2|Nữ|22/08/2004|Bí thư Chi đoàn|0905223344|518_quyet_dinh_giay_khen_bk_smartcampus.pdf|mistalent_phu.pdf|IMG_1720.jpg|IMG_9546.jpg|vannghe_phu.pdf"
  "quocbao.pham@due.udn.vn|Phạm Quốc Bảo|221121004512|inst-due|Trường Đại học Kinh tế – ĐHĐN|Khoa Tài chính – Ngân hàng|48K06.1|Nam|05/11/2004|Chi hội trưởng|0905334455|doan_hoang_thien_phu.pdf|mistalent_phu.pdf|IMG_1721.jpg|IMG_9549.jpg|518_quyet_dinh_giay_khen_bk_smartcampus.pdf"
  "baotram.hoang@due.udn.vn|Hoàng Lê Bảo Trâm|221121008901|inst-due|Trường Đại học Kinh tế – ĐHĐN|Khoa Quản trị Kinh doanh|48K01.2|Nữ|19/01/2004|Ủy viên BCH Liên chi đoàn|0905445566|vannghe_phu.pdf|307_ke_hoach_bk_smartcampus.pdf|IMG_9553.jpg|IMG_1711.jpg|doan_hoang_thien_phu.pdf"
  "thanhdat.vo@ued.udn.vn|Võ Thành Đạt|314220118|inst-ued|Trường Đại học Sư phạm – ĐHĐN|Khoa Toán – Tin|22SPT1|Nam|12/07/2004|Phó Bí thư Chi đoàn|0905556677|518_quyet_dinh_giay_khen_bk_smartcampus.pdf|mistalent_phu.pdf|IMG_1720.jpg|IMG_9541.jpg|307_ke_hoach_bk_smartcampus.pdf"
  "ngocanh.dang@ufl.udn.vn|Đặng Thị Ngọc Ánh|411220056|inst-ufl|Trường Đại học Ngoại ngữ – ĐHĐN|Khoa Tiếng Anh|22CNA03|Nữ|28/04/2004|Ủy viên BCH Hội Sinh viên|0905667788|doan_hoang_thien_phu.pdf|vannghe_phu.pdf|IMG_1721.jpg|IMG_9546.jpg|mistalent_phu.pdf"
  "hoangnam.bui@ute.udn.vn|Bùi Hoàng Nam|22115053120109|inst-ute|Trường Đại học Sư phạm Kỹ thuật – ĐHĐN|Khoa Cơ khí|22CK1|Nam|09/09/2004|Đoàn viên ưu tú|0905778899|307_ke_hoach_bk_smartcampus.pdf|518_quyet_dinh_giay_khen_bk_smartcampus.pdf|IMG_9549.jpg|IMG_9553.jpg|doan_hoang_thien_phu.pdf"
  "anhkhoa.truong@vku.udn.vn|Trương Anh Khoa|22IT094|inst-vku|Trường Đại học Công nghệ Thông tin và Truyền thông Việt – Hàn|Khoa Khoa học Máy tính|22JIT|Nam|17/06/2004|Chủ nhiệm CLB Học thuật|0905889900|518_quyet_dinh_giay_khen_bk_smartcampus.pdf|307_ke_hoach_bk_smartcampus.pdf|IMG_1711.jpg|IMG_1720.jpg|mistalent_phu.pdf"
  "phuongthao.ngo@vku.udn.vn|Ngô Thị Phương Thảo|22BA031|inst-vku|Trường Đại học Công nghệ Thông tin và Truyền thông Việt – Hàn|Khoa Kinh tế số & Thương mại điện tử|22EBA|Nữ|03/12/2004|Bí thư Chi đoàn|0905990011|doan_hoang_thien_phu.pdf|vannghe_phu.pdf|IMG_1721.jpg|IMG_9541.jpg|518_quyet_dinh_giay_khen_bk_smartcampus.pdf"
  "minhchau.do@smp.udn.vn|Đỗ Ngọc Minh Châu|22YD042|inst-smp|Trường Y Dược – ĐHĐN|Khoa Y|YK22A|Nữ|25/02/2004|Ủy viên BCH Chi hội|0905101112|doan_hoang_thien_phu.pdf|mistalent_phu.pdf|IMG_9546.jpg|IMG_9549.jpg|307_ke_hoach_bk_smartcampus.pdf"
  "giahan.ly@vnuk.udn.vn|Lý Gia Hân|22010018|inst-vnuk|Viện Nghiên cứu và Đào tạo Việt – Anh – ĐHĐN|Khoa Khoa học & Kỹ thuật máy tính|22CSE|Nữ|11/10/2004|Đại sứ Sinh viên VNUK|0905121314|518_quyet_dinh_giay_khen_bk_smartcampus.pdf|vannghe_phu.pdf|IMG_9553.jpg|IMG_1711.jpg|mistalent_phu.pdf"
  "quanghuy.phan@duytan.edu.vn|Phan Quang Huy|27211204912|inst-dtu|Đại học Duy Tân|Trường Khoa học Máy tính|K27-TPM1|Nam|08/05/2004|Bí thư Liên chi đoàn|0905141516|518_quyet_dinh_giay_khen_bk_smartcampus.pdf|307_ke_hoach_bk_smartcampus.pdf|IMG_1720.jpg|IMG_1721.jpg|doan_hoang_thien_phu.pdf"
  "thuyduong.nguyen@duytan.edu.vn|Nguyễn Lê Thùy Dương|27212408831|inst-dtu|Đại học Duy Tân|Trường Kinh tế|K27-QTDN2|Nữ|30/07/2004|Chi hội trưởng|0905161718|mistalent_phu.pdf|vannghe_phu.pdf|IMG_9541.jpg|IMG_9546.jpg|doan_hoang_thien_phu.pdf"
  "huuphuoc.trinh@donga.edu.vn|Trịnh Hữu Phước|22DA05112|inst-donga|Trường Đại học Đông Á|Khoa Công nghệ Thông tin|IT22A1|Nam|16/09/2004|Ủy viên BCH Đoàn trường|0905181920|307_ke_hoach_bk_smartcampus.pdf|518_quyet_dinh_giay_khen_bk_smartcampus.pdf|IMG_9549.jpg|IMG_9553.jpg|vannghe_phu.pdf"
  "camtu.huynh@dhktdn.edu.vn|Huỳnh Ngọc Cẩm Tú|22KTR019|inst-dau|Trường Đại học Kiến trúc Đà Nẵng|Khoa Kiến trúc|22KT1|Nữ|21/03/2004|Bí thư Chi đoàn|0905202122|doan_hoang_thien_phu.pdf|mistalent_phu.pdf|IMG_1711.jpg|IMG_1720.jpg|307_ke_hoach_bk_smartcampus.pdf"
  "tuankiet.dinh@upes3.edu.vn|Đinh Tuấn Kiệt|22TDTT088|inst-upes3|Trường Đại học Thể dục Thể thao Đà Nẵng|Khoa Huấn luyện Thể thao|HL22B|Nam|02/11/2004|Đội trưởng Đội Thanh niên xung kích|0905222324|vannghe_phu.pdf|518_quyet_dinh_giay_khen_bk_smartcampus.pdf|IMG_1721.jpg|IMG_9541.jpg|mistalent_phu.pdf"
  "myduyen.cao@dhktyduocdn.edu.vn|Cao Thị Mỹ Duyên|22DD0145|inst-tyd|Trường Đại học Kỹ thuật Y - Dược Đà Nẵng|Khoa Điều dưỡng|DD22A|Nữ|14/06/2005|Chi hội trưởng|0905242526|doan_hoang_thien_phu.pdf|vannghe_phu.pdf|IMG_9546.jpg|IMG_9549.jpg|518_quyet_dinh_giay_khen_bk_smartcampus.pdf"
  "ducthinh.mai@fpt.edu.vn|Mai Đức Thịnh|22FPT067|inst-fpt|Trường Đại học FPT phân hiệu Đà Nẵng|Khoa Kỹ thuật Phần mềm|SE18B02|Nam|27/08/2004|Bí thư Chi đoàn|0905262728|307_ke_hoach_bk_smartcampus.pdf|mistalent_phu.pdf|IMG_9553.jpg|IMG_1711.jpg|doan_hoang_thien_phu.pdf"
)

COUNT=0
for ENTRY in "${STUDENTS[@]}"; do
  COUNT=$((COUNT + 1))
  IFS='|' read -r EMAIL FULLNAME SCODE INST_ID INST_NAME FACULTY CLASS GENDER DOB UNION_POS PHONE F_ACAD F_INT F_VOL F_PHYS F_EXTRA <<< "$ENTRY"
  EMAIL=$(echo "$EMAIL" | xargs)

  # 2a. Register student account via POST /api/v2/portal/auth/register (or login if already exists)
  REG_PAYLOAD=$(node -e "
    process.stdout.write(JSON.stringify({
      fullName: process.argv[1],
      email: process.argv[2],
      studentCode: process.argv[3],
      institutionId: process.argv[4],
      institutionName: process.argv[5],
      password: '123456'
    }));
  " "$FULLNAME" "$EMAIL" "$SCODE" "$INST_ID" "$INST_NAME")

  REG_RES=$(curl -sS -X POST "${BASE_URL}/api/v2/portal/auth/register" \
    -H "Content-Type: application/json" \
    -d "$REG_PAYLOAD")
  TOKEN=$(json_get "$REG_RES" "data.token")
  if [[ -z "$TOKEN" ]]; then
    LOGIN_RES=$(curl -sS -X POST "${BASE_URL}/api/v2/portal/auth/login" \
      -H "Content-Type: application/json" \
      -d "{\"email\":\"${EMAIL}\",\"preferredTrack\":\"INDIVIDUAL\"}")
    TOKEN=$(json_get "$LOGIN_RES" "data.token")
  fi

  # 2b. Update 13 profile fields via PUT /api/v2/auth/profile
  PROFILE_PAYLOAD=$(node -e "
    process.stdout.write(JSON.stringify({
      fullName: process.argv[1],
      gender: process.argv[2],
      dateOfBirth: process.argv[3],
      ethnicity: 'Kinh',
      academicYearNumber: 3,
      educationLevel: process.argv[4].includes('Cao đẳng') ? 'Cao đẳng' : 'Đại học',
      className: process.argv[5],
      homeProvince: 'Thành phố Đà Nẵng',
      institutionId: process.argv[6],
      institutionName: process.argv[4],
      unionPosition: process.argv[7],
      politicalStatus: 'Đoàn viên',
      phoneNumber: process.argv[8],
      email: process.argv[9]
    }));
  " "$FULLNAME" "$GENDER" "$DOB" "$INST_NAME" "$CLASS" "$INST_ID" "$UNION_POS" "$PHONE" "$EMAIL")

  curl -sS -X PUT "${BASE_URL}/api/v2/auth/profile" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d "$PROFILE_PAYLOAD" > /dev/null

  # 2c. Create Individual Application via POST /api/v2/portal/individual/applications
  CREATE_PAYLOAD=$(node -e "
    const prof = JSON.parse(process.argv[1]);
    process.stdout.write(JSON.stringify({
      studentFullName: prof.fullName,
      studentCode: process.argv[2],
      email: prof.email,
      institutionId: prof.institutionId,
      institutionName: prof.institutionName,
      faculty: process.argv[3],
      className: prof.className,
      gender: prof.gender,
      dateOfBirth: prof.dateOfBirth,
      ethnicity: prof.ethnicity,
      academicYearNumber: prof.academicYearNumber,
      educationLevel: prof.educationLevel,
      homeProvince: prof.homeProvince,
      unionPosition: prof.unionPosition,
      politicalStatus: prof.politicalStatus,
      phoneNumber: prof.phoneNumber,
      applicantProfileSnapshot: prof
    }));
  " "$PROFILE_PAYLOAD" "$SCODE" "$FACULTY")

  CREATE_RES=$(curl -sS -X POST "${BASE_URL}/api/v2/portal/individual/applications" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d "$CREATE_PAYLOAD")
  APP_ID=$(json_get "$CREATE_RES" "data.applicationId")

  # 2d. Upload real PDFs and JPGs from public/minhchung_test via cURL
  EV_ETHICS=$(upload_portal_evidence "$TOKEN" "INDIVIDUAL" "$APP_ID" "ethics" "518_quyet_dinh_giay_khen_bk_smartcampus.pdf")
  EV_ACAD=$(upload_portal_evidence "$TOKEN" "INDIVIDUAL" "$APP_ID" "academic" "$F_ACAD")
  EV_NCKH=$(upload_portal_evidence "$TOKEN" "INDIVIDUAL" "$APP_ID" "academic" "$F_EXTRA")
  EV_PHYS=$(upload_portal_evidence "$TOKEN" "INDIVIDUAL" "$APP_ID" "physical" "$F_PHYS")
  EV_VOL=$(upload_portal_evidence "$TOKEN" "INDIVIDUAL" "$APP_ID" "volunteer" "$F_VOL")
  EV_INT=$(upload_portal_evidence "$TOKEN" "INDIVIDUAL" "$APP_ID" "integration" "$F_INT")

  # 2e. Save declarations for all 5 criteria via PUT /api/v2/portal/individual/applications/:id/declarations
  save_student_declaration "$TOKEN" "$APP_ID" "ethics" "ethics-1" \
    "Điểm rèn luyện năm học 2025–2026 đạt 93/100 điểm (Xếp loại Xuất sắc)" \
    "Chấp hành nghiêm quy chế đào tạo, tích cực tham gia sinh hoạt công dân và học tập chính trị." \
    "Phòng Công tác Sinh viên – ${INST_NAME}" "$EV_ETHICS" "518_quyet_dinh_giay_khen_bk_smartcampus.pdf"

  save_student_declaration "$TOKEN" "$APP_ID" "academic" "academic-gpa" \
    "Điểm trung bình chung học tập năm học 2025–2026 đạt 3.68/4.0 (Loại Giỏi)" \
    "Hoàn thành xuất sắc chương trình đào tạo chính khóa tại ${FACULTY}." \
    "Phòng Đào tạo – ${INST_NAME}" "$EV_ACAD" "$F_ACAD"

  save_student_declaration "$TOKEN" "$APP_ID" "academic" "academic-1" \
    "Đạt giải Cuộc thi Chuyển đổi số & Nghiên cứu khoa học sinh viên năm học 2025–2026" \
    "Tham gia nhóm nghiên cứu khoa học sinh viên tại ${FACULTY} và công bố kết quả." \
    "Hội đồng Khoa học & Đào tạo – ${INST_NAME}" "$EV_NCKH" "$F_EXTRA"

  save_student_declaration "$TOKEN" "$APP_ID" "physical" "physical-1" \
    "Đạt danh hiệu Sinh viên khỏe / Hoàn thành Giải chạy bộ Sinh viên Đà Nẵng 2026" \
    "Đạt chuẩn rèn luyện thể lực theo quy định của Hội Sinh viên Việt Nam." \
    "Hội Sinh viên ${INST_NAME}" "$EV_PHYS" "$F_PHYS"

  save_student_declaration "$TOKEN" "$APP_ID" "volunteer" "volunteer-1" \
    "Tham gia Chiến dịch Tình nguyện hè / Ngày hội Hiến máu tình nguyện năm 2026 (07 ngày)" \
    "Đóng góp tích cực cho hoạt động tình nguyện vì cộng đồng tại TP. Đà Nẵng." \
    "Ban Thường vụ Đoàn – Hội Sinh viên ${INST_NAME}" "$EV_VOL" "$F_VOL"

  save_student_declaration "$TOKEN" "$APP_ID" "integration" "integration-lang" \
    "Chứng chỉ Ngoại ngữ & Hoạt động Hội nhập sinh viên cấp Trường/Thành phố" \
    "Đáp ứng tiêu chuẩn ngoại ngữ và kỹ năng hội nhập quốc tế cấp Thành phố." \
    "Ban Tổ chức & Hội Sinh viên ${INST_NAME}" "$EV_INT" "$F_INT"

  # 2f. Submit application to School Review Unit via POST /api/v2/portal/individual/applications/:id/submit
  curl -sS -X POST "${BASE_URL}/api/v2/portal/individual/applications/${APP_ID}/submit" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" > /dev/null

  echo "   ✅ [${COUNT}/18] Đã đăng ký, tải 6 file minh chứng thật & nộp hồ sơ ${APP_ID} (${FULLNAME} - ${INST_NAME})"
done
fi

# 3. Also test 3-step Cloudflare R2 upload pipeline via cURL for verification
echo "☁️  [Bước 3/7] Kiểm tra upload nhị phân 3 bước lên Cloudflare R2 (/api/v2/evidence/upload-intent -> PUT -> finalize)..."
STU_LOGIN=$(curl -sS -X POST "${BASE_URL}/api/v2/portal/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"minhquan.tran@dut.udn.vn","preferredTrack":"INDIVIDUAL"}')
STU_TOKEN=$(json_get "$STU_LOGIN" "data.token")
PDF_FILE="${EVIDENCE_DIR}/518_quyet_dinh_giay_khen_bk_smartcampus.pdf"
PDF_SIZE=$(wc -c < "$PDF_FILE" | tr -d ' ')
PDF_SHA=$(shasum -a 256 "$PDF_FILE" | awk '{print $1}')

INTENT_RES=$(curl -sS -X POST "${BASE_URL}/api/v2/evidence/upload-intent" \
  -H "Authorization: Bearer ${STU_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"track\":\"INDIVIDUAL\",
    \"applicationId\":\"APP-2026-DN-102220019\",
    \"criterionId\":\"academic\",
    \"requirementId\":\"academic-1\",
    \"fileName\":\"518_quyet_dinh_giay_khen_bk_smartcampus.pdf\",
    \"mimeType\":\"application/pdf\",
    \"sizeBytes\":${PDF_SIZE},
    \"sha256Checksum\":\"${PDF_SHA}\"
  }")
EV_OBJ_ID=$(json_get "$INTENT_RES" "data.evidenceObjectId")
UPLOAD_URL=$(json_get "$INTENT_RES" "data.uploadUrl")
if [[ -z "$UPLOAD_URL" ]]; then
  UPLOAD_URL=$(json_get "$INTENT_RES" "data.presignedPutUrl")
fi
if [[ -n "$UPLOAD_URL" ]]; then
  if [[ "$UPLOAD_URL" == /* ]]; then
    UPLOAD_URL="${BASE_URL}${UPLOAD_URL}"
  fi
  if curl -sS -X PUT "$UPLOAD_URL" -H "Content-Type: application/pdf" --data-binary @"$PDF_FILE" > /dev/null 2>&1; then
    FINAL_RES=$(curl -sS -X POST "${BASE_URL}/api/v2/evidence/finalize" \
      -H "Authorization: Bearer ${STU_TOKEN}" \
      -H "Content-Type: application/json" \
      -d "{\"evidenceObjectId\":\"${EV_OBJ_ID}\",\"sha256Checksum\":\"${PDF_SHA}\"}" || true)
    echo "   -> R2 Finalize: $(json_get "$FINAL_RES" "data.evidence.status") (objectId: ${EV_OBJ_ID})"
  else
    echo "   -> R2 Upload Intent thành công (objectId: ${EV_OBJ_ID})"
  fi
else
  echo "   -> R2 Upload Intent response: ${INTENT_RES}"
fi

# 4. School Officer preliminary review & forwarding via cURL (1 account per school)
echo "🏫 [Bước 4/7] Cán bộ xét cấp trường đăng nhập qua cURL, xét sơ tuyển & chuyển 8 hồ sơ tiêu biểu lên Thành phố..."

school_review_and_forward() {
  local officer_email="$1"
  local app_id="$2"
  local action_mode="$3" # "forward" | "recommend_only" | "under_review"

  local login_res
  login_res=$(curl -sS -X POST "${BASE_URL}/api/v2/portal/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"${officer_email}\",\"preferredTrack\":\"STAFF\"}")
  local token
  token=$(json_get "$login_res" "data.token")
  local officer_name
  officer_name=$(json_get "$login_res" "data.user.fullName")

  for crit in ethics academic physical volunteer integration; do
    curl -sS -X POST "${BASE_URL}/api/v2/portal/school-review/applications/${app_id}/criteria" \
      -H "Authorization: Bearer ${token}" \
      -H "Content-Type: application/json" \
      -d "{\"criterionId\":\"${crit}\",\"status\":\"reviewed\",\"note\":\"Đạt chuẩn tiêu chí ${crit} cấp Trường, minh chứng hợp lệ.\"}" > /dev/null
  done

  if [[ "$action_mode" == "recommend_only" || "$action_mode" == "forward" ]]; then
    curl -sS -X POST "${BASE_URL}/api/v2/portal/school-review/applications/${app_id}/complete" \
      -H "Authorization: Bearer ${token}" \
      -H "Content-Type: application/json" \
      -d '{"recommendation":"recommended","summaryNote":"Hội đồng sơ tuyển cấp Trường thống nhất đề nghị xét công nhận cấp Thành phố."}' > /dev/null
  fi

  if [[ "$action_mode" == "forward" ]]; then
    curl -sS -X POST "${BASE_URL}/api/v2/portal/school-review/applications/${app_id}/forward" \
      -H "Authorization: Bearer ${token}" \
      -H "Content-Type: application/json" > /dev/null
    echo "   -> [${officer_name} · ${officer_email}] Đã xét duyệt & chuyển hồ sơ ${app_id} lên cấp Thành phố"
  else
    echo "   -> [${officer_name} · ${officer_email}] Đã cập nhật trạng thái sơ tuyển (${action_mode}) tại cấp Trường cho ${app_id}"
  fi
}

# Forward 8 representative applications to City level; keep 10 at School level for School Officers to test
school_review_and_forward "canbo.udn@udn.vn" "APP-2026-DN-102220019" "forward"
school_review_and_forward "canbo.udn@udn.vn" "APP-2026-DN-221121004512" "forward"
school_review_and_forward "canbo.udn@udn.vn" "APP-2026-DN-314220118" "forward"
school_review_and_forward "canbo.udn@udn.vn" "APP-2026-DN-22IT094" "forward"
school_review_and_forward "canbo.udn@udn.vn" "APP-2026-DN-22YD042" "recommend_only"
school_review_and_forward "canbo.udn@udn.vn" "APP-2026-DN-102220084" "under_review"

school_review_and_forward "canbo.dtu@duytan.edu.vn" "APP-2026-DN-27211204912" "forward"
school_review_and_forward "canbo.dtu@duytan.edu.vn" "APP-2026-DN-27212408831" "recommend_only"

school_review_and_forward "canbo.donga@donga.edu.vn" "APP-2026-DN-22DA05112" "forward"
school_review_and_forward "canbo.dau@dau.edu.vn" "APP-2026-DN-22KTR019" "forward"
school_review_and_forward "canbo.fpt@fpt.edu.vn" "APP-2026-DN-22FPT067" "forward"

# 5. City Manager assigns forwarded applications to the single City Officer account via cURL
echo "🏛️  [Bước 5/7] Quản lý xét duyệt cấp Thành phố (quanly.thanhpho@hsvdanang.vn) phân công hồ sơ cho Cán bộ xét duyệt cấp Thành phố (canbo.thanhpho@hsvdanang.vn) qua cURL..."
MGR_LOGIN=$(curl -sS -X POST "${BASE_URL}/api/v2/portal/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"quanly.thanhpho@hsvdanang.vn","preferredTrack":"STAFF"}')
MGR_TOKEN=$(json_get "$MGR_LOGIN" "data.token")

assign_city_officer() {
  local app_id="$1"
  local officer_id="$2"
  local note="$3"
  curl -sS -X POST "${BASE_URL}/api/v2/portal/individual/applications/${app_id}/assign" \
    -H "Authorization: Bearer ${MGR_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{\"officerId\":\"${officer_id}\",\"reason\":\"${note}\"}" > /dev/null
  echo "   -> Đã phân công ${app_id} cho Cán bộ xét duyệt cấp Thành phố (${officer_id})"
}

assign_city_officer "APP-2026-DN-102220019" "staff-off-nam" "Phân công Cán bộ xét duyệt cấp Thành phố thẩm định hồ sơ ĐH Bách khoa."
assign_city_officer "APP-2026-DN-221121004512" "staff-off-nam" "Phân công Cán bộ xét duyệt cấp Thành phố thẩm định hồ sơ ĐH Kinh tế."
assign_city_officer "APP-2026-DN-314220118" "staff-off-nam" "Phân công Cán bộ xét duyệt cấp Thành phố thẩm định hồ sơ ĐH Sư phạm."
assign_city_officer "APP-2026-DN-22IT094" "staff-off-nam" "Phân công Cán bộ xét duyệt cấp Thành phố thẩm định hồ sơ ĐH CNTT&TT Việt - Hàn."
assign_city_officer "APP-2026-DN-27211204912" "staff-off-nam" "Phân công Cán bộ xét duyệt cấp Thành phố thẩm định hồ sơ ĐH Duy Tân."
assign_city_officer "APP-2026-DN-22DA05112" "staff-off-nam" "Phân công Cán bộ xét duyệt cấp Thành phố thẩm định hồ sơ ĐH Đông Á."
# Keep APP-2026-DN-22KTR019 and APP-2026-DN-22FPT067 unassigned at City level so City Manager can test assigning them live!

# 6. Seed 3 Collective Applications via cURL
echo "🤝 [Bước 6/7] Khởi tạo, tải minh chứng PDF thật & nộp 3 hồ sơ Tập thể Sinh viên 5 Tốt qua cURL..."

seed_collective_via_curl() {
  local prep_email="$1"
  local col_name="$2"
  local col_type="$3"
  local inst_id="$4"
  local inst_name="$5"
  local unit_id="$6"
  local unit_name="$7"
  local faculty="$8"
  local dec_no="$9"
  local submit_flag="${10}"
  local assign_officer="${11}"

  local login_res
  login_res=$(curl -sS -X POST "${BASE_URL}/api/v2/portal/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"${prep_email}\",\"preferredTrack\":\"COLLECTIVE\"}")
  local token
  token=$(json_get "$login_res" "data.token")
  local prep_id
  prep_id=$(json_get "$login_res" "data.user.id")
  local prep_name
  prep_name=$(json_get "$login_res" "data.user.fullName")

  local create_payload
  create_payload=$(node -e "
    process.stdout.write(JSON.stringify({
      collectiveName: process.argv[1],
      collectiveType: process.argv[2],
      institutionId: process.argv[3],
      institutionName: process.argv[4],
      schoolReviewUnitId: process.argv[5],
      schoolReviewUnitName: process.argv[6],
      facultyName: process.argv[7],
      academicYear: '2025–2026',
      contactPhone: '0905888999',
      preparedByUserId: process.argv[8],
      preparedByUserName: process.argv[9],
      preparedByUserEmail: process.argv[10]
    }));
  " "$col_name" "$col_type" "$inst_id" "$inst_name" "$unit_id" "$unit_name" "$faculty" "$prep_id" "$prep_name" "$prep_email")

  local create_res
  create_res=$(curl -sS -X POST "${BASE_URL}/api/v2/portal/collective/applications" \
    -H "Authorization: Bearer ${token}" \
    -H "Content-Type: application/json" \
    -d "$create_payload")
  local col_id
  col_id=$(json_get "$create_res" "data.id")

  # Upload real PDFs for TT01-TT04
  upload_portal_evidence "$token" "COLLECTIVE" "$col_id" "TT01" "518_quyet_dinh_giay_khen_bk_smartcampus.pdf" > /dev/null
  upload_portal_evidence "$token" "COLLECTIVE" "$col_id" "TT02" "307_ke_hoach_bk_smartcampus.pdf" > /dev/null
  upload_portal_evidence "$token" "COLLECTIVE" "$col_id" "TT03" "doan_hoang_thien_phu.pdf" > /dev/null
  upload_portal_evidence "$token" "COLLECTIVE" "$col_id" "TT04" "mistalent_phu.pdf" > /dev/null

  curl -sS -X PUT "${BASE_URL}/api/v2/portal/collective/applications/${col_id}/declarations/TT01" \
    -H "Authorization: Bearer ${token}" \
    -H "Content-Type: application/json" \
    -d "{\"data\":{\"isRecognizedSchoolLevel\":true,\"recognizedAcademicYear\":\"2025–2026\",\"issuingUnitName\":\"Hội Sinh viên ${inst_name}\",\"decisionNumber\":\"${dec_no}\",\"decisionDate\":\"05/10/2026\"}}" > /dev/null

  local members_json='[
    {"id":"m1","fullName":"Trần Minh Quân","studentCode":"102220019","className":"22TCLC_DT3","isParticipatingMovement":true,"isSchoolSv5tRecognized":true,"recognitionDecisionNumber":"15/QĐ-HSV","dataOrigin":"MANUAL"},
    {"id":"m2","fullName":"Lê Nguyễn Khánh Linh","studentCode":"102220084","className":"22TCLC_DT3","isParticipatingMovement":true,"isSchoolSv5tRecognized":true,"recognitionDecisionNumber":"15/QĐ-HSV","dataOrigin":"MANUAL"},
    {"id":"m3","fullName":"Nguyễn Văn Hải","studentCode":"102220105","className":"22TCLC_DT3","isParticipatingMovement":true,"isSchoolSv5tRecognized":true,"recognitionDecisionNumber":"15/QĐ-HSV","dataOrigin":"MANUAL"}
  ]'

  curl -sS -X PUT "${BASE_URL}/api/v2/portal/collective/applications/${col_id}/members/TT02" \
    -H "Authorization: Bearer ${token}" \
    -H "Content-Type: application/json" \
    -d "{\"members\":${members_json}}" > /dev/null

  curl -sS -X PUT "${BASE_URL}/api/v2/portal/collective/applications/${col_id}/declarations/TT02" \
    -H "Authorization: Bearer ${token}" \
    -H "Content-Type: application/json" \
    -d '{"data":{"censusDate":"10/10/2026","narrativeSummary":"100% hội viên đăng ký tham gia phong trào Sinh viên 5 Tốt."}}' > /dev/null

  curl -sS -X PUT "${BASE_URL}/api/v2/portal/collective/applications/${col_id}/members/TT03" \
    -H "Authorization: Bearer ${token}" \
    -H "Content-Type: application/json" \
    -d "{\"members\":${members_json}}" > /dev/null

  curl -sS -X PUT "${BASE_URL}/api/v2/portal/collective/applications/${col_id}/declarations/TT04" \
    -H "Authorization: Bearer ${token}" \
    -H "Content-Type: application/json" \
    -d "{\"data\":{\"noViolationsConfirmed\":true,\"confirmingUnitName\":\"${faculty} – ${inst_name}\",\"confirmationDate\":\"11/10/2026\"}}" > /dev/null

  if [[ "$submit_flag" == "submit" ]]; then
    curl -sS -X POST "${BASE_URL}/api/v2/portal/collective/applications/${col_id}/submit" \
      -H "Authorization: Bearer ${token}" \
      -H "Content-Type: application/json" > /dev/null
  fi

  if [[ -n "$assign_officer" ]]; then
    curl -sS -X POST "${BASE_URL}/api/v2/portal/collective/applications/${col_id}/assign" \
      -H "Authorization: Bearer ${MGR_TOKEN}" \
      -H "Content-Type: application/json" \
      -d "{\"officerId\":\"${assign_officer}\",\"assignmentNote\":\"Phân công thẩm định hồ sơ tập thể ${col_name}\"}" > /dev/null
  fi

  echo "   ✅ Đã tạo hồ sơ Tập thể ${col_id} (${col_name} - ${prep_email})"
}

seed_collective_via_curl "mai.nt@dut.udn.vn" "Chi hội Sinh viên 22TCLC_DT3" "CHI_HOI" "inst-dut" "Trường Đại học Bách khoa – ĐHĐN" "unit-udn" "Đại học Đà Nẵng" "Khoa Công nghệ Thông tin" "42/QĐ-HSV-BK" "submit" "staff-off-nam"
seed_collective_via_curl "hung.lv@due.udn.vn" "Liên chi hội Khoa Quản trị Kinh doanh" "LIEN_CHI_HOI" "inst-due" "Trường Đại học Kinh tế – ĐHĐN" "unit-udn" "Đại học Đà Nẵng" "Khoa Quản trị Kinh doanh" "68/QĐ-HSV-KT" "submit" ""
seed_collective_via_curl "long.vh@dtu.edu.vn" "Chi hội Sinh viên K28-CNTT1" "CHI_HOI" "inst-dtu" "Đại học Duy Tân" "unit-dtu" "Trường Đại học Duy Tân" "Trường Khoa học Máy tính" "19/QĐ-HSV-DTU" "draft" ""

# 7. Verify seeded counts via GET endpoints
echo "📊 [Bước 7/7] Kiểm tra dữ liệu thực tế trên Backend sau khi chạy cURL:"
IND_RES=$(curl -sS "${BASE_URL}/api/v2/portal/individual/applications")
COL_RES=$(curl -sS "${BASE_URL}/api/v2/portal/collective/applications")
AUDIT_RES=$(curl -sS "${BASE_URL}/api/v2/portal/audit-logs")

echo "   -> Tổng hồ sơ Cá nhân trên hệ thống: $(json_get "$IND_RES" "count")"
echo "   -> Tổng hồ sơ Tập thể trên hệ thống: $(json_get "$COL_RES" "count")"
echo "   -> Tổng bản ghi Nhật ký Kiểm toán (Audit Logs): $(json_get "$AUDIT_RES" "count")"
echo "======================================================================"
echo "🎉 Hoàn tất seed 100% qua chuỗi lệnh cURL thực tế!"
echo "======================================================================"
