import { useEffect, useState } from "react";
import { Table, Button, message, Tag, Space, Grid, Image, Modal, Input } from "antd";
import { CheckOutlined, DeleteOutlined } from "@ant-design/icons";
import axios from "axios";
import { useTranslation } from 'react-i18next';
import BASE_API_URL from "../../../services/base.api.url";

export default function AdminPendingSongs() {
    const { t } = useTranslation();
    const [pendingSongs, setPendingSongs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [rejectId, setRejectId] = useState(null);
    const [rejectReason, setRejectReason] = useState("");
    const [rejectLoading, setRejectLoading] = useState(false);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
    });

    const { useBreakpoint } = Grid;
    const screens = useBreakpoint();
    const isTablet = !screens.lg;

    useEffect(() => {
        fetchPendingSongs();
        const style = document.createElement("style");
        style.innerHTML = `
        /* Dark mode cho TABLE và PAGINATION */
        .ant-table {
            background-color: #101426 !important;
            color: #fff !important;
        }
        .ant-table-thead > tr > th {
            background-color: #181C2B !important;
            color: #fff !important;
            border-bottom: 2px solid #3ed8ff !important;
        }
        .ant-table-tbody > tr > td {
            background-color: #101426 !important;
            color: #fff !important;
        }
        .ant-table-tbody > tr:hover > td {
            background-color: #1f2233 !important;
        }
        .ant-tag {
            border: none !important;
            border-radius: 8px !important;
            padding: 2px 10px !important;
            font-weight: 500;
        }
        .ant-pagination-item,
        .ant-pagination-prev,
        .ant-pagination-next {
            background-color: #101426 !important;
            border: 1px solid #434760 !important;
            color: #fff !important;
        }
        .ant-pagination-item-active {
            background-color: #434760 !important;
            border-color: #434760 !important;
        }
        .ant-pagination-item-active a {
            color: #fff !important;
        }

        /* ❗❗ KHÔNG override ant-modal-content, ant-modal-header, ant-modal-title, ant-input để modal vẫn TRẮNG */
    `;
        document.head.appendChild(style);
        return () => document.head.removeChild(style);
    }, []);

    const fetchPendingSongs = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("accessToken");
            const res = await axios.get(`${BASE_API_URL}/api/v1/admin/songs/pending`, {
                headers: { Authorization: `Bearer ${token}` },
                params: { page: pagination.current - 1, limit: pagination.pageSize },
            });
            const data = res.data;
            const list = Array.isArray(data) ? data : data.data || [];
            const total = data.totalElements || list.length;
            setPendingSongs(list);
            setPagination((prev) => ({ ...prev, total }));
        } catch {
            message.error("Unable to load the pending song list!");
        }
        setLoading(false);
    };

    const handleApprove = async (id) => {
        try {
            const token = localStorage.getItem("accessToken");
            await axios.put(`${BASE_API_URL}/api/v1/admin/songs/${id}/approve`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });
            message.success("Song approved!");
            fetchPendingSongs();
        } catch {
            message.error("Song approval failed!");
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
            await axios.put(`${BASE_API_URL}/api/v1/admin/songs/${rejectId}/reject`, {}, {
                headers: { Authorization: `Bearer ${token}` },
                params: { reason: rejectReason },
            });
            message.success("The song was rejected!");
            setRejectId(null);
            setRejectReason("");
            fetchPendingSongs();
        } catch {
            message.error("Reject failed!");
        }
        setRejectLoading(false);
    };

    const handleTableChange = (newPagination) => {
        setPagination({
            ...pagination,
            current: newPagination.current,
            pageSize: newPagination.pageSize,
        });
    };

    const columns = [
        {
            title: "#",
            key: "index",
            align: "center",
            width: 50,
            render: (_, __, index) => (pagination.current - 1) * pagination.pageSize + index + 1,
        },
        {
            title: t('admin_songs.cover'),
            dataIndex: "profilePicUrl",
            key: "profilePicUrl",
            align: "center",
            render: (url) =>
                url ? (
                    <Image
                        src={url}
                        width={isTablet ? 48 : 80}
                        height={isTablet ? 48 : 80}
                        style={{ objectFit: "cover", borderRadius: 8, boxShadow: "0 0 6px rgba(0,0,0,0.5)" }}
                        preview={false}
                        alt={t('admin_songs.cover')}
                    />
                ) : "-",
        },
        {
            title: t('admin_songs.song_name'),
            dataIndex: "title",
            key: "title",
            align: "center",
            ellipsis: isTablet,
        },
        {
            title: t('admin_songs.artist'),
            dataIndex: "artistName",
            key: "artistName",
            align: "center",
            ellipsis: isTablet,
        },
        {
            title: t('admin_songs.status'),
            key: "status",
            align: "center",
            render: () => (
                <Tag style={{ backgroundColor: "#FAAD14", color: "#181d36" }}>
                    {t('admin_songs.pending_approval')}
                </Tag>
            ),
        },
        {
            title: t('admin_songs.actions'),
            key: "actions",
            align: "center",
            render: (_, record) => (
                <Space>
                    <Button
                        type="primary"
                        icon={<CheckOutlined />}
                        size={isTablet ? "small" : "middle"}
                        onClick={() => handleApprove(record.id)}
                        aria-label={t('admin_songs.approve')}
                    />
                    <Button
                        danger
                        icon={<DeleteOutlined />}
                        size={isTablet ? "small" : "middle"}
                        onClick={() => setRejectId(record.id)}
                        aria-label={t('admin_songs.reject')}
                    />
                </Space>
            ),
        },
    ];

    return (
        <div style={{ padding: isTablet ? 8 : 16 }}>
            <Table
                columns={columns}
                dataSource={pendingSongs}
                loading={loading}
                rowKey="id"
                pagination={{
                    current: pagination.current,
                    pageSize: pagination.pageSize,
                    total: pagination.total,
                    showSizeChanger: true,
                }}
                onChange={handleTableChange}
                size={isTablet ? "small" : "middle"}
                scroll={isTablet ? { x: 600 } : undefined}
                style={{ borderRadius: 12 }}
            />
            <Modal
                title={t('admin_songs.reject_reason_title')}
                open={!!rejectId}
                onCancel={() => setRejectId(null)}
                footer={[
                    <Button key="cancel" onClick={() => setRejectId(null)}>
                        {t('admin_songs.cancel')}
                    </Button>,
                    <Button
                        key="submit"
                        type="primary"
                        danger
                        loading={rejectLoading}
                        onClick={handleReject}
                    >
                        {t('admin_songs.confirm_reject')}
                    </Button>,
                ]}
            >
                <p>{t('admin_songs.reject_reason_prompt')}</p>
                <Input.TextArea
                    rows={4}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder={t('admin_songs.reject_reason_placeholder')}
                />
            </Modal>
        </div>
    );
}
