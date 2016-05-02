import Ember from 'ember';

export default Ember.Component.extend({
	
	windowScroll: Ember.inject.service(),
	
	breakpoints: function() {
		var bps = JSON.parse(this.get('breakpointsConfig')),
			result = [];
		for (var bpName in bps) {
			result.push({
				name: bpName,
				width: bps[bpName]
			});
		}
		result.sort(function(a, b) {
			return b.width - a.width;
		});
		return result;
	}.property('breakpointsJson'),
	
	didInsertElement: function() {
		this.get('windowScroll').pageWasInserted(this);
	},
	
	willDestroyElement: function() {
		this.get('windowScroll').pageWillBeDestroyed(this);
	},
	
	windowDidScroll: function(offset) {
		
	},
	
	windowDidResize: function() {
		var width = Ember.$(window).width(),
			breakpoints = this.get('breakpoints'),
			$this = this.$(),
			narrowestWidth = Number.MAX_VALUE,
			narrowestBp = null;
		breakpoints.forEach(function(bp) {
			if (width < bp.width && width < narrowestWidth) {
				narrowestBp = bp;
			}
		});
		
		$this.removeClass('mobile ' + breakpoints.mapBy('name').join(' '));
		
		if (narrowestBp) {
			$this.addClass('mobile');
			$this.addClass(narrowestBp.name);
		}
		console.log('updated page resize');
	}
});
