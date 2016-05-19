
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
		//console.log('This is list_keywords:' + list_keywords)

		

		//console.log(list_keywords.length)

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
		

		var keyword_array = articleObj.map(function(article) {return {web_url: article.web_url, keywords: article.keywords.filter(function(keyword) 
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

		//console.log(keyword_array);
		console.log(keyword_instances)
		
		var bubble = document.getElementById("keywordBubble");

		for (var art in keyword_instances){
			var keyDiv = document.createElement('div')
			keyDiv.className = 'floatingKeyword';
			keyDiv.innerHTML = art;
			bubble.appendChild(keyDiv);
		};



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

