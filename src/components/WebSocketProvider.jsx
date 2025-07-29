import React, { useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import websocketService from '../services/websocketService';
import UserBlockModal from './UserBlockModal';

const WebSocketProvider = ({ children }) => {
    const [blockNotification, setBlockNotification] = useState(null);
    const [showBlockModal, setShowBlockModal] = useState(false);
    const reconnectTimeoutRef = useRef(null);

    useEffect(() => {
        const userId = localStorage.getItem('userId');
        const token = localStorage.getItem('accessToken');

        if (userId && token) {
            const handleUserBlocked = (notification) => {
                setBlockNotification(notification);
                setShowBlockModal(true);
            };

            const handleNotificationReceived = (notification) => {
            };

            const connectWebSocket = () => {
                try {
                    websocketService.connect(userId, handleUserBlocked, handleNotificationReceived);
                    
                    setTimeout(() => {
                        if (!websocketService.isConnected()) {
                            reconnectTimeoutRef.current = setTimeout(connectWebSocket, 5000);
                        }
                    }, 3000);
                } catch (error) {
                    reconnectTimeoutRef.current = setTimeout(connectWebSocket, 5000);
                }
            };

            connectWebSocket();

            const connectionCheckInterval = setInterval(() => {
                if (!websocketService.isConnected()) {
                    connectWebSocket();
                }
            }, 10000);

            return () => {
                clearInterval(connectionCheckInterval);
                if (reconnectTimeoutRef.current) {
                    clearTimeout(reconnectTimeoutRef.current);
                }
                websocketService.disconnect();
            };
        }
    }, []);

    const handleCloseBlockModal = () => {
        setShowBlockModal(false);
        setBlockNotification(null);
    };

    return (
        <>
            {children}
            <UserBlockModal 
                visible={showBlockModal} 
                notification={blockNotification} 
                onClose={handleCloseBlockModal} 
            />
        </>
    );
};

WebSocketProvider.propTypes = {
    children: PropTypes.node.isRequired,
};

export default WebSocketProvider;