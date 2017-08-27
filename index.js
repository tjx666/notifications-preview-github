// Mini version of select-dom
const select = (sel, el) => (el || document).querySelector(sel);
select.all = (sel, el) => (el || document).querySelectorAll(sel);
select.exists = (sel, el) => Boolean(select(sel, el));

const fetchDocument = url => new Promise((resolve, reject) => {
	const r = new XMLHttpRequest();
	r.open('GET', url, true);
	r.responseType = 'document';
	r.onerror = reject;
	r.onload = () => {
		if (r.status >= 200 && r.status < 400) {
			resolve(r.response);
		} else {
			reject(r.status);
		}
	};
	r.send();
});

function hide(el) {
	el.style.display = 'none';
}
function show(el) {
	el.style.display = 'block';
}
function isHidden(el) {
	return el.style.display !== 'block';
}

function addNotificationsDropdown() {
	if (select.exists('#NPG')) {
		return;
	}
	const indicator = select('a.notification-indicator');
	const notificationHeight = window.innerHeight * 2 / 3;
	indicator.parentNode.insertAdjacentHTML('beforeend', `
		<div id="NPG" class="dropdown-menu-content js-menu-content">
			<ul id="NPG-dropdown" class="dropdown-menu dropdown-menu-sw">
				<li id="NPG-item" class="dropdown-item" style="max-height: ${notificationHeight}px;"></li>
			</ul>
		</div>
	`);
}

function createMutationObserver(element, callback) {
	const observer = new MutationObserver(mutations => {
		for (const mutation of mutations) {
			callback(mutation.target);
		}
	});

	observer.observe(element, {
		attributes: true,
		attributeFilter: ['class']
	});

	return observer;
}

function handleMarkAsRead(el) {
	if (el.classList.contains('unread')) {
		addNotificationsDropdown();
	}
}

function handleCloseDropdown(el) {
	if (!el.classList.contains('selected')) {
		addNotificationsDropdown();
	}
}

function init() {
	const indicator = select('a.notification-indicator');
	if (!select.exists('.unread', indicator) || location.pathname.startsWith('/notifications')) {
		return;
	}

	addNotificationsDropdown();
	createMutationObserver(select('span.mail-status', indicator), handleMarkAsRead);
	createMutationObserver(indicator, handleCloseDropdown);

	indicator.addEventListener('mouseenter', async () => {
		const container = select('#NPG-item');

		if (select.exists('.unread', indicator) && isHidden(select('#NPG'))) {
			addNotificationsDropdown();
			show(select('#NPG'));

			const notificationsPage = await fetchDocument('/notifications');
			const notificationsList = select('.notifications-list', notificationsPage);
			container.append(notificationsList);

			// Change tooltip direction
			const classes = select('.tooltipped-s', container).classList;
			classes.remove('tooltipped-s');
			classes.add('tooltipped-n');

			// Remove unused elements
			for (const uselessEl of select.all('.paginate-container', container)) {
				uselessEl.remove();
			}
		}
	});

	document.addEventListener('click', ({target}) => {
		const container = select('#NPG');
		if (!container.contains(target)) {
			hide(container);
		}
	});
}

// Automatically run at dom-ready thanks to run_at:document_idle in manifest.json
// https://developer.chrome.com/extensions/content_scripts#run_at
init();
