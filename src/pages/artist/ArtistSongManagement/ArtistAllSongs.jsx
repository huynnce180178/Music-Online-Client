import { useEffect, useState } from "react";
import { Table, Button, Space, Image, message, Modal, Select, Form, Input, Upload, Grid } from "antd";
import { DeleteOutlined, PlusOutlined, UploadOutlined, EyeOutlined, EditOutlined, MinusCircleOutlined } from "@ant-design/icons";
import axios from "axios";
import { useTranslation } from 'react-i18next';
import BASE_API_URL from "../../../services/base.api.url";
import React from "react";

const { useBreakpoint } = Grid;

export default function ArtistAllSongs() {
    const [songs, setSongs] = useState([]);
    const [albums, setAlbums] = useState([]);
    const [genres, setGenres] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedAlbum] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingSong, setEditingSong] = useState(null);
    const [form] = Form.useForm();

    const screens = useBreakpoint();
    const isTablet = !screens.lg;
    const isMobile = !screens.md;

    const token = localStorage.getItem("accessToken");
    const config = { headers: { Authorization: `Bearer ${token}` } };

    const { t } = useTranslation();

    const fetchAlbums = async () => {
        try {
            const artistId = localStorage.getItem("userId");
            const res = await axios.get(`${BASE_API_URL}/api/v1/artist/album/${artistId}`, config);
            setAlbums(res.data.data || []);
        } catch {
            setAlbums([]);
        }
    };

    const fetchSongs = async (albumId) => {
        setLoading(true);
        try {
            let res;
            if (albumId) {
                res = await axios.get(
                    `${BASE_API_URL}/api/v1/artist/song/album/${albumId}`,
                    config
                );
            } else {
                res = await axios.get(
                    `${BASE_API_URL}/api/v1/artist/song/my`,
                    config
                );
            }
            setSongs(res.data.data || []);
        } catch {
            setSongs([]);
            message.error(t('failed_to_load_songs_list'));
        }
        setLoading(false);
    };

    const fetchGenres = async () => {
        try {
            const res = await axios.get(`${BASE_API_URL}/api/v1/genres?size=1000`, config);
            setGenres(Array.isArray(res.data.data) ? res.data.data : []);
        } catch {
            setGenres([]);
        }
    };

    useEffect(() => {
        fetchAlbums();
        fetchSongs();
        fetchGenres();
    }, []);

    // === Theme tweaks (dark, rõ ràng hơn) ===
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

        /* ===== Global Select colors ===== */
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
        /* quan trọng: màu chữ của giá trị đã chọn trong ô Select */
        .ant-select .ant-select-selection-item { color: var(--text) !important; }

        .modal-light .ant-modal-content { background: var(--bg-2) !important; color: var(--text) !important; border: 1px solid var(--border) !important; }
        .modal-light .ant-modal-header { background: var(--bg-1) !important; border-bottom: 1px solid var(--border-strong) !important; }
        .modal-light .ant-modal-title { color: var(--text) !important; }
        .modal-light .ant-btn { border-radius: 8px; }
        .modal-light .ant-input, .modal-light .ant-input-affix-wrapper, .modal-light .ant-input-textarea, .modal-light .ant-select-selector {
          background-color: var(--bg-0) !important; color: var(--text) !important; border: 1px solid var(--border) !important;
        }
        .modal-light .ant-input::placeholder, .modal-light .ant-input-textarea::placeholder, .modal-light .ant-select-selection-placeholder { color: var(--text-subtle) !important; }

        /* Primary button màu sáng hơn + hover */
        .ant-btn-primary {
          background: var(--primary) !important; border-color: var(--primary) !important; color: #0b1222 !important; font-weight: 600;
        }
        .ant-btn-primary:hover, .ant-btn-primary:focus {
          background: var(--primary-strong) !important; border-color: var(--primary-strong) !important; color: #0b1222 !important;
        }

        /* ===== Select trong Modal.confirm (chọn album) ===== */
        .ant-modal-confirm .ant-select-selector {
          background-color: #0f1628 !important;
          color: #e8f3ff !important;
          border: 1.5px solid var(--primary) !important;
          box-shadow: 0 0 0 2px rgba(62,216,255,0.15) !important;
        }
        .ant-modal-confirm .ant-select-selection-placeholder { color: var(--text-subtle) !important; }
        .ant-modal-confirm .ant-select .ant-select-selection-item { color: #e8f3ff !important; }
        /* dropdown gắn class riêng để chắc chắn ăn style */
        .album-select-dropdown { background: #1c2234 !important; border: 1px solid var(--border) !important; }
        .album-select-dropdown .ant-select-item { color: #e8f3ff !important; }
        .album-select-dropdown .ant-select-item-option-selected { background: #233554 !important; }

        /* Đổi màu title đúng cho Modal.confirm (AntD v5) */
        .ant-modal-confirm .ant-modal-confirm-title,
        .ant-modal-confirm .ant-modal-body .ant-modal-confirm-title,
        .ant-modal-confirm .ant-modal-confirm-title strong {
          color: #3ed8ff !important;
          font-weight: 600 !important;
        }
      `;
        document.head.appendChild(style);
        return () => document.head.removeChild(style);
    }, []);

    const handleDelete = (id) => {
        Modal.confirm({
            title: t('confirm_delete_song'),
            okText: t('delete'),
            okType: "danger",
            cancelText: t('cancel'),
            onOk: async () => {
                try {
                    await axios.delete(
                        `${BASE_API_URL}/api/v1/artist/song/delete/${id}`,
                        config
                    );
                    message.success(t('song_deleted_successfully'));
                    if (selectedAlbum) fetchSongs(selectedAlbum);
                    else fetchSongs();
                } catch {
                    message.error(t('failed_to_delete_song'));
                }
            }
        });
    };

    const handleAddToAlbum = (songId) => {
        Modal.confirm({
            title: t('select_album_to_add_song'),
            content: (
                <Select
                    style={{ width: "100%" }}
                    placeholder={t('select_album')}
                    options={albums.map(a => ({ value: a.id, label: a.titleAlbum }))}
                    popupClassName="album-select-dropdown"
                    onChange={async (albumId) => {
                        try {
                            await axios.post(
                                `${BASE_API_URL}/api/v1/artist/song/add-to-album`,
                                null,
                                {
                                    params: { songId, albumId },
                                    ...config
                                }
                            );
                            message.success(t('song_added_to_album'));
                            if (selectedAlbum) fetchSongs(selectedAlbum);
                            else fetchSongs();
                            Modal.destroyAll();
                        } catch {
                            message.error(t('failed_to_add_song_to_album'));
                        }
                    }}
                />
            ),
            okButtonProps: { style: { display: "none" } },
            cancelText: t('close')
        });
    };

    const handleRemoveFromAlbum = (songId) => {
        Modal.confirm({
            title: t('confirm_remove_song_from_album'),
            okText: t('remove_from_album'),
            okType: "danger",
            cancelText: t('cancel'),
            onOk: async () => {
                try {
                    await axios.delete(
                        `${BASE_API_URL}/api/v1/artist/song/remove-from-album/${songId}`,
                        config
                    );
                    message.success(t('song_removed_from_album'));
                    if (selectedAlbum) fetchSongs(selectedAlbum);
                    else fetchSongs();
                } catch {
                    message.error(t('failed_to_remove_song_from_album'));
                }
            }
        });
    };

    const openModal = () => {
        setEditingSong(null);
        setModalOpen(true);
        setTimeout(() => {
            form.resetFields();
        }, 0);
    };

    const handleSubmitSong = async (values) => {
        setLoading(true);
        const formData = new FormData();
        formData.append("title", values.title);

        if (editingSong) {
            if (values.file && values.file.originFileObj) {
                formData.append("file", values.file.originFileObj);
            }
            if (values.profilePic && values.profilePic.originFileObj) {
                formData.append("profilePic", values.profilePic.originFileObj);
            }
            if (values.genreIds && values.genreIds.length > 0) {
                values.genreIds.forEach(id => formData.append("genreIds", id));
            }
            const lyricsValue = values.lyrics !== undefined ? values.lyrics : "";
            formData.append("lyrics", lyricsValue);

            try {
                const resp = await axios.put(
                    `${BASE_API_URL}/api/v1/artist/song/${editingSong.id}`,
                    formData,
                    {
                        headers: {
                            ...config.headers,
                            "Content-Type": "multipart/form-data"
                        },
                        onUploadProgress: () => setLoading(true),
                    }
                );
                if (resp.data.code === 200) {
                    message.success(t('song_updated_successfully'));
                } else {
                    message.error(resp.data.data || t('failed_to_update_song'));
                }
                setModalOpen(false);
                setEditingSong(null);
                setTimeout(() => {
                    form.resetFields();
                }, 100);
                if (selectedAlbum) fetchSongs(selectedAlbum);
                else fetchSongs();
            } catch (err) {
                let errorMessage = t('failed_to_update_song');
                if (err.response?.data?.message) {
                    errorMessage = err.response.data.message;
                } else if (err.response?.data?.data) {
                    errorMessage = err.response.data.data;
                } else if (err.response?.data) {
                    errorMessage = JSON.stringify(err.response.data);
                }
                message.error(`${errorMessage} (Status: ${err.response?.status || 'Unknown'})`);
            }
        } else {
            const artistId = localStorage.getItem("userId");
            if (!artistId || isNaN(Number(artistId))) {
                message.error(t('artist_id_not_found'));
                setLoading(false);
                return;
            }
            formData.append("artistId", artistId);

            if (values.file && values.file.originFileObj) {
                formData.append("file", values.file.originFileObj);
            }
            if (values.profilePic && values.profilePic.originFileObj) {
                formData.append("profilePic", values.profilePic.originFileObj);
            }
            if (values.genreIds) values.genreIds.forEach(id => formData.append("genreIds", id));
            if (values.lyrics) formData.append("lyrics", values.lyrics);

            try {
                const resp = await axios.post(
                    `${BASE_API_URL}/api/v1/artist/song/add`,
                    formData,
                    {
                        headers: {
                            ...config.headers,
                            "Content-Type": "multipart/form-data"
                        },
                        onUploadProgress: () => setLoading(true),
                    }
                );
                if (resp.data.code === 201) {
                    message.success(t('song_added_successfully'));
                } else {
                    message.error(resp.data.data || t('failed_to_add_song'));
                }
                setModalOpen(false);
                setTimeout(() => {
                    form.resetFields();
                }, 100);
                if (selectedAlbum) fetchSongs(selectedAlbum);
                else fetchSongs();
            } catch (err) {
                message.error(t('failed_to_add_song'));
            }
        }
        setLoading(false);
    };

    const handleViewLyrics = async (songId, songTitle) => {
        try {
            const res = await axios.get(`${BASE_API_URL}/api/v1/song/lyric/${songId}`, config);
            Modal.info({
                title: `${t('lyrics')} - ${songTitle}`,
                content: <div style={{ whiteSpace: "pre-line" }}>{res.data.data || t('no_lyrics')}</div>,
                width: 500,
            });
        } catch {
            message.error(t('failed_to_load_lyrics'));
        }
    };

    const handleEditSong = async (song) => {
        setEditingSong(song);
        setModalOpen(true);

        let fullLyrics = song.lyrics || '';
        if (song.id) {
            try {
                const lyricsRes = await axios.get(`${BASE_API_URL}/api/v1/song/lyric/${song.id}`, config);
                if (lyricsRes.data && lyricsRes.data.data) {
                    fullLyrics = lyricsRes.data.data;
                }
            } catch (error) {
                console.warn('Failed to load full lyrics, using existing:', error);
            }
        }

        let genreIds = [];
        if (song.genres && Array.isArray(song.genres)) {
            genreIds = song.genres.map(g => g.id);
        }

        setTimeout(() => {
            form.setFieldsValue({
                title: song.title || '',
                lyrics: fullLyrics,
                genreIds: genreIds
            });
        }, 100);
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
            title: t('duration'),
            align: "center",
            dataIndex: "duration",
            key: "duration",
            width: isMobile ? 40 : isTablet ? 70 : 100,
            ellipsis: isTablet || isMobile,
        },
        {
            title: t('views'),
            align: "center",
            dataIndex: "views",
            key: "views",
            width: isMobile ? 40 : isTablet ? 70 : 100,
            ellipsis: isTablet || isMobile,
        },
        {
            title: t('preview'),
            align: "center",
            key: "play",
            render: (_, song) => (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                    <audio controls src={song.fileUrl} style={{ width: isMobile ? 28 : isTablet ? 40 : 180 }} />
                </div>
            ),
            width: isMobile ? 36 : isTablet ? 48 : 200,
        },
        {
            title: t('actions'),
            align: "center",
            key: "action",
            render: (_, song) => (
                <Space size="small">
                    <Button
                        icon={<EyeOutlined style={{ fontSize: '16px' }} />}
                        onClick={() => handleViewLyrics(song.id, song.title)}
                        title={t('view_lyrics')}
                        size="middle"
                        style={{
                            width: '36px',
                            height: '36px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    />
                    <Button
                        icon={<EditOutlined style={{ fontSize: '16px' }} />}
                        onClick={() => handleEditSong(song)}
                        title={t('edit_song')}
                        size="middle"
                        style={{
                            width: '36px',
                            height: '36px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    />
                    {!song.albumId && (
                        <Button
                            icon={<PlusOutlined style={{ fontSize: '16px' }} />}
                            onClick={() => handleAddToAlbum(song.id)}
                            title={t('add_to_album')}
                            size="middle"
                            style={{
                                width: '36px',
                                height: '36px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        />
                    )}
                    {song.albumId && (
                        <Button
                            icon={<MinusCircleOutlined style={{ fontSize: '16px' }} />}
                            onClick={() => handleRemoveFromAlbum(song.id, song.albumId)}
                            title={t('remove_from_album')}
                            size="middle"
                            style={{
                                width: '36px',
                                height: '36px',
                                color: '#ff7875',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        />
                    )}
                    <Button
                        icon={<DeleteOutlined style={{ fontSize: '16px' }} />}
                        danger
                        onClick={() => handleDelete(song.id)}
                        title={t('delete_song')}
                        size="middle"
                        style={{
                            width: '36px',
                            height: '36px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    />
                </Space>
            ),
            width: isMobile ? 160 : isTablet ? 200 : 250,
        }
    ];

    return (
        <>
            <style>
                {`
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
                    /* Đổi nền modal confirm chọn album */
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
                    .ant-modal-confirm .ant-btn {
                        border-radius: 8px;
                    }
                `}
            </style>
            <div
                style={{
                    padding: isMobile ? 4 : isTablet ? 8 : 24,
                    width: "100%",
                    height: "100%",
                    boxSizing: "border-box",
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                <div
                    style={{
                        marginBottom: 16,
                        display: "flex",
                        flexDirection: isMobile ? "column" : isTablet ? "column" : "row",
                        gap: 8,
                        alignItems: isMobile ? "stretch" : isTablet ? "stretch" : "center",
                        justifyContent: isMobile ? "flex-start" : isTablet ? "flex-start" : "space-between",
                        width: "100%",
                    }}
                >
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => openModal()}
                        size={isMobile ? "small" : isTablet ? "middle" : "large"}
                        style={{ width: isMobile ? "100%" : isTablet ? "100%" : undefined }}
                    >
                        {t('add_song')}
                    </Button>
                </div>
                <div
                    style={{
                        flex: 1,
                        width: "100%",
                        maxWidth: "100vw",
                        overflowX: isMobile ? "auto" : isTablet ? "auto" : "visible",
                        margin: 0,
                    }}
                >
                    <Table
                        columns={columns}
                        dataSource={songs}
                        rowKey="id"
                        loading={loading}
                        pagination={false}
                        size={isMobile ? "small" : isTablet ? "small" : "middle"}
                        scroll={isMobile ? { x: 480 } : isTablet ? { x: 700 } : undefined}
                        style={{
                            background: "#181d36",
                            minWidth: isMobile ? 480 : isTablet ? 700 : undefined,
                            width: "100%",
                        }}
                        locale={{ emptyText: t('no_data') }}
                    />
                </div>
                <Modal
                    className="modal-light"
                    title={editingSong ? t('edit_song') : t('add_new_song')}
                    open={modalOpen}
                    onCancel={() => {
                        setModalOpen(false);
                        setEditingSong(null);
                        setTimeout(() => {
                            form.resetFields();
                        }, 100);
                    }}
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
                        onFinish={handleSubmitSong}
                        disabled={loading}
                    >
                        <Form.Item
                            label={t('song_title')}
                            name="title"
                            rules={[
                                { required: true, message: t('please_enter_song_title') },
                                { min: 2, message: t('song_title_min_length') },
                                { max: 100, message: t('song_title_max_length') }
                            ]}
                        >
                            <Input />
                        </Form.Item>
                        <Form.Item
                            label={t('genres')}
                            name="genreIds"
                            rules={[
                                { required: true, message: t('please_select_genres') },
                                {
                                    validator: (_, value) => {
                                        if (!value || value.length === 0) {
                                            return Promise.reject(new Error(t('please_select_genres')));
                                        }
                                        if (value && value.length > 5) {
                                            return Promise.reject(new Error(t('genre_max_count')));
                                        }
                                        return Promise.resolve();
                                    }
                                }
                            ]}
                        >
                            <Select
                                mode="multiple"
                                placeholder={t('select_genres')}
                                options={Array.isArray(genres) ? genres.map(g => ({ value: g.id, label: g.genreName })) : []}
                            />
                        </Form.Item>
                        <Form.Item
                            label={t('music_file')}
                            name="file"
                            valuePropName="file"
                            getValueFromEvent={e => e && e.fileList && e.fileList[0]}
                            extra={editingSong && editingSong.fileUrl && (
                                <div style={{ fontSize: '12px', color: '#9fb1c6' }}>
                                    {t('current_file')}: {editingSong.title}.mp3
                                </div>
                            )}
                            rules={[
                                { required: !editingSong, message: t('please_select_music_file') },
                                {
                                    validator: (_, value) => {
                                        if (!value) return Promise.resolve();
                                        const allowedTypes = [
                                            'audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/flac', 'audio/x-flac',
                                            'audio/mp4', 'audio/x-m4a', 'audio/ogg', 'audio/x-ogg', 'audio/aac', 'audio/x-aac'
                                        ];
                                        if (!allowedTypes.includes(value.type)) {
                                            return Promise.reject(new Error(t('unsupported_audio_format')));
                                        }
                                        return Promise.resolve();
                                    }
                                }
                            ]}
                        >
                            <Upload beforeUpload={() => false} maxCount={1} accept=".mp3,.wav,.flac,.m4a,.ogg,.aac">
                                <Button icon={<UploadOutlined />}>
                                    {editingSong ? `${t('change_music_file')} (${t('optional')})` : t('select_music_file')}
                                </Button>
                            </Upload>
                        </Form.Item>
                        <Form.Item
                            label={t('cover_image')}
                            name="profilePic"
                            valuePropName="file"
                            getValueFromEvent={e => e && e.fileList && e.fileList[0]}
                            extra={editingSong && editingSong.profilePicUrl && (
                                <div style={{ marginTop: 8 }}>
                                    <img
                                        src={editingSong.profilePicUrl}
                                        alt="Current cover"
                                        style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }}
                                    />
                                    <div style={{ fontSize: '12px', color: '#9fb1c6', marginTop: 4 }}>
                                        {t('current_cover_image')}
                                    </div>
                                </div>
                            )}
                            rules={[
                                { required: !editingSong, message: t('please_upload_cover_image') },
                                {
                                    validator: (_, value) => {
                                        if (!value) return Promise.resolve();
                                        const isImage = value.type && value.type.startsWith('image/');
                                        const isSizeOk = value.size < 2 * 1024 * 1024;
                                        if (!isImage) return Promise.reject(new Error(t('cover_only_image')));
                                        if (!isSizeOk) return Promise.reject(new Error(t('cover_max_size')));
                                        return Promise.resolve();
                                    }
                                }
                            ]}
                        >
                            <Upload beforeUpload={() => false} maxCount={1} accept="image/*">
                                <Button icon={<UploadOutlined />}>
                                    {editingSong ? `${t('change_cover_image')} (${t('optional')})` : t('select_cover_image')}
                                </Button>
                            </Upload>
                        </Form.Item>
                        <Form.Item
                            label={t('lyrics')}
                            name="lyrics"
                        >
                            <Input.TextArea rows={4} placeholder={t('enter_lyrics_here')} />
                        </Form.Item>
                        <Form.Item>
                            <Button type="primary" htmlType="submit" loading={loading} block>
                                {editingSong ? t('update') : t('add')}
                            </Button>
                        </Form.Item>
                    </Form>
                </Modal>
            </div>
        </>
    );
}
