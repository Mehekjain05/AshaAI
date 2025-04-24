// CareerFlow.tsx
import React, { useEffect, useCallback } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  addEdge,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  Connection,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';


interface CareerFlowProps {
  initialNodes?: Node[];
  initialEdges?: Edge[];
}

const CareerFlow: React.FC<CareerFlowProps> = ({ initialNodes = [], initialEdges = [] }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  return (
    <div style={{ height: '80vh', width: '100%', border: '1px solid #ccc' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        // nodeTypes={nodeTypes}
        fitView
        className="bg-gray-100"
      >
        <Controls />
        <Background variant="dots" gap={12} size={1} />
      </ReactFlow>
    </div>
  );
};

// Optional: Wrap this component with ReactFlowProvider higher in the tree

export default CareerFlow;
