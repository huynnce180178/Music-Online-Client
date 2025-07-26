import { useEffect, useState } from "react";
import { Table, Image, Button, message, Modal, Space, Tag, Grid, Empty, Tooltip } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import axios from "axios";
import { useTranslation } from 'react-i18next';
import BASE_API_URL from "../../../services/base.api.url";

export default function AdminSongsDeletedByArtist() {
    const { t } = useTranslation();
    const [songs, setSongs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
    });

    const { useBreakpoint } = Grid;
    const screens = useBreakpoint();
    const isTablet = !screens.lg;

    useEffect(() => {
        fetchSongs();
        const style = document.createElement("style");
        style.innerHTML = `
            .ant-table { background-color: #101426 !important; color: #fff !important; }
            .ant-table-thead > tr > th { background-color: #181C2B !important; color: #fff !important; border-bottom: 2px solid #3ed8ff !important; }
            .ant-table-tbody > tr > td { background-color: #101426 !important; color: #fff !important; }
            .ant-table-tbody > tr:hover > td { background-color: #1f2233 !important; }
            .ant-tag { border: none !important; border-radius: 8px !important; padding: 2px 10px !important; font-weight: 500; }
            .ant-pagination-item, .ant-pagination-prev, .ant-pagination-next { background-color: #101426 !important; border: 1px solid #434760 !important; color: #fff !important; }
            .ant-pagination-item-active { background-color: #434760 !important; border-color: #434760 !important; }
            .ant-pagination-item-active a { color: #fff !important; }
            .ant-empty-description { color: #999 !important; }
            .ant-empty-image { filter: invert(0.7); }
            .ant-modal-content { background-color: #181C2B !important; color: #fff !important; }
            .ant-modal-header { background-color: #181C2B !important; border-bottom: 1px solid #3ed8ff !important; }
            .ant-modal-title { color: #fff !important; }
            .ant-btn-primary { background-color: #ff4d4f !important; border-color: #ff4d4f !important; }
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
            const res = await axios.get(`${BASE_API_URL}/api/v1/admin/songs/deleted-by-artist`, {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    page: pagination.current - 1,
                    limit: pagination.pageSize,
                },
            });
            const data = res.data;
            const list = Array.isArray(data) ? data : data.data || [];
            const total = data.totalElements || list.length;
            setSongs(list);
            setPagination((prev) => ({ ...prev, total }));
        } catch {
            message.error("Cannot load song list deleted by artist!");
        }
        setLoading(false);
    };

    const handleSoftDelete = async () => {
        setDeleteLoading(true);
        try {
            const token = localStorage.getItem("accessToken");
            await axios.delete(`${BASE_API_URL}/api/v1/admin/songs/${deleteId}/delete`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            message.success("The song has been deleted and artist has been notified.");
            setDeleteId(null);
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
            render: (_, __, index) =>
                (pagination.current - 1) * pagination.pageSize + index + 1,
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
            ellipsis: true,
        },
        {
            title: t('admin_songs.artist'),
            dataIndex: "artistName",
            key: "artistName",
            align: "center",
            ellipsis: true,
        },
        {
            title: t('admin_songs.deleted_at'),
            dataIndex: "createdAtStr",
            key: "createdAtStr",
            align: "center",
            ellipsis: true,
        },
        {
            title: t('admin_songs.status'),
            key: "status",
            align: "center",
            render: () => (
                <Tag style={{ backgroundColor: "#FF4D4F", color: "#fff" }}>
                    {t('admin_songs.deleted_by_artist')}
                </Tag>
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
                locale={{
                    emptyText: <Empty description={t('admin_songs.no_deleted_songs')} imageStyle={{ filter: "invert(0.7)" }} />,
                }}
                style={{ borderRadius: 12 }}
            />

            <Modal
                title={t('admin_songs.confirm_permanent_delete')}
                open={!!deleteId}
                onCancel={() => setDeleteId(null)}
                confirmLoading={deleteLoading}
                onOk={handleSoftDelete}
                okText={t('admin_songs.confirm')}
                cancelText={t('admin_songs.cancel')}
            >
                <p>{t('admin_songs.permanent_delete_prompt')}</p>
            </Modal>
        </div>
    );
}
