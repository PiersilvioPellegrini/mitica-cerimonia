import { db } from './firebaseConfig';
import { doc, getDoc, setDoc, updateDoc, increment, collection, query, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';

/**
 * Analytics Service
 * 
 * Tracks site activity such as product views.
 */

const ANALYTICS_PATH = 'analytics';
const PRODUCT_VIEWS_COLLECTION = 'product_views';

export const trackProductView = async (productId, productName) => {
    if (!productId) return;

    try {
        const docRef = doc(db, ANALYTICS_PATH, PRODUCT_VIEWS_COLLECTION, 'data', productId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            await updateDoc(docRef, {
                views: increment(1),
                last_viewed: Timestamp.now(),
                name: productName // Keep name updated in case it changes
            });
        } else {
            await setDoc(docRef, {
                productId,
                name: productName,
                views: 1,
                last_viewed: Timestamp.now(),
                first_viewed: Timestamp.now()
            });
        }

        // Also increment a global counter for dashboard high-level stats
        const globalRef = doc(db, ANALYTICS_PATH, 'global_stats');
        await setDoc(globalRef, {
            total_product_views: increment(1),
            last_activity: Timestamp.now()
        }, { merge: true });

    } catch (error) {
        // Silently fail on permission errors - analytics is non-critical
        // Only log if it's not a permission issue
        if (error.code !== 'permission-denied') {
            console.error("Error tracking product view:", error);
        }
    }
};

export const getTopProducts = async (maxResults = 10) => {
    try {
        const q = query(
            collection(db, ANALYTICS_PATH, PRODUCT_VIEWS_COLLECTION, 'data'),
            orderBy('views', 'desc'),
            limit(maxResults)
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => doc.data());
    } catch (error) {
        console.error("Error getting top products:", error);
        return [];
    }
};

export const getGlobalStats = async () => {
    try {
        const docRef = doc(db, ANALYTICS_PATH, 'global_stats');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data();
        }
    } catch (error) {
        console.error("Error getting global stats:", error);
    }
    return { total_product_views: 0 };
};
