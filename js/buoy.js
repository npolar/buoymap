var globe,
	buoyList = [],
	buoyListElem = document.getElementById('buoyList'),
	ui,
	itemInfo;

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
			var child, dl = this.element.querySelector('DL'), dt, dd;
			
			while((child = dl.lastChild)) {
				dl.removeChild(child);
			}
			
			for(prop in properties) {
				if (['title', '_id', 'id', '_rev', 'schema', 'links', 'sequence'].indexOf(prop) == -1) {
					dt = document.createElement('DT');
					dt.innerHTML = prop;
					dl.appendChild(dt);
					
					dd = document.createElement('DD');
					dd.innerHTML = properties[prop];
					dl.appendChild(dd);
				}
			}
			/*
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
			*/
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
		}
		
		return checkbox;
	},
	titleLink: function (item) {
		var a = document.createElement('a');
		
		a.addEventListener('click', function (e) {
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
			
			itemInfo.callbackUID = globe.addRunCallback(function(dtime) {
				itemInfo.move(latLng);
			});
			
			itemInfo.show();
		});
	}
};

function addBuoy(geojson) {
	var color = new glacier.Color(geojson.features[0].properties.IMEI % 0xFFFFFF);
	
	globe.addData(geojson, color, function(uid, data) {
		var features = data.geoJSON.features,
			first = features[0],
			last = features[features.length - 1],
			listItem,
			buoyItem,
			checkbox;
		
		buoyList.push({
			name: last.properties.title,
			imei: last.properties.IMEI,
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
};

function onAddSuccess() {
	ui.addButton();
	ui.focusItem(buoyList[buoyList.length - 1]);
}

(function () {
	glacier.load('//api.npolar.no/oceanography/buoy/?q=&facets=IMEI&size-facet=99&format=json&limit=0', function(data) {
		var imeis = [], buoysAdded = 0;
		data = JSON.parse(data);
		
		data.feed.facets[0].IMEI.forEach(function(imei) {
			imeis.push(imei.term);
		});
		
		imeis.forEach(function(imei) {
			glacier.load('//api.npolar.no/oceanography/buoy/?q=&format=geojson&limit=all&sort=measured&filter-IMEI=' + imei, function(data) {
				addBuoy(JSON.parse(data));
				
				if(++buoysAdded >= imeis.length) {
					onAddSuccess();
				}
			});
		});
	});
})();
