/*
 WordPress application root
*/
enyo.kind({
  name: 'enyo.WordPress',
  kind: 'enyo.Control',
  layoutKind: 'VFlexLayout',
  components:[
    { name:'palm_service', kind:'PalmService', service:'palm://com.palm.applicationManager/', method:'launch', onSuccess:'onPhotos', onFailure:'onPhotosFailure' },
    { name:'wp_client', methodName:'wp.getUsersBlogs', kind:'WordPressService', url:'http://beau.local/wp3.0/xmlrpc.php', onSuccess:"gotBlogs", onFailure:"gotBlogsError", components:[
      { name:'posts', methodName:'metaWeblog.getRecentPosts', url:'http://beau.local/wp3.0/xmlrpc.php', onSuccess:'gotPosts' }
    ]},
    // 2 panes as a sliding group
    {
      name: 'panes',
      kind: 'SlidingGroup',
      flex: 1, // full vertical layout
      components: [
        // first pane is the list view pane
        {
          name: 'list',
          width: '320px',
          components:[
            // account list
            {
              name: 'list_pane',
              kind: 'Pane',
              flex: 1,
              components: [
                {
                  name:'accounts',
                  kind:'AccountList',
                  onNewAccount:'accountSetup'
                },
                {
                  name:'account_tabs',
                  kind:'AccountTabs'
                }
              ]
            }
          ]
        },
        {
          name: 'detail',
          peekWidth: 68,
          flex: 1,
          onResize:"slidingResize",
          dragAnywhere:false,
          edgeDragging:true,
          components:[
            {
              kind: 'Pane',
              name:'detail_pane',
              flex: 1,
              // onCreateView:'createDetailView'
              components: [
                { kind:'AccountSetup', lazy:true, name:'account_setup' }
              ]
            }
          ]
        }
      ]
    }
  ],
  ready:function(){
    this.log("Ready");
  },
  resizeHandler: function(){
    this.$.panes.resize();
  },
  gotBlogs:function(client, response, request){
    if (request.fault) {
      throw(response.faultString);
    }else{
      this.log("response:", response);
      enyo.forEach(response, enyo.bind(this, function(blog){
        this.log('blog', blog);
        this.$.posts.callMethod({methodParams: [blog.blogid, 'admin', 'ref0rrest']});
      }));
    }
  },
  gotBlogsError:function(){
    this.log("error", arguments);
  },
  accountSetup:function(){
    
    this.$.detail_pane.selectViewByName('account_setup');
    this.$.panes.setSelected(this.$.detail);
  },
  backHandler: function(inSender, e){
    if (this.$.account_setup) {
      this.$.account_setup.backHandler(e);
    };
    this.$.panes.back(e);
  }
});