import {updateTreeLayout} from "./treeOperations.js"
import {setupNodeMenu} from "./nodeMenu.js"
import {setupEventListeners, setupGlobalColorPickers} from "./uiControls.js"
import {loadState} from "./stateManagement.js"

document.addEventListener('DOMContentLoaded', () => {
    loadState()
    updateTreeLayout()
    setupEventListeners()
    setupNodeMenu()
    setupGlobalColorPickers()
})