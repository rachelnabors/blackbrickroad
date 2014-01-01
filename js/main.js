(function(){ // keep that global space clear-tastic!
	"use strict";
	
	// drag and drop 
	var dragSrcEl,
		draggedItem,
		iBelong;
	var messies = document.getElementById("messy-items");
	//getElementsByTagName() refers to a live list of nodes, saving memory + leaks.
	var items = messies.getElementsByTagName('li');
	var places = document.getElementById("item-places");
	var itemPlaces = places.getElementsByTagName('li'); 

	// Provide an array of items you want. Make them locations and insert into DOM.
	var itemsList = ['boot2','bottle1','oilcan','blanket','pillow3','chair1','tablecloth','bucket','bottle2','mug1','mug2','washboard','bottle3','pitcher','shovel','firewood4','firewood5','firewood2','firewood3','ovenfork','tools','socks','pillow1','sack1','firewood6','samovar','boot1','cloak','rifle','axe','firewood1','rug','stool','shoe1','shoe2','pillowup1','books','telescope','toy','musicbox','broom','pot1','pot2','pot3','pot4','scoop'];
	var tempList = document.createDocumentFragment(); // put the fragments in this then paste them for speed

	/* The To Do List */

	var toCleanList = document.getElementById("to-clean");
	var toCleanListItems = toCleanList.getElementsByTagName('li');
	var multiItemsToClean = [];
	var singleItemsToClean = [];
	[].forEach.call(toCleanListItems, function(item) {
		// if the item has an attribute that lists more than one item
		if (item.getAttribute("data-items")) {
			multiItemsToClean.push(item); 
		} else {
			singleItemsToClean.push(item); 
		}
	});

	var cleaningSets = {}; // array-like object for each data-for attr on the li's.
	
	(function() { // Immediately invoke function expression to populate cleaningSets
		var uncleanedItem, uncleanedList;
		[].forEach.call(multiItemsToClean, function(item) {
			// returns an array like ["firewood1", "firewood2"]
			uncleanedList = item.getAttribute("data-items").split(";"); 
			// use the name of what the thing is for to...
			uncleanedItem = item.getAttribute("data-for");
			// ...make a property name for the array value to the needsCleaning object
			cleaningSets[uncleanedItem] = uncleanedList;
		});
	}())

	// See if the element's data-item matches any of the toCleanListItems's data-for
	function isSingleSet(item, belongs) {
		var singleItem;
		[].some.call(singleItemsToClean, function(item) {
			if (item.getAttribute("data-for") === belongs){
				// if yes, 
				singleItem = item;
				return true;
			}
			// else if none of them return item, return false
			return false;
		});
		return singleItem
	}

	function taskDone(item){
		var indexOfItem = singleItemsToClean.indexOf(item);
		var singleItem = singleItemsToClean.splice(indexOfItem, 1);
		crossOutItem(singleItem[0]);
	}

	function multiTaskDone(belongs) {
		var itemArray;
		for(var setItem in cleaningSets){
			itemArray = cleaningSets[setItem];
			if (removeFromSet(itemArray, belongs, setItem)) { 
				// when you remove it from the set, stop
				break 
			}
		}
	}

	function crossOutItem(crossMeOut) {
		var text = crossMeOut.childNodes[0].nodeValue; // get the text
		var del = "<del>" + text + "</del>"; // cross it out
		crossMeOut.innerHTML = del; // then paste it over crossMeOut's innerHTML
	}

	function removeFromSet(array, match, setItem) {
		var match = match;
		var indexOfItem;
		return array.some(function(entry) {
			if (entry === match) {
				indexOfItem = array.indexOf(entry);
				array.splice(indexOfItem, 1); // remove the item from its set
				if (array.length <= 0) { // if that was the last item in the set...
					// delete from to-do list... 
					[].some.call(multiItemsToClean, function(item) {
						if (item.getAttribute("data-for") === setItem){
							// if yes, 
							crossOutItem(item);
							return true;
						}
					});
					delete cleaningSets[setItem]; // ...remove it from the cleaningSets
				}
				return true; // then stop the .some by returning true
			}
		});
	}
	/* Setting up the Items */

	// Factory: makes li items
	function createLi(item, target, dataType, img) {
		var image;
		var newLi = document.createElement( 'li' );
		newLi.classList.add(item);
		var dataItem = document.createAttribute('data-' + dataType);
		dataItem.value = item;
		newLi.setAttributeNode(dataItem);
		if (img) {
			image = document.createElement( 'img' );
			image.src = "img/items/" + item + ".png";
			newLi.appendChild(image);
		}
		return newLi;	
	}

	// Factory: makes a list and populates it w/ lis
	function generateLists(target, dataType, listeners, img) {
		[].forEach.call(itemsList, function(item) {
			var newLi = createLi(item, target, dataType, img);
			for (var key in listeners) {
				if (!listeners.hasOwnProperty(key)) {
			        //The current property is not a direct property of p
			        continue;
			    }
				newLi.addEventListener(key, listeners[key], false);
			}
			tempList.appendChild(newLi);
		});
		target.appendChild(tempList);
		tempList.innerHTML = "";
	}

	// Generate list for messies
	generateLists(messies, 'item', {'dragstart': handleDragStart, 'dragend': handleDragEnd}, true);

	// Generate list for places
	generateLists(places, 'belongs', {'dragover': handleDragOver, 'drop': handleDrop});


	/* Dragging and Dropping */

	// Each room contains a bunch of .messy items.
	// If you drag their imgs to their appropriate target divs

	// The .target's should be linked to the .items by data-item and data-belongs = item
	// The .target should get a .droppable class which outlines where it will drop

	// After the drop, .target should get be .cleaned
	// And the messy item's node: removed.

	function handleDragStart(e) {
		dragSrcEl = this;
		draggedItem = dragSrcEl.getAttribute('data-item');
		iBelong = '[data-belongs="' + draggedItem + '"]';
		places.querySelectorAll(iBelong)[0].classList.add('droppable');
		e.dataTransfer.effectAllowed = 'move';
		e.dataTransfer.setData('text/html', this.innerHTML);		
	}

	function handleDragOver(e) {
		if (e.preventDefault) {
			e.preventDefault(); // Allows dropping.
		}

		e.dataTransfer.dropEffect = 'move';  // We want it to move the data

		return false;
	}

	function handleDrop(e) {
		var belongs = this.getAttribute('data-belongs');
		var singleItem = isSingleSet(this, belongs);
	    if(e.preventDefault) { e.preventDefault(); }
	    if(e.stopPropagation) { e.stopPropagation(); }
		// Don't do anything UNLESS we're dropping on the appropriate data-belongs
		if (this.hasAttribute('data-belongs')) {
			if (draggedItem === belongs) {
				// Put the img in the li where it belongs.
				this.innerHTML = e.dataTransfer.getData('text/html');
				this.classList.add("clean");
				// Remove its old parent.
				dragSrcEl.parentNode.removeChild(dragSrcEl);
			}			
		}
		if (singleItem) { // if this matches up w/ an item on the singleItemsToClean
			taskDone(singleItem);
		} else { // if it is a member of a set of items
			multiTaskDone(belongs);
		}
		removeDragClasses();
		return false;
	}

	//when you don't drop what you're dragging
	function handleDragEnd(e) {
		// this/e.target is the source node.
		removeDragClasses();
	}

	function removeDragClasses() {
		[].forEach.call(itemPlaces, function(place) {
			place.classList.remove('droppable');
		});
	}

}());
