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
    const isMobile = !screens.md;

    const artistId = localStorage.getItem("userId");
    const token = localStorage.getItem("accessToken");
    const config = { headers: { Authorization: `Bearer ${token}` } };
    const { t } = useTranslation();

    const fetchAlbums = async () => {
        setLoading(true);
        try {
            const res = await axios.get(
                `${BASE_API_URL}/api/v1/artist/album/${artistId}`,
                config
            );
            setAlbums(res.data.data || []);
        } catch {
            setAlbums([]);
        }
        setLoading(false);
    };

    // ===== Copy theme + Select styles từ ArtistAllSongs =====
    useEffect(() => {
        const style = document.createElement("style");
        style.innerHTML = `
        :root {
          --bg-0: #0f1628;
          --bg-1: #101426;
          --bg-2: #181C2B;
          --bg-3: #1f2233;
          --border: #2a3550;
          --border-strong: #3b4a6b;
          --text: #ffffff;
          --text-subtle: #9fb1c6;
          --primary: #3ed8ff;
          --primary-strong: #18bff0;
          --danger: #ff7875;
        }
        .ant-table { background-color: var(--bg-1) !important; color: var(--text) !important; border-radius: 0 !important; }
        .ant-table-thead > tr > th { background-color: var(--bg-2) !important; color: var(--text) !important; border-bottom: 2px solid var(--primary) !important; border-radius: 0 !important; }
        .ant-table-tbody > tr > td { background-color: var(--bg-1) !important; color: var(--text) !important; border-radius: 0 !important; }
        .ant-table-tbody > tr:hover > td { background-color: var(--bg-3) !important; }
        .ant-empty-description { color: var(--text-subtle) !important; }
        .ant-empty-image { filter: invert(0.7); }

        /* Global Input/Select */
        .ant-input, .ant-input-affix-wrapper, .ant-input-textarea, .ant-select-selector {
          background-color: var(--bg-0) !important; color: var(--text) !important; border: 1px solid var(--border) !important;
        }
        .ant-input:hover, .ant-input-affix-wrapper:not(.ant-input-affix-wrapper-disabled):hover,
        .ant-select-selector:hover { border-color: var(--primary) !important; }
        .ant-input:focus, .ant-input-affix-wrapper-focused, .ant-select-focused .ant-select-selector {
          border-color: var(--primary) !important; box-shadow: 0 0 0 2px rgba(62,216,255,0.15) !important;
        }
        .ant-input::placeholder, .ant-input-textarea::placeholder, .ant-select-selection-placeholder { color: var(--text-subtle) !important; }
        .ant-select-arrow { color: var(--text) !important; }
        .ant-select-dropdown { background-color: var(--bg-2) !important; border: 1px solid var(--border) !important; }
        .ant-select-item-option { color: var(--text) !important; }
        .ant-select-item-option-selected:not(.ant-select-item-option-disabled) { background-color: var(--bg-3) !important; color: var(--text) !important; }
        .ant-select .ant-select-selection-item { color: var(--text) !important; }

        /* Modal (className="modal-light") */
        .modal-light .ant-modal-content { background: var(--bg-2) !important; color: var(--text) !important; border: 1px solid var(--border) !important; }
        .modal-light .ant-modal-header { background: var(--bg-1) !important; border-bottom: 1px solid var(--border-strong) !important; }
        .modal-light .ant-modal-title { color: var(--text) !important; }
        .modal-light .ant-btn { border-radius: 8px; }
        .modal-light .ant-input, .modal-light .ant-input-affix-wrapper, .modal-light .ant-input-textarea, .modal-light .ant-select-selector {
          background-color: var(--bg-0) !important; color: var(--text) !important; border: 1px solid var(--border) !important;
        }
        .modal-light .ant-input::placeholder, .modal-light .ant-input-textarea::placeholder, .modal-light .ant-select-selection-placeholder { color: var(--text-subtle) !important; }

        /* Primary Button */
        .ant-btn-primary {
          background: var(--primary) !important; border-color: var(--primary) !important; color: #0b1222 !important; font-weight: 600;
        }
        .ant-btn-primary:hover, .ant-btn-primary:focus {
          background: var(--primary-strong) !important; border-color: var(--primary-strong) !important; color: #0b1222 !important;
        }

        /* Modal.confirm (xóa / confirm) */
        .ant-modal-confirm .ant-select-selector {
          background-color: #0f1628 !important;
          color: #e8f3ff !important;
          border: 1.5px solid var(--primary) !important;
          box-shadow: 0 0 0 2px rgba(62,216,255,0.15) !important;
        }
        .ant-modal-confirm .ant-select-selection-placeholder { color: var(--text-subtle) !important; }
        .ant-modal-confirm .ant-select .ant-select-selection-item { color: #e8f3ff !important; }
        .ant-modal-confirm .ant-modal-title {
          color: #3ed8ff !important;
          font-weight: 600 !important;
        }
        .album-select-dropdown { background: #1c2234 !important; border: 1px solid var(--border) !important; }
        .album-select-dropdown .ant-select-item { color: #e8f3ff !important; }
        .album-select-dropdown .ant-select-item-option-selected { background: #233554 !important; }
        `;
        document.head.appendChild(style);
        return () => document.head.removeChild(style);
    }, []);

    useEffect(() => { fetchAlbums(); }, []);

    const handleFinish = async (values) => {
        if (!values.cover || values.cover.length === 0) {
            message.error(t('please_select_cover_image'));
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
                    `${BASE_API_URL}/api/v1/artist/album/update/${editingId}`,
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
                message.success(t('update_success'));
            } else {
                await axios.post(
                    `${BASE_API_URL}/api/v1/artist/album/add`,
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
                message.success(t('add_success'));
            }
            setModalOpen(false);
            setEditingId(null);
            form.resetFields();
            fetchAlbums();
        } catch {
            message.error(t('operation_failed'));
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
            title: t('delete_confirm'),
            okText: t('delete'),
            okType: "danger",
            cancelText: t('cancel'),
            onOk: async () => {
                try {
                    await axios.delete(
                        `${BASE_API_URL}/api/v1/artist/album/delete/${id}`,
                        config
                    );
                    message.success(t('delete_success'));
                    fetchAlbums();
                } catch {
                    message.error(t('delete_failed'));
                }
            }
        });
    };

    const columns = [
        {
            title: t('index'),
            key: "index",
            align: "center",
            width: isMobile ? 36 : isTablet ? 50 : 50,
            render: (text, record, index) => index + 1,
        },
        {
            title: t('cover'),
            dataIndex: "coverImageUrl",
            key: "coverImageUrl",
            render: url => url && <Image src={url} width={isMobile ? 28 : isTablet ? 40 : 60} height={isMobile ? 28 : isTablet ? 40 : 60} style={{ objectFit: "cover", borderRadius: 8 }} />,
            width: isMobile ? 36 : isTablet ? 50 : 80,
            align: "center",
        },
        {
            title: t('album_name'),
            align: "center",
            dataIndex: "titleAlbum",
            key: "titleAlbum",
            width: isMobile ? 70 : isTablet ? 120 : 180,
            ellipsis: isTablet || isMobile,
        },
        {
            title: t('release_date'),
            align: "center",
            dataIndex: "releaseDateStr",
            key: "releaseDateStr",
            width: isMobile ? 60 : isTablet ? 110 : 160,
            ellipsis: isTablet || isMobile,
        },
        {
            title: t('type'),
            align: "center",
            dataIndex: "type",
            key: "type",
            width: isMobile ? 40 : isTablet ? 70 : 100,
            ellipsis: isTablet || isMobile,
        },
        !isTablet && !isMobile && {
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
        (isTablet || isMobile) && {
            title: '',
            key: 'action',
            render: (_, album) => (
                <Space>
                    <Button icon={<EditOutlined />} size="small" onClick={() => handleEdit(album)} />
                    <Button icon={<DeleteOutlined />} size="small" danger onClick={() => handleDelete(album.id)} />
                </Space>
            ),
            width: isMobile ? 48 : 80,
            align: "center",
        }
    ].filter(Boolean);

    return (
        <div className="artist-albums" style={{ padding: isMobile ? 4 : isTablet ? 8 : 24 }}>
            <style>
                {`
                    .artist-albums .ant-btn-primary {
                        background: var(--primary) !important;
                        border-color: var(--primary) !important;
                        color: #0b1222 !important;
                        font-weight: 600;
                    }
                    .artist-albums .ant-btn-primary:hover,
                    .artist-albums .ant-btn-primary:focus {
                        background: var(--primary-strong) !important;
                        border-color: var(--primary-strong) !important;
                        color: #0b1222 !important;
                    }
                    .ant-form-item-label > label {
                        color: #3ed8ff !important;
                        font-weight: 600;
                        letter-spacing: 0.5px;
                    }
                    .ant-modal-close {
                        color: #3ed8ff !important;
                        transition: color 0.2s;
                    }
                    .ant-modal-close:hover, .ant-modal-close:focus {
                        color: #18bff0 !important;
                    }
                    .ant-modal .ant-select-selector {
                        background-color: #0f1628 !important;
                        color: #fff !important;
                        border: 1.5px solid #3ed8ff !important;
                        box-shadow: 0 0 0 2px rgba(62,216,255,0.15) !important;
                    }
                    .ant-modal .ant-select-selection-placeholder {
                        color: #9fb1c6 !important;
                    }
                    .ant-modal .ant-select-arrow {
                        color: #3ed8ff !important;
                    }
                    .ant-modal-confirm .ant-modal-content {
                        background: #181d36 !important;
                        color: #fff !important;
                    }
                    .ant-modal-confirm .ant-modal-header {
                        background: #101426 !important;
                        border-bottom: 1px solid #3ed8ff !important;
                    }
                    .ant-modal-confirm .ant-modal-title {
                        color: #3ed8ff !important;
                        font-weight: 600 !important;
                    }
                `}
            </style>

            <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => { setEditingId(null); form.resetFields(); setModalOpen(true); }}
                size={isMobile ? "small" : isTablet ? "middle" : "large"}
                style={{ marginBottom: 16, width: isMobile ? "100%" : undefined }}
            >
                {t('add_album')}
            </Button>

            <div style={{ width: "100%", overflowX: isMobile ? "auto" : isTablet ? "auto" : "visible" }}>
                <Table
                    columns={columns}
                    dataSource={albums}
                    rowKey="id"
                    loading={loading}
                    pagination={false}
                    size={isMobile ? "small" : isTablet ? "small" : "middle"}
                    scroll={isMobile ? { x: 480 } : isTablet ? { x: 400 } : undefined}
                    style={{ background: "#181d36", minWidth: isMobile ? 480 : isTablet ? 400 : undefined }}
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
                centered
                width={isMobile ? 320 : isTablet ? 400 : 600}
                style={{ top: isMobile ? 10 : undefined }}
                styles={{ body: { padding: isMobile ? 12 : isTablet ? 18 : 24 } }}
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
                            alt={t('old_cover')}
                        />
                    )}

                    <Form.Item
                        label={t('album_name')}
                        name="titleAlbum"
                        rules={[{ required: true, message: t('please_enter_album_name') }]}
                    >
                        <Input placeholder={t('album_name_placeholder')} />
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
                        rules={[
                            { required: true, message: t('please_select_release_date') },
                            {
                                validator: (_, value) => {
                                    if (!value) return Promise.resolve();
                                    const inputDate = new Date(value);
                                    const now = new Date();
                                    if (inputDate < now) {
                                        return Promise.reject(t('release_date_future_only'));
                                    }
                                    if (inputDate.getFullYear() < 1900) {
                                        return Promise.reject(t('release_date_too_old'));
                                    }
                                    return Promise.resolve();
                                }
                            }
                        ]}
                    >
                        <Input type="datetime-local" placeholder={t('release_date_placeholder')} />
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
                            popupClassName="album-select-dropdown"
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

