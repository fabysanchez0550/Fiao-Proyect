/* ========== PANEL FIA'O ========== */

/* ===== NOMBRES DE LAS PÁGINAS DEL PANEL =====
   Si cambias el nombre de un archivo, cámbialo SOLO aquí (campo "file").
   Escríbelo exactamente igual que en tu carpeta, con mayúsculas y guiones. */
/* Páginas del sitio público a las que vuelve el panel (los espacios se escriben %20) */
const HOME_PAGE = "../Index Fiao.html";
const LOGIN_PAGE = "../login.html";

const PANEL = {
  dashboard: { file: "dashboard.html",    label: "Resumen",       icon: '<path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>' },
  fiados:    { file: "fiados.html",    label: "Fiados",        icon: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>' },
  clientes:  { file: "clientes.html",  label: "Clientes",      icon: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.5-4 3.2-6 6.5-6s6 2 6.5 6"/><circle cx="17.5" cy="9" r="2.5"/><path d="M17 14c2.5 0 4 1.7 4.5 5"/>' },
  productos: { file: "productos.html", label: "Productos",     icon: '<path d="M3 7l9-4 9 4-9 4z"/><path d="M3 7v10l9 4 9-4V7M12 11v10"/>' },
  reportes:  { file: "reportes.html",  label: "Reportes",      icon: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>' },
  config:    { file: "config.html",        label: "Configuración", icon: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/>' }
};
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const money = n => "B/. " + Number(n).toFixed(2);
const round2 = n => Math.round(n * 100) / 100;

function h(tag, cls, text) {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  if (text !== undefined) el.textContent = text;
  return el;
}

function animateNumber(el, from, to, duration = 700) {
  const start = performance.now();
  (function frame(now) {
    const t = Math.min((now - start) / duration, 1);
    el.textContent = (from + (to - from) * (1 - Math.pow(1 - t, 3))).toFixed(2);
    if (t < 1) requestAnimationFrame(frame);
  })(start);
}

/* ---------- Sesión ---------- */
const SKEY = "fiao-session", KEY = "fiao-data";
let session = null;
try { session = JSON.parse(localStorage.getItem(SKEY)); } catch (e) {}

/* ---------- Datos (se guardan en tu navegador) ---------- */
const DEFAULT_DATA = {
  business: "Mi negocio",
  clients: [
    { id: "c1", name: "Doña Rosa", phone: "6000-1111", debt: 48.5 },
    { id: "c2", name: "Don Carlos", phone: "6000-2222", debt: 120 },
    { id: "c3", name: "María Pérez", phone: "6000-3333", debt: 15.75 },
    { id: "c4", name: "Tienda La Esquina", phone: "6000-4444", debt: 0 }
  ],
  products: [
    { id: "p1", name: "Pan", price: 0.25 }, { id: "p2", name: "Leche", price: 1.75 },
    { id: "p3", name: "Arroz (1 lb)", price: 0.65 }, { id: "p4", name: "Aceite", price: 2.8 },
    { id: "p5", name: "Huevos (docena)", price: 2.9 }, { id: "p6", name: "Refresco", price: 1 }
  ],
  movements: []
};

function loadData() {
  let d = null;
  try { d = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
  if (!d || !d.clients) d = JSON.parse(JSON.stringify(DEFAULT_DATA));
  d.business = d.business || "Mi negocio";
  d.products.forEach((p, i) => { if (!p.id) p.id = "p" + i + "-" + Date.now(); });
  if (!d.seeded && !d.movements.length) {
    const day = 86400000, now = Date.now();
    const mv = (client, type, amount, text, ago) => ({
      client, type, amount, text, ts: now - ago * day,
      date: new Date(now - ago * day).toLocaleDateString("es-PA")
    });
    d.movements = [
      mv("María Pérez", "fiado", 15.75, "Víveres", 0),
      mv("Doña Rosa", "pago", 20, "Pago en efectivo", 1),
      mv("Doña Rosa", "fiado", 6.5, "Pan y leche", 2),
      mv("Don Carlos", "fiado", 35, "Compra de la semana", 5)
    ];
  }
  d.seeded = true;
  return d;
}
let data = loadData();
function saveData() { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {} }

/* ---------- Cálculos ---------- */
const totalDebt = () => data.clients.reduce((s, c) => s + c.debt, 0);
function monthSum(type) {
  const now = new Date();
  return data.movements
    .filter(m => m.type === type && new Date(m.ts).getMonth() === now.getMonth() && new Date(m.ts).getFullYear() === now.getFullYear())
    .reduce((s, m) => s + m.amount, 0);
}

/* ---------- Piezas reutilizables ---------- */
let refresh = () => {};

function toast(msg) {
  let t = $(".toast");
  if (!t) { t = h("div", "toast"); t.setAttribute("role", "status"); document.body.append(t); }
  t.textContent = msg;
  t.classList.add("is-show");
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove("is-show"), 2600);
}

function movRow(m) {
  const li = h("li", "row");
  const left = h("div");
  left.append(h("strong", "", m.client), h("small", "", `${m.text} · ${m.date}`));
  const pago = m.type === "pago";
  li.append(left, h("strong", pago ? "pos" : "neg", `${pago ? "−" : "+"} ${money(m.amount)}`));
  return li;
}

function bars(box, items) {
  box.replaceChildren();
  if (!items.length) { box.append(h("p", "empty", "Nada que mostrar todavía.")); return; }
  const max = Math.max(...items.map(i => i.value)) || 1;
  items.forEach(i => {
    const row = h("div", "bar-row"), bar = h("div", "bar"), fill = h("span");
    bar.append(fill);
    row.append(h("span", "", i.label), bar, h("strong", "", money(i.value)));
    box.append(row);
    requestAnimationFrame(() => requestAnimationFrame(() => (fill.style.width = (i.value / max * 100) + "%")));
  });
}

function makeDialog(id, title, body) {
  const d = document.createElement("dialog");
  d.id = id;
  d.className = "modal";
  d.innerHTML = `<div class="modal__box">
    <div class="modal__head"><h2 class="h3">${title}</h2><button class="icon-btn" data-close aria-label="Cerrar">×</button></div>${body}</div>`;
  document.body.append(d);
  d.addEventListener("click", e => { if (e.target === d || e.target.closest("[data-close]")) d.close(); });
  return d;
}

/* ---------- Validación ---------- */
const rules = {
  name: v => v.trim().length >= 2 || "Escribe un nombre válido.",
  biz: v => v.trim().length >= 2 || "Escribe el nombre de tu negocio.",
  phone: v => v.trim() === "" || /^[\d\s+-]{7,}$/.test(v) || "Escribe un teléfono válido.",
  amount: v => Number(v) > 0 || "Escribe un monto mayor a 0.",
  price: v => Number(v) > 0 || "Escribe un precio mayor a 0.",
  client: v => v !== "" || "Elige un cliente."
};
function validate(field) {
  const rule = rules[field.name];
  const res = rule ? rule(field.value) : true;
  const err = $(`.error[data-for="${field.name}"]`, field.form);
  if (err) err.textContent = res === true ? "" : res;
  field.setAttribute("aria-invalid", res !== true);
  return res === true;
}
function handleForm(form, onValid) {
  const fields = $$("input, select", form);
  fields.forEach(f => f.addEventListener("blur", () => validate(f)));
  form.addEventListener("submit", e => {
    e.preventDefault();
    if (fields.map(f => validate(f)).every(Boolean)) onValid(Object.fromEntries(new FormData(form)));
  });
}

/* ---------- Ventana: nuevo movimiento ---------- */
function movementDialog() {
  makeDialog("movDialog", "Nuevo movimiento", `
    <form class="form form--light" id="movForm" novalidate>
      <label for="mv-client">Cliente</label>
      <select id="mv-client" name="client"></select><small class="error" data-for="client"></small>
      <label for="mv-type">Tipo</label>
      <select id="mv-type" name="type"><option value="fiado">Fiado (se lleva algo)</option><option value="pago">Pago (abona)</option></select>
      <label for="mv-amount">Monto (B/.)</label>
      <input id="mv-amount" name="amount" type="number" step="0.01" min="0" inputmode="decimal"><small class="error" data-for="amount"></small>
      <label for="mv-note">Nota (opcional)</label>
      <input id="mv-note" name="note" type="text" maxlength="60">
      <div class="modal__actions"><button type="button" class="btn btn--ghost" data-close>Cancelar</button><button class="btn btn--primary" type="submit">Guardar</button></div>
    </form>`);

  handleForm($("#movForm"), v => {
    const c = data.clients.find(x => x.id === v.client);
    let amount = round2(Number(v.amount));
    if (v.type === "pago") {
      if (c.debt <= 0) { $('#movForm .error[data-for="amount"]').textContent = "Este cliente no tiene saldo pendiente."; return; }
      amount = Math.min(amount, c.debt);
      c.debt = round2(c.debt - amount);
    } else {
      c.debt = round2(c.debt + amount);
    }
    const now = Date.now();
    data.movements.unshift({
      client: c.name, type: v.type, amount, ts: now,
      text: v.note.trim() || (v.type === "pago" ? "Pago" : "Fiado"),
      date: new Date(now).toLocaleDateString("es-PA")
    });
    saveData();
    $("#movDialog").close();
    toast(v.type === "pago" ? `Pago de ${money(amount)} registrado` : `Fiado de ${money(amount)} registrado`);
    refresh();
  });
}

function openMovement(clientId = "", type = "fiado") {
  const sel = $("#mv-client");
  sel.replaceChildren(new Option("Elige un cliente", ""));
  data.clients.forEach(c => sel.add(new Option(c.name, c.id)));
  $("#movForm").reset();
  $$("#movForm .error").forEach(e => (e.textContent = ""));
  sel.value = clientId;
  $("#mv-type").value = type;
  $("#movDialog").showModal();
}

/* ---------- Estructura común ---------- */
function buildNav() {
  $(".sidebar .logo").href = HOME_PAGE;
  const nav = $("#sideNav");
  Object.entries(PANEL).forEach(([key, p]) => {
    const a = document.createElement("a");
    a.href = p.file;
    a.insertAdjacentHTML("afterbegin", `<svg viewBox="0 0 24 24" aria-hidden="true">${p.icon}</svg>`);
    a.append(p.label);
    if (key === document.body.dataset.page) a.setAttribute("aria-current", "page");
    nav.append(a);
  });
  $$("[data-go]").forEach(a => (a.href = PANEL[a.dataset.go].file));
}

function shell() {
  buildNav();
  $("#userName").textContent = session.name;
  $("#bizName").textContent = data.business;

  const side = $("#sidebar"), scrim = $("#scrim"), btn = $("#menuBtn");
  const setMenu = open => {
    side.classList.toggle("is-open", open);
    scrim.classList.toggle("is-open", open);
    btn.setAttribute("aria-expanded", open);
  };
  btn.addEventListener("click", () => setMenu(!side.classList.contains("is-open")));
  scrim.addEventListener("click", () => setMenu(false));

  $("#logout").addEventListener("click", () => {
    try { localStorage.removeItem(SKEY); } catch (e) {}
    location.href = HOME_PAGE;
  });

  movementDialog();
  $("#newMov").addEventListener("click", () => openMovement());
}

/* ========== RESUMEN ========== */
function pageDashboard() {
  $("#greet").textContent = `Hola, ${session.name}`;
  $("#quickFiar").addEventListener("click", () => openMovement("", "fiado"));
  $("#quickPago").addEventListener("click", () => openMovement("", "pago"));

  refresh = () => {
    const set = (id, val) => animateNumber($(id), parseFloat($(id).textContent) || 0, val);
    set("#sTotal", totalDebt());
    set("#sPaid", monthSum("pago"));
    set("#sCredit", monthSum("fiado"));
    $("#sCount").textContent = data.clients.filter(c => c.debt > 0).length;

    const recent = $("#recent");
    recent.replaceChildren();
    if (!data.movements.length) recent.append(h("li", "empty", "Aún no hay movimientos. Registra el primero."));
    data.movements.slice(0, 5).forEach(m => recent.append(movRow(m)));

    bars($("#top"), data.clients.filter(c => c.debt > 0).sort((a, b) => b.debt - a.debt).slice(0, 4).map(c => ({ label: c.name, value: c.debt })));
  };
  refresh();
}

/* ========== FIADOS ========== */
function pageFiados() {
  let filter = "todos", q = "";
  refresh = () => {
    const list = $("#movList");
    const items = data.movements.filter(m =>
      (filter === "todos" || m.type === filter) && m.client.toLowerCase().includes(q));
    list.replaceChildren();
    if (!items.length) list.append(h("li", "empty", "No hay movimientos con ese filtro."));
    items.forEach(m => list.append(movRow(m)));
    $("#movCount").textContent = `${items.length} movimiento${items.length === 1 ? "" : "s"}`;
  };
  $$("[data-filter]").forEach(b => b.addEventListener("click", () => {
    filter = b.dataset.filter;
    $$("[data-filter]").forEach(x => {
      x.classList.toggle("is-active", x === b);
      x.setAttribute("aria-selected", x === b);
    });
    refresh();
  }));
  $("#movSearch").addEventListener("input", e => { q = e.target.value.trim().toLowerCase(); refresh(); });
  refresh();
}

/* ========== CLIENTES ========== */
function pageClientes() {
  makeDialog("clientDialog", "Agregar cliente", `
    <form class="form form--light" id="clientForm" novalidate>
      <label for="cl-name">Nombre</label>
      <input id="cl-name" name="name" type="text" autocomplete="off"><small class="error" data-for="name"></small>
      <label for="cl-phone">Teléfono (opcional)</label>
      <input id="cl-phone" name="phone" type="tel" placeholder="6000-0000"><small class="error" data-for="phone"></small>
      <div class="modal__actions"><button type="button" class="btn btn--ghost" data-close>Cancelar</button><button class="btn btn--primary" type="submit">Agregar</button></div>
    </form>`);
  handleForm($("#clientForm"), v => {
    data.clients.push({ id: "c" + Date.now(), name: v.name.trim(), phone: v.phone.trim(), debt: 0 });
    saveData();
    $("#clientForm").reset();
    $("#clientDialog").close();
    toast("Cliente agregado");
    refresh();
  });
  $("#addClient").addEventListener("click", () => $("#clientDialog").showModal());

  const search = $("#clientSearch");
  refresh = () => {
    const q = search.value.trim().toLowerCase();
    const list = $("#clientList");
    list.replaceChildren();
    const items = data.clients.filter(c => c.name.toLowerCase().includes(q));
    if (!items.length) list.append(h("li", "empty", "No encontramos clientes con ese nombre."));
    items.forEach(c => {
      const li = h("li", "row");
      const left = h("div");
      left.append(h("strong", "", c.name), h("small", "", c.phone || "Sin teléfono"));
      const end = h("div", "row__end");
      end.append(h("span", c.debt > 0 ? "badge" : "badge is-paid", c.debt > 0 ? `Debe ${money(c.debt)}` : "Al día"));
      const fiar = h("button", "btn btn--ghost btn--sm", "Fiar");
      fiar.addEventListener("click", () => openMovement(c.id, "fiado"));
      end.append(fiar);
      if (c.debt > 0) {
        const pay = h("button", "btn btn--pay btn--sm", "Cobrar");
        pay.addEventListener("click", () => openMovement(c.id, "pago"));
        end.append(pay);
      }
      const del = h("button", "btn btn--danger btn--sm", "Eliminar");
      del.addEventListener("click", () => {
        if (!confirm(`¿Eliminar a ${c.name}? Su historial de movimientos se conserva.`)) return;
        data.clients = data.clients.filter(x => x.id !== c.id);
        saveData();
        toast("Cliente eliminado");
        refresh();
      });
      end.append(del);
      li.append(left, end);
      list.append(li);
    });
  };
  search.addEventListener("input", refresh);
  refresh();
}

/* ========== PRODUCTOS ========== */
function pageProductos() {
  makeDialog("productDialog", "Agregar producto", `
    <form class="form form--light" id="productForm" novalidate>
      <label for="pr-name">Nombre</label>
      <input id="pr-name" name="name" type="text" autocomplete="off"><small class="error" data-for="name"></small>
      <label for="pr-price">Precio (B/.)</label>
      <input id="pr-price" name="price" type="number" step="0.01" min="0" inputmode="decimal"><small class="error" data-for="price"></small>
      <div class="modal__actions"><button type="button" class="btn btn--ghost" data-close>Cancelar</button><button class="btn btn--primary" type="submit">Agregar</button></div>
    </form>`);
  handleForm($("#productForm"), v => {
    data.products.push({ id: "p" + Date.now(), name: v.name.trim(), price: round2(Number(v.price)) });
    saveData();
    $("#productForm").reset();
    $("#productDialog").close();
    toast("Producto agregado");
    refresh();
  });
  $("#addProduct").addEventListener("click", () => $("#productDialog").showModal());

  const search = $("#productSearch");
  refresh = () => {
    const q = search.value.trim().toLowerCase();
    const grid = $("#productGrid");
    grid.replaceChildren();
    const items = data.products.filter(p => p.name.toLowerCase().includes(q));
    if (!items.length) grid.append(h("p", "empty", "No encontramos ese producto."));
    items.forEach(p => {
      const card = h("div", "card");
      const del = h("button", "btn btn--danger btn--sm", "Eliminar");
      del.addEventListener("click", () => {
        data.products = data.products.filter(x => x.id !== p.id);
        saveData();
        toast("Producto eliminado");
        refresh();
      });
      card.append(h("strong", "", p.name), h("p", "price", money(p.price)), del);
      grid.append(card);
    });
  };
  search.addEventListener("input", refresh);
  refresh();
}

/* ========== REPORTES ========== */
function pageReportes() {
  refresh = () => {
    const set = (id, val) => animateNumber($(id), parseFloat($(id).textContent) || 0, val, 900);
    set("#rTotal", totalDebt());
    set("#rPaid", monthSum("pago"));
    set("#rCredit", monthSum("fiado"));
    $("#rCount").textContent = data.clients.filter(c => c.debt > 0).length;
    bars($("#rBars"), data.clients.filter(c => c.debt > 0).sort((a, b) => b.debt - a.debt).map(c => ({ label: c.name, value: c.debt })));
    bars($("#rMonth"), [{ label: "Fiado", value: monthSum("fiado") }, { label: "Pagos", value: monthSum("pago") }]);
  };
  refresh();

  $("#exportBtn").addEventListener("click", () => {
    const esc = s => { s = String(s); if (/^[=+\-@]/.test(s)) s = "'" + s; return '"' + s.replace(/"/g, '""') + '"'; };
    const rows = [["Cliente", "Teléfono", "Saldo (B/.)"], ...data.clients.map(c => [c.name, c.phone, c.debt.toFixed(2)])];
    const csv = "\ufeff" + rows.map(r => r.map(esc).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    a.download = "clientes-fiao.csv";
    a.click();
    URL.revokeObjectURL(a.href);
    toast("Reporte descargado");
  });
}

/* ========== CONFIGURACIÓN ========== */
function pageConfig() {
  $("#biz").value = data.business;
  $("#uname").value = session.name;
  handleForm($("#settingsForm"), v => {
    data.business = v.biz.trim();
    session.name = v.name.trim();
    saveData();
    try { localStorage.setItem(SKEY, JSON.stringify(session)); } catch (e) {}
    $("#bizName").textContent = data.business;
    $("#userName").textContent = session.name;
    toast("Cambios guardados");
  });
  $("#resetBtn").addEventListener("click", () => {
    if (!confirm("¿Borrar todos tus datos y volver a los de ejemplo?")) return;
    try { localStorage.removeItem(KEY); } catch (e) {}
    location.reload();
  });
}

/* ========== INICIO ========== */
const pages = { dashboard: pageDashboard, fiados: pageFiados, clientes: pageClientes, productos: pageProductos, reportes: pageReportes, config: pageConfig };
if (!session) {
  location.replace(LOGIN_PAGE);
} else {
  saveData();
  shell();
  const init = pages[document.body.dataset.page];
  if (init) init();
}