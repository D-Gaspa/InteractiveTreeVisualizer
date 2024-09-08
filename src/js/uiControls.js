import {
    findMiddleChildNodeID,
    findNextSiblingID,
    findParentNodeID,
    findPreviousSiblingID,
    updateAllNodesHighlightColor,
    updateSVGViewBox,
    updateTreeLayout
} from "./treeOperations.js"
import {
    addSelectedNodeID,
    getHighlightColors,
    getSelectedNodesIDs,
    getTreeData,
    setBorderColor,
    setContainerBackgroundColor,
    setLineColor,
    setTreeColor
} from "./sharedState.js"
import {getContrastColor, getCurrentBorderColor} from "./utils.js"
import {resetColors, resetFileInput, resetTreeStructure, saveState} from "./stateManagement.js"
import {handleDeleteNode, toggleNodeMenu, updateNodeMenu} from "./nodeMenu.js"
import {exportTree, importTree} from "./importExport.js"

export function setupEventListeners() {
    // Update the tree layout when the window is resized
    window.addEventListener('resize', updateSVGViewBox)

    setupGeneralOptionsEventListeners()
    setupBorderOptionsEventListeners()
    setupLineOptionsEventListeners()
    setupImportExportEventListeners()
    setupResetButtons()
    setupKeyboardShortcuts()
}

function setupGeneralOptionsEventListeners() {
    const nodeColorPicker = document.getElementById('node-color')
    const containerColorPicker = document.getElementById('container-background-color')
    const nodeTransparentCheckbox = document.getElementById('node-transparent')
    const containerTransparentCheckbox = document.getElementById('container-transparent-background')
    const borderSameAsTextCheckbox = document.getElementById('border-same-as-text')

    // Node Color Options:
    nodeColorPicker.addEventListener('input', () => {
        if (!nodeTransparentCheckbox.checked) {
            setTreeColor(nodeColorPicker.value)
            if (borderSameAsTextCheckbox.checked) {
                setBorderColor(getContrastColor(nodeColorPicker.value))
            }
            updateTreeLayout()
            saveState()
        }
    })

    // Container Color Options:
    containerColorPicker.addEventListener('input', () => {
        if (!containerTransparentCheckbox.checked) {
            setContainerBackgroundColor(containerColorPicker.value)
            document.getElementById('tree-container').style.backgroundColor = containerColorPicker.value
            saveState()
        }
    })

    // Node Transparent Checkbox:
    nodeTransparentCheckbox.addEventListener('change', () => {
        if (nodeTransparentCheckbox.checked) {
            setTreeColor('transparent')
        } else {
            setTreeColor(nodeColorPicker.value)
        }
        updateTreeLayout()
    })

    // Container Transparent Checkbox:
    containerTransparentCheckbox.addEventListener('change', () => {
        if (containerTransparentCheckbox.checked) {
            setContainerBackgroundColor('transparent')
            document.getElementById('tree-container').style.backgroundColor = 'transparent'
        } else {
            setContainerBackgroundColor(containerColorPicker.value)
            document.getElementById('tree-container').style.backgroundColor = containerColorPicker.value
        }
        saveState()
    })
}

function setupBorderOptionsEventListeners() {
    const borderColorPicker = document.getElementById('border-color')
    const borderThicknessInput = document.getElementById('border-thickness')
    const borderSameAsTextCheckbox = document.getElementById('border-same-as-text')
    const noBorderCheckbox = document.getElementById('no-border')
    const lineSameAsBorderCheckbox = document.getElementById('line-same-as-border')
    const noLineCheckbox = document.getElementById('no-line')

    // Border Color Options:
    borderColorPicker.addEventListener('input', () => {
        setBorderColor(borderColorPicker.value)
        if (!noBorderCheckbox.checked && !borderSameAsTextCheckbox.checked) {
            document.querySelectorAll('.tree-node circle').forEach(circle => {
                circle.setAttribute('stroke', borderColorPicker.value)
            })

            if (lineSameAsBorderCheckbox && !noLineCheckbox.checked) {
                updateLineColors()
            }
        }
        saveState()
    })

    // Border Thickness Options:
    borderThicknessInput.addEventListener('input', () => {
        document.querySelectorAll('.tree-node circle').forEach(circle => {
            circle.setAttribute('stroke-width', borderThicknessInput.value)
        })
        saveState()
    })

    // Border Same As Text Checkbox:
    borderSameAsTextCheckbox.addEventListener('change', () => {
        if (!noBorderCheckbox.checked) {
            if (borderSameAsTextCheckbox.checked) {
                document.querySelectorAll('.tree-node circle').forEach(circle => {
                    // get the node color
                    const nodeColor = circle.getAttribute('fill')
                    circle.setAttribute('stroke', getContrastColor(nodeColor))
                })
            } else {
                let newBorderColor = borderColorPicker.value
                document.querySelectorAll('.tree-node circle').forEach(circle => {
                    circle.setAttribute('stroke', newBorderColor)
                })
            }
        }

        if (lineSameAsBorderCheckbox && !noLineCheckbox.checked) {
            updateLineColors()
        }

        saveState()
    })

    // No Border Checkbox:
    noBorderCheckbox.addEventListener('change', () => {
        let newBorderColor
        if (noBorderCheckbox.checked) {
            newBorderColor = 'transparent'
        } else {
            if (borderSameAsTextCheckbox.checked) {
                document.querySelectorAll('.tree-node circle').forEach(circle => {
                    // get the node color
                    const nodeColor = circle.getAttribute('fill')
                    newBorderColor = getContrastColor(nodeColor)
                    circle.setAttribute('stroke', newBorderColor)
                })
                return
            } else {
                newBorderColor = borderColorPicker.value
            }
        }
        document.querySelectorAll('.tree-node circle').forEach(circle => {
            circle.setAttribute('stroke', newBorderColor)
        })

        if (lineSameAsBorderCheckbox && !noLineCheckbox.checked) {
            updateLineColors()
        }
        saveState()
    })
}

function setupLineOptionsEventListeners() {
    const lineColorPicker = document.getElementById('line-color')
    const lineThicknessInput = document.getElementById('line-thickness')
    const lineSameAsBorderCheckbox = document.getElementById('line-same-as-border')
    const noLineCheckbox = document.getElementById('no-line')

    // Line Color Options:
    lineColorPicker.addEventListener('input', () => {
        setLineColor(lineColorPicker.value)
        if (!noLineCheckbox.checked) {
            document.querySelectorAll('line').forEach(line => {
                line.setAttribute('stroke', lineColorPicker.value)
            })
        }
        saveState()
    })

    // Line Thickness Options:
    lineThicknessInput.addEventListener('input', () => {
        document.querySelectorAll('line').forEach(line => {
            line.setAttribute('stroke-width', lineThicknessInput.value)
        })
        saveState()
    })

    // Line Same As Border Checkbox:
    lineSameAsBorderCheckbox.addEventListener('change', () => {
        updateLineColors()
    })

    // No Line Checkbox:
    noLineCheckbox.addEventListener('change', () => {
        if (noLineCheckbox.checked) {
            document.querySelectorAll('line').forEach(line => {
                line.setAttribute('stroke', 'transparent')
            })
        } else {
            updateLineColors()
        }
        saveState()
    })
}

function setupImportExportEventListeners() {
    const importFileInput = document.getElementById('import-json')
    const importTreeButton = document.getElementById('import-tree')
    const scaleFactorInput = document.getElementById('scale-factor')
    const exportTreeButton = document.getElementById('export-tree')

    // Import Options:
    importFileInput.addEventListener('change', function (e) {
        this.nextElementSibling.nextElementSibling.textContent = e.target.files[0] ? e.target.files[0].name : 'No file chosen'
        this.nextElementSibling.nextElementSibling.style.color = e.target.files[0] ? '#d0d0d0' : '#a0a0a0'
    })
    importTreeButton.addEventListener('click', importTree)

    // Export Options:
    scaleFactorInput.addEventListener('input', () => {
        saveState()
    })
    exportTreeButton.addEventListener('click', exportTree)
}

function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function (event) {
        let selectedNodesIDs = getSelectedNodesIDs()
        let treeData = getTreeData()

        if (event.key === 'Escape') {
            if (document.activeElement.id === 'node-value') {
                document.activeElement.blur()
            } else if (document.getElementById('node-menu').classList.contains('visible')) {
                event.preventDefault()
                toggleNodeMenu(false)
                selectedNodesIDs.clear()
                updateNodeSelection()
            }
        }

        if (event.key === 'Enter') {
            if (document.activeElement.id === 'node-value') {
                event.preventDefault()
                document.activeElement.blur()
            } else if (document.getElementById('node-menu').classList.contains('visible') && selectedNodesIDs.size === 1) {
                event.preventDefault()
                document.getElementById('add-child').click()
            }
        }

        if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
            // Delete selected node(s) on backspace or delete key press
            if (selectedNodesIDs.size > 0 && (event.key === 'Backspace' || event.key === 'Delete')) {
                event.preventDefault() // Prevent the browser's back action on backspace
                handleDeleteNode()
            }

            // Move the selected node with arrow keys
            if (selectedNodesIDs.size === 1) {
                const currentNodeId = Array.from(selectedNodesIDs)[0]
                let newSelectedNodeId = null

                switch (event.key) {
                    case 'ArrowUp':
                        event.preventDefault() // Prevent scrolling
                        newSelectedNodeId = findParentNodeID(currentNodeId)
                        break
                    case 'ArrowDown':
                        event.preventDefault() // Prevent scrolling
                        newSelectedNodeId = findMiddleChildNodeID(currentNodeId)
                        break
                    case 'ArrowLeft':
                        event.preventDefault() // Prevent scrolling
                        newSelectedNodeId = findPreviousSiblingID(currentNodeId)
                        break
                    case 'ArrowRight':
                        event.preventDefault() // Prevent scrolling
                        newSelectedNodeId = findNextSiblingID(currentNodeId)
                        break
                }

                if (newSelectedNodeId !== null) {
                    selectedNodesIDs.clear()
                    selectedNodesIDs.add(newSelectedNodeId)
                    updateNodeSelection()
                    updateNodeMenu()
                }
            }

            // Focus on the node value input on 'e' key press
            if (document.getElementById('node-menu').classList.contains('visible')) {
                if (event.key === 'e') {
                    event.preventDefault()
                    document.getElementById('node-value').focus()
                    document.getElementById('node-value').select()
                }
            }

            // If no node is selected, select the root node on 'r' key press
            if (selectedNodesIDs.size === 0 && event.key === 'r') {
                event.preventDefault()
                selectedNodesIDs.add(treeData.id)
                updateNodeSelection()
                updateNodeMenu()
            }

            // If control + a, select all nodes
            if (event.ctrlKey && event.key === 'a') {
                event.preventDefault()
                selectedNodesIDs.clear()
                selectAllNodes(treeData)
                updateNodeSelection()
                updateNodeMenu()
            }
        }
    })
}

function selectAllNodes(node) {
    addSelectedNodeID(node.id)
    node.children.forEach(child => selectAllNodes(child))
}

function updateNodeSelection() {
    // Deselect all nodes visually
    document.querySelectorAll('.tree-node').forEach(node => {
        node.classList.remove('selected')
    })

    // Select the new node visually
    let selectedNodesIDs = getSelectedNodesIDs()
    selectedNodesIDs.forEach(id => {
        const nodeElement = document.querySelector(`.tree-node[data-id="${id}"]`)
        if (nodeElement) {
            nodeElement.classList.add('selected')
        }
    })
}

function setupResetButtons() {
    const resetColorsBtn = document.getElementById('reset-colors')
    const resetTreeBtn = document.getElementById('reset-tree')
    const resetAllBtn = document.getElementById('reset-all')
    const lineColorPicker = document.getElementById('line-color')
    const exportFormat = document.getElementById('export-format')
    const scaleFactor = document.getElementById('scale-factor')
    const borderThickness = document.getElementById('border-thickness')
    const lineThickness = document.getElementById('line-thickness')

    // Reset Color Options:
    resetColorsBtn.addEventListener('click', () => {
        resetColors(lineColorPicker);
        saveState()
        showNotification('Colors reset to default', 'success')
    })

    // Reset Tree Options:
    resetTreeBtn.addEventListener('click', () => {
        resetTreeStructure()
        showNotification('Tree reset to default', 'success')
    })

    // Reset All Options:
    resetAllBtn.addEventListener('click', () => {
        resetFileInput()
        exportFormat.value = 'png'
        scaleFactor.value = 2
        borderThickness.value = 3
        lineThickness.value = 3
        resetTreeStructure()
        resetColors(lineColorPicker)
        showNotification('All settings reset to default', 'success')
    })
}

export function setupGlobalColorPickers() {
    let highlightColors = getHighlightColors()

    const colorPickers = document.querySelectorAll('#global-color-pickers input')
    colorPickers.forEach((picker, index) => {
        picker.addEventListener('input', () => {
            highlightColors[index] = picker.value
            updateAllNodesHighlightColor(index, picker.value)
            updateHighlightButtonColors()
            saveState()
        })
    })
}

export function updateHighlightButtonColors() {
    let highlightColors = getHighlightColors()

    document.querySelectorAll('.highlight-btn').forEach((btn, index) => {
        btn.style.backgroundColor = highlightColors[index]
        btn.style.color = getContrastColor(highlightColors[index])
    })
}

export function updateGlobalColorPickers() {
    let highlightColors = getHighlightColors()

    document.querySelectorAll('#global-color-pickers input').forEach((picker, index) => {
        picker.value = highlightColors[index]
    })
}

function updateLineColors() {
    let lineSameAsBorderCheckbox = document.getElementById('line-same-as-border')
    let lineColorPicker = document.getElementById('line-color')

    let newLineColor
    if (lineSameAsBorderCheckbox.checked) {
        newLineColor = getCurrentBorderColor()
    } else {
        newLineColor = lineColorPicker.value
    }
    document.querySelectorAll('line').forEach(line => {
        line.setAttribute('stroke', newLineColor)
    })
    saveState()
}

export function showNotification(message, type = 'info', duration = 3000) {
    const container = document.getElementById('notification-container')
    const notification = document.createElement('div')
    notification.className = `notification ${type}`
    notification.textContent = message

    container.appendChild(notification)

    // Trigger reflow to enable transition
    notification.offsetHeight

    // Add 'show' class to fade in
    notification.classList.add('show')

    setTimeout(() => {
        // Remove 'show' class to fade out
        notification.classList.remove('show')

        // Remove the notification from the DOM after fade out
        setTimeout(() => {
            container.removeChild(notification)
        }, 300)
    }, duration)
}