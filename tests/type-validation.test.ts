import { describe, test, expect } from 'bun:test';
import { validateCommandParams, getValidationErrors } from '../src/validation/schemas.js';
import type { FigmaCommand } from '../src/types/types.js';

describe('Type Validation Tests', () => {
  
  describe('set_fill_color validation', () => {
    test('should accept valid color object structure', () => {
      const params = {
        nodeId: 'test-id',
        color: { r: 1, g: 0.5, b: 0, a: 1 }
      };
      
      expect(validateCommandParams('set_fill_color', params)).toBe(true);
      expect(getValidationErrors('set_fill_color', params)).toEqual([]);
    });

    test('should reject flat color structure', () => {
      const params = {
        nodeId: 'test-id',
        r: 1, g: 0.5, b: 0, a: 1  // Wrong: flat structure
      };
      
      expect(validateCommandParams('set_fill_color', params)).toBe(false);
      const errors = getValidationErrors('set_fill_color', params);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('set_stroke_color validation', () => {
    test('should accept valid color object with weight', () => {
      const params = {
        nodeId: 'test-id',
        color: { r: 1, g: 0.5, b: 0 },
        weight: 2
      };
      
      expect(validateCommandParams('set_stroke_color', params)).toBe(true);
    });
  });

  describe('create_rectangle validation', () => {
    test('should accept valid rectangle params', () => {
      const params = {
        x: 0, y: 0, width: 100, height: 100,
        name: 'Test Rectangle'
      };
      
      expect(validateCommandParams('create_rectangle', params)).toBe(true);
    });

    test('should reject missing required fields', () => {
      const params = {
        x: 0, y: 0
        // missing width, height
      };
      
      expect(validateCommandParams('create_rectangle', params)).toBe(false);
    });
  });

  describe('scan_text_nodes validation', () => {
    test('should accept valid scan params', () => {
      const params = {
        nodeId: 'test-id',
        useChunking: true,
        chunkSize: 10
      };
      
      expect(validateCommandParams('scan_text_nodes', params)).toBe(true);
    });
  });

  describe('get_reactions validation', () => {
    test('should accept array of node IDs', () => {
      const params = {
        nodeIds: ['id1', 'id2', 'id3']
      };
      
      expect(validateCommandParams('get_reactions', params)).toBe(true);
    });

    test('should reject non-array nodeIds', () => {
      const params = {
        nodeIds: 'not-an-array'
      };
      
      expect(validateCommandParams('get_reactions', params)).toBe(false);
    });
  });

  describe('create_connections validation', () => {
    test('should accept valid connections array', () => {
      const params = {
        connections: [
          { startNodeId: 'start1', endNodeId: 'end1', text: 'connection 1' },
          { startNodeId: 'start2', endNodeId: 'end2' }  // text is optional
        ]
      };
      
      expect(validateCommandParams('create_connections', params)).toBe(true);
    });
  });

  // Test commands that actually accept empty objects
  describe('empty parameter commands', () => {
    const emptyParamCommands: FigmaCommand[] = [
      'get_document_info',
      'get_selection', 
      'get_styles',
      'get_local_components',
      'read_my_design'
    ];

    emptyParamCommands.forEach(command => {
      test(`${command} should accept empty object`, () => {
        expect(validateCommandParams(command, {})).toBe(true);
      });
    });
  });

  // Test commands with minimal required parameters
  describe('commands with required parameters', () => {
    const commandsWithMinimalParams = [
      { command: 'get_node_info' as FigmaCommand, params: { nodeId: 'test' } },
      { command: 'move_node' as FigmaCommand, params: { nodeId: 'test', x: 0, y: 0 } },
      { command: 'set_layout_mode' as FigmaCommand, params: { nodeId: 'test', layoutMode: 'HORIZONTAL' } },
      { command: 'set_item_spacing' as FigmaCommand, params: { nodeId: 'test', itemSpacing: 10 } },
      { command: 'get_reactions' as FigmaCommand, params: { nodeIds: ['test'] } },
      { command: 'create_connections' as FigmaCommand, params: { connections: [] } }
    ];

    commandsWithMinimalParams.forEach(({ command, params }) => {
      test(`${command} should accept minimal valid params`, () => {
        expect(validateCommandParams(command, params)).toBe(true);
      });
    });
  });

});

// Integration test that validates all command types exist
describe('Command Coverage Tests', () => {
  test('all FigmaCommand types should have validation schemas defined', () => {
    const allCommands: FigmaCommand[] = [
      'get_document_info', 'get_selection', 'get_node_info', 'get_nodes_info',
      'read_my_design', 'create_rectangle', 'create_frame', 'create_text',
      'set_fill_color', 'set_stroke_color', 'move_node', 'resize_node',
      'delete_node', 'delete_multiple_nodes', 'get_styles', 'get_local_components',
      'create_component_instance', 'get_instance_overrides', 'set_instance_overrides',
      'export_node_as_image', 'join', 'set_corner_radius', 'clone_node',
      'set_text_content', 'scan_text_nodes', 'set_multiple_text_contents',
      'get_annotations', 'set_annotation', 'set_multiple_annotations',
      'scan_nodes_by_types', 'set_layout_mode', 'set_padding', 'set_axis_align',
      'set_layout_sizing', 'set_item_spacing', 'get_reactions',
      'set_default_connector', 'create_connections'
    ];

    // Test that each command has a schema defined
    allCommands.forEach(command => {
      test(`${command} should have a validation schema`, () => {
        // Import the schema object directly
        const { CommandParamsSchema } = require('../src/validation/schemas.js');
        expect(CommandParamsSchema[command]).toBeDefined();
      });
    });
  });
}); 