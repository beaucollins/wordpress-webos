/*

Desired usage:

  Declare component:
  { name: 'xmlrpc_client', kind:'XMLRPCService', url:'http://beaucollins.wordpress.com/xmlrpc.php' }
  
  Then can be used:
  
  // add the methodName and methodParams
  this.$.xmlrpc_client.call({methodName:'wp.getComments', methodParams:[one, two, three]});
  
  // a little more convenient, would be a wrapper for previous call
  this.$.xmlrpc_client.callMethod('wp.getComments', [one, two, three], {} );
  
  // Then a service built on top of the XMLRPCService could define their own methods?

*/
enyo.kind({
  name: 'XMLRPCService',
  kind: 'WebService',
  requestKind: 'XMLRPCService.Request',
  method:"POST",
  handleAs:'xml',
  contentType:'text/xml',
  events: {
    onRequestFault:''
  },
  published: {
    methodName: "",
    methodParams:[]
  },
  importProps:function(props){
    this.inherited(arguments);
    this.onRequestFault = props.onRequestFault || this.masterService.onRequestFault;
    this.url = props.url || this.masterService.url;
  },
  callMethod:function(params, options){
    // able to override the methodName and methodParams
    if(params.methodName) this.methodName = params.methodName;
    if(params.methodParams) this.methodParams = params.methodParams;
    return this.call({}, options);
  },
  makeRequestProps:function(inProps){
    var delegates = {
      onRequestFault: this.onRequestFault
    }
    var props = this.inherited(arguments);
    // we need to force our params here
    props.methodName = this.methodName;
    props.methodParams = this.methodParams;
    return enyo.mixin(delegates, props);
    ;
  },
  responseFault: function(inRequest) {
		this.dispatchResponse(inRequest.onRequestFault, inRequest);
	},
	responseSuccess: function(inRequest) {
    if (inRequest.fault) {
  		this.dispatchResponse(inRequest.onRequestFault, inRequest);      
    }else{
      this.inherited(arguments);
    }
	}
});

/*

Response for creating and parsing XML-RPC request/response, used by XMLRPCService

*/

enyo.kind({
  name: 'XMLRPCService.Request',
  kind: 'WebService.Request',
  events: {
    onRequestFault:'requestFault'
  },
  published: {
    methodName:'',
    methodParams:[]
  },
  create: function(){
    this.inherited(arguments);
    this.fault = false;
    this.faultMessage = null;
    this.faultCode = null;
  },
  call: function(){
    // turn this.params into XML string
    this.params = XMLRPCBuilder.marshal(this.methodName, this.methodParams);
    this.headers['X-User-Agent'] = "wpwebos/" + enyo.fetchAppInfo().version;
    this.inherited(arguments);
  },
  setResponse: function(inXHR){
	  this.inherited(arguments);
	  if (inXHR.status == 200) {
		  var responseTest = inXHR.responseText;
		  var parser = new XMLRPCParser(responseTest);
		  this.response = parser.toObject();
		  this.fault = parser.fault;
	  } else if(inXHR.status == 0) {
	  	// believe the error code indicates that the response was empty, (as not even headers were returned). This means the connection was accepted and then closed gracefully (TCP FIN).
		this.fault = true;
		this.faultMessage = "No Response from the Server";
		this.faultCode = 0;
		//this.response = parser.toObject(); //we can create an error obj here
	  } else {
		this.fault = true;
		this.faultMessage = inXHR.statusText ? inXHR.statusText : "Something went wrong";
		this.faultCode = inXHR.status;
		//this.response = parser.toObject(); //an error obj here
	  }
  }
});


XMLRPCBuilder = function(methodName, methodParams){
  this.methodName = methodName;
  this.methodParams = methodParams;
    
}

XMLRPCBuilder.marshal = function(methodName, methodParams){
  return (new XMLRPCBuilder(methodName, methodParams)).toString();
}

XMLRPCBuilder.prototype.toString = function(){
  return "<?xml version=\"1.0\"?>\n" +
    "<methodCall>\n<methodName>" + this.methodName + "</methodName>\n" +
    "<params>\n" + this.buildParams(this.methodParams) + "</params>\n</methodCall>";
}

XMLRPCBuilder.prototype.buildParams = function(params){
  xml = "";
  for (var i=0; i < params.length; i++) {
    xml += "<param><value>" + this.encode(params[i]) +  "</value></param>\n";
  };
  return xml;
}

XMLRPCBuilder.prototype.encode = function(param){
  var x = XMLRPCBuilder;
  if (enyo.isArray(param)) {
    // collect each one and buildObject on it
    var array = "<array>\n<data>\n";
      for (var i=0; i < param.length; i++) {
        array += "<value>" + this.encode(param[i]) + "</value>\n";
      };
    array += "</data>\n</array>\n";
    return array;
  } else if (enyo.isFunction(param)) {
    return this.encode(param());
  } else if (x.isString(param)) {
    return "<string><![CDATA[" + param + "]]></string>";
  } else if (x.isNumber(param)) {
    if (x.isInt(param)) {
      return "<i4>" + param + "</i4>";
    }else{
      return "<double>" + param + "</double>";
    }
  } else if (x.isDate(param)) {
    return "<dateTime.iso8601>" + XMLRPCBuilder.dateToIso8601(param) + "</dateTime.iso8601>";
  // } else if (x.isObject(param)) {
  } else {
    var struct = "<struct>";
    for (key in param) {
      struct += "<member>";
      struct += "<name>";
      struct += key;
      struct += "</name>";
      struct += "<value>";
      struct += this.encode(param[key]);
      struct += "</value>";
      struct += "</member>";
    };
    return struct + "</struct>";
  }
  throw("Don't know how to encode " + param.constructor + ": " + enyo.json.stringify(param));
}

XMLRPCBuilder.dateToIso8601 = function(date){
  year = date.getUTCFullYear();
  month = date.getUTCMonth() + 1;
  if (month < 10) month = "0" + month;     
  day = date.getUTCDate();
  if (day < 10) day = "0" + day;     
  var minutes = date.getUTCMinutes();
  if (minutes < 10) minutes = "0" + minutes; 
  var seconds = date.getUTCSeconds();
  if (seconds < 10) seconds = "0" + seconds;  
  var hrs = date.getUTCHours()
  if (hrs < 10) hrs = "0" + hrs;
  time = hrs + ':' + minutes + ':' + seconds;
  return " " + year + month + day + "T" + time;
}

XMLRPCBuilder.isNumber = function(param){
  return (typeof(param) == 'number' || param instanceof Number);
}

XMLRPCBuilder.isDate = function(param) {
  if (param == null) return false;
  //console.log(">>> XMLRPCBuilder.isDate testing the paramter datatype: ", param,  typeof(param));  

  //console.log("hey: ", param.__proto__.constructor.name ); //this does the trick
  return (param instanceof Date || param.__proto__ instanceof Date || param.__proto__.constructor.name == 'Date');
}

XMLRPCBuilder.isString = function(param){
  return enyo.isString(param);
}

XMLRPCBuilder.isInt = function(param){
  return Math.round(param) == param;
}

XMLRPCBuilder.isObject = function(param){
  return (param instanceof Object || param.constructor == Object);
}

XMLRPCParser = function(string){
  
  //TODO: clean the document with tidy. I've not found any js implementation of HTML tidy. this is bad.
  //NOTE: the DOMParser object is an HTML Dom parser, not XML, so it does not require "valid" XML so we may not need HTML tidy.
    
  //remove the BOM bytes, white spaces
  var cleaned = XMLRPCParser.protectStrings(XMLRPCParser.cleanBOM(XMLRPCParser.cleanDocument(string)));
  this.document = doc = new DOMParser().parseFromString(cleaned, 'text/xml');
  //console.log("Parsed DOM", doc);
}

XMLRPCParser.parse = function(string){
  return (new XMLRPCParser(string)).toObject();
}

// prevents empty text nodes. and garbage between non-content XML-RPC nodes
XMLRPCParser.cleanDocument = function(string){
  var open, pairs = [
    ['methodResponse', 'params'],
    ['params', 'param'],
    ['param', 'value'],
    ['array', 'data'],
    ['struct', 'member']
  ], open;
  var values = ['array','string', 'i4', 'int', 'dateTime\\.iso8601', 'double', 'struct'];
  pairs.push(['value', values.join("|")]);
  var pair, reg;
  for (var i=0; i < pairs.length; i++) {
    pair = pairs[i];
    open = new RegExp("<" + pair[0] + ">.*?<(" + pair[1] + ")>",'gmi');
    string = string.replace(open,"<"+pair[0]+"><$1>");
  };
  
  return string.replace(/>\n[\s]+\n</g, '><');
}

// Removes all characters before the opening XLM declaration
XMLRPCParser.cleanBOM = function(string){
  var leading_removed = string.substring(string.indexOf("<"));
  return leading_removed.replace(/^[^<]{0,}<\?xml([^>]+)>[^<]+<methodResponse/, "<?xml version=\"1.0\" ?>\n<methodResponse");
}

// wrap the strings in <![CDATA[ ]]>
// We are treating all string values as potentially malformed XML. The parser will not attempt to process any of the
// potentially dangerous copy
XMLRPCParser.protectStrings = function(string){
  var cleaned = string.replace(/<string>([\s]+<\!\[CDATA\[)?/gi, "<string><![CDATA[").replace(/<\/string>/gi, "]]></string>");
  return  cleaned;
  
}

// TODO: Remove XPath and start using querySelector since we're dealing with a DOM object
XMLRPCParser.prototype.toObject = function(){
  // the the method response value
  var fault = this.queryDocument('/methodResponse/fault/value/*')[0];
  if(fault){
    this.fault = true;
    return this.parse(fault);
  }

  //checks for DOM fault
/*
 * <methodresponse>​
<parsererror style=​"display:​ block;​ white-space:​ pre;​ border:​ 2px solid #c77;​ padding:​ 0 1em 0 1em;​ margin:​ 1em;​ background-color:​ #fdd;​ color:​ black">​
<h3>​This page contains the following errors:​</h3>​
<div style=​"font-family:​monospace;​font-size:​12px">​
"error on line 218 at column 59: Input is not proper UTF-8, indicate encoding !
Bytes: 0x1B 0x5B 0x20 0xC2
"
</div>​
<h3>​Below is a rendering of the page up to the first error.​</h3>​
</parsererror>​
<params>​…​</params>​*/  
  fault = this.document.getElementsByTagName("parsererror")[0];
  if(fault){
    this.fault = true;
    return {"faultCode":32700,"faultString":"Parse Error, not well formed"};
  }
  
  var value = this.queryDocument('/methodResponse/params/param/value/*')[0];
  return this.parse(value);
}

// TODO: Remove XPath and start using querySelector since we're dealing with a DOM object
XMLRPCParser.prototype.queryDocument = function(xpath, node){
  var results = [];
  var query = this.document.evaluate(xpath, node || this.document, null,
                XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
  for (var i = 0, length = query.snapshotLength; i < length; i++)
    results.push(query.snapshotItem(i));
  return results;
}

// TODO: Remove XPath and start using querySelector since we're dealing with a DOM object
XMLRPCParser.prototype.parse = function(node){

  switch(node.nodeName){
    
    case 'array':
      var children = this.queryDocument('./data/value/*', node);
      var array = [];
      for (var i=0; i < children.length; i++) {
        children[i]
        array.push(this.parse(children[i]));
      };
      return array;
      break;
    
    case 'struct':
      var struct = {};
      var children = this.queryDocument('./member', node);
      for (var i=0; i < children.length; i++) {
        var name = this.queryDocument('./name', children[i])[0];
        var value = this.queryDocument('./value/*', children[i])[0];
        struct[name.firstChild.nodeValue] = this.parse(value);
      };
      return struct;
      break;
      
    case 'string':
      var s = node.firstChild ? node.firstChild.nodeValue : '';
      s = s.replace(/&amp;([a-z]+|\#[\d]+);/ig, '&$1;').replace(/&gt;/gi,'>').replace(/&lt;/gi,'<').replace(/&quot;/gi,'"');
      return s.split('&#039;').join("'");
      break;
      
    case 'boolean':
      return node.firstChild ? node.firstChild.nodeValue == "1" : false ;
      break;
      
    case 'i4':
    case 'int':
    case 'double':
      return node.firstChild ? parseInt(node.firstChild.nodeValue) : null;
      break;
      
    case 'dateTime.iso8601':
      return node.firstChild ? Date.fromIso8601(node.firstChild.nodeValue) : null;
      break;
      
    default:
      throw("Don't know how to parse node: " + node.nodeName);
      break;
    
    
  }
  
}


/** 
 * Date
 */
 
 /**
* <p>Convert a GMT date to ISO8601.</p>
* @return
*		<code>String</code> with an ISO8601 date.
*/
// Date.prototype.toIso8601 = function() {
//   console.log("Encoding date", this, this.getUTCFullYear);
//   year = this.getUTCFullYear();
//   month = this.getUTCMonth() + 1;
//   if (month < 10) month = "0" + month;     
//   day = this.getUTCDate();
//   if (day < 10) day = "0" + day;     
//   time = this.getUTCHours() + ':' + this.getUTCMinutes() + ':' + this.getUTCSeconds();
//   return year + month + day + "T" + time;
// };

/**
* <p>Convert ISO8601 date to GMT.</p>
* @param value
*		ISO8601 date.
* @return
*		GMT date.
*/
Date.fromIso8601 = function(value) {
  year = value.substr(0,4); 
  month = value.substr(4,2);
  day = value.substr(6,2); 
  hour = value.substr(9,2); 
  minute = value.substr(12,2); 
  sec = value.substr(15,2);
	var d = new Date(Date.UTC(year, month - 1, day, hour, minute, sec, 0));
  return d;
};

/** 
 * Base64
 */
function Base64(value) {	
  Base64.prototype.bytes = value;
};

/** <p>Base64 characters map.</p> */
Base64.CHAR_MAP = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

/**
* <p>Encode the object bytes using base64 algorithm.</p>
* @return
*		Encoded string.
*/
Base64.prototype.encode = function() {
  if(typeof btoa == "function")
    this.bytes = btoa(this.bytes);
  else {
    var _byte = new Array(), _char = new Array(), _result = new Array();
    var j = 0;
	for (var i = 0; i < this.bytes.length; i += 3) {
      _byte[0] = this.bytes.charCodeAt(i);
	  _byte[1] = this.bytes.charCodeAt(i + 1);
	  _byte[2] = this.bytes.charCodeAt(i + 2);
	  _char[0] = _byte[0] >> 2;
	  _char[1] = ((_byte[0] & 3) << 4) | (_byte[1] >> 4);
	  _char[2] = ((_byte[1] & 15) << 2) | (_byte[2] >> 6);
      _char[3] = _byte[2] & 63;		
	  if(isNaN(_byte[1]))
	    _char[2] = _char[3] = 64;
	  else 
	  if(isNaN(_byte[2]))
	    _char[3] = 64;
	  _result[j++] = Base64.CHAR_MAP.charAt(_char[0]) + Base64.CHAR_MAP.charAt(_char[1]) 
				   + Base64.CHAR_MAP.charAt(_char[2]) + Base64.CHAR_MAP.charAt(_char[3]);
	}	 
    this.bytes = _result.join("");
  }
  return this.bytes;
};

/**
* <p>Decode the object bytes using base64 algorithm.</p>
* @return
*		Decoded string.
*/
Base64.prototype.decode = function() {
  if(typeof atob == "function")	
    this.bytes = atob(this.bytes);
  else {
	var _byte = new Array(), _char = new Array(), _result = new Array();
	var j = 0;
	while ((this.bytes.length % 4) != 0)
	  this.bytes += "=";
    for (var i = 0; i < this.bytes.length; i += 4) {
	  _char[0] = Base64.CHAR_MAP.indexOf(this.bytes.charAt(i));
	  _char[1] = Base64.CHAR_MAP.indexOf(this.bytes.charAt(i + 1));
	  _char[2] = Base64.CHAR_MAP.indexOf(this.bytes.charAt(i + 2));
	  _char[3] = Base64.CHAR_MAP.indexOf(this.bytes.charAt(i + 3));
	  _byte[0] = (_char[0] << 2) | (_char[1] >> 4);
	  _byte[1] = ((_char[1] & 15) << 4) | (_char[2] >> 2);
	  _byte[2] = ((_char[2] & 3) << 6) | _char[3];
	  _result[j++] = String.fromCharCode(_byte[0]);
	  if(_char[2] != 64) 
	    _result[j++] = String.fromCharCode(_byte[1]);
	  if(_char[3] != 64) 
	    _result[j++] = String.fromCharCode(_byte[2]);	
	}
	this.bytes = _result.join("");
  }
  return this.bytes;
};