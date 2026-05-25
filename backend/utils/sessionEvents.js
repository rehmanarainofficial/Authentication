const clientsBySessionId = new Map();
const clientsByUserId = new Map();

const addClient = (clientsMap, id, res) => {
  const key = id.toString();
  const clients = clientsMap.get(key) || new Set();
  clients.add(res);
  clientsMap.set(key, clients);

  return () => {
    clients.delete(res);
    if (clients.size === 0) {
      clientsMap.delete(key);
    }
  };
};

const writeEvent = (client, event, data) => {
  client.write(`event: ${event}\n`);
  client.write(`data: ${JSON.stringify(data)}\n\n`);
};

export const addSessionClient = (sessionId, res) => {
  return addClient(clientsBySessionId, sessionId, res);
};

export const addUserClient = (userId, res) => {
  return addClient(clientsByUserId, userId, res);
};

export const notifySessionRevoked = (sessionId) => {
  const clients = clientsBySessionId.get(sessionId.toString());
  if (!clients) return;

  for (const client of clients) {
    writeEvent(client, "session-revoked", { reason: "Session logged out" });
  }
};

export const notifyUserSessionsChanged = (userId) => {
  const clients = clientsByUserId.get(userId.toString());
  if (!clients) return;

  for (const client of clients) {
    writeEvent(client, "sessions-changed", { reason: "Sessions changed" });
  }
};
