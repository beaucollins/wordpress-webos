
enyo.kind({
  name:'wp.AccountSetup',
  kind:'VFlexBox',
  events:{
    onSelectBlogs:'',
    onCancel:''
  },
  published:{
    cancelable:false
  },
  components:[
    //     {kind: "Scrim", layoutKind: "VFlexLayout", align: "center", pack: "center", components: [
    //  {kind: "SpinnerLarge"}
    // ]},
    
    { kind:'PalmService', service:'palm://com.palm.applicationManager/', method:'open' },
    { name:'blogFinder', kind:'wp.BlogDiscover', onSuccess:'showBlogList', onFailure:'apiFailure', onBadURL:'badURL' },
    // a place for the WordPress Logo
    { name:'header', height:'77px' },
    { kind:'Pane', flex:1, components:[
      { name: 'blogTypeChooser', className:'blog-setup-buttons', components:[
        { kind: 'enyo.Button', onclick:"createNewBlog", caption: 'Start a new blog on WordPress.com' },
        { kind: 'enyo.Button', onclick:"setupHostedBlog", caption: 'Setup a WordPress.com hosted blog' },
        { kind: 'enyo.Button', onclick:"setupBlog", caption: 'Setup a self hosted WordPress blog'},
        { name:'cancel', kind: 'enyo.Button', onclick:'doCancel', caption: 'Cancel' }
      ]},
      { name:'setupForm', kind:'wp.AccountCredentials', onCancel:'cancelSetup', onSetup:'performSetup', selfHosted:false },
    ]},
    { kind:'enyo.Popup', showHideMode:'transition', className:'transitioner fastAnimate', openClassName:'scaleFadeIn', modal:true, scrim:true, components:[
      { name:'blogList', kind:'wp.BlogSetupList', flex:1, lazy:true, onSelectBlogs:'notifySelected', onCancel:'cancelSetup' }
    ]}
  ],
  create:function(){
    this.inherited(arguments);
    this.cancelableChanged();
  },
  reset:function(){
    this.$.pane.selectView(this.$.blogTypeChooser);
    this.$.setupForm.reset();
    if (this.$.blogList) this.$.blogList.reset();
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
    this.$.setupForm.reset();
    this.$.popup.close();
  },
  performSetup:function(sender){
    // this.$.scrim.show();
    self.username = sender.username;
    self.password = sender.password;
    this.$.blogFinder.discoverBlogs(sender.url, sender.username, sender.password);
  },
  // the blogs have been successfully returned from the API. If there's only one blog
  // then just set it up. Otherwise show the list of blogs to the user and let them
  // choose which blog(s) to set up.
  showBlogList:function(sender, blogs){
    if (blogs.length == 1) {
      this.doSelectBlogs(blogs, this.$.setupForm.username, this.$.setupForm.password);
    }else{
      // this.$.scrim.hide();
      this.$.blogList.setBlogs(blogs);
      this.$.popup.openAtCenter();//selectViewByName('blogList');
    }
  },
  notifySelected:function(sender, blogs){
    this.doSelectBlogs(blogs, this.$.setupForm.username, this.$.setupForm.password);
    this.$.popup.close();
  },
  badURL:function(sender){
    this.log("Bad URL message");
    // this.$.scrim.hide();
  },
  apiFailure:function(sender, response, success){
    this.log('API Failure', response);
    // this.$.scrim.hide();
  },
  cancelableChanged:function(){
    if (this.cancelable) {
      this.$.cancel.show();
    }else{
      this.$.cancel.hide();
    }
  }
  
})

enyo.kind({
  name:'wp.BlogSetupList',
  kind:'VFlexBox',
  published: {
    blogs:[]
  },
  events: {
    onCancel:'',
    onSelectBlogs:''
  },
  components:[
    { name:'selection', kind:'wp.utils.SelectionList', onChange:'selectionChanged' },
    { kind:'VFlexBox', className:'setup-screen', width:'320px', height:'300px', components:[
      { name:'scroller', kind:'enyo.Scroller', flex:1, components:[
        { name:'blogs', kind:'VirtualRepeater', onGetItem:'setupBlogRow', components:[
          { kind:'Item', layoutKind:'HFlexLayout', components:[
            { name:'blogName', flex:1 },
            { kind:'CheckBox', checked:false, onclick:'blogToggled' }
          ]}
        ]},
      ]},
      { name:'setup_selected', kind:'enyo.Button', caption:'Set Up', onclick:'setupSelected' },
      { name:'cancel', kind:'enyo.Button', caption:'Cancel', onclick:'doCancel' }
    ]}
  ],
  create:function(){
    this.inherited(arguments);
    this.blogsChanged();
  },
  reset:function(){
    this.setBlogs([])
  },
  setupBlogRow:function(sender, index){
    var blog;
    // index = index % this.blogs.length;
    if (blog = this.blogs[index]) {
      this.count ++;
      this.$.blogName.setContent(blog.blogName);
      return true; //this.count < 50 ? true : false;
    }
  },
  blogToggled:function(sender, event){
    if (sender.checked) {
      this.$.selection.select(event.rowIndex);
    }else{
      this.$.selection.deselect(event.rowIndex);
    }
  },
  blogsChanged:function(){
    this.count = 0;
    this.$.blogs.render();
    this.$.selection.clear();
  },
  setupSelected:function(){
    // filter to only selected blogs
    var selected = [];
    enyo.forEach(this.blogs, function(item, index){
      if (this.$.selection.isSelected(index)) {
        selected.push(item);
      };
    }, this);
    
    this.doSelectBlogs(selected);
  },
  selectionChanged:function(sender, selection){
    if (selection.length == 0) {
      this.$.setup_selected.setDisabled(true);
    }else{
      this.$.setup_selected.setDisabled(false);
    }
  }
});

//* Returns the index of the element in _inArray_ that is equivalent (==) to _inElement_, or -1 if no element is found.
enyo.indexOfFix = function(inElement, inArray) {
	for (var i=0, e; i<inArray.length; i++) {
	  e=inArray[i]
		if (e == inElement) {
			return i;
		}
	}
	return -1;
};


enyo.kind({
  name:'wp.utils.SelectionList',
  kind: enyo.Component,
  events:{
    onChange:''
  },
  create:function(){
    this.inherited(arguments);
    this.selection = [];
  },
  select:function(item){
    if (enyo.indexOfFix(item, this.selection) == -1 ) {
      this.selection.push(item);
      this.doChange(this.selection);
    };
  },
  deselect:function(item){
    var index = enyo.indexOfFix(item, this.selection);
    if (index != -1) {
      this.selection.splice(index, 1);
      this.doChange(this.selection);
    };
  },
  clear:function(){
    this.selection = [];
    this.doChange(this.selection);
  },
  isSelected:function(item){
    return enyo.indexOfFix(item, this.selection) > -1;
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
    { kind:'Control', className:'setup-screen', components:[
      { name:'site', kind:'RowGroup', caption:'Site', components: [
        { name:'url', kind:'Input', autoCapitalize:false, hint:'URL', changeOnKeypress:true, onchange:'updateUrl' }
      ] },
      { kind:'RowGroup', caption:'Account', components: [
        { name:'username', kind:'Input', autoCapitalize:false, hint:'Username', changeOnKeypress:true, onchange:'updateUsername' },
        { name:'password', kind:'Input', hint:'Password', changeOnKeypress:true, onchange:'updatePassword', inputType:'password' }
      ]},
      { name:'signup', kind:'enyo.ActivityButton', className:'enyo-gemstone', caption:'Sign Up', onclick:'setupClicked', disabled:true },
      { name:'cancel', kind:'enyo.Button', caption:'Cancel', onclick:'cleanup' }
    ]}
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
  reset:function(){
    this.setUrl('');
    this.setUsername('');
    this.setPassword('');
    this.$.signup.setActive(false);
  },
  setupClicked:function(){
    this.$.signup.setActive(true);
    this.doSetup();
  },
  checkValid:function(){
    var invalid = this.isEmpty(this.$.url.getValue()) ||
                    this.isEmpty(this.$.username.getValue()) ||
                    this.isEmpty(this.$.password.getValue());
    this.$.signup.setDisabled(invalid);
  },
  updateUrl:function(sender, event, url){
    this.url = url;
    this.checkValid();
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
      this.setUrl('');
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
