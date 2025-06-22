import { describe, test, expect, beforeAll } from 'bun:test';
import { validateCommandParams } from '../src/validation/schemas.js';
import type { FigmaCommand, CommandParams } from '../src/types/types.js';

/**
 * Mock communication tests that simulate the actual data flow
 * between server.ts and code.js through WebSocket
 */

describe('Server-to-Code Communication Tests', () => {
  
  // Mock data that simulates actual server.ts calls
  const mockServerCalls = {
    set_fill_color: {
      nodeId: 'test-node-123',
      color: { r: 1, g: 0.5, b: 0, a: 1 }
    },
    set_stroke_color: {
      nodeId: 'test-node-123',
      color: { r: 0, g: 0, b: 1, a: 0.8 },
      weight: 2
    },
    create_rectangle: {
      x: 100, y: 200, width: 150, height: 75,
      name: 'Test Rectangle',
      parentId: 'parent-frame-456'
    },
    create_frame: {
      x: 0, y: 0, width: 400, height: 300,
      fillColor: { r: 0.9, g: 0.9, b: 0.9 },
      strokeColor: { r: 0, g: 0, b: 0 },
      strokeWeight: 1
    },
    move_node: {
      nodeId: 'move-node-789',
      x: 50, y: 100
    },
    scan_text_nodes: {
      nodeId: 'container-node-abc',
      useChunking: true,
      chunkSize: 5
    },
    get_reactions: {
      nodeIds: ['node1', 'node2', 'node3']
    },
    create_connections: {
      connections: [
        { startNodeId: 'start1', endNodeId: 'end1', text: 'Flow 1' },
        { startNodeId: 'start2', endNodeId: 'end2' }
      ]
    }
  };

  describe('Mock server calls validation', () => {
    Object.entries(mockServerCalls).forEach(([command, params]) => {
      test(`${command} server call should pass validation`, () => {
        const isValid = validateCommandParams(command as FigmaCommand, params);
        expect(isValid).toBe(true);
        
        if (!isValid) {
          console.error(`Validation failed for ${command}:`, params);
        }
      });
    });
  });

  describe('Common edge cases', () => {
    test('color values at boundaries should be valid', () => {
      const boundaryColors = [
        { r: 0, g: 0, b: 0, a: 0 },       // All zeros
        { r: 1, g: 1, b: 1, a: 1 },       // All ones
        { r: 0.5, g: 0.7, b: 0.3 }        // No alpha (optional)
      ];

      boundaryColors.forEach(color => {
        const params = { nodeId: 'test', color };
        expect(validateCommandParams('set_fill_color', params)).toBe(true);
      });
    });

    test('optional parameters should work correctly', () => {
      // create_rectangle with minimal params
      const minimalRect = { x: 0, y: 0, width: 100, height: 100 };
      expect(validateCommandParams('create_rectangle', minimalRect)).toBe(true);

      // create_rectangle with all optional params
      const fullRect = { 
        ...minimalRect, 
        name: 'Named Rectangle', 
        parentId: 'parent-123' 
      };
      expect(validateCommandParams('create_rectangle', fullRect)).toBe(true);
    });

    test('array parameters should handle empty arrays', () => {
      // Empty nodeIds array
      expect(validateCommandParams('get_reactions', { nodeIds: [] })).toBe(true);
      
      // Empty connections array
      expect(validateCommandParams('create_connections', { connections: [] })).toBe(true);
    });
  });

  describe('Invalid data detection', () => {
    test('should catch color values out of range', () => {
      const invalidColor = { r: 2, g: 0.5, b: 0 }; // r > 1
      const params = { nodeId: 'test', color: invalidColor };
      
      expect(validateCommandParams('set_fill_color', params)).toBe(false);
    });

    test('should catch missing required fields', () => {
      // Missing nodeId
      expect(validateCommandParams('move_node', { x: 100, y: 200 })).toBe(false);
      
      // Missing dimensions
      expect(validateCommandParams('create_rectangle', { x: 0, y: 0 })).toBe(false);
    });

    test('should catch wrong data types', () => {
      // String instead of number
      const params = { nodeId: 'test', x: '100', y: 200 };
      expect(validateCommandParams('move_node', params)).toBe(false);
    });
  });

});

/**
 * Simulate the actual command dispatch that happens in code.js
 */
describe('Code.js Command Handler Simulation', () => {
  
  // Mock the handleCommand function signature from code.js
  function mockHandleCommand(command: FigmaCommand, params: any): boolean {
    // First validate the parameters
    if (!validateCommandParams(command, params)) {
      console.error(`Invalid parameters for ${command}:`, params);
      return false;
    }

    // Simulate successful handling
    console.log(`Mock handling ${command} with valid params`);
    return true;
  }

  test('all valid commands should be handled successfully', () => {
    const mockServerCalls = {
      set_fill_color: {
        nodeId: 'test-node-123',
        color: { r: 1, g: 0.5, b: 0, a: 1 }
      },
      move_node: {
        nodeId: 'move-node-789',
        x: 50, y: 100
      }
    };
    
    Object.entries(mockServerCalls).forEach(([command, params]) => {
      const result = mockHandleCommand(command as FigmaCommand, params);
      expect(result).toBe(true);
    });
  });

  test('invalid commands should be rejected', () => {
    const invalidCalls = [
      ['set_fill_color', { nodeId: 'test' }], // missing color
      ['move_node', { nodeId: 'test', x: 100 }], // missing y
      ['get_reactions', { nodeIds: 'not-array' }] // wrong type
    ];

    invalidCalls.forEach(([command, params]) => {
      const result = mockHandleCommand(command as FigmaCommand, params);
      expect(result).toBe(false);
    });
  });

}); 