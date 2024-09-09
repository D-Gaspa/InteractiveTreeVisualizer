import {showNotification} from "./uiControls.js"
import {DEFAULT_TREE_DATA} from "./constants.js"
import {getContrastColor, getCurrentBorderColor, getCurrentLineColor} from "./utils.js"
import {
    addSelectedNode,
    clearSelectedNodes,
    getAndIncrementNodeIDCounter,
    getHighlightColors,
    getSelectedNodes,
    getTreeColor,
    getTreeData,
    setNodeIDCounter,
    setTreeData
} from "./sharedState.js"
import {saveState} from "./stateManagement.js"
import {updateNodeMenu} from "./nodeMenu.js"

const NODE_RADIUS = 50
const VERTICAL_SPACING = 150
const HORIZONTAL_SPACING = 150
const VERTICAL_MARGIN = 50
const HORIZONTAL_MARGIN = 50
const MAX_COLLISION_ITERATIONS = 50

let nodesByDepth = {}

export function initializeTreeData() {
    setTreeData(DEFAULT_TREE_DATA)
    setNodeIDCounter(0)
    nodesByDepth = {}
}

export function updateTreeLayout() {
    let treeData = getTreeData()

    if (!treeData) {
        initializeTreeData()
    }

    updateSVGViewBox()

    // Reapply selected node (if any)
    reapplySelection()

    saveState()
}

function reapplySelection() {
    let selectedNodes = getSelectedNodes()
    if (selectedNodes.size > 0) {
        selectedNodes.forEach(selectedNode => {
            let treeData = getTreeData()
            let node = findNodeById(treeData, selectedNode.id)
            if (node) {
                selectNode(node, true)
            }
        })
    }
}

export function updateSVGViewBox() {
    // Reset nodesByDepth for each update
    nodesByDepth = {}

    let treeData = getTreeData()

    const svg = document.getElementById('tree-svg')
    const container = document.getElementById('tree-container')

    // Start with the root node in the center
    const initialX = 0
    const initialY = VERTICAL_MARGIN + NODE_RADIUS

    updateNodePositions(treeData, initialX, initialY, 0)

    for (let depth in nodesByDepth) {
        resolveCollisionsAtDepth(nodesByDepth[depth], depth)
    }

    // Calculate actual dimensions based on node positions
    const {width, height, leftmostPosition, rightmostPosition} = calculateSVGDimensions(treeData)

    svg.setAttribute('width', width.toString())
    svg.setAttribute('height', height.toString())
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`)

    const containerWidth = Math.min(width, window.innerWidth * 0.8)
    container.style.width = `${containerWidth}px`

    // Calculate the horizontal offset to center the entire tree
    const horizontalOffset = (width - (rightmostPosition - leftmostPosition)) / 2 - leftmostPosition

    function applyOffset(node) {
        node.x += horizontalOffset
        node.children.forEach(applyOffset)
    }

    applyOffset(treeData)

    svg.innerHTML = ''

    const mask = createSVGMask(svg)

    renderTree(treeData, svg, mask)
}

function updateNodePositions(node, x, y, depth) {
    node.x = x
    node.y = y

    if (!nodesByDepth[depth]) {
        nodesByDepth[depth] = []
    }

    if (!nodesByDepth[depth].includes(node)) {
        nodesByDepth[depth].push(node)
    }

    if (node.children.length > 0) {
        positionChildNodes(node, depth + 1)
    }
}

function positionChildNodes(parentNode, childDepth) {
    const childrenCount = parentNode.children.length
    const totalWidth = (childrenCount - 1) * HORIZONTAL_SPACING
    let startX = parentNode.x - totalWidth / 2

    parentNode.children.forEach((child, index) => {
        const childX = startX + index * HORIZONTAL_SPACING
        const childY = parentNode.y + VERTICAL_SPACING
        updateNodePositions(child, childX, childY, childDepth)
    })
}

function positionImmediateChildNodes(parentNode) {
    const childrenCount = parentNode.children.length
    const totalWidth = (childrenCount - 1) * HORIZONTAL_SPACING
    let startX = parentNode.x - totalWidth / 2

    parentNode.children.forEach((child, index) => {
        const childX = startX + index * HORIZONTAL_SPACING
        const childY = parentNode.y + VERTICAL_SPACING
        child.x = childX
        child.y = childY
    })
}

function resolveCollisionsAtDepth(nodes, depth) {
    if (!nodes || nodes.length <= 1) return

    let originalNodes = [...nodes]
    originalNodes.sort((a, b) => a.x - b.x)

    let sortedParentGroups = groupNodesByParentAndSort(originalNodes)

    let involvedParents = getFirstCollisionGroupParents(sortedParentGroups)

    if (involvedParents.length < 1) {
        return
    }

    involvedParents.sort((a, b) => a.x - b.x)

    let iteration = 0
    while (iteration < MAX_COLLISION_ITERATIONS) {
        resolveChildCollisions(involvedParents)

        // Check if there are still collisions
        let updatedInvolvedParents = getFirstCollisionGroupParents(sortedParentGroups)

        if (updatedInvolvedParents.length < 1) {
            // If no collisions were found, we're done
            break
        }

        // If there are, check which parents were not in the previous group
        let newParents = updatedInvolvedParents.filter(parent => !involvedParents.includes(parent))

        involvedParents.push(...newParents)

        involvedParents.sort((a, b) => a.x - b.x)

        iteration++
    }

    if (iteration === MAX_COLLISION_ITERATIONS) {
        showNotification(`Could not resolve all collisions, some nodes may overlap at depth ${depth}`, 'warning')
    }
}

function groupNodesByParentAndSort(nodes) {
    let nodesByParent = {}
    let parents = new Set()
    let treeData = getTreeData()

    // Group nodes by their parent's ID
    nodes.forEach(node => {
        let parent = findParentNode(node)
        let parentID = parent ? parent.id : treeData.id
        if (!nodesByParent[parentID]) {
            nodesByParent[parentID] = []
            parents.add(parentID)
        }
        nodesByParent[parentID].push(node)
    })

    Object.values(nodesByParent).forEach(group => {
        group.sort((a, b) => a.x - b.x)
    })

    // Create an array of parent-children pairs, sorted by parent's x position
    return Array.from(parents)
        .map(parentID => {
            let parentNode = findNodeById(treeData, parentID)
            return {
                parent: parentNode,
                children: nodesByParent[parentID]
            }
        })
        .sort((a, b) => a.parent.x - b.parent.x)
}

function getFirstCollisionGroupParents(sortedParentGroups) {
    let involvedParents = new Set()

    // Check for collisions between nodes of different parents
    for (let i = 0; i < sortedParentGroups.length; i++) {
        let currentGroup = sortedParentGroups[i]
        let currentParent = currentGroup.parent
        let currentParentNodes = currentGroup.children
        involvedParents.add(currentParent)

        for (let j = i + 1; j < sortedParentGroups.length; j++) {
            let nextGroup = sortedParentGroups[j]
            let nextParent = nextGroup.parent
            let nextParentNodes = nextGroup.children

            // Check if the rightmost node of the current parent collides with the leftmost node of the next parent
            if (nextParentNodes[0].x - currentParentNodes[currentParentNodes.length - 1].x < HORIZONTAL_SPACING) {
                involvedParents.add(nextParent)
            } else {
                // If we found at least one collision, return the involved parents
                if (involvedParents.size > 1) {
                    return Array.from(involvedParents)
                }
                // If no collision, reset and move to the next parent
                involvedParents = new Set()
                break
            }
        }

        // If we have a group at the end, return the involved parents
        if (involvedParents.size > 1) {
            return Array.from(involvedParents)
        }
    }

    // If no collisions were found, return an empty array
    return []
}

function resolveChildCollisions(parents) {
    let uniqueParents = [...new Set(parents)]

    let totalChildren = uniqueParents.reduce((sum, parent) => sum + parent.children.length, 0)
    let totalWidth = (totalChildren - 1) * HORIZONTAL_SPACING

    let leftmostParent = uniqueParents.reduce((left, parent) => parent.x < left.x ? parent : left)
    let rightmostParent = uniqueParents.reduce((right, parent) => parent.x > right.x ? parent : right)

    let startX = (leftmostParent.x + rightmostParent.x) / 2 - totalWidth / 2

    let allChildren = []

    function sortChildrenByXPosition(parent) {
        parent.children.sort((a, b) => a.x - b.x)
        allChildren.push(...parent.children)
    }

    uniqueParents.sort((a, b) => a.x - b.x)
    uniqueParents.forEach(parent => sortChildrenByXPosition(parent))

    allChildren.forEach((child, index) => {
        child.x = startX + index * HORIZONTAL_SPACING
        updateSubtreePositions(child)
    })
}

function updateSubtreePositions(node) {
    if (node.children.length > 0) {
        positionImmediateChildNodes(node)
        node.children.forEach(updateSubtreePositions)
    }
}

function calculateSVGDimensions(node) {
    let minX = Infinity, maxX = -Infinity, maxY = -Infinity

    function traverse(node) {
        minX = Math.min(minX, node.x)
        maxX = Math.max(maxX, node.x)
        maxY = Math.max(maxY, node.y)

        node.children.forEach(traverse)
    }

    traverse(node)

    // Width:
    // (maxX - minX) = Distance from the centers of the leftmost node to the rightmost node
    // NODE_RADIUS * 2 = Account for the left radius of the leftmost node and right radius of the rightmost node
    // HORIZONTAL_MARGIN * 2 = Account for the margin on both sides
    const width = maxX - minX + NODE_RADIUS * 2 + HORIZONTAL_MARGIN * 2

    // Height:
    // maxY = Distance from the center of the bottommost node to the beginning of the screen
    //        since the starting root position accounts for the top margin and the top radius of the root node
    // NODE_RADIUS = Account for the bottom radius of the topmost node
    // VERTICAL_MARGIN = Account for the bottom margin
    const height = maxY + NODE_RADIUS + VERTICAL_MARGIN

    return {width, height, leftmostPosition: minX, rightmostPosition: maxX}
}

function createSVGMask(svg) {
    const mask = document.createElementNS('http://www.w3.org/2000/svg', 'mask')
    mask.setAttribute('id', 'nodeMask')

    const maskRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
    maskRect.setAttribute('x', '0')
    maskRect.setAttribute('y', '0')
    maskRect.setAttribute('width', '100%')
    maskRect.setAttribute('height', '100%')
    maskRect.setAttribute('fill', 'white')
    mask.appendChild(maskRect)

    svg.appendChild(mask)
    return mask
}

function addNodeToMask(mask, x, y, radius) {
    const maskCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
    maskCircle.setAttribute('cx', x.toString())
    maskCircle.setAttribute('cy', y.toString())
    maskCircle.setAttribute('r', radius.toString())
    maskCircle.setAttribute('fill', 'black')
    mask.appendChild(maskCircle)
}

function renderTree(node, parentElement, mask) {
    const nodeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    parentElement.appendChild(nodeGroup)

    addNodeToMask(mask, node.x, node.y, NODE_RADIUS)

    // Render lines first so that nodes are on top
    const linesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    const isSingleChild = node.children.length === 1
    if (!isSingleChild) {
        linesGroup.setAttribute('mask', 'url(#nodeMask)')
    }
    nodeGroup.appendChild(linesGroup)

    let strokeColor = getCurrentLineColor()

    node.children.forEach((child) => {
        let x1 = node.x, y1 = node.y, x2 = child.x, y2 = child.y

        if (isSingleChild) {
            const startPoint = calculateIntersectionPoint(node.x, node.y, child.x, child.y, node.x, node.y, NODE_RADIUS)
            const endPoint = calculateIntersectionPoint(node.x, node.y, child.x, child.y, child.x, child.y, NODE_RADIUS)

            if (startPoint && endPoint) {
                x1 = startPoint.x
                y1 = startPoint.y
                x2 = endPoint.x
                y2 = endPoint.y
            }
        }

        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
        line.setAttribute('x1', x1.toString())
        line.setAttribute('y1', y1.toString())
        line.setAttribute('x2', x2.toString())
        line.setAttribute('y2', y2.toString())
        line.setAttribute('stroke', strokeColor)
        line.setAttribute('stroke-width', '2')
        line.classList.add('tree-line')
        linesGroup.appendChild(line)
    })

    const nodeElement = renderNodeElement(node)
    nodeGroup.appendChild(nodeElement)

    node.children.forEach((child) => {
        renderTree(child, nodeGroup, mask)
    })
}

function calculateIntersectionPoint(x1, y1, x2, y2, cx, cy, r) {
    const dx = x2 - x1
    const dy = y2 - y1
    const a = dx * dx + dy * dy
    const b = 2 * (dx * (x1 - cx) + dy * (y1 - cy))
    const c = (x1 - cx) * (x1 - cx) + (y1 - cy) * (y1 - cy) - r * r
    const discriminant = b * b - 4 * a * c

    if (discriminant < 0) {
        return null
    }

    const t1 = (-b + Math.sqrt(discriminant)) / (2 * a)
    const t2 = (-b - Math.sqrt(discriminant)) / (2 * a)
    const t = 0 <= t1 && t1 <= 1 ? t1 : (0 <= t2 && t2 <= 1 ? t2 : null)

    if (t === null) {
        return null
    }

    return {x: x1 + t * dx, y: y1 + t * dy}
}

function renderNodeElement(node) {
    const {id, text, x, y} = node
    const nodeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    nodeGroup.setAttribute('transform', `translate(${x}, ${y})`)
    nodeGroup.dataset.id = id
    nodeGroup.classList.add('tree-node')

    let nodeColor = getTreeColor()

    if (node.highlight) {
        let highlightColors = getHighlightColors()
        nodeColor = node.highlight.type === 'custom' ? node.highlight.color : highlightColors[node.highlight.index]
    }

    let strokeColor = getCurrentBorderColor(nodeColor)
    let strokeSize = document.getElementById('border-thickness').value

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
    circle.setAttribute('r', NODE_RADIUS.toString())
    circle.setAttribute('fill', nodeColor)
    circle.setAttribute('stroke', strokeColor)
    circle.setAttribute('stroke-width', strokeSize)

    let textFill = getContrastColor(nodeColor)

    const textElement = document.createElementNS('http://www.w3.org/2000/svg', 'text')
    textElement.textContent = text
    textElement.setAttribute('text-anchor', 'middle')
    textElement.setAttribute('dominant-baseline', 'central')
    textElement.setAttribute('fill', textFill)
    textElement.setAttribute('font-family', 'Arial, sans-serif')
    textElement.setAttribute('font-size', '40px')

    nodeGroup.appendChild(circle)
    nodeGroup.appendChild(textElement)

    nodeGroup.addEventListener('click', (e) => {
        e.stopPropagation()
        updateNodeMenu()
        let multiSelect = e.ctrlKey || e.shiftKey
        selectNode(node, multiSelect)
    })

    nodeGroup.addEventListener('mouseover', () => {
        nodeGroup.classList.add('hover')
        document.body.style.cursor = 'pointer'
    })

    nodeGroup.addEventListener('mouseout', () => {
        nodeGroup.classList.remove('hover')
        document.body.style.cursor = 'default'
    })

    return nodeGroup
}

function selectNode(node, multiSelect = false) {
    if (!multiSelect) {
        document.querySelectorAll('.tree-node').forEach(node => {
            node.classList.remove('selected')
        })
        clearSelectedNodes()
    }

    // Add the clicked node to the selected nodes
    addSelectedNode(node)

    // Add 'selected' class to the clicked node
    const nodeGroup = document.querySelector(`.tree-node[data-id="${node.id}"]`)
    nodeGroup.classList.add('selected')

    updateNodeMenu()
}


export function findNodeById(node, id) {
    if (node.id.toString() === id.toString()) {
        return node
    }
    for (let child of node.children) {
        const found = findNodeById(child, id)
        if (found) return found
    }
    return null
}

export function updateAllNodesHighlightColor(colorIndex, newColor) {
    const updateNodeColor = (node) => {
        if (node.highlight && node.highlight.type === 'global' && node.highlight.index === colorIndex) {
            node.highlight.color = newColor // Update the node's highlight color

            const selectedNode = document.querySelector(`.tree-node[data-id="${node.id}"]`)
            selectedNode.querySelector('circle').setAttribute('fill', newColor)
            selectedNode.querySelector('text').setAttribute('fill', getContrastColor(newColor))

            if (document.getElementById('border-same-as-text').checked && !document.getElementById('no-border').checked) {
                selectedNode.querySelector('circle').setAttribute('stroke', getContrastColor(newColor))
            }
        }
        node.children.forEach(updateNodeColor)
    }

    let treeData = getTreeData()
    updateNodeColor(treeData)
}

export function generateUniqueId() {
    let treeData = getTreeData()
    let newId = getAndIncrementNodeIDCounter()

    if (treeData) {
        while (findNodeById(treeData, newId)) {
            newId = getAndIncrementNodeIDCounter()
        }
    }

    return newId
}

export function findParentNode(node) {
    function search(searchNode) {
        for (let child of searchNode.children) {
            if (child.id === node.id) {
                return searchNode
            }
            const result = search(child)
            if (result) return result
        }
        return null
    }

    let treeData = getTreeData()
    return search(treeData)
}

export function findMiddleChildNode(node) {
    if (node.children.length === 0) {
        // If no children, find the closest node in the next depth
        const currentDepth = findNodeDepth(node)
        const nextDepth = currentDepth + 1

        if (nodesByDepth[nextDepth]) {
            return findClosestNodeInDepth(node.x, nextDepth)
        }
        return null
    }

    const middleIndex = Math.floor((node.children.length - 1) / 2)
    return node.children[middleIndex]
}

export function findPreviousSibling(node) {
    const currentDepth = findNodeDepth(node)
    const nodesAtDepth = nodesByDepth[currentDepth]
    const currentIndex = nodesAtDepth.findIndex(n => n.id === node.id)

    if (currentIndex > 0) {
        return nodesAtDepth[currentIndex - 1]
    }

    // If no previous sibling, find the closest node to the left
    return findClosestNodeInDepth(nodesAtDepth[currentIndex].x, currentDepth, 'left')
}

export function findNextSibling(node) {
    const currentDepth = findNodeDepth(node)
    const nodesAtDepth = nodesByDepth[currentDepth]
    const currentIndex = nodesAtDepth.findIndex(n => n.id === node.id)

    if (currentIndex < nodesAtDepth.length - 1) {
        return nodesAtDepth[currentIndex + 1]
    }

    // If no next sibling, find the closest node to the right
    return findClosestNodeInDepth(nodesAtDepth[currentIndex].x, currentDepth, 'right')
}

function findNodeDepth(node) {
    for (let depth in nodesByDepth) {
        if (nodesByDepth[depth].includes(node)) {
            return parseInt(depth)
        }
    }
    return -1 // Node not found
}

function findClosestNodeInDepth(x, depth, direction = 'both') {
    const nodesAtDepth = nodesByDepth[depth]
    if (!nodesAtDepth || nodesAtDepth.length === 0) return null

    let closestNode = null
    let minDistance = Infinity

    for (let node of nodesAtDepth) {
        const distance = Math.abs(node.x - x)
        if (direction === 'left' && node.x >= x) continue
        if (direction === 'right' && node.x <= x) continue
        if (distance < minDistance) {
            minDistance = distance
            closestNode = node
        }
    }

    return closestNode ? closestNode.id : null
}

export function removeNodeFromTree(node, id) {
    node.children = node.children.filter(child => {
        if (child.id.toString() === id) {
            return false
        }
        removeNodeFromTree(child, id)
        return true
    })
}