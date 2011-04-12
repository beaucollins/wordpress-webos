
enyo.kind({
  name:'wp.AccountSetup',
  kind:'VFlexBox',
  components:[
    // a place for the WordPress Logo
    { kind:'PalmService', service:'palm://com.palm.applicationManager/', method:'open' },
    { name:'blogFinder', kind:'wp.BlogDiscover', onSuccess:'showBlogList' },
    { name:'header', height:'77px' },
    { kind:'Pane', flex:1, components:[
      { name: 'blogTypeChooser', className:'blog-setup-buttons', components:[
        { kind: 'enyo.Button', onclick:"createNewBlog", caption: 'Start a new blog on WordPress.com' },
        { kind: 'enyo.Button', onclick:"setupHostedBlog", caption: 'Setup a WordPress.com hosted blog' },
        { kind: 'enyo.Button', onclick:"setupBlog", caption: 'Setup a self hosted WordPress blog'}
      ]},
      { name:'setupForm', kind:'wp.AccountCredentials', onCancel:'cancelSetup', onSetup:'performSetup' },
      { name:'blogList', kind:'wp.BlogSetupList', lazy:true }
    ]}
  ],
  create:function(){
    this.inherited(arguments)
  },
  createNewBlog:function(){
    //we're launching a browser window instead of staying in app
    this.$.palmService.call({target:'http://wordpress.com/signup?ref=webos'});
  },
  setupHostedBlog:function(){
    this.$.setupForm.setSelfHosted(false);
    this.$.pane.selectViewByName('setupForm')
  },
  setupBlog:function(){
    this.$.setupForm.setSelfHosted(true);
    this.$.pane.selectViewByName('setupForm');
  },
  cancelSetup:function(){
    this.$.pane.selectView(this.$.blogTypeChooser);
  },
  performSetup:function(sender){
    console.log(this.$);
    this.$.blogFinder.discoverBlogs(sender.url, sender.username, sender.password);
  },
  showBlogList:function(sender, blogs){
    console.log("Show blogs so they can pick one: ", blogs);
    this.$.pane.selectViewByName('blogList');
    this.$.blogList.setBlogs(blogs);
  }
  
})

enyo.kind({
  name:'wp.BlogSetupList',
  kind:'Control',
  published: {
    blogs:[]
  },
  components:[
    { kind:'VirtualRepeater', onGetItem:'setupBlogRow', components:[
      { kind:'Item', layoutKind:'HFlexLayout', components:[
        { name:'blogName', flex:1 },
        { kind:'CheckBox' }
      ]}
    ]}
  ],
  create:function(){
    console.log("This", this.$);
    this.inherited(arguments);
    this.blogsChanged();
  },
  setupBlogRow:function(sender, index){
    var blog;
    if (blog = this.blogs[index]) {
      this.$.blogName.setContent(blog.blogName);
      return true;
    };
  },
  blogsChanged:function(){
    this.$.virtualRepeater.render();
  }
})

enyo.kind({
  name:'wp.AccountCredentials',
  kind:'Control',
  events: {
    onCancel:'',
    onSetup:''
  },
  published: {
    url:null,
    username:null,
    password:null,
    cancelLabel: 'Cancel',
    confirmLabel: 'Sign Up',
    selfHosted:false
  },
  components: [
    { name:'site', kind:'RowGroup', caption:'Site', components: [
      { name:'url', kind:'FancyInput', hint:'URL', changeOnKeypress:true, onchange:'checkValid' }
    ] },
    { kind:'RowGroup', caption:'Account', components: [
      { name:'username', kind:'FancyInput', hint:'Username', changeOnKeypress:true, onchange:'updateUsername' },
      { name:'password', kind:'FancyInput', hint:'Password', changeOnKeypress:true, onchange:'updatePassword', inputType:'password' }
    ]},
    { name:'signup', kind:'Button', caption:'Sign Up', onclick:'doSetup', disabled:true },
    { name:'cancel', kind:'Button', caption:'Cancel', onclick:'cleanup' }
  ],
  create:function(){
    this.inherited(arguments);
    this.urlChanged();
    this.usernameChanged();
    this.passwordChanged();
    this.selfHostedChanged();
    this.cancelLabelChanged();
    this.confirmLabelChanged();
  },
  checkValid:function(){
    var invalid = this.isEmpty(this.$.url.getValue()) ||
                    this.isEmpty(this.$.username.getValue()) ||
                    this.isEmpty(this.$.password.getValue());
    this.$.signup.setDisabled(invalid);
  },
  updateUsername:function(sender, event, username){
    this.username = username;
    this.checkValid();
  },
  updatePassword:function(sender, event, password){
    this.password = password;
    this.checkValid();
  },
  urlChanged:function(){
    this.$.url.setValue(this.url);
  },
  usernameChanged:function(){
    this.$.username.setValue(this.username);
  },
  passwordChanged:function(){
    this.$.password.setValue(this.password);
  },
  selfHostedChanged:function(){
    if (this.selfHosted) {
      this.$.site.show();
    }else{
      this.setUrl('https://wordpress.com/xmlrpc.php');
      this.$.site.hide();
    }
  },
  cancelLabelChanged:function(){
    this.$.signup.setCaption(this.confirmLabel);
  },
  confirmLabelChanged:function(){
    this.$.cancel.setCaption(this.cancelLabel);
  },
  isEmpty:function(value){
    return !value || value && value.trim() == "";
  },
  cleanup:function(){
    this.setUrl("");
    this.setUsername("");
    this.setPassword("")
    this.doCancel();
  }
});
