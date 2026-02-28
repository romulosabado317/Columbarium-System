import { Niche, DeceasedRecord, ReservationRecord, NicheStatus } from './types';

// Points to your local XAMPP htdocs folder.
// NOTE: If you eventually build this React app and put the HTML/JS directly inside C:\xampp\htdocs\, 
// you can change this to just '/api'
const API_BASE_URL = 'http://localhost/api';

export const xamppApi = {
  getNiches: async (): Promise<Niche[]> => {
    const res = await fetch(`${API_BASE_URL}/get_niches.php`);
    if (!res.ok) throw new Error('Failed to fetch niches');
    return res.json();
  },
  
  getRecords: async (): Promise<DeceasedRecord[]> => {
    const res = await fetch(`${API_BASE_URL}/get_records.php`);
    if (!res.ok) throw new Error('Failed to fetch records');
    return res.json();
  },
  
  getReservations: async (): Promise<ReservationRecord[]> => {
    const res = await fetch(`${API_BASE_URL}/get_reservations.php`);
    if (!res.ok) throw new Error('Failed to fetch reservations');
    return res.json();
  },
  
  updateNicheStatus: async (nicheId: string, status: NicheStatus): Promise<boolean> => {
    const res = await fetch(`${API_BASE_URL}/update_niche.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: nicheId, status })
    });
    return res.ok;
  },

  createReservation: async (data: Partial<ReservationRecord>): Promise<boolean> => {
    const res = await fetch(`${API_BASE_URL}/create_reservation.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.ok;
  }
};
