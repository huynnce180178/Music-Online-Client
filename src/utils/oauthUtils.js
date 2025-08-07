
export const isOAuthCallback = (searchParams) => {
    return searchParams.has('oauth2') || 
           searchParams.has('code') || 
           searchParams.has('state') ||
           searchParams.has('error');
};

export const getOAuthProvider = (searchParams) => {
    return searchParams.get('provider') || 'google';
};

export const handleOAuthError = (searchParams) => {
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    
    if (error) {
        return {
            error: error,
            description: errorDescription || 'OAuth authentication failed'
        };
    }
    
    return null;
};

// Optimize OAuth processing
export const optimizeOAuthFlow = () => {
    // Pre-load common resources
    const preloadImage = (src) => {
        const img = new Image();
        img.src = src;
    };
    
    // Pre-load common images
    preloadImage('/img/headphones1.png');
    preloadImage('/img/default-cover.png');
    
    // Optimize localStorage access
    const storage = {
        get: (key) => {
            try {
                return localStorage.getItem(key);
            } catch (e) {
                console.warn('localStorage access failed:', e);
                return null;
            }
        },
        set: (key, value) => {
            try {
                localStorage.setItem(key, value);
                return true;
            } catch (e) {
                console.warn('localStorage set failed:', e);
                return false;
            }
        }
    };
    
    return { storage };
};