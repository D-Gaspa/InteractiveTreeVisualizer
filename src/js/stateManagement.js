import {
    getBorderColor,
    getContainerBackgroundColor,
    getHighlightColors,
    getNodeIDCounter,
    getTreeColor,
    getTreeData,
    setBorderColor,
    setContainerBackgroundColor,
    setHighlightColors,
    setLineColor,
    setNodeIDCounter,
    setTreeColor,
    setTreeData
} from "./sharedState.js"
import {
    DEFAULT_BORDER_COLOR,
    DEFAULT_CONTAINER_BACKGROUND_COLOR,
    DEFAULT_HIGHLIGHT_COLORS,
    DEFAULT_TREE_COLOR,
    DEFAULT_TREE_DATA
} from "./constants.js"
import {validateAndTransformTreeData} from "./utils.js"
import {updateGlobalColorPickers, updateHighlightButtonColors} from "./uiControls.js"
import {initializeTreeData, updateAllNodesHighlightColor, updateTreeLayout} from "./treeOperations.js";

export function loadState() {
    loadGlobalInformation()
    loadGeneralOptions()
    loadHighlightColors()
    loadBorderOptions()
    loadLineOptions()
    loadImportExportOptions()
    updateHighlightButtonColors()
    updateGlobalColorPickers()
}

function loadGlobalInformation() {
    const savedTreeData = localStorage.getItem('treeData')
    if (savedTreeData) {
        try {
            const parsedData = JSON.parse(savedTreeData)
            setTreeData(validateAndTransformTreeData(parsedData))
        } catch (error) {
            console.error('Failed to load tree data:', error)
            setTreeData(JSON.parse(JSON.stringify(DEFAULT_TREE_DATA)))
        }
    }

    const savedNodeIDCounter = localStorage.getItem('nodeIDCounter')
    if (savedNodeIDCounter) {
        setNodeIDCounter(parseInt(savedNodeIDCounter))
    }
}

function loadGeneralOptions() {
    const savedNodeColor = localStorage.getItem('nodeColor')
    const savedBackground = localStorage.getItem('backgroundColor')

    if (savedNodeColor) {
        setTreeColor(savedNodeColor)
        let treeColor = getTreeColor()
        document.getElementById('node-color').value = treeColor
        if (treeColor === 'transparent') {
            document.getElementById('node-transparent').checked = true
            document.getElementById('node-color').value = DEFAULT_TREE_COLOR
        } else {
            document.getElementById('node-color').value = treeColor
        }
    }

    if (savedBackground) {
        setContainerBackgroundColor(savedBackground)
        let containerBackgroundColor = getContainerBackgroundColor()
        document.getElementById('tree-container').style.backgroundColor = containerBackgroundColor
        if (containerBackgroundColor === 'transparent') {
            document.getElementById('container-transparent-background').checked = true
        } else {
            document.getElementById('container-background-color').value = containerBackgroundColor
        }
    }
}

function loadHighlightColors() {
    const savedHighlightColors = localStorage.getItem('highlightColors')
    if (savedHighlightColors) {
        setHighlightColors(JSON.parse(savedHighlightColors))
    }
}

function loadBorderOptions() {
    const savedBorderColor = localStorage.getItem('borderColor')
    const borderThickness = localStorage.getItem('borderThickness')
    const borderColorSameAsText = localStorage.getItem('borderColorSameAsText')
    const noBorder = localStorage.getItem('noBorder')

    if (savedBorderColor) {
        setBorderColor(savedBorderColor)
        document.getElementById('border-color').value = savedBorderColor
        if (noBorder === 'true') {
            document.getElementById('no-border').checked = true
        }
        if (borderColorSameAsText === 'true') {
            document.getElementById(`border-same-as-text`).checked = true
        }
    }

    if (borderThickness) {
        document.getElementById('border-thickness').value = borderThickness
    }
}

function loadLineOptions() {
    const savedLineColor = localStorage.getItem('lineColor')
    const lineThickness = localStorage.getItem('lineThickness')
    const lineSameAsBorder = localStorage.getItem('lineSameAsBorder')
    const noLine = localStorage.getItem('noLine')

    if (savedLineColor) {
        setLineColor(savedLineColor)
        document.getElementById('line-color').value = savedLineColor
        if (noLine === 'true') {
            document.getElementById('no-line').checked = true
        }
        if (lineSameAsBorder === 'true') {
            document.getElementById('line-same-as-border').checked = true
        }
    }

    if (lineThickness) {
        document.getElementById('line-thickness').value = lineThickness
    }
}

function loadImportExportOptions() {
    const scaleFactor = localStorage.getItem('scaleFactor')
    if (scaleFactor) {
        document.getElementById('scale-factor').value = scaleFactor
    }
}

export function saveState() {
    let treeData = getTreeData()
    let nodeIDCounter = getNodeIDCounter()
    let treeColor = getTreeColor()
    let containerBackgroundColor = getContainerBackgroundColor()
    let highlightColors = getHighlightColors()
    let borderColor = getBorderColor()

    // Global information:
    localStorage.setItem('treeData', JSON.stringify(treeData))
    localStorage.setItem('nodeIDCounter', nodeIDCounter)

    // General Options:
    localStorage.setItem('nodeColor', treeColor)
    localStorage.setItem('backgroundColor', containerBackgroundColor)

    // Highlight Colors:
    localStorage.setItem('highlightColors', JSON.stringify(highlightColors))

    // Border Options:
    localStorage.setItem('borderColor', borderColor)
    localStorage.setItem('borderThickness', document.getElementById('border-thickness').value)
    localStorage.setItem('borderColorSameAsText', document.getElementById('border-same-as-text').checked)
    localStorage.setItem('noBorder', document.getElementById('no-border').checked)

    // Line Options:
    localStorage.setItem('lineColor', document.getElementById('line-color').value)
    localStorage.setItem('lineThickness', document.getElementById('line-thickness').value)
    localStorage.setItem('lineSameAsBorder', document.getElementById('line-same-as-border').checked)
    localStorage.setItem('noLine', document.getElementById('no-line').checked)

    // Import/Export Options:
    localStorage.setItem('scaleFactor', document.getElementById('scale-factor').value)
}

export function resetFileInput() {
    const fileInput = document.getElementById('import-json')
    const fileNameDisplay = document.querySelector('.file-name')

    // Reset the file input
    fileInput.value = ''

    // Reset the displayed file name
    fileNameDisplay.textContent = 'No file chosen'
}

export function resetTreeStructure() {
    initializeTreeData()
    let treeData = getTreeData()

    treeData.x = document.getElementById('tree-svg').viewBox.baseVal.width / 2
    treeData.y = document.getElementById('tree-svg').viewBox.baseVal.height / 2
    updateTreeLayout()
}

export function resetColors() {
    resetExportColors()
    resetNodeColors()
    setHighlightColors([...DEFAULT_HIGHLIGHT_COLORS])
    updateHighlightButtonColors()
    updateGlobalColorPickers()
    updateAllNodesHighlightColor()
    resetLineColors()
    resetTreeStructure()
}

function resetExportColors() {
    setContainerBackgroundColor(DEFAULT_CONTAINER_BACKGROUND_COLOR)
    document.getElementById('container-background-color').value = DEFAULT_CONTAINER_BACKGROUND_COLOR
    document.getElementById('container-transparent-background').checked = false
    document.getElementById('tree-container').style.backgroundColor = DEFAULT_CONTAINER_BACKGROUND_COLOR
}

function resetNodeColors() {
    setTreeColor(DEFAULT_TREE_COLOR)
    setBorderColor(DEFAULT_BORDER_COLOR)
    document.getElementById('node-color').value = DEFAULT_TREE_COLOR
    document.getElementById('border-color').value = DEFAULT_BORDER_COLOR
    document.getElementById('node-transparent').checked = false
    document.getElementById('no-border').checked = false
    document.getElementById('border-same-as-text').checked = true
}

function resetLineColors() {
    setLineColor(DEFAULT_BORDER_COLOR)
    document.getElementById('line-color').value = DEFAULT_BORDER_COLOR
    document.getElementById('line-same-as-border').checked = true
}