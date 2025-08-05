import { useEffect, useState } from "react";
import { Table, Image, message, Grid, Space, Button, Modal, Input, Tabs, Tag } from "antd";
import axios from "axios";
import { useTranslation } from 'react-i18next';
import BASE_API_URL from "../../../services/base.api.url";

const { useBreakpoint } = Grid;

const statusColors = {
    PENDING: "#FAAD14",
    APPROVED: "#52C41A",
    REJECTED: "#FF4D4F",
};

export default function AdminAdvertisement() {
    const { t } = useTranslation();
    const [ads, setAds] = useState([]);
    const [loading, setLoading] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteReason, setDeleteReason] = useState("");
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
    const [createForm, setCreateForm] = useState({
        startDate: '',
        endDate: '',
        redirectUrl: '',
        mediaFile: null
    });
    //     const { name, value, type, files } = e.target;
    //     setCreateForm(f => ({
    //         ...f,
    //         [name]: type === 'file' ? files[0] : value
    //     }));
    // };
    // const handleCreateAd = async () => {
    //     if (!createForm.adType || !createForm.startDate || !createForm.endDate) {
    //         message.warning('Please fill all required fields!');
    //         return;
    //     }
    //     setCreateLoading(true);
    //     try {
    //         const token = localStorage.getItem('accessToken');
    //         const formData = new FormData();
    //         formData.append('adType', createForm.adType);
    //         formData.append('startDate', createForm.startDate);
    //         formData.append('endDate', createForm.endDate);
    //         formData.append('redirectUrl', createForm.redirectUrl || '');
    //         if (createForm.mediaFile) formData.append('mediaFile', createForm.mediaFile);
    //         const adminEmail = localStorage.getItem('userName') || localStorage.getItem('email') || '';
    //         formData.append('adminEmail', adminEmail);
    //         await axios.post(`${BASE_API_URL}/api/v1/admin/advertisements/create`, formData, {
    //             headers: { Authorization: `Bearer ${token}` },
    //         });
    //         message.success('Advertisement created successfully!');
    //         // setShowCreateModal(false);
    //         setCreateForm({ adType: '', startDate: '', endDate: '', redirectUrl: '', mediaFile: null });
    //         fetchAdvertisements();
    //     } catch (err) {
    //         message.error(err?.response?.data?.message || 'Failed to create advertisement!');
    //     }
    //     setCreateLoading(false);
    // };

    const screens = useBreakpoint();
    const isTablet = !screens.lg;

    useEffect(() => {
        fetchAdvertisements();
        const style = document.createElement("style");
        style.innerHTML = `
        /* DARK MODE TABLE */
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

        /* LIGHT MODE MODAL */
        .ant-modal-content.modal-light { background-color: #fff !important; color: #000 !important; }
        .ant-modal-content.modal-light .ant-modal-header { background-color: #fff !important; border-bottom: 1px solid #d9d9d9 !important; }
        .ant-modal-content.modal-light .ant-modal-title { color: #000 !important; }
        .ant-modal-content.modal-light .ant-btn { border-radius: 6px; }

        /* INPUT INSIDE MODAL LIGHT */
        .ant-modal-content.modal-light .ant-input,
        .ant-modal-content.modal-light .ant-input-textarea {
            background-color: #fff !important;
            color: #000 !important;
            border: 1px solid #d9d9d9 !important;
        }
        .ant-modal-content.modal-light .ant-input::placeholder,
        .ant-modal-content.modal-light .ant-input-textarea::placeholder {
            color: #888 !important;
        }
    `;
        document.head.appendChild(style);
        return () => document.head.removeChild(style);
    }, []);

    const fetchAdvertisements = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("accessToken");
            const res = await axios.get(`${BASE_API_URL}/api/v1/admin/advertisements`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setAds(Array.isArray(res.data) ? res.data : res.data.data || []);
        } catch {
            message.error("Unable to load advertisements!");
        } finally {
            setLoading(false);
        }
    };

    const showDeleteModal = (id) => {
        setDeleteId(id);
        setDeleteReason("");
    };

    const handleDelete = async () => {
        if (!deleteReason.trim()) {
            message.warning("Please enter reason for deletion!");
            return;
        }
        setDeleteLoading(true);
        try {
            const token = localStorage.getItem("accessToken");
            await axios.delete(`${BASE_API_URL}/api/v1/admin/advertisements/${deleteId}/delete`, {
                params: { reason: deleteReason },
                headers: { Authorization: `Bearer ${token}` },
            });
            message.success("The advertisement has been deleted!");
            setDeleteId(null);
            setDeleteReason("");
            fetchAdvertisements();
        } catch {
            message.error("Delete advertisement failed!");
        }
        setDeleteLoading(false);
    };

    const getColumns = (type) => [
        {
            title: "#",
            key: "index",
            align: "center",
            render: (_, __, index) => index + 1,
        },
        {
            title: t('admin_ads.artist_name'),
            align: "center",
            dataIndex: "createdByName",
            key: "createdByName",
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
            title: t('admin_ads.start_date'),
            align: "center",
            dataIndex: "startDateStr",
            key: "startDateStr",
        },
        {
            title: t('admin_ads.end_date'),
            align: "center",
            dataIndex: "endDateStr",
            key: "endDateStr",
        },
        {
            title: t('admin_ads.status'),
            align: "center",
            dataIndex: "status",
            key: "status",
            render: (status) => (
                <Tag style={{ backgroundColor: statusColors[status] || "#d9d9d9", color: "#181d36", borderRadius: 8 }}>
                    {t('admin_ads.status_' + status.toLowerCase(), status)}
                </Tag>
            ),
        },
    ];

    const renderTable = (data, type) => (
        <Table
            columns={getColumns(type)}
            dataSource={data}
            loading={loading}
            rowKey="id"
            pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: data.length,
                showSizeChanger: true,
            }}
            onChange={(newPagination) =>
                setPagination({ current: newPagination.current, pageSize: newPagination.pageSize })
            }
            size={isTablet ? "small" : "middle"}
            scroll={isTablet ? { x: 800 } : undefined}
            locale={{ emptyText: t('admin_ads.no_ads') }}
            style={{ borderRadius: 12 }}
        />
    );
    //     try {
    //         // const values = await adminAddForm.validateFields();
    //         // setAdminAddLoading(true);
    //         const formData = new FormData();
    //         formData.append("adType", values.adType);
    //         formData.append("startDate", values.startDate.format("YYYY-MM-DD"));
    //         formData.append("endDate", values.endDate.format("YYYY-MM-DD"));
    //         let fileToUpload = null;
    //         if (values.mediaFile && values.mediaFile.file) {
    //             fileToUpload = values.mediaFile.file.originFileObj || values.mediaFile.file;
    //         } else if (values.mediaFile && values.mediaFile.originFileObj) {
    //             fileToUpload = values.mediaFile.originFileObj;
    //         }
    //         if (fileToUpload) {
    //             formData.append("mediaFile", fileToUpload);
    //         }
    //         formData.append("redirectUrl", values.redirectUrl || "");
    //         formData.append("adminEmail", values.adminEmail);
    //         const token = localStorage.getItem("accessToken");
    //         await axios.post(`${BASE_API_URL}/api/v1/admin/advertisements/create`, formData, {
    //             headers: { Authorization: `Bearer ${token}` },
    //         });
    //         message.success('Advertisement created successfully!');
    //         // setShowCreateModal(false);
    //         // adminAddForm.resetFields();
    //         fetchAdvertisements();
    //     } catch (err) {
    //         if (err?.errorFields) return;
    //         message.error(err?.response?.data?.message || 'Failed to create advertisement!');
    //     }
    //     // setAdminAddLoading(false);
    // };

    return (
        <div style={{ padding: isTablet ? 8 : 16 }}>
            <Tabs
                defaultActiveKey="AUDIO"
                items={[
                    {
                        key: "AUDIO",
                        label: t('admin_ads.audio_ads'),
                        children: renderTable(ads.filter((ad) => ad.adType === "AUDIO"), "AUDIO"),
                    },
                    {
                        key: "BANNER",
                        label: t('admin_ads.banner_ads'),
                        children: renderTable(ads.filter((ad) => ad.adType === "BANNER"), "BANNER"),
                    },
                ]}
            />
            <Modal
                className="modal-light"
                title={t('admin_ads.delete_reason_title')}
                open={!!deleteId}
                onCancel={() => setDeleteId(null)}
                footer={[
                    <Button key="back" onClick={() => setDeleteId(null)}>
                        {t('admin_ads.cancel')}
                    </Button>,
                    <Button key="submit" type="primary" danger loading={deleteLoading} onClick={handleDelete}>
                        {t('admin_ads.confirm_delete')}
                    </Button>,
                ]}
            >
                <p>{t('admin_ads.delete_reason_prompt')}</p>
                <Input.TextArea
                    rows={4}
                    value={deleteReason}
                    onChange={(e) => setDeleteReason(e.target.value)}
                    placeholder={t('admin_ads.delete_reason_placeholder')}
                />
            </Modal>
        </div>
    );
}
