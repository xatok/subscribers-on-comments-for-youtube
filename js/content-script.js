/*
 * Copyright Sergio Marin Vossenberg 2017
 *
 * This file is part of 'Subscribers on comments for YouTube™'.
 *
 * 'Subscribers on comments for YouTube™' is free software:
 * you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * 'Subscribers on comments for YouTube™' is distributed in the hope that
 * it will be useful, but WITHOUT ANY WARRANTY; without even the implied
 * warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with 'Subscribers on comments for YouTube™'.
 * If not, see <http://www.gnu.org/licenses/>.
 */

var commentsToUpdate = []; // all the pending comments to update views
var hashComments = {}; // count for every channel

function onElementHeightChange(elm, callback){
    var lastHeight = elm.clientHeight, newHeight;
    (function run(){
        newHeight = elm.clientHeight;

        if(lastHeight!=newHeight&&newHeight>150)
            callback();

        lastHeight = newHeight;

        if(elm.onElementHeightChangeTimer)
            clearTimeout(elm.onElementHeightChangeTimer);

        elm.onElementHeightChangeTimer = setTimeout(run, 200);
    })();
}

browser.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.message == "awake"){
            sendResponse({message: "true"});

            onElementHeightChange(document.getElementById("watch-discussion"), function(){
    			setLabels()
			});

        }
 });

onElementHeightChange(document.getElementById("watch-discussion"), function(){
    setLabels();
});

// Main function
function setLabels() {

//Get all the comments headers
var commentsHeader = document.getElementsByClassName("comment-renderer-header");

//Get all the comments headers with already labels on it
var commentsHeaderUpdated = document.getElementsByClassName("subslabel-text");

console.log("setLabels "+commentsHeader.length+"/"+commentsHeaderUpdated.length);

// Return true if obj is a number
function isNumber(obj) {return !isNaN(parseFloat(obj))}
		
// GET API
function httpGetAsync(urlArr, callback) {
	var apiurl = urlArr.splice(0,1);
	var xmlHttp = new XMLHttpRequest();

	xmlHttp.onreadystatechange = function() { 
		if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
			callback(urlArr,xmlHttp.responseText);
	}

	xmlHttp.open("GET", apiurl, true); // true for asynchronous 
	xmlHttp.send(null);
}
		
// Get the subscribers count for each unique channel id (because a user can comment more than once)
function parseResponse(urlArr, response) {
	var comments = JSON.parse(response);

	// Check if the response contains items
	if(comments.items.length > 0) {

		for(var i=0;i<comments.items.length;i++) {

			var id = comments.items[i].id;
			var subscount = comments.items[i].statistics.subscriberCount;
			var hiddenCount = comments.items[i].statistics.hiddenSubscriberCount;

			if(hiddenCount)
				hashComments[id] = "-1";
			else
				hashComments[id] = subscount;

		}

		// Check if we need to call to the API again
		if(urlArr.length==0)
			updateView();
		else
			httpGetAsync(urlArr,parseResponse);

	}
}
		
// Update views for each comment
function updateView() {

	var RANKS = ["0","10","100","1k","10k","100k","1m","10m","100m"];

	for(var i=0;i<commentsToUpdate.length;i++) {

		var subscount = hashComments[commentsToUpdate[i][1]];

		if(isNumber(subscount)) {

			var subscriberLabel = document.createElement("span");
			var subscriberText = document.createElement("a");
			subscriberText.className = "subslabel-text";

			var text;

			if(subscount=="-1") {
				subscriberLabel.className = "subslabel-label-bg bluebg-h";
				text = document.createTextNode("Hidden Subscribers");
			} else {
				subscriberLabel.className = "subslabel-label-bg bluebg-" + RANKS[subscount.length-1];
				text = document.createTextNode(subscount + " subscribers");
			}

			subscriberText.appendChild(text);
			subscriberLabel.appendChild(subscriberText);

			commentsHeader[commentsToUpdate[i][0]].appendChild(subscriberLabel);

		}

	}

	// Empty comments pending to update views
	commentsToUpdate.length = 0;

}
		
		
////// MAIN //////
		
// Check if it contains something and there are no views pending to process
if(commentsHeader.length > commentsHeaderUpdated.length && commentsToUpdate.length == 0) {

	// Build the URL based on the header
	var apiurl = "https://www.googleapis.com/youtube/v3/channels?part=statistics&id=";

	// List of URL (In case the requests reach MAX_API_REQUESTS)
	var urlArr = [];

	// List of unique channels id for the API request
	var uniqueIds; if(uniqueIds == undefined) uniqueIds = [];

	var APIKEY = "AIzaSyD55BYJZLrzwBEQJCFPYTfwAVxSiJxo0VM";
	var MAX_API_REQUESTS = 48; // YouTube API maximum

		for(var i=0;i<commentsHeader.length;i++) {

			// Check if the comment header doesn't have already the subscribers label
			if(!commentsHeader[i].getAttribute("subslabel")) {

				//Get the if of the channel
				var id = commentsHeader[i].getElementsByClassName("comment-author-text")[0].getAttribute("data-ytid");

				if(id.length!=0) {

					commentsHeader[i].setAttribute("subslabel","true");

				 	// Add comment to pending to update
				 	commentsToUpdate.splice(0,0,[i,id]);

					// If the ID isn't listed yet, add it to the unique list
					if(uniqueIds.indexOf(id) == -1) {
					 	uniqueIds.splice(0,0,id);

					 	//Append it to the URL
					 	apiurl+=id+",";

					 	if(uniqueIds.length==(MAX_API_REQUESTS + urlArr.length * MAX_API_REQUESTS)) {
					 		apiurl += "&key="+APIKEY;		
					 		urlArr.splice(0,0,apiurl);
							apiurl = "https://www.googleapis.com/youtube/v3/channels?part=statistics&id=";
					 	}
					}

				}

			}

		}

		apiurl += "&key="+APIKEY;
				
		// Call the API if there are comments pending to update views
		if(commentsToUpdate.length>0){
			// If apiurl has a length of 110 means there are not channel's ids added to it,
			// therefore, all the info is already locally stored, so we just update views.
			if(apiurl.length == 110) {
				updateView();
			} else {
				urlArr.splice(0,0,apiurl);
				httpGetAsync(urlArr,parseResponse);
			}

		}

	}
		
		
}