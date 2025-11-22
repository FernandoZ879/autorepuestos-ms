export function showView(viewName) {
    document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
    const view = document.getElementById(viewName);
    if (view) {
        view.classList.add('active');
        window.scrollTo(0, 0);
        return true;
    }
    return false;
}
