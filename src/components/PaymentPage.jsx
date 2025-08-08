import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

axios.defaults.baseURL = 'http://localhost:8080';

export default function PaymentPage() {
    const { t } = useTranslation();
    const { planId } = useParams();

    const [plan, setPlan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('PAYPAL');
    const [submitting, setSubmitting] = useState(false);

    const userId = localStorage.getItem("userId");
    const accessToken = localStorage.getItem("accessToken");

    useEffect(() => {
        if (!userId || !accessToken) {
            setError(t('payment.need_login'));
            setLoading(false);
            return;
        }

        const fetchPlan = async () => {
            try {
                const res = await axios.get(`/api/v1/subscriptionPlan/${planId}`, {
                    headers: { Authorization: `Bearer ${accessToken}` }
                });
                setPlan(res.data.data);
            } catch (err) {
                setError(t('payment.cannot_load_package'));
            } finally {
                setLoading(false);
            }
        };

        fetchPlan();
    }, [planId, accessToken, userId, t]);

    const handlePayment = async () => {
        if (!plan || !paymentMethod) return;
        setSubmitting(true);

        try {
            const transitionId = `${paymentMethod}-${Date.now()}`;
            let approvalUrl = '';

            if (paymentMethod === 'ZALO_PAY') {
                const res = await axios.post(`/api/v1/user/payment/zalopay`, null, {
                    params: { amount: plan.price },
                    headers: { Authorization: `Bearer ${accessToken}` }
                });

                if (res.data?.return_code === 1 && res.data?.order_url) {
                    approvalUrl = res.data.order_url;
                    window.open(approvalUrl, '_blank');
                    return;
                } else {
                    setError(t('payment.zalopay_error'));
                }
            } else if (paymentMethod === 'VNPAY') {
                const res = await axios.post(`/api/v1/user/payment/vnpay`, null, {
                    params: { amount: plan.price },
                    headers: { Authorization: `Bearer ${accessToken}` }
                });
                if (res.data?.code === '00' && res.data?.data) {
                    approvalUrl = res.data.data;
                    window.open(approvalUrl, '_blank');
                    return;
                } else {
                    setError(t('payment.vnpay_error'));
                }
            } else if (paymentMethod === 'PAYPAL') {
                const res = await axios.post(`/api/v1/user/payment/paypal`, null, {
                    params: { amount: plan.price },
                    headers: { Authorization: `Bearer ${accessToken}` }
                });
                if (res.data?.approvalUrl) {
                    approvalUrl = res.data.approvalUrl;
                    window.open(approvalUrl, '_blank');
                    return;
                } else {
                    setError(t('payment.paypal_error'));
                }
            }
        } catch (err) {
            setError(t('payment.payment_error'));
        } finally {
            setSubmitting(false);
        }
    };

    const getCardStyle = (planType) => {
        switch (planType) {
            case 'PREMIUM':
                return { bgColor: 'linear-gradient(135deg, #CD9B1D, #1A1A12)', textColor: '#fff', btnBg: '#DCA419', btnColor: '#fff' };
            case 'ARTIST':
                return { bgColor: 'linear-gradient(135deg, #4B2987, #1A1A12)', textColor: '#fff', btnBg: '#9456FF', btnColor: '#fff' };
            default:
                return { bgColor: '#333', textColor: '#fff', btnBg: '#555', btnColor: '#fff' };
        }
    };

    if (loading) {
        return <div style={{ textAlign: 'center', color: '#fff', marginTop: 80 }}>{t('payment.loading')}</div>;
    }

    if (error) {
        return <div style={{ textAlign: 'center', color: 'red', marginTop: 80 }}>{error}</div>;
    }

    const styles = getCardStyle(plan?.planType);

    return (
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
            <div className="card shadow rounded-4 p-4" style={{ background: styles.bgColor, color: styles.textColor, borderRadius: 20 }}>
                <div className="card-body d-flex flex-column">
                    <h3 className="card-title fw-bold">{plan.planName}</h3>
                    <p>{plan.description.split(',')[0]}</p>
                    <h4 className="my-2 fw-bold">{t('payment.from_only', { price: Number(plan.price).toLocaleString() })}</h4>

                    <h6 className="fw-bold mt-3">{t('payment.special_privileges')}</h6>
                    <ul className="list-unstyled">
                        {plan.description.split(',').map((item, index) => (
                            <li key={index} className="d-flex align-items-start mb-1">
                                <span>✓ {item.trim()}</span>
                            </li>
                        ))}
                    </ul>

                    <div className="mt-4">
                        <label htmlFor="method"><strong>{t('payment.payment_method')}</strong></label>
                        <select
                            id="method"
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="form-select mt-2"
                        >
                            <option value="PAYPAL">{t('payment.paypal')}</option>
                            <option value="VNPAY">{t('payment.vnpay')}</option>
                            <option value="ZALO_PAY">{t('payment.zalopay')}</option>
                        </select>
                    </div>

                    <button
                        onClick={handlePayment}
                        disabled={submitting}
                        className="mt-4 py-2 rounded-pill border-0 fw-bold"
                        style={{ backgroundColor: styles.btnBg, color: styles.btnColor, width: "100%" }}
                    >
                        {submitting ? t('payment.processing') : t('payment.buy_now')}
                    </button>
                </div>
            </div>
        </div>
    );
}
