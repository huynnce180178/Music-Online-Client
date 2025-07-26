import { useEffect, useState, useMemo } from "react";
import { Table, Input, Select, Tag, message, Grid, Modal, Button, Space } from "antd";
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
    const token = localStorage.getItem("accessToken");
    const screens = useBreakpoint();
    const isTablet = !screens.lg;

    useEffect(() => {
        fetchUsers({
            current: pagination.current,
            pageSize: pagination.pageSize,
            sortField: sorter.field,
            sortOrder: sorter.order,
            keyword,
        });
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
        `;
        document.head.appendChild(style);
        return () => document.head.removeChild(style);
    }, []);

    const fetchUsers = async (params = {}) => {
        setLoading(true);
        try {
            const res = await axios.get(`${BASE_API_URL}/admin/user`, {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    page: (params.current || 1) - 1,
                    limit: params.pageSize || 10,
                    sortBy: params.sortField || "id",
                    orderBy: params.sortOrder === "descend" ? "desc" : "asc",
                    keyword: params.keyword || "",
                },
            });
            const data = res.data;
            setUsers(data.content || []);
            setPagination({
                current: (data.number || 0) + 1,
                pageSize: data.size || 10,
                total: data.totalElements || 0,
            });
        } catch {
            setUsers([]);
            setPagination({ ...pagination, total: 0 });
        }
        setLoading(false);
    };

    const handleTableChange = (pagination, filters, sorterObj) => {
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
    };

    const debouncedSearch = useMemo(
        () =>
            debounce((value) => {
                fetchUsers({
                    current: 1,
                    pageSize: pagination.pageSize,
                    sortField: sorter.field,
                    sortOrder: sorter.order,
                    keyword: value,
                });
            }, 400),
        [pagination.pageSize, sorter.field, sorter.order]
    );

    const handleInputChange = (e) => {
        setKeyword(e.target.value);
        debouncedSearch(e.target.value);
    };

    const handleSearch = (value) => {
        setKeyword(value);
        fetchUsers({
            current: 1,
            pageSize: pagination.pageSize,
            sortField: sorter.field,
            sortOrder: sorter.order,
            keyword: value,
        });
    };

    const handleChangeStatus = async (id, status) => {
        try {
            await axios.patch(
                `${BASE_API_URL}/admin/user/changeStatus/${id}?status=${status}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            message.success("Status updated successfully!");
            fetchUsers({
                current: pagination.current,
                pageSize: pagination.pageSize,
                sortField: sorter.field,
                sortOrder: sorter.order,
                keyword,
            });
        } catch {
            message.error("Failed to update status!");
        }
    };

    const openEditRoleModal = (userId, roleNames) => {
        setEditUserId(userId);
        setEditRoleIds(getRoleIdsFromNames(roleNames || []));
        setEditModalOpen(true);
    };

    const handleSetRole = async () => {
        try {
            await axios.patch(
                `${BASE_API_URL}/admin/role/setRole/${editUserId}`,
                editRoleIds,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            message.success("Roles updated successfully!");
            setEditModalOpen(false);
            setEditUserId(null);
            setEditRoleIds([]);
            // Chỉ fetch lại users, không reload trang hoặc reset state toàn cục
            fetchUsers({
                current: pagination.current,
                pageSize: pagination.pageSize,
                sortField: sorter.field,
                sortOrder: sorter.order,
                keyword,
            });
        } catch {
            message.error("Failed to update roles!");
        }
    };

    const columns = [
        {
            title: "#",
            key: "index",
            align: "center",
            width: 50,
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
                    alt="avatar"
                    onError={(e) => {
                        e.target.src = '/default-avatar.png';
                    }}
                    style={{
                        width: isTablet ? 36 : 50,
                        height: isTablet ? 36 : 50,
                        borderRadius: "50%",
                        objectFit: "cover",
                        border: "2px solid #434760",
                    }}
                />
            ),
            width: isTablet ? 50 : 70,
            align: "center",
        },
        {
            title: t('admin_users.full_name'),
            align: "center",
            key: "fullName",
            render: (_, record) => `${record.firstName} ${record.lastName}`,
            width: isTablet ? 110 : 160,
        },
        {
            title: t('admin_users.email'),
            align: "center",
            dataIndex: "email",
            key: "email",
            width: isTablet ? 140 : 200,
            ellipsis: isTablet,
        },
        !isTablet && {
            title: "Roles",
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
                            }}
                        >
                            {t('admin_users.role_' + cleanedRole.toLowerCase(), cleanedRole)}
                        </Tag>
                    );
                }),
            width: 150,
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
                    }}
                >
                    {t('admin_users.status_' + text.toLowerCase(), text)}
                </Tag>
            ),
            width: isTablet ? 90 : 110,
        },
        {
            title: t('admin_users.action'),
            align: "center",
            key: "action",
            render: (_, record) => (
                <Select
                    value={record.status}
                    style={{ width: isTablet ? 90 : 120 }}
                    size={isTablet ? "small" : "middle"}
                    onChange={(value) => {
                        if (value !== record.status) {
                            handleChangeStatus(record.id, value);
                        }
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <Option value="VERIFY">Verify</Option>
                    <Option value="ACTIVE">Active</Option>
                    <Option value="BLOCKED">Blocked</Option>
                </Select>
            ),
            width: isTablet ? 100 : 130,
        },
        !isTablet && {
            title: "Set Role",
            align: "center",
            key: "setRole",
            render: (_, record) => (
                <Button
                    type="primary"
                    size="small"
                    style={{ borderRadius: 8, fontWeight: 500 }}
                    onClick={() => openEditRoleModal(record.id, record.roleNames)}
                >
                    Edit
                </Button>
            ),
            width: 90,
        },
    ].filter(Boolean);

    const renderEditRoleModal = () => (
        <Modal
            open={editModalOpen}
            title="Set Roles for User"
            onCancel={() => { setEditModalOpen(false); setEditUserId(null); setEditRoleIds([]); }}
            footer={null}
            centered
        >
            <div style={{ marginBottom: 16 }}>
                <Select
                    mode="multiple"
                    style={{ width: "100%" }}
                    value={editRoleIds}
                    onChange={setEditRoleIds}
                    options={ROLE_OPTIONS.map(r => ({ label: r.label, value: r.id }))}
                    placeholder="Select roles"
                />
            </div>
            <Space>
                <Button
                    type="primary"
                    onClick={handleSetRole}
                    disabled={editRoleIds.length === 0}
                >
                    Save
                </Button>
                <Button onClick={() => { setEditModalOpen(false); setEditUserId(null); setEditRoleIds([]); }}>
                    Cancel
                </Button>
            </Space>
        </Modal>
    );

    return (
        <div
            style={{
                padding: isTablet ? 8 : 16,
                maxWidth: 1200,
                margin: "0 auto",
            }}
        >
            <div
                style={{
                    display: "flex",
                    flexDirection: isTablet ? "column" : "row",
                    gap: isTablet ? 8 : 24,
                    alignItems: isTablet ? "stretch" : "center",
                    marginBottom: 16,
                }}
            >
                <Search
                    placeholder="Search by name or email"
                    onSearch={handleSearch}
                    onChange={handleInputChange}
                    style={{
                        width: isTablet ? "100%" : 320,
                        fontSize: isTablet ? 14 : 16,
                        borderRadius: 8,
                        background: "#181C2B",
                        border: "0",
                        borderWidth: 0,
                        boxShadow: "none",
                    }}
                    value={keyword}
                    size={isTablet ? "middle" : "large"}
                    allowClear
                    enterButton
                />
                {/* You can add more filters here if needed */}
            </div>
            <div style={{
                width: "100%",
                overflowX: isTablet ? "auto" : "visible",
                background: "#101426",
                borderRadius: 12,
                boxShadow: isTablet ? "none" : "0 2px 12px rgba(33,168,197,0.08)",
            }}>
                <Table
                    columns={columns}
                    dataSource={users}
                    pagination={{
                        ...pagination,
                        showSizeChanger: true,
                        pageSizeOptions: ["5", "10", "20", "50"],
                        position: isTablet ? ["bottomCenter"] : ["bottomRight"],
                    }}
                    loading={loading}
                    onChange={handleTableChange}
                    rowKey="id"
                    size={isTablet ? "small" : "middle"}
                    scroll={isTablet ? { x: 600 } : undefined}
                    style={{
                        minWidth: isTablet ? 600 : "auto",
                        fontSize: isTablet ? 13 : 15,
                    }}
                    locale={{
                        emptyText: (
                            <div style={{ color: '#888', padding: '20px' }}>
                                No users found
                            </div>
                        )
                    }}
                />
            </div>
            {renderEditRoleModal()}
        </div>
    );
}
