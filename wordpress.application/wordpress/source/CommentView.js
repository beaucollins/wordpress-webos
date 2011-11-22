enyo.kind({
  name: 'wp.CommentView',
  kind: 'VFlexBox',
  published: {
    account:null,
    comment:null,
    replies:[]
  },
  events: {
    onReply:''
  },
  components:[
    { kind:'PalmService', service:'palm://com.palm.applicationManager/', method:'open' },
    { name:'comment', flex:1, kind:'VFlexBox', components:[
      { name:'header', kind:'Header', components:[
        { kind:'Control', kind:'HFlexBox', components:[
          { name:'avatar', kind:'Gravatar', className:'avatar-large', defaultImage:'../images/icons/avatar-backup.png', size:'70' },
          { kind:'VFlexBox', flex:1, components:[
            { name:'authorName', className:'wp-post-title', allowHtml: 'true' },
            { kind:'HFlexBox', className:'wp-post-details', components:[
            	{ kind:'VFlexBox', flex:1, components:[
            		{ name:'authorURL', className:'wp-post-author', onclick:'openBrowserToAuthor', allowHtml: 'true' },
            		{ name:'authorEmail', className:'wp-post-email', onclick:'openEmailToAuthor', allowHtml: 'true' },
            		{ name:'commentTimestamp', className:'comment-timestamp', allowHtml: 'true' }
            	]}
            ]}/*,
            { kind:'HFlexBox', components:[
              { kind:'Button', caption: 'Reply', onclick:'doReply', className:'enyo-button-blue' },
              { kind:'Button', caption: 'View', onclick:'launchBrowser'}, <<< rudimentary? - IK 
              { name:'authorEmail', caption:'Email', kind:'Button', onclick:'openEmailToAuthor' },
              { name:'authorURL', caption:'Site', kind:'Button', onclick:'openBrowserToAuthor' },
              { flex:1 }
            ]}*/
          ]}
        ] }
      ]},
      { kind:'HFlexBox', className:'wp-item-meta', components:[
        { content:$L('On:'), className:'wp-item-meta-label' },
        { name:'subject', flex:1, onclick:'launchBrowser', className:'wp-item-meta-content wp-comment-subject', allowHtml: 'true' },
        { className:'wp-disclosure-arrow' }
      ]},
      { kind: 'Scroller', flex:1, components:[
        { name:'body', className:'wp-post-content', allowHtml: 'true' },
        // { name:'conversationHeader', className:'enyo-item', content:'Conversation:' },
        // { name:'conversation', kind:'VirtualRepeater', onSetupRow:'getReply', components:[
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
      { kind: 'enyo.Toolbar', className:'enyo-toolbar-light', components:[
        { name: "slidingDrag", slidingHandler: true, kind:'GrabButton'},
        { flex:1 },
        { kind: "Spinner", className: 'wp-list-spinner'},
        { kind:'Button', name:'reply', caption:  $L('Reply'), onclick:'doReply', className:'enyo-button-blue' },
        { kind:'Button', className:'approve-button', name:'approve', caption: $L('Approve'), onclick:'markComment' },
        { kind:'Button', className:'unapprove-button', name:'unapprove', caption: $L('Unapprove'), onclick:'markComment' },
        { kind:'Button', className:'trash-button', name:'trash', caption: $L('Trash'), onclick:'askBeforeDelete' },
        { kind:'Button', className:'spam-button', name:'spam', caption: $L('Spam'), onclick:'markComment' }
      ] } 
    ] },
	{name: "twoDialog", kind: "Dialog", components: [
 		{className: "enyo-item enyo-first", style: "padding: 12px", content: $L('Are You Sure?')},
 		{className: "enyo-item enyo-last", style: "padding: 12px; font-size: 14px", content: $L('Deleting an Item cannot be undone')},
 		{kind: "Button", caption: $L('Cancel'), onclick:'cancelButtonClick'},
 		{kind: "Button", caption: $L('Delete'), className:'enyo-red-button', onclick:'deleteComment'}
 	]},
  ],
  created:function(){
    this.inherited(arguments);
    this.commentChanged();
  },
  accountChanged:function(){
  /*  if(this.account){

    }*/
  },
  commentChanged:function(){
	  this.setToolbarButtonsDisabled(false);
	
    this.replies = [];
    // this.$.conversationHeader.hide();
    // this.$.conversation.render();
    if (this.comment == null) {
      return;
    };
        
    if (this.comment.author.trim() == '') {
      this.$.authorName.setContent($L("Anonymous"));
    }else{
      this.$.authorName.setContent(this.comment.author);
    }
    
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
    
    if (this.comment.status == 'hold') {
      this.$.unapprove.hide();
    }else{
      this.$.unapprove.show();
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
	
	this.$.authorEmail.setContent(this.comment.author_email);
    this.$.authorURL.setContent(this.comment.author_url);
    this.$.commentTimestamp.setContent(FormatDateTimeForDetailView(this.comment.date_created_gmt));
    this.$.subject.setContent(this.comment.post_title);
    this.$.scroller.setScrollPositionDirect(0,0);
    
    // var avatar = new Image();
    // avatar.onload = enyo.bind(this, function(){
    //   this.$.avatar.setSrc(avatar.src);
    // });
    // avatar.src = enyo.application.makeGravatar(this.comment.author_email, {
    //   size:62
    // });
    this.$.avatar.setEmail(this.comment.author_email);
    

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
      this.$.replyTimestamp.setContent(FormatDateTimeForDetailView(comment.date_created_gmt));
      this.$.replyContent.setContent(comment.content);
      return true;
    }
  },
  showReplyWindow:function(){
    // this.$.popup.openAtCenter();
    this.$.replyForm.open();
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
  openEmailToAuthor:function(){
    var query = {
      'subject' : this.comment.post_title, 
      'body' : $L("Comment Link: ") + this.comment.link
    }
    var target = "mailto:"+this.comment.author_email + "?" + enyo.objectToQuery(query);
    this.$.palmService.call({target:target}); 
  },
  openBrowserToAuthor:function(){
    this.$.palmService.call({target:this.comment.author_url}); 
  },
  markComment:function(sender){
	  this.setToolbarButtonsDisabled(true);
    this.comment.status = sender.name;
    if(this.comment.status =='unapprove')
    	 this.comment.status = 'hold';
    
    this.account.updateComment(this.comment);
  },
  deleteComment:function(sender){
	  this.$.twoDialog.toggleOpen();
	  this.setToolbarButtonsDisabled(true);
	  this.account.deleteComment(this.comment);
  },
  cancelButtonClick: function() {
  	this.$.twoDialog.toggleOpen();
  }, 
  askBeforeDelete:function(sender) {
  	this.$.twoDialog.toggleOpen();
  },
  setToolbarButtonsDisabled: function(flag) {
  	if(flag) 
  	  enyo.nextTick(enyo.bind(this, function(){
    		this.$.spinner.show();
  	  }));
  	else
  		this.$.spinner.hide();
  	this.$.approve.setDisabled(flag);
  	this.$.trash.setDisabled(flag);
  	this.$.spam.setDisabled(flag);
  	this.$.unapprove.setDisabled(flag);
  	this.$.reply.setDisabled(flag);
  },
  apiError: function(sender, response, request){
    this.setToolbarButtonsDisabled(false);
  }
})