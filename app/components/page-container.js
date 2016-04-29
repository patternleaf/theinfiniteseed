import Ember from 'ember';

export default Ember.Component.extend({
	
	windowScroll: Ember.inject.service(),
	
	didInsertElement: function() {
		this.get('windowScroll').pageWasInserted(this);
	},
	
	willDestroyElement: function() {
		this.get('windowScroll').pageWillBeDestroyed(this);
	},
	
	windowDidScroll: function(offset) {
		
	},
	
	windowDidResize: function() {
		
	}
});
