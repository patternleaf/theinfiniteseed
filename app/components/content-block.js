import Ember from 'ember';

export default Ember.Component.extend({
	classNames: ['content-block'],
	
	classNameBindings: ['type'],
	
	windowScroll: Ember.inject.service(),
	
	$inner: null,
	$background: null,
	$content: null,
	
	shouldReloadBackgroundImg: true,
	
	backgroundImage: null,
	backgroundGradient: null,
	
	intrinsicBgWidth: 0,
	intrinsicBgHeight: 0,
	intrinsicBgRatio: 1,
	pinBackgroundImageY: 'top',
	hasBackgroundImage: Ember.computed.notEmpty('backgroundImage'),
	backgroundIsLoaded: Ember.computed.gt('intrinsicBgWidth', 0),
	
	hasFixedHeight: true,
	
	parallaxRate: 0.3,
	
	didInsertElement: function() {
		this.get('windowScroll').addListener(this);
	},
	
	willDestroyElement: function() {
		this.get('windowScroll').removeListener(this);
	},
	
	didRender: function() {
		var $this = this.$(),
			$inner = $this.find('.content-block-inner'),
			$background = $this.find('.content-block-background'),
			$content = $this.find('.content-block-content');
		
		this.set('$inner', $inner);
		this.set('$background', $background);
		this.set('$content', $content);
		
		if (this.get('backgroundGradient')) {
			$inner.addClass(this.get('backgroundGradient'));
		}
		
		if (this.get('backgroundImage') && this.get('shouldReloadBackgroundImg')) {
			// console.log('reloading background img');
			var $img = Ember.$('<img src="' + this.get('backgroundImage') + '">');
			$background.empty();
			
			$img.on('load', function() {
				this.set('intrinsicBgWidth', $img.width());
				this.set('intrinsicBgHeight', $img.height());
				this.set('intrinsicBgRatio', $img.height() / $img.width());
				this.set('shouldReloadBackgroundImg', false);
				this.updateLayout();
				Ember.run.later(this.updateLayout.bind(this), 100);	// wtf.
			}.bind(this));
			$background.append($img);
		}
		
		// If no background image and no explicit height, the content block
		// must provide a height.
		if (!this.get('backgroundImage') && !this.get('height')) {
			$content.css('position', 'relative');
		}
		
		this.updateLayout();
		Ember.run.later(this.updateLayout.bind(this), 100);	// wtf.
	},
	
	didUpdateAttrs: function() {
		this.set('shouldReloadBackgroundImg', true);
	},
	
	updateLayout: function() {
		var $this = this.$(),
			$background = this.get('$background'),
			$inner = this.get('$inner'),
			$content = this.get('$content'),
			componentSetHeight = this.get('height'),
			
			parallaxRate = this.get('parallaxRate'),
			// intrinsicBgWidth = this.get('intrinsicBgWidth'),
			// intrinsicBgHeight = this.get('intrinsicBgHeight'),
			intrinsicBgRatio = this.get('intrinsicBgRatio'),
			elementWidth = $this.width(),
			elementHeight = $this.height(),
			elementRatio = elementHeight / elementWidth,
			// bgHeight = elementWidth * intrinsicBgRatio,
			bgScale = 1;

		// bgScale is relative to 100% of the width of the window, not
		// relative to the image intrinsic size.
		if (this.get('hasBackgroundImage') && this.get('backgroundIsLoaded')) {
			bgScale = 1 + (parallaxRate * intrinsicBgRatio);
		
			if (elementRatio > intrinsicBgRatio + 0.01) {
				bgScale = 1 + (elementRatio / intrinsicBgRatio) + (parallaxRate * intrinsicBgRatio);
			}
		}
			
		// If there is an explicitly set height, either pct of bg or
		// pixel value.
		if (componentSetHeight) {
			if (componentSetHeight.indexOf('%') !== -1 && this.get('intrinsicBgHeight') > 0) {
				var componentHeightPct = parseInt(componentSetHeight) / 100;
				var maxHeight = Math.min(this.get('intrinsicBgRatio') * $this.width() * componentHeightPct, Ember.$(window).height());
				if (this.get('debug')) {
					console.log('maxheight', maxHeight, '...', this.get('intrinsicBgRatio') * $this.width(), componentHeightPct);
				}
				$inner.css({
					'min-height': 'inherit',
					'height': maxHeight + 'px'
				});
				this.set('hasFixedHeight', false);
			}
			else {
				$inner.css({
					'min-height': 'inherit',
					'height': parseInt(this.get('height')) + 'px'
				});
				this.set('hasFixedHeight', true);
			}
		}
		
		if (this.get('hasBackgroundImage') && !this.get('shouldReloadBackgroundImg')) {
			$background.css({
				position: 'relative',
				left: (Math.abs(1 - bgScale) * -50) + '%',
				width: (bgScale * 100) + '%'
			});
			
			var pinBackgroundImageY = this.get('pinBackgroundImageY');
			var imgHeight = intrinsicBgRatio * elementWidth * bgScale;
			// TODO: unifying equation for these
			switch (pinBackgroundImageY) {
				case 'top':
					// default case
				break;
				case 'bottom':
					if (elementRatio < intrinsicBgRatio - 0.01) {
						$background.css({
							top: -1 * (imgHeight - elementHeight) + 'px'
						});
					}
					else {
						$background.css({
							top: Math.abs(1 - bgScale) * -99.9999 + '%'
						});
					}
				break;
				case 'center':
					if (elementRatio < intrinsicBgRatio - 0.01) {
						$background.css({
							top: -0.5 * (imgHeight - elementHeight) + 'px'
						});
					}
					else {
						$background.css({
							top: Math.abs(1 - bgScale * intrinsicBgRatio) * -50 + '%'
						});
					}
				break;
			}
		}
		
		$content.css({
			top: ($this.height() / 2) - ($content.height() / 2) + 'px'
		});
		
		var cols = $this.find('.col');
		if (cols.length) {
			// var colContainer = $this.find('.col-container');
			cols.each(function() {
				Ember.$(this).css('width', (100 / cols.length) + '%');
			});
		}
		
		this.windowDidScroll();
	},
	
	windowDidScroll: function(scrollTop) {
		
		scrollTop = scrollTop || Ember.$(window).scrollTop();
		
		var $background = this.get('$background'),
			windowHeight = Ember.$(window).height(),
			// elementWidth = $this.width(),
			elementOffset = $background.offset().top,
			parallaxRate = this.get('parallaxRate'),
			onscreenOffset = scrollTop - elementOffset + windowHeight,
			baseOffset = windowHeight * parallaxRate;
		
		$background.css({
			'transform': 'translateY(' + ((onscreenOffset * parallaxRate) - baseOffset) + 'px)'
		});
	},
	
	windowDidResize: function() {
		this.updateLayout();
	}
});
