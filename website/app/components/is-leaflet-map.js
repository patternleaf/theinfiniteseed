import LeafletMapComponent from 'ember-leaflet/components/leaflet-map';

/* global Ember */

export default LeafletMapComponent.extend({
	
	// work-around for map showing up mis-rendered
	// on initial display when loaded under display:none;
	shouldInvalidateSize: false,
	handleShouldInvalidateSize: function() {
		if (this.get('shouldInvalidateSize') && this._layer) {
			this._layer.invalidateSize();
			Ember.run.next(function() {
				this.set('shouldInvalidateSize', false);
			}.bind(this));
		}
	}.observes('shouldInvalidateSize')
});
