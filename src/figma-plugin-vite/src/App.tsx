import { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { ConfigProvider, Layout, Tabs, Typography, Space, Image, theme } from 'antd';
import { useHashRouter, RouteType } from './utils/router';
import { ConnectionView } from './components/ConnectionView';
import { SettingsView } from './components/SettingsView';
import { AboutView } from './components/AboutView';
import PluginLogo from './assets/plugin-logo.png';
// import 'antd/dist/reset.css';
import './App.scss';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

// Custom theme for Figma plugin
const customTheme = {
  algorithm: theme.compactAlgorithm,
  token: {
    colorPrimary: '#18a0fb',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
    borderRadius: 6,
  },
};

function App() {
  const { currentRoute, navigate } = useHashRouter();

  useEffect(() => {
    // Listen for messages from the plugin
    window.addEventListener('message', (event) => {
      const message = event.data.pluginMessage;
      if (message) {
        console.log('📥 Received from plugin:', message);
      }
    });

    // Send ready message to plugin
    parent.postMessage({ pluginMessage: { type: 'ui-ready' } }, '*');
  }, []);

  const tabItems = [
    {
      key: 'connection',
      label: 'Connection',
      children: <ConnectionView />,
    },
    {
      key: 'settings',
      label: 'Settings',
      children: <SettingsView />,
    },
    {
      key: 'about',
      label: 'About',
      children: <AboutView />,
    },
  ];

  return (
    <ConfigProvider theme={customTheme}>
      <Layout style={{ minHeight: '100vh' }}>
        <Header style={{ 
          background: '#fff', 
          borderBottom: '1px solid #f0f0f0',
          height: 80,
          lineHeight: '80px',
          padding: '0 16px'
        }}>
          <Space align="center" style={{ height: '100%' }}>
            <Image
              src={PluginLogo}
              alt="Plugin Logo"
              height={40}
              preview={false}
            />
            <div>
              <Title level={4} style={{ margin: 0, fontSize: '16px' }}>
                Cursor Talk To Figma Plugin
              </Title>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Connect Figma to Cursor AI using MCP
              </Text>
            </div>
          </Space>
        </Header>

        <Content style={{ padding: '16px' }}>
          <Tabs
            activeKey={currentRoute}
            onChange={(key) => navigate(key as RouteType)}
            items={tabItems}
            size="small"
            style={{ height: '100%' }}
          />
        </Content>
      </Layout>
    </ConfigProvider>
  );
}

// Mount the app
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}

export default App;
