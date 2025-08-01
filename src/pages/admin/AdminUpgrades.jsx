import { useEffect, useState } from "react";
import { Table, Button, Modal, Form, Input, InputNumber, Select, Popconfirm, message, Space, Grid } from "antd";
import { EditOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import axios from "axios";
import { useTranslation } from 'react-i18next';
import BASE_API_URL from "../../services/base.api.url";

export default function AdminUpgrades() {
    const { t } = useTranslation();
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);
    const [form] = Form.useForm();

    const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
    const screens = Grid.useBreakpoint();
    const isTablet = !screens.lg; // < 992px là tablet/mobile

    useEffect(() => {
        fetchPlans();
        // eslint-disable-next-line
    }, []);

    useEffect(() => {
        const style = document.createElement("style");
        style.innerHTML = `
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
        .ant-tag {
            border: none !important;
            border-radius: 8px !important;
            padding: 2px 10px !important;
            font-weight: 500;
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
        /* XÓA HOÀN TOÀN các phần dưới để input/select trong modal trắng:
        .ant-input,
        .ant-input-affix-wrapper,
        .ant-input-textarea,
        .ant-input-number,
        .ant-input-number-input,
        .ant-select-selector,
        .ant-select-selection-placeholder,
        .ant-input::placeholder,
        .ant-input-textarea::placeholder
        */
    `;
        document.head.appendChild(style);
        return () => {
            document.head.removeChild(style);
        };
    }, []);

    const PLAN_TYPE_OPTIONS = [
        { label: t('admin_upgrades.plan_type_premium'), value: "PREMIUM" },
        { label: t('admin_upgrades.plan_type_artist'), value: "ARTIST" },
    ];

    const fetchPlans = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${BASE_API_URL}/api/v1/subscriptionPlan`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPlans(res.data.data || []);
        } catch (err) {
            message.error(t('admin_upgrades.failed_fetch'));
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        setEditingPlan(null);
        form.resetFields();
        setModalOpen(true);
    };

    const handleEdit = (plan) => {
        setEditingPlan(plan);
        form.setFieldsValue(plan);
        setModalOpen(true);
    };

    const handleDelete = async (id) => {
        setLoading(true);
        try {
            await axios.delete(`${BASE_API_URL}/api/v1/admin/subscriptionPlan/delete/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            message.success(t('admin_upgrades.deleted_success'));
            fetchPlans();
        } catch (err) {
            message.error(t('admin_upgrades.deleted_failed'));
        }
        setLoading(false);
    };

    const handleModalOk = async () => {
        setLoading(true);
        try {
            const values = await form.validateFields();
            if (!values.price || Number(values.price) < 0.01) {
                message.error(t('admin_upgrades.validate_price_positive'));
                setLoading(false);
                return;
            }
            const payload = {
                ...values,
                price: Number(values.price),
                durationDay: Number(values.durationDay)
            };
            if (editingPlan) {
                await axios.post(
                    `${BASE_API_URL}/api/v1/admin/subscriptionPlan/update/${editingPlan.id}`,
                    JSON.stringify(payload),
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json"
                        }
                    }
                );
                message.success(t('admin_upgrades.updated_success'));
            } else {
                await axios.post(
                    `${BASE_API_URL}/api/v1/admin/subscriptionPlan/add`,
                    JSON.stringify(payload),
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json"
                        }
                    }
                );
                message.success(t('admin_upgrades.added_success'));
            }
            setModalOpen(false);
            fetchPlans();
        } catch (err) {
            // Ưu tiên lỗi từ backend, nếu có key i18n thì dùng, nếu không thì dùng lỗi chung
            if (err?.response?.data?.message) {
                // Nếu backend trả về key i18n, dùng t(key), nếu không thì hiện trực tiếp
                const backendMsg = err.response.data.message;
                message.error(t(backendMsg) !== backendMsg ? t(backendMsg) : backendMsg);
            } else {
                message.error(t('admin_upgrades.save_failed'));
            }
        }
        setLoading(false);
    };

    // Responsive columns
    const columns = [
        {
            title: t('admin_upgrades.id'),
            align: "center",
            dataIndex: "id",
            width: isTablet ? 40 : 60
        },
        {
            title: t('admin_upgrades.name'),
            align: "center",
            dataIndex: "planName",
            width: isTablet ? 80 : 120
        },
        {
            title: t('admin_upgrades.type'),
            align: "center",
            dataIndex: "planType",
            width: isTablet ? 60 : 100
        },
        {
            title: t('admin_upgrades.price'),
            align: "center",
            dataIndex: "price",
            width: isTablet ? 70 : 100, render: v => v.toLocaleString("en-US",
                {
                    style: "currency",
                    currency: "USD"
                }
            )
        },
        {
            title: t('admin_upgrades.duration'),
            align: "center",
            dataIndex: "durationDay",
            width: isTablet ? 70 : 120, render: v => `${v} ${t('admin_upgrades.days')}`
        },
        {
            title: t('admin_upgrades.description'),
            align: "center",
            dataIndex: "description",
            width: isTablet ? 100 : 200,
            ellipsis: isTablet
        },
        {
            title: t('admin_upgrades.action'),
            key: "action",
            align: "center",
            width: isTablet ? 60 : 140,
            render: (_, record) => (
                <Space>
                    <Button
                        type="link"
                        size={isTablet ? "small" : "large"}
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record)}
                        title={t('admin_upgrades.edit')}
                        aria-label={t('admin_upgrades.edit')}
                        style={isTablet ? { padding: 0 } : {}}
                    />
                    <Popconfirm
                        title={t('admin_upgrades.delete_confirm')}
                        onConfirm={() => handleDelete(record.id)}
                        okText={t('admin_upgrades.delete')}
                        cancelText={t('admin_upgrades.cancel')}
                    >
                        <Button
                            type="link"
                            danger
                            size={isTablet ? "small" : "large"}
                            icon={<DeleteOutlined />}
                            title={t('admin_upgrades.delete')}
                            aria-label={t('admin_upgrades.delete')}
                            style={isTablet ? { padding: 0 } : {}}
                        />
                    </Popconfirm>
                </Space>
            ),
        }
    ];

    return (
        <div style={{ padding: isTablet ? 8 : 24 }}>
            <div style={{ marginBottom: 16, display: "flex", gap: 8, flexWrap: isTablet ? "wrap" : "nowrap" }}>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleAdd}
                    style={{ marginBottom: isTablet ? 8 : 16 }}
                >
                    {!isTablet && t('admin_upgrades.add_plan')}
                </Button>
            </div>
            <Table
                columns={columns}
                dataSource={plans}
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: isTablet ? 5 : 10 }}
                size={isTablet ? "small" : "middle"}
                scroll={isTablet ? { x: 400 } : undefined}
            />
            <Modal
                title={editingPlan ? t('admin_upgrades.edit_plan') : t('admin_upgrades.add_plan')}
                open={modalOpen}
                onOk={handleModalOk}
                onCancel={() => setModalOpen(false)}
                destroyOnHidden
                confirmLoading={loading}
            >
                {/* Đảm bảo Form nhận đúng prop form và mỗi Form.Item chỉ có 1 child */}
                <Form
                    form={form}
                    layout="vertical"
                    disabled={loading}
                >
                    <Form.Item
                        name="planName"
                        label={t('admin_upgrades.plan_name')}
                        rules={[
                            { required: true, message: t('admin_upgrades.validate_plan_name_required') },
                            { min: 3, message: t('admin_upgrades.validate_plan_name_min') }
                        ]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="planType"
                        label={t('admin_upgrades.plan_type')}
                        rules={[{ required: true, message: t('admin_upgrades.validate_plan_type_required') }]}
                    >
                        <Select options={PLAN_TYPE_OPTIONS} />
                    </Form.Item>
                    <Form.Item
                        name="price"
                        label={t('admin_upgrades.price')}
                        validateTrigger={['onChange', 'onBlur']}
                        rules={[
                            { required: true, message: t('admin_upgrades.validate_price_required') },
                            {
                                validator: (_, value) =>
                                    value && Number(value) >= 0.01
                                        ? Promise.resolve()
                                        : Promise.reject(new Error(t('admin_upgrades.validate_price_positive')))
                            }
                        ]}
                    >
                        <InputNumber min={0.01} step={0.01} style={{ width: "100%" }} />
                    </Form.Item>
                    <Form.Item
                        name="durationDay"
                        label={t('admin_upgrades.duration_days')}
                        rules={[
                            { required: true, message: t('admin_upgrades.validate_duration_required') },
                            { type: "number", min: 1, message: t('admin_upgrades.validate_duration_positive') }
                        ]}
                    >
                        <InputNumber min={1} style={{ width: "100%" }} />
                    </Form.Item>
                    <Form.Item
                        name="description"
                        label={t('admin_upgrades.description')}
                        rules={[
                            { required: true, message: t('admin_upgrades.validate_description_required') },
                            { min: 10, message: t('admin_upgrades.validate_description_min') }
                        ]}
                    >
                        <Input.TextArea rows={3} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}