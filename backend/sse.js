export const sseClients = [];

export function broadcastEvent(record) {
  const data = `data: ${JSON.stringify(record)}\n\n`;
  sseClients.forEach(client => client.write(data));
}
