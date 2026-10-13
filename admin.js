const SUPPORTED_VERSIONS = [1, 2];

function recompute(p) {
    const w = [],
        r = calcPrice(p.pricing, p.stack, p.blocks.map(b => ({
            n: b.n,
            blocks: b.blocks,
            sp: b.sp
        })), p.rnd, p.v >= 2);
    r.rows.forEach((x, i) => {
        if (x.stacks !== p.blocks[i].stacks) w.push(`Stack count of ${x.n} does not match its block count.`)
    });
    const px = p.blocks.reduce((s, b) => s + b.blocks, 0);
    if (px !== p.size * p.size) w.push(`Block total (${px}) does not equal map pixels (${p.size * p.size}).`);
    ["cost", "profit", "list", "base", "cust", ...(p.v >= 2 ? ["distinct", "extra"] : [])].forEach(k => {
        if (Math.abs(p[k] - r[k]) > 0.5) w.push(`Stored ${k} (${fmt(p[k])}) differs from the recalculated value (${fmt(r[k])}).`)
    });
    if (p.rnd < p.pricing.rndMin || p.rnd > p.pricing.rndMax) w.push("Random markup is outside the configured range.");
    return w
}
const row = (a, b) => `<tr><td>${esc(a)}</td><td>${esc(b)}</td></tr>`;
$("clr").onclick = () => {
    $("in").value = "";
    $("res").innerHTML = ""
};
$("go").onclick = async () => {
    const out = $("res");
    out.innerHTML = "";
    try {
        const r = await readCode($("in").value),
            p = r.payload,
            warn = [];
        if (!SUPPORTED_VERSIONS.includes(p.v)) throw new Error("Unsupported code version " + p.v + ".");
        if (p.v !== r.prefixVersion) warn.push("Version in the code prefix differs from the payload version.");
        if (!r.checksumOk) warn.push("Checksum mismatch - the payload was modified after creation.");
        warn.push(...recompute(p));
        const ok = !warn.length,
            o = p.opts || {};
        out.innerHTML = `<section class="card"><span class="badge ${ok ? "ok" : "bad"}">${ok ? "Valid code" : "Manipulated / invalid code"}</span>${warn.map(x => `<div class="warn">${esc(x)}</div>`).join("")}
  <p class="muted">Integrity check only: without a server-side secret, authenticity cannot be proven.</p></section>
  <section class="card"><h2>Blocks</h2><table><tr><th>Block</th><th>Blocks</th><th>Stacks</th><th>Stack price</th></tr>${p.blocks.filter(b => b.blocks).map(b => `<tr><td>${esc(b.n)}</td><td>${fmt(b.blocks)}</td><td>${fmt(b.stacks)}</td><td>${fmt(b.sp)}</td></tr>`).join("")}</table></section>
  <section class="card"><h2>Calculation</h2><table>${row("Code version", p.v) + row("Map size", p.size + "×" + p.size) + row("Stack size", p.stack) + (p.v >= 2 ? row("Different block types", p.distinct) + row("Complexity surcharge", fmt(p.extra)) : "") + row("Cost", fmt(p.cost)) + row("Profit", fmt(p.profit)) + row("Target price", fmt(p.target)) + row("Rounding unit", fmt(p.round)) + row("Random markup", fmt(p.rnd)) + row("List price", fmt(p.list)) + row("List price rounded down", fmt(p.base)) + row("Customer price", fmt(p.cust))}</table></section>
  <section class="card"><h2>Image options</h2><table>${row("Dithering", o.dt) + row("Image adjustments", o.adj ? ["brightness " + o.adj.b, "contrast " + o.adj.c, "gamma " + o.adj.g + "%", "saturation " + o.adj.s].join(", ") : "none") + row("Budget limit", o.budget ? fmt(o.budget) : "none") + row("Posterize", o.pe || "off") + row("3-color", o.c3 ? o.c3.join(", ") : "off")}</table></section>`;
    } catch (e) {
        console.error(e);
        out.innerHTML = `<section class="card"><span class="badge bad">Invalid code</span><div class="warn">${esc(e.message)}</div></section>`
    }
};
loadSite().catch(e => console.error(e));
