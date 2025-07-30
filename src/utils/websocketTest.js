import BASE_API_URL from '../services/base.api.url';

export const testWebSocketConnection = () => {
    return new Promise((resolve, reject) => {
        const testSocket = new WebSocket(`ws://localhost:8080/ws`);
        
        testSocket.onopen = () => {
            console.log('WebSocket test connection successful');
            testSocket.close();
            resolve(true);
        };
        
        testSocket.onerror = (error) => {
            console.error('WebSocket test connection failed:', error);
            reject(error);
        };
        
        setTimeout(() => {
            reject(new Error('WebSocket test timeout'));
        }, 5000);
    });
};

export const testSockJSConnection = () => {
    return new Promise((resolve, reject) => {
        import('sockjs-client').then((SockJS) => {
            const socket = new SockJS.default(`${BASE_API_URL}/ws`);
            
            socket.onopen = () => {
                console.log('SockJS test connection successful');
                socket.close();
                resolve(true);
            };
            
            socket.onerror = (error) => {
                console.error('SockJS test connection failed:', error);
                reject(error);
            };
            
            setTimeout(() => {
                reject(new Error('SockJS test timeout'));
            }, 5000);
        }).catch(reject);
    });
}; 