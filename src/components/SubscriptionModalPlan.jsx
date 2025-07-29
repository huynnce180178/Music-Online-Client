import { useContext, useEffect, useState, useRef } from 'react';
import { Modal } from 'react-bootstrap';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AiOutlineClose, AiOutlineLeft, AiOutlineRight } from 'react-icons/ai';
import { PlayerContext } from '../context/PlayerContext';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import BASE_API_URL from "../services/base.api.url";

export default function SubscriptionModalPlan({ show, onClose }) {
    const { t } = useTranslation();
    const [plans, setPlans] = useState([]);
    const [currentPlanIndex, setCurrentPlanIndex] = useState(0);
    const navigate = useNavigate();
    const { stopPlayer } = useContext(PlayerContext);
    const scrollRef = useRef();

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
                    btnBg: '#DCA419',
                };
            case 'ARTIST':
                return {
                    bgColor: 'linear-gradient(135deg, #4B2987, #1A1A12)',
                    btnBg: '#9456FF',
                };
            default:
                return {
                    bgColor: '#23283e',
                    btnBg: '#555',
                };
        }
    };

    // Swipe navigation for mobile
    const touchStartY = useRef(null);
    const handleTouchStart = (e) => {
        touchStartY.current = e.touches[0].clientY;
    };
    const handleTouchEnd = (e) => {
        if (!touchStartY.current) return;
        const touchEndY = e.changedTouches[0].clientY;
        const diff = touchStartY.current - touchEndY;
        if (diff > 50 && currentPlanIndex < plans.length - 1) setCurrentPlanIndex(currentPlanIndex + 1);
        if (diff < -50 && currentPlanIndex > 0) setCurrentPlanIndex(currentPlanIndex - 1);
        touchStartY.current = null;
    };

    // Scroll to current plan on mobile
    useEffect(() => {
        if (window.innerWidth < 900 && scrollRef.current) {
            scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [currentPlanIndex]);

    return (
        <Modal
            show={show}
            onHide={onClose}
            backdrop="static"
            size="xl"
            centered
            dialogClassName="sub-modal-dialog"
            contentClassName="sub-modal-content"
        >
            <style>
                {`
:root {
    --primary: #dca419;
    --secondary: #23283e;
    --radius-lg: 24px;
    --radius-md: 16px;
    --radius-sm: 10px;
    --modal-bg: #0f111d;
    --card-bg: #181c2b;
    --text-light: #fff;
    --text-muted: #bdbdbd;
}
.sub-modal-dialog {
    display: flex !important;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    margin: 0 auto !important;
}
.sub-modal-content {
    background: var(--modal-bg) !important;
    border-radius: var(--radius-lg) !important;
    box-shadow: 0 0 0 2px var(--primary), 0 0 20px 4px #dca41955 !important;
    padding: 0 !important;
    max-width: 98vw;
    min-width: 320px;
}
@media (max-width: 900px) {
    .sub-modal-content {
        border-radius: var(--radius-md) !important;
        max-width: 95vw !important;
        min-width: 95vw !important;
        max-height: 90vh !important;
    }
}
@media (max-width: 600px) {
    .sub-modal-content {
        border-radius: var(--radius-sm) !important;
        max-width: 99vw !important;
        min-width: 99vw !important;
        max-height: 95vh !important;
    }
}
.sub-modal-close-btn {
    position: absolute;
    top: 12px;
    right: 16px;
    z-index: 1050;
    background: transparent;
    border: none;
    font-size: 24px;
    color: var(--text-light);
    cursor: pointer;
}
.sub-modal-scroll {
    padding: 2rem 0;
    background: var(--card-bg);
    border-radius: var(--radius-lg);
    max-height: 80vh;
    overflow-y: auto;
    display: flex;
    flex-direction: row;
    gap: 32px;
    justify-content: center;
}
@media (max-width: 900px) {
    .sub-modal-scroll {
        flex-direction: column;
        gap: 0;
        padding: 1rem 0.5rem;
        max-height: 70vh;
        overflow-y: auto;
        align-items: center;
    }
}
.sub-plan-card-col {
    min-width: 400px;
    max-width: 420px;
    flex: 0 0 400px;
    display: flex;
    justify-content: center;
}
@media (max-width: 900px) {
    .sub-plan-card-col {
        min-width: 100%;
        max-width: 100%;
        flex: none;
        margin: 0 auto;
    }
}
.sub-plan-card {
    background: var(--card-bg);
    border-radius: var(--radius-lg);
    box-shadow: 0 2px 16px #0002;
    color: var(--text-light);
    padding: 2rem 1.5rem;
    width: 100%;
    max-width: 420px;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    transition: box-shadow 0.2s;
}
@media (max-width: 900px) {
    .sub-plan-card {
        border-radius: var(--radius-md);
        padding: 1.2rem 0.7rem;
        max-width: 99vw;
    }
}
@media (max-width: 600px) {
    .sub-plan-card {
        border-radius: var(--radius-sm);
        padding: 0.8rem 0.2rem;
        max-width: 88vw;
    }
}
.sub-plan-title {
    font-size: 1.5rem;
    font-weight: bold;
    margin-bottom: 0.5rem;
    text-align: center;
}
.sub-plan-price {
    font-size: 1.2rem;
    font-weight: bold;
    color: var(--primary);
    margin: 0.5rem 0;
    text-align: center;
}
.sub-plan-desc {
    font-size: 1rem;
    color: var(--text-muted);
    margin-bottom: 0.5rem;
    text-align: center;
}
.sub-plan-btn {
    background: var(--primary);
    color: var(--text-light);
    border: none;
    border-radius: 999px;
    font-weight: bold;
    padding: 0.8rem 0;
    margin: 1rem 0;
    width: 100%;
    font-size: 1rem;
    transition: background 0.2s;
}
.sub-plan-btn:hover {
    background: #b88c1a;
}
.sub-plan-features {
    margin: 0.5rem 0 0 0;
    padding: 0;
    list-style: none;
}
.sub-plan-features li {
    font-size: 0.98rem;
    margin-bottom: 0.3rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}
.sub-plan-features li span {
    color: var(--primary);
    font-size: 1.1rem;
}
.sub-plan-nav {
    display: none;
}
@media (max-width: 900px) {
    .sub-plan-nav {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 16px;
        margin: 1rem 0 0 0;
    }
    .sub-plan-arrow {
        background: var(--secondary);
        border: none;
        color: var(--primary);
        font-size: 1.5rem;
        border-radius: 50%;
        width: 38px;
        height: 38px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: background 0.2s;
    }
    .sub-plan-arrow:disabled {
        opacity: 0.3;
        cursor: not-allowed;
    }
    .sub-plan-indicator {
        display: flex;
        gap: 6px;
    }
    .sub-plan-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #dca41944;
    }
    .sub-plan-dot.active {
        background: var(--primary);
    }
}
.plan-center-content li {
    justify-content: center !important;
}
`}</style>

            <button
                type="button"
                onClick={onClose}
                className="sub-modal-close-btn"
                aria-label="Close"
            >
                <AiOutlineClose />
            </button>

            <div className="container-fluid" style={{ padding: 0 }}>
                <div className="sub-modal-scroll" ref={scrollRef}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                >
                    {/* Desktop: show all, Mobile: show only current */}
                    {plans.length > 0 && (
                        window.innerWidth < 900
                            ? (
                                <div className="sub-plan-card-col">
                                    <div
                                        className="sub-plan-card"
                                        style={{
                                            background: getCardStyle(plans[currentPlanIndex].planType).bgColor,
                                        }}
                                    >
                                        <h4 className="sub-plan-title">{plans[currentPlanIndex].planName}</h4>
                                        <div className="sub-plan-desc">{plans[currentPlanIndex].description.split(',')[0]}</div>
                                        <div className="sub-plan-price">
                                            {t('premium.from_only', { price: Number(plans[currentPlanIndex].price).toLocaleString('vi-VN') })}
                                        </div>
                                        <button
                                            onClick={() => handleSelectPlan(plans[currentPlanIndex].id)}
                                            className="sub-plan-btn"
                                        >
                                            {t('premium.buy_now')}
                                        </button>
                                        <h6 style={{ fontWeight: 'bold', textAlign: 'center', marginBottom: '0.5rem' }}>
                                            {t('premium.special_privileges')}
                                        </h6>
                                        <ul className="sub-plan-features">
                                            {plans[currentPlanIndex].description.split(',').map((item, idx) => (
                                                <li key={idx}><span>✓</span>{item.trim()}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )
                            : (
                                plans.map((plan) => {
                                    const styles = getCardStyle(plan.planType);
                                    return (
                                        <div key={plan.id} className="sub-plan-card-col">
                                            <div
                                                className="sub-plan-card"
                                                style={{ background: styles.bgColor }}
                                            >
                                                <h4 className="sub-plan-title">{plan.planName}</h4>
                                                <div className="sub-plan-desc">{plan.description.split(',')[0]}</div>
                                                <div className="sub-plan-price">
                                                    {t('premium.from_only', { price: Number(plan.price).toLocaleString('vi-VN') })}
                                                </div>
                                                <button
                                                    onClick={() => handleSelectPlan(plan.id)}
                                                    className="sub-plan-btn"
                                                >
                                                    {t('premium.buy_now')}
                                                </button>
                                                <h6 style={{ fontWeight: 'bold', textAlign: 'center', marginBottom: '0.5rem' }}>
                                                    {t('premium.special_privileges')}
                                                </h6>
                                                <ul className="sub-plan-features">
                                                    {plan.description.split(',').map((item, idx) => (
                                                        <li key={idx}><span>✓</span>{item.trim()}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    );
                                })
                            )
                    )}
                </div>
                {/* Mobile navigation */}
                {plans.length > 1 && window.innerWidth < 900 && (
                    <div className="sub-plan-nav">
                        <button
                            className="sub-plan-arrow"
                            onClick={() => setCurrentPlanIndex(currentPlanIndex - 1)}
                            disabled={currentPlanIndex === 0}
                            aria-label="Previous"
                        >
                            <AiOutlineLeft />
                        </button>
                        <div className="sub-plan-indicator">
                            {plans.map((_, idx) => (
                                <div
                                    key={idx}
                                    className={`sub-plan-dot${idx === currentPlanIndex ? ' active' : ''}`}
                                    onClick={() => setCurrentPlanIndex(idx)}
                                />
                            ))}
                        </div>
                        <button
                            className="sub-plan-arrow"
                            onClick={() => setCurrentPlanIndex(currentPlanIndex + 1)}
                            disabled={currentPlanIndex === plans.length - 1}
                            aria-label="Next"
                        >
                            <AiOutlineRight />
                        </button>
                    </div>
                )}
            </div>
        </Modal>
    );
}

SubscriptionModalPlan.propTypes = {
    show: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
};
