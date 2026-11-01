const IP = 'DIRECCION_DEL_SERVIDOR';
export const API_URL = `http://${IP}:3000`;

export async function getParkings() {
    try {
        const response = await fetch(API_URL + '/parkings');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
    }catch (error) {
        console.error('Error fetching parkings:', error);
        throw error;
    }
}

export async function getParkingById(id) {
    const res = await fetch(API_URL + '/parkings/' + id);
    if (!res.ok) return null;
    return res.json();
}
