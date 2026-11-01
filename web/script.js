// Configuration
const API_BASE = 'http://127.0.0.1:3000';

// State
let currentParkingId = null;
let parkingsData = {};
let sensorsData = {};
let parkingStatsData = {};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadParkings();
    connectSSE();
});

// ===== Load Parkings =====
async function loadParkings() {
    try {
        const response = await fetch(`${API_BASE}/parkings`);
        const data = await response.json();
        parkingsData = data || {};
        await hydrateParkingData();
        renderParkingsList();
    } catch (error) {
        console.error('Error loading parkings:', error);
        showError('Failed to load parkings');
    }
}

// ===== Hydrate Parking Data =====
async function hydrateParkingData() {
    const parkingIds = Object.keys(parkingsData);

    await Promise.all(parkingIds.map(async (parkingId) => {
        try {
            const response = await fetch(`${API_BASE}/parkings/${parkingId}`);
            if (!response.ok) {
                return;
            }

            const data = await response.json();
            parkingsData[parkingId] = data.parking || parkingsData[parkingId];
            sensorsData[parkingId] = data.sensors || {};
            parkingStatsData[parkingId] = data.statistics || null;
        } catch (error) {
            console.error(`Error hydrating parking ${parkingId}:`, error);
        }
    }));
}

// ===== Helpers =====
function getParkingSensors(parkingId) {
    return sensorsData[parkingId] || {};
}

function countOccupiedSpaces(sensors) {
    const occupiedKeys = new Set();
    let occupiedCount = 0;

    Object.entries(sensors).forEach(([key, sensor]) => {
        if (!sensor || !sensor.isOccupied) {
            return;
        }

        const spaceKey = String(sensor.spaceId ?? sensor.sensorId ?? key);

        if (occupiedKeys.has(spaceKey)) {
            return;
        }

        occupiedKeys.add(spaceKey);
        occupiedCount += 1;
    });

    return occupiedCount;
}

function getSpaceSensor(sensors, spaceNumber) {
    const targetKey = String(spaceNumber);

    return Object.entries(sensors).find(([key, sensor]) => {
        const sensorKey = String(sensor?.spaceId ?? sensor?.sensorId ?? key);
        return sensorKey === targetKey;
    })?.[1] || null;
}

function updateSummary() {
    const parkings = Object.values(parkingsData);
    const summaryParkings = parkings.length;
    const summarySpaces = parkings.reduce((total, parking) => total + (Number(parking.totalSpaces) || 0), 0);
    const summaryOccupied = Object.entries(sensorsData).reduce((total, [, sensors]) => total + countOccupiedSpaces(sensors), 0);

    const parkingsLabel = document.getElementById('summaryParkings');
    const spacesLabel = document.getElementById('summarySpaces');
    const occupiedLabel = document.getElementById('summaryOccupied');

    if (parkingsLabel) parkingsLabel.textContent = summaryParkings;
    if (spacesLabel) spacesLabel.textContent = summarySpaces;
    if (occupiedLabel) occupiedLabel.textContent = summaryOccupied;
}

// ===== Render Parkings List =====
function renderParkingsList() {
    const parkingGrid = document.getElementById('parkingGrid');
    const emptyState = document.getElementById('parkingEmpty');
    parkingGrid.innerHTML = '';

    const parkingEntries = Object.entries(parkingsData);

    updateSummary();

    if (emptyState) {
        emptyState.hidden = parkingEntries.length > 0;
    }

    if (!parkingEntries.length) {
        return;
    }

    parkingEntries.forEach(([id, parking], index) => {
        const parkingSensors = getParkingSensors(id);
        const totalSpaces = parking.totalSpaces || 0;
        const occupiedCount = countOccupiedSpaces(parkingSensors);
        const availableCount = Math.max(totalSpaces - occupiedCount, 0);
        const occupancyPercent = totalSpaces > 0 ? Math.round((occupiedCount / totalSpaces) * 100) : 0;

        const card = document.createElement('div');
        card.className = `parking-card${String(currentParkingId) === String(id) ? ' is-active' : ''}`;
        card.onclick = () => loadParkingDetail(id);
        card.style.animationDelay = `${Math.min(index * 60, 360)}ms`;
        card.innerHTML = `
            <div class="parking-card-top">
                <div>
                    <h3>${parking.name}</h3>
                    <div class="parking-card-info">${parking.location || 'No location'}</div>
                </div>
                <span class="status-badge">${occupancyPercent}%</span>
            </div>
            <div class="parking-progress" aria-hidden="true">
                <div class="parking-progress-bar" style="width: ${occupancyPercent}%"></div>
            </div>
            <div class="parking-card-stats">
                <div class="parking-card-stat">
                    <span class="parking-card-stat-label">Total</span>
                    <span class="parking-card-stat-value">${totalSpaces}</span>
                </div>
                <div class="parking-card-stat">
                    <span class="parking-card-stat-label">Occupied</span>
                    <span class="parking-card-stat-value">${occupiedCount}</span>
                </div>
                <div class="parking-card-stat">
                    <span class="parking-card-stat-label">Available</span>
                    <span class="parking-card-stat-value">${availableCount}</span>
                </div>
                <div class="parking-card-stat">
                    <span class="parking-card-stat-label">Usage</span>
                    <span class="parking-card-stat-value">${occupancyPercent}%</span>
                </div>
            </div>
        `;
        parkingGrid.appendChild(card);
    });
}

// ===== Load Parking Detail =====
async function loadParkingDetail(parkingId) {
    try {
        const cachedParking = parkingsData[parkingId];
        let data = null;

        const response = await fetch(`${API_BASE}/parkings/${parkingId}`);
        if (response.ok) {
            data = await response.json();
        }

        currentParkingId = parkingId;
        const parking = data?.parking || cachedParking;
        const sensors = data?.sensors || sensorsData[parkingId] || {};
        sensorsData[parkingId] = sensors;
        if (data?.statistics) {
            parkingStatsData[parkingId] = data.statistics;
        }

        document.getElementById('parkingName').textContent = parking.name;
        document.getElementById('parkingLocation').textContent = `📍 ${parking.location || 'No location'}`;
        document.getElementById('totalSpaces').textContent = parking.totalSpaces || 0;

        renderStats(parking, sensors);
        renderSpaces(parking, sensors);

        // Show detail view
        document.getElementById('parkingsList').style.display = 'none';
        document.getElementById('parkingDetail').style.display = 'block';
    } catch (error) {
        console.error('Error loading parking detail:', error);
        showError('Failed to load parking details');
    }
}

// ===== Render Stats =====
function renderStats(parking, sensors) {
    const totalSpaces = parking.totalSpaces || 0;
    const occupiedCount = countOccupiedSpaces(sensors);
    const availableCount = Math.max(totalSpaces - occupiedCount, 0);
    const occupancyRate = totalSpaces > 0 ? Math.round((occupiedCount / totalSpaces) * 100) : 0;

    document.getElementById('occupiedSpaces').textContent = occupiedCount;
    document.getElementById('availableSpaces').textContent = availableCount;
    document.getElementById('occupancyRate').textContent = occupancyRate + '%';
}

// ===== Render Spaces =====
function renderSpaces(parking, sensors) {
    const spacesGrid = document.getElementById('spacesGrid');
    spacesGrid.innerHTML = '';

    const totalSpaces = Number(parking.totalSpaces) || 0;

    if (!totalSpaces) {
        spacesGrid.innerHTML = '<div class="empty-state"><h3>No spaces defined</h3><p>This parking does not have a total space count yet.</p></div>';
        return;
    }

    for (let i = 1; i <= totalSpaces; i++) {
        const sensor = getSpaceSensor(sensors, i);
        const isOccupied = Boolean(sensor?.isOccupied);
        const distance = typeof sensor?.distance === 'number' ? sensor.distance.toFixed(1) : '--';
        const lastUpdated = sensor?.lastUpdated ? formatRelativeTime(sensor.lastUpdated) : 'No sensor data';

        const spaceCell = createSpaceCell(i, isOccupied, distance, lastUpdated);
        spacesGrid.appendChild(spaceCell);
    }
}

// ===== Create Space Cell =====
function createSpaceCell(spaceNum, isOccupied, distance, lastUpdated) {
    const cell = document.createElement('div');
    cell.className = `space-cell ${isOccupied ? 'occupied' : 'available'}`;
    cell.innerHTML = `
        <div class="space-top">
            <span class="space-dot"></span>
            <div class="space-id">Space ${spaceNum}</div>
        </div>
        <div class="space-status">${isOccupied ? 'Occupied' : 'Available'}</div>
        <div class="space-distance">${distance !== '--' ? `${distance} cm` : 'No distance'}</div>
        <div class="space-last-updated">${lastUpdated}</div>
    `;
    return cell;
}

function formatRelativeTime(timestamp) {
    const date = new Date(timestamp);

    if (Number.isNaN(date.getTime())) {
        return 'Updated now';
    }

    const diffMs = Date.now() - date.getTime();
    const diffSeconds = Math.max(Math.round(diffMs / 1000), 0);

    if (diffSeconds < 60) {
        return `${diffSeconds}s ago`;
    }

    const diffMinutes = Math.round(diffSeconds / 60);

    if (diffMinutes < 60) {
        return `${diffMinutes}m ago`;
    }

    const diffHours = Math.round(diffMinutes / 60);
    return `${diffHours}h ago`;
}

// ===== Go Back to Parkings =====
function backToParkings() {
    currentParkingId = null;
    document.getElementById('parkingDetail').style.display = 'none';
    document.getElementById('parkingsList').style.display = 'block';
    renderParkingsList();
}

// ===== SSE Connection =====
function connectSSE() {
    const eventSource = new EventSource(`${API_BASE}/events`);

    eventSource.onmessage = (event) => {
        try {
            const record = JSON.parse(event.data);
            updateSensorData(record);
        } catch (error) {
            console.error('Error parsing SSE event:', error);
        }
    };

    eventSource.onerror = (error) => {
        console.error('SSE connection error:', error);
        eventSource.close();
        // Reconnect after 5 seconds
        setTimeout(connectSSE, 5000);
    };
}

// ===== Update Sensor Data =====
function updateSensorData(sensorRecord) {
    const parkingId = sensorRecord.parkingId;
    const normalizedParkingId = String(parkingId);
    if (String(currentParkingId) === normalizedParkingId) {
        loadParkingDetail(normalizedParkingId);
        return;
    }

    loadParkings();
}

// ===== Show Error =====
function showError(message) {
    console.error(message);
    alert(message);
}