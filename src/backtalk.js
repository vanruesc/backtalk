"use strict";

var Overtime = require("overtime"),
 overtime, container, minutes, seconds,
 votes, uid, xhr, timeout = 5000, voteCount = 0;

/**
 * Dynamically resize the canvas.
 */

function resize()
{
 var min = (container.offsetWidth < container.offsetHeight) ?
  container.offsetWidth : container.offsetHeight;

 overtime.size = [min, min];
}

/**
 * Sets the time based on the values in the input fields.
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
 */

function enableTimeControls()
{
 minutes.disabled = false;
 seconds.disabled = false;
}

/**
 * Removes event listeners from the time controls number inputs.
 *
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
 */

function handleResponse()
{
 var oldVoteCount = voteCount;

 if(this.readyState === 4)
 {
  try
  {
   voteCount = parseInt(this.responseText);

   if(typeof voteCount === "number" && !isNaN(voteCount) && voteCount !== oldVoteCount)
   {
    // Fancy animation goes here.
    votes.innerHTML = voteCount;
   }
  }
  catch(e) {}
 }
}

/**
 * Request the current vote count.
 */

function requestVoteCount()
{
 // window.location.href.replace(new RegExp("evaluation"), "evaluation/vote-count")
 xhr.open("GET", "/evaluation/vote-count" + uid.value, true);
 xhr.timeout = timeout - 1000;
 xhr.send();
}

/**
 * The Setup.
 */

window.addEventListener("load", function init()
{
 overtime = new Overtime();

 container = document.getElementById("overtime");
 seconds = document.getElementById("seconds");
 minutes = document.getElementById("minutes");
 votes = document.getElementById("votes");
 uid = document.getElementById("uid");

 // Make sure that all elements are present.
 if(container && minutes && seconds && votes && uid)
 {
  // Adjust the size of the canvas and add it to the page.
  resize();
  window.addEventListener("resize", resize);
  container.appendChild(overtime.canvas);

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
   setInterval(requestVoteCount, timeout);
  }
 }

 // Clean up.
 window.removeEventListener("load", init);
});
