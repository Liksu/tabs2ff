var base = 'http://funny-feed.com';
var auth = false;
var login, password;

function doAuth() {
	if (auth) return Promise.resolve(auth);
	
	return new Promise((resolve, reject) => {
		chrome.storage.sync.get({login: '', password: ''}, stored => {
			if (!stored.login || !stored.password) {
				notify('No credentials');
				return reject('No credentials');
			}

			login = stored.login;
			password = stored.password;
			
			var authData = new FormData();
			authData.append('login', login);
			authData.append('password', password);
			
			fetch(`${base}/auth`, {
				method: 'POST',
				body: authData
			}).then(
				resp => {
					resp.text().then(body => {
						auth = /value="Login"/.test(body);

						if (!auth) {
							notify('Something wrong with auth data');
							return reject(resp);
						}
						
						resolve(resp);
					});
				},
				rej => {
					notify('Something wrong with auth query');
					return reject(rej);
				}
			);
		});
	});
};

function send(url) {
	var post = new FormData();
	post.append('sname', navigator.userAgent);
	post.append('post_text', url);

	return doAuth().then(
		() =>
			fetch(`${base}/add`, {
				method: 'POST',
				body: post,
				credentials: 'include',
				redirect: 'manual'
			}).then(resp => {
				if (resp.status) {
					notify(`Something went wrong during upload: ${resp.status} ${resp.statusText}`);
					return Promise.reject(resp);
				}
			}),
		resp => Promise.reject(resp)
	);
};

function notify(message) {
	console.log(message);
	chrome.notifications.create({
		type: 'basic',
		title: 'Tabs2ff',
		message: message || '',
		iconUrl: 'message.png',
		buttons: [{title: 'Open options page'}]
	});
}
chrome.notifications.onButtonClicked.addListener(() => chrome.runtime.openOptionsPage());

/**
 * Create action button which will send all tabs to funny-feed and close them.
 */
chrome.browserAction.onClicked.addListener(function(tab) {
	chrome.tabs.query({currentWindow: true}, tabs => {
		tabs.forEach(tab => {
			send(tab.url).then(() => {
				chrome.tabs.remove(tab.id)
			}, () => {});
		});
	});
});

/**
 * Create a context menu which will only show up for images.
 */
chrome.runtime.onInstalled.addListener(function() {
	chrome.contextMenus.create({
	  "title" : "Send image to funny-feed",
	  "id": "sendToFunnyFeed",
	  "type" : "normal",
	  "contexts" : ["image", "selection"]
	});
});

/**
 * Action to context menu, will send image to funny-feed
 */
chrome.contextMenus.onClicked.addListener((info, tab) => {
	send(info.selectionText || info.srcUrl).then(
		resp => {
			info.pageUrl == info.srcUrl && chrome.tabs.remove(tab.id);
		},
		() => {}
	);
});
