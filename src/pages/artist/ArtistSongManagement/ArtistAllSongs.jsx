import { useEffect, useState } from "react";
import { Table, Button, Space, Image, message, Modal, Select, Form, Input, Upload, Grid } from "antd";
import { DeleteOutlined, PlusOutlined, UploadOutlined, EyeOutlined } from "@ant-design/icons";
import axios from "axios";
import { useTranslation } from 'react-i18next';
import BASE_API_URL from "../../../services/base.api.url";

const { useBreakpoint } = Grid;

export default function ArtistAllSongs() {
    const [songs, setSongs] = useState([]);
    const [albums, setAlbums] = useState([]);
    const [genres, setGenres] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedAlbum, setSelectedAlbum] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingSong, setEditingSong] = useState(null);
    const [form] = Form.useForm();

    const screens = useBreakpoint();
    const isTablet = !screens.lg;

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

    useEffect(() => {
        const style = document.createElement("style");
        style.innerHTML = `
        .ant-table { background-color: #101426 !important; color: #fff !important; }
        .ant-table-thead > tr > th { background-color: #181C2B !important; color: #fff !important; border-bottom: 2px solid #3ed8ff !important; }
        .ant-table-tbody > tr > td { background-color: #101426 !important; color: #fff !important; }
        .ant-table-tbody > tr:hover > td { background-color: #1f2233 !important; }
        .ant-empty-description { color: #999 !important; }
        .ant-empty-image { filter: invert(0.7); }
        .ant-input, .ant-input-affix-wrapper, .ant-input-textarea, .ant-select-selector { background-color: #101426 !important; color: #fff !important; border: 1px solid #434760 !important; }
        .ant-input::placeholder, .ant-input-textarea::placeholder { color: #999 !important; }
        .ant-select-arrow { color: #fff !important; }
        .ant-select-selection-placeholder { color: #999 !important; }
        .ant-select-dropdown { background-color: #181C2B !important; }
        .ant-select-item-option { color: #fff !important; }
        .ant-select-item-option-selected:not(.ant-select-item-option-disabled) { background-color: #434760 !important; color: #fff !important; }
        .modal-light .ant-modal-content { background: #fff !important; color: #000 !important; }
        .modal-light .ant-modal-header { background: #fff !important; border-bottom: 1px solid #d9d9d9 !important; }
        .modal-light .ant-modal-title { color: #000 !important; }
        .modal-light .ant-btn { border-radius: 6px; }
        .modal-light .ant-input, .modal-light .ant-input-affix-wrapper, .modal-light .ant-input-textarea, .modal-light .ant-select-selector { background-color: #fff !important; color: #000 !important; border: 1px solid #d9d9d9 !important; }
        .modal-light .ant-input::placeholder, .modal-light .ant-input-textarea::placeholder, .modal-light .ant-select-selection-placeholder { color: #888 !important; }
    `;
        document.head.appendChild(style);
        return () => document.head.removeChild(style);
    }, []);

    const handleAlbumChange = (albumId) => {
        setSelectedAlbum(albumId || null);
        if (!albumId) fetchSongs();
        else fetchSongs(albumId);
    };

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

    const openModal = (song = null) => {
        setEditingSong(song);
        setModalOpen(true);
        if (song) {
            form.setFieldsValue({
                title: song.title,
                genreIds: song.genres?.map(g => g.id),
                lyrics: song.lyrics,
            });
        } else {
            form.resetFields();
        }
    };

    const handleSubmitSong = async (values) => {
        setLoading(true);
        const formData = new FormData();
        formData.append("title", values.title);
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
            if (editingSong) {
                await axios.put(
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
                message.success(t('song_updated_successfully'));
            } else {
                await axios.post(
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
                message.success(t('song_added_successfully'));
            }
            setModalOpen(false);
            form.resetFields();
            setEditingSong(null);
            if (selectedAlbum) fetchSongs(selectedAlbum);
            else fetchSongs();
        } catch (err) {
            message.error(editingSong ? t('failed_to_update_song') : t('failed_to_add_song'));
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

    const columns = [
        {
            title: t('index'),
            key: "index",
            align: "center",
            render: (text, record, index) => (isTablet ? 0 : 0) + index + 1,
            width: 50,
        },
        {
            title: t('cover'),
            dataIndex: "profilePicUrl",
            key: "profilePicUrl",
            render: url => url && <Image src={url} width={isTablet ? 40 : 60} height={isTablet ? 40 : 60} style={{ objectFit: "cover", borderRadius: 8 }} />,
            width: isTablet ? 50 : 80,
            align: "center",
        },
        {
            title: t('title'),
            align: "center",
            dataIndex: "title",
            key: "title",
            width: isTablet ? 110 : 200,
            ellipsis: isTablet,
        },
        {
            title: t('duration'),
            align: "center",
            dataIndex: "duration",
            key: "duration",
            width: isTablet ? 70 : 100,
            ellipsis: isTablet,
        },
        {
            title: t('views'),
            align: "center",
            dataIndex: "views",
            key: "views",
            width: isTablet ? 70 : 100,
            ellipsis: isTablet,
        },
        {
            title: t('preview'),
            align: "center",
            key: "play",
            render: (_, song) => (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                    <audio controls src={song.fileUrl} style={{ width: isTablet ? 40 : 180 }} />
                </div>
            ),
            width: isTablet ? 48 : 200,
        },
        !isTablet && {
            title: t('actions'),
            align: "center",
            key: "action",
            render: (_, song) => (
                <Space>
                    <Button icon={<EyeOutlined />} onClick={() => handleViewLyrics(song.id, song.title)} title={t('view_lyrics')} />
                    <Button icon={<PlusOutlined />} onClick={() => handleAddToAlbum(song.id)} title={t('add_to_album')} />
                    {song.albumId && (
                        <Button danger onClick={() => handleRemoveFromAlbum(song.id, song.albumId)} title={t('remove_from_album')}>
                            {t('remove_from_album')}
                        </Button>
                    )}
                    <Button icon={<DeleteOutlined />} danger onClick={() => handleDelete(song.id)} title={t('delete_song')} />
                </Space>
            ),
            width: 300,
        },
        isTablet && {
            title: "",
            key: "action",
            render: (_, song) => (
                <Space>
                    <Button icon={<PlusOutlined />} size="small" onClick={() => handleAddToAlbum(song.id)} />
                    {song.albumId && (
                        <Button danger size="small" onClick={() => handleRemoveFromAlbum(song.id, song.albumId)}>
                            <DeleteOutlined />
                        </Button>
                    )}
                    <Button icon={<DeleteOutlined />} danger size="small" onClick={() => handleDelete(song.id)} />
                </Space>
            ),
            width: 90,
            align: "center",
        }
    ].filter(Boolean);

    return (
        <div
            style={{
                padding: isTablet ? 8 : 24,
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
                    flexDirection: isTablet ? "column" : "row",
                    gap: 8,
                    alignItems: isTablet ? "stretch" : "center",
                    justifyContent: isTablet ? "flex-start" : "space-between",
                    width: "100%",
                }}
            >
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => openModal()}
                    size={isTablet ? "middle" : "large"}
                    style={{ width: isTablet ? "100%" : undefined }}
                >
                    {t('add_song')}
                </Button>
            </div>
            <div
                style={{
                    flex: 1,
                    width: "100%",
                    maxWidth: "100vw",
                    overflowX: isTablet ? "auto" : "visible",
                    margin: 0,
                }}
            >
                <Table
                    columns={columns}
                    dataSource={songs}
                    rowKey="id"
                    loading={loading}
                    pagination={false}
                    size={isTablet ? "small" : "middle"}
                    scroll={isTablet ? { x: 700 } : undefined}
                    style={{
                        background: "#181d36",
                        minWidth: isTablet ? 700 : undefined,
                        width: "100%",
                    }}
                    locale={{ emptyText: t('no_data') }}
                />
            </div>
            <Modal
                className="modal-light"
                title={editingSong ? t('update_song') : t('add_new_song')}
                open={modalOpen}
                onCancel={() => {
                    setModalOpen(false);
                    form.resetFields();
                    setEditingSong(null);
                }}
                footer={null}
                destroyOnHidden
                confirmLoading={loading}
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
                        rules={[{ required: true, message: t('please_enter_song_title') }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        label={t('genres')}
                        name="genreIds"
                        rules={[{ required: true, message: t('please_select_genres') }]}
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
                        rules={editingSong ? [] : [{ required: true, message: t('please_select_music_file') }]}
                    >
                        <Upload beforeUpload={() => false} maxCount={1}>
                            <Button icon={<UploadOutlined />}>{t('select_music_file')}</Button>
                        </Upload>
                        {editingSong && editingSong.fileUrl && (
                            <div style={{ marginTop: 8, color: "#aaa" }}>
                                {t('current_file')}: <a href={editingSong.fileUrl} target="_blank" rel="noopener noreferrer">{t('download')}</a>
                            </div>
                        )}
                    </Form.Item>
                    <Form.Item
                        label={t('cover_image')}
                        name="profilePic"
                        valuePropName="file"
                        getValueFromEvent={e => e && e.fileList && e.fileList[0]}
                    >
                        <Upload beforeUpload={() => false} maxCount={1} accept="image/*">
                            <Button icon={<UploadOutlined />}>{t('select_cover_image')}</Button>
                        </Upload>
                        {editingSong && editingSong.profilePicUrl && (
                            <div style={{ marginTop: 8 }}>
                                <Image src={editingSong.profilePicUrl} width={60} height={60} style={{ objectFit: "cover", borderRadius: 8 }} />
                            </div>
                        )}
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
    );
} 