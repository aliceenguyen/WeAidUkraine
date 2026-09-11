-- =============================================================================
-- WeAidUkraine 2.0 — schema
--
-- 6 bảng:
--   app_user      tài khoản (SEEKER hoặc HELPER)
--   listing       BẢNG CHÍNH — mọi bài đăng, cả "tôi cần" lẫn "tôi có"
--   organization  các tổ chức từ thiện của trang Monetary Donation
--   doctor        bác sĩ của trang Telehealth
--   appointment   lịch hẹn khám
--   donation      form quyên góp đồ ăn / quần áo
--
-- Quy ước: từ khoá SQL viết HOA, tên bảng/cột viết thường snake_case.
-- Mọi mốc thời gian dùng timestamptz.
-- =============================================================================


-- ---------------------------------------------------------------- ENUM

CREATE TYPE role AS ENUM ('SEEKER', 'HELPER');

-- Một bài đăng hoặc là "tôi cần" hoặc là "tôi có". Gộp chung một bảng vì hai
-- loại này có y hệt các trường — tách ra chỉ tổ viết code hai lần.
CREATE TYPE listing_kind AS ENUM ('NEED', 'OFFER');

CREATE TYPE category AS ENUM (
  'SHELTER', 'FOOD', 'WATER', 'MEDICINE', 'TRANSPORT', 'CLOTHING', 'OTHER'
);

CREATE TYPE listing_status AS ENUM ('OPEN', 'CLOSED');

-- Ba lựa chọn đúng như form của bản gốc
CREATE TYPE donation_type AS ENUM ('PACKED_FOOD', 'CLOTHING', 'MEDICAL_SUPPLIES');

CREATE TYPE donation_status AS ENUM ('NEW', 'CONTACTED', 'COLLECTED');

CREATE TYPE appointment_status AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED');


-- ---------------------------------------------------------------- app_user
-- Tên là app_user chứ không phải user, vì `user` là từ khoá của Postgres.

CREATE TABLE app_user (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text NOT NULL UNIQUE,
  password_hash text NOT NULL,          -- băm bằng argon2, KHÔNG lưu mật khẩu thật
  role          role NOT NULL DEFAULT 'SEEKER',
  full_name     text NOT NULL,
  phone         text,
  city          text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);


-- ---------------------------------------------------------------- listing
-- Trái tim của website. Helper đăng chỗ ở / đồ ăn mình có, seeker đăng thứ
-- mình cần. Ai vào cũng xem được, xem trên bản đồ, và lấy thông tin liên hệ.

CREATE TABLE listing (
  id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,

  kind        listing_kind NOT NULL,
  category    category NOT NULL,
  title       text NOT NULL,
  description text NOT NULL,
  quantity    integer CHECK (quantity IS NULL OR quantity > 0),

  -- Toạ độ để vẽ marker trên bản đồ. Người đăng chọn bằng cách bấm lên bản đồ.
  latitude  double precision NOT NULL CHECK (latitude  BETWEEN -90 AND 90),
  longitude double precision NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  address   text,
  city      text,

  -- Thông tin liên hệ hiện trên trang chi tiết. Tách riêng khỏi app_user để
  -- người đăng có thể để số khác (số của tổ chức, số người thân...).
  contact_name  text NOT NULL,
  contact_email text NOT NULL,
  contact_phone text,

  status     listing_status NOT NULL DEFAULT 'OPEN',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);


-- ---------------------------------------------------------------- organization
-- Trang Monetary Donation của bản gốc viết cứng 6 tổ chức trong HTML.
-- Giờ đọc từ đây — muốn thêm tổ chức thì thêm một dòng, không phải sửa code.

CREATE TABLE organization (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  description text NOT NULL,
  website_url text NOT NULL,
  logo_url    text,
  sort_order  integer NOT NULL DEFAULT 0,   -- để xếp thứ tự hiển thị
  created_at  timestamptz NOT NULL DEFAULT now()
);


-- ---------------------------------------------------------------- doctor
-- Trang Telehealth. Bản gốc viết cứng tên bác sĩ và khung giờ trong HTML.

CREATE TABLE doctor (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name  text NOT NULL,
  specialty  text NOT NULL,                 -- 'Emergency Medicine', 'Cardiology'...
  languages  text[] NOT NULL DEFAULT '{}',  -- mảng: {English,Russian,Ukrainian}
  bio        text NOT NULL,
  photo_url  text,
  time_slots text[] NOT NULL DEFAULT '{}',  -- {'4:00 pm (GMT+3)','6:00 pm (GMT+3)'}
  created_at timestamptz NOT NULL DEFAULT now()
);


-- ---------------------------------------------------------------- appointment
-- user_id cho phép NULL: khách chưa đăng nhập vẫn đặt được lịch, giống bản gốc.
-- ON DELETE SET NULL để lịch hẹn không biến mất khi người dùng xoá tài khoản.

CREATE TABLE appointment (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES doctor(id)   ON DELETE CASCADE,
  user_id   uuid          REFERENCES app_user(id) ON DELETE SET NULL,

  patient_name  text NOT NULL,
  patient_email text NOT NULL,
  problem       text NOT NULL,   -- Emergency / Pregnancy Issue / Cardio help / Psychiatrist
  time_slot     text NOT NULL,

  status     appointment_status NOT NULL DEFAULT 'PENDING',
  created_at timestamptz NOT NULL DEFAULT now()
);


-- ---------------------------------------------------------------- donation
-- Form "Donate Food and Clothing" của bản gốc gửi qua Formspree — dữ liệu bay
-- thành email rồi thôi. Giờ lưu lại, xem lại được, thống kê được.

CREATE TABLE donation (
  id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES app_user(id) ON DELETE SET NULL,

  donor_name  text NOT NULL,
  donor_email text NOT NULL,
  address     text NOT NULL,           -- để đội ngũ tới lấy đồ
  type        donation_type NOT NULL,
  quantity    integer NOT NULL CHECK (quantity > 0),
  note        text,

  status     donation_status NOT NULL DEFAULT 'NEW',
  created_at timestamptz NOT NULL DEFAULT now()
);


-- ---------------------------------------------------------------- trigger
-- Không có ORM thì không ai tự cập nhật updated_at. Một hàm dùng chung, gắn
-- vào các bảng có cột đó.

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_app_user_updated_at
  BEFORE UPDATE ON app_user
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_listing_updated_at
  BEFORE UPDATE ON listing
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
