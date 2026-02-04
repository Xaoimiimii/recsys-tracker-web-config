import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Settings } from 'lucide-react';
import { useContainer } from '../../contexts/ContainerContext';
import { VITE_API_BASE_URL } from '../../lib/api/client';
import styles from './AdminPage.module.css';

export const AdminPage: React.FC = () => {
    const { container } = useContainer();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [progress, setProgress] = useState<number>(0);
    const [logs, setLogs] = useState<string[]>([]);

    const logContainerRef = React.useRef<HTMLDivElement>(null);
    const [isConfigOpen, setIsConfigOpen] = useState(false);

    // Training configuration state
    const [config, setConfig] = useState({
        epochs: 500,
        pla_epochs: 500,
        batch_size: 256,
        tolerance: 0.000001,
        save_after_train: true,
        train_submodels: true
    });

    React.useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [logs]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setConfig(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) : value
        }));
    };

    const handleTriggerModel = async () => {
        if (!container?.id) {
            setMessage({ type: 'error', text: 'Please select a domain first.' });
            return;
        }

        setLoading(true);
        setMessage(null);
        setProgress(0);
        setLogs(['Starting training...']);

        // Construct query parameters
        const params = new URLSearchParams({
            domain_id: container.id.toString(),
            epochs: config.epochs.toString(),
            pla_epochs: config.pla_epochs.toString(),
            batch_size: config.batch_size.toString(),
            tolerance: config.tolerance.toString(),
            save_after_train: String(config.save_after_train),
            train_submodels: String(config.train_submodels)
        });

        const eventSource = new EventSource(`${VITE_API_BASE_URL}/recommendation/train?${params.toString()}`);

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

                <div className={styles.sectionHeader}>
                    <div className={styles.headerIcon}><Settings size={14} /></div>
                    <h3 className={styles.sectionTitle}>Model Training Configuration</h3>
                    <button
                        className={styles.chevronButton}
                        onClick={() => setIsConfigOpen(!isConfigOpen)}
                        type="button"
                        aria-label={isConfigOpen ? "Collapse section" : "Expand section"}
                    >
                        {isConfigOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                </div>

                {isConfigOpen && (
                    <>
                        <p className={styles.cardDescription}>
                            Configure parameters and trigger training for the current domain: <strong>{container?.name || 'No Domain Selected'}</strong>
                        </p>

                        <div className={styles.configForm}>
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label>Epochs</label>
                                    <input
                                        type="number"
                                        name="epochs"
                                        value={config.epochs}
                                        onChange={handleChange}
                                        disabled={loading}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>PLA Epochs</label>
                                    <input
                                        type="number"
                                        name="pla_epochs"
                                        value={config.pla_epochs}
                                        onChange={handleChange}
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label>Batch Size</label>
                                    <input
                                        type="number"
                                        name="batch_size"
                                        value={config.batch_size}
                                        onChange={handleChange}
                                        disabled={loading}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Tolerance</label>
                                    <input
                                        type="number"
                                        name="tolerance"
                                        step="0.000001"
                                        value={config.tolerance}
                                        onChange={handleChange}
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            <div className={styles.switchContainer}>
                                <div className={styles.switchItem}>
                                    <label className={styles.switchLabel} htmlFor="save_after_train">Save After Train</label>
                                    <label className={styles.toggleSwitch}>
                                        <input
                                            type="checkbox"
                                            name="save_after_train"
                                            checked={config.save_after_train}
                                            onChange={handleChange}
                                            disabled={loading}
                                            id="save_after_train"
                                        />
                                        <span className={styles.slider}></span>
                                    </label>
                                </div>
                                <div className={styles.switchItem}>
                                    <label className={styles.switchLabel} htmlFor="train_submodels">Train Submodels</label>
                                    <label className={styles.toggleSwitch}>
                                        <input
                                            type="checkbox"
                                            name="train_submodels"
                                            checked={config.train_submodels}
                                            onChange={handleChange}
                                            disabled={loading}
                                            id="train_submodels"
                                        />
                                        <span className={styles.slider}></span>
                                    </label>
                                </div>
                            </div>
                        </div>

                    </>
                )}


            </div>

            <div className={styles.card}>
                <button
                    onClick={handleTriggerModel}
                    disabled={loading || !container?.id}
                    className={styles.button}
                >
                    {loading ? 'Processing...' : 'Trigger Model Training'}
                </button>

                <div className={styles.logContainer} ref={logContainerRef}>
                    {logs.map((log, index) => (
                        <div key={index} className={styles.logItem}>{log}</div>
                    ))}
                </div>

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

            </div>
        </div>
    );
};
