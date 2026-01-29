import React, { useState } from 'react';
import { VITE_API_BASE_URL } from '../../lib/api/client';
import styles from './AdminPage.module.css';

export const AdminPage: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [progress, setProgress] = useState<number>(0);
    const [progressMessage, setProgressMessage] = useState<string>('');
    const [logs, setLogs] = useState<string[]>([]);
    const logContainerRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [logs]);

    const handleTriggerModel = async () => {
        setLoading(true);
        setMessage(null);
        setProgress(0);
        setLogs(['Starting training...']);

        const eventSource = new EventSource(`${VITE_API_BASE_URL}/recommendation/train`);

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data) {
                    setProgress(data.progress);
                    if (data.message) {
                        setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${data.message}`]);
                    }

                    if (data.progress === 100) {
                        eventSource.close();
                        setLoading(false);
                        setMessage({ type: 'success', text: 'Model training completed!' });
                    }
                }
            } catch (err) {
                console.error('Error parsing SSE data', err);
            }
        };

        eventSource.onerror = (error) => {
            console.error('SSE Error:', error);
            eventSource.close();
            setLoading(false);
            // Only show error if we haven't finished (sometimes close triggers error)
            if (progress < 100) {
                setMessage({ type: 'error', text: 'Connection lost or failed to trigger model training.' });
            }
        };
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <h2 className={styles.cardTitle}>Model Training</h2>
                <p className={styles.cardDescription}>
                    Trigger the recommendation model training process manually. This may take some time.
                </p>

                {message && (
                    <div className={`${styles.alert} ${message.type === 'success' ? styles.alertSuccess : styles.alertError}`}>
                        {message.text}
                    </div>
                )}

                {loading && (
                    <>
                        <div className={styles.progressContainer}>
                            <div
                                className={styles.progressBar}
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </>
                )}
                <div className={styles.logContainer} ref={logContainerRef}>
                    {logs.map((log, index) => (
                        <div key={index} className={styles.logItem}>{log}</div>
                    ))}
                </div>

                <button
                    onClick={handleTriggerModel}
                    disabled={loading}
                    className={styles.button}
                >
                    {loading ? 'Processing...' : 'Trigger Model Training'}
                </button>
            </div>
        </div>
    );
};
