(function() {
	var funcs = [];
	var args = [];
	var callback = null;
	var filter = null;
	var host = null;
	
	var MB = function(hostname) {
		// look at hostname
		host = (function(host) {
			if (!host) return "";
			if (host.substring(host.length-1, host.length) != "/") return host;
			return host.substring(0, host.length-1);
		})(hostname);
		
		this.email = function(email) {
			args.push([email]);
			funcs.push(doUserIdByEmail.bind(this));
			return this;
		}
		this.feed = function(userid) {
			args.push(userid ? [userid] : null);
			funcs.push(doFeed.bind(this));
			
			// add each function
			this.each = function(fn) {
				// save callback
				callback = fn;
				
				// initiate
				doEach();
			}
			
			// add filter function
			this.filter = function(fn) {
				filter = fn;
				return this;
			}
			
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
	
	// execute method
	var doEach = function() {
		// get function and compose arguments
		var f = funcs.shift();
		var a = args.shift();
		var aa = [function(data) {
			if (funcs[0]) {
				// more functions to call - compose arguments
				if (args[0]) {
					args[0].push(data);
				} else {
					args[0] = [data];
				}
				
				// recurse
				doEach();
			} else {
				// no more functions - callback
				for (var i=0; i<data.length; i++) {
					var e = data[i];
					if ((filter && filter(e)) || (filter && undefined == filter(e)) || !filter) {
						callback(e);
					}
				}
			}
		}, host];
		if (a) {
			for (var k=0; k<a.length; k++) aa.push(a[k]);
		}
		
		// execute
		f.apply(f, aa);	
	}
	
	// userid of a user by email
	var doUserIdByEmail = function(callback, host, email) {
		dojo.xhrGet({
			"url": host + "/profiles/atom/profileService.do?email=" + email,
			"handleAs": "text",
			"load": function(data) {	
				var idx1 = data.indexOf("<snx:userid>");
				var idx2 = data.indexOf("</snx:userid>", idx1);
				var userid = data.substring(idx1+12, idx2);
				callback(userid);
			}, 
			"error": function(err) {
				throw new Error(err);
			}
		});
	}
	
	// contents of a ublog feed
	var doFeed = function(callback, host, user) {
		dojo.xhrGet({
			"url": host + "/connections/opensocial/rest/ublog/" + (null == user ? "@me" : user) + "/@all",
			"handleAs": "json",
			"sync": true,
			"load": function(data) {
				callback(data.list);
			}, 
			"error": function(err) {
				throw new Error(err);
			}
		});
	}
})();
