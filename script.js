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

	//Calculated depending on the time between the start date and end date of the query. 
	var dateIterator, timePeriod;

	//Converst from the New York Times date format to Javascript date format.
	var convertToJsDate = function(nyTimesDate) {
		var year = nyTimesDate.substring(0,4);
		var month = nyTimesDate.substring(4,6) - 1;
		var day = nyTimesDate.substring(6,8);
		return new Date(year, month, day);
	};

	//Converts the Javascript date format the New York Times format. 
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

	//Log new search query and call next function.
	document.onkeydown = function(e) {
	
		if (e.keyCode === 13) {
			if (document.getElementById('search_term').value === '') {
				alert("You didn't enter in a search query!");
			} else {
	
				var searchTerm = document.getElementById('search_term').value;
				
				//A double-check in the event that the start/endDateElements are switched. 
				var presumptiveStart = new Date(timeObject[startDateElement]);
				var presumptiveEnd = new Date(timeObject[endDateElement]);
	
				var startDate = presumptiveStart < presumptiveEnd ? presumptiveStart : presumptiveEnd;
				var endDate = presumptiveEnd > presumptiveStart ? presumptiveEnd : presumptiveStart;
	
				var calculateDateIterator = function(startDate, endDate) {
					//Year in miliseconds = 3.154e10.
					timePeriod = (endDate - startDate) / 3.154e10;
	
					if (timePeriod < 10) {
						dateIterator = 30;
					} else if (10 <= timePeriod && timePeriod < 50) {
						dateIterator = 90;
					} else if (50 <= timePeriod && timePeriod < 100) {
						dateIterator = 180;
					} else if (100 <= timePeriod) {
						dateIterator = 360; 
					}
				};
	
				calculateDateIterator(startDate, endDate);
	
				//Make keywordObject empty in case it isn't already is. 
				keywordObject = {};
	
				firstApiUrl = processNewSearchTerm(searchTerm, startDate, endDate);
				makeCall();
			}
		}
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

		//Checks to see if arguments are currently in Javascript format.
		if (typeof(startDate) === "object" || typeof(endDate) === "object") {
			var startDate_nytimes = convertToNyDate(startDate);
			var endDate_nytimes = convertToNyDate(endDate);
		} else {
			var startDate_nytimes = startDate;
			var endDate_nytimes = endDate;
		}

		//Checks to see if the arguments are currently in New York Times format. 
		if (typeof(startDate) === "string" || typeof(endDate) === "string") {
			var startDate_js = convertToJsDate(startDate);
			var endDate_js = convertToJsDate(endDate);
		} else {
			var startDate_js = startDate;
			var endDate_js = endDate;
		}

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
		var calculateScore = function(nytKeywordObject) {
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

			//The New York Times didn't really start giving their keywords attributes (i.e. 'is_major' and 'rank') until 2006, 
			//so this conditional accounts for cases where those attributes don't exist, giving the keyword a positive score
			//for simply being included in the list. 
			if (nytKeywordObject.is_major === undefined || nytKeywordObject.rank === undefined) {
				score += 8;
			} else {
				score += nytKeywordObject.is_major === 'Y' ? 5 : -5;
				if (nytKeywordObject.rank < 6) {
					score += rankScores[nytKeywordObject.rank]
				}
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

					//Adds another instance of the keyword.
					keywordObject[keyword.value].instances += 1;

					//Adds relevanceScore to pre-existing score.
					keywordObject[keyword.value].relevanceScore += relevanceScore;

					//Conditional accounts for times when a multiple instances of a keyword shows up in a related article. 
					//I believe it's an error on the NYTimes side.
					var articleDuplicate = false; 
					keywordObject[keyword.value].relatedArticles.forEach(function(articleCheck) {
						articleDuplicate = (articleCheck.title === article.headline.main);
					});

					if (!articleDuplicate) {
						//Adds article information to pre-existing array.
						keywordObject[keyword.value].relatedArticles.push(
								{
								title: article.headline.main,
								publicationDate: article.pub_date,
								abstract: article.abstract,
								url: article.web_url,
								individualRelevanceScore: relevanceScore,
								}
						);
					}

				} else {
					keywordObject[keyword.value] = {
						category: keyword.name,
						instances: 1,
						relevanceScore: relevanceScore,
						relatedArticles: [{
							title: article.headline.main,
							publicationDate: article.pub_date,
							abstract: article.abstract,
							url: article.web_url,
							individualRelevanceScore: relevanceScore,
						}],
					}

				}

			})
		});		
	};

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
				publicationDate: 'YYYY-MM-DDT00:00:00Z'
				abstract: 'abstract', 
				url: url, 
				individualRelevanceScore: #,
				},
				...
			], 
			... 
		]
		*/

		//Reformats 'publicationDate.' 'publicationDate' argument should be formatted as 'YYYY-MM-DDT00:00:00Z'.
		var editDate = function(publicationDate) {
			//Month numbers in Javascript format. 
			var month = new Array();
			month[0] = "January";
			month[1] = "February";
			month[2] = "March";
			month[3] = "April";
			month[4] = "May";
			month[5] = "June";
			month[6] = "July";
			month[7] = "August";
			month[8] = "September";
			month[9] = "October";
			month[10] = "November";
			month[11] = "December";

			var year = publicationDate.substring(0,4);
			var monthNum = publicationDate.substring(5,7);
			var day = publicationDate.substring(8,10);
			
			return month[monthNum-1] + " " + day + ", " + year;
		};

		Object.keys(keywordObject).forEach(function(keyword) {

			if (keywordObject[keyword].relevanceScore > 0) {
				var keywordDiv = document.createElement('div');
				keywordDiv.innerHTML = '<strong>' + keyword + '</strong>';
				keywordDiv.innerHTML += '<br>' + keywordObject[keyword].category + '</br>';
				keywordDiv.className = 'floatingKeyword';
				keywordDiv.id = keyword;

				//Determine size of the keyword div according to the number of instances it appears. Cut-off size at 350x250 px. 
				var width = keywordObject[keyword].instances*10 + 125;
				var height = keywordObject[keyword].instances*10 + 100;
				keywordDiv.style.width = width > 350 ? 350 + 'px' : width + 'px';
				keywordDiv.style.height = height > 250 ? 250 + 'px' : height + 'px';

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
							publicationDate: 'YYYY-MM-DDT00:00:00Z' 
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
						//Create table to contain each unique article elements.
						var articleEntry = document.createElement('table');
						articleEntry.className = 'articleTables';

						//Add title of article with embedded link. 
						var articleTitle = document.createElement('li');
						var tableHeader = document.createElement('th');
						articleTitle.innerHTML = '<a href=' + article.url + '>' + article.title + '</a>'; 
						tableHeader.appendChild(articleTitle);
						articleEntry.appendChild(tableHeader);

						//Add publication date. 
						var pubdateRow = document.createElement('tr');
						var articlePubdate = document.createElement('td');
						articlePubdate.innerHTML = "<strong>Publication date: </strong>" + editDate(article.publicationDate);
						pubdateRow.appendChild(articlePubdate);
						articleEntry.appendChild(pubdateRow);

						//Add abstract row. 
						var abstractRow = document.createElement('tr');
						var articleAbstract = document.createElement('td');
						var nullCase = "<i>No abstract available</i>"
						articleAbstract.innerHTML = "<strong>Abstract: </strong>" + (article.abstract !== null ? article.abstract : nullCase);
						abstractRow.appendChild(articleAbstract);
						articleEntry.appendChild(abstractRow);

						//Add the whole table to the articleList div. 
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

          //Console live API information. 
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
    	
    	//Base Case.
		if (apiObject.startDate_js >= apiObject.endDate_js) {
			console.log("FINISHED");
			removeChildren('loadingElement')
			refreshPage();
			console.log(apiObject);
			return;
		}

		//Call new API recursively. 
		loadNewPage(apiObject, function() {

			//Adds dynamic loading text for user convenience. 
			removeChildren('loadingElement');
			var load = document.getElementById('loadingElement');
			load.innerHTML = 'Loading ' + apiObject.startDate_js.getFullYear();

			var newApiObject = apiObject;

			var newStartDate_js = newApiObject.startDate_js;
			
			//Dateiterator already determined by date range input.
			newStartDate_js.setDate(newStartDate_js.getDate() + dateIterator);

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
    FOR REFERENCE: 
    firstApiUrl = {url: url, startDate: startDate_js, endDate: endDate_js, searchTerm: searchTerm};
    */

     //Moving data parameters. 
	var selected = null, // Object of the element to be moved
	    x_pos = 0, // Stores x oordinates of the mouse pointer
	    x_elem = 0,// Stores eft values (edge) of the element
	    x_max = 600,
	    x_min = 0,
	    x_temp;

	// Will be called when user starts dragging an element
	var drag = function(elem) {
	    // Store the object of the element which needs to be moved
	    selected = elem; //return the divId you just clicked on
	};

	// Will be called when user dragging an element
	var moveElement = function(e) {
		startDateElement = document.getElementById('startDateElement').offsetLeft;
	    endDateElement = document.getElementById('endDateElement').offsetLeft;

	    x_pos = document.all ? window.event.clientX : e.pageX; 

	    if (selected !== null) {
	    	var currentElement = selected.id;
	    	x_temp = x_pos; 

	    	if (currentElement === 'endDateElement') {
	    		x_temp = x_pos - 250;
	    	} else if (currentElement === 'startDateElement') {
	    		x_temp = x_pos - 210;
	    	}
		//Clean up. 	
		removeChildren('start');
		removeChildren('end');

		startD.innerHTML = (new Date(timeObject[startDateElement])).getFullYear();
		endD.innerHTML = (new Date(timeObject[endDateElement])).getFullYear();

		start.appendChild(startD);
		end.appendChild(endD);
	        selected.style.left = x_temp + 'px';
	    }
	};

	// Destroy the object when we are done
	var deSelect = function() {
	    selected = null;
	};

	var startDateElement = document.getElementById('startDateElement').offsetLeft;
	document.getElementById('startDateElement').onmousedown = function (e) {
		console.log(document.activeElement);
	    drag(this);
	    return false;
	};

	var endDateElement = document.getElementById('endDateElement').offsetLeft;
	document.getElementById('endDateElement').onmousedown = function () {
		console.log(document.activeElement);
		//add consoles for 
	    drag(this);
	    return false;
	};

	document.onmousemove = moveElement;
	document.onmouseup = deSelect;

	//50-920 --- Sept 18, 1851 - Present (2016) 165 years 
	//165 years
	//year in miliseconds 3.154e10
	var today = new Date();
	var startDate = new Date(1851, 8, 18);

	var pixelRangeStart = 50;
	var pixelRangeEnd = 920;

	//Number of miliseconds per pixel. 
	var miliPerPixel = (today - startDate) / 870;

	var timeObject = {};

	for (var propPixels = pixelRangeStart, dateIterator = startDate.getTime(); propPixels < pixelRangeEnd;) {
		timeObject[propPixels] = dateIterator; 
		dateIterator += miliPerPixel;
		propPixels += 1;
	}

	//Adds the first start/end dates to the parameters. 
	var start = document.getElementById('start');

    var startD = document.createElement('div');
    startD.innerHTML = (new Date(timeObject[startDateElement])).getFullYear();

    var end = document.getElementById('end');

    var endD = document.createElement('div');
    endD.innerHTML = (new Date(timeObject[endDateElement])).getFullYear();

    start.appendChild(startD);
    end.appendChild(endD);

};




