



window.onload = function(){




/*
	var cityInfo = function(cityObject){
		$('#demo').append(cityObject.data['0'].city);


	};
//<script type='text/javascript' src="https://ajax.googleapis.com/ajax/libs/jquery/2.2.2/jquery.min.js"></script>


	var city = $.getJSON("https://api.meetup.com/find/locations?key=534d254a7b326f496eb5b133b241e11&sign=true&query=98105&callback=?", cityInfo);
*/

	var xhr = new XMLHttpRequest();
	//var url = "https://api.meetup.com/find/groups?photo-host=public&zip=94606&page=20&sig_id=182898232&category=18&sig=62a83728d85762baa4e947f879f561e4f3e33202&callback=?"

	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4 && xhr.status == 200){
			var myArr = JSON.parse(xhr.responseText);
			bookClubs(myArr);
		}
	};

	xhr.open('GET', 'https://api.meetup.com/find/groups?photo-host=public&zip=94606&page=20&sig_id=182898232&category=18&sig=62a83728d85762baa4e947f879f561e4f3e33202&callback=?', true);
	xhr.send();

	function bookClubs(bookObject){

		console.log(bookObject.data)

		var bookClubs = bookObject.data.map(function(group) {return {name: group.name, next_event: group.next_event, description: group.description, members: group.members};});
		
		var rating = bookClubs.sort(function(a,b) {
			if (a.members > b.members){
				return -1;
			}
			if (b.members > a.members){
				return 1;
			}
			return 0; 
		});

		

		console.log(rating);

		//$('#list').append('<li>' + bookClubs['0'].name + '</li>');
		var listEl = document.getElementById('list');


		rating.forEach(function(group) {
			var x = document.createElement('li');
			x.innerHTML = group.name;
			listEl.appendChild(x);

		});

		//rating.map(function(group) {return document.getElementById('list') + ('<li>' + group.name + '</li>' + '<ul>' + '<li>' + group.description + '</li>' + '</ul>');});


	};

	

	//var bookClubs = $.getJSON("https://api.meetup.com/find/groups?photo-host=public&zip=94606&page=20&sig_id=182898232&category=18&sig=62a83728d85762baa4e947f879f561e4f3e33202&callback=?", bookClubs);
	



};


