function TimeAgo(date){
  var units = {
    'second':60,
    'minute':60,
    'hour':24,
    'day':7,
    'week':1
  }
  var d = Date.parse(date);
  var now = (new Date).getTime();
  var time = (now-d)/1000;
  if (time < 1) {
    return 'moments ago';
  };
  
  for (unit in units){
    if(time < units[unit]-1){
      time = Math.round(time);
      return time  + " " + unit + (time == 1 ? '' : 's');
    }
    time = time / units[unit];
  };
  
  var formatter = new enyo.g11n.DateFmt({ format:'short' });
  return formatter.format(date);
}


function FormatDateTimeForListView(date){
	var units = {
			'second':60,
			'minute':60,
			'hour':24,
			'day':7,
			'week':1
	}
	var d = Date.parse(date);
	var now = (new Date).getTime();
	var time = (now-d)/1000;
	if (time < 1) {
		return 'moments ago';
	};

/*	for (unit in units){
		if(time < units[unit]-1){
			time = Math.round(time);
			return time  + " " + unit + (time == 1 ? '' : 's');
		}
		time = time / units[unit];
	};
*/
	var formatter = new enyo.g11n.DateFmt('MMMM d, yyyy');
	return formatter.format(date);
}

function FormatDateTimeForDetailView(date){
	var units = {
			'second':60,
			'minute':60,
			'hour':24,
			'day':7,
			'week':1
	}
	var d = Date.parse(date);
	var now = (new Date).getTime();
	var time = (now-d)/1000;
	if (time < 1) {
		return 'moments ago';
	};

/*	for (unit in units){
		if(time < units[unit]-1){
			time = Math.round(time);
			return time  + " " + unit + (time == 1 ? '' : 's');
		}
		time = time / units[unit];
	};
*/
	
	var formatter = new enyo.g11n.DateFmt('MMMM d, yyyy K:mma');
	return formatter.format(date);
}