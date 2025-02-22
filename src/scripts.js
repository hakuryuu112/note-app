document.addEventListener('DOMContentLoaded', () => {
    const addNoteBtn = document.getElementById('addNoteBtn');
    const titleInput = document.getElementById('title');
    const contentInput = document.getElementById('content');
    const notesContainer = document.getElementById('notes');

    addNoteBtn.addEventListener('click', () => {
        const title = titleInput.value.trim();
        const content = contentInput.value.trim();

        if (!title || !content) {
            Swal.fire("Oops!", "Title and content cannot be empty!", "warning");
            return;
        }

        window.electronAPI.createNote({ title, content }).then(() => {
            titleInput.value = '';
            contentInput.value = '';
            Swal.fire("Success!", "Note added successfully!", "success");
            loadNotes();
        });
    });

    function loadNotes() {
        window.electronAPI.fetchNotes().then(displayNotes);
    }

    function displayNotes(notes) {
        notesContainer.innerHTML = '<ul class="note-list"></ul>';
    
        const noteList = document.querySelector('.note-list');
    
        notes.forEach(note => {
            const noteItem = document.createElement('li');
            noteItem.classList.add('note-item');
            noteItem.innerHTML = `
                <div class="note-content">
                    <h3>${note.title}</h3>
                    <p>${note.content}</p>
                </div>
                <div class="note-actions">
                    <button class="delete-btn btn btn-danger btn-sm" data-id="${note.id}">Delete</button>
                    <button class="edit-btn btn btn-primary btn-sm" data-id="${note.id}" 
                            data-title="${note.title}" data-content="${note.content}">Edit</button>
                </div>
            `;
            noteList.appendChild(noteItem);
        });
    
        document.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const id = event.target.getAttribute('data-id');
                const title = event.target.getAttribute('data-title');
                const content = event.target.getAttribute('data-content');
                showEditModal(id, title, content); 
            });
        });
    
        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const id = event.target.getAttribute('data-id');
                deleteNote(id);
            });
        });
    }    

    function showEditModal(id, oldTitle, oldContent) {
        Swal.fire({
            title: "Edit Note",
            html: `
                <input type="text" id="swalTitle" class="swal2-input" placeholder="Title" value="${oldTitle}">
                <textarea id="swalContent" class="swal2-textarea" placeholder="Content">${oldContent}</textarea>
            `,
            showCancelButton: true,
            confirmButtonText: "Save",
            preConfirm: () => {
                const newTitle = document.getElementById('swalTitle').value.trim();
                const newContent = document.getElementById('swalContent').value.trim();

                if (!newTitle || !newContent) {
                    Swal.showValidationMessage("Title and content cannot be empty!");
                    return false;
                }

                return { title: newTitle, content: newContent };
            }
        }).then((result) => {
            if (result.isConfirmed) {
                window.electronAPI.updateNote(id, result.value).then(() => {
                    Swal.fire("Success!", "Note updated successfully!", "success");
                    loadNotes();
                });
            }
        });
    }

    window.deleteNote = (id) => {
        Swal.fire({
            title: "Are you sure?",
            text: "This note will be permanently deleted!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Confirm",
            cancelButtonText: "Cancel"
        }).then((result) => {
            if (result.isConfirmed) {
                window.electronAPI.deleteNote(id).then(() => {
                    Swal.fire("Deleted!", "Note deleted successfully!", "success");
                    loadNotes();
                });
            }
        });
    };

    loadNotes();
});
