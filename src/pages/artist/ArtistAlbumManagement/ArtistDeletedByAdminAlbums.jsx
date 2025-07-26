import { useEffect, useState } from "react";
import { Table, Button, Space, Image, message, Grid } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import axios from "axios";
import { useTranslation } from 'react-i18next';
import BASE_API_URL from "../../../services/base.api.url";

const { useBreakpoint } = Grid;

export default function ArtistDeletedByAdminAlbums() {
    const [albums, setAlbums] = useState([]);
    const [loading, setLoading] = useState(false);
    const screens = useBreakpoint();
    const isTablet = !screens.lg;
    const token = localStorage.getItem("accessToken");
    const config = { headers: { Authorization: `Bearer ${token}` } };
    const { t } = useTranslation();

    useEffect(() => {
        const style = document.createElement("style");
        style.innerHTML = `
        .ant-table { background-color: #101426 !important; color: #fff !important; }
        .ant-table-thead > tr > th { background-color: #181C2B !important; color: #fff !important; border-bottom: 2px solid #3ed8ff !important; }
        .ant-table-tbody > tr > td { background-color: #101426 !important; color: #fff !important; }
        .ant-table-tbody > tr:hover > td { background-color: #1f2233 !important; }
        .ant-empty-description { color: #999 !important; }
        .ant-empty-image { filter: invert(0.7); }
        `;
        document.head.appendChild(style);
        return () => document.head.removeChild(style);
    }, []);

    const fetchAlbums = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${BASE_API_URL}/artist/album/my-deleted-by-admin`, config);
            setAlbums(res.data.data || []);
        } catch {
            setAlbums([]);
            message.error(t('artist_album.failed_to_load_albums_list'));
        }
        setLoading(false);
    };
    useEffect(() => { fetchAlbums(); }, []);

    const handleRequestRestore = async (albumId) => {
        try {
            await axios.post(
                `${BASE_API_URL}/artist/album/${albumId}/request-restore`,
                {},
                config
            );
            message.success(t('artist_album.restore_request_sent'));
            fetchAlbums();
        } catch {
            message.error(t('artist_album.failed_to_send_restore_request'));
        }
    };

    const columns = [
        {
            title: t('index'),
            key: "index",
            align: "center",
            width: 50,
            render: (text, record, index) => index + 1,
        },
        {
            title: t('album_name'),
            align: "center",
            dataIndex: "titleAlbum",
            key: "titleAlbum",
            width: isTablet ? 120 : 180,
            ellipsis: isTablet,
        },
        {
            title: t('release_date'),
            align: "center",
            dataIndex: "releaseDateStr",
            key: "releaseDateStr",
            width: isTablet ? 110 : 160,
            ellipsis: isTablet,
        },
        {
            title: t('type'),
            align: "center",
            dataIndex: "type",
            key: "type",
            width: isTablet ? 70 : 100,
            ellipsis: isTablet,
        },
        {
            title: t('status'),
            dataIndex: "status",
            key: "status",
            align: "center",
            width: 110,
            render: status => {
                let color = "#888";
                let bg = "#232b3e";
                let text = status;
                if (status === "PENDING") { color = "#b45309"; bg = "#fde68a"; text = t('pending'); }
                else if (status === "REJECTED") { color = "#991b1b"; bg = "#fecaca"; text = t('rejected'); }
                else if (status === "APPROVED") { color = "#0369a1"; bg = "#bae6fd"; text = t('approved'); }
                else if (status === "DELETED_BY_ADMIN") { color = "#fff"; bg = "#b91c1c"; text = t('deleted_by_admin'); }
                else if (status === "DELETED_BY_ARTIST") { color = "#fff"; bg = "#6b7280"; text = t('deleted_by_artist'); }
                return (
                    <span style={{
                        display: "inline-block",
                        background: bg,
                        color: color,
                        fontWeight: 700,
                        borderRadius: 8,
                        padding: "2px 12px",
                        fontSize: 13,
                        minWidth: 80,
                        textAlign: "center",
                        boxShadow: "0 1px 4px #0001"
                    }}>{text || '-'}</span>
                );
            }
        },
        {
            title: t('cover'),
            dataIndex: "coverImageUrl",
            key: "coverImageUrl",
            render: url => url && <Image src={url} width={isTablet ? 40 : 60} height={isTablet ? 40 : 60} style={{ objectFit: "cover", borderRadius: 8 }} />,
            width: isTablet ? 50 : 80,
            align: "center",
        },
        {
            title: t('actions'),
            align: "center",
            key: "action",
            render: (_, album) => (
                <Space>
                    <Button
                        type="dashed"
                        icon={<ReloadOutlined />}
                        onClick={() => handleRequestRestore(album.id)}
                    >
                        {t('request_restore')}
                    </Button>
                </Space>
            ),
            width: 140,
        }
    ];

    return (
        <div style={{ padding: isTablet ? 8 : 24 }}>
            <Table
                columns={columns}
                dataSource={albums}
                rowKey="id"
                loading={loading}
                pagination={false}
                size={isTablet ? "small" : "middle"}
                scroll={isTablet ? { x: 400 } : undefined}
                style={{ background: "#181d36" }}
                locale={{ emptyText: t('no_data') }}
            />
        </div>
    );
} 