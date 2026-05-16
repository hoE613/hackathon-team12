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

const titleDefinitions = [
  { name: "새내기", minKg: 0, maxKg: 5, description: "맛집 탐험을 막 시작한 새내기" },
  { name: "쩝쩝 학사", minKg: 6, maxKg: 10, description: "기본 활동을 쌓아가는 쩝쩝 학사" },
  { name: "석사", minKg: 11, maxKg: 30, description: "맛집 기록 경험이 쌓인 석사" },
  { name: "박사", minKg: 31, maxKg: 50, description: "신뢰도 높은 맛집 박사" },
  { name: "교수", minKg: 51, maxKg: 70, description: "추천 영향력이 커진 교수" },
  { name: "총장", minKg: 71, maxKg: 90, description: "상위권 활동량의 총장" },
  { name: "쩝신", minKg: 91, maxKg: null, description: "최고 등급의 쩝신" }
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
  await activePool.query(`alter table if exists reviews drop constraint if exists reviews_rating_check`);
  await activePool.query(`alter table if exists reviews alter column rating type numeric(2, 1) using rating::numeric`);
  await activePool.query(`
    do $$
    begin
      if to_regclass('public.reviews') is not null then
        alter table reviews add constraint reviews_rating_check check (rating >= 0.5 and rating <= 5);
      end if;
    exception
      when duplicate_object then null;
    end $$;
  `);
  await ensureTitleDefinitions(activePool);
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
  await ensureTitleDefinitions(activePool);
  return true;
}

async function ensureTitleDefinitions(activePool: pg.Pool) {
  for (const title of titleDefinitions) {
    await activePool.query(
      `insert into titles (name, min_kg, max_kg, description)
       values ($1, $2, $3, $4)
       on conflict (name) do update set
         min_kg = excluded.min_kg,
         max_kg = excluded.max_kg,
         description = excluded.description`,
      [title.name, title.minKg, title.maxKg, title.description]
    );
  }

  await activePool.query(`
    update users
    set title_id = coalesce((
      select id
      from titles
      where users.kg_score >= min_kg and (max_kg is null or users.kg_score <= max_kg)
        and name = any($1::text[])
      order by min_kg asc
      limit 1
    ), (select id from titles where name = '쩝신' limit 1))
  `, [titleDefinitions.map((title) => title.name)]);

  await activePool.query(
    `delete from titles
     where name = any($1::text[])`,
    [["입문자", "탐험가", "맛잘알", "쩝쩝러", "쩝쩝박사", "쩝쩝학사", "쩝쩝석사", "쩝쩝교수"]]
  );
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
         (select id from titles where name = '새내기' limit 1),
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
