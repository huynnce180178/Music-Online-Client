import { useState, useEffect, useRef } from "react";
import { message } from "antd";
import axios from "axios";
import PropTypes from "prop-types";
import { useTranslation } from 'react-i18next';
import BASE_API_URL from "../services/base.api.url";

const moodOptions = [
    { emoji: "😊", text: "Happy and positive" },
    { emoji: "😢", text: "Feeling sad" },
    { emoji: "😡", text: "Angry or frustrated" },
    { emoji: "😴", text: "Tired or sleepy" },
    { emoji: "🤩", text: "Excited and energetic" },
    { emoji: "😌", text: "Calm and relaxed" },
    { emoji: "🥳", text: "Ready to party" },
    { emoji: "😔", text: "A bit down" },
];

function toSnakeCase(str) {
    return str.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

export default function MoodModal({ open, onClose, onMoodSelected }) {
    const { t } = useTranslation();
    const [selectedMood, setSelectedMood] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [hasTodayMood, setHasTodayMood] = useState(false);
    const [funIndex, setFunIndex] = useState(0);
    const [typedMsg, setTypedMsg] = useState("");
    const typingRef = useRef(null);

    // Get translated fun messages
    const getFunMessages = () => [
        t('mood_modal.fun_message_1'),
        t('mood_modal.fun_message_2'),
        t('mood_modal.fun_message_3'),
        t('mood_modal.fun_message_4'),
        t('mood_modal.fun_message_5')
    ];

    // Typewriter effect for fun message
    useEffect(() => {
        if (submitting) {
            const funMessages = getFunMessages();
            setTypedMsg("");
            let i = 0;
            typingRef.current = setInterval(() => {
                setTypedMsg(funMessages[funIndex].slice(0, i + 1));
                i++;
                if (i >= funMessages[funIndex].length) clearInterval(typingRef.current);
            }, 40);
            return () => clearInterval(typingRef.current);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [submitting, funIndex, t]);

    // Change fun message every 2s while submitting
    useEffect(() => {
        if (!submitting) return;
        const interval = setInterval(() => {
            setFunIndex(idx => (idx + 1) % 5);
        }, 8000);
        return () => clearInterval(interval);
    }, [submitting]);

    useEffect(() => {
        if (open) {
            axios
                .get(`${BASE_API_URL}/api/v1/user/MoodSong/hasTodayMood`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
                })
                .then(res => {
                    if (res.data?.data) {
                        setHasTodayMood(true);
                        message.info(t('mood_modal.already_submitted'));
                        setTimeout(onClose, 1500);
                    } else {
                        setHasTodayMood(false);
                    }
                })
                .catch(() => {
                    message.error(t('mood_modal.check_error'));
                });
        }
    }, [open, onClose, t]);

    const handleSubmit = async () => {
        if (!selectedMood) {
            message.warning(t('mood_modal.select_warning'));
            return;
        }
        setSubmitting(true);
        try {
            await axios.post(
                `${BASE_API_URL}/api/v1/user/MoodSong/suggest`,
                { userText: selectedMood.text },
                { headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` } }
            );
            message.success(t('mood_modal.submit_success'));
            onMoodSelected?.(selectedMood.text);
            onClose();
        } catch {
            message.error(t('mood_modal.submit_error'));
        }
        setSubmitting(false);
    };

    return (
        <>
            {open && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                    background: 'rgba(10, 20, 40, 0.85)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', zIndex: 9999, animation: 'fadeIn 0.4s ease-out'
                }}>
                    <div className="modal-container glass"
                        style={{
                            background: 'rgba(30, 50, 80, 0.55)',
                            borderRadius: '38px', padding: '54px 38px', textAlign: 'center',
                            boxShadow: '0 0 60px 0 #21A8C5, 0 25px 80px rgba(0,0,0,0.6)',
                            border: '2.5px solid rgba(33,168,197,0.25)', maxWidth: '440px',
                            width: '98vw', animation: 'slideUp 0.5s ease-out', position: 'relative', overflow: 'hidden',
                            backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)'
                        }}
                    >
                        {/* Firefly dots */}
                        <div style={{ position: 'absolute', top: '12%', left: '13%', width: '4px', height: '4px', background: '#21A8C5', borderRadius: '50%', animation: 'firefly1 7s ease-in-out infinite', boxShadow: '0 0 12px #21A8C5', opacity: 0.5 }}></div>
                        <div style={{ position: 'absolute', top: '22%', right: '18%', width: '3px', height: '3px', background: '#3ed8ff', borderRadius: '50%', animation: 'firefly2 6.5s ease-in-out infinite 0.5s', boxShadow: '0 0 8px #3ed8ff', opacity: 0.4 }}></div>
                        <div style={{ position: 'absolute', bottom: '28%', left: '27%', width: '5px', height: '5px', background: '#21A8C5', borderRadius: '50%', animation: 'firefly3 8s ease-in-out infinite 1s', boxShadow: '0 0 16px #21A8C5', opacity: 0.5 }}></div>
                        <div style={{ position: 'absolute', top: '38%', right: '12%', width: '3px', height: '3px', background: '#3ed8ff', borderRadius: '50%', animation: 'firefly4 6s ease-in-out infinite 1.5s', boxShadow: '0 0 10px #3ed8ff', opacity: 0.4 }}></div>
                        {/* Glow border */}
                        <div style={{
                            position: 'absolute', inset: 0, borderRadius: '38px',
                            boxShadow: '0 0 80px 10px #21A8C5, 0 0 0 8px rgba(33,168,197,0.12)',
                            pointerEvents: 'none', zIndex: 0
                        }}></div>
                        {/* Close button */}
                        <button
                            className="modal-close-button"
                            onClick={onClose}
                            style={{
                                position: 'absolute', top: '18px', right: '18px', background: 'rgba(0, 0, 0, 0.5)',
                                border: 'none', color: '#fff', fontSize: '22px', cursor: 'pointer', zIndex: 1000,
                                width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center',
                                justifyContent: 'center', transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={e => { e.target.style.background = '#21A8C5'; }}
                            onMouseLeave={e => { e.target.style.background = 'rgba(0, 0, 0, 0.5)'; }}
                        >✕</button>
                        {/* Title */}
                        <div className="modal-title"
                            style={{
                                marginBottom: '38px', fontSize: '30px', fontWeight: '800',
                                background: 'linear-gradient(135deg, #21A8C5 0%, #3ed8ff 60%, #7f53ff 100%)',
                                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                                fontFamily: "'Quicksand', 'Montserrat', sans-serif",
                                textShadow: '0 4px 18px rgba(33,168,197,0.25)', lineHeight: '1.2',
                                position: 'relative', animation: 'pulse 3s ease-in-out infinite'
                            }}
                        >
                            {t('mood_modal.title')}
                        </div>
                        {/* Mood circle */}
                        <div
                            className={`mood-circle${submitting ? " rotating" : ""}`}
                            style={{
                                position: "relative",
                                width: 220,
                                height: 220,
                                margin: "0 auto 32px auto",
                                transition: "filter 0.3s"
                            }}
                        >
                            {moodOptions.map((opt, idx) => {
                                const angle = (idx / moodOptions.length) * 2 * Math.PI;
                                // Sử dụng logic tính toán giống desktop cho tất cả responsive
                                const r = 85;
                                const x = Math.round(r * Math.cos(angle - Math.PI / 2)) + 110 - 32;
                                const y = Math.round(r * Math.sin(angle - Math.PI / 2)) + 110 - 32;

                                return (
                                    <button
                                        key={opt.emoji}
                                        type="button"
                                        className="mood-btn"
                                        style={{
                                            position: "absolute", left: x, top: y,
                                            fontSize: 32, borderRadius: 20, width: 64, height: 64,
                                            minWidth: 48, minHeight: 48, display: "flex", alignItems: "center",
                                            justifyContent: "center", boxShadow: selectedMood?.emoji === opt.emoji ? "0 0 24px #21A8C5, 0 0 8px #3ed8ff" : "0 2px 8px #0002",
                                            border: selectedMood?.emoji === opt.emoji ? "2.5px solid #21A8C5" : "2px solid #222",
                                            background: selectedMood?.emoji === opt.emoji ? "linear-gradient(135deg, #21A8C5 0%, #3ed8ff 100%)" : "rgba(33,168,197,0.10)",
                                            color: "#fff", cursor: hasTodayMood || submitting ? "not-allowed" : "pointer",
                                            transform: selectedMood?.emoji === opt.emoji ? "scale(1.18)" : "scale(1)",
                                            transition: "transform 0.2s, box-shadow 0.2s, border 0.2s",
                                            outline: "none",
                                            filter: selectedMood?.emoji === opt.emoji ? "drop-shadow(0 0 12px #21A8C5)" : undefined
                                        }}
                                        onClick={() => setSelectedMood(opt)}
                                        disabled={hasTodayMood || submitting}
                                        onMouseEnter={e => { e.target.style.boxShadow = "0 0 32px #21A8C5, 0 0 12px #3ed8ff"; e.target.style.transform = "scale(1.22)"; }}
                                        onMouseLeave={e => { e.target.style.boxShadow = selectedMood?.emoji === opt.emoji ? "0 0 24px #21A8C5, 0 0 8px #3ed8ff" : "0 2px 8px #0002"; e.target.style.transform = selectedMood?.emoji === opt.emoji ? "scale(1.18)" : "scale(1)"; }}
                                    >
                                        {opt.emoji}
                                    </button>
                                );
                            })}
                            {/* Center glow */}
                            <div style={{
                                position: "absolute",
                                left: "50%",
                                top: "50%",
                                transform: "translate(-50%, -50%)",
                                width: 40,
                                height: 40,
                                borderRadius: "50%", background: "radial-gradient(circle, #21A8C5 0%, #3ed8ff 80%, transparent 100%)",
                                boxShadow: "0 0 40px 10px #21A8C5", opacity: 0.18, pointerEvents: "none"
                            }}></div>
                        </div>
                        {/* Mood text */}
                        <div style={{
                            textAlign: "center", minHeight: 28, color: "#21A8C5",
                            fontWeight: 700, fontSize: 20, marginBottom: 18,
                            textShadow: "0 0 8px #21A8C5"
                        }}>
                            {selectedMood ? t(`mood_modal.${toSnakeCase(selectedMood.text)}`) : ''}
                        </div>
                        {/* Buttons - Ẩn khi submitting */}
                        {!submitting && (
                            <div style={{ display: "flex", gap: 18, marginTop: 12, justifyContent: "center", flexWrap: "wrap" }}>
                                <button
                                    className="modal-button"
                                    onClick={onClose}
                                    style={{
                                        padding: '16px 32px', background: 'linear-gradient(135deg, #4a4a4a 0%, #2a2a2a 100%)',
                                        border: '2px solid #666', borderRadius: '14px', color: '#fff', fontSize: '16px',
                                        fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s ease', minWidth: '120px'
                                    }}
                                    disabled={submitting}
                                >
                                    {t('mood_modal.skip')}
                                </button>
                                <button
                                    className="modal-button ripple"
                                    onClick={handleSubmit}
                                    disabled={hasTodayMood || submitting}
                                    style={{
                                        padding: '18px 38px', background: submitting ? 'linear-gradient(135deg, #666 0%, #444 100%)' : 'linear-gradient(135deg, #21A8C5 0%, #3ed8ff 100%)',
                                        border: 'none', borderRadius: '14px', color: '#fff', fontSize: '18px', fontWeight: '700',
                                        cursor: submitting ? 'not-allowed' : 'pointer', transition: 'all 0.3s ease', minWidth: '140px',
                                        boxShadow: '0 8px 32px #21A8C5', opacity: submitting ? 0.7 : 1,
                                        position: "relative", overflow: "hidden"
                                    }}
                                >
                                    {submitting ? t("mood_modal.submitting") || "Submitting..." : t('mood_modal.submit')}
                                </button>
                            </div>
                        )}
                        {/* Submitting effect */}
                        {submitting && (
                            <div style={{
                                marginTop: 32, textAlign: "center", minHeight: 40, fontSize: 22,
                                color: "#21A8C5", fontWeight: 700, letterSpacing: 1, display: "flex",
                                flexDirection: "column", alignItems: "center", gap: 8,
                            }}>
                                <span style={{
                                    fontSize: 44, animation: "bounce 0.7s infinite", display: "inline-block",
                                    filter: "drop-shadow(0 0 16px #21A8C5)"
                                }}>
                                    {selectedMood?.emoji || "🎶"}
                                </span>
                                <span>{typedMsg}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}
            <style>{`
        .glass {
            background: rgba(30, 50, 80, 0.55);
            box-shadow: 0 0 60px 0 #21A8C5, 0 25px 80px rgba(0,0,0,0.6);
            border: 2.5px solid rgba(33,168,197,0.25);
            backdrop-filter: blur(18px);
        }
        .ripple:active::after {
            content: '';
            position: absolute;
            left: 50%; top: 50%;
            width: 0; height: 0;
            background: rgba(33,168,197,0.25);
            border-radius: 50%;
            transform: translate(-50%, -50%);
            animation: ripple-effect 0.5s linear;
            z-index: 1;
        }
        @keyframes ripple-effect {
            0% { width: 0; height: 0; opacity: 0.7; }
            100% { width: 180px; height: 180px; opacity: 0; }
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(40px) scale(0.9); } to { opacity: 1, transform: translateY(0) scale(1); } }
        @keyframes bounce { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-12px);} }
        @keyframes pulse { 0%,100%{opacity:0.5;transform:scale(1);} 50%{opacity:0.8;transform:scale(1.1);} }
        @keyframes firefly1 { 0%,100%{transform:translate(0,0) scale(1);opacity:0.3;} 25%{transform:translate(20px,-30px) scale(1.2);opacity:1;} 50%{transform:translate(40px,-20px) scale(0.8);opacity:0.7;} 75%{transform:translate(30px,-40px) scale(1.1);opacity:0.9;} }
        @keyframes firefly2 { 0%,100%{transform:translate(0,0) scale(1);opacity:0.4;} 30%{transform:translate(-25px,-25px) scale(1.3);opacity:1;} 60%{transform:translate(-40px,-15px) scale(0.9);opacity:0.6;} 90%{transform:translate(-20px,-35px) scale(1.2);opacity:0.8;} }
        @keyframes firefly3 { 0%,100%{transform:translate(0,0) scale(1);opacity:0.5;} 20%{transform:translate(30px,20px) scale(1.4);opacity:1;} 40%{transform:translate(50px,10px) scale(0.7);opacity:0.8;} 60%{transform:translate(35px,30px) scale(1.1);opacity:0.9;} 80%{transform:translate(45px,5px) scale(0.9);opacity:0.6;} }
        @keyframes firefly4 { 0%,100%{transform:translate(0,0) scale(1);opacity:0.3;} 25%{transform:translate(-15px,-20px) scale(1.1);opacity:1;} 50%{transform:translate(-30px,-10px) scale(0.8);opacity:0.7;} 75%{transform:translate(-10px,-25px) scale(1.2);opacity:0.9;} }
        .modal-container { box-sizing: border-box; }
        .modal-title { user-select: none; }
        .mood-btn:focus { outline: 2px solid #21A8C5; }
        .modal-button:focus { outline: 2px solid #21A8C5; }
        .mood-circle.rotating {
            animation: rotateMoodCircle 3s linear infinite;
        }
        @keyframes rotateMoodCircle {
            0% { transform: rotate(0deg);}
            100% { transform: rotate(360deg);}
        }
        @keyframes rotateMoodCircleMobile {
            0% { transform: scale(0.9) rotate(0deg);}
            100% { transform: scale(0.9) rotate(360deg);}
        }

        /* Mobile - tối ưu cuối cùng */
        @media (max-width: 600px) {
            .modal-container {
                max-width: 96vw !important;
                min-width: 0 !important;
                padding: 16px 3vw 70px 3vw !important;
                border-radius: 0 !important;
                box-sizing: border-box !important;
                display: grid !important;
                place-items: center !important;
                grid-template-rows: auto auto 1fr auto !important;
                gap: 16px !important;
            }
            .modal-title {
                font-size: 16px !important;
                margin-bottom: 0 !important;
                line-height: 1.2 !important;
                word-break: break-word !important;
                max-width: 90% !important;
                justify-self: center !important;
            }
            .mood-circle {
                width: 200px !important;
                height: 200px !important;
                margin: 0 !important;
                position: relative !important;
                justify-self: center !important;
                transform: scale(0.9) !important;
            }
            .mood-circle.rotating {
                animation: rotateMoodCircleMobile 3s linear infinite !important;
            }
            .mood-btn {
                font-size: 24px !important;
                width: 36px !important;
                height: 36px !important;
                border-radius: 10px !important;
                margin: 0 !important;
            }
            .modal-button {
                padding: 12px 0 !important;
                font-size: 15px !important;
                min-width: 42vw !important;
                border-radius: 12px !important;
                margin: 0 2px !important;
            }
            .modal-close-button {
                width: 26px !important;
                height: 26px !important;
                font-size: 14px !important;
                top: 8px !important;
                right: 8px !important;
            }
            /* Mood text trên mobile */
            .mood-circle + div {
                font-size: 16px !important;
                margin-bottom: 0 !important;
                max-width: 85% !important;
                word-break: break-word !important;
                justify-self: center !important;
                text-align: center !important;
            }
        }
        /* Tablet */
        @media (min-width: 601px) and (max-width: 900px) {
            .modal-container { max-width: 90vw !important; padding: 18px !important; border-radius: 22px !important; }
            .modal-title { font-size: 22px !important; margin-bottom: 18px !important; }
            .mood-circle { width: 170px !important; height: 170px !important; margin-bottom: 22px !important; }
            .mood-btn { font-size: 26px !important; width: 48px !important; height: 48px !important; border-radius: 14px !important; }
            .modal-button { padding: 12px 22px !important; font-size: 15px !important; min-width: 90px !important; border-radius: 10px !important; }
            .modal-close-button { width: 28px !important; height: 28px !important; font-size: 16px !important; }
        }
        /* Desktop */
        @media (min-width: 901px) and (max-width: 1200px) {
            .modal-container { max-width: 70vw !important; padding: 28px !important; border-radius: 28px !important; }
            .modal-title { font-size: 26px !important; margin-bottom: 24px !important; }
            .mood-circle { width: 200px !important; height: 200px !important; margin-bottom: 28px !important; }
            .mood-btn { font-size: 30px !important; width: 56px !important; height: 56px !important; border-radius: 16px !important; }
            .modal-button { padding: 14px 28px !important; font-size: 16px !important; min-width: 110px !important; border-radius: 12px !important; }
            .modal-close-button { width: 32px !important; height: 32px !important; font-size: 18px !important; }
        }
        /* Large desktop */
        @media (min-width: 1201px) {
            .modal-container { max-width: 440px !important; padding: 54px 38px !important; border-radius: 38px !important; }
            .modal-title { font-size: 30px !important; margin-bottom: 38px !important; }
            .mood-circle { width: 220px !important; height: 220px !important; margin-bottom: 32px !important; }
            .mood-btn { font-size: 32px !important; width: 64px !important; height: 64px !important; border-radius: 20px !important; }
            .modal-button { padding: 18px 38px !important; font-size: 18px !important; min-width: 140px !important; border-radius: 14px !important; }
            .modal-close-button { width: 36px !important; height: 36px !important; font-size: 22px !important; }
        }
        `}
            </style>
        </>
    );
}

MoodModal.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onMoodSelected: PropTypes.func,
};

