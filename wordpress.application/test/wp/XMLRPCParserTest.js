enyo.kind({
  name:'wp.XMLRPCParserTest',
  kind:'enyo.TestSuite',
  create:function(){
    this.inherited(arguments);
    this.assertFailures = [];
  },
  testParseFault:function(){
    var response = XMLRPCParser.parse(faultResponse)
    var good = {
      faultCode:403,
      faultString:"Bad login/pass combination."
    }
    this.assertEqual(response.faultCode, good.faultCode);
    this.assertEqual(response.faultString, good.faultString);
  },
  
  
  testCleansBadBits:function(){
    var a = "<abcdefg>";
    var bad = "lksjfdoisjopaivj\0   opsadvopsadjifsadf\nas;lkjf;lsadjf;lksadjfasl;djflskadf\n<abcdefg>";
    var b = XMLRPCParser.cleanBOM(bad);
    this.assertEqual(a,b, "Characters were not cleaned");
  },
  

  testMalFormedResponse:function(){
    
    var response = XMLRPCParser.parse(malFormed);
    var description = "This is just <br> a test.";
    this.assertEqual(response[0].description, description);
    
  },
  
  
  testMalFormedResponse2:function(){
	    
    var response = XMLRPCParser.parse(malFormed2);
    var description = "This is just <br> a test.";
    this.assertEqual(response[0].description, description);
	    
	},

  testHorriblyMalFormedResponse:function(){

    var response = XMLRPCParser.parse(horriblyMalformed);
    var description = "This is just <br> a test.";
    this.assertEqual(response[0].description, description);

	},
  
  // adding some assertion methods
  assertEqual:function(a, b, msg){
    if (a != b) {
      if(!msg) msg = "Failed: " + JSON.stringify(a) + " != " + JSON.stringify(b);
      this.log(msg);
      this.assertFailures.push(msg)
    };
  },
  runTest: function(testName) {
		this.resetTimeout();
		this.doBegin();
		try {
			// actual test code invoked here
			this.beforeEach();
			this[testName]();
			this.finish((this.assertFailures.length > 0 ? 'FAILURES: ' + this.assertFailures.length : false));
		} catch(x) {
			this.finish(x);
		}
	}
	
})

var faultResponse = "<?xml version=\"1.0\"?>\
<methodResponse>\
  <fault>\
    <value>\
      <struct>\
        <member>\
          <name>faultCode</name>\
          <value><int>403</int></value>\
        </member>\
        <member>\
          <name>faultString</name>\
          <value><string>Bad login/pass combination.</string></value>\
        </member>\
      </struct>\
    </value>\
  </fault>\
</methodResponse>\
";

var malFormed = "\
<?xml version=\"1.0\"?>\
<methodResponse>\
  <params>\
    <param>\
      <value>\
      <array><data>\
  <value><struct>\
  <member><name>dateCreated</name><value><dateTime.iso8601>20110415T16:11:04</dateTime.iso8601></value></member>\
  <member><name>userid</name><value><string>2832</string></value></member>\
  <member><name>postid</name><value><string>7</string></value></member>\
  <member><name>description</name><value><string>This is just <br> a test.</string></value></member>\
  </struct></value>\
</data></array>\
      </value>\
    </param>\
  </params>\
</methodResponse>";

var malFormed2 = "\
	<?xml version=\"1.0\"?>\
	i'm-not-here<methodResponse>\
	  <params>\
	    <param>\
	      <value>\
	      <array><data>\
	  <value><struct>\
	  <member><name>dateCreated</name><value><dateTime.iso8601>20110415T16:11:04</dateTime.iso8601></value></member>\
	  <member><name>userid</name><value><string>2832</string></value></member>\
	  <member><name>postid</name><value><string>7</string></value></member>\
	  <member><name>description</name><value><string>This is just <br> a test.</string></value></member>\
	  </struct></value>\
	</data></array>\
	      </value>\
	    </param>\
	  </params>\
	</methodResponse>";
	
var horriblyMalformed = "\
  	<?xml version=\"1.0\"?>\
  	i'm-not-here<methodResponse>\
  	  <params>nor here\
  	    <param>or here\
  	      <value>or here\
  	      <array>or here<data>\
  	  <value>asdfdsafasdfdas><<struct>\
  	  <member><name>dateCreated</name><value>hi<dateTime.iso8601>20110415T16:11:04</dateTime.iso8601></value></member>\
  	  <member><name>userid</name><value><string>2832</string></value></member>\
  	  <member><name>postid</name><value><string>7</string></value></member>\
  	  <member><name>description</name><value><string>This is just <br> a test.</string></value></member>\
  	  </struct></value>\
  	</data></array>\
  	      abcdefasdfsd</value>\
  	    </param>\
  	  </params>\
  	</methodResponse>";
