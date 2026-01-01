import React from 'react';
import { Droppable } from '@hello-pangea/dnd';
import TaskCard from './TaskCard';

const Column = ({ col, tasks, onAddTask, onDeleteTask }) => {
  return (
    <div style={styles.column}>
      {/* Column Header */}
      <div style={{ ...styles.header, borderTop: `4px solid ${col.color}` }}>
        <h3 style={styles.title}>{col.title}</h3>
        <span style={styles.count}>{tasks.length}</span>
      </div>

      {/* Droppable Area for Drag and Drop */}
      <Droppable droppableId={col.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            style={{
              ...styles.taskList,
              backgroundColor: snapshot.isDraggingOver ? 'rgba(0,0,0,0.05)' : 'transparent',
              borderRadius: "4px"
            }}
          >
            {tasks.map((task, index) => (
              <TaskCard 
                key={task._id} 
                task={task} 
                index={index} 
                onDelete={onDeleteTask}
                color={col.color}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      {/* Add Task Button */}
      <button 
        onClick={() => {
          const title = prompt("Enter task title:");
          // Only send the title; the Board.jsx wrapper handles the column ID automatically
          if (title && title.trim() !== "") {
            onAddTask(title);
          }
        }} 
        style={styles.addBtn}
      >
        + Add card
      </button>
    </div>
  );
};

const styles = {
  column: { 
    background: "#ebecf0", 
    borderRadius: "8px", 
    width: "280px", 
    padding: "10px", 
    display: "flex", 
    flexDirection: "column",
    boxShadow: "0 1px 3px rgba(0,0,0,0.12)" 
  },
  header: { 
    display: "flex", 
    justifyContent: "space-between", 
    alignItems: "center", 
    marginBottom: "10px",
    paddingTop: "5px"
  },
  title: { 
    margin: 0, 
    fontSize: "14px", 
    fontWeight: "600",
    color: "#172b4d" 
  },
  count: { 
    fontSize: "12px", 
    background: "#ccc", 
    padding: "2px 6px", 
    borderRadius: "10px",
    color: "#444" 
  },
  taskList: { 
    minHeight: "100px", 
    transition: "background-color 0.2s ease",
    padding: "5px 0"
  },
  addBtn: { 
    marginTop: "10px", 
    background: "none", 
    border: "none", 
    cursor: "pointer", 
    color: "#5e6c84", 
    textAlign: "left", 
    padding: "8px",
    borderRadius: "3px",
    fontSize: "14px",
    width: "100%",
    transition: "background-color 0.2s"
  }
};

export default Column;