import Layout from "./layouts/Index";
import WebSocketProvider from "./components/WebSocketProvider";
import './i18n';
//import './App.css';

function App() {
  return (
    <WebSocketProvider>
      <Layout />
    </WebSocketProvider>
  );
}

export default App;
