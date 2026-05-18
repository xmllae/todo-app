(function patchHeaderStatus() {
  function resetHeaderStatus() {
    const dot = document.querySelector('#headerStatusDot');
    const live = document.querySelector('#syncStatus');

    clearTimeout(window._syncFade);
    if (live) live.textContent = '';
    if (dot) {
      dot.className = 'user-status-dot';
      dot.removeAttribute('title');
    }
  }

  resetHeaderStatus();

  if (typeof updateSyncStatus === 'function') {
    const originalUpdateSyncStatus = updateSyncStatus;
    updateSyncStatus = function updateSyncStatusWithCleanIdleState(status) {
      if (!status) {
        resetHeaderStatus();
        return;
      }
      return originalUpdateSyncStatus(status);
    };
  }

  if (typeof loginAs === 'function') {
    const originalLoginAs = loginAs;
    loginAs = function loginAsWithStatus(user, userData) {
      updateSyncStatus(typeof isGuest !== 'undefined' && isGuest ? 'offline' : 'saved');
      return originalLoginAs(user, userData);
    };
  }
})();
