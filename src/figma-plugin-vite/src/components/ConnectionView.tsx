// Connection view component for WebSocket connection management
import { useState, useEffect } from 'react';
import { 
  Space, 
  Button, 
  InputNumber,
  Alert, 
  Progress, 
  Typography, 
  Card, 
  Tag,
  Row,
  Col,
  notification
} from 'antd';
import { CheckOutlined, CloseOutlined, WifiOutlined, DisconnectOutlined } from '@ant-design/icons';
import { useWebSocket, ProgressData } from '../utils/websocket';

const { Text } = Typography;

interface ProgressState {
  visible: boolean;
  message: string;
  progress: number;
  status: string;
  percentage: string;
}

export function ConnectionView() {
  const { state, connect, disconnect } = useWebSocket();
  const [port, setPort] = useState<number>(3055);
  const [isConnecting, setIsConnecting] = useState(false);
  const [progressState, setProgressState] = useState<ProgressState>({
    visible: false,
    message: 'No operation in progress',
    progress: 0,
    status: 'Not started',
    percentage: '0%'
  });

  // Update progress UI
  const updateProgressUI = (progressData: ProgressData) => {
    setProgressState({
      visible: true,
      progress: progressData.progress || 0,
      percentage: `${progressData.progress || 0}%`,
      message: progressData.message || "Operation in progress",
      status: getStatusText(progressData.status)
    });

    // Hide progress container after 5 seconds if completed
    if (progressData.status === 'completed') {
      setTimeout(() => {
        setProgressState(prev => Object.assign({}, prev, { visible: false }));
      }, 5000);
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'started': return 'Started';
      case 'in_progress': return 'In Progress';
      case 'completed': return 'Completed';
      case 'error': return 'Error';
      default: return 'Not started';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'success';
      case 'error': return 'error';
      case 'in_progress': return 'processing';
      case 'started': return 'warning';
      default: return 'default';
    }
  };

  const handleConnect = async () => {
    const portNumber = port || 3055;
    setIsConnecting(true);
    
    try {
      await connect(portNumber);
      notification.success({
        message: 'Connection Successful',
        description: `Connected to WebSocket server on port ${portNumber}`,
        icon: <CheckOutlined />,
      });
    } catch (error) {
      console.error('Connection failed:', error);
      notification.error({
        message: 'Connection Failed',
        description: 'Failed to connect to WebSocket server',
        icon: <CloseOutlined />,
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    notification.warning({
      message: 'Disconnected',
      description: 'Disconnected from WebSocket server',
      icon: <DisconnectOutlined />,
    });
  };

  // Listen for progress updates from plugin
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data.pluginMessage;
      if (message?.type === 'command_progress') {
        updateProgressUI(message);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Card title="WebSocket Connection" size="small">
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div>
            <Text strong>WebSocket Server Port</Text>
            <InputNumber
              placeholder="3055"
              value={port}
              onChange={(value) => setPort(value || 3055)}
              min={1024}
              max={65535}
              disabled={state.connected}
              style={{ width: '100%', marginTop: 8 }}
            />
          </div>

          <Row gutter={8}>
            <Col>
              <Button 
                type="primary"
                onClick={handleConnect}
                disabled={state.connected || isConnecting}
                loading={isConnecting}
                icon={<WifiOutlined />}
              >
                {isConnecting ? 'Connecting...' : 'Connect'}
              </Button>
            </Col>
            
            <Col>
              <Button 
                onClick={handleDisconnect}
                disabled={!state.connected}
                danger
                icon={<DisconnectOutlined />}
              >
                Disconnect
              </Button>
            </Col>
          </Row>
        </Space>
      </Card>

      <Alert
        type={state.connected ? 'success' : 'error'}
        message={state.connected ? 'Connected' : 'Disconnected'}
        description={state.connectionMessage}
        icon={state.connected ? <CheckOutlined /> : <CloseOutlined />}
        showIcon
      />
      
      {/* Progress Bar Section */}
      {progressState.visible && (
        <Card title="Operation Progress" size="small">
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Row justify="space-between" align="middle">
              <Col>
                <Text>{progressState.message}</Text>
              </Col>
              <Col>
                <Tag color={getStatusColor(progressState.status)}>
                  {progressState.status}
                </Tag>
              </Col>
            </Row>
            
            <Progress 
              percent={progressState.progress} 
              status={progressState.status === 'error' ? 'exception' : 'active'}
              size="small"
            />
            
            <Row justify="space-between">
              <Col>
                <Text type="secondary" style={{ fontSize: '12px' }}>Progress</Text>
              </Col>
              <Col>
                <Text strong style={{ fontSize: '12px' }}>{progressState.percentage}</Text>
              </Col>
            </Row>
          </Space>
        </Card>
      )}
    </Space>
  );
} 