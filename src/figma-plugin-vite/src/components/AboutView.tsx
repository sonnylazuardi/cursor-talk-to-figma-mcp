import { Space, Card, Typography, List, Button, Tag } from 'antd';
import { ExportOutlined, GithubOutlined } from '@ant-design/icons';

const { Title, Text, Link } = Typography;

// About view component
export function AboutView() {
  const openLink = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Card size="small">
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <Space align="center">
            <Title level={4} style={{ margin: 0 }}>About Cursor Talk To Figma Plugin</Title>
            <Tag color="blue">v1.0.0</Tag>
          </Space>
          
          <Text>
            This plugin allows Cursor AI to communicate with Figma, enabling
            AI-assisted design operations. Created by{' '}
            <Link onClick={() => openLink('https://github.com/sonnylazuardi')}>
              Sonny
              <ExportOutlined style={{ marginLeft: 4, fontSize: '12px' }} />
            </Link>
          </Text>
        </Space>
      </Card>

      <Card title="How to Use" size="small">
        <List size="small">
          <List.Item>1. Make sure the MCP server is running in Cursor</List.Item>
          <List.Item>2. Connect to the server using the port number (default: 3055)</List.Item>
          <List.Item>3. Once connected, you can interact with Figma through Cursor</List.Item>
          <List.Item>4. Use the Settings page to access advanced Figma operations</List.Item>
        </List>
      </Card>

      <Card title="Features" size="small">
        <List size="small">
          <List.Item>
            <Text strong>Document Management:</Text> Get document info, selection, and node details
          </List.Item>
          <List.Item>
            <Text strong>Element Creation:</Text> Create rectangles, frames, and text elements
          </List.Item>
          <List.Item>
            <Text strong>Text Operations:</Text> Set text content and scan text nodes
          </List.Item>
          <List.Item>
            <Text strong>Layout Controls:</Text> Auto-layout, padding, alignment, and spacing
          </List.Item>
          <List.Item>
            <Text strong>Styling:</Text> Fill colors, stroke colors, and corner radius
          </List.Item>
          <List.Item>
            <Text strong>Node Management:</Text> Move, resize, delete, and clone nodes
          </List.Item>
          <List.Item>
            <Text strong>Components:</Text> Work with local components and instances
          </List.Item>
          <List.Item>
            <Text strong>Annotations:</Text> Add and manage design annotations
          </List.Item>
          <List.Item>
            <Text strong>Prototyping:</Text> Handle prototype reactions and connections
          </List.Item>
        </List>
      </Card>

      <Card title="GitHub Repository" size="small">
        <Button 
          type="link" 
          icon={<GithubOutlined />}
          onClick={() => openLink('https://github.com/sonnylazuardi/cursor-talk-to-figma-mcp')}
        >
          View on GitHub
          <ExportOutlined style={{ marginLeft: 4, fontSize: '12px' }} />
        </Button>
      </Card>
    </Space>
  );
} 