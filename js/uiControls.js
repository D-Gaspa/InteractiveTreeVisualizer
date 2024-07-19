export function setupEventListeners() {
    const addRootNodeButton = document.getElementById('add-root-node');
    const exportTreeButton = document.getElementById('export-tree');
    const toggleThemeButton = document.getElementById('toggle-theme');

    addRootNodeButton.addEventListener('click', () => {
        console.log('Add root node clicked');
        // Functionality to be implemented later
    });

    exportTreeButton.addEventListener('click', () => {
        console.log('Export tree clicked');
        // Functionality to be implemented later
    });

    toggleThemeButton.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        document.body.classList.toggle('light-mode');
    });
}