import { useState, useEffect, useRef } from "react";
import { Modal, Button, message } from "antd";
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
        <Modal
            open={open}
            onCancel={onClose}
            footer={null}
            centered
            closable={false}
            maskClosable={false}
            title={t('mood_modal.title')}
            bodyStyle={{ padding: 0 }}
            style={{ maxWidth: 420, width: "95vw" }}
        >
            <div
                style={{
                    margin: 25,
                    display: "flex",
                    flexDirection: "column",
                    gap: 16,
                    alignItems: "center",
                    padding: 0,
                }}
            >
                {[0, 1].map(row => (
                    <div
                        key={row}
                        style={{
                            display: "flex",
                            gap: 16,
                            justifyContent: "center",
                            width: "100%",
                            flexWrap: "wrap"
                        }}
                    >
                        {moodOptions.slice(row * 4, row * 4 + 4).map(opt => (
                            <Button
                                key={opt.emoji}
                                type={selectedMood?.emoji === opt.emoji ? "primary" : "default"}
                                style={{
                                    fontSize: 32,
                                    borderRadius: 16,
                                    width: 56,
                                    height: 56,
                                    minWidth: 48,
                                    minHeight: 48,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    boxShadow: selectedMood?.emoji === opt.emoji ? "0 0 8px #3ed8ff55" : undefined,
                                    transform: selectedMood?.emoji === opt.emoji ? "scale(1.15)" : "scale(1)",
                                    transition: "transform 0.2s",
                                    animation: submitting && selectedMood?.emoji === opt.emoji
                                        ? "bounce 0.7s infinite"
                                        : undefined,
                                }}
                                onClick={() => setSelectedMood(opt)}
                                disabled={hasTodayMood || submitting}
                            >
                                {opt.emoji}
                            </Button>
                        ))}
                    </div>
                ))}
            </div>
            <div style={{ textAlign: "center", minHeight: 28, color: "#21A8C5", fontWeight: 600, fontSize: 16 }}>
                {selectedMood ? t(`mood_modal.${toSnakeCase(selectedMood.text)}`) : ''}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 24, flexWrap: "wrap" }}>
                <Button
                    block
                    size="large"
                    onClick={onClose}
                    style={{ borderRadius: 24, fontWeight: 700, flex: 1, minWidth: 120 }}
                    disabled={submitting}
                >
                    {t('mood_modal.skip')}
                </Button>
                <Button
                    type="primary"
                    block
                    size="large"
                    loading={submitting}
                    onClick={handleSubmit}
                    style={{ borderRadius: 24, fontWeight: 700, flex: 1, minWidth: 120 }}
                    disabled={hasTodayMood}
                >
                    {t('mood_modal.submit')}
                </Button>
            </div>
            {submitting && (
                <div style={{
                    marginTop: 32,
                    textAlign: "center",
                    minHeight: 40,
                    fontSize: 20,
                    color: "#21A8C5",
                    fontWeight: 700,
                    letterSpacing: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 8,
                }}>
                    <span style={{
                        fontSize: 32,
                        animation: "bounce 0.7s infinite",
                        display: "inline-block"
                    }}>
                        {selectedMood?.emoji || "🎶"}
                    </span>
                    <span>{typedMsg}</span>
                </div>
            )}
            <style>
                {`
                @keyframes bounce {
                    0%, 100% { transform: translateY(0);}
                    50% { transform: translateY(-12px);}
                }
                @media (max-width: 600px) {
                    .ant-modal {
                        width: 98vw !important;
                        max-width: 98vw !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    .ant-modal-content {
                        padding: 10px 4vw 18px 4vw !important;
                        border-radius: 16px !important;
                    }
                    .ant-modal-title {
                        font-size: 18px !important;
                        padding: 8px 0 !important;
                    }
                    .ant-modal-body {
                        padding: 0 !important;
                    }
                }
                @media (max-width: 400px) {
                    .ant-modal {
                        width: 100vw !important;
                        max-width: 100vw !important;
                        min-width: 0 !important;
                    }
                    .ant-modal-content {
                        padding: 6px 2vw 12px 2vw !important;
                        border-radius: 10px !important;
                    }
                    .ant-modal-title {
                        font-size: 15px !important;
                        padding: 6px 0 !important;
                    }
                }
                `}
            </style>
        </Modal>
    );
}

MoodModal.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onMoodSelected: PropTypes.func,
};