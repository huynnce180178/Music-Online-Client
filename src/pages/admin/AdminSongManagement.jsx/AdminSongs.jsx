import { useEffect, useState } from "react";
import { Table, Image, message, Grid, Space, Button, Modal, Input, Tag } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import axios from "axios";
import { useTranslation } from 'react-i18next';
import BASE_API_URL from "../../../services/base.api.url";

const { useBreakpoint } = Grid;

export default function AdminSongs() {
    const { t } = useTranslation();
    const [songs, setSongs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteReason, setDeleteReason] = useState("");
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
    });

    const screens = useBreakpoint();
    const isTablet = !screens.lg;

    useEffect(() => {
        const style = document.createElement("style");
        style.innerHTML = `
        /* TABLE dark mode */
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
        .ant-tag {
            border: none !important;
            border-radius: 8px !important;
            padding: 2px 10px !important;
            font-weight: 500;
        }

        /* IMPORTANT: KHÔNG override modal, input, textarea */
    `;
        document.head.appendChild(style);
        return () => document.head.removeChild(style);
    }, []);

    useEffect(() => {
        fetchSongs();
    }, [pagination.current, pagination.pageSize]);

    const fetchSongs = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("accessToken");
            const res = await axios.get(`${BASE_API_URL}/admin/songs/all`, {
                headers: { Authorization: `Bearer ${token}` },
                params: { page: pagination.current - 1, limit: pagination.pageSize },
            });

            const data = res.data;
            const songList = Array.isArray(data) ? data : data.data || [];
            const total = data.totalElements || songList.length;

            setSongs(songList);
            setPagination((prev) => ({ ...prev, total }));
        } catch (err) {
            console.error("Error fetching songs:", err);
            message.error("Unable to load playlist!");
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
            await axios.delete(`${BASE_API_URL}/admin/songs/${deleteId}/delete`, {
                data: { reason: deleteReason },
                headers: { Authorization: `Bearer ${token}` },
            });
            message.success("The song has been removed and the artist has been notified!");
            setDeleteId(null);
            setDeleteReason("");
            fetchSongs();
        } catch {
            message.error("Delete song failed!");
        }
        setDeleteLoading(false);
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
            align: "center",
            dataIndex: "title",
            key: "title",
            ellipsis: isTablet,
        },
        {
            title: t('admin_songs.artist'),
            align: "center",
            dataIndex: "artistName",
            key: "artistName",
            ellipsis: isTablet,
        },
        {
            title: t('admin_songs.album'),
            align: "center",
            dataIndex: "albumName",
            key: "albumName",
            ellipsis: isTablet,
        },
        {
            title: t('admin_songs.actions'),
            key: "action",
            align: "center",
            render: (_, record) => (
                <Space>
                    <Button
                        type="primary"
                        danger
                        icon={<DeleteOutlined />}
                        size={isTablet ? "small" : "middle"}
                        onClick={() => showDeleteModal(record.id)}
                        aria-label={t('admin_songs.delete')}
                    />
                </Space>
            ),
        },
    ];

    return (
        <div style={{ padding: isTablet ? 8 : 16 }}>
            <Table
                columns={columns}
                dataSource={songs}
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
                locale={{ emptyText: t('admin_songs.no_songs') }}
                style={{ borderRadius: 12 }}
            />

            <Modal
                title={t('admin_songs.delete_reason_title')}
                open={!!deleteId}
                onCancel={() => setDeleteId(null)}
                footer={[
                    <Button key="cancel" onClick={() => setDeleteId(null)}>
                        {t('admin_songs.cancel')}
                    </Button>,
                    <Button
                        key="submit"
                        type="primary"
                        danger
                        loading={deleteLoading}
                        onClick={handleDelete}
                    >
                        {t('admin_songs.confirm_delete')}
                    </Button>,
                ]}
            >
                <p>{t('admin_songs.delete_reason_prompt')}</p>
                <Input.TextArea
                    rows={4}
                    value={deleteReason}
                    onChange={(e) => setDeleteReason(e.target.value)}
                    placeholder={t('admin_songs.delete_reason_placeholder')}
                />
            </Modal>
        </div>
    );
}
