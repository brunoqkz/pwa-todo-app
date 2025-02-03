import {initializeApp} from 'firebase/app';
import {addDoc, collection, deleteDoc, doc, getDocs, getFirestore, updateDoc} from "firebase/firestore";
import log from "loglevel";
import 'dotenv/config';

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

class TodoApp {
  constructor() {
    this.taskInput = document.getElementById('taskInput');
    this.addTaskBtn = document.getElementById('addTaskBtn');
    this.taskList = document.getElementById('taskList');

    this.bindEvents();
  }

  bindEvents() {
    this.addTaskBtn.addEventListener('click', this.handleAddTask.bind(this));
    this.taskInput.addEventListener('keypress', this.handleEnterKey.bind(this));
    this.taskList.addEventListener('click', this.handleTaskClick.bind(this));
    this.taskList.addEventListener('keypress', this.handleTaskKeyPress.bind(this));

    document.addEventListener('DOMContentLoaded', this.initializeTasks.bind(this));
  }

  async handleAddTask() {
    try {
      const taskText = this.sanitizeInput(this.taskInput.value.trim());
      if (taskText) {
        await this.addTaskToFirestore(taskText);
        await this.renderTasks();
        this.taskInput.value = "";
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
      text: taskText, completed: false, createdAt: new Date()
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