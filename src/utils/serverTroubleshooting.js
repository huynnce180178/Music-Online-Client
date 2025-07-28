import { message } from 'antd';
import BASE_API_URL, { FALLBACK_URLS } from '../services/base.api.url';

// Function to test all possible server URLs
export const testAllServerUrls = async () => {
  const results = [];
  
  for (const url of [BASE_API_URL, ...FALLBACK_URLS]) {
    try {
      const startTime = Date.now();
      const response = await fetch(`${url}/api/v1/health`, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      results.push({
        url,
        status: response.status,
        ok: response.ok,
        responseTime,
        error: null
      });
    } catch (error) {
      results.push({
        url,
        status: null,
        ok: false,
        responseTime: null,
        error: error.message
      });
    }
  }
  
  return results;
};

// Function to provide troubleshooting suggestions
export const getTroubleshootingSuggestions = (testResults) => {
  const suggestions = [];
  
  // Check if any server responded
  const workingServers = testResults.filter(result => result.ok);
  const failedServers = testResults.filter(result => !result.ok);
  
  if (workingServers.length === 0) {
    suggestions.push('All servers are unreachable. This could indicate:');
    suggestions.push('- Your internet connection is down');
    suggestions.push('- The backend servers are under maintenance');
    suggestions.push('- There might be a network firewall blocking the connection');
    suggestions.push('- The server URLs might be incorrect');
  } else if (workingServers.length < testResults.length) {
    suggestions.push('Some servers are working, but not the primary one:');
    suggestions.push('- The primary server might be down');
    suggestions.push('- Try refreshing the page to use a working server');
  }
  
  // Check response times
  const slowServers = workingServers.filter(result => result.responseTime > 3000);
  if (slowServers.length > 0) {
    suggestions.push('Some servers are responding slowly:');
    suggestions.push('- This might be due to high server load');
    suggestions.push('- Try again in a few minutes');
  }
  
  return suggestions;
};

// Function to display connection test results
export const showConnectionTestResults = async () => {
  message.loading('Testing server connections...', 0);
  
  try {
    const results = await testAllServerUrls();
    message.destroy();
    
    const suggestions = getTroubleshootingSuggestions(results);
    
    let resultMessage = 'Server Connection Test Results:\n\n';
    
    results.forEach((result, index) => {
      const status = result.ok ? '✅ Working' : '❌ Failed';
      const time = result.responseTime ? `(${result.responseTime}ms)` : '';
      const error = result.error ? ` - ${result.error}` : '';
      
      resultMessage += `${index + 1}. ${result.url}\n`;
      resultMessage += `   Status: ${status} ${time}${error}\n\n`;
    });
    
    if (suggestions.length > 0) {
      resultMessage += 'Troubleshooting Suggestions:\n';
      suggestions.forEach(suggestion => {
        resultMessage += `• ${suggestion}\n`;
      });
    }
    
    // Show results in a modal or console
    console.log(resultMessage);
    message.info('Connection test completed. Check console for details.');
    
    return results;
  } catch (error) {
    message.destroy();
    message.error('Failed to run connection test');
    console.error('Connection test error:', error);
    return null;
  }
};

// Function to check if the current environment is development
export const isDevelopment = () => {
  return process.env.NODE_ENV === 'development';
};

// Function to get the current server configuration
export const getServerConfig = () => {
  return {
    currentUrl: BASE_API_URL,
    fallbackUrls: FALLBACK_URLS,
    isDevelopment: isDevelopment(),
    environment: process.env.NODE_ENV
  };
}; 