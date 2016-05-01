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
	backgroundTransformY: 0,
	backgroundScale: 1,
	
	hasFixedHeight: true,
	
	parallaxRate: 0.3,
	
	didInsertElement: function() {
		this.get('windowScroll').addListener(this);
		if (this.get('debug')) {
			window.windowDidScroll = this.windowDidScroll.bind(this);
			window.updateLayout = this.updateLayout.bind(this);
			window.component = this;
		}
		
		var imgs = this.$().find('img'),
			imgsToLoad = imgs.length,
			_this = this;
		if (imgsToLoad) {
			imgs.each(function() {
				$(this).on('load', function() {
					imgsToLoad--;
					if (imgsToLoad == 0) {
						_this.updateLayout();
					}
				});
			});
		}
		
		
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
				if (this.get('debug')) {
					console.log('image loaded');
				}
				this.updateLayout();
			}.bind(this));
			$background.append($img);
		}
		
		// If no background image and no explicit height, the content block
		// must provide a height.
		if (!this.get('backgroundImage') && !this.get('height')) {
			$content.css('position', 'relative');
		}
		/*
		this.$().find('.hyphae').each(function() {
			var $this = $(this),
				img = $this.find('img');

			img.on('load', function() {
				var h = new Hyphae($this, {
					foodMap: img.attr('src'),
					// fixedOpacity: 0.1,
					// branchiness: 0.01,
					maxWidth: 1,
					lifetime: 30000,
					tickRate: 5,
					moveWithWidth: false
				});
				img.css('opacity', 0);
				h.createTip({ x: img.width() / 2, y: img.height() / 2 });
			});
		});
		*/
		
		this.updateLayout();
	},
	
	didUpdateAttrs: function() {
		this.set('shouldReloadBackgroundImg', true);
	},
	
	updateLayout: function() {
		var $this = this.$(),
			$background = this.get('$background'),
			$inner = this.get('$inner'),
			$content = this.get('$content'),
			userSetHeight = this.get('height'),
			
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
		/*
		if (this.get('hasBackgroundImage') && this.get('backgroundIsLoaded')) {
			bgScale = 1;
		
			if (elementRatio > intrinsicBgRatio + 0.01) {
				// visible area is taller than the image
				bgScale = 1 + (elementRatio / intrinsicBgRatio) + (parallaxRate * intrinsicBgRatio);
			}
			else if (elementRatio < intrinsicBgRatio - 0.01) {
				// visible area is shorter than the image
				bgScale = 1 + parallaxRate
			}
		}
		*/
		bgScale = 1 + parallaxRate;
		
		this.set('backgroundScale', bgScale);
			
		// If there is an explicitly set height, either pct of bg or
		// pixel value.
		if (userSetHeight) {
			if (userSetHeight.indexOf('%') !== -1 && this.get('intrinsicBgHeight') > 0) {
				var componentHeightPct = parseInt(userSetHeight) / 100;
				var maxHeight = Math.min(this.get('intrinsicBgRatio') * $this.width() * componentHeightPct, Ember.$(window).height());
				// if (this.get('debug')) {
				// 	console.log('maxheight', maxHeight, '...', this.get('intrinsicBgRatio') * $this.width(), componentHeightPct);
				// }
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
		
		$content.css({
			top: ($this.height() / 2) - ($content.height() / 2) + 'px'
		});
		
		var cols = $this.find('.col');
		if (cols.length) {
			// var colContainer = $this.find('.col-container');
			if ($this.parents('.phones').length) {
				cols.each(function() {
					Ember.$(this).css('width', '100%');
				});
			}
			else {
				cols.each(function() {
					Ember.$(this).css('width', (100 / cols.length) + '%');
				});
			}
		}
		this.notifyPropertyChange('innerOffsetTop');
		this.windowDidScroll();
	},
	
	innerOffsetTop: function() {	
		return this.get('$inner').offset().top 
	}.property(),
	
	windowDidScroll: function(windowScrollTop) {
		
		windowScrollTop = windowScrollTop || Ember.$(window).scrollTop();
		
		var $background = this.get('$background'),
			documentOffset = $background.offset().top,
			$inner = this.get('$inner'),
			windowHeight = Ember.$(window).height(),
			parallaxRate = this.get('parallaxRate'),
			innerOffsetTop = this.get('innerOffsetTop'),
			windowScrollTop = Ember.$(window).scrollTop(),
			componentHeight = $inner.height(),
			componentWidth = $inner.width(),
			
			elementWindowTopDelta = windowScrollTop - innerOffsetTop,
			elementWindowBottomDelta = elementWindowTopDelta + windowHeight,
			isOnscreen = elementWindowBottomDelta >= 0 && elementWindowTopDelta - componentHeight <= 0,
			
			backgroundScale = this.get('backgroundScale'),
			intrinsicBgRatio = this.get('intrinsicBgRatio'),
			
			renderedBgHeight = (backgroundScale * intrinsicBgRatio * componentWidth),
			
			travel = renderedBgHeight - componentHeight,
			backgroundTransformY = 0;

			if (isOnscreen) {
				backgroundTransformY = travel * (elementWindowTopDelta / windowHeight);
				
				switch (this.get('pinBackgroundImageY')) {	
					case 'bottom':
						backgroundTransformY -= (travel / 2) - 2;
					break;
					case 'top':
						backgroundTransformY += (travel / 2);
					break;
				}
				
				$background.css({
					transform: 'translate3d(0px, ' + backgroundTransformY + 'px, 0px) scale(' + this.get('backgroundScale') + ')'
					// 'transform': 'translateY(' + backgroundTransformY + 'px)'
				});
			}
		
		// if (this.get('debug')) {
		// 	console.log({
		// 		travel: travel,
		// 		ratio: elementWindowTopDelta / windowHeight,
		// 		newTransform: backgroundTransformY
		// 	});
		// }
			
		this.set('backgroundTransformY', backgroundTransformY);
		
		
	},
	
	windowDidResize: function() {
		this.updateLayout();
	}
});
