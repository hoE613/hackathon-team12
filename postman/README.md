# JjepjepSecretary Postman

## Import

1. Open Postman.
2. Import `JjepjepSecretary.postman_collection.json`.
3. Import `JjepjepSecretary.local.postman_environment.json`.
4. Select the `JjepjepSecretary Local` environment.

## Run Locally

```bash
export PATH=/home/byeonghunlee/.local/nodejs/current/bin:$PATH
npm run db:start
npm run dev:backend
```

If port `4000` is already busy, run the backend with another port and change the Postman `baseUrl` variable.

```bash
PORT=4001 npm run dev:backend
```

Then set `baseUrl` to:

```text
http://localhost:4001
```

## Suggested Order

1. `Health / Backend Health`
2. `Health / Database Health`
3. `Auth / Login Demo`
4. `Auth / Me`
5. `AI / Recommendations`
6. `Database Test / Create DB Test User`
7. `Database Test / Get DB Test User`

`Login Demo` automatically stores `accessToken` and `refreshToken` in the selected environment.
