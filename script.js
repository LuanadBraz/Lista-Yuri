const PURCHASED_KEY = "yuri-purchased-items-v2";
const RESERVATIONS_KEY = "yuri-reservations-v2";

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
    image: "https://loremflickr.com/360/360/baby,sling?lock=102",
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
    description: "Babadores macios",
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
    image: "https://loremflickr.com/360/360/baby,mattress?lock=114",
    link: ""
  }
];

let purchasedIds = loadJson(PURCHASED_KEY, []);
let reservations = loadJson(RESERVATIONS_KEY, {});
let selectedReservationItemId = null;

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

function loadJson(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

function saveState() {
  localStorage.setItem(PURCHASED_KEY, JSON.stringify(purchasedIds));
  localStorage.setItem(RESERVATIONS_KEY, JSON.stringify(reservations));
}

function setPurchased(itemId, purchased) {
  if (purchased) {
    if (!purchasedIds.includes(itemId)) purchasedIds.push(itemId);
  } else {
    purchasedIds = purchasedIds.filter(id => id !== itemId);
  }

  saveState();
  render();
}

function openReservationModal(item) {
  selectedReservationItemId = item.id;
  modalItemName.textContent = item.name;
  reservationName.value = reservations[item.id] || "";
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

function removeReservation(itemId) {
  const reservedBy = reservations[itemId];
  const confirmed = window.confirm(
    `Este item está reservado por ${reservedBy}. Deseja cancelar a reserva?`
  );

  if (!confirmed) return;

  delete reservations[itemId];
  saveState();
  render();
}

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
    image.src = "https://placehold.co/360x360/edf7ff/3979c7?text=Produto";
  });

  name.textContent = item.name;
  description.textContent = item.description;

  if (item.link) {
    productLink.href = item.link;
  } else {
    productLink.classList.add("hidden-link");
  }

  const reservedBy = reservations[item.id];

  if (reservedBy) {
    reservationLabel.textContent = `🔖 Reservado por ${reservedBy}`;
    reservationLabel.classList.remove("hidden");
    reserveButton.textContent = "Cancelar reserva";
    reserveButton.classList.add("is-reserved");
    reserveButton.addEventListener("click", () => removeReservation(item.id));
  } else {
    reserveButton.textContent = "🔖 Reservar";
    reserveButton.addEventListener("click", () => openReservationModal(item));
  }

  statusButton.textContent = isPurchased
    ? "↩ Voltar para compras"
    : reservedBy
      ? "🔒 Item reservado"
      : "✓ Marcar como comprado";

  // Um item reservado não pode ser marcado como comprado.
  // Ao cancelar a reserva, o botão volta a ser habilitado.
  if (reservedBy && !isPurchased) {
    statusButton.disabled = true;
    statusButton.classList.add("is-disabled");
    statusButton.title = `Reservado por ${reservedBy}`;
  } else {
    statusButton.addEventListener("click", () => setPurchased(item.id, !isPurchased));
  }

  if (isPurchased) {
    card.classList.add("is-purchased");
  }

  return fragment;
}

function updateCount(element, amount) {
  element.textContent = `${amount} ${amount === 1 ? "item" : "itens"}`;
}

function render() {
  const shoppingItems = initialItems.filter(item => !purchasedIds.includes(item.id));
  const purchasedItems = initialItems.filter(item => purchasedIds.includes(item.id));

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

  shoppingEmpty.classList.toggle("hidden", shoppingItems.length > 0);
  purchasedEmpty.classList.toggle("hidden", purchasedItems.length > 0);
}

reservationForm.addEventListener("submit", event => {
  event.preventDefault();

  const name = reservationName.value.trim();

  if (!name || !selectedReservationItemId) return;

  reservations[selectedReservationItemId] = name;
  saveState();
  closeReservationModal();
  render();
});

document.querySelectorAll("[data-close-modal]").forEach(element => {
  element.addEventListener("click", closeReservationModal);
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape" && !reservationModal.classList.contains("hidden")) {
    closeReservationModal();
  }
});

document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(item => item.classList.remove("active"));
    tab.classList.add("active");

    document.querySelectorAll(".panel").forEach(panel => {
      panel.classList.remove("active-panel");
    });

    const panel = tab.dataset.tab === "shopping"
      ? document.querySelector("#shoppingPanel")
      : document.querySelector("#purchasedPanel");

    panel.classList.add("active-panel");

    if (window.innerWidth <= 700) {
      panel.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
});



render();
