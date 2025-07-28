import { useEffect, useState } from "react";
import { Table, Button, Space, Image, message, Modal, Grid } from "antd";
import { EyeOutlined } from "@ant-design/icons";
import axios from "axios";
import { useTranslation } from 'react-i18next';
import BASE_API_URL from "../../../services/base.api.url";

const { useBreakpoint } = Grid;

export default function ArtistRejectedSongs() {
    const [songs, setSongs] = useState([]);
    const [loading, setLoading] = useState(false);
    const screens = useBreakpoint();
    const isTablet = !screens.lg;
    const isMobile = !screens.md;
    const token = localStorage.getItem("accessToken");
    const config = { headers: { Authorization: `Bearer ${token}` } };
    const { t } = useTranslation();

    useEffect(() => {
        fetchRejectedSongs();
    }, []);

    // Thêm CSS động cho table nền tối và bo góc đẹp
    useEffect(() => {
        const style = document.createElement("style");
        style.innerHTML = `
        .ant-table {
            background-color: #181d36 !important;
            color: #fff !important;
            border-radius: 0 !important;
            overflow: hidden;
        }
        .ant-table-thead > tr > th {
            background-color: #232b3e !important;
            color: #ffffff !important;
            border-bottom: 2px solid #3ed8ff !important;
            font-weight: 700;
            font-size: 17px;
            border-radius: 0 !important;
        }
        .ant-table-thead > tr > th:first-child {
            border-top-left-radius: 0 !important;
        }
        .ant-table-thead > tr > th:last-child {
            border-top-right-radius: 0 !important;
        }
        .ant-table-tbody > tr > td {
            background-color: #181d36 !important;
            color: #fff !important;
            font-size: 16px;
            border-radius: 0 !important;
        }
        .ant-table-tbody > tr:hover > td {
            background-color: #233554 !important;
        }
        .ant-empty-description {
            color: #8ca0c6 !important;
            font-size: 18px;
        }
        .ant-empty-image {
            filter: invert(0.7);
        }
        .ant-table-content {
            border-radius: 0 !important;
        }
        `;
        document.head.appendChild(style);
        return () => document.head.removeChild(style);
    }, []);

    const fetchRejectedSongs = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${BASE_API_URL}/api/v1/artist/song/my-rejected`, config);
            setSongs(res.data.data || []);
        } catch {
            setSongs([]);
            message.error("Failed to load rejected songs");
        }
        setLoading(false);
    };

    const handleRequestRestore = async (songId) => {
        try {
            await axios.post(
                `${BASE_API_URL}/api/v1/artist/song/${songId}/request-restore`,
                {},
                config
            );
            message.success("Restore request sent!");
            fetchRejectedSongs();
        } catch {
            message.error("Failed to send restore request!");
        }
    };

    const handleViewLyrics = async (songId, songTitle) => {
        try {
            const res = await axios.get(`${BASE_API_URL}/api/v1/song/lyric/${songId}`, config);
            Modal.info({
                title: `Lyrics - ${songTitle}`,
                content: <div style={{ whiteSpace: "pre-line" }}>{res.data.data || "No lyrics"}</div>,
                width: 500,
            });
        } catch {
            message.error("Failed to load lyrics!");
        }
    };

    const columns = [
        {
            title: t('index'),
            key: "index",
            align: "center",
            render: (text, record, index) => index + 1,
            width: isMobile ? 36 : isTablet ? 50 : 50,
        },
        {
            title: t('cover'),
            dataIndex: "profilePicUrl",
            key: "profilePicUrl",
            render: url => url && <Image src={url} width={isMobile ? 28 : isTablet ? 40 : 60} height={isMobile ? 28 : isTablet ? 40 : 60} style={{ objectFit: "cover", borderRadius: 8 }} />,
            width: isMobile ? 36 : isTablet ? 50 : 80,
            align: "center",
        },
        {
            title: t('title'),
            align: "center",
            dataIndex: "title",
            key: "title",
            width: isMobile ? 70 : isTablet ? 110 : 200,
            ellipsis: isTablet || isMobile,
        },
        {
            title: t('status'),
            dataIndex: "status",
            key: "status",
            align: "center",
            width: isMobile ? 70 : 110,
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
            title: t('actions'),
            align: "center",
            key: "action",
            render: (_, song) => (
                <Space>
                    <Button icon={<EyeOutlined />} onClick={() => handleViewLyrics(song.id, song.title)} title={t('view_lyrics')} size={isMobile ? "small" : undefined} />
                    <Button type="dashed" onClick={() => handleRequestRestore(song.id)} title={t('request_restore') || "Request Restore"} size={isMobile ? "small" : undefined}>
                        {t('request_restore') || "Request Restore"}
                    </Button>
                </Space>
            ),
            width: isMobile ? 80 : 200,
        }
    ];

    return (
        <div style={{ padding: isMobile ? 4 : isTablet ? 8 : 24, width: "100%", height: "100%", boxSizing: "border-box", flex: 1, display: "flex", flexDirection: "column" }}>
            <Table
                columns={columns}
                dataSource={songs}
                rowKey="id"
                loading={loading}
                pagination={false}
                size={isMobile ? "small" : isTablet ? "small" : "middle"}
                scroll={isMobile ? { x: 480 } : isTablet ? { x: 700 } : undefined}
                style={{ background: "#181d36", minWidth: isMobile ? 480 : isTablet ? 700 : undefined, width: "100%" }}
                locale={{ emptyText: t('no_data') }}
            />
        </div>
    );
}