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
  }
})