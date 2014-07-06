"use strict";

// Resize End from https://github.com/porada/resizeend
(function(window) {
  var currentOrientation, debounce, dispatchResizeEndEvent, document, events, getCurrentOrientation, initialOrientation, resizeDebounceTimeout;
  document = window.document;
  if (!(window.addEventListener && document.createEvent)) {
    return;
  }
  events = ['resize:end', 'resizeend'].map(function(name) {
    var event;
    event = document.createEvent('Event');
    event.initEvent(name, false, false);
    return event;
  });
  dispatchResizeEndEvent = function() {
    return events.forEach(window.dispatchEvent.bind(window));
  };
  getCurrentOrientation = function() {
    return Math.abs(+window.orientation || 0) % 180;
  };
  initialOrientation = getCurrentOrientation();
  currentOrientation = null;
  resizeDebounceTimeout = null;
  debounce = function() {
    currentOrientation = getCurrentOrientation();
    if (currentOrientation !== initialOrientation) {
      dispatchResizeEndEvent();
      return initialOrientation = currentOrientation;
    } else {
      clearTimeout(resizeDebounceTimeout);
      return resizeDebounceTimeout = setTimeout(dispatchResizeEndEvent, 100);
    }
  };
  return window.addEventListener('resize', debounce, false);
})(window);

(function() {

  var body = document.body;

  // State changing function because I use it so much.
  function changeProgress(newState, tangential) {
    body.setAttribute('data-progress', newState);
    ga('send', 'event', 'Progress', newState);
  }

  function calcAspectRatio() {
    var windowHeight = window.innerHeight;
    var windowWidth = window.innerWidth;
    var frame = document.getElementById("frame");
    var house = document.getElementById("house");
    var floors = house.querySelectorAll(".floor");
    var sidebarWidth = document.getElementById("ui").clientWidth;
    var frameWidth = frame.clientWidth - sidebarWidth;
    var success = document.getElementById("success");
    var loading = document.getElementById("loading");

    var properWidth, properHeight, styleWidth, styleHeight, fullWidth, styleWidthFull;

    // get new widths and heights
    if (frameWidth/windowHeight >= 1228/1000) {
      // if window is wide
      properWidth = (1228/1000) * windowHeight;
      properHeight = windowHeight;
      fullWidth = (1500/1000) * windowHeight + "px";
    } else {
      // if it is narrow
      properWidth = frameWidth;
      properHeight = properWidth/(1228/1000);
      fullWidth = "100%";
    }
    styleWidth = "width: " + properWidth + "px";
    styleHeight = "height: " + properHeight + "px";

    styleWidthFull = "width: " + fullWidth;

    // set the house's width
    house.setAttribute("style", styleWidth);

    // set the height of its floors
    [].forEach.call(floors, function(floor) {
      floor.setAttribute("style", styleHeight);
    });

    // limit the height of the frame to just show one floor
    frame.setAttribute("style", styleHeight);

    // set width and height of the loading and outro divs
    success.setAttribute("style", styleWidthFull);
    loading.setAttribute("style", styleWidthFull);

  }

  // load only fires after all the content is rendered.
  // using window because document is unreliable:
  // http://stackoverflow.com/questions/16404380/why-doesnt-document-addeventlistenerload-function-work-in-a-greasemonkey-s
  window.addEventListener('load', calcAspectRatio, false);

  window.addEventListener('resize:end', calcAspectRatio, false);

/* Audio */
window.addEventListener('load', function(){
  var audio = document.createElement("audio");
  var musicOn = false;
  var musicLoaded = false;
  var canPlayMP3 = (typeof audio.canPlayType === "function" &&
                audio.canPlayType("audio/mpeg") !== "");

  // Building the audio source object
  if (canPlayMP3===true) {
    audio.src = "audio/loop.mp3";
  } else {
    audio.src = "audio/loop.ogg";
  }
  audio.loop = true;
  audio.addEventListener('canplaythrough', function () {
    //set timer on loadscreen
    setTimeout(function() {
      changeProgress('dialog-intro');
      musicLoaded = true;
      if (musicOn) {
        turnMusicOn();
      }
    }, 5000);
  }, false);

  // Building the visual audio switch
  var audioControl = document.createElement("div");
  audioControl.classList.add("off");
  audioControl.setAttribute("id", "music-controls");
  // clicking on the controls toggles the music on and off
  function turnMusicOff() {
    musicOn = false;
    audioControl.classList.remove('on');
    audioControl.classList.add('off');
    if (musicLoaded) {
      audio.pause();
    }
  }

  function turnMusicOn() {
    musicOn = true;
    audioControl.classList.remove('off');
    audioControl.classList.add('on');
    if (musicLoaded) {
      audio.play();
    }
  }

  audioControl.addEventListener("click", function(){
    // The musicOn variable lets people toggle the music before it's loaded
    if (musicOn) {
      turnMusicOff();
    } else {
      turnMusicOn();
    }
  }, false);
  body.appendChild(audioControl);

  // Using ifvisible.js,
  ifvisible.on("blur", function(){
    // pause the music if people leave it running and leave the page
    if (musicOn) {
      turnMusicOff();
      // set musicOn back to true; only place we need to do that... so far...
      musicOn = true;
    }
  });

  ifvisible.on("focus", function(){
    if (musicOn) {
      // then turn it back on when they get back
      turnMusicOn();
    }
  });


}, false);

document.addEventListener('DOMContentLoaded', function(){

  /* Items */
  var currentGroup, currentKey;
  var items = {};
  var _items = document.querySelectorAll('#to-clean li');
  var messies = document.getElementById("messy-items");
  var places = document.getElementById("item-places");
  var itemsLeft = 0;

  [].forEach.call(_items, function(node) {
    var keys = node.getAttribute('data-items').split(';');
    var group = node.getAttribute('data-group');
    // if there was no grouping, it's a single item
    if (!group) {
      group = node.getAttribute('data-items');
    }
    var item = {
      node: node,
      // number elements that need to be cleaned up to close the group
      remaining: keys.length,
      // sources that need to be put in the right spot
      draggable: {},
      // targets that a source needs to be dropped onto
      droppable: {}
    };
    items[group] = item;
    itemsLeft++;

    keys.forEach(function(key) {
      // Make the draggable element
      var draggable = document.createElement('li');
      var image = document.createElement( 'img' );
      draggable.setAttribute('data-group', group);
      draggable.setAttribute('data-key', key);
      draggable.classList.add(key);
      draggable.classList.add('item');
      // pop an image in it
      image.src = "img/items/" + key + ".png";
      draggable.appendChild(image);

      var droppable = document.createElement('li');
      droppable.setAttribute('data-group', group);
      droppable.setAttribute('data-key', key);
      droppable.classList.add(key);

      // listeners
      draggable.addEventListener('dragstart', handleDragStart(group, key), false);
      draggable.addEventListener('dragend', handleDragEnd(group, key), false);
      droppable.addEventListener('drop', handleDrop(group, key), false);
      droppable.addEventListener('dragover', handleDragHover(group, key), false);
      droppable.addEventListener('dragleave', handleDragLeave, false);

      // attach them both to item
      item.draggable[key] = draggable;
      item.droppable[key] = droppable;

      // attach both to their respective DOM elements
      messies.appendChild(draggable);
      places.appendChild(droppable);
    });
  });

  // For more info on why I'm writing functions like this, read about closures:
  // http://stackoverflow.com/questions/10000083/javascript-event-handler-with-parameters
  function handleDragStart(group, key) {
    return function(e) {
      currentGroup = this.getAttribute('data-group');
      currentKey = this.getAttribute('data-key');
      items[group].droppable[key].classList.add('droppable');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/html', this.innerHTML);
    }
  }

  function handleDragHover(group, key) {
    return function(e) {
      // e.preventDefault allows dropping.
      if (e.preventDefault) { e.preventDefault(); }
      // We want it to move the data
      e.dataTransfer.dropEffect = 'move';
      if (group === currentGroup && key === currentKey) {
        items[currentGroup].droppable[currentKey].classList.add('hover');
      }
    }
  }

  function handleDragLeave(e) {
    items[currentGroup].droppable[currentKey].classList.remove('hover');
  }

  function handleDrop(group, key) {
    return function(e) {
      if(e.preventDefault) { e.preventDefault(); }
      if(e.stopPropagation) { e.stopPropagation(); }

      if (group !== currentGroup || key !== currentKey) {
        // droppable and draggable don't match!
        return;
      }

      // remove an item from its group, using group as a counter
      items[group].remaining--;
      // if there are no more items in that group...
      if (!items[group].remaining) {
        // cross it out from the list
        crossOut(items[group].node);
        itemsLeft--;
        if (!itemsLeft) {
          initiateOutro();
        }
      }
      this.innerHTML = e.dataTransfer.getData('text/html');
      this.classList.add("clean");
      // Remove its old parent.
      items[group].draggable[key].remove();

      // remove the droppable class
      items[group].droppable[key].classList.remove('droppable');

      // item was cleaned up, remove references
      delete items[group].draggable[key];
      delete items[group].droppable[key];
    }
  }

  // when you don't drop what you're dragging
  function handleDragEnd(group, key) {
    return function(e) {
      // this/e.target is the source node.
      items[group].droppable[key].classList.remove('droppable', 'hover');
    }
  }

  function crossOut(crossMeOut) {
    var del = document.createElement('del');
    while (crossMeOut.childNodes.length) {
      del.appendChild(crossMeOut.childNodes[0]);
    }
    crossMeOut.appendChild(del);
  }

  // Clicking on the stair's warp arrows to change the state of the room
  // (which we will animate in CSS)
  var warps = document.querySelectorAll('.warp');
  [].forEach.call(warps, function(warp) {
    warp.addEventListener("click", function(){
      var destination = warp.getAttribute('data-setFloor');
      body.setAttribute('data-currentFloor', destination);
    });
  });

  // The dialogs need little next buttons to let people page through
  function createDialog(dialogParent, pageNum, callback) {
    // create next button
    var nextButton = document.createElement('div');
    nextButton.classList.add('next');
    nextButton.innerHTML = 'Next';
    var prevButton = document.createElement('div');
    prevButton.classList.add('prev');
    prevButton.innerHTML = 'Previous';
    var navigation = document.createElement('nav');
    navigation.classList.add('dialog-nav');
    // give it a click listener
    nextButton.addEventListener("click", function(event) {
      // when clicked, it should go to the next page
      var currentNumb = dialogParent.getAttribute('data-dialog');
      if (!(currentNumb >= pageNum)) {
        if (dialogParent.classList.contains("start")) {
          dialogParent.classList.remove("start");
        }
        currentNumb++
        // no more pages? run callback
        dialogParent.setAttribute('data-dialog', currentNumb);
      } else {
        callback();
      }
    });
    // give it a click listener
    prevButton.addEventListener("click", function(event) {
      // when clicked, it should go to the next page
      var currentNumb = dialogParent.getAttribute('data-dialog');
      if (currentNumb <= 2) {
        // no more pages? run callback
        dialogParent.classList.add("start");
      }
      currentNumb--;
      dialogParent.setAttribute('data-dialog', currentNumb);
    });
    // add button to dialog
    navigation.appendChild(nextButton);
    navigation.appendChild(prevButton);
    dialogParent.appendChild(navigation);
    dialogParent.classList.add("start");
  }

  function finishedIntro() {
    changeProgress('cleaning-house');
  }

  function initiateOutro() {
    changeProgress('dialog-outro');
  }

  function gameOver() {
    // if all items and photo scraps are cleaned up, cut to "success"
    if (!itemsLeft && !scrapsLeft) {
      changeProgress('completed');
    } else {
      changeProgress('find-photos');
    }
  }

  createDialog(document.getElementById('dialog-intro'), 6, finishedIntro);
  createDialog(document.getElementById('dialog-outro'), 2, gameOver);

  // Letters
  // Letters are one-offs. Like the items, each letter is a pair of locations:
  // The hidden letter is clickable
  // When clicked, it reveals a large, readable letter.
  // Click anywhere and it disappears, with the hidden letter. Poof!
  // The photos will work the same way, but they are being tallied for the game.

  var letters = document.querySelectorAll('#letters li');
  var hiddenLetters = document.createDocumentFragment();
  // generate list of letters
  [].forEach.call(letters, function(letter) {
    var hiddenLetter = letter.cloneNode();
    hiddenLetter.classList.add('letter');
    hiddenLetters.appendChild(hiddenLetter);
    // give each a click handler to connect it to its full sized twin
    letter.addEventListener('click', function(){
      letter.classList.remove('revealed');
    });
    hiddenLetter.addEventListener('click', function(){
      letter.classList.add('revealed');
      this.remove();
    });
  });
  // insert them to the messy items pile
  messies.appendChild(hiddenLetters);

  // Photos
  // Photos are a cross between items and letters.
  // Each photo consists of a number of tiny scraps in the room
  // and some big scraps that assemble to show a picture.
  // Clicking a little scrap shows its bigger counterpart + removes the little scrap
  // When you've cleaned up all the items and found all the scraps,
  // you get to see all the big scraps assembled, one pic at a time.

  // Go through #photos + fill each li w/ <div class="scrap1"></div> based on data-scraps's #
  var photos = document.querySelectorAll('#photos li');
  var hiddenPhotos = document.createDocumentFragment();
  var scrapsLeft = 0;
  // so far just like Letters

  [].forEach.call(photos, function(photo) {
    var numberOfScraps = photo.getAttribute('data-scraps');
    var photoScrapCompenents = document.createDocumentFragment();
    var scrap, bigScrap, scrapParentNum, scrapNumber, scrapClass;
    // isNan returns false if a variable _could be_ a number, ie 12 or '12'
    // http://stackoverflow.com/questions/175739/is-there-a-built-in-way-in-javascript-to-check-if-a-string-is-a-valid-number
    if (!isNaN(numberOfScraps)) {
      for (numberOfScraps; numberOfScraps >= 1; numberOfScraps--){
        scrapParentNum = photo.classList[0]; // photo1
        scrapNumber = numberOfScraps; // 1
        scrapsLeft++;

        bigScrap = document.createElement('div');
        bigScrap.classList.add('scrap');
        bigScrap.classList.add('scrap' + scrapNumber);
        photoScrapCompenents.appendChild(bigScrap);

        // Make an <li class="photo1-scrap1"></li>
        scrap = document.createElement('li');
        scrapParentNum = photo.classList[0]; // photo1
        scrapNumber = numberOfScraps; // 1
        scrapClass = scrapParentNum + '-scrap' + scrapNumber;
        scrap.classList.add('photo');
        scrap.classList.add(scrapClass);
        hiddenPhotos.appendChild(scrap);
        // When clicked, give class .revealed to li#photo1 .scrap1 (it's pair)...
        // ...and remove it from the DOM
        scrap.addEventListener("click", function(photo, bigScrap){
          return function(e) {
            photo.classList.add('revealed');
            bigScrap.classList.add('revealed');
            this.remove();
            scrapsLeft--;
            if (!itemsLeft && !scrapsLeft) {
              photo.addEventListener("click", function(){
                changeProgress('completed');
              });
            }
          }
        }(photo, bigScrap), false);
        // Clicking on the big scrap hides it.
        photo.addEventListener("click", function(){
          this.classList.remove('revealed');
        });
      }
    }
    // Insert big scraps into parent photo
    photo.appendChild(photoScrapCompenents);
  });
  // Insert mini scraps into messies.
  messies.appendChild(hiddenPhotos);

  // About this
  // There has to be some form of credit for the creators!
  // Needs to toggle and get out of the way but also
  // link to our sites, the archives, github and provide a tip jar

  var toCredits = document.getElementById("open-credits");
  var closeCredits = document.getElementById("close-credits");
  toCredits.addEventListener('click', function() {
    body.classList.add('show-credits');
    ga('send', 'event', 'Progress', 'showCredits');
  });
  closeCredits.addEventListener('click', function() {
    body.classList.remove('show-credits');
    ga('send', 'event', 'Progress', 'closeCredits');
  });

}, false);

})();
