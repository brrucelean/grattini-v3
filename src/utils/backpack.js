// ─── ZAINO: raggruppamento visivo degli oggetti (P-04) ───────────
// player.items e player.grattatori restano liste di pezzi: qui si calcolano
// solo le caselle da disegnare. Ogni gruppo ricorda gli indici dei suoi pezzi,
// così un clic sulla casella agisce su un pezzo vero (stessa azione di prima).

// Consumabili: stesso id → una casella "×n". Ordine = prima apparizione.
export function groupItems(items = []) {
  const groups = [];
  const byId = new Map();
  items.forEach((id, idx) => {
    if (!id) return;
    let g = byId.get(id);
    if (!g) {
      g = { id, count: 0, indices: [] };
      byId.set(id, g);
      groups.push(g);
    }
    g.count++;
    g.indices.push(idx);
  });
  return groups;
}

// Grattatori: si raggruppano solo quelli identici (stesso id e stessi usi
// rimasti). Quello in mano (equippedIdx) sta sempre in una casella sua, così
// "IN MANO" indica un pezzo solo e il clic lo posa senza ambiguità.
export function groupGrattatori(tools = [], equippedIdx = null) {
  const groups = [];
  const byKey = new Map();
  tools.forEach((g, idx) => {
    if (!g) return;
    if (idx === equippedIdx) {
      groups.push({ key: `mano:${idx}`, tool: g, count: 1, indices: [idx], inHand: true });
      return;
    }
    const key = `${g.id}:${g.usesLeft || 0}`;
    let grp = byKey.get(key);
    if (!grp) {
      grp = { key, tool: g, count: 0, indices: [], inHand: false };
      byKey.set(key, grp);
      groups.push(grp);
    }
    grp.count++;
    grp.indices.push(idx);
  });
  return groups;
}
