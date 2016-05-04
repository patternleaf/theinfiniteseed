/**
 * hyphae.js
 * 
 * A hyphal growth visualizer for modern browsers.
 * http://hyphaejs.org
 * 
 * ## Basic usage
 * 
 *      var hyphae = new Hyphae($('#hyphae-container'));
 *      hyphae.createTip({ x: 100, y: 100 });
 * 
 * ## Requires
 * 
 * - jQuery. Tested with v.1.4.4.
 * 
 * 
 * ## Overview
 * 
 * Hyphae are the structures by which fungi grow. This little library provides
 * a visual simulation of fungal growth for aesthetic purposes. It doesn't
 * attempt any *genuine* simulation of fungal growth. It's just for effect.
 * 
 * The library exposes a bunch of paramaters that control how hyphae tips grow,
 * branch, and draw themselves. These parameters can be driven programmatically
 * or by use of the red, green, blue, and alpha channels in an image.
 * 
 * 
 * ## Food and Growth
 * 
 * Hyphae are composed of tips (Hyphae.Tip in the code). A tip can have a 
 * "bias", or direction in which it will tend to grow, with some random 
 * wandering mixed in.
 * 
 * Inspired by Ryan Alexander's processing project 
 * (http://www.creativeapplications.net/processing/mycelium-processing/),
 * the basic motivator for tip growth is "food," which is provided by an image.
 *
 * A tip starts life with a set amount of energy. If a tip encounters no food,
 * it will gradually shrink and stop growing. If it encounters food, the tip
 * is rejuvinated and continues onward, with a tendency to follow the path of
 * food. This tendency is mixed in with the tip's inherent bias direction 
 * for growth, if any, and some randomness. Food is a pretty strong motivator,
 * though. (Honestly, I can relate.)
 * 
 * By default food is the 8-bit red channel in an image. 
 * 
 * 
 * ## Branching
 * 
 * A hypha tip will occasionally branch, creating a new tip. The child tip
 * will carry some of the parent's energy away with it, so a tip that branches
 * many times will have a shorter life than one which never branches.
 * 
 * Tips branch orthogonally left or right to its parent's growth direction.
 * 
 * ## Food map image
 * 
 * The basic use of the food map image is to give the hyphae a structure to 
 * grow on. The food map image can also control other parameters of growth,
 * branching, and drawing, providing more artistic control over how your 
 * hyphae look and develop.
 * 
 * 
 * Copyright (c) 2011 Eric Miller/Patternleaf Design (http://patternleaf.com)
 * Licensed under the MIT (http://www.opensource.org/licenses/mit-license.php) license.
 * 
 */

;(function($, undefined) {
    /**
     * Parameters:
     * 
     *      scale 
     *          "engery", red channel by default
     * 
     *      growthBias 
     *          a vector + ratio.
     *          maps 0-255 => 0-2pi radians, starting with 0 = 
     *          vector pointing { x: 1, y: 0 } and going clockwise
     *          so 25% brightness (64) will be straight down, 75% 
     *          brightness (191) will be straight up ... akin to a
     *          force of "gravity" ... other factors notwithstanding,
     *          tips will tend towards their growth bias
     * 
     *      branchiness
     *          0-1, the chance at every tick that a tip will branch,
     *          scaled by the tip's current energy level and divided by 10
     *          (things quickly get out of hand with large numbers here)
     *          branchiness > .3 is kind of a lot.
     * 
     *      fixedOpacity
     *          maps to simple opacity of drawn hyphae tips
     * 
     *      leafImage
     * 
     *      leafiness
     * 
     *      foodMap
     *          the url of an image to be used as a foodMap. note this
     *          url will be subject to same-origin security restrictions
     *          (it needs to be hosted on the same domain as the page in which
     *          this script is running)
     * 
     * To do:
     *      -   use web workers for tip calculations (tick), and a single timer
     *          that does a single draw pass over every tip
     *      -   make leafiness happen - i want to be able to grow flowers
     *          or leaves or mushrooms
     *      -   avoidance map
     *      -   intersection with existing tip paths stops tip?
     *      -   decay (not working currently)
     *      -   allow additional images for control of more than 4 params
     * 
     */
    Hyphae = function(container, options) {
        
        this.options = $.extend(true, {
            growthBias: null,
            maxGrowthBiasRatio: 0.5,
            branchiness: 0.1,
            pruneHistory: true,
            foodMap: null,
            foodMapOffset: { x: 0, y: 0 },
            drawFoodMap: false,
            lifetime: 20000,        // in ms
            maxTipTicks: 50000,     // will be scaled per-tip based on its starting energy
            maxTips: 200,
            consumption: .7,
            randomizeWidth: false,
            fixedOpacity: 0.2,
            tickRate: 30,
            maxWidth: 1,
			moveWithWidth: true,
            leafImage: null,
            leafImageParams: {},
            leafiness: .005,
            maxLeafiness: .1,
            foodMapChannelParams: {
                r: 'scale',
                g: 'no-effect',
                b: 'no-effect',
                a: 'no-effect'
            },
            color: {
                r: 255,
                g: 255,
                b: 255
            }
        }, options);
        
        this.jqContainer = container;
        this.dimensions = {
            width: container.outerWidth(),
            height: container.outerHeight()
        };
        this.jqCanvas = $('<canvas></canvas>').attr(this.dimensions).attr('class', 'tip-canvas');
        this.jqLeafCanvas = $('<canvas></canvas>').attr(this.dimensions).attr('class', 'leaf-canvas');
        this.jqLeafGrowingCanvas = $('<canvas></canvas>').attr(this.dimensions).attr('class', 'leaf-growing-canvas');
        this.jqCanvas
            .add(this.jqLeafCanvas)
            .add(this.jqLeafGrowingCanvas)
                .css($.extend({ position: 'absolute' }, this.dimensions));

        
        this.jqContainer.prepend(this.jqLeafCanvas);
        this.jqContainer.prepend(this.jqLeafGrowingCanvas);
        this.jqContainer.prepend(this.jqCanvas);
        this.tipCtx = this.jqCanvas.get(0).getContext('2d');
        this.leafCtx = this.jqLeafCanvas.get(0).getContext('2d');
        this.leafGrowingCtx = this.jqLeafGrowingCanvas.get(0).getContext('2d');

        this.setFoodMapChannelParams(this.options.foodMapChannelParams);
        this.foodMapData = null;
        this.waitingForFoodMap = false;
        if (this.options.foodMap) {
            this.setFoodMap(this.options.foodMap);
        }
        
        this.leafImageData = null;
        this.waitingForleafImage = false;
        if (this.options.leafImage) {
            this.setLeafImage(this.options.leafImage, this.options.leafImageParams);
        }

        this.tips = [];
        this.leaves = [];
        this.nTicks = 0;
        this.running = true;
        
        var _this = this;
        this.timer = setInterval(function() {
            _this.tick();
        }, this.options.tickRate);
    };

	Hyphae.prototype.pause = function() {
		clearInterval(this.timer);
	};
	Hyphae.prototype.continue = function() {
		this.timer = setInterval(function() {
            _this.tick();
        }, this.options.tickRate);
	};

    Hyphae.prototype.stop = function() {
        //clearInterval(this.timer);
        for (var i = 0; i < this.tips.length; i++) {
            this.tips[i].stop();
        }
    };

    Hyphae.extractImageData = function(img, doneCallback, errorCallback, width, height, offsetX, offsetY) {
        if (typeof img == 'string') {
            var i = new Image();
            i.src = img;
            img = i;
        }
        offsetX = offsetX || 0;
        offsetY = offsetY || 0;
        img.onload = function() {
            width = width || img.width;
            height = height || img.height;
            var canvas = document.createElement('canvas');
            var context = canvas.getContext('2d');
            canvas.width = width;
            canvas.height = height;
            context.drawImage(
                img, 
                offsetX, offsetY,
                width, height
            );
            doneCallback(context.getImageData(0, 0, width, height), img);
            $(canvas).remove();
            /*
            $('body').append(canvas);
            $(canvas).css({
                position:'absolute',
                top: 0,
                left: 0,
                border:'1px solid red'
            });
            */
        };
    };

    Hyphae.prototype.setLeafImage = function(img, params) {
        var _this = this;
        this.waitingForLeafImage = true;
        Hyphae.extractImageData(img, function(data, img) {
            _this.leafImageData = data;
            _this.leafImg = img;
            _this.waitingForLeafImage = false;
        });
        if (params) {
            this.setLeafImageParams(params);
        }
    };
    
    Hyphae.prototype.setLeafImageParams = function(params) {
        this.leafImageParams = $.extend(true, {
            registration: { x: 0, y: 0 },
            frames: 1,
            width: 80,
            height: 80,
            behavior: {
                maxScale: 1,
                wriggle: false,
                randomSize: true,
                growSpeed: .02,
                phyllotaxis: 'random',
                orientation: 'orthogonal'
            }
        }, params);
    };

    Hyphae.prototype.setFoodMap = function(img) {
        var _this = this;
        this.waitingForFoodMap = true;
        Hyphae.extractImageData(img, function(data, img) {
            _this.foodMapData = data;
            _this.foodImg = img;
            if (_this.options.drawFoodMap) {
                _this.drawFoodMap();
            }
            _this.waitingForFoodMap = false;
        }, null, this.dimensions.width, this.dimensions.height, this.options.foodMapOffset.x, this.options.foodMapOffset.y);
    };

    Hyphae.prototype.setFoodMapChannelParams = function(channelParams) {
        this.foodMapChannelParams = channelParams;
        this.foodMapParamChannels = {};
        for (var channelName in this.foodMapChannelParams) {
            this.foodMapParamChannels[this.foodMapChannelParams[channelName]] = channelName;
        }
    };

    Hyphae.prototype.getFoodMapChannelParams = function(channelParams) {
        return $.extend({}, this.foodMapChannelParams);
    };

    Hyphae.nullFoodData = {
        r: 0,
        g: 0,
        b: 0,
        a: 0,
    };
    
    // returns 2d array, rows first. so (2, 1) is 
    // result[1][2];
    Hyphae.blah = false;
    Hyphae.prototype.getFoodNear = function(x, y, windowSize, andConsume) {
        windowSize = windowSize || 1;
        x = Math.floor(x);
        y = Math.floor(y);
        var result = [];
        var qDataIndex = (this.dimensions.width * y * 4) + (x * 4);
        
        if (!Hyphae.blah) {
            Hyphae.blah = true;
            
        }
        
        for(var i = -windowSize; i < windowSize + 1; i++) {
            if (!result[i + windowSize]) {
                result[i + windowSize] = [];
            }
            for(var k = -windowSize; k < windowSize + 1; k++) {
                if (!this.foodMapData) {
                    result[i + windowSize][k + windowSize] = Hyphae.nullFoodData;
                }
                else {
                    var dataIndex = (this.dimensions.width * (y + i) * 4) + ((x + k) * 4);
                    result[i + windowSize][k + windowSize] = {
                        r: this.foodMapData.data[dataIndex],
                        g: this.foodMapData.data[dataIndex + 1],
                        b: this.foodMapData.data[dataIndex + 2],
                        a: this.foodMapData.data[dataIndex + 3],
                    };
//console.log('(' + result[i + windowSize][k + windowSize].r + ', ' + result[i + windowSize][k + windowSize].g + ', ' + result[i + windowSize][k + windowSize].b + ', ' + result[i + windowSize][k + windowSize].a + ')');
                }
            }
        }
        
        var reduction = (1 - this.options.consumption);
        if (andConsume && this.foodMapData && (qDataIndex + 3) < this.foodMapData.data.length) {
            if (('foodMapParamChannels' in this) && ('scale' in this.foodMapParamChannels)) {
                var reductionIndex = qDataIndex + ['r', 'g', 'b', 'a'].indexOf(this.foodMapParamChannels['scale']);
                this.foodMapData.data[reductionIndex] *= reduction;
            }
        }
        return result;
    };
    
    Hyphae.prototype.getFoodAt = function(x, y) {
        if (this.foodMapData) {
            var rIndex = (this.dimensions.width * Math.round(y) * 4) + (Math.round(x) * 4);
            return {
                r: this.foodMapData.data[rIndex],
                g: this.foodMapData.data[rIndex + 1],
                b: this.foodMapData.data[rIndex + 2],
                a: this.foodMapData.data[rIndex + 3],
            };
        }
        return 0;
    };

    Hyphae.prototype.getContainer = function() {
        return this.jqContainer;
    };

    Hyphae.prototype.getCanvas = function() {
        return this.jqCanvas.get(0);
    };
    
    Hyphae.prototype.getTipContext = function() {
        return this.tipCtx;
    };
    
    Hyphae.prototype.getLeafContext = function() {
        return this.leafCtx;
    };
    
    Hyphae.prototype.getLeafGrowingContext = function() {
        return this.leafGrowingCtx;
    };
    
    Hyphae.prototype.getLeafImageData = function() {
        return this.leafImageData;
    };
    
    Hyphae.prototype.getLeafImg = function() {
        return this.leafImg;
    };
    
    Hyphae.prototype.getLeafImageParams = function() {
        return this.leafImageParams;
    };
    
    Hyphae.prototype.getDimensions = function() {
        return this.dimensions;
    };
    
    Hyphae.prototype.getTips = function() {
        return this.tips;
    };
    
    Hyphae.prototype.getTotalTicks = function() {
        return this.nTicks;
    };
    
    Hyphae.prototype.onTipTicked = function(tip) {
        this.nTicks++;
    };

    Hyphae.prototype.drawFoodMap = function() {
        if (this.foodMapData) {
            this.tipCtx.save();
            var a = this.tipCtx.globalAlpha;
            this.tipCtx.globalAlpha = .4;
            this.tipCtx.globalCompositeOperation = 'lighter';
            this.tipCtx.putImageData(this.foodMapData, 0, 0);
            this.tipCtx.restore();
        }
    };

    Hyphae.prototype.getGlobalScalar = function() {
        return Math.max(.01, 1 - (this.tips.length / this.options.maxTips));
    };
    
    Hyphae.prototype.getTotalFood = function() {
        var total = 0;
        for (var i = 0; i < this.foodMapData.data.length; i++) {
            total += this.foodMapData.data[i];
        }
        return total;
    };

    Hyphae.prototype.createTip = function(startPoint, options) {
        this.tips.push(new Hyphae.Tip(startPoint, $.extend(true, {}, this.options, options), this));
        $(this).trigger('tip-created');
    };

    Hyphae.prototype.killTip = function(tip) {
        this.tips.splice(this.tips.indexOf(tip), 1);
        $(this).trigger('tip-killed');
    }

    Hyphae.prototype.remove = function() {
        clearInterval(this.timer);
        for (var i = 0 ; i < this.tips.length; i++) {
            this.tips[i].kill();
            $(this).trigger('tip-killed')
        }
        this.tips = [];
        this.jqCanvas.remove();
    };
    
    Hyphae.prototype.tick = function() {
        var killList = [];
        if (!this.waitingForFoodMap) {
            for (var i = 0; i < this.tips.length; i++) {
                if (this.tips[i].running) {
                    this.tips[i].tick();
                    this.tips[i].drawStep();
                }
                else {
                    this.tips[i].kill();
                    killList.push(i);
                }
            }
        }
        for (var i = 0; i < killList.length; i++) {
            this.tips.splice(killList[i], 1);
            $(this).trigger('tip-killed')
        }
        
        killList = [];
        if (!this.waitingForLeafImage) {
            // reset the growing canvas on each tick
            this.jqLeafGrowingCanvas.get(0).width = this.jqLeafGrowingCanvas.get(0).width;
            for (var i = 0; i < this.leaves.length; i++) {
                if (this.leaves[i].running) {
                    this.leaves[i].tick();
                    this.leaves[i].drawStep();
                }
                else {
                    killList.push(i);
                }
            }
        }
        for (var i = 0; i < killList.length; i++) {
            this.leaves.splice(killList[i], 1);
        }
    };

    Hyphae.Tip = function(startPoint, options, hyphae) {
        this.options = $.extend(true, {}, hyphae.options, options);

        this.scale = this.options.scale || 1;

        this.history = [{ x: startPoint.x, y: startPoint.y, w: this.scale }];
        this.children = {};
        this.childrenFlat = [];
        
        this.accel = { x: 0, y: 0 };
        this.vel = this.options.initialVelocity || { x: 0, y: 0 };
        this.hyphae = hyphae;

        this.startScale = this.scale;
        this.drawIndex = 1;
        this.nTicks = 0;

        var _this = this;
        this.running = true;
        this.decaying = false;
        
        if (this.options.lifetime) {
            setTimeout(function() {
                //console.log('safety');
                _this.stop();
            }, this.options.lifetime);
        }
/*
        this.timer = setInterval(function() {
            if (!_this.hyphae.waitingForFoodMap) {
                if (_this.running) {
                    _this.tick();
                    _this.drawStep();
                }
                else if (_this.decaying) {
                    _this.decay();
                }
                // else {
                //     _this.kill();
                // }
            }
        }, this.options.tickRate);
*/
    };
    
    Hyphae.Tip.prototype.kill = function() {
        this.history = null;
        //clearInterval(this.timer);
    };

    Hyphae.Tip.prototype.stop = function() {
        this.running = false;
        // decay doesn't work
        /*
        this.decaying = true;
        var _this = this;
        setTimeout(function() {
            _this.decaying = false;
        }, 3000);
        */
    };

    
    Hyphae.Tip.prototype.tick = function() {

        var avg = { x: 0, y: 0 };
        var lastPoint = this.history[this.history.length - 1];

        // currently working out "scale" food param here and assuming that it is a defined
        // food param.
        var windowSize = 1;
        var food = this.hyphae.getFoodNear(lastPoint.x, lastPoint.y, windowSize, true);
        var brightest = 0;
        var firstBrightness = 0;
        var variance = false;
        var brightness = 0;
        var brightestVector = { x: 0, y: 0 };   // default to our inherent bias
        var currentBrightness = 0;
        var currentFood = { r: 0, g: 0, b: 0, a: 0 };
        
        for (var i = 0; i < food.length; i++) {
            for (var k = 0; k < food[i].length; k++) {
                var f = food[i][k];
                // note: assuming scale is a defined food param
                brightness = f[this.hyphae.foodMapParamChannels.scale];
                var diffVector = {
                    x: k - windowSize,
                    y: i - windowSize
                };
                if (brightness > brightest) {
                    brightest = brightness;
                    brightestVector = diffVector;
                }
                
                if (i == 0 && k == 0) {
                    firstBrightness = brightness;
                }
                else if (!variance) {
                    variance = (firstBrightness != brightness);
                }
                // the pixel we are on currently
                if (diffVector.x == 0 && diffVector.y == 0) {
                    currentBrightness = brightness;
                    currentFood = f;
                }
            }
        }
        // console.log({
        //     brightest: brightest,
        //     food: food,
        //     brightestVector: brightestVector
        // });

        this.scale += ((currentBrightness / 255) * this.options.consumption);
        this.scale = Math.min(1, this.scale * (1 - (this.length() / (this.options.maxTipTicks * this.startScale * this.hyphae.getGlobalScalar()))));

        if (this.scale < 0.001) {
            //console.log('scale too low; tip stopping');
            this.stop();
        }
        else {
            
            // options will be overridden if food map defines them
            var foodParams = this.digestFood(currentFood, {
                fixedOpacity: this.options.fixedOpacity,
                growthBias: this.options.growthBias,
                leafiness: this.options.leafiness,
                branchiness: this.options.branchiness,
                scale: this.scale
            });

            var accel = randomVector();
            
            if (brightest > 0 && brightestVector.x != 0 && brightestVector.y != 0 && variance) {
                accel = add(accel, brightestVector);
            }
            
            if (foodParams.growthBias) {
                accel = add(accel, multiplyScalar(foodParams.growthBias, foodParams.growthBias.ratio));
            }
            
            this.accel = normalize(accel);
            this.vel = normalize(add(this.vel, this.accel));
			
			var width = (this.scale * (this.options.randomizeWidth ? Math.random() : 1)) * this.options.maxWidth;
			var newX = newY = 0;
			if (this.options.moveWithWidth) {
				newX = lastPoint.x + this.vel.x * width;
				newY = lastPoint.y + this.vel.y * width;
			}
			else {
				newX = lastPoint.x + this.vel.x;
				newY = lastPoint.y + this.vel.y;
			}
			
//console.log(width);
            var newPoint = { 
                x: newX,
                y: newY,
                w: width,
                c: {
                    r: this.options.color.r,
                    g: this.options.color.g,
                    b: this.options.color.b,
                    a: ('fixedOpacity' in foodParams ? foodParams.fixedOpacity : this.options.color.a)
                }
            };
//console.log(lastPoint.x, lastPoint.y, '=>', newPoint.x, newPoint.y);
            this.history.push(newPoint);
            this.nTicks++;

            var hyphaeDimensions = this.hyphae.dimensions;
            if (newPoint.x < 0 || newPoint.y < 0 || newPoint.x > hyphaeDimensions.width || newPoint.y > hyphaeDimensions.height) {
                //console.log('scaling back because we\'re out of bounds');
//console.log('oob');
                this.scale *= .1;
            }
            
            var perpAccel;
            // determine whether to grow a leaf in this tick
            if (this.hyphae.options.leafImg && Math.random() < foodParams.leafiness) {
                // if leaf images are presented with tip up and stem down, 
                // the angles work out so that we rotate our velocity by 180 or by 0 (rather than 90 or 270) 
                // in order to draw perpendicular to our direction of growth.
                perpAccel = (Math.random() > .5 ? rotate(this.vel, Math.PI) : this.vel);
                this.hyphae.leaves.push(new Hyphae.Leaf(newPoint, perpAccel, {}, this.hyphae));
            }
            
            // determine whether to branch in this tick ... involves current scale.
            if (Math.random() > (1 - (foodParams.branchiness * this.scale))) {
                perpAccel = (Math.random() > .5 ? rotate(this.vel, Math.PI) : rotate(this.vel, -Math.PI));
                this.hyphae.createTip({ x: lastPoint.x, y: lastPoint.y }, $.extend(true, {}, this.options, {
                    initialVelocity: perpAccel,
                    scale: this.scale * .25
                }));
                
                // scale back to account for the the energy lost by branching
                this.scale *= .9
            }
        }

        this.hyphae.onTipTicked(this);
    };


    Hyphae.Tip.prototype.digestFood = function(food, params) {

        // make a copy of params
        var result = $.extend(true, {}, params);

        // grab the growth bias ratio first if it's defined in the map
        if ('growthBiasRatio' in this.hyphae.foodMapParamChannels) {
            // if defined by food map, overwrite with that value
            growthBiasRatio = this.options.maxGrowthBiasRatio * (food[this.options.foodMapParamChannels['growthBiasRatio']] / 255);
        }
        else {
            growthBiasRatio = this.options.maxGrowthBiasRatio;
        }

        for (var channelName in this.hyphae.foodMapChannelParams) {
            var paramName = this.hyphae.foodMapChannelParams[channelName];
            if (paramName in result) {
                var channelValue = food[channelName];
                switch (paramName) {
                    case 'growthBias':
                        var vector = makeVector((channelValue / 255) * circleInRadians, 1);
                        result[paramName] = { x: vector.x, y: vector.y, ratio: growthBiasRatio };
                    break;
                    default:
                        //console.log('setting ' + paramName + ' to ' + channelValue / 255)
                        result[paramName] = channelValue / 255;
                    break;
                }
            }
        }
        return result;
    };
    
    Hyphae.Tip.prototype.drawStep = function() {
        if (this.drawIndex < this.history.length - 1 && this.drawIndex > 2) {
            var ctx = this.hyphae.getTipContext();

			var start = this.history[this.drawIndex - 2];
			var center = this.history[this.drawIndex - 1];
			var end = this.history[this.drawIndex];

			var points = [start, center, end];

			var op = ctx.globalCompositeOperation;
			//ctx.globalCompositeOperation = 'xor';
            ctx.beginPath();
			ctx.moveTo(start.x, start.y);
			ctx.quadraticCurveTo(
				center.x, 
				center.y, 
				end.x, 
				end.y
			);
			//ctx.closePath();

            // ctx.moveTo(x, y);
            // ctx.lineTo(nextPoint.x, nextPoint.y);
            // ctx.closePath();
			if (this.options.moveWithWidth) {
				ctx.lineWidth = this.history[this.drawIndex].w;
			}
			else {
				ctx.lineWidth = this.history[this.drawIndex].w * this.options.maxWidth;
			}

            var c = this.history[this.drawIndex].c;
			ctx.strokeStyle = 'rgba(' + c.r + ', ' + c.g + ', ' + c.b + ', ' + c.a + ')'
			//ctx.strokeStyle = 'rgba(' + c.r + ', ' + c.g + ', ' + c.b + ', ' + 1 + ')';
			//ctx.clip();
			//ctx.fillStyle = 'rgba(' + c.r + ', ' + c.g + ', ' + c.b + ', ' + c.a + ')'
			//ctx.fillRect(0, 0, this.hyphae.dimensions.width, this.hyphae.dimensions.height);
			ctx.stroke();
			//ctx.globalCompositeOperation = op;
            if (this.hyphae.pruneHistory) {
                this.history.shift();
            }
            else {
                this.drawIndex++;
            }
        }
		else if (this.drawIndex <= 2) {
			this.drawIndex++;
		}
    };
/*
    Hyphae.Tip.prototype.decay = function() {
        // the composite yadda yadda does not do what it should, i think
        // so this does nothing at the moment.
        var ctx = this.hyphae.getTipContext();
        ctx.save();
        ctx.globalCompositeOpration = 'destination-out';
        ctx.globalAlpha = .01;
        for (var i = 1; i < this.history.length; i++) {
            ctx.beginPath();
            ctx.moveTo(this.history[i - 1].x, this.history[i - 1].y);
            ctx.lineTo(this.history[i].x, this.history[i].y);
            //ctx.closePath();
            ctx.lineWidth = this.history[i].w;
            ctx.strokeStyle = 'rgba(255, 255, 255, 1)';
            ctx.stroke();
        }
        ctx.restore();
    };
*/
    Hyphae.Tip.prototype.resetDrawing = function() {
        this.drawIndex = 1;
    };
    
    Hyphae.Tip.prototype.length = function() {
        return this.nTicks;
    };
 
    Hyphae.Leaf = function(startPoint, orientation, options, hyphae) {
        this.running = true;
        this.startPoint = startPoint;
        this.hyphae = hyphae;
        this.alpha = 1;
        //this.alpha = startPoint.c.a;
        var angleMag = getAngleAndMagnitudeFromVector(orientation);
        this.orientation = (angleMag.magnitude > 0 ? angleMag.angle : angleMag.angle * -1);
        this.options = $.extend(this.hyphae.getLeafImageParams(), options);
        this.imageData = this.hyphae.getLeafImageData();
        this.img = this.hyphae.getLeafImg();
        this.growStep = 0;
        if (this.options.behavior.randomSize) {
            this.finalScale = this.options.behavior.maxScale * Math.random();
        }
        else {
            this.finalScale = this.options.behavior.maxScale;
        }
        
    };
 
    Hyphae.Leaf.prototype.tick = function() {
        this.growStep += this.options.behavior.growSpeed;
        if (this.growStep >= 1) {
            this.running = false;
        }
    }

    Hyphae.Leaf.prototype.drawStep = function() { 
        if (this.growStep < 1) {
            var ctx = this.hyphae.getLeafGrowingContext();
        }
        else {
            var ctx = this.hyphae.getLeafContext();
        }
        
        var scale = this.finalScale * this.growStep;
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.translate(this.startPoint.x, this.startPoint.y);
        ctx.rotate(this.orientation);
        ctx.scale(scale, scale);
        ctx.drawImage(this.img, -this.options.registration.x, -this.options.registration.y);
        ctx.restore();
    }
    
    var degToRadFactor = (Math.PI / 180);
    var radToDegFactor = (180 / Math.PI);
    var circleInRadians = Math.PI * 2;

    var distance = function(p1, p2) {
        var dx = p2.x - p1.x;
        var dy = p2.y - p1.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    var subtract = function(v1, v2) {
        return {
            x: v1.x - v2.x,
            y: v1.y - v2.y
        };
    };

    var add = function(v1, v2) {
        return {
            x: v1.x + v2.x,
            y: v1.y + v2.y
        };
    };

    var multiplyScalar = function(v, s) {
        return {
            x: v.x * s,
            y: v.y * s
        }
    };

    // weight is (x, y), each in range [0, 1]
    var randomVector = function(weight) {
        return {
            x: Math.random() * (Math.random() > .5 ? 1 : -1) * (weight ? (1 + weight.x) : 1),
            y: Math.random() * (Math.random() > .5 ? 1 : -1) * (weight ? (1 + weight.y) : 1)
        };
    };

    var normalize = function(v) {
        var l = Math.sqrt(v.x * v.x + v.y * v.y);
        return { 
            x: v.x / l, 
            y: v.y / l 
        };
    };

    var getMagnitude = function(v) {
        return Math.sqrt(v.x * v.x + v.y * v.y);
    };
    
    var pointInRect = function(point, rect) {
        return (point.x >= rect.x && point.x <= (rect.x + rect.width)) && (point.y >= rect.y && point.y <= (rect.y + rect.height));
    }
    
    var rotate = function(v, angle) {
        //if (angle > 0) {
            return { x: v.x * Math.cos(angle) + v.y * Math.sin(angle), y: -v.x * Math.sin(angle) + v.y * Math.cos(angle) };
        //}
        //else {
        //    return { x: v.x * Math.cos(angle) - v.y * Math.sin(angle), y: v.x * Math.sin(angle) + v.y * Math.cos(angle) };
        //}
    };
    
    /**
     * @param float angle The angle of the vector, in radians. 
     */
    var makeVector = function(angle, magnitude) {
        return {
            x: Math.cos(angle) * magnitude,
            y: Math.sin(angle) * magnitude
        };
    };

    var getAngleAndMagnitudeFromVector = function(v) {
        if (v.x == 0 && v.y == 0) {
            return {
                angle: 0,
                magnitude: 0
            };
        }
        return {
            angle: Math.atan2(v.y, v.x),
            magnitude: getMagnitude(v)
        };
    };


})(jQuery);
