import { useState, useEffect } from "react";
import { message, Input, Button, Modal, Select, Avatar, Tooltip } from "antd";
import axios from "axios";
import PropTypes from "prop-types";
import {
    UserOutlined, EditOutlined, DeleteOutlined, FlagOutlined,
    LikeOutlined, CommentOutlined, SendOutlined, CloseOutlined
} from "@ant-design/icons";
import { useTranslation } from 'react-i18next';
import BASE_API_URL from "../services/base.api.url";

const { Option } = Select;

const REPORT_OPTIONS = [
    { value: "SPAM", label: "Spam" },
    { value: "OFFENSIVE", label: "Offensive language" },
    { value: "HARASSMENT", label: "Harassment" },
    { value: "OTHER", label: "Other" }
];

const REACTION_ICONS = {
    LIKE: <span role="img" aria-label="like" style={{ fontSize: 18 }}>👍</span>,
    HEART: <span role="img" aria-label="heart" style={{ fontSize: 18 }}>❤️</span>,
    HAHA: <span role="img" aria-label="haha" style={{ fontSize: 18 }}>😂</span>,
    WOW: <span role="img" aria-label="wow" style={{ fontSize: 18 }}>😮</span>,
    SAD: <span role="img" aria-label="sad" style={{ fontSize: 18 }}>😢</span>,
    ANGRY: <span role="img" aria-label="angry" style={{ fontSize: 18 }}>😡</span>,
};

function RenderComment({
    comment,
    level = 0,
    setReplyTo,
    currentUser,
    reloadComments,
    onReport
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(comment.content);
    const [reacting, setReacting] = useState(false);
    const [reactions, setReactions] = useState(comment.reactionCounts || []);
    const [showReactions, setShowReactions] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const isMine = currentUser && comment.username === currentUser;

    // Update comment
    const handleUpdate = async () => {
        if (!editContent.trim()) return;
        try {
            const token = localStorage.getItem("accessToken");
            await axios.put(
                `${BASE_API_URL}/api/v1/comments/${comment.id}?content=${encodeURIComponent(editContent)}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setIsEditing(false);
            reloadComments();
            message.success("Comment updated!");
        } catch {
            message.error("Failed to update comment!");
        }
    };

    // Delete comment
    const handleDelete = async () => {
        setShowDeleteConfirm(false);
        try {
            const token = localStorage.getItem("accessToken");
            await axios.delete(
                `${BASE_API_URL}/api/v1/comments/${comment.id}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            message.success("Comment deleted!");
            reloadComments();
        } catch {
            message.error("Failed to delete comment!");
        }
    };

    // React to comment
    const handleReaction = async (type) => {
        setReacting(true);
        try {
            const token = localStorage.getItem("accessToken");
            const res = await axios.post(
                `${BASE_API_URL}/api/v1/reactions/${comment.id}?type=${type}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setReactions(res.data.data || []);
            reloadComments();
        } catch {
            message.error("Failed to react!");
        }
        setReacting(false);
    };

    const reactionSummary = reactions
        .filter(r => r.count > 0)
        .map(r => ({
            type: r.type,
            count: r.count,
            icon: REACTION_ICONS[r.type]
        }));

    const bgColors = [
        "rgba(255,255,255,0.03)",
        "rgba(62,216,255,0.06)",
        "rgba(62,216,255,0.03)"
    ];
    const borderColors = [
        "rgba(62,216,255,0.10)",
        "rgba(62,216,255,0.18)",
        "rgba(62,216,255,0.08)"
    ];

    return (
        <div
            style={{
                marginLeft: level ? 20 + (level - 1) * 12 : 0,
                marginBottom: 14,
                background: bgColors[level % bgColors.length],
                borderRadius: 12,
                border: `1px solid ${borderColors[level % borderColors.length]}`,
                padding: "14px 16px",
                boxShadow: level === 0 ? "0 2px 8px #3ed8ff11" : "none",
                transition: "background 0.2s"
            }}
        >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 2 }}>
                <Avatar
                    style={{
                        background: "#eaf6fb",
                        color: "#29aaff",
                        fontWeight: 700,
                        fontSize: 16,
                        border: "1.5px solid #3ed8ff33"
                    }}
                    size={32}
                    icon={<UserOutlined />}
                >
                    {comment.username?.charAt(0).toUpperCase()}
                </Avatar>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ color: "#23283e", fontWeight: 600, fontSize: 15, marginRight: 8 }}>
                        {comment.username}
                    </span>
                    <span style={{ color: "#8ca0c6", fontSize: 12 }}>
                        {comment.createdAt}
                    </span>
                </div>
                <div style={{ display: "flex", gap: 2 }}>
                    {isMine ? (
                        <>
                            <Tooltip title={isEditing ? "Cancel" : "Edit"}>
                                <Button
                                    size="small"
                                    type="text"
                                    icon={isEditing ? <CloseOutlined /> : <EditOutlined />}
                                    style={{ color: "#ffb300" }}
                                    onClick={() => setIsEditing(!isEditing)}
                                />
                            </Tooltip>
                            <Tooltip title="Delete">
                                <Button
                                    size="small"
                                    type="text"
                                    icon={<DeleteOutlined />}
                                    style={{ color: "#ff4d4f" }}
                                    onClick={() => setShowDeleteConfirm(true)}
                                />
                            </Tooltip>
                            <Modal
                                open={showDeleteConfirm}
                                onOk={handleDelete}
                                onCancel={() => setShowDeleteConfirm(false)}
                                okText="Delete"
                                okButtonProps={{ danger: true }}
                                cancelText="Cancel"
                                title="Confirm Delete"
                                zIndex={4000}
                            >
                                <div>Are you sure you want to delete this comment?</div>
                            </Modal>
                        </>
                    ) : (
                        <Tooltip title="Report">
                            <Button
                                size="small"
                                type="text"
                                icon={<FlagOutlined />}
                                style={{ color: "#ff416c" }}
                                onClick={() => onReport(comment)}
                            />
                        </Tooltip>
                    )}
                </div>
            </div>
            {isEditing ? (
                <div style={{ marginBottom: 8 }}>
                    <Input.TextArea
                        value={editContent}
                        onChange={e => setEditContent(e.target.value)}
                        autoSize={{ minRows: 2, maxRows: 4 }}
                        style={{ marginBottom: 8, borderRadius: 8, fontSize: 15 }}
                    />
                    <Button
                        type="primary"
                        size="small"
                        icon={<SendOutlined />}
                        onClick={handleUpdate}
                        disabled={!editContent.trim()}
                        style={{ marginRight: 8 }}
                    >
                        Save
                    </Button>
                    <Button
                        size="small"
                        onClick={() => setIsEditing(false)}
                    >
                        Cancel
                    </Button>
                </div>
            ) : (
                <div style={{
                    color: "#23283e",
                    fontSize: 15,
                    lineHeight: 1.7,
                    marginBottom: 8,
                    wordBreak: "break-word"
                }}>
                    {comment.content}
                </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Tooltip title="Reply">
                    <Button
                        size="middle"
                        type="text"
                        icon={<CommentOutlined style={{ fontSize: 16 }} />}
                        style={{ 
                            color: "#29aaff",
                            minWidth: 40,
                            minHeight: 40,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                        }}
                        onClick={() => setReplyTo(comment)}
                    />
                </Tooltip>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    {reactionSummary.length > 0 && (
                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            background: "#eaf6fb",
                            borderRadius: 16,
                            padding: "0 8px",
                            fontWeight: 600,
                            fontSize: 15,
                            minHeight: 28
                        }}>
                            {reactionSummary.map(r => (
                                <span key={r.type} style={{ display: "flex", alignItems: "center", marginRight: 6 }}>
                                    {r.icon}
                                    <span style={{ marginLeft: 2, color: "#23283e" }}>{r.count}</span>
                                </span>
                            ))}
                        </div>
                    )}
                    <div style={{ position: "relative", display: "inline-block" }}>
                        <Button
                            size="middle"
                            type="text"
                            style={{
                                color: "#3ed8ff",
                                background: "#eaf6fb",
                                borderRadius: 16,
                                fontWeight: 600,
                                padding: "0 12px",
                                height: 36,
                                minWidth: 40
                            }}
                            onClick={() => setShowReactions(v => !v)}
                        >
                            <LikeOutlined style={{ fontSize: 16 }} />
                        </Button>
                        {showReactions && (
                            <div
                                style={{
                                    position: "absolute",
                                    top: 36,
                                    left: 0,
                                    background: "#fff",
                                    border: "1px solid #eaf6fb",
                                    borderRadius: 12,
                                    boxShadow: "0 2px 8px #3ed8ff22",
                                    padding: "8px 10px",
                                    zIndex: 10,
                                    display: "flex",
                                    gap: 6
                                }}
                                onMouseLeave={() => setShowReactions(false)}
                            >
                                {Object.keys(REACTION_ICONS).map(type => (
                                    <Button
                                        key={type}
                                        size="small"
                                        type="text"
                                        icon={REACTION_ICONS[type]}
                                        loading={reacting}
                                        onClick={() => {
                                            handleReaction(type);
                                            setShowReactions(false);
                                        }}
                                        style={{
                                            color: "#23283e",
                                            fontSize: 18,
                                            background: "none",
                                            border: "none"
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {comment.replies && comment.replies.length > 0 && (
                <div style={{ marginTop: 8 }}>
                    {comment.replies.map(child => (
                        <RenderComment
                            key={child.id}
                            comment={child}
                            level={level + 1}
                            setReplyTo={setReplyTo}
                            currentUser={currentUser}
                            reloadComments={reloadComments}
                            onReport={onReport}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

RenderComment.propTypes = {
    comment: PropTypes.object.isRequired,
    level: PropTypes.number,
    setReplyTo: PropTypes.func.isRequired,
    currentUser: PropTypes.string,
    reloadComments: PropTypes.func.isRequired,
    onReport: PropTypes.func.isRequired,
};

export default function CommentTab({ songId, currentUser }) {
    const { t } = useTranslation();
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [replyTo, setReplyTo] = useState(null);

    const [reportingComment, setReportingComment] = useState(null);
    const [reportReason, setReportReason] = useState("SPAM");
    const [customReason, setCustomReason] = useState("");
    const [reporting, setReporting] = useState(false);

    const fetchComments = async () => {
        try {
            const res = await axios.get(`${BASE_API_URL}/api/v1/comments/song/${songId}`);
            setComments(Array.isArray(res.data) ? res.data : []);
        } catch {
            setComments([]);
        }
    };

    useEffect(() => {
        fetchComments();
    }, [songId]);

    const handleSubmitComment = async (replyToCommentId = null) => {
        if (!newComment.trim()) return;
        const token = localStorage.getItem("accessToken");
        if (!token) {
            message.error("You need to login to comment.");
            return;
        }
        setSubmitting(true);
        try {
            await axios.post(`${BASE_API_URL}/api/v1/comments`, {
                songId: Number(songId),
                content: newComment,
                parentId: replyToCommentId
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNewComment("");
            setReplyTo(null);
            await fetchComments();
            message.success("Comment posted!");
        } catch (err) {
            message.error(
                err?.response?.data?.data ||
                err?.response?.data?.message ||
                "Failed to post comment!"
            );
        }
        setSubmitting(false);
    };

    const handleReport = async () => {
        const token = localStorage.getItem("accessToken");
        if (!token) {
            message.error("You need to login to report a comment.");
            setReportingComment(null);
            return;
        }
        if (!reportingComment) return;
        if (reportReason === "OTHER" && !customReason.trim()) {
            message.error("Please enter your specific reason.");
            return;
        }
        setReporting(true);
        try {
            await axios.post(
                `${BASE_API_URL}/api/v1/user/commentReport/add/${reportingComment.id}`,
                {
                    reasonOption: reportReason,
                    customReason: reportReason === "OTHER" ? customReason : ""
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            message.success("Report submitted!");
            setReportingComment(null);
            setCustomReason("");
        } catch (err) {
            message.error(
                err?.response?.data?.message ||
                err?.response?.data?.data ||
                "Failed to submit report!"
            );
        }
        setReporting(false);
    };

    return (
        <div style={{
            color: "#23283e",
            height: "100%",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            background: "linear-gradient(135deg, #f7fafc 0%, #eaf6fb 100%)",
            borderRadius: 18,
            boxShadow: "0 4px 24px #3ed8ff11",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
        }}>
            <style>{`
                .comment-tab-scroll::-webkit-scrollbar {
                    display: none !important;
                }
            `}</style>
            <div style={{
                marginBottom: 18,
                background: "#fff",
                borderRadius: 14,
                padding: "18px 22px",
                boxShadow: "0 2px 12px #3ed8ff11"
            }}>
                {replyTo && (
                    <div style={{ marginBottom: 8, color: "#29aaff" }}>
                        Replying to <b>{replyTo.username}</b>
                        <Button
                            size="small"
                            type="link"
                            onClick={() => setReplyTo(null)}
                            style={{ marginLeft: 8, color: "#23283e" }}
                            icon={<CloseOutlined />}
                        >
                            Cancel
                        </Button>
                    </div>
                )}
                <Input.TextArea
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    placeholder={replyTo ? t('comment_tab.reply_placeholder') : t('comment_tab.comment_placeholder')}
                    autoSize={{ minRows: 2, maxRows: 4 }}
                    maxLength={800}
                    style={{ marginBottom: 8, borderRadius: 8, fontSize: 15 }}
                    disabled={submitting}
                />
                <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={() => handleSubmitComment(replyTo ? replyTo.id : null)}
                    loading={submitting}
                    disabled={!newComment.trim()}
                    style={{ background: "#3ed8ff", border: "none", fontWeight: 600 }}
                >
                    {replyTo ? t('comment_tab.send_reply') : t('comment_tab.send_comment')}
                </Button>
            </div>
            <div
                className="comment-tab-scroll"
                style={{
                    flex: 1,
                    overflowY: "auto",
                    padding: "0",
                    scrollbarWidth: "none",
                    msOverflowStyle: "none",
                }}
            >
                {comments.length === 0 ? (
                    <div style={{ color: "#8ca0c6", textAlign: "center", marginTop: 32 }}>{t('comment_tab.no_comments')}</div>
                ) : (
                    comments.map(item => (
                        <RenderComment
                            key={item.id}
                            comment={item}
                            setReplyTo={setReplyTo}
                            currentUser={currentUser}
                            reloadComments={fetchComments}
                            onReport={setReportingComment}
                        />
                    ))
                )}
            </div>
            <Modal
                title="Report Comment"
                open={!!reportingComment}
                onCancel={() => setReportingComment(null)}
                onOk={handleReport}
                confirmLoading={reporting}
                okText="Submit Report"
                cancelText="Cancel"
                zIndex={9999}
            >
                <div style={{ marginBottom: 12 }}>
                    <b>Reason:</b>
                    <Select
                        value={reportReason}
                        onChange={setReportReason}
                        style={{ width: "100%", marginTop: 8 }}
                    >
                        {REPORT_OPTIONS.map(opt => (
                            <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                        ))}
                    </Select>
                </div>
                {reportReason === "OTHER" && (
                    <Input.TextArea
                        value={customReason}
                        onChange={e => setCustomReason(e.target.value)}
                        placeholder="Enter your specific reason..."
                        autoSize={{ minRows: 2, maxRows: 4 }}
                        maxLength={200}
                    />
                )}
            </Modal>
        </div>
    );
}

CommentTab.propTypes = {
    songId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    currentUser: PropTypes.string,
};