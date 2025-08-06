import { Card, Dropdown, Menu, Button } from "antd";
import { MoreOutlined, PlayCircleOutlined, DownloadOutlined } from "@ant-design/icons";
import { useTranslation } from 'react-i18next';

export default function PlaylistCard({ playlist, onEdit, onDelete, onPlay }) {
    const { t } = useTranslation();
    const menu = (
        <Menu>
            <Menu.Item key="edit" onClick={onEdit}>{t('playlist.edit')}</Menu.Item>
            <Menu.Item key="download" icon={<DownloadOutlined />}>{t('playlist.download')}</Menu.Item>
            <Menu.Item key="delete" danger onClick={onDelete}>{t('playlist.delete_from_library')}</Menu.Item>
        </Menu>
    );

    return (
        <div
            style={{
                width: 220,
                margin: 16,
                borderRadius: 16,
                background: "#23242b",
                boxShadow: "0 4px 24px #0002",
                position: "relative",
                overflow: "hidden",
                transition: "box-shadow 0.2s",
            }}
        >
            <div style={{ position: "relative" }}>
                <img
                    src={playlist.imageUrl || "/img/default-cover.png"}
                    alt={playlist.name}
                    style={{
                        width: "100%",
                        height: 180,
                        objectFit: "cover",
                        borderTopLeftRadius: 16,
                        borderTopRightRadius: 16,
                        display: "block"
                    }}
                />
                <Button
                    shape="circle"
                    icon={<PlayCircleOutlined style={{ fontSize: 28 }} />}
                    size="large"
                    style={{
                        position: "absolute",
                        left: 12,
                        bottom: 12,
                        background: "#fff",
                        color: "#23242b",
                        boxShadow: "0 2px 8px #0003",
                        border: "none"
                    }}
                    onClick={onPlay}
                />
                <Dropdown menu={menu} trigger={['click']}>
                    <Button
                        shape="circle"
                        icon={<MoreOutlined />}
                        size="large"
                        style={{
                            position: "absolute",
                            right: 12,
                            bottom: 12,
                            background: "#fff",
                            color: "#23242b",
                            border: "none"
                        }}
                        onClick={e => e.stopPropagation()}
                    />
                </Dropdown>
            </div>
            <div style={{
                padding: "16px 12px 12px 12px",
                color: "#fff",
                fontWeight: 600,
                fontSize: 16,
                textAlign: "left"
            }}>
                {playlist.name}
            </div>
        </div>
    );
}