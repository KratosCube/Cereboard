// Store/retrieve drag data
let dragData = {};
let isDraggingTask = false;

export function enableDragDrop() {
    console.log("Setting up drag and drop functionality...");

    // Prevent default behavior on drag over to allow drop
    document.addEventListener('dragover', function (e) {
        e.preventDefault();
    }, false);

    // Prevent default behavior on drop to properly handle it
    document.addEventListener('drop', function (e) {
        e.preventDefault();
    }, false);

    // Set up mutation observer to handle dynamically added elements
    setupDragObserver();

    // Initial setup of existing elements
    setupColumnHeaderDrag();
    setupTaskDrag();

    console.log("Drag and drop initialization complete");
    return true;
}

// Setup mutation observer to handle dynamically added elements
function setupDragObserver() {
    const observer = new MutationObserver((mutations) => {
        let needsSetup = false;

        mutations.forEach(mutation => {
            if (mutation.addedNodes.length) {
                needsSetup = true;
            }
        });

        if (needsSetup) {
            setupColumnHeaderDrag();
            setupTaskDrag();
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

// Column headers drag setup
export function setupColumnHeaderDrag() {
    console.log("Setting up column header drag...");

    document.querySelectorAll('.column-header').forEach(header => {
        // Ensure it's draggable
        header.setAttribute('draggable', 'true');

        // Remove existing listeners to prevent duplicates
        header.removeEventListener('dragstart', onColumnDragStart);
        header.removeEventListener('dragend', onDragEnd);

        // Add fresh listeners
        header.addEventListener('dragstart', onColumnDragStart);
        header.addEventListener('dragend', onDragEnd);

        console.log(`Column header setup: ${header.id || 'unnamed'}`);
    });
}

// Task drag setup
export function setupTaskDrag() {
    console.log("Setting up task drag...");

    document.querySelectorAll('.task-card').forEach(task => {
        // Ensure it's draggable
        task.setAttribute('draggable', 'true');

        // Remove existing listeners to prevent duplicates
        task.removeEventListener('dragstart', onTaskDragStart);
        task.removeEventListener('dragend', onDragEnd);

        // Add fresh listeners
        task.addEventListener('dragstart', onTaskDragStart);
        task.addEventListener('dragend', onDragEnd);

        console.log(`Task setup: ${task.id || 'unnamed'}`);
    });
}

// Event handlers
function onColumnDragStart(e) {
    console.log("Column drag started", this.id);

    // Prevent task drag events
    isDraggingTask = false;

    // Add visual feedback
    this.classList.add('dragging-column');

    // Find the parent column and add class to it
    const column = this.closest('.kanban-column');
    if (column) {
        column.classList.add('dragging-column');
    }

    // Extract column ID from the header ID
    const headerId = this.id;
    const columnId = headerId.replace('column-header-', '');

    // Store data
    setDragData('dragType', 'column');
    setDragData('columnId', columnId);
}

function onTaskDragStart(e) {
    console.log("Task drag started", this.id);

    // Set flag to prevent column drag
    isDraggingTask = true;

    // Disable column header dragging temporarily
    document.querySelectorAll('.column-header').forEach(header => {
        header.setAttribute('draggable', 'false');
    });

    // Add visual feedback
    this.classList.add('dragging-task');

    // Extract task ID
    const taskId = this.id.replace('task-', '');

    // Store data
    setDragData('dragType', 'task');
    setDragData('taskId', taskId);

    // Find parent column
    const column = this.closest('.column-content');
    if (column) {
        const columnId = column.id.replace('column-content-', '');
        setDragData('sourceColumnId', columnId);
    }
}

function onDragEnd(e) {
    console.log("Drag ended");

    // Remove all styling classes
    document.querySelectorAll('.dragging-column, .dragging-task, .column-drop-target, .drag-active').forEach(el => {
        el.classList.remove('dragging-column', 'dragging-task', 'column-drop-target', 'drag-active');
    });

    // Re-enable column header dragging
    document.querySelectorAll('.column-header').forEach(header => {
        header.setAttribute('draggable', 'true');
    });

    // Reset flag
    isDraggingTask = false;

    // Clear drag data
    clearDragData();
}

export function onColumnDragEnter(columnId) {
    if (isDraggingTask) return false;

    console.log("Column drag enter:", columnId);

    // Add highlighting to target column
    const column = document.querySelector(`#column-${columnId}`);
    if (column) {
        column.classList.add('column-drop-target');
    }

    // Store target column ID
    setDragData('targetColumnId', columnId);
    return true;
}

export function onTaskDragEnter(columnId) {
    if (!isDraggingTask) return false;

    console.log("Task drag enter column:", columnId);

    // Add highlighting to target column content
    const columnContent = document.querySelector(`#column-content-${columnId}`);
    if (columnContent) {
        columnContent.classList.add('drag-active');
    }

    // Store target column ID
    setDragData('targetColumnId', columnId);
    return true;
}

// Data management functions
export function setDragData(key, value) {
    dragData[key] = value;
    console.log(`Set drag data: ${key} = ${value}`);
    return true;
}

export function getDragData(key) {
    const value = dragData[key] || null;
    console.log(`Get drag data: ${key} = ${value}`);
    return value;
}

export function clearDragData() {
    console.log("Clearing drag data");
    dragData = {};
    return true;
}

export function isTaskBeingDragged() {
    return isDraggingTask;
}