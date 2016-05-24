
/*TO DO:
	-figure out how to make multiple calls
	-center keyword text size relative to div size
	-add search term within keyword bubble to filter keyword bubbles
	-Keyword categorization:
		-near synonyms;
		-names
		-books
		-orgs/countries
		-journals
	-look into 'HTML5 Drag and Drop' for dragging keywords into subseqent searches?
	-consider using SVGs for div circles

*/

window.onload = function(){

	//create a multi-purpose function for specifying different API calls
	var param = function(obj) {
		var str = '';
		for (i in obj){
			str += "&" + i + "=" + obj[i]
		}
		return str;
	};

	function call(){

		var url = 'https://api.nytimes.com/svc/search/v2/articlesearch.json'
		url += '?' + 'api-key=41315c4eb6074fdf8d8972e83fe73cd5' + param(queryObject)

		var xhr = new XMLHttpRequest();

		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4 && xhr.status == 200){
				var myArr = JSON.parse(xhr.responseText);
				nyTimes(myArr);
			}
		};

		xhr.open('GET', url, true)
		xhr.send();

		};

	var queryObject = {
		'q': '"climate change"',
		'page': '0',
		
	};

	document.getElementById("submitQuery").addEventListener('click', function() {
		var searcInput = document.getElementById("search_term").value;
		queryObject['q'] = searcInput;
		console.log(queryObject)
		call()
	});

	//clears HTML elements so new search can be implemented 
	var removeChildren = function(elementId){
		var myNode = document.getElementById(elementId);
		while (myNode.firstChild){
			myNode.removeChild(myNode.firstChild)
		};
	};


//idea for iterating through API calls?
// for (var i = 0; i < 10; i++){
// 	queryObject['page'] = i;
// 	call();
// };




	function nyTimes(articles){

		//HELPER FUNCTIONS

		//flatten function for multidimensional arrays; need to work on for more than 2d arrays
		var flat = function(array){
    		var newArr = [];
			for (var i = 0; i < array.length; i++){
                var innerArr = array[i]
				for (var j = 0; j < innerArr.length; j++){
					newArr.push(innerArr[j])
				};
			};
            return newArr;
		};

		//instancesGen returns a new Object from an array that tracks the number of instances each item in the array appears
		var instancesGen = function(array){
			var instancesObj = new Object();
			for (var i = 0; i < array.length; i++){
				if (instancesObj.hasOwnProperty(array[i])) {
					instancesObj[array[i]] += 1;
					}
				else{
					instancesObj[array[i]] = 1
					}
			}
			return instancesObj;
		};

		//categoryGen assigns each keyword is associated category; 
		//second conditional "else" checks to see if there are mutliple categories foreach keyword
		var categoryGen = function(array){
			var categoryObj = new Object();

			array.forEach(function(article) {
				article.keyword_scores.forEach(function(key) {

				var keyword = key.keyword;
				var category = key.category;

				if (!categoryObj.hasOwnProperty(keyword)){
					categoryObj[keyword] = category;
				}
				else if (categoryObj[keyword] !== category){
					categoryObj[keyword] = categoryObj[keyword] + " & " + category;
				};
				})
			});

			return categoryObj;
		};

		//scoreGen calculates the aggregate score for each of the keywords 
		var scoreGen = function(array) {
			var scoreObj = new Object();

			array.forEach(function(article) {
				article.keyword_scores.forEach(function(key) {
					var keyword = key.keyword;
					var score = key.score;

					if (scoreObj.hasOwnProperty(keyword)){
						scoreObj[keyword] += score;
					}
					else {
						scoreObj[keyword] = score;
					};
				})
			});
			return scoreObj;	
		}

		//calculates relevant score of each keyword instance 
		var calculateScore = function(arr) {
			/*
			if major +5; if not major -5
			Rank
			1 - +8
			2 - +7
			3 - +6
			4 - +5
			5 - +4
			6... - +0
			*/
			var rankScores = {'1': 8, '2': 7, '3': 6, '4': 5, '5': 4, "6+": 0}

			/*
			returned keyword array: 
			[
			{is_major: "Y/N", 
			name: (category)
			rank: #
			value: "keyword"}
			...
			]
			*/
			return arr.map(function(keyword) {
				var total = keyword.is_major === 'Y' ? 5 : -5
				if (keyword.rank < 6){
					total += rankScores[keyword.rank]
				}
				return {keyword: keyword.value, score: total, category: keyword.name};});

		};

		// colorAssignor takes the score for each particular keyword and assigns it a color
		var colorAssignor = function(keywordScore){

			var score = parseInt(keywordScore);

			if(0 < score && score <= 10){
					return "#C0C0C0"; //light grey;
			}
			else if (10 < score && score <= 20){
					return "#808080"; //darker grey;
			}
			else if (30 < score && score <= 40){
					return "#404040"; //darker grey;
			}
			else if (40 < score){
					return "#000000"; //almost black;
			}
				

		};



		//END OF HELPER FUNCTIONS


		var articleObj = articles.response.docs
		console.log(articleObj)

		var keywords = articleObj.map(function(article) {return article.keywords
			.map(function(keyword) {return keyword.value;});});
		
		//console.log(keywords)

		var keys = document.getElementById('keywords');


		//the below could be definitely be more concise
		var list_keywords = [];

		keywords.forEach(function(key) { 
			key.forEach(function(word){
				list_keywords.push(word);
			});
		});

		list_keywords.sort();
		
		
	
		var keyword_array = articleObj.map(function(article) {
			return {
				web_url: article.web_url, 
				headline: article.headline.main,
				abstract: article.abstract,
				keywords: article.keywords
					// .filter(function(keyword) {
					// 	return keyword.is_major == "Y";
					// })
					.map(function(keyword) {
						return keyword.value;
					}),
				keyword_scores: calculateScore(article.keywords)
			};
		});

		console.log(keyword_array)

		var keyword_instances = instancesGen(flat(keyword_array.map(function(prop) {return prop.keywords;})));
		var keyword_categories = categoryGen(keyword_array);
		var keyword_scores = scoreGen(keyword_array);

		//the below for loop takes the above objects and combines them into one object
		var masterKeywordObj = new Object();
		//use of keyword_instances is abitrary; just using it to generate the list of keyword properties 
		for (var keyword in keyword_instances){
			masterKeywordObj[keyword] = {score: keyword_scores[keyword], category: keyword_categories[keyword], instances: keyword_instances[keyword]}

		};

		console.log(masterKeywordObj);

		//creates keyword bubbles from object 'keyword_instances'
		var bubble = document.getElementById("keywordBubble");
		removeChildren('keywordBubble');

		//add keyword bubbles
		for (var keyword in keyword_instances){

			if (masterKeywordObj[keyword].score > 0){

				//add bubble
				var keyDiv = document.createElement('div')
				keyDiv.className = 'floatingKeyword';
				keyDiv.id = keyword;
				keyDiv.style.width = String(keyword_instances[keyword]*10 + 125) + "px";
				keyDiv.style.height = String(keyword_instances[keyword]*10 + 100) + "px";
				//add color to div according to score
				var score = masterKeywordObj[keyword].score;
				keyDiv.style.backgroundColor = colorAssignor(score);

				//add keyword
				var textDiv = document.createElement('div');
				textDiv.innerHTML = "<strong>" + keyword + "</strong";
				textDiv.style.fontSize = '15px';
				textDiv.style.verticalAlign = 'middle';

				//add category and score
				var categoryElement = document.createElement('p');
				categoryElement.innerHTML = keyword_categories[keyword].toUpperCase() + 
				"<br>" + masterKeywordObj[keyword].score + "</br"
				categoryElement.style.fontSize = '11px';
				categoryElement.style.verticalAlign = 'middle';

				if (masterKeywordObj[keyword].score > 30){
					keyDiv.style.color = "#FFFFFF";
				}

				
				keyDiv.appendChild(textDiv);
				keyDiv.appendChild(categoryElement);
				bubble.appendChild(keyDiv);

			};

		};

		//adds 'click' eventListener to each keyword bubble
		var bubbleClick = document.getElementById("keywordBubble").addEventListener('click', openLinks, false);
		function openLinks(e) {
			if (e.target !== e.currentTarget){
				var clickedItem = e.target.id
				relatedArticles(clickedItem)
			}
			e.stopPropagation();
		};

		console.log(keyword_array);


		//chug out related articles to each keyword 
		function relatedArticles(keywordId){
			removeChildren('links');
			var list = document.getElementById('links')
			keyword_array.forEach(function(article) 
				{article.keywords.forEach(function(keyword)
					{if (keyword == keywordId){
						var articleRef = document.createElement('li');
						articleRef.innerHTML = "<a href=" + article.web_url + ">" + article.headline + "</a>";
						var abstractList = document.createElement('ul');
						var abstractItem = document.createElement('li');

						var nullCase = "<i>No abstract available</i>"
						abstractItem.innerHTML = "<strong>Abstract: </strong>" + (article.abstract !== null ? article.abstract : nullCase);
						abstractList.appendChild(abstractItem);
						articleRef.appendChild(abstractList);
						list.appendChild(articleRef);
						}
					});
				});			
		};

		



		// for (var key in keyword_instances){
		// 	if (/\.*[,]\.*/.test(key)){
		// 		var cat = "PERSON"
		// 	}

		// 	switch(cat){
		// 		case "PERSON": //testing for people names
		// 			addCategory(key, "PERSON");
		// 			break;
		// 		default:
		// 			addCategory(key, "NO CATEGORY")
		// 	}
		// }






		// for (var art in keyword_instances){
		// 	document.getElementById(art).addEventListener('click', test(), false)
		// };





		// list_keywords.forEach(function(key){
		// 	var list = document.createElement('li')
		// 	list.innerHTML = key;
		// 	keys.appendChild(list); 
		// });




		




		//articleObj.map(function(article) {return })
		
};


		// var bookClubs = bookObject.data.map(function(group) {return {name: group.name, next_event: group.next_event, description: group.description, members: group.members};});
		
		// var rating = bookClubs.sort(function(a,b) {
		// 	if (a.members > b.members){
		// 		return -1;
		// 	}
		// 	if (b.members > a.members){
		// 		return 1;
		// 	}
		// 	return 0; 
		// });

		

		// console.log(rating);

		// //$('#list').append('<li>' + bookClubs['0'].name + '</li>');
		// var listEl = document.getElementById('list');


		// rating.forEach(function(group) {
		// 	var x = document.createElement('li');
		// 	x.innerHTML = group.name;
		// 	listEl.appendChild(x);

		// 	var newOl = document.createElement('ol');
		// 	var newLi = document.createElement('li');
		// 	newLi.innerHTML = group.description;
		// 	newOl.appendChild(newLi);

		// });

		//rating.map(function(group) {return document.getElementById('list') + ('<li>' + group.name + '</li>' + '<ul>' + '<li>' + group.description + '</li>' + '</ul>');});

	
};

