import {clearSelectedNodeIDs, getHighlightColors, getSelectedNodesIDs, getTreeColor, getTreeData} from "./sharedState.js"
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
        clearSelectedNodeIDs()
    }
}

function handleNodeValueInput() {
    let treeData = getTreeData()
    let selectedNodesIDs = getSelectedNodesIDs()

    selectedNodesIDs.forEach(selectedNodeID => {
        const node = findNodeById(treeData, selectedNodeID)
        if (node) {
            node.text = this.value
            const domNode = document.querySelector(`.tree-node[data-id="${selectedNodeID}"]`)
            if (domNode) {
                domNode.querySelector('text').textContent = this.value
            }
            saveState()
        }
    })
}

function handleAddChild() {
    let treeData = getTreeData()
    let selectedNodesIDs = getSelectedNodesIDs()

    if (selectedNodesIDs.size === 1) {
        const nodeId = Array.from(selectedNodesIDs)[0]
        const parentNode = findNodeById(treeData, nodeId)
        if (parentNode) {
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
}

export function handleDeleteNode() {
    let treeData = getTreeData()
    let selectedNodesIDs = getSelectedNodesIDs()
    let count = 0

    selectedNodesIDs.forEach(selectedNodeID => {
        if (selectedNodeID !== treeData.id) {
            const node = findNodeById(treeData, selectedNodeID)
            if (node) {
                removeNodeFromTree(treeData, selectedNodeID.toString())
                count++
            }
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
    selectedNodesIDs.clear()
    toggleNodeMenu(false)
    updateTreeLayout()
}

function handleRemoveHighlight() {
    let treeData = getTreeData()
    let selectedNodesIDs = getSelectedNodesIDs()
    let count = 0
    let treeColor = getTreeColor()

    selectedNodesIDs.forEach(selectedNodeID => {
        const node = findNodeById(treeData, selectedNodeID)
        if (node && node.highlight) {
            node.highlight = null
            const borderColor = getCurrentBorderColor(treeColor)

            const selectedNode = document.querySelector(`.tree-node[data-id="${selectedNodeID}"]`)
            if (selectedNode) {
                selectedNode.querySelector('circle').setAttribute('fill', treeColor)
                selectedNode.querySelector('text').setAttribute('fill', getContrastColor(treeColor))
                selectedNode.querySelector('circle').setAttribute('stroke', borderColor)
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
    let treeData = getTreeData()
    let selectedNodesIDs = getSelectedNodesIDs()

    selectedNodesIDs.forEach(selectedNodeID => {
        const node = findNodeById(treeData, selectedNodeID)
        if (node) {
            applyHighlight(node, {type: 'custom', color: this.value})
            saveState()
        }
    })
}

function setupHighlightButtons() {
    document.querySelectorAll('.highlight-btn').forEach((btn, index) => {
        btn.addEventListener('click', () => {
            let treeData = getTreeData()
            let selectedNodesIDs = getSelectedNodesIDs()

            selectedNodesIDs.forEach(selectedNodeID => {
                const node = findNodeById(treeData, selectedNodeID)
                if (node) {
                    applyHighlight(node, {type: 'global', index: index})
                    saveState()
                }
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
    let selectedNodesIDs = getSelectedNodesIDs()

    selectedCount.textContent = `${selectedNodesIDs.size} selected`

    if (selectedNodesIDs.size === 1) {
        const nodeID = Array.from(selectedNodesIDs)[0]
        const node = findNodeById(treeData, nodeID)
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
        const anyHighlight = Array.from(selectedNodesIDs).some(nodeID => {
            return findNodeById(treeData, nodeID).highlight
        })
        if (anyHighlight) {
            removeHighlightBtn.classList.add('active')
            removeHighlightBtn.classList.remove('inactive')
        } else {
            removeHighlightBtn.classList.add('inactive')
            removeHighlightBtn.classList.remove('active')
        }
    }

    toggleNodeMenu(selectedNodesIDs.size > 0)
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