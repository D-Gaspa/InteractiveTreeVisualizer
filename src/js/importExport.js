import {getTreeData, setTreeData} from "./sharedState.js";
import {updateTreeLayout} from "./treeOperations.js";
import {showNotification} from "./uiControls.js";
import {validateAndTransformTreeData} from "./utils.js";

export function importTree() {
    const fileInput = document.getElementById('import-json')
    const file = fileInput.files[0]
    if (file) {
        const reader = new FileReader()
        reader.onload = function (e) {
            try {
                const importedData = JSON.parse(e.target.result.toString())
                setTreeData(validateAndTransformTreeData(importedData))
                updateTreeLayout()
                showNotification('Tree imported successfully', 'success')
            } catch (error) {
                showNotification('Error importing tree: ' + error.message, 'error')
            }
        }
        reader.readAsText(file)
    } else {
        showNotification('No file was chosen', 'warning')
    }
}

export function exportTree() {
    const format = document.getElementById('export-format').value
    switch (format) {
        case 'png':
            exportTreeAsPNG()
            break
        case 'svg':
            exportTreeAsSVG()
            break
        case 'json':
            exportTreeAsJSON()
            break
        case 'jpeg':
            exportTreeAsJPEG()
            break
    }
}

function prepareCanvasForExport(backgroundColor) {
    const svg = document.getElementById('tree-svg')
    const container = document.getElementById('tree-container')
    const scaleFactor = parseFloat(document.getElementById('scale-factor').value)

    // Create a canvas element
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    // Set canvas size
    canvas.width = container.offsetWidth * scaleFactor
    canvas.height = container.offsetHeight * scaleFactor

    // Set background
    ctx.fillStyle = backgroundColor
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Convert SVG to data URL
    const svgData = new XMLSerializer().serializeToString(svg)
    const svgBlob = new Blob([svgData], {type: 'image/svg+xmlcharset=utf-8'})
    return {canvas, ctx, svgBlob}
}

function renderImageOnCanvas(canvas, img, ctx) {
    // Calculate scaling to maintain the aspect ratio
    const scale = Math.min(canvas.width / img.width, canvas.height / img.height)
    const x = (canvas.width / 2) - (img.width / 2) * scale
    const y = (canvas.height / 2) - (img.height / 2) * scale

    // Set canvas context properties for better text rendering
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.textRendering = 'geometricPrecision'
    ctx.fontSmooth = 'always'

    // Draw image on canvas
    ctx.drawImage(img, x, y, img.width * scale, img.height * scale)
}

function exportTreeAsPNG() {
    const useTransparentBackground = document.getElementById('container-transparent-background').checked
    const backgroundColor = useTransparentBackground ? 'transparent' : document.getElementById('container-background-color').value

    const {canvas, ctx, svgBlob} = prepareCanvasForExport(backgroundColor)
    const DOMURL = window.URL || window.webkitURL || window
    const url = DOMURL.createObjectURL(svgBlob)

    // Create image from SVG
    const img = new Image()
    img.onload = function () {
        renderImageOnCanvas(canvas, img, ctx)

        // Convert canvas to PNG
        const pngUrl = canvas.toDataURL('image/png')

        // Trigger download
        const downloadLink = document.createElement('a')
        downloadLink.href = pngUrl
        downloadLink.download = 'tree_visualization.png'
        document.body.appendChild(downloadLink)
        downloadLink.click()
        document.body.removeChild(downloadLink)

        // Clean up
        DOMURL.revokeObjectURL(url)
    }
    img.src = url
}

function exportTreeAsSVG() {
    const svg = document.getElementById('tree-svg')
    const svgData = new XMLSerializer().serializeToString(svg)
    const svgBlob = new Blob([svgData], {type: 'image/svg+xmlcharset=utf-8'})
    const url = URL.createObjectURL(svgBlob)

    const downloadLink = document.createElement('a')
    downloadLink.href = url
    downloadLink.download = 'tree_visualization.svg'
    document.body.appendChild(downloadLink)
    downloadLink.click()
    document.body.removeChild(downloadLink)

    URL.revokeObjectURL(url)
}

function exportTreeAsJSON() {
    const treeData = getTreeData()
    const jsonData = JSON.stringify(treeData, null, 2)
    const blob = new Blob([jsonData], {type: 'application/json'})
    const url = URL.createObjectURL(blob)

    const downloadLink = document.createElement('a')
    downloadLink.href = url
    downloadLink.download = 'tree_data.json'
    document.body.appendChild(downloadLink)
    downloadLink.click()
    document.body.removeChild(downloadLink)

    URL.revokeObjectURL(url)
}

function exportTreeAsJPEG() {
    const useTransparentBackground = document.getElementById('container-transparent-background').checked
    const backgroundColor = useTransparentBackground ? 'white' : document.getElementById('container-background-color').value

    const {canvas, ctx, svgBlob} = prepareCanvasForExport(backgroundColor)
    const url = URL.createObjectURL(svgBlob)

    const img = new Image()
    img.onload = function () {
        renderImageOnCanvas(canvas, img, ctx)

        const jpegUrl = canvas.toDataURL('image/jpeg')

        const downloadLink = document.createElement('a')
        downloadLink.href = jpegUrl
        downloadLink.download = 'tree_visualization.jpg'
        document.body.appendChild(downloadLink)
        downloadLink.click()
        document.body.removeChild(downloadLink)

        URL.revokeObjectURL(url)
    }
    img.src = url
}