/* ===== NOMBRES DE LAS PÁGINAS DEL SITIO PÚBLICO =====
   Escribe aquí el nombre EXACTO de cada archivo como está en tu carpeta HTML
   (mayúsculas y guiones incluidos). El menú y las tarjetas del inicio se
   actualizan solos; no hay que editar enlaces en cada página. */
const SITE_PAGES = {
  "Inicio":    "Index Fiao.html",
  "Fiados":    "Fiados App.html",
  "Clientes":  "Clientes App.html",
  "Productos": "Productos App.html",
  "Reportes":  "Reportes App.html",
  "Contacto":  "Contacto App.html"
};

/* ========== UTILIDADES ========== */
function $(sel, ctx = document) {
  return ctx.querySelector(sel);
}
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const money = n => "B/. " + Number(n).toFixed(2);
const round2 = n => Math.round(n * 100) / 100;

// Crea un elemento con texto seguro (evita inyectar HTML)
function h(tag, cls, text) {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  if (text !== undefined) el.textContent = text;
  return el;
}

// Anima un número de un valor a otro
function animateNumber(el, from, to, duration = 600) {
  const start = performance.now();
  (function frame(now) {
    const t = Math.min((now - start) / duration, 1);
    el.textContent = (from + (to - from) * (1 - Math.pow(1 - t, 3))).toFixed(2);
    if (t < 1) requestAnimationFrame(frame);
  })(start);
}

/* ========== ENLACES DEL SITIO (usa el bloque SITE_PAGES de arriba) ========== */
$$(".nav > a").forEach(a => {
  const file = SITE_PAGES[a.textContent.trim()];
  if (file) a.href = file;
});
$$("a.card").forEach(a => {
  const title = $("h3", a);
  const file = title && SITE_PAGES[title.textContent.trim()];
  if (file) a.href = file;
});

/* ========== ENCABEZADO ========== */
const header = $("#header");
const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 10);
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

// Barra de progreso de lectura
const progress = h("div", "progress");
header.append(progress);
window.addEventListener("scroll", () => {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  progress.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
}, { passive: true });

// Si ya iniciaste sesión, el menú te lleva a tu panel
try {
  if (localStorage.getItem("fiao-session")) {
    const act = $(".nav__actions");
    const go = h("a", "btn btn--primary", "Ir a mi panel");
    go.href = "app/dashboard.html";
    act.replaceChildren(go);
  }
} catch (e) {}

/* ========== MENÚ MÓVIL ========== */
const burger = $("#burger");
const nav = $("#nav");
function setMenu(open) {
  nav.classList.toggle("is-open", open);
  burger.setAttribute("aria-expanded", open);
  burger.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
}
burger.addEventListener("click", () => setMenu(!nav.classList.contains("is-open")));
$$("#nav a").forEach(a => a.addEventListener("click", () => setMenu(false)));

/* ========== ANIMACIÓN AL HACER SCROLL ========== */
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add("is-visible"); observer.unobserve(e.target); }
  });
}, { threshold: 0.15 });
$$(".reveal").forEach((el, i) => {
  el.style.transitionDelay = `${(i % 3) * 90}ms`;
  observer.observe(el);
});

/* ========== DATOS DE EJEMPLO (se guardan en tu navegador) ========== */
const DEFAULT_DATA = {
  clients: [
    { id: "c1", name: "Doña Rosa", phone: "6000-1111", debt: 48.5 },
    { id: "c2", name: "Don Carlos", phone: "6000-2222", debt: 120 },
    { id: "c3", name: "María Pérez", phone: "6000-3333", debt: 15.75 },
    { id: "c4", name: "Tienda La Esquina", phone: "6000-4444", debt: 0 }
  ],
  products: [
    { name: "Pan", price: 0.25 }, { name: "Leche", price: 1.75 },
    { name: "Arroz (1 lb)", price: 0.65 }, { name: "Aceite", price: 2.8 },
    { name: "Huevos (docena)", price: 2.9 }, { name: "Refresco", price: 1 },
    { name: "Café", price: 3.5 }, { name: "Azúcar (1 lb)", price: 0.8 }
  ],
  movements: []
};
const KEY = "fiao-data";
function loadData() {
  try { const d = JSON.parse(localStorage.getItem(KEY)); if (d && d.clients) return d; } catch (e) {}
  return JSON.parse(JSON.stringify(DEFAULT_DATA));
}
function saveData() { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {} }
let data = loadData();

/* ========== FORMULARIOS (validación general) ========== */
const rules = {
  name: v => v.trim().length >= 2 || "Escribe un nombre válido.",
  email: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || "Escribe un correo válido, por ejemplo nombre@correo.com.",
  message: v => v.trim().length >= 10 || "Cuéntanos un poco más (mínimo 10 caracteres).",
  password: v => v.length >= 6 || "La contraseña debe tener al menos 6 caracteres.",
  confirm: (v, f) => v === f.elements.password.value || "Las contraseñas no coinciden.",
  amount: v => Number(v) > 0 || "Escribe un monto mayor a 0.",
  phone: v => v.trim() === "" || /^[\d\s+-]{7,}$/.test(v) || "Escribe un teléfono válido.",
  client: v => v !== "" || "Elige un cliente."
};

function validate(field) {
  const rule = rules[field.name];
  const res = rule ? rule(field.value, field.form) : true;
  const err = $(`.error[data-for="${field.name}"]`, field.form);
  if (err) err.textContent = res === true ? "" : res;
  field.setAttribute("aria-invalid", res !== true);
  return res === true;
}

function handleForm(form, onValid) {
  if (!form) return;
  const fields = $$("input, textarea, select", form);
  fields.forEach(f => f.addEventListener("blur", () => validate(f)));
  form.addEventListener("submit", e => {
    e.preventDefault();
    const ok = fields.map(f => validate(f)).every(Boolean);
    if (ok) onValid(Object.fromEntries(new FormData(form)));
  });
}

function showOk(form) {
  const ok = $(".form__ok", form);
  if (ok) { ok.hidden = false; setTimeout(() => (ok.hidden = true), 4000); }
}

function fillClients(select) {
  select.replaceChildren(new Option("Elige un cliente", ""));
  data.clients.forEach(c => select.add(new Option(c.name, c.id)));
}

/* ========== INICIO: libreta de demostración ========== */
function initHome() {
  const amountEl = $("#amount"), badge = $("#badge"), list = $("#movements");
  if (!amountEl) return;
  let debt = 48.5;

  function change(delta, text) {
    const next = Math.max(0, round2(debt + delta));
    const applied = Math.abs(next - debt);
    if (!applied) return;
    animateNumber(amountEl, debt, next, 500);
    const paid = next === 0;
    amountEl.parentElement.classList.toggle("is-paid", paid);
    badge.classList.toggle("is-paid", paid);
    badge.textContent = paid ? "Al día" : "Con saldo";
    const li = h("li");
    const strong = h("strong", delta < 0 ? "pos" : "neg", `${delta < 0 ? "−" : "+"} ${money(applied)}`);
    li.append(h("span", "", text), strong);
    list.prepend(li);
    if (list.children.length > 4) list.lastElementChild.remove();
    debt = next;
  }
  $("#payBtn").addEventListener("click", () => change(-10, "Pago registrado"));
  $("#creditBtn").addEventListener("click", () => change(5, "Producto fiado"));
}

/* ========== FIADOS ========== */
function initFiados() {
  const form = $("#movForm");
  fillClients($("#client"));
  const list = $("#movList"), total = $("#totalDebt");

  function render() {
    total.textContent = money(data.clients.reduce((s, c) => s + c.debt, 0));
    list.replaceChildren();
    if (!data.movements.length) { list.append(h("li", "empty", "Aún no hay movimientos. Registra el primero.")); return; }
    data.movements.slice(0, 8).forEach(m => {
      const li = h("li", "row");
      const left = h("div");
      left.append(h("strong", "", m.client), h("small", "", `${m.text} · ${m.date}`));
      li.append(left, h("strong", m.type === "pago" ? "pos" : "neg", `${m.type === "pago" ? "−" : "+"} ${money(m.amount)}`));
      list.append(li);
    });
  }

  handleForm(form, v => {
    const c = data.clients.find(x => x.id === v.client);
    let amount = round2(Number(v.amount));
    if (v.type === "pago") {
      if (c.debt <= 0) { $('.error[data-for="amount"]', form).textContent = "Este cliente no tiene saldo pendiente."; return; }
      amount = Math.min(amount, c.debt);
      c.debt = round2(c.debt - amount);
    } else {
      c.debt = round2(c.debt + amount);
    }
    data.movements.unshift({
      client: c.name, type: v.type, amount,
      text: v.note.trim() || (v.type === "pago" ? "Pago" : "Fiado"),
      date: new Date().toLocaleDateString("es-PA")
    });
    saveData();
    form.reset();
    render();
    showOk(form);
  });
  render();
}

/* ========== CLIENTES ========== */
function initClientes() {
  const list = $("#clientList"), search = $("#clientSearch");

  function render() {
    const q = search.value.trim().toLowerCase();
    const items = data.clients.filter(c => c.name.toLowerCase().includes(q));
    list.replaceChildren();
    if (!items.length) { list.append(h("li", "empty", "No encontramos clientes con ese nombre.")); return; }
    items.forEach(c => {
      const li = h("li", "row");
      const left = h("div");
      left.append(h("strong", "", c.name), h("small", "", c.phone || "Sin teléfono"));
      const badge = h("span", c.debt > 0 ? "badge" : "badge is-paid", c.debt > 0 ? `Debe ${money(c.debt)}` : "Al día");
      li.append(left, badge);
      list.append(li);
    });
  }
  search.addEventListener("input", render);
  handleForm($("#clientForm"), v => {
    data.clients.push({ id: "c" + Date.now(), name: v.name.trim(), phone: v.phone.trim(), debt: 0 });
    saveData();
    $("#clientForm").reset();
    render();
    showOk($("#clientForm"));
  });
  render();
}

/* ========== PRODUCTOS ========== */
function initProductos() {
  const grid = $("#productGrid"), search = $("#productSearch");
  function render() {
    const q = search.value.trim().toLowerCase();
    const items = data.products.filter(p => p.name.toLowerCase().includes(q));
    grid.replaceChildren();
    if (!items.length) { grid.append(h("p", "empty", "No encontramos ese producto.")); return; }
    items.forEach(p => {
      const card = h("div", "card");
      card.append(h("strong", "", p.name), h("p", "price", money(p.price)));
      grid.append(card);
    });
  }
  search.addEventListener("input", render);
  render();
}

/* ========== REPORTES ========== */
function initReportes() {
  const withDebt = data.clients.filter(c => c.debt > 0).sort((a, b) => b.debt - a.debt);
  const total = data.clients.reduce((s, c) => s + c.debt, 0);
  animateNumber($("#repTotal"), 0, total, 900);
  $("#repCount").textContent = withDebt.length;
  $("#repTop").textContent = withDebt.length ? withDebt[0].name : "Nadie";

  const bars = $("#bars");
  bars.replaceChildren();
  if (!withDebt.length) bars.append(h("p", "empty", "Nadie tiene saldo pendiente."));
  const max = withDebt.length ? withDebt[0].debt : 1;
  withDebt.forEach(c => {
    const row = h("div", "bar-row");
    const bar = h("div", "bar"), fill = h("span");
    bar.append(fill);
    row.append(h("span", "", c.name), bar, h("strong", "", money(c.debt)));
    bars.append(row);
    requestAnimationFrame(() => requestAnimationFrame(() => (fill.style.width = (c.debt / max * 100) + "%")));
  });

  $("#resetBtn").addEventListener("click", () => {
    try { localStorage.removeItem(KEY); } catch (e) {}
    location.reload();
  });
}

/* ========== CONTACTO, LOGIN Y REGISTRO ========== */
function initSimpleForm() {
  const form = $("#form");
  handleForm(form, v => {
    // Login y registro: crea una sesión de demostración y entra al panel
    if (form.dataset.auth) {
      const name = (v.name || v.email.split("@")[0]).trim();
      try { localStorage.setItem("fiao-session", JSON.stringify({ name, email: v.email })); } catch (e) {}
      showOk(form);
      setTimeout(() => (location.href = "app/dashboard.html"), 600);
      return;
    }
    form.reset();
    showOk(form);
  });
}

/* ========== INICIAR LA PÁGINA CORRECTA ========== */
const pages = { home: initHome, fiados: initFiados, clientes: initClientes, productos: initProductos, reportes: initReportes, simple: initSimpleForm };
const init = pages[document.body.dataset.page];
if (init) init();