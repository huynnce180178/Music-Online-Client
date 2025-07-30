import axios from 'axios';
import BASE_API_URL from './base.api.url';

class UserStatusService {
    constructor() {
        this.checkInterval = null;
        this.isChecking = false;
    }

    startStatusCheck() {
        const userId = localStorage.getItem('userId');
        const token = localStorage.getItem('accessToken');

        if (!userId || !token) {
            return;
        }

        // Check immediately
        this.checkUserStatus();

        // Set up periodic check every 30 seconds
        this.checkInterval = setInterval(() => {
            this.checkUserStatus();
        }, 30000);
    }

    stopStatusCheck() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
        this.isChecking = false;
    }

    async checkUserStatus() {
        if (this.isChecking) {
            return;
        }

        const userId = localStorage.getItem('userId');
        const token = localStorage.getItem('accessToken');

        if (!userId || !token) {
            this.stopStatusCheck();
            return;
        }

        this.isChecking = true;

        try {
            const response = await axios.get(`${BASE_API_URL}/api/v1/user/status`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const userStatus = response.data?.data?.status;
            
            if (userStatus === 'BLOCKED') {
                console.log('User is blocked, logging out...');
                this.handleUserBlocked();
            }
        } catch (error) {
            console.error('Error checking user status:', error);
            
            // If unauthorized, user might be blocked or token expired
            if (error.response?.status === 401 || error.response?.status === 403) {
                console.log('User unauthorized, logging out...');
                this.handleUserBlocked();
            }
        } finally {
            this.isChecking = false;
        }
    }

    handleUserBlocked() {
        // Clear all local storage
        localStorage.removeItem('accessToken');
        localStorage.removeItem('userName');
        localStorage.removeItem('roles');
        localStorage.removeItem('userId');
        localStorage.removeItem('email');
        localStorage.removeItem('profileImage');
        localStorage.removeItem('facebookId');
        localStorage.removeItem('needCompleteProfile');
        localStorage.removeItem('avatarUrl');

        // Stop status checking
        this.stopStatusCheck();

        // Show alert and redirect
        alert('Your account has been blocked. Please contact support for more details.');
        window.location.href = '/';
    }

    isActive() {
        return this.checkInterval !== null;
    }
}

export default new UserStatusService(); 