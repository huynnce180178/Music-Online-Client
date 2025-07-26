import { useEffect, useState, useMemo } from "react";
import debounce from "lodash.debounce";
import { Table, Button, Input, Modal, Form, message, Popconfirm, Space, Upload, Image, Grid, Empty } from "antd";
import { EditOutlined, DeleteOutlined, UploadOutlined } from "@ant-design/icons";
import axios from "axios";
import { useTranslation } from 'react-i18next';
import BASE_API_URL from "../../services/base.api.url";

const { Search } = Input;
const { useBreakpoint } = Grid;

export default function AdminGenres() {
    const { t } = useTranslation();
    const [genres, setGenres] = useState([]);
    const [pagination, setPagination] = useState({ current: 1, pageSize: 5, total: 0 });
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [sorter, setSorter] = useState({ field: "id", order: "ascend" });
    const [modalVisible, setModalVisible] = useState(false);
    const [editingGenre, setEditingGenre] = useState(null);
    const [form] = Form.useForm();

    const token = localStorage.getItem("accessToken");
    const isTablet = !useBreakpoint().lg;

    useEffect(() => {
        fetchGenres();
    }, [pagination.current, pagination.pageSize, sorter, search]);

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
        .ant-empty-description {
            color: #999 !important;
        }
        .ant-empty-image {
            filter: invert(0.7);
        }

        /* SEARCH FIELD dark mode */
        .ant-input-affix-wrapper {
            background-color: #101426 !important;
            color: #fff !important;
            border: 1px solid #434760 !important;
        }
        .ant-input-affix-wrapper .ant-input {
            background-color: transparent !important;
            color: #fff !important;
        }
        .ant-input-affix-wrapper .ant-input-suffix {
            color: #fff !important;
        }
        .ant-input::placeholder {
            color: #888 !important;
        }

        /* NOTE: KHÔNG override modal (.ant-modal-content, .ant-input, .ant-upload) để giữ trắng mặc định */
    `;
        document.head.appendChild(style);
        return () => document.head.removeChild(style);
    }, []);

    const fetchGenres = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${BASE_API_URL}/api/v1/genres`, {
                params: {
                    page: pagination.current - 1,
                    size: pagination.pageSize,
                    sortBy: sorter.field,
                    sortDir: sorter.order === "descend" ? "desc" : "asc",
                    search: search || undefined,
                },
                headers: { Authorization: `Bearer ${token}` }
            });
            setGenres(res.data.data || []);
            setPagination(prev => ({
                ...prev,
                total: res.data.totalElements || (res.data.data ? res.data.data.length : 0)
            }));
        } catch {
            message.error("Failed to load genres list!");
        }
        setLoading(false);
    };

    const handleTableChange = (pagination, _, sorterObj) => {
        setPagination(prev => ({ ...prev, current: pagination.current, pageSize: pagination.pageSize }));
        setSorter({ field: sorterObj.field || "id", order: sorterObj.order || "ascend" });
    };

    const debouncedSearch = useMemo(() =>
        debounce((value) => {
            setSearch(value);
            setPagination(prev => ({ ...prev, current: 1 }));
        }, 400), []);

    const handleInputChange = (e) => {
        debouncedSearch(e.target.value);
    };

    const handleSearch = (value) => {
        setSearch(value);
        setPagination(prev => ({ ...prev, current: 1 }));
    };

    const openModal = (genre = null) => {
        setEditingGenre(genre);
        setModalVisible(true);
        if (genre) {
            form.setFieldsValue({ genreName: genre.genreName, genreImage: [] });
        } else {
            form.resetFields();
        }
    };

    const handleModalOk = async () => {
        setLoading(true);
        try {
            const values = await form.validateFields();
            const formData = new FormData();
            formData.append("genreName", values.genreName);

            // Nếu có ảnh mới thì gửi lên, nếu không thì giữ ảnh cũ (không append genreImage)
            if (values.genreImage && values.genreImage[0] && values.genreImage[0].originFileObj) {
                formData.append("genreImage", values.genreImage[0].originFileObj);
            }

            if (editingGenre) {
                await axios.put(`${BASE_API_URL}/api/v1/admin/genre/update/${editingGenre.id}`, formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                message.success("Genre updated successfully!");
            } else {
                await axios.post(`${BASE_API_URL}/api/v1/admin/genres/add`, formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                message.success("Genre added successfully!");
            }
            setModalVisible(false);
            fetchGenres();
        } catch (err) {
            if (err.response && err.response.data && err.response.data.message) {
                message.error(err.response.data.message);
            } else {
                message.error("An error occurred!");
            }
        }
        setLoading(false);
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`${BASE_API_URL}/api/v1/admin/genre/delete/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            message.success("Genre deleted successfully!");
            fetchGenres();
        } catch (err) {
            if (err.response && err.response.data && err.response.data.message) {
                message.error(err.response.data.message);
            } else {
                message.error("Failed to delete genre!");
            }
        }
    };

    const columns = [
        {
            title: "#",
            key: "index",
            align: "center",
            render: (_, __, index) => (pagination.current - 1) * pagination.pageSize + index + 1,
            width: 50,
        },
        {
            title: t('admin_genres.genre_name'),
            dataIndex: "genreName",
            key: "genreName",
            align: "center",
            sorter: true,
            ellipsis: true,
        },
        {
            title: t('admin_genres.image'),
            dataIndex: "genreImage",
            key: "genreImage",
            align: "center",
            render: (url) =>
                url ? (
                    <Image
                        src={url}
                        width={isTablet ? 48 : 80}
                        height={isTablet ? 32 : 50}
                        style={{ objectFit: "cover", borderRadius: 8, boxShadow: "0 0 6px rgba(0,0,0,0.5)" }}
                        preview={false}
                        alt={t('admin_genres.genre_name')}
                    />
                ) : "-",
        },
        {
            title: t('admin_genres.actions'),
            key: "action",
            align: "center",
            render: (_, record) => (
                <Space>
                    <Button type="link" icon={<EditOutlined />} onClick={() => openModal(record)} aria-label={t('admin_genres.edit')} />
                    <Popconfirm
                        title={t('admin_genres.delete_confirm')}
                        onConfirm={() => handleDelete(record.id)}
                        okText={t('admin_genres.delete')}
                        cancelText={t('admin_genres.cancel')}
                    >
                        <Button type="link" danger icon={<DeleteOutlined />} aria-label={t('admin_genres.delete')} />
                    </Popconfirm>
                </Space>
            ),
        }
    ];

    return (
        <div style={{ padding: isTablet ? 8 : 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <Search
                    placeholder={t('admin_genres.search_placeholder')}
                    onSearch={handleSearch}
                    onChange={handleInputChange}
                    value={search}
                    allowClear
                    style={{ width: isTablet ? "100%" : 240, minWidth: 120 }}
                    size={isTablet ? "middle" : "large"}
                />
                <Button
                    type="primary"
                    onClick={() => openModal(null)}
                    style={{ borderRadius: 8, fontWeight: 600 }}
                >
                    {t('admin_genres.add_genre') || "Add Genre"}
                </Button>
            </div>
            <Table
                columns={columns}
                dataSource={genres}
                pagination={{
                    current: pagination.current,
                    pageSize: pagination.pageSize,
                    total: pagination.total,
                    showSizeChanger: true,
                }}
                loading={loading}
                onChange={handleTableChange}
                rowKey="id"
                size={isTablet ? "small" : "middle"}
                scroll={isTablet ? { x: 400 } : undefined}
                locale={{
                    emptyText: <Empty description={t('admin_genres.no_genres')} imageStyle={{ filter: "invert(0.7)" }} />,
                }}
            />
            <Modal
                title={editingGenre ? t('admin_genres.update_genre') : t('admin_genres.add_genre')}
                open={modalVisible}
                onOk={handleModalOk}
                onCancel={() => setModalVisible(false)}
                okText={t('admin_genres.save')}
                cancelText={t('admin_genres.cancel')}
                confirmLoading={loading}
            >
                <Form form={form} layout="vertical">
                    {editingGenre?.genreImage && (
                        <Image src={editingGenre.genreImage} width={100} style={{ marginBottom: 8 }} alt={t('admin_genres.old_cover')} />
                    )}
                    <Form.Item name="genreName" label={t('admin_genres.genre_name')} rules={[{ required: true, message: t('admin_genres.genre_name_required') }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="genreImage"
                        label={t('admin_genres.image')}
                        valuePropName="fileList"
                        getValueFromEvent={(e) => Array.isArray(e) ? e : e?.fileList}
                        rules={editingGenre ? [] : [{ required: true, message: t('admin_genres.image_required') }]}
                    >
                        <Upload beforeUpload={() => false} maxCount={1} accept="image/*" listType="picture">
                            <Button icon={<UploadOutlined />}>{t('admin_genres.select_image')}</Button>
                        </Upload>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
