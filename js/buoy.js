var globe, buoyList = [], buoyListElem = document.getElementById('buoyList');

globe = new glacier.GlobeScene('scene', {
	background:			glacier.color.BLACK,
	texture: 			'gfx/earth.jpg',
	nightTexture:		'gfx/earth_night.jpg',
	normalMap:			'gfx/normal_bathymetry.jpg'
});

globe.bindMouse({ zoomMax: 3.0, zoomSteps: 20 });
globe.run();

glacier.load('http://api.npolar.no/oceanography/buoy/?q=&facets=IMEI&size-facet=99&format=json&limit=0', function(data) {
	var imeis = [];
	data = JSON.parse(data);
	
	data.feed.facets[0].IMEI.forEach(function(imei) {
		imeis.push(imei.term);
	});
	
	imeis.forEach(function(imei) {
		var color = new glacier.Color(imei % 0xFFFFFF);
		
		globe.addData('http://api.npolar.no/oceanography/buoy/?q=&format=geojson&limit=all&sort=measured&filter-IMEI=' + imei, color, function(url, data) {
			var features = data.features, first = features[0], last = features[features.length - 1], listItem, dataItem;
			
			buoyList.push({
				name: last.properties.title,
				imei: last.properties.IMEI,
				time: last.properties.measured,
				data: data,
				color: color.toHtmlString(),
				position: new glacier.Vector2(last.properties.longitude, last.properties.latitude)
			});
			
			dataItem = buoyList[buoyList.length - 1];
			listItem = document.createElement('LI');
			listItem.style.color = dataItem.color;
			listItem.style.cursor = 'pointer';
			listItem.innerHTML = dataItem.name;
			listItem.addEventListener('click', function() { globe.focus(dataItem.position); });
			buoyListElem.appendChild(listItem);
		});
	});
});
