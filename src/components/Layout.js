export function AppShell(sidebarHtml) {
    return `
    <div class="app-container">
        ${sidebarHtml}
        <main class="main-content" id="main-content-area"></main>
        <button id="mobile-menu-btn" class="mobile-menu-btn">
            <span>☰</span>
        </button>
    </div>
    `;
}

export function Page({ title, actions = '', content }) {
    return `
    <div class="page-container fade-in">
        <header class="page-header">
            <h1 class="page-title">${title}</h1>
            <div class="page-actions">${actions}</div>
        </header>
        <div class="page-content">
            ${content}
        </div>
    </div>
    `;
}
