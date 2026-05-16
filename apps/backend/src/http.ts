import type express from "express";

type HttpMethod = "get" | "post" | "patch" | "delete";

function routeAliases(path: string) {
  if (path.startsWith("/api")) {
    return [path, path.slice(4) || "/"];
  }

  return [path, `/api${path}`];
}

export function register(app: express.Express, method: HttpMethod, path: string, handler: any) {
  for (const route of routeAliases(path)) {
    app[method](route, handler);
  }
}
