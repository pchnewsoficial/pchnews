import type { Express } from "express";
import { ENV } from "./env";

export function registerStorageProxy(app: Express) {
  app.get("/manus-storage/*", async (req, res) => {
    const key = (req.params as Record<string, string>)[0];
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }

    // Legacy storage keys are opaque, but must never contain traversal or
    // control characters that could confuse the upstream storage service.
    if (
      key.length > 512 ||
      key.includes("..") ||
      key.includes("\\") ||
      /[\u0000-\u001f\u007f]/.test(key)
    ) {
      res.status(400).send("Invalid storage key");
      return;
    }

    if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
      res.status(500).send("Storage proxy not configured");
      return;
    }

    try {
      const forgeUrl = new URL(
        "v1/storage/presign/get",
        ENV.forgeApiUrl.replace(/\/+$/, "") + "/",
      );
      forgeUrl.searchParams.set("path", key);

      const forgeResp = await fetch(forgeUrl, {
        headers: { Authorization: `Bearer ${ENV.forgeApiKey}` },
      });

      if (!forgeResp.ok) {
        const body = await forgeResp.text().catch(() => "");
        console.error(`[StorageProxy] forge error: ${forgeResp.status} ${body}`);
        res.status(502).send("Storage backend error");
        return;
      }

      const { url } = (await forgeResp.json()) as { url: string };
      if (!url) {
        res.status(502).send("Empty signed URL from backend");
        return;
      }

      // Only follow absolute HTTP(S) signed URLs. Never redirect to a
      // javascript:, data:, file:, or malformed target returned by upstream.
      let signedUrl: URL;
      try {
        signedUrl = new URL(url);
      } catch {
        res.status(502).send("Invalid signed URL from backend");
        return;
      }
      if (signedUrl.protocol !== "https:" && signedUrl.protocol !== "http:") {
        res.status(502).send("Invalid signed URL protocol");
        return;
      }
      signedUrl.username = "";
      signedUrl.password = "";

      res.set("Cache-Control", "no-store");
      res.redirect(307, signedUrl.toString());
    } catch (err) {
      console.error("[StorageProxy] failed:", err);
      res.status(502).send("Storage proxy error");
    }
  });
}
