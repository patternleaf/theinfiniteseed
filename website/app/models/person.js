import Model from 'ember-data/model';
import DS from 'ember-data';

/* global Ember */

export default Model.extend({
	name: DS.attr('string'),
	title: DS.attr('string'),
	imageUrl: DS.attr('string'),
	bio: DS.attr('string'),
	
	locations: DS.attr(),
	social: DS.attr(),
	
	_mapCenter: null,
	mapCenter: Ember.computed('locations', {
		get() {
			return this.get('_mapCenter') || this.get('locations.firstObject.location');
		},
		set(key, value) {
			this.set('_mapCenter', value);
			return value;
		}
	})
});
