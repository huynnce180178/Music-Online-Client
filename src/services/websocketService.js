import BASE_API_URL from "./base.api.url";

class WebSocketService {
    constructor() {
        this.stompClient = null;
        this.connected = false;
        this.userId = null;
        this.onUserBlocked = null;
        this.onNotificationReceived = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 5000;
    }

    connect(userId, onUserBlocked, onNotificationReceived) {
        this.userId = userId;
        this.onUserBlocked = onUserBlocked;
        this.onNotificationReceived = onNotificationReceived;

        if (!userId) {
            console.warn('No user ID provided for WebSocket connection');
            return;
        }

        if (this.stompClient && this.connected) {
            this.disconnect();
        }
        import('sockjs-client').then((SockJS) => {
            import('@stomp/stompjs').then((Stomp) => {
                try {
                    const socket = new SockJS.default(`${BASE_API_URL}/ws`);
                    this.stompClient = Stomp.Stomp.over(socket);

                    this.stompClient.reconnect_delay = this.reconnectDelay;
                    this.stompClient.max_reconnect_attempts = this.maxReconnectAttempts;

                    this.stompClient.connect({}, (frame) => {
                        this.connected = true;
                        this.reconnectAttempts = 0;

                        // Subscribe to user status notifications
                        this.stompClient.subscribe(`/topic/user-status/${userId}`, (message) => {
                            try {
                                const notification = JSON.parse(message.body);
                                if (this.onUserBlocked) {
                                    this.onUserBlocked(notification);
                                }
                            } catch (error) {
                                console.error('Error parsing user status notification:', error);
                            }
                        });

                        // Subscribe to general notifications
                        this.stompClient.subscribe(`/topic/notifications/${userId}`, (message) => {
                            try {
                                const notification = JSON.parse(message.body);
                                if (this.onNotificationReceived) {
                                    this.onNotificationReceived(notification);
                                }
                            } catch (error) {
                                console.error('Error parsing notification:', error);
                            }
                        });
                    }, (error) => {
                        console.error('WebSocket connection error:', error);
                        this.connected = false;
                        this.handleReconnect();
                    });
                } catch (error) {
                    console.error('Failed to create WebSocket connection:', error);
                    this.handleReconnect();
                }
            }).catch(error => {
                console.error('Failed to load Stomp library:', error);
                this.handleReconnect();
            });
        }).catch(error => {
            console.error('Failed to load SockJS library:', error);
            this.handleReconnect();
        });
    }

    handleReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            setTimeout(() => {
                if (this.userId && this.onUserBlocked && this.onNotificationReceived) {
                    this.connect(this.userId, this.onUserBlocked, this.onNotificationReceived);
                }
            }, this.reconnectDelay);
        }
    }

    disconnect() {
        if (this.stompClient && this.connected) {
            try {
                this.stompClient.disconnect();
            } catch (error) {
                console.error('Error disconnecting WebSocket:', error);
            }
        }
        this.connected = false;
        this.stompClient = null;
        this.reconnectAttempts = 0;
    }

    isConnected() {
        return this.connected && this.stompClient && this.stompClient.connected;
    }
}

export default new WebSocketService();