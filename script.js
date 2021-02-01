'use strict';

const BASE_URL = 'http://localhost:8080';

let data = [];


const map = L.map('map').setView([60.173079, 24.925146], 13);

const favouriteIcon = L.icon({
    iconUrl: 'img/favourite.svg',
    iconSize: [36, 36]
});

const defaultIcon = L.icon({
    iconUrl: 'img/default.svg',
    iconSize: [36, 36]
});

const lastRemoved = {};

let markers = [];

L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
	maxZoom: 18,
	attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, ' +
	             'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
	id: 'mapbox/streets-v11',
	tileSize: 512,
	zoomOffset: -1
}).addTo(map);

function render() {
	markers.forEach(marker => map.removeLayer(marker));
	markers = [];
	data.filter(item => item != null)
	    .forEach(item => markers.push(L.marker(item.coords, {title: item.title, icon: item.favourite ? favouriteIcon : defaultIcon})
	                                   .addTo(map)
	                                   .bindPopup('<b>'+item.title+'</b><br />'+item.description+'<br />'+
	                                   item.open+' - '+item.close+
	                                   '<br />Keywords: '+item.keywords.join(', ')+'<br />'+
	                                   '<i class="material-icons" onclick="edit('+item.id+')" style="cursor:pointer">mode_edit</i>'+
		                               '<i class="material-icons" onclick="remove('+item.id+')" style="cursor:pointer">delete_outline</i>')));
	updateResults();
}

getAll();

function addPoint(e) {
	dialog.showModal();
	
	document.querySelector('#lat').value = e.latlng.lat;
	document.querySelector('#lng').value = e.latlng.lng;
	document.querySelector('#id').value = '-1';
	document.querySelector('#title').value = '';
	document.querySelector('#title').parentNode.classList.remove('is-dirty');
	document.querySelector('#description').value = '';
	document.querySelector('#description').parentNode.classList.remove('is-dirty');
	document.querySelector('#open').value = '09:00';
	document.querySelector('#open').parentNode.classList.add('is-dirty');
	document.querySelector('#close').value = '21:00';
	document.querySelector('#close').parentNode.classList.add('is-dirty');
	document.querySelector('#keywords').value = '';
	document.querySelector('#keywords').parentNode.classList.remove('is-dirty');
	if (document.querySelector('#favourite').checked) document.querySelector('#favourite').click();
}

map.on('click', addPoint);


function getAll() {
	fetch(BASE_URL+'/getall').then(response => response.json()).then(content => {
		data = Array.from(content);
		render();
	});
}

function remove(id) {
	for (let i=0; i<data.length; i++) {
		if ((data[i] != null) && (id == data[i].id)) {
			Object.assign(lastRemoved, data[i]);
			delete data[i];
		}
	}
	document.querySelector('#removed').MaterialSnackbar.showSnackbar({
		message: '"'+lastRemoved.title+'" has been removed', 
		timeout: 4000,
		actionHandler: undo,
		actionText: 'Undo'
	});
	
	render();
	fetch(BASE_URL+'/delete?id='+id);
}

function undo() {
	data[lastRemoved.id] = {};
	Object.assign(data[lastRemoved.id], lastRemoved);
	document.querySelector('#removed').classList.remove('mdl-snackbar--active');
	
	render();
	fetch(BASE_URL+'/restore?'+encode(lastRemoved));
}

function reset() {
	fetch(BASE_URL+'/reset').then(response => response.json()).then(() => getAll());
}

function encode(obj) {
	let result = [];
	for (let prop in obj) {
		if (obj.hasOwnProperty(prop)) {
			result.push(encodeURIComponent(prop)+'='+encodeURIComponent(obj[prop]));
		}
	}
	
	return result.join('&');
}


function edit(id) {
	const point = data.filter(item => (item != null) && (item.id == id))[0];
	dialog.showModal();
	document.querySelector('#lat').value = point.coords[0];
	document.querySelector('#lng').value = point.coords[1];
	document.querySelector('#id').value = point.id;
	document.querySelector('#title').value = point.title;
	document.querySelector('#title').parentNode.classList.add('is-dirty');
	document.querySelector('#description').value = point.description;
	document.querySelector('#description').parentNode.classList.add('is-dirty');
	document.querySelector('#open').value = point.open;
	document.querySelector('#open').parentNode.classList.add('is-dirty');
	document.querySelector('#close').value = point.close;
	document.querySelector('#close').parentNode.classList.add('is-dirty');
	document.querySelector('#keywords').value = point.keywords.join(' ');
	document.querySelector('#keywords').parentNode.classList.add('is-dirty');
	if ((document.querySelector('#favourite').checked) && (!point.favourite)) document.querySelector('#favourite').click();
	if ((!document.querySelector('#favourite').checked) && (point.favourite)) document.querySelector('#favourite').click();
}

function updateResults() {
	document.querySelector('#results').innerHTML = '';
	if ((document.querySelector('#search').value == '') && (document.querySelector('#filter').value == '')) return;
	
	const filtered = data.filter(item => item != null)
	                     .filter(item => item.title.toLowerCase().indexOf(document.querySelector('#search').value.toLowerCase()) >= 0)
	                     .filter(item => document.querySelector('#filter').value == '' ? true : item.keywords.indexOf(document.querySelector('#filter').value.toLowerCase()) >= 0)
	                     .filter(item => document.querySelector('#opened').checked ? checkTime(item.open, item.close) : true)
	                     .filter(item => document.querySelector('#only-favourites').checked ? (item.favourite ? true: false) : true);
	
	for (let i=0; i<filtered.length; i++) {
		const result = document.createElement('div');
		result.className = 'result';
		result.innerHTML = (filtered[i].favourite ? '<span class="menu-favourite">&heartsuit;</span>' : '')+
		                   '<span class="menu-title" onclick="map.flyTo(L.latLng('+filtered[i].coords[0]+','+filtered[i].coords[1]+'))">'+filtered[i].title+'</span>'+
		                   '<div class="menu-buttons"><i class="material-icons" onclick="edit('+filtered[i].id+')">mode_edit</i>'+
		                   '<i class="material-icons" onclick="remove('+filtered[i].id+')">delete_outline</i></div>'+
		                   '<br />'+filtered[i].description+
		                   '<br />('+filtered[i].open+'-'+filtered[i].close+')';
		
		document.querySelector('#results').appendChild(result);
	}
}

function checkTime(start, end) {
	const openTime = start.split(':').map(str => parseInt(str)).reduce((a, b) => a*60+b, 0);
	const currentTime = new Date().getHours()*60 + new Date().getMinutes();
	const closeTime = end.split(':').map(str => parseInt(str)).reduce((a, b) => a*60+b, 0);
	if ((openTime <= currentTime) && (currentTime <= closeTime)) return true;
	return false;
}

function validateTime() {
	const open = document.querySelector('#open').value;
	const close = document.querySelector('#close').value;
	
	if ((open.split(':').length != 2) || (close.split(':').length != 2)) return false;
	
	const openHours = parseInt(open.split(':')[0]);
	const openMinutes = parseInt(open.split(':')[1]);
	const openTime = openHours*60 + openMinutes;
	const closeHours = parseInt(close.split(':')[0]);
	const closeMinutes = parseInt(close.split(':')[1]);
	const closeTime = closeHours*60 + closeMinutes;
	if ((openHours < 0) || (openHours > 23) || (openMinutes < 0) || (openMinutes > 59) || 
	   (closeHours < 0) || (closeHours > 23) || (closeMinutes < 0) || (closeMinutes > 59)) return false;
	if (openTime >= closeTime) return false;
	
	return true;
}

const dialog = document.querySelector('dialog');
if (!dialog.showModal) {
   dialogPolyfill.registerDialog(dialog);
}

dialog.querySelector('#close-dialog').addEventListener('click', function() {
    dialog.close();
});

dialog.querySelector('#save').addEventListener('click', function() {
	if (!validateTime()) {
		document.querySelector('#error').MaterialSnackbar.showSnackbar({message: 'Wrong time: opening must be before closing'})
		return false;
	}
	if (document.querySelector('#id').value == '-1') {
		//create new point and send it to the backend
		const newPoint = {
			id: data.filter(item => item != null).map(item => item.id).sort((a, b) => b-a)[0] + 1,
			title: document.querySelector('#title').value,
			description: document.querySelector('#description').value,
			coords: [parseFloat(document.querySelector('#lat').value), parseFloat(document.querySelector('#lng').value)],
			open: document.querySelector('#open').value,
			close: document.querySelector('#close').value,
			keywords: document.querySelector('#keywords').value.toLowerCase().split(' '),
			favourite: document.querySelector('#favourite').checked
		};
		data.push(newPoint);
		
		render();
		
		fetch(BASE_URL+'/create?'+encode(newPoint));
	}
	else {
		//update existing point and send it to the backend
		const updatedPoint = {
			id: parseInt(document.querySelector('#id').value),
			title: document.querySelector('#title').value,
			description: document.querySelector('#description').value,
			coords: [parseFloat(document.querySelector('#lat').value), parseFloat(document.querySelector('#lng').value)],
			open: document.querySelector('#open').value,
			close: document.querySelector('#close').value,
			keywords: document.querySelector('#keywords').value.toLowerCase().split(' '),
			favourite: document.querySelector('#favourite').checked
		};
		for (let i=0; i<data.length; i++) {
			if ((data[i] != null) && (data[i].id == document.querySelector('#id').value)) {
				Object.assign(data[i], updatedPoint);
			}
		}
		
		render();
		
		fetch(BASE_URL+'/update?'+encode(updatedPoint));
	}
	dialog.close();
});
