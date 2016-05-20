
window.onload = function(){

	//create a multi-purpose function for specifying different API calls
	var param = function(obj) {
		var str = ''
		for (i in obj){
			str += "&" + i + "=" + obj[i]
		};
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
	var x = document.getElementById("search_term").value;
	queryObject['q'] = x;
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
		var articleObj = articles.response.docs
		console.log(articleObj)

		var keywords = articleObj.map(function(article) {return article.keywords.map(function(keyword) {return keyword.value;});});
		
		console.log(keywords)

		var keys = document.getElementById('keywords');


		//the below could be definitely be more concise
		var list_keywords = [];

		keywords.forEach(function(key) { 
			key.forEach(function(word){
				list_keywords.push(word);
			});
		});

		list_keywords.sort();
		
		//instancesGen returns a new Object from an array that tracks the number of instances each item in the array appears
		var instancesGen = function(array){
			var instancesObj = new Object();
			for (var i = 0; i < array.length; i++){
				if (instancesObj.hasOwnProperty(array[i])) {
					instancesObj[array[i]] += 1;
					}
				else{
					instancesObj[array[i]] = 1
					};
			};
			return instancesObj;
		};
		

		var keyword_array = articleObj.map(function(article) {return {web_url: article.web_url, 

			headline: article.headline.main,

			abstract: article.abstract,

			keywords: article.keywords.filter(function(keyword) 
			{return keyword.is_major == "Y"}).map(function(keyword) 
				{return keyword.value})}
			});

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

		var keyword_instances = instancesGen(flat(keyword_array.map(function(prop) {return prop.keywords;})));

		console.log(keyword_instances)
		
		//creates keyword bubbles from object 'keyword_instances'
		var bubble = document.getElementById("keywordBubble");
		removeChildren('keywordBubble');


		for (var art in keyword_instances){
			var keyDiv = document.createElement('div')
			keyDiv.className = 'floatingKeyword';
			keyDiv.id = art;
			keyDiv.innerHTML = art;
			keyDiv.style.width = String(keyword_instances[art]*10 + 50) + "px";
			keyDiv.style.height = String(keyword_instances[art]*10 + 50) + "px";
			bubble.appendChild(keyDiv);
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
						articleRef.href = article.web_url;
						articleRef.innerHTML = article.headline;
						var abstractList = document.createElement('ul');
						var abstractItem = document.createElement('li');
						abstractItem.innerHTML = "<strong>Abstract: </strong>" + article.abstract;
						abstractList.appendChild(abstractItem);
						articleRef.appendChild(abstractList);
						list.appendChild(articleRef);
						}
					});
				});			
		};


	
};

