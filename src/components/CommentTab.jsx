import { useState, useEffect } from "react";
import { message, Input, Button, Modal, Select, Avatar, Tooltip } from "antd";
import axios from "axios";
import PropTypes from "prop-types";
import {
    UserOutlined, EditOutlined, DeleteOutlined, FlagOutlined,
    LikeOutlined, CommentOutlined, SendOutlined, CloseOutlined
} from "@ant-design/icons";
import ReactDOM from "react-dom";
import { useTranslation } from 'react-i18next';
import BASE_API_URL from "../services/base.api.url";

const { Option } = Select;

const REPORT_OPTIONS = [
    { value: "SPAM", label: "Spam" },
    { value: "OFFENSIVE", label: "Ngôn ngữ xúc phạm" },
    { value: "HARASSMENT", label: "Quấy rối" },
    { value: "OTHER", label: "Khác" }
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
    currentUserId,
    reloadComments,
    onReport,
    parentUsername
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(comment.content);
    const [reacting, setReacting] = useState(false);
    const [reactions, setReactions] = useState(comment.reactionCounts || []);
    const [showReactions, setShowReactions] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [reactionPosition, setReactionPosition] = useState(null);

    const isMine = currentUserId && Number(comment.userId) === Number(currentUserId);

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

    const handleShowReactions = (e) => {
        const rect = e.target.getBoundingClientRect();
        setReactionPosition({
            top: rect.bottom + window.scrollY + 4,   // đẩy xuống một chút cho đẹp
            left: rect.left + window.scrollX - 12    // chỉnh lại để popup nằm giữa nút Like
        });
        setShowReactions(true);
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
            message.error("Không thể thả cảm xúc!");
        }
        setReacting(false);
    };

    // Use reactionCounts from backend response
    const userReaction = comment.currentUserReaction;

    // Only show reactions with count > 0
    const reactionSummary = Array.isArray(reactions)
        ? reactions.filter(r => r.count > 0).map(r => ({
            type: r.type,
            count: r.count,
            icon: REACTION_ICONS[r.type]
        }))
        : [];

    // For reply-line CSS, recommend put in main CSS or use Emotion/Styled-components
    // Otherwise inline-style only

    return (
        <div
            style={{
                position: "relative",
                marginLeft: level === 1 ? 18 : 0,
                marginBottom: 14,
                background: "#fff",
                borderRadius: 12,
                border: "1px solid #eaf6fb",
                padding: "14px 16px",
                boxShadow: level === 0 ? "0 2px 8px #3ed8ff11" : "none",
                zIndex: 1
            }}
            className={level > 0 ? "fb-reply-item" : ""}
        >
            {/* Header: Avatar + tên user */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: 2,
                    width: "100%",
                    position: "relative",
                    zIndex: 1
                }}
            >
                <Avatar
                    src={comment.profileImage || undefined}
                    style={{
                        background: "#eaf6fb",
                        color: "#29aaff",
                        fontWeight: 700,
                        fontSize: 16,
                        border: "1.5px solid #3ed8ff33"
                    }}
                    size={32}
                    icon={!comment.profileImage ? <UserOutlined /> : undefined}
                >
                    {!comment.profileImage && comment.username?.charAt(0).toUpperCase()}
                </Avatar>

                <div style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    flexWrap: "wrap",
                    fontWeight: 600,
                    fontSize: 15,
                    marginLeft: 10,
                    marginRight: 12,
                    color: "#23283e"
                }}>
                    <span style={{ fontWeight: 600 }}>{comment.username}</span>
                    {parentUsername && (
                        <span style={{
                            color: "#29aaff",
                            fontWeight: 500,
                            fontSize: 14,
                            marginLeft: 7
                        }}>
                            replying <b>{parentUsername}</b>
                        </span>
                    )}
                </div>

                {/* Actions (edit/delete/report) */}
                <div style={{ display: "flex", gap: 2, marginLeft: "auto" }}>
                    {isMine ? (
                        <>
                            <Tooltip title={isEditing ? t('comment_tab.cancel') : t('comment_tab.edit')}>
                                <Button
                                    size="small"
                                    type="text"
                                    icon={isEditing ? <CloseOutlined /> : <EditOutlined />}
                                    style={{ color: "#ffb300" }}
                                    onClick={() => setIsEditing(!isEditing)}
                                />
                            </Tooltip>
                            <Tooltip title={t('comment_tab.delete')}>
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
                                okText={t('comment_tab.delete')}
                                okButtonProps={{ danger: true }}
                                cancelText={t('comment_tab.cancel')}
                                title={t('comment_tab.confirm_delete')}
                                zIndex={4000}
                            >
                                <div>{t('comment_tab.confirm_delete_message')}</div>
                            </Modal>
                        </>
                    ) : (
                        <Tooltip title={t('comment_tab.report')}>
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
                        {t('comment_tab.save')}
                    </Button>
                    <Button
                        size="small"
                        onClick={() => setIsEditing(false)}
                    >
                        {t('comment_tab.cancel')}
                    </Button>
                </div>
            ) : (
                <div className="comment-content" style={{
                    color: "#23283e",
                    fontSize: 15,
                    lineHeight: 1.7,
                    marginBottom: 8,
                    wordBreak: "break-word",
                    textAlign: "left",
                    marginLeft: '40px',
                }}>
                    {comment.content}
                </div>
            )}

            {/* Row: reply + cảm xúc + thời gian */}
            <div className="comment-row-actions" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "flex-start",
                    gap: 10
                }}>
                    <Tooltip title={t('comment_tab.reply')}>
                        <Button
                            size="small"
                            type="text"
                            icon={<CommentOutlined />}
                            style={{ color: "#29aaff" }}
                            onClick={() => setReplyTo(comment)}
                        />
                    </Tooltip>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        {reactionSummary.length > 0 && (
                            <div style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "flex-start",
                                background: "#eaf6fb",
                                borderRadius: 16,
                                padding: "0 8px",
                                fontWeight: 600,
                                fontSize: 15,
                                minHeight: 28,
                                width: "fit-content"
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
                                size="small"
                                type="text"
                                style={{
                                    color: userReaction ? "#ffb300" : "#3ed8ff",
                                    background: "#eaf6fb",
                                    borderRadius: 16,
                                    fontWeight: 600,
                                    padding: "0 10px"
                                }}
                                onClick={handleShowReactions}
                            >
                                <LikeOutlined />
                            </Button>
                            {/* Dùng Portal để popup nổi lên trên, không bị che */}
                            {showReactions && reactionPosition &&
                                ReactDOM.createPortal(
                                    <div
                                        style={{
                                            position: "absolute",
                                            top: reactionPosition.top,
                                            left: reactionPosition.left,
                                            background: "#fff",
                                            border: "1px solid #eaf6fb",
                                            borderRadius: 12,
                                            boxShadow: "0 2px 8px #3ed8ff22",
                                            padding: "8px 10px",
                                            zIndex: 99999,
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
                                                    color: userReaction === type ? "#ffb300" : "#23283e",
                                                    fontSize: 18,
                                                    background: "none",
                                                    border: "none"
                                                }}
                                            />
                                        ))}
                                    </div>,
                                    document.body
                                )
                            }
                        </div>
                    </div>
                    {/* THỜI GIAN: đưa xuống cạnh nút cảm xúc */}
                    <span style={{
                        color: "#8ca0c6",
                        fontSize: 12,
                        marginLeft: 14,
                        whiteSpace: "nowrap"
                    }}>
                        {comment.createdAt}
                    </span>
                </div>
            </div>
            {/* Replies */}
            {Array.isArray(comment.replies) && comment.replies.length > 0 && (
                <div style={{ marginTop: 8 }}>
                    {comment.replies.map(child => (
                        <RenderComment
                            key={child.id}
                            comment={child}
                            level={level + 1}
                            setReplyTo={setReplyTo}
                            currentUserId={currentUserId}
                            reloadComments={reloadComments}
                            onReport={onReport}
                            parentUsername={comment.username}
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
    currentUserId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    reloadComments: PropTypes.func.isRequired,
    onReport: PropTypes.func.isRequired,
    parentUsername: PropTypes.string,
    isAdmin: PropTypes.bool,
};

export default function CommentTab({ songId }) {
    const { t } = useTranslation();
    let currentUserId = null;
    // Lấy userId từ localStorage
    if (localStorage.getItem("userId")) {
        currentUserId = localStorage.getItem("userId");
    } else if (localStorage.getItem("user")) {
        try {
            const userRaw = localStorage.getItem("user");
            const userObj = JSON.parse(userRaw);
            currentUserId = userObj.userId;
        } catch {
            // intentionally ignored
        }
    }
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
            message.error("Bạn cần đăng nhập để bình luận.");
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
            message.success("Bình luận đã được đăng!");
        } catch (err) {
            message.error(
                err?.response?.data?.data ||
                err?.response?.data?.message ||
                "Không thể đăng bình luận!"
            );
        }
        setSubmitting(false);
    };

    const handleReport = async () => {
        const token = localStorage.getItem("accessToken");
        if (!token) {
            message.error("Bạn cần đăng nhập để báo cáo bình luận.");
            setReportingComment(null);
            return;
        }
        if (!reportingComment) return;
        if (reportReason === "OTHER" && !customReason.trim()) {
            message.error("Vui lòng nhập lý do cụ thể của bạn.");
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
            message.success("Báo cáo đã được gửi!");
            setReportingComment(null);
            setCustomReason("");
        } catch (err) {
            message.error(
                err?.response?.data?.message ||
                err?.response?.data?.data ||
                "Không thể gửi báo cáo!"
            );
        }
        setReporting(false);
    };

    return (
        <div
            style={{
                color: "#23283e",
                display: "flex",
                flexDirection: "column",
                height: "100%",       // ✅ Đảm bảo chiếm hết chiều cao vùng tab
                minHeight: 0,         // ✅ Cho flexbox auto co lại
                background: "linear-gradient(135deg, #f7fafc 0%, #eaf6fb 100%)",
                boxShadow: "0 4px 24px #3ed8ff11",
                scrollbarWidth: "none",
                msOverflowStyle: "none",
                flex: 1,
                position: "relative"
            }}
        >
            <style>{`
            .comment-tab-scroll::-webkit-scrollbar { display: none !important; }
            .comment-send-btn-inside {
                position: absolute;
                bottom: 12px;
                right: 18px;
                background: transparent;
                border: none;
                padding: 0;
                box-shadow: none;
                z-index: 3;
                cursor: pointer;
                outline: none;
                display: flex;
                align-items: center;
                justify-content: center;
                height: 28px;
                width: 32px;
            }
            .comment-send-btn-inside:disabled {
                cursor: not-allowed;
                opacity: 0.5;
            }
            /* Desktop layout */
            @media (min-width: 601px) {
                .comment-row-actions {
                    flex-direction: row !important;
                    gap: 10px !important;
                }
            }
            /* Mobile layout */
            @media (max-width: 600px) {
                .comment-tab-scroll {
                    padding: 0 2vw !important;
                    max-height: 60vh !important;
                }
                .fb-reply-item {
                    margin-left: 10px !important;
                    padding: 10px 8px !important;
                    border-radius: 8px !important;
                }
                .ant-avatar {
                    width: 26px !important;
                    height: 26px !important;
                    font-size: 15px !important;
                }
                .ant-btn {
                    font-size: 13px !important;
                    height: 28px !important;
                    min-width: 28px !important;
                    border-radius: 6px !important;
                    padding: 0 6px !important;
                }
                .ant-input, .ant-input-textarea {
                    font-size: 13px !important;
                    border-radius: 6px !important;
                    padding: 6px 8px !important;
                    width: 100% !important;
                    min-width: 0 !important;
                    box-sizing: border-box !important;
                }
                .comment-send-btn-inside {
                    height: 40px !important;
                    width: 26px !important;
                    bottom: 8px !important;
                    right: 10px !important;
                }
                .ant-modal {
                    width: 95vw !important;
                    max-width: 360px !important;
                    left: 2vw !important;
                }
                .comment-input-container {
                    padding: 5px 30px 5px 30px !important;
                    border-radius: 8px !important;
                    width: 100vw !important;
                    left: 0 !important;
                    min-width: 0 !important;
                    box-sizing: border-box !important;
                }
                /* Chuyển các nút thành hàng dọc trên mobile */
                .comment-row-actions {
                    flex-direction: column !important;
                    gap: 6px !important;
                    align-items: flex-start !important;
                }
                .comment-content {
                    margin-left: 0 !important;
                    font-size: 16px !important;
                }
            }
            // @media (max-width: 400px) {
            //     .fb-reply-item {
            //         margin-left: 4px !important;
            //         padding: 6px 4px !important;
            //         border-radius: 5px !important;
            //     }
            //     .ant-avatar {
            //         width: 18px !important;
            //         height: 18px !important;
            //         font-size: 10px !important;
            //     }
            //     .ant-btn {
            //         font-size: 10px !important;
            //         height: 20px !important;
            //         min-width: 20px !important;
            //         border-radius: 4px !important;
            //         padding: 0 3px !important;
            //     }
            //     .ant-input, .ant-input-textarea {
            //         font-size: 10px !important;
            //         border-radius: 4px !important;
            //         padding: 3px 4px !important;
            //         width: 100% !important;
            //         min-width: 0 !important;
            //         box-sizing: border-box !important;
            //     }
            //     .comment-send-btn-inside {
            //         height: 16px !important;
            //         width: 18px !important;
            //         bottom: 4px !important;
            //         right: 4px !important;
            //     }
            //     .ant-modal {
            //         width: 99vw !important;
            //         max-width: 220px !important;
            //         left: 0 !important;
            //     }
            //     .comment-input-container {
            //         padding: 4px 4px 4px 4px !important;
            //         border-radius: 5px !important;
            //         width: 100vw !important;
            //         left: 0 !important;
            //         min-width: 0 !important;
            //         box-sizing: border-box !important;
            //     }
            //     .comment-content {
            //         font-size: 10px !important;
            //     }
            // }
            .fb-reply-item {
                border-left: 2px solid #eaf6fb;
            }
            `}</style>
            {/* Phần comment list cuộn riêng */}
            <div
                className="comment-tab-scroll"
                style={{
                    flex: 1,
                    overflowY: "auto",
                    padding: "0",
                    minHeight: 0
                }}
            >
                {comments.length === 0 ? (
                    <div style={{ color: "#8ca0c6", textAlign: "left", marginTop: 32 }}>
                        {t('comment_tab.no_comments')}
                    </div>
                ) : (
                    comments.map(item => (
                        <RenderComment
                            key={item.id}
                            comment={item}
                            setReplyTo={setReplyTo}
                            currentUserId={currentUserId}
                            reloadComments={fetchComments}
                            onReport={setReportingComment}
                        />
                    ))
                )}
            </div>
            {/* Phần input cố định phía dưới */}
            <div
                className="comment-input-container"
                style={{
                    background: "#fff",
                    borderRadius: 10,
                    padding: "10px 20px 10px 20px",
                    boxShadow: "0 -2px 12px #3ed8ff11",
                    borderTop: "1px solid #eaf6fb",
                    width: "100%",
                    minWidth: 0,
                    boxSizing: "border-box",
                    display: "block",
                    backgroundClip: "padding-box",
                    transition: "box-shadow 0.2s"
                }}
            >
                {replyTo && (
                    <div style={{ marginBottom: 5, color: "#29aaff", fontSize: '18px' }}>
                        Đang trả lời <b>{replyTo.username}</b>
                        <Button
                            size="small"
                            type="link"
                            onClick={() => setReplyTo(null)}
                            style={{ marginLeft: 5, color: "#23283e" }}
                            icon={<CloseOutlined />}
                        />
                    </div>
                )}
                <div style={{ position: "relative", width: "100%" }}>
                    <Input.TextArea
                        value={newComment}
                        onChange={e => setNewComment(e.target.value)}
                        placeholder={replyTo ? t('comment_tab.reply_placeholder') : t('comment_tab.comment_placeholder')}
                        autoSize={{ minRows: 2, maxRows: 3 }}
                        maxLength={800}
                        style={{
                            borderRadius: 8,
                            fontSize: 15,
                            paddingRight: 42,
                            marginBottom: 0,
                            resize: "none",
                            width: "100%",
                            minWidth: 0,
                            boxSizing: "border-box"
                        }}
                        disabled={submitting}
                        onPressEnter={e => {
                            if (!e.shiftKey && newComment.trim()) {
                                e.preventDefault();
                                handleSubmitComment(replyTo ? replyTo.id : null);
                            }
                        }}
                    />
                    <button
                        className="comment-send-btn-inside"
                        onClick={() => handleSubmitComment(replyTo ? replyTo.id : null)}
                        disabled={!newComment.trim() || submitting}
                        tabIndex={-1}
                        style={{
                            position: "absolute",
                            bottom: 12,
                            right: 18,
                            background: "transparent",
                            border: "none",
                            padding: 0,
                            boxShadow: "none",
                            zIndex: 3,
                            cursor: "pointer",
                            outline: "none",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            height: 28,
                            width: 32,
                        }}
                    >
                        <SendOutlined style={{ fontSize: 20, color: newComment.trim() ? "#3ed8ff" : "#bbb" }} />
                    </button>
                </div>
            </div>
            {/* Modal báo cáo giữ nguyên */}
            <Modal
                title={t('comment_tab.report_comment')}
                open={!!reportingComment}
                onCancel={() => setReportingComment(null)}
                onOk={handleReport}
                confirmLoading={reporting}
                okText={t('comment_tab.submit_report')}
                cancelText={t('comment_tab.cancel')}
                zIndex={9999}
            >
                <div style={{ marginBottom: 12 }}>
                    <b>{t('comment_tab.report_reason')}</b>
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
                        placeholder={t('comment_tab.custom_reason_placeholder')}
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
};
