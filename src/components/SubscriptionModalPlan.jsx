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
            <style>{`
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
    max-width: 410px !important;
    width: auto !important;
    min-width: unset !important;
}
@media (max-width: 900px) {
    .custom-content {
        max-width: 96vw !important;
        margin: 0 2vw !important;
        border-radius: 16px !important;
    }
}
@media (max-width: 600px) {
    .custom-content {
        max-width: 94vw !important;
        margin: 0 3vw !important;
        border-radius: 13px !important;
        padding: 0 !important;
    }
    .plan-row-scroll {
        gap: 6px;
        max-width: 98vw;
    }
    .plan-card-col {
        min-width: 91vw !important;
        max-width: 92vw !important;
        flex: 0 0 91vw !important;
        padding: 0 !important;
    }
    .card {
        font-size: 0.95rem !important;
        border-radius: 13px !important;
        padding: 0.7rem 0.6rem 0.7rem 0.6rem !important;
    }
}
.modal-body {
    padding: 0 !important;
    border-radius: 20px !important;
}
.plan-row-scroll {
    display: flex;
    flex-direction: row;
    gap: 28px;
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
    min-width: 350px;
    max-width: 370px;
    flex: 0 0 350px;
}
.plan-center-content {
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    justify-content: center !important;
    text-align: center !important;
    width: 100%;
}
.plan-center-content h4,
.plan-center-content h5,
.plan-center-content h6,
.plan-center-content p,
.plan-center-content ul,
.plan-center-content li {
    text-align: center !important;
    width: 100%;
}
.plan-center-content ul {
    padding-left: 0 !important;
}
.plan-center-content li {
    justify-content: center !important;
}
`}</style>

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
                    cursor: 'pointer'
                }}
                aria-label="Close"
            >
                <AiOutlineClose />
            </button>

            <div className="container-fluid py-2" style={{ backgroundColor: '#181c2b', borderRadius: '20px', textAlign: 'center' }}>
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
                                        minWidth: '350px',
                                        maxWidth: '370px',
                                        flex: '0 0 350px',
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
                                        <div className="card-body plan-center-content">
                                            <h4 className="card-title fw-bold">{plan.planName}</h4>
                                            <p>{plan.description.split(',')[0]}</p>
                                            <h5 className="mt-2 mb-2 fw-bold">
                                                {t('premium.from_only', { price: Number(plan.price).toLocaleString('vi-VN') })}
                                            </h5>

                                            <button
                                                onClick={() => handleSelectPlan(plan.id)}
                                                className="w-50 py-2 rounded-pill mb-3 border-0 fw-bold"
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
