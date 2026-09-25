import { afterEach, describe, expect, it, vi } from "vitest";
import { apiHubStatus, chartUrl, getBcbSeries, getWeather, mediastackRadar, redact, resetHealth } from "./apiHub";

afterEach(() => { vi.unstubAllGlobals(); resetHealth(); delete process.env.MEDIASTACK_API_KEY; });

describe("PCH API HUB", () => {
  it("normaliza Open-Meteo e usa cache", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ latitude: -23.5, longitude: -46.6, current: { temperature_2m: 22.1, apparent_temperature: 21, relative_humidity_2m: 70, wind_speed_10m: 9, weather_code: 3, time: "2026-09-25T10:00" } })));
    vi.stubGlobal("fetch", fetchMock);
    const a = await getWeather(-23.5, -46.6);
    await getWeather(-23.5, -46.6);
    expect(a.description).toBe("Nublado");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("normaliza série do BCB", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify([{ data: "01/09/2026", valor: "10.50" }]))));
    const s = await getBcbSeries("selic", 1);
    expect(s.latest).toEqual({ date: "2026-09-01", value: 10.5 });
  });

  it("repete em 5xx e registra erro sem vazar chave", async () => {
    process.env.MEDIASTACK_API_KEY = "segredo123";
    const fetchMock = vi.fn().mockResolvedValue(new Response("x", { status: 503 }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(mediastackRadar("economia")).rejects.toThrow("HTTP 503");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const status = JSON.stringify(apiHubStatus());
    expect(status).not.toContain("segredo123");
    expect(status).toContain("\"state\":\"erro\"");
  });

  it("provider com chave ausente falha de forma explícita", async () => {
    await expect(mediastackRadar("x")).rejects.toThrow("não configurada");
  });

  it("redige credenciais e gera URL de gráfico", () => {
    expect(redact("https://a/b?access_key=abc&x=1")).toBe("https://a/b?access_key=***&x=1");
    expect(chartUrl({ type: "bar", labels: ["a", "b"], values: [1, 2] })).toContain("chd=a%3A1%2C2");
  });
});
