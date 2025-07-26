import { useEffect, useState } from "react";
import { Table, Image, message, Popconfirm, Button, Space, Modal, Form, Input, Upload, Grid } from "antd";
import { UploadOutlined, EditOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import axios from "axios";
import { useTranslation } from 'react-i18next';
import BASE_API_URL from "../../services/base.api.url";

const { useBreakpoint } = Grid;

export default function AdminBanners() {
    const { t } = useTranslation();
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
    const [modalVisible, setModalVisible] = useState(false);
    const [editingBanner, setEditingBanner] = useState(null);
    const [form] = Form.useForm();

    const screens = useBreakpoint();
    const isTablet = !screens.lg; // < 992px là tablet/mobile

    useEffect(() => {
        fetchBanners();
        // eslint-disable-next-line
    }, [pagination.current, pagination.pageSize]);

    useEffect(() => {
        const style = document.createElement("style");
        style.innerHTML = `
        /* Dark mode chỉ áp dụng cho table */
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

        /* Select trong table */
        .ant-table .ant-select-selector {
            background-color: #181C2B !important;
            color: #fff !important;
            border: 1px solid #434760 !important;
        }
        .ant-table .ant-select-arrow {
            color: #fff !important;
        }

        /* Modal và form input GIỮ MẶC ĐỊNH, không override */
    `;
        document.head.appendChild(style);
        return () => {
            document.head.removeChild(style);
        };
    }, []);

    const fetchBanners = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("accessToken");
            const res = await axios.get(`${BASE_API_URL}/api/v1/admin/banner`, {
                params: {
                    page: pagination.current - 1,
                    limit: pagination.pageSize,
                    sortBy: "id",
                    orderBy: "asc",
                },
                headers: { Authorization: `Bearer ${token}` }
            });
            setBanners(res.data.content || []);
            setPagination(prev => ({
                ...prev,
                total: res.data.totalElements || 0,
            }));
        } catch {
            message.error("Failed to load banner list!");
        }
        setLoading(false);
    };

    const handleDelete = async (id) => {
        try {
            const token = localStorage.getItem("accessToken");
            await axios.delete(`${BASE_API_URL}/api/v1/admin/banner/delete/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            message.success("Banner deleted successfully!");
            fetchBanners();
        } catch {
            message.error("Failed to delete banner!");
        }
    };

    const openEditModal = (banner) => {
        setEditingBanner(banner);
        setModalVisible(true);
        form.setFieldsValue({
            position: banner.position,
            image: [],
        });
    };

    const handleSaveBanner = async () => {
        setLoading(true); // Bắt đầu loading
        try {
            const values = await form.validateFields();
            const formData = new FormData();
            formData.append("position", values.position);
            if (values.image && values.image[0]) {
                formData.append("file", values.image[0].originFileObj);
            }
            const token = localStorage.getItem("accessToken");
            if (editingBanner) {
                // Update
                await axios.post(
                    `${BASE_API_URL}/api/v1/admin/banner/update/${editingBanner.id}`,
                    formData,
                    {
                        headers: {
                            "Content-Type": "multipart/form-data",
                            Authorization: `Bearer ${token}`,
                        },
                        onUploadProgress: () => setLoading(true),
                    }
                );
                message.success("Banner updated successfully!");
            } else {
                // Add new
                await axios.post(
                    `${BASE_API_URL}/api/v1/admin/banner/add`,
                    formData,
                    {
                        headers: {
                            "Content-Type": "multipart/form-data",
                            Authorization: `Bearer ${token}`,
                        },
                        onUploadProgress: () => setLoading(true),
                    }
                );
                message.success("Banner added successfully!");
            }
            setModalVisible(false);
            setEditingBanner(null);
            form.resetFields();
            fetchBanners();
        } catch (err) {
            message.error(editingBanner ? "Failed to update banner!" : "Failed to add banner!");
        }
        setLoading(false); // Kết thúc loading
    };

    const columns = [
        {
            title: t('admin_banners.position'),
            dataIndex: "position",
            key: "position",
            align: "center",
            width: isTablet ? 60 : 100,
            ellipsis: isTablet,
        },
        {
            title: t('admin_banners.banner_image'),
            dataIndex: "profilePicUrl",
            key: "file",
            render: (url) =>
                url ? (
                    <Image
                        src={url}
                        width={isTablet ? 90 : 150}
                        height={isTablet ? 48 : 80}
                        style={{ objectFit: "cover", borderRadius: 8 }}
                        preview={{ mask: <div style={{ color: "#fff", fontWeight: 600 }}>{t('admin_banners.preview')}</div> }}
                        alt={t('admin_banners.banner_image')}
                    />
                ) : null,
            width: isTablet ? 100 : 180,
            align: "center",
        },
        !isTablet && {
            title: t('admin_banners.actions'),
            key: "action",
            render: (_, record) => (
                <Space>
                    <Button type="link" icon={<EditOutlined />} onClick={() => openEditModal(record)} title={t('admin_banners.edit')} size="large" aria-label={t('admin_banners.edit')} />
                    <Popconfirm
                        title={t('admin_banners.delete_confirm')}
                        onConfirm={() => handleDelete(record.id)}
                        okText={t('admin_banners.delete')}
                        cancelText={t('admin_banners.cancel')}
                    >
                        <Button type="link" danger icon={<DeleteOutlined />} title={t('admin_banners.delete')} size="large" aria-label={t('admin_banners.delete')} />
                    </Popconfirm>
                </Space>
            ),
            width: 80,
            align: "center",
        },
        isTablet && {
            title: "",
            key: "action",
            render: (_, record) => (
                <Space>
                    <Button
                        type="link"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => openEditModal(record)}
                        title={t('admin_banners.edit')}
                        aria-label={t('admin_banners.edit')}
                        style={{ padding: 0 }}
                    />
                    <Popconfirm
                        title={t('admin_banners.delete_confirm')}
                        onConfirm={() => handleDelete(record.id)}
                        okText={t('admin_banners.delete')}
                        cancelText={t('admin_banners.cancel')}
                    >
                        <Button
                            type="link"
                            danger
                            size="small"
                            style={{ padding: 0 }}
                            icon={<DeleteOutlined />}
                            title={t('admin_banners.delete')}
                            aria-label={t('admin_banners.delete')}
                        />
                    </Popconfirm>
                </Space>
            ),
            width: 60,
            align: "center",
        }
    ].filter(Boolean);

    const handleTableChange = (pagination) => {
        setPagination(prev => ({
            ...prev,
            current: pagination.current,
            pageSize: pagination.pageSize,
        }));
    };

    return (
        <div style={{ padding: isTablet ? 8 : 24 }}>
            <Button
                type="primary"
                icon={<PlusOutlined />}
                style={{ marginBottom: 16 }}
                onClick={() => setModalVisible(true)}
                loading={loading}
            >
                {t('admin_banners.add_banner')}
            </Button>
            <div style={{ width: "100%", overflowX: isTablet ? "auto" : "visible" }}>
                <Table
                    columns={columns}
                    dataSource={banners}
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
                />
            </div>
            <Modal
                title={editingBanner ? t('admin_banners.update_banner') : t('admin_banners.add_new_banner')}
                open={modalVisible}
                onOk={handleSaveBanner}
                onCancel={() => {
                    setModalVisible(false);
                    setEditingBanner(null);
                    form.resetFields();
                }}
                okText={editingBanner ? t('admin_banners.update') : t('admin_banners.save')}
                cancelText={t('admin_banners.cancel')}
                destroyOnClose
                confirmLoading={loading}
            >
                <Form form={form} layout="vertical" disabled={loading}>
                    <Form.Item
                        name="position"
                        label={t('admin_banners.position')}
                        rules={[{ required: true, message: t('admin_banners.position_required') }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="image"
                        label={t('admin_banners.banner_image')}
                        valuePropName="fileList"
                        getValueFromEvent={e => Array.isArray(e) ? e : e && e.fileList}
                        rules={[
                            {
                                required: !editingBanner,
                                message: t('admin_banners.image_required'),
                            },
                        ]}
                    >
                        <Upload
                            beforeUpload={() => false}
                            maxCount={1}
                            accept="image/*"
                            listType="picture"
                        >
                            <Button icon={<UploadOutlined />}>{t('admin_banners.select_image')}</Button>
                        </Upload>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}