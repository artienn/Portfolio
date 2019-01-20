class App {
	constructor() {
		this.menu = new Menu( menu );		
		this.canvasElement = null;
		this.ws = null;	
		this.imageLoader = appContainer
			.querySelector('.image-loader');
		this.currentImage = appContainer.querySelector('.current-image');
		this.imageUrl = '';	
		this.currentComment = null;
		this.error = appContainer.querySelector('.error');	
		this.registerEvents();
	}	
	registerEvents() {
		this.currentImage.addEventListener('load', e => {
			this.imageLoader.hidden = true;	
			this.canvas = new Canvas();
			this.ws = new Wss('wss://neto-api.herokuapp.com/pic');
			document.removeEventListener('drop', onFilesDrop);
			document.addEventListener('drop', event => {
				event.preventDefault();
				app.error.querySelector('p')
					.textContent = `Чтобы загрузить новое изображение,
					пожалуйста, воспользуйтесь пунктом "загрузить новое" в меню`;
				app.error.style.display = '';
			})
		});
		document.addEventListener('drop', onFilesDrop);
		document.addEventListener('dragover', event => event.preventDefault());
	}
}

class Menu {
	constructor( menu ) {
		this.menuContainer = menu;		
		this.dragElement = this.menuContainer.querySelector('.drag');
		this.drawElement = this.menuContainer.querySelector('.draw');
		this.burgerElement = this.menuContainer.querySelector('.burger');
		this.sendElement = this.menuContainer.querySelector('.new');
		this.commentsElement = this.menuContainer.querySelector('.comments');
		this.shareElement = this.menuContainer.querySelector('.share');
		this.copyElement = this.menuContainer.querySelector('.menu_copy');
		this.commentsToolContainer = this.menuContainer.querySelector('.comments-tools');
		this.drawToolContainer = this.menuContainer.querySelector('.draw-tools');
		this.toogleCommentsInput = this.commentsToolContainer.firstElementChild;
		this.toogleCommentsInputCheck = false;
		this.isDrawMenuOpen = false;
		this.setDefaultMenuState();
		this.restoreMenuPosition();
		this.registerEvents();
	}
	registerEvents() {
		this.dragElement
			.addEventListener('mousedown', moveMenu);		
		this.drawElement
			.addEventListener('click', showDrawMenu);
		this.burgerElement
			.addEventListener('click', showMainMenu);
		this.sendElement
			.addEventListener('click', addInputEl);
		this.commentsElement
			.addEventListener('click', showCommentMenu);
		this.shareElement
			.addEventListener('click', showShareMenu);
		this.toogleCommentsInput
			.addEventListener('change', toogleComments);
		this.copyElement
			.addEventListener('click', copyLink);
		this.drawToolContainer
			.addEventListener('click', changePenColor);
	}
	restoreMenuPosition() {
		this.menuContainer.style.left = `${localStorage.left}px`;
		this.menuContainer.style.top = `${localStorage.top}px`;
	}		
	setDefaultMenuState() {
		this.burgerElement.style.display = 'none';
		this.menuContainer.dataset.state = 'initial';	
		menuWidth = this.menuContainer.offsetWidth;	
	}
	selectMenuMode(mode) {
		const selected = this.menuContainer
			.querySelector('[data-state="selected"]');
		this.menuContainer.dataset.state = 'selected';
		if(selected) {
			selected.dataset.state = '';
		}			
		mode.dataset.state = 'selected';
		this.burgerElement.style.display = '';
		menuWidth = this.menuContainer.offsetWidth;		
	}	
}

class Comment {
	constructor() {
		this.commentForm = commentTemplate.cloneNode(true);
		this.commentsBody = this.commentForm
			.querySelector('.comments__body');
		this.messageElement = this.commentForm
			.querySelector('.comment')
			.cloneNode(true);	
		this.commentLoader = this.commentForm
			.querySelector('.loader')
			.closest('.comment')
			.cloneNode(true);
		// удаляем шаблоны коментов
		Array.from(this.commentForm
			.querySelectorAll('.comment'))
			.forEach(comment => {
				comment.remove();
		});
		this.checkbox = this.commentForm
			.querySelector('.comments__marker-checkbox');
		this.commentInput = this.commentsBody
			.querySelector('.comments__input');
		this.closeElement = this.commentsBody
			.querySelector('.comments__close');
		this.submitElement = this.commentsBody
			.querySelector('.comments__submit');
		this.registerEvents();
	}
	registerEvents() {
		this.checkbox
			.addEventListener('click', checkMarkerState.bind(this));
		this.closeElement
			.addEventListener('click', closeCommentsBody.bind(this));
		this.submitElement
			.addEventListener('click', sendComment.bind(this));
	}
}

class Wss {
	constructor(url) {
		this.connection = new WebSocket(`${url}/${app.currentImage.id}`);
		this.registerEvents();
	}
	registerEvents() {
		this.connection
			.addEventListener('message', this.checkType);
	}	
	checkType(e) {
		const data = JSON.parse(e.data),
			  {event} = data,
			  {canvasElement} = app.canvas;
		console.log(event)
		if(event === 'comment') {			
			const needingForm = isNeedNewForm(data.comment);
			if(!needingForm) {				
				addCommentForm(data.comment);								
			} else {				
				addComment(needingForm, data.comment);
			}
		}
		if(event === 'pic') {		
			const comments = [];				
			for(let key in data.pic.comments) {	
				comments.push(data.pic.comments[key])
			}
			comments.forEach(addCommentForm);	
			if(data.pic.mask) {
				canvasElement.style.background = `url(${data.pic.mask})`;
			}		
		}
		if(event === 'mask') {			
			canvasElement.style.background = `url(${data.url})`;
		}
		function isNeedNewForm(data) {
			return document
				.querySelector(`[style*="left: ${data.left}px; top: ${data.top}px;"]`);
		}
	}
}

class Canvas {
	constructor() {	
		this.canvasElement = document.createElement('canvas');		
		this.canvasElement.width = app.currentImage.offsetWidth;
		this.canvasElement.height = app.currentImage.offsetHeight;		
		this.canvasElement.classList.add('current-image');
		appContainer.appendChild(this.canvasElement);
		this.ctx = this.canvasElement.getContext('2d');
		this.penColor = '#6ebf44';
		this.registerEvents();
	}	
	registerEvents() {
		this.canvasElement
			.addEventListener('mousedown', prepareToDraw);		
	}		
		
}

const appContainer = document.querySelector('.app')
const menu = document.querySelector('.menu');
let menuWidth = menu.offsetWidth;
const app = new App();
app.currentImage.src = '';
const commentTemplate = document
	  	.querySelector('.comments__form');

/*document.querySelector('.comments__form')
	.remove();*/

let urlString = `${window.location.href}`;
let url = new URL(urlString);
let paramId = url.searchParams.get('id');
urlId();

function urlId() {
	if (!paramId) { return;	}
	getImage(paramId);
	showCommentMenu();
}

// MENU

window.addEventListener('resize', (e) => {		
	if(app.menu.menuContainer.offsetLeft + menuWidth > window.innerWidth) {
		app.menu.menuContainer.style.left = `${window.innerWidth - menuWidth}px`;
	}
	if(app.menu.menuContainer.offsetTop + app.menu.menuContainer.offsetHeight > window.innerHeight) {
		app.menu.menuContainer.style.top = `${window.innerHeight - app.menu.menuContainer.offsetHeight}px`;
	}
	app.menu.menuContainer.style.left = `${Math.max(app.menu.menuContainer.offsetLeft, 0)}px`;
	app.menu.menuContainer.style.top = `${Math.max(app.menu.menuContainer.offsetTop, 0)}px`;	
})

function showDrawMenu() {		
	app.menu.selectMenuMode(app.menu.drawElement);
	app.menu.isDrawMenuOpen = true;
}

function showMainMenu() {
	app.menu.menuContainer.dataset.state = 'default';
	app.menu.burgerElement.style.display = '';
	Array.from(app.menu.menuContainer.children)
		.filter(el => el.dataset.state)
		.forEach(el => el.dataset.state = '');
	document.removeEventListener('click', addCommentForm);
	app.menu.isDrawMenuOpen = false;
}

function showCommentMenu() {		
	app.menu.selectMenuMode(app.menu.commentsElement);
	document.addEventListener('click', addCommentForm);
}

function showShareMenu() {
	app.menu.selectMenuMode(app.menu.shareElement);
	document.querySelector('.menu__url')
		.value = fileUrl;
}	

function moveMenu(event) {
	const coords = getCoords(app.menu.menuContainer),
		  shiftX = event.pageX - coords.left,
		  shiftY = event.pageY - coords.top,
		  maxX = window.innerWidth - app.menu.menuContainer.offsetWidth - 1,
		  maxY = window.innerHeight - app.menu.menuContainer.offsetHeight;
		
	moveAt(event);			

	function moveAt(event) {				  
		let left = event.pageX - shiftX,
			top = event.pageY - shiftY;  
			
		left = Math.min(left, maxX);
		top = Math.min(top, maxY);
		left = Math.max(left, 0);
		top = Math.max(top, 0);			
			
		app.menu.menuContainer.style.left = `${left}px`;
		app.menu.menuContainer.style.top = `${top}px`;
	}
		
	document.addEventListener('mousemove', moveAt);
	app.menu.menuContainer.addEventListener('mouseup', removeDrag);

	function removeDrag(event) {
		document.removeEventListener('mousemove', moveAt);
		app.menu.menuContainer.removeEventListener('mouseup', removeDrag);
		// save position
		localStorage.left = event.pageX - shiftX;
		localStorage.top = event.pageY - shiftY;
	}	

	function getCoords(elem) {
		const box = elem.getBoundingClientRect();
		return {
			top: box.top + pageYOffset,
			left: box.left + pageXOffset,			
		}
	}		
}	

function onFilesDrop(event) {
	event.preventDefault();	
	const file = Array.from(event.dataTransfer.files)[0];		
	if(file.type !== 'image/jpeg'
	&& file.type !== 'image/png') {
		app.error.style.display = '';
		return;
	}	
	app.error.style.display = 'none';
	sendImage(file);		
}	

function addInputEl() {
	const input = document.createElement('input');
	const error = appContainer.querySelector('.error')
		.style.display = 'none';

	input.id = 'fileInput';
	input.type = 'file';
	input.accept = 'image/jpeg, image/png';	

	app.menu.menuContainer.appendChild(input);

	document.querySelector('#fileInput').addEventListener('change', event => {
		const file = Array.from(event.currentTarget.files)[0];		
		sendImage(file);
	})

	input.click();
	app.menu.menuContainer.removeChild(input);
}

function sendImage(file) {
	const formData = new FormData();
	formData.append('title', removeExtension(file.name));
	formData.append('image', file)	
	app.imageLoader.hidden = false;	
	fetch('https://neto-api.herokuapp.com/pic', {
		body: formData,
		credentials: 'same-origin',
		method: 'POST'
	})		
	.then(res=>res.json())
	.then(res=>getImage(res.id));

	function removeExtension(str) {
		return str.replace(/\.[^.]+$/gi, '');
	}
}

function getImage(id) {
	fetch(`https://neto-api.herokuapp.com/pic/${id}`)
		.then(res=>res.json())	
		.then(setCurrentImage);		
	
	fileUrl = `${window.location.origin}${window.location.pathname}?id=${id}`;
	showShareMenu();	

	function setCurrentImage(img) {
		app.currentImage.src = img.url;
		app.currentImage.id = id;
	}	
}	

function toogleComments() {
	if(!app.menu.toogleCommentsInputCheck) {
		hideComments();	
	} else {
		showComments();
	}
	app.menu.toogleCommentsInputCheck = !app.menu.toogleCommentsInputCheck;		
}

function copyLink() {
	document.querySelector('.menu__url').select();
	document.execCommand('copy');
	window.getSelection().removeAllRanges();
}

// COMMENTS

function sendComment(event) {
	event.preventDefault();
		
	const left = this.commentForm.offsetLeft,
		  top = this.commentForm.offsetTop;	

	let message = this.commentInput.value;	
	message = `message=${encodeURIComponent(message)}&left=${encodeURIComponent(left)}&top=${encodeURIComponent(top)}`;
		
	this.commentsBody.insertBefore(this.commentLoader, this.commentInput);
	fetch(`https://neto-api.herokuapp.com/pic/${app.currentImage.id}/comments`, {
		method: 'POST',
		body: message,
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded'
		}
	}).then(() => {
		this.commentInput.value = '';
		this.commentsBody.removeChild(this.commentLoader);
	})				
}	

function addComment(form, data) {
	const {message} = data,
		  {timestamp} = data;
	
	const time = new Date(timestamp).toLocaleString("ru");					
	const commentsList = form.querySelector('.comments__body');		
	const newComment = new Comment().messageElement;

	newComment.querySelector('.comment__time').textContent = time;
	newComment.querySelector('.comment__message').textContent = message;
	commentsList.insertBefore(newComment, commentsList.querySelector('.comments__input'));		
}	

function addCommentForm(event) {		
	if(event.target) {
		if(!event.target.classList.contains('current-image')) {return};
		if(app.menu.toogleCommentsInputCheck) {return};
	}
	const commentForm = new Comment()
		.commentForm;		
	const left = event.pageX ? event.pageX : event.left,
		  top = event.pageY ? event.pageY : event.top;	
	 commentForm.style.left = `${left}px`;
	 commentForm.style.top = `${top}px`;	
	 commentForm.style.zIndex = 2; 
	appContainer.appendChild( commentForm );	
	const {message} = event;
	if(message) {
		addComment(commentForm, event);
	}
	if(app.menu.toogleCommentsInputCheck) {
		commentForm.style.display = 'none';
	}
}
	
function checkMarkerState(event) {		
	if(!this.checkbox.checked) {
		event.preventDefault();
	}
	if(app.currentComment) {
		app.currentComment.checked = false;
		if(!app.currentComment.querySelector('comment')) {
			app.currentComment.closest('.comments__form').remove();
		}
	}

	app.currentComment = event.target;	
	app.currentComment.checked = true;	
	Array.from(document.querySelectorAll('.comments__form'))
		.forEach(comment => {
			comment.style.zIndex = 2
		})
	event.target.closest('.comments__form')		
		.style.zIndex = 3;		
}

function closeCommentsBody() {
	this.checkbox.checked = false;
	if(!this.commentForm.querySelector('.comment')) {
		this.commentForm.remove();
	}
}
	
function showComments() {
	Array.from(document
		.querySelectorAll('.comments__form'))
		.forEach(comment => {
			comment.style.display = '';
		})
}
	
function hideComments() {
	Array.from(document
		.querySelectorAll('.comments__form'))
		.forEach(comment => {
			comment.style.display = 'none';
		})
}	

// CANVAS

function changePenColor(event) {
	if(!event.target.classList.contains('menu__color')) {return};
	app.canvas.penColor = getComputedStyle(event.target.nextElementSibling).backgroundColor;
}

function prepareToDraw(event) {
	if(!app.menu.isDrawMenuOpen) {return};
	const trottledSendMask = throttleCanvas(sendMask, 1000);
	const ctx = app.canvas.ctx;

	ctx.lineWidth = 4;
	ctx.strokeStyle = app.canvas.penColor;
	ctx.beginPath();
	app.canvas.canvasElement.addEventListener('mousemove', draw);
	app.canvas.canvasElement.addEventListener('mouseup', () => {
		app.canvas.canvasElement.removeEventListener('mousemove', draw);							
	});

	function draw(event) {			
		ctx.lineJoin = ctx.lineCap = 'round';			
		ctx.lineTo(event.offsetX, event.offsetY);
		ctx.stroke();
		trottledSendMask();			
	}

	function sendMask() {
		app.canvas.canvasElement.toBlob(blob => app.ws.connection.send(blob));
	}
}
	
function throttleCanvas(callback, delay) {
	let isWaiting = false;
	return function () {
		if (!isWaiting) {
			isWaiting = true;
			setTimeout(() => {
				callback();
				isWaiting = false;
			}, delay);
		}
	}
}