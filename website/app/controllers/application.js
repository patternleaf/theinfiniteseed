import Ember from 'ember';
import Person from '../models/person';

export default Ember.Controller.extend({
	people: Ember.computed.alias('model')
});
