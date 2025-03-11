// Store/retrieve drag data
let dragData = {};
let isDraggingTask = false;
let isDraggingColumn = false;
let dragDelay = null;
let currentlyOverColumnId = null;
let originalColumnPos = null;
function columnDragLeaveHandler(e) {
    // Only process if we're dragging a column
    if (dragData.dragType !== 'column') return;

    e.preventDefault();

    // We need to check if we've actually left the column or just entered a child element
    // Get the element we're entering
    const relatedTarget = e.relatedTarget;

    // If the related target is still within this column, don't remove highlight
    if (this.contains(relatedTarget)) {
        return;
    }

    // Remove highlight only from this column
    this.classList.remove('column-drop-target');

    // If this was the column we were tracking as currently over, clear it
    const columnId = parseInt(this.id.replace('column-', ''));
    if (currentlyOverColumnId === columnId) {
        currentlyOverColumnId = null;
    }

    console.log(`Left column ${columnId}`);
}

export function enableDragDrop() {
    console.log("Setting up drag and drop functionality...");

    // Basic drag-drop setup
    document.addEventListener('dragover', function (e) {
        e.preventDefault();
    }, false);

    document.addEventListener('drop', function (e) {
        e.preventDefault();
    }, false);

    // Manually set up all draggable elements and their event handlers
    setupDraggableElements();

    console.log("Drag and drop initialized");
    return true;
}

// Setup all draggable elements - this is the main setup function
export function setupDraggableElements() {
    console.log("Setting up draggable elements - manual mode");

    try {
        // Make column headers draggable
        document.querySelectorAll('.column-header').forEach(header => {
            // Force draggable attribute
            header.setAttribute('draggable', 'true');

            // Remove existing listeners to prevent duplicates
            header.removeEventListener('dragstart', columnDragStartHandler);
            header.removeEventListener('dragend', dragEndHandler);

            // Add drag start handler directly
            header.addEventListener('dragstart', columnDragStartHandler);
            header.addEventListener('dragend', dragEndHandler);

            console.log(`Set up column header: ${header.id}`);
        });

        // Set up kanban columns for drop targets
        document.querySelectorAll('.kanban-column').forEach(column => {
            column.removeEventListener('dragenter', columnDragEnterHandler);
            column.removeEventListener('dragleave', columnDragLeaveHandler); // Add this
            column.removeEventListener('dragover', columnDragOverHandler);
            column.removeEventListener('drop', columnDropHandler);
            
            column.addEventListener('dragenter', columnDragEnterHandler);
            column.addEventListener('dragleave', columnDragLeaveHandler); // Add this
            column.addEventListener('dragover', columnDragOverHandler);
            column.addEventListener('drop', columnDropHandler);
            
            console.log(`Set up column drop target: ${column.id}`);
        });

        // Make tasks draggable
        document.querySelectorAll('.task-card').forEach(task => {
            // Force draggable attribute
            task.setAttribute('draggable', 'true');

            // Remove existing listeners to prevent duplicates
            task.removeEventListener('dragstart', taskDragStartHandler);
            task.removeEventListener('dragend', dragEndHandler);

            // Add drag handlers directly
            task.addEventListener('dragstart', taskDragStartHandler);
            task.addEventListener('dragend', dragEndHandler);

            // Add mousedown handler to prevent column dragging when clicking tasks
            task.addEventListener('mousedown', function (e) {
                // Prevent event from reaching column headers
                e.stopPropagation();

                // Disable column header dragging during task interaction
                document.querySelectorAll('.column-header').forEach(h => {
                    h.setAttribute('draggable', 'false');
                });

                // Re-enable column headers after a delay
                setTimeout(() => {
                    document.querySelectorAll('.column-header').forEach(h => {
                        h.setAttribute('draggable', 'true');
                    });
                }, 100);
            });

            console.log(`Set up task card: ${task.id}`);
        });

        // Set up drop zones for column content (for task drops)
        document.querySelectorAll('.column-content').forEach(content => {
            content.removeEventListener('dragenter', columnContentDragEnterHandler);
            content.removeEventListener('dragover', columnContentDragOverHandler);
            content.removeEventListener('drop', columnContentDropHandler);

            content.addEventListener('dragenter', columnContentDragEnterHandler);
            content.addEventListener('dragover', columnContentDragOverHandler);
            content.addEventListener('drop', columnContentDropHandler);

            console.log(`Set up column content drop zone: ${content.id}`);
        });

        return true;
    } catch (error) {
        console.error("Error setting up draggable elements:", error);
        return false;
    }
}

// Handler for column drag enter
function columnDragEnterHandler(e) {
    if (dragData.dragType !== 'column') return;

    e.preventDefault();

    // Get target column ID
    const targetId = parseInt(this.id.replace('column-', ''));
    if (!targetId) return;

    const sourceId = parseInt(dragData.columnId);
    if (!sourceId || sourceId === targetId) return;

    // Update which column we're currently over
    currentlyOverColumnId = targetId;

    // Remove highlight from all other columns first
    document.querySelectorAll('.column-drop-target').forEach(col => {
        const colId = parseInt(col.id.replace('column-', ''));
        if (colId !== targetId) {
            col.classList.remove('column-drop-target');
        }
    });

    // Highlight only this target column
    this.classList.add('column-drop-target');

    // Set target column ID
    setDragData('targetColumnId', targetId);

    console.log(`Column drag enter: ${targetId} (source: ${sourceId})`);
}

// Handler for column content drag enter
function columnContentDragEnterHandler(e) {
    if (dragData.dragType !== 'task') return;

    e.preventDefault();
    e.stopPropagation();

    // Get column ID
    const targetId = parseInt(this.id.replace('column-content-', ''));
    if (!targetId) return;

    // Add highlight
    this.classList.add('drag-active');

    // Set target column ID
    setDragData('targetColumnId', targetId);

    console.log(`Column content drag enter: ${targetId}`);
}

// Handler for column drag over
function columnDragOverHandler(e) {
    if (dragData.dragType !== 'column') return;

    e.preventDefault();

    // Get current column
    const column = this.closest('.kanban-column');
    if (!column) return;

    // Extract column ID
    const targetId = parseInt(column.id.replace('column-', ''));
    if (!targetId) return;

    const sourceId = parseInt(dragData.columnId);
    if (!sourceId) return;

    // Check if we're over the original column
    if (sourceId === targetId) {
        // We're hovering over the original position
        column.classList.add('column-original-position');
        setDragData('targetColumnId', targetId);
        setDragData('returningToOriginal', true);
        return;
    }

    // Normal case - not the original position
    column.classList.remove('column-original-position');
    setDragData('returningToOriginal', false);
    setDragData('targetColumnId', targetId);
}
export function isReturningToOriginalPosition() {
    return dragData.returningToOriginal === true;
}

// Handler for column drop
function columnDropHandler(e) {
    if (dragData.dragType !== 'column') return;

    e.preventDefault();

    // Get target column ID
    const targetId = parseInt(this.id.replace('column-', ''));
    if (!targetId) return;

    const sourceId = parseInt(dragData.columnId);
    if (!sourceId || sourceId === targetId) return;

    console.log(`Column dropped: from ${sourceId} to ${targetId}`);

    // Ensure target ID is set
    setDragData('targetColumnId', targetId);
}

// Handler for column header drag start
function columnDragStartHandler(e) {
    console.log("Column drag started", this.id);

    // Critical: Stop propagation and set data transfer
    e.stopPropagation();

    // Set required dataTransfer for Firefox
    if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", "column"); // Need this for Firefox
    }

    // Set drag state
    isDraggingColumn = true;
    isDraggingTask = false;

    // Add visual feedback
    this.classList.add('dragging-column');
    const column = this.closest('.kanban-column');
    if (column) {
        column.classList.add('dragging-column');

        // Get column ID
        const columnId = parseInt(column.id.replace('column-', ''));
        if (columnId) {
            // Store data
            setDragData('dragType', 'column');
            setDragData('columnId', columnId);

            // NEW: Store original position information
            const rect = column.getBoundingClientRect();
            originalColumnPos = {
                id: columnId,
                rect: rect
            };

            console.log(`Column drag started with ID: ${columnId}`);
        }
    }
}

// Handler for task drag start
function taskDragStartHandler(e) {
    console.log("Task drag started", this.id);

    // Critical: Stop propagation and set data transfer
    e.stopPropagation();

    // Set required dataTransfer for Firefox
    if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", "task"); // Need this for Firefox
    }

    // Set drag state
    isDraggingTask = true;
    isDraggingColumn = false;

    // Disable column dragging
    document.querySelectorAll('.column-header').forEach(header => {
        header.setAttribute('draggable', 'false');
    });

    // Add visual feedback
    this.classList.add('dragging-task');

    // Get task ID and column ID
    const taskId = parseInt(this.id.replace('task-', '')) || 0;

    // Find parent column
    const column = this.closest('.column-content');
    let columnId = 0;
    if (column) {
        columnId = parseInt(column.id.replace('column-content-', '')) || 0;
    }

    // Store data
    setDragData('dragType', 'task');
    setDragData('taskId', taskId);
    setDragData('sourceColumnId', columnId);

    console.log(`Task drag started: taskId=${taskId}, sourceColumnId=${columnId}`);
}

// Handler for drag end (both column and task)
function dragEndHandler(e) {
    console.log("Drag ended via native event");
    onDragEnd();
}

// Handler for column content dragover
function columnContentDragOverHandler(e) {
    e.preventDefault();
    e.stopPropagation();

    // If we're dragging a task, show the placeholder
    if (dragData.dragType === 'task') {
        // Add highlight to column
        this.classList.add('drag-active');

        // Store target column ID
        const targetId = parseInt(this.id.replace('column-content-', '')) || 0;
        setDragData('targetColumnId', targetId);

        // Remove existing placeholders
        document.querySelectorAll('.task-drop-placeholder').forEach(el => el.remove());

        // Check if this column is empty or find where to place the placeholder
        const tasks = Array.from(this.querySelectorAll('.task-card'));

        // Create placeholder
        const placeholder = document.createElement('div');
        placeholder.className = 'task-drop-placeholder';
        placeholder.innerHTML = '<span>Drop task here</span>';

        if (tasks.length === 0) {
            // Empty column - add at the top
            this.insertBefore(placeholder, this.firstChild);
        } else {
            // Find closest task to insert before/after
            const mouseY = e.clientY;
            let insertBefore = null;

            for (const task of tasks) {
                const rect = task.getBoundingClientRect();
                if (mouseY < rect.top + rect.height / 2) {
                    insertBefore = task;
                    break;
                }
            }

            if (insertBefore) {
                this.insertBefore(placeholder, insertBefore);
            } else {
                // Insert after last task
                tasks[tasks.length - 1].after(placeholder);
            }
        }
    }
}

// Handler for column content drop
function columnContentDropHandler(e) {
    // We don't call preventDefault() here to allow Blazor to handle the drop event

    // Only handle task drops
    if (dragData.dragType !== 'task') return;

    // Get target column ID
    const targetId = parseInt(this.id.replace('column-content-', '')) || 0;
    if (!targetId) return;

    // Get task ID
    const taskId = parseInt(dragData.taskId) || 0;
    const sourceColumnId = parseInt(dragData.sourceColumnId) || 0;

    if (!taskId || !sourceColumnId) {
        console.error("Invalid task data:", dragData);
        return;
    }

    console.log(`Task dropped: taskId=${taskId}, from column=${sourceColumnId}, to column=${targetId}`);

    // Store target column ID - this will be used by the Blazor event handler
    setDragData('targetColumnId', targetId);

    // Don't stop propagation, let the event bubble up to Blazor
}



// These functions will be called from Blazor
export function onColumnDragEnter(columnId) {
    console.log("Column drag enter from Blazor:", columnId);

    // Only process if we're dragging a column
    if (dragData.dragType !== 'column') return false;

    // Ensure columnId is an integer
    columnId = parseInt(columnId) || 0;
    if (columnId <= 0) return false;

    const sourceId = parseInt(dragData.columnId) || 0;
    if (sourceId <= 0 || sourceId === columnId) return false;

    // Highlight target column
    const column = document.querySelector(`#column-${columnId}`);
    if (column) {
        column.classList.add('column-drop-target');
    }

    // Store target column ID
    setDragData('targetColumnId', columnId);

    console.log(`Column drag enter from blazor: source=${sourceId}, target=${columnId}`);
    return true;
}

export function onTaskDragEnter(columnId) {
    console.log("Task drag enter from Blazor:", columnId);

    // Only process if we're dragging a task
    if (dragData.dragType !== 'task') return false;

    // Ensure columnId is an integer
    columnId = parseInt(columnId) || 0;
    if (columnId <= 0) return false;

    // Highlight target column
    const columnContent = document.querySelector(`#column-content-${columnId}`);
    if (columnContent) {
        columnContent.classList.add('drag-active');

        // Show placeholder for task
        const tasks = Array.from(columnContent.querySelectorAll('.task-card'));

        // Remove existing placeholders
        document.querySelectorAll('.task-drop-placeholder').forEach(el => el.remove());

        // Create placeholder
        const placeholder = document.createElement('div');
        placeholder.className = 'task-drop-placeholder';
        placeholder.innerHTML = '<span>Drop task here</span>';

        if (tasks.length === 0) {
            // Empty column - add at the top
            columnContent.insertBefore(placeholder, columnContent.firstChild);
        } else {
            // Add after last task
            tasks[tasks.length - 1].after(placeholder);
        }
    }

    // Store target column ID
    setDragData('targetColumnId', columnId);
    return true;
}

export function moveTask(taskId, sourceColumnId, targetColumnId) {
    console.log(`Direct task move request: taskId=${taskId}, sourceColumnId=${sourceColumnId}, targetColumnId=${targetColumnId}`);
    // This function is just a bridge to call Blazor code directly
    return DotNet.invokeMethodAsync('Cereboard', 'MoveTaskJS', taskId, sourceColumnId, targetColumnId);
}
// Clean up after drag operation
export function onDragEnd() {
    console.log("Drag ended function called");

    // Clear any pending delays
    if (dragDelay) {
        clearTimeout(dragDelay);
        dragDelay = null;
    }

    clearDragEffects();

    // Re-enable column dragging
    document.querySelectorAll('.column-header').forEach(header => {
        header.setAttribute('draggable', 'true');
    });

    // Reset tracking variable
    currentlyOverColumnId = null;

    // Reset state
    isDraggingTask = false;
    isDraggingColumn = false;

    // Clear stored data
    clearDragData();
}

// Clear visual effects
export function clearDragEffects() {
    console.log("Clearing drag effects");

    try {
        // Remove all visual effects
        document.querySelectorAll('.dragging-column').forEach(el => {
            el.classList.remove('dragging-column');
        });

        document.querySelectorAll('.dragging-task').forEach(el => {
            el.classList.remove('dragging-task');
        });

        document.querySelectorAll('.column-original-position').forEach(el => {
            el.classList.remove('column-original-position');
        });

        document.querySelectorAll('.column-drop-target').forEach(el => {
            el.classList.remove('column-drop-target');
        });

        document.querySelectorAll('.drag-active').forEach(el => {
            el.classList.remove('drag-active');
        });

        document.querySelectorAll('.column-shift-animation').forEach(el => {
            el.classList.remove('column-shift-animation');
        });

        document.querySelectorAll('.column-insert-before').forEach(el => {
            el.classList.remove('column-insert-before');
        });

        document.querySelectorAll('.column-insert-after').forEach(el => {
            el.classList.remove('column-insert-after');
        });

        // Remove task placeholders
        document.querySelectorAll('.task-drop-placeholder').forEach(el => {
            el.remove();
        });
        originalColumnPos = null;
        return true;
    } catch (error) {
        console.error("Error clearing drag effects:", error);
        return false;
    }
}

// Data management
export function setDragData(key, value) {
    dragData[key] = value;
    console.log(`Set drag data: ${key} = ${value}`);

    if (key === 'dragType') {
        isDraggingTask = (value === 'task');
        isDraggingColumn = (value === 'column');
    }

    return true;
}
export function animateColumnShift(sourceId, targetId) {
    // Get all columns
    const columns = document.querySelectorAll('.kanban-column');

    // Remove existing animations
    columns.forEach(col => {
        col.classList.remove('column-shift-animation');
    });

    // Determine which columns need to shift
    columns.forEach(col => {
        const colId = parseInt(col.id.replace('column-', ''));
        const sourceColumn = document.querySelector(`#column-${sourceId}`);
        const targetColumn = document.querySelector(`#column-${targetId}`);

        // Skip the source column
        if (colId === sourceId) return;

        // Only animate columns that are between source and target
        if (isColumnBetween(col, sourceColumn, targetColumn)) {
            // Apply the animation class
            col.classList.add('column-shift-animation');
            console.log(`Shifting column ${colId}`);
        }
    });

    return true;
}

// Helper function to determine if a column is between source and target
function isColumnBetween(column, source, target) {
    if (!source || !target) return false;

    const columnRect = column.getBoundingClientRect();
    const sourceRect = source.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();

    // Moving right
    if (sourceRect.left < targetRect.left) {
        return columnRect.left > sourceRect.right && columnRect.left < targetRect.right;
    }
    // Moving left
    else {
        return columnRect.left < sourceRect.left && columnRect.left > targetRect.left;
    }
}
export function getDragData(key) {
    // Make sure we return an integer when needed
    if (key === 'columnId' || key === 'targetColumnId' || key === 'taskId' || key === 'sourceColumnId') {
        const value = parseInt(dragData[key]) || 0; // Return 0 if null, undefined, or not a number
        console.log(`Get drag data: ${key} = ${value}`);
        return value;
    }

    const value = dragData[key] || null;
    console.log(`Get drag data: ${key} = ${value}`);
    return value;
}
// Add this function to your dragdrop.js file
export function adjustColumnHeights() {
    // Get all columns
    const columns = document.querySelectorAll('.kanban-column');

    // Reset any explicit heights
    columns.forEach(column => {
        column.style.height = 'auto';

        // Get the content area
        const content = column.querySelector('.column-content');
        if (content) {
            content.style.height = 'auto';
        }
    });

    return true;
}
export function clearDragData() {
    console.log("Clearing drag data");
    dragData = {};
    isDraggingTask = false;
    isDraggingColumn = false;
    return true;
}

export function isTaskBeingDragged() {
    return isDraggingTask;
}

export function isColumnBeingDragged() {
    return isDraggingColumn;
}