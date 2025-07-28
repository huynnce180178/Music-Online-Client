import { useEffect, useState } from "react";
import { Avatar, Typography, Form, Input, Button, Upload, message, Modal } from "antd";
import { UserOutlined, EditOutlined, UploadOutlined, LockOutlined, MailOutlined, CalendarOutlined, InfoCircleOutlined, CloseOutlined } from "@ant-design/icons";
import axios from "axios";
import PropTypes from "prop-types";
import moment from "moment";
import { useTranslation } from 'react-i18next';
import BASE_API_URL from "../services/base.api.url";

const { Title } = Typography;

export default function ProfilePage({ isDrawer }) {
    const { t } = useTranslation();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [avatarFile, setAvatarFile] = useState(null);
    const [showChangePass, setShowChangePass] = useState(false);
    const [passLoading, setPassLoading] = useState(false);
    const [showSetPass, setShowSetPass] = useState(false);
    const [setPassModalLoading, setSetPassModalLoading] = useState(false);
    const [hasPassword, setHasPassword] = useState(true);
    const [subscription, setSubscription] = useState(null);

    // Form hooks
    const [editForm] = Form.useForm();
    const [changePassForm] = Form.useForm();
    const [setPassForm] = Form.useForm();

    const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");

    // Fetch profile & subscription on mount
    useEffect(() => {
        fetchProfile();
        fetchSubscription();
        checkHasPassword();
        // eslint-disable-next-line
    }, []);

    // Sync form data when editMode changes
    useEffect(() => {
        if (editMode && profile) {
            editForm.setFieldsValue({
                firstName: profile.firstName,
                lastName: profile.lastName,
                bio: profile.bio,
                dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth : null,
            });
        }
    }, [editMode, profile, editForm]);

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${BASE_API_URL}/api/v1/user/profile`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = res.data.data;
            setProfile(data);
        } catch (err) {
            message.error(t('profile.fetch_failed'));
        }
        setLoading(false);
    };

    const fetchSubscription = async () => {
        try {
            const res = await axios.get(`${BASE_API_URL}/api/v1/user/subscription`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Use the new response structure
            setSubscription(res.data.data);
        } catch (err) {
            setSubscription(null);
        }
    };

    const checkHasPassword = async () => {
        try {
            const res = await axios.get(`${BASE_API_URL}/api/v1/user/profile/hasPassword`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setHasPassword(res.data.data);
        } catch (err) {
            setHasPassword(true);
        }
    };

    const handleEdit = () => setEditMode(true);
    const handleAvatarChange = ({ file }) => setAvatarFile(file);

    const handleSave = async (values) => {
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append("firstName", values.firstName);
            formData.append("lastName", values.lastName);
            formData.append("bio", values.bio || "");
            if (avatarFile) {
                formData.append("file", avatarFile);
            }
            if (values.dateOfBirth) {
                formData.append("dateOfBirth", moment(values.dateOfBirth).format("YYYY-MM-DD"));
            }
            await axios.post(`${BASE_API_URL}/api/v1/user/profile/update`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            message.success(t('profile.update_success'));
            setEditMode(false);
            setAvatarFile(null);
            fetchProfile();
        } catch (err) {
            message.error(err.response?.data?.data || t('profile.update_failed'));
        }
        setLoading(false);
    };

    const handleChangePassword = async (values) => {
        setPassLoading(true);
        try {
            await axios.patch(`${BASE_API_URL}/api/v1/user/profile/changePassWord`, null, {
                params: {
                    oldPassword: values.oldPassword,
                    newPassword: values.newPassword
                },
                headers: { Authorization: `Bearer ${token}` }
            });
            message.success(t('profile.change_password_success'));
            setShowChangePass(false);
            changePassForm.resetFields();
        } catch (err) {
            message.error(err.response?.data?.data || t('profile.change_password_failed'));
        }
        setPassLoading(false);
    };

    const handleSetPassword = async (values) => {
        setSetPassModalLoading(true);
        try {
            await axios.patch(`${BASE_API_URL}/api/v1/user/profile/setPassword`, null, {
                params: { newPassword: values.newPassword },
                headers: { Authorization: `Bearer ${token}` }
            });
            message.success(t('profile.set_password_success'));
            setShowSetPass(false);
            setHasPassword(true);
            setPassForm.resetFields();
        } catch (err) {
            message.error(err.response?.data?.data || t('profile.set_password_failed'));
        }
        setSetPassModalLoading(false);
    };

    if (!profile) return <div style={{ color: "#fff", textAlign: "center", marginTop: 80 }}>{t('profile.loading')}</div>;

    // Profile Content Component
    const ProfileContent = (
        <div
            style={{
                width: "100%",
                minHeight: "100%",
                background: "linear-gradient(135deg, #181c2b 80%, #23243a 100%)",
                padding: isDrawer ? "0" : "48px 0 36px 0",
                color: "#fff",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-start",
                position: "relative",
                overflow: "hidden",
            }}
        >
            {/* Music notes overlay */}
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    pointerEvents: "none",
                    background: "url('/music-notes.svg') repeat",
                    opacity: 0.07,
                    zIndex: 0,
                }}
            />
            <div
                style={{
                    background: "rgba(36,41,56,0.85)",
                    borderRadius: 24,
                    boxShadow: "0 4px 32px 0 rgba(21,21,30,0.18)",
                    padding: "38px 32px 28px 32px",
                    maxWidth: 420,
                    width: "100%",
                    marginTop: 24,
                    position: "relative",
                    zIndex: 1,
                    backdropFilter: "blur(6px)",
                    border: "1.5px solid #23243a",
                }}
            >
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div
                        style={{
                            boxShadow: "0 0 0 6px rgba(33,168,197,0.18)",
                            borderRadius: "50%",
                            marginBottom: 14,
                        }}
                    >
                        <Avatar
                            size={110}
                            src={profile.profileImage}
                            icon={<UserOutlined />}
                            style={{
                                border: "3px solid #21A8C5",
                                background: "#23243a",
                                boxShadow: "0 0 18px 2px #21A8C5",
                            }}
                        />
                    </div>
                    <Title
                        level={3}
                        style={{
                            color: "#fff",
                            marginBottom: 0,
                            fontWeight: 900,
                            textAlign: "center",
                            letterSpacing: 1.2,
                            fontFamily: "'Montserrat', 'Roboto', sans-serif",
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                        }}
                    >
                        {profile.firstName} {profile.lastName}
                        <span>
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="#21A8C5" style={{ verticalAlign: "middle" }}>
                                <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
                            </svg>
                        </span>
                    </Title>
                    <div style={{ color: "#8f9bb3", margin: "10px 0 0 0", textAlign: "center", fontSize: 16 }}>
                        <MailOutlined style={{ marginRight: 8, color: "#21A8C5" }} />
                        {profile.email}
                    </div>
                    <div style={{ color: "#8f9bb3", marginTop: 2, fontSize: 15 }}>
                        <CalendarOutlined style={{ marginRight: 8, color: "#21A8C5" }} />
                        {t('profile.created')}: {profile.createdAt?.slice(0, 10)}
                    </div>
                    <div style={{ color: "#8f9bb3", fontSize: 15 }}>
                        <CalendarOutlined style={{ marginRight: 8, color: "#21A8C5" }} />
                        {t('profile.updated')}: {profile.updatedAt?.slice(0, 10)}
                    </div>
                    <div style={{ color: "#8f9bb3", fontSize: 15 }}>
                        <UserOutlined style={{ marginRight: 8, color: "#21A8C5" }} />
                        {t('profile.age')}: {profile.age || t('profile.na')}
                    </div>
                    {/* Subscription info */}
                    <div style={{ color: "#8f9bb3", marginTop: 8, fontSize: 15 }}>
                        <span style={{ marginRight: 8, color: "#21A8C5" }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="#21A8C5"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 17.93V20a8 8 0 01-7.93-7H4a8 8 0 017-7.93V4a8 8 0 017.93 7H20a8 8 0 01-7 7.93z" /></svg>
                        </span>
                        <b>{t('profile.subscription')}:</b>{" "}
                        {subscription ? (
                            <>
                                {subscription.plan || t('profile.subscription_unknown')}
                                {" ("}
                                {subscription.status || t('profile.subscription_status_unknown')}
                                {")"}
                                <br />
                                <span style={{ color: "#b6eafe", fontWeight: 600 }}>
                                    {t('profile.subscription_details')}
                                </span>
                                <br />
                                <span style={{ color: "#b6eafe" }}>
                                    {t('profile.start_time')}: {subscription.startTime}
                                    <br />
                                    {t('profile.end_time')}: {subscription.endTime}
                                    <br />
                                    {t('profile.days_remaining')}: {
                                        subscription.daysRemaining === 0 && subscription.status !== "ACTIVE"
                                            ? t('profile.expired')
                                            : subscription.daysRemaining === -1
                                                ? t('profile.forever')
                                                : `${subscription.daysRemaining} ${t('profile.days_left')}`
                                    }
                                </span>
                            </>
                        ) : (
                            t('profile.subscription_none')
                        )}
                    </div>
                    <div
                        style={{
                            background: "rgba(33,168,197,0.13)",
                            borderRadius: 12,
                            padding: "14px 16px",
                            margin: "28px 0 18px 0",
                            color: "#b1eaff",
                            fontStyle: "italic",
                            fontSize: 16,
                            width: "100%",
                            textAlign: "center",
                            boxShadow: "0 2px 12px 0 rgba(21,21,30,0.10)",
                            border: "1px solid #21A8C5",
                            minHeight: 48,
                            transition: "background 0.3s",
                        }}
                    >
                        <InfoCircleOutlined style={{ marginRight: 10 }} />
                        {profile.bio || <span style={{ color: "#758cad" }}>{t('profile.no_bio')}</span>}
                    </div>
                    <Button
                        icon={<EditOutlined />}
                        onClick={handleEdit}
                        disabled={editMode}
                        size="large"
                        style={{
                            borderRadius: 12,
                            background: "linear-gradient(90deg, #21A8C5 60%, #1b324a 100%)",
                            color: "#fff",
                            fontWeight: 700,
                            border: "none",
                            width: "100%",
                            maxWidth: 340,
                            marginBottom: 12,
                            fontSize: 17,
                            boxShadow: "0 2px 8px 0 rgba(33,168,197,0.13)",
                            transition: "background 0.2s, box-shadow 0.2s",
                        }}
                        block
                    >{t('profile.edit_profile')}</Button>
                    <Button
                        icon={<LockOutlined />}
                        onClick={() => setShowChangePass(true)}
                        disabled={!hasPassword}
                        size="large"
                        style={{
                            borderRadius: 12,
                            background: "#222b3a",
                            color: "#fff",
                            fontWeight: 700,
                            border: "none",
                            width: "100%",
                            maxWidth: 340,
                            marginBottom: 8,
                            fontSize: 17,
                            boxShadow: "0 2px 8px 0 rgba(21,21,30,0.10)",
                            transition: "background 0.2s, box-shadow 0.2s",
                        }}
                        block
                    >{t('profile.change_password')}</Button>
                    {!hasPassword && (
                        <Button
                            type="primary"
                            onClick={() => setShowSetPass(true)}
                            size="large"
                            style={{
                                borderRadius: 12,
                                width: "100%",
                                maxWidth: 340,
                                background: "linear-gradient(90deg, #21A8C5 60%, #1b324a 100%)",
                                fontWeight: 700,
                                fontSize: 17,
                                marginBottom: 8,
                            }}
                            block
                        >{t('profile.set_password')}</Button>
                    )}
                </div>
                {editMode && (
                    <Form
                        form={editForm}
                        layout="vertical"
                        style={{
                            marginTop: 24,
                            width: "100%",
                            maxWidth: 400,
                            background: "rgba(36,41,56,0.97)",
                            borderRadius: 18,
                            padding: "32px 20px 18px 20px",
                            boxShadow: "0 2px 18px 0 rgba(21,21,30,0.13)",
                            display: "flex",
                            flexDirection: "column",
                            gap: 0,
                            animation: "fadeIn 0.4s",
                        }}
                        onFinish={handleSave}
                    >
                        <Form.Item
                            name="firstName"
                            label={<span style={{ color: "#b6eafe", fontWeight: 600 }}>{t('profile.first_name')}</span>}
                            rules={[{ required: true, message: t('profile.first_name_required') }]}
                            style={{ marginBottom: 14 }}
                        >
                            <Input
                                size="large"
                                placeholder={t('profile.first_name_placeholder')}
                                style={{
                                    background: "#23253a",
                                    color: "#fff",
                                    borderRadius: 8,
                                    border: "1px solid #23253a"
                                }}
                            />
                        </Form.Item>
                        <Form.Item
                            name="lastName"
                            label={<span style={{ color: "#b6eafe", fontWeight: 600 }}>{t('profile.last_name')}</span>}
                            style={{ marginBottom: 14 }}
                        >
                            <Input
                                size="large"
                                placeholder={t('profile.last_name_placeholder')}
                                style={{
                                    background: "#23253a",
                                    color: "#fff",
                                    borderRadius: 8,
                                    border: "1px solid #23253a"
                                }}
                            />
                        </Form.Item>
                        <Form.Item
                            name="bio"
                            label={<span style={{ color: "#b6eafe", fontWeight: 600 }}>{t('profile.bio')}</span>}
                            style={{ marginBottom: 14 }}
                        >
                            <Input.TextArea
                                rows={3}
                                placeholder={t('profile.bio_placeholder')}
                                autoSize={{ minRows: 3, maxRows: 4 }}
                                style={{
                                    background: "#23253a",
                                    color: "#fff",
                                    borderRadius: 8,
                                    border: "1px solid #23253a"
                                }}
                            />
                        </Form.Item>
                        <Form.Item
                            name="dateOfBirth"
                            label={<span style={{ color: "#b6eafe", fontWeight: 600 }}>{t('profile.date_of_birth')}</span>}
                            style={{ marginBottom: 14 }}
                            rules={[
                                {
                                    validator(_, value) {
                                        if (!value) return Promise.resolve();
                                        if (moment(value).isAfter(moment(), "day")) {
                                            return Promise.reject(new Error(t('profile.dob_future')));
                                        }
                                        return Promise.resolve();
                                    },
                                },
                            ]}
                        >
                            <Input
                                type="date"
                                size="large"
                                style={{
                                    background: "#23253a",
                                    color: "#fff",
                                    borderRadius: 8,
                                    border: "1px solid #23253a"
                                }}
                            />
                        </Form.Item>
                        <Form.Item
                            label={<span style={{ color: "#b6eafe", fontWeight: 600 }}>{t('profile.avatar')}</span>}
                            style={{ marginBottom: 18 }}
                        >
                            <Upload
                                beforeUpload={() => false}
                                maxCount={1}
                                showUploadList={true}
                                onChange={handleAvatarChange}
                                accept="image/*"
                                style={{ width: "100%" }}
                            >
                                <Button
                                    icon={<UploadOutlined />}
                                    style={{
                                        borderRadius: 8,
                                        background: "#23253a",
                                        color: "#b6eafe",
                                        border: "1px solid #1b324a"
                                    }}
                                >
                                    {t('profile.change_avatar')}
                                </Button>
                            </Upload>
                        </Form.Item>
                        <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={loading}
                                style={{
                                    marginRight: 8,
                                    borderRadius: 8,
                                    fontWeight: 600,
                                    padding: "0 22px"
                                }}
                            >
                                {t('profile.save')}
                            </Button>
                            <Button onClick={() => setEditMode(false)}>{t('profile.cancel')}</Button>
                        </Form.Item>
                    </Form>
                )}
            </div>
        </div>
    );

    if (isDrawer) {
        return (
            <>
                {ProfileContent}
                <Modal
                    open={showChangePass}
                    onCancel={() => setShowChangePass(false)}
                    footer={null}
                    title={t('profile.change_password')}
                    destroyOnClose
                >
                    <Form layout="vertical" onFinish={handleChangePassword} form={changePassForm}>
                        <Form.Item
                            name="oldPassword"
                            label={t('profile.old_password')}
                            rules={[{ required: true, message: t('profile.old_password_required') }]}
                        >
                            <Input.Password />
                        </Form.Item>
                        <Form.Item
                            name="newPassword"
                            label={t('profile.new_password')}
                            rules={[
                                { required: true, message: t('profile.new_password_required') },
                                { min: 6, message: t('profile.password_min_length') }
                            ]}
                        >
                            <Input.Password />
                        </Form.Item>
                        <Form.Item>
                            <Button type="primary" htmlType="submit" loading={passLoading} block>
                                {t('profile.change_password')}
                            </Button>
                        </Form.Item>
                    </Form>
                </Modal>
                <Modal
                    open={showSetPass}
                    onCancel={() => setShowSetPass(false)}
                    footer={null}
                    title={t('profile.set_password')}
                    destroyOnClose
                >
                    <Form layout="vertical" onFinish={handleSetPassword} form={setPassForm}>
                        <Form.Item
                            name="newPassword"
                            label={t('profile.new_password')}
                            rules={[
                                { required: true, message: t('profile.new_password_required') },
                                { min: 6, message: t('profile.password_min_length') }
                            ]}
                        >
                            <Input.Password />
                        </Form.Item>
                        <Form.Item
                            name="confirm"
                            label={t('profile.confirm_password')}
                            dependencies={['newPassword']}
                            hasFeedback
                            rules={[
                                { required: true, message: t('profile.confirm_password_required') },
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        if (!value || getFieldValue('newPassword') === value) {
                                            return Promise.resolve();
                                        }
                                        return Promise.reject(new Error(t('profile.passwords_do_not_match')));
                                    },
                                }),
                            ]}
                        >
                            <Input.Password />
                        </Form.Item>
                        <Form.Item>
                            <Button type="primary" htmlType="submit" loading={setPassModalLoading} block>
                                {t('profile.set_password')}
                            </Button>
                        </Form.Item>
                    </Form>
                </Modal>
            </>
        );
    }

    return (
        <>
            {isDrawer ? (
                <div style={{ width: "100%", height: "100%", overflow: "auto", background: "transparent" }}>
                    {ProfileContent}
                </div>
            ) : (
                <div style={{
                    background: "#181c2b",
                    minHeight: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                }}>
                    <div style={{
                        background: "linear-gradient(135deg, #181c2b 70%, #23243a 100%)",
                        borderRadius: "2rem",
                        boxShadow: "0 8px 32px 0 rgba(21, 21, 30, 0.19)",
                        padding: "40px 38px",
                        minWidth: 340,
                        maxWidth: 480,
                        margin: 0,
                        color: "#fff"
                    }}>
                        {ProfileContent}
                    </div>
                </div>
            )}
            <Modal
                open={showChangePass}
                onCancel={() => setShowChangePass(false)}
                footer={null}
                title={<span style={{ color: "#222b3a" }}>{t('profile.change_password')}</span>}
                destroyOnClose
                closeIcon={<CloseOutlined style={{ color: "#222b3a", fontSize: 18 }} />}
            >
                <Form
                    form={changePassForm}
                    layout="vertical"
                    onFinish={handleChangePassword}
                >
                    <Form.Item
                        name="oldPassword"
                        label={t('profile.old_password')}
                        rules={[{ required: true, message: t('profile.old_password_required') }]}
                    >
                        <Input.Password />
                    </Form.Item>
                    <Form.Item
                        name="newPassword"
                        label={t('profile.new_password')}
                        rules={[
                            { required: true, message: t('profile.new_password_required') },
                            { min: 6, message: t('profile.password_min_length') }
                        ]}
                    >
                        <Input.Password />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={passLoading} block>
                            {t('profile.change_password')}
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
            <Modal
                open={showSetPass}
                onCancel={() => setShowSetPass(false)}
                footer={null}
                title={<span style={{ color: "#222b3a" }}>{t('profile.set_password')}</span>}
                destroyOnClose
                closeIcon={<CloseOutlined style={{ color: "#222b3a", fontSize: 18 }} />}
            >
                <Form
                    form={setPassForm}
                    layout="vertical"
                    onFinish={handleSetPassword}
                >
                    <Form.Item
                        name="newPassword"
                        label={t('profile.new_password')}
                        rules={[
                            { required: true, message: t('profile.new_password_required') },
                            { min: 6, message: t('profile.password_min_length') }
                        ]}
                    >
                        <Input.Password />
                    </Form.Item>
                    <Form.Item
                        name="confirm"
                        label={t('profile.confirm_password')}
                        dependencies={['newPassword']}
                        hasFeedback
                        rules={[
                            { required: true, message: t('profile.confirm_password_required') },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (!value || getFieldValue('newPassword') === value) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(new Error(t('profile.passwords_do_not_match')));
                                },
                            }),
                        ]}
                    >
                        <Input.Password />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={setPassModalLoading} block>
                            {t('profile.set_password')}
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
        </>
    );
}

ProfilePage.propTypes = {
    isDrawer: PropTypes.bool,
    onClose: PropTypes.func,
};