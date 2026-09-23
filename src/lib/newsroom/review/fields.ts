import type { EditorArticle } from "../types";
import type { Field } from "./types";

export const FIELD_LABEL: Record<Field, string> = {
  title: "Título",
  subtitle: "Linha fina",
  excerpt: "Resumo",
  body: "Texto",
  seoTitle: "Title tag",
  seoDescription: "Meta description",
  slug: "Slug",
  keyword: "Palavra-chave",
  image: "Imagem",
  imageAlt: "Texto alternativo",
  imageCredit: "Crédito da imagem",
  category: "Editoria",
  authorSlug: "Autor",
};

export const SEO_FIELDS: Field[] = ["seoTitle", "seoDescription", "slug", "keyword"];

export function getField(a: EditorArticle, field: Field): string {
  switch (field) {
    case "seoTitle":
      return a.seo.title;
    case "seoDescription":
      return a.seo.description;
    case "keyword":
      return a.seo.keyword;
    default:
      return a[field];
  }
}

export function setField(a: EditorArticle, field: Field, value: string): EditorArticle {
  switch (field) {
    case "seoTitle":
      return { ...a, seo: { ...a.seo, title: value } };
    case "seoDescription":
      return { ...a, seo: { ...a.seo, description: value } };
    case "keyword":
      return { ...a, seo: { ...a.seo, keyword: value } };
    default:
      return { ...a, [field]: value };
  }
}
