import { useState } from "react";
import { ExternalLink, Loader2, MapPin, Newspaper, Thermometer, TrendingUp } from "lucide-react";
import { trpc } from "@/lib/trpc";

type Props = {
  draftTitle: string;
  draftCategory: string;
};

export default function ApiHubEditorialTools({ draftTitle, draftCategory }: Props) {
  const [query, setQuery] = useState(draftTitle);
  const [provider, setProvider] = useState<"mediastack" | "currents">("currents");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [seriesId, setSeriesId] = useState("433");
  const [place, setPlace] = useState("");
  const [copied, setCopied] = useState("");

  const news = trpc.apiHub.newsRadar.useQuery(
    { provider, query: query.trim() || undefined },
    { enabled: false, retry: false },
  );
  const weather = trpc.apiHub.weather.useQuery(
    { latitude: Number(latitude), longitude: Number(longitude) },
    { enabled: false, retry: false },
  );
  const bcb = trpc.apiHub.bcbSeries.useQuery(
    { seriesId: Number(seriesId) },
    { enabled: false, retry: false },
  );
  const geocode = trpc.apiHub.geocodeBrazil.useQuery(
    { query: place.trim() },
    { enabled: false, retry: false },
  );

  const copyReference = async (title: string, url: string, source?: string) => {
    try {
      await navigator.clipboard.writeText(`Fonte: ${source || "fonte externa"} — ${title}\n${url}`);
      setCopied("Referência copiada.");
      window.setTimeout(() => setCopied(""), 1800);
    } catch {
      setCopied("Não foi possível copiar a referência.");
    }
  };

  const weatherData = weather.data as any;
  const bcbData = Array.isArray(bcb.data) ? bcb.data as any[] : [];
  const places = Array.isArray(geocode.data) ? geocode.data as any[] : [];

  return (
    <section className="panel" style={{ marginTop: 18, padding: 20 }}>
      <div className="panel-heading" style={{ marginBottom: 12 }}>
        <div>
          <span className="admin-kicker">INTELIGÊNCIA DE PAUTA</span>
          <h2>API HUB editorial</h2>
        </div>
        <small>{draftCategory}</small>
      </div>
      <p style={{ marginTop: 0, opacity: .72, lineHeight: 1.5 }}>
        Consulte fontes externas sem sair do editor. Os resultados são apenas apoio de apuração; a matéria continua sob revisão humana.
      </p>

      <div style={{ display: "grid", gap: 18 }}>
        <div>
          <div className="editor-section-label"><Newspaper size={14} /> RADAR DE NOTÍCIAS</div>
          <div className="form-grid">
            <label>Busca<input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tema da matéria" /></label>
            <label>Provedor<select value={provider} onChange={(e) => setProvider(e.target.value as typeof provider)}><option value="currents">Currents</option><option value="mediastack">Mediastack</option></select></label>
          </div>
          <button type="button" className="secondary-cta" onClick={() => news.refetch()} disabled={news.isFetching || !query.trim()}>
            {news.isFetching ? <Loader2 size={15} /> : <Newspaper size={15} />} Consultar radar
          </button>
          {news.error && <p className="editor-note">Radar indisponível: {news.error.message}</p>}
          {!!news.data?.length && <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
            {news.data.slice(0, 5).map((item, index) => (
              <article key={item.url + index} style={{ padding: 12, border: "1px solid var(--border, #e5e7eb)", borderRadius: 10 }}>
                <strong>{item.title}</strong>
                <small style={{ display: "block", opacity: .68, margin: "5px 0" }}>{item.source || "Fonte externa"}{item.publishedAt ? ` · ${new Date(item.publishedAt).toLocaleString("pt-BR")}` : ""}</small>
                {item.description && <p style={{ margin: "5px 0 9px", lineHeight: 1.45 }}>{item.description}</p>}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <a className="secondary-cta" href={item.url} target="_blank" rel="noreferrer"><ExternalLink size={14} /> Abrir fonte</a>
                  <button type="button" className="ghost-button" onClick={() => copyReference(item.title, item.url, item.source)}>Copiar referência</button>
                </div>
              </article>
            ))}
          </div>}
        </div>

        <div>
          <div className="editor-section-label"><Thermometer size={14} /> CLIMA</div>
          <div className="form-grid">
            <label>Latitude<input value={latitude} onChange={(e) => setLatitude(e.target.value)} placeholder="-23.55" inputMode="decimal" /></label>
            <label>Longitude<input value={longitude} onChange={(e) => setLongitude(e.target.value)} placeholder="-46.63" inputMode="decimal" /></label>
          </div>
          <button type="button" className="secondary-cta" onClick={() => weather.refetch()} disabled={weather.isFetching || !latitude || !longitude}><Thermometer size={15} /> Consultar clima</button>
          {weather.error && <p className="editor-note">Clima indisponível: {weather.error.message}</p>}
          {weatherData?.current && <p className="editor-note"><strong>{weatherData.current.temperature_2m}°C</strong> · sensação {weatherData.current.apparent_temperature}°C · umidade {weatherData.current.relative_humidity_2m}% · vento {weatherData.current.wind_speed_10m} km/h</p>}
        </div>

        <div>
          <div className="editor-section-label"><TrendingUp size={14} /> DADOS ECONÔMICOS · BANCO CENTRAL</div>
          <div className="form-grid">
            <label>ID da série SGS<input value={seriesId} onChange={(e) => setSeriesId(e.target.value)} inputMode="numeric" /></label>
            <div style={{ alignSelf: "end" }}><button type="button" className="secondary-cta" onClick={() => bcb.refetch()} disabled={bcb.isFetching || !/^\d+$/.test(seriesId)}><TrendingUp size={15} /> Consultar série</button></div>
          </div>
          {bcb.error && <p className="editor-note">Banco Central indisponível: {bcb.error.message}</p>}
          {!!bcbData.length && <div style={{ overflowX: "auto", marginTop: 10 }}><table className="news-table"><thead><tr><th>Data</th><th>Valor</th></tr></thead><tbody>{bcbData.slice(-10).map((item, index) => <tr key={String(item.data) + index}><td>{item.data}</td><td>{item.valor}</td></tr>)}</tbody></table></div>}
        </div>

        <div>
          <div className="editor-section-label"><MapPin size={14} /> LOCALIZAÇÃO</div>
          <label>Localidade brasileira<input value={place} onChange={(e) => setPlace(e.target.value)} placeholder="Ex.: Campinas, SP" /></label>
          <button type="button" className="secondary-cta" onClick={() => geocode.refetch()} disabled={geocode.isFetching || place.trim().length < 2}><MapPin size={15} /> Encontrar local</button>
          {!!places.length && <div style={{ display: "grid", gap: 7, marginTop: 10 }}>{places.map((item, index) => <div key={String(item.place_id || index)} className="editor-note"><strong>{item.display_name}</strong><br /><small>{item.lat}, {item.lon}</small></div>)}</div>}
        </div>
      </div>

      {copied && <p className="editor-note" style={{ marginBottom: 0 }}>{copied}</p>}
    </section>
  );
}
