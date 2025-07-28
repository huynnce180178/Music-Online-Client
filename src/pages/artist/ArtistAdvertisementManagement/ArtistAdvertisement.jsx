import { useEffect, useState } from "react";
import {
    Table, Button, Image, message, Grid, Tabs, Tag, Modal,
    Form, DatePicker, Select, Upload, Input,

} from "antd";
import { EditOutlined, PlusOutlined, UploadOutlined } from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import { useTranslation } from 'react-i18next';
import BASE_API_URL from "../../../services/base.api.url";

dayjs.extend(isSameOrBefore);

const { useBreakpoint } = Grid;
const statusColors = {
    PENDING: "#FAAD14",
    APPROVED: "#52C41A",
    REJECTED: "#FF4D4F",
};

export default function ArtistAdvertisement() {
    const [ads, setAds] = useState([]);
    const [loading, setLoading] = useState(false);

    // Modal state
    const [renewModal, setRenewModal] = useState({ open: false, record: null });
    const [renewLoading, setRenewLoading] = useState(false);

    const [addModal, setAddModal] = useState(false);
    const [addLoading, setAddLoading] = useState(false);

    const [renewForm] = Form.useForm();
    const [addForm] = Form.useForm();

    const screens = useBreakpoint();
    const isTablet = !screens.lg;
    const { t } = useTranslation();

    useEffect(() => {
        fetchMyAdvertisements();
        // Custom style (giao diện tối)
        const style = document.createElement("style");
        style.innerHTML = `
        .ant-table { background-color: #101426 !important; color: #fff !important; }
        .ant-table-thead > tr > th { background-color: #181C2B !important; color: #fff !important; border-bottom: 2px solid #3ed8ff !important; }
        .ant-table-tbody > tr > td { background-color: #101426 !important; color: #fff !important; }
        .ant-table-tbody > tr:hover > td { background-color: #1f2233 !important; }
        .ant-pagination-item { background-color: #101426 !important; border: 1px solid #434760 !important; }
        .ant-pagination-item a { color: #fff !important; }
        .ant-pagination-item-active { background-color: #434760 !important; border-color: #434760 !important; }
        .ant-pagination-item-active a { color: #fff !important; }
        .ant-pagination-prev, .ant-pagination-next, .ant-pagination-jump-prev, .ant-pagination-jump-next { color: #fff !important; }
        .ant-tabs-tab .ant-tabs-tab-btn { color: #fff !important; }
        .ant-tabs-tab.ant-tabs-tab-active .ant-tabs-tab-btn { color: #3ed8ff !important; }
        .ant-tabs-ink-bar { display: none !important; }
        .ant-tabs-nav::before { border-bottom: none !important; }
        /* Full width black background for submenu in Artist Panel */
        .ant-menu-dark .ant-menu-submenu .ant-menu {
            background: #101426 !important; border-radius: 0 !important;
            margin-left: 0 !important; padding-left: 0 !important; width: 100% !important;
            min-width: 0 !important; box-shadow: none !important;
        }
        .ant-menu-dark .ant-menu-submenu .ant-menu-item { padding-left: 30px !important; }
        `;
        document.head.appendChild(style);
        return () => document.head.removeChild(style);
    }, []);

    useEffect(() => {
        const startDate = addForm.getFieldValue('startDate');
        const endDate = addForm.getFieldValue('endDate');
        if (startDate && endDate) {
            const dayjsStart = typeof startDate === 'string' ? dayjs(startDate) : startDate;
            const dayjsEnd = typeof endDate === 'string' ? dayjs(endDate) : endDate;
            if (dayjsEnd.isValid() && dayjsStart.isValid() && dayjsEnd.isSameOrBefore(dayjsStart, 'day')) {
                addForm.setFieldsValue({ endDate: null });
            }
        }
    }, [addForm.getFieldValue('startDate')]);

    const fetchMyAdvertisements = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("accessToken");
            const res = await axios.get(
                `${BASE_API_URL}/artist/advertisements/approved`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setAds(Array.isArray(res.data.data) ? res.data.data : []);
        } catch {
            message.error(t('artist_ad.unable_to_load_approved_advertisements'));
        } finally {
            setLoading(false);
        }
    };

    // --- Renew Handler ---
    const openRenewModal = (record) => {
        setRenewModal({ open: true, record });
        renewForm.setFieldsValue({
            startDate: dayjs(),
            endDate: dayjs().add(7, 'day'),
        });
    };

    const handleRenew = async () => {
        try {
            const values = await renewForm.validateFields();
            setRenewLoading(true);
            const token = localStorage.getItem("accessToken");
            await axios.post(
                `${BASE_API_URL}/artist/advertisements/renew/${renewModal.record.id}`,
                {},
                {
                    headers: { Authorization: `Bearer ${token}` },
                    params: {
                        startDate: values.startDate.format("YYYY-MM-DD"),
                        endDate: values.endDate.format("YYYY-MM-DD"),
                    },
                }
            );
            message.success(t('artist_ad.advertisement_renewed_successfully'));
            setRenewModal({ open: false, record: null });
            renewForm.resetFields();
            fetchMyAdvertisements();
        } catch (err) {
            if (err?.errorFields) return; // validate error
            message.error(t('artist_ad.failed_to_renew_advertisement'));
        }
        setRenewLoading(false);
    };

    // --- Add Advertisement Handler ---
    const openAddModal = () => {
        setAddModal(true);
        addForm.resetFields();
    };
    const handleAdd = async () => {
        try {
            const values = await addForm.validateFields();
            setAddLoading(true);

            const formData = new FormData();
            formData.append("adType", values.adType);
            formData.append("startDate", values.startDate.format("YYYY-MM-DD"));
            formData.append("endDate", values.endDate.format("YYYY-MM-DD"));
            // Đảm bảo lấy đúng file từ Antd Upload
            let fileToUpload = null;
            if (values.mediaFile && values.mediaFile.file) {
                fileToUpload = values.mediaFile.file.originFileObj || values.mediaFile.file;
            } else if (values.mediaFile && values.mediaFile.originFileObj) {
                fileToUpload = values.mediaFile.originFileObj;
            }
            if (fileToUpload) {
                formData.append("mediaFile", fileToUpload);
            }
            // Debug: log file
            console.log('mediaFile:', fileToUpload);
            formData.append("redirectUrl", values.redirectUrl || "");

            // Debug: log FormData
            for (let pair of formData.entries()) {
                console.log(pair[0] + ':', pair[1]);
            }

            const token = localStorage.getItem("accessToken");
            await axios.post(`${BASE_API_URL}/artist/advertisements/create`, formData, {
                headers: { Authorization: `Bearer ${token}` },
            });
            message.success(t('artist_ad.advertisement_request_submitted'));
            setAddModal(false);
            addForm.resetFields();
            fetchMyAdvertisements();
        } catch (err) {
            if (err?.errorFields) return; // validate error
            const apiMsg = err?.response?.data?.message;
            if (err?.response?.status === 415) {
                message.error('Upload failed: Unsupported file type or server error.');
                setAddModal(false);
                addForm.resetFields();
                return;
            }
            if (err?.response?.status === 400) {
                message.error(apiMsg || 'Bad request: Please check your input.');
                return;
            }
            if (apiMsg && apiMsg.toLowerCase().includes('limit of 5 ads')) {
                message.error(t('artist_ad.limit_reached'));
            } else if (apiMsg) {
                message.error(apiMsg);
            } else {
                message.error(t('artist_ad.failed_to_submit_advertisement_request'));
            }
        }
        setAddLoading(false);
    };

    const getColumns = (type) => [
        {
            title: t('index'),
            key: 'index',
            align: 'center',
            render: (_, __, index) => index + 1,
        },

        {
            title: type === 'AUDIO' ? t('artist_ad.preview') : t('artist_ad.banner'),
            key: 'media',
            align: 'center',
            render: (_, ad) =>
                type === 'AUDIO' ? (
                    <audio controls src={ad.mediaUrl} style={{ width: isTablet ? 120 : 220, borderRadius: 8 }} />
                ) : (
                    <Image
                        src={ad.mediaUrl}
                        width={isTablet ? 60 : 100}
                        height={isTablet ? 60 : 100}
                        style={{ objectFit: 'cover', borderRadius: 12, boxShadow: '0 0 8px rgba(0,0,0,0.5)' }}
                        preview={false}
                        alt={t('artist_ad.banner')}
                    />
                ),
        },
        {
            title: t('artist_ad.start_date'),
            align: 'center',
            dataIndex: 'startDateStr',
            key: 'startDateStr',
        },
        {
            title: t('artist_ad.end_date'),
            align: 'center',
            dataIndex: 'endDateStr',
            key: 'endDateStr',
        },
        {
            title: t('artist_ad.status'),
            align: 'center',
            dataIndex: 'status',
            key: 'status',
            render: (status) => (
                <Tag style={{ backgroundColor: statusColors[status] || '#d9d9d9', color: '#181d36', borderRadius: 8 }}>
                    {t(status?.toLowerCase())}
                </Tag>
            ),
        },
        {
            title: t('artist_ad.actions'),
            key: 'actions',
            align: 'center',
            width: 100,
            render: (_, record) => (
                <Button
                    icon={<EditOutlined style={{ color: '#fff' }} />}
                    type='link'
                    style={{ color: '#fff' }}
                    onClick={() => openRenewModal(record)}
                >
                    {t('artist_ad.renew')}
                </Button>
            ),
        },
    ];

    const renderTable = (data, type) => (
        <Table
            columns={getColumns(type)}
            dataSource={data}
            loading={loading}
            rowKey="id"
            pagination={{ pageSize: 10, showSizeChanger: true }}
            size={isTablet ? "small" : "middle"}
            scroll={isTablet ? { x: 800 } : undefined}
            locale={{ emptyText: t('artist_ad.no_data') }}
            style={{ borderRadius: 12 }}
        />
    );

    return (
        <div style={{ padding: isTablet ? 8 : 16 }}>
            <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={openAddModal}
                style={{ marginBottom: 16 }}
            >
                {t('artist_ad.add_advertisement')}
            </Button>

            <Tabs
                defaultActiveKey="AUDIO"
                items={[
                    {
                        key: "AUDIO",
                        label: t('artist_ad.audio_advertisements'),
                        children: renderTable(ads.filter((ad) => ad.adType === "AUDIO"), "AUDIO"),
                    },
                    {
                        key: "BANNER",
                        label: t('artist_ad.banner_advertisements'),
                        children: renderTable(ads.filter((ad) => ad.adType === "BANNER"), "BANNER"),
                    },
                ]}
            />

            {/* Add Advertisement Modal */}
            <Modal
                title={t('artist_ad.submit_new_advertisement')}
                open={addModal}
                onCancel={() => setAddModal(false)}
                onOk={handleAdd}
                okText={t('artist_ad.add')}
                cancelText={t('artist_ad.cancel')}
                confirmLoading={addLoading}
                destroyOnHidden
                centered
            >
                <Form form={addForm} layout="vertical" autoComplete="off">
                    <Form.Item
                        name="adType"
                        label={t('artist_ad.ad_type')}
                        rules={[{ required: true, message: t('artist_ad.please_select_type') }]}
                    >
                        <Select
                            placeholder={t('artist_ad.select_type')}
                            options={[
                                { label: t('artist_ad.audio'), value: "AUDIO" },
                                { label: t('artist_ad.banner'), value: "BANNER" },
                            ]}
                        />
                    </Form.Item>
                    <Form.Item
                        name="startDate"
                        label={t('artist_ad.start_date')}
                        rules={[{ required: true, message: t('artist_ad.please_select_start_date') }]}
                    >
                        <DatePicker
                            style={{ width: "100%" }}
                            disabledDate={d => d < dayjs().startOf("day")}
                        />
                    </Form.Item>
                    <Form.Item
                        name="endDate"
                        label={t('artist_ad.end_date')}
                        dependencies={["startDate"]}
                        rules={[
                            { required: true, message: t('artist_ad.please_select_end_date') },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    const start = getFieldValue("startDate");
                                    if (!value || !start) return Promise.resolve();
                                    let dayjsValue = value;
                                    let dayjsStart = start;
                                    if (!dayjs.isDayjs(dayjsValue)) dayjsValue = dayjs(dayjsValue);
                                    if (!dayjs.isDayjs(dayjsStart)) dayjsStart = dayjs(dayjsStart);
                                    if (!dayjsValue.isValid() || !dayjsStart.isValid()) return Promise.resolve();
                                    if (typeof dayjsValue.isSameOrBefore !== 'function') return Promise.resolve();
                                    if (dayjsValue.isSameOrBefore(dayjsStart, "day"))
                                        return Promise.reject(new Error(t('artist_ad.end_date_after_start')));
                                    return Promise.resolve();
                                },
                            }),
                        ]}
                    >
                        <DatePicker
                            style={{ width: "100%" }}
                            disabledDate={d => d < dayjs().startOf("day")}
                        />
                    </Form.Item>
                    <Form.Item
                        name="mediaFile"
                        label={t('artist_ad.media_file')}
                        valuePropName="file"
                        rules={[{ required: true, message: t('artist_ad.please_upload_media_file') }]}
                    >
                        <Upload beforeUpload={() => false} maxCount={1}>
                            <Button icon={<UploadOutlined />}>{t('artist_ad.select_file')}</Button>
                        </Upload>
                    </Form.Item>
                    <Form.Item name="redirectUrl" label={t('artist_ad.redirect_url')}>
                        <Input placeholder={t('artist_ad.optional')} />
                    </Form.Item>
                </Form>
            </Modal>

            {/* Renew Advertisement Modal */}
            <Modal
                open={renewModal.open}
                title={t('artist_ad.renew_advertisement')}
                okText={t('artist_ad.add')}
                cancelText={t('artist_ad.cancel')}
                onCancel={() => {
                    setRenewModal({ open: false, record: null });
                    renewForm.resetFields();
                }}
                onOk={handleRenew}
                confirmLoading={renewLoading}
                centered
                destroyOnHidden
            >
                <Form form={renewForm} layout="vertical" autoComplete="off">
                    <Form.Item
                        label={t('artist_ad.start_date')}
                        name="startDate"
                        rules={[{ required: true, message: t('artist_ad.please_select_a_start_date') }]}
                    >
                        <DatePicker style={{ width: "100%" }} disabledDate={d => d < dayjs().startOf("day")} />
                    </Form.Item>
                    <Form.Item
                        label={t('artist_ad.end_date')}
                        name="endDate"
                        dependencies={["startDate"]}
                        rules={[
                            { required: true, message: t('artist_ad.please_select_an_end_date') },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    const start = getFieldValue("startDate");
                                    if (!value || !start) return Promise.resolve();
                                    let dayjsValue = value;
                                    let dayjsStart = start;
                                    if (!dayjs.isDayjs(dayjsValue)) dayjsValue = dayjs(dayjsValue);
                                    if (!dayjs.isDayjs(dayjsStart)) dayjsStart = dayjs(dayjsStart);
                                    if (!dayjsValue.isValid() || !dayjsStart.isValid()) return Promise.resolve();
                                    if (typeof dayjsValue.isSameOrBefore !== 'function') return Promise.resolve();
                                    if (dayjsValue.isSameOrBefore(dayjsStart, "day"))
                                        return Promise.reject(new Error(t('artist_ad.end_date_after_start')));
                                    return Promise.resolve();
                                },
                            }),
                        ]}
                    >
                        <DatePicker style={{ width: "100%" }} disabledDate={d => d < dayjs().startOf("day")} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
