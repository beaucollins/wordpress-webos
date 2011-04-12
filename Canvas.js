enyo.kind({
  name:'Canvas',
  kind:'enyo.Control',
  nodeTag:'canvas',
  style:'border: 1px dotted #000; box-sizing:border-box;',
  rendered:function(){
    
    var node = this.hasNode();
    if (node) {
      this.log(node.nodeName)
      var context = node.getContext('2d');
      context.fillStyle = "#FF0000";
      context.fillRect(10, 10, 100, 100);      
      
      setTimeout(function(){
        context.clearRect(10,10,100,100);
      }, 1000);
    } else {
      this.log("really? no canvas still");
    }
    
  }
})