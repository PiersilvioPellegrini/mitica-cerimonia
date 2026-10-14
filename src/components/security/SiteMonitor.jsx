import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff, Activity } from 'lucide-react';

import { sendAlertEmail } from '../../services/monitoringService';

export default function SiteMonitor() {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [latency, setLatency] = useState(null);
    const [showStatus, setShowStatus] = useState(false);

    const logEvent = (type, message) => {
        let logs = [];
        try {
            logs = JSON.parse(localStorage.getItem('site_logs') || '[]');
        } catch (e) {
            console.warn('SiteMonitor: Corrupt logs, resetting.');
            localStorage.removeItem('site_logs');
        }
        logs.unshift({ timestamp: new Date().toISOString(), type, message });
        localStorage.setItem('site_logs', JSON.stringify(logs.slice(0, 50)));
        // Note: In a real advanced monitor, this would push to an external API
    };

    useEffect(() => {
        // Network Status Listeners
        const handleOnline = () => {
            setIsOnline(true);
            setShowStatus(true);
            setTimeout(() => setShowStatus(false), 3000);
            logEvent('RECOVERY', 'Connection restored');
        };

        const handleOffline = () => {
            setIsOnline(false);
            setShowStatus(true);
            logEvent('OUTAGE', 'Connection lost related to client network');
            // Trigger Email Alert for Offline
            // Note: If client is offline, this fetch won't work immediately. 
            // However, browsers might queue it or it might work if it's intermittent.
            // But realistically, if USER is offline, they can't send email. 
            // This is useful for "Server Error" detection where client has internet but server is down.
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Ping Check Logic (Simulating Server Health)
        const checkHealth = async () => {
            const start = Date.now();
            try {
                await fetch(window.location.origin, { method: 'HEAD', mode: 'no-cors' });
                const end = Date.now();
                setLatency(end - start);
            } catch (error) {
                console.warn("Health Check Failed:", error);
                setLatency(null);

                if (navigator.onLine) {
                    const msg = 'Website unreachable despite network connection';
                    logEvent('SERVER_ERROR', msg);
                    sendAlertEmail('SERVER_DOWN', msg);
                }
            }
        };

        const interval = setInterval(checkHealth, 30000); // Check every 30s
        checkHealth(); // Initial check

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            clearInterval(interval);
        };
    }, []);

    if (!showStatus && isOnline && (!latency || latency < 1000)) return null;

    return (
        <div className={`fixed bottom-4 left-4 z-[9999] transition-all duration-500 ${isOnline ? 'translate-y-0' : 'translate-y-0'}`}>
            <div className={`
                flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border font-bold text-xs uppercase tracking-widest backdrop-blur-md
                ${!isOnline
                    ? 'bg-red-900/90 border-red-500 text-white'
                    : latency && latency > 1000
                        ? 'bg-yellow-500/90 border-yellow-300 text-black'
                        : 'bg-green-500/90 border-green-300 text-white'}
            `}>
                {!isOnline ? (
                    <>
                        <WifiOff size={16} className="animate-pulse" />
                        <span>Offline: Controlla la connessione</span>
                    </>
                ) : latency && latency > 1000 ? (
                    <>
                        <Activity size={16} className="animate-pulse" />
                        <span>Rallentamento: {latency}ms</span>
                    </>
                ) : (
                    <>
                        <Wifi size={16} />
                        <span>Connessione Ripristinata</span>
                    </>
                )}
            </div>
        </div>
    );
}
