const reset = document.querySelector('[data-reset-portfolio-demo]');
const dialog = document.querySelector('.portfolio-reset-dialog');
reset?.addEventListener('click', () => { dialog.returnValue = ''; dialog.showModal(); });
dialog?.addEventListener('close', () => {
  if (dialog.returnValue !== 'reset') return;
  try {
    const keys = JSON.parse(reset.dataset.storageKeys);
    keys.forEach(key => localStorage.removeItem(key));
    window.location.reload();
  } catch {
    const status = document.querySelector('[data-portfolio-demo-status]');
    if (status) status.textContent = 'Browser storage is unavailable. Open the demo in a browser that allows local storage.';
  }
});
