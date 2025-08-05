const BASE_API_URL = process.env.NODE_ENV === 'production' 
  ? "https://music-online-backend-fjgha0e2bvevfah8.southeastasia-01.azurewebsites.net"
  : "http://localhost:8080";
export default BASE_API_URL;
export { BASE_API_URL };