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

// Receives message from injected script
browser.runtime.onMessage.addListener(receiver);
function receiver(message) {

	if(isNumber(message))
		browser.tabs.executeScript(message,{file: "js/content-script.js"});
}

// Return true if obj is a number
function isNumber(obj) {
	return !isNaN(parseFloat(obj))
}

function update(tab){
	browser.tabs.sendMessage(tab.id,tab.id);
	browser.tabs.insertCSS(tab.id,{file: "css/content-style.css"});
	browser.tabs.executeScript(tab.id,{file: "js/content-script.js"});
}

// When first loaded, initialize the page action for all tabs.
var gettingAllTabs = browser.tabs.query({});
gettingAllTabs.then((tabs) => {
	for (tab of tabs) {
		update(tab);
	}
});

// Each time a tab is updated, reset the page action for that tab.
browser.tabs.onUpdated.addListener((id, changeInfo, tab) => {
	update(tab);
});
