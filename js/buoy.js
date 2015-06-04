var globe, dataList = [], buoyList = document.getElementById('buoyList');

globe = new glacier.GlobeScene('scene', {
	background:			glacier.color.BLACK,
	texture: 			'gfx/earth.jpg',
	nightTexture:		'gfx/earth_night.jpg',
	normalMap:			'gfx/normal_bathymetry.jpg'
});

globe.bindMouse({ zoomMax: 3.0, zoomSteps: 20 });
globe.run();

[
	300234060669770,
	300234060695050,
	300234060690060,
	300234061762880,
	300234061760870,
	300234060666760,
	300234062447650,
	300234011090780,
	300234062426060,
	300234062424060
].forEach(function(imei) {
	var color = new glacier.Color(imei % 0xFFFFFF);
	
	globe.addData('http://api.npolar.no/oceanography/buoy/?q=&format=geojson&limit=all&sort=measured&filter-IMEI=' + imei, color, function(url, data) {
		var features = data.features, first = features[0], last = features[features.length - 1], listItem, dataItem;
		
		dataList.push({
			name: last.properties.title,
			imei: last.properties.IMEI,
			time: last.properties.measured,
			data: data,
			color: color.toHtmlString(),
			position: new glacier.Vector2(last.properties.longitude, last.properties.latitude)
		});
		
		dataItem = dataList[dataList.length - 1];
		listItem = document.createElement('LI');
		listItem.style.color = dataItem.color;
		listItem.style.cursor = 'pointer';
		listItem.innerHTML = dataItem.name;
		listItem.addEventListener('click', function() { globe.focus(dataItem.position); });
		buoyList.appendChild(listItem);
	});
});
