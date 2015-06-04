var globe, buoyList = [], buoyListElem = document.getElementById('buoyList'), ui;

globe = new glacier.GlobeScene('scene', {
	background:			glacier.color.BLACK,
	texture: 			'gfx/earth.jpg',
	nightTexture:		'gfx/earth_night.jpg',
	normalMap:			'gfx/normal_bathymetry.jpg'
});

globe.bindMouse({ zoomMax: 3.0, zoomSteps: 20 });
globe.run();

ui = {
	checkbox: function (item) {
		checkbox = document.createElement('input');
		checkbox.type = 'checkbox';
		checkbox.name = item.name;
		checkbox.className = 'toggle';
		checkbox.checked = true;
		checkbox.addEventListener('change', function (e) {
			if (e.target.checked) {
				item.data.show();
			} else {
				item.data.hide();
			}
		});
		return checkbox;
	},
	titleLink: function (item) {
		a = document.createElement('a');
		a.addEventListener('click', function (e) {
			globe.focus(item.position);
		});
		a.style.color = item.color;
		a.style.cursor = 'pointer';
		a.innerHTML = item.name;
		return a;
	},
	addButton: function () {
		var button = document.getElementById('toggle');
		button.addEventListener('click', function (e) {
			buoyList.forEach(function (buoyListElem) {
				buoyListElem.checkbox.checked = !buoyListElem.checkbox.checked;
				// Create a new 'change' event
				var event = new Event('change');
				// Dispatch it.
				buoyListElem.checkbox.dispatchEvent(event);
			});
		});
		button.className = 'myButton';
	}
};

glacier.load('http://api.npolar.no/oceanography/buoy/?q=&facets=IMEI&size-facet=99&format=json&limit=0', function(data) {
	var imeis = [], nrLoaded = 0;
	data = JSON.parse(data);

	data.feed.facets[0].IMEI.forEach(function(imei) {
		imeis.push(imei.term);
	});

	imeis.forEach(function(imei) {
		var color = new glacier.Color(imei % 0xFFFFFF);

		globe.addData('http://api.npolar.no/oceanography/buoy/?q=&format=geojson&limit=all&sort=measured&filter-IMEI=' + imei, color, function(url, data) {
			var features = data.geoJSON.features, first = features[0], last = features[features.length - 1], listItem, dataItem, checkbox;

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
			checkbox = ui.checkbox(dataItem);
			dataItem.checkbox = checkbox;
			listItem.appendChild(checkbox);
			listItem.appendChild(ui.titleLink(dataItem));
			buoyListElem.appendChild(listItem);

			if (++nrLoaded === imeis.length) {
				ui.addButton();
				globe.focus(dataItem.position);
			}
		});
	});

});
