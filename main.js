let selectedNode = null;
const highlightColors = ['#FF5733', '#33FF57', '#3357FF'];

document.addEventListener('DOMContentLoaded', () => {
    initializeTree();
    setupEventListeners();
    setupNodeMenu();
    setupGlobalColorPickers();
});

// <------------------------UI Controls------------------------>
function setupEventListeners() {
    const exportTreeButton = document.getElementById('export-tree');
    const toggleThemeButton = document.getElementById('toggle-theme');

    exportTreeButton.addEventListener('click', () => {
        console.log('Export tree clicked');
        // Functionality to be implemented later
    });

    toggleThemeButton.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        document.body.classList.toggle('light-mode');
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
            selectedNode.querySelector('text').textContent = nodeValue.value;
        }
    });

    addChildBtn.addEventListener('click', () => {
        console.log('Add child functionality to be implemented');
    });

    deleteNodeBtn.addEventListener('click', () => {
        if (selectedNode && selectedNode.parentNode.childNodes.length > 1) {
            selectedNode.remove();
            hideNodeMenu();
        } else {
            console.log('Cannot delete root node');
        }
    });

    document.querySelectorAll('.highlight-btn').forEach((btn, index) => {
        btn.addEventListener('click', () => {
            if (selectedNode) {
                selectedNode.querySelector('circle').setAttribute('fill', highlightColors[index]);
            }
        });
    });

    removeHighlightBtn.addEventListener('click', () => {
        if (selectedNode) {
            selectedNode.querySelector('circle').setAttribute('fill', '#4CAF50');
        }
    });

    customHighlight.addEventListener('input', () => {
        if (selectedNode) {
            selectedNode.querySelector('circle').setAttribute('fill', customHighlight.value);
        }
    });
}

function showNodeMenu(node) {
    const nodeMenu = document.getElementById('node-menu');
    const nodeValue = document.getElementById('node-value');
    const deleteNodeBtn = document.getElementById('delete-node');

    selectedNode = node;
    nodeValue.value = node.querySelector('text').textContent;

    const rect = node.getBoundingClientRect();
    nodeMenu.style.left = `${rect.right + 10}px`;
    nodeMenu.style.top = `${rect.top}px`;

    nodeMenu.classList.remove('hidden');

    // Disable delete button for root node
    deleteNodeBtn.disabled = node.parentNode.childNodes.length === 1;
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
            document.querySelector(`.highlight-btn:nth-child(${index + 1})`).style.backgroundColor = picker.value;
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

    // Create root node
    const rootNode = createNode('Root', svg.viewBox.baseVal.width / 2, svg.viewBox.baseVal.height / 2);
    svg.appendChild(rootNode);
}

function createNode(text, x, y) {
    const nodeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    nodeGroup.setAttribute('transform', `translate(${x}, ${y})`);

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