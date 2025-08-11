import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Table, Image, message, Grid, Space, Button, Modal, Input, Tag } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import axios from "axios";
import debounce from "lodash.debounce";
import { useTranslation } from 'react-i18next';
import BASE_API_URL from "../../../services/base.api.url";

const { useBreakpoint } = Grid;
const { Search } = Input;

export default function AdminSongs() {
    const { t } = useTranslation();
    const [songs, setSongs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteReason, setDeleteReason] = useState("");
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
    const [keyword, setKeyword] = useState("");
    const [searchMode, setSearchMode] = useState(false); // true: đang dùng guest/fullTextSearch

    const controllerRef = useRef(null);
    const screens = useBreakpoint();
    const isTablet = !screens.lg;

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
      .ant-tag { border: none !important; border-radius: 8px !important; padding: 2px 10px !important; font-weight: 500; }

      /* Search giống trang SearchResult/AdminUsers */
      .admin-songs__search .ant-input, 
      .admin-songs__search .ant-input-affix-wrapper {
        background-color: #101426 !important; color: #fff !important; border: 1px solid #434760 !important;
      }
      .admin-songs__search .ant-input::placeholder { color: #8ca0c6 !important; }
      .admin-songs__search .ant-btn { border-radius: 8px !important; }
    `;
        document.head.appendChild(style);
        return () => document.head.removeChild(style);
    }, []);

    const abortPrev = () => {
        if (controllerRef.current) controllerRef.current.abort();
        controllerRef.current = new AbortController();
        return controllerRef.current.signal;
    };

    const fetchAdminSongs = useCallback(async ({ page, limit }) => {
        setLoading(true);
        try {
            const signal = abortPrev();
            const token = localStorage.getItem("accessToken");
            const res = await axios.get(`${BASE_API_URL}/api/v1/admin/songs/all`, {
                headers: { Authorization: `Bearer ${token}` },
                params: { page: (page ?? 1) - 1, limit: limit ?? 10 },
                signal
            });
            const data = res.data;
            const content = data?.content ?? data?.data ?? (Array.isArray(data) ? data : []);
            const total = data?.totalElements ?? content.length;

            setSongs(content);
            setPagination(prev => ({ ...prev, current: page ?? prev.current, pageSize: limit ?? prev.pageSize, total }));
            setSearchMode(false);
        } catch (err) {
            if (err.name !== "CanceledError" && err.name !== "AbortError") {
                console.error(err);
                message.error("Unable to load playlist!");
                setSongs([]);
                setPagination(prev => ({ ...prev, total: 0 }));
            }
        } finally {
            setLoading(false);
        }
    }, []);

    // search bằng guest/fullTextSearch (map về shape bảng)
    const fetchSearchSongs = useCallback(async (kw) => {
        setLoading(true);
        try {
            const signal = abortPrev();
            const res = await axios.get(`${BASE_API_URL}/api/v1/guest/fullTextSearch`, {
                params: { keyword: kw },
                signal
            });
            const songList = res?.data?.data?.songList ?? [];
            // map fields cho bảng
            const mapped = songList.map(s => ({
                id: s.id,
                title: s.title,
                artistName: s.artistName,
                albumName: s.albumName,
                profilePicUrl: s.profilePicUrl,
                status: s.status,
            }));
            setSongs(mapped);
            // phân trang client: total = toàn bộ kết quả search
            setPagination(prev => ({ ...prev, current: 1, total: mapped.length }));
            setSearchMode(true);
        } catch (err) {
            if (err.name !== "CanceledError" && err.name !== "AbortError") {
                console.error("Search API error:", err);
                message.error("Failed to fetch search results.");
                setSongs([]);
                setPagination(prev => ({ ...prev, current: 1, total: 0 }));
            }
        } finally {
            setLoading(false);
        }
    }, []);

    // lần đầu / khi đổi trang hoặc pageSize (chỉ gọi admin endpoint khi không search)
    useEffect(() => {
        if ((keyword ?? "").trim().length === 0) {
            fetchAdminSongs({ page: pagination.current, limit: pagination.pageSize });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pagination.current, pagination.pageSize]);

    const debouncedSearch = useMemo(() => debounce((value) => {
        if ((value ?? "").trim().length === 0) {
            // clear keyword -> quay về admin list trang 1
            setPagination(prev => ({ ...prev, current: 1 }));
            fetchAdminSongs({ page: 1, limit: pagination.pageSize });
        } else {
            fetchSearchSongs(value.trim());
        }
    }, 400), [fetchAdminSongs, fetchSearchSongs, pagination.pageSize]);

    useEffect(() => () => debouncedSearch.cancel(), [debouncedSearch]);

    const onChangeSearch = (e) => {
        const v = e.target.value;
        setKeyword(v);
        debouncedSearch(v);
    };

    const onSearchImmediate = (value) => {
        debouncedSearch.flush();
        setKeyword(value);
        if ((value ?? "").trim()) {
            fetchSearchSongs(value.trim());
        } else {
            setPagination(prev => ({ ...prev, current: 1 }));
            fetchAdminSongs({ page: 1, limit: pagination.pageSize });
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
            await axios.delete(`${BASE_API_URL}/api/v1/admin/songs/${deleteId}/delete`, {
                data: { reason: deleteReason },
                headers: { Authorization: `Bearer ${token}` },
            });
            message.success("The song has been removed and the artist has been notified!");

            setDeleteId(null);
            setDeleteReason("");

            // reload theo mode hiện tại
            if (searchMode && (keyword ?? "").trim()) {
                fetchSearchSongs(keyword.trim());
            } else {
                fetchAdminSongs({ page: pagination.current, limit: pagination.pageSize });
            }
        } catch {
            message.error("Delete song failed!");
        }
        setDeleteLoading(false);
    };

    const handleTableChange = (newPagination) => {
        // Search mode: phân trang client -> chỉ đổi current/pageSize, KHÔNG gọi API
        // Admin mode: onChange đã trigger useEffect fetchAdminSongs
        setPagination(prev => ({
            ...prev,
            current: newPagination.current,
            pageSize: newPagination.pageSize,
        }));
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
            title: t('admin_songs.status'),
            align: "center",
            dataIndex: "status",
            key: "status",
            render: (status) => {
                let color = "#3ed8ff";
                let text = status;
                if (status === "APPROVED") { color = "#52c41a"; text = t('admin_songs.status_approved'); }
                else if (status === "REJECTED") { color = "#faad14"; text = t('admin_songs.status_rejected'); }
                else if (status === "DELETED_BY_ADMIN") { color = "#ff4d4f"; text = t('admin_songs.status_deleted_by_admin'); }
                else if (status === "DELETED_BY_ARTIST") { color = "#d46b08"; text = t('admin_songs.status_deleted_by_artist'); }
                return <Tag style={{ backgroundColor: color, color: "#fff", fontWeight: 500 }}>{text}</Tag>;
            }
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
        <div style={{ padding: isTablet ? 8 : 16, maxWidth: 1200, margin: "0 auto" }}>
            {/* Search */}
            <div
                className="admin-songs__search"
                style={{
                    display: "flex",
                    flexDirection: isTablet ? "column" : "row",
                    gap: isTablet ? 8 : 16,
                    marginBottom: 16
                }}
            >
                <Search
                    placeholder={t('admin_songs.search_placeholder', 'Search by name or email')}
                    value={keyword}
                    onChange={onChangeSearch}
                    onSearch={onSearchImmediate}
                    allowClear
                    enterButton
                    size={isTablet ? "middle" : "large"}
                    style={{ width: "100%", borderRadius: 8 }}
                />
            </div>

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
