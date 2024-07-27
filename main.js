const DEFAULT_CONTAINER_BACKGROUND_COLOR = '#2a2a2a';
const DEFAULT_TREE_COLOR = '#2EA395';
const DEFAULT_BORDER_COLOR = '#ffffff';
const DEFAULT_HIGHLIGHT_COLORS = ['#3FB116', '#C20F0F', '#2175C4'];
const DEFAULT_CUSTOM_HIGHLIGHT_COLOR = '#091E39';
const DEFAULT_TREE_DATA = {
    id: 0,
    text: '1',
    x: 0,
    y: 0,
    children: [],
    highlight: null
};
const NODE_RADIUS = 50;
const VERTICAL_SPACING = 150;
const HORIZONTAL_SPACING = 150;
const VERTICAL_MARGIN = 50;
const HORIZONTAL_MARGIN = 50;

let selectedNodesIDs = new Set();
let containerBackgroundColor = DEFAULT_CONTAINER_BACKGROUND_COLOR;
let treeColor = DEFAULT_TREE_COLOR;
let borderColor = DEFAULT_BORDER_COLOR;
let lineColor = DEFAULT_BORDER_COLOR;
let highlightColors = DEFAULT_HIGHLIGHT_COLORS;
let treeData = null;
let nodesByDepth = {};
let nodeIDCounter = 0;
let MAX_COLLISION_ITERATIONS = 50;

// <------------------------Initialization------------------------>
document.addEventListener('DOMContentLoaded', () => {
    loadState();
    // document.getElementById('reset-all').click();  // For debugging purposes
    updateTreeLayout();
    setupEventListeners();
    setupNodeMenu();
    setupGlobalColorPickers();
});

// <------------------------State Management------------------------>

function loadState() {
    // Load the saved state from local storage
    loadGlobalInformation();
    loadGeneralOptions();
    loadHighlightColors();
    loadBorderOptions();
    loadLineOptions();
    loadImportExportOptions();
    updateHighlightButtonColors();
    updateGlobalColorPickers();
}

function loadGlobalInformation() {
    const savedTreeData = localStorage.getItem('treeData');
    if (savedTreeData) {
        try {
            const parsedData = JSON.parse(savedTreeData);
            treeData = validateAndTransformTreeData(parsedData);
        } catch (error) {
            console.error('Failed to load tree data:', error);
            treeData = JSON.parse(JSON.stringify(DEFAULT_TREE_DATA));
        }
    }

    const savedNodeIDCounter = localStorage.getItem('nodeIDCounter');
    if (savedNodeIDCounter) {
        nodeIDCounter = parseInt(savedNodeIDCounter);
    }
}

function loadGeneralOptions() {
    const savedNodeColor = localStorage.getItem('nodeColor');
    const savedBackground = localStorage.getItem('backgroundColor');

    if (savedNodeColor) {
        treeColor = savedNodeColor;
        document.getElementById('node-color').value = treeColor;
        if (treeColor === 'transparent') {
            document.getElementById('node-transparent').checked = true;
            document.getElementById('node-color').value = DEFAULT_TREE_COLOR;
        } else {
            document.getElementById('node-color').value = treeColor;
        }
    }

    if (savedBackground) {
        containerBackgroundColor = savedBackground;
        document.getElementById('tree-container').style.backgroundColor = containerBackgroundColor;
        if (containerBackgroundColor === 'transparent') {
            document.getElementById('container-transparent-background').checked = true;
        } else {
            document.getElementById('container-background-color').value = containerBackgroundColor;
        }
    }
}

function loadHighlightColors() {
    const savedHighlightColors = localStorage.getItem('highlightColors');
    if (savedHighlightColors) {
        highlightColors = JSON.parse(savedHighlightColors);
    }
}

function loadBorderOptions() {
    const savedBorderColor = localStorage.getItem('borderColor');
    const borderThickness = localStorage.getItem('borderThickness');
    const borderColorSameAsText = localStorage.getItem('borderColorSameAsText');
    const noBorder = localStorage.getItem('noBorder');

    if (savedBorderColor) {
        borderColor = savedBorderColor;
        document.getElementById('border-color').value = borderColor;
        if (noBorder === 'true') {
            document.getElementById('no-border').checked = true;
        }
        if (borderColorSameAsText === 'true') {
            document.getElementById(`border-same-as-text`).checked = true;
        }
    }

    if (borderThickness) {
        document.getElementById('border-thickness').value = borderThickness;
    }
}

function loadLineOptions() {
    const savedLineColor = localStorage.getItem('lineColor');
    const lineThickness = localStorage.getItem('lineThickness');
    const lineSameAsBorder = localStorage.getItem('lineSameAsBorder');
    const noLine = localStorage.getItem('noLine');

    if (savedLineColor) {
        lineColor = savedLineColor;
        document.getElementById('line-color').value = lineColor;
        if (noLine === 'true') {
            document.getElementById('no-line').checked = true;
        }
        if (lineSameAsBorder === 'true') {
            document.getElementById('line-same-as-border').checked = true;
        }
    }

    if (lineThickness) {
        document.getElementById('line-thickness').value = lineThickness;
    }
}

function loadImportExportOptions() {
    const scaleFactor = localStorage.getItem('scaleFactor');
    if (scaleFactor) {
        document.getElementById('scale-factor').value = scaleFactor;
    }
}

function saveState() {
    // Global information:
    localStorage.setItem('treeData', JSON.stringify(treeData));
    localStorage.setItem('nodeIDCounter', nodeIDCounter);

    // General Options:
    localStorage.setItem('nodeColor', treeColor);
    localStorage.setItem('backgroundColor', containerBackgroundColor);

    // Highlight Colors:
    localStorage.setItem('highlightColors', JSON.stringify(highlightColors));

    // Border Options:
    localStorage.setItem('borderColor', borderColor);
    localStorage.setItem('borderThickness', document.getElementById('border-thickness').value);
    localStorage.setItem('borderColorSameAsText', document.getElementById('border-same-as-text').checked);
    localStorage.setItem('noBorder', document.getElementById('no-border').checked);

    // Line Options:
    localStorage.setItem('lineColor', document.getElementById('line-color').value);
    localStorage.setItem('lineThickness', document.getElementById('line-thickness').value);
    localStorage.setItem('lineSameAsBorder', document.getElementById('line-same-as-border').checked);
    localStorage.setItem('noLine', document.getElementById('no-line').checked);

    // Import/Export Options:
    localStorage.setItem('scaleFactor', document.getElementById('scale-factor').value);
}


// <------------------------UI Controls------------------------>
function setupEventListeners() {
    // Update the tree layout when the window is resized
    window.addEventListener('resize', updateSVGViewBox);

    setupGeneralOptionsEventListeners();
    setupBorderOptionsEventListeners();
    setupLineOptionsEventListeners();
    setupImportExportEventListeners();
    setupResetButtons();

    setupKeyboardShortcuts();
}

function setupGeneralOptionsEventListeners() {
    const nodeColorPicker = document.getElementById('node-color');
    const containerColorPicker = document.getElementById('container-background-color');
    const nodeTransparentCheckbox = document.getElementById('node-transparent');
    const containerTransparentCheckbox = document.getElementById('container-transparent-background');
    const borderSameAsTextCheckbox = document.getElementById('border-same-as-text');

    // Node Color Options:
    nodeColorPicker.addEventListener('input', () => {
        if (!nodeTransparentCheckbox.checked) {
            treeColor = nodeColorPicker.value;
            if (borderSameAsTextCheckbox.checked) {
                borderColor = getContrastColor(treeColor);
            }
            updateTreeLayout();
            saveState();
        }
    });

    // Container Color Options:
    containerColorPicker.addEventListener('input', () => {
        if (!containerTransparentCheckbox.checked) {
            containerBackgroundColor = containerColorPicker.value;
            document.getElementById('tree-container').style.backgroundColor = containerBackgroundColor;
            saveState();
        }
    });

    // Node Transparent Checkbox:
    nodeTransparentCheckbox.addEventListener('change', () => {
        if (nodeTransparentCheckbox.checked) {
            treeColor = 'transparent';
        } else {
            treeColor = nodeColorPicker.value;
        }
        updateTreeLayout();
    });

    // Container Transparent Checkbox:
    containerTransparentCheckbox.addEventListener('change', () => {
        if (containerTransparentCheckbox.checked) {
            containerBackgroundColor = 'transparent';
            document.getElementById('tree-container').style.backgroundColor = containerBackgroundColor;
        } else {
            containerBackgroundColor = containerColorPicker.value;
            document.getElementById('tree-container').style.backgroundColor = containerBackgroundColor;
        }
        saveState();
    });
}

function setupBorderOptionsEventListeners() {
    const borderColorPicker = document.getElementById('border-color');
    const borderThicknessInput = document.getElementById('border-thickness');
    const borderSameAsTextCheckbox = document.getElementById('border-same-as-text');
    const noBorderCheckbox = document.getElementById('no-border');
    const lineSameAsBorderCheckbox = document.getElementById('line-same-as-border');
    const noLineCheckbox = document.getElementById('no-line');

    // Border Color Options:
    borderColorPicker.addEventListener('input', () => {
        borderColor = borderColorPicker.value;
        if (!noBorderCheckbox.checked && !borderSameAsTextCheckbox.checked) {
            document.querySelectorAll('.tree-node circle').forEach(circle => {
                circle.setAttribute('stroke', borderColor);
            });

            if (lineSameAsBorderCheckbox && !noLineCheckbox.checked) {
                updateLineColors();
            }
        }
        saveState();
    });

    // Border Thickness Options:
    borderThicknessInput.addEventListener('input', () => {
        document.querySelectorAll('.tree-node circle').forEach(circle => {
            circle.setAttribute('stroke-width', borderThicknessInput.value);
        });
        saveState();
    });

    // Border Same As Text Checkbox:
    borderSameAsTextCheckbox.addEventListener('change', () => {
        if (!noBorderCheckbox.checked) {
            if (borderSameAsTextCheckbox.checked) {
                document.querySelectorAll('.tree-node circle').forEach(circle => {
                    // get the node color
                    const nodeColor = circle.getAttribute('fill');
                    circle.setAttribute('stroke', getContrastColor(nodeColor));
                });
            } else {
                let newBorderColor = borderColorPicker.value;
                document.querySelectorAll('.tree-node circle').forEach(circle => {
                    circle.setAttribute('stroke', newBorderColor);
                });
            }
        }

        if (lineSameAsBorderCheckbox && !noLineCheckbox.checked) {
            updateLineColors();
        }

        saveState();
    });

    // No Border Checkbox:
    noBorderCheckbox.addEventListener('change', () => {
        let newBorderColor;
        if (noBorderCheckbox.checked) {
            newBorderColor = 'transparent';
        } else {
            if (borderSameAsTextCheckbox.checked) {
                document.querySelectorAll('.tree-node circle').forEach(circle => {
                    // get the node color
                    const nodeColor = circle.getAttribute('fill');
                    newBorderColor = getContrastColor(nodeColor);
                    circle.setAttribute('stroke', newBorderColor);
                });
                return;
            } else {
                newBorderColor = borderColorPicker.value;
            }
        }
        document.querySelectorAll('.tree-node circle').forEach(circle => {
            circle.setAttribute('stroke', newBorderColor);
        });

        if (lineSameAsBorderCheckbox && !noLineCheckbox.checked) {
            updateLineColors();
        }
        saveState();
    });
}

function setupLineOptionsEventListeners() {
    const lineColorPicker = document.getElementById('line-color');
    const lineThicknessInput = document.getElementById('line-thickness');
    const lineSameAsBorderCheckbox = document.getElementById('line-same-as-border');
    const noLineCheckbox = document.getElementById('no-line');

    // Line Color Options:
    lineColorPicker.addEventListener('input', () => {
        lineColor = lineColorPicker.value;
        if (!noLineCheckbox.checked) {
            document.querySelectorAll('line').forEach(line => {
                line.setAttribute('stroke', lineColorPicker.value);
            });
        }
        saveState();
    });

    // Line Thickness Options:
    lineThicknessInput.addEventListener('input', () => {
        document.querySelectorAll('line').forEach(line => {
            line.setAttribute('stroke-width', lineThicknessInput.value);
        });
        saveState();
    });

    // Line Same As Border Checkbox:
    lineSameAsBorderCheckbox.addEventListener('change', () => {
        updateLineColors();
    });

    // No Line Checkbox:
    noLineCheckbox.addEventListener('change', () => {
        if (noLineCheckbox.checked) {
            document.querySelectorAll('line').forEach(line => {
                line.setAttribute('stroke', 'transparent');
            });
        } else {
            updateLineColors();
        }
        saveState();
    });
}

function setupImportExportEventListeners() {
    const importFileInput = document.getElementById('import-json');
    const importTreeButton = document.getElementById('import-tree');
    const scaleFactorInput = document.getElementById('scale-factor');
    const exportTreeButton = document.getElementById('export-tree');

    // Import Options:
    importFileInput.addEventListener('change', function (e) {
        this.nextElementSibling.nextElementSibling.textContent = e.target.files[0] ? e.target.files[0].name : 'No file chosen';
        this.nextElementSibling.nextElementSibling.style.color = e.target.files[0] ? '#d0d0d0' : '#a0a0a0';
    });
    importTreeButton.addEventListener('click', importTree);

    // Export Options:
    scaleFactorInput.addEventListener('input', () => {
        saveState()
    });
    exportTreeButton.addEventListener('click', exportTree)
}

function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function (event) {
        if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
            // Delete selected node(s) on backspace or delete key press
            if (selectedNodesIDs.size > 0 && (event.key === 'Backspace' || event.key === 'Delete')) {
                event.preventDefault(); // Prevent the browser's back action on backspace
                handleDeleteNode();
            }

            // Add a child node to the selected node on enter key press
            if (selectedNodesIDs.size === 1 && event.key === 'Enter') {
                handleAddChild();
            }

            // Move the selected node with arrow keys
            if (selectedNodesIDs.size === 1) {
                const currentNodeId = Array.from(selectedNodesIDs)[0];
                let newSelectedNodeId = null;

                switch (event.key) {
                    case 'ArrowUp':
                        event.preventDefault(); // Prevent scrolling
                        newSelectedNodeId = findParentNodeId(currentNodeId);
                        break;
                    case 'ArrowDown':
                        event.preventDefault(); // Prevent scrolling
                        newSelectedNodeId = findMiddleChildNodeId(currentNodeId);
                        break;
                    case 'ArrowLeft':
                        newSelectedNodeId = findPreviousSiblingId(currentNodeId);
                        break;
                    case 'ArrowRight':
                        newSelectedNodeId = findNextSiblingId(currentNodeId);
                        break;
                }

                if (newSelectedNodeId !== null) {
                    selectedNodesIDs.clear();
                    selectedNodesIDs.add(newSelectedNodeId);
                    updateNodeSelection();
                    updateNodeMenu();
                }
            }

            // If control + a, select all nodes
            if (event.ctrlKey && event.key === 'a') {
                event.preventDefault();
                selectedNodesIDs.clear();
                selectAllNodes(treeData);
                updateNodeSelection();
                updateNodeMenu();
            }
        }
    });
}

function findParentNodeId(nodeId) {
    function search(node) {
        for (let child of node.children) {
            if (child.id === nodeId) {
                return node.id;
            }
            const result = search(child);
            if (result) return result;
        }
        return null;
    }

    return search(treeData);
}

function findMiddleChildNodeId(nodeId) {
    const node = findNodeById(treeData, nodeId);
    if (node.children.length === 0) return null;

    // Calculate the index of the middle child
    const middleIndex = Math.floor((node.children.length - 1) / 2);
    return node.children[middleIndex].id;
}

function findPreviousSiblingId(nodeId) {
    const parent = findParentNodeObject(treeData, nodeId);
    if (!parent) return null;
    const index = parent.children.findIndex(child => child.id === nodeId);
    return index > 0 ? parent.children[index - 1].id : null;
}

function findNextSiblingId(nodeId) {
    const parent = findParentNodeObject(treeData, nodeId);
    if (!parent) return null;
    const index = parent.children.findIndex(child => child.id === nodeId);
    return index < parent.children.length - 1 ? parent.children[index + 1].id : null;
}

function findParentNodeObject(node, targetId) {
    if (node.children.some(child => child.id === targetId)) {
        return node;
    }
    for (let child of node.children) {
        const result = findParentNodeObject(child, targetId);
        if (result) return result;
    }
    return null;
}

function selectAllNodes(node) {
    selectedNodesIDs.add(node.id);
    node.children.forEach(child => selectAllNodes(child));
}

function updateNodeSelection() {
    // Deselect all nodes visually
    document.querySelectorAll('.tree-node').forEach(node => {
        node.classList.remove('selected');
    });

    // Select the new node visually
    selectedNodesIDs.forEach(id => {
        const nodeElement = document.querySelector(`.tree-node[data-id="${id}"]`);
        if (nodeElement) {
            nodeElement.classList.add('selected');
        }
    });
}

function setupResetButtons() {
    const resetColorsBtn = document.getElementById('reset-colors');
    const resetTreeBtn = document.getElementById('reset-tree');
    const resetAllBtn = document.getElementById('reset-all');
    const lineColorPicker = document.getElementById('line-color');
    const exportFormat = document.getElementById('export-format');
    const scaleFactor = document.getElementById('scale-factor');
    const borderThickness = document.getElementById('border-thickness');
    const lineThickness = document.getElementById('line-thickness');

    // Reset Color Options:
    resetColorsBtn.addEventListener('click', () => {
        resetExportColors();
        resetNodeColors();
        highlightColors = [...DEFAULT_HIGHLIGHT_COLORS];
        lineColorPicker.value = DEFAULT_BORDER_COLOR;
        updateHighlightButtonColors();
        updateGlobalColorPickers();
        updateAllNodesHighlightColor();
        saveState();
        showNotification('Colors reset to default', 'success');
    });

    // Reset Tree Options:
    resetTreeBtn.addEventListener('click', () => {
        resetTreeStructure();
        showNotification('Tree reset to default', 'success');
    });

    // Reset All Options:
    resetAllBtn.addEventListener('click', () => {
        resetExportColors();
        resetFileInput();
        exportFormat.value = 'png';
        scaleFactor.value = 2;
        borderThickness.value = 2.5;
        lineThickness.value = 2;
        lineColorPicker.value = DEFAULT_BORDER_COLOR;
        resetNodeColors();
        highlightColors = [...DEFAULT_HIGHLIGHT_COLORS];
        resetTreeStructure();
        updateHighlightButtonColors();
        updateGlobalColorPickers();
        showNotification('All settings reset to default', 'success');
    });
}

function resetFileInput() {
    const fileInput = document.getElementById('import-json');
    const fileNameDisplay = document.querySelector('.file-name');

    // Reset the file input
    fileInput.value = '';

    // Reset the displayed file name
    fileNameDisplay.textContent = 'No file chosen';
}

function resetTreeStructure() {
    treeData = JSON.parse(JSON.stringify(DEFAULT_TREE_DATA));
    treeData.x = document.getElementById('tree-svg').viewBox.baseVal.width / 2;
    treeData.y = document.getElementById('tree-svg').viewBox.baseVal.height / 2;
    nodeIDCounter = 0;
    nodesByDepth = {};
    updateTreeLayout();
}

function resetExportColors() {
    containerBackgroundColor = DEFAULT_CONTAINER_BACKGROUND_COLOR;
    document.getElementById('container-background-color').value = containerBackgroundColor;
    document.getElementById('container-transparent-background').checked = false;
    document.getElementById('tree-container').style.backgroundColor = containerBackgroundColor;
}

function resetNodeColors() {
    treeColor = DEFAULT_TREE_COLOR;
    borderColor = DEFAULT_BORDER_COLOR;
    document.getElementById('node-color').value = treeColor;
    document.getElementById('border-color').value = borderColor;
    document.getElementById('node-transparent').checked = false;
    document.getElementById('no-border').checked = false;
    document.getElementById('border-same-as-text').checked = true;
}

function updateHighlightButtonColors() {
    document.querySelectorAll('.highlight-btn').forEach((btn, index) => {
        btn.style.backgroundColor = highlightColors[index];
        btn.style.color = getContrastColor(highlightColors[index]);
    });
}

function updateLineColors() {
    let lineSameAsBorderCheckbox = document.getElementById('line-same-as-border');
    let lineColorPicker = document.getElementById('line-color');

    let newLineColor;
    if (lineSameAsBorderCheckbox.checked) {
        newLineColor = getCurrentBorderColor();
    } else {
        newLineColor = lineColorPicker.value;
    }
    document.querySelectorAll('line').forEach(line => {
        line.setAttribute('stroke', newLineColor);
    });
    saveState();
}

function getContrastColor(hex_color) {
    // Convert hex to RGB
    const r = parseInt(hex_color.substring(1, 3), 16);
    const g = parseInt(hex_color.substring(3, 5), 16);
    const b = parseInt(hex_color.substring(5, 7), 16);

    // Calculate luminance
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    // Return black or white depending on luminance
    return (yiq >= 128) ? 'black' : 'white';
}

function getCurrentBorderColor(nodeColor = treeColor) {
    if (document.getElementById('no-border').checked) {
        return 'transparent';
    }
    if (document.getElementById('border-same-as-text').checked) {
        // Use the nodeColor, defaulting to treeColor if nodeColor is not explicitly provided
        return getContrastColor(nodeColor);
    } else {
        return borderColor;
    }
}

function getCurrentLineColor() {
    if (document.getElementById('no-line').checked) {
        return 'transparent';
    }
    if (document.getElementById('line-same-as-border').checked) {
        return getCurrentBorderColor();
    } else {
        return document.getElementById('line-color').value;
    }
}

function updateGlobalColorPickers() {
    document.querySelectorAll('#global-color-pickers input').forEach((picker, index) => {
        picker.value = highlightColors[index];
    });
}

function setupGlobalColorPickers() {
    const colorPickers = document.querySelectorAll('#global-color-pickers input');
    colorPickers.forEach((picker, index) => {
        picker.addEventListener('input', () => {
            highlightColors[index] = picker.value;
            updateAllNodesHighlightColor(index, picker.value);
            updateHighlightButtonColors();
            saveState();
        });
    });
}

function showNotification(message, type = 'info', duration = 3000) {
    const container = document.getElementById('notification-container');
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    container.appendChild(notification);

    // Trigger reflow to enable transition
    notification.offsetHeight;

    // Add 'show' class to fade in
    notification.classList.add('show');

    setTimeout(() => {
        // Remove 'show' class to fade out
        notification.classList.remove('show');

        // Remove the notification from the DOM after fade out
        setTimeout(() => {
            container.removeChild(notification);
        }, 300);
    }, duration);
}

function reapplySelection() {
    if (selectedNodesIDs.size > 0) {
        selectedNodesIDs.forEach(selectedNodeID => {
            let node = findNodeById(treeData, selectedNodeID);
            if (node) {
                selectNode(node, true);
            }
        });
    }
}

function generateUniqueId() {
    let newId = nodeIDCounter++;

    if (treeData) {
        while (findNodeById(treeData, newId)) {
            newId = nodeIDCounter++;
        }
    }

    return newId;
}

// <------------------------Node Menu------------------------>

function setupNodeMenu() {
    const nodeValue = document.getElementById('node-value');
    const addChildBtn = document.getElementById('add-child');
    const customHighlight = document.getElementById('custom-highlight');
    const removeHighlightBtn = document.getElementById('remove-highlight');
    const deleteNodeBtn = document.getElementById('delete-node');

    document.addEventListener('click', handleDocumentClick);
    nodeValue.addEventListener('input', handleNodeValueInput);
    addChildBtn.addEventListener('click', handleAddChild);
    removeHighlightBtn.addEventListener('click', handleRemoveHighlight);
    customHighlight.addEventListener('input', handleCustomHighlight);
    deleteNodeBtn.addEventListener('click', handleDeleteNode);

    setupHighlightButtons();
}

function toggleNodeMenu(show) {
    const nodeMenu = document.getElementById('node-menu');
    if (show) {
        nodeMenu.classList.remove('hidden');
        setTimeout(() => nodeMenu.classList.add('visible'), 10);
    } else {
        nodeMenu.classList.remove('visible');
        setTimeout(() => nodeMenu.classList.add('hidden'), 300);
    }
}

function handleDocumentClick(e) {
    const nodeMenu = document.getElementById('node-menu');
    if (!nodeMenu.contains(e.target) && e.target.tagName !== 'circle') {
        toggleNodeMenu(false);
        document.querySelectorAll('.tree-node').forEach(node => {
            node.classList.remove('selected');
        });
        selectedNodesIDs.clear();
    }
}

function handleNodeValueInput() {
    selectedNodesIDs.forEach(selectedNodeID => {
        const node = findNodeById(treeData, selectedNodeID);
        if (node) {
            node.text = this.value;
            const domNode = document.querySelector(`.tree-node[data-id="${selectedNodeID}"]`);
            if (domNode) {
                domNode.querySelector('text').textContent = this.value;
            }
            saveState();
        }
    });
}

function handleAddChild() {
    if (selectedNodesIDs.size === 1) {
        const nodeId = Array.from(selectedNodesIDs)[0];
        const parentNode = findNodeById(treeData, nodeId);
        if (parentNode) {
            let id = generateUniqueId();
            const newChild = {
                id: id,
                text: parentNode.text,
                x: 0,
                y: 0,
                children: [],
                highlight: null
            }
            parentNode.children.push(newChild);
            updateTreeLayout();
            showNotification('Child node added', 'success');
        }
    }
}

function handleDeleteNode() {
    let count = 0;
    selectedNodesIDs.forEach(selectedNodeID => {
        if (selectedNodeID !== treeData.id) {
            const node = findNodeById(treeData, selectedNodeID);
            if (node) {
                removeNodeFromTree(treeData, selectedNodeID.toString());
                count++;
            }
        } else {
            showNotification('Cannot delete the root node', 'warning');
        }
    });

    if (count > 0) {
        if (count === 1) {
            showNotification('Node deleted', 'success');
        } else {
            showNotification(`Nodes deleted`, 'success');
        }
    }

    // Clear selected nodes and hide the node menu
    selectedNodesIDs.clear();
    toggleNodeMenu(false);
    updateTreeLayout();
}

function handleRemoveHighlight() {
    let count = 0;
    selectedNodesIDs.forEach(selectedNodeID => {
        const node = findNodeById(treeData, selectedNodeID);
        if (node && node.highlight) {
            node.highlight = null;
            const borderColor = getCurrentBorderColor(treeColor);

            const selectedNode = document.querySelector(`.tree-node[data-id="${selectedNodeID}"]`);
            if (selectedNode) {
                selectedNode.querySelector('circle').setAttribute('fill', treeColor);
                selectedNode.querySelector('text').setAttribute('fill', getContrastColor(treeColor));
                selectedNode.querySelector('circle').setAttribute('stroke', borderColor);
            }
            count++;
        }
    });

    if (count > 0) {
        if (count === 1) {
            showNotification('Highlight removed', 'success');
        } else {
            showNotification(`${count} highlights removed`, 'success');
        }
        saveState();
    } else {
        showNotification('No highlights to remove', 'warning');
    }

    updateNodeMenu();
}

function handleCustomHighlight() {
    selectedNodesIDs.forEach(selectedNodeID => {
        const node = findNodeById(treeData, selectedNodeID);
        if (node) {
            applyHighlight(node, {type: 'custom', color: this.value});
            saveState();
        }
    });
}

function setupHighlightButtons() {
    document.querySelectorAll('.highlight-btn').forEach((btn, index) => {
        btn.addEventListener('click', () => {
            selectedNodesIDs.forEach(selectedNodeID => {
                const node = findNodeById(treeData, selectedNodeID);
                if (node) {
                    applyHighlight(node, {type: 'global', index: index});
                    saveState();
                }
            });
        });
    });
}

function applyHighlight(node, highlight) {
    node.highlight = highlight;
    const color = highlight.type === 'custom' ? highlight.color : highlightColors[highlight.index];

    const selectedNode = document.querySelector(`.tree-node[data-id="${node.id}"]`);
    selectedNode.querySelector('circle').setAttribute('fill', color);
    selectedNode.querySelector('text').setAttribute('fill', getContrastColor(color));

    if (document.getElementById('border-same-as-text').checked && !document.getElementById('no-border').checked) {
        selectedNode.querySelector('circle').setAttribute('stroke', getContrastColor(color));
    }

    updateNodeMenu();
}

function updateNodeMenu() {
    const selectedCount = document.getElementById('selected-count');
    const addChildBtn = document.getElementById('add-child');
    const nodeValueInput = document.getElementById('node-value');
    const nodeIdSpan = document.getElementById('node-id');
    const customHighlightInput = document.getElementById('custom-highlight');
    const removeHighlightBtn = document.getElementById('remove-highlight');
    const deleteNodeBtn = document.getElementById('delete-node');

    selectedCount.textContent = `${selectedNodesIDs.size} selected`;

    if (selectedNodesIDs.size === 1) {
        const nodeID = Array.from(selectedNodesIDs)[0];
        const node = findNodeById(treeData, nodeID);
        nodeValueInput.previousElementSibling.textContent = 'Node Value:';
        nodeValueInput.value = node.text;
        nodeValueInput.placeholder = 'Enter node value';
        nodeValueInput.disabled = false;
        nodeIdSpan.previousElementSibling.textContent = 'Node ID:';
        nodeIdSpan.textContent = node.id;
        addChildBtn.style.display = 'block';
        removeHighlightBtn.textContent = 'Remove Highlight';
        deleteNodeBtn.textContent = 'Delete Node';

        // Set custom highlight color
        if (node.highlight && node.highlight.type === 'custom') {
            customHighlightInput.value = node.highlight.color;
        } else {
            customHighlightInput.value = DEFAULT_CUSTOM_HIGHLIGHT_COLOR;
        }

        // Set remove highlight button state
        if (node.highlight) {
            removeHighlightBtn.classList.add('active');
            removeHighlightBtn.classList.remove('inactive');
        } else {
            removeHighlightBtn.classList.add('inactive');
            removeHighlightBtn.classList.remove('active');
        }
    } else {
        nodeValueInput.previousElementSibling.textContent = 'Node Values:';
        nodeValueInput.value = '';
        nodeValueInput.placeholder = 'Enter node values';
        nodeIdSpan.previousElementSibling.textContent = 'Node IDs:';
        nodeIdSpan.textContent = 'Multiple';
        addChildBtn.style.display = 'none';
        removeHighlightBtn.textContent = 'Remove Highlights';
        deleteNodeBtn.textContent = 'Delete Nodes';

        // Check if any selected node has a highlight
        const anyHighlight = Array.from(selectedNodesIDs).some(nodeID => {
            return findNodeById(treeData, nodeID).highlight
        });
        if (anyHighlight) {
            removeHighlightBtn.classList.add('active');
            removeHighlightBtn.classList.remove('inactive');
        } else {
            removeHighlightBtn.classList.add('inactive');
            removeHighlightBtn.classList.remove('active');
        }
    }

    toggleNodeMenu(selectedNodesIDs.size > 0);
}

// <------------------------Tree Operations------------------------>

function updateTreeLayout() {
    if (!treeData) {
        treeData = {
            id: 0,
            text: '1',
            x: 0,
            y: 0,
            children: [],
            highlight: null
        };
    }

    updateSVGViewBox();

    // Reapply selected node (if any)
    reapplySelection();

    saveState();
}

function updateSVGViewBox() {
    // Reset nodesByDepth for each update
    nodesByDepth = {};

    const svg = document.getElementById('tree-svg');
    const container = document.getElementById('tree-container');

    // Start with the root node in the center
    const initialX = 0;
    const initialY = VERTICAL_MARGIN + NODE_RADIUS;

    // Update all node positions
    updateNodePositions(treeData, initialX, initialY, 0);

    // Resolve collisions at each depth
    for (let depth in nodesByDepth) {
        resolveCollisionsAtDepth(nodesByDepth[depth], depth);
    }

    // Calculate actual dimensions based on node positions
    const {width, height, leftmostPosition, rightmostPosition} = calculateSVGDimensions(treeData);

    svg.setAttribute('width', width.toString());
    svg.setAttribute('height', height.toString());
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

    const containerWidth = Math.min(width, window.innerWidth * 0.8);
    container.style.width = `${containerWidth}px`;

    // Calculate the horizontal offset to center the entire tree
    const horizontalOffset = (width - (rightmostPosition - leftmostPosition)) / 2 - leftmostPosition;

    // Apply the offset to all nodes
    function applyOffset(node) {
        node.x += horizontalOffset;
        node.children.forEach(applyOffset);
    }

    applyOffset(treeData);

    // Clear existing tree
    svg.innerHTML = '';

    // Create and add the mask
    const mask = createSVGMask(svg);

    // Render the tree with the mask
    renderTree(treeData, svg, mask);
}

function calculateSVGDimensions(node) {
    let minX = Infinity, maxX = -Infinity, maxY = -Infinity;

    function traverse(node) {
        minX = Math.min(minX, node.x);
        maxX = Math.max(maxX, node.x);
        maxY = Math.max(maxY, node.y);

        node.children.forEach(traverse);
    }

    traverse(node);

    // Width:
    // (maxX - minX) = Distance from the centers of the leftmost node to the rightmost node
    // NODE_RADIUS * 2 = Account for the left radius of the leftmost node and right radius of the rightmost node
    // HORIZONTAL_MARGIN * 2 = Account for the margin on both sides
    const width = maxX - minX + NODE_RADIUS * 2 + HORIZONTAL_MARGIN * 2;

    // Height:
    // maxY = Distance from the center of the bottommost node to the beginning of the screen
    //        since the starting root position accounts for the top margin and the top radius of the root node
    // NODE_RADIUS = Account for the bottom radius of the topmost node
    // VERTICAL_MARGIN = Account for the bottom margin
    const height = maxY + NODE_RADIUS + VERTICAL_MARGIN;

    return {width, height, leftmostPosition: minX, rightmostPosition: maxX};
}

function updateNodePositions(node, x, y, depth) {
    node.x = x;
    node.y = y;

    // Initialize the array for this depth if it doesn't exist
    if (!nodesByDepth[depth]) {
        nodesByDepth[depth] = [];
    }

    // Add this node to the appropriate depth array if it's not already there
    if (!nodesByDepth[depth].includes(node)) {
        nodesByDepth[depth].push(node);
    }

    if (node.children.length > 0) {
        positionChildNodes(node, depth + 1);
    }
}

function positionChildNodes(parentNode, childDepth) {
    const childrenCount = parentNode.children.length;
    const totalWidth = (childrenCount - 1) * HORIZONTAL_SPACING;
    let startX = parentNode.x - totalWidth / 2;

    parentNode.children.forEach((child, index) => {
        const childX = startX + index * HORIZONTAL_SPACING;
        const childY = parentNode.y + VERTICAL_SPACING;
        updateNodePositions(child, childX, childY, childDepth);
    });
}

function positionImmediateChildNodes(parentNode) {
    const childrenCount = parentNode.children.length;
    const totalWidth = (childrenCount - 1) * HORIZONTAL_SPACING;
    let startX = parentNode.x - totalWidth / 2;

    parentNode.children.forEach((child, index) => {
        const childX = startX + index * HORIZONTAL_SPACING;
        const childY = parentNode.y + VERTICAL_SPACING;
        child.x = childX;
        child.y = childY;
    });
}

function resolveCollisionsAtDepth(nodes, depth) {
    if (!nodes || nodes.length <= 1) return;

    // Create a copy of the original nodes array
    let originalNodes = [...nodes];
    originalNodes.sort((a, b) => a.x - b.x);

    let sortedParentGroups = groupNodesByParentAndSort(originalNodes);

    let involvedParents = getFirstCollisionGroupParents(sortedParentGroups);

    if (involvedParents.length < 1) {
        return;
    }

    // Sort the parents by x position
    involvedParents.sort((a, b) => a.x - b.x);

    let iteration = 0;
    while (iteration < MAX_COLLISION_ITERATIONS) {
        resolveChildCollisions(involvedParents);

        // Check if there are still collisions after resolving
        let updatedInvolvedParents = getFirstCollisionGroupParents(sortedParentGroups);

        if (updatedInvolvedParents.length < 1) {
            // No more collisions, exit the loop
            break;
        }

        // If there are, check which parents were not in the previous group
        let newParents = updatedInvolvedParents.filter(parent => !involvedParents.includes(parent));

        // Add the new parents to the previous group
        involvedParents.push(...newParents);

        // Sort the parents by x position
        involvedParents.sort((a, b) => a.x - b.x);

        iteration++;
    }

    if (iteration === MAX_COLLISION_ITERATIONS) {
        showNotification(`Could not resolve all collisions, some nodes may overlap at depth ${depth}`, 'warning');
    }
}

function groupNodesByParentAndSort(nodes) {
    let nodesByParent = {};
    let parents = new Set();

    // Group nodes by parent
    nodes.forEach(node => {
        let parentID = findParentNodeId(node.id);
        if (!nodesByParent[parentID]) {
            nodesByParent[parentID] = [];
            parents.add(parentID);
        }
        nodesByParent[parentID].push(node);
    });

    // Sort nodes within each parent group
    Object.values(nodesByParent).forEach(group => {
        group.sort((a, b) => a.x - b.x);
    });

    // Create an array of parent-children pairs, sorted by parent's x position
    return Array.from(parents)
        .map(parentID => {
            let parentNode = findNodeById(treeData, parentID);
            return {
                parent: parentNode,
                children: nodesByParent[parentID]
            };
        })
        .sort((a, b) => a.parent.x - b.parent.x);
}

function getFirstCollisionGroupParents(sortedParentGroups) {
    let involvedParents = new Set();

    // Check for collisions between nodes of different parents
    for (let i = 0; i < sortedParentGroups.length; i++) {
        let currentGroup = sortedParentGroups[i];
        let currentParent = currentGroup.parent;
        let currentParentNodes = currentGroup.children;
        involvedParents.add(currentParent);

        for (let j = i + 1; j < sortedParentGroups.length; j++) {
            let nextGroup = sortedParentGroups[j];
            let nextParent = nextGroup.parent;
            let nextParentNodes = nextGroup.children;

            // Check if the rightmost node of the current parent collides with the leftmost node of the next parent
            if (nextParentNodes[0].x - currentParentNodes[currentParentNodes.length - 1].x < HORIZONTAL_SPACING) {
                involvedParents.add(nextParent);
            } else {
                // If we found at least one collision, return the involved parents
                if (involvedParents.size > 1) {
                    return Array.from(involvedParents);
                }
                // If no collision, reset and move to the next parent
                involvedParents = new Set();
                break;
            }
        }

        // If we have a group at the end, return the involved parents
        if (involvedParents.size > 1) {
            return Array.from(involvedParents);
        }
    }

    // If no collisions were found, return an empty array
    return [];
}

function resolveChildCollisions(parents) {
    let uniqueParents = [...new Set(parents)];

    let totalChildren = uniqueParents.reduce((sum, parent) => sum + parent.children.length, 0);
    let totalWidth = (totalChildren - 1) * HORIZONTAL_SPACING;

    let leftmostParent = uniqueParents.reduce((left, parent) => parent.x < left.x ? parent : left);
    let rightmostParent = uniqueParents.reduce((right, parent) => parent.x > right.x ? parent : right);

    let startX = (leftmostParent.x + rightmostParent.x) / 2 - totalWidth / 2;

    // Flatten the children of all parents and sort them by x position
    let allChildren = [];

    function sortChildrenByXPosition(parent) {
        parent.children.sort((a, b) => a.x - b.x);
        allChildren.push(...parent.children);
    }

    // Sort the parents themselves by x position
    uniqueParents.sort((a, b) => a.x - b.x);
    uniqueParents.forEach(parent => sortChildrenByXPosition(parent));

    allChildren.forEach((child, index) => {
        child.x = startX + index * HORIZONTAL_SPACING;
        updateSubtreePositions(child);
    });
}

function updateSubtreePositions(node) {
    if (node.children.length > 0) {
        positionImmediateChildNodes(node);
        node.children.forEach(updateSubtreePositions);
    }
}

function calculateIntersectionPoint(x1, y1, x2, y2, cx, cy, r) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const a = dx * dx + dy * dy;
    const b = 2 * (dx * (x1 - cx) + dy * (y1 - cy));
    const c = (x1 - cx) * (x1 - cx) + (y1 - cy) * (y1 - cy) - r * r;
    const discriminant = b * b - 4 * a * c;

    if (discriminant < 0) {
        return null;
    }

    const t1 = (-b + Math.sqrt(discriminant)) / (2 * a);
    const t2 = (-b - Math.sqrt(discriminant)) / (2 * a);
    const t = 0 <= t1 && t1 <= 1 ? t1 : (0 <= t2 && t2 <= 1 ? t2 : null);

    if (t === null) {
        return null;
    }

    return {x: x1 + t * dx, y: y1 + t * dy};
}

function createSVGMask(svg) {
    const mask = document.createElementNS('http://www.w3.org/2000/svg', 'mask');
    mask.setAttribute('id', 'nodeMask');

    const maskRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    maskRect.setAttribute('x', '0');
    maskRect.setAttribute('y', '0');
    maskRect.setAttribute('width', '100%');
    maskRect.setAttribute('height', '100%');
    maskRect.setAttribute('fill', 'white');
    mask.appendChild(maskRect);

    svg.appendChild(mask);
    return mask;
}

function addNodeToMask(mask, x, y, radius) {
    const maskCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    maskCircle.setAttribute('cx', x.toString());
    maskCircle.setAttribute('cy', y.toString());
    maskCircle.setAttribute('r', radius.toString());
    maskCircle.setAttribute('fill', 'black');
    mask.appendChild(maskCircle);
}

function renderTree(node, parentElement, mask) {
    const nodeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    parentElement.appendChild(nodeGroup);

    // Add this node to the mask
    addNodeToMask(mask, node.x, node.y, NODE_RADIUS);

    // Draw lines to children
    const linesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const isSingleChild = node.children.length === 1;
    if (!isSingleChild) {
        linesGroup.setAttribute('mask', 'url(#nodeMask)');
    }
    nodeGroup.appendChild(linesGroup);

    let strokeColor = getCurrentLineColor();

    node.children.forEach((child) => {
        let x1 = node.x, y1 = node.y, x2 = child.x, y2 = child.y;

        if (isSingleChild) {
            const startPoint = calculateIntersectionPoint(node.x, node.y, child.x, child.y, node.x, node.y, NODE_RADIUS);
            const endPoint = calculateIntersectionPoint(node.x, node.y, child.x, child.y, child.x, child.y, NODE_RADIUS);

            if (startPoint && endPoint) {
                x1 = startPoint.x;
                y1 = startPoint.y;
                x2 = endPoint.x;
                y2 = endPoint.y;
            }
        }

        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', x1.toString());
        line.setAttribute('y1', y1.toString());
        line.setAttribute('x2', x2.toString());
        line.setAttribute('y2', y2.toString());
        line.setAttribute('stroke', strokeColor);
        line.setAttribute('stroke-width', '2');
        line.classList.add('tree-line');
        linesGroup.appendChild(line);
    });

    // Draw the node
    const nodeElement = renderNodeElement(node);
    nodeGroup.appendChild(nodeElement);

    // Recursively render children
    node.children.forEach((child) => {
        renderTree(child, nodeGroup, mask);
    });
}

function renderNodeElement(node) {
    const {id, text, x, y} = node;
    const nodeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    nodeGroup.setAttribute('transform', `translate(${x}, ${y})`);
    nodeGroup.dataset.id = id;
    nodeGroup.classList.add('tree-node');

    let nodeColor = treeColor;

    if (node.highlight) {
        nodeColor = node.highlight.type === 'custom' ? node.highlight.color : highlightColors[node.highlight.index];
    }

    let strokeColor = getCurrentBorderColor(nodeColor);
    let strokeSize = document.getElementById('border-thickness').value;

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('r', NODE_RADIUS.toString());
    circle.setAttribute('fill', nodeColor);
    circle.setAttribute('stroke', strokeColor);
    circle.setAttribute('stroke-width', strokeSize);

    let textFill = getContrastColor(nodeColor);

    const textElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    textElement.textContent = text;
    textElement.setAttribute('text-anchor', 'middle');
    textElement.setAttribute('dominant-baseline', 'central');
    textElement.setAttribute('fill', textFill);
    textElement.setAttribute('font-family', 'Arial, sans-serif');
    textElement.setAttribute('font-size', '40px');

    nodeGroup.appendChild(circle);
    nodeGroup.appendChild(textElement);

    nodeGroup.addEventListener('click', (e) => {
        e.stopPropagation();
        updateNodeMenu();
        let multiSelect = e.ctrlKey || e.shiftKey;
        selectNode(node, multiSelect);
    });

    nodeGroup.addEventListener('mouseover', () => {
        nodeGroup.classList.add('hover');
        document.body.style.cursor = 'pointer';
    });

    nodeGroup.addEventListener('mouseout', () => {
        nodeGroup.classList.remove('hover');
        document.body.style.cursor = 'default';
    });

    return nodeGroup;
}

function selectNode(node, multiSelect = false) {
    if (!multiSelect) {
        document.querySelectorAll('.tree-node').forEach(node => {
            node.classList.remove('selected');
        });

        selectedNodesIDs.clear();
    }

    // Add the clicked node to the selected nodes
    selectedNodesIDs.add(node.id);

    // Add 'selected' class to the clicked node
    const nodeGroup = document.querySelector(`.tree-node[data-id="${node.id}"]`);
    nodeGroup.classList.add('selected');

    updateNodeMenu();
}

function removeNodeFromTree(node, id) {
    node.children = node.children.filter(child => {
        if (child.id.toString() === id) {
            return false;
        }
        removeNodeFromTree(child, id);
        return true;
    });
}

function findNodeById(node, id) {
    if (node.id.toString() === id.toString()) {
        return node;
    }
    for (let child of node.children) {
        const found = findNodeById(child, id);
        if (found) return found;
    }
    return null;
}

function updateAllNodesHighlightColor(colorIndex, newColor) {
    const updateNodeColor = (node) => {
        if (node.highlight && node.highlight.type === 'global' && node.highlight.index === colorIndex) {
            node.highlight.color = newColor; // Update the node's highlight color

            const selectedNode = document.querySelector(`.tree-node[data-id="${node.id}"]`);
            selectedNode.querySelector('circle').setAttribute('fill', newColor);
            selectedNode.querySelector('text').setAttribute('fill', getContrastColor(newColor));

            if (document.getElementById('border-same-as-text').checked && !document.getElementById('no-border').checked) {
                selectedNode.querySelector('circle').setAttribute('stroke', getContrastColor(newColor));
            }
        }
        node.children.forEach(updateNodeColor);
    };

    updateNodeColor(treeData);
}

// <------------------------Import/Export Tree------------------------>
function importTree() {
    const fileInput = document.getElementById('import-json');
    const file = fileInput.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            try {
                const importedData = JSON.parse(e.target.result.toString());
                treeData = validateAndTransformTreeData(importedData);
                updateTreeLayout();
                showNotification('Tree imported successfully', 'success');
            } catch (error) {
                showNotification('Error importing tree: ' + error.message, 'error');
            }
        };
        reader.readAsText(file);
    } else {
        showNotification('No file was chosen', 'warning');
    }
}

function validateAndTransformTreeData(data) {
    function processNode(node) {
        if (typeof node !== 'object' || node === null) {
            throw new Error('Invalid node structure');
        }

        const processedNode = {
            id: generateUniqueId(),
            text: node.text || "1",
            x: node.x || 0,
            y: node.y || 0,
            highlight: node.highlight || null,
            children: []
        };

        const childrenArray = node.children || [];
        if (!Array.isArray(childrenArray)) {
            throw new Error('Children must be an array');
        }

        processedNode.children = childrenArray.map(child => processNode(child));

        return processedNode;
    }

    return processNode(data);
}

function exportTree() {
    const format = document.getElementById('export-format').value;
    switch (format) {
        case 'png':
            exportTreeAsPNG();
            break;
        case 'svg':
            exportTreeAsSVG();
            break;
        case 'json':
            exportTreeAsJSON();
            break;
        case 'jpeg':
            exportTreeAsJPEG();
            break;
    }
}

function prepareCanvasForExport(backgroundColor) {
    const svg = document.getElementById('tree-svg');
    const container = document.getElementById('tree-container');
    const scaleFactor = parseFloat(document.getElementById('scale-factor').value);

    // Create a canvas element
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Set canvas size
    canvas.width = container.offsetWidth * scaleFactor;
    canvas.height = container.offsetHeight * scaleFactor;

    // Set background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Convert SVG to data URL
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], {type: 'image/svg+xml;charset=utf-8'});
    return {canvas, ctx, svgBlob};
}

function renderImageOnCanvas(canvas, img, ctx) {
    // Calculate scaling to maintain the aspect ratio
    const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
    const x = (canvas.width / 2) - (img.width / 2) * scale;
    const y = (canvas.height / 2) - (img.height / 2) * scale;

    // Set canvas context properties for better text rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.textRendering = 'geometricPrecision';
    ctx.fontSmooth = 'always';

    // Draw image on canvas
    ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
}

function exportTreeAsPNG() {
    const useTransparentBackground = document.getElementById('container-transparent-background').checked;
    const backgroundColor = useTransparentBackground ? 'transparent' : document.getElementById('container-background-color').value;

    const {canvas, ctx, svgBlob} = prepareCanvasForExport(backgroundColor);
    const DOMURL = window.URL || window.webkitURL || window;
    const url = DOMURL.createObjectURL(svgBlob);

    // Create image from SVG
    const img = new Image();
    img.onload = function () {
        renderImageOnCanvas(canvas, img, ctx);

        // Convert canvas to PNG
        const pngUrl = canvas.toDataURL('image/png');

        // Trigger download
        const downloadLink = document.createElement('a');
        downloadLink.href = pngUrl;
        downloadLink.download = 'tree_visualization.png';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);

        // Clean up
        DOMURL.revokeObjectURL(url);
    };
    img.src = url;
}

function exportTreeAsSVG() {
    const svg = document.getElementById('tree-svg');
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], {type: 'image/svg+xml;charset=utf-8'});
    const url = URL.createObjectURL(svgBlob);

    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = 'tree_visualization.svg';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    URL.revokeObjectURL(url);
}

function exportTreeAsJSON() {
    const jsonData = JSON.stringify(treeData, null, 2);
    const blob = new Blob([jsonData], {type: 'application/json'});
    const url = URL.createObjectURL(blob);

    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = 'tree_data.json';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    URL.revokeObjectURL(url);
}

function exportTreeAsJPEG() {
    const useTransparentBackground = document.getElementById('container-transparent-background').checked;
    const backgroundColor = useTransparentBackground ? 'white' : document.getElementById('container-background-color').value;

    const {canvas, ctx, svgBlob} = prepareCanvasForExport(backgroundColor);
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = function () {
        renderImageOnCanvas(canvas, img, ctx);

        const jpegUrl = canvas.toDataURL('image/jpeg');

        const downloadLink = document.createElement('a');
        downloadLink.href = jpegUrl;
        downloadLink.download = 'tree_visualization.jpg';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);

        URL.revokeObjectURL(url);
    };
    img.src = url;
}