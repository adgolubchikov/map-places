'use strict';

const http = require('http');
const url = require('url');
const fs = require('fs');

let data = JSON.parse(fs.readFileSync('data.json'));

http.createServer((req,res) => {
	const action = req.url.split('?')[0];
	res.writeHead(200,{'Content-Type':'application/json', 'Access-Control-Allow-Origin': '*'});
	switch (action) {
		case '/getall':
		res.write(JSON.stringify(data));
		break;
		case '/':
		res.write('"Wrong request"');
		break;
		case '/create':
		data.push(decode(req.url.split('?')[1]));
		fs.writeFileSync('data.json', JSON.stringify(data));
		res.write('"Done"');
		break;
		case '/restore':
		const restoredPoint = decode(req.url.split('?')[1]);
		data[restoredPoint.id] = {};
		Object.assign(data[restoredPoint.id], restoredPoint);
		fs.writeFileSync('data.json', JSON.stringify(data));
		res.write('"Done"');
		break;
		case '/update':
		const updatedPoint = decode(req.url.split('?')[1]);
		for (let i=0; i<data.length; i++) {
			if ((data[i] != null) && (data[i].id == updatedPoint.id)) {
				Object.assign(data[i], updatedPoint);
			}
		}
		fs.writeFileSync('data.json', JSON.stringify(data));
		res.write('"Done"');
		break;
		case '/delete':
		for (let i=0; i<data.length; i++) {
			if ((data[i] != null) && (data[i].id == parseInt(req.url.split('?')[1].split('=')[1]))) {
				delete data[i];
			}
		}
		fs.writeFileSync('data.json', JSON.stringify(data));
		res.write('"Done"');
		break;
		case '/reset':
		data = JSON.parse(fs.readFileSync('default.json'));
		fs.writeFileSync('data.json', JSON.stringify(data));
		res.write('"Database restored to default"');
		break;
	}
	
    res.end();
    
}).listen(8080);

function decode(str) {
	let result = {};
	const arr = str.split('&');
	for (let i in arr) {
		result[decodeURIComponent(arr[i].split('=')[0])] = decodeURIComponent(arr[i].split('=')[1]);
	}
	
	result.id = parseInt(result.id);
	result.coords = result.coords.split(',').map(coordinate => parseFloat(coordinate));
	result.keywords = result.keywords.split(',');
	result.favourite = result.favourite == 'true' ? true : false;
	
	return result;
}
