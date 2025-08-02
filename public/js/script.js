function showAlert(message, type = 'success') {
    const alertDiv = document.getElementById('alert');
    const alert = document.createElement('div');

    alert.innerHTML = `<div class="alert alert-${type} alert-dismissible fade show role="alert">${message}</div>`;

    alertDiv.appendChild(alert);
    setTimeout(() => {
      const alert = document.querySelector('.alert');
      alert.remove();
      }, 2000);
  }