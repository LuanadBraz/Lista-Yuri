const API_URL = "https://lista-yuri-api-luana-yuri-2026.onrender.com";
const UPDATE_INTERVAL_MS = 5000;

const IS_LOCAL_FILE = window.location.protocol === "file:";
const LOCAL_PURCHASED_KEY = "yuri-purchased-items-v2";
const LOCAL_RESERVATIONS_KEY = "yuri-reservations-v2";

const initialItems = [
  {
    id: "frascos-leite",
    name: "Frascos para leite",
    description: "Frascos para armazenar leite materno.",
    image: "img/frascos-leite.jpeg",
    link: "https://br.shp.ee/cCvz1cPs"
  },
  {
    id: "sling",
    name: "Sling",
    description: "Para carregar o bebê com conforto e proximidade.",
    image: "img/sling.jpeg",
    link: "https://br.shp.ee/QAXh46BA"
  },
  {
    id: "almofada-ninho",
    name: "Almofada de amamentação e ninho",
    description: "Conforto para a amamentação e descanso do bebê.",
    image: "img/almofada-ninho.jpeg",
    link: "https://br.shp.ee/Dbo53TVT"
  },
  {
    id: "bodys",
    name: "Pelo menos 5 bodys manga curta RN e P",
    description: "Tamanhos recém-nascido e pequeno.",
    image: "img/bodys.jpeg",
    link: "https://br.shp.ee/mxQtJ93A"
  },
  {
    id: "bomba-leite",
    name: "Bomba de tirar leite",
    description: "Para auxiliar na extração do leite materno.",
    image: "img/bomba-leite.jpeg",
    link: "https://br.shp.ee/UJFy3CSb"
  },
  {
    id: "poltrona",
    name: "Poltrona de amamentação — cinza escuro",
    description: "Modelo confortável na cor cinza escuro.",
    image: "img/poltrona.jpeg",
    link: "https://br.shp.ee/CoJs9ite"
  },
  {
    id: "fraldas-rn",
    name: "Fraldas tamanho RN",
    description: "Pelo menos 2 pacotes.",
    image: "img/fraldas.jpeg",
    link: ""
  },
  {
    id: "fraldas-p",
    name: "Fraldas tamanho P",
    description: "Pelo menos 2 pacotes.",
    image: "img/fraldas.jpeg",
    link: ""
  },
  {
    id: "pomada",
    name: "Pomada para prevenção de assaduras",
    description: "Produto indicado para uso preventivo.",
    image: "img/pomada.jpeg",
    link: ""
  },
  {
    id: "lencos",
    name: "Lenços umedecidos",
    description: "Preferencialmente suaves e próprios para recém-nascidos.",
    image: "img/lenco.jpeg",
    link: ""
  },
  {
    id: "babadores",
    name: "Babadores",
    description: "Babadores macios.",
    image: "img/babador.jpeg",
    link: ""
  },
  {
    id: "mijoes",
    name: "Mijões (calças) RN e P",
    description: "Calças confortáveis nos tamanhos RN e P.",
    image: "img/mijao.jpeg",
    link: ""
  },
  {
    id: "macacao",
    name: "Macacão RN e P",
    description: "Macacões nos tamanhos RN e P.",
    image: "img/macacao.jpeg",
    link: ""
  },
  {
    id: "protetor-colchao",
    name: "Protetor de colchão impermeável",
    description: "Para proteger o colchão do berço.",
    image: "img/protetor.jpg",
    link: ""
  }
];

let purchasedIds = [];
let reservations = {};
let selectedReservationItemId = null;
let isSaving = false;

const shoppingList = document.querySelector("#shoppingList");
const purchasedList = document.querySelector("#purchasedList");
const shoppingEmpty = document.querySelector("#shoppingEmpty");
const purchasedEmpty = document.querySelector("#purchasedEmpty");
const shoppingCount = document.querySelector("#shoppingCount");
const purchasedCount = document.querySelector("#purchasedCount");
const shoppingTabCount = document.querySelector("#shoppingTabCount");
const purchasedTabCount = document.querySelector("#purchasedTabCount");
const itemTemplate = document.querySelector("#itemTemplate");

const reservationModal = document.querySelector("#reservationModal");
const reservationForm = document.querySelector("#reservationForm");
const reservationName = document.querySelector("#reservationName");
const modalItemName = document.querySelector("#modalItemName");

/* ==================================================
   CONTADOR AUTOMÁTICO DAS SEMANAS DE GESTAÇÃO
   ================================================== */

function atualizarSemanaGestacao() {
  const elementoSemana = document.querySelector("#gestationWeek");

  if (!elementoSemana) return;

  // Segunda-feira, 20/07/2026 = 29 semanas.
  const dataReferencia = new Date(2026, 6, 20, 12, 0, 0);
  const agora = new Date();

  const dataAtual = new Date(
    agora.getFullYear(),
    agora.getMonth(),
    agora.getDate(),
    12,
    0,
    0
  );

  const milissegundosPorSemana = 7 * 24 * 60 * 60 * 1000;

  const semanasPassadas = Math.floor(
    (dataAtual.getTime() - dataReferencia.getTime()) /
    milissegundosPorSemana
  );

  const semanasGestacao = 29 + semanasPassadas;

  elementoSemana.textContent =
    `🤰 ${semanasGestacao} semanas de gestação`;
}

/* ==================================================
   API COMPARTILHADA DO RENDER
   ================================================== */

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json"
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: "no-store"
  });

  let result;

  try {
    result = await response.json();
  } catch {
    result = {};
  }

  if (!response.ok || result.ok === false) {
    throw new Error(
      result.message || "Não foi possível atualizar a lista."
    );
  }

  return result;
}

function applyState(state) {
  purchasedIds = Array.isArray(state?.purchasedIds)
    ? state.purchasedIds
    : [];

  reservations =
    state?.reservations && typeof state.reservations === "object"
      ? state.reservations
      : {};

  render();
}

function loadLocalState() {
  try {
    purchasedIds =
      JSON.parse(localStorage.getItem(LOCAL_PURCHASED_KEY)) || [];

    reservations =
      JSON.parse(localStorage.getItem(LOCAL_RESERVATIONS_KEY)) || {};
  } catch {
    purchasedIds = [];
    reservations = {};
  }

  render();
}

function saveLocalState() {
  localStorage.setItem(
    LOCAL_PURCHASED_KEY,
    JSON.stringify(purchasedIds)
  );

  localStorage.setItem(
    LOCAL_RESERVATIONS_KEY,
    JSON.stringify(reservations)
  );
}

async function loadSharedState({ silent = false } = {}) {
  if (IS_LOCAL_FILE) {
    loadLocalState();
    return;
  }

  try {
    const result = await apiRequest("/api/state");
    applyState(result.state);
  } catch (error) {
    console.error(error);

    if (!silent) {
      window.alert(
        "A lista compartilhada ainda não conseguiu se conectar ao servidor do Render."
      );
    }
  }
}

function setSavingState(saving) {
  isSaving = saving;

  document
    .querySelectorAll(".status-button, .reserve-button, .primary-button")
    .forEach(button => {
      button.disabled = saving || button.classList.contains("is-disabled");
    });
}

/* ==================================================
   CONTROLE DOS ITENS COMPRADOS
   ================================================== */

async function setPurchased(itemId, purchased) {
  if (isSaving) return;

  if (IS_LOCAL_FILE) {
    if (purchased) {
      if (!purchasedIds.includes(itemId)) {
        purchasedIds.push(itemId);
      }
      delete reservations[itemId];
    } else {
      purchasedIds = purchasedIds.filter(id => id !== itemId);
    }

    saveLocalState();
    render();
    return;
  }

  try {
    setSavingState(true);

    const result = await apiRequest("/api/purchased", {
      method: "POST",
      body: { itemId, purchased }
    });

    applyState(result.state);
  } catch (error) {
    console.error(error);
    window.alert(error.message);
    await loadSharedState({ silent: true });
  } finally {
    setSavingState(false);
  }
}

/* ==================================================
   MODAL DE RESERVA
   ================================================== */

function openReservationModal(item) {
  selectedReservationItemId = item.id;
  modalItemName.textContent = item.name;
  reservationName.value = "";
  reservationModal.classList.remove("hidden");
  document.body.style.overflow = "hidden";

  setTimeout(() => reservationName.focus(), 50);
}

function closeReservationModal() {
  selectedReservationItemId = null;
  reservationModal.classList.add("hidden");
  document.body.style.overflow = "";
  reservationForm.reset();
}

async function removeReservation(itemId) {
  const reservedBy = reservations[itemId];

  const confirmed = window.confirm(
    `Este item está reservado por ${reservedBy}. Deseja cancelar a reserva?`
  );

  if (!confirmed || isSaving) return;

  if (IS_LOCAL_FILE) {
    delete reservations[itemId];
    saveLocalState();
    render();
    return;
  }

  try {
    setSavingState(true);

    const result = await apiRequest("/api/reservations/cancel", {
      method: "POST",
      body: { itemId }
    });

    applyState(result.state);
  } catch (error) {
    console.error(error);
    window.alert(error.message);
    await loadSharedState({ silent: true });
  } finally {
    setSavingState(false);
  }
}

/* ==================================================
   CRIAÇÃO DOS CARTÕES
   ================================================== */

function createItemCard(item, isPurchased) {
  const fragment = itemTemplate.content.cloneNode(true);

  const card = fragment.querySelector(".item-card");
  const image = fragment.querySelector(".item-image");
  const name = fragment.querySelector(".item-name");
  const description = fragment.querySelector(".item-description");
  const productLink = fragment.querySelector(".product-link");
  const reservationLabel = fragment.querySelector(".reservation-label");
  const statusButton = fragment.querySelector(".status-button");
  const reserveButton = fragment.querySelector(".reserve-button");

  image.src = item.image;
  image.alt = `Foto de ${item.name}`;

  image.addEventListener("error", () => {
    image.src =
      "https://placehold.co/360x360/edf7ff/3979c7?text=Produto";
  });

  name.textContent = item.name;
  description.textContent = item.description;

  if (item.link) {
    productLink.href = item.link;
  } else {
    productLink.classList.add("hidden-link");
  }

  const reservedBy = reservations[item.id];

  if (isPurchased) {
    card.classList.add("is-purchased");
    statusButton.textContent = "↩ Voltar para compras";
    statusButton.addEventListener(
      "click",
      () => setPurchased(item.id, false)
    );

    reserveButton.textContent = "✅ Já comprado";
    reserveButton.disabled = true;
    reserveButton.classList.add("is-disabled");
    return fragment;
  }

  if (reservedBy) {
    reservationLabel.textContent = `🔖 Reservado por ${reservedBy}`;
    reservationLabel.classList.remove("hidden");

    reserveButton.textContent = "Cancelar reserva";
    reserveButton.classList.add("is-reserved");
    reserveButton.addEventListener(
      "click",
      () => removeReservation(item.id)
    );

    statusButton.textContent = "🔒 Item reservado";
    statusButton.disabled = true;
    statusButton.classList.add("is-disabled");
    statusButton.title = `Reservado por ${reservedBy}`;
  } else {
    reserveButton.textContent = "🔖 Reservar";
    reserveButton.addEventListener(
      "click",
      () => openReservationModal(item)
    );

    statusButton.textContent = "✓ Marcar como comprado";
    statusButton.addEventListener(
      "click",
      () => setPurchased(item.id, true)
    );
  }

  return fragment;
}

function updateCount(element, amount) {
  element.textContent =
    `${amount} ${amount === 1 ? "item" : "itens"}`;
}

function render() {
  const shoppingItems = initialItems.filter(
    item => !purchasedIds.includes(item.id)
  );

  const purchasedItems = initialItems.filter(
    item => purchasedIds.includes(item.id)
  );

  shoppingList.replaceChildren();
  purchasedList.replaceChildren();

  shoppingItems.forEach(item => {
    shoppingList.appendChild(createItemCard(item, false));
  });

  purchasedItems.forEach(item => {
    purchasedList.appendChild(createItemCard(item, true));
  });

  updateCount(shoppingCount, shoppingItems.length);
  updateCount(purchasedCount, purchasedItems.length);

  shoppingTabCount.textContent = shoppingItems.length;
  purchasedTabCount.textContent = purchasedItems.length;

  shoppingEmpty.classList.toggle(
    "hidden",
    shoppingItems.length > 0
  );

  purchasedEmpty.classList.toggle(
    "hidden",
    purchasedItems.length > 0
  );
}

/* ==================================================
   CONFIRMAÇÃO DA RESERVA
   ================================================== */

reservationForm.addEventListener("submit", async event => {
  event.preventDefault();

  const name = reservationName.value.trim();
  const itemId = selectedReservationItemId;

  if (!name || !itemId || isSaving) return;

  if (IS_LOCAL_FILE) {
    reservations[itemId] = name;
    saveLocalState();
    closeReservationModal();
    render();
    return;
  }

  try {
    setSavingState(true);

    const result = await apiRequest("/api/reservations", {
      method: "POST",
      body: { itemId, name }
    });

    closeReservationModal();
    applyState(result.state);
  } catch (error) {
    console.error(error);
    window.alert(error.message);
    await loadSharedState({ silent: true });
  } finally {
    setSavingState(false);
  }
});

document
  .querySelectorAll("[data-close-modal]")
  .forEach(element => {
    element.addEventListener("click", closeReservationModal);
  });

document.addEventListener("keydown", event => {
  if (
    event.key === "Escape" &&
    !reservationModal.classList.contains("hidden")
  ) {
    closeReservationModal();
  }
});

document
  .querySelectorAll(".tab")
  .forEach(tab => {
    tab.addEventListener("click", () => {
      document
        .querySelectorAll(".tab")
        .forEach(item => item.classList.remove("active"));

      tab.classList.add("active");

      document
        .querySelectorAll(".panel")
        .forEach(panel => panel.classList.remove("active-panel"));

      const panel =
        tab.dataset.tab === "shopping"
          ? document.querySelector("#shoppingPanel")
          : document.querySelector("#purchasedPanel");

      panel.classList.add("active-panel");

      if (window.innerWidth <= 700) {
        panel.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }
    });
  });

/* ==================================================
   INICIALIZAÇÃO
   ================================================== */

atualizarSemanaGestacao();
render();
loadSharedState();

if (!IS_LOCAL_FILE) {
  setInterval(() => {
    if (
      !isSaving &&
      reservationModal.classList.contains("hidden")
    ) {
      loadSharedState({ silent: true });
    }
  }, UPDATE_INTERVAL_MS);
}
