import type { Express, Request, Response } from "express";
import { getSupabasePublic } from "./supabase";

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = typeof req.query.code === "string" ? req.query.code : undefined;
    if (!code) {
      res.status(400).json({ error: "code is required" });
      return;
    }

    try {
      const supabase = getSupabasePublic();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        res.status(400).json({ error: error.message });
        return;
      }
      res.redirect(302, "/");
    } catch (error) {
      console.error("[Supabase Auth] Callback failed", error);
      res.status(500).json({ error: "Supabase Auth callback failed" });
    }
  });
}
