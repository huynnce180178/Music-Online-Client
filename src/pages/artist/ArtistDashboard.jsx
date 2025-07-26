import { Card, Row, Col, Typography, Skeleton, Table } from "antd";
import { useEffect, useState } from "react";
import { FiMusic, FiDisc, FiVolume2, FiDollarSign } from "react-icons/fi";
import { Line } from "@ant-design/charts";
import axios from "axios";
import { useTranslation } from 'react-i18next';
import BASE_API_URL from "../../services/base.api.url";

const { Title, Text } = Typography;

export default function ArtistDashboard() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({});
    const [recentSongs, setRecentSongs] = useState([]);
    const [chartData, setChartData] = useState([]);
    const { t } = useTranslation();

    useEffect(() => {
        // Giả lập API call
        setTimeout(async () => {
            try {
                const token = localStorage.getItem("accessToken");
                const [statsRes, songsRes, chartRes] = await Promise.all([
                    axios.get(`${BASE_API_URL}/api/v1/artist/dashboard/stats`, { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get(`${BASE_API_URL}/api/v1/artist/dashboard/recent-songs`, { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get(`${BASE_API_URL}/api/v1/artist/dashboard/chart`, { headers: { Authorization: `Bearer ${token}` } }),
                ]);
                setStats(statsRes.data);
                setRecentSongs(songsRes.data);
                setChartData(chartRes.data);
            } catch (err) {
                console.error("Failed to load data", err);
            }
            setLoading(false);
        }, 1000);
    }, []);

    const summaryCards = [
        { title: t('total_songs'), value: stats.totalSongs, icon: <FiMusic size={28} /> },
        { title: t('total_albums'), value: stats.totalAlbums, icon: <FiDisc size={28} /> },
        { title: t('advertisements'), value: stats.totalAds, icon: <FiVolume2 size={28} /> },
        { title: t('total_revenue', { value: stats.totalRevenue }), value: `$${stats.totalRevenue}`, icon: <FiDollarSign size={28} /> },
    ];

    const columns = [
        { title: t('song_name'), dataIndex: "name", key: "name" },
        { title: t('plays'), dataIndex: "plays", key: "plays" },
        { title: t('likes'), dataIndex: "likes", key: "likes" },
        { title: t('status'), dataIndex: "status", key: "status" },
    ];

    return (
        <div style={{ 
            padding: window.innerWidth < 768 ? "16px" : 24, 
            background: "#181c2b", 
            minHeight: "100vh" 
        }}>
            <Title level={2} style={{ marginBottom: 24, color: "#3ed8ff", fontWeight: 800 }}>
                {t('welcome')}
            </Title>

            <Row gutter={[16, 16]}>
                {summaryCards.map((card) => (
                    <Col xs={24} sm={12} md={6} key={card.title}>
                        <Card
                            style={{ borderRadius: 18, textAlign: "center", background: "#23283e", boxShadow: "0 4px 24px 0 #3ed8ff22", color: "#fff" }}
                            bodyStyle={{ padding: 24, background: "#23283e" }}
                        >
                            {loading ? (
                                <Skeleton active paragraph={{ rows: 0 }} />
                            ) : (
                                <>
                                    <div style={{ fontSize: 36, marginBottom: 8, color: "#3ed8ff" }}>{card.icon}</div>
                                    <Text style={{ fontSize: 18, fontWeight: 700, color: "#3ed8ff" }}>{card.title}</Text>
                                    <br />
                                    <Text style={{ fontSize: 24, fontWeight: 800, color: "#fff" }}>{card.value}</Text>
                                </>
                            )}
                        </Card>
                    </Col>
                ))}
            </Row>

            <Card
                title={<span style={{ color: "#3ed8ff", fontWeight: 700 }}>{t('performance_overview')}</span>}
                style={{ marginTop: 24, borderRadius: 18, background: "#23283e", boxShadow: "0 4px 24px 0 #3ed8ff22", color: "#fff" }}
                bodyStyle={{ padding: 24, background: "#23283e" }}
            >
                {loading ? (
                    <Skeleton active paragraph={{ rows: 4 }} />
                ) : (
                    <Line
                        data={chartData}
                        xField="date"
                        yField="value"
                        seriesField="type"
                        height={300}
                        smooth
                        autoFit
                    />
                )}
            </Card>

            <Card
                title={<span style={{ color: "#3ed8ff", fontWeight: 700 }}>{t('recent_songs')}</span>}
                style={{ marginTop: 24, borderRadius: 18, background: "#23283e", boxShadow: "0 4px 24px 0 #3ed8ff22", color: "#fff" }}
                bodyStyle={{ padding: 24, background: "#23283e" }}
            >
                {loading ? (
                    <Skeleton active paragraph={{ rows: 4 }} />
                ) : (
                    <Table
                        columns={columns}
                        dataSource={recentSongs}
                        rowKey="id"
                        pagination={{ pageSize: 5 }}
                        style={{ background: "#23283e", color: "#fff" }}
                        bordered
                    />
                )}
            </Card>
            <style>{`
                .ant-table, .ant-table-thead > tr > th, .ant-table-tbody > tr > td {
                    background: #23283e !important;
                    color: #fff !important;
                }
                .ant-table-thead > tr > th {
                    color: #3ed8ff !important;
                    font-weight: 700;
                }
                .ant-card-head {
                    background: #23283e !important;
                }
            `}</style>
        </div>
    );
}
