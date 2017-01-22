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

// Injects CSS and JS
function inject(tab){
	browser.tabs.insertCSS(tab.id,{file: "/css/content-style.css"});
	browser.tabs.executeScript(tab.id,{file: "/js/content-script.js"});
}

// Sends a message to check if script was already injected, otherwise, it injects it
function checkAlreadyInjected(tab){
	browser.tabs.sendMessage(tab.id,{message: "awake"}, function(response){
		if(!response)
			inject(tab);
	});
}

// When first loaded, initialize the page action for all tabs.
var gettingAllTabs = browser.tabs.query({});
gettingAllTabs.then((tabs) => {
	for (tab of tabs) {
		checkAlreadyInjected(tab);
	}
});

// Check if the updated tab already has the injection.
browser.tabs.onUpdated.addListener((id, changeInfo, tab) => {
	checkAlreadyInjected(tab);
});
