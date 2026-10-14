import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from './firebaseConfig';

const CONFIG_PATH = ['settings', 'monitoring'];

export const getMonitoringConfig = async () => {
    try {
        const docRef = doc(db, ...CONFIG_PATH);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data();
        }
    } catch (error) {
        console.error("Error fetching monitoring config:", error);
    }
    return {
        serviceId: '',
        templateId: '',
        userId: '', // Public Key
        targetEmail: ''
    };
};


export const sendAlertEmail = async (errorType, message) => {
    const config = await getMonitoringConfig();

    if (!config.serviceId || !config.templateId || !config.userId) {
        console.warn("Monitoring not configured. Cannot send email.");
        return;
    }

    // Rate Limiting (1 email per hour)
    const lastSent = localStorage.getItem('last_alert_sent');
    if (lastSent && Date.now() - parseInt(lastSent) < 3600000) {
        console.warn("Alert throttled.");
        return;
    }

    try {
        const payload = {
            service_id: config.serviceId,
            template_id: config.templateId,
            user_id: config.userId,
            template_params: {
                error_type: errorType,
                message: message,
                timestamp: new Date().toLocaleString(),
                site_url: window.location.origin
            }
        };

        const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            console.log("Alert email sent successfully.");
            localStorage.setItem('last_alert_sent', Date.now().toString());
        } else {
            console.error("Failed to send alert email:", await response.text());
        }
    } catch (error) {
        console.error("Network error sending alert:", error);
    }
};
