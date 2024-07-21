const DEFAULT_CONTAINER_BACKGROUND_COLOR = '#2a2a2a';
const DEFAULT_TREE_COLOR = '#2EA395';
const DEFAULT_BORDER_COLOR = '#ffffff';
const DEFAULT_HIGHLIGHT_COLORS = ['#3FB116', '#C20F0F', '#2175C4'];
const DEFAULT_TREE_DATA = {
    id: Date.now(),
    text: '1',
    x: 0,
    y: 0,
    children: [],
    highlight: null
};
const NODE_RADIUS = 50;
const VERTICAL_SPACING = 150;
const HORIZONTAL_SPACING = 150;
const TOP_MARGIN = 30;
const BOTTOM_MARGIN = 30;
const HORIZONTAL_MARGIN = 30;

let selectedNode = null;
let containerBackgroundColor = DEFAULT_CONTAINER_BACKGROUND_COLOR;
let treeColor = DEFAULT_TREE_COLOR;
let borderColor = DEFAULT_BORDER_COLOR;
let highlightColors = DEFAULT_HIGHLIGHT_COLORS;
let treeData = null;

// <------------------------Initialization------------------------>
document.addEventListener('DOMContentLoaded', () => {
    loadState();
    initializeTree();
    setupEventListeners();
    setupNodeMenu();
    setupGlobalColorPickers();
});

function loadState() {
    const savedBackground = localStorage.getItem('backgroundColor');
    if (savedBackground) {
        containerBackgroundColor = savedBackground;
        document.getElementById('tree-container').style.backgroundColor = containerBackgroundColor;
        if (containerBackgroundColor === 'transparent') {
            document.getElementById('container-transparent-background').checked = true;
        } else {
            document.getElementById('container-background-color').value = containerBackgroundColor;
        }
    }

    const scaleFactor = localStorage.getItem('scaleFactor');
    if (scaleFactor) {
        document.getElementById('scale-factor').value = scaleFactor;
    }

    const savedNodeColor = localStorage.getItem('nodeColor');
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

    const noBorder = localStorage.getItem('noBorder');
    const borderColorSameAsText = localStorage.getItem('borderColorSameAsText');

    const savedBorderColor = localStorage.getItem('borderColor');
    if (savedBorderColor) {
        if (noBorder === 'true') {
            borderColor = 'transparent';
            document.getElementById('border-transparent').checked = true;
            document.getElementById('border-color').value = DEFAULT_BORDER_COLOR;
            document.getElementById('no-node-border').checked = true;
        } else {
            if (borderColorSameAsText === 'true') {
                borderColor = getContrastColor(treeColor);
                document.getElementById(`node-border-same-as-text`).checked = true;
            } else {
                borderColor = savedBorderColor;
                document.getElementById('border-color').value = borderColor;
            }
        }
    }

    const savedHighlightColors = localStorage.getItem('highlightColors');
    if (savedHighlightColors) {
        highlightColors = JSON.parse(savedHighlightColors);
    }

    const savedTreeData = localStorage.getItem('treeData');
    if (savedTreeData) {
        treeData = JSON.parse(savedTreeData);
    }

    updateHighlightButtonColors();
    updateGlobalColorPickers();
}

function saveState() {
    localStorage.setItem('backgroundColor', containerBackgroundColor);
    localStorage.setItem('scaleFactor', document.getElementById('scale-factor').value);
    localStorage.setItem('nodeColor', treeColor);
    localStorage.setItem('borderColor', borderColor);
    localStorage.setItem('noBorder', document.getElementById('no-node-border').checked);
    localStorage.setItem('borderColorSameAsText', document.getElementById('node-border-same-as-text').checked);
    localStorage.setItem('highlightColors', JSON.stringify(highlightColors));
    localStorage.setItem('treeData', JSON.stringify(treeData));
}


// <------------------------UI Controls------------------------>
function setupEventListeners() {
    const scaleFactorInput = document.getElementById('scale-factor');
    const nodeColorPicker = document.getElementById('node-color');
    const nodeTransparentCheckbox = document.getElementById('node-transparent');
    const borderColorPicker = document.getElementById('border-color');
    const noBorderCheckbox = document.getElementById('no-node-border');
    const borderColorSameAsTextCheckbox = document.getElementById('node-border-same-as-text');
    const containerColorPicker = document.getElementById('container-background-color');
    const containerTransparentCheckbox = document.getElementById('container-transparent-background');
    const exportTreeButton = document.getElementById('export-tree');

    scaleFactorInput.addEventListener('input', () => {
        saveState()
        // Full functionality to be implemented later
    });

    containerColorPicker.addEventListener('input', () => {
        if (!containerTransparentCheckbox.checked) {
            containerBackgroundColor = containerColorPicker.value;
            document.getElementById('tree-container').style.backgroundColor = containerBackgroundColor;
            saveState();
        }
    });

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

    nodeColorPicker.addEventListener('input', () => {
        if (!nodeTransparentCheckbox.checked) {
            treeColor = nodeColorPicker.value;
            if (borderColorSameAsTextCheckbox.checked) {
                borderColor = getContrastColor(treeColor);
            }
            initializeTree();
            saveState();
        }
    });

    nodeTransparentCheckbox.addEventListener('change', () => {
        if (nodeTransparentCheckbox.checked) {
            treeColor = 'transparent';
        } else {
            treeColor = nodeColorPicker.value;
        }
        initializeTree();
        saveState();
    });

    borderColorPicker.addEventListener('input', () => {
        if (!noBorderCheckbox.checked && !borderColorSameAsTextCheckbox.checked) {
            borderColor = borderColorPicker.value;
            initializeTree();
            saveState();
        }
    });

    noBorderCheckbox.addEventListener('change', () => {
        if (noBorderCheckbox.checked) {
            borderColor = 'transparent';
        } else {
            if (borderColorSameAsTextCheckbox.checked) {
                borderColor = getContrastColor(treeColor);
            } else {
                borderColor = borderColorPicker.value;
            }
        }
        initializeTree();
        saveState();
    });

    borderColorSameAsTextCheckbox.addEventListener('change', () => {
        if (borderColorSameAsTextCheckbox.checked) {
            if (!noBorderCheckbox.checked) {
                borderColor = getContrastColor(treeColor);
            }
        } else {
            borderColor = borderColorPicker.value;
        }
        initializeTree();
        saveState();
    });

    exportTreeButton.addEventListener('click', exportTreeAsPNG);
    setupResetButtons();
}

function setupResetButtons() {
    const resetColorsBtn = document.getElementById('reset-colors');
    const resetTreeBtn = document.getElementById('reset-tree');
    const resetAllBtn = document.getElementById('reset-all');

    resetColorsBtn.addEventListener('click', () => {
        resetExportColors();
        resetNodeColors();
        highlightColors = [...DEFAULT_HIGHLIGHT_COLORS];
        updateHighlightButtonColors();
        updateGlobalColorPickers();
        updateAllNodesHighlightColor();
        saveState();
        showNotification('Colors reset to default', 'success');
    });

    resetTreeBtn.addEventListener('click', () => {
        treeData = JSON.parse(JSON.stringify(DEFAULT_TREE_DATA));
        treeData.x = document.getElementById('tree-svg').viewBox.baseVal.width / 2;
        treeData.y = document.getElementById('tree-svg').viewBox.baseVal.height / 2;
        initializeTree();
        saveState();
        showNotification('Tree reset to default', 'success');
    });

    resetAllBtn.addEventListener('click', () => {
        resetExportColors();
        document.getElementById('scale-factor').value = 2;
        resetNodeColors();
        highlightColors = [...DEFAULT_HIGHLIGHT_COLORS];
        treeData = JSON.parse(JSON.stringify(DEFAULT_TREE_DATA));
        treeData.x = document.getElementById('tree-svg').viewBox.baseVal.width / 2;
        treeData.y = document.getElementById('tree-svg').viewBox.baseVal.height / 2;
        updateHighlightButtonColors();
        updateGlobalColorPickers();
        initializeTree();
        saveState();
        showNotification('All settings reset to default', 'success');
    });
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
    document.getElementById('no-node-border').checked = false;
    document.getElementById('node-border-same-as-text').checked = true;
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
        if (selectedNode) {
            const nodeId = selectedNode.dataset.id;
            const parentNode = findNodeById(treeData, nodeId);
            if (parentNode) {
                const newChild = {
                    id: Date.now(),
                    text: parentNode.text,
                    x: 0,
                    y: 0,
                    children: [],
                    highlight: null
                }
                parentNode.children.push(newChild);
                updateTreeLayout();
                saveState();
                showNotification('Child node added', 'success');
            }
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

                    // Change text color based on contrast
                    selectedNode.querySelector('text').setAttribute('fill', getContrastColor(highlightColors[index]));
                    saveState();
                }
            }
        });
    });

    customHighlight.addEventListener('input', () => {
        if (selectedNode) {
            const nodeId = selectedNode.dataset.id;
            const node = findNodeById(treeData, nodeId);
            if (node) {
                node.highlight = {type: 'custom', color: customHighlight.value};
                selectedNode.querySelector('circle').setAttribute('fill', customHighlight.value);

                // Change text color based on contrast
                selectedNode.querySelector('text').setAttribute('fill', getContrastColor(customHighlight.value));
                saveState();
            }
        }
    });

    removeHighlightBtn.addEventListener('click', () => {
        if (selectedNode) {
            const nodeId = selectedNode.dataset.id;
            const node = findNodeById(treeData, nodeId);
            if (node) {
                // Check if the node does not have a highlight
                if (!node.highlight) {
                    showNotification('Node does not have a highlight', 'warning');
                    return;
                }

                node.highlight = null;
                selectedNode.querySelector('circle').setAttribute('fill', treeColor);
                selectedNode.querySelector('text').setAttribute('fill', 'white');
                showNotification('Highlight removed', 'success');
                saveState();
            }
        }
    });

    deleteNodeBtn.addEventListener('click', () => {
        if (selectedNode && selectedNode.parentNode.childNodes.length > 1) {
            const nodeId = selectedNode.dataset.id;
            removeNodeFromTree(treeData, nodeId);
            selectedNode.remove();
            hideNodeMenu();
            showNotification('Node deleted', 'success');
            saveState();
        } else {
            showNotification('Cannot delete root node', 'error');
        }
    });
}

function showNodeMenu(node) {
    const nodeMenu = document.getElementById('node-menu');
    const nodeValue = document.getElementById('node-value');
    const customHighlight = document.getElementById('custom-highlight');

    selectedNode = node;
    const nodeId = node.dataset.id;
    const treeNode = findNodeById(treeData, nodeId);

    nodeValue.value = treeNode.text;

    const rect = node.getBoundingClientRect();
    nodeMenu.style.left = `${rect.right + 10}px`;
    nodeMenu.style.top = `${rect.top}px`;

    nodeMenu.classList.remove('hidden');

    if (treeNode.highlight) {
        if (treeNode.highlight.type === 'custom') {
            customHighlight.value = treeNode.highlight.color;
        } else {
            customHighlight.value = '#000000';
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

// <------------------------Tree Operations------------------------>
function calculateSVGDimensions(treeData) {
    let maxDepth = 0;
    let maxWidth = 0;
    let minWidth = 0;

    function traverse(node, depth, horizontalPosition) {
        maxDepth = Math.max(maxDepth, depth);
        maxWidth = Math.max(maxWidth, horizontalPosition);
        minWidth = Math.min(minWidth, horizontalPosition);

        const childrenCount = node.children.length;
        const totalChildrenWidth = (childrenCount - 1) * HORIZONTAL_SPACING;
        const startPosition = horizontalPosition - totalChildrenWidth / 2;

        node.children.forEach((child, index) => {
            const childPosition = startPosition + index * HORIZONTAL_SPACING;
            traverse(child, depth + 1, childPosition);
        });
    }

    traverse(treeData, 0, 0);

    // Calculate the width of the tree
    maxWidth = Math.max(Math.abs(minWidth), maxWidth);

    const width = maxWidth * 2 + NODE_RADIUS * 2 + HORIZONTAL_MARGIN * 2;
    const height = (maxDepth + 1) * NODE_RADIUS * 2 + TOP_MARGIN + BOTTOM_MARGIN + maxDepth * VERTICAL_SPACING / 2;

    return {width, height};
}

function initializeTree() {
    const svg = document.getElementById('tree-svg');
    const container = document.getElementById('tree-container');

    // Update viewBox on window resize
    window.addEventListener('resize', updateSVGViewBox);

    if (!treeData) {
        treeData = {
            id: Date.now(),
            text: '1',
            x: 0,
            y: 0,
            children: [],
            highlight: null
        };
    }

    updateSVGViewBox(svg, container);
    saveState();
}

function updateTreeLayout() {
    const svg = document.getElementById('tree-svg');
    const container = document.getElementById('tree-container');

    updateSVGViewBox(svg, container);
}

function updateSVGViewBox(svg, container) {
    const dimensions = calculateSVGDimensions(treeData);
    svg.setAttribute('width', dimensions.width);
    svg.setAttribute('height', dimensions.height);
    svg.setAttribute('viewBox', `0 0 ${dimensions.width} ${dimensions.height}`);

    const containerWidth = Math.min(dimensions.width, window.innerWidth * 0.8);
    container.style.width = `${containerWidth}px`;

    const containerHeight = container.clientHeight;
    const leftOffset = Math.max(0, (containerWidth - dimensions.width) / 2);
    const topOffset = Math.max(0, (containerHeight - dimensions.height) / 2);
    svg.style.marginLeft = `${leftOffset}px`;
    svg.style.marginTop = `${topOffset}px`;

    treeData.x = dimensions.width / 2;
    treeData.y = TOP_MARGIN + NODE_RADIUS;

    // Update root node position
    treeData.x = dimensions.width / 2;
    treeData.y = TOP_MARGIN + NODE_RADIUS;

    // Update all node positions
    updateNodePositions(treeData, treeData.x, treeData.y, 0);

    // Clear existing tree
    svg.innerHTML = '';

    // Create and add the mask
    const mask = createSVGMask(svg);

    // Render the tree with the mask
    renderTree(treeData, svg, mask);
}

function updateNodePositions(node, x, y, depth) {
    node.x = x;
    node.y = y;

    if (node.children.length > 0) {
        const childrenWidth = (node.children.length - 1) * HORIZONTAL_SPACING;
        let startX = x - childrenWidth / 2;

        node.children.forEach((child, index) => {
            const childX = startX + index * HORIZONTAL_SPACING;
            const childY = y + VERTICAL_SPACING;
            updateNodePositions(child, childX, childY, depth + 1);
        });
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

    let lineColor = borderColor === 'transparent' ? document.getElementById('border-color').value : borderColor;

    node.children.forEach((child) => {
        let x1 = node.x, y1 = node.y, x2 = child.x, y2 = child.y;

        const isSingleChild = node.children.length === 1;

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
        line.setAttribute('stroke', lineColor);
        line.setAttribute('stroke-width', '2');
        linesGroup.appendChild(line);
    });

    // Draw the node
    const nodeElement = createNode(node.text, node.x, node.y, node.id);
    let color = treeColor;
    if (node.highlight) {
        color = node.highlight.type === 'custom' ? node.highlight.color : highlightColors[node.highlight.index];
    }
    nodeElement.querySelector('circle').setAttribute('fill', color);
    nodeElement.querySelector('text').setAttribute('fill', getContrastColor(color));
    nodeElement.querySelector('text').setAttribute('font-size', '40px');

    nodeGroup.appendChild(nodeElement);

    // Recursively render children
    node.children.forEach((child) => {
        renderTree(child, nodeGroup, mask);
    });
}

function createNode(text, x, y, id) {
    const nodeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    nodeGroup.setAttribute('transform', `translate(${x}, ${y})`);
    nodeGroup.dataset.id = id;

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('r', NODE_RADIUS.toString());
    circle.setAttribute('fill', treeColor);
    circle.setAttribute('stroke', borderColor);
    circle.setAttribute('stroke-width', '2.5');

    const textElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    textElement.textContent = text;
    textElement.setAttribute('text-anchor', 'middle');
    textElement.setAttribute('dominant-baseline', 'central');
    textElement.setAttribute('fill', 'white');
    textElement.setAttribute('font-family', 'Arial, sans-serif');
    textElement.setAttribute('font-size', '40px');

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

function updateAllNodesHighlightColor(colorIndex, newColor) {
    const updateNodeColor = (node) => {
        if (node.highlight && node.highlight.type === 'global' && node.highlight.index === colorIndex) {
            node.highlight.color = newColor; // Update the node's highlight color
        }
        node.children.forEach(updateNodeColor);
    };

    if (treeData) {
        updateNodeColor(treeData);
        const svg = document.getElementById('tree-svg');
        svg.innerHTML = ''; // Clear existing tree
        const mask = createSVGMask(svg);
        renderTree(treeData, svg, mask);
    }
}

// <------------------------Export Tree------------------------>

function exportTreeAsPNG() {
    const svg = document.getElementById('tree-svg');
    const container = document.getElementById('tree-container');
    const scaleFactor = parseFloat(document.getElementById('scale-factor').value);
    const useTransparentBackground = document.getElementById('container-transparent-background').checked;
    const backgroundColor = useTransparentBackground ? 'transparent' : document.getElementById('container-background-color').value;

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
    const DOMURL = window.URL || window.webkitURL || window;
    const url = DOMURL.createObjectURL(svgBlob);

    // Create image from SVG
    const img = new Image();
    img.onload = function () {
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