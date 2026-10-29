/* ========== UTILIDADES ========== */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* ========== ENCABEZADO: fondo al hacer scroll ========== */
const header = $("#header");
const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 10);
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

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
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });

$$(".reveal").forEach((el, i) => {
  el.style.transitionDelay = `${(i % 3) * 90}ms`; // pequeño escalonado
  observer.observe(el);
});

/* ========== DEMO DE LA LIBRETA ========== */
const amountEl = $("#amount");
const badge = $("#badge");
const list = $("#movements");
let debt = 48.5;
let shown = debt;

const money = n => n.toFixed(2);

// Anima el número de una cantidad a otra
function animateNumber(from, to, duration = 500) {
  const start = performance.now();
  function frame(now) {
    const t = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - t, 3);
    shown = from + (to - from) * eased;
    amountEl.textContent = money(shown);
    if (t < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

function updateState() {
  const paid = debt <= 0;
  amountEl.parentElement.classList.toggle("is-paid", paid);
  badge.classList.toggle("is-paid", paid);
  badge.textContent = paid ? "Al día" : "Con saldo";
}

function addMovement(text, value, isPayment) {
  const li = document.createElement("li");
  const label = document.createElement("span");
  const amount = document.createElement("strong");
  label.textContent = text;
  amount.textContent = `${isPayment ? "−" : "+"} B/. ${money(value)}`;
  amount.className = isPayment ? "pos" : "neg";
  li.append(label, amount);
  list.prepend(li);
  if (list.children.length > 4) list.lastElementChild.remove();
}

function change(delta, text) {
  const next = Math.max(0, debt + delta);
  const applied = Math.abs(next - debt);
  if (applied === 0) return;
  animateNumber(shown, next);
  debt = next;
  addMovement(text, applied, delta < 0);
  updateState();
}

$("#payBtn").addEventListener("click", () => change(-10, "Pago registrado"));
$("#creditBtn").addEventListener("click", () => change(5, "Producto fiado"));

/* ========== PESTAÑAS DE FUNCIONES ========== */
const tabs = $$(".tab");
const panels = $$(".panel");

function showTab(name) {
  tabs.forEach(t => {
    const active = t.dataset.tab === name;
    t.classList.toggle("is-active", active);
    t.setAttribute("aria-selected", active);
  });
  panels.forEach(p => p.classList.toggle("is-active", p.dataset.panel === name));
}
tabs.forEach(t => t.addEventListener("click", () => showTab(t.dataset.tab)));

// Los enlaces del menú (Crédito, Clientes...) abren su pestaña
$$("#nav a[data-tab]").forEach(a =>
  a.addEventListener("click", () => showTab(a.dataset.tab))
);

/* ========== FORMULARIO DE CONTACTO ========== */
const form = $("#form");
const okMsg = $("#formOk");

const rules = {
  name: v => v.trim().length >= 2 || "Escribe tu nombre.",
  email: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || "Escribe un correo válido, por ejemplo nombre@correo.com.",
  message: v => v.trim().length >= 10 || "Cuéntanos un poco más (mínimo 10 caracteres)."
};

function validate(field) {
  const result = rules[field.name](field.value);
  const errorEl = $(`.error[data-for="${field.name}"]`, form);
  errorEl.textContent = result === true ? "" : result;
  field.setAttribute("aria-invalid", result !== true);
  return result === true;
}

$$("input, textarea", form).forEach(f => f.addEventListener("blur", () => validate(f)));

form.addEventListener("submit", e => {
  e.preventDefault();
  const valid = $$("input, textarea", form).map(validate).every(Boolean);
  if (!valid) return;
  // Aquí conectarías tu servicio real (Formspree, EmailJS, tu API...)
  form.reset();
  okMsg.hidden = false;
});