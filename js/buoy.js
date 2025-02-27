/* jshint undef: true, unused: true */
/* globals glacier: true */
'use strict';

var globe,
	buoyList = [],
	buoyListElem = document.getElementById('buoyList'),
	ui,
	itemInfo,
	buildItemInfo;

globe = new glacier.GlobeScene('scene', {
	background:			glacier.color.BLACK,
	texture: 			'gfx/earth.jpg',
	nightTexture:		'gfx/earth_night.jpg',
	normalMap:			'gfx/normal_bathymetry.jpg'
});

globe.bindMouse({ zoomMax: 3.0, zoomSteps: 20 });
globe.run();

// itemInfo setup
(function () {
	buildItemInfo = function (dataProps) {
		var  dt, dd, dl, span;

		if (typeof dataProps !== 'object') {
			span = document.createElement('span');
			span.innerHTML = dataProps;
			return span;
		}
		dl = document.createElement('DL');
		// jshint -W089
		for(var prop in dataProps) {
			dt = document.createElement('DT');
			dt.innerHTML = prop;
			dl.appendChild(dt);

			dd = document.createElement('DD');
			dd.appendChild(buildItemInfo(dataProps[prop]));
			dl.appendChild(dd);
		}
		return dl;
	};

	itemInfo = {
		callbackUID: null,
		currentItem: null,
		element: document.getElementById('itemInfo'),
		hide: function() {
			this.element.classList.add('hidden');
		},
		move: function(latLng) {
			var screenPos = globe.latLngToScreen(latLng);

			this.element.style.left = (screenPos.x - (this.element.offsetWidth / 2)) + 'px';
			this.element.style.top = (screenPos.y - (this.element.offsetHeight + 10)) + 'px';
		},
		setProperties: function(properties) {
			var dataDiv = this.element.querySelector('#data'), dataProps = {};

			dataDiv.innerHTML = '';
			for (var prop in properties) {
				if (['buoy', '_id', 'id', '_rev', 'collection', 'schema', 'links', 'sequence', 'created_by', 'created', 'updated', 'updated_by'].indexOf(prop) === -1) {
					dataProps[prop] = properties[prop];
				}
			}

			dataDiv.appendChild(buildItemInfo(dataProps));
		},
		setTitle: function(title, color) {
			var elem = this.element.querySelector('H4');

			elem.innerHTML = title;
			elem.style.color = (color ? color.toHtmlString() : null);
		},
		show: function() {
			this.element.classList.remove('hidden');
		}
	};

	itemInfo.element.querySelector('.close').addEventListener('click', function() {
		itemInfo.hide();
	});
})();

ui = {
	createCheckbox: function(item) {
		var checkbox = document.createElement('INPUT');

		checkbox.type = 'checkbox';
		checkbox.name = item.name;
		checkbox.classList.add('toggle');
		checkbox.checked = true;

		checkbox.toggle = function(event) {
			if(event && (event.target === this)) {
				if(event.target.checked) {
					ui.focusItem(item);
				} else {
					item.data.hide();
				}
			} else {
				if((this.checked = !this.checked)) {
					item.data.show();
				} else {
					item.data.hide();
				}
			}

			if(itemInfo.currentItem === item) {
				if(!this.checked) {
					itemInfo.hide();
				}
			}
		};

		checkbox.addEventListener('change', checkbox.toggle);

		checkbox.check = function() {
			this.checked = true;
			item.data.show();
		};

		checkbox.uncheck = function() {
			this.checked = false;
			item.data.hide();
		};

		return checkbox;
	},
	titleLink: function (item) {
		var a = document.createElement('a');

		a.addEventListener('click', function () {
			ui.focusItem(item);
		});

		a.style.color = item.color.toString();
		a.style.cursor = 'pointer';
		a.innerHTML = item.name;

		return a;
	},
	addButton: function () {
		var button = document.getElementById('toggle');

		button.addEventListener('click', function() {
			buoyList.forEach(function(buoy) {
				buoy.checkbox.toggle();
			});
		});

		button.classList.remove('hidden');
	},
	focusItem: function (dataItem) {
		itemInfo.hide();
		dataItem.checkbox.check();

		itemInfo.currentItem = dataItem;
		itemInfo.setTitle(dataItem.name, dataItem.color);
		itemInfo.setProperties(dataItem.properties);

		globe.focus(dataItem.position, function(latLng) {
			if(itemInfo.callbackUID !== null) {
				globe.removeRunCallback(itemInfo.callbackUID);
			}

			itemInfo.callbackUID = globe.addRunCallback(function() {
				itemInfo.move(latLng);
			});

			itemInfo.show();
		});
	}
};

function addBuoy(geojson) {
	var color = new glacier.Color(Math.random()*0xFFFFFF); // geojson.features[0].buoy % 0xFFFFFF);

	globe.addData(geojson, color, function(uid, data) {
		var features = data.geoJSON.features,
			//first = features[0],
			last = features[features.length - 1],
			listItem,
			buoyItem,
			checkbox;

		buoyList.push({
			name: last.properties.buoy,
			//imei: last.properties.IMEI,
			time: last.properties.measured,
			properties: last.properties,
			data: data,
			color: color,
			position: new glacier.Vector2(last.properties.longitude, last.properties.latitude)
		});

		buoyItem = buoyList[buoyList.length - 1];
		listItem = document.createElement('LI');
		checkbox = ui.createCheckbox(buoyItem);
		buoyItem.checkbox = checkbox;
		listItem.appendChild(checkbox);
		listItem.appendChild(ui.titleLink(buoyItem));
		buoyListElem.appendChild(listItem);
	});
}

function onAddSuccess() {
	ui.addButton();
	ui.focusItem(buoyList[buoyList.length - 1]);
}

(function () {
	glacier.load('//api.npolar.no/oceanography/buoy/?q=&facets=buoy&size-facet=999&format=json&limit=0&filter-quality=1', function(data) {
		var titles = [], buoysAdded = 0;
		data = JSON.parse(data);

		data.feed.facets[0].buoy.forEach(function(buoy) {
                  console.log('buoy', buoy, buoy.term);
	          titles.push(buoy.term);
		});

		titles.sort();

		titles.forEach(function(title) {
			glacier.load('//api.npolar.no/oceanography/buoy/?q=&format=geojson&filter-quality=1&limit=all&sort=measured&filter-buoy=' + title, function(data) {
				addBuoy(JSON.parse(data));

				if(++buoysAdded >= titles.length) {
					onAddSuccess();
				}
			});
		});
	});
})();
