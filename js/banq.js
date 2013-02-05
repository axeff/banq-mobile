var lat;
var longi;
var loca;
var pressetext;
var stamp;
var city = 1;
var style;
var dbReadData;
var dbResult;
var kolumneID, specID;
var newsID, kolID, specialID, ticketID, read, newsName;
var pageName;
var infowindow;
var sqlsupport = !!window.openDatabase;
if(sqlsupport) {
	var db = window.openDatabase("merkzettel", "1.0", "merkzettel", 200000); //will create database
	db.transaction(dropOldDB);
	db.transaction(populateDB); 
}

$.ajaxSetup({
    cache: false
});

$(document).on( "pageshow", function() { 
	if(sqlsupport)
		checkForUpdates();
})

$(function() {
	document.addEventListener("deviceready", deviceReady, false);
	var tmpChangePage = $.mobile.changePage;
	var globalChangePageTimeout = false;

	$.mobile.changePage = function(toPage, options) {
		blockUI();
		if (globalChangePageTimeout)
			clearTimeout(globalChangePageTimeout);
		globalChangePageTimeout = setTimeout(function() {
			tmpChangePage(toPage, options);
			unblockUI();
		}, 100);
	};
});

/*
 * START ICON FUNCTIONS
 */
$('#cityDD').live('click', function() {
	city = 1;
	$.mobile.changePage('index.html', {allowSamePageTransition: true});
})

$('#cityLE').live('click', function() {
	city = 2;
	$.mobile.changePage('index.html', {allowSamePageTransition: true});
})

$('#todayBtn').live('click', function() {
	var today = new Date();
	var d = new Date(today.getFullYear(), today.getMonth(), today.getDate());
	var timestamp = Date.parse(d);
	timestamp = timestamp/1000;
	stamp = timestamp;
	$.mobile.changePage('index.html', {allowSamePageTransition: true});
})

$('#todayIcn').live('click', function() {
	var today = new Date();
	var d = new Date(today.getFullYear(), today.getMonth(), today.getDate());
	var timestamp = Date.parse(d);
	timestamp = timestamp/1000;
	stamp = timestamp;
	$.mobile.changePage('index.html', {allowSamePageTransition: true});
})

$('.gmap_btn').live('click', function(){
	lat = $(this).parent().parent().parent().children('.lat').text();
	longi = $(this).parent().parent().parent().children('.long').text();
	loca = $(this).parent().parent().parent().children('.location').text();
	$.mobile.changePage('map.html');
})

$('.presse_btn').live('click', function(){
	pressetext = $(this).parent().parent().parent().parent().children('.information').html();
	$.mobile.changePage('presse.html');
})

$('.one_date').live('click', function() {
	if(!$(this).children('.detail').is(":visible")) {
		$('.detail').hide();
		$(this).children('.moreContent').hide();
		$(this).children('.lessContent').show();
		$(this).children('.detail').show();
	}	
	else {
		$(this).children().children('.moreContent').show();
		$(this).children('.lessContent').hide();
		$(this).children('.detail').hide();
	}
})

/*
 * END ICON FUNCTIONS
 */

/*
 * START PAGE FUNCTIONS
 */

$('#start').live('pagecreate', function(event) {
	$("#start").bind('swipeleft',function(event, ui){
		var date = $('.dateOverlay').text();
		var tmp_date = date.split(".");
		timestamp = Date.parse(tmp_date[1] + "/" + tmp_date[0] + "/" + tmp_date[2]);
		timestamp = timestamp/1000;
		timestamp = timestamp + 86400;
		stamp = timestamp;
		$.mobile.changePage('index.html', {allowSamePageTransition: true});;	
	})
	$("#start").bind('swiperight',function(event, ui){
		var date = $('.dateOverlay').text();
		var tmp_date = date.split(".");
		timestamp = Date.parse(tmp_date[1] + "/" + tmp_date[0] + "/" + tmp_date[2]);
		timestamp = timestamp/1000;
		timestamp = timestamp - 86400;
		stamp = timestamp;
		$.mobile.changePage('index.html', {allowSamePageTransition: true});
	})
	var today = new Date();
	var d = new Date(today.getFullYear(), today.getMonth(), today.getDate());
	var timestamp = Date.parse(d);
	timestamp = timestamp/1000;
	stamp = timestamp;
})

$('#start').live('pageshow', function(event) {
	setCity();
	parseHtml(stamp, city);
})

$('#cal').live('pageinit', function () {
	$('#calendar').fullCalendar({
		buttonText: {
			prev: '&nbsp;&laquo;&nbsp;',
			next: '&nbsp;&raquo;&nbsp;'
		},
		height: get_calendar_height(),
		header: {
			left: 'prev',
			center: 'title',
			right: 'next'
		},
		monthNames: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
		monthNamesShort: ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'],
		dayNamesShort: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'],
		dayClick: function(date, allDay, jsEvent, view) {
			timestamp = Date.parse(date);
			stamp = timestamp/1000;
			$.mobile.changePage('index.html');
	    },
	    columnFormat: {
	        month: 'ddd',    // Mon
	        week: 'ddd d/M', // Mon 9/7
	        day: 'dddd d/M'  // Monday 9/7
	    }
	});
})

$('#cal').live('pageshow', function () {
	$('#calendar').fullCalendar('render');
})

$('#news').live('pageshow', function(event) {
	$('.loader').show();
	var output = "";
	$('#news_wrap').empty();
	$.get('http://www.banq.de/api/api3.php?action=getNews&apiKey=acd8b192c5aad5f134d1e4d5b70a299a&outputFormat=json', function(data) {
		$.each(data.allNews, function(i, value) {
			output += '<div data-role="collapsible" class="news_field">';
			output += '<h3>'+ value.news.title +'</h3>';
			output += '<p><small>'+value.news.date+'</small><br/><br/><strong>'+ value.news.title + '</strong><br/><br/>'+ value.news.content.replace(/\n/g, '<br />') + '<br/><br/>';
			output += '</div>';
		});
		$('#news_wrap').append(output);
		$('#news_wrap').collapsibleset("refresh");
		$('.loader').hide();
	})
	pageName = 'news';
	if(sqlsupport)
		db.transaction(setRead, errorCB);
})

$('#spezial').live('pageshow', function(event) {
	$('.loader').show();
	var output = "";
	$('#spezial_wrap').empty();
	$.get('http://www.banq.de/api/api3.php?action=getListOfSpecials&apiKey=acd8b192c5aad5f134d1e4d5b70a299a&outputFormat=json', function(data) {
		$.each(data.allSpecials, function(i, value) {
			output += '<li>';
			output += '<a onclick="showSpecial('+value.special.id+')" href="#">'+ value.special.title +'</a>';
			output += '</li>';
		});
		$('#spezial_wrap').append(output);
		$('#spezial_wrap').listview("refresh");
		$('.loader').hide();
	})
	pageName = 'special';
	if(sqlsupport)
		db.transaction(setRead, errorCB);
})

$('#kolumne').live('pageshow', function() {
	$('.loader').show();
	var output = "";
	$('#kolumne_wrap').empty();
	$.get('http://www.banq.de/api/api3.php?action=getListOfColumns&apiKey=acd8b192c5aad5f134d1e4d5b70a299a&outputFormat=json', function(data) {
		$.each(data.allColumns, function(i, value) {
			output += '<li>';
			output += '<a onclick="showKolumne('+value.column.id+')" href="#">'+ value.column.title +'</a>';
			output += '</li>';
		});
		$('#kolumne_wrap').append(output);
		$('#kolumne_wrap').listview("refresh");
		$('.loader').hide();
	})
	pageName = 'kolumne';
	if(sqlsupport)
		db.transaction(setRead, errorCB);
})

$('#kolumne_detail').live('pageshow', function() {
	$('.loader').show();
	$.get('http://www.banq.de/api/api3.php?action=getColumnById&apiKey=acd8b192c5aad5f134d1e4d5b70a299a&outputFormat=json&columnId='+kolumneID, function(data) {
		var output = data.column.text.replace(/\n/g, '<br />');
		$('#kolumneTitle').append(data.column.title);
		$('#kolumnetext').append(output);
		$('.loader').hide();
	})
})

$('#spezial_detail').live('pageshow', function() {
	$('.loader').show();
	$.get('http://www.banq.de/api/api3.php?action=getSpecialById&apiKey=acd8b192c5aad5f134d1e4d5b70a299a&outputFormat=json&specialId='+specID, function(data) {
		var output = data.special.text.replace(/\n/g, '<br />');
		$('#spezialTitle').append(data.special.title);
		$('#spezialtext').append(output);
		$('.loader').hide();
	})
})

$('#tickets').live('pageshow', function() {
	$('.loader').show();
	var output = "";
	$('#ticket_wrap').empty();
	$.get('http://www.banq.de/api/api3.php?action=getRaffles&apiKey=acd8b192c5aad5f134d1e4d5b70a299a&outputFormat=json', function(data) {
		$.each(data.allRaffles, function(i, value) {
			output += '<div data-role="collapsible" class="news_field">';
			output += '<h3>'+ value.raffle.title +'</h3>';
			output += '<p><small>'+value.raffle.date+'</small><br/><br/><strong>'+ value.raffle.title + '</strong><br/><br/>'+ value.raffle.content.replace(/\n/g, '<br />').replace(/<img[\s\S]*?>/g, '&nbsp;') + '<br/><br/>';
			output += '-------------------<br/><br/>';
			output += 'Auf <a style="color:#BC0000;" href="' + value.raffle.linkToNews + '">banq.de</a> teilnehmen</p>';
			output += '</div>';
		});
		$('#ticket_wrap').append(output);
		$('#ticket_wrap').collapsibleset("refresh");
		$('.loader').hide();
	})
	pageName = 'ticket';
	if(sqlsupport)
		db.transaction(setRead, errorCB);
})

$('#styles').live('pageshow', function() {
	$('.loader').show();

	var output = "";
	$('#style_wrap').empty();
	$.get('http://www.banq.de/api/api3.php?action=getListOfStyles&apiKey=acd8b192c5aad5f134d1e4d5b70a299a&outputFormat=json&cityId='+city, function(data) {
		$.each(data.allStyles, function(i, value) {
			output += '<li>';
			output += '<a onclick="showStyle('+value.style.id+')" href="#">'+ value.style.styleName +'</a>';
			output += '</li>';
		});
		$('#style_wrap').append(output);
		$('#style_wrap').listview("refresh");
		$('.loader').hide();
	})
	setCity();
})

$('#presse').live('pageshow', function() {
	$('#pressetext').empty();
	$('#pressetext').append(pressetext.replace(/\n/g, '<br />'));
})

$('.live-map').live('pageshow', function() {
	height = $('html').height();
	width = $('html').width();
	$('#live_map_canvas').css('height', height-112);
	$('#live_map_canvas').css('width', width);
	loadLiveMap();
	setCity();
})

$('.page-map').live('pageshow', function() {
	height = $('html').height();
	$('#map_canvas').css('height', height-112);
	loadMap(lat, longi, loca);
})

$('#style_detail').live('pageshow', function() {
	$('.loader').show();
	var output = "";
	var bannerImg, bannerLink;
	$.get('http://www.banq.de/api/api3.php?action=getEventBanner&apiKey=acd8b192c5aad5f134d1e4d5b70a299a&outputFormat=json', function(data) { 
		bannerImg = data.banner.imageUrl;
		bannerLink = data.banner.link;
	})
	$.get('http://www.banq.de/api/api3.php?action=getEventsByStyle&cityId='+ city +'&apiKey=acd8b192c5aad5f134d1e4d5b70a299a&outputFormat=json&styleId='+style, function(data) {
		$('#date_style_wrap').empty();
		if(data) {
			var date;
			$.each(data.event, function(i, value) {
				var genre = "";
				var lineup = "";
				var eventName = "";
				var locationName = "";
				var startTime = "";
				var price = "";
				if(value.eventStyles) {
					$.each(value.eventStyles, function(i, cat) {
						j = ++i;
						if(value.eventStyles[j] != null || value.eventStyles[j] != undefined)
							genre += cat.styleName + " | ";
						else
							genre += cat.styleName;
					})
				}
				if(value.eventDate.lineup)
					lineup = value.eventDate.lineup.replace(/\n/g, '<br />');
				if(value.eventDate.name)
					eventName = value.eventDate.name.replace(/\n/g, '<br />');
				if(value.eventLocation.name)
					locationName = value.eventLocation.name.replace(/\n/g, '<br />');
				if(value.eventDate.startTime)
					startTime = value.eventDate.startTime.replace(/\n/g, '<br />').substring(0, 5);
				if(value.eventDate.price)
					price = value.eventDate.price.replace(/\n/g, '<br />');

				// Integrate banner after third event

				if(i == 3) {
					output += '<div class="banner">';
					output += '<a href="'+bannerLink+'"><img src="'+bannerImg+'" /></a>';
					output += '</div>';
				}

				// show date, when it change

				if(i == 0) {
					date = value.eventDate.date
					output += '<div data-role="navbar" class="navbarTop" data-theme="d"><span>'+value.eventDate.date+'</span></div>';
				}	
				else if(date != value.eventDate.date) {
					date = value.eventDate.date
					output += '<div data-role="navbar" class="navbarTop" data-theme="d"><span>'+value.eventDate.date+'</span></div>';
				}
				output += '<div style="clear:both;"></div>';
				output += '<div class="one_date">';
				if(value.eventDate.tipp == true)
					output += '<div class="tipp"><img src="img/tipp.png" /></div>';
				output += '<div class="flyer">';
				if(value.eventFlyer.front != null)
					output += '<img src="'+value.eventFlyer.front+'" width="100" />';
				else
					output += '<img src="img/platzhalter.gif" width="100" />';
				output += '</div>';
				output += '<div class="content_meta">';
				output += '<div class="what">'+eventName+'</div>';
				output += '<div class="where"><a href="#" class="gmap_btn"><img width="12" src="./img/icons/07-map-marker-dark.png" alt="Map" /> <span class="locationName">'+locationName+'</span></a></div>';
				output += '<div class="genre">'+genre+'</div>';
				output += '<div class="moreContent"><img src="img/arrow.gif" /></div>';
				output += '</div>';
				output += '<div style="clear:both; height:0px;">&nbsp;</div>';
				output += '<div style="display:none;" class="detail">';
				output += '<div class="what_detail"><strong>Event:</strong><br/>'+eventName+'</div><br/>';
				if(genre)
					output += '<div class="genre_detail"><strong>Genre:</strong><br/>'+genre+'</div><br/>';
				if(startTime)
					output += '<div class="startTime"><strong>Uhrzeit:</strong><br/>'+startTime+' Uhr</div><br/>';
				if(price)
					output += '<div class="price"><strong>Preis:</strong><br/>'+price+'</div><br/>';
				if(lineup)
					output += '<div class="lineup"><strong>Lineup:</strong><br/>'+lineup+'</div><br/>';
				
				output += '<ul class="more">';
				if(value.eventDate.informations) {
					pressetext = value.eventDate.informations;
					output += '<li><a class="presse_btn"><img src="img/icnPresse.png" /> <span>Details</span></a></li>';
				}
				if(value.eventDate.mediaLink)
					output += '<li><a rel="external" href="'+value.eventDate.mediaLink+'"><img src="img/icnMedia.png" /> <span>Media</span></a></li>';
				if(value.eventDate.onlineTicketSale)
					output += '<li><a href="' + value.eventDate.onlineTicketSale + '"><img src="img/icnTicket.png" /> <span>Tickets</span></a></li>';
				output += '<div class="clear">&nbsp;</div></ul>';
				output += '</div>';
				output += '<div style="display:none" class="lat">'+value.eventLocation.latitude+'</div>';
				output += '<div style="display:none" class="long">'+value.eventLocation.longitude+'</div>';
				output += '<div style="display:none" class="information">'+value.eventDate.informations+'</div>';
				output += '<div style="display:none" class="eventDate">'+value.eventDate.date+'</div>';
				output += '<div style="display:none" class="location">'+locationName+'</div>';
				output += '</div>';
			});	
		}
		else {
			output += 'Keine Veranstaltungen gefunden.';
		}
		$('#date_style_wrap').append(output).trigger("create");
		$('.loader').hide();
	})
})

$('#bar_list').live('pageshow', function() {
	if(navigator.geolocation) {
      	navigator.geolocation.getCurrentPosition(function(position) {
            var pos_lat = position.coords.latitude;
            var pos_long = position.coords.longitude;
            setBars('&latitude='+pos_lat, '&longitude='+pos_long);
        }, function() {
    		setBars('', '');
        })
    }
    else {
    	setBars('', '');
    }
    var output = "";
    $.get('http://www.banq.de/api/api3.php?action=getListOfEatFoodCategories&apiKey=acd8b192c5aad5f134d1e4d5b70a299a&outputFormat=json', function(data) { 
		$('#popupBar').empty();
		if(data) {
			$.each(data.allCategories, function(i, value) {
				output += '<div  data-role="fieldcontain">';
				output += '<fieldset data-role="controlgroup" id="barOptionList">';
				output += '<input type="checkbox" name="'+value.category.name+'" value="'+value.category.id+'" class="custom" />';
				output += '<label for="'+value.category.name+'">'+value.category.name+'</label>';
				output += '</fieldset>';
				output += '</div>';
			})
		}
		$('#popupBar').append(output).trigger('create');
	})
})


/*
 * END PAGE FUNCTIONS
 */

 function setBars(pos_lat, pos_long) {
	$('.loader').show();
 	$('#bar_wrap').empty();
	var output = "";
	var bannerImg, bannerLink;
	$.get('http://www.banq.de/api/api3.php?action=getEatFoodBanner&apiKey=acd8b192c5aad5f134d1e4d5b70a299a&outputFormat=json', function(data) { 
		bannerImg = data.banner.imageUrl;
		bannerLink = data.banner.link;
	})
 	$.get('http://www.banq.de/api/api3.php?apiKey=acd8b192c5aad5f134d1e4d5b70a299a&action=getEatFood&outputFormat=json'+pos_lat+pos_long, function(data) {
		if(data) {
			$.each(data.locations, function(i, value) {
				var cat = "";
				var param = "";
				if(value.categories) {
					$.each(value.categories, function(i, cate) {
						j = ++i;
						if(value.categories[j] != null || value.categories[j] != undefined)
							cat += cate.category + ", ";
						else
							cat += cate.category;
					})
				}
				if(value.parameters) {
					$.each(value.parameters, function(i, para) {
						param += '<div><strong>'+para.parameter+':</strong> '+para.parameterValue+'</div>';
					})
				}

				// Integrate banner after third event
				if(i == 3) {
					output += '<div class="banner">';
					output += '<a href="'+bannerLink+'"><img src="'+bannerImg+'" /></a>';
					output += '</div>';
				}
				output += '<div class="one_date">';
				output += '<div class="content_meta_bars">';
				output += '<div><a href="#" class="gmap_btn barname"><img width="12" src="./img/icons/07-map-marker-dark.png" alt="Map" /> <span class="locationName">'+value.location.name+'</span></a></div>';
				output += '<div class="bargenre">'+cat+'</div>';
				output += '<strong>Adresse:</strong><br/>';
				output += '<div class="street">'+value.location.street+'</div>';
				output += '<div class="postal">'+value.location.zip+', '+value.location.city+'<br/><br/></div>';
				if(value.location.distance)
					output += '<div class="distance"><strong>Entfernung: </strong>'+value.location.distance+'</div>';
				if(param != null && param != "")
					output += '<div class="moreContent"><img src="img/arrow.gif" /></div>';
				output += '</div>';
				if(param != null && param != "") {
					output += '<div style="display:none;" class="detail">';
					output += param;
					output += '</div>';
				}
				output += '<div style="display:none" class="lat">'+value.location.latitude+'</div>';
				output += '<div style="display:none" class="long">'+value.location.longitude+'</div>';
				output += '<div style="display:none" class="location">'+value.location.name+'</div>';
				output += '</div>';
			});	
		}
		else {
			output += 'Keine Locations gefunden.';
		}
		$('#bar_wrap').append(output).trigger("create");
		$('.loader').hide();
	})
 }

function showSpecial(id) {
	specID = id;
	$.mobile.changePage('spezial_detail.html', {role: "dialog"});
}

function showStyle(id) {
	style = id;	
	$.mobile.changePage('style_detail.html');
}

function showKolumne(id) {
	kolumneID = id;
	$.mobile.changePage('kolumne_detail.html', {role: "dialog"});
}

function parseHtml(date, cityID) {
	$('.loader').show();
	var today = new Date();
	today.setTime (date * 1000);
	var day = new Array("00", "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20",
		"21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31");

	var month = new Array("01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12");

	var year = today.getFullYear();
	var timestring = day[today.getDate()] + '.' + month[today.getMonth()] + '.' + year;
	var banqstring = year + '-' + month[today.getMonth()] + '-' + day[today.getDate()];
	var output = "";
	var bannerImg, bannerLink;
	$.get('http://www.banq.de/api/api3.php?action=getEventBanner&apiKey=acd8b192c5aad5f134d1e4d5b70a299a&outputFormat=json', function(data) { 
		bannerImg = data.banner.imageUrl;
		bannerLink = data.banner.link;
	})

	$.get('http://www.banq.de/api/api3.php?action=getEvents&cityId='+ cityID +'&apiKey=acd8b192c5aad5f134d1e4d5b70a299a&outputFormat=json&timestamp='+date, function(data) {
		$('#date_wrap').empty();
		$('#date_change').empty();
		if(data) {
			$.each(data.event, function(i, value) {
				var genre = "";
				var lineup = "";
				var eventName = "";
				var locationName = "";
				var startTime = "";
				var price = "";
				if(value.eventStyles) {
					$.each(value.eventStyles, function(i, cat) {
						j = ++i;
						if(value.eventStyles[j] != null || value.eventStyles[j] != undefined)
							genre += cat.styleName + " | ";
						else
							genre += cat.styleName;
					})
				}
				if(value.eventDate.lineup)
					lineup = value.eventDate.lineup.replace(/\n/g, '<br />');
				if(value.eventDate.name)
					eventName = value.eventDate.name.replace(/\n/g, '<br />');
				if(value.eventLocation.name)
					locationName = value.eventLocation.name.replace(/\n/g, '<br />');
				if(value.eventDate.startTime)
					startTime = value.eventDate.startTime.replace(/\n/g, '<br />').substring(0, 5);
				if(value.eventDate.price)
					price = value.eventDate.price.replace(/\n/g, '<br />');

				if(i == 3) {
					output += '<div class="banner">';
					output += '<a href="'+bannerLink+'"><img src="'+bannerImg+'" /></a>';
					output += '</div>';
				}

				output += '<div class="one_date">';
				if(value.eventDate.tipp == true)
					output += '<div class="tipp"><img src="img/tipp.png" /></div>';
				output += '<div class="flyer">';
				if(value.eventFlyer.front != null)
					output += '<img src="'+value.eventFlyer.front+'" width="100" />';
				else
					output += '<img src="img/platzhalter.gif" width="100" />';
				output += '</div>';
				output += '<div class="content_meta">';
				output += '<div class="what">'+eventName+'</div>';
				output += '<div class="where"><a href="#" class="gmap_btn"><img width="12" src="./img/icons/07-map-marker-dark.png" alt="Map" /> <span class="locationName">'+locationName+'</span></a></div>';
				output += '<div class="genre">'+genre+'</div>';
				output += '<div class="moreContent"><img src="img/arrow.gif" /></div>';
				output += '</div>';
				output += '<div style="clear:both; height:0px;">&nbsp;</div>';
				output += '<div style="display:none;" class="detail">';
				output += '<div class="what_detail"><strong>Event:</strong><br/>'+eventName+'</div><br/>';
				if(genre)
					output += '<div class="genre_detail"><strong>Genre:</strong><br/>'+genre+'</div><br/>';
				if(startTime)
					output += '<div class="startTime"><strong>Uhrzeit:</strong><br/>'+startTime+' Uhr</div><br/>';
				if(price)
					output += '<div class="price"><strong>Preis:</strong><br/>'+price+'</div><br/>';
				if(lineup)
					output += '<div class="lineup"><strong>Lineup:</strong><br/>'+lineup+'</div><br/>';
				
				output += '<ul class="more">';
				if(value.eventDate.informations) {
					pressetext = value.eventDate.informations;
					output += '<li><a class="presse_btn"><img src="img/icnPresse.png" /> <span>Details</span></a></li>';
				}
				if(value.eventDate.mediaLink)
					output += '<li><a target="_blank" rel="external" href="'+value.eventDate.mediaLink+'"><img src="img/icnMedia.png" /> <span>Media</span></a></li>';
				if(value.eventDate.onlineTicketSale)
					output += '<li><a href="' + value.eventDate.onlineTicketSale + '"><img src="img/icnTicket.png" /> <span>Tickets</span></a></li>';
				output += '<div class="clear">&nbsp;</div></ul>';
				output += '</div>';
				output += '<div style="display:none" class="lat">'+value.eventLocation.latitude+'</div>';
				output += '<div style="display:none" class="long">'+value.eventLocation.longitude+'</div>';
				output += '<div style="display:none" class="information">'+value.eventDate.informations+'</div>';
				output += '<div style="display:none" class="eventDate">'+value.eventDate.date+'</div>';
				output += '<div style="display:none" class="location">'+locationName+'</div>';
				output += '</div>';
			});	
		}
		else {
			output += 'Heute leider keine Veranstaltungen.';
		}
		$('#date_wrap').append(output).trigger("create");
		$('#date_change').append('<a href="cal.html" class="dateOverlay">'+timestring+'</a>').trigger("create");
		$('.loader').hide();
	})
	
}

function setCity() {
	var citystring;

	if(city == 1)
		citystring = 'Dresden';
	if(city == 2) 
		citystring = 'Leipzig';

	$('.cityOverlay .ui-btn-text').text(citystring);
}

function get_calendar_height() {
    return $(window).height() - 115;
}


function setMarkers(map, m_lat, m_long, m_content) {
	var siteLatLng = new google.maps.LatLng(m_lat, m_long);
	var marker = new google.maps.Marker({
	    position: siteLatLng,
	    map: map
	});

	google.maps.event.addListener(marker, "click", function () {
	    infowindow.setContent(m_content);
	    infowindow.open(map, marker);
	});
}



function loadLiveMap() {
	var today = new Date();
	var d = new Date(today.getFullYear(), today.getMonth(), today.getDate()) 
	var marker;
	var bounds = new google.maps.LatLngBounds();
	var timestamp = Date.parse(d);
	timestamp = timestamp/1000;

	var mapOptions = {
        zoom: 4,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    }
    var map = new google.maps.Map(document.getElementById('live_map_canvas'), mapOptions);

    infowindow = new google.maps.InfoWindow({
        content: "loading..."
    });


    $('.loader').show();
	$.get('http://www.banq.de/api/api3.php?action=getEvents&cityId='+city+'&apiKey=acd8b192c5aad5f134d1e4d5b70a299a&outputFormat=json&timestamp='+timestamp, function(data) {
		$.each(data.event, function(i, value) { 
			var html = "";
			var eventName = "";
			var locationName = "";
			var startTime = "";
			var price = "";

			if(value.eventLocation.longitude != null) {
				
				if(value.eventDate.lineup)
					lineup = value.eventDate.lineup.replace(/\n/g, '<br />');
				if(value.eventDate.name)
					eventName = value.eventDate.name.replace(/\n/g, '<br />');
				if(value.eventLocation.name)
					locationName = value.eventLocation.name.replace(/\n/g, '<br />');
				if(value.eventDate.startTime)
					startTime = value.eventDate.startTime.replace(/\n/g, '<br />');
				if(value.eventDate.price)
					price = value.eventDate.price.replace(/\n/g, '<br />');
				else
					price = "Keine Angabe";
				
				html += "<p style='font-size:14px; margin:0;'><strong>Was:</strong> " + eventName + '</p>';
				html += "<p style='font-size:14px; margin:0;'><strong>Wo:</strong> " + locationName + '</p>';
				html += "<p style='font-size:14px; margin:0;'><strong>Wann:</strong> " + startTime.substring(0,5) + ' Uhr</p>';
				html += "<p style='font-size:14px; margin:0;'><strong>Preis:</strong> " + price + '</p>';
				
				bounds.extend(new google.maps.LatLng(value.eventLocation.latitude, value.eventLocation.longitude));

				setMarkers(map, value.eventLocation.latitude, value.eventLocation.longitude, html);
			}
		});
		map.fitBounds(bounds);
		$('.loader').hide();
	})

	if(navigator.geolocation) {
      	navigator.geolocation.getCurrentPosition(function(position) {
            var pos = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
            var beachMarker = new google.maps.Marker({
	            position: pos,
	            map: map,
	            icon: 'img/clientpos.png'
	        });
			bounds.extend(pos);
			map.fitBounds(bounds);
        })
    }
}

function loadMap(l_lat, l_long, l_loca){
	var locPos = new google.maps.LatLng(l_lat, l_long);
	var bounds = new google.maps.LatLngBounds();
	var mapOptions = {
        zoom: 4,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    }
    var map = new google.maps.Map(document.getElementById('map_canvas'), mapOptions);

    bounds.extend(locPos);

    marker = new google.maps.Marker({
		position: locPos,
		map: map
	});

    var infowindow = new google.maps.InfoWindow();

    infowindow.setContent(l_loca);
    infowindow.open(map, marker);

	map.fitBounds(bounds);


	if(navigator.geolocation) {
      	navigator.geolocation.getCurrentPosition(function(position) {
            var pos = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
            var beachMarker = new google.maps.Marker({
	            position: pos,
	            map: map,
	            icon: 'img/clientpos.png'
	        });
			bounds.extend(pos);
			map.fitBounds(bounds);
        })
    }
}

function deviceReady() {
	navigator.splashscreen.hide();
	document.addEventListener("backbutton", hitBackBtn, false);
	var con = checkConnection();
	if(con == false)
		$.mobile.changePage($('#four'));
}

function hitBackBtn() {
	if($.mobile.activePage.attr('id') == "start")
		navigator.app.exitApp();
	else
		navigator.app.backHistory();
}

function blockUI() {
	$('.loader').show();
}

function unblockUI() {
	$('.loader').hide();
}

function checkConnection() {
	browser = true;
	if (browser == false && (Connection.NONE == navigator.network.connection.type) || browser == false && (null == navigator.network.connection.type))
		return false;
}

function checkForUpdates() {	
	$.get('http://www.banq.de/api/api3.php?action=getMaxActiveNewsId&apiKey=acd8b192c5aad5f134d1e4d5b70a299a&outputFormat=json', function(data) {
		newsID = data.maxActiveNewsId;
	})
	$.get('http://www.banq.de/api/api3.php?action=getMaxActiveColumnId&apiKey=acd8b192c5aad5f134d1e4d5b70a299a&outputFormat=json', function(data) {
		kolID = data.maxActiveColumnId;
	})
	$.get('http://www.banq.de/api/api3.php?action=getMaxActiveRaffleId&apiKey=acd8b192c5aad5f134d1e4d5b70a299a&outputFormat=json', function(data) {
		ticketID = data.maxActiveRaffleId;
	})
	$.get('http://www.banq.de/api/api3.php?action=getMaxActiveSpecialId&apiKey=acd8b192c5aad5f134d1e4d5b70a299a&outputFormat=json', function(data) {
		specialID = data.maxActiveSpecialId;
	})
	dbResult = db.transaction(checkUpdatesDB,errorCB);
}

/************** DB FUNCTIONS ***************/
function insertDB(tx) {
	$.each(dbReadData, function(i, data) {
		tx.executeSql('INSERT INTO lastRead(value, read_id, read) VALUES ("'+data.value+'", "'+data.id+'", "'+data.read+'")');
	})
	checkReadStatus(tx);
}

//create table and insert some record
function populateDB(tx) {
	tx.executeSql('CREATE TABLE IF NOT EXISTS lastRead (id INTEGER PRIMARY KEY AUTOINCREMENT, value BLOB, read_id INTEGER, read INTEGER)');
}

function successCB() {
	alert("Erfolgreich gespeichert!");
}

function errorCB(err) {

}

function checkUpdatesDB(tx){
	tx.executeSql('SELECT * FROM lastRead', [] , checkSuccess, errorCB);
}

function checkSuccess(tx, result){
	var row;
	if(result.rows.length == 0) {
		dbReadData = {
			news: {
				value: "news", id: 12, read: 0
			},
			kolumne: {
				value: "kolumne", id: 13, read: 0
			},
			ticket: {
				value: "ticket", id: 14, read: 0
			},
			special: {
				value: "special", id: 15, read: 0
			}
		}
		db.transaction(insertDB, errorCB);
		return;
	}
	dbReadData = {};
	$.each(result.rows, function(index) {
		row = result.rows.item(index);
		if(row.value == 'news' && row.read_id != newsID) {
			dbReadData.news = {
				value: row.value, id: newsID, read: 0
			};
		}
		if(row.value == 'kolumne' && row.read_id != kolID) {
			dbReadData.kolumne = {
				value: row.value, id: kolID, read: 0
			};	
		}
		if(row.value == 'ticket' && row.read_id != ticketID) {
			dbReadData.ticket = {
				value: row.value, id: ticketID, read: 0
			};
		}
		if(row.value == 'special' && row.read_id != specialID) {
			dbReadData.special = {
				value: row.value, id: specialID, read: 0
			};
		}
	});
	db.transaction(updateID, errorCB);
}

function checkReadStatus(tx) {
	tx.executeSql('SELECT * FROM lastRead', [] , checkReadSuccess);
}

function checkReadSuccess(tx, result){
	var row;
	$.each(result.rows, function(index) {
		row = result.rows.item(index);
		if(row.read == 0) 
			$('.new_'+row.value).show();
		else
			$('.new_'+row.value).hide();
	});
}

function updateID(tx) {
	$.each(dbReadData, function(i, data) {
		tx.executeSql('UPDATE lastRead SET read_id = ' + data.id + ', read = ' + data.read + ' WHERE value = "' + data.value + '"');
	})
	checkReadStatus(tx);
}

function setRead(tx) {
	tx.executeSql('UPDATE lastRead SET read = 1 WHERE value = "' + pageName + '"');
	checkReadStatus(tx);
}

function dropOldDB(tx){
	tx.executeSql('DROP TABLE IF EXISTS Merkzettel');
}
