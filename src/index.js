const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');
const axios = require('axios');
const { exec } = require('child_process');

// API details
const API_URL = 'http://localhost:5000/api/note';
const API_COMMAND = 'dotnet run'; // No need to specify project if cwd is correct
const API_CWD = 'E:/Data Kerja/repos/NoteAPI/NoteAPI'; // Your .NET API folder

let apiProcess;

const checkApiRunning = async () => {
  try {
    await axios.get(API_URL);
    console.log('API is already running.');
    return true;
  } catch (error) {
    return false;
  }
};

const startApiServer = () => {
  console.log('Starting API server...');
  apiProcess = exec(API_COMMAND, { cwd: API_CWD });

  apiProcess.stdout.on('data', (data) => {
    console.log(`API: ${data}`);
  });

  apiProcess.stderr.on('data', (data) => {
    console.error(`API Error: ${data}`);
  });

  apiProcess.on('close', (code) => {
    console.log(`API process exited with code ${code}`);
  });
};

const waitForApi = async (retries = 10, delay = 2000) => {
  for (let i = 0; i < retries; i++) {
    if (await checkApiRunning()) {
      console.log('API is ready!');
      return true;
    }
    console.log(`Waiting for API to start... (${i + 1}/${retries})`);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
  console.error('API failed to start.');
  return false;
};

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  mainWindow.webContents.openDevTools();
};

app.whenReady().then(async () => {
  if (!(await checkApiRunning())) {
    startApiServer();
    await waitForApi();
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('before-quit', () => {
  if (apiProcess) {
    console.log('Stopping API server...');
    apiProcess.kill();
  }
});

ipcMain.handle('fetch-notes', async () => {
  try {
    const response = await axios.get(API_URL);
    return response.data;
  } catch (error) {
    console.error('Error fetching notes:', error);
    return [];
  }
});

ipcMain.handle('create-note', async (event, note) => {
  try {
    const response = await axios.post(API_URL, note);
    return response.data;
  } catch (error) {
    console.error('Error creating note:', error);
    return null;
  }
});

ipcMain.handle('update-note', async (event, id, note) => {
  try {
    const response = await axios.patch(`${API_URL}/${id}`, note);
    return response.data;
  } catch (error) {
    console.error('Error updating note:', error);
    return null;
  }
});

ipcMain.handle('delete-note', async (event, id) => {
  try {
    await axios.delete(`${API_URL}/${id}`);
    return { success: true };
  } catch (error) {
    console.error('Error deleting note:', error);
    return { success: false };
  }
});
