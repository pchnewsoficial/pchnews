import { useState } from "react";
import { Check, Edit3, Plus, Power, Trash2, X } from "lucide-react";
import { trpc } from "@/lib/trpc";

type Theme = {
  id: string;
  label: string;
  slug: string;
  parentCategory: string;
  sortOrder: number;
  active: boolean;
};

export default function EditorialSubthemesAdmin({ notify }: { notify: (message: string) => void }) {
  const query = trpc.editorialSubthemes.adminList.useQuery(undefined, { retry: false });
  const save = trpc.editorialSubthemes.save.useMutation({ onSuccess: () => { void query.refetch(); notify("Tema específico salvo."); setEditing(null); }, onError: (error) => notify(error.message) });
  const remove = trpc.editorialSubthemes.remove.useMutation({ onSuccess: () => { void query.refetch(); notify("Tema específico removido."); }, onError: (error) => notify(error.message) });
  const [editing, setEditing] = useState<Partial<Theme> | null>(null);

  const startNew = () => setEditing({ label: "", parentCategory: "Sociedade", sortOrder: ((query.data || []) as Theme[]).length * 10, active: true });
  const submit = () => {
    if (!editing?.label?.trim()) return notify("Informe o nome do tema.");
    save.mutate({
      id: editing.id,
      label: editing.label.trim(),
      parentCategory: editing.parentCategory?.trim() || "Sociedade",
      sortOrder: Number(editing.sortOrder || 0),
      active: editing.active !== false,
    });
  };

  return (
    <section className="panel">
      <div className="admin-heading compact">
        <div>
          <span className="admin-kicker">TAXONOMIA EDITORIAL</span>
          <h1>Temas específicos<span>.</span></h1>
          <p>Crie e organize temas que aparecem no “+ MAIS” do site e no rodapé.</p>
        </div>
        <button className="primary-cta" onClick={startNew}><Plus size={15} /> Novo tema</button>
      </div>

      {editing && (
        <div className="panel" style={{ marginBottom: 18, background: "var(--muted, #f8fafc)" }}>
          <div className="panel-heading">
            <div><span className="admin-kicker">{editing.id ? "EDITAR TEMA" : "NOVO TEMA"}</span><h2>{editing.id ? "Editar tema" : "Adicionar tema"}</h2></div>
            <button className="ghost-button" onClick={() => setEditing(null)}><X size={15} /> Cancelar</button>
          </div>
          <div className="form-grid">
            <label>Nome do tema<input value={editing.label || ""} onChange={(e) => setEditing({ ...editing, label: e.target.value })} placeholder="Ex.: Saúde Mental" autoFocus /></label>
            <label>Editorial relacionada<input value={editing.parentCategory || ""} onChange={(e) => setEditing({ ...editing, parentCategory: e.target.value })} placeholder="Ex.: Saúde & Bem-Estar" /></label>
          </div>
          <div className="form-grid">
            <label>Ordem<input type="number" min={0} value={editing.sortOrder ?? 0} onChange={(e) => setEditing({ ...editing, sortOrder: Number(e.target.value) })} /></label>
            <label className="checkbox-label"><input type="checkbox" checked={editing.active !== false} onChange={(e) => setEditing({ ...editing, active: e.target.checked })} /> Exibir no site</label>
          </div>
          <button className="primary-cta" disabled={save.isPending} onClick={submit}><Check size={15} /> {save.isPending ? "Salvando…" : "Salvar tema"}</button>
        </div>
      )}

      {query.isLoading ? <div className="media-empty compact-empty">Carregando temas…</div> :
        <div style={{ display: "grid", gap: 8 }}>
          {((query.data || []) as Theme[]).map((theme) => (
            <div key={theme.id} style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto", gap: 12, alignItems: "center", padding: "13px 14px", border: "1px solid var(--border, #e5e7eb)", borderRadius: 10, background: "var(--card, #fff)" }}>
              <div><strong>{theme.label}</strong><small style={{ display: "block", color: "var(--muted-foreground, #6b7280)", marginTop: 3 }}>{theme.parentCategory} · ordem {theme.sortOrder}</small></div>
              <span className="status-badge">{theme.active ? "Ativo" : "Oculto"}</span>
              <button className="ghost-button" onClick={() => setEditing(theme)}><Edit3 size={14} /> Editar</button>
              <button className="ghost-button" onClick={() => { if (window.confirm(`Excluir o tema “${theme.label}”?\n\nEle deixará de aparecer no + MAIS e no rodapé.`)) remove.mutate({ id: theme.id }); }}><Trash2 size={14} /> Excluir</button>
            </div>
          ))}
        </div>}
    </section>
  );
}
