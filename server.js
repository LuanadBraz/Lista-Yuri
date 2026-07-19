const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.env.PORT || 10000);
const HOST = "0.0.0.0";
const DATA_DIR = process.env.DATA_DIR || "/var/data";
const DATA_FILE = path.join(DATA_DIR, "lista-yuri.json");

let operationQueue = Promise.resolve();

function defaultState() {
  return {
    purchasedIds: [],
    reservations: {}
  };
}

function ensureDataFile() {
  fs.mkdirSync(DATA_DIR, { recursive: true });

  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(
      DATA_FILE,
      JSON.stringify(defaultState(), null, 2),
      "utf8"
    );
  }
}

function normalizeState(value) {
  const purchasedIds = Array.isArray(value?.purchasedIds)
    ? [...new Set(value.purchasedIds.filter(item => typeof item === "string"))]
    : [];

  const reservations = {};

  if (value?.reservations && typeof value.reservations === "object") {
    for (const [itemId, name] of Object.entries(value.reservations)) {
      if (
        typeof itemId === "string" &&
        typeof name === "string" &&
        name.trim()
      ) {
        reservations[itemId] = name.trim().slice(0, 60);
      }
    }
  }

  for (const itemId of purchasedIds) {
    delete reservations[itemId];
  }

  return { purchasedIds, reservations };
}

function readState() {
  ensureDataFile();

  try {
    const content = fs.readFileSync(DATA_FILE, "utf8");
    return normalizeState(JSON.parse(content));
  } catch (error) {
    console.error("Erro ao ler os dados:", error);
    return defaultState();
  }
}

function writeState(state) {
  ensureDataFile();

  const normalized = normalizeState(state);
  const temporaryFile = `${DATA_FILE}.tmp`;

  fs.writeFileSync(
    temporaryFile,
    JSON.stringify(normalized, null, 2),
    "utf8"
  );

  fs.renameSync(temporaryFile, DATA_FILE);
  return normalized;
}

function withLock(callback) {
  const operation = operationQueue.then(callback, callback);
  operationQueue = operation.catch(() => {});
  return operation;
}

function sendJson(response, statusCode, data) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Cache-Control": "no-store"
  });

  response.end(JSON.stringify(data));
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    let size = 0;

    request.on("data", chunk => {
      size += chunk.length;

      if (size > 50_000) {
        reject(new Error("Requisição muito grande."));
        request.destroy();
        return;
      }

      body += chunk;
    });

    request.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("Dados inválidos."));
      }
    });

    request.on("error", reject);
  });
}

function cleanItemId(value) {
  return typeof value === "string"
    ? value.trim().slice(0, 100)
    : "";
}

function cleanName(value) {
  return typeof value === "string"
    ? value.trim().replace(/\s+/g, " ").slice(0, 60)
    : "";
}

async function handleRequest(request, response) {
  if (request.method === "OPTIONS") {
    sendJson(response, 204, {});
    return;
  }

  const url = new URL(
    request.url,
    `http://${request.headers.host || "localhost"}`
  );

  if (request.method === "GET" && url.pathname === "/") {
    sendJson(response, 200, {
      ok: true,
      service: "Lista Yuri API",
      message: "Servidor funcionando."
    });
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/health") {
    sendJson(response, 200, {
      ok: true,
      status: "online",
      service: "Lista Yuri API"
    });
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/state") {
    sendJson(response, 200, {
      ok: true,
      state: readState()
    });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/reservations") {
    const body = await readJsonBody(request);
    const itemId = cleanItemId(body.itemId);
    const name = cleanName(body.name);

    if (!itemId || !name) {
      sendJson(response, 400, {
        ok: false,
        message: "Informe o item e o nome para reservar."
      });
      return;
    }

    const state = await withLock(() => {
      const current = readState();

      if (current.purchasedIds.includes(itemId)) {
        const error = new Error("Este item já foi comprado.");
        error.statusCode = 409;
        throw error;
      }

      if (
        current.reservations[itemId] &&
        current.reservations[itemId] !== name
      ) {
        const error = new Error(
          `Este item já está reservado por ${current.reservations[itemId]}.`
        );
        error.statusCode = 409;
        throw error;
      }

      current.reservations[itemId] = name;
      return writeState(current);
    });

    sendJson(response, 200, { ok: true, state });
    return;
  }

  if (
    request.method === "POST" &&
    url.pathname === "/api/reservations/cancel"
  ) {
    const body = await readJsonBody(request);
    const itemId = cleanItemId(body.itemId);

    if (!itemId) {
      sendJson(response, 400, {
        ok: false,
        message: "Item inválido."
      });
      return;
    }

    const state = await withLock(() => {
      const current = readState();
      delete current.reservations[itemId];
      return writeState(current);
    });

    sendJson(response, 200, { ok: true, state });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/purchased") {
    const body = await readJsonBody(request);
    const itemId = cleanItemId(body.itemId);
    const purchased = body.purchased === true;

    if (!itemId) {
      sendJson(response, 400, {
        ok: false,
        message: "Item inválido."
      });
      return;
    }

    const state = await withLock(() => {
      const current = readState();
      const reservedBy = current.reservations[itemId];

      if (purchased && reservedBy) {
        const error = new Error(
          `Este item está reservado por ${reservedBy}.`
        );
        error.statusCode = 409;
        throw error;
      }

      if (purchased) {
        if (!current.purchasedIds.includes(itemId)) {
          current.purchasedIds.push(itemId);
        }
        delete current.reservations[itemId];
      } else {
        current.purchasedIds = current.purchasedIds.filter(
          id => id !== itemId
        );
      }

      return writeState(current);
    });

    sendJson(response, 200, { ok: true, state });
    return;
  }

  sendJson(response, 404, {
    ok: false,
    message: "Rota não encontrada."
  });
}

ensureDataFile();

const server = http.createServer((request, response) => {
  handleRequest(request, response).catch(error => {
    console.error(error);

    sendJson(
      response,
      Number(error.statusCode || 500),
      {
        ok: false,
        message: error.message || "Erro interno do servidor."
      }
    );
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Lista Yuri API ativa em http://${HOST}:${PORT}`);
  console.log(`Dados salvos em: ${DATA_FILE}`);
});
