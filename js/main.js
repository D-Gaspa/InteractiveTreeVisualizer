import { initializeTree } from './treeOperations.js';
import { setupEventListeners } from './uiControls.js';

document.addEventListener('DOMContentLoaded', () => {
    initializeTree();
    setupEventListeners();
});