(function() {
	// declarations
	var funcs = [];
	var args = [];
	var fnCallback = null;
	var fnFilter = null;
	var host = null;
	
	// declare actual MB object
	var MB = function(hostname) {
		// look at hostname
		host = (function(host) {
			if (!host) return document.location.protocol + "//" + document.location.host;
			if (host.substring(host.length-1, host.length) != "/") return host;
			return host.substring(0, host.length-1);
		})(hostname);
		
		this.email = function(email) {
			args.push([email]);
			funcs.push(doUserIdByEmail.bind(this));
			return this;
		}
		this.userid = function(userid, verify) {
			var a = [userid, verify];
			args.push(a);
			funcs.push(doUserIdByUserId.bind(this));
			return this;
		}
		this.userkey = function(key) {
			var a = [key];
			args.push(a);
			funcs.push(doUserIdByUserKey.bind(this));
			return this;
		}
		this.feed = function(userid) {
			args.push(userid ? [userid] : null);
			funcs.push(doFeed.bind(this));
			
			// add each function
			this.each = function(fn) {
				// save callback
				fnCallback = fn ? fn : function(e) {
					console.log(e);
				};
				
				// initiate
				doOperations();
			}
			
			// add filter function
			this.filter = function(fn) {
				fnFilter = fn;
				return this;
			}
			
			// delete feed and email function
			delete this.feed;
			delete this.email;
			delete this.userid;
			delete this.userkey;
			
			// return
			return this;
		}
	}
	
	// define
	if (!window.MB) {
		window.MB = function(host) {
			// returns new MB.js instance
			return new MB(host);
		};
	}
	
	// execute method (remove functions from array in order and execute them)
	var doOperations = function() {
		// get function and compose arguments
		var f = funcs.shift();
		var a = args.shift();
		var aa = [function(data) {
			// see if there are any more operations to perform
			if (funcs[0]) {
				// more functions to call - compose arguments by grabbing the next and 
				// pushing any return value into the array
				if (args[0]) {
					args[0].push(data);
				} else {
					args[0] = [data];
				}
				
				// recurse
				doOperations();
			} else {
				// no more functions - callback
				for (var i=0; i<data.length; i++) {
					var e = data[i];
					if ((fnFilter && fnFilter(e)) || (fnFilter && undefined == fnFilter(e)) || !fnFilter) {
						fnCallback(e);
					}
				}
			}
		}, host];
		if (a) {
			for (var k=0; k<a.length; k++) aa.push(a[k]);
		}
		console.log(f, aa);
		
		// execute
		f.apply(f, aa);	
	}
	
	// obtain the userid of a user by email
	var doUserIdByEmail = function(callback, host, email) {
		doRequest(host + "/profiles/atom/profileService.do?email=" + email,
			"text",
			function(data) {
				if (!data || data.indexOf("<error xmlns=\"http://www.ibm.com/xmlns/prod/sn\">") != -1) {
					// error
					throw new Error("Unable to translate email <" + email + "> to userid");
				} else {	
					var idx1 = data.indexOf("<snx:userid>");
					var idx2 = data.indexOf("</snx:userid>", idx1);
					var userid = data.substring(idx1+12, idx2);
					callback(userid);
				}
			}
		);
	}
	
	// obtain the userid of a user by id
	var doUserIdByUserId = function(callback, host, userid, verify) {
		if (!userid) throw new Error("You must supply a user id");
		if (!verify) {
			callback(userid);
			return;
		}
		doRequest(host + "/profiles/atom/profileService.do?userid=" + userid,
			"text",
			function(data) {
				if (!data || data.indexOf("<error xmlns=\"http://www.ibm.com/xmlns/prod/sn\">") != -1) {
					// error
					throw new Error("Unable to verify <" + arg + ">");
				} else {
					// ok
					callback(userid);
				}
			}
		);
	}
	var doUserIdByUserKey = function(callback, host, key) {
		if (!key) throw new Error("You must supply a key");
		doRequest(host + "/profiles/atom/profileService.do?key=" + key,
			"text",
			function(data) {
				if (!data || data.indexOf("<error xmlns=\"http://www.ibm.com/xmlns/prod/sn\">") != -1) {
					// error
					throw new Error("Unable to translate key <" + key + "> to userid");
				} else {
					// ok - parse out userid
					var idx1 = data.indexOf("<snx:userid>");
					var idx2 = data.indexOf("</snx:userid>", idx1);
					var userid = data.substring(idx1+12, idx2);
					callback(userid);
				}
			}
		);
	}
	
	// load contents of a ublog feed
	var doFeed = function(callback, host, user) {
		doRequest(host + "/connections/opensocial/rest/ublog/" + (null == user ? "@me" : user) + "/@all",
			"json",
			function(data) {
				callback(data.list);
			}
		);
	}
	
	// function to do request
	var doRequest = function(url, handleAs, callback) {
		if (window.dojo) {
			// use dojo
			var args = {
				"url": url,
				"handleAs": handleAs,
				"load": callback, 
				"error": function(err) {
					throw new Error(err);
				}
			};
			if (handleAs && handleAs == "json") {
				args.headers = {
					"Content-Type": "application/json"
				}
			}
			dojo.xhrGet(args);
		} else if (window.jQuery) {
			// use jQuery
			
		} else {
			throw new Error("No supported framework found");
		}
	}
})();
