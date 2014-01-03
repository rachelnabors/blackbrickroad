(function(){
	"use strict";

	document.addEventListener('DOMContentLoaded', function(){

		// <Rod> it's a matter of taste, I prefer var a; var b; var c; 
		// and if they're simply declared but not inicalized, they go in-line.
		// That said, why are these variables "global to the module"?
		// </Rod>
		var dragSrcEl,
			draggedItem,
			iBelong;
		var messies = document.getElementById("messy-items");
		//getElementsByTagName() refers to a live list of nodes, a HTMLCollection.
		var items = messies.getElementsByTagName('li');
		var places = document.getElementById("item-places");
		var itemPlaces = places.getElementsByTagName('li'); 

		// Make an array of items you want. Here we split a string into an array.
		var itemsList = 'boot2 bottle1 oilcan blanket pillow3 chair1 tablecloth bucket bottle2 mug1 mug2 washboard bottle3 pitcher shovel firewood4 firewood5 firewood2 firewood3 ovenfork tools socks pillow1 sack1 firewood6 samovar boot1 cloak rifle axe firewood1 rug stool shoe1 shoe2 pillowup1 books telescope toy musicbox broom pot1 pot2 pot3 pot4 scoop'.split(' ');
		
		// container to collect DOM Elements so we don't have to touch the DOM too often
		var tempList = document.createDocumentFragment();

		// // Handy way to call Array's forEach method on array-like objects
		// // More on this: http://stackoverflow.com/questions/16053357/what-does-foreach-call-does-in-javascript
		// function forEach( list, callback ) {
		//     Array.prototype.forEach.call( list, callback );
		// }

		/* The To Do List */

		var toCleanList = document.getElementById("to-clean");
		var toCleanListItems = toCleanList.getElementsByTagName('li');
		var multiItemsToClean = [];
		var singleItemsToClean = [];
		// <Rod> you explain a NodeList, but not this array-abuse? </Rod>


		[].forEach.call(toCleanListItems, function(item) {
			// if the item has an attribute that lists more than one item
			if (item.getAttribute("data-items")) {
				multiItemsToClean.push(item); 
			} else {
				singleItemsToClean.push(item); 
			}
		});

		var cleaningSets = {}; // hash/lookup table object for each data-for attr on the li's.
		
		// <Rod> Why is this an IIFE? </Rod>
		(function() { // Immediately invoke function expression to populate cleaningSets
			// <Rod> I'm not a language expert, but doesn't "dirty" sound better than "unclean"? </Rod>
			var uncleanedItem, uncleanedList;
			[].forEach.call(multiItemsToClean, function(item) {
				// returns an array like ["firewood1", "firewood2"]
				// <Rod> this breaks if data-items="" doesn't exist, getAttribute() returns null in that case </Rod>
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
			// <Rod> for mutliItems you create a map, for singleItems you don't, why? </Rod>
			[].some.call(singleItemsToClean, function(item) {
				if (item.getAttribute("data-for") === belongs){
					// if yes, 
					singleItem = item;
					return true;
				}
				// else if none of them return item, return false
				return false;
			});
			return singleItem;
		}
	  
		function taskDone(item) {
			var indexOfItem = singleItemsToClean.indexOf(item);
			var singleItem = singleItemsToClean.splice(indexOfItem, 1);
			crossOutItem(singleItem[0]);
		}

		function multiTaskDone(belongs) {
			var itemArray;
			for(var setItem in cleaningSets) {
				itemArray = cleaningSets[setItem];
				if (removeFromSet(itemArray, belongs, setItem)) { 
					// when you remove it from the set, stop
					break 
				}
			}
		}

		function crossOutItem(crossMeOut) {
			var del = document.createElement('del'); 
			while (crossMeOut.childNodes.length) { 
				del.appendChild(crossMeOut.childNodes[0]);
			}
			crossMeOut.appendChild(del);
		}

		function removeFromSet(array, match, setItem) {
			var indexOfItem;
			return array.some(function(entry) {
				if (entry === match) {
					indexOfItem = array.indexOf(entry);
					// remove the item from its set
					array.splice(indexOfItem, 1); 
					// if that was the last item in the set...
					if (!array.length) { 
						// delete from to-do list... 
						[].some.call(multiItemsToClean, function(item) {
							// <Rod> didn't you create the map cleaningSets in order to avoid this? </Rod>
							if (item.getAttribute("data-for") === setItem){
								// if yes, 
								crossOutItem(item);
								return true;
							}
						});
						// ...remove it from the cleaningSets
						delete cleaningSets[setItem];
					}
					// then stop the .some by returning true
					return true;
				}
			});
		}
		/* Setting up the Items */

		// Factory: makes li items
		function createLi(item, dataType, img) {
			var image;
			var listItem = document.createElement('li');
			var itemClass = item;
			listItem.classList.add(itemClass);
			//set the data-DATATYPE
			listItem.setAttribute('data-' + dataType, item);
			if (img) {
				image = document.createElement( 'img' );
				image.src = "img/items/" + item + ".png";
				listItem.appendChild(image);
			}
			return listItem;	
		}

		// Factory: makes a list and populates it w/ lis
		function generateLists(target, dataType, listeners, img) {
			itemsList.forEach(function(item) {
				var newLi = createLi(item, dataType, img);
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
		}

		// Generate list for messies
		generateLists(messies, 'item', {'dragstart': handleDragStart, 'dragend': handleDragEnd}, true);

		// Generate list for places
		generateLists(places, 'belongs', {'dragover': handleDragOver, 'drop': handleDrop});


		/* Dragging and Dropping */

		// Each room contains a bunch of .messy items.
		// If you drag their imgs to their appropriate target divs
		
		// <Rod> in the real world you would keep this mapping in JS not in the DOM (for performance) </Rod>
		// The .target's should be linked to the .items by data-item and data-belongs = item
		// The .target should get a .droppable class which outlines where it will drop

		// After the drop, .target should be .cleaned
		// And the messy item's node: removed.

		function handleDragStart(e) {
			dragSrcEl = this;
			draggedItem = dragSrcEl.getAttribute('data-item');
			// <Rod> you'd want to properly escape draggedItem - again, you're ignoring the context-switch. 
			// This time from plaintext to CSS SelectorString</Rod>
			iBelong = '[data-belongs="' + draggedItem + '"]';
			// querySelector() gets first element
			places.querySelector(iBelong).classList.add('droppable');
			e.dataTransfer.effectAllowed = 'move';
			e.dataTransfer.setData('text/html', this.innerHTML);		
		}

		function handleDragOver(e) {
			if (e.preventDefault) {
				// Allows dropping.
				e.preventDefault(); 
			}
			// We want it to move the data
			e.dataTransfer.dropEffect = 'move';  
		}

		function handleDrop(e) {
			var belongs = this.getAttribute('data-belongs');
			var singleItem = isSingleSet(this, belongs);
			// <Rod> stick to your code style! </Rod>
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
			// if this matches up w/ an item on the singleItemsToClean
			if (singleItem) { 
				taskDone(singleItem);
			// if it is a member of a set of items
			} else { 
				multiTaskDone(belongs);
			}
			removeDragClasses();
			return false;
		}

		// when you don't drop what you're dragging
		function handleDragEnd(e) {
			// this/e.target is the source node.
			removeDragClasses();
		}

		function removeDragClasses() {
			// <Rod> in general this type of batch dom mutation is to be avoided at all cost </Rod>
			[].forEach.call(itemPlaces, function(place) {
				place.classList.remove('droppable');
			});
		}
	}, false);
}());
