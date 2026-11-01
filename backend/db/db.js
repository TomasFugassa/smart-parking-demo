import mysql from 'mysql2/promise';

export const pool = mysql.createPool({
  host: '127.0.0.1',
  port: 3307,
  user: 'root',
  password: '',
  database: 'smart-parking-db',
  waitForConnections: true,
});

function mysqlDate() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

function parseParking(row) {
  if (!row) return null;
  return {
    ...row,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    layout: typeof row.layout === 'string' ? JSON.parse(row.layout) : row.layout,
  };
}

function parseSensor(row) {
  if (!row) return null;
  return { ...row, isOccupied: Boolean(row.isOccupied) };
}

export async function getParkings() {
  const [rows] = await pool.query('SELECT * FROM parkings');
  return Object.fromEntries(rows.map(r => [r.parkingId, parseParking(r)]));
}

export async function getSensors() {
  const [rows] = await pool.query('SELECT * FROM sensors');
  return Object.fromEntries(rows.map(r => [r.sensorId, parseSensor(r)]));
}

export async function getParkingById(parkingId) {
  const [rows] = await pool.query('SELECT * FROM parkings WHERE parkingId = ?', [parkingId]);
  return parseParking(rows[0]);
}

export async function getSensorById(sensorId) {
  const [rows] = await pool.query('SELECT * FROM sensors WHERE sensorId = ?', [sensorId]);
  return parseSensor(rows[0]);
}

export async function getSensorByParkingIdAndSpaceId(parkingId, spaceId) {
  const [rows] = await pool.query('SELECT * FROM sensors WHERE parkingId = ? AND spaceId = ?', [parkingId, spaceId]);
  return parseSensor(rows[0]);
}

export async function getSensorsByParking(parkingId) {
  const [rows] = await pool.query('SELECT * FROM sensors WHERE parkingId = ?', [parkingId]);
  return Object.fromEntries(rows.map(r => [r.sensorId, parseSensor(r)]));
}

export async function countParkingSensors(parkingId) {
  const [rows] = await pool.query('SELECT COUNT(*) AS count FROM sensors WHERE parkingId = ?', [parkingId]);
  return rows[0].count;
}

export async function upsertParking(data, isNew) {
  const { parkingId, name, location, totalSpaces, latitude, longitude, layout } = data;
  const lastUpdated = mysqlDate();

  if (isNew) {
    await pool.query(
      `INSERT INTO parkings (parkingId, name, location, totalSpaces, latitude, longitude, layout, lastUpdated)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [parkingId, name, location, totalSpaces, latitude, longitude, JSON.stringify(layout), lastUpdated]
    );
  } else {
    await pool.query(
      `UPDATE parkings
       SET name = ?, location = ?, totalSpaces = ?, latitude = ?, longitude = ?, layout = ?, lastUpdated = ?
       WHERE parkingId = ?`,
      [name, location, totalSpaces, latitude, longitude, JSON.stringify(layout), lastUpdated, parkingId]
    );
  }

  return { parkingId, name, location, totalSpaces, latitude, longitude, layout, lastUpdated, isNew };
}

export async function upsertSensor(data, isNew) {
  const { sensorId, parkingId, spaceId, isOccupied, distance, timestamp, rssi } = data;
  const lastUpdated = mysqlDate();

  if (isNew) {
    await pool.query(
      `INSERT INTO sensors (sensorId, parkingId, spaceId, isOccupied, distance, timestamp, rssi, lastUpdated)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [sensorId, parkingId, spaceId, isOccupied ? 1 : 0, distance ?? null, timestamp ?? null, rssi ?? null, lastUpdated]
    );
  } else {
    await pool.query(
      `UPDATE sensors
       SET parkingId = ?, spaceId = ?, isOccupied = ?, distance = ?, timestamp = ?, rssi = ?, lastUpdated = ?
       WHERE sensorId = ?`,
      [parkingId, spaceId, isOccupied ? 1 : 0, distance ?? null, timestamp ?? null, rssi ?? null, lastUpdated, sensorId]
    );
  }

  // Update parking layout occupancy
  const parking = await getParkingById(parkingId);
  if (parking?.layout?.[spaceId]) {
    parking.layout[spaceId].isOccupied = isOccupied;
    parking.layout[spaceId].lastUpdated = lastUpdated;
    await pool.query('UPDATE parkings SET layout = ?, lastUpdated = ? WHERE parkingId = ?',
      [JSON.stringify(parking.layout), lastUpdated, parkingId]);
  }

  return { sensorId, parkingId, spaceId, isOccupied, distance, timestamp, rssi, lastUpdated, isNew };
}

export async function deleteParkingById(parkingId) {
  await pool.query('DELETE FROM parkings WHERE parkingId = ?', [parkingId]);
}

export async function deleteSensorById(sensorId) {
  await pool.query('DELETE FROM sensors WHERE sensorId = ?', [sensorId]);
}
