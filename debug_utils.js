function drawDebugLineY(svg, message, color, y) {
    const svg_ns = "http://www.w3.org/2000/svg";

    // Draw Line
    const debugLine = document.createElementNS(svg_ns, 'line');
    debugLine.setAttribute('x1', '0');
    debugLine.setAttribute('y1', y.toString());
    debugLine.setAttribute('x2', '100%'); // Span across the width of the SVG
    debugLine.setAttribute('y2', y.toString());
    debugLine.setAttribute('stroke', color);
    debugLine.setAttribute('stroke-dasharray', '5,5'); // Dashed line for better visibility
    svg.appendChild(debugLine);

    // Label for Line
    const debugLabel = document.createElementNS(svg_ns, 'text');
    debugLabel.setAttribute('x', '10');
    debugLabel.setAttribute('y', (parseInt(y) + 5).toString()); // Position the label slightly below the line
    debugLabel.setAttribute('fill', color);
    debugLabel.textContent = message + ` (${y}px)`;
    svg.appendChild(debugLabel);
}

function drawDebugLineX(svg, message, color, x) {
    const svg_ns = "http://www.w3.org/2000/svg";

    // Draw Line
    const debugLine = document.createElementNS(svg_ns, 'line');
    debugLine.setAttribute('x1', x.toString());
    debugLine.setAttribute('y1', '0');
    debugLine.setAttribute('x2', x.toString());
    debugLine.setAttribute('y2', '100%'); // Span across the height of the SVG
    debugLine.setAttribute('stroke', color);
    debugLine.setAttribute('stroke-dasharray', '5,5'); // Dashed line for better visibility
    svg.appendChild(debugLine);

    // Label for Line
    const debugLabel = document.createElementNS(svg_ns, 'text');
    debugLabel.setAttribute('x', (parseInt(x) + 5).toString()); // Position the label slightly to the right of the line
    debugLabel.setAttribute('y', '20'); // Fixed y position for visibility
    debugLabel.setAttribute('fill', color);
    debugLabel.textContent = message + ` (${x}px)`;
    svg.appendChild(debugLabel);
}

export function drawDebugLines(svg, VERTICAL_MARGIN, VERTICAL_SPACING, HORIZONTAL_MARGIN, HORIZONTAL_SPACING, NODE_RADIUS) {
    drawDebugLineY(svg, 'Begin', 'red', 0);
    drawDebugLineY(svg, 'Top Margin', 'blue', VERTICAL_MARGIN);
    drawDebugLineY(svg, 'Root Start', 'red', VERTICAL_MARGIN + NODE_RADIUS);
    drawDebugLineY(svg, 'End of Root', 'green', VERTICAL_MARGIN + NODE_RADIUS * 2);
    drawDebugLineY(svg, 'Spacing', 'blue', VERTICAL_MARGIN + VERTICAL_SPACING);
    drawDebugLineY(svg, 'Start of Child', 'red', VERTICAL_MARGIN + VERTICAL_SPACING + NODE_RADIUS);
    drawDebugLineY(svg, 'End of Child', 'green', VERTICAL_MARGIN + VERTICAL_SPACING + NODE_RADIUS * 2);
    drawDebugLineY(svg, 'Spacing', 'blue', VERTICAL_MARGIN + VERTICAL_SPACING * 2);

    drawDebugLineX(svg, 'Begin', 'red', 0);
    drawDebugLineX(svg, 'Left Margin', 'blue', HORIZONTAL_MARGIN);
    drawDebugLineX(svg, 'Root Start', 'red', HORIZONTAL_MARGIN + NODE_RADIUS);
    drawDebugLineX(svg, 'End of Root', 'green', HORIZONTAL_MARGIN + NODE_RADIUS * 2);
    drawDebugLineX(svg, 'Spacing', 'blue', HORIZONTAL_MARGIN + HORIZONTAL_SPACING);
}