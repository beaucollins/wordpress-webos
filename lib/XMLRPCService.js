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
  handleAs:'text',
  contentType:'text/xml',
  published: {
    methodName: "",
    methodParams:[],
    url:''
  },
  callMethod:function(options){
    if(options.methodName) this.methodName = options.methodName;
    if(options.methodParams) this.methodParams = options.methodParams;
    return this.call();
  },
  makeRequestProps:function(){
    var props = this.inherited(arguments);
    props.methodName = this.methodName;
    props.methodParams = this.methodParams;
    return props;
  }
});

/*

Response for creating and parsing XML-RPC request/response, used by XMLRPCService

*/

enyo.kind({
  name: 'XMLRPCService.Request',
  kind: 'WebService.Request',
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
    this.inherited(arguments);
  },
  setResponse: function(inXHR){
    this.inherited(arguments);
    if (inXHR.status == 200) {
      // comment parsing
      var parser = new XMLRPCParser(inXHR.responseText);
      this.response = parser.toObject();
      this.fault = parser.fault;
    };
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

XMLRPCBuilder.prototype.build = function(){
  
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
    return "<string>" + param + "</string>";
  } else if (x.isNumber(param)) {
    if (x.isInt(param)) {
      return "<i4>" + param + "</i4>";
    }else{
      return "<double>" + param + "</double>";
    }
  } else if (x.isDate(param)) {
    return "<dateTime.iso8601>" + param.toIso8601() + "</dateTime.iso8601>";
  } else if (x.isObject(param)) {
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
  throw("Don't know how to encode " + param);
}

XMLRPCBuilder.isNumber = function(param){
  return (typeof(param) == 'number' || param instanceof Number);
}

XMLRPCBuilder.isDate = function(param) {
  return param instanceof Date;
}

XMLRPCBuilder.isString = function(param){
  return enyo.isString(param);
}

XMLRPCBuilder.isInt = function(param){
  return Math.round(param) == param;
}

XMLRPCBuilder.isObject = function(param){
  return param instanceof Object;
}

XMLRPCParser = function(string){
  // create the dom node from the string, there must be a better way to clean up
  // this whitespace. Without xPath, whitespace nodes are a pain in the ass
  this.document = doc = new DOMParser().parseFromString(string.replace(/>[\s]+</g, '><'), 'text/xml');
}

XMLRPCParser.parse = function(string){
  return (new XMLRPCParser(string)).toObject();
}

XMLRPCParser.prototype.toObject = function(){
  // the the method response value
  var fault = this.queryDocument('/methodResponse/fault/value/*')[0];
  if(fault){
    this.fault = true;
    return this.parse(fault);
  }
  var value = this.queryDocument('/methodResponse/params/param/value/*')[0];
  return this.parse(value);
}

XMLRPCParser.prototype.queryDocument = function(xpath, node){
  var results = [];
  var query = this.document.evaluate(xpath, node || this.document, null,
                XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
  for (var i = 0, length = query.snapshotLength; i < length; i++)
    results.push(query.snapshotItem(i));
  return results;
}

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
      return node.firstChild ? node.firstChild.nodeValue : '';
      break;
      
    case 'boolean':
      return node.firstChild ? node.firstChild.nodeValue == "1" : false ;
      break;
      
    case 'i4':
    case 'int':
    case 'double':
      return node.firstChild ? new Number(node.firstChild.nodeValue) : null;
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
Date.prototype.toIso8601 = function() {
  year = this.getUTCFullYear();
  month = this.getUTCMonth() + 1;
  if (month < 10) month = "0" + month;     
  day = this.getUTCDate();
  if (day < 10) day = "0" + day;     
  time = this.getUTCHours() + ':' + this.getUTCMinutes() + ':' + this.getUTCSeconds();
  return year + month + day + "T" + time;
};

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