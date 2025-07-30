import React, { useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import websocketService from '../services/websocketService';
import UserBlockModal from './UserBlockModal';

const WebSocketProvider = ({ children }) => {
    const [blockNotification, setBlockNotification] = useState(null);
    const [showBlockModal, setShowBlockModal] = useState(false);
    const reconnectTimeoutRef = useRef(null);
    const lastCredentialsRef = useRef({ userId: null, token: null });

    const connectWebSocket = async (userId) => {
        console.log('WebSocketProvider: Connecting for userId:', userId);
        
        const handleUserBlocked = (notification) => {
            console.log('WebSocketProvider: Block notification received:', notification);
            setBlockNotification(notification);
            setShowBlockModal(true);
        };

        const handleNotificationReceived = (notification) => {
            console.log('WebSocketProvider: General notification received:', notification);
        };

        try {
            await websocketService.connect(userId, handleUserBlocked, handleNotificationReceived);
            console.log('WebSocketProvider: Connection successful');
        } catch (error) {
            console.error('WebSocketProvider: Connection failed:', error);
            reconnectTimeoutRef.current = setTimeout(() => connectWebSocket(userId), 5000);
        }
    };

    useEffect(() => {
        const checkAndConnect = () => {
            const userId = localStorage.getItem('userId');
            const token = localStorage.getItem('accessToken');
            
            // Only reconnect if credentials actually changed
            if (userId !== lastCredentialsRef.current.userId || token !== lastCredentialsRef.current.token) {
                console.log('WebSocketProvider: Credentials changed, reconnecting...');
                lastCredentialsRef.current = { userId, token };
                
                if (userId && token) {
                    websocketService.disconnect();
                    connectWebSocket(userId);
                }
            }
        };

        // Initial check only
        checkAndConnect();

        // Listen for storage events
        const handleStorageChange = (e) => {
            if (e.key === 'userId' || e.key === 'accessToken') {
                console.log('WebSocketProvider: Storage changed, reconnecting...');
                checkAndConnect();
            }
        };

        // Listen for custom userLogin event
        const handleUserLogin = (e) => {
            console.log('WebSocketProvider: UserLogin event received');
            checkAndConnect();
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('userLogin', handleUserLogin);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('userLogin', handleUserLogin);
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            websocketService.disconnect();
        };
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