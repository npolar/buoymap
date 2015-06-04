var globe, buoyList = [], buoyListElem = document.getElementById('buoyList'), ui, infoItem, infoCBIndex = null;

globe = new glacier.GlobeScene('scene', {
	background:			glacier.color.BLACK,
	texture: 			'gfx/earth.jpg',
	nightTexture:		'gfx/earth_night.jpg',
	normalMap:			'gfx/normal_bathymetry.jpg'
});

globe.bindMouse({ zoomMax: 3.0, zoomSteps: 20 });
globe.run();


// Set up info item
(function () {
	infoItem = document.getElementById('itemInfo');
	infoItem.move = function(latLng) {
		var worldPos = globe.latLngToPoint(latLng),
				screenPos = globe.context.worldToScreen(worldPos.multiply(globe.base.matrix));

				infoItem.style.left = (screenPos.x - (infoItem.offsetWidth / 2)) + 'px';
				infoItem.style.top = (screenPos.y - (infoItem.offsetHeight + 10)) + 'px';
	};
})();

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
			ui.focusItem(item);
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
				buoyListElem.checkbox.dispatchEvent(new Event('change'));
			});
		});
		button.classList.remove('hidden');
	},
	focusItem: function (dataItem) {
		//infoItem.innerHTML = dataItem.time;
		infoItem.querySelector('h4').innerHTML = dataItem.name;
		var dl = infoItem.querySelector('dl'), child;

		while((child = dl.lastChild)) {
			dl.removeChild(child);
		}

		for (var prop in dataItem.properties) {
			if (['title', '_id', 'id', '_rev', 'schema', 'links', 'sequence'].indexOf(prop) == -1) {
				var dt = document.createElement('dt');
				var dd = document.createElement('dd');
				dt.innerHTML = prop;
				dd.innerHTML = dataItem.properties[prop];
				dl.appendChild(dt);
				dl.appendChild(dd);
			}
		}

		dataItem.properties.links.forEach(function (link) {
			var dt = document.createElement('dt');
			var dd = document.createElement('dd');
			var a = document.createElement('a');
			dt.innerHTML = link.title;
			a.href = link.href;
			a.target = '_blank';
			a.innerHTML = link.href;
			dd.appendChild(a);
			dl.appendChild(dt);
			dl.appendChild(dd);
		});

		infoItem.style.color = dataItem.color;

		globe.focus(dataItem.position, function(latLng) {
			if(infoCBIndex !== null) {
				globe.runCallbacks.splice(infoCBIndex, 1);
			}

			infoCBIndex = globe.runCallbacks.push(function (dtime) {
				infoItem.move(latLng);
			}) - 1;
			infoItem.classList.remove('hidden');
		});
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
				properties: last.properties,
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
				ui.focusItem(dataItem);
			}
		});
	});

});
