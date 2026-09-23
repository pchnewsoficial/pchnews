/** Origem pública da requisição (sem hosts fixos no código). */
export function originFromRequest(request: Request) {
  const url = new URL(request.url);
  const sandboxHost = url.hostname === "localhost" ? request.headers.get("x-forwarded-host") : null;
  return sandboxHost ? `https://${sandboxHost}` : url.origin;
}
