import { useEffect, useState } from "react";
import { Table, message, Grid, Empty, Button, Tag, Modal, Space } from "antd";
import axios from "axios";
import { CheckOutlined, CloseOutlined } from "@ant-design/icons";
import { useTranslation } from 'react-i18next';
import PropTypes from "prop-types";
import BASE_API_URL from "../../../services/base.api.url";

const { useBreakpoint } = Grid;

export default function AdminComments({ statusDefault }) {
    const { t } = useTranslation();
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(false);
    const [statusFilter, setStatusFilter] = useState(statusDefault || "ALL");
    const isTablet = !useBreakpoint().lg;

    const [actionId, setActionId] = useState(null);
    const [actionType, setActionType] = useState("");
    const [actionLoading, setActionLoading] = useState(false);

    const fetchReports = async (status) => {
        setLoading(true);
        try {
            const token = localStorage.getItem("accessToken");
            const config = { headers: { Authorization: `Bearer ${token}` } };
            let url = `${BASE_API_URL}/api/v1/admin/commentReport/getAll`;
            let params = { page: 0, limit: 100, sortBy: "id", orderBy: "asc" };
            if (status !== "ALL") {
                url = `${BASE_API_URL}/api/v1/admin/commentReport/getAllByStatus`;
                params = { status };
            }
            const res = await axios.get(url, {
                ...config,
                params,
            });
            console.log('Comment report API response:', res.data);
            let reportsArr = [];
            if (res.data.data) {
                if (Array.isArray(res.data.data)) {
                    reportsArr = res.data.data;
                } else if (Array.isArray(res.data.data.content)) {
                    reportsArr = res.data.data.content;
                }
            }
            setReports(reportsArr);
        } catch {
            message.error("Failed to load comment reports!");
            setReports([]);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchReports(statusFilter);
    }, [statusFilter]);

    useEffect(() => {
        if (statusDefault) setStatusFilter(statusDefault);
    }, [statusDefault]);

    useEffect(() => {
        const style = document.createElement("style");
        style.innerHTML = `
        /* Table dark mode */
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

        /* Select dark mode */
        .ant-select-selector {
            background-color: #101426 !important;
            color: #fff !important;
            border: 1px solid #434760 !important;
        }
        .ant-select-arrow {
            color: #fff !important;
        }
        .ant-select-dropdown {
            background-color: #181C2B !important;
        }
        .ant-select-item-option {
            color: #fff !important;
        }
        .ant-select-item-option-selected:not(.ant-select-item-option-disabled) {
            background-color: #434760 !important;
            color: #fff !important;
        }

        /* Empty state dark mode */
        .ant-empty-description {
            color: #999 !important;
        }
        .ant-empty-image {
            filter: invert(0.7);
        }

        /* ❗ Không override modal, input, button mặc định sáng */
        .ant-tag {
            border: none !important;
            border-radius: 8px !important;
            padding: 2px 10px !important;
            font-weight: 500;
        }
    `;
        document.head.appendChild(style);
        return () => document.head.removeChild(style);
    }, []);

    const showActionModal = (id, type) => {
        setActionId(id);
        setActionType(type);
    };

    const handleAction = async () => {
        setActionLoading(true);
        try {
            const token = localStorage.getItem("accessToken");
            let status = actionType === "approve" ? "RESOLVED" : "REJECTED";
            await axios.patch(
                `${BASE_API_URL}/api/v1/admin/commentReport/updateCommentReport/${actionId}`,
                {},
                { headers: { Authorization: `Bearer ${token}` }, params: { status } }
            );
            message.success(actionType === "approve" ? "Approved!" : "Rejected!");
            setActionId(null);
            setActionType("");
            fetchReports(statusFilter);
        } catch {
            message.error(actionType === "approve" ? "Failed to approve!" : "Failed to reject!");
        }
        setActionLoading(false);
    };

    const columns = [
        {
            title: "#",
            align: "center",
            render: (_, __, index) => index + 1,
            width: 50,
        },
        {
            title: t('admin_comments.reporter'),
            align: "center",
            dataIndex: "reportedByName",
            key: "reportedByName",
            width: 120,
        },
        {
            title: t('admin_comments.reported_user'),
            align: "center",
            dataIndex: "userReportedName",
            key: "userReportedName",
            width: 120,
        },
        {
            title: t('admin_comments.reason'),
            align: "center",
            dataIndex: "reason",
            key: "reason",
            width: 200,
            ellipsis: true,
        },
        // Nếu có statusDefault thì hiển thị cột Status và cột Actions như cũ, nhưng ẩn Actions nếu là REJECTED
        ...(statusDefault
            ? [
                {
                    title: t('admin_comments.status'),
                    align: "center",
                    dataIndex: "status",
                    key: "status",
                    render: (status) => {
                        let color = "";
                        let text = status;
                        if (status === "PENDING") {
                            color = "gold";
                            text = t('admin_comments.status_pending');
                        } else if (status === "RESOLVED") {
                            color = "green";
                            text = t('admin_comments.status_resolved');
                        } else if (status === "REJECTED") {
                            color = "red";
                            text = t('admin_comments.status_rejected');
                        }
                        return <Tag color={color}>{text}</Tag>;
                    },
                    width: 120,
                },
                // Chỉ hiển thị cột Actions nếu không phải là trang Rejected Comments
                ...(statusDefault !== "REJECTED"
                    ? [
                        {
                            title: t('admin_comments.actions'),
                            align: "center",
                            key: "actions",
                            render: (_, record) => (
                                <Space>
                                    {statusDefault === "PENDING" && (
                                        <>
                                            <Button
                                                type="primary"
                                                icon={<CheckOutlined />}
                                                size={isTablet ? "small" : "middle"}
                                                style={{ background: "#1677ff", border: "none" }}
                                                onClick={() => showActionModal(record.id, "approve")}
                                                aria-label={t('admin_comments.approve')}
                                            />
                                            <Button
                                                type="primary"
                                                icon={<CloseOutlined />}
                                                size={isTablet ? "small" : "middle"}
                                                style={{ background: "#ff4d4f", border: "none" }}
                                                onClick={() => showActionModal(record.id, "reject")}
                                                aria-label={t('admin_comments.reject')}
                                            />
                                        </>
                                    )}
                                    {statusDefault !== "PENDING" && (
                                        <span style={{ color: "#999" }}>
                                            {t('admin_comments.no_actions_available')}
                                        </span>
                                    )}
                                </Space>
                            ),
                            width: 180,
                        }
                    ]
                    : []
                ),
            ]
            // Nếu là All Comments (không có statusDefault), chỉ hiển thị cột Status
            : [
                {
                    title: t('admin_comments.status'),
                    align: "center",
                    dataIndex: "status",
                    key: "status",
                    render: (status) => {
                        let color = "";
                        let text = status;
                        if (status === "PENDING") {
                            color = "gold";
                            text = t('admin_comments.status_pending');
                        } else if (status === "RESOLVED") {
                            color = "green";
                            text = t('admin_comments.status_resolved');
                        } else if (status === "REJECTED") {
                            color = "red";
                            text = t('admin_comments.status_rejected');
                        }
                        return <Tag color={color}>{text}</Tag>;
                    },
                    width: 120,
                }
            ]
        ),
    ];

    return (
        <div style={{ padding: isTablet ? 8 : 16 }}>
            {/* Bỏ filter trạng thái ở trang All Comments */}
            <Table
                columns={columns}
                dataSource={reports}
                rowKey="id"
                loading={loading}
                pagination={false}
                size={isTablet ? "small" : "middle"}
                scroll={isTablet ? { x: 600 } : undefined}
                locale={{
                    emptyText: <Empty description={t('admin_comments.no_reports')} imageStyle={{ filter: "invert(0.7)" }} />,
                }}
                style={{ borderRadius: 12 }}
            />
            {/* Remove delete modal since backend doesn't support delete */}
            <Modal
                title={actionType === "approve" ? t('admin_comments.approve_modal_title') : t('admin_comments.reject_modal_title')}
                open={!!actionId}
                onCancel={() => { setActionId(null); setActionType(""); }}
                footer={[
                    <Button key="cancel" onClick={() => { setActionId(null); setActionType(""); }}>
                        {t('admin_comments.cancel')}
                    </Button>,
                    <Button
                        key="submit"
                        type="primary"
                        loading={actionLoading}
                        style={{ background: actionType === "approve" ? "#52c41a" : "#faad14", border: "none" }}
                        onClick={handleAction}
                    >
                        {t('admin_comments.confirm')}
                    </Button>,
                ]}
            >
                <p>{t('admin_comments.confirm_action', { action: t(actionType === "approve" ? 'admin_comments.approve' : 'admin_comments.reject') })}</p>
            </Modal>
        </div>
    );
}

// Thêm propTypes cho component
AdminComments.propTypes = {
    statusDefault: PropTypes.string,
};