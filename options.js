// Saves options to chrome.storage
function save_options() {
  var login = document.getElementById('login').value;
  var password = document.getElementById('password').value;

  chrome.storage.sync.set({login, password}, function() {
    // Update status to let user know options were saved.
    var status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(() => status.textContent = '', 1250);
  });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
  chrome.storage.sync.get(
	{login: '', password: ''},
	items => {
		document.getElementById('login').value = items.login;
		document.getElementById('password').value = items.password;
	}
  );
}

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);