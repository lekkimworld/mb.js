dojo.provide("com.lekkimworld.connections.mb.Widget");

dojo.declare("com.lekkimworld.connections.mb.Widget", null, {
	onView: function() {
		// get person id
		var personId = (function(dispUser, attrs) {
			var v = attrs.getItemValue("resourceId");
			if (v) return v;
			v = dispUser.userid;
			return v;
		})(window.profilesData.displayedUser, this.iContext.getiWidgetAttributes());
		console.log("Read personId <" + personId + ">");
		
		// get root element and clear
		var elemRoot = this._getRootElement();
		elemRoot.innerHTML = "";
		console.log(document.location.protocol + "//" + document.location.host);
		
		try {
			// read microblog feed
			var mb = MB(document.location.protocol + "//" + document.location.host).userkey(personId).feed().each(function(e) {
				var html = e.summary;
				var strDate = lconn.core.DateUtil.AtomDateToString(e.published);
				html += "<br/>";
				html += "<a href=\"" + e.url + "\">" + strDate + "</a>";
				dojo.create("div", {"style": "margin-bottom: 5px; border-bottom: solid black 1px", "innerHTML": html}, elemRoot, "last");
			});
		} catch (e) {
			elemRoot.innerHTML = "Unable to read microblog feed for user. Sorry... (" + e + ")";
		}
	},
	_getRootElement: function() {
		return this.iContext.getRootElement();
	}
});