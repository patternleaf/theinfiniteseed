import Ember from 'ember';

export default Ember.Route.extend({
	init: function() {
		var people = [
			{
				name: 'Rori Kundtson',
				title: 'Director &amp; Producer',
				imageUrl: '/img/headshots/Rori_bw.jpg',
				bio: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
				locations: [
					{ name: 'Norway', location: [60.3913, 5.3221] },
					{ name: 'Denver, USA', location: [39.7392, -104.9903] },
					{ name: 'Los Angeles, USA', location: [34.0522, -118.2437] },
				]
			},
			{
				name: 'Gidsken Braadlie',
				title: 'Art Advisor',
				imageUrl: '/img/headshots/Gidsken_bw.jpg',
				bio: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
				locations: [
					{ name: 'Norway', location: [60.3913, 5.3221] },
				]
			},
			{
				name: 'JD Marlow',
				title: 'Film Editor',
				imageUrl: '/img/headshots/jd_bw.jpg',
				bio: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
				locations: [
					{ name: 'Norway', location: [60.3913, 5.3221] },
				]
			},
			{
				name: 'Lowan Stewart',
				title: 'Associate Producer',
				imageUrl: '/img/headshots/Lowan_bw.jpg',
				bio: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
				locations: [
					{ name: 'Norway', location: [60.3913, 5.3221] },
				]
			},
			{
				name: 'Eric Miller',
				title: 'Technologist/Artist',
				imageUrl: '/img/headshots/eric_bw.jpg',
				bio: 'Eric is an inter-disciplinary artist, software engineer, and maker, concerned particularly with the tension between technology and the body. Project media have ranged from music production to performance art, mobile apps, photography, installation, and landscape architecture. His interactive installation work has activated 25,000-person Nike events, the entrance to the Dairy Center for the Arts in Boulder, CO, and was granted art for the 2012 Colorado regional burn, Apogaea. Over the years he has worked on web and mobile projects for Feeding America, Facebook, Gulfstream, The Piton Foundation, and many others. Former faculty at the University of Colorado, he holds a BS in Symbolic Systems from Stanford University and an M.Arch from The University of Colorado. He is ranked 2nd-degree black belt in Aikido Schools of Ueshiba through Hiroshi Ikeda Shihan and trains in the meditative lineage of Chögyam Trungpa Rinpoche.',
				locations: [
					{ name: 'Boulder CO, USA', location: [40.0150, -105.2705] }
				],
				social: {
					facebook: 'https://facebook.com/fsmiller',
					twitter: 'https://twitter.com/patternleaf',
					instagram: 'https://instagram.com/patternleafphoto',
				}
			},
			{
				name: 'Lucian Muntean',
				title: 'Director of Photography, Dead Reckoning',
				imageUrl: '/img/headshots/Lucian_bw.jpg',
				bio: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
				locations: [
					{ name: 'Norway', location: [45.519743, -122.680522] }
				]
			},
			{
				name: 'Elyse Schein',
				title: 'Writer, Editor and Filmmaker',
				imageUrl: '/img/headshots/Elyse.jpg',
				bio: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
				locations: [
					{ name: 'USA', location: [39.7392, -104.9903] },
					{ name: 'France', location: [48.864716, -2.349014] },
				]
			},
			{
				name: 'Troels Overgaard',
				title: 'Game Developer and Film Critic',
				imageUrl: '/img/headshots/Troels.jpg',
				bio: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
				locations: [
					{ name: 'Norway', location: [45.519743, -122.680522] }
				]
			},
			{
				name: 'Lars Sun Slagsvold',
				title: 'Line Producer for Dead Reckoning',
				imageUrl: '/img/headshots/Lars_bw.jpg',
				bio: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
				locations: [
					{ name: 'Norway', location: [45.519743, -122.680522] }
				]
			}
		];

		people.forEach(function(person) {
			this.store.createRecord('Person', person);
		}.bind(this));
	},
	
	model: function() {
		return this.store.peekAll('Person');
	}
});
