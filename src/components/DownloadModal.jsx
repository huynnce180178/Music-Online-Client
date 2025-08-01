import { useState, useEffect } from "react";
import axios from "axios";
import { message } from 'antd';
import { useTranslation } from 'react-i18next';
import BASE_API_URL from "../services/base.api.url";

export default function DownloadModal({ open, onClose, songId, downloadInfo, onDownloadSuccess }) {
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const { t } = useTranslation();

    useEffect(() => {
        if (!open) {
            setIsDownloading(false);
            setDownloadProgress(0);
            setShowConfirmModal(false);
        } else {
            setShowConfirmModal(true);
        }
    }, [open]);

    const simulateProgress = () => {
        const steps = [30, 60, 80, 90];
        let currentStep = 0;
        const interval = setInterval(() => {
            if (currentStep < steps.length) {
                setDownloadProgress(steps[currentStep]);
                currentStep++;
            } else {
                clearInterval(interval);
            }
        }, 50);
        return interval;
    };

    const showNotification = (type, title, subtitle) => {
        const configs = {
            error: {
                icon: '❌',
                bg: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)',
                notificationBg: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                borderColor: '#ff4757',
                shadowColor: 'rgba(255, 71, 87, 0.3)',
                textColor: '#ff6b6b'
            },
            success: {
                icon: '✅',
                bg: 'linear-gradient(135deg, #56ab2f 0%, #a8e6cf 100%)',
                notificationBg: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                borderColor: '#2ed573',
                shadowColor: 'rgba(46, 213, 115, 0.3)',
                textColor: '#56ab2f'
            },
            info: {
                icon: 'ℹ️',
                bg: 'linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%)',
                notificationBg: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                borderColor: '#3742fa',
                shadowColor: 'rgba(55, 66, 250, 0.3)',
                textColor: '#4ecdc4'
            }
        };

        const config = configs[type];
        message[type]({
            content: (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: config.notificationBg, padding: '14px 18px', borderRadius: '12px', border: `2px solid ${config.borderColor}`, boxShadow: `0 8px 24px ${config.shadowColor}, 0 4px 12px rgba(0,0,0,0.3)`, backdropFilter: 'blur(15px)', minWidth: '280px', maxWidth: '400px', position: 'relative', overflow: 'hidden', animation: 'slideInRight 0.4s ease-out' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '100%', background: `radial-gradient(circle at 30% 50%, ${config.borderColor} 0%, transparent 70%)`, opacity: 0.08, animation: 'pulse 3s ease-in-out infinite' }}></div>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: config.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: 'white', fontWeight: 'bold', boxShadow: `0 4px 12px ${config.shadowColor}`, position: 'relative', zIndex: 1, animation: 'bounce 0.6s ease-out' }}>{config.icon}</div>
                    <div style={{ position: 'relative', zIndex: 1, flex: 1 }}>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: config.textColor, fontFamily: '"Poppins", sans-serif', textShadow: '0 1px 2px rgba(0,0,0,0.4)', marginBottom: '2px', letterSpacing: '0.3px' }}>{title}</div>
                        <div style={{ fontSize: '11px', color: '#b8b8b8', fontFamily: '"Poppins", sans-serif', opacity: 0.8, lineHeight: '1.3' }}>{subtitle}</div>
                    </div>
                </div>
            ),
            duration: type === 'error' ? 4 : 3,
            style: {
                background: 'none', boxShadow: 'none', border: 'none', padding: 0, margin: 0, zIndex: 10000,
            },
            className: 'custom-notification'

        });
    };



    const handleConfirmDownload = async () => {
        const token = localStorage.getItem("accessToken");
        setIsDownloading(true);
        setDownloadProgress(0);
        setShowConfirmModal(false);

        const progressInterval = simulateProgress();
        const downloadTimeout = setTimeout(() => {
            clearInterval(progressInterval);
            setIsDownloading(false);
            setDownloadProgress(0);
            onClose();
            showNotification('error', t('weekly_top_10.download_failed'), 'Please try again later');
        }, 30000);

        try {
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            
            if ('showSaveFilePicker' in window && !isMobile) {
                try {
                    const fileHandle = await window.showSaveFilePicker({
                        suggestedName: downloadInfo.fileName,
                        types: [{ description: 'MP3 File', accept: { 'audio/mpeg': ['.mp3'] } }]
                    });

                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 25000);
                    
                    const response = await fetch(`${BASE_API_URL}/api/v1/user/downloads/${songId}`, { 
                        signal: controller.signal,
                        headers: { 
                            'Authorization': `Bearer ${token}`,
                            'Accept': 'audio/mpeg,audio/*,*/*'
                        }
                    });
                    clearTimeout(timeoutId);

                    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

                    const fileData = await response.arrayBuffer();
                    const writable = await fileHandle.createWritable();
                    await writable.write(fileData);
                    await writable.close();

                    try {
                        await axios.post(`${BASE_API_URL}/api/v1/user/downloads/${songId}/record`, { songId }, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                    } catch (recordError) {
                        console.warn('Failed to record download:', recordError);
                    }

                    clearInterval(progressInterval);
                    clearTimeout(downloadTimeout);
                    setDownloadProgress(100);

                    setTimeout(() => {
                        setIsDownloading(false);
                        setDownloadProgress(0);
                        onClose();
                        onDownloadSuccess && onDownloadSuccess();
                        showNotification('success', t('weekly_top_10.download_success'));
                    }, 2000);

                } catch (fileError) {
                    clearInterval(progressInterval);
                    clearTimeout(downloadTimeout);
                    if (fileError.name === 'AbortError') {
                        setIsDownloading(false);
                        setDownloadProgress(0);
                        onClose();
                        showNotification('info', t('weekly_top_10.download_cancelled'));
                        return;
                    }
                    await fallbackDownload(downloadInfo, songId, token, progressInterval, downloadTimeout);
                }
            } else {
                await fallbackDownload(downloadInfo, songId, token, progressInterval, downloadTimeout);
            }
        } catch (error) {
            console.error('Download error:', error);
            clearInterval(progressInterval);
            clearTimeout(downloadTimeout);
            showNotification('error', t('weekly_top_10.download_failed'), 'Please check your connection');
            setIsDownloading(false);
            setDownloadProgress(0);
            setTimeout(() => onClose(), 1000);
        }
    };

    const fallbackDownload = async (downloadInfo, songId, token, progressInterval, downloadTimeout) => {
        try {
            const response = await fetch(`${BASE_API_URL}/api/v1/user/downloads/${songId}`, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'audio/mpeg,audio/*,*/*'
                }
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = downloadInfo.fileName;
            link.style.display = 'none';
            
            link.setAttribute('download', downloadInfo.fileName);
            link.setAttribute('type', 'audio/mpeg');
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            setTimeout(() => window.URL.revokeObjectURL(url), 1000);

            try {
                await axios.post(`${BASE_API_URL}/api/v1/user/downloads/${songId}/record`, { songId }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } catch (recordError) {
                console.warn('Failed to record download:', recordError);
            }

            clearInterval(progressInterval);
            clearTimeout(downloadTimeout);
            setDownloadProgress(100);

            setTimeout(() => {
                setIsDownloading(false);
                setDownloadProgress(0);
                onClose();
                onDownloadSuccess && onDownloadSuccess();
                showNotification('success', t('weekly_top_10.download_success'));
            }, 2000);

        } catch (error) {
            console.error('Fallback download error:', error);
            clearInterval(progressInterval);
            clearTimeout(downloadTimeout);
            setIsDownloading(false);
            setDownloadProgress(0);
            onClose();
            showNotification('error', t('weekly_top_10.download_failed'));
        }
    };

    const handleModalClose = () => {
        if (isDownloading) {
            showNotification('info', t('weekly_top_10.download_cancelled'));
            setIsDownloading(false);
            setDownloadProgress(0);
        }
        onClose();
    };

    return (
        <>

            {showConfirmModal && downloadInfo && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0, 0, 0, 0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, animation: 'fadeIn 0.4s ease-out' }}>
                    <div className="modal-container" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', borderRadius: '28px', padding: '48px', textAlign: 'center', boxShadow: '0 25px 80px rgba(0, 0, 0, 0.6)', border: '2px solid rgba(255, 255, 255, 0.2)', maxWidth: '500px', width: '90%', animation: 'slideUp 0.5s ease-out', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: '10%', left: '15%', width: '3px', height: '3px', background: '#ffd700', borderRadius: '50%', animation: 'firefly1 4s ease-in-out infinite', boxShadow: '0 0 6px rgba(255, 215, 0, 0.8)' }}></div>
                        <div style={{ position: 'absolute', top: '20%', right: '20%', width: '2px', height: '2px', background: '#ffed4e', borderRadius: '50%', animation: 'firefly2 3.5s ease-in-out infinite 0.5s', boxShadow: '0 0 4px rgba(255, 237, 78, 0.6)' }}></div>
                        <div style={{ position: 'absolute', bottom: '30%', left: '25%', width: '4px', height: '4px', background: '#ffd700', borderRadius: '50%', animation: 'firefly3 5s ease-in-out infinite 1s', boxShadow: '0 0 8px rgba(255, 215, 0, 0.7)' }}></div>
                        <div style={{ position: 'absolute', top: '40%', right: '10%', width: '2px', height: '2px', background: '#ffed4e', borderRadius: '50%', animation: 'firefly4 3s ease-in-out infinite 1.5s', boxShadow: '0 0 5px rgba(255, 237, 78, 0.5)' }}></div>
                        <div style={{ position: 'absolute', bottom: '20%', right: '30%', width: '3px', height: '3px', background: '#ffd700', borderRadius: '50%', animation: 'firefly5 4.5s ease-in-out infinite 0.8s', boxShadow: '0 0 7px rgba(255, 215, 0, 0.6)' }}></div>
                        <div style={{ position: 'absolute', top: '60%', left: '10%', width: '2px', height: '2px', background: '#ffed4e', borderRadius: '50%', animation: 'firefly6 3.8s ease-in-out infinite 2s', boxShadow: '0 0 4px rgba(255, 237, 78, 0.4)' }}></div>
                        <div style={{ position: 'absolute', bottom: '40%', left: '40%', width: '3px', height: '3px', background: '#ffd700', borderRadius: '50%', animation: 'firefly7 4.2s ease-in-out infinite 1.2s', boxShadow: '0 0 6px rgba(255, 215, 0, 0.5)' }}></div>
                        <div style={{ position: 'absolute', top: '15%', left: '50%', width: '2px', height: '2px', background: '#ffed4e', borderRadius: '50%', animation: 'firefly8 3.3s ease-in-out infinite 0.3s', boxShadow: '0 0 5px rgba(255, 237, 78, 0.6)' }}></div>

                        <button className="modal-close-button" onClick={handleModalClose} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer', zIndex: 10, width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s ease' }}
                            onMouseEnter={(e) => { e.target.style.background = 'rgba(255,255,255,0.1)'; }}
                            onMouseLeave={(e) => { e.target.style.background = 'none'; }}
                        >
                            ✕
                        </button>

                        <div className="modal-title" style={{ marginBottom: '32px', fontSize: '32px', fontWeight: '800', background: 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontFamily: "'Quicksand', 'Montserrat', sans-serif", textShadow: '0 4px 8px rgba(0,0,0,0.3)', lineHeight: '1.2', position: 'relative', animation: 'pulse 3s ease-in-out infinite' }}>
                            {downloadInfo.songTitle}
                            <div style={{ position: 'absolute', top: '-10px', right: '-15px', width: '6px', height: '6px', background: '#ffd700', borderRadius: '50%', animation: 'float 2s ease-in-out infinite', boxShadow: '0 0 8px rgba(255, 215, 0, 0.6)' }}></div>
                            <div style={{ position: 'absolute', bottom: '-5px', left: '-10px', width: '4px', height: '4px', background: '#ffed4e', borderRadius: '50%', animation: 'float 1.8s ease-in-out infinite 0.5s', boxShadow: '0 0 6px rgba(255, 237, 78, 0.5)' }}></div>
                        </div>

                        <div style={{ color: '#b8b8b8', fontSize: '18px', lineHeight: '1.6', marginBottom: '40px', maxWidth: '450px', margin: '0 auto 40px', padding: '0 20px', fontWeight: '400', position: 'relative', animation: 'fadeIn 1s ease-out' }}>
                            {t('weekly_top_10.download_confirm_message')}
                            <div style={{ position: 'absolute', bottom: '-8px', left: '50%', transform: 'translateX(-50%)', width: '60px', height: '2px', background: 'linear-gradient(90deg, transparent 0%, #ffd700 50%, transparent 100%)', animation: 'shimmer 2s ease-in-out infinite' }}></div>
                        </div>

                        <div style={{ padding: '30px 40px', background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(255, 237, 78, 0.1) 100%)', borderRadius: '24px', border: '2px solid rgba(255, 215, 0, 0.4)', fontSize: '18px', color: '#ffd700', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', maxWidth: '400px', margin: '0 auto 40px', boxShadow: '0 12px 40px rgba(255, 215, 0, 0.2)', position: 'relative', transition: 'all 0.3s ease', cursor: 'pointer', overflow: 'hidden' }} onMouseEnter={(e) => { e.target.style.transform = 'translateY(-4px) scale(1.02)'; e.target.style.boxShadow = '0 20px 60px rgba(255, 215, 0, 0.3)'; e.target.style.border = '2px solid rgba(255, 215, 0, 0.6)'; }} onMouseLeave={(e) => { e.target.style.transform = 'translateY(0) scale(1)'; e.target.style.boxShadow = '0 12px 40px rgba(255, 215, 0, 0.2)'; e.target.style.border = '2px solid rgba(255, 215, 0, 0.4)'; }}>
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '100%', background: 'linear-gradient(90deg, transparent 0%, rgba(255, 215, 0, 0.1) 50%, transparent 100%)', animation: 'shimmer 3s ease-in-out infinite' }}></div>
                            <span style={{ fontSize: '24px', animation: 'pulse 2s ease-in-out infinite' }}>📁</span>
                            <span style={{ position: 'relative', zIndex: 1 }}>{downloadInfo.fileName}</span>
                            <div style={{ position: 'absolute', top: '20%', right: '10%', width: '4px', height: '4px', background: 'rgba(255, 215, 0, 0.6)', borderRadius: '50%', animation: 'float 2s ease-in-out infinite 0.3s', boxShadow: '0 0 6px rgba(255, 215, 0, 0.4)' }}></div>
                            <div style={{ position: 'absolute', bottom: '30%', left: '15%', width: '3px', height: '3px', background: 'rgba(255, 237, 78, 0.5)', borderRadius: '50%', animation: 'float 1.8s ease-in-out infinite 0.8s', boxShadow: '0 0 5px rgba(255, 237, 78, 0.3)' }}></div>
                        </div>

                        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button className="modal-button" onClick={handleModalClose} style={{ padding: '16px 32px', background: 'linear-gradient(135deg, #4a4a4a 0%, #2a2a2a 100%)', border: '2px solid #666', borderRadius: '12px', color: '#fff', fontSize: '16px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s ease', minWidth: '120px' }}
                                onMouseEnter={(e) => {
                                    e.target.style.background = 'linear-gradient(135deg, #5a5a5a 0%, #3a3a3a 100%)';
                                    e.target.style.border = '2px solid #888';
                                    e.target.style.transform = 'translateY(-2px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.background = 'linear-gradient(135deg, #4a4a4a 0%, #2a2a2a 100%)';
                                    e.target.style.border = '2px solid #666';
                                    e.target.style.transform = 'translateY(0)';
                                }}
                            >
                                {t('weekly_top_10.cancel')}
                            </button>

                            <button className="modal-button" onClick={handleConfirmDownload} style={{ padding: '16px 32px', background: 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)', border: 'none', borderRadius: '12px', color: '#1a1a2e', fontSize: '16px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.3s ease', minWidth: '120px', boxShadow: '0 8px 24px rgba(255, 215, 0, 0.3)' }}
                                onMouseEnter={(e) => {
                                    e.target.style.transform = 'translateY(-2px) scale(1.05)';
                                    e.target.style.boxShadow = '0 12px 32px rgba(255, 215, 0, 0.4)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.transform = 'translateY(0) scale(1)';
                                    e.target.style.boxShadow = '0 8px 24px rgba(255, 215, 0, 0.3)';
                                }}
                            >
                                {t('weekly_top_10.download')}
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {isDownloading && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0, 0, 0, 0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, animation: 'fadeIn 0.4s ease-out' }}>
                    <div className="modal-container" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', borderRadius: '28px', padding: '48px', textAlign: 'center', boxShadow: '0 25px 80px rgba(0, 0, 0, 0.6)', border: '2px solid rgba(255, 255, 255, 0.2)', maxWidth: '450px', width: '90%', animation: 'slideUp 0.5s ease-out', position: 'relative', overflow: 'hidden' }}>

                        <div style={{ position: 'absolute', top: '5%', left: '10%', width: '3px', height: '3px', background: '#ffd700', borderRadius: '50%', animation: 'firefly1 4s ease-in-out infinite', boxShadow: '0 0 6px rgba(255, 215, 0, 0.8)' }}></div>
                        <div style={{ position: 'absolute', top: '15%', right: '15%', width: '2px', height: '2px', background: '#ffed4e', borderRadius: '50%', animation: 'firefly2 3.5s ease-in-out infinite 0.5s', boxShadow: '0 0 4px rgba(255, 237, 78, 0.6)' }}></div>
                        <div style={{ position: 'absolute', bottom: '25%', left: '20%', width: '4px', height: '4px', background: '#ffd700', borderRadius: '50%', animation: 'firefly3 5s ease-in-out infinite 1s', boxShadow: '0 0 8px rgba(255, 215, 0, 0.7)' }}></div>
                        <div style={{ position: 'absolute', top: '35%', right: '8%', width: '2px', height: '2px', background: '#ffed4e', borderRadius: '50%', animation: 'firefly4 3s ease-in-out infinite 1.5s', boxShadow: '0 0 5px rgba(255, 237, 78, 0.5)' }}></div>
                        <div style={{ position: 'absolute', bottom: '15%', right: '25%', width: '3px', height: '3px', background: '#ffd700', borderRadius: '50%', animation: 'firefly5 4.5s ease-in-out infinite 0.8s', boxShadow: '0 0 7px rgba(255, 215, 0, 0.6)' }}></div>
                        <div style={{ position: 'absolute', top: '50%', left: '8%', width: '2px', height: '2px', background: '#ffed4e', borderRadius: '50%', animation: 'firefly6 3.8s ease-in-out infinite 2s', boxShadow: '0 0 4px rgba(255, 237, 78, 0.4)' }}></div>
                        <div style={{ position: 'absolute', bottom: '35%', left: '35%', width: '3px', height: '3px', background: '#ffd700', borderRadius: '50%', animation: 'firefly7 4.2s ease-in-out infinite 1.2s', boxShadow: '0 0 6px rgba(255, 215, 0, 0.5)' }}></div>
                        <div style={{ position: 'absolute', top: '10%', left: '45%', width: '2px', height: '2px', background: '#ffed4e', borderRadius: '50%', animation: 'firefly8 3.3s ease-in-out infinite 0.3s', boxShadow: '0 0 5px rgba(255, 237, 78, 0.6)' }}></div>
                        <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '60px', height: '60px', background: 'rgba(255, 215, 0, 0.1)', borderRadius: '50%', animation: 'pulse 2s ease-in-out infinite' }}></div>
                        <div style={{ position: 'absolute', bottom: '-15px', left: '-15px', width: '40px', height: '40px', background: 'rgba(255, 215, 0, 0.08)', borderRadius: '50%', animation: 'pulse 2s ease-in-out infinite 1s' }}></div>
                        <div style={{ width: '120px', height: '120px', margin: '0 auto 32px', position: 'relative' }}>

                            <div style={{ width: '100%', height: '100%', border: '4px solid rgba(255, 215, 0, 0.2)', borderRadius: '50%', position: 'absolute', animation: 'pulse 2s ease-in-out infinite' }}></div>
                            <div style={{ width: '100%', height: '100%', border: '4px solid rgba(255, 215, 0, 0.3)', borderTop: '4px solid #ffd700', borderRadius: '50%', animation: 'spin 1.2s linear infinite', boxShadow: '0 0 30px rgba(255, 215, 0, 0.3)', position: 'absolute' }}></div>
                            <div style={{ width: '80%', height: '80%', border: '3px solid rgba(255, 215, 0, 0.4)', borderRadius: '50%', position: 'absolute', top: '10%', left: '10%', animation: 'pulse 1.5s ease-in-out infinite 0.5s' }}></div>
                            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '40px', color: '#ffd700', fontWeight: 'bold', textShadow: '0 2px 4px rgba(0,0,0,0.3)', animation: 'float 2s ease-in-out infinite' }}>
                                📁
                            </div>

                            <div style={{ position: 'absolute', top: '-10px', right: '-10px', width: '8px', height: '8px', background: '#ffd700', borderRadius: '50%', animation: 'float 1.5s ease-in-out infinite 0.3s', boxShadow: '0 0 10px rgba(255, 215, 0, 0.8)' }}></div>
                            <div style={{ position: 'absolute', bottom: '-5px', left: '-5px', width: '6px', height: '6px', background: '#ffed4e', borderRadius: '50%', animation: 'float 1.8s ease-in-out infinite 0.7s', boxShadow: '0 0 8px rgba(255, 237, 78, 0.6)' }}></div>
                        </div>

                        <h3 style={{ color: '#ffd700', fontSize: '16px', fontWeight: '900', marginBottom: '12px', fontFamily: "'Poppins', 'Inter', sans-serif", textShadow: '0 2px 4px rgba(0,0,0,0.3)', letterSpacing: '0.4px', textTransform: 'uppercase' }}>
                            {t('weekly_top_10.downloading')}
                        </h3>

                        <div style={{ width: '100%', height: '10px', background: 'rgba(255, 215, 0, 0.2)', borderRadius: '5px', marginBottom: '12px', overflow: 'hidden', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)', position: 'relative' }}>
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '100%', background: 'linear-gradient(90deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 237, 78, 0.05) 100%)', borderRadius: '5px', animation: 'pulse 2s ease-in-out infinite' }}></div>
                            <div style={{ width: `${downloadProgress}%`, height: '100%', background: 'linear-gradient(90deg, #ffd700 0%, #ffed4e 100%)', borderRadius: '5px', transition: 'width 0.4s ease', boxShadow: '0 0 20px rgba(255, 215, 0, 0.6)', position: 'relative', overflow: 'hidden' }}>
                                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '50%', background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)', animation: 'shimmer 1.5s ease-in-out infinite' }}></div>
                                <div style={{ position: 'absolute', top: '50%', left: '10%', transform: 'translateY(-50%)', width: '4px', height: '4px', background: 'rgba(255,255,255,0.8)', borderRadius: '50%', animation: 'pulse 1s ease-in-out infinite' }}></div>
                                <div style={{ position: 'absolute', top: '50%', left: '30%', transform: 'translateY(-50%)', width: '3px', height: '3px', background: 'rgba(255,255,255,0.6)', borderRadius: '50%', animation: 'pulse 1.2s ease-in-out infinite 0.3s' }}></div>
                            </div>
                        </div>

                        <p style={{ color: '#ffffff', fontSize: '12px', margin: 0, fontFamily: "'Poppins', sans-serif", fontWeight: '700', textShadow: '0 1px 2px rgba(0,0,0,0.3)', letterSpacing: '0.2px', animation: 'pulse 2s ease-in-out infinite' }}>
                            {downloadProgress}% {t('weekly_top_10.complete')}
                        </p>

                        {downloadInfo && (
                            <div style={{ marginTop: '16px', padding: '12px', background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(255, 237, 78, 0.1) 100%)', borderRadius: '12px', border: '2px solid rgba(255, 215, 0, 0.4)', boxShadow: '0 8px 32px rgba(255, 215, 0, 0.2)', position: 'relative', overflow: 'hidden' }}>
                                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '100%', background: 'linear-gradient(90deg, transparent 0%, rgba(255, 215, 0, 0.1) 50%, transparent 100%)', animation: 'shimmer 3s ease-in-out infinite' }}></div>
                                <p style={{ color: '#ffd700', fontSize: '10px', margin: 0, fontWeight: '700', textShadow: '0 1px 2px rgba(0,0,0,0.3)', fontFamily: "'Poppins', sans-serif", letterSpacing: '0.1px', position: 'relative', zIndex: 1 }}>
                                    📄 {downloadInfo.fileName}
                                </p>
                                <div style={{ position: 'absolute', top: '20%', right: '10%', width: '3px', height: '3px', background: 'rgba(255, 215, 0, 0.6)', borderRadius: '50%', animation: 'float 2s ease-in-out infinite 0.5s' }}></div>
                                <div style={{ position: 'absolute', bottom: '30%', left: '15%', width: '2px', height: '2px', background: 'rgba(255, 237, 78, 0.4)', borderRadius: '50%', animation: 'float 1.8s ease-in-out infinite 1s' }}></div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <style>{`
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp { from { opacity: 0; transform: translateY(40px) scale(0.9); } to { opacity: 1; transform: translateY(0) scale(1); } }
                 @keyframes slideInRight { from { opacity: 0; transform: translateX(100px) scale(0.9); } to { opacity: 1; transform: translateX(0) scale(1); } }
                @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
                @keyframes pulse { 0%, 100% { opacity: 0.5; transform: scale(1); } 50% { opacity: 0.8; transform: scale(1.1); } }
                 @keyframes bounce { 0% { transform: scale(0.3); opacity: 0; } 50% { transform: scale(1.1); } 70% { transform: scale(0.9); } 100% { transform: scale(1); opacity: 1; } }
                @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
                 
                 /* Firefly animations - Hiệu ứng đom đóm */
                 @keyframes firefly1 {
                     0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.3; }
                     25% { transform: translate(20px, -30px) scale(1.2); opacity: 1; }
                     50% { transform: translate(40px, -20px) scale(0.8); opacity: 0.7; }
                     75% { transform: translate(30px, -40px) scale(1.1); opacity: 0.9; }
                 }
                 @keyframes firefly2 {
                     0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.4; }
                     30% { transform: translate(-25px, -25px) scale(1.3); opacity: 1; }
                     60% { transform: translate(-40px, -15px) scale(0.9); opacity: 0.6; }
                     90% { transform: translate(-20px, -35px) scale(1.2); opacity: 0.8; }
                 }
                 @keyframes firefly3 {
                     0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.5; }
                     20% { transform: translate(30px, 20px) scale(1.4); opacity: 1; }
                     40% { transform: translate(50px, 10px) scale(0.7); opacity: 0.8; }
                     60% { transform: translate(35px, 30px) scale(1.1); opacity: 0.9; }
                     80% { transform: translate(45px, 5px) scale(0.9); opacity: 0.6; }
                 }
                 @keyframes firefly4 {
                     0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.3; }
                     25% { transform: translate(-15px, -20px) scale(1.1); opacity: 1; }
                     50% { transform: translate(-30px, -10px) scale(0.8); opacity: 0.7; }
                     75% { transform: translate(-10px, -25px) scale(1.2); opacity: 0.9; }
                 }
                 @keyframes firefly5 {
                     0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.4; }
                     15% { transform: translate(25px, 15px) scale(1.3); opacity: 1; }
                     30% { transform: translate(40px, 5px) scale(0.9); opacity: 0.8; }
                     45% { transform: translate(30px, 20px) scale(1.1); opacity: 0.9; }
                     60% { transform: translate(45px, 10px) scale(0.8); opacity: 0.6; }
                     75% { transform: translate(35px, 25px) scale(1.2); opacity: 0.8; }
                     90% { transform: translate(50px, 0px) scale(0.9); opacity: 0.7; }
                 }
                 @keyframes firefly6 {
                     0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.3; }
                     20% { transform: translate(-20px, -15px) scale(1.2); opacity: 1; }
                     40% { transform: translate(-35px, -5px) scale(0.8); opacity: 0.7; }
                     60% { transform: translate(-25px, -20px) scale(1.1); opacity: 0.9; }
                     80% { transform: translate(-40px, -10px) scale(0.9); opacity: 0.6; }
                 }
                 @keyframes firefly7 {
                     0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.5; }
                     10% { transform: translate(15px, -25px) scale(1.4); opacity: 1; }
                     20% { transform: translate(30px, -15px) scale(0.7); opacity: 0.8; }
                     30% { transform: translate(20px, -30px) scale(1.1); opacity: 0.9; }
                     40% { transform: translate(35px, -10px) scale(0.8); opacity: 0.6; }
                     50% { transform: translate(25px, -25px) scale(1.2); opacity: 0.8; }
                     60% { transform: translate(40px, -5px) scale(0.9); opacity: 0.7; }
                     70% { transform: translate(30px, -20px) scale(1.1); opacity: 0.9; }
                     80% { transform: translate(45px, -15px) scale(0.8); opacity: 0.6; }
                     90% { transform: translate(35px, -25px) scale(1.3); opacity: 0.8; }
                 }
                 @keyframes firefly8 {
                     0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.4; }
                     12% { transform: translate(-10px, -20px) scale(1.1); opacity: 1; }
                     24% { transform: translate(-25px, -10px) scale(0.8); opacity: 0.7; }
                     36% { transform: translate(-15px, -25px) scale(1.2); opacity: 0.9; }
                     48% { transform: translate(-30px, -5px) scale(0.9); opacity: 0.6; }
                     60% { transform: translate(-20px, -20px) scale(1.1); opacity: 0.8; }
                     72% { transform: translate(-35px, -15px) scale(0.8); opacity: 0.7; }
                     84% { transform: translate(-25px, -25px) scale(1.2); opacity: 0.9; }
                     96% { transform: translate(-40px, -10px) scale(0.9); opacity: 0.6; }
                 }
                .custom-notification .ant-message-notice-content .ant-message-custom-content > span:first-child {
                    display: none !important;
                }
                
                .custom-notification .anticon {
                    display: none !important;
                }
                
                .custom-notification .ant-message-notice-content > span:first-child {
                    display: none !important;
                }
                
                .custom-notification .ant-message-notice {
                    background: none !important;
                    border: none !important;
                    box-shadow: none !important;
                    padding: 0 !important;
                    margin: 0 !important;
                }
                
                .custom-notification .ant-message-notice-content {
                    background: none !important;
                    border: none !important;
                    box-shadow: none !important;
                    padding: 0 !important;
                    margin: 0 !important;
                }
                
                .custom-notification .ant-message-custom-content {
                    background: none !important;
                    border: none !important;
                    box-shadow: none !important;
                    padding: 0 !important;
                    margin: 0 !important;
                }
                
                /* Responsive Design for DownloadModal */
                @media (max-width: 768px) {
                    .modal-container {
                        max-width: 450px !important;
                        padding: 32px !important;
                        border-radius: 20px !important;
                    }
                    
                    .modal-title {
                        font-size: 28px !important;
                        margin-bottom: 24px !important;
                    }
                    
                    .modal-button {
                        padding: 14px 28px !important;
                        font-size: 15px !important;
                        min-width: 110px !important;
                    }
                }
                
                @media (max-width: 480px) {
                    .modal-container {
                        max-width: 380px !important;
                        padding: 24px !important;
                        border-radius: 16px !important;
                        width: 95% !important;
                    }
                    
                    .modal-title {
                        font-size: 24px !important;
                        margin-bottom: 20px !important;
                    }
                    
                    .modal-button {
                        padding: 12px 24px !important;
                        font-size: 14px !important;
                        min-width: 100px !important;
                    }
                    
                    .modal-close-button {
                        width: 32px !important;
                        height: 32px !important;
                        font-size: 18px !important;
                    }
                }

                /* Mobile-specific optimizations */
                @media (max-width: 480px) {
                    .modal-container {
                        margin: 10px !important;
                        max-height: 90vh !important;
                        overflow-y: auto !important;
                    }
                    
                    .modal-title {
                        font-size: 20px !important;
                        line-height: 1.3 !important;
                    }
                    
                    .modal-button {
                        padding: 10px 20px !important;
                        font-size: 13px !important;
                        min-width: 90px !important;
                        margin: 5px !important;
                    }
                }

                /* Touch device optimizations */
                @media (hover: none) and (pointer: coarse) {
                    .modal-button {
                        min-height: 44px !important;
                        padding: 12px 24px !important;
                    }
                    
                    .modal-close-button {
                        min-height: 44px !important;
                        min-width: 44px !important;
                    }
                }

                /* iOS Safari specific fixes */
                @supports (-webkit-touch-callout: none) {
                    .modal-container {
                        -webkit-overflow-scrolling: touch !important;
                    }
                    
                    .modal-button {
                        -webkit-appearance: none !important;
                        -webkit-tap-highlight-color: transparent !important;
                    }
                }
            `}</style>
        </>
    );
} 