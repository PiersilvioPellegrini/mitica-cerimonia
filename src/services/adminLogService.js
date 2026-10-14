import { collection, addDoc, getDocs, orderBy, query, limit, Timestamp } from 'firebase/firestore';
import { db } from './firebaseConfig';

const LOG_COLLECTION = 'admin_audit_logs';

export const logAdminAction = async ({ action, description, status, details = {} }) => {
    try {
        await addDoc(collection(db, LOG_COLLECTION), {
            action,
            description,
            status, // 'SUCCESS', 'ERROR', 'PENDING'
            details, // arbitrary JSON object
            timestamp: Timestamp.now(),
            user: 'Admin' // In future, use auth.currentUser.email
        });
    } catch (error) {
        console.error("Failed to log admin action:", error);
    }
};

export const getAdminLogs = async (limitCount = 20) => {
    try {
        const q = query(collection(db, LOG_COLLECTION), orderBy('timestamp', 'desc'), limit(limitCount));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error("Failed to fetch admin logs:", error);
        return [];
    }
};
