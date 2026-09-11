/**
 * Tạo dữ liệu ban đầu.
 *
 * Chạy:  npm run db:seed
 *
 * Chạy bao nhiêu lần cũng ra cùng kết quả: xoá sạch rồi tạo lại.
 * TRUNCATE nhanh hơn DELETE vì nó xoá cả bảng trong một nhát thay vì đi qua
 * từng dòng. CASCADE để nó xử luôn các bảng có khoá ngoại trỏ tới.
 *
 * Dữ liệu tổ chức từ thiện và bác sĩ lấy nguyên từ bản gốc WeAidUkraine —
 * trước nằm cứng trong HTML, giờ nằm trong database.
 */
import { Client } from 'pg';
import * as argon2 from 'argon2';
import 'dotenv/config';

const SEED_PASSWORD = 'demo1234';

// --------------------------------------------------------------- tổ chức từ thiện
// Trang Monetary Donation của bản gốc

const ORGANIZATIONS = [
  {
    name: 'Disasters Emergency Committee (DEC)',
    description:
      'Donations to the DEC help fund 15 leading aid charities and their local partners in Ukraine and neighbouring countries to provide urgent relief and support to refugees and displaced nationals.',
    url: 'https://www.dec.org.uk/appeal/ukraine-humanitarian-appeal',
  },
  {
    name: 'Red Cross - Ukraine',
    description:
      'Working on the ground in Ukraine, the Red Cross helps distribute urgent aid and resources to those in need.',
    url: 'https://www.icrc.org/en/donate/ukraine',
  },
  {
    name: 'Revived Soldiers Ukraine (RSU)',
    description:
      'Funds medication and important supplies for army hospitals on the front line, and supports fundamental rights such as affordable medical care.',
    url: 'https://www.rsukraine.org/',
  },
  {
    name: 'Voices of Children',
    description:
      'Provides immediate aid to families affected by the invasion, and helps children recover from psychological trauma through art therapy and mobile psychologists.',
    url: 'https://voices.org.ua/en/',
  },
  {
    name: 'Kyiv School of Economics Appeal',
    description:
      'Provides food supplies, transportation and refugee help for Ukrainian citizens, and purchases medicine and first aid kits for emergency services.',
    url: 'https://kse.ua/support/donation/',
  },
  {
    name: 'Aid Legion',
    description:
      'Provides safety equipment and first aid to defenders, and medicine, food, water, housing and evacuation help to civilians.',
    url: 'https://aidlegion.com/',
  },
];

// --------------------------------------------------------------- bác sĩ
// Trang Telehealth của bản gốc

const DOCTORS = [
  {
    name: 'Imran N Hafiz',
    specialty: 'Emergency Medicine',
    languages: ['English', 'Russian'],
    bio: 'MBBS MD Physician, MD Radiology with more than 9 years of experience in both hospital and clinic settings. Skilled in physical evaluation, treatment plans and disease management.',
    slots: ['4:00 pm (GMT+3)', '6:00 pm (GMT+3)'],
  },
  {
    name: 'Oscar Yong Nan Mu',
    specialty: 'General Internal Medicine',
    languages: ['English', 'Chinese', 'Ukrainian', 'Russian'],
    bio: 'Medical resident doctor. General internal diseases, family medicine, cardiology, endocrinology, infectious disease, pulmonology, nephrology, neurology, dermatology, gastroenterology.',
    slots: ['4:00 pm (GMT+3)', '6:00 pm (GMT+3)'],
  },
  {
    name: 'Alina Sharinn MD',
    specialty: 'Cardiology',
    languages: ['Russian', 'English'],
    bio: 'Board Certified Neurologist subspecializing in Neuroimmunology and Multiple Sclerosis. Member of the American Academy of Neurology with over a decade of experience.',
    slots: ['11:00 am (GMT+3)', '8:00 pm (GMT+3)'],
  },
  {
    name: 'Tetiana Kozub',
    specialty: 'Gynecology',
    languages: ['English', 'Russian', 'Ukrainian'],
    bio: 'Born in Ukraine, graduated LMU-DCOM in 2016 and completed a residency in Family Medicine in 2019. Full spectrum family physician: prenatal care, deliveries, pediatric and adult patients.',
    slots: ['1:00 pm (GMT+3)', '3:00 pm (GMT+3)'],
  },
  {
    name: 'Sayuru Dissanayake',
    specialty: 'Psychiatry',
    languages: ['English'],
    bio: 'Studied Medicine at Riga Stradina University, Latvia. Trained under the Royal College of Surgeons Ireland scheme and was a member of the College of Psychiatry, Ireland. Medical lead for Viveo Health in Latvia.',
    slots: ['10:00 am (GMT+3)', '2:00 pm (GMT+3)'],
  },
  {
    name: 'Andrew Ripecky',
    specialty: 'Psychiatry',
    languages: ['Ukrainian', 'English'],
    bio: 'Trained in Latvia and Ireland with experience across multiple medical and surgical sub-specialties before focusing on psychiatry.',
    slots: ['11:00 am (GMT+3)', '8:00 pm (GMT+3)'],
  },
];

// --------------------------------------------------------------- bài đăng mẫu

const KYIV = { lat: 50.4501, lng: 30.5234 };

const LISTINGS: Array<{
  kind: 'NEED' | 'OFFER';
  category: string;
  title: string;
  description: string;
  quantity: number | null;
  city: string;
}> = [
  // Helper đăng — thứ họ CÓ
  { kind: 'OFFER', category: 'SHELTER', title: 'Spare room for a family of 3', description: 'Private room with bathroom, available for up to 2 months. Pets welcome.', quantity: 3, city: 'Kyiv' },
  { kind: 'OFFER', category: 'SHELTER', title: 'Shelter with 12 free beds', description: 'Community centre basement, heated, with kitchen access. Open 24/7.', quantity: 12, city: 'Kyiv' },
  { kind: 'OFFER', category: 'SHELTER', title: 'Apartment available for 2 weeks', description: 'One-bedroom apartment near the metro. Fully furnished.', quantity: 2, city: 'Kyiv' },
  { kind: 'OFFER', category: 'FOOD', title: '200 hot meals every evening', description: 'Cooked meals from our restaurant kitchen, 6pm to 9pm daily.', quantity: 200, city: 'Kyiv' },
  { kind: 'OFFER', category: 'FOOD', title: 'Food parcels for families', description: 'Dry goods, canned food, baby formula. Pick up or delivery within 10 km.', quantity: 50, city: 'Kyiv' },
  { kind: 'OFFER', category: 'WATER', title: 'Bottled water — 30 crates', description: '1.5L bottles, 12 per crate. Can deliver.', quantity: 30, city: 'Kyiv' },
  { kind: 'OFFER', category: 'MEDICINE', title: 'First aid kits and bandages', description: 'Donated from a local pharmacy. Includes antiseptics and painkillers.', quantity: 40, city: 'Kyiv' },
  { kind: 'OFFER', category: 'TRANSPORT', title: 'Van with driver, 7 seats', description: 'Available weekends for evacuation or moving belongings.', quantity: 7, city: 'Kyiv' },
  { kind: 'OFFER', category: 'CLOTHING', title: 'Winter coats and boots', description: 'Adult and children sizes. Clean and in good condition.', quantity: 60, city: 'Kyiv' },
  { kind: 'OFFER', category: 'OTHER', title: 'Power banks and phone chargers', description: 'Useful during power cuts. Free to anyone who needs one.', quantity: 25, city: 'Kyiv' },

  // Seeker đăng — thứ họ CẦN
  { kind: 'NEED', category: 'SHELTER', title: 'Need a place to stay for 2 weeks', description: 'Mother and two children, 6 and 9 years old. We can help with cleaning.', quantity: 3, city: 'Kyiv' },
  { kind: 'NEED', category: 'SHELTER', title: 'Looking for shelter tonight', description: 'Our building lost heating. Two elderly people.', quantity: 2, city: 'Kyiv' },
  { kind: 'NEED', category: 'FOOD', title: 'Food for family of 5', description: 'Anything non-perishable would help. We have no working stove.', quantity: 5, city: 'Kyiv' },
  { kind: 'NEED', category: 'FOOD', title: 'Baby formula needed urgently', description: 'For a 7-month-old. Any brand.', quantity: 4, city: 'Kyiv' },
  { kind: 'NEED', category: 'WATER', title: 'Drinking water for our block', description: 'Water supply has been cut for three days. About 20 people.', quantity: 20, city: 'Kyiv' },
  { kind: 'NEED', category: 'MEDICINE', title: 'Insulin needed', description: 'Type 1 diabetic, ran out two days ago. Can collect.', quantity: 1, city: 'Kyiv' },
  { kind: 'NEED', category: 'MEDICINE', title: 'Blood pressure medication', description: 'For my grandmother, prescription available.', quantity: 1, city: 'Kyiv' },
  { kind: 'NEED', category: 'TRANSPORT', title: 'Ride to the border for 2 people', description: 'Flexible on timing. We can share fuel costs.', quantity: 2, city: 'Kyiv' },
  { kind: 'NEED', category: 'CLOTHING', title: 'Winter clothes for children', description: 'Sizes 6 and 9. Coats, gloves, warm socks.', quantity: 2, city: 'Kyiv' },
  { kind: 'NEED', category: 'OTHER', title: 'Help moving belongings', description: 'Third floor, no lift. Two or three people for a few hours.', quantity: 1, city: 'Kyiv' },
];

// --------------------------------------------------------------- tiện ích

/**
 * Rải toạ độ ngẫu nhiên quanh tâm thành phố, trong bán kính ~radiusKm.
 *
 * 1 độ vĩ tuyến ≈ 111 km ở mọi nơi. Kinh tuyến hẹp dần về hai cực nên phải
 * chia cho cos(vĩ độ) — ở Kyiv (50°) một độ kinh tuyến chỉ còn ~71 km.
 * Bỏ bước này thì các điểm bị dí sát nhau theo chiều ngang.
 */
function scatter(lat: number, lng: number, radiusKm: number) {
  const dLat = (Math.random() - 0.5) * 2 * (radiusKm / 111);
  const dLng =
    ((Math.random() - 0.5) * 2 * (radiusKm / 111)) /
    Math.cos((lat * Math.PI) / 180);
  return { lat: lat + dLat, lng: lng + dLng };
}

// --------------------------------------------------------------- chạy

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  console.log('Xoá dữ liệu cũ...');
  await client.query(`
    TRUNCATE appointment, donation, listing, doctor, organization, app_user
    RESTART IDENTITY CASCADE;
  `);

  // argon2 cố tình chạy chậm — đó là điểm mạnh của nó khi bảo vệ mật khẩu.
  // Băm một lần rồi dùng chung cho mọi tài khoản mẫu.
  console.log('Băm mật khẩu...');
  const passwordHash = await argon2.hash(SEED_PASSWORD);

  // ---------------------------------------------------------- organization
  for (const [i, org] of ORGANIZATIONS.entries()) {
    await client.query(
      `INSERT INTO organization (name, description, website_url, sort_order)
       VALUES ($1, $2, $3, $4)`,
      [org.name, org.description, org.url, i],
    );
  }
  console.log(`  ${ORGANIZATIONS.length} tổ chức`);

  // ---------------------------------------------------------- doctor
  for (const d of DOCTORS) {
    await client.query(
      `INSERT INTO doctor (full_name, specialty, languages, bio, time_slots)
       VALUES ($1, $2, $3, $4, $5)`,
      [d.name, d.specialty, d.languages, d.bio, d.slots],
    );
  }
  console.log(`  ${DOCTORS.length} bác sĩ`);

  // ---------------------------------------------------------- app_user
  const helperIds: string[] = [];
  const seekerIds: string[] = [];

  for (let i = 1; i <= 3; i++) {
    for (const role of ['HELPER', 'SEEKER'] as const) {
      const email = `${role.toLowerCase()}${i}@example.com`;
      const { rows: [u] } = await client.query<{ id: string }>(
        `INSERT INTO app_user (email, password_hash, role, full_name, phone, city)
         VALUES ($1, $2, $3, $4, $5, 'Kyiv')
         RETURNING id`,
        [
          email,
          passwordHash,
          role,
          `${role === 'HELPER' ? 'Helper' : 'Seeker'} ${i}`,
          `+380 67 000 00${i}${role === 'HELPER' ? '1' : '2'}`,
        ],
      );
      (role === 'HELPER' ? helperIds : seekerIds).push(u.id);
    }
  }
  console.log(`  6 tài khoản`);

  // ---------------------------------------------------------- listing
  for (const [i, l] of LISTINGS.entries()) {
    const pool = l.kind === 'OFFER' ? helperIds : seekerIds;
    const userId = pool[i % pool.length];
    const p = scatter(KYIV.lat, KYIV.lng, 12);

    const { rows: [owner] } = await client.query<{
      full_name: string; email: string; phone: string;
    }>(`SELECT full_name, email, phone FROM app_user WHERE id = $1`, [userId]);

    await client.query(
      `INSERT INTO listing (
         user_id, kind, category, title, description, quantity,
         latitude, longitude, address, city,
         contact_name, contact_email, contact_phone
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      [
        userId, l.kind, l.category, l.title, l.description, l.quantity,
        p.lat, p.lng, `${10 + i} Example St, ${l.city}`, l.city,
        owner.full_name, owner.email, owner.phone,
      ],
    );
  }
  console.log(`  ${LISTINGS.length} bài đăng`);

  console.log(`\nXong.`);
  console.log(`Tài khoản demo:  helper1@example.com  /  ${SEED_PASSWORD}`);
  console.log(`                 seeker1@example.com  /  ${SEED_PASSWORD}`);

  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
