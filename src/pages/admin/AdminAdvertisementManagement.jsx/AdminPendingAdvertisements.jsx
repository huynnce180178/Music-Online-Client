import { useEffect, useState } from "react";
import { Table, Button, message, Tag, Space, Grid, Image, Modal, Input, Tabs } from "antd";
import { CheckOutlined, DeleteOutlined } from "@ant-design/icons";
import axios from "axios";
import { useTranslation } from 'react-i18next';
import BASE_API_URL from "../../../services/base.api.url";

const statusColors = {
    PENDING: "#FAAD14",
    APPROVED: "#52C41A",
    REJECTED: "#FF4D4F",
};

export default function AdminPendingAdvertisements() {
    const { t } = useTranslation();
    const [pendingAds, setPendingAds] = useState([]);
    const [loading, setLoading] = useState(false);
    const [rejectId, setRejectId] = useState(null);
    const [rejectReason, setRejectReason] = useState("");
    const [rejectLoading, setRejectLoading] = useState(false);

    const { useBreakpoint } = Grid;
    const screens = useBreakpoint();
    const isTablet = !screens.lg;

    useEffect(() => {
        fetchPendingAds();
        const style = document.createElement("style");
        style.innerHTML = `
      /* DARK MODE TABLE (giữ nguyên) */
      .ant-table { background-color: #101426 !important; color: #fff !important; }
      .ant-table-thead > tr > th { background-color: #181C2B !important; color: #fff !important; border-bottom: 2px solid #3ed8ff !important; }
      .ant-table-tbody > tr > td { background-color: #101426 !important; color: #fff !important; }
      .ant-table-tbody > tr:hover > td { background-color: #1f2233 !important; }
      .ant-pagination-item, .ant-pagination-prev, .ant-pagination-next { background-color: #101426 !important; border: 1px solid #434760 !important; color: #fff !important; }
      .ant-tabs-tab .ant-tabs-tab-btn { color: #fff !important; }
      .ant-tabs-tab.ant-tabs-tab-active .ant-tabs-tab-btn { color: #3ed8ff !important; }
      .ant-tabs-nav::before { border-bottom: none !important; }
      .ant-input, .ant-input-affix-wrapper, .ant-input-textarea { background-color: #101426 !important; color: #fff !important; border: 1px solid #434760 !important; }
      .ant-input::placeholder, .ant-input-textarea::placeholder { color: #888 !important; }

      /* LIGHT MODE FOR MODAL */
      .modal-light .ant-modal-content { background: #fff !important; color: #000 !important; }
      .modal-light .ant-modal-header { background: #fff !important; border-bottom: 1px solid #d9d9d9 !important; }
      .modal-light .ant-modal-title { color: #000 !important; }
      .modal-light .ant-btn { border-radius: 6px; }
      .modal-light .ant-input,
      .modal-light .ant-input-affix-wrapper,
      .modal-light .ant-input-textarea {
          background-color: #fff !important;
          color: #000 !important;
          border: 1px solid #d9d9d9 !important;
      }
      .modal-light .ant-input::placeholder,
      .modal-light .ant-input-textarea::placeholder {
          color: #888 !important;
      }
    `;
        document.head.appendChild(style);
        return () => document.head.removeChild(style);
    }, []);

    const fetchPendingAds = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("accessToken");
            const res = await axios.get(`${BASE_API_URL}/api/v1/admin/advertisements/pending`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const list = Array.isArray(res.data) ? res.data : res.data.data || [];
            setPendingAds(list);
        } catch {
            message.error("Unable to load the pending advertisement list!");
        }
        setLoading(false);
    };

    const handleApprove = async (id) => {
        try {
            const token = localStorage.getItem("accessToken");
            await axios.post(`${BASE_API_URL}/admin/advertisements/approve/${id}`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });
            message.success("Advertisement approved!");
            fetchPendingAds();
        } catch {
            message.error("Advertisement approval failed!");
        }
    };

    const handleReject = async () => {
        if (!rejectReason.trim()) {
            message.warning("Please enter reason for rejection!");
            return;
        }
        setRejectLoading(true);
        try {
            const token = localStorage.getItem("accessToken");
            await axios.post(
                `${BASE_API_URL}/admin/advertisements/reject/${rejectId}`,
                {},
                {
                    headers: { Authorization: `Bearer ${token}` },
                    params: { reason: rejectReason },
                }
            );
            message.success("The advertisement was rejected!");
            setRejectId(null);
            setRejectReason("");
            fetchPendingAds();
        } catch {
            message.error("Reject failed!");
        }
        setRejectLoading(false);
    };

    const getColumns = (type) => [
        {
            title: "#",
            key: "index",
            align: "center",
            render: (text, record, index) => index + 1,
        },
        {
            title: type === "AUDIO" ? t('admin_ads.preview') : t('admin_ads.banner'),
            key: "media",
            align: "center",
            render: (_, ad) =>
                type === "AUDIO" ? (
                    <audio controls src={ad.mediaUrl} style={{ width: isTablet ? 120 : 220, borderRadius: 8 }} />
                ) : (
                    <Image
                        src={ad.mediaUrl}
                        width={isTablet ? 60 : 100}
                        height={isTablet ? 60 : 100}
                        style={{ objectFit: "cover", borderRadius: 12, boxShadow: "0 0 8px rgba(0,0,0,0.5)" }}
                        preview={false}
                        alt={t('admin_ads.banner')}
                    />
                ),
        },
        {
            title: t('admin_ads.creator'),
            dataIndex: "createdByName",
            key: "createdByName",
            ellipsis: isTablet,
            align: "center",
        },
        {
            title: t('admin_ads.status'),
            key: "status",
            align: "center",
            render: () => (
                <Tag style={{ backgroundColor: statusColors.PENDING, color: "#181d36" }}>
                    {t('admin_ads.pending_approval')}
                </Tag>
            ),
        },
        {
            title: t('admin_ads.actions'),
            key: "actions",
            align: "center",
            render: (_, record) => (
                <Space>
                    <Button
                        type="primary"
                        icon={<CheckOutlined />}
                        size={isTablet ? "small" : "middle"}
                        onClick={() => handleApprove(record.id)}
                        aria-label={t('admin_ads.approve')}
                    />
                    <Button
                        danger
                        icon={<DeleteOutlined />}
                        size={isTablet ? "small" : "middle"}
                        onClick={() => setRejectId(record.id)}
                        aria-label={t('admin_ads.reject')}
                    />
                </Space>
            ),
        },
    ];

    const renderTable = (data, type) => (
        <Table
            columns={getColumns(type)}
            dataSource={data}
            loading={loading}
            rowKey="id"
            pagination={false}
            size={isTablet ? "small" : "middle"}
            scroll={isTablet ? { x: 600 } : undefined}
            style={{ borderRadius: 12 }}
        />
    );

    return (
        <div style={{ padding: isTablet ? 8 : 16 }}>
            <Tabs
                defaultActiveKey="AUDIO"
                items={[
                    {
                        key: "AUDIO",
                        label: t('admin_ads.audio_ads'),
                        children: renderTable(pendingAds.filter((ad) => ad.adType === "AUDIO"), "AUDIO"),
                    },
                    {
                        key: "BANNER",
                        label: t('admin_ads.banner_ads'),
                        children: renderTable(pendingAds.filter((ad) => ad.adType === "BANNER"), "BANNER"),
                    },
                ]}
            />
            <Modal
                className="modal-light"
                title={t('admin_ads.reject_reason_title')}
                open={!!rejectId}
                onCancel={() => setRejectId(null)}
                footer={[
                    <Button key="cancel" onClick={() => setRejectId(null)}>
                        {t('admin_ads.cancel')}
                    </Button>,
                    <Button
                        key="submit"
                        type="primary"
                        danger
                        loading={rejectLoading}
                        onClick={handleReject}
                    >
                        {t('admin_ads.confirm_reject')}
                    </Button>,
                ]}
            >
                <p>{t('admin_ads.reject_reason_prompt')}</p>
                <Input.TextArea
                    rows={4}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder={t('admin_ads.reject_reason_placeholder')}
                />
            </Modal>
        </div>
    );
}
