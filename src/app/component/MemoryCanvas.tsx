// "use client";

// import { useEffect } from "react";  
// import ReactFlow, {
//   Background,
//   Controls,
//   MiniMap,
//   useEdgesState,
//   useNodesState,
// } from "reactflow";
// import "reactflow/dist/style.css";


// interface NodeData {
//   id: string;
//   label: string;
//   type: "user" | "bot" | "file";
// }

// interface MemoryCanvasProps {
//   messages: { sender: "user" | "bot"; text: string }[];
//   fileName?: string | null;
// }

// export default function MemoryCanvas({ messages, fileName }: MemoryCanvasProps) {
//   const [nodes, setNodes, onNodesChange] = useNodesState([]);
//   const [edges, setEdges, onEdgesChange] = useEdgesState([]);

//   useEffect(() => {
//     const newNodes: any[] = [];
//     const newEdges: any[] = [];

//     messages.forEach((msg, index) => {
//       const id = `node-${index}`;
//       newNodes.push({
//         id,
//         data: { label: `${msg.sender === "user" ? "👤" : "🤖"} ${msg.text}` },
//         position: { x: Math.random() * 500, y: index * 100 },
//         style: {
//           background: msg.sender === "user" ? "#3b82f6" : "#9333ea",
//           color: "white",
//           padding: 10,
//           borderRadius: 12,
//           fontSize: 12,
//         },
//       });

//       if (index > 0) {
//         newEdges.push({
//           id: `edge-${index}`,
//           source: `node-${index - 1}`,
//           target: id,
//           animated: true,
//           style: { stroke: "#888" },
//         });
//       }
//     });

//     if (fileName) {
//       newNodes.push({
//         id: "file-node",
//         data: { label: `📂 ${fileName}` },
//         position: { x: 250, y: -100 },
//         style: {
//           background: "#16a34a",
//           color: "white",
//           padding: 10,
//           borderRadius: 12,
//         },
//       });

//       // Connect file node to first message
//       if (messages.length > 0) {
//         newEdges.push({
//           id: "file-edge",
//           source: "file-node",
//           target: "node-0",
//           animated: true,
//           style: { stroke: "#16a34a" },
//         });
//       }
//     }

//     setNodes(newNodes);
//     setEdges(newEdges);
//   }, [messages, fileName]);

//   return (
//     <div style={{ height: 500, width: "100%" }} className="rounded-xl shadow-lg border">
//       <ReactFlow
//         nodes={nodes}
//         edges={edges}
//         onNodesChange={onNodesChange}
//         onEdgesChange={onEdgesChange}
//         fitView
//       >
//         <Background gap={16} color="#aaa" />
//         <MiniMap />
//         <Controls />
//       </ReactFlow>
//     </div>
//   );
// }

"use client";

import { useEffect, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useEdgesState,
  useNodesState,
} from "reactflow";
import "reactflow/dist/style.css";

interface MemoryCanvasProps {
  messages: { sender: "user" | "bot"; text: string }[];
  fileName?: string | null;
  darkMode?: boolean; // ✅ now respects dark mode
}

export default function MemoryCanvas({ messages, fileName, darkMode }: MemoryCanvasProps) {
  const [viewMode, setViewMode] = useState<"timeline" | "comparison" | "summary">("timeline");

  // ReactFlow states
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Build graph nodes/edges for "summary" mode
  useEffect(() => {
    if (viewMode !== "summary") return;

    const newNodes: any[] = [];
    const newEdges: any[] = [];

    messages.forEach((msg, index) => {
      const id = `node-${index}`;
      newNodes.push({
        id,
        data: { label: `${msg.sender === "user" ? "👤" : "🤖"} ${msg.text}` },
        position: { x: Math.random() * 500, y: index * 100 },
        style: {
          background: msg.sender === "user" ? "#3b82f6" : "#9333ea",
          color: "white",
          padding: 10,
          borderRadius: 12,
          fontSize: 12,
          maxWidth: 250,
          wordWrap: "break-word",
        },
      });

      if (index > 0) {
        newEdges.push({
          id: `edge-${index}`,
          source: `node-${index - 1}`,
          target: id,
          animated: true,
          style: { stroke: darkMode ? "#ccc" : "#555" },
        });
      }
    });

    if (fileName) {
      newNodes.push({
        id: "file-node",
        data: { label: `📂 ${fileName}` },
        position: { x: 250, y: -100 },
        style: {
          background: "#16a34a",
          color: "white",
          padding: 10,
          borderRadius: 12,
        },
      });

      if (messages.length > 0) {
        newEdges.push({
          id: "file-edge",
          source: "file-node",
          target: "node-0",
          animated: true,
          style: { stroke: "#16a34a" },
        });
      }
    }

    setNodes(newNodes);
    setEdges(newEdges);
  }, [messages, fileName, viewMode, darkMode]);

  return (
    <div
      className={`rounded-xl shadow-lg border p-4 space-y-4 transition-colors ${
        darkMode ? "bg-gray-900 border-gray-700 text-white" : "bg-white border-gray-200 text-gray-900"
      }`}
    >
      {/* Mode Switcher */}
      <div className="flex gap-3">
        {["timeline", "comparison", "summary"].map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode as any)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === mode
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow"
                : darkMode
                ? "bg-gray-800 hover:bg-gray-700 text-gray-300"
                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
            }`}
          >
            {mode === "timeline" && "📜 Timeline"}
            {mode === "comparison" && "⚖️ Comparison"}
            {mode === "summary" && "🧠 Summary Map"}
          </button>
        ))}
      </div>

      {/* Render Views */}
      {viewMode === "timeline" && (
        <div
          className={`max-h-[500px] overflow-y-auto p-4 rounded-lg ${
            darkMode ? "bg-gray-800" : "bg-gray-50"
          }`}
        >
          {fileName && (
            <div className="mb-3 font-semibold text-green-500">📂 File: {fileName}</div>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`p-3 my-2 rounded-xl shadow-sm ${
                msg.sender === "user"
                  ? darkMode
                    ? "bg-blue-600/70 text-white"
                    : "bg-blue-100 text-blue-800"
                  : darkMode
                  ? "bg-purple-600/70 text-white"
                  : "bg-purple-100 text-purple-800"
              }`}
            >
              <b>{msg.sender === "user" ? "👤 User" : "🤖 Bot"}:</b> {msg.text}
            </div>
          ))}
        </div>
      )}

      {viewMode === "comparison" && (
  <div
    className={`max-h-[500px] overflow-y-auto rounded-lg border ${
      darkMode ? "bg-gray-900 border-gray-700" : "bg-gray-50 border-gray-200"
    }`}
  >
    <table className="w-full border-collapse">
      <thead>
        <tr>
          <th
            className={`p-3 text-left font-bold ${
              darkMode ? "bg-blue-900 text-blue-100" : "bg-blue-100 text-blue-800"
            }`}
          >
            👤 User
          </th>
          <th
            className={`p-3 text-left font-bold ${
              darkMode ? "bg-purple-900 text-purple-100" : "bg-purple-100 text-purple-800"
            }`}
          >
            🤖 Bot
          </th>
        </tr>
      </thead>
      <tbody>
        {(() => {
          const rows: { q?: string; a?: string }[] = [];
          let currentQ: string | null = null;

          messages.forEach((msg) => {
            if (msg.sender === "user") {
              if (currentQ) {
                rows.push({ q: currentQ, a: "" }); // unanswered old Q
              }
              currentQ = msg.text;
            } else if (msg.sender === "bot") {
              if (currentQ) {
                rows.push({ q: currentQ, a: msg.text });
                currentQ = null;
              } else {
                rows.push({ q: "", a: msg.text });
              }
            }
          });

          if (currentQ) rows.push({ q: currentQ, a: "" });

          return rows.map((row, i) => (
            <tr
              key={i}
              className={`border-t ${
                darkMode ? "border-gray-700" : "border-gray-200"
              }`}
            >
              <td
                className={`align-top p-3 ${
                  darkMode ? "bg-blue-800/30 text-blue-100" : "bg-blue-50 text-blue-900"
                }`}
              >
                {row.q || "—"}
              </td>
              <td
                className={`align-top p-3 ${
                  darkMode ? "bg-purple-800/30 text-purple-100" : "bg-purple-50 text-purple-900"
                }`}
              >
                {row.a || "—"}
              </td>
            </tr>
          ));
        })()}
      </tbody>
    </table>
  </div>
)}


      {viewMode === "summary" && (
        <div style={{ height: 500, width: "100%" }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            fitView
          >
            <Background gap={16} color={darkMode ? "#666" : "#aaa"} />
            <MiniMap
              nodeColor={(n) =>
                n.id === "file-node" ? "#16a34a" : n.data.label.startsWith("👤") ? "#3b82f6" : "#9333ea"
              }
            />
            <Controls />
          </ReactFlow>
        </div>
      )}
    </div>
  );
}
