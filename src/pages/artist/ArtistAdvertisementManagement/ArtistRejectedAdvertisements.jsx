import { useEffect, useState } from "react";
import {
    Table, Button, Image, message, Modal, Form,
    Grid, Tabs, DatePicker,
    Tag
} from "antd";
import axios from "axios";
import { useTranslation } from 'react-i18next';
import BASE_API_URL from "../../../services/base.api.url";

const { useBreakpoint } = Grid;

export default function ArtistRejectedAdvertisements() {
    const [ads, setAds] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [renewModal, setRenewModal] = useState({ open: false, record: null });


    const [renewForm] = Form.useForm();
    const screens = useBreakpoint();
    const isTablet = !screens.lg;
    const isMobile = !screens.md;
    const { t } = useTranslation();

    const token = localStorage.getItem("accessToken");
    const config = { headers: { Authorization: `Bearer ${token}` } };



    useEffect(() => {
        fetchRejectedAds();
        // --- DARK THEME cho toàn bộ ---
        const style = document.createElement("style");
        style.innerHTML = `
        .ant-table { background-color: #101426 !important; color: #fff !important; }
        .ant-table-thead > tr > th { background-color: #181C2B !important; color: #fff !important; border-bottom: 2px solid #3ed8ff !important; }
        .ant-table-tbody > tr > td { background-color: #101426 !important; color: #fff !important; }
        .ant-table-tbody > tr:hover > td { background-color: #1f2233 !important; }
        .ant-pagination-item { background-color: #101426 !important; border: 1px solid #434760 !important; }
        .ant-pagination-item a { color: #fff !important; }
        .ant-pagination-item-active { background-color: #434760 !important; border-color: #434760 !important; }
        .ant-pagination-item-active a { color: #fff !important; }
        .ant-pagination-prev, .ant-pagination-next, .ant-pagination-jump-prev, .ant-pagination-jump-next { color: #fff !important; }
        .ant-tabs-tab .ant-tabs-tab-btn { color: #fff !important; }
        .ant-tabs-tab.ant-tabs-tab-active .ant-tabs-tab-btn { color: #3ed8ff !important; }
        .ant-tabs-ink-bar { display: none !important; }
        .ant-tabs-nav::before { border-bottom: none !important; }
        /* Full width black background for submenu in Artist Panel */
        .ant-menu-dark .ant-menu-submenu .ant-menu {
            background: #101426 !important;      /* Nền đen full width */
            border-radius: 0 !important;         /* Không bo góc */
            margin-left: 0 !important;           /* Sát lề trái */
            padding-left: 0 !important;          /* Không padding trái */
            width: 100% !important;              /* Đảm bảo 100% width */
            min-width: 0 !important;
            box-shadow: none !important;
            }
        .ant-menu-dark .ant-menu-submenu .ant-menu-item {
            padding-left: 30px !important;       /* Tùy chỉnh lại indent nếu cần */
        }
        `;
        document.head.appendChild(style);
        return () => document.head.removeChild(style);
    }, []);

    const fetchRejectedAds = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${BASE_API_URL}/api/v1/artist/advertisements/rejected`, config);
            setAds(res.data || []);
        } catch {
            message.error(t('artist_ad.unable_to_load_approved_advertisements'));
        }
        setLoading(false);
    };

    const handleRenew = async (values) => {
        try {
            await axios.post(
                `${BASE_API_URL}/api/v1/artist/advertisements/renew/${renewModal.record.id}`,
                {},
                {
                    headers: config.headers,
                    params: {
                        startDate: values.startDate.format("YYYY-MM-DD"),
                        endDate: values.endDate.format("YYYY-MM-DD"),
                    },
                }
            );
            message.success(t('artist_ad.advertisement_renewed_successfully'));
            setRenewModal({ open: false, record: null });
            renewForm.resetFields();
            fetchRejectedAds();
        } catch {
            message.error(t('artist_ad.failed_to_renew_advertisement'));
        }
    };

    const columns = [
        {
            title: t('index'),
            align: "center",
            width: isMobile ? 36 : isTablet ? 50 : 50,
            render: (_, __, idx) => idx + 1,
        },
        {
            title: t('artist_ad.creator'),
            dataIndex: "createdByName",
            align: "center",
            width: isMobile ? 60 : 120,
        },
        {
            title: t('artist_ad.media'),
            dataIndex: "mediaUrl",
            align: "center",
            width: isMobile ? 80 : 150,
            render: (url, record) =>
                record.adType === "AUDIO" && url ? (
                    <audio controls src={url} style={{ width: isMobile ? 80 : "100%" }} />
                ) : url ? (
                    <Image src={url} width={isMobile ? 36 : 60} height={isMobile ? 36 : 60} style={{ objectFit: "cover" }} />
                ) : "-",
        },
        {
            title: t('artist_ad.start_date'),
            dataIndex: "startDateStr",
            align: "center",
            width: 160,
        },
        {
            title: t('artist_ad.end_date'),
            dataIndex: "endDateStr",
            align: "center",
            width: 160,
        },
        {
            title: t('artist_ad.reason'),
            dataIndex: "rejectReason",
            align: "center",
            width: 300,
            render: text => (
                <div style={{ textAlign: "left", whiteSpace: "normal", wordBreak: "break-word" }}>
                    {text}
                </div>
            ),
        },
        {
            title: t('artist_ad.status'),
            align: "center",
            dataIndex: "status",
            key: "status",
            width: 100,
            render: (status) => (
                <Tag style={{ backgroundColor: '#FF4D4F', color: '#181d36', borderRadius: 8 }}>
                    {t(status?.toLowerCase())}
                </Tag>
            ),
        },
    ];

    const renderTable = (filteredAds) => (
        <Table
            columns={columns}
            dataSource={filteredAds}
            rowKey="id"
            loading={loading}
            pagination={false}
            size={isMobile ? "small" : isTablet ? "small" : "middle"}
            scroll={isMobile ? { x: 480 } : isTablet ? { x: 800 } : undefined}
            style={{ background: "#181d36", minWidth: isMobile ? 480 : isTablet ? 800 : undefined }}
            locale={{ emptyText: t('artist_ad.no_data') }}
        />
    );

    return (
        <div style={{ padding: isMobile ? 4 : isTablet ? 8 : 16 }}>
            <Tabs
                defaultActiveKey="AUDIO"
                items={[
                    {
                        key: "AUDIO",
                        label: t('artist_ad.audio_advertisements'),
                        children: renderTable(ads.filter((ad) => ad.adType === "AUDIO")),
                    },
                    {
                        key: "BANNER",
                        label: t('artist_ad.banner_advertisements'),
                        children: renderTable(ads.filter((ad) => ad.adType === "BANNER")),
                    },
                ]}
            />

            {/* Add Advertisement Modal */}
            <Modal
                className="modal-white"
                title={t('artist_ad.submit_new_advertisement')}
                open={modalOpen}
                onCancel={() => setModalOpen(false)}
                footer={null}
            >
            </Modal>

            {/* Renew Advertisement Modal */}
            <Modal
                className="modal-white"
                title={
                    t('artist_ad.renew_advertisement') +
                    (renewModal.record?.id ? ` #${renewModal.record.id}` : '')
                }
                open={renewModal.open}
                onCancel={() => setRenewModal({ open: false, record: null })}
                footer={null}
            >
                <Form form={renewForm} layout="vertical" onFinish={handleRenew}>
                    <Form.Item name="startDate" label={t('artist_ad.new_start_date')} rules={[{ required: true, message: t('artist_ad.please_select_a_start_date') }]}>
                        <DatePicker style={{ width: "100%" }} />
                    </Form.Item>
                    <Form.Item name="endDate" label={t('artist_ad.new_end_date')} rules={[{ required: true, message: t('artist_ad.please_select_an_end_date') }]}>
                        <DatePicker style={{ width: "100%" }} />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" block>
                            {t('artist_ad.confirm_renew')}
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
