const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

type Health = {
  status: string;
  db: string;
  time: string;
};

async function getHealth(): Promise<Health | null> {
  try {
    const res = await fetch(`${API}/api/v1/health`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function Home() {
  const health = await getHealth();

  const steps = [
    { day: 'Ngày 1', name: 'Database', note: '6 bảng, seed 20 bài đăng', done: true },
    { day: 'Ngày 2', name: 'Chạy được + deploy', note: 'API và web nói chuyện với nhau', done: false },
    { day: 'Ngày 3–5', name: 'Đăng ký & đăng nhập', note: 'argon2, JWT, guard', done: false },
    { day: 'Ngày 6–8', name: 'API bài đăng', note: 'xem, đăng, sửa, xoá', done: false },
    { day: 'Ngày 10–13', name: 'Giao diện', note: 'danh sách, chi tiết, form đăng', done: false },
    { day: 'Ngày 15–16', name: 'Bản đồ', note: 'MapLibre, marker từ database', done: false },
    { day: 'Ngày 17–19', name: 'Telehealth, quyên góp', note: 'các trang của bản gốc', done: false },
  ];

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">WeAidUkraine 2.0</h1>
      <p className="mt-2 text-neutral-600 dark:text-neutral-400">
        Nơi người cần giúp và người giúp gặp nhau
      </p>

      <div className="mt-8 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <span
            className={`inline-block h-2.5 w-2.5 rounded-full ${
              health ? 'bg-emerald-500' : 'bg-red-500'
            }`}
          />
          <span className="font-medium">
            {health ? 'API đang chạy' : 'Chưa kết nối được API'}
          </span>
        </div>
        {health ? (
          <p className="mt-2 font-mono text-sm text-neutral-600 dark:text-neutral-400">
            database: {health.db}
          </p>
        ) : (
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            Mở terminal thứ hai và chạy{' '}
            <code className="font-mono">npm run api:dev</code>
          </p>
        )}
      </div>

      <h2 className="mt-12 text-sm font-semibold uppercase tracking-wide text-neutral-500">
        Lộ trình
      </h2>
      <ul className="mt-4 space-y-2">
        {steps.map((s) => (
          <li
            key={s.day}
            className="flex items-baseline gap-3 rounded-lg border border-neutral-200 px-4 py-3 dark:border-neutral-800"
          >
            <span className="w-20 shrink-0 text-xs text-neutral-500">{s.day}</span>
            <div className="min-w-0 flex-1">
              <div className="font-medium">
                {s.done && <span className="mr-1.5 text-emerald-600">✓</span>}
                {s.name}
              </div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400">
                {s.note}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
