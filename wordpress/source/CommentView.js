enyo.kind({
  name: 'wp.CommentView',
  kind: 'VFlexBox',
  published: {
    account:null,
    comment:null,
    replies:[]
  },
  components:[
    { kind:'PalmService', service:'palm://com.palm.applicationManager/', method:'open' },
    { name:'xmlrpc_client', kind: 'XMLRPCService', onSuccess:'appendConversation', components:[
      { name:'comment_edit', methodName:'wp.editComment', onSuccess:'updatedComment' }
    ]},
    { kind:'enyo.Popup', showHideMode:'transition', className:'transitioner fastAnimate', onOpen:'focusReply', openClassName:'scaleFadeIn', scrim:true, components:[
      { name:'reply', kind: 'enyo.RichText', width:'300px', height:'300px' },
      { kind: 'HFlexBox', components:[
        { kind:'enyo.Button', flex:1, caption:'Cancel', onclick:'cancelReply' },
        { kind:'enyo.Button', flex:1, caption:'Submit', onclick:'publishReply' }
      ] }
    ]},
    { name:'comment', flex:1, kind:'VFlexBox', components:[
      { kind: 'Scroller', flex:1, components:[
        { name:'header', components:[
          { kind:'Control', kind:'HFlexBox', className:'enyo-item first', components:[
            { name:'avatar', kind:'Image', className:'avatar-large', src:'./images/icons/avatar-large.png' },
            { kind:'VFlexBox', flex:1, components:[
              { name:'authorName' },
              { kind:'HFlexBox', components:[
                { name:'authorEmail', caption:'Email', kind:'Button', onclick:'openEmailToAuthor' },
                { name:'authorURL', caption:'Web Page', kind:'Button', onclick:'openBrowserToAuthor' },
                { flex:1 }
              ]}
            ]}
          ] }
        ]},
        { name:'body', className:'enyo-item' },
        { kind:'HFlexBox', className:'enyo-item', components:[
          { content:'On:', className:'row-label' },
          { name:'subject', flex:1}
        ]},
        // { name:'conversationHeader', className:'enyo-item', content:'Conversation:' },
        // { name:'conversation', kind:'VirtualRepeater', onGetItem:'getReply', components:[
        //   { name:'item', className: 'enyo-item', components:[
        //     { name:'reployHeader', kind:'HFlexBox', components: [
        //       { kind:'Control', className:'comment-left-col', components:[{ name:'replyAvatar', width:'30px', height:'30px', kind:'Image', onerror:'imageLoadError', className:'comment-list-avatar', src:'images/icons/default-avatar.png' }] },
        //       { name:'replyAuthor', flex:1, className:'comment-author' },
        //       { name:'replyTimestamp', className:'comment-timestamp' }
        //     ] },
        //     { name:'replyContent', className: 'comment-content' }
        //   ]}
        // ]}
      ] },
      { kind: 'enyo.Toolbar', components:[
        { name: "slidingDrag", slidingHandler: true, kind:'GrabButton'},
        { flex:1 },
        { name:'approve', caption: 'Approve', onclick:'markComment' },
        { name:'trash', caption: 'Trash', onclick:'markComment' },
        { name:'spam', caption: 'Spam', onclick:'markComment' },
        { flex:1 },
        { caption: 'Reply', onclick:'showReplyWindow' },
        { caption: 'View', onclick:'launchBrowser'}
      ] } 
    ] }
  ],
  created:function(){
    this.inherited(arguments);
    this.commentChanged();
  },
  accountChanged:function(){
    if(this.account){
      this.$.xmlrpc_client.setUrl(this.account.xmlrpc);
      this.$.comment_edit.setUrl(this.account.xmlrpc)
    }
  },
  commentChanged:function(){
    this.replies = [];
    // this.$.conversationHeader.hide();
    // this.$.conversation.render();
    if (this.comment == null) {
      return;
    };
        
    this.$.authorName.setContent(this.comment.author);
    if (this.hasEmail()) {
      this.$.authorEmail.show();
    }else{
      this.$.authorEmail.hide();
    }
    if (this.hasURL()) {
      this.$.authorURL.show();
    }else{
      this.$.authorURL.hide();
    }
    
    if (this.comment.status == 'approve') {
      this.$.approve.hide();
    }else{
      this.$.approve.show();
    }
    
    if (this.comment.status == 'trash') {
      this.$.trash.hide();
    }else{
      this.$.trash.show();
    }
    
    if (this.comment.status == 'spam') {
      this.$.spam.hide();
    }else{
      this.$.spam.show();
    }

    // this.$.authorURL.setContent(this.comment.author_url);
    this.$.subject.setContent(this.comment.post_title);
    this.$.scroller.setScrollPositionDirect(0,0);
    
    var avatar = new Image();
    avatar.onload = enyo.bind(this, function(){
      this.$.avatar.setSrc(avatar.src);
    });
    avatar.src = enyo.application.makeGravatar(this.comment.author_email, {
      size:50
    });
    

    this.$.body.setContent(this.comment.content);
    // if(this.hasConversation()){
    //   this.$.conversationHeader.show();
    //   this.$.xmlrpc_client.callMethod({ methodName:'wp.getComment', methodParams:[this.account.blogid, this.account.username, this.account.password, this.comment.parent] })
    // }
    
  },
  // appendConversation:function(sender, response, request){
  //   this.replies.push(response);
  //   // render the repeater
  //   this.$.conversation.render();
  //   if (response.parent != "0") {
  //     this.$.xmlrpc_client.callMethod({ methodName:'wp.getComment', methodParams:[this.account.blogid, this.account.username, this.account.password, response.parent] })
  //   };
  // },
  getReply:function(sender, index){
    var comment = this.replies[index];
    if(comment){
      this.$.replyAvatar.setSrc(enyo.application.makeGravatar(comment.author_email, {size:30}));
      this.$.replyAuthor.setContent(comment.author);
      this.$.replyTimestamp.setContent(TimeAgo(comment.date_created_gmt));
      this.$.replyContent.setContent(comment.content);
      return true;
    }
  },
  showReplyWindow:function(){
    this.$.popup.openAtCenter();
  },
  hasConversation:function(){
    return this.comment.parent != "0";
  },
  hasEmail:function(){
    return this.comment.author_email && this.comment.author_email != '';
  },
  hasURL:function(){
    return this.comment.author_url && this.comment.author_url != '';
  },
  // open up a browser window with the comment's URL
  launchBrowser:function(){
    this.$.palmService.call({target:this.comment.link}); 
  },
  focusReply:function(){
    this.$.reply.forceFocus();
  },
  publishReply:function(){
    var reply = this.$.reply.getValue();
    this.$.popup.close();
    		
    this.$.xmlrpc_client.callMethod({ methodName:'wp.newComment', methodParams:[this.account.blogid, this.account.username, this.account.password, this.comment.post_id, {
      post_id: this.comment.post_id,
      content: reply,
      comment_parent: this.comment.comment_id, //
      status: 'approve'
    }]});
    
  },
  cancelReply:function(){
    this.$.popup.close();
  },
  openEmailToAuthor:function(){
    var query = {
      'subject' : this.comment.post_title, 
      'body' : "Comment Link: " + this.comment.link
    }
    var target = "mailto:"+this.comment.author_email + "?" + enyo.objectToQuery(query);
    this.$.palmService.call({target:target}); 
  },
  openBrowserToAuthor:function(){
    this.$.palmService.call({target:this.comment.author_url}); 
  },
  markComment:function(sender){
    var params = [this.account.blogid, this.account.username, this.account.password, this.comment.comment_id];
    if (sender.name == 'trash') {
      this.account.deleteComment(this.comment);
      this.$.comment_edit.callMethod({ methodParams:params, methodName:'wp.deleteComment' });
    }else{
      this.comment.status = sender.name;
      this.account.updateComment(this.comment);
      // this.$.comment_edit.callMethod({ methodParams:params })
      
    }
  },
  updatedComment:function(sender, response, request){
    enyo.windows.addBannerMessage("Comment updated", "{}");
  }
  
})