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

    async connect(userId, onUserBlocked, onNotificationReceived) {
        console.log('WebSocket: Attempting to connect for userId:', userId);
        this.userId = userId;
        this.onUserBlocked = onUserBlocked;
        this.onNotificationReceived = onNotificationReceived;

        if (!userId) {
            console.log('WebSocket: No userId provided, skipping connection');
            return;
        }

        if (this.stompClient && this.connected) {
            console.log('WebSocket: Disconnecting existing connection');
            this.disconnect();
        }
        
        try {
            console.log('WebSocket: Loading SockJS and Stomp modules...');
            const [SockJS, Stomp] = await Promise.all([
                import('sockjs-client').then(module => module.default),
                import('@stomp/stompjs').then(module => module.Stomp)
            ]);
            
            console.log('WebSocket: Creating SockJS connection to:', `${BASE_API_URL}/ws`);
            const socket = new SockJS(`${BASE_API_URL}/ws`);
            this.stompClient = Stomp.over(socket);

            this.stompClient.reconnect_delay = this.reconnectDelay;
            this.stompClient.max_reconnect_attempts = this.maxReconnectAttempts;

            console.log('WebSocket: Connecting to STOMP...');
            this.stompClient.connect({}, (frame) => {
                console.log('WebSocket: Connected successfully! Frame:', frame);
                this.connected = true;
                this.reconnectAttempts = 0;

                const userStatusTopic = `/topic/user-status/${userId}`;
                console.log('WebSocket: Subscribing to user status topic:', userStatusTopic);
                this.stompClient.subscribe(userStatusTopic, (message) => {
                    console.log('WebSocket: Received user status notification:', message.body);
                    try {
                        const notification = JSON.parse(message.body);
                        if (this.onUserBlocked) {
                            this.onUserBlocked(notification);
                        }
                    } catch (error) {
                        console.error('Error parsing user status notification:', error);
                    }
                });

                const notificationsTopic = `/topic/notifications/${userId}`;
                console.log('WebSocket: Subscribing to notifications topic:', notificationsTopic);
                this.stompClient.subscribe(notificationsTopic, (message) => {
                    console.log('WebSocket: Received general notification:', message.body);
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
                console.error('WebSocket: Connection error:', error);
                this.connected = false;
                this.handleReconnect();
            });
        } catch (error) {
            console.error('WebSocket: Error during connection setup:', error);
            this.handleReconnect();
        }
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