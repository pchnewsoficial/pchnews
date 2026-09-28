import { describe, expect, it } from "vitest";
import { editorialImageUrl } from "../client/src/lib/editorialImage";

const HP = "https://pchnews.hostingpress.com.br/materia/lave-os-olhos";

describe("editorialImageUrl", () => {
  it("uses site-relative Pílula artwork even for Evaldo Poeta articles", () => {
    const url = editorialImageUrl({ id: "evaldo-pilula-02-lave-os-olhos", author: "Evaldo Poeta", image: "/brand/pilulas/evaldo-pilula-02-lave-os-olhos.svg" });
    expect(url).toBe("/brand/pilulas/evaldo-pilula-02-lave-os-olhos.svg");
  });

  it("prefers an uploaded image over the HostingPRESS proxy", () => {
    const url = editorialImageUrl({ image: "https://cdn.example/x.jpg", sourceUrl: HP, author: "Evaldo Poeta" });
    expect(url).toBe("https://cdn.example/x.jpg");
  });

  it("proxies only real HostingPRESS archive items without artwork", () => {
    expect(editorialImageUrl({ sourceUrl: HP })).toContain("/legacy-image/");
  });

  it("does not treat native Evaldo Poeta posts as legacy", () => {
    const url = editorialImageUrl({ id: "evaldo-nova-pilula", author: "Evaldo Poeta", image: "" });
    expect(url).not.toContain("/legacy-image/");
  });
});
