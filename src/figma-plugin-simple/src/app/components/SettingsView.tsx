import React, { useState } from 'react';
import styles from '../app.module.scss';

interface SettingsViewProps {
  onSendMessage: (type: string, data?: Record<string, unknown>) => void;
}

interface AccordionSectionProps {
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function AccordionSection({ title, isExpanded, onToggle, children }: AccordionSectionProps) {
  return (
    <div className={styles.accordion}>
      <div 
        className={`${styles.accordionHeader} ${isExpanded ? styles.active : ''}`}
        onClick={onToggle}
      >
        <span className={`${styles.accordionIcon} ${isExpanded ? styles.expanded : ''}`}>
          ▶
        </span>
        <h3 className={styles.accordionTitle}>{title}</h3>
      </div>
      {isExpanded && (
        <div className={styles.accordionContent}>
          {children}
        </div>
      )}
    </div>
  );
}

export function SettingsView({ onSendMessage }: SettingsViewProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  
  // Document & Selection inputs
  const [nodeIdInput, setNodeIdInput] = useState('');
  const [nodeIdsInput, setNodeIdsInput] = useState('');
  
  // Annotation inputs
  const [annotationNodeId, setAnnotationNodeId] = useState('');
  
  // Creation inputs
  const [rectX, setRectX] = useState('100');
  const [rectY, setRectY] = useState('100');
  const [rectWidth, setRectWidth] = useState('100');
  const [rectHeight, setRectHeight] = useState('100');
  const [textContent, setTextContent] = useState('Hello Figma!');
  const [textX, setTextX] = useState('300');
  const [textY, setTextY] = useState('100');
  
  // Text inputs
  const [textNodeId, setTextNodeId] = useState('');
  const [newTextContent, setNewTextContent] = useState('Updated Text!');
  
  // Layout inputs
  const [layoutNodeId, setLayoutNodeId] = useState('');
  const [paddingValue, setPaddingValue] = useState('16');
  const [spacingValue, setSpacingValue] = useState('12');
  
  // Styling inputs
  const [styleNodeId, setStyleNodeId] = useState('');
  const [fillR, setFillR] = useState('0.2');
  const [fillG, setFillG] = useState('0.6');
  const [fillB, setFillB] = useState('1.0');
  const [strokeWeight, setStrokeWeight] = useState('2');
  const [cornerRadius, setCornerRadius] = useState('8');
  
  // Management inputs
  const [cloneNodeId, setCloneNodeId] = useState('');
  const [cloneX, setCloneX] = useState('50');
  const [cloneY, setCloneY] = useState('50');
  const [exportNodeId, setExportNodeId] = useState('');
  const [resizeNodeId, setResizeNodeId] = useState('');
  const [resizeWidth, setResizeWidth] = useState('200');
  const [resizeHeight, setResizeHeight] = useState('100');

  const toggleSection = (sectionKey: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  const sendMessage = (type: string, data: Record<string, unknown> = {}) => {
    onSendMessage(type, data);
  };

  return (
    <div className={styles.settingsContainer}>
      {/* Document & Selection Section */}
      <AccordionSection
        title="📄 Document & Selection"
        isExpanded={expandedSections.document}
        onToggle={() => toggleSection('document')}
      >
        <div className={styles.buttonGroup}>
          <button onClick={() => sendMessage('test')} className="secondary">
            Test Connection
          </button>
          <button onClick={() => sendMessage('get_document_info')}>
            Get Document Info
          </button>
          <button onClick={() => sendMessage('get_selection')}>
            Get Selection
          </button>
          <button onClick={() => sendMessage('read_my_design')}>
            Read My Design
          </button>
        </div>
        
        <div className={styles.inputSection}>
          <label><strong>Get Node Info</strong></label>
          <div className={styles.inputGroup}>
            <input
              placeholder="Node ID (e.g., 123:456) or leave empty for selected"
              value={nodeIdInput}
              onChange={(e) => setNodeIdInput(e.target.value)}
            />
            <button 
              onClick={() => sendMessage('get_node_info', { 
                nodeId: nodeIdInput || 'selected' 
              })}
              className="primary"
            >
              Get Node Info
            </button>
          </div>
        </div>

        <div className={styles.inputSection}>
          <label><strong>Get Multiple Nodes Info</strong></label>
          <div className={styles.inputGroup}>
            <input
              placeholder="Node IDs (comma separated, e.g., 123:456, 789:012)"
              value={nodeIdsInput}
              onChange={(e) => setNodeIdsInput(e.target.value)}
            />
            <button 
              onClick={() => sendMessage('get_nodes_info', { 
                nodeIds: nodeIdsInput.split(',').map(id => id.trim()).filter(id => id) 
              })}
              disabled={!nodeIdsInput}
              className="primary"
            >
              Get Nodes Info
            </button>
          </div>
        </div>
      </AccordionSection>

      {/* Creation Controls Section */}
      <AccordionSection
        title="🎨 Creation Controls"
        isExpanded={expandedSections.creation}
        onToggle={() => toggleSection('creation')}
      >
        <div className={styles.inputSection}>
          <label><strong>Create Rectangle</strong></label>
          <div className={styles.gridInput2}>
            <input placeholder="X" value={rectX} onChange={(e) => setRectX(e.target.value)} />
            <input placeholder="Y" value={rectY} onChange={(e) => setRectY(e.target.value)} />
            <input placeholder="Width" value={rectWidth} onChange={(e) => setRectWidth(e.target.value)} />
            <input placeholder="Height" value={rectHeight} onChange={(e) => setRectHeight(e.target.value)} />
          </div>
          <button onClick={() => sendMessage('create_rectangle', { 
            x: parseInt(rectX), y: parseInt(rectY), 
            width: parseInt(rectWidth), height: parseInt(rectHeight) 
          })}>
            Create Rectangle
          </button>
        </div>

        <div className={styles.inputSection}>
          <label><strong>Create Text</strong></label>
          <div className={styles.gridInput3}>
            <input placeholder="X" value={textX} onChange={(e) => setTextX(e.target.value)} />
            <input placeholder="Y" value={textY} onChange={(e) => setTextY(e.target.value)} />
            <input placeholder="Text content" value={textContent} onChange={(e) => setTextContent(e.target.value)} />
          </div>
          <button onClick={() => sendMessage('create_text', { 
            x: parseInt(textX), y: parseInt(textY), text: textContent 
          })}>
            Create Text
          </button>
        </div>

        <div className={styles.buttonGroup}>
          <button onClick={() => sendMessage('create_frame', { x: 200, y: 100, width: 200, height: 150 })}>
            Create Frame (200x150)
          </button>
        </div>
      </AccordionSection>

      {/* Text Controls Section */}
      <AccordionSection
        title="📝 Text Controls"
        isExpanded={expandedSections.text}
        onToggle={() => toggleSection('text')}
      >
        <div className={styles.inputSection}>
          <label><strong>Scan Text Nodes</strong></label>
          <div className={styles.inputGroup}>
            <input
              placeholder="Node ID (leave empty for selected node)"
              value={textNodeId}
              onChange={(e) => setTextNodeId(e.target.value)}
            />
            <button onClick={() => sendMessage('scan_text_nodes', { 
              nodeId: textNodeId || 'selected' 
            })}>
              Scan Text Nodes
            </button>
          </div>
        </div>

        <div className={styles.inputSection}>
          <label><strong>Update Text Content</strong></label>
          <div className={styles.inputGroup}>
            <input
              placeholder="New text content"
              value={newTextContent}
              onChange={(e) => setNewTextContent(e.target.value)}
            />
            <button onClick={() => sendMessage('set_text_content', { 
              nodeId: textNodeId || 'selected', 
              text: newTextContent 
            })}>
              Update Text
            </button>
          </div>
        </div>

        <div className={styles.buttonGroup}>
          <button onClick={() => sendMessage('get_styles')}>
            Get Text Styles
          </button>
        </div>
      </AccordionSection>

      {/* Layout Controls Section */}
      <AccordionSection
        title="📐 Layout Controls"
        isExpanded={expandedSections.layout}
        onToggle={() => toggleSection('layout')}
      >
        <div className={styles.inputSection}>
          <label><strong>Target Node ID</strong></label>
          <input
            placeholder="Node ID (leave empty for selected node)"
            value={layoutNodeId}
            onChange={(e) => setLayoutNodeId(e.target.value)}
          />
        </div>

        <div className={styles.buttonGroup}>
          <button onClick={() => sendMessage('set_layout_mode', { 
            nodeId: layoutNodeId || 'selected', 
            layoutMode: 'HORIZONTAL' 
          })}>
            Set Horizontal Layout
          </button>
          <button onClick={() => sendMessage('set_layout_mode', { 
            nodeId: layoutNodeId || 'selected', 
            layoutMode: 'VERTICAL' 
          })}>
            Set Vertical Layout
          </button>
        </div>

        <div className={styles.inputSection}>
          <label><strong>Set Padding</strong></label>
          <div className={styles.inputGroup}>
            <input
              placeholder="Padding value"
              value={paddingValue}
              onChange={(e) => setPaddingValue(e.target.value)}
            />
            <button onClick={() => sendMessage('set_padding', { 
              nodeId: layoutNodeId || 'selected', 
              paddingTop: parseInt(paddingValue), 
              paddingRight: parseInt(paddingValue), 
              paddingBottom: parseInt(paddingValue), 
              paddingLeft: parseInt(paddingValue) 
            })}>
              Set Padding
            </button>
          </div>
        </div>

        <div className={styles.inputSection}>
          <label><strong>Set Item Spacing</strong></label>
          <div className={styles.inputGroup}>
            <input
              placeholder="Spacing value"
              value={spacingValue}
              onChange={(e) => setSpacingValue(e.target.value)}
            />
            <button onClick={() => sendMessage('set_item_spacing', { 
              nodeId: layoutNodeId || 'selected', 
              itemSpacing: parseInt(spacingValue) 
            })}>
              Set Item Spacing
            </button>
          </div>
        </div>
      </AccordionSection>

      {/* Styling Controls Section */}
      <AccordionSection
        title="🎨 Styling Controls"
        isExpanded={expandedSections.styling}
        onToggle={() => toggleSection('styling')}
      >
        <div className={styles.inputSection}>
          <label><strong>Target Node ID</strong></label>
          <input
            placeholder="Node ID (leave empty for selected node)"
            value={styleNodeId}
            onChange={(e) => setStyleNodeId(e.target.value)}
          />
        </div>

        <div className={styles.inputSection}>
          <label><strong>Set Fill Color (RGB 0-1)</strong></label>
          <div className={styles.gridInput4}>
            <input placeholder="R" value={fillR} onChange={(e) => setFillR(e.target.value)} />
            <input placeholder="G" value={fillG} onChange={(e) => setFillG(e.target.value)} />
            <input placeholder="B" value={fillB} onChange={(e) => setFillB(e.target.value)} />
            <button onClick={() => sendMessage('set_fill_color', { 
              nodeId: styleNodeId || 'selected', 
              r: parseFloat(fillR), g: parseFloat(fillG), b: parseFloat(fillB) 
            })}>
              Set Fill
            </button>
          </div>
        </div>

        <div className={styles.inputSection}>
          <label><strong>Set Stroke</strong></label>
          <div className={styles.inputGroup}>
            <input
              placeholder="Stroke weight"
              value={strokeWeight}
              onChange={(e) => setStrokeWeight(e.target.value)}
            />
            <button onClick={() => sendMessage('set_stroke_color', { 
              nodeId: styleNodeId || 'selected', 
              r: 1.0, g: 0.2, b: 0.2, 
              weight: parseInt(strokeWeight) 
            })}>
              Set Red Stroke
            </button>
          </div>
        </div>

        <div className={styles.inputSection}>
          <label><strong>Set Corner Radius</strong></label>
          <div className={styles.inputGroup}>
            <input
              placeholder="Radius value"
              value={cornerRadius}
              onChange={(e) => setCornerRadius(e.target.value)}
            />
            <button onClick={() => sendMessage('set_corner_radius', { 
              nodeId: styleNodeId || 'selected', 
              radius: parseInt(cornerRadius) 
            })}>
              Set Corner Radius
            </button>
          </div>
        </div>
      </AccordionSection>

      {/* Annotations Section */}
      <AccordionSection
        title="📋 Annotations"
        isExpanded={expandedSections.annotations}
        onToggle={() => toggleSection('annotations')}
      >
        <div className={styles.buttonGroup}>
          <button onClick={() => sendMessage('get_annotations')} className="primary">
            Get All Annotations
          </button>
        </div>
        
        <div className={styles.inputSection}>
          <label><strong>Get Specific Node Annotations</strong></label>
          <div className={styles.inputGroup}>
            <input
              placeholder="Node ID (e.g., 123:456)"
              value={annotationNodeId}
              onChange={(e) => setAnnotationNodeId(e.target.value)}
            />
            <button 
              onClick={() => sendMessage('get_annotations', { 
                nodeId: annotationNodeId,
                includeCategories: true 
              })}
              disabled={!annotationNodeId}
              className="primary"
            >
              Get Node Annotations
            </button>
          </div>
        </div>
      </AccordionSection>

      {/* Management Controls Section */}
      <AccordionSection
        title="⚙️ Management Controls"
        isExpanded={expandedSections.management}
        onToggle={() => toggleSection('management')}
      >
        <div className={styles.buttonGroup}>
          <button onClick={() => sendMessage('get_local_components')}>
            Get Local Components
          </button>
        </div>

        <div className={styles.inputSection}>
          <label><strong>Clone Node</strong></label>
          <div className={styles.gridInputManage}>
            <input placeholder="Node ID (leave empty for selected)" value={cloneNodeId} onChange={(e) => setCloneNodeId(e.target.value)} />
            <input placeholder="X offset" value={cloneX} onChange={(e) => setCloneX(e.target.value)} />
            <input placeholder="Y offset" value={cloneY} onChange={(e) => setCloneY(e.target.value)} />
            <button onClick={() => sendMessage('clone_node', { 
              nodeId: cloneNodeId || 'selected', 
              x: parseInt(cloneX), y: parseInt(cloneY) 
            })}>
              Clone
            </button>
          </div>
        </div>

        <div className={styles.inputSection}>
          <label><strong>Export Node as Image</strong></label>
          <div className={styles.inputGroup}>
            <input
              placeholder="Node ID (leave empty for selected)"
              value={exportNodeId}
              onChange={(e) => setExportNodeId(e.target.value)}
            />
            <button onClick={() => sendMessage('export_node_as_image', { 
              nodeId: exportNodeId || 'selected', 
              format: 'PNG' 
            })}>
              Export as PNG
            </button>
          </div>
        </div>

        <div className={styles.inputSection}>
          <label><strong>Resize Node</strong></label>
          <div className={styles.gridInputManage}>
            <input placeholder="Node ID (leave empty for selected)" value={resizeNodeId} onChange={(e) => setResizeNodeId(e.target.value)} />
            <input placeholder="Width" value={resizeWidth} onChange={(e) => setResizeWidth(e.target.value)} />
            <input placeholder="Height" value={resizeHeight} onChange={(e) => setResizeHeight(e.target.value)} />
            <button onClick={() => sendMessage('resize_node', { 
              nodeId: resizeNodeId || 'selected', 
              width: parseInt(resizeWidth), height: parseInt(resizeHeight) 
            })}>
              Resize
            </button>
          </div>
        </div>
      </AccordionSection>
    </div>
  );
} 