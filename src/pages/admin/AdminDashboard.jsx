import { useEffect, useState } from "react";
import {
    Card, Row, Col, DatePicker, Typography, Space, Spin
} from "antd";
import {
    UserOutlined, DollarOutlined, AppstoreOutlined
} from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";
import {
    PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer
} from "recharts";
import { useTranslation } from 'react-i18next';
import BASE_API_URL from "../../services/base.api.url";

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

const COLORS = [
  "#00eaff", "#ffe066", "#40c4ff", "#00e676", "#ff1744", "#b388ff", "#ff9800", "#ff80ab"
];

// Custom label cho PieChart
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, value }) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 1.15;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="#ffffff"
      fontWeight="bold"
      fontSize={14}
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      style={{ textShadow: "0 1px 8px #101426" }}
    >
      {value}
    </text>
  );
};

export default function AdminDashboard() {
    const { t } = useTranslation();
    const [userStats, setUserStats] = useState({});
    const [albumCount, setAlbumCount] = useState(0);
    const [songCount, setSongCount] = useState(0);
    const [genreCount, setGenreCount] = useState(0);
    const [commentCount, setCommentCount] = useState(0);
    const [subscriptionStats, setSubscriptionStats] = useState({});
    const [range, setRange] = useState([]);
    const [loading, setLoading] = useState(true);

    const token = localStorage.getItem("accessToken");

    useEffect(() => { fetchAllStats(); }, []);
    const fetchAllStats = async (start, end) => {
        setLoading(true);
        await Promise.all([
            fetchUserStats(start, end),
            fetchAlbumStats(start, end),
            fetchSongStats(start, end),
            fetchGenreStats(),
            fetchCommentStats(start, end),
            fetchSubscriptionStats(start, end)
        ]);
        setLoading(false);
    };
    const handleRangeChange = (dates) => {
        setRange(dates);
        if (dates && dates.length === 2) {
            const startStr = dayjs(dates[0]).format("YYYY-MM-DDTHH:mm:ss");
            const endStr = dayjs(dates[1]).format("YYYY-MM-DDTHH:mm:ss");
            fetchAllStats(startStr, endStr);
        } else {
            fetchAllStats();
        }
    };

    // Các hàm fetch API
    const fetchUserStats = async (start, end) => {
        try {
            const params = {};
            if (start) params.start = start;
            if (end) params.end = end;
            const res = await axios.get(`${BASE_API_URL}/admin/statistic/userStatistic`, {
                headers: { Authorization: `Bearer ${token}` },
                params
            });
            setUserStats(res.data.data);
        } catch { }
    };
    const fetchAlbumStats = async (start, end) => {
        try {
            const params = {};
            if (start) params.start = start;
            if (end) params.end = end;
            const res = await axios.get(`${BASE_API_URL}/admin/statistic/albumStatistic`, {
                headers: { Authorization: `Bearer ${token}` },
                params
            });
            setAlbumCount(res.data.data);
        } catch { }
    };
    const fetchSongStats = async (start, end) => {
        try {
            const params = {};
            if (start) params.start = start;
            if (end) params.end = end;
            const res = await axios.get(`${BASE_API_URL}/admin/statistic/songStatistic`, {
                headers: { Authorization: `Bearer ${token}` },
                params
            });
            setSongCount(res.data.data);
        } catch { }
    };
    const fetchGenreStats = async () => {
        try {
            const res = await axios.get(`${BASE_API_URL}/admin/statistic/genreStatistic`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setGenreCount(res.data.data);
        } catch { }
    };
    const fetchCommentStats = async (start, end) => {
        try {
            const params = {};
            if (start) params.start = start;
            if (end) params.end = end;
            const res = await axios.get(`${BASE_API_URL}/admin/statistic/commentStatistic`, {
                headers: { Authorization: `Bearer ${token}` },
                params
            });
            setCommentCount(res.data.data);
        } catch { }
    };
    const fetchSubscriptionStats = async (start, end) => {
        try {
            const params = {};
            if (start) params.start = start;
            if (end) params.end = end;
            const res = await axios.get(`${BASE_API_URL}/admin/statistic/subscriptionStatistic`, {
                headers: { Authorization: `Bearer ${token}` },
                params
            });
            setSubscriptionStats(res.data.data);
        } catch { }
    };

    // Dữ liệu biểu đồ
    const userPieData = [
        { name: t('admin_dashboard.user'), value: userStats.userRoleUser || 0 },
        { name: t('admin_dashboard.artist'), value: userStats.userRoleArtist || 0 },
        { name: t('admin_dashboard.premium'), value: userStats.userRolePremium || 0 },
    ];
    const subscriptionPieData = [
        { name: t('admin_dashboard.premium'), value: subscriptionStats.totalPlanPremium || 0 },
        { name: t('admin_dashboard.artist'), value: subscriptionStats.totalPlanArtist || 0 },
    ];
    // Bar chart: mỗi cột 1 màu
    const barData = [
        {
            name: t('admin_dashboard.statistics'),
            Album: albumCount,
            Song: songCount,
            Genre: genreCount,
            Comment: commentCount
        }
    ];

    // Legend cho bar chart
    const barLegend = [
        { name: t('admin_dashboard.album'), color: "#3ed8ff" },
        { name: t('admin_dashboard.song'), color: "#faad14" },
        { name: t('admin_dashboard.genre'), color: "#52c41a" },
        { name: t('admin_dashboard.comment'), color: "#ff4d4f" }
    ];

    const STAT_NUMBER_COLOR = "#fff"; // hoặc thử #00e676 nếu muốn nổi bật hơn

    // Component Card
    const StatCard = ({
        title, value, icon, chart, legend
    }) => (
        <Card
            style={{
                borderRadius: 20,
                boxShadow: "0 6px 32px 0 rgba(62, 216, 255, 0.09)",
                minHeight: 400,
                background: "#23283e",
                border: "none",
                padding: 0,
                color: "#fff"
            }}
            styles={{
                body: { padding: 32, background: "#23283e", color: "#fff" }
            }}
            hoverable
        >
            <Text strong style={{ fontSize: 18, color: "#3ed8ff" }}>{title}</Text>
            <div style={{ display: "flex", alignItems: "center", margin: "14px 0 26px 0" }}>
                <span style={{ fontSize: 38, color: "#3ed8ff", marginRight: 12 }}>{icon}</span>
                <span style={{ fontSize: 38, fontWeight: 700, color: STAT_NUMBER_COLOR }}>{value}</span>
            </div>
            <div style={{ width: "100%", height: 180, marginBottom: 18 }}>
                {chart}
            </div>
            {legend && (
                <Space>
                    {legend.map((item) => (
                        <span key={item.name} style={{ fontSize: 15, color: "#fff" }}>
                            <span style={{
                                display: "inline-block",
                                width: 14, height: 14,
                                background: item.color,
                                borderRadius: "50%",
                                marginRight: 7, marginTop: -2
                            }}></span>
                            {item.name}
                        </span>
                    ))}
                </Space>
            )}
        </Card>
    );

    // Loading state
    if (loading) {
        return (
            <div style={{ padding: 80, display: "flex", justifyContent: "center", alignItems: "center", background: "#181c2b", minHeight: "100vh" }}>
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div style={{ padding: 32, background: "#181c2b", minHeight: "100vh" }}>
            <Title level={2} style={{
                color: "#3ed8ff",
                fontWeight: 800,
                marginBottom: 36,
                letterSpacing: "0.02em"
            }}>
                {t('admin_dashboard.title')}
            </Title>

            <div style={{
                marginBottom: 32,
                display: "flex",
                justifyContent: "flex-end"
            }}>
                <RangePicker
                    value={range}
                    onChange={handleRangeChange}
                    showTime
                    style={{
                        borderRadius: 12,
                        padding: 10,
                        fontSize: 16,
                        border: "1.5px solid #3ed8ff",
                        boxShadow: "0 2px 8px #3ed8ff22",
                        background: "#23283e",
                        color: "#fff"
                    }}
                    placeholder={[t('admin_dashboard.start_date'), t('admin_dashboard.end_date')]}
                />
            </div>

            <Row gutter={[32, 32]}>
                <Col xs={24} md={12} lg={8}>
                    <StatCard
                        title={t('admin_dashboard.total_users')}
                        value={userStats.totalUser || 0}
                        icon={<UserOutlined />}
                        chart={
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie
                                        data={userPieData}
                                        dataKey="value"
                                        nameKey="name"
                                        outerRadius={62}
                                        innerRadius={32}
                                        stroke="none"
                                        label={renderCustomLabel}
                                    >
                                        {userPieData.map((entry, idx) => (
                                            <Cell key={entry.name} fill={COLORS[idx % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ background: "#23283e", color: "#00eaff", border: "none" }}
                                        itemStyle={{ color: "#00eaff" }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        }
                        legend={userPieData.map((d, i) => ({ name: d.name, color: COLORS[i % COLORS.length] }))}
                    />
                </Col>
                <Col xs={24} md={12} lg={8}>
                    <StatCard
                        title={t('admin_dashboard.total_subscriptions')}
                        value={subscriptionStats.totalSubscription || 0}
                        icon={<DollarOutlined />}
                        chart={
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie
                                        data={subscriptionPieData}
                                        dataKey="value"
                                        nameKey="name"
                                        outerRadius={62}
                                        innerRadius={32}
                                        stroke="none"
                                    >
                                        {subscriptionPieData.map((entry, idx) => (
                                            <Cell key={entry.name} fill={COLORS[(idx + 1) % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ background: "#23283e", color: "#fff", border: "none" }} />
                                </PieChart>
                            </ResponsiveContainer>
                        }
                        legend={subscriptionPieData.map((d, i) => ({
                            name: d.name, color: COLORS[(i + 1) % COLORS.length]
                        }))}
                    />
                </Col>
                <Col xs={24} lg={8}>
                    <StatCard
                        title={t('admin_dashboard.total_system_stats')}
                        value={albumCount + songCount + genreCount + commentCount}
                        icon={<AppstoreOutlined />}
                        chart={
                            <ResponsiveContainer>
                                <BarChart data={barData}>
                                    <XAxis dataKey="name" tick={false} axisLine={false} stroke="#fff" />
                                    <YAxis allowDecimals={false} stroke="#fff" />
                                    <Tooltip contentStyle={{ background: "#23283e", color: "#fff", border: "none" }} />
                                    <Bar dataKey="Album" fill="#00eaff" barSize={22} />
                                    <Bar dataKey="Song" fill="#ffe066" barSize={22} />
                                    <Bar dataKey="Genre" fill="#00e676" barSize={22} />
                                    <Bar dataKey="Comment" fill="#ff1744" barSize={22} />
                                </BarChart>
                            </ResponsiveContainer>
                        }
                        legend={barLegend}
                    />
                </Col>
            </Row>
            <style>{`
                .ant-card, .ant-card-body, .ant-card-head {
                    background: #23283e !important;
                    color: #fff !important;
                }
                .ant-typography, .ant-typography h2, .ant-typography h3, .ant-typography h4 {
                    color: #3ed8ff !important;
                }
                .ant-picker-input input {
                    color: #fff !important;
                }
                /* Đổi màu placeholder input của DatePicker/RangePicker */
                .ant-picker input::placeholder {
                  color: #8ca0c6 !important;   /* Màu xanh xám nhạt, dễ nhìn trên nền tối */
                  opacity: 1 !important;
                }
                .ant-picker-focused, .ant-picker:hover {
                  border-color: #3ed8ff !important;
                  box-shadow: 0 0 0 2px #3ed8ff33 !important;
                }
                .ant-picker-suffix {
                  color: #3ed8ff !important;
                }
            `}</style>
        </div>
    );
}
