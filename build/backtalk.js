/**
 * backtalk v0.0.1 build 01.08.2015
 * https://github.com/vanruesc/backtalk
 * Copyright 2015 Raoul van Rueschen, Zlib
 */

(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

/**
 * Event Dispatcher.
 * A base class for adding and removing event listeners and dispatching events.
 *
 * @constructor
 */

function EventDispatcher()
{
 this._listeners = {};
}

/**
 * Adds an event listener.
 *
 * @param {string} type - The event type.
 * @param {function} listener - The event listener.
 */

EventDispatcher.prototype.addEventListener = function(type, listener)
{
 if(this._listeners[type] === undefined)
 {
  this._listeners[type] = [];
 }

 if(this._listeners[type].indexOf(listener) === -1)
 {
  this._listeners[type].push(listener);
 }
};

/**
 * Checks if the event listener exists.
 *
 * @param {string} type - The event type.
 * @param {function} listener - The event listener.
 */

EventDispatcher.prototype.hasEventListener = function(type, listener)
{
 return(this._listeners[type] !== undefined && this._listeners[type].indexOf(listener) !== -1);
};

/**
 * Removes an event listener.
 *
 * @param {string} type - The event type.
 * @param {function} listener - The event listener.
 */

EventDispatcher.prototype.removeEventListener = function(type, listener)
{
 var i, listeners = this._listeners,
  listenerArray = listeners[type];

 if(listenerArray !== undefined)
 {
  i = listenerArray.indexOf(listener);

  if(i !== -1)
  {
   listenerArray.splice(i, 1);
  }
 }
};

/**
 * Dispatches an event to all respective listeners.
 *
 * @param {Object} event - The event.
 */

EventDispatcher.prototype.dispatchEvent = function(event)
{
 var i, l, listeners = this._listeners,
  listenerArray = listeners[event.type];

 if(listenerArray !== undefined)
 {
  event.target = this;

  for(i = 0, l = listenerArray.length; i < l; ++i)
  {
   listenerArray[i].call(this, event);
  }
 }
};

module.exports = EventDispatcher;

},{}],2:[function(require,module,exports){
"use strict";

var EventDispatcher = require("@zayesh/eventdispatcher");

/**
 * Overtime.
 * A time limit visualization library.
 *
 * @constructor
 * @param {Object} options - The settings.
 * @param {number} [options.time] - The time limit.
 * @param {number} [options.canvas] - The canvas to use. A new one will be created if none is supplied.
 * @param {boolean} [options.clearCanvas] - Whether the canvas should be cleared before rendering. Default is true.
 * @param {Array} [options.size] - The size of the canvas as an array: [width, height].
 * @param {Overtime.TimeMeasure} [options.timeMeasure] - The time measure of the supplied time limit. Defaults to seconds.
 */

function Overtime(options)
{
 var self = this, o;

 EventDispatcher.call(this);

 this.TWO_PI = Math.PI * 2.0;
 this.HALF_PI = Math.PI * 0.5;

 this.clear = true;
 this.animId = 0;
 this.now = Date.now();
 this.then = this.now;
 this.ctx = null;
 this.canvas = document.createElement("canvas");

 this.startAngle = -this.HALF_PI;
 this.threshold = 0.023; // Chrome hack.
 this.fullCircle = this.startAngle + this.TWO_PI;
 this.primaryStrokeStyle = "rgba(255, 100, 0, 0.9)";
 this.secondaryStrokeStyle = "rgba(0, 0, 0, 0.1)";
 this.updateEvent = {type: "update", time: 0};

 this.tm = Overtime.TimeMeasure.MILLISECONDS;
 this.t = 1;

 if(options !== undefined)
 {
  if(options.timeMeasure > 0) { this.tm = options.timeMeasure; }
  if(options.time > 0) { this.t = options.time; }
  if(options.canvas !== undefined) { this.canvas = options.canvas; }
  this.size = options.size;
 }

 this.t *= this.tm;
 this.T = this.t;

 // Try to recover time values from a previous session.
 if(localStorage.getItem("overtime"))
 {
  try
  {
   o = JSON.parse(localStorage.getItem("overtime"));
   if(o.tm !== undefined) { this.tm = o.tm; }
   if(o.t !== undefined) { this.t = o.t; }
   if(o.T !== undefined) { this.T = o.T; }
  }
  catch(e) { /* Swallow. */ }
 }

 // Store the time values for the next session.
 window.addEventListener("unload", function()
 {
  localStorage.setItem("overtime", JSON.stringify({
   tm: self.tm,
   t: self.t,
   T: self.T
  }));
 });

 /**
  * Bind the correct context to the internal update function.
  */

 this.update = function() { self._update(); };
}

Overtime.prototype = Object.create(EventDispatcher.prototype);
Overtime.prototype.constructor = Overtime;

/**
 * Getter for the internal canvas.
 */

Object.defineProperty(Overtime.prototype, "clearCanvas", {
 get: function() { return this.clear; },
 set: function(c) { this.clear = c; }
});

/**
 * Getter and Setter for the internal canvas.
 * 
 * @param {canvas} c - The new canvas to draw on.
 */

Object.defineProperty(Overtime.prototype, "canvas", {
 get: function() { return this.ctx.canvas; },
 set: function(c)
 {
  if(c !== undefined && c.getContext !== undefined)
  {
   this.stop();
   this.ctx = c.getContext("2d");
   this.ctx.strokeStyle = this.primaryStrokeStyle;
   this.size = [c.width, c.height];
  }
 }
});

/**
 * Getter and Setter for the time.
 * 
 * @param {number} t - The new time. Will be translated to the current time measure.
 */

Object.defineProperty(Overtime.prototype, "time", {
 get: function() { return this.t; },
 set: function(t)
 {
  if(t >= 0)
  {
   this.stop();
   this.t = t * this.tm;
   this.T = this.t;
   this._render();
  }
 }
});

/**
 * Getter and Setter for the time measure.
 * The current time will not be affected by this in any way.
 * 
 * @param {Overtime.TimeMeasure} tm - The new time measure.
 */

Object.defineProperty(Overtime.prototype, "timeMeasure", {
 get: function() { return this.tm; },
 set: function(tm)
 {
  if(tm > 0)
  {
   this.tm = tm;
  }
 }
});

/**
 * Getter and Setter for the size of the internal canvas.
 * 
 * @param {Array} s - The new size in the form of [width, height].
 */

Object.defineProperty(Overtime.prototype, "size", {
 get: function()
 {
  return [
   this.ctx.canvas.width,
   this.ctx.canvas.height
  ];
 },
 set: function(s)
 {
  if(s !== undefined)
  {
   this.ctx.canvas.width = s[0];
   this.ctx.canvas.height = s[1];
   this.ctx.lineWidth = (s[0] < s[1]) ? s[0] * 0.05 : s[1] * 0.05;
   this._render();
  }
 }
});

/**
 * Renders the time progress on the canvas.
 */

Overtime.prototype._render = function()
{
 var ctx = this.ctx,
  w = ctx.canvas.width,
  h = ctx.canvas.height,
  hw = w >> 1, hh = h >> 1,
  radius = w < h ? hw : hh,
  endAngle,
  tooThin; // Chrome hack.

 if(this.clear) { ctx.clearRect(0, 0, w, h); }

 // Don't bleed over the edge.
 radius -= ctx.lineWidth;

 // Draw the progress.
 endAngle = this.startAngle + this.TWO_PI * ((this.T - this.t) / this.T);
 tooThin = (endAngle - this.startAngle < this.threshold); // Chrome hack.
 ctx.strokeStyle = this.primaryStrokeStyle;
 ctx.beginPath();
 ctx.arc(hw, hh, radius, tooThin ? this.startAngle - this.threshold : this.startAngle, endAngle, false); // Chrome hack.
 //ctx.arc(hw, hh, radius, this.startAngle, endAngle, false);
 ctx.stroke();
 if(tooThin) { ctx.clearRect(0, 0, hw - this.threshold, hh); } // Chrome hack.

 // Draw the rest of the circle in another color.
 if(endAngle < this.fullCircle)
 {
  // No hacking here cause can't clear.
  ctx.strokeStyle = this.secondaryStrokeStyle;
  ctx.beginPath();
  ctx.arc(hw, hh, radius, endAngle, this.fullCircle, false);
  ctx.stroke();
 }
};

/**
 * Steps the system forward.
 * This is the main loop.
 */

Overtime.prototype._update = function()
{
 var elapsed;

 // Calculate the time span between this run and the last.
 this.now = Date.now();
 elapsed = this.now - this.then;
 this.then = this.now;

 // Update the time.
 this.t -= elapsed;
 if(this.t < 0) { this.t = 0; }
 this.updateEvent.time = this.t;
 this.dispatchEvent(this.updateEvent);

 // Render the time.
 this._render();

 // Continue or exit.
 if(this.t > 0)
 {
  this.animId = requestAnimationFrame(this.update);
 }
 else
 {
  this.dispatchEvent({type: "elapsed"});
 }
};

/**
 * Stops the rendering cycle. Does nothing else besides that.
 */

Overtime.prototype.stop = function()
{
 if(this.animId !== 0)
 {
  cancelAnimationFrame(this.animId);
  this.animId = 0;
 }
};

/**
 * Tries to start the rendering cycle if it isn't
 * running. Otherwise it restarts it.
 */

Overtime.prototype.start = function()
{
 this.stop();
 this.now = Date.now();
 this.then = this.now;
 this.update();
};

/**
 * Sets the time back to its original length.
 */

Overtime.prototype.rewind = function()
{
 this.stop();
 this.t = this.T;
 this._render();
};

/**
 * Sets the time back by the given value.
 * The time will not go back beyond the initial length.
 *
 * @param {number} t - The time by which to rewind. Interpreted according to the current time measure. A negative value corresponds to fast-forwarding.
 */

Overtime.prototype.rewindBy = function(t)
{
 if(typeof t === "number" && !isNaN(t) && t !== 0)
 {
  this.stop();
  this.t += t * this.tm;
  if(this.t > this.T) { this.t = this.T; }
  this._render();
 }
};

/**
 * Goes ahead in time by a given value.
 *
 * @param {number} t - The time value by which to rewind. Will be interpreted according to the current time measure. A negative value corresponds to rewinding.
 */

Overtime.prototype.advanceBy = function(t)
{
 if(typeof t === "number" && !isNaN(t))
 {
  this.rewindBy(-t);
 }
};

/**
 * Adds time.
 *
 * @param {number} t - The time value to add. Will be interpreted according to the current time measure. A negative value corresponds to shortening.
 */

Overtime.prototype.prolongBy = function(t)
{
 if(typeof t === "number" && !isNaN(t) && t !== 0)
 {
  this.stop();
  t *= this.tm;
  this.t += t;
  this.T += t;
  if(this.T < 0) { this.T = this.t = 0; }
  this._render();
 }
};

/**
 * Reduces the total duration of the countdown.
 *
 * @param {number} t - The time value to subtract. Will be interpreted according to the current time measure. A negative value corresponds to prolonging.
 */

Overtime.prototype.shortenBy = function(t)
{
 if(typeof t === "number" && !isNaN(t))
 {
  this.prolongBy(-t);
 }
};

/**
 * Static enumeration of time measure constants.
 */

Overtime.TimeMeasure = Object.freeze({
 MILLISECONDS: 1,
 SECONDS: 1000,
 MINUTES: 60000,
 HOURS: 3600000
});

module.exports = Overtime;

},{"@zayesh/eventdispatcher":1}],3:[function(require,module,exports){
"use strict";

/**
 * A compilation of static functions.
 * This system uses Overtime to display a
 * time limit on the evaluation page.
 *
 * @class Backtalk
 * @static
 */

var Overtime = require("overtime");

/**
 * The Overtime instance.
 *
 * @property overtime
 * @type Overtime
 * @private
 * @static
 */

var overtime;

/**
 * The main DOM container.
 *
 * @property container
 * @type HTMLDivElement
 * @private
 * @static
 */

var container;

/**
 * The DOM container for displaying the minutes.
 *
 * @property minutes
 * @type HTMLInputElement
 * @private
 * @static
 */

var minutes;

/**
 * The DOM container for displaying the seconds.
 *
 * @property seconds
 * @type HTMLInputElement
 * @private
 * @static
 */

var seconds;

/**
 * The interval id.
 *
 * @property intervalId
 * @type Number
 * @private
 * @static
 */

var intervalId;

/**
 * The DOM container for displaying the votes.
 *
 * @property votes
 * @type HTMLSpanElement
 * @private
 * @static
 */

var votes;

/**
 * The ajax object.
 *
 * @property xhr
 * @type XMLHttpRequest
 * @private
 * @static
 */

var xhr;

/**
 * The request timeout in ms.
 *
 * @property timeout
 * @type Number
 * @default 5000
 * @private
 * @static
 */

var timeout = 5000;

/**
 * The current vote count.
 *
 * @property voteCount
 * @type Number
 * @private
 * @static
 */

var voteCount;

/**
 * Dynamically resize the canvas.
 *
 * @method resize
 * @private
 * @static
 */

function resize()
{
 var min = (container.offsetWidth < container.offsetHeight) ?
  container.offsetWidth : container.offsetHeight;

 overtime.size = [min, min];
}

/**
 * Sets the time based on the values in the input fields.
 *
 * @method copyTime
 * @private
 * @static
 */

function copyTime()
{
 var m, s;

 try
 {
  m = parseInt(minutes.value);
  s = parseInt(seconds.value);
  --s;

  if(m > 59) { m = 59; }
  if(s > 59) { s = 59; }

  if(s < 0 && m === 0)
  {
   overtime.timeMeasure = Overtime.TimeMeasure.MILLISECONDS;
   overtime.time = 1;
  }
  else if(s === 0 && m === 0)
  {
   overtime.timeMeasure = Overtime.TimeMeasure.SECONDS;
   overtime.time = 1;
  }
  else
  {
   overtime.timeMeasure = Overtime.TimeMeasure.MINUTES;
   overtime.time = m;
   overtime.timeMeasure = Overtime.TimeMeasure.SECONDS;
   overtime.prolongBy(s + 1);
  }

  overtime.rewind();
  displayTime(overtime);
 }
 catch(e) { /* Ignore invalid input. */ }
}

/**
 * Displays the time as digits.
 *
 * @method displayTime
 * @private
 * @static
 * @param {Object} event - The event.
 */

function displayTime(event)
{
 var ms = event.time, m, s;

 if(ms > 1) { ms += 1000; }

 m = ((ms / 60000) % 60) | 0;
 s = ((ms / 1000) % 60) | 0;
 minutes.value = (m < 10) ? "0" + m : m;
 seconds.value = (s < 10) ? "0" + s : s;
}

/**
 * Adds event listeners to the time controls number inputs.
 *
 * @method enableTimeControls
 * @private
 * @static
 */

function enableTimeControls()
{
 minutes.disabled = false;
 seconds.disabled = false;
}

/**
 * Removes event listeners from the time controls number inputs.
 *
 * @method disableTimeControls
 * @private
 * @static
 * @return {boolean} Whether the time controls were editable before they were disabled.
 */

function disableTimeControls()
{
 var enabled = !minutes.disabled && !seconds.disabled;

 if(enabled)
 {
  minutes.disabled = true;
  seconds.disabled = true;
 }

 return enabled;
}

/**
 * Handle xhr responses.
 *
 * @method handleResponse
 * @private
 * @static
 */

function handleResponse()
{
 var oldVoteCount = voteCount;

 if(this.readyState === 4)
 {
  try
  {
   voteCount = parseInt(this.responseText);
  }
  catch(e)
  {
   voteCount = Number.NaN;
  }

  if(typeof voteCount === "number" && !isNaN(voteCount))
  {
   if(voteCount !== oldVoteCount)
   {
    // Fancy update animation goes here.
    votes.innerHTML = voteCount;
    oldVoteCount = voteCount;
   }
  }
  else
  {
   clearInterval(intervalId);
  }
 }
}

/**
 * Request the current vote count.
 *
 * @method requestVoteCount
 * @private
 * @static
 */

function requestVoteCount()
{
 xhr.open("GET", window.location.href.replace(new RegExp("evaluation/"), "evaluation/vote-count?uid="), true);
 xhr.timeout = timeout - 1000;
 xhr.send();
}

/**
 * The Setup.
 *
 * @method init
 * @private
 * @static
 */

window.addEventListener("load", function init()
{
 overtime = new Overtime();

 container = document.getElementById("overtime");
 seconds = document.getElementById("seconds");
 minutes = document.getElementById("minutes");
 votes = document.getElementById("votes");

 // Make sure that all elements are present.
 if(container && minutes && seconds && votes)
 {
  // Adjust the size of the canvas and add it to the page.
  resize();
  window.addEventListener("resize", resize);
  container.appendChild(overtime.canvas);

  // Reset time to 30 minutes.
  overtime.timeMeasure = Overtime.TimeMeasure.MINUTES;
  overtime.time = 30;
  overtime.timeMeasure = Overtime.TimeMeasure.SECONDS;
  overtime.shortenBy(1);
  overtime.rewind();
  displayTime(overtime);

  // Update the time in the two input fields.
  overtime.addEventListener("update", displayTime);

  overtime.addEventListener("elapsed", function()
  {
   enableTimeControls();

   // Implement fancy finish effect here maybe.
   window.alert("Die Zeit ist um!");
  });

  document.getElementById("stop").addEventListener("click", function()
  {
   overtime.stop();
   enableTimeControls();
  });

  document.getElementById("start").addEventListener("click", function()
  {
   if(disableTimeControls())
   {
    copyTime();
   }

   overtime.start();
  });

  // Show the current time (persists over multiple sessions).
  displayTime(overtime);
  enableTimeControls();

  // Try to request the current vote count.
  if(XMLHttpRequest !== undefined)
  {
   xhr = new XMLHttpRequest();
   xhr.addEventListener("readystatechange", handleResponse);
   xhr.addEventListener("timeout", function() {});
   intervalId = setInterval(requestVoteCount, timeout);
  }
 }

 // Clean up.
 window.removeEventListener("load", init);
});

},{"overtime":2}]},{},[3]);
