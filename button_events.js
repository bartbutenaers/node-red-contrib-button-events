/**
 * Copyright 2020 Bart Butenaers
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/
 module.exports = function(RED) {
    var settings = RED.settings;
    const ButtonEvents = require('button-events');
    
    function handleEvent(node, eventType) {
        var outputMsg = {};
            
        try {
            RED.util.setMessageProperty(outputMsg, node.outputField, eventType);
        }
        catch (err) {
            node.error('Output property msg.' + node.outputField + ' cannot be set.');
            return;
        }
        
        node.send(outputMsg);
        
        node.status({fill:"blue", shape:"dot", text:eventType});
    }
    
    function ButtonEventsNode(config) {
        RED.nodes.createNode(this, config);
        this.inputField  = config.inputField;
        this.outputField = config.outputField;
        this.downValue   = config.downValue;
        this.upValue     = config.upValue;
        
        var node = this;
        
        // We act like there is no pull-up resister (in case of a GPIO input): see below for more info...
        const settings = {
		  usePullUp: false,
		  timing: {
			debounce: config.debounceInterval,
			pressed: config.pressedInterval,
			clicked: config.clickedInterval
		  }
		};

		node.buttonEvents = new ButtonEvents(settings);

        if (config.triggerPressed) {
            node.buttonEvents.on('pressed', function() {
                handleEvent(node, 'pressed');
            });
        }
        
        if (config.triggerClicked) {
            node.buttonEvents.on('clicked', function() {
                handleEvent(node, 'clicked');
            });
        }

        if (config.triggerClickedPressed) {
            node.buttonEvents.on('clicked_pressed', function() {
                handleEvent(node, 'clicked_pressed');
            });
        }

        if (config.triggerDoubleClicked) {
            node.buttonEvents.on('double_clicked', function() {
                handleEvent(node, 'double_clicked');
            });
        }

        if (config.triggerReleased) {
            node.buttonEvents.on('released', function() {
                handleEvent(node, 'released');
            });
        }

        if (config.buttonChanged) {
            node.buttonEvents.on('button_changed', function() {
                handleEvent(node, 'button_changed');
            });
        }  

        if (config.buttonPress) {
            node.buttonEvents.on('button_press', function() {
                handleEvent(node, 'button_press');
            });
        }   

        if (config.buttonRelease) {
            node.buttonEvents.on('button_release', function() {
                handleEvent(node, 'button_release');
            });
        }           

        node.on("input", function(msg) {  
            var inputValue;
            
            try {
                // Get the input value specified in the input message
                inputValue = RED.util.getMessageProperty(msg, node.inputField);
            }
            catch (err) {
                node.error('Input property msg.' + node.inputField + ' does not exist.');
                return;
            }
            
            // The button-events library always expects a 0 or 1 as input value, the button down/up values need to be mapped.
            // We have specified above that usePullUp=false, which means (similar to a pull-down resistor behaviour) that:
            // - A button down means that we measure a '1' (high signal)
            // - A button up means that we measure a '0' (low signal)
            if (inputValue == node.downValue) {
                inputValue = 1;
            }
            else if (inputValue == node.upValue) {
                inputValue = 0;
            }
            else {
                node.error('Input property msg.' + node.inputField + ' should contain the specified low or high value.');
                return;
            }
            
            node.buttonEvents.gpioChange(inputValue)
        });
      
        node.on("close",function() { 
            node.buttonEvents.cleanup();
            
            node.status({ });
        });
    }
    RED.nodes.registerType("button-events",ButtonEventsNode);
}
