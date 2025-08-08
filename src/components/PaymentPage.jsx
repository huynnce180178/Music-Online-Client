import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import BASE_API_URL from "../services/base.api.url";

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
            setError("You need to login to pay.");
            setLoading(false);
            return;
        }

        const fetchPlan = async () => {
            try {
                const res = await axios.get(`${BASE_API_URL}/api/v1/subscriptionPlan/${planId}`, {
                    headers: { Authorization: `Bearer ${accessToken}` }
                });
                setPlan(res.data.data);
            } catch (err) {
                console.error("Error downloading upgrade package:", err);
                setError("Unable to download upgrade package information.");
            } finally {
                setLoading(false);
            }
        };

        fetchPlan();
    }, [planId, accessToken, userId]);

    const handlePayment = async () => {
        if (!plan || !paymentMethod) return;
        setSubmitting(true);

        try {
            const transitionId = `${paymentMethod}-${Date.now()}`;
            let approvalUrl = '';

            console.log('Payment method selected:', paymentMethod);
            console.log('Plan:', plan);
            console.log('Base API URL:', BASE_API_URL);

            if (paymentMethod === 'ZALO_PAY') {
                const res = await axios.post(`${BASE_API_URL}/api/v1/user/payment/zalopay`, null, {
                    params: { amount: plan.price },
                    headers: { Authorization: `Bearer ${accessToken}` }
                });

                if (res.data?.return_code === 1 && res.data?.order_url) {
                    approvalUrl = res.data.order_url;
                } else {
                    throw new Error(res.data?.return_message || "ZaloPay error");
                }
            } else if (paymentMethod === 'PAYPAL' || paymentMethod === 'VNPAY') {
                console.log('Making request to:', `${BASE_API_URL}/api/v1/user/payment`);
                console.log('Request body:', {
                    planId: plan.id,
                    transitionId,
                    paymentMethod
                });
                
                const res = await axios.post(`${BASE_API_URL}/api/v1/user/payment`, {
                    planId: plan.id,
                    transitionId,
                    paymentMethod
                }, {
                    headers: { Authorization: `Bearer ${accessToken}` }
                });

                console.log('Response from payment API:', res.data);

                if (res.data?.data) {
                    approvalUrl = res.data.data;
                } else {
                    throw new Error("Not receiving URL from payment gateway.");
                }
            } else {
                throw new Error("Invalid payment method selected.");
            }

            // 👉 Redirect trực tiếp, KHÔNG gắn thêm param FE
            window.location.href = approvalUrl;

        } catch (err) {
            console.error("Error while processing payment:", err);
            setError(
                typeof err.response?.data === 'string'
                    ? err.response.data
                    : err.response?.data?.message || err.message || "Unable to process payment."
            );
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
        return <div style={{ textAlign: 'center', color: '#fff', marginTop: 80 }}>{t('loading')}</div>;
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
                    <h4 className="my-2 fw-bold">From only {Number(plan.price).toLocaleString()} USD / Month</h4>

                    <h6 className="fw-bold mt-3">Special privileges:</h6>
                    <ul className="list-unstyled">
                        {plan.description.split(',').map((item, index) => (
                            <li key={index} className="d-flex align-items-start mb-1">
                                <span>✓ {item.trim()}</span>
                            </li>
                        ))}
                    </ul>

                    <div className="mt-4">
                        <label htmlFor="method"><strong>Payment method:</strong></label>
                        <select
                            id="method"
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="form-select mt-2"
                        >
                            <option value="PAYPAL">Paypal</option>
                            <option value="VNPAY">VNPay</option>
                            <option value="ZALO_PAY">ZaloPay</option>
                        </select>
                    </div>

                    <button
                        onClick={handlePayment}
                        disabled={submitting}
                        className="mt-4 py-2 rounded-pill border-0 fw-bold"
                        style={{ backgroundColor: styles.btnBg, color: styles.btnColor, width: "100%" }}
                    >
                        {submitting ? t('processing') : "BUY NOW"}
                    </button>
                </div>
            </div>
        </div>
    );
}
