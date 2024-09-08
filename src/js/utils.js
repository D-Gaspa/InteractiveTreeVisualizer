import {getBorderColor, getTreeColor} from "./sharedState.js";
import {generateUniqueId} from "./treeOperations.js";

export function getContrastColor(hex_color) {
    // Convert hex to RGB
    const r = parseInt(hex_color.substring(1, 3), 16)
    const g = parseInt(hex_color.substring(3, 5), 16)
    const b = parseInt(hex_color.substring(5, 7), 16)

    // Calculate luminance
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000
    // Return black or white depending on luminance
    return (yiq >= 128) ? 'black' : 'white'
}

export function getCurrentBorderColor(nodeColor = getTreeColor()) {
    if (document.getElementById('no-border').checked) {
        return 'transparent'
    }
    if (document.getElementById('border-same-as-text').checked) {
        // Use the nodeColor, defaulting to treeColor if nodeColor is not explicitly provided
        return getContrastColor(nodeColor)
    } else {
        return getBorderColor()
    }
}

export function getCurrentLineColor() {
    if (document.getElementById('no-line').checked) {
        return 'transparent'
    }
    if (document.getElementById('line-same-as-border').checked) {
        return getCurrentBorderColor()
    } else {
        return document.getElementById('line-color').value
    }
}

export function validateAndTransformTreeData(data) {
    function processNode(node) {
        if (typeof node !== 'object' || node === null) {
            throw new Error('Invalid node structure')
        }

        const processedNode = {
            id: generateUniqueId(),
            text: node.text || "1",
            x: node.x || 0,
            y: node.y || 0,
            highlight: node.highlight || null,
            children: []
        }

        const childrenArray = node.children || []
        if (!Array.isArray(childrenArray)) {
            throw new Error('Children must be an array')
        }

        processedNode.children = childrenArray.map(child => processNode(child))

        return processedNode
    }

    return processNode(data)
}