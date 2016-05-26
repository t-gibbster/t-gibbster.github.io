/*
TO DO:
-add other related keywords to master keyword object?
-what about keywords prior to 2006?
BUGS:
-obama was iterating over 'persons' category...

*/


window.onload = function() {

	//Master keyword object for all keyword information. 
	var keywordObject = {};
	/*
	KEYWORD: [
		{
		category: 'category name'
		instances: #, 
		relevanceScore: #, 
		relatedArticles: [
			{
			title: 'article title', 
			Abstract: 'abstract', 
			URL: url, 
			individualRelevanceScore: #,
			},
			...
		], 
		... 
	]
	*/

	//Container to start initiating calls. 
	var firstApiUrl = {};

	//Log new search query and call next function.
	var submit = document.getElementById('submitQuery');
	submit.onclick = function() {
			var searchTerm = document.getElementById('search_term').value;
			var startDate = document.getElementById('startDate').value;
			var endDate = document.getElementById('endDate').value;
			//Assuming we are entering dates in NY format
			//FIXME: need to catch empty values and return to user alerts

			//Make keywordObject empty in case it isn't already is. 
			keywordObject = {};

			firstApiUrl = processNewSearchTerm(searchTerm, startDate, endDate);
			makeCall();
	};

	//Clears HTML elements so new search can be implemented. 
	var removeChildren = function(elementId){
		var myNode = document.getElementById(elementId);
		while (myNode.firstChild){
			myNode.removeChild(myNode.firstChild)
		};
	};

	//Process search query and the build URL for the API calls. 
	var processNewSearchTerm = function(searchTerm, startDate, endDate) {

		//Clean up of any existing HTML elements from last search. 
		removeChildren('keywordBubble'); //definitely need to rename
		removeChildren('links');
		
		//Assuming we are taking a NYTimes formatted date.
		var convertToJsDate = function(nyTimesDate) {
			var year = nyTimesDate.substring(0,4);
			var month = nyTimesDate.substring(4,6) - 1;
			var day = nyTimesDate.substring(6,8);
			return new Date(year, month, day);
		};

		//Converts the date the New York Times format. 
		var convertToNyDate = function(javscriptDate) {
			var year = String(javscriptDate.getFullYear());
			var month = String(javscriptDate.getMonth() + 1);
			if (month.length !== 2) {
				month = '0' + month;
			}
			var day = String(javscriptDate.getDate());
			if (day.length !== 2) {
				day = '0' + day;
			}
			return year + month + day; 
		};

		//Checks to see if arguments are currently in Javascript format.
		if (typeof(startDate) === "object" || typeof(endDate) === "object") {
			var startDate_nytimes = convertToNyDate(startDate);
			var endDate_nytimes = convertToNyDate(endDate);
		}
		else {
			var startDate_nytimes = startDate;
			var endDate_nytimes = endDate;
		}

		//Checks to see if the arguments are currently in New York Times format. 
		if (typeof(startDate) === "string" || typeof(endDate) === "string") {
			
			var startDate_js = convertToJsDate(startDate);
			var endDate_js = convertToJsDate(endDate);
		}
		else {
			var startDate_js = startDate;
			var endDate_js = endDate;
		}

		//FIXME: Reformat date inputs in accordance with NY Times API, i.e. "YYYYMMDD"

		//Begins building URL to be used in API call
		var url = 'https://api.nytimes.com/svc/search/v2/articlesearch.json';
		//Adds API key.
		url += '?' + 'api-key=41315c4eb6074fdf8d8972e83fe73cd5';
		//Adds search parameters.
		url += '&' + 'q' + '=' + searchTerm;
		url += '&' + 'begin_date' + '=' + startDate_nytimes;
		url += '&' + 'end_date' + '=' + endDate_nytimes;

		

		return {url: url, startDate_js: startDate_js, endDate_js: endDate_js, searchTerm: searchTerm};
	};

	//Process new JSON and log data into the keywordObject. 
	var addToKeywordObject = function(jsonObject) {

		//Array of 10 articles for each API call. 
		var articleArray = jsonObject.response.docs;

		//Saves meta data regarding search query. 
		var metaDataObject = jsonObject.response.meta;
		/*
		{meta: 
			{
			hits: #,
			offset: #,
			time: #
			}
		}
		*/

		//Calculates relevance score for each keyword within each article
		var calculateScore = function(keywordObject) {
			/*
			If keyword is marked 'major' then +5
			If keyword is NOT marked 'major' then -5
			Rank Score
				1st - +8
				2nd - +7
				3rd - +6
				4th - +5
				5th - +4
				6th... - +0
			*/
			var rankScores = {'1': 8, '2': 7, '3': 6, '4': 5, '5': 4, "6+": 0};
			var score = 0;
			score += keywordObject.is_major === 'Y' ? 5 : -5;
			if (keywordObject.rank < 6) {
				score += rankScores[keywordObject.rank]
			}
			return score; 
		};

		/*
		Returned keyword array: [
			{
			is_major: "Y/N", 
			name: (category),
			rank: #,
			value: "keyword",
			},
			...
		]
		*/

		//Adjusts keywordObject according to new data set. 
		articleArray.forEach(function(article) {
			article.keywords.forEach(function(keyword) {

				var relevanceScore = calculateScore(keyword);

				if (keywordObject.hasOwnProperty(keyword.value)) {

					// //Checks to see if the pre-existing category differs from the current one
					// if (keywordObject[keyword.value].category !== keyword.name) {
					// 	keywordObject[keyword.value].category = keywordObject[keyword.value].category + ' & ' + keyword.name;
					// }

					//Adds another instance of the keyword.
					keywordObject[keyword.value].instances += 1;

					//Adds relevanceScore to pre-existing score. 
					keywordObject[keyword.value].relevanceScore += relevanceScore;

					//Adds article information to pre-existing array.
					keywordObject[keyword.value].relatedArticles.push(
							{
							title: article.headline.main,
							abstract: article.abstract,
							url: article.web_url,
							individualRelevanceScore: relevanceScore,
							}
					);

				}
				else {
					keywordObject[keyword.value] = {
						category: keyword.name,
						instances: 1,
						relevanceScore: relevanceScore,
						relatedArticles: [{
							title: article.headline.main,
							abstract: article.abstract,
							url: article.web_url,
							individualRelevanceScore: relevanceScore,
						}],
					}

				}

			})
		});		
	};

	// //Adds 'click' eventListener to each keyword bubble.
	// var bubbleClick = document.getElementById("keywordBubble").addEventListener('click', openLinks, false);

	// var openLinks = function(e) {
	// 	if (e.target !== e.currentTarget){
	// 		var clickedItem = e.target.id
	// 		relatedArticles(clickedItem)
	// 	}
	// 	e.stopPropagation();
	// };

	// 	//Lists out related articles to each keyword.
	// var relatedArticles = function(keyword) {
	// 	removeChildren('links');
	// 	var list = document.getElementById('links')
	// 	keywordObject[keyword].relatedArticles.forEach(function(article) {
	// 		var articleRef = document.createElement('li');
	// 		articleRef.innerHTML = "<a href=" + article.url + ">" + article.title + "</a>";
	// 		// var abstractList = document.createElement('ul');
	// 		// var abstractItem = document.createElement('li');

	// 		// var nullCase = "<i>No abstract available</i>"
	// 		// abstractItem.innerHTML = "<strong>Abstract: </strong>" + (article.abstract !== null ? article.abstract : nullCase);
	// 		// abstractList.appendChild(abstractItem);
	// 		// articleRef.appendChild(abstractList);
	// 		list.appendChild(articleRef);
	// 	});	
	// };

	var refreshPage = function() {

		// colorAssignor takes the score for each particular keyword and assigns it a color
		var colorAssignor = function(keywordScore) {
			var score = parseInt(keywordScore);
			if (0 < score && score <= 10) {
					return "#C0C0C0"; //light grey;
			} else if (10 < score && score <= 20) {
					return "#808080"; //darker grey;
			} else if (30 < score && score <= 40) {
					return "#404040"; //darker grey;
			} else if (40 < score) {
					return "#000000"; // black;
			}
		};

		/*
		For reference: 
		KEYWORD: [
			{
			category: 'category name'
			instances: #, 
			relevanceScore: #, 
			relatedArticles: [
				{
				title: 'article title', 
				Abstract: 'abstract', 
				url: url, 
				individualRelevanceScore: #,
				},
				...
			], 
			... 
		]
		*/

		Object.keys(keywordObject).forEach(function(keyword) {

			if (keywordObject[keyword].relevanceScore > 0) {
				var keywordDiv = document.createElement('div');
				keywordDiv.innerHTML = '<strong>' + keyword + '</strong>';
				keywordDiv.innerHTML += '<br>' + keywordObject[keyword].category + '</br>';
				keywordDiv.className = 'floatingKeyword';
				keywordDiv.id = keyword;

				keywordDiv.style.width = String(keywordObject[keyword].instances*10 + 125) + 'px';
				keywordDiv.style.height = String(keywordObject[keyword].instances*10 + 100) + 'px';
				//add color to div according to score
				keywordDiv.style.backgroundColor = colorAssignor(keywordObject[keyword].relevanceScore);

				//Change text to white if the keywordDiv is dark. 
				if (keywordObject[keyword].relevanceScore > 30) {
					keywordDiv.style.color = '#ffffff';
				};

				var bubble = document.getElementById('keywordBubble');

				bubble.appendChild(keywordDiv);

				//To add functionality to each keyword block to load the list of 
				//related articles to that specific keyword. 
				var keywordBlock = document.getElementById(keyword);
				keywordBlock.onclick = function() {
					//Cleanup any prexisting article list. 
					removeChildren('links');
					
					/*
					For reference: 
					keywordObject = {
						KEYWORD: 
						{
						category: 'category name'
						instances: #, 
						relevanceScore: #, 
						relatedArticles: [
							{
							title: 'article title', 
							Abstract: 'abstract', 
							url: url, 
							individualRelevanceScore: #,
							},
						], 
						... 
						}
						...
					}
					*/

					var articleList = document.getElementById('links');

					keywordObject[keyword].relatedArticles.forEach(function(article) {
						//Add title 
						var articleEntry = document.createElement('li');
						articleEntry.innerHTML = '<a href=' + article.url + '>' + article.title + '</a>'; 
						articleList.appendChild(articleEntry);
					});
				};
			}
		})

	};

	//In order to keep track of the number of API calls in the console. 
	var counter = 0; 

	//Execute API call.
	var loadNewPage = function(apiObject, cb) {
      
      var xhr = new XMLHttpRequest();
      xhr.onreadystatechange = function() {
        if (xhr.readyState == 4 && xhr.status == 200){
          var newJson = JSON.parse(xhr.responseText);
          addToKeywordObject(newJson);

          //Console info. 
          console.log(keywordObject);
          counter += 1;
          console.log("NUMBER OF CALLS: ", counter);

          //Callback function to hold the next API call until the previous one has completed.
          cb();
        }
      };
      xhr.open('GET', apiObject.url, true)
      xhr.send();
    }

    //Callback function as specified as a parameter in 'loadNewPage' function to be passed to make successive API calls.
    var makeRequests = function(apiObject) {
    	
    	//Base Case
		if (apiObject.startDate_js >= apiObject.endDate_js) {
			console.log("FINISHED");
			refreshPage();
			return;
		}

		//Call new API recursively. 
		loadNewPage(apiObject, function() {
			var newApiObject = apiObject;

			//Add 30 days to start date.
			var newStartDate_js = newApiObject.startDate_js;
			newStartDate_js.setDate(newStartDate_js.getDate() + 30);
			newApiObject.startDate_js = newStartDate_js;

			newApiObject = processNewSearchTerm(newApiObject.searchTerm, newStartDate_js, newApiObject.endDate_js)

			//add a call to processNewSearchterm to build new URL
			makeRequests(newApiObject);

		});
    }

    //Starts the API calls. 
    function makeCall() {
    	makeRequests(firstApiUrl);
    };

    /*
    firstApiUrl = {url: url, startDate: startDate_js, endDate: endDate_js, searchTerm: searchTerm};
    */

	var selected = null, // Object of the element to be moved
	    x_pos = 0, // Stores x oordinates of the mouse pointer
	    x_elem = 0,// Stores eft values (edge) of the element
	    x_max = 575,
	    x_min = 0,
	    x_temp;

	// Will be called when user starts dragging an element
	var drag = function(elem) {
	    // Store the object of the element which needs to be moved
	    selected = elem; //return the divId you just clicked on
	    x_elem = selected.offsetLeft; // selected.offsetLEft returns position of the div you clicked, x_pos is not 0, result negative?
	    

	};

	// Will be called when user dragging an element
	//'e' is the event, the function associated with the event handler receives itself as an argument 
	var moveElement = function(e) {
	    x_pos = document.all ? window.event.clientX : e.pageX; //x_pos reassigned to the position of the cursor 
	    timeElement1 = document.getElementById('draggable-element1').offsetLeft;
	    timeElement2 = document.getElementById('draggable-element2').offsetLeft;
	    //console.log(timeElement1)
	    if (selected !== null) {
	    	var currentElement = selected.id;
	    	x_temp = x_pos - x_elem;
	    	//console.log('x_temp is ', x_temp)
	    	// if (currentElement = 'draggable-element1') {
	    	// 	x_max = x_max > timeElement2 ? x_max : timeElement2;
	    	// }
	    	if (currentElement === 'draggable-element1') {
		    	if (x_temp > x_max || x_temp > timeElement2) {
		    		x_temp = x_max > timeElement2 ? x_max : timeElement2;
		    	} else if (x_temp < x_min) {
		    		x_temp = x_min; 
		    	}
		    } else if (currentElement === 'draggable-element2') {
		    	if (x_temp > x_max) {
		    		x_temp = x_max;
		    	} else if (x_temp < x_min || x_temp < timeElement2) {
		    		x_temp = x_min > timeElement1 ? x_min : timeElement1; 
		    	}
		    }
	        selected.style.left = x_temp + 'px';

	    }
	};

	// Destroy the object when we are done
	var deSelect = function() {
	    selected = null;
	};

	var timeElement1 = document.getElementById('draggable-element1').offsetLeft;
	console.log(timeElement1)
	document.getElementById('draggable-element1').onmousedown = function () {
	    drag(this);
	    return false;
	};

	var timeElement2 = document.getElementById('draggable-element2').offsetLeft;
	document.getElementById('draggable-element2').onmousedown = function () {
	    drag(this);
	    return false;
	};

	document.onmousemove = moveElement;
	document.onmouseup = deSelect;

};




