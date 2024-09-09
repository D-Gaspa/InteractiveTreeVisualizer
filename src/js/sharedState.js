import {
    DEFAULT_BORDER_COLOR,
    DEFAULT_CONTAINER_BACKGROUND_COLOR,
    DEFAULT_HIGHLIGHT_COLORS,
    DEFAULT_TREE_COLOR
} from "./constants.js"

let treeColor = DEFAULT_TREE_COLOR
let borderColor = DEFAULT_BORDER_COLOR
let lineColor = DEFAULT_BORDER_COLOR
let highlightColors = DEFAULT_HIGHLIGHT_COLORS
let containerBackgroundColor = DEFAULT_CONTAINER_BACKGROUND_COLOR;
let treeData = null;
let nodeIDCounter = 0;
let selectedNodes = new Set()

export function setTreeColor(color) {
    treeColor = color
}

export function setBorderColor(color) {
    borderColor = color
}

export function setLineColor(color) {
    lineColor = color
}

export function setHighlightColors(colors) {
    highlightColors = colors
}

export function setContainerBackgroundColor(color) {
    containerBackgroundColor = color
}

export function setTreeData(data) {
    treeData = data
}

export function setNodeIDCounter(counter) {
    nodeIDCounter = counter
}

export function getTreeColor() {
    return treeColor
}

export function getBorderColor() {
    return borderColor
}

export function getHighlightColors() {
    return highlightColors
}

export function getContainerBackgroundColor() {
    return containerBackgroundColor
}

export function getTreeData() {
    return treeData
}

export function getNodeIDCounter() {
    return nodeIDCounter
}

export function getAndIncrementNodeIDCounter() {
    return nodeIDCounter++
}

export function getSelectedNodes() {
    return selectedNodes
}

export function addSelectedNode(node) {
    selectedNodes.add(node)
}

export function clearSelectedNodes() {
    selectedNodes.clear()
}

export function getSelectedNodesSize() {
    return selectedNodes.size
}