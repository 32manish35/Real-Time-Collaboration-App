import React from 'react';
import { Draggable } from '@hello-pangea/dnd';

const TaskCard = ({ task, index, onDelete, color }) => {
  return (
    <Draggable draggableId={task._id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{
            ...provided.draggableProps.style,
            backgroundColor: "white",
            padding: "12px",
            borderRadius: "4px",
            marginBottom: "8px",
            borderLeft: `4px solid ${color}`,
            boxShadow: snapshot.isDragging ? "0 5px 10px rgba(0,0,0,0.2)" : "0 1px 2px rgba(0,0,0,0.1)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "14px" }}>{task.title}</span>
            <button 
              onClick={() => onDelete(task._id)} 
              style={{ border: "none", background: "none", color: "#eb5a46", cursor: "pointer", fontWeight: "bold" }}
            >
              ×
            </button>
          </div>
        </div>
      )}
    </Draggable>
  );
};

export default TaskCard;