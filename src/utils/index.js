import React from 'react';
import { isTokenExpired, handleAutoLogout } from './apiUtils';

// Xây dựng các hàm dùng chung

// Hook to check token expiration periodically
export const useTokenExpirationCheck = () => {
    React.useEffect(() => {
        const checkTokenExpiration = () => {
            const token = localStorage.getItem('accessToken');
            if (token && isTokenExpired(token)) {
                handleAutoLogout();
            }
        };

        // Check immediately when component mounts
        checkTokenExpiration();

        // Check every 30 seconds
        const interval = setInterval(checkTokenExpiration, 30000);

        return () => clearInterval(interval);
    }, []);
};
