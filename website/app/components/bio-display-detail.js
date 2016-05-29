import Ember from 'ember';

export default Ember.Component.extend({
	classNames: ['bio-display-detail'],
	
	selectedTab: 'bio',
	
	actions: {
		updateActiveMarker: function(selectedPerson, location) {
			selectedPerson.set('mapCenter', location.location);
		},
		
		selectTab: function(tabName) {
			this.set('selectedTab', tabName);
		}
	}
});
