import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { Table, Input, Select, Tag, message, Grid, Modal, Button, Space, Spin } from "antd";
import axios from "axios";
import debounce from "lodash.debounce";
import { useTranslation } from 'react-i18next';
import BASE_API_URL from "../../services/base.api.url";

const { Search } = Input;
const { Option } = Select;
const { useBreakpoint } = Grid;

const STATUS_COLORS = {
    VERIFY: "#FAAD14",
    ACTIVE: "#52C41A",
    BLOCKED: "#FF4D4F",
};

const ROLE_COLORS = {
    ARTIST: "#36CFC9",
    USER: "#69C0FF",
    ADMIN: "#FF7875",
    PREMIUM: "#FFD666",
};

const ROLE_OPTIONS = [
    { id: 1, label: "ADMIN", value: 1, roleName: "ROLE_ADMIN" },
    { id: 2, label: "ARTIST", value: 2, roleName: "ROLE_ARTIST" },
    { id: 3, label: "USER", value: 3, roleName: "ROLE_USER" },
    { id: 4, label: "PREMIUM", value: 4, roleName: "ROLE_PREMIUM" },
];

function getRoleIdsFromNames(roleNames) {
    return roleNames
        .map(name => {
            const found = ROLE_OPTIONS.find(r => r.roleName === name);
            return found ? found.id : null;
        })
        .filter(Boolean);
}

export default function AdminUsers() {
    const { t } = useTranslation();
    const [users, setUsers] = useState([]);
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
    const [loading, setLoading] = useState(false);
    const [sorter, setSorter] = useState({ field: "id", order: "ascend" });
    const [keyword, setKeyword] = useState("");
    const [editUserId, setEditUserId] = useState(null);
    const [editRoleIds, setEditRoleIds] = useState([]);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [error, setError] = useState(null);
    const token = localStorage.getItem("accessToken");
    const screens = useBreakpoint();
    const isTablet = !screens.lg;
    const isMobile = screens.xs;
    
    // Use ref to prevent infinite loops
    const isInitialized = useRef(false);

    // Memoized fetch function to prevent unnecessary re-renders
    const fetchUsers = useCallback(async (params = {}) => {
        setLoading(true);
        setError(null);
        try {
            const res = await axios.get(`${BASE_API_URL}/api/v1/admin/user`, {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    page: (params.current || 1) - 1,
                    limit: params.pageSize || 10,
                    sortBy: params.sortField || "id",
                    orderBy: params.sortOrder === "descend" ? "desc" : "asc",
                    keyword: params.keyword || "",
                },
                timeout: 10000, // 10 second timeout
            });
            const data = res.data;
            setUsers(data.content || []);
            setPagination({
                current: (data.number || 0) + 1,
                pageSize: data.size || 10,
                total: data.totalElements || 0,
            });
        } catch (err) {
            console.error("Error fetching users:", err);
            setError(err.response?.data?.message || "Failed to load users");
            setUsers([]);
            setPagination(prev => ({ ...prev, total: 0 }));
            message.error("Failed to load users. Please try again.");
        } finally {
            setLoading(false);
        }
    }, [token]); // Remove pagination from dependencies

    // Optimized debounced search with useCallback and request cancellation
    const debouncedSearch = useMemo(
        () => {
            let timeoutId;
            let abortController = null;
            
            return (value) => {
                clearTimeout(timeoutId);
                
                // Cancel previous request if it exists
                if (abortController) {
                    abortController.abort();
                }
                
                // Create new abort controller
                abortController = new AbortController();
                
                timeoutId = setTimeout(() => {
                    fetchUsers({
                        current: 1,
                        pageSize: pagination.pageSize,
                        sortField: sorter.field,
                        sortOrder: sorter.order,
                        keyword: value,
                    });
                }, 500);
            };
        },
        [fetchUsers, pagination.pageSize, sorter.field, sorter.order]
    );

    const handleTableChange = useCallback((pagination, filters, sorterObj) => {
        const sortField = sorterObj.field || "id";
        const sortOrder = sorterObj.order || "ascend";
        setSorter({ field: sortField, order: sortOrder });
        fetchUsers({
            current: pagination.current,
            pageSize: pagination.pageSize,
            sortField,
            sortOrder,
            keyword,
        });
    }, [fetchUsers, keyword]);

    const handleInputChange = useCallback((e) => {
        const value = e.target.value;
        setKeyword(value);
        debouncedSearch(value);
    }, [debouncedSearch]);

    const handleSearch = useCallback((value) => {
        setKeyword(value);
        fetchUsers({
            current: 1,
            pageSize: pagination.pageSize,
            sortField: sorter.field,
            sortOrder: sorter.order,
            keyword: value,
        });
    }, [fetchUsers, pagination.pageSize, sorter.field, sorter.order]);

    const handleChangeStatus = useCallback(async (id, status) => {
        try {
            await axios.patch(
                `${BASE_API_URL}/api/v1/admin/user/changeStatus/${id}?status=${status}`,
                {},
                { 
                    headers: { Authorization: `Bearer ${token}` },
                    timeout: 5000
                }
            );
            message.success("Status updated successfully!");
            // Only refetch current page instead of full reload
            fetchUsers({
                current: pagination.current,
                pageSize: pagination.pageSize,
                sortField: sorter.field,
                sortOrder: sorter.order,
                keyword,
            });
        } catch (err) {
            console.error("Error updating status:", err);
            message.error("Failed to update status!");
        }
    }, [token, fetchUsers, pagination.current, pagination.pageSize, sorter.field, sorter.order, keyword]);

    const openEditRoleModal = useCallback((userId, roleNames) => {
        setEditUserId(userId);
        setEditRoleIds(getRoleIdsFromNames(roleNames || []));
        setEditModalOpen(true);
    }, []);

    const handleSetRole = useCallback(async () => {
        try {
            await axios.patch(
                `${BASE_API_URL}/api/v1/admin/role/setRole/${editUserId}`,
                editRoleIds,
                { 
                    headers: { Authorization: `Bearer ${token}` },
                    timeout: 5000
                }
            );
            message.success("Roles updated successfully!");
            setEditModalOpen(false);
            setEditUserId(null);
            setEditRoleIds([]);
            // Refetch current page
            fetchUsers({
                current: pagination.current,
                pageSize: pagination.pageSize,
                sortField: sorter.field,
                sortOrder: sorter.order,
                keyword,
            });
        } catch (err) {
            console.error("Error updating roles:", err);
            message.error("Failed to update roles!");
        }
    }, [editUserId, editRoleIds, token, fetchUsers, pagination.current, pagination.pageSize, sorter.field, sorter.order, keyword]);

    // Initial load - only run once
    useEffect(() => {
        if (!isInitialized.current) {
            isInitialized.current = true;
            fetchUsers({
                current: 1,
                pageSize: 10,
                sortField: "id",
                sortOrder: "ascend",
                keyword: "",
            });
        }
        
        // Cleanup function to clear any pending requests
        return () => {
            // Clear any pending requests when component unmounts
            if (window.AbortController) {
                // This will be handled by the debounced search cleanup
            }
        };
    }, []); // Empty dependency array - only run on mount

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            // Clear any pending requests when component unmounts
            isInitialized.current = false;
        };
    }, []);

    useEffect(() => {
        const style = document.createElement("style");
        style.innerHTML = `
        .ant-table { background-color: #101426 !important; color: #fff !important; }
        .ant-table-thead > tr > th { background-color: #181C2B !important; color: #fff !important; border-bottom: 2px solid #3ed8ff !important; }
        .ant-table-tbody > tr > td { background-color: #101426 !important; color: #fff !important; }
        .ant-table-tbody > tr:hover > td { background-color: #1f2233 !important; }
        .ant-tag { border: none !important; border-radius: 8px !important; padding: 2px 10px !important; }
        .ant-pagination-item { background-color: #101426 !important; border: 1px solid #434760 !important; }
        .ant-pagination-item a { color: #fff !important; }
        .ant-pagination-item-active { background-color: #434760 !important; border-color: #434760 !important; }
        .ant-pagination-item-active a { color: #fff !important; }
        .ant-pagination-prev, .ant-pagination-next, .ant-pagination-jump-prev, .ant-pagination-jump-next { color: #fff !important; }
        .ant-select-selector { background-color: #101426 !important; color: #fff !important; border: 1px solid #434760 !important; }
        .ant-select-arrow { color: #fff !important; }
        .ant-input, .ant-input-affix-wrapper { background-color: #101426 !important; color: #fff !important; border: 1px solid #434760 !important; }
        .ant-input::placeholder { color: #888 !important; }
        .ant-modal-content { background-color: #101426 !important; }
        .ant-modal-header { background-color: #181C2B !important; border-bottom: 1px solid #434760 !important; }
        .ant-modal-title { color: #fff !important; }
        .ant-modal-close-x { color: #fff !important; }
        .ant-select-dropdown { background-color: #101426 !important; }
        .ant-select-item { color: #fff !important; }
        .ant-select-item:hover { background-color: #1f2233 !important; }
        .ant-select-item-option-selected { background-color: #434760 !important; }
        .ant-empty-description { color: #888 !important; }
        .ant-select-selection-item-remove {
            color: #fff !important;
        }
        .ant-select-selection-item-remove:hover {
            color: #3ed8ff !important;
        }
        `;
        document.head.appendChild(style);
        return () => document.head.removeChild(style);
    }, []);

    const columns = [
        {
            title: "#",
            key: "index",
            align: "center",
            width: isMobile ? 40 : 50,
            render: (text, record, index) =>
                (pagination.current - 1) * pagination.pageSize + index + 1,
        },
        {
            title: t('admin_users.avatar'),
            dataIndex: "profileImage",
            key: "profileImage",
            render: (url) => (
                <img
                    src={url || '/default-avatar.png'}
                    alt={t('admin_users.avatar')}
                    onError={(e) => {
                        e.target.src = '/default-avatar.png';
                    }}
                    style={{
                        width: isMobile ? 28 : isTablet ? 36 : 50,
                        height: isMobile ? 28 : isTablet ? 36 : 50,
                        borderRadius: "50%",
                        objectFit: "cover",
                        border: "2px solid #434760",
                    }}
                />
            ),
            width: isMobile ? 40 : isTablet ? 50 : 70,
            align: "center",
        },
        {
            title: t('admin_users.full_name'),
            align: "center",
            key: "fullName",
            render: (_, record) => `${record.firstName} ${record.lastName}`,
            width: isMobile ? 80 : isTablet ? 110 : 160,
        },
        {
            title: t('admin_users.email'),
            align: "center",
            dataIndex: "email",
            key: "email",
            width: isMobile ? 100 : isTablet ? 140 : 200,
            ellipsis: true,
        },
        {
            title: t('admin_users.roles'),
            align: "center",
            dataIndex: "roleNames",
            key: "roleNames",
            render: (roles) =>
                roles.map((role) => {
                    const cleanedRole = role.replace("ROLE_", "");
                    return (
                        <Tag
                            key={role}
                            style={{
                                backgroundColor: ROLE_COLORS[cleanedRole] || "#d9d9d9",
                                color: "#181d36",
                                fontSize: isMobile ? 11 : 13,
                                padding: isMobile ? "1px 6px" : "2px 10px",
                                borderRadius: 8,
                            }}
                        >
                            {t('admin_users.role_' + cleanedRole.toLowerCase(), cleanedRole)}
                        </Tag>
                    );
                }),
            width: isMobile ? 90 : isTablet ? 120 : 150,
        },
        {
            title: t('admin_users.status'),
            align: "center",
            dataIndex: "status",
            key: "status",
            filters: [
                { text: t('admin_users.status_verify'), value: "VERIFY" },
                { text: t('admin_users.status_active'), value: "ACTIVE" },
                { text: t('admin_users.status_blocked'), value: "BLOCKED" },
            ],
            render: (text) => (
                <Tag
                    style={{
                        backgroundColor: STATUS_COLORS[text] || "#d9d9d9",
                        color: "#181d36",
                        fontSize: isMobile ? 11 : 13,
                        borderRadius: 8,
                        padding: isMobile ? "1px 6px" : "2px 10px",
                    }}
                >
                    {t('admin_users.status_' + text.toLowerCase(), text)}
                </Tag>
            ),
            width: isMobile ? 70 : isTablet ? 90 : 110,
        },
        {
            title: t('admin_users.action'),
            align: "center",
            key: "action",
            render: (_, record) => (
                <Select
                    value={record.status}
                    style={{ width: isMobile ? 70 : isTablet ? 90 : 120 }}
                    size={isMobile ? "small" : isTablet ? "small" : "middle"}
                    onChange={(value) => {
                        if (value !== record.status) {
                            handleChangeStatus(record.id, value);
                        }
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <Option value="VERIFY">{t('admin_users.status_verify')}</Option>
                    <Option value="ACTIVE">{t('admin_users.status_active')}</Option>
                    <Option value="BLOCKED">{t('admin_users.status_blocked')}</Option>
                </Select>
            ),
            width: isMobile ? 80 : isTablet ? 100 : 130,
        },
        {
            title: t('admin_users.action'),
            align: "center",
            key: "setRole",
            render: (_, record) => (
                <Button
                    type="primary"
                    size={isMobile ? "small" : "small"}
                    style={{
                        borderRadius: 8,
                        fontWeight: 500,
                        padding: isMobile ? "0 6px" : "0 12px",
                        fontSize: isMobile ? 12 : 14,
                    }}
                    onClick={() => openEditRoleModal(record.id, record.roleNames)}
                >
                    {t('admin_users.edit', 'Edit')}
                </Button>
            ),
            width: isMobile ? 60 : 90,
        },
    ];

    const renderEditRoleModal = () => (
        <Modal
            open={editModalOpen}
            title={t('admin_users.edit_role_title', 'Set Roles for User')}
            onCancel={() => { setEditModalOpen(false); setEditUserId(null); setEditRoleIds([]); }}
            footer={null}
            centered
            styles={{
                header: {
                    background: "#181C2B",
                    borderBottom: "1px solid #434760",
                },
                content: {
                    background: "#101426",
                },
                close: {
                    color: "#fff",
                }
            }}
            closeIcon={
                <span
                    style={{
                        color: "#fff",
                        fontSize: isMobile ? 18 : 20,
                        fontWeight: 700,
                        background: "transparent",
                    }}
                >
                    ×
                </span>
            }
            width={isMobile ? 320 : 400}
            bodyStyle={{
                padding: isMobile ? "16px 8px" : "24px 24px",
            }}
        >
            <div style={{ marginBottom: 16 }}>
                <Select
                    mode="multiple"
                    style={{ width: "100%" }}
                    value={editRoleIds}
                    onChange={setEditRoleIds}
                    options={ROLE_OPTIONS.map(r => ({
                        label: t('admin_users.role_' + r.label.toLowerCase(), r.label),
                        value: r.id
                    }))}
                    placeholder={t('admin_users.select_roles', 'Select roles')}
                    size={isMobile ? "small" : "middle"}
                    maxTagCount={isMobile ? 2 : 5}
                />
            </div>
            <Space>
                <Button
                    type="primary"
                    onClick={handleSetRole}
                    disabled={editRoleIds.length === 0}
                    size={isMobile ? "small" : "middle"}
                >
                    {t('admin_users.save', 'Save')}
                </Button>
                <Button
                    onClick={() => { setEditModalOpen(false); setEditUserId(null); setEditRoleIds([]); }}
                    size={isMobile ? "small" : "middle"}
                >
                    {t('admin_users.cancel', 'Cancel')}
                </Button>
            </Space>
        </Modal>
    );

    return (
        <div
            style={{
                padding: isMobile ? 4 : isTablet ? 8 : 16,
                maxWidth: 1200,
                margin: "0 auto",
            }}
        >
            <div
                style={{
                    display: "flex",
                    flexDirection: isMobile ? "column" : isTablet ? "column" : "row",
                    gap: isMobile ? 4 : isTablet ? 8 : 24,
                    alignItems: isMobile ? "stretch" : isTablet ? "stretch" : "center",
                    marginBottom: 16,
                }}
            >
                <Search
                    placeholder={t('admin_users.search_placeholder', 'Search by name or email')}
                    onSearch={handleSearch}
                    onChange={handleInputChange}
                    style={{
                        width: "100%",
                        fontSize: isMobile ? 12 : isTablet ? 14 : 16,
                        borderRadius: 8,
                        background: "#181C2B",
                        border: "0",
                        borderWidth: 0,
                        boxShadow: "none",
                    }}
                    value={keyword}
                    size={isMobile ? "small" : isTablet ? "middle" : "large"}
                    allowClear
                    enterButton
                />
            </div>
            <div style={{
                width: "100%",
                overflowX: "auto",
                background: "#101426",
                borderRadius: 12,
                boxShadow: isMobile ? "none" : isTablet ? "none" : "0 2px 12px rgba(33,168,197,0.08)",
            }}>
                <Table
                    columns={columns}
                    dataSource={users}
                    pagination={{
                        ...pagination,
                        showSizeChanger: true,
                        pageSizeOptions: ["5", "10", "20", "50"],
                        position: ["bottomCenter"],
                    }}
                    loading={loading}
                    onChange={handleTableChange}
                    rowKey="id"
                    size={isMobile ? "small" : isTablet ? "small" : "middle"}
                    scroll={{ x: isMobile ? 600 : isTablet ? 600 : undefined }}
                    style={{
                        minWidth: isMobile ? 600 : isTablet ? 600 : "auto",
                        fontSize: isMobile ? 11 : isTablet ? 13 : 15,
                    }}
                    locale={{
                        emptyText: (
                            <div style={{ color: '#888', padding: '20px' }}>
                                {t('admin_users.no_users_found', 'No users found')}
                            </div>
                        )
                    }}
                />
            </div>
            {renderEditRoleModal()}
        </div>
    );
}
