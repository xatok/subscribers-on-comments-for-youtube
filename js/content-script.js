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

var commentsCount; if(commentsCount==undefined) commentsCount=0;

//Get comments headers
var commentsHeader = document.getElementsByClassName("comment-renderer-header");

if(commentsHeader.length > commentsCount) {

	commentsCount = commentsHeader.length;
	
	var tabid;
	
	// Receives message from bg script
	browser.runtime.onMessage.addListener(receiver);
	function receiver(message) {
		if(isNumber(message))
			tabid = message;
	}
	
	// Boolean if updating
	var updating;
	
	window.addEventListener("click", notifyExtension);
	
	function notifyExtension(e) {
		if(!updating){
			if (e.target.className.indexOf("load-more-button") == -1) {
				return;
			}
			browser.runtime.sendMessage(tabid);
		}
	}
	
	
	if(updating == undefined || !updating) {
		
		updating = true;
		
		var APIKEY = "AIzaSyD55BYJZLrzwBEQJCFPYTfwAVxSiJxo0VM";
		var MAX_API_REQUESTS = 48; // YouTube API maximum
		var RANKS = ["0","10","100","1k","10k","100k","1m","10m","100m"];
	
		// all the pending comments to update views
		var commentsToUpdate; if(commentsToUpdate == null) commentsToUpdate = [];
		
		// count for every channel id
		var hashComments;  if(hashComments == null) hashComments = {};
	
		// Return true if obj is a number
		function isNumber(obj) {
			return !isNaN(parseFloat(obj))
		}
		
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
	
					var subscount = comments.items[i].statistics.subscriberCount;
					var id = comments.items[i].id;
					hashComments[id] = subscount;
	
				}
	
				if(urlArr.length==0)
					updateView();
				else
					httpGetAsync(urlArr,parseResponse);
	
			}
		}
		
		// Update views for each comment
		function updateView() {
	
			for(var i=0;i<commentsToUpdate.length;i++) {
	
				var subscount = hashComments[commentsToUpdate[i][1]];
	
				if(isNumber(subscount)) {
	
					// Create subscriber label
					var subscriberLabel = document.createElement("span");
					var dynClassName = "subslabel-label-bg bluebg-" + RANKS[subscount.length-1];
					subscriberLabel.className = dynClassName;
	
					var subscriberText = document.createElement("a");
					subscriberText.className = "subslabel-text";
	
					var text = document.createTextNode(subscount + " subscribers");
	
					subscriberText.appendChild(text);
					subscriberLabel.appendChild(subscriberText);
	
					// Finally, append the label
					commentsHeader[commentsToUpdate[i][0]].appendChild(subscriberLabel);
	
				}
	
			}
	
			// Empty comments pending to update views
			commentsToUpdate.length = 0;
	
			updating = false;
	
		}
		
		
		////// MAIN //////
		
		// Check if it contains something and there are no views pending to process
		if(commentsHeader.length > 0 && commentsToUpdate.length == 0) {
	
			// Build the URL based on the header
			var apiurl = "https://www.googleapis.com/youtube/v3/channels?part=statistics&id=";
	
			// List of URL (In case the requests reach MAX_API_REQUESTS)
			var urlArr = [];
	
			// List of unique channels id for the API request
			var uniqueIds; if(uniqueIds == null) uniqueIds = [];
	
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
				// If apiurl has a length of 110 means there's no channel's id added to it,
				// therefore, all the info is already locally stored, so we just update views.
				if(apiurl.length == 110) {
					updateView();
				} else {
					urlArr.splice(0,0,apiurl);
					httpGetAsync(urlArr,parseResponse);
				}
	
			}else{
				updating = false;
			}
	
		}else{
			updating = false;
		}
		
		
	}
}