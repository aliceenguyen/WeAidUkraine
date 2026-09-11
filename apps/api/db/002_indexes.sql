-- =============================================================================
-- Index
--
-- Chỉ đánh lên cột thật sự hay dùng để LỌC hoặc SẮP XẾP. Mỗi index tốn dung
-- lượng và làm INSERT chậm đi một chút, nên đánh bừa là lỗ.
--
-- Đã có index sẵn, không cần đánh lại:
--   - mọi PRIMARY KEY
--   - mọi ràng buộc UNIQUE (app_user.email)
--
-- KHÔNG tự có index: khoá ngoại. Postgres không tự đánh cho FK, phải tự làm.
-- =============================================================================


-- Truy vấn chính của trang danh sách: bài đang mở, mới nhất trước.
-- DESC khớp đúng chiều sắp xếp nên Postgres đọc thẳng theo index, khỏi sắp lại.
CREATE INDEX listing_status_created_at_idx
  ON listing (status, created_at DESC);

-- Bộ lọc: "chỗ ở do helper đăng", "đồ ăn ai đang cần"...
-- Nhờ quy tắc tiền tố trái, index này phục vụ luôn truy vấn chỉ lọc theo kind.
CREATE INDEX listing_kind_category_status_idx
  ON listing (kind, category, status);

-- Trang "bài đăng của tôi", và cũng là khoá ngoại sang app_user.
CREATE INDEX listing_user_id_idx
  ON listing (user_id);

-- Khoá ngoại
CREATE INDEX appointment_doctor_id_idx ON appointment (doctor_id);
CREATE INDEX appointment_user_id_idx   ON appointment (user_id);
CREATE INDEX donation_user_id_idx      ON donation (user_id);

-- Trang quản lý: xem đơn quyên góp mới nhất, hoặc lọc theo trạng thái xử lý.
CREATE INDEX donation_status_created_at_idx
  ON donation (status, created_at DESC);

-- Trang Monetary Donation hiển thị theo thứ tự đã định.
CREATE INDEX organization_sort_order_idx
  ON organization (sort_order);
