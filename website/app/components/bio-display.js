import Ember from 'ember';

export default Ember.Component.extend({
	people: [],
	
	classNames: ['bio-display'],
	
	selectedPerson: function() {
		return this.get('people').findBy('isSelected');
	}.property('people.@each.isSelected'),
		
	didInsertElement: function() {
		var _this = this;
		this.$().find('.bio-display-list li').on('click', function() {
			var $item = Ember.$(this);
			_this.get('people').forEach(function(person, index) {
				if (index === $item.index()) {
					person.set('isSelected', true);
				}
				else {
					person.set('isSelected', false);
				}
			});
		});
	},
	
	willDestroyElement: function() {
		this.$().find('.bio-display-list li').off('click');
	}
});
