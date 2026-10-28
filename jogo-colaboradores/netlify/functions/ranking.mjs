import { getStore } from "@netlify/blobs";

export default async (req) => {
  const store = getStore("ranking");

  if (req.method === "POST") {
    let b;
    try { b = await req.json(); } catch { return Response.json({ erro: "inválido" }, { status: 400 }); }
    const id = String(b.id || "").replace(/[^a-zA-Z0-9-]/g, "").slice(0, 64);
    const nome = String(b.nome || "").replace(/[<>&"']/g, "").trim().slice(0, 12);
    const pontos = Math.floor(Number(b.pontos));
    if (!id || !nome || !(pontos >= 0 && pontos <= 500)) {
      return Response.json({ erro: "dados inválidos" }, { status: 400 });
    }
    if (await store.get(id)) return Response.json({ erro: "já jogou" }, { status: 409 });
    await store.setJSON(id, { nome, pontos, em: Date.now() });
  }

  const { blobs } = await store.list();
  const todos = (await Promise.all(blobs.map((x) => store.get(x.key, { type: "json" })))).filter(Boolean);
  todos.sort((a, b) => b.pontos - a.pontos || a.em - b.em);
  return Response.json({ top: todos.slice(0, 10).map(({ nome, pontos }) => ({ nome, pontos })), total: todos.length });
};

export const config = { path: "/api/ranking" };
