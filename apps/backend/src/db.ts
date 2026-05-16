import pg from "pg";

const { Pool } = pg;

let pool: pg.Pool | null = null;

const developmentAccounts = [
  {
    userId: "user_dev_login",
    authId: "auth_dev_login",
    code: "dev-login",
    nickname: "개발로그인",
    email: "dev-login@example.com",
    preferredCategories: ["일식", "양식"]
  },
  {
    userId: "user_demo_01",
    authId: "auth_demo_01",
    code: "demo-user-01",
    nickname: "데모유저1",
    email: "demo1@example.com",
    preferredCategories: ["양식", "일식"]
  },
  {
    userId: "user_demo_02",
    authId: "auth_demo_02",
    code: "demo-user-02",
    nickname: "데모유저2",
    email: "demo2@example.com",
    preferredCategories: ["중식", "술집"]
  },
  {
    userId: "user_demo_03",
    authId: "auth_demo_03",
    code: "demo-user-03",
    nickname: "데모유저3",
    email: "demo3@example.com",
    preferredCategories: ["일식", "중식"]
  },
  {
    userId: "user_demo_04",
    authId: "auth_demo_04",
    code: "demo-user-04",
    nickname: "데모유저4",
    email: "demo4@example.com",
    preferredCategories: ["술집", "양식"]
  },
  {
    userId: "user_demo_05",
    authId: "auth_demo_05",
    code: "demo-user-05",
    nickname: "데모유저5",
    email: "demo5@example.com",
    preferredCategories: ["양식", "중식"]
  }
];

export function getPool() {
  if (pool) {
    return pool;
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return null;
  }

  pool = new Pool({
    connectionString
  });
  return pool;
}

export async function ensureDatabaseSchema() {
  const activePool = getPool();
  if (!activePool) {
    return false;
  }

  await activePool.query(`alter table if exists titles alter column max_kg drop not null`);
  await activePool.query(`alter table if exists users add column if not exists role text not null default 'user'`);
  await activePool.query(`
    create table if not exists post_likes (
      user_id text not null references users(id),
      post_id text not null references posts(id),
      created_at timestamptz not null default now(),
      primary key (user_id, post_id)
    )
  `);
  await activePool.query(`
    create table if not exists post_scraps (
      user_id text not null references users(id),
      post_id text not null references posts(id),
      created_at timestamptz not null default now(),
      primary key (user_id, post_id)
    )
  `);
  await activePool.query(`create unique index if not exists reviews_post_user_idx on reviews(post_id, user_id)`);
  await ensureDevelopmentAccounts(activePool);
  return true;
}

async function ensureDevelopmentAccounts(activePool: pg.Pool) {
  for (const account of developmentAccounts) {
    const categoryResult = await activePool.query<{ id: number }>(
      `select id
       from categories
       where name = any($1::text[])
       order by array_position($1::text[], name)`,
      [account.preferredCategories]
    );
    const preferredCategoryIds = categoryResult.rows.map((row) => row.id);

    await activePool.query(
      `insert into users (id, nickname, profile_image, trust_score, kg_score, role, title_id, preferred_categories)
       values (
         $1,
         $2,
         null,
         50,
         0,
         'user',
         (select id from titles where name = '입문자' limit 1),
         $3::integer[]
       )
       on conflict (id) do update set
         nickname = excluded.nickname,
         role = excluded.role,
         title_id = coalesce(users.title_id, excluded.title_id),
         preferred_categories = excluded.preferred_categories`,
      [account.userId, account.nickname, preferredCategoryIds]
    );

    await activePool.query(
      `insert into auth_accounts (id, user_id, provider, provider_user_id, email, access_token_enc, refresh_token_enc)
       values ($1, $2, 'gachon', $3, $4, '', '')
       on conflict (provider, provider_user_id) do update set
         user_id = excluded.user_id,
         email = excluded.email`,
      [account.authId, account.userId, `gachon_${account.code}`, account.email]
    );
  }
}

export async function checkDatabase() {
  const activePool = getPool();
  if (!activePool) {
    return {
      ok: false,
      error: "DATABASE_URL is not configured"
    };
  }

  const result = await activePool.query<{ now: Date }>("select now() as now");
  return {
    ok: true,
    timestamp: result.rows[0]?.now
  };
}
