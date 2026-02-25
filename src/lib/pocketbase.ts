import PocketBase from 'pocketbase';

const url = import.meta.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090';
export const pb = new PocketBase(url);

// Disable auto-cancellation to prevent issues with React StrictMode
// This prevents duplicate requests from being cancelled in development
if (typeof pb.autoCancellation === 'function') {
  pb.autoCancellation(false);
}

// Type definition for Client collection in PocketBase
export type ClientRecord = {
    id: string;
    collectionId: string;
    collectionName: string;
    created: string;
    updated: string;

    // Custom fields
    type: 'personne_morale' | 'personne_physique';
    company_name?: string;
    ice?: string;
    company_address?: string;
    company_phone?: string;
    company_email?: string;
    representative_name?: string;
    representative_email?: string;
    representative_phone?: string;
    full_name?: string;
    address?: string;
    email?: string;
    phone?: string;
};
