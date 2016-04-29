import Ember from 'ember';

export default Ember.Service.extend({
	
	activePage: null,
	
	listeners: [],
	
	init: function() {
		this._super.apply(this, arguments);
		Ember.$(window).on('scroll', this.handleScroll.bind(this));
		Ember.$(window).on('resize', this.handleResize.bind(this));
	},
	
	handleScroll: function(event) {
		var offset = Ember.$(window).scrollTop();
		this.get('activePage').windowDidScroll(offset);
		this.get('listeners').forEach(function(listener) {
			if (Ember.canInvoke(listener, 'windowDidScroll')) {
				listener.windowDidScroll(offset);
			}
		});
	},
	
	handleResize: function() {
		this.get('activePage').windowDidResize();
		this.get('listeners').forEach(function(listener) {
			if (Ember.canInvoke(listener, 'windowDidResize')) {
				listener.windowDidResize();
			}
		});
	},
	
	pageWasInserted: function(pageComponent) {
		this.set('activePage', pageComponent);
	},
	
	pageWillBeDestroyed: function(pageComponent) {
		
	},
	
	addListener: function(listener) {
		var listeners = this.get('listeners');
		if (!listeners.contains(listener)) {
			listeners.addObject(listener);
		}
	},
	
	removeListener: function(listener) {
		this.get('listeners').removeObject(listener);
	}
});
