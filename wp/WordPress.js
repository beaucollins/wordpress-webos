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
        { name:'left', width:'225px', components:[
          { kind:'wp.SourceList', flex:1, onSelectAccountAction:'performAccountAction' }
        ] },
        { name:'middle', width:'350px', peekWidth:42, components:[
          { kind:'wp.CommentList', onSelectComment:"selectComment" }
        ] },
        { name:'detail', peekWidth:92, flex:2, onResize: "slidingResize", components:[
          { kind:'Control', flex:1 },
          { kind: 'enyo.nouveau.CommandMenu', components:[
            {name: "slidingDrag", slidingHandler: true, kind: "Control", className: "enyo-command-menu-draghandle"}
          ] }
        ] }
      ]
    }
  ],
  ready:function(){
  },
  resizeHandler: function(){
    this.$.panes.resize();
  },
  performAccountAction: function(sender, action, account){
    if (!this.$.panes.multiView) {
      this.$.panes.selectView(this.$.middle);
    };
  },
  selectComment:function(sender, comment){
    if(!this.$.panes.multiView){
      this.$.panes.selectView(this.$.detail);
    }
  },
  backHandler: function(sender, e){
    this.$.panes.back(e);
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
  makeGravatar:function(email, settings){
    var options = {
      size: '50',
      missing: '404'
    }
    enyo.mixin(options, settings);

    if (typeof email == 'string') {
      return "http://gravatar.com/avatar/" + hex_md5(email.trim().toLowerCase()) + '?d=' + options.missing + '&s=' + options.size;
    }else{
      return false;
    }

  }
})
