import { describe, expect, it } from "vitest";
import { buildInviteEmail, sendInviteEmail, smtpConfigured } from "./email";

describe("SMTP invitations", () => {
  it("does not attempt delivery without SMTP credentials", async () => {
    expect(smtpConfigured()).toBe(false);
    await expect(sendInviteEmail("editor@example.com", "Editor", "https://example.com/convite/token")).resolves.toEqual({ sent: false, reason: "SMTP_NOT_CONFIGURED" });
  });
  it("builds branded HTML and escapes invite data", () => {
    const result = buildInviteEmail("Ana <Souza>", "https://example.com/convite/a&b");
    expect(result.html).toContain("PCH <span");
    expect(result.html).toContain(">NEWS</span>");
    expect(result.html).toContain("Aceitar convite");
    expect(result.html).toContain("Ana &lt;Souza&gt;");
    expect(result.html).toContain("a&amp;b");
    expect(result.text).toContain("Ana <Souza>");
  });
});
