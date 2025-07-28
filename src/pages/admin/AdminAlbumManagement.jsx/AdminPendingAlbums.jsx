import { useEffect, useState } from "react";
import { Table, Image, message, Button, Space, Grid, Modal, Input, Empty, Select } from "antd";
import { DeleteOutlined, CheckOutlined, CloseOutlined } from "@ant-design/icons";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import BASE_API_URL from "../../../services/base.api.url";

const { useBreakpoint } = Grid;

export default function AdminPendingAlbums() {
    const { t } = useTranslation();
    const [albums, setAlbums] = useState([]);
    const [loading, setLoading] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [deleteReason, setDeleteReason] = useState("");
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [rejectId, setRejectId] = useState(null);
    const [rejectReason, setRejectReason] = useState("");
    const [rejectLoading, setRejectLoading] = useState(false);
    const screens = useBreakpoint();
    const isTablet = !screens.lg;
    const navigate = useNavigate();

    const fetchAlbums = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("accessToken");
            const res = await axios.get(`${BASE_API_URL}/api/v1/admin/albums/pending`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAlbums(res.data || []);
        } catch {
            message.error("Failed to load album list!");
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchAlbums();
    }, []);

    useEffect(() => {
        const style = document.createElement("style");
        style.innerHTML = `
        .ant-table { background-color: #101426 !important; color: #fff !important; }
        .ant-table-thead > tr > th { background-color: #181C2B !important; color: #fff !important; border-bottom: 2px solid #3ed8ff !important; }
        .ant-table-tbody > tr > td { background-color: #101426 !important; color: #fff !important; }
        .ant-table-tbody > tr:hover > td { background-color: #1f2233 !important; }
        .ant-pagination-item, .ant-pagination-prev, .ant-pagination-next { background-color: #101426 !important; border: 1px solid #434760 !important; color: #fff !important; }
        .ant-pagination-item-active { background-color: #434760 !important; border-color: #434760 !important; }
        .ant-pagination-item-active a { color: #fff !important; }
        .ant-select-selector { background-color: #101426 !important; color: #fff !important; border: 1px solid #434760 !important; }
        .ant-select-arrow { color: #fff !important; }
        .ant-select-dropdown { background-color: #181C2B !important; }
        .ant-select-item-option { color: #fff !important; }
        .ant-select-item-option-selected:not(.ant-select-item-option-disabled) { background-color: #434760 !important; color: #fff !important; }
        .ant-tag { border: none !important; border-radius: 8px !important; padding: 2px 10px !important; font-weight: 500; }
        .ant-empty-description { color: #999 !important; }
        .ant-empty-image { filter: invert(0.7); }
        `;
        document.head.appendChild(style);
        return () => document.head.removeChild(style);
    }, []);

    const showDeleteModal = (id) => { setDeleteId(id); setDeleteReason(""); };
    const showRejectModal = (id) => { setRejectId(id); setRejectReason(""); };

    const handleDelete = async () => {
        if (!deleteReason.trim()) {
            message.warning("Please enter a reason for deletion!");
            return;
        }
        setDeleteLoading(true);
        try {
            const token = localStorage.getItem("accessToken");
            await axios.delete(`${BASE_API_URL}/api/v1/admin/albums/${deleteId}/delete`, {
                params: { reason: deleteReason },
                headers: { Authorization: `Bearer ${token}` }
            });
            message.success("Album deleted!");
            setDeleteId(null);
            fetchAlbums();
        } catch {
            message.error("Failed to delete album!");
        }
        setDeleteLoading(false);
    };

    const handleReject = async () => {
        if (!rejectReason.trim()) {
            message.warning("Please enter a reason for rejection!");
            return;
        }
        setRejectLoading(true);
        try {
            const token = localStorage.getItem("accessToken");
            await axios.put(`${BASE_API_URL}/api/v1/admin/albums/${rejectId}/reject`, null, {
                params: { reason: rejectReason },
                headers: { Authorization: `Bearer ${token}` }
            });
            message.success("Album rejected!");
            setRejectId(null);
            fetchAlbums();
        } catch {
            message.error("Failed to reject album!");
        }
        setRejectLoading(false);
    };

    const handleApprove = async (id) => {
        try {
            const token = localStorage.getItem("accessToken");
            await axios.put(`${BASE_API_URL}/api/v1/admin/albums/${id}/approve`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            message.success("Album approved!");
            fetchAlbums();
        } catch {
            message.error("Failed to approve album!");
        }
    };

    const columns = [
        {
            title: "#",
            key: "index",
            align: "center",
            render: (_, __, index) => index + 1,
            width: 50,
        },
        {
            title: t('admin_albums.cover'),
            dataIndex: "coverImageUrl",
            key: "coverImageUrl",
            align: "center",
            render: (url) =>
                url ? (
                    <Image
                        src={url}
                        width={isTablet ? 48 : 80}
                        height={isTablet ? 48 : 80}
                        style={{ objectFit: "cover", borderRadius: 8, boxShadow: "0 0 6px rgba(0,0,0,0.5)" }}
                        preview={{ mask: <div style={{ color: "#fff", fontWeight: 600 }}>{t('admin_albums.preview')}</div> }}
                        alt={t('admin_albums.cover')}
                    />
                ) : "-",
        },
        {
            title: t('admin_albums.album_name'),
            dataIndex: "titleAlbum",
            key: "titleAlbum",
            ellipsis: true,
            align: "center",
        },
        {
            title: t('admin_albums.release_date'),
            dataIndex: "releaseDateStr",
            key: "releaseDateStr",
            ellipsis: true,
            align: "center",
        },
        {
            title: t('admin_albums.type'),
            dataIndex: "type",
            key: "type",
            ellipsis: true,
            align: "center",
        },
        {
            title: t('admin_albums.actions'),
            key: "actions",
            align: "center",
            render: (_, record) => (
                <Space>
                    <Button
                        type="primary"
                        icon={<CheckOutlined />}
                        size={isTablet ? "small" : "middle"}
                        onClick={() => handleApprove(record.id)}
                        aria-label={t('admin_albums.approve')}
                    />
                    <Button
                        danger
                        icon={<DeleteOutlined />}
                        size={isTablet ? "small" : "middle"}
                        onClick={() => showRejectModal(record.id)}
                        aria-label={t('admin_albums.reject')}
                    />
                </Space>
            ),
        },
    ];

    return (
        <div style={{ padding: isTablet ? 8 : 16 }}>
            <Table
                columns={columns}
                dataSource={albums}
                loading={loading}
                rowKey="id"
                pagination={{ pageSize: 10 }}
                size={isTablet ? "small" : "middle"}
                scroll={isTablet ? { x: 600 } : undefined}
                locale={{
                    emptyText: <Empty description={t('admin_albums.no_albums')} imageStyle={{ filter: "invert(0.7)" }} />,
                }}
                style={{ borderRadius: 12 }}
            />
            <Modal
                title={t('admin_albums.delete_reason_title')}
                open={!!deleteId}
                onCancel={() => setDeleteId(null)}
                footer={[
                    <Button key="cancel" onClick={() => setDeleteId(null)}>{t('admin_albums.cancel')}</Button>,
                    <Button key="confirm" type="primary" danger loading={deleteLoading} onClick={handleDelete}>
                        {t('admin_albums.confirm_delete')}
                    </Button>,
                ]}
            >
                <Input.TextArea
                    rows={4}
                    value={deleteReason}
                    onChange={(e) => setDeleteReason(e.target.value)}
                    placeholder={t('admin_albums.delete_reason_placeholder')}
                />
            </Modal>
            <Modal
                title={t('admin_albums.reject_reason_title')}
                open={!!rejectId}
                onCancel={() => setRejectId(null)}
                footer={[
                    <Button key="cancel" onClick={() => setRejectId(null)}>{t('admin_albums.cancel')}</Button>,
                    <Button key="confirm" type="primary" danger loading={rejectLoading} onClick={handleReject}>
                        {t('admin_albums.confirm_reject')}
                    </Button>,
                ]}
            >
                <Input.TextArea
                    rows={4}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder={t('admin_albums.reject_reason_placeholder')}
                />
            </Modal>
        </div>
    );
}