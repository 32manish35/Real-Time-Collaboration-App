import React, { useState, useEffect } from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import { io } from 'socket.io-client'; // 1. Import Socket.io client
import Column from './Column';

const COLUMNS = [
  { id: 'todo', title: 'To Do', color: '#eb5a46' },
  { id: 'in-progress', title: 'In Progress', color: '#f2d600' },
  { id: 'done', title: 'Done', color: '#61bd4f' }
];

// Ensure this matches the backend PORT 5001
const API_BASE_URL = 'http://localhost:5001/api/tasks';
// 2. Initialize Socket connection
const socket = io('http://localhost:5001');

const Board = () => {
  const [tasks, setTasks] = useState([]);

  // Load tasks and setup Socket listeners
  useEffect(() => {
    // Initial Load from MongoDB
    const fetchTasks = async () => {
      try {
        const response = await fetch(API_BASE_URL);
        const data = await response.json();
        setTasks(data);
      } catch (err) {
        console.error("❌ Error loading tasks:", err);
      }
    };
    fetchTasks();

    // 3. LISTEN for Real-Time events from the server
    socket.on("taskAdded", (newTask) => {
      setTasks((prev) => {
        // Prevent duplicate if this user was the one who added it
        if (prev.find(t => t._id === newTask._id)) return prev;
        return [...prev, newTask];
      });
    });

    socket.on("taskUpdated", (updatedTask) => {
      setTasks((prev) => 
        prev.map(t => t._id === updatedTask._id ? updatedTask : t)
      );
    });

    socket.on("taskDeleted", (deletedId) => {
      setTasks((prev) => prev.filter(t => t._id !== deletedId));
    });

    socket.on("boardCleared", () => {
      setTasks([]);
    });

    // Cleanup listeners on unmount
    return () => {
      socket.off("taskAdded");
      socket.off("taskUpdated");
      socket.off("taskDeleted");
      socket.off("boardCleared");
    };
  }, []);

  // ADD TASK (POST)
  const handleAddTask = async (columnId, title) => {
    try {
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, status: columnId })
      });
      const savedTask = await response.json();
      // We don't strictly need setTasks here because socket.on("taskAdded") 
      // will handle it, but keeping it ensures the local user sees it immediately.
      setTasks(prev => {
        if (prev.find(t => t._id === savedTask._id)) return prev;
        return [...prev, savedTask];
      });
    } catch (err) {
      console.error("❌ Error adding task:", err);
    }
  };

  // DRAG AND DROP (PUT)
  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    // Optimistic UI Update (Immediate feedback)
    const updatedTasks = Array.from(tasks);
    const taskIndex = updatedTasks.findIndex(t => t._id === draggableId);
    if (taskIndex !== -1) {
      updatedTasks[taskIndex].status = destination.droppableId;
      setTasks(updatedTasks);
    }

    try {
      await fetch(`${API_BASE_URL}/${draggableId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: destination.droppableId })
      });
    } catch (err) {
      console.error("❌ Error updating status:", err);
    }
  };

  // DELETE SINGLE TASK (DELETE)
  const handleDelete = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setTasks(prev => prev.filter(t => t._id !== id));
      }
    } catch (err) {
      console.error("❌ Error deleting task:", err);
    }
  };

  // CLEAR ALL TASKS (DELETE ALL)
  const clearBoard = async () => {
    if (window.confirm("Delete ALL tasks permanently from the database?")) {
      try {
        const response = await fetch(API_BASE_URL, { method: 'DELETE' });
        if (response.ok) {
          setTasks([]);
        }
      } catch (err) {
        console.error("❌ Error clearing board:", err);
      }
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div style={styles.wrapper}>
        <header style={styles.header}>
          <h2 style={styles.logo}>Real-Time Engineering Board</h2>
          <button onClick={clearBoard} style={styles.clearBtn}>Clear All</button>
        </header>
        
        <div style={styles.container}>
          {COLUMNS.map(col => (
            <Column 
              key={col.id} 
              col={col} 
              tasks={tasks.filter(t => t.status === col.id)}
              onAddTask={(text) => handleAddTask(col.id, text)}
              onDeleteTask={handleDelete}
            />
          ))}
        </div>
      </div>
    </DragDropContext>
  );
};

const styles = {
  wrapper: { backgroundColor: "#0079bf", minHeight: "100vh", padding: "20px", fontFamily: "'Segoe UI', sans-serif" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" },
  logo: { color: "white", margin: 0 },
  clearBtn: { backgroundColor: "#eb5a46", color: "white", border: "none", padding: "10px 20px", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" },
  container: { display: "flex", gap: "20px", alignItems: "flex-start", overflowX: "auto" }
};

export default Board;