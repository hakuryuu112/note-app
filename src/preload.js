// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    fetchNotes: () => ipcRenderer.invoke('fetch-notes'),
    createNote: (note) => ipcRenderer.invoke('create-note', note),
    updateNote: (id, note) => ipcRenderer.invoke('update-note', id, note),
    deleteNote: (id) => ipcRenderer.invoke('delete-note', id),
});
