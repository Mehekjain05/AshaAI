import React, { useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Node,
  Edge
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';

interface LearningPathStage {
  stage: string;
  topics: string[];
}

interface LearningPathFlowProps {
  pathData: LearningPathStage[];
}

const nodeWidth = 200;
const nodeHeightPerTopic = 25;
const baseNodeHeight = 50;
const verticalGap = 80;
const horizontalOffset = nodeWidth + 100;

const LearningPathFlow: React.FC<LearningPathFlowProps> = ({ pathData }) => {
  const initialNodes = useMemo(() => {
    return pathData.map((item, index): Node => {
      const nodeHeight = baseNodeHeight + item.topics.length * nodeHeightPerTopic;

      return {
        id: `stage-${index}`,
        position: {
          x: index % 2 === 0 ? 0 : horizontalOffset,
          y: index * (baseNodeHeight + verticalGap)
        },
        data: {
          label: item.stage,
          topics: item.topics
        },
        type: 'default',
        style: {
          width: nodeWidth,
          padding: '10px',
          border: '1px solid #ddd',
          borderRadius: '8px',
          background: '#f9f9f9',
          textAlign: 'center',
        },
      };
    });
  }, [pathData]);

  const nodesWithFormattedLabels = useMemo(() => {
    return initialNodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        label: (
          <div className="text-left">
            <strong className="block text-center mb-2 text-blue-600">
              {node.data.label as string}
            </strong>
            <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
              {(node.data.topics as string[]).map((topic, i) => (
                <li key={i}>{topic}</li>
              ))}
            </ul>
          </div>
        ),
      },
    }));
  }, [initialNodes]);

  const initialEdges = useMemo(() => {
    const edges: Edge[] = [];
    for (let i = 0; i < pathData.length - 1; i++) {
      edges.push({
        id: `edge-${i}-${i + 1}`,
        source: `stage-${i}`,
        target: `stage-${i + 1}`,
        animated: true,
        type: 'smoothstep',
        style: { stroke: '#60a5fa', strokeWidth: 2 },
      });
    }
    return edges;
  }, [pathData]);

  const [nodes, setNodes, onNodesChange] = useNodesState(nodesWithFormattedLabels);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  return (
    <div
      style={{
        height: 300 + pathData.length * 60,
        width: '100%',
        overflow: 'auto'
      }}
      className="border rounded-lg my-2 bg-white"
    >
      <p className="text-sm text-gray-600 font-medium p-2 border-b">Suggested Learning Path:</p>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        fitViewOptions={{ padding: 0.2 }}
      >
        <Background color="#e0e0e0" gap={16} />
        <Controls showInteractive={false} />
        <MiniMap nodeStrokeWidth={3} zoomable pannable />
      </ReactFlow>
    </div>
  );
};

export default LearningPathFlow;
