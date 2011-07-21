enyo.kind({
  name: 'AccountManager',
  kind: enyo.Component,
  published: {
    accounts:[]
  },
  loadAccounts:function(onReady){
    var manager = this;
    enyo.application.models.Account.all().list(function(accounts){
      manager.setAccounts(accounts);
      onReady();
    });
  },
  addAccount:function(account, callback){
    var store = enyo.application.persistence;
    var manager = this;
    manager.accounts.push(account);
  },
  removeAccount:function(account, callback){
	var manager = this;
	for(var i=0; 0<manager.accounts.length; i++) {
		if(account == manager.accounts[i]) {
			manager.log("Found account! removing it");
			manager.accounts.splice(i,1);
			break;
		}
	}
  },
  // check if a blog with the same id and xmlrpc endpoint already exists
  blogExists:function(blog){
    var existing;
    for (var i=0; i < this.accounts.length; i++) {
      existing = this.accounts[i];
      console.log("Checking");
      console.log(existing.xmlrpc, blog.xmlrpc, existing.blogid.toString(), blog.blogid);
      if (existing.xmlrpc == blog.xmlrpc && existing.blogid.toString() == blog.blogid) {
        return true;
      };
    };
    return false;
  },
  getFirstWPCOMaccount: function(){
	  var existing;
	    for (var i=0; i < this.accounts.length; i++) {
	      existing = this.accounts[i];
	      console.log("Checking");
	      console.log(existing.xmlrpc);
	      if ((/wordpress\.com\/xmlrpc\.php$/i).test(existing.xmlrpc))
	    	  return existing;
	    };
	    return false;
  }
})