/*
 WordPress application root
*/
enyo.kind({
  name: 'wp.WordPress',
  kind: 'enyo.Control',
  layoutKind: 'VFlexLayout',
  components: [
    {
      name: 'panes',
      kind: 'enyo.SlidingPane',
      flex: 1,
      multiViewMinWidth:500,
      components: [
        { name:'left', width:'250px', components:[
          { kind:'wp.SourceList', flex:1, onSelectAccountAction:'performAccountAction' }
        ] },
        { name:'middle', width:'250px', peekWidth:42 },
        { name:'detail', peekWidth:84, flex:1, onResize: "slidingResize" }
      ]
    }
  ],
  resizeHandler: function(){
    this.$.panes.resize();
  },
  performAccountAction: function(){
  }
});


enyo.mixin(enyo.application, {
  /*

  	404: do not load any image if none is associated with the email hash, instead return an HTTP 404 (File Not Found) response
  	mm: (mystery-man) a simple, cartoon-style silhouetted outline of a person (does not vary by email hash)
  	identicon: a geometric pattern based on an email hash
  	monsterid: a generated 'monster' with different colors, faces, etc
  	wavatar: generated faces with differing features and backgrounds
  	retro: awesome generated, 8-bit arcade-style pixelated faces

  */
  makeBlavatar:function(url, settings){
    var options = {
      size: '50',
      missing: '404'
    }
    enyo.mixin(options, settings);
    var domain = url.match(/^((https?)?:\/\/)?([^ \/]+)/).slice(-1)[0].trim();
    if (domain) {
      return "http://gravatar.com/blavatar/" + hex_md5(domain) + '?d=' + options.missing + '&s=' + options.size 
    }else{
      return false;
    }   
  },
  makeGravatar:function(email, options){
    enyo.mixin({
      size: '50',
      missing: '404'
    }, options || {} );

    Mojo.Log.info("makeGravatar: %o %j", email, options)
    if (typeof email == 'string') {
      return "http://gravatar.com/avatar/" + hex_md5(email.trim().toLowerCase()) + '?d=' + options.missing + '&s=' + options.size;
    }else{
      return false;
    }

  }
})
