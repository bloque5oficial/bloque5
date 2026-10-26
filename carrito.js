/* Bloque 5 - carrito de solicitudes: correo o WhatsApp, sin cobros en la web */
(() => {
  'use strict';
  const STORAGE_KEY = 'bloque5_carrito_v1';
  const EMAIL = 'bloque5oficial@gmail.com';
  // OPCIONAL: añade el número de WhatsApp del negocio en formato internacional.
  // Ejemplo: '34600111222'. Dejar vacío permite compartir el mensaje eligiendo destinatario.
  const WHATSAPP_NUMBER = '34671165672';
  const MAX_QUANTITY = 10;
  const money = cents => (cents / 100).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
  const cards = [...document.querySelectorAll('.producto[data-id]')];
  const catalog = new Map(cards.map(card => [card.dataset.id, {
    name: card.dataset.name,
    price: Math.round(Number(card.dataset.price) * 100),
    image: card.dataset.image,
    sizes: [...card.querySelectorAll('.talla-producto option')].map(o => o.value).filter(Boolean)
  }]));
  const panel = document.getElementById('carrito-panel');
  const overlay = document.getElementById('carrito-fondo');
  const list = document.getElementById('carrito-lista');
  const counter = document.getElementById('carrito-contador');
  const total = document.getElementById('carrito-total');
  const sendLink = document.getElementById('enviar-carrito');
  const whatsappLink = document.getElementById('enviar-whatsapp');
  const whatsappInstructions = document.getElementById('instruccion-whatsapp');
  const copyButton = document.getElementById('copiar-carrito');
  const aviso = document.getElementById('carrito-aviso');
  const openButton = document.getElementById('abrir-carrito');
  const closeButton = document.getElementById('cerrar-carrito');
  let cart = [];
  let avisoTimeout;

  function loadCart() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      if (Array.isArray(saved)) {
        cart = saved.filter(item => catalog.has(item.id) &&
          catalog.get(item.id).sizes.includes(item.size) &&
          Number.isInteger(item.qty) && item.qty >= 1 && item.qty <= MAX_QUANTITY)
          .map(item => ({ id: item.id, size: item.size, qty: item.qty }));
      }
    } catch (_) { cart = []; }
  }
  function saveCart() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)); } catch (_) { /* Navegación privada */ }
  }
  function notify(message) {
    clearTimeout(avisoTimeout);
    aviso.textContent = message;
    aviso.classList.add('visible');
    avisoTimeout = setTimeout(() => aviso.classList.remove('visible'), 2600);
  }
  function openCart() {
    overlay.hidden = false;
    panel.classList.add('abierto');
    panel.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    closeButton.focus();
  }
  function closeCart() {
    panel.classList.remove('abierto');
    panel.setAttribute('aria-hidden', 'true');
    overlay.hidden = true;
    document.body.style.overflow = '';
    openButton.focus();
  }
  function orderText() {
    let subtotal = 0;
    const lines = cart.map(item => {
      const prod = catalog.get(item.id);
      const lineTotal = prod.price * item.qty;
      subtotal += lineTotal;
      return `- ${prod.name} | Talla ${item.size} | ${item.qty} ud. x ${money(prod.price)} = ${money(lineTotal)}`;
    });
    return [
      'Hola, Bloque 5:', '',
      'Quisiera consultar disponibilidad y condiciones para estos artículos:', '',
      ...lines, '',
      `Subtotal orientativo: ${money(subtotal)}`,
      'Gastos de envío: pendientes de confirmar', '',
      '¿Podéis confirmarme el stock, precio final con envío y cómo acordar el pago por Bizum o transferencia?', '',
      'Gracias.'
    ].join('\n');
  }
  function changeQty(index, delta) {
    const item = cart[index];
    if (!item) return;
    const next = item.qty + delta;
    if (next <= 0) cart.splice(index, 1);
    else if (next <= MAX_QUANTITY) item.qty = next;
    else return notify(`Máximo ${MAX_QUANTITY} unidades por talla`);
    refresh();
  }
  function refresh() {
    saveCart();
    list.replaceChildren();
    let subtotal = 0;
    let n = 0;
    cart.forEach((item, index) => {
      const prod = catalog.get(item.id);
      const lineAmount = prod.price * item.qty;
      subtotal += lineAmount;
      n += item.qty;
      const row = document.createElement('div');
      row.className = 'carrito-linea';
      const img = document.createElement('img');
      img.src = prod.image;
      img.alt = '';
      const info = document.createElement('div');
      info.className = 'carrito-info';
      const name = document.createElement('strong');
      name.textContent = prod.name;
      const details = document.createElement('small');
      details.textContent = `Talla: ${item.size} · ${money(lineAmount)}`;
      const controls = document.createElement('div');
      controls.className = 'carrito-controles';
      const minus = document.createElement('button');
      minus.textContent = '−';
      minus.type = 'button';
      minus.setAttribute('aria-label', `Quitar unidad de ${prod.name}, talla ${item.size}`);
      minus.addEventListener('click', () => changeQty(index, -1));
      const quantity = document.createElement('span');
      quantity.textContent = String(item.qty);
      const plus = document.createElement('button');
      plus.textContent = '+';
      plus.type = 'button';
      plus.setAttribute('aria-label', `Añadir unidad de ${prod.name}, talla ${item.size}`);
      plus.addEventListener('click', () => changeQty(index, 1));
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'eliminar';
      remove.textContent = 'Eliminar';
      remove.setAttribute('aria-label', `Eliminar ${prod.name}, talla ${item.size}`);
      remove.addEventListener('click', () => { cart.splice(index, 1); refresh(); });
      controls.append(minus, quantity, plus, remove);
      info.append(name, details, controls);
      row.append(img, info);
      list.append(row);
    });
    if (!cart.length) {
      const empty = document.createElement('p');
      empty.className = 'carrito-vacio';
      empty.textContent = 'Todavía no has añadido productos a tu selección.';
      list.append(empty);
    }
    counter.textContent = String(n);
    total.textContent = money(subtotal);
    sendLink.href = cart.length ? `mailto:${EMAIL}?subject=${encodeURIComponent('Consulta de productos - Bloque 5')}&body=${encodeURIComponent(orderText())}` : '#';
    const whatsappRecipient = /^\d{8,15}$/.test(WHATSAPP_NUMBER) ? WHATSAPP_NUMBER : '';
    whatsappLink.href = cart.length ? `https://wa.me/${whatsappRecipient}?text=${encodeURIComponent(orderText())}` : '#';
    whatsappLink.classList.toggle('desactivado', !cart.length);
    whatsappLink.setAttribute('aria-disabled', String(!cart.length));
    whatsappLink.textContent = whatsappRecipient ? 'Consultar por WhatsApp' : 'Compartir por WhatsApp';
    whatsappInstructions.hidden = Boolean(whatsappRecipient);
    sendLink.classList.toggle('desactivado', !cart.length);
    sendLink.setAttribute('aria-disabled', String(!cart.length));
    copyButton.disabled = !cart.length;
  }

  cards.forEach(card => {
    card.querySelector('.btn-anadir').addEventListener('click', () => {
      const size = card.querySelector('.talla-producto').value;
      const input = card.querySelector('.cantidad-producto');
      const qty = Number(input.value);
      if (!size) { card.querySelector('.talla-producto').focus(); return notify('Selecciona una talla'); }
      if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QUANTITY) {
        input.focus(); return notify(`Indica entre 1 y ${MAX_QUANTITY} unidades`);
      }
      const existing = cart.find(item => item.id === card.dataset.id && item.size === size);
      if (existing && existing.qty + qty > MAX_QUANTITY) return notify(`Máximo ${MAX_QUANTITY} unidades por talla`);
      if (existing) existing.qty += qty;
      else cart.push({ id: card.dataset.id, size, qty });
      refresh();
      notify('Producto añadido al carrito');
      openCart();
    });
  });
  openButton.addEventListener('click', openCart);
  closeButton.addEventListener('click', closeCart);
  overlay.addEventListener('click', closeCart);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && panel.classList.contains('abierto')) closeCart(); });
  sendLink.addEventListener('click', e => { if (!cart.length) e.preventDefault(); });
  whatsappLink.addEventListener('click', e => { if (!cart.length) e.preventDefault(); });
  copyButton.addEventListener('click', async () => {
    if (!cart.length) return;
    try { await navigator.clipboard.writeText(orderText()); notify('Resumen copiado'); }
    catch (_) { notify('No se pudo copiar; usa la opción de email'); }
  });
  loadCart();
  refresh();
})();
