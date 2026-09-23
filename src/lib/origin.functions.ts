import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

import { originFromRequest } from "@/lib/seo/request-origin";

export const getRequestOrigin = createServerFn({ method: "GET" }).handler(() =>
  originFromRequest(getRequest()),
);
