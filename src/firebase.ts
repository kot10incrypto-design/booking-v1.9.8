import { DEFAULT_CLIENT_AVATAR } from './data/avatars';
import type { Appointment, Reservation } from './types';

// ─── Localhost Local Storage Provider (No External Firebase Required) ───────────

export interface LocalUser {
  uid: string;
  id?: string;
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  phoneNumber?: string | null;
  formulaNotes?: string;
  role?: string;
  emailVerified?: boolean;
  isAnonymous?: boolean;
  tenantId?: string | null;
  providerData?: any[];
}

export type FirebaseUser = LocalUser;

// Local persistent auth state in browser localStorage
const AUTH_STORAGE_KEY = 'royal_local_user_v1';
const BOOKINGS_STORAGE_KEY = 'royal_local_bookings_v1';
const APPOINTMENTS_STORAGE_KEY = 'atelier_appointments_v1';

function getStoredUser(): LocalUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setStoredUser(user: LocalUser | null) {
  if (typeof window === 'undefined') return;
  try {
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  } catch {}
}

const authListeners: Array<(user: LocalUser | null) => void> = [];

export const auth: any = {
  get currentUser() {
    return getStoredUser();
  }
};

export const app: any = {
  name: '[LOCAL_APP]',
  options: {}
};

export const db: any = {
  type: 'local-storage-host'
};

export class GoogleAuthProvider {
  setCustomParameters() {}
}

export class OAuthProvider {
  constructor(public providerId: string) {}
  addScope() {}
}

export class RecaptchaVerifier {
  constructor(public authObj: any, public container: any, public opts?: any) {}
  clear() {}
  render() { return Promise.resolve(0); }
  verify() { return Promise.resolve('token'); }
}

export interface ConfirmationResult {
  verificationId: string;
  confirm: (verificationCode: string) => Promise<{ user: LocalUser }>;
}

export function clearPhoneRecaptcha(containerId = 'phone-recaptcha-container'): void {
  if (typeof window === 'undefined') return;
  try {
    if ((window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier.clear();
      (window as any).recaptchaVerifier = null;
    }
    const el = document.getElementById(containerId);
    if (el && el.parentNode) {
      const freshEl = document.createElement('div');
      freshEl.id = containerId;
      freshEl.className = el.className;
      el.parentNode.replaceChild(freshEl, el);
    }
  } catch {}
}

export function getOrCreatePhoneRecaptcha(containerId = 'phone-recaptcha-container', isInvisible = true): RecaptchaVerifier {
  clearPhoneRecaptcha(containerId);
  const verifier = new RecaptchaVerifier(auth, containerId, { size: isInvisible ? 'invisible' : 'normal' });
  if (typeof window !== 'undefined') {
    (window as any).recaptchaVerifier = verifier;
  }
  return verifier;
}

export async function signInWithPhoneNumber(
  _auth: any,
  phoneNumber: string,
  _appVerifier: any
): Promise<ConfirmationResult> {
  const code = '123456';
  console.log(`[Localhost Auth] Confirmation SMS code for ${phoneNumber} is: ${code}`);

  return {
    verificationId: `local-verify-${Date.now()}`,
    confirm: async (verificationCode: string) => {
      const user: LocalUser = {
        uid: `user-${phoneNumber.replace(/\D/g, '') || Date.now()}`,
        phoneNumber,
        displayName: 'مشتری عزیز',
        photoURL: DEFAULT_CLIENT_AVATAR,
        role: 'client',
        email: `${phoneNumber.replace(/\D/g, '') || 'client'}@salon.local`,
      };
      setStoredUser(user);
      authListeners.forEach(cb => cb(user));
      return { user };
    }
  };
}

export async function signInWithPopup(_auth: any, provider: any) {
  const id = `user-${Date.now()}`;
  const user: LocalUser = {
    uid: id,
    email: 'client@salon.local',
    displayName: 'مشتری گرامی',
    photoURL: DEFAULT_CLIENT_AVATAR,
    role: 'client',
  };
  setStoredUser(user);
  authListeners.forEach(cb => cb(user));
  return { user };
}

export async function signInWithEmailAndPassword(_auth: any, email: string) {
  const user: LocalUser = {
    uid: `user-${Date.now()}`,
    email,
    displayName: email.split('@')[0],
    photoURL: DEFAULT_CLIENT_AVATAR,
    role: email.includes('admin') ? 'admin' : 'client',
  };
  setStoredUser(user);
  authListeners.forEach(cb => cb(user));
  return { user };
}

export async function createUserWithEmailAndPassword(_auth: any, email: string) {
  return signInWithEmailAndPassword(_auth, email);
}

export async function signOut(_auth?: any) {
  setStoredUser(null);
  authListeners.forEach(cb => cb(null));
}

export function onAuthStateChanged(_auth: any, callback: (user: LocalUser | null) => void) {
  authListeners.push(callback);
  callback(getStoredUser());
  return () => {
    const idx = authListeners.indexOf(callback);
    if (idx !== -1) authListeners.splice(idx, 1);
  };
}

export async function updateProfile(user: LocalUser, profile: { displayName?: string; photoURL?: string }) {
  const current = getStoredUser() || user;
  const updated = {
    ...current,
    displayName: profile.displayName || current.displayName,
    photoURL: profile.photoURL || current.photoURL
  };
  setStoredUser(updated);
  authListeners.forEach(cb => cb(updated));
}

export async function sendPasswordResetEmail() {
  return Promise.resolve();
}

// ─── Local Connection Test (Instantly Resolves Successfully on Localhost) ───────────
export async function testConnection(): Promise<boolean> {
  return true;
}

// ─── Local Profile Sync ─────────────────────────────────────────────────────────────
export async function syncUserProfile(user: LocalUser, extraData?: { phoneNumber?: string; formulaNotes?: string; displayName?: string }) {
  if (!user || !user.uid) return null;
  const current = getStoredUser() || user;
  const updated: LocalUser = {
    ...current,
    displayName: extraData?.displayName || current.displayName || 'مشتری عزیز',
    phoneNumber: extraData?.phoneNumber || current.phoneNumber || '',
    formulaNotes: extraData?.formulaNotes || current.formulaNotes || '',
    photoURL: current.photoURL || DEFAULT_CLIENT_AVATAR,
  };
  setStoredUser(updated);
  return updated;
}

export async function getUserProfile(userId: string): Promise<LocalUser | null> {
  const current = getStoredUser();
  if (current && (current.uid === userId || current.id === userId)) {
    return current;
  }
  return null;
}

// ─── Localhost Persistence Operations for Appointments & Bookings ───────────────────

function getLocalBookings(): Record<string, Reservation> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(BOOKINGS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalBookings(bookings: Record<string, Reservation>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(bookings));
    window.dispatchEvent(new Event('local-booking-updated'));
  } catch {}
}

export async function syncBookingToFirestore(reservation: Partial<Reservation>): Promise<boolean> {
  if (!reservation || !reservation.id) return false;
  try {
    const bookings = getLocalBookings();
    bookings[reservation.id] = {
      ...(bookings[reservation.id] || {}),
      ...(reservation as Reservation),
    };
    saveLocalBookings(bookings);
    return true;
  } catch {
    return false;
  }
}

export async function fetchBookingFromFirestore(bookingId: string): Promise<Reservation | null> {
  if (!bookingId) return null;
  try {
    const bookings = getLocalBookings();
    return bookings[bookingId] || null;
  } catch {
    return null;
  }
}

export function subscribeToBookingInFirestore(
  bookingId: string,
  onUpdate: (booking: Reservation) => void,
  _onError?: (err: any) => void
): () => void {
  if (!bookingId || typeof window === 'undefined') return () => {};

  const handler = () => {
    const bookings = getLocalBookings();
    if (bookings[bookingId]) {
      onUpdate(bookings[bookingId]);
    }
  };

  window.addEventListener('local-booking-updated', handler);
  window.addEventListener('storage', handler);

  // Send initial data if available
  const initial = getLocalBookings()[bookingId];
  if (initial) {
    onUpdate(initial);
  }

  return () => {
    window.removeEventListener('local-booking-updated', handler);
    window.removeEventListener('storage', handler);
  };
}

export async function updateBookingStatusInFirestore(
  bookingId: string,
  status: Reservation['status']
): Promise<boolean> {
  if (!bookingId) return false;
  try {
    const bookings = getLocalBookings();
    if (bookings[bookingId]) {
      bookings[bookingId].status = status;
      saveLocalBookings(bookings);
    }
    return true;
  } catch {
    return false;
  }
}

export async function syncAppointmentToFirestore(appointment: Appointment): Promise<boolean> {
  if (!appointment || !appointment.id) return false;
  try {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem(APPOINTMENTS_STORAGE_KEY);
      const list: Appointment[] = raw ? JSON.parse(raw) : [];
      const idx = list.findIndex(a => a.id === appointment.id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...appointment };
      } else {
        list.unshift(appointment);
      }
      localStorage.setItem(APPOINTMENTS_STORAGE_KEY, JSON.stringify(list));
    }
    return true;
  } catch {
    return false;
  }
}

export async function updateAppointmentStatusInFirestore(
  appointmentId: string,
  status: Appointment['status']
): Promise<boolean> {
  if (!appointmentId) return false;
  try {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem(APPOINTMENTS_STORAGE_KEY);
      const list: Appointment[] = raw ? JSON.parse(raw) : [];
      const apt = list.find(a => a.id === appointmentId);
      if (apt) {
        apt.status = status;
        localStorage.setItem(APPOINTMENTS_STORAGE_KEY, JSON.stringify(list));
      }
    }
    return true;
  } catch {
    return false;
  }
}

export async function deleteAppointmentFromFirestore(appointmentId: string): Promise<boolean> {
  if (!appointmentId) return false;
  try {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem(APPOINTMENTS_STORAGE_KEY);
      const list: Appointment[] = raw ? JSON.parse(raw) : [];
      const filtered = list.filter(a => a.id !== appointmentId);
      localStorage.setItem(APPOINTMENTS_STORAGE_KEY, JSON.stringify(filtered));
    }
    return true;
  } catch {
    return false;
  }
}

export function subscribeToFirestoreAppointments(
  onUpdate: (appointments: Appointment[]) => void
): () => void {
  if (typeof window === 'undefined') return () => {};

  const handler = () => {
    try {
      const raw = localStorage.getItem(APPOINTMENTS_STORAGE_KEY);
      const list: Appointment[] = raw ? JSON.parse(raw) : [];
      onUpdate(list);
    } catch {}
  };

  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener('storage', handler);
  };
}
