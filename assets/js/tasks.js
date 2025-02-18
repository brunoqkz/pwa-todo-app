import { db, auth, AIModel, log_instance as log } from "./firebase.js";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
  query,
  where,
} from "firebase/firestore";
import { signOut } from "firebase/auth";

// Check if user is signed in
const email = JSON.parse(localStorage.getItem("email"));
if (!email) {
  window.location.href = "index.html";
}

class TodoApp {
  constructor() {
    this.taskInput = document.getElementById("taskInput");
    this.addTaskBtn = document.getElementById("addTaskBtn");
    this.taskList = document.getElementById("taskList");
    this.chatInput = document.getElementById("chat-input");
    this.sendBtn = document.getElementById("send-btn");
    this.chatHistory = document.getElementById("chat-history");
    this.signOutBttn = document.getElementById("signOutBttn");

    this.bindEvents();
  }

  bindEvents() {
    this.addTaskBtn.addEventListener("click", this.handleAddTask.bind(this));
    this.taskInput.addEventListener("keypress", this.handleEnterKey.bind(this));
    this.taskList.addEventListener("click", this.handleTaskClick.bind(this));
    this.taskList.addEventListener(
      "keypress",
      this.handleTaskKeyPress.bind(this),
    );
    this.sendBtn.addEventListener("click", this.handleChatSend.bind(this));
    this.chatInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        this.handleChatSend();
      }
    });
    this.signOutBttn.addEventListener("click", this.handleSignOut.bind(this));

    document.addEventListener(
      "DOMContentLoaded",
      this.initializeTasks.bind(this),
    );
  }

  handleSignOut() {
    localStorage.removeItem("email");
    signOut(auth)
      .then(() => {
        window.location.href = "index.html";
      })
      .catch((error) => {
        log.error("Sign-out error:", error);
      });
  }

  async handleChatSend() {
    const prompt = this.chatInput.value.trim().toLowerCase();
    if (prompt) {
      if (!this.handleChatCommand(prompt)) {
        try {
          const result = await this.askChatBot(prompt);
          this.appendMessage("Bot: " + result.response.text());
        } catch (error) {
          log.error("Error getting AI response:", error);
          this.appendMessage(
            "Bot: Sorry, I encountered an error. Please try again.",
          );
        }
      }
      this.chatInput.value = "";
    } else {
      this.appendMessage("Bot: Please enter a message");
    }
  }

  handleChatCommand(prompt) {
    if (prompt.startsWith("add task")) {
      const task = prompt.replace("add task", "").trim();
      if (task) {
        this.handleAddTask(task);
        this.appendMessage("Bot: Task '" + task + "' added!");
      } else {
        this.appendMessage("Bot: Please specify a task to add.");
      }
      return true;
    } else if (prompt.startsWith("complete")) {
      const taskName = prompt.replace("complete", "").trim();
      if (taskName) {
        const taskFound = this.completeTaskByName(taskName);
        if (taskFound) {
          this.appendMessage(
            "Bot: Task '" + taskName + "' marked as complete.",
          );
        } else {
          this.appendMessage("Bot: Task not found!");
        }
      } else {
        this.appendMessage("Bot: Please specify a task to complete.");
      }
      return true;
    }
    return false;
  }

  async completeTaskByName(taskName) {
    try {
      const tasks = await this.getTasksFromFirestore();
      const task = tasks.find(
        (t) => t.data().text.toLowerCase() === taskName.toLowerCase(),
      );
      if (task) {
        await this.deleteTask(task.id);
        await this.renderTasks();
        return true;
      }
      return false;
    } catch (error) {
      log.error("Error completing task:", error);
      return false;
    }
  }

  appendMessage(message) {
    const history = document.createElement("div");
    history.textContent = message;
    history.className = "history";
    this.chatHistory.appendChild(history);
    this.chatHistory.scrollTop = this.chatHistory.scrollHeight;
  }

  async handleAddTask(taskText = null) {
    try {
      const text = taskText || this.sanitizeInput(this.taskInput.value.trim());
      if (text) {
        await this.addTaskToFirestore(text);
        await this.renderTasks();
        if (!taskText) {
          this.taskInput.value = "";
        }
      } else {
        alert("Please enter a task!");
      }
    } catch (error) {
      log.error("Error adding task:", error);
      alert("Failed to add task. Please try again.");
    }
  }

  async addTaskToFirestore(taskText) {
    await addDoc(collection(db, "todos"), {
      text: taskText,
      email: email,
      completed: false,
      createdAt: new Date(),
    });
  }

  async renderTasks() {
    try {
      const tasks = await this.getTasksFromFirestore();
      this.taskList.innerHTML = "";
      tasks.forEach((doc) => {
        const taskItem = document.createElement("li");
        taskItem.tabIndex = 0;
        taskItem.id = doc.id;
        taskItem.textContent = doc.data().text;
        this.taskList.appendChild(taskItem);
      });
    } catch (error) {
      log.error("Error rendering tasks:", error);
    }
  }

  async getTasksFromFirestore() {
    const q = query(collection(db, "todos"), where("email", "==", email));
    const data = await getDocs(q);
    return data.docs;
  }

  async handleTaskClick(e) {
    if (e.target.tagName === "LI") {
      try {
        await this.deleteTask(e.target.id);
        e.target.remove();
      } catch (error) {
        log.error("Error deleting task:", error);
      }
    }
  }

  async deleteTask(taskId) {
    await deleteDoc(doc(db, "todos", taskId));
  }

  async handleTaskKeyPress(e) {
    if (e.target.tagName === "LI" && e.key === "Enter") {
      try {
        const docRef = doc(db, "todos", e.target.id);
        await updateDoc(docRef, {
          completed: true,
        });
        await this.renderTasks();
      } catch (error) {
        log.error("Error updating task:", error);
      }
    }
  }

  handleEnterKey(e) {
    if (e.key === "Enter") {
      this.handleAddTask();
    }
  }

  async initializeTasks() {
    await this.renderTasks();
  }

  sanitizeInput(input) {
    const div = document.createElement("div");
    div.textContent = input;
    return div.innerHTML;
  }

  async askChatBot(request) {
    return await AIModel.generateContent(request);
  }
}

// Initialize the app
new TodoApp();
