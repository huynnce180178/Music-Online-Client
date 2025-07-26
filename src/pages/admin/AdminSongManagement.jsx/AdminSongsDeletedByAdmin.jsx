import { useEffect, useState } from "react";
import { Table, Button, message, Tag, Space, Grid, Image, Tooltip, Empty } from "antd";
import { RollbackOutlined } from "@ant-design/icons";
import axios from "axios";
import { useTranslation } from 'react-i18next';
import BASE_API_URL from "../../../services/base.api.url";

export default function AdminSongsDeletedByAdmin() {
    const { t } = useTranslation();
    const [songs, setSongs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [restoringId, setRestoringId] = useState(null);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
    });

    const { useBreakpoint } = Grid;
    const screens = useBreakpoint();
    const isTablet = !screens.lg;

    useEffect(() => {
        fetchDeletedSongs();
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
        `;
        document.head.appendChild(style);
        return () => document.head.removeChild(style);
    }, []);

    useEffect(() => {
        fetchDeletedSongs();
    }, [pagination.current, pagination.pageSize]);

    const fetchDeletedSongs = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("accessToken");
            const res = await axios.get(`${BASE_API_URL}/api/v1/admin/songs/deleted-by-admin`, {
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
            message.error("Cannot load playlist deleted by admin!");
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async (id) => {
        setRestoringId(id);
        try {
            const token = localStorage.getItem("accessToken");
            await axios.put(`${BASE_API_URL}/api/v1/admin/songs/${id}/restore`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });
            message.success("The song has been restored to pending status!");
            fetchDeletedSongs();
        } catch {
            message.error("Song restore failed!");
        } finally {
            setRestoringId(null);
        }
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
                    {t('admin_songs.deleted_by_admin')}
                </Tag>
            ),
        },
        {
            title: t('admin_songs.action'),
            key: "action",
            align: "center",
            render: (_, record) => (
                <Tooltip title={t('admin_songs.restore_to_pending')}>
                    <Button
                        type="primary"
                        icon={<RollbackOutlined />}
                        onClick={() => handleRestore(record.id)}
                        loading={restoringId === record.id}
                        size={isTablet ? "small" : "middle"}
                        aria-label={t('admin_songs.restore')}
                    />
                </Tooltip>
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
        </div>
    );
}
