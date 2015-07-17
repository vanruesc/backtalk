"use strict";

var Overtime = require("overtime"),
 overtime = new Overtime(),
 container, hours, minutes, seconds;

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
 overtime.timeMeasure = Overtime.TimeMeasure.HOURS;
 overtime.time = parseInt(hours.value);
 overtime.timeMeasure = Overtime.TimeMeasure.MINUTES;
 overtime.prolongBy(parseInt(minutes.value));
 overtime.timeMeasure = Overtime.TimeMeasure.SECONDS;
 overtime.prolongBy(parseInt(seconds.value));
}

/**
 * Displays the time as digits.
 */

function displayTime(event)
{
 var ms = event.time;

 seconds.value = ((ms / 1000) % 60) | 0;
 minutes.value = ((ms / 60000) % 60) | 0;
 hours.value = ((ms / 3600000) % 60) | 0;
}

/**
 * Adds event listeners to the time controls number inputs.
 */

function enableTimeControls()
{
 hours.addEventListener("change", copyTime);
 minutes.addEventListener("change", copyTime);
 seconds.addEventListener("change", copyTime);
}

/**
 * Removes event listeners from the time controls number inputs.
 */

function disableTimeControls()
{
 hours.removeEventListener("change", copyTime);
 minutes.removeEventListener("change", copyTime);
 seconds.removeEventListener("change", copyTime);
}

/**
 * Initial setup.
 */

window.addEventListener("load", function init()
{
 //var fullscreen = false;

 container = document.getElementById("overtime");
 hours = document.getElementById("hours");
 minutes = document.getElementById("minutes");
 seconds = document.getElementById("seconds");

 container.appendChild(overtime.canvas);

 resize();
 window.addEventListener("resize", resize);

 overtime.addEventListener("elapsed", function()
 {
  //alert("Die Zeit ist um!");
 });

 overtime.addEventListener("update", displayTime);

 document.getElementById("stop").addEventListener("click", function()
 {
  overtime.stop();
  enableTimeControls();
 });

 document.getElementById("start").addEventListener("click", function()
 {
  disableTimeControls();
  overtime.start();
 });

 document.getElementById("rewind").addEventListener("click", function()
 {
  overtime.rewind();
  displayTime({time: overtime.T});
  enableTimeControls();
 });

 enableTimeControls();

/*
 overtime.canvas.addEventListener("click", function()
 {
  if(!fullscreen)
  {
   container.style.position = "absolute";
   container.style.zIndex = 100;
   container.style.top = 0;
   container.style.left = 0;
   container.style.right = 0;
   container.style.bottom = 0;
   container.style.backgroundColor = "white";
   fullscreen = true;
  }
  else
  {
   container.style.position = "relative";
   container.style.top = "auto";
   container.style.left = "auto";
   container.style.right = "auto";
   container.style.bottom = "auto";
   container.style.backgroundColor = "transparent";
   fullscreen = false;
  }

  resize();
 });
*/

 // Clean up.
 window.removeEventListener("load", init);
});
