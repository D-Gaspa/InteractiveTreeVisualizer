import {clearSelectedNodes, getHighlightColors, getSelectedNodes, getTreeColor, getTreeData} from "./sharedState.js"
import {findNodeById, generateUniqueId, removeNodeFromTree, updateTreeLayout} from "./treeOperations.js"
import {DEFAULT_CUSTOM_HIGHLIGHT_COLOR} from "./constants.js"
import {saveState} from "./stateManagement.js"
import {getContrastColor, getCurrentBorderColor} from "./utils.js"
import {showNotification} from "./uiControls.js"

export function setupNodeMenu() {
    const nodeValue = document.getElementById('node-value')
    const addChildBtn = document.getElementById('add-child')
    const customHighlight = document.getElementById('custom-highlight')
    const removeHighlightBtn = document.getElementById('remove-highlight')
    const deleteNodeBtn = document.getElementById('delete-node')

    document.addEventListener('click', handleDocumentClick)
    nodeValue.addEventListener('input', handleNodeValueInput)
    addChildBtn.addEventListener('click', handleAddChild)
    removeHighlightBtn.addEventListener('click', handleRemoveHighlight)
    customHighlight.addEventListener('input', handleCustomHighlight)
    deleteNodeBtn.addEventListener('click', handleDeleteNode)

    setupHighlightButtons()
}

function handleDocumentClick(e) {
    const nodeMenu = document.getElementById('node-menu')
    if (!nodeMenu.contains(e.target) && e.target.tagName !== 'circle') {
        toggleNodeMenu(false)
        document.querySelectorAll('.tree-node').forEach(node => {
            node.classList.remove('selected')
        })
        clearSelectedNodes()
    }
}

function handleNodeValueInput() {
    let selectedNodes = getSelectedNodes()

    selectedNodes.forEach(selectedNode => {
        selectedNode.text = this.value
        const domNode = document.querySelector(`.tree-node[data-id="${selectedNode.id}"]`)
        if (domNode) {
            domNode.querySelector('text').textContent = this.value
        }
        saveState()
    })
}

function handleAddChild() {
    let selectedNodes = getSelectedNodes()

    if (selectedNodes.size === 1) {
        const parentNode = Array.from(selectedNodes)[0]
        let id = generateUniqueId()
        const newChild = {
            id: id,
            text: parentNode.text,
            x: 0,
            y: 0,
            children: [],
            highlight: null
        }
        parentNode.children.push(newChild)
        updateTreeLayout()
        showNotification('Child node added', 'success')
    }
}

export function handleDeleteNode() {
    let treeData = getTreeData()
    let selectedNodes = getSelectedNodes()
    let count = 0

    selectedNodes.forEach(selectedNode => {
        if (selectedNode.id !== treeData.id) {
            removeNodeFromTree(treeData, selectedNode.id.toString())
            count++
        } else {
            showNotification('Cannot delete the root node', 'warning')
        }
    })

    if (count > 0) {
        if (count === 1) {
            showNotification('Node deleted', 'success')
        } else {
            showNotification(`Nodes deleted`, 'success')
        }
    }

    // Clear selected nodes and hide the node menu
    clearSelectedNodes()
    toggleNodeMenu(false)
    updateTreeLayout()
}

function handleRemoveHighlight() {
    let selectedNodes = getSelectedNodes()
    let count = 0
    let treeColor = getTreeColor()

    selectedNodes.forEach(selectedNode => {
        if (selectedNode.highlight) {
            selectedNode.highlight = null
            const borderColor = getCurrentBorderColor(treeColor)

            const domNode = document.querySelector(`.tree-node[data-id="${selectedNode.id}"]`)
            if (domNode) {
                domNode.querySelector('circle').setAttribute('fill', treeColor)
                domNode.querySelector('text').setAttribute('fill', getContrastColor(treeColor))
                domNode.querySelector('circle').setAttribute('stroke', borderColor)
            }
            count++
        }
    })

    if (count > 0) {
        if (count === 1) {
            showNotification('Highlight removed', 'success')
        } else {
            showNotification(`${count} highlights removed`, 'success')
        }
        saveState()
    } else {
        showNotification('No highlights to remove', 'warning')
    }

    updateNodeMenu()
}

function handleCustomHighlight() {
    let selectedNodes = getSelectedNodes()

    selectedNodes.forEach(selectedNode => {
        applyHighlight(selectedNode, {type: 'custom', color: this.value})
        saveState()
    })
}

function setupHighlightButtons() {
    document.querySelectorAll('.highlight-btn').forEach((btn, index) => {
        btn.addEventListener('click', () => {
            let selectedNodesIDs = getSelectedNodes()

            selectedNodesIDs.forEach(selectedNode => {
                applyHighlight(selectedNode, {type: 'global', index: index})
                saveState()
            })
        })
    })
}

function applyHighlight(node, highlight) {
    let highlightColors = getHighlightColors()

    node.highlight = highlight
    const color = highlight.type === 'custom' ? highlight.color : highlightColors[highlight.index]

    const selectedNode = document.querySelector(`.tree-node[data-id="${node.id}"]`)
    selectedNode.querySelector('circle').setAttribute('fill', color)
    selectedNode.querySelector('text').setAttribute('fill', getContrastColor(color))

    if (document.getElementById('border-same-as-text').checked && !document.getElementById('no-border').checked) {
        selectedNode.querySelector('circle').setAttribute('stroke', getContrastColor(color))
    }

    updateNodeMenu()
}

export function updateNodeMenu() {
    const selectedCount = document.getElementById('selected-count')
    const addChildBtn = document.getElementById('add-child')
    const nodeValueInput = document.getElementById('node-value')
    const nodeIdSpan = document.getElementById('node-id')
    const customHighlightInput = document.getElementById('custom-highlight')
    const removeHighlightBtn = document.getElementById('remove-highlight')
    const deleteNodeBtn = document.getElementById('delete-node')
    let treeData = getTreeData()
    let selectedNodes = getSelectedNodes()

    selectedCount.textContent = `${selectedNodes.size} selected`

    if (selectedNodes.size === 1) {
        const node = Array.from(selectedNodes)[0]
        nodeValueInput.previousElementSibling.textContent = 'Node Value:'
        nodeValueInput.value = node.text
        nodeValueInput.placeholder = 'Enter node value'
        nodeValueInput.disabled = false
        nodeIdSpan.previousElementSibling.textContent = 'Node ID:'
        nodeIdSpan.textContent = node.id
        addChildBtn.style.display = 'block'
        removeHighlightBtn.textContent = 'Remove Highlight'
        deleteNodeBtn.textContent = 'Delete Node'

        // Set custom highlight color
        if (node.highlight && node.highlight.type === 'custom') {
            customHighlightInput.value = node.highlight.color
        } else {
            customHighlightInput.value = DEFAULT_CUSTOM_HIGHLIGHT_COLOR
        }

        // Set remove highlight button state
        if (node.highlight) {
            removeHighlightBtn.classList.add('active')
            removeHighlightBtn.classList.remove('inactive')
        } else {
            removeHighlightBtn.classList.add('inactive')
            removeHighlightBtn.classList.remove('active')
        }
    } else {
        nodeValueInput.previousElementSibling.textContent = 'Node Values:'
        nodeValueInput.value = ''
        nodeValueInput.placeholder = 'Enter node values'
        nodeIdSpan.previousElementSibling.textContent = 'Node IDs:'
        nodeIdSpan.textContent = 'Multiple'
        addChildBtn.style.display = 'none'
        removeHighlightBtn.textContent = 'Remove Highlights'
        deleteNodeBtn.textContent = 'Delete Nodes'

        // Check if any selected node has a highlight
        const anyHighlight = Array.from(selectedNodes).some(node => {
            return findNodeById(treeData, node.id).highlight
        })
        if (anyHighlight) {
            removeHighlightBtn.classList.add('active')
            removeHighlightBtn.classList.remove('inactive')
        } else {
            removeHighlightBtn.classList.add('inactive')
            removeHighlightBtn.classList.remove('active')
        }
    }

    toggleNodeMenu(selectedNodes.size > 0)
}

export function toggleNodeMenu(show) {
    const nodeMenu = document.getElementById('node-menu')
    if (show) {
        nodeMenu.classList.remove('hidden')
        setTimeout(() => nodeMenu.classList.add('visible'), 10)
    } else {
        nodeMenu.classList.remove('visible')
        setTimeout(() => nodeMenu.classList.add('hidden'), 300)
    }
}