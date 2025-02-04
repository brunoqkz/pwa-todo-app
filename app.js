import {initializeApp} from 'firebase/app';
import {addDoc, collection, deleteDoc, doc, getDocs, getFirestore, updateDoc} from "firebase/firestore";
import log from "loglevel";
import 'dotenv/config';
import {GoogleGenerativeAI} from '@google/generative-ai';

function getFirebaseConfig() {
  return {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID
  };
}

const app = initializeApp(getFirebaseConfig());
const db = getFirestore(app);
const AIModel = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY).getGenerativeModel({model: 'gemini-1.5-flash'});

class TodoApp {
  constructor() {
    this.taskInput = document.getElementById('taskInput');
    this.addTaskBtn = document.getElementById('addTaskBtn');
    this.taskList = document.getElementById('taskList');
    this.chatInput = document.getElementById('chat-input');
    this.sendBtn = document.getElementById('send-btn');
    this.chatHistory = document.getElementById('chat-history');

    this.bindEvents();
  }

  bindEvents() {
    this.addTaskBtn.addEventListener('click', this.handleAddTask.bind(this));
    this.taskInput.addEventListener('keypress', this.handleEnterKey.bind(this));
    this.taskList.addEventListener('click', this.handleTaskClick.bind(this));
    this.taskList.addEventListener('keypress', this.handleTaskKeyPress.bind(this));
    this.sendBtn.addEventListener('click', this.handleChatSend.bind(this));
    this.chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.handleChatSend();
      }
    });

    document.addEventListener('DOMContentLoaded', this.initializeTasks.bind(this));
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
          this.appendMessage("Bot: Sorry, I encountered an error. Please try again.");
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
          this.appendMessage("Bot: Task '" + taskName + "' marked as complete.");
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
      const task = tasks.find(t => t.data().text.toLowerCase() === taskName.toLowerCase());
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
    history.className = 'history';
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
      completed: false,
      createdAt: new Date()
    });
  }

  async renderTasks() {
    try {
      const tasks = await this.getTasksFromFirestore();
      this.taskList.innerHTML = "";
      tasks.forEach((task) => {
        const taskItem = document.createElement("li");
        taskItem.tabIndex = 0;
        taskItem.id = task.id;
        taskItem.textContent = task.data().text;
        this.taskList.appendChild(taskItem);
      });
    } catch (error) {
      log.error("Error rendering tasks:", error);
    }
  }

  async getTasksFromFirestore() {
    const data = await getDocs(collection(db, "todos"));
    return data.docs;
  }

  async handleTaskClick(e) {
    if (e.target.tagName === 'LI') {
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
    if (e.target.tagName === 'LI' && e.key === 'Enter') {
      try {
        const docRef = doc(db, "todos", e.target.id);
        await updateDoc(docRef, {
          completed: true
        });
        await this.renderTasks();
      } catch (error) {
        log.error("Error updating task:", error);
      }
    }
  }

  handleEnterKey(e) {
    if (e.key === 'Enter') {
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

// Service Worker Registration
const sw = new URL('service-worker.js', import.meta.url)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register(sw.href, {
      scope: '/pwa-todo-app/'
    })
    .then(_ => log.info('Service Worker Registered'))
    .catch(err => log.error('Service Worker Error:', err));
}