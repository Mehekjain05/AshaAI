import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Panel,
  Connection,
  NodeTypes,
  EdgeTypes,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { DocumentNode } from './DocumentNode';
import { ChatNode } from './ChatNode';
import { EdgeWithButton } from './EdgeWithButton';
import axios from 'axios';

type Message = {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
};

// Default nodes and edges
const initialNodes = [
  {
    id: 'chat-1',
    type: 'chatNode',
    position: { x: 400, y: 200 },
    data: { 
      messages: [] as Message[],
      onSendMessage: () => {}
    },
  },
];

const initialEdges: any[] = [];

const nodeTypes: NodeTypes = {
  documentNode: DocumentNode,
  chatNode: ChatNode,
};

const edgeTypes: EdgeTypes = {
  custom: EdgeWithButton,
};

export const DocumentCanvas = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [messages, setMessages] = useState<Message[]>([]);

  // Handle file drops
  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach((file, index) => {
      const reader = new FileReader();
      
      reader.onload =  async () => {
        // Create a preview for the file
        const preview = reader.result as string;
        
        // Generate node position
        const position = {
          x: 100,
          y: 100 + (index * 120),
        };
        
        // Create a new document node
        const newNode = {
          id: `document-${Date.now()}-${index}`,
          type: 'documentNode',
          position,
          data: {
            id: `document-${Date.now()}-${index}`,
            label: file.name,
            content: file.type.startsWith('text/') ? preview : undefined,
            type: file.type,
            file,
            preview,
          },
        };
        
        // Add the new node to the flowchart
        setNodes((nds:any) => [...nds, newNode]);

        // Optionally, you can upload the file to a server here
        alert('File uploaded successfully');
    
      };
      
      if (file.type.startsWith('text/')) {
        reader.readAsText(file);
      } else if (file.type.startsWith('image/')) {
        reader.readAsDataURL(file);
      } else {
        // For other file types just use the name
        const newNode = {
          id: `document-${Date.now()}-${index}`,
          type: 'documentNode',
          position: { x: 100, y: 100 + (index * 120) },
          data: {
            id: `document-${Date.now()}-${index}`,
            label: file.name,
            type: file.type,
            file,
          },
        };
        
        setNodes((nds) => [...nds, newNode]);
      }
    });

    console.log('Accepted files:', acceptedFiles);

    const formData = new FormData();
    for (let i = 0; i < acceptedFiles.length; i++) {
      formData.append("documents", acceptedFiles[i]);
    }
  
  
       fetch('/api/upload-new', {
          method: 'POST',
          credentials: 'include', // required if session is involved
          body: formData,
        }).then((res) => {
          if (res.status === 200) {
            console.log('Files uploaded successfully');
          } else {
            console.error('Error uploading files');
          }
        }).catch((error) => {
          console.error('Error:', error);
        });
      
   
  
 

  }, [setNodes]);
  

  //   const newNodes: any[] = [];
  
  //   const readFileAsPreview = (file: File, index: number) => {
  //     return new Promise<void>((resolve) => {
  //       const reader = new FileReader();
  //       const id = `document-${Date.now()}-${index}`;
  //       const position = { x: 100, y: 100 + index * 120 };
  
  //       reader.onload = () => {
  //         const preview = reader.result as string;
  //         let content = file.type.startsWith('text/') ? preview : undefined;
  
  //         const newNode = {
  //           id,
  //           type: 'documentNode',
  //           position,
  //           data: {
  //             id,
  //             label: file.name,
  //             content,
  //             type: file.type,
  //             file,
  //             preview: content || (file.type.startsWith('image/') ? preview : undefined),
  //           },
  //         };
  //         newNodes.push(newNode);
  //         resolve();
  //       };
  
  //       if (file.type.startsWith('text/')) {
  //         reader.readAsText(file);
  //       } else if (file.type.startsWith('image/')) {
  //         reader.readAsDataURL(file);
  //       } else {
  //         const newNode = {
  //           id,
  //           type: 'documentNode',
  //           position,
  //           data: {
  //             id,
  //             label: file.name,
  //             type: file.type,
  //             file,
  //           },
  //         };
  //         newNodes.push(newNode);
  //         resolve();
  //       }
  //     });
  //   };
  
  //   // Wait for all files to be processed
  //   await Promise.all(acceptedFiles.map(readFileAsPreview));
  
  //   // Update nodes after all files are processed
  //   setNodes((nds) => [...nds, ...newNodes]);
  
  //   // Upload to server
  //   const formData = new FormData();
  //   acceptedFiles.forEach((file) => formData.append("documents", file));
  
  //   fetch('/api/upload-new', {
  //     method: 'POST',
  //     credentials: 'include',
  //     body: formData,
  //   })
  //     .then((res) => {
  //       if (res.status === 200) {
  //         console.log('Files uploaded successfully');
  //       } else {
  //         console.error('Error uploading files');
  //       }
  //     })
  //     .catch((error) => {
  //       console.error('Error:', error);
  //     });
  // }, [setNodes]);
  

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  // Connect nodes with edges
  // const onConnect = useCallback(
  //   (params: Connection) => {
  //     // Only allow connecting from document nodes to the chat node
  //     const sourceNode = nodes.find(node => node.id === params.source);
  //     const targetNode = nodes.find(node => node.id === params.target);
      
  //     if (sourceNode?.type === 'documentNode' && targetNode?.type === 'chatNode') {
  //       const edge = {
  //         ...params,
  //         type: 'custom',
  //         animated: true,
  //         style: { stroke: '#6366f1', strokeWidth: 2 },
  //         markerEnd: {
  //           type: MarkerType.ArrowClosed,
  //           width: 20,
  //           height: 20,
  //           color: '#6366f1',
  //         },
  //         data: {
  //           label: 'connected',
  //         },
  //       };
  //       setEdges((eds) => addEdge(edge, eds));
  //     }
  //   },
  //   [nodes, setEdges]
  // );

  // const onConnect = useCallback(
  //   (params: Connection) => {
  //     const sourceNode = nodes.find(node => node.id === params.source);
  //     const targetNode = nodes.find(node => node.id === params.target);
      
  //     if (sourceNode?.type === 'documentNode' && targetNode?.type === 'chatNode') {
  //       const newEdge = {
  //         ...params,
  //         type: 'custom',
  //         animated: true,
  //         style: { stroke: '#6366f1', strokeWidth: 2 },
  //         markerEnd: {
  //           type: MarkerType.ArrowClosed,
  //           width: 20,
  //           height: 20,
  //           color: '#6366f1',
  //         },
  //         data: {
  //           label: 'connected',
  //         },
  //       };
  
  //       // 👇 Update edges and then compute connected files
  //       setEdges((eds) => {
  //         const updatedEdges = addEdge(newEdge, eds);
  //         const connectedFileNames = getConnectedFileNames(); // pass latest edges here
  //         console.log('Connected file names (live):', connectedFileNames);
  //         return updatedEdges;
  //       });
  //     }
  //   },
  //   [nodes, setEdges]
  // );
  


  // Send a message from the user to the AI
  // const handleSendMessage = async (text: string) => {

    

  //   const userMessage: Message = {
  //     id: `msg-${Date.now()}-user`,
  //     text,
  //     sender: 'user',
  //     timestamp: new Date(),
  //   };
    
  //   setMessages((prevMessages) => [...prevMessages, userMessage]);
    
 


  //   // Simulate AI response
  //   setTimeout( async () => {
  //     const connectedDocuments = edges
  //       .filter(edge => edge.target === 'chat-1')
  //       .map(edge => nodes.find(node => node.id === edge.source))
  //       .filter(Boolean);
      

  //          // Send the message to the server
  //   const connectedFileNames = getConnectedFileNames();
  //   console.log('Connected file names:', connectedFileNames);
  //    let aiResponse =  await fetch('/api/connected-files', {
  //         method: 'POST',
  //         headers: { 'Content-Type': 'application/json' },
  //         body: JSON.stringify({
  //           question: text,
  //           connected_files: connectedFileNames,
  //         }),
  //       });

  //       let responseText = '';

  //       if (connectedDocuments.length === 0) {
  //         responseText = "I don't have any documents connected. Please connect some documents to help me answer your question.";
  //       } else {
  //         if (aiResponse.ok) {
  //           const responseBody = await aiResponse.text();
        
  //           try {
  //             const parsed = JSON.parse(responseBody);
  //             responseText = parsed.message || 'AI responded, but no message was returned.';
  //           } catch (err) {
  //             responseText = 'Received invalid response from the server.';
  //           }
  //         } else {
  //           responseText = 'Failed to get a response from the AI server.';
  //         }
  //       }
      
  //     const aiMessage: Message = {
  //       id: `msg-${Date.now()}-ai`,
  //       text: responseText,
  //       sender: 'ai',
  //       timestamp: new Date(),
  //     };
      
  //     setMessages((prevMessages) => [...prevMessages, aiMessage]);
  //   }, 100);
  // };


  // ✅ Utility to extract file names from edges and nodes
const getConnectedFileNames = () => {
  return edges
    .filter((edge) => edge.target === 'chat-1')
    .map((edge) => {
      const node = nodes.find((n) => n.id === edge.source);
      return node?.data?.label;
    })
    .filter(Boolean);
};

const onConnect = useCallback(
  (params: Connection) => {
    const sourceNode = nodes.find(node => node.id === params.source);
    const targetNode = nodes.find(node => node.id === params.target);

    if (sourceNode?.type === 'documentNode' && targetNode?.type === 'chatNode') {
      const newEdge = {
        ...params,
        type: 'custom',
        animated: true,
        style: { stroke: '#6366f1', strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
          color: '#6366f1',
        },
        data: {
          label: 'connected',
        },
      };

      // ✅ Just update edges here, don't call getConnectedFileNames() yet
      setEdges((eds) => addEdge(newEdge, eds));
    }
  },
  [nodes, setEdges]
);

React.useEffect(() => {
  setNodes((nds) =>
    nds.map((node) => {
      if (node.id === 'chat-1') {
        node.data = {
          ...node.data,
          messages,
          onSendMessage: handleSendMessage,
        };
      }
      return node;
    })
  );
}, [messages, setNodes]);

// ✅ Always get latest connected documents when sending message
const handleSendMessage = async (text: string) => {
  const userMessage: Message = {
    id: `msg-${Date.now()}-user`,
    text,
    sender: 'user',
    timestamp: new Date(),
  };

  const connectedFileNames = getConnectedFileNames();
  console.log('Connected file names at time of question:', connectedFileNames);

  setMessages((prevMessages) => [...prevMessages, userMessage]);
 
  // Simulate AI response delay
  // setTimeout(async () => {


    let responseText = '';

    if (connectedFileNames.length === 0) {
      responseText = "I don't have any documents connected. Please connect some documents to help me answer your question.";
    } else {
      try {
        const res = await fetch('/api/connected-files', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: text,
            connected_files: connectedFileNames,
          }),
        });

        const body = await res.text();
        const parsed = JSON.parse(body);
        responseText = parsed.message || 'AI responded, but no message was returned.';
      } catch (err) {
        responseText = 'Received invalid response from the server.';
      }
    }

    const aiMessage: Message = {
      id: `msg-${Date.now()}-ai`,
      text: responseText,
      sender: 'ai',
      timestamp: new Date(),
    };

    setMessages((prevMessages) => [...prevMessages, aiMessage]);
  // }, 100);
};


  // Update chat node with the messages and handler
  

  // Delete a connection edge
  const onEdgeDelete = useCallback(
    (edgeId: string) => {
      setEdges((eds) => eds.filter((edge) => edge.id !== edgeId));
    },
    [setEdges]
  );

  React.useEffect(() => {
    // Update all edges with delete handler
    setEdges((eds) =>
      eds.map((edge) => ({
        ...edge,
        data: {
          ...edge.data,
          onDelete: () => onEdgeDelete(edge.id),
        },
      }))
    );
  }, [onEdgeDelete, setEdges]);


  // const getConnectedFileNames = () => {
  //   const connectedDocuments = edges
  //     .filter(edge => edge.target === 'chat-1')
  //     .map(edge => nodes.find(node => node.id === edge.source))
  //     .filter((node) => node?.type === 'documentNode');
  
  //   const fileNames = connectedDocuments.map(doc => doc?.data?.label);
  //   return fileNames;
  // };
  
  
  return (
    <div className="w-full h-screen bg-gray-50">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        className="bg-slate-50"
      >
        <Background color="#aaa" gap={16} />
        <Controls />
        <MiniMap />
        
        <Panel position="top-left" className="w-64 p-4 bg-white rounded-lg shadow-md border border-gray-200">
          <div {...getRootProps()} className={`p-4 border-2 border-dashed rounded-lg ${
            isDragActive ? 'border-primary bg-primary/5 animate-pulse' : 'border-gray-300'
          } cursor-pointer flex flex-col items-center justify-center`}>
            <input {...getInputProps()} />
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 mb-2">
              <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path>
              <path d="M12 12v9"></path>
              <path d="m16 16-4-4-4 4"></path>
            </svg>
            <p className="text-sm text-gray-600">
              {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
            </p>
            <p className="text-xs text-gray-500 mt-1">or click to browse</p>
          </div>
          
          <div className="mt-4">
            <h3 className="font-medium text-sm mb-2">Instructions:</h3>
            <ol className="text-xs text-gray-600 list-decimal list-inside space-y-1">
              <li>Upload documents by dragging & dropping files</li>
              <li>Connect documents to the AI by dragging lines</li>
              <li>Ask questions about your connected documents</li>
            </ol>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
};