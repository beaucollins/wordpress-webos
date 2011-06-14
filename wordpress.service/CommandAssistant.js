var CommandAssistant = function() {
}

CommandAssistant.prototype.run = function(future) {
      
    //   {
    //  fullPath: // Absolute File Path.
    //  iconPath: // Absolute File Path with ExtractFS prefix.
    //  attachmentType: // File Type (image, document, audio, video)
    //  size: // File Size in Bytes.
    // }
    
    // {
    //   endpoint:this.$.endpoint.getValue(),
    //   username:this.$.username.getValue(),
    //   password:this.$.password.getValue(),
    //   blogId:this.$.blogId.getValue(),
    //   file: '/media/internal/pictures/CIMG0164.JPG'
    // }
    var args = this.controller.args;
    var file  = args.file;
    var blogId = args.blogId;
    var username = args.username;
    var password = args.password;
    var endpoint = args.endpoint;
    
    var destination = url.parse(endpoint);
    
    if(file){
      var read = fs.createReadStream(file, { flags: 'r', encoding: null, mode: 0666, bufferSize:128 });
      
      fs.readFile(file,'base64', function(err, data){

        if (err) throw(err);

        var client = http.createClient((destination.port || 80), destination.hostname);
        var path_parts = file.split('/');
        var name = path_parts[path_parts.length - 1];
        var front = "<?xml version=\"1.0\" ?>\n<methodCall><methodName>wp.uploadFile</methodName>";
        front += '<params>';
        front += '<param><int>' + blogId + '</int></param>';
        front += '<param><string>' + username + '</string></param>';
        front += '<param><string>' + password + '</string></param>';
        front += '<param><struct>';
        front += '<member><name>name</name><value><string>' + name + '</string></value></member>';
        front += '<member><name>bits</name><value><base64>'

        var back = '</base64></value></member></struct></param></params></methodCall>';

        var request = client.request('POST', destination.pathname, {
          'Host' : destination.hostname,
          'Content-Length' : front.length + back.length + data.length
        });

        request.on('response', function(response){
          var response_data = "";
          if (response.statusCode == 200 || response.statusCode == '200') {
            response.on('data', function(data){
              response_data += data.toString('UTF-8')
            });
            response.on('end', function(){
              future.result = { returnValue:true, status: response.statusCode, xml:response_data, deviceFilePath:file };
            })
          };
        });
        
        // fire of the XML body to the server
        request.end(front + data + back);

      });
      
    }
    
}