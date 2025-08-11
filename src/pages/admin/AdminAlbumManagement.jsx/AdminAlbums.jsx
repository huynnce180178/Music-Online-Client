import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Table, Image, message, Button, Space, Grid, Modal, Input, Tag, Empty } from "antd";
import { DeleteOutlined, SearchOutlined } from "@ant-design/icons";
import axios from "axios";
import debounce from "lodash.debounce";
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import BASE_API_URL from "../../../services/base.api.url";

const { useBreakpoint } = Grid;
const { Search } = Input;

export default function AdminAlbums() {
    const { t } = useTranslation();
    const [albums, setAlbums] = useState([]);
    const [loading, setLoading] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [deleteReason, setDeleteReason] = useState("");
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [keyword, setKeyword] = useState("");
    const [searchMode, setSearchMode] = useState(false); // true: đang dùng fullTextSearch

    const controllerRef = useRef(null);
    const screens = useBreakpoint();
    const isTablet = !screens.lg;
    const navigate = useNavigate();

    const abortPrev = () => {
        if (controllerRef.current) controllerRef.current.abort();
        controllerRef.current = new AbortController();
        return controllerRef.current.signal;
    };

    const fetchAdminAlbums = useCallback(async () => {
        setLoading(true);
        try {
            const signal = abortPrev();
            const token = localStorage.getItem("accessToken");
            const res = await axios.get(`${BASE_API_URL}/api/v1/admin/albums/all`, {
                headers: { Authorization: `Bearer ${token}` },
                signal
            });
            // BE có thể trả mảng thẳng hoặc {data: [...]}
            const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
            setAlbums(list);
            setSearchMode(false);
        } catch {
            setAlbums([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchSearchAlbums = useCallback(async (kw) => {
        setLoading(true);
        try {
            const signal = abortPrev();
            const res = await axios.get(`${BASE_API_URL}/api/v1/guest/fullTextSearch`, {
                params: { keyword: kw },
                signal
            });
            const albumList = res?.data?.data?.albumList ?? [];
            // map về shape bảng đang dùng
            const mapped = albumList.map(a => ({
                id: a.id,
                titleAlbum: a.titleAlbum,
                releaseDateStr: a.releaseDateStr,
                coverImageUrl: a.coverImageUrl,
                type: a.type,
                status: a.status,
                artistId: a.artistId,
            }));
            setAlbums(mapped);
            setSearchMode(true);
        } catch (e) {
            console.error(e);
            message.error("Failed to search albums!");
            setAlbums([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAdminAlbums();
        return () => { if (controllerRef.current) controllerRef.current.abort(); };
    }, [fetchAdminAlbums]);

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

      /* Search input dark */
      .admin-albums__search .ant-input,
      .admin-albums__search .ant-input-affix-wrapper {
        background-color: #101426 !important; color: #fff !important; border: 1px solid #434760 !important;
      }
      .admin-albums__search .ant-input::placeholder { color: #8ca0c6 !important; }
      .admin-albums__search .ant-btn { border-radius: 8px !important; }
    `;
        document.head.appendChild(style);
        return () => document.head.removeChild(style);
    }, []);

    // debounce search
    const debouncedSearch = useMemo(() => debounce((v) => {
        const value = (v ?? "").trim();
        if (value) fetchSearchAlbums(value);
        else fetchAdminAlbums();
    }, 400), [fetchAdminAlbums, fetchSearchAlbums]);

    useEffect(() => () => debouncedSearch.cancel(), [debouncedSearch]);

    const onChangeSearch = (e) => {
        const v = e.target.value;
        setKeyword(v);
        debouncedSearch(v);
    };

    const onSearchImmediate = (value) => {
        debouncedSearch.flush();
        setKeyword(value);
        const v = (value ?? "").trim();
        if (v) fetchSearchAlbums(v);
        else fetchAdminAlbums();
    };

    const showDeleteModal = (id) => { setDeleteId(id); setDeleteReason(""); };

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
            // refresh theo mode hiện tại
            if (searchMode && (keyword ?? "").trim()) fetchSearchAlbums(keyword.trim());
            else fetchAdminAlbums();
        } catch {
            message.error("Failed to delete album!");
        }
        setDeleteLoading(false);
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
            key: "action",
            align: "center",
            render: (_, record) => (
                <Space>
                    <Button
                        danger
                        icon={<DeleteOutlined />}
                        size={isTablet ? "small" : "middle"}
                        onClick={() => showDeleteModal(record.id)}
                        aria-label={t('admin_albums.delete')}
                    />
                </Space>
            ),
        },
    ];

    return (
        <div style={{ padding: isTablet ? 8 : 16 }}>
            {/* Search by titleAlbum */}
            <div
                className="admin-albums__search"
                style={{
                    display: "flex",
                    flexDirection: isTablet ? "column" : "row",
                    gap: isTablet ? 8 : 16,
                    marginBottom: 16
                }}
            >
                <Search
                    placeholder={t('admin_albums.search_placeholder')}
                    value={keyword}
                    onChange={onChangeSearch}
                    onSearch={onSearchImmediate}
                    allowClear
                    enterButton={<SearchOutlined />}  // chỉ icon, tránh label lồng nhau
                    size={isTablet ? "middle" : "large"}
                    style={{ width: "100%", borderRadius: 8 }}
                />
            </div>

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
        </div>
    );
}
