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
