import { useContext, useEffect, useState } from 'react';
import { Modal } from 'react-bootstrap';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AiOutlineClose } from 'react-icons/ai';
import { PlayerContext } from '../context/PlayerContext';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import BASE_API_URL from "../services/base.api.url";

export default function SubscriptionModalPlan({ show, onClose }) {
    const { t } = useTranslation();
    const [plans, setPlans] = useState([]);
    const navigate = useNavigate();
    const { stopPlayer } = useContext(PlayerContext);

    useEffect(() => {
        axios.get(`${BASE_API_URL}/api/v1/subscriptionPlan`)
            .then(res => setPlans(res.data.data))
            .catch(err => console.error('Lỗi tải gói nâng cấp:', err));
    }, []);

    const handleSelectPlan = (id) => {
        if (onClose) onClose();
        stopPlayer?.();
        navigate(`/payment/${id}`);
    };

    const getCardStyle = (planType) => {
        switch (planType) {
            case 'PREMIUM':
                return {
                    bgColor: 'linear-gradient(135deg, #CD9B1D, #1A1A12)',
                    textColor: '#fff',
                    btnBg: '#DCA419',
                    btnColor: '#fff',
                };
            case 'ARTIST':
                return {
                    bgColor: 'linear-gradient(135deg, #4B2987, #1A1A12)',
                    textColor: '#fff',
                    btnBg: '#9456FF',
                    btnColor: '#fff',
                };
            default:
                return {
                    bgColor: '#333',
                    textColor: '#fff',
                    btnBg: '#555',
                    btnColor: '#fff',
                };
        }
    };

    return (
        <Modal
            show={show}
            onHide={onClose}
            backdrop="static"
            size="xl"
            centered
            dialogClassName="custom-dialog"
            contentClassName="custom-content"
        >
            <style>
                {`
.custom-dialog {
    display: flex !important;
    align-items: center;
    justify-content: center;
    height: 100vh;
    margin: 0 auto !important;
}

.custom-content {
    position: relative;
    background-color: #0f111d !important;
    border-radius: 20px !important;
    padding: 0 !important;
    box-shadow: 0 0 0 2px #dca419aa, 0 0 20px 4px #dca41955 !important;
    margin: 0 auto !important;
}

.modal-body {
    padding: 0 !important;
    border-radius: 20px !important;
}
.plan-row-scroll {
    display: flex;
    flex-direction: row;
    gap: 40px;
    overflow-x: auto;
    overflow-y: visible;
    padding: 8px 0;
    justify-content: center;
    max-width: 100%;
    scrollbar-width: thin;
    scrollbar-color: #dca419 #181c2b;
}
.plan-row-scroll::-webkit-scrollbar {
    height: 8px;
    background: #23283e;
}
.plan-row-scroll::-webkit-scrollbar-thumb {
    background: #dca41977;
    border-radius: 8px;
}
.plan-card-col {
    min-width: 440px;
    max-width: 460px;
    flex: 0 0 440px;
}

@media (max-width: 1199px) {
    .plan-row-scroll {
        gap: 28px;
        max-width: 98vw;
    }
    .plan-card-col {
        min-width: 370px;
        max-width: 390px;
        flex: 0 0 370px;
    }
}

@media (max-width: 900px) {
    .plan-row-scroll {
        gap: 18px;
        max-width: 96vw;
    }
    .plan-card-col {
        min-width: 320px;
        max-width: 340px;
        flex: 0 0 320px;
    }
}

@media (max-width: 600px) {
    .plan-row-scroll {
        gap: 14px;
        max-width: 94vw;
    }
    .plan-card-col {
        min-width: 93vw;
        max-width: 95vw;
        flex: 0 0 93vw;
    }
    .card {
        font-size: 0.95rem;
    }
    .card-title {
        font-size: 1.2rem;
    }
}
`}
            </style>

            <button
                type="button"
                onClick={onClose}
                style={{
                    position: 'absolute',
                    top: 12,
                    right: 16,
                    zIndex: 1050,
                    background: 'transparent',
                    border: 'none',
                    fontSize: 24,
                    color: '#fff',
                    cursor: 'pointer',
                    width: 48,
                    height: 48,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "50%",
                    transition: "background 0.2s"
                }}
                aria-label="Close"
                onMouseOver={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
                onMouseOut={e => e.currentTarget.style.background = "transparent"}
            >
                <AiOutlineClose />
            </button>

            <div className="container-fluid py-5" style={{ backgroundColor: '#181c2b', borderRadius: '20px' }}>
                <div className="mx-auto" style={{ maxWidth: '1000px' }}>
                    <div
                        className="plan-row-scroll"
                        style={{
                            // Nếu có 2 hoặc ít hơn, căn giữa, còn lại thì scroll ngang
                            justifyContent: plans.length <= 2 ? "center" : "flex-start"
                        }}
                    >
                        {plans.map(plan => {
                            const styles = getCardStyle(plan.planType);
                            return (
                                <div
                                    key={plan.id}
                                    className="plan-card-col"
                                    style={{
                                        minWidth: '480px',
                                        maxWidth: '440px',
                                        flex: '0 0 440px',
                                    }}
                                >
                                    <div
                                        className="card shadow p-3 h-100"
                                        style={{
                                            background: styles.bgColor,
                                            color: styles.textColor,
                                            borderRadius: 24,
                                        }}
                                    >
                                        <div className="card-body d-flex flex-column">
                                            <h4 className="card-title fw-bold">{plan.planName}</h4>
                                            <p>{plan.description.split(',')[0]}</p>
                                            <h5 className="mt-2 mb-2 fw-bold">
                                                {t('premium.from_only', { price: Number(plan.price).toLocaleString('vi-VN') })}
                                            </h5>

                                            <button
                                                onClick={() => handleSelectPlan(plan.id)}
                                                className="w-100 py-2 rounded-pill mb-3 border-0 fw-bold"
                                                style={{
                                                    backgroundColor: styles.btnBg,
                                                    color: styles.btnColor,
                                                }}
                                            >
                                                {t('premium.buy_now')}
                                            </button>

                                            <h6 className="fw-bold">{t('premium.special_privileges')}</h6>
                                            <ul className="list-unstyled">
                                                {plan.description.split(',').map((item, index) => (
                                                    <li key={index} className="d-flex align-items-start mb-1">
                                                        <span>✓ {item.trim()}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </Modal>
    );
}

SubscriptionModalPlan.propTypes = {
    show: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
};
