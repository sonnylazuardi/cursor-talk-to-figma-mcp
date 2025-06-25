import { useState, useEffect } from 'react';
import {
  Space,
  Tabs,
  Button,
  Input,
  Card,
  Typography,
  Divider,
  Row,
  Col,
  notification
} from 'antd';
import { CheckOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

type TabType = 'document' | 'annotations' | 'creation' | 'text' | 'layout' | 'styling' | 'management';

export function SettingsView() {
  const [activeTab, setActiveTab] = useState<TabType>('document');
  
  // Document & Selection inputs
  const [nodeIdInput, setNodeIdInput] = useState('');
  const [nodeIdsInput, setNodeIdsInput] = useState('');
  
  // Annotation inputs
  const [annotationNodeId, setAnnotationNodeId] = useState('');

  useEffect(() => {
    // Listen for messages from the plugin
    window.addEventListener('message', (event) => {
      const message = event.data.pluginMessage;
      if (message) {
        console.log('📥 Received from plugin:', message);
        
        if (message.type === 'plugin-ready') {
          // Plugin is ready
        }
      }
    });

    // Send ready message to plugin
    parent.postMessage({ pluginMessage: { type: 'ui-ready' } }, '*');
  }, []);

  const sendMessage = (type: string, data: Record<string, unknown> = {}) => {
    const message = Object.assign({ type }, data);
    console.log('📤 Sending to plugin:', message);
    parent.postMessage({ pluginMessage: message }, '*');
    
    // Show notification for user feedback
    notification.success({
      message: 'Command Sent',
      description: `Sent ${type} command to plugin`,
      icon: <CheckOutlined />,
      duration: 2,
    });
  };

  const renderDocumentTab = () => (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      {/* Test Section */}
      <Card title="Test Connection" size="small">
        <Button 
          onClick={() => sendMessage('test')}
          type="default"
        >
          Test Plugin Connection
        </Button>
      </Card>

      {/* Document & Selection Section */}
      <Card title="Document & Selection" size="small">
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Row gutter={8}>
            <Col>
              <Button onClick={() => sendMessage('get_document_info')}>
                Get Document Info
              </Button>
            </Col>
            <Col>
              <Button onClick={() => sendMessage('get_selection')}>
                Get Selection
              </Button>
            </Col>
            <Col>
              <Button onClick={() => sendMessage('read_my_design')}>
                Read My Design
              </Button>
            </Col>
          </Row>
          
          <Divider />
          
          <div>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>Get Node Info</Text>
            <Row gutter={8}>
              <Col flex="auto">
                <Input
                  placeholder="Node ID (e.g., 123:456)"
                  value={nodeIdInput}
                  onChange={(e) => setNodeIdInput(e.target.value)}
                />
              </Col>
              <Col>
                <Button 
                  onClick={() => sendMessage('get_node_info', { nodeId: nodeIdInput })}
                  disabled={!nodeIdInput}
                  type="primary"
                >
                  Get Node Info
                </Button>
              </Col>
            </Row>
          </div>

          <div>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>Get Multiple Nodes Info</Text>
            <Row gutter={8}>
              <Col flex="auto">
                <Input
                  placeholder="Node IDs (comma separated, e.g., 123:456, 789:012)"
                  value={nodeIdsInput}
                  onChange={(e) => setNodeIdsInput(e.target.value)}
                />
              </Col>
              <Col>
                <Button 
                  onClick={() => sendMessage('get_nodes_info', { 
                    nodeIds: nodeIdsInput.split(',').map(id => id.trim()).filter(id => id) 
                  })}
                  disabled={!nodeIdsInput}
                  type="primary"
                >
                  Get Nodes Info
                </Button>
              </Col>
            </Row>
          </div>
        </Space>
      </Card>
    </Space>
  );

  const renderAnnotationsTab = () => (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Card title="Get Annotations" size="small">
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Button onClick={() => sendMessage('get_annotations')} type="primary">
            Get All Annotations
          </Button>
          
          <Divider />
          
          <div>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>Get Specific Node Annotations</Text>
            <Row gutter={8}>
              <Col flex="auto">
                <Input
                  placeholder="Node ID (e.g., 123:456)"
                  value={annotationNodeId}
                  onChange={(e) => setAnnotationNodeId(e.target.value)}
                />
              </Col>
              <Col>
                <Button 
                  onClick={() => sendMessage('get_annotations', { 
                    nodeId: annotationNodeId,
                    includeCategories: true 
                  })}
                  disabled={!annotationNodeId}
                  type="primary"
                >
                  Get Node Annotations
                </Button>
              </Col>
            </Row>
          </div>
        </Space>
      </Card>
    </Space>
  );

  const tabItems = [
    {
      key: 'document',
      label: 'Document',
      children: renderDocumentTab(),
    },
    {
      key: 'annotations',
      label: 'Annotations',
      children: renderAnnotationsTab(),
    },
    {
      key: 'creation',
      label: 'Creation',
      children: (
        <Card size="small">
          <Text>Creation controls coming soon...</Text>
        </Card>
      ),
    },
    {
      key: 'text',
      label: 'Text',
      children: (
        <Card size="small">
          <Text>Text controls coming soon...</Text>
        </Card>
      ),
    },
    {
      key: 'layout',
      label: 'Layout',
      children: (
        <Card size="small">
          <Text>Layout controls coming soon...</Text>
        </Card>
      ),
    },
    {
      key: 'styling',
      label: 'Styling',
      children: (
        <Card size="small">
          <Text>Styling controls coming soon...</Text>
        </Card>
      ),
    },
    {
      key: 'management',
      label: 'Management',
      children: (
        <Card size="small">
          <Text>Management controls coming soon...</Text>
        </Card>
      ),
    },
  ];

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Title level={4}>Figma Plugin Controls</Title>
      
      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as TabType)}
        items={tabItems}
        size="small"
        style={{ width: '100%' }}
      />
    </Space>
  );
}
