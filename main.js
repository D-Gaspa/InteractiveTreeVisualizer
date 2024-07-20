let selectedNode = null;
let highlightColors = ['#1AD1B2', '#EA6C6C', '#2175C4'];
let treeData = null;

document.addEventListener('DOMContentLoaded', () => {
    loadState();
    initializeTree();
    setupEventListeners();
    setupNodeMenu();
    setupGlobalColorPickers();
});

function loadState() {
    const savedColors = localStorage.getItem('highlightColors');
    if (savedColors) {
        highlightColors = JSON.parse(savedColors);
    }

    const savedTreeData = localStorage.getItem('treeData');
    if (savedTreeData) {
        treeData = JSON.parse(savedTreeData);
    }

    updateHighlightButtonColors();
    updateGlobalColorPickers();
}

function saveState() {
    localStorage.setItem('highlightColors', JSON.stringify(highlightColors));
    localStorage.setItem('treeData', JSON.stringify(treeData));
}


// <------------------------UI Controls------------------------>
function setupEventListeners() {
    const exportTreeButton = document.getElementById('export-tree');

    exportTreeButton.addEventListener('click', () => {
        console.log('Export tree clicked');
        // Functionality to be implemented later
    });
}

function updateHighlightButtonColors() {
    document.querySelectorAll('.highlight-btn').forEach((btn, index) => {
        btn.style.backgroundColor = highlightColors[index];
        btn.style.color = getContrastColor(highlightColors[index]);
    });
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

function updateGlobalColorPickers() {
    document.querySelectorAll('#global-color-pickers input').forEach((picker, index) => {
        picker.value = highlightColors[index];
    });
}

function setupNodeMenu() {
    const nodeMenu = document.getElementById('node-menu');
    const nodeValue = document.getElementById('node-value');
    const addChildBtn = document.getElementById('add-child');
    const deleteNodeBtn = document.getElementById('delete-node');
    const removeHighlightBtn = document.getElementById('remove-highlight');
    const customHighlight = document.getElementById('custom-highlight');

    document.addEventListener('click', (e) => {
        if (!nodeMenu.contains(e.target) && e.target.tagName !== 'circle') {
            hideNodeMenu();
        }
    });

    nodeValue.addEventListener('input', () => {
        if (selectedNode) {
            const nodeId = selectedNode.dataset.id;
            const node = findNodeById(treeData, nodeId);
            if (node) {
                node.text = nodeValue.value;
                selectedNode.querySelector('text').textContent = nodeValue.value;
                saveState();
            }
        }
    });

    addChildBtn.addEventListener('click', () => {
        console.log('Add child functionality to be implemented');
    });

    deleteNodeBtn.addEventListener('click', () => {
        if (selectedNode && selectedNode.parentNode.childNodes.length > 1) {
            const nodeId = selectedNode.dataset.id;
            removeNodeFromTree(treeData, nodeId);
            selectedNode.remove();
            hideNodeMenu();
            saveState();
        } else {
            console.log('Cannot delete root node');
        }
    });

    document.querySelectorAll('.highlight-btn').forEach((btn, index) => {
        btn.addEventListener('click', () => {
            if (selectedNode) {
                const nodeId = selectedNode.dataset.id;
                const node = findNodeById(treeData, nodeId);
                if (node) {
                    node.highlight = {type: 'global', index: index};
                    selectedNode.querySelector('circle').setAttribute('fill', highlightColors[index]);
                    saveState();
                }
            }
        });
    });

    removeHighlightBtn.addEventListener('click', () => {
        if (selectedNode) {
            const nodeId = selectedNode.dataset.id;
            const node = findNodeById(treeData, nodeId);
            if (node) {
                node.highlight = null;
                selectedNode.querySelector('circle').setAttribute('fill', '#4CAF50');
                saveState();
            }
        }
    });

    customHighlight.addEventListener('input', () => {
        if (selectedNode) {
            const nodeId = selectedNode.dataset.id;
            const node = findNodeById(treeData, nodeId);
            if (node) {
                node.highlight = {type: 'custom', color: customHighlight.value};
                selectedNode.querySelector('circle').setAttribute('fill', customHighlight.value);
                saveState();
            }
        }
    });
}

function showNodeMenu(node) {
    const nodeMenu = document.getElementById('node-menu');
    const nodeValue = document.getElementById('node-value');
    const deleteNodeBtn = document.getElementById('delete-node');
    const customHighlight = document.getElementById('custom-highlight');

    selectedNode = node;
    const nodeId = node.dataset.id;
    const treeNode = findNodeById(treeData, nodeId);

    nodeValue.value = treeNode.text;

    const rect = node.getBoundingClientRect();
    nodeMenu.style.left = `${rect.right + 10}px`;
    nodeMenu.style.top = `${rect.top}px`;

    nodeMenu.classList.remove('hidden');

    // Disable delete button for root node
    deleteNodeBtn.disabled = !treeNode.parent;

    if (treeNode.highlight) {
        if (treeNode.highlight.type === 'custom') {
            customHighlight.value = treeNode.highlight.color;
        } else {
            customHighlight.value = highlightColors[treeNode.highlight.index];
        }
    } else {
        customHighlight.value = '#000000';
    }
}

function hideNodeMenu() {
    const nodeMenu = document.getElementById('node-menu');
    nodeMenu.classList.add('hidden');
    selectedNode = null;
}

function setupGlobalColorPickers() {
    const colorPickers = document.querySelectorAll('#global-color-pickers input');
    colorPickers.forEach((picker, index) => {
        picker.addEventListener('input', () => {
            highlightColors[index] = picker.value;
            updateHighlightButtonColors();
            saveState();
        });
    });
}

// <------------------------Tree Operations------------------------>
function initializeTree() {
    const svg = document.getElementById('tree-svg');
    const container = document.getElementById('tree-container');

    // Set SVG viewBox to match container size
    function updateSVGViewBox() {
        const {width, height} = container.getBoundingClientRect();
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    }

    // Update viewBox on window resize
    window.addEventListener('resize', updateSVGViewBox);
    updateSVGViewBox();

    if (treeData) {
        renderTree(treeData, svg);
    } else {
        treeData = {
            id: Date.now(),
            text: 'Root',
            x: svg.viewBox.baseVal.width / 2,
            y: svg.viewBox.baseVal.height / 2,
            children: [],
            highlight: null
        };
        renderTree(treeData, svg);
    }

    saveState();
}

function renderTree(node, parentElement) {
    const nodeElement = createNode(node.text, node.x, node.y, node.id);
    if (node.highlight) {
        const color = node.highlight.type === 'custom' ? node.highlight.color : highlightColors[node.highlight.index];
        nodeElement.querySelector('circle').setAttribute('fill', color);
    }
    parentElement.appendChild(nodeElement);

    node.children.forEach(child => {
        renderTree(child, parentElement);
    });
}

function createNode(text, x, y, id) {
    const nodeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    nodeGroup.setAttribute('transform', `translate(${x}, ${y})`);
    nodeGroup.dataset.id = id;

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('r', '30');
    circle.setAttribute('fill', '#4CAF50');

    const textElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    textElement.textContent = text;
    textElement.setAttribute('text-anchor', 'middle');
    textElement.setAttribute('dominant-baseline', 'central');
    textElement.setAttribute('fill', 'white');

    nodeGroup.appendChild(circle);
    nodeGroup.appendChild(textElement);

    nodeGroup.addEventListener('click', (e) => {
        e.stopPropagation();
        showNodeMenu(nodeGroup);
    });

    return nodeGroup;
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
    if (node.id.toString() === id) {
        return node;
    }
    for (let child of node.children) {
        const found = findNodeById(child, id);
        if (found) return found;
    }
    return null;
}