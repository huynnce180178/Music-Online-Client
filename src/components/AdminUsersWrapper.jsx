import React, { useEffect, useRef } from 'react';
import { message } from 'antd';
import AdminUsers from '../pages/admin/AdminUsers';

// Performance monitoring wrapper
const AdminUsersWrapper = () => {
    const requestCount = useRef(0);
    const lastRequestTime = useRef(0);
    const isSpamming = useRef(false);

    // Monitor API calls to detect spam
    useEffect(() => {
        const originalFetch = window.fetch;
        const originalXHROpen = XMLHttpRequest.prototype.open;

        // Intercept fetch calls
        window.fetch = function(...args) {
            const now = Date.now();
            requestCount.current++;
            
            // Check for spam (more than 10 requests in 1 second)
            if (now - lastRequestTime.current < 1000) {
                if (requestCount.current > 10) {
                    if (!isSpamming.current) {
                        isSpamming.current = true;
                        message.warning('Too many requests detected. Please wait a moment.');
                        setTimeout(() => {
                            isSpamming.current = false;
                            requestCount.current = 0;
                        }, 2000);
                    }
                    return Promise.reject(new Error('Request rate limited'));
                }
            } else {
                requestCount.current = 1;
                lastRequestTime.current = now;
            }
            
            return originalFetch.apply(this, args);
        };

        // Intercept XMLHttpRequest calls
        XMLHttpRequest.prototype.open = function(...args) {
            const now = Date.now();
            requestCount.current++;
            
            // Check for spam
            if (now - lastRequestTime.current < 1000) {
                if (requestCount.current > 10) {
                    if (!isSpamming.current) {
                        isSpamming.current = true;
                        message.warning('Too many requests detected. Please wait a moment.');
                        setTimeout(() => {
                            isSpamming.current = false;
                            requestCount.current = 0;
                        }, 2000);
                    }
                    return;
                }
            } else {
                requestCount.current = 1;
                lastRequestTime.current = now;
            }
            
            return originalXHROpen.apply(this, args);
        };

        // Cleanup function
        return () => {
            window.fetch = originalFetch;
            XMLHttpRequest.prototype.open = originalXHROpen;
        };
    }, []);

    // Reset counters when component mounts
    useEffect(() => {
        requestCount.current = 0;
        lastRequestTime.current = 0;
        isSpamming.current = false;
    }, []);

    return <AdminUsers />;
};

export default AdminUsersWrapper;