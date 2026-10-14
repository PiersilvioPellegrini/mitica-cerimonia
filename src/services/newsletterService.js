import { db } from './firebaseConfig';
import { collection, addDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';

/**
 * Registers a user to the Club Mitica (newsletter).
 * @param {string} firstName 
 * @param {string} lastName 
 * @param {string} phone 
 * @param {string} email
 * @param {boolean} checkDuplicates - If true, checks for existing user
 * @returns {Promise<{success: boolean, message: string, isDuplicate: boolean}>}
 */
export const registerToClub = async (firstName, lastName, phone, email, checkDuplicates = false) => {
    try {
        if (!phone && !email) return { success: false, message: 'Recapiti mancanti', isDuplicate: false };

        const normalizedFirstName = firstName ? firstName.trim() : '';
        const normalizedLastName = lastName ? lastName.trim() : '';

        // Deduplication (Only works if user has Read permission, e.g. Admin)
        if (checkDuplicates) {
            try {
                // Check phone
                if (phone) {
                    const qPhone = query(collection(db, "newsletter"), where("phone", "==", phone));
                    const snapPhone = await getDocs(qPhone);
                    if (!snapPhone.empty) return { success: true, message: 'Utente già registrato', isDuplicate: true };
                }
                // Check email
                if (email) {
                    const qEmail = query(collection(db, "newsletter"), where("email", "==", email));
                    const snapEmail = await getDocs(qEmail);
                    if (!snapEmail.empty) return { success: true, message: 'Utente già registrato', isDuplicate: true };
                }
            } catch (queryError) {
                console.warn("Duplicate check failed (likely permission), proceeding with add:", queryError);
            }
        }

        // Use addDoc to ensure write succeeds even with create-only permissions
        await addDoc(collection(db, "newsletter"), {
            firstName: normalizedFirstName,
            lastName: normalizedLastName,
            phone: phone || '',
            email: email || '',
            contact: phone || email, // Legacy support / Quick display
            created_at: Timestamp.now(),
            status: 'Attivo',
            source: 'Auto-Registration'
        });

        return { success: true, message: 'Registrazione completata', isDuplicate: false };

    } catch (error) {
        console.error("Error registering to Club Mitica:", error);
        return { success: false, message: 'Errore durante la registrazione', error: error };
    }
};

/**
 * Helper to split a full name into First and Last name.
 * @param {string} fullName 
 * @returns {{firstName: string, lastName: string}}
 */
export const splitName = (fullName) => {
    if (!fullName) return { firstName: '', lastName: '' };
    const parts = fullName.trim().split(' ');
    if (parts.length === 1) return { firstName: parts[0], lastName: '' };

    const lastName = parts.pop();
    const firstName = parts.join(' ');
    return { firstName, lastName };
};
