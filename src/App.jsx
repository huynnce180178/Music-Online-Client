import Layout from "./layouts/Index";
import WebSocketProvider from "./components/WebSocketProvider";
//import './App.css';

function App() {
  return (
    <WebSocketProvider>
      <Layout />
    </WebSocketProvider>
  );
}

export default App;
