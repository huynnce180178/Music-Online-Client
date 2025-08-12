import { useState, useEffect, useRef } from "react";
import { message, Input, Button, Modal, Select, Avatar, Tooltip, Menu } from "antd";
import {
  UserOutlined, EditOutlined, DeleteOutlined, FlagOutlined,
  LikeOutlined, CommentOutlined, SendOutlined, CloseOutlined, EllipsisOutlined
} from "@ant-design/icons";
import axios from "axios";
import PropTypes from "prop-types";
import ReactDOM from "react-dom";
import { useTranslation } from "react-i18next";
import BASE_API_URL from "../services/base.api.url";

const { Option } = Select;

const C = {
  bgCard: "#0f1628",
  bgCardSoft: "#1C2234",
  border: "#25314A",
  text: "#FFFFFF",
  textSubtle: "#A7B1C8",
  textBright: "#FFFFFF",
  cyan: "#3ed8ff",
  cyanSoft: "#eaf6fb1a",
  yellow: "#ffb300",
  red: "#ff4d4f",
};

const REACTION_ICONS = {
  LIKE: <span role="img" aria-label="like" style={{ fontSize: 14 }}>👍</span>,
  HEART: <span role="img" aria-label="heart" style={{ fontSize: 14 }}>❤️</span>,
  HAHA: <span role="img" aria-label="haha" style={{ fontSize: 14 }}>😂</span>,
  WOW: <span role="img" aria-label="wow" style={{ fontSize: 14 }}>😮</span>,
  SAD: <span role="img" aria-label="sad" style={{ fontSize: 14 }}>😢</span>,
  ANGRY: <span role="img" aria-label="angry" style={{ fontSize: 14 }}>😡</span>,
};

function RenderComment({ comment, level = 0, setReplyTo, currentUserId, reloadComments, onReport, parentUsername }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [reacting, setReacting] = useState(false);
  const [reactions, setReactions] = useState(comment.reactionCounts || []);
  const [showReactions, setShowReactions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [reactionPosition, setReactionPosition] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const dropdownRef = useRef(null);
  const wrapperRef = useRef(null);

  const isMine = currentUserId && Number(comment.userId) === Number(currentUserId);

  const handleUpdate = async () => {
    if (!editContent.trim()) return;
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return message.error("You need to login to update comment.");
      if (!comment.id) return message.error("Comment ID is missing.");
      await axios.put(`${BASE_API_URL}/api/v1/comments/${comment.id}?content=${encodeURIComponent(editContent)}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setIsEditing(false);
      reloadComments();
      message.success("Comment updated!");
    } catch (error) {
      const errorMessage = error?.response?.data?.message || error?.response?.data?.data || error.message || "Failed to update comment!";
      message.error(errorMessage);
    }
  };

  const handleDelete = async () => {
    setShowDeleteConfirm(false);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return message.error("You need to login to delete comment.");
      if (!comment.id) return message.error("Comment ID is missing.");
      await axios.delete(`${BASE_API_URL}/api/v1/comments/${comment.id}`, { headers: { Authorization: `Bearer ${token}` } });
      message.success("Comment deleted!");
      reloadComments();
    } catch (error) {
      const errorMessage = error?.response?.data?.message || error?.response?.data?.data || error.message || "Failed to delete comment!";
      message.error(errorMessage);
    }
  };

  const handleShowReactions = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setReactionPosition({ top: rect.top + window.scrollY - 50, left: rect.left + window.scrollX - 6 });
    setShowReactions(true);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showDropdown && dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [showDropdown]);

  const handleReaction = async (type) => {
    setReacting(true);
    try {
      const token = localStorage.getItem("accessToken");
      const res = await axios.post(`${BASE_API_URL}/api/v1/reactions/${comment.id}?type=${type}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setReactions(res.data.data || []);
      reloadComments();
    } catch {
      message.error("Failed to react!");
    }
    setReacting(false);
  };

  const userReaction = comment.currentUserReaction;
  const reactionSummary = Array.isArray(reactions)
    ? reactions.filter(r => r.count > 0).map(r => ({ type: r.type, count: r.count, icon: REACTION_ICONS[r.type] }))
    : [];

  const menuItems = isMine
    ? [
      { key: "edit", icon: <EditOutlined style={{ color: C.textBright }} />, label: <span style={{ color: C.textBright }}>Edit</span>, onClick: () => setIsEditing(v => !v) },
      { key: "delete", icon: <DeleteOutlined style={{ color: C.red }} />, label: <span style={{ color: C.red }}>Delete</span>, onClick: () => setShowDeleteConfirm(true) }
    ]
    : [
      { key: "report", icon: <FlagOutlined style={{ color: "#ff416c" }} />, label: <span style={{ color: "#ff416c" }}>Report</span>, onClick: () => onReport(comment) }
    ];

  const isRoot = level === 0;
  const containerStyle = {
    position: "relative",
    marginLeft: level > 0 ? 18 : 0,
    marginBottom: 14,
    background: isRoot ? C.bgCard : "transparent",
    border: isRoot ? `1px solid ${C.border}` : "none",
    padding: isRoot ? "14px 16px" : "10px 0 8px 0",
    borderRadius: isRoot ? 14 : 0,
    boxShadow: isRoot ? "0 8px 28px rgba(10,20,40,0.25)" : "none",
  };

  return (
    <div ref={wrapperRef} style={containerStyle} className={level > 0 ? "fb-reply-item" : ""}>
      {level > 0 && (
        <div aria-hidden style={{ position: "absolute", left: -10, top: 16, bottom: 12, width: 2, background: C.border, borderRadius: 2 }} />
      )}

      {/* 3 chấm */}
      <div ref={dropdownRef} className="custom-dropdown" style={{ position: "absolute", top: 8, right: 8 }}>
        <Button size="small" type="text" icon={<EllipsisOutlined />} style={{ color: C.textSubtle }} onClick={(e) => { e.stopPropagation(); setShowDropdown(v => !v); }} />
        {showDropdown && (
          <div style={{ position: "absolute", top: 28, right: 0, background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.25)", zIndex: 9999, minWidth: 140, padding: 4 }}>
            <Menu items={menuItems} onClick={() => setShowDropdown(false)} style={{ border: "none", background: "transparent", color: C.textBright }} />
          </div>
        )}
      </div>

      {/* Header: Avatar + Tên (đã bỏ timestamp ở đây) */}
      <div style={{ display: "flex", alignItems: "center", width: "100%", gap: 10 }}>
        <Avatar
          src={comment.profileImage || undefined}
          style={{ background: "#213047", color: C.cyan, fontWeight: 700, fontSize: 16, border: `1.5px solid ${C.cyanSoft}` }}
          size={34}
          icon={!comment.profileImage ? <UserOutlined /> : undefined}
        >
          {!comment.profileImage && comment.username?.charAt(0).toUpperCase()}
        </Avatar>

        <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", flexDirection: "column", marginLeft: 10 }}>
            <span className="comment-author" style={{ fontWeight: 700, fontSize: 15, color: C.text }}>{comment.username}</span>
            {/* timestamp đã chuyển xuống hàng actions */}
          </div>
          {isEditing ? (
            <div style={{ marginTop: 8 }}>
              <Input.TextArea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                autoSize={{ minRows: 2, maxRows: 5 }}
                style={{ borderRadius: 10, fontSize: 15, background: C.bgCardSoft, color: C.text, borderColor: C.border }}
                onKeyDownCapture={(e) => { if (e.key === " ") e.stopPropagation(); }}
              />
              <div style={{ marginTop: 8 }}>
                <Button type="primary" size="small" icon={<SendOutlined />} onClick={handleUpdate} disabled={!editContent.trim()} style={{ marginRight: 8, background: C.cyan, borderColor: C.cyan, color: "#0b1220", fontWeight: 700 }}>Save</Button>
                <Button size="small" onClick={() => setIsEditing(false)} style={{ background: C.bgCardSoft, borderColor: C.border, color: C.cyan }}>Cancel</Button>
              </div>
            </div>
          ) : (
            <div className="comment-content" style={{ color: C.text, fontSize: 15.5, lineHeight: 1.7, marginTop: 4, wordBreak: "break-word" }}>
              {parentUsername && (
                <span style={{ color: C.cyan, fontWeight: 600, marginRight: 6 }}>@{parentUsername}</span>
              )}
              {comment.content}
            </div>
          )}
        </div>
      </div>

      {/* Actions + Timestamp cùng một hàng */}
      <div
        className="comment-row-actions"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          marginTop: 8,
          marginLeft: 44,
          flexWrap: "nowrap"
        }}
      >
        {/* Nhóm nút trái */}
        <div
          className="comment-actions-left"
          style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flexShrink: 1, overflow: "hidden" }}
        >
          <Tooltip title="Reply">
            <Button
              size="small"
              type="text"
              icon={<CommentOutlined />}
              style={{ color: C.cyan, whiteSpace: "nowrap", flexShrink: 0 }}
              onClick={() => setReplyTo(comment)}
            />
          </Tooltip>

          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
            {reactionSummary.length > 0 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  background: C.cyanSoft,
                  border: `1px solid ${C.border}`,
                  borderRadius: 999,
                  padding: "2px 10px",
                  fontWeight: 600,
                  fontSize: 14,
                  minHeight: 26,
                  maxWidth: "100%",
                  overflow: "hidden"
                }}
              >
                {reactionSummary.map((r) => (
                  <span key={r.type} style={{ display: "flex", alignItems: "center", marginRight: 8, color: C.text, whiteSpace: "nowrap" }}>
                    {r.icon}<span style={{ marginLeft: 4 }}>{r.count}</span>
                  </span>
                ))}
              </div>
            )}

            <div style={{ position: "relative", display: "inline-block", flexShrink: 0 }}>
              <Button
                size="small"
                type="text"
                style={{
                  color: userReaction ? C.yellow : C.cyan,
                  background: C.cyanSoft,
                  borderRadius: 999,
                  fontWeight: 700,
                  padding: "0 12px",
                  border: `1px solid ${C.border}`,
                  whiteSpace: "nowrap"
                }}
                onClick={handleShowReactions}
              >
                <LikeOutlined />
              </Button>

              {showReactions && reactionPosition &&
                ReactDOM.createPortal(
                  <div
                    style={{
                      position: "absolute",
                      top: reactionPosition.top,
                      left: reactionPosition.left,
                      background: C.bgCard,
                      border: `1px solid ${C.border}`,
                      borderRadius: 12,
                      boxShadow: "0 10px 28px rgba(0,0,0,0.35)",
                      padding: "8px 10px",
                      zIndex: 99999,
                      display: "flex",
                      gap: 6
                    }}
                    onMouseLeave={() => setShowReactions(false)}
                  >
                    {Object.keys(REACTION_ICONS).map((type) => (
                      <Button
                        key={type}
                        size="small"
                        type="text"
                        icon={REACTION_ICONS[type]}
                        loading={reacting}
                        onClick={() => { handleReaction(type); setShowReactions(false); }}
                        style={{ color: userReaction === type ? C.yellow : C.text, fontSize: 18, background: "transparent", border: "none" }}
                      />
                    ))}
                  </div>,
                  document.body
                )}
            </div>
          </div>
        </div>

        {/* Timestamp bên phải, nhỏ & mờ */}
        <div
          className="comment-timestamp-inline"
          style={{ color: C.textSubtle, fontSize: 12, opacity: 0.85, whiteSpace: "nowrap", flexShrink: 0 }}
        >
          {comment.createdAt}
        </div>
      </div>

      <Modal
        open={showDeleteConfirm}
        onOk={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        okText="Delete"
        okButtonProps={{ danger: true }}
        cancelText="Cancel"
        title="Confirm Delete"
        zIndex={4000}
        styles={{
          content: { background: C.bgCard, border: `1px solid ${C.border}`, boxShadow: "0 8px 28px rgba(0,0,0,0.4)", borderRadius: 16 },
          header: { background: C.bgCard, borderBottomColor: C.border },
          body: { background: C.bgCard },
          footer: { background: C.bgCard, borderTopColor: C.border }
        }}
      >
        <div style={{ color: C.textBright }}>Are you sure you want to delete this comment?</div>
      </Modal>

      {Array.isArray(comment.replies) && comment.replies.length > 0 && (
        <div style={{ marginTop: 6 }}>
          {comment.replies.map((child) => (
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
  parentUsername: PropTypes.string
};

export default function CommentTab({ songId }) {
  const { t } = useTranslation();

  const REPORT_OPTIONS = [
    { value: "SPAM", label: t("comment_tab.report_reason_spam") },
    { value: "OFFENSIVE", label: t("comment_tab.report_reason_offensive") },
    { value: "HARASSMENT", label: t("comment_tab.report_reason_harassment") },
    { value: "OTHER", label: t("comment_tab.report_reason_other") }
  ];

  let currentUserId = null;
  if (localStorage.getItem("userId")) currentUserId = localStorage.getItem("userId");
  else if (localStorage.getItem("user")) { try { const userRaw = localStorage.getItem("user"); const userObj = JSON.parse(userRaw); currentUserId = userObj.userId; } catch { } }

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

  useEffect(() => { fetchComments(); }, [songId]);

  useEffect(() => {
    const stopSpaceInInputs = (e) => { if (e.key === " " && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.isContentEditable)) e.stopPropagation(); };
    document.addEventListener("keydown", stopSpaceInInputs, true);
    return () => document.removeEventListener("keydown", stopSpaceInInputs, true);
  }, []);

  const handleSubmitComment = async (replyToCommentId = null) => {
    if (!newComment.trim()) return;
    const token = localStorage.getItem("accessToken");
    if (!token) { message.error("You need to login to comment."); return; }
    setSubmitting(true);
    try {
      await axios.post(`${BASE_API_URL}/api/v1/comments`, { songId: Number(songId), content: newComment, parentId: replyToCommentId }, { headers: { Authorization: `Bearer ${token}` } });
      setNewComment("");
      setReplyTo(null);
      await fetchComments();
      message.success("Comment posted!");
    } catch (err) {
      message.error(err?.response?.data?.data || err?.response?.data?.message || "Failed to post comment!");
    }
    setSubmitting(false);
  };

  const handleReport = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) { message.error("You need to login to report a comment."); setReportingComment(null); return; }
    if (!reportingComment) return;
    if (reportReason === "OTHER" && !customReason.trim()) { message.error("Please enter your specific reason."); return; }
    setReporting(true);
    try {
      await axios.post(`${BASE_API_URL}/api/v1/user/commentReport/add/${reportingComment.id}`, { reasonOption: reportReason, customReason: reportReason === "OTHER" ? customReason : "" }, { headers: { Authorization: `Bearer ${token}` } });
      message.success("Report submitted!");
      setReportingComment(null);
      setCustomReason("");
    } catch (err) {
      message.error(err?.response?.data?.message || err?.response?.data?.data || "Failed to submit report!");
    }
    setReporting(false);
  };

  return (
    <div style={{ color: C.text, display: "flex", flexDirection: "column", height: "100%", minHeight: 0, background: "transparent", scrollbarWidth: "none", msOverflowStyle: "none", flex: 1, position: "relative" }}>
      <style>{`
        .comment-tab-scroll::-webkit-scrollbar { display: none !important; }
        @media (max-width: 600px) {
          .comment-tab-scroll { padding: 0 2vw !important; max-height: 60vh !important; }
          .fb-reply-item { margin-left: 10px !important; padding: 8px 0 !important; border-radius: 0 !important; }
          .ant-avatar { width: 28px !important; height: 28px !important; }
          .ant-btn { font-size: 13px !important; height: 28px !important; min-width: 28px !important; }
          .ant-input, .ant-input-textarea { font-size: 14px !important; border-radius: 8px !important; }
          /* Giữ nút trên một hàng, không bị xuống hàng */
          .comment-row-actions { flex-direction: row !important; flex-wrap: nowrap !important; align-items: center !important; }
          .comment-actions-left { gap: 8px !important; }
          .comment-timestamp-inline { font-size: 11px !important; opacity: 0.8 !important; }
        }
        /* Placeholder màu hợp theme */
        .comment-input-container textarea::placeholder { color: ${C.cyan} !important; opacity: 0.95; }
      `}</style>

      <div className="comment-tab-scroll" style={{ flex: 1, overflowY: "auto", padding: 0, minHeight: 0 }}>
        {comments.length === 0 ? (
          <div style={{ color: C.textSubtle, textAlign: "left", marginTop: 24 }}>{t("comment_tab.no_comments")}</div>
        ) : (
          comments.map((item) => (
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

      <div className="comment-input-container" style={{ background: C.bgCard, borderRadius: 12, padding: "12px 16px", boxShadow: "0 -8px 20px rgba(0,0,0,0.25)", borderTop: `1px solid ${C.border}`, width: "100%", boxSizing: "border-box" }}>
        {replyTo && (
          <div style={{ marginBottom: 6, color: C.cyan, fontSize: 15 }}>
            Replying to <b>@{replyTo.username}</b>
            <Button size="small" type="link" onClick={() => setReplyTo(null)} style={{ marginLeft: 6, color: C.textBright }} icon={<CloseOutlined />} />
          </div>
        )}

        <div style={{ position: "relative", width: "100%" }}>
          <Input.TextArea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={replyTo ? t("comment_tab.reply_placeholder") : t("comment_tab.comment_placeholder")}
            autoSize={{ minRows: 2, maxRows: 5 }}
            maxLength={800}
            style={{ borderRadius: 10, fontSize: 15.5, paddingRight: 44, marginBottom: 0, resize: "none", width: "100%", background: C.bgCardSoft, color: C.textBright, borderColor: C.border }}
            disabled={submitting}
            onKeyDownCapture={(e) => { if (e.key === " " && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) e.stopPropagation(); }}
            onPressEnter={(e) => {
              if (!e.shiftKey && newComment.trim()) { e.preventDefault(); handleSubmitComment(replyTo ? replyTo.id : null); }
            }}
          />
          <button
            className="comment-send-btn-inside"
            onClick={() => handleSubmitComment(replyTo ? replyTo.id : null)}
            disabled={!newComment.trim() || submitting}
            tabIndex={-1}
            style={{ position: "absolute", bottom: 10, right: 12, background: "transparent", border: "none", boxShadow: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", height: 32, width: 34 }}
          >
            <SendOutlined style={{ fontSize: 20, color: newComment.trim() ? C.cyan : "#6b7280" }} />
          </button>
        </div>
      </div>

      <Modal
        title={<span style={{ color: C.textBright }}>{t("comment_tab.report_title") || "Report Comment"}</span>}
        open={!!reportingComment}
        onCancel={() => setReportingComment(null)}
        onOk={handleReport}
        confirmLoading={reporting}
        okText={t("comment_tab.report_submit")}
        cancelText={t("comment_tab.report_cancel")}
        zIndex={9999}
        styles={{
          mask: { backgroundColor: "rgba(0,0,0,0.55)" },
          content: { background: C.bgCard, border: `1px solid ${C.border}`, boxShadow: "0 8px 28px rgba(0,0,0,0.4)", borderRadius: 16 },
          header: { background: C.bgCard, borderBottomColor: C.border },
          body: { background: C.bgCard },
          footer: { background: C.bgCard, borderTopColor: C.border }
        }}
        okButtonProps={{ style: { background: C.cyan, borderColor: C.cyan, color: "#0b1220", fontWeight: 700 } }}
        cancelButtonProps={{ style: { color: C.textBright, borderColor: C.border, background: C.bgCardSoft } }}
      >
        <div style={{ marginBottom: 12, color: C.textBright }}>
          <b>{t("comment_tab.report_reason") || "Reason:"}</b>
          <Select
            value={reportReason}
            onChange={setReportReason}
            style={{ width: "100%", marginTop: 8, background: C.bgCardSoft, color: C.textBright, borderColor: C.border }}
            dropdownStyle={{ background: C.bgCard, border: `1px solid ${C.border}`, color: C.textBright }}
            getPopupContainer={(trigger) => trigger.parentNode}
            popupMatchSelectWidth
          >
            {[
              { value: "SPAM", label: t("comment_tab.report_reason_spam") },
              { value: "OFFENSIVE", label: t("comment_tab.report_reason_offensive") },
              { value: "HARASSMENT", label: t("comment_tab.report_reason_harassment") },
              { value: "OTHER", label: t("comment_tab.report_reason_other") },
            ].map((opt) => (
              <Option key={opt.value} value={opt.value} style={{ color: C.text }}>{opt.label}</Option>
            ))}
          </Select>
        </div>
        {reportReason === "OTHER" && (
          <Input.TextArea
            value={customReason}
            onChange={(e) => setCustomReason(e.target.value)}
            placeholder={t("comment_tab.report_reason_other_placeholder") || "Enter your specific reason..."}
            autoSize={{ minRows: 2, maxRows: 4 }}
            maxLength={200}
            style={{ color: C.text, backgroundColor: C.bgCardSoft, borderColor: C.border }}
          />
        )}
      </Modal>
    </div>
  );
}

CommentTab.propTypes = {
  songId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired
};
