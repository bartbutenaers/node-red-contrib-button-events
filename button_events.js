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
    
    function createEventHandler(node, outputIndex) {
        var eventType = node.events[outputIndex].type;
        
        node.buttonEvents.on(eventType, function() {
            var outputs = [];
 
            try {
                RED.util.setMessageProperty(node.lastMsg, node.outputField, eventType);
            }
            catch (err) {
                node.error('Output property msg.' + node.outputField + ' cannot be set.');
                return;
            }
            
            for(var i = 0; i < node.events.length; i++) {
                if (i === outputIndex) {
                    outputs.push(node.lastMsg);
                }
                else {
                    outputs.push(null);
                }
            }
            
            node.send(outputs);
            
            node.status({fill:"blue", shape:"dot", text:eventType});
        });
    }
    
    function ButtonEventsNode(config) {
        RED.nodes.createNode(this, config);
        this.inputField  = config.inputField;
        this.outputField = config.outputField;
        this.downValue   = config.downValue;
        this.upValue     = config.upValue;
        this.events      = config.events;
        this.lastMsg     = null;
        
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

        if (config.events) {
            // Add an event handler for every specified event
            for (var i = 0; i < config.events.length; i++) {
                // Create the event handler inside a function, otherwise all handlers will use the latest 'i' value.
                // See https://stackoverflow.com/questions/6487366/how-to-generate-event-handlers-with-loop-in-javascript
                createEventHandler(node, i);
            }
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
            
            // Analyze the input value
            var result = node.buttonEvents.gpioChange(inputValue)
            
            // Only remember the message when it has been used for the analysis.
            // For example during the debounce period, the values will be ignored...
            if (result === "accepted" || result === "final") {
                node.lastMsg = msg;
            }
        });
      
        node.on("close",function() { 
            node.buttonEvents.cleanup();
            
            node.status({ });
        });
    }
    RED.nodes.registerType("button-events",ButtonEventsNode);
}
