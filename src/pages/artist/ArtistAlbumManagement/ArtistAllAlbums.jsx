import { useEffect, useState } from "react";
import { Table, Form, Input, Button, Upload, message, Modal, Space, Image, Select, Grid } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined } from "@ant-design/icons";
import axios from "axios";
import { useTranslation } from 'react-i18next';
import BASE_API_URL from "../../../services/base.api.url";

const { useBreakpoint } = Grid;

export default function ArtistAllAlbums() {
    const [albums, setAlbums] = useState([]);
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();
    const [editingId, setEditingId] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const screens = useBreakpoint();
    const isTablet = !screens.lg;
    const artistId = localStorage.getItem("userId");
    const token = localStorage.getItem("accessToken");
    const config = { headers: { Authorization: `Bearer ${token}` } };
    const { t } = useTranslation();

    const fetchAlbums = async () => {
        setLoading(true);
        try {
            const res = await axios.get(
                `${BASE_API_URL}/artist/album/${artistId}`,
                config
            );
            setAlbums(res.data.data || []);
        } catch {
            setAlbums([]);
        }
        setLoading(false);
    };
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
    useEffect(() => { fetchAlbums(); }, []);

    const handleFinish = async (values) => {
        if (!values.cover || values.cover.length === 0) {
            message.error("Please select a cover image!");
            return;
        }
        setLoading(true);
        const formData = new FormData();
        formData.append("titleAlbum", values.titleAlbum);
        formData.append("artistId", artistId);
        const releaseDate = values.releaseDate;
        const formattedDate = releaseDate.length === 16 ? releaseDate + ":00" : releaseDate;
        formData.append("releaseDate", formattedDate);
        formData.append("type", values.type);
        formData.append("coverImageUrl", values.cover[0].originFileObj);
        try {
            if (editingId) {
                await axios.put(
                    `${BASE_API_URL}/artist/album/update/${editingId}`,
                    formData,
                    {
                        ...config,
                        headers: {
                            ...config.headers,
                            "Content-Type": "multipart/form-data"
                        },
                        onUploadProgress: () => setLoading(true),
                    }
                );
                message.success("Album updated successfully!");
            } else {
                await axios.post(
                    `${BASE_API_URL}/artist/album/add`,
                    formData,
                    {
                        ...config,
                        headers: {
                            ...config.headers,
                            "Content-Type": "multipart/form-data"
                        },
                        onUploadProgress: () => setLoading(true),
                    }
                );
                message.success("Album added successfully!");
            }
            setModalOpen(false);
            setEditingId(null);
            form.resetFields();
            fetchAlbums();
        } catch {
            message.error("Album operation failed!");
        }
        setLoading(false);
    };

    const handleEdit = (album) => {
        setEditingId(album.id);
        form.setFieldsValue({
            titleAlbum: album.titleAlbum,
            cover: [],
            releaseDate: album.releaseDateStr ? album.releaseDateStr.replace(" ", "T") : "",
            type: album.type,
        });
        setModalOpen(true);
    };

    const handleDelete = async (id) => {
        Modal.confirm({
            title: "Are you sure you want to delete this album?",
            okText: "Delete",
            okType: "danger",
            cancelText: "Cancel",
            onOk: async () => {
                try {
                    await axios.delete(
                        `${BASE_API_URL}/artist/album/delete/${id}`,
                        config
                    );
                    message.success("Album deleted!");
                    fetchAlbums();
                } catch {
                    message.error("Cannot delete album!");
                }
            }
        });
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
            title: t('cover'),
            dataIndex: "coverImageUrl",
            key: "coverImageUrl",
            render: url => url && <Image src={url} width={isTablet ? 40 : 60} height={isTablet ? 40 : 60} style={{ objectFit: "cover", borderRadius: 8 }} />,
            width: isTablet ? 50 : 80,
            align: "center",
        },
        !isTablet && {
            title: t('actions'),
            align: "center",
            key: "action",
            render: (_, album) => (
                <Space>
                    <Button icon={<EditOutlined />} onClick={() => handleEdit(album)} />
                    <Button icon={<DeleteOutlined />} danger onClick={() => handleDelete(album.id)} />
                </Space>
            ),
            width: 140,
        },
        isTablet && {
            title: '',
            key: 'action',
            render: (_, album) => (
                <Space>
                    <Button icon={<EditOutlined />} size="small" onClick={() => handleEdit(album)} />
                    <Button icon={<DeleteOutlined />} size="small" danger onClick={() => handleDelete(album.id)} />
                </Space>
            ),
            width: 80,
            align: "center",
        }
    ].filter(Boolean);

    return (
        <div style={{ padding: isTablet ? 8 : 24 }}>
            <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => { setEditingId(null); form.resetFields(); setModalOpen(true); }}
                size={isTablet ? "middle" : "large"}
                style={{ marginBottom: 16 }}
            >
                {t('add_album')}
            </Button>
            <div style={{ width: "100%", overflowX: isTablet ? "auto" : "visible" }}>
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
            <Modal
                className="modal-light"
                open={modalOpen}
                title={editingId ? t('update_album') : t('add_new_album')}
                onCancel={() => { setModalOpen(false); setEditingId(null); }}
                footer={null}
                destroyOnHidden
                confirmLoading={loading}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleFinish}
                    disabled={loading}
                >
                    {editingId && albums.find(a => a.id === editingId)?.coverImageUrl && (
                        <Image
                            src={albums.find(a => a.id === editingId).coverImageUrl}
                            width={100}
                            style={{ marginBottom: 8 }}
                            alt="Old cover"
                        />
                    )}
                    <Form.Item
                        label={t('album_name')}
                        name="titleAlbum"
                        rules={[{ required: true, message: t('please_enter_album_name') }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        label={t('cover_image')}
                        name="cover"
                        valuePropName="fileList"
                        getValueFromEvent={e => Array.isArray(e) ? e : e && e.fileList}
                        rules={[{ required: true, message: t('please_select_cover_image') }]}
                    >
                        <Upload
                            beforeUpload={() => false}
                            maxCount={1}
                            accept="image/*"
                            listType="picture"
                        >
                            <Button icon={<UploadOutlined />}>{t('choose_image')}</Button>
                        </Upload>
                    </Form.Item>
                    <Form.Item
                        label={t('release_date')}
                        name="releaseDate"
                        rules={[{ required: true, message: t('please_select_release_date') }]}
                    >
                        <Input type="datetime-local" />
                    </Form.Item>
                    <Form.Item
                        label={t('type')}
                        name="type"
                        rules={[{ required: true, message: t('please_select_album_type') }]}
                    >
                        <Select
                            options={[
                                { value: "FREE", label: t('free') },
                                { value: "PREMIUM", label: t('premium') }
                            ]}
                            placeholder={t('select_album_type')}
                        />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" block loading={loading}>
                            {editingId ? t('update') : t('add')}
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
} 